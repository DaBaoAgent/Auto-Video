// dianlu · 电路 · 江从上面看是走线
// 从高空俯瞰一条入海的河：沙洲、田、桥。镜头不动，河自己慢慢变成了电路，
// 汇流的地方长出焊盘，最后中间亮起一块芯片。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;

const r = rng('dianlu');
// 河道折线（从左上流到右下）
const RIVERS = [
  { p: [[-40, 210], [260, 300], [520, 250], [760, 360], [980, 520], [1240, 610], [1560, 700], [1960, 760]], w: 44 },
  { p: [[-40, 560], [300, 520], [560, 600], [820, 560], [1040, 700], [1300, 760], [1600, 880], [1960, 940]], w: 30 },
  { p: [[300, -40], [360, 220], [520, 380], [560, 620], [700, 820], [760, 1120]], w: 26 },
  { p: [[1120, -40], [1080, 240], [1180, 420], [1160, 640], [1300, 820], [1360, 1120]], w: 22 },
  { p: [[1720, -40], [1680, 200], [1760, 380], [1720, 560], [1820, 740], [1860, 1120]], w: 18 },
];

// 每条河对应的“走线”版本：所有线段对齐到 45°
function orthoPath(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = out[i - 1], b = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const adx = Math.abs(dx), ady = Math.abs(dy);
    let mid;
    if (adx > ady * 1.6) mid = [b[0], a[1]];
    else if (ady > adx * 1.6) mid = [a[0], b[1]];
    else mid = [(a[0] + b[0]) / 2 + (dx > 0 ? ady * .5 : -ady * .5), (a[1] + b[1]) / 2 + (dy > 0 ? adx * .5 : -adx * .5)];
    out.push(mid, b);
  }
  return out;
}
const TRACES = RIVERS.map(v => ({ p: orthoPath(v.p), w: v.w }));

function fields(c, k) {
  // 农田：斜视角的方块，越接近电路越退成暗绿底
  const n = 26;
  for (let i = 0; i < 40; i++) {
    const x = (i % 8) * 260 - 40, y = Math.floor(i / 8) * 240 - 30;
    const tone = .5 + .5 * Math.sin(i * 1.7);
    const a = 1 - k;
    const g = c.createLinearGradient(x, y, x + 220, y + 200);
    const c1 = FILM.mix('#5b7a3a', '#7a8a52', tone);
    const c2 = FILM.mix('#3f5a2a', '#6f7f48', tone);
    g.addColorStop(0, FILM.rgba(c1, .55 * a));
    g.addColorStop(1, FILM.rgba(c2, .55 * a));
    c.fillStyle = g;
    c.fillRect(x, y, 240, 220);
    c.strokeStyle = `rgba(40,54,30,${.30 * a})`; c.lineWidth = 2;
    c.strokeRect(x, y, 240, 220);
  }
}

function base(c, k) {
  // 底色：从土黄绿过渡到 PCB 的墨绿
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, FILM.mix('#3e4a28', '#061a12', k));
  g.addColorStop(.5, FILM.mix('#4d5730', '#082116', k));
  g.addColorStop(1, FILM.mix('#2c3a22', '#04140e', k));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

function river(c, pts, w, k, t) {
  // 河：水面颜色 → 铜色走线
  const col = k < .55 ? FILM.mix('#8fa9a0', '#0d3a2a', k / .55) : FILM.mix('#0d3a2a', '#1d5a3f', (k - .55) / .45);
  c.strokeStyle = col;
  c.lineWidth = w * (1 + .10 * Math.sin(t * 1.2));
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath();
  const R = 46;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i === 0) { c.moveTo(p[0], p[1]); continue; }
    if (i === pts.length - 1) { c.lineTo(p[0], p[1]); continue; }
    const a = pts[i - 1], b = pts[i + 1];
    const d1 = Math.hypot(p[0] - a[0], p[1] - a[1]) || 1, d2 = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const r1 = Math.min(R, d1 * .45), r2 = Math.min(R, d2 * .45);
    const pa = [p[0] - (p[0] - a[0]) / d1 * r1, p[1] - (p[1] - a[1]) / d1 * r1];
    const pb = [p[0] + (b[0] - p[0]) / d2 * r2, p[1] + (b[1] - p[1]) / d2 * r2];
    c.lineTo(pa[0], pa[1]);
    c.quadraticCurveTo(p[0], p[1], pb[0], pb[1]);
  }
  c.stroke();
  // 高光
  c.strokeStyle = `rgba(226,240,228,${.10 * (1 - k)})`;
  c.lineWidth = w * .35;
  c.stroke();
  // 铜边
  if (k > .5) {
    c.strokeStyle = `rgba(255,196,110,${.35 * (k - .5) * 1.4})`;
    c.lineWidth = Math.max(2, w * .10);
    c.stroke();
  }
}

function pads(c, k, t) {
  // 汇流点长成焊盘
  const pts = [[520, 250], [820, 560], [1160, 640], [1680, 200], [560, 620], [1300, 760], [1080, 240]];
  c.save();
  pts.forEach(([x, y], i) => {
    const a = clamp((k - .55) / .3);
    if (a <= 0) return;
    const rr = 12 + 6 * Math.sin(t * 2 + i);
    c.fillStyle = `rgba(255,190,90,${.55 * a})`;
    c.beginPath(); c.arc(x, y, rr * a, 0, 7); c.fill();
    c.fillStyle = `rgba(20,12,6,${.8 * a})`;
    c.beginPath(); c.arc(x, y, rr * .45 * a, 0, 7); c.fill();
  });
  c.restore();
}

function chip(c, k, t) {
  const a = clamp((k - .62) / .3);
  if (a <= 0) return;
  const x = 860, y = 430, w = 200, h = 200;
  c.save(); c.globalAlpha = a;
  // 引脚
  c.fillStyle = 'rgba(255,196,110,.75)';
  for (let i = 0; i < 6; i++) {
    c.fillRect(x - 26, y + 20 + i * 30, 26, 12);
    c.fillRect(x + w, y + 20 + i * 30, 26, 12);
    c.fillRect(x + 20 + i * 30, y - 26, 12, 26);
    c.fillRect(x + 20 + i * 30, y + h, 12, 26);
  }
  // 封装
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#1b2620'); g.addColorStop(.5, '#2a3b31'); g.addColorStop(1, '#0f1a14');
  c.fillStyle = g;
  c.beginPath(); c.roundRect(x, y, w, h, 8); c.fill();
  c.strokeStyle = 'rgba(200,232,214,.28)'; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x, y, w, h, 8); c.stroke();
  // 丝印
  FILM.text(c, 'AURA-1', { x: x + w / 2, y: y + h * .52, align: 'center', size: 20, color: 'rgba(210,236,222,.55)', weight: 600, tracking: 2 });
  c.fillStyle = 'rgba(210,236,222,.35)';
  c.beginPath(); c.arc(x + 22, y + 22, 4, 0, 7); c.fill();
  // 上电的一下
  const pulse = soft((t - 8.0) / .8);
  if (pulse > 0) {
    c.strokeStyle = `rgba(120,255,190,${.55 * (1 - pulse)})`; c.lineWidth = 3;
    c.beginPath(); c.arc(x + w / 2, y + h / 2, 60 + pulse * 300, 0, 7); c.stroke();
    FILM.glow(c, x + w / 2, y + h / 2, 200, '#7dffc0', .25 * pulse);
  }
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#0a1410');
  const k = soft((t - 2.6) / 3.4);           // 河 → 走线
  const k2 = soft((t - 5.6) / 2.2);          // 底色也变过去
  const kk = Math.max(k, k2);
  const camZ = 1.0 + soft(t / 10) * .08;
  c.save();
  c.translate(960, 540); c.scale(camZ, camZ); c.translate(-960, -540);
  base(c, kk);
  fields(c, kk);
  // 河与走线：两套点插值
  RIVERS.forEach((rv, i) => {
    const tr = TRACES[i].p;
    const n = Math.max(rv.p.length, tr.length);
    const mix = [];
    for (let j = 0; j < n; j++) {
      const a = rv.p[Math.min(j, rv.p.length - 1)], b = tr[Math.min(j, tr.length - 1)];
      mix.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]);
    }
    river(c, mix, rv.w * (1 - .25 * k), kk, t);
  });
  pads(c, kk, t);
  chip(c, kk, t);
  c.restore();
  // 一层很淡的扫描光
  const scan = (t * 220) % (H + 300) - 150;
  const sg = c.createLinearGradient(0, scan - 80, 0, scan + 80);
  sg.addColorStop(0, 'rgba(140,255,200,0)'); sg.addColorStop(.5, 'rgba(140,255,200,.045)'); sg.addColorStop(1, 'rgba(140,255,200,0)');
  c.fillStyle = sg; c.fillRect(0, scan - 80, W, 160);
  FILM.grain(c, .10, 91);
  FILM.vignette(c, { inner: .38, outer: .95, a: .52 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });

