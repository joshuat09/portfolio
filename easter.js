/* Hidden easter egg: type the Konami code (up up down down left right left right b a) for a green code-rain overlay. Esc or click closes it. */
(function () {
  'use strict';
  const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0, layer = null, timer = null;

  function close() {
    if (!layer) return;
    clearInterval(timer);
    layer.remove();
    layer = null;
  }

  function open() {
    if (layer) return;
    if (window.SFX) window.SFX.play('secret');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    layer = document.createElement('div');
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-label', 'Easter egg');
    layer.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#0b1511;display:grid;place-items:center;cursor:pointer';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    const msg = document.createElement('div');
    msg.style.cssText = 'position:relative;text-align:center;color:#a9e86c;font:600 clamp(22px,4vw,40px) "Space Grotesk",sans-serif;letter-spacing:-.03em;padding:0 24px;text-shadow:0 0 24px #0b1511';
    msg.innerHTML = '';
    const line1 = document.createElement('div');
    line1.textContent = 'You found it.';
    const line2 = document.createElement('div');
    line2.style.cssText = 'font:11px "DM Mono",monospace;letter-spacing:.12em;color:#9daf9f;margin-top:12px';
    line2.textContent = 'ALWAYS ASSUME THE MODEL WILL BE FOOLED · PRESS ESC TO RETURN';
    msg.append(line1, line2);
    layer.append(canvas, msg);
    layer.addEventListener('click', close);
    document.body.append(layer);

    const g = canvas.getContext('2d');
    const size = 16, dpr = window.devicePixelRatio || 1;
    const w = canvas.width = innerWidth * dpr, h = canvas.height = innerHeight * dpr;
    const cols = Math.ceil(innerWidth / size);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const glyphs = 'AI01<>{}[]/\\=+*#$%';
    g.scale(dpr, dpr);
    g.fillStyle = '#0b1511';
    g.fillRect(0, 0, w, h);
    const tick = () => {
      g.fillStyle = 'rgba(11,21,17,.14)';
      g.fillRect(0, 0, innerWidth, innerHeight);
      g.font = size + 'px "DM Mono",monospace';
      drops.forEach((y, i) => {
        g.fillStyle = Math.random() > .96 ? '#eaffc8' : '#6b8d52';
        g.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * size, y * size);
        drops[i] = y * size > innerHeight && Math.random() > .975 ? 0 : y + 1;
      });
    };
    if (reduce) { for (let i = 0; i < 40; i++) tick(); }
    else timer = setInterval(tick, 60);
  }

  /* Other ways in: tap the JT logo five times (works on touch), or run "Matrix mode" from the command palette. */
  window.Easter = { open: open };
  let taps = 0, tapTimer = null;
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('.brand-mark')) return;
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1500);
    if (taps >= 5) { taps = 0; e.preventDefault(); open(); }
  });

  addEventListener('keydown', e => {
    if (e.key === 'Escape') { close(); return; }
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable) { pos = 0; return; }
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === CODE[pos] ? pos + 1 : (key === CODE[0] ? 1 : 0);
    if (pos === CODE.length) { pos = 0; open(); }
  });
})();
