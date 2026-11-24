/* views/wrap.js
   정리하기 화면 — 질문과 정리 글은 js/data/lesson-content.js 에서 고쳐요.
*/
/* ================= 화면: 정리하기 ================= */
function roundBars(){
  const vals = [1,2,3].map(roundTotal), max = Math.max(1, ...vals);
  return `<div class="bars">${[1,2,3].map((r, i) => `<div class="bar"><div class="lab">${ROUNDS[r].t}<span>${ROUNDS[r].s}</span></div>
    <div class="track"><div class="fill" style="width:${(vals[i] / max * 100).toFixed(1)}%"></div></div><div class="val">${vals[i]}점</div></div>`).join('')}</div>`;
}
function scoreTable(){
  const rows = NATIONS.map(n => {
    const tc = S.trades.filter(t => t.status === 'accepted' && (t.from === n.id || t.to === n.id)).length;
    return {n, s:[1,2,3].map(r => score(n.id, r).total), tot:totalScore(n.id), tc};
  }).sort((a, b) => b.tot - a.tot);
  return `<div class="tablewrap"><table><thead><tr><th>나라</th><th>1라운드</th><th>2라운드</th><th>3라운드</th><th>합계</th><th>거래 수</th></tr></thead><tbody>
    ${rows.map(x => `<tr><td>${nTag(x.n.id)}</td>${x.s.map(v => `<td>${v}</td>`).join('')}<td class="tot">${x.tot}</td><td>${x.tc}</td></tr>`).join('')}
  </tbody></table></div>`;
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
    <div class="kv"><b>점수</b><span>${[1,2,3].map(r => `${r}라운드 ${score(me, r).total}점`).join(' · ')}</span>
    <b>거래</b><span>${acc.length}번 성공${best ? ` · 가장 많이 거래한 나라: ${NI[best[0]].name} (${best[1]}번)` : ''}</span>
    <b>수출</b><span class="cost">${bagChips(out)}</span>
    <b>수입</b><span class="cost">${bagChips(inn)}</span>
    <b>만든 물건</b><span class="cost">${madeHtml}</span></div></section>`;
}
function viewWrap(){
  const r1 = roundTotal(1), r2 = roundTotal(2);
  const insight = r2 > r1 ? `무역을 한 2라운드에 모든 나라의 점수 합계가 ${r1}점에서 ${r2}점으로 늘었어요. 서로 필요한 자원을 바꾸니 모두 더 많은 물건을 만들 수 있었어요.` : '게임을 하면 라운드별 점수 합계가 여기에 나타나요.';
  return `<section class="card" style="display:grid;gap:14px">
    <h2>라운드별 모든 나라 점수 합계</h2>
    ${roundBars()}
    <p>${esc(insight)}</p></section>
  ${myRecord()}
  <section class="card" style="display:grid;gap:12px"><h3>생각해 볼 질문</h3>
    <ol class="qs">${WRAP_QUESTIONS.map(q => `<li>${esc(q)}</li>`).join('')}
    </ol></section>
  <section class="card nc-gear" style="display:grid;gap:10px"><h3>실제 세계와 연결하기</h3>
    ${WRAP_REAL_WORLD.map(p => `<p>${p}</p>`).join('')}
    <div class="kv" style="margin-top:4px">${WRAP_SUMMARY.map((t, i) => `<b>정리 ${i + 1}</b><span>${esc(t)}</span>`).join('')}</div>
  </section>`;
}

