// ruishi · 瑞士动态排版（模数网格、无衬线、左对齐、红当唯一的标点）
// 场景《正午十二点四十五》：大号数字走时间，红方块在网格上按节拍跳格，细线永远对齐。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:ruishi:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const BG = '#f3f1ea';
const INK = '#141414';
const RED = '#e2372c';
const GREY = '#8d8a83';

// 网格：12 栏 × 6 行
const M = { l: 96, t: 84, r: W - 96, b: H - 84 };
const COL = (M.r - M.l) / 12;
const ROW = (M.b - M.t) / 6;
const SANS = '"Helvetica Neue",Helvetica,Arial,"Source Han Sans SC",sans-serif';

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---------- 模数网格（很淡，但对齐） ----------
  ctx.strokeStyle = 'rgba(20,20,20,0.14)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= 12; c++) {
    const x = M.l + c * COL;
    ctx.beginPath(); ctx.moveTo(x, M.t - 20); ctx.lineTo(x, M.b + 20); ctx.stroke();
  }
  for (let r = 0; r <= 6; r++) {
    const y = M.t + r * ROW;
    ctx.beginPath(); ctx.moveTo(M.l - 20, y); ctx.lineTo(M.r + 20, y); ctx.stroke();
  }
  // 一条实心黑规（版式的骨头）
  ctx.fillStyle = INK;
  ctx.fillRect(M.l, M.t, 6, ROW * 2);

  // ---------- 时间：12:45 → 12:46 ----------
  const step = Math.min(9, Math.floor(t / 1.1));
  const mm = 45 + step;
  const hh = 12 + Math.floor(mm / 60);
  const sec = Math.floor((t % 1.1) * 60);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;

  // 大数字：时
  const F = `700 260px ${SANS}`;
  const BASE = M.t + ROW * 2.5;
  ctx.font = F;
  ctx.fillText(String(hh), M.l + 40, BASE);
  // 冒号（红，跟着秒闪）
  ctx.fillStyle = RED;
  const blink = 0.5 + 0.5 * Math.sin(t * 6.4);
  ctx.globalAlpha = 0.4 + blink * 0.6;
  ctx.font = `700 200px ${SANS}`;
  ctx.fillText(':', M.l + 348, BASE - 8);
  ctx.globalAlpha = 1;

  // 分：换数字时做一次竖直滚切
  const p = S.clamp((t % 1.1) / 0.34, 0, 1);
  const ep = S.ease(p);
  const prevY = BASE - ep * 170;
  const newY = BASE + (1 - ep) * 170;
  ctx.save();
  ctx.beginPath();
  ctx.rect(M.l + 430, M.t + 30, 460, ROW * 2.7);
  ctx.clip();
  ctx.font = F;
  if (ep < 0.97) {
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.16;
    ctx.fillText(String((mm + 59) % 60).padStart(2, '0'), M.l + 430, prevY);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = INK;
  ctx.fillText(String(mm % 60).padStart(2, '0'), M.l + 430, newY);
  ctx.restore();

  // 秒：小号，跟在右边
  ctx.fillStyle = GREY;
  ctx.font = `500 44px ${SANS}`;
  ctx.fillText(String(sec).padStart(2, '0'), M.l + 860, BASE - 6);

  // ---------- 上方：两行说明字 ----------
  ctx.fillStyle = INK;
  ctx.font = `700 54px ${SANS}`;
  ctx.fillText('正 午 十 二 点', M.l + 40, M.t + 62);
  ctx.fillStyle = GREY;
  ctx.font = `400 26px ${SANS}`;
  ctx.fillText('ZÜRICH  ·  MITTAG  ·  MODULAR GRID  ·  12 / 45', M.l + 40, M.t + 104);

  // ---------- 红方块：按拍子跳格 ----------
  const beat = Math.floor(t * 2) % 12;
  const bx = M.l + beat * COL + 6;
  const by = M.b - ROW * 0.9;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.rect(bx, by, COL - 12, 88);
  ctx.fill();
  // 跳格落点的一条竖线
  ctx.globalAlpha = 0.25;
  ctx.fillRect(bx + COL - 12, by - 260, 2, 348);
  ctx.globalAlpha = 1;

  // ---------- 右下：柱状节拍 ----------
  const barX = M.r - COL * 4;
  for (let i = 0; i < 16; i++) {
    const h = (0.12 + 0.7 * Math.abs(Math.sin(i * 0.8 + t * 2.2))) * ROW * 1.4;
    ctx.fillStyle = i % 5 === 0 ? RED : 'rgba(20,20,20,0.72)';
    ctx.fillRect(barX + i * 24, M.b - 96 - h, 14, h);
  }
  ctx.fillStyle = GREY;
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText('TAKT', barX, M.b - 66);

  // ---------- 左下一道长的红规 ----------
  ctx.fillStyle = RED;
  ctx.fillRect(M.l, H - 60, S.clamp(t / 4.5) * COL * 12, 12);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
