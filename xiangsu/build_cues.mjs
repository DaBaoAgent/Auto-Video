#!/usr/bin/env node
// xiangsu · 全片 cue 表生成（词级强制对齐）
//
//   node build_cues.mjs <口播稿.md> <配音.transcript.json> <out/cues.json> [beats.json]
//
//   1  口播稿句子（按 。！？ 切）↔ 词级转写：字符级 LCS 对齐，得到每个字的真实起止；
//   2  beats.json 用片段定位镜头切点（吸附到该片段的第一个字）；
//   3  每句按逗号/顿号/分号/冒号切子句 → 字幕条（≤17 字、≥0.45 s、不跨镜头、条内可含空格分隔小句）；
//   4  hits：镜头起点 + beats 指定的关键词落点。
//
// beats.json：[{ "shot": "s02", "match": "穿着教皇一样的衣服", "hits": ["鱼皮"] }, ...]
//   match 为空 = 0.000 s；match 必须是口播稿原文里的连续片段。

import fs from 'node:fs';
import path from 'node:path';

const [scriptPath, trPath, outPath, beatsPath] = process.argv.slice(2);
if (!scriptPath || !trPath || !outPath) {
  console.error('用法: node build_cues.mjs <口播稿.md> <配音.transcript.json> <cues.json> [beats.json]');
  process.exit(2);
}

