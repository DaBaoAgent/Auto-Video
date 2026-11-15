// 炎帝全片分镜生成（385.47s / 40配音段 / ~95镜）
// 规则：文字≤30%｜每2秒新动效点｜同屏≥5运动元素｜人物居中｜手机可读｜字幕停顿吸附｜场景边界吸附停顿点
const fs = require('fs');
const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const dub = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'output', '007_炎帝', '配音.json'), 'utf8'));
const sil = fs.readFileSync(path.join(__dirname, 'sil_full.txt'), 'utf8').trim().split('\n').map(Number).sort((a, b) => a - b);
const TOTAL = 385.47;

// ---- 字幕：短语切分 + 停顿吸附（全部40段，连续无偏移）----
function splitPhrases(text) {
  const raw = text.split(/(?<=[。？！，、])/).map(s => s.trim()).filter(Boolean);
  return raw.map(s => ({ raw: s, clean: s.replace(/[。？！，、：""''（）]/g, ''), fin: /[。？！]$/.test(s) }));
}
let si = 0;
function snap(est, win) {
  win = win || 1.2;
  let best = -1, bd = 1e9;
  for (let i = si; i < sil.length; i++) {
    const g = sil[i];
    if (g < est - win || g > est + win) continue;
    const d = Math.abs(g - est);
    if (d < bd) { bd = d; best = i; }
  }
  if (best >= 0) { si = best + 1; return sil[best] + 0.045; }
  return est;
}
const phrases = [];
for (const ch of dub.chunks) {
  const ph = splitPhrases(ch.text);
  const total = ph.reduce((a, p) => a + p.clean.length, 0);
  let cum = 0; const bounds = [];
  for (let j = 0; j < ph.length - 1; j++) { cum += ph[j].clean.length; bounds.push(snap(ch.start + (cum / total) * ch.duration)); }
  for (let j = 0; j < ph.length; j++) {
    let start = j === 0 ? ch.start + 0.02 : bounds[j - 1];
    let end = j === ph.length - 1 ? ch.start + ch.duration : bounds[j];
    if (end - start < 0.25) end = start + 0.25;
    phrases.push({ start, end, text: ph[j].raw, clean: ph[j].clean });
  }
}
for (let i = 0; i < phrases.length - 1; i++) if (phrases[i + 1].start < phrases[i].end) phrases[i].end = phrases[i + 1].start;
phrases[phrases.length - 1].end = TOTAL;
for (let i = phrases.length - 2; i >= 0; i--) {
  if (phrases[i].end - phrases[i].start < 0.3) {
    phrases[i + 1].start = phrases[i].start;
    phrases[i + 1].clean = phrases[i].clean + phrases[i + 1].clean;
    phrases.splice(i, 1);
  }
}

// ---- 场景表（估算边界 → 自动吸附停顿点 ±0.6s）----
let scSi = 0;
function snapCut(est) {
  let best = -1, bd = 1e9;
  for (let i = scSi; i < sil.length; i++) {
    const g = sil[i];
    if (g < est - 0.6 || g > est + 0.6) continue;
    const d = Math.abs(g - est);
    if (d < bd) { bd = d; best = i; }
  }
  if (best >= 0) { scSi = best; return sil[best] + 0.04; }
  return est;
}
const S = [];
const add = (s, e, type, p) => S.push(Object.assign({ s: +s.toFixed(3), e: +e.toFixed(3), type }, p || {}));
function seg(cuts) { // cuts: [t0,t1,...tn] → 依次吸附
  return cuts.map(c => snapCut(c));
}
// ===== S0 钩子 0-32.35（样片定稿镜头）=====
add(0.00, 3.11, 'foodhook');
add(3.11, 5.238, 'foodmore');
add(5.238, 7.262, 'question');
add(7.262, 10.24, 'exclude');
add(10.24, 14.212, 'hero-reveal');
add(14.212, 17.313, 'caobai-sil');
add(17.313, 20.068, 'poison72');
add(20.068, 21.412, 'myth');
add(21.412, 25.707, 'bigger');
add(25.707, 30.974, 'fourcards');
add(30.974, 32.35, 'fourbig');
// ===== S1 种地 32.35-106.33 =====
let c = seg([35.0]); add(32.35, c[0], 'civ-big');
c = seg([42.56]); add(c[0], c[0] + 0.001 + 42.56 - 35.0, 'x');
S.pop(); add(S[S.length - 1].e, snapCut(42.56), 'sil-hunt');
c = seg([44.9]); add(S[S.length - 1].e, c[0], 'unstable-q');
c = seg([48.6]); add(S[S.length - 1].e, c[0], 'row3', { items: [{ lb: '吃撑' }, { lb: '饿死' }, { lb: '团灭' }] });
add(S[S.length - 1].e, snapCut(50.54), 'whatdid');
add(snapCut(50.56), snapCut(55.27), 'sil-seed');
add(snapCut(55.27), snapCut(56.71), 'fivegrain');
add(snapCut(56.71), snapCut(59.74), 'taste');
add(snapCut(59.74), snapCut(62.36), 'sil-plant');
add(snapCut(62.38), snapCut(64.8), 'plant-big');
c = seg([67.5]); add(S[S.length - 1].e, c[0], 'origin-big');
add(S[S.length - 1].e, snapCut(70.0), 'diff-q');
add(S[S.length - 1].e, snapCut(72.78), 'civ-bigword');
c = seg([77.3]); add(S[S.length - 1].e, c[0], 'duo-move');
add(S[S.length - 1].e, snapCut(82.71), 'sil-village');
c = seg([86.5]); add(S[S.length - 1].e, c[0], 'store-center');
add(S[S.length - 1].e, snapCut(89.6), 'timeline', { nodes: [{ lb: '存粮' }, { lb: '人口增长' }, { lb: '部落联盟' }, { lb: '国家' }] });
add(S[S.length - 1].e, snapCut(93.92), 'agri-origin');
add(snapCut(93.94), snapCut(96.4), 'start-center');
add(S[S.length - 1].e, snapCut(101.5), 'fivegrain2');
add(S[S.length - 1].e, snapCut(106.33), 'staple-big');
// ===== S2 尝百草 106.35-160.82 =====
add(snapCut(106.35), snapCut(108.6), 'chapter', { tag: '第二件事', title: '他尝了百草' });
add(S[S.length - 1].e, snapCut(112.5), 'med-origin');
add(S[S.length - 1].e, snapCut(115.93), 'hardendure');
add(snapCut(115.95), snapCut(119.3), 'duo-live');
add(S[S.length - 1].e, snapCut(126.22), 'caobai-sil2');
add(S[S.length - 1].e, snapCut(130.0), 'row3', { items: [{ lb: '拉肚子' }, { lb: '发烧' }, { lb: '止血' }] });
add(S[S.length - 1].e, snapCut(133.2), 'book-note');
add(S[S.length - 1].e, snapCut(135.04), 'bencao-big');
add(snapCut(135.06), snapCut(139.5), 'trust-center');
add(S[S.length - 1].e, snapCut(146.14), 'sil-clinic');
add(S[S.length - 1].e, snapCut(150.5), 'sil-clinic2');
add(S[S.length - 1].e, snapCut(152.3), 'clinical-big');
add(S[S.length - 1].e, snapCut(154.64), 'three-test');
add(S[S.length - 1].e, snapCut(160.82), 'row3', { items: [{ lb: '植物药' }, { lb: '动物药' }, { lb: '矿物药' }] });
// ===== S3 针灸/接生 160.84-210.72 =====
add(snapCut(160.84), snapCut(163.5), 'chapter', { tag: '第三件事', title: '他发明了医药' });
add(S[S.length - 1].e, snapCut(166.8), 'needle-link');
add(S[S.length - 1].e, snapCut(172.5), 'bian-center');
add(S[S.length - 1].e, snapCut(179.05), 'evolution');
add(S[S.length - 1].e, snapCut(183.0), 'principle-big');
add(S[S.length - 1].e, snapCut(190.04), 'who-confirm');
add(snapCut(190.06), snapCut(192.6), 'source-center');
add(S[S.length - 1].e, snapCut(195.5), 'birth-intro');
add(S[S.length - 1].e, snapCut(200.09), 'sil-birth');
add(snapCut(200.11), snapCut(206.0), 'row3', { items: [{ lb: '怎么接生' }, { lb: '产后出血' }, { lb: '照顾新生儿' }] });
add(S[S.length - 1].e, snapCut(210.72), 'save-big');
// ===== S4 市场 210.74-256.40 =====
add(snapCut(210.74), snapCut(213.4), 'chapter', { tag: '第四件事', title: '他搞了最早的市场' });
add(S[S.length - 1].e, snapCut(215.8), 'commerce-big');
add(S[S.length - 1].e, snapCut(220.64), 'market-rule');
add(S[S.length - 1].e, snapCut(224.5), 'swap-duo');
add(S[S.length - 1].e, snapCut(229.43), 'market-big');
add(snapCut(229.45), snapCut(233.3), 'war-swap');
add(S[S.length - 1].e, snapCut(238.02), 'nofight-big');
add(S[S.length - 1].e, snapCut(242.0), 'sil-market');
add(S[S.length - 1].e, snapCut(245.0), 'peace-origin');
add(S[S.length - 1].e, snapCut(249.0), 'not-capital');
add(S[S.length - 1].e, snapCut(256.40), 'today-market');
// ===== S5 炎黄 256.42-298.35 =====
add(snapCut(256.42), snapCut(259.5), 'duo-brothers');
add(S[S.length - 1].e, snapCut(262.5), 'jiangji-timeline');
add(S[S.length - 1].e, snapCut(265.92), 'sil-banquan');
add(snapCut(265.94), snapCut(269.5), 'huaxia-big');
add(S[S.length - 1].e, snapCut(273.8), 'sil-zhuolu');
add(S[S.length - 1].e, snapCut(277.65), 'yanhz-big');
add(snapCut(277.67), snapCut(281.0), 'behind-row');
add(S[S.length - 1].e, snapCut(287.75), 'agri-first');
add(S[S.length - 1].e, snapCut(292.5), 'alliance-big');
add(S[S.length - 1].e, snapCut(298.35), 'huaxia-origin');
// ===== S6 炎帝之名/陶器 298.37-329.06 =====
add(snapCut(298.37), snapCut(301.2), 'why-yan');
add(S[S.length - 1].e, snapCut(303.5), 'bowl-center');
add(S[S.length - 1].e, snapCut(307.68), 'sil-boil');
add(snapCut(307.70), snapCut(312.0), 'sil-pottery');
add(S[S.length - 1].e, snapCut(317.54), 'pottery-big');
add(snapCut(317.56), snapCut(322.0), 'row3', { items: [{ lb: '能煮着吃' }, { lb: '好消化' }, { lb: '存水存粮' }] });
add(S[S.length - 1].e, snapCut(329.06), 'yan-fire');
// ===== S7 跟你有什么关系 329.08-385.47 =====
add(snapCut(329.08), snapCut(332.5), 'rel-a');
add(S[S.length - 1].e, snapCut(336.07), 'rel-b');
add(snapCut(336.09), snapCut(341.0), 'norelation-q');
add(S[S.length - 1].e, snapCut(345.36), 'heritage-big');
add(S[S.length - 1].e, snapCut(349.5), 'west-q');
add(S[S.length - 1].e, snapCut(353.37), 'sil-cave');
add(S[S.length - 1].e, snapCut(358.5), 'three-doing');
add(S[S.length - 1].e, snapCut(363.76), 'shenong-start');
add(snapCut(363.78), snapCut(368.5), 'never-stop');
add(S[S.length - 1].e, snapCut(372.49), 'bone-big');
add(snapCut(372.51), snapCut(377.0), 'only-civ');
add(S[S.length - 1].e, snapCut(383.24), 'bone-center');
add(snapCut(383.26), TOTAL, 'endcard');

