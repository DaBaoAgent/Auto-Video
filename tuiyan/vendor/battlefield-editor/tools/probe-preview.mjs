// 快速预览探针（迭代构图用）：无头 SwiftShader 单页截图。
// 性能与全套检查请用 check-asset-previews.mjs（真实 GPU）。
// 用法: node tools/probe-preview.mjs <asset|soldier> [suffix]
import puppeteer from 'puppeteer-core';

const name = process.argv[2] || 'soldier';
const suffix = process.argv[3] || `${name}-probe`;
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  defaultViewport: { width: 1920, height: 1080 },
  args: ['--no-first-run', '--no-default-browser-check', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const errors = [];
try {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:8125/docs/${name}-preview.html?rev=${Date.now()}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForFunction(() => window.preview, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.click(name === 'asset' ? '#shipView' : '#closeup');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: `docs/probe-${suffix}.png` });
  console.log(JSON.stringify({ name, errors }));
} finally {
  await browser.close();
}
