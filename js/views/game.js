/* views/game.js
   무역 게임 화면 — 지도 위 HUD, 나라 고르기, 공장·거래·제안·게시판 창.
*/
/* ================= 화면: 게임 (RPG) ================= */
function timerText(){
  if (!S.game?.endsAt) return '';
  const s = Math.max(0, Math.round((S.game.endsAt - Date.now() - (S.offset || 0)) / 1000));
  return s ? `⏱ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '⏱ 시간 끝!';
}
function statusPills(){
  const g = S.game, r = round();
  if (!g || g.phase === 'lobby' || r === 0) return `<span class="pill">게임 준비 중 · 선생님을 기다려요</span>`;
  if (g.phase === 'end') return `<span class="pill">게임 끝</span>`;
  return `<span class="pill acc">${ROUNDS[r].t} · ${ROUNDS[r].s}</span>
    ${g.tradeOpen ? '<span class="pill ok">무역 가능 · 다리 열림</span>' : '<span class="pill bad">무역 금지 · 다리 닫힘</span>'}
    <span class="timer" data-timer>${timerText()}</span>`;
}
function mountGame(){
  return `<div class="game" id="game">
    <canvas id="world" tabindex="0" aria-label="무역 세계 지도. 방향키나 WASD로 움직이고 스페이스로 말을 걸어요."></canvas>
    <div class="hud" id="hud"></div>
        <div class="banner" id="banner" hidden></div>
    <div class="help">이동: 방향키 · WASD · 지도 클릭 &nbsp;|&nbsp; 말 걸기: Space</div>
    <div class="pad" id="pad" aria-hidden="true">
      <span></span><button data-pad="up" aria-label="위로">${icon('up')}</button><span></span>
      <button data-pad="left" aria-label="왼쪽으로">${icon('left')}</button><span></span><button data-pad="right" aria-label="오른쪽으로">${icon('right')}</button>
      <span></span><button data-pad="down" aria-label="아래로">${icon('down')}</button><span></span>
    </div>
    <button class="prompt" id="prompt" data-act="interact" hidden></button>
    <div class="layer" id="sheet" hidden></div>
    <div class="layer" id="picker" hidden></div>
  </div>`;
}
function afterMountGame(){
  const pad = $('#pad');
  const end = e => { const b = e.target.closest('[data-pad]'); if (b) keys.delete(b.dataset.pad); };
  pad.addEventListener('pointerdown', e => { const b = e.target.closest('[data-pad]'); if (!b) return; e.preventDefault(); b.setPointerCapture?.(e.pointerId); P.target = null; keys.add(b.dataset.pad); });
  pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end); pad.addEventListener('lostpointercapture', end);
  const cv = $('#world');
  cv.addEventListener('pointerdown', e => {
    if (!cam || !S.me || S.sheet || S.picker) return;
    const r = cv.getBoundingClientRect();
    const wx = ((e.clientX - r.left) - cam.cw / 2) / cam.z + cam.camX, wy = ((e.clientY - r.top) - cam.ch / 2) / cam.z + cam.camY;
    P.target = {x:wx / T, y:wy / T}; cv.focus();
  });
  S.near = null; paintPrompt();
}
function updateGame(){
  if (!S.me && !S.picker){ S.picker = true; S.pickSel = null; }
  const pk = $('#picker');
  if (S.picker){ if (pk.hidden || pk.dataset.built !== '1'){ pk.innerHTML = pickerHtml(); pk.dataset.built = '1'; } pk.hidden = false; }
  else { pk.hidden = true; pk.dataset.built = ''; }
  const hud = $('#hud');
  if (!S.me){ hud.innerHTML = ''; $('#sheet').hidden = true; return; }
  const me = NI[S.me], r = round(), ic = incomingCount();
  const sc = r ? score(S.me, r).total : 0;
  hud.innerHTML = `<div class="glass who nc-${me.id}"><span class="fl"><img src="${animalPortrait(me.id)}" alt=""></span><div><b>${me.name}</b>${S.nick ? `<div class="nick">탐험가 ${esc(S.nick)}</div>` : ''}</div></div>
    <div class="glass status">${statusPills()}</div>
    <div class="right">
      <span class="glass scorebox"><span class="medal">${icon('star')}</span><span class="score">${sc}점</span><span class="small muted long">이번 라운드 · 합계 ${totalScore(S.me)}점</span></span>
      <button class="hbtn ${ic ? 'hot' : ''}" data-act="sheet" data-t="offers">${icon('mail')}<span>제안</span>${ic ? `<span class="badge">${ic}</span>` : ''}</button>
      <button class="hbtn ${r === 1 && !planOf(S.me) && S.game?.phase === 'play' ? 'hot' : ''}" data-act="sheet" data-t="plan" aria-label="무역 계획서">${icon('note')}<span class="long">계획서</span></button>
      <button class="hbtn" data-act="sheet" data-t="board" aria-label="규칙">${icon('scroll')}<span class="long">규칙</span></button>
      <button class="hbtn" data-act="openPicker" aria-label="나라 바꾸기">${icon('swap')}<span class="long">나라 바꾸기</span></button>
    </div><div class="resbar" id="resbar"></div>`;
  const rb = $('#resbar');
  if (r && S.game?.phase === 'play'){
    const a = avail(S.me, r), l = locked(S.me, r);
    rb.innerHTML = RK.map(k => `<span class="res ${a[k] ? '' : 'zero'}" title="${RES[k][0]}"><span class="ri">${RES[k][1]}</span>${a[k]}${l[k] ? `<span class="lk">(+${l[k]} 묶임)</span>` : ''}</span>`).join('');
  } else rb.innerHTML = '';
  // 사건 알림
  const evs = (S.game?.events || []).filter(e => e.r === r);
  for (const e of evs){ const k = (S.game.gid || '') + e.key; if (!S.seenEvents.has(k)){ S.seenEvents.add(k); showBanner(e); } }
  // 패널
  const sh = $('#sheet');
  if (S.sheet){ sh.innerHTML = `<div class="panel" role="dialog" aria-modal="true">${sheetHtml()}</div>`; sh.hidden = false; }
  else sh.hidden = true;
}
let bannerT;
function showBanner(e){
  const el = $('#banner'); if (!el) return; const x = evInfo(e);
  el.innerHTML = `<span class="ico" aria-hidden="true">📰</span><div><h3>사건 발생! ${esc(x.t)}</h3><p>${esc(x.text)}</p></div>`;
  el.hidden = false; clearTimeout(bannerT); bannerT = setTimeout(() => { el.hidden = true; }, 8000);
}
function pickerHtml(){
  return `<div class="panel" role="dialog" aria-modal="true">
    <div class="panel-h"><div><h2>우리 모둠은 어느 나라인가요?</h2><p class="sub">무역 탐험가 등록</p></div>${S.me ? `<button class="x" data-act="closePicker" aria-label="닫기">${icon('close')}</button>` : ''}</div>
    <p class="muted small">같은 모둠 친구들은 모두 같은 나라를 골라요. 자원과 점수는 모둠 친구들과 함께 쓰고, 캐릭터는 각자 움직여요.</p>
    <div class="nations">${NATIONS.map(n => {
      const inc = Object.entries(n.income).map(([k, v]) => `${RES[k][1]}×${v}`).join(' ');
      return `<button class="nation nc-${n.id}" data-act="pickSel" data-id="${n.id}" aria-pressed="${S.pickSel === n.id}"><span class="flag"><img src="${animalPortrait(n.id)}" alt=""></span><span class="nm">${n.name}</span><span class="small" style="font-weight:700">${n.flag} ${ANIMALS[animalOf(n)].name} 탐험가</span><span class="small">${esc(n.desc)}</span><span class="small muted">매 라운드 자원 ${inc}</span></button>`;
    }).join('')}</div>
    <div class="row"><label for="nick" class="small" style="font-weight:700">내 별명 (${NICK_MAX}글자까지)</label><input type="text" id="nick" maxlength="${NICK_MAX}" placeholder="예: 민준" value="${esc(S.nick)}" autocomplete="off"></div>
    <div class="row"><button class="btn" id="pickGo" data-act="pickGo" ${S.pickSel ? '' : 'disabled'}>이 나라로 출발!</button></div>
  </div>`;
}
function sheetHtml(){
  const s = S.sheet, r = round();
  const head = (title, sub='') => `<div class="panel-h"><div><h2>${title}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div><button class="x" data-act="close" aria-label="닫기">${icon('close')}</button></div>`;
  if (s.type === 'factory') return head(`${NI[S.me].name} 공장`, '자원을 모아 물건을 만들어요') + factoryHtml(r);
  if (s.type === 'trade') return head(`${NI[s.to].flag} ${NI[s.to].name} 세관`, `${NI[s.to].name}가 잘 만드는 자원: ${RES[NI[s.to].spec][1]} ${RES[NI[s.to].spec][0]}`) + tradeHtml(r, s.to);
  if (s.type === 'offers') return head('들어온 제안', '어디에서든 수락하거나 거절할 수 있어요') + offersHtml(r);
  if (s.type === 'board') return head('무역 광장 게시판') + boardHtml(r);
  if (s.type === 'plan') return head(`${NI[S.me].name} 무역 계획서`, '무엇을 만들고, 모자란 자원을 어느 나라에서 구할지 정해요') + planHtml(r);
  return head('');
}
function needPlay(){
  const g = S.game;
  if (!g || g.phase === 'lobby' || round() === 0) return '<p class="lockbox">선생님이 게임을 시작하면 자원을 받아요. 그동안 지도를 둘러보며 다른 나라의 세관 위치를 찾아 두세요.</p>';
  if (g.phase === 'end') return '<p class="lockbox">게임이 끝났어요. 위쪽 <b>정리하기</b> 탭에서 결과를 확인해요.</p>';
  return '';
}
function stockHtml(r){
  const a = avail(S.me, r);
  return `<div class="stock">${RK.map(k => `<div class="crate ${a[k] ? '' : 'zero'}"><span class="top">${RES[k][1]} ${RES[k][0]}</span><span class="n">${a[k]}</span></div>`).join('')}</div>`;
}
function factoryHtml(r){
  const np = needPlay(); if (np) return np;
  const a = avail(S.me, r), sc = score(S.me, r), ok = writable() && !S.busy;
  const cards = ITEMS.map(it => {
    const cost = RK.filter(k => it.cost[k]).map(k => `<span class="chip ${a[k] < it.cost[k] ? 'short' : ''}">${RES[k][1]}×${it.cost[k]}</span>`).join('');
    const c = S.makes.filter(m => m.r === r && m.nation === S.me && m.item === it.id).length;
    return `<div class="item"><div class="hd"><span class="ic" aria-hidden="true">${it.i}</span><span class="nm">${it.name}</span><span class="pt">${it.pt}점</span></div>
      <div class="cost">${cost}</div>
      <div class="row" style="justify-content:space-between"><span class="made">${c ? `이번 라운드 ${c}개` : '&nbsp;'}</span>
      <button class="btn sm" data-act="make" data-id="${it.id}" ${has(a, it.cost) && ok ? '' : 'disabled'}>만들기</button></div></div>`;
  }).join('');
  const dots = Array.from({length:BONUS_KINDS}, (_, i) => i).map(i => `<i class="${i < sc.kinds ? 'on' : ''}"></i>`).join('');
  return `<div class="sect"><span class="label">우리 창고</span>${stockHtml(r)}</div>
    <div class="sect"><span class="label">만들 수 있는 물건 · 빨간 자원이 모자라요</span><div class="items">${cards}</div></div>
    <div class="sect"><span class="label">우리 나라 개발 · 건물은 게임이 끝날 때까지 남아요</span><div class="items">${buildCards(r, ok)}</div></div>
    <div class="scorebar"><span>이번 라운드 <span class="big">${sc.total}점</span></span>
    <span class="small">물건 종류 <span class="dots">${dots}</span> ${sc.kinds}/${BONUS_KINDS} ${sc.bonus ? `<b style="color:var(--ok)">보너스 +${BONUS} 달성!</b>` : `(${BONUS_KINDS}가지면 +${BONUS})`}</span>
    ${sc.dev ? `<span class="small">개발 점수 +${sc.dev}</span>` : ''}</div>
    ${r === 1 && !planOf(S.me) ? `<p class="lockbox">물건을 다 만들었으면 광장의 다른 나라 세관에서 <b>전시판</b>을 보고, 화면 위 <b>계획서</b> 버튼으로 무역 계획을 세워요. <button class="btn sm" data-act="sheet" data-t="plan">계획서 쓰기</button></p>` : ''}`;
}
function buildCards(r, ok){
  const a = avail(S.me, r);
  return BUILDINGS.map(B => {
    const done = builtOf(S.me, B.id);
    const cost = RK.filter(k => B.cost[k]).map(k => `<span class="chip ${!done && a[k] < B.cost[k] ? 'short' : ''}">${RES[k][1]}×${B.cost[k]}</span>`).join('');
    return `<div class="item ${done ? 'built' : ''}"><div class="hd"><span class="ic" aria-hidden="true">${B.i}</span><span class="nm">${B.name}</span><span class="pt">+${BUILD_PT}점</span></div>
      <p class="small">${esc(B.desc)}</p>
      ${done ? `<p class="small" style="font-weight:700;color:var(--green-ink)">✔ ${done.r}라운드에 지었어요</p>` : `<div class="cost">${cost}</div>
      <div class="row" style="justify-content:flex-end"><button class="btn ok sm" data-act="build" data-id="${B.id}" ${has(a, B.cost) && ok ? '' : 'disabled'}>짓기</button></div>`}</div>`;
  }).join('');
}
/* 다른 나라 창고 전시판 */
function exhibitHtml(r, to){
  const a = avail(to, r), n = NI[to], blds = BUILDINGS.filter(B => builtOf(to, B.id));
  return `<div class="sect"><span class="label">${n.flag} ${n.name} 창고 전시판 · 지금 가진 자원</span>
    <div class="stock">${RK.map(k => `<div class="crate ${a[k] ? '' : 'zero'} ${k === n.spec ? 'spec' : ''}"><span class="top">${RES[k][1]} ${RES[k][0]}</span><span class="n">${a[k]}</span></div>`).join('')}</div>
    <p class="small muted">개발한 건물: ${blds.length ? blds.map(B => `${B.i} ${B.name}`).join(', ') : '아직 없어요'}</p></div>`;
}
/* 무역 계획서 */
function planNeeds(t){ const c = targetCost(t), a = avail(S.me, round()), need = {}; for (const k of RK) if ((c[k] || 0) > (a[k] || 0)) need[k] = c[k] - (a[k] || 0); return need; }
function planHtml(r){
  const np = needPlay(); if (np) return np;
  const p = S.planDraft || {target:'', from:{}}, saved = planOf(S.me), ok = writable() && !S.busy;
  const opt = (t, label, cost) => `<button class="opt ${p.target === t ? 'right' : ''}" data-act="planTarget" data-v="${t}">${label}<span class="small" style="display:block;font-family:var(--body)">${RK.filter(k => cost[k]).map(k => `${RES[k][1]}×${cost[k]}`).join(' ')}</span></button>`;
  const targets = ITEMS.map(it => opt('item:' + it.id, `${it.i} ${it.name}`, it.cost)).join('') + BUILDINGS.filter(B => !builtOf(S.me, B.id)).map(B => opt('build:' + B.id, `${B.i} ${B.name}`, B.cost)).join('');
  let needHtml = '';
  if (p.target){
    const need = planNeeds(p.target), ks = RK.filter(k => need[k]);
    needHtml = ks.length ? `<div class="sect"><span class="label">2. 모자란 자원을 어느 나라에서 구할까요?</span><div class="list">${ks.map(k => `<div class="offer"><b>${RES[k][1]} ${RES[k][0]} ${need[k]}개 모자라요</b>
      <div class="row" style="gap:6px">${NATIONS.filter(n => n.id !== S.me).map(n => `<button class="opt ${p.from[k] === n.id ? 'right' : ''}" style="min-height:40px;padding:4px 12px;font-size:.95rem" data-act="planFrom" data-res="${k}" data-n="${n.id}">${n.flag} ${n.name}${n.spec === k ? ' ★' : ''}</button>`).join('')}</div></div>`).join('')}</div>
      <p class="small muted">★는 그 자원을 잘 만드는 나라예요. 광장 세관의 전시판에서 실제로 얼마나 가졌는지 확인해 봐요.</p></div>`
      : `<p class="lockbox">지금 가진 자원으로 바로 만들 수 있어요! 공장에서 만들어 보세요.</p>`;
  }
  return `${saved ? `<p class="lockbox">저장된 계획: <b>${targetName(saved.target)}</b> · ${Object.keys(saved.from).length ? RK.filter(k => saved.from[k]).map(k => `${RES[k][1]} ← ${NI[saved.from[k]].name}`).join(', ') : '모자란 자원 없음'}</p>` : ''}
    <div class="sect"><span class="label">1. 무엇을 만들거나 짓고 싶나요?</span><div class="row" style="gap:8px">${targets}</div></div>
    ${needHtml}
    <div class="row"><button class="btn" data-act="savePlan" ${p.target && ok ? '' : 'disabled'}>계획서 저장</button></div>`;
}
function offerSides(t, mine){
  return `<div class="swap"><div class="side"><span class="label">${mine ? '우리가 주는 것 (수출)' : `${NI[t.from].name}가 주는 것 (수입)`}</span><div class="cost">${bagChips(t.give)}</div></div>
    <span class="arrow" aria-hidden="true">⇄</span>
    <div class="side"><span class="label">${mine ? '우리가 받는 것 (수입)' : '우리가 주는 것 (수출)'}</span><div class="cost">${bagChips(t.get)}</div></div></div>`;
}
function tradeHtml(r, to){
  const np = needPlay(); if (np) return np;
  const bl = blockedIn(r);
  if (!S.game.tradeOpen) return `<p class="lockbox">🚧 지금은 무역이 금지된 라운드라 거래는 못 해요. 대신 전시판을 보고 다음 라운드의 무역 계획을 세워 보세요.</p>${exhibitHtml(r, to)}<div class="row"><button class="btn" data-act="sheet" data-t="plan">무역 계획서 쓰기</button></div>`;
  if (bl.has(S.me)) return `<p class="lockbox bad">⛔ 이번 라운드에 우리 나라는 다른 나라와 거래할 수 없어요.</p>`;
  if (bl.has(to)) return `<p class="lockbox bad">⛔ ${NI[to].name}는 이번 라운드에 무역을 막았어요. 세관 문이 닫혀 있어요. 다른 나라에서 필요한 자원을 구해 보세요.</p>`;
  const ok = writable() && !S.busy, a = avail(S.me, r), dr = S.draft;
  const steps = side => `<div class="steps">${RK.map(k => {
    const v = dr[side][k] || 0, max = side === 'give' ? a[k] : 9;
    return `<div class="step ${v ? 'has' : ''}"><span class="nm">${RES[k][1]} ${RES[k][0]}</span><span class="ctl">
      <button data-act="step" data-side="${side}" data-res="${k}" data-dir="-" ${v ? '' : 'disabled'} aria-label="${RES[k][0]} 줄이기">−</button>
      <span class="v">${v}</span>
      <button data-act="step" data-side="${side}" data-res="${k}" data-dir="+" ${v < max ? '' : 'disabled'} aria-label="${RES[k][0]} 늘리기">+</button></span></div>`;
  }).join('')}</div>`;
  const mine = S.trades.filter(t => t.r === r && t.from === S.me && t.to === to && t.status === 'pending');
  const theirs = S.trades.filter(t => t.r === r && t.from === to && t.to === S.me && t.status === 'pending').length;
  return `${exhibitHtml(r, to)}<div class="sect"><span class="label">우리 창고</span>${stockHtml(r)}</div>
    ${theirs ? `<p class="lockbox">${NI[to].name}가 보낸 제안이 ${theirs}건 있어요. <button class="btn sm" data-act="sheet" data-t="offers">제안 보기</button></p>` : ''}
    <div class="sect"><span class="label">우리가 줄 것 (수출)</span>${steps('give')}</div>
    <div class="sect"><span class="label">우리가 받고 싶은 것 (수입)</span>${steps('get')}</div>
    <div class="row"><button class="btn" data-act="send" ${total(dr.give) && total(dr.get) && ok ? '' : 'disabled'}>제안 보내기</button>
      <button class="btn ghost" data-act="clearDraft">다시 정하기</button></div>
    ${mine.length ? `<div class="sect"><span class="label">보낸 제안 · 답을 기다리는 중</span><div class="list">${mine.map(t => `<div class="offer">${offerSides(t, true)}<div class="row"><button class="btn ghost sm" data-act="cancel" data-id="${esc(t.id)}" ${ok ? '' : 'disabled'}>제안 취소</button></div></div>`).join('')}</div></div>` : ''}
    <p class="small muted">${NI[to].name} 친구들은 지도 어디에 있든 제안 버튼으로 우리 제안을 볼 수 있어요. 직접 찾아가서 말로 설명하면 더 잘 받아 줄 거예요!</p>`;
}
function offersHtml(r){
  const np = needPlay(); if (np) return np;
  const bl = blockedIn(r), ok = writable() && !S.busy;
  const mine = S.trades.filter(t => t.r === r);
  const incoming = mine.filter(t => t.to === S.me && t.status === 'pending').sort((a, b) => a.at - b.at);
  const outgoing = mine.filter(t => t.from === S.me && t.status === 'pending').sort((a, b) => a.at - b.at);
  const inHtml = incoming.length ? incoming.map(t => {
    const blockedPair = bl.has(t.from) || bl.has(S.me) || !S.game.tradeOpen;
    const canAccept = !blockedPair && has(inv(t.from, r), t.give) && has(avail(S.me, r), t.get);
    return `<div class="offer incoming"><div>${nTag(t.from)} <span class="small muted">의 제안</span></div>
      ${offerSides(t, false)}
      ${canAccept ? '' : `<p class="small" style="color:var(--bad)">${blockedPair ? '지금은 이 나라와 거래할 수 없어요.' : '자원이 부족해서 지금은 받을 수 없어요.'}</p>`}
      <div class="row"><button class="btn ok sm" data-act="answer" data-ok="1" data-id="${esc(t.id)}" ${canAccept && ok ? '' : 'disabled'}>수락</button>
      <button class="btn ghost sm" data-act="answer" data-ok="0" data-id="${esc(t.id)}" ${ok ? '' : 'disabled'}>거절</button></div></div>`;
  }).join('') : '<p class="muted small">아직 들어온 제안이 없어요.</p>';
  const outHtml = outgoing.length ? outgoing.map(t => `<div class="offer"><div class="row" style="justify-content:space-between"><span class="small">→ ${nTag(t.to)}에 보낸 제안</span>
      <button class="btn ghost sm" data-act="cancel" data-id="${esc(t.id)}" ${ok ? '' : 'disabled'}>취소</button></div>${offerSides(t, true)}</div>`).join('') : '<p class="muted small">보낸 제안이 없어요. 다른 나라 세관에 찾아가 제안해 보세요.</p>';
  const done = mine.filter(t => (t.from === S.me || t.to === S.me) && (t.status === 'accepted' || t.status === 'rejected')).sort((a, b) => b.at - a.at).slice(0, 6);
  const hist = done.length ? `<div class="history">${done.map(t => {
    const other = t.from === S.me ? t.to : t.from, out = t.from === S.me ? t.give : t.get, inn = t.from === S.me ? t.get : t.give;
    return `<div class="h">${t.status === 'accepted' ? `<span class="contract">${contractNo(t)}</span>` : '<span class="pill bad">거절됨</span>'}
      ${nTag(other)} <span class="small">수출</span> ${bagChips(out)} <span class="small">수입</span> ${bagChips(inn)}</div>`;
  }).join('')}</div>` : '<p class="muted small">아직 끝난 거래가 없어요.</p>';
  return `<div class="sect"><span class="label">우리 창고</span>${stockHtml(r)}</div>
    <div class="sect"><span class="label">들어온 제안 ${incoming.length}건</span><div class="list">${inHtml}</div></div>
    <div class="sect"><span class="label">우리가 보낸 제안</span><div class="list">${outHtml}</div></div>
    <div class="sect"><span class="label">이번 라운드 무역 기록</span>${hist}</div>`;
}
function boardHtml(r){
  const evs = (S.game?.events || []).filter(e => e.r === r && S.game.phase === 'play');
  return `${evs.length ? `<div class="sect"><span class="label">이번 라운드 소식</span>${evs.map(e => { const x = evInfo(e); return `<div class="event"><div><h3>${esc(x.t)}</h3><p>${esc(x.text)}</p></div></div>`; }).join('')}</div>` : ''}
    <div class="sect"><span class="label">이렇게 움직여요</span>
    <ul class="qs"><li>방향키나 W·A·S·D로 걸어요. 태블릿에서는 왼쪽 아래 화살표를 누르거나 가고 싶은 곳을 톡 눌러요.</li>
    <li>건물이나 친구 가까이 가면 아래에 버튼이 생겨요. 버튼을 누르거나 Space를 눌러요.</li></ul></div>
    <div class="sect"><span class="label">게임 규칙</span>
    <ul class="qs">
      <li>라운드가 시작되면 우리 나라는 <b>자원</b>을 받아요. 나라마다 받는 자원이 달라요.</li>
      <li>우리 나라 <b>🏭 공장</b>에 가서 자원으로 물건을 만들면 점수를 얻어요.</li>
      <li>한 라운드에 <b>서로 다른 물건을 ${BONUS_KINDS}가지 이상</b> 만들면 보너스 <b>+${BONUS}점</b>!</li>
      <li>공장에서 <b>건물을 지어 나라를 개발</b>할 수 있어요. 건물은 게임이 끝날 때까지 남아 계속 도움을 줘요.</li>
      <li>다른 나라와 거래하려면 그 나라의 <b>세관</b>까지 걸어가거나, 그 나라 친구 옆에 가서 말을 걸어요. 세관의 <b>전시판</b>에서 그 나라 창고를 볼 수 있어요.</li>
      <li>화면 위 <b>계획서</b> 버튼으로 무역 계획을 세워요. 1라운드에 써 두면 2라운드에 바로 거래하러 갈 수 있어요.</li>
      <li>무역이 금지되면 다리에 빨간 차단기가 내려와요.</li>
      <li>라운드가 끝나면 남은 자원은 사라지고 모두 자기 나라로 돌아가요.</li>
    </ul></div>
    <div class="sect"><span class="label">물건 만드는 법</span>
    <div class="items">${ITEMS.map(it => `<div class="item"><div class="hd"><span class="ic">${it.i}</span><span class="nm">${it.name}</span><span class="pt">${it.pt}점</span></div><div class="cost">${bagChips(it.cost)}</div></div>`).join('')}</div></div>
    <div class="sect"><span class="label">나라 개발 건물</span>
    <div class="items">${BUILDINGS.map(B => `<div class="item"><div class="hd"><span class="ic">${B.i}</span><span class="nm">${B.name}</span><span class="pt">+${BUILD_PT}점</span></div><p class="small">${esc(B.desc)}</p><div class="cost">${bagChips(B.cost)}</div></div>`).join('')}</div></div>
    <div class="sect"><span class="label">나라별 특산 자원</span><div class="cost">${NATIONS.map(n => `<span class="chip">${n.flag} ${n.name} → ${RES[n.spec][1]} ${RES[n.spec][0]}</span>`).join('')}</div></div>`;
}

