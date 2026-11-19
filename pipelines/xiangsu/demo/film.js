// 伊甸园 · 波斯湾的鱼皮神 — xiangsu2 640×360 → 1920×1080, 10.000 s, 300 frames
// 640×360 indexed framebuffer -> ×3 nearest-neighbour (native 1920×1080) -> CRT pass at output resolution
// 像素精度为 320×180 版的两倍：所有造型、抖动、描边都在这张 640×360 的原生栅格上逐像素决定。
// 静态元素（墓丘全景/标题/石壁/门框/机身/履带/文物本体）用单张像素图；
// 逐帧变性的元素（人群骚动/挖掘机臂组/棺盖开启）用 sprite 帧表或多档旋转帧。
// 打光仍然只沿色板 ramp 提亮既有像素，绝不盖半透明白色。

import * as S from './sprites.js';
import CUES from './cues.json' with { type: 'json' };

const W = 640, H = 360, FPS = 30;
const cues = CUES;
window.DEMO = { width: 1920, height: 1080, fps: FPS, duration: cues.duration };
const F = t => Math.round(t * FPS);

// ---------------------------------------------------------------- palette (32 cols)
const HEX = S.PAL;
const MP = HEX.map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
const M = i => 64 + i;
const NSLOT = 128;
const SM = new Array(NSLOT);
for (let i = 0; i < NSLOT; i++) SM[i] = [0, 0, 0];
for (let i = 0; i < 32; i++) SM[64 + i] = [i, i, i];
const E = {}; let nS = 1;
const env = (n, a) => { E[n] = nS; SM[nS] = a; nS++; };
env('sky0', [1, 2, 24]); env('sky1', [2, 3, 25]); env('sky2', [3, 4, 31]); env('sky3', [4, 5, 9]);
env('moon', [28, 28, 16]); env('moonG', [4, 5, 29]);
env('cloudD', [2, 3, 25]); env('cloudL', [4, 5, 29]);
env('mtnF', [1, 2, 24]); env('mtnN', [2, 3, 31]);
env('treeD', [1, 2, 24]); env('treeN', [2, 21, 31]); env('treeL', [3, 22, 25]);
env('moundD', [9, 10, 9]); env('moundM', [11, 11, 11]); env('moundL', [12, 12, 13]); env('moundT', [14, 14, 15]);
env('water', [2, 20, 9]); env('waterL', [3, 21, 10]);
env('grassD', [1, 21, 9]); env('grassL', [3, 22, 11]);
env('fog', [4, 5, 29]);
env('stoneD', [31, 1, 9]); env('stoneM', [3, 26, 10]); env('stoneL', [5, 27, 12]);
env('goldD', [29, 29, 29]); env('goldM', [12, 29, 15]); env('goldL', [13, 15, 16]);
env('redD', [17, 17, 17]); env('redM', [18, 18, 18]); env('redH', [19, 19, 19]);
env('light', [7, 7, 16]); env('teal', [20, 22, 23]); env('ink', [0, 0, 0]);

const NEXT = new Uint8Array(NSLOT).fill(255);
const PALT = new Uint8Array(NSLOT).fill(255);
const ramp = (...a) => { for (let i = 0; i < a.length - 1; i++) NEXT[a[i]] = a[i + 1]; };
const pramp = (...a) => { for (let i = 0; i < a.length - 1; i++) PALT[64 + a[i]] = 64 + a[i + 1]; };
ramp(E.ink, E.sky0, E.sky1, E.sky2, E.sky3, E.moon);
ramp(E.treeD, E.treeN, E.treeL, E.grassL);
ramp(E.moundD, E.moundM, E.moundL, E.moundT, M(8));
ramp(E.water, E.waterL, E.sky2);
ramp(E.stoneD, E.stoneM, E.stoneL, M(28), M(8));
ramp(E.goldD, E.goldM, E.goldL, M(8));
ramp(E.redD, E.redM, E.redH, M(15));
ramp(E.grassD, E.treeD);
// 色板自身的 ramp —— 让 sprite 的纯色像素也能被灯光提亮
pramp(0, 1, 2, 3, 4, 5, 6, 7, 8);
pramp(9, 10, 11, 12, 13, 14);
pramp(17, 18, 19, 15, 16);
pramp(20, 21, 22, 23);
pramp(31, 25, 24, 3);
const nextIdx = c => (c < 64 ? NEXT[c] : PALT[c]);

const T_HAZE = 1.86, T_GOLD = 6.88, TSPAN = 6;
function stageOf(f) {
  if (f >= F(T_HAZE) && f < F(T_HAZE) + TSPAN) { const k = (f - F(T_HAZE)) / TSPAN; return [0, 1, k < 0.5 ? 1 / 3 : 2 / 3]; }
  if (f >= F(T_GOLD) && f < F(T_GOLD) + TSPAN) { const k = (f - F(T_GOLD)) / TSPAN; return [1, 2, k < 0.5 ? 1 / 3 : 2 / 3]; }
  return [f < F(T_HAZE) ? 0 : f < F(T_GOLD) ? 1 : 2, 0, 0];
}
function nearest(r, g, b) {
  let bi = 0, bd = 1e18;
  for (let i = 0; i < 32; i++) { const p = MP[i]; const d = 0.3 * (p[0] - r) ** 2 + 0.59 * (p[1] - g) ** 2 + 0.11 * (p[2] - b) ** 2; if (d < bd) { bd = d; bi = i; } }
  return bi;
}
const mixIdx = (a, b, t) => { const A = MP[a], B = MP[b]; return t ? nearest(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t) : a; };
function makeLUT(f) {
  const [a, b, t] = stageOf(f);
  const lut = new Uint8Array(NSLOT);
  for (let s = 0; s < nS; s++) lut[s] = t ? mixIdx(SM[s][a], SM[s][b], t) : SM[s][a];
  for (let i = 0; i < 32; i++) lut[64 + i] = i;
  return lut;
}

// ---------------------------------------------------------------- buffer + primitives
const IB = new Uint8Array(W * H);
const JB = new Uint8Array(W * H);
let GX = 0, GY = 0;
const px = (x, y, c) => { x = (x | 0) + GX; y = (y | 0) + GY; if (x >= 0 && x < W && y >= 0 && y < H) IB[y * W + x] = c; };
const get = (x, y) => (x >= 0 && x < W && y >= 0 && y < H) ? IB[y * W + x] : 0;
const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c); };
const hline = (x, y, w, c) => { for (let i = 0; i < w; i++) px(x + i, y, c); };
const vline = (x, y, h, c) => { for (let j = 0; j < h; j++) px(x, y + j, c); };
const BAY8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const bay = (x, y) => (BAY8[((y & 7) << 3) + (x & 7)] + 0.5) / 64;
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const stepEase = (k, n) => Math.round(clamp(k, 0, 1) * n) / n;

function brighten(x, y, k = 1) {
  x = (x | 0) + GX; y = (y | 0) + GY;
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  let c = IB[y * W + x];
  for (let i = 0; i < k; i++) { const n = nextIdx(c); if (n === 255) return; c = n; }
  IB[y * W + x] = c;
}
function glowSpot(cx, cy, r, k, amt) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = Math.sqrt(i * i + j * j) / r;
    if (d > 1) continue;
    if ((bay(cx + i, cy + j) * 0.45 + hash(cx + i, cy + j) * 0.55) < (1 - d) * amt) brighten(cx + i, cy + j, k);
  }
}
function disc(cx, cy, r, c) {
  for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - j * j))); hline(cx - w, cy + j, w * 2 + 1, c); }
}
function ring(cx, cy, r, c, phase = 0) {
  const n = Math.max(8, Math.round(r * 6.283));
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + phase; px(cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r), c); }
}
function line(x0, y0, x1, y1, c) {
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx - dy;
  for (;;) { px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
}
function poly(pts, c) {
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) { const xa = Math.ceil(xs[k]), xb = Math.floor(xs[k + 1]); if (xb >= xa) hline(xa, y, xb - xa + 1, c); }
  }
}
function polyD(pts, c, odd = 0) {
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) if (((x + y) & 1) === odd) px(x, y, c);
  }
}
function lightPoly(pts, k, amt, lx, ly, lr) {
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let kk = 0; kk + 1 < xs.length; kk += 2)
      for (let x = Math.ceil(xs[kk]); x <= Math.floor(xs[kk + 1]); x++) {
        let f = 1;
        if (lr) { const d = Math.sqrt((x - lx) ** 2 + (y - ly) ** 2) / lr; f = clamp(1 - d, 0, 1); }
        if ((bay(x, y) * 0.45 + hash(x, y) * 0.55) < f * amt) brighten(x, y, k);
      }
  }
}
function polyLine(pts, c, closed = true) {
  const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) line(pts[i][0], pts[i][1], pts[(i + 1) % n][0], pts[(i + 1) % n][1], c);
}
const scalePoly = (pts, k, oy = 0) => { let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy = cy / pts.length + oy; return pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]); };
function dithGrad(x0, y0, x1, y1, cA, cB) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    for (let x = x0; x < x1; x++) px(x, y, bay(x + (y >> 1), y) < t ? cB : cA);
  }
}

// ---------------------------------------------------------------- sprite build
// 字符 → 帧缓冲值。纯色表 sprite 用 MAP_PAL；石材用 MAP_STONE（走 env 槽，随镜头分级变色且可被灯打亮）
const MAP_PAL = { '.': 0 };
for (const k of Object.keys(S.CHR)) if (S.CHR[k] >= 0) MAP_PAL[k] = 64 + S.CHR[k];
const MAP_MACH = Object.assign({}, MAP_PAL, { '1': M(2), '2': M(3), '3': M(4), '4': M(5), '5': M(6) });
const MAP_STONE = {
  '.': 0, k: E.ink, '1': E.stoneD, '2': E.stoneM, '3': E.stoneL, '4': M(28), '5': M(27),
  u: E.stoneL, w: M(28), s: M(27), S: M(26), b: E.stoneM, n: M(28),
  g: E.goldD, G: E.goldM, y: E.goldL, '6': E.goldL,
  m: E.stoneD, M: E.stoneM, L: E.stoneL, l: M(28), r: E.redD, R: E.redM, Q: E.redH, c: E.ink,
};
let sprN = 0;
function rimLight(s, k = 1) {           // 月光在右上：上边与右边一像素提亮
  const src = s.d.slice();
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const i = y * s.w + x, c = src[i];
    if (!c) continue;
    const up = y === 0 ? 0 : src[i - s.w];
    const rt = x === s.w - 1 ? 0 : src[i + 1];
    if (!up || !rt) { let n = c; for (let q = 0; q < k; q++) { const t = nextIdx(n); if (t === 255) break; n = t; } s.d[i] = n; }
  }
  return s;
}
function buildSpr(name, rows, map = MAP_PAL, rim = 1) {
  const r = rows.map(x => x.replace(/\s+/g, ''));
  const w = Math.max(...r.map(x => x.length)), h = r.length;
  const d = new Uint8Array(w * h);
  const unk = new Set();
  let ragged = 0;
  r.forEach((row, y) => {
    if (row.length !== w) ragged++;
    for (let x = 0; x < row.length; x++) { const ch = row[x]; const c = map[ch]; if (c === undefined) { unk.add(ch); continue; } d[y * w + x] = c; }
  });
  if (ragged) console.warn(`[spr] ${name} 有 ${ragged}/${h} 行宽与 ${w} 不一致`);
  if (unk.size) console.warn(`[spr] ${name} 未知字符 ${[...unk].join('')}`);
  const s = { w, h, d, id: ++sprN, name };
  return rim ? rimLight(s, rim) : s;
}
function blit(s, x, y, k = 1, flip = false) {
  for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
    const c = s.d[j * s.w + (flip ? s.w - 1 - i : i)];
    if (!c) continue;
    if (k === 1) px(x + i, y + j, c);
    else for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) px(x + i * k + sx, y + j * k + sy, c);
  }
}
function blitSil(s, x, y, k, col) {
  for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
    if (!s.d[j * s.w + i]) continue;
    if (k === 1) px(x + i, y + j, col);
    else for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) px(x + i * k + sx, y + j * k + sy, col);
  }
}
// 石材铺贴：按 24 px 分行错位，避免整片出现同一相位
function tile(s, x, y, w, h, oy = 0) {
  for (let j = 0; j < h; j++) {
    const sy = ((j + oy) % s.h), sh = (Math.floor((j + oy) / s.h) * 7) % s.w;
    for (let i = 0; i < w; i++) { const c = s.d[sy * s.w + ((i + sh) % s.w)]; if (c) px(x + i, y + j, c); }
  }
}
// 旋转帧：5° 一档，最近邻，结果缓存（臂组连续动作靠它，而非临时画线）
const ROTC = new Map();
function rotSpr(s, ang) {
  const q = Math.round(ang / (Math.PI / 36));
  const key = s.id + ':' + q;
  const hit = ROTC.get(key); if (hit) return hit;
  const a = q * Math.PI / 36, ca = Math.cos(a), sa = Math.sin(a);
  const w = Math.max(1, Math.ceil(Math.abs(s.w * ca) + Math.abs(s.h * sa)));
  const h = Math.max(1, Math.ceil(Math.abs(s.w * sa) + Math.abs(s.h * ca)));
  const d = new Uint8Array(w * h);
  const cx = w / 2, cy = h / 2, sx = s.w / 2, sy = s.h / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x + 0.5 - cx, v = y + 0.5 - cy;
    const sxi = Math.floor(u * ca + v * sa + sx), syi = Math.floor(-u * sa + v * ca + sy);
    if (sxi < 0 || sxi >= s.w || syi < 0 || syi >= s.h) continue;
    const c = s.d[syi * s.w + sxi]; if (c) d[y * w + x] = c;
  }
  const ox = cx + (-s.w / 2 * ca + s.h / 2 * sa);
  const oy = cy + (-s.w / 2 * sa - s.h / 2 * ca);
  const o = { w, h, d, ox, oy };
  ROTC.set(key, o);
  return o;
}
// 以源图 (ax,ay) 为锚点放置旋转帧
function blitRot(s, ang, wx, wy, ax = 0, ay = 0) {
  // 把源图 (ax,ay) 精确放到世界坐标 (wx,wy)
  const r = rotSpr(s, ang);
  const bx = Math.round(wx - ax - r.ox), by = Math.round(wy - ay - r.oy);
  for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
    const c = r.d[j * r.w + i]; if (!c) continue;
    px(bx + i, by + j, c);
  }
}

// ---------------------------------------------------------------- pixel font
const TC = new Map();
const _tc = document.createElement('canvas');
_tc.width = W; _tc.height = 24;
const _tx = _tc.getContext('2d', { willReadFrequently: true });
function bmp(str) {
  let o = TC.get(str);
  if (o) return o;
  _tx.font = '12px "Fusion Pixel 12"';
  const w = Math.max(1, Math.ceil(_tx.measureText(str).width));
  _tc.width = Math.min(W, w + 2); _tc.height = 24;
  _tx.font = '12px "Fusion Pixel 12"';
  _tx.textBaseline = 'top'; _tx.fillStyle = '#fff';
  _tx.clearRect(0, 0, _tc.width, 24);
  _tx.fillText(str, 0, 1);
  const d = _tx.getImageData(0, 0, _tc.width, 24).data;
  const m = new Uint8Array(_tc.width * 24);
  for (let i = 0; i < _tc.width * 24; i++) m[i] = d[i * 4 + 3] > 200 ? 1 : 0;
  o = { w: _tc.width, h: 24, m };
  TC.set(str, o);
  return o;
}
function textW(str) { bmp(str); return bmp(str).w; }
function text(str, x, y, c, scale = 1) {
  const b = bmp(str);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.m[j * b.w + i]) {
    if (scale === 1) px(x + i, y + j, c);
    else for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) px(x + i * scale + sx, y + j * scale + sy, c);
  }
  return textW(str) * scale;
}
function textC(str, cx, y, c, scale = 1) { return text(str, Math.round(cx - textW(str) * scale / 2), y, c, scale); }

