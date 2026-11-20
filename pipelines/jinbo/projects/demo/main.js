// jinbo · 金箔彩绘 / 泥金抄本
// 一整页羊皮纸：边框贴金箔，四角嵌涡卷藤蔓；
// 左上是一枚描金的蓝色首字母，右边圆形小像里是山上的修道院，窗口亮着灯。
// 落笔顺序就是抄经人的顺序：纸、金、蓝、红、最后一点光。
const D = BOARD;

const SPEC = {
  id: 'jinbo',
  seed: 'av:jinbo:illuminated-leaf',
  family: 'board',
  w: 1920,
  h: 1080,
  bg: '#241c12',
  ink: '#3a2a14',
  accent: '#c8973a',
  board: '#241c12',
  gridBoard: false,
  chalk: false,
  strokes: [],
  washes: [],
  highlights: [],
  label: { zh: '金箔彩绘', en: 'Gilded Illumination', station: '03 · 工艺', ink: '#f6ecd2', sub: '#cbb894' },
};

const G = {
  parch: '#e8d9b6', parchLight: '#f2e6c9', parchDark: '#d6c39c',
  goldA: '#c49a3c', goldB: '#d9b45e', goldC: '#ac7f26', goldD: '#e6c884',
  blue: '#1c3f8c', blueDeep: '#142b63', red: '#a4232a', green: '#2e5e3a', ink: '#3a2a14',
};

const TEXT = [];
const P = D.Pen({ t0: 0.04, w: 4.4, color: G.ink, alpha: 0.9, jitter: 0.8, speed: 1500, gap: 0.04 });
const Pg = D.Pen({ t0: 0.02, w: 5.2, color: G.goldA, alpha: 0.95, jitter: 0.9, speed: 1400, gap: 0.04 });
const Pb = D.Pen({ t0: 0.02, w: 4.6, color: G.blue, alpha: 0.9, jitter: 0.8, speed: 1400, gap: 0.04 });
const Pr = D.Pen({ t0: 0.02, w: 4.2, color: G.red, alpha: 0.85, jitter: 0.9, speed: 1500, gap: 0.04 });

const PX0 = 96, PY0 = 62, PX1 = 1824, PY1 = 1018;

// ---------- 羊皮纸 ----------
SPEC.washes.push({ pts: D.rect(0, 0, 1920, 1080), color: '#1d1710', alpha: 1, t0: 0.05 });
SPEC.washes.push({ pts: D.roundRect(PX0 + 14, PY0 + 18, PX1 - PX0, PY1 - PY0, 18), color: '#0f0b07', alpha: 0.55, t0: 0.04 });
SPEC.washes.push({ pts: D.roundRect(PX0, PY0, PX1 - PX0, PY1 - PY0, 14), color: G.parch, alpha: 1, t0: 0.06 });
for (let i = 0; i < 26; i++) {
  const y = PY0 + 30 + i * 37;
  P.sync(P.at() + 0.02);
  P.add(D.line([PX0 + 26, y, PX1 - 26, y + (i % 3 - 1) * 6], 2), { w: 1.2, color: '#c9b389', alpha: 0.35, dur: 0.24, gap: 0.02 });
}

// ---------- 金箔边框 ----------
const BX0 = PX0 + 46, BY0 = PY0 + 46, BX1 = PX1 - 46, BY1 = PY1 - 46;
const cell = 74;
const goldTones = [G.goldA, G.goldB, G.goldC, G.goldD];
let gi = 0;
function leafSquare(x, y, w, h, t) {
  const tone = goldTones[gi++ % 4];
  SPEC.washes.push({ pts: D.roundRect(x + 1, y + 1, w - 2, h - 2, 3), color: tone, alpha: 0.95, t0: t });
}
for (let x = BX0; x < BX1; x += cell) {
  leafSquare(x, BY0, Math.min(cell, BX1 - x), 58, 0.4 + (x - BX0) / BX1 * 0.5);
  leafSquare(x, BY1 - 58, Math.min(cell, BX1 - x), 58, 0.6 + (x - BX0) / BX1 * 0.5);
}
for (let y = BY0 + 58; y < BY1 - 58; y += cell) {
  leafSquare(BX0, y, 58, Math.min(cell, BY1 - 58 - y), 0.5 + (y - BY0) / BY1 * 0.5);
  leafSquare(BX1 - 58, y, 58, Math.min(cell, BY1 - 58 - y), 0.5 + (y - BY0) / BY1 * 0.5);
}
Pg.add(D.roundRect(BX0 + 58, BY0 + 58, BX1 - BX0 - 116, BY1 - BY0 - 116, 6), { w: 4.4, alpha: 0.95, dur: 0.5 });
Pg.add(D.roundRect(BX0 + 2, BY0 + 2, BX1 - BX0 - 4, BY1 - BY0 - 4, 8), { w: 3.4, alpha: 0.6, dur: 0.5 });

// ---------- 内页 ----------
const IX0 = BX0 + 74, IY0 = BY0 + 74, IX1 = BX1 - 74, IY1 = BY1 - 74;
SPEC.washes.push({ pts: D.rect(IX0, IY0, IX1 - IX0, IY1 - IY0), color: G.parchLight, alpha: 0.96, t0: 0.9 });

// ---------- 蓝色首字母方框 ----------
const SQ = [IX0 + 26, IY0 + 22, 400, 470];
SPEC.washes.push({ pts: D.rect(SQ[0], SQ[1], SQ[2], SQ[3]), color: G.blue, alpha: 0.95, t0: 1.0 });
Pb.add(D.rect(SQ[0], SQ[1], SQ[2], SQ[3]), { w: 5, alpha: 0.9, dur: 0.4 });
Pg.add(D.rect(SQ[0] + 12, SQ[1] + 12, SQ[2] - 24, SQ[3] - 24), { w: 4, alpha: 0.9, dur: 0.44 });
for (const c of [[SQ[0] + 12, SQ[1] + 12], [SQ[0] + SQ[2] - 12, SQ[1] + 12], [SQ[0] + 12, SQ[1] + SQ[3] - 12], [SQ[0] + SQ[2] - 12, SQ[1] + SQ[3] - 12]]) {
  Pg.add(D.close([[c[0], c[1] - 16], [c[0] + 16, c[1]], [c[0], c[1] + 16], [c[0] - 16, c[1]]]), { w: 3, alpha: 0.85, dur: 0.16, gap: 0.05 });
}
for (let i = 0; i < 4; i++) {
  const y = SQ[1] + 60 + i * 105;
  Pr.add(D.chain([[SQ[0] + 40, y], [SQ[0] + 90, y - 34], [SQ[0] + 140, y], [SQ[0] + 186, y - 22]]), { w: 3.4, alpha: 0.8, dur: 0.26, gap: 0.04 });
}

// ---------- 金色首字母 L ----------
TEXT.push({ str: 'L', x: SQ[0] + 96, y: SQ[1] + 348, size: 300, family: '"msz"', color: G.goldD,
            t0: 2.2, dur: 0.9, step: 0.3 });
TEXT.push({ str: 'UX', x: SQ[0] + 246, y: SQ[1] + 342, size: 108, family: '"msz"', color: G.goldB,
            t0: 3.0, dur: 0.6, step: 0.2 });
Pg.add(D.line([SQ[0] + 44, SQ[1] + 372, SQ[0] + SQ[2] - 44, SQ[1] + 372], 2), { w: 3.2, alpha: 0.75, dur: 0.3 });
TEXT.push({ str: 'INCIPIT  ·  LIBER', x: SQ[0] + 52, y: SQ[1] + 428, size: 26, family: '"cavb"', color: G.goldD,
            t0: 3.6, dur: 0.6, step: 0.06 });

// ---------- 圆形小像 ----------
const cx = IX0 + 900, cy = IY0 + 250, R = 236;
SPEC.washes.push({ pts: D.ellipse(cx, cy, R + 22, R + 22, 0, Math.PI * 2, 60), color: G.goldA, alpha: 0.95, t0: 1.5 });
SPEC.washes.push({ pts: D.ellipse(cx, cy, R + 10, R + 10, 0, Math.PI * 2, 60), color: G.goldD, alpha: 0.9, t0: 1.7 });
SPEC.washes.push({ pts: D.ellipse(cx, cy, R, R, 0, Math.PI * 2, 60), color: G.blueDeep, alpha: 1, t0: 1.9 });
Pb.add(D.ellipse(cx, cy, R, R, 0, Math.PI * 2, 60), { w: 3.4, alpha: 0.7, dur: 0.3 });
for (let i = 0; i < 14; i++) {
  const a = (i / 14) * Math.PI * 2 + 0.4, rr = R * (0.42 + 0.3 * ((i * 7) % 10) / 10);
  const sx = cx + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr * 0.75 - 40;
  Pg.add(D.close([[sx, sy - 9], [sx + 4, sy - 3], [sx + 9, sy], [sx + 4, sy + 3], [sx, sy + 9], [sx - 4, sy + 3], [sx - 9, sy], [sx - 4, sy - 3]]),
         { w: 2, color: G.goldD, alpha: 0.85, dur: 0.1, gap: 0.03 });
}
const hillPts = [[cx - 181, cy + 150], [cx - 150, cy - 6], [cx - 40, cy + 40], [cx + 70, cy - 40],
                 [cx + 150, cy + 30], [cx + 181, cy + 150]];
for (let k = 0; k <= 10; k++) {
  const a = 0.26 * Math.PI + (0.74 - 0.26) * Math.PI * (k / 10);
  hillPts.push([cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6)]);
}
SPEC.washes.push({ pts: hillPts, color: G.green, alpha: 0.95, t0: 2.1 });
P.add(D.chain([[cx - 178, cy + 148], [cx - 150, cy - 6], [cx - 40, cy + 40], [cx + 30, cy + 10]]), { w: 3.6, alpha: 0.8, dur: 0.26 });
P.add(D.chain([[cx + 30, cy + 10], [cx + 70, cy - 40], [cx + 150, cy + 30], [cx + 178, cy + 148]]), { w: 3.6, alpha: 0.8, dur: 0.26 });

const tx = cx + 66, ty = cy + 30;
SPEC.washes.push({ pts: D.rect(tx, ty, 104, 118), color: G.parchDark, alpha: 0.95, t0: 2.5 });
P.add(D.rect(tx, ty, 104, 118), { w: 3.6, alpha: 0.85, dur: 0.3 });
P.add(D.close([[tx - 10, ty + 2], [tx + 52, ty - 64], [tx + 114, ty + 2]]), { w: 3.6, color: G.goldA, alpha: 0.9, dur: 0.24 });
SPEC.washes.push({ pts: [[tx - 8, ty + 2], [tx + 52, ty - 60], [tx + 112, ty + 2]], color: G.goldA, alpha: 0.9, t0: 2.7 });
SPEC.washes.push({ pts: D.rect(tx + 34, ty + 40, 36, 54), color: '#f4c95e', alpha: 1, t0: 2.9 });
P.add(D.rect(tx + 34, ty + 40, 36, 54), { w: 3, color: G.goldA, alpha: 0.95, dur: 0.2 });
P.add(D.line([tx + 52, ty - 62, tx + 52, ty - 96], 2), { w: 3.2, color: G.goldA, alpha: 0.95, dur: 0.14 });
P.add(D.line([tx + 40, ty - 84, tx + 64, ty - 84], 2), { w: 3.2, color: G.goldA, alpha: 0.95, dur: 0.1 });
Pg.add(D.ellipse(cx, cy, R - 8, R - 8, 0, Math.PI * 2, 60), { w: 3.4, alpha: 0.7, dur: 0.3 });

// ---------- 文字块 ----------
TEXT.push({ str: 'Lux  in  tenebris  lucet', x: IX0 + 470, y: IY0 + 500, size: 62, family: '"cav"', color: G.ink,
            t0: 4.2, dur: 1.0, step: 0.05 });
TEXT.push({ str: 'et tenebrae  eam  non  comprehenderunt', x: IX0 + 470, y: IY0 + 566, size: 44, family: '"cav"', color: '#6b5327',
            t0: 4.9, dur: 0.9, step: 0.04 });
Pg.add(D.line([IX0 + 466, IY0 + 604, IX0 + 1180, IY0 + 604], 2), { w: 4, alpha: 0.85, dur: 0.4 });
for (let i = 0; i < 3; i++) {
  P.sync(P.at() + 0.04);
  P.add(D.line([IX0 + 470, IY0 + 646 + i * 34, IX0 + 1080 - i * 160, IY0 + 646 + i * 34], 2), { w: 1.6, color: '#8a7342', alpha: 0.55, dur: 0.4 });
}

TEXT.push({ str: '金箔抄本 · 第一页', x: IX0 + 940, y: IY1 - 58, size: 34, family: '"msz"', color: '#8f2a20',
            t0: 5.6, dur: 0.7, step: 0.08 });
TEXT.push({ str: 'gilded · illumination', x: IX0 + 944, y: IY1 - 22, size: 24, family: '"cav"', color: '#7a6338',
            t0: 6.0, dur: 0.6, step: 0.05 });

TEXT.push({ str: 'fol.  I  ·  vellum  ·  aurum', x: IX0 + 60, y: IY1 - 44, size: 28, family: '"cav"', color: '#8f2a20',
            t0: 6.4, dur: 0.6, step: 0.05 });

// ---------- 页脚藤蔓 ----------
for (let i = 0; i < 5; i++) {
  const bx = IX0 + 120 + i * 210, by = IY1 - 60;
  Pr.add(D.chain([[bx, by + 26], [bx + 24, by - 16], [bx + 66, by - 10], [bx + 78, by + 12]]), { w: 2.8, alpha: 0.6, dur: 0.2, gap: 0.05 });
  Pb.add(D.ellipse(bx + 78, by + 12, 12, 12, 0, Math.PI * 2, 14), { w: 2.4, alpha: 0.6, dur: 0.1 });
}

const bundle = { strokes: P.strokes.concat(Pg.strokes, Pb.strokes, Pr.strokes), texts: TEXT, washes: SPEC.washes };
D.fit(bundle, 0.04, 8.4);
SPEC.strokes = bundle.strokes;
SPEC.texts = bundle.texts;

const canvas = document.getElementById('c');
const ENV = STYLEKIT.page(canvas, { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });

function goldLight(t) {
  const ctx = ENV.ctx, W = ENV.W, H = ENV.H;
  const k = STYLEKIT.clamp(t / 9.6);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gx = PX0 + (PX1 - PX0) * (0.2 + 0.6 * k);
  const g = ctx.createRadialGradient(gx, 420, 30, gx, 420, 900);
  g.addColorStop(0, 'rgba(255,232,168,0.30)');
  g.addColorStop(0.5, 'rgba(255,210,120,0.09)');
  g.addColorStop(1, 'rgba(255,200,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const lx = IX0 + 966, ly = IY0 + 354;
  const breath = 0.55 + 0.45 * Math.sin(t * 2.4);
  const lg = ctx.createRadialGradient(lx, ly, 6, lx, ly, 190);
  lg.addColorStop(0, 'rgba(255,214,130,' + (0.42 * breath).toFixed(3) + ')');
  lg.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(lx - 200, ly - 200, 400, 400);
  for (let i = 0; i < 26; i++) {
    const px = ((i * 733) % W + t * (18 + (i % 5) * 7)) % W;
    const py = (i * 419) % H + Math.sin(t * 1.2 + i) * 18;
    const a = 0.18 + 0.16 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = 'rgba(255,226,160,' + Math.max(0, a).toFixed(3) + ')';
    ctx.fillRect(px, py, 2.4, 2.4);
  }
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
  ctx.fillStyle = 'rgba(20,16,10,0.74)';
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
  goldLight(t);
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
