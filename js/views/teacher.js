/* views/teacher.js
   선생님 화면 — 실시간 지도, 라운드 진행, 사건 카드, 점수판.
*/
/* ================= 화면: 선생님 ================= */
function mountTeacher(){
  if (!S.canTeach) return teacherLoginHtml();
  return `<section class="card" style="display:grid;gap:12px">
    <div class="row" style="justify-content:space-between"><div><h2>실시간 무역 지도</h2><p class="sub">전자칠판에 띄워 반 전체와 함께 보세요</p></div><div class="counts" id="tcounts"></div></div>
    <div class="tmapbox"><canvas id="tmap" aria-label="모든 학생의 위치가 보이는 전체 지도"></canvas></div>
  </section>${shareCard()}
  <section class="card" style="display:grid;gap:12px"><div class="row" style="justify-content:space-between"><h3>❓ 학생들에게 문제 내기</h3><span class="small muted">맞힌 학생의 나라는 특산 자원 +${QUIZ_REWARD.perAnswer} (나라마다 문제당 최대 ${QUIZ_REWARD.maxPerNation}번)</span></div>
    <div id="quizStatus"></div>
    <div class="evgrid">${QUIZ_BANK.map((q, i) => `<button class="evbtn" data-act="quizPost" data-i="${i}"><b>문제 ${i + 1}</b><span>${esc(q.q)}</span></button>`).join('')}</div>
    <details><summary class="small" style="cursor:pointer;font-weight:700">직접 문제 만들기</summary>
      <div style="display:grid;gap:8px;margin-top:10px">
        <input type="text" id="cqQ" placeholder="문제" style="width:100%">
        <div class="row"><input type="text" id="cqO0" placeholder="보기 1"><input type="text" id="cqO1" placeholder="보기 2"><input type="text" id="cqO2" placeholder="보기 3 (선택)"><input type="text" id="cqO3" placeholder="보기 4 (선택)"></div>
        <div class="row"><label class="small" for="cqA" style="font-weight:700">정답</label><select id="cqA"><option value="0">보기 1</option><option value="1">보기 2</option><option value="2">보기 3</option><option value="3">보기 4</option></select><button class="btn sm" data-act="quizPost">이 문제 내기</button></div>
      </div></details>
  </section>
  <div id="tbody" style="display:grid;gap:20px"></div>`;
}
function notesHtml(){
  const rows = Object.values(S.notes).sort((a, b) => a.r - b.r);
  return rows.length ? `<div class="history">${rows.map(x => `<div class="h"><span class="contract">${x.r}라운드</span>${nTag(x.nation)} <span>${esc(x.text)}</span></div>`).join('')}</div>` : '<p class="muted small">라운드가 끝나면 나라마다 한 줄 성찰이 모여요.</p>';
}
function updateTeacher(){
  const body = $('#tbody'); if (!body) return;
  const qs = $('#quizStatus'), qz = S.game?.quiz;
  if (qs){
    const ans = qz ? S.answers.filter(a => a.qid === qz.id) : [];
    qs.innerHTML = qz ? `<div class="offer ${qz.open ? 'incoming' : ''}"><b>${qz.open ? '지금 낸 문제' : '닫은 문제'}: ${esc(qz.q)}</b><span class="small">정답: ${esc(qz.o[qz.a])} · 답한 학생 ${ans.length}명 · 맞힌 학생 ${ans.filter(a => a.ok).length}명</span>
      <div class="cost">${NATIONS.map(n => `<span class="chip">${n.flag} ${ans.filter(a => a.nation === n.id && a.ok).length}/${ans.filter(a => a.nation === n.id).length}</span>`).join('')}</div>
      ${qz.open ? `<div class="row"><button class="btn ghost sm" data-act="quizClose">문제 닫기</button></div>` : ''}</div>` : '<p class="muted small">아래에서 문제를 고르면 학생 화면에 바로 나타나요. 라운드 중에만 낼 수 있어요.</p>';
  }
  const g = S.game, r = round(), ok = !S.busy;
  const playingNow = g && g.phase === 'play';
  updateTeacherCounts(); updateShare();
  const rbtn = n => `<button class="rbtn ${playingNow && r === n ? 'now' : ''}" data-act="round" data-r="${n}" ${ok ? '' : 'disabled'}><span><b>${roundInfo(n).t}</b><br><span class="small muted">${roundInfo(n).s}</span></span><span class="small">${playingNow && r === n ? '진행 중' : '시작'}</span></button>`;
  const evNow = (g?.events || []).filter(e => e.r === r);
  const evList = evNow.length ? evNow.map(e => { const x = evInfo(e); return `<div class="row" style="justify-content:space-between;padding:8px 10px;border-radius:8px;background:var(--surface-2)"><span><b>${e.auto ? '📰 ' : ''}${esc(x.t)}</b> <span class="small">${nTag(e.nation)}</span></span><button class="btn ghost sm" data-act="unevent" data-key="${esc(e.key)}" ${ok ? '' : 'disabled'}>취소</button></div>`; }).join('') : '<p class="muted small">이번 라운드에 발동한 사건이 없어요.</p>';
  const feed = acceptedSorted().slice(-8).reverse();
  const feedHtml = feed.length ? `<div class="history">${feed.map(t => `<div class="h"><span class="contract">${contractNo(t)}</span>${nTag(t.from)} ${bagChips(t.give)} ⇄ ${nTag(t.to)} ${bagChips(t.get)}</div>`).join('')}</div>` : '<p class="muted small">아직 성공한 거래가 없어요.</p>';
  body.innerHTML = `
  <div class="teach">
    <section class="card" style="display:grid;gap:14px">
      <div class="row" style="justify-content:space-between"><h3>라운드 진행</h3><div class="row" style="gap:6px">${statusPills()}</div></div>
      <div class="row"><label class="small" for="roundsPick" style="font-weight:700">라운드 수</label><select id="roundsPick">${ROUND_CHOICES.map(n => `<option value="${n}" ${(S.roundsPick || nRounds()) === n ? 'selected' : ''}>${n}라운드${n === ROUND_DEFAULT ? ' (기본)' : ''}</option>`).join('')}</select><button class="btn ghost sm" data-act="setRounds" ${ok ? '' : 'disabled'}>정하기</button><span class="small muted">40분 한 차시는 4라운드, 두 차시는 5~6라운드를 권해요</span></div>
      <div class="rounds">${roundList().map(rbtn).join('')}</div>
      <button class="btn ${g?.paused ? 'ok' : 'bad'}" data-act="pause" style="width:100%" ${playingNow && ok ? '' : 'disabled'}>${g?.paused ? '▶ 다시 시작 (학생 화면 풀기)' : '⏸ 모두 멈추기 (설명할 때)'}</button>
      ${(() => { const cur = playingNow ? r : 0, nx = cur + 1 <= nRounds() ? cur + 1 : 0; const box = (n, label) => { const gd = guideOf(n); return `<div class="offer ${label === '지금' ? 'incoming' : ''}"><b>${label} · ${n}라운드 ${esc(gd.title)}</b><span class="small"><b>학생 목표</b> ${esc(gd.goal)}</span><ul class="qs small">${gd.teacher.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`; }; return `<div class="list">${cur ? box(cur, '지금') : ''}${nx ? box(nx, cur ? '다음' : '처음') : ''}</div>`; })()}
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
        <button class="btn sm" data-act="block" ${playingNow && ok ? '' : 'disabled'}>무역 막기 발동</button>
        <select id="tariffAmt" aria-label="관세 금액">${TARIFF_AMOUNTS.map(n => `<option value="${n}" ${Number(S.tariffAmt || TARIFF_AMOUNTS[0]) === n ? 'selected' : ''}>관세 금 ${n}</option>`).join('')}</select>
        <button class="btn sm" data-act="tariff" ${playingNow && ok ? '' : 'disabled'}>관세 매기기</button></div>
        <div class="row" style="margin-top:6px"><button class="btn sm" data-act="fx" data-n="1" ${playingNow && ok ? '' : 'disabled'}>💪 돈 가치 올리기</button><button class="btn sm" data-act="fx" data-n="-1" ${playingNow && ok ? '' : 'disabled'}>📉 돈 가치 내리기</button></div>
        <p class="small muted" style="margin-top:6px">환율: 위에서 고른 나라의 돈 가치를 바꿔요. 오르면 수입할 때 금 +${FX.gold}·수출할 때 -${FX.gold}, 내리면 반대예요.</p>
        <p class="small muted" style="margin-top:6px">관세: 고른 나라로 물건을 수출하는 나라가 거래 한 번에 금을 그 나라에 내요. 무역 협정(FTA)을 맺은 나라는 면제예요.</p></div>
      <div class="row" style="border-top:1px solid var(--line);padding-top:12px"><button class="btn ${g?.news ? 'ok' : 'ghost'} sm" data-act="news" ${ok ? '' : 'disabled'}>📰 자동 뉴스 속보 ${g?.news ? '켜짐' : '꺼짐'}</button><span class="small muted" data-newsin></span></div>
      <p class="small muted">켜 두면 라운드마다 ${Math.round(AUTO_NEWS.minSec / 60 * 10) / 10}~${AUTO_NEWS.maxSec / 60}분 뒤에 사건 하나가 저절로 일어나요. 이 선생님 화면이 켜져 있어야 해요.</p>
      <div class="list">${evList}</div>
    </section>
  </div>
  <section class="card" style="display:grid;gap:14px"><div class="row" style="justify-content:space-between"><h3>나라별 점수판</h3><span class="small muted">점수는 물건 + 보너스 + 개발 + 주민 부탁 점수</span></div>${scoreTable()}</section>
  <section class="card" style="display:grid;gap:12px">${balanceHtml()}</section>
  <section class="card" style="display:grid;gap:12px">${marketHtml() || '<h3>📈 시장 가격판</h3><p class="muted small">라운드가 시작되면 나타나요.</p>'}</section>
  <section class="card" style="display:grid;gap:12px"><div class="row" style="justify-content:space-between"><h3>나라별 비밀 목표 · 배지 · 협정</h3><span class="small muted">학생들은 자기 나라 목표만 봐요</span></div>
    <div class="list">${NATIONS.map(n => { const p = goalProgress(n.id); return `<div class="offer"><div>${nTag(n.id)} ${p ? `<span class="small">🤫 ${esc(p.g.t)}: ${esc(p.g.text)} (${p.cur}/${p.need}${p.done ? ' ✔' : ''})</span>` : ''}</div><div class="cost">${badgeChips(n.id)}</div><span class="small muted">협정: ${ftaPartners(n.id).map(x => NI[x].name).join(', ') || '없음'}${tariffOf(n.id) ? ` · 관세 금 ${tariffOf(n.id)}` : ''}</span></div>`; }).join('')}</div></section>
  <section class="card" style="display:grid;gap:12px"><h3>라운드별 한 줄 성찰</h3>${notesHtml()}</section>
  <section class="card" style="display:grid;gap:12px"><div class="row" style="justify-content:space-between"><h3>나라별 무역 계획서</h3><span class="small muted">✔는 실제로 이룬 것</span></div>
    <div class="list">${NATIONS.map(n => `<div class="offer"><div>${nTag(n.id)}</div>${planCheck(n.id)}</div>`).join('')}</div></section>
  <div class="teach">
    <section class="card" style="display:grid;gap:14px"><h3>라운드별 점수 합계</h3>${roundBars()}</section>
    <section class="card" style="display:grid;gap:10px"><h3>최근 성공한 거래</h3>${feedHtml}</section>
  </div>
  <section class="card" style="display:grid;gap:12px"><h3>수업 흐름 예시 (5라운드 · 두 차시)</h3>
    <ol class="flow">
      ${CLASS_FLOW.map(f => `<li><span class="t">${esc(f.time)}</span><span><b>${esc(f.title)}</b>: ${esc(f.text)}</span></li>`).join('')}
    </ol></section>`;
}

