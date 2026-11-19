// 品红底素材精抠：chroma key（品红度）+ 软边 alpha + despill 去溢色 + 右下水印区清理
// 支持 rgb24（colorType 2）与已转 RGBA（colorType 6）输入，输出标准 RGBA
const fs = require('fs');
const zlib = require('zlib');

function decodePNG(file) {
  const b = fs.readFileSync(file);
  let off = 8, w = 0, h = 0, bitDepth = 8, colorType = 2;
  const idat = [];
  while (off < b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') { w = b.readUInt32BE(off + 8); h = b.readUInt32BE(off + 12); bitDepth = b[off + 16]; colorType = b[off + 17]; }
    else if (type === 'IDAT') idat.push(b.slice(off + 8, off + 8 + len));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) throw new Error('unsupported ' + bitDepth + '/' + colorType);
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
      if (ft === 1) v = (v + a) & 255;
      else if (ft === 2) v = (v + bb) & 255;
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
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw);
  const crcTable = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : (c >>> 1); crcTable[n] = c; }
  function crc(buf) { let c = ~0; for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8); return ~c >>> 0; }
  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const t = Buffer.from(type, 'ascii');
    const crcb = Buffer.alloc(4); crcb.writeUInt32BE(crc(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, crcb]);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- 参数 ----
const T0 = 28;   // score < T0 → 完全保留
const T1 = 90;   // score > T1 → 完全透明
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

for (const f of process.argv.slice(2)) {
  const img = decodePNG(f);
  const { w, h, ch, data } = img;
  const rgba = Buffer.alloc(w * h * 4);
  let cleared = 0, semi = 0;
  for (let p = 0; p < w * h; p++) {
    let r = data[p * ch], g = data[p * ch + 1], bl = data[p * ch + 2];
    let a = ch === 4 ? data[p * ch + 3] : 255;
    // 品红度：R、B 都显著高于 G
    const score = Math.min(r, bl) - g;
    if (score > T1) { a = 0; }
    else if (score > T0) {
      const k = (score - T0) / (T1 - T0); // 0→1
      a = Math.round(a * (1 - k));
      semi++;
      // despill：把 R、B 向 G 压，消品红镶边
      r = Math.min(r, g + 36); bl = Math.min(bl, g + 36);
    }
    // 右下水印区（AI生成 WORKBUDDY）：灰白亮字 → 透明
    const x = p % w, y = (p / w) | 0;
    if (x >= 860 && y >= 940 && x < w && y < h) {
      const lum = 0.3 * r + 0.6 * g + 0.1 * bl;
      if (lum > 95 && score < T0) a = 0;
    }
    if (a === 0) cleared++;
    rgba[p * 4] = r; rgba[p * 4 + 1] = g; rgba[p * 4 + 2] = bl; rgba[p * 4 + 3] = a;
  }
  fs.writeFileSync(f, encodePNG({ w, h, data: rgba }));
  console.log(f, 'transparent', (cleared / (w * h) * 100).toFixed(1) + '%', 'soft-edge', (semi / (w * h) * 100).toFixed(1) + '%');
}
