const P = {
  paper: '#0a2545',
  ink: '#e6f1fb',
  dim: '#8fb2cf',
  rule: 'rgba(232,242,255,.55)',
  grid: 'rgba(150,192,224,.14)',
  red: '#e0483c'
};
const MONO = 'ui-monospace, "SFMono-Regular", "Consolas", monospace';

let W = 1080, H = 1920, tex = null;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = p => 1 - Math.pow(1 - clamp(p), 3);
const span = (t, a, b) => ease((t - a) / (b - a));

function rnd(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function makeTex(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = P.paper;
  g.fillRect(0, 0, w, h);
  const r = rnd(9137);
  for (let i = 0; i < 5200; i++) {
    const x = r() * w, y = r() * h, a = r();
    g.fillStyle = a > .55 ? 'rgba(255,255,255,.030)' : 'rgba(0,10,24,.05)';
    g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2);
  }
  // fine grid
  g.strokeStyle = P.grid;
  g.lineWidth = 1;
  for (let x = 0; x <= w; x += 40) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke(); }
  for (let y = 0; y <= h; y += 40) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); }
  // heavier every 200
  g.strokeStyle = 'rgba(150,192,224,.24)';
  g.lineWidth = 1.6;
  for (let x = 0; x <= w; x += 200) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y <= h; y += 200) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  return c;
}

export function init(w, h) {
  W = w; H = h;
  tex = makeTex(w, h);
}

