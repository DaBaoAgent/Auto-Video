#!/usr/bin/env node
// STYLE-FRAMES · 风格管线的通用抓帧器
//
// 页面协议（与仓库既有渲染器一致）：
//   window.__ready === true     页面就绪
//   window.renderAt(t)          把画面画到第 t 秒（必须整帧重画）
//
// 用法：
//   node vendor/runtime/style-frames.mjs --project pipelines/muke/projects/demo \
//        [--w 1920] [--h 1080] [--fps 30] [--dur 10] \
//        [--stills 0.6,3.2,7.5] [--out <dir>] [--from 0] [--to 10]
//
// 环境变量：
//   STYLE_EDGE     浏览器路径（默认 Edge）
//   STYLE_PUPPETEER puppeteer-core 所在目录（默认按仓库内几处 node_modules 探测）
//   PC_FMT / PC_Q  输出格式与质量（png / jpeg）
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const argv = process.argv.slice(2);
const opt = (k, d) => {
  const i = argv.indexOf('--' + k);
  return i >= 0 ? argv[i + 1] : d;
};

const PROJECT = path.resolve(REPO, opt('project', 'pipelines/muke/projects/demo'));
const W = +opt('w', 1920), H = +opt('h', 1080), FPS = +opt('fps', 30);
const FMT = (process.env.PC_FMT || 'png').toLowerCase();
const QUALITY = +(process.env.PC_Q || 95);
const PAGE = opt('page', 'index.html');

if (!fs.existsSync(PROJECT)) {
  console.error('项目目录不存在：' + PROJECT);
  process.exit(2);
}

// puppeteer-core 探测：允许环境变量指定，否则在仓库常见位置找
function findPuppeteer() {
  const cands = [
    process.env.STYLE_PUPPETEER,
    path.join(REPO, 'vendor', 'node_modules', 'puppeteer-core'),
    path.join(REPO, 'dengju', 'node_modules', 'puppeteer-core'),
    path.join(REPO, 'piying', 'node_modules', 'puppeteer-core'),
  ].filter(Boolean);
  for (const c of cands) {
    if (fs.existsSync(path.join(c, 'package.json'))) return c;
  }
  return null;
}
const PP = findPuppeteer();
if (!PP) {
  console.error('找不到 puppeteer-core：请设置 STYLE_PUPPETEER 指向 $project:\\...\\node_modules\\puppeteer-core');
  console.error('（仓库内可用：pipelines 下任一装了 puppeteer-core 的管线，如 dengju）');
  process.exit(3);
}
const require = createRequire(path.join(PP, 'package.json'));
const puppeteer = require(PP);

const EDGE = process.env.STYLE_EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
if (!fs.existsSync(EDGE)) {
  console.error('找不到浏览器：' + EDGE + '（可用 STYLE_EDGE 指定）');
  process.exit(4);
}

// 静态服务：把仓库根挂出来，页面里就能直接引用 /vendor /assets
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2',
  '.wav': 'audio/wav', '.svg': 'image/svg+xml',
};
const srv = http.createServer((req, res) => {
  try {
    let p = path.join(REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    if (!fs.existsSync(p)) { res.writeHead(404); return res.end('404 ' + req.url); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(p).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const rel = path.relative(REPO, PROJECT).split(path.sep).join('/');
const url = `http://127.0.0.1:${srv.address().port}/${rel}/${PAGE}`;

const dbgPort = await new Promise((res) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); });
});
const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'stylekit-edge-'));
const proc = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${dbgPort}`, `--user-data-dir=${udd}`,
  '--use-angle=swiftshader', '--no-sandbox', '--disable-gpu-watchdog',
  // WebGL 页面（lvdong 的 sky.js）在无显示器的 headless 里需要软件光栅，否则上下文秒掉、整帧变白
  '--enable-unsafe-swiftshader',
  '--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb',
  '--disable-background-timer-throttling', '--disable-gpu-vsync', '--disable-frame-rate-limit',
  '--disable-renderer-backgrounding', '--hide-scrollbars', '--mute-audio',
  '--no-first-run', '--no-default-browser-check', '--disable-extensions',
].concat((process.env.STYLE_EXTRA || '').split(' ').filter(Boolean), ['about:blank']),
  { stdio: 'ignore' });

const wsUrl = await new Promise((res, rej) => {
  const t0 = Date.now();
  const tick = async () => {
    try {
      const r = await fetch(`http://127.0.0.1:${dbgPort}/json/version`);
      if (r.ok) return res((await r.json()).webSocketDebuggerUrl);
    } catch { /* 浏览器还没起好 */ }
    if (Date.now() - t0 > 30000) return rej(new Error('Edge DevTools 30s 未就绪'));
    setTimeout(tick, 250);
  };
  tick();
});

const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl, protocolTimeout: 600000 });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[page error]', e.message));
if (process.env.STYLE_DEBUG) {
  page.on('response', (r) => { if (r.status() >= 400) console.log('[http]', r.status(), r.url()); });
  page.on('requestfailed', (r) => console.log('[reqfail]', r.failure()?.errorText, r.url()));
}
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warn') console.log('[console]', m.text());
});
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__ready === true || window.READY === true', { timeout: 180000, polling: 100 });
await page.evaluate(() => document.fonts && document.fonts.ready);
// 两种页面协议都认：新版 __ready/renderAt，旧版 READY/render
const drawAt = (tt) => page.evaluate((t) => (window.renderAt ? window.renderAt(t) : window.render(t)), tt);

const shot = (p) => page.screenshot(FMT === 'jpeg'
  ? { path: p, type: 'jpeg', quality: QUALITY }
  : { path: p, type: 'png' });

const stills = opt('stills', null);
const outDir = path.resolve(PROJECT, opt('out', 'frames'));
const ext = FMT === 'jpeg' ? 'jpg' : 'png';

if (stills) {
  fs.mkdirSync(outDir, { recursive: true });
  const ts = String(stills).split(',').map(Number).filter((n) => !Number.isNaN(n));
  const t0 = Date.now();
  for (const t of ts) {
    await drawAt(t);
    const f = path.join(outDir, `t${t.toFixed(2).padStart(6, '0')}.${ext}`);
    await shot(f);
    console.log(f);
  }
  console.log(`STILLS ${ts.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} else {
  const DUR = +opt('dur', 10);
  const FROM = +opt('from', 0), TO = +opt('to', DUR);
  fs.mkdirSync(outDir, { recursive: true });
  const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS);
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await drawAt(f / FPS);
    await shot(path.join(outDir, `${String(f).padStart(4, '0')}.${ext}`));
    if ((f - f0) % 30 === 0 || f === f1 - 1) {
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${f}/${f1 - 1} (${el.toFixed(0)}s, ${(el / Math.max(1, f - f0 + 1)).toFixed(2)}s/frame)`);
    }
  }
  console.log(`DONE ${rel} frames ${f0}-${f1 - 1} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

await browser.close();
try { proc.kill(); } catch { /* 已退出 */ }
try { fs.rmSync(udd, { recursive: true, force: true }); } catch { /* 临时目录清理失败不影响出帧 */ }
srv.close();
process.exit(0);
