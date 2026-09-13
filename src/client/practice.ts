import { api, element, labels } from './api.js';
import { answersMatch } from './answers.js';
interface Verb { id: string; infinitive: string; english: string; tier: string; type: string; subtype: string; separable: boolean; participle?: string }
const answer = element<HTMLInputElement>('answer'), check = element<HTMLButtonElement>('check'), next = element<HTMLButtonElement>('next');
const tier = element<HTMLSelectElement>('tier'), type = element<HTMLSelectElement>('type'), feedback = element('feedback');
const mode = document.body.dataset.mode === 'errors' ? 'errors' : 'standard';
let verbs: Verb[] = [], deck: Verb[] = [], current: Verb | undefined, attemptId = '', pendingAnswer: string | undefined;
let correction: string | undefined;
function updateModelAnswer() {
  if (mode !== 'errors') return;
  const hide = element<HTMLInputElement>('hide-answer');
  element('model-answer').textContent = current?.participle ?? '';
  element('model-answer-panel').hidden = hide.checked || !current?.participle;
  hide.disabled = !current;
}
if (mode === 'errors') element('hide-answer').addEventListener('change', updateModelAnswer);
function draw() {
  if (correction !== undefined) return;
  if (!deck.length) {
    deck = verbs.filter(v => (!tier.value || v.tier === tier.value) && (!type.value || v.type === type.value));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    if (deck.length > 1 && deck[deck.length - 1]?.id === current?.id) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
  }
  current = deck.pop(); attemptId = crypto.randomUUID(); pendingAnswer = undefined;
  answer.value = ''; answer.disabled = !current; answer.readOnly = false; check.disabled = !current; check.hidden = false; next.hidden = true; feedback.textContent = ''; feedback.className = '';
  answer.setCustomValidity(''); check.textContent = 'Check answer ↵';
  element('explanation').textContent = ''; element('explanation-panel').hidden = true;
  element('word').textContent = current?.infinitive || 'No verbs yet';
  element('meaning').textContent = current?.english || (mode === 'errors' ? 'No common errors in this selection. Try another filter or do some normal practice first.' : 'Choose another tier or type to keep practicing.');
  element('tag').textContent = current ? `${current.type === 'regular' ? 'Regular' : 'Irregular'} (${current.subtype}) · ${current.tier}${current.separable ? ' · separable' : ''}` : 'Empty practice set';
  element('counter').textContent = current ? `${deck.length + 1} left in this round` : '0 words';
  updateModelAnswer();
  if (current) answer.focus();
}
for (const select of [tier, type]) select.addEventListener('change', () => { if (correction !== undefined) return; deck = []; draw(); });
next.addEventListener('click', draw);
element<HTMLFormElement>('answer-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!current || check.disabled) return;
  if (!answer.value.trim()) { answer.setCustomValidity('Enter the Partizip II form.'); answer.reportValidity(); return; }
  if (correction !== undefined) {
    if (!answersMatch(answer.value, correction)) {
      feedback.textContent = `Try again: type ${correction} to continue.`;
      answer.focus(); answer.select();
      return;
    }
    feedback.className = 'correct'; feedback.textContent = `Correction complete: ${correction}. Your original result stays in your history.`;
    correction = undefined; answer.readOnly = true; check.disabled = true; check.hidden = true;
    tier.disabled = type.disabled = false; next.hidden = false; next.focus();
    return;
  }
  pendingAnswer ??= answer.value;
  check.disabled = true; answer.readOnly = true; tier.disabled = type.disabled = true;
  feedback.className = ''; feedback.textContent = 'Saving your answer…';
  try {
    const saved = await api<{ result: string; expected: string; explanation?: string }>('/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: attemptId, verbId: current.id, answer: pendingAnswer, mode }) });
    feedback.className = saved.result; feedback.textContent = `${labels[saved.result]}. ${current.infinitive} → ${saved.expected}`;
    element('explanation').textContent = saved.explanation ?? '';
    element('explanation-panel').hidden = !saved.explanation;
    if (saved.result !== 'correct') {
      correction = saved.expected;
      feedback.textContent += '. Type the correct form below to continue.';
      answer.value = ''; answer.readOnly = false; check.disabled = false;
      check.textContent = 'Check correction ↵'; answer.focus();
    } else {
      check.hidden = true; next.hidden = false; next.focus();
    }
  } catch (error) {
    feedback.className = 'error'; feedback.textContent = `${error instanceof Error ? error.message : 'Connection failed.'} Retry to save this same answer.`;
    check.disabled = false; check.textContent = 'Retry saving';
  } finally { tier.disabled = type.disabled = correction !== undefined; }
});
answer.addEventListener('input', () => answer.setCustomValidity(''));
api<Verb[]>(mode === 'errors' ? '/api/common-errors' : '/api/verbs').then(data => { verbs = data; draw(); }).catch(() => { element('word').textContent = 'Unable to load'; element('meaning').textContent = 'Please reload the page to try again.'; });
