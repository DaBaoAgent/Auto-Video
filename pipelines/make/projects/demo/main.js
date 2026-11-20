// make · 马克笔白纸速写 / 平江路的清晨
// 一支黑的宽头马克笔起形，几块彩色马克笔铺面（板檐、粉墙、窗棂、灯笼、河水），
// 最后压一层排线当阴影，右上角用刷笔写地名与时间。
// 顺序：先落第一根檐线（第 0 帧就有笔触），色块在后面慢慢“压”上去。
const D = BOARD;

const SPEC = {
  id: 'make',
  seed: 'av:make:pingjiang',
  family: 'board',
  w: 1920,
  h: 1080,
  bg: '#fdfaf1',
  ink: '#1c232a',
  accent: '#d94b3f',
  board: '#fdfaf1',
  gridBoard: false,
  chalk: false,
  strokes: [],
  washes: [],
  highlights: [],
  label: {
    zh: '马克笔白纸速写',
    en: 'Marker Sketch',
    station: '02 · 手绘笔触',
    ink: '#141414',
    sub: '#4a4a46',
  },
};

const COL = {
  ink: '#1c232a',
  inkSoft: '#4d5a63',
  slate: '#3b4a56',
  wall: '#f7f1e2',
  teal: '#2f6f74',
  water: '#2f8f92',
  red: '#d94b3f',
  amber: '#e8a33d',
  gray: '#b9c4c9',
  mustard: '#f2c14e',
  brown: '#5b4632',
};

const TEXT = [];
const P = D.Pen({ t0: 0.04, w: 8, color: COL.ink, alpha: 0.92, jitter: 1.2, speed: 950, gap: 0.06 });
const Pd = D.Pen({ t0: 0, w: 3.2, color: COL.inkSoft, alpha: 0.7, jitter: 1.1, speed: 1500, gap: 0.04 });

// ---------- 板檐 ----------
P.add(D.line([22, 74], [1196, 60], 3), { w: 9, alpha: 0.95, dur: 0.6 });
P.add(D.line([22, 74], [22, 262], 2), { w: 5, alpha: 0.7, dur: 0.16 });
P.add(D.line([1196, 60], [1196, 246], 2), { w: 5, alpha: 0.7, dur: 0.16 });
P.add(D.line([22, 262], [1196, 246], 3), { w: 7, alpha: 0.85, dur: 0.5 });
// 瓦垄
for (let i = 0; i < 24; i++) {
  const x = 54 + i * 48;
  P.add(D.line([x, 84], [x + 2, 254], 2), { w: 4, alpha: 0.5, dur: 0.12, gap: 0.02 });
}
// 檐口的一排滴水
for (let i = 0; i < 24; i++) {
  const x = 54 + i * 48;
  Pd.add(D.arc(x + 24, 252, 12, 0.1, Math.PI - 0.1, 10), { w: 2.6, alpha: 0.3, dur: 0.08, gap: 0.01 });
}

// ---------- 粉墙 ----------
P.add(D.line([22, 262], [22, 702], 2), { w: 5, alpha: 0.75, dur: 0.28 });
P.add(D.line([1196, 246], [1196, 700], 2), { w: 5, alpha: 0.7, dur: 0.28 });
P.add(D.line([22, 702], [1196, 698], 3), { w: 6, alpha: 0.85, dur: 0.4 });

// ---------- 窗 ----------
const WX0 = 618, WX1 = 918, WY0 = 356, WY1 = 596;
P.add(D.rect(WX0, WY0, WX1 - WX0, WY1 - WY0), { w: 6, alpha: 0.88, dur: 0.46 });
for (let i = 1; i < 4; i++) {
  const x = WX0 + i * (WX1 - WX0) / 4;
  Pd.add(D.line([x, WY0], [x, WY1], 2), { w: 3, alpha: 0.6, dur: 0.16, gap: 0.02 });
}
for (let i = 1; i < 3; i++) {
  const y = WY0 + i * (WY1 - WY0) / 3;
  Pd.add(D.line([WX0, y], [WX1, y], 2), { w: 3, alpha: 0.6, dur: 0.16, gap: 0.02 });
}

