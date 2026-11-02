/* Dark-mode toggle for sub pages. Shares the saved preference with the portfolio home page. */
(function () {
  'use strict';
  const toggle = document.getElementById('theme-toggle');
  const apply = on => {
    document.body.classList.toggle('dark-mode', on);
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', on ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.innerHTML = on ? '☀ <span>Light mode</span>' : '◐ <span>Dark mode</span>';
  };
  try { apply(localStorage.getItem('portfolio-theme') === 'dark'); } catch (e) {}
  if (toggle) toggle.addEventListener('click', () => {
    const on = !document.body.classList.contains('dark-mode');
    apply(on);
    try { localStorage.setItem('portfolio-theme', on ? 'dark' : 'light'); } catch (e) {}
  });
})();
