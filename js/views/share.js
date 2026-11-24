/* views/share.js
   선생님 화면에 들어가는 부분 — 학생용 링크·QR 코드, 선생님 비밀번호 입력.
   Firebase 연결 설정은 화면에서 하지 않고 Vercel 환경 변수나 js/firebase-config.js 에서 해요(README 참고).
*/
async function copyText(text, inputId){
  try { await navigator.clipboard.writeText(text); toast('복사했어요.'); }
  catch { const el = inputId && $('#' + inputId); if (el){ el.focus(); el.select(); } toast('복사하지 못했어요. 선택된 글자를 Ctrl+C로 복사해 주세요.'); }
}
function shareCard(){
  if (S.mode !== 'shared') return `<section class="card" style="display:grid;gap:10px"><h3>학생용 링크</h3>
    <p class="muted">아직 학급 게임 서버(Firebase)가 연결되지 않아서 한 기기 연습 모드로 돌아가고 있어요.</p>
    <p class="small">${S.cfgError ? esc(S.cfgError) + ' ' : ''}Vercel 프로젝트의 <b>Settings → Environment Variables</b>에 <b>FIREBASE_DATABASE_URL</b> 등을 넣고 다시 배포하거나, GitHub 저장소의 <b>js/firebase-config.js</b>에 값을 넣어 주세요. 자세한 방법은 저장소의 README에 있어요.</p></section>`;
  const other = S.join.k !== S.join.base;
  return `<section class="card" style="display:grid;gap:12px" id="share">
    <div class="row" style="justify-content:space-between"><div><h3>학생용 접속 링크</h3><p class="sub">반 코드 ${esc(S.join.k)}${other ? '' : ' (기본 반)'} · 설정 출처: ${S.join.src === 'file' ? 'GitHub 설정 파일' : 'Vercel 환경 변수'}</p></div>
    <button class="btn ghost sm" data-act="teacherLogout">선생님 모드 끄기</button></div>
    <div class="row" style="align-items:flex-start;gap:18px">
      <div id="qr" style="background:#fff;padding:10px;border-radius:12px;line-height:0"></div>
      <div style="display:grid;gap:8px;flex:1 1 260px;min-width:0">
        <p class="small">학생들은 이 QR 코드를 찍거나 링크를 열기만 하면 돼요. 로그인은 필요 없어요.</p>
        <input type="text" id="shareLink" readonly style="width:100%;font-size:.9rem">
        <div class="row"><button class="btn sm" data-act="copyLink">링크 복사</button></div>
        <p class="small muted">다른 반은 주소 뒤에 <b>?c=반코드</b>를 붙이면 따로 게임해요. 예: ${esc(location.origin + location.pathname)}?c=6-2</p>
      </div></div></section>`;
}
function updateShare(){
  if (S.mode !== 'shared' || !S.join) return;
  const link = studentLink(S.join), inp = $('#shareLink'), qr = $('#qr');
  if (inp && inp.value !== link) inp.value = link;
  if (qr && qr.dataset.link !== link){
    qr.dataset.link = link; qr.innerHTML = '';
    try { new QRCode(qr, {text:link, width:220, height:220, correctLevel:QRCode.CorrectLevel.M}); }
    catch { qr.innerHTML = '<span class="small muted" style="line-height:1.5">QR 코드를 만들지 못했어요. 링크를 복사해서 나눠 주세요.</span>'; }
  }
}
function teacherLoginHtml(){
  return `<section class="card" style="display:grid;gap:14px;max-width:520px;margin:0 auto">
    <div><h2>선생님 모드</h2><p class="sub">선생님 비밀번호를 넣으면 라운드 진행, 사건 카드, 점수판을 쓸 수 있어요.</p></div>
    <form class="row" id="pinForm" autocomplete="off" onsubmit="event.preventDefault(); teacherLogin(document.getElementById('pin').value)">
      <input type="password" id="pin" inputmode="numeric" placeholder="비밀번호" aria-label="선생님 비밀번호" style="font:inherit;padding:11px 14px;border-radius:14px;border:3px solid var(--edge);min-height:48px;width:min(220px,100%)">
      <button class="btn" type="submit">들어가기</button>
    </form>
    ${S.loginMsg ? `<p class="small" style="color:var(--red-ink);font-weight:700">${esc(S.loginMsg)}</p>` : ''}
    <p class="small muted">비밀번호는 Vercel 프로젝트의 환경 변수 <b>TEACHER_PIN</b>에서 정해요.</p>
  </section>`;
}
