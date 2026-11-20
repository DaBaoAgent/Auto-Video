import { clamp, lerp, seg, ss, eio, mulberry, TAU } from './lib.js';

// 拼贴剪贴：旧报纸打底，牛皮纸剪片压中景，白纸条最上层，红章最后砸下。
// 运动一律 12 fps 定格，位置带 ±2px 手抖。
const NEWS = '#e8dfc9';
const INK = '#1b1712';
const RED = '#c9382b';
const KRAFT = '#a97c4c';
const WHITEP = '#f6f1e2';
const PALE = '#e6dcc4';

const S = (t) => Math.floor(t * 12) / 12;          // 12 fps 台阶
const jit = (seed, amt) => (mulberry(seed)() - .5) * amt;

function torn(c, x, y, w, h, seed, amt = 3) {
  const r = mulberry(seed);
  c.beginPath();
  const step = 14;
  for (let px = 0; px <= w; px += step) c.lineTo(x + px, y + (r() - .5) * amt);
  for (let py = 0; py <= h; py += step) c.lineTo(x + w + (r() - .5) * amt, y + py);
  for (let px = w; px >= 0; px -= step) c.lineTo(x + px, y + h + (r() - .5) * amt);
  for (let py = h; py >= 0; py -= step) c.lineTo(x + (r() - .5) * amt, y + py);
  c.closePath();
}

function paper(c, x, y, w, h, o = {}) {
  const seed = o.seed ?? 11;
  const shadow = o.shadow ?? 14;
  const off = o.off ?? [8, 10];
  // 纸影
  c.save();
  c.globalAlpha = o.shAlpha ?? .20;
  c.fillStyle = INK;
  torn(c, x + off[0], y + off[1], w, h, seed + 1, o.jit ?? 3);
  c.fill();
  c.restore();
  if (o.cutBorder) {
    // 白剪边：比纸大一丁点，边不齐
    c.fillStyle = WHITEP;
    torn(c, x - o.cutBorder, y - o.cutBorder, w + o.cutBorder * 2, h + o.cutBorder * 2, seed + 2, (o.jit ?? 3) + 1.5);
    c.fill();
  }
  c.fillStyle = o.col ?? WHITEP;
  torn(c, x, y, w, h, seed, o.jit ?? 3);
  c.fill();
}

// 示意文字：一排排短横线，长短随机，不是真字
function textLines(c, x, y, w, rows, col, seed, gapY = 24, thick = 3.2) {
  const r = mulberry(seed);
  for (let i = 0; i < rows; i++) {
    const yy = y + i * gapY;
    const full = w * (.55 + r() * .45);
    c.fillStyle = col;
    c.globalAlpha = .55 + r() * .2;
    const n = 2 + Math.floor(r() * 2);
    let cx = x;
    for (let k = 0; k < n; k++) {
      const segw = (full / n) * (.7 + r() * .5);
      c.fillRect(cx, yy, segw, thick);
      cx += segw + gapY * .55;
    }
    c.globalAlpha = 1;
  }
}

function boy(c, x, y, s, col, seed) {
  // 一个剪下来的小男孩：头、身子、两条短腿、一只手伸出
  const r = mulberry(seed);
  c.save();
  c.translate(x, y);
  // 白剪边
  for (const pass of [0, 1]) {
    c.save();
    if (!pass) { c.fillStyle = WHITEP; c.translate(-3, -3); c.scale(1.05, 1.05); } else { c.fillStyle = col; }
    // 头
    c.beginPath(); c.ellipse(0, -196 * s, 42 * s, 46 * s, 0, 0, TAU); c.fill();
    // 脖子
    c.fillRect(-12 * s, -160 * s, 24 * s, 22 * s);
    // 身子（外套）
    c.beginPath();
    c.moveTo(-52 * s, -148 * s); c.lineTo(50 * s, -148 * s);
    c.lineTo(62 * s, -46 * s); c.lineTo(-60 * s, -46 * s); c.closePath(); c.fill();
    // 腿
    c.fillRect(-46 * s, -50 * s, 34 * s, 50 * s);
    c.fillRect(14 * s, -50 * s, 34 * s, 50 * s);
    // 伸出去的一条胳膊：就是要给人看的那只手
    c.beginPath();
    c.moveTo(44 * s, -140 * s); c.lineTo(52 * s, -132 * s);
    c.lineTo(150 * s + (r() - .5) * 6, -120 * s); c.lineTo(154 * s, -104 * s);
    c.lineTo(46 * s, -112 * s); c.closePath(); c.fill();
    c.restore();
  }
  c.restore();
}

