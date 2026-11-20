// boli · 彩色玻璃窗 / 东窗之龙
// 铅条把画面切成一块块玻璃：每种颜色是一块多边形，外面一圈黑铅条；
// 龙的躯体是一条连续的玻璃带，背脊上镶金箔尖刺，翅膀是紫玻璃。
// 最后加一层会走路的光，从清晨移到黄昏。
const D = BOARD;

const SPEC = {
  id: 'boli',
  seed: 'av:boli:east-window',
  family: 'board',
  w: 1920,
  h: 1080,
  bg: '#14131a',
  ink: '#0b0b10',
  accent: '#c99a2e',
  board: '#14131a',
  gridBoard: false,
  chalk: false,
  strokes: [],
  washes: [],
  highlights: [],
  label: { zh: '彩色玻璃窗', en: 'Stained Glass', station: '01 · 工艺', ink: '#f2ead8', sub: '#b9ae97' },
};

const G = {
  lead: '#0b0b10',
  stone: '#9aa3ae',
  blue: '#1c4f9c', blueDeep: '#123a78',
  ruby: '#b21033', rubyDeep: '#8c0d28',
  emerald: '#0e6b47', emeraldDeep: '#0a4c33',
  amber: '#e0a12a', violet: '#5a2a86', gold: '#c9962b',
};

const TEXT = [];
const P = D.Pen({ t0: 0.04, w: 5.4, color: G.lead, alpha: 0.95, jitter: 0.7, speed: 1400, gap: 0.04 });
const Ps = D.Pen({ t0: 0.02, w: 11, color: G.stone, alpha: 0.85, jitter: 1.2, speed: 1100, gap: 0.05 });
const Pg = D.Pen({ t0: 0.02, w: 3.2, color: G.gold, alpha: 0.8, jitter: 1, speed: 1600, gap: 0.03 });

const Lx = 612, Rx = 1308, SPR = 430, APEX = 110, BOT = 980;

function arch(x0, x1, spring, apex, seg) {
  const cxm = (x0 + x1) / 2;
  const l1 = D.quad([x0, spring], [x0, spring - (spring - apex) * 0.6], [x0 + (cxm - x0) * 0.55, apex + 24], seg * 2);
  const l2 = D.quad([x0 + (cxm - x0) * 0.55, apex + 24], [cxm - 30, apex], [cxm, apex], 8);
  const r2 = D.quad([cxm, apex], [cxm + 30, apex], [x1 - (x1 - cxm) * 0.55, apex + 24], 8);
  const r1 = D.quad([x1 - (x1 - cxm) * 0.55, apex + 24], [x1, spring - (spring - apex) * 0.6], [x1, spring], seg * 2);
  return l1.concat(l2.slice(1), r2.slice(1), r1.slice(1));
}

function ribbon(pts, ws) {
  const top = [], bot = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
    let dx = q[0] - o[0], dy = q[1] - o[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    top.push([p[0] + nx * ws[i], p[1] + ny * ws[i]]);
    bot.push([p[0] - nx * ws[i], p[1] - ny * ws[i]]);
  }
  return top.concat(bot.reverse());
}

// ---------- 石墙与窗框 ----------
SPEC.washes.push({ pts: D.rect(0, 0, 1920, 1080), color: '#1b1a21', alpha: 1, t0: 0.06 });
Ps.add(D.line([Lx - 52, BOT + 20], [Lx - 52, SPR], 2), { w: 11, dur: 0.26 });
Ps.add(D.line([Rx + 52, BOT + 20], [Rx + 52, SPR], 2), { w: 11, dur: 0.26 });
Ps.add(arch(Lx - 52, Rx + 52, SPR, APEX - 40, 14), { w: 11, dur: 0.6 });
Ps.add(D.line([Lx - 70, BOT + 34], [Rx + 70, BOT + 34], 2), { w: 15, dur: 0.3 });
P.add(D.line([Lx, BOT], [Lx, SPR], 2), { w: 7, dur: 0.2 });
P.add(D.line([Rx, BOT], [Rx, SPR], 2), { w: 7, dur: 0.2 });
P.add(arch(Lx, Rx, SPR, APEX, 14), { w: 7, dur: 0.5 });

