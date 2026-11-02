/* Cursor trail: a glowing particle network that follows the pointer across the site.
 * Skipped for touch devices and reduced-motion users. Toggle it from the Ctrl+K palette. */
(function () {
  'use strict';
  if (window.CursorFX) return;

  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let enabled = true;
  try { enabled = localStorage.getItem('cursor-fx') !== 'off'; } catch (e) {}

  const parts = [];
  const api = {
    supported: !(coarse || reduce),
    isEnabled: () => enabled,
    count: () => parts.length,
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('cursor-fx', enabled ? 'on' : 'off'); } catch (e) {}
      if (!enabled) clear(); else wake();
      return enabled;
    }
  };
  window.CursorFX = api;
  if (!api.supported) return;

  const cv = document.createElement('canvas');
  cv.id = 'cursor-fx';
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '9999' });
  const g = cv.getContext('2d');
  let W = 0, H = 0;

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function mount() { document.body.append(cv); size(); }
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
  addEventListener('resize', () => { if (cv.isConnected) size(); });

  const LINK = 95, MAX = 70;
  const head = { x: -100, y: -100, tx: -100, ty: -100, r: 12, tr: 12, visible: false, pulse: 0, rgb: '82,128,52' };
  let last = null, raf = 0;

  // Light particles over dark surfaces, deep green over light ones.
  function rgbFor(target) {
    const dark = document.body.dataset.cursor === 'dark' || document.body.classList.contains('dark-mode') ||
      (target && target.closest && target.closest('.sidebar, #card, .palette, .project-dialog'));
    return dark ? '200,241,105' : '82,128,52';
  }

  function spawn(x, y, vx, vy) {
    if (parts.length >= MAX) parts.shift();
    parts.push({ x, y, vx, vy, life: 1, decay: .012 + Math.random() * .014, r: 1.2 + Math.random() * 2.2, rgb: head.rgb });
  }

  function clear() { parts.length = 0; head.visible = false; g.clearRect(0, 0, W, H); }

  addEventListener('pointermove', e => {
    if (!enabled || e.pointerType === 'touch') return;
    head.tx = e.clientX; head.ty = e.clientY;
    if (!head.visible) { head.x = e.clientX; head.y = e.clientY; }
    head.visible = true;
    const hot = e.target.closest && e.target.closest('a, button, input, select, textarea, summary, label, [role=button], [role=slider], .project-card');
    head.tr = hot ? 30 : 12;
    head.rgb = rgbFor(e.target);
    if (last) {
      const dx = e.clientX - last.x, dy = e.clientY - last.y, n = Math.min(5, Math.floor(Math.hypot(dx, dy) / 10));
      for (let i = 0; i < n; i++) spawn(last.x + dx * (i + 1) / n, last.y + dy * (i + 1) / n, (Math.random() - .5) * .7 - dx * .012, (Math.random() - .5) * .7 - dy * .012);
    }
    last = { x: e.clientX, y: e.clientY };
    wake();
  }, { passive: true });

  addEventListener('pointerdown', e => {
    if (!enabled || e.pointerType === 'touch') return;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, s = 1.5 + Math.random() * 2.5;
      spawn(e.clientX, e.clientY, Math.cos(a) * s, Math.sin(a) * s);
    }
    head.pulse = 1;
    wake();
  }, { passive: true });

  document.addEventListener('mouseleave', () => { head.visible = false; last = null; wake(); });

  function wake() { if (!raf && enabled) raf = requestAnimationFrame(frame); }

  function frame() {
    raf = 0;
    if (!enabled) { clear(); return; }
    g.clearRect(0, 0, W, H);

    head.x += (head.tx - head.x) * .2;
    head.y += (head.ty - head.y) * .2;
    head.r += (head.tr - head.r) * .18;
    head.pulse *= .92;

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vx *= .985; p.vy *= .985; p.life -= p.decay;
      if (p.life <= 0) parts.splice(i, 1);
    }

    g.lineWidth = 1;
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y;
        if (dx > LINK || dx < -LINK || dy > LINK || dy < -LINK) continue;
        const d = Math.hypot(dx, dy);
        if (d >= LINK) continue;
        g.strokeStyle = `rgba(${a.rgb},${(1 - d / LINK) * .45 * Math.min(a.life, b.life)})`;
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      }
    }
    parts.forEach(p => {
      g.fillStyle = `rgba(${p.rgb},${p.life * .85})`;
      g.beginPath(); g.arc(p.x, p.y, p.r * p.life + .4, 0, 6.2832); g.fill();
    });

    if (head.visible) {
      g.strokeStyle = `rgba(${head.rgb},.75)`; g.lineWidth = 1.5;
      g.beginPath(); g.arc(head.x, head.y, head.r * (1 + head.pulse * .6), 0, 6.2832); g.stroke();
      g.fillStyle = `rgba(${head.rgb},.95)`;
      g.beginPath(); g.arc(head.tx, head.ty, 3, 0, 6.2832); g.fill();
    }

    const moving = Math.abs(head.tx - head.x) > .3 || Math.abs(head.ty - head.y) > .3 || Math.abs(head.r - head.tr) > .3 || head.pulse > .01;
    if (parts.length || (head.visible && moving)) raf = requestAnimationFrame(frame);
  }
})();
