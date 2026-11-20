import { clamp, lerp, seg, ss, eio, mulberry, TAU } from './lib.js';

// 刮版画：整张板先刷黑，再用刀刮出浅色。所有"亮"都是刻痕，暗部就是没刮的地方。
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
  for (let i = 0; i < 8000; i++) {
    const x = r() * 400, y = r() * 400;
    nc.strokeStyle = 'rgba(243,232,210,' + (.04 + r() * .09).toFixed(3) + ')';
    nc.lineWidth = .8 + r() * .9;
    nc.beginPath(); nc.moveTo(x, y); nc.lineTo(x + (r() - .5) * 7, y + (r() - .5) * 3); nc.stroke();
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

// the boy: a kid standing, in his own units (hips at 0, feet at 0)
function figure(c, x, footY, s, ph, shake, colour) {
  const sway = Math.sin(ph) * .075;
  const step = Math.sin(ph * 2);
  c.save();
  c.translate(x, footY);
  c.rotate(sway);
  c.translate(shake * Math.sin(ph * 9) * 3 * s, 0);

  const hipY = -196 * s, shY = hipY - 132 * s, r = 46 * s;
  c.fillStyle = colour;

  // legs: short trousers, knees, out-turned feet
  path(c, [[-18 * s, hipY], [20 * s, hipY], [26 * s + step * 18 * s, -8 * s], [-2 * s + step * 22 * s, -8 * s]]); c.fill();
  path(c, [[8 * s, hipY], [44 * s, hipY], [48 * s - step * 18 * s - 0, -6 * s], [22 * s - step * 22 * s, -6 * s]]); c.fill();
  c.beginPath(); c.ellipse(-6 * s + step * 16 * s, -6 * s, 22 * s, 7 * s, .05, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(38 * s - step * 16 * s, -6 * s, 22 * s, 7 * s, -.05, 0, TAU); c.fill();

  // coat
  path(c, [[-50 * s, shY + 6 * s], [44 * s, shY], [56 * s, hipY + 14 * s], [-54 * s, hipY + 14 * s]]); c.fill();

  // arms, held slightly away for balance
  c.save();
  c.strokeStyle = colour; c.lineCap = 'round';
  c.lineWidth = 17 * s;
  c.beginPath(); c.moveTo(-44 * s, shY + 18 * s); c.lineTo(-66 * s, shY + 84 * s); c.lineTo(-70 * s, hipY + 10 * s); c.stroke();
  c.lineWidth = 16 * s;
  c.beginPath(); c.moveTo(38 * s, shY + 18 * s); c.lineTo(58 * s, shY + 82 * s); c.lineTo(62 * s, hipY + 8 * s); c.stroke();
  c.restore();

  // head in profile, facing left: forehead, nose, lips, chin, jaw
  const prof = [
    [.02, -1.06], [.56, -.96], [.90, -.56], [1.00, -.06], [.90, .34], [.62, .72],
    [.26, .94], [.02, .88], [-.16, .70], [-.06, .56], [-.34, .40], [-.14, .28],
    [-.32, .06], [-.26, -.28], [-.14, -.62],
  ];
  c.save();
  c.translate(-12 * s, shY - 36 * s);
  c.rotate(-.10 + Math.sin(ph * 7) * .04 * shake);
  path(c, prof.map(p => [p[0] * r, p[1] * r]));
  c.fillStyle = colour; c.fill();
  c.restore();

  c.restore();
}

export function paint(c, t, W, H) {
  const K = W / 1080;

  c.fillStyle = BOARD; c.fillRect(0, 0, W, H);
  c.fillStyle = INK; c.fillRect(0, 0, W, H);

  const push = ss(seg(t, 0, 10));
  const sc = lerp(1.0, 1.045, push);

  c.save();
  c.translate(W / 2, H / 2); c.scale(sc, sc); c.translate(-W * .50, -H * .50);

  // ---------- the wall ----------
  hatch(c, [[-W * .2, -H * .2], [W * 1.2, -H * .2], [W * 1.2, H * .845], [-W * .2, H * .845]], { gap: 12, ang: 3, w: 1.5, al: .20, jit: 7 });
  hatch(c, [[-W * .2, -H * .2], [W * 1.2, -H * .2], [W * 1.2, H * .845], [-W * .2, H * .845]], { gap: 64, ang: 86, w: 1.2, al: .06, jit: 18 });
  for (let i = 0; i < 6; i++) {
    const y0 = H * (.16 + i * .11);
    scr(c, [[W * .03, y0], [W * .20, y0 + 8 * K], [W * .38, y0 - 6 * K]], 1.2, 'rgba(243,232,210,.16)', 6);
  }

  // ---------- the doorway: the one bright thing ----------
  const dx0 = W * .545, dx1 = W * .885, dy0 = H * .235, dy1 = H * .845;
  const heat = ss(seg(t, 0, 3.0));
  c.fillStyle = CREAM;
  c.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  const fan = [[dx0, dy1], [dx1, dy1], [W * 1.10, H * 1.02], [W * .30, H * 1.02]];
  const lg = c.createLinearGradient(0, dy1, 0, H * 1.02);
  lg.addColorStop(0, 'rgba(243,232,210,.55)');
  lg.addColorStop(1, 'rgba(243,232,210,.06)');
  c.save(); c.fillStyle = lg; path(c, fan); c.fill(); c.restore();
  const dg = c.createRadialGradient((dx0 + dx1) / 2, (dy0 + dy1) / 2, 20 * K, (dx0 + dx1) / 2, (dy0 + dy1) / 2, W * .7);
  const glow = .16 + heat * .10 + ss(seg(t, 5.8, 8.4)) * .16 + Math.sin(t * 3.1) * .012;
  dg.addColorStop(0, 'rgba(255,196,120,' + glow.toFixed(3) + ')');
  dg.addColorStop(.5, 'rgba(217,130,47,' + (glow * .45).toFixed(3) + ')');
  dg.addColorStop(1, 'rgba(217,130,47,0)');
  c.fillStyle = dg; c.fillRect(0, 0, W, H);
  scr(c, [[dx0, dy0], [dx0, dy1]], 5);
  scr(c, [[dx1, dy0], [dx1, dy1]], 5);
  scr(c, [[dx0, dy0], [dx1, dy0]], 5);
  scr(c, [[dx0 - 14 * K, dy0 - 10 * K], [dx1 + 14 * K, dy0 - 10 * K]], 2, 'rgba(243,232,210,.35)', 4);
  c.save(); c.globalAlpha = .9; c.fillStyle = INK; c.fillRect(dx0 - 10 * K, dy0, 12 * K, dy1 - dy0); c.restore();
  for (let i = 0; i < 7; i++) {
    scr(c, [[-W * .1, H * (.86 + i * .022)], [W * 1.1, H * (.855 + i * .022)]], 1.1, 'rgba(243,232,210,.14)', 8);
  }

  // ---------- the boy, backlit, and his shadow on the wall ----------
  const walk = ss(seg(t, 5.6, 9.4));
  const bx = lerp(W * .405, W * .462, walk);
  const footY = H * .845;
  const s = 1.58;
  const ph = Math.floor(t * 6) / 6 * 4.0;
  const shk = 1 - walk * .55;

  // shadow: sheared from the foot point, long across the wall to the left
  c.save();
  const shS = .80 + Math.sin(t * 1.15) * .13;
  c.beginPath(); c.rect(-W * .2, -H * .25, dx0 + W * .2, H * 1.3); c.clip();
  c.translate(bx, footY);
  c.transform(1, 0, shS, 1, 0, 0);
  c.translate(-bx, -footY);
  c.globalAlpha = .94;
  figure(c, bx - 4 * K, footY, s, ph, shk, INK);
  c.restore();
  c.save();
  c.globalAlpha = .28;
  c.translate(bx, footY); c.transform(1, 0, shS, 1, 0, 0); c.translate(-bx, -footY);
  c.strokeStyle = 'rgba(255,200,130,.5)'; c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(bx + 40 * s, footY - 330 * s);
  c.lineTo(bx + 60 * s, footY - 180 * s);
  c.stroke();
  c.restore();

  // the boy himself
  figure(c, bx, footY, s, ph, shk, INK);

  // rim light on his back and crown, from the doorway behind him
  scr(c, [[bx + 40 * s, footY - 300 * s], [bx + 46 * s, footY - 160 * s], [bx + 40 * s, footY - 20 * s]], 3.0, 'rgba(255,214,150,.58)', 2.4);
  scr(c, [[bx + 24 * s, footY - 372 * s], [bx + 34 * s, footY - 318 * s]], 2.4, 'rgba(255,214,150,.52)', 2);

  // fever: heat coming off his head
  for (let i = 0; i < 4; i++) {
    if (heat < .55 && i > 2) break;
    const pts = [];
    for (let j = 0; j < 10; j++) {
      pts.push([bx - 28 * s + i * 24 * s + Math.sin(j * .62 + t * 3 + i) * 9 * K, footY - 392 * s - j * 15 * K]);
    }
    scr(c, pts, 1.8, 'rgba(255,196,110,.5)', 2.4);
  }

  c.restore();

  if (grain) {
    const pat = c.createPattern(grain, 'repeat');
    c.save(); c.globalAlpha = .30; c.fillStyle = pat; c.fillRect(0, 0, W, H); c.restore();
  }
  const vg = c.createRadialGradient(W * .62, H * .46, W * .24, W * .5, H * .5, W * .98);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.66)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
}
