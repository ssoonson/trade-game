/* views/setup.js
   설정 화면 — Firebase 연결 안내와 학생용 링크·QR 코드.
*/
/* ================= 화면: 설정 (선생님) ================= */
const RULES_TEXT = `{
  "rules": {
    "classes": {
      "$cls": {
        ".read": true,
        ".write": true
      }
    }
  }
}`;
function parseCfg(t){
  const o = {};
  for (const k of ['apiKey', 'projectId', 'databaseURL']){
    const m = String(t || '').match(new RegExp(k + '["\']?\\s*:\\s*["\']([^"\']+)["\']'));
    if (m) o[k] = m[1].trim();
  }
  return o;
}
function mountSetup(){
  const fileWarn = location.protocol === 'file:' ? `<section class="card" style="display:grid;gap:10px;border-color:var(--warn)">
    <h3>⚠️ 지금은 내 컴퓨터에 저장된 파일로 열었어요</h3>
    <p>학생들이 링크로 들어오려면 이 파일을 먼저 웹에 올려야 해요. 웹에 올린 주소로 다시 열어서 설정을 이어 가세요.</p>
    <ol class="qs"><li><b>app.netlify.com/drop</b> 에 접속해요. 구글 계정으로 가입하거나 로그인할 수 있어요.</li>
    <li><b>index.html 파일이 들어 있는 폴더</b>를 화면에 끌어다 놓아요.</li>
    <li>잠시 뒤 생기는 <b>https://○○○.netlify.app</b> 주소를 열어요. 이 주소가 우리 반 게임 주소예요.</li></ol>
    <p class="small muted">연습만 하고 싶다면 지금 상태에서도 위쪽 <b>무역 게임</b> 탭을 눌러 한 기기 연습 모드로 해 볼 수 있어요.</p></section>` : '';
  return `${fileWarn}
  <section class="card" style="display:grid;gap:8px">
    <h2>학급 게임 서버 연결하기</h2><p class="sub">선생님만 · 처음 한 번만 하면 돼요</p>
    <p class="muted">학생 기기끼리 캐릭터 위치와 거래를 주고받으려면 무료 실시간 데이터베이스가 필요해요. 선생님 구글 계정으로 Google Firebase를 한 번 설정하면 학생들은 로그인 없이 링크만 열면 돼요.</p></section>
  <section class="card" style="display:grid;gap:14px"><h3>1. Firebase 프로젝트와 데이터베이스 만들기</h3>
    <ol class="qs">
      <li><b>console.firebase.google.com</b> 에 접속해 구글 계정으로 로그인하고 <b>프로젝트 만들기</b>를 눌러요. 이름은 예를 들어 <b>trade-class</b>로 하고, Google 애널리틱스는 꺼도 돼요.</li>
      <li>왼쪽 메뉴에서 <b>빌드 → Realtime Database</b>를 눌러요. (Firestore가 아니라 <b>Realtime Database</b>예요.)</li>
      <li><b>데이터베이스 만들기</b> → 위치는 <b>싱가포르(asia-southeast1)</b> → <b>잠금 모드로 시작</b>을 골라요.</li>
      <li>데이터베이스 화면의 <b>규칙</b> 탭에서 내용을 모두 지우고 아래 규칙을 붙여 넣은 뒤 <b>게시</b>를 눌러요.</li>
    </ol>
    <div class="row"><pre id="rulesBox" style="margin:0;padding:12px 14px;border-radius:10px;background:var(--surface-2);border:1px solid var(--line);font-size:.85rem;overflow-x:auto;max-width:100%">${esc(RULES_TEXT)}</pre>
    <button class="btn ghost sm" data-act="copyRules">규칙 복사</button></div>
    <p class="small muted">이 규칙은 <b>classes</b> 아래의 게임 데이터만 읽고 쓸 수 있게 해요. 게임에는 나라, 별명, 자원, 캐릭터 위치만 저장되니 학생 실명은 별명으로 쓰지 않도록 안내해 주세요.</p>
  </section>
  <section class="card" style="display:grid;gap:14px"><h3>2. 웹 앱 등록하고 설정값 복사하기</h3>
    <ol class="qs">
      <li>왼쪽 위 <b>⚙️ 톱니바퀴 → 프로젝트 설정</b>으로 가요.</li>
      <li>아래쪽 <b>내 앱</b>에서 <b>웹 (&lt;/&gt;)</b> 아이콘을 누르고 앱 이름을 넣어 <b>앱 등록</b>을 눌러요. Firebase 호스팅은 체크하지 않아도 돼요.</li>
      <li>화면에 나오는 <b>const firebaseConfig = { … }</b> 부분을 통째로 복사해서 아래 칸에 붙여 넣어요.</li>
    </ol>
    <div style="display:grid;gap:6px"><label class="label" for="cfgText">firebaseConfig 붙여 넣기</label>
      <textarea id="cfgText" rows="7" spellcheck="false" placeholder="const firebaseConfig = {&#10;  apiKey: &quot;…&quot;,&#10;  databaseURL: &quot;https://….firebasedatabase.app&quot;,&#10;  projectId: &quot;…&quot;,&#10;  …&#10;};" style="font:inherit;font-size:.88rem;padding:10px 12px;border-radius:10px;border:1px solid var(--line);background:var(--surface);color:var(--ink);width:100%;resize:vertical"></textarea></div>
    <div style="display:grid;gap:6px"><label class="label" for="dbUrl">데이터베이스 주소 (붙여 넣은 내용에 databaseURL이 없을 때만)</label>
      <input type="text" id="dbUrl" placeholder="https://프로젝트이름-default-rtdb.asia-southeast1.firebasedatabase.app" style="width:100%">
      <span class="small muted">Realtime Database 화면 맨 위에 보이는 주소예요.</span></div>
  </section>
  <section class="card" style="display:grid;gap:14px"><h3>3. 반 코드 정하고 연결하기</h3>
    <div style="display:grid;gap:6px"><label class="label" for="clsCode">반 코드 (영어, 숫자, -만 · 예: 6-1)</label>
      <input type="text" id="clsCode" maxlength="20" placeholder="6-1" value="${esc(S.join?.k || '')}"></div>
    <p class="small muted">반마다 다른 코드를 쓰면 같은 Firebase로 여러 반이 따로따로 게임할 수 있어요.</p>
    <div class="row"><button class="btn" data-act="setupGo" id="setupGoBtn">연결 확인하고 저장</button></div>
    <p id="setupMsg" class="small" style="font-weight:700"></p>
  </section>`;
}
function setSetupMsg(t, bad){ const el = $('#setupMsg'); if (el){ el.textContent = t; el.style.color = bad ? 'var(--bad)' : 'var(--ok)'; } }
async function setupGo(){
  if (!window.firebase) return setSetupMsg('Firebase 프로그램을 불러오지 못했어요. 인터넷 연결을 확인하고 새로 고쳐 주세요.', true);
  const cfg = parseCfg($('#cfgText').value);
  const u = ($('#dbUrl').value.trim() || cfg.databaseURL || '').replace(/\/$/, '');
  const k = $('#clsCode').value.trim();
  if (!u) return setSetupMsg('데이터베이스 주소를 찾지 못했어요. Realtime Database를 만든 뒤 설정값을 다시 복사하거나, 주소 칸에 직접 넣어 주세요.', true);
  if (!validUrl(u)) return setSetupMsg('데이터베이스 주소 모양이 달라요. https:// 로 시작하고 firebasedatabase.app 또는 firebaseio.com 으로 끝나야 해요.', true);
  if (!validCls(k)) return setSetupMsg('반 코드는 영어, 숫자, - 로만 20자까지 써 주세요. 예: 6-1', true);
  const j = cleanJoin({u, a:cfg.apiKey, p:cfg.projectId, k});
  if (!j) return setSetupMsg('설정값을 읽지 못했어요. 다시 복사해서 붙여 넣어 주세요.', true);
  const btn = $('#setupGoBtn'); if (btn) btn.disabled = true;
  setSetupMsg('연결을 확인하는 중이에요…');
  let app;
  try {
    app = firebase.initializeApp({databaseURL:j.u, apiKey:j.a, projectId:j.p}, 'check-' + newId());
    const ref = app.database().ref('classes/' + k + '/ping');
    await Promise.race([ref.set(Date.now()), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000))]);
    try { localStorage.setItem('trade-join', JSON.stringify(j)); localStorage.setItem('trade-teacher:' + k, '1'); } catch {}
    setSetupMsg('연결됐어요! 선생님 화면으로 이동해요.');
    location.href = location.origin + location.pathname + '?j=' + b64e(j) + '#teacher';
    setTimeout(() => location.reload(), 300);
  } catch (e) {
    const denied = /permission/i.test(String(e && (e.code || e.message)));
    setSetupMsg(denied ? '데이터베이스가 거절했어요. 1단계의 규칙을 붙여 넣고 게시했는지 확인해 주세요.' : '연결하지 못했어요. 데이터베이스 주소가 맞는지, 1단계 규칙을 게시했는지 확인해 주세요.', true);
    if (btn) btn.disabled = false;
  } finally { try { app && app.delete(); } catch {} }
}
async function copyText(text, inputId){
  try { await navigator.clipboard.writeText(text); toast('복사했어요.'); }
  catch { const el = inputId && $('#' + inputId); if (el){ el.focus(); el.select(); } toast('복사하지 못했어요. 선택된 글자를 Ctrl+C로 복사해 주세요.'); }
}
function shareCard(){
  if (S.mode !== 'shared') return `<section class="card" style="display:grid;gap:10px"><h3>학생용 링크</h3>
    <p class="muted">지금은 한 기기 연습 모드예요. 학생 기기를 연결하려면 먼저 <b>설정</b>에서 학급 게임 서버(Firebase)를 연결해 주세요.</p>
    <div class="row"><button class="btn" data-act="view" data-v="setup">설정하러 가기</button></div></section>`;
  return `<section class="card" style="display:grid;gap:12px" id="share">
    <div class="row" style="justify-content:space-between"><div><h3>학생용 접속 링크</h3><p class="sub">반 코드 ${esc(S.join.k)}</p></div>
    <button class="btn ghost sm" data-act="view" data-v="setup">다른 반 만들기 · 설정</button></div>
    <div class="row" style="align-items:flex-start;gap:18px">
      <div id="qr" style="background:#fff;padding:10px;border-radius:12px;line-height:0"></div>
      <div style="display:grid;gap:8px;flex:1 1 260px;min-width:0">
        <p class="small">학생들은 이 QR 코드를 찍거나 링크를 열기만 하면 돼요. 로그인은 필요 없어요. 학급 게시판이나 클래스룸에 링크를 올려 두면 편해요.</p>
        <input type="text" id="shareLink" readonly style="width:100%;font-size:.82rem">
        <div class="row"><button class="btn sm" data-act="copyLink">링크 복사</button></div>
        <p class="small muted">이 기기는 선생님 기기로 저장됐어요. 학생 링크로 연 기기에는 선생님 탭이 보이지 않아요.</p>
      </div></div></section>`;
}
function updateShare(){
  if (S.mode !== 'shared' || !S.join) return;
  const link = studentLink(S.join), inp = $('#shareLink'), qr = $('#qr');
  if (inp && inp.value !== link) inp.value = link;
  if (qr && qr.dataset.link !== link){
    qr.dataset.link = link; qr.innerHTML = '';
    try { new QRCode(qr, {text:link, width:220, height:220, correctLevel:QRCode.CorrectLevel.L}); }
    catch { qr.innerHTML = '<span class="small muted" style="line-height:1.5">QR 코드를 만들지 못했어요. 링크를 복사해서 나눠 주세요.</span>'; }
  }
}

