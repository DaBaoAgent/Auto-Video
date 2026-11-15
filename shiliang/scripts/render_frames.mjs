#!/usr/bin/env node
// shiliang · deterministic page → PNG/JPEG frames.
// Page protocol (same as mg-styles-15 harness): window.DEMO + window.renderAt(t) + window.__ready.
//
// Usage:
//   node shiliang/scripts/render_frames.mjs <slug> [--page index.html] [--from 0] [--to 30]
//   node shiliang/scripts/render_frames.mjs <slug> --stills 0,1.5,7.7,21.2
// Env: SHILIANG_EDGE (browser path), PC_FMT=jpeg, PC_Q=95
// Output: shiliang/projects/<slug>/frames/NNNN.png (or .jpg), stills under out/stills/
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const require = createRequire(path.join(ROOT, 'scripts', 'render_frames.mjs'));
const puppeteer = require('puppeteer-core');

const EDGE = process.env.SHILIANG_EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FPS = 30, W = 1920, H = 1080;
const FMT = (process.env.PC_FMT || 'png').toLowerCase();
const QUALITY = +(process.env.PC_Q || 95);

const argv = process.argv.slice(2);
const slug = argv[0] && !argv[0].startsWith('--') ? argv[0] : '010_shengming30';
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const PAGE = opt('page', 'index.html');
const SITE = path.join(ROOT, 'projects', slug);
const outDir = path.join(SITE, 'frames');
const stillDir = path.join(SITE, 'out', 'stills');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.wav': 'audio/wav', '.ttf': 'font/ttf', '.otf': 'font/otf', '.css': 'text/css' };
const srv = http.createServer((req, res) => {
  try {
    let p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end('404 ' + req.url); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(p).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${srv.address().port}/projects/${slug}/${PAGE}`;

const dbgPort = await new Promise(res => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
});
const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'xuni-edge-'));
const proc = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${dbgPort}`, `--user-data-dir=${udd}`,
  '--use-angle=d3d11', '--no-sandbox', '--disable-gpu-watchdog',
  '--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb',
  '--disable-background-timer-throttling', '--disable-gpu-vsync', '--disable-frame-rate-limit',
  '--disable-renderer-backgrounding', '--hide-scrollbars', '--mute-audio',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank',
], { stdio: 'ignore' });
const wsUrl = await new Promise((res, rej) => {
  const t0 = Date.now();
  const tick = async () => {
    try { const r = await fetch(`http://127.0.0.1:${dbgPort}/json/version`); if (r.ok) return res((await r.json()).webSocketDebuggerUrl); } catch {}
    if (Date.now() - t0 > 30000) return rej(new Error('Edge DevTools timeout'));
    setTimeout(tick, 250);
  };
  tick();
});
const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, protocolTimeout: 600000 });
const page = await browser.newPage();
page.on('pageerror', e => console.log('[page error]', e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warn') console.log('[console]', m.text()); });
await page.setViewport({ width: W, height: H });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__ready === true', { timeout: 120000, polling: 100 });
await page.evaluate(() => document.fonts && document.fonts.ready);

const shot = (p) => page.screenshot(FMT === 'jpeg' ? { path: p, type: 'jpeg', quality: QUALITY } : { path: p, type: 'png' });

const stills = opt('stills', null);
if (stills) {
  fs.mkdirSync(stillDir, { recursive: true });
  const ts = String(stills).split(',').map(Number).filter(n => !Number.isNaN(n));
  const t0 = Date.now();
  for (const t of ts) {
    await page.evaluate(tt => window.renderAt(tt), t);
    const f = path.join(stillDir, `t${t.toFixed(2).padStart(6, '0')}.${FMT === 'jpeg' ? 'jpg' : 'png'}`);
    await shot(f);
    console.log(f);
  }
  console.log(`STILLS ${ts.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else {
  const DUR = +opt('dur', 30);
  const FROM = +opt('from', 0), TO = +opt('to', DUR);
  fs.mkdirSync(outDir, { recursive: true });
  const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS);
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate(tt => window.renderAt(tt), f / FPS);
    await shot(path.join(outDir, `${String(f).padStart(4, '0')}.${FMT === 'jpeg' ? 'jpg' : 'png'}`));
    if ((f - f0) % 60 === 0 || f === f1 - 1) console.log(`frame ${f}/${f1 - 1}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  console.log(`DONE slug=${slug} frames ${f0}-${f1 - 1} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

await browser.close();
try { proc.kill(); } catch {}
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}
srv.close();
process.exit(0);
