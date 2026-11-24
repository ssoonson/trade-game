/* js/characters.js
   탐험가 캐릭터 — 나라마다 다른 동물이에요.
   그림은 assets/characters/<동물>.png (Canva로 그린 그림)를 써요.
   그림 파일을 아직 못 불러왔을 때만 아래 drawAnimal 로 코드 그림을 대신 그려요.
   어느 나라가 어떤 동물인지는 js/data/game-data.js 의 NATIONS → animal 에서 정해요.
   쓸 수 있는 동물: rabbit(토끼), penguin(펭귄), mole(두더지), fox(여우), bear(곰), cat(고양이)
*/
const ANIMALS = {
  rabbit:  {name:'토끼',   fur:'#fbf6ee', fur2:'#e6d8c6', muzzle:'#ffffff', inner:'#f6b3c0', nose:'#e8798f'},
  penguin: {name:'펭귄',   fur:'#3b4f6b', fur2:'#2a3a52', muzzle:'#fffaf2', beak:'#f6a623'},
  mole:    {name:'두더지', fur:'#8a6a55', fur2:'#6c4f3e', muzzle:'#ecd0b0', nose:'#ef8aa0'},
  fox:     {name:'여우',   fur:'#f28c3d', fur2:'#cf6c22', muzzle:'#fff6ea', tip:'#5a3b25', nose:'#4b3424'},
  bear:    {name:'곰',     fur:'#a9764f', fur2:'#875a39', muzzle:'#f2d7b8', nose:'#4b3424'},
  cat:     {name:'고양이', fur:'#b8bccb', fur2:'#9599ad', muzzle:'#faf7f2', inner:'#f6b3c0', nose:'#e8798f'},
};
const OUT = '#4b3424';
const animalOf = n => ANIMALS[n.animal] ? n.animal : 'bear';

function ell(g, x, y, rx, ry, fill, stroke=true, rot=0){
  g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  if (fill){ g.fillStyle = fill; g.fill(); }
  if (stroke){ g.stroke(); }
}
function tri(g, a, b, c, fill){ g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.closePath(); g.fillStyle = fill; g.fill(); g.stroke(); }

/* (px, py) = 발밑 위치(픽셀). 캐릭터 높이는 약 45px, 토끼 귀까지 약 65px */
function drawAnimal(g, px, py, kind, scarf, dir, moving, t){
  const A = ANIMALS[kind] || ANIMALS.bear;
  const bob = moving ? Math.abs(Math.sin(t * 12)) * 2.5 : 0;
  const step = moving ? Math.sin(t * 12) : 0;
  const side = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
  const back = dir === 'up';
  g.save(); g.lineWidth = 2; g.strokeStyle = OUT; g.lineJoin = 'round'; g.lineCap = 'round';
  // 그림자
  g.beginPath(); g.ellipse(px, py + 1, 12, 4.5, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(40,60,70,.22)'; g.fill();
  // 발
  for (const f of [-1, 1]) ell(g, px + f * 5, py - 2 - (f * step > 0 ? 2.2 : 0), 4.6, 3.2, A.fur2);
  const by = py - 12 - bob, hy = by - 16;
  // 꼬리 (옆모습일 때는 몸 뒤에)
  const drawTail = () => {
    const tx = back ? px : px - side * 10, ty = by + (back ? 6 : 3);
    if (kind === 'fox'){ g.save(); g.translate(tx, ty); g.rotate(back ? 0 : -side * .9); ell(g, 0, -6, 5.5, 10, A.fur); ell(g, 0, -13, 3.6, 4, A.muzzle, false); g.restore(); }
    else if (kind === 'cat'){ g.save(); g.lineWidth = 6; g.strokeStyle = OUT; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx - (side || 1) * 9, ty - 4, tx - (side || 1) * 6, ty - 15); g.stroke(); g.lineWidth = 3.4; g.strokeStyle = A.fur; g.stroke(); g.restore(); }
    else if (kind === 'rabbit') ell(g, tx, ty, 4.2, 4.2, '#ffffff');
    else if (kind === 'bear') ell(g, tx, ty, 3.4, 3.4, A.fur2);
    else if (kind === 'penguin') tri(g, [tx - 4, ty + 3], [tx + 4, ty + 3], [tx, ty + 8], A.fur2);
    else ell(g, tx, ty + 2, 2.2, 3.4, A.fur2);
  };
  if (side) drawTail();
  // 탐험 가방 (뒤나 옆에서 보일 때)
  if (side){ g.fillStyle = '#c99158'; roundRect(g, px - side * 12 - 4, by - 7, 8, 12, 3); g.fill(); g.stroke(); }
  // 팔
  for (const f of [-1, 1]) ell(g, px + f * 10, by + 1 + (moving ? f * step * 1.6 : 0), 3.2, 4.6, A.fur2, true, f * .5);
  // 몸
  ell(g, px, by, 10.5, 10, A.fur);
  if (back){ g.fillStyle = '#c99158'; roundRect(g, px - 8, by - 9, 16, 14, 4); g.fill(); g.stroke(); g.beginPath(); g.moveTo(px - 8, by - 3); g.lineTo(px + 8, by - 3); g.stroke(); drawTail(); }
  if (!back) ell(g, px + side * 2.5, by + 1.5, 6.8, 6.6, A.muzzle, false);
  // 나라 색 스카프
  g.fillStyle = scarf; roundRect(g, px - 10, by - 10, 20, 5.5, 2.75); g.fill(); g.stroke();
  if (!back){ g.fillStyle = scarf; roundRect(g, px + (side ? -side * 5 : 4) - 2.5, by - 6, 5, 8, 2); g.fill(); g.stroke(); }
  // 귀 (머리 뒤)
  if (kind === 'rabbit'){
    for (const f of [-1, 1]){ ell(g, px + f * 5, hy - 15, 3.8, 10, A.fur, true, f * .16); if (!back) ell(g, px + f * 5, hy - 14, 1.8, 7, A.inner, false, f * .16); }
  } else if (kind === 'bear'){
    for (const f of [-1, 1]){ ell(g, px + f * 9, hy - 8.5, 4.6, 4.6, A.fur); if (!back) ell(g, px + f * 9, hy - 8.5, 2.3, 2.3, A.fur2, false); }
  } else if (kind === 'fox' || kind === 'cat'){
    const s = kind === 'fox' ? 1 : .85;
    for (const f of [-1, 1]){
      tri(g, [px + f * 3.5, hy - 9], [px + f * 11.5 * s, hy - 19 * s], [px + f * 11.5, hy - 3], A.fur);
      if (!back){ g.save(); g.lineWidth = 0; tri(g, [px + f * 6, hy - 9], [px + f * 10.5 * s, hy - 16 * s], [px + f * 10.3, hy - 6], kind === 'fox' ? A.tip : A.inner); g.restore(); }
    }
  } else if (kind === 'mole'){
    for (const f of [-1, 1]) ell(g, px + f * 10, hy - 5, 2.6, 2.6, A.fur2);
  }
  // 머리
  ell(g, px, hy, 12.5, 11.5, A.fur);
  if (!back){
    const fx = px + side * 4.2;
    if (kind === 'penguin'){
      ell(g, fx, hy + 2, 9.5, 7.5, A.muzzle, false);
      ell(g, fx - 3.8, hy - 1, 4.5, 4.5, A.muzzle, false); ell(g, fx + 3.8, hy - 1, 4.5, 4.5, A.muzzle, false);
    } else if (kind !== 'rabbit'){
      ell(g, fx, hy + 4.2, kind === 'mole' ? 7 : 6.2, 4.6, A.muzzle, false);
    }
    // 눈
    for (const f of [-1, 1]){
      g.beginPath(); g.arc(fx + f * 4.3, hy - .5, kind === 'mole' ? 1.5 : 2.1, 0, Math.PI * 2); g.fillStyle = OUT; g.fill();
      g.beginPath(); g.arc(fx + f * 4.3 + .7, hy - 1.2, .7, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    }
    // 볼
    g.globalAlpha = .45; for (const f of [-1, 1]){ g.beginPath(); g.arc(fx + f * 7.6, hy + 3.6, 2.4, 0, Math.PI * 2); g.fillStyle = '#ff8fa3'; g.fill(); } g.globalAlpha = 1;
    // 코와 입
    if (kind === 'penguin'){ tri(g, [fx - 3, hy + 2.5], [fx + 3, hy + 2.5], [fx, hy + 6.5], A.beak); }
    else if (kind === 'mole'){ ell(g, fx, hy + 3, 3.4, 2.6, A.nose); }
    else { ell(g, fx, hy + 2.6, kind === 'bear' || kind === 'fox' ? 1.9 : 1.4, 1.3, A.nose, false);
      g.beginPath(); g.moveTo(fx - 2, hy + 5.2); g.quadraticCurveTo(fx, hy + 6.6, fx, hy + 4); g.quadraticCurveTo(fx, hy + 6.6, fx + 2, hy + 5.2); g.lineWidth = 1.3; g.stroke(); g.lineWidth = 2; }
    if (kind === 'cat'){ g.lineWidth = 1; for (const f of [-1, 1]){ g.beginPath(); g.moveTo(fx + f * 5, hy + 3.5); g.lineTo(fx + f * 11, hy + 2.5); g.moveTo(fx + f * 5, hy + 5); g.lineTo(fx + f * 11, hy + 5.5); g.stroke(); } g.lineWidth = 2; }
  }
  g.restore();
  return kind === 'rabbit' ? hy - 27 : hy - (kind === 'fox' ? 21 : 14);   // 머리 꼭대기 y
}

/* Canva 캐릭터 그림 불러오기
   assets/characters/<동물>.png       앞모습 (아래로 걸을 때)
   assets/characters/<동물>_side.png  옆모습, 오른쪽을 봐요 (왼쪽으로 걸을 때는 좌우를 뒤집어요)
   assets/characters/<동물>_back.png  뒷모습 (위로 걸을 때)
   옆·뒷모습 파일이 없으면 앞모습을 대신 써요. */
const SPRITE_H = 52;                       // 지도 위 캐릭터 키(픽셀)
const SIDE_FACES_LEFT = false;             // 옆모습 그림이 왼쪽을 보고 있으면 true
const spritePath = (kind, view = '') => `assets/characters/${kind}${view ? '_' + view : ''}.png`;
const SPRITES = {};
for (const kind of Object.keys(ANIMALS)){
  SPRITES[kind] = {};
  for (const view of ['front', 'side', 'back']){
    const img = new Image(); img.decoding = 'async';
    img.onload = () => { SPRITES[kind][view] = img; };
    img.src = spritePath(kind, view === 'front' ? '' : view);
  }
}
/* 캐릭터마다 걸음이 따로 놀도록 걸음 시계를 기억해요 */
const walkClock = new Map();
function walkPhase(id, moving, t){
  let w = walkClock.get(id); if (!w){ w = {p:0, last:t, amt:0}; walkClock.set(id, w); }
  const dt = Math.min(.1, Math.max(0, t - w.last)); w.last = t;
  w.amt += ((moving ? 1 : 0) - w.amt) * Math.min(1, dt * 10);   // 멈추고 걷기를 부드럽게
  if (moving) w.p += dt * 11;
  return w;
}

/* 지도 위 캐릭터 + 이름표 + "나" 표시 */
function drawChar(g, x, y, n, label, dir, moving, t, you, scale = 1, id = ''){
  const px = x * T, py = y * T, kind = animalOf(n), set = SPRITES[kind] || {};
  const view = dir === 'up' ? 'back' : (dir === 'left' || dir === 'right') ? 'side' : 'front';
  const img = set[view] || set.front;
  let top;
  if (img){
    const w8 = walkPhase(id || (n.id + label), moving, t), a = w8.amt, ph = w8.p;
    const h = SPRITE_H * scale, w = h * img.width / img.height;
    const hop = Math.abs(Math.sin(ph)) * 3.2 * a;                   // 걸음마다 통통
    const squash = 1 - Math.cos(ph * 2) * .035 * a;                 // 발 디딜 때 살짝 눌림
    const sway = (view === 'side' ? .05 : Math.sin(ph) * .07) * a;  // 옆으로 걸을 땐 앞으로 기울고, 앞뒤로 걸을 땐 좌우로 흔들
    const breathe = 1 + Math.sin(t * 2.2 + px * .1) * .012 * (1 - a); // 서 있을 때 숨쉬기
    g.save();
    g.beginPath(); g.ellipse(px, py, (15 - hop) * scale, (5.5 - hop * .3) * scale, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(40,60,70,.22)'; g.fill();
    g.lineWidth = 2.5; g.strokeStyle = n.color; g.stroke();
    g.translate(px, py - hop);
    const flip = (dir === 'left') !== SIDE_FACES_LEFT ? -1 : 1;   // 옆모습 그림이 보는 쪽에 맞춰 뒤집기
    g.rotate(sway * (dir === 'left' ? -1 : 1));
    g.scale(flip * (2 - squash) * breathe, squash * breathe);
    g.drawImage(img, -w / 2, -h, w, h);
    g.restore();
    top = py - h - hop;
  } else {
    top = drawAnimal(g, px, py, kind, n.color, dir, moving, t);
  }
  if (label){
    g.font = 'bold 11px "Noto Sans KR", sans-serif'; const w = g.measureText(label).width + 12;
    g.fillStyle = you ? '#ffd447' : 'rgba(75,52,36,.85)'; roundRect(g, px - w / 2, py + 6, w, 17, 8.5); g.fill(); if (you){ g.strokeStyle = '#dba213'; g.lineWidth = 2; g.stroke(); }
    g.fillStyle = you ? '#4b3424' : '#fffaee'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, px, py + 14.5);
  }
  if (you){ const my = top - 4; g.fillStyle = '#ffd447'; g.strokeStyle = '#4b3424'; g.lineWidth = 2; g.beginPath(); g.moveTo(px - 7, my - 9); g.lineTo(px + 7, my - 9); g.lineTo(px, my); g.closePath(); g.fill(); g.stroke(); }
}

/* 나라 고르기 카드와 화면 위 메달에 쓰는 그림 주소 (앞모습) */
function animalPortrait(nid){
  const n = NI[nid]; return n ? spritePath(animalOf(n)) : '';
}
