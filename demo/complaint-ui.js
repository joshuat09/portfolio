(function () {
  'use strict';
  const E = window.ComplaintEngine, D = window.ComplaintData;
  const input = document.getElementById('cd-input');
  if (!E || !D || !input) return;

  const $ = id => document.getElementById(id);
  const trace = $('cd-trace'), outcome = $('cd-outcome'), presets = $('cd-presets');
  const amount = $('cd-amount'), ambiguous = $('cd-ambiguous'), outside = $('cd-outside'), mode = $('cd-mode');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ICON = { ok: '✓', blocked: '✕', info: '•' };
  const EMPTY = 'Choose a case and run the agent to see each step.';
  let runToken = 0;

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  D.scenarios.forEach(s => {
    const b = el('button', 'cp-chip', `${s.id} · ${s.label}`);
    b.type = 'button';
    b.dataset.id = s.id;
    b.addEventListener('click', () => choose(s));
    presets.append(b);
  });

  D.modes.forEach(m => { const o = el('option', null, m.label); o.value = m.id; mode.append(o); });

  const fill = (tbody, rows) => rows.forEach(cells => {
    const tr = el('tr');
    cells.forEach(v => tr.append(el('td', null, v)));
    tbody.append(tr);
  });
  fill($('cd-orders').querySelector('tbody'), Object.values(D.orders).map(o => [o.order_id, o.customer_id, o.item, '£' + o.amount.toFixed(2), o.status.replace('_', ' ')]));
  fill($('cd-policies').querySelector('tbody'), Object.values(D.policies).map(p => [p.policy_id, p.topic]));

  function choose(s) {
    input.value = s.text;
    amount.value = s.requestedAmount != null ? s.requestedAmount : '';
    ambiguous.checked = false;
    outside.checked = false;
    presets.querySelectorAll('.cp-chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === s.id)));
    run();
  }

  function recordText(r) {
    const lines = [
      `status: ${r.status}`,
      `reason: ${r.reason}`,
      `reason source: ${r.reasonSource}`,
      `customer: ${r.customerId || 'unresolved'}   order: ${r.orderId || 'unresolved'}   policy: ${r.policyId || 'unresolved'}`,
      `safety flags: ${r.safetyFlags.length ? r.safetyFlags.join(', ') : 'none'}`,
      `raised at model call: ${r.iteration}`,
      'evidence:'
    ];
    r.evidence.forEach(e => lines.push(`  ${e.verified ? '[verified]  ' : '[unverified]'} ${e.label}`));
    return lines.join('\n');
  }

  function showOutcome(res) {
    const o = res.outcome;
    const badge = $('cd-badge');
    badge.textContent = o.label;
    badge.className = 'cp-badge cp-badge-' + (o.type === 'final' ? 'resolve' : 'human');
    $('cd-summary').textContent = o.summary;
    const list = $('cd-reasons'); list.replaceChildren();
    o.reasons.forEach(r => list.append(el('li', null, r)));
    $('cd-detail-label').textContent = o.type === 'final' ? "Model's final response" : 'Escalation record for the human reviewer';
    $('cd-reply').textContent = o.type === 'final' ? o.reply : recordText(o.record);
    outcome.hidden = false;
  }

  function run() {
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const token = ++runToken;
    const res = E.run(text, {
      requestedAmount: amount.value === '' ? null : Number(amount.value),
      ambiguous: ambiguous.checked,
      outsidePolicy: outside.checked,
      mode: mode.value
    });
    trace.replaceChildren();
    outcome.hidden = true;

    res.steps.forEach((step, i) => {
      const draw = () => {
        if (token !== runToken) return;
        const li = el('li', 'cp-step cp-step-' + step.status);
        if (step.kind === 'model' || step.kind === 'tool') li.dataset.tech = '';
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
    amount.value = '';
    ambiguous.checked = false;
    outside.checked = false;
    mode.value = 'normal';
    presets.querySelectorAll('.cp-chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
    trace.replaceChildren(el('li', 'cp-empty', EMPTY));
    outcome.hidden = true;
  }

  $('cd-run').addEventListener('click', run);
  $('cd-reset').addEventListener('click', reset);
  $('cd-tech').addEventListener('change', e => trace.classList.toggle('cp-show-tech', e.target.checked));
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); });

  // Deep link from the portfolio / palette: complaints.html?example=C001
  const wanted = new URLSearchParams(location.search).get('example');
  const match = D.scenarios.find(s => s.id === wanted);
  if (match) choose(match);
})();
