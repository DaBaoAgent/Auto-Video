// ink.js · 水墨画面工具：宣纸、墨粒、印章、竖排、墨渗转场、毛笔遮罩。
// 全部是 t 的纯函数；随机数一律走种子哈希，同一帧永远同一像素。

export const W = 1920, H = 1080, FPS = 30;

/* ---------------------------------------------------------------- 数学 */
export function clamp(x, a = 0, b = 1) { return x < a ? a : x > b ? b : x; }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function inv(a, b, x) { return clamp((x - a) / (b - a)); }
export function sstep(a, b, x) { const t = inv(a, b, x); return t * t * (3 - 2 * t); }
export const E = {
  lin: t => t,
  in2: t => t * t,
  out2: t => 1 - (1 - t) * (1 - t),
  in3: t => t * t * t,
  out3: t => 1 - Math.pow(1 - t, 3),
  out4: t => 1 - Math.pow(1 - t, 4),
  io2: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  io3: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outBack: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  outElastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -9 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3.2)) + 1),
};
// 关键帧：[[t, v, ease?], ...]，缓动作用于以该帧结尾的段
export function K(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const u = (t - t0) / Math.max(1e-9, t1 - t0);
      const f = typeof e === 'function' ? e : E[e || 'io2'];
      return v0 + (v1 - v0) * f(u);
    }
  }
  return keys[keys.length - 1][1];
}
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(...a) {
  let h = 2166136261 >>> 0;
  for (const v of a) {
    h = Math.imul(h ^ ((Math.round(v * 997) | 0) >>> 0), 16777619) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}

/* ---------------------------------------------------------------- 画布池 */
const pool = new Map();
export function scratch(key, w = W, h = H) {
  const k = key + ':' + w + 'x' + h;
  let c = pool.get(k);
  if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; pool.set(k, c); }
  const x = c.getContext('2d');
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, w, h);
  return x;
}

/* ---------------------------------------------------------------- 宣纸 */
export function makePaper(w = W, h = H, seed = 7) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  const g = x.createLinearGradient(0, 0, w * 0.35, h);
  g.addColorStop(0, '#f3eddf'); g.addColorStop(0.45, '#efe7d6'); g.addColorStop(1, '#e7dcc6');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  const R = mulberry32(seed);
  // 大块水渍
  for (let i = 0; i < 9; i++) {
    const cx = R() * w, cy = R() * h, r = 160 + R() * 420;
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, `rgba(150,125,88,${0.012 + R() * 0.018})`);
    rg.addColorStop(1, 'rgba(150,125,88,0)');
    x.fillStyle = rg; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  // 纸纤维
  for (let i = 0; i < 2400; i++) {
    const px = R() * w, py = R() * h;
    const len = 6 + R() * 54;
    const ang = (R() - 0.5) * 0.5;
    const light = R() < 0.45;
    x.strokeStyle = light ? `rgba(255,250,236,${0.04 + R() * 0.06})` : `rgba(126,104,72,${0.018 + R() * 0.035})`;
    x.lineWidth = 0.5 + R() * 1.1;
    x.beginPath(); x.moveTo(px, py);
    x.lineTo(px + Math.cos(ang) * len, py + Math.sin(ang) * len * 0.35);
    x.stroke();
  }
  // 纸屑
  for (let i = 0; i < 700; i++) {
    x.fillStyle = `rgba(110,90,62,${0.02 + R() * 0.05})`;
    x.beginPath(); x.arc(R() * w, R() * h, 0.5 + R() * 1.7, 0, 7); x.fill();
  }
  // 暗角
  const vg = x.createRadialGradient(w * 0.5, h * 0.46, h * 0.25, w * 0.5, h * 0.5, h * 0.86);
  vg.addColorStop(0, 'rgba(70,52,32,0)');
  vg.addColorStop(1, 'rgba(70,52,32,0.16)');
  x.fillStyle = vg; x.fillRect(0, 0, w, h);
  return cv;
}

// 墨粒/纸齿：叠在画面最上层，让一切像印在纸上
export function makeGrain(w = W, h = H, seed = 19) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  const img = x.createImageData(w, h);
  const d = img.data;
  let a = seed >>> 0;
  for (let i = 0; i < d.length; i += 4) {
    a = (a * 1664525 + 1013904223) >>> 0;
    const r1 = (a >>> 8) & 255;
    a = (a * 1664525 + 1013904223) >>> 0;
    const r2 = (a >>> 8) & 255;
    const v = 150 + (r1 / 255) * 105;
    d[i] = v; d[i + 1] = v * 0.995; d[i + 2] = v * 0.975;
    d[i + 3] = 10 + (r2 / 255) * 16;
  }
  x.putImageData(img, 0, 0);
  return cv;
}

