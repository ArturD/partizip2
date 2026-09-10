// Run against `wrangler dev`: node tests/integration.mjs. Writes test-only local history.
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:8787';
const initial = await fetch(`${base}/api/verbs`);
assert.equal(initial.status, 200);
const cookie = initial.headers.get('set-cookie').split(';')[0];
const verbs = await initial.json();
assert.equal(verbs.length, 15); assert.ok(!('participle' in verbs[0]));
async function send(answer, id = crypto.randomUUID(), origin = base) {
  const response = await fetch(`${base}/api/attempts`, { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, verbId: 'essen', answer }) });
  return { response, body: await response.json() };
}
const id = crypto.randomUUID();
const correct = await send('gegessen', id); assert.equal(correct.body.result, 'correct');
assert.match(correct.body.answered_at, /^\d{4}-\d\d-\d\dT.*\.\d{3}Z$/);
assert.deepEqual((await send('gegessen', id)).body, correct.body);
assert.equal((await send('gegesen')).body.result, 'typo');
assert.equal((await send('banana')).body.result, 'wrong');
assert.equal((await send('gegessen', crypto.randomUUID(), 'https://other.example')).response.status, 403);
assert.equal((await send(' '.repeat(3))).response.status, 400);
const progress = await (await fetch(`${base}/api/progress`, { headers: { Cookie: cookie } })).json();
assert.deepEqual(progress.summary, { total: 3, correct: 1, typo: 1, wrong: 1, practiced: 1 });
const regular = await (await fetch(`${base}/api/progress?type=regular`, { headers: { Cookie: cookie } })).json();
assert.equal(regular.summary.total, 0);
const separate = await (await fetch(`${base}/api/progress`)).json(); assert.equal(separate.summary.total, 0);
assert.equal((await fetch(`${base}/api/progress?type=invalid`)).status, 400);
for (const path of ['/', '/progress.html', '/js/practice.js', '/js/progress.js', '/style.css']) assert.equal((await fetch(base + path)).status, 200, path);
console.log('Integration passed: grading, timestamps, retries, filters, isolation, validation and static routes.');
