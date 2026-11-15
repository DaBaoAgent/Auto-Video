// 炎帝样片密度核验：全帧仪表采集 + 三指标分析 + 报告
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = process.env.PLAYWRIGHT_CHROME || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FPS = 30;
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'yandi_full_sb.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file:///' + path.join(__dirname, 'page_full_yandi.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 20000 });
  const errs = await page.evaluate('window.__err||[]');
  if (errs.length) console.log('RENDER ERRORS:', errs.slice(0, 5));
  const total = Math.ceil(SB.total * FPS);
  const frames = [];
  for (let i = 0; i < total; i++) {
    const qc = await page.evaluate((n) => window.renderFrame(n), i);
    let area = 0;
    for (const r of qc.textRects) area += r[2] * r[3];
    frames.push({ f: i, t: +(i / FPS).toFixed(2), moving: qc.moving, acts: qc.acts, textCov: +(area / (1920 * 1080) * 100).toFixed(2) });
    if (i % 300 === 0) console.log('qc frame', i, '/', total);
  }
  await browser.close();
  fs.writeFileSync(path.join(__dirname, 'qc_frames_full.json'), JSON.stringify(frames));

  const report = { total: SB.total, frames: total, scenes: [], issues: [] };
  const covs = frames.map(f => f.textCov);
  report.textCov = { max: Math.max(...covs), mean: +(covs.reduce((a, b) => a + b, 0) / covs.length).toFixed(1), over30: covs.filter(c => c > 30).length };
  const movs = frames.map(f => f.moving.length);
  report.moving = { min: Math.min(...movs), mean: +(movs.reduce((a, b) => a + b, 0) / movs.length).toFixed(1), under5: movs.filter(m => m < 5).length };
  const win = 2 * FPS;
  let newPoints = 0, emptyWins = [];
  let prevSet = new Set();
  for (let w = 0; w < total; w += win) {
    const slice = frames.slice(w, Math.min(w + win, total));
    const set = new Set(); slice.forEach(f => f.moving.forEach(m => set.add(m)));
    const newOnes = [...set].filter(m => !prevSet.has(m));
    const cut = slice.some(f => f.acts.some(a => a.startsWith('cut:')));
    if (newOnes.length > 0 || cut) newPoints++; else emptyWins.push(+(w / FPS).toFixed(1));
    prevSet = set;
  }
  report.motionPoints = { windows: Math.ceil(total / win), withNew: newPoints, emptyAt: emptyWins };
  // 纯文字画面豁免统计（myth/fourbig/接点junction）
  const PURE = ['myth', 'fourbig', 'junction', 'chapter', 'endcard'];
  let pureFrames = 0;
  for (const sc of SB.scenes) {
    const slice = frames.filter(f => f.t >= sc.s && f.t < sc.e);
    if (!slice.length) continue;
    const cov = Math.max(...slice.map(f => f.textCov));
    const mv = Math.min(...slice.map(f => f.moving.length));
    const pure = PURE.includes(sc.type);
    if (pure) pureFrames += slice.length;
    report.scenes.push({ s: sc.s, e: sc.e, type: sc.type, minMoving: mv, maxTextCov: cov, pure, ok: pure ? true : (mv >= 5 && cov <= 30) });
  }
  report.pureRatio = +(pureFrames / total * 100).toFixed(1);
  fs.writeFileSync(path.join(__dirname, 'qc_report_full.json'), JSON.stringify(report, null, 1));
  console.log('=== 三指标 ===');
  console.log('文字覆盖率: max', report.textCov.max + '%', 'mean', report.textCov.mean + '%', '超30%帧数', report.textCov.over30);
  console.log('同屏运动元素: min', report.moving.min, 'mean', report.moving.mean, '少于5帧数', report.moving.under5);
  console.log('2秒新动效点: ', report.motionPoints.withNew, '/', report.motionPoints.windows, '窗口', report.motionPoints.emptyAt.length ? ('空窗:' + report.motionPoints.emptyAt.join(',')) : '无空窗');
  console.log('纯文字画面占比:', report.pureRatio + '%（豁免上限20%）');
  console.log('=== 逐幕 ===');
  report.scenes.forEach(s => console.log((s.ok ? 'PASS' : 'FAIL'), s.type, s.s + '-' + s.e, 'minMoving', s.minMoving, 'maxTextCov', s.maxTextCov + '%', s.pure ? '[豁免]' : ''));
})();
