/* store.js
   저장소 — Firebase 실시간 데이터베이스 연결, 학생용 링크 만들기, 한 기기 연습 모드를 맡아요.
*/
/* ================= 저장소: Firebase 실시간 데이터베이스 또는 한 기기 연습 모드 ================= */
let store = null;
const myPid = (() => { try { let p = sessionStorage.getItem('trade-pid'); if (!p){ p = newId(); sessionStorage.setItem('trade-pid', p); } return p; } catch { return newId(); } })();
const validUrl = u => typeof u === 'string' && /^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)\/?$/.test(u);
const validCls = k => typeof k === 'string' && /^[A-Za-z0-9_-]{1,20}$/.test(k);
function b64e(o){ return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64d(s){ s = s.replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(decodeURIComponent(escape(atob(s)))); }
function cleanJoin(j){
  if (!j || !validUrl(j.u) || !validCls(j.k)) return null;
  const s = v => (typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(v)) ? v : undefined;
  return {u:j.u.replace(/\/$/, ''), a:s(j.a), p:s(j.p), k:j.k};
}
function loadJoin(){
  const q = new URLSearchParams(location.search).get('j');
  if (q){ try { const j = cleanJoin(b64d(q)); if (j){ try { localStorage.setItem('trade-join', JSON.stringify(j)); } catch {} return j; } } catch {} }
  try { return cleanJoin(JSON.parse(localStorage.getItem('trade-join') || 'null')); } catch { return null; }
}
const studentLink = j => location.origin + location.pathname + '?j=' + b64e({u:j.u, a:j.a, p:j.p, k:j.k}) + '#game';
const isTeacher = j => { try { return localStorage.getItem('trade-teacher:' + j.k) === '1'; } catch { return false; } };
const fbApp = j => {
  const name = 'trade-' + j.k;
  const ex = firebase.apps.find(a => a.name === name);
  return ex || firebase.initializeApp({databaseURL:j.u, apiKey:j.a, projectId:j.p}, name);
};
function localStore(){
  const mem = {game:null, trades:new Map(), makes:new Map()};
  const emit = () => {
    S.game = cleanGame(mem.game);
    const gid = mem.game?.gid;
    S.trades = [...mem.trades].filter(([, d]) => d.gid === gid).map(([id, d]) => cleanTrade(id, d)).filter(Boolean);
    S.makes = [...mem.makes].filter(([, d]) => d.gid === gid).map(([id, d]) => cleanMake(id, d)).filter(Boolean);
    render();
  };
  return {
    setGame: async g => { mem.game = JSON.parse(JSON.stringify(g)); emit(); },
    resetAll: async g => { mem.trades.clear(); mem.makes.clear(); mem.game = JSON.parse(JSON.stringify(g)); emit(); },
    addTrade: async d => { mem.trades.set(newId(), {...d}); emit(); },
    updateTrade: async (id, p) => { const d = mem.trades.get(id); if (d) Object.assign(d, p); emit(); },
    acceptTrade: async id => { const d = mem.trades.get(id); if (!d || d.status !== 'pending') return false; d.status = 'accepted'; d.doneAt = Date.now(); emit(); return true; },
    addMake: async d => { mem.makes.set(newId(), {...d}); emit(); },
    presence: () => {},
  };
}
function firebaseStore(j){
  const db = fbApp(j).database(), root = db.ref('classes/' + j.k);
  let curGid, tRef = null, mRef = null;
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
      curGid = gid; tRef && tRef.off(); mRef && mRef.off(); tRef = mRef = null; S.trades = []; S.makes = [];
      if (gid){
        tRef = root.child('trades/' + gid); mRef = root.child('makes/' + gid);
        tRef.on('value', s => { const v = s.val() || {}; S.trades = Object.entries(v).map(([id, d]) => cleanTrade(id, d)).filter(Boolean); render(); });
        mRef.on('value', s => { const v = s.val() || {}; S.makes = Object.entries(v).map(([id, d]) => cleanMake(id, d)).filter(Boolean); render(); });
      }
    }
    render();
  }, () => { clearTimeout(timer); S.dbError = true; S.loaded = true; render(); });
  const tradeRef = id => root.child('trades/' + S.game.gid + '/' + id);
  return {
    setGame: g => root.child('game').set(g),
    resetAll: g => root.update({game:g, trades:null, makes:null}),
    addTrade: d => root.child('trades/' + S.game.gid).push(d),
    updateTrade: (id, p) => tradeRef(id).transaction(cur => (cur && cur.status === 'pending') ? {...cur, ...p} : undefined),
    acceptTrade: id => new Promise((res, rej) => tradeRef(id).transaction(
      cur => (cur && cur.status === 'pending') ? {...cur, status:'accepted', doneAt:Date.now()} : undefined,
      (err, committed) => err ? rej(err) : res(committed))),
    addMake: d => root.child('makes/' + S.game.gid).push(d),
    presence: pr => (pr ? meRef.set(pr) : meRef.remove()).catch(() => {}),
  };
}
function boot(){
  const j = loadJoin();
  S.join = j;
  if (j && window.firebase){
    try {
      S.mode = 'shared'; store = firebaseStore(j); S.canTeach = isTeacher(j);
      if (!S.canTeach && S.view === 'teacher') location.hash = 'game';
    } catch (e) { S.mode = 'local'; S.fbError = true; }
  } else if (j && !window.firebase){ S.fbError = true; }
  if (S.mode !== 'shared'){
    S.mode = 'local'; S.canTeach = true; S.loaded = true; store = localStore();
    if (!j && !location.hash) location.hash = 'setup';
  }
  render();
}

