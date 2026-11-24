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

/* 나라 개발 — 건물
   한 나라에 종류마다 1개씩 지을 수 있고, 게임이 끝날 때까지 남아요.
   cost   : 짓는 데 드는 자원 (한 나라 자원만으로는 못 짓게 섞어 두었어요)
   effect : 'income' 다음 라운드부터 우리 특산 자원을 n개 더 받아요
            'tech'   지은 뒤 만드는 물건마다 n점 더 받아요
            'port'   지은 뒤 거래가 성공할 때마다 n점 더 받아요 */
const BUILDINGS = [
  {id:'plant', name:'공장 확장', i:'🏗️', cost:{wood:2, ore:2, oil:1}, effect:'income', n:3, desc:'다음 라운드부터 우리 특산 자원을 3개 더 받아요.'},
  {id:'lab',   name:'연구소',   i:'🔬', cost:{chip:2, oil:1, wood:1}, effect:'tech',   n:1, desc:'지은 뒤 만드는 물건마다 1점씩 더 받아요.'},
  {id:'port',  name:'항구',     i:'⚓', cost:{wood:3, ore:1, fish:1}, effect:'port',   n:1, desc:'지은 뒤 거래가 성공할 때마다 1점씩 더 받아요.'},
];
/* 건물을 지으면 바로 받는 점수 */
const BUILD_PT = 2;

/* 주민 · 행복도 · 금
   주민은 라운드가 시작될 때마다 행복도에 따라 금을 내요. 금으로 주민을 더 데려오거나 다른 나라와 거래해요.
   주민마다 한 라운드에 부탁(퀘스트)을 하나씩 해요. 들어주면 행복도가 오르고,
   못 들어준 채 라운드가 끝나면 행복도가 내려가요. 행복도가 leaveBelow 아래면 주민 1명이 떠나요. */
const VILLAGE = {
  residentsStart: 3,   // 처음 주민 수
  residentsMax: 8,     // 최대 주민 수
  happyStart: 70,      // 처음 행복도 (0~100)
  leaveBelow: 30,      // 라운드가 끝날 때 행복도가 이보다 낮으면 주민 1명이 떠나요
  questUp: 10,         // 부탁을 들어주면 행복도 +
  questDown: 8,        // 못 들어준 부탁 1개마다 라운드가 끝날 때 행복도 -
  questPoint: 2,       // 부탁을 들어주면 받는 점수
  questGold: 1,        // 부탁을 들어주면 받는 금
  goldStart: 5,        // 처음 가진 금
  hireBase: 6,         // 주민을 더 데려오는 값: 6, 8, 10 … 처럼 올라가요
  hireStep: 2,
};
/* 행복도에 따라 주민 1명이 라운드마다 내는 금 (위에서부터 확인해요) */
const GOLD_RATE = [
  {min:80, gold:3, face:'😄', label:'아주 행복해요'},
  {min:50, gold:2, face:'🙂', label:'행복해요'},
  {min:30, gold:1, face:'😐', label:'그저 그래요'},
  {min:0,  gold:0, face:'😢', label:'불행해요'},
];
/* 주민 이름 (순서대로 붙어요) */
const RESIDENT_NAMES = ['보리', '콩이', '달이', '솔이', '하늘', '누리', '도담', '라온'];

/* 창고: 자원마다 보관할 수 있는 최대 개수. 금으로 창고를 늘릴 수 있어요. */
const STORAGE = {
  base: 10,            // 처음 창고 크기 (자원 한 종류당)
  step: 5,             // 한 번 늘릴 때마다 +5
  maxLevel: 3,         // 최대 3번까지 늘릴 수 있어요
  priceBase: 5,        // 늘리는 값: 5, 8, 11 금
  priceStep: 3,
};

/* 시장 가격판: 자원마다 기본 시세(금). 시장에 적으면 비싸지고, 많으면 싸져요. */
const BASE_PRICE = {grain:1, fish:2, ore:2, oil:3, wood:1, chip:3};

/* 무역 협정(FTA): 맺은 두 나라는 서로 거래할 때마다 점수 +bonus, 관세가 없어요. 게임 끝까지 유지돼요. */
const FTA = {bonus: 1};

/* 관세 사건 카드에서 고를 수 있는 금액 */
const TARIFF_AMOUNTS = [1, 2, 3];

/* 비밀 목표: 게임마다 나라별로 하나씩 몰래 정해져요. 이루면 reward 점수. */
const GOALS = [
  {id:'export10',  t:'수출 대장',   text:'다른 나라에 자원을 모두 10개 이상 수출하기', reward:10},
  {id:'res6',      t:'큰 마을',     text:'주민을 6명까지 늘리기', reward:10},
  {id:'happy85',   t:'행복한 나라', text:'행복도를 85 이상으로 만들기', reward:10},
  {id:'build2',    t:'개발 계획',   text:'건물을 2개 이상 짓기', reward:10},
  {id:'partners4', t:'친구 많은 나라', text:'4개 나라와 거래하기', reward:10},
  {id:'items5',    t:'만능 공장',   text:'서로 다른 물건을 5가지 만들기', reward:10},
  {id:'gold25',    t:'부자 나라',   text:'금을 25개 모으기', reward:10},
];

/* 선생님 문제: 학생이 맞히면 그 나라 특산 자원을 perAnswer 개 더 받아요 (문제 하나에 나라마다 최대 maxPerNation 번) */
const QUIZ_REWARD = {perAnswer: 1, maxPerNation: 4};

/* 별명 최대 글자 수 */
const NICK_MAX = 6;

/* 환율 사건: 선생님이 한 나라의 돈 가치를 올리거나(+1) 내려요(-1). 그 라운드에만 적용돼요.
   돈 가치가 오르면 → 수입이 싸져서 수입 거래 한 번마다 금 +gold, 수출은 비싸져서 수출 거래 한 번마다 금 -gold
   돈 가치가 내리면 → 반대 (수출 +gold, 수입 -gold) */
const FX = {gold: 1};

/* 공정 무역: 기본 시세(BASE_PRICE, 금은 1개 = 1)로 주고받는 값을 비교해요.
   두 값이 fairWithin 배 안이면 '공정' → 두 나라 모두 점수 +point
   한쪽이 unfairRatio 배 이상, unfairGap 이상 더 받으면 '불공정' → 이득 본 나라 점수 -point, 손해 본 나라 주민 행복도 -hapDown */
const FAIR = {fairWithin: 1.5, unfairRatio: 2, unfairGap: 3, point: 1, hapDown: 5};

/* 자동 뉴스 속보: 켜 두면 라운드가 시작되고 minSec~maxSec초 뒤에 사건이 하나 저절로 일어나요 (선생님 화면이 켜져 있어야 해요) */
const AUTO_NEWS = {minSec: 90, maxSec: 180};
/* 자동 뉴스에만 나오는 좋은 소식 */
const GOOD_NEWS = [
  {id:'harvest', t:'🌾 대풍년',        text:'들판나라에 풍년이 들었어요. 곡물이 3개 늘었어요.', kind:'res', nation:'field', res:'grain', n:3},
  {id:'fishery', t:'🐟 물고기 떼',      text:'파도나라 바다에 물고기 떼가 몰려왔어요. 수산물이 3개 늘었어요.', kind:'res', nation:'wave', res:'fish', n:3},
  {id:'newmine', t:'💎 새 광산 발견',    text:'바위나라에서 새 광산을 찾았어요. 광물이 3개 늘었어요.', kind:'res', nation:'rock', res:'ore', n:3},
  {id:'forestgrow', t:'🌳 숲 가꾸기 성공', text:'숲나라가 가꾼 숲이 자라서 목재가 3개 늘었어요.', kind:'res', nation:'forest', res:'wood', n:3},
];

/* 모둠 역할: 4명이 한 가지씩 맡아요. 역할은 안내일 뿐 누구나 모든 버튼을 쓸 수 있어요 */
const ROLES = [
  {id:'maker',    i:'🏭', t:'생산 담당',   text:'공장에서 물건을 만들고 건물을 지어요.'},
  {id:'diplomat', i:'🤝', t:'외교 담당',   text:'다른 나라 세관에 가서 거래와 무역 협정을 제안해요.'},
  {id:'research', i:'🔎', t:'시장 조사 담당', text:'시장 가격판과 다른 나라 전시판을 보고 계획서를 써요.'},
  {id:'mayor',    i:'🏠', t:'마을 담당',   text:'주민 부탁을 확인하고 들어줘서 행복도를 지켜요.'},
];
const RO = Object.fromEntries(ROLES.map(x => [x.id, x]));
