import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { nouns, solution, steps } from '../src/features/articles/nouns.ts';
import { articlesApi } from '../src/features/articles/api.ts';

test('article content has 30 unique nouns, balanced genders and three complete sentences', () => {
  assert.equal(nouns.length, 30); assert.equal(new Set(nouns.map(n => n.id)).size, 30);
  for (const gender of ['masculine','feminine','neuter']) assert.equal(nouns.filter(n => n.gender === gender).length, 10);
  for (const noun of nouns) for (const question of steps) {
    assert.ok(solution(noun, question).explanation.includes(noun.noun));
    if (question !== 'gender') assert.equal(noun.sentences[question].split('_').length, 2);
  }
  assert.deepEqual(steps.map(q => solution(nouns.find(n => n.id === 'hund')!,q).expected), ['der','den','dem','des']);
  assert.deepEqual(steps.map(q => solution(nouns.find(n => n.id === 'frau')!,q).expected), ['die','die','der','der']);
  assert.deepEqual(steps.map(q => solution(nouns.find(n => n.id === 'kind')!,q).expected), ['das','das','dem','des']);
});

test('article API enforces sequence, saves immutable retries and isolates learners and verb history', async () => {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['0001_attempts.sql','0002_practice_mode.sql','0003_articles.sql']) sqlite.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url),'utf8'));
  const db = {
    prepare(sql: string) { let values: any[] = []; return {
      bind(...args: any[]) { values = args; return this; },
      async run() { return sqlite.prepare(sql).run(...values); },
      async first() { return sqlite.prepare(sql).get(...values) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...values) }; }
    }; },
    async batch(statements: any[]) { return Promise.all(statements.map(s => s.all())); }
  } as unknown as D1Database;
  const roundId = crypto.randomUUID();
  const make = (question = 'gender', answer = 'die') => ({ id: crypto.randomUUID(), roundId, nounId: 'hund', version: 1, question, answer });
  const post = (body: unknown, learner = 'one', origin = 'https://test.local') => articlesApi(new Request('https://test.local/api/articles/attempts', { method: 'POST', headers: { Origin: origin, 'Content-Type':'application/json' }, body: JSON.stringify(body) }), db, learner);
  const get = (path: string, learner = 'one') => articlesApi(new Request(`https://test.local/api/articles/${path}`), db, learner);
  try {
    const prompts = await (await get('nouns')).json() as any[];
    assert.equal(prompts.length,30); assert.ok(!('gender' in prompts[0]));
    assert.equal((await post(make('dative'))).status,409);
    assert.equal((await post(make(), 'one', 'https://evil.local')).status,403);
    assert.equal((await post(null)).status,400);
    assert.equal((await post({...make(), answer:'banana'})).status,400);
    const initial = make(); const saved = await (await post(initial)).json() as any;
    assert.equal(saved.correct,0); assert.equal(saved.expected,'der');
    assert.deepEqual(await (await post({...initial, answer:'der'})).json(),saved);
    assert.deepEqual(await (await post({...make(),answer:'der'})).json(),saved);
    for (const [question,answer] of [['accusative','den'],['dative','dem'],['genitive','des']]) assert.equal((await post(make(question,answer))).status,200);
    const progress = await (await get('progress')).json() as any;
    assert.equal(progress.summary.reduce((n: number,r: any) => n+r.total,0),4);
    assert.equal(progress.summary.reduce((n: number,r: any) => n+r.correct,0),3);
    assert.equal((await (await get('progress','two')).json() as any).summary.length,0);
    assert.equal((await (await get('progress?tier=common')).json() as any).summary.length,0);
    assert.equal((await (await get('progress?question=gender')).json() as any).summary.length,1);
    assert.equal(sqlite.prepare('SELECT COUNT(*) total FROM attempts').get()?.total,0);
  } finally { sqlite.close(); }
});