// ---------------------------------------------------------------- scenery helpers
function skyBand(y0, y1, cA, cB) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    for (let x = 0; x < W; x++) px(x, y, bay(x + (y >> 2), y) < t ? cB : cA);
  }
}
function stars(f) {
  for (let i = 0; i < 92; i++) {
    const x = Math.floor(hash(i, 7) * W), y = Math.floor(hash(i, 13) * 168);
    const ph = (f / 26 + hash(i, 21)) % 1;
    if (ph < 0.5) px(x, y, ph < 0.14 ? E.moon : E.sky3);
  }
}
function moon(f, cx, cy, r) {
  for (let j = -r - 16; j <= r + 16; j++) for (let i = -r - 16; i <= r + 16; i++) {
    const d = Math.sqrt(i * i + j * j);
    if (d < r + 16 && d > r) { const t = (r + 16 - d) / 16; if (bay(cx + i, cy + j) < t * 0.5) px(cx + i, cy + j, E.moonG); }
  }
  disc(cx, cy, r, E.moon);
  disc(cx - Math.round(r * 0.3), cy - Math.round(r * 0.25), Math.round(r * 0.45), M(8));
  for (let i = 0; i < 10; i++) px(cx - 8 + Math.floor(hash(i, 3) * 17), cy - 6 + Math.floor(hash(i, 5) * 15), M(7));
}
function cloudBand(f, y, w, spd, c, c2) {
  const off = -((f * spd) % (W + w * 2));
  for (let k = 0; k < 2; k++) {
    const bx = off + k * (W + w);
    for (let i = 0; i < w; i++) {
      const prof = Math.sin(i / w * 3.1416);
      const hh = Math.max(1, Math.round((3.2 + 3.4 * Math.sin(i * 0.19) + 2.2 * Math.sin(i * 0.061)) * prof));
      for (let j = 0; j < hh; j++) px(bx + i, y + j, j === hh - 1 && prof > 0.5 ? c2 : c);
    }
  }
}
function forest(f, yBase, seed, cDark, cLight, scl = 2, spd = 0.08) {
  const off = Math.round((f * spd) % 24);
  let x = -28 - off, i = 0;
  while (x < W + 28) {
    const w = Math.round((10 + hash(i, seed) * 14) * scl / 2);
    const h = Math.round((12 + hash(i, seed + 1) * 18) * scl / 2);
    const broad = hash(i, seed + 2) > 0.5;
    for (let j = 0; j < h; j++) {
      const u = j / h;
      const half = broad ? Math.round((w / 2) * Math.pow(u, 0.55)) + 1 : Math.round((w / 2) * (1 - Math.pow(1 - u, 1.9))) + 1;
      hline(x + Math.round(w / 2) - half, yBase - j, half * 2, j > h - 2 ? cLight : cDark);
    }
    x += Math.max(8, w);
    i++;
  }
}
function fogPatch(cx, cy, rx, ry, c, amt, f) {
  const ox = Math.round(Math.sin(f * 0.05) * 12);
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const d = Math.sqrt((i / rx) ** 2 + (j / ry) ** 2);
    if (d > 1) continue;
    if (bay(cx + i + ox, cy + j) < (1 - d) * amt) px(cx + i + ox, cy + j, c);
  }
}
function reeds(f, yBase, n, seed) {
  for (let i = 0; i < n; i++) {
    const x = Math.round(hash(i, seed) * W);
    const h = 8 + Math.round(hash(i, seed + 9) * 16);
    const ph = hash(i, seed + 3) * 6.28;
    const sway = Math.sin(f * 0.24 + ph) * 4.0;
    for (let j = 0; j < h; j++) px(Math.round(x + sway * (j / h) * (j / h) * 5.2), yBase - j, j > h - 3 ? E.grassL : E.grassD);
  }
}
function crow(f, x, y) {
  const flap = (Math.floor(f / 3) & 1) === 0;
  const c = M(0);
  for (const [dx, dy] of [[0, -2], [1, -1], [2, 0], [1, 1], [0, 1], [-1, 1]]) px(x + dx, y + dy, c);
  if (flap) { for (const [dx, dy] of [[-3, -2], [-2, -1], [-1, 0], [3, -1], [4, -1]]) px(x + dx, y + dy, c); }
  else { for (const [dx, dy] of [[-3, 2], [-2, 1], [-1, 1], [3, 2], [4, 2]]) px(x + dx, y + dy, c); }
}
function arc(cx, cy, r, a0, a1, c) {
  const n = Math.max(6, Math.round(r * Math.abs(a1 - a0) * 1.6));
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; px(cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r), c); }
}

// ---------------------------------------------------------------- sprites 实例
const SPR = {
  body: buildSpr('EXC_BODY', S.EXC_BODY, MAP_MACH),
  track: buildSpr('EXC_TRACK', S.EXC_TRACK, MAP_MACH),
  boom: buildSpr('EXC_BOOM', S.EXC_BOOM, MAP_MACH),
  arm: buildSpr('EXC_ARM', S.EXC_ARM, MAP_MACH),
  bucket: buildSpr('BUCKET', S.BUCKET, MAP_MACH),
  bucketDirt: buildSpr('BUCKET_DIRT', S.BUCKET_DIRT, MAP_MACH),
  stone: buildSpr('STONE_TILE', S.STONE_TILE, MAP_STONE, 0),
  // 门环是铜活，必须走 MAP_STONE（暖铜），走 MAP_PAL 会变成钢蓝色"胶囊"
  ring: buildSpr('RING_HANDLE', S.RING_HANDLE, MAP_STONE, 1),
  boss: buildSpr('ROPE_BOSS', S.ROPE_BOSS, MAP_STONE, 1),
  sarcoEnd: buildSpr('SARCO_END', S.SARCO_END, MAP_STONE, 1),
  lidEnd: buildSpr('SARCO_LID_END', S.SARCO_LID_END, MAP_STONE, 1),
  armor: buildSpr('ARMOR', S.ARMOR, MAP_STONE, 1),
  person: [S.PERSON_F0, S.PERSON_F1, S.PERSON_F2, S.PERSON_F3, S.PERSON_F4, S.PERSON_F5]
    .map((r, i) => buildSpr('PERSON_F' + i, r, MAP_PAL, 1)),
};

// ================================================================== SHOT A：逆光台阶墓丘 + 标题
function shotA(t, f) {
  skyBand(0, 80, E.sky0, E.sky1);
  skyBand(80, 192, E.sky1, E.sky2);
  skyBand(192, 264, E.sky2, E.sky3);
  stars(f);
  moon(f, 508, 88, 34);
  cloudBand(f, 52, 172, 0.10, E.cloudD, E.sky2);
  const sil = M(0);
  rect(176, 264, 248, 40, sil);
  rect(208, 224, 184, 40, sil);
  rect(236, 192, 128, 32, sil);
  disc(300, 192, 34, sil);
  // 月侧轮廓光：1 px 更细，精度翻倍的主要观感来源
  for (const [x, y, h] of [[422, 264, 40], [390, 224, 40], [362, 192, 32]]) { vline(x, y, h, E.moundT); vline(x + 1, y, h, E.moundD); }
  // 月光在右上（月亮在 (508,88)，方向 atan2(-104,208)≈-0.46），受光弧必须以它为中心，
  // 否则会变成"右下角一道月牙"，看着像剪影被咬了一口
  arc(300, 192, 34, -1.35, 0.55, E.moundT);
  for (let x = 240; x < 364; x++) if (bay(x, 194) < 0.6) px(x, 194, E.moundD);
  for (let x = 212; x < 392; x++) if (bay(x, 226) < 0.6) px(x, 226, E.moundD);
  for (let x = 180; x < 424; x++) if (bay(x, 266) < 0.6) px(x, 266, E.moundD);
  // 地面 + 前景草
  forest(f, 316, 9, M(0), E.treeD, 0.85, 0.22);
  reeds(f, 352, 88, 5);
  fogPatch(160, 296, 140, 10, E.fog, 0.22, f);
  fogPatch(500, 308, 120, 8, E.fog, 0.18, f);
  const st = Math.floor(f / 3);
  crow(f, 120 + st * 3, 88 + Math.round(Math.sin(st * 0.5) * 4));
  crow(f, 184 + st * 3, 68 + Math.round(Math.sin(st * 0.4 + 1) * 4));

  // ---- 标题（scale 4 = 与 320 版 scale 2 等版面比例）
  const t1 = '仁德天皇陵';
  textC(t1, 320, 67, M(0), 4);
  textC(t1, 320, 64, M(8), 4);
  const t2 = 'PIXEL TOMB';
  const tw2 = textW(t2) * 2;
  textC(t2, 320, 120, E.redH, 2);
  hline(320 - tw2 / 2, 116, tw2, E.redM);
  const shine = (t - 0.16) / 1.15;
  if (shine > 0 && shine < 1) {
    const sy = Math.round(lerp(56, 112, shine));
    for (let x = 0; x < W; x++) {
      const y = sy - Math.round(x * 0.09);
      if (y > 60 && y < 116) { brighten(x, y, 2); brighten(x, y + 1, 1); }
    }
  }
  // ---- 案卷戳
  const stamp = '2018.10.15';
  const n = clamp(Math.floor((t - 0.06) / 0.038) + 1, 0, stamp.length);
  const tw = textW(stamp) * 2;
  const bx = 20, by = 20;
  rect(bx, by, tw + 18, 32, M(0));
  hline(bx, by, tw + 18, E.redM); hline(bx, by + 31, tw + 18, E.redM);
  if (n > 0) {
    text(stamp.slice(0, n), bx + 10, by + 5, M(8), 2);
    if (n < stamp.length && Math.floor(f / 3) % 2 === 0) px(bx + 10 + textW(stamp.slice(0, n)) * 2, by + 18, M(15));
  }
  const cn = '第 002 号悬案';
  const cw = textW(cn) * 2 + 20;
  rect(bx, by + 40, cw, 32, M(0));
  text(cn, bx + 10, by + 45, M(8), 2);
  const cap = '全长 486m';
  const capw = textW(cap) * 2 + 20;
  rect(bx, by + 80, capw, 32, M(0));
  text(cap, bx + 10, by + 85, E.stoneL, 2);
}

// ================================================================== SHOT B：号外砸落
const NEWS = (() => { const r = rng(99); return Array.from({ length: 4 }, () => ({ w: 68 + Math.round(r() * 92) })); })();
function paper(x, y, w, h) {
  rect(x, y, w, h, M(28));
  rect(x, y, w, 2, M(0)); rect(x, y + h - 2, w, 2, M(0)); vline(x, y, h, M(0)); vline(x + w - 2, y, h, M(0));
  for (let i = 0; i < 90; i++) {
    const xx = x + 4 + Math.floor(hash(i, 17) * (w - 8)), yy = y + 4 + Math.floor(hash(i, 19) * (h - 8));
    if (get(xx, yy) === M(28)) px(xx, yy, M(14));
  }
  rect(x + 4, y + 4, w - 8, 30, E.redM);
  text('号外', x + 12, y + 8, M(8), 2);
  const ds = '2018.10.15';
  text(ds, x + w - 12 - textW(ds) * 2, y + 8, M(28), 2);
  text('天皇陵', x + 12, y + 40, M(0), 4);
  text('解禁', x + 12, y + 92, E.redM, 4);
  const sx = x + w - 52, sy = y + 72;
  disc(sx, sy, 26, E.redM);
  ring(sx, sy, 26, M(0)); ring(sx, sy, 18, E.redD); rect(sx - 4, sy - 4, 9, 9, M(0));
  for (let i = 0; i < 2; i++) {
    const yy = y + h - 34 - i * 8;
    hline(x + 12, yy, Math.min(NEWS[i].w, w - 36), E.stoneM);
    hline(x + 12, yy + 3, Math.min(NEWS[i].w - 20, w - 36), E.stoneM);
  }
  text('宫内省 考古部', x + 12, y + h - 26, E.stoneM, 2);
}
function shotB(t, f) {
  skyBand(0, 92, E.sky0, E.sky1);
  skyBand(92, 160, E.sky1, E.sky2);
  skyBand(160, 216, E.sky2, E.sky3);
  stars(f);
  moon(f, 516, 56, 22);
  cloudBand(f, 52, 168, 0.14, E.cloudD, E.cloudL);
  const ridge = [[-12, 224]];
  for (let x = 0; x <= W + 16; x += 20) ridge.push([x, 212 - hash(Math.floor(x / 20), 2) * 14]);
  ridge.push([W + 12, 292], [-12, 292]);
  poly(ridge, E.mtnF);
  forest(f, 216, 4, E.treeD, E.treeN, 1.7, 0.05);
  dithGrad(0, 220, W, 300, E.treeD, M(0));
  dithGrad(0, 292, W, H, E.treeD, M(0));
  fogPatch(240, 276, 180, 10, E.fog, 0.16, f);
  const drop = cues.hits.paper_drop, land = cues.hits.paper_land;
  const pw = 296, ph = 184;
  let y = -200, x = 320 - pw / 2, h = ph;
  if (t < drop) y = -200;
  else if (t < land) { const k = (t - drop) / (land - drop); y = Math.round(lerp(-192, 84, k * k)); }
  else if (t < land + 0.06) { const k = (t - land) / 0.06; y = Math.round(lerp(88, 96, k)); h = Math.round(lerp(184, 168, k)); }
  else if (t < land + 0.14) { const k = (t - land - 0.06) / 0.08; y = Math.round(lerp(96, 84, k)); h = Math.round(lerp(168, 184, k)); }
  else { y = 84 + (Math.floor(f / 6) % 2 ? 2 : 0); h = 184; }
  if (t >= land) {
    for (let k = 0; k < 3; k++) {
      const age = t - land - k * 0.04;
      if (age < 0 || age > 0.30) continue;
      const rr = 32 + age * 400;
      for (let i = 0; i < 120; i++) { const a = i / 120 * 6.283; px(x + pw / 2 + Math.cos(a) * rr, y + ph + Math.sin(a) * rr * 0.4, k === 0 ? M(8) : E.fog); }
    }
  }
  polyD([[x + 12, y + h], [x + pw - 12, y + h], [x + pw - 28, y + h + 12], [x - 4, y + h + 12]], M(0));
  paper(x, y, pw, h);
  if (t >= land && t < land + 0.36) {
    const k = (t - land) / 0.36;
    for (let i = 0; i < 20; i++) {
      const a = hash(i, 71) * 6.283, rr = 16 + k * 132;
      px(x + pw / 2 + Math.cos(a) * rr, y + h + Math.sin(a) * rr * 0.35 - k * 12, E.fog);
    }
  }
}

