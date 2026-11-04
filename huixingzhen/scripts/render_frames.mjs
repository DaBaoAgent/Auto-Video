#!/usr/bin/env node
// paperclip 管线 · 确定性渲染器（通用）
// 页面协议（同 mg-styles-15 harness）：window.DEMO + window.renderAt(t) + window.__ready
//
// 用法：
//   node scripts/render_frames.mjs <slug> [--page index20.html] [--dur 20] [--fps 30] [--from 0] [--to 20]
//   环境变量：PC_EDGE（浏览器路径，默认 msedge）、PC_SCALE（deviceScaleFactor）
// 输出：projects/<slug>/frames/NNNN.png
// 注意：Edge 154 上 puppeteer.launch 会静默退出，必须自行 spawn + connect。
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('D:/@kaifa/Auto-Video/shouhui/scripts/render.mjs'); // 复用既有 puppeteer-core
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = process.env.PC_EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FPS = 30, W = 1920, H = 1080;
// PC_FMT=jpeg 可显著加速（带纹理的深色底图用 PNG 编码极慢）；PC_Q 为 jpeg 质量
const FMT = (process.env.PC_FMT || 'png').toLowerCase();
const QUALITY = +(process.env.PC_Q || 95);

// ---- 参数 ----
const argv = process.argv.slice(2);
const slug = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'paperclip_zhou';
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const PAGE = opt('page', 'index.html');
const DUR = +opt('dur', 10);
const FROM = +opt('from', 0), TO = +opt('to', DUR);
const SITE = path.join(ROOT, 'projects', slug);
const outDir = path.join(SITE, 'frames');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.wav': 'audio/wav', '.ttf': 'font/ttf' };
const srv = http.createServer((req, res) => {
  try {
    let p = path.join(SITE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end('404'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(p).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${srv.address().port}/${PAGE}`;

// ---- spawn Edge + connect（勿用 puppeteer.launch）----
const dbgPort = await new Promise(res => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
});
const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'pc-edge-'));
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
page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
await page.setViewport({ width: W, height: H });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__ready === true', { timeout: 60000, polling: 100 });
await page.evaluate(() => document.fonts && document.fonts.ready);

fs.mkdirSync(outDir, { recursive: true });
const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS);
const t0 = Date.now();
for (let f = f0; f < f1; f++) {
  await page.evaluate(tt => window.renderAt(tt), f / FPS);
  await page.screenshot(FMT === 'jpeg'
    ? { path: path.join(outDir, `${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: QUALITY }
    : { path: path.join(outDir, `${String(f).padStart(4, '0')}.png`), type: 'png' });
  if ((f - f0) % 60 === 0 || f === f1 - 1) console.log(`frame ${f}/${f1 - 1}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
await browser.close();
try { proc.kill(); } catch {}
try { fs.rmSync(udd, { recursive: true, force: true }); } catch {}   // Edge 句柄可能未释放，容错
srv.close();
console.log(`DONE slug=${slug} frames ${f0}-${f1 - 1} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
process.exit(0);
