(function () {
  'use strict';
  const E = window.ComplaintEngine, D = window.ComplaintData;
  const input = document.getElementById('cd-input');
  if (!E || !D || !input) return;

  const $ = id => document.getElementById(id);
  const stress = $('cd-stress'), trace = $('cd-trace'), outcome = $('cd-outcome'), presets = $('cd-presets');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON = { ok: '✓', blocked: '✕', info: '•' };
  const EMPTY = 'Choose an example and run the agent to see each step.';
  let runToken = 0;

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  D.scenarios.forEach(s => {
    const b = el('button', 'cp-chip', s.label);
    b.type = 'button';
    b.dataset.id = s.id;
    b.addEventListener('click', () => choose(s));
    presets.append(b);
  });

  const tbody = $('cd-orders').querySelector('tbody');
  Object.values(D.orders).forEach(o => {
    const tr = el('tr');
    [o.id, o.item, '£' + o.value.toFixed(2), o.status.replace('_', ' ')].forEach(v => tr.append(el('td', null, v)));
    tbody.append(tr);
  });

  function choose(s) {
    input.value = s.text;
    presets.querySelectorAll('.cp-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === s.id)));
    run();
  }

  function showOutcome(res) {
    const o = res.outcome;
    const badge = $('cd-badge');
    badge.textContent = o.label;
    badge.className = 'cp-badge cp-badge-' + o.type;
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
        const li = el('li', 'cp-step cp-step-' + step.status);
        if (step.kind === 'propose' || step.kind === 'tool') li.dataset.tech = '';
        li.append(el('span', 'cp-step-icon', ICON[step.status] || '•'));
        li.append(el('strong', null, step.title));
        if (step.detail) li.append(el('code', null, step.detail));
        trace.append(li);
        if (i === res.steps.length - 1) showOutcome(res);
      };
      if (reduceMotion) draw(); else setTimeout(draw, i * 380);
    });
  }

  function reset() {
    runToken++;
    input.value = '';
    stress.checked = false;
    presets.querySelectorAll('.cp-chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
    trace.replaceChildren(el('li', 'cp-empty', EMPTY));
    outcome.hidden = true;
  }

  $('cd-run').addEventListener('click', run);
  $('cd-reset').addEventListener('click', reset);
  $('cd-tech').addEventListener('change', e => trace.classList.toggle('cp-show-tech', e.target.checked));
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });

  // Theme toggle (shares the saved preference with the portfolio home page)
  const themeToggle = $('theme-toggle');
  const applyTheme = on => {
    document.body.classList.toggle('dark-mode', on);
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-pressed', String(on));
    themeToggle.setAttribute('aria-label', on ? 'Switch to light mode' : 'Switch to dark mode');
    themeToggle.innerHTML = on ? '☀ <span>Light mode</span>' : '◐ <span>Dark mode</span>';
  };
  try { applyTheme(localStorage.getItem('portfolio-theme') === 'dark'); } catch (e) {}
  if (themeToggle) themeToggle.addEventListener('click', () => {
    const on = !document.body.classList.contains('dark-mode');
    applyTheme(on);
    try { localStorage.setItem('portfolio-theme', on ? 'dark' : 'light'); } catch (e) {}
  });

  // Deep link from the portfolio / palette: complaints.html?example=legal
  const wanted = new URLSearchParams(location.search).get('example');
  const match = D.scenarios.find(s => s.id === wanted);
  if (match) choose(match);
})();
