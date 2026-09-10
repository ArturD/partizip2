import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade } from '../src/worker/grading.ts';
import { verbs } from '../src/data/verbs.ts';

test('normalizes case, outer whitespace and Unicode without discarding umlauts', () => {
  assert.equal(grade('  GEGESSEN ', 'gegessen'), 'correct');
  assert.equal(grade('geho\u0308rt', 'gehört'), 'correct');
  assert.equal(grade('gehort', 'gehört'), 'typo');
});
test('one edit or adjacent transposition is a typo', () => {
  for (const answer of ['gegesen', 'gegesssen', 'gegessan', 'gegesesn']) assert.equal(grade(answer, 'gegessen'), 'typo', answer);
  for (const answer of ['', 'gegangen', 'essen', 'habe gegessen', 'ge gessen!']) assert.equal(grade(answer, 'gegessen'), 'wrong', answer);
});
test('all initial verbs have unique stable IDs and grade correctly', () => {
  assert.equal(verbs.length, 15);
  assert.equal(new Set(verbs.map(v => v.id)).size, 15);
  for (const verb of verbs) {
    assert.equal(grade(verb.participle, verb.participle), 'correct');
    assert.equal(verb.tier, 'essential'); assert.equal(verb.type, 'irregular');
  }
  assert.equal(verbs.find(v => v.id === 'teilnehmen')?.participle, 'teilgenommen');
  assert.equal(verbs.find(v => v.id === 'werden')?.participle, 'geworden');
});
