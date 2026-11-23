// yinghuo · 萤火 · 夏夜
// 夜草坡上一只鹿，萤火一颗一颗亮起来；最小的一颗落在鹿鼻尖上，鹿抬起头；
// 最后所有的萤火一起升上天，像一条向上的河。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, rng } = FILM;
const W = 1920, H = 1080;

const r = rng('yinghuo');
const FLY = [];
for (let i = 0; i < 64; i++) {
  FLY.push({
    x: 120 + r() * 1720,
    y: 420 + r() * 520,
    z: .5 + r() * 1.5,
    ph: r() * 100,
    sp: .5 + r() * 1.1,
    bl: r() * 6,
    rise: 0 + r() * .8,
  });
}

function grass(c, x, y, h, sway, col, alpha) {
  c.strokeStyle = col; c.globalAlpha = alpha; c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + sway * .4, y - h * .6, x + sway, y - h);
  c.stroke();
  c.globalAlpha = 1;
}

function ground(c, t) {
  const sky = c.createLinearGradient(0, 0, 0, H * .72);
  sky.addColorStop(0, '#07110f'); sky.addColorStop(.45, '#0d1c1a'); sky.addColorStop(.78, '#16302a'); sky.addColorStop(1, '#274a3c');
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  FILM.stars(c, t, { n: 190, color: 'rgba(206,236,222,.42)', seed: 4, alpha: .8 });
  const mx = 1380, my = 250, mr = 78;
  FILM.glow(c, mx, my, mr * 4.2, '#cfe8d2', .30);
  c.fillStyle = '#eef4e4'; c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
  c.fillStyle = 'rgba(150,180,160,.20)'; c.beginPath(); c.arc(mx - 22, my - 14, 24, 0, 7); c.fill();
  c.beginPath(); c.arc(mx + 28, my + 16, 16, 0, 7); c.fill();
  FILM.clouds(c, t * .4, { y: 260, n: 5, color: 'rgba(120,152,138,.07)', scale: 2.6, seed: 9 });
  c.fillStyle = '#0a1a17';
  c.beginPath(); c.moveTo(0, 660); c.bezierCurveTo(360, 600, 620, 640, 960, 600);
  c.bezierCurveTo(1320, 566, 1620, 618, 1920, 588); c.lineTo(1920, 1080); c.lineTo(0, 1080); c.fill();
  c.fillStyle = '#0f231d';
  c.beginPath(); c.moveTo(0, 740); c.bezierCurveTo(420, 690, 760, 716, 1140, 690);
  c.bezierCurveTo(1480, 668, 1700, 700, 1920, 680); c.lineTo(1920, 1080); c.lineTo(0, 1080); c.fill();
  const grd = c.createLinearGradient(0, 780, 0, 1080);
  grd.addColorStop(0, '#265444'); grd.addColorStop(.5, '#2f6a55'); grd.addColorStop(1, '#143026');
  c.fillStyle = grd; c.fillRect(0, 780, W, 300);
  const g2 = rng('grass');
  for (let i = 0; i < 220; i++) {
    const gx = g2() * W, gy = 800 + g2() * 240, gh = 18 + g2() * 60;
    grass(c, gx, gy, gh, Math.sin(t * 1.1 + gx * .02) * (6 + g2() * 12), g2() > .5 ? '#2a5c46' : '#1d4636', .55 + g2() * .35);
  }
  FILM.mist(c, 900, 880, 1100, 120, '#9fc6b0', .11);
}

function firefly(c, f, t) {
  const prog = soft((t - 7.0) / 2.6);
  const x = f.x + Math.sin(t * f.sp * .8 + f.ph) * 42 + prog * (Math.sin(f.ph) * 120);
  const y = f.y + Math.cos(t * f.sp * .6 + f.ph * 1.3) * 30 - prog * (240 + f.rise * 500);
  const blink = .35 + .65 * Math.max(0, Math.sin(t * (1.4 + f.sp) + f.bl));
  const rad = 4 + f.z * 3.4;
  FILM.glow(c, x, y, rad * 7, '#d8f79a', .20 * blink * f.z);
  FILM.glow(c, x, y, rad * 2.2, '#eeffc0', .55 * blink);
  c.fillStyle = `rgba(255,255,214,${.75 * blink})`;
  c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#050b09');
  const camZ = 1.0 + soft(t / 10) * .10;
  c.save();
  c.translate(960 + soft(t / 10) * 40, 540); c.scale(camZ, camZ); c.translate(-960, -540);
  ground(c, t);
  const lift = soft((t - 4.2) / 1.6);
  const breathe = Math.sin(t * 1.4) * .004;
  FILM.glow(c, 1120, 620, 470, '#b6dcc2', .24);
  FILM.mist(c, 1150, 780, 620, 120, '#c2ddc8', .16);
  c.save(); c.translate(-6, -8);
  FILM.animal(c, {
    x: 1230, y: 1010, h: 400, face: -1, alpha: .42,
    fill: 'rgba(198,228,204,1)',
    pose: { head: -0.55 * lift + .10, leg: 0, body: breathe },
  });
  c.restore();
  FILM.animal(c, {
    x: 1230, y: 1010, h: 400, face: -1,
    fill: '#0a1612',
    pose: { head: -0.55 * lift + .10, leg: 0, body: breathe },
  });
  for (const f of FLY) firefly(c, f, t);
  const near = soft((t - 2.6) / 1.4);
  if (near > 0 && t < 6.9) {
    const nx = lerp(500, 640, near), ny = lerp(880, 640, near) + Math.sin(t * 2) * 6;
    FILM.glow(c, nx, ny, 60, '#f2ffc2', .40);
    c.fillStyle = '#ffffe4'; c.beginPath(); c.arc(nx, ny, 9, 0, 7); c.fill();
  }
  c.restore();
  const riv = soft((t - 8.2) / 1.7);
  if (riv > 0) {
    for (let i = 0; i < 40; i++) {
      const x = 700 + (i % 20) * 46 + Math.sin(t * 2 + i) * 20;
      const y = 980 - ((t - 8.2) * 320 + i * 24) % 900;
      const a = riv * .85 * (1 - (y / 1080) * .3);
      FILM.glow(c, x, y, 26, '#dcff9e', a * .5);
      c.fillStyle = `rgba(250,255,210,${a})`; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill();
    }
  }
  FILM.grain(c, .16, 11);
  FILM.vignette(c, { inner: .34, outer: .95, a: .62 });
  if (t > 9.1) {
    const k = soft((t - 9.1) / .6);
    c.save(); c.globalAlpha = k * .8;
    FILM.text(c, 'ONE SUMMER NIGHT', { x: 1840, y: 1000, align: 'right', size: 22, color: 'rgba(232,244,232,.8)', weight: 500, tracking: 5 });
    c.restore();
  }
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });



