/*
 * Reads the benchmark report written by scripts/benchmark_models.py and derives everything the
 * leaderboard shows: ranking, the speed-versus-accuracy frontier and plain-English findings.
 * Pure functions with no DOM, so they are tested with node.
 */
(function (root) {
  'use strict';

  const GOOD_ENOUGH = 0.8;           // the "good enough" bar: pass at least 80% of the cases the model handles

  const METRICS = {
    model_pass_rate: { label: 'Pass rate (cases the model handled)', better: 'high', unit: 'pct' },
    pass_rate: { label: 'Pass rate (all cases)', better: 'high', unit: 'pct' },
    outcome_correct_rate: { label: 'Correct outcomes', better: 'high', unit: 'pct' },
    format_errors: { label: 'Format errors', better: 'low', unit: 'count' },
    avg_seconds: { label: 'Seconds per case', better: 'low', unit: 'sec' },
    tokens_per_second: { label: 'Tokens per second', better: 'high', unit: 'tps' },
    sizeGB: { label: 'Model size (GB)', better: 'low', unit: 'gb' }
  };

  const gb = bytes => (bytes ? Math.round(bytes / 1e7) / 100 : null);

  function validate(data) {
    if (!data || typeof data !== 'object' || data.schema_version !== 1 || !Array.isArray(data.models)) {
      throw new Error('This is not a model benchmark report (expected schema_version 1).');
    }
    return data;
  }

  /* Splits models into those that ran and those skipped, and adds derived fields. */
  function prepare(data) {
    validate(data);
    const ran = data.models.filter(m => m.summary).map(m => Object.assign({}, m, {
      sizeGB: gb(m.size_bytes),
      s: Object.assign({}, m.summary, { sizeGB: gb(m.size_bytes) }),
      shortName: m.name
    }));
    const skipped = data.models.filter(m => !m.summary).map(m => ({ name: m.name, status: m.status, reason: m.skip_reason || 'Not run', sizeGB: gb(m.size_bytes), parameter_size: m.parameter_size }));
    return { sample: !!(data.config && data.config.sample), host: data.host || {}, config: data.config || {}, generatedAt: data.generated_at, ran, skipped };
  }

  const value = (model, key) => model.s[key];

  /* Sorts best-first for a metric. Models missing the value go last. */
  function rank(models, key) {
    const info = METRICS[key];
    const sign = info.better === 'high' ? -1 : 1;
    return models.slice().sort((a, b) => {
      const x = value(a, key), y = value(b, key);
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      return sign * (x - y) || a.name.localeCompare(b.name);
    });
  }

  /* Models no other model beats on both accuracy (higher) and speed (lower seconds). */
  function frontier(models, yKey) {
    const key = yKey || 'model_pass_rate';
    const usable = models.filter(m => value(m, key) != null && value(m, 'avg_seconds') != null);
    return usable.filter(m => !usable.some(o => o !== m &&
      value(o, key) >= value(m, key) && value(o, 'avg_seconds') <= value(m, 'avg_seconds') &&
      (value(o, key) > value(m, key) || value(o, 'avg_seconds') < value(m, 'avg_seconds'))))
      .sort((a, b) => value(a, 'avg_seconds') - value(b, 'avg_seconds'));
  }

  const pct = v => (v == null ? '-' : Math.round(v * 100) + '%');
  const secs = v => (v == null ? '-' : (v < 10 ? v.toFixed(1) : Math.round(v)) + ' s');

  /* Plain-English findings, all computed from the data so they can never drift from it. */
  function insights(prepared) {
    const { ran, config } = prepared;
    if (!ran.length) return [];
    const out = [];
    const accurate = rank(ran, 'model_pass_rate').sort((a, b) =>
      (value(b, 'model_pass_rate') - value(a, 'model_pass_rate')) || (value(a, 'format_errors') - value(b, 'format_errors')) || (value(a, 'avg_seconds') - value(b, 'avg_seconds')));
    const best = accurate[0];
    out.push(`Most accurate: ${best.name}, passing ${pct(value(best, 'model_pass_rate'))} of the cases it handled (${value(best, 'model_passed')} of ${value(best, 'model_case_runs')}).`);
    const fastest = rank(ran, 'avg_seconds')[0];
    out.push(`Fastest: ${fastest.name} at ${secs(value(fastest, 'avg_seconds'))} per case${value(fastest, 'tokens_per_second') ? ` (${Math.round(value(fastest, 'tokens_per_second'))} tokens per second)` : ''}.`);
    const goodEnough = ran.filter(m => value(m, 'model_pass_rate') != null && value(m, 'model_pass_rate') >= GOOD_ENOUGH && m.sizeGB != null).sort((a, b) => a.sizeGB - b.sizeGB)[0];
    out.push(goodEnough
      ? `Smallest model that is good enough (at least ${GOOD_ENOUGH * 100}% on the cases it handles): ${goodEnough.name}, at ${goodEnough.sizeGB} GB.`
      : `No model reached ${GOOD_ENOUGH * 100}% on the cases it handles, so none is good enough yet for this agent.`);
    const messy = rank(ran, 'format_errors').reverse()[0];
    if (value(messy, 'format_errors') > 0) {
      out.push(`${messy.name} produced the most malformed responses (${value(messy, 'format_errors')}), which the agent safely turned into human escalations.`);
    }
    const onFrontier = frontier(ran);
    if (onFrontier.length > 1) out.push(`Best trade-offs between speed and accuracy: ${onFrontier.map(m => m.name).join(', ')}.`);
    if (config.repeats === 1) out.push('Each case ran once per model, so treat close results as ties.');
    return out;
  }

  const api = { METRICS, GOOD_ENOUGH, validate, prepare, rank, frontier, insights, pct, secs, gb };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LeaderboardEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
