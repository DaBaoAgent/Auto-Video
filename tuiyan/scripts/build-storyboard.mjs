#!/usr/bin/env node
// 由口播稿重算分镜表的派生字段并重生成人读版。
// 只更新「可从稿件推出」的字段，保留分镜表里人工撰写的 env/tag/move/scene/camera/engine/note。
// 用法: node scripts/build-storyboard.mjs [战役目录]     默认 content/01-赤壁之战
//   例: node scripts/build-storyboard.mjs content/01-赤壁之战
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const episode = process.argv[2] || 'content/01-赤壁之战';
const SRC = path.join(REPO, episode, '源文件');

const jsonPath = path.join(SRC, '分镜表.json');
const mdPath = path.join(SRC, '分镜表.md');
const st = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const RATE = st.rate_chars_per_sec || 4.43;

const txt = fs.readFileSync(path.join(SRC, st.script_file), 'utf8');
const paras = txt.split(/\r?\n\s*\r?\n/).map(s => s.trim()).filter(Boolean);
if (paras.length !== st.acts.length) {
  throw new Error(`段落数 ${paras.length} != 幕数 ${st.acts.length}`);
}
const clean = s => s.replace(/[\p{P}\p{S}\s]/gu, '');
const counts = paras.map(p => clean(p).length);

const firstSentence = p => (p.match(/^[^。！？]*[。！？]/) || [p])[0];

for (const a of st.acts) {
  const i = a.no - 1;
  a.chars = counts[i];
  a.est_sec = Math.round(counts[i] / RATE);
  a.first_sentence = firstSentence(paras[i]);
}
st.total_chars = counts.reduce((a, b) => a + b, 0);
st.est_total_sec = st.acts.reduce((a, b) => a + b.est_sec, 0);
fs.writeFileSync(jsonPath, JSON.stringify(st, null, 1) + '\n');

const T = st.est_total_sec;
const min = Math.floor(T / 60), sec = T % 60;
const avg = Math.round(T / st.acts.length);
let md = '';
md += `# ${st.title} · 分镜表（${st.acts.length} 幕）\n\n`;
md += `> 对口播稿全文分镜 ｜ 稿件：《${st.script_file}》${st.based_on ? `（${st.based_on}）` : ''}｜ 生成：${st.generated}\n`;
md += `> 全稿 **${st.total_chars} 字**（clean）／ 预估 **约 ${min} 分 ${sec} 秒** ／ **${st.acts.length} 幕** ／ 平均每幕约 ${avg} 秒\n\n`;
md += `## 分幕原则\n\n`;
md += `- 每幕对准口播稿的**段落边界**，本版为 **1 段 = 1 幕**（不切句、不合并）\n`;
md += `- 时长估算＝clean 字数÷${RATE} 字/秒（该语速由**旧成片实测**校准：旧稿 5002 字 ÷ 成片 1130.2 秒）；最终时长由 dabao 实测 TTS 重排\n`;
md += `- 目标节奏 **18～25 秒/幕**；短拍幕（过渡帧）为刻意的节奏点\n`;
md += `- 每幕标注 **走位 move**（阵营/主帅随口播的兵棋式移动）与 **运镜 camera**，落实「跟着口播走位、镜头合理配合」\n`;
md += `- 开场用**系列品牌句**（“徐艾伦一年推演100部中国3D战争史系列”）直接进兵棋推演，全篇**不出现任何书名**；史实与演义的辨正融进平铺直叙的讲述\n\n`;
md += `## 幕一览表\n\n`;
md += `| # | 幕名 | 段落 | 字数 | 估时 | 环境 | 走位（阵营/主帅） |\n`;
md += `|---|------|------|------|------|------|------------------|\n`;
for (const a of st.acts) {
  md += `| ${String(a.no).padStart(2, '0')} | ${a.title} | P${a.paras[0]} | ${a.chars} | ${a.est_sec}s | ${a.env} | ${a.move} |\n`;
}
md += `\n## 逐幕详表\n`;
for (const section of st.sections) {
  md += `\n### ${section}\n`;
  for (const a of st.acts.filter(x => x.section === section)) {
    md += `\n**第 ${String(a.no).padStart(2, '0')} 幕 · ${a.title}**　（P${a.paras[0]}｜${a.chars} 字｜约 ${a.est_sec}s｜环境 ${a.env}｜标签 ${a.tag}）\n\n`;
    md += `- 首句：${a.first_sentence}\n`;
    md += `- 走位：${a.move}\n`;
    md += `- 画面：${a.scene}\n`;
    md += `- 运镜：${a.camera}\n`;
    md += `- 引擎：${a.engine}\n`;
    if (a.note) md += `- 备注：${a.note}\n`;
  }
}
fs.writeFileSync(mdPath, md + '\n');

console.log(`${episode}: ${st.acts.length} 幕 / ${st.total_chars} clean 字 / ${T}s ≈ ${(T / 60).toFixed(2)} min`);
