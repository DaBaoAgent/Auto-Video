#!/usr/bin/env node
// 用终端看画面：ffmpeg 解码 → 灰度 ASCII + 分区亮度/色彩统计。
//   node ascii.mjs <png> [...] [--w=118] [--h=36] [--zone]
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const w = +(opt.w || 118), h = +(opt.h || 36);
const RAMP = ' .:-=+*#%@';

function raw(file, sw, sh, pix = 'gray') {
  return execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `scale=${sw}:${sh}:flags=area`, '-f', 'rawvideo', '-pix_fmt', pix, '-'], { maxBuffer: 1 << 28 });
}
function stats(file) {
  const rgb = raw(file, 160, 90, 'rgb24');
  let n = 160 * 90, sr = 0, sg = 0, sb = 0, s2 = 0, black = 0;
  const uniq = new Set();
  for (let i = 0; i < n; i++) {
    const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
    sr += r; sg += g; sb += b;
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    s2 += l * l;
    if (l < 6) black++;
    uniq.add((r >> 3) << 10 | (g >> 3) << 5 | (b >> 3));
  }
  const mr = sr / n, mg = sg / n, mb = sb / n;
  const ml = 0.299 * mr + 0.587 * mg + 0.114 * mb;
  const sd = Math.sqrt(Math.max(0, s2 / n - ml * ml));
  // 3x3 分区亮度
  const zones = [];
  for (let zy = 0; zy < 3; zy++) {
    const row = [];
    for (let zx = 0; zx < 3; zx++) {
      let s = 0, c = 0;
      for (let y = zy * 30; y < zy * 30 + 30; y++) for (let x = zx * 53; x < zx * 53 + 53; x++) {
        const i = (y * 160 + x) * 3;
        s += 0.299 * rgb[i] + 0.587 * rgb[i + 1] + 0.114 * rgb[i + 2]; c++;
      }
      row.push((s / c).toFixed(0));
    }
    zones.push(row.join('/'));
  }
  return { mean: ml.toFixed(1), sd: sd.toFixed(1), rgb: `${mr.toFixed(0)},${mg.toFixed(0)},${mb.toFixed(0)}`, black: (black / n * 100).toFixed(0) + '%', colors: uniq.size, zones };
}
for (const f of files) {
  const g = raw(f, w, h);
  const s = stats(f);
  console.log(`\n=== ${f.split(/[\\/]/).pop()}  lum ${s.mean} sd ${s.sd} rgb(${s.rgb}) black ${s.black} colors ${s.colors}`);
  console.log(`    zones ${s.zones.join(' | ')}`);
  let out = '';
  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      const v = g[y * w + x] / 255;
      line += RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.round(v * (RAMP.length - 1))))];
    }
    out += line.replace(/\s+$/, '') + '\n';
  }
  console.log(out);
}