/* ---------------------------------------------------------------- 印章 */
export function sealSprite(text, size, seed = 3, opts = {}) {
  const pad = Math.round(size * 0.16);
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const x = cv.getContext('2d');
  const red = opts.color || '#a63428';
  // 印面（手工不齐边）
  const R = mulberry32(seed);
  x.beginPath();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // 沿方形描一圈，边线抖动
    let px, py;
    const k = Math.floor(t * 4), u = t * 4 - k;
    const j0 = () => (R() - 0.5) * size * 0.018;
    if (k === 0) { px = pad + u * (size - 2 * pad); py = pad + j0(); }
    else if (k === 1) { px = size - pad + j0(); py = pad + u * (size - 2 * pad); }
    else if (k === 2) { px = size - pad - u * (size - 2 * pad); py = size - pad + j0(); }
    else { px = pad + j0(); py = size - pad - u * (size - 2 * pad); }
    if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
  }
  x.closePath();
  x.fillStyle = red; x.fill();
  // 内框
  x.strokeStyle = 'rgba(250,244,230,0.85)';
  x.lineWidth = Math.max(1.4, size * 0.022);
  const ip = pad + size * 0.075;
  x.strokeRect(ip, ip, size - 2 * ip, size - 2 * ip);
  // 印文
  const chars = [...text].slice(0, 4);
  const vertical = opts.vertical ?? chars.length !== 4;
  const fs = size * (vertical ? (chars.length <= 2 ? 0.34 : 0.205) : 0.23);
  x.fillStyle = 'rgba(252,246,232,0.94)';
  x.font = `${fs}px LongCang, KaiTi, serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (vertical) {
    const gap = size * (chars.length <= 2 ? 0.30 : 0.165);
    chars.forEach((ch, i) => {
      const yy = size / 2 + (i - (chars.length - 1) / 2) * gap;
      x.fillText(ch, size / 2, yy);
    });
  } else {
    const gap = size * 0.235;
    chars.forEach((ch, i) => {
      x.fillText(ch, size / 2 + (i - 1.5) * gap, size / 2 + fs * 0.02);
    });
  }
  // 侵蚀：用纸色擦掉小点
  x.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 70; i++) {
    x.fillStyle = `rgba(0,0,0,${0.15 + R() * 0.55})`;
    x.beginPath();
    x.arc(R() * size, R() * size, 0.5 + R() * (size * 0.012), 0, 7);
    x.fill();
  }
  x.globalCompositeOperation = 'source-over';
  return cv;
}
export function drawSeal(ctx, sprite, x, y, size, rot = 0, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(120,30,20,0.25)'; ctx.shadowBlur = 6;
  ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
  ctx.restore();
}

/* ---------------------------------------------------------------- 文字 */
export function vtext(ctx, text, x, y, o = {}) {
  const size = o.size || 40, font = o.font || 'LongCang', gap = o.gap || size * 1.18;
  ctx.save();
  ctx.font = `${size}px ${font}, KaiTi, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color || 'rgba(28,22,18,0.86)';
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lineWidth || 1.2; }
  [...text].forEach((ch, i) => {
    const yy = y + i * gap;
    if (o.stroke) ctx.strokeText(ch, x, yy);
    ctx.fillText(ch, x, yy);
  });
  ctx.restore();
}
export function htext(ctx, text, x, y, o = {}) {
  const size = o.size || 40, font = o.font || 'KaiTi', track = o.track ?? 2;
  ctx.save();
  ctx.font = `${size}px ${font}, serif`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = o.color || 'rgba(28,22,18,0.88)';
  ctx.globalAlpha = o.alpha ?? 1;
  const chars = [...text];
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width + track;
  let px = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  for (const ch of chars) {
    ctx.fillText(ch, px, y);
    px += ctx.measureText(ch).width + track;
  }
  ctx.restore();
  return w;
}

