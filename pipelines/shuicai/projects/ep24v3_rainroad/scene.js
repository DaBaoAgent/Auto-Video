// EP24 · 水彩 · 雨天骑车五十公里（1080×1920 竖屏）
// 依赖 engine.js（提供 W/H、PAPER/INK、mk、drawS、drawList、qcurve、polar、clump、edgeOf、withSeed、rnd/mulberry…）
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
window.DUR = 10;
const DUR10 = 10;

const PAL_R = {
  sky1: '#a9bccb', sky2: '#cfc3b2', sky3: '#e6cdb4',
  hill: '#7f9391', hillD: '#5d7370',
  paddy: '#a8bfc7', paddyD: '#7d99a4',
  road: '#6f6053', roadL: '#8a7866', roadD: '#4b4038',
  earth: '#b3a184', grass: '#7d9463', grassD: '#54683f',
  warm: '#d9782f', warmL: '#e9a45c',
  cloth: '#33506b', clothD: '#22384c', skin: '#d9b391',
  metal: '#5b636a',
};

// ── 一笔水彩（湿接湿：外扩一圈淡色 + 芯色）──
function wash(S, pts, w, col, a = .8, o = {}) {
  S.push(mk(pts, w * 1.18, col, { prof: o.prof || 'brush', anb: 0, nb: o.nb ?? 0, rough: o.rough ?? .3, a: a * .55 }));
  S.push(mk(pts, w, col, { prof: o.prof || 'brush', nb: o.nb ?? 0, rough: o.rough ?? .26, a }));
}

function arcPts(cx, cy, r, a0, a1, n = 22) {
  const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p;
}

// ── 静态底（一次性画进离屏画布）──
const HB = { x: 500, y: 1330 };              // 路的消失点
const ROAD = { near: 1920, nearX: 760, farY: HB.y, farX: HB.x };
const WORK = { x: 500, y: 1245 };            // 远处作坊

