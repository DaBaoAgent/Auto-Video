// tools/verify-zh.mjs — 简体化 + BGM + 多音色 + 主帅卡 全量无头验证
// 繁体断言字符用 \u 转义（防 t2s 批量转换误伤本文件）
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BFE_VERIFY_BASE || 'http://127.0.0.1:8125';
const PKG = process.env.BFE_PKG || 'packages/chibi-full/battlefield.json';
const PKG_URL = '/' + PKG.replace(/\/[^/]+$/, '') + '/';
const CMD_DIR = process.env.BFE_CMD_DIR || 'assets/commanders/';
const OUT = 'docs/screenshots';
const proxy = process.env.PROXY === '1' ? 'http://127.0.0.1:15715' : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const TRAD = ['\u6230','\u8ecd','\u6771','\u98a8','\u8aac','\u70ba','\u6f22','\u6b0a','\u5c07','\u5f8c','\u767c',
  '\u96f2','\u5011','\u9019','\u6703','\u8a71','\u8a9e','\u968a','\u71df','\u71d2','\u64ca','\u8acb','\u8b1d',
  '\u9435','\u9396','\u6b72','\u9918','\u8f09','\u9032'];

const errors = [];
const report = { errors };
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--window-size=1600,900', ...(proxy ? ['--proxy-server=' + proxy] : [])],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  page.on('pageerror', e => errors.push('[pageerror] ' + String(e.message).slice(0, 180)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('[console] ' + m.text().slice(0, 180)); });
  page.on('requestfailed', r => {
    const u = r.url();
    if (u.startsWith('https://fonts.') || u.includes('gstatic')) return;
    if (u.includes('/narration/')) return;
    if (u.includes('/assets/sfx/') || u.includes('/assets/music/') || u.includes('/assets/commanders/')) return;  // 探活 HEAD 噪声
    errors.push('[reqfail] ' + u.slice(0, 140));
  });
  await page.setRequestInterception(true);
  page.on('request', r => {
    const u = r.url();
    if (u.startsWith('https://fonts.') || u.includes('fonts.gstatic')) r.abort();
    else r.continue();
  });

  await page.goto(BASE + '/play.html?pkg=' + PKG, { waitUntil: 'domcontentloaded', timeout: 120000 });
  try { await page.waitForFunction('!!window.__audio', { timeout: 45000 }); }
  catch (e) { errors.push('[wait] __audio 未就绪'); }
  await sleep(1500);
  await page.screenshot({ path: OUT + '/zh-01-开场.png' });

  // ── 标题 ──
  report.title = await page.evaluate(() => ({
    docTitle: document.title,
    chip: (document.getElementById('brdTag') || {}).textContent || '',
    hasXu: (document.body.innerText || '').includes('\u5f90\u827e\u4f26'),
    hasZhanchang: (document.body.innerText || '').includes('\u6218\u573a\u91cd\u73b0'),
    oldLeft: (document.body.innerText || '').includes('\u5386\u53f2\u7279\u522b\u8282\u76ee'),
    voiceBtn: document.querySelector('#bVoiceTg') ? document.querySelector('#bVoiceTg').textContent : null,
    bgmBtn: document.querySelector('#bBgm') ? document.querySelector('#bBgm').textContent : null,
    bgmVolEl: !!document.querySelector('#bgmVol'),
  }));

  report.newUI = await page.evaluate(() => ({
    sfxVol: !!document.getElementById('sfxVol'),
    narrSpd: !!document.getElementById('narrSpd'),
    narrSpdVal: (document.getElementById('narrSpdVal') || {}).textContent || null,
    spdWrap: !!document.getElementById('spdWrap'),
    autoBgmBtn: !!document.getElementById('bAutoBgm'),
    labelImgs: document.querySelectorAll('.uLab .cmd img').length,
    labelSrcs: [...document.querySelectorAll('.uLab .cmd img')].map(i => i.src.split('/').pop()),
    labelLoaded: [...document.querySelectorAll('.uLab .cmd img')].map(i => i.naturalWidth > 0),
  }));

  const cfg = await page.evaluate(async (u) => (await fetch(u)).json(), PKG_URL + 'audio.json');
  report.voices = { list: cfg.narration.voices, default: cfg.narration.default, annaLabel: cfg.narration.voiceLabels.anna };
  report.bgmList = cfg.music.bgm.map(g => g.label);
  report.cuesCount = { scenes: Object.keys(cfg.cues).length, total: Object.values(cfg.cues).reduce((a, c) => a + c.length, 0) };
  report.probeNarr = await page.evaluate(async (voices, pat, base) => {
    const out = {};
    for (const v of voices) {
      const u = new URL(pat.replace('{voice}', v).replace('{n}', '1'), location.origin + base).href;
      try { const r = await fetch(u, { method: 'HEAD' }); out[v] = r.status; } catch (e) { out[v] = 'ERR'; }
    }
    return out;
  }, cfg.narration.voices, cfg.narration.pathPattern, PKG_URL);
  report.probeAssets = await page.evaluate(async (sfx, sfxDir, bgm, cmds, cmdDir, base) => {
    const U = p => new URL(p, location.origin + base).href;
    const head = async u => { try { return (await fetch(u, { method: 'HEAD' })).status; } catch (e) { return 'ERR'; } };
    const os = {};
    for (const id of sfx) os[id] = await head(U(sfxDir + '/' + id + '.mp3'));
    const ob = {};
    for (const g of bgm) ob[g.id] = await head(U(g.file));
    const oc = {};
    for (const c of cmds) oc[c] = await head(U(cmdDir + c + '.jpg'));
    return { sfx: os, bgm: ob, cmd: oc };
  }, cfg.sfx.files, cfg.sfx.dir, cfg.music.bgm, ['cao', 'liu', 'guanyu', 'zhouyu', 'caoren'], CMD_DIR, PKG_URL);

  // ── 自动播映 + 音量 ──
  await page.click('#btnAuto');
  await sleep(1000);
  report.gainEarly = await page.evaluate(() => {
    try { return +window.__audio.engine.musicBus.gain.value.toFixed(3); } catch (e) { return 'ERR'; }
  });
  await sleep(5000);
  report.mid = await page.evaluate(() => {
    let music = null, sfx = null;
    try { music = +window.__audio.engine.musicBus.gain.value.toFixed(3); } catch (e) {}
    try { sfx = +window.__audio.engine.sfxBus.gain.value.toFixed(3); } catch (e) {}
    return { music, sfx, canvas: !!document.querySelector('canvas'),
             narrBusy: !!(window.__audio.narr && window.__audio.narr.busy && window.__audio.narr.busy()) };
  });
  report.marchFetch = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name).filter(n => /(inf|cav)-march/.test(n)).map(n => n.split('/').pop()));
  await page.screenshot({ path: OUT + '/zh-02-自动播映-第一幕.png' });

  // ── 音色切换（多音色包才验证；单一音色时按钮应隐藏） ──
  const seq = [];
  const n = cfg.narration.voices.length;
  const voiceVisible = await page.evaluate(() => {
    const b = document.getElementById('bVoiceTg');
    return !!b && getComputedStyle(b).display !== 'none';
  });
  report.voiceBtnVisible = voiceVisible;
  if (n >= 2) {
    if (!voiceVisible) errors.push('[voice] 多音色包却未显示音色切换钮');
    for (let i = 0; i < n; i++) {
      await page.click('#bVoiceTg');
      await sleep(220);
      seq.push(await page.evaluate(() => document.querySelector('#bVoiceTg').textContent));
    }
  } else if (voiceVisible) {
    errors.push('[voice] 单一音色包仍显示音色切换钮');
  }
  report.voiceSeq = seq;
  await page.screenshot({ path: OUT + '/zh-03-音色切换.png' });

  // ── BGM 控件 ──
  const bgmLabels = ['BGM 默认', ...cfg.music.bgm.map(g => 'BGM ' + g.label)];
  const bseq = [await page.evaluate(() => document.querySelector('#bBgm').textContent)];
  for (let i = 1; i < bgmLabels.length; i++) { await page.click('#bBgm'); await sleep(260); bseq.push(await page.evaluate(() => document.querySelector('#bBgm').textContent)); }
  await page.click('#bBgm'); await sleep(300);   // 回到默认
  report.bgmSeq = bseq.concat([await page.evaluate(() => document.querySelector('#bBgm').textContent)]);
  await page.click('#bBgm'); await sleep(900);   // 选第一首,验证真实加载
  report.bgmFetch = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name).filter(n => /bgm\//.test(n)).map(n => n.split('/').pop()));
  await page.evaluate(() => { const s = document.getElementById('bgmVol'); s.value = 50; s.dispatchEvent(new Event('input')); });
  report.bgmVolPersist = await page.evaluate(() => localStorage.getItem('battlefield.chibi.bgmvol'));
  await page.evaluate(() => { const s = document.getElementById('bgmVol'); s.value = 100; s.dispatchEvent(new Event('input')); });

  // ── 音效音量 + 旁白语速 滑轨 ──
  await page.evaluate(() => { const s = document.getElementById('sfxVol'); s.value = 50; s.dispatchEvent(new Event('input')); });
  await sleep(400);
  report.sfxVolTest = await page.evaluate(() => ({
    persist: localStorage.getItem('battlefield.chibi.sfxvol'),
    bus: (() => { try { return +window.__audio.engine.sfxBus.gain.value.toFixed(3); } catch (e) { return 'ERR'; } })(),
  }));
  await page.evaluate(() => { const s = document.getElementById('sfxVol'); s.value = 100; s.dispatchEvent(new Event('input')); });
  await page.evaluate(() => { const s = document.getElementById('narrSpd'); s.value = 1.5; s.dispatchEvent(new Event('input')); });
  report.narrSpdTest = await page.evaluate(() => ({
    persist: localStorage.getItem('battlefield.chibi.narrspd'),
    label: (document.getElementById('narrSpdVal') || {}).textContent || null,
  }));
  await page.evaluate(() => { const s = document.getElementById('narrSpd'); s.value = 1; s.dispatchEvent(new Event('input')); });
  const ctrlClip = await page.evaluate(() => {
    const b = document.getElementById('bBgm'); if (!b) return null;
    const row = b.parentElement.getBoundingClientRect();
    return { x: 0, y: Math.max(0, row.y - 22), width: 1600, height: row.height + 44 };
  });
  if (ctrlClip) await page.screenshot({ path: OUT + '/zh-04-BGM控件.png', clip: ctrlClip });

  // ── 真实音效加载采样（cue 触发的文件 audio 真取） ──
  await sleep(4500);
  report.sfxFetch = await page.evaluate(() => [...new Set(performance.getEntriesByType('resource')
    .filter(e => /assets\/sfx\/.*\.mp3/.test(e.name) && e.transferSize > 0)
    .map(e => e.name.split('/').pop()))]);

  // ── 主帅卡片（固定镜头→投影→点击） ──
  await page.evaluate(() => {
    const u = window.__units['caoMain']; const gp = u.group.position;
    window.__cam([gp.x + 24, 110, gp.z + 115], [gp.x, 12, gp.z]);
  });
  await sleep(400);
  const pt = await page.evaluate(() => {
    const u = window.__units['caoMain']; const gp = u.group.position;
    let m = null; u.group.traverse(o => { if (o.userData && o.userData.unit) m = o; });
    const lx = m ? m.position.x : 0, ly = m ? m.position.y : 6, lz = m ? m.position.z : 0;
    const p = window.__project(gp.x + lx, gp.y + ly, gp.z + lz);
    return { ...p, found: !!m, g: { x: gp.x, y: gp.y, z: gp.z } };
  });
  report.cmdTest = { pt, tries: [] };
  let card = null;
  for (const [dx, dy] of [[0, 0], [8, 6], [-8, 6], [0, 14]]) {
    await page.mouse.click(pt.x + dx, pt.y + dy);
    await sleep(420);
    card = await page.evaluate(() => ({
      show: document.getElementById('unitCard').classList.contains('show'),
      portrait: document.getElementById('ucPortrait').classList.contains('show'),
      img: (document.getElementById('ucImg') || {}).src || '',
      pname: (document.getElementById('ucPName') || {}).textContent || '',
    }));
    report.cmdTest.tries.push({ dx, dy, ...card });
    if (card.show) break;
  }
  report.cmdCard = card;
  await page.screenshot({ path: OUT + '/zh-05-主帅卡片.png' });
  await page.screenshot({ path: OUT + '/zh-06-主帅卡片-特写.png', clip: { x: 1600 - 330, y: 900 - 610, width: 320, height: 600 } });

  // ── 自动BGM ──
  report.autoBgmInit = await page.evaluate(() => ({
    btn: !!document.getElementById('bAutoBgm'),
    label: (document.getElementById('bAutoBgm') || {}).textContent,
    bgm: document.getElementById('bBgm').textContent,
  }));
  await page.click('#bAutoBgm');
  await sleep(700);
  report.autoBgmOn = await page.evaluate(() => ({
    label: document.getElementById('bAutoBgm').textContent,
    hot: document.getElementById('bAutoBgm').classList.contains('hot'),
    persist: localStorage.getItem('battlefield.chibi.autobgm'),
    bgm: document.getElementById('bBgm').textContent,
  }));
  await page.click('#bNext');
  await sleep(1600);
  report.autoBgmScene2 = await page.evaluate(() => document.getElementById('bBgm').textContent);
  await sleep(1600);
  report.ostFetch = await page.evaluate(() => [...new Set(performance.getEntriesByType('resource')
    .map(e => e.name).filter(n => /music\/ost\//.test(n)).map(n => n.split('/').pop()))]);
  const ctrlClip2 = await page.evaluate(() => {
    const b = document.getElementById('bAutoBgm'); if (!b) return null;
    const row = b.parentElement.getBoundingClientRect();
    return { x: 0, y: Math.max(0, row.y - 22), width: 1600, height: row.height + 44 };
  });
  if (ctrlClip2) await page.screenshot({ path: OUT + '/zh-09-自动BGM.png', clip: ctrlClip2 });
  await page.click('#bAutoBgm');
  await sleep(500);
  report.autoBgmOff = await page.evaluate(() => ({
    label: document.getElementById('bAutoBgm').textContent,
    persist: localStorage.getItem('battlefield.chibi.autobgm'),
    bgm: document.getElementById('bBgm').textContent,
  }));

  // ── 单一真实地图风格 ──
  report.realStyle = await page.evaluate(() => ({
    mapToggle: !!document.getElementById('bMapStyle'),
    panelVar: getComputedStyle(document.body).getPropertyValue('--panel').trim(),
    mapCmdCards: document.querySelectorAll('#labels .cmdCard').length,
    timeline: !!document.getElementById('timeline'),
    labelBox: (() => { const b = document.querySelector('.uLab .box'); if (!b) return null;
      const cs = getComputedStyle(b); return { bg: cs.backgroundColor, border: cs.borderStyle, shadow: cs.boxShadow.slice(0, 40) }; })(),
  }));
  await page.screenshot({ path: OUT + '/zh-07-真实地图亮色.png' });

  // ── 控制栏缩小/恢复 ──
  await page.click('#bMin');
  await sleep(350);
  report.deckMiniTest = { mini: await page.evaluate(() => ({
    on: document.body.classList.contains('deck-mini'),
    deckDisplay: getComputedStyle(document.getElementById('deck')).display,
    tabDisplay: getComputedStyle(document.getElementById('deckMini')).display,
  })) };
  let sub = null;
  for (let k = 0; k < 5; k++) {
    await sleep(700);
    sub = await page.evaluate(() => {
      const el = document.getElementById('subtitle');
      const tx = (el.textContent || '').trim();
      if (!tx || !el.classList.contains('show')) return null;
      const css=getComputedStyle(el);
      return {text:tx,fontSize:css.fontSize,font:css.fontFamily,weight:css.fontWeight};
    });
    if (sub) break;
  }
  report.deckMiniSub = sub ? { fontSize: sub.fontSize,
    font:sub.font,weight:sub.weight,
    lines: sub.text.split('\n').map(l => [...l].length),
    punct: (sub.text.match(/[\p{P}\p{S}]/gu) || []).length,
    sample: sub.text.slice(0, 40) } : null;
  if (!report.deckMiniSub || report.deckMiniSub.lines.length !== 1 || report.deckMiniSub.lines[0] > 15 || report.deckMiniSub.punct) {
    errors.push('[subtitle] 收起控制面板后字幕须单行、最多15字、无标点');
  }
  if (report.realStyle.mapToggle || report.realStyle.mapCmdCards !== 3) {
    errors.push('[ui] 单一真实地图或三阵营随军主帅卡未就绪');
  }
  report.editorRemoved=await page.evaluate(()=>!document.getElementById('editPanel')&&!document.getElementById('editorCss'));
  if(!report.editorRemoved)errors.push('[ui] 编辑模式仍然存在');
  if(!sub?.font.includes('Microsoft YaHei')||sub?.weight!=='700')errors.push('[subtitle] 字幕须微软雅黑加粗');
  await page.screenshot({ path: OUT + '/zh-08-控制栏缩小到右侧栏.png' });
  await page.click('#deckMini');
  await sleep(350);
  report.deckMiniTest.restored = await page.evaluate(() => ({
    on: document.body.classList.contains('deck-mini'),
    deckDisplay: getComputedStyle(document.getElementById('deck')).display,
  }));

  // ── 繁体检 + 残留 ──
  await sleep(300);
  report.residue = await page.evaluate((trad) => {
    const b = document.body.innerText || '';
    const m = b.match(new RegExp('[' + trad.join('') + ']', 'g')) || [];
    return { tradCount: m.length, tradSample: [...new Set(m)].slice(0, 10),
             xiyuan: (b.match(/\u897f\u5143/g) || []).length,
             zhe: (b.match(/\u8457/g) || []).length };
  }, TRAD);

  console.log(JSON.stringify(report, null, 2));
  if(errors.length)process.exitCode=1;
} finally {
  await browser.close();
}
