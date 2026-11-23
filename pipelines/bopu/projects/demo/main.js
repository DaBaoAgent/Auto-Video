// bopu · 波普艺术（本戴点 + 粗黑边 + 纯色块，全是广告里的那种甜）
// 场景《午后汽水》：红罐子立在黄底红点前，拉环蹦出去，气泡一路往上冒，右上角炸出一朵 POP。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:bopu:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const YEL = '#ffd23f';
const RED = '#e63a26';
const BLU = '#1d63b3';
const CRM = '#fbf3dd';
const INK = '#111111';

function dotsTile(bg, col, gap, r) {
  const s = 40;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, s, s);
  g.fillStyle = col;
  for (let y = 0; y < s; y += gap) {
    for (let x = 0; x < s; x += gap) {
      g.beginPath(); g.arc(x + (y / gap % 2) * (gap / 2), y, r, 0, TAU); g.fill();
    }
  }
  return cv;
}
const DOT_R = ctx.createPattern(dotsTile(YEL, RED, 20, 4.6), 'repeat');
const DOT_W = ctx.createPattern(dotsTile(CRM, 'rgba(230,58,38,0.55)', 18, 4.2), 'repeat');

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // ---------- 底：黄 + 红点（点阵慢慢走，画面就活了） ----------
  ctx.fillStyle = YEL;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(t * 6 % 40, 0);
  ctx.fillStyle = DOT_R;
  ctx.fillRect(-40, 0, W + 80, H);
  ctx.restore();

  // 左三分之一：蓝条 + 奶油条（波普的版式分割）
  ctx.fillStyle = BLU;
  ctx.fillRect(0, 0, 210, H);
  ctx.fillStyle = CRM;
  ctx.fillRect(210, 0, 46, H);

  // ---------- 台面 ----------
  ctx.fillStyle = CRM;
  ctx.beginPath();
  ctx.moveTo(0, 860); ctx.lineTo(W, 860); ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillRect(0, 856, W, 12);
  // 台面上的投影点阵
  ctx.save();
  ctx.beginPath(); ctx.ellipse(1000, 900, 420, 46, 0, 0, TAU); ctx.clip();
  ctx.fillStyle = DOT_W;
  ctx.fillRect(560, 850, 900, 100);
  ctx.restore();

  // ---------- 罐子 ----------
  const CAN = { x: 980, y: 560, w: 250, h: 480 };
  const tilt = Math.sin(t * 1.1) * 0.012;
  ctx.save();
  ctx.translate(CAN.x, CAN.y);
  ctx.rotate(tilt);
  // 罐身
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-CAN.w / 2, -CAN.h / 2, CAN.w, CAN.h, 34) :
    ctx.rect(-CAN.w / 2, -CAN.h / 2, CAN.w, CAN.h);
  ctx.fill();
  // 罐身银色上沿 / 下沿
  ctx.fillStyle = CRM;
  ctx.beginPath();
  ctx.moveTo(-CAN.w / 2 + 6, -CAN.h / 2 + 10);
  ctx.quadraticCurveTo(0, -CAN.h / 2 - 14, CAN.w / 2 - 6, -CAN.h / 2 + 10);
  ctx.lineTo(CAN.w / 2 - 6, -CAN.h / 2 + 46);
  ctx.quadraticCurveTo(0, -CAN.h / 2 + 24, -CAN.w / 2 + 6, -CAN.h / 2 + 46);
  ctx.closePath(); ctx.fill();
  // 罐身标签：蓝带 + 白字
  ctx.fillStyle = BLU;
  ctx.fillRect(-CAN.w / 2 + 6, -46, CAN.w - 12, 132);
  ctx.fillStyle = CRM;
  ctx.textAlign = 'center';
  ctx.font = '700 62px "Helvetica Neue",Arial,sans-serif';
  ctx.fillText('SODA', 0, 52);
  ctx.font = '500 22px "Helvetica Neue",Arial,sans-serif';
  ctx.fillText('ICE COLD', -2, 84);
  // 白高光（一条竖的亮边）
  ctx.fillStyle = 'rgba(251,243,221,0.55)';
  ctx.beginPath();
  ctx.moveTo(-CAN.w / 2 + 22, -CAN.h / 2 + 60);
  ctx.lineTo(-CAN.w / 2 + 62, -CAN.h / 2 + 60);
  ctx.lineTo(-CAN.w / 2 + 44, CAN.h / 2 - 20);
  ctx.lineTo(-CAN.w / 2 + 12, CAN.h / 2 - 20);
  ctx.closePath(); ctx.fill();
  // 黑描边
  ctx.strokeStyle = INK;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-CAN.w / 2, -CAN.h / 2, CAN.w, CAN.h, 34) :
    ctx.rect(-CAN.w / 2, -CAN.h / 2, CAN.w, CAN.h);
  ctx.stroke();
  // 罐口椭圆
  ctx.fillStyle = CRM;
  ctx.beginPath();
  ctx.ellipse(0, -CAN.h / 2 + 4, CAN.w / 2 - 10, 26, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, -CAN.h / 2 + 4, CAN.w / 2 - 10, 26, 0, 0, TAU); ctx.stroke();
  // 拉环口
  ctx.fillStyle = '#8b8b8b';
  ctx.beginPath();
  ctx.ellipse(18, -CAN.h / 2 + 4, 40, 14, 0.06, 0, TAU); ctx.fill();
  ctx.restore();

  // ---------- 拉环飞出去 ----------
  {
    const p = S.clamp((t - 1.5) / 2.4, 0, 1);
    if (p > 0 && p < 1) {
      const x = CAN.x + 26 + p * 300;
      const y = CAN.y - 250 - Math.sin(p * 2.4) * 140 + p * p * 200;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p * 14);
      ctx.fillStyle = '#9a9a9a';
      ctx.beginPath(); ctx.ellipse(0, 0, 40, 16, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- 气泡 ----------
  for (let i = 0; i < 26; i++) {
    const seed = i * 1.37;
    const p = ((t * (0.32 + (i % 5) * 0.06)) + i / 26) % 1;
    const x = CAN.x + Math.sin(seed + p * 5) * (120 - p * 60);
    const y = (CAN.y - 240) - p * 700;
    const r = 9 + (i % 4) * 6 - p * 3;
    ctx.fillStyle = 'rgba(251,243,221,0.82)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.36, r * 0.26, 0, TAU); ctx.fill();
  }

  // ---------- 吸管 ----------
  ctx.save();
  ctx.translate(CAN.x + 30, CAN.y - 210);
  ctx.rotate(-0.22 + Math.sin(t * 1.4) * 0.03);
  for (let k = 0; k < 5; k++) {
    ctx.fillStyle = k % 2 ? CRM : RED;
    ctx.fillRect(-16, -250 + k * 50, 32, 50);
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.strokeRect(-16, -250, 32, 250);
  ctx.restore();

  // ---------- 爆炸字 ----------
  {
    const p = S.clamp((t - 1.4) / 0.5, 0, 1);
    if (p > 0) {
      const sc = 0.55 + S.ease(p) * 0.5 + Math.sin(t * 3) * 0.012;
      const bx = 1380, by = 300;
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(sc, sc);
      ctx.rotate(-0.12);
      // 星形
      ctx.fillStyle = YEL;
      ctx.beginPath();
      for (let k = 0; k < 26; k++) {
        const a = k / 26 * TAU;
        const rr = k % 2 ? 150 : 232;
        k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.stroke();
      // 字
      ctx.fillStyle = RED;
      ctx.font = '900 132px "Helvetica Neue",Arial,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POP!', 0, 46);
      ctx.strokeStyle = INK; ctx.lineWidth = 6;
      ctx.strokeText('POP!', 0, 46);
      ctx.restore();
    }
  }

  // ---------- 角落的字 ----------
  ctx.textAlign = 'left';
  ctx.fillStyle = CRM;
  ctx.font = '700 40px "Helvetica Neue",Arial,sans-serif';
  ctx.save();
  ctx.translate(58, 620);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('SODA · 1963', 0, 0);
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.font = '700 34px "Helvetica Neue",Arial,sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('5¢', W - 150, 1010);
  ctx.textAlign = 'left';

  // 一点印刷网点的颗粒
  ctx.fillStyle = 'rgba(17,17,17,0.045)';
  for (let i = 0; i < 700; i++) ctx.fillRect((i * 2731) % W, (i * 1811) % H, 2, 2);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
