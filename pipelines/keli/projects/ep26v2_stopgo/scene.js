const K = {
  paper: '#e9dcbf',
  ink: '#1f3b32',
  red: '#c0492f',
  mid: '#3e5c4e',
  pale: 'rgba(31,59,50,.16)',
  warm: 'rgba(192,73,47,.16)'
};
const SANS = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

let W = 1080, H = 1920, tex = null;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = p => 1 - Math.pow(1 - clamp(p), 3);
const span = (t, a, b) => ease((t - a) / (b - a));

function rnd(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

// paper + stipple tone
function makePaper(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = K.paper;
  g.fillRect(0, 0, w, h);
  const r = rnd(7717);
  for (let i = 0; i < 4200; i++) {
    const x = r() * w, y = r() * h;
    g.fillStyle = r() > .5 ? 'rgba(120,96,60,.10)' : 'rgba(255,250,235,.12)';
    g.beginPath();
    g.arc(x, y, .6 + r() * 1.9, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

function stipple(g, x, y, w, h, density, color, seed) {
  const r = rnd(seed);
  g.save();
  g.fillStyle = color;
  const n = Math.round(w * h * density);
  for (let i = 0; i < n; i++) {
    const px = x + r() * w, py = y + r() * h;
    g.beginPath();
    g.arc(px, py, .9 + r() * 1.5, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

export function init(w, h) {
  W = w; H = h;
  tex = makePaper(w, h);
}

function txt(g, s, x, y, size, color, weight = 700, spacing = 0, align = 'left') {
  g.save();
  g.font = `${weight} ${size}px ${SANS}`;
  g.fillStyle = color;
  g.textAlign = align;
  if (spacing) g.letterSpacing = spacing + 'px';
  g.fillText(s, x, y);
  g.restore();
}

// misregistered print: same text twice with offset
function misreg(g, s, x, y, size, cMain = K.ink, cGhost = K.red, dx = 8, dy = -6, sp = 0) {
  txt(g, s, x + dx, y + dy, size, cGhost, 700, sp);
  txt(g, s, x, y, size, cMain, 700, sp);
}

const PT = [
  [150, 1290], [150, 1160], [312, 1160], [312, 1008], [482, 1008],
  [482, 862], [664, 862], [664, 726], [834, 726], [834, 612], [940, 612]
];

function pathLen(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  }
  return L;
}

function drawPath(g, pts, p, width, color) {
  const L = pathLen(pts) * clamp(p);
  g.save();
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.lineCap = 'butt';
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg <= L) {
      g.lineTo(pts[i][0], pts[i][1]);
      acc += seg;
    } else {
      const k = (L - acc) / seg;
      g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
               pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k);
      break;
    }
  }
  g.stroke();
  g.restore();
}

function blockGrid(g, t) {
  const p = span(t, 0.0, 0.5);
  if (p <= 0) return;
  g.save();
  g.globalAlpha = p;
  // city blocks as pale squares
  const xs = [96, 300, 504, 708, 912];
  const ys = [520, 720, 920, 1120, 1320];
  xs.forEach((x, i) => ys.forEach((y, j) => {
    if ((i + j) % 3 === 2) return;
    g.fillStyle = 'rgba(31,59,50,.09)';
    g.fillRect(x, y, 150, 150);
    stipple(g, x, y, 150, 150, 0.0055, 'rgba(31,59,50,.22)', 1000 + i * 31 + j);
  }));
  g.restore();
}

function lamp(g, x, y, on, p) {
  g.save();
  g.globalAlpha = clamp(p);
  // pole
  g.strokeStyle = K.ink;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - 34);
  g.stroke();
  // head
  const hx = x, hy = y - 44;
  g.fillStyle = on ? K.red : '#8b8674';
  g.beginPath();
  g.arc(hx, hy, 13, 0, Math.PI * 2);
  g.fill();
  if (on) {
    g.strokeStyle = K.red;
    g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(hx, hy, 20 + i * 8, Math.PI * 1.18, Math.PI * 1.82);
      g.stroke();
    }
  }
  g.restore();
}

function drawHeat(g, x, y, p) {
  if (p <= 0) return;
  g.save();
  g.globalAlpha = clamp(p);
  g.strokeStyle = K.red;
  g.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    const off = i * 16;
    g.moveTo(x - 40 + off, y + 6);
    g.bezierCurveTo(x - 24 + off, y - 26, x - 12 + off, y - 6, x + 4 + off, y - 34);
    g.stroke();
  }
  txt(g, 'HEAT', x - 42, y + 46, 24, K.red, 700, 2);
  g.restore();
}

function drawGauge(g, t) {
  const pShort = span(t, 1.72, 2.32);
  const x0 = 96, x1 = 760, y = 1436, h = 44;
  // frame
  g.save();
  g.strokeStyle = K.ink;
  g.lineWidth = 3;
  g.strokeRect(x0, y, x1 - x0, h);
  // fill shrinks
  const fill = (x1 - x0) * (1 - 0.46 * pShort);
  g.fillStyle = K.red;
  g.fillRect(x0 + 3, y + 3, fill - 6, h - 6);
  stipple(g, x0, y, x1 - x0, h, 0.004, 'rgba(255,240,220,.35)', 4242);
  g.restore();
  txt(g, 'RANGE LEFT', x0, y - 14, 22, K.ink, 700, 3);
  txt(g, 'BEFORE', x1 + 12, y + 32, 20, K.mid, 700, 2);
  txt(g, `${Math.round(100 - 46 * clamp(pShort))}%`, x0 + 8 + fill, y + 30, 22, '#f6ecd8', 700, 1, 'right');
}

export function paint(g, t, w, h) {
  W = w; H = h;
  t = t + 0.20;   // first frame already carries a stroke
  if (!tex || tex.width !== w) tex = makePaper(w, h);
  g.drawImage(tex, 0, 0);

  blockGrid(g, t);

  // headline
  const pT = span(t, 0.05, 0.42);
  if (pT > 0) {
    g.save();
    g.globalAlpha = pT;
    misreg(g, 'STOP', 92, 322 - 10 * (1 - pT), 92, K.ink, K.red, 7, -5, 2);
    misreg(g, 'AND GO', 92, 408 - 10 * (1 - pT), 92, K.ink, K.red, 7, -5, 2);
    txt(g, 'EVERY BRAKE IS HEAT', 96, 470, 28, K.mid, 700, 3);
    g.restore();
  }

  // route
  drawPath(g, PT, span(t, 0.30, 1.18), 16, K.ink);
  drawPath(g, PT, span(t, 0.30, 1.18), 6, K.red);

  // lamps light up along the route
  const LAMPS = [[312, 1160], [482, 1008], [664, 862], [834, 726], [940, 612], [150, 1224]];
  LAMPS.forEach(([x, y], i) => {
    const p = span(t, 1.02 + i * 0.12, 1.22 + i * 0.12);
    lamp(g, x, y, p > 0.5, p);
  });

  drawHeat(g, 664, 862, span(t, 2.05, 2.38));
  drawGauge(g, t);

  // bottom note
  const pn = span(t, 2.1, 2.4);
  g.save();
  g.globalAlpha = pn;
  txt(g, 'SIX LIGHTS IN THREE KILOMETRES', 96, 1548, 24, K.mid, 700, 3);
  g.restore();

  // grain flicker
  g.save();
  g.globalAlpha = 0.06;
  const n = rnd(31337 + Math.floor(t * 30));
  g.fillStyle = K.ink;
  for (let i = 0; i < 50; i++) g.fillRect(n() * w, n() * h, 2, 2);
  g.restore();
}
