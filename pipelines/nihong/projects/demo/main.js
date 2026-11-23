// nihong · 霓虹 · 雨夜的猫
// 一条被霓虹泡着的巷子，黑猫沿窗台走过来。窗里是一缸金鱼。
// 它伸爪，水花溅起，金鱼变成一道橙色的光，跃过整条巷子。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, rng, clamp } = FILM;
const W = 1920, H = 1080;

const r = rng('nihong');

function building(c, t) {
  // 夜空
  const sky = c.createLinearGradient(0, 0, 0, 700);
  sky.addColorStop(0, '#0a0a1e'); sky.addColorStop(.6, '#150f2c'); sky.addColorStop(1, '#241540');
  c.fillStyle = sky; c.fillRect(0, 0, W, 760);
  FILM.clouds(c, t * .3, { y: 200, n: 6, color: 'rgba(120,80,160,.10)', scale: 2.2, seed: 3 });
  // 远处楼影
  c.fillStyle = '#0b0a18';
  [[0, 360, 260, 420], [230, 300, 300, 480], [1520, 280, 400, 520], [1560, 340, 200, 440]][0];
  c.fillRect(0, 340, 300, 420);
  c.fillRect(250, 300, 300, 460);
  c.fillRect(1480, 300, 440, 460);
  // 巷子两壁（透视）
  const leftW = c.createLinearGradient(0, 0, 640, 0);
  leftW.addColorStop(0, '#141026'); leftW.addColorStop(1, '#1d1636');
  c.fillStyle = leftW;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(560, 0); c.lineTo(430, 780); c.lineTo(0, 780); c.fill();
  const rightW = c.createLinearGradient(1920, 0, 1240, 0);
  rightW.addColorStop(0, '#141026'); rightW.addColorStop(1, '#1d1636');
  c.fillStyle = rightW;
  c.beginPath(); c.moveTo(1920, 0); c.lineTo(1360, 0); c.lineTo(1500, 780); c.lineTo(1920, 780); c.fill();
  // 砖缝
  c.strokeStyle = 'rgba(90,70,140,.18)'; c.lineWidth = 2;
  for (let i = 0; i < 9; i++) { const yy = 90 + i * 86; c.beginPath(); c.moveTo(0, yy); c.lineTo(470 - i * 10, yy + 10); c.stroke(); c.beginPath(); c.moveTo(1920, yy); c.lineTo(1440 + i * 10, yy + 10); c.stroke(); }
}

function neonSign(c, x, y, w, h, color, text, t, seed, vertical = true) {
  const flick = .82 + .18 * Math.sin(t * 9 + seed) + (Math.sin(t * 2.2 + seed) > .96 ? -.5 : 0);
  c.save();
  c.globalAlpha = .9;
  // 灯箱底
  c.fillStyle = 'rgba(10,8,18,.92)';
  c.beginPath(); c.roundRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, 8); c.fill();
  c.strokeStyle = FILM.rgba(color, .55 * flick); c.lineWidth = 3;
  c.beginPath(); c.roundRect(x - w / 2, y - h / 2, w, h, 6); c.stroke();
  // 字
  c.shadowColor = color; c.shadowBlur = 26 * flick;
  c.fillStyle = FILM.rgba(color, .95 * flick);
  if (vertical) {
    const chars = [...text];
    const step = h / (chars.length + .4);
    chars.forEach((ch, i) => {
      FILM.text(c, ch, { x, y: y - h / 2 + step * (i + .8), align: 'center', size: Math.min(w * 1.05, step * .92), color: FILM.rgba(color, .95 * flick), weight: 700, alpha: .95 });
    });
  } else {
    FILM.text(c, text, { x, y: y + h * .12, align: 'center', size: h * .62, color: FILM.rgba(color, .95 * flick), weight: 700, tracking: 2 });
  }
  c.restore();
  // 地面反光条
  c.save();
  c.globalAlpha = .22 * flick;
  const g = c.createLinearGradient(0, 700, 0, 1080);
  g.addColorStop(0, FILM.rgba(color, .55)); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g;
  c.fillRect(x - w * .55, 700, w * 1.1, 360);
  c.restore();
}

