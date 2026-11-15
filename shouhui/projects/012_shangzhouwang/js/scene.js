// shouhui · 012_商纣王 · 前 10 秒样片（v2：按剧情推进分镜 + 转场）
// 风格：mg-styles-15 / 05-cel-boil「逐帧手绘 / 线条沸腾」——引擎原语直接复用 js/engine.js
// 规格：1920×1080 / 24fps / 240 帧 / 10.000s
//
// 分镜（3 镜 + 2 转场）：
//   A 0.00–3.36  全景：墨滴落纸 → 写出「妲己」→ 朱砂横线
//   T1 3.36–3.66 墨刷横扫承接
//   B 3.66–6.96  近景：问号弹入 +「长什么样」→ 火从字底起、字被烧
//   T2 6.96–7.26 火线自下而上烧穿画面
//   C 7.26–10.00 拉回全景：余火/灰烬 → 焦痕 → 朱砂印「无字」
//
// 一切动画都是 t 的纯函数；随机全走 hs() 哈希，逐帧可复现。

import {
  PAL, hs, clamp, lerp, inv, E, K,
  resample, prefix, circlePts, boil, polyPath, fillPoly,
  inkStroke, inkLoop, fillShape,
} from './engine.js';

export const W = 1920, H = 1080, FPS = 24;

let ctx, DPR = 1;
const IMG = {};
let FONT = null, FONT_B = null;
const GLY = {}, GLY2 = {};
const QS = new URLSearchParams(location.search);
export const V5 = QS.get('v5') === '1';

const bv = (D) => (D % 4);   // 一拍二：每 2 帧换抖动变体

const BIG = 340;
const TAG_SCALE = 0.25;
const SEAL_SCALE = 0.26;

// ---------------------------------------------------------------- 分镜表
const S = { A1: 3.20, T1a: 3.20, T1b: 3.50, B1: 6.70, T2a: 6.70, T2b: 7.00, C1: 10.00 };
const B0 = S.T1b, C0 = S.T2b;

// ---------------------------------------------------------------- 字形
function glyphPolys(font, ch, size) {
  const g = font.charToGlyph(ch);
  const path = g.getPath(0, 0, size);
  const polys = [];
  let cur = [], lx = 0, ly = 0;
  for (const cmd of path.commands) {
    if (cmd.type === 'M') { if (cur.length > 2) polys.push(cur); cur = [[cmd.x, cmd.y]]; lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'L') { cur.push([cmd.x, cmd.y]); lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'Q') { for (let k = 1; k <= 6; k++) { const u = k / 6, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), cc = u * u; cur.push([a * lx + b * cmd.x1 + cc * cmd.x, a * ly + b * cmd.y1 + cc * cmd.y]); } lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'C') { for (let k = 1; k <= 8; k++) { const u = k / 8, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, cc = 3 * u * u * (1 - u), d = u ** 3; cur.push([a * lx + b * cmd.x1 + cc * cmd.x2 + d * cmd.x, a * ly + b * cmd.y1 + cc * cmd.y2 + d * cmd.y]); } lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'Z') { if (cur.length > 2) polys.push(cur); cur = []; }
  }
  if (cur.length > 2) polys.push(cur);
  const area = (P) => { let A = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; } return Math.abs(A / 2); };
  polys.sort((a, b) => area(b) - area(a));
  return { polys, width: g.advanceWidth * (size / font.unitsPerEm) };
}

function glyphBox(ch) {
  const G = GLY[ch];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const P of G.polys) for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

// 写字：轮廓沿弧长逐步描出 → 整字填墨（nonzero 保内白）
function writeGlyph(c, ch, ox, oy, frac, seed, o = {}) {
  const G = GLY[ch];
  if (!G || frac <= 0) return null;
  const sv = bv(Math.floor(seed));
  const color = o.color ?? PAL.ink;
  const w = o.w ?? 5;
  let tip = null;
  const per = G.polys.length;
  G.polys.forEach((P, i) => {
    const local = clamp(frac * 1.45 - (i / per) * 0.28, 0, 1);
    if (local <= 0.002) return;
    const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.0, true);
    const seg = local < 0.995 ? prefix([...dense, dense[0]], local) : [...dense, dense[0]];
    if (seg.length > 2) {
      const pts = inkStroke(c, seg, { seed: seed + i * 17 + sv, amp: 1.5, scale: 60, color, w, t0: 4, t1: 4, jit: 0.22, heavy: 0.15 });
      if (i === 0 && pts && pts.length) tip = pts[pts.length - 1];
    }
  });
  if (frac > 0.52) {
    const a = clamp((frac - 0.52) / 0.34, 0, 1) * 0.90;
    c.save(); c.globalAlpha = a;
    c.beginPath();
    for (const P of G.polys) {
      const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.2, true);
      polyPath(c, boil(dense, seed + 900 + sv, 1.5, 55));
    }
    c.fillStyle = color; c.fill('nonzero');
    c.restore();
  }
  return tip;
}

