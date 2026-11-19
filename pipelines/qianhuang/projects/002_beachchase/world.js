// Bay of Blood · 血之海滩 —— 一张速写页，画一次，上两遍色。
// 同一份线稿，两个色版：A 夜湖（十三号星期五的湖边营地）／B 血海（一九七一年的意大利海湾）。
// 水彩的规矩：先留白（reserve），再上洗（wash）；洗是乘上去的，永远压不白，所以白要留出来。
import { rng, fbm, n2, hex, mix3, lerp, clamp, ellipse, spline, penStroke, rasterPen, wash, reserve, dab, foliage, figure, drawPrims, TAU } from './engine.js';
import { stand, prone, walk } from './poses.js';

export const W = 5120, H = 2880;
export const HZ = 1490;
export const WIN_A = [.03, 2.55];
export const ORIGIN = [1500, 2110];

const MARG = { l: 84, r: 84, t: 62, b: 104 };   // 页边留白

const cv = (w, h, fill) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); if (fill) { x.fillStyle = fill; x.fillRect(0, 0, w, h); } return [c, x]; };

// 页边的一条毛边路径（上、右、下、左走一圈），颜色与线都先裁在里面
export function pagePath(step = 26) {
  const p = [], R = rng(4242);
  const nz = (t, s) => (fbm(t * .0026, s, 61, 3) - .5) * 42 + (n2(t * .012, s, 7) - .5) * 16;
  for (let x = MARG.l; x <= W - MARG.r; x += step) p.push([x, MARG.t + nz(x, 0), 0]);
  for (let y = MARG.t; y <= H - MARG.b; y += step) p.push([W - MARG.r + nz(y, 1), y, 0]);
  for (let x = W - MARG.r; x >= MARG.l; x -= step) p.push([x, H - MARG.b + nz(x, 2), 0]);
  for (let y = H - MARG.b; y >= MARG.t; y -= step) p.push([MARG.l + nz(y, 3), y, 0]);
  return p.map(q => [q[0], q[1]]);
}
function clipPage(ctx, path) { ctx.save(); ctx.beginPath(); path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip(); }
export function pageMask(x, y) { return Math.min(x - MARG.l, H - MARG.b - y, W - MARG.r - x, y - MARG.t); }
export const inPage = (x, y, m = 0) => pageMask(x, y) > m;

const A = {
  // 夜湖走钴蓝（#1b2a8f 那一族）：跟 B 版的深红正好是铅黄的两极，蓝=死亡降临
  sky: ['#070d28', '#0d1740', '#13205c', '#1b2a8f', '#20356f', '#1d4459'],
  sea: ['#040a1e', '#081230', '#0d1c48', '#132563', '#1b2a8f'],
  sand: ['#332f42', '#3f3a4e', '#4c4658'], wet: '#232131',
  land: '#0b2a30', landD: '#071a20', pine: '#0b2a30', pine2: '#1a5450', pineLit: '#4f9a52',
  wood: '#4a2420', woodD: '#22101a',
  villa: '#4a2c58', villaD: '#2a1238', roof: '#1a0c22', win: '#ffa347', brick: '#33142a',
  fire: '#ff7a26', fireL: '#ffd24a', blood: '#b3001b', bloodD: '#5e040d',
  hull: '#43301f', trim: '#5b4126', moon: '#eef6ff', glint: '#c3d2f0',
};
const B = {
  // 铅黄的两极：天顶钴蓝，落到地平线烧成深红，只在贴地处放一线污染金。品红全部清掉
  sky: ['#080c24', '#101c50', '#1b2a8f', '#5c1030', '#b3001b', '#e04a12', '#ffc84e'],
  sea: ['#3c030a', '#6b0510', '#96081a', '#b3001b', '#d8121f', '#f02a24'],
  sand: ['#d9954a', '#b87734', '#96601e'], wet: '#5e2d10',
  land: '#08402f', landD: '#03100e', pine: '#063428', pine2: '#1c7a4a', pineLit: '#7cc41a',
  wood: '#8c2a1c', woodD: '#3a0f12',
  villa: '#ffe8a8', villaD: '#7a2a4e', roof: '#b3001b', win: '#ffc23a', brick: '#8e2130',
  fire: '#c2703a', fireL: '#e0a24e', blood: '#b3001b', bloodD: '#5e040d',
  hull: '#ffe8a8', trim: '#b3001b', sun: '#fff2ac', glint: '#ffe2a8',
};

const G = {};
const shoreY = x => 2108 + Math.sin(x * .0011) * 26 + (n2(x * .004, 3, 5) - .5) * 22;

