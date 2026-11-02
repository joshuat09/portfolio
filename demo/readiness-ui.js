(function () {
  'use strict';
  const D = window.ReadinessData, E = window.ReadinessEngine;
  const box = document.getElementById('rd-questions');
  if (!D || !E || !box) return;

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  const STATUS = { recommended: 'RECOMMENDED', possible: 'POSSIBLE', 'not-advised': 'NOT ADVISED' };
  const METERS = [
    { key: 'rule', label: 'Rule fit', hint: 'How well the work suits fixed rules', bad: false },
    { key: 'agent', label: 'Agent fit', hint: 'How much reasoning over messy input would help', bad: false },
    { key: 'risk', label: 'Risk', hint: 'Impact, irreversibility and accountability', bad: true },
    { key: 'ready', label: 'Readiness', hint: 'Data, skills, governance and people', bad: false }
  ];

  let answers = D.presets[0].answers.slice();
  let activePreset = D.presets[0].id;

  /* ---------- build the form ---------- */
  const sliders = {};
  D.groups.forEach(g => {
    const section = el('section', 'rd-group');
    section.append(el('h3', null, g.title), el('div', 'rd-lens', g.lens));
    D.questions.filter(q => q.group === g.id).forEach(q => {
      const wrap = el('div', 'rd-q');
      const head = el('div', 'rd-q-head');
      const label = el('label', null, q.title); label.htmlFor = 'rd-' + q.id;
      const out = el('output', null, '3'); out.id = 'rd-out-' + q.id;
      head.append(label, out);
      const input = el('input'); input.type = 'range'; input.min = 1; input.max = 5; input.step = 1; input.id = 'rd-' + q.id; input.value = 3;
      input.setAttribute('aria-valuetext', '3 of 5');
      input.addEventListener('input', () => { activePreset = null; syncPresets(); read(); update(); });
      const ends = el('div', 'rd-ends'); ends.append(el('span', null, q.low), el('span', null, q.high));
      wrap.append(head, input, ends);
      section.append(wrap);
      sliders[q.id] = input;
    });
    box.append(section);
  });

  const presetBox = $('rd-presets');
  D.presets.forEach(p => {
    const b = el('button', 'cp-chip', p.label);
    b.type = 'button'; b.dataset.id = p.id;
    b.addEventListener('click', () => applyPreset(p));
    presetBox.append(b);
  });

  function syncPresets() {
    presetBox.querySelectorAll('.cp-chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === activePreset)));
  }
  function write() {
    D.order.forEach((id, i) => { sliders[id].value = answers[i]; $('rd-out-' + id).textContent = answers[i]; sliders[id].setAttribute('aria-valuetext', answers[i] + ' of 5'); });
  }
  function read() {
    answers = D.order.map(id => Number(sliders[id].value));
    D.order.forEach((id, i) => { $('rd-out-' + id).textContent = answers[i]; sliders[id].setAttribute('aria-valuetext', answers[i] + ' of 5'); });
  }
  function applyPreset(p) {
    activePreset = p.id; answers = p.answers.slice(); $('rd-name').value = p.name; write(); syncPresets(); update();
  }

  /* ---------- render the result ---------- */
  function render(r) {
    const opt = D.options[r.recommendation];
    $('rd-for').textContent = $('rd-name').value.trim() ? 'FOR: ' + $('rd-name').value.trim().toUpperCase() : 'RECOMMENDATION';
    const badge = $('rd-badge');
    badge.textContent = 'LEAST AUTONOMY THAT WORKS';
    badge.className = 'rd-badge rd-badge-' + r.recommendation;
    $('rd-title').textContent = opt.title;
    $('rd-summary').textContent = opt.summary;

    const gates = $('rd-gates'); gates.replaceChildren();
    r.gates.forEach(g => { const li = el('li', null, g.text); gates.append(li); });
    gates.hidden = r.gates.length === 0;

    const opts = $('rd-options'); opts.replaceChildren();
    ['human', 'assist', 'rules', 'agent'].forEach(id => {
      const status = id === r.recommendation ? 'recommended' : r.options[id].ok ? 'possible' : 'not-advised';
      const tile = el('div', 'rd-opt rd-opt-' + status);
      tile.append(el('span', 'rd-opt-status', STATUS[status]), el('strong', null, D.options[id].title), el('p', null, r.options[id].why[0]));
      opts.append(tile);
    });

    const meters = $('rd-meters'); meters.replaceChildren();
    METERS.forEach(m => {
      const v = Math.round(r.scores[m.key]);
      const row = el('div', 'rd-meter');
      const top = el('div', 'rd-meter-top'); top.append(el('span', null, m.label), el('b', null, v + ' / 100'));
      const bar = el('div', 'rd-bar'); const fill = el('i', m.bad ? 'rd-fill-risk' : ''); fill.style.width = v + '%'; bar.append(fill);
      row.append(top, bar, el('div', 'rd-hint', m.hint));
      meters.append(row);
    });

    const fill = (id, items, empty) => {
      const ul = $(id); ul.replaceChildren();
      (items.length ? items : [empty]).forEach(t => ul.append(el('li', null, t)));
    };
    fill('rd-guardrails', opt.guardrails, 'No guardrails needed.');
    fill('rd-gaps', r.gaps.map(g => g.text), 'No major readiness gaps: every readiness answer is 3 or higher.');
    fill('rd-flips', r.sensitivity.slice(0, 5).map(c => `Moving "${c.title}" from ${c.from} to ${c.to} would change the answer to "${D.options[c.result].title}".`),
      'This answer is stable: no single one-step change to an answer would alter it.');
    $('rd-demo').hidden = r.recommendation !== 'agent';
  }

  function update() {
    render(E.evaluate(answers));
    try {
      const q = new URLSearchParams();
      q.set('a', answers.join(''));
      if ($('rd-name').value.trim()) q.set('n', $('rd-name').value.trim());
      history.replaceState(null, '', '?' + q.toString());
    } catch (e) { /* sharing the link is optional */ }
  }

  /* ---------- controls ---------- */
  $('rd-name').addEventListener('input', update);
  $('rd-reset').addEventListener('click', () => applyPreset(D.presets[D.presets.length - 1]));
  $('rd-share').addEventListener('click', async () => {
    const btn = $('rd-share'), url = location.href;
    try { await navigator.clipboard.writeText(url); btn.textContent = 'Link copied'; }
    catch (e) { try { window.prompt('Copy this link:', url); } catch (err) { btn.textContent = 'Copy failed'; } }
    setTimeout(() => { btn.textContent = 'Copy link to this scorecard'; }, 1800);
  });

  // Start from a shared link (?a=3541...&n=name) if present, otherwise the first example.
  const params = new URLSearchParams(location.search);
  const shared = params.get('a');
  if (shared && /^[1-5]{10}$/.test(shared)) {
    answers = shared.split('').map(Number); activePreset = null;
    $('rd-name').value = (params.get('n') || '').slice(0, 60);
    write(); syncPresets(); update();
  } else {
    applyPreset(D.presets[0]);
  }
})();
