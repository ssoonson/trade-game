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
