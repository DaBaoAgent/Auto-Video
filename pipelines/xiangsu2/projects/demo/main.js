// xiangsu2 · 2.5D 像素 —— 站点 10 秒样片《灯塔夜航》
//
// 320×180 的离屏画布逐帧手绘，再 6 倍最近邻放大到 1920×1080，保住像素质感：
// 夜色海面、崖上的灯塔光束旋转扫海、浪拍礁石溅起像素飞沫、提灯的小孙女沿崖道走。
const SPEC = {
  id: 'xiangsu2',
  seed: 'av:xiangsu2',
  family: 'pixel',
  w: 1920,
  h: 1080,
  label: { zh: '2.5D 像素', en: '2.5D Pixel', station: '04 · 卡通动画' }
};

const ENV = STYLEKIT.page(document.getElementById('c'), { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });
const K = STYLEKIT;
const W = ENV.W, H = ENV.H, ctx = ENV.ctx;
const clamp = K.clamp, lerp = K.lerp, ease = K.ease, shade = K.shade, rgba = K.rgba;

const PW = 320, PH = 180, SC = 6;
const lo = document.createElement('canvas');
lo.width = PW; lo.height = PH;
const lx = lo.getContext('2d');
lx.imageSmoothingEnabled = false;

const P = {
  sky0: '#0a0f28',
  sky1: '#141b42',
  sky2: '#232a5c',
  sky3: '#3a4178',
  sea0: '#0f1a3a',
  sea1: '#16244c',
  sea2: '#1e3159',
  sea3: '#2a4267',
  foam: '#cfe3f2',
  moon: '#f6eec8',
  moon2: '#ded3a8',
  rock: '#0b1220',
  rock2: '#182236',
  beam: '#ffe9a8',
  lamp: '#fff2c4',
  red: '#c4453f',
  white: '#e9eef6',
  girl: '#e8a05c',
  lantern: '#ffcf6a'
};

