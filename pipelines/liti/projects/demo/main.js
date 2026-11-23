// liti · 立体书 · 一页一世界
// 桌上一本摊开的立体书，纸做的城市从书缝里站起来。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng, mix } = FILM;
const W = 1920, H = 1080;

const CX = 960;         // 书缝
const SEAM_TOP = 470, SEAM_BOT = 900;

function page(c, side) {
  // 左页 / 右页：透视四边形
  const x0 = side < 0 ? 120 : 1920 - 120;
  const x1 = side < 0 ? CX - 14 : CX + 14;
  const g = side < 0
    ? c.createLinearGradient(x0, 0, x1, 0)
    : c.createLinearGradient(x1, 0, x0, 0);
  g.addColorStop(0, '#efe4cd'); g.addColorStop(.7, '#f6eed8'); g.addColorStop(1, '#e2d3b8');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x1, SEAM_TOP + 24);
  c.lineTo(x0, SEAM_TOP - 26);
  c.lineTo(x0 - 40, H + 30);
  c.lineTo(x1, SEAM_BOT + 40);
  c.closePath(); c.fill();
  // 页边厚度
  c.fillStyle = '#d6c4a6';
  c.beginPath();
  c.moveTo(x0, SEAM_TOP - 26); c.lineTo(x0 - 40, H + 30); c.lineTo(x0 - 54, H + 30); c.lineTo(x0 - 14, SEAM_TOP - 26);
  c.closePath(); c.fill();
  // 印刷的淡色草图
  c.save();
  c.globalAlpha = .22;
  for (let i = 0; i < 5; i++) {
    const yy = SEAM_TOP + 60 + i * 90;
    const lg = side < 0 ? c.createLinearGradient(x0 + 40, 0, x1, 0) : c.createLinearGradient(x1, 0, x0 - 40, 0);
    lg.addColorStop(0, 'rgba(150,120,80,0)'); lg.addColorStop(1, 'rgba(150,120,80,.5)');
    c.strokeStyle = lg; c.lineWidth = 2;
    c.beginPath(); c.moveTo(lerp(x0, x1, .1), yy); c.lineTo(lerp(x0, x1, .95), yy + 6); c.stroke();
  }
  c.restore();
}

// 一个立起来的纸建筑：底边在 (x,y)，宽 w 高 h
function paperBuilding(c, x, y, w, h, k, col, face, delay) {
  if (k <= 0) return;
  const kk = FILM.easeOutBack(clamp(k));
  c.save();
  c.translate(x, y);
  const hh = h * kk;
  // 折痕阴影（底部）
  c.fillStyle = 'rgba(90,60,30,.18)';
  c.beginPath(); c.ellipse(0, 0, w * .9, w * .16, 0, 0, 7); c.fill();
  // 背面板（纸厚）
  c.fillStyle = mix(col, '#8a6a44', .28);
  c.beginPath();
  c.moveTo(-w / 2, 0); c.lineTo(-w / 2 - 10, -hh * .28); c.lineTo(-w / 2 - 10, -hh); c.lineTo(-w / 2, -hh * .72);
  c.closePath(); c.fill();
  // 正面
  const g = c.createLinearGradient(-w / 2, -hh, w / 2, 0);
  g.addColorStop(0, mix(col, '#ffffff', .35)); g.addColorStop(1, mix(col, '#7a5a34', .18));
  c.fillStyle = g;
  c.fillRect(-w / 2, -hh, w, hh);
  // 窗
  c.fillStyle = 'rgba(70,58,40,.55)';
  const rows = Math.max(1, Math.round(hh / 46)), cols = Math.max(1, Math.round(w / 34));
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
    const ww2 = w / cols * .5, wh2 = hh / rows * .42;
    c.fillRect(-w / 2 + (j + .25) * w / cols, -hh + (i + .28) * hh / rows, ww2, wh2);
  }
  // 顶饰
  if (face === 'tower') {
    c.fillStyle = mix(col, '#ffffff', .5);
    c.beginPath(); c.moveTo(-w * .1, -hh); c.lineTo(0, -hh - 40 * kk); c.lineTo(w * .1, -hh); c.closePath(); c.fill();
  }
  c.strokeStyle = 'rgba(120,90,50,.35)'; c.lineWidth = 1.5;
  c.strokeRect(-w / 2, -hh, w, hh);
  c.restore();
}

