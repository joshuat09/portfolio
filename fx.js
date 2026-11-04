/*
 * Home-page motion layer: an isometric diagram of the agent pipeline in the hero, an ASCII field behind it,
 * a decoding headline, count-up metrics, a skills ticker, scroll reveals and tilting project cards.
 * Everything is decoration on top of the existing page: if this file fails, the page still works.
 * Respects prefers-reduced-motion (draws one still frame) and pauses when off screen or in a hidden tab.
 */
(function () {
  'use strict';
  const hero = document.querySelector('.hero');
  if (!hero) return;
  document.body.classList.add('fx');

  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia && matchMedia('(pointer: fine)').matches;
  let colours = {};
  const readColours = () => {
    const s = getComputedStyle(document.body);
    const v = n => s.getPropertyValue(n).trim();
    colours = { ink: v('--ink'), muted: v('--muted'), line: v('--line'), paper: v('--paper'), bg: v('--bg'), green: v('--green') || '#c8f169', dark: document.body.classList.contains('dark-mode') };
  };
  readColours();
  new MutationObserver(readColours).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  /* Runs a draw loop only while its element is on screen and the tab is visible. */
  function loop(el, draw, fps) {
    let visible = true, last = 0, raf = 0;
    const step = now => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last >= 1000 / fps) { last = now; draw(now / 1000); }
      raf = requestAnimationFrame(step);
    };
    const start = () => { if (!raf && !reduce) raf = requestAnimationFrame(step); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }).observe(el);
    }
    document.addEventListener('visibilitychange', start);
    draw(reduce ? 2.2 : 0);
    start();
  }

  function sizeCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { g, w: r.width, h: r.height };
  }

  /* ---------- 1. Isometric agent pipeline ---------- */
  const graphic = document.querySelector('.hero-graphic');
  if (graphic && graphic.getContext === undefined) {
    const caption = graphic.querySelector('.graphic-caption');
    graphic.replaceChildren();
    graphic.setAttribute('role', 'img');
    graphic.setAttribute('aria-label', 'Animated isometric diagram: data, a model, tools and a human reviewer connected through a central AI agent');
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-iso';
    canvas.setAttribute('aria-hidden', 'true');
    graphic.append(canvas);
    if (caption) { caption.innerHTML = 'DATA → AGENT → MODEL<br>→ TOOLS → HUMAN'; graphic.append(caption); }

    const N = 7, C = 3;
    const towers = [
      { x: 0, y: 3, label: 'DATA', h: 30 },
      { x: 3, y: 0, label: 'MODEL', h: 38 },
      { x: 6, y: 3, label: 'TOOLS', h: 30 },
      { x: 3, y: 6, label: 'HUMAN', h: 34 },
      { x: C, y: C, label: 'AGENT', h: 58, core: true }
    ];
    const towerAt = (x, y) => towers.find(t => t.x === x && t.y === y);
    // The route a request takes: in from data, through the agent to the model and tools, out to a human.
    const stops = [[0, 3], [3, 3], [3, 0], [3, 3], [6, 3], [3, 3], [3, 6]];
    const route = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const [ax, ay] = stops[i], [bx, by] = stops[i + 1];
      const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let k = 0; k < n; k++) route.push([ax + (bx - ax) * k / n, ay + (by - ay) * k / n]);
    }
    route.push(stops[stops.length - 1]);

    let view = sizeCanvas(canvas);
    let pointer = null;
    addEventListener('resize', () => { view = sizeCanvas(canvas); });
    hero.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    });
    hero.addEventListener('pointerleave', () => { pointer = null; });

    function shade(hex, amt) {
      const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '');
      if (!m) return hex;
      const c = [1, 2, 3].map(i => Math.max(0, Math.min(255, Math.round(parseInt(m[i], 16) * (1 + amt)))));
      return '#' + c.map(n => n.toString(16).padStart(2, '0')).join('');
    }

    loop(graphic, t => {
      const { g, w, h } = view;
      g.clearRect(0, 0, w, h);
      const tw = Math.min(w / (N + 0.2), (h - 64) / (N * 0.5 + 1.1) * 2);
      const th = tw / 2;
      const ox = w / 2, oy = (h - N * th) / 2 + 30;
      const at = (x, y) => [ox + (x - y) * tw / 2, oy + (x + y) * th / 2];
      // The wave's centre drifts in a circle, or follows the pointer.
      const wx = pointer ? pointer.x * N : C + Math.cos(t * 0.5) * 2.4;
      const wy = pointer ? pointer.y * N : C + Math.sin(t * 0.5) * 2.4;
      const ink = colours.ink, line = colours.line, paper = colours.paper, green = colours.green;
      const sideL = colours.dark ? shade(paper, 0.35) : shade(line, -0.04);
      const sideR = colours.dark ? shade(paper, 0.12) : shade(line, -0.14);

      const block = (x, y, z, top, left, right, gap) => {
        const [cx, cy] = at(x + 0.5, y + 0.5);
        const hw = tw / 2 * gap, hh = th / 2 * gap;
        const T = cy - z;
        g.beginPath(); g.moveTo(cx - hw, T); g.lineTo(cx, T + hh); g.lineTo(cx, cy + hh); g.lineTo(cx - hw, cy); g.closePath();
        g.fillStyle = left; g.fill();
        g.beginPath(); g.moveTo(cx, T + hh); g.lineTo(cx + hw, T); g.lineTo(cx + hw, cy); g.lineTo(cx, cy + hh); g.closePath();
        g.fillStyle = right; g.fill();
        g.beginPath(); g.moveTo(cx, T - hh); g.lineTo(cx + hw, T); g.lineTo(cx, T + hh); g.lineTo(cx - hw, T); g.closePath();
        g.fillStyle = top; g.fill();
        g.strokeStyle = line; g.lineWidth = 1; g.stroke();
        return [cx, T];
      };

      // Packet position along the route (drawn in depth order with the tiles).
      const speed = 2.2, p = (t * speed) % route.length;
      const i0 = Math.floor(p), f = p - i0;
      const a = route[i0], b = route[Math.min(i0 + 1, route.length - 1)];
      const px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f;
      const trail = [0, 0.35, 0.7, 1.05].map(d => {
        const q = ((p - d) % route.length + route.length) % route.length, j = Math.floor(q), ff = q - j;
        const A = route[j], B = route[Math.min(j + 1, route.length - 1)];
        return [A[0] + (B[0] - A[0]) * ff, A[1] + (B[1] - A[1]) * ff];
      });
      const labels = [];

      for (let s = 0; s <= 2 * (N - 1); s++) {
        for (let x = 0; x < N; x++) {
          const y = s - x;
          if (y < 0 || y >= N) continue;
          const tower = towerAt(x, y);
          const d = Math.hypot(x - wx, y - wy);
          const wave = (Math.sin(d * 1.1 - t * 2.4) + 1) / 2;
          const near = Math.hypot(x - px, y - py) < 0.9;
          if (tower) {
            const bob = tower.core ? Math.sin(t * 2) * 3 : Math.sin(t * 1.6 + x) * 2;
            const z = tower.h + bob;
            const lit = near || tower.core;
            const [cx, top] = block(x, y, z, lit ? green : shade(green, -0.25), '#2b594b', '#193d35', 0.82);
            labels.push([cx, top - th / 2 - 8, tower.label, tower.core]);
          } else {
            const z = 4 + wave * 10;
            const crest = wave > 0.86;
            block(x, y, z, near ? green : crest ? (colours.dark ? shade(paper, 0.6) : '#eef6dc') : paper, sideL, sideR, 0.86);
          }
          // Draw the packet when the sweep reaches its tile, so tiles in front still cover it.
          if (Math.round(px) + Math.round(py) === s && Math.round(px) === x) {
            trail.forEach(([qx, qy], k) => {
              const [cx, cy] = at(qx + 0.5, qy + 0.5);
              g.globalAlpha = 1 - k * 0.24;
              g.fillStyle = k === 0 ? green : shade(green, -0.2);
              g.shadowColor = green; g.shadowBlur = k === 0 ? 14 : 0;
              g.beginPath(); g.arc(cx, cy - 26, k === 0 ? 4.5 : 3 - k * 0.5, 0, Math.PI * 2); g.fill();
              g.shadowBlur = 0; g.globalAlpha = 1;
            });
          }
        }
      }

      g.textAlign = 'center';
      labels.forEach(([x, y, text, core]) => {
        g.font = (core ? '600 11px ' : '10px ') + '"DM Mono", monospace';
        const wdt = g.measureText(text).width + 12;
        g.fillStyle = core ? '#193d35' : colours.dark ? '#1b2822' : '#ffffff';
        g.strokeStyle = core ? '#193d35' : line;
        g.beginPath(); g.roundRect ? g.roundRect(x - wdt / 2, y - 13, wdt, 18, 4) : g.rect(x - wdt / 2, y - 13, wdt, 18); g.fill(); g.stroke();
        g.fillStyle = core ? green : ink;
        g.fillText(text, x, y);
      });
    }, 30);
  }

  /* ---------- 2. ASCII field behind the hero ---------- */
  const field = document.createElement('canvas');
  field.className = 'fx-ascii';
  field.setAttribute('aria-hidden', 'true');
  hero.prepend(field);
  let fv = sizeCanvas(field);
  addEventListener('resize', () => { fv = sizeCanvas(field); });
  let mouse = null;
  hero.addEventListener('pointermove', e => { const r = field.getBoundingClientRect(); mouse = [e.clientX - r.left, e.clientY - r.top]; });
  hero.addEventListener('pointerleave', () => { mouse = null; });
  const RAMP = ' .·:-=+*#%@';
  loop(hero, t => {
    const { g, w, h } = fv;
    g.clearRect(0, 0, w, h);
    const cell = 14;
    g.font = '11px "DM Mono", monospace';
    g.textAlign = 'center';
    g.fillStyle = colours.muted;
    for (let y = cell; y < h; y += cell) {
      for (let x = cell / 2; x < w; x += cell * 0.75) {
        let v = Math.sin(x * 0.011 + t * 0.7) + Math.sin(y * 0.017 - t * 0.5) + Math.sin((x + y) * 0.008 + t * 0.35);
        v = (v + 3) / 6;
        if (mouse) { const d = Math.hypot(x - mouse[0], y - mouse[1]); if (d < 120) v += (1 - d / 120) * 0.5; }
        if (v < 0.46) continue;
        const ch = RAMP[Math.min(RAMP.length - 1, Math.floor((v - 0.46) / 0.54 * RAMP.length))];
        g.globalAlpha = Math.min(0.6, (v - 0.42) * 1.3);
        g.fillText(ch, x, y);
      }
    }
    g.globalAlpha = 1;
  }, 14);

  /* ---------- 2b. Spinning ASCII torus in the About section ---------- */
  const aboutHead = document.querySelector('.about > div:first-child');
  if (aboutHead) {
    const pre = document.createElement('pre');
    pre.className = 'fx-torus';
    pre.setAttribute('aria-hidden', 'true');
    aboutHead.append(pre);
    const W = 46, H = 20, shades = '.,-~:;=!*#$@';
    loop(pre, t => {
      const A = t * 0.9, B = t * 0.45;
      const out = new Array(W * H).fill(' '), z = new Array(W * H).fill(0);
      const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
      for (let j = 0; j < 6.28; j += 0.07) {
        const ct = Math.cos(j), st = Math.sin(j);
        for (let i = 0; i < 6.28; i += 0.02) {
          const sp = Math.sin(i), cp = Math.cos(i);
          const hh = ct + 2, D = 1 / (sp * hh * sA + st * cA + 5);
          const tt = sp * hh * cA - st * sA;
          const x = Math.floor(W / 2 + W * 0.32 * D * (cp * hh * cB - tt * sB));
          const y = Math.floor(H / 2 + H * 0.5 * D * (cp * hh * sB + tt * cB));
          const o = x + W * y;
          const L = Math.floor(8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB));
          if (y >= 0 && y < H && x >= 0 && x < W && D > z[o]) { z[o] = D; out[o] = shades[Math.max(0, L)]; }
        }
      }
      let text = '';
      for (let r = 0; r < H; r++) text += out.slice(r * W, r * W + W).join('') + '\n';
      pre.textContent = text;
    }, 20);
  }

  /* ---------- 3. Decoding headline ---------- */
  const em = hero.querySelector('h1 em');
  if (em && !reduce) {
    const target = em.textContent, glyphs = '01<>/\\{}[]#*+=';
    em.setAttribute('aria-label', target);
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      em.textContent = target.split('').map((c, i) => (i < frame / 2 ? c : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
      if (frame / 2 >= target.length) { clearInterval(id); em.textContent = target; em.removeAttribute('aria-label'); }
    }, 40);
  }

  /* ---------- 4. Count-up metrics ---------- */
  document.querySelectorAll('.metrics strong').forEach(el => {
    const m = /^(\d+)$/.exec(el.textContent.trim());
    if (!m || reduce) return;
    const end = Number(m[1]), pad = m[1].length;
    let n = 0;
    el.textContent = '0'.padStart(pad, '0');
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      const id = setInterval(() => { n++; el.textContent = String(n).padStart(pad, '0'); if (n >= end) clearInterval(id); }, 90);
    });
    io.observe(el);
  });

  /* ---------- 5. Skills ticker ---------- */
  const metrics = document.querySelector('.metrics');
  if (metrics) {
    const words = ['AGENTIC AI', 'PYTHON', 'OLLAMA', 'LOCAL LLMS', 'EVALUATION', 'AI SAFETY', 'PROMPT INJECTION', 'JAVASCRIPT', 'BUSINESS ANALYTICS', 'STRATEGY', 'HUMAN OVERSIGHT'];
    const strip = document.createElement('div');
    strip.className = 'fx-ticker';
    strip.setAttribute('aria-hidden', 'true');
    const run = document.createElement('div');
    run.className = 'fx-ticker-run';
    const text = words.map(w => '[ ' + w + ' ]').join('  ::  ') + '  ::  ';
    run.textContent = text + text;
    strip.append(run);
    metrics.after(strip);
  }

  /* ---------- 6. Scroll reveals ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    const items = document.querySelectorAll('.section-heading, .project-card, .capability, .about > *, .metrics > div');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('fx-in');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el, i) => {
      el.classList.add('fx-reveal');
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- 7. Tilting cards with a spotlight ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', x * 100 + '%');
        card.style.setProperty('--my', y * 100 + '%');
        card.style.setProperty('--rx', (0.5 - y) * 5 + 'deg');
        card.style.setProperty('--ry', (x - 0.5) * 6 + 'deg');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }
})();
