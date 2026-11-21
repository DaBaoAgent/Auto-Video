const C = {
  paper: '#f1efe8',
  ink: '#22303c',
  red: '#c2563a',
  mid: '#7c848a',
  pale: 'rgba(34,48,60,.10)'
};
const MONO = 'ui-monospace, "Consolas", monospace';
const SANS = 'Arial, "Helvetica Neue", sans-serif';

let W = 1080, H = 1920, tex = null;

const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = p => 1 - Math.pow(1 - clamp(p), 3);
const span = (t, a, b) => ease((t - a) / (b - a));

function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function makePaper(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = C.paper;
  g.fillRect(0, 0, w, h);
  const r = rnd(5501);
  for (let i = 0; i < 5000; i++) {
    const x = r() * w, y = r() * h;
    g.fillStyle = r() > .5 ? 'rgba(120,112,96,.10)' : 'rgba(255,255,250,.14)';
    g.fillRect(x, y, 1 + r() * 2, 1 + r() * 2);
  }
  return c;
}

export function init(w, h) { W = w; H = h; tex = makePaper(w, h); }

function txt(g, s, x, y, size, color, weight = 500, spacing = 0, align = 'left', font = MONO) {
  g.save();
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  if (spacing) g.letterSpacing = spacing + 'px';
  g.fillText(s, x, y);
  g.restore();
}

function line(g, x1, y1, x2, y2, w = 2, color = C.ink) {
  g.strokeStyle = color; g.lineWidth = w;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}

function head(g, x, y, ang, size = 9, color = C.ink) {
  g.save();
  g.strokeStyle = color; g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - size * Math.cos(ang - 0.4), y - size * Math.sin(ang - 0.4));
  g.moveTo(x, y);
  g.lineTo(x - size * Math.cos(ang + 0.4), y - size * Math.sin(ang + 0.4));
  g.stroke();
  g.restore();
}

// polyline partial draw
function poly(g, pts, p, w = 2.4, color = C.ink) {
  if (p <= 0) return;
  let total = 0;
  const segs = [];
  for (let i = 1; i < pts.length; i++) {
    const L = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(L); total += L;
  }
  let left = total * clamp(p);
  g.save();
  g.strokeStyle = color; g.lineWidth = w; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const L = segs[i - 1];
    if (left >= L) {
      g.lineTo(pts[i][0], pts[i][1]);
      left -= L;
    } else {
      const k = left / L;
      g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k,
               pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k);
      left = 0;
      break;
    }
  }
  g.stroke();
  g.restore();
}

const FOOT = [96, 1180];
const KNEE = [300, 1180];
const TOP = [880, 880];
const RIGHT = [984, 880];

function slopeY(x) {
  const k = (x - KNEE[0]) / (TOP[0] - KNEE[0]);
  return KNEE[1] + (TOP[1] - KNEE[1]) * clamp(k);
}

function hatch(g, pts, p, depth, gap, color) {
  if (p <= 0) return;
  g.save();
  g.strokeStyle = color; g.lineWidth = 1.5;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
    const L = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.floor(L / gap);
    for (let j = 0; j <= n; j++) {
      if (acc / (L * 6) > p) break;
      const k = j / Math.max(1, n);
      const x = x1 + (x2 - x1) * k;
      const y = y1 + (y2 - y1) * k;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + depth * .55, y + depth);
      g.stroke();
    }
    acc += L;
  }
  g.restore();
}

function wheel(g, cx, cy, r) {
  g.save();
  g.strokeStyle = C.ink; g.lineWidth = 2.2;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(cx, cy, r * 0.34, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = C.mid; g.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r * .34, cy + Math.sin(a) * r * .34);
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    g.stroke();
  }
  g.restore();
}

function drawVehicle(g, t) {
  const p = span(t, 0.95, 1.3);
  if (p <= 0) return;
  const cx = 620;
  const ang = Math.atan2(TOP[1] - KNEE[1], TOP[0] - KNEE[0]);
  const cy = slopeY(cx);
  g.save();
  g.globalAlpha = p;
  g.translate(cx, cy);
  g.rotate(ang);
  // load block resting on the slope face (bottom edge sunk 8px into the section)
  g.strokeStyle = C.ink; g.lineWidth = 2.8;
  g.strokeRect(-96, -100, 192, 108);
  line(g, -96, -100, 96, -100, 4, C.ink);
  // hatch inside (mass)
  g.strokeStyle = 'rgba(34,48,60,.35)';
  g.lineWidth = 1.4;
  for (let x = -84; x < 88; x += 18) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 22, -92); g.stroke();
  }
  g.restore();
  // label above the block, outside rotation
  const nx = Math.sin(ang), ny = -Math.cos(ang);
  const lx = cx - 96 * Math.cos(ang) + nx * 150;
  const ly = cy - 96 * Math.sin(ang) + ny * 150;
  g.save();
  g.globalAlpha = p;
  txt(g, 'LOAD', lx, ly, 20, C.mid, 700, 3);
  g.restore();
}

