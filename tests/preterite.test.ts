import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verbs } from '../src/data/verbs.ts';
import { preterite, preteriteExplanation } from '../src/data/preterite.ts';
test('Präteritum covers the exact shared vocabulary and handles separated prefixes', () => {
 assert.deepEqual(Object.keys(preterite).sort(), verbs.map(v => v.id).sort());
 for (const verb of verbs) {
  assert.ok(preterite[verb.id].trim());
  assert.equal(preterite[verb.id].includes(' '),verb.separable,verb.id);
  assert.ok(preteriteExplanation(verb).startsWith(`${verb.id} → ${preterite[verb.id]}.`));
 }
 for (const [id, form] of Object.entries({sein:'war',werden:'wurde',essen:'aß',lesen:'las',bringen:'brachte',denken:'dachte',teilnehmen:'nahm teil',vorbereiten:'bereitete vor',öffnen:'öffnete',wandern:'wanderte',übersetzen:'übersetzte',unterschreiben:'unterschrieb'})) assert.equal(preterite[id],form);
});
