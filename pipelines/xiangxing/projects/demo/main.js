// xiangxing · 象形运动图形（机场／地铁里那种图标语言：粗线条、圆头、无细节）
// 场景《晨跑五公里》：图标小人沿着路线跑，路标一个个亮过去，里程数字往上跳。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:xiangxing:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const BG = '#f4f1e8';
const NAVY = '#123049';
const ORANGE = '#e8792c';
const GREY = '#a9b0b4';

// 图标小人：头、躯干、四肢，全是圆头的粗线
function figure(x, y, s, ph, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = col;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const sw = 12;
  ctx.lineWidth = sw;
  // 头
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(0, -96, 17, 0, TAU); ctx.fill();
  // 躯干
  ctx.beginPath(); ctx.moveTo(0, -76); ctx.lineTo(2 + ph * 3, -18); ctx.stroke();
  // 手臂
  ctx.beginPath();
  ctx.moveTo(0, -66);
  ctx.lineTo(22 + ph * 8, -46);
  ctx.lineTo(30 + ph * 6, -22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -66);
  ctx.lineTo(-22 - ph * 8, -50);
  ctx.lineTo(-30 - ph * 6, -26);
  ctx.stroke();
  // 腿（前后交替）
  ctx.beginPath();
  ctx.moveTo(2, -18);
  ctx.lineTo(24 + ph * 14, 20);
  ctx.lineTo(34 + ph * 16, 58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(2, -18);
  ctx.lineTo(-16 - ph * 12, 16);
  ctx.lineTo(-24 - ph * 18, 58);
  ctx.stroke();
  ctx.restore();
}
// 树、楼、旗这些图标
function treeIcon(x, y, s, col) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-30, 0); ctx.lineTo(0, -74); ctx.lineTo(30, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(-5, 0, 10, 22);
  ctx.restore();
}
function towerIcon(x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(244,241,232,0.9)';
  for (let r = 0; r < Math.floor(h / 34); r++) {
    for (let c = 0; c < Math.floor(w / 30); c++) {
      ctx.fillRect(x + 10 + c * 30, y + 16 + r * 34, 12, 14);
    }
  }
}

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---------- 背景：城市图标剪影 ----------
  ctx.globalAlpha = 0.16;
  const city = [[120, 520, 74, 250], [206, 470, 60, 300], [278, 560, 96, 210], [390, 520, 66, 250],
    [1400, 500, 84, 270], [1494, 546, 64, 224], [1570, 470, 78, 300], [1660, 530, 96, 240], [1770, 500, 70, 270]];
  city.forEach(([x, y, w, h]) => towerIcon(x, y, w, h, NAVY));
  [[470, 700, 1.0], [1330, 700, 0.9], [1810, 690, 0.8]].forEach(([x, y, s]) => treeIcon(x, y, s, NAVY));
  ctx.globalAlpha = 1;

  // ---------- 跑道 / 路线 ----------
  const Y = 830;
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, Y + 22, W, 8);
  ctx.fillStyle = 'rgba(18,48,73,0.28)';
  for (let i = 0; i < 48; i++) {
    ctx.fillRect(i * 42 + (t * 40 % 42), Y + 6, 20, 4);
  }

  // ---------- 路标：一个个亮过去 ----------
  for (let k = 0; k < 5; k++) {
    const km = (k + 1);
    const x = 240 + k * 360;
    const lit = S.clamp((t - (0.9 + k * 1.5)) / 0.5, 0, 1);
    // 杆
    ctx.fillStyle = NAVY;
    ctx.fillRect(x - 6, Y - 240, 12, 240);
    // 牌
    ctx.fillStyle = lit > 0.5 ? ORANGE : 'rgba(18,48,73,0.5)';
    ctx.beginPath();
    ctx.rect(x - 84, Y - 330, 168, 96);
    ctx.fill();
    ctx.fillStyle = lit > 0.5 ? BG : 'rgba(244,241,232,0.7)';
    ctx.font = '700 44px "Helvetica Neue",Arial,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KM ' + km, x, Y - 264);
    ctx.textAlign = 'left';
  }

  // ---------- 里程数字 ----------
  const dist = (t * 0.5).toFixed(1);
  ctx.font = '700 150px "Helvetica Neue",Arial,sans-serif';
  const dw = ctx.measureText(dist).width;
  ctx.fillStyle = NAVY;
  ctx.fillText(dist, 130, 250);
  ctx.font = '700 46px "Helvetica Neue",Arial,sans-serif';
  ctx.fillStyle = ORANGE;
  ctx.fillText('KM', 130 + dw + 22, 244);

  // 标题行
  ctx.fillStyle = NAVY;
  ctx.font = '700 40px "Helvetica Neue",Arial,sans-serif';
  ctx.fillText('MORNING RUN', 132, 300);
  ctx.fillStyle = 'rgba(18,48,73,0.55)';
  ctx.font = '500 24px "Helvetica Neue",Arial,sans-serif';
  ctx.fillText('起点 → 5.0 KM → 终点', 134, 336);

  // ---------- 跑者：三个图标小人错开跑 ----------
  const runners = [[0, 1.0, 1.0], [-0.16, 1.0, 0.82], [-0.32, 1.0, 0.68]];
  runners.forEach(([lag, sp, sc], i) => {
    const p = ((t * 0.42 + lag + 1) % 1);
    const x = -120 + p * (W + 260);
    const bob = Math.abs(Math.sin(t * 4 + i)) * 8;
    figure(x, Y + 14 - bob, sc * 1.15, Math.sin(t * 4 + i * 0.9), NAVY);
    // 跑的短横线（速度感）
    if (i === 0) {
      ctx.strokeStyle = 'rgba(232,121,44,0.6)';
      ctx.lineWidth = 5;
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x - 44 - k * 22, Y - 60 + k * 18);
        ctx.lineTo(x - 74 - k * 22, Y - 60 + k * 18);
        ctx.stroke();
      }
    }
  });

  // 终点格子旗（在最后一段出现）
  {
    const x = 1760, y = Y - 120;
    ctx.fillStyle = NAVY;
    ctx.fillRect(x, y, 8, 120);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 5; c++) {
        ctx.fillStyle = (r + c) % 2 ? BG : NAVY;
        ctx.fillRect(x + 8 + c * 18, y + r * 18, 18, 18);
      }
    }
  }

  // 底部：一排小图标（说明这套图标语言）
  const icons = ['run', 'walk', 'bike', 'water', 'exit'];
  icons.forEach((n, i) => {
    const x = 300 + i * 300, y = 1000;
    ctx.fillStyle = i === 0 ? ORANGE : 'rgba(18,48,73,0.35)';
    if (n === 'run') figure(x, y, 0.42, Math.sin(t * 4), i === 0 ? ORANGE : GREY);
    else if (n === 'walk') figure(x, y, 0.42, 0.15, 'rgba(18,48,73,0.35)');
    else if (n === 'bike') {
      ctx.strokeStyle = 'rgba(18,48,73,0.35)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.arc(x - 26, y - 12, 18, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 26, y - 12, 18, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 26, y - 12); ctx.lineTo(x, y - 44); ctx.lineTo(x + 26, y - 12); ctx.stroke();
    } else if (n === 'water') {
      ctx.fillStyle = 'rgba(18,48,73,0.35)';
      ctx.beginPath(); ctx.moveTo(x, y - 56); ctx.quadraticCurveTo(x + 28, y - 16, x, y); ctx.quadraticCurveTo(x - 28, y - 16, x, y - 56); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(18,48,73,0.35)';
      ctx.fillRect(x - 30, y - 56, 60, 56);
      ctx.fillStyle = BG;
      ctx.fillRect(x - 8, y - 30, 16, 30);
    }
  });
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
