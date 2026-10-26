/* 报案指引：在同一页内记录基本信息、逐项问答与准备指引。仅保存在页面内存。 */
const rf = {
  crime: 0, stage: 'date', dateDone: false, amountDone: false,
  dateReply: '', amountReply: '', variantDone: false, questionId: null,
  pending: [], skipped: {}, editing: null, input: '', help: [],
  sheet: false, sheetCrime: 0, query: ''
};
const rfResultTemplate = reportResult;
const rfEscape = value => esc(String(value ?? ''));
const rfIsPage = () => ['reportSelect', 'reportInfo'].includes(state.page);
function rfReset() {
  crimeSelection = 0;
  Object.assign(rf, {crime: 0, stage: 'date', dateDone: false, amountDone: false,
    dateReply: '', amountReply: '', variantDone: false, questionId: null,
    pending: [], skipped: {}, editing: null, input: '', help: [],
    sheet: false, sheetCrime: 0, query: ''});
  intake = {dataset: null, answers: {}, index: 0, date: '', amount: '', started: false};
}
function rfButton(action, text, primary = false, attrs = '') {
  return `<button type="button" class="rf-button ${primary ? 'rf-primary' : ''}" data-rf="${action}" ${attrs}>${text}</button>`;
}
function rfAssistant(content, extra = '') {
  return `<article class="rf-message rf-assistant ${extra}">${content}</article>`;
}
function rfUser(text, edit = '') {
  return `<div class="rf-user-row"><div class="rf-message rf-user">${rfEscape(text)}</div>${edit}</div>`;
}
function rfHelp(anchor) {
  return rf.help.filter(t => t.anchor === anchor).map(t => rfUser(t.q) + rfAssistant('<p>' + rfEscape(t.a) + '</p>')).join('');
}
function rfEdit(action, attrs = '') {
  return `<button type="button" class="rf-edit" data-rf="${action}" ${attrs}>修改</button>`;
}
reportSelect = function () {
  return `<section class="rf-landing" aria-label="报案指引入口">
    <header class="rf-hero"><div class="rf-hero-columns" aria-hidden="true"></div><div class="rf-hero-scale" aria-hidden="true">${icon('scale')}</div><span>线下报案准备</span><h2>报案指引</h2><p>选择希望了解的罪名，逐步梳理信息与材料。</p></header>
    <div class="rf-landing-body"><div class="rf-notice"><b aria-hidden="true">i</b><p>本功能辅助准备线下咨询材料，不是在线报案。选择罪名不代表事实已构成该罪名。答复仅在当前页面内存中处理，刷新后清空。</p></div>
    ${intake.started ? `<button class="rf-resume" data-rf="resume">继续本次填写 <span>→</span></button>` : ''}
    <section class="rf-crime-picker"><h3>选择罪名</h3><button class="rf-crime-toggle" data-rf="open-sheet" aria-haspopup="dialog"><span>${crimeSelection ? rfEscape(crimeNames[crimeSelection - 1]) : '请选择罪名'}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7"/></svg></button>${rfButton('start', '开始梳理', true, crimeSelection ? '' : 'disabled')}</section>
    <button class="rf-audit" data-action="audit"><span></span>资料核对与待确认事项<span></span></button>${rf.help.length ? '<div class="rf-landing-help">' + rfHelp('landing') + '</div>' : ''}</div>
  </section>`;
};
function rfBasicCard(kind, active = false) {
  const date = kind === 'date';
  const prompt = date ? '相关事件发生在什么时候？' : `${rf.dateReply.includes('跳过') ? '好的，可以稍后补充。' : ''}涉及金额大约是多少？`;
  const label = date ? '相关事件日期（选填）' : '涉及金额（元，选填）';
  const field = active
    ? `<input id="${date ? 'rfDate' : 'rfAmount'}" aria-label="${label}" type="${date ? 'date' : 'number'}" ${date ? '' : 'min="0" step="0.01" inputmode="decimal"'} placeholder="${date ? '请选择日期' : '请输入金额'}" value="${rfEscape(date ? intake.date : intake.amount)}">`
    : `<div class="rf-field-readonly">${rfEscape((date ? intake.date : intake.amount) || (date ? '暂未填写日期' : '暂未填写金额'))}${!date && intake.amount ? ' 元' : ''}</div>`;
  const actions = active ? (date
    ? `<div class="rf-actions">${rfButton('date-skip', '暂不清楚，先跳过')}${rfButton('date-save', '确认日期', true, intake.date ? '' : 'hidden')}${rf.editing ? rfButton('cancel-edit', '取消修改') : ''}</div>`
    : `<div class="rf-actions rf-amount-actions">${rfButton('amount-unknown', '暂不清楚')}${rfButton('amount-skip', '跳过此项')}${rfButton('amount-save', rf.editing ? '保存金额' : '开始逐项填写', true)}</div>${rf.editing ? rfButton('cancel-edit', '取消修改') : ''}`) : '';
  return rfAssistant(`<p>${prompt}</p><div class="rf-field-card"><label for="${active ? (date ? 'rfDate' : 'rfAmount') : ''}">${label}</label>${field}${date ? actions : '<small>仅作为自述记录，后续仍需选择金额区间。</small>'}</div>${date ? '' : actions}`, active ? 'rf-current' : '');
}
function rfQuestionCard(q, active) {
  if (!active) return rfAssistant(`<p>${rfEscape(q.text)}</p>`);
  const list = activeQuestions(intakeSet(), intake.answers);
  const index = list.findIndex(item => item.id === q.id);
  return rfAssistant(`<div class="rf-question-meta"><span>第 ${index + 1} 项 · 当前路径 ${list.length} 项</span><span>${q.multi ? '可多选' : '单选'}</span></div><p>${rfEscape(q.text)}</p><div class="rf-options">${q.options.map(o => `<label class="${rf.pending.includes(o.key) ? 'selected' : ''}"><input type="${q.multi ? 'checkbox' : 'radio'}" name="rfOption" value="${rfEscape(o.key)}" ${rf.pending.includes(o.key) ? 'checked' : ''}><span>${rfEscape(o.label)}</span></label>`).join('')}</div><div class="rf-actions rf-question-actions">${rfButton('question-unknown', '暂不清楚')}${rfButton('question-skip', '跳过此项')}${rfButton('question-next', '确认，继续', true)}</div>${rf.editing ? rfButton('cancel-edit', '取消修改') : ''}`, 'rf-current');
}
function rfReview() {
  const list = activeQuestions(intakeSet(), intake.answers);
  return rfAssistant(`<h3>请核对本次填写内容</h3><p class="rf-muted">确认后，可生成线下咨询用的报案准备指引。</p><div class="rf-review-row"><span>相关事件日期</span><strong>${rfEscape(intake.date || '暂未填写')}</strong>${rfEdit('edit-date')}</div><div class="rf-review-row"><span>涉及金额</span><strong>${intake.amount ? rfEscape(intake.amount) + ' 元' : '暂未填写'}</strong>${rfEdit('edit-amount')}</div><details class="rf-answer-list"><summary>查看完整问答记录（${list.length}项）</summary>${list.map(q => `<div><p>${rfEscape(q.text)}</p><small>${rfEscape(rf.skipped[q.id] ? '已跳过，待线下补充' : answerText(q))}</small>${rfEdit('edit-question', `data-id="${rfEscape(q.id)}"`)}</div>`).join('')}</details>${rfButton('generate', '生成报案准备指引', true)}`, 'rf-current rf-review');
}
reportInfo = function () {
  let transcript = `<section class="rf-conversation" aria-label="报案指引连续对话"><header class="rf-selected"><div><span>已选罪名</span><strong>${rfEscape(crimeNames[rf.crime - 1] || '')}</strong>${rf.variantDone ? `<small>${rfEscape(intakeSet().name.replace('合同诈骗罪', '').replace(/[()]/g, ''))}</small>` : ''}</div><button data-rf="open-sheet">重新选择</button></header>`;
  transcript += rfAssistant(`<p>已选择${rfEscape(crimeNames[rf.crime - 1])}。接下来先记录基本信息，以下内容均可跳过。</p>`);
  transcript += rfBasicCard('date', rf.stage === 'date') + rfHelp('date');
  if (rf.dateDone && rf.stage !== 'date') {
    transcript += rfUser(rf.dateReply, rfEdit('edit-date')) + rfBasicCard('amount', rf.stage === 'amount') + rfHelp('amount');
    if (rf.amountDone && rf.stage !== 'amount') {
      transcript += rfUser(rf.amountReply, rfEdit('edit-amount'));
      if (rf.stage === 'variant') {
        transcript += rfAssistant(`<p>为了匹配原有问卷，请选择希望梳理的合同类型。</p><div class="rf-variants">${intakeData.filter(d => d.crime === 1).map(d => rfButton('variant', rfEscape(d.name.replace('合同诈骗罪', '').replace(/[()]/g, '')), false, `data-id="${d.id}"`)).join('')}</div>`, 'rf-current') + rfHelp('variant');
      } else if (rf.variantDone || rf.crime !== 1) {
        if (rf.crime === 1) transcript += rfHelp('variant') + rfUser(intakeSet().name.replace('合同诈骗罪', '').replace(/[()]/g, ''));
        const list = activeQuestions(intakeSet(), intake.answers);
        const currentIndex = list.findIndex(q => q.id === rf.questionId);
        for (const [index, q] of list.entries()) {
          if (rf.stage === 'questions' && index === currentIndex) {transcript += rfQuestionCard(q, true) + rfHelp('q:' + q.id); break;}
          if (intake.answers[q.id]?.length) transcript += rfQuestionCard(q, false) + rfHelp('q:' + q.id) + rfUser(rf.skipped[q.id] ? '跳过此项，稍后补充' : answerText(q), rfEdit('edit-question', `data-id="${rfEscape(q.id)}"`));
        }
        if (rf.stage === 'review') transcript += rfReview() + rfHelp('review');
        if (rf.stage === 'result') transcript += `<div class="rf-current rf-result">${rfResultTemplate().replace('data-action="reviewAgain"', 'data-rf="review"').replace('data-action="restartIntake"', 'data-rf="open-sheet"')}</div>` + rfHelp('result');
      }
    }
  }
  if (['date', 'amount'].includes(rf.stage)) transcript += rfAssistant('<p>无需填写姓名、身份证号、银行卡号或上传证据。原始材料请自行保管，在线下咨询时提供。</p>', 'rf-privacy');
  return transcript + '</section>';
};
function rfComposer() {
  return `<div class="rf-composer"><form id="rfChatForm"><input id="rfChatInput" aria-label="向小联询问报案指引" placeholder="有问题，随时问小联" maxlength="300" autocomplete="off" value="${rfEscape(rf.input)}"><button class="rf-mic" type="button" data-rf="voice" aria-label="语音输入演示">${icon('mic')}</button><button class="rf-send" type="submit" aria-label="发送报案指引问题">${icon('send')}</button></form></div>`;
}
function rfSheetList() {
  const rows = crimeNames.map((name, index) => ({name, value: index + 1})).filter(r => r.name.includes(rf.query.trim()));
  return `<p class="rf-list-count">${rf.query.trim() ? '找到' : '共'}${rows.length}项 · 请选择一项</p><div class="rf-crime-list" role="radiogroup" aria-label="罪名列表">${rows.map(r => `<label class="${rf.sheetCrime === r.value ? 'selected' : ''}"><input type="radio" name="rfCrime" value="${r.value}" ${rf.sheetCrime === r.value ? 'checked' : ''}><span>${rfEscape(r.name)}</span></label>`).join('') || '<div class="rf-no-results">未找到相关罪名，请换个关键词。</div>'}</div>`;
}
function rfMountSheet() {
  $('#rfSheetOverlay')?.remove();
  if (!rf.sheet || !rfIsPage()) return;
  const overlay = document.createElement('div');
  overlay.id = 'rfSheetOverlay'; overlay.className = 'rf-sheet-overlay';
  overlay.innerHTML = `<button class="rf-sheet-backdrop" data-rf="close-sheet" aria-label="关闭罪名选择"></button><section class="rf-sheet" role="dialog" aria-modal="true" aria-labelledby="rfSheetTitle"><span class="rf-sheet-grip" aria-hidden="true"></span><header><button data-rf="close-sheet">取消</button><h2 id="rfSheetTitle">选择罪名</h2><span></span></header><label class="rf-search">${icon('search')}<input id="rfCrimeSearch" placeholder="搜索罪名" aria-label="搜索罪名" value="${rfEscape(rf.query)}" autocomplete="off"></label><div id="rfSheetResults">${rfSheetList()}</div>${rfButton('confirm-crime', '确认', true, rf.sheetCrime ? '' : 'disabled')}${state.page === 'reportInfo' ? '<p class="rf-sheet-hint">选择其他罪名，将开始新的梳理。</p>' : ''}</section>`;
  $('#servicePhone').append(overlay);
}
const rfPreviousRender = render;
render = function () {
  rfPreviousRender();
  const active = rfIsPage();
  $('#servicePhone').classList.toggle('rf-mode', active);
  $('#serviceContent').classList.toggle('rf-screen', active);
  if (active) {
    $('#serviceTitle').textContent = state.page === 'reportSelect' ? '报案指引' : rf.stage === 'result' ? '准备指引' : '基本指引';
    $('#deviceLabel').textContent = $('#serviceTitle').textContent;
    $('#composer').innerHTML = rfComposer();
  }
  rfMountSheet();
};
function rfRefresh(where = 'current') {
  const top = $('#serviceContent').scrollTop;
  render();
  requestAnimationFrame(() => {
    if (where === 'keep') $('#serviceContent').scrollTop = top;
    else if (where === 'bottom') $('#serviceContent').scrollTop = $('#serviceContent').scrollHeight;
    else if (where === 'top') $('#serviceContent').scrollTop = 0;
    else {
      const content = $('#serviceContent'), current = content.querySelector('.rf-current');
      if (current) content.scrollTop = current.offsetTop - content.querySelector('.rf-conversation').offsetTop - 95;
    }
  });
}
function rfStart(crime) {
  rfReset(); rf.crime = crime; crimeSelection = crime;
  intake.dataset = intakeData.find(d => d.crime === crime).id; intake.started = true;
  go('reportInfo', {}, false);
}
function rfReturnOrAdvance(next) {
  if (rf.editing) {rf.stage = rf.editing.stage; rf.editing = null;}
  else rf.stage = next;
  rfRefresh();
}
function rfFinishDate(skip = false) {
  const input = $('#rfDate');
  if (!skip && !input?.value) {toast('请选择日期，也可以先跳过'); return;}
  if (!skip && !input.checkValidity()) {input.reportValidity(); return;}
  intake.date = skip ? '' : input.value;
  rf.dateReply = skip ? '暂不清楚，先跳过' : intake.date;
  rf.dateDone = true; rfReturnOrAdvance('amount');
}
function rfFinishAmount(mode = 'save') {
  const input = $('#rfAmount');
  if (mode === 'save' && !input.checkValidity()) {input.reportValidity(); return;}
  intake.amount = mode === 'save' ? input.value : '';
  rf.amountReply = intake.amount ? `涉及金额约 ${Number(intake.amount).toLocaleString('zh-CN', {maximumFractionDigits: 2})} 元` : mode === 'unknown' ? '暂不清楚涉及金额' : '跳过金额，开始逐项填写';
  rf.amountDone = true;
  if (rf.editing) {rfReturnOrAdvance('questions'); return;}
  if (rf.crime === 1 && !rf.variantDone) {rf.stage = 'variant'; rfRefresh();}
  else rfNextQuestion();
}
function rfNextQuestion() {
  const next = activeQuestions(intakeSet(), intake.answers).find(q => !intake.answers[q.id]?.length);
  rf.stage = next ? 'questions' : 'review'; rf.questionId = next?.id || null; rf.pending = [];
  rfRefresh();
}
function rfCommitQuestion(keys, skip = false) {
  const d = intakeSet(), q = d.questions.find(item => item.id === rf.questionId);
  if (!q || !keys.length) {toast('请选择一项，或选择暂不清楚、跳过此项'); return;}
  const changed = JSON.stringify(intake.answers[q.id] || []) !== JSON.stringify(keys);
  if (changed) {
    const laterQuestions = d.questions.slice(d.questions.indexOf(q) + 1);
    for (const later of laterQuestions) {delete intake.answers[later.id]; delete rf.skipped[later.id];}
    const laterAnchors = new Set(laterQuestions.map(item => 'q:' + item.id));
    rf.help = rf.help.filter(turn => !laterAnchors.has(turn.anchor));
  }
  intake.answers[q.id] = [...keys]; rf.skipped[q.id] = skip;
  rf.editing = null; rfNextQuestion();
}
function rfBeginEdit(kind, id) {
  rf.editing = {stage: rf.stage, date: intake.date, amount: intake.amount, questionId: rf.questionId, pending: [...rf.pending]};
  if (kind === 'question') {rf.questionId = id; rf.pending = [...(intake.answers[id] || [])]; rf.stage = 'questions';}
  else rf.stage = kind;
  rfRefresh();
}
document.addEventListener('click', e => {
  if (rfIsPage() && e.target.closest('[data-action="back"]') && state.page === 'reportInfo') {
    e.preventDefault(); e.stopImmediatePropagation(); rf.sheet = false; go('reportSelect', {}, false); return;
  }
  const b = e.target.closest('[data-rf]');
  if (!b || b.disabled) return;
  e.preventDefault(); e.stopImmediatePropagation();
  switch (b.dataset.rf) {
    case 'open-sheet': rf.sheet = true; rf.sheetCrime = crimeSelection; rf.query = ''; rfMountSheet(); requestAnimationFrame(() => $('#rfCrimeSearch')?.focus()); break;
    case 'close-sheet': rf.sheet = false; rfMountSheet(); $('#serviceContent [data-rf="open-sheet"]')?.focus(); break;
    case 'confirm-crime': {
      if (!rf.sheetCrime) return;
      const selected = rf.sheetCrime; rf.sheet = false; crimeSelection = selected;
      if (state.page === 'reportInfo' && selected !== rf.crime) rfStart(selected); else rfRefresh('keep');
      break;
    }
    case 'start': if (crimeSelection) rfStart(crimeSelection); break;
    case 'resume': if (intake.started) {crimeSelection = rf.crime; go('reportInfo', {}, false); rfRefresh();} break;
    case 'date-save': rfFinishDate(); break;
    case 'date-skip': rfFinishDate(true); break;
    case 'amount-save': rfFinishAmount(); break;
    case 'amount-unknown': rfFinishAmount('unknown'); break;
    case 'amount-skip': rfFinishAmount('skip'); break;
    case 'variant': intake.dataset = b.dataset.id; rf.variantDone = true; rfNextQuestion(); break;
    case 'question-next': rfCommitQuestion(rf.pending); break;
    case 'question-unknown': rfCommitQuestion(['U']); break;
    case 'question-skip': rfCommitQuestion(['U'], true); break;
    case 'edit-date': rfBeginEdit('date'); break;
    case 'edit-amount': rfBeginEdit('amount'); break;
    case 'edit-question': rfBeginEdit('question', b.dataset.id); break;
    case 'cancel-edit': if (rf.editing) {intake.date = rf.editing.date; intake.amount = rf.editing.amount; rf.stage = rf.editing.stage; rf.questionId = rf.editing.questionId; rf.pending = rf.editing.pending; rf.editing = null; rfRefresh();} break;
    case 'review': rf.stage = 'review'; rfRefresh(); break;
    case 'generate': if (activeQuestions(intakeSet(), intake.answers).some(q => !intake.answers[q.id]?.length)) {toast('请先完成当前问题，也可选择跳过'); return;} rf.stage = 'result'; rfRefresh(); break;
    case 'voice': toast('语音输入为界面演示，请使用文字输入'); break;
  }
}, true);
document.addEventListener('input', e => {
  if (e.target.id === 'rfChatInput') rf.input = e.target.value;
  if (e.target.id === 'rfDate') {intake.date = e.target.value; const save = $('[data-rf="date-save"]'); if (save) save.hidden = !intake.date;}
  if (e.target.id === 'rfAmount') intake.amount = e.target.value;
  if (e.target.id === 'rfCrimeSearch') {rf.query = e.target.value; $('#rfSheetResults').innerHTML = rfSheetList();}
});
document.addEventListener('change', e => {
  if (e.target.name === 'rfCrime') {
    rf.sheetCrime = Number(e.target.value);
    $('#rfSheetResults').querySelectorAll('label').forEach(el => el.classList.toggle('selected', el.querySelector('input').checked));
    $('[data-rf="confirm-crime"]').disabled = false;
  }
  if (e.target.name === 'rfOption') {
    const q = intakeSet().questions.find(item => item.id === rf.questionId), key = e.target.value;
    const exclusive = k => /无证据|均不|无上述|无任何|未做出任何|上述情形均/.test(q.options.find(o => o.key === k)?.label || '');
    rf.pending = q.multi ? (e.target.checked ? [...rf.pending.filter(k => k !== key), key] : rf.pending.filter(k => k !== key)) : [key];
    if (e.target.checked) rf.pending = exclusive(key) ? [key] : rf.pending.filter(k => !exclusive(k));
    document.querySelectorAll('input[name="rfOption"]').forEach(input => {input.checked = rf.pending.includes(input.value); input.closest('label').classList.toggle('selected', input.checked);});
  }
});
document.addEventListener('keydown', e => {
  if (!rf.sheet) return;
  if (e.key === 'Escape') {e.preventDefault(); rf.sheet = false; rfMountSheet(); $('#serviceContent [data-rf="open-sheet"]')?.focus();}
  if (e.key === 'Tab') {
    const elements = [...document.querySelectorAll('.rf-sheet button:not(:disabled),.rf-sheet input')], first = elements[0], last = elements[elements.length - 1];
    if (e.shiftKey && document.activeElement === first) {e.preventDefault(); last.focus();}
    else if (!e.shiftKey && document.activeElement === last) {e.preventDefault(); first.focus();}
  }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'rfChatForm') return;
  e.preventDefault();
  const q = $('#rfChatInput').value.trim(); if (!q) return;
  let answer;
  if (/上传|身份证|银行卡|姓名|隐私|保存|刷新/.test(q)) answer = '这里不接收证据上传，也无需填写姓名、身份证号或银行卡号。填写内容仅保留在当前页面内存中，刷新后会清空。原始材料请自行保管，在线下咨询时提供。';
  else if (/选错|修改|重新选|返回|继续/.test(q)) answer = '您可以点击已填写内容旁的“修改”调整答案，或在顶部重新选择罪名。返回报案指引入口后，点击“继续本次填写”可回到当前进度。修改问卷答案后，后续问题会按新的选择调整。';
  else if (/日期|时间|金额|不清楚|不知道|跳过/.test(q)) answer = '日期和金额均为选填，可以先跳过。逐项问答也提供“暂不清楚”和“跳过此项”；稍后可修改，或在线下咨询时补充说明。';
  else if (/联系|地址|电话|哪里|线下/.test(q)) answer = GUIDE;
  else if (/罪名|认定|构成|立案|能报|受理/.test(q)) answer = '选择罪名仅用于匹配希望了解的问卷，不代表案件性质认定。您可以按当前卡片继续梳理，具体事项请通过正式线下渠道咨询。';
  else answer = state.page === 'reportSelect' ? '请先在“选择罪名”中选择希望了解的项目，再点击“开始梳理”。如果本页已有填写进度，也可以点击“继续本次填写”。' : '请通过当前问题卡片选择或填写，确认后会在同一页继续下一个问题。您也可以询问如何跳过、修改、保存记录或准备线下咨询。';
  rf.help.push({q, a: answer, anchor: state.page === 'reportSelect' ? 'landing' : rf.stage === 'questions' ? 'q:' + rf.questionId : rf.stage}); rf.input = ''; rfRefresh('bottom');
});
document.addEventListener('click', e => {if (e.target.closest('[data-action="reset"]')) rfReset();});
// Keep existing deep links; add a report-guide link without changing the enterprise homepage.
if (location.hash === '#report-guide') go('reportSelect', {}, false);
