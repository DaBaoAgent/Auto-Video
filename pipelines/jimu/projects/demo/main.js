// jimu · 积木 · 火箭
// 奶油色的房间，一地木头积木。积木自己滑到一起，摞成一支火箭，然后点火。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng, mix } = FILM;
const W = 1920, H = 1080;
const GX = 960, GY = 800;       // 火箭落脚点
const r = rng('jimu');

const WOOD = ['#e8b473', '#d98f52', '#f0cf9a', '#c9803f', '#ecd2a8', '#b96b38'];
const LETTERS = 'ABCXYZ0123⭐'.split('');

// 伪立体木块：正面 + 顶面 + 右侧面
function block(c, x, y, s, rot, col, letter, glow) {
  c.save();
  c.translate(x, y); c.rotate(rot);
  const d = s * .26;
  // 影子
  c.fillStyle = 'rgba(70,40,20,.16)';
  c.beginPath(); c.ellipse(2, s * .58, s * .62, s * .16, 0, 0, 7); c.fill();
  // 右侧面
  c.fillStyle = mix(col, '#5a3418', .42);
  c.beginPath(); c.moveTo(s / 2, -s / 2 + d * .5); c.lineTo(s / 2 + d, -s / 2 - d * .35); c.lineTo(s / 2 + d, s / 2 - d * 1.1); c.lineTo(s / 2, s / 2); c.closePath(); c.fill();
  // 顶面
  c.fillStyle = mix(col, '#fff4dd', .34);
  c.beginPath(); c.moveTo(-s / 2, -s / 2); c.lineTo(s / 2, -s / 2); c.lineTo(s / 2 + d, -s / 2 - d * .85); c.lineTo(-s / 2 + d, -s / 2 - d * .85); c.closePath(); c.fill();
  // 正面
  const g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
  g.addColorStop(0, mix(col, '#fff', .12)); g.addColorStop(1, mix(col, '#4a2a12', .12));
  c.fillStyle = g;
  c.fillRect(-s / 2, -s / 2, s, s);
  // 木纹
  c.strokeStyle = 'rgba(90,50,20,.10)'; c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const yy = -s / 2 + s * (.25 + i * .25);
    c.beginPath(); c.moveTo(-s / 2 + 4, yy); c.bezierCurveTo(-s * .1, yy - 3, s * .1, yy + 3, s / 2 - 4, yy); c.stroke();
  }
  // 描边
  c.strokeStyle = 'rgba(90,50,20,.28)'; c.lineWidth = 2; c.strokeRect(-s / 2, -s / 2, s, s);
  c.strokeStyle = 'rgba(255,248,232,.6)'; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(-s / 2 + 2, s / 2 - 2); c.lineTo(-s / 2 + 2, -s / 2 + 2); c.stroke();
  // 印字
  if (letter) {
    c.save();
    c.globalAlpha = .55;
    FILM.text(c, letter, { x: 0, y: s * .16, size: s * .52, align: 'center', color: 'rgba(70,40,18,.95)', weight: 700 });
    c.restore();
  }
  if (glow) {
    c.save(); c.globalCompositeOperation = 'lighter';
    FILM.glow(c, 0, 0, s * .9, '#ffd9a0', glow);
    c.restore();
  }
  c.restore();
}