// ---------- 门洞 ----------
P.add(D.arc(316, 452, 104, Math.PI, Math.PI * 2, 22), { w: 6.4, alpha: 0.9, dur: 0.34 });
P.add(D.line([212, 452], [212, 700], 2), { w: 5.4, alpha: 0.86, dur: 0.2 });
P.add(D.line([420, 452], [420, 700], 2), { w: 5.4, alpha: 0.86, dur: 0.2 });
Pd.add(D.arc(316, 456, 84, Math.PI, Math.PI * 2, 18), { w: 2.6, alpha: 0.35, dur: 0.24 });

// ---------- 门边的红联 ----------
[[160, 34], [442, 34]].forEach(([x, w]) => {
  P.sync(P.at() + 0.04);
  P.add(D.rect(x, 466, w, 232), { w: 3.2, alpha: 0.6, dur: 0.26 });
  for (let i = 0; i < 5; i++) {
    const y = 496 + i * 44;
    Pd.add(D.line([x + 7, y], [x + w - 7, y + 2], 2), { w: 3, color: COL.red, alpha: 0.55, dur: 0.08, gap: 0.01 });
  }
});

// ---------- 灯笼 ----------
P.sync(P.at() + 0.04);
P.add(D.line([1062, 250], [1062, 372], 2), { w: 3, alpha: 0.75, dur: 0.16 });
P.add(D.ellipse(1062, 432, 50, 60, 0, Math.PI * 2, 40), { w: 5.6, alpha: 0.92, dur: 0.42 });
P.add(D.line([1012, 384], [1112, 384], 2), { w: 4, alpha: 0.85, dur: 0.14 });
P.add(D.line([1012, 482], [1112, 482], 2), { w: 4, alpha: 0.85, dur: 0.14 });
for (let i = 0; i < 4; i++) {
  const x = 1020 + i * 28;
  Pd.add(D.line([x, 390], [x, 476], 2), { w: 2.2, alpha: 0.28, dur: 0.08, gap: 0.02 });
}
P.add(D.quad([1062, 486], [1060, 510], [1064, 526], 8), { w: 3, alpha: 0.7, dur: 0.12 });

// ---------- 石岸 ----------
P.add(D.line([0, 706], [600, 702], 3), { w: 7, alpha: 0.9, dur: 0.3 });
P.add(D.line([600, 702], [1200, 700], 3), { w: 7, alpha: 0.9, dur: 0.3 });
P.add(D.line([1200, 700], [1920, 698], 3), { w: 7, alpha: 0.9, dur: 0.3 });
P.add(D.line([0, 742], [1920, 740], 2), { w: 4, alpha: 0.55, dur: 0.4 });
for (let i = 0; i < 13; i++) {
  Pd.add(D.line([60 + i * 108, 708], [52 + i * 108, 740], 2), { w: 2.2, alpha: 0.3, dur: 0.06, gap: 0.01 });
}

// ---------- 河水 ----------
for (let i = 0; i < 6; i++) {
  P.add(D.wave(20, 1900, 766 + i * 50, 4, 7, 70, 1), { w: 3, alpha: 0.4 - i * 0.05, dur: 0.26, gap: 0.03 });
}
// 灯笼在水里的倒影
for (let i = 0; i < 4; i++) {
  P.add(D.wave(1014 + i * 24, 1050 + i * 24, 768 + i * 14, 6, 3, 26, 30),
        { w: 2.4, color: COL.red, alpha: 0.32, dur: 0.14, gap: 0.03 });
}

// ---------- 拱桥 ----------
P.sync(P.at() + 0.06);
const deck = D.ellipse(1560, 900, 288, 208, Math.PI, Math.PI * 2, 30);
const arch = D.ellipse(1560, 900, 216, 150, Math.PI, Math.PI * 2, 30);
P.add(deck, { w: 6.4, alpha: 0.9, dur: 0.46 });
P.add(arch, { w: 7, alpha: 0.92, dur: 0.46 });
for (let i = 1; i < 10; i++) {
  const a = Math.PI + i * Math.PI / 10;
  const x = 1560 + Math.cos(a) * 216, y = 900 + Math.sin(a) * 150;
  Pd.add(D.line([x, y], [1560 + Math.cos(a) * 190, y - 8], 2), { w: 2.4, alpha: 0.3, dur: 0.06, gap: 0.01 });
}
// 桥栏
for (let i = 1; i < 14; i++) {
  const a = Math.PI + i * Math.PI / 14;
  const x = 1560 + Math.cos(a) * 288;
  const y = 900 + Math.sin(a) * 208;
  Pd.add(D.line([x, y], [x, y - 28], 2), { w: 2.6, alpha: 0.45, dur: 0.07, gap: 0.01 });
}
P.add(D.ellipse(1560, 872, 288, 208, Math.PI, Math.PI * 2, 26), { w: 2.8, alpha: 0.4, dur: 0.26 });

