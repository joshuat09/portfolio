// Run with: node --test demo/jobfinder.test.js
const test = require('node:test');
const assert = require('node:assert');
const E = require('./jobfinder-engine.js');
const D = require('./jobfinder-data.js');

const profile = overrides => Object.assign({}, D.exampleProfile, overrides);

test('scores stay within 0-100 and parts add up to the total', () => {
  E.rank(D.roles, D.exampleProfile, D.defaultWeights).forEach(r => {
    assert.ok(r.total >= 0 && r.total <= 100);
    const sum = r.parts.reduce((n, p) => n + p.points, 0);
    assert.ok(Math.abs(sum - r.total) <= 1, `${r.role.title}: parts ${sum} vs total ${r.total}`);
  });
});

test('a perfect fit scores 100', () => {
  const role = D.roles.find(r => r.id === 'r2');
  const p = profile({ skills: role.skills, locations: ['Edinburgh'], workMode: 'hybrid', minSalary: 30, sectors: ['Technology'], level: 'graduate' });
  assert.strictEqual(E.scoreRole(role, p, D.defaultWeights).total, 100);
});

test('weights are normalised and zero weights fall back to equal', () => {
  const w = E.normaliseWeights({ skills: 2, location: 2, salary: 0, sector: 0, level: 0 });
  assert.strictEqual(w.skills, 50);
  const eq = E.normaliseWeights({ skills: 0, location: 0, salary: 0, sector: 0, level: 0 });
  assert.strictEqual(eq.level, 20);
});

test('salary below the minimum lowers the score, 25% below scores zero', () => {
  const role = { ...D.roles[0], salary: 30 };
  assert.strictEqual(E.scoreRole(role, profile({ minSalary: 30 }), D.defaultWeights).parts[2].score, 1);
  assert.strictEqual(E.scoreRole(role, profile({ minSalary: 40 }), D.defaultWeights).parts[2].score, 0);
  const mid = E.scoreRole(role, profile({ minSalary: 32 }), D.defaultWeights).parts[2].score;
  assert.ok(mid > 0 && mid < 1);
});

test('changing weights can change the ranking', () => {
  const salaryOnly = { skills: 0, location: 0, salary: 100, sector: 0, level: 0 };
  const top = E.rank(D.roles, profile({ minSalary: 36 }), salaryOnly)[0].role;
  assert.strictEqual(top.id, 'r4');
});

test('missing skills are reported', () => {
  const r = E.scoreRole(D.roles.find(r => r.id === 'r3'), profile({ skills: ['Excel'] }), D.defaultWeights);
  assert.deepStrictEqual(r.parts[0].missing, ['SQL', 'Power BI', 'Data analysis']);
});

test('data integrity: skills, sources and ids are consistent', () => {
  const vocab = new Set(D.skills);
  assert.strictEqual(vocab.size, D.skills.length, 'no duplicate skills');
  assert.strictEqual(new Set(D.roles.map(r => r.id)).size, D.roles.length, 'unique role ids');
  D.roles.forEach(r => {
    r.skills.forEach(s => assert.ok(vocab.has(s), `${r.id}: unknown skill ${s}`));
    assert.ok(D.sources[r.source], `${r.id}: unknown source ${r.source}`);
    assert.ok(D.sectors.includes(r.sector) && D.levels.some(l => l.id === r.level), `${r.id}: bad sector/level`);
  });
  D.exampleProfile.skills.forEach(s => assert.ok(vocab.has(s)));
});

test('every role links to an https job-board URL', () => {
  D.roles.forEach(r => {
    const l = D.jobLink(r);
    assert.ok(/^https:\/\//.test(l.href), `${r.id}: ${l.href}`);
    assert.ok(l.label.length > 0);
  });
  assert.strictEqual(D.jobLink(D.roles.find(r => r.id === 'r1')).kind, 'search');
  assert.strictEqual(D.jobLink(D.roles.find(r => r.id === 'r5')).kind, 'home');
});
