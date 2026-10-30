/**
 * 战役推演视频录制器
 * 用法: node tools/record-video.mjs --pkg packages/chibi-full/battlefield.json --out <dir>
 * 原理: CDP Page.startScreencast(JPEG帧) → ffmpeg image2pipe(墙钟时间戳, CFR30) → 临时H264
 *       + 页内 MediaRecorder 抓 AudioEngine.master 音频(opus/128k) → 音频文件
 *       结束后 mux + 终压 → 成品 MP4 (H.264+AAC 剪映兼容)
 */
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const get = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const STYLE = get('style', 'real');
if (STYLE !== 'real') throw new Error('水墨地图已移除；录制器只支持真实地图');
const PKG_PATH = get('pkg', 'packages/chibi-full/battlefield.json').replaceAll('\\', '/');
if (!/^packages\/[a-z][a-z0-9_-]*\/battlefield\.json$/.test(PKG_PATH)) throw new Error('无效战役包路径');
const PKG_SLUG = PKG_PATH.split('/')[1];
const MANIFEST = JSON.parse(fs.readFileSync(new globalThis.URL('../' + PKG_PATH, import.meta.url), 'utf8'));
const SAFE_TITLE = String(MANIFEST.meta?.title || PKG_SLUG).replace(/[<>:"/\\|?*]/g, '').trim();
const OUT = get('out', path.join(process.cwd(), 'content', SAFE_TITLE, '视频输出'));
const HOME = os.homedir().replaceAll('\\', '/');
const FF = process.env.FFMPEG || HOME + '/bin/ffmpeg.exe';
const FFPROBE = process.env.FFPROBE || HOME + '/bin/ffprobe.exe';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = get('base', 'http://127.0.0.1:8125');
const URL = BASE + '/play.html?pkg=' + encodeURIComponent(PKG_PATH) + '&record=1';
const PREVIEW=argv.includes('--preview'),LIMIT=Number(get('seconds','0'));
const RENDER_SCALE=Number(get('render-scale','1')),JPEG_QUALITY=Number(get('jpeg-quality','80'));
if(RENDER_SCALE<.7||RENDER_SCALE>1||JPEG_QUALITY<65||JPEG_QUALITY>95)throw new Error('录制画质参数超出范围');
if(!Number.isFinite(LIMIT)||LIMIT<0||LIMIT&& !PREVIEW)throw new Error('--seconds 只用于 --preview 的片段验收');
const RUN=new Date().toISOString().replace(/[:.]/g,'-');
const TMP_V = path.join(OUT, `.tmp-video-${RUN}.mp4`);
const AUDIO_NAME=`record-audio-${RUN}.webm`;
const TMP_A = path.join(OUT, AUDIO_NAME);
const FINAL = path.join(OUT, SAFE_TITLE + (PREVIEW?'_预览':'_推演') + '_1080p_'+RUN+'.mp4');
const filmPath=new globalThis.URL('../packages/'+PKG_SLUG+'/film.json',import.meta.url);
const film=fs.existsSync(filmPath)?JSON.parse(fs.readFileSync(filmPath,'utf8')):null;
if(film&&!film.audioReady&&!PREVIEW)throw new Error('完整版尚未生成全部配音；请先运行 generate-film-narration.py，画面测试可用 --preview --seconds 20');
// 旁白复听门禁:凡有 narration/audit.json 的包,正式出片前必须 passed;预览不拦。
const auditPath=new globalThis.URL('../packages/'+PKG_SLUG+'/narration/audit.json',import.meta.url);
if(!PREVIEW&&fs.existsSync(auditPath)){
  const g=JSON.parse(fs.readFileSync(auditPath,'utf8'));
  if(!g.passed)throw new Error(`旁白复听门禁未通过(失败幕 ${JSON.stringify(g.failed??[])}),修好发音再出片`);
}
const MAX_MIN = 45;
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(`[rec ${new Date().toTimeString().slice(0, 8)}]`, ...a);

let frames = 0, tVideo0 = 0, tAudio0 = 0, lastFrameAt = 0;
let ff = null,activeBrowser=null;
function startFfmpeg() {
  ff = spawn(FF, ['-y', '-loglevel', 'warning', '-thread_queue_size', '1024',
    '-use_wallclock_as_timestamps', '1', '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', 'pipe:0',
    '-fps_mode', 'cfr', '-r', '30', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '14',
    '-pix_fmt', 'yuv420p', TMP_V], { stdio: ['pipe', 'ignore', 'pipe'] });
  ff.stderr.on('data', d => { const s = String(d).trim(); if (s) log('ffmpeg:', s.slice(0, 200)); });
  ff.on('exit', c => log('ffmpeg 退出码:', c));
}

async function main() {
  let browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--window-size=1936,1200', '--force-device-scale-factor=1', '--mute-audio',
      '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist',
      '--use-angle=d3d11', '--enable-gpu', '--enable-unsafe-swiftshader',
      '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
      '--disable-features=CalculateNativeWinOcclusion'],
    defaultViewport: { width: 1920, height: 1080 },
  });
  activeBrowser=browser;
  let page = await browser.newPage();
  page.on('pageerror', e => log('页面错误:', String(e).slice(0, 300)));
  page.on('console', m => { if (m.type() === 'error') log('console.error:', m.text().slice(0, 200)); });
  await page.evaluateOnNewDocument((slug) => {
    try { localStorage.setItem(`battlefield.${slug}.autobgm`, '1'); } catch (e) {}
  }, PKG_SLUG);

  log('加载页面...');
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await sleep(3000);
  const eng = await page.evaluate(() => !!(window.__eng && window.__eng.AudioEngine));
  if (!eng) throw new Error('window.__eng 未暴露, 补丁未生效?');
  await page.waitForFunction(()=>document.getElementById('loadMsg')?.classList.contains('off'));
  await page.evaluate(() => document.getElementById('bMin').click());
  await page.evaluate(()=>document.getElementById('intro')?.classList.add('off'));
  await page.evaluate(scale=>window.__eng.setRenderScale(scale),RENDER_SCALE);
  log('真实地图 | 设置抽屉已收 | 自动BGM 已开');

  // 探帧率
  const fps = await page.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(n / ((performance.now() - t0) / 1000)); };
    requestAnimationFrame(tick);
  }));
  log('帧率探测:', fps.toFixed(1), 'fps', fps < 18 ? '(低! 尝试有头模式)' : '');

  if (fps < 18 && argv.includes('--headful')) {
    await browser.close();
    log('切换有头模式重试...');
    browser = await puppeteer.launch({
      executablePath: CHROME, headless: false,
      args: ['--window-size=1936,1200', '--window-position=40,40', '--force-device-scale-factor=1', '--mute-audio',
        '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist', '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion'],
      defaultViewport: { width: 1920, height: 1080 },
    });
    activeBrowser=browser;
    page = await browser.newPage();
    page.on('pageerror', e => log('页面错误:', String(e).slice(0, 300)));
    await page.evaluateOnNewDocument((slug) => {
      try { localStorage.setItem(`battlefield.${slug}.autobgm`, '1'); } catch (e) {}
    }, PKG_SLUG);
    await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
    await sleep(3000);
    await page.evaluate(() => document.getElementById('bMin').click());
    log('有头模式就绪');
  }

  // 下载行为
  try {
    const bs = await browser.target().createCDPSession();
    await bs.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT.replace(/\//g, '\\'), eventsEnabled: true });
  } catch (e) { log('Browser下载域失败(试Page域):', String(e).slice(0, 80)); }
  try { const pc = await page.createCDPSession(); await pc.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT.replace(/\//g, '\\') }); } catch (e) { try { const pc2 = await page.createCDPSession(); await pc2.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT.replace(/\//g, '\\') }); } catch (e2) {} }

  // 解锁音频 + 音频录制准备
  const ainfo = await page.evaluate(() => {
    try { window.__eng.AudioEngine.unlock(); } catch (e) {}
    const A = window.__eng.AudioEngine;
    if (!A.ctx) return { ok: false, why: 'ctx 未创建' };
    const d = A.ctx.createMediaStreamDestination();
    A.master.connect(d);
    const mime = ['audio/webm;codecs=opus', 'audio/webm'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m));
    if (!mime) return { ok: false, why: 'MediaRecorder 不支持' };
    window.__recDest = d; window.__audioChunks = []; window.__recMime = mime;
    window.__rec = null;
    return { ok: true, mime };
  });
  log('音频准备:', JSON.stringify(ainfo));
  if (!ainfo.ok) throw new Error('音频录制准备失败: ' + ainfo.why);

  // 屏幕流 + ffmpeg
  startFfmpeg();
  const client = await page.createCDPSession();
  await client.send('Page.enable');
  client.on('Page.screencastFrame', async (ev) => {
    if (!tVideo0) { tVideo0 = Date.now(); log('首帧! 开始计时'); }
    frames++; lastFrameAt = Date.now();
    try {
      if (!ff.stdin.write(Buffer.from(ev.data, 'base64'))) await once(ff.stdin, 'drain');
    } catch (e) {}
    try { await client.send('Page.screencastFrameAck', { sessionId: ev.sessionId }); } catch (e) {}
  });
  await client.send('Page.startScreencast', { format: 'jpeg', quality: JPEG_QUALITY, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await sleep(1200);

  // 开始音频录制 + 启动播映
  const tPre = Date.now();
  await page.evaluate((audioName) => {
    const rec = new MediaRecorder(window.__recDest.stream, { mimeType: window.__recMime, audioBitsPerSecond: 128000 });
    rec.ondataavailable = e => { if (e.data.size) window.__audioChunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(window.__audioChunks, { type: 'audio/webm' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = audioName; document.body.appendChild(a); a.click();
    };
    rec.start(5000); window.__rec = rec;
  },AUDIO_NAME);
  tAudio0 = Date.now();
  await page.evaluate(() => document.getElementById('btnAuto').click());
  await page.evaluate(()=>document.getElementById('intro')?.remove());
  log('播映开始 (音画偏移≈', ((tAudio0 - tVideo0) / 1000).toFixed(1), 's)');

  // 监控
  const t0 = Date.now();
  let lastTag = '', lastChange = Date.now(), lastLog = 0, lastFr = 0;
  while (true) {
    await sleep(5000);
    const stt = await page.evaluate(() => ({
      tag: document.getElementById('phTag').textContent, fin:window.__eng.state().ended,
      busy: (() => { try { return window.__eng.Narration.busy(); } catch (e) { return null; } })(),
    }));
    const el = (Date.now() - t0) / 1000;
    if(LIMIT&&el>=LIMIT){log('预览片段验收结束');break;}
    if (stt.tag !== lastTag) { lastTag = stt.tag; lastChange = Date.now(); }
    if (Date.now() - lastLog > 30000) {
      lastLog = Date.now();
      const fpsNow = (frames - lastFr) / 30; lastFr = frames;
      log(`进度 ${lastTag} | 已录 ${(el / 60).toFixed(1)} 分钟 | 帧 ${frames} | 近期 ${fpsNow.toFixed(1)} fps | 旁白忙=${stt.busy} | 终幕=${stt.fin}`);
    }
    if (stt.fin && stt.busy === false) { log('终幕+旁白结束, 等 9 秒收尾...'); await sleep(9000); break; }
    if (Date.now() - lastChange > 300000 && stt.busy === false) throw new Error('本幕停滞超过五分钟，保留录制素材；没有跳过旁白');
    if (el > MAX_MIN * 60) throw new Error('录制超过时长上限');
    if (ff.exitCode !== null) throw new Error('录制编码器意外退出');
  }

  // 收尾: 先停视频, 1.5s 后停音频 (音频略长, mux 时 -shortest 截齐)
  log('停止视频流...');await client.send('Page.stopScreencast');try { ff.stdin.end(); } catch (e) {}
  await sleep(1500);
  log('停止音频...'); await page.evaluate(() => window.__rec && window.__rec.state !== 'inactive' && window.__rec.stop());
  const af = TMP_A;
  for (let i = 0; i < 60; i++) { await sleep(1000); if (fs.existsSync(af) && fs.statSync(af).size > 100000) break; }
  log('音频文件:', fs.existsSync(af) ? (fs.statSync(af).size / 1048576).toFixed(1) + 'MB' : '未落地!');
  try { await browser.close(); } catch (e) {}
  activeBrowser=null;
  if (ff.exitCode === null) { try { await once(ff, 'exit'); } catch (e) {} await sleep(500); }
  log('视频临时文件:', fs.existsSync(TMP_V) ? (fs.statSync(TMP_V).size / 1048576).toFixed(0) + 'MB' : '不存在!');

  // mux + 终压
  const off = (tAudio0 - tVideo0) / 1000;
  log('合成中 (音画偏移', off.toFixed(1), 's)...');
  const muxArgs = ['-y', '-loglevel', 'error'];
  muxArgs.push('-i', TMP_V);
  if (off > 0.03) muxArgs.push('-itsoffset', off.toFixed(3));
  muxArgs.push('-i', TMP_A, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', FINAL);
  const mux = spawn(FF, muxArgs, { stdio: ['ignore', 'ignore', 'pipe'] });
  let merr = ''; mux.stderr.on('data', d => merr += String(d));
  const [muxCode]=await once(mux, 'exit');
  if(muxCode!==0)throw new Error('音画合成失败 '+merr.slice(0,300));
  if (merr.trim()) log('mux stderr:', merr.slice(0, 300));
  log('完成 →', FINAL);

  // 海报帧
  try {
    const poster = path.join(OUT, 'poster.jpg');
    const p = spawn(FF, ['-y', '-loglevel', 'error', '-ss', PREVIEW?'00:00:08':'00:04:00', '-i', FINAL, '-frames:v', '1', '-q:v', '3', poster]);
    await once(p, 'exit'); log('海报帧 →', poster);
  } catch (e) {}
  // 校验
  {
    const probe = spawn(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,avg_frame_rate', '-of', 'json', FINAL]);
    let out = ''; probe.stdout.on('data', d => out += String(d));
    const [probeCode]=await once(probe, 'exit');if(probeCode!==0)throw new Error('无法验证成片');
    log('成品信息:',out.replace(/\s+/g,' ').slice(0,500));
    const info=JSON.parse(out),captureSeconds=(lastFrameAt-tVideo0)/1000;
    const report={file:FINAL,preview:PREVIEW,package:PKG_SLUG,frames,captureSeconds,
      captureFps:frames/captureSeconds,renderScale:RENDER_SCALE,jpegQuality:JPEG_QUALITY,audioOffset:off,info};
    fs.writeFileSync(FINAL.replace(/\.mp4$/,'.json'),JSON.stringify(report,null,2));
    if(!info.streams.some(s=>s.codec_type==='video'&&s.width===1920&&s.height===1080)||!info.streams.some(s=>s.codec_type==='audio'))throw new Error('成片规格验证失败');
  }
  try { fs.unlinkSync(TMP_V); log('已清理临时视频'); } catch (e) {}
  log('全部完成 ✓');
}
if(argv.includes('--offline'))await import('./render-film.mjs');
else main().catch(async e => {console.error('[rec] 失败:',e);if(activeBrowser)await activeBrowser.close().catch(()=>{});
  if(ff&&ff.exitCode===null)ff.kill();process.exitCode=1;});
