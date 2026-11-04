#!/usr/bin/env node
// 把 demo/film.js 的前半段（色板 / 图元 / sprite / 字体 / 前 7 镜）与 full/parts/*.js 拼成全片 film.js，
// 连同 cues.json / sprites.js / index.html 一起同步进渲染仓库的 demos/xiangsu-eden-full/。
//
//   node assemble.mjs
//
// 环境变量 XIANGSU_REPO 可覆盖渲染仓库路径（旧名 XIANGSU2_REPO 仍兼容）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const repo = process.env.XIANGSU_REPO || process.env.XIANGSU2_REPO || 'D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15';
const outDir = path.join(repo, 'demos', 'xiangsu-eden-full');

const MARK = '// ---------------------------------------------------------------- transitions / subtitle / CRT';
const base = fs.readFileSync(path.join(root, 'demo', 'film.js'), 'utf8');
const at = base.indexOf(MARK);
if (at < 0) throw new Error('demo/film.js 找不到切分注释');
const head = base.slice(0, at);

const partsDir = path.join(here, 'parts');
const files = fs.readdirSync(partsDir).filter(f => f.endsWith('.js')).sort();
const body = files.map(f => `\n// ======== ${f} ========\n` + fs.readFileSync(path.join(partsDir, f), 'utf8')).join('\n');

const film = head + body + '\n';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'film.js'), film);
fs.copyFileSync(path.join(root, 'demo', 'sprites.js'), path.join(outDir, 'sprites.js'));
fs.copyFileSync(path.join(here, 'cues.json'), path.join(outDir, 'cues.json'));
fs.copyFileSync(path.join(here, 'index.html'), path.join(outDir, 'index.html'));

const cues = JSON.parse(fs.readFileSync(path.join(here, 'cues.json'), 'utf8'));
const declared = new Set();
for (const f of files) {
  const src = fs.readFileSync(path.join(partsDir, f), 'utf8');
  for (const m of src.matchAll(/^function (shot\d\d)\b/gm)) declared.add(m[1]);
}
const need = cues.cuts.map((_, i) => 'shot' + String(i + 1).padStart(2, '0')).filter(n => +n.slice(4) > 7);
const missing = need.filter(n => !declared.has(n));
console.log(`parts ${files.length}（${files.join(', ')}）`);
console.log(`film.js ${(film.length / 1024).toFixed(1)} KB → ${path.join(outDir, 'film.js')}`);
console.log(`镜头函数 ${declared.size} 个；缺失 ${missing.length ? missing.join(' ') : '无'}`);