function px(x, y, w, h, c) { lx.fillStyle = c; lx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function dot(x, y, c) { px(x, y, 1, 1, c); }
function rnd(i) { return K.rng('xs:' + i); }

// ---------- 天空 ----------
function drawSky(t) {
  // 分带渐变 + 抖动过渡
  const bands = [
    [0, 34, P.sky0], [34, 62, P.sky1], [62, 82, P.sky2], [82, 96, P.sky3], [96, 104, '#33477a']
  ];
  bands.forEach(([y0, y1, c]) => {
    px(0, y0, PW, y1 - y0, c);
  });
  // 抖动：只在两条分带的交界各铺两行，做出手绘像素的过渡
  const edges = [34, 62, 82, 96];
  edges.forEach((ey) => {
    const r = rnd('dith' + ey);
    for (let x = 0; x < PW; x++) {
      if (r() < 0.28) dot(x, ey - 1, r() > 0.5 ? P.sky1 : P.sky2);
      if (r() < 0.28) dot(x, ey, r() > 0.5 ? P.sky2 : P.sky3);
    }
  });
  // 星
  for (let i = 0; i < 46; i++) {
    const r = K.rng('xs:star' + i);
    const sx = Math.floor(r() * PW), sy = Math.floor(r() * 88);
    const tw = Math.abs(Math.sin(t * (0.8 + r() * 2) + i));
    if (tw > 0.35) {
      dot(sx, sy, tw > 0.8 ? '#ffffff' : '#c8d4ff');
      if (tw > 0.92) { dot(sx - 1, sy, '#8fa4e0'); dot(sx + 1, sy, '#8fa4e0'); }
    }
  }
  // 月亮
  const mx = 246, my = 30, mr = 13;
  lx.fillStyle = P.moon;
  lx.beginPath(); lx.arc(mx, my, mr, 0, Math.PI * 2); lx.fill();
  // 陨石坑
  [[-4, -2, 3], [3, 3, 2], [-1, 6, 2], [5, -4, 2]].forEach(([dx, dy, rr2]) => {
    lx.fillStyle = P.moon2;
    lx.beginPath(); lx.arc(mx + dx, my + dy, rr2, 0, Math.PI * 2); lx.fill();
  });
  // 月晕
  lx.fillStyle = rgba('#f6eec8', 0.10);
  lx.beginPath(); lx.arc(mx, my, mr + 7, 0, Math.PI * 2); lx.fill();
}

// ---------- 海 ----------
function seaY(t) { return 104; }

function drawSea(t) {
  const y0 = seaY(t);
  const bands = [[y0, 116, '#2b4070'], [116, 132, '#1f3159'], [132, 150, '#17264a'], [150, PH, '#101b34']];
  bands.forEach(([a, b, c]) => px(0, a, PW, b - a, c));
  // 海平线
  px(0, y0, PW, 1, '#6e8ac8');
  px(0, y0 + 1, PW, 1, '#3b5590');
  // 水波：一条条移动的短线
  for (let row = 0; row < 9; row++) {
    const y = y0 + 4 + row * 8 + (row % 2);
    const speed = 4 + row * 1.4;
    const count = 14 + row * 2;
    for (let i = 0; i < count; i++) {
      const r = K.rng('xs:wave' + row + i);
      const x = ((r() * PW + t * speed * (1 + row * 0.1)) % (PW + 12)) - 6;
      const len = 2 + Math.floor(r() * (3 + row));
      px(x, y + Math.floor(Math.sin(t * 2 + i) * 1), len, 1, row > 5 ? '#3f5c94' : '#33517f');
      if (r() > 0.86) px(x + len, y - 1, 1, 1, '#7d9bd0');
    }
  }
  // 月光倒影（竖向亮条）
  for (let i = 0; i < 10; i++) {
    const r = K.rng('xs:glim' + i);
    const x = 238 + Math.floor(Math.sin(t * 1.2 + i) * 6) + Math.floor(r() * 6);
    const y = y0 + 6 + i * 8;
    px(x, y, 3 + (i % 3), 1, i % 2 ? '#cfd9f0' : '#93a8d8');
  }
}

// ---------- 崖与礁石 ----------
function drawCliff(t) {
  // 左侧崖体
  const ridge = [[0, 50], [12, 56], [20, 68], [30, 64], [40, 78], [52, 76], [62, 88], [72, 86], [82, 96], [92, 104], [102, 118]];
  lx.fillStyle = '#121d31';
  lx.beginPath();
  lx.moveTo(0, PH);
  ridge.forEach(([x, y]) => lx.lineTo(x, y));
  lx.lineTo(112, PH);
  lx.closePath();
  lx.fill();
  // 崖脊受光
  lx.strokeStyle = '#263855';
  lx.lineWidth = 3;
  lx.beginPath();
  ridge.forEach(([x, y], i) => (i ? lx.lineTo(x, y - 1) : lx.moveTo(x, y - 1)));
  lx.stroke();
  // 崖面折面：沿崖脊一块块错位，做出岩壁体积
  for (let i = 0; i < ridge.length - 1; i++) {
    const [x1, y1] = ridge[i], [x2, y2] = ridge[i + 1];
    const d = 20 + (i % 3) * 8;
    lx.fillStyle = rgba(i % 2 ? '#0a1120' : '#1d2b46', i % 2 ? 0.45 : 0.35);
    lx.beginPath();
    lx.moveTo(x1, y1);
    lx.lineTo(x2, y2);
    lx.lineTo(x2 + 2, y2 + d);
    lx.lineTo(x1 - 4, y1 + d + 6);
    lx.closePath();
    lx.fill();
  }
  // 几道斜向裂隙
  [[18, 74], [44, 84], [68, 96], [92, 112]].forEach(([x0, y0], i) => {
    for (let k = 0; k < 16; k++) {
      px(x0 + k * 0.5, y0 + k * 2.2, 1, 2, rgba('#060b16', 0.55));
    }
  });
  // 崖顶碎石
  for (let i = 0; i < 16; i++) {
    const r = K.rng('xs:cliff' + i);
    const x = 4 + r() * 98;
    px(x, 60 + (x / 102) * 56 + r() * 3, 2 + r() * 3, 1 + r() * 2, r() > 0.5 ? '#26344f' : '#1a2438');
  }

  // 右侧礁石
  lx.fillStyle = '#121d31';
  lx.beginPath();
  lx.moveTo(262, PH);
  lx.lineTo(266, 152);
  lx.lineTo(276, 143);
  lx.lineTo(286, 148);
  lx.lineTo(296, 140);
  lx.lineTo(308, 150);
  lx.lineTo(320, 164);
  lx.lineTo(320, PH);
  lx.closePath();
  lx.fill();
  // 礁脊受光
  px(268, 154, 3, 2, '#263855');
  px(277, 145, 6, 2, '#263855');
  px(297, 142, 5, 2, '#263855');
  px(309, 152, 6, 2, '#263855');

  // 浪拍礁石 + 飞沫
  const ph = (t * 0.9) % 1;
  for (let i = 0; i < 30; i++) {
    const r = K.rng('xs:spray' + i);
    const a = -Math.PI * (0.10 + r() * 0.75);
    const sp = 0.5 + r() * 0.9;
    const x = 288 + Math.cos(a) * (5 + ph * 20) * sp;
    const y = 156 + Math.sin(a) * (5 + ph * 18) * sp + ph * ph * 12;
    if (r() < ph * 1.3) px(x, y, 1 + (r() > 0.7 ? 1 : 0), 1, ph > 0.55 ? '#7f9dcc' : '#eaf4ff');
  }
  // 水线泡沫
  for (let i = 0; i < 20; i++) {
    const r = K.rng('xs:foam' + i);
    const x = 262 + r() * 58;
    const y = 158 + r() * 22 + Math.sin(t * 2 + i) * 1;
    if (y < 158 + r() * 20) px(x, y, 2 + r() * 4, 1, rgba('#dbe9f8', 0.55));
  }
}

// ---------- 灯塔 ----------
const LH = { x: 88, base: 110, top: 54 };

function drawLighthouse(t) {
  const { x, base, top } = LH;
  const wBase = 20, wTop = 9;
  // 塔身：一个梯形，条纹用裁剪画
  lx.save();
  lx.beginPath();
  lx.moveTo(x - wTop / 2, top);
  lx.lineTo(x + wTop / 2, top);
  lx.lineTo(x + wBase / 2, base);
  lx.lineTo(x - wBase / 2, base);
  lx.closePath();
  lx.clip();
  for (let i = 0; i < 14; i++) {
    const y = top + i * 4;
    px(x - wBase, y, wBase * 2, 4, i % 3 === 2 ? P.red : P.white);
  }
  // 右侧暗面
  px(x + 1, top, wBase, base - top, rgba('#0d1526', 0.55));
  lx.restore();
  // 塔身边线
  lx.strokeStyle = rgba('#070d18', 0.9);
  lx.lineWidth = 1;
  lx.beginPath();
  lx.moveTo(x - wTop / 2, top);
  lx.lineTo(x + wTop / 2, top);
  lx.lineTo(x + wBase / 2, base);
  lx.lineTo(x - wBase / 2, base);
  lx.closePath();
  lx.stroke();
  // 基座
  px(x - 15, base - 3, 30, 4, '#22304a');
  px(x - 17, base + 1, 34, 3, P.rock);
  // 灯室
  px(x - 6, top - 8, 12, 9, '#233252');
  px(x - 5, top - 7, 4, 6, P.lamp);
  // 顶盖
  px(x - 7, top - 9, 14, 2, P.red);
  lx.fillStyle = P.red;
  lx.beginPath();
  lx.moveTo(x - 8, top - 8);
  lx.lineTo(x, top - 15);
  lx.lineTo(x + 8, top - 8);
  lx.closePath();
  lx.fill();
  // 灯室闪光
  const fl = 0.5 + 0.5 * Math.sin(t * 6);
  lx.fillStyle = rgba('#fff2c4', 0.45 * fl);
  lx.beginPath(); lx.arc(x - 3, top - 4, 4, 0, Math.PI * 2); lx.fill();
}

// ---------- 光束 ----------
function drawBeam(t) {
  const { x, top } = LH;
  const ox = x, oy = top - 4;
  // 两束对向旋转
  const beams = [
    { ang: -Math.PI * 0.5 + Math.sin(t * 0.5) * 1.02, ph: 0.5 },
    { ang: -Math.PI * 0.5 - Math.sin(t * 0.72 + 1.0) * 0.92, ph: 0 }
  ];
  beams.forEach(({ ang, ph }) => {
    const len = 150;
    const facing = Math.max(0, Math.sin(ang + Math.PI * 0.5 + ph) * 0.6 + 0.4);
    [[0.16, 0.05], [0.10, 0.09], [0.055, 0.14]].forEach(([spread, alpha]) => {
      lx.fillStyle = rgba('#ffe0a0', alpha * (0.7 + 0.6 * facing));
      lx.beginPath();
      lx.moveTo(ox, oy);
      lx.lineTo(ox + Math.cos(ang - spread) * len, oy + Math.sin(ang - spread) * len * 0.6);
      lx.lineTo(ox + Math.cos(ang + spread) * len, oy + Math.sin(ang + spread) * len * 0.6);
      lx.closePath();
      lx.fill();
    });
    // 亮芯（短而实）
    lx.fillStyle = rgba('#fff6d0', 0.30 + 0.25 * facing);
    lx.beginPath();
    lx.moveTo(ox, oy);
    lx.lineTo(ox + Math.cos(ang - 0.022) * len * 0.85, oy + Math.sin(ang - 0.022) * len * 0.5);
    lx.lineTo(ox + Math.cos(ang + 0.022) * len * 0.85, oy + Math.sin(ang + 0.022) * len * 0.5);
    lx.closePath();
    lx.fill();
  });
  // 灯周围的空气微粒
  for (let i = 0; i < 10; i++) {
    const r = K.rng('xs:glow' + i);
    const a = r() * 6.28, d = 10 + r() * 26;
    dot(x + Math.cos(a) * d, oy + Math.sin(a) * d * 0.6, rgba('#fff2c4', 0.5));
  }
}

// ---------- 提灯的小孙女 ----------
function drawGirl(t) {
  // 前景崖顶：提灯的小孙女从右往左走，剪影 + 一点暖光
  const k = ease(clamp(t / 9.2));
  const gx = Math.round(lerp(198, 122, k));
  const gy = Math.round(bandTop(gx) + 1 + Math.round(Math.sin(k * 3.4) * 1));
  const step = Math.floor(t * 7) % 2;
  const HGT = 26;
  // 腿
  px(gx - 3, gy - 8 + step * 1, 2, 8, '#050a14');
  px(gx + 1, gy - 8 + (1 - step), 2, 8, '#050a14');
  // 身体（斗篷，略宽）
  lx.fillStyle = '#0a1120';
  lx.beginPath();
  lx.moveTo(gx - 5, gy - 8);
  lx.lineTo(gx - 4, gy - 17);
  lx.lineTo(gx + 3, gy - 17);
  lx.lineTo(gx + 5, gy - 8);
  lx.closePath();
  lx.fill();
  // 头 + 头巾
  px(gx - 3, gy - HGT + 3, 6, 6, '#050a14');
  px(gx - 4, gy - HGT + 2, 8, 2, '#050a14');
  px(gx - 5, gy - HGT + 4, 2, 5, '#050a14');
  // 脸部一点暖光
  px(gx + 1, gy - HGT + 6, 2, 2, '#c98a58');
  // 提灯（右手侧）
  const lanY = gy - 13 + step;
  px(gx + 6, lanY, 1, 5, '#050a14');
  px(gx + 6, lanY + 1, 3, 5, rgba('#ffcf6a', 0.85));
  lx.fillStyle = rgba('#ffcf6a', 0.16);
  lx.beginPath(); lx.arc(gx + 7.5, lanY + 3, 6, 0, Math.PI * 2); lx.fill();
  lx.fillStyle = rgba('#ffe7a8', 0.30);
  lx.beginPath(); lx.arc(gx + 7.5, lanY + 3, 2.5, 0, Math.PI * 2); lx.fill();
  // 暖光在腿上反一下
  px(gx + 2, gy - 7, 2, 3, rgba('#c98a58', 0.6));
  // 脚下尘
  if (k < 0.96) {
    const r = K.rng('xs:fstep' + (Math.floor(t * 7) % 60));
    px(gx - 5 + r() * 3, gy - 1, 1, 1, rgba('#5d6d90', 0.5));
  }
}

// ---------- 前景：崖边草丛 ----------
function bandTop(x) { return 168 + Math.sin(x / 10 * 1.7 + 1.2) * 2.5; }

function drawForeground(t) {
  // 前景崖顶带（画面最下缘）
  lx.fillStyle = '#04070e';
  lx.beginPath();
  lx.moveTo(0, PH);
  for (let x = 0; x <= 236; x += 4) lx.lineTo(x, bandTop(x));
  lx.lineTo(236, PH);
  lx.closePath();
  lx.fill();
  // 崖沿受光
  lx.strokeStyle = rgba('#2c3c5a', 0.85);
  lx.lineWidth = 1;
  lx.beginPath();
  for (let x = 0; x <= 236; x += 4) (x ? lx.lineTo(x, bandTop(x) - 1) : lx.moveTo(x, bandTop(x) - 1));
  lx.stroke();
  // 草丛（矮、成簇）
  for (let g = 0; g < 9; g++) {
    const r = K.rng('xs:tuft' + g);
    const x0 = 4 + r() * 226;
    for (let i = 0; i < 4; i++) {
      const h = 2 + Math.floor(r() * 3);
      const x = Math.round(x0 + i * 1.6);
      px(x, bandTop(x) - h, 1, h, '#050910');
      px(x, bandTop(x) - h - 1 + Math.round(Math.sin(t * 2.2 + g) * 0.6), 1, 1, '#050910');
    }
  }
}

// ---------- 调色 ----------
function grade(t) {
  // 冷色叠 + 暗角
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(210,225,255,0.92)';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const v = ctx.createRadialGradient(W * 0.5, H * 0.55, H * 0.35, W * 0.5, H * 0.55, H * 1.05);
  v.addColorStop(0, rgba('#000000', 0));
  v.addColorStop(1, rgba('#050a18', 0.55));
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

window.renderAt = (t) => {
  ENV.reset();
  lx.clearRect(0, 0, PW, PH);
  drawSky(t);
  drawBeam(t);
  drawSea(t);
  drawCliff(t);
  drawLighthouse(t);
  drawForeground(t);
  drawGirl(t);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(lo, 0, 0, PW, PH, 0, 0, PW * SC, PH * SC);
  grade(t);
};

lx.clearRect(0, 0, PW, PH);
drawSky(0); drawBeam(0); drawSea(0); drawCliff(0); drawLighthouse(0); drawForeground(0); drawGirl(0);
ctx.imageSmoothingEnabled = false;
ctx.drawImage(lo, 0, 0, PW, PH, 0, 0, PW * SC, PH * SC);
grade(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
