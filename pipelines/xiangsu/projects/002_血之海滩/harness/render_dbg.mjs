// xiangsu 逐帧捕获 harness（puppeteer-core + 本机 Chrome）
// 用法：
//   node harness/render.mjs --stills 2.3,4.6,7.3        # 目检关键帧
//   node harness/render.mjs --frames [--fps 30] [--duration 21.46]
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
// 静态根放到 Auto-Video（字体、assets 都在那层），页面 URL 走工程相对路径
const WEBROOT = path.resolve(ROOT, '..', '..', '..');
const PAGE_URL = '/xiangsu/projects/' + path.basename(ROOT) + '/index_dbg.html';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const has = k => argv.includes(k);

const FPS = Number(arg('--fps', 30));
const DUR = Number(arg('--duration', 21.46));
const OUT = arg('--out', path.join(ROOT, 'out'));
const STILLS = arg('--stills', '');
const W = Number(arg('--w', 1920));
const H = Number(arg('--h', 1080));

const CHROME = arg('--chrome', process.env.AV_CHROME ||
  'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.css': 'text/css' };

function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
      const p = url === '/' ? path.join(ROOT, 'index_dbg.html') : path.join(WEBROOT, url);
      if (!p.startsWith(WEBROOT) || !fs.existsSync(p)) { res.writeHead(404); res.end('404'); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const server = await serve();
  const port = server.address().port;
  const shotsDir = path.join(OUT, 'stills');
  const framesDir = path.join(OUT, 'frames');
  fs.mkdirSync(shotsDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb', '--font-render-hinting=none',
      `--window-size=${W},${H}`],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  const page = await browser.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text()); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}${PAGE_URL}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  console.log('[ready]', JSON.stringify(await page.evaluate('window.__stats()')));

  const canvas = await page.$('#c');

  if (STILLS) {
    for (const s of STILLS.split(',').map(Number)) {
      await page.evaluate(t => window.renderAt(t), s);
      const buf = await canvas.screenshot({ type: 'png' });
      const file = path.join(shotsDir, `still_${s.toFixed(2)}.png`);
      fs.writeFileSync(file, buf);
      console.log('[still]', file);
    }
  }

  if (has('--frames')) {
    fs.rmSync(framesDir, { recursive: true, force: true });
    fs.mkdirSync(framesDir, { recursive: true });
    const total = Math.round(FPS * DUR);
    const t0 = Date.now();
    for (let i = 0; i < total; i++) {
      await page.evaluate(t => window.renderAt(t), i / FPS);
      const buf = await canvas.screenshot({ type: 'png' });
      fs.writeFileSync(path.join(framesDir, `${String(i).padStart(5, '0')}.png`), buf);
      if (i % 60 === 0) {
        const el = (Date.now() - t0) / 1000;
        console.log(`[frame] ${i}/${total}  ${el.toFixed(1)}s  (${(i / el).toFixed(1)} fps)`);
      }
    }
    console.log(`[frames done] ${total} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  await browser.close();
  server.close();
}

main().catch(e => { console.error(e); process.exit(1); });
