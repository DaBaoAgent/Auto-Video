// siyin · 丝印旅行海报（块色油印：纸是本底，几块油墨压上去，套版略微错位）
// 场景《海岸公路》：红敞篷车沿悬崖公路往东开，海面一条条白浪，太阳红盘挂在奶油色的天上。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:siyin:v5' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const PAPER = '#f5efdf';
const BLUE = '#1f5f9e';
const DEEP = '#123a5e';
const TEAL = '#2c8a7a';
const RED = '#dd4327';
const OCHRE = '#dda45a';
const INK = '#173039';

function off(i, t) {
  const settle = S.clamp(1 - t / 2.4, 0, 1);
  const a = i * 2.1;
  return [Math.sin(a + t * 2.4) * 2.8 * settle, Math.cos(a + t * 1.9) * 2.4 * settle];
}
function layer(i, t, fn) {
  const [ox, oy] = off(i, t);
  ctx.save();
  ctx.translate(ox, oy);
  fn();
  ctx.restore();
}

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  // 纸的颗粒（很轻）
  ctx.fillStyle = 'rgba(178,162,132,0.09)';
  for (let i = 0; i < 820; i++) ctx.fillRect((i * 2137) % W, (i * 1471) % H, 2, 2);

  const HZ = 402;
  const cam = 1.0 + t * 0.0035;

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(cam, cam);
  ctx.translate(-W / 2, -H / 2);

  // ---------- 红版：太阳（先落盘，和天也不压） ----------
  layer(0, t, () => {
    const sx = 1470, sy = 232, sr = 112;
    ctx.fillStyle = RED;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, TAU); ctx.fill();
    // 太阳下方的海面反光（红短杠）
    ctx.fillStyle = RED;
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = 0.5 - i * 0.06;
      ctx.beginPath();
      ctx.ellipse(sx + Math.sin(t * 1.1 + i) * 10, HZ + 12 + i * 18, 96 - i * 12, 4, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  // ---------- 蓝版：海 ----------
  layer(1, t, () => {
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.moveTo(-60, HZ - 6);
    ctx.quadraticCurveTo(700, HZ - 26, 1300, HZ - 8);
    ctx.lineTo(W + 60, HZ + 6);
    ctx.lineTo(W + 60, 640);
    ctx.quadraticCurveTo(900, 690, -60, 700);
    ctx.closePath(); ctx.fill();
    // 深海的一条
    ctx.fillStyle = DEEP;
    ctx.beginPath();
    ctx.moveTo(-60, HZ + 66); ctx.lineTo(W + 60, HZ + 76);
    ctx.lineTo(W + 60, 560); ctx.lineTo(-60, 548);
    ctx.closePath(); ctx.fill();
  });

  // 白浪
  ctx.fillStyle = PAPER;
  for (let i = 0; i < 24; i++) {
    const row = i % 6;
    const y = HZ + 20 + row * 22;
    const w = 58 + (i % 4) * 30;
    const x = ((i * 173 + t * (14 + row * 5)) % (W + 320)) - 160;
    ctx.beginPath(); ctx.ellipse(x, y, w, 3.6, 0, 0, TAU); ctx.fill();
  }

  // ---------- 赭版：右侧崖 + 左侧沙地 ----------
  layer(2, t, () => {
    ctx.fillStyle = '#e8c187';
    // 沙滩：海和公路之间的一条
    ctx.beginPath();
    ctx.moveTo(-60, 636); ctx.lineTo(1180, 640);
    ctx.lineTo(1216, 820);
    ctx.quadraticCurveTo(600, 900, -60, 948);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = OCHRE;
    // 崖体：带折角的岬
    ctx.beginPath();
    ctx.moveTo(1216, 820);
    ctx.lineTo(1236, 706);
    ctx.lineTo(1262, 664);
    ctx.lineTo(1244, 594);
    ctx.lineTo(1296, 520);
    ctx.lineTo(1310, 402);
    ctx.lineTo(1420, 340);
    ctx.lineTo(1560, 288);
    ctx.lineTo(1700, 250); ctx.lineTo(W + 60, 224);
    ctx.lineTo(W + 60, H + 60); ctx.lineTo(1180, H + 60);
    ctx.closePath(); ctx.fill();
  });

  // ---------- 深色版：公路 ----------
  layer(3, t, () => {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-60, 900);
    ctx.quadraticCurveTo(420, 838, 900, 806);
    ctx.quadraticCurveTo(1400, 774, W + 60, 742);
    ctx.lineTo(W + 60, 838);
    ctx.quadraticCurveTo(1400, 884, 900, 918);
    ctx.quadraticCurveTo(420, 962, -60, H + 60);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 8;
    ctx.setLineDash([60, 44]);
    ctx.beginPath();
    ctx.moveTo(-60, 958); ctx.quadraticCurveTo(420, 908, 900, 876);
    ctx.quadraticCurveTo(1400, 846, W + 60, 812);
    ctx.stroke();
    ctx.setLineDash([]);
    // 崖根的一道暗边，压住公路和崖的接缝
    ctx.fillStyle = DEEP;
    ctx.beginPath();
    ctx.moveTo(1230, 700); ctx.lineTo(1240, 470);
    ctx.lineTo(1252, 470); ctx.lineTo(1244, 704);
    ctx.closePath(); ctx.fill();
  });

  // ---------- 红版：车 ----------
  layer(4, t, () => {
    const cx = 300 + t * 108;
    const cy = 852 - t * 3.4;
    ctx.save();
    ctx.translate(cx, cy);
    // 车身
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.moveTo(-196, 6); ctx.lineTo(-186, -44);
    ctx.quadraticCurveTo(-150, -58, -76, -60);
    ctx.quadraticCurveTo(-46, -60, -34, -84);
    ctx.quadraticCurveTo(-14, -118, 54, -120);
    ctx.quadraticCurveTo(108, -118, 128, -74);
    ctx.quadraticCurveTo(140, -58, 174, -54);
    ctx.quadraticCurveTo(192, -50, 196, -24);
    ctx.lineTo(196, 6);
    ctx.closePath(); ctx.fill();
    // 座舱：奶油色的开口
    ctx.fillStyle = PAPER;
    ctx.beginPath();
    ctx.moveTo(-36, -66); ctx.quadraticCurveTo(-14, -110, 50, -112);
    ctx.lineTo(52, -66); ctx.closePath(); ctx.fill();
    // 挡风玻璃的一道青
    ctx.fillStyle = 'rgba(44,138,122,0.55)';
    ctx.beginPath();
    ctx.moveTo(54, -112); ctx.quadraticCurveTo(104, -108, 122, -72);
    ctx.lineTo(56, -72); ctx.closePath(); ctx.fill();
    // 轮
    [-124, 110].forEach((wx) => {
      ctx.fillStyle = INK;
      ctx.beginPath(); ctx.arc(wx, 10, 38, 0, TAU); ctx.fill();
      ctx.fillStyle = PAPER;
      ctx.beginPath(); ctx.arc(wx, 10, 13, 0, TAU); ctx.fill();
      ctx.strokeStyle = PAPER; ctx.lineWidth = 4.5;
      const rot = t * 10;
      for (let k = 0; k < 3; k++) {
        const a = rot + k * TAU / 3;
        ctx.beginPath();
        ctx.moveTo(wx + Math.cos(a) * 14, 10 + Math.sin(a) * 14);
        ctx.lineTo(wx + Math.cos(a) * 33, 10 + Math.sin(a) * 33);
        ctx.stroke();
      }
    });
    // 司机 + 帽
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(-18, -92, 16, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-18, -105, 29, 8, -0.1, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-34, -80); ctx.quadraticCurveTo(-18, -72, 0, -80); ctx.lineTo(0, -64); ctx.lineTo(-34, -64);
    ctx.closePath(); ctx.fill();
    // 乘客的丝巾（飘）
    ctx.beginPath();
    ctx.moveTo(34, -104); ctx.quadraticCurveTo(78, -108, 104 + Math.sin(t * 6.5) * 8, -88 + Math.cos(t * 5) * 5);
    ctx.lineTo(96, -78); ctx.quadraticCurveTo(64, -90, 36, -88);
    ctx.closePath(); ctx.fill();
    // 车头灯
    ctx.fillStyle = OCHRE;
    ctx.beginPath(); ctx.arc(190, -30, 9, 0, TAU); ctx.fill();
    ctx.restore();
  });

  // ---------- 青版：棕榈 ----------
  layer(5, t, () => {
    const palms = [[250, 1010, 1.0, 0], [1440, 690, 0.86, 1], [1690, 640, 0.62, 2]];
    palms.forEach(([px, py, s, i]) => {
      const sway = Math.sin(t * 0.9 + i) * 4;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(s, s);
      ctx.fillStyle = TEAL;
      ctx.beginPath();
      ctx.moveTo(-13, 0); ctx.quadraticCurveTo(-2 + sway, -170, 15 + sway * 2, -350);
      ctx.lineTo(33 + sway * 2, -346); ctx.quadraticCurveTo(14 + sway, -162, 13, 0);
      ctx.closePath(); ctx.fill();
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k - 3) * 0.44;
        const L = 196;
        ctx.beginPath();
        ctx.moveTo(24 + sway * 2, -350);
        ctx.quadraticCurveTo(24 + Math.cos(a) * L * 0.6, -350 + Math.sin(a) * L * 0.6 - 30,
          24 + Math.cos(a) * L, -350 + Math.sin(a) * L * 0.9 + 50);
        ctx.quadraticCurveTo(24 + Math.cos(a) * L * 0.5, -350 + Math.sin(a) * L * 0.45 + 16, 24, -350);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = INK;
      [[2, -338], [24, -316], [40, -340]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); });
      ctx.restore();
    });
    // 沙滩上的草
    ctx.strokeStyle = TEAL; ctx.lineWidth = 5;
    for (let i = 0; i < 20; i++) {
      const x = 40 + i * 32, y = 960 + (i % 5) * 24;
      const sw = Math.sin(t * 2.4 + i) * 8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 0.4, y - 28, x + sw, y - 52); ctx.stroke();
    }
  });

  // 海鸥（白身黑翅）
  [[700, 200, 0.9], [880, 158, 0.66]].forEach(([bx, by, s], i) => {
    const x = bx + t * 22 - 90, y = by + Math.sin(t * 1.4 + i) * 12;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    const f = Math.sin(t * 5 + i);
    ctx.beginPath();
    ctx.moveTo(-30, 2); ctx.quadraticCurveTo(-10, -12 - f * 10, 4, 2);
    ctx.moveTo(4, 2); ctx.quadraticCurveTo(18, -12 - f * 10, 36, -2);
    ctx.stroke();
    ctx.restore();
  });

  // ---------- 海报字 ----------
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.font = '700 78px "Source Han Sans SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  ctx.fillText('海 岸 公 路', 140, 176);
  ctx.font = '500 28px "Helvetica Neue",Arial,sans-serif';
  ctx.fillStyle = 'rgba(23,48,57,0.72)';
  ctx.fillText('COAST ROAD  ·  SUMMER 1983', 146, 220);
  ctx.textAlign = 'right';
  ctx.fillStyle = PAPER;
  ctx.font = '600 26px "Helvetica Neue",Arial,sans-serif';
  ctx.fillText('KM 07', W - 150, 1010);
  ctx.textAlign = 'left';

  ctx.restore();

  const vg = ctx.createRadialGradient(W / 2, H / 2, 440, W / 2, H / 2, 1180);
  vg.addColorStop(0, 'rgba(60,50,30,0)');
  vg.addColorStop(1, 'rgba(60,50,30,0.26)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
