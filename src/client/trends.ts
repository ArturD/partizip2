export interface Day { day: string; total: number; correct: number }
export interface Point { label: string; value: number | null; detail: string; x: number }
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
      total += day?.total ?? 0; correct += day?.correct ?? 0;
    }
    const own = counts.get(label);
    return { label, x: index, value: total ? correct / total * 100 : null,
      detail: `${own?.total ?? 0} answers this day; ${correct}/${total} correct over the trailing 7 days` };
  });
}
