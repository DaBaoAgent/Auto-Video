// 自检 gate:headless 加载一份 package、逐幕截图、扫 console error。
// AI loop 用它当客观关卡;人用产出的截图 contact sheet 验空间/时序。
//
// 用法:
//   npm install                                   # 先装 puppeteer-core(只此工具需要;引擎本身零依赖)
//   node tools/render-check.mjs                    # 检查默认 packages/chibi
//   node tools/render-check.mjs --pkg packages/guandu/battlefield.json
//   CHROME=/path/to/chrome node tools/render-check.mjs --pkg ...
//
// 截图输出:tools/render-out/<package>/act-NN.png(gitignored)
// 任一 console error 或 0 幕 → 退出码 1。
// Windows 适配:清理走 taskkill /T 与 PowerShell(chrome 残留扫描),不依赖 pgrep/pkill。

import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, extname, basename } from 'node:path';

const IS_WIN = process.platform === 'win32';

// 收集一个 PID 的整棵子孙进程(趁进程树还活着时呼叫);用于 backstop 强制清理。仅 POSIX。
function procTree(pid) {
  const out = [pid];
  try { for (const k of execSync(`pgrep -P ${pid}`, { encoding: 'utf8' }).split('\n').filter(Boolean)) out.push(...procTree(+k)); } catch {}
  return out;
}

// Windows:taskkill /T 杀整棵进程树;再按本次 profile 专属目录名扫描残留 chrome。
function killTreeWin(pid) {
  try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' }); } catch {}
}
function sweepWin() {
  const ps = `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like '*bfe-rendercheck*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`;
  const b64 = Buffer.from(ps, 'utf16le').toString('base64');
  try { execSync(`powershell -NoProfile -NonInteractive -EncodedCommand ${b64}`, { stdio: 'ignore', timeout: 20000 }); } catch {}
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USERDATA = join(tmpdir(), 'bfe-rendercheck-' + process.pid);   // 本次 chrome 专属 profile;清理时用它精准 pkill 整实例
const ai = process.argv.indexOf('--pkg');
const PKG = ai >= 0 ? process.argv[ai + 1] : 'packages/chibi-full/battlefield.json';
const SLUG = basename(dirname(PKG)) || 'pkg';
const OUT = join(ROOT, 'tools', 'render-out', SLUG);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.css': 'text/css', '.ico': 'image/x-icon' };

function chromePath() {
  const cands = [process.env.CHROME,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome-stable', '/usr/bin/google-chrome',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'].filter(Boolean);
  for (const c of cands) if (existsSync(c)) return c;
  throw new Error('找不到 Chrome/Chromium;用 CHROME=/path 指定');
}

// ── 静态伺服器(零依赖)──
const server = createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let fp = join(ROOT, url === '/' ? 'index.html' : url);
    if (!fp.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const buf = await readFile(fp);
    res.writeHead(200, { 'content-type': MIME[extname(fp)] || 'application/octet-stream' });
    res.end(buf);
  } catch { res.writeHead(404).end('not found'); }
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  if (!existsSync(join(ROOT, PKG))) { console.error('FAIL: package 不存在:', PKG); process.exit(1); }
  let puppeteer;
  try { puppeteer = (await import('puppeteer-core')).default; }
  catch { console.error('FAIL: 缺 puppeteer-core,先跑 `npm install`'); process.exit(1); }

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const base = `http://localhost:${port}`;

  const errs = [], titles = [];
  let browser, chromePid, meta = {}, ok = false;
  try {
    browser = await puppeteer.launch({ executablePath: chromePath(), headless: 'new', userDataDir: USERDATA,
      args: ['--no-sandbox', '--no-first-run', '--no-default-browser-check', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist', '--enable-webgl', '--window-size=1280,720'],
      defaultViewport: { width: 1280, height: 720 } });
    chromePid = browser.process()?.pid;
    const page = await browser.newPage();
    page.on('console', m => m.type() === 'error' && errs.push(m.text()));
    page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));

    await page.goto(`${base}/play.html?pkg=${PKG}`, { waitUntil: 'load', timeout: 45000 });
    // 等数据就绪(loadMsg 收起):内置服务器冷加载可能超过 2.5s,固定 sleep 会误读成 0 幕
    await page.waitForFunction(() => document.getElementById('loadMsg')?.classList.contains('off'), { timeout: 60000 }).catch(() => {});
    await sleep(1200);
    meta = await page.evaluate(() => ({
      title: document.getElementById('brdTitle')?.textContent,
      nodes: document.querySelectorAll('.node').length,
      canvas: !!document.querySelector('canvas'),
    }));
    try { await page.click('#btnAuto'); } catch {}
    await sleep(2000);
    for (let k = 0; k < meta.nodes; k++) {
      await page.evaluate(i => { const n = document.querySelectorAll('.node')[i]; if (n) n.click(); }, k);
      await sleep(k === meta.nodes - 1 ? 3500 : 2800);
      titles.push(await page.evaluate(() => document.getElementById('phTitle')?.textContent));
      await page.screenshot({ path: join(OUT, `act-${String(k + 1).padStart(2, '0')}.png`) });
    }
    ok = meta.nodes > 0 && errs.length === 0 && meta.canvas;
  } finally {
    // 三重清理:① 正常 close ② 进程树强杀 ③ 本实例专属 profile 残留扫描
    const tree = IS_WIN ? [] : (chromePid ? procTree(chromePid) : []);
    if (browser) await browser.close().catch(() => {});
    if (IS_WIN) {
      if (chromePid) killTreeWin(chromePid);
      sweepWin();
      await sleep(800);
    }
    for (const pid of tree) { try { process.kill(pid, 'SIGKILL'); } catch {} }
    if (!IS_WIN) { try { execSync(`pkill -9 -f ${USERDATA}`); } catch {} }
    try { await rm(USERDATA, { recursive: true, force: true }); } catch {}
    server.close();
  }

  console.log(`${ok ? 'PASS' : 'FAIL'} [${meta.title}] — ${meta.nodes} 幕, canvas=${meta.canvas}`);
  console.log('  acts:', JSON.stringify(titles));
  console.log('  screenshots:', OUT.replace(ROOT + '/', ''));
  console.log('  console errors:', errs.length ? '\n   - ' + errs.slice(0, 8).join('\n   - ') : 'none');
  process.exit(ok ? 0 : 1);
}
main().catch(e => { console.error('FAIL:', e.message); server.close?.(); process.exit(1); });
