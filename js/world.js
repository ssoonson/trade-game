/* world.js
   그리기 — 캔버스에 지도, 건물, 캐릭터를 그리고 게임 루프(frame)를 돌려요.
*/
/* ================= 그리기 (캔버스) ================= */
function rng(seed){ let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
let base = null;
function roundRect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function emoji(g, e, x, y, size){ g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }
function sign(g, text, x, y, color, size=16){
  g.font = `${size}px Jua, "Noto Sans KR", sans-serif`; const w = g.measureText(text).width + 18;
  g.fillStyle = 'rgba(0,0,0,.25)'; roundRect(g, x - w / 2, y - size * .8 + 3, w, size * 1.6, size * .8); g.fill();
  g.fillStyle = '#fffaee'; roundRect(g, x - w / 2, y - size * .8, w, size * 1.6, size * .8); g.fill();
  g.strokeStyle = color; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#4b3424'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y + 1);
}
function buildBase(){
  const c = document.createElement('canvas'); c.width = W * T; c.height = H * T;
  const g = c.getContext('2d'), R = rng(7);
  g.fillStyle = '#58c6dc'; g.fillRect(0, 0, c.width, c.height);
  // 잔물결
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < 220; i++){ const x = R() * c.width, y = R() * c.height; g.beginPath(); g.moveTo(x - 9, y); g.quadraticCurveTo(x - 4.5, y - 5, x, y); g.quadraticCurveTo(x + 4.5, y + 5, x + 9, y); g.stroke(); }
  // 섬과 광장: 둥근 모래 해안 위에 둥근 땅
  const areas = [{x:2, y:14, w:42, h:6, plaza:true}, ...NATIONS.map(n => ({x:n.rx, y:n.ry, w:12, h:10, n}))];
  for (const a of areas){
    g.fillStyle = 'rgba(30,110,140,.25)'; roundRect(g, a.x * T - 10, a.y * T - 4, a.w * T + 20, a.h * T + 20, 34); g.fill();
    g.fillStyle = '#f7e6b8'; roundRect(g, a.x * T - 10, a.y * T - 10, a.w * T + 20, a.h * T + 20, 34); g.fill();
  }
  for (const a of areas){
    g.save(); roundRect(g, a.x * T, a.y * T, a.w * T, a.h * T, 24); g.clip();
    for (let y = a.y; y < a.y + a.h; y++) for (let x = a.x; x < a.x + a.w; x++){
      const px = x * T, py = y * T;
      if (a.plaza){ g.fillStyle = ((x + y) % 2) ? '#f1e3c1' : '#eadab3'; g.fillRect(px, py, T, T); g.strokeStyle = 'rgba(160,125,80,.18)'; g.lineWidth = 1; g.strokeRect(px + .5, py + .5, T - 1, T - 1); }
      else { g.fillStyle = (R() < .5) ? a.n.ground : a.n.ground2; g.fillRect(px, py, T, T); }
    }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; roundRect(g, a.x * T + 1.5, a.y * T + 1.5, a.w * T - 3, a.h * T - 3, 23); g.stroke();
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    if (tmap[ix(x, y)] !== BRIDGE) continue;
    const px = x * T, py = y * T;
    g.fillStyle = '#c08a55'; g.fillRect(px, py - 4, T, T + 8); g.fillStyle = '#a16f3f'; for (let k = 0; k < 5; k++) g.fillRect(px, py + k * 8 - 2, T, 2);
    g.fillStyle = '#7a5130'; g.fillRect(px, py - 4, 3, T + 8); g.fillRect(px + T - 3, py - 4, 3, T + 8);
  }
  // 바닥 글씨
  g.save(); g.globalAlpha = .22; g.fillStyle = '#5b4a2e'; g.font = '44px Jua, "Noto Sans KR", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('무역 광장', 15.5 * T, 17 * T); g.restore();
  NATIONS.forEach(n => {
    const R2 = rng(n.idx * 97 + 3);
    for (let i = 0; i < 26; i++){
      const x = n.rx + .6 + R2() * 10.8, y = n.ry + .6 + R2() * 8.8;
      if (Math.abs(x - (n.rx + 6)) < 2.6 && y > n.ry + 1.8 && y < n.ry + 8.2) continue;
      if (Math.abs(x - (n.rx + 6)) < 2 && (n.top ? y > n.ry + 8 : y < n.ry + 2)) continue;
      if (x < n.rx + 5 && y < n.ry + 1.8) continue;
      if (n.plots.some(p => Math.abs(x - p.x) < 1.7 && Math.abs(y - p.y) < 1.5)) continue;
      emoji(g, n.decor[i % n.decor.length], x * T, y * T, 20);
    }
    // 성(공장)
    const bx = (n.rx + 5) * T, by = (n.ry + 3) * T;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(bx + 4, by + 8, 2 * T, 2 * T);
    g.fillStyle = '#f6f0e4'; g.fillRect(bx, by + 6, 2 * T, 2 * T - 6);
    g.strokeStyle = '#5a4a3a'; g.lineWidth = 2; g.strokeRect(bx, by + 6, 2 * T, 2 * T - 6);
    g.fillStyle = n.color; g.beginPath(); g.moveTo(bx - 8, by + 10); g.lineTo(bx + T, by - 22); g.lineTo(bx + 2 * T + 8, by + 10); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#6e4a2a'; roundRect(g, bx + T - 9, by + 2 * T - 22, 18, 22, 6); g.fill();
    g.fillStyle = '#9fd3f0'; g.fillRect(bx + 8, by + 20, 12, 10); g.fillRect(bx + 2 * T - 20, by + 20, 12, 10);
    emoji(g, '🏭', bx + T, by - 4, 18);
    sign(g, `${n.flag} ${n.name}`, (n.rx + 2.6) * T, (n.ry + .9) * T, n.color, 18);
    sign(g, '공장', bx + T, by + 2 * T + 12, n.color, 13);
    // 건물 자리 (공사 예정지)
    for (const p of n.plots){
      const px = p.x * T, py = p.y * T;
      g.fillStyle = 'rgba(150,110,60,.28)'; roundRect(g, px - 30, py - 20, 60, 34, 10); g.fill();
      g.setLineDash([5, 4]); g.strokeStyle = 'rgba(110,80,40,.6)'; g.lineWidth = 2; g.stroke(); g.setLineDash([]);
    }
    // 세관(거래소)
    const sx = n.stall.x * T, sy = n.stall.y * T;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(sx - 30, sy - 2, 64, 18);
    g.fillStyle = '#b98a58'; g.fillRect(sx - 32, sy - 6, 64, 16);
    for (let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? '#ffffff' : n.color; g.fillRect(sx - 34 + k * 11.4, sy - 34, 11.4, 14); }
    g.fillStyle = '#6e4a2a'; g.fillRect(sx - 32, sy - 20, 4, 16); g.fillRect(sx + 28, sy - 20, 4, 16);
    sign(g, `${n.flag} 세관`, sx, sy - 46, n.color, 13);
  });
  // 게시판
  const gx = BOARD.x * T, gy = BOARD.y * T;
  g.fillStyle = '#6e4a2a'; g.fillRect(gx - 22, gy - 8, 5, 22); g.fillRect(gx + 17, gy - 8, 5, 22);
  g.fillStyle = '#c89a62'; g.fillRect(gx - 28, gy - 40, 56, 34); g.strokeStyle = '#6e4a2a'; g.lineWidth = 3; g.strokeRect(gx - 28, gy - 40, 56, 34);
  g.fillStyle = '#fffaf0'; g.fillRect(gx - 20, gy - 34, 16, 20); g.fillRect(gx + 2, gy - 32, 18, 14);
  sign(g, '📜 게시판', gx, gy - 56, '#6e4a2a', 13);
  base = c;
}
/* 지은 건물 그리기 */
function drawBuilding(g, cx, cy, B, color, t, grow){
  g.save(); g.translate(cx, cy); g.scale(grow, grow);
  g.lineWidth = 2; g.strokeStyle = '#4b3424'; g.lineJoin = 'round';
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, 12, 32, 7, 0, 0, Math.PI * 2); g.fill();
  if (B.effect === 'income'){            // 공장 확장: 톱니 지붕 + 굴뚝 연기
    g.fillStyle = '#f6f0e4'; g.fillRect(-26, -16, 52, 28); g.strokeRect(-26, -16, 52, 28);
    g.fillStyle = color; g.beginPath(); g.moveTo(-28, -16); for (let k = 0; k < 4; k++){ g.lineTo(-28 + k * 14 + 14, -28); g.lineTo(-28 + k * 14 + 14, -16); } g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#8a6a55'; g.fillRect(14, -40, 8, 24); g.strokeRect(14, -40, 8, 24);
    g.fillStyle = 'rgba(255,255,255,.85)'; for (let k = 0; k < 3; k++){ const ph = (t * .6 + k / 3) % 1; g.beginPath(); g.arc(18 + ph * 10, -44 - ph * 22, 4 + ph * 5, 0, Math.PI * 2); g.globalAlpha = 1 - ph; g.fill(); } g.globalAlpha = 1;
    g.fillStyle = '#9fd3f0'; for (const x of [-18, -4, 10]) g.fillRect(x, -6, 9, 8);
  } else if (B.effect === 'tech'){       // 연구소: 둥근 지붕
    g.fillStyle = '#f6f0e4'; g.fillRect(-24, -12, 48, 24); g.strokeRect(-24, -12, 48, 24);
    g.fillStyle = '#bfe6f5'; g.beginPath(); g.arc(0, -12, 18, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = color; g.fillRect(-24, -14, 48, 5); g.strokeRect(-24, -14, 48, 5);
    g.fillStyle = '#ffd447'; g.beginPath(); g.arc(0, -24, 3 + Math.sin(t * 4) * 1, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6e4a2a'; g.fillRect(-5, 0, 10, 12);
  } else {                               // 항구: 창고 + 닻
    g.fillStyle = '#c99158'; g.fillRect(-26, -14, 52, 26); g.strokeRect(-26, -14, 52, 26);
    g.fillStyle = color; g.beginPath(); g.moveTo(-30, -14); g.lineTo(0, -30); g.lineTo(30, -14); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = '#fffaee'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -8); g.lineTo(0, 6); g.moveTo(-6, -4); g.lineTo(6, -4); g.moveTo(-8, 2); g.quadraticCurveTo(0, 10, 8, 2); g.stroke();
    g.strokeStyle = '#4b3424'; g.lineWidth = 2; g.fillStyle = '#a16f3f'; g.fillRect(28, 0, 10, 10); g.strokeRect(28, 0, 10, 10);
  }
  g.restore();
  if (grow > .95) sign(g, `${B.i} ${B.name}`, cx, cy + 26, color, 11);
}
function drawBuildings(g, t){
  const now = Date.now();
  for (const x of S.builds){
    const n = NI[x.nation], k = BUILDINGS.findIndex(B => B.id === x.b), p = n && n.plots[k];
    if (!p) continue;
    const age = Math.max(0, (now - x.at) / 700), grow = age >= 1 ? 1 : 1 - Math.pow(1 - age, 3) * (1 - .2);
    drawBuilding(g, p.x * T, p.y * T, BI[x.b], n.color, t, Math.min(1, grow));
  }
}
function drawGates(g, t){
  NATIONS.forEach(n => {
    const open = gateOpen(n.id);
    const yEnd = n.top ? 13.8 : 20.2, x0 = (n.rx + 5) * T, w = 2 * T;
    if (!open){
      const y = yEnd * T - 6;
      for (let k = 0; k < 8; k++){ g.fillStyle = k % 2 ? '#ffffff' : '#d62828'; g.fillRect(x0 + k * w / 8, y, w / 8, 10); }
      g.fillStyle = '#3a3a3a'; g.fillRect(x0 - 3, y - 6, 4, 20); g.fillRect(x0 + w - 1, y - 6, 4, 20);
    }
    if (blockedIn(round()).has(n.id) && S.game?.phase === 'play') emoji(g, '🚫', n.stall.x * T, (n.stall.y - .6) * T, 30);
    // 세관 직원
    drawChar(g, n.stall.x, n.stall.y - .1, n, '', 'down', false, t, false, .72, 'keeper-' + n.id);
  });
}
function drawWorld(cv, mode, dt, t){
  if (!base) buildBase();
  const dpr = Math.min(2, window.devicePixelRatio || 1), cw = cv.clientWidth, ch = cv.clientHeight;
  if (!cw || !ch) return null;
  if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#58c6dc'; g.fillRect(0, 0, cw, ch);
  let z, camX, camY;
  if (mode === 'follow'){
    z = Math.max(.75, Math.min(1.6, Math.min(cw / (17 * T), ch / (12 * T))));
    const vw = cw / z, vh = ch / z, ww = W * T, wh = H * T;
    camX = vw >= ww ? ww / 2 : Math.max(vw / 2, Math.min(ww - vw / 2, P.x * T));
    camY = vh >= wh ? wh / 2 : Math.max(vh / 2, Math.min(wh - vh / 2, (P.y - .6) * T));
  } else { z = Math.min(cw / (W * T), ch / (H * T)); camX = W * T / 2; camY = H * T / 2; }
  g.translate(cw / 2 - camX * z, ch / 2 - camY * z); g.scale(z, z);
  g.imageSmoothingEnabled = true; g.drawImage(base, 0, 0);
  drawBuildings(g, t);
  drawResidents(g, t);
  drawGates(g, t);
  const others = otherPlayers(dt);
  const chars = others.map(o => ({...o, you:false}));
  if (S.me) chars.push({x:P.x, y:P.y, n:S.me, nm:S.nick, ro:S.role, d:P.dir, m:P.moving, you:true});
  if (mode === 'follow' && S.near){
    const c = S.near.id === 'fac' ? NI[S.me].fac : S.near.id === 'own' ? NI[S.me].stall : S.near.id === 'board' ? BOARD : S.near.id.startsWith('stall-') ? NI[S.near.id.slice(6)].stall : null;
    if (c){ g.strokeStyle = 'rgba(255,214,0,.9)'; g.lineWidth = 4; g.beginPath(); g.arc(c.x * T, c.y * T, 26 + Math.sin(t * 5) * 4, 0, Math.PI * 2); g.stroke(); }
  }
  if (mode === 'follow' && P.target){ g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.beginPath(); g.ellipse(P.target.x * T, P.target.y * T, 10, 5, 0, 0, Math.PI * 2); g.stroke(); }
  chars.sort((a, b) => a.y - b.y).forEach(c => {
    const n = NI[c.n];
    const ri = RO[c.ro] ? RO[c.ro].i : '';
    const label = ri + (c.you ? (c.nm ? `나 · ${c.nm}` : '나') : (mode === 'overview' ? n.name.slice(0, 2) + (c.nm ? '·' + c.nm : '') : (c.nm || n.name)));
    drawChar(g, c.x, c.y, n, label, c.d, c.m, t, c.you, 1, c.you ? 'me' : c.peer);
  });
  return {z, camX, camY, cw, ch, others};
}

/* 게임 루프 */
let lastTs = 0, cam = null;
function frame(ts){
  const dt = Math.min(.05, (ts - lastTs) / 1000 || 0); lastTs = ts; P.t = ts / 1000;
  if (mounted === 'game'){
    stepPlayer(dt);
    const cv = $('#world');
    if (cv){
      cam = drawWorld(cv, 'follow', dt, P.t);
      const near = findNear(cam ? cam.others : []);
      if ((near && near.id) !== (S.near && S.near.id) || (near && S.near && near.label !== S.near.label)){ S.near = near; paintPrompt(); }
      else S.near = near;
    }
  } else if (mounted === 'teacher'){
    const cv = $('#tmap'); if (cv) drawWorld(cv, 'overview', dt, ts / 1000);
  }
  requestAnimationFrame(frame);
}
function paintPrompt(){
  const el = $('#prompt'); if (!el) return;
  if (!S.near){ el.hidden = true; return; }
  el.hidden = false; el.innerHTML = `${icon('hand')}<span>${esc(S.near.label)}</span><kbd>Space</kbd>`;
}