// ================================================================== SHOT C：挖掘现场（臂组为多角度帧）
const CLOD = (() => { const r = rng(1123); return Array.from({ length: 48 }, () => ({ vx: 0.5 + r() * 1.5, vy: -1.8 - r() * 1.1, s: 2 + Math.floor(r() * 3), d: r() * 0.07 })); })();
// 铰点盘：盖住大臂/小臂/铲斗的接缝，消掉两块旋转矩形相叠时漏出的三角空洞
// 只比机身亮一档，避免在夜色里变成一个扎眼的白环
function boss(x, y, r, rim = M(2)) {
  const cx = Math.round(x), cy = Math.round(y);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d2 = i * i + j * j;
    if (d2 > r * r + r * 0.7) continue;
    px(cx + i, cy + j, d2 > (r - 0.8) * (r - 0.8) ? rim : M(0));
  }
}
// 液压缸：2 px 粗的杆，前 52% 是缸筒（暗），后段是活塞杆（亮）
function rod(x0, y0, x1, y1, cb = M(2), cp = M(6)) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t);
    const c = t < 0.52 ? cb : cp;
    px(x, y, c); px(x, y + 1, c);
  }
}
function excavator(mx, my, a1, dirt) {
  blit(SPR.track, mx + 2, my + 40);
  blit(SPR.body, mx, my);
  const hx = mx + 72, hy = my + 21;
  // L1/L2 必须等于 sprite 的实际长度（大臂 61 宽锚点 2 → 58；小臂 44 宽锚点 1 → 42），
  // 否则画出来的臂尖会比销轴远一截，铲斗就悬空
  const L1 = 56, L2 = 40;
  // 大臂轴线与法线：n 指向臂的下方，液压缸挂在臂下面才对
  const ux = Math.cos(a1), uy = Math.sin(a1), nx = -uy, ny = ux;
  const e1x = hx + ux * L1, e1y = hy + uy * L1;
  blitRot(SPR.boom, a1, Math.round(hx), Math.round(hy), 2, 8);
  const a2 = a1 + 1.28;
  const e2x = e1x + Math.cos(a2) * L2, e2y = e1y + Math.sin(a2) * L2;
  blitRot(SPR.arm, a2, Math.round(e1x), Math.round(e1y), 1, 6);
  const bx = Math.round(e2x), by = Math.round(e2y);
  // 动臂缸：机身台面前缘 → 大臂 45% 处下缘（轴线到下表缘只有 5 px，偏 7 就会悬空）
  rod(mx + 64, my + 35, hx + ux * L1 * 0.45 + nx * 5, hy + uy * L1 * 0.45 + ny * 5);
  // 斗杆缸：大臂 58% 处上缘（-6）→ 小臂 34% 处
  const s2x = Math.cos(a2), s2y = Math.sin(a2);
  rod(hx + ux * L1 * 0.58 - nx * 6, hy + uy * L1 * 0.58 - ny * 6,
    e1x + s2x * L2 * 0.34, e1y + s2y * L2 * 0.34);
  boss(e1x, e1y, 2);
  boss(bx, by, 2, M(3));
  blit(dirt ? SPR.bucketDirt : SPR.bucket, bx - 10, by - 3);
  return { bx, by };
}
function shotC(t, f) {
  skyBand(0, 68, E.sky1, E.sky2);
  skyBand(68, 192, E.sky2, E.sky3);
  moon(f, 88, 40, 12);
  cloudBand(f, 28, 180, 0.16, E.cloudD, E.cloudL);
  const ridge = [[-12, 192]];
  for (let x = 0; x <= W + 16; x += 20) ridge.push([x, 184 - hash(Math.floor(x / 20), 2) * 12]);
  ridge.push([W + 12, 264], [-12, 264]);
  poly(ridge, E.mtnF);
  forest(f, 192, 4, E.mtnN, E.treeL, 1.2, 0.12);
  // 土壁：五层色带 + 等高线 + 土块
  const face = [[296, H], [316, 264], [340, 216], [372, 180], [416, 156], [472, 146], [530, 152], [582, 172], [616, 196], [640, 210], [640, H]];
  poly(face, E.moundD);
  // 左坡阴影：抖动着压向墨色，做出"被挖开的土壁"而不是沙丘
  for (let y = 140; y < H; y++) for (let x = 296; x < 640; x++) {
    if (get(x, y) !== E.moundD) continue;
    const edge = Math.min(...[0, 0]);
    const sh = clamp(1 - (x - 296) / 150, 0, 1);
    if (bay(x, y) * 0.5 + hash(x >> 1, y >> 1) * 0.5 < sh * 0.85) px(x, y, E.ink);
  }
  // 顶部 5 px 受光边：只亮轮廓，不整面提亮
  for (let x = 252; x < W; x++) {
    for (let y = 108; y < H; y++) {
      if (get(x, y) !== E.moundD) continue;
      const up = get(x, y - 1);
      if (up !== E.moundD) { for (let k = 0; k < 5; k++) if (get(x, y + k) === E.moundD) px(x, y + k, k < 2 ? E.moundM : E.moundD === E.moundD ? (k < 4 ? E.moundM : E.moundD) : E.moundD); }
      break;
    }
  }
  // 层理线：每 34 px 一道压暗，随坡势下移
  for (let j = 0; j < 8; j++) {
    const yy = 150 + j * 34;
    for (let x = 252; x < W; x++) {
      const y2 = yy + Math.round((x - 252) * 0.06);
      if (get(x, y2) === E.moundD || get(x, y2) === E.moundM) { if (bay(x, y2) < 0.8) px(x, y2, E.ink); }
    }
  }
  for (let i = 0; i < 420; i++) {
    const x = 264 + Math.floor(hash(i, 141) * 372), y = 112 + Math.floor(hash(i, 143) * 244);
    const cur = get(x, y);
    if (cur === E.moundD) px(x, y, hash(i, 145) > 0.72 ? E.moundM : E.moundL);
  }
  if (t > cues.hits.lamp_on) {
    lightPoly([[470, 250], [382, 122], [420, 114], [500, 246]], 1, 0.34, 404, 132, 84);
    glowSpot(400, 132, 22 + (Math.floor(f / 2) % 2), 1, 0.30 + 0.10 * Math.sin(f * 1.7));
  }
  // 探槽
  const ck = clamp((t - cues.hits.cut_open[0]) / (cues.hits.cut_open[2] - cues.hits.cut_open[0]), 0, 1);
  if (t > cues.hits.cut_open[0] - 0.04) {
    const open = stepEase(ck, 3), cw = 10 + Math.round(open * 8), cx0 = 404 - (cw >> 1);
    const surf = x => { for (let y = 96; y < H; y++) { const c = get(x, y); if (c === E.moundD || c === E.moundM || c === E.ink) return y; } return H; };
    for (let x = cx0; x < cx0 + cw; x++) {
      const y0 = surf(x) + 2;
      for (let y = y0; y < 252; y++) px(x, y, E.ink);
      const segs = Math.max(1, Math.round(open * 4));
      for (let k = 0; k < segs; k++) px(x, y0 + Math.round((k + 1) * (252 - y0) / segs), E.teal);
    }
    for (let x = cx0 - 1; x <= cx0 + cw; x += cw + 1) {
      const y0 = surf(x) + 2;
      for (let y = y0; y < 252; y++) px(x, y, E.moundM);
    }
    if (open > 0.3) for (let y = 160; y < 252; y += 10) glowSpot(cx0 + (cw >> 1), y, 10, 1, 0.42);
  }
  // 围栏
  cues.hits.fence.forEach((ft, i) => {
    const fx = 256 + i * 34, fy = 284 - i * 10;
    const k = clamp((t - ft) / 0.09, 0, 1);
    if (k <= 0) return;
    const hgt = Math.round(lerp(0, 24, stepEase(k, 3)));
    vline(fx, fy - hgt, hgt, E.moundM);
    vline(fx + 1, fy - hgt, hgt, E.moundM);
    vline(fx + 2, fy - hgt, hgt, E.moundD);
    px(fx, fy - hgt - 1, M(8));
    if (i > 0) {
      const px0 = 256 + (i - 1) * 34, py0 = 284 - (i - 1) * 10;
      for (let s2 = 0; s2 <= 34; s2++) {
        const u = s2 / 34;
        px(px0 + u * 34, py0 - 22 + u * 10 + Math.sin(u * 3.1416) * 5, E.moundM);
      }
    }
  });
  // 挖掘机
  let a1 = -0.62, dirt = 0;
  for (const bt of cues.hits.bucket) {
    if (t >= bt - 0.15 && t < bt) a1 = lerp(-0.62, 0.30, stepEase((t - bt + 0.15) / 0.15, 4));
    else if (t >= bt && t < bt + 0.11) { a1 = 0.30; dirt = 1; }
    else if (t >= bt + 0.11 && t < bt + 0.30) { a1 = lerp(0.30, -0.62, stepEase((t - bt - 0.11) / 0.19, 4)); dirt = t < bt + 0.22 ? 1 : 0; }
  }
  // 怠速抖动：0.012 rad 的微摆，末端位移约 1–2 px，读作发动机震动而不是镜头抖
  a1 += Math.sin(f * 0.92) * 0.012;
  const ee = excavator(48, 232, a1, dirt);
  // 探槽口持续落土
  for (let i = 0; i < 9; i++) {
    const ph = (t * 0.9 + hash(i, 631)) % 1;
    const x = 396 + Math.round(hash(i, 633) * 18);
    const y = 152 + Math.round(ph * 96);
    if (get(x, y) === E.ink) px(x, y, ph < 0.5 ? E.moundM : E.moundD);
  }
  for (const bt of cues.hits.bucket) {
    const age = t - bt - 0.09;
    if (age < 0 || age > 0.58) continue;
    for (let i = 0; i < CLOD.length; i++) {
      const c = CLOD[i], dt = age - c.d;
      if (dt < 0) continue;
      const xx = ee.bx + Math.round(c.vx * 88 * dt);
      const yy = ee.by + Math.round(c.vy * 88 * dt + 600 * dt * dt);
      if (yy > 300 || xx > W) continue;
      rect(xx, yy, c.s, c.s, hash(i, 7) > 0.5 ? E.moundT : E.moundM);
    }
  }
  if (t > cues.hits.lamp_on) {
    vline(500, 252, 52, E.stoneM);
    rect(490, 244, 20, 12, E.stoneM);
    for (let j = 0; j < 6; j++) px(494 + j, 242, j === 2 || j === 3 ? M(8) : E.goldL);
    glowSpot(498, 244, 24, 2, 0.62 + 0.14 * Math.sin(f * 2.3));
  }
  for (let i = 0; i < 24; i++) {
    const ph = (t * 0.3 + hash(i, 91)) % 1;
    px(300 + Math.round(hash(i, 92) * 200), 292 - Math.round(ph * 96), E.fog);
  }
  // 掘削进度条（文字 scale 2）
  const pct = clamp(Math.round((t - 3.12) / 1.85 * 92), 0, 99);
  const ux = 400, uy = 40, uw = 200, uh = 68;
  rect(ux, uy, uw, uh, M(0));
  hline(ux, uy, uw, E.teal); hline(ux, uy + uh - 1, uw, E.teal);
  vline(ux, uy, uh, E.teal); vline(ux + uw - 1, uy, uh, E.teal);
  text('掘削', ux + 10, uy + 8, M(8), 2);
  const ps = pct + '%';
  text(ps, ux + uw - 10 - textW(ps) * 2, uy + 8, E.goldL, 2);
  const segsN = 12, filled = Math.round(pct / 100 * segsN);
  for (let i = 0; i < segsN; i++) rect(ux + 10 + i * 15, uy + 40, 11, 16, i < filled ? E.goldM : E.stoneD);
}

// ================================================================== SHOT D：坟前人群（6 帧姿态表）
function shotD(t, f) {
  skyBand(0, 100, E.sky1, E.sky2);
  skyBand(100, 192, E.sky2, E.sky3);
  moon(f, 524, 52, 16);
  cloudBand(f, 60, 192, 0.12, E.cloudD, E.cloudL);
  const ridge = [[-12, 192]];
  for (let x = 0; x <= W + 16; x += 20) ridge.push([x, 184 - hash(Math.floor(x / 20), 2) * 12]);
  ridge.push([W + 12, 268], [-12, 268]);
  poly(ridge, E.mtnF);
  poly([[140, 264], [172, 224], [208, 196], [252, 180], [316, 176], [380, 180], [424, 196], [460, 224], [492, 264]], E.moundD);
  poly([[172, 264], [200, 228], [236, 204], [280, 192], [352, 192], [396, 204], [432, 228], [456, 264]], E.moundM);
  for (let x = 200; x < 432; x++) if (bay(x, 216) < 0.55) px(x, 216, E.moundD);
  dithGrad(0, 240, W, 300, E.treeD, M(0));
  for (const [lx, dir] of [[52, 1], [596, -1]]) {
    // 光柱：抖动填充的锥体（靠近光源密、末端散），再叠一层亮度
    for (let y = 100; y < 302; y++) {
      const t = (y - 100) / 202;
      const cx = lx + dir * (10 + t * 128);
      const w = 8 + t * 26;
      for (let dx = -w; dx <= w; dx++) {
        const fall = 1 - Math.abs(dx) / w;
        const dens = (1 - t) * 0.55 + 0.10;
        if (bay(cx + dx, y) * 0.55 + hash(cx + dx, y) * 0.45 < fall * dens) px(cx + dx, y, t < 0.45 ? E.fog : E.sky2);
      }
    }
    lightPoly([[lx, 300], [lx + dir * 116, 96], [lx + dir * 152, 104], [lx + dir * 48, 300]], 1, 0.30, lx + dir * 128, 132, 192);
    glowSpot(lx + dir * 116, 104, 22, 1, 0.5);
    px(lx, 96, M(8)); px(lx + dir, 96, E.goldL);
  }
  const step = Math.floor(f / 4);
  const armUp = cues.hits.flash_crowd.some(ft => t >= ft - 0.12 && t < ft + 0.24);
  const POSES = [0, 1, 2, 3, 4, 5];
  for (let i = 0; i < 13; i++) {
    const bx = 6 + i * 48 + ((i * 7) % 8);
    const by = 236 + ((i * 5) % 14) - (step % 2 === 0 ? 0 : 2);
    let fr = POSES[(i + Math.floor(step / 3)) % 6];
    if (armUp) fr = i % 3 === 0 ? 2 : 3;
    blit(SPR.person[fr], bx, by, 2);
    if (i % 4 === 1) { rect(bx + 20, by - 18, 14, 18, M(0)); px(bx + 26, by - 24, E.light); }
  }
  cues.hits.flash_crowd.forEach((ft, k) => {
    const age = t - ft;
    if (age < 0 || age > 0.12) return;
    const fx = 44 + ((k * 53) % 540), fy = 232 + (k % 3) * 10;
    disc(fx, fy, 4, M(8));
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * 6.283 + 0.4;
      px(fx + Math.cos(a) * 10, fy + Math.sin(a) * 10, E.light);
      px(fx + Math.cos(a) * 14, fy + Math.sin(a) * 14, E.goldL);
    }
    glowSpot(fx, fy, 18, 1, 0.5);
  });
  cues.hits.bubble.forEach((bt, k) => {
    const age = t - bt;
    if (age < 0) return;
    const bx = 80 + k * 176, by = 208 - Math.round(stepEase(clamp(age / 0.12, 0, 1), 2) * 14);
    rect(bx, by, 22, 22, M(0));
    rect(bx + 2, by + 2, 18, 18, M(28));
    text('!', bx + 7, by - 1, E.redM, 2);
    px(bx + 8, by + 22, M(0)); px(bx + 10, by + 25, M(0));
  });
  GX += (Math.floor(f / 5) % 2 ? 1 : -1);
}

