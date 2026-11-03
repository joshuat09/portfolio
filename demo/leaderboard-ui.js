(function () {
  'use strict';
  const E = window.LeaderboardEngine;
  const content = document.getElementById('lb-content');
  if (!E || !content) return;

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs, text) => { const n = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(k => n.setAttribute(k, attrs[k])); if (text != null) n.textContent = text; return n; };

  const Y_KEYS = ['model_pass_rate', 'pass_rate', 'outcome_correct_rate'];
  const BAR_KEYS = ['model_pass_rate', 'format_errors', 'avg_seconds', 'tokens_per_second', 'sizeGB'];
  const CHECK_NAMES = {
    expected_outcome: 'wrong outcome', required_tools: 'missed a required tool', allowed_tools: 'used a disallowed tool', safety_flags: 'wrong safety flags',
    tool_validation_failures: 'invalid tool call', provider_errors: 'malformed or failed model response', tool_exceptions: 'tool error',
    iteration_limit: 'hit the iteration limit', trace_completeness: 'incomplete trace'
  };

  let data = null;
  let yKey = Y_KEYS[0], barKey = BAR_KEYS[0], selected = null;
  let sortKey = 'model_pass_rate', sortDir = -1;

  const fmt = (key, v) => {
    if (v == null) return '-';
    const unit = E.METRICS[key] && E.METRICS[key].unit;
    if (unit === 'pct') return E.pct(v);
    if (unit === 'sec') return E.secs(v);
    if (unit === 'tps') return Math.round(v) + ' tok/s';
    if (unit === 'gb') return v + ' GB';
    return String(v);
  };

  /* ---------- loading ---------- */
  function dataUrl() {
    const override = new URLSearchParams(location.search).get('data');     // preview your own file in the data/ folder
    return 'data/' + (override && /^[\w-]+\.json$/.test(override) ? override : 'model-benchmark.json');
  }

  function banner(kind, html) {
    const b = $('lb-banner');
    b.className = 'lb-banner' + (kind ? ' lb-' + kind : '');
    b.replaceChildren();
    html.forEach(part => b.append(typeof part === 'string' ? document.createTextNode(part) : part));
    b.hidden = false;
  }

  async function load() {
    let json;
    try {
      const response = await fetch(dataUrl(), { cache: 'no-cache' });
      if (!response.ok) throw new Error('missing');
      json = await response.json();
    } catch (e) {
      banner('', [el('strong', null, 'Results are on the way. '), 'This page fills in automatically once I publish a benchmark run. Meanwhile, the method below shows exactly what will be measured.']);
      return;
    }
    try {
      data = E.prepare(json);
    } catch (e) {
      banner('error', [el('strong', null, 'Could not read the results. '), e.message]);
      return;
    }
    if (!data.ran.length) {
      banner('', [el('strong', null, 'No model finished yet. '), 'Skipped models are listed below.']);
    } else if (data.sample) {
      banner('sample', [el('strong', null, 'SAMPLE DATA. '), 'These are scripted example numbers used to test this page. They are not real measurements of any model.']);
    }
    content.hidden = false;
    selected = data.ran.length ? E.rank(data.ran, 'model_pass_rate')[0].name : null;
    renderAll();
  }

  /* ---------- sections ---------- */
  function renderHost() {
    const h = data.host, box = $('lb-host');
    box.replaceChildren();
    [['GPU', h.gpu], ['CPU', h.cpu], ['RAM', h.ram_gb && h.ram_gb + ' GB'], ['Ollama', h.ollama_version], ['OS', h.os], ['Run', data.generatedAt && data.generatedAt.slice(0, 10)]]
      .filter(x => x[1]).forEach(([k, v]) => { const s = el('span', null, k + ' '); s.append(el('b', null, v)); box.append(s); });
  }

  function renderTiles() {
    const box = $('lb-tiles'); box.replaceChildren();
    const minutes = Math.round(data.ran.reduce((n, m) => n + m.s.total_seconds, 0) / 60);
    [[data.ran.length, 'Models tested'], [data.config.case_count || '-', 'Cases'], [data.config.repeats || 1, 'Runs per case'], [minutes + ' min', 'Total test time']].forEach(([n, l]) => {
      const t = el('div', 'ev-tile'); t.append(el('strong', null, String(n)), el('span', null, l)); box.append(t);
    });
  }

  function renderInsights() {
    const ul = $('lb-insights'); ul.replaceChildren();
    const lines = E.insights(data);
    (lines.length ? lines : ['No model finished, so there is nothing to compare yet.']).forEach(t => ul.append(el('li', null, t)));
  }

  function chips(boxId, keys, current, onPick) {
    const box = $(boxId); box.replaceChildren();
    keys.forEach(k => {
      const b = el('button', 'cp-chip', E.METRICS[k].label); b.type = 'button';
      b.setAttribute('aria-pressed', String(k === current));
      b.addEventListener('click', () => onPick(k));
      box.append(b);
    });
  }

  function renderScatter() {
    chips('lb-ykeys', Y_KEYS, yKey, k => { yKey = k; renderScatter(); });
    const box = $('lb-scatter'); box.replaceChildren();
    if (!data.ran.length) return;
    const W = 760, H = 430, L = 58, R = 30, T = 24, B = 54;
    const maxX = Math.max.apply(null, data.ran.map(m => m.s.avg_seconds || 0)) * 1.2 || 1;
    const maxSize = Math.max.apply(null, data.ran.map(m => m.sizeGB || 1));
    const x = v => L + (v / maxX) * (W - L - R), y = v => T + (1 - v) * (H - T - B);
    const front = E.frontier(data.ran, yKey).map(m => m.name);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Scatter chart of ${E.METRICS[yKey].label} against seconds per case for ${data.ran.length} models` });
    [0, .25, .5, .75, 1].forEach(v => { root.append(svg('line', { class: 'lb-grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }), svg('text', { x: L - 8, y: y(v) + 3, 'text-anchor': 'end' }, Math.round(v * 100) + '%')); });
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) { const v = (maxX / ticks) * i; root.append(svg('text', { x: x(v), y: H - B + 18, 'text-anchor': 'middle' }, (v < 10 ? v.toFixed(1) : Math.round(v)) + 's')); }
    root.append(svg('line', { class: 'lb-axis', x1: L, x2: W - R, y1: H - B, y2: H - B }), svg('line', { class: 'lb-axis', x1: L, x2: L, y1: T, y2: H - B }));
    root.append(svg('text', { x: (L + W - R) / 2, y: H - 10, 'text-anchor': 'middle' }, 'Seconds per case (faster to the left)'));
    root.append(svg('text', { x: 14, y: (T + H - B) / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${(T + H - B) / 2})` }, E.METRICS[yKey].label));

    const fm = data.ran.filter(m => front.indexOf(m.name) !== -1).sort((a, b) => a.s.avg_seconds - b.s.avg_seconds);
    if (fm.length > 1) root.append(svg('polyline', { class: 'lb-front', points: fm.map(m => `${x(m.s.avg_seconds)},${y(m.s[yKey])}`).join(' ') }));

    data.ran.slice().sort((a, b) => (b.sizeGB || 0) - (a.sizeGB || 0)).forEach((m, i) => {
      if (m.s[yKey] == null || m.s.avg_seconds == null) return;
      const r = 9 + 17 * Math.sqrt((m.sizeGB || 1) / maxSize);
      const g = svg('g', { class: 'lb-dot' + (front.indexOf(m.name) !== -1 ? ' on-front' : '') + (m.name === selected ? ' selected' : ''), tabindex: 0, role: 'button',
        'aria-label': `${m.name}: ${fmt(yKey, m.s[yKey])}, ${E.secs(m.s.avg_seconds)} per case, ${m.sizeGB || '?'} GB` });
      g.append(svg('title', {}, `${m.name}\n${fmt(yKey, m.s[yKey])} · ${E.secs(m.s.avg_seconds)} per case · ${m.sizeGB || '?'} GB`));
      const cx = x(m.s.avg_seconds), cy = y(m.s[yKey]);
      g.append(svg('circle', { cx, cy, r }), svg('text', { x: cx, y: cy - r - 6 - (i % 2) * 11, 'text-anchor': cx > W - 120 ? 'end' : 'middle' }, m.name));
      const pick = () => { selected = m.name; renderScatter(); renderDetail(); renderHeat(); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      root.append(g);
    });
    box.append(root);
  }

  function renderDetail() {
    const box = $('lb-detail'); box.replaceChildren();
    const m = data.ran.find(x => x.name === selected);
    if (!m) return;
    box.append(el('h3', null, m.name));
    const s = m.s, dl = el('dl');
    const failed = {};
    (m.cases || []).forEach(c => Object.keys(c.failed_checks).forEach(k => { failed[k] = (failed[k] || 0) + c.failed_checks[k]; }));
    const top = Object.keys(failed).sort((a, b) => failed[b] - failed[a]).slice(0, 3).map(k => `${CHECK_NAMES[k] || k} (${failed[k]})`).join(', ');
    [['Size', [m.sizeGB && m.sizeGB + ' GB', m.parameter_size, m.quantization].filter(Boolean).join(' · ')],
      ['Passed', `${s.passed} of ${s.case_runs} runs (${E.pct(s.pass_rate)})`],
      ['Model-handled', `${s.model_passed} of ${s.model_case_runs} (${E.pct(s.model_pass_rate)})`],
      ['Escalates when it should', s.escalation_recall == null ? '-' : E.pct(s.escalation_recall) + (s.false_escalations ? `, ${s.false_escalations} unneeded` : '')],
      ['Failures', `${s.format_errors} format, ${s.http_errors} HTTP, ${s.timeouts} timeout${s.other_errors ? ', ' + s.other_errors + ' other' : ''}`],
      ['Most common problem', top || 'none'],
      ['Speed', `${E.secs(s.avg_seconds)} per case${s.tokens_per_second ? ', ' + Math.round(s.tokens_per_second) + ' tok/s' : ''}`]
    ].forEach(([k, v]) => dl.append(el('dt', null, k), el('dd', null, v)));
    box.append(dl);
  }

  function renderBars() {
    chips('lb-metrics', BAR_KEYS, barKey, k => { barKey = k; renderBars(); });
    const box = $('lb-bars'); box.replaceChildren();
    const ranked = E.rank(data.ran, barKey);
    const vals = ranked.map(m => m.s[barKey]).filter(v => v != null);
    const max = E.METRICS[barKey].unit === 'pct' ? 1 : Math.max.apply(null, vals.concat([1]));
    ranked.forEach((m, i) => {
      const v = m.s[barKey];
      const row = el('div', 'lb-bar-row' + (i === ranked.length - 1 && ranked.length > 1 ? ' worst' : ''));
      const track = el('div', 'lb-bar-track'), fill = el('i'); fill.style.width = v == null ? '0' : Math.max(2, (v / max) * 100) + '%'; track.append(fill);
      row.append(el('span', 'lb-bar-name', m.name), track, el('span', 'lb-bar-val', fmt(barKey, v)));
      box.append(row);
    });
  }

  function renderTable() {
    const COLS = [['name', 'Model'], ['sizeGB', 'Size'], ['model_pass_rate', 'Pass (model cases)'], ['pass_rate', 'Pass (all)'], ['outcome_correct_rate', 'Outcome ✓'],
      ['escalation_recall', 'Escalates'], ['false_escalations', 'Unneeded esc.'], ['format_errors', 'Format errors'], ['avg_seconds', 'Sec / case'], ['tokens_per_second', 'Tok / s']];
    const table = $('lb-table'); table.replaceChildren();
    const head = el('tr');
    COLS.forEach(([key, label]) => {
      const th = el('th'); th.scope = 'col';
      th.setAttribute('aria-sort', key === sortKey ? (sortDir < 0 ? 'descending' : 'ascending') : 'none');
      const b = el('button', null, label + (key === sortKey ? (sortDir < 0 ? ' ↓' : ' ↑') : '')); b.type = 'button';
      b.addEventListener('click', () => { if (sortKey === key) sortDir = -sortDir; else { sortKey = key; sortDir = key === 'name' ? 1 : -1; } renderTable(); });
      th.append(b); head.append(th);
    });
    const thead = el('thead'); thead.append(head); table.append(thead);
    const rows = data.ran.slice().sort((a, b) => {
      const x = sortKey === 'name' ? a.name : a.s[sortKey], y = sortKey === 'name' ? b.name : b.s[sortKey];
      if (x == null) return 1; if (y == null) return -1;
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sortDir;
    });
    const tbody = el('tbody');
    rows.forEach(m => {
      const tr = el('tr'), s = m.s;
      tr.append(el('td', null, m.name), el('td', null, m.sizeGB ? m.sizeGB + ' GB' : '-'), el('td', null, `${E.pct(s.model_pass_rate)} (${s.model_passed}/${s.model_case_runs})`), el('td', null, E.pct(s.pass_rate)),
        el('td', null, E.pct(s.outcome_correct_rate)), el('td', null, E.pct(s.escalation_recall)), el('td', null, String(s.false_escalations)), el('td', null, String(s.format_errors)),
        el('td', null, E.secs(s.avg_seconds)), el('td', null, s.tokens_per_second ? String(Math.round(s.tokens_per_second)) : '-'));
      tbody.append(tr);
    });
    table.append(tbody);
  }

  function renderHeat() {
    const table = $('lb-heat'); table.replaceChildren();
    const ids = []; data.ran.forEach(m => (m.cases || []).forEach(c => { if (ids.indexOf(c.id) === -1) ids.push(c.id); }));
    const meta = {}; data.ran.forEach(m => (m.cases || []).forEach(c => { meta[c.id] = c; }));
    const head = el('tr'); head.append(el('th', null, 'Model'));
    ids.forEach(id => { const th = el('th', null, id); th.scope = 'col'; th.title = meta[id].category.replace(/_/g, ' '); head.append(th); });
    const thead = el('thead'); thead.append(head); table.append(thead);
    const tbody = el('tbody');
    E.rank(data.ran, 'model_pass_rate').forEach(m => {
      const tr = el('tr'); const th = el('th', null, m.name); th.scope = 'row'; tr.append(th);
      ids.forEach(id => {
        const c = (m.cases || []).find(x => x.id === id), td = el('td');
        if (!c) { td.textContent = '-'; tr.append(td); return; }
        const ratio = c.passed / c.runs, cls = !c.model_called ? 'free' : ratio === 1 ? 'ok' : ratio === 0 ? 'bad' : 'part';
        const b = el('button', 'lb-cell lb-cell-' + cls, `${c.passed}/${c.runs}`); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', `${m.name}, case ${id}: ${c.passed} of ${c.runs} passed` + (!c.model_called ? ', decided by the safety screen' : ''));
        b.addEventListener('click', () => {
          table.querySelectorAll('.lb-cell').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true');
          const fails = Object.keys(c.failed_checks).map(k => `${CHECK_NAMES[k] || k} (${c.failed_checks[k]})`).join(', ');
          const errs = Object.keys(c.provider_errors).map(k => `${c.provider_errors[k]} ${k}`).join(', ');
          $('lb-case-note').textContent = `${m.name} on ${id} (${c.category.replace(/_/g, ' ')}): passed ${c.passed} of ${c.runs}. ` +
            (!c.model_called ? 'Decided by the deterministic safety screen before the model ran. ' : '') + (fails ? `Failed checks: ${fails}. ` : '') + (errs ? `Provider errors: ${errs}. ` : '') + `Average ${E.secs(c.avg_seconds)}.`;
        });
        td.append(b); tr.append(td);
      });
      tbody.append(tr);
    });
    table.append(tbody);
    const legend = $('lb-legend'); legend.replaceChildren();
    ids.forEach(id => legend.append(el('li', null, `${id} ${meta[id].category.replace(/_/g, ' ')}`)));
  }

  function renderSkipped() {
    const card = $('lb-skipped-card'), ul = $('lb-skipped'); ul.replaceChildren();
    card.hidden = !data.skipped.length;
    data.skipped.forEach(m => { const li = el('li'); li.append(el('b', null, m.name + ': '), m.reason); ul.append(li); });
  }

  function renderAll() {
    renderHost(); renderTiles(); renderInsights(); renderSkipped();
    if (!data.ran.length) { ['lb-scatter', 'lb-bars', 'lb-table', 'lb-heat'].forEach(id => $(id).replaceChildren()); return; }
    renderScatter(); renderDetail(); renderBars(); renderTable(); renderHeat();
  }

  load();
})();
