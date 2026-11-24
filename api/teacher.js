// Vercel 서버 함수: 선생님 비밀번호 확인.
// Vercel 환경 변수 TEACHER_PIN 에 선생님 비밀번호(예: 숫자 4~8자리)를 넣어요.
const crypto = require('crypto');
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST'){ res.statusCode = 405; return res.end(JSON.stringify({ok:false, reason:'method'})); }
  const pin = process.env.TEACHER_PIN || '';
  if (!pin){ res.statusCode = 200; return res.end(JSON.stringify({ok:false, reason:'no-pin'})); }
  let body = req.body;
  if (!body || typeof body !== 'object'){
    body = await new Promise(resolve => { let s = ''; req.on('data', c => { s += c; if (s.length > 2000) req.destroy(); }); req.on('end', () => { try { resolve(JSON.parse(s)); } catch { resolve({}); } }); });
  }
  const given = String((body && body.pin) || '').slice(0, 64);
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(pin).digest();
  const ok = crypto.timingSafeEqual(a, b);
  res.statusCode = 200;
  res.end(JSON.stringify({ok, reason: ok ? '' : 'wrong'}));
};
