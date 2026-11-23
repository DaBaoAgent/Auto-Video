// liuchang · 流场 · 台风眼
// 卫星视角的海面，一条海岸线。风被画成一根根短线，绕着台风眼转。
// 越靠眼墙越快，越靠近陆地越黄。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;
const CX = 1180, CY = 470;

const r = rng('liuchang');
const P = [];
for (let i = 0; i < 1100; i++) {
  P.push({
    r: 60 + Math.pow(r(), .62) * 980,
    a: r() * Math.PI * 2,
    sp: .10 + r() * .35,
    len: 6 + r() * 26,
    gr: (r() - .5) * .05,
    w: .5 + r() * 1.6,
  });
}

function coast(c) {
  // 陆地（左下的海岸）
  const g = c.createLinearGradient(0, 0, 700, H);
  g.addColorStop(0, '#0e2b33'); g.addColorStop(.55, '#10332b'); g.addColorStop(1, '#163b2d');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 300);
  c.bezierCurveTo(180, 360, 300, 460, 380, 620);
  c.bezierCurveTo(430, 740, 470, 880, 520, 1080);
  c.lineTo(0, 1080);
  c.fill();
  // 岸线
  c.strokeStyle = 'rgba(160,240,225,.34)'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(0, 300); c.bezierCurveTo(180, 360, 300, 460, 380, 620); c.bezierCurveTo(430, 740, 470, 880, 520, 1080); c.stroke();
  // 田垄与山影
  const rt = rng('land');
  for (let i = 0; i < 26; i++) {
    const x = rt() * 420, y = 360 + rt() * 700, w = 20 + rt() * 90, h = 8 + rt() * 26;
  }
  // 城市点
  const rr = rng('city');
  for (let i = 0; i < 90; i++) {
    const t = rr(), x = 20 + t * 440, y = 340 + t * 640 + rr() * 60;
    c.fillStyle = `rgba(255,220,150,${.2 + rr() * .5})`;
    c.fillRect(x, y, 2 + rr() * 2, 2 + rr() * 2);
  }
  // 海面纹理
  c.strokeStyle = 'rgba(120,180,200,.06)'; c.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const y = i * 28;
    c.beginPath(); c.moveTo(540, y); c.bezierCurveTo(900, y - 8, 1300, y + 10, 1920, y - 4); c.stroke();
  }
}

function flow(c, t, inten) {
  const RM = 900;
  P.forEach((p, i) => {
    // 螺旋：每绕一圈半径缩一点，同时整体缓慢旋转
    const rad = p.r * (1 - .06 * Math.sin(t * .3 + i));
    const ang = p.a + t * (p.sp * 2.4) * (inten * .6 + .6);
    // 切向速度 + 一点向心
    const x = CX + Math.cos(ang) * rad * 1.28;
    const y = CY + Math.sin(ang) * rad * .82;
    const tx = -Math.sin(ang) * 1.28 * rad;
    const ty = Math.cos(ang) * .82 * rad;
    const k = Math.hypot(tx, ty) || 1;
    const v = clamp(1 - rad / RM);
    const len = p.len * (1.2 + v * 2.4);
    const a = .10 + .55 * v;
    const col = v > .72 ? `rgba(255,172,92,${a})` : v > .44 ? `rgba(255,216,152,${a})` : v > .22 ? `rgba(160,244,226,${a * .9})` : `rgba(112,186,232,${a * .75})`;
    c.strokeStyle = col;
    c.lineWidth = p.w * (1 + v * .8);
    c.beginPath();
    c.moveTo(x, y);
    const ix = (CX - x) / (Math.hypot(CX - x, CY - y) || 1), iy = (CY - y) / (Math.hypot(CX - x, CY - y) || 1);
    c.lineTo(x + (tx / k - ix * .42) * len, y + (ty / k - iy * .42) * len);
    c.stroke();
  });
}

function eye(c, t, inten) {
  // 眼
  const rr = 90 + 10 * Math.sin(t * .8);
  const g = c.createRadialGradient(CX, CY, 4, CX, CY, rr * 2.2);
  g.addColorStop(0, 'rgba(6,10,16,.95)'); g.addColorStop(.6, 'rgba(8,16,24,.55)'); g.addColorStop(1, 'rgba(8,16,24,0)');
  c.fillStyle = g;
  c.beginPath(); c.ellipse(CX, CY, rr, rr * .72, 0, 0, 7); c.fill();
  // 眼墙上的一圈亮
  c.strokeStyle = `rgba(255,236,190,${.20 * inten})`; c.lineWidth = 3;
  c.beginPath(); c.ellipse(CX, CY, rr * 1.35, rr * .95, 0, 0, 7); c.stroke();
  FILM.glow(c, CX, CY, rr * 2.4, '#ffe6b0', .10 * inten);
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#04101a');
  const inten = .5 + .5 * soft((t - .4) / 4.2);
  const zoom = 1.0 + soft(t / 10) * .12;
  c.save();
  c.translate(CX, CY); c.scale(zoom, zoom); c.translate(-CX, -CY);
  // 海
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#061a26'); bg.addColorStop(.5, '#082030'); bg.addColorStop(1, '#0a1c28');
  c.fillStyle = bg; c.fillRect(-200, -200, W + 400, H + 400);
  coast(c);
  // 台风外围雨带
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + t * .25;
    const rad = 620 + i * 70;
    c.fillStyle = 'rgba(150,210,220,.028)';
    c.beginPath();
    c.ellipse(CX + Math.cos(a) * 120, CY + Math.sin(a) * 80, rad * .85, rad * .42, a * .5, 0, 7);
    c.fill();
  }
  flow(c, t, inten);
  eye(c, t, inten);
  // 风圈
  c.strokeStyle = 'rgba(255,230,180,.14)'; c.lineWidth = 1.5;
  [300, 480, 700].forEach((rr, i) => {
    c.beginPath(); c.ellipse(CX, CY, rr * 1.25, rr * .8, 0, 0, 7); c.stroke();
    FILM.text(c, ['7 级', '10 级', '12 级'][i], { x: CX + rr * 1.25 + 6, y: CY + 6, size: 14, color: 'rgba(255,230,180,.35)' });
  });
  c.restore();
  // 经纬网格
  c.strokeStyle = 'rgba(150,210,230,.10)'; c.lineWidth = 1;
  for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(i * W / 6, 0); c.lineTo(i * W / 6, H); c.stroke(); }
  for (let j = 1; j < 4; j++) { c.beginPath(); c.moveTo(0, j * H / 4); c.lineTo(W, j * H / 4); c.stroke(); }
  // 标注
  const note = soft((t - 7.4) / 1.0);
  if (note > 0) {
    c.save(); c.globalAlpha = note;
    FILM.text(c, 'TYPHOON · EYE 42 KM', { x: 80, y: 96, size: 24, color: 'rgba(220,240,240,.85)', weight: 500, tracking: 4 });
    FILM.text(c, 'MAX WIND 198 KM/H', { x: 80, y: 130, size: 15, color: 'rgba(160,200,205,.6)', tracking: 3 });
    c.restore();
  }
  FILM.grain(c, .10, 101);
  FILM.vignette(c, { inner: .44, outer: .98, a: .45 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });




