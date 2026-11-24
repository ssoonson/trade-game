/* state.js
   상태와 계산 — 지금 게임 상황(S), 내 캐릭터(P), 자원·점수 계산 함수를 모아 둔 곳이에요.
*/
/* ================= 자료에서 바로 만드는 목록 (고치지 않아도 돼요) ================= */
const RK = Object.keys(RES);
const NI = Object.fromEntries(NATIONS.map(n => [n.id, n]));
const II = Object.fromEntries(ITEMS.map(x => [x.id, x]));

/* ================= 상태 ================= */
const S = {
  mode:'connecting', loaded:false, slow:false, dbError:false,
  game:null, trades:[], makes:[],
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
const has = (bag, need) => RK.every(k => (bag[k] || 0) >= (need[k] || 0));
const total = b => RK.reduce((s, k) => s + (b[k] || 0), 0);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cleanNick = s => String(s || '').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, '').trim().slice(0, NICK_MAX);
function cleanBag(o){ const b = {}; if (o && typeof o === 'object') for (const k of RK){ const v = Math.floor(Number(o[k])); if (v > 0 && v <= 50) b[k] = v; } return b; }
const bagChips = (b, cls='') => RK.filter(k => b[k]).map(k => `<span class="chip ${cls}">${RES[k][1]} ${RES[k][0]} ×${b[k]}</span>`).join('') || '<span class="muted small">없음</span>';
const nTag = id => `<span class="nname nc-${id}">${NI[id].flag} ${NI[id].name}</span>`;

function cleanGame(d){
  if (!d || typeof d !== 'object') return null;
  const events = Array.isArray(d.events) ? d.events.filter(e => e && NI[e.nation] && (e.kind === 'block' || (e.kind === 'res' && RES[e.res])))
    .map(e => ({r:Number(e.r)||0, kind:e.kind, nation:e.nation, res:e.kind === 'res' ? e.res : null, n:Math.max(-20, Math.min(20, Math.floor(Number(e.n)||0))), pid:typeof e.pid === 'string' ? e.pid : '', key:typeof e.key === 'string' ? e.key : ''})) : [];
  return {gid:typeof d.gid === 'string' ? d.gid : null, round:[0,1,2,3].includes(d.round) ? d.round : 0, tradeOpen:!!d.tradeOpen,
    phase:['lobby','play','end'].includes(d.phase) ? d.phase : 'lobby', endsAt:Number(d.endsAt) || null, events};
}
function cleanTrade(id, d){
  if (!d || !NI[d.from] || !NI[d.to] || d.from === d.to) return null;
  return {id, r:Number(d.r)||0, from:d.from, to:d.to, give:cleanBag(d.give), get:cleanBag(d.get),
    status:['pending','accepted','rejected','cancelled'].includes(d.status) ? d.status : 'pending', at:Number(d.at)||0};
}
function cleanMake(id, d){
  if (!d || !NI[d.nation] || !II[d.item]) return null;
  return {id, r:Number(d.r)||0, nation:d.nation, item:d.item, at:Number(d.at)||0};
}

/* ================= 계산 ================= */
const round = () => S.game?.round || 0;
const blockedIn = r => new Set((S.game?.events || []).filter(e => e.r === r && e.kind === 'block').map(e => e.nation));
function inv(nid, r){
  const b = {...zero(), ...NI[nid].income};
  for (const e of S.game?.events || []) if (e.r === r && e.kind === 'res' && e.nation === nid) b[e.res] = Math.max(0, b[e.res] + e.n);
  for (const t of S.trades) if (t.r === r && t.status === 'accepted'){
    if (t.from === nid){ sub(b, t.give); add(b, t.get); }
    else if (t.to === nid){ add(b, t.give); sub(b, t.get); }
  }
  for (const m of S.makes) if (m.r === r && m.nation === nid) sub(b, II[m.item].cost);
  return b;
}
function locked(nid, r){ const b = zero(); for (const t of S.trades) if (t.r === r && t.status === 'pending' && t.from === nid) add(b, t.give); return b; }
function avail(nid, r){ const a = inv(nid, r), l = locked(nid, r); for (const k of RK) a[k] = Math.max(0, a[k] - l[k]); return a; }
function score(nid, r){
  const ms = S.makes.filter(m => m.r === r && m.nation === nid);
  const pts = ms.reduce((s, m) => s + II[m.item].pt, 0);
  const kinds = new Set(ms.map(m => m.item)).size;
  const bonus = kinds >= BONUS_KINDS ? BONUS : 0;
  return {pts, kinds, bonus, total:pts + bonus, count:ms.length};
}
const totalScore = nid => [1,2,3].reduce((s, r) => s + score(nid, r).total, 0);
const roundTotal = r => NATIONS.reduce((s, n) => s + score(n.id, r).total, 0);
const acceptedSorted = () => S.trades.filter(t => t.status === 'accepted').sort((a, b) => a.at - b.at);
function contractNo(t){ const i = acceptedSorted().findIndex(x => x.id === t.id); return i < 0 ? '' : `무역 계약서 No.${String(i + 1).padStart(3, '0')}`; }
function evInfo(e){
  const p = EVENTS.find(x => x.id === e.pid);
  if (p) return {t:p.t, text:p.text};
  return {t:'🧱 보호 무역', text:`${NI[e.nation].name}가 자기 나라 산업을 지키려고 이번 라운드 동안 다른 나라와의 거래를 막았어요. ${NI[e.nation].name}로 가는 다리도 닫혔어요.`};
}
const playing = () => S.game && S.game.phase === 'play' && round() >= 1;
const writable = () => S.canWrite !== false;
const gateOpen = nid => !!(S.game && S.game.phase === 'play' && S.game.tradeOpen && !blockedIn(round()).has(nid));
const incomingCount = () => S.me ? S.trades.filter(t => t.r === round() && t.to === S.me && t.status === 'pending').length : 0;

