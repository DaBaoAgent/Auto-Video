// jiezou · 节奏综艺 —— 站点 10 秒样片《踩拍登场》
//
// 综艺舞台的正面固定机位：背景是同心 LED 环，随 120BPM 的每一拍变色脉冲；
// 两侧桁架灯扫射、镜面地板把光反成竖条；大头选手在台心踩拍跳舞（两帧踏步 + 甩手 + 点头）；
// 6.4 秒起评委席三块牌翻出 9/9/10，7.2 秒彩带炮炸开。
const SPEC = {
  id: 'jiezou',
  seed: 'av:jiezou',
  family: 'cel',
  w: 1920,
  h: 1080,
  label: { zh: '节奏综艺', en: 'Rhythm Game Show', station: '04 · 卡通动画' }
};

const ENV = STYLEKIT.page(document.getElementById('c'), { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });
const K = STYLEKIT;
const W = ENV.W, H = ENV.H, ctx = ENV.ctx;
const clamp = K.clamp, lerp = K.lerp, ease = K.ease, shade = K.shade, rgba = K.rgba;

const BPM = 120;
const BEAT = 60 / BPM;          // 0.5s
const FLOOR = H * 0.80;         // 舞台地面线
const STAGE_CX = W * 0.50;

function beatPhase(t) { const p = (t / BEAT) % 1; return p; }        // 0→1 单拍内
function beatPulse(t) { return Math.pow(1 - beatPhase(t), 2.2); }    // 拍点最强，之后衰减

