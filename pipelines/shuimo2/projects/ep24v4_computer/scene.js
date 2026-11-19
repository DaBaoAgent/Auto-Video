// EP24 · 第 16–18 句：一台没人要的二手电脑、没有亮度的屏、一个指头、两年
// 中国水墨：一张宣纸，墨分五色，朱砂只给印章。
import { clamp, lerp, seg, ss, eio } from './lib.js';
import { mk, draw, mass, blot, qpts, TONE, reseed } from './ink.js';

const FONT = `'MaShanZheng','KaiTi','STKaiti','SimSun',serif`;

function ln(x0, y0, x1, y1, n = 6, bow = 0) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  return qpts(x0, y0, mx - dy / L * bow, my + dx / L * bow, x1, y1, n);
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

  const s = 1 + .045 * eio(seg(t, 1.0, 10));
  const camX = W * .48, camY = H * .58;
  A.xf(s, W / 2 - camX * s, H / 2 - camY * s);
  reseed(20231119);
  const tq = Math.floor(t * 12) / 12;

  const desk = H * .682;
  const monL = W * .175, monR = W * .690, monT = H * .432, monB = H * .640;
  const th = 30 * K;                                   // 壳厚
  const sIn = { x0: monL + th, x1: monR - th, y0: monT + th, y1: monB - th };

  // ── 屋子：一张纸，下半压深，上半留白 ──
  const roomA = ss(seg(t, 0, 1.5));
  mass(cw, rectP(-200, -200, W + 200, H + 200), .60 * roomA, 0, 11,
    [0, H * .30, 0, H * .96, .02, .62]);
  mass(cw, rectP(-200, H * .78, W + 200, H + 200), .14 * roomA, 6, 12);          // 地面
  // 墙缝：两道极淡的竖线，只做气口
  put(A, [
    L(qpts(W * .09, H * .30, W * .085, H * .62, W * .092, H * .80, 6), 9 * K, TONE.qing, { dry: .8, wet: .05, rough: .4, seed: 3101 }),
    L(qpts(W * .93, H * .30, W * .935, H * .62, W * .928, H * .80, 6), 9 * K, TONE.qing, { dry: .8, wet: .05, rough: .4, seed: 3102 }),
  ], 1, roomA * .55);
  put(A, [
    L(qpts(W * .02, H * .34, W * .05, H * .58, W * .03, H * .80, 6), 96 * K, TONE.qing, { dry: .85, wet: .12, rough: .42, nb: 10, seed: 3111 }),
    L(qpts(W * .97, H * .32, W * .95, H * .60, W * .975, H * .82, 6), 88 * K, TONE.qing, { dry: .85, wet: .12, rough: .42, nb: 10, seed: 3112 }),
  ], 1, roomA * .55);

  // ── 桌子：一条横线，桌下压深 ──
  const dA = ss(seg(t, .2, 1.4));
  put(A, [L(ln(-20, desk + 4, W + 20, desk + 6, 12, 3), 46 * K, TONE.zhong, { dry: .18, wet: .82, rough: .2, seed: 3311 }),
    L(ln(-20, desk - 2, W + 20, desk, 12, 2), 12 * K, TONE.jiao, { dry: .25, wet: .75, rough: .14, seed: 3314 })], 1, dA);
  mass(cw, rectP(-20, desk + 10, W + 20, desk + 34 * K), .26 * dA, 2, 13);
  put(A, [
    L(qpts(W * .04, desk + 26 * K, W * .03, H * .78, W * .045, H * .905, 6), 13 * K, TONE.nong, { dry: .45, wet: .5, seed: 3312 }),
    L(qpts(W * .955, desk + 26 * K, W * .968, H * .78, W * .952, H * .905, 6), 13 * K, TONE.nong, { dry: .45, wet: .5, seed: 3313 }),
  ], 1, dA);

  // ── 显示器：四边框实墨，屏心整块留白 ──
  const mA = ss(seg(t, .7, 1.8));
  mass(cw, rectP(monL, monT, monR, monT + th), .88 * mA, 2.5, 31);
  mass(cw, rectP(monL, monB - th * 1.5, monR, monB), .88 * mA, 2.5, 32);          // 下沿更厚（老 CRT）
  mass(cw, rectP(monL, monT, monL + th, monB), .86 * mA, 2.5, 33);
  mass(cw, rectP(monR - th, monT, monR, monB), .86 * mA, 2.5, 34);
  // 壳上的转折与灰
  put(A, [
    L(ln(monL + 8 * K, monT + 10, monR - 8 * K, monT + 12, 8, 2), 8 * K, TONE.jiao, { dry: .55, wet: .4, seed: 3321 }),
    L(qpts(monL + 18, monT + th + 6, (monL + monR) / 2, monT + th - 2, monR - 20, monT + th + 8, 10), 14 * K, TONE.qing, { dry: .92, wet: .06, rough: .3, seed: 3322 }),
  ], 1, mA * .9);
  // 底座
  put(A, [
    L(ln((monL + monR) / 2 - 14 * K, monB, (monL + monR) / 2 - 24 * K, monB + 40 * K, 4), 11 * K, TONE.jiao, { dry: .35, wet: .6, seed: 3324 }),
    L(ln((monL + monR) / 2 + 14 * K, monB, (monL + monR) / 2 + 28 * K, monB + 40 * K, 4), 11 * K, TONE.jiao, { dry: .35, wet: .6, seed: 3325 }),
    L(ln((monL + monR) / 2 - 62 * K, monB + 42 * K, (monL + monR) / 2 + 62 * K, monB + 45 * K, 6), 9 * K, TONE.nong, { dry: .3, wet: .7, seed: 3326 }),
  ], 1, mA);
  blot(cw, (monL + monR) / 2, monB + 48 * K, 38 * K, .18 * mA, 0, .2, 7);

  // ── 屏心：暗着的时候只是一块空纸；亮起来才有东西 ──
  const on1 = ss(seg(t, 2.9, 3.6)), on2 = ss(seg(t, 3.6, 5.8));
  // 屏的内沿（极淡，让留白有个边）
  put(A, [
    L(ln(sIn.x0, sIn.y0, sIn.x1, sIn.y0, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3331 }),
    L(ln(sIn.x1, sIn.y0, sIn.x1, sIn.y1, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3332 }),
    L(ln(sIn.x1, sIn.y1, sIn.x0, sIn.y1, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3333 }),
    L(ln(sIn.x0, sIn.y1, sIn.x0, sIn.y0, 6), 2.6 * K, TONE.qing, { dry: .3, wet: .2, rough: .12, seed: 3334 }),
  ], 1, .7 * mA);
  // 亮起来：一条水线从屏心往两边摊开
  if (on1 > 0) {
    const yy = sIn.y0 + (sIn.y1 - sIn.y0) * .5 * on1;
    put(A, [L(ln(sIn.x0 + 10, yy, sIn.x1 - 10, yy + 2, 8), 2.2 * K, TONE.qing, { dry: .2, wet: .2, seed: 3335 })], 1, 1);
  }
  // 光晕：屏外几道极淡的飞白
  if (on1 > .15) {
    const rays = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * .8 + i * .32, r0 = (monR - monL) * .52, r1 = r0 + (70 + i * 12) * K;
      const mcx = (monL + monR) / 2, mcy = (monT + monB) / 2;
      rays.push(L([[mcx + Math.cos(a) * r0, mcy + Math.sin(a) * r0 * .76, 1],
        [mcx + Math.cos(a) * r1, mcy + Math.sin(a) * r1 * .76, .45]], 5 * K, TONE.qing,
        { dry: .96, wet: 0, rough: .3, nb: 3, seed: 3340 + i }));
    }
    put(A, rays, 1, on1 * .16);
  }
  // 画布窗口 + 老照片
  const cvIn = { x0: sIn.x0 + 18 * K, x1: sIn.x1 - 106 * K, y0: sIn.y0 + 34 * K, y1: sIn.y1 - 34 * K };
  if (on2 > .05) {
    const p = ss(seg(t, 3.7, 4.7));
    put(A, [
      L(ln(cvIn.x0, cvIn.y0, cvIn.x1, cvIn.y0, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3351 }),
      L(ln(cvIn.x1, cvIn.y0, cvIn.x1, cvIn.y1, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3352 }),
      L(ln(cvIn.x1, cvIn.y1, cvIn.x0, cvIn.y1, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3353 }),
      L(ln(cvIn.x0, cvIn.y1, cvIn.x0, cvIn.y0, 6), 3 * K, TONE.dan, { dry: .3, wet: .55, seed: 3354 }),
    ], p, 1);
    if (on2 > .3) {
      const pa = ss(seg(t, 4.3, 5.5));
      const fx = (cvIn.x0 + cvIn.x1) / 2, fy = (cvIn.y0 + cvIn.y1) / 2 + 12 * K;
      put(A, [
        L(circlePts(fx, fy - 44 * K, 30 * K, 12, 1.05), 3.6 * K, TONE.zhong, { dry: .35, wet: .5, rough: .2, seed: 3361 }),
        L(ln(fx - 20 * K, fy - 12 * K, fx - 44 * K, fy + 44 * K, 5), 4.4 * K, TONE.zhong, { dry: .45, wet: .4, seed: 3362 }),
        L(ln(fx + 20 * K, fy - 12 * K, fx + 44 * K, fy + 44 * K, 5), 4.4 * K, TONE.zhong, { dry: .45, wet: .4, seed: 3365 }),
        L(ln(fx - 44 * K, fy + 46 * K, fx + 44 * K, fy + 46 * K, 5), 3.6 * K, TONE.zhong, { dry: .5, wet: .35, seed: 3366 }),
        L(ln(fx - 24 * K, fy - 34 * K, fx - 8 * K, fy - 32 * K, 4), 2.4 * K, TONE.nong, { dry: .3, wet: .4, seed: 3363 }),
        L(ln(fx + 6 * K, fy - 32 * K, fx + 22 * K, fy - 30 * K, 4), 2.4 * K, TONE.nong, { dry: .3, wet: .4, seed: 3364 }),
      ], pa, .85);
    }
  }
  // 图层面板：三层
  if (on2 > .15) {
    for (let i = 0; i < 3; i++) {
      const p = ss(seg(t, 4.0 + i * .5, 4.6 + i * .5));
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

  // ── 键盘：一小块深，键是点点 ──
  const kA = ss(seg(t, 1.0, 1.9));
  const kbY = desk - 12 * K, kbX0 = W * .300, kbX1 = W * .620;
  mass(cw, [[kbX0, kbY], [kbX1, kbY - 2], [kbX1 + 6, kbY + 26 * K], [kbX0 - 8, kbY + 28 * K]], .26 * kA, 2, 51);
  const keys = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 8; i++) {
    const kx = kbX0 + 12 * K + i * (kbX1 - kbX0 - 22 * K) / 8 + (r % 2) * 3 * K, ky = kbY + 7 * K + r * 6.5 * K;
    keys.push(mk([[kx, ky, 1], [kx + 12 * K, ky + 1, .8]], { w: 2.6 * K, tone: TONE.nong, prof: 'even', dry: .6, wet: .2, rough: .1, nb: 2, seed: 5000 + r * 10 + i }));
  }
  put(A, keys, 1, kA);

  // ── 桌上：一摞相册、一只搪瓷杯 ──
  const oA = ss(seg(t, 1.4, 2.3));
  for (let i = 0; i < 3; i++) {
    put(A, [L(ln(W * .150, desk - (7 + i * 9) * K, W * .335, desk - (9 + i * 9) * K, 6), 5 * K, TONE.zhong, { dry: .45, wet: .45, rough: .2, seed: 5100 + i })], 1, oA);
  }
  const cupX = W * .072, cupT = desk - 46 * K;
  put(A, [
    L(circlePts(cupX, cupT, 30 * K, 10, .34), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5201 }),
    L(ln(cupX - 30 * K, cupT, cupX - 27 * K, desk - 12 * K, 4), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5202 }),
    L(ln(cupX + 30 * K, cupT, cupX + 27 * K, desk - 12 * K, 4), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5203 }),
    L(ln(cupX - 27 * K, desk - 8 * K, cupX + 27 * K, desk - 6 * K, 4), 4 * K, TONE.nong, { dry: .3, wet: .6, seed: 5204 }),
  ], 1, oA);

  // ── 人：坐在桌前，弓着背，侧身面向屏 ──
  const pA = ss(seg(t, .8, 1.9));
  const sh = [W * .792, H * .638];
  const hip = [W * .880, H * .786];
  const headC = [W * .742, H * .586];
  const headR = 54 * K;
  // 椅子：背板、坐面、两条腿（都在人后面，线不穿过身上）
  put(A, [
    L(ln(W * .958, hip[1] - 168 * K, W * .972, hip[1] + 2 * K, 6), 13 * K, TONE.nong, { dry: .5, wet: .45, seed: 6001 }),
    L(ln(W * .884, hip[1] + 12 * K, W * .992, hip[1] + 6 * K, 5), 11 * K, TONE.nong, { dry: .4, wet: .5, seed: 6002 }),
    L(ln(W * .978, hip[1] + 14 * K, W * .986, H * .885, 5), 7 * K, TONE.zhong, { dry: .5, wet: .4, seed: 6003 }),
    L(ln(W * .912, hip[1] + 16 * K, W * .918, H * .885, 5), 6 * K, TONE.zhong, { dry: .55, wet: .35, seed: 6004 }),
  ], 1, pA * .9);
  // 躯干：一件旧外套（中等墨，不是剪影）
  const torso = [[sh[0] - 34 * K, sh[1] + 4 * K], [sh[0] + 26 * K, sh[1] - 8 * K], [hip[0] + 12 * K, hip[1] - 52 * K],
    [hip[0] + 2 * K, hip[1] + 8 * K], [hip[0] - 62 * K, hip[1] + 2 * K], [sh[0] - 56 * K, sh[1] + 90 * K]];
  mass(cw, torso, .40 * pA, 3, 61);
  // 外套的轮廓：前襟、后背、下摆各一笔，把这块淡墨收住
  put(A, [
    L(qpts(sh[0] + 24 * K, sh[1] - 6 * K, hip[0] + 8 * K, hip[1] - 54 * K, hip[0] + 2 * K, hip[1] + 6 * K, 8), 4 * K, TONE.jiao, { dry: .4, wet: .5, seed: 6015 }),
    L(qpts(hip[0] - 64 * K, hip[1] + 2 * K, hip[0] - 30 * K, hip[1] + 18 * K, hip[0] + 4 * K, hip[1] + 12 * K, 6), 5 * K, TONE.jiao, { dry: .45, wet: .45, seed: 6016 }),
    // 大腿：坐着的那条腿搭在椅面上
    L(qpts(hip[0] + 2 * K, hip[1] - 12 * K, hip[0] - 34 * K, hip[1] + 26 * K, hip[0] - 64 * K, hip[1] + 30 * K, 5), 30 * K, TONE.zhong, { dry: .25, wet: .7, rough: .24, seed: 6017 }),
  ], 1, pA);
  put(A, [
    L(qpts(sh[0] - 34 * K, sh[1] + 6 * K, sh[0] - 56 * K, sh[1] + 90 * K, hip[0] - 62 * K, hip[1] + 4 * K, 10), 4.5 * K, TONE.jiao, { dry: .35, wet: .6, seed: 6011 }),
    L(qpts(sh[0] - 30 * K, sh[1] + 4 * K, sh[0] - 4 * K, sh[1] + 22 * K, sh[0] + 20 * K, sh[1] - 4 * K, 6), 8 * K, TONE.jiao, { dry: .5, wet: .45, seed: 6012 }),
    L(qpts(sh[0] - 44 * K, sh[1] + 70 * K, hip[0] - 34 * K, hip[1] - 34 * K, hip[0] - 26 * K, hip[1] - 2 * K, 6), 13 * K, TONE.qing, { dry: .95, wet: .05, rough: .4, seed: 6013 }),
    L(qpts(sh[0] - 10 * K, sh[1] + 40 * K, sh[0] - 2 * K, sh[1] + 96 * K, hip[0] - 12 * K, hip[1] - 40 * K, 6), 10 * K, TONE.qing, { dry: .95, wet: .05, rough: .4, seed: 6014 }),
  ], 1, pA);
  // 头：脸是一块淡墨，头发整块压在上面
  mass(cw, circlePts(headC[0], headC[1], headR, 16, 1.02), .07 * pA, 2, 62);
  put(A, [L(circlePts(headC[0], headC[1], headR, 16, 1.02), 3.0 * K, TONE.nong, { dry: .5, wet: .35, seed: 6021 })], 1, pA);
  mass(cw, [[headC[0] - headR * .96, headC[1] - headR * .18], [headC[0] - headR * .86, headC[1] - headR * .78],
    [headC[0] - headR * .34, headC[1] - headR * 1.06], [headC[0] + headR * .38, headC[1] - headR * .98],
    [headC[0] + headR * .96, headC[1] - headR * .46], [headC[0] + headR * .92, headC[1] - headR * .02],
    [headC[0] + headR * .10, headC[1] - headR * .30]], .80 * pA, 2, 64);
  put(A, [
    L(qpts(headC[0] - headR * .94, headC[1] - 12 * K, headC[0] - headR * 1.22, headC[1] + 10 * K, headC[0] - headR * 1.00, headC[1] + 30 * K, 6), 3.2 * K, TONE.jiao, { dry: .4, wet: .55, seed: 6022 }),
    L(ln(headC[0] - headR * 1.02, headC[1] + 22 * K, headC[0] - headR * .70, headC[1] + 24 * K, 4), 2.6 * K, TONE.jiao, { dry: .35, wet: .5, seed: 6023 }),
    L(ln(headC[0] - headR * .62, headC[1] - 14 * K, headC[0] - headR * .38, headC[1] - 12 * K, 3), 2.4 * K, TONE.jiao, { dry: .3, wet: .5, seed: 6026 }),
    // 耳：后脑那一小弧\n    L(qpts(headC[0] + headR * .72, headC[1] - 2 * K, headC[0] + headR * .96, headC[1] + 10 * K, headC[0] + headR * .70, headC[1] + 22 * K, 4), 3 * K, TONE.qing, { dry: .7, wet: .2, seed: 6028 }),\n    // 眉压在眼上\n    L(ln(headC[0] - headR * .74, headC[1] - 24 * K, headC[0] - headR * .40, headC[1] - 22 * K, 3), 3.4 * K, TONE.jiao, { dry: .45, wet: .5, seed: 6029 }),\n    // 颊影与下颌：一笔侧锋，把脸从圆里拉出来
    L(qpts(headC[0] - headR * .86, headC[1] + 2 * K, headC[0] - headR * .58, headC[1] + 34 * K, headC[0] - headR * .12, headC[1] + 40 * K, 6), 5 * K, TONE.qing, { dry: .9, wet: .1, rough: .38, seed: 6027 }),
  ], 1, pA);
  put(A, [L(qpts(headC[0] + 12 * K, headC[1] + headR * .86, sh[0] - 14 * K, sh[1] + 2 * K, sh[0] + 2 * K, sh[1] + 16 * K, 4), 12 * K, TONE.nong, { dry: .4, wet: .55, seed: 6025 })], 1, pA);

  // 手臂：肩 → 肘 → 腕，一根食指在键盘上起落
  const elb = [W * .690, H * .702];
  const wr = [W * .596, H * .676];
  const tapT = [2.55, 3.05, 3.55, 4.05, 4.55, 5.05, 5.55];
  let tap = 0;
  for (const tt of tapT) {
    const u = tq - tt;
    if (u > -.02 && u < .34) tap = Math.max(tap, Math.sin(Math.PI * clamp(u / .34)));
  }
  const finger = [wr[0] - 24 * K, wr[1] + 8 * K - 14 * K * tap];
  put(A, [
    L(qpts(sh[0] - 8 * K, sh[1] + 26 * K, (sh[0] + elb[0]) / 2 + 2 * K, (sh[1] + elb[1]) / 2 - 12 * K, elb[0], elb[1], 6), 28 * K, TONE.zhong, { dry: .3, wet: .7, rough: .22, seed: 6031 }),
    L(qpts(elb[0], elb[1], lerp(elb[0], wr[0], .60), lerp(elb[1], wr[1], .60) + 6 * K, wr[0], wr[1], 6), 14 * K, TONE.nong, { dry: .3, wet: .7, seed: 6032 }),
  ], 1, pA);
  mass(cw, [[wr[0] + 14 * K, wr[1] - 12 * K], [wr[0] - 16 * K, wr[1] - 9 * K], [wr[0] - 20 * K, wr[1] + 11 * K], [wr[0] + 16 * K, wr[1] + 11 * K]], .34 * pA, 2, 63);
  put(A, [L(ln(wr[0] - 12 * K, wr[1] - 2 * K, finger[0], finger[1], 4), 6 * K, TONE.jiao, { dry: .25, wet: .7, seed: 6033 })], 1, pA);
  blot(cd, finger[0] - 4 * K, finger[1] + 3 * K, 5 * K, .55 * pA, .6, 1, 71);

  // ── 题签：竖排「一个指头」，下缀「两年」 ──
  const tx = W * .107, ty0 = H * .150, fs = 92 * K;
  cd.save(); cd.fillStyle = '#0b0906'; cd.textAlign = 'center'; cd.textBaseline = 'middle';
  cd.font = `${fs}px ${FONT}`;
  ['一', '个', '指', '头'].forEach((ch, i) => {
    const p = ss(seg(t, 6.0 + i * .26, 6.5 + i * .26));
    if (p <= 0) return;
    cd.globalAlpha = .88 * p;
    cd.save(); cd.translate(tx, ty0 + i * fs * 1.12); cd.rotate(i % 2 ? .02 : -.022); cd.fillText(ch, 0, 0); cd.restore();
  });
  const p2 = ss(seg(t, 7.0, 7.8));
  cd.globalAlpha = .70 * p2; cd.font = `${fs * .40}px ${FONT}`;
  cd.fillText('两', tx - fs * .30, ty0 + fs * 5.40);
  cd.fillText('年', tx + fs * .26, ty0 + fs * 5.40);
  cd.restore();

  // 朱砂印
  const p3 = ss(seg(t, 7.5, 8.1));
  if (p3 > 0) {
    const sz = fs * .90;
    cc.save(); cc.translate(tx + fs * .04, ty0 + fs * 6.30); cc.rotate(-.035);
    cc.globalAlpha = .80 * p3; cc.fillStyle = '#b02e22';
    cc.fillRect(-sz / 2, -sz / 2, sz, sz);
    cc.globalCompositeOperation = 'destination-out'; cc.globalAlpha = .95;
    cc.font = Math.round(sz * .70) + 'px ' + FONT; cc.textAlign = 'center'; cc.textBaseline = 'middle';
    cc.fillText('陆', 0, -sz * .03);
    cc.restore();
  }

  A.xf(1, 0, 0);
}