function txt(g, s, x, y, size, color, weight = 500, spacing = 0, align = 'left') {
  g.save();
  g.font = `${weight} ${size}px ${MONO}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  if (spacing) g.letterSpacing = spacing + 'px';
  g.fillText(s, x, y);
  g.restore();
}

function line(g, x1, y1, x2, y2, w = 1.8, color = P.rule) {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

function dash(g, x1, y1, x2, y2, w = 1.6, color = P.rule, pat = [16, 6, 4, 6]) {
  g.save();
  g.setLineDash(pat);
  line(g, x1, y1, x2, y2, w, color);
  g.restore();
}

// hand-drawn wobbly ellipse ring
function ring(g, cx, cy, rx, ry, p, wob, color) {
  if (p <= 0) return;
  const segs = 120;
  const total = Math.floor(segs * clamp(p));
  g.save();
  g.strokeStyle = color;
  g.lineWidth = 4.2;
  g.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    g.beginPath();
    for (let i = 0; i <= total; i++) {
      const a = (i / segs) * Math.PI * 2 - Math.PI * 0.62 + pass * 0.9;
      const w2 = wob * (pass ? 1.15 : 1);
      const rr = 1 + Math.sin(a * 3 + pass) * 0.014 + w2 * 0.016;
      const x = cx + Math.cos(a) * rx * rr + Math.sin(a * 5) * wob * 1.4;
      const y = cy + Math.sin(a) * ry * rr + Math.cos(a * 7) * wob;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

// ground profile with hatching
function ground(g, x1, x2, y, p) {
  const xe = x1 + (x2 - x1) * clamp(p);
  line(g, x1, y, xe, y, 2.4, P.rule);
  const step = 24;
  g.save();
  g.strokeStyle = 'rgba(232,242,255,.45)';
  g.lineWidth = 1.5;
  for (let x = x1; x < xe - 2; x += step) {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 14, y + 16);
    g.stroke();
  }
  g.restore();
}

function arrowHead(g, x, y, dx, size = 9, color = P.ink) {
  const a = Math.atan2(dx.y, dx.x);
  g.save();
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - size * Math.cos(a - 0.42), y - size * Math.sin(a - 0.42));
  g.moveTo(x, y);
  g.lineTo(x - size * Math.cos(a + 0.42), y - size * Math.sin(a + 0.42));
  g.stroke();
  g.restore();
}

function dimH(g, x1, x2, y, label, p, color = P.ink) {
  if (p <= 0) return;
  const xe = x1 + (x2 - x1) * clamp(p);
  line(g, x1, y, xe, y, 1.8, color);
  line(g, x1, y - 8, x1, y + 8, 1.8, color);
  if (p >= 1) line(g, x2, y - 8, x2, y + 8, 1.8, color);
  if (p >= 1) arrowHead(g, x2, y, { x: 1, y: 0 }, 9, color);
  if (p > 0.06) arrowHead(g, x1, y, { x: -1, y: 0 }, 9, color);
  if (p >= 1) txt(g, label, (x1 + x2) / 2, y - 14, 24, color, 600, 2, 'center');
}

function drawFrame(g, p) {
  const x1 = 52, y1 = 196, x2 = 1028, y2 = 1348;
  g.save();
  g.globalAlpha = clamp(p);
  g.strokeStyle = P.rule;
  g.lineWidth = 3;
  g.strokeRect(x1, y1, x2 - x1, y2 - y1);
  // corner ticks
  const t = 26;
  g.lineWidth = 4.5;
  g.strokeStyle = P.ink;
  [[x1, y1, 1, 1], [x2, y1, -1, 1], [x1, y2, 1, -1], [x2, y2, -1, -1]].forEach(([x, y, sx, sy]) => {
    g.beginPath(); g.moveTo(x + sx * t, y); g.lineTo(x, y); g.lineTo(x, y + sy * t); g.stroke();
  });
  g.restore();
}

function drawHead(g, t) {
  const p = span(t, 0.12, 0.5);
  g.save();
  g.globalAlpha = p;
  txt(g, 'EP–26   RANGE', 92, 268 - 8 * (1 - p), 22, P.dim, 600, 4);
  txt(g, 'CONDITIONS OF TEST', 92, 322 - 8 * (1 - p), 40, P.ink, 700, 1);
  txt(g, 'SECTION C–C   ·   BASELINE CLAIM', 92, 358 - 8 * (1 - p), 20, P.dim, 500, 3);
  line(g, 92, 382, 92 + 896 * p, 382, 2.2, P.rule);
  // right side small stamp
  txt(g, 'FIG 26.2', 988, 322, 22, P.dim, 600, 2, 'right');
  g.restore();
}

const ROWS = [
  ['ROAD', 'FLAT ASPHALT'],
  ['SPEED', '25 KM / H'],
  ['LOAD', '60 KG'],
  ['AMBIENT', '25 °C']
];

function drawTable(g, t) {
  const x1 = 92, xv = 470, y0 = 486, hRow = 96;
  ROWS.forEach(([k, v], i) => {
    const p = span(t, 0.38 + i * 0.30, 0.66 + i * 0.30);
    if (p <= 0) return;
    const y = y0 + i * hRow;
    g.save();
    g.globalAlpha = p;
    txt(g, k, x1, y - 6 * (1 - p), 22, P.dim, 600, 5);
    txt(g, v, xv, y - 6 * (1 - p), 36, P.ink, 600, 1);
    line(g, x1, y + 26, x1 + 896 * p, y + 26, 1.6, 'rgba(232,242,255,.38)');
    g.restore();
  });
}

function drawResult(g, t) {
  const p = span(t, 1.55, 1.95);
  if (p <= 0) return;
  g.save();
  g.globalAlpha = p;
  line(g, 92, 872, 92 + 896 * p, 872, 3, P.rule);
  txt(g, 'CLAIMED RANGE', 92, 918, 22, P.dim, 600, 5);
  txt(g, '120 KM', 92, 1002 - 10 * (1 - p), 68, P.ink, 700, 2);
  txt(g, 'ONLY UNDER THESE FOUR', 92, 1042, 22, P.dim, 500, 3);
  g.restore();
}

function drawScene(g, t) {
  const pGround = span(t, 1.62, 1.92);
  const pCar = span(t, 1.86, 2.12);
  const pDim = span(t, 2.02, 2.28);
  const yG = 1246;
  txt(g, 'FIG 26.2b   PROFILE: ZERO GRADE', 100, 1120, 20, P.dim, 500, 3);
  ground(g, 100, 980, yG, pGround);
  // load block sitting on the flat line
  if (pCar > 0) {
    g.save();
    g.globalAlpha = pCar;
    g.strokeStyle = P.ink;
    g.lineWidth = 2.4;
    const bx = 418, by = 1160, bw = 150, bh = 86;
    g.strokeRect(bx, by, bw, bh);
    // wheels (small, tucked at the base)
    [bx + 32, bx + bw - 32].forEach(cx => {
      g.beginPath();
      g.arc(cx, by + bh, 26, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(cx, by + bh, 10, 0, Math.PI * 2);
      g.strokeStyle = P.dim;
      g.stroke();
      g.strokeStyle = P.ink;
    });
    // weight arrow from above
    const ax = bx + bw * 0.72;
    line(g, ax, by - 74, ax, by - 16, 2.2, P.ink);
    arrowHead(g, ax, by - 14, { x: 0, y: 1 }, 9, P.ink);
    txt(g, '60 KG', ax + 12, by - 46, 24, P.ink, 600, 2, 'left');
    g.restore();
  }
  if (pDim > 0) dimH(g, 100, 980, 1330, '120 KM  ·  FLAT', pDim, P.ink);
}

function drawRed(g, t) {
  // red pencil circle around "FLAT ASPHALT"
  const p = span(t, 2.16, 2.52);
  ring(g, 632, 474, 200, 34, p, 0.9, P.red);
  // red underline of the FIG note
  if (p > 0.7) {
    const q = span(t, 2.42, 2.6);
    line(g, 100, 1128, 100 + 300 * q, 1128, 3.4, P.red);
  }
}

function drawTitleBlock(g, t) {
  const p = span(t, 0.35, 0.7);
  if (p <= 0) return;
  g.save();
  g.globalAlpha = p;
  const x1 = 92, x2 = 988, y = 1392, h = 116;
  g.strokeStyle = P.rule;
  g.lineWidth = 2;
  g.strokeRect(x1, y, x2 - x1, h);
  line(g, x1 + 300, y, x1 + 300, y + h, 1.6, P.rule);
  line(g, x1 + 512, y, x1 + 512, y + h, 1.6, P.rule);
  txt(g, 'DRAWING', x1 + 16, y + 26, 16, P.dim, 600, 3);
  txt(g, 'RANGE / TEST CONFIG', x1 + 16, y + 62, 22, P.ink, 600, 1);
  txt(g, 'SCALE', x1 + 316, y + 26, 16, P.dim, 600, 3);
  txt(g, 'NTS', x1 + 316, y + 62, 22, P.ink, 600, 1);
  txt(g, 'SHEET', x1 + 528, y + 26, 16, P.dim, 600, 3);
  txt(g, '1 / 1', x1 + 528, y + 62, 22, P.ink, 600, 1);
  line(g, x1, y + 74, x2, y + 74, 1.2, 'rgba(232,242,255,.30)');
  txt(g, 'HAND-ANNOTATED  ·  RED = THE ONE ASSUMPTION', x1 + 16, y + 100, 17, P.dim, 500, 2);
  g.restore();
}

export function paint(g, t, w, h) {
  W = w; H = h;
  t = t + 0.20;   // first frame already carries a stroke
  if (!tex || tex.width !== w) tex = makeTex(w, h);
  g.drawImage(tex, 0, 0);
  // vignette
  const vg = g.createRadialGradient(w * .5, h * .45, h * .18, w * .5, h * .5, h * .78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(2,12,26,.42)');
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);

  drawFrame(g, span(t, 0.0, 0.36));
  drawHead(g, t);
  drawTable(g, t);
  drawResult(g, t);
  drawScene(g, t);
  drawRed(g, t);
  drawTitleBlock(g, t);

  // paper grain flicker
  g.save();
  g.globalAlpha = 0.055;
  g.fillStyle = '#000';
  const n = rnd(4096 + Math.floor(t * 30));
  for (let i = 0; i < 40; i++) g.fillRect(n() * w, n() * h, 2, 2);
  g.restore();
}
