// wushi · 50 年代扁平卡通 —— 站点 10 秒样片《客厅圆舞曲》
//
// UPA 式扁平客厅：芥末黄/青绿/砖红/奶白，色块故意错位一点，纸上有颗粒；
// 扫地机器人 Pip 沿地面巡游，沙发靠垫、灯罩、挂画都跟着 120BPM 的拍子做有限动画跳，
// 最后猫跳上 Pip 一起巡出画外。逐帧确定性绘制。
const SPEC = {
  id: 'wushi',
  seed: 'av:wushi',
  family: 'cel',
  w: 1920,
  h: 1080,
  bg: '#f2e4c6',
  label: { zh: '50s 扁平卡通', en: '50s Flat Cartoon', station: '04 · 卡通动画' }
};

const ENV = STYLEKIT.page(document.getElementById('c'), { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });
const K = STYLEKIT;
const W = ENV.W, H = ENV.H, ctx = ENV.ctx;
const clamp = K.clamp, lerp = K.lerp, ease = K.ease, shade = K.shade, rgba = K.rgba, mix = K.mixHex;

const P = {
  ink: '#2a2320',
  cream: '#f4e6c6',
  cream2: '#e7d5b0',
  must: '#e3ad3c',
  must2: '#c9902a',
  teal: '#3f9e94',
  teal2: '#2c7a72',
  brick: '#c1543e',
  brick2: '#9b3c2c',
  olive: '#8a8a5e',
  gray: '#8f877a',
  white: '#faf3e0',
  night: '#241f1c'
};

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ink(fill, stroke, lw) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 5; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function beat(t) {
  const p = (t * 2) % 1;
  return Math.pow(1 - p, 2);
}

const floorY = H * 0.760;

// ---------- 房间 ----------
function drawRoom(t) {
  ctx.fillStyle = P.cream;
  ctx.fillRect(0, 0, W, H);
  // 墙上一大块芥末黄拱形
  ctx.fillStyle = P.must;
  ctx.beginPath();
  ctx.moveTo(W * 0.06, floorY);
  ctx.lineTo(W * 0.06, H * 0.30);
  ctx.quadraticCurveTo(W * 0.30, H * 0.02, W * 0.54, H * 0.30);
  ctx.lineTo(W * 0.54, floorY);
  ctx.closePath();
  ctx.fill();
  // 墙面横条
  ctx.fillStyle = rgba(P.teal, 0.95);
  ctx.fillRect(0, H * 0.19, W, H * 0.026);
  ctx.fillStyle = rgba(P.brick, 0.95);
  ctx.fillRect(0, H * 0.216, W, H * 0.011);

  // 地板
  ctx.fillStyle = P.cream2;
  ctx.fillRect(0, floorY, W, H - floorY);
  ctx.fillStyle = rgba(P.gray, 0.35);
  ctx.fillRect(0, floorY, W, 6);
  ctx.strokeStyle = rgba(P.gray, 0.28);
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    const x = -W * 0.1 + i * W * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, floorY);
    ctx.lineTo(x + W * 0.10, H);
    ctx.stroke();
  }

  // 地毯
  const rx = W * 0.47, ry = H * 0.912, rw = W * 0.40, rh = H * 0.082;
  ctx.fillStyle = P.brick;
  ctx.beginPath(); ctx.ellipse(rx, ry, rw, rh, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba('#f0c9a8', 0.9);
  ctx.beginPath(); ctx.ellipse(rx, ry, rw * 0.86, rh * 0.80, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.brick;
  ctx.beginPath(); ctx.ellipse(rx, ry, rw * 0.66, rh * 0.58, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba('#f0c9a8', 0.9);
  ctx.beginPath(); ctx.ellipse(rx, ry, rw * 0.30, rh * 0.26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.teal2;
  for (let i = -4; i <= 4; i++) {
    const cx = rx + i * rw * 0.16;
    ctx.beginPath();
    ctx.moveTo(cx, ry - rh * 0.10);
    ctx.lineTo(cx + rw * 0.045, ry + rh * 0.16);
    ctx.lineTo(cx - rw * 0.045, ry + rh * 0.16);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------- 窗 ----------
function drawWindow(t) {
  const x = W * 0.655, y = H * 0.155, w = W * 0.245, h = H * 0.40;
  ctx.fillStyle = P.teal;
  ctx.fillRect(x - 14, y - 14, w + 28, h + 28);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#d8ecdf');
  g.addColorStop(1, '#a9cfc4');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // 窗外小房子
  ctx.fillStyle = rgba(P.teal2, 0.5);
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.62);
  ctx.lineTo(x + w * 0.2, y + h * 0.46);
  ctx.lineTo(x + w * 0.4, y + h * 0.62);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(P.brick, 0.45);
  ctx.fillRect(x + w * 0.52, y + h * 0.52, w * 0.30, h * 0.14);
  // 百叶
  const slats = 9;
  for (let i = 0; i < slats; i++) {
    const sy = y + 10 + i * (h - 20) / slats;
    ctx.fillStyle = rgba('#f6efdd', 0.92);
    ctx.fillRect(x + 4, sy, w - 8, (h - 20) / slats * 0.62);
    ctx.fillStyle = rgba(P.gray, 0.22);
    ctx.fillRect(x + 4, sy + (h - 20) / slats * 0.62, w - 8, 3);
  }
  // 窗帘
  ctx.fillStyle = P.teal2;
  ctx.beginPath();
  ctx.moveTo(x - 26, y - 30);
  ctx.lineTo(x + 8, y - 30);
  ctx.quadraticCurveTo(x + 30, y + h * 0.5, x + 4, y + h + 20);
  ctx.lineTo(x - 40, y + h + 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.18);
  ctx.fillRect(x - 20, y - 18, 14, h + 26);
  // 光斑
  ctx.fillStyle = rgba('#fff6d6', 0.26);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h);
  ctx.lineTo(x + w * 0.9, y + h);
  ctx.lineTo(x + w * 0.4, floorY);
  ctx.lineTo(x - w * 0.2, floorY);
  ctx.closePath();
  ctx.fill();
}

// ---------- 挂画 ----------
function drawPicture(t) {
  const cxp = W * 0.335, cyp = H * 0.245, w = W * 0.105, h = H * 0.145;
  const tilt = Math.sin(Math.floor(t * 2) * Math.PI) * 0.06 * beat(t);
  ctx.save();
  ctx.translate(cxp, cyp);
  ctx.rotate(tilt);
  ctx.fillStyle = P.white;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = P.teal;
  ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
  ctx.fillStyle = P.must;
  ctx.beginPath(); ctx.arc(-w * 0.12, h * 0.02, w * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.brick;
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.22);
  ctx.lineTo(w * 0.24, h * 0.22);
  ctx.lineTo(w * 0.15, -h * 0.10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

// ---------- 落地灯 ----------
function drawLamp(t) {
  const lx = W * 0.085, base = floorY;
  const pulse = 0.62 + 0.38 * beat(t);
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(lx, base); ctx.lineTo(lx, H * 0.33); ctx.stroke();
  ctx.fillStyle = P.ink;
  ctx.beginPath(); ctx.ellipse(lx, base, W * 0.045, H * 0.014, 0, 0, Math.PI * 2); ctx.fill();
  const shadeR = Math.sin(t * 2 * Math.PI) * 0.05 * beat(t);
  ctx.save();
  ctx.translate(lx, H * 0.325);
  ctx.rotate(shadeR);
  ctx.fillStyle = P.white;
  ctx.beginPath();
  ctx.moveTo(-W * 0.052, 0);
  ctx.lineTo(W * 0.052, 0);
  ctx.lineTo(W * 0.075, H * 0.105);
  ctx.lineTo(-W * 0.075, H * 0.105);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = rgba(P.must, 0.55);
  ctx.fillRect(-W * 0.048, H * 0.008, W * 0.096, H * 0.012);
  ctx.restore();
  const g = ctx.createRadialGradient(lx, H * 0.40, 6, lx, H * 0.40, H * 0.40);
  g.addColorStop(0, rgba('#fff3c8', 0.50 * pulse));
  g.addColorStop(0.5, rgba('#ffe9a8', 0.14 * pulse));
  g.addColorStop(1, rgba('#ffe9a8', 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(lx, H * 0.40, H * 0.40, 0, Math.PI * 2); ctx.fill();
}

// ---------- 沙发 ----------
function drawSofa(t) {
  const bx = W * 0.105, bw = W * 0.355;
  const top = floorY - H * 0.295;
  const b = beat(t);
  // 地面投影
  ctx.fillStyle = rgba(P.ink, 0.16);
  ctx.beginPath(); ctx.ellipse(bx + bw * 0.5, floorY + 6, bw * 0.55, H * 0.020, 0, 0, Math.PI * 2); ctx.fill();
  // 靠背
  ctx.fillStyle = P.must2;
  rr(bx + W * 0.030, top, bw - W * 0.060, H * 0.210, 22); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
  // 靠背分格
  ctx.strokeStyle = rgba(P.ink, 0.35); ctx.lineWidth = 3;
  [1 / 3, 2 / 3].forEach((fx) => {
    ctx.beginPath();
    ctx.moveTo(bx + bw * fx, top + 8);
    ctx.lineTo(bx + bw * fx, top + H * 0.200);
    ctx.stroke();
  });
  ctx.fillStyle = rgba('#ffffff', 0.14);
  rr(bx + W * 0.045, top + 8, bw - W * 0.090, H * 0.022, 10); ctx.fill();
  // 靠背软垫（内嵌一条）
  ctx.fillStyle = rgba(P.must, 0.55);
  rr(bx + W * 0.052, top + H * 0.032, bw - W * 0.104, H * 0.095, 16); ctx.fill();
  ctx.strokeStyle = rgba(P.ink, 0.30); ctx.lineWidth = 3; ctx.stroke();
  // 座垫
  ctx.fillStyle = P.must;
  rr(bx, top + H * 0.190, bw, H * 0.085, 16); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
  // 两块座垫
  [0.0, 0.5].forEach((fx) => {
    ctx.fillStyle = rgba(P.must, 1);
    rr(bx + W * 0.012 + bw * fx, top + H * 0.196, bw * 0.5 - W * 0.024, H * 0.050, 10); ctx.fill();
    ctx.strokeStyle = rgba(P.ink, 0.25); ctx.lineWidth = 2; ctx.stroke();
  });
  // 座垫分界线
  ctx.strokeStyle = rgba(P.ink, 0.45); ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(bx + bw * 0.5, top + H * 0.192);
  ctx.lineTo(bx + bw * 0.5, top + H * 0.272);
  ctx.stroke();
  // 扶手
  [bx, bx + bw - W * 0.058].forEach((ax) => {
    ctx.fillStyle = P.must;
    rr(ax, top + H * 0.105, W * 0.058, H * 0.175, 18); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = rgba('#ffffff', 0.18);
    rr(ax + 8, top + H * 0.114, W * 0.040, H * 0.030, 12); ctx.fill();
  });
  // 靠垫（随拍子跳）
  [0.16, 0.34].forEach((fx, i) => {
    const jump = -Math.abs(Math.sin(t * Math.PI * 2 + i * 0.4)) * H * 0.014 * b;
    ctx.save();
    ctx.translate(bx + bw * fx, top + H * 0.120 + jump);
    ctx.rotate(i ? 0.10 : -0.08);
    ctx.fillStyle = i ? P.teal : P.brick;
    rr(-W * 0.052, -H * 0.062, W * 0.104, H * 0.105, 14); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = rgba('#ffffff', 0.35); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-W * 0.042, -H * 0.050); ctx.lineTo(W * 0.042, -H * 0.050); ctx.stroke();
    ctx.restore();
  });
  // 沙发脚
  [bx + W * 0.028, bx + bw - W * 0.048].forEach((fx) => {
    ctx.fillStyle = P.ink;
    ctx.fillRect(fx, top + H * 0.268, W * 0.016, H * 0.030);
  });
}

// ---------- 边桌 ----------
function drawTable(t) {
  const tx = W * 0.800, ty = floorY - H * 0.150;
  ctx.fillStyle = P.teal;
  rr(tx, ty, W * 0.140, H * 0.022, 8); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = P.ink;
  [tx + W * 0.018, tx + W * 0.112].forEach((px) => ctx.fillRect(px, ty + H * 0.02, 8, H * 0.150));
  // 茶杯
  const bx = tx + W * 0.045, by = ty - H * 0.010;
  ctx.fillStyle = P.white;
  rr(bx, by - H * 0.048, W * 0.036, H * 0.050, 6); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  ctx.beginPath(); ctx.arc(bx + W * 0.038, by - H * 0.024, W * 0.011, -1.2, 1.2); ctx.stroke();
  for (let i = 0; i < 2; i++) {
    const lf = ((t * 0.6 + i * 0.5) % 1);
    ctx.strokeStyle = rgba(P.gray, 0.28 * (1 - lf));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx + W * 0.012 + i * W * 0.010, by - H * 0.052);
    ctx.quadraticCurveTo(bx + W * 0.020, by - H * 0.052 - lf * H * 0.05,
      bx + W * 0.004, by - H * 0.052 - lf * H * 0.09);
    ctx.stroke();
  }
  // 盆栽
  const px = tx + W * 0.118, py = ty;
  ctx.fillStyle = P.brick;
  ctx.beginPath();
  ctx.moveTo(px - W * 0.020, py);
  ctx.lineTo(px + W * 0.020, py);
  ctx.lineTo(px + W * 0.015, py + H * 0.042);
  ctx.lineTo(px - W * 0.015, py + H * 0.042);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  const sway = Math.sin(t * 2 * Math.PI) * 0.06 * beat(t);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(sway);
  for (let i = -2; i <= 2; i++) {
    ctx.fillStyle = i % 2 ? P.teal2 : P.olive;
    ctx.beginPath();
    ctx.ellipse(i * W * 0.009, -H * 0.030 - Math.abs(i) * H * 0.011, W * 0.012, H * 0.032, i * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- 茶几 ----------
function drawCoffeeTable(t) {
  const cx2 = W * 0.300, cy2 = H * 0.848, w = W * 0.230, h = H * 0.020;
  // 投影
  ctx.fillStyle = rgba(P.ink, 0.14);
  ctx.beginPath(); ctx.ellipse(cx2, cy2 + H * 0.070, w * 0.55, H * 0.020, 0, 0, Math.PI * 2); ctx.fill();
  // 腿
  ctx.fillStyle = P.ink;
  [[-0.070, 0.075], [0.070, 0.075]].forEach(([dx, dy]) => {
    ctx.fillRect(cx2 + W * dx * 0.5 - 5, cy2, 9, H * dy);
  });
  // 台面
  ctx.fillStyle = P.white;
  ctx.beginPath(); ctx.ellipse(cx2, cy2, w * 0.5, h, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = rgba(P.teal, 0.55);
  ctx.beginPath(); ctx.ellipse(cx2, cy2 - 4, w * 0.44, h * 0.80, 0, 0, Math.PI * 2); ctx.fill();
  // 书
  ctx.fillStyle = P.brick;
  ctx.save();
  ctx.translate(cx2 - w * 0.14, cy2 - h * 0.6);
  ctx.rotate(-0.12);
  ctx.fillRect(-W * 0.045, -H * 0.012, W * 0.090, H * 0.020);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(-W * 0.045, -H * 0.012, W * 0.090, H * 0.020);
  ctx.fillStyle = rgba('#fff3d0', 0.9);
  ctx.fillRect(-W * 0.030, -H * 0.009, W * 0.012, H * 0.014);
  ctx.restore();
  // 小盘子 + 饼干
  ctx.fillStyle = P.teal2;
  ctx.beginPath(); ctx.ellipse(cx2 + w * 0.20, cy2 - h * 0.9, w * 0.085, h * 0.75, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = P.must;
  ctx.beginPath(); ctx.ellipse(cx2 + w * 0.20, cy2 - h * 1.15, w * 0.038, h * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
}
function drawCat(t) {
  if (t < 6.55) {
    const x = W * 0.425, y = floorY - H * 0.295;
    const tailK = Math.sin(t * 6);
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-W * 0.020, -H * 0.044);
    ctx.quadraticCurveTo(-W * 0.055, -H * 0.070 + tailK * H * 0.010, -W * 0.050, -H * 0.098 + tailK * H * 0.016);
    ctx.stroke();
    ctx.fillStyle = P.night;
    ctx.beginPath(); ctx.ellipse(0, -H * 0.043, W * 0.032, H * 0.045, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.008, -H * 0.092, W * 0.027, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-W * 0.014, -H * 0.108); ctx.lineTo(-W * 0.020, -H * 0.140); ctx.lineTo(W * 0.002, -H * 0.114);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W * 0.024, -H * 0.108); ctx.lineTo(W * 0.030, -H * 0.140); ctx.lineTo(W * 0.010, -H * 0.114);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = P.must;
    ctx.beginPath(); ctx.ellipse(W * 0.004, -H * 0.094, W * 0.007, H * 0.008, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.019, -H * 0.094, W * 0.007, H * 0.008, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  // 跳上 Pip，跟着巡游出画
  const vy = vacuumY(t), vx = vacuumX(t);
  const hop = clamp((t - 6.55) / 0.5);
  const apex = Math.sin(hop * Math.PI) * H * 0.11;
  const x = lerp(W * 0.440, vx + W * 0.006, ease(hop));
  const y = lerp(floorY - H * 0.295, vy - H * 0.036, ease(hop)) - apex;
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 9) * 3);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-W * 0.018, -H * 0.038);
  ctx.quadraticCurveTo(-W * 0.046, -H * 0.074 + Math.sin(t * 7) * H * 0.010, -W * 0.028, -H * 0.100);
  ctx.stroke();
  ctx.fillStyle = P.night;
  ctx.beginPath(); ctx.ellipse(0, -H * 0.034, W * 0.030, H * 0.042, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.006, -H * 0.082, W * 0.023, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-W * 0.012, -H * 0.096); ctx.lineTo(-W * 0.020, -H * 0.122); ctx.lineTo(-W * 0.000, -H * 0.100);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W * 0.018, -H * 0.096); ctx.lineTo(W * 0.026, -H * 0.122); ctx.lineTo(W * 0.006, -H * 0.100);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.must;
  ctx.beginPath(); ctx.ellipse(W * 0.002, -H * 0.084, W * 0.006, H * 0.007, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W * 0.016, -H * 0.084, W * 0.006, H * 0.007, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------- 扫地机 Pip ----------
function vacuumX(t) {
  if (t < 1.6) return lerp(-W * 0.14, W * 0.30, ease(t / 1.6));
  if (t < 3.15) return lerp(W * 0.30, W * 0.60, (t - 1.6) / 1.55);
  if (t < 3.80) return W * 0.60 - Math.sin((t - 3.15) / 0.65 * Math.PI * 2) * W * 0.014;
  if (t < 5.2) return lerp(W * 0.60, W * 0.40, ease((t - 3.80) / 1.4));
  if (t < 7.0) return W * 0.40 + Math.sin((t - 5.2) / 1.2 * Math.PI * 2) * W * 0.028;
  return W * 0.40 + (W * 1.26 - W * 0.40) * clamp((t - 7.0) / 2.9);
}
function vacuumY(t) {
  const bump = (t > 3.15 && t < 3.80) ? Math.abs(Math.sin((t - 3.15) / 0.65 * Math.PI * 2)) * H * 0.022 : 0;
  return floorY - H * 0.010 - bump;
}

function drawPip(t) {
  const x = vacuumX(t), y = vacuumY(t);
  const dir = (t > 3.75 && t < 6.6) ? -1 : 1;
  const s = W * 0.072;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = rgba(P.ink, 0.16);
  ctx.beginPath(); ctx.ellipse(0, H * 0.010, s * 0.92, H * 0.011, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.teal;
  ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = P.teal2;
  ctx.beginPath(); ctx.ellipse(0, -s * 0.09, s * 0.90, s * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.white;
  ctx.beginPath(); ctx.arc(dir * s * 0.24, -s * 0.11, s * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  const blink = (t > 4.3 && t < 4.42) || (t > 8.3 && t < 8.42);
  ctx.fillStyle = P.ink;
  if (!blink) {
    ctx.beginPath(); ctx.arc(dir * s * 0.29, -s * 0.13, s * 0.042, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(dir * s * 0.15, -s * 0.13, s * 0.042, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillRect(dir * s * 0.21, -s * 0.135, s * 0.16, s * 0.018);
  }
  ctx.fillStyle = P.must;
  ctx.beginPath(); ctx.ellipse(-dir * s * 0.78, s * 0.08, s * 0.15, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const k = ((t * 1.6 + i * 0.25) % 1);
    ctx.fillStyle = rgba(P.gray, 0.32 * (1 - k));
    ctx.beginPath();
    ctx.arc(-dir * (s * 0.9 + k * s * 0.7), s * 0.03 - k * s * 0.10, 3 + k * 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- 纸纹与调色 ----------
function grade(t) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = rgba('#ffe9c0', 0.10);
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const v = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.36, W * 0.5, H * 0.5, H * 1.0);
  v.addColorStop(0, rgba('#000000', 0));
  v.addColorStop(1, rgba('#3a2a14', 0.28));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  const r = K.rng('wu:grain' + Math.floor(t * 12));
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = rgba(r() > 0.5 ? '#ffffff' : '#6b5a3a', 0.05);
    ctx.fillRect(r() * W, r() * H, 2, 2);
  }
}

window.renderAt = (t) => {
  ENV.reset();
  drawRoom(t);
  drawWindow(t);
  drawPicture(t);
  drawLamp(t);
  drawSofa(t);
  drawCoffeeTable(t);
  drawTable(t);
  drawCat(t);
  drawPip(t);
  grade(t);
};

drawRoom(0); drawWindow(0); drawPicture(0); drawLamp(0); drawSofa(0); drawTable(0); drawCat(0); drawPip(0); grade(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
