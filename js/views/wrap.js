/* views/wrap.js
   정리하기 화면 — 질문과 정리 글은 js/data/lesson-content.js 에서 고쳐요.
*/
/* ================= 화면: 정리하기 ================= */
function roundBars(){
  const rl = roundList(), vals = rl.map(roundTotal), max = Math.max(1, ...vals);
  return `<div class="bars">${rl.map((r, i) => `<div class="bar"><div class="lab">${roundInfo(r).t}<span>${roundInfo(r).s}</span></div>
    <div class="track"><div class="fill" style="width:${(vals[i] / max * 100).toFixed(1)}%"></div></div><div class="val">${vals[i]}점</div></div>`).join('')}</div>`;
}
function scoreTable(){
  const rows = NATIONS.map(n => {
    const tc = S.trades.filter(t => t.status === 'accepted' && (t.from === n.id || t.to === n.id)).length;
    return {n, s:roundList().map(r => score(n.id, r).total), tot:totalScore(n.id), tc, e:econ(n.id), gb:goalBonus(n.id), bd:badgesOf(n.id).length, tb:tradeBalance(n.id).bal, bl:BUILDINGS.filter(B => builtOf(n.id, B.id)).map(B => B.i).join(' ')};
  }).sort((a, b) => b.tot - a.tot);
  return `<div class="tablewrap"><table><thead><tr><th>나라</th>${roundList().map(r => `<th>${r}R</th>`).join('')}<th>합계</th><th>거래 수</th><th>주민</th><th>행복도</th><th>금</th><th>건물</th><th>목표</th><th>배지</th><th>무역 수지</th></tr></thead><tbody>
    ${rows.map(x => `<tr><td>${nTag(x.n.id)}</td>${x.s.map(v => `<td>${v}</td>`).join('')}<td class="tot">${x.tot}</td><td>${x.tc}</td><td>${x.e.res}명</td><td>${x.e.rate.face} ${x.e.hap}</td><td>${x.e.gold}</td><td>${x.bl || '-'}</td><td>${x.gb ? '✔' : '-'}</td><td>${x.bd}</td><td>${x.tb > 0 ? '+' + x.tb : x.tb}</td></tr>`).join('')}
  </tbody></table></div>`;
}
/* 계획서와 실제 무역 비교 */
function planCheck(nid){
  const p = planOf(nid); if (!p) return '<span class="muted small">계획서를 쓰지 않았어요</span>';
  const [kind, id] = p.target.split(':');
  const did = kind === 'item' ? S.makes.some(m => m.nation === nid && m.item === id) : !!builtOf(nid, id);
  const got = res => S.trades.some(t => t.status === 'accepted' && ((t.to === nid && t.from === p.from[res] && t.give[res]) || (t.from === nid && t.to === p.from[res] && t.get[res])));
  const rows = RK.filter(k => p.from[k]).map(k => `<span class="chip">${got(k) ? '✔' : '✘'} ${RES[k][1]} ← ${NI[p.from[k]].name}</span>`).join('');
  return `<span class="cost"><span class="chip">${did ? '✔' : '✘'} 목표: ${targetName(p.target)}</span>${rows}</span>`;
}
function villageHistory(nid){
  const e = econ(nid), rs = Object.entries(e.rounds);
  if (!rs.length) return '<span class="muted small">아직 기록이 없어요</span>';
  return `<span class="cost">${rs.map(([r, x]) => `<span class="chip">${r}R 주민 ${x.startRes}명 · 금 +${x.income} · 부탁 ${x.done}/${x.startRes}${x.ended ? ` · 행복도 ${x.endHap}${x.left ? ' · 1명 떠남' : ''}` : ''}</span>`).join('')}<span class="chip gold">지금 금 ${e.gold} · 행복도 ${e.hap} ${e.rate.face}</span></span>`;
}
function myRecord(){
  if (!S.me) return `<section class="card"><h3>우리 나라 기록</h3><p class="muted" style="margin-top:8px">무역 게임에서 나라를 고르면 우리 나라의 무역 기록이 여기에 나와요.</p></section>`;
  const me = S.me, acc = S.trades.filter(t => t.status === 'accepted' && (t.from === me || t.to === me));
  const out = zero(), inn = zero(), partners = {};
  for (const t of acc){ const o = t.from === me; add(out, o ? t.give : t.get); add(inn, o ? t.get : t.give); const p = o ? t.to : t.from; partners[p] = (partners[p] || 0) + 1; }
  const best = Object.entries(partners).sort((a, b) => b[1] - a[1])[0];
  const made = {}; for (const m of S.makes) if (m.nation === me) made[m.item] = (made[m.item] || 0) + 1;
  const madeHtml = Object.keys(made).length ? ITEMS.filter(it => made[it.id]).map(it => `<span class="chip">${it.i} ${it.name} ×${made[it.id]}</span>`).join('') : '<span class="muted small">없음</span>';
  return `<section class="card nc-${me}" style="display:grid;gap:12px">
    <div class="row" style="justify-content:space-between"><h3>${nTag(me)}의 무역 기록</h3><span class="pill acc">합계 ${totalScore(me)}점</span></div>
    <div class="kv"><b>점수</b><span>${roundList().map(r => `${r}라운드 ${score(me, r).total}점`).join(' · ')}</span>
    <b>거래</b><span>${acc.length}번 성공${best ? ` · 가장 많이 거래한 나라: ${NI[best[0]].name} (${best[1]}번)` : ''}</span>
    <b>수출</b><span class="cost">${bagChips(out)}</span>
    <b>수입</b><span class="cost">${bagChips(inn)}</span>
    <b>공정 무역</b><span>${(() => { const f = acc.map(fairOf); return `공정한 거래 ${f.filter(x => x.kind === 'fair').length}번 · 불공정한 거래 ${f.filter(x => x.kind === 'unfair').length}번`; })()}</span>
    <b>만든 물건</b><span class="cost">${madeHtml}</span>
    <b>지은 건물</b><span class="cost">${BUILDINGS.filter(B => builtOf(me, B.id)).map(B => `<span class="chip">${B.i} ${B.name}</span>`).join('') || '<span class="muted small">없음</span>'}</span>
    <b>계획</b><span>${planCheck(me)}</span>
    <b>마을</b><span>${villageHistory(me)}</span>
    <b>비밀 목표</b><span>${(() => { const p = goalProgress(me); return p ? `${esc(p.g.t)}: ${esc(p.g.text)} (${p.cur}/${p.need}) ${p.done ? '✔ +' + p.g.reward + '점' : '✘'}` : '-'; })()}</span>
    <b>배지</b><span class="cost">${badgeChips(me)}</span>
    <b>성찰</b><span>${Object.values(S.notes).filter(x => x.nation === me).sort((a, b) => a.r - b.r).map(x => `${x.r}R: ${esc(x.text)}`).join('<br>') || '<span class="muted small">없음</span>'}</span></div></section>`;
}
function viewWrap(){
  const r1 = roundTotal(1), r2 = roundTotal(2);
  const insight = r2 > r1 ? `무역을 한 2라운드에 모든 나라의 점수 합계가 ${r1}점에서 ${r2}점으로 늘었어요. 서로 필요한 자원을 바꾸니 모두 더 많은 물건을 만들 수 있었어요.` : '게임을 하면 라운드별 점수 합계가 여기에 나타나요.';
  return `<section class="card" style="display:grid;gap:14px">
    <h2>라운드별 모든 나라 점수 합계</h2>
    ${roundBars()}
    <p>${esc(insight)}</p></section>
  <section class="card" style="display:grid;gap:12px">${balanceHtml()}</section>
  ${myRecord()}
  <section class="card" style="display:grid;gap:12px"><h3>생각해 볼 질문</h3>
    <ol class="qs">${WRAP_QUESTIONS.map(q => `<li>${esc(q)}</li>`).join('')}
    </ol></section>
  <section class="card nc-gear" style="display:grid;gap:10px"><h3>실제 세계와 연결하기</h3>
    ${WRAP_REAL_WORLD.map(p => `<p>${p}</p>`).join('')}
    <div class="kv" style="margin-top:4px">${WRAP_SUMMARY.map((t, i) => `<b>정리 ${i + 1}</b><span>${esc(t)}</span>`).join('')}</div>
  </section>`;
}

