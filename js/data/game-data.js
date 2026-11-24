/* =====================================================================
   게임 자료 — 나라, 자원, 물건, 라운드, 사건 카드
   ---------------------------------------------------------------------
   게임의 숫자와 이름은 대부분 이 파일에서 바꿀 수 있어요.
   - 글자는 따옴표 '…' 안에서만 고쳐요.
   - 각 줄 끝의 쉼표(,)와 괄호 {} [] 를 지우지 않도록 조심해요.
   - id 값(예: 'field', 'grain')은 다른 곳에서 이름표처럼 쓰여요.
     id를 바꾸면 그 id를 쓰는 곳(income, cost, 사건의 nation·res)도 함께 바꿔야 해요.
   ===================================================================== */

/* 자원: id: ['이름', '그림'] */
const RES = {
  grain: ['곡물', '🌾'],
  fish:  ['수산물', '🐟'],
  ore:   ['광물', '⛏️'],
  oil:   ['에너지', '🛢️'],
  wood:  ['목재', '🪵'],
  chip:  ['반도체', '💾'],
};

/* 나라 (지도에는 정확히 6개 자리가 있어요. 순서대로 위쪽 왼→오, 아래쪽 왼→오에 놓여요.)
   spec   : 잘 만드는 자원(특산 자원)
   income : 라운드마다 받는 자원과 개수
   animal : 탐험가 동물 (rabbit 토끼, penguin 펭귄, mole 두더지, fox 여우, bear 곰, cat 고양이 중 하나)
   color  : 탐험가 스카프·지붕 색 / ground, ground2 : 땅 색 / decor : 땅에 흩어 놓는 그림 */
const NATIONS = [
  {id:'field',  name:'들판나라', flag:'🌾', animal:'rabbit', spec:'grain', desc:'넓은 평야에서 곡식이 잘 자라요.',
   income:{grain:8, oil:1},        color:'#c99a1c', ground:'#cfe08a', ground2:'#bcd277', decor:['🌾','🌾','🌻','🐄','🌾']},
  {id:'wave',   name:'파도나라', flag:'🌊', animal:'penguin', spec:'fish',  desc:'바다로 둘러싸인 섬나라예요. 물고기가 많이 잡혀요.',
   income:{fish:8, grain:1},       color:'#1f78c1', ground:'#f1e2b3', ground2:'#e6d39c', decor:['🐚','🦀','🌴','🎣','🐟']},
  {id:'rock',   name:'바위나라', flag:'⛰️', animal:'mole', spec:'ore',   desc:'산이 많고 땅속에 광물이 풍부해요.',
   income:{ore:8, wood:2},         color:'#7d6553', ground:'#bfb3a3', ground2:'#ad9f8d', decor:['🪨','⛰️','⛏️','🪨','💎']},
  {id:'fire',   name:'불꽃나라', flag:'🔥', animal:'fox', spec:'oil',   desc:'사막 아래에 석유가 가득해요.',
   income:{oil:8, grain:2},        color:'#d4500f', ground:'#eec08a', ground2:'#e2ad72', decor:['🛢️','🌵','🐪','🛢️','🌵']},
  {id:'forest', name:'숲나라',   flag:'🌲', animal:'bear', spec:'wood',  desc:'울창한 숲이 나라를 덮고 있어요.',
   income:{wood:8, ore:1},         color:'#2c8048', ground:'#7fbf74', ground2:'#6fae64', decor:['🌲','🌳','🍄','🌲','🦌']},
  {id:'gear',   name:'톱니나라', flag:'⚙️', animal:'cat', spec:'chip',  desc:'자원은 적지만 기술이 뛰어나요.',
   income:{chip:8, ore:1, grain:1}, color:'#6a55d6', ground:'#c9cbdc', ground2:'#b9bbcf', decor:['⚙️','🔩','💡','🤖','🏢']},
];

/* 공장에서 만드는 물건: cost = 필요한 자원, pt = 점수 */
const ITEMS = [
  {id:'bread', name:'빵',       i:'🍞', cost:{grain:2, oil:1},          pt:3},
  {id:'lunch', name:'도시락',   i:'🍱', cost:{grain:1, fish:2},         pt:4},
  {id:'chair', name:'가구',     i:'🪑', cost:{wood:2, ore:1},           pt:4},
  {id:'ship',  name:'배',       i:'🚢', cost:{wood:2, ore:1, oil:1},    pt:6},
  {id:'car',   name:'자동차',   i:'🚗', cost:{ore:2, oil:1, chip:1},    pt:7},
  {id:'phone', name:'스마트폰', i:'📱', cost:{chip:2, ore:1, oil:1},    pt:8},
];

/* 한 라운드에 서로 다른 물건을 3가지 이상 만들면 받는 보너스 점수 */
const BONUS = 5;
const BONUS_KINDS = 3;

/* 라운드 이름과 설명 (라운드는 1, 2, 3 세 개예요. 2라운드부터 무역이 자동으로 열려요.) */
const ROUNDS = {
  1: {t:'1라운드', s:'혼자 생산하기 · 무역 금지'},
  2: {t:'2라운드', s:'자유 무역'},
  3: {t:'3라운드', s:'사건 발생'},
};

/* 선생님 사건 카드
   kind:'res'   → nation 나라의 res 자원을 n개 늘리거나(+) 줄여요(-). 그 라운드에만 적용돼요.
   kind:'block' → nation 나라의 다리를 닫고 그 라운드 동안 무역을 막아요. */
const EVENTS = [
  {id:'typhoon', t:'🌀 태풍',            text:'파도나라에 태풍이 와서 고기잡이를 못 했어요. 수산물이 4개 줄었어요.', kind:'res', nation:'wave', res:'fish', n:-4},
  {id:'drought', t:'☀️ 가뭄',            text:'들판나라에 비가 오지 않아 곡물 수확이 줄었어요. 곡물이 4개 줄었어요.', kind:'res', nation:'field', res:'grain', n:-4},
  {id:'oilstop', t:'🚫 에너지 수출 중단', text:'불꽃나라가 이번 라운드 동안 다른 나라와 거래하지 않기로 했어요. 불꽃나라로 가는 다리도 닫혔어요!', kind:'block', nation:'fire'},
  {id:'mine',    t:'⛏️ 광산 사고',        text:'바위나라 광산에 사고가 나서 광물이 3개 줄었어요.', kind:'res', nation:'rock', res:'ore', n:-3},
  {id:'fire',    t:'🔥 산불',            text:'숲나라에 산불이 나서 목재가 4개 줄었어요.', kind:'res', nation:'forest', res:'wood', n:-4},
  {id:'tech',    t:'💡 신기술 개발',      text:'톱니나라가 새 기술을 개발했어요. 반도체가 3개 늘었어요.', kind:'res', nation:'gear', res:'chip', n:3},
];

/* 별명 최대 글자 수 */
const NICK_MAX = 6;
