// gaoxiao · 搞笑历史卡通 —— 站点 10 秒样片《一块招牌》
//
// 一堵老墙上的一块木牌被四只不同袖口的手轮番撕下、钉上新招牌（面 / 茶 / 酒 / 咖啡），
// 住在墙洞里的老头一步没挪，最后牌子歪掉，他举出一块「随便」。厚墨线 + 印章 + 速度线。
const SPEC = {
  id: 'gaoxiao',
  seed: 'av:gaoxiao',
  family: 'cel',
  w: 1920,
  h: 1080,
  bg: '#f7f0dc',
  label: { zh: '搞笑历史卡通', en: 'Slapstick History Toon', station: '04 · 卡通动画' }
};

const ENV = STYLEKIT.page(document.getElementById('c'), { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });
const K = STYLEKIT;
const W = ENV.W, H = ENV.H, ctx = ENV.ctx;
const clamp = K.clamp, lerp = K.lerp, ease = K.ease, shade = K.shade, rgba = K.rgba;

const P = {
  ink: '#241a14',
  wall: '#d9b878',
  wall2: '#c39f5e',
  wall3: '#a8843f',
  brick: '#a8503a',
  wood: '#8a5a32',
  wood2: '#653f22',
  cream: '#f3e6c6',
  red: '#b23a2c',
  blue: '#3b6a8f',
  green: '#546b3c',
  suit: '#3a3a44',
  gold: '#d9a441'
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
  if (stroke) { ctx.lineWidth = lw || 6; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function mod(x, m) { return ((x % m) + m) % m; }

// ---------- 墙 ----------
function drawWall(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, P.wall);
  g.addColorStop(0.6, P.wall2);
  g.addColorStop(1, P.wall3);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 砖缝
  ctx.strokeStyle = rgba('#6f5228', 0.35);
  ctx.lineWidth = 3;
  const rowH = H * 0.075;
  for (let r = 0; r < Math.ceil(H / rowH); r++) {
    const y = r * rowH;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    for (let c = 0; c < 14; c++) {
      const x = c * W / 13 + ((r % 2) ? W / 26 : 0);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke();
    }
  }
  // 斑驳的旧灰泥（按砖缝对齐的浅块）
  const r = K.rng('gx:patch');
  for (let i = 0; i < 7; i++) {
    const pw = 2 + Math.floor(r() * 2), ph = 1 + Math.floor(r() * 2);
    const cx0 = Math.floor(r() * 11) * W / 13, cy0 = Math.floor(r() * 9) * rowH;
    ctx.fillStyle = rgba(i % 2 ? '#ecd6a4' : '#b8934f', 0.45);
    ctx.fillRect(cx0, cy0, pw * W / 13, ph * rowH);
  }
  // 裂缝
  ctx.strokeStyle = rgba('#4a3418', 0.55);
  ctx.lineWidth = 4;
  [[0.12, 0.05, 0.20, 0.35], [0.86, 0.10, 0.78, 0.42], [0.60, 0.62, 0.66, 0.90]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1 * W, y1 * H);
    ctx.lineTo((x1 + 0.02) * W, ((y1 + y2) / 2) * H);
    ctx.lineTo(x2 * W, y2 * H);
    ctx.stroke();
  });
  // 角落暗角
  ctx.fillStyle = rgba('#3a2a12', 0.20);
  ctx.fillRect(0, 0, W, H * 0.05);
  ctx.fillRect(0, H * 0.95, W, H * 0.05);

  // 檐口木梁
  ctx.fillStyle = P.wood2;
  ctx.fillRect(0, H * 0.045, W, H * 0.055);
  ctx.fillStyle = P.wood;
  ctx.fillRect(0, H * 0.045, W, H * 0.012);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5;
  ctx.strokeRect(0, H * 0.045, W, H * 0.055);

  // 右侧挂灯笼
  const lx = W * 0.905, ly = H * 0.20;
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(lx, H * 0.10); ctx.lineTo(lx, ly - H * 0.045); ctx.stroke();
  ctx.fillStyle = P.red;
  ctx.beginPath();
  ctx.ellipse(lx, ly, W * 0.030, H * 0.045, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = rgba('#f0d9a8', 0.8); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(lx, ly - H * 0.044); ctx.lineTo(lx, ly + H * 0.044); ctx.stroke();
  ctx.fillStyle = rgba('#ffd88a', 0.35);
  ctx.beginPath(); ctx.arc(lx, ly, W * 0.045, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.gold;
  ctx.fillRect(lx - W * 0.010, ly - H * 0.052, W * 0.020, H * 0.008);
  ctx.fillRect(lx - W * 0.010, ly + H * 0.046, W * 0.020, H * 0.008);
  // 穗
  for (let i = -2; i <= 2; i++) {
    ctx.strokeStyle = rgba('#e8c05a', 0.9); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lx + i * 5, ly + H * 0.052);
    ctx.lineTo(lx + i * 6 + Math.sin(t * 1.5 + i) * 3, ly + H * 0.075);
    ctx.stroke();
  }
}

