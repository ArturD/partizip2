import { api, element } from './api.js';
import { multiChart, type Series } from './multi-chart.js';
import { smoothLesson, type LessonAnswer } from './trends.js';
const cases = ['gender','accusative','dative','genitive'];
const names = ['Nominative','Accusative','Dative','Genitive'];
const colors = ['#236db0','#b45309','#15803d','#9333ea'];
const dashes = ['', '9 4', '3 4', '10 3 2 3'];
interface Data { summary: Row[]; days: Day[]; lesson: (LessonAnswer & { question: string })[] }
let cached: Data | undefined;
function renderCharts(data: Data) {
  const period = Number(element<HTMLInputElement>('lesson-period').value);
  if (!Number.isInteger(period) || period < 1 || period > 100) { element('lesson-status').textContent = 'Period must be a whole number from 1 to 100.'; return; }
  const method = element<HTMLSelectElement>('lesson-method').value === 'ema' ? 'ema' : 'sma';
  const series = (i: number, points: Series['points']): Series => ({ name: names[i], color: colors[i], dash: dashes[i], points });
  element('lesson-status').textContent = `${data.lesson.length} answers in the latest lesson. Each line averages its own case answers.`;
  multiChart(element('lesson-chart'), cases.map((question, i) => series(i, smoothLesson(data.lesson.filter(a => a.question === question), period, method).slice(-500).map(a => ({ x: a.number, label: `Answer ${a.number}`, value: a.accuracy, detail: `${a.answered_at}; ${method.toUpperCase()}, period ${period}` })))), 'Latest lesson accuracy by case');
  const today = new Date(); today.setUTCHours(0,0,0,0);
  multiChart(element('daily-chart'), cases.map((question,i) => series(i, Array.from({ length: 90 }, (_, index) => {
    const x = today.getTime() - (89 - index) * 86400000, label = new Date(x).toISOString().slice(0,10);
    const day = data.days.find(d => d.day === label && d.question === question);
    return { x, label, value: day ? day.correct / day.total * 100 : null, detail: day ? `${day.correct}/${day.total} correct` : 'No practice' };
  }))), 'Daily accuracy by case');
}
interface Row { question: string; total: number; correct: number }
interface Day { question: string; day: string; total: number; correct: number }
let generation = 0;
async function load() {
  const request = ++generation;
  element('status').textContent = 'Loading…';
  const params = new URLSearchParams({ tier: element<HTMLSelectElement>('article-tier').value, difficulty: element<HTMLSelectElement>('article-difficulty').value });
  try {
    const data = await api<Data>(`/api/articles/progress?${params}`);
    if (request !== generation) return;
    const summary = element('summary'); summary.replaceChildren();
    let total = 0, correct = 0;
    for (const row of data.summary) {
      total += row.total; correct += row.correct;
      const line = document.createElement('p'); line.textContent = `${row.question}: ${Math.round(row.correct / row.total * 100)}% (${row.correct}/${row.total})`; summary.append(line);
    }
    element('status').textContent = total ? `Overall: ${Math.round(correct / total * 100)}% from ${total} answers.` : 'No article practice yet.';
    cached = data; renderCharts(data);
  } catch (error) { if (request === generation) element('status').textContent = error instanceof Error ? error.message : 'Unable to load progress.'; }
}
for (const id of ['article-tier','article-difficulty']) element(id).addEventListener('change', () => void load());
element('refresh').addEventListener('click', () => void load());
document.addEventListener('visibilitychange', () => { if (!document.hidden) void load(); });
for (const id of ['lesson-period','lesson-method']) element(id).addEventListener('change', () => { if (cached) renderCharts(cached); });
void load();
