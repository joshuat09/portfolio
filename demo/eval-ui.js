(function () {
  'use strict';
  const data = window.EvalData;
  const list = document.getElementById('ev-list');
  if (!data || !list) return;

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'allow', label: 'Allow' },
    { id: 'block', label: 'Block' },
    { id: 'unknown', label: 'Unknown' },
    { id: 'unscored', label: 'Unscored' }
  ];
  const matches = (s, f) => f === 'all' || (f === 'unscored' ? s.correct === null : s.gate === f);
  const STATE_CLASS = { verified: 'ok', missing: 'soft', failed: 'bad', not_found: 'warn', unknown: 'warn', customer_reported: 'warn' };
  const intentById = {};
  data.intents.forEach(i => { intentById[i.id] = i; });

  let selected = data.scenarios[0].id;
  let filter = 'all';

  function buildTiles() {
    const box = $('ev-tiles');
    const s = data.summary;
    [[s.scenarios, 'Scenarios'], [s.correct, 'Correct', 'ok'], [s.incorrect, 'Incorrect', 'bad'], [s.unscored, 'Unscored (unresolved)', 'warn'], [s.unknown, 'Gate unknown']].forEach(([n, label, cls]) => {
      const t = el('div', 'ev-tile' + (cls ? ' ev-tile-' + cls : ''));
      t.append(el('strong', null, String(n)), el('span', null, label));
      box.append(t);
    });
  }

  function buildFilters() {
    const box = $('ev-filters');
    FILTERS.forEach(f => {
      const b = el('button', 'cp-chip', f.label);
      b.type = 'button';
      b.dataset.id = f.id;
      b.setAttribute('aria-pressed', String(f.id === filter));
      b.addEventListener('click', () => {
        filter = f.id;
        box.querySelectorAll('.cp-chip').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.id === filter)));
        renderList();
      });
      box.append(b);
    });
  }

  function renderList() {
    list.replaceChildren();
    data.intents.forEach(intent => {
      const rows = data.scenarios.filter(s => s.intent === intent.id && matches(s, filter));
      if (!rows.length) return;
      const group = el('div', 'ev-group');
      const head = el('div', 'ev-group-head');
      head.append(el('strong', null, intent.title), el('span', null, intent.supportStatus));
      group.append(head);
      rows.forEach(s => {
        const b = el('button', 'ev-row-btn');
        b.type = 'button';
        b.dataset.id = s.id;
        b.setAttribute('aria-pressed', String(s.id === selected));
        b.append(
          el('span', 'ev-mark ev-mark-' + (s.correct === true ? 'ok' : 'none'), s.correct === true ? '✓' : '◌'),
          el('span', 'ev-row-title', s.title),
          el('span', 'ev-gate ev-gate-' + s.gate, s.gate)
        );
        b.addEventListener('click', () => { selected = s.id; renderList(); renderDetail(); });
        group.append(b);
      });
      list.append(group);
    });
  }

  function row(label, value) {
    const r = el('div', 'ev-row');
    r.append(el('span', null, label), el('b', null, value));
    return r;
  }

  function renderDetail() {
    const s = data.scenarios.find(x => x.id === selected);
    const intent = intentById[s.intent];
    const box = $('ev-detail');
    box.replaceChildren();

    box.append(el('h2', 'cp-h', s.title));
    box.append(el('div', 'ev-intent', `${intent.title} · ${intent.supportStatus}`));
    box.append(el('div', 'ev-verdict ev-verdict-' + (s.correct === true ? 'ok' : 'warn'),
      s.correct === true ? '✓ Correct classification' : '◌ Unscored: the contract leaves this unresolved'));
    box.append(el('p', 'ev-explain', s.reason));
    if (s.correct === null && s.gate !== 'unknown') {
      box.append(el('p', 'ev-note', `The gate still decided "${s.gate}" here. Because the contract is silent, this is recorded as a finding rather than a pass or fail.`));
    }

    const cmp = el('div', 'ev-compare');
    const exp = el('div', 'ev-col');
    exp.append(el('div', 'cp-label', 'Expected (contract)'), row('Classification', cap(s.expected)));
    const act = el('div', 'ev-col');
    act.append(el('div', 'cp-label', 'Actual (gate)'), row('Classification', cap(s.actual)), row('Gate', cap(s.gate)));
    cmp.append(exp, act);
    box.append(cmp);

    box.append(el('div', 'cp-label', 'Evidence available to the gate'));
    const ev = el('ul', 'ev-evidence');
    data.categories.forEach(c => {
      const state = s.evidence[c.id] || 'missing';
      const li = el('li');
      li.append(el('span', null, c.title), el('span', 'ev-pill ev-pill-' + (STATE_CLASS[state] || 'soft'), state.replace(/_/g, ' ')));
      ev.append(li);
    });
    box.append(ev);

    if (s.unresolved.length) {
      box.append(el('div', 'cp-label', 'Unresolved conditions'));
      const ul = el('ul', 'ev-bullets');
      s.unresolved.forEach(u => ul.append(el('li', null, u)));
      box.append(ul);
    }
    if (s.issues.length) {
      box.append(el('div', 'cp-label', 'Contract mapping issues'));
      const chips = el('div', 'ev-chips');
      s.issues.forEach(i => chips.append(el('span', null, cap(i))));
      box.append(chips);
    }
  }

  function buildStatics() {
    const lim = $('ev-limits');
    data.limitations.forEach(t => lim.append(el('li', null, t)));
    const iss = $('ev-issues');
    data.inconsistencies.forEach(t => iss.append(el('span', null, t)));
    const states = $('ev-states');
    data.states.forEach((s, i) => { states.append(el('b', null, cap(s.id)), document.createTextNode(': ' + s.meaning + (i < data.states.length - 1 ? ' ' : ''))); });
    const cats = $('ev-cats');
    data.categories.forEach((c, i) => { cats.append(el('b', null, c.title), document.createTextNode(': ' + c.meaning + (i < data.categories.length - 1 ? ' ' : ''))); });
    $('ev-source').textContent = `Source: ${data.source.matrix}, taxonomy ${data.source.taxonomy}, workflow contract ${data.source.contract} v${data.source.contractVersion}. ${data.source.provenance}`;
  }

  buildTiles();
  buildFilters();
  buildStatics();
  renderList();
  renderDetail();
})();
