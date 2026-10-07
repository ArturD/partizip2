// Local Worker only: uses a fresh test learner, never production history.
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:8787';
const initial = await fetch(base + '/api/preterite/verbs'); assert.equal(initial.status,200);
const cookie = initial.headers.get('set-cookie').split(';')[0];
const prompts = await initial.json(); assert.equal(prompts.length,110); assert.ok(!('participle' in prompts[0]));
const get = async path => { const r = await fetch(base+path,{headers:{Cookie:cookie}}); assert.equal(r.status,200); return r.json(); };
const send = async (prefix, verbId, answer, mode='standard', id=crypto.randomUUID()) => {
 const r = await fetch(base+prefix+'/attempts',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({id,verbId,answer,mode})}); assert.equal(r.status,200); return r.json();
};
const id=crypto.randomUUID();
const first=await send('/api/preterite','gehen','ging','standard',id);assert.equal(first.result,'correct');
assert.deepEqual(await send('/api/preterite','gehen','wrong','standard',id),first);
assert.equal((await send('/api/preterite','gehen','gegangen')).result,'wrong');
assert.equal((await send('/api/preterite','aufstehen','stand auf')).result,'correct');
assert.equal((await send('/api/preterite','hören','hoerte')).result,'correct');
assert.equal((await get('/api/progress')).summary.total,0);
assert.equal((await get('/api/preterite/progress')).summary.total,4);
assert.equal((await get('/api/preterite/trends')).lesson.length,4);
assert.equal((await get('/api/preterite/common-errors'))[0].participle,'ging');
assert.equal((await get('/api/common-errors')).length,0);
await send('/api/preterite','gehen','ging','errors');
assert.equal((await get('/api/preterite/progress')).summary.total,4);
assert.equal((await get('/api/preterite/progress?mode=errors')).summary.total,1);
await send('/api','essen','gegessen');
assert.equal((await get('/api/progress')).summary.total,1);
assert.equal((await get('/api/preterite/progress')).summary.total,4);
for(const path of ['/preterite','/preterite-errors','/preterite-progress']) assert.equal((await fetch(base+path)).status,200);
console.log('Präteritum integration passed: shared vocabulary, grading, retries, corrections data, history and chart isolation.');
