import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verbs } from '../src/data/verbs.ts';
import { explanations } from '../src/data/explanations.ts';

test('every vocabulary entry has a matching explanation with the correct participle', () => {
  assert.deepEqual(Object.keys(explanations).sort(), verbs.map(verb => verb.id).sort());
  for (const verb of verbs) {
    assert.equal(verb.explanation, explanations[verb.id]);
    assert.ok(verb.explanation.startsWith(`${verb.infinitive} → ${verb.participle}`), verb.id);
    if (verb.type === 'regular') {
      // The explicitly written formation must actually assemble to the vocabulary form.
      const decomposition = verb.explanation.split(': ')[1].split(';')[0];
      assert.equal(decomposition.replaceAll(' + ', ''), verb.participle, verb.id);
    }
  }
});

test('notes distinguish important prefix exceptions and confusing pairs', () => {
  assert.match(explanations.vorbereiten, /no ge-/);
  assert.match(explanations.übersetzen, /meaning “translate”/);
  assert.match(explanations.wiederholen, /meaning “repeat”/);
  assert.match(explanations.liegen, /legen → gelegt/);
  assert.match(explanations.tragen, /fragen → gefragt/);
  assert.match(explanations.laufen, /kaufen → gekauft/);
  assert.match(explanations.sein, /one s/);
  assert.match(explanations.teilnehmen, /double m/);
});
