import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';

// Use the actual laptop GPU. SwiftShader results must never be reported as Iris Xe performance.
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: false,
  defaultViewport: { width: 1920, height: 1080 },
  args: ['--no-first-run', '--no-default-browser-check', '--enable-webgl'],
});
const report = { date: new Date().toISOString(), scenes: [], errors: [] };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
  for (const name of ['asset', 'soldier']) {
    await page.goto(`http://127.0.0.1:8125/docs/${name}-preview.html?rev=${Date.now()}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction(() => window.preview);
    await wait(2500);
    await page.click(name === 'asset' ? '#test' : '#bench');
    await page.waitForFunction(() => window.preview.benchmark, { timeout: 20000 });
    const performance = await page.evaluate(() => window.preview.benchmark);
    await page.screenshot({ path: `docs/${name}-preview-1920x1080.png` });
    await page.click(name === 'asset' ? '#shipView' : '#closeup');
    await wait(1200);
    await page.screenshot({ path: `docs/${name}-preview-closeup.png` });
    const checks = {};
    if (name === 'asset') {
      checks.water = await page.evaluate(() => ({ updates: window.preview.water.stats.updates, width: window.preview.water.mesh.geometry.parameters.width, height: window.preview.water.mesh.geometry.parameters.height }));
      if (checks.water.updates < 5) report.errors.push('Water reflection pass ran too few times');
      if (checks.water.width !== 680 || checks.water.height !== 460) report.errors.push('Water plane does not span the map');
    }
    if (name === 'soldier') {
      checks.positions = await page.evaluate(() => window.preview.state.positions);
      checks.uniqueSlots = new Set(checks.positions.map(p => p.join(','))).size;
      if (checks.uniqueSlots !== 32) report.errors.push('Soldier formation has overlapping slots');
      await page.click('[data-mode="march"]');
      await wait(2600);
      checks.march = await page.evaluate(() => window.preview.state);
      if (checks.march.walking) report.errors.push('March feet continue moving after destination');
      await page.click('[data-mode="attack"]');
      await wait(2700);
      checks.attack = await page.evaluate(() => window.preview.state);
      const left = checks.attack.positions.slice(0, 16), right = checks.attack.positions.slice(16);
      checks.frontGap = Math.min(...right.map(p => p[0])) - Math.max(...left.map(p => p[0]));
      if (checks.frontGap < 3) report.errors.push('Attack formations intersect');
      await page.screenshot({ path: 'docs/soldier-preview-attack.png' });
    }
    await page.setViewport({ width: 390, height: 844 });
    await wait(600);
    checks.mobile = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, controls: [...document.querySelectorAll('button')].filter(el => el.offsetWidth).every(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; }) }));
    await page.screenshot({ path: `docs/${name}-preview-mobile.png` });
    if (checks.mobile.width !== checks.mobile.scrollWidth || !checks.mobile.controls) report.errors.push(`${name} mobile controls exceed viewport`);
    report.scenes.push({ name, performance, checks });
    console.log(JSON.stringify({ name, performance, checks: { uniqueSlots: checks.uniqueSlots, frontGap: checks.frontGap, mobile: checks.mobile, water: checks.water } }));
    await page.setViewport({ width: 1920, height: 1080 });
  }
} finally {
  await fs.writeFile('docs/preview-validation.json', JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ errors: report.errors }));
if (report.errors.length) process.exitCode = 1;
