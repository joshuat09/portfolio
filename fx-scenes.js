/*
 * Animated isometric scenes for the project cards, in the same style as the hero diagram.
 * Each card's visual gets a small scene that says something about the project. Needs fx.js (window.FX).
 */
(function () {
  'use strict';
  const FX = window.FX;
  if (!FX) return;

  const GREEN = '#c8f169';
  const PALETTES = {
    dark: { top: '#2f5246', left: '#22403a', right: '#1a332d', line: '#3e6457', text: '#e6f2e0', pill: '#17302a' },
    navy: { top: '#2e3f4e', left: '#253441', right: '#1c2833', line: '#3d5366', text: '#dce7ed', pill: '#1a2530' },
    light: { top: '#ffffff', left: '#cfd9cc', right: '#b9c7b5', line: '#aebdaa', text: '#243b31', pill: '#ffffff' }
  };

  function shade(hex, amt) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
    if (!m) return hex;
    return '#' + [1, 2, 3].map(i => Math.max(0, Math.min(255, Math.round(parseInt(m[i], 16) * (1 + amt))))).map(n => n.toString(16).padStart(2, '0')).join('');
  }
  const ease = x => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);

  /*
   * Draws boxes on an isometric grid. Coordinates are in tiles; heights (z, h) are in half-tiles.
   * box: { x, y, w, d, z, h, top, left, right, label, glow }
   */
  function render(g, W, H, grid, boxes, pal, extras) {
    const span = grid.x + grid.y;
    const maxZ = (grid.z || 3) + 0.8;                 // headroom for labels
    const area = H - 26;                              // leave room for the caption
    const tw = Math.min(W * 0.8 / (span / 2), area / (span / 4 + maxZ / 2));
    const th = tw / 2;
    const content = span * th / 2 + maxZ * th;
    const ox = W / 2 - (grid.x - grid.y) * tw / 4;
    const oy = (area - content) / 2 + maxZ * th + 4;
    const P = (x, y, z) => [ox + (x - y) * tw / 2, oy + (x + y) * th / 2 - z * th];

    boxes.slice().sort((a, b) => (a.x + a.y + (a.w || 1) / 2 + (a.d || 1) / 2) - (b.x + b.y + (b.w || 1) / 2 + (b.d || 1) / 2) || (a.z || 0) - (b.z || 0))
      .forEach(b => {
        const w = b.w || 1, d = b.d || 1, z0 = b.z || 0, z1 = z0 + (b.h || 0.2);
        const inset = b.inset == null ? 0.08 : b.inset;
        const x0 = b.x + inset, y0 = b.y + inset, x1 = b.x + w - inset, y1 = b.y + d - inset;
        const poly = (pts, fill) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = fill; g.fill(); g.strokeStyle = pal.line; g.lineWidth = 1; g.stroke(); };
        poly([P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)], b.left || pal.left);
        poly([P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)], b.right || pal.right);
        if (b.glow) { g.shadowColor = b.glow; g.shadowBlur = 12; }
        poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], b.top || pal.top);
        g.shadowBlur = 0;
        if (b.leds) b.leds(g, P, x1, y0, y1, z0, z1);
        if (b.label) {
          const [cx, cy] = P(b.x + w / 2, b.y + d / 2, z1);
          g.font = (b.big ? '600 ' + Math.round(th * 0.7) + 'px ' : '8px ') + '"DM Mono", monospace';
          g.textAlign = 'center';
          if (b.big) { g.fillStyle = b.labelColour || pal.text; g.fillText(b.label, cx, cy + th * 0.22); return; }
          const tw2 = g.measureText(b.label).width + 8;
          g.fillStyle = pal.pill; g.strokeStyle = pal.line;
          g.beginPath(); g.rect(cx - tw2 / 2, cy - th * 0.9 - 9, tw2, 12); g.fill(); g.stroke();
          g.fillStyle = pal.text; g.fillText(b.label, cx, cy - th * 0.9);
        }
      });
    if (extras) extras(g, P, th);
  }

  const dot = (g, [x, y], r, colour) => { g.fillStyle = colour; g.shadowColor = colour; g.shadowBlur = 10; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.shadowBlur = 0; };
  const lerp = (a, b, f) => a + (b - a) * f;

  /* One scene per project. Each returns the boxes for time t (seconds). */
  const SCENES = {
    // Complaint agent: inbox -> agent -> one of three outcomes, mostly a human.
    complaints: {
      pal: 'dark', grid: { x: 5, y: 3, z: 3 }, caption: 'INBOX → AGENT → RESOLVE · INFO · HUMAN',
      draw(t) {
        const cycle = 3.2, k = Math.floor(t / cycle), f = (t % cycle) / cycle;
        const target = [2, 1, 2, 0, 2][k % 5];   // 0 resolve, 1 info, 2 human
        const boxes = [];
        for (let x = 0; x < 5; x++) for (let y = 0; y < 3; y++) boxes.push({ x, y, h: 0.25 });
        boxes.push({ x: 0, y: 1, z: 0.25, h: 1.8, top: '#9fbf86', label: 'INBOX' });
        boxes.push({ x: 2, y: 1, z: 0.25, h: 2.6 + Math.sin(t * 2) * 0.15, top: GREEN, left: '#2b594b', right: '#193d35', label: 'AGENT', glow: f > 0.3 && f < 0.55 ? GREEN : null });
        ['RESOLVE', 'INFO', 'HUMAN'].forEach((label, i) => boxes.push({ x: 4, y: i, z: 0.25, h: 0.6, label: i === target && f > 0.6 ? label : null, top: i === target && f > 0.75 ? GREEN : '#3f6a5b' }));
        let px, py, pz;
        if (f < 0.4) { const e = ease(f / 0.4); px = lerp(0.5, 2.5, e); py = 1.5; pz = lerp(2.4, 3.2, Math.sin(e * Math.PI)); }
        else if (f < 0.75) { const e = ease((f - 0.4) / 0.35); px = lerp(2.5, 4.5, e); py = lerp(1.5, target + 0.5, e); pz = lerp(3.2, 1.3, e); }
        else { px = 4.5; py = target + 0.5; pz = 1.3; }
        return { boxes, extras: (g, P) => dot(g, P(px, py, pz), 3.5, GREEN) };
      }
    },
    // GUESSED: five tiles that flip up one by one to reveal the answer.
    guessed: {
      pal: 'light', grid: { x: 5, y: 1, z: 2 }, caption: 'DAILY CHALLENGE · FIVE QUESTIONS',
      draw(t) {
        const word = 'GUESS', cycle = 5, f = (t % cycle) / cycle;
        const boxes = [];
        for (let i = 0; i < 5; i++) {
          const start = 0.08 + i * 0.12, p = Math.max(0, Math.min(1, (f - start) / 0.12));
          const pop = Math.sin(p * Math.PI) * 1.2;
          const shown = f > start + 0.06 && f < 0.92;
          boxes.push({ x: i, y: 0, h: 0.6 + pop, inset: 0.12, top: shown ? (i === 4 ? '#ed866c' : '#ffffff') : '#eef3ec', left: '#d6dfd3', right: '#c4d0c1', label: shown ? word[i] : '?', big: true, labelColour: shown ? (i === 4 ? '#ffffff' : '#243b31') : '#9aa79c' });
        }
        return { boxes };
      }
    },
    // Evaluation: a scanner passes over a grid of test cases, marking each pass or fail.
    evaluation: {
      pal: 'navy', grid: { x: 4, y: 3, z: 1.5 }, caption: 'TEST · TRACE · RECONCILE',
      draw(t) {
        const cycle = 6, f = (t % cycle) / cycle, n = 12, done = Math.floor(f * 1.15 * n);
        const fail = [5, 10];
        const boxes = [];
        for (let i = 0; i < n; i++) {
          const x = i % 4, y = Math.floor(i / 4), checked = i < done;
          const bad = fail.indexOf(i) !== -1;
          boxes.push({ x, y, h: checked ? 0.9 : 0.4, top: checked ? (bad ? '#e07a5f' : '#a9dd85') : '#2e3f4e', glow: i === done - 1 ? (bad ? '#e07a5f' : '#a9dd85') : null });
        }
        const sx = (Math.min(done, n - 1) % 4) + 0.5, sy = Math.floor(Math.min(done, n - 1) / 4) + 0.5;
        return { boxes, extras: (g, P) => dot(g, P(sx, sy, 2.4), 3, '#a9dd85') };
      }
    },
    // Local AI: three server racks with blinking lights, a request hopping between them.
    localai: {
      pal: 'light', grid: { x: 3, y: 3, z: 3.8 }, caption: 'PRIVATE · SELF-HOSTED · EXPERIMENTAL',
      draw(t) {
        const boxes = [];
        for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) boxes.push({ x, y, h: 0.2 });
        const names = ['OLLAMA', 'QWEN', 'WEBUI'];
        const on = Math.round((t * 0.8) % 2 + 0.5) % 3;
        names.forEach((label, i) => boxes.push({
          x: i, y: 1, z: 0.2, h: 3.4, inset: 0.18, top: i === on ? GREEN : '#3f6a5b', left: '#2b594b', right: '#193d35', label: i === on ? label : null,
          leds: (g, P, x1, y0, y1, z0, z1) => {
            for (let r = 0; r < 5; r++) {
              const on = Math.sin(t * (3 + i) + r * 1.7 + i) > 0.1;
              const z = z0 + 0.4 + r * 0.55, yy = y0 + 0.18;
              const [ax, ay] = P(x1, yy, z), [bx, by] = P(x1, yy + 0.22, z);
              g.strokeStyle = on ? GREEN : '#2f4f45'; g.lineWidth = 2;
              g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
            }
          }
        }));
        const hop = (t * 0.8) % 2, from = Math.floor(hop), e = ease(hop - from);
        const px = lerp(from + 0.5, from + 1.5, e);
        return { boxes, extras: (g, P) => dot(g, P(px, 0.6, 4.2 + Math.sin(e * Math.PI) * 0.8), 3, GREEN) };
      }
    },
    // Job finder: role scores rising as bars, the best match highlighted.
    jobfinder: {
      pal: 'light', grid: { x: 5, y: 1, z: 4 }, caption: 'ROLE MATCH ANALYSIS',
      draw(t) {
        const scores = [52, 71, 84, 63, 46], cycle = 5, f = (t % cycle) / cycle;
        const boxes = scores.map((s, i) => {
          const grow = ease((f - i * 0.06) / 0.4);
          const best = s === 84 && f > 0.45;
          return { x: i, y: 0, h: 0.3 + (s / 100) * 4.2 * grow, inset: 0.16, top: best ? '#9db78b' : '#ffffff', left: best ? '#789b62' : '#dfe6dc', right: best ? '#5f8346' : '#cdd8ca', label: best ? '84' : null, glow: best ? '#9db78b' : null };
        });
        return { boxes };
      }
    },
    // Research: people, process and technology as layers, each lighting up in turn.
    research: {
      pal: 'dark', grid: { x: 3, y: 3, z: 3.8 }, caption: 'PEOPLE · PROCESS · TECHNOLOGY',
      draw(t) {
        const active = Math.floor(t / 1.6) % 3;
        const labels = ['TECHNOLOGY', 'PROCESS', 'PEOPLE'];
        const boxes = labels.map((label, i) => ({
          x: 0, y: 0, w: 3, d: 3, z: i * 1.6 + Math.sin(t * 1.5 + i) * 0.12, h: 0.45, inset: 0.05,
          top: i === active ? '#b8d58e' : '#2f5246', left: i === active ? '#7d9a5e' : '#22403a', right: i === active ? '#5f7a46' : '#1a332d',
          label: i === active ? label : null, glow: i === active ? '#b8d58e' : null
        }));
        return { boxes };
      }
    }
  };

  document.querySelectorAll('.project-card[data-project]').forEach(card => {
    const scene = SCENES[card.dataset.project];
    const visual = card.querySelector('.project-visual');
    if (!scene || !visual) return;
    visual.classList.add('fx-scene');
    visual.replaceChildren();
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const cap = document.createElement('div');
    cap.className = 'fx-scene-cap';
    cap.textContent = scene.caption;
    visual.append(canvas, cap);
    let view = FX.sizeCanvas(canvas);
    addEventListener('resize', () => { view = FX.sizeCanvas(canvas); });
    const pal = PALETTES[scene.pal];
    FX.loop(visual, t => {
      const { g, w, h } = view;
      g.clearRect(0, 0, w, h);
      const out = scene.draw(t);
      render(g, w, h, scene.grid, out.boxes, pal, out.extras);
    }, 24);
  });
})();
