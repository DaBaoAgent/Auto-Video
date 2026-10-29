// 炎帝样片分镜生成（A段钩子 0-32.35 + 0.6s接点 + B段种地故事 50.56-62.36）
// 时间轴规则：字幕边界必须来自 silencedetect（-35dB/d=0.06）吸附，短语按标点切分
const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const dub = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'output', '007_炎帝', '配音.json'), 'utf8'));
const sil = fs.readFileSync(path.join(__dirname, 'sil_full.txt'), 'utf8').trim().split('\n').map(Number).sort((a, b) => a - b);

const A_END = 32.35;          // A段结束（chunk3 末 32.34）
const B_SRC0 = 50.56;         // B段源起点（chunk6 start）
const GAP = 0.25;             // 接点（用户裁定：段落间停顿过长，0.6→0.25）
const B_OFF = (A_END + GAP) - B_SRC0; // B段时间偏移 = 32.95 - 50.56 = -17.61
const TOTAL = A_END + GAP + (62.36 - B_SRC0); // ≈ 44.75

function splitPhrases(text) {
  const raw = text.split(/(?<=[。？！，、])/).map(s => s.trim()).filter(Boolean);
  return raw.map(s => ({ raw: s, clean: s.replace(/[。？！，、：""''（）]/g, ''), fin: /[。？！]$/.test(s) }));
}
function makeSnapper() {
  let si = 0;
  return function (est) {
    let best = -1, bd = 1e9;
    for (let i = si; i < sil.length; i++) {
      const g = sil[i];
      if (g < est - 1.2 || g > est + 1.2) continue;
      const d = Math.abs(g - est);
      if (d < bd) { bd = d; best = i; }
    }
    if (best >= 0) { si = best + 1; return sil[best] + 0.045; }
    return est;
  };
}
// ---- A段字幕（chunks 1-3，原始时间）----
const snapA = makeSnapper();
const subsA = [];
for (const ch of dub.chunks) {
  if (ch.index > 3) break;
  const ph = splitPhrases(ch.text);
  const total = ph.reduce((a, p) => a + p.clean.length, 0);
  let cum = 0; const bounds = [];
  for (let j = 0; j < ph.length - 1; j++) { cum += ph[j].clean.length; bounds.push(snapA(ch.start + (cum / total) * ch.duration)); }
  for (let j = 0; j < ph.length; j++) {
    let start = j === 0 ? ch.start + 0.02 : bounds[j - 1];
    let end = j === ph.length - 1 ? ch.start + ch.duration : bounds[j];
    if (end - start < 0.25) end = start + 0.25;
    subsA.push({ start, end, text: ph[j].raw, clean: ph[j].clean });
  }
}
// ---- B段字幕（chunk index=6，加偏移）----
const snapB = makeSnapper();
const subsB = [];
for (const ch of dub.chunks) {
  if (ch.index !== 6) continue;
  const ph = splitPhrases(ch.text);
  const total = ph.reduce((a, p) => a + p.clean.length, 0);
  let cum = 0; const bounds = [];
  for (let j = 0; j < ph.length - 1; j++) { cum += ph[j].clean.length; bounds.push(snapB(ch.start + (cum / total) * ch.duration)); }
  for (let j = 0; j < ph.length; j++) {
    let start = (j === 0 ? ch.start + 0.02 : bounds[j - 1]) + B_OFF;
    let end = (j === ph.length - 1 ? ch.start + ch.duration : bounds[j]) + B_OFF;
    if (end - start < 0.25) end = start + 0.25;
    subsB.push({ start, end, text: ph[j].raw, clean: ph[j].clean });
  }
}
// 合并 <0.3s 碎句（段内）
function mergeTiny(arr, segEnd) {
  for (let i = arr.length - 2; i >= 0; i--) {
    if (arr[i].end - arr[i].start < 0.3) { arr[i + 1].start = arr[i].start; arr[i + 1].clean = arr[i].clean + arr[i + 1].clean; arr.splice(i, 1); }
  }
  if (arr.length > 1 && segEnd - arr[arr.length - 1].start < 0.3) {
    const last = arr.pop(); arr[arr.length - 1].end = last.end; arr[arr.length - 1].clean += last.clean;
  }
}
mergeTiny(subsA, A_END);
mergeTiny(subsB, TOTAL);