function buildBg() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = PAPER; x.fillRect(0, 0, W, H);
  // 天的底色（先铺一层竖向渐变，笔触只做纹理）
  const skyG = x.createLinearGradient(0, 0, 0, H * 0.74);
  skyG.addColorStop(0, '#7c93a3'); skyG.addColorStop(.34, '#a7b6bd'); skyG.addColorStop(.66, '#cbbfae'); skyG.addColorStop(1, '#e8d6bd');
  x.fillStyle = skyG; x.fillRect(0, 0, W, H * 0.74);
  withSeed(7717, () => {
    // 天：三段湿接（冷 → 暖）
    for (let i = 0; i < 9; i++) {
      const y = 70 + i * 138, t = i / 9;
      const col = mixc(mixc(PAL_R.sky1, PAL_R.sky2, clamp(t * 1.7)), PAL_R.sky3, clamp(t * 2.3 - .95));
      const L = [
        mk(qcurve(-60, y + rnd(-14, 14), W + 60, y + rnd(-18, 18), rnd(-40, 40), 14), rnd(300, 380), col, { prof: 'even', nb: 2, a: rnd(.05, .10), rough: .2 }),
        mk(qcurve(-60, y + 46 + rnd(-10, 10), W + 60, y + 38 + rnd(-12, 12), rnd(-22, 22), 12), rnd(180, 240), col, { prof: 'even', nb: 0, a: rnd(.05, .10), rough: .14 }),
      ];
      drawList(x, L, 1);
    }
    // 远山两道
    for (const [yy, col, a, hgt] of [[1170, PAL_R.hill, .32, 46], [1222, PAL_R.hillD, .28, 30]]) {
      const L = [];
      for (let i = 0; i < 6; i++) {
        const x0 = -30 + i * 200, x1 = x0 + 240;
        L.push(mk(qcurve(x0, yy + rnd(-6, 6), x1, yy + rnd(-10, 10), rnd(-hgt, hgt) * .5, 9), rnd(40, 70), col, { prof: 'brush', nb: 3, a: rnd(a * .6, a), rough: .34 }));
      }
      drawList(x, L, 1);
    }
    // 田垄与水田（横条湿接）
    for (let i = 0; i < 12; i++) {
      const y = 1280 + i * 18;
      const L = [mk(qcurve(-30, y + rnd(-5, 5), W + 30, y + rnd(-6, 6), rnd(-14, 14), 9), rnd(14, 34), rnd(.4, .8) > .5 ? PAL_R.paddy : PAL_R.paddyD, { prof: 'brush', nb: 2, a: rnd(.16, .30), rough: .3 })];
      drawList(x, L, 1);
    }
    // 草埂
    for (let i = 0; i < 5; i++) {
      const y = 1310 + i * 52;
      drawList(x, [mk(qcurve(-20, y, W + 20, y + rnd(-8, 8), rnd(-10, 10), 8), rnd(8, 16), PAL_R.grassD, { prof: 'brush', a: .22, rough: .3 })], 1);
    }
    // 路：从底边收向消失点的两条边 + 湿面
    const roadL = [], roadR = [];
    for (let i = 0; i <= 10; i++) {
      const q = i / 10, y = lerp(HB.y, ROAD.near, q), lx = lerp(HB.x, ROAD.nearX - 420 * q, q * .9), rx = lerp(HB.x, ROAD.nearX + 470 * q, q * .9);
      roadL.push([lx, y]); roadR.push([rx, y]);
    }
    drawList(x, [mk(roadL, 12, PAL_R.roadD, { prof: 'even', a: .32, rough: .34, nb: 2 }),
      mk(roadR, 10, PAL_R.roadD, { prof: 'even', a: .28, rough: .34, nb: 2 })], 1);
    // 路面的水光（几笔横向淡蓝）
    for (let i = 0; i < 16; i++) {
      const q = i / 16, y = lerp(HB.y + 20, H + 20, q), lx = lerp(HB.x, ROAD.nearX - 420, q), rx = lerp(HB.x, ROAD.nearX + 470, q);
      const x0 = lx + (rx - lx) * rnd(.06, .3), x1 = lx + (rx - lx) * rnd(.5, .94);
      drawList(x, [mk(qcurve(x0, y, x1, y + rnd(-6, 6), rnd(-6, 6), 6), rnd(6, 22), rnd(.5, 1) > .5 ? PAL_R.paddy : '#c8cdc7', { prof: 'brush', a: rnd(.10, .26), rough: .28, nb: 2 })], 1);
    }
    // 路的实体（压一层薄赭，让路面有“湿土”）
    for (let i = 0; i < 10; i++) {
      const q = i / 10, y = lerp(HB.y + 40, H + 30, q);
      const lx = lerp(HB.x - 20, ROAD.nearX - 420, q), rx = lerp(HB.x + 20, ROAD.nearX + 470, q);
      drawList(x, [mk(qcurve(lx, y, rx, y + rnd(-6, 6), rnd(-8, 8), 12), rnd(90, 150), PAL_R.road, { prof: 'even', a: rnd(.10, .2), rough: .2, nb: 1 })], 1);
    }
    // 电线杆三根（近大远小），杆上横担 + 两根线
    const poles = [[286, 1860, 1.05], [392, 1560, .74], [452, 1408, .54]];
    const wires = [];
    for (const [px, py, s] of poles) {
      const hgt = 300 * s, wds = 26 * s;
      drawList(x, [mk(qcurve(px + 4, py, px - 6, py - hgt, 8, 10), wds, PAL_R.roadD, { prof: 'trunk', a: .55, rough: .26, nb: 3 })], 1);
      drawList(x, [mk(qcurve(px - 10, py - hgt + 18 * s, px + 30 * s, py - hgt + 14 * s, 2, 6), 6 * s, PAL_R.roadD, { prof: 'even', a: .5, nb: 1 })], 1);
      wires.push([px - 6, py - hgt + 8 * s]);
    }
    // 电线：杆与杆之间下垂
    for (let i = 0; i < wires.length - 1; i++) {
      const a = wires[i], b = wires[i + 1];
      for (const dy of [0, 14]) {
        drawList(x, [mk(qcurve(a[0], a[1] + dy, b[0], b[1] + dy, 16, 10), 2.2, INK2, { prof: 'even', a: .35, nb: 0 })], 1);
      }
    }
    // 远处作坊：墙、屋顶、亮着的窗
    const wx0 = WORK.x - 92, wx1 = WORK.x + 96, wtop = WORK.y - 86, wbot = WORK.y + 66;
    drawList(x, [mk([[wx0, wbot], [wx0, wtop], [wx1, wtop], [wx1, wbot]], 90, '#cbbba2', { prof: 'brush', a: .42, rough: .3 })], 1);
    drawList(x, [mk([[wx0 - 20, wtop + 6], [WORK.x, wtop - 46], [wx1 + 18, wtop + 4]], 40, PAL_R.roadD, { prof: 'brush', a: .5, rough: .3, nb: 3 })], 1);
    drawList(x, [mk([[wx0 + 34, wbot], [wx0 + 34, wtop + 16]], 4, INK2, { prof: 'even', a: .4, nb: 0 }),
      mk([[wx1 - 40, wbot], [wx1 - 40, wtop + 16]], 4, INK2, { prof: 'even', a: .4, nb: 0 })], 1);
    // 门与暖窗
    drawList(x, [mk([[WORK.x - 26, wbot], [WORK.x - 26, wtop + 34], [WORK.x + 26, wtop + 34], [WORK.x + 26, wbot]], 48, '#3b3229', { prof: 'brush', a: .5, rough: .28 })], 1);
    drawList(x, [mk([[wx1 - 34, wtop + 26], [wx1 - 8, wtop + 26], [wx1 - 8, wtop + 54], [wx1 - 34, wtop + 54]], 22, PAL_R.warm, { prof: 'brush', a: .55, rough: .2 })], 1);
    // 作坊门前一小片暖光落在湿地上
    drawList(x, [mk(qcurve(WORK.x - 40, wbot + 6, WORK.x + 40, wbot + 10, 4, 6), 26, PAL_R.warmL, { prof: 'brush', a: .18, rough: .3 })], 1);
    // 地面前景：草与碎石
    for (let i = 0; i < 26; i++) {
      const gx = rnd(-20, W + 20), gy = rnd(1700, 1990);
      clump([], 0, 0, 0, 0, []);
      const L = []; clump(L, gx, gy, rnd(10, 30), Math.round(rnd(3, 7)), [PAL_R.grass, PAL_R.grassD], { l0: 6, l1: 20, w0: 3, w1: 7, a0: .3, a1: .55 });
      drawList(x, L, 1);
    }
    // 云带（把上半幅压出层次）
    for (let i = 0; i < 4; i++) {
      const y = 320 + i * 176;
      drawList(x, [mk(qcurve(-80, y + rnd(-30, 30), W + 80, y + rnd(-36, 36), rnd(-60, 60), 12), rnd(110, 180), i % 2 ? '#a7b1b8' : '#bfc4c1', { prof: 'even', nb: 1, a: rnd(.09, .17), rough: .22 })], 1);
    }
    // 远树一排
    for (let i = 0; i < 7; i++) {
      const L = [];
      clump(L, 30 + i * 156 + rnd(-26, 26), HB.y - 8 + rnd(-12, 12), rnd(26, 46), Math.round(rnd(7, 11)), ['#5f7566', '#71897a', '#4f6355'], { l0: 8, l1: 20, w0: 5, w1: 11, a0: .22, a1: .42, sy: .5 });
      drawList(x, L, 1);
    }
    // 路边界桩：木桩 + 红漆的「50」
    drawList(x, [mk([[208, 1700], [206, 1502]], 34, '#7a6248', { prof: 'trunk', a: .55, rough: .26, nb: 3 })], 1);
    x.save();
    x.globalAlpha = .62; x.fillStyle = '#8d3a2b';
    x.font = '500 74px "Georgia", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('50', 205, 1552);
    x.font = '400 30px "Georgia", serif'; x.globalAlpha = .5;
    x.fillText('km', 205, 1610);
    x.restore();
    // 路面压深（湿土）
    const roadPath = x.beginPath();
    x.moveTo(HB.x - 26, HB.y); x.lineTo(HB.x + 26, HB.y);
    x.lineTo(ROAD.nearX + 470, H + 20); x.lineTo(ROAD.nearX - 420, H + 20); x.closePath();
    const roadG = x.createLinearGradient(0, HB.y, 0, H + 20);
    roadG.addColorStop(0, 'rgba(74,62,52,0.10)'); roadG.addColorStop(.5, 'rgba(74,62,52,0.24)'); roadG.addColorStop(1, 'rgba(58,48,40,0.34)');
    x.fillStyle = roadG; x.fill(roadPath);

    // 路两侧的田与水（压住留白，让路成为一条带）
    for (const sgn of [-1, 1]) {
      x.beginPath();
      x.moveTo(HB.x + sgn * 26, HB.y);
      x.lineTo(HB.x + sgn * 36, HB.y);
      x.lineTo(ROAD.nearX + sgn * (sgn < 0 ? 900 : 1200), H + 30);
      x.lineTo(ROAD.nearX + sgn * (sgn < 0 ? 420 : 470), H + 30);
      x.closePath();
      const fg = x.createLinearGradient(0, HB.y, 0, H);
      fg.addColorStop(0, 'rgba(126,142,124,0.06)'); fg.addColorStop(.6, 'rgba(126,142,124,0.16)'); fg.addColorStop(1, 'rgba(104,120,102,0.22)');
      x.fillStyle = fg; x.fill();
    }
    // 四角淡压
    const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .42, W / 2, H / 2, Math.max(W, H) * .78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,96,66,0.16)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
  });
  return c;
}

const BG = buildBg();

// ── 自行车 + 骑手（背影视角，会蹬）──
function drawBike(x, cx, baseY, s, t) {
  const wheelR = 78 * s;
  const rear = [cx - 78 * s, baseY - wheelR];
  const front = [cx + 100 * s, baseY - wheelR];
  const spin = t * 3.6;                              // 轮子转
  // 轮：外圈 + 转动的辐条
  for (const c of [rear, front]) {
    drawList(x, [mk(arcPts(c[0], c[1], wheelR, 0, Math.PI * 2, 30).slice(1), 5.2 * s, PAL_R.metal, { prof: 'even', a: .75, nb: 0 })], 1);
    drawList(x, [mk(arcPts(c[0], c[1], wheelR * .93, 0, Math.PI * 2, 26).slice(1), 2.2 * s, '#7d858c', { prof: 'even', a: .5, nb: 0 })], 1);
    const L = [];
    for (let i = 0; i < 9; i++) {
      const a = spin + i / 9 * Math.PI * 2;
      L.push(mk([[c[0] + Math.cos(a) * wheelR * .1, c[1] + Math.sin(a) * wheelR * .1], [c[0] + Math.cos(a) * wheelR * .9, c[1] + Math.sin(a) * wheelR * .9]], 1.8 * s, '#6f767c', { prof: 'even', a: .55, nb: 0, rough: .12 }));
    }
    drawList(x, L, 1);
    drawList(x, [mk(arcPts(c[0], c[1], wheelR * .14, 0, Math.PI * 2, 10).slice(1), 5 * s, PAL_R.metal, { prof: 'even', a: .6, nb: 0 })], 1);
  }
  // 车架
  const seat = [rear[0] + 26 * s, rear[1] - 52 * s];
  const bb = [cx + 4 * s, baseY - wheelR * .86];
  const head = [front[0] - 12 * s, front[1] - 30 * s];
  drawList(x, [
    mk([rear, seat], 7 * s, PAL_R.clothD, { prof: 'trunk', a: .72, nb: 2 }),
    mk([seat, bb], 7 * s, PAL_R.clothD, { prof: 'trunk', a: .72, nb: 2 }),
    mk([bb, head], 7 * s, PAL_R.clothD, { prof: 'trunk', a: .72, nb: 2 }),
    mk([seat, head], 6.5 * s, PAL_R.clothD, { prof: 'trunk', a: .66, nb: 2 }),
    mk([head, front], 6 * s, PAL_R.clothD, { prof: 'trunk', a: .62, nb: 1 }),
    mk([head, [head[0] - 4 * s, head[1] - 30 * s]], 5 * s, PAL_R.clothD, { prof: 'trunk', a: .55, nb: 1 }),
  ], 1);
  // 车座与后架
  drawList(x, [mk([[seat[0] - 16 * s, seat[1] - 4 * s], [seat[0] + 12 * s, seat[1] - 8 * s]], 10 * s, '#4a3d33', { prof: 'brush', a: .6, rough: .2 })], 1);
  drawList(x, [mk([[rear[0] - 6 * s, rear[1] - 44 * s], [rear[0] + 52 * s, rear[1] - 48 * s]], 7 * s, PAL_R.metal, { prof: 'even', a: .5, nb: 1 })], 1);
  // 车把
  drawList(x, [mk([[head[0] - 26 * s, head[1] - 26 * s], [head[0] + 18 * s, head[1] - 30 * s]], 6 * s, PAL_R.metal, { prof: 'even', a: .6, nb: 1 })], 1);

  // 骑手：背影（雨衣、帽、背）
  const hip = [seat[0] + 2 * s, seat[1] - 14 * s];
  const shoulder = [hip[0] - 6 * s, hip[1] - 86 * s];
  const headC = [shoulder[0] - 2 * s, shoulder[1] - 26 * s];
  // 躯干（雨衣，背向）
  drawList(x, [mk([[shoulder[0] - 30 * s, shoulder[1] + 6 * s], [shoulder[0] + 28 * s, shoulder[1] + 2 * s],
    [hip[0] + 22 * s, hip[1] - 4 * s], [hip[0] - 26 * s, hip[1]], [shoulder[0] - 30 * s, shoulder[1] + 6 * s]],
    76 * s, PAL_R.cloth, { prof: 'brush', a: .78, rough: .26, nb: 3 })], 1);
  // 雨衣的两道褶
  drawList(x, [mk([[shoulder[0] - 14 * s, shoulder[1] + 26 * s], [hip[0] - 10 * s, hip[1] - 10 * s]], 5 * s, PAL_R.clothD, { prof: 'even', a: .35, nb: 0, rough: .2 }),
    mk([[shoulder[0] + 16 * s, shoulder[1] + 22 * s], [hip[0] + 12 * s, hip[1] - 14 * s]], 5 * s, PAL_R.clothD, { prof: 'even', a: .3, nb: 0, rough: .2 })], 1);
  // 头与帽
  drawList(x, [mk(arcPts(headC[0], headC[1], 21 * s, 0, Math.PI * 2, 16).slice(1), 34 * s, PAL_R.skin, { prof: 'brush', a: .72, rough: .22 }),
    mk([[headC[0] - 30 * s, headC[1] - 12 * s], [headC[0] + 28 * s, headC[1] - 16 * s]], 26 * s, '#3d4a55', { prof: 'brush', a: .78, rough: .2 }),
    mk([[headC[0] - 34 * s, headC[1] - 12 * s], [headC[0] + 20 * s, headC[1] - 15 * s]], 8 * s, '#2c3741', { prof: 'even', a: .6, nb: 1 })], 1);
  // 手臂到车把
  drawList(x, [mk([[shoulder[0] + 24 * s, shoulder[1] + 12 * s], [head[0] - 18 * s, head[1] - 22 * s]], 18 * s, PAL_R.cloth, { prof: 'trunk', a: .72, nb: 2 }),
    mk([[shoulder[0] - 24 * s, shoulder[1] + 14 * s], [head[0] + 6 * s, head[1] - 26 * s]], 16 * s, PAL_R.clothD, { prof: 'trunk', a: .6, nb: 2 })], 1);
  // 腿（蹬踏：相位差半圈）
  const crank = 26 * s;
  for (const ph of [0, Math.PI]) {
    const a = spin * .9 + ph;
    const foot = [bb[0] + Math.cos(a) * crank, bb[1] + Math.sin(a) * crank * .7];
    const knee = [lerp(hip[0], foot[0], .5) + Math.cos(a + 1.2) * 10 * s, lerp(hip[1], foot[1], .5) - 22 * s * Math.abs(Math.sin(a))];
    drawList(x, [
      mk([hip, knee], 16 * s, '#2f4a63', { prof: 'trunk', a: .78, nb: 2 }),
      mk([knee, foot], 11 * s, '#3b586f', { prof: 'trunk', a: .78, nb: 2 }),
    ], 1);
    // 鞋
    drawList(x, [mk([[foot[0] - 9 * s, foot[1] + 4 * s], [foot[0] + 11 * s, foot[1] + 2 * s]], 9 * s, '#2a2320', { prof: 'brush', a: .8, rough: .2 })], 1);
  }
}

// ── 雨：12 fps 步进 ──
const RAIN = (() => { const a = []; withSeed(31, () => { for (let i = 0; i < 190; i++) a.push([rnd(-10, W + 10), rnd(0, H), rnd(24, 78), rnd(.10, .26), rnd(1.2, 2.6)]); }); return a; })();

function drawRain(x, t) {
  const st = Math.floor(t * 12) / 12;
  for (let i = 0; i < RAIN.length; i++) {
    const [x0, y0, len, a, w] = RAIN[i];
    const yy = ((y0 + st * 470) % (H + 120)) - 60;
    x.strokeStyle = `rgba(88,110,126,${a})`; x.lineWidth = w; x.lineCap = 'round';
    x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 - len * .18, yy + len); x.stroke();
  }
}

// ── 水花与涟漪（路面）──
function drawPuddles(x, t) {
  const st = Math.floor(t * 6) / 6;
  for (let i = 0; i < 9; i++) {
    const seed = i * 7.3;
    const px = 240 + ((i * 137) % 640), py = 1330 + ((i * 79) % 540);
    const k = ((st * .9 + i * .37) % 1);
    x.strokeStyle = `rgba(120,146,160,${(1 - k) * .30})`; x.lineWidth = 1.6;
    x.beginPath(); x.ellipse(px, py, 6 + k * 34, 2 + k * 9, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(px, py, 3 + k * 20, 1 + k * 5, 0, 0, Math.PI * 2); x.stroke();
  }
}

window.render = function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(BG, 0, 0);
  // 车：10 s 从近处骑向远处（沿路收进）
  const q = clamp(t / DUR10);
  const bx = lerp(ROAD.nearX - 40, HB.x + 34, EaseInOut(q) * .86);
  const by = lerp(ROAD.near + 40, HB.y + 96, EaseInOut(q) * .88);
  const bs = lerp(1.5, .62, EaseInOut(q) * .9);
  // 车轮下的湿地影
  ctx.save();
  ctx.globalAlpha = .22; ctx.fillStyle = '#3b3128';
  ctx.beginPath(); ctx.ellipse(bx + 12 * bs, by + 6, 190 * bs, 22 * bs, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  drawBike(ctx, bx, by, bs, t);
  drawPuddles(ctx, t);
  drawRain(ctx, t);
  // 湿雾：底边一层淡淡的雨幕
  const mist = ctx.createLinearGradient(0, HB.y - 60, 0, H);
  mist.addColorStop(0, 'rgba(215,206,190,0)'); mist.addColorStop(.35, 'rgba(215,206,190,0.10)'); mist.addColorStop(1, 'rgba(215,206,190,0.02)');
  ctx.fillStyle = mist; ctx.fillRect(0, HB.y - 60, W, H - HB.y + 60);
  // 纸边：水彩纸的不齐边
  ctx.save();
  ctx.strokeStyle = 'rgba(150,124,92,0.20)'; ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, W - 14, H - 14);
  ctx.restore();
  window.READY = true;
};

function EaseInOut(x) { x = clamp(x); return x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

window.render(0);
window.READY = true;





