// biji · 视觉笔记 / 蜜蜂怎样酿蜜
// 米色纸 + 淡格，三张带编号的手绘卡片串成一条流程：
// 1 采蜜（花）→ 2 酿造（蜂）→ 3 封盖（蜜罐），
// 标题压在马克笔黄块上，收尾补一条“1 匙蜜 ≈ 12 只蜂”的注脚。
const D = BOARD;

const SPEC = {
  id: 'biji',
  seed: 'av:biji:honey',
  family: 'board',
  w: 1920,
  h: 1080,
  bg: '#fbf6e8',
  ink: '#20242a',
  accent: '#e8705f',
  board: '#fbf6e8',
  gridBoard: true,
  gridColor: '#efe4c8',
  chalk: false,
  strokes: [],
  washes: [],
  highlights: [],
  label: {
    zh: '视觉笔记',
    en: 'Sketchnote',
    station: '02 · 手绘笔触',
    ink: '#141414',
    sub: '#5a564c',
  },
};

const COL = {
  ink: '#20242a',
  soft: '#6f6a5e',
  mustard: '#f2c14e',
  coral: '#e8705f',
  teal: '#3f9c93',
  amber: '#e0a12e',
  sky: '#8fc0e0',
  cream: '#fffdf5',
};

const TEXT = [];
const P = D.Pen({ t0: 0.05, w: 4.2, color: COL.ink, alpha: 0.88, jitter: 1.5, speed: 1150, gap: 0.05 });
const Pc = D.Pen({ t0: 0, w: 3.6, color: COL.coral, alpha: 0.8, jitter: 1.6, speed: 1400, gap: 0.05 });

// ---------- 标题（黄块 + 手写） ----------
SPEC.washes.push({ pts: D.rotate(D.rect(120, 96, 640, 118), 440, 155, -0.008), color: COL.mustard, alpha: 0.55, t0: 0.05 });
TEXT.push({ str: '蜜蜂怎样酿蜜', x: 148, y: 196, size: 92, family: '"mk"', color: COL.ink, bold: 2.4,
            t0: 0.12, dur: 1.0, step: 0.1, per: 0.18 });
P.add(D.line([150, 226], [760, 220], 3), { w: 5, color: COL.ink, alpha: 0.7, dur: 0.3, t0: 1.12, gap: 0.02 });
TEXT.push({ str: 'HOW  BEES  MAKE  HONEY', x: 152, y: 276, size: 36, family: '"cav"', color: COL.soft,
            alpha: 0.85, t0: 1.3, dur: 0.7, step: 0.05, jitter: 2.2 });

// ---------- 三张卡片 ----------
const cards = [
  { cx: 388, cy: 566, w: 300, h: 316, num: '1', name: '采蜜', tint: COL.mustard, rot: -0.02 },
  { cx: 900, cy: 536, w: 300, h: 316, num: '2', name: '酿造', tint: COL.coral, rot: 0.015 },
  { cx: 1416, cy: 610, w: 300, h: 336, num: '3', name: '封盖', tint: COL.teal, rot: -0.012 },
];

cards.forEach((c, i) => {
  const x = c.cx - c.w / 2, y = c.cy - c.h / 2;
  const rr = (dx, dy) => D.rotate(D.roundRect(x + dx, y + dy, c.w, c.h, 18, 7), c.cx, c.cy, c.rot);
  SPEC.washes.push({ pts: rr(10, 12), color: '#b9ad90', alpha: 0.18, t0: 0.3 + i * 0.18 });
  SPEC.washes.push({ pts: rr(0, 0), color: COL.cream, alpha: 0.95, t0: 0.42 + i * 0.18 });
  SPEC.washes.push({ pts: D.rotate(D.rect(x, y, c.w, 56), c.cx, c.cy, c.rot), color: c.tint, alpha: 0.55, t0: 0.52 + i * 0.18 });
});

cards.forEach((c, i) => {
  const x = c.cx - c.w / 2, y = c.cy - c.h / 2;
  P.sync(P.at() + 0.05);
  P.add(D.rotate(D.roundRect(x, y, c.w, c.h, 18, 7), c.cx, c.cy, c.rot), { w: 3.6, alpha: 0.82, dur: 0.55 });
  P.add(D.rotate(D.line([x, y + 56], [x + c.w, y + 56], 3), c.cx, c.cy, c.rot), { w: 2.4, alpha: 0.5, dur: 0.18 });
  P.add(D.rotate(D.arc(x + 40, y + 28, 26, 0, Math.PI * 2, 24), c.cx, c.cy, c.rot), { w: 3, alpha: 0.8, dur: 0.22 });
  TEXT.push({ str: c.num, x: x + 30, y: y + 42, size: 40, family: '"cav"', color: COL.ink,
              t0: P.at(), dur: 0.3, step: 0.1 });
  TEXT.push({ str: c.name, x: x + 84, y: y + 42, size: 34, family: '"mk"', color: COL.ink, bold: 1.2,
              t0: P.at() + 0.12, dur: 0.45, step: 0.09 });
});

