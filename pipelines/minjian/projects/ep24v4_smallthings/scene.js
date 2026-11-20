import { clamp, lerp, seg, ss, eio, mulberry, TAU } from './lib.js';

// 民间故事绘本：奶油卡纸，铅笔起稿，水粉从远到近一层层压，越近越厚。
// 这一页不画人：一张小纸条落到门板上，胶带贴住，最后一支铅笔把其中一行圈起来。
const PAPER = '#f3e9d2';
const PENCIL = '#6b6152';
const SHEET = '#fbf3e2';
const WALL = '#f0e0c1';
const DOOR = '#e0c9a1';
const DOORD = '#c2a67c';
const FLOOR = '#cdab86';
const FLOORD = '#b08759';

function shade(hex, k) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
  if (k <= 1) return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')';
  const m = Math.min(.85, k - 1);
  return 'rgb(' + Math.round(r + (243 - r) * m) + ',' + Math.round(g + (233 - g) * m) + ',' + Math.round(b + (210 - b) * m) + ')';
}

function pencil(c, pts, t, o = {}) {
  const seed = Math.floor(t * 10) * 37 + (o.seed ?? 0);
  const r = mulberry(seed);
  const w = o.w ?? 1.8, al = o.al ?? .52, jit = o.jit ?? 2.0;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = o.col ?? PENCIL;
  for (let k = 0; k < 2; k++) {
    c.globalAlpha = al * (k ? .5 : 1);
    c.lineWidth = w * (k ? .72 : 1);
    c.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const jx = (r() - .5) * jit, jy = (r() - .5) * jit;
      i ? c.lineTo(pts[i][0] + jx, pts[i][1] + jy) : c.moveTo(pts[i][0] + jx, pts[i][1] + jy);
    }
    if (o.close) c.closePath();
    c.stroke();
  }
  c.restore();
}

function gouache(c, pts, col, o = {}) {
  c.save();
  c.globalAlpha = o.al ?? .97;
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]);
  c.closePath(); c.fill();
  c.restore();
}

function shape(c, col, al, draw) {
  c.save(); c.globalAlpha = al; c.fillStyle = col; draw(); c.restore();
}

function softWash(c, cx, cy, rx, ry, col, al, seed) {
  const r = mulberry(seed);
  c.save();
  for (let i = 0; i < 16; i++) {
    const k = 1 - i / 16;
    c.globalAlpha = al / 16 * 1.9;
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(cx + (r() - .5) * rx * .10, cy + (r() - .5) * ry * .18, rx * k, ry * k, 0, 0, TAU);
    c.fill();
  }
  c.restore();
}

export function init(W, H) {}

