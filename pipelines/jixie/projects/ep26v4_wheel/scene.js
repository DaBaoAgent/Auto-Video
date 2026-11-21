const J = {
  bg: '#0e2436',
  ink: '#d8ecff',
  accent: '#9be8a0',
  cyan: '#6fb3c9',
  warn: '#e8a05a',
  grid: 'rgba(143,182,216,.20)'
};
const MONO = 'ui-monospace, "Consolas", monospace';

let W = 1080, H = 1920, tex = null;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = p => 1 - Math.pow(1 - clamp(p), 3);
const span = (t, a, b) => ease((t - a) / (b - a));

function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function makeBg(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = J.bg;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = J.grid;
  g.lineWidth = 1;
  for (let x = 0; x <= w; x += 45) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, h); g.stroke(); }
  for (let y = 0; y <= h; y += 45) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(w, y + .5); g.stroke(); }
  const r = rnd(3301);
  for (let i = 0; i < 3600; i++) {
    g.fillStyle = r() > .5 ? 'rgba(255,255,255,.032)' : 'rgba(0,8,16,.06)';
    g.fillRect(r() * w, r() * h, 2, 2);
  }
  return c;
}

export function init(w, h) { W = w; H = h; tex = makeBg(w, h); }

function txt(g, s, x, y, size, color, weight = 600, spacing = 0, align = 'left') {
  g.save();
  g.font = `${weight} ${size}px ${MONO}`;
  g.fillStyle = color;
  g.textAlign = align;
  if (spacing) g.letterSpacing = spacing + 'px';
  g.fillText(s, x, y);
  g.restore();
}

function line(g, x1, y1, x2, y2, w = 2, color = J.ink) {
  g.strokeStyle = color; g.lineWidth = w;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}

function head(g, x, y, ang, size = 10, color = J.ink) {
  g.save(); g.strokeStyle = color; g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x - size * Math.cos(ang - .42), y - size * Math.sin(ang - .42));
  g.moveTo(x, y); g.lineTo(x - size * Math.cos(ang + .42), y - size * Math.sin(ang + .42));
  g.stroke(); g.restore();
}

// ring sector with fill
function annulus(g, cx, cy, rx, ry, w, color, a0 = 0, a1 = Math.PI * 2) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = w;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, a0, a1);
  g.stroke();
  g.restore();
}

function spokes(g, cx, cy, r, n, color) {
  g.save(); g.strokeStyle = color; g.lineWidth = 1.6;
  for (let i = 0; i < n; i++) {
    const a = i * Math.PI * 2 / n;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * r * .16, cy + Math.sin(a) * r * .16);
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    g.stroke();
  }
  g.restore();
}

function wheelA(g, t) {
  const p = span(t, 0.34, 0.92);
  if (p <= 0) return;
  const cx = 348, cy = 812, r = 168, GY = cy + r;
  g.save();
  g.globalAlpha = clamp(p);
  // tyre carcass (filled band)
  g.strokeStyle = J.cyan; g.lineWidth = 34;
  annulus(g, cx, cy, r - 16, r - 16, 34, J.cyan, -Math.PI * .5 - Math.PI * p * 1.0, -Math.PI * .5 + Math.PI * p);
  // rim
  annulus(g, cx, cy, r - 36, r - 36, 3, J.ink);
  annulus(g, cx, cy, r - 92, r - 92, 2, J.accent);
  spokes(g, cx, cy, r - 40, 8, 'rgba(216,236,255,.55)');
  // hub
  g.fillStyle = J.accent;
  g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill();
  // ground contact
  line(g, cx - 30, GY + 6, cx + 30, GY + 6, 4, J.accent);
  line(g, 60, GY + 30, 470, GY + 30, 2, J.grid);
  g.restore();
  txt(g, 'P 2.0 BAR', cx, GY + 78, 22, J.accent, 700, 2, 'center');
  txt(g, 'HARD', cx, cy - r - 34, 20, J.ink, 600, 3, 'center');
}

function wheelB(g, t) {
  const p = span(t, 0.78, 1.36);
  if (p <= 0) return;
  const cx = 730, GY = 988;
  const ry = 148, r = 168;
  g.save();
  g.globalAlpha = clamp(p);
  // deflated tyre: filled squashed body, flattened where it meets the road
  g.save();
  g.beginPath();
  g.rect(0, 0, W, GY);
  g.clip();
  g.fillStyle = J.warn;
  g.beginPath();
  g.ellipse(cx, GY - ry, r, ry, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = J.bg;
  g.beginPath();
  g.ellipse(cx, GY - ry, r - 34, ry - 34, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // rim (unchanged)
  annulus(g, cx, GY - ry, r - 36, r - 36, 3, J.ink);
  annulus(g, cx, GY - ry, r - 92, r - 92, 2, J.accent);
  spokes(g, cx, GY - ry, r - 40, 8, 'rgba(216,236,255,.55)');
  g.fillStyle = J.accent;
  g.beginPath(); g.arc(cx, GY - ry, 16, 0, Math.PI * 2); g.fill();
  // wide contact patch
  line(g, cx - 72, GY + 6, cx + 72, GY + 6, 5, J.warn);
  line(g, 560, GY + 30, 940, GY + 30, 2, J.grid);
  g.restore();
  txt(g, 'P 1.0 BAR', cx, GY + 78, 22, J.warn, 700, 2, 'center');
  txt(g, 'SOFT', cx, GY - ry - 178, 20, J.ink, 600, 3, 'center');
}

function drawHead(g, t) {
  const p = span(t, 0.05, 0.42);
  if (p <= 0) return;
  g.save(); g.globalAlpha = p;
  txt(g, 'EP–26   DRIVE SYSTEM', 80, 240, 20, 'rgba(216,236,255,.62)', 600, 4);
  txt(g, 'TYRE & LOAD', 80, 306, 44, J.ink, 700, 2);
  txt(g, 'CONTACT PATCH IS WHERE RANGE LEAVES', 80, 346, 21, 'rgba(216,236,255,.68)', 600, 2);
  line(g, 80, 374, 80 + 920 * p, 374, 2, 'rgba(216,236,255,.45)');
  g.restore();
}

function drawLoad(g, t) {
  const p = span(t, 1.18, 1.48);
  if (p <= 0) return;
  const x = 540, y0 = 520;
  g.save(); g.globalAlpha = clamp(p);
  line(g, x, y0, x, y0 + 150 * clamp(p), 3, J.ink);
  if (p >= 1) head(g, x, y0 + 158, Math.PI / 2, 11, J.ink);
  txt(g, '60 KG', x + 14, y0 + 74, 24, J.ink, 700, 2);
  txt(g, 'RIDER + CARGO', x + 14, y0 + 102, 17, 'rgba(216,236,255,.6)', 600, 2);
  g.restore();
}

function drawPatch(g, t) {
  const p = span(t, 1.5, 1.86);
  if (p <= 0) return;
  g.save(); g.globalAlpha = clamp(p);
  // patch width comparison bars
  const y = 1246;
  line(g, 80, y, 1000, y, 1.6, 'rgba(216,236,255,.35)');
  g.fillStyle = J.accent;
  g.fillRect(200, y - 26, 60, 22);
  g.fillStyle = J.warn;
  g.fillRect(880 - 144, y - 26, 144, 22);
  txt(g, '60 MM', 300, y - 8, 20, J.accent, 700, 2);
  txt(g, '140 MM', 800, y - 8, 20, J.warn, 700, 2, 'right');
  g.restore();
  txt(g, 'PATCH WIDTH', 80, y - 44, 18, 'rgba(216,236,255,.6)', 600, 3);
}

function drawVerdict(g, t) {
  const p = span(t, 1.82, 2.16);
  if (p <= 0) return;
  g.save(); g.globalAlpha = clamp(p);
  const y = 1452;
  g.fillStyle = 'rgba(155,232,160,.10)';
  g.fillRect(80, y - 62, 920, 104);
  txt(g, 'SOFT TYRE = MORE PATCH = MORE DRAG', 100, y + 8, 30, J.ink, 700, 2);
  txt(g, 'CHECK PRESSURE WEEKLY', 100, y + 40, 19, J.accent, 600, 3);
  g.restore();
  // red-ish underline
  const q = span(t, 2.06, 2.3);
  line(g, 100, y + 20, 100 + 560 * q, y + 20, 2, J.warn);
}

export function paint(g, t, w, h) {
  W = w; H = h;
  t = t + 0.20;   // first frame already carries a stroke
  if (!tex || tex.width !== w) tex = makeBg(w, h);
  g.drawImage(tex, 0, 0);

  // dim vignette
  const vg = g.createRadialGradient(w * .5, h * .42, h * .2, w * .5, h * .5, h * .8);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,6,14,.5)');
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);

  drawHead(g, t);
  wheelA(g, t);
  wheelB(g, t);
  drawLoad(g, t);
  drawPatch(g, t);
  drawVerdict(g, t);

  g.save();
  g.globalAlpha = 0.05;
  const n = rnd(6060 + Math.floor(t * 30));
  g.fillStyle = '#000';
  for (let i = 0; i < 46; i++) g.fillRect(n() * w, n() * h, 2, 2);
  g.restore();
}
