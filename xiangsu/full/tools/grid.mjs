#!/usr/bin/env node
// 粗看配色：把一张图缩成 W×H 的 RGB 网格打出来（十六进制 + 亮度），只看色块关系。
//   node grid.mjs <png> [--w=16 --h=9]
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2);
const file = a[0];
const val = (k, d) => { const i = a.findIndex(x => x.startsWith('--' + k + '=')); return i >= 0 ? +a[i].split('=')[1] : d; };
const W = val('w', 16), H = val('h', 9);

const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file,
  '-vf', `scale=${W}:${H}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
  { maxBuffer: 1 << 24 });
const d = r.stdout;
if (!d || d.length < W * H * 3) { console.error('ffmpeg 失败:', r.stderr?.toString().slice(0, 300)); process.exit(1); }
const L = (R, G, B) => 0.2126 * R + 0.7152 * G + 0.0722 * B;
for (let y = 0; y < H; y++) {
  let line = '';
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    const [R, G, B] = [d[o], d[o + 1], d[o + 2]];
    const t = L(R, G, B) / 255;
    const ch = ' .:-=+*#%@'[Math.min(9, Math.floor(t * 10))];
    line += R.toString(16).padStart(2, '0') + G.toString(16).padStart(2, '0') + B.toString(16).padStart(2, '0') + ch + ' ';
  }
  console.log(line);
}