export function init(W, H) {}

export function paint(c, t, W, H) {
  const K = W / 1080;
  const ts = S(t);

  // ---------- 旧报纸：铺开 ----------
  const open = ss(seg(t, 0, .9));
  c.fillStyle = '#5b4a34'; c.fillRect(0, 0, W, H);      // 桌面（暗木）
  const paperX = W * .04, paperY = H * .035;
  const pw = W * .92, ph = H * .93;
  c.save();
  c.translate(W / 2, H / 2);
  c.scale(lerp(.86, 1, open), lerp(.86, 1, open));
  c.translate(-W / 2, -H / 2);

  paper(c, paperX, paperY, pw, ph, { seed: 21, col: NEWS, shadow: 0, off: [0, 0], jit: 2.5 });

  // 报纹：半调网点 + 报栏线 + 报头
  const r = mulberry(31);
  c.save();
  c.globalAlpha = .07;
  c.fillStyle = INK;
  for (let y = paperY + 6; y < paperY + ph; y += 7) {
    for (let x = paperX + 6; x < paperX + pw; x += 7) {
      c.beginPath(); c.arc(x, y, 1.6, 0, TAU); c.fill();
    }
  }
  c.restore();
  // 报头
  c.fillStyle = INK; c.globalAlpha = .82;
  c.fillRect(paperX + pw * .07, paperY + ph * .045, pw * .46, 26 * K);
  c.globalAlpha = .30;
  c.fillRect(paperX + pw * .07, paperY + ph * .075, pw * .80, 2.2 * K);
  c.globalAlpha = 1;
  // 栏目文字块（三栏）
  for (let col = 0; col < 3; col++) {
    const cx = paperX + pw * (.07 + col * .30);
    textLines(c, cx, paperY + ph * .11, pw * .26, 26, '#5d5344', 40 + col, 26 * K, 2.6 * K);
  }
  // 中缝折痕
  c.save(); c.globalAlpha = .16; c.fillStyle = INK;
  c.fillRect(paperX + pw * .495, paperY + ph * .03, 2.4 * K, ph * .94);
  c.restore();
  c.restore();

  // ---------- 牛皮纸片：斜贴在报上 ----------
  const kIn = ss(seg(t, 0, .24));
  if (kIn > 0) {
    const kx = W * .11, ky = H * .215, kw = W * .78, kh = H * .410;
    c.save();
    c.translate(kx + kw / 2, ky + kh / 2);
    c.rotate(-.035 + jit(51, .012));
    c.globalAlpha = kIn;
    c.translate(0, lerp(70 * K, 0, eio(kIn)));
    paper(c, -kw / 2, -kh / 2, kw, kh, { seed: 52, col: KRAFT, off: [10 * K, 12 * K], jit: 3.4 });
    c.restore();
  }

  // ---------- 三张白纸条：一句一句拍上去 ----------
  const strips = [
    { t0: .30, y: .255, w: .62, x: .175, rot: -.028 },
    { t0: 1.10, y: .345, w: .70, x: .150, rot: .020 },
    { t0: 1.90, y: .445, w: .58, x: .215, rot: -.014 },
  ];
  strips.forEach((st, i) => {
    const a = ss(seg(t, st.t0, st.t0 + .34));
    if (a <= 0) return;
    const tsq = S(t - st.t0);
    const wob = (Math.sin((tsq * 12 + i) * 1.3) * 2.4 + jit(60 + i, 4)) * K;
    const sx = W * st.x, sy = H * st.y + lerp(-110 * K, 0, eio(a)) + wob;
    const sw = W * st.w, sh = H * .078;
    c.save();
    c.translate(sx + sw / 2, sy + sh / 2);
    c.rotate(st.rot + jit(70 + i, .01));
    c.globalAlpha = a;
    // 落地投影重一点，像拍在纸上
    c.scale(lerp(1.06, 1, a), lerp(1.06, 1, a));
    paper(c, -sw / 2, -sh / 2, sw, sh, { seed: 80 + i, col: WHITEP, off: [7 * K, 9 * K], shAlpha: .26, jit: 2.4 });
    // 条上的字
    textLines(c, -sw / 2 + 22 * K, -sh / 2 + 22 * K, sw - 44 * K, 2, INK, 90 + i, 30 * K, 3.4 * K);
    // 胶带角
    c.save();
    c.globalAlpha = .34; c.fillStyle = PALE;
    c.fillRect(-sw / 2 - 6 * K, -sh / 2 - 8 * K, 60 * K, 22 * K);
    c.restore();
    c.restore();
  });

  // ---------- 小男孩剪片：贴在左下方 ----------
  const bIn = ss(seg(t, 2.95, 3.55));
  if (bIn > 0) {
    const bx = lerp(W * .08, W * .17, eio(bIn));
    const by = H * .925;
    c.save();
    c.globalAlpha = bIn;
    // 影子
    c.save(); c.globalAlpha = .22 * bIn; c.fillStyle = INK;
    c.beginPath(); c.ellipse(bx + 30 * K, by + 8 * K, 140 * K, 16 * K, 0, 0, TAU); c.fill();
    c.restore();
    boy(c, bx, by, .92 * K, KRAFT, 101);
    c.restore();
  }

  // ---------- 剪出来的水壶：纸条边上贴着的一件旧货 ----------
  const ktIn = ss(seg(t, 3.85, 4.45));
  if (ktIn > 0) {
    const kx2 = W * .685, ky2 = H * .800 + lerp(60 * K, 0, eio(ktIn));
    const s2 = 1.30 * K;
    c.save();
    c.globalAlpha = ktIn;
    c.save(); c.globalAlpha = .20 * ktIn; c.fillStyle = INK;
    c.beginPath(); c.ellipse(kx2 + 18 * K, ky2 + 96 * s2, 96 * s2, 12 * s2, 0, 0, TAU); c.fill();
    c.restore();
    c.translate(kx2, ky2);
    c.rotate(-.05);
    for (const pass of [0, 1]) {
      c.save();
      if (!pass) { c.fillStyle = WHITEP; c.translate(-3 * K, -3 * K); c.scale(1.06, 1.06); }
      else c.fillStyle = KRAFT;
      // 壶身
      c.beginPath();
      c.moveTo(-44 * s2, -20 * s2); c.lineTo(44 * s2, -20 * s2);
      c.lineTo(54 * s2, 62 * s2); c.lineTo(-52 * s2, 62 * s2); c.closePath(); c.fill();
      // 壶盖
      c.fillRect(-26 * s2, -34 * s2, 52 * s2, 16 * s2);
      c.beginPath(); c.ellipse(0, -34 * s2, 30 * s2, 10 * s2, 0, Math.PI, TAU); c.fill();
      // 提手
      c.beginPath();
      c.moveTo(-44 * s2, -14 * s2); c.quadraticCurveTo(-92 * s2, 16 * s2, -46 * s2, 40 * s2);
      c.lineWidth = 13 * s2; c.strokeStyle = pass ? KRAFT : WHITEP; c.stroke();
      // 壶嘴
      c.beginPath();
      c.moveTo(44 * s2, -2 * s2); c.lineTo(96 * s2, -18 * s2);
      c.lineTo(100 * s2, -4 * s2); c.lineTo(50 * s2, 14 * s2); c.closePath(); c.fill();
      c.restore();
    }
    // 壶身上的缺口（剪坏了的一处）
    c.save(); c.globalAlpha = .9; c.fillStyle = 'rgba(232,223,201,.95)';
    c.beginPath(); c.ellipse(-8 * s2, 24 * s2, 12 * s2, 8 * s2, .3, 0, TAU); c.fill();
    c.restore();
    c.restore();
  }

  // ---------- 撕下来的一角报纸：压在牛皮纸的边上 ----------
  const spIn = ss(seg(t, 4.25, 4.8));
  if (spIn > 0) {
    const sx2 = W * .055, sy2 = H * .600 + lerp(-40 * K, 0, eio(spIn));
    const sw2 = W * .40, sh2 = H * .115;
    c.save();
    c.translate(sx2 + sw2 / 2, sy2 + sh2 / 2);
    c.rotate(-.075 + jit(120, .012));
    c.globalAlpha = spIn;
    c.save(); c.globalAlpha = .22 * spIn; c.fillStyle = INK;
    torn(c, -sw2 / 2 + 8 * K, -sh2 / 2 + 9 * K, sw2, sh2, 121, 3); c.fill();
    c.restore();
    c.fillStyle = NEWS;
    torn(c, -sw2 / 2, -sh2 / 2, sw2, sh2, 122, 2.6); c.fill();
    // 半调网点
    c.save(); c.globalAlpha = .10; c.fillStyle = INK;
    for (let y = -sh2 / 2 + 5; y < sh2 / 2; y += 6) {
      for (let x = -sw2 / 2 + 5; x < sw2 / 2; x += 6) {
        c.beginPath(); c.arc(x, y, 1.5, 0, TAU); c.fill();
      }
    }
    c.restore();
    textLines(c, -sw2 / 2 + 14 * K, -sh2 / 2 + 18 * K, sw2 - 28 * K, 3, '#4d4436', 124, 24 * K, 2.4 * K);
    c.restore();
  }

  // ---------- 红章：砸下来 ----------
  const hit = 5.35;
  if (t > hit - .34) {
    const fall = ss(seg(t, hit - .34, hit));
    const cx = W * .545, cy = H * .380;
    const sc = lerp(1.55, 1, eio(fall));
    const shk = t > hit ? Math.max(0, 1 - (t - hit) / .18) : 0;
    c.save();
    c.translate(cx + Math.sin((t) * 120) * 4 * shk * K, cy + Math.cos(t * 90) * 3 * shk * K);
    c.scale(sc, sc);
    c.rotate(-.06);
    c.globalAlpha = .90 * ss(seg(t, hit - .20, hit));
    const R = W * .148;
    c.fillStyle = RED;
    // 章体：双圈，边不整
    for (let ring = 0; ring < 2; ring++) {
      const rr = R * (ring ? .74 : 1);
      c.beginPath();
      for (let a = 0; a < 40; a++) {
        const ang = a / 40 * TAU;
        const rad = rr + jit(300 + a, 5 * K);
        a ? c.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad) : c.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      c.closePath();
      c.lineWidth = (ring ? 5 : 9) * K;
      c.strokeStyle = RED; c.stroke();
    }
    // 章面：粗横杠，像盖出来的两个字，不给真字
    c.fillStyle = RED;
    c.fillRect(-R * .50, -R * .30, R * .40, R * .26);
    c.fillRect(-R * .06, -R * .34, R * .12, R * .68);
    c.fillRect(R * .12, -R * .30, R * .38, R * .26);
    // 缺墨的空白点
    const rr2 = mulberry(311);
    for (let i = 0; i < 40; i++) {
      const ang = rr2() * TAU, rad = rr2() * R * .92;
      c.beginPath(); c.arc(Math.cos(ang) * rad, Math.sin(ang) * rad, (2 + rr2() * 6) * K, 0, TAU);
      c.fillStyle = 'rgba(246,241,226,.9)'; c.fill();
    }
    c.restore();

    // 砸下的墨点
    if (t > hit && t < hit + .5) {
      const k = (t - hit) / .5;
      const rr3 = mulberry(321);
      c.save(); c.globalAlpha = .8 * (1 - k);
      for (let i = 0; i < 12; i++) {
        const a = rr3() * TAU, dist = (R * .9 + k * 120 * K) * (.6 + rr3() * .8);
        c.beginPath();
        c.arc(cx + Math.cos(a) * dist, cy + Math.sin(a) * dist, (1.8 + rr3() * 4) * K * (1 - k * .5), 0, TAU);
        c.fillStyle = RED; c.fill();
      }
      c.restore();
    }
  }

  // ---------- 整体：纸纹与桌面暗角 ----------
  const rr4 = mulberry(909);
  c.save(); c.globalAlpha = .05;
  for (let i = 0; i < 700; i++) {
    const x = rr4() * W, y = rr4() * H;
    c.strokeStyle = INK; c.lineWidth = .9;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rr4() - .5) * 14, y + (rr4() - .5) * 5); c.stroke();
  }
  c.restore();
  const vg = c.createRadialGradient(W * .5, H * .42, W * .34, W * .5, H * .5, W * 1.06);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(20,12,4,.55)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
}