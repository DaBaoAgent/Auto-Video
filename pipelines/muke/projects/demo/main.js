// muke · 木刻版画（黑白两色 + 刻线造明暗）
// 山脊上挑担子的人：白纸是天，黑块是山，山体受光面全靠刻线；人走在脊线上，剪影压在天空里。
// 只动：挑夫顺脊走、松针随风摆、两只鸟掠过、云刻线缓慢平移。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:muke:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;
const PAPER = '#f2ece0';
const INK = '#141414';

function lineTile(ang, gap, lw, rgb, alpha) {
  const s = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.strokeStyle = `rgba(${rgb},${alpha})`;
  g.lineWidth = lw;
  g.save();
  g.translate(s / 2, s / 2);
  g.rotate(ang);
  for (let d = -s; d <= s * 2; d += gap) { g.beginPath(); g.moveTo(-s, d); g.lineTo(s, d); g.stroke(); }
  g.restore();
  return cv;
}
const HATCH_W = ctx.createPattern(lineTile(Math.PI / 4, 7, 2.2, '242,236,224', 1), 'repeat');
const HATCH_K = ctx.createPattern(lineTile(-Math.PI / 4, 9, 1.6, '20,20,20', 0.85), 'repeat');

// 山脊线
function ridgeY(x) { return 566 - 118 * Math.sin(x * 0.00155 + 1.05) - 34 * Math.sin(x * 0.0042 + 0.4); }
function ridgePath() {
  ctx.beginPath();
  ctx.moveTo(-40, H + 40);
  for (let x = -40; x <= W + 40; x += 24) ctx.lineTo(x, ridgeY(x));
  ctx.lineTo(W + 40, H + 40);
  ctx.closePath();
}
function walkerPos(t) {
  const k = S.clamp(t / 10);
  const x = S.lerp(560, 1180, k);
  return { x, y: ridgeY(x) + Math.sin(t * 3.2) * 1.8, step: Math.sin(t * 5.0), bob: Math.sin(t * 6.3) * 3.4 };
}
const PINES = [
  { x: 300, y: 0, h: 300, s: 1.0 },
  { x: 402, y: 0, h: 226, s: 0.8 },
  { x: 1420, y: 0, h: 330, s: 1.06 },
  { x: 1532, y: 0, h: 244, s: 0.82 },
];

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // 白纸
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 云：两道细刻线（横过天空）
  ctx.fillStyle = HATCH_K;
  const cy1 = 232 + Math.sin(t * 0.4) * 5, cy2 = 300 + Math.sin(t * 0.33 + 1) * 5;
  [[60, 780, cy1, 26], [880, 1720, cy2, 18], [1180, 1900, 132, 14]].forEach(([x0, x1, y, h]) => {
    ctx.fillRect(x0, y, x1 - x0, h);
  });

  // 山体
  ridgePath();
  ctx.fillStyle = INK;
  ctx.fill();

  // 受光面：只填在山形里（先裁剪再铺刻线，免得出现直边）
  ctx.save();
  ridgePath();
  ctx.clip();
  ctx.fillStyle = HATCH_W;
  ctx.beginPath();
  ctx.moveTo(-40, ridgeY(-40));
  ctx.lineTo(880, ridgeY(880));
  ctx.lineTo(560, H + 40);
  ctx.lineTo(-40, H + 40);
  ctx.closePath();
  ctx.fill();
  // 山体内的等高刻线
  ctx.strokeStyle = 'rgba(242,236,224,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 30) {
      const y = ridgeY(x) + 60 + i * 62 + Math.sin(x * 0.003 + i) * 10;
      x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 脊线（一道白，人走在上面）
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 5;
  ctx.beginPath();
  for (let x = -40; x <= W + 40; x += 20) { x === -40 ? ctx.moveTo(x, ridgeY(x)) : ctx.lineTo(x, ridgeY(x)); }
  ctx.stroke();

  // 松（站在脊线上）
  PINES.forEach((p, i) => {
    const sway = Math.sin(t * 0.55 + i) * 3;
    const base = ridgeY(p.x) + 6;
    ctx.save();
    ctx.translate(p.x + sway, base);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.lineTo(5, -p.h * 0.7); ctx.lineTo(-5, -p.h * 0.7);
    ctx.closePath(); ctx.fill();
    for (let k = 0; k < 4; k++) {
      const yy = -p.h * (0.3 + k * 0.18);
      const w = p.h * (0.42 - k * 0.07);
      ctx.beginPath();
      ctx.moveTo(-w, yy);
      ctx.lineTo(0, yy - p.h * 0.26);
      ctx.lineTo(w * 0.94, yy + 5);
      ctx.lineTo(0, yy + 14);
      ctx.closePath(); ctx.fill();
    }
    // 针叶刻线
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 10; k++) {
      const yy = -p.h * (0.34 + (k % 4) * 0.15) + (k % 5) * 3;
      const xx = -p.h * 0.24 + (k % 5) * p.h * 0.1;
      ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 9, yy - 7); ctx.stroke();
    }
    ctx.restore();
  });

  // 挑夫（黑色剪影，走在白脊线上，压着天空）
  const w = walkerPos(t);
  ctx.save();
  ctx.translate(w.x, w.y + w.bob);
  ctx.scale(1.28, 1.28);
  ctx.rotate(-0.06);
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  // 扁担 + 两箩
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-104, -152); ctx.quadraticCurveTo(0, -176 + w.bob * 0.5, 104, -152); ctx.stroke();
  [[-104, -146], [104, -146]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x - 32, y); ctx.quadraticCurveTo(x, y + 56, x + 32, y);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = PAPER; ctx.lineWidth = 1.8;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 9, y - 1); ctx.lineTo(x + k * 7.8, y + 32); ctx.stroke(); }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, -152); ctx.lineTo(x, y + 1); ctx.stroke();
  });
  // 长衫身体（上宽下窄）
  ctx.beginPath();
  ctx.moveTo(-30, -148); ctx.lineTo(28, -148); ctx.lineTo(38, -30); ctx.lineTo(-40, -30);
  ctx.closePath(); ctx.fill();
  // 手臂：一手扶扁担
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(20, -140); ctx.lineTo(46, -162); ctx.stroke();
  // 头
  ctx.beginPath(); ctx.arc(-2, -176, 21, 0, TAU); ctx.fill();
  // 斗笠（罩住头顶，不留缝）
  ctx.beginPath();
  ctx.moveTo(-64, -184);
  ctx.quadraticCurveTo(-2, -244, 60, -184);
  ctx.lineTo(46, -178); ctx.lineTo(-46, -178);
  ctx.closePath(); ctx.fill();
  // 腿（迈步）
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(-16, -34); ctx.lineTo(-22 + w.step * 22, 4); ctx.lineTo(-16 + w.step * 40, 48);
  ctx.moveTo(11, -34); ctx.lineTo(18 - w.step * 22, 6); ctx.lineTo(13 - w.step * 40, 48);
  ctx.stroke();
  ctx.restore();

  // 鸟
  [[1240, 250, 1.0], [1330, 208, 0.78]].forEach(([bx, by, s], i) => {
    const x = bx + Math.sin(t * 0.9 + i) * 70 + t * 20;
    const y = by + Math.cos(t * 0.7 + i) * 9;
    const f = Math.sin(t * 4.2 + i * 2);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-24, 0); ctx.quadraticCurveTo(-7, -12 - f * 10, 5, 0);
    ctx.moveTo(5, 0); ctx.quadraticCurveTo(19, -12 - f * 10, 34, -2);
    ctx.stroke();
    ctx.restore();
  });

  // 前景一道黑边，收住画面
  ctx.fillStyle = INK;
  ctx.fillRect(0, H - 26, W, 26);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