// ---------- 墙洞里的老头 ----------
function drawOldMan(t) {
  const hx = W * 0.180, sill = H * 0.885, ow = W * 0.088, oh = H * 0.190;
  // 墙洞（拱形，带木框）
  ctx.fillStyle = '#2a1d12';
  ctx.beginPath();
  ctx.moveTo(hx - ow, sill);
  ctx.lineTo(hx - ow, sill - oh + ow);
  ctx.quadraticCurveTo(hx - ow, sill - oh, hx, sill - oh);
  ctx.quadraticCurveTo(hx + ow, sill - oh, hx + ow, sill - oh + ow);
  ctx.lineTo(hx + ow, sill);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 7; ctx.stroke();
  // 洞里的暗（只压下半，留出拱顶）
  ctx.fillStyle = rgba('#120c07', 0.85);
  ctx.fillRect(hx - ow + 8, sill - oh * 0.55, ow * 2 - 16, oh * 0.55 - 6);
  // 老头（只露上半身，靠着窗台）
  const bob = Math.sin(t * 1.3) * 3;
  const sy = sill - H * 0.020 + bob;
  // 肩/身
  ctx.fillStyle = P.blue;
  ctx.beginPath();
  ctx.moveTo(hx - W * 0.040, sill);
  ctx.quadraticCurveTo(hx - W * 0.036, sy + H * 0.010, hx, sy + H * 0.006);
  ctx.quadraticCurveTo(hx + W * 0.036, sy + H * 0.010, hx + W * 0.040, sill);
  ctx.closePath();
  ink(P.blue, P.ink, 5);
  // 头
  ctx.fillStyle = '#f2cda6';
  ctx.beginPath(); ctx.arc(hx, sy - H * 0.020, W * 0.028, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5; ctx.stroke();
  // 斗笠
  ctx.fillStyle = P.wall3;
  ctx.beginPath();
  ctx.moveTo(hx - W * 0.048, sy - H * 0.032);
  ctx.quadraticCurveTo(hx, sy - H * 0.082, hx + W * 0.048, sy - H * 0.032);
  ctx.closePath();
  ink(P.wall3, P.ink, 5);
  ctx.strokeStyle = rgba('#8a6a34', 0.8); ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(hx - W * 0.040, sy - H * 0.040);
  ctx.quadraticCurveTo(hx, sy - H * 0.070, hx + W * 0.040, sy - H * 0.040);
  ctx.stroke();
  // 白胡子
  ctx.fillStyle = '#efe6d2';
  ctx.beginPath();
  ctx.ellipse(hx, sy + H * 0.002, W * 0.016, H * 0.018, 0, 0, Math.PI);
  ctx.fill();
  // 眼（一直半闭，最后睁一下）
  const open = t > 8.9 ? 1 : 0.42;
  ctx.fillStyle = P.ink;
  ctx.beginPath(); ctx.ellipse(hx - W * 0.010, sy - H * 0.024, W * 0.0045, H * 0.006 * open, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx + W * 0.010, sy - H * 0.024, W * 0.0045, H * 0.006 * open, 0, 0, Math.PI * 2); ctx.fill();
  // 左臂搭在窗台上
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(hx - W * 0.034, sill - H * 0.030);
  ctx.lineTo(hx - W * 0.046, sill - H * 0.004);
  ctx.stroke();
  ctx.fillStyle = '#f2cda6';
  ctx.beginPath(); ctx.arc(hx - W * 0.046, sill - H * 0.004, W * 0.010, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  // 窗台木板
  ctx.fillStyle = P.wood;
  ctx.fillRect(hx - ow - 12, sill, ow * 2 + 24, H * 0.014);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 5;
  ctx.strokeRect(hx - ow - 12, sill, ow * 2 + 24, H * 0.014);

  // 最后的小牌子「随便」
  if (t > 9.0) {
    const k = ease(clamp((t - 9.0) / 0.35));
    ctx.save();
    ctx.translate(hx + W * 0.075 + k * W * 0.010, sill - H * 0.085 - k * H * 0.010);
    ctx.rotate(-0.16);
    ctx.fillStyle = P.cream;
    ctx.fillRect(-W * 0.031, -H * 0.026, W * 0.062, H * 0.052);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4;
    ctx.strokeRect(-W * 0.031, -H * 0.026, W * 0.062, H * 0.052);
    ctx.fillStyle = P.ink;
    ctx.font = `700 ${Math.round(H * 0.032)}px "Microsoft YaHei","Noto Sans SC",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('随便', 0, 0);
    ctx.restore();
    // 举牌的手臂
    ctx.strokeStyle = P.ink; ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(hx + W * 0.040, sill - H * 0.010);
    ctx.lineTo(hx + W * 0.062, sill - H * 0.055);
    ctx.stroke();
  }
}

// ---------- 木牌 ----------
const SIGNS = [
    { ch: '麵', until: 1.00 },
  { ch: '面', until: 2.85 },
  { ch: '茶', until: 4.65 },
  { ch: '酒', until: 6.45 },
  { ch: '咖啡', until: 8.30 }
];

function signAt(t) {
  for (let i = 0; i < SIGNS.length; i++) if (t < SIGNS[i].until) return { i, ch: SIGNS[i].ch };
  return { i: 5, ch: '咖啡' };
}

function drawsign(t, cx, cy, w, h, ch, scale) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  // 背板
  ctx.fillStyle = P.wood;
  rr(-w / 2, -h / 2, w, h, 10); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 8; ctx.stroke();
  // 木纹
  ctx.strokeStyle = rgba('#5a3a1c', 0.55);
  ctx.lineWidth = 3;
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h / 2 + h * i / 6);
    ctx.lineTo(w / 2 - 6, -h / 2 + h * i / 6 + Math.sin(i * 2) * 6);
    ctx.stroke();
  }
  // 内框
  ctx.strokeStyle = P.cream;
  ctx.lineWidth = 6;
  ctx.strokeRect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44);
  // 字
  ctx.fillStyle = P.cream;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = ch.length > 1 ? h * 0.42 : h * 0.62;
  ctx.font = `700 ${Math.round(size)}px "Microsoft YaHei","Noto Sans SC",sans-serif`;
  ctx.fillText(ch, 0, 0);
  // 高光
  ctx.fillStyle = rgba('#ffffff', 0.12);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.lineTo(w / 2 - w * 0.15, -h / 2 + h * 0.22);
  ctx.lineTo(-w / 2 + w * 0.02, -h / 2 + h * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBoard(t) {
  const cx = W * 0.60, cy = H * 0.44, w = W * 0.255, h = H * 0.34;
  const sig = signAt(t);
  // 换牌瞬间翻板
  const swaps = [1.0, 2.85, 4.65, 6.45];
  let rot = 0, dy = 0, sc = 1;
  swaps.forEach((s) => {
    const k = (t - s) / 0.28;
    if (k > 0 && k < 1) {
      rot = Math.sin(k * Math.PI) * 0.55;
      dy = Math.sin(k * Math.PI) * H * 0.06;
      sc = 1 - Math.sin(k * Math.PI) * 0.08;
    }
  });
  // 最后的歪掉
  const fallK = clamp((t - 8.30) / 0.90);
  if (t > 8.30) {
    rot += ease(fallK) * 0.55;
    dy += ease(fallK) * H * (0.28 + fallK * 0.55);
    sc = 1 - fallK * 0.06;
  }
  ctx.save();
  ctx.translate(cx, cy + dy);
  ctx.rotate(rot);
  ctx.scale(sc, sc);
  // 钉子在墙上留下的一圈旧印
  ctx.fillStyle = rgba('#7a5a2c', 0.55);
  rr(-w * 0.52, -h * 0.54, w * 1.04, h * 1.08, 14); ctx.fill();
  drawsign(t, 0, 0, w, h, sig.ch, 1);
  // 钉子
  [[-w * 0.44, -h * 0.44], [w * 0.44, -h * 0.44], [-w * 0.44, h * 0.44], [w * 0.44, h * 0.44]].forEach(([nx, ny]) => {
    ctx.fillStyle = '#c9c2ae';
    ctx.beginPath(); ctx.arc(nx, ny, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
  });
  ctx.restore();

  // 掉下来的旧牌（撕下时飞走）
  const tearT = [1.0, 2.85, 4.65, 6.45];
  tearT.forEach((s, i) => {
    const k = (t - s) / 0.7;
    if (k > 0 && k < 1) {
      ctx.save();
      ctx.translate(cx + W * 0.06 + k * W * 0.10, cy + H * 0.10 + k * H * 0.45);
      ctx.rotate(k * 1.6);
      drawsign(t, 0, 0, w * 0.9, h * 0.9, SIGNS[i].ch, 1 - k * 0.25);
      ctx.globalAlpha = 1 - k;
      ctx.restore();
    }
  });

  // 墙上砸出的灰
  tearT.forEach((s) => {
    const k = (t - s) / 0.6;
    if (k > 0 && k < 1) {
      for (let j = 0; j < 14; j++) {
        const rr2 = K.rng('gx:dust' + s + j);
        const a = rr2() * 6.28;
        const d = (k * 0.6 + rr2() * 0.4) * W * 0.16;
        ctx.fillStyle = rgba('#e8d8b0', 0.55 * (1 - k));
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.65, 3 + rr2() * 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// ---------- 手 ----------
function drawHand(t) {
  // 四段动作：谁的手、什么时候、做什么
  const acts = [
    { t0: 0.62, t1: 1.22, x: W * 0.70, y: H * 1.02, cuff: P.blue, mode: 'grab' },
    { t0: 1.30, t1: 2.55, x: W * 0.44, y: H * 1.02, cuff: P.red, mode: 'hammer' },
    { t0: 2.50, t1: 3.05, x: W * 0.66, y: H * 1.02, cuff: P.green, mode: 'grab' },
    { t0: 3.10, t1: 4.35, x: W * 0.76, y: H * 1.02, cuff: P.gold, mode: 'hammer' },
    { t0: 4.28, t1: 4.85, x: W * 0.42, y: H * 1.02, cuff: P.suit, mode: 'grab' },
    { t0: 4.90, t1: 6.15, x: W * 0.58, y: H * 1.02, cuff: P.blue, mode: 'hammer' },
    { t0: 6.08, t1: 6.65, x: W * 0.74, y: H * 1.02, cuff: P.red, mode: 'grab' },
    { t0: 6.70, t1: 7.95, x: W * 0.50, y: H * 1.02, cuff: P.suit, mode: 'hammer' }
  ];
  acts.forEach((a) => {
    if (t < a.t0 || t > a.t1) return;
    const k = (t - a.t0) / (a.t1 - a.t0);
    // 进场 / 出场
    const inK = ease(clamp(k * 4));
    const outK = ease(clamp((1 - k) * 5));
    const lift = Math.min(inK, outK);
    const y = a.y - lift * H * 0.32;
    const sway = Math.sin(t * 7) * 0.06;
    ctx.save();
    ctx.translate(a.x, y);
    ctx.rotate(sway);
    // 袖口（下宽上窄的袖子）
    ctx.fillStyle = a.cuff;
    ctx.beginPath();
    ctx.moveTo(-W * 0.030, H * 0.085);
    ctx.lineTo(W * 0.030, H * 0.085);
    ctx.lineTo(W * 0.052, H * 0.400);
    ctx.lineTo(-W * 0.052, H * 0.400);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = rgba('#ffffff', 0.16);
    ctx.beginPath();
    ctx.moveTo(-W * 0.024, H * 0.090);
    ctx.lineTo(-W * 0.012, H * 0.090);
    ctx.lineTo(-W * 0.026, H * 0.390);
    ctx.lineTo(-W * 0.040, H * 0.390);
    ctx.closePath();
    ctx.fill();
    // 袖口花边
    ctx.fillStyle = shade(a.cuff, -0.18);
    rr(-W * 0.032, H * 0.074, W * 0.064, H * 0.026, 6); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
    // 拳头（握拳，带拇指和指节）
    ctx.fillStyle = '#f0c49a';
    rr(-W * 0.034, H * 0.014, W * 0.068, H * 0.062, 13); ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-W * 0.031, H * 0.038, W * 0.014, H * 0.026, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#e8b98c'; ctx.fill();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = rgba('#a06a44', 0.65); ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * W * 0.015 + W * 0.002, H * 0.024);
      ctx.lineTo(i * W * 0.015 + W * 0.002, H * 0.054);
      ctx.stroke();
    }
    // 锤子
    if (a.mode === 'hammer') {
      const swing = Math.sin((t - a.t0) * Math.PI * 6) * 0.5;
      ctx.save();
      ctx.translate(0, H * 0.022);
      ctx.rotate(-0.55 + swing);
      ctx.fillStyle = P.wood2;
      ctx.fillRect(-W * 0.005, -H * 0.115, W * 0.010, H * 0.120);
      ctx.fillStyle = '#8d8a80';
      rr(-W * 0.022, -H * 0.150, W * 0.044, H * 0.042, 6); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  });
}

// ---------- 动效：速度线 / 印章 / 点点 ----------
function drawFx(t) {
  // 换牌瞬间的放射线
  const swaps = [1.0, 2.85, 4.65, 6.45];
  swaps.forEach((s) => {
    const k = (t - s) / 0.45;
    if (k > 0 && k < 1) {
      ctx.save();
      ctx.translate(W * 0.60, H * 0.44);
      for (let i = 0; i < 16; i++) {
        const a = i * Math.PI / 8;
        const r1 = W * (0.14 + k * 0.10), r2 = r1 + W * 0.10 * (1 - k);
        ctx.strokeStyle = rgba('#2a1d12', 0.35 * (1 - k));
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1 * 0.7);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2 * 0.7);
        ctx.stroke();
      }
      ctx.restore();
    }
  });
  // 右上角的朱印（会盖章）
  const stampK = clamp((t - 8.55) / 0.25);
  if (stampK > 0) {
    ctx.save();
    ctx.translate(W * 0.855, H * 0.315);
    ctx.rotate(-0.12);
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = P.red;
    ctx.lineWidth = 5;
    ctx.strokeRect(-W * 0.045, -H * 0.055, W * 0.090, H * 0.110);
    ctx.fillStyle = P.red;
    ctx.font = `700 ${Math.round(H * 0.036)}px "Microsoft YaHei","Noto Sans SC",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('老', -W * 0.022, -H * 0.020);
    ctx.fillText('店', -W * 0.022, H * 0.020);
    ctx.fillText('翻', W * 0.022, -H * 0.020);
    ctx.fillText('新', W * 0.022, H * 0.020);
    ctx.restore();
  }
  // 半调网点（左下阴影）
  ctx.fillStyle = rgba('#2a1d12', 0.10);
  for (let i = 0; i < 120; i++) {
    const r = K.rng('gx:ht' + i);
    const x = r() * W * 0.28, y = H * 0.75 + r() * H * 0.25;
    ctx.beginPath(); ctx.arc(x, y, 2 + r() * 2, 0, Math.PI * 2); ctx.fill();
  }
}

function grade(t) {
  // 老纸色
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(255,236,196,0.18)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const v = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.35, W * 0.5, H * 0.45, H * 1.05);
  v.addColorStop(0, rgba('#000000', 0));
  v.addColorStop(1, rgba('#2b1c08', 0.42));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
  const r = K.rng('gx:grain' + Math.floor(t * 24));
  for (let i = 0; i < 520; i++) {
    ctx.fillStyle = rgba('#ffffff', 0.05);
    ctx.fillRect(r() * W, r() * H, 2, 2);
  }
}

window.renderAt = (t) => {
  ENV.reset();
  drawWall(t);
  drawOldMan(t);
  drawBoard(t);
  drawHand(t);
  drawFx(t);
  grade(t);
};

drawWall(0); drawOldMan(0); drawBoard(0); drawHand(0); drawFx(0); grade(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
