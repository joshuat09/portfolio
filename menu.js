/* Phone menu: on small screens the sidebar collapses to a top bar; this button opens and closes its links. */
(function () {
  'use strict';
  const bar = document.getElementById('site-nav');
  const button = bar && bar.querySelector('.menu-toggle');
  if (!button) return;
  const set = open => {
    bar.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('span').textContent = open ? 'Close' : 'Menu';
  };
  button.addEventListener('click', () => set(!bar.classList.contains('open')));
  // Close after choosing a link (same-page anchors otherwise leave the menu covering the page), or on Escape.
  bar.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && bar.classList.contains('open')) { set(false); button.focus(); } });
})();
