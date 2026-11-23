// dianzhen · 点阵 · 1966 年的月面传真
// 一台传真机把月球正面的照片一行一行打出来。纸上只有黑白两种点，
// 但那就是人类第一次看清另一颗星球的地表。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;

// 先把“月面”画进一张离屏图，再按点阵阈值打印出来
const SRC = 512;
const moon = document.createElement('canvas'); moon.width = SRC; moon.height = SRC;
const mctx = moon.getContext('2d');
(function paintMoon() {
  const r = rng('moonprint');
  const g = mctx.createRadialGradient(SRC * .42, SRC * .40, 40, SRC * .62, SRC * .55, SRC * .72);
  g.addColorStop(0, '#8a8478'); g.addColorStop(.6, '#5d584f'); g.addColorStop(1, '#2a2723');
  mctx.fillStyle = g; mctx.fillRect(0, 0, SRC, SRC);
  // 月海
  mctx.fillStyle = 'rgba(20,20,18,.62)';
  [[.36, .42, 88], [.52, .33, 62], [.63, .48, 96], [.30, .62, 56], [.55, .68, 70], [.72, .30, 44]].forEach(([x, y, rr]) => {
    mctx.beginPath(); mctx.ellipse(x * SRC, y * SRC, rr * 1.35, rr, .4, 0, 7); mctx.fill();
  });
  // 环形山
  for (let i = 0; i < 26; i++) {
    const x = r() * SRC, y = r() * SRC, rr = 3 + r() * 16;
    mctx.strokeStyle = 'rgba(240,236,224,.30)'; mctx.lineWidth = 2;
    mctx.beginPath(); mctx.arc(x, y, rr, 0, 7); mctx.stroke();
    mctx.fillStyle = 'rgba(10,10,10,.45)';
    mctx.beginPath(); mctx.arc(x + rr * .2, y + rr * .2, rr * .8, 0, 7); mctx.fill();
  }
  // 边缘的明暗交界
  const term = mctx.createLinearGradient(SRC * .30, 0, SRC * .95, SRC * .85);
  term.addColorStop(0, 'rgba(0,0,0,0)'); term.addColorStop(1, 'rgba(0,0,0,.55)');
  mctx.fillStyle = term; mctx.fillRect(0, 0, SRC, SRC);
})();

// 1-bit 点阵：按阈值逐块打印
function printMoon(c, x, y, w, h, prog) {
  const cell = 4;
  const cols = Math.floor(w / cell), rowsN = Math.floor(h / cell);
  const data = mctx.getImageData(0, 0, SRC, SRC).data;
  const maxRow = Math.floor(rowsN * clamp(prog));
  c.fillStyle = '#1b1a17';
  for (let j = 0; j < maxRow; j++) {
    for (let i = 0; i < cols; i++) {
      const sx = Math.floor(i / cols * SRC), sy = Math.floor(j / rowsN * SRC);
      const p = (sy * SRC + sx) * 4;
      const lum = (data[p] * .3 + data[p + 1] * .6 + data[p + 2] * .1) / 255;
      const thr = .30 + (FILM.hash(i * 31 + j * 97) - .5) * .08;
      if (lum > thr) c.fillRect(x + i * cell, y + j * cell, cell - .6, cell - .6);
    }
  }
  // 正在打印的那一行
  if (prog < 1) {
    c.fillStyle = 'rgba(60,56,48,.35)';
    c.fillRect(x, y + maxRow * cell, w, 2);
  }
}

function room(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2b2a26'); g.addColorStop(.55, '#3a3730'); g.addColorStop(1, '#1d1c19');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // 墙上的影子与窗
  c.fillStyle = 'rgba(12,12,10,.55)'; c.fillRect(0, 0, 420, H);
  c.fillStyle = '#101310'; c.fillRect(40, 90, 320, 420);
  c.strokeStyle = 'rgba(220,214,190,.18)'; c.lineWidth = 6;
  c.strokeRect(40, 90, 320, 420);
  c.strokeRect(196, 90, 6, 420); c.strokeRect(40, 290, 320, 6);
  // 窗外的夜色
  c.fillStyle = '#0b1118'; c.fillRect(46, 96, 308, 408);
  FILM.stars(c, t, { n: 60, color: 'rgba(220,225,235,.5)', seed: 7, alpha: .6 });
  // 桌面
  const tb = c.createLinearGradient(0, 780, 0, H);
  tb.addColorStop(0, '#4a4238'); tb.addColorStop(1, '#241f1a');
  c.fillStyle = tb; c.fillRect(0, 780, W, 300);
  c.fillStyle = 'rgba(255,240,210,.10)'; c.fillRect(0, 780, W, 4);
}