function shopWindow(c, t) {
  // 窗：暖色的鱼缸
  const x = 690, y = 300, w = 470, h = 360;
  c.save();
  c.fillStyle = '#080611';
  c.beginPath(); c.roundRect(x - 22, y - 22, w + 44, h + 44, 10); c.fill();
  const gl = c.createLinearGradient(x, y, x, y + h);
  gl.addColorStop(0, '#5a3a20'); gl.addColorStop(.45, '#c08a4e'); gl.addColorStop(1, '#8a5c30');
  c.fillStyle = gl; c.beginPath(); c.roundRect(x, y, w, h, 6); c.fill();
  // 窗里的暗角与货架
  c.fillStyle = 'rgba(60,36,18,.55)'; c.fillRect(x, y, w, 92);
  c.fillStyle = 'rgba(240,196,140,.35)'; c.fillRect(x, y + 92, w, 8);
  // 鱼缸：一只圆玻璃缸
  const bx = x + w * .40, by = y + h * .60, R = 104;
  c.fillStyle = 'rgba(12,20,26,.5)';
  c.beginPath(); c.ellipse(bx, by + R * .72, R * .82, R * .16, 0, 0, 7); c.fill();
  // 水体
  const wl = c.createLinearGradient(0, by - R, 0, by + R);
  wl.addColorStop(0, 'rgba(170,225,232,.42)'); wl.addColorStop(.6, 'rgba(74,146,160,.52)'); wl.addColorStop(1, 'rgba(28,64,78,.55)');
  c.fillStyle = wl;
  c.beginPath(); c.moveTo(bx - R, by - 34); c.quadraticCurveTo(bx - R * .98, by + R * .9, bx, by + R * .86);
  c.quadraticCurveTo(bx + R * .98, by + R * .9, bx + R, by - 34);
  c.closePath(); c.fill();
  // 玻璃
  c.strokeStyle = 'rgba(226,246,250,.6)'; c.lineWidth = 2.6;
  c.beginPath(); c.moveTo(bx - R, by - 34); c.quadraticCurveTo(bx - R * .98, by + R * .9, bx, by + R * .86);
  c.quadraticCurveTo(bx + R * .98, by + R * .9, bx + R, by - 34);
  c.stroke();
  c.strokeStyle = 'rgba(236,250,252,.7)'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(bx, by - 34, R, R * .13, 0, 0, 7); c.stroke();
  c.fillStyle = 'rgba(214,244,250,.30)';
  c.beginPath(); c.ellipse(bx, by - 34, R * .96, R * .11, 0, 0, 7); c.fill();
  // 玻璃高光
  c.fillStyle = 'rgba(240,252,255,.22)';
  c.beginPath(); c.ellipse(bx - R * .48, by + R * .12, R * .12, R * .42, -.32, 0, 7); c.fill();
  c.restore();
  // 金鱼
  const fx = bx + Math.sin(t * .9) * 40, fy = by - 6 + Math.sin(t * 1.4) * 12;
  const gone = soft((t - 6.1) / .35);
  if (gone < 1) {
    c.save(); c.globalAlpha = 1 - gone;
    FILM.fish(c, { x: fx, y: fy, len: 86, fill: '#ff7a1e', belly: '#ffd08a', fin: '#e84a12', glow: '#ff8a2a', phase: t * .9 });
    c.restore();
    FILM.glow(c, fx, fy, 70, '#ff9a3a', .22);
  }
  // 玻璃反光
  c.save();
  c.globalAlpha = .18;
  c.fillStyle = '#dff4ff';
  c.beginPath(); c.moveTo(x + 40, y + h); c.lineTo(x + 150, y); c.lineTo(x + 210, y); c.lineTo(x + 100, y + h); c.fill();
  c.restore();
  return { bx, by };
}

function streets(c, t) {
  // 湿地面
  const g = c.createLinearGradient(0, 700, 0, 1080);
  g.addColorStop(0, '#0c0a18'); g.addColorStop(.4, '#141029'); g.addColorStop(1, '#080611');
  c.fillStyle = g; c.fillRect(0, 700, W, 380);
  // 反光斑点
  const rr = rng('puddle');
  for (let i = 0; i < 40; i++) {
    const px = rr() * W, py = 720 + rr() * 340;
    c.fillStyle = `rgba(${rr() > .6 ? '255,110,180' : '110,220,255'},${.05 + rr() * .12})`;
    c.beginPath(); c.ellipse(px, py, 10 + rr() * 70, 3 + rr() * 12, 0, 0, 7); c.fill();
  }
  // 水洼
  const p1 = c.createRadialGradient(960, 940, 10, 960, 940, 420);
  p1.addColorStop(0, 'rgba(255,90,160,.20)'); p1.addColorStop(.6, 'rgba(80,160,255,.10)'); p1.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = p1; c.fillRect(420, 760, 1080, 320);
  // 雨
  FILM.rain(c, t, { n: 190, color: 'rgba(190,210,255,.45)', len: 22, speed: 1200, slant: .10, seed: 5, alpha: .55 });
  // 蒸汽
  FILM.mist(c, 300, 800, 220, 140, '#9570b0', .16);
  FILM.mist(c, 1640, 780, 200, 130, '#7f86c0', .14);
}