// 组装目标：一支 6 块高的火箭（含锥头与两片尾翼），单位 = 1 块
const BODY = [
  { c: 0, y: 0 }, { c: 0, y: -1 }, { c: 0, y: -2 },
  { c: -1, y: -1 }, { c: 1, y: -1 },
];
const NOSE = { c: 0, y: -3 };

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#2a2018');
  // 屋内墙面与暖光
  const wall = c.createLinearGradient(0, 0, 0, GY + 120);
  wall.addColorStop(0, '#f6e2c2'); wall.addColorStop(.55, '#efd3ad'); wall.addColorStop(1, '#e0bb92');
  c.fillStyle = wall; c.fillRect(0, 0, W, GY + 140);
  // 窗光
  c.save();
  c.globalCompositeOperation = 'lighter';
  const lg = c.createRadialGradient(300, 120, 40, 420, 320, 780);
  lg.addColorStop(0, 'rgba(255,246,222,.20)'); lg.addColorStop(.45, 'rgba(255,238,200,.07)'); lg.addColorStop(1, 'rgba(255,240,205,0)');
  c.fillStyle = lg; c.fillRect(0, 0, W, GY + 140);
  c.restore();  // 木地板
  const fl = c.createLinearGradient(0, GY, 0, H);
  fl.addColorStop(0, '#c99566'); fl.addColorStop(1, '#8d5f3b');
  c.fillStyle = fl; c.fillRect(0, GY + 20, W, H - GY - 20);
  // 地板条
  c.strokeStyle = 'rgba(90,55,28,.22)'; c.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const y = GY + 40 + i * 44;
    c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
  }
  for (let i = 0; i < 8; i++) {
    const x = i * 260 + 60;
    c.beginPath(); c.moveTo(x, GY + 40); c.lineTo(x - 40, H); c.stroke();
  }

  // 散落的积木
  const SCAT = [];
  for (let i = 0; i < 14; i++) {
    SCAT.push({ x: 240 + r() * 1440, y: GY + 110 + r() * 160, s: 64 + r() * 40, rot: (r() - .5) * 1.1, col: WOOD[(r() * WOOD.length) | 0], lt: LETTERS[(r() * LETTERS.length) | 0] });
  }

  // 组装：2×3 的箭身、一块尖顶、两片斜尾翼
  const lift = soft((t - 7.2) / 2.4);
  const S = 96;
  const baseY = GY - 20;
  const blocks = [];
  const rows = [[-.5, 0], [.5, 0], [-.5, -1], [.5, -1], [-.5, -2], [.5, -2], [0, -3]];

  rows.forEach(([cx2, cy2], i) => {
    const k = soft((t - 1.3 - i * .28) / .9);
    const src = SCAT[i];
    const tx = GX + cx2 * S, ty = baseY + cy2 * S - lift * 320;
    blocks.push({
      x: lerp(src.x, tx, k), y: lerp(src.y, ty, k),
      s: lerp(src.s, S, k), rot: lerp(src.rot, 0, k), col: src.col, lt: k > .55 ? '' : src.lt, glow: k > .92 ? .05 : 0,
    });
  });

  // 两片尾翼
  [[-1.12, .34, -.42], [1.12, .34, .42]].forEach(([cx2, cy2, rot], i) => {
    const k = soft((t - 3.4 - i * .25) / 1.0);
    const src = SCAT[8 + i];
    blocks.push({
      x: lerp(src.x, GX + cx2 * S, k), y: lerp(src.y, baseY + cy2 * S - lift * 320, k),
      s: lerp(src.s, S * .86, k), rot: lerp(src.rot, rot, k), col: '#d98f52', lt: '', glow: k > .9 ? .04 : 0,
    });
  });

  // 尖顶（三角形木块）
  const kn = soft((t - 4.1) / 1.0);
  const srcN = SCAT[10];
  const noseX = lerp(srcN.x, GX, kn), noseY = lerp(srcN.y, baseY - 3 * S - lift * 320, kn);
  const noseS = lerp(srcN.s, S, kn);

  // 地上的剩块
  SCAT.slice(10).forEach((p, i) => {
    const k = soft((t - 2.6 - i * .2) / 1.0) * .4;
    block(c, p.x - k * 26 * (i % 2 ? 1 : -1), p.y, p.s, p.rot * (1 - k * .15), p.col, p.lt, 0);
  });
  // 火箭影子
  const sh = 1 - lift * .55;
  c.fillStyle = 'rgba(70,42,18,.22)';
  c.beginPath(); c.ellipse(GX, baseY + S * .95, S * 1.9 * sh, S * .34 * sh, 0, 0, 7); c.fill();

  // 尾焰
  const flame = soft((t - 6.2) / .8);
  if (flame > 0) {
    const fy = baseY + S * .5 - lift * 320, fl = (170 + 80 * Math.sin(t * 18)) * flame;
    c.save();
    [[1, .62, 'rgba(255,104,34,.95)'], [.58, .84, 'rgba(255,172,64,.92)'], [.26, .58, 'rgba(255,246,212,.95)']].forEach(([wk, lk, col]) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(GX, fy - 6);
      c.quadraticCurveTo(GX - S * .42 * wk, fy + fl * lk * .34, GX - S * .40 * wk, fy + fl * lk * .72);
      c.quadraticCurveTo(GX - S * .2 * wk, fy + fl * lk, GX, fy + fl * lk * .92);
      c.quadraticCurveTo(GX + S * .2 * wk, fy + fl * lk, GX + S * .40 * wk, fy + fl * lk * .72);
      c.quadraticCurveTo(GX + S * .42 * wk, fy + fl * lk * .34, GX, fy - 6);
      c.closePath(); c.fill();
    });
    FILM.glow(c, GX, fy + 60, 260 * flame, '#ffb45e', .18);
    c.restore();
  }

  blocks.forEach(b => block(c, b.x, b.y, b.s, b.rot, b.col, b.lt, b.glow));
  // 尖顶楔形
  (function(){
    c.save(); c.translate(noseX, noseY);
    const s = noseS;
    c.fillStyle = 'rgba(70,40,18,.16)'; c.beginPath(); c.ellipse(0, s * .3, s * .5, s * .12, 0, 0, 7); c.fill();
    c.fillStyle = '#f5dfb4';
    c.beginPath(); c.moveTo(-s * .5, s * .1); c.lineTo(s * .5, s * .1); c.lineTo(0, -s * .8); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,250,232,.75)';
    c.beginPath(); c.moveTo(-s * .5, s * .1); c.lineTo(0, -s * .8); c.lineTo(-s * .12, -s * .8); c.lineTo(-s * .34, s * .1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,50,20,.3)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-s * .5, s * .1); c.lineTo(s * .5, s * .1); c.lineTo(0, -s * .8); c.closePath(); c.stroke();
    c.restore();
  })();

  // 倒计时数字（粉笔感）
  const cd = soft((t - 4.4) / .5) - soft((t - 6.2) / .5);
  if (cd > 0) {
    const n = t < 5.2 ? '3' : t < 5.9 ? '2' : '1';
    c.save(); c.globalAlpha = cd * .9;
    FILM.text(c, n, { x: 1420, y: 330, size: 220, align: 'center', color: 'rgba(255,248,226,.85)', weight: 700 });
    c.restore();
  }

  // 上升时的速度线与浮尘
  if (lift > 0) {
    c.save(); c.globalAlpha = lift * .5;
    c.strokeStyle = 'rgba(255,245,225,.5)'; c.lineWidth = 3;
    for (let i = 0; i < 14; i++) {
      const x = 620 + i * 60, y0 = 300 + (i % 5) * 90 + t * 40;
      c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y0 + 60 + lift * 120); c.stroke();
    }
    c.restore();
  }

  FILM.vignette(c, { inner: .5, outer: 1, a: .34 });
  FILM.grain(c, .05, 12);
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });








