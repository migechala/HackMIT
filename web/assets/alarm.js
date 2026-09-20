/* THRESHOLD exceedance alarm: an audible siren plus a banner, no files or services needed.
 *
 * The siren is synthesized with the Web Audio API (two alternating tones). It only ever plays when the user has
 * switched "Sound an alarm on exceedance" on (never on page load), repeats until it is silenced or the level drops
 * back under the limit, and stops on its own after 60 seconds. The banner is shown on every page while an
 * exceedance is active, works without sound, and does not flash under prefers-reduced-motion.
 *
 * API used by app.js: start({level, limit, facility}), clear(text), stop(), unlock(), test().
 */
(() => {
'use strict';
let ctx = null, timer = null, autoStop = null, hideTimer = null, banner = null;
let active = false, silenced = false, info = null;

const AC = window.AudioContext || window.webkitAudioContext;

function ensureCtx() {
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, t0, dur) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.16, t0 + 0.02);
  g.gain.setValueAtTime(0.16, t0 + dur - 0.05);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function cycle() {
  const c = ensureCtx();
  if (!c || c.state !== 'running') return false;
  const t = c.currentTime + 0.02;
  tone(880, t, 0.32);
  tone(660, t + 0.36, 0.32);
  return true;
}

function startSound() {
  stopSound();
  cycle();
  timer = setInterval(cycle, 1000);
  autoStop = setTimeout(() => { stopSound(); if (banner) setNote('Siren stopped after 60 seconds. The exceedance is still active.'); }, 60000);
}
function stopSound() {
  clearInterval(timer); clearTimeout(autoStop);
  timer = null; autoStop = null;
}

/* ---- banner ---- */
function buildBanner() {
  if (banner) return banner;
  banner = document.createElement('div');
  banner.id = 'alarm-banner';
  banner.setAttribute('role', 'alert');
  banner.innerHTML = '<span class="alarm-dot" aria-hidden="true"></span><div class="alarm-text"><strong></strong><span class="alarm-msg"></span><small class="alarm-note"></small></div><button type="button" class="alarm-btn" data-alarm="silence">Silence</button>';
  banner.addEventListener('click', (e) => {
    const b = e.target.closest('[data-alarm]');
    if (!b) return;
    if (active) { silenced = true; stopSound(); b.textContent = 'Silenced'; b.disabled = true; setNote(''); }
    else dismiss();
  });
  document.body.appendChild(banner);
  return banner;
}
function setNote(t) { if (banner) banner.querySelector('.alarm-note').textContent = t || ''; }
function dismiss() { clearTimeout(hideTimer); if (banner) { banner.remove(); banner = null; } }

/* ---- public API ---- */
function start(next) {
  info = next || {};
  active = true; silenced = false;
  clearTimeout(hideTimer);
  const el = buildBanner();
  el.classList.remove('ok');
  el.querySelector('strong').textContent = 'Noise alarm';
  el.querySelector('.alarm-msg').textContent = info.message || `${info.facility || 'The facility'} is at ${Number(info.level).toFixed(1)} dBA, above its ${info.limit} dBA limit.`;
  const btn = el.querySelector('.alarm-btn');
  btn.textContent = 'Silence'; btn.disabled = false;
  const c = ensureCtx();
  const ok = !!c && c.state === 'running';
  if (ok) startSound(); // startSound plays the first cycle itself
  setNote(ok ? '' : 'Your browser is blocking the siren until you click or press a key on this page.');
}

function clear(text) {
  if (!active) return;
  active = false; silenced = false;
  stopSound();
  if (!banner) return;
  banner.classList.add('ok');
  banner.querySelector('strong').textContent = 'Back under the limit';
  banner.querySelector('.alarm-msg').textContent = text || 'The exceedance has ended.';
  setNote('');
  const btn = banner.querySelector('.alarm-btn');
  btn.textContent = 'Dismiss'; btn.disabled = false;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(dismiss, 6000);
}

function stop() { active = false; silenced = false; stopSound(); dismiss(); }

function test() {
  const ok = cycle();
  if (ok) setTimeout(cycle, 1000);
  return ok;
}

// Browsers only allow sound after a user gesture. Unlock on the first click or key press, and if an alarm was
// waiting on that, start the siren then.
const unlockOnGesture = () => {
  ensureCtx();
  if (active && !silenced && !timer && ctx && ctx.state === 'running') { startSound(); setNote(''); }
};
addEventListener('pointerdown', unlockOnGesture, { passive: true });
addEventListener('keydown', unlockOnGesture, { passive: true });

window.thresholdAlarm = { start, clear, stop, test, unlock: ensureCtx };
})();
