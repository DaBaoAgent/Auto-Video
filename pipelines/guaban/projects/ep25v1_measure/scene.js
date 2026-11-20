import { clamp, lerp, seg, ss, eio, eo, spring, back, mulberry, TAU } from './lib.js';

// 刮版画：整张板先刷黑，再用刀刮出浅色。所有"亮"都是刻痕，暗部就是没刮的地方。
// EP25 产品线 —— 一页两个测量：支架宽度 / 管径。物件叙事，不画人。
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
  const r = mulberry(9137);
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

// 刻进板子里的字：先落一道暗影，再上亮
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

// 读数：不画框，直接把刀刻的大数字按在暗处
function readout(c, t, W, H, num, unit, label, y, appear, rollEnd) {
  const k = back(seg(t, appear, appear + .5));
  if (k <= .01) return;
  const n = Math.round(num * eo(seg(t, appear + .05, rollEnd)));
  c.save();
  c.globalAlpha = clamp(k);
  c.translate(W * .5, y); c.scale(k, k); c.translate(-W * .5, -y);
  carve(c, String(n), W * .455, y, W * .135);
  carve(c, unit, W * .615, y + W * .035, W * .046, 'rgba(243,232,210,.86)', 'left', 500);
  // 数字下面一刀：亮线下压一道暗
  scr(c, [[W * .30, y + W * .088], [W * .70, y + W * .088]], 3.4, 'rgba(243,232,210,.80)', 1.8, 1);
  carve(c, label, W * .5, y + W * .135, W * .030, 'rgba(243,232,210,.60)', 'center', 500);
  c.restore();
}

// ---------- 段 A：支架宽度 ----------
function stageA(c, t, W, H, K, glow) {
  const ty = H * .655;                     // 台面前缘
  const rx0 = W * .035, rx1 = W * .965;
  const cy = H * .505;                     // 管轴
  const rr = H * .058;                     // 管半径

  // 管身：先刮出一条亮的柱体，再排线压出金属的暗
  c.save();
  c.globalAlpha = .30;
  c.fillStyle = CREAM;
  c.fillRect(rx0, cy, rx1 - rx0, rr * 2);
  c.beginPath(); c.ellipse(rx0, cy + rr, rr, rr, 0, -Math.PI / 2, Math.PI / 2); c.fill();
  c.beginPath(); c.ellipse(rx1, cy + rr, rr, rr, 0, Math.PI / 2, Math.PI * 1.5); c.fill();
  c.restore();
  hatch(c, [[rx0, cy], [rx1, cy], [rx1, cy + rr * 2], [rx0, cy + rr * 2]],
    { gap: 13, ang: .03, w: 1.6, al: .16, jit: 5 });
  // 上沿：一道粗亮，一道细亮叠着，才像金属的反光
  scr(c, [[rx0, cy + rr * .16], [rx1, cy + rr * .16]], 5.2, 'rgba(243,232,210,.90)', 1.8, 1);
  scr(c, [[rx0, cy - rr * .04], [rx1, cy - rr * .04]], 2.0, 'rgba(255,226,176,' + (.5 + glow * .2).toFixed(2) + ')', 3.2, 1);
  // 下沿压暗
  scr(c, [[rx0, cy + rr * 2.02], [rx1, cy + rr * 2.02]], 4.4, 'rgba(9,8,7,.92)', 2.4, 1);
  ellipseArc(c, rx0 + 1 * K, cy + rr, rr, -Math.PI / 2, Math.PI / 2, 'rgba(243,232,210,.55)', 3.0, K);
  ellipseArc(c, rx1 - 1 * K, cy + rr, rr, Math.PI / 2, Math.PI * 1.5, 'rgba(243,232,210,.32)', 3.0, K);

  // 夹具：骑在管上的一只卡箍，落到 x = .30W
  const clampX = W * .30;
  const land = spring(seg(t, .45, 1.6), 6, .42);
  const dy = (1 - land) * -H * .05;
  c.save();
  c.globalAlpha = clamp(.22 + land * .74);
  c.fillStyle = 'rgba(243,232,210,.95)';
  c.fillRect(clampX - W * .080, cy - rr * .92 + dy, W * .160, rr * .52);
  c.fillRect(clampX - W * .062, cy - rr * .92 + dy, W * .026, rr * 3.15);
  c.fillRect(clampX + W * .036, cy - rr * .92 + dy, W * .026, rr * 3.15);
  c.restore();
  // 卡箍上的螺栓：一个小亮圆 + 一道暗
  c.save();
  c.globalAlpha = clamp(land);
  ellipseArc(c, clampX, cy - rr * .66 + dy, W * .012, 0, TAU, 'rgba(255,226,176,.75)', 2.4, K);
  c.restore();
  scr(c, [[clampX, cy - rr * .66 + dy], [clampX + W * .010, cy - rr * .60 + dy]], 2.2, 'rgba(9,8,7,.85)', 1, 1);

  // 卷尺：贴着管子上沿拉出去，量到夹具
  const pull = eio(seg(t, 1.0, 3.0));
  const x0 = W * .075;
  const target = clampX - W * .012;
  const len = lerp(0.001, target - x0, pull);
  const bandH = H * .028, by = cy - rr - H * .040;
  if (len > W * .004) {
    c.save(); c.globalAlpha = .92; c.fillStyle = CREAM;
    c.fillRect(x0, by, len, bandH); c.restore();
    c.save(); c.fillStyle = INK;
    const step = W * .0158;
    for (let x = x0 + W * .006; x < x0 + len - 2; x += step) {
      const i = Math.round((x - x0) / step);
      c.fillRect(x, by, 1.7 * K, bandH * (i % 5 === 0 ? .80 : .42));
    }
    c.restore();
    // 尺头那道竖向亮
    c.save(); c.globalAlpha = .95; c.fillStyle = 'rgba(243,232,210,.95)';
    c.fillRect(x0 + len - W * .005, by - H * .008, W * .007, bandH + H * .016); c.restore();
    // 扫读的一道暖光
    const sweep = seg(t, 2.1, 3.4);
    if (sweep > 0 && sweep < 1) {
      const sx = x0 + len * sweep;
      const g = c.createLinearGradient(sx - W * .05, 0, sx + W * .05, 0);
      g.addColorStop(0, 'rgba(255,196,120,0)');
      g.addColorStop(.5, 'rgba(255,196,120,.26)');
      g.addColorStop(1, 'rgba(255,196,120,0)');
      c.save(); c.globalAlpha = .9; c.fillStyle = g;
      c.fillRect(sx - W * .05, by - H * .018, W * .10, bandH + H * .036); c.restore();
    }
  }

  // 读数 42 cm
  readout(c, t, W, H, 42, 'cm', 'FRAME WIDTH', H * .215, 2.85, 3.95);

  // 台面：一道被光切开的边，往下迅速黑掉
  c.save();
  c.globalAlpha = .13; c.fillStyle = CREAM;
  c.fillRect(-W * .05, ty, W * 1.1, H * .008);
  c.restore();
  scr(c, [[-W * .05, ty], [W * 1.05, ty]], 3.2, 'rgba(243,232,210,.58)', 4, 1);
  // 木纹：横着划几刀短的，别成一条直线
  for (let i = 0; i < 9; i++) {
    const yy = ty + H * (.012 + i * .030);
    scr(c, [[W * (.04 + i * .055), yy], [W * (.24 + i * .058), yy + 2 * K]], 1.2, 'rgba(243,232,210,.16)', 7);
  }
  hatch(c, [[-W * .05, ty + H * .012], [W * 1.05, ty + H * .012], [W * 1.05, H * 1.02], [-W * .05, H * 1.02]],
    { gap: 19, ang: .02, w: 1.4, al: .055, jit: 7 });

  // 前景：台面上的一只零件盘，几颗螺丝，落在光斑右下
  const px = W * .715, py = H * .805, pr = W * .078;
  c.save();
  c.globalAlpha = .42; c.fillStyle = CREAM;
  c.beginPath(); c.ellipse(px, py, pr, pr * .40, 0, 0, TAU); c.fill();
  c.restore();
  ellipseArc(c, px, py, pr, 0, TAU, 'rgba(243,232,210,.62)', 3.0, K);
  c.save();
  c.globalAlpha = .60;
  ellipseArc(c, px, py + pr * .05, pr * .72, .2, Math.PI * 1.1, 'rgba(243,232,210,.55)', 2.0, K);
  c.restore();
  for (let i = 0; i < 4; i++) {
    const a = .6 + i * 1.5, rx = px + Math.cos(a) * pr * .48, ry = py + Math.sin(a) * pr * .17;
    ellipseArc(c, rx, ry, W * .0085, 0, TAU, 'rgba(243,232,210,.72)', 1.8, K);
    scr(c, [[rx - W * .008, ry], [rx + W * .008, ry]], 1.6, 'rgba(9,8,7,.8)', 1, 1);
  }
  // 台沿：到底再压一道黑，画面不飘
  scr(c, [[-W * .05, H * .955], [W * 1.05, H * .948]], 3.0, 'rgba(243,232,210,.22)', 5, 1);
}

