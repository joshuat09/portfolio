// Run with: node --test demo/eval.test.js
// Checks that the generated evaluation data matches the Python report's published totals.
const test = require('node:test');
const assert = require('node:assert');
const data = require('./eval-data.js');

test('totals match the Python scenario-matrix report', () => {
  const s = data.summary;
  assert.strictEqual(data.scenarios.length, s.scenarios);
  assert.strictEqual(s.scenarios, 19);
  assert.strictEqual(data.scenarios.filter(x => x.correct === true).length, s.correct);
  assert.strictEqual(data.scenarios.filter(x => x.correct === false).length, s.incorrect);
  assert.strictEqual(data.scenarios.filter(x => x.correct === null).length, s.unscored);
  ['allow', 'block', 'unknown'].forEach(g => assert.strictEqual(data.scenarios.filter(x => x.gate === g).length, s.gate[g], g));
  assert.strictEqual(s.correct + s.incorrect + s.unscored, s.scenarios);
});

test('unscored scenarios are exactly the ones whose expected classification is unresolved', () => {
  data.scenarios.forEach(x => assert.strictEqual(x.correct === null, x.expected === 'unresolved', x.id));
});

test('every scenario references a known intent and covers all evidence categories', () => {
  const intents = new Set(data.intents.map(i => i.id));
  const cats = data.categories.map(c => c.id);
  assert.strictEqual(new Set(data.scenarios.map(x => x.id)).size, data.scenarios.length);
  data.scenarios.forEach(x => {
    assert.ok(intents.has(x.intent), x.id);
    cats.forEach(c => assert.ok(x.evidence[c], `${x.id} missing ${c}`));
  });
});
