#!/usr/bin/env node
// make_covers.mjs — 封面（§4.4 代码合成备用方案）
//
// 复用全片同一套像素场景：assembled film.js 的副本（coverfilm.js），只做四处小改
//   · UP / 画布尺寸 / 横向裁切改为 window 参数（横版 ×3、竖版 ×4，整数放大不变形）
//   · 扫描线周期跟随 UP
//   · 关字幕（window.__NO_SUB）
// 再在页面上叠「上方 1/3 深色标题区 + 金色行楷标题」。
//
//   node make_covers.mjs --frames 2,9.5,113.8        # 候选帧（无字幕）→ full/out/cover_cand/
//   node make_covers.mjs --final                      # 出 cover_4x3.png / cover_3x4.png
//
// --final 必填（未设置直接报错，避免写进上一部片的交付目录/标题）：
//   XIANGSU_COVER_OUT    封面交付目录（旧名 XIANGSU2_COVER_OUT 仍兼容）
//   XIANGSU_COVER_TITLE  片名（如 波斯湾伊甸园；也可用 XIANGSU_FILM）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.XIANGSU_REPO || process.env.XIANGSU2_REPO || 'D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15';
// 渲染仓库自带 node_modules；本脚本不另装依赖
const puppeteer = createRequire(path.join(REPO, 'package.json'))('puppeteer-core');
const SRC = path.join(REPO, 'demos', 'xiangsu-eden-full');
const DIR = path.join(REPO, 'demos', 'xiangsu-cover');
const CAND = path.join(here, 'out', 'cover_cand');
const OUT = process.env.XIANGSU_COVER_OUT || process.env.XIANGSU2_COVER_OUT || '';
const TITLE = process.env.XIANGSU_COVER_TITLE || process.env.XIANGSU_FILM || '';
const TITLE_COLS = (() => { const h = Math.ceil(TITLE.length / 2); return [TITLE.slice(0, h), TITLE.slice(h)]; })();
const CHROME = process.env.MG_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);
if (args.final && !TITLE) { console.error('未设置 XIANGSU_COVER_TITLE（封面标题片名，例 XIANGSU_COVER_TITLE=波斯湾伊甸园）'); process.exit(2); }
if (args.final && !OUT) { console.error('未设置 XIANGSU_COVER_OUT（封面交付目录，例 XIANGSU_COVER_OUT="D:/@kaifa/yandi/out/3 波斯湾伊甸园"）'); process.exit(2); }

// ---- 1) 生成 coverfilm.js（assembled film.js 的可配副本）----
function buildDemo() {
  let film = fs.readFileSync(path.join(SRC, 'film.js'), 'utf8');
  const reps = [
    ['const FW = 640, FH = 360, UP = 3;',
     'const FW = 640, FH = 360, UP = (window.__UP || 3);'],
    ['const OUTW = FW * UP, OUTH = FH * UP;',
     'const OUTW = FW * UP, OUTH = FH * UP;\ncv.width = +(window.__CW || OUTW); cv.height = +(window.__CH || OUTH);'],
    ['scan.width = OUTW; scan.height = 3;',
     'scan.width = OUTW; scan.height = UP;'],
    ["c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 1, OUTW, 1);",
     "c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, Math.floor(UP / 2), OUTW, 1);"],
    ['  ctx.drawImage(small, 0, 0, OUTW, OUTH);\n  ctx.drawImage(vign, 0, 0);\n  ctx.fillStyle = scanPat; ctx.fillRect(0, 0, OUTW, OUTH);\n  ctx.globalCompositeOperation = \'overlay\';\n  ctx.fillStyle = \'rgba(120,255,200,0.02)\'; ctx.fillRect(0, 0, OUTW, OUTH);',
     '  const OX = -Math.round(window.__CROPX || 0) * UP;\n  const OY = Math.round(window.__CROPY || 0) * UP;\n  ctx.drawImage(small, OX, OY, OUTW, OUTH);\n  ctx.drawImage(vign, OX, 0);\n  ctx.fillStyle = scanPat; ctx.fillRect(OX, 0, OUTW, OUTH);\n  ctx.globalCompositeOperation = \'overlay\';\n  ctx.fillStyle = \'rgba(120,255,200,0.02)\'; ctx.fillRect(OX, 0, OUTW, OUTH);'],
    ['  subtitle(tt);', '  if (!window.__NO_SUB) subtitle(tt);'],
    ['function hud(zh, en) { labelBlock(zh, en, 24, 12, 2); }',
     'function hud(zh, en) { if (!window.__NO_HUD) labelBlock(zh, en, 24, 12, 2); }'],
  ];
  for (const [a, b] of reps) {
    if (!film.includes(a)) throw new Error('coverfilm 替换点未找到: ' + a.slice(0, 56));
    film = film.replace(a, b);
  }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, 'coverfilm.js'), film);
  for (const f of ['sprites.js', 'cues.json']) fs.copyFileSync(path.join(SRC, f), path.join(DIR, f));
  fs.writeFileSync(path.join(DIR, 'index.html'), PAGE);
}

