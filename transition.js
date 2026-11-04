/*
 * Liquid page transitions. Clicking a link to another page of this site floods the screen with a wobbling
 * green blob from the click point; the next page opens covered and the blob drains away.
 * Loaded at the top of <body> so the cover is in place before the new page paints.
 * Skipped for new-tab clicks, downloads, other sites, same-page anchors and reduced motion.
 */
(function () {
  'use strict';
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const KEY = 'liquid-transition';
  const DURATION = 520;

  function overlay() {
    const c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;pointer-events:none';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c, g };
  }

  // Draws a blob of radius r around (x, y) with a liquid, wobbling edge.
  function blob(g, x, y, r, t) {
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (r <= 0) return;
    const grad = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    grad.addColorStop(0, '#193d35');
    grad.addColorStop(0.85, '#1f4a3f');
    grad.addColorStop(1, '#c8f169');
    g.fillStyle = grad;
    g.beginPath();
    for (let i = 0; i <= 90; i++) {
      const a = i / 90 * Math.PI * 2;
      const wob = 1 + Math.sin(a * 5 + t * 9) * 0.05 + Math.sin(a * 3 - t * 6) * 0.04;
      const px = x + Math.cos(a) * r * wob, py = y + Math.sin(a) * r * wob;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
    g.fill();
  }

  const far = (x, y) => Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.15;
  const easeIn = p => p * p * p, easeOut = p => 1 - Math.pow(1 - p, 3);

  function animate(draw, done) {
    const start = performance.now();
    let finished = false;
    const finish = () => { if (!finished) { finished = true; done(); } };
    const frame = now => {
      const p = Math.min(1, (now - start) / DURATION);
      draw(p, (now - start) / 1000);
      if (p < 1) requestAnimationFrame(frame); else finish();
    };
    requestAnimationFrame(frame);
    setTimeout(finish, DURATION + 250);      // never leave someone stuck if frames stall
  }

  /* ---- Arriving: start covered, then drain away ---- */
  let origin = null;
  try { origin = JSON.parse(sessionStorage.getItem(KEY) || 'null'); sessionStorage.removeItem(KEY); } catch (e) {}
  if (origin && document.body) {
    const { c, g } = overlay();
    document.body.append(c);
    const x = origin.x * innerWidth, y = origin.y * innerHeight, R = far(x, y);
    blob(g, x, y, R, 0);
    const go = () => animate((p, t) => blob(g, x, y, R * (1 - easeOut(p)), t), () => c.remove());
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }

  /* ---- Leaving: flood from the click point, then navigate ---- */
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page, e.g. #projects
    if (!/(\.html|\/)$/.test(url.pathname)) return;
    e.preventDefault();
    const x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
    try { sessionStorage.setItem(KEY, JSON.stringify({ x: x / innerWidth, y: y / innerHeight })); } catch (err) {}
    const { c, g } = overlay();
    document.body.append(c);
    const R = far(x, y);
    animate((p, t) => blob(g, x, y, R * easeIn(p) + 4, t), () => { location.href = url.href; });
  });

  // Coming back with the browser's back button can restore the page with the cover still on it.
  addEventListener('pageshow', ev => {
    if (ev.persisted) document.querySelectorAll('canvas[aria-hidden="true"][style*="2147483000"]').forEach(n => n.remove());
  });
})();