// ---- 音效事件 ----
const events = [];
for (const sc of S) {
  const t = sc.s;
  switch (sc.type) {
    case 'foodhook': [0.15,1.70,2.24,2.73].forEach(x => events.push({ t: t + x, k: 'pop' })); break;
    case 'foodmore': events.push({ t: t + 0.10, k: 'pop' }, { t: t + 1.09, k: 'pop' }); break;
    case 'question': case 'west-q': case 'norelation-q': case 'diff-q': case 'why-yan': events.push({ t: t + 0.15, k: 'whoosh' }); break;
    case 'exclude': events.push({ t: t + 0.3, k: 'pop' }, { t: t + 1.0, k: 'thud' }, { t: t + 1.8, k: 'thud' }); break;
    case 'hero-reveal': events.push({ t: t + 0.1, k: 'whoosh' }, { t: t + 2.26, k: 'thud' }, { t: t + 3.11, k: 'pop' }); break;
    case 'caobai-sil': case 'caobai-sil2': case 'sil-hunt': case 'sil-village': case 'sil-clinic': case 'sil-clinic2': case 'sil-birth': case 'sil-market': case 'sil-boil': case 'sil-pottery': case 'sil-cave': events.push({ t: t + 0.2, k: 'whoosh' }); break;
    case 'poison72': events.push({ t: t + 0.2, k: 'thud' }, { t: t + 2.0, k: 'shimmer' }); break;
    case 'myth': events.push({ t: t + 0.1, k: 'whoosh' }); break;
    case 'bigger': events.push({ t: t + 0.05, k: 'thud' }, { t: t + 1.5, k: 'shimmer' }); break;
    case 'fourcards': [25.75, 26.95, 28.56, 29.65].forEach(x => events.push({ t: x, k: 'pop' })); break;
    case 'fourbig': events.push({ t: t + 0.05, k: 'thud' }); break;
    case 'sil-seed': events.push({ t: t + 0.2, k: 'whoosh' }, { t: t + 3.0, k: 'shimmer' }); break;
    case 'fivegrain': case 'fivegrain2': for (let i = 0; i < 5; i++) events.push({ t: t + 0.15 + i * 0.22, k: 'pop' }); break;
    case 'taste': events.push({ t: t + 0.2, k: 'pop' }, { t: t + 0.9, k: 'pop' }, { t: t + 1.7, k: 'pop' }); break;
    case 'sil-plant': events.push({ t: t + 0.2, k: 'whoosh' }, { t: t + 1.5, k: 'thud' }); break;
    case 'chapter': events.push({ t: t + 0.02, k: 'whoosh' }, { t: t + 0.08, k: 'thud' }); break;
    case 'civ-big': case 'unstable-q': case 'origin-big': case 'civ-bigword': case 'agri-origin': case 'staple-big': case 'med-origin': case 'bencao-big': case 'clinical-big': case 'principle-big': case 'save-big': case 'commerce-big': case 'market-big': case 'nofight-big': case 'peace-origin': case 'huaxia-big': case 'yanhz-big': case 'alliance-big': case 'huaxia-origin': case 'pottery-big': case 'yan-fire': case 'heritage-big': case 'shenong-start': case 'bone-big': case 'only-civ': case 'clinical2': events.push({ t: t + 0.05, k: 'thud' }); break;
    case 'row3': for (let i = 0; i < 3; i++) events.push({ t: t + 0.3 + i * 0.45, k: 'pop' }); break;
    case 'whatdid': case 'plant-big': case 'start-center': case 'trust-center': case 'source-center': case 'store-center': case 'bian-center': case 'bowl-center': case 'needle-link': events.push({ t: t + 0.15, k: 'pop' }); break;
    case 'duo-move': case 'duo-live': case 'swap-duo': case 'duo-brothers': events.push({ t: t + 0.1, k: 'pop' }, { t: t + 0.6, k: 'pop' }); break;
    case 'timeline': case 'jiangji-timeline': case 'evolution': case 'never-stop': for (let i = 0; i < 4; i++) events.push({ t: t + 0.3 + i * 0.55, k: 'pop' }); break;
    case 'sil-banquan': case 'sil-zhuolu': case 'war-swap': events.push({ t: t + 0.2, k: 'thud' }, { t: t + 1.2, k: 'thud' }); break;
    case 'who-confirm': case 'not-capital': events.push({ t: t + 0.3, k: 'shimmer' }); break;
    case 'behind-row': case 'three-test': case 'three-doing': for (let i = 0; i < 3; i++) events.push({ t: t + 0.3 + i * 0.5, k: 'pop' }); break;
    case 'rel-a': case 'rel-b': for (let i = 0; i < 2; i++) events.push({ t: t + 0.25 + i * 0.9, k: 'pop' }); break;
    case 'market-rule': events.push({ t: t + 0.2, k: 'whoosh' }, { t: t + 1.0, k: 'pop' }); break;
    case 'birth-intro': events.push({ t: t + 0.2, k: 'pop' }, { t: t + 1.2, k: 'pop' }); break;
    case 'endcard': events.push({ t: t + 0.1, k: 'whoosh' }, { t: t + 0.2, k: 'thud' }); break;
    case 'bone-center': events.push({ t: t + 0.3, k: 'shimmer' }); break;
    case 'agri-first': events.push({ t: t + 0.2, k: 'pop' }); break;
  }
}

const out = { total: TOTAL, scenes: S, subs: phrases.map(p => [+p.start.toFixed(3), +p.end.toFixed(3), p.clean]), events };
fs.writeFileSync(path.join(__dirname, 'yandi_full_sb.json'), JSON.stringify(out));
fs.writeFileSync(path.join(__dirname, 'yandi_full_sb.js'), 'window.SB=' + JSON.stringify(out) + ';');
console.log('scenes:', S.length, 'subs:', out.subs.length, 'events:', events.length, 'total:', TOTAL);
let bad = 0;
for (let i = 0; i < S.length - 1; i++) { if (S[i + 1].s < S[i].e - 0.01) { console.log('OVERLAP', S[i].type, S[i].e, '->', S[i + 1].s); bad++; } }
if (S[0].s > 0.01) console.log('GAP at start');
if (S[S.length - 1].e < TOTAL - 0.5) console.log('GAP at end:', S[S.length - 1].e);
console.log(bad ? 'HAS OVERLAPS' : 'timeline OK');
const dur = {};
S.forEach(s => { dur[s.type] = (dur[s.type] || 0) + (s.e - s.s); });
const short = S.filter(s => s.e - s.s < 1.2);
console.log('过短镜(<1.2s):', short.map(s => s.type + '@' + s.s.toFixed(1) + '(' + (s.e - s.s).toFixed(2) + 's)').join(', ') || '无');
