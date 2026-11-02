/*
 * Transparent role-match scoring. Every point in the 0-100 score is traceable to a named
 * component, a weight and a plain-English reason. No AI model, no network.
 */
(function (root) {
  'use strict';

  const D = root.JobFinderData || (typeof require === 'function' ? require('./jobfinder-data.js') : null);
  const LEVEL_ORDER = D.levels.map(l => l.id);
  const COMPONENTS = [
    { key: 'skills', label: 'Skills' },
    { key: 'location', label: 'Location & work mode' },
    { key: 'salary', label: 'Salary' },
    { key: 'sector', label: 'Sector interest' },
    { key: 'level', label: 'Experience level' }
  ];

  function normaliseWeights(w) {
    const clean = {};
    let sum = 0;
    COMPONENTS.forEach(c => { clean[c.key] = Math.max(0, Number(w[c.key]) || 0); sum += clean[c.key]; });
    const out = {};
    COMPONENTS.forEach(c => { out[c.key] = sum ? clean[c.key] / sum * 100 : 100 / COMPONENTS.length; });
    return out;
  }

  const scorers = {
    skills(role, p) {
      const have = new Set(p.skills);
      const matched = role.skills.filter(s => have.has(s));
      const missing = role.skills.filter(s => !have.has(s));
      return { score: matched.length / role.skills.length, reason: `${matched.length} of ${role.skills.length} required skills`, matched, missing };
    },
    location(role, p) {
      const remote = role.mode === 'remote';
      const locScore = remote || p.locations.indexOf(role.location) !== -1 ? 1 : 0;
      let modeScore;
      if (p.workMode === 'any' || p.workMode === role.mode) modeScore = 1;
      else if (role.mode === 'hybrid' || p.workMode === 'hybrid') modeScore = 0.5;
      else modeScore = 0;
      const where = remote ? 'Remote role, so location is not a constraint' : `${role.location} is ${locScore ? 'a preferred' : 'not a preferred'} location`;
      const how = modeScore === 1 ? `${role.mode} matches your preference` : modeScore === 0.5 ? `${role.mode} is a partial match for ${p.workMode}` : `${role.mode} conflicts with ${p.workMode}`;
      return { score: 0.6 * locScore + 0.4 * modeScore, reason: `${where}; ${how}` };
    },
    salary(role, p) {
      const min = p.minSalary;
      if (role.salary >= min) return { score: 1, reason: `£${role.salary}k meets your £${min}k minimum` };
      const score = Math.max(0, 1 - (min - role.salary) / (min * 0.25));
      return { score, reason: `£${role.salary}k is £${min - role.salary}k below your £${min}k minimum` };
    },
    sector(role, p) {
      if (!p.sectors.length) return { score: 0.5, reason: 'No sector preference set (neutral)' };
      const hit = p.sectors.indexOf(role.sector) !== -1;
      return { score: hit ? 1 : 0, reason: `${role.sector} ${hit ? 'is' : 'is not'} one of your chosen sectors` };
    },
    level(role, p) {
      const diff = Math.abs(LEVEL_ORDER.indexOf(role.level) - LEVEL_ORDER.indexOf(p.level));
      return { score: [1, 0.5, 0][diff], reason: diff === 0 ? 'Level matches' : diff === 1 ? 'One level away from your target' : 'Two levels away from your target' };
    }
  };

  const band = total => total >= 80 ? 'Strong match' : total >= 60 ? 'Good match' : total >= 40 ? 'Partial match' : 'Weak match';
  const round1 = n => Math.round(n * 10) / 10;

  function scoreRole(role, profile, weights) {
    const w = normaliseWeights(weights);
    const parts = COMPONENTS.map(c => {
      const r = scorers[c.key](role, profile);
      return Object.assign({ key: c.key, label: c.label, weight: round1(w[c.key]), points: round1(r.score * w[c.key]), max: round1(w[c.key]) }, r);
    });
    const total = Math.round(COMPONENTS.reduce((n, c, i) => n + parts[i].score * w[c.key], 0));
    return { role, total, band: band(total), parts };
  }

  function rank(roles, profile, weights) {
    return roles.map(r => scoreRole(r, profile, weights)).sort((a, b) => b.total - a.total || a.role.title.localeCompare(b.role.title));
  }

  const api = { scoreRole, rank, normaliseWeights, band, COMPONENTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JobFinderEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
