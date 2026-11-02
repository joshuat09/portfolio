// Run with: node --test demo/engine.test.js
const test = require('node:test');
const assert = require('node:assert');
const Engine = require('./complaint-engine.js');
const Data = require('./complaint-data.js');

const outcomeOf = (id, opts) => Engine.run(Data.scenarios.find(s => s.id === id).text, opts).outcome.type;
const has = (res, kind, status) => res.steps.some(s => s.kind === kind && s.status === status);

test('each preset reaches the expected outcome', () => {
  assert.strictEqual(outcomeOf('late'), 'resolve');
  assert.strictEqual(outcomeOf('damaged'), 'resolve');
  assert.strictEqual(outcomeOf('highvalue'), 'human');
  assert.strictEqual(outcomeOf('vague'), 'more_info');
  assert.strictEqual(outcomeOf('unknown'), 'more_info');
  assert.strictEqual(outcomeOf('legal'), 'human');
  assert.strictEqual(outcomeOf('vulnerable'), 'human');
  assert.strictEqual(outcomeOf('refund'), 'human');
});

test('safety gate blocks legal and high-value resolutions', () => {
  const legal = Engine.run(Data.scenarios.find(s => s.id === 'legal').text);
  assert.ok(has(legal, 'gate', 'blocked'));
  const high = Engine.run(Data.scenarios.find(s => s.id === 'highvalue').text);
  assert.ok(high.steps.some(s => /G4/.test(s.title)));
});

test('stress test: unknown tool is rejected by the registry and the outcome is unchanged', () => {
  const base = outcomeOf('late');
  const res = Engine.run(Data.scenarios.find(s => s.id === 'late').text, { stress: true });
  assert.ok(has(res, 'registry', 'blocked'));
  assert.strictEqual(res.outcome.type, base);
});

test('registry validation', () => {
  assert.strictEqual(Engine.validateCall({ name: 'issue_refund', args: {} }).ok, false);
  assert.strictEqual(Engine.validateCall({ name: 'lookup_order', args: { order_id: 5 } }).ok, false);
  assert.strictEqual(Engine.validateCall({ name: 'lookup_order', args: { order_id: 'ORD-1001', x: 1 } }).ok, false);
  assert.strictEqual(Engine.validateCall({ name: 'lookup_order', args: { order_id: 'ORD-1001' } }).ok, true);
});

test('never exceeds the call limit and no refund tool exists', () => {
  assert.ok(!Engine.toolNames.some(n => /refund/.test(n)));
  Data.scenarios.forEach(s => {
    const res = Engine.run(s.text, { stress: true });
    assert.ok(res.steps.filter(x => x.kind === 'propose').length <= Engine.MAX_CALLS);
  });
});
