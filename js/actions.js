/* actions.js
   행동 — 버튼을 눌렀을 때 하는 일(물건 만들기, 거래, 선생님 버튼 등)을 모아 둔 곳이에요. data-act="이름" 버튼은 여기 ACT.이름 을 실행해요.
*/
/* ================= 행동 ================= */
let toastT;
function toast(msg){ const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2600); }
async function guarded(fn){
  if (S.busy || !store) return; S.busy = true; render();
  try { await fn(); }
  catch (e) {
    toast(S.online === false ? '인터넷 연결이 끊겼어요. 연결되면 다시 눌러 보세요.' : '저장하지 못했어요. 잠시 뒤 다시 눌러 보세요.');
  }
  finally { S.busy = false; render(); }
}
function setGame(patch){ const g = {...(S.game || {gid:null, round:0, tradeOpen:false, phase:'lobby', endsAt:null, events:[]}), ...patch}; return guarded(() => store.setGame(g)); }
function openSheet(s){ S.sheet = s; if (s && s.type === 'trade'){ if (S.draft.to !== s.to) S.draft = {to:s.to, give:{}, get:{}}; } if (s && s.type === 'plan'){ const p = planOf(S.me); S.planDraft = p ? {target:p.target, from:{...p.from}} : (S.planDraft || {target:'', from:{}}); } keys.clear(); P.target = null; render(); }

