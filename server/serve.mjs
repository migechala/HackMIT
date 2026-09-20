// THRESHOLD web server: serves web/ and keeps the Deepgram API key server-side.
//
//   node server/serve.mjs            (default http://localhost:4200, override with PORT)
//
// The key is read from DEEPGRAM_API_KEY (environment) or a .env file at the repo root (gitignored).
// The browser never sees it:
//   GET  /api/voice-status  -> { enabled }
//   POST /api/voice-token   -> short-lived Deepgram token for live speech-to-text (60 s, WebSocket handshake only)
//   POST /api/speak         -> proxies Deepgram text-to-speech, returns audio
// No dependencies (Node 18+).

import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const WEB = join(ROOT, 'web');
const PORT = Number(process.env.PORT || 4200);
const TTS_MODEL = process.env.DEEPGRAM_TTS_MODEL || 'aura-2-thalia-en';

function loadKey() {
  if (process.env.DEEPGRAM_API_KEY) return process.env.DEEPGRAM_API_KEY.trim();
  const envFile = join(ROOT, '.env');
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*DEEPGRAM_API_KEY\s*=\s*(.*?)\s*$/);
      if (m) return m[1].replace(/^['"]|['"]$/g, '');
    }
  }
  return '';
}
const currentKey = () => loadKey(); // re-read on every request, so pasting the key into .env needs no restart

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

// Same-origin only: a page on another site must not be able to spend your Deepgram credit.
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin GET/POST from our own pages may omit it
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

function readBody(req, limit = 4096) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// Deepgram answers 401 (and 400 on the token endpoint) when the key is not valid.
const badKey = (status) => (status === 401 || status === 400 ? 'Deepgram rejected the API key. Check DEEPGRAM_API_KEY in .env (use the key secret, not the key ID, from console.deepgram.com).' : '');

async function handleApi(req, res, path) {
  if (!sameOrigin(req)) return json(res, 403, { error: 'cross-origin request refused' });
  if (path === '/api/voice-status' && req.method === 'GET') return json(res, 200, { enabled: !!currentKey(), ttsModel: TTS_MODEL });
  const KEY = currentKey();
  if (!KEY) return json(res, 503, { error: 'DEEPGRAM_API_KEY is not set on the server' });

  if (path === '/api/voice-token' && req.method === 'POST') {
    const r = await fetch('https://api.deepgram.com/v1/auth/grant', {
      method: 'POST',
      headers: { Authorization: `Token ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ttl_seconds: 60 }),
    });
    if (!r.ok) return json(res, 502, { error: badKey(r.status) || `Deepgram token request failed (${r.status})` });
    const d = await r.json();
    return json(res, 200, { access_token: d.access_token, expires_in: d.expires_in });
  }

  if (path === '/api/speak' && req.method === 'POST') {
    let text = '';
    try { text = String(JSON.parse(await readBody(req)).text || '').trim(); } catch { return json(res, 400, { error: 'bad request' }); }
    if (!text) return json(res, 400, { error: 'no text' });
    text = text.slice(0, 600); // short answers only; Aura allows 2000 per request
    const r = await fetch(`https://api.deepgram.com/v1/speak?model=${encodeURIComponent(TTS_MODEL)}`, {
      method: 'POST',
      headers: { Authorization: `Token ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) return json(res, 502, { error: badKey(r.status) || `Deepgram speech request failed (${r.status})` });
    res.writeHead(200, { 'content-type': r.headers.get('content-type') || 'audio/mpeg', 'cache-control': 'no-store' });
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  return json(res, 404, { error: 'not found' });
}

function serveStatic(req, res, path) {
  let rel = decodeURIComponent(path);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = normalize(join(WEB, rel));
  if (file !== WEB && !file.startsWith(WEB + sep)) { res.writeHead(403); return res.end('forbidden'); }
  if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404); return res.end('not found'); }
  const size = statSync(file).size;
  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) { res.writeHead(416, { 'content-range': `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes', 'cache-control': 'no-cache' });
  createReadStream(file).pipe(res);
}

createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://x').pathname;
    if (path.startsWith('/api/')) return await handleApi(req, res, path);
    return serveStatic(req, res, path);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'server error' });
    else res.end();
  }
}).listen(PORT, () => {
  console.log(`THRESHOLD on http://localhost:${PORT}`);
  console.log(currentKey() ? 'Deepgram voice: enabled' : 'Deepgram voice: disabled (set DEEPGRAM_API_KEY or add it to .env)');
});
