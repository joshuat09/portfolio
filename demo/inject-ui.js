(function () {
  'use strict';
  const E = window.InjectEngine;
  const presetBox = document.getElementById('ij-presets');
  if (!E || !presetBox) return;

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const ICON = { ok: '✓', blocked: '✕', off: '○', info: '·' };
  const text = $('ij-text');
  const enabled = new Set(E.ALL);
  const score = { tried: 0, contained: 0, harmed: 0 };
  let hasRun = false, lastAttack = null;

  /* ---------- presets ---------- */
  E.ATTACKS.forEach(a => {
    const b = el('button', 'cp-chip', a.kind);
    b.type = 'button'; b.dataset.id = a.id; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { choose(a); run(true); });
    presetBox.append(b);
  });
  function choose(a) {
    text.value = a.text; lastAttack = a.id;
    presetBox.querySelectorAll('.cp-chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === a.id)));
  }
  text.addEventListener('input', () => {
    lastAttack = null;
    presetBox.querySelectorAll('.cp-chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
  });

  /* ---------- defence toggles ---------- */
  const layerBox = $('ij-layers');
  E.LAYERS.forEach(l => {
    const row = el('label', 'ij-layer');
    const box = el('input'); box.type = 'checkbox'; box.checked = true; box.id = 'ij-l-' + l.id;
    box.addEventListener('change', () => { box.checked ? enabled.add(l.id) : enabled.delete(l.id); if (hasRun) run(); });
    const body = el('span', 'ij-layer-body');
    const head = el('span', 'ij-layer-head');
    head.append(el('b', null, l.label), el('i', 'ij-tag ij-tag-' + l.source, l.source === 'ported' ? 'from my agent' : 'added for this demo'));
    body.append(head, el('small', null, l.blurb));
    row.append(box, body);
    layerBox.append(row);
  });
  const setAll = on => { E.ALL.forEach(id => { $('ij-l-' + id).checked = on; on ? enabled.add(id) : enabled.delete(id); }); if (hasRun) run(false); };
  $('ij-all').addEventListener('click', () => setAll(true));
  $('ij-none').addEventListener('click', () => setAll(false));

  /* ---------- run and render ---------- */
  function run(newSend) {
    const msg = text.value.trim();
    if (!msg) { text.focus(); return; }
    const result = E.run(msg, E.ALL.filter(id => enabled.has(id)));
    if (newSend) { score.tried++; result.harms.length ? score.harmed++ : score.contained++; }
    hasRun = true;
    render(result);
    renderMatrix();
  }
  $('ij-run').addEventListener('click', () => run(true));

  function render(r) {
    const v = $('ij-verdict');
    v.replaceChildren();
    const bad = r.harms.length > 0;
    const badge = el('div', 'ij-badge ' + (bad ? 'ij-bad' : 'ij-good'), bad ? 'ATTACK SUCCEEDED' : (r.stoppedBy ? 'ATTACK STOPPED' : 'HARMLESS'));
    v.append(el('div', 'cp-label', 'Result'), badge);
    if (bad) {
      v.append(el('h2', 'ij-title', r.harms.map(h => E.HARMS[h]).join('. ') + '.'));
      v.append(el('p', 'ij-summary', 'Nothing in the enabled defences caught this. Switch more layers on and send it again.'));
    } else if (r.stoppedBy) {
      const layer = E.LAYERS.filter(l => l.id === r.stoppedBy)[0];
      v.append(el('h2', 'ij-title', layer.label + ' stopped it.'));
      v.append(el('p', 'ij-summary', 'The message was escalated to a human reviewer and nothing was done. Switch that layer off to see whether another one still catches it.'));
    } else {
      v.append(el('h2', 'ij-title', 'No harm done.'));
      v.append(el('p', 'ij-summary', 'The agent handled the message without doing anything it should not.' + (r.outcome && r.outcome.reply ? ' Its reply: "' + r.outcome.reply + '"' : '')));
    }
    const sc = el('div', 'ij-score');
    sc.append(el('span', null, 'This session: ' + score.tried + ' sent'), el('span', null, score.contained + ' harmless or stopped'), el('span', null, score.harmed + ' got through'));
    v.append(sc);

    const tr = $('ij-trace'); tr.replaceChildren();
    r.steps.forEach(s => {
      const li = el('li', 'cp-step' + (s.status === 'ok' ? ' cp-step-ok' : s.status === 'blocked' ? ' cp-step-blocked' : s.status === 'off' ? ' ij-step-off' : ''));
      li.append(el('span', 'cp-step-icon', ICON[s.status] || '·'), el('strong', null, s.title));
      if (s.detail) li.append(el('code', null, s.detail));
      tr.append(li);
    });
    $('ij-trace-card').hidden = false;
  }

  /* ---------- coverage matrix ---------- */
  const matrix = $('ij-matrix');
  const covers = E.ATTACKS.map(a => ({ a, c: E.coverage(a) }));
  function renderMatrix() {
    matrix.replaceChildren();
    const thead = el('thead'), hr = el('tr');
    hr.append(el('th', null, 'Attack'));
    E.LAYERS.forEach(l => hr.append(el('th', null, l.label.replace(' and validation', '').replace('Intake ', ''))));
    hr.append(el('th', null, 'All six'));
    thead.append(hr);
    const tbody = el('tbody');
    covers.forEach(({ a, c }) => {
      const tr = el('tr', a.id === lastAttack ? 'ij-row-active' : '');
      const th = el('th'); th.scope = 'row';
      const b = el('button', null, a.kind); b.type = 'button';
      b.addEventListener('click', () => { choose(a); run(true); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      th.append(b);
      tr.append(th);
      E.LAYERS.forEach(l => {
        const stops = c.alone[l.id];
        const td = el('td', stops ? 'ij-yes' : 'ij-no', stops ? '✓' : '–');
        td.title = stops ? l.label + ' stops this on its own' : l.label + ' alone does not stop this';
        tr.append(td);
      });
      tr.append(el('td', c.allStops ? 'ij-yes ij-all' : 'ij-no', c.allStops ? '✓' : '✕'));
      tbody.append(tr);
    });
    matrix.append(thead, tbody);
  }
  renderMatrix();
})();
