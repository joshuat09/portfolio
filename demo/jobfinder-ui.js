(function () {
  'use strict';
  const D = window.JobFinderData, E = window.JobFinderEngine;
  const list = document.getElementById('jf-list');
  if (!D || !E || !list) return;

  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const clone = o => JSON.parse(JSON.stringify(o));

  let profile = clone(D.exampleProfile);
  let weights = clone(D.defaultWeights);

  // Toggle-chip groups (multi-select)
  function chipGroup(containerId, options, key) {
    const box = $(containerId);
    box.replaceChildren();
    options.forEach(name => {
      const b = el('button', 'cp-chip', name);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(profile[key].indexOf(name) !== -1));
      b.addEventListener('click', () => {
        const i = profile[key].indexOf(name);
        if (i === -1) profile[key].push(name); else profile[key].splice(i, 1);
        b.setAttribute('aria-pressed', String(i === -1));
        render();
      });
      box.append(b);
    });
  }

  function fillSelect(id, options, key) {
    const s = $(id);
    s.replaceChildren();
    options.forEach(o => { const opt = el('option', null, o.label); opt.value = o.id; s.append(opt); });
    s.value = profile[key];
    s.onchange = () => { profile[key] = s.value; render(); };
  }

  function buildWeights() {
    const box = $('jf-weight-list');
    box.replaceChildren();
    E.COMPONENTS.forEach(c => {
      const label = el('label', 'jf-weight');
      const top = el('span');
      const name = el('span', null, c.label);
      const val = el('b', null, '');
      val.id = 'jf-w-' + c.key;
      top.append(name, val);
      const input = el('input');
      input.type = 'range'; input.min = 0; input.max = 100; input.step = 5; input.value = weights[c.key];
      input.setAttribute('aria-label', c.label + ' weight');
      input.addEventListener('input', () => { weights[c.key] = Number(input.value); render(); });
      label.append(top, input);
      box.append(label);
    });
  }

  function buildControls() {
    chipGroup('jf-skills', D.skills, 'skills');
    chipGroup('jf-locations', D.locations, 'locations');
    chipGroup('jf-sectors', D.sectors, 'sectors');
    fillSelect('jf-mode', D.modes, 'workMode');
    fillSelect('jf-level', D.levels, 'level');
    $('jf-salary').value = profile.minSalary;
    buildWeights();
  }

  function roleCard(r) {
    const li = el('li', 'jf-role');
    const head = el('div', 'jf-role-head');
    const score = el('div', 'jf-score jf-band-' + r.band.split(' ')[0].toLowerCase());
    score.style.setProperty('--pct', r.total);
    score.append(el('span', null, String(r.total)));
    score.setAttribute('role', 'img');
    score.setAttribute('aria-label', `Match score ${r.total} out of 100`);
    const main = el('div', 'jf-role-main');
    main.append(el('h3', null, r.role.title));
    const levelLabel = D.levels.find(l => l.id === r.role.level).label;
    main.append(el('div', 'jf-meta', `${r.role.company} · ${r.role.location} · ${r.role.mode} · £${r.role.salary}k · ${r.role.sector} · ${levelLabel}`));
    head.append(score, main, el('div', 'jf-band', r.band));
    li.append(head);

    const det = el('details');
    det.append(el('summary', null, 'How this score was calculated'));
    const parts = el('ul', 'jf-parts');
    r.parts.forEach(p => {
      const item = el('li');
      const top = el('div', 'jf-part-top');
      top.append(el('span', null, p.label), el('span', null, `${p.points} / ${p.max} pts`));
      const bar = el('div', 'jf-bar'); const fill = el('i'); fill.style.width = Math.round(p.score * 100) + '%'; bar.append(fill);
      item.append(top, bar, el('div', 'jf-reason', p.reason));
      if (p.key === 'skills') {
        const chips = el('div', 'jf-chips');
        p.matched.forEach(s => chips.append(el('i', 'jf-chip-yes', '✓ ' + s)));
        p.missing.forEach(s => chips.append(el('i', 'jf-chip-no', '✕ ' + s)));
        item.append(chips);
      }
      parts.append(item);
    });
    det.append(parts);
    li.append(det);
    return li;
  }

  function render() {
    $('jf-salary-out').textContent = '£' + profile.minSalary + 'k';
    const norm = E.normaliseWeights(weights);
    E.COMPONENTS.forEach(c => { const out = $('jf-w-' + c.key); if (out) out.textContent = Math.round(norm[c.key]) + '%'; });

    const ranked = E.rank(D.roles, profile, weights);
    // Preserve which breakdowns the visitor has open, keyed by role id
    const open = new Set([...list.querySelectorAll('li[data-id] details[open]')].map(d => d.closest('li').dataset.id));
    list.replaceChildren();
    ranked.forEach(r => {
      const li = roleCard(r);
      li.dataset.id = r.role.id;
      if (open.has(r.role.id)) li.querySelector('details').open = true;
      list.append(li);
    });
    $('jf-count').textContent = `${ranked.length} roles · best match ${ranked[0].total}/100`;
  }

  $('jf-salary').addEventListener('input', e => { profile.minSalary = Number(e.target.value); render(); });
  $('jf-reset').addEventListener('click', () => {
    profile = clone(D.exampleProfile);
    weights = clone(D.defaultWeights);
    buildControls();
    render();
  });

  buildControls();
  render();
})();
