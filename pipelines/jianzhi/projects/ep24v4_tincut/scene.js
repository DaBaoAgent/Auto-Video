import { clamp, lerp, seg, ss, eio, mulberry, TAU } from './lib.js';

// 剪纸：整张红纸，用剪子挖出孔，背后一盏灯透过来。亮的是洞，红的是纸。
const BACK = '#180a06';
const LIGHT = '#ffe6bb';
const DEEP = '#6b120f';
const MID = '#a81c15';
const HOT = '#cf3a22';
const GOLD = '#efc079';

function rp(c, pts, seed, jit, close = true) {
  const r = mulberry(seed);
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = pts[i][0] + (r() - .5) * jit, y = pts[i][1] + (r() - .5) * jit;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  if (close) c.closePath();
}

function fillR(c, pts, col, seed = 7, jit = 2) {
  rp(c, pts, seed, jit); c.fillStyle = col; c.fill();
}

function line(c, pts, col, w, seed = 9, jit = 2.4, open = false) {
  const r = mulberry(seed);
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = pts[i][0] + (r() - .5) * jit, y = pts[i][1] + (r() - .5) * jit;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  if (!open) c.closePath();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  c.stroke();
}

function blossom(c, x, y, r, col, hole) {
  c.save(); c.translate(x, y);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    c.beginPath();
    c.ellipse(Math.cos(a) * r * .60, Math.sin(a) * r * .60, r * .44, r * .28, a, 0, TAU);
    c.fillStyle = col; c.fill();
  }
  c.beginPath(); c.arc(0, 0, r * .32, 0, TAU); c.fillStyle = col; c.fill();
  if (hole) { c.beginPath(); c.arc(0, 0, r * .15, 0, TAU); c.fillStyle = hole; c.fill(); }
  c.restore();
}

function dropShape(c, x, y, s, col, hi) {
  c.beginPath();
  c.moveTo(x, y - 26 * s);
  c.bezierCurveTo(x + 14 * s, y - 4 * s, x + 12 * s, y + 17 * s, x, y + 17 * s);
  c.bezierCurveTo(x - 12 * s, y + 17 * s, x - 14 * s, y - 4 * s, x, y - 26 * s);
  c.fillStyle = col; c.fill();
  if (hi) {
    c.beginPath(); c.ellipse(x - 3.5 * s, y + 3 * s, 2.8 * s, 4.6 * s, -.25, 0, TAU);
    c.fillStyle = hi; c.fill();
  }
}

export function init(W, H) {}

