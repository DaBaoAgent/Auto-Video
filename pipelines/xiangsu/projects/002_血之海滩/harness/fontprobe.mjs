import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(HERE);
const WEBROOT = path.resolve(ROOT, '..', '..', '..');
const PAGE_URL = '/xiangsu/projects/' + path.basename(ROOT) + '/index.html';
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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1200, height: 800 } });
const page = await browser.newPage();
await page.goto(`http://127.0.0.1:${port}${PAGE_URL}`, { waitUntil: 'load' });
 page.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure()?.errorText));
 await page.waitForFunction('window.__ready === true', { timeout: 60000 }).catch(e => console.log('[no ready]', e.message));
const out = await page.evaluate(async () => {
  const f = '12px "Fusion Pixel 12"';
  const ok12 = document.fonts.check(f);
  const ok36 = document.fonts.check('36px "Fusion Pixel 12"');
  const fonts = [...document.fonts].map(x => `${x.family}/${x.weight}/${x.status}`);
  function probe(str, size) {
    const c = document.createElement('canvas');
    c.width = 200; c.height = 80;
    const g = c.getContext('2d');
    g.font = `${size}px "Fusion Pixel 12"`;
    const m = g.measureText(str);
    g.textBaseline = 'top'; g.fillStyle = '#fff';
    g.fillText(str, 2, 4);
    const d = g.getImageData(0, 0, 200, 80).data;
    let maxA = 0, cnt = 0;
    for (let i = 3; i < d.length; i += 4) { if (d[i] > maxA) maxA = d[i]; if (d[i] > 8) cnt++; }
    // 3x3 抽样成 ASCII
    const S = size / 3;
    const lines = [];
    for (let j = 0; j < 12; j++) {
      let row = '';
      for (let i = 0; i < 40; i++) {
        let best = 0;
        for (let sj = 0; sj < 3; sj++) for (let si = 0; si < 3; si++) {
          const x = i * 3 + si, y = Math.round(j * S) + sj;
          const a = d[(y * 200 + x) * 4 + 3];
          if (a > best) best = a;
        }
        row += best >= 40 ? '#' : (best >= 8 ? '.' : ' ');
      }
      lines.push(row.replace(/\s+$/, ''));
    }
    return { w: m.width, maxA, cnt, lines };
  }
  return { ok12, ok36, fonts, p12: probe('你看过十三号', 12), p36: probe('你看过十三号', 36) };
});
console.log(JSON.stringify({ ok12: out.ok12, ok36: out.ok36, fonts: out.fonts }));
console.log('--- 12px measure', out.p12.w.toFixed(1), 'maxA', out.p12.maxA, 'px', out.p12.cnt);
console.log(out.p12.lines.join('\n'));
console.log('--- 36px measure', out.p36.w.toFixed(1), 'maxA', out.p36.maxA);
console.log(out.p36.lines.join('\n'));
await browser.close();
server.close();
