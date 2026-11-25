/* scenery.js
   지도 배경 — 아늑한 섬 마을 풍경을 직접 그려요.
   둥근 섬, 섬 아래 흙 절벽, 모래사장과 얕은 물, 흙길, 나무·꽃·바위, 공장·세관·게시판.
   한 번만 그려서(base) 매 프레임 그대로 붙여요. 캐릭터·주민·지은 건물은 world.js 에서 그려요.
   나라마다 놓이는 소품은 아래 PROPS 에서 바꿔요. 땅 색은 js/data/game-data.js 의 ground 예요. */

const SCN = 2;                       // 배경을 2배 크기로 그려 태블릿에서도 또렷하게
const SEA = '#5ccbdc', SEA_DEEP = '#4bbdd3', SHALLOW = '#9ee4e4', SAND = '#f6e6b9', FOAM = '#ffffff';
const INK = '#4b3424';
/* 나라별 절벽 색 (섬 아래로 보이는 흙벽) */
const CLIFF = {field:'#b07f4e', wave:'#dcc08a', rock:'#8e8070', fire:'#c48650', forest:'#a2744a', gear:'#9a9bb4'};
/* 나라별 소품: [그리기 이름, 개수] */
const PROPS = {
  field:  [['wheat', 9], ['sunflower', 4], ['round', 2], ['flower:#fff6d8', 6], ['flower:#ffd447', 5], ['bush:#8ec95e', 2]],
  wave:   [['palm', 5], ['shell', 4], ['star', 3], ['flower:#ff7a6b', 5], ['bush:#9bd06a', 2], ['pebble', 4]],
  rock:   [['boulder', 7], ['cedar', 5], ['pebble', 8], ['gem', 2], ['flower:#c9b6ff', 3]],
  fire:   [['cactus', 6], ['barrel', 3], ['boulder:#d49a63', 3], ['dune', 6], ['flower:#ff9a4d', 3]],
  forest: [['round:#4f9d4c', 7], ['cedar', 5], ['mushroom', 4], ['flower:#ffffff', 4], ['flower:#ff9ec4', 4], ['bush:#5fae55', 2]],
  gear:   [['lamp', 4], ['cog', 3], ['crate', 3], ['bush:#8fb8a6', 3], ['flower:#b69cff', 5], ['panel', 2]],
};

