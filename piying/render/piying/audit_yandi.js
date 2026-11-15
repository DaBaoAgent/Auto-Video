// 炎帝交付门禁审查（三查）：①场景类型覆盖 ②字幕区越界 ③空渲染疑似
// 用法：node audit_yandi.js full|sample   —— 三查全过才允许封装交付
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = process.env.PLAYWRIGHT_CHROME || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const FPS = 30;
const MODE = process.argv[2] || 'full';
const SBJSON = MODE === 'full' ? 'yandi_full_sb.json' : 'yandi_sb.json';
const PAGE = MODE === 'full' ? 'page_full_yandi.html' : 'page_yandi.html';
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, SBJSON), 'utf8'));
const PURE = ['myth', 'fourbig', 'junction', 'chapter', 'endcard'];

(async () => {
  let fail = 0;
  // ===== 查一：类型覆盖（静态） =====
  const page = fs.readFileSync(path.join(__dirname, PAGE), 'utf8');
  const dispatch = [...page.matchAll(/name==='([a-z0-9-]+)'\)/g)].map(m => m[1]);
  const cfgBlock = (page.match(/const TYPE_CFG=\{([\s\S]*?)\n\};/) || page.match(/const TYPE_CFG=\{([\s\S]*?)\};/) || ['', ''])[1];
  const cfgKeys = [...cfgBlock.matchAll(/^ '([a-z0-9-]+)':\{/gm)].map(m => m[1]);
  const known = new Set([...dispatch, ...cfgKeys]);
  const missing = {};
  for (const sc of SB.scenes) if (!known.has(sc.type)) missing[sc.type] = (missing[sc.type] || 0) + 1;
  console.log('=== 查一：场景类型覆盖 ===');
  console.log('分发分支', dispatch.length, '+ TYPE_CFG', cfgKeys.length, '；sb 类型', new Set(SB.scenes.map(s => s.type)).size);
  if (Object.keys(missing).length) { fail++; console.log('FAIL 未注册类型:', JSON.stringify(missing)); }
  else console.log('PASS 全部场景类型已注册');

  // ===== 查二/查三：运行时全帧扫描 =====
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await pg.goto('file:///' + path.join(__dirname, PAGE).replace(/\\/g, '/'));
  await pg.waitForFunction('window.__ready && window.__ready()', null, { timeout: 20000 });
  const errs = await pg.evaluate('window.__err||[]');
  if (errs.length) { fail++; console.log('FAIL 渲染错误:', errs.slice(0, 5)); }
  const total = Math.ceil(SB.total * FPS);
  const overlapScenes = {}; // type -> {frames, total} 持续越界判定（占比>50% 才 FAIL；瞬时穿越属入场动效）
  const emptyScenes = {};
  const sceneTotal = {};    // 每场景帧数
  for (let i = 0; i < total; i++) {
    const t = i / FPS;
    const sc = SB.scenes.find(s => t >= s.s && t < s.e) || SB.scenes[SB.scenes.length - 1];
    sceneTotal[sc.type] = (sceneTotal[sc.type] || 0) + 1;
    const qc = await pg.evaluate((n) => window.renderFrame(n), i);
    // 查二：越界（字幕框除外；文字/前景卡/精灵底边 >930 且顶 <1024）
    const sub = qc.subRect;
    const allRects = qc.textRects.concat(qc.fgRects || []);
    for (const r of allRects) {
      if (sub && Math.abs(r[0] - sub[0]) < 2 && Math.abs(r[1] - sub[1]) < 2) continue;
      const bottom = r[1] + r[3];
      if (bottom > 930 && r[1] < 1024) {
        const o = overlapScenes[sc.type] = overlapScenes[sc.type] || { frames: 0, total: 0, first: +t.toFixed(2) };
        o.frames++; break;
      }
    }
    // 查三：空渲染（非豁免场景 moving≤6 疑似只有背景层）
    if (!PURE.includes(sc.type) && qc.moving.length <= 6) {
      (emptyScenes[sc.type] = emptyScenes[sc.type] || []);
      if (emptyScenes[sc.type].length < 3) emptyScenes[sc.type].push(+t.toFixed(2));
    }
    if (i % 3000 === 0) console.log('scan', i, '/', total);
  }
  const pageBadText = await pg.evaluate('window.__badText||[]');
  await browser.close();
  console.log('=== 查二：字幕区越界（文字/卡片/精灵，持续越界>50%帧才 FAIL）===');
  const oks = Object.keys(overlapScenes);
  if (oks.length) {
    for (const k of oks) {
      const o = overlapScenes[k];
      const ratio = o.frames / Math.max(1, sceneTotal[k] || 1);
      if (ratio > 0.5) { fail++; console.log('FAIL', k, '越界率', (ratio * 100).toFixed(0) + '%', '首现@' + o.first + 's'); }
      else console.log('WARN', k, '瞬时穿越（入场动效）', (ratio * 100).toFixed(0) + '%，不拦截');
    }
  } else console.log('PASS 无越界');
  console.log('=== 查三：空渲染疑似（非豁免 moving≤6）===');
  const eks = Object.keys(emptyScenes);
  if (eks.length) { fail++; eks.forEach(k => console.log('FAIL', k, '@', emptyScenes[k].join(','), 's')); }
  else console.log('PASS 无空渲染');
  console.log('=== 查四：坏文本（[object Object] 等非字符串渲染）===');
  if (pageBadText.length) { fail++; console.log('FAIL 坏文本:', pageBadText.slice(0, 5)); }
  else console.log('PASS 无坏文本');
  console.log(fail ? ('===== 审查未通过：' + fail + ' 项 =====') : '===== 四查全过，允许交付 =====');
  process.exit(fail ? 1 : 0);
})();