// ================================================================== SHOT E：地宫石门滑开
const WALL = new Uint8Array(W * H);
{
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const row = (y / 18) | 0, off = row % 2 ? 26 : 0;
    const mortar = (y % 18 === 0) || ((x + off) % 52 === 0);
    let c = E.stoneD;
    if (mortar) c = E.ink;
    else if (hash(x >> 2, y >> 2) > 0.88) c = E.stoneM;
    else if (hash(x >> 3, y >> 3) > 0.72) c = E.stoneD;
    if (!mortar && hash(x, y) > 0.985) c = E.stoneM;
    WALL[y * W + x] = c;
  }
  for (let y = 0; y < 44; y++) for (let x = 0; x < W; x++) if (bay(x, y) < 0.35 + y / 88) WALL[y * W + x] = E.ink;
  for (let y = 264; y < H; y++) for (let x = 0; x < W; x++) WALL[y * W + x] = (y === 264 || x % 48 === 0) ? E.ink : E.stoneD;
}
function chamber() { IB.set(WALL); }
function doorLeaf(x0, y0, w, h, side) {
  rect(x0, y0, w, h, E.stoneD);
  tile(SPR.stone, x0 + 6, y0 + 6, w - 12, h - 12, side ? 9 : 0);
  // 内框：上/左受光，下/右背光
  vline(x0 + 5, y0 + 6, h - 12, E.ink); hline(x0 + 6, y0 + 5, w - 12, E.ink);
  vline(x0 + w - 6, y0 + 6, h - 12, E.stoneM); hline(x0 + 6, y0 + h - 6, w - 12, E.stoneM);
  // 中缝边加一道 1 px 高光，比原来 3 px 更细
  vline(side ? x0 + w - 1 : x0, y0 + 2, h - 4, side ? E.stoneD : E.stoneM);
  // 上下两块横带（石室外框的枋）
  for (const [yy, hh] of [[y0 + 14, 10], [y0 + h - 34, 10]]) {
    rect(x0 + 8, yy, w - 16, hh, E.stoneM);
    hline(x0 + 8, yy, w - 16, E.stoneL);
    hline(x0 + 8, yy + hh - 1, w - 16, E.ink);
  }
  // 铜铺首 + 门钉
  blit(SPR.ring, side ? x0 + w - 34 : x0 + 14, y0 + Math.round(h * 0.42));
  for (const [dx, dy] of [[14, 30], [w - 20, 30], [14, h - 30], [w - 20, h - 30]]) {
    rect(x0 + dx, y0 + dy, 5, 5, E.stoneL); px(x0 + dx + 1, y0 + dy + 1, M(28)); px(x0 + dx + 3, y0 + dy + 3, E.stoneD);
  }
}
function shotE(t, f) {
  chamber();
  const dx = 232, dw = 176, dy = 100, dh = 176, half = dw / 2, cxm = dx + half;
  // 门框：两柱一枋
  rect(dx - 24, dy - 24, 24, dh + 24, E.stoneD);
  rect(dx + dw, dy - 24, 24, dh + 24, E.stoneD);
  rect(dx - 24, dy - 24, dw + 48, 16, E.stoneD);
  hline(dx - 24, dy - 11, dw + 48, E.stoneL);
  vline(dx - 24, dy - 24, dh + 24, E.stoneM);
  vline(dx + dw + 23, dy - 24, dh + 24, E.stoneM);
  tile(SPR.stone, dx - 23, dy - 8, 22, dh + 8, 3);
  tile(SPR.stone, dx + dw + 1, dy - 8, 22, dh + 8, 7);
  for (let x = dx - 24; x < dx + dw + 24; x += 12) px(x, dy - 12, E.ink);
  rect(dx, dy, dw, dh, E.ink);
  const k = clamp((t - cues.hits.torch_ignite - 0.04) / 0.95, 0, 1);
  const open = Math.round(stepEase(k, 5) * 52);
  if (open > 1) {
    for (let x = cxm - open; x <= cxm + open; x++) {
      const rel = Math.abs(x - cxm) / Math.max(1, open);
      for (let y = dy; y < dy + dh; y++) {
        const vy = (y - dy) / dh;
        px(x, y, rel < 0.42 ? (vy < 0.62 ? M(8) : E.goldL) : rel < 0.78 ? E.goldM : E.goldD);
      }
    }
    vline(cxm - open - 1, dy, dh, E.ink);
    vline(cxm + open + 1, dy, dh, E.ink);
    glowSpot(cxm, dy + 92, 68, 1, 0.30);
  }
  for (const sd of [-1, 1]) {
    const inner = cxm + sd * open;
    const outer = sd < 0 ? dx : dx + dw;
    const x0 = Math.min(inner, outer), w0 = Math.max(0, Math.abs(outer - inner));
    if (w0 > 0) doorLeaf(x0, dy, w0, dh, sd > 0);
  }
  hline(dx - 24, dy + dh, dw + 48, E.ink);
  // 门柱火把
  for (const [lx, ph] of [[dx - 36, 0], [dx + dw + 12, 2]]) {
    vline(lx, 208, 40, E.moundD);
    vline(lx + 1, 208, 40, E.moundM);
    rect(lx - 2, 208, 8, 6, E.moundM);
    const kk = (Math.floor(f / 3) + ph) % 3;
    disc(lx + 2, 200, 4, E.goldM);
    disc(lx + 2, 198, 2, E.goldL);
    px(lx + 2, 192 - (kk === 1 ? 2 : 0), E.goldL);
    if (kk === 2) px(lx + 6, 196, E.redM);
    glowSpot(lx + 2, 200, 44, 1, 0.38);
  }
  // 门内背影（呼吸起伏两帧，属微动作）
  const fx = cxm - 16, fy = 284;
  const bob = (Math.floor(f / 15) % 2) ? 0 : 1;
  blit(SPR.person[5], fx, fy - 56 + bob, 2);
  for (let j = 0; j < 20; j++) px(fx + 18, fy - 38 + bob + j, E.moundT);
  arc(fx + 16, fy - 42 + bob, 6, -2.6, -0.5, E.goldL);
  for (let i = 0; i < 28; i++) {
    const ph2 = (t * 0.18 + hash(i, 511)) % 1;
    px(Math.round(cxm - 56 + hash(i, 513) * 112 + Math.sin(t * 0.8 + i) * 8), Math.round(264 - ph2 * 156), E.goldL);
  }
  for (const [x, y, w, h] of [[16, 16, 44, 2], [16, 16, 2, 18], [580, 16, 44, 2], [622, 16, 2, 18]]) rect(x, y, w, h, E.teal);
  text('内部 A 区', 76, 12, E.teal, 2);
}

// ================================================================== SHOT F：开启棺盖
// 刳抜式石棺：整块石料凿成，表面平滑 + 凿痕斑点，靠倒角与底影出体积
function monolith(x, y, w, h) {
  rect(x, y, w, h, E.stoneM);
  // 凿痕：稀疏 2×2 斑块，密度低到不形成"木纹"
  for (let i = 0; i < (w * h) / 90; i++) {
    const bx = x + 4 + Math.floor(hash(i, 811) * (w - 8));
    const by = y + 4 + Math.floor(hash(i, 813) * (h - 8));
    const c = hash(i, 815) > 0.55 ? E.stoneL : E.stoneD;
    rect(bx, by, 2, 1, c);
  }
  // 竖向凿道（三道），打断横向连续感
  for (const u of [0.22, 0.55, 0.83]) {
    const vx = Math.round(x + w * u);
    for (let j = 6; j < h - 8; j += 3) if (bay(vx, y + j) < 0.6) px(vx, y + j, E.stoneD);
  }
  // 倒角：上沿受光、下沿压黑、两端窄倒角
  rect(x, y, w, 3, E.stoneL);
  rect(x + 1, y + 3, w - 2, 2, E.stoneD);
  rect(x, y + h - 5, w, 5, E.ink);
  rect(x, y + h - 7, w, 2, E.stoneD);
  vline(x, y, h, E.ink); vline(x + w - 1, y, h, E.ink);
  vline(x + 1, y + 3, h - 8, E.stoneD); vline(x + w - 2, y + 3, h - 8, E.stoneD);
}
function sarcophagus(x, y, w, h, open) {
  monolith(x + 6, y + 22, w - 12, h - 22);
  // 左端面
  monolith(x - 10, y + 10, 18, h - 18);
  blit(SPR.sarcoEnd, x - 32, y + 12);
  // 绳挂突起
  blit(SPR.boss, x + 54, y + 34);
  blit(SPR.boss, x + w - 68, y + 34);
  // 盖：整像素右移（位置变化，不改形态）
  const lidX = x - 8 + open, lidW = w + 16;
  if (lidX < x + w - 10) {
    monolith(lidX, y - 8, lidW, 26);
    rect(lidX + 2, y - 6, lidW - 4, 2, M(28));   // 盖面高光棱
    blit(SPR.lidEnd, lidX - 2, y - 8);
  }
}
function shotF(t, f) {
  chamber();
  const sx = 176, sy = 190, sw = 292, sh = 104;
  const openK = clamp((t - cues.hits.lid[0]) / (cues.hits.lid[2] - cues.hits.lid[0] + 0.10), 0, 1);
  const gap = Math.round(stepEase(openK, 3) * 192);
  polyD([[168, 292], [512, 292], [498, 306], [182, 306]], M(0));
  if (gap > 0) {
    const gx = sx + 8, gy = sy + 8;
    const cxm = gx + Math.round(gap * 0.42);
    for (let y = 0; y < gy; y++) {
      const t2 = (gy - y) / gy;
      const w = Math.round(lerp(8, 38, t2 * t2 * 0.6 + t2 * 0.4));
      for (let x = cxm - w; x <= cxm + w; x++) {
        const rel = Math.abs(x - cxm) / Math.max(1, w);
        px(x, y, rel < 0.30 ? M(8) : rel < 0.55 ? E.goldL : rel < 0.80 ? E.goldM : E.goldD);
      }
      px(cxm - w - 1, y, E.ink); px(cxm + w + 1, y, E.ink);
    }
    // 缝口溢光：四层递减的金色，不用纯白灯管
    for (let x = gx; x < gx + gap; x++) {
      const t = Math.abs(x - cxm) / Math.max(1, gap);
      px(x, sy + 6, E.ink);
      for (let j = 0; j < 20; j++) {
        const f2 = 1 - j / 20;
        if (bay(x, sy + 8 + j) < f2 * (1 - t * 0.55)) px(x, sy + 8 + j, j < 4 ? M(8) : j < 9 ? E.goldL : j < 14 ? E.goldM : E.goldD);
      }
      px(x, sy + 30, E.goldM);
    }
    const rise = Math.round(stepEase(clamp((t - cues.hits.lid[1]) / 0.36, 0, 1), 4) * 44);
    if (gap > 52) {
      // 甲胄：按 sprite 自身明暗绘制，再加 1 px 金边把它从光柱里剥出来
      const ax = cxm - 20, ay = sy - 56 - rise;
      blit(SPR.armor, ax, ay, 2);
      for (let j = 0; j < SPR.armor.h * 2; j++) for (let i = 0; i < SPR.armor.w * 2; i++) {
        if (SPR.armor.d[((j / 2) | 0) * SPR.armor.w + ((i / 2) | 0)]) continue;
        const n = (SPR.armor.d[((j / 2) | 0) * SPR.armor.w + (((i / 2) | 0) - 1)] || SPR.armor.d[((j / 2) | 0) * SPR.armor.w + (((i / 2) | 0) + 1)]
          || SPR.armor.d[((((j / 2) | 0) - 1) * SPR.armor.w + ((i / 2) | 0))] || SPR.armor.d[((((j / 2) | 0) + 1) * SPR.armor.w + ((i / 2) | 0))]);
        if (n && ((i + j) & 1) === 0) px(ax + i, ay + j, E.goldL);
      }
    }
    if (t > cues.hits.mirror) {
      const age = Math.min(0.4, t - cues.hits.mirror);
      const my = sy + 10 - rise;
      const rr = 6 + stepEase(age / 0.4, 3) * 16;
      px(cxm - rr, my, M(8)); px(cxm + rr, my, M(8)); px(cxm, my - rr, M(8)); px(cxm, my + rr, M(8));
      ring(cxm, my, Math.max(4, rr - 6), E.goldL, 0.5);
      disc(cxm, my, 2, M(8));
    }
  }
  sarcophagus(sx, sy, sw, sh, gap);
  for (const lt of cues.hits.lid) {
    const age = t - lt;
    if (age < 0 || age > 0.24) continue;
    for (let i = 0; i < 14; i++) {
      const a = hash(i, 301) * 6.283, rr = 6 + age * 140 * hash(i, 303);
      px(sx + 8 + gap + Math.cos(a) * rr, sy - 4 + Math.sin(a) * rr * 0.5, hash(i, 305) > 0.5 ? M(8) : E.goldL);
    }
  }
  const k = Math.floor(f / 3) % 3;
  vline(52, 272, 32, E.moundM); rect(48, 260, 10, 6, E.moundM);
  disc(52, 256, 4, E.goldM); disc(52, 254 - (k === 1 ? 2 : 0), 2, E.goldL);
  glowSpot(52, 256, 60, 1, 0.45);
  const ba = t - cues.hits.burst;
  if (ba >= 0 && ba < 0.20) {
    if (ba < 0.034) { for (let i = 0; i < W * H; i++) IB[i] = M(8); }
    else if (ba < 0.067) { for (let i = 0; i < W * H; i++) IB[i] = E.goldL; }
    else {
      for (let i = 0; i < W * H; i++) if (bay(i % W, (i / W) | 0) < 0.45) IB[i] = M(8);
      for (let kk = 0; kk < 3; kk++) ring(sx + 8 + gap * 0.42, sy - 10, 52 + kk * 40 + ba * 480, E.goldL);
    }
  }
  const ia = t - cues.hits.qmark;
  if (ia >= 0) {
    const slide = stepEase(clamp(ia / 0.14, 0, 1), 3);
    const bw = 264, bh = 80;
    const bx = Math.round(lerp(W + 8, W - bw - 16, slide)), by = 44;
    const blink = (Math.floor(f / 4) % 2) === 0;
    rect(bx, by, bw, bh, M(0));
    rect(bx + 4, by + 4, bw - 8, bh - 8, M(0));
    hline(bx + 4, by + 4, bw - 8, blink ? E.goldL : M(8));
    hline(bx + 4, by + bh - 5, bw - 8, blink ? E.goldL : M(8));
    vline(bx + 4, by + 4, bh - 8, blink ? E.goldL : M(8));
    vline(bx + bw - 5, by + 4, bh - 8, blink ? E.goldL : M(8));
    for (const [cx, cy] of [[bx + 2, by + 2], [bx + bw - 6, by + 2], [bx + 2, by + bh - 6], [bx + bw - 6, by + bh - 6]]) rect(cx, cy, 4, 4, M(0));
    text('获得', bx + 16, by + 12, E.goldL, 2);
    text('鎏金铜甲胄', bx + 16, by + 40, M(8), 2);
    blit(SPR.armor, bx + bw - 68, by + 14, 2);
    if (blink) { px(bx + bw - 52, by + 14, M(8)); px(bx + 16, by + 66, E.goldL); }
  }
  for (let i = 0; i < 20; i++) {
    const ph = (t * 0.2 + hash(i, 411)) % 1;
    px(Math.round(120 + hash(i, 413) * 400 + Math.sin(t + i) * 4), Math.round(304 - ph * 200), hash(i, 415) > 0.6 ? E.goldL : M(8));
  }
}


// ---------------------------------------------------------------- Persian Gulf Eden 10 s hook — native 640×360 pixel art
// 分镜：出土现场 → 教皇式衣冠 → 鱼皮披风 → 四千年前苏美尔 → 神庙诸神 → 波斯湾星图 → 半人半鱼出水
// 只用色板 ramp 打光；所有造型逐像素画在 640×360 原生栅格上。
const BAY_FLAME = [S.FLAME_F0, S.FLAME_F1, S.FLAME_F2, S.FLAME_F3]
  .map((rows, i) => buildSpr('BAY_FLAME_F' + i, rows, MAP_PAL, 0));

function ppoly(x, y, pts, c) { poly(pts.map(([a, b]) => [x + a, y + b]), c); }
function pline(x, y, pts, c, closed = false) {
  const p = pts.map(([a, b]) => [x + a, y + b]);
  polyLine(p, c, closed);
}
function textSC(str, cx, y, c, sc = 1, sh = M(0)) {
  const o = Math.max(1, Math.round(sc * 0.66));
  textC(str, cx + o, y + o, sh, sc);
  textC(str, cx, y, c, sc);
}
function dither(cx, cy, rx, ry, c, amt) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++)
    if ((i / rx) ** 2 + (j / ry) ** 2 <= 1 && bay(cx + i, cy + j) < amt) px(cx + i, cy + j, c);
}
function dotsFlecks(x, y, w, h, c, amt, seed = 0) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    if (hash(x + i + seed * 977, y + j - seed * 131) < amt) px(x + i, y + j, c);
}
function thickLine(x0, y0, x1, y1, w, c) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let k = -w; k <= w; k++) line(x0 + nx * k, y0 + ny * k, x1 + nx * k, y1 + ny * k, c);
}
function dottedLine(x0, y0, x1, y1, c, gap = 2) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  for (let s = 0; s <= len; s += gap) px(Math.round(x0 + dx * s / len), Math.round(y0 + dy * s / len), c);
}
function polyPath(pts, c, closed = false, from = 0, to = 1) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < (closed ? pts.length : pts.length - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, acc: total }); total += len;
  }
  const s0 = clamp(from, 0, 1) * total, s1 = clamp(to, 0, 1) * total;
  for (const s of segs) {
    if (s.acc > s1) break;
    if (s.acc + s.len < s0) continue;
    const f0 = Math.max(0, (s0 - s.acc) / s.len), f1 = Math.min(1, (s1 - s.acc) / s.len);
    line(s.a[0] + (s.b[0] - s.a[0]) * f0, s.a[1] + (s.b[1] - s.a[1]) * f0,
      s.a[0] + (s.b[0] - s.a[0]) * f1, s.a[1] + (s.b[1] - s.a[1]) * f1, c);
  }
}
function pathAt(pts, s) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, acc: total }); total += len;
  }
  const d = clamp(s, 0, 1) * total;
  for (const g of segs) {
    if (d > g.acc + g.len) continue;
    const f = (d - g.acc) / g.len;
    return [g.a[0] + (g.b[0] - g.a[0]) * f, g.a[1] + (g.b[1] - g.a[1]) * f];
  }
  return pts[pts.length - 1];
}
function qPoint(p0, p1, p2, u) {
  const v = 1 - u;
  return [v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]];
}
function dustMotes(t, n, seed, x0, x1, y0, y1, c = M(6)) {
  for (let i = 0; i < n; i++) {
    const sp = 2.2 + hash(i, seed) * 4.0;
    const x = x0 + ((hash(i, seed + 1) * (x1 - x0) + t * sp) % (x1 - x0));
    const y = y0 + ((hash(i, seed + 2) * (y1 - y0) + t * sp * 0.3 + Math.sin(t * 0.9 + i) * 5) % (y1 - y0));
    px(Math.round(x), Math.round(y), hash(i, seed + 3) < 0.28 ? M(15) : c);
  }
}
function sparks(x, y, n, t, seed, col = M(15)) {
  for (let i = 0; i < n; i++) {
    const sp = 14 + hash(i, seed) * 26;
    const ph = hash(i, seed + 1) * 2 - 1;
    const yy = y - ((t * sp + hash(i, seed + 2) * 60) % 64);
    const xx = x + ph * 10 + Math.sin(t * 2 + i) * 3;
    if (yy > y - 60) px(Math.round(xx), Math.round(yy), i % 3 ? col : M(16));
  }
}
function fire(x, y, t, sc = 1, seed = 0) {
  const fl = BAY_FLAME[Math.floor(t * 15 + seed * 3) % 4];
  blit(fl, Math.round(x - 4 * sc), Math.round(y), sc);
  glowSpot(Math.round(x), Math.round(y + 6 * sc), 34 * sc, 1, 0.55);
  glowSpot(Math.round(x), Math.round(y + 5 * sc), 14 * sc, 1, 0.85);
}
function labelBlock(zh, en, x, y, sc = 2, col = M(15)) {
  const w1 = textW(zh) * sc, w2 = textW(en);
  textSC(zh, x + w1 / 2, y, col, sc);
  const ly = y + 12 * sc + 2;
  hline(x, ly, Math.max(w1, w2), M(18));
  text(en, x, ly + 4, M(26), 1);
}

