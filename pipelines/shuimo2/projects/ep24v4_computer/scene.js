// EP24 · 第 16–18 句：一台没人要的二手电脑、一块没有亮度的屏、一个指头、两年
// 中国水墨：一张宣纸，墨分五色，朱砂只给印章。
import { clamp, lerp, seg, ss, eio } from './lib.js';
import { mk, draw, mass, blot, qpts, TONE, reseed } from './ink.js';

const FONT = `'MaShanZheng','KaiTi','STKaiti','SimSun',serif`;
const q = (x0, y0, cx, cy, x1, y1, n = 6) => qpts(x0, y0, cx, cy, x1, y1, n);
function ln(x0, y0, x1, y1, n = 6, bow = 0) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const dx = x1 - x0, dy = y1 - y0, Ln = Math.hypot(dx, dy) || 1;
  return qpts(x0, y0, mx - dy / Ln * bow, my + dx / Ln * bow, x1, y1, n);
}
function L(pts, w, tone, o = {}) {
  return mk(pts, Object.assign({ w, tone, prof: o.prof || 'brush', dry: o.dry ?? .4, wet: o.wet ?? .6, rough: o.rough ?? .18, nb: o.nb, seed: o.seed }, o));
}
function put(A, strokes, p = 1, am = 1) { for (const s of strokes) draw(A.ink, s, p, am); }
function circlePts(cx, cy, r, n = 14, sq = 1) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * sq, 1]); }
  return out;
}
const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

