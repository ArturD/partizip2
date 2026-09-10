import { api, element, labels } from './api.js';
interface Data { summary: { total: number; correct: number; typo: number; wrong: number; practiced: number }; attempts: { verb_id: string; answer: string; expected: string; result: string; answered_at: string }[] }
const tier = element<HTMLSelectElement>('tier'), type = element<HTMLSelectElement>('type');
const previous = element<HTMLButtonElement>('previous'), more = element<HTMLButtonElement>('more');
let offset = 0, generation = 0;
async function load() {
  const version = ++generation;
  element('status').textContent = 'Loading your progress…'; previous.disabled = more.disabled = true;
  try {
    const data = await api<Data>(`/api/progress?${new URLSearchParams({ tier: tier.value, type: type.value, offset: String(offset) })}`);
    if (version !== generation) return;
    const s = data.summary;
    element('summary').replaceChildren();
    for (const [value, label] of [[s.total, 'Answers saved'], [s.total ? `${Math.round(s.correct / s.total * 100)}%` : '—', 'Exact accuracy'], [s.typo, 'Single-letter typos'], [s.wrong, 'Wrong answers']]) {
      const box = document.createElement('div'); box.className = 'stat';
      const strong = document.createElement('strong'), span = document.createElement('span'); strong.textContent = String(value); span.textContent = String(label); box.append(strong, span); element('summary').append(box);
    }
    element('history').replaceChildren();
    for (const attempt of data.attempts) {
      const row = document.createElement('tr');
      for (const value of [attempt.verb_id, attempt.answer, attempt.expected]) { const cell = document.createElement('td'); cell.lang = 'de'; cell.textContent = value; row.append(cell); }
      const result = document.createElement('td'), badge = document.createElement('span'); badge.className = `result ${attempt.result}`; badge.textContent = labels[attempt.result]; result.append(badge); row.append(result);
      const date = document.createElement('td'), time = document.createElement('time'); time.dateTime = attempt.answered_at; time.title = attempt.answered_at;
      time.textContent = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 }).format(new Date(attempt.answered_at)); date.append(time); row.append(date); element('history').append(row);
    }
    element('status').textContent = s.total ? `${s.practiced} different verbs practiced in this selection.` : 'No answers in this selection yet. Start practicing or choose another filter.';
    element('page').textContent = s.total ? `${offset + 1}–${Math.min(offset + 50, s.total)} of ${s.total}` : '0 answers';
    previous.disabled = offset === 0; more.disabled = offset + 50 >= s.total;
  } catch (error) {
    if (version !== generation) return;
    element('summary').replaceChildren(); element('history').replaceChildren(); element('page').textContent = '';
    element('status').textContent = `${error instanceof Error ? error.message : 'Could not load progress.'} Reload or change a filter to retry.`;
  }
}
for (const select of [tier, type]) select.addEventListener('change', () => { offset = 0; void load(); });
previous.addEventListener('click', () => { offset = Math.max(0, offset - 50); void load(); });
more.addEventListener('click', () => { offset += 50; void load(); });
void load();