function drawAngle(g, t) {
  const p = span(t, 1.22, 1.55);
  if (p <= 0) return;
  // wedge arc: from left ground (180deg) up over the top to the slope dir
  const a1 = 2 * Math.PI + Math.atan2(TOP[1] - KNEE[1], TOP[0] - KNEE[0]);
  g.save();
  g.strokeStyle = C.red; g.lineWidth = 2.4;
  g.beginPath();
  g.arc(KNEE[0], KNEE[1], 86, Math.PI, Math.PI + (a1 - Math.PI) * clamp(p), false);
  g.stroke();
  g.restore();
  txt(g, '10%', 150, 1050, 30, C.red, 700, 2);
  txt(g, 'RISE / RUN', 152, 1082, 18, C.mid, 600, 2);

  // true-scale triangle, up in the clean top-right area
  const pt = span(t, 1.3, 1.58);
  if (pt > 0) {
    const bx = 700, by = 470;
    g.save();
    g.globalAlpha = clamp(pt);
    line(g, bx, by, bx + 180, by, 2, C.mid);
    line(g, bx + 180, by, bx + 180, by - 18 * clamp(pt), 2, C.mid);
    line(g, bx, by, bx + 180 * clamp(pt), by - 18 * clamp(pt), 2, C.red);
    txt(g, '1 : 10  TRUE SCALE', bx, by + 32, 17, C.mid, 600, 2);
    g.restore();
  }
}

function drawX2(g, t) {
  const p = span(t, 1.48, 1.82);
  if (p <= 0) return;
  g.save();
  g.globalAlpha = p;
  const y = 640 - 16 * (1 - p);
  txt(g, '×2', 700, y, 150, C.red, 700, 0, 'left', SANS);
  txt(g, 'CURRENT ON THE CLIMB', 704, y + 46, 20, C.ink, 700, 3);
  g.restore();
  // arrow along the slope
  const pa = span(t, 1.55, 1.85);
  if (pa > 0) {
    const sx = 690, sy = slopeY(690) - 120;
    const ex = sx + 150 * pa, ey = sy - 150 * 0.517 * pa;
    line(g, sx, sy, ex, ey, 2.6, C.red);
    head(g, ex, ey, Math.atan2(ey - sy, ex - sx), 10, C.red);
  }
}

function drawBar(g, t) {
  const p = span(t, 1.78, 2.14);
  const x0 = 96, x100 = 460, x200 = 824, y = 1352, h = 42;
  g.save();
  g.strokeStyle = C.ink; g.lineWidth = 2;
  g.strokeRect(x0, y, x200 - x0, h);
  line(g, x100, y - 8, x100, y + h + 8, 1.6, C.mid);
  txt(g, 'AT 100%', x100, y + h + 34, 18, C.mid, 600, 2, 'center');
  txt(g, '·', 0, 0, 1, C.paper);
  g.restore();
  if (p > 0) {
    g.save();
    const w = (x200 - x0) * clamp(p);
    g.fillStyle = C.ink;
    g.fillRect(x0 + 2, y + 2, Math.max(0, Math.min(w, (x100 - x0) - 4)), h - 4);
    if (w > (x100 - x0)) {
      g.fillStyle = C.red;
      g.fillRect(x100, y + 2, Math.min(w - (x100 - x0), x200 - x100 - 2), h - 4);
    }
    g.restore();
  }
  txt(g, 'DRAW', x0, y - 12, 19, C.ink, 700, 3);
  txt(g, 'FLAT', x100, y + h + 58, 17, C.mid, 600, 2, 'center');
  txt(g, 'CLIMB', (x100 + x200) / 2, y + h + 58, 17, C.red, 600, 2, 'center');
}

export function paint(g, t, w, h) {
  W = w; H = h;
  t = t + 0.20;   // first frame already carries a stroke
  const tt = Math.min(t * 1.22, 2.42);
  if (!tex || tex.width !== w) tex = makePaper(w, h);
  g.drawImage(tex, 0, 0);

  // title
  const pt = span(tt, 0.05, 0.4);
  if (pt > 0) {
    g.save();
    g.globalAlpha = pt;
    txt(g, 'EP–26   SECTION B–B', 96, 236, 20, C.mid, 600, 4);
    txt(g, 'GRADE', 96, 314, 46, C.ink, 700, 2, 'left', SANS);
    txt(g, '10 PERCENT · ONE IN TEN', 96, 356, 22, C.mid, 600, 2);
    line(g, 96, 384, 96 + 888 * pt, 384, 2, C.ink);
    g.restore();
  }

  // terrain
  poly(g, [FOOT, KNEE, TOP, RIGHT], span(tt, 0.34, 0.86), 2.8, C.ink);
  hatch(g, [KNEE, TOP, RIGHT], span(tt, 0.62, 0.98), 20, 26, 'rgba(34,48,60,.45)');
  hatch(g, [FOOT, KNEE], span(tt, 0.55, 0.9), 20, 26, 'rgba(34,48,60,.45)');

  drawVehicle(g, tt);
  drawAngle(g, tt);
  drawX2(g, tt);
  drawBar(g, tt);

  // notes
  const pn = span(tt, 2.0, 2.32);
   if (pn > 0) {
    g.save();
    g.globalAlpha = pn;
    txt(g, 'PROFILE EXAGGERATED · SLOPE NOT TO SCALE', 96, 1512, 18, C.mid, 600, 2);
    g.restore();
  }

  // grain
  g.save();
  g.globalAlpha = 0.05;
  const n = rnd(8081 + Math.floor(t * 30));
  g.fillStyle = C.ink;
  for (let i = 0; i < 46; i++) g.fillRect(n() * w, n() * h, 2, 2);
  g.restore();
}
