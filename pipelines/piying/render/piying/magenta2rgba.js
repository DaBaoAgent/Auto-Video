// magenta2rgba.js — 品红底（#FF00FF）键控抠图，输出去溢色 RGBA
// 用法: node magenta2rgba.js <in.png> <out.png> [T0] [T1]
//   score = min(R,B) - G ；score<T0 全保留，score>T1 全透明，区间软边 + despill
// 注意：不含 chroma2rgba.js 里「右下角按亮度清像素」的水印特判（该特判会穿透浅色裙摆），
//      水印请先用 delogo 在 RGB 底图上抹掉，再跑本脚本。
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(file) {
  const b = fs.readFileSync(file);
  let off = 8, w = 0, h = 0, colorType = 2;
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
    cur.copy(out, y * stride);
    prev = cur;
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
const T0 = process.argv[4] !== undefined ? +process.argv[4] : 24;
const T1 = process.argv[5] !== undefined ? +process.argv[5] : 78;

const img = decodePNG(src);
const { w, h, ch, data } = img;
const rgba = Buffer.alloc(w * h * 4);
let cleared = 0, semi = 0;
for (let p = 0; p < w * h; p++) {
  let r = data[p * ch], g = data[p * ch + 1], b = data[p * ch + 2];
  let a = ch === 4 ? data[p * ch + 3] : 255;
  const score = Math.min(r, b) - g;
  if (score > T1) a = 0;
  else if (score > T0) {
    const k = (score - T0) / (T1 - T0);
    a = Math.round(a * (1 - k));
    semi++;
    // despill：R、B 向 G 收，消品红镶边
    r = Math.min(r, g + 30); b = Math.min(b, g + 30);
  }
  if (a === 0) cleared++;
  rgba[p * 4] = r; rgba[p * 4 + 1] = g; rgba[p * 4 + 2] = b; rgba[p * 4 + 3] = a;
}
fs.writeFileSync(dst, encodePNG({ w, h, data: rgba }));
console.log(`${dst}  transparent=${(cleared / (w * h) * 100).toFixed(1)}%  soft=${(semi / (w * h) * 100).toFixed(1)}%  T0=${T0} T1=${T1}`);
