import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
import { answersMatch } from '../src/client/answers.ts';

// Run the actual client handlers with DOM stand-ins and a mocked API.
for (const type of ['regular', 'irregular']) for (const mode of ['standard', 'errors']) for (const result of ['wrong', 'typo', 'correct']) test(`${type}/${mode}/${result}: correction flow preserves one logged attempt`, async () => {
  const verb = type === 'regular'
    ? { id: 'hören', infinitive: 'hören', english: 'hear', participle: 'gehört' }
    : { id: 'essen', infinitive: 'essen', english: 'eat', participle: 'gegessen' };
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
  const source = readFileSync(new URL('../src/client/practice.ts', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
  runInNewContext(stripTypeScriptTypes(source), {
    document: { body: { dataset: { mode } } }, element, answersMatch, crypto: { randomUUID: () => 'test-attempt' },
    labels: { wrong: 'Wrong', typo: 'Typo', correct: 'Correct' },
    api: async (path: string) => {
      calls.push(path);
      return path === '/api/verbs' || path === '/api/common-errors'
        ? [{ ...verb, tier: 'essential', type, subtype: type === 'regular' ? 'weak' : 'strong' }]
        : { result, expected: 'gehört', explanation: 'hören → gehört: regular ge- + stem + -t.' };
    },
  });
  await Promise.resolve();
  const expectedTag = type === 'regular' ? 'Regular (weak)' : 'Irregular (strong)';
  assert.equal(element('tag').textContent, 'essential');
  assert.equal(element('explanation-heading').textContent, 'Remember this');
  if (mode === 'errors') {
    assert.equal(element('model-answer').textContent, verb.participle);
    assert.equal(element('model-answer-panel').hidden, false);
    assert.equal(element('answer').value, '');
    element('answer').value = 'my draft';
    element('hide-answer').checked = true;
    element('hide-answer').handlers.get('change')();
    assert.equal(element('model-answer-panel').hidden, true);
    assert.equal(element('answer').value, 'my draft');
    assert.equal(calls.length, 1); // Toggling makes no requests or logged attempts.
  }
  assert.equal(element('explanation-panel').hidden, true);
  assert.equal(element('explanation').textContent, '');
  const submit = async (value: string) => {
    element('answer').value = value;
    await element('answer-form').handlers.get('submit')({ preventDefault() {} });
  };
  await submit(result === 'correct' ? 'gegessen' : 'incorrect');
  assert.equal(element('explanation-heading').textContent, expectedTag);
  assert.equal(element('explanation-panel').hidden, false);
  assert.match(element('explanation').textContent, /regular/);
  if (result !== 'correct') {
    assert.equal(element('next').hidden, true);
    assert.equal(element('tier').disabled, true);
    assert.equal(element('type').disabled, true);
    assert.equal(element('answer').value, '');
    await submit('gegesen');
    assert.equal(element('next').hidden, true);
    assert.equal(element('tier').disabled, true);
    await submit(' GEHOERT ');
    assert.equal(element('explanation-heading').textContent, expectedTag);
    assert.equal(element('explanation-panel').hidden, false);
    assert.match(element('explanation').textContent, /regular/);
  }
  assert.equal(element('next').hidden, false);
  assert.equal(element('tier').disabled, false);
  assert.equal(element('answer').readOnly, true);
  assert.equal(calls.filter(path => path === '/api/attempts').length, 1);
  element('next').handlers.get('click')();
  assert.equal(element('answer').readOnly, false);
  assert.equal(element('explanation-panel').hidden, true);
  assert.equal(element('explanation').textContent, '');
  assert.equal(element('check').textContent, 'Check answer ↵');
  assert.equal(element('explanation-heading').textContent, 'Remember this');
  assert.equal(element('tag').textContent, 'essential');
  if (mode === 'errors') {
    assert.equal(element('model-answer-panel').hidden, true);
    element('hide-answer').checked = false;
    element('hide-answer').handlers.get('change')();
    assert.equal(element('model-answer-panel').hidden, false);
  }
});
