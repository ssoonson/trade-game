# 교실 무역 탐험대 · 파일 안내

초등 6학년 사회 무역 수업용 RPG 게임이에요. 빌드 과정 없이 **폴더째 웹에 올리면** 바로 동작해요.

## 폴더 구조

```
trade-game-web/
├─ index.html              화면 뼈대와 파일 불러오는 순서
├─ api/                    Vercel 서버 함수 (config.js: 환경 변수 전달, teacher.js: 선생님 비밀번호 확인)
├─ css/style.css           색, 글꼴, 배치
└─ js/
   ├─ data/
   │  ├─ game-data.js      ★ 나라·자원·물건·점수·라운드·사건 카드
   │  └─ lesson-content.js ★ 정리 질문·실제 세계 연결·수업 흐름
   ├─ map.js               지도 모양 (섬, 다리, 건물 위치)
   ├─ state.js             게임 상태와 자원·점수 계산
   ├─ firebase-config.js   Firebase 연결 설정 (GitHub에서 직접 넣을 때)
   ├─ village.js           주민·행복도·금·부탁(퀘스트) 계산과 주민 그리기
   ├─ features.js          창고·시장 가격판·무역 협정·관세·비밀 목표·배지·선생님 문제
   ├─ store.js             Firebase 연결, 학생용 링크, 선생님 비밀번호 확인, 연습 모드
   ├─ actions.js           버튼을 눌렀을 때 하는 일
   ├─ movement.js          캐릭터 이동, 충돌, 친구 위치 공유
   ├─ characters.js        동물 탐험가 캐릭터 (assets/characters 그림 사용)
   ├─ world.js             캔버스에 지도 그리기, 게임 루프
   ├─ views/               화면별 코드 (game, wrap, teacher, share)
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
| 나라 개발 건물(이름, 비용, 효과), 건물 점수 | `js/data/game-data.js` | `BUILDINGS`, `BUILD_PT` |
| 주민 수·행복도·금 규칙, 부탁 보상 | `js/data/game-data.js` | `VILLAGE`, `GOLD_RATE`, `RESIDENT_NAMES` |
| 창고 크기와 늘리는 값 | `js/data/game-data.js` | `STORAGE` |
| 시장 기본 시세, 무역 협정 보너스, 관세 금액 | `js/data/game-data.js` | `BASE_PRICE`, `FTA`, `TARIFF_AMOUNTS` |
| 지도 소품(나무·꽃·바위)과 절벽 색 | `js/scenery.js` | `PROPS`, `CLIFF`, `PROP_SCALE` |
| 라운드 수(기본 5)와 라운드 이름 | `js/data/game-data.js` | `ROUND_DEFAULT`, `ROUND_CHOICES`, `ROUND_PLANS` (단계 순서) |
| 라운드별 안내(학생 할 일, 선생님 할 일) | `js/data/lesson-content.js` | `ROUND_GUIDE` |
| 교사용 안내 (선생님 화면, 인쇄 가능) | `js/data/lesson-content.js` | `TEACHER_GUIDE` |
| 비밀 목표, 선생님 문제 보상 | `js/data/game-data.js` | `GOALS`, `QUIZ_REWARD` |
| 환율 금, 공정 무역 기준, 자동 뉴스 시간과 좋은 소식, 모둠 역할 | `js/data/game-data.js` | `FX`, `FAIR`, `AUTO_NEWS`, `GOOD_NEWS`, `ROLES` |
| 선생님 문제 모음, 라운드 성찰 질문 | `js/data/lesson-content.js` | `QUIZ_BANK`, `REFLECT_QUESTIONS` |
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

## 웹에 올리기 (GitHub + Vercel, 자동 배포)

1. vercel.com 에 GitHub 계정으로 로그인해요.
2. **Add New… → Project**를 누르고 `trade-game` 저장소 옆의 **Import**를 눌러요.
3. Framework Preset은 **Other**, Build Command와 Output Directory는 비워 둔 채 **Deploy**를 눌러요.
4. 이후에는 GitHub `main` 브랜치에 고쳐 올릴 때마다 Vercel 사이트가 자동으로 바뀌어요.

## Firebase 연결하기 (학생 기기끼리 함께 하려면)

먼저 Firebase에서 데이터베이스를 만들어요.

1. console.firebase.google.com → 프로젝트 만들기
2. **빌드 → Realtime Database → 데이터베이스 만들기** (위치: 싱가포르, 잠금 모드)
3. **규칙** 탭에 아래를 붙여 넣고 **게시**

```json
{
  "rules": {
    "classes": {
      "$cls": { ".read": true, ".write": true }
    }
  }
}
```

4. **⚙️ 프로젝트 설정 → 내 앱 → 웹(</>)**으로 앱을 등록하고 `firebaseConfig` 값을 확인해요.

그다음 둘 중 한 가지로 게임에 알려 줘요.

### 방법 1 (추천): Vercel 환경 변수

Vercel 프로젝트 → **Settings → Environment Variables**에 아래를 넣고, **Deployments → 맨 위 배포의 ⋯ → Redeploy**를 눌러요.

| 이름 | 값 | 필수 |
|---|---|---|
| `FIREBASE_DATABASE_URL` | firebaseConfig의 `databaseURL` (예: `https://trade-class-default-rtdb.asia-southeast1.firebasedatabase.app`) | 필수 |
| `FIREBASE_API_KEY` | firebaseConfig의 `apiKey` | 선택 |
| `FIREBASE_PROJECT_ID` | firebaseConfig의 `projectId` | 선택 |
| `CLASS_CODE` | 기본 반 코드 (예: `6-1`) | 선택 |
| `TEACHER_PIN` | 선생님 화면 비밀번호 (예: 숫자 4~8자리) | 필수 |

값은 `api/config.js`(Vercel 서버 함수)가 읽어서 게임에 전달해요. `TEACHER_PIN`은 `api/teacher.js`에서만 확인하고 브라우저로 보내지 않아요.

### 방법 2: GitHub에서 설정 파일 고치기

`js/firebase-config.js`의 `databaseURL`, `apiKey`, `projectId`, `classCode`를 채워서 커밋해요. 이 파일에 값이 있으면 방법 1보다 먼저 써요. 선생님 비밀번호는 이 파일에 넣지 말고 Vercel의 `TEACHER_PIN`에만 넣어요(이 파일은 누구나 내려받을 수 있어요).

## 수업에서 쓰기

- **선생님**: 사이트 맨 아래 **선생님** 링크(또는 주소 뒤 `#teacher`) → `TEACHER_PIN` 입력 → 선생님 화면에 학생용 QR과 링크가 나와요.
- **학생**: QR이나 링크(`https://○○○.vercel.app`)만 열면 돼요. 로그인은 필요 없어요.
- **여러 반**: 주소 뒤에 `?c=6-2`처럼 반 코드를 붙이면 반마다 따로 게임해요.
- 설정이 없거나 `index.html`을 컴퓨터에서 바로 열면 **한 기기 연습 모드**로 돌아가요.
- **코드를 고친 뒤**에는 `js/state.js`의 `APP_VERSION`을 올려 주세요. 선생님이 라운드를 시작하면, 옛 화면을 띄워 둔 학생 기기에 **새로 고침** 안내가 떠요. (`vercel.json`이 새 파일을 바로 받도록 캐시를 꺼 둬요.)
