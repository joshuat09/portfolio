/* Sound effects, synthesised with the Web Audio API (no audio files). Off by default; turn on with "Toggle sound effects" in the command palette (Ctrl+K). The choice is remembered in this browser. */
(function () {
  'use strict';
  const KEY = 'sfx';
  let ctx = null, on = false;
  try { on = localStorage.getItem(KEY) === 'on'; } catch (e) {}

  const SOUNDS = {
    on: [[660, 0, .08], [880, .08, .1]],
    tick: [[1200, 0, .05]],
    good: [[523, 0, .09], [659, .09, .09], [784, .18, .16]],
    bad: [[220, 0, .16, 'sawtooth'], [165, .16, .22, 'sawtooth']],
    secret: [[330, 0, .08], [494, .08, .08], [659, .16, .08], [988, .24, .22]]
  };

  function play(name) {
    if (!on || !SOUNDS[name]) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime;
      SOUNDS[name].forEach(n => {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = n[3] || 'sine';
        osc.frequency.value = n[0];
        gain.gain.setValueAtTime(0.0001, t0 + n[1]);
        gain.gain.exponentialRampToValueAtTime(0.12, t0 + n[1] + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n[1] + n[2]);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0 + n[1]);
        osc.stop(t0 + n[1] + n[2] + 0.02);
      });
    } catch (e) {}
  }

  function toggle() {
    on = !on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {}
    if (on) play('on');
    return on;
  }

  window.SFX = { play, toggle, get enabled() { return on; } };
})();
