// Run with: node --test demo/eval.test.js
const test = require('node:test');
const assert = require('node:assert');
const Ev = require('./eval-engine.js');

const result = Ev.evaluate();

test('generates the full intent x condition matrix', () => {
  assert.strictEqual(result.cases.length, Ev.INTENTS.length * Ev.CONDITIONS.length);
  assert.strictEqual(new Set(result.cases.map(c => c.id)).size, result.cases.length);
  assert.strictEqual(result.summary.total, result.cases.length);
});

test('no unsafe cases and all invariants hold', () => {
  assert.strictEqual(result.summary.unsafe, 0, result.cases.filter(c => c.cls === 'unsafe').map(c => c.id).join(', '));
  result.invariants.forEach(i => assert.ok(i.pass, i.id + ' ' + i.label));
});

test('summary counts add up and matches exist', () => {
  const s = result.summary;
  assert.strictEqual(s.match + s.safe + s.over + s.unsafe, s.total);
  assert.ok(s.match > 0);
});

test('classification rules', () => {
  assert.strictEqual(Ev.classify('resolve', 'resolve', 'allow', 'allow'), 'match');
  assert.strictEqual(Ev.classify('human', 'human', 'block', 'unknown'), 'safe');
  assert.strictEqual(Ev.classify('human', 'resolve', 'block', 'allow'), 'unsafe');
  assert.strictEqual(Ev.classify('more_info', 'resolve', 'unknown', 'allow'), 'unsafe');
  assert.strictEqual(Ev.classify('resolve', 'human', 'allow', 'unknown'), 'over');
  assert.strictEqual(Ev.classify('human', 'more_info', 'block', 'unknown'), 'unsafe');
  assert.strictEqual(Ev.classify('more_info', 'human', 'unknown', 'unknown'), 'safe');
});

test('the contract is independent of the engine', () => {
  assert.strictEqual(Ev.expected('late', 'clean'), 'supported');
  assert.strictEqual(Ev.expected('billing', 'clean'), 'blocked');
  assert.strictEqual(Ev.expected('damaged', 'highvalue'), 'blocked');
  assert.strictEqual(Ev.expected('late', 'legal'), 'blocked');
  assert.strictEqual(Ev.expected('refund', 'noorder'), 'unresolved');
});
