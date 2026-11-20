// heiban · 黑板粉笔 / 鲸为什么这么大
// 深绿色板面，三支“粉笔”（白 / 浅黄 / 浅青）逐笔起形：
// 海面与一条小船给出尺度，鲸的侧影从背脊一路拉到尾鳍，
// 右侧一根深度标尺 + 底部 18 米的量尺，最后写公式 V ∝ L³。
// 粉笔味来自同一条线叠画两遍：主线 + 低透明度的错位“灰”。
const D = BOARD;

const SPEC = {
  id: 'heiban',
  seed: 'av:heiban:whale',
  family: 'board',
  w: 1920,
  h: 1080,
  bg: '#1f3d35',
  ink: '#f2efe0',
  accent: '#e6d06a',
  board: '#1f3d35',
  gridBoard: false,
  chalk: true,
  strokes: [],
  washes: [],
  highlights: [],
  label: {
    zh: '黑板粉笔',
    en: 'Chalkboard',
    station: '02 · 手绘笔触',
    ink: '#ffffff',
    sub: '#ffffff',
  },
};

const COL = {
  chalk: '#f4f0e2',
  chalkSoft: '#cfd8d2',
  yellow: '#f6e39a',
  cyan: '#9fd6cf',
  salmon: '#e9a08f',
  board: '#1f3d35',
};

const TEXT = [];
const P = D.Pen({ t0: 0.05, w: 4.4, color: COL.chalk, alpha: 0.86, jitter: 2.4, speed: 1150, gap: 0.06 });
const Py = D.Pen({ t0: 0, w: 4.2, color: COL.yellow, alpha: 0.8, jitter: 2.6, speed: 1150, gap: 0.06 });
const Pc = D.Pen({ t0: 0, w: 3.6, color: COL.cyan, alpha: 0.66, jitter: 2.2, speed: 1200, gap: 0.06 });

// 粉笔：主线 + 错位灰
function chalk(pen, pts, o) {
  o = o || {};
  pen.add(pts, o);
  const g = Object.assign({}, o);
  g.alpha = (o.alpha == null ? 0.86 : o.alpha) * 0.34;
  g.w = (o.w || 4.4) * 0.9;
  pen.add(D.offset(pts, 2.2), g);
}

// ---------- 标题 ----------
TEXT.push({ str: '鲸为什么这么大', x: 142, y: 196, size: 84, family: '"msz"', color: COL.yellow,
            chalk: true, blur: 7, alpha: 0.95, t0: 0, dur: 0.95, step: 0.1, per: 0.2 });
TEXT.push({ str: 'WHY  ARE  WHALES  HUGE ?', x: 150, y: 262, size: 38, family: '"cav"', color: COL.chalkSoft,
            alpha: 0.75, t0: 0.9, dur: 0.7, step: 0.045, jitter: 2.6, blur: 3 });

// ---------- 海面 + 小船（给尺度） ----------
P.sync(1.5);
chalk(P, D.wave(150, 1760, 330, 7, 5, 60, -14), { w: 3.4, alpha: 0.5 });
chalk(P, D.wave(200, 1720, 352, 5, 6, 60, -10), { w: 2.2, alpha: 0.3 });
chalk(P, D.wave(240, 1700, 308, 4, 4, 50, -8), { w: 1.8, alpha: 0.22 });

// 小舢板：18 米的鲸旁边，一条 3 米小船
const hull = D.chain([[196, 330], [230, 358], [352, 358], [394, 330]]);
chalk(P, hull, { w: 4, alpha: 0.8 });
chalk(P, D.chain([[240, 358], [300, 372], [356, 356]]), { w: 2.4, alpha: 0.5 });
chalk(P, D.line([236, 330], [250, 292], 3), { w: 2.2, alpha: 0.6 });
chalk(P, D.line([356, 330], [392, 296], 3), { w: 2, alpha: 0.5 });
// 船上两个人
[[268, 300], [320, 302]].forEach(([x, y]) => {
  chalk(P, D.arc(x, y - 26, 7, 0, Math.PI * 2, 14), { w: 2.6, alpha: 0.75, dur: 0.16 });
  chalk(P, D.line([x, y - 18], [x, y + 6], 3), { w: 2.6, alpha: 0.75, dur: 0.14 });
  chalk(P, D.line([x, y + 6], [x - 10, y + 24], 2), { w: 2.2, alpha: 0.6, dur: 0.12 });
  chalk(P, D.line([x, y + 6], [x + 10, y + 24], 2), { w: 2.2, alpha: 0.6, dur: 0.12 });
});

// ---------- 鲸 ----------
P.sync(2.3);
SPEC.washes.push({ pts: D.rect(0, 330, 1920, 750), color: '#6fae9c', alpha: 0.07, t0: 0.4 });

// 背脊
const back = D.chain([[318, 622], [400, 520], [640, 466], [850, 472], [1000, 486], [1120, 528], [1210, 588]]);
chalk(P, back, { w: 5.6, alpha: 0.94, dur: 0.98 });
// 腹线
chalk(P, D.chain([[318, 622], [420, 724], [660, 790], [880, 788], [1050, 772], [1150, 700], [1210, 632]]),
      { w: 5.2, alpha: 0.9, dur: 0.9 });
// 尾柄两根短线收窄
chalk(P, D.line([1210, 588], [1210, 632], 2), { w: 3, alpha: 0.85, dur: 0.1 });

// 尾鳍：上叶、中缺、下叶，一笔连成
chalk(P, D.chain([[1210, 610], [1276, 552], [1360, 516], [1408, 534], [1352, 586], [1318, 600]]),
      { w: 4.4, alpha: 0.88, dur: 0.42 });
chalk(P, D.chain([[1210, 614], [1282, 662], [1360, 692], [1404, 668], [1350, 622], [1316, 606]]),
      { w: 4.2, alpha: 0.82, dur: 0.4 });

// 嘴线：贴着腹线走，中间是鲸须
chalk(P, D.chain([[330, 644], [470, 716], [600, 748], [676, 752]]), { w: 4, alpha: 0.86, dur: 0.42 });
for (let i = 0; i < 9; i++) {
  const x = 396 + i * 30;
  chalk(P, D.line([x, 686 + i * 6], [x + 4, 716 + i * 6], 2), { w: 1.6, alpha: 0.32, dur: 0.08, gap: 0.02 });
}

// 胸鳍（长而扁，往后扫）
chalk(P, D.chain([[556, 770], [608, 858], [706, 874], [664, 788], [556, 770]]), { w: 4.2, alpha: 0.84, dur: 0.42 });

// 喉褶
for (let i = 0; i < 3; i++) {
  const x = 470 + i * 46;
  chalk(P, D.chain([[x, 760], [x + 22, 790], [x + 52, 808]]), { w: 1.8, alpha: 0.28, dur: 0.1, gap: 0.02 });
}
chalk(P, D.arc(372, 600, 6, 0, Math.PI * 2, 14), { w: 2.8, alpha: 0.9, dur: 0.14 });
chalk(P, D.arc(372, 600, 11, 0.5, Math.PI * 1.5, 12), { w: 1.4, alpha: 0.35, dur: 0.1 });

// 背脊上的喷水
Py.sync(P.at());
chalk(Py, D.chain([[762, 472], [754, 392], [742, 350]]), { w: 2.6, alpha: 0.62, dur: 0.3 });
chalk(Py, D.chain([[752, 396], [712, 366], [688, 336]]), { w: 2, alpha: 0.5, dur: 0.22 });
chalk(Py, D.chain([[750, 382], [792, 352], [818, 330]]), { w: 2, alpha: 0.5, dur: 0.22 });

// 身上几笔排线，交代体积
for (let i = 0; i < 7; i++) {
  const x = 700 + i * 50;
  chalk(P, D.line([x, 496 + i * 4], [x + 28, 534 + i * 6], 2), { w: 1.4, alpha: 0.16, dur: 0.1, gap: 0.02 });
}

// ---------- 右侧深度标尺 ----------
P.sync(P.at() + 0.1);
chalk(P, D.line([1652, 330], [1652, 902], 4), { w: 3.2, alpha: 0.55, dur: 0.5 });
[[330, '0'], [520, '5'], [710, '10'], [900, '15']].forEach(([y, s], i) => {
  chalk(P, D.line([1626, y], [1676, y], 2), { w: 3, alpha: 0.6, dur: 0.14 });
  TEXT.push({ str: s, x: 1688, y: y + 12, size: 30, family: '"cav"', color: COL.chalkSoft, alpha: 0.7,
              t0: P.at(), dur: 0.3, step: 0.05, blur: 2 });
});

// ---------- 量尺：≈ 18 m ----------
P.sync(P.at() + 0.15);
chalk(P, D.line([322, 872], [1400, 872], 4), { w: 2.8, color: COL.salmon, alpha: 0.55, dur: 0.5 });
chalk(P, D.line([322, 848], [322, 896], 2), { w: 3, color: COL.salmon, alpha: 0.7, dur: 0.12 });
chalk(P, D.line([1400, 848], [1400, 896], 2), { w: 3, color: COL.salmon, alpha: 0.7, dur: 0.12 });
TEXT.push({ str: '≈ 18 m', x: 700, y: 946, size: 54, family: '"msz"', color: COL.yellow, chalk: true,
            blur: 6, t0: P.at(), dur: 0.55, step: 0.1 });
TEXT.push({ str: '≈ 6 层楼', x: 908, y: 942, size: 30, family: '"mk"', color: COL.chalkSoft, alpha: 0.72,
            chalk: true, blur: 3, t0: P.at() + 0.5, dur: 0.5, step: 0.08 });

// ---------- 公式（落在左下空档） ----------
Py.sync(P.at() + 0.16);
TEXT.push({ str: 'V ∝ L³', x: 118, y: 764, size: 64, family: '"cav"', color: COL.yellow, chalk: true,
            blur: 8, alpha: 0.95, t0: Py.at(), dur: 0.6, step: 0.12 });
TEXT.push({ str: '体积按立方涨 · 吃得更多才养得起', x: 120, y: 818, size: 26, family: '"mk"',
            color: COL.chalkSoft, alpha: 0.7, chalk: true, blur: 3, t0: Py.at() + 0.42, dur: 0.75, step: 0.055 });

// ---------- 收尾：粉笔在尾鳍上一圈 ----------
Py.sync(P.at() + 0.1);
chalk(Py, D.ellipse(1320, 600, 128, 108, 0.1, Math.PI * 2.15, 48), { w: 3, color: COL.salmon, alpha: 0.55, jitter: 3.2, dur: 0.55 });

const bundle = { strokes: P.strokes.concat(Py.strokes, Pc.strokes), texts: TEXT, washes: SPEC.washes };
D.fit(bundle, 0.06, 8.68);
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
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
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
