/* map.js
   지도 — 섬, 다리, 광장, 공장·세관·게시판 위치를 정해요. 지도 모양을 바꿀 때 이 파일을 봐요.
*/
/* ================= 지도 ================= */
const T = 32, W = 46, H = 34;
const WATER = 0, PLAZA = 1, LAND = 2, BRIDGE = 3, BLD = 4;
const tmap = new Uint8Array(W * H), town = new Int8Array(W * H).fill(-1);
const ix = (x, y) => y * W + x;
const REG = {field:[2,2], wave:[17,2], rock:[32,2], fire:[2,22], forest:[17,22], gear:[32,22]};
for (let y = 14; y <= 19; y++) for (let x = 2; x <= 43; x++) tmap[ix(x, y)] = PLAZA;
NATIONS.forEach((n, i) => {
  const [rx, ry] = REG[n.id], top = ry < 14;
  for (let y = ry; y < ry + 10; y++) for (let x = rx; x < rx + 12; x++){ tmap[ix(x, y)] = LAND; town[ix(x, y)] = i; }
  for (const y of (top ? [12, 13] : [20, 21])) for (const x of [rx + 5, rx + 6]){ tmap[ix(x, y)] = BRIDGE; town[ix(x, y)] = i; }
  for (let y = ry + 3; y <= ry + 4; y++) for (let x = rx + 5; x <= rx + 6; x++) tmap[ix(x, y)] = BLD;
  Object.assign(n, {idx:i, rx, ry, top, home:{x:rx + 6, y:ry + 6.6}, fac:{x:rx + 6, y:ry + 4}, stall:{x:rx + 9.5, y:top ? 15.3 : 18.7}, bridgeY:top ? 12 : 20});
});
const BOARD = {x:30.5, y:16.9};

