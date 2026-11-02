/*
 * Transparent scoring for the AI readiness scorecard.
 * Four scores (0-100) come from weighted answers; two safety gates cap the autonomy; the recommendation is
 * the LEAST autonomous option that does the job. Every rule here is shown to the user, nothing is hidden.
 */
(function (root) {
  'use strict';

  const D = root.ReadinessData || (typeof require === 'function' ? require('./readiness-data.js') : null);
  const PRIORITY = ['rules', 'agent', 'assist', 'human'];   // least autonomy that works wins, in this order
  const norm = v => (v - 1) / 4;

  function toAnswerMap(answers) {
    if (Array.isArray(answers)) {
      const m = {};
      D.order.forEach((id, i) => { m[id] = answers[i]; });
      return m;
    }
    return Object.assign({}, answers);
  }

  function scores(a) {
    const n = id => norm(a[id]);
    return {
      rule: 100 * (.5 * n('predict') + .5 * (1 - n('variety'))),                  // suits fixed rules
      agent: 100 * (.6 * n('variety') + .4 * n('volume')),                       // gains from reasoning at scale
      risk: 100 * (.5 * n('impact') + .3 * n('reversible') + .2 * n('accountability')),
      ready: 100 * (.3 * n('data') + .25 * n('skills') + .3 * n('governance') + .15 * n('people'))
    };
  }

  function gates(a, s) {
    const out = [];
    if (a.impact >= 4 && a.reversible >= 4) {
      out.push({ id: 'G1', text: 'A wrong decision is serious and hard to undo, so a person must make the decision.' });
    }
    if (a.accountability >= 5 && s.ready < 60) {
      out.push({ id: 'G2', text: 'Accountability is strict but governance is not mature enough yet, so decisions stay with people.' });
    }
    return out;
  }

  const r0 = n => Math.round(n);

  function evaluateOptions(a, s, g) {
    const capped = g.length > 0;
    const cap = capped ? 'A safety gate caps autonomy at "AI-assisted".' : null;

    const rules = { ok: true, why: [] };
    if (capped) { rules.ok = false; rules.why.push(cap); }
    if (s.rule < 65) { rules.ok = false; rules.why.push(`Rule fit is ${r0(s.rule)}: inputs are too varied or steps too unpredictable for fixed rules.`); }
    if (s.risk >= 75) { rules.ok = false; rules.why.push(`Risk is ${r0(s.risk)}, too high for unattended automation.`); }
    if (rules.ok) rules.why.push(`Rule fit is ${r0(s.rule)} and risk is ${r0(s.risk)}: predictable work with acceptable risk.`);

    const agent = { ok: true, why: [] };
    if (capped) { agent.ok = false; agent.why.push(cap); }
    if (s.agent < 50) { agent.ok = false; agent.why.push(`Agent fit is ${r0(s.agent)}: little gain from reasoning over messy inputs at this volume.`); }
    if (s.ready < 55) { agent.ok = false; agent.why.push(`Readiness is ${r0(s.ready)}; below 55 an agent is not safe to run.`); }
    if (a.governance < 3) { agent.ok = false; agent.why.push('Monitoring and override ability is too weak (needs 3 or more).'); }
    if (s.risk >= 65) { agent.ok = false; agent.why.push(`Risk is ${r0(s.risk)}, too high for an agent even with oversight.`); }
    if (agent.ok) agent.why.push(`Agent fit ${r0(s.agent)}, readiness ${r0(s.ready)} and governance ${a.governance}/5 support bounded autonomy.`);

    const assist = { ok: s.ready >= 30 || s.agent >= 40 || s.rule >= 40, why: [] };
    assist.why.push(assist.ok
      ? 'AI can prepare and suggest while a person keeps the decision.'
      : `Readiness (${r0(s.ready)}) and fit are both low: build data, skills and oversight before adding AI.`);

    const human = { ok: true, why: ['Always available. Best when stakes are high or readiness is low.'] };
    return { rules, agent, assist, human };
  }

  function recommendId(a) {
    const s = scores(a), g = gates(a, s), o = evaluateOptions(a, s, g);
    return PRIORITY.find(id => o[id].ok);
  }

  function sensitivity(a, base) {
    const found = [];
    D.questions.forEach(q => {
      [-1, 1].forEach(delta => {
        const v = a[q.id] + delta;
        if (v < 1 || v > 5) return;
        const changed = Object.assign({}, a, { [q.id]: v });
        const to = recommendId(changed);
        if (to !== base) found.push({ id: q.id, title: q.title, from: a[q.id], to: v, result: to });
      });
    });
    return found;
  }

  function evaluate(answers) {
    const a = toAnswerMap(answers);
    const s = scores(a);
    const g = gates(a, s);
    const opts = evaluateOptions(a, s, g);
    const id = PRIORITY.find(k => opts[k].ok);
    const gaps = ['data', 'skills', 'governance', 'people'].filter(k => a[k] <= 2).map(k => ({ id: k, text: D.gapAdvice[k] }));
    return {
      answers: a, scores: s, gates: g, options: opts, recommendation: id,
      status: PRIORITY.reduce((m, k) => { m[k] = k === id ? 'recommended' : opts[k].ok ? 'possible' : 'not-advised'; return m; }, { human: id === 'human' ? 'recommended' : 'possible' }),
      gaps, sensitivity: sensitivity(a, id)
    };
  }

  const api = { evaluate, scores, gates, recommendId, PRIORITY, toAnswerMap };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReadinessEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
