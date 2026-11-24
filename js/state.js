/* state.js
   상태와 계산 — 지금 게임 상황(S), 내 캐릭터(P), 자원·점수 계산 함수를 모아 둔 곳이에요.
*/
/* ================= 자료에서 바로 만드는 목록 (고치지 않아도 돼요) ================= */
const RK = Object.keys(RES);
const NI = Object.fromEntries(NATIONS.map(n => [n.id, n]));
const II = Object.fromEntries(ITEMS.map(x => [x.id, x]));
const BI = Object.fromEntries(BUILDINGS.map(x => [x.id, x]));

/* ================= 상태 ================= */
const S = {
  mode:'connecting', loaded:false, slow:false, dbError:false,
  game:null, trades:[], makes:[], builds:[], plans:{}, planDraft:null, qdone:[], hires:[], ftas:[], upgrades:[], answers:[], notes:{}, rev:0, summaryShown:'',
  me:null, nick:'', view:'game', canTeach:false, canWrite:null, busy:false,
  draft:{to:'', give:{}, get:{}}, blockPick:'field', confirmReset:false,
  sheet:null, picker:false, players:{}, online:null, offset:0, join:null, fbError:false, setupMsg:'', setupBusy:false, pickSel:null, near:null, seenEvents:new Set(), banner:null,
};
try { const m = localStorage.getItem('trade-me'); if (NI[m]) S.me = m; S.nick = (localStorage.getItem('trade-nick') || '').slice(0, NICK_MAX); } catch {}
const P = {x:0, y:0, dir:'down', moving:false, target:null, t:0};
function goHome(){ if (S.me){ const h = NI[S.me].home; P.x = h.x; P.y = h.y; P.dir = 'down'; P.target = null; } }
goHome();

/* ================= 도우미 ================= */
const $ = s => document.querySelector(s);
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const zero = () => Object.fromEntries(RK.map(k => [k, 0]));
const add = (b, x) => { for (const k in x) b[k] = (b[k] || 0) + x[k]; };
const sub = (b, x) => { for (const k in x) b[k] = (b[k] || 0) - x[k]; };
const BAGK = [...RK, 'gold'];   // 거래에 쓸 수 있는 것: 자원 + 금
const has = (bag, need) => RK.every(k => (bag[k] || 0) >= (need[k] || 0));
const total = b => BAGK.reduce((s, k) => s + (b[k] || 0), 0);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cleanNick = s => String(s || '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, '').trim().slice(0, NICK_MAX);
function cleanBag(o){ const b = {}; if (o && typeof o === 'object') for (const k of BAGK){ const v = Math.floor(Number(o[k])); if (v > 0 && v <= (k === 'gold' ? 200 : 50)) b[k] = v; } return b; }
const bagChips = (b, cls='') => BAGK.filter(k => b[k]).map(k => k === 'gold' ? `<span class="chip gold ${cls}">🪙 금 ×${b[k]}</span>` : `<span class="chip ${cls}">${RES[k][1]} ${RES[k][0]} ×${b[k]}</span>`).join('') || '<span class="muted small">없음</span>';
const noGold = b => { const c = {...b}; delete c.gold; return c; };
const nTag = id => `<span class="nname nc-${id}">${NI[id].flag} ${NI[id].name}</span>`;

function cleanGame(d){
  if (!d || typeof d !== 'object') return null;
  const events = Array.isArray(d.events) ? d.events.filter(e => e && NI[e.nation] && (e.kind === 'block' || e.kind === 'tariff' || (e.kind === 'res' && RES[e.res])))
    .map(e => ({r:Number(e.r)||0, kind:e.kind, nation:e.nation, res:e.kind === 'res' ? e.res : null, n:Math.max(-20, Math.min(20, Math.floor(Number(e.n)||0))), pid:typeof e.pid === 'string' ? e.pid : '', key:typeof e.key === 'string' ? e.key : ''})) : [];
  return {gid:typeof d.gid === 'string' ? d.gid : null, round:[0,1,2,3].includes(d.round) ? d.round : 0, tradeOpen:!!d.tradeOpen,
    phase:['lobby','play','end'].includes(d.phase) ? d.phase : 'lobby', endsAt:Number(d.endsAt) || null, events, quiz:cleanQuiz(d.quiz)};
}
function cleanQuiz(q){
  if (!q || typeof q !== 'object' || typeof q.q !== 'string' || !Array.isArray(q.o)) return null;
  const o = q.o.filter(x => typeof x === 'string').slice(0, 4).map(x => x.slice(0, 80)); const a = Math.floor(Number(q.a));
  if (o.length < 2 || !(a >= 0 && a < o.length) || typeof q.id !== 'string') return null;
  return {id:q.id.slice(0, 30), q:q.q.slice(0, 200), o, a, r:Number(q.r)||0, open:!!q.open};
}
function cleanTrade(id, d){
  if (!d || !NI[d.from] || !NI[d.to] || d.from === d.to) return null;
  return {id, r:Number(d.r)||0, from:d.from, to:d.to, give:cleanBag(d.give), get:cleanBag(d.get),
    status:['pending','accepted','rejected','cancelled'].includes(d.status) ? d.status : 'pending', at:Number(d.at)||0, doneAt:Number(d.doneAt)||0};
}
function cleanBuild(id, d){
  if (!d || !NI[d.nation] || !BI[d.b]) return null;
  return {id, r:Number(d.r)||0, nation:d.nation, b:d.b, at:Number(d.at)||0};
}
function cleanPlan(nid, d){
  if (!d || !NI[nid] || typeof d.target !== 'string') return null;
  const [kind, id] = d.target.split(':');
  if (!((kind === 'item' && II[id]) || (kind === 'build' && BI[id]))) return null;
  const from = {}; if (d.from && typeof d.from === 'object') for (const k of RK) if (NI[d.from[k]] && d.from[k] !== nid) from[k] = d.from[k];
  return {nation:nid, target:d.target, from, note:typeof d.note === 'string' ? d.note.slice(0, 80) : '', r:Number(d.r)||0, at:Number(d.at)||0};
}
function cleanQuestDone(id, d){
  if (!d || !NI[d.nation]) return null; const slot = Math.floor(Number(d.slot));
  if (!(slot >= 0 && slot < 20)) return null;
  return {id, r:Number(d.r)||0, nation:d.nation, slot, at:Number(d.at)||0};
}
function cleanFta(id, d){
  if (!d || !NI[d.from] || !NI[d.to] || d.from === d.to) return null;
  return {id, r:Number(d.r)||0, from:d.from, to:d.to, status:['pending','accepted','rejected','cancelled'].includes(d.status) ? d.status : 'pending', at:Number(d.at)||0, doneAt:Number(d.doneAt)||0};
}
function cleanUpgrade(id, d){ if (!d || !NI[d.nation]) return null; return {id, r:Number(d.r)||0, nation:d.nation, at:Number(d.at)||0}; }
function cleanAnswer(id, d){ if (!d || !NI[d.nation] || typeof d.qid !== 'string') return null; return {id, qid:d.qid, r:Number(d.r)||0, nation:d.nation, ok:!!d.ok, at:Number(d.at)||0}; }
function cleanNote(key, d){ if (!d || typeof d.text !== 'string') return null; const [nation, r] = key.split('_'); if (!NI[nation]) return null; return {nation, r:Number(r)||0, text:d.text.slice(0, 120)}; }
function cleanHire(id, d){ if (!d || !NI[d.nation]) return null; return {id, r:Number(d.r)||0, nation:d.nation, at:Number(d.at)||0}; }
function cleanMake(id, d){
  if (!d || !NI[d.nation] || !II[d.item]) return null;
  return {id, r:Number(d.r)||0, nation:d.nation, item:d.item, at:Number(d.at)||0};
}

/* ================= 계산 ================= */
const round = () => S.game?.round || 0;
const blockedIn = r => new Set((S.game?.events || []).filter(e => e.r === r && e.kind === 'block').map(e => e.nation));
function inv(nid, r){
  // 라운드 시작 자원 = 기본 + 사건 + 공장 확장 + 선생님 문제 보상 (창고 크기까지만)
  const b = {...zero(), ...NI[nid].income}, cap = storageCap(nid, r);
  for (const e of S.game?.events || []) if (e.r === r && e.kind === 'res' && e.nation === nid) b[e.res] = Math.max(0, b[e.res] + e.n);
  for (const x of S.builds) if (x.nation === nid && x.r < r && BI[x.b].effect === 'income') b[NI[nid].spec] += BI[x.b].n;
  b[NI[nid].spec] += quizBonus(nid, r);
  for (const k of RK) b[k] = Math.min(cap, b[k]);
  for (const t of S.trades) if (t.r === r && t.status === 'accepted'){
    if (t.from === nid){ sub(b, noGold(t.give)); add(b, noGold(t.get)); }
    else if (t.to === nid){ add(b, noGold(t.give)); sub(b, noGold(t.get)); }
  }
  for (const m of S.makes) if (m.r === r && m.nation === nid) sub(b, II[m.item].cost);
  for (const q of questDoneIn(nid, r)){ const def = questsOf(nid, r)[q.slot]; if (def) sub(b, def.cost); }
  for (const x of S.builds) if (x.nation === nid && x.r === r) sub(b, BI[x.b].cost);
  return b;
}
function locked(nid, r){ const b = zero(); for (const t of S.trades) if (t.r === r && t.status === 'pending' && t.from === nid) add(b, noGold(t.give)); return b; }
function avail(nid, r){ const a = inv(nid, r), l = locked(nid, r); for (const k of RK) a[k] = Math.max(0, a[k] - l[k]); return a; }
function score(nid, r){
  const ms = S.makes.filter(m => m.r === r && m.nation === nid);
  const pts = ms.reduce((s, m) => s + II[m.item].pt, 0);
  const kinds = new Set(ms.map(m => m.item)).size;
  const bonus = kinds >= BONUS_KINDS ? BONUS : 0;
  let dev = 0;
  for (const x of S.builds) if (x.nation === nid){
    const B = BI[x.b];
    if (x.r === r) dev += BUILD_PT;
    if (x.r > r) continue;
    if (B.effect === 'tech') dev += B.n * ms.filter(m => m.at > x.at).length;
    if (B.effect === 'port') dev += B.n * S.trades.filter(t => t.r === r && t.status === 'accepted' && (t.from === nid || t.to === nid) && (t.doneAt || t.at) > x.at).length;
  }
  const quest = questDoneIn(nid, r).length * VILLAGE.questPoint;
  const fta = S.trades.filter(t => t.r === r && t.status === 'accepted' && (t.from === nid || t.to === nid) && ftaBetween(t.from, t.to, t.doneAt || t.at)).length * FTA.bonus;
  return {pts, kinds, bonus, dev, quest, fta, total:pts + bonus + dev + quest + fta, count:ms.length};
}
const totalScore = nid => [1,2,3].reduce((s, r) => s + score(nid, r).total, 0) + goalBonus(nid);
const roundTotal = r => NATIONS.reduce((s, n) => s + score(n.id, r).total, 0);
const acceptedSorted = () => S.trades.filter(t => t.status === 'accepted').sort((a, b) => a.at - b.at);
function contractNo(t){ const i = acceptedSorted().findIndex(x => x.id === t.id); return i < 0 ? '' : `무역 계약서 No.${String(i + 1).padStart(3, '0')}`; }
function evInfo(e){
  const p = EVENTS.find(x => x.id === e.pid);
  if (p) return {t:p.t, text:p.text};
  if (e.kind === 'tariff') return {t:'🧾 관세', text:`${NI[e.nation].name}가 자기 나라 산업을 지키려고 수입품에 관세를 매겼어요. ${NI[e.nation].name}로 물건을 수출하면 거래 한 번에 금 ${e.n}개를 내야 해요. (무역 협정을 맺은 나라는 면제)`};
  return {t:'🧱 보호 무역', text:`${NI[e.nation].name}가 자기 나라 산업을 지키려고 이번 라운드 동안 다른 나라와의 거래를 막았어요. ${NI[e.nation].name}로 가는 다리도 닫혔어요.`};
}
const builtOf = (nid, bid) => S.builds.find(x => x.nation === nid && x.b === bid) || null;
const planOf = nid => S.plans[nid] || null;
/* 계획서 목표에 필요한 자원 */
const targetCost = t => { const [k, id] = (t || '').split(':'); return k === 'item' ? (II[id]?.cost || {}) : k === 'build' ? (BI[id]?.cost || {}) : {}; };
const targetName = t => { const [k, id] = (t || '').split(':'); return k === 'item' ? (II[id] ? `${II[id].i} ${II[id].name}` : '') : k === 'build' ? (BI[id] ? `${BI[id].i} ${BI[id].name}` : '') : ''; };
const playing = () => S.game && S.game.phase === 'play' && round() >= 1;
const writable = () => S.canWrite !== false;
const gateOpen = nid => !!(S.game && S.game.phase === 'play' && S.game.tradeOpen && !blockedIn(round()).has(nid));
const incomingCount = () => S.me ? S.trades.filter(t => t.r === round() && t.to === S.me && t.status === 'pending').length : 0;

