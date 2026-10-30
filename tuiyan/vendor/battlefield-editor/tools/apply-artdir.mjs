// 把分镜表的逐幕美术指导写进既有战役包的 scene.json —— 原地改写视觉字段，不触碰配音。
//
//     node tools/apply-artdir.mjs --pkg packages/chibi-full/battlefield.json [--dry]
//
// 只改「画面」相关栏位（env / shots / set / fx / events / strat / march / combat / power / title /
// featured / baseline）；**dur 与 narr 一律保持不动** —— dur 已是实测配音对齐后的值，改了就会音画错位。
// 因为不动 dur、不动 narration/、不动 cues.json，所以不需要重新配音、不需要重新对时。
//
// 原 scene.json 会先备份到 tools/.artdir-backup/（只在首次运行时写，保留真正的最初版本）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { artDirect } from './acts-artdir.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const DRY = process.argv.includes('--dry');
const PKG = arg('pkg', 'packages/chibi-full/battlefield.json');
const pkgDir = path.dirname(path.resolve(ROOT, PKG));
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));

const bf = read(path.join(pkgDir, 'battlefield.json'));
const film = read(path.join(pkgDir, 'film.json'));
const sceneFile = path.join(pkgDir, bf.data.scene);
const scene = read(sceneFile);
const units = new Set(read(path.join(pkgDir, bf.data.units)).units.map(u => u.id));
const structIds = new Set(read(path.join(pkgDir, bf.data.structures)).structures.map(s => s.id));
const facs = new Set(Object.keys(read(path.join(pkgDir, bf.data.factions))));
const audio = read(path.join(pkgDir, bf.data.audio));
const cuesFile = path.join(pkgDir, audio.narration.cues || 'narration/cues.json');
const cues = fs.existsSync(cuesFile) ? read(cuesFile) : {};
const voice = film.voice || audio.narration.default;

// 分镜表：film.source 是相对包目录的路径（例如 ../../../content/01-赤壁之战）。
const planFile = path.resolve(pkgDir, film.source, '分镜表.json');
if (!fs.existsSync(planFile)) throw new Error('找不到分镜表：' + planFile);
const plan = read(planFile);
const total = plan.acts.length;
if (scene.acts.length !== total) throw new Error(`幕数不符：scene ${scene.acts.length} vs 分镜表 ${total}`);

const ENVS = ['day', 'cold', 'dusk', 'night', 'inferno', 'dawn'];
const RESERVED = ['chains', 'wind', 'rain'];
const CARD_KINDS = ['quote', 'timeline', 'windrose', 'letter', 'seal'];
const CARD_SLOTS = ['C', 'U', 'L', 'R'];
const EASES = ['linear', 'smooth', 'in', 'out', 'inout', 'snap'];
const EMIT_FX = ['splash', 'spray', 'embers', 'debris'];   // 一次性粒子(需 from[x,z] 或 unit)
const errs = [];
const stat = { stages: {}, fxActs: 0, evTotal: 0, evActs: 0, strats: 0, cards: 0, cardActs: 0, kinds: {} };

const acts = scene.acts.map((a, i) => {
  const p = plan.acts[i];
  const lines = cues[String(i + 1)]?.[voice]?.lines || [];
  const art = artDirect(p, { dur: a.dur, lines, index: i, total });
  const at = `第${i + 1}幕`;

  // ── 自检：写进 scene.json 前先把契约违例拦下来（引擎吃到坏引用会 throw）──
  const sum = art.shots.reduce((s, x) => s + x.dur, 0);
  if (Math.abs(sum - a.dur) > 0.02) errs.push(`${at} 镜头时长和 ${sum.toFixed(3)} ≠ dur ${a.dur}`);
  if (!ENVS.includes(art.env)) errs.push(`${at} env 非法 ${art.env}`);
  for (const [j, s] of art.shots.entries()) {
    if (!['line', 'orbit', 'follow'].includes(s.kind)) errs.push(`${at}.shots[${j}] kind 非法 ${s.kind}`);
    if (!(s.dur > 0)) errs.push(`${at}.shots[${j}] dur 非正`);
    if (s.kind === 'follow' && !units.has(s.unit)) errs.push(`${at}.shots[${j}] follow unit 不存在 ${s.unit}`);
    if (s.kind === 'line' && ![s.a, s.b, s.look].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite))) errs.push(`${at}.shots[${j}] line 需 a/b/look 各 3 数`);
    if (s.kind === 'orbit' && (!(Array.isArray(s.c) && s.c.length === 3) || !['r', 'h', 'a0', 'a1'].every(k => Number.isFinite(s[k])))) errs.push(`${at}.shots[${j}] orbit 缺参数`);
    // 镜头语言（可选）：缓动名、注视点插值、FOV、侧倾、orbit 高度插值
    if (s.ease !== undefined && !EASES.includes(s.ease)) errs.push(`${at}.shots[${j}] ease 非法 ${s.ease}`);
    if (s.look2 !== undefined && !(Array.isArray(s.look2) && s.look2.length === 3 && s.look2.every(Number.isFinite))) errs.push(`${at}.shots[${j}] look2 需 3 数`);
    if (s.fov !== undefined && !(Number.isFinite(s.fov) && s.fov > 5 && s.fov < 120)) errs.push(`${at}.shots[${j}] fov 需 5..120`);
    if (s.roll !== undefined && !Number.isFinite(s.roll)) errs.push(`${at}.shots[${j}] roll 非数`);
    if (s.h2 !== undefined && !Number.isFinite(s.h2)) errs.push(`${at}.shots[${j}] h2 非数`);
  }
  for (const id of Object.keys(art.set || {})) if (!RESERVED.includes(id) && !units.has(id) && !structIds.has(id)) errs.push(`${at}.set 未知 key ${id}`);
  for (const m of art.march || []) if (!facs.has(m.fac)) errs.push(`${at}.march fac 非阵营 ${m.fac}`);
  for (const id of art.combat || []) if (!units.has(id)) errs.push(`${at}.combat 非单位 ${id}`);
  for (const e of art.fx || []) {
    if (e.type === 'ignite' && !units.has(e.unit)) errs.push(`${at}.fx ignite unit 不存在 ${e.unit}`);
    if (e.type === 'campFire' && !structIds.has(e.camp)) errs.push(`${at}.fx campFire camp 不存在 ${e.camp}`);
    if (EMIT_FX.includes(e.type)) {   // 一次性粒子：爆发点需 from[x,z] 或 unit
      const hasFrom = Array.isArray(e.from) && e.from.length === 2 && e.from.every(Number.isFinite);
      if (!hasFrom && !units.has(e.unit)) errs.push(`${at}.fx ${e.type} 需 from[x,z] 或 unit`);
    }
  }
  if (art.featured.some(id => !units.has(id))) errs.push(`${at}.featured 含非单位`);
  // 叙事卡：kind/slot 白名单、时点落在幕内、内容字段齐备（引擎按 kind 取字段渲染）。
  for (const [j, c] of (art.cards || []).entries()) {
    const cat = `${at}.cards[${j}]`;
    if (!CARD_KINDS.includes(c.kind)) errs.push(`${cat} kind 非法 ${c.kind}`);
    if (c.slot && !CARD_SLOTS.includes(c.slot)) errs.push(`${cat} slot 非法 ${c.slot}`);
    if (!(c.at >= 0)) errs.push(`${cat} at 非正`);
    if (c.at + (c.life || 0) > a.dur + 0.05) errs.push(`${cat} at+life 超出幕长`);
    if (c.kind === 'quote' && !c.text) errs.push(`${cat} quote 缺 text`);
    if (c.kind === 'timeline' && !(c.items || []).length) errs.push(`${cat} timeline 缺 items`);
    if (c.kind === 'letter' && !c.text) errs.push(`${cat} letter 缺 text`);
    if (c.kind === 'seal' && !c.text) errs.push(`${cat} seal 缺 text`);
    stat.cards++; stat.kinds[c.kind] = (stat.kinds[c.kind] || 0) + 1;
  }
  if ((art.cards || []).length) stat.cardActs++;

  stat.stages[art.stage] = (stat.stages[art.stage] || 0) + 1;
  if (art.fx) stat.fxActs++;
  if (art.events.length) { stat.evActs++; stat.evTotal += art.events.length; }
  if (art.strat) stat.strats++;

  // ── 组装：视觉字段全换新，dur/narr/summary 等叙事字段原样保留 ──
  const next = {
    key: art.key,
    era: art.era || a.era,
    title: art.title,
    summary: a.summary,
    featured: art.featured,
    dur: a.dur,
    env: art.env,
    narr: a.narr,
    power: art.power,
    shots: art.shots,
  };
  if (art.set) next.set = art.set;
  if (art.march) next.march = art.march;
  if (art.combat) next.combat = art.combat;
  if (art.fx) next.fx = art.fx;
  next.events = art.events;
  if (art.cards && art.cards.length) next.cards = art.cards;
  if (art.strat) next.strat = art.strat;
  if (a.longTitle) next.longTitle = a.longTitle;
  next.hold = a.hold ?? true;
  next.reset = a.reset ?? true;
  next.baseline = [];                       // reset 幕从干净世界起：布署全写在 set 里
  if (a.sourceKind) next.sourceKind = a.sourceKind;
  if (i === total - 1 && a.finale !== undefined) next.finale = a.finale;
  return next;
});

if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }

console.log(`幂等重写 ${scene.acts.length} 幕（不走模板轮播）`);
console.log(`舞台分布：${Object.entries(stat.stages).map(([k, v]) => `${k}×${v}`).join('  ')}`);
console.log(`事件卡：${stat.evActs} 幕共 ${stat.evTotal} 张（每幕 ≤3）；特写大卡 ${stat.strats} 幕；特效幕 ${stat.fxActs}`);
console.log(`叙事卡：${stat.cardActs} 幕共 ${stat.cards} 张 ｜ ${Object.entries(stat.kinds).map(([k, v]) => `${k}×${v}`).join('  ')}`);
const sigs = new Set(acts.map(a => a.shots.map(s => s.kind).join('+')));
console.log(`不同镜头签名：${sigs.size}（旧包 6）`);

if (DRY) { console.log('--dry：未写入。'); process.exit(0); }

const bak = path.join(ROOT, 'tools/.artdir-backup');
fs.mkdirSync(bak, { recursive: true });
const bakFile = path.join(bak, path.basename(pkgDir) + '.scene.orig.json');
if (!fs.existsSync(bakFile)) { fs.copyFileSync(sceneFile, bakFile); console.log('原始 scene.json 已备份 → ' + path.relative(ROOT, bakFile)); }
fs.writeFileSync(sceneFile, JSON.stringify({ acts }, null, 2) + '\n');
console.log('已写入 ' + path.relative(ROOT, sceneFile));
