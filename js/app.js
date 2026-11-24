/* app.js
   시작과 화면 전환 — 탭(무역 게임·정리하기·선생님)을 연결하고 앱을 시작해요. 가장 마지막에 불러와요.
*/
/* ================= 그리기 연결 ================= */
const VIEWS = {
  game:{t:'무역 게임', mount:mountGame, after:afterMountGame, update:updateGame},
  wrap:{t:'정리하기', mount:() => '<div id="vbody" style="display:grid;gap:20px"></div>', update:() => { $('#vbody').innerHTML = viewWrap(); }},
  teacher:{t:'선생님', mount:mountTeacher, update:updateTeacher},
};
let mounted = null, mountedTeach = null, lastRoundKey = null;
function readHash(){ const h = location.hash.slice(1); S.view = VIEWS[h] ? h : 'game'; }
function render(){
  S.rev++;
  // 라운드가 바뀌면 집으로
  const rk = (S.game?.gid || '') + ':' + round() + ':' + (S.game?.phase || '');
  if (rk !== lastRoundKey){
    const first = lastRoundKey === null; lastRoundKey = rk;
    if (!first && S.me){ goHome(); S.sheet = (S.game?.phase === 'end') ? {type:'board'} : null; sendPresence(true); }
  }
  $('#tabs').innerHTML = Object.entries(VIEWS).filter(([k]) => k !== 'teacher' || S.canTeach)
    .map(([k, v]) => `<button class="tab" data-act="view" data-v="${k}" ${S.view === k ? 'aria-current="page"' : ''}>${v.t}</button>`).join('');
  let note = '';
  if (S.fbError) note = '학급 게임 서버(Firebase)를 불러오지 못했어요. 인터넷 연결을 확인하고 페이지를 새로 고쳐 주세요.';
  else if (S.mode === 'connecting') note = '학급 게임에 연결하는 중이에요…';
  else if (S.mode === 'local') note = '한 기기 연습 모드예요. 다른 기기와 공유되지 않아요.' + (location.protocol === 'file:' ? '' : ' 학급 게임 서버 설정이 아직 없어요. 선생님은 README의 Firebase 연결 안내를 봐 주세요.');
  else if (S.dbError) note = '학급 게임 데이터를 읽을 수 없어요. 선생님께 Firebase 규칙 설정을 확인해 달라고 해 주세요.';
  else if (S.slow) note = '학급 게임 정보를 아직 불러오지 못했어요. 인터넷 연결을 확인해 주세요.';
  else if (S.loaded && S.online === false) note = '인터넷 연결이 끊겼어요. 다시 연결하는 중이에요…';
  $('#notice').innerHTML = note ? `<p class="notice">${esc(note)}</p>` : '';
  const key = S.view + ':' + S.canTeach + ':' + S.mode;
  if (mounted !== S.view || mountedTeach !== key){
    $('#app').innerHTML = VIEWS[S.view].mount(); mounted = S.view; mountedTeach = key;
    VIEWS[S.view].after?.();
  }
  VIEWS[S.view].update();
}
window.addEventListener('hashchange', () => { readHash(); keys.clear(); render(); window.scrollTo(0, 0); });
setInterval(() => {
  const t = timerText(); document.querySelectorAll('[data-timer]').forEach(el => { if (el.textContent !== t) el.textContent = t; });
  if (mounted === 'teacher') updateTeacherCounts();
}, 1000);
function updateTeacherCounts(){
  const tc = $('#tcounts'); if (!tc) return;
  if (S.mode !== 'shared'){ tc.innerHTML = '<span class="pill">한 기기 연습 모드</span>'; return; }
  const cnt = {}; for (const pr of Object.values(S.players || {})) if (pr && NI[pr.n]) cnt[pr.n] = (cnt[pr.n] || 0) + 1;
  tc.innerHTML = NATIONS.map(n => `<span class="pill nc-${n.id}"><span class="nname">${n.flag} ${n.name}</span> ${cnt[n.id] || 0}명</span>`).join('');
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { base = null; });
readHash();
boot();
requestAnimationFrame(frame);
