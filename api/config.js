// Vercel 서버 함수: Vercel 환경 변수에 넣은 Firebase 설정을 게임에 알려 줘요.
// Vercel 프로젝트 → Settings → Environment Variables 에서 아래 이름으로 값을 넣어요.
//   FIREBASE_DATABASE_URL  (필수) 예: https://trade-class-default-rtdb.asia-southeast1.firebasedatabase.app
//   FIREBASE_API_KEY       (선택) firebaseConfig 의 apiKey
//   FIREBASE_PROJECT_ID    (선택) firebaseConfig 의 projectId
//   CLASS_CODE             (선택) 기본 반 코드. 예: 6-1 (없으면 class1)
// Firebase 웹 설정값은 원래 브라우저에 공개되는 값이라 여기서 돌려줘도 괜찮아요.
// 선생님 비밀번호(TEACHER_PIN)는 여기서 절대 돌려주지 않아요.
module.exports = (req, res) => {
  const env = process.env;
  const body = {
    databaseURL: env.FIREBASE_DATABASE_URL || '',
    apiKey: env.FIREBASE_API_KEY || '',
    projectId: env.FIREBASE_PROJECT_ID || '',
    classCode: env.CLASS_CODE || '',
    teacherPinSet: Boolean(env.TEACHER_PIN),
  };
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(JSON.stringify(body));
};
