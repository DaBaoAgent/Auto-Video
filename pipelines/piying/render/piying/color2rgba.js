// color2rgba.js — 通用纯色/近纯色背景抠图（自动取四角背景色 + 边界 BFS 连通域保护主体）
// 用法: node color2rgba.js <in.png> [out.png] [T0] [T1]
//   T0 起始透明阈值（色距小于 T0 视为纯背景）
//   T1 完全透明阈值（色距大于 T1 视为主体），T0~T1 之间软边
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(file) {
  const b = fs.readFileSync(file);
  let off = 8, w = 0, h = 0, colorType = 6;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') { w = b.readUInt32BE(off + 8); h = b.readUInt32BE(off + 12); colorType = b[off + 17]; }
    else if (type === 'IDAT') idat.push(b.slice(off + 8, off + 8 + len));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const ch = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const out = Buffer.alloc(w * h * ch);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.slice(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, bb = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (ft === 1) v = (v + a) & 255; else if (ft === 2) v = (v + bb) & 255;
      else if (ft === 3) v = (v + ((a + bb) >> 1)) & 255;
      else if (ft === 4) { const p = a + bb - c, pa = Math.abs(p - a), pb = Math.abs(p - bb), pc = Math.abs(p - c); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c)) & 255; }
      cur[x] = v;
    }
    cur.copy(out, y * stride); prev = cur;
  }
  return { w, h, ch, data: out };
}

function encodePNG(img) {
  const { w, h, data } = img;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const idat = zlib.deflateSync(raw);
  const crcTable = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1); crcTable[n] = c; }
  function crc(buf) { let c = ~0; for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8); return ~c >>> 0; }
  function chunk(type, d) {
    const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
    const t = Buffer.from(type, 'ascii');
    const crcb = Buffer.alloc(4); crcb.writeUInt32BE(crc(Buffer.concat([t, d])));
    return Buffer.concat([len, t, d, crcb]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const src = process.argv[2];
const dst = process.argv[3] || src.replace(/\.png$/i, '_rgba.png');
const T0 = process.argv[4] !== undefined ? +process.argv[4] : 8;
const T1 = process.argv[5] !== undefined ? +process.argv[5] : 30;

const img = decodePNG(src);
const { w, h, ch, data } = img;

// 1) 背景色：四角 + 四边中点中位数
const pts = [[3, 3], [w - 4, 3], [3, h - 4], [w - 4, h - 4], [w >> 1, 3], [w >> 1, h - 4], [3, h >> 1], [w - 4, h >> 1]];
const rs = [], gs = [], bs = [];
for (const [x, y] of pts) { const i = (y * w + x) * ch; rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]); }
const med = a => a.slice().sort((p, q) => p - q)[a.length >> 1];
const BG = [med(rs), med(gs), med(bs)];

const dist = new Float32Array(w * h);
for (let p = 0; p < w * h; p++) {
  const dr = data[p * ch] - BG[0], dg = data[p * ch + 1] - BG[1], db = data[p * ch + 2] - BG[2];
  dist[p] = Math.sqrt(dr * dr + dg * dg + db * db);
}

// 2) 边界 BFS：只有与画面边缘连通、且色距 < T1 的像素才算背景，保护主体内部近背景色区域
const isBg = new Uint8Array(w * h);
const stack = [];
const push = (x, y) => { const p = y * w + x; if (!isBg[p] && dist[p] < T1) { isBg[p] = 1; stack.push(p); } };
for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
while (stack.length) {
  const p = stack.pop();
  const x = p % w, y = (p / w) | 0;
  if (x > 0) push(x - 1, y);
  if (x < w - 1) push(x + 1, y);
  if (y > 0) push(x, y - 1);
  if (y < h - 1) push(x, y + 1);
}

// 3) alpha + despill
const rgba = Buffer.alloc(w * h * 4);
let cleared = 0, soft = 0;
for (let p = 0; p < w * h; p++) {
  let r = data[p * ch], g = data[p * ch + 1], b = data[p * ch + 2];
  let a = ch === 4 ? data[p * ch + 3] : 255;
  if (isBg[p]) {
    if (dist[p] <= T0) a = 0;
    else { const k = (dist[p] - T0) / (T1 - T0); a = Math.round(255 * Math.max(0, 1 - k)); soft++; }
    // 去背景色溢出：把残留色拉回主体侧
    if (a < 255 && a > 0) {
      const t = a / 255;
      r = Math.round((r - BG[0] * (1 - t)) / t);
      g = Math.round((g - BG[1] * (1 - t)) / t);
      b = Math.round((b - BG[2] * (1 - t)) / t);
      r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    }
  }
  if (a === 0) cleared++;
  rgba[p * 4] = r; rgba[p * 4 + 1] = g; rgba[p * 4 + 2] = b; rgba[p * 4 + 3] = a;
}
fs.writeFileSync(dst, encodePNG({ w, h, data: rgba }));
console.log(`${dst}  bg=rgb(${BG.join(',')})  transparent=${(cleared / (w * h) * 100).toFixed(1)}%  soft=${(soft / (w * h) * 100).toFixed(1)}%`);
