// shouhui · 012_商纣王 · 前 20 秒（v3：按剧情推进分镜 + 妲己形象）
// 风格：mg-styles-15 / 05-cel-boil。1920×1080 / 24fps / 19.75s / 474 帧
//
// 分镜（按叙事节拍，不等分）：
//   A 0.00–3.60 (3.60) 设问：墨滴落纸 → 写「妲己」→ 朱砂横线
//   T1 3.60–3.86       斜墨刷承接
//   B 3.86–7.80 (3.94) 「一个字都没写」：空白卷册展开，笔尖悬停不落墨
//   T2 7.80–8.30       竹简自上方落下（落下的就是 C 镜的竹简）
//   C 8.30–12.40 (4.10)「先秦的记载里，总共就两处」：竹简 + 两处朱圈
//   T3 12.40–12.90     墨泛（自下而上淹没）
//   D 12.90–16.40 (3.50)「没长相」：妲己背影登场（举袖·掩面），殿柱 + 缓推
//   E 16.40–19.75 (3.35) 抬袖 → 墨没全屏 → 只剩笄上一点朱

import { PAL, hs, clamp, lerp, inv, E, K, resample, prefix, circlePts, boil, polyPath, fillPoly, inkStroke, inkLoop, fillShape } from './engine.js';

export const W = 1920, H = 1080, FPS = 24;
let ctx, DPR = 1;
const IMG = {};
let FONT = null, FONT_B = null;
const GLY = {}, GLY2 = {};
const QS = new URLSearchParams(location.search);
export const V5 = QS.get('v5') === '1';
const bv = (D) => (D % 4);

const BIG = 340, TAG_SCALE = 0.25;

// 竹简正文：《尚书·牧誓》原文（去标点 28 字，右起竖排）
// 「王曰：古人有言曰：牝鸡无晨。牝鸡之晨，惟家之索。今商王受，惟妇言是用。」
const SLIP_LINES = ['王曰古人有', '言曰牝鸡无', '晨牝鸡之晨', '惟家之索', '今商王受', '惟妇言', '是用'];
const SLIPGLY = {}, SLIPPOS = [], SLIPTEX = [];

// 分镜表
const S = { A1: 3.60, T1a: 3.60, T1b: 3.86, B1: 7.80, T2a: 7.80, T2b: 8.30, C1: 12.40, T3a: 12.40, T3b: 12.90, D1: 16.40, E1: 19.75 };
const B0 = S.T1b, C0 = S.T2b, D0 = S.T3b;

// ---------------------------------------------------------------- 字形
function glyphPolys(font, ch, size) {
  const g = font.charToGlyph(ch);
  const path = g.getPath(0, 0, size);
  const polys = []; let cur = [], lx = 0, ly = 0;
  for (const cmd of path.commands) {
    if (cmd.type === 'M') { if (cur.length > 2) polys.push(cur); cur = [[cmd.x, cmd.y]]; lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'L') { cur.push([cmd.x, cmd.y]); lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'Q') { for (let k = 1; k <= 6; k++) { const u = k / 6, a = (1 - u) ** 2, b = 2 * u * (1 - u), cc = u * u; cur.push([a * lx + b * cmd.x1 + cc * cmd.x, a * ly + b * cmd.y1 + cc * cmd.y]); } lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'C') { for (let k = 1; k <= 8; k++) { const u = k / 8, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, cc = 3 * u * u * (1 - u), d = u ** 3; cur.push([a * lx + b * cmd.x1 + cc * cmd.x2 + d * cmd.x, a * ly + b * cmd.y1 + cc * cmd.y2 + d * cmd.y]); } lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'Z') { if (cur.length > 2) polys.push(cur); cur = []; }
  }
  if (cur.length > 2) polys.push(cur);
  const area = (P) => { let A = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; } return Math.abs(A / 2); };
  polys.sort((a, b) => area(b) - area(a));
  return { polys, width: g.advanceWidth * (size / font.unitsPerEm) };
}
function bboxOf(polys) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const P of polys) for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

// 每片简预渲染成一张透明贴图（真字，竖排），避免每帧重算 28 个字的轮廓
function buildSlipTex() {
  const SZ = 100, CHAR_H = 74, Y0 = 138;
  for (let i = 0; i < SLIPS; i++) {
    const line = SLIP_LINES[SLIPS - 1 - i];   // 右起读
    const n = line.length;
    const sp = n > 1 ? Math.min(118, 430 / (n - 1)) : 0;
    SLIPPOS[i] = [];
    const dpr = 2;
    const cv = document.createElement('canvas');
    cv.width = SV_W * dpr; cv.height = SV_H * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    for (let k = 0; k < n; k++) {
      const ch = line[k];
      const G = SLIPGLY[ch];
      const cy = Y0 + k * sp;
      SLIPPOS[i].push({ k, cy });
      if (!G) continue;
      const bb = G.bb;
      const sc = CHAR_H / bb.h;
      g.save();
      g.translate(SV_W / 2, cy);
      g.scale(sc, sc);
      g.translate(-(bb.x0 + bb.w / 2), -(bb.y0 + bb.h / 2));
      // 墨渗：先一层淡、再一层实，边缘带 boil
      for (const pass of [{ a: 0.20, d: 3.0, w: 2 }, { a: 0.94, d: 0 }]) {
        g.save(); g.globalAlpha = pass.a;
        g.beginPath();
        for (const P of G.polys) {
          const dense = resample(P, 3.0, true);
          polyPath(g, pass.d ? boil(dense.map(([x, y]) => [x + pass.d, y + pass.d * 0.5]), 900 + k * 7, pass.w, 40) : boil(dense, 700 + k * 7 + i, 1.1, 46));
        }
        g.fillStyle = '#1b120c'; g.fill('nonzero'); g.restore();
      }
      g.restore();
    }
    SLIPTEX[i] = cv;
  }
}
const SV_W = 104, SV_H = 700;   // 与 SLIP_W / SLIP_H 同值

function glyphBox(ch) {
  const G = GLY[ch];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const P of G.polys) for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
function writeGlyph(c, ch, ox, oy, frac, seed, o = {}) {
  const G = GLY[ch];
  if (!G || frac <= 0) return null;
  const sv = bv(Math.floor(seed)), color = o.color ?? PAL.ink, w = o.w ?? 5;
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
    c.save(); c.globalAlpha = a; c.beginPath();
    for (const P of G.polys) {
      const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.2, true);
      polyPath(c, boil(dense, seed + 900 + sv, 1.5, 55));
    }
    c.fillStyle = color; c.fill('nonzero'); c.restore();
  }
  return tip;
}
function fillGlyph(c, ch, ox, oy, color, seed, alpha = 1, amp = 1.4, G = null) {
  G = G || GLY[ch];
  if (!G) return;
  const sv = bv(Math.floor(seed));
  c.save(); c.globalAlpha = alpha; c.beginPath();
  for (const P of G.polys) {
    const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.2, true);
    polyPath(c, boil(dense, seed + sv, amp, 55));
  }
  c.fillStyle = color; c.fill('nonzero'); c.restore();
}

// ---------------------------------------------------------------- 纸 / 机位
function drawPaper(c) { const s = 1.05; c.drawImage(IMG.paper, (W - W * s) / 2, (H - H * s) / 2, W * s, H * s); }
function drawTooth(c, D) {
  const v = bv(D);
  const ox = Math.floor(hs(v, 51) * 470), oy = Math.floor(hs(v, 52) * 310);
  c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.5;
  c.drawImage(IMG.tooth, ox, oy, W, H, 0, 0, W, H);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.20;
  const dm = IMG.dust[v % 2];
  c.save(); c.translate(W / 2, H / 2); c.scale(v % 2 ? -1 : 1, 1); c.drawImage(dm, -W / 2, -H / 2, W, H); c.restore();
  c.restore();
}
const CAM = {
  A: { k0: 0.95, k1: 0.98, cx: 960, cy: 600 },
  B: { k0: 1.06, k1: 1.03, cx: 960, cy: 560 },
  C: { k0: 1.34, k1: 1.28, cx: 960, cy: 560 },
  D: { k0: 0.98, k1: 1.06, cx: 900, cy: 560 },
  E: { k0: 1.04, k1: 1.12, cx: 960, cy: 540 },
};
function camFor(shot, lt, dur) {
  const m = CAM[shot];
  const k = lerp(m.k0, m.k1, E.io2(clamp(lt / dur, 0, 1)));
  return { k, cx: m.cx, cy: m.cy, jx: Math.sin(lt * 2.13) * 1.4, jy: Math.cos(lt * 1.71) * 1.2 };
}
function camApply(c, cam) {
  c.translate(W / 2 + cam.jx, H / 2 + cam.jy);
  c.scale(cam.k, cam.k);
  c.translate(-cam.cx, -cam.cy);
}

// ---------------------------------------------------------------- 小件
function dot(c, x, y, r, color, seed, amp = 1.6) {
  fillPoly(c, boil(circlePts(x, y, r, 0, r * (0.8 + 0.4 * hs(seed, 1))), seed, amp, 26), color);
}
function spark(c, x, y, r, color, seed) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + hs(seed, i) * 0.3, rr = i % 2 ? r * 0.3 : r * (1 + 0.22 * hs(seed, i, 3));
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  fillPoly(c, boil(pts, seed, 0.9, 20), color);
}

// ---------------------------------------------------------------- 分镜 A：墨滴 → 写「妲己」→ 朱砂线
const PAIR = { da: [0, 0], ji: [0, 0] };
const A = { drop: 0.55, wA: 0.72, wAe: 1.85, wB: 1.85, wBe: 2.60, q1: 2.62, q2: 2.90, line: [3.10, 3.44], pid: 0.95 };
function rrectPts(x, y, w, h, r) {
  const pts = [];
  const seg = (cx, cy, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  seg(x + w - r, y + r, -Math.PI / 2, 0); seg(x + w - r, y + h - r, 0, Math.PI / 2);
  seg(x + r, y + h - r, Math.PI / 2, Math.PI); seg(x + r, y + r, Math.PI, Math.PI * 1.5);
  return pts;
}
// 视频角色层·闪现版：t0 时刻从右侧快速滑入 + 白闪 + 墨色速度线 + 残影（可复用）
function drawVideoCharFlash(c, frames, t, x, groundY, o = {}) {
  const t0 = o.t0 ?? 0.42, slideD = o.slideD ?? 0.16;
  const emerge = clamp((t - t0) / 0.05, 0, 1);
  if (emerge <= 0) return;
  const slide = E.out3(clamp((t - t0) / slideD, 0, 1));
  const px = lerp(o.fromX ?? 1980, x, slide);
  const sv = Math.floor(t * 24) % 4;
  // 残影（滑入期间，身后两道渐隐）
  if (t < t0 + slideD + 0.14) {
    const gu = clamp((t - t0) / (slideD + 0.14), 0, 1);
    drawVideoChar(c, frames, o.tf ?? t, px + 120 + 150 * (1 - gu), groundY, { s: o.s, alpha: 0.12 * (1 - gu) });
    drawVideoChar(c, frames, o.tf ?? t, px + 240 + 260 * (1 - gu), groundY, { s: o.s, alpha: 0.07 * (1 - gu) });
  }
  drawVideoChar(c, frames, o.tf ?? t, px, groundY, { s: o.s, alpha: o.alpha ?? 1 });
  // 白闪一瞬
  const fl = 1 - clamp((t - t0) / 0.10, 0, 1);
  if (fl > 0.01) { c.save(); c.globalAlpha = 0.30 * fl; c.fillStyle = PAL.cream; c.fillRect(-20, -20, 1960, 1120); c.restore(); }
  // 速度线（墨色，向右拖尾渐隐）
  const st = clamp((t - t0) / 0.30, 0, 1);
  if (st < 1) {
    c.save(); c.globalAlpha = 0.55 * (1 - st);
    for (let i = 0; i < 6; i++) {
      const yy = 250 + i * 128 + (hs(60, i) - 0.5) * 50;
      const x0 = px + 320 + hs(61, i) * 60, x1 = 1900 - hs(62, i) * 220 * st;
      if (x1 > x0) inkStroke(c, [[x0, yy], [x1, yy + (hs(63, i) - 0.5) * 16]], { seed: 4400 + i + sv, color: PAL.ink, w: 3 + 5 * hs(64, i), t0: 6, t1: 14, amp: 2.2 });
    }
    c.restore();
  }
}
function shotA(c, t) {
  const sv = bv(Math.round(t * FPS));
  // 主：妲己大立绘——从右侧闪现（白闪+速度线+残影）
  drawVideoCharFlash(c, IMG.dajiA, t, 1180, 1012, { s: 1.06, t0: 0.42, tf: t * 0.92 + 0.42 });

  // 贴纸：名条「妲己」（左上，纸底贴纸 + 墨滴落 + 双字书写 + 朱砂线）
  const bob = Math.sin(t * 1.8) * 5;
  const pop = E.outBack(clamp((t - 0.25) / 0.5, 0, 1), 1.8);
  c.save(); c.translate(415, 470 + bob); c.rotate(-0.05); c.scale(pop * 0.5, pop * 0.5);
  c.save(); c.globalAlpha = 0.13; fillPoly(c, boil(rrectPts(-560, -370, 1120, 770, 46), 90 + sv, 2.2, 70), PAL.ink); c.restore();
  c.save(); c.globalAlpha = 0.97; fillPoly(c, boil(rrectPts(-580, -395, 1160, 810, 50), 93 + sv, 1.6, 70), '#f4ecd9'); c.restore();
  inkStroke(c, rrectPts(-580, -395, 1160, 810, 50), { seed: 96 + sv, color: PAL.ink, w: 5, t0: 12, t1: 20, amp: 1.6 });
  if (t < A.drop + 0.05) {
    const u = clamp(t / A.drop, 0, 1), y = lerp(-720, -60, E.in2(u)), r = 15 + 7 * u;
    c.save(); c.globalAlpha = 0.95;
    if (u < 0.985) {
      const tail = 60 + 260 * u, tipY = y - tail, L = [], R = [];
      for (let i = 0; i <= 10; i++) { const v = i / 10, half = r * Math.pow(v, 0.55); L.push([-80 - half, tipY + (y - tipY) * v]); R.push([-80 + half, tipY + (y - tipY) * v]); }
      fillPoly(c, boil([...L, ...R.reverse()], 120 + sv, 1.8, 40), PAL.ink);
    }
    dot(c, -80, y, r, PAL.ink, 60 + sv, 1.8);
    c.restore();
  }
  if (t >= A.drop - 0.02) {
    const u = clamp((t - A.drop) / 0.8, 0, 1);
    fillPoly(c, boil(circlePts(-80, -60, 44 + 16 * E.out3(clamp(u * 1.6, 0, 1)), 0, 50), 200 + sv, 3.4, 46), PAL.ink);
    for (let i = 0; i < 8; i++) {
      const a = hs(9, i) * Math.PI * 2, d = 60 + 120 * E.out3(u) * (0.6 + 0.7 * hs(9, i, 1));
      const rr = (5 + 7 * hs(9, i, 2)) * (1 - 0.55 * u);
      if (rr > 1) dot(c, -80 + Math.cos(a) * d, -60 + Math.sin(a) * d * 0.7, rr, PAL.ink, 300 + i + sv, 1.2);
    }
  }
  const fa = clamp((t - A.wA) / (A.wAe - A.wA), 0, 1);
  const fb = clamp((t - A.wB) / (A.wBe - A.wB), 0, 1);
  c.save(); c.translate(0, 130); c.scale(0.9, 0.9);
  const ta = writeGlyph(c, '妲', PAIR.da[0], 0, fa, 1000, { w: 5 });
  const tb = writeGlyph(c, '己', PAIR.ji[0], 0, fb, 1500, { w: 5 });
  c.restore();
  const und = clamp((t - A.line[0]) / (A.line[1] - A.line[0]), 0, 1);
  if (und > 0) {
    c.save(); c.globalAlpha = 0.92;
    inkStroke(c, [[-320, 305], [lerp(-320, 320, E.out3(und)), 299]], { seed: 800 + sv, color: PAL.red, w: 9, t0: 18, t1: 26, amp: 2.6 });
    c.restore();
  }
  c.restore();
  // 贴纸：问号 ×2（pop 弹出）
  const q1 = clamp((t - A.q1) / 0.34, 0, 1), q2 = clamp((t - A.q2) / 0.34, 0, 1);
  if (q1 > 0) {
    const s = E.outBack(q1, 2.4);
    c.save(); c.translate(680, 185); c.rotate(-0.14); c.scale(s * 0.78, s * 0.78);
    writeGlyph(c, '？', -75, 75, clamp(q1 * 1.9, 0, 1), 3000 + sv, { color: PAL.red, w: 8 });
    c.restore();
  }
  if (q2 > 0) {
    const s = E.outBack(q2, 2.6);
    c.save(); c.translate(128, 700); c.rotate(0.2); c.scale(s * 0.55, s * 0.55);
    writeGlyph(c, '？', -75, 75, clamp(q2 * 1.9, 0, 1), 3200 + sv, { color: PAL.yel, w: 9 });
    c.restore();
  }
}

// ---------------------------------------------------------------- 分镜 B：空白卷册，笔尖悬停不落墨
function drawScroll(c, open, seed) {
  c.save(); c.translate(960, 0);
  const halfW = lerp(60, 520, open), cy = 540, hh = 250;
  // 卷面
  c.save();
  fillShape(c, boil([[-halfW, cy - hh], [halfW, cy - hh], [halfW, cy + hh], [-halfW, cy + hh]], seed, 2.0, 80), '#f1e3c6', { seed: seed + 1, amp: 1.6 });
  // 纸纤维：横向短笔
  c.save(); c.globalAlpha = 0.16;
  for (let i = 0; i < 26; i++) {
    const y = cy - hh + 20 + hs(seed, i) * (hh * 2 - 40);
    const x0 = -halfW + 24 + hs(seed, i, 1) * (halfW * 2 - 48);
    inkStroke(c, [[x0, y], [x0 + 40 + 90 * hs(seed, i, 2), y + (hs(seed, i, 3) - 0.5) * 4]], { seed: seed + i, color: '#8a7358', w: 1.2, amp: 0.6, t0: 4, t1: 10 });
  }
  c.restore();
  // 界格（三道极淡横线）
  c.save(); c.globalAlpha = 0.18;
  for (let i = 1; i <= 3; i++) {
    const y = cy - hh + (i * hh * 2) / 4;
    inkStroke(c, [[-halfW + 16, y], [halfW - 16, y]], { seed: seed + 60 + i, color: '#8a7358', w: 1.6, amp: 1.0, t0: 20, t1: 30 });
  }
  c.restore();
  // 卷边（上下两道折）
  c.save(); c.globalAlpha = 0.5;
  inkStroke(c, [[-halfW, cy - hh + 6], [halfW, cy - hh + 10]], { seed: seed + 31, color: '#b9a483', w: 2.0, amp: 1.2, t0: 20, t1: 30 });
  inkStroke(c, [[-halfW, cy + hh - 8], [halfW, cy + hh - 4]], { seed: seed + 32, color: '#b9a483', w: 2.0, amp: 1.2, t0: 20, t1: 30 });
  c.restore();
  // 两端卷轴
  for (const sx of [-1, 1]) {
    const x = sx * (halfW + 22);
    c.save();
    fillShape(c, boil([[-14, -hh - 6], [14, -hh - 6], [14, hh + 6], [-14, hh + 6]].map(([px, py]) => [px + x, py + cy]), seed + (sx > 0 ? 41 : 42), 2.2, 60), PAL.ink, { seed: seed + 43, amp: 1.8 });
    c.restore();
    dot(c, x, cy - hh - 12, 9, PAL.ink, seed + (sx > 0 ? 44 : 45), 1.4);
    dot(c, x, cy + hh + 12, 9, PAL.ink, seed + (sx > 0 ? 46 : 47), 1.4);
  }
  c.restore();
  c.restore();
  return { halfW, cy, hh };
}
function shotB(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  const open = clamp(lt / 1.15, 0, 1);
  // 贴纸：空白卷册（左下，微倾+浮沉）
  const bob1 = Math.sin(lt * 1.7) * 5;
  c.save(); c.translate(-165, 285 + bob1); c.rotate(-0.045); c.scale(0.58, 0.58);
  const S0 = drawScroll(c, E.out3(open), 300);
  c.restore();
  // 主：妲己静立扇扇（vid0），画面主体
  drawVideoChar(c, IMG.daji0, lt * 0.95 + 0.25, 985, 1008, { s: 1.0, alpha: 0.97 });
  // 笔：大笔饱墨，从上方垂入，笔尖悬在纸上方不落墨（右上贴纸位）
  const hover = K(lt, [[1.50, 0], [2.32, 1]]);
  if (hover > 0) {
    const bx = 1560, by = lerp(-320, 470, E.out3(hover));
    const sway = Math.sin(lt * 2.4) * 7 * hover + Math.sin(lt * 0.9) * 3;
    c.save(); c.translate(bx + sway, by); c.rotate(Math.sin(lt * 1.7) * 0.012 * hover);
    // ---- 笔杆（竹）
    fillShape(c, [[-12, -470], [12, -470], [9, -132], [-9, -132]], PAL.ink, { seed: 500 + sv, amp: 1.1 });
    c.save(); c.globalAlpha = 0.55; c.fillStyle = PAL.cream;
    c.fillRect(-6, -462, 3.4, 322);
    c.restore();
    c.save(); c.globalAlpha = 0.95; c.fillStyle = PAL.ink;
    c.fillRect(-12, -352, 24, 6); c.fillRect(-12, -246, 24, 6);
    c.restore();
    // ---- 笔头：枣核形，顶接杆、腰最鼓、锋收成尖
    const HW = 24, LEN = 136, N = 12, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, y = -LEN + u * LEN;
      const w = u < 0.40
        ? 9 + (HW - 9) * Math.sin((u / 0.40) * Math.PI / 2)
        : HW * Math.pow(1 - (u - 0.40) / 0.60, 0.82);
      L.push([-w, y]); R.push([w, y]);
    }
    fillShape(c, [...L, ...R.reverse()], PAL.ink, { seed: 508 + sv, amp: 1.3 });
    // 笔锋：两道纸色缝把笔毛分成三束，越往下越细
    c.save(); c.globalAlpha = 0.62; c.strokeStyle = PAL.cream; c.lineCap = 'round';
    for (const [x0, x1] of [[-9, -1], [8, 1]]) {
      c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(x0, -78); c.quadraticCurveTo((x0 + x1) / 2, -36, x1, -6); c.stroke();
    }
    c.restore();
    // 笔尖将落未落的一滴墨：拉长的泪滴 + 一线墨丝
    const hang = K(lt, [[2.86, 0], [3.60, 1]]);
    if (hang > 0.02) {
      const dy = 5 + 26 * hang, dr = 2.5 + 8 * hang;
      inkStroke(c, [[0, 0], [0, Math.max(1, dy - dr)]], { seed: 522 + sv, color: PAL.ink, w: 2.0, amp: 0.4, t0: 4, t1: 6 });
      const el = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        el.push([Math.cos(a) * dr * 0.80, dy + Math.sin(a) * dr * 1.42]);
      }
      fillPoly(c, boil(el, 520 + sv, 1.1, 22), PAL.ink);
    }
    c.restore();
  }
  // 空白处的一行小字（卷册上的"没有"）：极淡墨痕
  if (lt > 2.2) {
    c.save(); c.globalAlpha = 0.10 * clamp((lt - 2.2) / 0.6, 0, 1);
    for (let i = 0; i < 5; i++) {
      inkStroke(c, [[225 + i * 62, 555], [225 + i * 62, 635]], { seed: 600 + i + sv, color: PAL.ink, w: 2.0, amp: 1.2, t0: 6, t1: 10 });
    }
    c.restore();
  }
}

// ---------------------------------------------------------------- 分镜 C：竹简 + 两处朱圈
const SLIPS = 7, SLIP_W = 104, SLIP_GAP = 16, SLIP_H = 700;
function slipX(i) { return (i - (SLIPS - 1) / 2) * (SLIP_W + SLIP_GAP); }
function drawSlips(c, lt, dropOff = 0) {
  c.save();
  const sv = bv(Math.round(lt * FPS));
  const top = 200 + dropOff;
  for (let i = 0; i < SLIPS; i++) {
    const x = slipX(i);
    const wob = Math.sin(i * 1.7) * 2;
    solidSlip(c, x + wob, top, i, sv);
  }
  // 两道编绳
  c.save(); c.globalAlpha = 0.85;
  inkStroke(c, [[slipX(0) - 30, top + 70], [slipX(SLIPS - 1) + 30, top + 74]], { seed: 700 + sv, color: PAL.ink, w: 3.0, amp: 1.6, t0: 20, t1: 24 });
  inkStroke(c, [[slipX(0) - 30, top + SLIP_H - 70], [slipX(SLIPS - 1) + 30, top + SLIP_H - 64]], { seed: 710 + sv, color: PAL.ink, w: 3.0, amp: 1.6, t0: 20, t1: 24 });
  c.restore();
  c.restore();
}
function solidSlip(c, x, y, i, sv) {
  const hw = SLIP_W / 2, r = 6;
  const pts = [
    [x - hw + r, y], [x + hw - r, y], [x + hw, y + r], [x + hw, y + SLIP_H - r],
    [x + hw - r, y + SLIP_H], [x - hw + r, y + SLIP_H], [x - hw, y + SLIP_H - r], [x - hw, y + r],
  ];
  fillShape(c, pts, '#eddfb9', { seed: 800 + i + sv, amp: 1.2 });
  c.save(); c.globalAlpha = 0.22; c.fillStyle = '#8a7358';
  c.fillRect(x - hw, y, 5, SLIP_H); c.fillRect(x + hw - 5, y, 5, SLIP_H);
  c.restore();
  // 正文（预渲染的真字贴图）
  const tex = SLIPTEX[i];
  if (tex) {
    c.save(); c.globalAlpha = 0.93;
    c.drawImage(tex, x - hw, y, SLIP_W, SLIP_H);
    c.restore();
    // 竹纹压过墨：让字吃进木头
    c.save(); c.globalAlpha = 0.09; c.fillStyle = '#7a6244';
    for (let k = 0; k < 5; k++) c.fillRect(x - hw + 1, y + 66 + k * 138, SLIP_W - 2, 1.6);
    c.restore();
  }
  // 简边
  inkStroke(c, [[x - SLIP_W / 2 + 2, y + 4], [x - SLIP_W / 2 + 2, y + SLIP_H - 4]], { seed: 810 + i + sv, color: '#6b5540', w: 1.8, amp: 1.0, t0: 8, t1: 14 });
  inkStroke(c, [[x + SLIP_W / 2 - 2, y + 4], [x + SLIP_W / 2 - 2, y + SLIP_H - 4]], { seed: 820 + i + sv, color: '#6b5540', w: 1.8, amp: 1.0, t0: 8, t1: 14 });
}
function shotC(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  // 主：妲己化狐（vidB），中偏右大立绘——朱圈落下时的命运预兆
  drawVideoChar(c, IMG.dajiB, lt * 0.9 + 0.5, 1250, 1008, { s: 0.94, alpha: 0.95 });
  // 贴纸：竹简（左侧，缩小 0.55，落下 + 朱圈动效）
  const top = 200;
  c.save(); c.translate(25, 245); c.rotate(0.02); c.scale(0.55, 0.55); c.translate(960, 0);
  drawSlips(c, lt, 0);
  // 两处朱圈：「牝鸡」的鸡（第 5 简第 3 字）与「妇言」的妇（第 2 简第 2 字）
  const r1 = clamp((lt - 1.90) / 0.46, 0, 1), r2 = clamp((lt - 2.86) / 0.46, 0, 1);
  [{ u: r1, i: 4, k: 2 }, { u: r2, i: 1, k: 1 }].forEach(({ u, i, k }) => {
    if (u <= 0) return;
    const P0 = SLIPPOS[i] && SLIPPOS[i][k];
    if (!P0) return;
    const x = slipX(i) + Math.sin(i * 1.7) * 2, y = top + P0.cy;
    const P = [], n = 38;
    for (let a = 0; a < n * u * 1.04; a++) {
      const ang = (a / n) * Math.PI * 2 - Math.PI / 2 + 0.10;
      const rx = 46 * (1 + 0.04 * Math.sin(a * 1.3)), ry = 55;
      P.push([x + Math.cos(ang) * rx, y + Math.sin(ang) * ry]);
    }
    if (P.length > 3) {
      c.save(); c.globalAlpha = 0.95;
      inkStroke(c, P, { seed: 1000 + i * 11 + k + sv, color: PAL.red, w: 7.0, t0: 14, t1: 22, amp: 1.6 });
      c.restore();
    }
  });
  c.restore();
}

// ---------------------------------------------------------------- 分镜 D/E：妲己登场 → 墨没（AI 视频抠像层）
// 人物层：VideoGen i2v 定稿造型（09）动作片段，逐帧抠像 PNG 序列
// 底图 768×1152，人物脚底约 y=1130、水平中心约 x=384；scale 0.78 时人物高约 835px，脚底贴地面
const DAJI = { x: 1310, ground: 986, scale: 0.78, fw: 768, fh: 1152, feetY: 1130, cx: 384 };
function drawVideoChar(c, frames, t, x, groundY, o = {}) {
  if (!frames || !frames.length) return;
  const idx = Math.min(frames.length - 1, Math.max(0, Math.floor(t * FPS)));
  const s = DAJI.scale * (o.s || 1);
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.drawImage(frames[idx], x - DAJI.cx * s, groundY - DAJI.feetY * s, DAJI.fw * s, DAJI.fh * s);
  c.restore();
}
// 画中画：带原背景的视频片段 + 墨色画框（A 镜开场用）
function drawVideoInset(c, frames, t, cx, cy, ih, o = {}) {
  if (!frames || !frames.length) return;
  const idx = Math.min(frames.length - 1, Math.max(0, Math.floor(t * FPS)));
  const pop = o.pop ? E.out3(clamp((o.pop[1] - o.pop[0]) / 0.4, 0, 1)) : 1;
  const s = ih / DAJI.fh * (0.94 + 0.06 * (1 - pop));
  const fw = DAJI.fw * s, fh = DAJI.fh * s;
  c.save();
  c.globalAlpha = 0.97 * (o.alpha ?? 1);
  c.translate(cx, cy); c.rotate(o.rot ?? -0.015);
  c.drawImage(frames[idx], -fw / 2, -fh / 2, fw, fh);
  c.strokeStyle = PAL.ink; c.lineWidth = 5; c.strokeRect(-fw / 2 - 7, -fh / 2 - 7, fw + 14, fh + 14);
  c.lineWidth = 1.6; c.strokeRect(-fw / 2 - 15, -fh / 2 - 15, fw + 30, fh + 30);
  c.restore();
}
function drawHall(c, seed) {
  // 殿柱：左侧竖构图（柱占左 1/4，人物压右三分线）+ 地面线
  const colX = 150, colW = 84;
  c.save(); c.globalAlpha = 0.94; c.fillStyle = PAL.ink;
  c.fillRect(colX, -80, colW, 1070);               // 柱身
  c.fillRect(colX - 18, 932, colW + 36, 60);       // 础石
  c.fillRect(colX - 22, -80, colW + 44, 30);       // 栌斗
  c.globalAlpha = 0.42; c.fillStyle = PAL.cream; c.fillRect(colX + colW / 2 - 2, 0, 4, 928);  // 高光
  c.globalAlpha = 0.22; c.fillStyle = PAL.ink; c.fillRect(0, 986, W, 3);  // 地面
  // 柱后虚影：第二根柱更远、更淡（纵深）
  c.globalAlpha = 0.16; c.fillStyle = PAL.ink;
  c.fillRect(colX + 360, -40, 52, 880);
  c.restore();
}
function shotD(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  drawHall(c, 1200);
  // 人物：vidA 掩面→露面（对应「没长相」设问），从墨中显形 + 自右向左缓步走位
  const emerge = clamp(lt / 1.1, 0, 1);
  const walkU = E.out3(clamp((lt - 0.25) / 1.9, 0, 1));
  const px = lerp(DAJI.x + 170, DAJI.x, walkU);
  drawVideoChar(c, IMG.dajiA, lt * 0.92 + 0.42, px, 994, { s: 0.92, alpha: 0.35 + 0.65 * E.out3(emerge) });
  // 脚下墨影（跟随走位）
  c.save(); c.globalAlpha = 0.16;
  fillShape(c, boil(circlePts(px, 1000, 150, 0, 34), 1300 + sv, 6, 90), PAL.ink, { seed: 1310 + sv, amp: 4 });
  c.restore();
}
function shotE(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  drawHall(c, 1200);
  // 人物：vidC 低叹→转身拂袖离去（对应「什么都不剩」——人走茶凉，墨淹没一切）
  const ES = 0.88;
  drawVideoChar(c, IMG.dajiC, lt * 0.9 + 0.5, DAJI.x, 994, { s: ES });
  // 墨没：从下往上淹没，最后全屏（压快，给退墨留时间）
  const flood = K(lt, [[1.05, 0], [1.75, 1]]);
  if (flood > 0.01) {
    const front = lerp(H + 120, -160, E.io2(flood));
    c.save();
    c.beginPath(); c.rect(-300, front, W + 600, H + 600); c.clip();
    c.fillStyle = PAL.ink; c.fillRect(-300, front, W + 600, H + 600);
    c.restore();
    const top = [];
    for (let i = 0; i <= 22; i++) {
      const x = -60 + (i / 22) * (W + 120);
      top.push([x, front + Math.sin(i * 1.3 + lt * 6) * 22 + (hs(1400, i) - 0.5) * 26]);
    }
    fillPoly(c, [...top, [W + 60, H + 300], [-60, H + 300]], PAL.ink);
    c.save(); c.globalAlpha = 0.85;
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 260 + hs(1410, i) * 80;
      inkStroke(c, [[x, front + 10], [x + 30, front - 26 - 40 * hs(1420, i)]], { seed: 1430 + i + sv, color: PAL.ink, w: 6, amp: 3.0, t0: 8, t1: 20 });
    }
    c.restore();
  }
  // 结尾：墨从两侧退开，只留中间一道竖缝，笄上一点朱定在缝心
  const recede = K(lt, [[1.80, 0], [3.15, 1]]);
  if (recede > 0.01) {
    const hx = DAJI.x, hy = 994 - 950 * DAJI.scale * ES;
    const gap = lerp(6, 128, E.out3(recede));      // 缝半宽 6→128
    // 中间露纸的竖缝（缝心在 hx，红点也在 hx）
    c.save();
    c.beginPath(); c.rect(hx - gap, -40, gap * 2, H + 80); c.clip();
    drawPaper(c);
    c.restore();
    // 缝两侧的墨边（不规则、带飞白）
    c.save();
    for (const side of [-1, 1]) {
      const ex = hx + side * gap;
      c.globalAlpha = 0.96;
      const edge = [];
      for (let i = 0; i <= 20; i++) {
        const y = -60 + (i / 20) * (H + 120);
        edge.push([ex + side * (hs(1520 + (side > 0 ? 30 : 0), i) - 0.5) * 24 + Math.sin(y * 0.012 + lt * 4) * 9, y]);
      }
      c.beginPath(); c.moveTo(edge[0][0], edge[0][1]);
      for (const [exx, ey] of edge) c.lineTo(exx, ey);
      c.lineTo(side > 0 ? W + 60 : -60, H + 80); c.lineTo(side > 0 ? W + 60 : -60, -80); c.closePath();
      c.fillStyle = PAL.ink; c.fill();
      c.globalAlpha = 0.8;
      inkStroke(c, edge, { seed: 1560 + (side > 0 ? 40 : 0) + sv, color: PAL.ink, w: 5, amp: 3.4, t0: 10, t1: 20 });
    }
    c.restore();
    // 缝心红点（笄上那一点，越退越亮，固定缝心 hx）
    c.save(); c.globalAlpha = 0.5 + 0.5 * recede;
    dot(c, hx, hy, 11, PAL.red, 1510 + sv, 1.2);
    c.restore();
  }
}

// ---------------------------------------------------------------- 转场
function inkWipe(c, u, sv, edgeX) {
  const half = 240 + 52 * Math.sin(u * 8);
  const L = [], R = [];
  for (let i = 0; i <= 20; i++) {
    const y = -160 + (i / 20) * (H + 320), ex = edgeX(y);
    L.push([ex - half + (hs(201, i) - 0.5) * 26, y]);
    R.push([ex + half * (0.55 + 0.5 * hs(202, i)) + (hs(203, i) - 0.5) * 26, y]);
  }
  fillPoly(c, [...L, ...R.reverse()], PAL.ink);
  c.save(); c.globalAlpha = 0.8;
  for (let i = 0; i < 8; i++) {
    const y0 = 40 + i * 140 + hs(204, i) * 36, ex = edgeX(y0);
    inkStroke(c, [[ex + half * 0.6, y0], [ex + half * 0.6 + 140 + 120 * hs(205, i), y0 + 14]], { seed: 8700 + i + sv, color: PAL.ink, w: 4 + 6 * hs(206, i), amp: 3.6, t0: 8, t1: 26 });
  }
  c.restore();
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
  FONT = opentype.parse(bufA); FONT_B = opentype.parse(bufB);
  for (const ch of '妲己？') GLY[ch] = glyphPolys(FONT, ch, BIG);
  for (const ch of '无字') GLY2[ch] = glyphPolys(FONT_B, ch, BIG);
  // 竹简正文：逐个字形取轮廓，主字体缺字时回退到马克笔体
  for (const ch of [...new Set(SLIP_LINES.join(''))]) {
    const f = FONT.charToGlyph(ch).index ? FONT : (FONT_B.charToGlyph(ch).index ? FONT_B : null);
    if (!f) { console.warn('[slip] 缺字', ch); continue; }
    const G = glyphPolys(f, ch, 100);
    G.bb = bboxOf(G.polys);
    SLIPGLY[ch] = G;
  }
  buildSlipTex();
  // 妲己动作视频帧（抠像 PNG 序列，D/E 镜用）
  const loadSeq = async (dir, start = 0) => {
    const arr = [];
    for (let i = start; i < start + 200; i++) {
      const im = await new Promise((res) => {
        const x = new Image();
        x.onload = () => res(x); x.onerror = () => res(null);
        x.src = `assets/vid/${dir}/${String(i).padStart(4, '0')}.png`;
      });
      if (!im) break;
      arr.push(im);
    }
    return arr;
  };
  IMG.dajiA = await loadSeq('frames_vidA');
  IMG.dajiC = await loadSeq('frames_vidC');
  IMG.daji0 = await loadSeq('frames_vid0');
  IMG.dajiB = await loadSeq('frames_vidB');
  IMG.vidCraw = await loadSeq('rawC', 1);   // ffmpeg 序号从 0001 起
  const gd = glyphBox('妲'), gj = glyphBox('己');
  const gap = 44, total = gd.w + gap + gj.w;
  PAIR.da = [-total / 2 - gd.x0, 0];
  PAIR.ji = [-total / 2 + gd.w + gap - gj.x0, 0];
}

export function render(t) {
  const D = Math.round(t * FPS), sv = bv(D);
  const c = ctx;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = PAL.cream; c.fillRect(0, 0, W, H);

  const inT1 = t >= S.T1a && t < S.T1b;
  const inB = t >= B0 && t < S.B1;
  const inT2 = t >= S.T2a && t < S.T2b;
  const inC = t >= C0 && t < S.C1;
  const inT3 = t >= S.T3a && t < S.T3b;
  const inD = t >= D0 && t < S.D1;

  if (t < S.A1) {
    camApply(c, camFor('A', t, S.A1)); drawPaper(c); shotA(c, t);
  }

  if (inT1) {
    const u = inv(S.T1a, S.T1b, t);
    camApply(c, camFor('B', 0, S.B1 - B0)); drawPaper(c); shotB(c, 0.02);
    const xw = lerp(-420, W + 420, E.io2(u));
    const edgeX = (y) => xw + (y - H / 2) * 0.3;
    c.save();
    camApply(c, camFor('A', S.A1, S.A1));
    c.beginPath();
    c.moveTo(edgeX(-300), -300); c.lineTo(W + 900, -300); c.lineTo(W + 900, H + 300); c.lineTo(edgeX(H + 300), H + 300);
    c.closePath(); c.clip();
    drawPaper(c); shotA(c, Math.min(t, S.A1));
    c.restore();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    inkWipe(c, u, sv, edgeX);
  }

  if (inB) {
    camApply(c, camFor('B', t - B0, S.B1 - B0)); drawPaper(c); shotB(c, t - B0);
  }

  if (inT2) {
    const u = inv(S.T2a, S.T2b, t);
    camApply(c, camFor('B', S.B1 - B0, S.B1 - B0)); drawPaper(c); shotB(c, S.B1 - B0);
    // 竹简自上方落下，逐渐盖住 B
    const drop = lerp(-1250, 0, E.out3(Math.min(1, u * 1.35)));
    camApply(c, camFor('C', 0, S.C1 - C0));
    c.save(); c.translate(960, 0); drawSlips(c, 0, drop); c.restore();
  }

  if (inC) {
    camApply(c, camFor('C', t - C0, S.C1 - C0)); drawPaper(c); shotC(c, t - C0);
  }

  if (inT3) {
    const u = inv(S.T3a, S.T3b, t);
    camApply(c, camFor('D', 0, S.D1 - D0)); drawPaper(c); shotD(c, 0.05);
    const front = lerp(H + 120, -160, E.io2(u));
    c.save();
    c.beginPath(); c.rect(-300, -300, W + 600, front + 300); c.clip();
    camApply(c, camFor('C', S.C1 - C0, S.C1 - C0)); drawPaper(c); shotC(c, S.C1 - C0);
    c.restore();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const top = [];
    for (let i = 0; i <= 22; i++) {
      const x = -60 + (i / 22) * (W + 120);
      top.push([x, front + Math.sin(i * 1.3 + t * 7) * 20 + (hs(1600, i) - 0.5) * 24]);
    }
    fillPoly(c, [...top, [W + 60, H + 300], [-60, H + 300]], PAL.ink);
  }

  if (inD) {
    camApply(c, camFor('D', t - D0, S.D1 - D0)); drawPaper(c); shotD(c, t - D0);
  }
  if (t >= S.D1) {
    camApply(c, camFor('E', t - S.D1, S.E1 - S.D1)); drawPaper(c); shotE(c, t - S.D1);
  }

  drawTooth(c, D);
  c.save();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(28,22,19,0)'); g.addColorStop(1, 'rgba(28,22,19,0.22)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

export function linkAt() { return null; }
export const SHOTS = S;
