// yizhou · 移轴 · 玩具早高峰
// 从上往下看一座微缩城市，像玩具模型。上下被压成薄薄的景深。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng, mix } = FILM;
const W = 1920, H = 1080;
const r = rng('yizhou');

// 城市块
const BLD = [];
const HORIZON = 470;
for (let row = 0; row < 6; row++) {
  const t = row / 5;                       // 0 = 远, 1 = 近
  const baseY = lerp(HORIZON + 40, H - 20, Math.pow(t, .92));
  const scale = lerp(.34, 1.0, Math.pow(t, 1.05));
  const n = 9 + row * 2;
  for (let i = 0; i < n; i++) {
    const x = lerp(-80, W + 80, (i + .5) / n) + (r() - .5) * 90;
    if (r() < .18) continue;
    const w = (54 + r() * 66) * scale, h = (40 + r() * 150) * scale;
    BLD.push({ x, y: baseY, w, h, scale, t, col: ['#f2e3c8', '#e9d2b2', '#d9e4dd', '#e6c9a8', '#f7eed9', '#cfd9d4'][(r() * 6) | 0], lit: r() });
  }
}
const CARS = [];
for (let i = 0; i < 26; i++) {
  CARS.push({ row: 0, x: r() * W, sp: 60 + r() * 120, dir: r() < .5 ? 1 : -1, col: ['#f4f1e6', '#e8b25a', '#7fa8c8', '#d97a6c', '#9db98c'][(r() * 5) | 0] });
}

function sky(c) {
  const g = c.createLinearGradient(0, 0, 0, HORIZON + 60);
  g.addColorStop(0, '#baa2b8'); g.addColorStop(.35, '#e0b9ad'); g.addColorStop(.7, '#f2cfa8'); g.addColorStop(1, '#f7e0bd');
  c.fillStyle = g; c.fillRect(0, 0, W, HORIZON + 60);
  // 远处雾
  FILM.mist(c, 0, HORIZON - 20, W, 180, '#f6ddc0', .30);
  // 地平线上的远山
  c.fillStyle = '#c9a9a8';
  c.beginPath(); c.moveTo(0, HORIZON - 10);
  for (let x = 0; x <= W; x += 120) c.lineTo(x, HORIZON - 30 - Math.sin(x * .004) * 26);
  c.lineTo(W, HORIZON + 40); c.lineTo(0, HORIZON + 40); c.closePath(); c.fill();
}

function ground(c) {
  const g = c.createLinearGradient(0, HORIZON, 0, H);
  g.addColorStop(0, '#cbb8a6'); g.addColorStop(.4, '#c3ae9a'); g.addColorStop(1, '#ab957f');
  c.fillStyle = g; c.fillRect(0, HORIZON + 20, W, H - HORIZON);
}

function roads(c) {
  // 两条主路（横）与三条支路（纵），近粗远细
  const lanes = [[HORIZON + 150, .62], [HORIZON + 330, .95], [H - 90, 1.35]];
  lanes.forEach(([y, s]) => {
    c.fillStyle = 'rgba(88,78,70,.9)';
    c.fillRect(0, y, W, 26 * s);
    c.fillStyle = 'rgba(250,244,226,.55)';
    for (let x = 20; x < W; x += 70 * s) c.fillRect(x, y + 11 * s, 34 * s, 3 * s);
  });
  [[300, .62], [960, .9], [1620, 1.2]].forEach(([x, s]) => {
    c.fillStyle = 'rgba(88,78,70,.88)';
    c.fillRect(x, HORIZON + 60, 22 * s, H - HORIZON - 40);
  });
}

function building(c, b) {
  const { x, y, w, h, scale } = b;
  // 影子
  c.fillStyle = 'rgba(60,44,36,.28)';
  c.beginPath(); c.ellipse(x + w * .35, y + 2, w * .8, w * .22, 0, 0, 7); c.fill();
  // 侧面
  c.fillStyle = mix(b.col, '#5b4a3e', .35);
  c.fillRect(x + w * .72, y - h, w * .28, h);
  // 正面
  const g = c.createLinearGradient(x, y - h, x, y);
  g.addColorStop(0, mix(b.col, '#ffffff', .28)); g.addColorStop(1, mix(b.col, '#7a6553', .2));
  c.fillStyle = g;
  c.fillRect(x - w * .72, y - h, w * 1.44, h);
  // 窗
  const rows = Math.max(1, Math.round(h / (16 * scale)), ), cols = Math.max(1, Math.round(w * 1.44 / (14 * scale)));
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const lit = ((i * 7 + j * 3 + (b.lit * 100 | 0)) % 5) < 2;
    c.fillStyle = lit ? 'rgba(255,214,128,.85)' : 'rgba(64,52,44,.55)';
    const ww = 6 * scale, hh = 9 * scale;
    c.fillRect(x - w * .72 + (j + .3) * w * 1.44 / cols, y - h + (i + .3) * h / rows, ww, hh);
  }
  // 屋顶面（俯视角能看到一点顶）
  c.fillStyle = mix(b.col, '#ffffff', .5);
  c.beginPath();
  c.moveTo(x - w * .72, y - h);
  c.lineTo(x + w * .72, y - h);
  c.lineTo(x + w * .72 + w * .26, y - h - w * .2);
  c.lineTo(x - w * .72 + w * .26, y - h - w * .2);
  c.closePath(); c.fill();
  c.strokeStyle = 'rgba(120,96,74,.3)'; c.lineWidth = 1; c.stroke();
  // 屋顶上的小水箱
  if (b.w > 60) {
    c.fillStyle = 'rgba(150,140,130,.65)';
    c.fillRect(x - w * .2, y - h - w * .16, w * .18, w * .12);
  }
}

function tree(c, x, y, s) {
  c.fillStyle = 'rgba(60,44,36,.25)';
  c.beginPath(); c.ellipse(x + s * .3, y + 2, s * .7, s * .2, 0, 0, 7); c.fill();
  c.fillStyle = '#7f9e6c';
  c.beginPath(); c.arc(x, y - s * .8, s * .62, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,235,.25)';
  c.beginPath(); c.arc(x - s * .18, y - s * 1.0, s * .3, 0, 7); c.fill();
}

function car(c, x, y, s, col, dir) {
  c.save(); c.translate(x, y); c.scale(dir, 1);
  c.fillStyle = 'rgba(50,38,30,.3)';
  c.beginPath(); c.ellipse(0, 3 * s, 17 * s, 5 * s, 0, 0, 7); c.fill();
  c.fillStyle = col;
  c.fill(FILM.rect(-11 * s, -9 * s, 22 * s, 10 * s, 3 * s));
  c.fillStyle = 'rgba(255,255,255,.45)';
  c.fill(FILM.rect(-4 * s, -9 * s, 8 * s, 4 * s, 1.5 * s));
  c.fillStyle = '#2f2a26';
  c.beginPath(); c.arc(-6 * s, 2 * s, 2.4 * s, 0, 7); c.fill();
  c.beginPath(); c.arc(6 * s, 2 * s, 2.4 * s, 0, 7); c.fill();
  c.restore();
}

function streetLamp(c, x, y, s) {
  c.strokeStyle = 'rgba(60,48,40,.6)'; c.lineWidth = 1.6 * s;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 22 * s); c.stroke();
  FILM.glow(c, x, y - 24 * s, 14 * s, '#ffe0a0', .5);
  c.fillStyle = '#fff0c8'; c.beginPath(); c.arc(x, y - 24 * s, 2.6 * s, 0, 7); c.fill();
}

