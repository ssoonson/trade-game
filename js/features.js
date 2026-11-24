/* features.js
   경제 개념을 체험하는 기능 모음 — 창고 크기, 시장 가격판, 무역 협정(FTA), 관세, 비밀 목표, 업적 배지, 선생님 문제.
   모두 저장된 기록에서 계산해요. 숫자와 문구는 js/data/game-data.js, js/data/lesson-content.js 에서 바꿔요.
*/

/* ---------- 창고 ---------- */
const storageLevel = (nid, r = round()) => Math.min(STORAGE.maxLevel, S.upgrades.filter(u => u.nation === nid && u.r <= r).length);
const storageCap = (nid, r = round()) => STORAGE.base + STORAGE.step * storageLevel(nid, r);
const storagePrice = nid => STORAGE.priceBase + STORAGE.priceStep * storageLevel(nid);
/* 받을 자원이 창고에 들어가는지 확인 */
function fitsStorage(nid, r, incoming){
  const a = inv(nid, r), cap = storageCap(nid, r);
  return RK.every(k => !(incoming[k] > 0) || (a[k] + incoming[k]) <= cap);
}

/* ---------- 무역 협정(FTA) ---------- */
function ftaBetween(a, b, at = Infinity){
  return S.ftas.some(f => f.status === 'accepted' && ((f.from === a && f.to === b) || (f.from === b && f.to === a)) && (f.doneAt || f.at) <= at);
}
const ftaPartners = nid => [...new Set(S.ftas.filter(f => f.status === 'accepted' && (f.from === nid || f.to === nid)).map(f => f.from === nid ? f.to : f.from))];

/* ---------- 관세 ---------- */
const tariffOf = (nid, r = round()) => (S.game?.events || []).filter(e => e.r === r && e.kind === 'tariff' && e.nation === nid).reduce((s, e) => s + Math.max(0, e.n), 0);
/* 거래 하나에서 누가 누구에게 관세를 내는지: 관세 나라로 자원을 보내는(수출하는) 쪽이 내요 */
function tariffsOf(t){
  const out = [];
  const check = (importer, exporter, goods) => {
    const n = tariffOf(importer, t.r);
    if (n > 0 && total(noGold(goods)) > 0 && !ftaBetween(importer, exporter, t.doneAt || Date.now())) out.push({payer:exporter, to:importer, n});
  };
  check(t.to, t.from, t.give);   // from 이 to 에게 보내는 물건
  check(t.from, t.to, t.get);    // to 가 from 에게 보내는 물건
  return out;
}

/* ---------- 시장 가격판 ---------- */
function marketBoard(r = round()){
  const rows = {};
  for (const k of RK){
    let supply = 0, demand = 0;
    for (const n of NATIONS){
      supply += avail(n.id, r)[k] || 0;
      questsOf(n.id, r).forEach((q, i) => { if (!questDone(n.id, r, i)) demand += q.cost[k] || 0; });
      const p = planOf(n.id); if (p) demand += (planNeeds2(n.id, p.target)[k] || 0);
    }
    const ratio = (demand + 2) / (supply / 4 + 2);
    const ref = Math.max(1, Math.min(BASE_PRICE[k] * 3, Math.round(BASE_PRICE[k] * ratio)));
    rows[k] = {supply, demand, ref, base:BASE_PRICE[k], deals:0, last:null, avg:null};
  }
  // 실제로 금을 주고받은 거래에서 1개당 값을 구해요
  const sums = {};
  for (const t of S.trades.filter(t => t.status === 'accepted').sort((a, b) => (a.doneAt || a.at) - (b.doneAt || b.at))){
    const sides = [[t.give, t.get], [t.get, t.give]];
    for (const [goods, pay] of sides){
      const units = total(noGold(goods)), gold = pay.gold || 0;
      if (!units || !gold || total(noGold(pay))) continue;
      for (const k of RK) if (goods[k]){
        const unit = gold / units;
        rows[k].deals += 1; rows[k].last = Math.round(unit * 10) / 10;
        sums[k] = (sums[k] || 0) + unit;
      }
    }
  }
  for (const k of RK) if (rows[k].deals) rows[k].avg = Math.round(sums[k] / rows[k].deals * 10) / 10;
  return rows;
}
function planNeeds2(nid, t){ const c = targetCost(t), a = avail(nid, round()), need = {}; for (const k of RK) if ((c[k] || 0) > (a[k] || 0)) need[k] = c[k] - (a[k] || 0); return need; }

/* ---------- 비밀 목표 ---------- */
function goalOf(nid){
  const gid = S.game?.gid; if (!gid) return null;
  const R = seeded(hashStr('goal|' + gid)), order = GOALS.map((g, i) => ({g, k:R()})).sort((a, b) => a.k - b.k).map(x => x.g);
  return order[NI[nid].idx % order.length];
}
function goalProgress(nid){
  const g = goalOf(nid); if (!g) return null;
  const acc = S.trades.filter(t => t.status === 'accepted' && (t.from === nid || t.to === nid));
  let cur = 0, need = 1;
  switch (g.id){
    case 'export10': need = 10; cur = acc.reduce((s, t) => s + total(noGold(t.from === nid ? t.give : t.get)), 0); break;
    case 'res6': need = 6; cur = econ(nid).res; break;
    case 'happy85': need = 85; cur = econ(nid).hap; break;
    case 'build2': need = 2; cur = S.builds.filter(x => x.nation === nid).length; break;
    case 'partners4': need = 4; cur = new Set(acc.map(t => t.from === nid ? t.to : t.from)).size; break;
    case 'items5': need = 5; cur = new Set(S.makes.filter(m => m.nation === nid).map(m => m.item)).size; break;
    case 'gold25': need = 25; cur = econ(nid).gold; break;
  }
  return {g, cur:Math.min(cur, need), need, done:cur >= need};
}
const goalBonus = nid => { const p = goalProgress(nid); return p && p.done ? p.g.reward : 0; };

/* ---------- 업적 배지 ---------- */
const BADGES = [
  {id:'first',    i:'🤝', t:'첫 무역 계약',   text:'거래를 처음으로 성공했어요',        test:n => S.trades.some(t => t.status === 'accepted' && (t.from === n || t.to === n))},
  {id:'five',     i:'🌏', t:'세계 무역왕',    text:'다섯 나라 모두와 거래했어요',        test:n => new Set(S.trades.filter(t => t.status === 'accepted' && (t.from === n || t.to === n)).map(t => t.from === n ? t.to : t.from)).size >= 5},
  {id:'helper',   i:'💗', t:'부탁 해결사',    text:'주민 부탁을 8개 들어줬어요',          test:n => S.qdone.filter(q => q.nation === n).length >= 8},
  {id:'builder',  i:'🏗️', t:'나라 건축가',    text:'건물을 3개 모두 지었어요',            test:n => S.builds.filter(x => x.nation === n).length >= BUILDINGS.length},
  {id:'fta',      i:'📜', t:'협정 외교관',    text:'무역 협정을 맺었어요',                test:n => ftaPartners(n).length >= 1},
  {id:'rich',     i:'💰', t:'부자 나라',      text:'금을 30개 모았어요',                  test:n => econ(n).gold >= 30},
  {id:'crisis',   i:'🛡️', t:'위기 극복',      text:'사건이 일어난 라운드에도 행복도 70 이상을 지켰어요', test:n => { const e = econ(n); return Object.entries(e.rounds).some(([r, x]) => x.ended && (S.game?.events || []).some(ev => ev.r === Number(r)) && x.endHap >= 70); }},
  {id:'planner',  i:'📝', t:'계획대로',       text:'무역 계획서의 목표를 이뤘어요',       test:n => { const p = planOf(n); if (!p) return false; const [k, id] = p.target.split(':'); return k === 'item' ? S.makes.some(m => m.nation === n && m.item === id) : !!builtOf(n, id); }},
  {id:'fair',     i:'⚖️', t:'공정 무역가',    text:'공정한 거래를 3번 했어요',            test:n => S.trades.filter(t => t.status === 'accepted' && (t.from === n || t.to === n) && fairOf(t).kind === 'fair').length >= 3},
  {id:'quiz',     i:'🎓', t:'척척박사',       text:'선생님 문제를 3번 맞혔어요',          test:n => S.answers.filter(a => a.nation === n && a.ok).length >= 3},
];
const badgesOf = nid => BADGES.filter(b => { try { return b.test(nid); } catch { return false; } });
const badgeChips = nid => badgesOf(nid).map(b => `<span class="chip badge" title="${esc(b.text)}">${b.i} ${esc(b.t)}</span>`).join('') || '<span class="muted small">아직 없어요</span>';

/* ---------- 선생님 문제 ---------- */
function quizBonus(nid, r){
  let n = 0; const byQ = {};
  for (const a of S.answers) if (a.nation === nid && a.r === r && a.ok){ byQ[a.qid] = (byQ[a.qid] || 0) + 1; }
  for (const q in byQ) n += Math.min(QUIZ_REWARD.maxPerNation, byQ[q]) * QUIZ_REWARD.perAnswer;
  return n;
}
const quizAnsweredHere = qid => { try { return localStorage.getItem('trade-quiz:' + qid) !== null; } catch { return false; } };
const quizOpen = () => { const q = S.game?.quiz; return q && q.open && q.r === round() && S.game.phase === 'play' ? q : null; };

/* ---------- 환율 ---------- */
const fxOf = (nid, r = round()) => Math.max(-1, Math.min(1, (S.game?.events || []).filter(e => e.r === r && e.kind === 'fx' && e.nation === nid).reduce((s, e) => s + Math.sign(e.n), 0)));
/* 거래 하나로 nid 나라가 환율 때문에 얻거나 잃는 금 */
function fxGold(t, nid){
  if (t.from !== nid && t.to !== nid) return 0;
  const fx = fxOf(nid, t.r); if (!fx) return 0;
  const out = total(noGold(t.from === nid ? t.give : t.get)) > 0, inn = total(noGold(t.from === nid ? t.get : t.give)) > 0;
  return fx * ((inn ? FX.gold : 0) - (out ? FX.gold : 0));
}

/* ---------- 공정 무역 ---------- */
const bagValue = b => RK.reduce((s, k) => s + (b[k] || 0) * BASE_PRICE[k], 0) + (b.gold || 0);
/* from 이 주는 값(a)과 to 가 주는 값(b)을 비교해요 */
function fairOf(t){
  const a = bagValue(t.give), b = bagValue(t.get), hi = Math.max(a, b), lo = Math.min(a, b);
  if (!hi) return {kind:'none', a, b};
  if (hi <= lo * FAIR.fairWithin || hi - lo <= 1) return {kind:'fair', a, b};
  if (hi >= lo * FAIR.unfairRatio && hi - lo >= FAIR.unfairGap) return {kind:'unfair', a, b, winner:a > b ? t.to : t.from, loser:a > b ? t.from : t.to};
  return {kind:'ok', a, b};
}
/* 거래 창·제안 창에 보여 줄 공정 무역 막대 (me 기준: 우리가 주는 값 ↔ 받는 값) */
function fairMeter(give, get){
  const a = bagValue(give), b = bagValue(get);
  if (!a && !b) return '';
  const f = fairOf({give, get, from:'me', to:'them'});
  const msg = f.kind === 'fair' ? `<b style="color:var(--green-ink)">⚖️ 공정한 거래예요</b> · 두 나라 모두 점수 +${FAIR.point}`
    : f.kind === 'unfair' ? (f.loser === 'me' ? `<b style="color:var(--bad)">⚠️ 우리에게 너무 불리해요</b> · 받으면 우리 주민 행복도 -${FAIR.hapDown}` : `<b style="color:var(--bad)">⚠️ 상대에게 너무 불리해요</b> · 이득 본 우리 나라 점수 -${FAIR.point}, 상대 주민 행복도 -${FAIR.hapDown}`)
    : (!a || !b) ? '' : '<b>조금 기울었지만 괜찮아요</b>';
  const pa = Math.round(a / Math.max(1, a + b) * 100);
  return `<div class="fair"><div class="fairbar"><i style="width:${pa}%"></i></div><span class="small">우리가 주는 값 🪙${a} ⇄ 받는 값 🪙${b} (기본 시세 기준) ${msg}</span></div>`;
}

/* ---------- 무역 수지 ---------- */
function tradeBalance(nid){
  let expU = 0, impU = 0, expV = 0, impV = 0;
  for (const t of S.trades) if (t.status === 'accepted' && (t.from === nid || t.to === nid)){
    const out = noGold(t.from === nid ? t.give : t.get), inn = noGold(t.from === nid ? t.get : t.give);
    expU += total(out); impU += total(inn); expV += bagValue(out); impV += bagValue(inn);
  }
  return {expU, impU, expV, impV, bal:expV - impV};
}
function balanceHtml(){
  const rows = NATIONS.map(n => ({n, ...tradeBalance(n.id)})), max = Math.max(1, ...rows.map(x => Math.max(x.expV, x.impV)));
  return `<div class="sect"><span class="label">⚖️ 무역 수지판 · 수출한 값 − 수입한 값 (기본 시세 기준)</span>
    <div class="baltable">${rows.map(x => `<div class="balrow"><span class="nm">${nTag(x.n.id)}</span>
      <span class="bars2"><span class="half l"><span class="b imp" style="width:${(x.impV / max * 100).toFixed(1)}%" title="수입 ${x.impV}"></span></span><span class="mid"></span><span class="half"><span class="b exp" style="width:${(x.expV / max * 100).toFixed(1)}%" title="수출 ${x.expV}"></span></span></span>
      <span class="small"><span class="pill ${x.bal > 0 ? 'ok' : x.bal < 0 ? 'bad' : ''}">${x.bal > 0 ? '흑자 +' + x.bal : x.bal < 0 ? '적자 ' + x.bal : '균형 0'}</span> 수출 ${x.expU}개(🪙${x.expV}) · 수입 ${x.impU}개(🪙${x.impV})</span></div>`).join('')}</div>
    <p class="small muted">왼쪽 빨간 막대는 수입, 오른쪽 초록 막대는 수출이에요. 수출이 더 많으면 흑자, 수입이 더 많으면 적자예요. 적자라고 꼭 나쁜 건 아니에요. 필요한 것을 사 와서 물건을 많이 만들었을 수도 있어요.</p></div>`;
}

/* ---------- 자동 뉴스 속보 ---------- */
function autoNewsPick(gid, r){
  const R = seeded(hashStr('news|' + gid + '|' + r));
  const delay = (AUTO_NEWS.minSec + Math.floor(R() * (AUTO_NEWS.maxSec - AUTO_NEWS.minSec + 1))) * 1000;
  const pool = [...EVENTS.filter(e => e.kind === 'res'), ...GOOD_NEWS, ...NATIONS.flatMap(n => [{fx:1, nation:n.id}, {fx:-1, nation:n.id}])];
  return {delay, p:pool[Math.floor(R() * pool.length)]};
}
/* 선생님 기기에서 1초마다 확인해요 */
function autoNewsTick(){
  const g = S.game; if (!S.canTeach || !g || !g.news || g.phase !== 'play' || g.paused || !g.startedAt || S.busy || !store) return;
  const r = round(), key = 'auto-' + g.gid + '-' + r;
  if ((g.events || []).some(e => e.key === key)) return;
  const {delay, p} = autoNewsPick(g.gid, r);
  if (Date.now() + (S.offset || 0) < g.startedAt + delay) return;
  const ev = p.fx ? {r, kind:'fx', nation:p.nation, res:null, n:p.fx, pid:'', key, auto:true} : {r, kind:p.kind, nation:p.nation, res:p.res || null, n:p.n || 0, pid:p.id, key, auto:true};
  setGame({events:[...(g.events || []), ev]});
}
const nextNewsIn = () => { const g = S.game; if (!g?.news || !g.startedAt || g.phase !== 'play') return null; const key = 'auto-' + g.gid + '-' + round(); if ((g.events || []).some(e => e.key === key)) return 0; return Math.max(0, Math.round((g.startedAt + autoNewsPick(g.gid, round()).delay - Date.now() - (S.offset || 0)) / 1000)); };

/* ---------- 모둠 역할 ---------- */
function teamRoles(nid){
  const out = {}; for (const pr of Object.values(S.players || {})) if (pr && pr.n === nid && RO[pr.ro]) (out[pr.ro] = out[pr.ro] || []).push(pr.nm || '친구');
  if (S.me === nid && S.role && S.mode !== 'shared') (out[S.role] = out[S.role] || []).push(S.nick || '나');
  return out;
}