export function paint(c, t, W, H) {
  // ---------- 纸 ----------
  c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
  const pr = mulberry(1201);
  for (let i = 0; i < 1400; i++) {
    const x = pr() * W, y = pr() * H;
    c.strokeStyle = 'rgba(148,128,98,' + (.03 + pr() * .05).toFixed(3) + ')';
    c.lineWidth = .8;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (pr() - .5) * 10, y + (pr() - .5) * 4); c.stroke();
  }

  // ---------- 墙、门板、地面 ----------
  softWash(c, W * .30, H * .18, W * .60, H * .16, '#fbf2d6', .38, 31);
  softWash(c, W * .90, H * .42, W * .34, H * .24, '#cdb894', .18, 32);

  const dL = W * .112, dR = W * .888, dT = H * .030, dB = H * .862;
  gouache(c, [[dL, dT], [dR, dT], [dR, dB], [dL, dB]], DOOR, { al: .96 });
  // 门板木纹：几道竖的、深浅不一
  for (let i = 0; i < 3; i++) {
    const x = lerp(dL + W * .10, dR - W * .10, i / 2);
    gouache(c, [[x - W * .012, dT], [x + W * .012, dT], [x + W * .012, dB], [x - W * .012, dB]], shade(DOOR, .94), { al: .07 });
    pencil(c, [[x, dT + H * .03], [x + W * .005, H * .52], [x - W * .003, dB - H * .03]], t, { w: 1.2, al: .11, seed: 21 + i, jit: 4 });
  }
  // 门板四周的边
  gouache(c, [[dL, dT], [dL + W * .012, dT], [dL + W * .012, dB], [dL, dB]], shade(DOOR, .78), { al: .40 });
  gouache(c, [[dR - W * .012, dT], [dR, dT], [dR, dB], [dR - W * .012, dB]], shade(DOOR, .80), { al: .34 });
  gouache(c, [[dL, dT], [dR, dT], [dR, dT + H * .010], [dL, dT + H * .010]], shade(DOOR, .78), { al: .34 });
  // 门的一条横缝


  const GY = H * .900;
  gouache(c, [[-10, GY], [W + 10, GY - H * .006], [W + 10, H + 10], [-10, H + 10]], FLOOR, { al: .95 });
  gouache(c, [[-10, H * .972], [W + 10, H * .966], [W + 10, H + 10], [-10, H + 10]], FLOORD, { al: .94 });
  pencil(c, [[-8, GY], [W + 8, GY - H * .006]], t, { w: 2.2, al: .30, seed: 41 });

  // ---------- 节拍 ----------
  const land = ss(seg(t, 0.00, 2.40));      // 纸条从上往下落到门板上
  const press = ss(seg(t, 2.40, 2.90));     // 贴住、微微回弹
  const tape1 = ss(seg(t, 2.90, 3.24));     // 左胶带贴上
  const tape2 = ss(seg(t, 3.44, 3.78));     // 右胶带贴上

  // 纸的落点与角度
  const PW = W * .556, PH = H * .462;
  const PX = lerp(W * .396, W * .462, eio(land));
  const PY = lerp(H * .120, H * .452, eio(land)) + Math.sin(press * Math.PI) * H * .004;
  const pAng = lerp(-.118, -.022, eio(land)) + Math.sin(land * Math.PI * 1.6) * .014 * (1 - land);

  // 纸的投影（落定后贴在门上，影子收窄）
  shape(c, '#7d6244', .08 + .08 * land, () => {
    c.save(); c.translate(PX + W * (.012 - .006 * land), PY + H * (.016 - .008 * land)); c.rotate(pAng);
    c.beginPath(); c.rect(-PW * .5, -PH * .5, PW, PH); c.fill(); c.restore();
  });

  // ---------- 纸条 ----------
  c.save();
  c.translate(PX, PY); c.rotate(pAng);
  gouache(c, [[-PW * .5, -PH * .5], [PW * .5, -PH * .5], [PW * .5, PH * .5], [-PW * .5, PH * .5]], SHEET, { al: .99 });
  // 纸的暗边
  gouache(c, [[PW * .5 - W * .022, -PH * .5], [PW * .5, -PH * .5], [PW * .5, PH * .5], [PW * .5 - W * .018, PH * .5]], '#e7dabf', { al: .30 });
  gouache(c, [[-PW * .5, PH * .5 - H * .014], [PW * .5, PH * .5 - H * .014], [PW * .5, PH * .5], [-PW * .5, PH * .5]], '#e3d5b9', { al: .46 });
  // 右上折角
  gouache(c, [[PW * .5 - W * .052, -PH * .5], [PW * .5, -PH * .5], [PW * .5 - W * .006, -PH * .5 + H * .024]], '#efe3c8', { al: .95 });
  pencil(c, [[PW * .5 - W * .052, -PH * .5], [PW * .5 - W * .006, -PH * .5 + H * .024]], t, { w: 1.4, al: .24, seed: 44 });
  pencil(c, [[-PW * .5, -PH * .5], [PW * .5, -PH * .5]], t, { w: 1.8, al: .28, seed: 45 });
  pencil(c, [[-PW * .5, -PH * .5], [-PW * .5, PH * .5]], t, { w: 1.8, al: .24, seed: 46 });

  // 手写：五行短划，第三行是重点
  const rows = [
    { y: -PH * .30, x0: -PW * .34, len: .42, n: 7 },
    { y: -PH * .18, x0: -PW * .34, len: .60, n: 10 },
    { y: -PH * .05, x0: -PW * .22, len: .40, n: 6 },
    { y: PH * .09, x0: -PW * .34, len: .54, n: 9 },
    { y: PH * .22, x0: -PW * .30, len: .34, n: 5 },
  ];
  const rr = mulberry(777);
  for (let i = 0; i < rows.length; i++) {
    const r0 = rows[i];
    const span = PW * r0.len;
    for (let k = 0; k < r0.n; k++) {
      const x0 = r0.x0 + span * (k / r0.n) + rr() * W * .005;
      const ln = span / r0.n * (.60 + rr() * .34);
      pencil(c, [[x0, r0.y + (rr() - .5) * H * .007], [x0 + ln, r0.y + (rr() - .5) * H * .007]], t,
        { w: i === 2 ? 2.0 : 1.5, al: i === 2 ? .44 : .28, seed: 47 + i, jit: 1.7 });
    }
  }
  pencil(c, [[-PW * .20, PH * .024], [PW * .19, PH * .018]], t, { w: 1.7, al: .16, seed: 52 });

  // 风吹纸角：右下角掀起来一小块
  const flap = .55 + .45 * Math.sin(t * 2.1);
  const fx = PW * .5, fy = PH * .5;
  shape(c, shade(SHEET, .82), .55, () => {
    c.beginPath();
    c.moveTo(fx - W * .062, fy);
    c.quadraticCurveTo(fx - W * .020, fy - H * .030 * flap, fx, fy - H * .052 * flap);
    c.lineTo(fx, fy);
    c.closePath(); c.fill();
  });
  shape(c, '#efe3c8', .92, () => {
    c.beginPath();
    c.moveTo(fx - W * .060, fy);
    c.quadraticCurveTo(fx - W * .018, fy - H * .026 * flap, fx + W * .002, fy - H * .050 * flap);
    c.lineTo(fx, fy);
    c.closePath(); c.fill();
  });
  pencil(c, [[fx - W * .060, fy], [fx - W * .018, fy - H * .026 * flap], [fx + W * .002, fy - H * .050 * flap]], t, { w: 1.3, al: .22, seed: 53 });

  // 末尾铅笔圈
  const circ = ss(seg(t, 6.60, 8.90));
  if (circ > 0) {
    const crx = PW * .222, cry = H * .046;
    const a0 = -2.85, a1 = a0 + (TAU - .55) * circ;
    const pts = [];
    for (let a = a0; a <= a1; a += .085) {
      const k = 1 + Math.sin(a * 3.1) * .05;
      pts.push([Math.cos(a) * crx * k, rows[2].y + Math.sin(a) * cry * k]);
    }
    if (pts.length > 1) pencil(c, pts, t, { w: 2.6, al: .58, jit: 1.8, seed: 61, col: '#4e463a' });
  }
  c.restore();

  // ---------- 胶带：两条，从上面落下来压住纸角 ----------
  const tapes = [
    { x: -PW * .5 + W * .020, y: -PH * .5 + H * .046, r: .58, p: tape1 },
    { x: PW * .5 - W * .020, y: -PH * .5 + H * .046, r: -.52, p: tape2 },
  ];
  for (const tp of tapes) {
    if (tp.p <= 0) continue;
    const wpt = [PX + tp.x * Math.cos(pAng) - tp.y * Math.sin(pAng),
      PY + tp.x * Math.sin(pAng) + tp.y * Math.cos(pAng)];
    const drop = (1 - tp.p) * H * .045;
    c.save();
    c.translate(wpt[0], wpt[1] - H * .030 - drop + H * .030 * tp.p);
    c.rotate(pAng + tp.r);
    gouache(c, [[-W * .052, -H * .013], [W * .052, -H * .013], [W * .052, H * .013], [-W * .052, H * .013]], '#e6d7b5', { al: .74 + tp.p * .16 });
    gouache(c, [[-W * .052, -H * .013], [W * .052, -H * .013], [W * .052, -H * .008], [-W * .052, -H * .008]], '#f4e9cd', { al: .50 });
    pencil(c, [[-W * .052, -H * .013], [W * .052, -H * .013], [W * .052, H * .013], [-W * .052, H * .013], [-W * .052, -H * .013]], t, { w: 1.1, al: .16, seed: 71 });
    c.restore();
  }

  // ---------- 铅笔（圈的时候才出现） ----------
  let penAt = null;
  if (circ >= 0) {
    const crx = PW * .222, cry = H * .046;
    const a = -2.85 + (TAU - .55) * circ;
    const k = 1 + Math.sin(a * 3.1) * .05;
    const lx = Math.cos(a) * crx * k, ly = rows[2].y + Math.sin(a) * cry * k;
    penAt = [PX + lx * Math.cos(pAng) - ly * Math.sin(pAng), PY + lx * Math.sin(pAng) + ly * Math.cos(pAng)];
  }
  if (penAt && t > 5.9) {
    const tail = [penAt[0] + W * .112, penAt[1] - H * .162];
    const ang = Math.atan2(tail[1] - penAt[1], tail[0] - penAt[0]);
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const bw = W * .0125;
    // 削出的浅木锥
    shape(c, '#e3c69b', .97, () => {
      c.beginPath();
      c.moveTo(penAt[0], penAt[1]);
      c.lineTo(penAt[0] + Math.cos(ang) * W * .034 + nx * bw, penAt[1] + Math.sin(ang) * W * .034 + ny * bw);
      c.lineTo(penAt[0] + Math.cos(ang) * W * .034 - nx * bw, penAt[1] + Math.sin(ang) * W * .034 - ny * bw);
      c.closePath(); c.fill();
    });
    // 杆
    shape(c, '#a9713a', .97, () => {
      c.beginPath();
      c.moveTo(penAt[0] + Math.cos(ang) * W * .028 + nx * bw, penAt[1] + Math.sin(ang) * W * .028 + ny * bw);
      c.lineTo(tail[0] + nx * bw, tail[1] + ny * bw);
      c.lineTo(tail[0] - nx * bw, tail[1] - ny * bw);
      c.lineTo(penAt[0] + Math.cos(ang) * W * .028 - nx * bw, penAt[1] + Math.sin(ang) * W * .028 - ny * bw);
      c.closePath(); c.fill();
    });
    // 杆的暗边
    shape(c, '#7d4f25', .42, () => {
      c.beginPath();
      c.moveTo(penAt[0] + Math.cos(ang) * W * .028 - nx * bw, penAt[1] + Math.sin(ang) * W * .028 - ny * bw);
      c.lineTo(tail[0] - nx * bw, tail[1] - ny * bw);
      c.lineTo(tail[0] - nx * bw * .25, tail[1] - ny * bw * .25);
      c.lineTo(penAt[0] + Math.cos(ang) * W * .028 - nx * bw * .25, penAt[1] + Math.sin(ang) * W * .028 - ny * bw * .25);
      c.closePath(); c.fill();
    });
    // 铅芯
    shape(c, '#3c3a35', .95, () => { c.beginPath(); c.arc(penAt[0], penAt[1], W * .0042, 0, TAU); c.fill(); });
    pencil(c, [[penAt[0] + Math.cos(ang) * W * .030 + nx * bw, penAt[1] + Math.sin(ang) * W * .030 + ny * bw],
      [tail[0] + nx * bw, tail[1] + ny * bw]], t, { w: 1.2, al: .20, seed: 95 });
  }

  // ---------- 暗角 ----------
  const vg = c.createRadialGradient(W * .5, H * .46, W * .40, W * .5, H * .5, W * 1.06);
  vg.addColorStop(0, 'rgba(120,90,50,0)');
  vg.addColorStop(1, 'rgba(120,90,50,.18)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
}