function scene(c, t) {
  sky(c);
  ground(c);
  roads(c);
  // 河与桥（右侧）
  c.fillStyle = '#9fb6bb';
  c.beginPath();
  c.moveTo(1740, HORIZON + 40); c.lineTo(W, HORIZON + 30); c.lineTo(W, H); c.lineTo(1600, H); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,248,226,.25)';
  for (let i = 0; i < 10; i++) c.fillRect(1660 + i * 30, HORIZON + 120 + i * 70, 90, 3);

  // 楼
  BLD.forEach(b => building(c, b));
  // 树（成行的行道树）
  for (let i = 0; i < 26; i++) {
    const t2 = r(), x = lerp(20, W - 20, r()), y = lerp(HORIZON + 60, H - 60, r());
    const s = lerp(9, 22, (y - HORIZON) / (H - HORIZON));
    tree(c, x, y, s);
  }
  // 路灯
  [[560, HORIZON + 160], [1180, HORIZON + 340], [300, H - 120]].forEach(([x, y], i) => streetLamp(c, x, y, .6 + i * .35));
  // 车
  CARS.forEach((cr, i) => {
    const rowY = [HORIZON + 160, HORIZON + 340, H - 100, HORIZON + 250][i % 4];
    const s = (rowY - HORIZON) / 560 + .35;
    let x = cr.x + cr.dir * t * cr.sp;
    x = ((x % (W + 200)) + W + 200) % (W + 200) - 100;
    car(c, x, rowY, s, cr.col, cr.dir);
  });
  // 广场与喷泉
  const fx = 900, fy = 840;
  c.fillStyle = 'rgba(240,226,208,.75)';
  c.beginPath(); c.ellipse(fx, fy, 130, 46, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(200,190,175,.6)';
  c.beginPath(); c.ellipse(fx, fy, 70, 24, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(210,230,235,.9)';
  c.beginPath(); c.ellipse(fx, fy - 6, 26, 10, 0, 0, 7); c.fill();
  // 水柱
  c.strokeStyle = 'rgba(240,250,255,.6)'; c.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    const hh = 40 + Math.abs(i) * 8 + Math.sin(t * 3 + i) * 6;
    c.beginPath(); c.moveTo(fx + i * 8, fy - 8); c.lineTo(fx + i * 12, fy - 8 - hh); c.stroke();
  }
}

const LOW_W = 240, LOW_H = 135;
const LOW = document.createElement('canvas'); LOW.width = LOW_W; LOW.height = LOW_H;
const LOWC = LOW.getContext('2d', { willReadFrequently: false });
const MASK = document.createElement('canvas'); MASK.width = 960; MASK.height = 540;
const MASKC = MASK.getContext('2d');

function tiltBlur(t) {
  LOWC.setTransform(1, 0, 0, 1, 0, 0);
  LOWC.clearRect(0, 0, LOW_W, LOW_H);
  LOWC.scale(LOW_W / W, LOW_H / H);
  scene(LOWC, t);
  LOWC.setTransform(1, 0, 0, 1, 0, 0);
  MASKC.setTransform(1, 0, 0, 1, 0, 0);
  MASKC.clearRect(0, 0, 960, 540);
  MASKC.drawImage(LOW, 0, 0, 960, 540);
  MASKC.drawImage(LOW, 0, 0, 960, 540);
  const g = MASKC.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(.30, 'rgba(0,0,0,.78)');
  g.addColorStop(.46, 'rgba(0,0,0,0)');
  g.addColorStop(.64, 'rgba(0,0,0,0)');
  g.addColorStop(.80, 'rgba(0,0,0,.78)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  MASKC.globalCompositeOperation = 'destination-in';
  MASKC.fillStyle = g; MASKC.fillRect(0, 0, 960, 540);
  MASKC.globalCompositeOperation = 'source-over';
  return MASK;
}
let T = 0;
function frame(t) {
  T = t; console.log('A');
  const c = ENV.ctx;
  ENV.reset('#f2d3ad');
  // 晨光
  c.save();
  scene(c, t);
  // 覆盖虚化层
  const M = tiltBlur(t);
  c.globalAlpha = .92;
  c.drawImage(M, 0, 0, W, H);
  c.globalAlpha = 1;
  // 光晕与暖色
  c.globalCompositeOperation = 'lighter';
  const lg = c.createRadialGradient(500, 180, 40, 700, 360, 900);
  lg.addColorStop(0, 'rgba(255,214,170,.28)'); lg.addColorStop(1, 'rgba(255,214,170,0)');
  c.fillStyle = lg; c.fillRect(0, 0, W, H);
  c.restore();
  // 放大：轻微的移轴推镜
  FILM.vignette(c, { inner: .52, outer: 1, a: .40 });
  FILM.grain(c, .05, 44);
  // 早高峰的时间戳
  const kk = soft((t - 7.4) / 1.2);
  if (kk > 0) {
    c.save(); c.globalAlpha = kk;
    FILM.text(c, '07:42  AM', { x: 150, y: 140, size: 46, color: 'rgba(255,250,238,.92)', weight: 700, tracking: 6 });
    FILM.text(c, '通勤 · 1:87', { x: 154, y: 194, size: 22, color: 'rgba(255,246,226,.6)', tracking: 5 });
    c.restore();
  }
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });






