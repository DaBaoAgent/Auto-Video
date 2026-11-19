// 幕长自动对齐:读该包旁白 cues.json 各幕双声长度,把 scene.json 每幕 dur 对齐到
// 「最长那条人声 + buffer」(变长变短都调),连带调末段镜头 dur 与 finale 时点。
// 这是「更新语音后自动调幕长」的核心(编辑器 regen 会呼叫它),也可独立 CLI 跑。
//
// 用法(repo 根): node tools/fit-durations.mjs --pkg packages/<slug>/battlefield.json [--buffer 3.5] [--dry]
//   --dry 只印不写。没旁白的幕不动。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const MANIFEST = resolve(process.cwd(), arg('--pkg', 'packages/chibi-full/battlefield.json'));
const BUFFER = parseFloat(arg('--buffer', '3.5'));
const DRY = process.argv.includes('--dry');
const BASE = dirname(MANIFEST);
const read = p => JSON.parse(readFileSync(p, 'utf8'));

if (!existsSync(MANIFEST)) { console.error('FAIL\nmanifest 不存在: ' + MANIFEST); process.exit(1); }
const BF = read(MANIFEST);
const scenePath = resolve(BASE, BF.data.scene);
const SCENE = read(scenePath);
const AUDIO = read(resolve(BASE, BF.data.audio));
const voices = AUDIO.narration?.voices || [];
const cuesPath = AUDIO.narration?.cues && resolve(BASE, AUDIO.narration.cues);

if (!voices.length || !cuesPath || !existsSync(cuesPath)) {
  console.log('SKIP — 尚无旁白(narration.voices 空或 cues.json 不存在),无幕长可对齐'); process.exit(0);
}
const cues = read(cuesPath);

let changed = 0;
SCENE.acts.forEach((a, i) => {
  const e = cues[String(i + 1)];
  if (!e) return;                                   // 该幕无旁白 → 不动
  const maxd = Math.max(...voices.map(v => e[v]?.dur ?? 0));
  if (!maxd) return;
  const target = Math.round(maxd + BUFFER);
  if (target === a.dur) { console.log(`  act${i + 1} ${a.title}: 旁白 ${maxd.toFixed(1)}s,幕长 ${a.dur}s 已对齐`); return; }
  const delta = target - a.dur;
  const shots = a.shots || [];
  const last = shots[shots.length - 1];
  const oldLast = last ? last.dur : null;
  if (last) last.dur = Math.max(4, Math.round((last.dur || 0) + delta));
  let finMsg = '';
  if ('finale' in a) { const nf = Math.min(target, Math.max(1, Math.round(maxd + 0.5))); if (nf !== a.finale) { finMsg = ` finale ${a.finale}→${nf}`; a.finale = nf; } }
  console.log(`  act${i + 1} ${a.title}: 旁白 ${maxd.toFixed(1)}s  幕长 ${a.dur}→${target}s${last ? ` 末镜 ${oldLast}→${last.dur}s` : ''}${finMsg}`);
  a.dur = target;
  changed++;
});

if (changed && !DRY) { writeFileSync(scenePath, JSON.stringify(SCENE, null, 2) + '\n'); }
console.log(changed ? `${DRY ? '[dry] ' : ''}${changed} 幕${DRY ? '需' : '已'}调整(buffer ${BUFFER}s)` : '全部幕长已对齐,无需更动');
