const R = { paper: '#f4f2ed', ink: '#141414', red: '#e2372c', mid: '#6d6a63' };
const SANS = '"Arial Black", Arial, "Helvetica Neue", sans-serif';
const MONO = 'ui-monospace, "Consolas", monospace';

let W = 1080, H = 1920, tex = null;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = p => 1 - Math.pow(1 - clamp(p), 3);
const span = (t, a, b) => ease((t - a) / (b - a));

function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function makePaper(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = R.paper;
  g.fillRect(0, 0, w, h);
  const r = rnd(2207);
  for (let i = 0; i < 4200; i++) {
    g.fillStyle = r() > .5 ? 'rgba(90,86,78,.07)' : 'rgba(255,255,250,.10)';
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  return c;
}

export function init(w, h) { W = w; H = h; tex = makePaper(w, h); }

function txt(g, s, x, y, size, color, weight = 400, spacing = 0, align = 'left', font = SANS) {
  g.save();
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = align;
  g.textBaseline = 'alphabetic';
  if (spacing) g.letterSpacing = spacing + 'px';
  g.fillText(s, x, y);
  g.restore();
}

function rule(g, x, y, w, h = 3, color = R.ink) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

export function paint(g, t, w, h) {
  W = w; H = h;
  t = t + 0.20;   // first frame already carries a stroke
  if (!tex || tex.width !== w) tex = makePaper(w, h);
  g.drawImage(tex, 0, 0);

  // top label
  const p0 = span(t, 0.04, 0.3);
  g.save(); g.globalAlpha = p0;
  txt(g, 'EP–26 / RANGE', 78, 200, 20, R.mid, 700, 5, 'left', MONO);
  txt(g, 'REAL DAY', 1002, 200, 20, R.mid, 700, 5, 'right', MONO);
  g.restore();

  // 120 block
  const p1 = span(t, 0.16, 0.55);
  if (p1 > 0) {
    g.save();
    g.globalAlpha = p1;
    txt(g, '120', 78, 500 + 26 * (1 - p1), 210, R.ink, 900, -4);
    g.restore();
  }
  const p2 = span(t, 0.42, 0.66);
  if (p2 > 0) {
    g.save(); g.globalAlpha = p2;
    txt(g, 'THE PAPER NUMBER', 84, 552, 24, R.mid, 700, 4, 'left', MONO);
    g.restore();
  }

  // strike-through, grows left to right, two pencil-ish passes
  const p3 = span(t, 0.66, 1.12);
  if (p3 > 0) {
    const x1 = 72, x2 = 512;
    const xe = x1 + (x2 - x1) * clamp(p3);
    g.save();
    g.strokeStyle = R.red;
    g.lineWidth = 9;
    g.lineCap = 'butt';
    g.beginPath();
    g.moveTo(x1, 452);
    g.lineTo(xe, 404);
    g.stroke();
    if (p3 > 0.55) {
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x1 + 18, 468);
      g.lineTo(x1 + 18 + (xe - x1) * 0.94, 420);
      g.stroke();
    }
    g.restore();
  }

  // divider
  const p4 = span(t, 1.06, 1.34);
  if (p4 > 0) rule(g, 78, 640, 924 * p4, 3);

  // 70-85 block
  const p5 = span(t, 1.3, 1.75);
  if (p5 > 0) {
    g.save();
    g.globalAlpha = clamp(p5);
    // red block behind the new number
    g.fillStyle = R.red;
    g.fillRect(64, 704, 18, 250);
    txt(g, '70', 96, 944 + 30 * (1 - p5), 200, R.ink, 900, -4);
    txt(g, '–', 384, 944 + 30 * (1 - p5), 150, R.mid, 900, 0);
    txt(g, '85', 470, 944 + 30 * (1 - p5), 200, R.ink, 900, -4);
    g.restore();
  }
  const p6 = span(t, 1.66, 1.94);
  if (p6 > 0) {
    g.save(); g.globalAlpha = p6;
    txt(g, 'A REAL SUZHOU DAY', 84, 1006, 26, R.red, 700, 4, 'left', MONO);
    g.restore();
  }

  // why list
  const p7 = span(t, 2.0, 2.4);
  if (p7 > 0) {
    g.save(); g.globalAlpha = clamp(p7);
    rule(g, 78, 1104, 924 * clamp(p7), 1.5, R.mid);
    const items = ['STOP & GO', 'GRADE', 'LOAD + TYRE', 'TEMPERATURE'];
    items.forEach((s, i) => {
      const q = span(t, 2.02 + i * 0.10, 2.24 + i * 0.10);
      g.globalAlpha = clamp(q);
      txt(g, s, 78, 1172 + i * 58, 26, R.ink, 700, 3, 'left', MONO);
      txt(g, '−', 1002, 1172 + i * 58, 26, R.red, 700, 0, 'right', MONO);
    });
    g.restore();
  }

  // bottom statement
  const p8 = span(t, 2.4, 2.72);
  if (p8 > 0) {
    g.save(); g.globalAlpha = clamp(p8);
    txt(g, 'THE NUMBER IS A TEST RESULT.', 78, 1434, 30, R.ink, 700, 2);
    txt(g, 'YOUR ROUTE IS THE REAL ONE.', 78, 1482, 30, R.red, 700, 2);
    g.restore();
  }

  // grain
  g.save();
  g.globalAlpha = 0.04;
  const n = rnd(1909 + Math.floor(t * 30));
  g.fillStyle = '#000';
  for (let i = 0; i < 40; i++) g.fillRect(n() * w, n() * h, 2, 2);
  g.restore();
}