// ---------- 窗内暗底 ----------
SPEC.washes.push({ pts: [...D.rect(Lx, SPR, Rx - Lx, BOT - SPR), ...arch(Lx, Rx, SPR, APEX, 10).reverse()],
                   color: '#07070b', alpha: 0.96, t0: 0.12 });

// ---------- 玫瑰窗 ----------
const cx = 960, cy = 296, rr = 168;
SPEC.washes.push({ pts: D.ellipse(cx, cy, rr, rr, 0, Math.PI * 2, 44), color: '#0d0d14', alpha: 0.9, t0: 0.5 });
const roseCols = [G.ruby, G.amber, G.emerald, G.blue, G.violet, G.rubyDeep, G.emeraldDeep, G.blueDeep];
for (let i = 0; i < 12; i++) {
  const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2;
  const a1 = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
  const pts = [[cx, cy]];
  for (let k = 0; k <= 6; k++) {
    const a = a0 + (a1 - a0) * (k / 6);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  SPEC.washes.push({ pts, color: roseCols[i % roseCols.length], alpha: 0.9, t0: 0.7 + i * 0.05 });
  P.add(D.close(pts), { w: 5, alpha: 0.9, dur: 0.14, gap: 0.02 });
}
SPEC.washes.push({ pts: D.ellipse(cx, cy, 62, 62, 0, Math.PI * 2, 30), color: G.amber, alpha: 0.95, t0: 1.5 });
P.add(D.ellipse(cx, cy, 62, 62, 0, Math.PI * 2, 30), { w: 5.4, alpha: 0.95, dur: 0.2 });
P.add(D.ellipse(cx, cy, 92, 92, 0, Math.PI * 2, 34), { w: 3.6, alpha: 0.55, dur: 0.2 });
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2;
  Pg.add(D.arc(cx + Math.cos(a) * 112, cy + Math.sin(a) * 112, 9, 0, Math.PI * 2, 10), { w: 2.4, alpha: 0.55, dur: 0.06, gap: 0.01 });
}

// ---------- 窗身竖条玻璃 ----------
const stripW = (Rx - Lx) / 6, yTop = 496;
for (let i = 0; i < 6; i++) {
  const x0 = Lx + i * stripW, x1 = x0 + stripW;
  const col = [G.blueDeep, G.rubyDeep, G.emeraldDeep, '#3a1a5e', G.blueDeep, G.rubyDeep][i];
  SPEC.washes.push({ pts: D.rect(x0, yTop, stripW, BOT - yTop), color: col, alpha: 0.72, t0: 0.9 + i * 0.05 });
  P.sync(P.at() + 0.02);
  P.add(D.rect(x0, yTop, stripW, BOT - yTop), { w: 5, alpha: 0.9, dur: 0.26 });
}

// ---------- 孔雀 ----------
P.sync(P.at() + 0.06);
const fanC = [960, 966], R0 = 96, R1 = 468, spread = 44 * Math.PI / 180, N = 11;
const fanCols = [G.blueDeep, G.emerald, G.violet, G.ruby, G.blue, G.emeraldDeep,
                 G.blueDeep, G.emerald, G.ruby, G.violet, G.blue];

for (let i = 0; i < N; i++) {
  const a0 = -Math.PI / 2 - spread + (i / N) * spread * 2;
  const a1 = -Math.PI / 2 - spread + ((i + 1) / N) * spread * 2;
  const wedge = [[fanC[0], fanC[1]]];
  for (let k = 0; k <= 5; k++) {
    const a = a0 + (a1 - a0) * (k / 5);
    wedge.push([fanC[0] + Math.cos(a) * R1, fanC[1] + Math.sin(a) * R1]);
  }
  SPEC.washes.push({ pts: wedge, color: fanCols[i % fanCols.length], alpha: 0.95, t0: 0.9 + i * 0.08 });
  P.add(D.close(wedge), { w: 5, alpha: 0.9, dur: 0.34, gap: 0.03 });

  // 羽尖的眼斑
  const am = (a0 + a1) / 2, rot = am + Math.PI / 2;
  const ex = fanC[0] + Math.cos(am) * (R1 - 46), ey = fanC[1] + Math.sin(am) * (R1 - 46);
  const rings = [[40, 50, G.amber], [30, 38, G.emeraldDeep], [19, 25, G.blue], [9, 12, G.ruby]];
  for (let k = 0; k < rings.length; k++) {
    const r = rings[k];
    SPEC.washes.push({ pts: D.ellipse(ex, ey, r[0], r[1], 0, Math.PI * 2, 18, rot),
                       color: r[2], alpha: 0.96, t0: 2.0 + i * 0.06 + k * 0.05 });
    P.add(D.ellipse(ex, ey, r[0], r[1], 0, Math.PI * 2, 18, rot), { w: k === 0 ? 4 : 2.6, alpha: 0.85, dur: 0.12, gap: 0.02 });
  }
  Pg.add(D.ellipse(ex, ey, 5, 7, 0, Math.PI * 2, 10, rot), { w: 2.4, color: G.gold, alpha: 0.9, dur: 0.05 });
}
Pg.add(D.arc(fanC[0], fanC[1], R1 + 8, -Math.PI / 2 - spread, -Math.PI / 2 + spread, 40), { w: 4, alpha: 0.55, dur: 0.5 });

// 身体
P.sync(P.at() + 0.05);
function teardrop(cx, cy, rx, ry, n) {
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = 1 + 0.16 * Math.sin(a / 2);
    pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * (a < Math.PI ? 1 : 0.86)]);
  }
  return pts;
}
SPEC.washes.push({ pts: teardrop(962, 892, 78, 116, 30), color: G.emerald, alpha: 0.96, t0: 3.4 });
P.add(D.close(teardrop(962, 892, 78, 116, 30)), { w: 5.2, alpha: 0.92, dur: 0.32 });
for (let i = 0; i < 3; i++) {
  P.add(D.close([[906 + i * 34, 946], [916 + i * 34, 962], [936 + i * 34, 964], [942 + i * 34, 948]]),
        { w: 2.2, color: G.gold, alpha: 0.45, dur: 0.07, gap: 0.03 });
}
// 颈
const neckPts = ribbon([[958, 812], [944, 748], [920, 706]], [34, 28, 21]);
SPEC.washes.push({ pts: neckPts, color: G.blue, alpha: 0.94, t0: 3.9 });
P.add(D.close(neckPts), { w: 4.8, alpha: 0.9, dur: 0.3 });
// 头
SPEC.washes.push({ pts: D.ellipse(908, 672, 40, 42, 0, Math.PI * 2, 24), color: G.blueDeep, alpha: 0.96, t0: 4.4 });
P.add(D.ellipse(908, 672, 40, 42, 0, Math.PI * 2, 24), { w: 4.8, alpha: 0.9, dur: 0.24 });
// 冠羽：三根金翎
for (let i = 0; i < 3; i++) {
  const ang = -1.9 + i * 0.28;
  P.add(D.chain([[902 + i * 8, 642], [902 + i * 8 + Math.cos(ang) * 10, 596], [902 + i * 8 + Math.cos(ang) * 16, 572]]), { w: 3, color: G.gold, alpha: 0.85, dur: 0.16, gap: 0.04 });
  Pg.add(D.arc(902 + i * 8 + Math.cos(ang) * 17, 570, 7, 0, Math.PI * 2, 10), { w: 2.2, color: G.gold, alpha: 0.9, dur: 0.06 });
}
// 喙
P.add(D.close([[876, 664], [840, 678], [876, 690]]), { w: 3.8, color: G.gold, alpha: 0.92, dur: 0.12 });
SPEC.washes.push({ pts: [[876, 666], [842, 678], [876, 688]], color: G.amber, alpha: 0.92, t0: 4.8 });
// 眼
SPEC.washes.push({ pts: D.ellipse(926, 660, 11, 11, 0, Math.PI * 2, 12), color: '#f2ead8', alpha: 0.92, t0: 5.0 });
P.add(D.ellipse(926, 660, 11, 11, 0, Math.PI * 2, 12), { w: 2.4, alpha: 0.8, dur: 0.06 });
SPEC.washes.push({ pts: D.ellipse(928, 661, 5, 5, 0, Math.PI * 2, 10), color: '#0b0b10', alpha: 0.95, t0: 5.1 });


// ---------- 铅条与铭文 ----------
P.sync(P.at() + 0.04);
for (let i = 1; i < 6; i++) {
  P.add(D.line([Lx + i * stripW, yTop], [Lx + i * stripW, BOT], 2), { w: 4.6, alpha: 0.65, dur: 0.18 });
}
P.add(D.line([Lx, yTop], [Rx, yTop], 2), { w: 5, alpha: 0.8, dur: 0.26 });

TEXT.push({ str: 'PAVO  ·  LUX', x: 700, y: 1052, size: 42, family: '"mk"', color: G.gold,
            t0: 6.6, dur: 0.8, step: 0.07 });
TEXT.push({ str: 'stained glass · 孔雀窗', x: 1150, y: 1054, size: 30, family: '"zhi"', color: '#8c8371',
            t0: 7.3, dur: 0.7, step: 0.05 });

const bundle = { strokes: P.strokes.concat(Ps.strokes, Pg.strokes), texts: TEXT, washes: SPEC.washes };
D.fit(bundle, 0.04, 8.5);
SPEC.strokes = bundle.strokes;
SPEC.texts = bundle.texts;

const canvas = document.getElementById('c');
const ENV = STYLEKIT.page(canvas, { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });

function sunbeam(t) {
  const ctx = ENV.ctx, W = ENV.W, H = ENV.H;
  const k = STYLEKIT.clamp(t / 9.4);
  const x = 470 + k * 980;
  const c = k < 0.35 ? [255, 198, 120] : k < 0.7 ? [255, 224, 168] : [255, 150, 104];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, 690, 40, x, 690, 780);
  g.addColorStop(0, 'rgba(' + c.join(',') + ',0.34)');
  g.addColorStop(0.45, 'rgba(' + c.join(',') + ',0.11)');
  g.addColorStop(1, 'rgba(' + c.join(',') + ',0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const lg = ctx.createLinearGradient(0, 990, 0, 1080);
  lg.addColorStop(0, 'rgba(255,210,150,0.20)');
  lg.addColorStop(1, 'rgba(255,210,150,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 990, W, 90);
  ctx.restore();
}

function plate(t) {
  const Lb = SPEC.label;
  const k = STYLEKIT.ease(STYLEKIT.clamp((t - 0.15) / 0.8));
  if (k <= 0) return;
  const ctx = ENV.ctx, W = ENV.W, H = ENV.H;
  const m = Math.round(Math.min(W, H) * 0.035);
  ctx.save();
  ctx.globalAlpha = 0.92 * k;
  const panelW = Math.round(Math.min(W, H) * 0.40);
  const panelH = Math.round(Math.min(W, H) * 0.145);
  ctx.fillStyle = 'rgba(12,12,16,0.74)';
  ctx.fillRect(m - 14, H - m - panelH, panelW, panelH);
  ctx.strokeStyle = SPEC.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m - 14, H - m - panelH);
  ctx.lineTo(m - 14 + panelW * k, H - m - panelH);
  ctx.stroke();
  STYLEKIT.type(ENV, Lb.station, { x: m, y: H - m - panelH + Math.round(panelH * 0.22),
                                  size: Math.round(Math.min(W, H) * 0.016), color: Lb.sub, weight: 500, letter: 2 });
  STYLEKIT.type(ENV, Lb.zh, { x: m, y: H - m - panelH + Math.round(panelH * 0.66),
                             size: Math.round(Math.min(W, H) * 0.044), color: Lb.ink, weight: 800 });
  STYLEKIT.type(ENV, Lb.en, { x: m, y: H - m - panelH + Math.round(panelH * 0.92),
                             size: Math.round(Math.min(W, H) * 0.016), color: Lb.sub, weight: 500, letter: 2 });
  ctx.restore();
}

window.renderAt = (t) => {
  STYLEKIT.scene(ENV, SPEC, t);
  sunbeam(t);
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
