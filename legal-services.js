/* 部门联办入口改为用户确认的小联说法务页面。 */
const ls = {mode: 'home', input: '', messages: []};
const lsQuestions = ['企业商标被他人侵权，应如何维权？', '签订合同后，对方违约怎么办？', '股东未履行出资义务，其他股东如何追责？'];
function lsHome() {
  return `<section class="ls-home" aria-label="小联说法务服务首页">
    <div class="ls-avatar"><img src="assets/law-assistant.png" alt="小联说法务数字人，手持天平"></div>
    <section class="ls-card"><svg class="ls-card-surface" viewBox="0 0 400 290" preserveAspectRatio="none" aria-hidden="true"><path d="M22 1H132C155 1 166 26 200 26S245 1 268 1H378Q399 1 399 22V268Q399 289 378 289H22Q1 289 1 268V22Q1 1 22 1Z"/></svg>
      <h2>小联说法务</h2><div class="ls-tagline">您的专属智慧法律顾问</div>
      <p class="ls-description">我将为您提供专业的法律知识解答、典型案例参考及法律服务指引。</p>
      <div class="ls-routes"><button class="ls-station" data-action="externalStation"><span class="ls-route-icon">${icon('shield')}</span><span class="ls-route-copy"><strong>警企服务站</strong><small>警企联动 · 护企服务</small></span>${icon('chevron')}</button>
      <button class="ls-labor" data-action="comingSoon"><span class="ls-route-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M8 5H6a2 2 0 0 0-2 2v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a2 2 0 0 0-2-2h-2M8 4h8v4H8zM8 14l3 3 5-6"/></svg></span><span class="ls-labor-copy"><strong>用工体检</strong><i aria-hidden="true"></i><small>排查用工风险</small></span>${icon('chevron')}</button></div>
    </section>
    <div class="ls-question-list"><button data-ls="cases"><span>涉民企经典案例</span>${icon('chevron')}</button>${lsQuestions.map((q, i) => `<button data-ls="question" data-question="${i}"><span>${esc(q)}</span>${icon('chevron')}</button>`).join('')}</div>
  </section>`;
}
function lsPage() {
  if (ls.mode === 'home') return lsHome();
  if (ls.mode === 'cases') return `<section class="ls-subpage"><div class="page-intro"><h2>涉民企经典案例</h2><p>小联说法务 · 案例参考</p></div><article class="ls-case-note"><h3>企业经营中的法律问题</h3><p>正式页面沿用现有法务案例库。当前为交互原型，尚未连接真实案例资料。</p></article><button class="ls-return" data-ls="home">返回小联说法务</button></section>`;
  return `<section class="ls-subpage ls-conversation" aria-label="小联说法务对话"><div class="ls-chat-heading"><h2>小联说法务</h2><p>您的专属智慧法律顾问</p></div>${ls.messages.map(m => `<article class="ls-message ls-${m.role}">${m.role === 'assistant' ? '<small>小联 · 演示说明</small>' : ''}<p>${esc(m.text)}</p></article>`).join('')}<button class="ls-return" data-ls="home">返回法务首页</button></section>`;
}
function lsComposer() {
  return `<div class="ls-composer"><form id="lsChatForm"><input id="lsInput" aria-label="输入法律知识问题" placeholder="请在这里输入问题" maxlength="300" autocomplete="off" value="${esc(ls.input)}"><button type="button" class="ls-mic" data-action="voice" aria-label="法律问答语音输入演示">${icon('mic')}</button><button class="ls-send" type="submit" aria-label="发送法律知识问题" ${ls.input.trim() ? '' : 'disabled'}>${icon('send')}</button></form><p>内容由AI生成，仅供参考</p></div>`;
}
const lsPreviousRender = render;
render = function () {
  lsPreviousRender();
  const active = state.page === 'externalServices';
  $('#servicePhone').classList.toggle('ls-mode', active);
  $('#serviceContent').classList.toggle('ls-screen', active);
  if (active) {
    $('#composer').innerHTML = lsComposer();
    $('#serviceTitle').textContent = ls.mode === 'cases' ? '涉民企经典案例' : '小联说法务';
    $('#deviceLabel').textContent = $('#serviceTitle').textContent;
  }
};
function lsRefresh(scroll = 'top') {
  render();
  requestAnimationFrame(() => {$('#serviceContent').scrollTop = scroll === 'bottom' ? $('#serviceContent').scrollHeight : 0;});
}
function lsAsk(question) {
  const q = question.trim();
  if (!q) return;
  ls.messages.push({role: 'user', text: q}, {role: 'assistant', text: '这里是小联说法务的法律知识问答入口。当前原型未接入原有法务知识库，暂不生成个案建议。\n\n您也可以返回法务首页，点击“警企服务站”查看经侦风险防范知识和报案指引。'});
  ls.input = ''; ls.mode = 'chat'; lsRefresh('bottom');
}
document.addEventListener('click', e => {
  const action = e.target.closest('[data-action]');
  if (action?.dataset.action === 'external') ls.mode = 'home';
  if (action && ['openLegal', 'returnLegal'].includes(action.dataset.action)) {
    e.preventDefault(); e.stopImmediatePropagation();
    ls.mode = 'home';
    if (action.dataset.action === 'openLegal') {state.history = []; go('externalServices', {}, false);}
    else go('externalServices');
    return;
  }
  if (state.page === 'externalServices' && action?.dataset.action === 'back' && ls.mode !== 'home') {
    e.preventDefault(); e.stopImmediatePropagation(); ls.mode = 'home'; lsRefresh(); return;
  }
  const button = e.target.closest('[data-ls]');
  if (!button) return;
  e.preventDefault();
  if (button.dataset.ls === 'home') {ls.mode = 'home'; lsRefresh();}
  if (button.dataset.ls === 'cases') {ls.mode = 'cases'; lsRefresh();}
  if (button.dataset.ls === 'question') lsAsk(lsQuestions[Number(button.dataset.question)] || '');
}, true);
document.addEventListener('input', e => {
  if (e.target.id === 'lsInput') {ls.input = e.target.value; $('#lsChatForm [type="submit"]').disabled = !ls.input.trim();}
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'lsChatForm') return;
  e.preventDefault(); lsAsk($('#lsInput').value);
});
document.addEventListener('click', e => {
  if (e.target.closest('[data-action="reset"]')) {ls.mode = 'home'; ls.input = ''; ls.messages = [];}
});
if (location.hash === '#legal-services') go('externalServices', {}, false);