// ---- 2) 封面页（场景 + 标题区 + 金色行楷）----
const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block}</style>
</head><body>
<canvas id="c" width="1920" height="1080"></canvas>
<script type="module">
  const q = new URLSearchParams(location.search);
  window.__UP = +(q.get('up') || 3);
  window.__CW = +(q.get('cw') || 1920);
  window.__CH = +(q.get('ch') || 1080);
  window.__CROPX = +(q.get('cropx') || 0);
  window.__CROPY = +(q.get('cropy') || 0);
  window.__BAND = +(q.get('band') || 0);
  window.__NO_SUB = q.get('sub') !== '1';
  window.__NO_HUD = q.get('hud') !== '1';
  await import('./coverfilm.js');
  await document.fonts.load('160px "STXingkai"', ${JSON.stringify(TITLE || '波')});
  await document.fonts.ready;

  // 上方深色标题区 + 金色行楷标题（横排 / 竖排）
  window.drawCover = (kind) => {
    const cv = document.getElementById('c'), ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const portrait = kind === '3x4';

    // 标题区：顶部 1/3（竖版 6 字竖排略放宽到 0.36H）
    const bandH = H * (window.__BAND || (portrait ? 0.36 : 0.34));
    const g = ctx.createLinearGradient(0, 0, 0, bandH);
    g.addColorStop(0, 'rgba(4,7,10,0.95)');
    g.addColorStop(0.62, 'rgba(4,7,10,0.88)');
    g.addColorStop(1, 'rgba(4,7,10,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, bandH);

    // 顶部再压一道，标题更沉
    const g2 = ctx.createLinearGradient(0, 0, 0, H * 0.14);
    g2.addColorStop(0, 'rgba(2,4,6,0.55)');
    g2.addColorStop(1, 'rgba(2,4,6,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * 0.14);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    if (!portrait) {
      // 横版：整片名横排
      const chars = ${JSON.stringify(TITLE.split(''))};
      const size = Math.min(W * 0.142, H * 0.30);
      const y = H * 0.165;
      chars.forEach((ch, i) => {
        drawGoldChar(ctx, ch, W / 2 + (i - (chars.length - 1) / 2) * size * 0.985, y, size);
      });
    } else {
      // 竖版：两列竖排、右起（波斯湾 / 伊甸园）；每列 3 字，整列落在标题区内
      const cols = ${JSON.stringify(TITLE_COLS)};
      const size = Math.min(W * 0.176, bandH * 0.285);
      const y0 = bandH * 0.5 - size * 0.98 + 16; // 3 字列的中间字符中心（略往下，留出天头）
      cols.forEach((col, c) => {
        const x = W * 0.5 + (c === 0 ? 1 : -1) * size * 0.66;
        for (let i = 0; i < col.length; i++) drawGoldChar(ctx, col[i], x, y0 + i * size * 0.98, size);
      });
    }
  };

  // 金色渐变 + 深色描边 + 轻外发光
  function drawGoldChar(ctx, ch, x, y, size) {
    const gg = ctx.createLinearGradient(0, y - size * 0.55, 0, y + size * 0.55);
    gg.addColorStop(0, '#FBEDB4');
    gg.addColorStop(0.30, '#F3D26A');
    gg.addColorStop(0.62, '#E8B84B');
    gg.addColorStop(1, '#A9780C');
    ctx.save();
    ctx.translate(x, y);
    ctx.font = '400 ' + size + 'px "STXingkai"';
    ctx.shadowColor = 'rgba(232,184,75,0.42)';
    ctx.shadowBlur = size * 0.16;
    ctx.lineWidth = size * 0.115;
    ctx.strokeStyle = '#160F06';
    ctx.strokeText(ch, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = gg;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  window.__ready = true;
</script>
</body></html>`;

// ---- 3) 渲染 ----
function url(query) {
  const q = new URLSearchParams(query).toString();
  return 'http://127.0.0.1:PORT/demos/xiangsu-cover/index.html?' + q;
}

async function main() {
  buildDemo();
  const http = await import('node:http');
  const srv = http.createServer((req, res) => {
    try {
      const u = new URL(req.url, 'http://x');
      let p = path.resolve(REPO, '.' + decodeURIComponent(u.pathname));
      if (path.relative(REPO, p).startsWith('..')) { res.writeHead(403); return res.end(); }
      if (!fs.existsSync(p)) { res.writeHead(404); return res.end('404'); }
      const M = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
      res.writeHead(200, { 'Content-Type': M[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(p).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const PORT = srv.address().port;

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true, pipe: true, protocolTimeout: 600000,
    args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text',
      '--hide-scrollbars', '--mute-audio', '--no-sandbox'],
  });

  try {
    if (args.frames) {
      fs.mkdirSync(CAND, { recursive: true });
      const page = await browser.newPage();
      page.on('console', m => console.log('[page]', m.type(), m.text()));
      page.on('pageerror', e => console.log('[pageerror]', e.message));
      page.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure()?.errorText));
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(`http://127.0.0.1:${PORT}/demos/xiangsu-cover/index.html?up=3&cw=1920&ch=1080`, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000 });
      for (const t of String(args.frames).split(',').map(Number)) {
        await page.evaluate((t) => window.renderAt(t), t);
        const f = path.join(CAND, `nosub_t${t.toFixed(2).padStart(6, '0')}.png`);
        fs.writeFileSync(f, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } }));
        console.log(f);
      }
      await page.close();
      return;
    }

    // --final
    const jobs = [
      { kind: '4x3', up: +(args.up43 || 4), cw: 1440, ch: 1080, cropx: +(args.crop43 || 52), cropy: +(args.cropy43 || 12), band: +(args.band43 || 0.30), t: +(args.t43 || 42.4), file: 'cover_4x3.png' },
      { kind: '3x4', up: +(args.up34 || 5), cw: 1080, ch: 1440, cropx: +(args.crop34 || 124), cropy: +(args.cropy34 || 32), band: +(args.band34 || 0.36), t: +(args.t34 || 42.4), file: 'cover_3x4.png' },
    ];
    fs.mkdirSync(OUT, { recursive: true });
    for (const j of jobs) {
      const page = await browser.newPage();
      await page.setViewport({ width: j.cw, height: j.ch });
      const qs = { up: j.up, cw: j.cw, ch: j.ch, cropx: j.cropx, cropy: j.cropy };
      if (j.band) qs.band = j.band;
      const q = new URLSearchParams(qs);
      await page.goto(`http://127.0.0.1:${PORT}/demos/xiangsu-cover/index.html?${q}`, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000 });
      await page.evaluate((t) => window.renderAt(t), j.t);
      await page.evaluate((k) => window.drawCover(k), j.kind);
      const font = await page.evaluate(() => {
        // 量字形像素签名：行楷与黑体必须不同，否则说明字体没生效
        const sig = (fam) => {
          const cv = document.createElement('canvas'); cv.width = cv.height = 120;
          const c = cv.getContext('2d');
          c.font = '100px "' + fam + '"'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
          c.fillText('波', 10, 60);
          const d = c.getImageData(0, 0, 120, 120).data;
          let s = 0, ink = 0;
          for (let i = 0; i < d.length; i += 4) { s = (s + d[i + 3] * ((i / 4) % 977)) % 1000000007; if (d[i + 3] > 40) ink++; }
          return { sig: s, ink };
        };
        return { loaded: document.fonts.check('100px "STXingkai"', '波'), xingkai: sig('STXingkai'), yahei: sig('Microsoft YaHei') };
      });
      console.log('  font check', JSON.stringify(font));
      const f = path.join(OUT, j.file);
      fs.writeFileSync(f, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: j.cw, height: j.ch } }));
      console.log(`${f}  ${j.cw}x${j.ch}  t=${j.t}`);
      await page.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
