// baiban · 白板讲解 / 机翼剖面
// 画面由 vendor/runtime/stylekit.js 的 board 族在运行时逐笔画出来：
// 几何形状在 vendor/runtime/board-draw.js 里程序化采样，笔序压进 8.6 秒，
// 手写标注在 stylekit 之后用画布文字逐字擦出，落到白板网格上。
//
// 讲解对象：一片机翼（迎角 6°），六条流线从左侧进来、绕过剖面、右侧下洗；
// 上方流线被挤密 → 标注“快·低压”，下方稀 → “慢·高压”，红色升力箭头垂直向上；
// 右上角贴一张便利贴写伯努利式，末了红笔圈住整片剖面。
const D = BOARD;

const SPEC = {
  id: 'baiban',
  seed: 'av:baiban:airfoil',
  family: 'board',
  w: 1920,
  h: 1080,
  bg: '#fcfcf8',
  ink: '#1d2b36',
  accent: '#2f7fd1',
  board: '#fcfcf8',
  gridBoard: true,
  gridColor: '#cfe3f5',
  chalk: false,
  strokes: [],
  washes: [],
  highlights: [],
  label: {
    zh: '白板讲解',
    en: 'Whiteboard Explainer',
    station: '02 · 手绘笔触',
    ink: '#141414',
    sub: '#4a4a46',
  },
};

const COL = {
  ink: '#1d2b36',
  inkSoft: '#5d7a8c',
  blue: '#2f7fd1',
  blueDeep: '#1f5fa8',
  bluePale: '#8fc2e8',
  red: '#d9433a',
  yellow: '#ffd84d',
  gray: '#9aa7b2',
};

const TEXT = [];
const P = D.Pen({ t0: 0.05, w: 5.6, color: COL.ink, alpha: 0.9, jitter: 1.6, speed: 1150, gap: 0.05 });
const Pb = D.Pen({ t0: 0, w: 5, color: COL.blue, alpha: 0.72, jitter: 1.3, speed: 1500, gap: 0.04 });
const Pr = D.Pen({ t0: 0, w: 8, color: COL.red, alpha: 0.9, jitter: 1.5, speed: 1200, gap: 0.04 });

// ---------- 标题 ----------
TEXT.push({ str: '飞机为什么能飞', x: 132, y: 172, size: 88, family: '"mk"', color: COL.ink, bold: 2.2,
            t0: 0.0, dur: 0.9, step: 0.1, per: 0.16 });
P.add(D.line([132, 202], [706, 196], 3), { w: 6, color: COL.blue, alpha: 0.8, dur: 0.34, t0: 0.98, gap: 0.02 });
TEXT.push({ str: 'WHY  PLANES  FLY', x: 136, y: 250, size: 40, family: '"cav"', color: COL.blueDeep,
            alpha: 0.9, t0: 0.62, dur: 0.62, step: 0.055, jitter: 2.4 });

// ---------- 机翼剖面 ----------
// ---------- 机翼剖面（NACA 四位数翼型，余弦加密前缘） ----------
const CX = 960, CY = 590, TILT = 0.122; // ≈ 7°
const CHORD = 976, X0 = 470, LE0 = 600;

function naca(n, tMax, m, p) {
  const up = [], lo = [];
  for (let i = 0; i <= n; i++) {
    const x = 0.5 * (1 - Math.cos(Math.PI * (i / n)));  // 0..1，前缘加密
    const yt = 5 * tMax * (0.2969 * Math.sqrt(x) - 0.1260 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1015 * x * x * x * x);
    const yc = x < p ? (m / (p * p)) * (2 * p * x - x * x)
                     : (m / ((1 - p) * (1 - p))) * ((1 - 2 * p) + 2 * p * x - x * x);
    up.push([X0 + x * CHORD, LE0 - (yc + yt) * CHORD]);
    lo.push([X0 + x * CHORD, LE0 - (yc - yt) * CHORD]);
  }
  return { up, lo };
}
const foil = naca(120, 0.145, 0.05, 0.42);
const wing = D.rotate(foil.up.concat(foil.lo.slice().reverse()), CX, CY + 20, TILT);