// ---------- 段 B：管径 ----------
function stageB(c, t, W, H, K, glow) {
  const cx = W * .50, cyc = H * .425;
  const R = W * .215;
  const ri = W * .152;

  const draw = eo(seg(t, 4.9, 5.7));
  const a1 = TAU * draw;

  // 管壁：亮环 + 壁上的斜排线（金属的暗面）
  c.save();
  c.beginPath(); c.arc(cx, cyc, R, 0, a1); c.arc(cx, cyc, ri, a1, 0, true); c.closePath();
  c.globalAlpha = .34; c.fillStyle = CREAM; c.fill();
  c.restore();
  if (draw > .5) {
    c.save();
    c.beginPath(); c.arc(cx, cyc, R * .96, 0, a1); c.arc(cx, cyc, ri * 1.05, a1, 0, true); c.closePath(); c.clip();
    hatch(c, [[cx - R, cyc - R], [cx + R, cyc - R], [cx + R, cyc + R], [cx - R, cyc + R]],
      { gap: 15, ang: 1.05, w: 1.8, al: .26, jit: 6 });
    c.restore();
  }
  ellipseArc(c, cx, cyc, R, 0, a1, CREAM, 5.4, K);
  ellipseArc(c, cx, cyc, ri, -a1, 0, 'rgba(243,232,210,.66)', 3.6, K);
  // 内孔：唯一真正"没刮"的地方
  c.save();
  c.beginPath(); c.arc(cx, cyc, ri * .97, 0, a1); c.closePath();
  c.fillStyle = INK; c.fill();
  c.restore();
  // 右上四分之一的高光
  scr(c, [
    [cx + R * Math.cos(-1.15), cyc + R * Math.sin(-1.15)],
    [cx + R * Math.cos(-.72), cyc + R * Math.sin(-.72)],
    [cx + R * Math.cos(-.28), cyc + R * Math.sin(-.28)],
    [cx + R * Math.cos(.10), cyc + R * Math.sin(.10)],
  ], 6.0, 'rgba(255,226,176,' + (.34 + glow * .18).toFixed(2) + ')', 3.4, 1);

  // 卡尺：主尺横在下，两爪从左右夹过来
  const close = spring(seg(t, 5.35, 6.6), 7, .40);
  const gapOpen = W * .34, gapClose = R + W * .010;
  const gap = lerp(gapOpen, gapClose, close);
  const barY = cyc + R + H * .062;
  const barW = W * .60;
  c.save(); c.globalAlpha = .88; c.fillStyle = CREAM;
  c.fillRect(cx - barW / 2, barY, barW, H * .020); c.restore();
  scr(c, [[cx - barW / 2, barY], [cx + barW / 2, barY]], 2.4, 'rgba(9,8,7,.85)', 1.4, 1);
  for (let i = 0; i <= 24; i++) {
    const x = cx - barW / 2 + barW * .96 * i / 24;
    c.save(); c.fillStyle = INK; c.globalAlpha = .92;
    c.fillRect(x, barY, 1.6 * K, H * .020 * (i % 5 === 0 ? .92 : .48)); c.restore();
  }
  for (const s of [-1, 1]) {
    const jx = cx + s * gap;
    const x0 = s > 0 ? jx : jx - W * .026;
    c.save(); c.globalAlpha = .94; c.fillStyle = 'rgba(243,232,210,.95)';
    c.fillRect(x0, cyc - R * 1.22, W * .026, barY + H * .020 - (cyc - R * 1.22));
    c.restore();
    // 爪尖削的斜口
    c.save(); c.globalAlpha = .94; c.fillStyle = 'rgba(243,232,210,.95)';
    c.beginPath();
    c.moveTo(jx, cyc - R * 1.22);
    c.lineTo(jx + s * W * .048, cyc - R * 1.22);
    c.lineTo(jx - s * W * .006, cyc - R * 1.22 + H * .030);
    c.closePath(); c.fill(); c.restore();
    scr(c, [[jx + s * W * .002, cyc - R * 1.14], [jx + s * W * .002, barY + H * .012]], 2.4, 'rgba(9,8,7,.9)', 1.2, 1);
  }

  // 读数 25 mm
  readout(c, t, W, H, 25, 'mm', 'TUBE DIAMETER', H * .715, 6.55, 7.55);
}

export function paint(c, t, W, H) {
  const K = W / 1080;

  c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
  c.fillStyle = INK; c.fillRect(0, 0, W, H);

  const push = ss(seg(t, 0, 10));
  const sc = lerp(1.0, 1.06, push);
  c.save();
  c.translate(W / 2, H / 2); c.scale(sc, sc); c.translate(-W * .50, -H * .50);

  // 墙：大块的刀痕，不是均匀的横纹
  hatch(c, [[-W * .2, -H * .2], [W * 1.2, -H * .2], [W * 1.2, H * .68], [-W * .2, H * .68]],
    { gap: 26, ang: .38, w: 3.0, al: .085, jit: 14 });
  hatch(c, [[-W * .2, -H * .2], [W * 1.2, -H * .2], [W * 1.2, H * .68], [-W * .2, H * .68]],
    { gap: 72, ang: 1.30, w: 2.2, al: .05, jit: 26 });

  // 光源：右上一条窄亮的缝（窗），光扇往左下散 —— 全片只给这一处光
  const on = .55 + eo(seg(t, 0, .7)) * .45;
  const wx0 = W * .795, wx1 = W * .930, wy0 = H * .075, wy1 = H * .470;
  c.save();
  c.globalAlpha = .90 * on; c.fillStyle = FLAME;
  c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  c.restore();
  // 窗的粗边
  scr(c, [[wx0 - 6 * K, wy0], [wx0 - 6 * K, wy1]], 5.0, 'rgba(243,232,210,.85)', 2, 1);
  scr(c, [[wx1 + 6 * K, wy0], [wx1 + 6 * K, wy1]], 5.0, 'rgba(243,232,210,.85)', 2, 1);
  scr(c, [[wx0, wy0 - 5 * K], [wx1, wy0 - 5 * K]], 5.0, 'rgba(243,232,210,.85)', 2, 1);
  // 窗横档：两道，像老厂房那种格窗
  for (let i = 1; i <= 2; i++) {
    const yy = wy0 + (wy1 - wy0) * (i / 3);
    scr(c, [[wx0, yy], [wx1, yy]], 4.0, 'rgba(243,232,210,' + (.72 * on).toFixed(2) + ')', 2, 1);
  }
  // 光扇
  const fan = [[wx0, wy1], [wx1, wy1], [W * .62, H * .98], [W * .06, H * .78]];
  const fg = c.createLinearGradient(0, wy1, 0, H * .98);
  fg.addColorStop(0, 'rgba(255,226,176,' + (.34 * on).toFixed(3) + ')');
  fg.addColorStop(1, 'rgba(217,130,47,0)');
  c.save(); c.fillStyle = fg; path(c, fan); c.fill(); c.restore();
  // 窗前的空气：一道较稠的光柱
  const beam = [[wx0, wy0 + (wy1 - wy0) * .2], [wx1, wy0 + (wy1 - wy0) * .2], [W * .70, H * .80], [W * .30, H * .58]];
  const bg = c.createLinearGradient(0, wy0, 0, H * .80);
  bg.addColorStop(0, 'rgba(255,226,176,' + (.22 * on).toFixed(3) + ')');
  bg.addColorStop(1, 'rgba(255,196,120,0)');
  c.save(); c.fillStyle = bg; path(c, beam); c.fill(); c.restore();

  const glow = (.30 + ss(seg(t, 0, 2.2)) * .10 + Math.sin(t * 2.6) * .012) * on;

  if (t < 4.9) stageA(c, t, W, H, K, glow);
  else stageB(c, t, W, H, K, glow);

  c.restore();

  if (grain) {
    const pat = c.createPattern(grain, 'repeat');
    c.save(); c.globalAlpha = .34; c.fillStyle = pat; c.fillRect(0, 0, W, H); c.restore();
  }
  const vg = c.createRadialGradient(W * .66, H * .42, W * .18, W * .5, H * .5, W * 1.02);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.76)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
}
