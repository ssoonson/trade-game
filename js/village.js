/* village.js
   마을 — 나라별 주민, 행복도, 금, 주민 부탁(퀘스트)을 계산하고 지도에 주민을 그려요.
   숫자는 따로 저장하지 않고 "부탁을 들어준 기록 · 주민을 데려온 기록 · 거래 기록"으로부터 매번 계산해요.
   그래서 여러 기기가 동시에 눌러도 금이나 행복도가 어긋나지 않아요.
   규칙 숫자는 js/data/game-data.js 의 VILLAGE, GOLD_RATE 에서 바꿔요.
*/
const goldRate = hap => GOLD_RATE.find(g => hap >= g.min) || GOLD_RATE[GOLD_RATE.length - 1];
function hashStr(s){ let h = 2166136261; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function seeded(seed){ let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* 주민 부탁: 게임·라운드·나라가 같으면 어느 기기에서나 똑같이 만들어져요 */
const questCache = new Map();
function questsOf(nid, r){
  const gid = S.game?.gid || 'none', count = residentsAtStart(nid, r);
  const key = gid + '|' + nid + '|' + r + '|' + count;
  if (questCache.has(key)) return questCache.get(key);
  const R = seeded(hashStr(key)), n = NI[nid], out = []; let budget = {};
  for (let slot = 0; slot < count; slot++){
    if (r === 1){
      // 1라운드는 무역이 닫혀 있어요. 부탁을 모두 합쳐도 우리 나라 자원만으로 들어줄 수 있게 해요
      if (slot === 0) budget = {...n.income};
      const it = slot === 0 ? ITEMS.find(x => has(budget, x.cost)) : null;
      if (it){ sub(budget, it.cost); out.push({slot, kind:'craft', item:it.id, cost:{...it.cost}, text:`공장에서 ${it.i} ${it.name}을(를) 만들어 주세요!`}); }
      else {
        const ks = RK.filter(k => (budget[k] || 0) >= 1), k = ks.includes(n.spec) ? n.spec : (ks[Math.floor(R() * ks.length)] || n.spec);
        budget[k] = (budget[k] || 0) - 1;
        out.push({slot, kind:'local', res:k, cost:{[k]:1}, text:`우리 나라 ${RES[k][1]} ${RES[k][0]} 1개를 나눠 주세요!`});
      }
      continue;
    }
    if (R() < .5){
      const it = ITEMS[Math.floor(R() * ITEMS.length)];
      out.push({slot, kind:'craft', item:it.id, cost:{...it.cost}, text:`공장에서 ${it.i} ${it.name}을(를) 만들어 주세요!`});
    } else {
      const cands = RK.filter(k => k !== n.spec && !((n.income[k] || 0) >= 2));
      const k = cands[Math.floor(R() * cands.length)], q = 2 + Math.floor(R() * 2);
      const from = NATIONS.find(x => x.spec === k);
      out.push({slot, kind:'import', res:k, cost:{[k]:q}, text:`${RES[k][1]} ${RES[k][0]} ${q}개가 필요해요. ${from ? from.name + '처럼 ' : ''}다른 나라에서 구해 주세요!`});
    }
  }
  questCache.set(key, out);
  return out;
}
const questDoneIn = (nid, r) => {
  const seen = new Set(), out = [];
  for (const q of S.qdone) if (q.nation === nid && q.r === r && !seen.has(q.slot)){ seen.add(q.slot); out.push(q); }
  return out;
};
const questDone = (nid, r, slot) => S.qdone.some(q => q.nation === nid && q.r === r && q.slot === slot);
const hirePrice = count => VILLAGE.hireBase + VILLAGE.hireStep * Math.max(0, count - VILLAGE.residentsStart);

/* 라운드마다 주민·행복도·금을 차례로 계산해요 (화면을 그릴 때마다 한 번만) */
let econMemo = {rev:-1, data:{}};
function econ(nid){
  if (econMemo.rev !== S.rev){ econMemo = {rev:S.rev, data:{}}; }
  if (econMemo.data[nid]) return econMemo.data[nid];
  const cur = round(), ended = r => r < cur || (S.game?.phase === 'end' && r <= cur);
  let res = VILLAGE.residentsStart, hap = VILLAGE.happyStart, gold = VILLAGE.goldStart;
  const rounds = {};
  for (let r = 1; r <= cur; r++){
    const startRes = res, startHap = hap, rate = goldRate(hap); let unfairHits = 0;
    const income = startRes * rate.gold; gold += income;
    const done = questDoneIn(nid, r);
    hap = Math.min(100, hap + done.length * VILLAGE.questUp); gold += done.length * VILLAGE.questGold;
    for (const h of S.hires) if (h.nation === nid && h.r === r){ gold -= hirePrice(res); res = Math.min(VILLAGE.residentsMax, res + 1); }
    for (const t of S.trades) if (t.r === r && t.status === 'accepted'){
      if (t.from === nid) gold += (t.get.gold || 0) - (t.give.gold || 0);
      else if (t.to === nid) gold += (t.give.gold || 0) - (t.get.gold || 0);
      for (const x of tariffsOf(t)){ if (x.payer === nid) gold -= x.n; if (x.to === nid) gold += x.n; }
      if (t.from === nid || t.to === nid){ gold += fxGold(t, nid); const f = fairOf(t); if (f.kind === 'unfair' && f.loser === nid){ hap = Math.max(0, hap - FAIR.hapDown); unfairHits++; } }
    }
    for (const u of S.upgrades) if (u.nation === nid && u.r === r){ const lv = S.upgrades.filter(v => v.nation === nid && v.at < u.at).length; if (lv < STORAGE.maxLevel) gold -= STORAGE.priceBase + STORAGE.priceStep * lv; }
    let unresolved = 0, left = false, drop = 0;
    if (ended(r)){
      unresolved = Math.max(0, startRes - done.length);
      drop = unresolved * VILLAGE.questDown; hap = Math.max(0, hap - drop);
      if (hap < VILLAGE.leaveBelow && res > 1){ res -= 1; left = true; }
    }
    rounds[r] = {startRes, startHap, income, rate, done:done.length, unfairHits, unresolved, drop, left, endRes:res, endHap:hap, ended:ended(r)};
  }
  return (econMemo.data[nid] = {res, hap, gold:Math.max(0, gold), rounds, rate:goldRate(hap)});
}
function residentsAtStart(nid, r){
  // 라운드 r 이 시작될 때 주민 수 (부탁 개수와 같아요)
  const er = econ(nid).rounds[r]; if (er) return er.startRes;
  let res = VILLAGE.residentsStart, hap = VILLAGE.happyStart;
  for (let k = 1; k < r; k++){
    const done = new Set(S.qdone.filter(q => q.nation === nid && q.r === k).map(q => q.slot)).size;
    const start = res;
    hap = Math.min(100, hap + done * VILLAGE.questUp);
    for (const h of S.hires) if (h.nation === nid && h.r === k) res = Math.min(VILLAGE.residentsMax, res + 1);
    hap = Math.max(0, hap - Math.max(0, start - done) * VILLAGE.questDown);
    if (hap < VILLAGE.leaveBelow && res > 1) res -= 1;
  }
  return res;
}
function goldAvail(nid){
  let g = econ(nid).gold;
  for (const t of S.trades) if (t.r === round() && t.status === 'pending' && t.from === nid) g -= (t.give.gold || 0);
  return Math.max(0, g);
}

/* 지도 위 주민 위치 (섬 안쪽 기준 칸 좌표) */
const RESIDENT_SPOTS = [[3.8, 6.6], [8.4, 6.6], [4.6, 8.7], [7.9, 8.7], [3.3, 2.5], [9.2, 2.4], [10.8, 7.2], [1.3, 6.2]];
function residentPos(n, i, t){
  const [ox, oy] = RESIDENT_SPOTS[i % RESIDENT_SPOTS.length];
  const ph = t * .45 + i * 1.7 + n.idx, dx = Math.sin(ph) * .55;
  return {x:n.rx + ox + dx, y:n.ry + oy, dir:Math.cos(ph) > 0 ? 'right' : 'left', moving:Math.abs(Math.cos(ph)) > .35};
}
function drawResidents(g, t){
  const r = round(), live = S.game?.phase === 'play' && r >= 1;
  for (const n of NATIONS){
    const e = econ(n.id), qs = live ? questsOf(n.id, r) : [];
    for (let i = 0; i < e.res; i++){
      const p = residentPos(n, i, t);
      drawChar(g, p.x, p.y, n, '', p.dir, p.moving, t, false, .62, 'res-' + n.id + i);
      const bx = p.x * T, by = p.y * T - 42;
      const q = qs[i];
      if (!q) continue;
      const done = questDone(n.id, r, i);
      g.save(); g.fillStyle = done ? '#ff8fa3' : '#ffd447'; g.strokeStyle = '#4b3424'; g.lineWidth = 2;
      g.beginPath(); g.arc(bx, by + Math.sin(t * 4 + i) * 2, 8, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#4b3424'; g.font = 'bold 12px "Noto Sans KR", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(done ? '♥' : '!', bx, by + 1 + Math.sin(t * 4 + i) * 2); g.restore();
    }
  }
}
function nearResident(nid, t){
  const n = NI[nid], e = econ(nid); let best = -1, bd = 1.3;
  for (let i = 0; i < e.res; i++){ const p = residentPos(n, i, t); const d = Math.hypot(P.x - p.x, P.y - p.y); if (d < bd){ bd = d; best = i; } }
  return best;
}