function cat(c, t) {
  // 猫沿窗台走进画面，停在窗前
  const walk = soft((t - .4) / 3.2);
  const x = lerp(1640, 1150, walk);
  const step = t * 2.4;
  const squat = soft((t - 4.8) / .9);
  const info = FILM.cat(c, {
    x, y: 706, h: 246, face: -1,
    fill: '#07060e', rim: 'rgba(255,140,205,.5)', rimW: 2,
    phase: walk < 1 ? step : 0,
    crouch: .5 * squat, tail: .4,
  });
  // 眼
  const eyeOpen = .4 + .6 * soft((t - 2.4) / 1.0);
  if (eyeOpen > .3) {
    const ex = 2 * x - info.head[0], ey = info.head[1] - 4;
    c.fillStyle = `rgba(160,255,190,${.9 * eyeOpen})`;
    c.beginPath(); c.ellipse(ex - 12, ey, 9, 6 * eyeOpen, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(ex + 12, ey, 9, 6 * eyeOpen, 0, 0, 7); c.fill();
    FILM.glow(c, ex, ey, 40, '#8dffb2', .30 * eyeOpen);
  }
  // 抬爪
  const paw = soft((t - 5.2) / .8) - soft((t - 6.3) / .6);
  if (paw > 0) {
    c.save(); c.strokeStyle = '#07060e'; c.lineWidth = 16;
    c.beginPath(); c.moveTo(x - 10, 640); c.quadraticCurveTo(x - 90 * paw, 620, x - 150 * paw, 570 - 40 * paw); c.stroke();
    c.restore();
    FILM.glow(c, x - 150 * paw, 570 - 40 * paw, 46, '#ff9a3a', .25 * paw);
  }
  return { x };
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#050410');
  const camZ = 1.02 + soft(t / 10) * .14;
  c.save();
  c.translate(900, 620); c.scale(camZ, camZ); c.translate(-900, -620);
  building(c, t);
  // 招牌
  neonSign(c, 300, 300, 96, 300, '#ff2f8e', '金鱼', t, 1.2);
  neonSign(c, 190, 700, 92, 240, '#35e0ff', '酒', t, 2.4);
  neonSign(c, 1600, 260, 100, 330, '#ffd24a', '夜宵', t, 3.1);
  neonSign(c, 1740, 640, 88, 200, '#8f5bff', '24H', t, 4.6);
  neonSign(c, 520, 120, 300, 84, '#35e0ff', 'OPEN', t, 5.2, false);
  shopWindow(c, t);
  // 窗台
  c.fillStyle = '#100c1e'; c.fillRect(520, 686, 1080, 40);
  c.fillStyle = 'rgba(255,190,140,.14)'; c.fillRect(520, 686, 1080, 5);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(520, 722, 1080, 8);
  streets(c, t);
  cat(c, t);
  // 跃出的金鱼：一道橙色的光，划过巷子
  const leap = soft((t - 6.25) / .55);
  if (leap > 0) {
    const u = clamp((t - 6.25) / 2.4);
    const fx = lerp(840, 430, u), fy = 690 - Math.sin(u * Math.PI) * 340 - u * 30;
    const ang = -Math.atan2(Math.cos(u * Math.PI) * 420, -410) * .8;
    c.save(); c.translate(fx, fy); c.rotate(ang);
    FILM.fish(c, { x: 0, y: 0, len: 120, fill: '#ff8a2a', belly: '#ffe0a8', fin: '#ff5a12', glow: '#ffa030', phase: t * 3 });
    c.restore();
    FILM.glow(c, fx, fy, 120, '#ff9a3a', .40);
    // 拖尾
    for (let i = 1; i < 9; i++) {
      const uu = Math.max(0, u - i * .028);
      const tx = lerp(840, 430, uu), ty = 690 - Math.sin(uu * Math.PI) * 340 - uu * 30;
      FILM.glow(c, tx, ty, 26 - i * 2, '#ffb44a', .18 * (1 - i / 9));
    }
  }
  // 水花
  const sp = soft((t - 5.9) / .5);
  if (sp > 0 && t < 7.4) {
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2 + .4;
      const d = 20 + sp * 130;
      c.fillStyle = `rgba(220,245,255,${.6 - .4 * sp})`;
      c.beginPath(); c.arc(840 + Math.cos(a) * d, 690 - 34 + Math.sin(a) * d * .5 - sp * 46, 3 + (i % 3), 0, 7); c.fill();
    }
  }
  c.restore();
  // 霓虹的整体辉光
  c.save();
  c.globalCompositeOperation = 'lighter';
  FILM.glow(c, 300, 300, 240, '#ff2f8e', .10);
  FILM.glow(c, 1600, 280, 260, '#ffd24a', .08);
  FILM.glow(c, 900, 520, 420, '#ff9a3a', .06 + .06 * soft((t - 6) / 2));
  c.restore();
  FILM.grain(c, .14, 21);
  FILM.vignette(c, { inner: .30, outer: .95, a: .66 });
  if (t > 9.0) {
    const k = soft((t - 9.0) / .6);
    c.save(); c.globalAlpha = k * .8;
    FILM.text(c, 'NEON ALLEY · 02:14', { x: 1840, y: 1000, align: 'right', size: 22, color: 'rgba(255,206,236,.8)', weight: 500, tracking: 5 });
    c.restore();
  }
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });





