// 每幕背景音乐指派:从音乐库(tools/music-library.json)依「幕→曲」把 CC0 配乐materialize
// 进该 package、写好 audio.json 的 music.scenes/theme、更新 CREDITS.md 音乐出处。
// 任一目录项都可用 —— 来源解析顺序:repo 内 local 档 → 本机海选 stash → preview URL 下载。
// 所以全 74 首池子、以及「之后 append 进 catalog 的新曲」都能直接被 AI 指派,不必先手动下载。
//
// 用法(在 repo 根执行;若需从 preview URL 下载,该次 Bash 要 dangerouslyDisableSandbox):
//   node tools/assign-music.mjs --list                        # 依情绪分类列出音乐库(fit/出处/是否 in-repo)
//   node tools/assign-music.mjs <slug> <id1> ... <idN>        # N=幕数,依幕序给 track id
//   node tools/assign-music.mjs <slug> <ids...> --theme <id>  # 另指定主题曲(默认=末幕那首)
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STASH = process.env.BFE_AUDIO_STASH || '/home/ct/red-cliffs-3d/audio-work/candidates';
const LIB = JSON.parse(readFileSync(resolve(ROOT, 'tools/music-library.json'), 'utf8'));
const byId = Object.fromEntries(LIB.tracks.map(t => [t.id, t]));

const argv = process.argv.slice(2);
function printLib() {
  console.log(`音乐库(${LIB.tracks.length} 首 CC0;[repo]=已在库内、[池]=目录项用时取得):`);
  let cat = '';
  for (const t of LIB.tracks) {
    if (t.category !== cat) { cat = t.category; console.log(`\n[${cat}] ${t.mood}`); }
    console.log(`  ${(t.id).padEnd(20)} fit ${String(t.fit ?? '-').padStart(2)}  ${t.local ? '[repo]' : '[池] '}  ${t.credit.author}`);
  }
}
if (argv.includes('--list') || !argv.length) { printLib(); process.exit(0); }

let themeId = null;
const ti = argv.indexOf('--theme');
if (ti >= 0) { themeId = argv[ti + 1]; argv.splice(ti, 2); }
const slug = argv[0];
const ids = argv.slice(1);

const dir = resolve(ROOT, 'packages', slug);
const manifest = join(dir, 'battlefield.json');
if (!existsSync(manifest)) { console.error(`FAIL: packages/${slug}/battlefield.json 不存在`); process.exit(1); }
const BF = JSON.parse(readFileSync(manifest, 'utf8'));
const acts = JSON.parse(readFileSync(join(dir, BF.data.scene), 'utf8')).acts || [];
const audioPath = join(dir, BF.data.audio);

// OST / BGM 池 id → 路径映射:目标包 audio.json#music.ost/bgm,无则回退引擎内置 chibi 池。
// 池曲目直接「引用」既有素材、不 materialize(如三国题材成片取用影视原声带)。
const AUDIO0 = JSON.parse(readFileSync(audioPath, 'utf8'));
const toPosixRel = (fromDir, abs) => relative(fromDir, abs).replaceAll('\\', '/');
const ostMap = new Map();
function addPoolIds(list, baseDir) {
  for (const e of list || []) {
    if (!e || !e.id || !e.file || ostMap.has(e.id)) continue;
    const abs = resolve(baseDir, e.file);
    ostMap.set(e.id, {abs, rel: toPosixRel(dir, abs), label: e.label || e.id});
  }
}
addPoolIds(AUDIO0.music?.ost, dir);
addPoolIds(AUDIO0.music?.bgm, dir);
const chibiDir = resolve(ROOT, 'packages', 'chibi');
const chibiAudio = join(chibiDir, 'audio.json');
if (existsSync(chibiAudio)) {
  const CA = JSON.parse(readFileSync(chibiAudio, 'utf8'));
  addPoolIds(CA.music?.ost, chibiDir);
  addPoolIds(CA.music?.bgm, chibiDir);
}

const bad = [...ids, ...(themeId ? [themeId] : [])].filter(id => !byId[id] && !ostMap.has(id));
if (bad.length) { console.error(`FAIL: 未知 track id: ${bad.join(', ')}(node tools/assign-music.mjs --list 看可选;OST 池 id 见 audio.json#music.ost)`); process.exit(1); }
if (ids.length !== acts.length) {
  console.error(`FAIL: 给了 ${ids.length} 首,但 ${slug} 有 ${acts.length} 幕 —— 需一幕一首,依幕序给。`);
  acts.forEach((a, i) => console.error(`  幕${i + 1} ${a.title}`));
  process.exit(1);
}