function fillGlyph(c, ch, ox, oy, color, seed, alpha = 1, amp = 1.4, G = null) {
  G = G || GLY[ch];
  if (!G) return;
  const sv = bv(Math.floor(seed));
  c.save(); c.globalAlpha = alpha;
  c.beginPath();
  for (const P of G.polys) {
    const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.2, true);
    polyPath(c, boil(dense, seed + sv, amp, 55));
  }
  c.fillStyle = color; c.fill('nonzero');
  c.restore();
}

// ---------------------------------------------------------------- 纸面
function drawPaper(c) {
  const s = 1.05;
  c.drawImage(IMG.paper, (W - W * s) / 2, (H - H * s) / 2, W * s, H * s);
}

function drawTooth(c, D) {
  const v = bv(D);
  const ox = Math.floor(hs(v, 51) * 470), oy = Math.floor(hs(v, 52) * 310);
  c.save();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.globalCompositeOperation = 'multiply';
  c.globalAlpha = 0.5;
  c.drawImage(IMG.tooth, ox, oy, W, H, 0, 0, W, H);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 0.20;
  const dm = IMG.dust[v % 2];
  c.save(); c.translate(W / 2, H / 2); c.scale(v % 2 ? -1 : 1, 1); c.drawImage(dm, -W / 2, -H / 2, W, H); c.restore();
  c.restore();
}

// ---------------------------------------------------------------- 机位
const CAM = {
  A: { k0: 0.945, k1: 0.980, cx: 960, cy: 600 },
  B: { k0: 1.185, k1: 1.220, cx: 972, cy: 592 },
  C: { k0: 1.030, k1: 1.058, cx: 960, cy: 614 },
};
function camFor(shot, lt, dur) {
  const m = CAM[shot];
  const k = lerp(m.k0, m.k1, E.io2(clamp(lt / dur, 0, 1)));
  const jx = Math.sin(lt * 2.13) * 1.4 + Math.sin(lt * 5.7) * 0.5;
  const jy = Math.cos(lt * 1.71) * 1.2 + Math.cos(lt * 4.9) * 0.45;
  return { k, cx: m.cx, cy: m.cy, jx, jy };
}
function camApply(c, cam) {
  c.translate(W / 2 + cam.jx, H / 2 + cam.jy);
  c.scale(cam.k, cam.k);
  c.translate(-cam.cx, -cam.cy);
}

// ---------------------------------------------------------------- 粒子
function dot(c, x, y, r, color, seed, amp = 1.6) {
  fillPoly(c, boil(circlePts(x, y, r, 0, r * (0.8 + 0.4 * hs(seed, 1))), seed, amp, 26), color);
}
function spark(c, x, y, r, color, seed) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + hs(seed, i) * 0.3;
    const rr = i % 2 ? r * 0.30 : r * (1 + 0.22 * hs(seed, i, 3));
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  fillPoly(c, boil(pts, seed, 0.9, 20), color);
}
function smokePuff(c, x, y, r, alpha, seed) {
  c.save(); c.globalAlpha = alpha; c.fillStyle = PAL.ink;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + hs(seed, i) * 0.9;
    const rr = r * (0.55 + 0.5 * hs(seed, i, 2));
    polyPath(c, boil(circlePts(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, rr, 18), seed + i * 7, 2.4, 40));
    c.closePath();
  }
  c.fill(); c.restore();
}

// ---------------------------------------------------------------- 火焰（v2）
// 舌状焰：底部鼓起、上端收尖、随 t 摆动
function tongue(seed, t, h, w, N = 16) {
  const L = [], R = [];
  const sway = Math.sin(t * 7.6 + seed) * 0.24 + Math.sin(t * 17.3 + seed * 1.7) * 0.10;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const y = -h * u;
    const prof = Math.pow(1 - Math.pow(u, 1.55), 0.72);
    const lobe = 1 + 0.24 * Math.sin(Math.PI * 2.1 * u + seed);
    const half = w * prof * lobe;
    const cx = sway * h * 0.34 * Math.pow(u, 2.2) + Math.sin(t * 5.9 + u * 6 + seed) * w * 0.18 * u;
    L.push([cx - half, y]); R.push([cx + half, y]);
  }
  const tip = [(L[N][0] + R[N][0]) / 2 + Math.sin(t * 8.9 + seed) * w * 0.55, -h * 1.14];
  return [...L, tip, ...R.reverse()];
}

// 一簇火：主导焰 + 两片侧舌，外红内黄，外缘墨线勾边
function drawFlame(c, x, y, h, w, seed, t, sv) {
  c.save(); c.translate(x, y);
  const outer = tongue(seed, t, h, w);
  fillShape(c, outer, PAL.red, { seed: 6100 + seed * 7 + sv, amp: 5.0, scale: 72 });
  for (let k = 0; k < 2; k++) {
    const s2 = seed + 11 + k * 5;
    const hh = h * (0.46 + 0.12 * hs(s2, 1));
    const ww = w * (0.42 + 0.10 * hs(s2, 2));
    const ox = (k ? 1 : -1) * w * (0.62 + 0.18 * hs(s2, 3));
    const tg = tongue(s2, t * 1.13, hh, ww).map(([px, py]) => [px + ox, py]);
    fillShape(c, tg, PAL.red, { seed: 6300 + s2 + sv, amp: 4.2, scale: 60 });
  }
  fillShape(c, tongue(seed + 1.7, t * 1.07, h * 0.60, w * 0.46), PAL.yel, { seed: 6200 + seed * 5 + sv, amp: 3.0, scale: 44 });
  inkLoop(c, resample(outer, 5, true), { seed: 6150 + seed * 9 + sv, amp: 2.8, w: 2.8, color: PAL.ink, splits: 2, t0: 8, t1: 12 });
  c.restore();
}

// ---------------------------------------------------------------- 焦痕（v2）：撕开的墨渍 + 烧穿的孔
function drawScorch(c, cx, cy, r, amt, sv) {
  if (amt <= 0.01) return;
  // 撕边轮廓：极坐标半径噪声（连续撕口，不是一堆圆叠出来的花）
  const N = 72, rad = [];
  for (let i = 0; i < N; i++) rad.push(0.58 + 0.34 * hs(71, i % 24));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < N; i++) rad[i] = (rad[(i + N - 1) % N] + rad[i] * 2 + rad[(i + 1) % N]) / 4;
  }
  const ring = (k) => {
    const out = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rr = r * rad[i] * k;
      out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.64]);
    }
    return out;
  };
  // 1) 外晕（很窄的一圈烤痕）
  c.save(); c.globalAlpha = 0.20 * amt; c.fillStyle = '#5a3a22';
  c.beginPath(); polyPath(c, boil(ring(1.10), 7000 + sv, 6.0, 80)); c.fill(); c.restore();
  // 2) 主体碳化（近黑，两层加深）
  c.save(); c.globalAlpha = 0.94 * amt; c.fillStyle = '#0e0805';
  c.beginPath(); polyPath(c, boil(ring(1.0), 7002 + sv, 5.0, 80)); c.fill(); c.restore();
  c.save(); c.globalAlpha = 0.55 * amt; c.fillStyle = '#000000';
  c.beginPath(); polyPath(c, boil(ring(0.72), 7004 + sv, 4.0, 70)); c.fill(); c.restore();
  // 3) 撕口硬边
  c.save(); c.globalAlpha = 0.85 * amt;
  inkLoop(c, resample(ring(1.0), 5, true), { seed: 7003 + sv, amp: 5.0, w: 3.6, color: '#0b0604', splits: 2, t0: 10, t1: 16 });
  c.restore();
  // 4) 烧穿的洞：3–4 个大的，洞边留一圈余烬
  c.save(); c.globalAlpha = amt;
  for (let i = 0; i < 4; i++) {
    const a = hs(81, i) * Math.PI * 2, d = r * (0.10 + 0.34 * hs(82, i));
    const px = cx + Math.cos(a) * d * 1.12, py = cy + Math.sin(a) * d * 0.70;
    const hr = r * (0.055 + 0.055 * hs(83, i));
    const hole = [];
    for (let k = 0; k < 7; k++) {
      const aa = (k / 7) * Math.PI * 2;
      const rr = hr * (0.55 + 0.85 * hs(84, i, k));
      hole.push([px + Math.cos(aa) * rr, py + Math.sin(aa) * rr * 0.84]);
    }
    // 余烬圈
    c.save(); c.globalAlpha = 0.65 * amt; c.strokeStyle = PAL.red; c.lineWidth = 2.4;
    c.beginPath();
    for (const [hx, hy] of hole) c.lineTo(hx, hy);
    c.closePath(); c.stroke(); c.restore();
    // 洞（纸背光）
    c.beginPath(); polyPath(c, boil(hole, 7400 + i + sv, 1.2, 16));
    c.fillStyle = PAL.hi; c.fill();
  }
  c.restore();
  // 5) 边缘散落的灰片
  c.save(); c.globalAlpha = 0.55 * amt;
  for (let i = 0; i < 14; i++) {
    const a = hs(95, i) * Math.PI * 2;
    const kx = 1.06 + 0.26 * hs(96, i);
    const px = cx + Math.cos(a) * r * rad[i % N] * kx;
    const py = cy + Math.sin(a) * r * rad[i % N] * kx * 0.64;
    dot(c, px, py, 1.6 + 2.6 * hs(97, i), '#1b110a', 7600 + i + sv, 1.2);
  }
  c.restore();
}

