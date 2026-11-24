/* store.js
   저장소 — Firebase 실시간 데이터베이스 연결(설정은 js/firebase-config.js 또는 Vercel 환경 변수), 학생용 링크, 선생님 비밀번호 확인, 한 기기 연습 모드를 맡아요.
*/
/* ================= 저장소: Firebase 실시간 데이터베이스 또는 한 기기 연습 모드 ================= */
let store = null;
const myPid = (() => { try { let p = sessionStorage.getItem('trade-pid'); if (!p){ p = newId(); sessionStorage.setItem('trade-pid', p); } return p; } catch { return newId(); } })();
const validUrl = u => typeof u === 'string' && /^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)\/?$/.test(u);
const validCls = k => typeof k === 'string' && /^[A-Za-z0-9_-]{1,20}$/.test(k);
/* 연결 설정 찾기: js/firebase-config.js → Vercel 환경 변수(/api/config) 순서 */
const DEFAULT_CLASS = 'class1';
function cleanJoin(j){
  if (!j || !validUrl(j.u) || !validCls(j.k)) return null;
  const s = v => (typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(v)) ? v : undefined;
  return {u:j.u.replace(/\/$/, ''), a:s(j.a), p:s(j.p), k:j.k, base:j.base, pinSet:!!j.pinSet, src:j.src};
}
async function loadConfig(){
  const urlClass = new URLSearchParams(location.search).get('c');
  const pick = c => (validCls(urlClass) ? urlClass : (validCls(c) ? c : DEFAULT_CLASS));
  const f = (typeof FIREBASE_SETTINGS === 'object' && FIREBASE_SETTINGS) || {};
  if (f.databaseURL){
    const j = cleanJoin({u:f.databaseURL, a:f.apiKey, p:f.projectId, k:pick(f.classCode), base:validCls(f.classCode) ? f.classCode : DEFAULT_CLASS, src:'file'});
    if (j){ S.apiAvailable = await apiAvailable(); return j; }
    S.cfgError = 'js/firebase-config.js 의 databaseURL 모양이 달라요.';
  }
  if (location.protocol === 'http:' || location.protocol === 'https:'){
    try {
      const ctrl = new AbortController(); const tm = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('api/config', {cache:'no-store', signal:ctrl.signal}); clearTimeout(tm);
      if (r.ok){
        const c = await r.json(); S.apiAvailable = true;
        if (c && c.databaseURL){
          const j = cleanJoin({u:c.databaseURL, a:c.apiKey, p:c.projectId, k:pick(c.classCode), base:validCls(c.classCode) ? c.classCode : DEFAULT_CLASS, pinSet:c.teacherPinSet, src:'vercel'});
          if (j) return j;
          S.cfgError = 'Vercel 환경 변수 FIREBASE_DATABASE_URL 의 모양이 달라요.';
        }
      }
    } catch {}
  }
  return null;
}
async function apiAvailable(){
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return false;
  try { const r = await fetch('api/config', {cache:'no-store'}); if (!r.ok) return false; const c = await r.json(); S.pinSet = !!c.teacherPinSet; return true; } catch { return false; }
}
const studentLink = j => location.origin + location.pathname + (j.k !== j.base ? '?c=' + encodeURIComponent(j.k) : '') + '#game';
const isTeacher = j => { try { return localStorage.getItem('trade-teacher:' + j.k) === '1'; } catch { return false; } };
const fbApp = j => {
  const name = 'trade-' + j.k;
  const ex = firebase.apps.find(a => a.name === name);
  return ex || firebase.initializeApp({databaseURL:j.u, apiKey:j.a, projectId:j.p}, name);
};
function localStore(){
  const mem = {game:null, trades:new Map(), makes:new Map(), builds:new Map(), plans:{}};
  const emit = () => {
    S.game = cleanGame(mem.game);
    const gid = mem.game?.gid;
    S.trades = [...mem.trades].filter(([, d]) => d.gid === gid).map(([id, d]) => cleanTrade(id, d)).filter(Boolean);
    S.makes = [...mem.makes].filter(([, d]) => d.gid === gid).map(([id, d]) => cleanMake(id, d)).filter(Boolean);
    S.builds = [...mem.builds].filter(([, d]) => d.gid === gid).map(([id, d]) => cleanBuild(id, d)).filter(Boolean);
    S.plans = Object.fromEntries(Object.entries(mem.plans[gid] || {}).map(([k, d]) => [k, cleanPlan(k, d)]).filter(([, v]) => v));
    render();
  };
  return {
    setGame: async g => { mem.game = JSON.parse(JSON.stringify(g)); emit(); },
    resetAll: async g => { mem.trades.clear(); mem.makes.clear(); mem.builds.clear(); mem.plans = {}; mem.game = JSON.parse(JSON.stringify(g)); emit(); },
    addTrade: async d => { mem.trades.set(newId(), {...d}); emit(); },
    updateTrade: async (id, p) => { const d = mem.trades.get(id); if (d) Object.assign(d, p); emit(); },
    acceptTrade: async id => { const d = mem.trades.get(id); if (!d || d.status !== 'pending') return false; d.status = 'accepted'; d.doneAt = Date.now(); emit(); return true; },
    addMake: async d => { mem.makes.set(newId(), {...d}); emit(); },
    addBuild: async d => { mem.builds.set(newId(), {...d}); emit(); },
    setPlan: async (nid, d) => { const g = mem.game?.gid; (mem.plans[g] = mem.plans[g] || {})[nid] = {...d}; emit(); },
    presence: () => {},
  };
}
function firebaseStore(j){
  const db = fbApp(j).database(), root = db.ref('classes/' + j.k);
  let curGid, tRef = null, mRef = null, bRef = null, pRef = null;
  const timer = setTimeout(() => { if (!S.loaded){ S.slow = true; render(); } }, 10000);
  db.ref('.info/serverTimeOffset').on('value', s => { S.offset = Number(s.val()) || 0; });
  const meRef = root.child('players/' + myPid);
  db.ref('.info/connected').on('value', s => {
    S.online = !!s.val();
    if (S.online){ meRef.onDisconnect().remove(); sentKey = ''; sendPresence(true); }
    render();
  });
  root.child('players').on('value', s => { const v = s.val(); S.players = (v && typeof v === 'object') ? v : {}; });
  root.child('game').on('value', snap => {
    clearTimeout(timer); S.slow = false; S.loaded = true;
    S.game = cleanGame(snap.val());
    const gid = (S.game?.gid && /^[a-z0-9]{4,20}$/.test(S.game.gid)) ? S.game.gid : null;
    if (gid !== curGid){
      curGid = gid; [tRef, mRef, bRef, pRef].forEach(x => x && x.off()); tRef = mRef = bRef = pRef = null; S.trades = []; S.makes = []; S.builds = []; S.plans = {};
      if (gid){
        tRef = root.child('trades/' + gid); mRef = root.child('makes/' + gid);
        tRef.on('value', s => { const v = s.val() || {}; S.trades = Object.entries(v).map(([id, d]) => cleanTrade(id, d)).filter(Boolean); render(); });
        mRef.on('value', s => { const v = s.val() || {}; S.makes = Object.entries(v).map(([id, d]) => cleanMake(id, d)).filter(Boolean); render(); });
        bRef = root.child('builds/' + gid); pRef = root.child('plans/' + gid);
        bRef.on('value', s => { const v = s.val() || {}; S.builds = Object.entries(v).map(([id, d]) => cleanBuild(id, d)).filter(Boolean); render(); });
        pRef.on('value', s => { const v = s.val() || {}; S.plans = Object.fromEntries(Object.entries(v).map(([k, d]) => [k, cleanPlan(k, d)]).filter(([, x]) => x)); render(); });
      }
    }
    render();
  }, () => { clearTimeout(timer); S.dbError = true; S.loaded = true; render(); });
  const tradeRef = id => root.child('trades/' + S.game.gid + '/' + id);
  return {
    setGame: g => root.child('game').set(g),
    resetAll: g => root.update({game:g, trades:null, makes:null, builds:null, plans:null}),
    addTrade: d => root.child('trades/' + S.game.gid).push(d),
    updateTrade: (id, p) => tradeRef(id).transaction(cur => (cur && cur.status === 'pending') ? {...cur, ...p} : undefined),
    acceptTrade: id => new Promise((res, rej) => tradeRef(id).transaction(
      cur => (cur && cur.status === 'pending') ? {...cur, status:'accepted', doneAt:Date.now()} : undefined,
      (err, committed) => err ? rej(err) : res(committed))),
    addMake: d => root.child('makes/' + S.game.gid).push(d),
    addBuild: d => root.child('builds/' + S.game.gid).push(d),
    setPlan: (nid, d) => root.child('plans/' + S.game.gid + '/' + nid).set(d),
    presence: pr => (pr ? meRef.set(pr) : meRef.remove()).catch(() => {}),
  };
}
async function boot(){
  render();
  const j = await loadConfig();
  S.join = j;
  if (j && window.firebase){
    try { S.mode = 'shared'; store = firebaseStore(j); S.canTeach = isTeacher(j); }
    catch (e) { S.mode = 'local'; S.fbError = true; }
  } else if (j && !window.firebase){ S.fbError = true; }
  if (S.mode !== 'shared'){ S.mode = 'local'; S.canTeach = true; S.loaded = true; store = localStore(); }
  render();
}
async function teacherLogin(pin){
  if (!S.join) return;
  try {
    const r = await fetch('api/teacher', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({pin})});
    const d = await r.json();
    if (d.ok){ try { localStorage.setItem('trade-teacher:' + S.join.k, '1'); } catch {} S.canTeach = true; S.loginMsg = ''; render(); toast('선생님 모드로 들어왔어요.'); return; }
    S.loginMsg = d.reason === 'no-pin' ? 'Vercel 환경 변수에 TEACHER_PIN 이 아직 없어요. README의 안내대로 넣고 다시 배포해 주세요.' : '비밀번호가 맞지 않아요.';
  } catch { S.loginMsg = '비밀번호를 확인하지 못했어요. 인터넷 연결을 확인해 주세요.'; }
  mounted = null; render();
}
function teacherLogout(){ try { localStorage.removeItem('trade-teacher:' + S.join.k); } catch {} S.canTeach = false; location.hash = 'game'; render(); }