// ---------- 小船 ----------
P.sync(P.at() + 0.04);
P.add(D.quad([600, 944], [770, 1020], [950, 942], 20), { w: 6.4, alpha: 0.9, dur: 0.42 });
P.add(D.quad([600, 944], [770, 978], [950, 942], 14), { w: 3.4, alpha: 0.6, dur: 0.24 });
P.add(D.ellipse(776, 944, 96, 70, Math.PI, Math.PI * 2, 18), { w: 5.2, alpha: 0.85, dur: 0.32 });
P.add(D.quad([690, 886], [700, 934], [776, 940], 10), { w: 3.4, alpha: 0.55, dur: 0.16 });
P.add(D.quad([862, 886], [852, 934], [776, 940], 10), { w: 3.4, alpha: 0.55, dur: 0.16 });
P.add(D.quad([936, 916], [968, 862], [978, 806], 10), { w: 3.4, alpha: 0.6, dur: 0.2 });


// ---------- 猫（坐在石岸上看水） ----------
P.sync(P.at() + 0.1);
const cX = 528, cY = 700;
P.add(D.ellipse(cX, cY - 52, 44, 54, 0, Math.PI * 2, 34), { w: 5, alpha: 0.92, dur: 0.4 });
P.add(D.arc(cX, cY - 108, 26, 0, Math.PI * 2, 26), { w: 4.4, alpha: 0.9, dur: 0.28 });
P.add(D.line([cX - 22, cY - 126], [cX - 14, cY - 154], 2), { w: 3.4, alpha: 0.85, dur: 0.12 });
P.add(D.line([cX - 14, cY - 154], [cX - 2, cY - 130], 2), { w: 3.4, alpha: 0.85, dur: 0.1 });
P.add(D.line([cX + 6, cY - 130], [cX + 18, cY - 154], 2), { w: 3.4, alpha: 0.85, dur: 0.12 });
P.add(D.line([cX + 18, cY - 154], [cX + 24, cY - 126], 2), { w: 3.4, alpha: 0.85, dur: 0.1 });
P.add(D.arc(cX - 10, cY - 110, 3, 0, Math.PI * 2, 10), { w: 2, alpha: 0.85, dur: 0.08 });
P.add(D.arc(cX + 10, cY - 110, 3, 0, Math.PI * 2, 10), { w: 2, alpha: 0.85, dur: 0.08 });
P.add(D.arc(cX + 6, cY - 96, 4, 0.2, Math.PI - 0.2, 8), { w: 2, alpha: 0.7, dur: 0.08 });
// 尾巴绕过脚边
P.add(D.arc(cX + 58, cY - 30, 40, 1.9, 4.3, 22), { w: 3.8, alpha: 0.85, dur: 0.24 });
// 胡须
Pd.add(D.line([cX - 16, cY - 100], [cX - 54, cY - 106], 2), { w: 1.8, alpha: 0.4, dur: 0.06 });
Pd.add(D.line([cX + 16, cY - 100], [cX + 54, cY - 106], 2), { w: 1.8, alpha: 0.4, dur: 0.06 });

// ---------- 排线阴影 ----------
P.sync(P.at() + 0.06);
for (let i = 0; i < 8; i++) {
  const x = 200 + i * 118, y = 664 + (i % 3) * 12;
  Pd.add(D.line([x, y], [x + 26, y + 30], 2), { w: 2.6, alpha: 0.2, dur: 0.08, gap: 0.01 });
}
for (let i = 0; i < 8; i++) {
  const x = 660 + i * 34;
  Pd.add(D.line([x, 300], [x + 14, 282], 2), { w: 2.2, alpha: 0.18, dur: 0.06, gap: 0.01 });
}