// ---------------------------------------------------------------- 朱砂印（v2）
function drawSeal(c, x, y, amt, sv) {
  if (amt <= 0) return;
  const s = E.outBack(clamp(amt, 0, 1), 2.6);
  c.save();
  c.translate(x, y);
  c.rotate(-0.055);
  c.scale(s, s);
  const SS = 212, half = SS / 2, edges = 14, poly = [];
  for (let i = 0; i <= edges; i++) poly.push([-half + (SS * i) / edges, -half + (hs(101, i % edges) - 0.5) * 5]);
  for (let i = 1; i <= edges; i++) poly.push([half + (hs(102, i % edges) - 0.5) * 5, -half + (SS * i) / edges]);
  for (let i = 1; i <= edges; i++) poly.push([half - (SS * i) / edges, half + (hs(103, i % edges) - 0.5) * 5]);
  for (let i = 1; i < edges; i++) poly.push([-half + (hs(104, i) - 0.5) * 5, half - (SS * i) / edges]);
  c.globalAlpha = 0.95;
  fillShape(c, boil(poly, 8100 + sv, 4.2, 40), PAL.red, { seed: 8200 + sv, amp: 3.0 });
  // 白文两字竖排
  c.globalAlpha = 1;
  let yy = -half + 14;
  for (const ch of ['无', '字']) {
    const G = GLY2[ch];
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const P of G.polys) for (const [px, py] of P) { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py); }
    const gw = (x1 - x0) * SEAL_SCALE, gh = (y1 - y0) * SEAL_SCALE;
    c.save();
    c.translate(-gw / 2 - x0 * SEAL_SCALE, yy + 40 - y0 * SEAL_SCALE - gh / 2);
    c.scale(SEAL_SCALE, SEAL_SCALE);
    fillGlyph(c, ch, 0, 0, PAL.cream, 8300 + sv + ch.charCodeAt(0), 1, 0.8, G);
    c.restore();
    yy += 96;
  }
  // 缺口（章缺角）
  c.save(); c.globalAlpha = 0.9; c.fillStyle = PAL.cream;
  const nicks = [[-half + 18, -half + 26, 26], [half - 10, half - 34, 34], [-half + 40, half - 8, 22]];
  for (let i = 0; i < nicks.length; i++) {
    const [nx, ny, nr] = nicks[i];
    fillPoly(c, boil([[nx - nr, ny], [nx, ny - nr * 0.9], [nx + nr * 0.5, ny + nr * 0.4]], 8400 + i + sv, 2.0, 20), PAL.cream);
  }
  // 斑驳
  for (let i = 0; i < 16; i++) {
    const px = -half + hs(111, i) * SS, py = -half + hs(112, i) * SS;
    c.beginPath(); polyPath(c, boil(circlePts(px, py, 1.4 + 3.0 * hs(113, i), 9), 8500 + i + sv, 0.7, 12)); c.fill();
  }
  c.restore();
  // 印外朱砂飞溅
  c.save(); c.globalAlpha = 0.5;
  for (let i = 0; i < 7; i++) {
    const a = hs(121, i) * Math.PI * 2, d = half * (1.05 + 0.22 * hs(122, i));
    dot(c, x + Math.cos(a) * d * s, y + Math.sin(a) * d * s, 2.2 + 2.6 * hs(123, i), PAL.red, 8600 + i + sv, 1.0);
  }
  c.restore();
}

// ---------------------------------------------------------------- 转场 1：斜墨刷
function inkWipe(c, u, sv, edgeX) {
  const half = 248 + 54 * Math.sin(u * 8);
  const L = [], R = [];
  for (let i = 0; i <= 20; i++) {
    const y = -160 + (i / 20) * (H + 320);
    const ex = edgeX(y);
    L.push([ex - half + (hs(201, i) - 0.5) * 26, y]);
    R.push([ex + half * (0.55 + 0.5 * hs(202, i)) + (hs(203, i) - 0.5) * 26, y]);
  }
  fillPoly(c, [...L, ...R.reverse()], PAL.ink);
  // 前缘飞白：几道干笔
  c.save(); c.globalAlpha = 0.8;
  for (let i = 0; i < 8; i++) {
    const y0 = 40 + i * 140 + hs(204, i) * 36;
    const ex = edgeX(y0);
    inkStroke(c, [[ex + half * 0.6, y0], [ex + half * 0.6 + 140 + 120 * hs(205, i), y0 + 14]],
      { seed: 8700 + i + sv, color: PAL.ink, w: 4 + 6 * hs(206, i), amp: 3.6, t0: 8, t1: 26 });
  }
  c.restore();
}