// ---------------------------------------------------------------- 场景零件
// 出土石像：束腰长袍 + 三层高冠，四分之三受光（太阳在左）
function relic(x, gy, s, lean, opt = {}) {
  const q = Math.round;
  const xT = q(x + lean);
  const shY = q(gy - 60 * s);
  const hem = q(gy);
  // 袍身
  poly([[xT - q(11 * s), shY], [xT + q(11 * s), shY], [x + q(15 * s), hem], [x - q(15 * s), hem]], M(14));
  // 左侧受光面
  poly([[xT - q(11 * s), shY], [xT - q(4 * s), shY], [x + q(2 * s), hem], [x - q(15 * s), hem]], M(28));
  // 右侧背光面
  poly([[xT + q(5 * s), shY], [xT + q(11 * s), shY], [x + q(15 * s), hem], [x + q(7 * s), hem]], M(11));
  // 衣褶
  line(xT - q(5 * s), shY + q(6 * s), x - q(8 * s), hem - q(2 * s), M(27));
  line(xT + q(4 * s), shY + q(6 * s), x + q(8 * s), hem - q(2 * s), M(10));
  hline(x - q(15 * s), hem - 1, q(30 * s), M(12));
  for (let i = -q(14 * s); i <= q(14 * s); i += Math.max(2, q(4 * s))) px(x + i, hem - 2, M(13));
  // 肩披
  poly([[xT - q(13 * s), shY + q(2 * s)], [xT + q(13 * s), shY + q(2 * s)], [xT + q(9 * s), shY - q(5 * s)], [xT - q(9 * s), shY - q(5 * s)]], M(13));
  hline(xT - q(13 * s), shY + q(2 * s), q(26 * s), M(12));
  hline(xT - q(12 * s), shY + q(1 * s), q(24 * s), M(14));
  // 头
  rect(xT - q(6 * s), shY - q(17 * s), q(12 * s), q(13 * s), M(28));
  // 三层高冠
  rect(xT - q(8 * s), shY - q(23 * s), q(16 * s), q(6 * s), M(28));
  rect(xT - q(6 * s), shY - q(28 * s), q(12 * s), q(5 * s), M(27));
  rect(xT - q(4 * s), shY - q(32 * s), q(8 * s), q(4 * s), M(28));
  hline(xT - q(8 * s), shY - q(18 * s), q(16 * s), M(15));
  hline(xT - q(6 * s), shY - q(24 * s), q(12 * s), M(15));
  disc(xT, shY - q(34 * s), Math.max(1, q(2 * s)), M(15));
  // 受光边
  vline(xT - q(8 * s), shY - q(23 * s), q(6 * s), M(8));
  vline(xT - q(6 * s), shY - q(17 * s), q(12 * s), M(8));
  vline(xT - q(13 * s), shY - q(5 * s), q(7 * s), M(8));
  // 面部
  if (opt.face) {
    px(xT - Math.max(1, q(3 * s)), shY - q(13 * s), M(10));
    px(xT + Math.max(1, q(2 * s)), shY - q(13 * s), M(10));
    hline(xT - q(2 * s), shY - q(19 * s), q(5 * s), M(27));
  }
  hline(xT - q(6 * s), shY - q(15 * s), q(12 * s), M(27));
}
// 倒卧的柱鼓
function drum(x, y, w, r) {
  rect(x, y - r, w, r * 2 + 1, M(13));
  disc(x, y, r, M(14)); disc(x + w, y, r, M(12));
  for (let i = 1; i < 6; i++) vline(x + Math.round(i * w / 6), y - r + 2, r * 2 - 3, M(12));
  disc(x, y, Math.max(1, r - 3), M(13));
}
// 棕榈
function palm(x, gy, h, t, seed) {
  const bend = (hash(seed, 2) - 0.5) * 12;
  for (let j = 0; j < h; j++) {
    const u = j / h;
    const xx = Math.round(x + bend * u * u);
    px(xx, gy - j, M(10)); px(xx + 1, gy - j, M(12));
    if (j % 5 === 0) px(xx + 2, gy - j, M(11));
  }
  const topX = Math.round(x + bend), topY = gy - h;
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI + Math.sin(t * 1.2 + i + seed) * 0.05;
    const lx = topX + Math.cos(a) * 28, ly = topY + 6 + Math.sin(a) * 9 + 14;
    const qx = topX + Math.cos(a) * 15, qy = topY - 5 + Math.sin(a) * 5;
    for (let u = 0; u <= 1.001; u += 0.1) {
      const [px0, py0] = qPoint([topX, topY], [qx, qy], [lx, ly], u);
      px(Math.round(px0), Math.round(py0), u < 0.5 ? M(22) : M(21));
    }
  }
  disc(topX, topY, 3, M(23));
  px(topX - 2, topY + 4, M(15)); px(topX + 2, topY + 5, M(15));
}
// 神庙柱：柱头涡卷 + 彩带
function column(x, w, y0, y1, dim = 0) {
  const base = dim ? M(10) : M(12);
  rect(x, y0, w, y1 - y0, base);
  for (let i = 2; i < w - 2; i += 4) vline(x + i, y0 + 6, y1 - y0 - 12, dim ? M(11) : M(13));
  vline(x + w - 3, y0 + 6, y1 - y0 - 12, M(9));
  rect(x - 4, y0, w + 8, 7, dim ? M(11) : M(13));
  hline(x - 4, y0, w + 8, M(14));
  disc(x - 1, y0 + 8, 4, dim ? M(11) : M(13)); disc(x + w, y0 + 8, 4, dim ? M(11) : M(13));
  px(x - 1, y0 + 8, M(9)); px(x + w, y0 + 8, M(9));
  rect(x - 3, y0 + 16, w + 6, 5, M(18));
  rect(x - 3, y0 + 21, w + 6, 3, dim ? M(20) : M(21));
  rect(x - 4, y1 - 9, w + 8, 9, dim ? M(11) : M(13));
  hline(x - 4, y1 - 9, w + 8, M(14));
}
// 跪拜者（背向）
function worshipper(x, gy, s, t, seed) {
  const q = Math.round;
  const bow = Math.sin(t * 2.2 + seed * 1.7) * 1.2 + 1.2;
  const top = q(gy - 42 * s);
  poly([[x - q(13 * s), gy], [x - q(10 * s), gy - q(28 * s)], [x - q(5 * s), top + bow],
    [x + q(5 * s), top + bow], [x + q(10 * s), gy - q(28 * s)], [x + q(13 * s), gy]], M(1));
  poly([[x - q(9 * s), gy], [x - q(7 * s), gy - q(24 * s)], [x + q(7 * s), gy - q(24 * s)], [x + q(9 * s), gy]], M(2));
  disc(x, top - q(6 * s) + bow, Math.max(2, q(6 * s)), M(1));
  // 火盆一侧的轮廓光
  vline(x + q(10 * s), gy - q(27 * s), q(24 * s), M(12));
  arc(x, top - q(6 * s) + bow, Math.max(2, q(6 * s)), -1.3, 1.1, M(13));
  disc(x, top - q(11 * s) + bow, Math.max(1, q(3 * s)), M(0));
}
// 香火
function incense(x, y, t, seed) {
  for (let k = 0; k < 8; k++) {
    const u = (t * 0.42 + k / 8 + seed * 0.31) % 1;
    const yy = y - u * 128;
    const xx = x + Math.sin(u * 6 + t * 1.2 + seed * 3) * (3 + u * 11);
    if (u > 0.04) px(Math.round(xx), Math.round(yy), u > 0.72 ? M(0) : M(26));
    if (bay(Math.round(xx), Math.round(yy)) < 0.4) px(Math.round(xx) + 1, Math.round(yy), M(9));
  }
}

// ================================================================== SHOT A — 出土现场
function bayShotA(t, f) {
  const jx = Math.round(Math.sin(t * 12.0) * 0.9), jy = Math.round(Math.cos(t * 9.0) * 0.7);
  GX += jx; GY += jy;
  const pan = Math.round(2 - t * 1.6);
  GX += pan;
  // 黄昏天空：三层渐变 + 低太阳
  skyBand(-8, 92, E.sky0, E.sky1);
  skyBand(92, 172, E.sky1, E.sky2);
  skyBand(172, 232, E.sky2, E.sky3);
  stars(f);
  cloudBand(f, 66, 176, 0.06, E.cloudD, E.sky2);
  // 落日
  disc(506, 198, 17, M(14));
  disc(506, 198, 12, M(15));
  glowSpot(506, 198, 56, 1, 0.30 + Math.sin(t * 2.4) * 0.04);
  // 远丘
  poly([[-12, 240], [70, 224], [160, 232], [250, 214], [340, 226], [430, 210], [520, 222], [610, 212], [652, 218], [652, 274], [-12, 274]], E.moundD);
  poly([[-12, 252], [90, 244], [190, 250], [300, 240], [420, 248], [540, 240], [652, 246], [652, 284], [-12, 284]], E.moundM);
  // 发掘坑
  rect(-10, 258, 660, 50, M(12));
  dithGrad(-10, 258, 660, 305, M(12), M(10));
  const pit = [[176, 268], [214, 258], [438, 256], [498, 270], [488, 302], [188, 302]];
  poly(pit, M(10));
  // 坑壁地层
  polyLine(pit, M(11), true);
  for (let i = 0; i < 5; i++) {
    const y = 274 + i * 6;
    for (let x = 190; x < 486; x += 2) if (hash(x, y) < 0.35) px(x, y, i % 2 ? M(11) : M(9));
  }
  // 后排水土像
  relic(240, 276, 0.76, 1, {});
  relic(300, 274, 0.82, -1, {});
  relic(360, 276, 0.78, 2, {});
  // 倒卧柱鼓 + 残件
  drum(414, 284, 46, 7);
  rect(470, 278, 20, 6, M(13)); hline(470, 278, 20, M(14));
  // 坑内砂土半埋（后排像刚从土里露出来）
  for (const [cx, cy] of [[240, 276], [300, 274], [360, 276]]) {
    poly([[cx - 26, cy + 8], [cx - 18, cy - 10], [cx - 4, cy - 16], [cx + 12, cy - 12], [cx + 26, cy + 8]], M(12));
    poly([[cx - 26, cy + 8], [cx - 18, cy - 10], [cx - 2, cy - 13], [cx - 10, cy + 8]], M(13));
    dotsFlecks(cx - 24, cy - 12, 48, 18, M(11), 0.22, 2);
    dotsFlecks(cx - 20, cy - 8, 40, 8, M(14), 0.15, 5);
  }
  // 前排两尊，更近更大
  relic(206, 305, 0.96, 2, { face: 1 });
  relic(478, 306, 1.0, -2, { face: 1 });
  // 探测拉线：两根木桩 + 三道垂线
  for (const px0 of [172, 508]) {
    vline(px0, 232, 68, M(10)); vline(px0 + 1, 232, 68, M(12));
    px(px0, 230, M(14)); px(px0 + 1, 230, M(14));
  }
  for (let k = 0; k < 3; k++) {
    const y0 = 240 + k * 14;
    const sag = 4 + Math.sin(t * 2 + k) * 1.2;
    for (let x = 173; x < 508; x += 1) {
      const u = (x - 173) / 335;
      const y = Math.round(y0 + Math.sin(u * Math.PI) * sag);
      if ((x + k) % 3 === 0) px(x, y, M(14));
    }
  }
  // 小工具：桶 + 毛刷
  rect(548, 284, 14, 11, M(10)); hline(548, 284, 14, M(12));
  arc(555, 284, 7, Math.PI, 2 * Math.PI, M(9));
  line(566, 292, 578, 282, M(10)); rect(577, 279, 4, 5, M(12));
  // 标题
  {
    const k = clamp((t - 0.10) / 0.18, 0, 1);
    const jit = t < 0.40 ? Math.round(Math.sin(t * 80) * (0.40 - t) * 6) : 0;
    textSC('考古现场', 320 + jit, 14 + Math.round((1 - k) * 8), M(15), 3);
    hline(248, 56, 144, M(18));
    hline(248, 57, 144, M(17));
    text('EXCAVATION', 320 - textW('EXCAVATION') / 2, 62, M(26), 1);
  }
  dustMotes(t, 22, 7, 40, 600, 90, 296, M(14));
  // 太阳附近的飞尘发亮
  glowSpot(506, 226, 34, 1, 0.10);
  GX -= jx; GY -= jy;
  GX -= pan;
}

