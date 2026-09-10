import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

// Run the actual client handlers with DOM stand-ins and a mocked API.
for (const result of ['wrong', 'typo', 'correct']) test(`${result}: correction flow preserves one logged attempt`, async () => {
  const elements = new Map();
  const calls: string[] = [];
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, {
      value: '', disabled: false, hidden: false, textContent: '', handlers: new Map(),
      addEventListener(name: string, handler: Function) { this.handlers.set(name, handler); },
      focus() {}, select() {}, setCustomValidity() {}, reportValidity() {},
    });
    return elements.get(id);
  };
  const source = readFileSync(new URL('../src/client/practice.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/, '');
  runInNewContext(stripTypeScriptTypes(source), {
    element, crypto: { randomUUID: () => 'test-attempt' },
    labels: { wrong: 'Wrong', typo: 'Typo', correct: 'Correct' },
    api: async (path: string) => {
      calls.push(path);
      return path === '/api/verbs'
        ? [{ id: 'essen', infinitive: 'essen', english: 'eat', tier: 'essential', type: 'irregular', subtype: 'strong' }]
        : { result, expected: 'gegessen' };
    },
  });
  await Promise.resolve();
  const submit = async (value: string) => {
    element('answer').value = value;
    await element('answer-form').handlers.get('submit')({ preventDefault() {} });
  };
  await submit(result === 'correct' ? 'gegessen' : 'incorrect');
  if (result !== 'correct') {
    assert.equal(element('next').hidden, true);
    assert.equal(element('tier').disabled, true);
    assert.equal(element('type').disabled, true);
    assert.equal(element('answer').value, '');
    await submit('gegesen');
    assert.equal(element('next').hidden, true);
    assert.equal(element('tier').disabled, true);
    await submit(' GEGESSEN ');
  }
  assert.equal(element('next').hidden, false);
  assert.equal(element('tier').disabled, false);
  assert.equal(element('answer').readOnly, true);
  assert.equal(calls.filter(path => path === '/api/attempts').length, 1);
  element('next').handlers.get('click')();
  assert.equal(element('answer').readOnly, false);
  assert.equal(element('check').textContent, 'Check answer ↵');
});
