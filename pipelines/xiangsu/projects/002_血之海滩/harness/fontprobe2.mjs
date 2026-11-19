import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const WEBROOT = path.resolve(ROOT, '..', '..', '..');
const CHROME = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe';
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const p = path.join(WEBROOT, url);
  if (!fs.existsSync(p)) { res.writeHead(404); res.end('404'); return; }
  res.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.css': 'text/css' }[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure()?.errorText));
await page.goto(`http://127.0.0.1:${port}/xiangsu/projects/${path.basename(ROOT)}/index.html`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 60000 }).catch(e => console.log('[noready]', e.message));
const out = await page.evaluate(() => {
  const chars = '血之海滩你看过十三号';
  const res = [];
  for (const ch of chars) {
    const c = document.createElement('canvas');
    c.width = 30; c.height = 30;
    const g = c.getContext('2d');
    g.font = '12px "Fusion Pixel 12"';
    g.textBaseline = 'top';
    g.fillStyle = '#fff';
    g.fillText(ch, 2, 2);
    const d = g.getImageData(0, 0, 30, 30).data;
    const lines = [];
    for (let y = 0; y < 20; y++) {
      let row = '';
      for (let x = 0; x < 18; x++) {
        const a = d[(y * 30 + x) * 4 + 3];
        row += a >= 100 ? '#' : (a >= 20 ? '+' : ' ');
      }
      lines.push(row);
    }
    res.push({ ch, w: g.measureText(ch).width, lines });
  }
  return res;
});
for (const r of out) {
  console.log(`--- ${r.ch} w=${r.w.toFixed(1)}`);
  console.log(r.lines.join('\n'));
}
await browser.close();
server.close();
