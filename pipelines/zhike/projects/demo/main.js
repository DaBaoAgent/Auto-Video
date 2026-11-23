// zhike · 胶片直刻
// 半公里深的黑水里，一条灯笼鱼点亮自己的灯往上游。
// 镜头跟着它上浮，慢慢拉开 —— 整个水层里，全是向上的光。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { clamp, lerp, soft, rng, n1 } = FILM;

const SURFACE = 96;
const CAM_KEYS = [
  { t: 0.0, x: 720, y: 700, z: 1.38 },
  { t: 2.6, x: 760, y: 660, z: 1.42, ease: soft },
  { t: 4.6, x: 860, y: 600, z: 1.20, ease: soft },
  { t: 6.8, x: 990, y: 560, z: 0.86, ease: soft },
  { t: 10.0, x: 1010, y: 560, z: 0.62, ease: soft },
];

function fishPos(t) {
  // 从深处往水面游
  const k = soft(t / 10);
  return { x: lerp(640, 1180, k), y: lerp(980, 300, k), rot: -0.62 + Math.sin(t * 1.2) * .05 };
}

function drawWater(c, t, cam) {
  // 水体：越往上越亮
  const g = c.createLinearGradient(0, -600, 0, 1500);
  g.addColorStop(0, '#2a3338'); g.addColorStop(.18, '#151c20'); g.addColorStop(.6, '#0a0e11'); g.addColorStop(1, '#050607');
  c.fillStyle = g; c.fillRect(-1600, -900, 5200, 3200);
  // 上方的水面光
  FILM.mist(c, 1030, SURFACE + 30, 900, 150, '#c8d6dc', .22);
  FILM.mist(c, 900, SURFACE + 6, 300, 40, '#e8f2f6', .30);
  // 水下的分层微光
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) {
    const y = SURFACE + 180 + i * 300;
    c.fillStyle = `rgba(140,172,188,${.05 + i * .003})`;
    const g2 = c.createLinearGradient(0, y - 120, 0, y + 120);
    g2.addColorStop(0, 'rgba(140,172,188,0)'); g2.addColorStop(.5, `rgba(140,172,188,${.09 - i * .012})`); g2.addColorStop(1, 'rgba(140,172,188,0)');
    c.fillStyle = g2; c.fillRect(-1600, y - 120, 5200, 240);
  }
  c.restore();
  // 海雪
  const r = rng('snow');
  for (let i = 0; i < 260; i++) {
    const x = r() * 3400 - 700;
    const y = ((r() * 1600 + t * (10 + r() * 22)) % 1600) + SURFACE - 200;
    const a = .05 + r() * .16;
    c.fillStyle = `rgba(208,222,230,${a})`;
    c.beginPath(); c.arc(x + Math.sin(t * .5 + i) * 6, y, .6 + r() * 1.6, 0, 7); c.fill();
  }
}

function drawSurface(c, t) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, SURFACE - 160, 0, SURFACE + 380);
  g.addColorStop(0, 'rgba(232,242,246,0)'); g.addColorStop(.5, 'rgba(196,216,226,.16)'); g.addColorStop(1, 'rgba(150,180,196,0)');
  c.fillStyle = g; c.fillRect(-1200, SURFACE - 200, 4400, 700);
  c.restore();
  // 水面的波纹（从下面看是一圈圈亮线）
  c.strokeStyle = 'rgba(225,238,244,.20)'; c.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const y = SURFACE - 10 + i * 26 + Math.sin(t * 1.4 + i) * 6;
    c.beginPath();
    for (let x = 200; x < 2600; x += 60) {
      const yy = y + Math.sin(x * .012 + t * 2 + i) * (10 - i);
      if (x === 200) c.moveTo(x, yy); else c.lineTo(x, yy);
    }
    c.stroke();
  }
}

function drawAngler(c, t, x, y, rot, scale, alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.translate(x, y); c.rotate(rot); c.scale(scale, scale);
  // 身体
  const body = FILM.smooth([[88, 0], [62, -34], [10, -50], [-66, -40], [-110, -12], [-116, 6],
    [-96, 30], [-40, 46], [26, 44], [72, 26]]);
  const bg = c.createLinearGradient(0, -50, 0, 50);
  bg.addColorStop(0, '#1b2226'); bg.addColorStop(.55, '#0d1215'); bg.addColorStop(1, '#050809');
  c.fillStyle = bg; c.fill(body);
  c.strokeStyle = 'rgba(190,206,214,.30)'; c.lineWidth = 2; c.stroke(body);
  // 尾鳍
  c.fillStyle = '#101619';
  c.beginPath(); c.moveTo(-104, -6); c.lineTo(-168, -46); c.lineTo(-152, 0); c.lineTo(-172, 44); c.lineTo(-100, 12); c.closePath(); c.fill();
  // 背鳍
  c.beginPath(); c.moveTo(-20, -46); c.quadraticCurveTo(10, -86, 44, -60); c.quadraticCurveTo(20, -54, 6, -40); c.closePath(); c.fill();
  // 胸鳍
  c.beginPath(); c.ellipse(30, 26, 32, 10, .45, 0, 7); c.fill();
  // 大嘴与牙
  c.strokeStyle = 'rgba(210,222,228,.35)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(86, 4); c.quadraticCurveTo(50, 26, 12, 24); c.stroke();
  c.fillStyle = 'rgba(232,240,244,.85)';
  for (let i = 0; i < 8; i++) {
    const tx = 76 - i * 9, ty = 8 + i * 1.8;
    c.beginPath(); c.moveTo(tx, ty); c.lineTo(tx - 3.5, ty + 9); c.lineTo(tx + 3.5, ty + 1); c.closePath(); c.fill();
  }
  // 眼睛
  c.fillStyle = '#c8d2d8'; c.beginPath(); c.arc(66, -16, 12, 0, 7); c.fill();
  c.fillStyle = '#05070a'; c.beginPath(); c.arc(64, -16, 7.5, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(61, -19, 2.4, 0, 7); c.fill();
  // 发光器：腹部一排 + 体侧
  for (let i = 0; i < 15; i++) {
    const px = 64 - i * 12, py = 34 - Math.abs(i - 7) * 1.4;
    FILM.glow(c, px, py, 9, '#dff6ff', .55);
    c.fillStyle = 'rgba(240,252,255,.95)'; c.beginPath(); c.arc(px, py, 2.2, 0, 7); c.fill();
  }
  for (let i = 0; i < 6; i++) {
    FILM.glow(c, -30 + i * 20, -26, 7, '#cfeaff', .35);
  }
  // 钓竿与灯
  const wob = Math.sin(t * 2.2) * .06;
  c.strokeStyle = 'rgba(190,206,214,.55)'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(56, -34); c.quadraticCurveTo(66, -92, 96 + wob * 40, -112); c.stroke();
  FILM.glow(c, 98 + wob * 40, -112, 40, '#eafcff', .55);
  FILM.glow(c, 98 + wob * 40, -112, 14, '#ffffff', .9);
  c.fillStyle = '#fff'; c.beginPath(); c.arc(98 + wob * 40, -112, 6, 0, 7); c.fill();
  c.restore();
}

function drawJelly(c, t, x, y, s, alpha = 1) {
  c.save(); c.globalAlpha = alpha; c.translate(x, y); c.scale(s, s);
  const bell = FILM.smooth([[-40, 0], [-34, -34], [0, -48], [34, -34], [40, 0], [20, 6], [-20, 6]]);
  c.fillStyle = 'rgba(180,205,216,.10)'; c.fill(bell);
  c.strokeStyle = 'rgba(220,236,242,.55)'; c.lineWidth = 2; c.stroke(bell);
  FILM.mist(c, 0, -18, 40, 30, '#cfeafc', .25);
  c.strokeStyle = 'rgba(200,222,232,.35)'; c.lineWidth = 1.6;
  for (let i = 0; i < 7; i++) {
    const px = -28 + i * 9;
    c.beginPath(); c.moveTo(px, 4);
    for (let k = 0; k < 5; k++) c.lineTo(px + Math.sin(t * 1.6 + i + k) * 6, 20 + k * 24);
    c.stroke();
  }
  c.restore();
}

function drawSub(c, t) {
  const x = 320 + Math.sin(t * .5) * 20, y = 820 - t * 6;
  c.save(); c.translate(x, y);
  // 灯
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(60, 0, 520, 120);
  g.addColorStop(0, 'rgba(230,244,250,.26)'); g.addColorStop(1, 'rgba(210,230,240,0)');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(56, -10); c.lineTo(520, 50); c.lineTo(500, 210); c.closePath(); c.fill();
  c.restore();
  // 球舱
  c.fillStyle = '#1a2024'; c.beginPath(); c.arc(0, 0, 64, 0, 7); c.fill();
  c.strokeStyle = 'rgba(200,214,222,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 64, 0, 7); c.stroke();
  c.fillStyle = 'rgba(180,205,216,.18)'; c.beginPath(); c.arc(-8, -12, 40, 0, 7); c.fill();
  // 舷窗
  for (let i = 0; i < 3; i++) {
    c.fillStyle = '#0a0d0f'; c.beginPath(); c.arc(-18 + i * 26, -4, 8, 0, 7); c.fill();
    c.strokeStyle = 'rgba(220,236,242,.5)'; c.lineWidth = 1.4; c.beginPath(); c.arc(-18 + i * 26, -4, 8, 0, 7); c.stroke();
  }
  // 浮筒与推进器
  c.fillStyle = '#12181b'; c.beginPath(); c.roundRect(-96, 24, 192, 40, 8); c.fill();
  c.strokeStyle = 'rgba(180,196,206,.25)'; c.lineWidth = 1.6; c.strokeRect(-96, 24, 192, 40);
  c.beginPath(); c.arc(104, 62, 16, 0, 7); c.stroke();
  c.fillStyle = '#10161a'; c.fillRect(-10, -84, 20, 22);
  // 探照灯
  for (let i = -1; i <= 1; i += 2) {
    c.fillStyle = '#20282c'; c.beginPath(); c.roundRect(48, i * 26 - 8, 20, 16, 4); c.fill();
    c.fillStyle = 'rgba(245,252,255,.95)'; c.beginPath(); c.arc(68, i * 26, 5, 0, 7); c.fill();
    FILM.glow(c, 70, i * 26, 26, '#e8f8ff', .55);
  }
  c.restore();
}

function drawSchool(c, t) {
  const r = rng('school');
  // 上浮的鱼群：每一条都提着自己的小灯
  for (let i = 0; i < 26; i++) {
    const x = 460 + r() * 1380 + Math.sin(t * .7 + i) * 20;
    const y = 300 + r() * 700 - ((t * (14 + r() * 30) + i * 41) % 160);
    const s = .55 + r() * .5, rot = -.62 + r() * .22;
    const al = .5 + r() * .45;
    c.save(); c.globalAlpha = al * .95;
    c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.fillStyle = 'rgba(8,13,16,.55)';
    c.beginPath(); c.ellipse(0, 0, 60, 21, 0, 0, 7); c.fill();
    c.beginPath(); c.moveTo(-54, 0); c.lineTo(-88, -18); c.lineTo(-80, 18); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(196,220,232,.32)'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(0, 0, 60, 21, 0, 0, 7); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let d = 0; d < 5; d++) {
      const lx = 30 - d * 16, ly = 11;
      FILM.glow(c, lx, ly, 16, '#dcf6ff', .7);
      c.fillStyle = 'rgba(244,254,255,.95)'; c.beginPath(); c.arc(lx, ly, 3.2, 0, 7); c.fill();
    }
    c.restore();
    c.restore();
  }
  // 两只水母
  drawJelly(c, t, 1540, 700 - (t * 12 % 80), .95, .55);
  drawJelly(c, t, 480, 480 - (t * 9 % 60), .7, .4);
}

function drawCaption(c, t) {
  const k = soft((t - 8.9) / .6);
  if (k <= 0) return;
  c.save(); c.globalAlpha = k * .8;
  FILM.text(c, '500 M · UPWELLING', { x: 1830, y: 1004, align: 'right', size: 22, color: 'rgba(214,228,236,.72)', weight: 500, tracking: 5 });
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#050708');
  const cam = FILM.cam(CAM_KEYS, t);
  const shx = (n1(t * 7, 2) - .5) * 4, shy = (n1(t * 5, 3) - .5) * 4;
  c.save(); c.translate(shx, shy);
  FILM.withCam(c, cam, () => {
    drawWater(c, t, cam);
    drawSchool(c, t);
    drawSub(c, t);
    const p = fishPos(t);
    drawAngler(c, t, p.x, p.y, p.rot, 1.15);
    drawSurface(c, t);
  });
  c.restore();
  // 直刻胶片：高反差、划痕、颗粒
  c.save(); c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgba(214,226,232,.08)'; c.fillRect(0, 0, FILM.W, FILM.H); c.restore();
  const r = rng('etch');
  for (let i = 0; i < 5; i++) {
    const x = r() * FILM.W;
    c.strokeStyle = `rgba(225,236,242,${.10 + r() * .14})`; c.lineWidth = .9;
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (n1(t * 2 + i) - .5) * 26, FILM.H); c.stroke();
  }
  FILM.grain(c, .20, 6);
  FILM.vignette(c, { inner: .26, outer: .92, a: .68 });
  FILM.letterbox(c, .045, '#000');
  drawCaption(c, t);
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });
