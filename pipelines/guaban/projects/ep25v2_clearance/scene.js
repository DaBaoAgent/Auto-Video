import { clamp, lerp, seg, ss, eio, eo, spring, back, mulberry, TAU } from './lib.js';

// 刮版画 · EP25 第二页：脚踏高度 / 电机离地够不够。
// 物件叙事：不画人，只画脚踏、挂上去的电机、地面那道空隙。
const INK = '#090807';
const BOARD = '#e7d9bb';
const CREAM = '#f3e8d2';
const WARM = '#d9822f';
const FLAME = '#ffc26c';

let grain = null;

export function init(W, H) {
  const n = document.createElement('canvas');
  n.width = 400; n.height = 400;
  const nc = n.getContext('2d');
  const r = mulberry(4481);
  for (let i = 0; i < 9000; i++) {
    const x = r() * 400, y = r() * 400;
    nc.strokeStyle = 'rgba(243,232,210,' + (.05 + r() * .12).toFixed(3) + ')';
    nc.lineWidth = 1.2 + r() * 1.6;
    nc.beginPath(); nc.moveTo(x, y); nc.lineTo(x + (r() - .5) * 11, y + (r() - .5) * 5); nc.stroke();
  }
  grain = n;
}

function path(c, pts) {
  c.beginPath();
  for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]);
  c.closePath();
}

function scr(c, pts, w = 2, col = CREAM, jit = 1.1, al = 1) {
  c.save();
  c.globalAlpha *= al;
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.strokeStyle = col; c.lineWidth = w;
  const r = mulberry(Math.floor(pts[0][0] * 7 + pts[0][1] * 13 + pts.length * 31 + w * 5));
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const jx = (r() - .5) * jit, jy = (r() - .5) * jit;
    i ? c.lineTo(pts[i][0] + jx, pts[i][1] + jy) : c.moveTo(pts[i][0] + jx, pts[i][1] + jy);
  }
  c.stroke();
  c.restore();
}

function hatch(c, pts, o = {}) {
  const gap = o.gap ?? 7, ang = (o.ang ?? 40) * Math.PI / 180;
  const w = o.w ?? 1.5, col = o.col ?? CREAM, al = o.al ?? .82, jit = o.jit ?? 2.2;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  c.save();
  path(c, pts); c.clip();
  c.globalAlpha = al;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const r = mulberry(Math.floor(x0 + y0 * 3 + gap * 7));
  for (let d = -R; d <= R; d += gap) {
    const px = cx + nx * d, py = cy + ny * d;
    c.beginPath();
    c.moveTo(px - dx * R + (r() - .5) * jit, py - dy * R + (r() - .5) * jit);
    c.lineTo(px + dx * R + (r() - .5) * jit, py + dy * R + (r() - .5) * jit);
    c.stroke();
  }
  c.restore();
}

function carve(c, str, x, y, size, col = CREAM, align = 'center', weight = 600) {
  c.save();
  c.font = weight + ' ' + Math.round(size) + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
  c.textAlign = align; c.textBaseline = 'middle';
  c.fillStyle = 'rgba(9,8,7,.6)';
  c.fillText(str, x + size * .03, y + size * .05);
  c.fillStyle = col;
  c.fillText(str, x, y);
  c.restore();
}

function ellipseArc(c, cx, cy, r, a0, a1, col = CREAM, w = 3, K = 1) {
  c.save();
  c.strokeStyle = col; c.lineWidth = w * K; c.lineCap = 'round';
  c.beginPath();
  c.ellipse(cx, cy, r, r, 0, a0, a1);
  c.stroke();
  c.restore();
}

