// Run with: node --test demo/engine.test.js
const test = require('node:test');
const assert = require('node:assert');
const Engine = require('./complaint-engine.js');
const Data = require('./complaint-data.js');

const caseOf = id => Data.scenarios.find(s => s.id === id);
const runCase = (id, extra) => {
  const c = caseOf(id);
  return Engine.run(c.text, Object.assign({ requestedAmount: c.requestedAmount }, extra));
};

test('safety screen matches the Python rules for the flagged cases', () => {
  ['C005', 'C006', 'C007'].forEach(id => {
    const c = caseOf(id);
    const r = runCase(id);
    assert.deepStrictEqual(r.state.flags.slice().sort(), c.expectedFlags.slice().sort(), id);
    assert.strictEqual(r.outcome.type, 'human', id);
    assert.strictEqual(r.state.observedTools.length, 0, id + ' must escalate before any tool call');
    assert.strictEqual(r.outcome.record.reasonSource, 'safety_screen');
  });
});

test('high-value flag needs the trusted amount, not the complaint text', () => {
  const noAmount = Engine.run(caseOf('C005').text);
  assert.deepStrictEqual(noAmount.state.flags, []);
  assert.strictEqual(Engine.assessComplaint('hello', { requestedAmount: 100 }).flags[0], 'high_value');
  assert.deepStrictEqual(Engine.assessComplaint('hello', { requestedAmount: 99.99 }).flags, []);
  assert.deepStrictEqual(Engine.assessComplaint('hello', { ambiguous: true, outsidePolicy: true }).flags, ['outside_policy', 'ambiguous']);
});

test('every case uses its required tools and honours the expected escalation', () => {
  Data.scenarios.forEach(c => {
    const r = runCase(c.id);
    c.requiredTools.forEach(t => assert.ok(r.state.observedTools.includes(t), `${c.id} missing ${t}`));
    if (c.expectedEscalation !== 'either') assert.strictEqual(r.outcome.type === 'human', c.expectedEscalation, c.id);
    r.state.observedTools.forEach(t => assert.ok(Engine.toolNames.includes(t), `${c.id} disallowed ${t}`));
  });
});

test('specific outcomes: status answer, not found, missing order number, damaged item', () => {
  assert.match(runCase('C003').outcome.reply, /currently delivered/);
  assert.strictEqual(runCase('C004').outcome.summary, 'The model reported that no matching record was found.');
  assert.strictEqual(runCase('C002').outcome.summary, 'The model asked the customer for missing information.');
  const damaged = runCase('C001').outcome;
  assert.strictEqual(damaged.type, 'human');
  assert.strictEqual(damaged.record.policyId, 'REP-01');
  assert.strictEqual(damaged.record.orderId, '1001');
  assert.strictEqual(damaged.record.customerId, 'CUST-1003');
});

test('tool validation matches _execute_tool', () => {
  const v = (name, args) => { try { Engine.executeTool({ name, arguments: args }); return null; } catch (e) { return e.message; } };
  assert.match(v('issue_refund', {}), /Unknown tool/);
  assert.match(v('get_order', {}), /Invalid arguments/);
  assert.match(v('get_order', { order_id: 'x', extra: 1 }), /Invalid arguments/);
  assert.match(v('list_policies', { a: 1 }), /Invalid arguments/);
  assert.match(v('get_order', { order_id: '  ' }), /non-empty string/);
  assert.strictEqual(v('list_policies', {}), null);
});

test('failure modes always end in human review', () => {
  const unsafe = runCase('C003', { mode: 'unsafe_tool' });
  assert.strictEqual(unsafe.outcome.type, 'human');
  assert.ok(unsafe.state.decisions.includes('invalid_tool_request'));
  const bad = runCase('C003', { mode: 'malformed' });
  assert.ok(bad.state.decisions.includes('provider_or_output_failure'));
  const loop = runCase('C003', { mode: 'never_finishes' });
  assert.ok(loop.state.decisions.includes('iteration_limit'));
  assert.strictEqual(loop.state.iterations, Engine.MAX_ITERATIONS);
  [unsafe, bad, loop].forEach(r => assert.strictEqual(r.outcome.type, 'human'));
});

test('no refund or payment tool exists', () => {
  assert.deepStrictEqual(Engine.toolNames.slice().sort(), ['get_customer', 'get_order', 'get_policy', 'list_policies']);
});