/* ---------------------------------------------------------------- 墨渗遮罩 */
// p: 0..1 生长；返回全尺寸遮罩画布（白色不透明=显示）
export function inkMask(w, h, p, cx, cy, seed = 1, spread = 1) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  const R = mulberry32(seed);
  const pcl = clamp(p);
  if (pcl <= 0.001) return cv;
  const Rmax = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.18 * spread;
  const r = Rmax * Math.pow(pcl, 0.66);
  x.fillStyle = '#fff';
  x.filter = 'blur(9px)';
  // 主团：中心 + 一圈不规则大滴
  x.beginPath(); x.arc(cx, cy, r * 0.52, 0, 7); x.fill();
  const nB = 26;
  for (let i = 0; i < nB; i++) {
    const a = (i / nB) * Math.PI * 2 + R() * 0.3;
    const rr = r * (0.34 + R() * 0.78);
    const bx = cx + Math.cos(a) * rr * 0.92, by = cy + Math.sin(a) * rr * 0.92;
    const br = r * (0.14 + R() * 0.26);
    x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill();
  }
  // 外沿墨须
  const nT = 30;
  for (let i = 0; i < nT; i++) {
    const a = (i / nT) * Math.PI * 2 + R() * 0.25;
    const rr = r * (0.8 + R() * 0.5);
    const bx = cx + Math.cos(a) * rr, by = cy + Math.sin(a) * rr * 0.82;
    const rad = r * (0.035 + R() * 0.085);
    x.beginPath(); x.arc(bx, by, rad, 0, 7); x.fill();
    if (R() < 0.5) {
      x.lineWidth = rad * (0.5 + R());
      x.strokeStyle = '#fff';
      x.beginPath(); x.moveTo(cx, cy);
      x.quadraticCurveTo(cx + Math.cos(a + 0.2) * rr * 0.6, cy + Math.sin(a + 0.2) * rr * 0.6, bx, by);
      x.stroke();
    }
  }
  if (pcl > 0.985) { x.setTransform(1, 0, 0, 1, 0, 0); x.fillRect(0, 0, w, h); }
  return cv;
}

// 毛笔横扫遮罩：p 0..1 从左到右扫过
export function swipeMask(w, h, p, seed = 2, yc = h * 0.5, thick = h * 0.55) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  const R = mulberry32(seed);
  if (p <= 0.001) return cv;
  const xe = (clamp(p) * 1.25 - 0.12) * w;
  x.filter = 'blur(10px)';
  x.fillStyle = '#fff';
  const n = 90;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const px = lerp(-w * 0.1, xe, u);
    const taper = Math.pow(Math.sin(Math.PI * clamp(u * 1.02)), 0.35);
    const th = thick * taper * (0.7 + R() * 0.5);
    const yy = yc + Math.sin(u * 7 + seed) * h * 0.035 + (R() - 0.5) * h * 0.05;
    x.beginPath(); x.arc(px, yy, th * 0.5, 0, 7); x.fill();
  }
  return cv;
}

// 把 drawFn 画进临时层，用遮罩裁切，再合成到 ctx
export function drawMasked(ctx, mask, drawFn, alpha = 1, w = W, h = H, key = 'masked') {
  const t = scratch(key, w, h);
  drawFn(t);
  t.globalCompositeOperation = 'destination-in';
  t.drawImage(mask, 0, 0, w, h);
  t.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(t.canvas, 0, 0, w, h);
  ctx.restore();
}

/* ---------------------------------------------------------------- 墨点 */
export function splatter(ctx, x, y, n, seed = 1, color = 'rgba(24,18,14,0.8)', spread = 60) {
  const R = mulberry32(seed);
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, rr = Math.pow(R(), 0.6) * spread;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.8;
    const s = 0.6 + Math.pow(R(), 2.2) * (4 + spread * 0.05);
    ctx.beginPath(); ctx.ellipse(px, py, s * (0.6 + R() * 0.7), s, R() * 3, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// 一条有飞白的墨线
export function inkLine(ctx, pts, o = {}) {
  const w0 = o.w || 4, color = o.color || 'rgba(24,18,14,0.85)';
  ctx.save();
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const R = mulberry32(o.seed || 1);
  for (let pass = 0; pass < (o.pass ?? 3); pass++) {
    ctx.globalAlpha = (o.alpha ?? 0.5) * (1 - pass * 0.22);
    ctx.lineWidth = w0 * (1 - pass * 0.26) * (0.8 + R() * 0.4);
    ctx.beginPath();
    ctx.moveTo(pts[0][0] + (R() - 0.5) * 2, pts[0][1] + (R() - 0.5) * 2);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] + (R() - 0.5) * 2.6, pts[i][1] + (R() - 0.5) * 2.6);
    ctx.stroke();
  }
  ctx.restore();
}

// 纸张转场边（画卷展开 / 卷起）
export function scrollEdge(ctx, y, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, y - 26, 0, y + 10);
  g.addColorStop(0, 'rgba(246,240,226,0)');
  g.addColorStop(0.55, 'rgba(246,240,226,0.95)');
  g.addColorStop(1, 'rgba(90,68,44,0.22)');
  ctx.fillStyle = g; ctx.fillRect(0, y - 26, W, 36);
  ctx.strokeStyle = 'rgba(60,44,28,0.22)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(0, y + 8); ctx.lineTo(W, y + 8 + Math.sin(y * 0.02) * 2); ctx.stroke();
  ctx.restore();
}
