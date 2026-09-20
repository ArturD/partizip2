import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { articleLessonQuery } from '../src/features/articles/trends.ts';
import { smoothLesson } from '../src/client/trends.ts';
test('article lessons split at four hours within difficulty, before tier filtering', () => {
 const db = new DatabaseSync(':memory:');
 for (const file of ['0003_articles.sql','0004_article_difficulty.sql']) db.exec(readFileSync(new URL(`../migrations/${file}`,import.meta.url),'utf8'));
 let id = 0;
 const add = (time: string, difficulty = 'easy', tier = 'essential', learner = 'one') => db.prepare('INSERT INTO article_attempts (id, learner_id, round_id, noun_id, content_version, tier, question, answer, expected, correct, answered_at, difficulty) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 1, ?, ?)').run(String(++id),learner,String(id),'hund',tier,'gender','der','der',`2026-09-21T${time}:00.000Z`,difficulty);
 const get = (difficulty = 'easy', tier = '') => db.prepare(articleLessonQuery).all('one',difficulty,tier,tier,'','');
 try {
  add('00:00'); add('04:00'); add('07:00','easy','common'); add('10:00');
  add('15:00','hard'); add('20:00','easy','essential','other');
  assert.equal(get().length,3); assert.equal(get('easy','essential').length,2);
  assert.equal(get('hard').length,1);
  add('14:00','easy','common');
  assert.equal(get().length,1); assert.equal(get('easy','essential').length,0);
 } finally { db.close(); }
});
test('case smoothing retains shared lesson positions and waits for complete case windows', () => {
 const answers = [{number:1,answered_at:'a',score:100},{number:5,answered_at:'b',score:0},{number:9,answered_at:'c',score:100}];
 assert.deepEqual(smoothLesson(answers,2,'sma').map(a => [a.number,a.accuracy]),[[1,null],[5,50],[9,50]]);
 assert.ok(Math.abs(smoothLesson(answers,2,'ema')[2].accuracy! - 83.3333333333)<0.001);
});
