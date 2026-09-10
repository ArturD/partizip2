import { api, element, labels } from './api.js';
interface Verb { id: string; infinitive: string; english: string; tier: string; type: string; subtype: string; separable: boolean }
const answer = element<HTMLInputElement>('answer'), check = element<HTMLButtonElement>('check'), next = element<HTMLButtonElement>('next');
const tier = element<HTMLSelectElement>('tier'), type = element<HTMLSelectElement>('type'), feedback = element('feedback');
let verbs: Verb[] = [], deck: Verb[] = [], current: Verb | undefined, attemptId = '', pendingAnswer: string | undefined;
function draw() {
  if (!deck.length) {
    deck = verbs.filter(v => (!tier.value || v.tier === tier.value) && (!type.value || v.type === type.value));
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    if (deck.length > 1 && deck[deck.length - 1]?.id === current?.id) [deck[0], deck[deck.length - 1]] = [deck[deck.length - 1], deck[0]];
  }
  current = deck.pop(); attemptId = crypto.randomUUID(); pendingAnswer = undefined;
  answer.value = ''; answer.disabled = !current; answer.readOnly = false; check.disabled = !current; check.hidden = false; next.hidden = true; feedback.textContent = ''; feedback.className = '';
  element('word').textContent = current?.infinitive || 'No verbs yet';
  element('meaning').textContent = current?.english || 'Choose another tier or type to keep practicing.';
  element('tag').textContent = current ? `${current.tier} · ${current.subtype}${current.separable ? ' · separable' : ''}` : 'Empty practice set';
  element('counter').textContent = current ? `${deck.length + 1} left in this round` : '0 words';
  if (current) answer.focus();
}
for (const select of [tier, type]) select.addEventListener('change', () => { deck = []; draw(); });
next.addEventListener('click', draw);
element<HTMLFormElement>('answer-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!current || check.disabled) return;
  if (!answer.value.trim()) { answer.setCustomValidity('Enter the Partizip II form.'); answer.reportValidity(); return; }
  pendingAnswer ??= answer.value;
  check.disabled = true; answer.readOnly = true; tier.disabled = type.disabled = true;
  feedback.className = ''; feedback.textContent = 'Saving your answer…';
  try {
    const saved = await api<{ result: string; expected: string }>('/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: attemptId, verbId: current.id, answer: pendingAnswer }) });
    feedback.className = saved.result; feedback.textContent = `${labels[saved.result]}. ${current.infinitive} → ${saved.expected}`;
    check.hidden = true; next.hidden = false; next.focus();
  } catch (error) {
    feedback.className = 'error'; feedback.textContent = `${error instanceof Error ? error.message : 'Connection failed.'} Retry to save this same answer.`;
    check.disabled = false; check.textContent = 'Retry saving';
  } finally { tier.disabled = type.disabled = false; }
});
answer.addEventListener('input', () => answer.setCustomValidity(''));
next.addEventListener('click', () => { check.textContent = 'Check answer ↵'; });
api<Verb[]>('/api/verbs').then(data => { verbs = data; draw(); }).catch(() => { element('word').textContent = 'Unable to load'; element('meaning').textContent = 'Please reload the page to try again.'; });
