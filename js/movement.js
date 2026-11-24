/* movement.js
   이동 — 키보드·터치로 캐릭터 움직이기, 벽과 다리 충돌, 친구 위치 주고받기, 가까운 건물 찾기.
*/
/* ================= 이동 · 충돌 ================= */
const keys = new Set();
const KEYMAP = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right'};
function tileOpen(tx, ty){
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return false;
  const t = tmap[ix(tx, ty)];
  if (t === WATER || t === BLD) return false;
  if (t === BRIDGE){ const n = NATIONS[town[ix(tx, ty)]]; return n.id === S.me || gateOpen(n.id); }
  return true;
}
function overlapTiles(x, y){ const r = .28, s = new Set(); for (const [px, py] of [[x-r,y-r],[x+r,y-r],[x-r,y+r],[x+r,y+r]]) s.add(Math.floor(px) + ',' + Math.floor(py)); return s; }
function canStand(x, y, cur){
  for (const k of overlapTiles(x, y)){ const [tx, ty] = k.split(',').map(Number); if (!tileOpen(tx, ty) && !cur.has(k)) return false; }
  return true;
}
function stepPlayer(dt){
  if (!S.me || S.sheet || S.picker || S.game?.paused){ P.moving = false; return; }
  let dx = 0, dy = 0;
  if (keys.has('left')) dx -= 1; if (keys.has('right')) dx += 1; if (keys.has('up')) dy -= 1; if (keys.has('down')) dy += 1;
  if (!dx && !dy && P.target){
    const tx = P.target.x - P.x, ty = P.target.y - P.y, d = Math.hypot(tx, ty);
    if (d < .12) P.target = null; else { dx = tx / d; dy = ty / d; }
  }
  const len = Math.hypot(dx, dy);
  if (!len){ if (P.moving){ P.moving = false; sendPresence(true); } return; }
  dx /= len; dy /= len;
  const sp = 4.3 * dt, cur = overlapTiles(P.x, P.y);
  let moved = false;
  if (dx && canStand(P.x + dx * sp, P.y, cur)){ P.x += dx * sp; moved = true; }
  if (dy && canStand(P.x, P.y + dy * sp, overlapTiles(P.x, P.y))){ P.y += dy * sp; moved = true; }
  if (!moved && P.target) P.target = null;
  P.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  P.moving = moved;
  if (moved) sendPresence(false);
}
let lastSent = 0, sentKey = '';
function sendPresence(force){
  if (!store || S.mode !== 'shared' || !S.online) return;
  const now = performance.now();
  if (!force && now - lastSent < 250) return;
  const pr = S.me ? {x:Math.round(P.x * 10) / 10, y:Math.round(P.y * 10) / 10, n:S.me, nm:S.nick || '', ro:S.role || '', d:P.dir, m:P.moving ? 1 : 0} : null;
  const k = JSON.stringify(pr); if (k === sentKey) return;
  sentKey = k; lastSent = now;
  store.presence(pr);
}
window.addEventListener('keydown', e => {
  if (mounted !== 'game' || e.target.closest?.('input,select,textarea')) return;
  if (e.key === 'Escape'){ if (S.sheet) ACT.close(); else if (S.picker) ACT.closePicker(); return; }
  if (S.sheet || S.picker || !S.me || S.game?.paused) return;
  const k = KEYMAP[e.key];
  if (k){ keys.add(k); P.target = null; e.preventDefault(); }
  else if ((e.key === ' ' || e.key === 'Enter') && S.near){ e.preventDefault(); S.near.go(); }
});
window.addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) keys.delete(k); });
window.addEventListener('blur', () => keys.clear());

/* 다른 친구들(실시간) */
const smooth = new Map();
function otherPlayers(dt){
  if (S.mode !== 'shared') return [];
  const out = [], seen = new Set();
  for (const [pid, pr] of Object.entries(S.players || {})){
    if (pid === myPid || !pr || typeof pr !== 'object') continue;
    const x = Number(pr.x), y = Number(pr.y);
    if (!NI[pr.n] || !isFinite(x) || !isFinite(y) || x < 0 || y < 0 || x > W || y > H) continue;
    seen.add(pid);
    let s = smooth.get(pid); if (!s){ s = {x, y}; smooth.set(pid, s); }
    const k = 1 - Math.exp(-dt * 7); s.x += (x - s.x) * k; s.y += (y - s.y) * k;
    out.push({peer:pid, x:s.x, y:s.y, n:pr.n, nm:cleanNick(pr.nm), ro:RO[pr.ro] ? pr.ro : '', d:['up','down','left','right'].includes(pr.d) ? pr.d : 'down', m:!!pr.m || Math.hypot(x - s.x, y - s.y) > .04});
  }
  for (const k of smooth.keys()) if (!seen.has(k)) smooth.delete(k);
  return out;
}

/* 가까운 곳 확인 */
function findNear(others){
  if (!S.me || S.sheet || S.picker) return null;
  const me = NI[S.me];
  if (dist(P, me.fac) < 2) return {id:'fac', label:'우리 공장 들어가기', go:() => openSheet({type:'factory'})};
  if (dist(P, me.stall) < 1.9) return {id:'own', label:'우리 세관: 들어온 제안 보기', go:() => openSheet({type:'offers'})};
  { const i = nearResident(S.me, P.t); if (i >= 0) return {id:'res-' + i, label:`주민 ${RESIDENT_NAMES[i % RESIDENT_NAMES.length]}의 부탁 듣기`, go:() => openSheet({type:'resident', slot:i})}; }
  if (dist(P, BOARD) < 1.7) return {id:'board', label:'게시판 보기', go:() => openSheet({type:'board'})};
  for (const n of NATIONS) if (n.id !== S.me && dist(P, n.stall) < 1.9)
    return {id:'stall-' + n.id, label: gateOpen(n.id) ? `${n.name} 세관에서 거래하기` : `${n.name} 세관 전시판 보기`, go:() => openSheet({type:'trade', to:n.id})};
  let best = null, bd = 1.5;
  for (const o of others) if (o.n !== S.me){ const d = dist(P, o); if (d < bd){ bd = d; best = o; } }
  if (best){ const n = NI[best.n]; return {id:'p-' + best.peer, label:`${best.nm ? best.nm + ' · ' : ''}${n.name}와 거래하기`, go:() => openSheet({type:'trade', to:n.id})}; }
  return null;
}

