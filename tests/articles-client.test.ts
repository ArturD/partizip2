import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

test('gender must be corrected before cases; corrections are unlogged and failed saves retry original choice', async () => {
  const elements = new Map();
  const node = () => ({ textContent: '', value: '', hidden: false, disabled: false, children: [] as any[], handlers: new Map(),
    addEventListener(name: string, fn: Function) { this.handlers.set(name,fn); },
    append(child: any) { this.children.push(child); }, replaceChildren() { this.children = []; },
    querySelector() { return this.children[0]; }, querySelectorAll() { return this.children; }, focus() {} });
  const element = (id: string) => { if (!elements.has(id)) elements.set(id,node()); return elements.get(id); };
  const attempts: any[] = []; let fail = true;
  const source = readFileSync(new URL('../src/client/articles.ts', import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
  runInNewContext(stripTypeScriptTypes(source), { element, document: { createElement: node }, crypto,
    api: async (path: string, options: any) => {
      if (path.endsWith('/nouns')) return [{id:'hund',noun:'Hund',english:'dog',tier:'essential',version:1,sentences:{accusative:'Ich sehe _ Hund.',dative:'Ich spiele mit _ Hund.',genitive:'Das Fell _ Hundes ist weich.'}}];
      const body = JSON.parse(options.body); attempts.push(body);
      if (fail) { fail = false; throw Error('Offline'); }
      const expected = ({gender:'der',accusative:'den',dative:'dem',genitive:'des'} as any)[body.question];
      return { answer:body.answer, expected, correct:Number(body.answer === expected), explanation:'Explanation' };
    }
  });
  const flush = () => new Promise(resolve => setImmediate(resolve));
  const choose = async (text: string) => { element('choices').children.find((b: any) => b.value === text).handlers.get('click')(); await flush(); };
  await flush();
  assert.match(element('article-step').textContent,/Gender/);
  assert.deepEqual(element('choices').children.map((b: any) => b.textContent),['der','die','das']);
  await choose('die'); // Failed save.
  assert.ok(element('choices').children.every((b: any) => !b.className));
  await choose('das'); // Retry must still submit die.
  assert.equal(element('choices').children.find((b: any) => b.value === 'die').className,'article-wrong');
  assert.equal(element('choices').children.find((b: any) => b.value === 'der').className,'article-correct');
  assert.equal(attempts[1].answer,'die'); assert.equal(attempts[1].id,attempts[0].id);
  assert.equal(element('article-next').hidden,true);
  await choose('das'); assert.equal(element('article-next').hidden,true);
  await choose('der'); assert.equal(element('article-next').hidden,false);
  assert.equal(attempts.length,2); // No correction requests.
  for (const [question, answer] of [['accusative','den'],['dative','dem'],['genitive','des']]) {
    element('article-next').handlers.get('click')();
    assert.ok(element('choices').children.every((b: any) => !b.className));
    await choose(answer);
    assert.equal(element('choices').children.find((b: any) => b.value === answer).className,'article-correct');
    assert.equal(attempts.at(-1).question,question);
    assert.equal(element('article-next').hidden,false);
  }
  assert.equal(element('article-tier').disabled,false);
  element('article-next').handlers.get('click')();
  assert.match(element('article-step').textContent,/Gender/);
  assert.equal(element('article-feedback').textContent,'');
});
