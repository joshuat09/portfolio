// Run with: node --test demo/leaderboard.test.js
const test = require('node:test');
const assert = require('node:assert');
const E = require('./leaderboard-engine.js');

const model = (name, size, s, extra) => Object.assign({
  name, status: 'ran', size_bytes: size * 1e9, parameter_size: '?', supports_tools: true,
  summary: Object.assign({ model_pass_rate: 0.5, pass_rate: 0.6, outcome_correct_rate: 0.7, format_errors: 0, avg_seconds: 5, tokens_per_second: 50, model_passed: 3, model_case_runs: 7 }, s)
}, extra);

const fixture = () => ({
  schema_version: 1, generated_at: '2026-11-04T00:00:00+00:00', config: { repeats: 3, sample: false, case_count: 10 }, host: { gpu: 'GPU' },
  models: [
    model('small', 1.3, { model_pass_rate: 0.43, avg_seconds: 1.4, format_errors: 9, tokens_per_second: 80 }),
    model('medium', 2.5, { model_pass_rate: 0.86, avg_seconds: 2.6, format_errors: 2 }),
    model('large', 5.2, { model_pass_rate: 1, avg_seconds: 6.1, format_errors: 0, tokens_per_second: 21 }),
    model('slowbad', 5.2, { model_pass_rate: 0.5, avg_seconds: 9, format_errors: 5 }),
    { name: 'nope', status: 'skipped', skip_reason: 'No tool calling.' }
  ]
});

test('prepare separates models that ran from skipped ones and converts sizes', () => {
  const p = E.prepare(fixture());
  assert.strictEqual(p.ran.length, 4);
  assert.deepStrictEqual(p.skipped.map(m => m.name), ['nope']);
  assert.strictEqual(p.ran[0].sizeGB, 1.3);
  assert.strictEqual(p.sample, false);
});

test('rejects data that is not a benchmark report', () => {
  assert.throws(() => E.prepare({}), /not a model benchmark report/);
  assert.throws(() => E.prepare({ schema_version: 2, models: [] }));
  assert.throws(() => E.prepare(null));
});

test('rank orders best first, respecting which direction is better', () => {
  const p = E.prepare(fixture());
  assert.deepStrictEqual(E.rank(p.ran, 'model_pass_rate').map(m => m.name), ['large', 'medium', 'slowbad', 'small']);
  assert.deepStrictEqual(E.rank(p.ran, 'avg_seconds').map(m => m.name), ['small', 'medium', 'large', 'slowbad']);
  assert.deepStrictEqual(E.rank(p.ran, 'format_errors').map(m => m.name), ['large', 'medium', 'slowbad', 'small']);
});

test('missing values rank last instead of breaking the sort', () => {
  const data = fixture();
  data.models[0].summary.tokens_per_second = null;
  const p = E.prepare(data);
  assert.strictEqual(E.rank(p.ran, 'tokens_per_second').pop().name, 'small');
});

test('frontier keeps only models nothing else beats on both accuracy and speed', () => {
  const p = E.prepare(fixture());
  assert.deepStrictEqual(E.frontier(p.ran).map(m => m.name), ['small', 'medium', 'large']);   // slowbad is dominated
});

test('insights are derived from the data', () => {
  const p = E.prepare(fixture());
  const text = E.insights(p).join('\n');
  assert.match(text, /Most accurate: large, passing 100%/);
  assert.match(text, /Fastest: small/);
  assert.match(text, /Smallest model that is good enough .*: medium, at 2\.5 GB/);   // small is below 80%
  assert.match(text, /most malformed responses \(9\)/);
  assert.match(text, /Best trade-offs between speed and accuracy: small, medium, large/);
  assert.doesNotMatch(text, /ran once per model/);                                    // three repeats, so no caveat
});

test('says so plainly when no model is good enough, and warns about single runs', () => {
  const data = fixture();
  data.config.repeats = 1;
  data.models.forEach(m => { if (m.summary) m.summary.model_pass_rate = 0.3; });
  const text = E.insights(E.prepare(data)).join('\n');
  assert.match(text, /No model reached 80%/);
  assert.match(text, /ran once per model/);
});

test('handles a report with only skipped models', () => {
  const p = E.prepare({ schema_version: 1, config: {}, models: [{ name: 'x', status: 'skipped', skip_reason: 'r' }] });
  assert.strictEqual(p.ran.length, 0);
  assert.deepStrictEqual(E.insights(p), []);
  assert.deepStrictEqual(E.frontier(p.ran), []);
});

test('formatting helpers', () => {
  assert.strictEqual(E.pct(0.857), '86%');
  assert.strictEqual(E.pct(null), '-');
  assert.strictEqual(E.secs(2.64), '2.6 s');
  assert.strictEqual(E.secs(12.4), '12 s');
  assert.strictEqual(E.gb(2497293931), 2.5);
});

test('reads a real report produced by the Python script, if one is present', t => {
  const fs = require('fs'), path = require('path');
  const candidates = ['../data/model-benchmark.json', '../data/model-benchmark-sample.json'].map(p => path.join(__dirname, p)).filter(fs.existsSync);
  if (!candidates.length) return t.skip('no report file present');
  const p = E.prepare(JSON.parse(fs.readFileSync(candidates[0], 'utf8')));
  assert.ok(p.ran.length + p.skipped.length > 0);
  p.ran.forEach(m => assert.ok(m.s.case_runs > 0 && Array.isArray(m.cases)));
});