// 卡片 1：一朵花
(function () {
  const cx = 388, cy = 556;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / 5);
    P.add(D.ellipse(cx + Math.cos(a) * 46, cy + Math.sin(a) * 46, 32, 22, 0, Math.PI * 2, 24, a),
          { w: 3, alpha: 0.75, dur: 0.22, gap: 0.03 });
  }
  P.add(D.arc(cx, cy, 26, 0, Math.PI * 2, 24), { w: 3, alpha: 0.85, dur: 0.22 });
  P.add(D.chain([[cx, cy + 22], [cx - 8, cy + 70], [cx + 2, cy + 104]]), { w: 3.2, alpha: 0.7, dur: 0.28 });
  P.add(D.chain([[cx - 4, cy + 62], [cx - 52, cy + 54], [cx - 74, cy + 76]]), { w: 3, alpha: 0.6, dur: 0.2 });
  P.add(D.chain([[cx + 2, cy + 66], [cx + 48, cy + 58], [cx + 68, cy + 78]]), { w: 3, alpha: 0.6, dur: 0.2 });
})();

// 卡片 2：一只蜜蜂
(function () {
  const cx = 892, cy = 520;
  P.add(D.ellipse(cx, cy, 76, 44, 0, Math.PI * 2, 46, -0.22), { w: 3.4, alpha: 0.85, dur: 0.34 });
  // 腹部三道黑纹：横跨整条身体的短线
  for (let i = 0; i < 3; i++) {
    const x = cx - 12 + i * 26;
    P.add(D.chain([[x - 4, cy - 34], [x + 12, cy + 2], [x - 2, cy + 36]]), { w: 3.4, alpha: 0.85, dur: 0.2, gap: 0.02 });
  }
  // 头 + 复眼
  P.add(D.arc(cx - 84, cy + 4, 24, 0, Math.PI * 2, 22), { w: 3, alpha: 0.85, dur: 0.22 });
  P.add(D.arc(cx - 90, cy - 2, 9, 0, Math.PI * 2, 14), { w: 2, alpha: 0.5, dur: 0.1 });
  // 两片翅膀（在背上，半透明）
  P.add(D.ellipse(cx - 18, cy - 52, 50, 20, 0, Math.PI * 2, 30, -0.5), { w: 2.6, alpha: 0.45, dur: 0.2 });
  P.add(D.ellipse(cx + 26, cy - 56, 44, 18, 0, Math.PI * 2, 28, 0.32), { w: 2.6, alpha: 0.4, dur: 0.2 });
  // 触角
  P.add(D.chain([[cx - 102, cy - 12], [cx - 124, cy - 42], [cx - 118, cy - 60]]), { w: 2.4, alpha: 0.6, dur: 0.16 });
  P.add(D.chain([[cx - 88, cy - 16], [cx - 100, cy - 50], [cx - 90, cy - 68]]), { w: 2.4, alpha: 0.6, dur: 0.16 });
  // 尾刺 + 飞行虚线
  P.add(D.line([cx + 74, cy + 16], [cx + 98, cy + 30], 2), { w: 2.6, alpha: 0.75, dur: 0.12 });
  P.addEach(D.dashes(D.chain([[cx + 150, cy + 112], [cx + 86, cy + 152], [cx + 6, cy + 138], [cx - 46, cy + 108]]), 12, 10), { w: 2.4, color: COL.soft, alpha: 0.4, dur: 0.34 });
})();

// 卡片 3：一只蜜罐
(function () {
  const cx = 1416, cy = 640;
  const jar = D.roundRect(cx - 70, cy - 70, 140, 170, 26, 8);
  P.add(jar, { w: 3.4, alpha: 0.85, dur: 0.34 });
  P.add(D.roundRect(cx - 84, cy - 98, 168, 34, 10, 5), { w: 3, alpha: 0.8, dur: 0.2 });
  P.add(D.roundRect(cx - 46, cy + 4, 92, 62, 8, 4), { w: 2.4, alpha: 0.5, dur: 0.22 });
  // 罐口淌下来的三道蜜
  [-34, 0, 34].forEach((dx, i) => {
    P.add(D.chain([[cx + dx, cy - 96], [cx + dx + 2, cy - 80], [cx + dx - 1, cy - 66 + i * 4]]),
          { w: 2.6, color: COL.amber, alpha: 0.7, dur: 0.12, gap: 0.02 });
  });
  // 标签上的一只小蜜蜂
  P.add(D.ellipse(cx - 12, cy + 34, 22, 13, 0, Math.PI * 2, 20, -0.2), { w: 2, alpha: 0.4, dur: 0.12 });
})();

