(function () {
  'use strict';
  const Ev = window.EvalEngine;
  const matrix = document.getElementById('ev-matrix');
  if (!Ev || !matrix) return;

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  const CLASSES = [
    { id: 'match', label: 'Match', icon: '✓' },
    { id: 'safe', label: 'Safe divergence', icon: '≈' },
    { id: 'over', label: 'Over-cautious', icon: '!' },
    { id: 'unsafe', label: 'Unsafe', icon: '✕' }
  ];
  const clsInfo = id => CLASSES.find(c => c.id === id);
  const ICON = { ok: '✓', blocked: '✕', info: '•' };
  const OUTCOME_LABEL = { resolve: 'RESOLVE', human: 'HUMAN REVIEW', more_info: 'MORE INFO' };
  const EXPECT_LABEL = { supported: 'Supported', blocked: 'Blocked', unresolved: 'Unresolved' };
  const GATE_LABEL = { allow: 'Allow', block: 'Block', unknown: 'Unknown' };

  const result = Ev.evaluate();
  const byId = {};
  result.cases.forEach(c => { byId[c.id] = c; });
  let selected = result.cases[0].id;
  let highlight = 'all';
  let showTech = false;

  function buildTiles() {
    const box = $('ev-tiles');
    box.replaceChildren();
    const tile = (num, label, cls) => {
      const t = el('div', 'ev-tile' + (cls ? ' ev-tile-' + cls : ''));
      t.append(el('strong', null, String(num)), el('span', null, label));
      box.append(t);
    };
    tile(result.summary.total, 'Scenarios run');
    CLASSES.forEach(c => tile(result.summary[c.id], c.label, c.id));
  }

  function buildFilters() {
    const box = $('ev-filters');
    box.replaceChildren();
    [{ id: 'all', label: 'All' }].concat(CLASSES).forEach(c => {
      const b = el('button', 'cp-chip', c.label);
      b.type = 'button';
      b.dataset.id = c.id;
      b.setAttribute('aria-pressed', String(c.id === highlight));
      b.addEventListener('click', () => {
        highlight = c.id;
        box.querySelectorAll('.cp-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.id === highlight)));
        applyHighlight();
      });
      box.append(b);
    });
  }

  function buildMatrix() {
    matrix.replaceChildren();
    const head = el('tr');
    head.append(el('th', null, ''));
    Ev.CONDITIONS.forEach(c => { const th = el('th', null, c.label); th.scope = 'col'; head.append(th); });
    matrix.append(head);
    Ev.INTENTS.forEach(i => {
      const tr = el('tr');
      const th = el('th', null, i.label); th.scope = 'row'; tr.append(th);
      Ev.CONDITIONS.forEach(cond => {
        const c = byId[`${i.id}:${cond.id}`];
        const td = el('td');
        const b = el('button', 'ev-cell ev-cell-' + c.cls);
        b.type = 'button';
        b.dataset.id = c.id;
        b.dataset.cls = c.cls;
        b.setAttribute('aria-label', `${i.label}, ${cond.label}: ${clsInfo(c.cls).label}. Expected ${c.expected}, got ${OUTCOME_LABEL[c.actualOutcome]}.`);
        b.append(el('span', 'ev-cell-icon', clsInfo(c.cls).icon), el('span', 'ev-cell-text', OUTCOME_LABEL[c.actualOutcome].replace(' REVIEW', '')));
        b.addEventListener('click', () => select(c.id));
        td.append(b);
        tr.append(td);
      });
      matrix.append(tr);
    });
    $('ev-legend').textContent = 'Each cell shows the actual outcome. Colour and symbol show how it reconciles with the contract: ✓ match, ≈ safe divergence, ! over-cautious, ✕ unsafe.';
  }

  function applyHighlight() {
    matrix.querySelectorAll('.ev-cell').forEach(b => b.classList.toggle('ev-dim', highlight !== 'all' && b.dataset.cls !== highlight));
  }

  function row(label, value, cls) {
    const r = el('div', 'ev-row');
    r.append(el('span', null, label), el('b', cls || null, value));
    return r;
  }

  function renderDetail() {
    const c = byId[selected];
    const box = $('ev-detail');
    box.replaceChildren();
    matrix.querySelectorAll('.ev-cell').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === selected)));

    const intent = Ev.INTENTS.find(i => i.id === c.intent).label;
    const cond = Ev.CONDITIONS.find(x => x.id === c.condition).label;
    box.append(el('h2', 'cp-h', `${intent} · ${cond}`));

    const badge = el('div', 'ev-class ev-class-' + c.cls, `${clsInfo(c.cls).icon} ${clsInfo(c.cls).label}`);
    box.append(badge);
    box.append(el('p', 'ev-explain', c.explanation));

    box.append(el('div', 'cp-label', 'Complaint'));
    box.append(el('blockquote', 'ev-quote', c.text));

    const cmp = el('div', 'ev-compare');
    const exp = el('div', 'ev-col');
    exp.append(el('div', 'cp-label', 'Expected (contract)'), row('Outcome', EXPECT_LABEL[c.expected]), row('Gate', GATE_LABEL[c.expectedGate]));
    const act = el('div', 'ev-col');
    act.append(el('div', 'cp-label', 'Actual (agent)'), row('Outcome', OUTCOME_LABEL[c.actualOutcome]), row('Gate', GATE_LABEL[c.actualGate], c.actualGate !== c.expectedGate ? 'ev-diff' : null));
    cmp.append(exp, act);
    box.append(cmp);

    const head = el('div', 'cp-trace-head');
    head.append(el('div', 'cp-label', 'Agent trace'));
    const tech = el('label', 'cp-check cp-tech');
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = showTech;
    cb.addEventListener('change', () => { showTech = cb.checked; trace.classList.toggle('cp-show-tech', showTech); });
    tech.append(cb, document.createTextNode(' Technical details'));
    head.append(tech);
    box.append(head);

    const trace = el('ol', 'cp-trace' + (showTech ? ' cp-show-tech' : ''));
    c.steps.forEach(s => {
      const li = el('li', 'cp-step cp-step-' + s.status);
      if (s.kind === 'propose' || s.kind === 'tool') li.dataset.tech = '';
      li.append(el('span', 'cp-step-icon', ICON[s.status] || '•'), el('strong', null, s.title));
      if (s.detail) li.append(el('code', null, s.detail));
      trace.append(li);
    });
    box.append(trace);
  }

  function select(id) { selected = id; renderDetail(); }

  function buildInvariants() {
    const ul = $('ev-invariants');
    ul.replaceChildren();
    result.invariants.forEach(i => {
      const li = el('li', 'ev-inv ' + (i.pass ? 'ev-inv-pass' : 'ev-inv-fail'));
      li.append(el('span', 'ev-inv-badge', i.pass ? '✓ PASS' : '✕ FAIL'), el('span', null, `${i.id} · ${i.label}`));
      ul.append(li);
    });
  }

  buildTiles();
  buildFilters();
  buildMatrix();
  buildInvariants();
  renderDetail();
})();
