// wangdian · 网点（深色纸上的半调网点）
// 雨夜的街角：路灯把人影和伞照出一圈网点光晕，公交车的车头灯在雨里化成一排网点光斑。
// 全片只有网点、纯黑与几层灰；靠网点的大小与疏密区分远近。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:wangdian:v3' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;
const BG = '#0a0a0b';

function tile(color, cell, rad) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = cell;
  const g = cv.getContext('2d');
  g.fillStyle = color;
  g.beginPath(); g.arc(cell / 2, cell / 2, rad, 0, TAU); g.fill();
  return cv;
}
function pat(color, cell, rad) { return ctx.createPattern(tile(color, cell, rad), 'repeat'); }
const P = {
  warmA: pat('rgba(255,178,74,0.95)', 20, 8.6),
  warmB: pat('rgba(255,186,92,0.9)', 12, 5.0),
  warmC: pat('rgba(255,214,150,0.9)', 7, 2.4),
  coldA: pat('rgba(96,206,236,0.9)', 18, 7.0),
  coldB: pat('rgba(120,214,240,0.85)', 10, 4.0),
  greyA: pat('rgba(150,158,170,0.7)', 16, 5.6),
  greyB: pat('rgba(178,186,198,0.7)', 8, 2.6),
  wet: pat('rgba(120,170,210,0.55)', 9, 3.0),
};

const ROAD_Y = 742;
const LAMP = { x: 596, y: 250 };
const PERSON = { x: 726, y: 902 };
const BUS = { x: 992, w: 760, h: 300, y: 640 };

// 远景楼群（左右各一片，中间留出街口）
const BLOCKS = (() => {
  const r = S.rng('wd:blk'), out = [];
  let x = -80;
  while (x < W + 60) {
    const w = 110 + r() * 180, h = 260 + r() * 420;
    const gap = x > 620 && x < 1150 ? 1 : 0;   // 中间留街口
    if (!gap) out.push({ x, w, h, seed: r() * 10 });
    x += w + 20 + r() * 40;
  }
  return out;
})();
const RAIN = (() => {
  const r = S.rng('wd:rain'), a = [];
  for (let i = 0; i < 90; i++) a.push({ x: r() * W, y: r() * H, l: 26 + r() * 70, ph: r() * TAU, sp: 0.9 + r() * 0.8 });
  return a;
})();

function poly(pts, fill) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---- 远景：暗楼 + 窗（网点）----
  BLOCKS.forEach((b) => {
    ctx.fillStyle = '#131316';
    ctx.fillRect(b.x, H - b.h, b.w, b.h);
    ctx.fillStyle = P.greyA;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(b.x, H - b.h, b.w, 8);
    for (let y = H - b.h + 34; y < ROAD_Y - 30; y += 44) {
      for (let x = b.x + 16; x < b.x + b.w - 16; x += 34) {
        const on = ((x * 7 + y * 3 + b.seed * 100) | 0) % 5 < 3;
        if (!on) continue;
        ctx.fillStyle = ((x + y) | 0) % 3 === 0 ? P.warmB : P.greyB;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, y, 16, 12);
      }
    }
    ctx.globalAlpha = 1;
  });

  // ---- 街口尽头的路灯与雨幕 ----
  // 路灯杆
  ctx.strokeStyle = '#2a2c31';
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(LAMP.x, ROAD_Y - 10); ctx.lineTo(LAMP.x, LAMP.y); ctx.stroke();
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(LAMP.x, LAMP.y); ctx.quadraticCurveTo(LAMP.x + 90, LAMP.y - 16, LAMP.x + 168, LAMP.y + 26); ctx.stroke();
  // 灯罩
  ctx.fillStyle = '#2a2c31';
  poly([[LAMP.x + 132, LAMP.y + 10], [LAMP.x + 206, LAMP.y + 22], [LAMP.x + 196, LAMP.y + 44], [LAMP.x + 140, LAMP.y + 34]], '#2a2c31');

  // 光锥（网点）
  ctx.save();
  ctx.globalAlpha = 0.75;
  const coneTop = LAMP.y + 34, coneX = LAMP.x + 168;
  ctx.beginPath();
  ctx.moveTo(coneX - 26, coneTop);
  ctx.lineTo(coneX + 26, coneTop);
  ctx.lineTo(coneX + 300, ROAD_Y + 60);
  ctx.lineTo(coneX - 250, ROAD_Y + 60);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = P.warmB;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = P.warmC;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(coneX - 140, coneTop + 40, 300, 460);
  ctx.restore();

  // 灯头亮芯
  ctx.fillStyle = P.warmC;
  ctx.globalAlpha = 0.95;
  ctx.beginPath(); ctx.ellipse(LAMP.x + 172, LAMP.y + 40, 34, 18, 0, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;

  // ---- 地面：湿路（反光竖条 + 网点）----
  const g = ctx.createLinearGradient(0, ROAD_Y, 0, H);
  g.addColorStop(0, 'rgba(28,34,44,0.9)');
  g.addColorStop(1, 'rgba(12,14,18,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, ROAD_Y, W, H - ROAD_Y);
  ctx.fillStyle = P.wet;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 18; i++) {
    const x = (i * 118 + Math.sin(i) * 30) % W;
    ctx.fillRect(x, ROAD_Y + 8, 26 + (i % 3) * 18, H - ROAD_Y - 20);
  }
  ctx.globalAlpha = 1;
  // 路灯光在水里的倒影
  ctx.fillStyle = P.warmB;
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 12; i++) {
    const w = 30 + i * 12 + Math.sin(t * 2 + i) * 10;
    ctx.fillRect(LAMP.x + 150 - w / 2 + Math.sin(t * 1.6 + i) * 8, ROAD_Y + 16 + i * 22, w, 10);
  }
  ctx.globalAlpha = 1;

  // ---- 公交车驶来 ----
  const bx = S.lerp(W + 400, BUS.x, S.ease(S.clamp(t / 6.2)));
  const bobB = Math.sin(t * 6) * 1.6;
  ctx.save();
  ctx.translate(bx, BUS.y + bobB);
  ctx.fillStyle = '#101318';
  // 车身
  poly([[0, 0], [BUS.w, 0], [BUS.w - 26, BUS.h], [26, BUS.h]], '#101318');
  // 车窗（网点，冷色）
  ctx.fillStyle = P.coldB;
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 4; i++) ctx.fillRect(60 + i * 168, 46, 132, 116);
  ctx.globalAlpha = 1;
  // 车头灯
  ctx.fillStyle = P.warmC;
  ctx.beginPath(); ctx.ellipse(24, 196, 26, 22, 0, 0, TAU); ctx.fill();
  // 灯锥
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = P.warmB;
  ctx.beginPath();
  ctx.moveTo(24, 196); ctx.lineTo(-360, 120); ctx.lineTo(-360, 300); ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  // 车轮
  ctx.fillStyle = '#07080a';
  [150, 610].forEach((x) => { ctx.beginPath(); ctx.arc(x, 300, 54, 0, TAU); ctx.fill(); });
  ctx.restore();

  // ---- 人等车（前景剪影，压在车前面）----
  drawPerson(t);

  // ---- 雨丝 ----
  ctx.save();
  ctx.strokeStyle = 'rgba(190,206,222,0.30)';
  ctx.lineWidth = 2;
  RAIN.forEach((d) => {
    const y = (d.y + t * 460 * d.sp) % (H + 120) - 60;
    const x = d.x + Math.sin(t * 0.5 + d.ph) * 6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 12, y + d.l); ctx.stroke();
  });
  ctx.restore();

  // ---- 收束 ----
  const vg = ctx.createRadialGradient(W * 0.46, H * 0.42, H * 0.24, W * 0.46, H * 0.42, H * 1.0);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // 极暗网格底纹，读成印在深色纸上的网点
  ctx.fillStyle = P.greyB;
  ctx.globalAlpha = 0.06;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
};

// 撑伞的人：纯黑剪影 + 一圈暖色网点轮廓，别让他在黑车身上糊掉
function drawPerson(t) {
  const bob = Math.sin(t * 1.4) * 2;
  ctx.save();
  ctx.translate(PERSON.x, PERSON.y + bob);
  ctx.scale(1.18, 1.18);
  // 轮廓先描一道网点
  ctx.strokeStyle = 'rgba(255,196,110,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-118, -244); ctx.quadraticCurveTo(0, -336, 118, -244);
  ctx.stroke();
  // 伞面
  ctx.fillStyle = '#08090b';
  ctx.beginPath();
  ctx.moveTo(-118, -244); ctx.quadraticCurveTo(0, -336, 118, -244);
  ctx.lineTo(112, -236); ctx.quadraticCurveTo(0, -318, -112, -236);
  ctx.closePath(); ctx.fill();
  // 伞柄
  ctx.strokeStyle = '#08090b';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(0, -300); ctx.lineTo(0, -178); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,196,110,0.45)';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -300);
    ctx.quadraticCurveTo(i * 54, -300 + Math.abs(i) * 10, i * 108, -244 - Math.abs(i) * 4);
    ctx.stroke();
  }
  // 身体
  ctx.fillStyle = '#08090b';
  poly([[-30, -196], [28, -196], [40, -6], [-40, -6]], '#08090b');
  ctx.beginPath(); ctx.arc(0, -216, 26, 0, TAU); ctx.fill();
  // 腿
  poly([[-40, -6], [-8, -6], [-4, 88], [-34, 88]], '#08090b');
  poly([[6, -6], [40, -6], [44, 88], [14, 88]], '#08090b');
  // 轮廓光：右侧一条暖边
  ctx.strokeStyle = 'rgba(255,190,100,0.55)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(28, -196); ctx.lineTo(40, -6); ctx.lineTo(44, 88);
  ctx.moveTo(0, -242); ctx.quadraticCurveTo(60, -300, 118, -244);
  ctx.stroke();
  ctx.restore();
}

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});


