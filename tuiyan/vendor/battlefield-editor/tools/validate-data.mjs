// 战场资料包验证器(零依赖)
// 用法(在 repo 根执行;--pkg 相对当前目录解析):
//       node tools/validate-data.mjs                                    # 验默认赤壁(packages/chibi-full/battlefield.json)
//       node tools/validate-data.mjs --pkg packages/guandu/battlefield.json   # 验任意资料包
// 路径解析比照引擎 PKG_BASE:manifest.data 内的子层路径相对于 manifest 所在目录。
// 除了结构合法性,也做跨档交叉引用(scene 引用的 unit/structure/faction 必须存在),
// 当作 AI/人编辑资料包的安全网——引擎吃到坏引用会在执行期 throw,这里要先拦下。
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ai = process.argv.indexOf('--pkg');
const MANIFEST = ai >= 0 ? resolve(process.cwd(), process.argv[ai + 1]) : resolve(ROOT, 'packages/chibi-full/battlefield.json');
const BASE = dirname(MANIFEST);
const readAbs = p => JSON.parse(readFileSync(p, 'utf8'));
const layer = name => resolve(BASE, name);   // manifest 相对

const ENVS = ['day', 'cold', 'dusk', 'night', 'inferno', 'dawn'];   // 引擎 ENV preset
const SHOT_KINDS = ['line', 'orbit', 'follow'];
const CARD_KINDS = ['quote', 'timeline', 'windrose', 'letter', 'seal'];   // play.html 叙事卡原语
const CARD_SLOTS = ['C', 'U', 'L', 'R'];
let errs = [];
if (!existsSync(MANIFEST)) { console.error('FAIL\nmanifest 不存在: ' + MANIFEST); process.exit(1); }

const BF = readAbs(MANIFEST);
for (const f of ['name', 'era', 'data']) if (!(f in BF)) errs.push(`battlefield 缺 ${f}`);
if (BF.meta && !(BF.meta.finale && BF.meta.finale.title)) errs.push('battlefield.meta.finale.title 缺');
for (const [k, p] of Object.entries(BF.data || {})) {
  if (typeof p !== 'string') { errs.push(`battlefield.data.${k} 非路径字串`); continue; }
  if (!existsSync(layer(p))) errs.push(`battlefield.data.${k} 路径不存在: ${p}`);
}