// ================================================================== SHOT B — 教皇一样的衣服（石像近景）
function drawBust(t) {
  // 背景：暗色砖墙
  rect(-10, 0, 660, 304, M(9));
  for (let y = 30; y < 304; y += 24) hline(-10, y, 660, M(10));
  for (let y = 42; y < 304; y += 24) for (let x = ((y / 24) & 1) * 30 - 10; x < 660; x += 60) vline(x, y - 12, 12, M(10));
  // 顶部横带：小鱼人浮雕队列
  rect(-10, 42, 660, 36, M(10));
  hline(-10, 42, 660, M(11));
  hline(-10, 77, 660, M(0));
  for (let x = 4; x < 640; x += 34) {
    disc(x + 10, 53, 4, M(11));
    rect(x + 6, 57, 9, 13, M(11));
    line(x + 3, 61, x + 6, 63, M(11));
    line(x + 15, 61, x + 18, 59, M(11));
    px(x + 9, 52, M(12));
  }
  // 两侧浮雕圆花
  for (const cx of [44, 596]) {
    disc(cx, 160, 16, M(0)); disc(cx, 160, 14, M(10)); disc(cx, 160, 6, M(11));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(cx + Math.cos(a) * 7, 160 + Math.sin(a) * 7, cx + Math.cos(a) * 13, 160 + Math.sin(a) * 13, M(11)); }
  }
  // 楔形文字带
  for (const bx of [16, 508]) for (let i = 0; i < 12; i++) {
    const x = bx + i * 10, y = 286 + (i % 2) * 6;
    rect(x, y, 6, 2, M(11)); px(x + 6, y + 1, M(11)); px(x + 1, y + 2, M(10));
  }
  // 耳朵与金耳环
  disc(314, 170, 7, M(27)); disc(390, 170, 7, M(26));
  ring(313, 184, 6, M(15)); ring(391, 184, 6, M(15));
  px(311, 181, M(19)); px(389, 181, M(19));
  // 长袍肩部（铺满画面下方）
  poly([[246, 305], [262, 268], [300, 246], [340, 240], [364, 240], [404, 246], [442, 268], [458, 305]], M(28));
  // 左受光 / 右背光
  poly([[246, 305], [262, 268], [300, 246], [322, 242], [310, 305]], M(8));
  poly([[410, 246], [442, 268], [458, 305], [414, 305]], M(27));
  // 衣褶
  for (const fx of [292, 312, 336, 368, 392, 412]) {
    line(fx, 250 + (fx % 13), fx - 3, 305, M(27));
    line(fx + 2, 258 + (fx % 7), fx, 305, M(12));
  }
  // 披肩镶边
  poly([[262, 268], [300, 246], [308, 252], [272, 276]], M(27));
  poly([[402, 246], [442, 268], [432, 276], [396, 252]], M(12));
  // 金项圈
  arc(352, 244, 32, 0.25, 2.9, M(15));
  arc(352, 244, 28, 0.25, 2.9, M(29));
  for (let i = 0; i < 7; i++) { const a = 0.5 + i * 0.33; px(352 + Math.round(Math.cos(a) * 26), 244 + Math.round(Math.sin(a) * 26), i % 2 ? M(19) : M(22)); }
  // 脖子
  rect(340, 226, 24, 20, M(27));
  vline(342, 226, 19, M(28));
  vline(360, 226, 19, M(12));
  // 脸部
  poly([[320, 140], [384, 140], [388, 168], [380, 192], [352, 200], [324, 192], [316, 168]], M(28));
  poly([[320, 140], [332, 140], [330, 196], [324, 192], [316, 168]], M(8));
  poly([[372, 140], [384, 140], [388, 168], [380, 192], [366, 196]], M(27));
  // 眉
  poly([[321, 152], [383, 152], [383, 159], [352, 157], [321, 159]], M(10));
  hline(323, 151, 58, M(0));
  // 眼睛
  poly([[326, 162], [344, 160], [346, 170], [340, 176], [328, 174], [324, 168]], M(8));
  disc(336, 168, 4, M(0)); px(334, 166, M(8));
  line(326, 162, 344, 160, M(10));
  poly([[360, 160], [378, 162], [380, 168], [376, 174], [364, 176], [358, 170]], M(8));
  disc(370, 168, 4, M(0)); px(368, 166, M(8));
  line(360, 160, 378, 162, M(10));
  // 鼻
  poly([[348, 158], [356, 158], [358, 178], [352, 184], [346, 178]], M(27));
  vline(350, 160, 18, M(8));
  px(347, 180, M(10)); px(357, 180, M(10));
  // 嘴
  hline(344, 190, 18, M(12));
  hline(346, 192, 14, M(27));
  dither(378, 180, 9, 12, M(27), 0.22);
  // 胡须：五股辫 + 卷珠
  for (let i = 0; i < 5; i++) {
    const x = 333 + i * 8;
    vline(x, 198, 46 - (i % 2) * 4, i % 2 ? M(27) : M(26));
    vline(x + 1, 198, 44 - (i % 2) * 4, i % 2 ? M(12) : M(27));
    for (let y = 204; y < 240; y += 7) { px(x + 2, y, M(8)); px(x + 3, y + 3, M(10)); }
  }
  for (let i = 0; i < 5; i++) disc(336 + i * 8, 244, 3, M(27));
  hline(331, 197, 42, M(10));
  // 高冠：三层 + 金色环带（教皇式）
  // 底环
  rect(300, 128, 104, 13, M(14));
  hline(300, 128, 104, M(15)); hline(300, 139, 104, M(12));
  // 第一层
  poly([[296, 128], [296, 104], [408, 104], [408, 128]], M(28));
  vline(297, 105, 23, M(8)); vline(298, 105, 23, M(8));
  rect(398, 104, 10, 24, M(27));
  // 第二层
  poly([[304, 104], [304, 80], [400, 80], [400, 104]], M(28));
  vline(305, 81, 23, M(8)); vline(306, 81, 23, M(8));
  rect(390, 80, 10, 24, M(27));
  // 第三层
  poly([[312, 80], [312, 58], [392, 58], [392, 80]], M(28));
  vline(313, 59, 21, M(8)); vline(314, 59, 21, M(8));
  rect(382, 58, 10, 22, M(27));
  // 圆顶 + 尖顶饰
  poly([[322, 58], [352, 42], [382, 58]], M(28));
  vline(324, 52, 6, M(8));
  rect(322, 54, 4, 4, M(27));
  vline(352, 32, 11, M(15)); disc(352, 30, 3, M(15)); px(352, 28, M(8));
  // 三圈金环带
  for (const [yy, w] of [[126, 104], [102, 96], [78, 80]]) {
    hline(352 - w / 2, yy, w, M(15));
    hline(352 - w / 2, yy + 1, w, M(29));
    for (let x = 352 - w / 2 + 6; x < 352 + w / 2 - 3; x += 12) px(x, yy, (x / 12 | 0) % 2 ? M(19) : M(22));
  }
  // 冠面竖肋与小金点
  for (let x = 306; x < 400; x += 14) {
    if (x > 296 && x < 408) vline(x, 106, 18, M(27));
    if (x > 304 && x < 400) vline(x, 82, 18, M(27));
    if (x > 312 && x < 392) vline(x, 60, 18, M(27));
  }
  for (const [x, y] of [[320, 116], [352, 116], [384, 116], [330, 92], [374, 92], [340, 70], [364, 70]]) px(x, y, M(16));
  // 冠顶受光
  line(330, 44, 374, 44, M(8));
  // 顶部光带扫过（动画）
  const gk = clamp((t - 1.32) / 1.24, 0, 1);
  const gy2 = Math.round(lerp(46, 138, gk));
  for (let x = 286; x < 430; x++) {
    const y = gy2 - Math.round((x - 286) * 0.18);
    if (y > 42 && y < 140) brighten(x, y, 1);
  }
  // 左侧斜光柱
  const shaft = 0.10 + 0.035 * Math.sin(t * 2.6);
  for (let y = 0; y < 304; y++) {
    const x0 = Math.round(20 + y * 0.55), x1 = x0 + 86;
    for (let x = x0; x < x1 && x < 640; x++) {
      if (x < 0) continue;
      if (bay(x, y) < shaft) brighten(x, y, 1);
    }
  }
}

function bayShotB(t, f) {
  const jx = Math.round(Math.sin(t * 10.0) * 0.9), jy = Math.round(Math.cos(t * 7.0) * 0.7);
  GX += jx; GY += jy;
  const pan = Math.round(1 + (t - 1.32) * 1.4);
  GX += pan;
  drawBust(t);
  // 眼睛神光
  const ek = clamp((t - 1.9) / 0.5, 0, 1) * (0.6 + 0.4 * Math.sin(t * 5.0));
  glowSpot(336, 168, 9, 1, 0.10 * ek);
  glowSpot(370, 168, 9, 1, 0.10 * ek);
  dustMotes(t, 18, 21, 24, 320, 60, 300, M(14));
  labelBlock('神的衣冠', 'PRIEST KING', 24, 12, 2);
  GX -= jx; GY -= jy;
  GX -= pan;
}

