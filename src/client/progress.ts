import { api, element, labels } from './api.js';
import { chart } from './chart.js';
import { dailyTrend, smoothLesson, type LessonAnswer, type Day } from './trends.js';
interface Data { summary: { total: number; correct: number; typo: number; wrong: number; practiced: number }; attempts: { verb_id: string; answer: string; expected: string; result: string; answered_at: string; practice_mode: string }[] }
const tier = element<HTMLSelectElement>('tier'), type = element<HTMLSelectElement>('type');
const mode = element<HTMLSelectElement>('mode');
const previous = element<HTMLButtonElement>('previous'), more = element<HTMLButtonElement>('more');
let offset = 0, generation = 0;
let trendGeneration = 0;
const period = element<HTMLInputElement>('period'), method = element<HTMLSelectElement>('method');
async function loadTrends() {
  const version = ++trendGeneration;
  const n = Number(period.value);
  if (!Number.isInteger(n) || n < 1 || n > 100) { element('trend-status').textContent = 'Choose a whole-number period between 1 and 100.'; return; }
  element('trend-status').textContent = 'Loading trends…';
  for (const id of ['lesson-chart', 'days-chart', 'lesson-insight', 'days-insight']) element(id).replaceChildren();
  try {
    const data = await api<{ lesson: LessonAnswer[]; days: Day[]; today: string }>(`/api/trends?${new URLSearchParams({ mode: mode.value, tier: tier.value, type: type.value })}`);
    if (version !== trendGeneration) return;
    const smoothed = smoothLesson(data.lesson, n, method.value === 'ema' ? 'ema' : 'sma');
    const complete = smoothed.filter(point => point.accuracy !== null);
    const lesson = complete.slice(-500).map(point => ({ x: point.number, label: `Answer ${point.number}`, value: point.accuracy,
      detail: `${n} answers in window · ${new Date(point.answered_at).toLocaleString()}` }));
    chart(element('lesson-chart'), lesson, `${method.value === 'ema' ? 'Exponential' : 'Simple'} moving accuracy, period ${n}`);
    const latest = complete.at(-1);
    if (latest) {
      const baseline = complete[0];
      let insight = `${Math.round(latest.accuracy!)}% · ${method.value === 'ema' ? 'EMA' : 'moving average'}, period ${n}.`;
      if (data.lesson.length >= n * 2) {
        const change = Math.round(latest.accuracy! - baseline.accuracy!);
        insight += change > 0 ? ` Up ${change} percentage points from the first full window. Keep going!` : ' Every attempt helps you practice. Keep going.';
      }
      insight += ` Latest answer: ${new Date(latest.answered_at).toLocaleString()}.`;
      if (complete.length > 500) insight += ' Showing the latest 500 points; smoothing uses the whole lesson.';
      element('lesson-insight').textContent = insight;
    } else {
      element('lesson-insight').textContent = `${data.lesson.length}/${n} answers: ${Math.max(0, n - data.lesson.length)} more needed for the first full point.`;
      element('lesson-chart').textContent = 'The graph starts when one full period is available.';
    }
    const dailyWindow = element<HTMLSelectElement>('daily-smoothing').value === '7' ? 7 : 1;
    const days = dailyTrend(data.days, data.today, dailyWindow);
    chart(element('days-chart'), days, dailyWindow === 1 ? 'Daily accuracy by UTC date' : 'Daily trend: answer-weighted accuracy over the trailing 7 UTC days');
    const current = days.at(-1)!;
    const range = dailyWindow === 1 ? 'today (UTC)' : 'over the last 7 days';
    element('days-insight').textContent = current.value === null ? `No answers ${range}. Start a lesson to add a point.` : `${Math.round(current.value)}% ${range}. ${current.detail.split('; ')[1]}.`;
    element('trend-status').textContent = 'Trends updated. All graphs follow the selected practice mode, tier and type.';
  } catch (error) {
    if (version !== trendGeneration) return;
    element('trend-status').textContent = `${error instanceof Error ? error.message : 'Could not load trends.'} Use Refresh progress to retry.`;
  }
}
async function load() {
  const version = ++generation;
  element('status').textContent = 'Loading your progress…'; previous.disabled = more.disabled = true;
  try {
    const data = await api<Data>(`/api/progress?${new URLSearchParams({ mode: mode.value, tier: tier.value, type: type.value, offset: String(offset) })}`);
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
      const modeCell = document.createElement('td'); modeCell.textContent = attempt.practice_mode === 'errors' ? 'Common errors' : 'Normal'; row.append(modeCell);
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
for (const select of [tier, type, mode]) select.addEventListener('change', () => { offset = 0; void load(); void loadTrends(); });
for (const control of [period, method, element('daily-smoothing')]) control.addEventListener('change', () => { void loadTrends(); });
element('refresh').addEventListener('click', () => { void load(); void loadTrends(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) { void load(); void loadTrends(); } });
previous.addEventListener('click', () => { offset = Math.max(0, offset - 50); void load(); });
more.addEventListener('click', () => { offset += 50; void load(); });
void load();
void loadTrends();
