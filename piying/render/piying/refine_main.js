// 残留清理：BFS 从中心标记主体连通域，外围半透明残留清零，保留主体边缘 2px 软边
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

for (const f of process.argv.slice(2)) {
  const img = decodePNG(f);
  const { w, h, ch, data } = img;
  const A = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) A[p] = ch === 4 ? data[p * 4 + 3] : 255;
  // 主体种子：包含中心的 21x21 区域内不透明像素
  const main = new Uint8Array(w * h);
  const qx = [];
  for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
    const x = (w >> 1) + dx, y = (h >> 1) + dy;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (A[p] > 140) { main[p] = 1; qx.push(p); }
  }
  // BFS：穿越不透明像素（a>140）
  for (let qi = 0; qi < qx.length; qi++) {
    const p = qx[qi], x = p % w, y = (p / w) | 0;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const np = ny * w + nx;
      if (!main[np] && A[np] > 140) { main[np] = 1; qx.push(np); }
    }
  }
  // 距主体 2px 内的边缘带（保留软边）
  const band = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    if (main[p]) continue;
    const x = p % w, y = (p / w) | 0;
    let near = false;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      if (main[ny * w + nx]) { near = true; break; }
    }
    if (near) band[p] = 1;
  }
  let killed = 0;
  const out = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    let a = ch === 4 ? data[p * 4 + 3] : 255;
    if (!main[p] && !band[p]) { a = 0; killed++; }
    out[p * 4] = data[p * ch]; out[p * 4 + 1] = data[p * ch + 1];
    out[p * 4 + 2] = data[p * ch + 2]; out[p * 4 + 3] = a;
  }
  fs.writeFileSync(f, encodePNG({ w, h, data: out }));
  console.log(f, 'main', ((w * h - killed) / (w * h) * 100).toFixed(1) + '%', 'killed-residue', (killed / (w * h) * 100).toFixed(1) + '%');
}
