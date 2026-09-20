import { api, element } from './api.js';
import { chart } from './chart.js';
interface Row { question: string; total: number; correct: number }
interface Day { day: string; total: number; correct: number }
let generation = 0;
async function load() {
  const request = ++generation;
  element('status').textContent = 'Loading…';
  const params = new URLSearchParams({ tier: element<HTMLSelectElement>('article-tier').value, question: element<HTMLSelectElement>('article-question').value });
  try {
    const data = await api<{ summary: Row[]; days: Day[] }>(`/api/articles/progress?${params}`);
    if (request !== generation) return;
    const summary = element('summary'); summary.replaceChildren();
    let total = 0, correct = 0;
    for (const row of data.summary) {
      total += row.total; correct += row.correct;
      const line = document.createElement('p'); line.textContent = `${row.question}: ${Math.round(row.correct / row.total * 100)}% (${row.correct}/${row.total})`; summary.append(line);
    }
    element('status').textContent = total ? `Overall: ${Math.round(correct / total * 100)}% from ${total} answers.` : 'No article practice yet.';
    const today = new Date(); today.setUTCHours(0,0,0,0);
    chart(element('daily'), Array.from({ length: 90 }, (_, i) => {
      const x = today.getTime() - (89 - i) * 86400000, label = new Date(x).toISOString().slice(0,10);
      const day = data.days.find(d => d.day === label);
      return { x, label, value: day ? day.correct / day.total * 100 : null, detail: day ? `${day.correct}/${day.total} correct` : 'No practice' };
    }), 'Daily article accuracy');
  } catch (error) { if (request === generation) element('status').textContent = error instanceof Error ? error.message : 'Unable to load progress.'; }
}
for (const id of ['article-tier','article-question']) element(id).addEventListener('change', () => void load());
element('refresh').addEventListener('click', () => void load());
document.addEventListener('visibilitychange', () => { if (!document.hidden) void load(); });
void load();
