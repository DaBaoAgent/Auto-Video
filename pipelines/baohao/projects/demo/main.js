// baohao · 包豪斯几何（三原色 + 黑 + 纸白，圆、三角、方条在斜线上走）
// 场景《构成·正午》：红圆在半空转，蓝三角沿斜轨滑，黄条横着扫过去，网格和字永远压住角。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:baohao:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const BG = '#f2ece0';
const RED = '#d8352a';
const BLU = '#1f4fa8';
const YEL = '#f2b705';
const INK = '#111111';
const SANS = '"Helvetica Neue",Helvetica,Arial,sans-serif';

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---------- 网格（包豪斯的底） ----------
  ctx.strokeStyle = 'rgba(17,17,17,0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // ---------- 斜轨（一条黑斜线，所有形状挂在上面） ----------
  ctx.strokeStyle = INK;
  ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(-40, 900); ctx.lineTo(W + 40, 420); ctx.stroke();

  // 斜轨上滑动的蓝三角
  {
    const p = 0.5 + 0.5 * Math.sin(t * 0.55 - 0.6);
    const x = S.lerp(260, 1500, p);
    const y = S.lerp(886, 452, p);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.48);
    ctx.fillStyle = BLU;
    ctx.beginPath();
    ctx.moveTo(0, -150); ctx.lineTo(130, 86); ctx.lineTo(-130, 86);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------- 红圆：转着，切掉一块（构成感） ----------
  ctx.save();
  ctx.translate(1120, 470);
  ctx.rotate(t * 0.5);
  ctx.fillStyle = RED;
  ctx.beginPath(); ctx.arc(0, 0, 300, 0, TAU); ctx.fill();
  // 切掉一刀（用纸色盖一段扇形）
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.arc(0, 0, 320, -0.28 + Math.sin(t * 0.9) * 0.06, 0.18);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // 红圆里的一根黑弧
  ctx.save();
  ctx.translate(1120, 470);
  ctx.rotate(-t * 0.22);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 16;
  ctx.beginPath(); ctx.arc(0, 0, 214, 0.2, 2.2); ctx.stroke();
  ctx.restore();

  // ---------- 黄条：横着扫 ----------
  {
    const p = S.ease(S.clamp((t - 0.6) / 6.5, 0, 1));
    const x = S.lerp(-520, 900, p);
    ctx.fillStyle = YEL;
    ctx.fillRect(x, 760, 760, 96);
    // 黄条上的一条黑短横
    ctx.fillStyle = INK;
    ctx.fillRect(x + 40, 786, 240, 16);
  }

  // ---------- 黑方块（左上的配重） ----------
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, 210, 210);
  // 黑块里的白圆
  ctx.fillStyle = BG;
  ctx.beginPath(); ctx.arc(105, 105, 56, 0, TAU); ctx.fill();

  // ---------- 右下：小圆点阵列 ----------
  for (let i = 0; i < 5; i++) {
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = (i + k) % 3 === 0 ? RED : 'rgba(17,17,17,0.5)';
      ctx.beginPath(); ctx.arc(1580 + k * 58, 860 + i * 58, 12, 0, TAU); ctx.fill();
    }
  }

  // ---------- 字 ----------
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.font = `700 700px ${SANS}`;
  // 只取一个字母当构图元素
  ctx.globalAlpha = 0.06;
  ctx.fillText('b', 250, 900);
  ctx.globalAlpha = 1;

  ctx.font = `700 60px ${SANS}`;
  ctx.fillText('bauhaus', 254, 300);
  ctx.font = `500 24px ${SANS}`;
  ctx.fillStyle = 'rgba(17,17,17,0.7)';
  ctx.fillText('WEIMAR  ·  1919  ·  FORM  FOLLOWS  FUNCTION', 256, 342);

  // 竖排的字（右侧）
  ctx.save();
  ctx.translate(1840, 240);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = INK;
  ctx.font = `700 46px ${SANS}`;
  try { ctx.letterSpacing = '10px'; } catch (e) {}
  ctx.fillText('KUNST', 0, 0);
  ctx.fillStyle = RED;
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText('UND  TECHNIK', 0, 44);
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  ctx.restore();

  // 左下角的小标注
  ctx.fillStyle = INK;
  ctx.font = `700 30px ${SANS}`;
  ctx.fillText('NO. 03', 254, 1010);
  ctx.font = `500 22px ${SANS}`;
  ctx.fillStyle = 'rgba(17,17,17,0.6)';
  ctx.fillText('BLAU  ·  ROT  ·  GELB', 400, 1010);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
