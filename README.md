# 교실 무역 탐험대 · 파일 안내

초등 6학년 사회 무역 수업용 RPG 게임이에요. 빌드 과정 없이 **폴더째 웹에 올리면** 바로 동작해요.

## 폴더 구조

```
trade-game-web/
├─ index.html              화면 뼈대와 파일 불러오는 순서
├─ css/style.css           색, 글꼴, 배치
└─ js/
   ├─ data/
   │  ├─ game-data.js      ★ 나라·자원·물건·점수·라운드·사건 카드
   │  └─ lesson-content.js ★ 정리 질문·실제 세계 연결·수업 흐름
   ├─ map.js               지도 모양 (섬, 다리, 건물 위치)
   ├─ state.js             게임 상태와 자원·점수 계산
   ├─ store.js             Firebase 연결, 학생용 링크, 연습 모드
   ├─ actions.js           버튼을 눌렀을 때 하는 일
   ├─ movement.js          캐릭터 이동, 충돌, 친구 위치 공유
   ├─ characters.js        동물 탐험가 캐릭터 (assets/characters 그림 사용)
   ├─ world.js             캔버스에 지도 그리기, 게임 루프
   ├─ views/               화면별 코드 (game, wrap, teacher, setup)
   └─ app.js               탭 전환과 앱 시작 (마지막에 불러옴)
```

★ 표시 두 파일만 고쳐도 대부분의 수업 내용을 바꿀 수 있어요.

## 자주 바꾸는 것

| 바꾸고 싶은 것 | 파일 | 고칠 곳 |
|---|---|---|
| 나라 이름, 설명, 받는 자원 개수 | `js/data/game-data.js` | `NATIONS`의 `name`, `desc`, `income` |
| 나라별 탐험가 동물 | `js/data/game-data.js` | `NATIONS`의 `animal` (rabbit, penguin, mole, fox, bear, cat) |
| 캐릭터 그림 바꾸기 | `assets/characters/` | `<동물>.png`(앞), `<동물>_side.png`(오른쪽을 보는 옆), `<동물>_back.png`(뒤). 같은 이름으로 덮어쓰면 돼요 |
| 물건 종류, 필요한 자원, 점수 | `js/data/game-data.js` | `ITEMS` |
| 보너스 점수, 보너스 기준 개수 | `js/data/game-data.js` | `BONUS`, `BONUS_KINDS` |
| 사건 카드 추가·수정 | `js/data/game-data.js` | `EVENTS` (한 줄 복사 후 `id`만 다르게) |
| 정리 질문, 실제 세계 연결, 수업 흐름 | `js/data/lesson-content.js` | `WRAP_QUESTIONS`, `WRAP_REAL_WORLD`, `CLASS_FLOW` |
| 색과 글꼴 | `css/style.css` | 맨 위 `:root` 의 `--` 값 |

## 고칠 때 주의할 점

- 글자는 따옴표 안에서만 고치고, 줄 끝 쉼표(`,`)와 괄호를 지우지 않도록 해요.
- `id`(예: `'field'`, `'grain'`)를 바꾸면 그 id를 쓰는 곳도 모두 같이 바꿔야 해요.
- 나라는 지도 자리 때문에 **6개**를 유지해요. 나라 수를 바꾸려면 `js/map.js`의 `REG`도 함께 고쳐야 해요.
- `js/` 파일들은 `index.html`에 적힌 **순서대로** 불러와요. 새 파일을 추가하면 `index.html`에 `<script>` 한 줄을 넣어 주세요.
- 고친 뒤에는 `index.html`을 더블클릭해 연습 모드로 먼저 확인하고, 이상이 없으면 폴더째 다시 웹에 올려요.

## 웹에 올리기

1. Netlify에 로그인한 뒤 `app.netlify.com/drop` 에 **`trade-game-web` 폴더 전체**를 끌어다 놓아요.
2. 이미 올린 사이트를 고칠 때는 그 사이트의 **Deploys** 화면에 폴더를 다시 끌어다 놓으면 주소가 그대로 유지돼요.
3. 처음 올렸다면 사이트 주소를 열고 **설정** 탭의 안내에 따라 Firebase를 연결해요.

## GitHub + Netlify로 올리기 (자동 배포)

1. GitHub 저장소에 이 폴더의 **내용물**(index.html, css, js, README.md, netlify.toml)을 올려요.
2. Netlify에서 **Add new site → Import an existing project → GitHub**를 고르고 저장소를 선택해요.
3. 빌드 설정은 `netlify.toml`이 알아서 채워 줘요. Build command는 비워 두고, Publish directory는 `.`이에요.
4. 이후에는 GitHub에 파일을 고쳐 올릴 때마다 Netlify 사이트가 자동으로 바뀌어요.