const ACT = {
  view: d => { location.hash = d.v; },
  /* 나라 고르기 */
  openPicker: () => { S.picker = true; S.pickSel = S.me; S.sheet = null; render(); },
  closePicker: () => { if (S.me){ S.picker = false; render(); } },
  pickSel: d => { if (!NI[d.id]) return; S.pickSel = d.id; document.querySelectorAll('[data-act="pickSel"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === d.id))); const go = $('#pickGo'); if (go) go.disabled = false; },
  pickGo: () => {
    if (!NI[S.pickSel]) return;
    S.nick = cleanNick($('#nick')?.value);
    const changed = S.me !== S.pickSel;
    S.me = S.pickSel; S.picker = false;
    try { localStorage.setItem('trade-me', S.me); localStorage.setItem('trade-nick', S.nick); } catch {}
    if (changed){ S.draft = {to:'', give:{}, get:{}}; goHome(); }
    sendPresence(true); render();
    $('#world')?.focus();
  },
  /* 세계 */
  interact: () => { if (S.near) S.near.go(); },
  sheet: d => { if (['offers', 'board', 'plan'].includes(d.t)) openSheet({type:d.t}); },
  close: () => { S.sheet = null; render(); $('#world')?.focus(); },
  make: d => {
    const it = II[d.id], r = round(); if (!it || !playing() || !S.me) return;
    if (!has(avail(S.me, r), it.cost)) return toast('자원이 부족해요.');
    guarded(async () => { await store.addMake({gid:S.game.gid, r, nation:S.me, item:it.id, at:Date.now()}); toast(`${it.i} ${it.name}을(를) 만들었어요! +${it.pt}점`); });
  },
  build: d => {
    const B = BI[d.id], r = round(); if (!B || !playing() || !S.me) return;
    if (builtOf(S.me, B.id)) return toast('이미 지은 건물이에요.');
    if (!has(avail(S.me, r), B.cost)) return toast('자원이 부족해요.');
    guarded(async () => { await store.addBuild({gid:S.game.gid, r, nation:S.me, b:B.id, at:Date.now()}); toast(`${B.i} ${B.name}을(를) 지었어요! +${BUILD_PT}점`); });
  },
  planTarget: d => {
    const t = d.v; if (!targetName(t)) return;
    const from = {};
    for (const k of RK) if ((targetCost(t)[k] || 0) > 0){ const n = NATIONS.find(x => x.spec === k && x.id !== S.me); if (n) from[k] = n.id; }
    S.planDraft = {target:t, from}; render();
  },
  planFrom: d => { if (!S.planDraft || !RES[d.res] || !NI[d.n]) return; S.planDraft.from[d.res] = d.n; render(); },
  savePlan: () => {
    const p = S.planDraft; if (!p || !targetName(p.target) || !S.game?.gid) return toast('먼저 만들고 싶은 것을 골라요.');
    const need = planNeeds(p.target), from = {};
    for (const k of RK) if (need[k] && p.from[k]) from[k] = p.from[k];
    guarded(async () => { await store.setPlan(S.me, {target:p.target, from, r:round(), at:Date.now()}); toast('무역 계획서를 저장했어요. 선생님 화면에도 보여요.'); });
  },
  step: d => {
    const side = d.side === 'give' ? 'give' : 'get', k = d.res; if (!RES[k]) return;
    const cur = S.draft[side][k] || 0;
    let v = cur + (d.dir === '+' ? 1 : -1);
    const max = side === 'give' ? avail(S.me, round())[k] : 9;
    v = Math.max(0, Math.min(max, v));
    if (v) S.draft[side][k] = v; else delete S.draft[side][k];
    render();
  },
  clearDraft: () => { S.draft.give = {}; S.draft.get = {}; render(); },
  send: () => {
    const r = round(), dr = S.draft, bl = blockedIn(r);
    if (!playing() || !S.game.tradeOpen) return toast('지금은 무역을 할 수 없어요.');
    if (!NI[dr.to]) return toast('거래할 나라를 먼저 고르세요.');
    if (bl.has(S.me) || bl.has(dr.to)) return toast('이번 라운드에는 그 나라와 거래할 수 없어요.');
    const give = cleanBag(dr.give), get = cleanBag(dr.get);
    if (!total(give) || !total(get)) return toast('주는 것과 받는 것을 하나 이상씩 정하세요.');
    if (!has(avail(S.me, r), give)) return toast('줄 자원이 부족해요.');
    guarded(async () => {
      await store.addTrade({gid:S.game.gid, r, from:S.me, to:dr.to, give, get, status:'pending', at:Date.now()});
      S.draft = {to:dr.to, give:{}, get:{}};
      toast(`${NI[dr.to].name}에 거래를 제안했어요. 답을 기다려요.`);
    });
  },
  answer: d => {
    const t = S.trades.find(x => x.id === d.id), r = round(); if (!t || t.status !== 'pending') return;
    if (d.ok !== '1') return guarded(async () => { await store.updateTrade(t.id, {status:'rejected'}); toast('거래를 거절했어요.'); });
    const bl = blockedIn(r);
    if (t.r !== r || !S.game.tradeOpen) return toast('지난 라운드의 제안이라 받을 수 없어요.');
    if (bl.has(t.from) || bl.has(t.to)) return toast('이번 라운드에는 이 나라와 거래할 수 없어요.');
    if (!has(inv(t.from, r), t.give)) return toast(`${NI[t.from].name}의 자원이 부족해서 거래할 수 없어요.`);
    if (!has(avail(t.to, r), t.get)) return toast('우리 나라 자원이 부족해서 거래할 수 없어요.');
    guarded(async () => { const ok = await store.acceptTrade(t.id); toast(ok ? '거래 성공! 자원이 바뀌었어요.' : '이미 처리된 제안이에요.'); });
  },
  cancel: d => { const t = S.trades.find(x => x.id === d.id); if (t && t.status === 'pending') guarded(() => store.updateTrade(t.id, {status:'cancelled'})); },
  /* 선생님 */
  round: d => { const r = Number(d.r); if (!ROUNDS[r]) return; S.confirmReset = false; setGame({gid:S.game?.gid || newId(), round:r, tradeOpen:r >= 2, phase:'play', endsAt:null}); },
  endGame: () => setGame({phase:'end', endsAt:null}),
  trade: () => setGame({tradeOpen:!S.game?.tradeOpen}),
  timer: d => setGame({endsAt: Number(d.m) ? Date.now() + (S.offset || 0) + Number(d.m) * 60000 : null}),
  event: d => {
    const r = round(); if (r < 1) return toast('라운드를 먼저 시작하세요.');
    const p = EVENTS.find(x => x.id === d.id); if (!p) return;
    if ((S.game.events || []).some(e => e.r === r && e.pid === p.id)) return toast('이번 라운드에 이미 발동한 사건이에요.');
    setGame({events:[...S.game.events, {r, kind:p.kind, nation:p.nation, res:p.res || null, n:p.n || 0, pid:p.id, key:newId()}]});
  },
  block: () => {
    const r = round(), nid = S.blockPick; if (r < 1) return toast('라운드를 먼저 시작하세요.'); if (!NI[nid]) return;
    if (blockedIn(r).has(nid)) return toast('이미 무역이 막힌 나라예요.');
    setGame({events:[...S.game.events, {r, kind:'block', nation:nid, res:null, n:0, pid:'', key:newId()}]});
  },
  unevent: d => setGame({events:S.game.events.filter(e => e.key !== d.key)}),
  reset: () => {
    if (!S.confirmReset){ S.confirmReset = true; render(); return; }
    S.confirmReset = false; const g = {gid:newId(), round:0, tradeOpen:false, phase:'lobby', endsAt:null, events:[]};
    guarded(() => store.resetAll(g));
  },
  resetNo: () => { S.confirmReset = false; render(); },
  teacherLogout: () => teacherLogout(),
  copyLink: () => S.join && copyText(studentLink(S.join), 'shareLink'),
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const f = ACT[el.dataset.act]; if (f) f(el.dataset);
});
document.addEventListener('change', e => { if (e.target.id === 'blockPick') S.blockPick = e.target.value; });

