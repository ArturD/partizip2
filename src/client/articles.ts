import { api, element } from './api.js';
interface Noun { id: string; noun: string; english: string; tier: string; version: number; sentences: Record<string,string> }
interface Saved { answer: string; expected: string; correct: number; explanation: string }
const steps = ['gender', 'accusative', 'dative', 'genitive'];
const labels = ['Gender · Nominativ', 'Accusative · Akkusativ', 'Dative · Dativ', 'Genitive · Genitiv'];
let nouns: Noun[] = [], deck: Noun[] = [], current: Noun, step = 0, roundId = '', attemptId = '';
let saved: Saved | undefined, pending: string | undefined, busy = false;
const choices = element('choices'), feedback = element('article-feedback'), next = element<HTMLButtonElement>('article-next');
const tier = element<HTMLSelectElement>('article-tier');
function render() {
  saved = undefined; pending = undefined; attemptId = crypto.randomUUID();
  feedback.textContent = ''; next.hidden = true;
  element('article-note').textContent = ''; element('article-note').hidden = true;
  element('article-word').textContent = current.noun;
  element('article-meaning').textContent = current.english;
  element('article-step').textContent = `${step + 1}/4 · ${labels[step]}`;
  element('article-prompt').textContent = step === 0 ? `Choose the nominative article for ${current.noun}.` : current.sentences[steps[step]].replace('_', '___');
  choices.replaceChildren();
  for (const article of step === 0 ? ['der','die','das'] : ['der','die','das','den','dem','des']) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = article;
    button.addEventListener('click', () => void answer(article)); choices.append(button);
  }
  choices.querySelector('button')?.focus();
}
function start() {
  if (!deck.length) {
    deck = nouns.filter(n => !tier.value || n.tier === tier.value);
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  }
  const noun = deck.pop();
  if (!noun) { choices.replaceChildren(); element('article-word').textContent = 'No nouns in this tier yet'; element('article-prompt').textContent = ''; element('article-meaning').textContent = ''; element('article-step').textContent = ''; feedback.textContent = ''; element('article-note').textContent = ''; next.hidden = true; return; }
  current = noun; roundId = crypto.randomUUID(); step = 0; render();
}
function lock(disabled: boolean) { for (const button of Array.from(choices.querySelectorAll('button'))) button.disabled = disabled; }
function complete() {
  lock(true); next.hidden = false; next.textContent = step === 3 ? 'Next noun →' : 'Next case →'; next.focus();
  if (step === 3) tier.disabled = false;
}
async function answer(value: string) {
  if (busy) return;
  if (saved) {
    if (value !== saved.expected) { feedback.textContent = `Try again: select ${saved.expected}. Your original answer was “${saved.answer}”.`; return; }
    feedback.textContent = `Correction complete. You originally chose “${saved.answer}”; correct: ${saved.expected}.`; complete(); return;
  }
  pending ??= value; busy = true; lock(true); tier.disabled = true;
  feedback.textContent = 'Saving…';
  try {
    saved = await api<Saved>('/api/articles/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: attemptId, roundId, nounId: current.id, version: current.version, question: steps[step], answer: pending }) });
    feedback.textContent = `${saved.correct ? 'Correct' : 'Wrong'}. You chose “${saved.answer}”; correct: ${saved.expected}.${saved.correct ? '' : ' Select the correct article to continue.'}`;
    element('article-note').textContent = saved.explanation; element('article-note').hidden = false;
    if (saved.correct) complete(); else { lock(false); choices.querySelector('button')?.focus(); }
  } catch (error) {
    feedback.textContent = `${error instanceof Error ? error.message : 'Connection failed'}. Select any article to retry saving your original answer.`; lock(false);
  } finally { busy = false; }
}
next.addEventListener('click', () => { if (step === 3) start(); else { step++; render(); } });
tier.addEventListener('change', () => { deck = []; start(); });
api<Noun[]>('/api/articles/nouns').then(data => { nouns = data; start(); }).catch(() => { feedback.textContent = 'Unable to load nouns. Reload to try again.'; });