function faxMachine(c, t) {
  const x = 250, y = 470, w = 620, h = 340;
  c.save();
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.shadowOffsetY = 20;
  // 机身
  const body = c.createLinearGradient(x, y, x, y + h);
  body.addColorStop(0, '#cfc7b4'); body.addColorStop(.5, '#a9a290'); body.addColorStop(1, '#7d7768');
  c.fillStyle = body;
  c.beginPath(); c.roundRect(x, y, w, h, 18); c.fill();
  c.restore();
  // 上盖与出纸口
  c.fillStyle = '#8e8676';
  c.beginPath(); c.roundRect(x + 24, y - 26, w - 48, 60, 12); c.fill();
  c.fillStyle = '#14120f';
  c.beginPath(); c.roundRect(x + 40, y - 8, w - 80, 14, 4); c.fill();
  // 按键
  for (let j = 0; j < 4; j++) for (let i = 0; i < 9; i++) {
    c.fillStyle = (i + j) % 3 === 0 ? '#5f594c' : '#3f3a32';
    c.beginPath(); c.roundRect(x + 44 + i * 44, y + 200 + j * 34, 34, 24, 5); c.fill();
    c.fillStyle = 'rgba(255,248,225,.45)';
    c.font = '600 12px ui-monospace, monospace'; c.fillText(String(i + 1 + j * 9), x + 52 + i * 44, y + 217 + j * 34);
  }
  // 听筒
  c.strokeStyle = '#37332b'; c.lineWidth = 14; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x + 84, y + 40); c.quadraticCurveTo(x + 160, y + 6, x + 236, y + 40); c.stroke();
  c.fillStyle = '#4a453b';
  c.beginPath(); c.roundRect(x + 60, y + 20, 44, 74, 16); c.fill();
  c.beginPath(); c.roundRect(x + 220, y + 20, 44, 74, 16); c.fill();
  // 指示灯
  const blink = .5 + .5 * Math.sin(t * 3.2);
  FILM.glow(c, x + w - 60, y + 40, 26, '#ff5a3a', .35 * blink);
  c.fillStyle = `rgba(255,90,58,${.5 + .4 * blink})`;
  c.beginPath(); c.arc(x + w - 60, y + 40, 6, 0, 7); c.fill();
  // 卷纸
  c.fillStyle = '#ded8c8';
  c.beginPath(); c.roundRect(x + w - 26, y + 20, 30, 120, 8); c.fill();
}

function paper(c, t) {
  // 从机器里吐出来的一张长纸
  const prog = soft((t - 1.2) / 6.2);
  const x = 900, y = 250, w = 560, h = 560;
  c.save();
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.shadowOffsetY = 14;
  c.fillStyle = '#e8e2d2';
  c.beginPath(); c.roundRect(x, y, w, h, 6); c.fill();
  c.restore();
  // 纸的卷边
  c.fillStyle = 'rgba(0,0,0,.10)';
  c.beginPath(); c.roundRect(x, y, w, 10, 4); c.fill();
  // 顶部抬头
  c.fillStyle = '#25231f';
  c.font = '600 20px ui-monospace, monospace';
  c.fillText('LUNAR ORBITER  ·  FRAME 1', x + 28, y + 46);
  c.fillStyle = 'rgba(37,35,31,.55)';
  c.font = '500 15px ui-monospace, monospace';
  c.fillText('NASA · 1966-08-23 · 20:07 UTC', x + 28, y + 70);
  // 点阵图
  printMoon(c, x + 28, y + 92, w - 56, h - 150, prog);
  // 底部的注释
  c.fillStyle = 'rgba(37,35,31,.5)';
  c.font = '500 13px ui-monospace, monospace';
  c.fillText('RECEIVED VIA FAX  ·  1 BIT / 4 MM', x + 28, y + h - 24);
  // 打印头
  if (prog < .98) {
    const hy = y + 92 + (h - 150) * prog;
    c.fillStyle = 'rgba(40,38,32,.85)'; c.fillRect(x + 18, hy - 2, w - 36, 6);
    FILM.glow(c, x + w * .5, hy, 90, '#ffcf8a', .12);
  }
  // 章
  const stamp = soft((t - 7.6) / .5);
  if (stamp > 0) {
    c.save(); c.globalAlpha = stamp * .85;
    c.translate(x + w - 150, y + h - 96); c.rotate(-.12);
    c.strokeStyle = 'rgba(190,58,40,.9)'; c.lineWidth = 4;
    c.strokeRect(-78, -26, 156, 52);
    c.font = '700 20px ui-monospace, monospace';
    c.fillStyle = 'rgba(190,58,40,.9)';
    c.fillText('RECEIVED', -60, 7);
    c.restore();
  }
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#171612');
  const camZ = 1.0 + soft(t / 10) * .07;
  c.save();
  c.translate(960, 560); c.scale(camZ, camZ); c.translate(-960, -560);
  room(c, t);
  faxMachine(c, t);
  paper(c, t);
  // 旋钮的转动  // 灯下的尘
  const r = rng('dx');
  for (let i = 0; i < 50; i++) {
    const px = r() * W, py = 200 + r() * 700;
    c.fillStyle = `rgba(255,236,200,${.05 + r() * .09})`;
    c.beginPath(); c.arc(px + Math.sin(t * .5 + i) * 8, py + Math.cos(t * .4 + i) * 6, 1 + r() * 1.6, 0, 7); c.fill();
  }
  c.restore();
  FILM.grain(c, .20, 81);
  FILM.vignette(c, { inner: .32, outer: .95, a: .60 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });


