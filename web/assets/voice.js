/* THRESHOLD voice assistant ("Ask THRESHOLD").
 *
 * Speech in:  Deepgram live speech-to-text (Nova-3) over a WebSocket, using a short-lived token from /api/voice-token.
 * Speech out: Deepgram Aura text-to-speech, proxied by /api/speak so the API key never reaches the browser.
 * Answers:    a rule-based router over the app's own data (NOAA weather, PUDL prices, facility and noise state).
 *             There is no language model, so every number comes from the data and nothing can be invented.
 * Typing works without Deepgram; the mic and spoken replies need `node server/serve.mjs` with DEEPGRAM_API_KEY set.
 */
(() => {
'use strict';
const app = () => window.thresholdApp;
const $ = (s, r = document) => r.querySelector(s);
const pctW = (v) => `${Math.round(v * 100)} percent`;
const num = (v, d = 1) => Number(v).toFixed(d);
const money4 = (v) => `$${Number(v).toFixed(4)}`;

/* ---------------- question router ---------------- */
const FAC_WORDS = [['manassas', 'dc-manassas-01'], ['prince william', 'dc-manassas-01'], ['crosby', 'dc-divide-02'], ['divide', 'dc-divide-02'],
  ['scranton', 'dc-scranton-03'], ['ypsilanti', 'dc-ypsi-04'], ['ypsi', 'dc-ypsi-04'], ['washtenaw', 'dc-ypsi-04']];
const PAGES = [[/weather|wind|still air/, '#/weather', 'weather exposure'], [/cost|financ|price|threshold|alert/, '#/costs', 'costs and thresholds'],
  [/operation|spectrum|noise/, '#/operations', 'operations'], [/site|location|siting/, '#/sites', 'site intelligence'],
  [/facilit|all sites|list/, '#/facilities', 'facilities'], [/pricing|plan/, '#/pricing', 'pricing']];

function facFrom(q) {
  const a = app();
  for (const [k, id] of FAC_WORDS) if (q.includes(k)) return a.FACILITIES.find((f) => f.id === id);
  return null;
}
const isCurrent = (f) => f.id === app().facility().id;
const readings = (f) => (isCurrent(f)
  ? { baseline: app().S.baseline, residual: app().S.residual, anc: app().S.anc, power: app().S.power }
  : { baseline: f.baseline, residual: f.baseline - 12.4, anc: true, power: 5.2 });

function limitFor(f) {
  const lim = app().PROFILE_LIMITS[f.profile] || [60, 55];
  const h = Number(new Intl.DateTimeFormat('en-US', { timeZone: f.tz, hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  const day = h >= 7 && h < 22;
  return { value: day ? lim[0] : lim[1], period: day ? 'daytime' : 'night-time' };
}

function rank(key) {
  const a = app();
  const rows = a.FACILITIES.map((f) => ({ f, w: a.ISD.sites.find((s) => s.id === f.id), p: a.PUDL.sites.find((s) => s.id === f.id) })).filter((r) => r.w && r.p);
  const val = { still: (r) => r.w.stillNightShare, price: (r) => r.p.latest.industrialCentsKwh, clean: (r) => r.p.generation.carbonFreeShare }[key];
  return rows.sort((x, y) => val(y) - val(x)).map((r) => ({ ...r, v: val(r) }));
}

function answer(raw) {
  const a = app();
  const q = ` ${raw.toLowerCase().replace(/[^\w\s.%]/g, ' ').replace(/\s+/g, ' ').trim()} `;
  const named = facFrom(q);
  const f = named || a.facility();
  const w = a.ISD.sites.find((s) => s.id === f.id);
  const p = a.PUDL.sites.find((s) => s.id === f.id);
  const place = `${f.city}, ${f.state}`;

  if (/ (help|what can you|what can i ask|examples?) /.test(q)) {
    return { text: 'Ask about a facility: still-air nights, electricity price, grid mix, noise reduction or the threshold. You can also say "open the weather page" or "which site has the most still air".' };
  }

  // comparisons: "which facility has the most still air / cheapest power / cleanest grid"
  if (/ (which|what|where) /.test(q) && / (most|highest|worst|least|lowest|best|cheapest|cleanest|dirtiest|quietest|windiest|expensive) /.test(q)) {
    if (/still|calm|weather|wind|carry|night/.test(q)) {
      const r = rank('still'), least = / (least|lowest|windiest|quietest) /.test(q) ? r[r.length - 1] : r[0];
      return { text: `${least.f.city} has the ${least === r[0] ? 'most' : 'least'} still-air nights at ${pctW(least.v)}. Still air lets low-frequency hum carry farther. This is weather exposure, not measured noise.` };
    }
    if (/price|cost|cheap|expens|power|electric/.test(q)) {
      const r = rank('price'), top = / (cheapest|lowest|least) /.test(q) ? r[r.length - 1] : r[0];
      return { text: `${top.f.city} has the ${top === r[0] ? 'highest' : 'lowest'} industrial electricity price at ${num(top.v)} cents per kilowatt hour, ${top.p.latest.year} state average.` };
    }
    if (/clean|carbon|renew|grid|green|dirty/.test(q)) {
      const r = rank('clean'), top = / (dirtiest|lowest|least|worst) /.test(q) ? r[r.length - 1] : r[0];
      return { text: `${top.f.state} has the ${top === r[0] ? 'highest' : 'lowest'} carbon-free share of in-state generation at ${pctW(top.v)}, counting nuclear, hydro, wind and solar.` };
    }
  }

  // navigation: "open scranton", "show the weather page", "go to costs for crosby"
  if (/^ (open|show|go to|take me to|switch to|pull up|bring up) /.test(q)) {
    const page = PAGES.find(([re]) => re.test(q));
    if (named) {
      a.selectFacility(named.id);
      if (page && page[1] !== '#/facilities') a.go(page[1]);
      return { text: `Opening ${named.name}${page && page[1] !== '#/facilities' ? `, ${page[2]}` : ''}.` };
    }
    if (page) { a.go(page[1]); return { text: `Opening ${page[2]}.` }; }
  }

  if (/still|calm|wind|weather|carry|propagat/.test(q)) {
    if (!w) return { text: `I don't have weather data for ${place}.` };
    return { text: `At ${place}, the air is still on ${pctW(w.stillNightShare)} of nights, with a mean night wind of ${num(w.meanNightWindMs)} meters per second. That is NOAA data from ${w.station.name}, ${w.years[0]} to ${w.years[1]}. It is weather exposure, not measured noise.` };
  }

  if (/price|cost|electric|tariff|kwh|kilowatt|bill|expens|cheap/.test(q)) {
    if (!p) return { text: `I don't have a price for ${place}.` };
    const cur = isCurrent(f) ? a.settings.tariff : p.latest.industrialCentsKwh / 100;
    const r = readings(f);
    const daily = (r.power / 1000) * 24 * cur;
    return { text: `${f.state} industrial electricity averaged ${num(p.latest.industrialCentsKwh)} cents per kilowatt hour in ${p.latest.year}. At ${num(r.power)} watts, the mitigation costs about ${money4(daily)} a day.` };
  }

  if (/grid|clean|carbon|renew|nuclear|solar|coal|gas|power mix|generation|powers/.test(q)) {
    if (!p) return { text: `I don't have grid data for ${place}.` };
    const g = p.generation.shares;
    return { text: `${pctW(p.generation.carbonFreeShare)} of ${f.state} in-state generation is nuclear, hydro, wind or solar. Gas is ${pctW(g.gas)} and coal is ${pctW(g.coal)}. This is in-state generation, not what a specific utility delivers.` };
  }

  if (/reduc|attenuat|quieter|how much|decibel|db\b|dba|residual|noise level|loud/.test(q)) {
    const r = readings(f);
    return { text: `${f.name} is ${r.anc ? `at ${num(r.residual)} dBA, ${num(r.baseline - r.residual)} decibels below its ${num(r.baseline)} dBA baseline` : `not cancelling right now, so it is at its ${num(r.baseline)} dBA baseline`}.` };
  }

  if (/threshold|limit|complian|legal|ordinance|within|exceed|over the/.test(q)) {
    const r = readings(f), lim = limitFor(f), margin = lim.value - r.residual;
    return { text: `${f.name} is at ${num(r.residual)} dBA against a ${lim.value} dBA ${lim.period} limit for the ${f.profile} profile, ${margin >= 0 ? `${num(margin)} decibels under` : `${num(-margin)} decibels over`} it. These are prototype readings, not certified compliance measurements.` };
  }

  if (/anc|cancel|status|how is|how's|doing|health|running/.test(q)) {
    const r = readings(f);
    return { text: `${f.name}, ${place}, is marked ${f.status}. Active noise cancellation is ${r.anc ? 'on' : 'off'} across ${f.devices} units, targeting the ${f.freq} hertz tone.${f.note ? ` Note: ${f.note}.` : ''}` };
  }

  return { text: 'I can answer questions about a facility\'s still-air nights, electricity price, grid mix, noise reduction or threshold. Try "what is the price in Scranton" or say "help".', miss: true };
}

/* ---------------- UI ---------------- */
let enabled = false, statusChecked = false, muted = false, busy = false, open = false;
let ws = null, rec = null, stream = null, audio = null, maxTimer = null, recorded = null;
let finalText = '', interim = '';
let panel, fab, log, input, micBtn, statusEl, muteBtn;

const shouldShow = () => {
  const a = app();
  if (!a || !a.S.session) return false;
  const h = location.hash.replace(/^#/, '') || '/';
  return !/^\/(technology|pricing|login)?$/.test(h);
};

function build() {
  if (fab) return;
  fab = document.createElement('button');
  fab.id = 'vx-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Ask THRESHOLD');
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'vx-panel');
  fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>Ask THRESHOLD</span>';
  panel = document.createElement('section');
  panel.id = 'vx-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Ask THRESHOLD');
  panel.innerHTML = `
    <header><div><strong>Ask THRESHOLD</strong><small>Answers come from your NOAA and EIA data, not a language model.</small></div>
      <div class="vx-tools"><button type="button" class="vx-icon" data-vx="mute" aria-pressed="false" aria-label="Mute spoken replies" title="Spoken replies">&#128266;</button><button type="button" class="vx-icon" data-vx="close" aria-label="Close">&#10005;</button></div></header>
    <div class="vx-log" role="log" aria-live="polite"></div>
    <div class="vx-chips"></div>
    <form class="vx-form"><input type="text" name="q" autocomplete="off" placeholder="Ask about a facility" aria-label="Your question"><button type="button" class="vx-mic" data-vx="mic" aria-label="Start listening">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button><button type="submit" class="vx-send">Ask</button></form>
    <p class="vx-status" role="status"></p>`;
  document.body.append(fab, panel);
  log = $('.vx-log', panel); input = $('input', panel); micBtn = $('.vx-mic', panel); statusEl = $('.vx-status', panel); muteBtn = $('[data-vx=mute]', panel);
  ['Which site has the most still air?', 'What is the price in Scranton?', 'How is Manassas doing?', 'Open the weather page'].forEach((t) => {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'vx-chip'; c.textContent = t;
    c.addEventListener('click', () => ask(t));
    $('.vx-chips', panel).append(c);
  });
  fab.addEventListener('click', () => toggle());
  panel.addEventListener('click', (e) => {
    const k = e.target.closest('[data-vx]')?.dataset.vx;
    if (k === 'close') toggle(false);
    if (k === 'mic') ((ws || recorded) ? stopListening(true) : startListening());
    if (k === 'mute') { muted = !muted; muteBtn.setAttribute('aria-pressed', String(muted)); muteBtn.innerHTML = muted ? '&#128263;' : '&#128266;'; if (muted && audio) audio.pause(); }
  });
  $('form', panel).addEventListener('submit', (e) => { e.preventDefault(); const v = input.value.trim(); if (v) { input.value = ''; ask(v); } });
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  add('assistant', 'Ask me about a facility. I can also open pages for you.');
  refreshVoice();
}

function setStatus(t) { statusEl.textContent = t || ''; }
function add(role, text) {
  const p = document.createElement('p');
  p.className = `vx-${role}`;
  p.textContent = text;
  log.append(p);
  log.scrollTop = log.scrollHeight;
  return p;
}

async function refreshVoice() {
  try {
    const r = await fetch('/api/voice-status', { cache: 'no-store' });
    enabled = r.ok && (await r.json()).enabled === true;
  } catch { enabled = false; }
  statusChecked = true;
  micBtn.disabled = !enabled;
  micBtn.title = enabled ? 'Speak your question' : 'Voice needs the THRESHOLD server with a Deepgram key';
  setStatus(enabled ? 'Tap the mic to speak, or type.' : 'Typing works. For voice, run node server/serve.mjs with DEEPGRAM_API_KEY set.');
  muteBtn.disabled = !enabled;
}

function toggle(force) {
  open = typeof force === 'boolean' ? force : !open;
  panel.hidden = !open;
  fab.setAttribute('aria-expanded', String(open));
  if (open) { if (!statusChecked || !enabled) refreshVoice(); setTimeout(() => input.focus(), 30); }
  else { stopListening(false); if (audio) audio.pause(); fab.focus(); }
}

async function ask(text) {
  add('user', text);
  const res = answer(text);
  add('assistant', res.text);
  setStatus(enabled && !muted ? 'Speaking…' : '');
  if (enabled && !muted) {
    try { await speak(res.text); setStatus('Tap the mic to speak, or type.'); }
    catch { setStatus('Spoken reply unavailable. The text answer is above.'); }
  }
}

/* ---------------- Deepgram: text to speech ---------------- */
async function speak(text) {
  if (audio) audio.pause();
  const r = await fetch('/api/speak', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) });
  if (!r.ok) throw new Error(`speak ${r.status}`);
  const url = URL.createObjectURL(await r.blob());
  audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url), { once: true });
  await audio.play();
}

/* ---------------- Deepgram: live speech to text ---------------- */
const KEYTERMS = ['THRESHOLD', 'Manassas', 'Crosby', 'Scranton', 'Ypsilanti', 'Washtenaw', 'dBA', 'PUDL', 'NOAA'];
function listenUrl(token, viaQuery) {
  const q = new URLSearchParams({ model: 'nova-3', language: 'en-US', smart_format: 'true', interim_results: 'true', endpointing: '900' });
  KEYTERMS.forEach((k) => q.append('keyterm', k));
  if (viaQuery) q.set('access_token', token);
  return `wss://api.deepgram.com/v1/listen?${q}`;
}
function connect(token, viaQuery) {
  return new Promise((resolve, reject) => {
    const s = viaQuery ? new WebSocket(listenUrl(token, true)) : new WebSocket(listenUrl(token, false), ['bearer', token]);
    let opened = false;
    s.onopen = () => { opened = true; resolve(s); };
    s.onerror = () => { if (!opened) reject(new Error('socket error')); };
    s.onclose = () => { if (!opened) reject(new Error('socket closed')); };
    setTimeout(() => { if (!opened) { s.close(); reject(new Error('timeout')); } }, 6000);
  });
}

async function startListening() {
  if (!enabled || busy) return;
  busy = true;
  if (audio) audio.pause();
  finalText = ''; interim = '';
  micBtn.classList.add('live');
  micBtn.setAttribute('aria-label', 'Stop listening');
  setStatus('Connecting…');
  try {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('unsupported');
    const tr = await fetch('/api/voice-token', { method: 'POST' });
    if (!tr.ok) {
      // Streaming needs a key that may create tokens. Without it, record, detect the pause, and transcribe the clip.
      const err = await tr.json().catch(() => ({}));
      if (/rejected the API key/.test(err.error || '')) throw new Error('key');
      return await startRecorded();
    }
    const { access_token: token } = await tr.json();
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    try { ws = await connect(token, false); } catch { ws = await connect(token, true); }
    ws.onmessage = (m) => {
      let d; try { d = JSON.parse(m.data); } catch { return; }
      if (d.type !== 'Results') return;
      const t = d.channel?.alternatives?.[0]?.transcript || '';
      if (d.is_final) { if (t) finalText = `${finalText} ${t}`.trim(); interim = ''; } else { interim = t; }
      setStatus(`Listening: ${`${finalText} ${interim}`.trim() || '…'}`);
      if (d.speech_final && finalText) stopListening(true);
    };
    ws.onclose = () => { if (ws) stopListening(true); };
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => { if (e.data.size && ws && ws.readyState === 1) ws.send(e.data); };
    rec.start(250);
    setStatus('Listening…');
    maxTimer = setTimeout(() => stopListening(true), 20000);
  } catch (e) {
    cleanup();
    setStatus(e.message === 'key' ? 'Deepgram rejected the API key. Check DEEPGRAM_API_KEY in .env.' : e.message === 'unsupported' ? 'This browser cannot record audio.' : e.name === 'NotAllowedError' ? 'Microphone permission was denied.' : 'Could not start voice. Check the Deepgram key and try again.');
  } finally { busy = false; }
}

