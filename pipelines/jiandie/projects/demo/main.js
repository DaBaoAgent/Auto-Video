// jiandie · 60s 间谍片头（黑底、金／奶油色、聚光、剪影、旋转的刻度环、颗粒）
// 场景《档案 07》：戴礼帽的男人走进光里又走出去，字母从暗处一片片推上来，留声机似的划痕。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:jiandie:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const BG = '#0a0b0e';
const GOLD = '#c8a35a';
const CREAM = '#ece5d3';

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---------- 底：一圈刻度环 ----------
  ctx.save();
  ctx.translate(960, 470);
  ctx.rotate(t * 0.09);
  ctx.strokeStyle = 'rgba(200,163,90,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 430, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, 0, 396, 0, TAU); ctx.stroke();
  for (let k = 0; k < 72; k++) {
    const a = k / 72 * TAU;
    const long = k % 6 === 0;
    ctx.strokeStyle = long ? 'rgba(200,163,90,0.55)' : 'rgba(200,163,90,0.24)';
    ctx.lineWidth = long ? 3 : 1.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 396, Math.sin(a) * 396);
    ctx.lineTo(Math.cos(a) * (long ? 372 : 384), Math.sin(a) * (long ? 372 : 384));
    ctx.stroke();
  }
  ctx.restore();
  // 反向的内环
  ctx.save();
  ctx.translate(960, 470);
  ctx.rotate(-t * 0.16);
  ctx.strokeStyle = 'rgba(236,229,211,0.18)';
  ctx.lineWidth = 2;
  ctx.setLineDash([26, 18]);
  ctx.beginPath(); ctx.arc(0, 0, 300, 0, TAU); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // ---------- 聚光：三道斜着扫的光锥 ----------
  for (let i = 0; i < 3; i++) {
    const a = -1.15 + i * 0.34 + Math.sin(t * 0.5 + i * 2) * 0.09;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, W * 0.9, H * 0.7);
    g.addColorStop(0, `rgba(200,163,90,${0.16 + i * 0.03})`);
    g.addColorStop(1, 'rgba(200,163,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(760 + i * 90, -60);
    ctx.lineTo(1140 + i * 60, -60);
    ctx.lineTo(1140 + Math.tan(a) * 900 + 260, 1000);
    ctx.lineTo(760 + Math.tan(a) * 900 - 260, 1000);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // 地面的一滩光
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const pg = ctx.createRadialGradient(980, 960, 30, 980, 960, 520);
  pg.addColorStop(0, 'rgba(236,229,211,0.24)');
  pg.addColorStop(1, 'rgba(236,229,211,0)');
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.ellipse(980, 960, 620, 130, 0, 0, TAU); ctx.fill();
  ctx.restore();

  // ---------- 人物：礼帽 + 风衣，走进来又走出 ----------
  {
    const p = S.clamp(t / 10, 0, 1);
    const x = S.lerp(560, 1400, p);
    const step = Math.sin(t * 4.2);
    const y = 966 + Math.abs(step) * 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#04050a';
    // 腿
    ctx.lineWidth = 22; ctx.strokeStyle = '#04050a'; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-16, -180); ctx.lineTo(-22 + step * 30, -96); ctx.lineTo(-26 + step * 46, -6);
    ctx.moveTo(18, -180); ctx.lineTo(24 - step * 30, -98); ctx.lineTo(28 - step * 46, -6);
    ctx.stroke();
    // 风衣
    ctx.beginPath();
    ctx.moveTo(-52, -318); ctx.lineTo(44, -318);
    ctx.quadraticCurveTo(64, -250, 66 + Math.sin(t * 3.4) * 8, -150);
    ctx.lineTo(48, -104); ctx.lineTo(-52, -104);
    ctx.quadraticCurveTo(-64, -220, -52, -318);
    ctx.closePath(); ctx.fill();
    // 风衣下摆被风带开
    ctx.beginPath();
    ctx.moveTo(-52, -150); ctx.quadraticCurveTo(-96 - Math.sin(t * 3) * 16, -110, -86, -60);
    ctx.lineTo(-40, -104); ctx.closePath(); ctx.fill();
    // 肩膀 + 手臂
    ctx.lineWidth = 20;
    ctx.beginPath(); ctx.moveTo(-44, -300); ctx.lineTo(-60, -200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(36, -300); ctx.lineTo(64, -212); ctx.stroke();
    // 头
    ctx.beginPath(); ctx.arc(-2, -356, 30, 0, TAU); ctx.fill();
    // 帽檐 + 帽筒
    ctx.beginPath();
    ctx.ellipse(-2, -376, 68, 12, -0.04, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-38, -376); ctx.lineTo(-32, -420);
    ctx.quadraticCurveTo(-2, -432, 28, -420);
    ctx.lineTo(34, -376);
    ctx.closePath(); ctx.fill();
    // 金牌的轮廓光（面向光的那一侧）
    ctx.strokeStyle = 'rgba(200,163,90,0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(44, -318); ctx.quadraticCurveTo(64, -250, 66, -150); ctx.lineTo(48, -104);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(-2, -356, 30, -1.5, 1.4); ctx.stroke();
    ctx.restore();
  }

  // ---------- 字：档案 07 ----------
  const p = S.clamp((t - 1.2) / 3.2, 0, 1);
  ctx.save();
  ctx.textAlign = 'left';
  // 大标题：一个个字母推上来
  const title = 'DOSSIER';
  ctx.font = '700 132px Georgia,"Times New Roman",serif';
  try { ctx.letterSpacing = '14px'; } catch (e) {}
  ctx.globalAlpha = S.ease(p);
  ctx.fillStyle = CREAM;
  ctx.fillText(title, 360, 288);
  ctx.globalAlpha = 1;
  try { ctx.letterSpacing = '0px'; } catch (e) {}
  // 金线
  ctx.fillStyle = GOLD;
  ctx.fillRect(360, 322, S.clamp((t - 1.6) / 2) * 520, 4);
  // 07
  const q7 = S.clamp((t - 3.2) / 2.2, 0, 1);
  ctx.globalAlpha = q7;
  ctx.font = '700 210px Georgia,"Times New Roman",serif';
  ctx.fillStyle = GOLD;
  ctx.fillText('07', 360, 520);
  ctx.globalAlpha = 1;
  // 中文副题
  const qs = S.clamp((t - 4.2) / 2.0, 0, 1);
  ctx.globalAlpha = qs;
  ctx.fillStyle = 'rgba(236,229,211,0.86)';
  ctx.font = '500 38px "Source Han Sans SC","Microsoft YaHei",sans-serif';
  ctx.fillText('档  案  第  零  七  号', 366, 600);
  ctx.globalAlpha = 1;
  // 小字
  ctx.globalAlpha = S.clamp((t - 5) / 1.5, 0, 1);
  ctx.fillStyle = 'rgba(200,163,90,0.8)';
  ctx.font = '500 22px "Helvetica Neue",Arial,sans-serif';
  ctx.fillText('A  FILM  NOIR  ·  1963  ·  EYES  ONLY', 366, 646);
  ctx.globalAlpha = 1;
  ctx.restore();

  // ---------- 胶片味：颗粒 + 划痕 + 轻微闪烁 ----------
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let i = 0; i < 1200; i++) ctx.fillRect((i * 2953 + t * 700) % W, (i * 1739) % H, 2, 2);
  // 竖向划痕
  for (let i = 0; i < 3; i++) {
    const x = 300 + i * 620 + Math.sin(t * 3 + i) * 6;
    ctx.fillStyle = 'rgba(236,229,211,0.05)';
    ctx.fillRect(x, 0, 2, H);
  }
  // 光晕（左上暖）
  const lg = ctx.createRadialGradient(420, 160, 40, 420, 160, 720);
  lg.addColorStop(0, 'rgba(200,163,90,0.16)');
  lg.addColorStop(1, 'rgba(200,163,90,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);

  // 暗角
  const vg = ctx.createRadialGradient(W / 2, 520, 320, W / 2, 520, 1120);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // 片门的一条边（上下黑边）
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, 26);
  ctx.fillRect(0, H - 26, W, 26);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
