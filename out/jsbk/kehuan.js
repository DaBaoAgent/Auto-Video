// kehuan · 科幻情景喜剧卡通 —— 站点 10 秒样片《传送门早餐》
//
// 飞船小厨房内景：圆头绿脸小厨师按下大红按钮，墙上光圈传送门旋开，
// 咖啡杯飘起来穿过传送门又原样转回来，甜甜圈绕着门转圈，最后扣在他头盔上。
// 硬边赛璐璐阴影 + 青光/橙光两套光源。画面由本文件逐帧绘制，确定性。
const SPEC = {
  id: 'kehuan',
  seed: 'av:kehuan',
  family: 'cel',
  w: 1920,
  h: 1080,
  bg: '#0b1226',
  label: { zh: '科幻情景喜剧卡通', en: 'Sci-Fi Sitcom Toon', station: '04 · 卡通动画' }
};

const ENV = STYLEKIT.page(document.getElementById('c'), { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });
const K = STYLEKIT;
const W = ENV.W, H = ENV.H, ctx = ENV.ctx;
const clamp = K.clamp, lerp = K.lerp, ease = K.ease, shade = K.shade, rgba = K.rgba, mix = K.mixHex;

const P = {
  ink: '#050e16',
  wall: '#123645',
  wall2: '#0c2833',
  panel: '#0a1e28',
  seam: '#1e5464',
  metal: '#2a6f7e',
  metalLt: '#6ecbd2',
  floor: '#10303c',
  floor2: '#08161e',
  orange: '#ff8a3d',
  orange2: '#cf4f16',
  cream: '#ffe6bd',
  red: '#ff4d5e',
  red2: '#b8223c',
  glow: '#5ff2ff',
  glow2: '#ff6ad5',
  space: '#04060f',
  planet: '#7b63f2',
  planet2: '#b48cff',
  skin: '#a8e86b',
  skin2: '#6fb03f',
  white: '#f6fbff'
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
function mod(x, m) { return ((x % m) + m) % m; }
function hash01(i) { const r = K.rng('kehuan:h' + i); return r(); }

// 两段臂 IK：肩 → 肘 → 手
function arm(sx, sy, tx, ty, len, bend, wA, wB, col) {
  const dx = tx - sx, dy = ty - sy;
  const d = Math.min(Math.hypot(dx, dy), len * 1.92);
  const a = Math.acos(clamp((len * len + d * d - len * len) / (2 * len * Math.max(1e-6, d)), -1, 1) || 0);
  const base = Math.atan2(dy, dx);
  const ang = base + bend * (a || 0.35);
  const ex = sx + Math.cos(ang) * len, ey = sy + Math.sin(ang) * len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = wA + 7;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.strokeStyle = col;
  ctx.lineWidth = wA;
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.lineWidth = wB;
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(tx, ty); ctx.stroke();
  return [ex, ey];
}

// ---------- 房间 ----------
function drawRoom(t) {
  // 顶
  ctx.fillStyle = P.wall2;
  ctx.fillRect(0, 0, W, H * 0.13);
  ctx.fillStyle = '#071722';
  ctx.fillRect(0, 0, W, H * 0.055);
  // 背墙
  const g = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.80);
  g.addColorStop(0, P.wall);
  g.addColorStop(0.55, '#0f3140');
  g.addColorStop(1, '#0b2430');
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.1, W, H * 0.70);

  // 舱壁板缝
  ctx.strokeStyle = rgba(P.seam, 0.55);
  ctx.lineWidth = 3;
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * W;
    ctx.beginPath(); ctx.moveTo(x, H * 0.1); ctx.lineTo(x, H * 0.80); ctx.stroke();
  }
  ctx.strokeStyle = rgba(P.seam, 0.45);
  [0.20, 0.36, 0.56, 0.72].forEach((fy) => {
    ctx.beginPath(); ctx.moveTo(0, H * fy); ctx.lineTo(W, H * fy); ctx.stroke();
  });
  // 铆钉
  for (let i = 0; i <= 10; i++) {
    for (let j = 0; j < 4; j++) {
      const x = (i / 10) * W, y = H * [0.20, 0.36, 0.56, 0.72][j];
      ctx.fillStyle = rgba('#5c99a4', 0.35);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  // 顶部灯带
  const lg = ctx.createLinearGradient(0, H * 0.085, 0, H * 0.145);
  lg.addColorStop(0, rgba('#9ef4ff', 0.55));
  lg.addColorStop(1, rgba('#9ef4ff', 0));
  ctx.fillStyle = lg;
  ctx.fillRect(W * 0.06, H * 0.085, W * 0.40, H * 0.06);
  ctx.fillStyle = rgba('#dffcff', 0.9);
  ctx.fillRect(W * 0.06, H * 0.079, W * 0.40, 5);

  // 天花板吊灯（占位小灯 + 光锥）
  const lampX = W * 0.34, lampY = H * 0.115;
  ctx.fillStyle = '#0c2029';
  ctx.fillRect(lampX - W * 0.05, lampY - 14, W * 0.10, 12);
  ctx.fillStyle = rgba('#ffe6bd', 0.95);
  rr(lampX - W * 0.042, lampY, W * 0.084, 10, 4); ctx.fill();
  const cone = ctx.createLinearGradient(0, lampY, 0, H * 0.78);
  cone.addColorStop(0, rgba('#ffd9a0', 0.30));
  cone.addColorStop(1, rgba('#ffd9a0', 0));
  ctx.fillStyle = cone;
  ctx.beginPath();
  ctx.moveTo(lampX - W * 0.042, lampY + 8);
  ctx.lineTo(lampX + W * 0.042, lampY + 8);
  ctx.lineTo(lampX + W * 0.20, H * 0.80);
  ctx.lineTo(lampX - W * 0.20, H * 0.80);
  ctx.closePath();
  ctx.fill();

  // 地板
  const fg = ctx.createLinearGradient(0, H * 0.80, 0, H);
  fg.addColorStop(0, P.floor);
  fg.addColorStop(1, P.floor2);
  ctx.fillStyle = fg;
  ctx.fillRect(0, H * 0.80, W, H * 0.20);
  ctx.strokeStyle = rgba('#2d6d7c', 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H * 0.80); ctx.lineTo(W, H * 0.80); ctx.stroke();
  // 地板格
  const vpX = W * 0.585, vpY = H * 0.62;
  ctx.strokeStyle = rgba('#2d6d7c', 0.30);
  for (let i = -6; i <= 6; i++) {
    const bx = W * 0.5 + i * W * 0.10;
    ctx.beginPath();
    ctx.moveTo(bx, H);
    ctx.lineTo(vpX + (bx - vpX) * 0.42, vpY + (H - vpY) * 0.42);
    ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const y = H * 0.80 + Math.pow(i / 5, 1.7) * H * 0.20;
    ctx.strokeStyle = rgba('#2d6d7c', 0.18 + i * 0.03);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

// ---------- 舷窗 ----------
function drawWindow(t) {
  const x = W * 0.795, y = H * 0.155, w = W * 0.175, h = H * 0.40;
  ctx.fillStyle = P.metal;
  rr(x - 12, y - 12, w + 24, h + 24, 26); ctx.fill();
  ctx.fillStyle = P.space;
  rr(x, y, w, h, 18); ctx.fill();

  ctx.save();
  ctx.beginPath();
  rr(x, y, w, h, 18);
  ctx.clip();
  // 星
  for (let i = 0; i < 34; i++) {
    const r = K.rng('kw:star' + i);
    const sx = x + r() * w, sy = y + r() * h;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (1.2 + r() * 2.4) + i));
    ctx.fillStyle = rgba('#e9f6ff', tw * 0.85);
    ctx.fillRect(sx, sy, 2 + r() * 2, 2 + r() * 2);
  }
  // 行星（缓慢自转的色带）
  const px = x + w * 0.52, py = y + h * 0.66, pr = w * 0.34;
  ctx.fillStyle = P.planet;
  ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.clip();
  for (let i = 0; i < 5; i++) {
    const off = mod(t * 0.10 + i * 0.22, 1);
    ctx.fillStyle = rgba(i % 2 ? P.planet2 : '#4a35c0', 0.75);
    ctx.beginPath();
    ctx.ellipse(px, py - pr + off * pr * 2, pr * 1.15, pr * 0.11, 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
  // 亮面
  const pg = ctx.createRadialGradient(px - pr * 0.45, py - pr * 0.5, pr * 0.1, px, py, pr * 1.05);
  pg.addColorStop(0, rgba('#ffffff', 0.35));
  pg.addColorStop(0.45, rgba('#ffffff', 0));
  pg.addColorStop(1, rgba('#0a0620', 0.75));
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // 环
  ctx.strokeStyle = rgba('#d9c8ff', 0.55);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(px, py, pr * 1.42, pr * 0.24, -0.18, 0, Math.PI * 2);
  ctx.stroke();
  // 玻璃反光
  ctx.strokeStyle = rgba('#dff7ff', 0.35);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h * 0.86);
  ctx.lineTo(x + w * 0.44, y + h * 0.10);
  ctx.stroke();
  ctx.restore();

  // 窗框螺栓
  [[x - 4, y - 4], [x + w + 4, y - 4], [x - 4, y + h + 4], [x + w + 4, y + h + 4]].forEach(([bx, by]) => {
    ctx.fillStyle = P.metalLt;
    ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();
  });
}

// ---------- 传送门 ----------
function portalOpen(t) { return ease(clamp((t - 2.0) / 1.25)); }
function drawPortal(t) {
  const cx = W * 0.585, cy = H * 0.45, R = W * 0.132;
  const ok = portalOpen(t);
  // 门框
  ctx.fillStyle = '#0a1c24';
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 8; ctx.stroke();
  // 金属环
  const rg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rg.addColorStop(0, '#8fe6ee');
  rg.addColorStop(0.4, '#3d8b99');
  rg.addColorStop(1, '#164150');
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  // 分段刻线
  ctx.strokeStyle = rgba('#04141b', 0.85);
  ctx.lineWidth = 5;
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + 0.26;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * R * 0.835, cy + Math.sin(a) * R * 0.835);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }
  ctx.fillStyle = rgba('#c8fbff', 0.5);
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.83, 0, Math.PI * 2); ctx.fill();

  // 门洞
  const inner = R * 0.80;
  ctx.fillStyle = ok > 0.02 ? '#03060c' : '#08131a';
  ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill();

  if (ok > 0.02) {
    // 内部星云
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.clip();
    const ng = ctx.createRadialGradient(cx - inner * 0.3, cy - inner * 0.3, 4, cx, cy, inner);
    ng.addColorStop(0, rgba('#bff9ff', 0.95 * ok));
    ng.addColorStop(0.35, rgba('#3ad7ff', 0.75 * ok));
    ng.addColorStop(0.7, rgba('#7b3cff', 0.65 * ok));
    ng.addColorStop(1, rgba('#24093a', 0.9 * ok));
    ctx.fillStyle = ng;
    ctx.beginPath(); ctx.arc(cx, cy, inner, 0, Math.PI * 2); ctx.fill();
    // 旋臂
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = rgba(i % 2 ? '#e8ffff' : '#ff9be8', 0.22 * ok);
      ctx.lineWidth = inner * 0.055;
      ctx.beginPath();
      const a0 = t * 1.6 + i * 1.26;
      for (let k = 0; k <= 18; k++) {
        const p = k / 18;
        const a = a0 + p * 2.2;
        const r = inner * (0.10 + p * 0.92);
        const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 0.98;
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    // 星点
    for (let i = 0; i < 22; i++) {
      const r = K.rng('kw:in' + i);
      const a = t * 2.4 + r() * 6.28, rad = inner * (0.12 + r() * 0.8);
      const tw = Math.abs(Math.sin(t * 3 + i));
      ctx.fillStyle = rgba('#ffffff', tw * 0.85 * ok);
      ctx.fillRect(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 2, 2);
    }
    ctx.restore();
    // 边缘亮环
    ctx.strokeStyle = rgba('#b8fbff', 0.55 * ok);
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(cx, cy, inner - 3, 0, Math.PI * 2); ctx.stroke();
  }

  // 虹膜叶片（关着时合拢成整圆，按下按钮后向中心收缩消失）
  const blades = 6;
  const al = 1 - ok;
  if (al > 0.02) {
    for (let i = 0; i < blades; i++) {
      const a0 = i * Math.PI * 2 / blades + t * 0.04;
      const spread = Math.PI / blades * 0.5;
      const shrink = 1 - ok * 1.02;
      ctx.fillStyle = rgba(i % 2 ? '#1d4c5c' : '#173f4d', 0.97 * al);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0 - spread) * inner * 0.05, cy + Math.sin(a0 - spread) * inner * 0.05);
      ctx.lineTo(cx + Math.cos(a0 - spread) * inner, cy + Math.sin(a0 - spread) * inner);
      ctx.arc(cx, cy, inner, a0 - spread, a0 + spread);
      ctx.lineTo(cx + Math.cos(a0 + spread) * inner * 0.05, cy + Math.sin(a0 + spread) * inner * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba('#03090d', 0.55 * al); ctx.lineWidth = 3; ctx.stroke();
      // 叶片中缝高光
      ctx.strokeStyle = rgba('#7fd4dd', 0.30 * al);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a0) * inner * 0.1, cy + Math.sin(a0) * inner * 0.1);
      ctx.lineTo(cx + Math.cos(a0) * inner * shrink, cy + Math.sin(a0) * inner * shrink);
      ctx.stroke();
    }
  }

  // 按钮按下那一瞬的冲击环
  const k = (t - 1.98) / 0.55;
  if (k > 0 && k < 1) {
    ctx.strokeStyle = rgba('#bff8ff', 0.7 * (1 - k));
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy, inner * (0.85 + k * 0.5), 0, Math.PI * 2); ctx.stroke();
  }
}

// ---------- 台面/设备 ----------
function drawCounter(t) {
  const L = 0.015 * W, Rr = 0.475 * W, top = H * 0.700;
  // 台面
  ctx.fillStyle = P.metal;
  ctx.fillRect(L, top, Rr - L, H * 0.035);
  ctx.fillStyle = rgba('#a8eef2', 0.55);
  ctx.fillRect(L, top, Rr - L, 6);
  // 前面板
  const fg = ctx.createLinearGradient(0, top + H * 0.035, 0, H * 0.86);
  fg.addColorStop(0, '#164350');
  fg.addColorStop(1, '#0a2029');
  ctx.fillStyle = fg;
  ctx.fillRect(L, top + H * 0.035, Rr - L, H * 0.16);
  ctx.strokeStyle = rgba('#7fd4dd', 0.35);
  ctx.lineWidth = 3;
  ctx.strokeRect(L + 8, top + H * 0.05, Rr - L - 16, H * 0.125);
  // 柜门
  [0.10, 0.27].forEach((fx) => {
    ctx.strokeStyle = rgba('#7fd4dd', 0.25);
    ctx.strokeRect(W * fx, top + H * 0.055, W * 0.145, H * 0.11);
    ctx.fillStyle = rgba('#9bf0f5', 0.5);
    ctx.fillRect(W * fx + W * 0.06, top + H * 0.09, W * 0.02, H * 0.02);
  });
  // 抹布挂在台沿
  const tx0 = W * 0.196, ty0 = top + H * 0.034;
  ctx.fillStyle = '#7fd8c4';
  ctx.beginPath();
  ctx.moveTo(tx0, ty0);
  ctx.lineTo(tx0 + W * 0.038, ty0);
  ctx.lineTo(tx0 + W * 0.034, ty0 + H * 0.062);
  ctx.quadraticCurveTo(tx0 + W * 0.020, ty0 + H * 0.070, tx0 + W * 0.006, ty0 + H * 0.060);
  ctx.closePath();
  ink('#5fc4b0', P.ink, 4);
  ctx.strokeStyle = rgba('#ffffff', 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(tx0 + W * 0.008, ty0 + H * 0.012); ctx.lineTo(tx0 + W * 0.030, ty0 + H * 0.012); ctx.stroke();
  // 台角一箱货（牛奶盒）
  const mx2 = W * 0.432, my2 = top - H * 0.055;
  ctx.fillStyle = P.cream;
  rr(mx2, my2, W * 0.030, H * 0.055, 4); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = P.orange;
  rr(mx2 + W * 0.004, my2 + H * 0.020, W * 0.022, H * 0.020, 3); ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.9);
  ctx.fillRect(mx2 + W * 0.008, my2 + H * 0.027, W * 0.014, 4);

  // 左边的咖啡机
  const mx = W * 0.028, my = H * 0.54, mw = W * 0.085, mh = H * 0.16;
  ctx.fillStyle = '#0f2b36';
  rr(mx, my, mw, mh, 10); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = P.orange;
  rr(mx + mw * 0.14, my + mh * 0.10, mw * 0.72, mh * 0.24, 6); ctx.fill();
  ctx.fillStyle = rgba('#ffe6bd', 0.9);
  ctx.font = `700 ${Math.round(mh * 0.15)}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('HOT', mx + mw * 0.5, my + mh * 0.28);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0a1c24';
  ctx.fillRect(mx + mw * 0.22, my + mh * 0.52, mw * 0.16, mh * 0.16);
  ctx.fillRect(mx + mw * 0.62, my + mh * 0.52, mw * 0.16, mh * 0.16);
  ctx.fillStyle = P.metalLt;
  ctx.beginPath(); ctx.arc(mx + mw * 0.5, my + mh * 0.80, mw * 0.13, 0, Math.PI * 2); ctx.fill();
  // 蒸汽
  for (let i = 0; i < 4; i++) {
    const lf = mod(t * 0.42 + i * 0.25, 1);
    ctx.fillStyle = rgba('#e8ffff', 0.10 * (1 - lf));
    ctx.beginPath();
    ctx.ellipse(mx + mw * (0.35 + i * 0.1) + Math.sin(t * 1.6 + i) * 8, my - lf * H * 0.10,
      W * 0.008 * (1 + lf * 1.6), H * 0.012 * (1 + lf * 1.4), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 甜甜圈托盘（右侧）
  const tx = W * 0.355, ty = top + 2;
  ctx.fillStyle = '#123a46';
  rr(tx, ty - 10, W * 0.10, 14, 6); ctx.fill();
  ctx.strokeStyle = rgba('#9bf0f5', 0.5); ctx.lineWidth = 3; ctx.stroke();
}

// ---------- 大红按钮 ----------
function drawButton(t) {
  const cx = W * 0.315, cy = H * 0.666;
  const press = clamp((t - 1.86) / 0.16) * (1 - clamp((t - 2.25) / 0.3));
  // 面板
  ctx.fillStyle = '#0d2a35';
  rr(cx - W * 0.036, cy - H * 0.010, W * 0.074, H * 0.034, 9); ctx.fill();
  ctx.strokeStyle = rgba('#9bf0f5', 0.45); ctx.lineWidth = 3; ctx.stroke();
  // 警示斜纹
  ctx.save();
  ctx.beginPath();
  rr(cx - W * 0.036, cy - H * 0.010, W * 0.074, H * 0.034, 9);
  ctx.clip();
  ctx.fillStyle = rgba('#ffb84d', 0.22);
  for (let i = -3; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.036 + i * 22, cy + H * 0.024);
    ctx.lineTo(cx - W * 0.036 + i * 22 + 14, cy + H * 0.024);
    ctx.lineTo(cx - W * 0.036 + i * 22 + 30, cy - H * 0.010);
    ctx.lineTo(cx - W * 0.036 + i * 22 + 16, cy - H * 0.010);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // 按钮体
  ctx.fillStyle = P.red2;
  ctx.beginPath(); ctx.ellipse(cx, cy + 4 + press * 9, W * 0.023, H * 0.018, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.red;
  ctx.beginPath(); ctx.ellipse(cx, cy - press * 7, W * 0.021, H * 0.015, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba('#ffd2d8', 0.9);
  ctx.beginPath(); ctx.ellipse(cx - W * 0.007, cy - H * 0.005 - press * 7, W * 0.007, H * 0.005, 0, 0, Math.PI * 2); ctx.fill();
  // 待机呼吸
  if (t < 1.95) {
    const b = 0.35 + 0.25 * Math.sin(t * 4);
    ctx.strokeStyle = rgba('#ff9aa8', b);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy - 4, W * 0.034, H * 0.024, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

// ---------- 小厨师 ----------
function handTarget(t) {
  const rest = [W * 0.240, H * 0.688];
  const btn = [W * 0.315, H * 0.658];
  if (t < 1.30) return rest;
  if (t < 1.82) {
    const k = ease((t - 1.30) / 0.52);
    return [lerp(rest[0], btn[0], k), lerp(rest[1], btn[1] - H * 0.012, k)];
  }
  if (t < 1.94) {
    const k = ease((t - 1.82) / 0.12);
    return [btn[0], lerp(btn[1] - H * 0.012, btn[1] + 4, k)];
  }
  if (t < 2.30) return [btn[0], btn[1] + 4];
  if (t < 2.95) {
    const k = ease((t - 2.30) / 0.65);
    return [lerp(btn[0], rest[0], k), lerp(btn[1], rest[1], k)];
  }
  return rest;
}

function drawCook(t) {
  // 按下按钮时身体前倾一点
  const lean = clamp((t - 1.45) / 0.35) * (1 - clamp((t - 2.35) / 0.5));
  const hx = W * 0.190 + lean * W * 0.012, hy = H * 0.418, hr = H * 0.095;
  const shY = H * 0.508;
  // 身体（被台面挡住下半截）
  ctx.fillStyle = P.orange2;
  ctx.beginPath();
  ctx.moveTo(hx - W * 0.055, shY + H * 0.012);
  ctx.quadraticCurveTo(hx - W * 0.070, H * 0.620, hx - W * 0.062, H * 0.780);
  ctx.lineTo(hx + W * 0.066, H * 0.780);
  ctx.quadraticCurveTo(hx + W * 0.072, H * 0.620, hx + W * 0.055, shY + H * 0.012);
  ctx.closePath();
  ink(P.orange, P.ink, 6);
  // 胸前控制板
  ctx.fillStyle = '#123a46';
  rr(hx - W * 0.026, shY + H * 0.045, W * 0.052, H * 0.052, 8); ctx.fill();
  ctx.strokeStyle = rgba('#9bf0f5', 0.7); ctx.lineWidth = 3; ctx.stroke();
  ['#5ff2ff', '#ff6ad5', '#ffe66d'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(hx - W * 0.016 + i * W * 0.016, shY + H * 0.058, 5, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = rgba('#c8fbff', 0.45);
  ctx.fillRect(hx - W * 0.020, shY + H * 0.080, W * 0.040, 5);

  // 另一侧手臂（垂在台面边）
  arm(hx - W * 0.047, shY + H * 0.006, W * 0.132, H * 0.658, H * 0.100, -1, W * 0.030, W * 0.026, P.orange);

  // 头盔
  ctx.fillStyle = '#0e2a35';
  ctx.beginPath(); ctx.arc(hx, hy, hr * 1.20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = rgba('#7fe9ff', 0.20);
  ctx.beginPath(); ctx.arc(hx, hy, hr * 1.13, 0, Math.PI * 2); ctx.fill();

  // 脸
  const skinY = hy;
  ctx.fillStyle = P.skin;
  ctx.beginPath(); ctx.ellipse(hx, skinY, hr * 0.86, hr * 0.90, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(P.skin2, 0.9);
  ctx.beginPath(); ctx.ellipse(hx + hr * 0.30, skinY + hr * 0.34, hr * 0.52, hr * 0.40, 0.3, 0, Math.PI * 2); ctx.fill();
  // 触角
  ctx.strokeStyle = P.skin2; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(hx, hy - hr * 0.85); ctx.lineTo(hx + hr * 0.10, hy - hr * 1.26); ctx.stroke();
  ctx.fillStyle = '#ff6ad5';
  ctx.beginPath(); ctx.arc(hx + hr * 0.10, hy - hr * 1.28, hr * 0.10, 0, Math.PI * 2);
  ctx.fill();
  const bulb = 0.55 + 0.45 * Math.sin(t * 5.5);
  ctx.fillStyle = rgba('#ffd0f4', bulb * 0.8);
  ctx.beginPath(); ctx.arc(hx + hr * 0.10 - 4, hy - hr * 1.30, 5, 0, Math.PI * 2); ctx.fill();

  // 眼睛（会眨）
  const blink = 1 - (0.92 * (Math.abs(t - 4.15) < 0.10 ? 1 : 0) + 0.92 * (Math.abs(t - 8.85) < 0.10 ? 1 : 0));
  [[-0.30, 1], [0.26, 1]].forEach(([dx, k]) => {
    const ex = hx + hr * dx, ey = hy - hr * 0.10;
    ctx.fillStyle = '#f3ffe8';
    ctx.beginPath(); ctx.ellipse(ex, ey, hr * 0.26, hr * 0.30 * blink + 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
    if (blink > 0.4) {
      const look = Math.sin(t * 0.9) * hr * 0.05;
      ctx.fillStyle = '#17213a';
      ctx.beginPath(); ctx.arc(ex + look, ey + hr * 0.02, hr * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba('#ffffff', 0.9);
      ctx.beginPath(); ctx.arc(ex + look - hr * 0.045, ey - hr * 0.04, hr * 0.045, 0, Math.PI * 2); ctx.fill();
    }
  });
  // 嘴
  ctx.strokeStyle = '#3d6b1f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  const mouth = 0.35 + 0.25 * Math.sin(t * 1.4);
  ctx.arc(hx + hr * 0.02, hy + hr * 0.42, hr * 0.30, 0.15, 0.15 + mouth * 1.6);
  ctx.stroke();
  // 腮红
  ctx.fillStyle = rgba('#ff9cc4', 0.35);
  ctx.beginPath(); ctx.ellipse(hx - hr * 0.52, hy + hr * 0.30, hr * 0.18, hr * 0.12, 0, 0, Math.PI * 2); ctx.fill();

  // 玻璃罩高光
  ctx.beginPath();
  ctx.strokeStyle = rgba('#dcffff', 0.75);
  ctx.lineWidth = 5;
  ctx.arc(hx, hy, hr * 1.10, -2.5, -1.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = rgba('#dcffff', 0.35);
  ctx.lineWidth = 3;
  ctx.arc(hx, hy, hr * 1.10, -1.35, -1.0);
  ctx.stroke();

  // 右臂（伸出手）—— 单独一层，画在台面之上
}

function drawCookArm(t) {
  const lean = clamp((t - 1.45) / 0.35) * (1 - clamp((t - 2.35) / 0.5));
  const hx = W * 0.190 + lean * W * 0.012;
  const shY = H * 0.508;
  const [tx, ty] = handTarget(t);
  arm(hx + W * 0.047, shY + H * 0.006, tx, ty, H * 0.100, 1, W * 0.032, W * 0.027, P.orange);
  ctx.fillStyle = P.skin2;
  ctx.beginPath(); ctx.arc(tx, ty, W * 0.015, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
  // 按下时的手部小气浪
  const p = (t - 1.95) / 0.4;
  if (p > 0 && p < 1) {
    ctx.strokeStyle = rgba('#ffd0d8', 0.45 * (1 - p));
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(tx, ty + 6, W * 0.02 * (1 + p * 1.4), 0, Math.PI * 2); ctx.stroke();
  }
}

// ---------- 咖啡杯 ----------
function cupState(t) {
  const home = [W * 0.115, H * 0.688];
  const p = [W * 0.585, H * 0.452];
  const held = [W * 0.127, H * 0.632];
  if (t < 3.15) return { x: home[0], y: home[1] + Math.sin(t * 2.2) * 3, s: 1, rot: 0, a: 1 };
  if (t < 3.85) {
    const k = ease((t - 3.15) / 0.70);
    return { x: lerp(home[0], home[0] + W * 0.045, k), y: lerp(home[1], H * 0.545, k), s: 1 - k * 0.15, rot: k * 0.18, a: 1 };
  }
  if (t < 4.70) {
    const k = ease((t - 3.85) / 0.85);
    return {
      x: lerp(home[0] + W * 0.045, p[0], k),
      y: lerp(H * 0.545, p[1], k) - Math.sin(k * Math.PI) * H * 0.03,
      s: lerp(0.85, 0.62, k), rot: 0.18 + k * 0.8, a: 1
    };
  }
  if (t < 4.95) {
    const k = (t - 4.70) / 0.25;
    return { x: p[0], y: p[1], s: lerp(0.62, 0.06, k), rot: 1.0 + k * 0.6, a: 1 - k };
  }
  if (t < 6.55) return { x: p[0], y: p[1], s: 0, rot: 0, a: 0 };
  if (t < 7.30) {
    const k = ease((t - 6.55) / 0.75);
    return {
      x: lerp(p[0], home[0], k), y: lerp(p[1], home[1], k) + Math.sin(k * Math.PI) * H * 0.03,
      s: lerp(0.42, 1, k), rot: lerp(-1.2, 0, k), a: clamp(k * 3)
    };
  }
  // 落回台面：轻轻一顿
  const bt = t - 7.30;
  const sq = bt < 0.35 ? 1 + Math.sin(bt * 18) * 0.10 * (1 - bt / 0.35) : 1;
  return { x: home[0], y: home[1] + Math.sin(t * 2.2) * 2, s: 1, rot: 0, a: 1, sq };
}

function drawCup(t) {
  const st = cupState(t);
  if (st.a <= 0.01 || st.s <= 0.01) return;
  const w = W * 0.034 * st.s, h = H * 0.062 * st.s;
  ctx.save();
  ctx.globalAlpha = clamp(st.a);
  ctx.translate(st.x, st.y);
  ctx.rotate(st.rot);
  if (st.sq) ctx.scale(1 / st.sq, st.sq);
  // 杯把
  ctx.strokeStyle = P.ink; ctx.lineWidth = 6 * st.s;
  ctx.beginPath();
  ctx.ellipse(-w * 0.52, 0, w * 0.34, h * 0.30, 0, 0.7, 5.6);
  ctx.stroke();
  ctx.strokeStyle = P.white; ctx.lineWidth = 4 * st.s;
  ctx.beginPath();
  ctx.ellipse(-w * 0.52, 0, w * 0.34, h * 0.30, 0, 0.7, 5.6);
  ctx.stroke();
  // 杯身
  ctx.beginPath();
  ctx.moveTo(-w * 0.46, -h * 0.44);
  ctx.lineTo(w * 0.46, -h * 0.44);
  ctx.quadraticCurveTo(w * 0.40, h * 0.44, w * 0.30, h * 0.46);
  ctx.lineTo(-w * 0.32, h * 0.46);
  ctx.quadraticCurveTo(-w * 0.42, h * 0.44, -w * 0.46, -h * 0.44);
  ctx.closePath();
  ctx.fillStyle = P.white;
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5 * st.s; ctx.stroke();
  // 阴影侧
  ctx.fillStyle = rgba('#7fb7c8', 0.55);
  ctx.beginPath();
  ctx.moveTo(w * 0.18, -h * 0.44);
  ctx.lineTo(w * 0.46, -h * 0.44);
  ctx.quadraticCurveTo(w * 0.40, h * 0.44, w * 0.30, h * 0.46);
  ctx.lineTo(w * 0.10, h * 0.46);
  ctx.closePath();
  ctx.fill();
  // 咖啡
  ctx.fillStyle = '#4a2318';
  ctx.beginPath(); ctx.ellipse(0, -h * 0.42, w * 0.44, h * 0.10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba('#ffe2b8', 0.65);
  ctx.beginPath(); ctx.ellipse(-w * 0.10, -h * 0.43, w * 0.16, h * 0.035, 0, 0, Math.PI * 2); ctx.fill();
  // 红条纹
  ctx.fillStyle = P.red;
  ctx.fillRect(-w * 0.44, h * 0.02, w * 0.88, h * 0.09);
  ctx.restore();
  // 热气
  if (st.s > 0.85 && t < 8.6) {
    for (let i = 0; i < 3; i++) {
      const lf = mod(t * 0.55 + i * 0.33, 1);
      ctx.fillStyle = rgba('#ffffff', 0.10 * (1 - lf));
      ctx.beginPath();
      ctx.ellipse(st.x + Math.sin(t * 2 + i * 2) * W * 0.008, st.y - h * 0.5 - lf * H * 0.09,
        W * 0.010 * (0.6 + lf * 1.4), H * 0.014 * (0.6 + lf * 1.3), 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- 甜甜圈 ----------
function donutState(t) {
  const tray = [W * 0.402, H * 0.682];
  const cx = W * 0.585, cy = H * 0.452, rad = W * 0.196;
  if (t < 2.55) return { x: tray[0], y: tray[1] + Math.sin(t * 2.4) * 2, s: 1, rot: 0 };
  if (t < 3.30) {
    const k = ease((t - 2.55) / 0.75);
    return { x: lerp(tray[0], cx + rad, k), y: lerp(tray[1], cy, k), s: 1 - k * 0.18, rot: k * 1.2 };
  }
  if (t < 8.55) {
    const a = -0.2 + (t - 3.30) * 0.82;
    return {
      x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad * 0.78,
      s: 0.82, rot: t * 1.9
    };
  }
  if (t < 9.20) {
    const k = ease((t - 8.55) / 0.65);
    return {
      x: lerp(cx + Math.cos(-0.2 + (8.55 - 3.30) * 0.82) * rad, W * 0.190, k),
      y: lerp(cy + Math.sin(-0.2 + (8.55 - 3.30) * 0.82) * rad * 0.78, H * 0.300, k) - Math.sin(k * Math.PI) * H * 0.11,
      s: lerp(0.82, 0.72, k), rot: lerp(8.55 * 1.9, 9.20 * 1.9, k)
    };
  }
  return { x: W * 0.190, y: H * 0.300 + Math.sin((t - 9.2) * 8) * 3, s: 0.72, rot: 9.20 * 1.9 };
}

function drawDonut(t) {
  const d = donutState(t);
  const R = W * 0.026 * d.s;
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.rotate(d.rot * 0.12);
  ctx.scale(1, 0.62 + Math.abs(Math.cos(d.rot)) * 0.38);
  // 本体
  ctx.fillStyle = '#d99a52';
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  // 糖霜
  ctx.fillStyle = '#ff9bd2';
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.94, 0, Math.PI * 2);
  ctx.arc(0, 0, R * 0.44, 0, Math.PI * 2, true);
  ctx.fill();
  // 洞
  ctx.fillStyle = '#08202a';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.38, 0, Math.PI * 2); ctx.fill();
  // 彩针
  for (let i = 0; i < 8; i++) {
    const r = K.rng('kw:sp' + i);
    const a = r() * 6.28, rr2 = R * (0.52 + r() * 0.34);
    ctx.fillStyle = ['#fff3a0', '#8ff4ff', '#ffffff', '#ff7ba8'][i % 4];
    ctx.save();
    ctx.translate(Math.cos(a) * rr2, Math.sin(a) * rr2);
    ctx.rotate(r() * 3);
    ctx.fillRect(-R * 0.05, -R * 0.02, R * 0.17, R * 0.045);
    ctx.restore();
  }
  ctx.restore();
}

// ---------- 微重力浮尘 ----------
function drawDust(t) {
  for (let i = 0; i < 26; i++) {
    const r = K.rng('kw:d' + i);
    const x = r() * W + Math.sin(t * 0.7 + i) * W * 0.02;
    const y = r() * H * 0.8 + Math.cos(t * 0.5 + i * 1.3) * H * 0.02;
    ctx.fillStyle = rgba('#dffcff', 0.10 + 0.10 * Math.sin(t * 2 + i));
    ctx.beginPath(); ctx.arc(x, y, 1.5 + r() * 2, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- 调色 ----------
function grade(t) {
  // 门开后的偏光
  const ok = portalOpen(t);
  if (ok > 0.02) {
    const g = ctx.createRadialGradient(W * 0.585, H * 0.45, W * 0.05, W * 0.585, H * 0.45, W * 0.55);
    g.addColorStop(0, rgba('#6ff2ff', 0.16 * ok));
    g.addColorStop(0.5, rgba('#7b4dff', 0.07 * ok));
    g.addColorStop(1, rgba('#000000', 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  // 暗角
  const v = ctx.createRadialGradient(W * 0.5, H * 0.48, H * 0.30, W * 0.5, H * 0.48, H * 0.95);
  v.addColorStop(0, rgba('#000000', 0));
  v.addColorStop(1, rgba('#03060c', 0.55));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  // 颗粒
  const r = K.rng('kw:grain' + Math.floor(t * 30));
  ctx.fillStyle = rgba('#ffffff', 0.05);
  for (let i = 0; i < 220; i++) {
    ctx.fillRect(r() * W, r() * H, 2, 2);
  }
}

window.renderAt = (t) => {
  ENV.reset();
  drawRoom(t);
  drawWindow(t);
  drawPortal(t);
  drawCook(t);
  drawCounter(t);
  drawButton(t);
  drawCookArm(t);
  drawDust(t);
  drawCup(t);
  drawDonut(t);
  grade(t);
};

drawRoom(0); drawWindow(0); drawPortal(0); drawCook(0); drawCounter(0); drawButton(0); drawCookArm(0);
drawCup(0); drawDonut(0); grade(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
