/* THRESHOLD interaction polish. No dependencies, no changes to app logic.
 *  - Text roll on nav links and buttons (idea from Skiper UI "skiper58", https://skiper-ui.com, free with attribution).
 *  - Cursor spotlight on panels and metric cards (original).
 *  - Progressive blur under the sticky header (technique from Skiper UI "skiper41").
 * Every effect is CSS-gated to real hover pointers and switched off under prefers-reduced-motion (see style.css). */
(() => {
'use strict';
const SEL = '.navlinks a, .navright > a, .btn, .pill-btn, #footer a';
const SKIP = '.switch, .menu-btn, [data-metric], [aria-hidden="true"]';

function wrap(el) {
  if (el.matches(SKIP) || el.querySelector(':scope > .roll')) return;
  // only plain text, optionally followed by an arrow glyph span
  if ([...el.children].some((c) => !c.classList.contains('arrow'))) return;
  const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
  if (!node) return;
  const raw = node.textContent, text = raw.trim();
  if (!text || text.length > 40) return;
  const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
  const letters = [...text], mid = (letters.length - 1) / 2;
  const layer = (cls) => {
    const s = document.createElement('span');
    s.className = cls;
    s.setAttribute('aria-hidden', 'true');
    letters.forEach((c, i) => {
      const l = document.createElement('i');
      l.style.setProperty('--d', `${Math.abs(i - mid) * 16}ms`);
      l.textContent = c === ' ' ? ' ' : c;
      s.appendChild(l);
    });
    return s;
  };
  const roll = document.createElement('span');
  roll.className = 'roll';
  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = text;
  roll.append(sr, layer('roll-a'), layer('roll-b'));
  const frag = document.createDocumentFragment();
  if (lead) frag.append(lead);
  frag.append(roll);
  if (trail) frag.append(trail);
  node.replaceWith(frag);
}

let queued = false;
function enhance() {
  queued = false;
  document.querySelectorAll(SEL).forEach(wrap);
  const h = document.getElementById('header');
  if (h) document.documentElement.style.setProperty('--hh', `${h.offsetHeight}px`);
}
function schedule() {
  if (!queued) { queued = true; requestAnimationFrame(enhance); }
}
new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
window.addEventListener('resize', schedule);
schedule();

// Spotlight: pointer position goes straight to CSS variables (no layout work, no framework state).
document.addEventListener('pointermove', (e) => {
  const t = e.target instanceof Element ? e.target.closest('.panel, .metric, .glass-card') : null;
  if (!t) return;
  const r = t.getBoundingClientRect();
  t.style.setProperty('--mx', `${e.clientX - r.left}px`);
  t.style.setProperty('--my', `${e.clientY - r.top}px`);
}, { passive: true });
})();