export function paint(A, t, W, H) {
  const cw = A.cw, cd = A.cd, cc = A.cc;
  const K = W / 1080;

  const zA = eio(seg(t, 2.2, 6.4));
  const s = 1.20 + .15 * zA;
  const camX = lerp(W * .480, W * .690, zA), camY = lerp(H * .565, H * .600, zA);
  A.xf(s, W / 2 - camX * s, H / 2 - camY * s);
  reseed(20231119);
  const tq = Math.floor(t * 12) / 12;

  const desk = H * .682;
  const monL = W * .175, monR = W * .690, monT = H * .432, monB = H * .640;
  const th = 30 * K;
  const sIn = { x0: monL + th, x1: monR - th, y0: monT + th, y1: monB - th };
  const mcx = (monL + monR) / 2;

  // ── 屋子：上留白，往下压深 ──
  const roomA = .16 + .84 * ss(seg(t, 0, .32));
  mass(cw, rectP(-200, -200, W + 200, H + 200), .60 * roomA, 0, 11,
    [0, H * .30, 0, H * .96, .02, .62]);
  mass(cw, rectP(-200, H * .78, W + 200, H + 200), .14 * roomA, 6, 12);
  // 地面一线
  put(A, [L(ln(-10, H * .930, W + 10, H * .928, 10, 1.5), 5 * K, TONE.qing, { dry: .8, wet: .1, rough: .35, nb: 6, seed: 3101 })], 1, .55 * roomA);

  // ── 墙上：一只挂钟、一张挂历 ──
  const walA = ss(seg(t, .1, .75));
  const clk = [W * .845, H * .185], clkR = 44 * K;
  put(A, [
    L(circlePts(clk[0], clk[1], clkR, 16, 1), 2.6 * K, TONE.dan, { dry: .55, wet: .3, seed: 3121 }),
    L(circlePts(clk[0], clk[1], clkR * .8, 16, 1), 1.4 * K, TONE.qing, { dry: .7, wet: .1, seed: 3122 }),
    L(ln(clk[0], clk[1], clk[0] + clkR * .30, clk[1] + clkR * .46, 4), 2.2 * K, TONE.nong, { dry: .4, wet: .5, seed: 3123 }),
    L(ln(clk[0], clk[1], clk[0] - clkR * .52, clk[1] - clkR * .22, 4), 3 * K, TONE.jiao, { dry: .4, wet: .5, seed: 3124 }),
  ], 1, walA);
  blot(cd, clk[0], clk[1], 3 * K, .5, 0, 1, 3125);
  // 挂历：一张纸，压在墙上，日子几排横线
  const cal = { x0: W * .845, y0: H * .265, x1: W * .965, y1: H * .375 };
  const calStrokes = [
    L(ln(cal.x0, cal.y0, cal.x1, cal.y0, 5), 2.4 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3131 }),
    L(ln(cal.x1, cal.y0, cal.x1, cal.y1, 5), 2.2 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3132 }),
    L(ln(cal.x1, cal.y1, cal.x0, cal.y1, 5), 2.4 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3133 }),
    L(ln(cal.x0, cal.y1, cal.x0, cal.y0, 5), 2.2 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3134 }),
    L(q(cal.x0 + 4 * K, cal.y1 + 2 * K, (cal.x0 + cal.x1) / 2, cal.y1 + 8 * K, cal.x1 - 4 * K, cal.y1 + 1 * K, 6), 3 * K, TONE.qing, { dry: .9, wet: .05, nb: 4, seed: 3148 }),
  ];
  for (let i = 0; i < 5; i++) {
    calStrokes.push(L(ln(cal.x0 + 10 * K, cal.y0 + 16 * K + i * 18 * K, cal.x1 - 12 * K, cal.y0 + 16 * K + i * 18 * K, 4), 1.4 * K, TONE.qing, { dry: .8, wet: .05, seed: 3140 + i }));
  }
  put(A, calStrokes, 1, walA);

  // ── 桌子 ──
  const dA = .30 + .70 * ss(seg(t, 0, .42));
  put(A, [
    L(ln(-20, desk + 4, W * .748, desk + 9, 12, 3), 46 * K, TONE.zhong, { dry: .18, wet: .82, rough: .2, seed: 3311 }),
    L(ln(-20, desk - 2, W * .748, desk + 1, 12, 2), 12 * K, TONE.jiao, { dry: .25, wet: .75, rough: .14, seed: 3314 }),
  ], 1, dA);
  mass(cw, rectP(-20, desk + 10, W * .748, desk + 34 * K), .26 * dA, 2, 13);
  mass(cw, rectP(W * .748, desk + 1, W * .772, desk + 36 * K), .30 * dA, 2, 14);
  put(A, [
    L(q(W * .04, desk + 26 * K, W * .03, H * .78, W * .045, H * .905, 6), 13 * K, TONE.nong, { dry: .45, wet: .5, seed: 3312 }),
    L(q(W * .700, desk + 26 * K, W * .712, H * .78, W * .696, H * .905, 6), 13 * K, TONE.nong, { dry: .45, wet: .5, seed: 3313 }),
  ], 1, dA);

  // 窗：竖框两格，淡淡的亮
  const winA = ss(seg(t, .1, .8));
  const wx0 = W * .212, wx1 = W * .378, wy0 = H * .208, wy1 = H * .404;
  mass(cw, rectP(wx0, wy0, wx1, wy1), .05 * winA, 2, 3201);
  put(A, [
    L(ln(wx0, wy0, wx1, wy0, 6), 3 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3202 }),
    L(ln(wx1, wy0, wx1, wy1, 6), 3 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3203 }),
    L(ln(wx1, wy1, wx0, wy1, 6), 3 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3204 }),
    L(ln(wx0, wy1, wx0, wy0, 6), 3 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3205 }),
    L(ln((wx0 + wx1) / 2, wy0, (wx0 + wx1) / 2, wy1, 6), 2.6 * K, TONE.nong, { dry: .55, wet: .3, seed: 3206 }),
    L(ln(wx0, wy0 + (wy1 - wy0) * .42, wx1, wy0 + (wy1 - wy0) * .44, 6), 2.6 * K, TONE.nong, { dry: .55, wet: .3, seed: 3207 }),
    L(ln(wx0 - 8 * K, wy1 + 4 * K, wx1 + 8 * K, wy1 + 6 * K, 6), 6 * K, TONE.qing, { dry: .6, wet: .3, seed: 3208 }),
  ], 1, winA);

  // ── 显示器：四边框实墨，屏心整块留白 ──
  const mA = ss(seg(t, .15, .8));
  mass(cw, rectP(monL, monT, monR, monT + th), .88 * mA, 2.5, 31);
  mass(cw, rectP(monL, monB - th * 1.5, monR, monB), .88 * mA, 2.5, 32);
  mass(cw, rectP(monL, monT, monL + th, monB), .86 * mA, 2.5, 33);
  mass(cw, rectP(monR - th, monT, monR, monB), .86 * mA, 2.5, 34);
  put(A, [
    L(ln(monL + 8 * K, monT + 10, monR - 8 * K, monT + 12, 8, 2), 8 * K, TONE.jiao, { dry: .55, wet: .4, seed: 3321 }),
    L(q(monL + 18, monT + th + 6, mcx, monT + th - 2, monR - 20, monT + th + 8, 10), 14 * K, TONE.qing, { dry: .92, wet: .06, rough: .3, seed: 3322 }),
  ], 1, mA * .9);
  put(A, [
    L(ln(mcx - 14 * K, monB, mcx - 24 * K, monB + 40 * K, 4), 11 * K, TONE.jiao, { dry: .35, wet: .6, seed: 3324 }),
    L(ln(mcx + 14 * K, monB, mcx + 28 * K, monB + 40 * K, 4), 11 * K, TONE.jiao, { dry: .35, wet: .6, seed: 3325 }),
    L(ln(mcx - 62 * K, monB + 42 * K, mcx + 62 * K, monB + 45 * K, 6), 9 * K, TONE.nong, { dry: .3, wet: .7, seed: 3326 }),
    L(q(mcx + 40 * K, monB + 44 * K, mcx + 96 * K, monB + 30 * K, mcx + 118 * K, desk - 2, 8), 4.4 * K, TONE.nong, { dry: .55, wet: .35, seed: 3327 }),
    L(q(monR - 24 * K, monB - 40 * K, monR + 16 * K, monB - 10 * K, monR + 6 * K, desk - 6, 6), 3.6 * K, TONE.nong, { dry: .6, wet: .3, seed: 3328 }),
  ], 1, mA);
  blot(cw, mcx, monB + 48 * K, 38 * K, .18 * mA, 0, .2, 7);

  // ── 屏心：暗着是一块空纸，亮起来才有东西 ──
  const on1 = ss(seg(t, 1.4, 2.1)), on2 = ss(seg(t, 2.2, 4.4));
  put(A, [
    L(ln(sIn.x0, sIn.y0, sIn.x1, sIn.y0, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3331 }),
    L(ln(sIn.x1, sIn.y0, sIn.x1, sIn.y1, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3332 }),
    L(ln(sIn.x1, sIn.y1, sIn.x0, sIn.y1, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3333 }),
    L(ln(sIn.x0, sIn.y1, sIn.x0, sIn.y0, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3334 }),
  ], 1, .7 * mA);
  if (on1 > 0) {
    const yy = sIn.y0 + (sIn.y1 - sIn.y0) * .5 * on1;
    put(A, [L(ln(sIn.x0 + 10, yy, sIn.x1 - 10, yy + 2, 8), 2.2 * K, TONE.qing, { dry: .2, wet: .2, seed: 3335 })], 1, 1);
  }
  if (on1 > .15) {
    const rays = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * .8 + i * .32, r0 = (monR - monL) * .52, r1 = r0 + (70 + i * 12) * K;
      rays.push(L([[mcx + Math.cos(a) * r0, (monT + monB) / 2 + Math.sin(a) * r0 * .76, 1],
        [mcx + Math.cos(a) * r1, (monT + monB) / 2 + Math.sin(a) * r1 * .76, .45]], 5 * K, TONE.qing,
        { dry: .96, wet: 0, rough: .3, nb: 3, seed: 3340 + i }));
    }
    put(A, rays, 1, on1 * .16);
  }
  const cvIn = { x0: sIn.x0 + 18 * K, x1: sIn.x1 - 106 * K, y0: sIn.y0 + 34 * K, y1: sIn.y1 - 34 * K };
  if (on2 > .05) {
    const p = ss(seg(t, 2.4, 3.4));
    put(A, [
      L(ln(cvIn.x0, cvIn.y0, cvIn.x1, cvIn.y0, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3351 }),
      L(ln(cvIn.x1, cvIn.y0, cvIn.x1, cvIn.y1, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3352 }),
      L(ln(cvIn.x1, cvIn.y1, cvIn.x0, cvIn.y1, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3353 }),
      L(ln(cvIn.x0, cvIn.y1, cvIn.x0, cvIn.y0, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3354 }),
    ], p, 1);
    if (on2 > .3) {
      const pa = ss(seg(t, 3.0, 4.2));
      const fx = (cvIn.x0 + cvIn.x1) / 2, fy = (cvIn.y0 + cvIn.y1) / 2 + 26 * K;
      // 屏里的那张老照片：肩、发、淡面
      mass(cw, [[fx - 58 * K, fy + 52 * K], [fx - 46 * K, fy - 4 * K], [fx - 20 * K, fy - 24 * K],
        [fx + 22 * K, fy - 24 * K], [fx + 48 * K, fy - 2 * K], [fx + 60 * K, fy + 52 * K]], .14 * pa, 3, 61);
      mass(cw, [[fx - 30 * K, fy - 40 * K], [fx - 22 * K, fy - 60 * K], [fx + 2 * K, fy - 68 * K],
        [fx + 24 * K, fy - 58 * K], [fx + 30 * K, fy - 36 * K], [fx + 10 * K, fy - 28 * K],
        [fx - 14 * K, fy - 30 * K]], .55 * pa, 2, 62);
      put(A, [
        L(circlePts(fx, fy - 36 * K, 28 * K, 14, 1.04), 2.6 * K, TONE.zhong, { dry: .45, wet: .4, seed: 3361 }),
        L(q(fx - 58 * K, fy + 52 * K, fx - 44 * K, fy + 6 * K, fx - 16 * K, fy - 2 * K, 6), 3 * K, TONE.zhong, { dry: .45, wet: .4, seed: 3362 }),
        L(q(fx + 58 * K, fy + 52 * K, fx + 46 * K, fy + 6 * K, fx + 18 * K, fy - 2 * K, 6), 3 * K, TONE.zhong, { dry: .45, wet: .4, seed: 3363 }),
        L(ln(fx - 16 * K, fy - 22 * K, fx - 4 * K, fy - 22 * K, 3), 2 * K, TONE.nong, { dry: .4, wet: .4, seed: 3367 }),
        L(ln(fx + 8 * K, fy - 22 * K, fx + 20 * K, fy - 22 * K, 3), 2 * K, TONE.nong, { dry: .4, wet: .4, seed: 3368 }),
        L(ln(fx - 12 * K, fy - 8 * K, fx + 12 * K, fy - 8 * K, 3), 1.8 * K, TONE.dan, { dry: .5, wet: .3, seed: 3369 }),
      ], 1, pa * .85);
      // 选区虚框 + 四个锚点
      const sx0 = cvIn.x0 + 22 * K, sx1 = cvIn.x1 - 22 * K, sy0 = cvIn.y0 + 20 * K, sy1 = cvIn.y1 - 18 * K;
      put(A, [
        L(ln(sx0, sy0, sx0, sy1, 5), 1.5 * K, TONE.qing, { dry: .92, wet: 0, seed: 3363 }),
        L(ln(sx0, sy1, sx1, sy1, 6), 1.5 * K, TONE.qing, { dry: .92, wet: 0, seed: 3364 }),
        L(ln(sx1, sy1, sx1, sy0, 5), 1.5 * K, TONE.qing, { dry: .92, wet: 0, seed: 3365 }),
        L(ln(sx1, sy0, sx0, sy0, 6), 1.5 * K, TONE.qing, { dry: .92, wet: 0, seed: 3366 }),
      ], 1, pa * .8);
      for (const [hx, hy] of [[sx0, sy0], [sx1, sy0], [sx0, sy1], [sx1, sy1]]) mass(cw, rectP(hx - 3 * K, hy - 3 * K, hx + 3 * K, hy + 3 * K), .55 * pa, 0, 63);
    }
  }
  if (on2 > .15) {
    for (let i = 0; i < 3; i++) {
      const p = ss(seg(t, 2.6 + i * .45, 3.2 + i * .45));
      const y = sIn.y0 + 40 * K + i * 42 * K, x0 = sIn.x1 - 88 * K, x1 = sIn.x1 - 12 * K, dy = 32 * K;
      put(A, [
        L(ln(x0, y, x1, y, 4), 2.3 * K, TONE.qing, { dry: .25, wet: .4, seed: 3370 + i }),
        L(ln(x1, y, x1, y + dy, 3), 2.1 * K, TONE.qing, { dry: .25, wet: .4, seed: 3375 + i }),
        L(ln(x1, y + dy, x0, y + dy, 4), 2.1 * K, TONE.qing, { dry: .25, wet: .4, seed: 3380 + i }),
        L(ln(x0, y + dy, x0, y, 3), 2.1 * K, TONE.qing, { dry: .25, wet: .4, seed: 3385 + i }),
        L(ln(x0 + 4 * K, y + 15 * K, x0 + 24 * K, y + 15 * K, 3), 11 * K, TONE.dan, { dry: .55, wet: .25, rough: .3, nb: 3, seed: 3390 + i }),
      ], p, 1);
    }
  }
  // 屏下的桌面反光
  put(A, [L(ln(monL + 40 * K, desk - 2, monR - 40 * K, desk + 2, 10), 16 * K, TONE.qing, { dry: .95, wet: .05, rough: .4, nb: 5, seed: 3395 })], 1, on1 * .5);

  // ── 键盘、鼠标、桌上一应东西 ──
  const kA = ss(seg(t, .35, .95));
  const kbY = desk - 12 * K, kbX0 = W * .300, kbX1 = W * .620;
  mass(cw, [[kbX0, kbY], [kbX1, kbY - 2], [kbX1 + 6, kbY + 26 * K], [kbX0 - 8, kbY + 28 * K]], .26 * kA, 2, 51);
  const keys = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) {
    const kx = kbX0 + 12 * K + i * (kbX1 - kbX0 - 22 * K) / 8 + (r % 2) * 3 * K, ky = kbY + 7 * K + r * 6.5 * K;
    keys.push(mk([[kx, ky, 1], [kx + 12 * K, ky + 1, .8]], { w: 2.6 * K, tone: TONE.nong, prof: 'even', dry: .6, wet: .2, rough: .1, nb: 2, seed: 5000 + r * 10 + i }));
  }
  put(A, keys, 1, kA);
  put(A, [L(q(kbX0 + 8 * K, kbY + 24 * K, kbX0 - 30 * K, kbY + 34 * K, kbX0 - 44 * K, desk + 26 * K, 6), 3.4 * K, TONE.nong, { dry: .55, wet: .35, seed: 5010 })], 1, kA);
  const mpX = W * .648, mpY = desk - 8 * K;
  mass(cw, [[mpX - 40 * K, mpY], [mpX + 40 * K, mpY - 4 * K], [mpX + 44 * K, mpY + 30 * K], [mpX - 44 * K, mpY + 34 * K]], .10 * kA, 2, 52);
  mass(cw, [[mpX - 10 * K, mpY + 4 * K], [mpX + 10 * K, mpY + 2 * K], [mpX + 11 * K, mpY + 24 * K], [mpX - 11 * K, mpY + 26 * K]], .34 * kA, 1.5, 53);
  put(A, [L(ln(mpX - 6 * K, mpY + 8 * K, mpX + 6 * K, mpY + 7 * K, 3), 1.6 * K, TONE.qing, { dry: .6, wet: .2, seed: 5011 })], 1, kA);

  const oA = ss(seg(t, .55, 1.25));
  for (let i = 0; i < 3; i++) {
    put(A, [L(ln(W * .150, desk - (7 + i * 9) * K, W * .335, desk - (9 + i * 9) * K, 6), 5 * K, TONE.zhong, { dry: .45, wet: .45, rough: .2, seed: 5100 + i })], 1, oA);
  }
  // 摊开的笔记本 + 铅笔
  const nb = { x0: W * .120, y0: desk - 26 * K, x1: W * .245, y1: desk - 8 * K };
  const nbStrokes = [
    L(ln(nb.x0, nb.y0, nb.x1 - 6 * K, nb.y0 - 2 * K, 6), 2.4 * K, TONE.zhong, { dry: .5, wet: .35, seed: 5111 }),
    L(ln(nb.x1 - 6 * K, nb.y0 - 2 * K, nb.x1, nb.y1, 5), 2.2 * K, TONE.zhong, { dry: .5, wet: .35, seed: 5112 }),
    L(ln(nb.x1, nb.y1, nb.x0 + 4 * K, nb.y1 + 2 * K, 6), 2.4 * K, TONE.zhong, { dry: .5, wet: .35, seed: 5113 }),
    L(ln(nb.x0 + 4 * K, nb.y1 + 2 * K, nb.x0, nb.y0, 5), 2.2 * K, TONE.zhong, { dry: .5, wet: .35, seed: 5114 }),
    L(ln(nb.x1 - 20 * K, nb.y1 + 6 * K, nb.x0 + 40 * K, nb.y1 - 12 * K, 4), 3 * K, TONE.nong, { dry: .5, wet: .35, seed: 5125 }),
  ];
  for (let i = 0; i < 3; i++) nbStrokes.push(L(ln(nb.x0 + 12 * K, nb.y0 + 6 * K + i * 6 * K, nb.x0 + 70 * K, nb.y0 + 5 * K + i * 6 * K, 4), 1.3 * K, TONE.qing, { dry: .85, wet: .05, seed: 5120 + i }));
  put(A, nbStrokes, 1, oA);
  // 搪瓷杯
  const cupX = W * .072, cupT = desk - 46 * K;
  put(A, [
    L(circlePts(cupX, cupT, 30 * K, 10, .34), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5201 }),
    L(ln(cupX - 30 * K, cupT, cupX - 27 * K, desk - 12 * K, 4), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5202 }),
    L(ln(cupX + 30 * K, cupT, cupX + 27 * K, desk - 12 * K, 4), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5203 }),
    L(ln(cupX - 27 * K, desk - 8 * K, cupX + 27 * K, desk - 6 * K, 4), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5204 }),
  ], 1, oA);
  // 一叠光盘
  const cdX = W * .700, cdY = desk - 14 * K;
  for (let i = 0; i < 3; i++) {
    put(A, [L(circlePts(cdX, cdY - i * 7 * K, 34 * K, 12, .26), 2.6 * K, TONE.dan, { dry: .6, wet: .25, seed: 5210 + i })], 1, oA);
  }
  // ── 椅子：坐面透视四边形，背板两根立柱 ──
  const pA = ss(seg(t, .2, .9));
  const hipY = H * .782;
  const seatF = H * .796;
  const seat = [[W * .782, seatF + 2 * K], [W * .905, seatF - 12 * K], [W * .945, seatF + 4 * K], [W * .800, seatF + 20 * K]];
  mass(cw, seat, .05 * pA, 2, 66);
  put(A, [
    L(ln(seat[0][0], seat[0][1], seat[1][0], seat[1][1], 6), 5 * K, TONE.jiao, { dry: .4, wet: .5, seed: 6010 }),
    L(ln(seat[1][0], seat[1][1], seat[2][0], seat[2][1], 4), 4 * K, TONE.nong, { dry: .5, wet: .4, seed: 6011 }),
    L(ln(seat[2][0], seat[2][1], seat[3][0], seat[3][1], 4), 4 * K, TONE.nong, { dry: .5, wet: .4, seed: 6012 }),
    L(ln(W * .905, seatF - 12 * K, W * .914, hipY - 150 * K, 6), 8 * K, TONE.nong, { dry: .45, wet: .5, seed: 6013 }),
    L(ln(W * .945, seatF + 6 * K, W * .958, hipY - 146 * K, 6), 8 * K, TONE.nong, { dry: .45, wet: .5, seed: 6014 }),
    L(ln(W * .912, hipY - 150 * K, W * .960, hipY - 144 * K, 5), 6 * K, TONE.nong, { dry: .4, wet: .5, seed: 6015 }),
    L(ln(W * .916, hipY - 104 * K, W * .955, hipY - 100 * K, 5), 4.6 * K, TONE.dan, { dry: .6, wet: .25, seed: 6016 }),
    L(ln(W * .752, seatF + 18 * K, W * .756, H * .930, 5), 6 * K, TONE.nong, { dry: .5, wet: .4, seed: 6017 }),
    L(ln(W * .925, seatF + 14 * K, W * .930, H * .928, 5), 6 * K, TONE.nong, { dry: .5, wet: .4, seed: 6018 }),
  ], 1, pA);
  // ── 人：侧身坐着，往左看着屏（白描为主，只给头发落墨） ──
  const poly = (pts, w, tone, o = {}) => mk(pts.map(p2 => [p2[0], p2[1], p2[2] ?? 1]),
    Object.assign({ w, tone, prof: 'brush', dry: .45, wet: .55, rough: .18 }, o));
  const breath = Math.sin(tq * 1.7) * 2.6 * K;
  const sway = Math.sin(tq * .72) * 2.0 * K;
  const hip = [W * .868, hipY + 2 * K];
  const sh = [W * .802 + sway, H * .642 + breath];
  const headC = [W * .766 + sway * 1.4, H * .618 + breath * 1.6];
  const headR = 50 * K;
  const FX = headC[0], FY = headC[1], R = headR;
  const knee = [W * .642, hipY + 6 * K];
  const ank = [W * .654, H * .902];

  // 头发：一整块墨，只在头顶和后脑
  mass(cw, [[FX - R * .52, FY - R * .60], [FX - R * .30, FY - R * 1.02], [FX + R * .20, FY - R * 1.04],
    [FX + R * .92, FY - R * .62], [FX + R * 1.00, FY - R * .10], [FX + R * .74, FY + R * .30],
    [FX + R * .34, FY - R * .18]], .82 * pA, 2, 701);
  put(A, [
    poly([[FX - R * .50, FY - R * .62], [FX - R * .20, FY - R * .96], [FX + R * .30, FY - R * .96], [FX + R * .86, FY - R * .52]], 2.4 * K, TONE.qing, { dry: .8, wet: .1, rough: .35, seed: 702 }),
    poly([[FX + R * .10, FY - R * .86], [FX + R * .50, FY - R * .52], [FX + R * .72, FY - R * .08]], 2.2 * K, TONE.qing, { dry: .85, wet: .1, rough: .35, seed: 703 }),
  ], 1, pA);

  // 脸：额头→眉骨→鼻→人中→下巴→颌→耳
  put(A, [
    poly([[FX - R * .46, FY - R * .64], [FX - R * .80, FY - R * .34], [FX - R * .78, FY - R * .12],
      [FX - R * .88, FY + R * .04], [FX - R * .78, FY + R * .16], [FX - R * .70, FY + R * .28],
      [FX - R * .72, FY + R * .30], [FX - R * .68, FY + R * .38], [FX - R * .70, FY + R * .50],
      [FX - R * .46, FY + R * .76], [FX - R * .06, FY + R * .86], [FX + R * .40, FY + R * .68],
      [FX + R * .64, FY + R * .42]], 2.8 * K, TONE.nong, { dry: .5, wet: .4, rough: .2, seed: 704 }),
    // 眉、眼、嘴
    poly([[FX - R * .84, FY - R * .26], [FX - R * .56, FY - R * .24], [FX - R * .34, FY - R * .26]], 2.6 * K, TONE.jiao, { dry: .5, wet: .45, seed: 705 }),
    poly([[FX - R * .80, FY - R * .07], [FX - R * .52, FY - R * .06]], 2.2 * K, TONE.jiao, { dry: .45, wet: .5, seed: 706 }),
    poly([[FX - R * .80, FY + R * .30], [FX - R * .62, FY + R * .30]], 2 * K, TONE.jiao, { dry: .5, wet: .45, seed: 707 }),
    // 耳朵
    poly([[FX + R * .60, FY + R * .02], [FX + R * .78, FY + R * .16], [FX + R * .56, FY + R * .34]], 2.4 * K, TONE.qing, { dry: .7, wet: .2, seed: 708 }),
    // 下颌的暗
    poly([[FX - R * .44, FY + R * .78], [FX - R * .04, FY + R * .88], [FX + R * .38, FY + R * .72]], 3 * K, TONE.qing, { dry: .9, wet: .1, rough: .4, seed: 709 }),
  ], 1, pA);
  const blink = Math.abs((tq % 2.4) - 1.2) < .10;
  if (blink) put(A, [poly([[FX - R * .78, FY - R * .04], [FX - R * .52, FY - R * .01]], 2.4 * K, TONE.jiao, { dry: .4, wet: .5, seed: 710 })], 1, pA);

  // 颈：从下颌走到肩，根部略收
  put(A, [
    poly([[FX - R * .34, FY + R * .74], [FX - R * .30, FY + R * 1.02], [sh[0] - 12 * K, sh[1] + 4 * K]], 3.4 * K, TONE.nong, { dry: .5, wet: .45, seed: 711 }),
    poly([[FX + R * .56, FY + R * .38], [FX + R * .66, FY + R * .96], [sh[0] + 34 * K, sh[1] - 2 * K]], 3.4 * K, TONE.nong, { dry: .5, wet: .45, seed: 712 }),
    poly([[FX - R * .30, FY + R * .90], [sh[0] + 4 * K, sh[1] + 6 * K]], 2.2 * K, TONE.qing, { dry: .85, wet: .12, seed: 7131 }),
  ], 1, pA);
  mass(cw, [[FX - R * .26, FY + R * .80], [FX + R * .58, FY + R * .44], [sh[0] + 24 * K, sh[1] - 2 * K], [sh[0] - 2 * K, sh[1] + 6 * K]], .20 * pA, 2, 7132);
  // 领口
  put(A, [
    poly([[sh[0] - 16 * K, sh[1] + 8 * K], [sh[0] + 2 * K, sh[1] + 14 * K], [sh[0] + 32 * K, sh[1] - 2 * K]], 3.4 * K, TONE.jiao, { dry: .45, wet: .5, seed: 7140 }),
  ], 1, pA);


  // 上身：后沿一笔压下，前沿两折
  put(A, [
    poly([[sh[0] + 32 * K, sh[1] - 4 * K], [W * .852, H * .670], [W * .884, H * .744], [W * .890, H * .784]], 3.4 * K, TONE.jiao, { dry: .45, wet: .5, seed: 714 }),
    poly([[sh[0] - 14 * K, sh[1] + 4 * K], [W * .786, H * .670], [W * .792, H * .742], [W * .824, H * .790]], 3.4 * K, TONE.jiao, { dry: .45, wet: .5, seed: 715 }),
    // 领口、衣褶
    poly([[sh[0] - 14 * K, sh[1] + 4 * K], [sh[0] - 2 * K, sh[1] + 18 * K], [sh[0] + 28 * K, sh[1] - 2 * K]], 3 * K, TONE.jiao, { dry: .5, wet: .45, seed: 716 }),
    poly([[W * .796, H * .664], [W * .812, H * .716], [W * .830, H * .766]], 2.2 * K, TONE.qing, { dry: .8, wet: .12, seed: 717 }),
    poly([[W * .866, H * .690], [W * .876, H * .736]], 2 * K, TONE.qing, { dry: .8, wet: .12, seed: 718 }),
  ], 1, pA);
  mass(cw, [[sh[0] - 12 * K, sh[1] + 8 * K], [sh[0] + 30 * K, sh[1] - 4 * K], [W * .888, H * .780],
    [W * .824, H * .790], [W * .780, H * .694]], .12 * pA, 4, 719);

  // 衣摆压在坐面上
  mass(cw, [[W * .832, H * .774], [W * .786, H * .778], [W * .782, H * .802], [W * .838, H * .806]], .12 * pA, 3, 741);
  put(A, [poly([[W * .832, H * .780], [W * .800, H * .784], [W * .790, H * .800], [W * .836, H * .800]], 2.4 * K, TONE.jiao, { dry: .45, wet: .5, seed: 740 })], 1, pA);

  // 臂：上臂两线，前臂两线，手是一小团
  const tapT = [2.55, 3.05, 3.55, 4.05, 4.55, 5.05, 5.55, 6.05];
  let tap = 0;
  for (const tt of tapT) {
    const u = tq - tt;
    if (u > -.02 && u < .34) tap = Math.max(tap, Math.sin(Math.PI * clamp(u / .34)));
  }
  const elb = [W * .764, H * .738 + breath * .4 - tap * 1.5 * K];
  const wr = [W * .642, desk - 10 * K - tap * 9 * K];
  put(A, [
    poly([[sh[0] - 6 * K, sh[1] + 12 * K], [elb[0] + 6 * K, elb[1] - 22 * K], [elb[0] + 2 * K, elb[1]]], 2.8 * K, TONE.jiao, { dry: .45, wet: .5, seed: 720 }),
    poly([[sh[0] + 26 * K, sh[1] + 2 * K], [elb[0] + 24 * K, elb[1] - 24 * K], [elb[0] + 20 * K, elb[1] - 4 * K]], 2.8 * K, TONE.jiao, { dry: .45, wet: .5, seed: 721 }),
    poly([[elb[0] + 2 * K, elb[1]], [W * .700, H * .712 + tap * -2 * K], [wr[0] + 8 * K, wr[1] - 4 * K]], 2.6 * K, TONE.jiao, { dry: .45, wet: .5, seed: 722 }),
    poly([[elb[0] + 22 * K, elb[1] - 4 * K], [W * .714, H * .716 + tap * -2 * K], [wr[0] + 14 * K, wr[1] + 8 * K]], 2.6 * K, TONE.jiao, { dry: .45, wet: .5, seed: 723 }),
    // 手背
    poly([[wr[0] + 10 * K, wr[1] - 10 * K], [wr[0] - 12 * K, wr[1] - 8 * K], [wr[0] - 18 * K, wr[1] + 6 * K], [wr[0] + 8 * K, wr[1] + 10 * K]], 2.4 * K, TONE.jiao, { dry: .4, wet: .5, seed: 724 }),
    // 伸出去的那根指头
    poly([[wr[0] - 14 * K, wr[1] + 2 * K], [wr[0] - 34 * K, wr[1] + 12 * K]], 3.6 * K, TONE.nong, { dry: .3, wet: .65, seed: 725 }),
  ], 1, pA);
  mass(cw, [[wr[0] + 8 * K, wr[1] - 8 * K], [wr[0] - 12 * K, wr[1] - 7 * K], [wr[0] - 16 * K, wr[1] + 6 * K], [wr[0] + 6 * K, wr[1] + 8 * K]], .18 * pA, 2, 726);
  blot(cd, wr[0] - 34 * K, wr[1] + 14 * K, 5 * K, .5 * pA, .6, 1, 727);

  // 另一只手搭在桌沿
  const lw = [W * .716, desk - 22 * K + breath * .5];
  put(A, [
    poly([[sh[0] - 18 * K, sh[1] + 28 * K], [W * .766, H * .716], [lw[0] + 6 * K, lw[1] - 10 * K]], 2.8 * K, TONE.jiao, { dry: .45, wet: .5, seed: 730 }),
    poly([[sh[0] + 2 * K, sh[1] + 40 * K], [W * .788, H * .726], [lw[0] + 20 * K, lw[1] - 4 * K]], 2.8 * K, TONE.jiao, { dry: .45, wet: .5, seed: 731 }),
    poly([[lw[0] - 8 * K, lw[1] - 10 * K], [lw[0] + 16 * K, lw[1] - 12 * K], [lw[0] + 20 * K, lw[1] + 2 * K], [lw[0] - 6 * K, lw[1] + 4 * K]], 2.4 * K, TONE.jiao, { dry: .4, wet: .5, seed: 732 }),
  ], 1, pA);

  // 腿：大腿两条线，小腿两条线，鞋一只
  put(A, [
    poly([[W * .826, H * .780], [W * .730, H * .774], [knee[0] + 4 * K, knee[1]]], 3 * K, TONE.jiao, { dry: .45, wet: .5, seed: 733 }),
    poly([[W * .884, H * .796], [W * .760, H * .800], [knee[0] + 10 * K, knee[1] + 8 * K]], 3 * K, TONE.jiao, { dry: .45, wet: .5, seed: 734 }),
    poly([[W * .700, H * .802], [W * .706, H * .852], [W * .710, H * .898]], 2.8 * K, TONE.jiao, { dry: .45, wet: .5, seed: 735 }),
    poly([[W * .740, H * .802], [W * .744, H * .852], [W * .748, H * .896]], 2.8 * K, TONE.jiao, { dry: .45, wet: .5, seed: 736 }),
    poly([[W * .710, H * .898], [W * .678, H * .904], [W * .672, H * .912]], 2.6 * K, TONE.jiao, { dry: .4, wet: .55, seed: 737 }),
  ], 1, pA);
  mass(cw, [[W * .712, H * .900], [W * .676, H * .906], [W * .668, H * .914], [W * .746, H * .914]], .34 * pA, 2, 738);
  put(A, [poly([[W * .746, H * .896], [W * .744, H * .900], [W * .668, H * .912]], 2.4 * K, TONE.qing, { dry: .8, wet: .15, seed: 7382 })], 1, pA);
  mass(cw, [[sh[0] - 6 * K, sh[1] + 12 * K], [elb[0] + 6 * K, elb[1] - 22 * K], [elb[0] + 22 * K, elb[1] - 2 * K], [sh[0] + 28 * K, sh[1] + 2 * K]], .12 * pA, 3, 7202);
  mass(cw, [[elb[0] + 4 * K, elb[1] - 2 * K], [wr[0] + 12 * K, wr[1] - 10 * K], [wr[0] + 18 * K, wr[1] + 8 * K], [elb[0] + 22 * K, elb[1] + 4 * K]], .12 * pA, 3, 7203);
  mass(cw, [[W * .830, H * .778], [W * .700, H * .770], [W * .662, H * .788], [W * .760, H * .804]], .20 * pA, 3, 7332);
  mass(cw, [[W * .700, H * .802], [W * .744, H * .802], [W * .748, H * .896], [W * .706, H * .898]], .12 * pA, 3, 739);