/* ---------- 도우미 ---------- */
function mix(hex, to, p){
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const c = [16, 8, 0].map(s => Math.round(((a >> s) & 255) + ((((b >> s) & 255) - ((a >> s) & 255)) * p)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const lighten = (h, p) => mix(h, '#ffffff', p), darken = (h, p) => mix(h, '#2b1d12', p);
/* 울퉁불퉁한 둥근 덩어리 (풀숲, 흙길, 바위) */
function blob(g, cx, cy, rx, ry, R, k = 8, j = .16){
  const p = []; for (let i = 0; i < k; i++){ const a = i / k * Math.PI * 2, s = 1 + (R() - .5) * 2 * j; p.push([cx + Math.cos(a) * rx * s, cy + Math.sin(a) * ry * s]); }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  g.beginPath(); const m0 = mid(p[k - 1], p[0]); g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < k; i++){ const q = mid(p[i], p[(i + 1) % k]); g.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
  g.closePath();
}
const shadow = (g, x, y, rx, ry = rx * .38, a = .18) => { g.fillStyle = `rgba(60,40,20,${a})`; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
const circle = (g, x, y, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };

/* ---------- 소품 ---------- */
const DRAW = {
  round(g, x, y, R, c = '#6dba57'){                    // 둥근 활엽수
    shadow(g, x, y + 2, 17);
    g.fillStyle = '#8a5a35'; roundRect(g, x - 4, y - 16, 8, 18, 3); g.fill();
    const d = darken(c, .22), l = lighten(c, .28);
    circle(g, x, y - 26, 17, d); circle(g, x - 9, y - 22, 12, d); circle(g, x + 9, y - 22, 12, d);
    circle(g, x, y - 29, 15, c); circle(g, x - 8, y - 24, 10, c); circle(g, x + 8, y - 25, 10, c);
    circle(g, x - 5, y - 34, 6, l); circle(g, x + 3, y - 36, 3.5, lighten(c, .45));
    if (R() < .5){ circle(g, x + 7, y - 24, 2.6, '#e8564a'); circle(g, x - 8, y - 27, 2.6, '#e8564a'); }
  },
  cedar(g, x, y){                                       // 뾰족한 침엽수
    shadow(g, x, y + 2, 13);
    g.fillStyle = '#7a4f2e'; g.fillRect(x - 3, y - 8, 6, 10);
    const tiers = [[0, 15, '#3f8a4f'], [-11, 12, '#4a9b58'], [-21, 9, '#58ab63']];
    for (const [oy, w, c] of tiers){ g.fillStyle = c; g.beginPath(); g.moveTo(x - w, y - 6 + oy); g.quadraticCurveTo(x, y - 2 + oy, x + w, y - 6 + oy); g.lineTo(x, y - 24 + oy); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(x - 1, y - 43); g.lineTo(x - 6, y - 30); g.lineTo(x - 1, y - 31); g.fill();
  },
  palm(g, x, y){                                        // 야자나무
    shadow(g, x + 4, y + 2, 15);
    g.strokeStyle = '#b07a46'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 9, y - 18, x + 4, y - 38); g.stroke();
    g.strokeStyle = '#8f5f33'; g.lineWidth = 1.5; for (let k = 1; k < 6; k++){ const t = k / 6, px = x + 9 * 2 * t * (1 - t) + 4 * t * t, py = y - 38 * t; g.beginPath(); g.moveTo(px - 3, py); g.lineTo(px + 3, py - 1); g.stroke(); }
    const tx = x + 4, ty = y - 38;
    for (const [a, c] of [[-2.7, '#3f9a4c'], [-.45, '#3f9a4c'], [-1.95, '#4fb05a'], [-1.15, '#4fb05a'], [2.6, '#46a352'], [.5, '#46a352']]){
      g.fillStyle = c; g.save(); g.translate(tx, ty); g.rotate(a); g.beginPath(); g.ellipse(13, 0, 15, 5.5, .25, 0, Math.PI * 2); g.fill(); g.restore();
    }
    circle(g, tx - 3, ty + 3, 3.2, '#8a5a35'); circle(g, tx + 3, ty + 4, 3.2, '#7a4d2c');
  },
  cactus(g, x, y){                                      // 선인장
    shadow(g, x, y + 2, 11);
    const c = '#5aa55a', l = '#7cc06f';
    g.fillStyle = c; roundRect(g, x - 6, y - 30, 12, 32, 6); g.fill();
    roundRect(g, x - 15, y - 22, 6, 12, 3); g.fill(); g.fillRect(x - 12, y - 14, 7, 5);
    roundRect(g, x + 9, y - 26, 6, 13, 3); g.fill(); g.fillRect(x + 5, y - 17, 7, 5);
    g.fillStyle = l; g.fillRect(x - 2, y - 27, 2, 26); g.fillRect(x + 2, y - 26, 1.5, 24);
    circle(g, x + 1, y - 31, 3.4, '#ff8fb1'); circle(g, x + 1, y - 31, 1.4, '#ffd447');
  },
  boulder(g, x, y, R, c = '#a39c91'){                  // 바위
    shadow(g, x, y + 1, 13);
    g.fillStyle = darken(c, .18); blob(g, x, y - 7, 14, 10, R, 7, .12); g.fill();
    g.fillStyle = c; blob(g, x - 1, y - 9, 12, 8, R, 7, .12); g.fill();
    g.fillStyle = lighten(c, .35); g.beginPath(); g.ellipse(x - 5, y - 12, 4.5, 2.4, -.4, 0, Math.PI * 2); g.fill();
  },
  pebble(g, x, y, R){ const c = ['#b9ae9c', '#a89f92', '#c8bba6'][Math.floor(R() * 3)]; g.fillStyle = c; g.beginPath(); g.ellipse(x, y, 4 + R() * 2, 2.6 + R(), R(), 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - 1, y - 1, 1.6, .9, 0, 0, Math.PI * 2); g.fill(); },
  gem(g, x, y){ shadow(g, x, y + 1, 9); for (const [dx, h, c] of [[-5, 14, '#7fd0f0'], [0, 20, '#a7e3f7'], [5, 12, '#6cc0e6']]){ g.fillStyle = c; g.beginPath(); g.moveTo(x + dx - 3.5, y); g.lineTo(x + dx - 3.5, y - h + 5); g.lineTo(x + dx, y - h); g.lineTo(x + dx + 3.5, y - h + 5); g.lineTo(x + dx + 3.5, y); g.closePath(); g.fill(); } g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(x - 1, y - 16, 1.5, 8); },
  wheat(g, x, y){                                       // 밀 다발
    for (let k = -2; k <= 2; k++){
      const bx = x + k * 3.4, top = y - 18 - Math.abs(k) * -1.5;
      g.strokeStyle = '#c9a23a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + k, y); g.quadraticCurveTo(bx, y - 8, bx + k * .6, top); g.stroke();
      g.fillStyle = k % 2 ? '#e8bf45' : '#f2cf5b'; g.beginPath(); g.ellipse(bx + k * .6, top - 3, 2.4, 5.2, k * .12, 0, Math.PI * 2); g.fill();
    }
  },
  sunflower(g, x, y){ g.strokeStyle = '#5f9e44'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 20); g.stroke(); g.fillStyle = '#6fb050'; g.beginPath(); g.ellipse(x + 5, y - 9, 5, 2.4, -.5, 0, Math.PI * 2); g.fill(); for (let k = 0; k < 10; k++){ const a = k / 10 * Math.PI * 2; circle(g, x + Math.cos(a) * 6, y - 24 + Math.sin(a) * 6, 3.4, '#ffcf2e'); } circle(g, x, y - 24, 4.4, '#8a5326'); },
  flower(g, x, y, R, c = '#ffffff'){                    // 작은 꽃 무리
    for (let i = 0; i < 3; i++){
      const fx = x + (R() - .5) * 14, fy = y + (R() - .5) * 8;
      g.fillStyle = '#5ea24a'; g.beginPath(); g.ellipse(fx + 2.5, fy + 2, 3, 1.4, .4, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 5; k++){ const a = k / 5 * Math.PI * 2 + i; circle(g, fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 2.2, c); }
      circle(g, fx, fy, 1.5, c === '#ffd447' ? '#f08a24' : '#ffd447');
    }
  },
  bush(g, x, y, R, c = '#7cc45e'){ shadow(g, x, y + 1, 14); g.fillStyle = darken(c, .2); blob(g, x, y - 7, 15, 9, R, 7, .2); g.fill(); g.fillStyle = c; blob(g, x - 1, y - 9, 12, 7, R, 7, .2); g.fill(); circle(g, x - 5, y - 12, 2.6, lighten(c, .35)); },
  shell(g, x, y){ g.fillStyle = '#ffd9cf'; g.beginPath(); g.moveTo(x - 6, y); g.quadraticCurveTo(x, y - 12, x + 6, y); g.closePath(); g.fill(); g.strokeStyle = '#e9a89a'; g.lineWidth = 1; for (const dx of [-3, 0, 3]){ g.beginPath(); g.moveTo(x, y - 1); g.lineTo(x + dx, y - 7); g.stroke(); } },
  star(g, x, y){ g.fillStyle = '#ff9d5c'; g.beginPath(); for (let k = 0; k < 10; k++){ const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 2.6 : 6.5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); circle(g, x, y, 1.2, '#ffd9b0'); },
  mushroom(g, x, y){ shadow(g, x, y + 1, 7); g.fillStyle = '#f6ecd8'; roundRect(g, x - 3, y - 8, 6, 9, 2); g.fill(); g.fillStyle = '#e4553f'; g.beginPath(); g.ellipse(x, y - 8, 8, 6, 0, Math.PI, 0); g.fill(); circle(g, x - 3, y - 11, 1.5, '#fff'); circle(g, x + 3, y - 10, 1.2, '#fff'); },
  barrel(g, x, y){ shadow(g, x, y + 1, 10); g.fillStyle = '#a4552d'; roundRect(g, x - 8, y - 20, 16, 21, 4); g.fill(); g.fillStyle = '#7d3c1d'; g.fillRect(x - 8, y - 15, 16, 2.5); g.fillRect(x - 8, y - 6, 16, 2.5); g.fillStyle = '#c56d3e'; g.beginPath(); g.ellipse(x, y - 20, 8, 3, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3a2416'; circle(g, x + 3, y - 20, 1.6, '#3a2416'); },
  dune(g, x, y){ g.strokeStyle = 'rgba(180,120,60,.35)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 14, y); g.quadraticCurveTo(x - 4, y - 6, x + 6, y - 1); g.quadraticCurveTo(x + 11, y + 1, x + 15, y - 2); g.stroke(); },
  lamp(g, x, y){ shadow(g, x, y + 1, 7); g.fillStyle = '#5d5a78'; g.fillRect(x - 1.6, y - 30, 3.2, 31); roundRect(g, x - 4, y - 3, 8, 4, 2); g.fill(); g.fillStyle = 'rgba(255,224,120,.35)'; circle(g, x, y - 33, 9, 'rgba(255,224,120,.3)'); g.fillStyle = '#ffe9a6'; roundRect(g, x - 4.5, y - 38, 9, 9, 3); g.fill(); g.fillStyle = '#5d5a78'; roundRect(g, x - 6, y - 40, 12, 3, 1.5); g.fill(); },
  cog(g, x, y){ shadow(g, x, y + 1, 12); g.fillStyle = '#8d8fae'; roundRect(g, x - 8, y - 6, 16, 7, 2); g.fill(); g.save(); g.translate(x, y - 18); g.fillStyle = '#b3b5cf'; g.beginPath(); for (let k = 0; k < 16; k++){ const a = k / 16 * Math.PI * 2, r = k % 2 ? 9 : 12; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); circle(g, 0, 0, 4.2, '#8d8fae'); circle(g, -3, -4, 2, 'rgba(255,255,255,.5)'); g.restore(); },
  crate(g, x, y){ shadow(g, x, y + 1, 11); g.fillStyle = '#c99a62'; roundRect(g, x - 9, y - 16, 18, 17, 3); g.fill(); g.strokeStyle = '#9b6e3e'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 7, y - 14); g.lineTo(x + 7, y - 1); g.moveTo(x + 7, y - 14); g.lineTo(x - 7, y - 1); g.stroke(); },
  panel(g, x, y){ shadow(g, x, y + 1, 13); g.fillStyle = '#6a6c86'; g.fillRect(x - 1.5, y - 10, 3, 10); g.fillStyle = '#3f62a8'; g.beginPath(); g.moveTo(x - 14, y - 10); g.lineTo(x + 14, y - 10); g.lineTo(x + 10, y - 24); g.lineTo(x - 10, y - 24); g.closePath(); g.fill(); g.strokeStyle = '#8fb4f0'; g.lineWidth = 1; for (const t of [.33, .66]){ g.beginPath(); g.moveTo(x - 14 + 4 * t * 3 / 3, y - 10 - 14 * t); g.lineTo(x + 14 - 4 * t, y - 10 - 14 * t); g.stroke(); } g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x, y - 24); g.stroke(); },
};
/* 키 큰 소품은 탐험가보다 크게 그려요 */
const PROP_SCALE = {round:1.7, cedar:1.65, palm:1.6, cactus:1.45, sunflower:1.3, lamp:1.4, boulder:1.3, cog:1.3, panel:1.2, crate:1.2, barrel:1.2, bush:1.25, wheat:1.3, gem:1.2, mushroom:1.2};
function drawProp(g, spec, x, y, R){
  const [name, col] = spec.split(':'), f = DRAW[name]; if (!f) return;
  const k = PROP_SCALE[name] || 1; g.save(); g.translate(x, y); g.scale(k, k); f(g, 0, 0, R, col); g.restore();
}

/* ---------- 땅 ---------- */
function drawShore(g, a, R){
  const x = a.x * T, y = a.y * T, w = a.w * T, h = a.h * T;
  // 얕은 물 → 거품 → 모래사장
  g.fillStyle = 'rgba(158,228,228,.55)'; roundRect(g, x - 34, y - 28, w + 68, h + 70, 58); g.fill();
  g.fillStyle = 'rgba(190,240,236,.6)'; roundRect(g, x - 22, y - 16, w + 44, h + 48, 48); g.fill();
  g.fillStyle = SAND; roundRect(g, x - 14, y - 10, w + 28, h + 34, 42); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.setLineDash([18, 9]); roundRect(g, x - 16, y - 12, w + 32, h + 38, 44); g.stroke(); g.setLineDash([]);
  // 모래 알갱이
  for (let i = 0; i < (w + h) / 9; i++){
    const t = R(), side = R();
    const px = side < .5 ? x - 8 + t * (w + 16) : (side < .75 ? x - 8 : x + w + 8), py = side < .5 ? y + h + 8 + R() * 14 : y + t * h;
    circle(g, px, py, 1.2, 'rgba(200,160,90,.35)');
  }
}
function drawCliffTop(g, a, R){
  const x = a.x * T, y = a.y * T, w = a.w * T, h = a.h * T;
  const ground = a.plaza ? '#efe1bd' : a.n.ground, cliff = a.plaza ? '#c9ad7c' : (CLIFF[a.n.id] || darken(ground, .4));
  // 절벽 (섬 아래쪽으로 보이는 흙벽)
  g.fillStyle = darken(cliff, .25); roundRect(g, x, y + 8, w, h + 10, 26); g.fill();
  g.fillStyle = cliff; roundRect(g, x, y + 4, w, h + 8, 26); g.fill();
  g.strokeStyle = darken(cliff, .18); g.lineWidth = 2; g.lineCap = 'round';
  for (let px = x + 14; px < x + w - 10; px += 11 + R() * 8){ const len = 4 + R() * 6; g.beginPath(); g.moveTo(px, y + h + 2); g.lineTo(px + (R() - .5) * 2, y + h + 2 + len); g.stroke(); }
  // 윗면
  g.save(); roundRect(g, x, y, w, h, 24); g.clip();
  g.fillStyle = ground; g.fillRect(x, y, w, h);
  if (a.plaza) drawCobbles(g, a, R);
  else {
    const g2 = a.n.ground2;
    for (let i = 0; i < 9; i++){ g.fillStyle = g2; blob(g, x + R() * w, y + R() * h, 30 + R() * 40, 18 + R() * 22, R, 9, .22); g.fill(); }
    for (let i = 0; i < 6; i++){ g.fillStyle = lighten(ground, .16); blob(g, x + R() * w, y + R() * h, 22 + R() * 26, 12 + R() * 14, R, 8, .2); g.fill(); }
    // 풀 무늬
    const tuft = darken(ground, .14);
    g.strokeStyle = tuft; g.lineWidth = 1.6; g.lineCap = 'round';
    for (let i = 0; i < a.w * a.h * .9; i++){ const px = x + R() * w, py = y + R() * h; g.beginPath(); g.moveTo(px - 3, py - 3); g.lineTo(px - 1, py + 1); g.lineTo(px + 1, py - 4); g.lineTo(px + 2.5, py + 1); g.stroke(); }
    if (a.n.id === 'gear'){ g.strokeStyle = 'rgba(110,112,150,.18)'; g.lineWidth = 1.5; for (let yy = y + 16; yy < y + h; yy += 32){ g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); } }
  }
  g.restore();
  g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 3; roundRect(g, x + 2, y + 2, w - 4, h - 4, 22); g.stroke();
}
function drawCobbles(g, a, R){
  const x = a.x * T, y = a.y * T, w = a.w * T, h = a.h * T, s = 21;
  g.fillStyle = '#ddc89c'; g.fillRect(x, y, w, h);
  for (let row = 0, py = y + 2; py < y + h; row++, py += s * .78){
    for (let px = x + (row % 2 ? s / 2 : 0) - s / 2; px < x + w + s; px += s){
      const c = ['#efe1bd', '#ebdbb3', '#f3e7c8', '#e6d4a9'][Math.floor(R() * 4)];
      g.fillStyle = c; roundRect(g, px + 1.5 + (R() - .5) * 2, py + 1.5, s - 4, s * .78 - 3.5, 6); g.fill();
    }
  }
}
/* 흙길: 둥근 흙 덩어리를 이어서 그려요 */
function drawPath(g, pts, R, wdt = 22){
  const steps = [];
  for (let i = 0; i < pts.length - 1; i++){ const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 9); for (let k = 0; k <= n; k++) steps.push([x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n]); }
  g.fillStyle = '#c9ab72'; for (const [x, y] of steps){ blob(g, x, y + 2, wdt + 2, wdt * .8, R, 7, .12); g.fill(); }
  g.fillStyle = '#e2c991'; for (const [x, y] of steps){ blob(g, x, y, wdt, wdt * .72, R, 7, .12); g.fill(); }
  for (let i = 0; i < steps.length; i += 2){ const [x, y] = steps[i]; circle(g, x + (R() - .5) * wdt, y + (R() - .5) * wdt * .6, 1.3, 'rgba(150,110,60,.35)'); }
}

/* ---------- 건물과 시설 ---------- */
function drawHouse(g, n){                               // 우리 나라 공장 (탐험가보다 크게)
  g.save(); g.translate((n.rx + 6) * T, (n.ry + 5) * T); g.scale(1.45, 1.45);
  const cx = 0, base = 0, c = n.color;
  shadow(g, cx, base + 2, 40, 9, .22);
  // 벽
  g.fillStyle = '#fbf3e1'; roundRect(g, cx - 30, base - 40, 60, 42, 9); g.fill();
  g.fillStyle = '#efe2c4'; roundRect(g, cx - 30, base - 8, 60, 10, 5); g.fill();
  // 굴뚝
  g.fillStyle = '#b5644a'; roundRect(g, cx + 14, base - 74, 10, 22, 2); g.fill(); g.fillStyle = '#93503a'; g.fillRect(cx + 12, base - 76, 14, 5);
  // 지붕 (둥근 기와)
  g.fillStyle = darken(c, .18); g.beginPath(); g.moveTo(cx - 40, base - 34); g.quadraticCurveTo(cx - 38, base - 30, cx - 34, base - 30); g.lineTo(cx + 34, base - 30); g.quadraticCurveTo(cx + 38, base - 30, cx + 40, base - 34); g.lineTo(cx + 8, base - 66); g.quadraticCurveTo(cx, base - 72, cx - 8, base - 66); g.closePath(); g.fill();
  g.fillStyle = c; g.beginPath(); g.moveTo(cx - 37, base - 36); g.lineTo(cx + 37, base - 36); g.lineTo(cx + 7, base - 66); g.quadraticCurveTo(cx, base - 71, cx - 7, base - 66); g.closePath(); g.fill();
  g.strokeStyle = darken(c, .12); g.lineWidth = 2;
  for (const yy of [-44, -52, -60]){ const half = (yy + 66) / 30 * 37 + 2; g.beginPath(); for (let px = cx - half; px < cx + half - 4; px += 9) g.arc(px + 4.5, base + yy, 4.5, 0, Math.PI); g.stroke(); }
  g.fillStyle = lighten(c, .35); g.beginPath(); g.moveTo(cx - 4, base - 64); g.lineTo(cx - 20, base - 48); g.lineTo(cx - 14, base - 48); g.closePath(); g.fill();
  // 톱니 간판
  g.save(); g.translate(cx, base - 48); g.fillStyle = '#fff6dc'; g.beginPath(); for (let k = 0; k < 16; k++){ const a = k / 16 * Math.PI * 2, r = k % 2 ? 7 : 9; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); circle(g, 0, 0, 3, c); g.restore();
  // 문, 창문
  g.fillStyle = '#8a5a35'; g.beginPath(); g.moveTo(cx - 9, base); g.lineTo(cx - 9, base - 18); g.arc(cx, base - 18, 9, Math.PI, 0); g.lineTo(cx + 9, base); g.closePath(); g.fill();
  circle(g, cx + 5, base - 9, 1.6, '#ffd447');
  for (const wx of [cx - 20, cx + 20]){ circle(g, wx, base - 22, 7.5, '#fbf3e1'); circle(g, wx, base - 22, 6, '#a8dcf2'); g.strokeStyle = '#fbf3e1'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(wx - 6, base - 22); g.lineTo(wx + 6, base - 22); g.moveTo(wx, base - 28); g.lineTo(wx, base - 16); g.stroke(); circle(g, wx - 2.5, base - 25, 1.6, 'rgba(255,255,255,.8)'); }
  // 화단
  for (const fx of [cx - 24, cx + 24]){ g.fillStyle = '#9b6b40'; roundRect(g, fx - 7, base - 1, 14, 6, 2); g.fill(); DRAW.flower(g, fx, base - 3, rng(fx + 50), '#ff8fb1'); }
  g.restore();
}
function drawStall(g, n){                               // 세관 가게
  const sx = n.stall.x * T, sy = n.stall.y * T, c = n.color;
  shadow(g, sx, sy + 12, 38, 8, .2);
  g.fillStyle = '#7a4f2e'; g.fillRect(sx - 31, sy - 34, 4, 40); g.fillRect(sx + 27, sy - 34, 4, 40);
  // 차양 (물결 모양 줄무늬)
  for (let k = 0; k < 6; k++){ g.fillStyle = k % 2 ? '#fffaee' : c; g.beginPath(); g.moveTo(sx - 36 + k * 12, sy - 44); g.lineTo(sx - 24 + k * 12, sy - 44); g.lineTo(sx - 24 + k * 12, sy - 32); g.arc(sx - 30 + k * 12, sy - 32, 6, 0, Math.PI); g.closePath(); g.fill(); }
  g.fillStyle = darken(c, .2); roundRect(g, sx - 38, sy - 48, 76, 6, 3); g.fill();
  // 계산대
  g.fillStyle = '#c99560'; roundRect(g, sx - 34, sy - 6, 68, 18, 4); g.fill();
  g.fillStyle = '#b07f4e'; for (const yy of [sy, sy + 6]) g.fillRect(sx - 34, yy, 68, 1.6);
  g.fillStyle = '#e3bd85'; roundRect(g, sx - 36, sy - 9, 72, 6, 3); g.fill();
  // 상자
  g.fillStyle = '#b98a58'; roundRect(g, sx + 18, sy + 4, 14, 11, 2); g.fill(); g.fillStyle = '#d6aa73'; g.fillRect(sx + 18, sy + 4, 14, 3);
}
function drawBoard(g){                                  // 광장 게시판
  const gx = BOARD.x * T, gy = BOARD.y * T;
  shadow(g, gx, gy + 12, 34, 7, .2);
  g.fillStyle = '#7a4f2e'; roundRect(g, gx - 26, gy - 30, 6, 44, 2); g.fill(); roundRect(g, gx + 20, gy - 30, 6, 44, 2); g.fill();
  g.fillStyle = '#9b6b40'; g.beginPath(); g.moveTo(gx - 36, gy - 40); g.lineTo(gx, gy - 54); g.lineTo(gx + 36, gy - 40); g.closePath(); g.fill();
  g.fillStyle = '#b98a58'; roundRect(g, gx - 30, gy - 40, 60, 38, 5); g.fill();
  g.fillStyle = '#e8c48c'; roundRect(g, gx - 25, gy - 35, 50, 28, 3); g.fill();
  for (const [dx, dy, w, h, col, rot] of [[-20, -32, 15, 18, '#fffaee', -.08], [-2, -33, 17, 13, '#ffe08a', .06], [-1, -18, 14, 10, '#bfe6f5', -.05], [14, -31, 9, 20, '#ffd1dc', .05]]){
    g.save(); g.translate(gx + dx + w / 2, gy + dy + h / 2); g.rotate(rot); g.fillStyle = col; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(120,90,60,.35)'; for (let k = 0; k < 3 && h > 12; k++) g.fillRect(-w / 2 + 3, -h / 2 + 5 + k * 4, w - 6, 1.2); circle(g, 0, -h / 2 + 1.5, 1.8, '#e4553f'); g.restore();
  }
}
function drawBridge(g, x0, y0, rows){                   // 나무 다리 (위아래로 놓인 다리)
  const x = x0 * T, y = y0 * T - 12, w = 2 * T, h = rows * T + 24;
  g.fillStyle = 'rgba(30,110,140,.28)'; roundRect(g, x - 4, y + 8, w + 8, h, 6); g.fill();
  g.fillStyle = '#c99560'; roundRect(g, x, y, w, h, 5); g.fill();
  for (let yy = y + 4; yy < y + h - 2; yy += 9){ g.fillStyle = '#b07f4e'; g.fillRect(x + 3, yy, w - 6, 1.8); g.fillStyle = '#ddb07a'; g.fillRect(x + 3, yy + 2, w - 6, 1.2); }
  g.fillStyle = '#9b6b40'; g.fillRect(x, y, 4, h); g.fillRect(x + w - 4, y, 4, h);
  for (const px of [x + 2, x + w - 2]) for (const py of [y + 2, y + h - 4]){ circle(g, px, py, 4.5, '#7a4f2e'); circle(g, px - 1, py - 1.5, 1.6, '#a77a4f'); }
  g.strokeStyle = '#e8d6a8'; g.lineWidth = 2; for (const px of [x + 2, x + w - 2]){ g.beginPath(); g.moveTo(px, y + 2); g.quadraticCurveTo(px, y + h / 2 + 4, px, y + h - 4); g.stroke(); }
}
function drawPlot(g, p){                                // 건물 지을 자리
  const px = p.x * T, py = p.y * T;
  g.fillStyle = '#c9ab72'; roundRect(g, px - 30, py - 18, 60, 34, 9); g.fill();
  g.fillStyle = '#d9bd84'; roundRect(g, px - 28, py - 18, 56, 30, 8); g.fill();
  g.strokeStyle = 'rgba(255,250,238,.9)'; g.lineWidth = 1.6; g.setLineDash([4, 3]); g.strokeRect(px - 24, py - 14, 48, 24); g.setLineDash([]);
  for (const [sx, sy] of [[-24, -14], [24, -14], [-24, 10], [24, 10]]){ g.fillStyle = '#8a5a35'; g.fillRect(px + sx - 1.5, py + sy - 6, 3, 8); circle(g, px + sx, py + sy - 6, 2, '#e4553f'); }
}
function drawEmblem(g, cx, cy){                         // 광장 한가운데 무늬
  circle(g, cx, cy, 52, '#e6d2a4'); circle(g, cx, cy, 46, '#f6ebcf');
  const cs = ['#7cc0d8', '#ffd447', '#8fd07a', '#ff9e8a'];
  for (let k = 0; k < 8; k++){ const a = k / 8 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 24 : 40; g.fillStyle = cs[k % 4]; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - .2) * 12, cy + Math.sin(a - .2) * 12); g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); g.lineTo(cx + Math.cos(a + .2) * 12, cy + Math.sin(a + .2) * 12); g.closePath(); g.fill(); }
  circle(g, cx, cy, 10, '#fffaee'); circle(g, cx, cy, 5, '#e3a23a');
}
function drawPlanter(g, x, y, R){ g.fillStyle = '#b07f4e'; roundRect(g, x - 22, y - 6, 44, 14, 5); g.fill(); g.fillStyle = '#8a5a35'; g.fillRect(x - 22, y + 3, 44, 5); g.fillStyle = '#6fb050'; blob(g, x, y - 8, 20, 8, R, 7, .2); g.fill(); DRAW.flower(g, x - 9, y - 9, R, '#ff8fb1'); DRAW.flower(g, x + 9, y - 10, R, '#ffd447'); }

/* ---------- 배경 한 장 만들기 ---------- */
function buildBase(){
  const c = document.createElement('canvas'); c.width = W * T * SCN; c.height = H * T * SCN;
  const g = c.getContext('2d'); g.scale(SCN, SCN);
  const R = rng(7);
  // 바다
  const grad = g.createLinearGradient(0, 0, 0, H * T); grad.addColorStop(0, SEA); grad.addColorStop(1, SEA_DEEP);
  g.fillStyle = grad; g.fillRect(0, 0, W * T, H * T);
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2.4; g.lineCap = 'round';
  for (let i = 0; i < 120; i++){ const x = R() * W * T, y = R() * H * T; g.beginPath(); g.moveTo(x - 7, y); g.quadraticCurveTo(x, y - 5, x + 7, y); g.stroke(); }
  const areas = [{x:2, y:14, w:42, h:6, plaza:true}, ...NATIONS.map(n => ({x:n.rx, y:n.ry, w:12, h:10, n}))];
  for (const a of areas) drawShore(g, a, R);
  for (const a of areas) drawCliffTop(g, a, R);
  NATIONS.forEach(n => drawBridge(g, n.rx + 5, n.top ? 12 : 20, 2));
  // 광장
  drawEmblem(g, 21 * T, 17 * T);
  for (const x of [5, 36]) drawPlanter(g, x * T, 17.4 * T, R);
  // 섬마다
  NATIONS.forEach(n => {
    const R2 = rng(n.idx * 97 + 3), cx = (n.rx + 6) * T;
    drawPath(g, n.top ? [[cx, (n.ry + 5.1) * T], [cx, (n.ry + 10) * T]] : [[cx, (n.ry + 5.1) * T], [cx, n.ry * T]], R2);
    for (const p of n.plots) drawPlot(g, p);
    // 소품: 길·공장·건물 자리·이름표를 피해 놓아요
    const list = [];
    for (const [spec, count] of PROPS[n.id] || []){
      let placed = 0, tries = 0;
      while (placed < count && tries++ < 80){
        const x = n.rx + .7 + R2() * 10.6, y = n.ry + 1 + R2() * 8.6;
        if (Math.abs(x - (n.rx + 6)) < 2.8 && y > n.ry + 1.4 && y < n.ry + 6.4) continue;   // 공장
        if (Math.abs(x - (n.rx + 6)) < 1.5) continue;                                       // 흙길
        if (x < n.rx + 5.2 && y < n.ry + 2) continue;                                       // 나라 이름표
        if (n.plots.some(p => Math.abs(x - p.x) < 1.6 && Math.abs(y - p.y) < 1.4)) continue;
        const big = (PROP_SCALE[spec.split(':')[0]] || 1) > 1.35;
        if (list.some(o => Math.hypot(o.x - x, o.y - y) < (big || o.big ? 1.5 : .9))) continue;
        if (big && y < n.ry + 2.2) continue;                                                // 위쪽 가장자리에서 잘리지 않게
        list.push({spec, x, y, big}); placed++;
      }
    }
    list.sort((a, b) => a.y - b.y).forEach(o => drawProp(g, o.spec, o.x * T, o.y * T, R2));
    drawHouse(g, n);
    drawStall(g, n);
    sign(g, `${n.flag} ${n.name}`, (n.rx + 2.6) * T, (n.ry + .9) * T, n.color, 18);
    sign(g, '공장', (n.rx + 6) * T, (n.ry + 5) * T + 16, n.color, 13);
    sign(g, `${n.flag} 세관`, n.stall.x * T, n.stall.y * T - 58, n.color, 13);
  });
  drawBoard(g);
  sign(g, '📜 게시판', BOARD.x * T, BOARD.y * T - 66, '#6e4a2a', 13);
  sign(g, '무역 광장', 21 * T, 17 * T + 64, '#c99a1c', 15);
  base = c;
}
