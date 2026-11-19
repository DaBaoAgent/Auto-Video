// daihuo · 逐帧渲染（Playwright）
// 用法：node render_frames.cjs --page=<html> --cues=<json> --out=<dir> [--fps=30] [--frames=450]
// 确定性：渲染只由 cues.json 的 start/end 与 t 决定，不含随机、不含当前时间。
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('D:/@kaifa/tuangou/node_modules/playwright');

const DEFAULT_CHROMIUM =
  'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

function arg(name, def) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}

(async () => {
  const pagePath = arg('page');
  const cuesPath = arg('cues');
  const outDir = arg('out');
  const fps = Number(arg('fps', '30'));
  if (!pagePath || !cuesPath || !outDir) throw new Error('缺少 --page / --cues / --out');

  const cues = JSON.parse(fs.readFileSync(cuesPath, 'utf8'));
  const duration = Number(cues.duration);
  const total = Number(arg('frames', String(Math.round(duration * fps))));
  fs.mkdirSync(outDir, { recursive: true });

  const t0 = Date.now();
  const browser = await chromium.launch({
    headless: true,
    executablePath: arg('chromium', DEFAULT_CHROMIUM),
    args: ['--force-color-profile=srgb', '--disable-lcd-text'],
  });
  const page = await browser.newPage({
    viewport: { width: cues.size[0], height: cues.size[1] },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(pagePath).href, { waitUntil: 'load' });
  await page.addInitScript((c) => { window.CUES = c; }, cues);
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const tReady = Date.now();

  for (let i = 0; i < total; i++) {
    const t = i / fps;
    await page.evaluate((tt) => window.renderAt(tt), t);
    await page.screenshot({
      path: path.join(outDir, `f${String(i).padStart(5, '0')}.jpg`),
      type: 'jpeg',
      quality: 92,
    });
  }
  const tDone = Date.now();
  await browser.close();

  console.log(JSON.stringify({
    ok: true, frames: total, fps,
    ready_ms: tReady - t0, render_ms: tDone - tReady,
    per_frame_ms: Math.round((tDone - tReady) / total),
    out: outDir,
  }));
})().catch((e) => { console.error('FAIL:', e.stack || e.message); process.exit(1); });