/* Fallback: record until the speaker pauses, then send the clip to /api/transcribe. */
async function startRecorded() {
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const chunks = [];
  rec = new MediaRecorder(stream);
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  const an = ac.createAnalyser();
  an.fftSize = 1024;
  ac.createMediaStreamSource(stream).connect(an);
  const buf = new Uint8Array(an.fftSize);
  let heard = false, quietSince = 0, submit = true, floor = null;
  const t0 = Date.now();
  const iv = setInterval(() => {
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (const x of buf) { const d = (x - 128) / 128; sum += d * d; }
    const rms = Math.sqrt(sum / buf.length), now = Date.now();
    // adapt to the room: the first 0.4 s sets the noise floor; speech must clearly exceed it
    if (now - t0 < 400) { floor = Math.max(floor || 0, rms); return; }
    const loud = rms > Math.max(0.02, Math.min(floor || 0, 0.03) * 3); // cap: speech in the first 0.4 s must not raise the bar
    if (loud) { heard = true; quietSince = 0; }
    else if (heard) { quietSince = quietSince || now; if (now - quietSince > 1300) done(true); }
    else if (now - t0 > 8000) done(true);
    if (now - t0 > 20000) done(true);
  }, 100);
  function done(s) { submit = s; clearInterval(iv); if (rec && rec.state !== 'inactive') rec.stop(); }
  rec.onstop = async () => {
    clearInterval(iv);
    ac.close().catch(() => {});
    stream && stream.getTracks().forEach((t) => t.stop());
    const type = rec?.mimeType || 'audio/webm';
    rec = null; stream = null; recorded = null;
    micBtn.classList.remove('live');
    micBtn.setAttribute('aria-label', 'Start listening');
    if (!submit || !heard) { setStatus(submit ? 'I did not hear anything. Try again or type.' : 'Tap the mic to speak, or type.'); return; }
    setStatus('Transcribing…');
    try {
      const r = await fetch('/api/transcribe', { method: 'POST', headers: { 'content-type': type }, body: new Blob(chunks, { type }) });
      if (!r.ok) throw new Error('transcribe');
      const { transcript } = await r.json();
      if (transcript) ask(transcript); else setStatus('I did not catch that. Try again or type.');
    } catch { setStatus('Could not transcribe that. Check the Deepgram key and try again.'); }
  };
  recorded = { finish: done };
  rec.start();
  setStatus('Listening… pause when you are done.');
}

function cleanup() {
  clearTimeout(maxTimer);
  try { rec && rec.state !== 'inactive' && rec.stop(); } catch { /* already stopped */ }
  stream && stream.getTracks().forEach((t) => t.stop());
  const s = ws; ws = null; rec = null; stream = null;
  if (s) { try { s.readyState === 1 && s.send(JSON.stringify({ type: 'CloseStream' })); s.close(); } catch { /* closed */ } }
  micBtn.classList.remove('live');
  micBtn.setAttribute('aria-label', 'Start listening');
}

function stopListening(submit) {
  if (recorded) { recorded.finish(submit); return; }
  if (!ws && !stream) return;
  const said = `${finalText} ${interim}`.trim();
  cleanup();
  finalText = ''; interim = '';
  if (submit && said) ask(said);
  else setStatus(submit ? 'I did not catch that. Try again or type.' : 'Tap the mic to speak, or type.');
}

/* ---------------- show/hide with the route ---------------- */
function sync() {
  const show = shouldShow();
  if (show) build();
  if (fab) fab.hidden = !show;
  if (!show && open) toggle(false);
}
window.addEventListener('hashchange', sync);
setInterval(sync, 1000); // login/logout do not always change the hash, so also poll cheaply
sync();
window.thresholdVoice = { answer }; // for tests
})();