function buildGeom() {
  const R = rng(20260118);
  G.lhead = [[0, 1350], [300, 1408], [650, 1470], [940, 1580], [1120, 1760], [1200, 2020], [1236, 2280], [1160, 2560], [1040, 2880], [0, 2880]];
  G.rhead = [[3440, 1476], [3800, 1462], [4150, 1492], [4520, 1548], [4870, 1638], [5120, 1702], [5120, 2880], [3760, 2880], [3590, 2400], [3480, 2040], [3432, 1720]];
  const sand = [];
  for (let x = 1140; x <= 3560; x += 80) sand.push([x, shoreY(x)]);
  G.sandTop = sand;
  G.orb = { x: 2478, y: 1538, r: 116 };
  G.villa = { x: 762, y: 1958, w: 452, h: 214, roofH: 96 };
  G.pier = { a: [246, 2478], b: [1602, 2078] };
  const dir = [G.pier.b[0] - G.pier.a[0], G.pier.b[1] - G.pier.a[1]];
  const L = Math.hypot(...dir), ux = dir[0] / L, uy = dir[1] / L, nx = -uy, ny = ux;
  const at = (u, off) => [lerp(G.pier.a[0], G.pier.b[0], u) + nx * off, lerp(G.pier.a[1], G.pier.b[1], u) + ny * off];
  G.pier.at = at;
  G.planks = [];
  for (let u = .02; u < 1.0; u += .052) G.planks.push([at(u, -59), at(Math.min(1, u + .038), -59), at(Math.min(1, u + .038), 59), at(u, 59)]);
  G.posts = [];
  for (let u = .06; u <= .96; u += .135) G.posts.push([at(u, -58), at(u, 58), [at(u, 58)[0], at(u, 58)[1] + 150], [at(u, -58)[0], at(u, -58)[1] + 150]]);
  G.pines = [
    { x: 3810, y: 2016, h: 500, crown: [[3812, 1520, 196], [3700, 1580, 110], [3930, 1570, 118], [3810, 1450, 96]] },
    { x: 4262, y: 1908, h: 560, crown: [[4266, 1380, 214], [4140, 1442, 104], [4400, 1448, 112], [4266, 1310, 92]] },
    { x: 4702, y: 1982, h: 470, crown: [[4706, 1492, 176], [4600, 1540, 96], [4806, 1544, 100], [4706, 1424, 84]] },
    { x: 1206, y: 1936, h: 330, crown: [[1210, 1690, 120], [1140, 1726, 70], [1280, 1722, 74]] },
  ];
  G.boat = { x: 2120, y: 2546, w: 402, h: 96 };
  G.bodies = [];
  G.maskman = { x: 1592, y: 2074, h: 286 };
  G.pile = { x: 2870, y: 2500, r: 96 };
  G.reeds = [];
  for (let i = 0; i < 24; i++) { const x = 1086 + R() * 230, y = 2380 + R() * 430; G.reeds.push([x, y, 40 + R() * 90, (R() - .5) * .5]); }
  for (let i = 0; i < 16; i++) { const x = 3490 + R() * 220, y = 2300 + R() * 520; G.reeds.push([x, y, 46 + R() * 100, (R() - .5) * .5]); }
  G.clouds = [[[1420, 690, 300, 92], [1120, 770, 205, 72], [1700, 740, 176, 64]],
             [[3260, 520, 330, 96], [3560, 600, 214, 70], [3000, 610, 186, 66]]];
}

// —— 大面积的洗：用渐变一次铺开，免得一道一道的接缝 ——
function grad(ctx, y0, y1, cols, a = .95) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), `rgba(${c[0]},${c[1]},${c[2]},${a})`));
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g;
  ctx.fillRect(-300, y0 - 4, W + 600, (y1 - y0) + 8); ctx.restore();
}
// 一块地：先擦回纸，再上洗（这样浅色才压得住深色）
function ground(ctx, poly, col, a = .95, seed = 1, j = 8) {
  reserve(ctx, poly, .97, j, seed);
  wash(ctx, poly, col, { a, j, layers: 2, edge: .25, seed, freq: .012 });
}

function skyA(ctx) {
  grad(ctx, MARG.t - 20, HZ + 8, A.sky.map(hex), .9);
  // 月亮：留白最多的一块，光域靠“擦回纸”而不是加白；位置与 B 版的落日同一个圆
  const o = G.orb, sy = HZ - 186;
  for (let k = 0; k < 3; k++) reserve(ctx, ellipse(o.x, sy - 40, 640 - k * 160, 340 - k * 88, 24), .17 - k * .045, 44, 320 + k);
  reserve(ctx, ellipse(o.x, sy, 116, 112, 18), .97, 3, 7);
  wash(ctx, ellipse(o.x, sy, 116, 112, 18), hex('#cfe4f2'), { a: .3, j: 4, layers: 2, edge: .22, seed: 8 });
  // 云改由 film.js 每帧现画（要飘），这里只留天空
}
function skyB(ctx) {
  grad(ctx, MARG.t - 20, HZ + 8, B.sky.map(hex), .96);
  // 天不是一路渐变：几道刷上去的色带（钴蓝一块、酸绿一块、深红一块），铅黄的天是拼色不是黄昏
  wash(ctx, [[MARG.l - 40, 500], [W - MARG.r + 40, 440], [W - MARG.r + 40, 830], [MARG.l - 40, 900]], hex('#1b2a8f'), { a: .36, j: 140, layers: 2, edge: 0, seed: 620, freq: .0022 });
  wash(ctx, [[MARG.l - 40, 830], [W - MARG.r + 40, 790], [W - MARG.r + 40, 1130], [MARG.l - 40, 1180]], hex('#0f7a5c'), { a: .24, j: 150, layers: 2, edge: 0, seed: 621, freq: .0022 });
  wash(ctx, [[MARG.l - 40, 1100], [W - MARG.r + 40, 1075], [W - MARG.r + 40, 1370], [MARG.l - 40, 1395]], hex('#b3001b'), { a: .32, j: 120, layers: 2, edge: 0, seed: 622, freq: .0025 });
  // 落日：光晕三层 + 本体（本体先留白）；本体不是奶黄，是硬边的橙红盘
  wash(ctx, ellipse(2478, 1408, 1180, 600, 30), hex('#ff5a1a'), { a: .28, j: 90, layers: 2, edge: 0, seed: 610, freq: .004 });
  wash(ctx, ellipse(2478, 1382, 640, 320, 26), hex('#ff8a1c'), { a: .32, j: 60, layers: 2, edge: 0, seed: 611, freq: .005 });
  const o = G.orb, sy = HZ - 186;
  reserve(ctx, ellipse(o.x, sy, o.r * 1.28, o.r * 1.24, 26), .97, 3, 12);
  wash(ctx, ellipse(o.x, sy, o.r * 1.28, o.r * 1.24, 26), hex('#ff5a24'), { a: .9, j: 3, layers: 2, edge: .55, seed: 13 });
  wash(ctx, ellipse(o.x, sy - 14, o.r * .86, o.r * .72, 20), hex('#ffb23e'), { a: .62, j: 4, layers: 1, edge: .2, seed: 14 });
  // 云由 film.js 现画
}

function seaA(ctx) {
  grad(ctx, HZ, 2118, A.sea.map(hex), .95);
  const R = rng(71);
  // 月光：只在贴水的地方留几笔碎光，别拉成一条梯子（片名那一块要留干净）
  const inTitle = (x, y) => x > 1880 && x < 2950 && y > 1480 && y < 1900;
  for (let i = 0; i < 14; i++) {
    const t = R(), y = 1550 + t * 300, x = 2478 + Math.sin(t * 6.2 + R()) * (40 + t * 260);
    if (inTitle(x, y)) continue;
    const w = 26 + t * 120 + R() * 50;
    reserve(ctx, ellipse(x, y, w, 3 + t * 3, 22), .2 + .16 * t, 12, i + 700);
  }
  for (let i = 0; i < 9; i++) {
    const y = 1970 + i * 15, x = 1200 + (i * 331) % 2000, w = 180 + (i % 4) * 120;
    reserve(ctx, [[x, y], [x + w * .34, y - 11], [x + w, y + 3], [x + w * .6, y + 15], [x + w * .12, y + 11]], .4, 8, i);
  }
}
function seaB(ctx) {
  grad(ctx, HZ, 2118, B.sea.map(hex), .96);
  bandTeal(ctx, 2002, 2118, hex('#0d7b72'), .8, 960);
  bandTeal(ctx, 2072, 2120, hex('#1fb5a4'), .6, 962);
  const R = rng(93);
  const inTitle2 = (x, y) => x > 1880 && x < 2950 && y > 1480 && y < 1900;
  for (let i = 0; i < 26; i++) {
    const t = R(), y = 1530 + t * 560, x = 2478 + (R() - .5) * (70 + t * 380);
    if (inTitle2(x, y)) continue;
    reserve(ctx, ellipse(x, y, 18 + t * 66, 3 + t * 3, 20), .10 + .13 * t, 10, i + 900);
  }
  for (let i = 0; i < 9; i++) {
    const y = 1965 + i * 12.6, x = 1200 + (i * 307) % 2000 + Math.sin(i * 2.3) * 80, w = 210 + (i % 5) * 110;
    reserve(ctx, [[x, y], [x + w * .3, y - 11], [x + w, y + 4], [x + w * .55, y + 16], [x + w * .1, y + 12]], .5, 5, i + 40);
  }
  for (let i = 0; i < 6; i++) {
    const y = 1590 + i * 50, x = 1300 + (i * 411) % 1600;
    wash(ctx, [[x, y], [x + 600, y - 7], [x + 680, y + 13], [x + 90, y + 21]], hex('#5e0a10'), { a: .2, j: 34, layers: 1, edge: 0, seed: 1000 + i, freq: .006 });
  }
}
function bandTeal(ctx, y0, y1, colIn, a, seed) {
  const col = typeof colIn === 'string' ? hex(colIn) : colIn;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0)`); g.addColorStop(.55, `rgba(${col[0]},${col[1]},${col[2]},${a})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-40, y0);
  for (let x = -40; x <= W + 40; x += 60) ctx.lineTo(x, y0 + Math.sin(x * .005 + seed) * 8);
  ctx.lineTo(W + 40, y1); ctx.lineTo(-40, y1); ctx.closePath(); ctx.fill(); ctx.restore();
}

function sandA(ctx) {
  grad(ctx, 2112, H - MARG.b + 10, A.sand.map(hex), .93);
  bandTeal(ctx, 2120, 2184, hex('#3d2b1c'), .75, 1110);
  const R = rng(11);
  for (let i = 0; i < 70; i++) { const x = 1180 + R() * 2240, y = 2210 + R() * 600; dab(ctx, x, y, 10 + R() * 26, R() * TAU, mix3(hex('#7d5f3c'), [70, 54, 40], R() * .6), .18 + R() * .18, i + 1100); }
}
function sandB(ctx) {
  grad(ctx, 2112, H - MARG.b + 10, B.sand.map(hex), .95);
  bandTeal(ctx, 2114, 2172, B.wet, .62, 1210);
  const R = rng(13);
  for (let i = 0; i < 90; i++) { const x = 1180 + R() * 2240, y = 2200 + R() * 620; dab(ctx, x, y, 10 + R() * 26, R() * TAU, mix3(hex('#e8ab50'), [186, 120, 52], R()), .18 + R() * .2, i + 1200); }
}

function heads(ctx, pal, mode) {
  ground(ctx, G.lhead, hex(pal.land), .95, 1300, 12);
  ground(ctx, G.rhead, hex(pal.land), .95, 1301, 12);
  wash(ctx, [[1120, 1760], [1240, 2280], [1160, 2880], [980, 2880], [980, 2200]], hex(pal.landD), { a: .55, j: 16, edge: 0, seed: 1302, freq: .008 });
  wash(ctx, [[3560, 2400], [3760, 2880], [3480, 2880]], hex(pal.landD), { a: .5, j: 14, edge: 0, seed: 1303, freq: .008 });
  // 岬上的灌丛：一层叶
  const R = rng(17);
  for (let i = 0; i < 150; i++) {
    const x = (i % 2 ? 3480 + R() * 1600 : 1010 + R() * 330), y = (i % 2 ? 2000 + R() * 720 : 1900 + R() * 500);
    dab(ctx, x, y, 14 + R() * 38, R() * TAU, mix3(hex(pal.pine), hex(pal.pine2), R()), .2 + R() * .2, i + 1400);
  }
  for (const t of G.pines) {
    wash(ctx, [[t.x - 16, t.y], [t.x + 14, t.y - t.h + 60], [t.x + 26, t.y - t.h + 70], [t.x + 4, t.y]], hex(pal.wood), { a: .92, j: 5, layers: 2, edge: .3, seed: (t.x | 0) });
    foliage(ctx, t.crown.map(([x, y, r]) => ({ x, y, r })), {
      seed: (t.x | 0) + 3, dens: 1.05, base: mode === 'A' ? 1.15 : 1.25, scale: .95,
      pal: mode === 'A'
        ? { sun: hex('#4a6a5a'), light: hex(pal.pine2), mid: hex(pal.pine), dark: hex('#0a1c22'), deep: hex('#060f12') }
        : { sun: hex(pal.pineLit), light: hex('#a8de24'), mid: hex(pal.pine2), dark: hex(pal.pine), deep: hex('#04140e') },
    });
    // B：树冠不是绿的，是被红光从侧后咬住的——林子的边上一律染红
    if (mode === 'B') {
      wash(ctx, ellipse(t.x + t.h * .10, t.y - t.h + 96, t.h * .30, t.h * .34, 22), hex('#c8001e'), { a: .26, j: 20, edge: 0, seed: (t.x | 0) + 9 });
      wash(ctx, ellipse(t.x - t.h * .08, t.y - t.h + 40, t.h * .26, t.h * .22, 18), hex('#ff5a2a'), { a: .18, j: 16, edge: 0, seed: (t.x | 0) + 11 });
    }
  }
  // B：岬角不是一块绿板——光只落在朝上那一小撮，往下全沉进墨黑，绿收成几簇亮点
  if (mode === 'B') {
    const bbox = poly => { const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
    const darkDown = (poly, aBot) => {
      const [x0, y0, x1, y1] = bbox(poly);
      ctx.save(); ctx.beginPath();
      poly.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(6,26,20,0)');
      g.addColorStop(.36, 'rgba(6,22,18,.26)');
      g.addColorStop(.70, 'rgba(4,16,14,.58)');
      g.addColorStop(1, `rgba(3,10,10,${aBot})`);
      ctx.fillStyle = g; ctx.fillRect(x0 - 20, y0 - 20, x1 - x0 + 40, y1 - y0 + 40);
      ctx.restore();
    };
    const topAt = (poly, x) => {          // 岬的顶边（朝海那条棱）在某个 x 上的高度
      let best = null;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        if (a[0] !== b[0] && (a[0] - x) * (b[0] - x) <= 0) {
          const y = lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
          if (best === null || y < best) best = y;
        }
      }
      return best;
    };
    // 先压暗：右岬整个往下沉，左岬留一点亮（那里还有一盏窗）
    const [lx0, , lx1] = bbox(G.lhead), [rx0, , rx1] = bbox(G.rhead);
    darkDown(G.rhead, .95); darkDown(G.lhead, .88);
    // 再收绿：亮酸绿只点在最上面那一两层，越往下越稀、越暗
    const R2 = rng(23);
    for (let i = 0; i < 58; i++) {
      const right = i % 2 === 0;
      const x = right ? rx0 + 40 + R2() * (rx1 - rx0 - 140) : 620 + R2() * 420;
      const top = topAt(right ? G.rhead : G.lhead, x);
      if (top === null) continue;
      const drop = Math.pow(R2(), 1.7);
      const y = top + 22 + drop * 260;
      const fade = 1 - drop * .95;
      // 亮绿不许爬到树冠上：那里已经有自己的光，再点就成霜了
      if (G.pines.some(t => Math.abs(x - t.x) < t.h * .50 && y < t.y - t.h * .10)) continue;
      const c = mix3(hex('#b8ec1e'), hex(pal.pine2), R2() * .55);
      dab(ctx, x, y, 15 + R2() * 42, R2() * TAU, c, (.30 + R2() * .34) * fade, i + 2300);
      if (i % 4 === 0) dab(ctx, x + 6, y - 10, 9 + R2() * 14, R2() * TAU, hex('#e8ff7a'), .26 * fade, i + 2400);
    }
  }
}

function villa(ctx, pal, mode) {
  const v = G.villa, x0 = v.x - v.w / 2, y1 = v.y, y0 = v.y - v.h;
  ground(ctx, [[x0, y0], [x0 + v.w, y0], [x0 + v.w, y1], [x0, y1]], hex(pal.villa), .95, 1500, 6);
  wash(ctx, [[x0 + v.w * .72, y0], [x0 + v.w, y0], [x0 + v.w, y1], [x0 + v.w * .7, y1]], hex(pal.villaD), { a: .85, j: 5, layers: 2, edge: 0, seed: 1501 });
  const roof = [[x0 - 40, y0 + 6], [x0 + v.w * .3, y0 - v.roofH], [x0 + v.w * .76, y0 - v.roofH], [x0 + v.w + 40, y0 + 6]];
  ground(ctx, roof, hex(pal.roof), .95, 1502, 6);
  wash(ctx, [[x0 + v.w * .3, y0 - v.roofH], [x0 + v.w * .76, y0 - v.roofH], [x0 + v.w * .7, y0 - v.roofH * .5], [x0 + v.w * .36, y0 - v.roofH * .5]], hex(pal.pine), { a: .35, j: 4, edge: 0, seed: 1503 });
  ground(ctx, [[x0 + v.w * .86, y0 - v.roofH * .9], [x0 + v.w * .96, y0 - v.roofH * .9], [x0 + v.w * .96, y0 + 4], [x0 + v.w * .86, y0 + 4]], hex(pal.brick), .9, 1504, 3);
  const wins = [[x0 + v.w * .12, y0 + 44, 74, 92], [x0 + v.w * .40, y0 + 44, 74, 92], [x0 + v.w * .66, y0 + 44, 58, 92]];
  wins.forEach(([x, y, w, h], i) => {
    reserve(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], .97, 3, 1510 + i);
    wash(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], hex(pal.win), { a: mode === 'A' ? .9 : .55, j: 3, layers: 2, edge: .25, seed: 1511 + i });
  });
  if (mode === 'A') {
    for (const [x, y, w, h] of wins) wash(ctx, ellipse(x + w / 2, y + h / 2, w * 3.4, h * 2.6, 20), hex(pal.win), { a: .24, j: 26, edge: 0, seed: (x | 0) + 7 });
    // 墙上再压一道冷蓝：房子是被两盏灯夹着的，不是一块平板
    wash(ctx, [[x0, y0], [x0 + v.w * .5, y0], [x0 + v.w * .34, y1], [x0, y1]], hex('#2a3ba0'), { a: .26, j: 6, layers: 2, edge: 0, seed: 1524 });
  }
  // B：白墙在铅黄里从来不是白的——左上打一道黄片光，右下角沉进紫红
  if (mode === 'B') {
    wash(ctx, [[x0, y0], [x0 + v.w * .74, y0], [x0 + v.w * .52, y1], [x0, y1]], hex('#ffd24a'), { a: .34, j: 6, layers: 2, edge: .2, seed: 1520, freq: .006 });
    wash(ctx, [[x0 + v.w * .55, y0], [x0 + v.w, y0], [x0 + v.w, y1], [x0 + v.w * .40, y1]], hex(pal.villaD), { a: .6, j: 6, layers: 2, edge: 0, seed: 1521 });
    for (const [x, y, w, h] of wins) wash(ctx, ellipse(x + w / 2, y + h / 2, w * 2.6, h * 2.0, 18), hex('#ffbe3a'), { a: .34, j: 18, edge: 0, seed: (x | 0) + 21 });
    // 屋顶的血红被天光压一下，只在檐口留亮
    wash(ctx, [[x0 - 30, y0 + 4], [x0 + v.w + 30, y0 + 4], [x0 + v.w + 26, y0 + 18], [x0 - 26, y0 + 18]], hex('#ff5a2a'), { a: .35, j: 5, edge: .2, seed: 1522 });
  }
}

function pier(ctx, pal) {
  ground(ctx, [G.pier.at(0, -59), G.pier.at(1, -59), G.pier.at(1, 59), G.pier.at(0, 59)], hex(pal.wood), .93, 1600, 8);
  const R = rng(19);
  for (const p of G.planks) wash(ctx, p, mix3(hex(pal.wood), hex(pal.woodD), .2 + R() * .5), { a: .5, j: 3, layers: 1, edge: .2, seed: (p[0][0] | 0) + 50 });
  for (const p of G.posts) wash(ctx, p, hex(pal.woodD), { a: .92, j: 4, layers: 2, edge: .25, seed: (p[0][0] | 0) });
  wash(ctx, [[G.pier.at(0, 59)[0] - 20, G.pier.at(0, 59)[1] + 20], [G.pier.at(1, 59)[0] - 10, G.pier.at(1, 59)[1] + 30], [G.pier.at(1, 59)[0] + 40, G.pier.at(1, 59)[1] + 120], [G.pier.at(0, 59)[0] + 30, G.pier.at(0, 59)[1] + 140]], hex(pal.woodD), { a: .4, j: 12, edge: 0, seed: 1610, freq: .008 });
}

function boat(ctx, pal) {
  const b = G.boat, x = b.x, y = b.y, w = b.w, h = b.h;
  const hull = [[x - w / 2, y - h * .34], [x - w * .3, y + h * .3], [x + w * .3, y + h * .42], [x + w / 2, y - h * .3], [x + w * .34, y - h * .52], [x - w * .34, y - h * .5]];
  ground(ctx, hull, hex(pal.hull), .92, 1700, 5);
  wash(ctx, [[x - w * .42, y - h * .06], [x + w * .42, y - h * .1], [x + w * .4, y + h * .2], [x - w * .4, y + h * .16]], hex(pal.trim), { a: .72, j: 4, edge: 0, seed: 1701 });
  wash(ctx, [[x - w * .32, y - h * .12], [x + w * .32, y - h * .16], [x + w * .26, y + h * .14], [x - w * .26, y + h * .16]], mix3(hex(pal.hull), [40, 26, 16], .5), { a: .55, j: 3, edge: 0, seed: 1702 });
}

export const KILLER = { skin: hex('#d9b596'), top: hex('#150e22'), bottom: hex('#100c1a'), hair: hex('#191410'), shoe: hex('#100c18'), sleeve: 'long' };
const VICTIM = { skin: hex('#f2c39a'), top: hex('#d0202a'), bottom: hex('#1e2a80'), hair: hex('#2a2018'), shoe: hex('#1a1220') };

function bodies(ctx, pal) {
  for (const b of G.bodies) {
    const s = b.s * 210, d = b.d;
    // 贴地的影：人不是浮在沙上的
    wash(ctx, ellipse(b.x - 10 * d, b.y + 26, 200 * b.s, 46 * b.s, 26), hex(pal.bloodD), { a: .34, j: 22, layers: 2, edge: 0, seed: (b.x | 0) + 84, freq: .01 });
    wash(ctx, ellipse(b.x + 40 * d, b.y + 20, 168 * b.s, 56 * b.s, 20), hex(pal.blood), { a: .66, j: 10, layers: 2, edge: .45, seed: (b.x | 0) + 80, freq: .012 });
    wash(ctx, ellipse(b.x + 34 * d, b.y + 14, 96 * b.s, 32 * b.s, 18), hex(pal.bloodD), { a: .5, j: 7, edge: .25, seed: (b.x | 0) + 81 });
  }
}

function maskman(ctx, pal) {
  const m = G.maskman, x = m.x, y = m.y, h = m.h;
  const coat = [[x - 34, y - h * .78], [x - 30, y - h * .58], [x - 40, y - h * .12], [x + 40, y - h * .12], [x + 32, y - h * .58], [x + 34, y - h * .78]];
  ground(ctx, coat, hex('#150e22'), .92, 1800, 6);
  wash(ctx, [[x - 30, y - h * .74], [x - 6, y - h * .74], [x - 4, y - h * .14], [x - 32, y - h * .14]], hex('#1e3fbe'), { a: .3, j: 5, layers: 2, edge: 0, seed: 1805 });
  wash(ctx, [[x + 8, y - h * .74], [x + 30, y - h * .72], [x + 36, y - h * .14], [x + 12, y - h * .14]], hex('#d0092c'), { a: .34, j: 5, layers: 2, edge: 0, seed: 1806 });
  const mask = ellipse(x + 2, y - h * .91, 23, 29, 16);
  reserve(ctx, mask, .98, 3, 1801);
  wash(ctx, mask, hex('#d9dfe2'), { a: .28, j: 3, layers: 2, edge: .3, seed: 1802 });
  wash(ctx, ellipse(x + 10, y - h * .95, 14, 12, 12), hex('#ffc21e'), { a: .46, j: 6, edge: 0, seed: 1803 });
}

function pile(ctx, pal, mode) {
  const p = G.pile;
  if (mode === 'A') {
    for (let k = 3; k >= 0; k--) wash(ctx, ellipse(p.x, p.y - 10, 250 - k * 44, 145 - k * 24, 18), hex('#ff7a26'), { a: .1 + k * .035, j: 40, layers: 1, edge: 0, seed: 1900 + k, freq: .006 });
  } else {
    wash(ctx, ellipse(p.x, p.y + 26, 140, 56, 16), hex('#a35a24'), { a: .5, j: 10, edge: .2, seed: 1920 });
  }
  for (let k = 0; k < 3; k++) {
    wash(ctx, [[p.x - 92 + k * 12, p.y + 14], [p.x + 86 - k * 10, p.y - 16 + k * 10], [p.x + 92 - k * 10, p.y + 4 + k * 10], [p.x - 86 + k * 12, p.y + 30]], hex(mode === 'A' ? '#3a2214' : '#7a4522'), { a: .7, j: 5, layers: 1, edge: .2, seed: 1930 + k });
  }
  if (mode === 'A') {
    wash(ctx, [[p.x - 12, p.y + 2], [p.x + 2, p.y - 84], [p.x + 24, p.y - 26], [p.x + 16, p.y + 4]], hex('#ffc247'), { a: .78, j: 8, layers: 2, edge: .2, seed: 1910 });
    wash(ctx, ellipse(p.x + 2, p.y - 14, 14, 40, 12), hex('#fff0b0'), { a: .5, j: 5, edge: 0, seed: 1911 });
  }
}

function reedsC(ctx, pal) {
  for (const [x, y, h, lean] of G.reeds) {
    wash(ctx, [[x - 3, y], [x + lean * h * .45 - 4, y - h * .5], [x + lean * h + 1, y - h], [x + lean * h + 10, y - h + 8], [x + lean * h * .45 + 6, y - h * .5 + 4], [x + 4, y]], hex(pal.reed), { a: .45, j: 2, layers: 1, edge: 0, seed: (x | 0) + 30 });
  }
}

function giallo(ctx) { bandTeal(ctx, HZ - 130, HZ + 30, hex('#ffc400'), .45, 2000); }

// —— 线稿 ——
export function buildWorld() {
  buildGeom();
  const path = pagePath();
  const [colorC, cx] = cv(W, H, '#fff');
  const [colorD, cx2] = cv(W, H, '#fff');
  const [inkC, ia] = cv(W, H), [timeC, ta] = cv(W, H, '#fff');
  ta.globalCompositeOperation = 'darken';
  const strokes = [];

  // A 夜湖
  clipPage(cx, path);
  skyA(cx); seaA(cx); sandA(cx);
  heads(cx, { land: A.land, landD: A.landD, pine: A.pine, pine2: A.pine2, pineLit: A.pineLit, wood: A.wood, reed: '#25443a' }, 'A');
  villa(cx, A, 'A'); bodies(cx, A); boat(cx, A); pile(cx, A, 'A'); pier(cx, A); reedsC(cx, { reed: '#33462f' });
  cx.restore();

  // B 血海（同形状，浓彩）
  clipPage(cx2, path);
  skyB(cx2); seaB(cx2); sandB(cx2);
  heads(cx2, { land: B.land, landD: B.landD, pine: B.pine, pine2: B.pine2, pineLit: B.pineLit, wood: B.wood, reed: '#4d7a2c' }, 'B');
  villa(cx2, B, 'B'); bodies(cx2, B); boat(cx2, B); pile(cx2, B, 'B'); pier(cx2, B); reedsC(cx2, { reed: '#4d7a2c' });
  giallo(cx2);
  cx2.restore();

  // —— 人：用骨架投影，两张色版共用同一副身子、同一根线 ——
  const T0_V = 2.95, T0_K = 2.02;
  const VPOSE = [
    { ...prone(.12), twist: .18, headYaw: .28 },
    { ...prone(.55), twist: -.4, headYaw: -.5, legL: .34, kneeL: 1.25 },
    { ...prone(.0), twist: .5, headYaw: .55, armL: -.55, legR: .26 },
  ];
  const victims = G.bodies.map((b, k) => ({
    prims: figure(VICTIM, VPOSE[k], { x: b.x, y: b.y, S: b.s * 216, yaw: (1.02 + k * .16) * b.d }, { seed: 1900 + k }),
    t0: T0_V + k * .10,
  }));
  const killer = { prims: figure(KILLER, stand({ lean: .04, headYaw: .1, armL: .18, armR: -.12 }), { x: G.maskman.x, y: G.maskman.y, S: G.maskman.h, yaw: Math.PI }, { seed: 2000 }), t0: T0_K };
  for (const c of [cx, cx2]) clipPage(c, path);
  for (const f of victims) {
    for (const c of [cx, cx2]) drawPrims(c, f.prims.filter(p => p.k !== 'ink'), { color: 1 });
  }
  cx.restore(); cx2.restore();

  // —— 线 ——
  const pen = (pts, o = {}, t0 = 0, dur) => {
    const st = penStroke(pts, o); if (st.P.length < 2) return st;
    const d = dur ?? clamp(st.L / 2200, .05, .34);
    rasterPen(ia, ta, st, t0, d, WIN_A); strokes.push([+t0.toFixed(3), +d.toFixed(3), Math.round(st.L), 0]);
    return st;
  };
  const O = { w: 3.0, wob: 1.5, over: 7 };

  pen([[110, HZ - 6], [1200, HZ + 2], [2400, HZ - 3], [3500, HZ + 1], [4980, HZ - 5]], { ...O, gap: .5 }, .04, .28);
  // 远的岬与镇
  pen([[3520, HZ], [3600, 1440], [3740, 1408], [3900, 1452], [4020, 1420], [4180, 1456], [4340, 1426], [4520, 1462]], { ...O, w: 2.3 }, .14, .16);
  pen([[2360, HZ], [2460, 1466], [2560, HZ]], { ...O, w: 2.2 }, .20, .08);
  pen([[2620, HZ], [2700, 1472], [2790, HZ]], { ...O, w: 2.0 }, .24, .06);
  pen([[3060, HZ], [3062, 1404], [3116, 1404], [3118, HZ]], { ...O, w: 2.2, gap: .6 }, .28, .10);
  pen([[3054, 1404], [3088, 1348], [3122, 1404]], { ...O, w: 2.2 }, .32, .06);
  for (let i = 0; i < 6; i++) { const x = 2880 + i * 46; pen([[x, HZ], [x + 4, HZ - 40 - (i % 3) * 12], [x + 44, HZ - 42]], { ...O, w: 1.9 }, .33 + i * .015, .05); }
  // 水：一排水纹（短笔，不成直线）
  const bands = [1556, 1636, 1730, 1836, 1950, 2044, 2096];
  const RW = rng(51);
  bands.forEach((y, k) => {
    for (let i = 0; i < 7; i++) {
      const x0 = 1160 + ((i * 340 + k * 190) % 1900) + RW() * 120, w = 150 + RW() * 260;
      const pts = []; for (let x = x0; x <= x0 + w; x += 26) pts.push([x, y + Math.sin((x - x0) * .018 + i * 2) * (3.5 + k * .4) + RW() * 1.5]);
      if (pts[pts.length - 1][0] - x0 < 60) continue;
      pen(pts, { ...O, w: 2.3, wob: 1.1, gap: .3 }, .36 + k * .055 + i * .018, .10);
    }
  });
  // 半沉的日／月
  const orb = G.orb, orbY = HZ - 186, orbP = [];
  for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU; orbP.push([orb.x + Math.cos(a) * orb.r, orbY + Math.sin(a) * orb.r * .92]); }
  pen([...orbP, orbP[0]], { ...O, w: 2.6, gap: .25 }, .46, .18);
  // 右岬
  pen(G.rhead.slice(0, 7), { ...O, w: 3.2, gap: .4 }, .52, .24);
  // 松
  G.pines.forEach((t, k) => {
    pen([[t.x - 8, t.y], [t.x - 2, t.y - t.h * .55], [t.x + 10, t.y - t.h + 70]], { ...O, w: 3.0 }, .62 + k * .06, .11);
    pen([[t.x + 4, t.y - 6], [t.x + 16, t.y - t.h * .4], [t.x + 24, t.y - t.h + 90]], { ...O, w: 2.2 }, .67 + k * .06, .07);
    t.crown.forEach(([cxx, cyy, r], j) => {
      const pts = []; const n = 16;
      for (let i = 0; i <= n; i++) { const a = i / n * TAU; const rr = r * (a > Math.PI ? 1 : .82) * (.86 + .22 * n2(i * .7 + j, k, 3)); pts.push([cxx + Math.cos(a) * rr, cyy + Math.sin(a) * rr * .52]); }
      pen(pts, { ...O, w: 2.5, wob: 1.8, over: 4, gap: .5 }, .72 + k * .06 + j * .03, .12);
      for (let i = 0; i < 3; i++) { const a = -.8 + i * .55; pen([[t.x + 12, t.y - t.h * .72], [cxx + Math.cos(a) * r * .5, cyy + Math.sin(a) * r * .2]], { ...O, w: 1.8, over: 2 }, .78 + k * .06 + i * .02, .05); }
    });
  });
  // 左岬
  pen(G.lhead.slice(0, 9), { ...O, w: 3.2, gap: .4 }, .72, .22);
  // 别墅
  const v = G.villa, x0 = v.x - v.w / 2, y1 = v.y, y0 = v.y - v.h;
  pen([[x0, y1], [x0, y0], [x0 + v.w, y0], [x0 + v.w, y1]], { ...O, w: 3.0, gap: .4 }, 1.52, .14);
  pen([[x0 - 40, y0 + 6], [x0 + v.w * .3, y0 - v.roofH], [x0 + v.w * .76, y0 - v.roofH], [x0 + v.w + 40, y0 + 6]], { ...O, w: 3.2, over: 9 }, 1.62, .13);
  pen([[x0 + v.w * .3, y0 - v.roofH], [x0 + v.w * .72, y0 - v.roofH]], { ...O, w: 2.2 }, 1.70, .05);
  pen([[x0 + v.w * .86, y0 - v.roofH * .9], [x0 + v.w * .86, y0 + 4], [x0 + v.w * .96, y0 + 4], [x0 + v.w * .96, y0 - v.roofH * .9]], { ...O, w: 2.2 }, 1.74, .07);
  [[.12, 44, 74, 92], [.40, 44, 74, 92], [.66, 44, 58, 92]].forEach(([u, dy, ww, hh], i) => {
    pen([[x0 + v.w * u, y0 + dy], [x0 + v.w * u + ww, y0 + dy], [x0 + v.w * u + ww, y0 + dy + hh], [x0 + v.w * u, y0 + dy + hh]], { ...O, w: 2.1, gap: .5 }, 1.78 + i * .02, .05);
  });
  // 栈桥
  pen([G.pier.at(0, -59), G.pier.at(1, -59)], { ...O, w: 3.2, over: 10 }, 1.96, .20);
  pen([G.pier.at(0, 59), G.pier.at(1, 59)], { ...O, w: 3.2, over: 10 }, 1.99, .20);
  for (const p of G.planks) pen([p[0], p[3]], { ...O, w: 1.9, over: 3, wob: .8 }, 2.01 + (p[0][0] % 300) / 300 * .22, .035);
  for (const p of G.posts) { pen([[p[0][0], p[0][1]], [p[3][0], p[3][1]]], { ...O, w: 2.6 }, 2.18, .05); pen([[p[1][0], p[1][1]], [p[2][0], p[2][1]]], { ...O, w: 2.2 }, 2.20, .05); }
  // （面具人改由 film.js 每帧画：他要走动、要挥刀）
  const my = G.maskman.y, mh = G.maskman.h, mx = G.maskman.x;
  // 小船
  const bo = G.boat, bx = bo.x, by = bo.y, bw = bo.w, bh = bo.h;
  pen([[bx - bw / 2, by - bh * .34], [bx - bw * .3, by + bh * .3], [bx + bw * .3, by + bh * .42], [bx + bw / 2, by - bh * .3]], { ...O, w: 2.8, gap: .4 }, 3.62, .11);
  pen([[bx - bw * .34, by - bh * .5], [bx + bw * .34, by - bh * .52]], { ...O, w: 2.0 }, 3.68, .05);
  pen([[bx - bw * .18, by - bh * .48], [bx - bw * .16, by + bh * .2]], { ...O, w: 1.8 }, 3.71, .03);
  // 火堆／浮木
  const pi = G.pile;
  pen([[pi.x - 92, pi.y + 26], [pi.x - 10, pi.y - 30], [pi.x + 88, pi.y + 8]], { ...O, w: 2.4 }, 3.78, .06);
  pen([[pi.x - 84, pi.y - 8], [pi.x + 4, pi.y + 22], [pi.x + 86, pi.y - 22]], { ...O, w: 2.0 }, 3.81, .06);
  // 芦苇
  for (const [rx, ry, rh, lean] of G.reeds) pen([[rx, ry], [rx + lean * rh * .45, ry - rh * .55], [rx + lean * rh, ry - rh]], { ...O, w: 1.7, wob: .7, over: 2 }, 3.92 + (rx % 200) / 200 * .38, .04);
  // 沙纹
  for (let i = 0; i < 5; i++) pen([[1240 + i * 40, 2230 + i * 120], [1620 + i * 30, 2218 + i * 118], [2020, 2244 + i * 116]], { ...O, w: 1.6, wob: .9 }, 4.58 + i * .02, .06);

  // 人身上的线最后走：先把身子那块纸上的背景线擦掉，再画人自己的线
  for (const cc of [ia, ta]) {
    cc.save(); cc.globalCompositeOperation = 'destination-out'; cc.fillStyle = '#000';
    const cap = (x, y, rx, ry) => { cc.beginPath(); cc.ellipse(x, y, rx, ry, 0, 0, TAU); cc.fill(); };
    for (const b of G.bodies) cap(b.x, b.y - 20, b.s * 210 * 1.35, b.s * 210 * .62);
    cc.restore();
  }
  for (const f of victims) {
    const inks = f.prims.filter(p => p.k === 'ink');
    inks.forEach((p, i) => rasterPen(ia, ta, p.st, f.t0 + i * .010, .075, WIN_A));
  }

  // 线也裁到页边：用一条白路径做 destination-in
  const maskC = document.createElement('canvas'); maskC.width = W; maskC.height = H;
  const mc = maskC.getContext('2d'); mc.fillStyle = '#fff';
  mc.beginPath(); path.forEach(([x, y], i) => i ? mc.lineTo(x, y) : mc.moveTo(x, y)); mc.closePath(); mc.fill();
  ia.save(); ia.globalCompositeOperation = 'destination-in'; ia.drawImage(maskC, 0, 0); ia.restore();
  // 页脚/页边的墨线一起断掉一点，别整齐
  ia.save(); ia.globalCompositeOperation = 'destination-out'; ia.fillStyle = '#000';
  const R3 = rng(303);
  for (let i = 0; i < 260; i++) {
    const side = i % 4, t = R3();
    const x = side < 2 ? MARG.l + t * (W - MARG.l - MARG.r) : (side === 2 ? MARG.l - 6 : W - MARG.r + 6);
    const y = side < 2 ? (side === 0 ? MARG.t - 6 : H - MARG.b + 6) : MARG.t + t * (H - MARG.t - MARG.b);
    ia.beginPath(); ia.ellipse(x + (R3() - .5) * 60, y + (R3() - .5) * 40, 5 + R3() * 14, 4 + R3() * 10, R3() * TAU, 0, TAU); ia.fill();
  }
  ia.restore();

  return {
    W, H, winA: WIN_A, winB: [0, 1],
    color: colorC, color2: colorD,
    ink: pack(ia), time: packT(ta),
    strokes, G, A, B,
  };
}

function pack(c) {
  const out = new Uint8Array(W * H * 4), A = c.getImageData(0, 0, W, H).data;
  for (let i = 0, n = W * H; i < n; i++) { out[i * 4] = A[i * 4 + 3]; out[i * 4 + 3] = 255; }
  return out;
}
function packT(c) {
  const out = new Uint8Array(W * H * 4), A = c.getImageData(0, 0, W, H).data;
  for (let i = 0, n = W * H; i < n; i++) { const v = A[i * 4]; out[i * 4] = v; out[i * 4 + 1] = v; out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
  return out;
}