// ---------- 色块（马克笔压面） ----------
const WH = (n) => n; // 便于阅读
SPEC.washes.push({ pts: D.rect(20, 246, 1180, 458), color: COL.wall, alpha: 0.92, t0: 0.34 });
SPEC.washes.push({ pts: [[22, 74], [1196, 60], [1198, 252], [22, 262]], color: COL.slate, alpha: 0.85, t0: 0.5 });
SPEC.washes.push({ pts: [[WX0, WY0], [WX1, WY0], [WX1, WY1], [WX0, WY1]], color: '#24454c', alpha: 0.62, t0: 1.35 });
SPEC.washes.push({ pts: [[WX0 - 6, WY0 - 8], [WX1 + 6, WY0 - 8], [WX1 + 6, WY0 + 10], [WX0 - 6, WY0 + 10]], color: COL.teal, alpha: 0.75, t0: 1.2 });
SPEC.washes.push({ pts: [[WX0 - 6, WY1 - 10], [WX1 + 6, WY1 - 10], [WX1 + 6, WY1 + 8], [WX0 - 6, WY1 + 8]], color: COL.teal, alpha: 0.75, t0: 1.2 });
SPEC.washes.push({ pts: D.arc(316, 452, 104, Math.PI, Math.PI * 2, 22), color: '#2a2118', alpha: 0.22, t0: 1.9 });
SPEC.washes.push({ pts: [[212, 452], [420, 452], [420, 700], [212, 700]], color: COL.amber, alpha: 0.62, t0: 2.0 });
SPEC.washes.push({ pts: D.ellipse(1062, 432, 50, 60, 0, Math.PI * 2, 40), color: COL.red, alpha: 0.88, t0: 2.35 });
SPEC.washes.push({ pts: D.rect(160, 466, 34, 232), color: COL.red, alpha: 0.72, t0: 2.15 });
SPEC.washes.push({ pts: D.rect(442, 466, 34, 232), color: COL.red, alpha: 0.72, t0: 2.15 });
SPEC.washes.push({ pts: [[0, 700], [1920, 698], [1920, 742], [0, 744]], color: COL.gray, alpha: 0.72, t0: 2.55 });
SPEC.washes.push({ pts: D.rect(6, 742, 1908, 338), color: COL.water, alpha: 0.6, t0: 2.75 });
SPEC.washes.push({ pts: deck.concat(arch.slice().reverse()), color: COL.gray, alpha: 0.78, t0: 3.0 });
SPEC.washes.push({ pts: D.ellipse(1560, 892, 240, 178, Math.PI, Math.PI * 2, 26).concat(D.ellipse(1560, 892, 208, 152, Math.PI, Math.PI * 2, 26).reverse()),
                   color: '#8e9ea6', alpha: 0.6, t0: 3.05 });
SPEC.washes.push({ pts: [[600, 944], [770, 1020], [950, 942], [770, 978]], color: '#4a3a2a', alpha: 0.78, t0: 3.5 });


SPEC.washes.push({ pts: D.ellipse(776, 950, 92, 66, Math.PI, Math.PI * 2, 18).concat([[856, 950], [696, 950]]),
                   color: '#3a3a34', alpha: 0.62, t0: 3.55 });
SPEC.washes.push({ pts: D.ellipse(cX, cY - 60, 46, 62, 0, Math.PI * 2, 34), color: '#d9b183', alpha: 0.45, t0: 3.9 });


// ---------- 字 ----------
TEXT.push({ str: 'PINGJIANG', x: 1226, y: 206, size: 76, family: '"cavb"', color: COL.ink,
            t0: 6.2, dur: 1.0, step: 0.09, jitter: 1.4 });
TEXT.push({ str: '6:40 AM', x: 1232, y: 262, size: 34, family: '"cavb"', color: COL.red,
            t0: 7.0, dur: 0.5, step: 0.06 });
TEXT.push({ str: '苏州 · 平江路', x: 1506, y: 260, size: 32, family: '"zhi"', color: COL.inkSoft,
            t0: 7.4, dur: 0.7, step: 0.05 });

const bundle = { strokes: P.strokes.concat(Pd.strokes), texts: TEXT, washes: SPEC.washes };
D.fit(bundle, 0.04, 8.66);
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







