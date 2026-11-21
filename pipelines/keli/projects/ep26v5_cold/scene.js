const K = {
  paper: '#e9dcbf',
  ink: '#1f3b32',
  red: '#c0492f',
  mid: '#4d6a58',
  pale: 'rgba(31,59,50,.10)'
};
const SANS = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

let W = 1080, H = 1920, tex = null;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = p => 1 - Math.pow(1 - clamp(p), 3);
const span = (t, a, b) => ease((t - a) / (b - a));

function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function makePaper(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = K.paper;
  g.fillRect(0, 0, w, h);
  const r = rnd(6607);
  for (let i = 0; i < 4400; i++) {
    g.fillStyle = r() > .5 ? 'rgba(120,96,60,.10)' : 'rgba(255,250,235,.12)';
    g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, Math.PI * 2); g.fill();
  }
  return c;
}

function dots(g, x, y, w, h, density, color, seed) {
  const r = rnd(seed);
  g.save(); g.fillStyle = color;
  const n = Math.round(w * h * density);
  for (let i = 0; i < n; i++) {
    g.beginPath();
    g.arc(x + r() * w, y + r() * h, .9 + r() * 1.5, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

export function init(w, h) { W = w; H = h; tex = makePaper(w, h); }

function txt(g, s, x, y, size, color, weight = 700, spacing = 0, align = 'left') {
  g.save();
  g.font = `${weight} ${size}px ${SANS}`;
  g.fillStyle = color;
  g.textAlign = align;
  if (spacing) g.letterSpacing = spacing + 'px';
  g.fillText(s, x, y);
  g.restore();
}

function misreg(g, s, x, y, size, dx = 7, dy = -5) {
  txt(g, s, x + dx, y + dy, size, K.red, 700, 2);
  txt(g, s, x, y, size, K.ink, 700, 2);
}

const BX = 152, BY = 560, BW = 250, BH = 660;
const CELLS = 5;

function batteryFrame(g, t) {
  const p = span(t, 0.34, 0.78);
  if (p <= 0) return;
  g.save();
  g.globalAlpha = clamp(p);
  g.strokeStyle = K.ink;
  g.lineWidth = 5;
  g.strokeRect(BX, BY, BW, BH);
  // terminal
  g.fillStyle = K.ink;
  g.fillRect(BX + BW * 0.36, BY - 26, BW * 0.28, 24);
  g.restore();
  txt(g, 'BATTERY', BX, BY - 60, 24, K.mid, 700, 3);
}

function batteryCells(g, t, level) {
  const p = span(t, 0.7, 1.05);
  if (p <= 0) return;
  const pad = 14;
  const cw = BW - pad * 2;
  const ch = (BH - pad * 2 - (CELLS - 1) * 10) / CELLS;
  g.save();
  for (let i = 0; i < CELLS; i++) {
    const y = BY + pad + i * (ch + 10);
    const on = i < level ? 1 : 0;
    // frame of each cell
    g.strokeStyle = 'rgba(31,59,50,.35)';
    g.lineWidth = 1.6;
    g.strokeRect(BX + pad, y, cw, ch);
    if (on) {
      const ip = span(t, 0.7 + i * 0.07, 0.98 + i * 0.07);
      g.fillStyle = i === CELLS - 1 ? K.red : K.ink;
      g.fillRect(BX + pad, y, cw * clamp(ip), ch);
      dots(g, BX + pad, y, cw, ch, 0.006, 'rgba(233,220,191,.30)', 800 + i);
    }
  }
  g.restore();
}

function thermometer(g, t, temp) {
  const p = span(t, 0.86, 1.2);
  if (p <= 0) return;
  const tx = 742, ty = 540, tw = 56, th = 620;
  const bulbY = ty + th + 46, bulbR = 52;
  const lvl = ty + th - Math.min(temp, 10) / 10 * (th - 20);
  g.save();
  g.globalAlpha = clamp(p);
  // tube
  g.strokeStyle = K.ink; g.lineWidth = 4;
  g.strokeRect(tx, ty, tw, th);
  g.beginPath(); g.arc(tx + tw / 2, bulbY, bulbR, 0, Math.PI * 2); g.stroke();
  // mercury
  const mc = temp <= 10 ? K.red : K.ink;
  g.strokeStyle = mc;
  g.lineCap = 'butt';
  g.lineWidth = tw - 22;
  g.beginPath();
  g.moveTo(tx + tw / 2, ty + th + 2);
  g.lineTo(tx + tw / 2, lvl);
  g.stroke();
  g.fillStyle = mc;
  g.beginPath(); g.arc(tx + tw / 2, bulbY, bulbR - 8, 0, Math.PI * 2); g.fill();
  g.lineWidth = 6;
  g.strokeStyle = mc;
  g.beginPath(); g.moveTo(tx + tw / 2, ty + th - 4); g.lineTo(tx + tw / 2, bulbY - bulbR + 6); g.stroke();
  // ticks
  g.strokeStyle = 'rgba(31,59,50,.45)'; g.lineWidth = 1.6;
  for (let v = 0; v <= 10; v += 2) {
    const y = ty + th - (v / 10) * (th - 20);
    g.beginPath();
    g.moveTo(tx + tw, y);
    g.lineTo(tx + tw + (v % 5 === 0 ? 26 : 14), y);
    g.stroke();
  }
  g.restore();
  txt(g, `${Math.round(temp)} °C`, tx + tw / 2, ty - 26, 30, temp <= 10 ? K.red : K.ink, 700, 1, 'center');
}

function drawStamp(g, t) {
  const p = span(t, 2.0, 2.34);
  if (p <= 0) return;
  g.save();
  g.globalAlpha = clamp(p);
  txt(g, 'ABOUT', 96, 1374, 26, K.mid, 700, 4);
  txt(g, '−20%', 150, 1462, 104, K.red, 700, 0, 'left');
  txt(g, 'AND IT KEEPS DROPPING', 96, 1512, 24, K.ink, 700, 3);
  g.restore();
  // underline
  const q = span(t, 2.2, 2.45);
  g.save();
  g.strokeStyle = K.red; g.lineWidth = 5;
  g.beginPath(); g.moveTo(150, 1478); g.lineTo(150 + 330 * q, 1478); g.stroke();
  g.restore();
}

export function paint(g, t, w, h) {
  W = w; H = h;
  t = t + 0.20;   // first frame already carries a stroke
  if (!tex || tex.width !== w) tex = makePaper(w, h);
  g.drawImage(tex, 0, 0);

  // pale field behind instruments
  g.save();
  g.globalAlpha = span(t, 0.1, 0.5);
  g.fillStyle = 'rgba(31,59,50,.06)';
  g.fillRect(80, 480, 920, 840);
  dots(g, 80, 480, 920, 840, 0.005, 'rgba(31,59,50,.16)', 9090);
  g.restore();

  // title
  const pt = span(t, 0.05, 0.4);
  if (pt > 0) {
    g.save();
    g.globalAlpha = pt;
    misreg(g, 'COLD', 92, 322 - 8 * (1 - pt), 86);
    txt(g, 'BELOW TEN DEGREES', 96, 384, 28, K.mid, 700, 3);
    g.restore();
  }

  batteryFrame(g, t);

  // battery level: starts full, drops one cell when cold sets in
  const drop = span(t, 1.62, 2.0);
  const level = 5 - Math.round(1.2 * drop);
  batteryCells(g, t, level);

  const tempP = span(t, 1.14, 1.74);
  thermometer(g, t, 25 - 20 * clamp(tempP));

  drawStamp(g, t);

  if (level <= 4) {
    const pn = span(t, 1.9, 2.2);
    g.save();
    g.globalAlpha = pn;
    txt(g, 'ONE CELL GONE', BX, BY + BH + 56, 22, K.red, 700, 3);
    g.restore();
  }

  // grain
  g.save();
  g.globalAlpha = 0.06;
  const n = rnd(4321 + Math.floor(t * 30));
  g.fillStyle = K.ink;
  for (let i = 0; i < 46; i++) g.fillRect(n() * w, n() * h, 2, 2);
  g.restore();
}
