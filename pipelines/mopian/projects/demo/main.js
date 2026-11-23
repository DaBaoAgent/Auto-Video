// mopian · 1920s 默片
// 面包房的小学徒追着一块滚走的面包，追到墙根下的小女孩面前，
// 把面包掰成两半，一人一半。四比三画幅、片门晃动、划痕、圆形收尾。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { clamp, lerp, soft, rng, n1, easeOutBack } = FILM;

const VW = 1440, VH = 1080;   // 4:3 画幅，左右补黑边
const GROUND = 940;

const CAM_KEYS = [
  { t: 0.0, x: 690, y: 620, z: 1.02 },
  { t: 1.9, x: 810, y: 628, z: 1.02, ease: soft },
  { t: 4.6, x: 1180, y: 640, z: 1.01, ease: soft },
  { t: 6.2, x: 1420, y: 648, z: 1.02, ease: soft },
  { t: 7.6, x: 1520, y: 650, z: 1.08, ease: soft },
  { t: 10.0, x: 1538, y: 652, z: 1.22, ease: soft },
];

function vignette43(c) {
  c.save();
  c.beginPath(); c.rect(0, 0, VW, VH); c.clip();
  const g = c.createRadialGradient(VW / 2, VH * .46, 220, VW / 2, VH * .48, 900);
  g.addColorStop(0, 'rgba(20,15,10,0)'); g.addColorStop(.62, 'rgba(20,15,10,.20)'); g.addColorStop(1, 'rgba(16,12,8,.62)');
  c.fillStyle = g; c.fillRect(0, 0, VW, VH);
  c.restore();
}

// 建筑立面
function drawFacades(c, t, px) {
  const r = rng('f');
  const base = 940;
  for (let i = 0; i < 6; i++) {
    const x = -260 + i * 700, w = 640;
    const h = 420 + r() * 180;
    c.fillStyle = i % 2 ? '#a99b80' : '#b6a88c';
    c.fillRect(x, base - h, w, h);
    // 屋顶
    c.fillStyle = '#8d7f66';
    c.beginPath(); c.moveTo(x - 26, base - h); c.lineTo(x + w * .5, base - h - 70); c.lineTo(x + w + 26, base - h); c.closePath(); c.fill();
    // 窗
    for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) {
      const wx = x + 60 + k * 180, wy = base - h + 70 + j * 150;
      c.fillStyle = '#3a3329'; c.fillRect(wx, wy, 96, 108);
      c.fillStyle = 'rgba(230,220,196,.22)'; c.fillRect(wx + 6, wy + 6, 84, 50);
      c.strokeStyle = '#6f6350'; c.lineWidth = 3; c.strokeRect(wx, wy, 96, 108);
      c.beginPath(); c.moveTo(wx + 48, wy); c.lineTo(wx + 48, wy + 108); c.stroke();
    }
    // 底层店面
    if (i === 0) {
      // 面包房
      c.fillStyle = '#6d6150'; c.fillRect(x + 40, base - 250, w - 80, 250);
      c.fillStyle = '#3f362a'; c.fillRect(x + 120, base - 210, 190, 210);
      c.strokeStyle = '#e7dcc2'; c.lineWidth = 3; c.strokeRect(x + 120, base - 210, 190, 210);
      // 招牌
      c.fillStyle = '#28221a'; c.fillRect(x + 90, base - 300, 300, 52);
      FILM.text(c, 'BOULANGERIE', { x: x + 240, y: base - 262, size: 26, color: 'rgba(238,228,205,.9)', align: 'center', weight: 700, tracking: 3 });
    } else if (i === 1) {
      c.fillStyle = '#9b8d74'; c.fillRect(x + 30, base - 260, w - 60, 260);
      // 条纹遮阳棚
      for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#6f6250' : '#ddd0b6'; c.fillRect(x + 40 + k * 76, base - 250, 76, 46); }
      c.fillStyle = 'rgba(40,34,26,.25)'; c.fillRect(x + 30, base - 200, w - 60, 200);
      // 菜摊
      c.fillStyle = '#5c5142'; c.fillRect(x + 70, base - 150, 260, 60);
      for (let k = 0; k < 7; k++) { c.fillStyle = k % 2 ? '#7d7059' : '#8c7f68'; c.beginPath(); c.arc(x + 92 + k * 34, base - 152, 18, 0, 7); c.fill(); }
    } else {
      c.fillStyle = '#847860'; c.fillRect(x + 30, base - 240, w - 60, 240);
      c.fillStyle = '#2f2820'; c.fillRect(x + 90, base - 210, 150, 210);
    }
  }
  // 远景烟囱与电线
  c.strokeStyle = 'rgba(70,60,46,.35)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-100, 500); c.quadraticCurveTo(700, 470, 1900, 520); c.stroke();
  c.beginPath(); c.moveTo(-100, 560); c.quadraticCurveTo(900, 540, 2100, 590); c.stroke();
}

function drawStreet(c, t) {
  // 路面
  c.fillStyle = '#b9ab8f';
  c.fillRect(-300, GROUND - 20, 3400, 260);
  // 鹅卵石
  const r = rng('cobble');
  for (let row = 0; row < 7; row++) {
    const y = GROUND + 4 + row * 28, step = 60 - row * 4;
    for (let i = 0; i < 34; i++) {
      const x = -200 + i * step + row * 18 + r() * 6;
      c.fillStyle = `rgba(${46 + r() * 26},${40 + r() * 22},${32 + r() * 18},${.16 + r() * .2})`;
      c.beginPath(); c.ellipse(x, y, step * .34, 10 - row, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(240,232,210,.10)';
      c.beginPath(); c.ellipse(x - 4, y - 3, step * .22, 5, 0, 0, 7); c.fill();
    }
  }
  // 路边石
  c.fillStyle = '#8e8269'; c.fillRect(-300, GROUND - 34, 3400, 20);
  c.strokeStyle = 'rgba(40,34,26,.35)'; c.lineWidth = 2;
  for (let x = -300; x < 3100; x += 90) { c.beginPath(); c.moveTo(x, GROUND - 34); c.lineTo(x, GROUND - 14); c.stroke(); }
}

function drawProps(c, t) {
  // 墙根（女孩靠的墙）
  c.fillStyle = '#a2947a'; c.fillRect(1600, 500, 420, 440);
  c.fillStyle = '#8b7f68';
  for (let i = 0; i < 9; i++) c.fillRect(1600, 520 + i * 48, 420, 22);
  // 墙上的旧海报
  c.fillStyle = '#cabb9e'; c.fillRect(1690, 560, 120, 150);
  c.fillStyle = 'rgba(60,52,40,.5)'; c.fillRect(1700, 580, 100, 60);
  FILM.text(c, 'PAIN', { x: 1750, y: 640, size: 22, color: 'rgba(50,44,34,.8)', align: 'center', weight: 700, tracking: 2 });
  // 面包房门前的木箱、扫帚
  c.fillStyle = '#5c4f3e'; c.fillRect(780, 840, 90, 90);
  c.strokeStyle = '#403428'; c.lineWidth = 3; c.strokeRect(780, 840, 90, 90);
  c.strokeStyle = '#3c3226'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(1010, 930); c.lineTo(1046, 700); c.stroke();
  c.fillStyle = '#c9b895'; c.beginPath(); c.roundRect(1022, 680, 44, 78, 10); c.fill();
  // 路灯
  c.strokeStyle = '#3b3226'; c.lineWidth = 9;
  c.beginPath(); c.moveTo(1330, 940); c.lineTo(1330, 470); c.stroke();
  c.fillStyle = '#4a3f30'; c.beginPath(); c.arc(1330, 452, 30, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,240,205,.35)'; c.beginPath(); c.arc(1330, 452, 18, 0, 7); c.fill();
  // 墙角的破篮子
  c.strokeStyle = '#6a5b45'; c.lineWidth = 3;
  c.beginPath(); c.arc(1570, 930, 26, 0, 7); c.stroke();
  c.beginPath(); c.arc(1570, 930, 16, 0, 7); c.stroke();
}

function drawBread(c, x, y, rot, scale = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(scale, scale);
  const body = FILM.smooth([[-46, 4], [-30, -30], [0, -38], [30, -30], [46, 4], [28, 20], [-28, 20]]);
  const g = c.createLinearGradient(-30, -34, 20, 22);
  g.addColorStop(0, '#f3e6c6'); g.addColorStop(.62, '#d6bd92'); g.addColorStop(1, '#a98c63');
  c.fillStyle = g; c.fill(body);
  c.strokeStyle = 'rgba(70,54,36,.55)'; c.lineWidth = 2; c.stroke(body);
  c.strokeStyle = 'rgba(90,68,44,.55)'; c.lineWidth = 4;
  for (let i = -1; i <= 1; i++) {
    c.beginPath(); c.moveTo(i * 18 - 4, -26); c.quadraticCurveTo(i * 18 + 2, -10, i * 18 - 6, 2); c.stroke();
  }
  c.fillStyle = 'rgba(255,250,235,.35)';
  c.beginPath(); c.ellipse(-14, -22, 18, 7, -.3, 0, 7); c.fill();
  c.restore();
}

function drawBoy(c, t, x, h, phase, lean) {
  FILM.person(c, {
    x, y: GROUND + 20, h, face: 1, fill: '#2b241b', fill2: '#5a4c38', rim: '#e8dcc0', rimW: 2,
    pose: {
      lean: lean || .22,
      legL: [.46 * Math.sin(phase * 6.283), .28], legR: [-.46 * Math.sin(phase * 6.283), .28],
      armL: [.5 + .32 * Math.sin(phase * 6.283 + 3), .55], armR: [-.55 - .3 * Math.sin(phase * 6.283), .5],
      bob: Math.abs(Math.sin(phase * 6.283)) * .02,
    },
    coat: 'long', hat: 'cap', hair: 'short',
  });
  // 围裙
  c.fillStyle = 'rgba(238,228,204,.82)';
  const ax = x + 10, ay = GROUND + 20 - h * .55;
  c.beginPath();
  c.moveTo(ax - h * .085, ay); c.lineTo(ax + h * .095, ay);
  c.lineTo(ax + h * .08, ay + h * .36); c.lineTo(ax - h * .07, ay + h * .36); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(80,66,48,.45)'; c.lineWidth = 2; c.stroke();
}

function drawGirl(c, t, x, h) {
  const reach = soft((t - 5.3) / .7);
  FILM.person(c, {
    x, y: GROUND + 20, h, face: -1, fill: '#332b20', fill2: '#5f5240', rim: '#f0e4c8', rimW: 2,
    pose: {
      lean: -.05 + reach * .12,
      armL: [(-.10 - .55 * reach), .2 + .2 * reach],
      armR: [(-.25 - .5 * reach), .15 + .15 * reach],
      legL: [.05, .02], legR: [-.05, .02],
    },
    coat: 'skirt', hair: 'long',
  });
  // 披肩
  c.fillStyle = 'rgba(190,174,146,.72)';
  c.beginPath();
  const sx = x - 6, sy = GROUND + 20 - h * .82;
  c.moveTo(sx - h * .11, sy + h * .13); c.quadraticCurveTo(sx, sy - h * .02, sx + h * .10, sy + h * .12);
  c.lineTo(sx + h * .07, sy + h * .26); c.quadraticCurveTo(sx, sy + h * .18, sx - h * .08, sy + h * .26); c.closePath(); c.fill();
}

function drawCart(c, x) {
  c.fillStyle = '#4d4132';
  c.fillRect(x, 800, 200, 120);
  c.strokeStyle = '#e2d5b8'; c.lineWidth = 3;
  for (let i = 0; i < 4; i++) { c.strokeRect(x + 10 + i * 46, 812, 40, 96); }
  c.fillStyle = '#3a3026';
  c.beginPath(); c.arc(x - 18, 928, 44, 0, 7); c.fill();
  c.beginPath(); c.arc(x + 216, 928, 44, 0, 7); c.fill();
  c.strokeStyle = '#6b5b45'; c.lineWidth = 5;
  c.beginPath(); c.arc(x - 18, 928, 30, 0, 7); c.stroke();
  c.beginPath(); c.arc(x + 216, 928, 30, 0, 7); c.stroke();
  // 车上的筐
  c.fillStyle = '#7b6a50'; c.beginPath(); c.roundRect(x + 40, 720, 120, 82, 8); c.fill();
}

function drawPigeons(c, t) {
  const r = rng('pig');
  c.fillStyle = '#45392b';
  for (let i = 0; i < 5; i++) {
    const x = 980 + i * 70 + Math.sin(t * 2 + i) * 12, y = 928 - (i % 2) * 6;
    c.beginPath(); c.ellipse(x, y, 12, 8, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(x + 12, y - 6, 5, 0, 7); c.fill();
    c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x - 20, y - 8); c.lineTo(x - 10, y + 4); c.closePath(); c.fill();
  }
}

function drawIris(c, t) {
  const k = soft((t - 8.9) / 1.0);
  if (k <= 0) return;
  const rr = lerp(620, 132, k);
  const p = new Path2D();
  p.rect(0, 0, VW, VH);
  p.arc(1512, 706, rr, 0, Math.PI * 2);
  c.fillStyle = '#000'; c.fill(p, 'evenodd');
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#000');
  // 4:3 画幅
  c.save();
  c.translate(240, 0);
  c.beginPath(); c.rect(0, 0, VW, VH); c.clip();
  // 片门晃动
  const wx = (n1(t * 11, 2) - .5) * 3.4, wy = (n1(t * 9, 5) - .5) * 3;
  c.translate(wx, wy);
  // 天
  const sky = c.createLinearGradient(0, 0, 0, 900);
  sky.addColorStop(0, '#efe4c9'); sky.addColorStop(.55, '#ded0b2'); sky.addColorStop(1, '#c3b494');
  c.fillStyle = sky; c.fillRect(-60, -40, VW + 120, VH + 120);
  // 云
  FILM.mist(c, 420, 300, 420, 130, '#fff8e6', .25);
  FILM.mist(c, 1050, 250, 380, 110, '#fff8e6', .20);
  // 视差层
  const cam = FILM.cam(CAM_KEYS, t);
  const bg = { x: cam.x * .45 + 300, y: cam.y * .98, z: cam.z, r: cam.r };
  c.save(); c.translate(VW / 2, VH / 2); c.scale(bg.z, bg.z); c.translate(-bg.x, -bg.y);
  drawFacades(c, t, bg.x);
  c.restore();
  // 主层
  c.save(); c.translate(VW / 2, VH / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
  drawStreet(c, t);
  drawProps(c, t);
  drawCart(c, 1130);
  drawPigeons(c, t);
  // 面包与人物
  const rollStart = 1.15;
  const breadX = t < rollStart ? 690 : 690 + (breadDist(t) * 1);
  function breadDist(tt) {
    const u = Math.max(0, tt - rollStart);
    const v = Math.min(u, 4.6);
    return 172 * v + 18 * Math.sin(v * 3.2);
  }
  const bounce = Math.max(0, Math.sin(breadDist(t) * .34)) * 16;
  const rot = breadDist(t) / 46;
  if (t <= 5.9) drawBread(c, Math.min(1492, breadX), GROUND - 6 - bounce, rot, 1.15);
  // 男孩
  const runFrom = 1.6, catchT = 5.9;
  const k = clamp((t - runFrom) / (catchT - runFrom));
  if (t > runFrom && t < 7.6) {
    const speedPhase = t < 6.05 ? (t * 2.2) % 1 : 0;
    const bx = lerp(600, 1436, clamp(k) * (1 - .0));
    drawBoy(c, t, bx, 300, speedPhase, .22 + (1 - k) * .06);
  } else if (t >= 7.6) {
    drawBoy(c, t, 1436, 300, 0, .18 + Math.sin(t) * .01);
  }
  // 女孩
  if (t > 4.4) drawGirl(c, t, 1530, 272);
  // 面包被接住：5.9 秒起跟着女孩的手
  if (t > 5.9) {
    const hx = 1502, hy = GROUND - 178;
    drawBread(c, hx, hy - 2, -.22, .92);
  }
  // 掰开
  if (t > 7.0) {
    const s = soft((t - 7.0) / .6);
    drawBread(c, 1502 - 22 - s * 26, GROUND - 178 - s * 8, -.5, .55);
    drawBread(c, 1502 + 20 + s * 30, GROUND - 180 - s * 4, -.15, .5);
    FILM.mist(c, 1500, GROUND - 190, 40 + s * 40, 24, '#fff6dd', .28 * (1 - s * .4));
  }
  c.restore();
  vignette43(c);
  drawIris(c, t);
  c.restore();
  // 左右黑边
  c.fillStyle = '#000'; c.fillRect(0, 0, 240, FILM.H); c.fillRect(1680, 0, 240, FILM.H);
  // 默片后期：奶油色、闪烁、划痕、灰尘、颗粒
  c.save(); c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgba(255,244,218,.55)'; c.fillRect(0, 0, FILM.W, FILM.H); c.restore();
  const flick = .06 + .05 * Math.max(0, Math.sin(t * 23) * Math.sin(t * 7));
  c.fillStyle = `rgba(255,248,226,${flick})`; c.fillRect(0, 0, FILM.W, FILM.H);
  // 竖划痕
  const r = rng('scratch');
  for (let i = 0; i < 4; i++) {
    const x = 240 + r() * 1440;
    c.strokeStyle = `rgba(255,252,238,${.18 + r() * .2})`; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (n1(t * 3 + i) - .5) * 20, FILM.H); c.stroke();
  }
  // 灰尘
  const rd = rng('dust' + Math.floor(t * 12));
  for (let i = 0; i < 16; i++) {
    c.fillStyle = r() < .5 ? 'rgba(255,250,235,.5)' : 'rgba(20,16,10,.6)';
    c.beginPath(); c.arc(240 + rd() * 1440, rd() * FILM.H, .6 + rd() * 2.2, 0, 7); c.fill();
  }
  FILM.grain(c, .22, 5);
  FILM.vignette(c, { inner: .30, outer: .95, a: .42 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });
