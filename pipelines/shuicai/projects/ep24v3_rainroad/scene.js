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
    // 路：横穿画面的一条带（上沿 1560 / 下沿 1826），上边是田，下边是路肩草
    drawList(x, [mk(qcurve(-30, 1560, W + 30, 1562 + rnd(-3, 3), rnd(-4, 4), 10), 20, PAL_R.roadD, { prof: 'even', a: .30, rough: .26, nb: 2 }),
      mk(qcurve(-30, 1826, W + 30, 1828 + rnd(-3, 3), rnd(-4, 4), 10), 24, PAL_R.roadD, { prof: 'even', a: .34, rough: .24, nb: 2 })], 1);
    // 湿路面：横向多层湿接
    for (let i = 0; i < 9; i++) {
      const y = 1570 + i * 28;
      drawList(x, [mk(qcurve(-40, y + rnd(-5, 5), W + 40, y + rnd(-6, 6), rnd(-3, 3), 12), rnd(46, 78), PAL_R.road, { prof: 'even', a: rnd(.07, .15), rough: .18, nb: 1 })], 1);
    }
    // 两道车辙（横着走）
    for (const dy of [44, 132]) {
      drawList(x, [mk(qcurve(-30, 1560 + dy, W + 30, 1560 + dy + rnd(-4, 4), 3, 10), 10, PAL_R.roadD, { prof: 'even', a: .22, rough: .2, nb: 1 })], 1);
    }
    // 路面积水（横向亮片）
    for (let i = 0; i < 16; i++) {
      const x0 = rnd(-20, W), y = 1570 + rnd(10, 240);
      drawList(x, [mk(qcurve(x0, y, x0 + rnd(60, 230), y + rnd(-3, 3), rnd(-3, 3), 6), rnd(9, 26), rnd(.5, 1) > .5 ? PAL_R.paddy : '#c8cdc7', { prof: 'brush', a: rnd(.10, .24), rough: .26, nb: 2 })], 1);
    }
    // 电线杆三根（近大远小），杆上横担 + 两根线
    const poles = [[298, 1552, .95], [588, 1508, .74], [828, 1472, .56]];
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
    // 路边界桩：木桩 + 红漆的「50」（立在路的上面那条田埂上）
    drawList(x, [mk([[196, 1560], [194, 1362]], 34, '#7a6248', { prof: 'trunk', a: .55, rough: .26, nb: 3 })], 1);
    x.save();
    x.globalAlpha = .62; x.fillStyle = '#8d3a2b';
    x.font = '500 74px "Georgia", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('50', 193, 1412);
    x.font = '400 30px "Georgia", serif'; x.globalAlpha = .5;
    x.fillText('km', 193, 1470);
    x.restore();
    // 路面压深（湿土）：横带，下沿更重
    const roadG = x.createLinearGradient(0, 1560, 0, 1832);
    roadG.addColorStop(0, 'rgba(74,62,52,0.08)'); roadG.addColorStop(.35, 'rgba(74,62,52,0.22)'); roadG.addColorStop(1, 'rgba(58,48,40,0.32)');
    x.fillStyle = roadG; x.fillRect(0, 1560, W, 272);
    // 路面下缘之外（路肩草）压一层绿灰
    const vergeG = x.createLinearGradient(0, 1832, 0, H);
    vergeG.addColorStop(0, 'rgba(96,112,86,0.18)'); vergeG.addColorStop(1, 'rgba(74,92,68,0.28)');
    x.fillStyle = vergeG; x.fillRect(0, 1832, W, H - 1832);
    // 四角淡压
    const vg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .42, W / 2, H / 2, Math.max(W, H) * .78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,96,66,0.16)');
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
  });
  return c;
}

const BG = buildBg();

// ── 自行车 + 骑手（侧视，自左往右骑；脚蹬慢）──
function drawBike(x, cx, baseY, s, t) {
  const wheelR = 74 * s;
  const rear = [cx - 86 * s, baseY - wheelR];
  const front = [cx + 98 * s, baseY - wheelR];
  const spin = t * 1.55;                                 // 轮子转（跟行进速度走）
  const pedalA = t * 2.55;                               // 脚蹬：约 0.4 转/秒，慢
  const ax = x.measureText ? null : null;

  // 轮：外圈 + 转动的辐条 + 花鼓
  for (const c of [rear, front]) {
    drawList(x, [mk(arcPts(c[0], c[1], wheelR, 0, Math.PI * 2, 32).slice(1), 5.4 * s, PAL_R.metal, { prof: 'even', a: .8, nb: 0 })], 1);
    drawList(x, [mk(arcPts(c[0], c[1], wheelR * .93, 0, Math.PI * 2, 28).slice(1), 2.1 * s, '#7d858c', { prof: 'even', a: .5, nb: 0 })], 1);
    const L = [];
    for (let i = 0; i < 8; i++) {
      const a = spin + i / 8 * Math.PI * 2;
      L.push(mk([[c[0] + Math.cos(a) * wheelR * .12, c[1] + Math.sin(a) * wheelR * .12], [c[0] + Math.cos(a) * wheelR * .88, c[1] + Math.sin(a) * wheelR * .88]], 1.8 * s, '#6f767c', { prof: 'even', a: .55, nb: 0, rough: .1 }));
    }
    drawList(x, L, 1);
    drawList(x, [mk(arcPts(c[0], c[1], wheelR * .13, 0, Math.PI * 2, 10).slice(1), 5 * s, PAL_R.metal, { prof: 'even', a: .6, nb: 0 })], 1);
  }

  // 车架（侧视）：座管、后下叉、上管、下管、前叉
  const bb = [cx + 2 * s, baseY - 50 * s];
  const seat = [cx - 46 * s, baseY - 162 * s];
  const headT = [cx + 74 * s, baseY - 168 * s];
  const bar = [cx + 86 * s, baseY - 176 * s];
  drawList(x, [
    mk([rear, seat], 6.5 * s, PAL_R.clothD, { prof: 'trunk', a: .72, nb: 2 }),
    mk([seat, bb], 7 * s, PAL_R.clothD, { prof: 'trunk', a: .74, nb: 2 }),
    mk([bb, headT], 7.5 * s, PAL_R.clothD, { prof: 'trunk', a: .74, nb: 2 }),
    mk([seat, headT], 6.5 * s, PAL_R.clothD, { prof: 'trunk', a: .70, nb: 2 }),
    mk([headT, front], 5.5 * s, PAL_R.clothD, { prof: 'trunk', a: .68, nb: 1 }),
    mk([headT, bar], 4.5 * s, PAL_R.clothD, { prof: 'trunk', a: .6, nb: 1 }),
    mk([rear, bb], 4.5 * s, PAL_R.clothD, { prof: 'trunk', a: .55, nb: 1 }),
  ], 1);
  // 车座与后架
  drawList(x, [mk([[seat[0] - 20 * s, seat[1] - 6 * s], [seat[0] + 12 * s, seat[1] - 9 * s]], 9 * s, '#4a3d33', { prof: 'brush', a: .62, rough: .2 })], 1);
  drawList(x, [mk([[rear[0] + 6 * s, rear[1] - 46 * s], [rear[0] + 60 * s, rear[1] - 50 * s]], 6.5 * s, PAL_R.metal, { prof: 'even', a: .5, nb: 1 })], 1);
  // 车把（弯把一只）
  drawList(x, [mk([[bar[0] - 6 * s, bar[1] + 4 * s], [bar[0] + 10 * s, bar[1] - 6 * s]], 6 * s, PAL_R.metal, { prof: 'even', a: .6, nb: 1 })], 1);
  // 牙盘与链条
  drawList(x, [mk(arcPts(bb[0], bb[1], 20 * s, 0, Math.PI * 2, 14).slice(1), 4 * s, PAL_R.metal, { prof: 'even', a: .55, nb: 0 }),
    mk([[bb[0], bb[1] + 18 * s], [rear[0], rear[1] + 6 * s]], 2 * s, '#6d747a', { prof: 'even', a: .4, nb: 0 })], 1);

  // 骑手（侧视，面朝右）：髋、肩、头
  const hip = [seat[0] + 4 * s, seat[1] - 4 * s];
  const shoulder = [hip[0] + 34 * s, hip[1] - 96 * s];
  const headC = [shoulder[0] + 16 * s, shoulder[1] - 22 * s];
  // 躯干（雨衣，前倾）
  drawList(x, [mk([[shoulder[0] - 8 * s, shoulder[1] - 8 * s], [shoulder[0] + 20 * s, shoulder[1] + 2 * s],
    [hip[0] + 18 * s, hip[1] + 4 * s], [hip[0] - 18 * s, hip[1] - 2 * s], [shoulder[0] - 24 * s, shoulder[1] + 10 * s]],
    62 * s, PAL_R.cloth, { prof: 'brush', a: .82, rough: .24, nb: 3 })], 1);
  // 雨衣下摆（被风往后拽）
  drawList(x, [mk([[hip[0] - 18 * s, hip[1] - 6 * s], [hip[0] - 44 * s, hip[1] + 12 * s], [hip[0] - 20 * s, hip[1] + 16 * s]], 26 * s, PAL_R.clothD, { prof: 'brush', a: .6, rough: .3, nb: 2 })], 1);
  // 头（profile）+ 帽檐朝右
  drawList(x, [mk(arcPts(headC[0], headC[1], 21 * s, 0, Math.PI * 2, 18).slice(1), 32 * s, PAL_R.skin, { prof: 'brush', a: .78, rough: .2 })], 1);
  // 鼻、下巴（朝右的侧脸）
  drawList(x, [mk([[headC[0] + 18 * s, headC[1] + 2 * s], [headC[0] + 25 * s, headC[1] + 8 * s], [headC[0] + 17 * s, headC[1] + 12 * s]], 7 * s, PAL_R.skin, { prof: 'even', a: .6, nb: 0, rough: .12 })], 1);
  // 帽子
  drawList(x, [mk([[headC[0] - 26 * s, headC[1] - 8 * s], [headC[0] + 18 * s, headC[1] - 14 * s]], 22 * s, '#3d4a55', { prof: 'brush', a: .8, rough: .18 }),
    mk([[headC[0] + 2 * s, headC[1] - 14 * s], [headC[0] + 36 * s, headC[1] - 8 * s]], 8 * s, '#2c3741', { prof: 'even', a: .65, nb: 1 })], 1);
  // 眼睛一条（侧面）
  drawList(x, [mk([[headC[0] + 12 * s, headC[1] - 2 * s], [headC[0] + 20 * s, headC[1] - 2 * s]], 2.4 * s, '#2a2320', { prof: 'even', a: .5, nb: 0 })], 1);

  // 手臂：肩 → 车把（前伸）
  drawList(x, [mk([[shoulder[0] + 16 * s, shoulder[1] + 10 * s], [lerp(shoulder[0], bar[0], .55) + 4 * s, lerp(shoulder[1], bar[1], .55) + 12 * s], [bar[0], bar[1]]],
    17 * s, PAL_R.cloth, { prof: 'trunk', a: .78, nb: 2 })], 1);

  // 腿：髋 → 膝 → 脚踏（左右腿相位差半圈，膝盖向前顶）
  for (const ph of [0, Math.PI]) {
    const a = pedalA + ph;
    const pedal = [bb[0] + Math.cos(a) * 26 * s, bb[1] + Math.sin(a) * 26 * s];
    const knee = [lerp(hip[0], pedal[0], .46) + 22 * s, lerp(hip[1], pedal[1], .46) - 6 * s];
    drawList(x, [
      mk([hip, knee], 18 * s, '#2f4a63', { prof: 'trunk', a: .8, nb: 2 }),
      mk([knee, pedal], 12 * s, '#3b586f', { prof: 'trunk', a: .8, nb: 1 }),
    ], 1);
    // 鞋 + 脚踏
    drawList(x, [mk([[pedal[0] - 12 * s, pedal[1] - 4 * s], [pedal[0] + 12 * s, pedal[1] - 6 * s]], 9 * s, '#2a2320', { prof: 'brush', a: .82, rough: .18 })], 1);
    drawList(x, [mk([[pedal[0] - 10 * s, pedal[1]], [pedal[0] + 10 * s, pedal[1] + 2 * s]], 3 * s, '#565c61', { prof: 'even', a: .45, nb: 0 })], 1);
  }

  // 前后轮溅起的水花（步进 12fps，跟行进方向往后甩）
  const stp = Math.floor(t * 12) / 12;
  for (let i = 0; i < 7; i++) {
    const k = ((stp * 3 + i * .37) % 1);
    const sx = rear[0] - 6 * s - k * 54 * s, sy = baseY - 8 * s - Math.sin(k * Math.PI) * 26 * s;
    x.strokeStyle = `rgba(200,212,214,${(1 - k) * .5})`; x.lineWidth = 2.2 * s;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx - 10 * s, sy - 8 * s); x.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const k = ((stp * 3 + i * .41 + .5) % 1);
    const sx = front[0] + 14 * s + k * 30 * s, sy = baseY - 6 * s - Math.sin(k * Math.PI) * 14 * s;
    x.strokeStyle = `rgba(200,212,214,${(1 - k) * .4})`; x.lineWidth = 1.8 * s;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + 6 * s, sy - 6 * s); x.stroke();
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
    const px = 120 + ((i * 137) % 820), py = 1590 + ((i * 79) % 220);
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
  // 车：10 s 自左往右骑过画面（匀速带一点缓起缓停）
  const q = clamp(t / DUR10);
  const bx = lerp(-240, W + 260, clamp(q * 1.02));
  const by = 1734;
  const bs = 1.12;
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









