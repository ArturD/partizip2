export interface Day { day: string; total: number; correct: number; typo?: number }
export interface Point { label: string; value: number | null; detail: string; x: number }
export interface LessonAnswer { number: number; answered_at: string; score: number }
export function smoothLesson(answers: LessonAnswer[], period: number, method: 'sma' | 'ema') {
  if (!Number.isInteger(period) || period < 1 || period > 100) throw new Error('Period must be a whole number from 1 to 100.');
  let sum = 0, ema = 0;
  const alpha = 2 / (period + 1);
  return answers.map((answer, index) => {
    sum += answer.score;
    if (index >= period) sum -= answers[index - period].score;
    // Seed EMA with the mean of the first complete period, then update recursively.
    if (index === period - 1) ema = sum / period;
    else if (index >= period) ema = alpha * answer.score + (1 - alpha) * ema;
    return { ...answer, accuracy: index < period - 1 ? null : method === 'sma' ? sum / period : ema };
  });
}
// Weight by answers, rather than treating a one-answer day like a 100-answer day.
export function dailyTrend(days: Day[], today: string): Point[] {
  const counts = new Map(days.map(day => [day.day, day]));
  const end = Date.parse(`${today}T00:00:00Z`);
  const dayMs = 86400000;
  return Array.from({ length: 90 }, (_, index) => {
    const time = end - (89 - index) * dayMs;
    const label = new Date(time).toISOString().slice(0, 10);
    let total = 0, correct = 0;
    for (let i = 0; i < 7; i++) {
      const day = counts.get(new Date(time - i * dayMs).toISOString().slice(0, 10));
      total += day?.total ?? 0; correct += (day?.correct ?? 0) + (day?.typo ?? 0) * 0.5;
    }
    const own = counts.get(label);
    return { label, x: index, value: total ? correct / total * 100 : null,
      detail: `${own?.total ?? 0} answers this day; ${correct}/${total} points over the trailing 7 days` };
  });
}
