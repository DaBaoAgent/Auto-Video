// 音频 gate(零依赖):验 validate-data 故意不碰的 audio 正确性 ——
//   1) 旁白音长 ≤ 幕长(否则旁白被切;这是 validate-data/render-check 都抓不到的真破口)
//   2) 已宣告的音频素材路径都解析得到(music.scenes / theme / sfx / 各声线旁白 mp3 / cues.json)
//   3) music.scenes 长度 = 幕数;narration 宣告了 voices 就该每幕有 cues
// 设计成「尚未编音频时自动放行」:空 music.scenes / 空 voices 视为早期状态(WARN 不 FAIL),
// 一旦开始填,就严格检查 —— 让 fresh scaffold 仍绿灯起步,但补了旁白/配乐后会被据实把关。
//
// 用法(在 repo 根执行;--pkg 相对当前目录解析):
//       node tools/audio-check.mjs --pkg packages/<slug>/battlefield.json
// FAIL 退出码 1;PASS(可含 WARN)退出码 0。
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ai = process.argv.indexOf('--pkg');
const MANIFEST = ai >= 0 ? resolve(process.cwd(), process.argv[ai + 1]) : resolve(ROOT, 'packages/chibi-full/battlefield.json');
const BASE = dirname(MANIFEST);
const slug = basename(BASE);
const read = p => JSON.parse(readFileSync(p, 'utf8'));
// 素材路径一律 manifest 相对(比照引擎 assetUrl = PKG_BASE + p)。写成 root-relative
// (packages/<slug>/assets/…)会在此 resolve 成 double-prefix 而判定不存在 → 干净退件,
// 不再读档 throw ENOENT;这正是引擎执行期会坏的同一条路径。
const hasAsset = p => !!p && existsSync(resolve(BASE, p));
const sha = p => createHash('sha1').update(readFileSync(p)).digest('hex');
const STASH = process.env.BFE_AUDIO_STASH || '/home/ct/red-cliffs-3d/audio-work/candidates';
const trackFile = t => {                       // 音乐库曲目的本地实档:repo local → 海选 stash
  if (t.local && existsSync(resolve(ROOT, t.local))) return resolve(ROOT, t.local);
  if (t.stash && existsSync(resolve(STASH, t.stash))) return resolve(STASH, t.stash);
  return null;
};
let LIB = null, libHashes = null;
const lib = () => {
  if (!LIB) {
    const lp = resolve(ROOT, 'tools/music-library.json');
    LIB = existsSync(lp) ? read(lp) : { tracks: [] };
    libHashes = new Set(LIB.tracks.map(trackFile).filter(Boolean).map(sha));
  }
  return LIB;
};

if (!existsSync(MANIFEST)) { console.error('FAIL\nmanifest 不存在: ' + MANIFEST); process.exit(1); }
const BF = read(MANIFEST);
const A = read(resolve(BASE, BF.data.audio));
const acts = read(resolve(BASE, BF.data.scene)).acts || [];

const errs = [], warns = [];
let assetN = 0, fitN = 0;
const checkAsset = (p, label) => { assetN++; if (!hasAsset(p)) errs.push(`${label} 路径不存在: ${p}`); };

// 配乐「池」:本包 music.ost / music.bgm + base 包(如 chibi)同名池。名单内曲目视为已知来源
// (例如三国题材成片直接取用影视 OST 池),不再当作「库外自订曲」告警。
const poolPaths = new Set();
const addPool = (list, baseDir) => (list || []).forEach(x => {
  const f = typeof x === 'string' ? x : x && x.file;
  if (f) poolPaths.add(resolve(baseDir, f));
});
addPool(A.music?.ost, BASE);
addPool(A.music?.bgm, BASE);
try {
  const filmPath = resolve(BASE, 'film.json');
  if (existsSync(filmPath)) {
    const base = read(filmPath).base;
    const baseDir = base && resolve(ROOT, 'packages', base);
    if (baseDir && existsSync(resolve(baseDir, 'audio.json'))) {
      const BA = read(resolve(baseDir, 'audio.json'));
      addPool(BA.music?.ost, baseDir);
      addPool(BA.music?.bgm, baseDir);
    }
  }
} catch { /* film.json 缺失或坏 → 只靠本包池 */ }

// 1) 配乐(软性把关:空 → 列音乐库可选曲;有设 → 验解析得到 + 出自音乐库)
const scenes = A.music?.scenes ?? [];
if (!scenes.length) {
  const picks = lib().tracks.filter(t => t.local).map(t => t.id);
  warns.push(`music.scenes 留空(尚未配乐)。tools/assign-music.mjs 可挑(库内 ${LIB.tracks.length} 首);in-repo 即用:${picks.join('/')}(全部见 --list)`);
} else {
  if (scenes.length !== acts.length) errs.push(`music.scenes 长度 ${scenes.length} ≠ 幕数 ${acts.length}`);
  lib();
  scenes.forEach((p, i) => {
    checkAsset(p, `music.scenes[${i}]`);
    const fp = resolve(BASE, p);
    if (existsSync(fp) && !poolPaths.has(fp) && libHashes.size && !libHashes.has(sha(fp)))
      warns.push(`music.scenes[${i}] 非音乐库/非 OST·BGM 池曲目(自订曲?请在 CREDITS 标明来源与授权): ${p}`);
  });
}
if (A.music?.theme) checkAsset(A.music.theme, 'music.theme');

// 2) 音效素材
const sfx = A.sfx;
if (sfx?.files?.length) sfx.files.forEach(f => checkAsset(`${sfx.dir}/${f}.mp3`, `sfx ${f}`));

// 3) 旁白:素材解析 + 音长 ≤ 幕长
const nar = A.narration;
if (!nar?.voices?.length) warns.push('narration.voices 留空(尚未配旁白)');
else {
  for (const v of nar.voices)
    for (let n = 1; n <= acts.length; n++)
      checkAsset((nar.pathPattern || '').replace('{voice}', v).replace('{n}', n), `旁白 ${v} scene${n}`);
  if (!nar.cues) errs.push('narration.voices 已宣告,但 narration.cues 未指向 cues.json');
  else if (!hasAsset(nar.cues)) errs.push(`narration.cues 路径不存在: ${nar.cues}`);
  else {
    const cues = read(resolve(BASE, nar.cues));
    acts.forEach((a, i) => {
      const e = cues[String(i + 1)];   // cues.json 键为 1-based 幕序
      if (!e) { errs.push(`act${i + 1} ${a.title}: 旁白 cue 缺(voices 已宣告却无 cues[${i + 1}])`); return; }
      const mx = Math.max(...nar.voices.map(v => e[v]?.dur ?? 0));
      fitN++;
      if (mx > a.dur) errs.push(`act${i + 1} ${a.title}: 旁白 ${mx.toFixed(1)}s > 幕长 ${a.dur}s —— 会被切`);
      else if (a.dur - mx < .4) warns.push(`act${i + 1} ${a.title}: 缓冲仅 ${(a.dur - mx).toFixed(1)}s(<0.4s 太贴,旁白尾字可能被切)`);   // 成片节奏标准=幕尾 0.5s(生成器 ACT_TAIL),长停顿由 pausePolicy 剪掉,不再要求 3.5s
    });
  }
}

for (const w of warns) console.log(`  WARN  ${w}`);
if (errs.length) { console.error(`FAIL [${slug}] — ${errs.length} 项音频问题:`); for (const e of errs) console.error(`  ${e}`); process.exit(1); }
console.log(`PASS [${slug}] — 音频 ${assetN} 素材全解析、旁白 ${fitN}/${acts.length} 幕音长 ≤ 幕长`);
