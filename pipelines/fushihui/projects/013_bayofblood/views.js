// 血の浜 · 三景 —— 一张木版画三次：墨线、色块错版印上去，纸在吃墨
// 一 · 湖畔の夜（0–7.3）／二 · 血の浜（7.4–15.0）／三 · 一礼（15.05–21.46）
import { clamp, lerp, seg, ss, eio, eo, ei, mulberry, hash, vnoise, TAU } from './lib.js';
import { W, H, FR, PAL, smooth, poly, carve, wob, line, fillPath, bokashi, kasumi, rgba, mix } from './print.js';
import { pine, rock, goose } from './nature.js';
import { traveler } from './traveler.js';
import { T, q8, q12 } from './story.js';

const S = PAL.sumi;

// ——— 水纹：浮世绘那种粗一笔、两头细的长浪 ———
function waves(x, y0, y1, seed, rows) {
  const R = mulberry(seed);
  for (let k = 0; k < rows; k++) {
    const y = lerp(y0, y1, (k + .55) / rows), n = 2 + (k % 3), amp = 3 + k * .7;
    for (let i = 0; i < n; i++) {
      const w = (210 + R() * 460) * (1 + k * .1), x0 = R() * (W + 260) - 130;
      carve(x, [[x0, y], [x0 + w * .26, y - amp], [x0 + w * .52, y + amp * .45], [x0 + w * .78, y - amp * .8], [x0 + w, y]], 2.2 + k * .5, { taper: [.75, .75], seed: seed + k * 17 + i });
    }
  }
}
// ——— 日/月：一整块实心色，边缘靠对比自己分界（不留高光，免得变成金戒指） ———
function sunDisc(x, cx, cy, r, col) {
  x.fillStyle = col || PAL.ochre; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
}
// ——— 水上那条光路：长短不齐、越远越淡 ———
function lightPath(x, cx, y0, n, seed, col, step) {
  const R = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const w = 130 - i * (70 / n), y = y0 + i * step;
    x.fillStyle = rgba(col, .72 - i * .085);
    x.fillRect(cx - w / 2 + (R() - .5) * 40, y + (R() - .5) * 4, w * (.5 + R() * .7), 4 + i * .5);
  }
}
// ——— 人： Eighty to one hundred thirty pixels; flat silhouette, hood, white mask ———
function fig(x, X, Y, h, col, o = {}) {
  const sw = h * .125, hem = h * .205, top = Y - h * .84;
  x.fillStyle = col;
  // 两条腿（先画，露在衣摆下面）
  x.fillRect(X - hem * .5, Y - h * .1, h * .05, h * .1);
  x.fillRect(X + hem * .22, Y - h * .1, h * .05, h * .1);
  // 长雨衣：肩窄、下摆宽
  x.beginPath();
  x.moveTo(X - sw, top + h * .1);
  x.quadraticCurveTo(X - hem * 1.02, Y - h * .38, X - hem, Y - h * .1);
  x.lineTo(X + hem, Y - h * .1);
  x.quadraticCurveTo(X + hem * 1.02, Y - h * .38, X + sw, top + h * .1);
  x.closePath(); x.fill();
  // 兜帽
  x.beginPath(); x.arc(X, top + h * .02, h * .088, Math.PI * .86, Math.PI * 2.14); x.fill();
  // 面具
  x.fillStyle = PAL.white;
  x.beginPath(); x.ellipse(X, top + h * .035, h * .058, h * .068, 0, 0, TAU); x.fill();
  x.strokeStyle = S; x.lineWidth = Math.max(1.2, h * .01); x.stroke();
  x.fillStyle = S;
  x.fillRect(X - h * .044, top + h * .005, h * .03, h * .011);
  x.fillRect(X + h * .014, top + h * .005, h * .03, h * .011);
  // 衣带
  x.strokeStyle = col; x.lineWidth = h * .022;
  x.beginPath(); x.moveTo(X - hem * .86, Y - h * .42); x.lineTo(X + hem * .86, Y - h * .42); x.stroke();
  if (o.knife) { x.strokeStyle = PAL.white; x.lineWidth = h * .018; x.beginPath(); x.moveTo(X + hem * .8, Y - h * .58); x.lineTo(X + hem * .8 + h * .05, Y - h * .18); x.stroke(); }
}
// ——— 躺着的人：头在一头，躯干一条，腿伸出去，一只手反着摊开 ———
function corpse(x, X, Y, h, dir, col) {
  const L = h * 1.7, hi = Y - h * .2;
  x.fillStyle = col;
  x.beginPath();
  x.moveTo(X - L * .5 * dir, Y - h * .07);
  x.quadraticCurveTo(X - L * .34 * dir, hi, X - L * .08 * dir, hi);
  x.quadraticCurveTo(X + L * .16 * dir, hi * .99, X + L * .22 * dir, Y - h * .03);
  x.lineTo(X + L * .22 * dir, Y + h * .01);
  x.lineTo(X - L * .5 * dir, Y + h * .02);
  x.closePath(); x.fill();
  // 两条腿，一直伸到地
  x.lineCap = 'round'; x.strokeStyle = col; x.lineWidth = h * .062;
  x.beginPath(); x.moveTo(X + L * .18 * dir, Y - h * .11); x.lineTo(X + L * .46 * dir, Y - h * .04); x.stroke();
  x.beginPath(); x.moveTo(X + L * .18 * dir, Y - h * .05); x.lineTo(X + L * .44 * dir, Y - h * .13); x.stroke();
  // 一只手甩开
  x.lineWidth = h * .05;
  x.beginPath(); x.moveTo(X - L * .3 * dir, Y - h * .16); x.lineTo(X - L * .46 * dir, Y - h * .3); x.stroke();
  // 头（带头发）
  x.fillStyle = PAL.skin;
  x.beginPath(); x.ellipse(X - L * .54 * dir, Y - h * .14, h * .105, h * .093, 0, 0, TAU); x.fill();
  x.fillStyle = col;
  x.beginPath(); x.ellipse(X - L * .57 * dir, Y - h * .17, h * .1, h * .06, 0, Math.PI, TAU); x.fill();
  x.strokeStyle = S; x.lineWidth = Math.max(1.3, h * .012);
  x.beginPath(); x.ellipse(X - L * .54 * dir, Y - h * .14, h * .105, h * .093, 0, 0, TAU); x.stroke();
}
// ——— 沙地 ———
function beach(x, y0, y1, c0, c1, seed) {
  const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1);
  x.fillStyle = g; x.fillRect(0, y0, W, y1 - y0);
  const R = mulberry(seed);
  for (let i = 0; i < 130; i++) { x.fillStyle = rgba(PAL.ochre, .3 + R() * .35); x.beginPath(); x.arc(R() * W, y0 + 14 + R() * (y1 - y0 - 14), 1.4 + R() * 2.6, 0, TAU); x.fill(); }
}

// ——— 会动的水：浪在水面上走，笔形每 1/8 秒换一次（木版画不该比相机更稳） ———
function liveWater(x, t, y0, y1, n, seed, o = {}) {
  const q = q8(t), R = mulberry(seed + (Math.floor(q * 8) % 7) * 11);
  const xa = o.xa ?? 0, xb = o.xb ?? W;
  for (let k = 0; k < n; k++) {
    const y = y0 + (y1 - y0) * ((k + .5) / n);
    const spd = (o.spd ?? 56) + k * (o.acc ?? 13);
    for (let i = 0; i < 3; i++) {
      const span = xb - xa, x0 = xa + (((i / 3) * span + q * spd) % span) - 40;
      const w = (o.w0 ?? 120) + R() * (o.wv ?? 100) + k * 9;
      const pts = [[x0, y + R() * 3], [x0 + w * .3, y - 7 - k * 1.1], [x0 + w * .62, y + 4 + R() * 2], [x0 + w, y - 2]];
      carve(x, pts, (o.lw ?? 2.0) + k * .2, { taper: [.6, .55], seed: seed + k * 13 + i });
    }
  }
}
// ——— 水面上的碎光：长短呼吸 ———
function glints(x, t, cx, y0, n, step, w0) {
  for (let i = 0; i < n; i++) {
    const ph = .5 + .5 * Math.sin(t * 2.3 + i * 1.27);
    const w = w0 * (1 - i / (n * 1.6)) * (.55 + .55 * ph);
    x.globalAlpha = .16 + .26 * ph;
    x.fillStyle = rgba(PAL.white, 1);
    x.fillRect(cx - w / 2 + Math.sin(t * .95 + i * .8) * 11, y0 + i * step, w, 3 + i * .3);
  }
  x.globalAlpha = 1;
}
// ——— 日／月外面那几圈光：慢慢收放（只画上半圈，压不到海面） ———
function halo(x, t, cx, cy, r, a) {
  const b = .5 + .5 * Math.sin(t * 1.05);
  for (let k = 0; k < 3; k++) {
    x.strokeStyle = rgba(PAL.ochreL, (a ?? .14) - k * .035 + .05 * b);
    x.lineWidth = 2.3 - k * .5;
    x.beginPath(); x.arc(cx, cy, r + k * 12 + b * 5, Math.PI * 1.03, Math.PI * 1.97); x.stroke();
  }
}