// ================================================================== SHOT C — 鱼皮披风
const FISH_PELT = [[76, 196], [96, 176], [128, 160], [170, 154], [220, 160], [280, 168], [340, 176], [400, 186], [446, 196], [446, 232], [400, 226], [340, 216], [280, 208], [220, 200], [176, 198], [140, 208], [104, 214], [92, 210]];
const FISH_TAIL = [[446, 196], [486, 178], [494, 200], [516, 216], [492, 222], [470, 224], [480, 244], [452, 234], [446, 232]];
function inPoly(px0, py0, pts) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
    if (((yi > py0) !== (yj > py0)) && (px0 < (xj - xi) * (py0 - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}
function bayShotC(t, f) {
  const jx = Math.round(Math.sin(t * 9.0) * 0.9), jy = Math.round(Math.cos(t * 11.0) * 0.7);
  GX += jx; GY += jy;
  const pan = Math.round(1 + (t - 2.56) * 1.1);
  GX += pan;
  // 背景：暗砖墙
  rect(-10, 0, 660, 305, M(9));
  for (let y = 26; y < 305; y += 22) hline(-10, y, 660, M(10));
  for (let y = 37; y < 305; y += 22) for (let x = ((y / 22) & 1) * 22 - 10; x < 660; x += 44) vline(x, y - 10, 10, M(10));
  // 左侧斜光（与 B 同源）
  const shaft = 0.10 + 0.03 * Math.sin(t * 2.9);
  for (let y = 0; y < 304; y++) {
    const x0 = Math.round(-40 + y * 0.5), x1 = x0 + 110;
    for (let x = Math.max(0, x0); x < x1 && x < 640; x++) if (bay(x, y) < shaft) brighten(x, y, 1);
  }
  // 长袍肩颈（近景）
  const ROBE = [[40, 305], [66, 232], [110, 180], [176, 142], [244, 118], [292, 104], [348, 104], [396, 118], [464, 142], [530, 180], [574, 232], [600, 305]];
  poly(ROBE, M(28));
  poly([[40, 305], [66, 232], [110, 180], [160, 156], [140, 305]], M(8));
  poly([[464, 142], [530, 180], [574, 232], [600, 305], [536, 305]], M(27));
  // 衣褶
  for (const fx of [120, 158, 196, 470, 508, 548]) { line(fx, 210 + (fx % 19), fx - 5, 305, M(27)); line(fx + 2, 236 + (fx % 11), fx, 305, M(12)); }
  // 颈与下巴
  poly([[294, 0], [348, 0], [344, 96], [300, 96]], M(27));
  vline(297, 0, 96, M(28)); vline(344, 0, 92, M(12));
  poly([[286, 0], [296, 0], [300, 26], [288, 20]], M(28));
  poly([[346, 0], [354, 0], [352, 18], [344, 24]], M(27));
  // 金项圈
  arc(320, 116, 44, 0.25, 2.9, M(15)); arc(320, 116, 40, 0.25, 2.9, M(29));
  for (let i = 0; i < 9; i++) { const a = 0.35 + i * 0.3; px(320 + Math.round(Math.cos(a) * 38), 116 + Math.round(Math.sin(a) * 38), i % 2 ? M(19) : M(22)); }
  // 鱼皮披风：整张鱼皮斜搭胸肩（头在左肩，尾在右胯）
  poly(FISH_PELT, M(21));
  poly(FISH_TAIL, M(22));
  polyLine(FISH_PELT, M(19), true);
  polyLine(FISH_TAIL, M(19), true);
  // 背脊暗带
  for (let x = 120; x < 440; x += 2) {
    const backY = Math.round(158 + (x - 120) * 0.10);
    if (inPoly(x, backY + 1, FISH_PELT)) { px(x, backY + 1, M(20)); if (x % 8 === 0) px(x, backY + 2, M(20)); }
  }
  // 鳞片
  const sweep = lerp(-160, 760, clamp((t - 2.56) / 0.95, 0, 1));
  const TW = 10, TH = 6;
  for (let y = 152; y < 240; y += TH) {
    const row = (y / TH) | 0, ox = (row & 1) ? 5 : 0;
    for (let x = 70 - ox; x < 450; x += TW) {
      const cx = x + TW / 2, cy = y + 3;
      if (!inPoly(cx, cy, FISH_PELT)) continue;
      if (Math.hypot(cx - 122, cy - 180) < 15) continue;
      let hi = M(23), mid = M(22), lo = M(21);
      if (cy < 176 + (cx - 120) * 0.06) { hi = M(22); mid = M(21); lo = M(20); }
      if (cx < 150) { mid = M(23); lo = M(22); }
      const dd = cx * 0.82 - cy * 0.55;
      const sh = Math.abs(dd - sweep);
      if (sh < 46) { hi = sh < 16 ? M(8) : M(7); mid = M(23); }
      const xx = Math.round(x);
      hline(xx + 1, y, TW - 2, hi);
      hline(xx + 2, y + 1, TW - 4, mid);
      hline(xx + 1, y + TH - 1, TW - 2, lo);
      px(xx, y + 1, lo); px(xx + TW - 1, y + 1, lo);
    }
  }
  // 头端高光 + 背缘亮线
  for (let x = 100; x < 446; x += 1) {
    const backY = Math.round(158 + (x - 120) * 0.10);
    if (inPoly(x, backY, FISH_PELT)) px(x, backY, x < 180 ? M(23) : M(22));
  }
  // 尾鳍鳍条
  for (let i = 0; i < 5; i++) line(448, 204, 466 + i * 7, 184 + i * 10, i % 2 ? M(20) : M(23));
  // 侧鳍（垂在袍上）
  poly([[190, 200], [178, 226], [200, 230], [210, 210]], M(22));
  for (let i = 0; i < 4; i++) line(192 + i * 3, 204, 182 + i * 6, 227, M(20));
  // 鱼眼、鳃、嘴
  disc(122, 180, 8, M(8)); ring(122, 180, 9, M(20));
  disc(122, 180, 4, M(0)); px(120, 177, M(8)); px(119, 178, M(27));
  line(112, 172, 132, 170, M(20));
  arc(150, 186, 8, -1.0, 1.2, M(20));
  arc(150, 186, 12, -1.0, 1.2, M(20));
  line(78, 197, 100, 207, M(20));
  px(82, 200, M(23)); px(86, 198, M(23));
  // 背鳍
  poly([[204, 158], [214, 144], [224, 160]], M(22));
  poly([[240, 162], [250, 148], [260, 164]], M(22));
  poly([[276, 168], [286, 154], [296, 170]], M(22));
  // 金别针（把鱼皮钉在胸前）
  for (let y = 124; y < 166; y += 6) px(320, y, (y / 6 | 0) % 3 === 0 ? M(15) : M(29));
  disc(320, 170, 8, M(15)); disc(320, 170, 5, M(29)); disc(320, 170, 2, M(16));
  // 零星反光鳞
  for (let i = 0; i < 12; i++) {
    const x = 100 + Math.floor(hash(i, 41) * 330), y = 150 + Math.floor(hash(i, 43) * 80);
    if (inPoly(x, y, FISH_PELT) && ((f / 6 + i) | 0) % 3 === 0) { px(x, y, M(8)); px(x + 1, y, M(23)); }
  }
  labelBlock('鱼皮', 'FISH SKIN', 24, 12, 2);
  dustMotes(t, 14, 31, 30, 610, 100, 300, M(14));
  GX -= jx; GY -= jy;
  GX -= pan;
}

// ================================================================== SHOT D — 四千年前的苏美尔
function ziggurat(t) {
  const tiers = [
    [340, 600, 236, 262],
    [364, 576, 214, 236],
    [388, 552, 194, 214],
    [412, 528, 176, 194],
  ];
  for (const [x0, x1, y0, y1] of tiers) {
    rect(x0, y0, x1 - x0, y1 - y0, M(12));
    hline(x0, y0, x1 - x0, M(14));
    hline(x0, y0 + 1, x1 - x0, M(13));
    hline(x0, y1 - 1, x1 - x0, M(10));
    vline(x0, y0, y1 - y0, M(13));
    vline(x1 - 1, y0, y1 - y0, M(10));
    for (let y = y0 + 5; y < y1; y += 5) hline(x0 + 2, y, x1 - x0 - 4, M(11));
    for (let x = x0 + 18; x < x1 - 8; x += 34) vline(x, y0 + 2, y1 - y0 - 3, M(11));
  }
  // 中央大台阶（朝祭坛）
  for (let y = 258; y > 178; y -= 4) {
    const w = 30 + (258 - y) * 0.10;
    hline(470 - w / 2, y, w, M(14));
    hline(470 - w / 2 + 2, y + 1, w - 4, M(11));
    px(470 - w / 2, y, M(13)); px(470 + w / 2 - 1, y, M(10));
  }
  // 蓝釉饰带
  hline(342, 240, 256, M(21));
  hline(366, 218, 208, M(21));
  hline(390, 198, 160, M(21));
  // 顶层神庙
  rect(444, 152, 52, 24, M(12));
  hline(444, 152, 52, M(14));
  rect(466, 160, 8, 16, M(0));
  hline(444, 168, 52, M(15));
  px(448, 156, M(15)); px(492, 156, M(15));
  // 角旗
  for (const [fx, fy, ph] of [[344, 236, 0], [506, 176, 1.7]]) {
    vline(fx, fy - 22, 22, M(10));
    const wav = Math.round(Math.sin(t * 6 + ph) * 2);
    poly([[fx, fy - 22], [fx + 15, fy - 20 + wav], [fx + 12, fy - 14 + wav], [fx, fy - 12]], M(18));
    px(fx + 4, fy - 20 + wav, M(19));
  }
}
function bayShotD(t, f) {
  const jx = Math.round(Math.sin(t * 8.5) * 0.9), jy = Math.round(Math.cos(t * 10.5) * 0.7);
  GX += jx; GY += jy;
  const pan = Math.round(-3 + (t - 3.66) * 3.4);
  GX += pan;
  // 天空
  skyBand(-8, 108, E.sky0, E.sky1);
  skyBand(108, 188, E.sky1, E.sky2);
  skyBand(188, 240, E.sky2, E.sky3);
  cloudBand(f, 96, 190, 0.05, E.cloudD, E.sky2);
  // 太阳
  disc(150, 134, 20, M(14));
  disc(150, 134, 16, M(15));
  glowSpot(150, 134, 66, 1, 0.28 + Math.sin(t * 2.1) * 0.05);
  // 远丘
  poly([[-10, 236], [70, 222], [150, 230], [240, 214], [330, 226], [420, 212], [510, 224], [610, 214], [652, 220], [652, 272], [-10, 272]], E.moundM);
  // 远处民居
  for (let x = -6; x < 646; x += 38) {
    const h = 10 + Math.floor(hash(x, 4) * 14);
    rect(x, 266 - h, 30, h, M(11));
    hline(x, 266 - h, 30, M(13));
    hline(x, 265 - h, 30, M(12));
    px(x + 6, 266 - h + 4, M(9)); px(x + 20, 266 - h + 6, M(9));
    dotsFlecks(x + 2, 268 - h, 26, 2, M(13), 0.3, 3);
  }
  // 塔庙
  ziggurat(t);
  // 城墙 + 垛口
  rect(-10, 268, 660, 20, M(11));
  for (let x = -10; x < 650; x += 16) { rect(x, 262, 9, 6, M(12)); px(x, 262, M(13)); }
  hline(-10, 268, 660, M(13));
  for (let y = 274; y < 288; y += 7) hline(-10, y, 660, M(10));
  // 城门
  rect(196, 252, 52, 52, M(12));
  hline(196, 252, 52, M(14));
  for (let x = 196; x < 248; x += 13) rect(x, 246, 8, 6, M(13));
  arc(222, 268, 14, Math.PI, 2 * Math.PI, M(10));
  rect(208, 266, 28, 20, M(0));
  vline(236, 252, 14, M(15));
  poly([[236, 252], [250, 255], [236, 258]], M(18));
  // 棕榈
  palm(84, 268, 118, t, 3);
  palm(120, 268, 92, t, 7);
  palm(610, 268, 108, t, 11);
  // 运河
  rect(-10, 288, 660, 20, M(20));
  poly([[-10, 286], [80, 290], [190, 287], [320, 291], [460, 287], [650, 290], [650, 294], [-10, 294]], M(13));
  for (let i = 0; i < 30; i++) {
    const y = 294 + Math.floor(hash(i, 8) * 9);
    const x = ((hash(i, 9) * 680 + t * (6 + (i % 4) * 3)) % 680) - 20;
    hline(Math.round(x), y, 3 + (i % 5), i % 3 ? M(21) : M(15));
  }
  // 芦苇
  for (let i = 0; i < 34; i++) {
    const x = Math.round(hash(i, 12) * 640);
    const h = 6 + Math.round(hash(i, 14) * 12);
    const sway = Math.round(Math.sin(t * 2 + i) * 2);
    for (let j = 0; j < h; j++) px(x + Math.round(sway * (j / h)), 300 - j, j > h - 3 ? E.grassL : E.grassD);
  }
  // 飞鸟绕塔
  const st = Math.floor(f / 3);
  crow(f, 430 + Math.round(Math.sin(st * 0.22) * 46), 118 + Math.round(Math.cos(st * 0.22) * 14));
  crow(f, 476 + Math.round(Math.sin(st * 0.22 + 2.1) * 52), 104 + Math.round(Math.cos(st * 0.22 + 2.1) * 12));
  crow(f, 392 + Math.round(Math.sin(st * 0.22 + 4.2) * 38), 132 + Math.round(Math.cos(st * 0.22 + 4.2) * 10));
  labelBlock('苏美尔', 'ANCIENT SUMER', 24, 12, 2);
  dustMotes(t, 18, 41, 60, 600, 120, 290, M(14));
  GX -= jx; GY -= jy;
  GX -= pan;
}

// ================================================================== SHOT E — 神庙诸神
function statueGod(t) {
  // 神像：鱼头人身，鱼皮披身，手持桶与锥
  const cx = 320;
  // 背光
  glowSpot(cx, 210, 82, 1, 0.16 + 0.05 * Math.sin(t * 2.0));
  // 鱼头
  poly([[296, 118], [344, 118], [352, 134], [348, 152], [320, 160], [292, 152], [288, 134]], M(21));
  // 吻部
  poly([[288, 134], [300, 140], [316, 146], [316, 158], [300, 154], [288, 146]], M(20));
  // 眼
  disc(306, 136, 5, M(8)); disc(334, 136, 5, M(8));
  disc(306, 136, 2, M(0)); disc(334, 136, 2, M(0));
  px(304, 134, M(8)); px(332, 134, M(8));
  // 鳃
  arc(340, 146, 9, -0.6, 1.2, M(20));
  arc(340, 146, 12, -0.6, 1.2, M(20));
  // 背鳍
  for (let i = 0; i < 6; i++) { const fx = 302 + i * 7; poly([[fx, 120], [fx + 3, 108], [fx + 6, 120]], M(22)); }
  // 嘴
  hline(292, 148, 12, M(20));
  // 金项圈
  arc(cx, 162, 26, 0.25, 2.9, M(15));
  arc(cx, 162, 23, 0.25, 2.9, M(29));
  // 躯干
  poly([[298, 164], [342, 164], [352, 236], [288, 236]], M(22));
  // 鳞
  for (let y = 168; y < 232; y += 5) for (let x = 292 + (((y / 5) | 0) & 1) * 4; x < 350; x += 8) { px(x, y, M(23)); px(x + 1, y + 1, M(21)); }
  // 腰带
  hline(290, 218, 60, M(15)); hline(290, 219, 60, M(29));
  for (let x = 296; x < 348; x += 10) px(x, 219, M(19));
  // 双臂
  poly([[298, 170], [288, 174], [284, 206], [292, 208]], M(21));
  poly([[342, 170], [352, 174], [356, 206], [348, 208]], M(21));
  hline(285, 190, 8, M(15)); hline(349, 190, 8, M(15));
  // 手
  disc(288, 210, 4, M(22)); disc(352, 210, 4, M(22));
  // 左手桶
  rect(276, 214, 15, 13, M(12));
  hline(276, 214, 15, M(14));
  arc(283, 214, 7, Math.PI, 2 * Math.PI, M(10));
  // 右手锥
  poly([[352, 212], [359, 202], [363, 212]], M(14));
  hline(358, 203, 4, M(16));
  // 裙摆与基座
  rect(288, 236, 64, 16, M(20));
  hline(288, 236, 64, M(12));
  rect(268, 252, 104, 16, M(12));
  hline(268, 252, 104, M(14));
  for (let x = 276; x < 364; x += 12) rect(x, 258, 7, 2, M(11));
  // 眼中神光
  const ek = 0.35 + 0.25 * Math.sin(t * 3.4);
  glowSpot(306, 136, 8, 1, 0.16 * ek);
  glowSpot(334, 136, 8, 1, 0.16 * ek);
}
function bayShotE(t, f) {
  const jx = Math.round(Math.sin(t * 7.5) * 0.9), jy = Math.round(Math.cos(t * 9.5) * 0.7);
  GX += jx; GY += jy;
  // 墙与顶
  rect(-10, 0, 660, 304, M(9));
  dithGrad(-10, 0, 660, 72, M(0), M(9));
  for (let y = 84; y < 268; y += 16) hline(-10, y, 660, M(10));
  for (let y = 92; y < 268; y += 16) for (let x = ((y / 16) & 1) * 16 - 10; x < 650; x += 32) vline(x, y - 8, 8, M(10));
  // 壁龛
  rect(232, 100, 176, 168, M(0));
  poly([[232, 100], [248, 84], [392, 84], [408, 100], [408, 100], [232, 100]], M(0));
  polyLine([[232, 268], [232, 100], [248, 84], [392, 84], [408, 100], [408, 268]], M(12), false);
  polyLine([[236, 268], [236, 104], [250, 88], [390, 88], [404, 104], [404, 268]], M(11), false);
  // 壁龛内的砖缝
  for (let y = 120; y < 260; y += 14) hline(240, y, 160, M(10));
  // 神像
  statueGod(t);
  // 柱子（近大远小）
  column(40, 26, 16, 268, 0);
  column(146, 18, 24, 268, 1);
  column(476, 18, 24, 268, 1);
  column(574, 26, 16, 268, 0);
  // 地面
  rect(-10, 268, 660, 40, M(10));
  for (let y = 278; y < 305; y += 12) hline(-10, y, 660, M(9));
  for (let x = -10; x < 650; x += 48) vline(x + ((x / 48) & 1) * 12, 268, 36, M(9));
  hline(-10, 268, 660, M(12));
  // 吊灯
  for (const lx of [180, 460]) {
    vline(lx, 0, 54, M(10));
    rect(lx - 10, 54, 20, 10, M(12));
    hline(lx - 10, 54, 20, M(14));
    px(lx - 8, 57, M(15)); px(lx + 8, 57, M(15));
    fire(lx, 42, t, 1, lx);
    glowSpot(lx, 284, 40, 1, 0.10);
  }
  // 火盆
  for (const bx of [166, 474]) {
    line(bx - 10, 268, bx - 4, 246, M(10));
    line(bx + 10, 268, bx + 4, 246, M(10));
    line(bx, 268, bx, 246, M(10));
    disc(bx, 244, 12, M(12)); hline(bx - 12, 240, 24, M(14));
    fire(bx, 226, t, 2, bx);
    sparks(bx, 238, 9, t, bx);
  }
  // 香烟
  incense(166, 236, t, 0);
  incense(474, 236, t, 1);
  // 跪拜者
  worshipper(226, 306, 0.85, t, 0.4);
  worshipper(320, 308, 1.0, t, 2.2);
  worshipper(414, 306, 0.85, t, 4.1);
  // 地面上火光的反射
  glowSpot(166, 292, 30, 1, 0.16);
  glowSpot(474, 292, 30, 1, 0.16);
  glowSpot(320, 262, 60, 1, 0.08);
  labelBlock('神庙', 'TEMPLE OF THE GODS', 24, 12, 2);
  dustMotes(t, 20, 51, 30, 610, 40, 300, M(14));
  GX -= jx; GY -= jy;
}

// ================================================================== SHOT F — 波斯湾星图
const FISH_CON = [[148, 128], [196, 96], [250, 84], [306, 62], [368, 76], [428, 58], [468, 86], [448, 122], [398, 136], [342, 120], [286, 138], [214, 146]];
function bayShotF(t, f) {
  const jx = Math.round(Math.sin(t * 10.5) * 0.9), jy = Math.round(Math.cos(t * 8.5) * 0.7);
  GX += jx; GY += jy;
  const pan = Math.round(2 - (t - 6.96) * 1.4);
  GX += pan;
  // 夜空
  skyBand(-8, 122, E.sky0, E.sky1);
  skyBand(122, 184, E.sky1, E.sky2);
  skyBand(184, 214, E.sky2, E.sky3);
  stars(f);
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(hash(i, 31) * W), y = Math.floor(hash(i, 33) * 172);
    const ph = (f / 22 + hash(i, 35)) % 1;
    if (ph < 0.42) px(x, y, ph < 0.1 ? M(8) : M(7));
  }
  moon(f, 516, 58, 20);
  // 海
  rect(-10, 212, 660, 94, M(20));
  dithGrad(-10, 214, 660, 258, M(21), M(20));
  hline(-10, 212, 660, M(21));
  // 月光碎道（横向碎光，近岸渐宽渐稀）
  for (let i = 0; i < 72; i++) {
    const u = hash(i, 41);
    const yy = 214 + Math.floor(Math.pow(u, 0.8) * 88);
    const spread = 6 + (yy - 214) * 0.30;
    const xx = 516 + Math.round((hash(i, 43) - 0.5) * spread * 2 + Math.sin(t * 2.2 + i * 1.7) * 3);
    if (hash(i, 45) < 0.28 + (yy - 214) / 420) continue;
    const len = 2 + Math.floor(hash(i, 47) * 4);
    hline(xx, yy, len, hash(i, 49) < 0.35 ? M(8) : M(7));
    if (hash(i, 51) < 0.5) px(xx + len + 1, yy, M(21));
  }
  // 波浪
  for (let i = 0; i < 46; i++) {
    const yy = 216 + Math.floor(hash(i, 51) * 84);
    const speed = 5 + hash(i, 53) * 9;
    const xx = ((hash(i, 55) * 700 + t * speed) % 700) - 30;
    const len = 3 + Math.floor(hash(i, 57) * 12);
    hline(Math.round(xx), Math.round(yy), len, hash(i, 59) < 0.25 ? M(22) : M(21));
  }
  // 远岸与远处灯火
  poly([[486, 212], [520, 206], [560, 209], [600, 204], [642, 207], [642, 212]], M(0));
  rect(556, 196, 12, 8, M(0));
  hline(560, 194, 4, M(0));
  if (((f >> 3) & 1) === 0) px(557, 200, M(15));
  if (((f >> 4) & 1) === 0) px(566, 202, M(16));
  // 苇舟
  const bx = Math.round(196 - (t - 6.96) * 9);
  const by = 224 + Math.round(Math.sin(t * 1.6) * 1);
  poly([[bx - 14, by], [bx + 14, by], [bx + 9, by + 5], [bx - 9, by + 5]], M(9));
  px(bx - 15, by - 1, M(9)); px(bx + 15, by - 1, M(9));
  vline(bx + 2, by - 10, 10, M(9));
  disc(bx + 2, by - 12, 2, M(9));
  line(bx + 5, by - 2, bx - 2, by - 16, M(9));
  // 鱼形星座，逐笔连线
  const p = clamp((t - 7.02) / 1.15, 0, 1);
  polyPath(FISH_CON, M(29), true, 0, p);
  polyPath(FISH_CON.map(([x, y]) => [x, y - 1]), M(15), true, 0, p * 0.7);
  let total = 0; const lens = [];
  for (let i = 0; i < FISH_CON.length; i++) {
    const a = FISH_CON[i], b = FISH_CON[(i + 1) % FISH_CON.length];
    lens.push(Math.hypot(b[0] - a[0], b[1] - a[1])); total += lens[i];
  }
  let run = 0;
  for (let i = 0; i < FISH_CON.length; i++) {
    const lit = p >= run / total - 0.001;
    const tw = 0.5 + 0.5 * Math.sin(f * 0.4 + i * 2.1);
    if (lit) {
      glowSpot(FISH_CON[i][0], FISH_CON[i][1], 7, 1, 0.22 + 0.2 * tw);
      disc(FISH_CON[i][0], FISH_CON[i][1], 2, M(15));
      px(FISH_CON[i][0], FISH_CON[i][1], M(8));
    } else {
      px(FISH_CON[i][0], FISH_CON[i][1], M(7));
    }
    run += lens[i];
  }
  // 鱼眼星（放在鱼头一端，让轮廓读得出方向）
  if (p > 0.55) {
    const k = clamp((p - 0.55) / 0.25, 0, 1);
    glowSpot(442, 92, 10, 1, 0.5 * k);
    disc(442, 92, 2, M(16)); px(442, 92, M(8));
  }
  labelBlock('波斯湾', 'PERSIAN GULF', 24, 12, 2);
  dustMotes(t, 10, 61, 40, 600, 60, 200, M(7));
  GX -= jx; GY -= jy;
  GX -= pan;
}

// ================================================================== SHOT G — 半人半鱼出水
function apkallu(x, wl, off, t) {
  const hy = 150 + off;
  glowSpot(x, hy + 48, 92, 1, 0.16 + 0.10 * Math.sin(t * 3.1));
  // ---- 鱼头（四分之三朝左，带吻部）
  poly([[x - 34, hy + 4], [x - 16, hy - 6], [x + 10, hy - 6], [x + 28, hy + 2], [x + 32, hy + 18], [x + 26, hy + 32], [x + 4, hy + 38], [x - 20, hy + 36], [x - 34, hy + 24]], M(21));
  // 吻部
  poly([[x - 34, hy + 12], [x - 54, hy + 18], [x - 56, hy + 26], [x - 36, hy + 28]], M(21));
  line(x - 55, hy + 25, x - 36, hy + 28, M(20));
  px(x - 54, hy + 20, M(23)); px(x - 50, hy + 19, M(23));
  // 头冠鳍
  poly([[x - 24, hy - 2], [x - 12, hy - 22], [x + 4, hy - 28], [x + 18, hy - 18], [x + 24, hy - 2]], M(22));
  for (let i = 0; i < 5; i++) line(x - 20 + i * 9, hy - 3, x - 12 + i * 9, hy - 16 - (i % 2) * 4, M(20));
  polyLine([[x - 24, hy - 2], [x - 12, hy - 22], [x + 4, hy - 28], [x + 18, hy - 18], [x + 24, hy - 2]], M(23), false);
  // 鳃鳍（耳位）
  poly([[x - 32, hy + 10], [x - 50, hy - 2], [x - 44, hy + 18]], M(22));
  poly([[x + 30, hy + 8], [x + 48, hy - 4], [x + 42, hy + 16]], M(22));
  // 眼（左大右小，四分之三）
  disc(x - 18, hy + 14, 8, M(8)); disc(x - 18, hy + 14, 4, M(0)); px(x - 20, hy + 11, M(8)); px(x - 21, hy + 12, M(27));
  ring(x - 18, hy + 14, 9, M(20));
  disc(x + 14, hy + 12, 5, M(8)); disc(x + 14, hy + 12, 2, M(0));
  // 眉骨
  line(x - 30, hy + 5, x - 6, hy + 3, M(20)); line(x + 6, hy + 4, x + 20, hy + 6, M(20));
  // 鳃裂
  arc(x + 26, hy + 18, 9, -0.9, 1.1, M(20));
  arc(x + 26, hy + 18, 13, -0.9, 1.1, M(20));
  // 触须
  for (let i = 0; i < 4; i++) { px(x - 52 - i * 2, hy + 30 + i * 3 + (i > 1 ? 1 : 0), M(23)); px(x - 47 - i, hy + 31 + i * 3, M(20)); }
  // ---- 躯干
  poly([[x - 28, hy + 36], [x + 28, hy + 36], [x + 33, hy + 68], [x - 33, hy + 68]], M(21));
  // 胸肌光
  arc(x - 10, hy + 50, 12, -1.2, 0.9, M(23));
  arc(x + 11, hy + 50, 12, -1.0, 0.9, M(23));
  // 鳞
  for (let y = hy + 42; y < hy + 68; y += 5) for (let xx = x - 30 + ((((y / 5) | 0) & 1) * 5); xx < x + 28; xx += 10) { px(xx, y, M(22)); px(xx + 1, y + 1, M(20)); }
  // 金项圈
  arc(x, hy + 36, 30, 0.3, 2.85, M(15)); arc(x, hy + 36, 27, 0.3, 2.85, M(29));
  // ---- 人鱼尾鳍（向水面散开）
  poly([[x - 31, hy + 64], [x + 31, hy + 64], [x + 46, hy + 92], [x + 58, hy + 104], [x + 30, hy + 100], [x, hy + 92], [x - 30, hy + 100], [x - 58, hy + 104], [x - 46, hy + 92]], M(21));
  for (let i = 0; i < 6; i++) line(x - 26 + i * 10.4, hy + 68, x - 50 + i * 20, hy + 100, M(20));
  polyLine([[x - 31, hy + 64], [x - 46, hy + 92], [x - 58, hy + 104], [x - 30, hy + 100], [x, hy + 92], [x + 30, hy + 100], [x + 58, hy + 104], [x + 46, hy + 92], [x + 31, hy + 64]], M(23), false);
  // ---- 左臂举起（持锥）
  poly([[x - 24, hy + 40], [x - 42, hy + 34], [x - 50, hy + 42], [x - 32, hy + 52]], M(21));
  poly([[x - 44, hy + 36], [x - 52, hy + 18], [x - 44, hy + 12], [x - 38, hy + 34]], M(21));
  disc(x - 48, hy + 10, 5, M(22));
  for (let i = 0; i < 3; i++) line(x - 52 + i * 3, hy + 8, x - 54 + i * 3, hy + 3, M(22));
  poly([[x - 55, hy + 2], [x - 41, hy + 4], [x - 48, hy - 10]], M(10));
  hline(x - 53, hy + 1, 10, M(15));
  hline(x - 51, hy - 2, 7, M(29));
  // ---- 右臂持桶
  poly([[x + 24, hy + 40], [x + 42, hy + 44], [x + 48, hy + 56], [x + 30, hy + 52]], M(21));
  poly([[x + 44, hy + 48], [x + 54, hy + 60], [x + 48, hy + 68], [x + 38, hy + 54]], M(21));
  poly([[x + 40, hy + 64], [x + 56, hy + 64], [x + 53, hy + 80], [x + 43, hy + 80]], M(10));
  hline(x + 40, hy + 64, 17, M(15)); hline(x + 41, hy + 74, 15, M(14));
  arc(x + 48, hy + 64, 8, Math.PI, 2 * Math.PI, M(15));
  // 金臂环
  hline(x - 46, hy + 30, 10, M(15)); hline(x + 42, hy + 50, 9, M(15));
  // 月光右缘
  for (let y = hy - 8; y < hy + 36; y++) { const xx = x + 30 - Math.round((y - hy) * 0.05); if (bay(xx, y) < 0.7) px(xx, y, M(23)); }
}
function yy2(x, y) { return x > -8 && x < 648 && y > -8 && y < 306; }
function bayShotG(t, f) {
  const jx = Math.round(Math.sin(t * 13.0) * 0.9), jy = Math.round(Math.cos(t * 10.0) * 0.7);
  GX += jx; GY += jy;
  // 夜空
  skyBand(-8, 130, E.sky0, E.sky1);
  skyBand(130, 190, E.sky1, E.sky2);
  skyBand(190, 226, E.sky2, E.sky3);
  stars(f);
  for (let i = 0; i < 36; i++) {
    const x = Math.floor(hash(i, 71) * W), y = Math.floor(hash(i, 73) * 180);
    const ph = (f / 20 + hash(i, 75)) % 1;
    if (ph < 0.4) px(x, y, ph < 0.1 ? M(8) : M(7));
  }
  moon(f, 542, 54, 18);
  // 海面
  rect(-10, 226, 660, 80, M(20));
  hline(-10, 226, 660, M(21));
  // 生物升起
  const k = clamp((t - 8.62) / 1.05, 0, 1);
  const off = Math.round(120 * Math.pow(1 - k, 3));
  const wl = 258;
  apkallu(320, wl, off, t);
  // 水面覆盖（把水线以下压回海里）
  rect(-10, wl, 660, 306 - wl, M(20));
  dithGrad(-10, wl, 660, 306, M(21), M(20));
  // 浪峰
  poly([[230, wl], [270, wl - 5], [300, wl - 8], [340, wl - 8], [370, wl - 5], [410, wl]], M(21));
  poly([[252, wl + 2], [286, wl - 2], [320, wl - 4], [354, wl - 2], [388, wl + 2]], M(22));
  // 水花
  const dt = Math.max(0, t - 8.62);
  if (dt > 0) {
    for (let i = 0; i < 80; i++) {
      const a = -Math.PI / 2 + (hash(i, 61) - 0.5) * 2.4;
      const sp = 55 + hash(i, 63) * 130;
      const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp;
      const xx = 320 + vx * dt;
      const yy = wl + vy * dt + 0.5 * 240 * dt * dt;
      if (yy < wl + 2 && xx > -10 && xx < 650) {
        px(Math.round(xx), Math.round(yy), i % 5 === 0 ? M(8) : i % 2 ? M(7) : M(6));
        if (i % 4 === 0) px(Math.round(xx) + 1, Math.round(yy) + 1, M(7));
      }
    }
    // 水面涟漪（压扁的椭圆，不是空中的圆圈）
    for (let i = 0; i < 4; i++) {
      const rr = Math.round(dt * 70 - i * 12);
      if (rr <= 3) continue;
      const steps = Math.max(16, Math.round(rr * 3));
      for (let s2 = 0; s2 < steps; s2++) {
        if ((s2 + i) % 3 === 0) continue;
        const aa = s2 / steps * Math.PI * 2;
        const xx = Math.round(320 + Math.cos(aa) * rr);
        const yy = Math.round(wl + 2 + Math.sin(aa) * rr * 0.22);
        if (yy > wl - 2 && xx > -8 && xx < 648) px(xx, yy, i === 0 ? M(7) : M(21));
      }
    }
    for (let i = 0; i < 60; i++) {
      const ang = hash(i, 71) * 6.283;
      const rad = (30 + hash(i, 73) * 70) * Math.min(1, dt * 2.4);
      const xx = 320 + Math.cos(ang) * rad;
      const yy = wl + Math.abs(Math.sin(ang)) * 5 + 1;
      if (hash(i, 75) < Math.max(0.15, 0.7 - dt * 0.5)) px(Math.round(xx), Math.round(yy), i % 3 ? M(8) : M(7));
    }
    // 落回的水滴
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (hash(i, 81) - 0.5) * 1.9;
      const sp = 90 + hash(i, 83) * 120;
      const yy = wl + Math.sin(a) * sp * dt + 0.5 * 260 * dt * dt;
      const xx = 320 + Math.cos(a) * sp * dt;
      if (yy < wl && yy > wl - 120) px(Math.round(xx), Math.round(yy), M(7));
    }
  }
  // 月光在海面的碎光
  for (let i = 0; i < 60; i++) {
    const yy = 230 + Math.floor(hash(i, 91) * 70);
    const xx = 542 + Math.round((hash(i, 93) - 0.5) * (10 + (yy - 226)));
    if (hash(i, 95) < 0.5) px(xx, yy, hash(i, 97) < 0.4 ? M(7) : M(6));
  }
  // 前景浪
  for (let i = 0; i < 40; i++) {
    const yy = 262 + Math.floor(hash(i, 101) * 42);
    const xx = ((hash(i, 103) * 700 + t * (6 + hash(i, 105) * 10)) % 700) - 30;
    const len = 4 + Math.floor(hash(i, 107) * 18);
    hline(Math.round(xx), yy, len, hash(i, 109) < 0.3 ? M(22) : M(21));
  }
  // 眼睛神光
  glowSpot(302, 164 + off, 9, 1, 0.16 + 0.16 * Math.sin(t * 6.2));
  glowSpot(334, 162 + off, 9, 1, 0.16 + 0.16 * Math.sin(t * 6.2 + 1.2));
  // 标题砸入
  {
    const kk = clamp((t - 8.60) / 0.16, 0, 1);
    const jit = t < 8.86 ? Math.round(Math.sin(t * 90) * (8.86 - t) * 7) : 0;
    textSC('神话', 90 + jit, 14 + Math.round((1 - kk) * 10), M(15), 3);
    hline(24, 56, 132, M(18));
    text('APKALLU', 24, 62, M(26), 1);
  }
  dustMotes(t, 8, 71, 40, 600, 60, 220, M(7));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- transitions / subtitle / CRT
const CUTS = cues.cuts, SHOTS = [bayShotA, bayShotB, bayShotC, bayShotD, bayShotE, bayShotF, bayShotG];
function shotIndex(t) { for (let i = 0; i < CUTS.length; i++) if (t < CUTS[i]) return i; return CUTS.length; }
function transAt(t) {
  for (let i = 0; i < CUTS.length; i++) {
    const age = t - CUTS[i];
    if (age >= 0 && age < 4 / FPS) return { prev: i, p: (age * FPS + 1) / 4 };
  }
  return null;
}
function mixCols(a, b, p) {
  const g = 12, n = Math.ceil(W / g);
  for (let k = 0; k < n; k++) {
    if (p <= ((k * 5) % n) / n) continue;
    const x0 = k * g, x1 = Math.min(W, x0 + g);
    for (let y = 0; y < H; y++) { const o = y * W; for (let x = x0; x < x1; x++) a[o + x] = b[o + x]; }
  }
}
function padEdges() {
  for (let y = 0; y < H; y++) {
    const o = y * W;
    for (let x = 0; x < 10; x++) { IB[o + x] = IB[o + 10]; IB[o + W - 1 - x] = IB[o + W - 11]; }
  }
}
function subtitle(t, f) {
  const s = cues.subs.find(s => t >= s.t0 - 0.02 && t < s.t1 + 0.10);
  if (!s) return;
  const SC = 2, bandY = 304;
  rect(0, bandY, W, H - bandY, M(0));
  for (let y = bandY + 2; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) & 1) px(x, y, M(31));
  hline(0, bandY, W, M(29));
  hline(0, bandY + 1, W, M(0));
  const full = s.text;
  const shown = Math.min(full.length, Math.max(1, Math.floor((t - s.t0) / 0.026) + 1));
  const vis = full.slice(0, shown);
  let total = 0; for (const ch of vis) total += textW(ch) * SC;
  let x = Math.round((W - total) / 2);
  const hl = s.hl || '', hi = hl ? full.indexOf(hl) : -1;
  for (let i = 0; i < vis.length; i++) {
    const gold = hi >= 0 && i >= hi && i < hi + hl.length;
    text(vis[i], x + 2, 316 + 2, M(0), SC);
    text(vis[i], x, 316, gold ? M(15) : M(8), SC);
    x += textW(vis[i]) * SC;
  }
}
function shakeXY(t) {
  let amp = 0;
  for (const [tt, a] of [[3.66, 2], [4.96, 2], [8.62, 3]]) {
    if (t >= tt && t < tt + 0.22) amp = Math.max(amp, Math.round(a * (1 - (t - tt) / 0.22)));
  }
  if (!amp) return [0, 0];
  const f = Math.round(t * FPS);
  return [Math.round(Math.sin(f * 2.7) * amp), Math.round(Math.cos(f * 3.1) * amp)];
}
function fadeEdges(t) {
  let k = 0;
  if (t < 0.16) k = 1 - t / 0.16;
  if (t > cues.duration - 0.16) k = Math.max(k, (t - (cues.duration - 0.16)) / 0.16);
  if (k <= 0.001) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if ((bay(x, y) * 0.7 + hash(x, y) * 0.3) < k) IB[y * W + x] = 0;
  }
}

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const small = document.createElement('canvas'); small.width = W; small.height = H;
const sctx = small.getContext('2d');
const simg = sctx.createImageData(W, H);
// xiangsu2 的成片规格：原生 640×360 索引色栅格，整数 ×3 最近邻 = 1920×1080；
// CRT（扫描线/暗角/磷光）在输出分辨率上做，扫描线 1 px、周期 3 px。
const FW = 640, FH = 360, UP = 3;
const OUTW = FW * UP, OUTH = FH * UP;
const scan = document.createElement('canvas'); scan.width = OUTW; scan.height = 3;
{ const c = scan.getContext('2d'); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 1, OUTW, 1); }
const vign = document.createElement('canvas'); vign.width = OUTW; vign.height = OUTH;
{
  const c = vign.getContext('2d');
  const g = c.createRadialGradient(OUTW / 2, OUTH / 2, OUTH * 0.38, OUTW / 2, OUTH / 2, OUTH * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.48)');
  c.fillStyle = g; c.fillRect(0, 0, OUTW, OUTH);
}
const scanPat = ctx.createPattern(scan, 'repeat');
function composite(f) {
  const lut = makeLUT(f), d = simg.data;
  for (let i = 0; i < W * H; i++) {
    const p = MP[lut[IB[i]]];
    d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255;
  }
  sctx.putImageData(simg, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, OUTW, OUTH);
  ctx.drawImage(vign, 0, 0);
  ctx.fillStyle = scanPat; ctx.fillRect(0, 0, OUTW, OUTH);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(120,255,200,0.02)'; ctx.fillRect(0, 0, OUTW, OUTH);
  ctx.globalCompositeOperation = 'source-over';
}
window.renderAt = (t) => {
  const tt = Math.min(cues.duration - 1e-4, Math.max(0, t));
  const f = Math.round(tt * FPS);
  const [sx, sy] = shakeXY(tt);
  GX = sx; GY = sy;
  IB.fill(0);
  SHOTS[shotIndex(tt)](tt, f);
  const tr = transAt(tt);
  if (tr) {
    JB.set(IB);
    GX = 0; GY = 0;
    SHOTS[tr.prev](Math.max(0, CUTS[tr.prev] - 1 / FPS), f);
    mixCols(IB, JB, tr.p);
  }
  GX = 0; GY = 0;
  subtitle(tt, f);
  padEdges();
  fadeEdges(tt);
  composite(f);
};
