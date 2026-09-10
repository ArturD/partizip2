import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { commonErrorsQuery } from '../src/worker/common-errors.ts';
test('common errors use only the last five normal attempts and preserve existing history', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(readFileSync(new URL('../migrations/0001_attempts.sql', import.meta.url), 'utf8'));
    db.prepare('INSERT INTO attempts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run('old', 'one', 'essen', 'essential', 'irregular', 'x', 'gegessen', 'wrong', '2026-09-09T00:00:00.000Z');
    db.exec(readFileSync(new URL('../migrations/0002_practice_mode.sql', import.meta.url), 'utf8'));
    assert.equal(db.prepare("SELECT practice_mode FROM attempts WHERE id = 'old'").get()?.practice_mode, 'standard');
    let number = 0;
    const add = (verb: string, result: string, mode = 'standard', learner = 'one') => db.prepare('INSERT INTO attempts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(String(++number), learner, verb, 'essential', 'irregular', 'x', 'x', result, new Date(Date.UTC(2026, 8, 10, 0, number)).toISOString(), mode);
    const ids = () => db.prepare(commonErrorsQuery).all('one').map(row => row.verb_id);
    add('sehen', 'typo'); assert.deepEqual(ids(), ['essen']);
    add('sehen', 'typo'); assert.deepEqual(ids(), ['sehen', 'essen']);
    add('gehen', 'wrong', 'errors'); add('lesen', 'wrong', 'standard', 'other');
    assert.deepEqual(ids(), ['sehen', 'essen']);
    for (let i = 0; i < 5; i++) add('essen', 'correct');
    assert.deepEqual(ids(), ['sehen']);
  } finally { db.close(); }
});
