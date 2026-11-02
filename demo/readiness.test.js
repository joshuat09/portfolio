// Run with: node --test demo/readiness.test.js
const test = require('node:test');
const assert = require('node:assert');
const E = require('./readiness-engine.js');
const D = require('./readiness-data.js');

const preset = id => D.presets.find(p => p.id === id);
const rec = answers => E.evaluate(answers).recommendation;

test('every preset has ten answers between 1 and 5', () => {
  D.presets.forEach(p => {
    assert.strictEqual(p.answers.length, D.questions.length, p.id);
    p.answers.forEach(v => assert.ok(v >= 1 && v <= 5 && Number.isInteger(v), p.id));
  });
});

test('example processes get the recommendations I would argue for', () => {
  assert.strictEqual(rec(preset('complaints').answers), 'agent');     // varied inputs, strong governance
  assert.strictEqual(rec(preset('invoices').answers), 'rules');       // predictable, structured
  assert.strictEqual(rec(preset('cvs').answers), 'assist');           // high impact on people, weak governance
  assert.strictEqual(rec(preset('loans').answers), 'assist');         // gate: serious and hard to undo
  assert.strictEqual(rec(preset('meetings').answers), 'agent');       // low risk, messy inputs
  assert.strictEqual(rec(preset('blank').answers), 'assist');         // neutral answers: AI helps, people decide
});

test('safety gates cap autonomy at AI-assisted', () => {
  const r = E.evaluate(preset('loans').answers);
  assert.ok(r.gates.some(g => g.id === 'G1'));
  assert.strictEqual(r.options.rules.ok, false);
  assert.strictEqual(r.options.agent.ok, false);
  const strict = E.evaluate({ ...E.toAnswerMap(preset('complaints').answers), accountability: 5, governance: 2, data: 2 });
  assert.ok(strict.gates.some(g => g.id === 'G2'));
  assert.ok(['assist', 'human'].includes(strict.recommendation));
});

test('serious, irreversible harm never gets rules or an agent', () => {
  for (let predict = 1; predict <= 5; predict++) for (let variety = 1; variety <= 5; variety++) for (let gov = 1; gov <= 5; gov++) {
    const a = { ...E.toAnswerMap(preset('blank').answers), predict, variety, governance: gov, impact: 5, reversible: 5, data: 5, skills: 5, people: 5 };
    assert.ok(['assist', 'human'].includes(rec(a)), JSON.stringify(a));
  }
});

test('the least autonomous option that works is recommended', () => {
  // Both rules and an agent are possible here; rules must win.
  const a = { ...E.toAnswerMap(preset('invoices').answers), variety: 5, predict: 5 };
  const r = E.evaluate(a);
  if (r.options.rules.ok && r.options.agent.ok) assert.strictEqual(r.recommendation, 'rules');
  assert.strictEqual(E.PRIORITY[0], 'rules');
});

test('scores stay within 0-100 for every extreme answer pattern', () => {
  for (const v of [1, 3, 5]) {
    const s = E.scores(E.toAnswerMap(new Array(10).fill(v)));
    Object.values(s).forEach(x => assert.ok(x >= 0 && x <= 100, String(x)));
  }
});

test('sensitivity lists only changes that really flip the recommendation', () => {
  const r = E.evaluate(preset('cvs').answers);
  r.sensitivity.forEach(c => {
    const changed = { ...r.answers, [c.id]: c.to };
    assert.strictEqual(E.recommendId(changed), c.result);
    assert.notStrictEqual(c.result, r.recommendation);
  });
});

test('readiness gaps are reported for low scores only', () => {
  const none = E.evaluate({ ...E.toAnswerMap(preset('blank').answers), data: 4, skills: 4, governance: 4, people: 4 });
  assert.strictEqual(none.gaps.length, 0);
  const some = E.evaluate({ ...E.toAnswerMap(preset('blank').answers), data: 1, governance: 2 });
  assert.deepStrictEqual(some.gaps.map(g => g.id).sort(), ['data', 'governance']);
});
