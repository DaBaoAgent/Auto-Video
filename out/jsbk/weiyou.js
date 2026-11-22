// weiyou · 微游戏快闪 —— 站点 10 秒样片《六连快闪》
//
// 一支 10 秒里连切 6 个一屏小游戏：接星、跳岩浆、拍钉子、躲炮弹、抹黄油、按红按钮。
// 每个关卡约 1.55 秒，同一只圆滚滚的橙色小角色贯穿始终，HUD 计时条一路掉，
// 最后一关砸下红按钮，满屏 CLEAR 彩带。厚描边 + 高饱和平涂，手机小游戏的观感。
const SPEC = {
  id: 'weiyou',
  seed: 'av:weiyou',
  family: 'flat',
  w: 1920,
  h: 1080,
  label: { zh: '微游戏快闪', en: 'Micro Game Flash', station: '04 · 卡通动画' }
};

const ENV = STYLEKIT.page(document.getElementById('c'), { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });
const K = STYLEKIT;
const W = ENV.W, H = ENV.H, ctx = ENV.ctx;
const clamp = K.clamp, lerp = K.lerp, ease = K.ease, shade = K.shade, rgba = K.rgba;

const STAGES = 6;
const SEG = 1.55;           // 每关时长
const TOTAL = SEG * STAGES; // 9.3s
const INK = '#12141f';      // 统一描边色

function rr(x, y, w, h, r, fill, lw) {
  ctx.beginPath();
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }
}
function circle(x, y, r, fill, lw) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = INK; ctx.stroke(); }
}
function text(str, x, y, size, fill, align, weight) {
  ctx.save();
  ctx.font = `${weight || 900} ${size}px "Arial Black", "Microsoft YaHei", "Segoe UI", sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = size * 0.14;
  ctx.strokeStyle = INK;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(str, x, y);
  ctx.restore();
}

// ---------- 主角：橙色圆球小人 ----------
// pose: 0 站 / 1 举双手 / 2 蹲 / 3 前倾
function mascot(x, y, s, pose, look, wob) {
  const sq = wob === undefined ? 1 : wob;
  const bodyR = 0.26 * s * sq;
  const cy = y - 0.50 * s;
  const legSwing = pose === 3 ? 0.06 : 0;
  // 腿（露在身体下面）
  rr(x - 0.16 * s - legSwing * s, y - 0.19 * s, 0.13 * s, 0.20 * s, 0.05 * s, '#f7b23c', 0.042 * s);
  rr(x + 0.03 * s + legSwing * s, y - 0.19 * s, 0.13 * s, 0.20 * s, 0.05 * s, '#f7b23c', 0.042 * s);
  // 身体
  circle(x, cy, bodyR * 1.25, '#ff8a3d', 0.045 * s);
  // 肚皮
  circle(x, cy + 0.05 * s, bodyR * 0.74, '#ffc46b');
  // 手臂
  const armA = pose === 1 ? -1.0 : pose === 2 ? 0.75 : 0.25;
  [[-1, armA], [1, pose === 2 ? 0.95 : armA]].forEach(([side, a]) => {
    const ax = x + side * bodyR * 1.15;
    const ay = cy - 0.02 * s;
    const len = 0.24 * s;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + side * 0.09 * s, ay + a * len);
    ctx.lineWidth = 0.085 * s;
    ctx.strokeStyle = '#f7b23c';
    ctx.stroke();
    circle(ax + side * 0.09 * s, ay + a * len, 0.058 * s, '#ff8a3d', 0.032 * s);
  });
  // 眼睛
  const eyeDx = 0.075 * s * (look === undefined ? 0 : look);
  [-1, 1].forEach((side) => {
    const ex = x + side * 0.088 * s - eyeDx;
    const ey = cy - 0.06 * s;
    circle(ex, ey, 0.070 * s, '#ffffff', 0.026 * s);
    circle(ex + side * 0.010 * s - eyeDx * 0.4, ey + 0.008 * s, 0.034 * s, INK);
    circle(ex + side * 0.024 * s, ey - 0.022 * s, 0.012 * s, '#ffffff');
  });
  // 嘴
  ctx.beginPath();
  ctx.arc(x - eyeDx * 0.5, cy + 0.075 * s, 0.05 * s, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.lineWidth = 0.026 * s;
  ctx.strokeStyle = INK;
  ctx.stroke();
}

// ---------- 背景零件 ----------
function drawStar(x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = k % 2 ? s * 0.52 : s;
    ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = Math.max(3, s * 0.09);
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

function sunburst(cx, cy, colA, colB, rot) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const a0 = (i / 16) * Math.PI * 2, a1 = ((i + 1) / 16) * Math.PI * 2;
    ctx.lineTo(Math.cos(a0) * 2600, Math.sin(a0) * 2600);
    ctx.lineTo(Math.cos(a1) * 2600, Math.sin(a1) * 2600);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? colA : colB;
    ctx.fill();
  }
  ctx.restore();
}
function ground(y, top, bottom, line) {
  ctx.fillStyle = top;
  ctx.fillRect(0, y, W, H - y);
  ctx.fillStyle = bottom;
  ctx.fillRect(0, y + H * 0.055, W, H - y);
  ctx.fillStyle = INK;
  ctx.fillRect(0, y - 8, W, 9);
  if (line) {
    ctx.fillStyle = line;
    ctx.fillRect(0, y + H * 0.055, W, 5);
  }
}

// ---------- 六个小关卡 ----------
const SKY_GROUND = 0.80 * H;

function stage1(u) {
  sunburst(W * 0.5, H * 0.42, '#4b2f86', '#412a76', u * 0.5);
  ground(SKY_GROUND, '#2a1d52', '#1b1340', '#6a49b8');
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 0.4 + u * 0.35) % 1.3 - 0.15) * W;
    const cy = H * (0.18 + i * 0.09);
    const s = W * (0.10 + i * 0.02);
    circle(cx, cy, s * 0.55, '#5b3f9c');
    circle(cx + s * 0.6, cy + s * 0.05, s * 0.4, '#5b3f9c');
    circle(cx - s * 0.6, cy + s * 0.08, s * 0.36, '#5b3f9c');
  }
  for (let i = 0; i < 5; i++) {
    const ph = (u * 1.6 + i / 5) % 1;
    const x = W * (0.22 + i * 0.14) + Math.sin(ph * 6 + i) * 26;
    const y = -40 + ph * (SKY_GROUND - 60);
    const s = 0.040 * W;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ph * 2.2);
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const rad = k % 2 ? s * 0.52 : s;
      ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd95e';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
  }
  const mx = W * 0.5 + Math.sin(u * 5.2) * W * 0.16;
  mascot(mx, SKY_GROUND, H * 0.34, 0, Math.sin(u * 5.2), 1 + Math.sin(u * 9) * 0.03);
  // 举在手上的那颗星
  const grab = clamp((u - 0.60) / 0.14);
  if (grab > 0) {
    const sy = SKY_GROUND - H * 0.36 - grab * H * 0.05;
    const sc = 0.6 + (1 - grab) * 0.4 + (u > 0.74 ? Math.sin(u * 40) * 0.05 : 0);
    drawStar(mx, sy, H * 0.055 * sc, '#ffd95e');
  }
  if (u > 0.78) {
    const p = (u - 0.78) / 0.22;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      circle(mx + Math.cos(a) * p * H * 0.16, SKY_GROUND - H * 0.34 + Math.sin(a) * p * H * 0.16, H * 0.022 * (1 - p) + 4, '#ffe970');
    }
    text('+100', mx + H * 0.14, SKY_GROUND - H * 0.50 - p * 40, H * 0.052, '#e9ff8a', 'left');
  }
}

function stage2(u) {
  ctx.fillStyle = '#26101a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3a1a26';
  for (let i = 0; i < 9; i++) {
    const x = i * W / 8;
    const h = H * (0.10 + (i % 3) * 0.05);
    ctx.beginPath();
    ctx.moveTo(x - 60, 0);
    ctx.lineTo(x + 60, 0);
    ctx.lineTo(x, h);
    ctx.closePath();
    ctx.fill();
  }
  const lavaY = H * 0.84;
  const lg = ctx.createLinearGradient(0, lavaY, 0, H);
  lg.addColorStop(0, '#ffb43a');
  lg.addColorStop(0.35, '#ff7a1e');
  lg.addColorStop(1, '#b8260c');
  ctx.fillStyle = lg;
  ctx.fillRect(0, lavaY, W, H - lavaY);
  // 表面起伏的亮边
  ctx.fillStyle = '#ffe08a';
  ctx.beginPath();
  for (let x = 0; x <= W; x += 40) {
    const y = lavaY + Math.sin(x / 90 + u * 6) * 7 + Math.sin(x / 40 - u * 4) * 3;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#ffe08a';
  ctx.stroke();
  // 流动的暗纹
  ctx.fillStyle = rgba('#e0440c', 0.55);
  for (let i = 0; i < 14; i++) {
    const x = ((i * 143 + u * 260) % (W + 300)) - 150;
    const y = lavaY + 24 + (i % 4) * ((H - lavaY - 34) / 4);
    ctx.beginPath();
    ctx.ellipse(x, y, 58 + (i % 3) * 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 气泡（升起后炸开）
  for (let i = 0; i < 6; i++) {
    const ph = (u * 2.2 + i / 6) % 1;
    const bx0 = W * (0.10 + i * 0.15) + Math.sin(u * 3 + i) * 20;
    const by0 = lavaY + 20 - ph * H * 0.08;
    const r0 = 10 + ph * 20;
    ctx.fillStyle = rgba('#ffd07a', 0.9 - ph * 0.5);
    ctx.beginPath();
    ctx.arc(bx0, by0, r0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = rgba('#ff9a3a', 0.9);
    ctx.stroke();
  }
  const pa = { x: W * 0.14, y: H * 0.68, w: W * 0.22 };
  const pb = { x: W * 0.64, y: H * 0.60, w: W * 0.24 };
  // 岩浆上方热浪
  const glow = ctx.createLinearGradient(0, lavaY - H * 0.20, 0, lavaY);
  glow.addColorStop(0, rgba('#ff6a1e', 0));
  glow.addColorStop(1, rgba('#ff8a2e', 0.35));
  ctx.fillStyle = glow;
  ctx.fillRect(0, lavaY - H * 0.20, W, H * 0.20);
  [pa, pb].forEach((p) => {
    // 石柱：下宽上窄，底部扎进岩浆
    ctx.beginPath();
    ctx.moveTo(p.x + 20, p.y + H * 0.02);
    ctx.lineTo(p.x + p.w - 20, p.y + H * 0.02);
    ctx.lineTo(p.x + p.w - 2, lavaY + 14);
    ctx.lineTo(p.x + p.w - 34, lavaY + 6);
    ctx.lineTo(p.x + p.w * 0.5, lavaY + 18);
    ctx.lineTo(p.x + 30, lavaY + 4);
    ctx.lineTo(p.x + 4, lavaY + 14);
    ctx.closePath();
    ctx.fillStyle = '#3a2531';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // 顶面
    rr(p.x, p.y - H * 0.018, p.w, H * 0.048, 8, '#5c3c48', 7);
    rr(p.x + 10, p.y - H * 0.016, p.w - 20, H * 0.013, 4, '#8f6674');
    // 柱身竖向石纹
    for (let i = 0; i < 4; i++) {
      const sx = p.x + 26 + i * (p.w - 52) / 3;
      ctx.strokeStyle = rgba('#1f121a', 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx, p.y + H * 0.05);
      ctx.lineTo(sx + (i % 2 ? 6 : -6), lavaY - H * 0.03);
      ctx.stroke();
    }
  });
  const jk = ease(clamp((u - 0.15) / 0.7));
  const x0 = pa.x + pa.w * 0.5, x1 = pb.x + pb.w * 0.5;
  const jx = lerp(x0, x1, jk);
  const jy = lerp(pa.y, pb.y, jk) - Math.sin(jk * Math.PI) * H * 0.16;
  const sq = 1 + (jk > 0.2 && jk < 0.8 ? 0.06 : -0.03);
  // 影子
  ctx.save();
  ctx.globalAlpha = 0.40;
  ctx.beginPath();
  ctx.ellipse(jx, lerp(pa.y, pb.y, jk) + 4, H * 0.075, H * 0.022, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.restore();
  mascot(jx, jy, H * 0.30, jk > 0.2 && jk < 0.9 ? 1 : 0, 1, sq);
  if (u < 0.22) {
    for (let i = 0; i < 5; i++) circle(x0 + (i - 2) * 26, pa.y - 10 - u * 30, 14 * (1 - u / 0.22), '#9a7a86');
  }
}

function stage3(u) {
  ctx.fillStyle = '#13304d';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = '#7fd4ff';
  ctx.lineWidth = 26;
  for (let i = -6; i < 14; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 180, H);
    ctx.lineTo(i * 180 + 300, 0);
    ctx.stroke();
  }
  ctx.restore();
  ground(H * 0.86, '#20415f', '#16324b', '#7fd4ff');
  const ax = W * 0.52, ay = H * 0.86;
  rr(ax - W * 0.11, ay - H * 0.10, W * 0.22, H * 0.10, 8, '#3d5c78', 8);
  rr(ax - W * 0.06, ay, W * 0.12, H * 0.10, 6, '#2b4560', 8);
  const hit = clamp((u - 0.42) / 0.08);
  const dip = hit * H * 0.05;
  rr(ax - 20, ay - H * 0.15 + dip, 40, H * 0.09, 6, '#cfd8e6', 7);
  rr(ax - 44, ay - H * 0.17 + dip, 88, 22, 6, '#eef4fb', 7);
  const mx = ax - W * 0.17;
  mascot(mx, ay, H * 0.34, u < 0.42 ? 1 : 1, 1, u < 0.42 ? 1.02 : 0.96);
  // 锤子：枢轴在他手上，举起 → 砸下
  const gripX = mx + 0.13 * H, gripY = ay - H * 0.30;
  const L = H * 0.20;
  const theta = u < 0.42
    ? lerp(-Math.PI * 0.30, -Math.PI * 0.16, clamp(u / 0.42))
    : lerp(-Math.PI * 0.16, 2.72, clamp((u - 0.42) / 0.07));
  ctx.save();
  ctx.translate(gripX, gripY);
  ctx.rotate(theta);
  // 柄
  ctx.fillStyle = '#8a5a2a';
  ctx.fillRect(-15, -L + 24, 30, L - 10);
  ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeRect(-15, -L + 24, 30, L - 10);
  // 锤头
  rr(-66, -L - 40, 132, 56, 10, '#9fb4c8', 8);
  rr(-54, -L - 34, 42, 16, 6, '#d6e4f0');
  ctx.restore();
  if (u > 0.42) {
    const p = clamp((u - 0.42) / 0.35);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.3;
      const d = p * H * 0.22;
      circle(ax + Math.cos(a) * d, ay - H * 0.15 + Math.sin(a) * d * 0.7, 9 * (1 - p) + 3, i % 2 ? '#ffe066' : '#ffffff');
    }
  }
  if (u < 0.42) text('!', ax + W * 0.02, ay - H * 0.28, H * 0.10, '#ffe066', 'center');
}

function stage4(u) {
  ctx.fillStyle = '#0d3a3c';
  ctx.fillRect(0, 0, W, H);
  for (let i = 5; i >= 0; i--) circle(W * 0.5, H * 0.52, H * (0.16 + i * 0.09), i % 2 ? '#11484a' : '#0f4042');
  ground(H * 0.84, '#173f2c', '#0f3021', '#63d0a8');
  const cx = W * 0.92, cy = H * 0.72;
  // 炮架 + 轮
  rr(cx - 80, cy + 6, 120, 66, 12, '#2c3b48', 8);
  circle(cx - 34, cy + 72, 36, '#22303a', 8);
  circle(cx - 34, cy + 72, 14, '#8fa8b8');
  // 炮管（朝左略抬）
  ctx.save();
  ctx.translate(cx - 46, cy - 6);
  ctx.rotate(-0.16);
  rr(-170, -32, 180, 62, 14, '#49626f', 8);
  rr(-178, -34, 30, 66, 10, '#233038', 7);
  rr(-150, -22, 120, 12, 6, '#6d8794');
  ctx.restore();
  // 炮口火光
  if (u > 0.10 && u < 0.28) {
    const p = (u - 0.10) / 0.18;
    for (let i = 0; i < 7; i++) {
      circle(cx - 232 - p * 70 * (0.5 + i * 0.22), cy - 24 + (i - 3) * 16, 30 * (1 - p) + 6, i % 2 ? '#ffd166' : '#fff0b0');
    }
  }
  // 铁球
  let bx = cx - 232, by = cy - 20;
  if (u > 0.22) {
    const p = clamp((u - 0.22) / 0.52);
    bx = lerp(cx - 232, W * 0.06, p);
    by = H * 0.64 - Math.sin(p * Math.PI) * H * 0.02;
  }
  // 运动拖尾
  if (u > 0.22 && u < 0.80) {
    for (let i = 1; i <= 4; i++) {
      const p2 = clamp((u - 0.22) / 0.52) - i * 0.035;
      if (p2 < 0) continue;
      circle(lerp(cx - 232, W * 0.06, p2), H * 0.64 - Math.sin(p2 * Math.PI) * H * 0.02, H * 0.06 - i * 6, rgba('#cfe6ee', 0.30 - i * 0.06));
    }
  }
  const duck = u > 0.36 && u < 0.80 ? 1 : 0;
  const mx = W * 0.30;
  mascot(mx, H * 0.84, duck ? H * 0.215 : H * 0.32, duck ? 2 : 0, -1, 1);
  if (u > 0.22) circle(bx, by, H * 0.072, '#38424f', 9);
  if (u > 0.80) {
    const p = (u - 0.80) / 0.20;
    for (let i = 0; i < 3; i++) circle(mx + H * 0.16 + i * 18, H * 0.60 - p * 56 - i * 14, 9, '#a8e6ff');
    text('SAFE', mx - H * 0.10, H * 0.46 - p * 20, H * 0.055, '#a8ffd0', 'left');
  }
}

function stage5(u) {
  ctx.fillStyle = '#f3d9a6';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = '#c9a469';
  ctx.lineWidth = 4;
  for (let x = 0; x < W; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.80); ctx.stroke(); }
  for (let y = 0; y < H * 0.80; y += 130) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#8a6642';
  ctx.fillRect(0, H * 0.80, W, H * 0.20);
  ctx.fillStyle = '#a87c52';
  ctx.fillRect(0, H * 0.80, W, 30);
  const tx = W * 0.33, ty = H * 0.80, tw = W * 0.32, th = H * 0.22;
  // 吐司：外壳焦边 + 内芯
  rr(tx, ty - th, tw, th, 30, '#c98a48', 9);
  rr(tx + 18, ty - th + 16, tw - 36, th - 30, 22, '#f8e4bb', 5);
  // 已经抹开的黄油（从左往右长）
  const spreadK = ease(clamp((u - 0.10) / 0.74));
  const bw = (tw - 76) * spreadK;
  if (bw > 8) {
    rr(tx + 38, ty - th + 34, bw, th - 62, 12, '#ffd54a', 5);
    rr(tx + 44, ty - th + 42, Math.max(4, bw - 12), th - 78, 8, '#ffe787');
  }
  // 刀：自己飘在吐司上，从左往右推着黄油走
  const handX = tx + 54 + spreadK * (tw - 108);
  const handY = ty - th + 40 + Math.sin(u * 18) * 6;
  ctx.save();
  ctx.translate(handX, handY);
  ctx.rotate(-0.10 + Math.sin(u * 18) * 0.05);
  rr(-H * 0.20, -H * 0.026, H * 0.26, H * 0.052, 6, '#d7dee8', 6);
  rr(-H * 0.20, -H * 0.026, H * 0.24, H * 0.014, 4, '#f1f5fa');
  rr(H * 0.06, -H * 0.032, H * 0.075, H * 0.064, 8, '#8a5a2a', 6);
  ctx.restore();
  // 刀刃下方一抹黄油被推开的光
  ctx.fillStyle = rgba('#fff3b0', 0.55);
  ctx.beginPath();
  ctx.ellipse(handX - H * 0.10, handY + H * 0.05, H * 0.10, H * 0.022, 0, 0, Math.PI * 2);
  ctx.fill();
  mascot(W * 0.16, ty, H * 0.28, 1, 1, 1 + Math.sin(u * 10) * 0.03);
  // 香味小星
  for (let i = 0; i < 4; i++) {
    const ph = (u * 1.8 + i / 4) % 1;
    const s = 12 * Math.sin(ph * Math.PI);
    ctx.save();
    ctx.translate(tx + tw * 0.55 + i * 30 - 40, ty - th - 20 - ph * 120);
    ctx.rotate(ph * 3);
    ctx.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const rr2 = k % 2 ? s * 0.4 : s;
      ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2);
    }
    ctx.closePath();
    ctx.fillStyle = '#ff9a4a';
    ctx.fill();
    ctx.restore();
  }
}

function stage6(u) {
  ctx.fillStyle = '#123322';
  ctx.fillRect(0, 0, W, H);
  sunburst(W * 0.5, H * 0.60, '#1a4a2f', '#164027', u * 0.3);
  ground(H * 0.88, '#1d5236', '#123a25', '#5ce08a');
  const px0 = W * 0.62, py0 = H * 0.88;
  rr(px0 - W * 0.10, py0 - H * 0.16, W * 0.20, H * 0.16, 14, '#3b4a52', 9);
  rr(px0 - W * 0.075, py0 - H * 0.26, W * 0.15, H * 0.11, 12, '#8f9aa2', 8);
  const press = ease(clamp((u - 0.34) / 0.16));
  const bh = H * 0.085 * (1 - press * 0.45);
  rr(px0 - W * 0.058, py0 - H * 0.26 - bh, W * 0.116, bh + 10, bh * 0.42, '#ff5a4a', 9);
  ctx.save();
  ctx.globalAlpha = 0.55;
  rr(px0 - W * 0.040, py0 - H * 0.26 - bh + 8, W * 0.036, bh * 0.4, 10, '#ffb3a8');
  ctx.restore();
  const drop = press * H * 0.035;
  mascot(W * 0.47, H * 0.88 + drop, H * 0.36, 1, 1, u < 0.34 ? 1.06 : 0.94);
  if (u > 0.34 && u < 0.9) {
    const p = clamp((u - 0.34) / 0.4);
    ctx.save();
    ctx.globalAlpha = 1 - p;
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#fff3a0';
    ctx.beginPath();
    ctx.ellipse(px0, py0 - H * 0.24, W * 0.06 + p * W * 0.22, H * 0.03 + p * H * 0.10, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  if (u > 0.46) {
    const p = clamp((u - 0.46) / 0.5);
    for (let i = 0; i < 40; i++) {
      const r2 = K.rng('wy:conf' + i);
      const x = r2() * W;
      const y = -40 + ((r2() * 1.3 + p * 1.6) % 1.15) * H;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p * 6 + i);
      ctx.fillStyle = ['#ffd95e', '#ff5a4a', '#63e0a0', '#7fb6ff'][i % 4];
      ctx.fillRect(-14, -7, 28, 14);
      ctx.restore();
    }
    const sIn = ease(clamp((u - 0.5) / 0.3));
    ctx.save();
    ctx.translate(W * 0.5, H * 0.34);
    ctx.rotate(-0.04);
    const sc = 0.6 + sIn * 0.4;
    ctx.scale(sc, sc);
    text('CLEAR!', 0, 40, H * 0.20, '#ffe066', 'center');
    text('+1000', 0, 130, H * 0.07, '#a8ffd0', 'center');
    ctx.restore();
  }
}

// ---------- HUD ----------
function hud(t, idx, u) {
  text(`${idx + 1}/6`, W * 0.045, 92, 56, '#ffffff', 'left');
  const bw = W * 0.40, bx = W * 0.30, by = 58;
  rr(bx, by, bw, 40, 20, rgba('#000000', 0.55), 5);
  const left = 1 - u;
  rr(bx + 6, by + 6, Math.max(4, (bw - 12) * left), 28, 14, left > 0.35 ? '#63e076' : '#ff5a4a', 0);
  const score = Math.floor((idx + u) * 200);
  text(String(score).padStart(4, '0'), W * 0.955, 92, 56, '#ffe066', 'right');
}

 // ---------- 切镜 ----------
function cutFx(u) {
  if (u < 0.10) {
    ctx.save();
    ctx.globalAlpha = (1 - u / 0.10) * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (u > 0.90) {
    const p = (u - 0.90) / 0.10;
    ctx.save();
    ctx.translate(W * (p * 1.15 - 0.15), 0);
    ctx.beginPath();
    ctx.moveTo(-W * 0.40, 0);
    ctx.lineTo(W * 0.10, 0);
    ctx.lineTo(-W * 0.24, H);
    ctx.lineTo(-W * 0.74, H);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}

function grade() {
  const v = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.45, W * 0.5, H * 0.5, H * 1.0);
  v.addColorStop(0, rgba('#000000', 0));
  v.addColorStop(1, rgba('#0a0c16', 0.45));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

const DRAW = [stage1, stage2, stage3, stage4, stage5, stage6];

window.renderAt = (t) => {
  ENV.reset();
  const tt = Math.min(t, TOTAL);
  let idx = Math.min(STAGES - 1, Math.floor(tt / SEG));
  let u = (tt - idx * SEG) / SEG;
  if (t > TOTAL) { idx = STAGES - 1; u = 1; }
  ctx.save();
  const zoom = 1 + 0.02 * u;
  ctx.translate(W * 0.5, H * 0.5);
  ctx.scale(zoom, zoom);
  ctx.translate(-W * 0.5, -H * 0.5);
  DRAW[idx](u);
  ctx.restore();
  cutFx(u);
  hud(t, idx, u);
  grade();
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
