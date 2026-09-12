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
test('accepts German keyboard alternatives without conflating ordinary vowel pairs', () => {
  for (const [answer, expected] of [['gehoert', 'gehört'], ['GEWAeHLT', 'gewählt'], ['geuebt', 'geübt'], [' geaendert ', 'geändert']]) {
    assert.equal(grade(answer, expected), 'correct');
  }
  assert.equal(grade('gehort', 'gehört'), 'typo');
  assert.notEqual(grade('gedaürt', 'gedauert'), 'correct');
  assert.equal(grade('gedauert', 'gedauert'), 'correct');
});
test('vocabulary has unique stable IDs, consistent types and valid forms', () => {
  assert.equal(verbs.length, 110);
  assert.equal(new Set(verbs.map(v => v.id)).size, verbs.length);
  for (const verb of verbs) {
    assert.equal(grade(verb.participle, verb.participle), 'correct');
    assert.equal(verb.type, verb.subtype === 'weak' ? 'regular' : 'irregular');
    assert.ok(verb.english && verb.participle && verb.id === verb.infinitive);
  }
  assert.equal(verbs.find(v => v.id === 'teilnehmen')?.participle, 'teilgenommen');
  assert.equal(verbs.find(v => v.id === 'werden')?.participle, 'geworden');
});

test('practice sets cover essential regulars and common irregulars', () => {
  const count = (tier: string, type: string) => verbs.filter(v => v.tier === tier && v.type === type).length;
  assert.equal(count('essential', 'regular'), 15);
  assert.equal(count('essential', 'irregular'), 15);
  assert.equal(count('common', 'irregular'), 20);
  assert.equal(count('common', 'regular'), 20);
  assert.equal(count('extended', 'regular'), 20);
  assert.equal(count('extended', 'irregular'), 20);
  for (const [id, participle] of [['arbeiten', 'gearbeitet'], ['bezahlen', 'bezahlt'], ['telefonieren', 'telefoniert'], ['einkaufen', 'eingekauft'], ['bringen', 'gebracht'], ['aufstehen', 'aufgestanden']]) {
    assert.equal(verbs.find(v => v.id === id)?.participle, participle);
  }
});