// ---------------------------------------------------------------- 转场 2：烧穿的焦黑撕边
function burnEdge(c, y, u, sv, t) {
  const N = 22, top = [], bot = [];
  for (let i = 0; i <= N; i++) {
    const x = -80 + (i / N) * (W + 160);
    const wob = Math.sin(i * 1.43 + t * 7.5) * 22 + (hs(301, i) - 0.5) * 26;
    top.push([x, y + wob]);
    bot.push([x, y + 104 + Math.sin(i * 0.9 + t * 5) * 64 + (hs(303, i) - 0.5) * 56]);
  }
  // 焦黑主体
  fillPoly(c, [...top, ...bot.reverse()], '#140d09');
  // 上缘红边（还在烧）
  c.save(); c.globalAlpha = 0.92;
  const rim = [];
  for (let i = 0; i <= N; i++) rim.push([top[i][0], top[i][1] + 2]);
  for (let i = N; i >= 0; i--) rim.push([top[i][0], top[i][1] + 19 + (hs(302, i) - 0.5) * 10]);
  fillPoly(c, rim, PAL.red);
  c.restore();
  // 上缘火星
  for (let i = 0; i < 26; i++) {
    const x = -40 + hs(311, i) * (W + 80);
    const yy = y + Math.sin(x * 0.006 + t * 6) * 20 - 10 - hs(312, i) * 70;
    c.save(); c.globalAlpha = 0.9;
    spark(c, x, yy, 6 + 9 * hs(313, i), i % 3 ? PAL.yel : PAL.red, 9600 + i + sv);
    c.restore();
  }
  // 边缘零星火舌（不是一排，只有 3 处还在烧）
  for (let i = 0; i < 3; i++) {
    const bx = 260 + i * 620 + hs(331, i) * 120;
    const hh = 96 + 70 * hs(332, i);
    c.save(); c.globalAlpha = 0.95;
    drawFlame(c, bx, y - 6, hh, 46 + 18 * hs(333, i), 70 + i * 5.3, t, sv);
    c.restore();
  }
  // 烟
  for (let i = 0; i < 5; i++) smokePuff(c, 180 + i * 400, y - 30 - hs(321, i) * 50, 130 + 80 * hs(322, i), 0.10, 9700 + i + sv);
}

// ---------------------------------------------------------------- 字对
const PAIR = { da: [0, 0], ji: [0, 0], w: 0 };
function drawPair(c, o) {
  const { k = 1, cx = 960, by = 610, fa = 1, fb = 1, seed = 1000, burn = 0, tips = false } = o;
  c.save();
  c.translate(cx, by); c.scale(k, k);
  const ta = writeGlyph(c, '妲', PAIR.da[0], PAIR.da[1], fa, seed, { w: 5 });
  const tb = writeGlyph(c, '己', PAIR.ji[0], PAIR.ji[1], fb, seed + 500, { w: 5 });
  if (burn > 0.02) {
    fillGlyph(c, '妲', PAIR.da[0], PAIR.da[1], PAL.ink, seed + 900, 0.62 * burn, 2.6);
    fillGlyph(c, '己', PAIR.ji[0], PAIR.ji[1], PAL.ink, seed + 940, 0.62 * burn, 2.6);
  }
  c.restore();
  if (!tips) return null;
  return [ta && [cx + ta[0] * k, by + ta[1] * k], tb && [cx + tb[0] * k, by + tb[1] * k]];
}