// materialize:把 track 取成一个本地档路径(repo local → 海选 stash → preview 下载)
async function materialize(t) {
  if (t.local && existsSync(resolve(ROOT, t.local))) return resolve(ROOT, t.local);
  if (t.stash && existsSync(join(STASH, t.stash))) return join(STASH, t.stash);
  if (t.preview) {
    const dest = join(STASH, t.stash || `${t.id}.mp3`);
    mkdirSync(dirname(dest), { recursive: true });
    const r = await fetch(t.preview);
    if (!r.ok) throw new Error(`下载失败 ${t.preview} (${r.status})`);
    writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
    return dest;
  }
  throw new Error(`track ${t.id} 无可用来源(local/stash/preview 皆无)`);
}

const mdir = join(dir, 'assets', 'music');
mkdirSync(mdir, { recursive: true });
const scenes = [];
for (let i = 0; i < ids.length; i++) {
  const id = ids[i];
  if (ostMap.has(id)) { scenes.push(ostMap.get(id).rel); continue; }   // 池曲目:引用既有素材,不复制
  const src = await materialize(byId[id]);
  const rel = `assets/music/scene${i + 1}.mp3`;
  copyFileSync(src, join(dir, rel));
  scenes.push(rel);
}
let themeRel = scenes[scenes.length - 1];
if (themeId) {
  const idx = ids.indexOf(themeId);
  if (idx >= 0) themeRel = scenes[idx];
  else if (ostMap.has(themeId)) themeRel = ostMap.get(themeId).rel;
  else { themeRel = 'assets/music/theme.mp3'; copyFileSync(await materialize(byId[themeId]), join(dir, themeRel)); }
}

const AUDIO = AUDIO0;
AUDIO.music = { ...(AUDIO.music || {}), scenes, theme: themeRel };
writeFileSync(audioPath, JSON.stringify(AUDIO, null, 2) + '\n');

// CREDITS.md 音乐区块(marker 包夹)
const allUsed = [...new Set(ids.concat(themeId && !ids.includes(themeId) ? [themeId] : []))];
const cc0Used = allUsed.filter(id => byId[id]);
const ostUsed = allUsed.filter(id => ostMap.has(id));
const rows = cc0Used.map(id => { const t = byId[id]; return `| 幕配乐 ${id} | [${t.credit.title}](${t.credit.url}) | ${t.credit.author} | ${t.credit.license} |`; }).join('\n');
const ostNote = ostUsed.length
  ? `\n池曲目(${ostUsed.join(', ')})取自本包 / base 包 \`music.ost\`·\`music.bgm\` —— 影视原声等**非 CC0** 素材,来源与授权须人工补登。`
  : '';
const block = `<!-- music-credits:start -->
## 背景音乐(经 tools/assign-music.mjs 指派${cc0Used.length ? ';CC0 曲目自音乐库' : ''})

| 用途 | 原始素材 | 作者 | 授权 |
|---|---|---|---|
${rows || '| — | — | — | — |'}
${ostNote}
<!-- music-credits:end -->`;
const creditsPath = join(dir, 'assets', 'CREDITS.md');
let credits = existsSync(creditsPath) ? readFileSync(creditsPath, 'utf8') : `# 音频素材来源\n\n旁白由 edge-tts 生成(授权灰色,可换)。其余程序合成音效无外部素材。\n\n`;
credits = /<!-- music-credits:start -->[\s\S]*<!-- music-credits:end -->/.test(credits)
  ? credits.replace(/<!-- music-credits:start -->[\s\S]*<!-- music-credits:end -->/, block)
  : credits.trimEnd() + '\n\n' + block + '\n';
mkdirSync(dirname(creditsPath), { recursive: true });
writeFileSync(creditsPath, credits);

console.log(`OK ${slug}: 指派 ${ids.length} 幕配乐(theme=${themeRel})`);
ids.forEach((id, i) => {
  const t = byId[id];
  const tag = t ? `${t.mood}${t.local ? '' : ',目录池'}` : `OST池 ${ostMap.get(id)?.label || ''}`;
  console.log(`  幕${i + 1} ${acts[i].title} ← ${id}(${tag})`);
});
console.log(`  接着:node tools/audio-check.mjs --pkg packages/${slug}/battlefield.json`);
