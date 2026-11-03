// Run with: node --test demo/inject.test.js
global.ComplaintData = require('./complaint-data.js');
const test = require('node:test');
const assert = require('node:assert');
const E = require('./inject-engine.js');

const attack = id => E.ATTACKS.find(a => a.id === id);
const harms = (id, layers) => E.run(attack(id).text, layers).harms;

test('with every defence off, each attack does the harm it was built to do', () => {
  const expected = {
    classic: 'money_moved', roleplay: 'money_moved', obfuscated: 'money_moved', translated: 'money_moved', indirect: 'money_moved',
    pressure: 'promise_made', peek: 'data_leak', lookup: 'data_leak', extract: 'prompt_leak', loop: 'runaway', transfer: 'money_moved'
  };
  E.ATTACKS.forEach(a => assert.deepStrictEqual(harms(a.id, []), [expected[a.id]], a.id));
});

test('with every defence on, no attack does harm', () => {
  E.ATTACKS.forEach(a => assert.deepStrictEqual(harms(a.id, E.ALL), [], a.id));
});

test('the phrase filter catches the classic wording but not obfuscated, translated or indirect versions', () => {
  assert.deepStrictEqual(harms('classic', ['filter']), []);
  assert.deepStrictEqual(harms('roleplay', ['filter']), []);
  ['obfuscated', 'translated', 'indirect'].forEach(id => assert.deepStrictEqual(harms(id, ['filter']), ['money_moved'], id));
});

test('the tool allow-list stops every attack that needs a tool the agent does not have', () => {
  ['classic', 'roleplay', 'obfuscated', 'translated', 'indirect', 'transfer'].forEach(id => assert.deepStrictEqual(harms(id, ['allowlist']), [], id));
  assert.deepStrictEqual(harms('peek', ['allowlist']), ['data_leak']);   // a permitted tool, so the allow-list cannot help
});

test('only the ownership check stops a plain request for someone else\'s record', () => {
  ['peek', 'lookup'].forEach(id => {
    E.LAYERS.forEach(l => assert.strictEqual(harms(id, [l.id]).length === 0, l.id === 'ownership', id + ' with ' + l.id));
  });
});

test('only the reply guard stops the pressure and extraction attacks, and only the limit stops the loop', () => {
  ['pressure', 'extract'].forEach(id => E.LAYERS.forEach(l => assert.strictEqual(harms(id, [l.id]).length === 0, l.id === 'replyguard', id + ' with ' + l.id)));
  E.LAYERS.forEach(l => assert.strictEqual(harms('loop', [l.id]).length === 0, l.id === 'limit', l.id));
});

test('the money transfer is stopped by the ported safety screen before any model call', () => {
  const r = E.run(attack('transfer').text, ['screen']);
  assert.strictEqual(r.stoppedBy, 'screen');
  assert.strictEqual(r.calls, 0);
});

test('a blocked message is escalated to a human and does nothing', () => {
  const r = E.run(attack('classic').text, E.ALL);
  assert.strictEqual(r.outcome.type, 'human');
  assert.deepStrictEqual(r.harms, []);
});

test('an ordinary question about your own order is answered, not blocked', () => {
  const r = E.run('Can you tell me the status of ORD-2001?', E.ALL);
  assert.strictEqual(r.outcome.type, 'reply');
  assert.match(r.outcome.reply, /Desk Lamp/);
  assert.deepStrictEqual(r.harms, []);
});

test('the loop is capped at the real iteration limit when the limit is on', () => {
  assert.strictEqual(E.run(attack('loop').text, ['limit']).calls, 8);
  assert.ok(E.run(attack('loop').text, []).calls > 8);
});

test('coverage reports which single layers stop each attack', () => {
  const c = E.coverage(attack('obfuscated'));
  assert.deepStrictEqual(c.harms, ['money_moved']);
  assert.strictEqual(c.alone.filter, false);
  assert.strictEqual(c.alone.allowlist, true);
  assert.strictEqual(c.allStops, true);
});

test('the layers that guard a unique path are each the only answer to some attack', () => {
  // The screen and the filter overlap with the allow-list on purpose: they stop attacks early, but are not the only answer.
  E.LAYERS.filter(l => ['allowlist', 'ownership', 'replyguard', 'limit'].indexOf(l.id) !== -1).forEach(l => {
    const only = E.ATTACKS.filter(a => { const c = E.coverage(a); return c.alone[l.id] && E.ALL.filter(x => x !== l.id).every(x => !c.alone[x]); });
    assert.ok(only.length > 0, l.id + ' has no attack only it stops');
  });
});
