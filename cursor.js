/* Aurora cursor: two silky physics ribbons, ember sparks, click ripples and a magnetic ring that
 * snaps onto buttons and links. Original implementation inspired by the ribbon, gooey and magnetic
 * cursors seen in open-source portfolios. Skipped for touch devices and reduced-motion users;
 * toggle it from the Ctrl+K palette. */
(function () {
  'use strict';
  if (window.CursorFX) return;

  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let enabled = true;
  try { enabled = localStorage.getItem('cursor-fx') !== 'off'; } catch (e) {}

  const N = 26;                                   // points per ribbon
  const sparks = [], ripples = [];
  const api = {
    supported: !(coarse || reduce),
    isEnabled: () => enabled,
    count: () => sparks.length,
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

  /* ---------- colour: lime / mint / coral, deeper on light surfaces ---------- */
  const PAL_DARK = [[200, 241, 105], [120, 230, 190], [237, 134, 108]];
  const PAL_LIGHT = [[74, 128, 44], [24, 130, 108], [214, 92, 62]];
  let tone = 0, toneT = 0, phase = 0;
  function sample(pal, u) {
    const f = (((u % 1) + 1) % 1) * pal.length, i = Math.floor(f), j = (i + 1) % pal.length, m = f - i;
    return [pal[i][0] + (pal[j][0] - pal[i][0]) * m, pal[i][1] + (pal[j][1] - pal[i][1]) * m, pal[i][2] + (pal[j][2] - pal[i][2]) * m];
  }
  function col(u) {
    const a = sample(PAL_LIGHT, u), b = sample(PAL_DARK, u);
    return Math.round(a[0] + (b[0] - a[0]) * tone) + ',' + Math.round(a[1] + (b[1] - a[1]) * tone) + ',' + Math.round(a[2] + (b[2] - a[2]) * tone);
  }
  const onDark = t => document.body.dataset.cursor === 'dark' || document.body.classList.contains('dark-mode') ||
    !!(t && t.closest && t.closest('.sidebar, #card, .palette'));

  /* ---------- state ---------- */
  const mk = () => Array.from({ length: N }, () => ({ x: -200, y: -200 }));
  const A = mk(), B = mk();
  const head = { x: -200, y: -200, tx: -200, ty: -200, vx: 0, vy: 0, visible: false };
  const ring = { x: -200, y: -200, w: 26, h: 26, r: 13, a: 0, tx: -200, ty: -200, tw: 26, th: 26, tr: 13, ta: .6 };
  let fade = 0, fadeT = 1, hoverEl = null, raf = 0, t0 = 0;

  const SNAP = 'a, button, summary, label, select, [role=button], .cp-chip, .ev-row-btn, .filter, .view-btn';
  const FIELD = 'input[type=text], input[type=search], input[type=number], textarea';
  const BIG = '.project-card, [role=slider], .scene, dialog';

  function setRingTarget(e) {
    const el = e.target && e.target.closest ? e.target : null;
    const field = el && el.closest(FIELD);
    const snap = el && el.closest(SNAP);
    hoverEl = null;
    if (field) { ring.tw = ring.th = 6; ring.tr = 3; ring.ta = .25; return; }
    if (snap) {
      const r = snap.getBoundingClientRect();
      if (r.width < 520 && r.height < 160) {
        hoverEl = snap;
        ring.tx = r.left + r.width / 2; ring.ty = r.top + r.height / 2;
        ring.tw = r.width + 12; ring.th = r.height + 12; ring.tr = Math.min(14, (r.height + 12) / 2); ring.ta = .95;
        fadeT = .3;
        return;
      }
    }
    fadeT = 1;
    const big = el && el.closest(BIG);
    ring.tw = ring.th = big ? 40 : 26; ring.tr = ring.tw / 2; ring.ta = .6;
  }

  function clear() { sparks.length = 0; ripples.length = 0; head.visible = false; fade = 0; g.clearRect(0, 0, W, H); }

  function burst(x, y, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * .4, s = speed * (.5 + Math.random() * .8);
      spark(x, y, Math.cos(a) * s, Math.sin(a) * s);
    }
  }
  function spark(x, y, vx, vy) {
    if (sparks.length > 60) sparks.shift();
    sparks.push({ x, y, vx, vy, life: 1, decay: .018 + Math.random() * .02, size: 1 + Math.random() * 1.8, u: phase + Math.random() * .3 });
  }

  /* ---------- input ---------- */
  addEventListener('pointermove', e => {
    if (!enabled || e.pointerType === 'touch') return;
    if (!head.visible) {
      head.x = head.tx = e.clientX; head.y = head.ty = e.clientY;
      A.forEach(p => { p.x = e.clientX; p.y = e.clientY; }); B.forEach(p => { p.x = e.clientX; p.y = e.clientY; });
      ring.x = ring.tx = e.clientX; ring.y = ring.ty = e.clientY;
    }
    head.tx = e.clientX; head.ty = e.clientY; head.visible = true;
    ring.tx = e.clientX; ring.ty = e.clientY;
    toneT = onDark(e.target) ? 1 : 0;
    setRingTarget(e);
    wake();
  }, { passive: true });

  addEventListener('pointerdown', e => {
    if (!enabled || e.pointerType === 'touch') return;
    ripples.push({ x: e.clientX, y: e.clientY, r: 8, life: 1 }, { x: e.clientX, y: e.clientY, r: 2, life: .8 });
    burst(e.clientX, e.clientY, 12, 3.2);
    wake();
  }, { passive: true });

  addEventListener('scroll', () => {
    if (!hoverEl || !head.visible) return;
    const r = hoverEl.getBoundingClientRect();
    ring.tx = r.left + r.width / 2; ring.ty = r.top + r.height / 2; wake();
  }, { passive: true, capture: true });

  document.addEventListener('mouseleave', () => { head.visible = false; hoverEl = null; wake(); });

  /* ---------- drawing ---------- */
  function follow(chain, f) {
    chain[0].x = head.x; chain[0].y = head.y;
    for (let i = 1; i < N; i++) {
      chain[i].x += (chain[i - 1].x - chain[i].x) * f;
      chain[i].y += (chain[i - 1].y - chain[i].y) * f;
    }
  }
  function ribbon(chain, wMax, alpha, waveAmp, time) {
    const pts = chain.map((p, i) => {
      if (!waveAmp || i === 0 || i === N - 1) return p;
      const dx = chain[i + 1].x - chain[i - 1].x, dy = chain[i + 1].y - chain[i - 1].y, d = Math.hypot(dx, dy) || 1;
      const u = i / (N - 1), off = Math.sin(i * .55 - time * .012) * waveAmp * Math.sin(u * Math.PI);
      return { x: p.x - dy / d * off, y: p.y + dx / d * off };
    });
    for (let i = 0; i < N - 1; i++) {
      const u = i / (N - 1), k = Math.pow(1 - u, 1.2), w = wMax * k + .4, a = alpha * Math.pow(1 - u, 1.35), c = col(phase + u * .7);
      g.beginPath(); g.moveTo(pts[i].x, pts[i].y); g.lineTo(pts[i + 1].x, pts[i + 1].y);
      g.lineWidth = w * 2.8; g.strokeStyle = `rgba(${c},${a * .16})`; g.stroke();
      g.lineWidth = w; g.strokeStyle = `rgba(${c},${a})`; g.stroke();
    }
  }
  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function wake() { if (!raf && enabled) raf = requestAnimationFrame(frame); }

  function frame(now) {
    raf = 0;
    if (!enabled) { clear(); return; }
    const time = now || performance.now();
    g.clearRect(0, 0, W, H);
    phase += .004; tone += (toneT - tone) * .08;
    fade += ((head.visible ? fadeT : 0) - fade) * .12;

    const px = head.x, py = head.y;
    head.x += (head.tx - head.x) * .45; head.y += (head.ty - head.y) * .45;
    head.vx = head.x - px; head.vy = head.y - py;
    const speed = Math.hypot(head.vx, head.vy);

    follow(A, .5); follow(B, .34);

    if (head.visible && speed > 6) { spark(head.x, head.y, -head.vx * .1 + (Math.random() - .5) * .8, -head.vy * .1 + (Math.random() - .5) * .8); if (speed > 16) spark(head.x, head.y, (Math.random() - .5) * 1.4, (Math.random() - .5) * 1.4); }

    g.lineCap = 'round'; g.lineJoin = 'round';
    g.globalCompositeOperation = tone > .5 ? 'lighter' : 'source-over';
    if (fade > .01) {
      ribbon(B, 7, .55 * fade, Math.min(speed, 14) * .45, time);
      ribbon(A, 9, .9 * fade, 0, time);
    }

    // sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vx *= .97; s.vy *= .97; s.life -= s.decay;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      g.fillStyle = `rgba(${col(s.u)},${s.life * .9})`;
      g.beginPath(); g.arc(s.x, s.y, s.size * s.life + .3, 0, 6.2832); g.fill();
    }
    // ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += 3.4; r.life -= .035;
      if (r.life <= 0) { ripples.splice(i, 1); continue; }
      g.lineWidth = 1.5; g.strokeStyle = `rgba(${col(phase + i * .2)},${r.life * .7})`;
      g.beginPath(); g.arc(r.x, r.y, r.r, 0, 6.2832); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';

    // magnetic ring + dot
    const target = head.visible ? ring.ta : 0;
    ring.x += (ring.tx - ring.x) * .22; ring.y += (ring.ty - ring.y) * .22;
    ring.w += (ring.tw - ring.w) * .22; ring.h += (ring.th - ring.h) * .22; ring.r += (ring.tr - ring.r) * .22;
    ring.a += (target - ring.a) * .2;
    if (ring.a > .01) {
      g.lineWidth = 1.5; g.strokeStyle = `rgba(${col(phase)},${ring.a})`;
      rr(ring.x - ring.w / 2, ring.y - ring.h / 2, ring.w, ring.h, ring.r); g.stroke();
      if (hoverEl) { g.fillStyle = `rgba(${col(phase)},${ring.a * .08})`; g.fill(); }
    }
    if (head.visible) { g.fillStyle = `rgba(${col(phase)},.95)`; g.beginPath(); g.arc(head.tx, head.ty, 2.8, 0, 6.2832); g.fill(); }

    // keep animating only while something is still moving
    const settling = Math.abs(head.tx - head.x) > .2 || Math.abs(head.ty - head.y) > .2 ||
      Math.hypot(A[N - 1].x - head.x, A[N - 1].y - head.y) > .6 || Math.hypot(B[N - 1].x - head.x, B[N - 1].y - head.y) > .6 ||
      Math.abs(ring.x - ring.tx) > .3 || Math.abs(ring.y - ring.ty) > .3 || Math.abs(ring.w - ring.tw) > .3 || Math.abs(ring.a - target) > .01 ||
      Math.abs(tone - toneT) > .01 || Math.abs(fade - (head.visible ? fadeT : 0)) > .01;
    if (settling || sparks.length || ripples.length) raf = requestAnimationFrame(frame);
    else if (!head.visible) g.clearRect(0, 0, W, H);
  }

  api.debug = { step: () => frame(performance.now()), running: () => !!raf, ring: () => ({ w: ring.tw, h: ring.th, a: ring.ta }), tone: () => tone, ripples: () => ripples.length };
})();