function tree(c, x, y, s, k, col) {
  if (k <= 0) return;
  const kk = FILM.easeOutBack(clamp(k));
  c.save(); c.translate(x, y);
  c.strokeStyle = 'rgba(110,80,44,.8)'; c.lineWidth = 3 * kk;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * .5 * kk); c.stroke();
  c.fillStyle = col;
  for (let i = 0; i < 3; i++) {
    const yy = -s * .5 * kk - i * s * .28 * kk, ww = s * (.62 - i * .14);
    c.beginPath(); c.moveTo(-ww, yy); c.lineTo(ww, yy); c.lineTo(0, yy - s * .42 * kk); c.closePath(); c.fill();
  }
  c.restore();
}

function crane(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = '#f8f1df';
  c.beginPath();
  c.moveTo(-70, 0); c.lineTo(-10, -18); c.lineTo(24, 6); c.lineTo(-14, 16); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-10, -18); c.lineTo(26, -46); c.lineTo(30, -20); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-70, 0); c.lineTo(-104, -30); c.lineTo(-86, 2); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(150,120,80,.35)'; c.lineWidth = 1.5; c.stroke();
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#2b2118');
  // 桌面
  const tb = c.createLinearGradient(0, 240, 0, H);
  tb.addColorStop(0, '#6d4b32'); tb.addColorStop(.45, '#54371f'); tb.addColorStop(1, '#33200f');
  c.fillStyle = tb; c.fillRect(0, 0, W, H);
  // 木纹
  c.strokeStyle = 'rgba(255,220,170,.05)'; c.lineWidth = 2;
  const rr = rng('grain');
  for (let i = 0; i < 40; i++) {
    const y = 260 + rr() * 820;
    c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(600, y + rr() * 20, 1300, y - rr() * 20, W, y + rr() * 14); c.stroke();
  }
  // 顶光
  const lg = c.createRadialGradient(960, 120, 60, 960, 420, 1100);
  lg.addColorStop(0, 'rgba(255,236,196,.30)'); lg.addColorStop(1, 'rgba(255,236,196,0)');
  c.fillStyle = lg; c.fillRect(0, 0, W, H);

  // 书影
  c.fillStyle = 'rgba(20,10,4,.45)';
  c.beginPath(); c.ellipse(960, 960, 860, 130, 0, 0, 7); c.fill();

  // 书页
  page(c, -1); page(c, 1);

  // 书缝
  const sg = c.createLinearGradient(CX - 40, 0, CX + 40, 0);
  sg.addColorStop(0, 'rgba(120,90,55,.35)'); sg.addColorStop(.5, 'rgba(70,48,26,.55)'); sg.addColorStop(1, 'rgba(120,90,55,.35)');
  c.fillStyle = sg;
  c.beginPath(); c.moveTo(CX - 16, SEAM_TOP + 30); c.lineTo(CX + 16, SEAM_TOP + 30); c.lineTo(CX + 20, SEAM_BOT + 60); c.lineTo(CX - 20, SEAM_BOT + 60); c.closePath(); c.fill();

  // 立体城市：两页各一侧，越靠缝越小（透视）
  const rise = .0;
  const items = [
    // 右页（近端）
    { k: 'A', delay: 1.1, x: 1460, y: 860, w: 210, h: 330, col: '#efd9b6', face: 'block' },
    { k: 'B', delay: 1.35, x: 1700, y: 820, w: 150, h: 230, col: '#dbe6d8', face: 'block' },
    { k: 'C', delay: 1.6, x: 1240, y: 800, w: 130, h: 420, col: '#e9d7e4', face: 'tower' },
    { k: 'D', delay: 1.85, x: 1560, y: 740, w: 110, h: 190, col: '#f0e1c2', face: 'block' },
    { k: 'E', delay: 2.1, x: 1080, y: 770, w: 120, h: 300, col: '#dce9ec', face: 'block' },
    // 左页
    { k: 'F', delay: 2.35, x: 560, y: 830, w: 190, h: 260, col: '#efdfc0', face: 'block' },
    { k: 'G', delay: 2.6, x: 330, y: 790, w: 150, h: 380, col: '#e4e0cc', face: 'tower' },
    { k: 'H', delay: 2.85, x: 760, y: 760, w: 120, h: 210, col: '#f2e6d2', face: 'block' },
  ];

  // 纸云、纸太阳
  const skyK = soft((t - 3.0) / 1.0);
  if (skyK > 0) {
    c.save(); c.globalAlpha = skyK;
    // 太阳：纸盘
    c.fillStyle = '#f7d774';
    c.beginPath(); c.arc(960, 300, 70 * skyK, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.5)';
    c.beginPath(); c.arc(940, 280, 22, 0, 7); c.fill();
    // 云
    [[720, 250, 1], [1180, 220, .8], [1340, 320, .5]].forEach(([x, y, s]) => {
      c.fillStyle = '#f6f0e2';
      c.beginPath();
      c.ellipse(x, y, 90 * s * skyK, 30 * s * skyK, 0, 0, 7);
      c.ellipse(x - 50 * s, y + 8, 48 * s * skyK, 24 * s * skyK, 0, 0, 7);
      c.ellipse(x + 54 * s, y + 10, 44 * s * skyK, 22 * s * skyK, 0, 0, 7);
      c.fill();
    });
    c.restore();
  }

  items.forEach(it => {
    const k = clamp((t - it.delay) / 1.0);
    paperBuilding(c, it.x, it.y, it.w, it.h, k, it.col, it.face);
  });
  // 树
  [[1180, 830, 90], [860, 860, 74], [1460, 760, 62], [400, 860, 84]].forEach(([x, y, s], i) => {
    tree(c, x, y, s, clamp((t - 2.9 - i * .18) / .9), '#7fa86a');
  });

  // 纸车 / 纸灯
  const carK = soft((t - 4.8) / 1.0);
  if (carK > 0) {
    const cxx = lerp(1060, 1640, soft((t - 4.8) / 4.4));
    c.save(); c.globalAlpha = carK;
    c.fillStyle = '#e2a24b';
    c.fill(FILM.rect(cxx, 872, 56, 22, 5));
    c.fillStyle = '#cfd8d2'; c.fill(FILM.rect(cxx + 12, 858, 30, 16, 4));
    c.fillStyle = '#3c3328';
    c.beginPath(); c.arc(cxx + 13, 896, 7, 0, 7); c.fill();
    c.beginPath(); c.arc(cxx + 44, 896, 7, 0, 7); c.fill();
    c.restore();
  }

  // 结尾：纸鹤飞起 + 字样
  const cr = soft((t - 6.6) / 2.2);
  if (cr > 0) {
    const cxx = lerp(1500, 620, cr), cyy = lerp(700, 170, cr) + Math.sin(t * 2) * 12;
    crane(c, cxx, cyy, 1 + cr * .5, -cr * .35 + Math.sin(t * 1.6) * .08);
  }
  const tt = soft((t - 8.0) / 1.2);
  if (tt > 0) {
    c.save(); c.globalAlpha = tt;
    FILM.text(c, '翻开这一页', { x: 960, y: 1012, size: 44, align: 'center', color: 'rgba(255,246,230,.92)', weight: 600, tracking: 10 });
    c.restore();
  }

  FILM.vignette(c, { inner: .48, outer: 1, a: .45 });
  FILM.grain(c, .05, 21);
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });

