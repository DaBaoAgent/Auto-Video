// zhuomian · 桌面 · 一张猫的照片
// 深色桌面上开着几个窗口，一张拍立得照片从窗口跳到窗口，
// 最后落进「照片」，占满整块屏幕。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp } = FILM;
const W = 1920, H = 1080;

const WINS = [
  { x: 120, y: 150, w: 620, h: 400, title: '笔记', tint: '#f7f2e8', dark: false },
  { x: 780, y: 190, w: 520, h: 360, title: '访达', tint: '#f2f3f5', dark: false },
  { x: 1330, y: 130, w: 470, h: 330, title: '终端', tint: '#14171c', dark: true },
  { x: 300, y: 570, w: 800, h: 400, title: '照片', tint: '#fbfbf9', dark: false },
  { x: 1200, y: 520, w: 560, h: 380, title: '预览', tint: '#f6f7f9', dark: false },
];

const HOPS = [
  { t: .000, i: 0, sx: 1, sy: 1 },
  { t: 2.05, i: 1, sx: 1, sy: 1 },
  { t: 4.05, i: 2, sx: .92, sy: .92 },
  { t: 6.05, i: 3, sx: 1.08, sy: 1.08 },
  { t: 8.10, i: 3, sx: 2.2, sy: 2.2 },
];
const CARD_W = 240, CARD_H = 290;

function hole(W_, o) {
  const { x, y, w, h, r = 12 } = o;
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}

function frameShadow(c, x, y, w, h, r = 16) {
  c.save();
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 40; c.shadowOffsetY = 20;
  c.fillStyle = '#fff';
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  c.restore();
}

function drawWin(c, wi, t) {
  const { x, y, w, h, title, tint, dark } = wi;
  frameShadow(c, x, y, w, h);
  // 窗体
  const g = c.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, tint); g.addColorStop(1, dark ? '#0e1116' : '#eceef0');
  c.fillStyle = g;
  c.beginPath(); c.roundRect(x, y, w, h, 16); c.fill();
  // 标题栏
  c.fillStyle = dark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
  c.beginPath(); c.roundRect(x, y, w, 46, 16); c.fill();
  c.fillStyle = dark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.03)';
  c.fillRect(x, y + 24, w, 22);
  // 三个按钮
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    c.fillStyle = col;
    c.beginPath(); c.arc(x + 26 + i * 24, y + 23, 7, 0, 7); c.fill();
  });
  // 标题
  FILM.text(c, title, { x: x + w / 2, y: y + 30, align: 'center', size: 20, color: dark ? 'rgba(230,238,248,.8)' : 'rgba(40,44,50,.75)', weight: 600, tracking: 1 });
  // 内容
  const ink = dark ? 'rgba(190,205,225,.45)' : 'rgba(70,76,86,.55)';
  if (title === '终端') {
    const lines = ['$ npm i aura', '$ ready in 0.4s', '$ cat ./life.log'];
    for (let i = 0; i < 3; i++) {
      const n = Math.floor(clamp((t - i * .3 - .4) * 12) * lines[i].length);
      FILM.text(c, lines[i].slice(0, n), { x: x + 26, y: y + 90 + i * 34, size: 17, color: 'rgba(140,240,180,.75)', weight: 500 });
    }
    FILM.rect;
  } else if (title === '照片') {
    // 照片墙格子
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
      const bx = x + 26 + k * 190, by = y + 70 + r * 160;
      c.fillStyle = '#dfe1e4';
      c.beginPath(); c.roundRect(bx, by, 170, 140, 8); c.fill();
    }
  } else if (title === '笔记') {
    for (let i = 0; i < 7; i++) {
      c.fillStyle = ink;
      c.fillRect(x + 30, y + 80 + i * 34, w * (.9 - (i % 3) * .12), 8);
    }
  } else if (title === '访达') {
    for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) {
      const bx = x + 40 + k * 150, by = y + 90 + i * 130;
      c.fillStyle = '#4aa3ff'; c.beginPath(); c.roundRect(bx, by, 52, 44, 6); c.fill();
      c.fillStyle = ink; c.fillRect(bx, by + 56, 60, 7);
    }
  } else {
    for (let i = 0; i < 6; i++) { c.fillStyle = ink; c.fillRect(x + 24 + (i % 2) * 240, y + 76 + Math.floor(i / 2) * 96, 190, 70); }
  }
}

