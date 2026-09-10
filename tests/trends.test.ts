import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dailyTrend } from '../src/client/trends.ts';
import { lessonQuery } from '../src/worker/trends.ts';

test('daily trend weights answers, includes six warm-up days and leaves empty windows blank', () => {
  const points = dailyTrend([
    { day: '2026-06-07', total: 2, correct: 1 },
    { day: '2026-09-03', total: 50, correct: 50 },
    { day: '2026-09-09', total: 9, correct: 9 },
    { day: '2026-09-10', total: 1, correct: 0 },
  ], '2026-09-10');
  assert.equal(points.length, 90);
  assert.equal(points[0].label, '2026-06-13');
  assert.equal(points[0].value, 50);
  assert.equal(points[1].value, null);
  assert.equal(points.at(-1)?.value, 90); // 9/10, not a 50% mean of daily percentages.
  assert.equal(dailyTrend([], '2026-09-10').every(point => point.value === null), true);
});

test('lesson SQL uses the latest session, filters after session detection and rolls over ten answers', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync(new URL('../migrations/0001_attempts.sql', import.meta.url), 'utf8'));
    const insert = db.prepare('INSERT INTO attempts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    let id = 0;
    const add = (minute: number, result = 'correct', type = 'irregular', learner = 'one') => insert.run(String(++id), learner, 'essen', 'essential', type, 'test', 'gegessen', result, new Date(Date.UTC(2026, 8, 10, 10, minute)).toISOString());
    add(-60, 'wrong'); // Previous lesson must not enter the rolling average.
    for (let minute = 0; minute < 11; minute++) add(minute, minute === 0 ? 'wrong' : 'correct');
    add(30, 'correct', 'regular'); // Bridges filtered irregular points 40 minutes apart.
    add(50, 'typo');
    add(55, 'wrong', 'irregular', 'someone-else');
    const query = db.prepare(lessonQuery);
    const filtered = query.all('one', '', '', 'irregular', 'irregular');
    assert.equal(filtered.length, 12);
    assert.equal(filtered[0].accuracy, 90);
    assert.equal(filtered[1].accuracy, 100);
    assert.equal(filtered.at(-1)?.accuracy, 0);
    assert.equal(query.all('one', 'common', 'common', '', '').length, 0);
    add(80); // Exactly 30 minutes marks a new lesson.
    const latest = query.all('one', '', '', '', '');
    assert.equal(latest.length, 1);
    assert.equal(latest[0].number, 1);
    assert.equal(latest[0].accuracy, 100);
  } finally { db.close(); }
});
