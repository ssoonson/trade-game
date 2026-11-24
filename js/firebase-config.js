/* js/firebase-config.js
   ─────────────────────────────────────────────────────────────
   Firebase 연결 설정 (GitHub에서 직접 넣는 방법)

   방법 1 (추천) Vercel 환경 변수
     Vercel 프로젝트 → Settings → Environment Variables 에
     FIREBASE_DATABASE_URL, FIREBASE_API_KEY, FIREBASE_PROJECT_ID, CLASS_CODE, TEACHER_PIN 을 넣고
     Deployments 에서 Redeploy 하면 돼요. 이 파일은 비워 둬요.

   방법 2  이 파일에 직접 쓰기
     아래 databaseURL 등에 Firebase 콘솔의 firebaseConfig 값을 넣고 GitHub에 커밋해요.
     이 파일에 값이 있으면 방법 1보다 먼저 써요.
     (선생님 비밀번호는 이 파일에 넣지 말고 Vercel 환경 변수 TEACHER_PIN 에만 넣어요.)
   ───────────────────────────────────────────────────────────── */
const FIREBASE_SETTINGS = {
  databaseURL: '',   // 예: 'https://trade-class-default-rtdb.asia-southeast1.firebasedatabase.app'
  apiKey: '',        // 예: 'AIza…'
  projectId: '',     // 예: 'trade-class'
  classCode: '',     // 기본 반 코드. 예: '6-1' (비우면 class1). 다른 반은 주소 뒤에 ?c=6-2 처럼 붙여요.
};
