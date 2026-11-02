(function () {
  'use strict';
  const E = window.ComplaintEngine, D = window.ComplaintData;
  const section = document.getElementById('complaint-demo');
  if (!E || !D || !section) return;

  const $ = id => document.getElementById(id);
  const input = $('cd-input'), stress = $('cd-stress'), trace = $('cd-trace'), outcome = $('cd-outcome');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON = { ok: '✓', blocked: '✕', info: '•' };
  let runToken = 0;

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  // Preset buttons
  D.scenarios.forEach(s => {
    const b = el('button', 'demo-chip', s.label);
    b.type = 'button';
    b.addEventListener('click', () => { input.value = s.text; run(); });
    $('cd-presets').append(b);
  });

  // Sample order table
  const tbody = $('cd-orders').querySelector('tbody');
  Object.values(D.orders).forEach(o => {
    const tr = el('tr');
    [o.id, o.item, '£' + o.value.toFixed(2), o.status.replace('_', ' ')].forEach(v => tr.append(el('td', null, v)));
    tbody.append(tr);
  });

  function showOutcome(res) {
    const o = res.outcome;
    const badge = $('cd-badge');
    badge.textContent = o.label;
    badge.className = 'demo-badge demo-badge-' + o.type;
    $('cd-summary').textContent = o.summary;
    const list = $('cd-reasons'); list.replaceChildren();
    o.reasons.forEach(r => list.append(el('li', null, r)));
    $('cd-reply').textContent = o.reply;
    outcome.hidden = false;
  }

  function run() {
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const token = ++runToken;
    const res = E.run(text, { stress: stress.checked });
    trace.replaceChildren();
    outcome.hidden = true;

    res.steps.forEach((step, i) => {
      const draw = () => {
        if (token !== runToken) return;
        const li = el('li', 'demo-step demo-step-' + step.status);
        li.append(el('span', 'demo-step-icon', ICON[step.status] || '•'));
        const body = el('div', 'demo-step-body');
        body.append(el('strong', null, step.title));
        if (step.detail) body.append(el('code', null, step.detail));
        li.append(body);
        trace.append(li);
        if (i === res.steps.length - 1) showOutcome(res);
      };
      if (reduceMotion) draw(); else setTimeout(draw, i * 420);
    });
  }

  function reset() {
    runToken++;
    input.value = '';
    stress.checked = false;
    trace.replaceChildren(el('li', 'demo-empty', 'Run the agent to see each step.'));
    outcome.hidden = true;
  }

  $('cd-run').addEventListener('click', run);
  $('cd-reset').addEventListener('click', reset);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });

  // Close the project dialog when its demo link is used
  const dlgLink = $('dialog-demo-link');
  if (dlgLink) dlgLink.addEventListener('click', () => document.getElementById('project-dialog').close());
})();