// 卡片里的色块（铺在描线之下，位置按卡片中心对齐）
SPEC.washes.push({ pts: D.arc(388, 556, 26, 0, Math.PI * 2, 24), color: COL.mustard, alpha: 0.6, t0: 3.0 });
SPEC.washes.push({ pts: D.ellipse(892, 520, 76, 44, 0, Math.PI * 2, 46, -0.22), color: COL.mustard, alpha: 0.45, t0: 3.4 });
SPEC.washes.push({ pts: D.roundRect(1346, 570, 140, 170, 26, 8), color: COL.amber, alpha: 0.45, t0: 4.0 });

// ---------- 卡片之间的虚线箭头 ----------
Pc.sync(P.at() + 0.1);
const path1 = D.chain([[556, 730], [646, 766], [712, 712]]);
Pc.addEach(D.dashes(path1, 16, 12), { w: 3.2, alpha: 0.75, dur: 0.34 });
const ah1 = D.curveArrow(path1, 16);
Pc.add(ah1.h1, { w: 3.2, alpha: 0.75, dur: 0.06, gap: 0.01 });
Pc.add(ah1.h2, { w: 3.2, alpha: 0.75, dur: 0.06 });

Pc.sync(P.at() + 0.1);
const path2 = D.chain([[1072, 578], [1162, 548], [1238, 604]]);
Pc.addEach(D.dashes(path2, 16, 12), { w: 3.2, alpha: 0.75, dur: 0.32 });
const ah2 = D.curveArrow(path2, 16);
Pc.add(ah2.h1, { w: 3.2, alpha: 0.75, dur: 0.06, gap: 0.01 });
Pc.add(ah2.h2, { w: 3.2, alpha: 0.75, dur: 0.06 });

// ---------- 右上角飞着的那只蜂 ----------
P.sync(P.at() + 0.14);
const fx = 1180, fy = 250;
P.addEach(D.dashes(D.chain([[980, 424], [1054, 356], [1128, 306]]), 14, 12), { w: 2.6, color: COL.soft, alpha: 0.4, dur: 0.34 });
P.add(D.ellipse(fx, fy, 40, 22, 0, Math.PI * 2, 30, -0.15), { w: 2.6, alpha: 0.8, dur: 0.24 });
SPEC.washes.push({ pts: D.ellipse(fx, fy, 40, 22, 0, Math.PI * 2, 30, -0.15), color: COL.mustard, alpha: 0.5, t0: P.at() - 0.16 });
for (let i = 0; i < 2; i++) {
  P.add(D.line([fx - 8 + i * 18, fy - 20], [fx - 2 + i * 18, fy + 20], 2), { w: 2.2, alpha: 0.75, dur: 0.1, gap: 0.02 });
}
P.add(D.arc(fx - 42, fy - 2, 12, 0, Math.PI * 2, 16), { w: 2.2, alpha: 0.75, dur: 0.12 });
P.add(D.ellipse(fx - 6, fy - 26, 26, 11, 0, Math.PI * 2, 20, -0.4), { w: 2, alpha: 0.42, dur: 0.12 });
P.add(D.ellipse(fx + 18, fy - 28, 22, 10, 0, Math.PI * 2, 18, 0.3), { w: 2, alpha: 0.38, dur: 0.12 });

// ---------- 注脚 ----------
P.sync(P.at() + 0.2);
TEXT.push({ str: '1 匙蜜 ≈ 12 只蜂 一生的采集', x: 620, y: 992, size: 42, family: '"mk"', color: COL.ink,
            bold: 1.2, t0: P.at(), dur: 0.9, step: 0.07 });
P.add(D.line([622, 1008], [1236, 1002], 3), { w: 4, color: COL.coral, alpha: 0.6, dur: 0.32 });

// 右上角胶带 + 六边形装饰
[[1660, 84, 0.22], [1760, 62, -0.14]].forEach(([x, y, r]) => {
  SPEC.washes.push({ pts: D.rotate(D.rect(x, y, 150, 44), x + 75, y + 22, r), color: '#f6c9b8', alpha: 0.6, t0: 0.5 });
});
P.sync(P.at() + 0.1);
[[1706, 430, 0.2], [1794, 478, 0.2], [1706, 526, 0.2]].forEach(([x, y]) => {
  P.add(D.ellipse(x, y, 40, 40, 0, Math.PI * 2, 6, 0.4), { w: 2.6, color: COL.teal, alpha: 0.5, dur: 0.2, gap: 0.02 });
});

const bundle = { strokes: P.strokes.concat(Pc.strokes), texts: TEXT, washes: SPEC.washes };
D.fit(bundle, 0.05, 8.7);
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



