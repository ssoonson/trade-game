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
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = SEA; g.fillRect(0, 0, cw, ch);
  let z, camX, camY;
  if (mode === 'follow'){
    z = Math.max(.75, Math.min(1.6, Math.min(cw / (17 * T), ch / (12 * T))));
    const vw = cw / z, vh = ch / z, ww = W * T, wh = H * T;
    camX = vw >= ww ? ww / 2 : Math.max(vw / 2, Math.min(ww - vw / 2, P.x * T));
    camY = vh >= wh ? wh / 2 : Math.max(vh / 2, Math.min(wh - vh / 2, (P.y - .6) * T));
  } else { z = Math.min(cw / (W * T), ch / (H * T)); camX = W * T / 2; camY = H * T / 2; }
  g.translate(cw / 2 - camX * z, ch / 2 - camY * z); g.scale(z, z);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(base, 0, 0, W * T, H * T);
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