// ── 屏光里的浮尘 ──
  if (on1 > .3) {
    for (let i = 0; i < 16; i++) {
      const ph = i * 1.37, x0 = monL + 30 * K + (i % 6) * 78 * K, y0 = monT + 60 * K + ((i * 53) % 300) * K;
      const dx = Math.sin(t * .55 + ph) * 14 * K, dy = Math.sin(t * .32 + ph * 2) * 10 * K - t * 6 * K;
      blot(cd, x0 + dx, y0 + dy, (1.4 + (i % 3) * .5) * K, .18 * on1, i * .7, 1, 8000 + i);
    }
  }

  A.xf(1, 0, 0);

  // ── 题签：小字落在纸角，只做署名 ──
  const tx = W * .062, ty0 = H * .800, fs = 44 * K;
  cd.save(); cd.fillStyle = '#0b0906'; cd.textAlign = 'center'; cd.textBaseline = 'middle';
  cd.font = `${fs}px ${FONT}`;
  ['两', '年'].forEach((ch, i) => {
    const p = ss(seg(t, 6.2 + i * .32, 6.7 + i * .32));
    if (p <= 0) return;
    cd.globalAlpha = .62 * p;
    cd.save(); cd.translate(tx, ty0 + i * fs * 1.14); cd.rotate(i % 2 ? .03 : -.03); cd.fillText(ch, 0, 0); cd.restore();
  });
  cd.restore();

  // 朱砂印
  const p3 = ss(seg(t, 7.2, 7.8));
  if (p3 > 0) {
    const sz = 46 * K;
    cc.save(); cc.translate(tx + 62 * K, ty0 + fs * .60); cc.rotate(-.035);
    cc.globalAlpha = .78 * p3; cc.fillStyle = '#b02e22';
    cc.fillRect(-sz / 2, -sz / 2, sz, sz);
    cc.globalCompositeOperation = 'destination-out'; cc.globalAlpha = .95;
    cc.font = Math.round(sz * .70) + 'px ' + FONT; cc.textAlign = 'center'; cc.textBaseline = 'middle';
    cc.fillText('陆', 0, -sz * .03);
    cc.restore();
  }
}
