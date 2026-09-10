import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dailyTrend, smoothLesson } from '../src/client/trends.ts';
import { lessonQuery } from '../src/worker/trends.ts';
test('SMA skips partial windows and EMA seeds from the first full average', () => {
  const answers = [0, 50, 100, 100, 0].map((score, index) => ({ score, number: index + 1, answered_at: '2026-09-10T00:00:00Z' }));
  assert.deepEqual(smoothLesson(answers, 3, 'sma').map(point => point.accuracy), [null, null, 50, 250 / 3, 200 / 3]);
  assert.deepEqual(smoothLesson(answers, 3, 'ema').map(point => point.accuracy), [null, null, 50, 75, 37.5]);
  assert.ok(smoothLesson(answers, 10, 'sma').every(point => point.accuracy === null));
  assert.deepEqual(smoothLesson(answers, 1, 'ema').map(point => point.accuracy), [0, 50, 100, 100, 0]);
  for (const n of [0, 101, 1.5, NaN]) assert.throws(() => smoothLesson(answers, n, 'sma'));
});

test('daily trend weights answers, includes six warm-up days and leaves empty windows blank', () => {
  const points = dailyTrend([
    { day: '2026-06-07', total: 2, correct: 1 },
    { day: '2026-09-03', total: 50, correct: 50 },
    { day: '2026-09-09', total: 9, correct: 9 },
    { day: '2026-09-10', total: 1, correct: 0, typo: 1 },
  ], '2026-09-10');
  assert.equal(points.length, 90);
  assert.equal(points[0].label, '2026-06-13');
  assert.equal(points[0].value, 50);
  assert.equal(points[1].value, null);
  assert.equal(points.at(-1)?.value, 95); // 9.5/10, not a 50% mean of daily percentages.
  assert.equal(dailyTrend([], '2026-09-10').every(point => point.value === null), true);
});

test('lesson SQL uses the latest session, filters after session detection and rolls over ten answers', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync(new URL('../migrations/0001_attempts.sql', import.meta.url), 'utf8'));
    db.exec(readFileSync(new URL('../migrations/0002_practice_mode.sql', import.meta.url), 'utf8'));
    const insert = db.prepare('INSERT INTO attempts (id, learner_id, verb_id, tier, verb_type, answer, expected, result, answered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    let id = 0;
    const add = (minute: number, result = 'correct', type = 'irregular', learner = 'one') => insert.run(String(++id), learner, 'essen', 'essential', type, 'test', 'gegessen', result, new Date(Date.UTC(2026, 8, 10, 10, minute)).toISOString());
    add(-300, 'wrong'); // Previous lesson must not enter the rolling average.
    for (let minute = 0; minute < 11; minute++) add(minute, minute === 0 ? 'wrong' : 'correct');
    add(30, 'correct', 'regular'); // Bridges filtered irregular points 40 minutes apart.
    add(50, 'typo');
    add(55, 'wrong', 'irregular', 'someone-else');
    const query = db.prepare(lessonQuery);
    const filtered = query.all('one', 'standard', 'standard', '', '', 'irregular', 'irregular');
    assert.equal(filtered.length, 12);
    assert.equal(filtered[0].accuracy, 95);
    assert.equal(filtered[1].accuracy, 100);
    assert.equal(filtered.at(-1)?.accuracy, 0);
    assert.equal(query.all('one', 'standard', 'standard', 'common', 'common', '', '').length, 0);
    add(289); // 3h59 after the last answer stays in the lesson.
    assert.equal(query.all('one', 'standard', 'standard', '', '', '', '').length, 14);
    add(529); // Exactly four hours after the last answer starts a new lesson.
    const latest = query.all('one', 'standard', 'standard', '', '', '', '');
    assert.equal(latest.length, 1);
    assert.equal(latest[0].number, 1);
    assert.equal(latest[0].accuracy, 100);
  } finally { db.close(); }
});