// ————————————————————————— 一 · 湖畔の夜 —————————————————————————
const HZ1 = 470, BANK1 = 884;
const PINE1 = [[104, 700, 1.04, .26], [232, 748, .82, -.18], [366, 790, .68, .12]];
export const V1 = {
  id: 'v1',
  layers: {
    sky: { g: 1, grain: .09, draw(x) {
      bokashi(x, 0, FR.y0 - 20, W, HZ1 + 30, PAL.prus, .96, .1, { rough: 30, seed: 31 });
      bokashi(x, 0, 180, W, HZ1 + 24, PAL.prusL, 0, .42, { rough: 24, seed: 32 });
      x.fillStyle = PAL.white; x.beginPath(); x.arc(1420, 224, 74, 0, TAU); x.fill();
      x.strokeStyle = rgba(PAL.skyL, .34); x.lineWidth = 3; x.beginPath(); x.arc(1420, 224, 88, 0, TAU); x.stroke();
    } },
    far: { g: 1, grain: .04, draw(x) {
      x.fillStyle = PAL.prusD; x.beginPath(); x.moveTo(-20, HZ1 + 2);
      for (let X = -20; X <= W + 20; X += 30) x.lineTo(X, HZ1 - 6 - Math.abs(Math.sin(X * .011)) * 22 - vnoise(X * .02) * 12);
      x.lineTo(W + 20, HZ1 + 2); x.closePath(); x.fill();
    } },
    sea: { g: 1, grain: .06, draw(x) {
      const g = x.createLinearGradient(0, HZ1, 0, BANK1 + 6);
      g.addColorStop(0, '#2b5468'); g.addColorStop(.45, '#3a7379'); g.addColorStop(1, '#4c887c');
      x.fillStyle = g; x.fillRect(0, HZ1, W, BANK1 + 6 - HZ1);
      // 月影：把色挖掉，留纸
      x.save(); x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) {
        const y = HZ1 + 16 + i * 14.6 + (hash(i + 40) - .5) * 9, w = 20 + i * 8.6 + hash(i) * 30;
        x.globalAlpha = .30 - i * .006;
        x.beginPath(); x.ellipse(1420 + (hash(i + 7) - .5) * 130, y, w, 2.2 + i * .22, 0, 0, TAU); x.fill();
      }
      x.restore();
      // 左岬
      x.fillStyle = PAL.greenD; x.beginPath(); x.moveTo(-20, HZ1 - 12);
      x.lineTo(110, HZ1 + 8); x.lineTo(280, HZ1 + 96); x.lineTo(520, HZ1 + 250); x.lineTo(640, BANK1 + 6);
      x.lineTo(-20, BANK1 + 6); x.closePath(); x.fill();
    } },
    shore: { g: 2, grain: .05, draw(x) {
      beach(x, BANK1, FR.y1 + 12, '#a67d4d', '#c6a061', 7);
      // 营地的柴：两根交叉
      x.fillStyle = PAL.woodD;
      x.save(); x.translate(206, 978); x.rotate(.18); x.fillRect(-66, -7, 132, 13); x.restore();
      x.save(); x.translate(206, 978); x.rotate(-.16); x.fillRect(-60, -6, 120, 12); x.restore();
      x.fillStyle = PAL.wood; x.save(); x.translate(206, 982); x.rotate(.02); x.fillRect(-44, -5, 88, 9); x.restore();
      for (const t of PINE1) pine(x, t[0], t[1], t[2], { seed: (t[0] | 0), lean: t[3], needle: PAL.pine, lines: false });
      pine(x, 1806, 1000, .62, { seed: 22, lean: -.24, needle: PAL.pine, lines: false });
    } },
    fire: { g: 3, grain: .05, draw(x) {
      // 火：一小撮，柴堆上冒起来
      x.fillStyle = rgba(PAL.beni, .9); x.beginPath();
      x.moveTo(206, 926); x.quadraticCurveTo(232, 954, 218, 972); x.quadraticCurveTo(206, 976, 194, 972); x.quadraticCurveTo(180, 952, 206, 926); x.fill();
      x.fillStyle = PAL.ochreL; x.beginPath();
      x.moveTo(206, 942); x.quadraticCurveTo(220, 958, 212, 970); x.quadraticCurveTo(202, 972, 198, 968); x.quadraticCurveTo(196, 954, 206, 942); x.fill();
      x.fillStyle = rgba(PAL.ochre, .6); x.beginPath(); x.ellipse(206, 978, 62, 18, 0, 0, TAU); x.fill();
    } },
    key: { g: 0, speck: .12, draw(x) {
      x.fillStyle = S;
      carve(x, [[-20, HZ1], [W + 20, HZ1]], 2.2, { taper: [0, 0] });
      const ridge = []; for (let X = -20; X <= 660; X += 26) ridge.push([X, X < 280 ? HZ1 + Math.pow(X / 280, 2) * 96 : HZ1 + 96 + (X - 280) * .53]);
      carve(x, ridge, 3.2, { taper: [.1, .1], seed: 5 });
      waves(x, HZ1 + 28, BANK1 - 12, 77, 5);
      carve(x, [[640, BANK1 + 4], [W + 20, BANK1 + 12]], 2.4, { taper: [0, 0] });
      for (const t of PINE1) pine(x, t[0], t[1], t[2], { seed: (t[0] | 0), lean: t[3], fills: false, lw: 2.2 });
      pine(x, 1806, 1000, .62, { seed: 22, lean: -.24, fills: false, lw: 2.0 });
      // 柴
      x.lineWidth = 1.8; x.strokeStyle = S;
      x.save(); x.translate(206, 978); x.rotate(.18); x.strokeRect(-66, -7, 132, 13); x.restore();
      x.save(); x.translate(206, 978); x.rotate(-.16); x.strokeRect(-60, -6, 120, 12); x.restore();
      // 岸上那人
      fig(x, 1540, 936, 116, S, { knife: true });
      // 前景草
      const R = mulberry(41);
      for (let i = 0; i < 30; i++) { const X = 300 + R() * 1500, Y = 986 + R() * 52; carve(x, [[X, Y], [X + 4, Y - 24 - R() * 26]], 2, { taper: [.1, .9], seed: 90 + i }); }
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('far'); R.L('sea'); R.L('shore'); R.L('fire'); R.L('key');
    const tq = q8(t);
    // 水在走：湖面上的浪，一笔一笔从左往右淌
    R.D(1, x2 => liveWater(x2, t, HZ1 + 26, BANK1 - 16, 4, 301, { xa: 620, xb: 1904, spd: 46 }));
    // 月影荡漾：光在水上碎，长短不齐
    R.D(1, x2 => glints(x2, t, 1420, HZ1 + 26, 9, 34, 210));
    // 月晕收放
    R.D(1, x2 => halo(x2, t, 1420, 224, 92, .11));
    // 天上两片飘过去的云
    R.D(1, x2 => {
      for (let i = 0; i < 2; i++) {
        const px = -300 + ((t * (24 + i * 9) + i * 900) % (W + 700));
        const py = 150 + i * 92 + Math.sin(t * .4 + i) * 7;
        x2.globalAlpha = .10 + .04 * (.5 + .5 * Math.sin(t * .7 + i * 2));
        x2.fillStyle = rgba(PAL.white, 1);
        for (let k = 0; k < 3; k++) { x2.beginPath(); x2.ellipse(px + k * 64, py + (k % 2) * 9, 96 - k * 8, 15 - k * 2, 0, 0, TAU); x2.fill(); }
      }
      x2.globalAlpha = 1;
    });
    R.D(3, x2 => {   // 月影轻微抖
      x2.globalAlpha = .04 + .03 * (.5 + .5 * Math.sin(tq * 1.9)); x2.fillStyle = PAL.white;
      for (let i = 0; i < 5; i++) x2.fillRect(1392 + i * 26, HZ1 + 18 + i * 48, 20, 4);
      x2.globalAlpha = 1;
    });
    R.D(3, x2 => {  // 火苗 + 火星
      const f = .5 + .5 * Math.sin(t * 7.3);
      x2.globalAlpha = .5; x2.fillStyle = PAL.beniL;
      x2.beginPath(); x2.ellipse(206, 942 - f * 6, 9 + f * 3, 12 + f * 5, 0, 0, TAU); x2.fill();
      for (let i = 0; i < 5; i++) {
        const ph = (t * .85 + i * .2) % 1, sx = 206 + Math.sin(i * 2.3 + t * 1.6) * 8;
        x2.globalAlpha = (1 - ph) * .75;
        x2.beginPath(); x2.arc(sx, 940 - ph * 52, 1.6 + (1 - ph) * 1.8, 0, TAU); x2.fill();
      }
      x2.globalAlpha = 1;
    });
  },
};

// ————————————————————————— 二 · 血の浜 —————————————————————————
const HZ2 = 398, BANK2 = 700;
const BODY2 = [[584, 786, 92, 1], [872, 828, 88, -1], [1146, 796, 84, 1]];
const CLIFF2 = [[W + 20, HZ2 - 70], [1790, HZ2 - 26], [1742, HZ2 + 46], [1712, HZ2 + 150], [1692, BANK2 + 4], [W + 20, BANK2 + 4]];
export const V2 = {
  id: 'v2',
  layers: {
    sky: { g: 3, grain: .09, draw(x) {
      bokashi(x, 0, FR.y0 - 20, W, HZ2 + 14, '#7a1e1a', .97, .38, { rough: 32, seed: 41 });
      bokashi(x, 0, 100, W, HZ2 + 10, '#bd3728', 0, .6, { rough: 26, seed: 42 });
    } },
    gold: { g: 2, grain: .04, draw(x) { sunDisc(x, 944, HZ2 - 46, 142); } },
    sea: { g: 1, grain: .06, draw(x) {
      const g = x.createLinearGradient(0, HZ2, 0, BANK2 + 8);
      g.addColorStop(0, '#8b1c17'); g.addColorStop(.5, '#6c1412'); g.addColorStop(1, '#560f0e');
      x.fillStyle = g; x.fillRect(0, HZ2, W, BANK2 + 8 - HZ2);
    } },
    path: { g: 2, grain: .03, draw(x) { lightPath(x, 944, HZ2 + 16, 7, 5, PAL.ochreL, 34); } },
    cliff: { g: 1, grain: .05, draw(x) {
      x.fillStyle = '#241a1c'; x.beginPath(); x.moveTo(CLIFF2[0][0], CLIFF2[0][1]);
      for (let i = 1; i < CLIFF2.length; i++) x.lineTo(CLIFF2[i][0], CLIFF2[i][1]);
      x.closePath(); x.fill();
    } },
    beach: { g: 2, grain: .04, draw(x) {
      beach(x, BANK2, FR.y1 + 12, '#c79146', '#dfbc78', 11);
    } },
    blood: { g: 3, grain: .03, draw(x) {
      const R = mulberry(53);
      for (const [bx, by, s, d] of BODY2) {
        // 一摊不规则的血：绕一圈抖出来的多边形
        x.fillStyle = rgba('#9d1b16', .92);
        const cxp = bx + 18 * d, cyp = by + 15, rx = s * 1.5, ry = s * .33;
        x.beginPath();
        for (let i = 0; i <= 18; i++) {
          const a = i / 18 * TAU, rj = 1 + (R() - .5) * .34;
          const px = cxp + Math.cos(a) * rx * rj, py = cyp + Math.sin(a) * ry * rj;
          i ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.closePath(); x.fill();
        x.fillStyle = rgba('#6d0e0c', .9);
        x.beginPath(); x.ellipse(bx - 8 * d, by + 11, s * .82, s * .19, 0, 0, TAU); x.fill();
        // 两道淌出来的血
        x.fillStyle = rgba('#7d130f', .85);
        x.beginPath(); x.ellipse(cxp + rx * .92, cyp + ry * .5, s * .17, s * .1, .3, 0, TAU); x.fill();
        x.beginPath(); x.ellipse(cxp - rx * .8, cyp - ry * .3, s * .12, s * .08, -.2, 0, TAU); x.fill();
      }
    } },
    key: { g: 0, speck: .13, draw(x) {
      x.fillStyle = S;
      carve(x, [[-20, HZ2], [W + 20, HZ2]], 2.2, { taper: [0, 0] });
      waves(x, HZ2 + 30, BANK2 - 10, 23, 4);
      carve(x, [[-10, BANK2], [W + 10, BANK2 + 8]], 2.6, { taper: [0, 0] });
      carve(x, CLIFF2, 2.6, { taper: [.1, .1], seed: 9 });
      for (const [bx, by, s, d] of BODY2) corpse(x, bx, by, s, d, S);
      fig(x, 244, 824, 118, S, { knife: true });
      for (let i = 0; i < 4; i++) carve(x, [[140 + i * 24, 930 + i * 30], [640 + i * 40, 916 + i * 28], [1180, 946 + i * 26]], 1.4, { taper: [.45, .45], seed: 40 + i });
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('gold'); R.L('sea'); R.L('path'); R.L('cliff'); R.L('beach'); R.L('blood'); R.L('key');
    // 日晕收放：三圈光在日头外面呼吸
    R.D(2, x2 => halo(x2, t, 944, HZ2 - 46, 150, .13));
    // 血海在动：浪从右往左拍，越近越大
    R.D(1, x2 => liveWater(x2, t, HZ2 + 34, BANK2 - 18, 4, 411, { xa: 80, xb: 1660, spd: 62, lw: 2.2 }));
    // 日影在水上碎开
    R.D(2, x2 => glints(x2, t, 944, HZ2 + 18, 7, 32, 160));
    // 天上的霞在走
    R.D(3, x2 => {
      for (let i = 0; i < 2; i++) {
        const px = -260 + ((t * (20 + i * 8) + i * 1100) % (W + 620));
        const py = 96 + i * 76 + Math.sin(t * .35 + i * 1.7) * 6;
        x2.globalAlpha = .05 + .03 * (.5 + .5 * Math.sin(t * .8 + i * 2.1));
        x2.fillStyle = rgba(PAL.ochreL, 1);
        for (let k = 0; k < 3; k++) { x2.beginPath(); x2.ellipse(px + k * 74, py + (k % 2) * 11, 108 - k * 10, 13 - k * 2, 0, 0, TAU); x2.fill(); }
      }
      x2.globalAlpha = 1;
    });
  },
};

// ————————————————————————— 三 · 一礼 —————————————————————————
const HZ3 = 498, BANK3 = 770;
export const V3 = {
  id: 'v3',
  layers: {
    sky: { g: 1, grain: .09, draw(x) {
      bokashi(x, 0, FR.y0 - 20, W, HZ3 + 18, '#3d2444', .97, .32, { rough: 30, seed: 51 });
      bokashi(x, 0, 120, W, HZ3 + 12, '#8e2b26', 0, .64, { rough: 26, seed: 52 });
    } },
    sun: { g: 2, grain: .04, draw(x) { sunDisc(x, 1146, HZ3 - 4, 126); } },
    sea: { g: 1, grain: .06, draw(x) {
      const g = x.createLinearGradient(0, HZ3, 0, BANK3 + 8);
      g.addColorStop(0, '#7d1b17'); g.addColorStop(1, '#4b0d0c');
      x.fillStyle = g; x.fillRect(0, HZ3, W, BANK3 + 8 - HZ3);
    } },
    path: { g: 2, grain: .03, draw(x) { lightPath(x, 1146, HZ3 + 14, 6, 9, PAL.ochreL, 32); } },
    beach: { g: 2, grain: .04, draw(x) {
      beach(x, BANK3, FR.y1 + 12, '#b3803c', '#d2a75f', 17);
      pine(x, 96, 1046, 1.14, { seed: 21, lean: .22, needle: PAL.pine, lines: false });
      pine(x, 1800, 1046, 1.0, { seed: 22, lean: -.2, needle: PAL.pine, lines: false });
    } },
    fig: { g: 3, grain: .05, draw(x) {
      traveler(x, 520, 950, 148, { mode: 'stand', t: 0, wind: .55, lean: .3 });
    } },
    key: { g: 0, speck: .13, draw(x) {
      x.fillStyle = S;
      carve(x, [[-20, HZ3], [W + 20, HZ3]], 2.2, { taper: [0, 0] });
      waves(x, HZ3 + 34, BANK3 - 10, 31, 4);
      carve(x, [[-10, BANK3], [W + 10, BANK3 + 8]], 2.6, { taper: [0, 0] });
      pine(x, 96, 1046, 1.14, { seed: 21, lean: .22, fills: false, lw: 2.6 });
      pine(x, 1800, 1046, 1.0, { seed: 22, lean: -.2, fills: false, lw: 2.6 });
      for (let i = 0; i < 3; i++) carve(x, [[80, 880 + i * 40], [700 + i * 30, 860 + i * 38], [1400, 890 + i * 34]], 1.4, { taper: [.45, .45], seed: 70 + i });
      x.save(); x.globalAlpha = .28; x.fillStyle = S;
      x.beginPath(); x.ellipse(606, 952, 104, 13, 0, 0, TAU); x.fill(); x.restore();
    } },
  },
  paint(x, t, R) {
    R.L('sky'); R.L('sun'); R.L('sea'); R.L('path'); R.L('beach'); R.L('fig'); R.L('key');
    R.D(2, x2 => halo(x2, t, 1146, HZ3 - 4, 134, .12));
    R.D(1, x2 => liveWater(x2, t, HZ3 + 28, BANK3 - 14, 3, 511, { xa: 120, xb: 1760, spd: 40, lw: 2.0 }));
    R.D(2, x2 => glints(x2, t, 1146, HZ3 + 16, 6, 32, 140));
    R.D(3, x2 => {   // 风从海上过来：一层极淡的雾贴着水走
      const px = -240 + ((t * 26) % (W + 600));
      x2.globalAlpha = .08 + .04 * (.5 + .5 * Math.sin(t * .6));
      x2.fillStyle = rgba(PAL.white, 1);
      for (let k = 0; k < 3; k++) { x2.beginPath(); x2.ellipse(px + k * 82, HZ3 + 40 + (k % 2) * 12, 130 - k * 12, 12, 0, 0, TAU); x2.fill(); }
      x2.globalAlpha = 1;
    });
  },
};

export const VIEWS = [V1, V2, V3];