// ---- 场景表（边界对齐停顿点）----
const S = [];
const add = (s, e, type, p) => S.push(Object.assign({ s, e, type }, p || {}));
// A段 钩子
add(0.00, 3.11, 'foodhook');                 // 米饭白菜萝卜猪肉
add(3.11, 5.238, 'foodmore');                // 茶+中药
add(5.238, 7.262, 'question');               // 谁发现的？
add(7.262, 10.24, 'exclude');                // 野人/道士 排除
add(10.24, 14.212, 'hero-reveal');           // 炎帝登场+名牌
add(14.212, 17.313, 'caobai-sil');           // 尝百草剪影
add(17.313, 20.068, 'poison72');             // 七十二毒+茶解毒
add(20.068, 21.412, 'myth');                 // 听着像神话是吧？
add(21.412, 25.707, 'bigger');               // 比你想象的要大得多
add(25.707, 30.974, 'fourcards');            // 四件事卡片
add(30.974, A_END, 'fourbig');               // 一个人干了四件事
// B段 种地故事（偏移后：src-17.61）
add(A_END + GAP, 37.667, 'sil-seed');        // 种子落地观察 32.95-37.67（src 50.56-55.277）
add(37.667, 39.101, 'fivegrain');            // 种子能吃→五谷 37.67-39.10（src 55.277-56.711）
add(39.101, 42.138, 'taste');                // 于是他开始试 39.10-42.14（src 56.711-59.748）
add(42.138, TOTAL, 'sil-plant');             // 大面积种植 42.14-44.75（src 59.748-62.36）

// ---- 音效事件 ----
const events = [];
for (const sc of S) {
  if (sc.type === 'foodhook') { [0.15,1.70,2.24,2.73].forEach(x => events.push({ t: sc.s + x, k: 'pop' })); }
  else if (sc.type === 'foodmore') events.push({ t: sc.s + 0.10, k: 'pop' }, { t: sc.s + 1.09, k: 'pop' });
  else if (sc.type === 'question') events.push({ t: sc.s + 0.15, k: 'whoosh' });
  else if (sc.type === 'exclude') events.push({ t: sc.s + 0.3, k: 'pop' }, { t: sc.s + 1.0, k: 'thud' }, { t: sc.s + 1.8, k: 'thud' });
  else if (sc.type === 'hero-reveal') events.push({ t: sc.s + 0.1, k: 'whoosh' }, { t: sc.s + 2.26, k: 'thud' }, { t: sc.s + 3.11, k: 'pop' });
  else if (sc.type === 'caobai-sil') events.push({ t: sc.s + 0.2, k: 'whoosh' });
  else if (sc.type === 'poison72') events.push({ t: sc.s + 0.2, k: 'thud' }, { t: sc.s + 1.2, k: 'pop' }, { t: sc.s + 2.0, k: 'shimmer' });
  else if (sc.type === 'myth') events.push({ t: sc.s + 0.1, k: 'whoosh' });
  else if (sc.type === 'bigger') events.push({ t: sc.s + 0.05, k: 'thud' }, { t: sc.s + 1.5, k: 'shimmer' });
  else if (sc.type === 'fourcards') { for (let i = 0; i < 4; i++) events.push({ t: [25.75, 26.95, 28.56, 29.65][i], k: 'pop' }); }
  else if (sc.type === 'fourbig') events.push({ t: sc.s + 0.05, k: 'thud' }, { t: sc.s + 0.1, k: 'whoosh' });
  else if (sc.type === 'sil-seed') events.push({ t: sc.s + 0.2, k: 'whoosh' }, { t: sc.s + 1.9, k: 'pop' }, { t: sc.s + 3.0, k: 'shimmer' });
  else if (sc.type === 'fivegrain') { for (let i = 0; i < 5; i++) events.push({ t: sc.s + 0.15 + i * 0.22, k: 'pop' }); }
  else if (sc.type === 'taste') events.push({ t: sc.s + 0.2, k: 'pop' }, { t: sc.s + 0.9, k: 'pop' }, { t: sc.s + 1.7, k: 'pop' });
  else if (sc.type === 'sil-plant') events.push({ t: sc.s + 0.2, k: 'whoosh' }, { t: sc.s + 1.5, k: 'thud' });
}

const out = { total: +TOTAL.toFixed(2), scenes: S, subs: subsA.concat(subsB).map(p => [+p.start.toFixed(3), +p.end.toFixed(3), p.clean]).sort((a, b) => a[0] - b[0]), events, gap: { s: A_END, e: A_END + GAP } };
fs.writeFileSync(path.join(__dirname, 'yandi_sb.json'), JSON.stringify(out));
fs.writeFileSync(path.join(__dirname, 'yandi_sb.js'), 'window.SB=' + JSON.stringify(out) + ';');
console.log('scenes:', S.length, 'subs:', out.subs.length, 'events:', events.length, 'total:', TOTAL.toFixed(2), 'B_OFF:', B_OFF.toFixed(2));
console.log('--- 字幕抽查 ---');
out.subs.slice(0, 6).forEach(s => console.log(s[0], s[1], s[2]));
console.log('...');
out.subs.slice(-6).forEach(s => console.log(s[0], s[1], s[2]));