function pen(x, y, w, h, r, fill, stroke, lw) {
  ctx.beginPath();
  const rad = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 4; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function ell(x, y, rx, ry, fill, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha === undefined ? 1 : alpha;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

// ---------- 背景：同心 LED 环 ----------
function ledRings(t) {
  const pulse = beatPulse(t);
  const hueBase = (t * 60) % 360;
  // 由深到浅的铺底
  const bg = ctx.createRadialGradient(STAGE_CX, H * 0.46, H * 0.04, STAGE_CX, H * 0.46, H * 0.95);
  bg.addColorStop(0, '#3b2160');
  bg.addColorStop(0.55, '#22143f');
  bg.addColorStop(1, '#120a24');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 6 圈环，各自点状灯珠（只铺在上半场，地面会盖住下半）
  for (let r = 6; r >= 1; r--) {
    const rad = H * (0.073 * r);
    const n = 18 + r * 6;
    const phase = Math.floor(t / BEAT) % 4;
    const lit = ((r + phase) % 4 === 0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r * 0.20;
      const x = STAGE_CX + Math.cos(a) * rad * 1.30 * (1 + 0.015 * pulse);
      const y = H * 0.50 + Math.sin(a) * rad * 0.92 * (1 + 0.015 * pulse);
      if (y > FLOOR - 8) continue;
      const col = lit
        ? `hsl(${(hueBase + r * 16) % 360},92%,${62 + 10 * pulse}%)`
        : `hsla(${(hueBase + r * 10) % 360},48%,30%,0.5)`;
      const size = lit ? 0.0062 * H * (1 + 0.55 * pulse) : 0.0042 * H;
      ell(x, y, size, size, col);
    }
  }
  // 环里的暗色圆盘，让中心的舞者跳出来
  const disc = ctx.createRadialGradient(STAGE_CX, H * 0.50, H * 0.02, STAGE_CX, H * 0.50, H * 0.34);
  disc.addColorStop(0, rgba('#120a24', 0.55));
  disc.addColorStop(1, rgba('#120a24', 0));
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(STAGE_CX, H * 0.46, H * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- 桁架灯 + 扫射光束 ----------
function truss(t) {
  const pulse = beatPulse(t);
  [0.06, 0.94].forEach((sx, side) => {
    const x = W * sx;
    // 立柱
    ctx.fillStyle = '#1a1226';
    ctx.fillRect(x - 14, 0, 28, FLOOR);
    ctx.fillStyle = '#2c2140';
    for (let y = 40; y < FLOOR; y += 64) ctx.fillRect(x - 14, y, 28, 4);
    // 顶上的灯排
    for (let i = 0; i < 3; i++) {
      const ly = 90 + i * 74;
      const dir = (side < 0.5 ? 1 : -1);
      const ang = dir * (0.55 + 0.30 * Math.sin(t * 1.6 + i * 1.2 + side * 3));
      const len = H * 0.95;
      ctx.save();
      ctx.translate(x, ly);
      ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      const warm = i % 2 ? `hsla(${(t * 50 + 300) % 360},95%,70%,0.42)` : `hsla(${(t * 50 + 190) % 360},95%,70%,0.42)`;
      g.addColorStop(0, warm);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -len * 0.10);
      ctx.lineTo(len, len * 0.10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // 灯泡
      ell(x, ly, 0.018 * H * (1 + 0.3 * pulse), 0.018 * H * (1 + 0.3 * pulse),
        i % 2 ? `hsl(${(t * 50 + 300) % 360},95%,72%)` : `hsl(${(t * 50 + 190) % 360},95%,72%)`);
    }
  });
  // 顶部横向桁架
  ctx.fillStyle = '#1a1226';
  ctx.fillRect(0, 22, W, 26);
  ctx.fillStyle = '#2c2140';
  for (let x = 0; x < W; x += 96) ctx.fillRect(x, 22, 6, 26);
}

// ---------- 镜面地板 ----------
function mirrorFloor(t) {
  const pulse = beatPulse(t);
  const g = ctx.createLinearGradient(0, FLOOR, 0, H);
  g.addColorStop(0, '#2a1840');
  g.addColorStop(0.5, '#1a1029');
  g.addColorStop(1, '#0e0819');
  ctx.fillStyle = g;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  // 透视格线
  ctx.strokeStyle = rgba('#8a6cff', 0.20);
  ctx.lineWidth = 3;
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(STAGE_CX + i * W * 0.055, FLOOR);
    ctx.lineTo(STAGE_CX + i * W * 0.16, H);
    ctx.stroke();
  }
  for (let k = 1; k <= 4; k++) {
    const y = FLOOR + Math.pow(k / 4, 2) * (H - FLOOR);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // 舞台中心的倒影光柱
  for (let i = 0; i < 9; i++) {
    const w = 26 + (i % 3) * 22;
    ctx.fillStyle = rgba(`hsl(${(160 + i * 22 + t * 40) % 360},90%,66%)`, 0.16 + 0.10 * pulse);
    ctx.fillRect(STAGE_CX - 190 + i * 44 + Math.sin(t * 2 + i) * 6, FLOOR, w, (H - FLOOR) * 0.8);
  }
  // 台沿亮条
  ctx.fillStyle = rgba('#c9a8ff', 0.85);
  ctx.fillRect(0, FLOOR - 6, W, 6);
  ctx.fillStyle = rgba('#ff77c8', 0.55 + 0.3 * pulse);
  ctx.fillRect(0, FLOOR, W, 4);
}

// ---------- 选手：大头 + 小身子 ----------
function dancer(t) {
  const pulse = beatPulse(t);
  const b = Math.floor(t / BEAT);
  const step = b % 2;                     // 左右脚交替
  const sway = Math.sin(t * (Math.PI * 2 / BEAT) / 2) * 0.06;
  const cx = STAGE_CX + Math.sin(b * 0.9) * W * 0.035;
  const cy = FLOOR;
  const s = H * 0.56;
  const hop = pulse * H * 0.022;           // 每拍弹一下

  ctx.save();
  ctx.translate(cx, cy - hop);
  ctx.rotate(sway * 0.5);
  // 影子
  ctx.restore();
  ell(cx, FLOOR + 6, H * 0.075 * (1 - hop / (H * 0.06)), H * 0.020, rgba('#000000', 0.55));

  ctx.save();
  ctx.translate(cx, cy - hop);
  ctx.rotate(sway);

  // 腿
  const legS = s * 0.10;
  pen(-legS - 0.03 * s, -0.22 * s, 0.09 * s, 0.23 * s, 0.03 * s, '#f4f1ff');
  pen(0.03 * s, -0.22 * s, 0.09 * s, 0.23 * s, 0.03 * s, '#f4f1ff');
  // 鞋
  pen(-legS - 0.05 * s, -0.03 * s, 0.14 * s, 0.05 * s, 0.02 * s, step ? '#ff4f9a' : '#3ad1c8');
  pen(0.02 * s, -0.03 * s, 0.14 * s, 0.05 * s, 0.02 * s, step ? '#3ad1c8' : '#ff4f9a');
  // 身体（亮片夹克）
  pen(-0.12 * s, -0.52 * s, 0.24 * s, 0.32 * s, 0.07 * s, '#ff5aa8');
  pen(-0.12 * s, -0.52 * s, 0.24 * s, 0.32 * s, 0.07 * s, '#ff5aa8', '#ffe9f4', 3);
  // 亮片
  for (let i = 0; i < 6; i++) {
    const px2 = -0.08 * s + (i % 3) * 0.08 * s;
    const py2 = -0.48 * s + Math.floor(i / 3) * 0.10 * s;
    ell(px2, py2, 0.012 * s, 0.012 * s, i % 2 ? '#ffe66d' : '#fff6ff', 0.9);
  }
  // 手臂：一拍一抬，斜上四十五度，手不会压到头
  const armUp = 0.5 + 0.5 * Math.cos(b * Math.PI);
  [[-1, 1 - armUp * 0.5], [1, armUp]].forEach(([side, upAmt]) => {
    const shx = side * 0.115 * s, shy = -0.50 * s;
    const elbowX = side * (0.115 * s + 0.155 * s * upAmt + 0.02 * s * (1 - upAmt));
    const elbowY = shy - 0.095 * s * upAmt + 0.155 * s * (1 - upAmt);
    const handX = side * (0.115 * s + 0.265 * s * upAmt + 0.03 * s * (1 - upAmt));
    const handY = elbowY - 0.10 * s * upAmt + 0.06 * s * (1 - upAmt);
    [['#ff5aa8', [shx, shy, elbowX, elbowY]], ['#ff7ab8', [elbowX, elbowY, handX, handY]]].forEach(([c, pts]) => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      ctx.lineTo(pts[2], pts[3]);
      ctx.lineWidth = 0.070 * s;
      ctx.lineCap = 'round';
      ctx.strokeStyle = c;
      ctx.stroke();
    });
    ell(handX, handY, 0.042 * s, 0.042 * s, '#ffd0e4');
  });
  // 头（大头）
  const headR = 0.20 * s;
  const headY = -0.52 * s - headR * 0.92 - hop * 0.02;
  ell(0, headY, headR * 1.02, headR, '#ffdcc0');
  // 头发（黑色蓬松，只盖住头顶）
  ctx.beginPath();
  ctx.ellipse(0, headY - headR * 0.30, headR * 1.06, headR * 0.72, 0, Math.PI * 0.98, Math.PI * 2.02);
  ctx.fillStyle = '#2b1b3d';
  ctx.fill();
  // 一撮挑染（贴在刘海左侧的一弯）
  ctx.beginPath();
  ctx.ellipse(-headR * 0.30, headY - headR * 0.58, headR * 0.58, headR * 0.30, -0.32, Math.PI * 0.95, Math.PI * 2.1);
  ctx.fillStyle = '#ff4f9a';
  ctx.fill();
  // 发梢高光
  ell(-headR * 0.42, headY - headR * 0.82, headR * 0.26, headR * 0.07, rgba('#ffffff', 0.35));
  // 眼睛（每拍眨一下的节奏）
  const blink = beatPhase(t) > 0.86 ? 0.12 : 1;
  [-1, 1].forEach((side) => {
    ell(side * headR * 0.36, headY + headR * 0.10, headR * 0.17, headR * 0.19 * blink, '#ffffff');
    ell(side * headR * 0.36 + 0.02 * headR, headY + headR * 0.12, headR * 0.085, headR * 0.10 * blink, '#20121f');
    ell(side * headR * 0.36 + 0.05 * headR, headY + headR * 0.07, headR * 0.03, headR * 0.03, '#ffffff');
  });
  // 眉毛随拍上挑
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * headR * 0.52, headY - headR * 0.12 + pulse * 0.02 * headR);
    ctx.lineTo(side * headR * 0.20, headY - headR * 0.20 + pulse * 0.02 * headR);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2b1b3d';
    ctx.stroke();
  });
  // 嘴：跟唱的口型
  const open = 0.10 + 0.12 * pulse;
  ell(0, headY + headR * 0.52, headR * 0.20, headR * open, '#8a2f46');
  ell(0, headY + headR * 0.46, headR * 0.16, headR * 0.05, '#ff8fa8');
  // 腮红
  [-1, 1].forEach((side) => ell(side * headR * 0.62, headY + headR * 0.30, headR * 0.14, headR * 0.09, rgba('#ff7aa8', 0.45)));
  // 高光
  ell(-headR * 0.55, headY - headR * 0.55, headR * 0.20, headR * 0.12, rgba('#ffffff', 0.35));
  ctx.restore();

  // 脚下的节奏光斑
  const ring = beatPhase(t);
  ell(cx, FLOOR + 4, H * 0.10 * (0.6 + 0.6 * ring), H * 0.026 * (0.6 + 0.6 * ring),
    rgba('#ff77c8', 0.45 * (1 - ring)));
}

// ---------- 评委席 ----------
function judges(t) {
  const flip = clamp((t - 6.3) / 0.55);
  const vals = ['9', '9', '10'];
  const tableY = H * 0.905;
  // 桌子
  pen(W * 0.02, tableY, W * 0.45, H - tableY + 8, 10, '#241634');
  pen(W * 0.02, tableY, W * 0.45, 10, 6, '#3a2452');
  pen(W * 0.02, tableY, W * 0.45, H - tableY + 8, 10, null, '#5b3f86', 3);

  for (let i = 0; i < 3; i++) {
    const x = W * (0.115 + i * 0.115);
    const headY = tableY - H * 0.055;
    // 身体（只露肩线）
    ell(x, tableY + H * 0.010, W * 0.024, H * 0.024, '#4a3568');
    // 头
    ell(x, headY, W * 0.024, H * 0.034, '#e8c09a');
    // 发型：只盖头顶一半
    ctx.beginPath();
    ctx.ellipse(x, headY - H * 0.016, W * 0.026, H * 0.020, 0, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fillStyle = i % 2 ? '#2b1b3d' : '#40304f';
    ctx.fill();
    // 眼睛
    ell(x - W * 0.008, headY + H * 0.003, W * 0.004, H * 0.0055, '#2b1b3d');
    ell(x + W * 0.008, headY + H * 0.003, W * 0.004, H * 0.0055, '#2b1b3d');
    // 嘴（举牌时张开）
    ell(x, headY + H * 0.018, W * 0.005, H * 0.004, '#8a2f46');
    // 边上一点台光
    ell(x - W * 0.018, headY - H * 0.004, W * 0.005, H * 0.012, rgba('#ff77c8', 0.55));

    // 举牌
    const up = clamp((t - 6.05 - i * 0.09) / 0.30);
    const cardW = W * 0.058, cardH = H * 0.100;
    const cardBottom = headY - H * 0.052 - cardH * up * 0.55;
    if (up > 0.02) {
      ctx.beginPath();
      ctx.moveTo(x + W * 0.020, tableY - H * 0.006);
      ctx.lineTo(x + W * 0.008, cardBottom + cardH * 0.30);
      ctx.lineWidth = W * 0.007;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#e8c09a';
      ctx.stroke();
    }
    const tilt = (1 - flip) * -0.22;
    ctx.save();
    ctx.translate(x, cardBottom);
    ctx.rotate(tilt);
    pen(-cardW / 2, -cardH, cardW, cardH, 7, '#fff6e6', '#ff4f9a', 5);
    const sc = clamp(flip * 3.4 - i * 0.25);
    if (sc > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, sc);
      const fs = vals[i].length > 1 ? H * 0.050 : H * 0.074;
      ctx.font = `900 ${Math.round(fs)}px "Arial Black", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#241634';
      ctx.fillText(vals[i], 0, -cardH * 0.52);
      ctx.restore();
    }
    ctx.restore();
    ell(x + W * 0.006, cardBottom, W * 0.011, W * 0.011, '#d9ab84');
  }
  // 评分条
  if (t > 7.0) {
    const p = clamp((t - 7.0) / 0.5);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.font = `900 ${Math.round(H * 0.042)}px "Arial Black", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffe66d';
    ctx.strokeStyle = '#241634';
    ctx.lineWidth = 6;
    const str = '28.0 分 · 满分过关';
    ctx.strokeText(str, W * 0.505, tableY - H * 0.030);
    ctx.fillText(str, W * 0.505, tableY - H * 0.030);
    ctx.restore();
  }
}

 // ---------- 彩带 ----------
function confetti(t) {
  if (t < 7.15) return;
  const p = clamp((t - 7.15) / 2.0);
  for (let i = 0; i < 60; i++) {
    const r = K.rng('jz:conf' + i);
    const x0 = r() * W;
    const sp = 0.6 + r() * 0.8;
    const y = -80 + ((p * sp * 1.4 + r() * 0.6) % 1.2) * (H + 120);
    const sway = Math.sin(t * 3 + i) * 26;
    ctx.save();
    ctx.translate(x0 + sway, y);
    ctx.rotate(t * 4 + i);
    ctx.fillStyle = ['#ff66a8', '#ffe66d', '#6be7df', '#a982ff', '#ffffff'][i % 5];
    ctx.fillRect(-13, -7, 26, 14);
    ctx.restore();
  }
  // 两炮口喷一下（短促的小亮斑，不铺大圆）
  if (t < 7.45) {
    const q = (t - 7.15) / 0.30;
    [0.075, 0.925].forEach((sx) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.fillStyle = rgba('#fff3b0', 0.7 * (1 - q));
        ctx.beginPath();
        ctx.arc(W * sx + Math.cos(a) * q * 40, H * 0.88 + Math.sin(a) * q * 26, 6 + q * 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }
}

// ---------- 调色 ----------
function grade(t) {
  // 顶部一点压暗，底部暗角，让中心更亮
  const v = ctx.createRadialGradient(STAGE_CX, H * 0.48, H * 0.30, STAGE_CX, H * 0.48, H * 1.05);
  v.addColorStop(0, rgba('#000000', 0));
  v.addColorStop(1, rgba('#0a0518', 0.62));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  const top = ctx.createLinearGradient(0, 0, 0, H * 0.28);
  top.addColorStop(0, rgba('#08040f', 0.55));
  top.addColorStop(1, rgba('#08040f', 0));
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H * 0.28);
}

window.renderAt = (t) => {
  ENV.reset();
  ledRings(t);
  truss(t);
  mirrorFloor(t);
  dancer(t);
  confetti(t);
  judges(t);
  grade(t);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
