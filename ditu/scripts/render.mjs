// ditu / pingban 共用逐帧渲染器 · node scripts/render.mjs <project> [--fps 24] [--out <mp4>] [--width 1920] [--height 1080] [--quality 92] [--from 0] [--to <秒>]
//
// 页面契约（两个项目都遵守，和 lemo-opuscar 一致）：
//   window.READY    资源与字体加载完成、第一帧已画好 → true
//   window.DUR      片长（秒）
//   window.render(t) 把 t 秒那一帧画到画布上（必须幂等，禁 Date.now / Math.random）
//
// 机制：本地起静态服务器 → playwright-core 开 chromium-headless-shell → 逐帧 evaluate(render, t) +
//      screenshot(jpeg) 直接 pipe 给 ffmpeg → 出来的 mp4 是无声母版，混音交给 scripts/<管线>.py mux。
// 依赖只认 playwright-core：优先 $PLAYWRIGHT_CORE，其次同级 lemo-opuscar 的 node_modules，再次全局。
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn } from 'child_process';
import { createRequire } from 'module';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const project = path.resolve(args[0] || '.');
if (!fs.existsSync(path.join(project, 'index.html'))) {
  console.error(`✗ ${project} 里没有 index.html：第一个参数要指向一个工程目录（projects/<编号_名>）`);
  process.exit(2);
}
const FPS = +opt('--fps', 24);
const W = +opt('--width', 1920), H = +opt('--height', 1080);
const QUALITY = +opt('--quality', 92);
const FROM = +opt('--from', 0);
const out = path.resolve(opt('--out', path.join(project, 'out', 'video.mp4')));
fs.mkdirSync(path.dirname(out), { recursive: true });

// —— playwright-core 定位：$PLAYWRIGHT_CORE → 工程目录逐级向上找 node_modules → 同机的 lemo-opuscar → 全局 ——
const require = createRequire(import.meta.url);
const findUp = (name, start) => {
  let d = start;
  while (true) {
    const p = path.join(d, 'node_modules', name);
    if (fs.existsSync(p)) return p;
    const up = path.dirname(d);
    if (up === d) return null;
    d = up;
  }
};
const CANDIDATES = [
  process.env.PLAYWRIGHT_CORE,
  findUp('playwright-core', project),
  process.env.LEMO_OPUSCAR_HOME && path.join(process.env.LEMO_OPUSCAR_HOME, 'node_modules', 'playwright-core'),
  'D:/@kaifa/lemo-opuscar/node_modules/playwright-core',
  `C:/Users/${process.env.USERNAME}/lemo-opuscar/node_modules/playwright-core`,
  path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'playwright-core')
].filter(Boolean);
let chromium = null, source = '';
for (const c of CANDIDATES) {
  try { chromium = require(c).chromium; source = c; break; } catch {}
}
if (!chromium) {
  console.error('✗ 找不到 playwright-core。装一次即可：npm i -g playwright-core，或用 $PLAYWRIGHT_CORE 指向它。');
  process.exit(2);
}

// —— 静态服务器（只服务工程目录）——
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml'
};
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(project, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(project)) { res.writeHead(403).end('forbidden'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const ARGS = ['--enable-gpu', '--ignore-gpu-blocklist', '--font-render-hinting=none', '--force-color-profile=srgb'];
if (process.env.LEMO_ANGLE && process.env.LEMO_ANGLE !== 'default') ARGS.push(`--use-angle=${process.env.LEMO_ANGLE}`);

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROME || undefined, args: ARGS });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('pageerror', e => console.error('[page] ' + e.message));
page.on('console', m => { if (m.type() === 'error') console.error('[console] ' + m.text()); });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
await page.waitForFunction(() => window.READY === true, null, { timeout: 120000, polling: 100 });
await page.evaluate(() => document.fonts && document.fonts.ready);

const lost = await page.evaluate(() => window.__glLost || null);
if (lost) console.error(`! ${lost} 的 WebGL 上下文丢了，画面会全黑：用 LEMO_ANGLE=swiftshader 重跑。`);

const DUR = await page.evaluate(() => window.DUR);
const TO = Math.min(+opt('--to', DUR), DUR);

// —— 静帧模式：--still 1.5,9.2 → out/stills/t_<秒>.jpg，改一个节拍先看它 ——
const STILLS = opt('--still', null);
if (STILLS) {
  const dir = path.join(project, 'out', 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of STILLS.split(',').map(x => +x.trim()).filter(x => !isNaN(x))) {
    await page.evaluate(t => window.render(t), s);
    const f = path.join(dir, `t_${s.toFixed(1)}.jpg`);
    await page.screenshot({ path: f, type: 'jpeg', quality: QUALITY, clip: { x: 0, y: 0, width: W, height: H } });
    console.log(`  ${f}`);
  }
  await browser.close();
  server.close();
  process.exit(0);
}

const TOTAL = Math.max(1, Math.round((TO - FROM) * FPS));
console.log(`· ${path.basename(project)}  ${W}×${H} @${FPS}fps  ${FROM}–${TO.toFixed(3)}s → ${TOTAL} 帧  (playwright: ${source})`);

const ff = spawn('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-r', String(FPS), '-movflags', '+faststart', out
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((res, rej) => ff.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));

const t0 = Date.now();
for (let i = 0; i < TOTAL; i++) {
  await page.evaluate(t => window.render(t), FROM + i / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: QUALITY, clip: { x: 0, y: 0, width: W, height: H } });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 120 === 0 || i === TOTAL - 1) {
    const el = (Date.now() - t0) / 1000;
    process.stdout.write(`  ${i + 1}/${TOTAL}  ${el.toFixed(0)}s\r`);
  }
}
ff.stdin.end();
await ffDone;
await browser.close();
server.close();
const sec = (Date.now() - t0) / 1000;
console.log(`\n✓ ${out}  ${TOTAL} 帧  ${sec.toFixed(0)}s  ${(TOTAL / sec).toFixed(1)} fps`);