// ---------------------------------------------------------------- 分镜 A
const A = { dropEnd: 0.62, wA: 0.74, wAe: 1.92, wB: 1.92, wBe: 2.68, line: [2.70, 2.98] };
function shotA(c, t) {
  const sv = bv(Math.round(t * FPS));
  if (t < A.dropEnd + 0.05) {
    const u = clamp(t / A.dropEnd, 0, 1);
    const y = lerp(-140, 470, E.in2(u));
    const r = 15 + 7 * u;
    c.save(); c.globalAlpha = 0.95;
    if (u < 0.985) {
      const tail = 60 + 260 * u, tipY = y - tail, L = [], R = [];
      for (let i = 0; i <= 10; i++) { const v = i / 10, half = r * Math.pow(v, 0.55); L.push([880 - half, tipY + (y - tipY) * v]); R.push([880 + half, tipY + (y - tipY) * v]); }
      fillPoly(c, boil([...L, ...R.reverse()], 120 + sv, 1.8, 40), PAL.ink);
    }
    dot(c, 880, y, r, PAL.ink, 60 + sv, 1.8);
    c.restore();
  }
  if (t >= A.dropEnd - 0.02) {
    const u = clamp((t - A.dropEnd) / 0.9, 0, 1);
    fillPoly(c, boil(circlePts(880, 470, 46 + 16 * E.out3(clamp(u * 1.6, 0, 1)), 0, 52), 200 + sv, 3.4, 46), PAL.ink);
    for (let i = 0; i < 8; i++) {
      const a = hs(9, i) * Math.PI * 2, d = 60 + 120 * E.out3(u) * (0.6 + 0.7 * hs(9, i, 1));
      const rr = (5 + 7 * hs(9, i, 2)) * (1 - 0.55 * u);
      if (rr > 1) dot(c, 880 + Math.cos(a) * d, 470 + Math.sin(a) * d * 0.7, rr, PAL.ink, 300 + i + sv, 1.2);
    }
    if (u < 0.75) {
      c.save(); c.globalAlpha = 0.30 * (1 - u / 0.75);
      const rr = 60 + 150 * E.out3(u);
      inkLoop(c, circlePts(880, 470, rr, 0, rr * 1.05), { seed: 500 + sv, amp: 2.6, w: 4, t0: 8, t1: 8 });
      c.restore();
    }
  }
  const fa = clamp((t - A.wA) / (A.wAe - A.wA), 0, 1);
  const fb = clamp((t - A.wB) / (A.wBe - A.wB), 0, 1);
  const tips = drawPair(c, { k: 1.00, cx: 960, by: 610, fa, fb, seed: 1000, tips: true });
  [[tips && tips[0], fa], [tips && tips[1], fb]].forEach(([p, f]) => {
    if (p && f > 0.01 && f < 0.995) {
      dot(c, p[0], p[1], 7, PAL.ink, 700 + sv, 1.1);
      c.save(); c.globalAlpha = 0.5; dot(c, p[0] - 12, p[1] - 16, 3, PAL.ink, 710 + sv, 1.1); c.restore();
    }
  });
  const und = clamp((t - A.line[0]) / (A.line[1] - A.line[0]), 0, 1);
  if (und > 0) {
    c.save(); c.globalAlpha = 0.92;
    inkStroke(c, [[636, 700], [lerp(636, 1320, E.out3(und)), 694]], { seed: 800 + sv, color: PAL.red, w: 9, t0: 18, t1: 26, amp: 2.6 });
    c.restore();
  }
}