export function paint(c, t, W, H) {
  const K = W / 1080;

  c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
  c.fillStyle = INK; c.fillRect(0, 0, W, H);

  const push = ss(seg(t, 0, 10));
  const sc = lerp(1.0, 1.06, push);
  c.save();
  c.translate(W / 2, H / 2); c.scale(sc, sc); c.translate(-W * .50, -H * .50);

  // 墙：同样的粗刀痕，只给两个走向
  hatch(c, [[-W * .2, -H * .2], [W * 1.2, -H * .2], [W * 1.2, H * .82], [-W * .2, H * .82]],
    { gap: 26, ang: .34, w: 3.0, al: .085, jit: 14 });
  hatch(c, [[-W * .2, -H * .2], [W * 1.2, -H * .2], [W * 1.2, H * .82], [-W * .2, H * .82]],
    { gap: 74, ang: 1.26, w: 2.2, al: .05, jit: 26 });

  // 光：右上格窗，与第一页同源
  const on = .55 + eo(seg(t, 0, .65)) * .45;
  const wx0 = W * .795, wx1 = W * .930, wy0 = H * .060, wy1 = H * .400;
  c.save(); c.globalAlpha = .90 * on; c.fillStyle = FLAME;
  c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0); c.restore();
  scr(c, [[wx0 - 6 * K, wy0], [wx0 - 6 * K, wy1]], 5.0, 'rgba(243,232,210,.85)', 2, 1);
  scr(c, [[wx1 + 6 * K, wy0], [wx1 + 6 * K, wy1]], 5.0, 'rgba(243,232,210,.85)', 2, 1);
  scr(c, [[wx0, wy0 - 5 * K], [wx1, wy0 - 5 * K]], 5.0, 'rgba(243,232,210,.85)', 2, 1);
  for (let i = 1; i <= 2; i++) {
    const yy = wy0 + (wy1 - wy0) * (i / 3);
    scr(c, [[wx0, yy], [wx1, yy]], 4.0, 'rgba(243,232,210,' + (.72 * on).toFixed(2) + ')', 2, 1);
  }
  const fan = [[wx0, wy1], [wx1, wy1], [W * .55, H * .95], [W * .02, H * .70]];
  const fg = c.createLinearGradient(0, wy1, 0, H * .95);
  fg.addColorStop(0, 'rgba(255,226,176,' + (.32 * on).toFixed(3) + ')');
  fg.addColorStop(1, 'rgba(217,130,47,0)');
  c.save(); c.fillStyle = fg; path(c, fan); c.fill(); c.restore();

  const glow = (.28 + ss(seg(t, 0, 2.0)) * .10 + Math.sin(t * 2.5) * .012) * on;

  // ---- 地面：一道亮的地平线，往下黑掉 ----
  const gy = H * .845;
  c.save(); c.globalAlpha = .16; c.fillStyle = CREAM;
  c.fillRect(-W * .05, gy, W * 1.1, H * .008); c.restore();
  scr(c, [[-W * .05, gy], [W * 1.05, gy]], 3.6, 'rgba(243,232,210,.62)', 5, 1);
  hatch(c, [[-W * .05, gy + H * .008], [W * 1.05, gy + H * .008], [W * 1.05, H * 1.02], [-W * .05, H * 1.02]],
    { gap: 20, ang: .02, w: 1.4, al: .05, jit: 8 });

  // ---- 脚踏板：一块斜着的板，两根小腿管从上面下来 ----
  const pL = W * .175, pR = W * .755;      // 板左右
  const pY = H * .605, tilt = H * .022;    // 板前缘更低
  const plateTop = [[pL, pY], [pR, pY - H * .012], [pR, pY - H * .012 + H * .046], [pL, pY + H * .046]];
  c.save(); c.globalAlpha = .34; c.fillStyle = CREAM; path(c, plateTop); c.fill(); c.restore();
  hatch(c, plateTop, { gap: 14, ang: .02, w: 1.5, al: .13, jit: 4 });
  scr(c, [[pL, pY], [pR, pY - H * .012]], 4.6, 'rgba(243,232,210,.88)', 1.8, 1);
  scr(c, [[pL, pY + H * .046], [pR, pY - H * .012 + H * .046]], 3.2, 'rgba(9,8,7,.90)', 2.0, 1);
  // 防滑纹：板上几道短斜线
  for (let i = 0; i < 7; i++) {
    const x = pL + (pR - pL) * (.10 + i * .115);
    scr(c, [[x, pY + H * .006], [x + W * .012, pY + H * .040]], 1.8, 'rgba(243,232,210,.55)', 2);
  }
  // 小腿管：两根从板上缘往上，到画面外
  for (const x of [pL + W * .075, pR - W * .085]) {
    c.save(); c.globalAlpha = .26; c.fillStyle = CREAM;
    c.fillRect(x - W * .016, H * .30, W * .032, pY - H * .30); c.restore();
    scr(c, [[x + W * .016, H * .30], [x + W * .016, pY]], 2.6, 'rgba(243,232,210,.60)', 1.6, 1);
    scr(c, [[x - W * .016, H * .30], [x - W * .016, pY]], 2.0, 'rgba(9,8,7,.8)', 1.6, 1);
  }
  // 支架到车轮的一截横管（交代这是台车，不是桌面）
  scr(c, [[pR + W * .01, H * .30], [W * .96, H * .245]], 3.0, 'rgba(243,232,210,.45)', 2, 1);

  // ---- 电机：从下面升上来，挂在踏板底面 ----
  const rise = spring(seg(t, 1.0, 3.0), 6, .38);
  const mx = W * .315, myBase = H * .708;
  const my = lerp(myBase + H * .13, myBase, rise);
  const mr = W * .112;
  c.save(); c.globalAlpha = clamp(.25 + rise * .70);
  // 机身：一个厚圆盘，右上一道亮
  c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.closePath();
  c.fillStyle = 'rgba(243,232,210,.26)'; c.fill();
  c.restore();
  if (rise > .2) {
    c.save();
    c.beginPath(); c.arc(mx, my, mr * .98, 0, TAU); c.clip();
    hatch(c, [[mx - mr, my - mr], [mx + mr, my - mr], [mx + mr, my + mr], [mx - mr, my + mr]],
      { gap: 15, ang: 1.02, w: 1.7, al: .24, jit: 5 });
    c.restore();
  }
  ellipseArc(c, mx, my, mr, 0, TAU, 'rgba(243,232,210,' + (.55 + rise * .35).toFixed(2) + ')', 5.0, K);
  // 电机中央的轴毂
  ellipseArc(c, mx, my, mr * .38, 0, TAU, 'rgba(243,232,210,.60)', 3.0, K);
  scr(c, [[mx - mr * .30, my - mr * .30], [mx + mr * .30, my + mr * .30]], 2.4, 'rgba(9,8,7,.75)', 1.4, 1);
  // 上方的挂钩：连接踏板与电机的立杆
  c.save(); c.globalAlpha = clamp(.2 + rise * .7); c.fillStyle = 'rgba(243,232,210,.92)';
  c.fillRect(mx - W * .020, my - mr - H * .012, W * .040, H * .030); c.restore();
  scr(c, [[mx + W * .020, my - mr - H * .012], [mx + W * .020, my - mr + H * .018]], 2.2, 'rgba(9,8,7,.85)', 1, 1);
  // 高光：右上
  if (rise > .4) {
    scr(c, [
      [mx + mr * Math.cos(-1.20), my + mr * Math.sin(-1.20)],
      [mx + mr * Math.cos(-.80), my + mr * Math.sin(-.80)],
      [mx + mr * Math.cos(-.40), my + mr * Math.sin(-.40)],
    ], 5.2, 'rgba(255,226,176,' + (.30 + glow * .22).toFixed(2) + ')', 3, 1);
  }

  // ---- 那道空隙：地面到电机底，一根双箭头 ----
  const arX = mx - mr - W * .105;
  const aGrow = eio(seg(t, 3.1, 4.4));
  const yTop = my + mr, yBot = gy;
  const yMid = yTop + (yBot - yTop) * .5;
  const half = (yBot - yTop) / 2;
  if (aGrow > .02 && yBot - yTop > H * .02) {
    const h = half * aGrow;
    scr(c, [[arX, yMid - h], [arX, yMid + h]], 3.0, 'rgba(243,232,210,.78)', 1.8, 1);
    // 两个箭头尖
    const tip = W * .024;
    scr(c, [[arX - tip, yMid - h + tip * 1.5], [arX, yMid - h], [arX + tip, yMid - h + tip * 1.5]], 3.0, 'rgba(243,232,210,.78)', 1.4, 1);
    scr(c, [[arX - tip, yMid + h - tip * 1.5], [arX, yMid + h], [arX + tip, yMid + h - tip * 1.5]], 3.0, 'rgba(243,232,210,.78)', 1.4, 1);
    // 两条横向的对位虚线，标出量的是哪一段
    scr(c, [[arX - W * .03, yTop], [mx - mr * .9, yTop]], 1.8, 'rgba(243,232,210,.40)', 5, 1);
    scr(c, [[arX - W * .03, yBot], [W * .98, yBot]], 1.8, 'rgba(243,232,210,.40)', 7, 1);
  }

  // ---- 读数 6 cm ----
  const k = back(seg(t, 4.5, 5.0));
  if (k > .01) {
    const y = H * .245;
    c.save();
    c.globalAlpha = clamp(k);
    c.translate(W * .5, y); c.scale(k, k); c.translate(-W * .5, -y);
    const n = Math.round(6 * eo(seg(t, 4.55, 5.3)));
    carve(c, String(n), W * .455, y, W * .130);
    carve(c, 'cm', W * .610, y + W * .033, W * .044, 'rgba(243,232,210,.86)', 'left', 500);
    scr(c, [[W * .30, y + W * .085], [W * .70, y + W * .085]], 3.2, 'rgba(243,232,210,.78)', 1.8, 1);
    carve(c, 'GROUND CLEARANCE', W * .5, y + W * .130, W * .029, 'rgba(243,232,210,.60)', 'center', 500);
    c.restore();
  }

  c.restore();

  if (grain) {
    const pat = c.createPattern(grain, 'repeat');
    c.save(); c.globalAlpha = .34; c.fillStyle = pat; c.fillRect(0, 0, W, H); c.restore();
  }
  const vg = c.createRadialGradient(W * .66, H * .40, W * .18, W * .5, H * .5, W * 1.02);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.76)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
}