// ── factions(阵营白名单由此推导,不再写死)──
const FAC = readAbs(layer(BF.data.factions));
const FACS = Object.keys(FAC);
for (const [k, v] of Object.entries(FAC)) {
  for (const f of ['name', 'flag', 'css', 'col', 'dark']) if (!(f in v)) errs.push(`factions.${k} 缺 ${f}`);
  for (const f of ['col', 'dark', 'light']) if (v[f] && !/^#[0-9a-fA-F]{6}$/.test(v[f])) errs.push(`factions.${k}.${f} 非 #RRGGBB`);
}

// ── structures ──
const S = readAbs(layer(BF.data.structures)).structures;
const TYPES = ['city', 'camp', 'pass', 'marker', 'ferry'], STRUCT_IDS = new Set();
const modelErr = (o, tag) => {   // 可替换模型(glTF):model=路径字串且文件存在、modelScale/modelY=数字
  if (o.model !== undefined) {
    if (typeof o.model !== 'string') errs.push(`${tag} model 非路径字串`);
    else if (!existsSync(layer(o.model))) errs.push(`${tag} model 路径不存在: ${o.model}(素材相对 manifest;glb 惯例放 assets/models/)`);
  }
  if (o.modelScale !== undefined && typeof o.modelScale !== 'number') errs.push(`${tag} modelScale 非数字`);
  if (o.modelY !== undefined && typeof o.modelY !== 'number') errs.push(`${tag} modelY 非数字`);
};
S.forEach((s, i) => {
  if (!TYPES.includes(s.type)) errs.push(`structures[${i}] type 非法: ${s.type}`);
  modelErr(s, `structures[${i}]`);
  if (typeof s.x !== 'number') errs.push(`structures[${i}] x 非数字`);
  if (!(s.type === 'marker' && s.followRiver) && typeof s.z !== 'number') errs.push(`structures[${i}] z 非数字`);
  if (s.type === 'camp' && !FACS.includes(s.faction)) errs.push(`structures[${i}] camp faction 非法: ${s.faction}`);
  if (s.id) { if (STRUCT_IDS.has(s.id)) errs.push(`重复 id: ${s.id}`); STRUCT_IDS.add(s.id); }
});

// ── terrain ──
const T = readAbs(layer(BF.data.terrain));
if (!Array.isArray(T.rivers) || !T.rivers.length) errs.push('terrain 缺 rivers');
for (const [i, r] of (T.rivers || []).entries()) {
  if (!Array.isArray(r.centerline) || r.centerline.length < 2) errs.push(`river[${i}] centerline 不足`);
  for (const f of ['halfWidth', 'depth']) if (typeof r[f] !== 'number') errs.push(`river[${i}] ${f} 非数`);
}
const xy2 = a => Array.isArray(a) && a.length === 2 && a.every(n => typeof n === 'number');
for (const [i, b] of (T.bumps || []).entries()) {
  if (!xy2(b.center)) errs.push(`bump[${i}] center`);
  if (!xy2(b.radius) && !xy2(b.k)) errs.push(`bump[${i}] 需 radius 或 k`);
  if (typeof b.height !== 'number') errs.push(`bump[${i}] height`);
}
for (const [i, rg] of (T.regions || []).entries()) {
  if (!xy2(rg.center)) errs.push(`region[${i}] center`);
  if (!xy2(rg.radius) && !xy2(rg.k)) errs.push(`region[${i}] 需 radius 或 k`);
}
for (const [i, s] of (T.colorRamp || []).entries()) if (!/^#[0-9a-fA-F]{6}$/.test(s.color || '')) errs.push(`colorRamp[${i}] color`);

// ── units(阵营对照动态白名单;先建 id 集合供 scene 交叉检查)──
const UNIT_KINDS = ['army', 'fleet'], UNIT_IDS = new Set();
let unitCount = 0;
const UNITS = readAbs(layer(BF.data.units)).units;
if (!Array.isArray(UNITS) || !UNITS.length) errs.push('units.units 非非空阵列');
else UNITS.forEach((u, i) => {
  unitCount++;
  for (const f of ['id', 'kind', 'faction', 'n']) if (!(f in u)) errs.push(`units[${i}] 缺 ${f}`);
  modelErr(u, `units[${i}]`);
  if (!UNIT_KINDS.includes(u.kind)) errs.push(`units[${i}] kind 非法: ${u.kind}`);
  if (!FACS.includes(u.faction)) errs.push(`units[${i}] faction 非法: ${u.faction}`);
  if (typeof u.n !== 'number') errs.push(`units[${i}] n 非数字`);
  if (u.id) { if (UNIT_IDS.has(u.id)) errs.push(`重复 unit id: ${u.id}`); UNIT_IDS.add(u.id); }
});

// ── scene(逐幕 + 跨档交叉引用)──
const FX_TYPES = ['volley', 'ignite', 'shake', 'campFire', 'flood', 'splash', 'spray', 'embers', 'debris'];
const FX_EASE = ['linear', 'smooth', 'in', 'out', 'inout', 'snap'];
const FX_EMIT = ['splash', 'spray', 'embers', 'debris'];   // 一次性粒子:需 from[x,z] 或 unit
const SET_RESERVED = ['chains', 'wind', 'rain'];
const isUnit = id => UNIT_IDS.has(id), isStruct = id => STRUCT_IDS.has(id);
const SCENE = readAbs(layer(BF.data.scene));
const acts = SCENE.acts;
if (!Array.isArray(acts) || !acts.length) errs.push('scene.acts 非非空阵列');
else acts.forEach((a, i) => {
  const at = `scene.acts[${i}]`;
  for (const f of ['key', 'title', 'dur', 'env']) if (!(f in a)) errs.push(`${at} 缺 ${f}`);
  if(typeof a.dur!=='number'||a.dur<=0)errs.push(`${at} dur 须为正数`);
  if(a.reset!==undefined&&typeof a.reset!=='boolean')errs.push(`${at} reset 须为布尔值`);
  if(a.baseline!==undefined&&!Array.isArray(a.baseline))errs.push(`${at} baseline 须为数组`);
  if(a.featured&&(!Array.isArray(a.featured)||a.featured.length>2||a.featured.some(id=>!isUnit(id))))errs.push(`${at} featured 须为至多两个有效单位`);
  if (a.env && !ENVS.includes(a.env)) errs.push(`${at} env 非法(引擎无此 preset): ${a.env}`);
  // 镜头:director 每帧读 shots,缺/空会在自动播映时 throw
  if (!Array.isArray(a.shots) || !a.shots.length) errs.push(`${at} 缺 shots(非空阵列)`);
  else a.shots.forEach((sh, j) => {
    // director 每帧依 kind 解参(play.html director()):缺栏位会在该帧 throw 或静默冻结镜头。
    // render-check 只取每幕前段截图,撞不到后段 shot,所以这些 shape 由 validator 把关。
    const sat = `${at}.shots[${j}]`;
    const num = k => typeof sh[k] === 'number';
    const vec3 = k => Array.isArray(sh[k]) && sh[k].length === 3 && sh[k].every(n => typeof n === 'number');
    if (!sh.kind) { errs.push(`${sat} 缺 kind(line/orbit/follow)`); return; }
    if (!SHOT_KINDS.includes(sh.kind)) { errs.push(`${sat} kind 非法: ${sh.kind}`); return; }
    if (!num('dur')) errs.push(`${sat} dur 非数字`);
    if (sh.kind === 'line') { for (const k of ['a', 'b', 'look']) if (!vec3(k)) errs.push(`${sat} line 缺/坏 ${k}(需长度3数字阵列)`); }
    else if (sh.kind === 'orbit') { if (!vec3('c')) errs.push(`${sat} orbit 缺/坏 c`); for (const k of ['r', 'h', 'a0', 'a1']) if (!num(k)) errs.push(`${sat} orbit 缺/坏 ${k}`); }
    else if (sh.kind === 'follow') { if (!isUnit(sh.unit)) errs.push(`${sat} follow unit 不存在: ${sh.unit}`); if (!vec3('off')) errs.push(`${sat} follow 缺/坏 off(需长度3数字阵列)`); }
    // 镜头语言(可选):缓动名、注视点插值、FOV 推近、roll 侧倾、orbit 高度插值
    if (sh.ease !== undefined && !FX_EASE.includes(sh.ease)) errs.push(`${sat} ease 非法: ${sh.ease}`);
    if (sh.look2 !== undefined && !vec3('look2')) errs.push(`${sat} look2 需长度3数字阵列`);
    if (sh.fov !== undefined && !(num('fov') && sh.fov > 5 && sh.fov < 120)) errs.push(`${sat} fov 需 5..120 的数`);
    if (sh.roll !== undefined && !num('roll')) errs.push(`${sat} roll 非数字`);
    if (sh.h2 !== undefined && !num('h2')) errs.push(`${sat} h2 非数字`);
  });
  // 战力:key 必须是阵营,否则面板静默跳过
  for (const fk of Object.keys(a.power || {})) if (!FACS.includes(fk)) errs.push(`${at}.power 含非阵营 key: ${fk}`);
  // 行军:fac 未知 → addMarch throw
  (a.march || []).forEach((m, j) => { if (!FACS.includes(m.fac)) errs.push(`${at}.march[${j}] fac 非阵营: ${m.fac}`); });
  // combat:必须是单位 id
  (a.combat || []).forEach((id, j) => { if (!isUnit(id)) errs.push(`${at}.combat[${j}] 非单位 id: ${id}`); });
  // set / scrubSet:key 须为保留字、单位 id 或结构 id
  for (const setKey of ['set', 'scrubSet']) {
    for (const id of Object.keys(a[setKey] || {})) {
      if (!SET_RESERVED.includes(id) && !isUnit(id) && !isStruct(id))
        errs.push(`${at}.${setKey} 未知 key(非单位/结构/保留字): ${id}`);
    }
  }
  for(const [bi,s] of (Array.isArray(a.baseline)?a.baseline:[]).entries()){
    if(!s||typeof s!=='object'||Array.isArray(s)){errs.push(`${at}.baseline[${bi}] 须为对象`);continue;}
    for(const id of Object.keys(s))if(!SET_RESERVED.includes(id)&&!isUnit(id)&&!isStruct(id))errs.push(`${at}.baseline[${bi}] 未知单位或结构 ${id}`);
  }
  // 叙事卡:play.html 依 kind 取字段渲染;缺 kind/at 会静默不出现,缺内容字段会渲染成空卡
  if (a.cards !== undefined && !Array.isArray(a.cards)) errs.push(`${at} cards 须为数组`);
  else (a.cards || []).forEach((c, j) => {
    const cat = `${at}.cards[${j}]`;
    if (!c || typeof c !== 'object') { errs.push(`${cat} 须为对象`); return; }
    if (!CARD_KINDS.includes(c.kind)) errs.push(`${cat} kind 非法: ${c.kind}`);
    if (typeof c.at !== 'number') errs.push(`${cat} at 非数字`);
    if (c.life !== undefined && typeof c.life !== 'number') errs.push(`${cat} life 非数字`);
    if (c.slot !== undefined && !CARD_SLOTS.includes(c.slot)) errs.push(`${cat} slot 非法: ${c.slot}`);
    if (c.kind === 'quote' && typeof c.text !== 'string') errs.push(`${cat} quote 缺 text`);
    if (c.kind === 'timeline' && (!Array.isArray(c.items) || c.items.length < 2)) errs.push(`${cat} timeline 需 items≥2`);
    if (c.kind === 'letter' && typeof c.text !== 'string') errs.push(`${cat} letter 缺 text`);
    if (c.kind === 'seal' && typeof c.text !== 'string') errs.push(`${cat} seal 缺 text`);
  });
  // fx:ignite 的 unit、campFire 的 camp 必须存在
  (a.fx || []).forEach((e, j) => {
    if (typeof e.at !== 'number') errs.push(`${at}.fx[${j}] at 非数`);
    if (!FX_TYPES.includes(e.type)) errs.push(`${at}.fx[${j}] type 非法: ${e.type}`);
    if (e.type === 'ignite' && !isUnit(e.unit)) errs.push(`${at}.fx[${j}] ignite unit 不存在: ${e.unit}`);
    if (e.type === 'campFire' && !isStruct(e.camp)) errs.push(`${at}.fx[${j}] campFire camp 不存在: ${e.camp}`);
    if (e.type === 'flood' && typeof e.to !== 'number') errs.push(`${at}.fx[${j}] flood 缺 to(水面目标高度，数值)`);
    if (e.type === 'flood' && e.region !== undefined && !(Array.isArray(e.region) && e.region.length === 4 && e.region.every(n => typeof n === 'number')))
      errs.push(`${at}.fx[${j}] flood region 需为 4 数字 [中心x, 中心z, 半径x, 半径z](省略=全域)`);
    if (e.type === 'flood' && e.from !== undefined && !(Array.isArray(e.from) && e.from.length === 2 && e.from.every(n => typeof n === 'number')))
      errs.push(`${at}.fx[${j}] flood from 需为 2 数字 [决堤口x, z](水锋起点,需配合 region;省略=整区一起涨)`);
    // 一次性粒子:爆发点取自 from[x,z] 或跟随 unit(二者至少要有一个),n 粒数
    if (FX_EMIT.includes(e.type)) {
      const hasFrom = Array.isArray(e.from) && e.from.length === 2 && e.from.every(n => typeof n === 'number');
      if (!hasFrom && !isUnit(e.unit)) errs.push(`${at}.fx[${j}] ${e.type} 需 from[x,z] 或 unit(爆发点)`);
      if (e.n !== undefined && (typeof e.n !== 'number' || e.n <= 0)) errs.push(`${at}.fx[${j}] ${e.type} n 须为正数`);
      if (e.speed !== undefined && typeof e.speed !== 'number') errs.push(`${at}.fx[${j}] ${e.type} speed 非数字`);
      if (e.y !== undefined && typeof e.y !== 'number') errs.push(`${at}.fx[${j}] ${e.type} y 非数字`);
    }
  });
});

// ── audio(允许精简:空 scenes/cues 合法)──
const AUDIO_CUE_TYPES = ['synth', 'sfx', 'sword', 'burst'];
let audioCueCount = 0;
const AUDIO = readAbs(layer(BF.data.audio));
const scenes = AUDIO.music?.scenes;
if (!Array.isArray(scenes)) errs.push('audio.music.scenes 非阵列');
else scenes.forEach((p, i) => {
  if (typeof p !== 'string') { errs.push(`audio.music.scenes[${i}] 非路径字串`); return; }
  if (p && !existsSync(layer(p))) errs.push(`audio.music.scenes[${i}] 路径不存在: ${p}(素材路径 manifest 相对,别写 packages/<slug>/…)`);
});
const nActs = Array.isArray(acts) ? acts.length : 0;
for (const [scene, list] of Object.entries(AUDIO.cues || {})) {
  const k = Number(scene);
  // 引擎读 AUDIO.cues[幕索引](0-based);键错位/越界 → 音效晚一幕、或永远不触发(静默)
  if (!Number.isInteger(k) || k < 0 || k >= nActs) errs.push(`audio.cues 键 "${scene}" 非合法幕索引(0-based,需 0..${nActs - 1})`);
  (list || []).forEach((e, j) => {
    audioCueCount++;
    const cat = `audio.cues[${scene}][${j}]`;
    if (typeof e.at !== 'number') errs.push(`${cat} at 非数`);
    if (!AUDIO_CUE_TYPES.includes(e.type)) errs.push(`${cat} type 非法: ${e.type}`);
    // 各 type 在 dispatchAudioCue 解的 payload:缺栏位会在 cue 触发时 throw
    if (e.type === 'synth' && typeof e.inst !== 'string') errs.push(`${cat} synth 缺 inst`);
    if (e.type === 'sfx' && typeof e.name !== 'string') errs.push(`${cat} sfx 缺 name`);
    if (e.type === 'burst' && (typeof e.inst !== 'string' || typeof e.n !== 'number' || typeof e.interval !== 'number')) errs.push(`${cat} burst 缺 inst/n/interval`);
  });
}

if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
console.log(`PASS [${BF.name}] — factions ${FACS.length}、structures ${S.length}、terrain ${T.rivers.length}河、scene ${acts.length}幕、audio ${audioCueCount}cue、units ${unitCount}`);