// ---------------------------------------------------------------- 分镜 B
const B = { q1: 0.16, q2: 0.50, tag: [0.56, 1.34], fire: 1.42, fireFull: 1.82, burn0: 1.70 };
function shotB(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  drawPair(c, { k: 1.16, cx: 960, by: 566, fa: 1, fb: 1, seed: 1000 });
  const q1 = clamp((lt - B.q1) / 0.40, 0, 1), q2 = clamp((lt - B.q2) / 0.40, 0, 1);
  if (q1 > 0) {
    const s = E.outBack(q1, 2.4);
    c.save(); c.translate(1382, 470); c.rotate(-0.16 + 0.05 * Math.sin(lt * 3)); c.scale(s * 1.02, s * 1.02);
    writeGlyph(c, '？', -75, 75, clamp(q1 * 1.9, 0, 1), 3000 + sv, { color: PAL.red, w: 8 });
    c.restore();
  }
  if (q2 > 0) {
    const s = E.outBack(q2, 2.6);
    c.save(); c.translate(540, 336); c.rotate(0.22); c.scale(s * 0.76, s * 0.76);
    writeGlyph(c, '？', -75, 75, clamp(q2 * 1.9, 0, 1), 3200 + sv, { color: PAL.yel, w: 9 });
    c.restore();
  }
  const tag = clamp((lt - B.tag[0]) / (B.tag[1] - B.tag[0]), 0, 1);
  if (tag > 0) {
    const txt = '长什么样';
    const adv = [...txt].map((ch) => GLY[ch].width * TAG_SCALE + 6);
    const total = adv.reduce((a, b) => a + b, 0) - 6;
    let x = 960 - total / 2;
    c.save();
    c.beginPath(); c.rect(x - 30, 792, (total + 60) * E.out3(tag), 150); c.clip();
    [...txt].forEach((ch, i) => {
      c.save(); c.translate(x, 880); c.scale(TAG_SCALE, TAG_SCALE);
      fillGlyph(c, ch, 0, 0, PAL.ink, 4000 + sv + i * 31, 0.92, 1.2);
      c.restore();
      x += adv[i];
    });
    c.restore();
  }
  const fire = K(lt, [[B.fire, 0], [B.fireFull, 1]]);
  if (fire > 0.01) {
    // 4 簇，高矮胖瘦刻意不齐，簇间留空
    const cl = [
      { x: 706, y: 738, h: 190, w: 86 },
      { x: 872, y: 744, h: 300, w: 104 },
      { x: 1032, y: 740, h: 236, w: 92 },
      { x: 1196, y: 746, h: 322, w: 110 },
    ];
    c.save(); c.globalAlpha = 0.10 * fire;
    for (let i = 0; i < 3; i++) {
      fillShape(c, boil(circlePts(780 + i * 220, 716, 118 + 22 * Math.sin(lt * 3 + i), 0, 165), 5500 + i + sv, 8, 90), PAL.red, { seed: 5600 + i + sv, amp: 4 });
    }
    c.restore();
    for (let i = 0; i < cl.length; i++) {
      const f = cl[i];
      const h = f.h * fire * (0.86 + 0.14 * Math.sin(lt * 11 + i * 2.1));
      const w = f.w * fire * (0.93 + 0.07 * Math.sin(lt * 17 + i));
      drawFlame(c, f.x, f.y, h, w, i * 4.7 + 0.4, lt, sv);
      // 飘焰：主焰上方 0.25~0.45h 处的游离小舌
      for (let k = 0; k < 2; k++) {
        const sd = 120 + i * 13 + k * 7;
        const hy = f.y - h * (1.18 + 0.16 * hs(sd, 1) + 0.10 * Math.sin(lt * 2.3 + k));
        const hh = h * (0.16 + 0.10 * hs(sd, 2));
        const ww = w * (0.22 + 0.10 * hs(sd, 3));
        if (hh < 8) continue;
        fillShape(c, tongue(sd, lt * 1.35, hh, ww), PAL.red, { seed: 6400 + sd + sv, amp: 3.2, scale: 46 });
      }
    }
    for (let i = 0; i < 24; i++) {
      const t0 = B.fire + hs(21, i) * 1.1;
      if (lt < t0) continue;
      const age = (lt - t0) / (1.1 + 0.6 * hs(22, i));
      if (age > 1) continue;
      const x = 650 + hs(23, i) * 640 + Math.sin(age * 6 + i) * 40 * age;
      const y = 700 - age * (250 + 300 * hs(24, i));
      c.save(); c.globalAlpha = clamp((1 - age) * 1.2, 0, 1);
      spark(c, x, y, (6 + 10 * hs(25, i)) * (0.6 + 0.6 * (1 - age)), i % 3 ? PAL.yel : PAL.red, 7000 + i + sv);
      c.restore();
    }
    for (let i = 0; i < 5; i++) {
      const t0 = B.fire + 0.28 + i * 0.34;
      if (lt < t0) continue;
      const age = clamp((lt - t0) / 1.9, 0, 1);
      smokePuff(c, 740 + i * 108 + Math.sin(age * 3 + i) * 28, 600 - age * 330, 62 + 120 * age, 0.13 * (1 - age) * fire, 8000 + i + sv);
    }
    const burn = K(lt, [[B.burn0, 0], [3.10, 1]]);
    if (burn > 0.02) {
      c.save(); c.globalAlpha = 0.75 * burn;
      inkStroke(c, [[648, 706], [900, 696], [1150, 702], [1310, 706]], { seed: 9100 + sv, color: PAL.red, w: 4, t0: 30, t1: 40, amp: 5.0 });
      c.restore();
    }
  }
}

// ---------------------------------------------------------------- 分镜 C
const C = { ash: 0.20, scorch0: 0.55, scorch1: 1.85, seal: 1.96 };
function shotC(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  drawScorch(c, 972, 744, 248, K(lt, [[C.scorch0, 0], [C.scorch1, 1]]), sv);
  drawPair(c, { k: 1.00, cx: 960, by: 640, fa: 1, fb: 1, seed: 1000, burn: 0.85 });
  // 烧缺：字的下缘被吃掉一块，露出纸
  const eat = K(lt, [[C.scorch0 + 0.15, 0], [C.scorch0 + 0.95, 1]]);
  if (eat > 0.01) {
    c.save();
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const bx = 742 + i * 86 + hs(151, i) * 34;
      const by = 648 + hs(152, i) * 18;
      const rr = (18 + 16 * hs(153, i)) * eat;
      polyPath(c, boil(circlePts(bx, by, rr, 14), 7800 + i + sv, 2.6, 28));
    }
    c.clip();
    drawPaper(c);
    c.restore();
  }
  const fire = K(lt, [[0, 0.80], [0.60, 0.12], [1.05, 0]]);
  if (fire > 0.01) {
    const bases = [[672, 742], [800, 748], [906, 744], [1014, 748], [1122, 742], [1240, 748]];
    for (let i = 0; i < bases.length; i++) {
      drawFlame(c, bases[i][0], bases[i][1], (130 + 90 * hs(31, i)) * fire, (46 + 18 * hs(32, i)) * fire, 40 + i * 2.7, lt, sv);
    }
  }
  for (let i = 0; i < 6; i++) {
    const age = clamp((lt - 0.1 - i * 0.12) / 2.0, 0, 1);
    if (age <= 0 || age >= 1) continue;
    smokePuff(c, 720 + i * 96 + Math.sin(age * 2.6 + i) * 40, 700 - age * 420, 70 + 150 * age, 0.12 * (1 - age), 9200 + i + sv);
  }
  if (lt > C.ash) {
    for (let i = 0; i < 30; i++) {
      const t0 = C.ash + hs(41, i) * 0.9;
      if (lt < t0) continue;
      const age = clamp((lt - t0) / 1.5, 0, 1);
      const x = 640 + hs(42, i) * 680 + Math.sin(age * 4 + i) * 44;
      const y = 730 - age * (250 + 320 * hs(43, i));
      c.save(); c.globalAlpha = 0.7 * (1 - age);
      dot(c, x, y, 2.2 + 3.6 * hs(44, i), PAL.ink, 9500 + i + sv, 1.6);
      c.restore();
    }
  }
  drawSeal(c, 1570, 872, clamp((lt - C.seal) / 0.30, 0, 1), sv);
}