function catPhoto(c, x, y, w, h, squash, t) {
  c.save();
  c.translate(x, y); c.scale(1 + squash * .06, 1 - squash * .06); c.translate(-x, -y);
  // 拍立得
  c.save();
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 26; c.shadowOffsetY = 12;
  c.fillStyle = '#fdfdfb';
  c.beginPath(); c.roundRect(x, y, w, h, 6); c.fill();
  c.restore();
  // 照片区域
  const px_ = x + 16, py_ = y + 16, pw = w - 32, ph = h - 60;
  const g = c.createLinearGradient(px_, py_, px_, py_ + ph);
  g.addColorStop(0, '#f5d9b8'); g.addColorStop(.55, '#e7b98f'); g.addColorStop(1, '#c98a63');
  c.fillStyle = g; c.fillRect(px_, py_, pw, ph);
  // 窗光
  c.fillStyle = 'rgba(255,246,220,.35)';
  c.beginPath(); c.moveTo(px_, py_); c.lineTo(px_ + pw * .55, py_); c.lineTo(px_ + pw * .25, py_ + ph); c.lineTo(px_, py_ + ph); c.fill();
  // 猫（照片里的一只）
  c.save();
  c.rect(px_, py_, pw, ph); c.clip();
  const cat = FILM.cat(c, {
    x: px_ + pw * .56, y: py_ + ph * .82, h: ph * .62, face: -1,
    fill: '#4a3728', rim: 'rgba(255,236,204,.8)', rimW: 3,
    tail: .55, crouch: .12,
  });
  // 脸：眼睛、鼻子、胡须、条纹
  const hx = 2 * (px_ + pw * .56) - cat.head[0], hy = cat.head[1];
  const hr = ph * .62 * .12;
  c.fillStyle = 'rgba(246,232,200,.25)';
  c.beginPath(); c.arc(hx, hy, hr * 2.1, 0, 7); c.fill();
  c.fillStyle = '#f0d79a';
  c.beginPath(); c.ellipse(hx - hr * .52, hy - hr * .22, hr * .30, hr * .26, -.2, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hx + hr * .52, hy - hr * .22, hr * .30, hr * .26, .2, 0, 7); c.fill();
  c.fillStyle = '#14100c';
  c.beginPath(); c.ellipse(hx - hr * .55, hy - hr * .22, hr * .12, hr * .36, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(hx + hr * .55, hy - hr * .22, hr * .12, hr * .36, 0, 0, 7); c.fill();
  c.fillStyle = '#c4795a';
  c.beginPath(); c.moveTo(hx, hy + hr * .22); c.lineTo(hx - hr * .16, hy + hr * .5); c.lineTo(hx + hr * .16, hy + hr * .5); c.fill();
  c.strokeStyle = 'rgba(255,244,220,.55)'; c.lineWidth = 1.4;
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    c.beginPath(); c.moveTo(hx + s * hr * .35, hy + hr * .55);
    c.quadraticCurveTo(hx + s * hr * .95, hy + hr * (.45 + i * .22), hx + s * hr * 1.5, hy + hr * (.35 + i * .26));
    c.stroke();
  }

  c.restore();
  // 照片里的颗粒
  c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(px_, py_, pw, ph);
  c.restore();
}

function dock(c, t) {
  const n = 8, w = 96, gap = 18, total = n * (w + gap) - gap;
  const x0 = 960 - total / 2, y = 966;
  c.save();
  c.fillStyle = 'rgba(20,22,26,.55)';
  c.beginPath(); c.roundRect(x0 - 22, y - 14, total + 44, 108, 22); c.fill();
  const cols = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#a855f7', '#14b8a6', '#f97316', '#64748b'];
  for (let i = 0; i < n; i++) {
    const bob = Math.sin(t * 1.4 + i * .3) * 2;
    const g = c.createLinearGradient(0, y + bob, 0, y + 64 + bob);
    g.addColorStop(0, cols[i]); g.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = g;
    c.beginPath(); c.roundRect(x0 + i * (w + gap), y + bob, w, 64, 16); c.fill();
    c.fillStyle = 'rgba(255,255,255,.16)';
    c.beginPath(); c.roundRect(x0 + i * (w + gap) + 8, y + bob + 6, w - 16, 16, 8); c.fill();
  }
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#0d1016');
  const camZ = 1.0 + soft(t / 10) * .05;
  c.save();
  c.translate(960, 540); c.scale(camZ, camZ); c.translate(-960, -540);
  // 桌面壁纸
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1b2333'); bg.addColorStop(.45, '#2b3a52'); bg.addColorStop(1, '#472f4a');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  FILM.mist(c, 400, 300, 700, 420, '#7fa0d0', .10);
  FILM.mist(c, 1500, 700, 620, 400, '#c08aa0', .10);
  WINS.forEach((w, i) => drawWin(c, w, t));
  dock(c, t);
  // 照片：按跳点插值
  let cur = HOPS[0], next = null, k = 0;
  for (let i = 0; i < HOPS.length; i++) {
    if (t >= HOPS[i].t) { cur = HOPS[i]; next = HOPS[i + 1] || null; k = next ? clamp((t - cur.t) / (next.t - cur.t)) : 1; }
  }
  const A = WINS[cur.i], B = next ? WINS[next.i] : A;
  const baseX = A.x + A.w * .5 - CARD_W * .5, baseY = A.y + 70;
  const tx = B.x + B.w * .5 - CARD_W * .5, ty = B.y + 70;
  const e = soft(k);
  const hop = Math.sin(Math.min(1, Math.max(0, (k - .25) / .5)) * Math.PI);
  const x = lerp(baseX, tx, e), y = lerp(baseY, ty, e) - hop * 120;
  const sc = lerp(cur.sx, next ? next.sx : cur.sx, e) * (1 + hop * .06);
  const rot = lerp(0, next ? (next.i % 2 ? .10 : -.08) : 0, e) * (1 - hop);
  const squash = hop;
  c.save();
  c.translate(x + CARD_W / 2, y + CARD_H / 2); c.rotate(rot); c.scale(sc, sc); c.translate(-CARD_W / 2, -CARD_H / 2);
  catPhoto(c, 0, 0, CARD_W, CARD_H, squash, t);
  c.restore();
  // 鼠标指针（后段淡出）
  const mx = lerp(900, x + 40, soft(t / 4)), my = lerp(760, y + 40, soft(t / 4));
  const curA = 1 - soft((t - 7.4) / .8);
  c.save();
  c.globalAlpha = curA;
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + 26, my + 34); c.lineTo(mx + 12, my + 36); c.lineTo(mx + 20, my + 52); c.lineTo(mx + 10, my + 56); c.lineTo(mx + 2, my + 40); c.lineTo(mx - 4, my + 48); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.stroke();
  c.restore();
  c.restore();
  FILM.grain(c, .07, 61);
  FILM.vignette(c, { inner: .40, outer: .96, a: .36 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });


