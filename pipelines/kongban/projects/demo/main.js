// kongban · 孔版印刷（四色套印 · 渔港收网）
// 四块版依次从左压到右：蓝（天/海/影）、红（船与衣）、黄（日光/木栈桥）、黑（线/网/字）。
// 套色偏 2–3px，网点用 pattern 平铺，单帧绘制几十毫秒，30fps 顶得住。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:kongban:v3' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const PAPER = '#f5f0e6';
const K = '#152647';
const C = '#1c62b8';
const M = '#ee5a43';
const Y = '#efae28';

const SH = { x: 236, y: 96, w: 1448, h: 888 };
const CX = SH.x, CY = SH.y;

// ---------- 网点 ----------
function dotTile(color, cell, rad, rot) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = cell;
  const g = cv.getContext('2d');
  g.translate(cell / 2, cell / 2);
  g.rotate(rot || 0);
  g.fillStyle = color;
  g.beginPath(); g.arc(0, 0, rad, 0, TAU); g.fill();
  return cv;
}
function mkPat(o) { const p = {}; for (const k in o) p[k] = ctx.createPattern(o[k], 'repeat'); return p; }
const PC = mkPat({
  s1: dotTile('rgba(28,98,184,0.86)', 14, 4.0, 0.5),
  s2: dotTile('rgba(28,98,184,0.8)', 11, 3.4, 0.5),
  s3: dotTile('rgba(28,98,184,0.72)', 9, 2.6, 0.5),
  sea: dotTile('rgba(28,98,184,0.9)', 9, 4.6, 0.2),
  seaL: dotTile('rgba(28,98,184,0.6)', 7, 2.2, 0.2),
  dark: dotTile('rgba(21,38,71,0.9)', 8, 3.6, 0.9),
});
const PM = mkPat({ big: dotTile('rgba(238,90,67,0.94)', 12, 5.0, 1.0), mid: dotTile('rgba(238,90,67,0.86)', 12, 3.4, 1.0) });
const PY = mkPat({ glow: dotTile('rgba(239,174,40,0.94)', 11, 4.0, 0.35), soft: dotTile('rgba(239,174,40,0.66)', 8, 2.2, 0.35) });

const GRAIN = (() => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 512;
  const g = cv.getContext('2d'), r = S.rng('kb:g3');
  for (let i = 0; i < 6000; i++) {
    const x = r() * 512, y = r() * 512, s = 0.7 + r() * 1.4;
    g.fillStyle = r() < 0.5 ? 'rgba(96,78,52,0.16)' : 'rgba(255,255,255,0.24)';
    g.fillRect(x, y, s, s);
  }
  return cv;
})();
const GPAT = ctx.createPattern(GRAIN, 'repeat');

// ---------- 构图常量 ----------
const HOR = 470;
const SUN = { x: 706, y: HOR - 4, r: 168 };
const BOAT_A = { x: 962, y: 616, s: 1.0, ph: 0 };
const BOAT_B = { x: 1300, y: 662, s: 0.6, ph: 1.5 };
const PIER = [[0, 742], [566, 668], [604, 700], [0, 888]];
const GULLS = [
  { x: 470, y: 236, s: 1.0, ph: 0.2, spd: 2.6 },
  { x: 566, y: 196, s: 0.8, ph: 1.1, spd: 3.1 },
  { x: 380, y: 288, s: 0.62, ph: 2.0, spd: 2.2 },
  { x: 1180, y: 264, s: 0.86, ph: 3.0, spd: 2.9 },
];

function poly(pts, fill, close) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close !== false) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
function clipSheet() { ctx.beginPath(); ctx.rect(CX, CY, SH.w, SH.h); ctx.clip(); }

// ---------- 渔船 ----------
function boatTransform(b, t) {
  const bob = Math.sin(t * 1.5 + b.ph) * 5.5;
  const roll = Math.sin(t * 1.15 + b.ph) * 0.016;
  return { bob, roll };
}
function drawBoat(b, t, ch) {
  const { bob, roll } = boatTransform(b, t);
  ctx.save();
  ctx.translate(CX + b.x, CY + b.y + bob);
  ctx.scale(b.s, b.s);
  ctx.rotate(roll);
  if (ch === 'M') {
    // 船壳：吃水线以下红
    poly([[-250, -34], [258, -34], [250, -14], [196, 56], [-198, 56], [-250, -14]], M);
  } else if (ch === 'C') {
    // 船底阴影 + 舱罩
    poly([[-198, 56], [196, 56], [162, 84], [-166, 84]], 'rgba(28,98,184,0.75)');
    poly([[-108, -34], [-86, -108], [96, -108], [118, -34]], PC.dark);
    // 甲板上堆的网
    ctx.fillStyle = PC.sea;
    ctx.beginPath(); ctx.ellipse(196, -44, 58, 30, 0.2, 0, TAU); ctx.fill();
  } else if (ch === 'Y') {
    // 舱灯 + 甲板暖光
    const g = ctx.createRadialGradient(-10, -126, 4, -10, -126, 70);
    g.addColorStop(0, 'rgba(239,174,40,0.9)');
    g.addColorStop(1, 'rgba(239,174,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(-10, -126, 70, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(239,174,40,0.95)';
    ctx.beginPath(); ctx.arc(-10, -126, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = PY.soft;
    ctx.fillRect(-250, -34, 500, 18);
  } else if (ch === 'K') {
    ctx.strokeStyle = K; ctx.lineCap = 'round';
    ctx.lineWidth = 4.4;
    // 壳
    ctx.beginPath();
    ctx.moveTo(-258, -34); ctx.lineTo(258, -34); ctx.lineTo(250, -14); ctx.lineTo(196, 56);
    ctx.lineTo(-198, 56); ctx.lineTo(-250, -14); ctx.closePath(); ctx.stroke();
    // 舱
    ctx.beginPath();
    ctx.moveTo(-108, -34); ctx.lineTo(-86, -108); ctx.lineTo(96, -108); ctx.lineTo(118, -34); ctx.stroke();
    // 窗
    ctx.lineWidth = 2.6;
    [-52, 0, 52].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, -86); ctx.lineTo(x, -46); ctx.stroke(); });
    // 桅
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(16, -108); ctx.lineTo(16, -336); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-96, -272); ctx.lineTo(120, -272); ctx.stroke();
    // 帆桁上的缆
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-72 + i * 44, -272);
      ctx.quadraticCurveTo(-66 + i * 44, -214, -60 + i * 44, -166);
      ctx.stroke();
    }
    // 小旗
    ctx.beginPath(); ctx.moveTo(16, -336); ctx.lineTo(64, -324); ctx.lineTo(16, -312); ctx.stroke();
    // 网堆
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(196, -40 + i * 9, 54 - i * 6, 26 - i * 3, 0.2, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- 渔民 ----------
function pullAmt(t) {
  // 三下收网：1.4s / 4.4s / 7.4s 起，各 1.2s
  const d = [1.4, 4.0, 6.8];
  let s = 0;
  d.forEach((t0) => {
    const q = S.clamp((t - t0) / 1.25);
    s += Math.sin(q * Math.PI) * 0.9;
  });
  return s;
}
function drawFisherman(i, t, ch) {
  const base = i === 0 ? [186, 744] : [318, 754];
  const s = i === 0 ? 1.22 : 1.02;
  const pull = pullAmt(t);
  const lean = -0.1 - (i === 0 ? pull : pull * 0.7) * 0.22 + Math.sin(t * 1.8 + i) * 0.018;
  ctx.save();
  ctx.translate(CX + base[0], CY + base[1]);
  ctx.scale(s, s);
  ctx.rotate(lean);
  if (ch === 'M') {
    // 上衣（连袖，一块整色）
    poly([[-30, -150], [30, -150], [56, -96], [50, -70], [-50, -70], [-56, -96]], M);
    // 草帽
    ctx.fillStyle = M;
    ctx.beginPath(); ctx.ellipse(0, -192, 46, 11, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -198, 22, 14, 0, 0, TAU); ctx.fill();
  } else if (ch === 'C') {
    // 裤（一条，做出两腿的缝）
    poly([[-34, -72], [34, -72], [38, -2], [4, -2], [0, -36], [-4, -2], [-38, -2]], 'rgba(28,98,184,0.95)');
    ctx.fillStyle = 'rgba(28,98,184,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 0, 52, 9, 0, 0, TAU); ctx.fill();
  } else if (ch === 'K') {
    ctx.strokeStyle = K; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    // 外轮廓：肩—腰—腿
    ctx.beginPath();
    ctx.moveTo(-30, -150); ctx.lineTo(-34, -72); ctx.lineTo(-38, -2);
    ctx.moveTo(30, -150); ctx.lineTo(34, -72); ctx.lineTo(38, -2);
    ctx.stroke();
    // 头颈
    ctx.beginPath(); ctx.arc(0, -176, 20, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, -156); ctx.lineTo(-8, -150); ctx.moveTo(8, -156); ctx.lineTo(8, -150); ctx.stroke();
    // 帽子沿
    ctx.beginPath(); ctx.ellipse(0, -192, 46, 11, 0, 0, TAU); ctx.stroke();
    // 手臂拉到胸前
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-28, -146); ctx.lineTo(-52, -112); ctx.lineTo(-46, -84);
    ctx.moveTo(28, -146); ctx.lineTo(52, -114); ctx.lineTo(48, -88);
    ctx.stroke();
  }
  ctx.restore();
}
function handPos(i) {
  const base = i === 0 ? [186, 744] : [318, 754];
  const s = i === 0 ? 1.22 : 1.02;
  return [CX + base[0] + 48 * s, CY + base[1] - 86 * s];
}

// ---------- 网 ----------
function drawNet(t, ch) {
  const a = [CX + BOAT_A.x - 178, CY + BOAT_A.y - 252];  // 船桁上的挂点
  const h0 = handPos(0), h1 = handPos(1);
  const tighten = pullAmt(t);
  const sag = 62 - tighten * 22;
  if (ch === 'K') {
    ctx.strokeStyle = K;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(h0[0], h0[1]);
    ctx.quadraticCurveTo(h0[0] + 200, h0[1] + sag * 0.9, a[0], a[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(h1[0], h1[1]);
    ctx.quadraticCurveTo(h1[0] + 220, h1[1] + sag, a[0], a[1]);
    ctx.stroke();
    // 网面网格
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = 0.8;
    for (let i = 1; i < 8; i++) {
      const q = i / 8;
      const sx = S.lerp(h0[0], a[0], q), sy = S.lerp(h0[1], a[1], q) + Math.sin(q * Math.PI) * sag;
      const ex = S.lerp(h1[0], a[0], q), ey = S.lerp(h1[1], a[1], q) + Math.sin(q * Math.PI) * sag;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    }
    for (let i = 1; i < 12; i++) {
      const q = i / 12;
      ctx.beginPath();
      ctx.moveTo(S.lerp(h0[0], h1[0], q), S.lerp(h0[1], h1[1], q));
      ctx.quadraticCurveTo(S.lerp(h0[0], h1[0], q) + 140, S.lerp(h0[1], h1[1], q) + sag * 0.5,
                           S.lerp(h0[0], a[0], q), S.lerp(h0[1], a[1], q));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (ch === 'Y') {
    ctx.fillStyle = PY.soft;
    for (let i = 0; i < 22; i++) {
      const q = i / 22;
      const x = S.lerp(h0[0], a[0], q) + Math.sin(i * 2.4 + t * 2.2) * 8;
      const y = S.lerp(h0[1], a[1], q) + Math.sin(q * Math.PI) * sag * 0.6;
      ctx.fillRect(x - 2, y - 2, 5, 5);
    }
  }
}

// ---------- 白鹭 ----------
function drawGull(g, t) {
  const x = CX + g.x + Math.sin(t * 0.7 + g.ph) * 40;
  const y = CY + g.y + Math.cos(t * 0.6 + g.ph) * 18;
  const f = Math.sin(t * g.spd + g.ph);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(g.s, g.s);
  ctx.strokeStyle = K;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(-34, 0);
  ctx.quadraticCurveTo(-10, -18 - f * 16, 4, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(20, -18 - f * 16, 42, -2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(12, 11); ctx.stroke();
  ctx.restore();
}

// ---------- 四块版 ----------
function plateC(t) {
  // 天空：三段网点，越靠地平线越淡
  ctx.globalAlpha = 0.95; ctx.fillStyle = PC.s1; ctx.fillRect(CX, CY, SH.w, 168);
  ctx.globalAlpha = 0.8; ctx.fillStyle = PC.s2; ctx.fillRect(CX, CY + 168, SH.w, 130);
  ctx.globalAlpha = 0.55; ctx.fillStyle = PC.s3; ctx.fillRect(CX, CY + 298, SH.w, 78);
  ctx.globalAlpha = 1;
  // 远山（两天平线）
  poly([[0, HOR + 6], [0, HOR - 84], [140, HOR - 128], [330, HOR - 96], [520, HOR - 140], [700, HOR - 92], [900, HOR - 118], [1100, HOR - 84], [1300, HOR - 106], [1448, HOR - 78], [1448, HOR + 6]], 'rgba(21,38,71,0.55)');
  // 山脚压一层空气淡出，别留一条硬直边
  const hz = ctx.createLinearGradient(0, CY + HOR - 26, 0, CY + HOR + 88);
  hz.addColorStop(0, 'rgba(245,240,230,0)');
  hz.addColorStop(1, 'rgba(245,240,230,0.95)');
  ctx.fillStyle = hz;
  ctx.fillRect(CX, CY + HOR - 26, SH.w, 114);
  // 海：上浅下深 + 网点
  const g = ctx.createLinearGradient(0, CY + HOR, 0, CY + SH.h);
  g.addColorStop(0, 'rgba(28,98,184,0.42)');
  g.addColorStop(0.4, 'rgba(28,98,184,0.66)');
  g.addColorStop(1, 'rgba(28,98,184,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(CX, CY + HOR, SH.w, SH.h - HOR);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = PC.sea;
  ctx.fillRect(CX, CY + HOR + 110, SH.w, SH.h - HOR - 110);
  ctx.globalAlpha = 1;
  // 水面横带（越远越细）
  for (let i = 0; i < 16; i++) {
    const y = HOR + 8 + i * 26 + Math.sin(t * 0.7 + i) * 1.6;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(21,38,71,0.5)' : 'rgba(255,255,255,0.35)';
    ctx.fillRect(CX, CY + y, SH.w, i < 6 ? 1.6 : 2.6);
  }
  // 船的水下阴影与舱
  drawBoat(BOAT_A, t, 'C');
  drawBoat(BOAT_B, t, 'C');
  // 栈桥阴影
  poly(PIER.map(([x, y]) => [x, y + 8]), 'rgba(28,98,184,0.55)');
  // 渔民裤
  drawFisherman(0, t, 'C');
  drawFisherman(1, t, 'C');
}
function plateM(t) {
  drawBoat(BOAT_A, t, 'M');
  drawBoat(BOAT_B, t, 'M');
  drawFisherman(0, t, 'M');
  drawFisherman(1, t, 'M');
  // 红桶（整色，不带网点，免得读成个球）
  ctx.fillStyle = M;
  ctx.beginPath(); ctx.ellipse(CX + 452, CY + 792, 40, 46, 0, 0, TAU); ctx.fill();
}
function plateY(t) {
  // 半轮太阳（只在天以下画，落山后半轮藏到山后）
  ctx.save();
  ctx.beginPath(); ctx.rect(CX, CY, SH.w, HOR); ctx.clip();
  ctx.fillStyle = PY.glow;
  ctx.beginPath(); ctx.arc(CX + SUN.x, CY + SUN.y, SUN.r, Math.PI * 1.03, TAU - 0.03); ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.arc(CX + SUN.x, CY + SUN.y, SUN.r + 62, Math.PI * 1.14, TAU - 0.14); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
  // 海面反光
  for (let i = 0; i < 24; i++) {
    const y = HOR + 8 + i * 15;
    const w = 22 + i * 10 + Math.sin(t * 1.2 + i * 0.7) * 16;
    ctx.fillStyle = PY.soft;
    ctx.globalAlpha = 0.9 - i * 0.025;
    ctx.fillRect(CX + SUN.x - w / 2 + Math.sin(t * 1.1 + i) * 9, CY + y, w, 8);
  }
  ctx.globalAlpha = 1;
  // 栈桥木板
  ctx.save();
  poly(PIER, PY.soft);
  ctx.restore();
  // 桶里的鱼
  ctx.fillStyle = PY.glow;
  [[438, 768], [462, 780], [476, 762]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.ellipse(CX + x, CY + y, 17, 8, 0.4, 0, TAU); ctx.fill();
  });
  drawBoat(BOAT_A, t, 'Y');
  drawBoat(BOAT_B, t, 'Y');
}
function plateK(t) {
  drawBoat(BOAT_A, t, 'K');
  drawBoat(BOAT_B, t, 'K');
  drawFisherman(0, t, 'K');
  drawFisherman(1, t, 'K');
  drawNet(t, 'K');
  GULLS.forEach((g) => drawGull(g, t));
  // 栈桥：板缝 + 桩 + 栏杆
  ctx.strokeStyle = K; ctx.lineWidth = 3.2; ctx.lineCap = 'butt';
  ctx.beginPath(); ctx.moveTo(PIER[0][0], PIER[0][1]); ctx.lineTo(PIER[1][0], PIER[1][1]); ctx.stroke();
  for (let i = 0; i < 13; i++) {
    const q = i / 13;
    const x0 = S.lerp(0, 566, q), y0 = S.lerp(742, 668, q);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - 6, y0 + 150); ctx.stroke();
  }
  // 桩
  ctx.lineWidth = 9;
  [[96, 774], [250, 736], [404, 700], [540, 676]].forEach(([x, y]) => {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 96); ctx.stroke();
  });
  // 栏杆
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(40, 700); ctx.lineTo(560, 630); ctx.stroke();
  ctx.lineWidth = 4;
  [140, 260, 380, 500].forEach((x) => {
    const y = S.lerp(700, 630, (x - 40) / 520);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 58); ctx.stroke();
  });
  // 海平线
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, HOR); ctx.lineTo(SH.w, HOR); ctx.stroke();
  // 浪
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 46; i++) {
    const y = HOR + 20 + (i % 12) * 40 + Math.sin(t * 0.9 + i) * 3;
    const x = ((i * 149) % (SH.w + 100)) - 60;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 + (i % 4) * 24, y); ctx.stroke();
  }
  // 桶
  ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.ellipse(CX + 452, CY + 792, 40, 46, 0, 0, TAU); ctx.stroke();
}
function plateK2(t) {
  // 套准十字 + 色标 + 刊头
  const marks = [[40, 40], [SH.w - 40, 40], [40, SH.h - 40], [SH.w - 40, SH.h - 40]];
  marks.forEach(([x, y]) => {
    ctx.fillStyle = K;
    ctx.fillRect(CX + x - 1.6, CY + y - 18, 3.2, 36);
    ctx.fillRect(CX + x - 18, CY + y - 1.6, 36, 3.2);
  });
  [K, C, M, Y].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(CX + 44 + i * 44, CY + SH.h - 72, 36, 36); });
  S.type(ENV, '收网', { x: CX + SH.w - 62, y: CY + 186, size: 122, color: K, weight: 800, align: 'right', letter: 14, alpha: 0.95 });
  S.type(ENV, '渔港 · 清晨五点', { x: CX + SH.w - 62, y: CY + 240, size: 32, color: K, weight: 600, align: 'right', letter: 7, alpha: 0.68 });
}

// ---------- 压印 ----------
const PASS = [
  { ink: C, t0: 0.0, t1: 1.6, dx: -3.0, dy: 2.4, fn: plateC },
  { ink: M, t0: 1.6, t1: 3.2, dx: 2.6, dy: -2.2, fn: plateM },
  { ink: Y, t0: 3.2, t1: 4.8, dx: -1.6, dy: 2.8, fn: plateY },
  { ink: K, t0: 4.8, t1: 6.4, dx: 0, dy: 0, fn: plateK },
  { ink: K, t0: 6.4, t1: 7.6, dx: 0, dy: 0, fn: plateK2 },
];
function prog(p, t) {
  if (t < p.t0) return 0;
  if (t > p.t1) return 1;
  return S.ease((t - p.t0) / (p.t1 - p.t0));
}

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, W, H);

  S.paper(ENV, { bg: PAPER, tooth: 0.4, fibers: true, vignette: 0.2, vignetteColor: '#3a2c18' }, ENV.root);

  const k = 1 + 0.03 * S.ease(t / 10);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2);

  ctx.save();
  ctx.shadowBlur = 52; ctx.shadowColor = 'rgba(38,26,10,0.40)'; ctx.shadowOffsetY = 22;
  ctx.fillStyle = '#fbf7ee';
  ctx.fillRect(SH.x, SH.y, SH.w, SH.h);
  ctx.restore();

  PASS.forEach((p) => {
    const u = prog(p, t);
    if (u <= 0) return;
    ctx.save();
    ctx.translate(p.dx, p.dy);
    ctx.beginPath();
    ctx.rect(SH.x - 12, SH.y - 12, Math.max(0, u * (SH.w + 24)), SH.h + 24);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    p.fn(t);
    if (u < 0.999) {
      const ex = SH.x + u * (SH.w + 24);
      const g = ctx.createLinearGradient(ex - 86, 0, ex, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,0.62)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g;
      ctx.fillRect(ex - 86, SH.y, 86, SH.h);
    }
    ctx.restore();
  });

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = GPAT;
  ctx.fillRect(SH.x, SH.y, SH.w, SH.h);
  ctx.restore();

  if (t > 7.6) {
    const q = S.clamp((t - 7.6) / 1.9);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const gx = S.lerp(SH.x - 240, SH.x + SH.w + 240, S.ease(q));
    const g = ctx.createLinearGradient(gx - 220, 0, gx + 220, 0);
    g.addColorStop(0, 'rgba(255,250,236,0)');
    g.addColorStop(0.5, 'rgba(255,250,236,0.22)');
    g.addColorStop(1, 'rgba(255,250,236,0)');
    ctx.fillStyle = g;
    ctx.fillRect(SH.x, SH.y, SH.w, SH.h);
    ctx.restore();
  }
  ctx.restore();
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
