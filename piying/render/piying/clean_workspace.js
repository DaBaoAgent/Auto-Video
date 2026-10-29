// 工作区清理器（每集交付后运行，供下一集开工准备）
// 用法：
//   node clean_workspace.js            # dry-run，只列出将删除的内容与可释放空间
//   node clean_workspace.js --apply    # 实际删除
// 删除范围（全部为可重跑的中间产物）：
//   1) 顶层帧目录 frames*/ 、探针帧 probe*/*、旧抽帧 qc/
//   2) render/<线>/ 下的草稿视频 *_draft*.mp4
//   3) render/<线>/ 与 audio/ 下的中间音频（pre_/full_mix/mix_with_bgm/bgm_track/final_mix/sample_*/a_seg/b_seg/gap）
// 保留：
//   所有 .js/.html/.json/.txt 脚本与分镜数据、qc_* 核验凭证、out/ 交付物、node_modules/、素材源目录（006/007/008）
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const BASE = __dirname.replace(/render[\\/](yandi|nuwa).*$/, '') || process.cwd();
const ROOT = path.resolve(BASE);
const VIDEO_DIR = ROOT; // yandi-video 根

const FRAME_DIRS = ['frames', 'frames_full', 'frames_nuwa', 'frames_yandi_full', 'frames_yandi_sample', 'qc'];
const AUDIO_PAT = /^(pre_|full_mix|mix_with_bgm|bgm_track|final_mix|sample_|a_seg|b_seg|gap)/;
const sizeOfDir = (d) => {
  let s = 0; const w = [d];
  while (w.length) {
    const cur = w.pop(); let es = [];
    try { es = fs.readdirSync(cur, { withFileTypes: true }); } catch (e) { continue; }
    for (const e of es) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) w.push(p); else { try { s += fs.statSync(p).size; } catch (_) {} }
    }
  }
  return s;
};

const targets = []; // {path, kind, size}
const push = (p, kind, size) => { if (fs.existsSync(p)) targets.push({ p, kind, size }); };

// 1) 帧目录
for (const d of FRAME_DIRS) {
  const p = path.join(VIDEO_DIR, d);
  if (fs.existsSync(p)) push(p, 'dir', sizeOfDir(p));
}
// 2) 探针/抽帧目录（任意层级的 probe*）
const walk = (dir, depth) => {
  if (depth > 3) return;
  let es = [];
  try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of es) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === 'out' || e.name === 'vendor') continue;
    if (/^probe/i.test(e.name)) push(p, 'dir', sizeOfDir(p));
    else walk(p, depth + 1);
  }
};
walk(VIDEO_DIR, 0);
// 3) 草稿视频 + 中间音频
const walkFiles = (dir, depth) => {
  if (depth > 3) return;
  let es = [];
  try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of es) {
    if (e.isDirectory()) { if (!/node_modules|^out$|vendor/.test(e.name)) walkFiles(path.join(dir, e.name), depth + 1); continue; }
    const p = path.join(dir, e.name);
    const base = e.name.replace(/\.[^.]+$/, '');
    if (/_draft/.test(base) && /\.(mp4|mov)$/i.test(e.name)) push(p, 'file', fs.statSync(p).size);
    else if (/\.wav$/i.test(e.name) && AUDIO_PAT.test(base) && !/配音/.test(e.name)) {
      // 排除源配音轨（配音.wav）与 narration-chunks
      if (!/narration-chunks/.test(p)) push(p, 'file', fs.statSync(p).size);
    }
  }
};
walkFiles(VIDEO_DIR, 0);

// 输出
let total = 0;
console.log('\n=== 工作区清理' + (APPLY ? '（执行）' : '（dry-run，加 --apply 执行）') + ' ===');
console.log('根目录:', VIDEO_DIR);
if (!targets.length) console.log('无需清理，工作区已干净。');
for (const t of targets.sort((a, b) => b.size - a.size)) {
  total += t.size;
  console.log((APPLY ? '删除 ' : '将删 ') + (t.kind === 'dir' ? '[目录] ' : '[文件] ') + path.relative(VIDEO_DIR, t.p) + '  ' + (t.size / 1048576).toFixed(1) + 'MB');
}
if (targets.length) {
  console.log('合计可释放 ' + (total / 1073741824).toFixed(2) + ' GB');
  if (APPLY) {
    for (const t of targets) { try { fs.rmSync(t.p, { recursive: true, force: true }); } catch (e) { console.log('失败', t.p, e.message); } }
    console.log('清理完成。');
  }
}