const sOutline = P.add(wing, { w: 6.2, alpha: 0.94, dur: 0.98 });
SPEC.washes.push({ pts: wing, color: '#dbeaf8', alpha: 0.55, _after: sOutline });

// 弦线（虚线）
P.addEach(D.dashes(D.rotate(D.line([X0, LE0], [X0 + CHORD, LE0], 4), CX, CY + 20, TILT), 26, 18), { w: 2.6, color: COL.gray, alpha: 0.7, speed: 900, dur: 0.4 });

// 前缘红点
P.add(D.arc(475, 540, 7, 0, Math.PI * 2, 18), { w: 4, color: COL.red, alpha: 0.85, dur: 0.14 });

// 迎角标注（气流入射方向就是水平的）
TEXT.push({ str: '迎角 α ≈ 6°', x: 250, y: 714, size: 34, family: '"mk"', color: COL.inkSoft,
            bg: true, bgColor: '#fcfcf8', t0: P.at(), dur: 0.72, step: 0.072 });

// ---------- 六条流线（上方挤密、下方略松，右侧带下洗） ----------
const smooth = (v) => { const t = D.clamp01(v); return t * t * (3 - 2 * t); };
const X_TE = 1446;

function flowLine(base, amp, n) {
  n = n || 64;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const x = 168 + (1752 - 168) * (i / n);
    const bump = Math.exp(-Math.pow((x - 930) / 430, 2));
    const tail = x > X_TE ? (x - X_TE) * 0.05 : 0;
    out.push([x, base - amp * bump + tail]);
  }
  return out;
}
const above = [[318, 26], [380, 44], [442, 72]];
const below = [[690, -2], [752, -10], [814, -22]];

above.forEach(([y, a], i) => {
  P.add(flowLine(y, a), { w: 4.4, color: COL.blue, alpha: i === 2 ? 0.74 : 0.54, speed: 2400, dur: 0.44, gap: 0.03 });
});
below.forEach(([y, a], i) => {
  P.add(flowLine(y, a), { w: 4.2, color: COL.bluePale, alpha: i === 0 ? 0.68 : 0.48, speed: 2400, dur: 0.44, gap: 0.03 });
});

// 右侧来流箭头（贴着流线末端的切线）
[[318, 26], [442, 72], [690, -2]].forEach(([y, a]) => {
  const st = flowLine(y, a);
  const hd = D.curveArrow(st, 19);
  const c = y < 500 ? COL.blue : COL.bluePale;
  const t0 = P.at() + 0.36;
  Pb.add(hd.h1, { w: 4.2, color: c, dur: 0.05, gap: 0.01, t0 });
  Pb.add(hd.h2, { w: 4.2, color: c, dur: 0.05, gap: 0.07, t0 });
});

// ---------- 标注：上快下慢 ----------
TEXT.push({ str: '上方：快 · 低压', x: 1096, y: 206, size: 44, family: '"mk"', color: COL.blueDeep, bold: 1.2,
            bg: true, bgColor: '#fcfcf8', t0: P.at(), dur: 0.86, step: 0.082 });
Pb.addEach(D.dashes(D.chain([[1092, 224], [1048, 268], [1012, 296]]), 14, 10), { w: 2.6, alpha: 0.75, dur: 0.24, t0: P.at() });

P.pause(0.14);
TEXT.push({ str: '下方：慢 · 高压', x: 560, y: 984, size: 44, family: '"mk"', color: COL.blueDeep, bold: 1.2,
            bg: true, bgColor: '#fcfcf8', t0: P.at(), dur: 0.86, step: 0.082 });

// 左侧补一句背后的原理，别让左下空着
TEXT.push({ str: '流速快 · 压强小', x: 150, y: 838, size: 30, family: '"mk"', color: COL.inkSoft,
            bg: true, bgColor: '#fcfcf8', t0: P.at(), dur: 0.7, step: 0.06 });

// ---------- 升力箭头 ----------
P.pause(0.16);
Pr.sync(P.at());
const lift = D.arrow(862, 494, 862, 336, 32);
Pr.add(lift.shaft, { w: 9, color: COL.red, alpha: 0.92, dur: 0.34 });
Pr.add(lift.h1, { w: 7, dur: 0.08, gap: 0.01 });
Pr.add(lift.h2, { w: 7, dur: 0.08 });

TEXT.push({ str: '升力 LIFT', x: 898, y: 398, size: 52, family: '"mk","cav"', color: COL.red, bold: 1.6,
            t0: Pr.at(), dur: 0.8, step: 0.09 });
SPEC.highlights.push({ x: 888, y: 412, w: 268, h: 20, color: COL.yellow, t0: 8.28 });

// 右下角：升力公式
TEXT.push({ str: '升力 F = Δp × S', x: 1300, y: 1002, size: 40, family: '"mk"', color: COL.ink,
            t0: Pr.at(), dur: 0.8, step: 0.07 });

// ---------- 便利贴：伯努利（在笔画之上另外压一层，流线不会穿过它） ----------
const CARDS = [{ x: 1512, y: 92, w: 344, h: 208, rot: -0.05, color: '#fff2ae', shadow: true,
                 border: 'rgba(180,148,60,0.35)', fold: 0.99, t0: 1.5, dur: 0.4 }];
TEXT.push({ str: 'p + ½ρv² = C', x: 1546, y: 166, size: 54, family: '"cav","mk"', color: '#5b4a1e',
            rot: -0.05, t0: 2.1, dur: 0.86, step: 0.07 });
TEXT.push({ str: '压强 + 动压 = 常量', x: 1546, y: 250, size: 26, family: '"mk"', color: '#7a6428',
            rot: -0.05, t0: 2.6, dur: 0.8, step: 0.06 });

// ---------- 尾缘下洗 ----------
P.pause(0.1);
Pb.sync(P.at());
const dw = D.quad([1452, 620], [1620, 640], [1706, 742], 22);
Pb.add(dw, { w: 4.6, alpha: 0.7, dur: 0.4 });
const dwh = D.curveArrow(dw, 18);
Pb.add(dwh.h1, { w: 4.6, alpha: 0.7, dur: 0.06, gap: 0.01 });
Pb.add(dwh.h2, { w: 4.6, alpha: 0.7, dur: 0.06 });
TEXT.push({ str: '下洗', x: 1620, y: 800, size: 34, family: '"mk"', color: COL.blueDeep,
            bg: true, bgColor: '#fcfcf8', t0: P.at(), dur: 0.6, step: 0.07 });

// ---------- 收尾：红笔圈住剖面 ----------
Pr.sync(P.at());
Pr.pause(0.1);
Pr.add(D.ellipse(960, 592, 512, 180, 0.06, Math.PI * 2.12, 74), { w: 5.4, color: COL.red, alpha: 0.78, jitter: 2.6, dur: 0.66 });
Pr.add(D.ellipse(960, 592, 484, 168, 0.44, Math.PI * 2.06, 70), { w: 3.2, color: COL.red, alpha: 0.46, jitter: 2.8, dur: 0.5 });

const bundle = { strokes: P.strokes.concat(Pb.strokes, Pr.strokes), texts: TEXT, washes: SPEC.washes };
D.fit(bundle, 0.04, 8.72);
SPEC.strokes = bundle.strokes;
SPEC.texts = bundle.texts;

const canvas = document.getElementById('c');
const ENV = STYLEKIT.page(canvas, { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });

// 左下角的版式牌：哪条管线、哪个工位
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
  BOARD.drawCards(ENV.ctx, CARDS, t);
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