// ---------------------------------------------------------------- 口播稿
const md = fs.readFileSync(scriptPath, 'utf8');
const body = md.split(/\r?\n/)
  .filter(l => !/^\s*[>#]/.test(l) && !/^\s*---/.test(l))
  .join('\n')
  .replace(/〔[^〕]*〕/g, '\n');
const rawSentences = body.split(/[。！？!?]+/).map(s => s.replace(/\*\*/g, '').trim()).filter(Boolean);

const SPOKEN = /[\u3400-\u9fff0-9A-Za-z]/;
const isSpoken = ch => SPOKEN.test(ch);
const strip = s => Array.from(s).filter(isSpoken).join('');

const sentences = rawSentences.map((text, i) => ({ i, text, spoken: strip(text) }));
const scriptChars = [], charSentence = [];
for (const s of sentences) for (const ch of s.spoken) { scriptChars.push(ch); charSentence.push(s.i); }
// 全片 spoken 串（用于 beats 片段定位）
let spokenAll = '', sentOf = [];
sentences.forEach((s, si) => { spokenAll += s.spoken; for (let k = 0; k < s.spoken.length; k++) sentOf.push(si); });

// ---------------------------------------------------------------- 转写
const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
const tChars = [], tStart = [], tEnd = [];
for (const w of tr) for (const ch of String(w.text)) {
  if (!isSpoken(ch)) continue;
  tChars.push(ch); tStart.push(+w.start); tEnd.push(+w.end);
}

// ---------------------------------------------------------------- LCS
const n = scriptChars.length, m = tChars.length, W = m + 1;
const dp = new Uint16Array((n + 1) * W);
for (let i = n - 1; i >= 0; i--) {
  const row = i * W, next = (i + 1) * W;
  for (let j = m - 1; j >= 0; j--) {
    dp[row + j] = scriptChars[i] === tChars[j]
      ? dp[next + j + 1] + 1
      : Math.max(dp[next + j], dp[row + j + 1]);
  }
}
const matchJ = new Int32Array(n).fill(-1);
let i = 0, j = 0, matched = 0;
while (i < n && j < m) {
  if (scriptChars[i] === tChars[j] && dp[i * W + j] === dp[(i + 1) * W + j + 1] + 1) {
    matchJ[i] = j; matched++; i++; j++;
  } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++;
  else j++;
}
const hitRate = matched / n;

// 每个字的起止（未匹配按前后插值）
const charT0 = new Float64Array(n), charT1 = new Float64Array(n);
for (let k = 0; k < n; k++) if (matchJ[k] >= 0) { charT0[k] = tStart[matchJ[k]]; charT1[k] = tEnd[matchJ[k]]; }
for (let k = 0; k < n; k++) {
  if (matchJ[k] >= 0) continue;
  let a = k - 1; while (a >= 0 && matchJ[a] < 0) a--;
  let b = k + 1; while (b < n && matchJ[b] < 0) b++;
  const ta = a >= 0 ? charT1[a] : (b < n ? charT0[b] - 0.18 : 0);
  const tb = b < n ? charT0[b] : (a >= 0 ? charT1[a] + 0.18 : ta + 0.18);
  const u = (k - (a >= 0 ? a : k - 1)) / Math.max(1, b - (a >= 0 ? a : k - 1));
  charT0[k] = ta + (tb - ta) * clamp01(u);
  charT1[k] = charT0[k] + 0.05;
}
function clamp01(v) { return Math.min(1, Math.max(0, v)); }

// 句起止
const sentT = sentences.map(() => ({ t0: Infinity, t1: -Infinity }));
for (let k = 0; k < n; k++) {
  const s = sentT[charSentence[k]];
  s.t0 = Math.min(s.t0, charT0[k]); s.t1 = Math.max(s.t1, charT1[k]);
}
sentT.forEach(s => {
  if (!isFinite(s.t0)) s.t0 = 0;
  if (s.t1 < s.t0 + 0.2) s.t1 = s.t0 + 0.2;
});
sentences.forEach((s, k) => { s.t0 = +sentT[k].t0.toFixed(3); s.t1 = +sentT[k].t1.toFixed(3); });

// ---------------------------------------------------------------- 镜头切点（beats）
const beats = beatsPath ? JSON.parse(fs.readFileSync(beatsPath, 'utf8')) : [];
function findAt(snippet, fromChar = 0) {
  if (!snippet) return fromChar;
  const key = strip(snippet);
  if (!key) return fromChar;
  const at = spokenAll.indexOf(key, fromChar);
  if (at < 0) throw new Error('beats.match 找不到片段: ' + snippet);
  return at;
}
const cuts = [];
let scanChar = 0;
for (const b of beats.length ? beats : [{ match: '' }]) {
  const at = b.match ? findAt(b.match, scanChar) : 0;
  const t = at === 0 ? 0 : charT0[at];
  cuts.push(+t.toFixed(3));
  scanChar = Math.max(scanChar, at);
}
cuts[0] = 0;
for (let k = 1; k < cuts.length; k++) if (cuts[k] <= cuts[k - 1]) cuts[k] = +(cuts[k - 1] + 0.4).toFixed(3);

// ---------------------------------------------------------------- 字幕条
const CLAUSE = /[，,、；;：:]/;
const PARTICLES = new Set(Array.from('的了着是在和与就都也把被从对这那个一不没有会要能说来去上下里后前时年多月日人他们我你她它但而却还又很最更太'));
const PREPS = Array.from('比和跟从对在把被但而却就也都还又然后所以因为如果');
const KEYWORDS = ('出土 雕像 教皇 鱼皮 叫神 半人半鱼 苏美尔 波斯湾 怪物 怎么来 告诉你 品品 盖庙 法律 农业 几何 深海 知识 传授 自打那以后 都市传说 悬案 绿洲假说 正经名字 一百多年 语言天才 三步 第一步 大瓜 鱼头神 高等文明 驾着船 文字 灌溉 登陆 科技先进 冒出来 土著 神吗 第二步 家在哪 考古界 文明 绿洲 吞没 除非 美索不达米亚 证据 语言学家 亲缘关系 定居点 犁 农夫 播种 农业词汇 外来语 种地 借来的 搬来 神话 迪尔蒙 天堂岛 巴林 二零二一 二零一零 基因 幽灵人群 非洲 六万年前 分道扬镳 独自 遗骸 尼安德特人 探针 血统 隐居 史前 一九九四 航天飞机 四条大河 四面环山 伊甸园 洪水 罗斯 反常识 冰河期 四十五亿 冰盖 水银行 海平面 末次冰盛期 劳伦泰德 一百二十米 三十五米 两百万年 台湾 裸露的陆地 碳酸盐岩 高原 地下水 泉眼 两头海 淡水 大河汇入 一万两千九百 新仙女木 冰湖 溃坝 大西洋 温盐环流 气温骤降 沙漠 族群 四面八方 顶尖技术 炼丹 前文明 八千二百年 绷不住 米苏拉湖 七十八倍 十七米 霍尔木兹海峡 基什山 倒灌 创世纪 众神 狼狈 大限 恩基 方舟 圣经 幸存 孤岛 六千五百年 鱼头装 两河流域 新居民 盖庙 黑科技 苏美尔王表 国王 几万年 正常人类 变回 超级干旱 三百年 灭亡 考古学家 科学家 挠人 假说 七十米 说得清 感冒 常态化 搁今天 可这一次 凭什么 专家 艾伦 遛狗 白了个白 问他们 邪门 说明啥 考古破解 两条 冰越厚 说白了 后来 一波波 据估算 拦不住 开了个会 瞒着人类 讲到这').split(/\s+/);

function pickHl(text) {
  let best = '', bi = 1e9, len = 0;
  for (const kw of KEYWORDS) {
    const at = text.indexOf(kw);
    if (at >= 0 && (kw.length > len || (kw.length === len && at < bi))) { best = kw; bi = at; len = kw.length; }
  }
  if (best) return best;
  // 未命中关键词就不标高亮：硬切出来的残词（"人的点""词竟然全"）比不标更糟
  return '';
}
function splitLong(text) {
  if (Array.from(text).length <= 17) return [text];
  const chs = Array.from(text), out = [];
  let start = 0;
  while (chs.length - start > 17) {
    let best = 12, bestScore = -1;
    for (let p = 8; p <= 17; p++) {
      const prev = chs[start + p - 1], next = chs[start + p];
      let score = 0;
      if ('过了的是就都也把被和跟从对在里后前时'.includes(prev)) score += 3;
      if (PREPS.includes(next)) score += 2;
      score -= Math.abs(p - 12) * 0.2;
      if (score > bestScore) { bestScore = score; best = p; }
    }
    out.push(chs.slice(start, start + best).join(''));
    start += best;
  }
  out.push(chs.slice(start).join(''));
  return out;
}
function cutBetween(a, b) { return cuts.find(c => c > a + 0.001 && c < b - 0.001); }

const subs = [];
for (const s of sentences) {
  // 句子在原串中的全局起点
  let base = 0;
  for (let k = 0; k < s.i; k++) base += sentences[k].spoken.length;
  let cur = '', cursor = base; // cursor: 本句已经过的字数
  const clauses = [];
  const flush = () => { const sp = strip(cur); if (sp) clauses.push({ text: cur.trim(), spoken: sp, g0: cursor }); cursor += sp.length; cur = ''; };
  for (const ch of s.text) {
    if (CLAUSE.test(ch)) flush(); else cur += ch;
  }
  flush();

  const chunks = [];
  for (const cl of clauses) {
    // 口播稿有、配音没录的子句：所有字挤在 ≈0 s 里，字幕跳过（跟随配音）
    const clLen = Array.from(cl.spoken).length;
    const g0c = cl.g0, g1c = cl.g0 + clLen - 1;
    const clT0 = charT0[g0c], clT1 = charT1[g1c];
    if (clLen >= 4 && clT1 - clT0 < 0.05 * clLen) {
      console.warn(`口播缺句（配音未录，字幕跳过）句#${s.i} ${cl.text} @ ${clT0.toFixed(2)}s`);
      continue;
    }
    // 跨镜头切点的子句：在切点处拆开，两段各自成条（不能截断丢字）
    // 切点时间由该字的 charT0 取三位小数得到，这里取最近的字；若最近的是首字则整句本就在切点上，不拆
    const splitAt = new Set();
    for (const c of cuts) {
      if (c <= 0.001) continue;
      let best = -1, bd = 0.03;
      for (let k = g0c; k <= g1c; k++) { const d = Math.abs(charT0[k] - c); if (d < bd) { bd = d; best = k; } }
      if (best > g0c) splitAt.add(best);
    }
    const pieces = [];
    let start = g0c;
    for (let k = g0c + 1; k <= g1c; k++) {
      if (splitAt.has(k)) { pieces.push([start, k - 1]); start = k; }
    }
    pieces.push([start, g1c]);
    // 单字碎段是强制对齐在句尾/切点上的抖动，并回前一格（不单独成条）
    for (let i = pieces.length - 1; i > 0; i--) {
      if (pieces[i][1] > pieces[i][0]) continue;
      pieces[i - 1][1] = pieces[i][1];
      pieces.splice(i, 1);
    }
    const segText = Array.from(cl.spoken);
    for (const [a, b] of pieces) {
      const parts = splitLong(segText.slice(a - g0c, b - g0c + 1).join(''));
      let used = 0;
      for (const p of parts) {
        const g0 = a + used, g1 = g0 + Array.from(p).length - 1;
        used += Array.from(p).length;
        chunks.push({ text: p, g0, g1, t0: charT0[g0], t1: charT1[g1] });
      }
    }
  }

  // 合并 <0.45 s 的碎片到同镜头相邻子句（≤17 字）
  const merged = [];
  for (let k = 0; k < chunks.length; k++) {
    const c = { ...chunks[k] };
    if (c.t1 - c.t0 < 0.45 && k + 1 < chunks.length) {
      const nx = chunks[k + 1];
      const sameShot = !cutBetween(c.t0, nx.t1);
      const len = Array.from(c.text).length + Array.from(nx.text).length;
      if (sameShot && len <= 17) { c.text += ' ' + nx.text; c.t1 = nx.t1; c.g1 = nx.g1; k++; }
    }
    if (c.t1 - c.t0 < 0.45) c.t1 = c.t0 + 0.45;
    merged.push(c);
  }

  // 去重叠 / 不跨镜头
  for (let k = 0; k < merged.length; k++) {
    const c = merged[k], prev = merged[k - 1];
    if (prev && c.t0 < prev.t1 + 0.01) c.t0 = prev.t1 + 0.01;
    const cutIn = cuts.find(x => x > c.t0 + 0.01 && x < c.t1 - 0.01);
    if (cutIn) c.t1 = cutIn - 0.02;
    const next = merged[k + 1];
    if (next && c.t1 > next.t0 - 0.01) c.t1 = Math.max(c.t0 + 0.30, next.t0 - 0.02);
    if (c.t1 > c.t0) subs.push({ t0: +c.t0.toFixed(3), t1: +c.t1.toFixed(3), text: c.text, hl: pickHl(c.text) });
  }
}
// 全局去重叠
for (let k = 1; k < subs.length; k++) {
  if (subs[k].t0 < subs[k - 1].t1 + 0.005) {
    subs[k - 1].t1 = Math.max(subs[k - 1].t0 + 0.30, subs[k].t0 - 0.005);
    subs[k - 1].t1 = +subs[k - 1].t1.toFixed(3);
  }
}
// 校验：不得跨镜头
const cross = subs.filter(s => cuts.some(c => c > s.t0 + 0.01 && c < s.t1 - 0.01));
if (cross.length) console.warn('警告：有字幕跨镜头', cross.length);

// ---------------------------------------------------------------- hits
const hits = [];
for (const c of cuts) hits.push({ t: +(Math.max(0, c + 0.02)).toFixed(3), kind: 'cut' });
let hs = 0;
for (const b of beats) for (const kw of b.hits || []) {
  const at = findAt(kw, hs); hs = Math.max(hs, at);
  hits.push({ t: +(charT0[at] + 0.05).toFixed(3), kind: kw });
}
hits.sort((a, b) => a.t - b.t);

// ---------------------------------------------------------------- 输出
const duration = +Math.max(sentences[sentences.length - 1].t1 + 0.35, 0.5).toFixed(3);
const cues = { fps: 30, duration, cuts, subs, hits };
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(cues, null, 2));
fs.writeFileSync(outPath.replace(/\.json$/, '.sentences.json'), JSON.stringify(sentences.map(s => ({
  i: s.i, t0: s.t0, t1: s.t1, chars: s.spoken.length, text: s.text,
})), null, 2));

const charCount = s => Array.from(s.replace(/ /g, '')).length;
const tooLong = subs.filter(s => charCount(s.text) > 17).length;
const tooShort = subs.filter(s => s.t1 - s.t0 < 0.45 - 1e-6).length;
console.log(`对齐命中率 ${(hitRate * 100).toFixed(2)}%（${matched}/${n} 字）`);
console.log(`句子 ${sentences.length}；字幕 ${subs.length}；总字数 ${subs.reduce((a, s) => a + charCount(s.text), 0)}；超长 ${tooLong}；过短 ${tooShort}；跨镜头 ${cross.length}`);
console.log(`时长 ${duration.toFixed(3)} s；镜头 ${cuts.length}；hits ${hits.length} → ${outPath}`);