export function paint(c, t, W, H) {
  const K = W / 1080;
  const eye = (x) => H * .400 + (x / W) * H * .115;   // 刃口

  // ---------- 灯 ----------
  c.fillStyle = BACK; c.fillRect(0, 0, W, H);
  const lg = c.createRadialGradient(W * .50, H * .34, 10 * K, W * .5, H * .46, W * .95);
  lg.addColorStop(0, '#fffae6');
  lg.addColorStop(.40, LIGHT);
  lg.addColorStop(1, '#b0632c');
  c.fillStyle = lg; c.fillRect(0, 0, W, H);

  // ---------- 上半红纸 ----------
  fillR(c, [[-6, -6], [W + 6, -6], [W + 6, eye(W)], [-6, eye(0)]], MID, 3, 3);
  const r = mulberry(7071);
  for (let i = 0; i < 1600; i++) {
    const x = r() * W, y = r() * H;
    c.strokeStyle = 'rgba(255,206,160,' + (.02 + r() * .06).toFixed(3) + ')';
    c.lineWidth = .9;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - .5) * 12, y + (r() - .5) * 4); c.stroke();
  }

  // 上方：一剪子旋出来的大团花（透光孔），也是这张纸的主角纹样
  const fx = W * .50, fy = H * .205;
  const petalR = W * .215;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + .18;
    fillR(c, [
      [fx + Math.cos(a) * petalR * .30, fy + Math.sin(a) * petalR * .30],
      [fx + Math.cos(a - .22) * petalR * .92, fy + Math.sin(a - .22) * petalR * .92],
      [fx + Math.cos(a) * petalR * 1.06, fy + Math.sin(a) * petalR * 1.06],
      [fx + Math.cos(a + .22) * petalR * .92, fy + Math.sin(a + .22) * petalR * .92],
    ], 'rgba(255,232,192,.86)', 400 + i, 2.4);
  }
  blossom(c, fx, fy, W * .070, DEEP, LIGHT);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + .5;
    c.beginPath();
    c.ellipse(fx + Math.cos(a) * W * .105, fy + Math.sin(a) * W * .105, W * .030, W * .016, a, 0, TAU);
    c.strokeStyle = 'rgba(255,228,182,.30)'; c.lineWidth = 1.8 * K; c.stroke();
  }

  // ---------- 下半铁皮 ----------
  fillR(c, [[-6, eye(0) - 2 * K], [W + 6, eye(W) - 2 * K], [W + 6, H + 6], [-6, H + 6]], DEEP, 5, 3);
  for (let i = 0; i < 14; i++) {
    const d = (i + .55) * H * .040;
    line(c, [[-10, eye(0) + d], [W + 10, eye(W) + d]], 'rgba(255,190,130,.10)', (1.2 + (i % 3) * .55) * K, 200 + i, 4.2, true);
  }

  // 铁皮下半：一铺透光的菱格（窗花底子）
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const x = W * (.06 + col * .145) + (row % 2) * W * .07;
      const y = H * (.765 + row * .052);
      fillR(c, [[x, y - 16 * K], [x + 18 * K, y], [x, y + 16 * K], [x - 18 * K, y]], 'rgba(255,226,180,.20)', 500 + row * 10 + col, 1.6);
    }
  }

  // 铁皮上的卷草（一笔剪出来的）
  for (let i = 0; i < 4; i++) {
    const cx = W * (.20 + i * .21), cy = H * (.70 + (i % 2) * .045);
    line(c, [[cx - 40 * K, cy], [cx - 10 * K, cy - 26 * K], [cx + 26 * K, cy - 8 * K], [cx + 40 * K, cy + 18 * K]], 'rgba(255,226,180,.17)', 1.9 * K, 370 + i, 2.6, true);
    line(c, [[cx - 26 * K, cy + 34 * K], [cx + 6 * K, cy + 16 * K], [cx + 34 * K, cy + 40 * K]], 'rgba(255,226,180,.13)', 1.7 * K, 380 + i, 2.6, true);
  }

  // ---------- 刃口：一条亮带 ----------
  const flash = Math.max(...[2.55, 4.25, 5.55].map(v => Math.max(0, 1 - Math.abs(t - v) / .40)));
  const shim = .5 + Math.sin(t * 2.2) * .5;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const bg = c.createLinearGradient(0, eye(0) - 40 * K, 0, eye(0) + 46 * K);
  bg.addColorStop(0, 'rgba(255,238,198,0)');
  bg.addColorStop(.5, 'rgba(255,244,212,' + (.58 + shim * .14).toFixed(3) + ')');
  bg.addColorStop(1, 'rgba(255,186,116,0)');
  c.fillStyle = bg;
  c.beginPath();
  c.moveTo(-6, eye(0) - 40 * K); c.lineTo(W + 6, eye(W) - 40 * K);
  c.lineTo(W + 6, eye(W) + 46 * K); c.lineTo(-6, eye(0) + 46 * K);
  c.closePath(); c.fill();
  if (flash > 0) {
    c.globalAlpha = .95 * flash; c.fillStyle = '#fffdf4';
    c.beginPath();
    c.moveTo(-6, eye(0) - 10 * K); c.lineTo(W + 6, eye(W) - 10 * K);
    c.lineTo(W + 6, eye(W) + 12 * K); c.lineTo(-6, eye(0) + 12 * K);
    c.closePath(); c.fill();
  }
  c.restore();
  line(c, [[-6, eye(0)], [W + 6, eye(W)]], GOLD, (2.2 + flash * 2.6) * K, 81, 2.0, true);

  // ---------- 血：一周一刀，七滴 ----------
  const cuts = [1.05, 2.15, 3.20, 4.30, 5.40, 6.55, 7.70];
  cuts.forEach((ct, i) => {
    if (t < ct) return;
    const dt = t - ct;
    const fall = clamp(dt / .85, 0, 1);
    const x0 = W * (.235 + i * .088);
    const y0 = eye(x0);
    const y1 = y0 + (108 + i * 20 + (i % 3) * 14) * K;
    c.save();
    c.globalAlpha = .95;
    const wT = 6.5 + fall * 2.4;
    fillR(c, [[x0 - wT * K, y0], [x0 + wT * K, y0],
              [x0 + (wT - 2.6) * K, lerp(y0, y1, eio(fall))], [x0 - (wT - 2.6) * K, lerp(y0, y1, eio(fall))]],
      'rgba(216,54,30,.94)', 300 + i, 2.2);
    c.restore();
    const hy = lerp(y0, y1, eio(fall));
    dropShape(c, x0, hy + (fall >= 1 ? 9 * K : 0), (1.9 + dt * .22) * 1.05 * K, HOT, '#ffa274');
  });

  // 刃口底下攒起来的一线血
  const pool = ss(seg(t, 8.2, 9.8));
  if (pool > 0) {
    c.save(); c.globalAlpha = .55 * pool;
    fillR(c, [[-6, eye(0) + 34 * K], [W + 6, eye(W) + 34 * K], [W + 6, eye(W) + 44 * K], [-6, eye(0) + 44 * K]],
      'rgba(216,54,30,.9)', 360, 2.4);
    c.restore();
  }

  // ---------- 底边收纸 ----------
  const bandB = H * .072;
  fillR(c, [[-6, H - bandB], [W + 6, H - bandB], [W + 6, H + 6], [-6, H + 6]], MID, 12, 3);
  for (let i = 0; i < 20; i++) {
    const x = (i + .5) * W / 20;
    fillR(c, [[x - 10 * K, H - bandB + 10 * K], [x, H - bandB + 34 * K], [x + 10 * K, H - bandB + 10 * K]], LIGHT, 320 + i, 1.4);
  }
  line(c, [[-6, H - bandB], [W + 6, H - bandB]], GOLD, 2.0 * K, 340, 1.6, true);
  blossom(c, W * .080, H - bandB * .52, W * .038, DEEP, LIGHT);
  blossom(c, W * .920, H - bandB * .52, W * .038, DEEP, LIGHT);

  // ---------- 暗角 ----------
  const vg = c.createRadialGradient(W * .52, H * .40, W * .34, W * .5, H * .5, W * 1.04);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(20,5,3,.58)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
}