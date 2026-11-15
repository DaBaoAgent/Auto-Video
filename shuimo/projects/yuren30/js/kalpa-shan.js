// kalpa-shan · 12KB 级无依赖生成式 SVG 山水（水墨管线视觉底座）
// 纯函数：同一 seed + 同一配置 → 同一段 SVG 字符串。无外部依赖、无 Math.random。
// 语法：远/中/近三层山脊（fbm 脊线）、飞白肌理、点叶松、雾带、水纹、日轮、冰原裂线。
// 灵感来源：LingDong-/shan-shui-inf（MIT）的程序化山水语法；本文件为独立实现。

/* ---------------------------------------------------------------- 噪声 */
export function h2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function vn(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, s, oct = 4) {
  let sum = 0, amp = 0.5, f = 1, tot = 0;
  for (let i = 0; i < oct; i++) { sum += amp * vn(x * f, y * f, s + i * 17); tot += amp; amp *= 0.5; f *= 2.03; }
  return sum / tot;
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------------------------------------------------------- 脊线 */
function ridgeY(x, c, seed) {
  const u = x / c.w;
  const n1 = fbm(u * c.freq + 3.1, c.seed * 0.13, seed, 4);
  const n2 = fbm(u * c.freq * 2.7, 5.7 + c.seed * 0.07, seed + 31, 3);
  const r = 1 - Math.abs(2 * n1 - 1);            // 脊状噪声：尖峰
  const base = c.base * c.h, amp = c.amp * c.h;
  const y = base - amp * (0.70 * r + 0.30 * n2);
  return c.clipY ? Math.max(y, c.clipY) : y;
}
const pt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;

/* ---------------------------------------------------------------- 山体 */
function mountain(c, idx, seed) {
  const id = `m${idx}`;
  const step = 9;
  const xe = c.xmax ? c.xmax * c.w : c.w;
  const pts = [];
  for (let x = -20; x <= xe + 20; x += step) pts.push([x, ridgeY(Math.min(x, xe), c, seed)]);
  const line = 'M' + pts.map(p => pt(p[0], p[1])).join('L');
  const shore = c.xmax
    ? `Q${(xe + 180).toFixed(0)},${(c.h * 0.74).toFixed(0)} ${(xe + 500).toFixed(0)},${c.h + 20}`
    : `L${c.w + 20},${c.h + 20}`;
  const body = `${line}${shore}L-20,${c.h + 20}Z`;
  const ink = c.ink;
  const grad = `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1c1613" stop-opacity="${Math.min(0.72, ink * 0.58).toFixed(3)}"/>
    <stop offset="0.34" stop-color="#1c1613" stop-opacity="${Math.min(0.88, ink * 0.98).toFixed(3)}"/>
    <stop offset="1" stop-color="#15100d" stop-opacity="${Math.min(0.96, ink * 1.22).toFixed(3)}"/></linearGradient>
  <clipPath id="${id}c"><path d="${body}"/></clipPath>`;
  // 山脊主笔：粗细不匀的浓墨线
  const rim = `<path d="${line}" fill="none" stroke="#1c1613" stroke-opacity="${Math.min(0.88, ink * 2.4).toFixed(3)}"
    stroke-width="${(2.6 + ink * 6).toFixed(1)}" stroke-linecap="round" filter="url(#soft1)"/>`;
  // 飞白肌理：沿山坡的短擦笔
  const R = rng(seed + idx * 977);
  let tex = '';
  const strokes = Math.round(70 + 95 * ink);
  for (let i = 0; i < strokes; i++) {
    const nearRidge = R() < 0.68;
    const x = R() * c.w;
    const ry = ridgeY(x, c, seed);
    const y = nearRidge ? ry + 6 + R() * 48 : ry + 18 + R() * (c.h - ry - 30);
    const slope = (ridgeY(x + 6, c, seed) - ridgeY(x - 6, c, seed)) / 12;
    const ang = nearRidge ? Math.atan(slope) + (R() - 0.5) * 0.38 : -0.42 + (R() - 0.5) * 0.9;
    const len = nearRidge ? 24 + R() * (70 + 70 * ink) : 16 + R() * (60 + 90 * ink);
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len * (nearRidge ? 0.85 : 0.42);
    const w = 0.8 + R() * (1.5 + 2.8 * ink);
    const o = (nearRidge ? 0.09 + R() * 0.17 : 0.04 + R() * 0.12) * (0.6 + ink * 1.2);
    tex += `<path d="M${pt(x, y)}Q${pt((x + x2) / 2 + (R() - 0.5) * 10, (y + y2) / 2 - 5 + R() * 10)} ${pt(x2, y2)}"
      fill="none" stroke="#1c1613" stroke-opacity="${o.toFixed(3)}" stroke-width="${w.toFixed(2)}" stroke-linecap="round"/>`;
  }
  // 皴簇：山脊下的三笔一组
  const clusters = Math.round(10 + 20 * ink);
  for (let k = 0; k < clusters; k++) {
    const x = R() * c.w;
    const ry = ridgeY(x, c, seed);
    const slope = (ridgeY(x + 6, c, seed) - ridgeY(x - 6, c, seed)) / 12;
    const baseAng = Math.atan(slope) + 0.38;
    for (let j = 0; j < 3; j++) {
      const y = ry + 10 + j * 7 + R() * 10;
      const len = 26 + R() * (60 + 60 * ink);
      const ang = baseAng + (R() - 0.5) * 0.22;
      tex += `<path d="M${pt(x + j * 3, y)}q${pt(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5)} ${pt(x + Math.cos(ang) * len, y + Math.sin(ang) * len)}"
        fill="none" stroke="#1c1613" stroke-opacity="${(0.06 + R() * 0.10).toFixed(3)}" stroke-width="${(1 + R() * 1.8).toFixed(2)}" stroke-linecap="round"/>`;
    }
  }
  // 山脚雾：淡出
  const foot = `<rect x="0" y="${(c.base * c.h).toFixed(0)}" width="${c.w}" height="${(c.h * 0.16).toFixed(0)}"
    fill="url(#mistFade)" opacity="0.16"/>`;
  return `<g><defs>${grad}</defs><path d="${body}" fill="url(#${id}g)"/>
    <path d="${body}" fill="none" stroke="#1c1613" stroke-opacity="${(ink * 0.20).toFixed(3)}" stroke-width="10" filter="url(#soft2)"/>
    <g clip-path="url(#${id}c)">${tex}${foot}
      <rect x="0" y="${(c.h * 0.62).toFixed(0)}" width="${c.w}" height="${(c.h * 0.46).toFixed(0)}" fill="url(#baseInk)" opacity="${Math.min(0.92, 0.35 + ink).toFixed(2)}"/>
    </g>${rim}</g>`;
}

/* ---------------------------------------------------------------- 点叶树 */
function trees(c, seed, n, s0) {
  const R = rng(seed * 131 + 7);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = (0.04 + R() * 0.92) * c.w;
    const y = ridgeY(x, c, seed) + 4 + R() * 10;
    const s = s0 * (0.65 + R() * 0.8);
    const lean = (R() - 0.5) * 0.5;
    out += `<g opacity="${(0.5 + R() * 0.4).toFixed(2)}">
      <path d="M${pt(x, y)}q${(lean * s).toFixed(1)},${(-s * 0.6).toFixed(1)} ${(lean * s * 1.8).toFixed(1)},${(-s * 1.15).toFixed(1)}"
        fill="none" stroke="#1c1613" stroke-width="${(1.1 + s * 0.035).toFixed(2)}" stroke-linecap="round"/>`;
    const k = 4 + Math.floor(R() * 4);
    for (let j = 0; j < k; j++) {
      const bx = x + lean * s * 1.6 + (R() - 0.5) * s * 1.15;
      const by = y - s * (0.75 + R() * 0.6);
      const r = s * (0.11 + R() * 0.15);
      out += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${r.toFixed(1)}" ry="${(r * 0.78).toFixed(1)}"
        fill="#1c1613" fill-opacity="${(0.42 + R() * 0.42).toFixed(2)}"/>`;
    }
    out += `</g>`;
  }
  return out;
}

/* ---------------------------------------------------------------- 雾 / 云 / 日 */
function mistBand(y, h, alpha, blur, width) {
  return `<rect x="-40" y="${y}" width="${width + 80}" height="${h}" fill="#f7f1e4" opacity="${(alpha * 0.55).toFixed(3)}"
    filter="url(#blur${blur})" style="mix-blend-mode:screen"/>`;
}
function clouds(seed, w, y) {
  const R = rng(seed + 311);
  let out = '';
  for (let i = 0; i < 5; i++) {
    const cx = R() * w, cy = y + R() * 90;
    const rx = 120 + R() * 260, ry = 10 + R() * 22;
    out += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}"
      fill="#fffaf0" opacity="${(0.10 + R() * 0.12).toFixed(2)}" filter="url(#blur24)"/>`;
  }
  return out;
}
function sun(x, y, r, color = '#b4614c', alpha = 0.5) {
  return `<g><circle cx="${x}" cy="${y}" r="${r * 2.6}" fill="url(#sunGlow)" opacity="${alpha * 0.5}"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${alpha}"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color}" stroke-opacity="${alpha * 0.7}" stroke-width="2"/></g>`;
}

/* ---------------------------------------------------------------- 冰原 */
function iceSheet(c, seed) {
  const R = rng(seed + 733);
  let out = '';
  // 冰面：几块大的冷白多边形
  for (let k = 0; k < 5; k++) {
    const y0 = c.h * (0.60 + k * 0.075);
    let d = `M-30,${(y0 + 40).toFixed(0)}`;
    for (let x = -30; x <= c.w + 30; x += 70) {
      d += `L${x},${(y0 + (R() - 0.5) * 26).toFixed(0)}`;
    }
    d += `L${c.w + 30},${c.h + 30}L-30,${c.h + 30}Z`;
    out += `<path d="${d}" fill="#f7faf6" fill-opacity="${(0.52 + k * 0.10).toFixed(2)}" stroke="#5c747b" stroke-opacity="0.18" stroke-width="2.4"/>`;
  }
  // 冰裂缝
  for (let i = 0; i < 30; i++) {
    let x = R() * c.w, y = c.h * (0.62 + R() * 0.34);
    let d = `M${x.toFixed(0)},${y.toFixed(0)}`;
    const n = 2 + Math.floor(R() * 5);
    for (let j = 0; j < n; j++) {
      x += (R() - 0.5) * 120; y += 8 + R() * 34;
      d += `L${x.toFixed(0)},${y.toFixed(0)}`;
    }
    out += `<path d="${d}" fill="none" stroke="#2e444c" stroke-opacity="${(0.18 + R() * 0.24).toFixed(2)}"
      stroke-width="${(1.4 + R() * 2.6).toFixed(1)}" stroke-linecap="round"/>`;
  }
  return out;
}

/* ---------------------------------------------------------------- 场景 */
const PRESETS = {
  site: (w, h, seed) => {
    const S = 1;
    return {
      w, h, seed, bg: ['#f3ecdd', '#e7dbc4'],
      sun: { x: w * 0.76, y: h * 0.26, r: 92 * S, color: '#b4614c', alpha: 0.42 },
      ridges: [
        { base: 0.52, amp: 0.135, freq: 2.1, ink: 0.10, seed: 3, w, h, trees: 0 },
        { base: 0.63, amp: 0.175, freq: 2.9, ink: 0.20, seed: 7, w, h, trees: 22, treeSize: 26 },
        { base: 0.82, amp: 0.145, freq: 3.7, ink: 0.52, seed: 13, w, h, trees: 18, treeSize: 42 },
        { base: 1.06, amp: 0.070, freq: 5.0, ink: 0.66, seed: 21, w, h, trees: 0 },
      ],
      mist: [[0.56, 0.075, 0.75], [0.68, 0.06, 0.65]],
      clouds: true, water: null,
    };
  },
  objects: (w, h, seed) => ({
    w, h, seed, bg: ['#f4eee0', '#eae0cc'],
    sun: null,
    ridges: [
      { base: 0.18, amp: 0.06, freq: 1.7, ink: 0.022, seed: 5, w, h },
    ],
    mist: [[0.12, 0.16, 0.55]], clouds: false, water: null,
  }),
  coast: (w, h, seed) => ({
    w, h, seed, bg: ['#f2ebdc', '#e6d9c0'],
    sun: { x: w * 0.16, y: h * 0.22, r: 74, color: '#b4614c', alpha: 0.30 },
    ridges: [
      { base: 0.50, amp: 0.06, freq: 2.0, ink: 0.045, seed: 31, w, h, xmax: 0.45 },
      { base: 0.62, amp: 0.13, freq: 3.2, ink: 0.20, seed: 37, w, h, xmax: 0.40, trees: 18, treeSize: 22 },
      { base: 0.70, amp: 0.10, freq: 4.6, ink: 0.30, seed: 41, w, h, xmax: 0.33, trees: 12, treeSize: 28 },
    ],
    mist: [[0.54, 0.08, 0.85], [0.66, 0.05, 0.6]],
    clouds: true,
    water: null,
  }),
  ice: (w, h, seed) => ({
    w, h, seed, bg: ['#eef2ee', '#dbe5e2'],
    sun: { x: w * 0.72, y: h * 0.19, r: 68, color: '#9fb9b8', alpha: 0.30 },
    ridges: [
      { base: 0.48, amp: 0.13, freq: 2.2, ink: 0.16, seed: 51, w, h, cold: true },
      { base: 0.60, amp: 0.16, freq: 3.2, ink: 0.24, seed: 57, w, h, cold: true },
    ],
    mist: [[0.50, 0.09, 0.9]],
    clouds: true, water: null, ice: true,
  }),
  cut: (w, h, seed) => ({
    w, h, seed, bg: ['#f3ecdd', '#e5d8c0'],
    sun: { x: w * 0.16, y: h * 0.24, r: 78, color: '#b4614c', alpha: 0.32 },
    ridges: [
      { base: 0.50, amp: 0.10, freq: 2.0, ink: 0.07, seed: 61, w, h },
      { base: 0.66, amp: 0.16, freq: 2.7, ink: 0.16, seed: 67, w, h, trees: 10, treeSize: 18 },
      { base: 0.78, amp: 0.32, freq: 1.9, ink: 0.58, seed: 71, w, h, trees: 22, treeSize: 40 },
      { base: 1.12, amp: 0.10, freq: 4.8, ink: 0.62, seed: 79, w, h },
    ],
    mist: [[0.54, 0.07, 0.8], [0.72, 0.05, 0.55]],
    clouds: true, water: null,
  }),
  pit: (w, h, seed) => ({
    w, h, seed, bg: ['#f3ecdd', '#e7dcc7'],
    sun: { x: w * 0.82, y: h * 0.22, r: 70, color: '#b4614c', alpha: 0.26 },
    ridges: [
      { base: 0.44, amp: 0.10, freq: 2.4, ink: 0.055, seed: 81, w, h },
      { base: 0.57, amp: 0.08, freq: 3.4, ink: 0.12, seed: 87, w, h, trees: 8, treeSize: 16 },
    ],
    mist: [[0.50, 0.09, 0.8]],
    clouds: true, water: null,
  }),
};

export function buildSVG(kind, w, h, seed, opts = {}) {
  const c = PRESETS[kind](w, h, seed);
  if (opts.cutY) for (const r of c.ridges) r.clipY = opts.cutY * h;
  let defs = `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.bg[0]}"/><stop offset="1" stop-color="${c.bg[1]}"/></linearGradient>
    <linearGradient id="mistFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3ecdd" stop-opacity="0.55"/><stop offset="1" stop-color="#f3ecdd" stop-opacity="0"/></linearGradient>
    <linearGradient id="baseInk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#15100d" stop-opacity="0"/><stop offset="0.55" stop-color="#15100d" stop-opacity="0.12"/><stop offset="1" stop-color="#15100d" stop-opacity="0.28"/></linearGradient>
    <radialGradient id="sunGlow"><stop offset="0" stop-color="#c07a62" stop-opacity="0.55"/><stop offset="1" stop-color="#c07a62" stop-opacity="0"/></radialGradient>
    <filter id="soft1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>
    <filter id="soft2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    <filter id="blur14"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="blur24"><feGaussianBlur stdDeviation="24"/></filter>
    <filter id="blur40"><feGaussianBlur stdDeviation="40"/></filter>
    <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="${seed % 90}"/>
      <feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  let body = `<rect width="${w}" height="${h}" fill="url(#bg)"/>`;
  if (c.clouds) body += clouds(seed, w, h * 0.08);
  if (c.sun) body += sun(c.sun.x, c.sun.y, c.sun.r, c.sun.color, c.sun.alpha);
  body += `<g filter="url(#rough)">`;
  c.ridges.forEach((r, i) => {
    if (r.cold) {
      // 冷色山：墨 + 靛
      r.ink *= 0.9;
      body += mountain(r, i, r.seed) + `<rect x="0" y="0" width="${w}" height="${h}" fill="#6f929b" opacity="0.05"/>`;
    } else {
      body += mountain(r, i, r.seed);
    }
    if (r.trees) {
      const xe = r.xmax ? r.xmax * w : w;
      const sub = { ...r, w: xe };
      body += trees(sub, r.seed, r.trees, r.treeSize || 20);
    }
  });
  body += `</g>`;
  if (c.ice) body += iceSheet(c, seed);
  for (const [y, hh, a] of c.mist) body += mistBand(y * h, hh * h, a, 40, w);
  // 四角压边
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>${defs}</defs>${body}</svg>`;
}

/* ---------------------------------------------------------------- 光栅化 */
export async function svgToCanvas(svg, w, h) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return cv;
  } finally {
    URL.revokeObjectURL(url);
  }
}
