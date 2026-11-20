// labi2 · 蜡笔立体世界 / 一朵花上的蝴蝶
// 蜡笔的粗细与错位是这支管线的招牌：每条轮廓画两遍（主线 + 微错位的浅色），
// 色块外面再压一层斜排线，纸面就毛起来了。立体感交给等轴方块与地面。
const D = BOARD;

const SPEC = {
  id: 'labi2',
  seed: 'av:labi2:butterfly',
  family: 'board',
  w: 1920,
  h: 1080,
  bg: '#fdf7e9',
  ink: '#33302a',
  accent: '#e2703a',
  board: '#fdf7e9',
  gridBoard: false,
  chalk: false,
  strokes: [],
  washes: [],
  highlights: [],
  label: {
    zh: '蜡笔立体世界',
    en: 'Crayon World 3D',
    station: '07 · 立体手绘',
    ink: '#22201c',
    sub: '#5a544a',
  },
};

const COL = {
  ink: '#33302a',
  grass: '#7bb661',
  grassDeep: '#4d8f43',
  grassLight: '#a8cd7a',
  coral: '#e2703a',
  coralLight: '#f0a074',
  amber: '#f2b544',
  blue: '#4a86a8',
};

const TEXT = [];
const P = D.Pen({ t0: 0.04, w: 9, color: COL.ink, alpha: 0.9, jitter: 2.4, speed: 820, gap: 0.06 });
const Pw = D.Pen({ t0: 0, w: 10, color: '#8a8272', alpha: 0.3, jitter: 3, speed: 820, gap: 0.06 });
const Ph = D.Pen({ t0: 0, w: 5, color: COL.grassDeep, alpha: 0.3, jitter: 2, speed: 1500, gap: 0.02 });

function cry(pts, opts) {
  const t = P.at();
  P.add(pts, opts || {});
  Pw.add(D.offset(pts, 3.2, -3.4), { w: 8, alpha: 0.22, dur: (opts && opts.dur) || 0.4, gap: 0.02, t0: t });
}

// ---------- 地面（等轴的两条草带） ----------
cry(D.chain([[20, 828], [520, 902], [1520, 902], [1900, 820]]), { w: 9, alpha: 0.9, dur: 0.55 });
cry(D.chain([[20, 980], [520, 902], [1520, 902], [1900, 980]]), { w: 7, alpha: 0.85, dur: 0.5 });
P.sync(P.at() + 0.04);
P.add(D.wave(60, 1880, 952, 6, 9, 90, 0), { w: 3.4, alpha: 0.35, dur: 0.3, gap: 0.02 });

// ---------- 等轴草垛（立体块） ----------
function cube(cx, cy, s, h) {
  const top = [[cx, cy - s * 0.5], [cx + s, cy], [cx, cy + s * 0.5], [cx - s, cy], [cx, cy - s * 0.5]];
  P.sync(P.at() + 0.03);
  P.add(top, { w: 8, alpha: 0.9, dur: 0.34 });
  P.add(D.line([cx, cy + s * 0.5], [cx, cy + s * 0.5 + h], 2), { w: 4, alpha: 0.6, dur: 0.08 });
  P.add(D.line([cx - s, cy], [cx - s, cy + h], 2), { w: 4, alpha: 0.6, dur: 0.08 });
  P.add(D.line([cx + s, cy], [cx + s, cy + h], 2), { w: 4, alpha: 0.6, dur: 0.08 });
  P.add(D.chain([[cx - s, cy + h], [cx, cy + s * 0.5 + h], [cx + s, cy + h]]), { w: 5.4, alpha: 0.75, dur: 0.22 });
  P.add(D.line([cx, cy - s * 0.5], [cx - s, cy + h], 2), { w: 4, alpha: 0.5, dur: 0.1 });
  P.add(D.line([cx, cy - s * 0.5], [cx + s, cy + h], 2), { w: 4, alpha: 0.5, dur: 0.1 });
}
cube(230, 830, 118, 96);
cube(432, 808, 92, 74);
SPEC.washes.push({ pts: [[230, 889], [348, 830], [230, 771], [112, 830]], color: COL.grassLight, alpha: 0.85, t0: 0.9 });
SPEC.washes.push({ pts: [[230, 889], [348, 830], [348, 926], [230, 985]], color: COL.grass, alpha: 0.9, t0: 0.95 });
SPEC.washes.push({ pts: [[230, 889], [112, 830], [112, 926], [230, 985]], color: COL.grassDeep, alpha: 0.55, t0: 1.0 });
SPEC.washes.push({ pts: [[432, 854], [524, 808], [432, 762], [340, 808]], color: COL.grassLight, alpha: 0.8, t0: 1.15 });
SPEC.washes.push({ pts: [[432, 854], [524, 808], [524, 882], [432, 928]], color: COL.grass, alpha: 0.85, t0: 1.2 });

// ---------- 花 ----------
const fx = 812, fy = 500;
P.sync(P.at() + 0.05);
P.add(D.quad([fx, 986], [fx + 26, 800], [fx + 4, 640], 18), { w: 8, alpha: 0.85, dur: 0.5 });
cry(D.chain([[fx + 12, 838], [fx - 78, 776], [fx - 128, 700]]), { w: 7, alpha: 0.8, dur: 0.36 });
cry(D.chain([[fx + 16, 900], [fx + 108, 852], [fx + 156, 776]]), { w: 7, alpha: 0.8, dur: 0.36 });
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
  const px = fx + Math.cos(a) * 118, py = fy + Math.sin(a) * 96;
  cry(D.ellipse(px, py, 78, 58, 0, Math.PI * 2, 26, a), { w: 6.4, alpha: 0.8, dur: 0.3 });
  SPEC.washes.push({ pts: D.ellipse(px, py, 78, 58, 0, Math.PI * 2, 26, a),
                     color: i % 2 ? COL.coralLight : COL.coral, alpha: 0.82, t0: 1.5 + i * 0.08 });
}
cry(D.ellipse(fx, fy, 54, 54, 0, Math.PI * 2, 28), { w: 7, alpha: 0.85, dur: 0.34 });
SPEC.washes.push({ pts: D.ellipse(fx, fy, 54, 54, 0, Math.PI * 2, 28), color: COL.amber, alpha: 0.95, t0: 2.2 });
for (let i = 0; i < 9; i++) {
  const a = i * 2.4, r = 12 + (i % 3) * 10;
  P.add(D.arc(fx + Math.cos(a) * r, fy + Math.sin(a) * r, 4.5, 0, Math.PI * 2, 8), { w: 3, alpha: 0.7, dur: 0.08, gap: 0.02 });
}

// ---------- 蝴蝶 ----------
const bx = 1372, by = 430;
P.sync(P.at() + 0.12);
cry(D.ellipse(bx - 120, by - 62, 92, 80, 0, Math.PI * 2, 26, -0.44), { w: 7, alpha: 0.85, dur: 0.4 });
cry(D.ellipse(bx + 120, by - 62, 92, 80, 0, Math.PI * 2, 26, 0.44), { w: 7, alpha: 0.85, dur: 0.4 });
cry(D.ellipse(bx - 98, by + 64, 62, 48, 0, Math.PI * 2, 22, 0.38), { w: 6.4, alpha: 0.8, dur: 0.32 });
cry(D.ellipse(bx + 98, by + 64, 62, 48, 0, Math.PI * 2, 22, -0.38), { w: 6.4, alpha: 0.8, dur: 0.32 });
P.add(D.quad([bx, by - 44], [bx - 9, by + 20], [bx, by + 92], 10), { w: 8, alpha: 0.92, dur: 0.24 });
P.add(D.chain([[bx - 2, by - 46], [bx - 18, by - 96], [bx - 38, by - 118]]), { w: 4, alpha: 0.8, dur: 0.18 });
P.add(D.chain([[bx + 2, by - 46], [bx + 18, by - 96], [bx + 38, by - 118]]), { w: 4, alpha: 0.8, dur: 0.18 });
P.add(D.arc(bx - 40, by - 122, 6, 0, Math.PI * 2, 10), { w: 3.4, alpha: 0.8, dur: 0.1 });
P.add(D.arc(bx + 40, by - 122, 6, 0, Math.PI * 2, 10), { w: 3.4, alpha: 0.8, dur: 0.1 });
for (let i = 0; i < 4; i++) {
  P.add(D.arc(bx - 110 + i * 6, by - 58 + i * 26, 12, 0, Math.PI * 2, 12), { w: 3.6, alpha: 0.65, dur: 0.1, gap: 0.02 });
  P.add(D.arc(bx + 110 - i * 6, by - 58 + i * 26, 12, 0, Math.PI * 2, 12), { w: 3.6, alpha: 0.65, dur: 0.1, gap: 0.02 });
}
SPEC.washes.push({ pts: D.ellipse(bx - 120, by - 62, 92, 80, 0, Math.PI * 2, 26, -0.44), color: COL.coral, alpha: 0.85, t0: 2.6 });
SPEC.washes.push({ pts: D.ellipse(bx + 120, by - 62, 92, 80, 0, Math.PI * 2, 26, 0.44), color: COL.coral, alpha: 0.85, t0: 2.6 });
SPEC.washes.push({ pts: D.ellipse(bx - 98, by + 64, 62, 48, 0, Math.PI * 2, 22, 0.38), color: COL.amber, alpha: 0.8, t0: 2.85 });
SPEC.washes.push({ pts: D.ellipse(bx + 98, by + 64, 62, 48, 0, Math.PI * 2, 22, -0.38), color: COL.amber, alpha: 0.8, t0: 2.85 });
SPEC.washes.push({ pts: D.ellipse(bx, by + 18, 13, 54, 0, Math.PI * 2, 16), color: COL.blue, alpha: 0.9, t0: 3.0 });

// ---------- 太阳 ----------
P.sync(P.at() + 0.04);
P.add(D.ellipse(1738, 176, 84, 84, 0, Math.PI * 2, 30), { w: 7, alpha: 0.8, dur: 0.36 });
for (let i = 0; i < 9; i++) {
  const a = i * (Math.PI * 2 / 9);
  P.add(D.line([1738 + Math.cos(a) * 112, 176 + Math.sin(a) * 112],
               [1738 + Math.cos(a) * 158, 176 + Math.sin(a) * 158], 2), { w: 5, alpha: 0.55, dur: 0.1, gap: 0.02 });
}
SPEC.washes.push({ pts: D.ellipse(1738, 176, 84, 84, 0, Math.PI * 2, 30), color: COL.amber, alpha: 0.9, t0: 3.2 });

// ---------- 草叶 ----------
for (let i = 0; i < 12; i++) {
  const x = 80 + i * 150 + (i % 3) * 20;
  const y = 906 + (i % 2) * 14;
  P.add(D.chain([[x, y], [x + 8, y - 46], [x + 26, y - 78]]), { w: 4.4, color: COL.grassDeep, alpha: 0.5, dur: 0.14, gap: 0.02 });
  P.add(D.chain([[x + 18, y], [x + 30, y - 40], [x + 48, y - 66]]), { w: 4, color: COL.grassDeep, alpha: 0.45, dur: 0.12, gap: 0.02 });
}
SPEC.washes.push({ pts: D.chain([[20, 980], [520, 902], [1520, 902], [1900, 980], [1900, 1080], [20, 1080]]),
                   color: COL.grass, alpha: 0.55, t0: 0.4 });
SPEC.washes.push({ pts: [[20, 828], [520, 902], [1520, 902], [1900, 820], [1900, 902], [1520, 902], [520, 902], [20, 902]],
                   color: COL.grassLight, alpha: 0.5, t0: 0.5 });

// ---------- 蜡笔排线（纸面毛感） ----------
P.sync(P.at() + 0.05);
for (let i = 0; i < 14; i++) {
  const x = 60 + i * 132, y = 940 + (i % 4) * 26;
  Ph.add(D.line([x, y], [x + 46, y + 26], 2), { w: 3.4, alpha: 0.22, dur: 0.08, gap: 0.01 });
}
for (let i = 0; i < 6; i++) {
  Ph.add(D.line([bx - 160 + i * 62, by - 96], [bx - 140 + i * 62, by - 40], 2), { w: 3, alpha: 0.2, dur: 0.06, gap: 0.01 });
}

// ---------- 字 ----------
TEXT.push({ str: 'THE BUTTERFLY', x: 1010, y: 992, size: 64, family: '"cavb"', color: COL.ink,
            bg: 'rgba(253,247,233,0.94)', t0: 6.0, dur: 0.9, step: 0.075, jitter: 1.8 });


const bundle = { strokes: P.strokes.concat(Pw.strokes, Ph.strokes), texts: TEXT, washes: SPEC.washes };
D.fit(bundle, 0.04, 8.6);
SPEC.strokes = bundle.strokes;
SPEC.texts = bundle.texts;

const canvas = document.getElementById('c');
const ENV = STYLEKIT.page(canvas, { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });

function plate(t) {
  const L = SPEC.label;
  const k = STYLEKIT.ease(STYLEKIT.clamp((t - 0.15) / 0.8));
  if (k <= 0) return;
  const ctx = ENV.ctx, W = ENV.W, H = ENV.H;
  const m = Math.round(Math.min(W, H) * 0.035);
  ctx.save();
  ctx.globalAlpha = 0.92 * k;
  const panelW = Math.round(Math.min(W, H) * 0.40);
  const panelH = Math.round(Math.min(W, H) * 0.145);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(m - 14, H - m - panelH, panelW, panelH);
  ctx.strokeStyle = SPEC.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m - 14, H - m - panelH);
  ctx.lineTo(m - 14 + panelW * k, H - m - panelH);
  ctx.stroke();
  STYLEKIT.type(ENV, L.station, { x: m, y: H - m - panelH + Math.round(panelH * 0.22),
                                 size: Math.round(Math.min(W, H) * 0.016), color: L.sub, weight: 500, letter: 2 });
  STYLEKIT.type(ENV, L.zh, { x: m, y: H - m - panelH + Math.round(panelH * 0.66),
                            size: Math.round(Math.min(W, H) * 0.044), color: L.ink, weight: 800 });
  STYLEKIT.type(ENV, L.en, { x: m, y: H - m - panelH + Math.round(panelH * 0.92),
                            size: Math.round(Math.min(W, H) * 0.016), color: L.sub, weight: 500, letter: 2 });
  ctx.restore();
}

window.renderAt = (t) => {
  STYLEKIT.scene(ENV, SPEC, t);
  BOARD.drawText(ENV.ctx, SPEC.texts, t);
  plate(t);
};

STYLEKIT.scene(ENV, SPEC, 0);
plate(0);
const FAM = ['mk', 'cav', 'cavb', 'zhi', 'msz'];
Promise.all(FAM.map((f) => (document.fonts ? document.fonts.load('16px "' + f + '"') : Promise.resolve())))
  .then(() => (document.fonts ? document.fonts.ready : Promise.resolve()))
  .then(() => {
    window.renderAt(0);
    window.__ready = true;
  });

