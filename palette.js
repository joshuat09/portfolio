/* Command palette: Ctrl/Cmd+K. Only drives existing page controls; it owns no state of its own. */
(function () {
  'use strict';

  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  function go(id) {
    const link = $(`.nav-link[href="#${id}"]`);
    if (link) { link.click(); return; }
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }

  function setFilter(name) {
    const btn = $(`.filter[data-filter="${name}"]`);
    if (btn) btn.click();
    go('projects');
  }

  function openProject(card) {
    if (typeof window.openProject === 'function') window.openProject(card.dataset.project);
    else card.click();
  }

  function buildCommands() {
    const cmds = [];
    const add = (group, label, hint, run) => cmds.push({ group, label, hint, run, key: (group + ' ' + label + ' ' + hint).toLowerCase() });

    const onHome = !!document.getElementById('projects');
    const href = u => () => { location.href = u; };

    const pages = [['case-studies.html', 'Case studies', 'page write-ups problem approach result'], ['complaints.html', 'Complaint-handling demo', 'page agent'], ['jobfinder.html', 'Graduate job finder demo', 'page jobs scoring'], ['readiness.html', 'AI readiness scorecard', 'page dissertation research autonomy risk'], ['leaderboard.html', 'Local model leaderboard', 'page benchmark ollama models speed accuracy'], ['cv.html', 'CV', 'curriculum vitae resume experience education'], ['showreel.html', 'Watch the showreel', 'page video music intro']];
    if (onHome) {
      [['home', 'Dashboard'], ['projects', 'Projects'], ['play-guessed', 'Play GUESSED'], ['capabilities', 'Capabilities'], ['about', 'About']]
        .forEach(([id, label]) => { if (document.getElementById(id)) add('Go to', label, 'section', () => go(id)); });
      pages.forEach(([url, label, hint]) => add('Go to', label, hint, href(url)));
    } else {
      add('Go to', 'Back to portfolio', 'home', href('index.html'));
      pages.forEach(([url, label, hint]) => { if (location.pathname.indexOf(url) === -1) add('Go to', label, hint, href(url)); });
      [['projects', 'Projects'], ['capabilities', 'Capabilities'], ['about', 'About']]
        .forEach(([id, label]) => add('Go to', label, 'portfolio section', href('index.html#' + id)));
    }

    document.querySelectorAll('.project-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent.trim();
      const tags = [...card.querySelectorAll('.tags span')].map(s => s.textContent.toLowerCase()).join(' ');
      if (title) add('Project', title, tags, () => openProject(card));
    });

    [['all', 'All work'], ['ai', 'AI & automation'], ['software', 'Software'], ['research', 'Research']].forEach(([f, label]) => {
      if ($(`.filter[data-filter="${f}"]`)) add('Filter', `Show ${label}`, 'projects', () => setFilter(f));
    });

    if (window.ComplaintData) {
      window.ComplaintData.scenarios.forEach(s => {
        const chip = $(`.cp-chip[data-id="${s.id}"]`);
        add('Demo', `Run example: ${s.label}`, 'complaint agent', chip ? () => chip.click() : href('complaints.html?example=' + s.id));
      });
    }

    if ($('#theme-toggle')) add('Action', 'Toggle dark mode', 'theme light', () => $('#theme-toggle').click());
    if (window.CursorFX && window.CursorFX.supported) add('Action', 'Toggle cursor trail', 'mouse animation effect particles', () => window.CursorFX.toggle());
    if ($('#surprise-project')) add('Action', 'Surprise me', 'random project', () => $('#surprise-project').click());
    return cmds;
  }

  function score(cmd, terms) {
    let total = 0;
    for (const t of terms) {
      const i = cmd.key.indexOf(t);
      if (i === -1) return -1;
      total += cmd.label.toLowerCase().startsWith(t) ? 0 : (i < cmd.group.length + cmd.label.length + 1 ? 1 : 2);
    }
    return total;
  }

  let dlg, input, list, commands, shown = [], active = 0, lastFocus = null;

  function build() {
    dlg = el('dialog', 'palette');
    dlg.setAttribute('aria-label', 'Command palette');
    input = el('input', 'palette-input');
    input.type = 'text';
    input.placeholder = 'Type a command, project or search term…';
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'true');
    input.setAttribute('aria-controls', 'palette-list');
    input.setAttribute('aria-autocomplete', 'list');
    input.autocomplete = 'off';
    list = el('ul', 'palette-list');
    list.id = 'palette-list';
    list.setAttribute('role', 'listbox');
    const foot = el('div', 'palette-foot', '↑↓ navigate · Enter select · Esc close');
    dlg.append(input, list, foot);
    document.body.append(dlg);

    input.addEventListener('input', () => { active = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
    });
    list.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) choose(+li.dataset.i); });
    list.addEventListener('mousemove', e => { const li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== active) { active = +li.dataset.i; highlight(); } });
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('close', () => { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  }

  function filtered() {
    const q = input.value.trim().toLowerCase();
    if (!q) return commands.slice(0, 40);
    const terms = q.split(/\s+/);
    const hits = commands.map(c => ({ c, s: score(c, terms) })).filter(x => x.s >= 0).sort((a, b) => a.s - b.s).map(x => x.c);
    const searchBox = $('#project-search');
    if (searchBox) hits.push({ group: 'Search', label: `Search projects for “${input.value.trim()}”`, hint: '', run: () => { searchBox.value = input.value.trim(); searchBox.dispatchEvent(new Event('input')); go('projects'); } });
    return hits;
  }

  function render() {
    shown = filtered();
    list.replaceChildren();
    shown.forEach((c, i) => {
      const li = el('li', 'palette-item');
      li.id = 'palette-opt-' + i;
      li.dataset.i = i;
      li.setAttribute('role', 'option');
      li.append(el('span', 'palette-group', c.group), el('span', 'palette-label', c.label));
      list.append(li);
    });
    highlight();
  }

  function highlight() {
    [...list.children].forEach((li, i) => {
      li.setAttribute('aria-selected', i === active ? 'true' : 'false');
      if (i === active) { input.setAttribute('aria-activedescendant', li.id); li.scrollIntoView({ block: 'nearest' }); }
    });
  }

  function move(d) { if (!shown.length) return; active = (active + d + shown.length) % shown.length; highlight(); }

  function choose(i) {
    const cmd = shown[i];
    if (!cmd) return;
    close();
    setTimeout(cmd.run, 0);
  }

  function open() {
    if (document.querySelector('dialog[open]:not(.palette)')) return;
    if (!dlg) build();
    commands = buildCommands();
    lastFocus = document.activeElement;
    input.value = '';
    active = 0;
    render();
    dlg.showModal();
    input.focus();
  }

  function close() { if (dlg && dlg.open) dlg.close(); }

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg && dlg.open) close(); else open();
    }
  });
  document.querySelectorAll('[data-open-palette]').forEach(b => b.addEventListener('click', open));
})();