// ---------------------------------------------------------------- 主渲染
export async function init(canvas, dpr = 1) {
  DPR = dpr || 1;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  IMG.paper = await load('assets/paper_base.jpg');
  IMG.tooth = await load('assets/paper_tooth.png');
  IMG.dust = [await load('assets/dust_ink_01.png'), await load('assets/dust_ink_02.png')];
  const opentype = (await import('opentype')).default || (await import('opentype'));
  const bufA = await (await fetch('assets/font/LongCang-Regular.ttf')).arrayBuffer();
  const bufB = await (await fetch('assets/font/LXGWMarkerGothic-Regular.ttf')).arrayBuffer();
  FONT = opentype.parse(bufA);
  FONT_B = opentype.parse(bufB);
  for (const ch of '妲己？长什么样') GLY[ch] = glyphPolys(FONT, ch, BIG);
  for (const ch of '无字') GLY2[ch] = glyphPolys(FONT_B, ch, BIG);
  const gd = glyphBox('妲'), gj = glyphBox('己');
  const gap = 44, total = gd.w + gap + gj.w;
  PAIR.da = [-total / 2 - gd.x0, 0];
  PAIR.ji = [-total / 2 + gd.w + gap - gj.x0, 0];
  PAIR.w = total;
}

export function render(t) {
  const f = Math.round(t * FPS), D = f, sv = bv(D);
  const c = ctx;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = PAL.cream; c.fillRect(0, 0, W, H);

  const inT1 = t >= S.T1a && t < S.T1b;
  const inB = t >= B0 && t < S.B1;
  const inT2 = t >= S.T2a && t < S.T2b;

  if (t < S.A1) {
    camApply(c, camFor('A', t, S.A1));
    drawPaper(c); shotA(c, t);
  }

  if (inT1) {
    const u = inv(S.T1a, S.T1b, t);
    // 底：B 开头
    camApply(c, camFor('B', 0, S.B1 - B0));
    drawPaper(c); shotB(c, 0.02);
    // 墨刷位置（斜边：越往下越靠右，像手腕带出来的斜笔）
    const xw = lerp(-420, W + 420, E.io2(u));
    const shear = 0.30;
    const edgeX = (y) => xw + (y - H / 2) * shear;
    // 上：A 只保留墨刷右侧
    c.save();
    camApply(c, camFor('A', S.A1, S.A1));
    c.beginPath();
    c.moveTo(edgeX(-300), -300);
    c.lineTo(W + 900, -300);
    c.lineTo(W + 900, H + 300);
    c.lineTo(edgeX(H + 300), H + 300);
    c.closePath(); c.clip();
    drawPaper(c); shotA(c, Math.min(t, S.A1));
    c.restore();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    inkWipe(c, u, sv, edgeX);
  }

  if (inB) {
    camApply(c, camFor('B', t - B0, S.B1 - B0));
    drawPaper(c); shotB(c, t - B0);
  }

  if (inT2) {
    const u = inv(S.T2a, S.T2b, t);
    const front = lerp(H + 220, -220, E.io2(u));
    camApply(c, camFor('C', 0.02, S.C1 - C0));
    drawPaper(c); shotC(c, 0.02);
    c.save();
    c.beginPath(); c.rect(-300, -300, W + 600, front + 300); c.clip();
    camApply(c, camFor('B', S.B1 - B0, S.B1 - B0));
    drawPaper(c); shotB(c, S.B1 - B0);
    c.restore();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    burnEdge(c, front, u, sv, t);
  }

  if (t >= C0) {
    camApply(c, camFor('C', t - C0, S.C1 - C0));
    drawPaper(c); shotC(c, t - C0);
  }

  drawTooth(c, D);
  c.save();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(28,22,19,0)');
  g.addColorStop(1, 'rgba(28,22,19,0.20)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

export function linkAt() { return null; }
export const SHOTS = S;
