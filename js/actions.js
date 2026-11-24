/* actions.js
   행동 — 버튼을 눌렀을 때 하는 일(물건 만들기, 거래, 선생님 버튼 등)을 모아 둔 곳이에요. data-act="이름" 버튼은 여기 ACT.이름 을 실행해요.
*/
/* ================= 행동 ================= */
let toastT;
function toast(msg){ const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2600); }
/* 저장하는 동안 같은 버튼을 두 번 누르지 않게 막아요. 성공하면 true 를 돌려줘요.
   서버 응답이 너무 늦으면(8초) 버튼을 다시 풀어 줘요 — 화면이 멈춘 것처럼 보이지 않게. */
async function guarded(fn){
  if (!store) return false;
  if (S.busy){ toast('앞에 누른 것을 저장하는 중이에요. 잠시 뒤 다시 눌러 주세요.'); return false; }
  S.busy = true; render();
  const slow = setTimeout(() => { if (S.busy){ S.busy = false; render(); toast(S.online === false ? '인터넷 연결이 끊겼어요. 연결되면 자동으로 저장돼요.' : '저장이 늦어지고 있어요. 인터넷 연결을 확인해 주세요.'); } }, 8000);
  try { await fn(); return true; }
  catch (e) {
    console.error(e);
    toast(S.online === false ? '인터넷 연결이 끊겼어요. 연결되면 다시 눌러 보세요.' : '저장하지 못했어요. 잠시 뒤 다시 눌러 보세요.');
    return false;
  }
  finally { clearTimeout(slow); S.busy = false; render(); }
}
function setGame(patch){ const g = {...(S.game || {gid:null, round:0, tradeOpen:false, phase:'lobby', endsAt:null, events:[]}), ...patch, v:APP_VERSION}; return guarded(() => store.setGame(g)); }
function openSheet(s){ S.sheet = s; if (s && s.type === 'trade'){ if (S.draft.to !== s.to) S.draft = {to:s.to, give:{}, get:{}}; } if (s && s.type === 'plan'){ const p = planOf(S.me); S.planDraft = p ? {target:p.target, from:{...p.from}} : (S.planDraft || {target:'', from:{}}); } keys.clear(); P.target = null; render(); }

const ACT = {
  view: d => { location.hash = d.v; },
  /* 나라 고르기 */
  openPicker: () => { S.picker = true; S.pickSel = S.me; S.sheet = null; render(); },
  closePicker: () => { if (S.me){ S.picker = false; render(); } },
  pickRole: d => { if (!RO[d.id] && d.id !== '') return; S.role = d.id; document.querySelectorAll('[data-act="pickRole"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === d.id))); },
  pickSel: d => { if (!NI[d.id]) return; S.pickSel = d.id; document.querySelectorAll('[data-act="pickSel"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === d.id))); const go = $('#pickGo'); if (go) go.disabled = false; },
  pickGo: () => {
    if (!NI[S.pickSel]) return;
    S.nick = cleanNick($('#nick')?.value);
    const changed = S.me !== S.pickSel;
    S.me = S.pickSel; S.picker = false;
    try { localStorage.setItem('trade-me', S.me); localStorage.setItem('trade-nick', S.nick); localStorage.setItem('trade-role', S.role || ''); } catch {}
    if (changed){ S.draft = {to:'', give:{}, get:{}}; goHome(); }
    sendPresence(true); render();
    $('#world')?.focus();
  },
  /* 세계 */
  interact: () => { if (S.near) S.near.go(); },
  sheet: d => { if (['offers', 'board', 'plan', 'quiz', 'nation'].includes(d.t)) openSheet({type:d.t}); },
  reload: () => location.reload(),
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
  quest: d => {
    const r = round(), slot = Number(d.slot); if (!playing() || !S.me) return;
    const q = questsOf(S.me, r)[slot]; if (!q) return;
    if (questDone(S.me, r, slot)) return toast('이미 들어준 부탁이에요.');
    if (!has(avail(S.me, r), q.cost)) return toast('필요한 자원이 부족해요.');
    guarded(async () => { await store.addQuest({gid:S.game.gid, r, nation:S.me, slot, at:Date.now()}); toast(`${RESIDENT_NAMES[slot % RESIDENT_NAMES.length]}: 고마워요! 행복도 +${VILLAGE.questUp}`); });
  },
  hire: () => {
    if (!playing() || !S.me) return;
    const e = econ(S.me), price = hirePrice(e.res);
    if (e.res >= VILLAGE.residentsMax) return toast('마을이 가득 찼어요.');
    if (goldAvail(S.me) < price) return toast(`금이 ${price}개 필요해요.`);
    guarded(async () => { await store.addHire({gid:S.game.gid, r:round(), nation:S.me, at:Date.now()}); toast(`새 주민이 이사 왔어요! (금 -${price})`); });
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
    const side = d.side === 'give' ? 'give' : 'get', k = d.res; if (!RES[k] && k !== 'gold') return;
    const cur = S.draft[side][k] || 0;
    let v = cur + (d.dir === '+' ? 1 : -1);
    const max = k === 'gold' ? (side === 'give' ? goldAvail(S.me) : 30) : (side === 'give' ? avail(S.me, round())[k] : 9);
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
    if ((give.gold || 0) > goldAvail(S.me)) return toast('줄 금이 부족해요.');
    if (!fitsStorage(S.me, r, noGold(get))) return toast(`우리 창고가 가득 차서 받을 수 없어요. (자원마다 ${storageCap(S.me, r)}개까지)`);
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
    if (!has(inv(t.from, r), t.give) || (t.give.gold || 0) > econ(t.from).gold) return toast(`${NI[t.from].name}의 자원이나 금이 부족해서 거래할 수 없어요.`);
    if (!has(avail(t.to, r), t.get) || (t.get.gold || 0) > goldAvail(t.to)) return toast('우리 나라 자원이나 금이 부족해서 거래할 수 없어요.');
    if (!fitsStorage(t.to, r, noGold(t.give))) return toast(`우리 창고가 가득 차서 받을 수 없어요. 금으로 창고를 늘려 보세요.`);
    if (!fitsStorage(t.from, r, noGold(t.get))) return toast(`${NI[t.from].name} 창고가 가득 차서 거래할 수 없어요.`);
    for (const x of tariffsOf({...t, doneAt:Date.now()})){
      const g = x.payer === t.to ? goldAvail(t.to) - (t.get.gold || 0) : econ(t.from).gold - (t.give.gold || 0);
      if (g < x.n) return toast(`${NI[x.payer].name}가 낼 관세 금 ${x.n}개가 부족해요.`);
    }
    guarded(async () => { const ok = await store.acceptTrade(t.id); toast(ok ? '거래 성공! 자원이 바뀌었어요.' : '이미 처리된 제안이에요.'); });
  },
  fta: d => {
    const to = d.to, r = round(); if (!NI[to] || !playing() || !S.game.tradeOpen) return toast('무역이 열린 라운드에만 협정을 맺을 수 있어요.');
    if (ftaBetween(S.me, to)) return toast('이미 협정을 맺은 나라예요.');
    if (S.ftas.some(f => f.status === 'pending' && ((f.from === S.me && f.to === to) || (f.from === to && f.to === S.me)))) return toast('이미 협정 제안이 오가고 있어요.');
    guarded(async () => { await store.addFta({gid:S.game.gid, r, from:S.me, to, status:'pending', at:Date.now()}); toast(`${NI[to].name}에 무역 협정을 제안했어요.`); });
  },
  ftaAnswer: d => { const f = S.ftas.find(x => x.id === d.id); if (!f || f.status !== 'pending') return; guarded(async () => { const ok = await store.answerFta(f.id, d.ok === '1'); toast(ok ? (d.ok === '1' ? '무역 협정을 맺었어요! 서로 거래할 때마다 점수 +' + FTA.bonus + ', 관세 없음' : '협정을 거절했어요.') : '이미 처리된 제안이에요.'); }); },
  ftaCancel: d => { const f = S.ftas.find(x => x.id === d.id); if (f && f.status === 'pending') guarded(() => store.cancelFta(f.id)); },
  upgrade: () => {
    if (!playing() || !S.me) return;
    if (storageLevel(S.me) >= STORAGE.maxLevel) return toast('창고를 더 늘릴 수 없어요.');
    const price = storagePrice(S.me); if (goldAvail(S.me) < price) return toast(`금이 ${price}개 필요해요.`);
    guarded(async () => { await store.addUpgrade({gid:S.game.gid, r:round(), nation:S.me, at:Date.now()}); toast(`창고를 늘렸어요! 이제 자원마다 ${storageCap(S.me) + STORAGE.step}개까지 (금 -${price})`); });
  },
  quizAns: d => {
    const q = quizOpen(); if (!q || !S.me) return; if (quizAnsweredHere(q.id)) return toast('이미 답했어요.');
    const pick = Number(d.o), ok = pick === q.a;
    try { localStorage.setItem('trade-quiz:' + q.id, String(pick)); } catch {}
    guarded(async () => { await store.addAnswer({gid:S.game.gid, qid:q.id, r:round(), nation:S.me, ok, at:Date.now()}); toast(ok ? `정답! ${NI[S.me].name}에 ${RES[NI[S.me].spec][1]} ${RES[NI[S.me].spec][0]} +${QUIZ_REWARD.perAnswer}` : `아쉬워요. 정답은 "${q.o[q.a]}"예요.`); });
  },
  saveNote: () => {
    const s = S.sheet; if (!s || s.type !== 'reflect' || !S.me) return;
    const el = $('#noteText'), text = (el?.value || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120);
    if (!text) return toast('한 줄이라도 적어 주세요.');
    guarded(async () => { await store.setNote(S.me + '_' + s.r, {text, at:Date.now()}); S.sheet = null; toast('성찰을 저장했어요.'); });
  },
  /* 선생님: 관세, 문제 */
  tariff: () => {
    const r = round(), nid = S.blockPick, n = Number(S.tariffAmt) || TARIFF_AMOUNTS[0]; if (r < 1) return toast('라운드를 먼저 시작하세요.'); if (!NI[nid]) return;
    setGame({events:[...S.game.events, {r, kind:'tariff', nation:nid, res:null, n, pid:'', key:newId()}]}).then(ok => ok && toast(`${NI[nid].name}에 관세 금 ${n}을 매겼어요.`));
  },
  quizPost: d => {
    const r = round(); if (r < 1) return toast('라운드를 먼저 시작하세요.');
    let q;
    if (d.i !== undefined){ const b = QUIZ_BANK[Number(d.i)]; if (!b) return; q = {q:b.q, o:[...b.o], a:b.a}; }
    else {
      const qt = ($('#cqQ')?.value || '').trim(), o = ['#cqO0', '#cqO1', '#cqO2', '#cqO3'].map(s => ($(s)?.value || '').trim()).filter(Boolean), a = Number($('#cqA')?.value || 0);
      if (!qt || o.length < 2) return toast('문제와 보기를 2개 이상 써 주세요.');
      if (!(a < o.length)) return toast('정답 번호를 확인해 주세요.');
      q = {q:qt, o, a};
    }
    setGame({quiz:{...q, id:newId(), r, open:true}}).then(ok => { if (ok) toast('학생들에게 문제를 냈어요. 학생 화면 위에 ❓ 문제 버튼이 나타나요.'); });
  },
  quizClose: () => { if (S.game?.quiz) setGame({quiz:{...S.game.quiz, open:false}}).then(ok => ok && toast('문제를 닫았어요.')); },
  cancel: d => { const t = S.trades.find(x => x.id === d.id); if (t && t.status === 'pending') guarded(() => store.updateTrade(t.id, {status:'cancelled'})); },
  /* 선생님 */
  round: d => { const r = Number(d.r); if (!ROUNDS[r]) return; S.confirmReset = false; setGame({gid:S.game?.gid || newId(), round:r, tradeOpen:r >= 2, phase:'play', endsAt:null, startedAt:Date.now() + (S.offset || 0), paused:false, pausedLeft:null}); },
  endGame: () => setGame({phase:'end', endsAt:null, paused:false, pausedLeft:null}),
  /* 전체 멈춤: 타이머도 같이 멈춰요 */
  pause: () => {
    const g = S.game; if (!g) return; const now = Date.now() + (S.offset || 0);
    if (!g.paused) setGame({paused:true, pausedAt:now, pausedLeft:g.endsAt ? Math.max(1000, g.endsAt - now) : null, endsAt:null}).then(ok => ok && toast('모든 학생 화면을 멈췄어요.'));
    else setGame({paused:false, endsAt:g.pausedLeft ? now + g.pausedLeft : null, pausedLeft:null, startedAt:g.startedAt ? g.startedAt + Math.max(0, now - (g.pausedAt || now)) : null, pausedAt:null}).then(ok => ok && toast('다시 시작했어요.'));
  },
  news: () => setGame({news:!S.game?.news}).then(ok => ok && toast(S.game?.news ? '자동 뉴스 속보를 켰어요.' : '자동 뉴스 속보를 껐어요.')),
  fx: d => {
    const r = round(), nid = S.blockPick, n = Number(d.n) > 0 ? 1 : -1; if (r < 1) return toast('라운드를 먼저 시작하세요.'); if (!NI[nid]) return;
    const rest = S.game.events.filter(e => !(e.r === r && e.kind === 'fx' && e.nation === nid));
    setGame({events:[...rest, {r, kind:'fx', nation:nid, res:null, n, pid:'', key:newId()}]}).then(ok => ok && toast(`${NI[nid].name}의 돈 가치를 ${n > 0 ? '올렸어요' : '내렸어요'}.`));
  },
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
  if (S.game?.paused && el.closest('#game')) return toast('⏸ 선생님 설명 시간이에요. 잠깐 화면을 봐 주세요.');
  const f = ACT[el.dataset.act]; if (f) f(el.dataset);
});
document.addEventListener('change', e => { if (e.target.id === 'blockPick') S.blockPick = e.target.value; if (e.target.id === 'tariffAmt') S.tariffAmt = e.target.value; });

