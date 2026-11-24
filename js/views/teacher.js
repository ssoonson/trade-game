/* views/teacher.js
   선생님 화면 — 실시간 지도, 라운드 진행, 사건 카드, 점수판.
*/
/* ================= 화면: 선생님 ================= */
function mountTeacher(){
  if (!S.canTeach) return teacherLoginHtml();
  return `<section class="card" style="display:grid;gap:12px">
    <div class="row" style="justify-content:space-between"><div><h2>실시간 무역 지도</h2><p class="sub">전자칠판에 띄워 반 전체와 함께 보세요</p></div><div class="counts" id="tcounts"></div></div>
    <div class="tmapbox"><canvas id="tmap" aria-label="모든 학생의 위치가 보이는 전체 지도"></canvas></div>
  </section>${shareCard()}<div id="tbody" style="display:grid;gap:20px"></div>`;
}
function updateTeacher(){
  const body = $('#tbody'); if (!body) return;
  const g = S.game, r = round(), ok = !S.busy;
  const playingNow = g && g.phase === 'play';
  updateTeacherCounts(); updateShare();
  const rbtn = n => `<button class="rbtn ${playingNow && r === n ? 'now' : ''}" data-act="round" data-r="${n}" ${ok ? '' : 'disabled'}><span><b>${ROUNDS[n].t}</b><br><span class="small muted">${ROUNDS[n].s}</span></span><span class="small">${playingNow && r === n ? '진행 중' : '시작'}</span></button>`;
  const evNow = (g?.events || []).filter(e => e.r === r);
  const evList = evNow.length ? evNow.map(e => { const x = evInfo(e); return `<div class="row" style="justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--surface-2)"><span><b>${esc(x.t)}</b> <span class="small">${nTag(e.nation)}</span></span><button class="btn ghost sm" data-act="unevent" data-key="${esc(e.key)}" ${ok ? '' : 'disabled'}>취소</button></div>`; }).join('') : '<p class="muted small">이번 라운드에 발동한 사건이 없어요.</p>';
  const feed = acceptedSorted().slice(-8).reverse();
  const feedHtml = feed.length ? `<div class="history">${feed.map(t => `<div class="h"><span class="contract">${contractNo(t)}</span>${nTag(t.from)} ${bagChips(t.give)} ⇄ ${nTag(t.to)} ${bagChips(t.get)}</div>`).join('')}</div>` : '<p class="muted small">아직 성공한 거래가 없어요.</p>';
  body.innerHTML = `
  <div class="teach">
    <section class="card" style="display:grid;gap:14px">
      <div class="row" style="justify-content:space-between"><h3>라운드 진행</h3><div class="row" style="gap:6px">${statusPills()}</div></div>
      <div class="rounds">${rbtn(1)}${rbtn(2)}${rbtn(3)}</div>
      <p class="small muted">라운드를 시작하면 모든 학생 캐릭터가 자기 나라 공장 앞으로 돌아가고 새 자원을 받아요.</p>
      <div class="row">
        <button class="btn ghost" data-act="trade" ${playingNow && ok ? '' : 'disabled'}>${g?.tradeOpen ? '무역 막기 (다리 닫기)' : '무역 열기 (다리 열기)'}</button>
        <button class="btn ghost" data-act="endGame" ${playingNow && ok ? '' : 'disabled'}>게임 끝내기</button>
      </div>
      <div><span class="label">타이머</span><div class="row" style="margin-top:6px">
        ${[3,5,7,10].map(m => `<button class="btn ghost sm" data-act="timer" data-m="${m}" ${playingNow && ok ? '' : 'disabled'}>${m}분</button>`).join('')}
        <button class="btn ghost sm" data-act="timer" data-m="0" ${g?.endsAt && ok ? '' : 'disabled'}>끄기</button></div></div>
      <div class="row" style="border-top:1px solid var(--line);padding-top:12px">
        ${S.confirmReset ? `<span class="small" style="color:var(--bad);font-weight:700">모든 점수와 거래가 지워져요. 정말 새로 시작할까요?</span><button class="btn bad sm" data-act="reset">네, 새 게임</button><button class="btn ghost sm" data-act="resetNo">아니요</button>` : `<button class="btn ghost sm" data-act="reset" ${ok ? '' : 'disabled'}>새 게임 준비하기</button>`}
      </div>
    </section>
    <section class="card" style="display:grid;gap:14px">
      <div class="row" style="justify-content:space-between"><h3>사건 카드</h3><span class="small muted">지금 라운드에만 적용돼요</span></div>
      <div class="evgrid">${EVENTS.map(p => `<button class="evbtn" data-act="event" data-id="${p.id}" ${playingNow && ok ? '' : 'disabled'}><b>${esc(p.t)}</b><span>${esc(p.text)}</span></button>`).join('')}</div>
      <div><span class="label">보호 무역: 고른 나라의 다리를 닫고 무역을 막아요</span><div class="row" style="margin-top:6px">
        <select id="blockPick" aria-label="무역을 막을 나라">${NATIONS.map(n => `<option value="${n.id}" ${S.blockPick === n.id ? 'selected' : ''}>${n.flag} ${n.name}</option>`).join('')}</select>
        <button class="btn sm" data-act="block" ${playingNow && ok ? '' : 'disabled'}>무역 막기 발동</button></div></div>
      <div class="list">${evList}</div>
    </section>
  </div>
  <section class="card" style="display:grid;gap:14px"><div class="row" style="justify-content:space-between"><h3>나라별 점수판</h3><span class="small muted">점수는 물건 점수 + 보너스</span></div>${scoreTable()}</section>
  <div class="teach">
    <section class="card" style="display:grid;gap:14px"><h3>라운드별 점수 합계</h3>${roundBars()}</section>
    <section class="card" style="display:grid;gap:10px"><h3>최근 성공한 거래</h3>${feedHtml}</section>
  </div>
  <section class="card" style="display:grid;gap:12px"><h3>40분 수업 흐름 예시</h3>
    <ol class="flow">
      ${CLASS_FLOW.map(f => `<li><span class="t">${esc(f.time)}</span><span><b>${esc(f.title)}</b>: ${esc(f.text)}</span></li>`).join('')}
    </ol></section>`;
}

