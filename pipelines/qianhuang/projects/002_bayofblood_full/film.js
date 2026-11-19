// 血之海滩 · 全片（3:39）
// 0–21.46  第一大段：一页速写、两遍套色（样片已在 001 定版，这里原样保留）
// 21.48–   往后十三个自然段，每一段都是"切到另一张小画"：卡片贴在页上，两盏灯照样从外面打进来
import { clamp, lerp, ss, TAU, rng, n2, fbm, hex, mix3, INK, PAPER, rgba, rough, arrivalField, sampleField, compositor, figure, drawPrims, penStroke, drawPen, dab, handwrite, ellipse, projector, skeleton, R3 } from './engine.js';
import { LOOK, stand, walk } from './poses.js';
import { buildWorld, W, H, HZ, WIN_A, KILLER } from './world.js';
import { cards, preloadCast, preloadCards, CAST } from './cards.js';

const seg = (t, a, b) => clamp((t - a) / ((b - a) || 1e-6));
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };

// 字体必须先要一遍，否则 canvas 拿到的是替代字（document.fonts.ready 不会主动拉没被用过的字）
await Promise.all([
  '118px Caveat', '62px Caveat', '58px LongCang', '92px LongCang', '44px MaShanZheng',
].map(f => document.fonts.load(f).catch(() => null)));
await document.fonts.ready;
const DUR = 219.48;
// 立绘要先解码好——世界层里沙滩上的三具女尸是直接贴位图的，buildWorld 不能跑在图片之前
await Promise.all([preloadCast(), preloadCards()]);
const world = buildWorld();

// ---------------- 颜色什么时候到 ----------------
const src = [
  { x: 790, y: 1930, t: 0.24, v: 760, R: 620 },                 // 房子与左岬：起笔的地方先着色
  { x: 1120, y: 2100, t: 0.44, v: 760, R: 680 },                // 栈桥
  { x: 3810, y: 1760, t: 0.34, v: 760, R: 780 },                // 右岬的松
  { x: 2500, y: 900, t: 0.52, v: 1500, R: 2200, sy: .85 },      // 天（从月亮那片光开始）
  { x: 2400, y: 1830, t: 0.70, v: 1300, R: 1900, sy: .8 },      // 水
  { x: 2200, y: 2600, t: 0.96, v: 1300, R: 1600 },              // 沙
  { x: 2560, y: 1440, t: 1.30, v: 2000, R: 1e5 },               // 全页收尾
  { x: 2560, y: 1440, t: 2.05, v: 2600, R: 1e5 },
];
const GW = 640, GH = 360;
const arr = arrivalField(W, H, GW, GH, src, { amp: 130 });
const T = (x, y) => sampleField(arr, W, H, GW, GH, x, y);

// ---------------- 分镜：一段一个镜头，硬切，机位钉死 ----------------
// 单镜 2.0–2.3 s，按口播内容切；一个镜头里只有水在动、云在动、人在动，镜头不再游走
const SHOTS = [
  // 你看过《十三号星期五》吗 / 湖边营地 —— 全湾建立
  { t0: 0.00, t1: 2.25, cam: [1400, 2040, .74], cut: -1e5, stars: 1, crush: .85, fg: 'reeds', shade: [200, 60, 1800, 980, .3], beams: [[-200,-150,.62,.19,2700,'blue',.34],[2120,-100,2.52,.15,2500,'green',.20],[1920,1180,-2.02,.13,2400,'red',.13]], taint: [180,230,460,320,.2], mv: [70, 40, 1.10] },
  // 戴面具的杰森 / 一个接一个倒下的年轻人 —— 他走进三具尸体
  { t0: 2.25, t1: 4.35, cam: [1760, 2020, .80], cut: -1e5, stars: 1, crush: .85, fg: 'reeds', shade: [200, 60, 1800, 980, .3], beams: [[-200,-150,.62,.19,2700,'blue',.34],[2120,1180,-2.30,.15,2400,'red',.24]], taint: [140,250,440,300,.2], mv: [150, 20, 1.06], jason: { x0: 1596, x1: 1836, walk: 1 } },
  // 多少人童年的阴影 —— 面具与刀，血色的光从底下打上来，百叶窗的影子压在脸上
  { t0: 4.35, t1: 6.42, cam: [1880, 2050, 1.90], cut: -1e5, vig: 1, crush: 1, fg: 'branch', shade: [260, 0, 1800, 1000, .32], blinds: 1, blindsX: 300, blindsY: 90, blindsR: -.44, hero: [950,430,330], beams: [[-160,-200,.58,.24,2700,'red',.44],[2140,180,2.85,.18,2300,'blue',.32]], taint: [1180,620,760,470,.24], mv: [0, -30, 1.24, .030], snap: [5.16, .16, .13], jason: { x0: 1876, walk: 0 } },
  // 但你不知道的是 / 这部片子是抄的 —— 第二遍套色从地平线漫开
  { t0: 6.42, t1: 8.45, cam: [2510, 1580, .56], cut: 'reveal', trace: 1, crush: .8, shade: [140, 20, 1840, 900, .26], beams: [[-180,1240,-.52,.22,2700,'red',.30],[2160,-140,2.34,.17,2500,'blue',.22]], taint: [1300,700,700,420,.22], mv: [90, 70, 1.06] },
  // 它抄的那部原版 —— 同一张画，两枚印张并排
  { t0: 8.45, t1: 10.60, cam: [2450, 1750, .40], cut: null, split: 1, mv: [0, 0, 1.04] },
  // 是一部一九七一年的 / 意大利老片 —— 血色的海湾
  { t0: 10.60, t1: 12.80, cam: [2150, 1750, .62], cut: 1e5, crush: .9, fg: 'reeds', fgX: 1500, fgH: 120, shade: [120, 40, 1820, 940, .26], hero: [960,900,420], beams: [[-200,1250,-.50,.23,2700,'red',.32],[2150,-150,2.24,.20,2600,'blue',.34]], taint: [1320,760,640,380,.2], mv: [-150, 10, 1.07] },
  // 《血之海滩》/ 铅黄名导马里奥·巴瓦 —— 片名写下去，巴瓦推着机器入画
  { t0: 12.80, t1: 15.00, cam: [2700, 1850, .62], cut: 1e5, title: 1, bava: 1, crush: .78, fg: 'branch', shade: [200, 0, 1860, 820, .22], hero: [900,480,400], beams: [[-180,-160,.60,.22,2700,'blue',.30],[2160,1220,-2.36,.20,2600,'red',.30]], taint: [1240,120,720,430,.22], mv: [-10, -22, 1.09] },
  // 我为了做这一期 / 把这部老片翻出来 —— 胶片盘特写
  { t0: 15.00, t1: 17.30, cam: [782, 760, 1.30], cut: 1e5, reel: 1, crush: 1, shade: [0, 0, 1920, 1080, .22], hero: [905,330,360], beams: [[-200,-180,.62,.24,2800,'blue',.38],[2140,1200,-2.30,.19,2500,'acid',.24]], taint: [1180,400,600,360,.18], mv: [26, -18, 1.22, -.058] },
  // 又盘了好几遍 / 越盘越觉得 —— 血泊与尸体近景
  { t0: 17.30, t1: 19.40, cam: [2150, 2215, 1.08], cut: 1e5, crush: .95, fg: 'reeds', shade: [60, 0, 1740, 1080, .3], hero: [790,300,270], beams: [[-180,-200,.60,.24,2800,'red',.38],[2150,140,2.88,.18,2400,'blue',.28]], taint: [1260,660,700,440,.24], mv: [-110, -14, 1.09], jason: { x0: 1985, walk: 0 } },
  // 后来的恐怖片 / 全都欠它一句谢谢 —— 整页
  { t0: 19.40, t1: 21.46, cam: [2560, 1494, .352], cut: 1e5, shade: [150, 20, 1860, 780, .2], beams: [[-200,1240,-.48,.20,2700,'red',.20],[2160,-160,2.30,.16,2600,'blue',.16]], mv: [0, -8, 1.03], jason: { x0: 2050, walk: 0, still: 1 }, all: 1 },
];

// ———— 段 2–13：切到贴在页上的小画（一镜 2–4 秒，硬切，卡片跟着机位一起被两盏灯打） ————
// 六个槽位轮着用，切镜就是换一张画；卡片只在它自己的时间窗里出现
const SLOT = [[1300, 900], [2960, 880], [1300, 2180], [2960, 2200], [3980, 1560], [700, 1560]];
const GELS = [
  [[-200, -160, .60, .22, 2700, 'red', .34], [2160, 1240, -2.34, .18, 2400, 'blue', .30]],
  [[-180, 1200, -.52, .22, 2700, 'blue', .32], [2140, -140, 2.30, .18, 2500, 'acid', .24]],
  [[-200, 1200, -.46, .24, 2800, 'red', .36], [2160, 160, 2.86, .20, 2500, 'green', .22]],
  [[-160, -180, .58, .20, 2700, 'acid', .26], [2150, 1250, -2.28, .20, 2600, 'red', .32]],
];
const C = (t0, t1, id, slot, o = {}) => {
  const [x, y] = SLOT[slot];
  // 卡片是"贴在页上的一张小画"：机位要退到能看见它的纸边（0.94）；
  // 推近最多到 1.09，再近纸边就出画了，整格就退化成一张全屏贴图，风格会散。
  const z = .94 * Math.min((o.z || 1.34) / 1.34, 1.16);
  // 卡片上的色片灯只留一半：浓彩平涂最怕被两盏灯同时冲刷成灰
  const gel = GELS[slot % 4].map(b => [b[0], b[1], b[2], b[3], b[4], b[5], b[6] * .55]);
  const r = { t0, t1, cut: 1e5, crush: .82, shade: [120, 20, 1820, 980, .22],
    cam: [x, y, z], beams: gel, mv: [12, -8, 1.06, .012] };
  if (id) r.card = { id, x, y, t0, t1, seed: 977 * (id.length + slot * 7) };
  return Object.assign(r, o, { cam: o.cam || [x, y, z] });
};
SHOTS.push(
  // 段2 铅黄是什么
  C(21.48, 24.55, null, 0, { cam: [2500, 1980, .58], fg: 'reeds', crush: .86, mv: [70, 30, 1.08] }),
  C(24.55, 27.61, 'cast_jason', 0, { z: 1.30, mv: [30, -10, 1.10, .02] }),
  C(27.61, 30.68, 'cast_girl1', 1, { mv: [-40, 10, 1.08] }),
  C(30.68, 33.74, 'books', 1, { z: 1.46, mv: [10, -18, 1.12, -.02], snap: [31.60, .10, .14] }),
  C(33.74, 36.81, 'books', 4, { z: 1.52, mv: [-60, 0, 1.05] }),
  // 段3 巴瓦
  C(36.83, 39.78, 'portrait', 2, { mv: [0, -14, 1.09] }),
  C(39.78, 42.73, 'portrait', 2, { z: 1.58, mv: [8, -8, 1.10, .015] }),
  C(42.73, 45.69, 'gothic', 3, { mv: [16, 0, 1.07] }),
  C(45.69, 48.64, 'gothic', 3, { z: 1.18, mv: [-20, 0, .97] }),
  C(48.64, 51.59, 'tax', 0, { mv: [-26, 12, 1.09] }),
  C(51.59, 54.54, 'set', 1, { z: 1.28, mv: [40, 0, 1.10, -.02] }),
  // 段4 剧情：地皮、老太、伪造、一刀、十三人
  C(54.56, 58.01, null, 2, { cam: [2600, 1520, .42], crush: .88, mv: [50, 30, 1.06] }),
  C(58.01, 61.46, 'interior', 0, { mv: [-14, -10, 1.10] }),
  C(61.46, 64.92, 'interior', 0, { z: 1.56, mv: [20, -6, 1.08, .02] }),
  C(64.92, 68.37, 'stabbed', 1, { mv: [0, -12, 1.09], snap: [66.10, .12, .14] }),
  C(68.37, 71.82, 'thirteen', 2, { mv: [-30, 0, 1.08] }),
  // 段5 连锁反应、四个年轻人、海里、镰刀
  C(71.84, 75.16, 'chain', 3, { mv: [0, 0, 1.12, .03] }),
  C(75.16, 78.48, 'chain', 3, { z: 1.56, mv: [20, 14, 1.06, -.02] }),
  C(78.48, 81.79, 'cast_girl3', 0, { mv: [50, 0, 1.06] }),
  C(81.79, 85.11, 'swim', 1, { z: 1.30, mv: [-30, 0, 1.10] }),
  C(85.11, 88.43, 'scythe', 2, { mv: [10, 20, 1.12, -.03], snap: [86.60, .10, .13] }),
  // 段6 结尾：夫妻、孩子、没人活着出去
  C(88.45, 91.45, null, 3, { cam: [2200, 2060, .54], fg: 'reeds', crush: .86, mv: [-50, 10, 1.08] }),
  C(91.45, 94.46, 'couple', 0, { mv: [0, -10, 1.09] }),
  C(94.46, 97.46, 'kidsgun', 1, { mv: [-20, 0, 1.10, .02] }),
  C(97.46, 100.47, 'kidsgun', 1, { z: 1.56, mv: [16, 6, 1.06] }),
  C(100.47, 103.47, 'thirteen', 3, { mv: [0, -12, 1.08] }),
  C(103.47, 106.48, 'thirteen', 3, { z: 1.50, mv: [-24, 0, 1.09] }),
  C(106.48, 109.48, 'set', 4, { z: 1.24, mv: [30, 0, 1.07] }),
  // 段7 幕后：自己扛机器、玩具推车、血喷、影院
  C(109.50, 112.67, 'set', 0, { mv: [0, -10, 1.10] }),
  C(112.67, 115.84, 'set', 0, { z: 1.62, mv: [-20, 10, 1.08, -.02] }),
  C(115.84, 119.00, 'set', 4, { z: 1.18, mv: [0, 0, .98] }),
  C(119.00, 122.17, 'fx', 1, { mv: [10, -8, 1.09] }),
  C(122.17, 125.34, 'fx', 1, { z: 1.55, mv: [0, -14, 1.11], snap: [123.70, .12, .13] }),
  C(125.34, 128.51, 'cinema', 2, { mv: [-30, 0, 1.06] }),
  // 段8 沙发音乐、改名海报
  C(128.53, 131.72, 'cast_girl2', 3, { mv: [20, -10, 1.09] }),
  C(131.72, 134.90, 'fx', 0, { z: 1.40, mv: [-16, 0, 1.08, .02] }),
  C(134.90, 138.09, 'cast_girl4', 1, { z: 1.50, mv: [24, 10, 1.07] }),
  C(138.09, 141.28, 'lounge', 1, { z: 1.16, mv: [0, 0, .97] }),
  C(141.28, 144.46, 'poster', 2, { mv: [0, -12, 1.10] }),
  C(144.46, 147.65, 'poster', 2, { z: 1.56, mv: [-20, 0, 1.07, -.02] }),
  // 段9 电影节、克里斯托弗·李
  C(147.67, 150.78, 'festival', 3, { mv: [10, 0, 1.08] }),
  C(150.78, 153.89, 'lee', 0, { mv: [0, -12, 1.09] }),
  C(153.89, 157.01, 'lee', 0, { z: 1.60, mv: [14, -8, 1.08, .02] }),
  C(157.01, 160.12, 'lee', 4, { z: 1.14, mv: [-10, 0, .97] }),
  // 段10 十三号星期五抄了什么
  C(160.14, 163.48, 'f13', 1, { mv: [30, 0, 1.08] }),
  C(163.48, 166.81, 'f13', 1, { z: 1.58, mv: [-20, 10, 1.10], snap: [165.40, .12, .13] }),
  C(166.81, 170.15, 'copy', 2, { mv: [0, 0, 1.09] }),
  { t0: 170.15, t1: 173.48, cam: [2450, 1750, .40], cut: null, split: 1, mv: [0, 0, 1.05] },
  C(173.48, 176.82, 'copy', 3, { z: 1.52, mv: [18, 0, 1.08] }),
  // 段11 八十年代浪潮、百大第 94
  C(176.84, 179.97, 'copy', 0, { z: 1.18, mv: [-14, 0, 1.08] }),
  C(179.97, 183.10, 'killgrid', 1, { mv: [0, -10, 1.09] }),
  C(183.10, 186.24, 'killgrid', 1, { z: 1.52, mv: [12, 8, 1.08, -.02] }),
  C(186.24, 189.37, 'poster', 2, { mv: [-24, 0, 1.08] }),
  C(189.37, 192.50, 'rank', 3, { mv: [0, -10, 1.09] }),
  C(192.50, 195.63, 'rank', 3, { z: 1.62, mv: [10, 0, 1.10, .02], snap: [193.30, .12, .14] }),
  // 段12 到底算不算烂片
  C(195.65, 198.77, 'killgrid', 0, { mv: [0, -8, 1.08] }),
  C(198.77, 201.90, 'thirteen', 1, { mv: [-20, 0, 1.09] }),
  C(201.90, 205.02, 'portrait', 2, { mv: [0, -12, 1.10] }),
  C(205.02, 208.15, 'killgrid', 3, { z: 1.50, mv: [16, 0, 1.07] }),
  C(208.15, 211.27, 'killgrid', 3, { z: 1.14, mv: [-10, 0, .97] }),
  C(211.27, 214.40, 'score', 4, { mv: [0, -10, 1.10] }),
  C(214.40, 217.52, 'score', 4, { z: 1.56, mv: [14, 0, 1.08, -.02] }),
  // 段13 遛狗收尾
  C(217.54, 218.51, 'dog', 0, { mv: [30, 0, 1.06] }),
  { t0: 218.51, t1: 219.48, cam: [2560, 1494, .352], cut: 1e5, shade: [150, 20, 1860, 780, .2],
    beams: [[-200,1240,-.48,.20,2700,'red',.20],[2160,-160,2.30,.16,2600,'blue',.16]], mv: [0, -6, 1.03], all: 1 }
);
const shotAt = t => { let i = 0; while (i < SHOTS.length - 1 && t > SHOTS[i + 1].t0) i++; return SHOTS[i]; };
let SH = SHOTS[0];
let CV = 0;      // 这一镜是几遍色：0 = 冷色（湖边营地），1 = 血海

// 巴瓦的镜头是会动的：慢慢推、横着跟、斜着一压（荷兰角），
// 至于 snap zoom——一下推上去就钉住，不回来，这是他最出名的动作。
function camera(t) {
  const [cx, cy, z] = SH.cam;
  let x = cx, y = cy, zz = z, rot = 0;
  const mv = SH.mv;
  if (mv) {
    const e = eio(seg(t, SH.t0, SH.t1));
    const [dx = 0, dy = 0, zk = 1, dr = 0] = mv;
    x += dx * e; y += dy * e; zz *= 1 + (zk - 1) * e; rot = dr * e;
  }
  if (SH.snap) {
    const [ts, power, dur = .16] = SH.snap;
    zz *= 1 + power * ss(seg(t, ts, ts + dur));
  }
  // 再叠一两个像素的“手按不住纸”的呼吸
  return { cx: x + Math.sin(t * .7) * 1.2, cy: y + Math.sin(t * .53 + 1.1) * .9, z: zz, rot };
}
// 前景离镜头更近：镜头一横移，它要比背景滑得更快，画面才有纵深
function camShift(cam) {
  return [(cam.cx - SH.cam[0]) * cam.z, (cam.cy - SH.cam[1]) * cam.z];
}

// ---------------- 第二遍套色：从地平线往外压 ----------------
function cutY(t) {
  if (SH.cut === 'reveal') return eio(seg(t, SH.t0, SH.t0 + 1.55)) * 2600;   // 从地平线向上下两端一起漫开
  if (SH.cut === null) return 0;
  return SH.cut;
}

// ---------------- 画布 ----------------
const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');
const glc = document.createElement('canvas'); glc.width = 1920; glc.height = 1080;
const comp = compositor(glc, { ...world, arr, gw: GW, gh: GH });

const tooth = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  const im = x.createImageData(512, 512), R = rng(91);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
    const v = n2(i * .4, j * .4, 3) * .6 + n2(i * .1, j * .1, 5) * .4;
    const g = 255 - Math.max(0, (v - .52)) * 62 - (R() < .003 ? 26 : 0);
    const k = (j * 512 + i) * 4; im.data[k] = g; im.data[k + 1] = g * .994; im.data[k + 2] = g * .982; im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0); return c;
})();
const toothPat = ctx.createPattern(tooth, 'repeat');
const toScreen = cam => { const c = Math.cos(cam.rot), s = Math.sin(cam.rot); ctx.setTransform(cam.z * c, cam.z * s, -cam.z * s, cam.z * c, 960 - cam.z * (c * cam.cx - s * cam.cy), 540 - cam.z * (s * cam.cx + c * cam.cy)); };

// ---------------- 字幕（落在下页边，不浮框）----------------
const CUES = [
  [0.14, 1.55, '你看过《十三号星期五》吗'],
  [1.59, 2.21, '湖边营地'],
  [2.25, 3.19, '戴面具的杰森'],
  [3.23, 5.00, '一个接一个倒下的年轻人'],
  [5.04, 6.31, '多少人童年的阴影'],
  [6.35, 7.67, '但你不知道的是'],
  [7.71, 9.02, '这部片子是抄的'],
  [9.06, 10.01, '它抄的那部原版'],
  [10.05, 11.29, '是一部一九七一年的'],
  [11.33, 11.99, '意大利老片'],
  [12.03, 12.56, '《血之海滩》'],
  [12.60, 14.16, '铅黄名导马里奥·巴瓦'],
  [14.20, 14.69, '的名作'],
  [14.73, 15.89, '我为了做这一期'],
  [15.93, 17.27, '把这部老片翻出来'],
  [17.31, 18.30, '又盘了好几遍'],
  [18.34, 19.12, '越盘越觉得'],
  [19.16, 20.11, '后来的恐怖片'],
  [20.15, 21.42, '全都欠它一句谢谢'],
];
// —— 段 2 及以后：由 voice/make_subs.py 从配音.json 的十三段时间轴切出来（不删行） ——
CUES.push(
  [21.48, 22.59, '先交代一下背景'],
  [22.63, 24.06, '铅黄这名字听着玄乎'],
  [24.10, 26.63, '说白了就是意大利本土的悬疑凶杀片'],
  [26.67, 28.73, '戴黑手套的凶手漂亮的受害者'],
  [28.77, 30.04, '色调一个比一个艳'],
  [30.08, 30.87, '为啥叫铅黄'],
  [30.91, 33.92, '因为当年这类侦探小说的封面统一是黄色的'],
  [33.96, 36.81, '跟咱们这儿管推理小说叫红皮书一个道理'],
  [36.83, 39.30, '拍《血之海滩》的导演马里奥·巴瓦'],
  [39.34, 41.34, '搁今天就是恐怖片圈的祖师爷'],
  [41.38, 44.01, '意大利哥特恐怖和铅黄片那套视觉语言'],
  [44.05, 45.90, '基本是他一个人打下的江山'],
  [45.94, 47.48, '可就是这么一位祖师爷'],
  [47.52, 49.83, '一辈子没挣到钱反倒欠了一屁股税'],
  [49.87, 51.88, '逼着他在一九七一年仓促开工'],
  [51.92, 54.54, '用最省的钱最快的速度拍了这么一部片'],
  [54.56, 56.26, '剧情一句话说清一片海湾'],
  [56.30, 57.38, '一块值钱的地皮'],
  [57.42, 58.97, '一堆人为了它互相残杀'],
  [59.01, 59.78, '开场五分钟'],
  [59.82, 62.45, '一个坐轮椅的老太在自家别墅里被勒死'],
  [62.49, 64.04, '凶手刚伪造完自杀现场'],
  [64.08, 65.16, '得意劲儿还没过'],
  [65.20, 67.52, '转头就被一个看不见的人给捅死了'],
  [67.56, 68.96, '杀人就跟接力赛似的'],
  [69.00, 70.23, '一场接一场往下传'],
  [70.27, 71.82, '全片一共十三个人嗝屁'],
  [71.84, 74.72, '这片子的意大利原名翻译过来叫连锁反应'],
  [74.76, 77.00, '你品品就是说贪婪跟生态圈一样'],
  [77.04, 78.64, '一环吃一环谁都跑不掉'],
  [78.68, 80.60, '中间有四个小年轻误闯进来'],
  [80.64, 82.23, '跟这事儿八竿子打不着'],
  [82.27, 83.39, '照样被顺手灭了'],
  [83.43, 86.95, '其中一个还是在海里游泳的时候被尸体吓了个半死'],
  [86.99, 88.43, '回头就被镰刀送走了'],
  [88.45, 89.42, '最绝的是结尾'],
  [89.46, 91.55, '拼到最后赢下遗产的那对夫妻'],
  [91.59, 92.55, '正抱着庆祝呢'],
  [92.59, 95.17, '被自家两个熊孩子当玩具开枪给崩了'],
  [95.21, 96.81, '小孩还以为爹妈在装死'],
  [96.85, 98.30, '开开心心跑出去玩了'],
  [98.34, 100.27, '你以为是侦探破案的悬疑片'],
  [100.31, 101.28, '看完你就知道'],
  [101.32, 104.53, '这片子压根没打算让任何人活着走出那片海湾'],
  [104.57, 106.66, '这片子最值钱的地方不在剧情'],
  [106.70, 108.15, '在它是怎么拍出来的'],
  [108.19, 109.48, '预算低到什么程度'],
  [109.50, 111.05, '巴瓦连摄影师都自己干'],
  [111.09, 113.43, '推轨镜头用的是小孩的玩具小推车'],
  [113.47, 115.96, '就这还拍出了后来被写进教材的运镜'],
  [116.00, 118.03, '杀人特效交给卡洛·兰巴尔迪'],
  [118.07, 122.12, '就是后来给《异形》和《E.T.》做特效拿奥斯卡的那位'],
  [122.16, 123.56, '他用蜡翻模做了假人'],
  [123.60, 125.31, '一刀下去血喷得又浓又艳'],
  [125.35, 126.91, '当年的观众哪见过这个'],
  [126.95, 128.51, '直接在电影院里看傻了'],
  [128.53, 129.31, '配乐也邪门'],
  [129.35, 132.76, '斯特维奥·奇普里亚尼写的是那种轻松的沙发音乐'],
  [132.80, 134.04, '画面里杀得血淋淋'],
  [134.08, 135.63, '音乐却甜得跟度假一样'],
  [135.67, 137.99, '这一手反差后来被无数恐怖片学走'],
  [138.03, 138.65, '成了标配'],
  [138.69, 140.40, '这片子在海外发行也折腾'],
  [140.44, 141.99, '美国发行商为了蹭热度'],
  [142.03, 145.44, '直接把它改名成《左边最后一栋房二》拿去影院放'],
  [145.48, 147.65, '实际上它比那部片还早拍了两年'],
  [147.67, 150.38, '一九七一年在法国阿沃里亚兹电影节首映'],
  [150.42, 152.68, '主办方请了克里斯托弗·李来捧场'],
  [152.72, 154.53, '老爷子看完直接黑着脸离席'],
  [154.57, 155.63, '据说被恶心坏了'],
  [155.67, 156.12, '你想想'],
  [156.16, 158.57, '连演过德古拉伯爵的人都被恶心跑了'],
  [158.61, 160.12, '当年的杀伤力得有多大'],
  [160.14, 161.85, '重头戏在这儿十年之后'],
  [161.89, 164.62, '美国出了部电影叫《十三号星期五》'],
  [164.66, 166.54, '火遍全球连出十二部续集'],
  [166.58, 167.95, '里面有两段杀人戏'],
  [167.99, 170.55, '钩刀劈脸长矛串起床上的一对情侣'],
  [170.59, 172.47, '几乎是照抄《血之海滩》'],
  [172.51, 175.08, '有影评人把两部片子并排逐帧对比'],
  [175.12, 176.82, '结论就四个字抄作业了'],
  [176.84, 179.33, '而且《十三号星期五》还真不是个例'],
  [179.37, 181.54, '整个八十年代美国的砍杀片浪潮'],
  [181.58, 184.22, '封闭的营地一群年轻炮灰花式杀人机关'],
  [184.26, 185.81, '走的全是这部片的模板'],
  [185.85, 189.42, '后来的《惊声尖叫》《我知道你去年夏天干了什么》'],
  [189.46, 190.85, '往上溯源都绕不开它'],
  [190.89, 192.75, '独立连线评影史百大恐怖片'],
  [192.79, 193.72, '它排第九十四'],
  [193.76, 195.63, '所以这部片到底算不算烂片'],
  [195.65, 198.10, '讲良心话它的剧情是真的乱七八糟'],
  [198.14, 199.95, '人物多到记不住杀来杀去'],
  [199.99, 201.63, '你最后都不知道谁图啥'],
  [201.67, 203.80, '可人家巴瓦要的根本不是剧情'],
  [203.84, 206.62, '他要的是把杀人做成一件有设计感的事'],
  [206.66, 208.30, '十三场谋杀场场不重样'],
  [208.34, 210.80, '这门手艺后来的导演们学了一辈子'],
  [210.84, 212.64, '烂片指数十分为满分的话'],
  [212.68, 213.67, '本片我给三分'],
  [213.71, 216.16, '扣的七分全扣在剧情上剩下的三分'],
  [216.20, 217.52, '是给创意和胆子的'],
  [217.54, 219.48, '好了我要去遛狗了白了个白'],
);
function subtitle(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const [a, b, tx] of CUES) {
    if (t < a || t > b + .1) continue;
    const u = seg(t, a, a + .16), v = clamp((b + .1 - t) / .28);
    const al = Math.min(ss(u), ss(v));
    if (al <= 0) continue;
    ctx.save();
    ctx.font = '58px LongCang'; ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(tx).width;
    const x = 158, y = 962 + (1 - ss(u)) * 10;
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    // 先一圈黑描边（贴着字），再压一点黑晕让它从任何底色上都立起来
    ctx.shadowColor = `rgba(8,6,5,${.75 * al})`; ctx.shadowBlur = 10;
    ctx.strokeStyle = `rgba(12,9,8,${.96 * al})`; ctx.lineWidth = 4.6;
    ctx.strokeText(tx, x, y);
    ctx.shadowBlur = 0;
    ctx.strokeText(tx, x, y);
    ctx.fillStyle = `rgba(255,201,14,${.97 * al})`;
    ctx.fillText(tx, x, y);
    // 下面划一道铅笔线，随语句走
    const p = seg(t, a + .04, b);
    ctx.strokeStyle = `rgba(24,18,12,${.55 * al})`; ctx.lineWidth = 1.9;
    ctx.beginPath(); ctx.moveTo(x - 4, y + 16); ctx.lineTo(x - 4 + (w + 8) * p, y + 16.6 + Math.sin(p * 9) * .6); ctx.stroke();
    ctx.restore();
  }
}

// ---------------- 动态的那些笔画 ----------------
function stars(t) {
  if (!SH.stars) return;
  const out = 1 - seg(t, 4.05, 4.35);
  if (t < .8 || out <= 0) return;
  const u = ss(seg(t, .8, 2.4));
  ctx.save(); ctx.fillStyle = `rgba(240,246,255,${.82 * out})`;
  const R = rng(1234);
  for (let i = 0; i < 46; i++) {
    const x = 1300 + R() * 3600, y = 120 + R() * 1100;
    if (i / 46 > u) continue;
    const r = 1.5 + R() * 2.4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // 三四颗亮的，十字形
  for (const [x, y, r] of [[3560, 402, 9], [1900, 300, 7], [4620, 640, 8]]) {
    if (u < .7) continue;
    ctx.strokeStyle = `rgba(235,244,255,${.78 * out})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
  }
  ctx.restore();
}

// “抄”的那一下：红线沿着原画的边描一遍
function traceStrokes(t) {
  if (!SH.trace) return;
  const RED = hex('#c0141c');
  const pierLine = [0, .18, .36, .54, .72, .9, 1].map(u => world.G.pier.at(u, 0));
  const runs = [
    [pierLine, 6.88, 7.36],
    [[[3432, 1720], [3560, 1600], [3800, 1476], [4150, 1500], [4520, 1554]], 7.32, 7.80],
    [[[3810, 2016], [3806, 1900], [3812, 1760], [3818, 1620]], 7.76, 8.06],
  ];
  for (const [pts, t0, t1] of runs) {
    const p = clamp((t - t0) / (t1 - t0));
    if (p <= 0) continue;
    const st = penStroke(pts, { w: 4.6, wob: 2.2, over: 6, seed: (t0 * 100) | 0 });
    drawPen(ctx, st, eo(p), RED, .62 * (1 - .35 * seg(t, 8.0, 8.35)) * (1 + .05));
  }
}

// 页码边上的批注
function notes(t) {
  const mb = 1 - ss(seg(t, 15.02, 15.55));
  handwrite(ctx, 'mario bava', 2140, 1990, 66, seg(t, 13.30, 13.78), { font: 'Caveat', alpha: .82 * mb, rot: -.02 });
  handwrite(ctx, 'grazie', 3160, 2700, 92, seg(t, 20.34, 20.9), { font: 'Caveat', alpha: .86, rot: -.05 });
  handwrite(ctx, '35mm', 930, 700, 52, seg(t, 16.05, 16.45), { font: 'Caveat', alpha: .6, rot: -.04 });
}

// 片名：一笔一笔写下去
function title(t) {
  if (!(SH.title || SH.all)) return;
  const chars = '血之海滩', size = 268, gap = 286;
  const total = gap * (chars.length - 1);
  const x0 = 2400 - total / 2, y = 1846;
  for (let i = 0; i < chars.length; i++) {
    const p = seg(t, 12.92 + i * .13, 13.20 + i * .13);
    if (p <= 0) continue;
    handwrite(ctx, chars[i], x0 + i * gap, y, size, p, { font: 'MaShanZheng', col: [255, 199, 10], outline: [12, 9, 8], outlineW: .055, alpha: .97, rot: (i % 2 ? .012 : -.014) });
  }
  // 最后一道下划线（那句谢谢）
  const p = seg(t, 20.26, 21.10);
  if (p > 0) {
    const st = penStroke([[1934, 1914], [2210, 1918], [2490, 1906], [2762, 1914], [2906, 1900]], { w: 5.2, wob: 2.6, over: 8, seed: 3 });
    drawPen(ctx, st, eo(p), hex('#3a2018'), .8);
  }
  // 铅黄海报那几笔：天上压一行洋文、一道血杠、一个年份（不写在字上，写在字旁边的空里）
  const pe = seg(t, 13.34, 14.04);
  if (pe > 0) handwrite(ctx, 'B A Y  O F  B L O O D', 1292, 1152, 66, pe, { font: 'Caveat', col: [255, 244, 224], alpha: .94, rot: -.008 });
  const pb = seg(t, 13.82, 14.20);
  if (pb > 0) {
    const st = penStroke([[1276, 1198], [1440, 1204], [1620, 1194], [1796, 1202], [1904, 1192]], { w: 8.4, wob: 2.8, over: 10, seed: 43 });
    drawPen(ctx, st, eo(pb), hex('#c80d18'), .92);
  }
  const py = seg(t, 14.12, 14.46);
  if (py > 0) handwrite(ctx, '1971', 1296, 1274, 58, py, { font: 'Caveat', col: [58, 16, 24], alpha: .86, rot: -.02 });
}

// 巴瓦和他的小推车
function director(t) {
  if (!SH.bava || t < 12.88) return;
  const u = seg(t, 12.88, 15.0);
  const x = 2622 - 34 * eio(seg(t, 12.95, 15.0)), y = 2524, S = 300;
  const pose = walk(Math.PI * 2 * seg(t, 12.95, 15.0) * 1.2, { lean: .06 });
  const p = eo(seg(t, 12.88, 13.45));
  // 这一镜沙滩上站的人：铅黄的卖点是美女，所以这里站的是女主角，不是导演
  const bv = CAST.cast_girl1 || CAST.cast_bava;
  if (bv) {
    const h = S * 1.32, w = h * bv.width / bv.height;
    const sway = Math.sin(Math.PI * 2 * seg(t, 12.95, 15.0) * 1.2) * 5;
    const rise = .86 + .14 * p;
    // 脚下一块影子，要不他整个人是浮在沙上的
    ctx.save();
    ctx.globalAlpha = .40 * clamp(p * 1.15);
    ctx.fillStyle = 'rgba(46,10,10,.9)';
    ctx.beginPath(); ctx.ellipse(x + 52 + sway, y + 3, w * .36, 26, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = clamp(p * 1.15);
    // 注意这里是世界纸坐标（5120×2880），不是屏幕坐标：裁剪框只取他身边那一条
    ctx.beginPath(); ctx.rect(x + 52 - 520, y - h * rise, 1040, h * rise + 8); ctx.clip();
    ctx.translate(x + 52 + sway, y);
    ctx.rotate(.012 * Math.sin(t * 2.2));
    ctx.filter = 'saturate(1.20) sepia(.10) contrast(1.05)';   // 把他压进这张铅黄纸的暖调
    ctx.drawImage(bv, -w / 2, -h, w, h);
    ctx.restore();
  }
  // 推车：一个板 + 四只小轮 + 一台摄影机
  const cx = x - 62, cy = y - 26;
  const ink = (pts, w = 3.2, o = {}) => { const st = penStroke(pts, { w, wob: 1.4, over: 6, ...o }); drawPen(ctx, st, eo(seg(t, 13.10, 13.65)), hex('#241c18'), .86); };
  ink([[cx - 78, cy - 46], [cx + 78, cy - 46], [cx + 78, cy - 30], [cx - 78, cy - 30], [cx - 78, cy - 46]]);
  for (const dx of [-58, -26, 26, 58]) {
    const w = 13; const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU; pts.push([cx + dx + Math.cos(a) * w, cy + 12 + Math.sin(a) * w]); }
    ink([...pts, pts[0]], 2.2);
  }
  // 立柱 + 机身
  ink([[cx - 8, cy - 46], [cx - 8, cy - 92], [cx + 30, cy - 92]], 2.6);
  ink([[cx - 44, cy - 168], [cx + 34, cy - 168], [cx + 34, cy - 96], [cx - 44, cy - 96], [cx - 44, cy - 168]], 3.0);
  ink([[cx - 44, cy - 148], [cx - 74, cy - 148], [cx - 74, cy - 118], [cx - 44, cy - 118]], 2.6);   // 镜头筒
  ink([[cx + 6, cy - 168], [cx + 6, cy - 196], [cx + 46, cy - 196], [cx + 46, cy - 168]], 2.4);     // 片盒
  // 两个转盘（在转）
  for (const [dx, dy, r] of [[cx + 26, cy - 196, 17], [cx + 26, cy - 176, 12]]) {
    const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU + t * 1.4; pts.push([dx + Math.cos(a) * r, dy + Math.sin(a) * r]); }
    ink([...pts, pts[0]], 1.8);
  }
}

// ---------------- 会动的东西：水在荡漾、云在飘、日晕在收放、杰森在走并挥刀 ----------------
const SHORE = x => {
  const s = world.G.sandTop; let i = 0;
  while (i < s.length - 2 && x > s[i + 1][0]) i++;
  const a = s[i], b = s[Math.min(s.length - 1, i + 1)];
  const u = b[0] > a[0] ? clamp((x - a[0]) / (b[0] - a[0])) : 0;
  return lerp(a[1], b[1], u);
};
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// 水纹：位置随时间内滚，笔形每 1/12 s 换一次（手绘的抖）
function ripples(t) {
  const q = Math.floor(t * 12) / 12, R = rng(17 + Math.floor(t * 12));
  const rows = [HZ + 46, HZ + 136, HZ + 240, HZ + 356, 1900];
  const XA = 1240, XB = 3380, SPAN = XB - XA;
  ctx.save(); ctx.lineCap = 'round';
  rows.forEach((y, k) => {
    for (let i = 0; i < 9; i++) {
      const w = 64 + R() * 96 + k * 12;
      const x = XA + (((i / 9) * SPAN + t * (30 + k * 24) + R() * 150) % SPAN);
      const amp = 5 + k * 1.3;
      const ph = t * 2.4 + i * 1.7 + k;
      ctx.strokeStyle = rgba(INK, .44 - k * .022);
      ctx.lineWidth = 1.9 + k * .42;
      ctx.beginPath();
      ctx.moveTo(x, y + Math.sin(ph) * amp);
      ctx.bezierCurveTo(x + w * .3, y - amp * 2.2, x + w * .62, y + amp * 1.9, x + w, y - amp * .4);
      ctx.stroke();
      // 一道浅的压在下面，水才有层次
      ctx.strokeStyle = rgba(INK, .16 - k * .012);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x + w * .18, y + amp * .9);
      ctx.quadraticCurveTo(x + w * .6, y - amp * .8, x + w * .92, y + amp * .5);
      ctx.stroke();
    }
    // 浪尖：一排小白点跟着水走，水才亮
    for (let i = 0; i < 5; i++) {
      const px = XA + (((i / 5) * SPAN + t * (34 + k * 26) + 190) % SPAN);
      const ph2 = t * 2.6 + i * 2.1 + k;
      ctx.strokeStyle = rgba([236, 242, 244], .30 + .16 * (.5 + .5 * Math.sin(ph2)));
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(px, y + 26 + Math.sin(ph2) * 4);
      ctx.quadraticCurveTo(px + 16, y + 20 - Math.abs(Math.sin(ph2)) * 6, px + 34, y + 26 + Math.sin(ph2) * 3);
      ctx.stroke();
    }
  });
  ctx.restore();
}

// 浪头拍岸：岸线在来回舔
function shoreFoam(t) {
  ctx.save(); ctx.lineCap = 'round';
  const R = rng(29);
  for (let i = 0; i < 26; i++) {
    const x = 1210 + i * 86 + R() * 40;
    const ph = Math.sin(t * 1.7 + i * .8);
    const y = SHORE(x) + 4 + ph * 9;
    ctx.strokeStyle = rgba([226, 232, 232], .34 + .2 * (.5 + .5 * ph));
    ctx.lineWidth = 1.6 + R() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x - 26, y + 3);
    ctx.quadraticCurveTo(x, y - 5 - ph * 2, x + 30 + R() * 14, y + 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 日月落在水上的碎光：长短随呼吸变
function glitter(t) {
  const o = world.G.orb, cut = CV;
  const col = mix3([214, 230, 241], [255, 214, 120], cut);
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const y = HZ + 34 + i * 27;
    const ph = Math.sin(t * 2.2 + i * .55);
    const w = (46 + i * 9) * (.72 + .34 * (.5 + .5 * ph));
    ctx.fillStyle = rgba(col, (.30 - i * .014) * (.7 + .3 * (.5 + .5 * ph)));
    ctx.fillRect(o.x - w / 2 + Math.sin(t * 1.1 + i) * 22, y, w, 3 + i * .35);
  }
  ctx.restore();
}

// 云：冷灰蓝 → 落日粉，一路往右飘
function clouds(t) {
  const cut = CV;
  const puffs = world.G.clouds.flat();
  for (const [x0, y0, rx, ry] of puffs) {
    const x = x0 + t * 26 + Math.sin(t * .28 + x0 * .01) * 12;
    const y = y0 + Math.sin(t * .62 + x0 * .004) * 7;
    const col = mix3([162, 182, 206], [255, 176, 186], cut);
    const deep = mix3([70, 86, 112], [176, 74, 78], cut);
    ctx.save();
    // 一朵云 = 五个球叠起来，球心随呼吸微动
    for (let k = 0; k < 5; k++) {
      const a = -.9 + k * .46, s = .72 + .3 * Math.sin(k * 2.1 + x0);
      const px = x + Math.cos(a) * rx * .66, py = y + Math.sin(a) * ry * .5 - ry * .12 * Math.cos(a);
      ctx.fillStyle = rgba(col, .30 + .06 * (.5 + .5 * Math.sin(t * .8 + k + x0 * .01)));
      ctx.beginPath(); ctx.ellipse(px, py, rx * .44 * s, ry * .5 * s, 0, 0, TAU); ctx.fill();
      // 下缘积一点暗，云才立得住
      ctx.fillStyle = rgba(deep, .16);
      ctx.beginPath(); ctx.ellipse(px, py + ry * .28, rx * .40 * s, ry * .22 * s, 0, 0, TAU); ctx.fill();
    }
    // 云底一道手画的边，跟着飘
    ctx.strokeStyle = rgba(deep, .34); ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.02, y + ry * .62);
    for (let i = 0; i <= 9; i++) { const u = i / 9; ctx.lineTo(x - rx * 1.02 + rx * 2.04 * u, y + ry * .62 + Math.sin(u * 6.4 + t * 1.5 + x0 * .01) * ry * .26); }
    ctx.stroke();
    // 顶上几笔卷
    ctx.strokeStyle = rgba(col, .5); ctx.lineWidth = 1.3;
    for (let k = 0; k < 3; k++) {
      const u = -.5 + k * .5, px = x + rx * u, py = y - ry * .5;
      ctx.beginPath(); ctx.arc(px, py, rx * .2, Math.PI * 1.05, Math.PI * 1.8); ctx.stroke();
    }
    ctx.restore();
  }
}

// 日晕：三圈收放 + 一圈慢慢转的短光 + 心里一团亮
function halo(t) {
  const o = world.G.orb, sy = HZ - 186, cut = CV;
  const breathe = .5 + .5 * Math.sin(t * .9);
  ctx.save();
  // 心里一团亮的（太阳不能是块死黄）
  const g = ctx.createRadialGradient(o.x, sy - 10, o.r * .12, o.x, sy, o.r * 1.5);
  g.addColorStop(0, rgba(mix3([255, 255, 250], [255, 250, 214], cut), .55));
  g.addColorStop(.5, rgba(mix3([236, 246, 255], [255, 226, 130], cut), .3));
  g.addColorStop(1, rgba(mix3([200, 224, 244], [255, 160, 60], cut), 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(o.x, sy, o.r * 1.5, o.r * 1.42, 0, 0, TAU); ctx.fill();
  for (let k = 0; k < 3; k++) {
    const r = o.r * (1.06 + k * .11) + 7 * breathe;
    ctx.strokeStyle = rgba(mix3([196, 220, 238], [255, 196, 90], cut), .15 - k * .032);
    ctx.lineWidth = 2.2 - k * .4;
    ctx.beginPath(); ctx.ellipse(o.x, sy, r, r * .92, 0, 0, TAU); ctx.stroke();
    }
  const rays = 16, rot = t * .14;
  for (let i = 0; i < rays; i++) {
    const a = rot + i / rays * TAU, r0 = o.r * 1.12 + 4 * breathe, r1 = r0 + 12 + 9 * (.5 + .5 * Math.sin(t * 1.6 + i));
    ctx.strokeStyle = rgba(mix3([226, 238, 246], [255, 224, 150], cut), .2);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(o.x + Math.cos(a) * r0, sy + Math.sin(a) * r0 * .92); ctx.lineTo(o.x + Math.cos(a) * r1, sy + Math.sin(a) * r1 * .92); ctx.stroke();
  }
  ctx.restore();
}

// 杰森：走七步，然后站在三具旁边一刀一刀地劈
const KE = { h: 232, yaw: Math.PI - .17 };

// 位图杰森：身体整张钉死不动（只有行走时的位移和一点呼吸），
// 刀是他右手挥的——立绘给的是"空手举臂"，刀用代码画，绕手腕转。
const KNIFE = { hx: .275, hy: .143, len: .62, wid: .062 };   // 图内拳头位置（归一化）与刀长宽（按身高）
function jasonCast(t, o) {
  const arm = CAST.cast_jason_arm || CAST.cast_jason_mask || CAST.cast_jason;
  if (!arm) return false;
  const moving = o.walk ? t < o.t1 - .02 : 0;
  const x = o.walk ? lerp(o.x0, o.x1, eio(seg(t, o.t0, o.t1 - .02))) : o.x0;
  const y = SHORE(x) + KE.h * .09;
  const ph = (t - o.t0) * 3.8;
  const cyc = 1.00, p = ((t - o.t0) % cyc) / cyc;
  let chop = 0;
  if (!moving && !o.still) { if (p > .56 && p < .82) chop = ss((p - .56) / .26); else if (p >= .82) chop = 1 - ss((p - .82) / .18); }
  const hgt = KE.h * 1.12, wid = hgt * arm.width / arm.height;
  const colorK = clamp((t - T(x, y - KE.h * .5)) / .30);
  // 落影：没有它人物会浮在沙上
  ctx.save();
  ctx.globalAlpha = .40 * colorK;
  ctx.fillStyle = 'rgba(14,10,12,.9)';
  ctx.beginPath(); ctx.ellipse(x + KE.h * .12, y + 2, wid * .46, KE.h * .050, 0, 0, TAU); ctx.fill();
  ctx.restore();
  // 身体：不动。走路才有几像素的上下颠，站定只留一丝呼吸
  const bob = moving ? Math.sin(ph) * KE.h * .008 : 0;
  const breatheRot = moving ? Math.sin(ph) * .006 : .0035 * Math.sin(t * 1.1);
  ctx.save();
  ctx.globalAlpha = .14 + .86 * colorK;
  ctx.translate(x, y - bob);
  ctx.rotate(breatheRot);
  ctx.filter = 'saturate(1.14) contrast(1.05)';
  ctx.drawImage(arm, -wid / 2, -hgt, wid, hgt);
  ctx.restore();
  // 刀：从拳头上长出来，绕手腕转——只有它在动
  if (!o.still) {
    const px = x - wid / 2 + wid * KNIFE.hx, py = y - bob - hgt + hgt * KNIFE.hy;
    const L = KE.h * KNIFE.len, wd = KE.h * KNIFE.wid;
    // 举着时刀尖朝右上；劈下时扫到右下
    const ang = (-1.02 + 1.62 * chop) + (moving ? .05 * Math.sin(ph) : .035 * Math.sin(t * 1.7));
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const w0 = wd * .30, w1 = wd;
    const Pp = (u, off) => [px + dx * L * u + nx * off, py + dy * L * u + ny * off];
    ctx.save();
    ctx.globalAlpha = colorK;
    ctx.strokeStyle = 'rgba(26,22,18,.92)'; ctx.lineWidth = wd * .34;   // 刀柄
    ctx.beginPath(); ctx.moveTo(...Pp(-.14, 0)); ctx.lineTo(...Pp(.03, 0)); ctx.stroke();
    const blade = [Pp(.02, -w0), Pp(.36, -w1), Pp(.78, -w1 * .52), Pp(.97, -w1 * .05), Pp(.995, w1 * .10), Pp(.80, w1 * .46), Pp(.38, w1 * .88), Pp(.02, w0)];
    ctx.fillStyle = 'rgba(231,227,214,.97)';
    ctx.beginPath(); blade.forEach(([qx, qy], i) => i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(18,14,12,.92)'; ctx.lineWidth = Math.max(1.4, wd * .10); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,92,96,.55)'; ctx.lineWidth = Math.max(1.0, wd * .06);
    ctx.beginPath(); ctx.moveTo(...Pp(.08, w1 * .28)); ctx.quadraticCurveTo(...Pp(.5, w1 * .60), ...Pp(.94, w1 * .06)); ctx.stroke();
    ctx.strokeStyle = 'rgba(236,26,96,.36)'; ctx.lineWidth = wd * .30;
    ctx.beginPath(); ctx.moveTo(...Pp(.12, w1 * .66)); ctx.quadraticCurveTo(...Pp(.55, w1 * .62), ...Pp(.90, w1 * .30)); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,214,120,.32)'; ctx.lineWidth = wd * .12;
    ctx.beginPath(); ctx.moveTo(...Pp(.16, w1 * .76)); ctx.quadraticCurveTo(...Pp(.52, w1 * .74), ...Pp(.87, w1 * .40)); ctx.stroke();
    // 劈下去的三道风
    if (chop > .12 && p > .4 && p < .95) {
      ctx.strokeStyle = rgba([246, 242, 232], .55 * chop); ctx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) {
        const rr = L * (.72 + k * .16), aa = ang - .35;
        ctx.beginPath(); ctx.arc(px, py, rr, aa - .24, aa + .12); ctx.stroke();
      }
    }
    ctx.restore();
  }
  return true;
}
function jason(t, o) {
  if (!o) return;
  if (jasonCast(t, o)) return;
  const moving = o.walk ? t < o.t1 - .02 : 0;
  const x = o.walk ? lerp(o.x0, o.x1, eio(seg(t, o.t0, o.t1 - .02))) : o.x0;
  const y = SHORE(x) + KE.h * .09;
  const ph = (t - o.t0) * 3.8;
  // 挥刀节奏：走的时候举着刀，站定之后才一刀一刀地劈（每镜都从抬手开始）
  const cyc = 1.00, p = ((t - o.t0) % cyc) / cyc;   // 一刀一刀劈得更密：两秒多的一镜里能劈两下
  let chop = 0;
  if (!moving && !o.still) { if (p > .56 && p < .82) chop = ss((p - .56) / .26); else if (p >= .82) chop = 1 - ss((p - .82) / .18); }
  const hand = lerp3(R3.V(.24, 1.02 + .06 * Math.sin(t * 1.3), .16), R3.V(.62, .48, .30), chop);
  const tip = lerp3(R3.V(.02, 1.54, .04), R3.V(.88, .10, .54), chop);
  const base = moving ? walk(ph, { headYaw: .12 }) : stand({ lean: .05 + .02 * Math.sin(t * 1.1), headYaw: .14 + .03 * Math.sin(t * .8), armL: .12 });
  const pose = { ...base, handR: hand, elbR: R3.V(1, .35, -.3), twist: (moving ? .06 : 0) + chop * .18, lean: (base.lean ?? 0) + chop * .1 };
  const prims = figure(KILLER, pose, { x, y, S: KE.h, yaw: KE.yaw }, { seed: 2000, boil: Math.floor(t * 12) });
  const prj = projector(x, y, KE.h, KE.yaw, .28), jj = skeleton(pose), pHead = prj(jj.head);
  const colorK = clamp((t - T(x, y - KE.h * .5)) / .30);
  drawPrims(ctx, prims, { color: colorK, ink: 0, noKnock: true });

  // 雨衣：从肩到小腿，把短裤和腿盖住
  const sL = prj(jj.shL), sR = prj(jj.shR), pl = prj(jj.pel);
  const cx = (sL[0] + sR[0]) / 2, wt = Math.abs(sR[0] - sL[0]) / 2 * 1.04, wh = wt * 1.22;
  const yTop = Math.min(sL[1], sR[1]) - KE.h * .02, yHem = pl[1] + KE.h * .30;
  const coatPoly = [[cx - wt, yTop], [cx + wt, yTop], [cx + wh, yHem - KE.h * .02], [cx + wh * .94, yHem], [cx - wh * .94, yHem], [cx - wh, yHem - KE.h * .02]];
  const inkP = 1;        // 每一镜切进来的时候，这一页早就画好了，杰森不该是个影子
  if (inkP > 0) {
    ctx.save();
    ctx.fillStyle = rgba([23, 30, 42], .94 * inkP);
    ctx.beginPath(); coatPoly.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill();
    // 两道竖褶 + 外形
    ctx.strokeStyle = rgba([9, 12, 18], .70 * inkP); ctx.lineWidth = 1.7;
    for (const u of [-.42, .36]) { const bx = cx + wt * u; ctx.beginPath(); ctx.moveTo(bx, yTop + KE.h * .10); ctx.lineTo(bx + wt * .12 * Math.sign(u), yHem - KE.h * .05); ctx.stroke(); }
    ctx.strokeStyle = rgba(INK, .92 * inkP); ctx.lineWidth = 2.5;
    ctx.beginPath(); coatPoly.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.stroke();
    // 铅黄的规矩：黑衣服也得被两盏灯咬出边——右边红、左边钴蓝（边要细，像反光不像条纹）
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba([255, 120, 40], .13); ctx.lineWidth = wt * .34;
    ctx.beginPath(); ctx.moveTo(cx + wt * .84, yTop + KE.h * .05); ctx.lineTo(cx + wh * .80, yHem - KE.h * .07); ctx.stroke();
    ctx.strokeStyle = rgba([214, 6, 44], .44); ctx.lineWidth = wt * .17;
    ctx.beginPath(); ctx.moveTo(cx + wt * .94, yTop + KE.h * .03); ctx.lineTo(cx + wh * .91, yHem - KE.h * .05); ctx.stroke();
    ctx.strokeStyle = rgba([255, 160, 60], .30); ctx.lineWidth = wt * .07;
    ctx.beginPath(); ctx.moveTo(cx + wt * .99, yTop); ctx.lineTo(cx + wh * .97, yHem - KE.h * .03); ctx.stroke();
    ctx.strokeStyle = rgba([34, 62, 196], .26); ctx.lineWidth = wt * .16;
    ctx.beginPath(); ctx.moveTo(cx - wt * .93, yTop + KE.h * .05); ctx.lineTo(cx - wh * .91, yHem - KE.h * .05); ctx.stroke();
    ctx.strokeStyle = rgba([120, 170, 255], .20); ctx.lineWidth = wt * .07;
    ctx.beginPath(); ctx.moveTo(cx - wt * .98, yTop + KE.h * .01); ctx.lineTo(cx - wh * .97, yHem - KE.h * .03); ctx.stroke();
    ctx.restore();
  }
  // 面具：一张留白的纸，两个洞，什么都不画（空白的脸最吓人）
  const hrx = KE.h * .062, hry = KE.h * .079;
  if (inkP > 0) {
    ctx.save();
    ctx.fillStyle = rgba([16, 18, 24], .9);                      // 兜帽压下的影
    ctx.beginPath(); ctx.ellipse(pHead[0], pHead[1] - hry * .1, hrx * 1.34, hry * 1.28, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(PAPER, .99);
    const maskPath = () => {
      ctx.beginPath();
      ctx.moveTo(pHead[0] - hrx, pHead[1] - hry * .62);
      ctx.quadraticCurveTo(pHead[0] - hrx * 1.1, pHead[1] + hry * .55, pHead[0] - hrx * .34, pHead[1] + hry * .96);
      ctx.quadraticCurveTo(pHead[0], pHead[1] + hry * 1.12, pHead[0] + hrx * .34, pHead[1] + hry * .96);
      ctx.quadraticCurveTo(pHead[0] + hrx * 1.1, pHead[1] + hry * .55, pHead[0] + hrx, pHead[1] - hry * .62);
      ctx.quadraticCurveTo(pHead[0], pHead[1] - hry * 1.18, pHead[0] - hrx, pHead[1] - hry * .62);
      ctx.closePath();
    };
    maskPath(); ctx.fill();
    ctx.strokeStyle = rgba(INK, .9); ctx.lineWidth = 2.0; ctx.stroke();
    // 一张白面具在这个世界上不可能干净——右上角被黄片光扫过，左下角沉进钴蓝（羽化，且只落在面具里）
    ctx.save(); maskPath(); ctx.clip();
    const mkGlow = (gx, gy, gr, c, a) => {
      const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      gg.addColorStop(0, rgba(c, a)); gg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();
    };
    mkGlow(pHead[0] + hrx * .40, pHead[1] - hry * .32, hrx * .90, [255, 198, 24], .46);
    mkGlow(pHead[0] - hrx * .44, pHead[1] + hry * .30, hrx * .74, [30, 52, 190], .38);
    ctx.restore();
    ctx.fillStyle = rgba([10, 10, 12], .96);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(pHead[0] + s * hrx * .40, pHead[1] - hry * .10, hrx * .26, hry * .12, s * -.16, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  // 砍刀：从手心里伸出去，跟着手一起落（起点用手臂骨架真正到得了的位置，免得刀飘在半空）
  const handW = prj(jj.haR), tipW = prj(tip);
  const dx = tipW[0] - handW[0], dy = tipW[1] - handW[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L, w0 = KE.h * .019, w1 = KE.h * .052;
  const Pp = (u, off) => [lerp(handW[0], tipW[0], u) + nx * off, lerp(handW[1], tipW[1], u) + ny * off];
  if (inkP > 0) {
    const blade = [Pp(.03, -w0), Pp(.40, -w1), Pp(.88, -w1 * .46), [tipW[0] + nx * w1 * .05, tipW[1] + ny * w1 * .05], Pp(.90, w1 * .48), Pp(.44, w1 * .9), Pp(.03, w0)];
    ctx.save();
    ctx.fillStyle = rgba([231, 227, 214], .97); ctx.beginPath(); blade.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(INK, .92); ctx.lineWidth = 1.8; ctx.stroke();
    ctx.strokeStyle = rgba([90, 92, 96], .55); ctx.lineWidth = 1.2;                 // 背上一道筋，刀才不是块板
    ctx.beginPath(); ctx.moveTo(...Pp(.06, w1 * .3)); ctx.quadraticCurveTo(...Pp(.5, w1 * .62), ...Pp(.92, w1 * .1)); ctx.stroke();
    // 刃口反一片洋红：这是红灯光在铁上的回跳（细，两盏灯各留一道）
    ctx.strokeStyle = rgba([236, 26, 96], .34); ctx.lineWidth = w1 * .24;
    ctx.beginPath(); ctx.moveTo(...Pp(.12, w1 * .70)); ctx.quadraticCurveTo(...Pp(.55, w1 * .64), ...Pp(.90, w1 * .34)); ctx.stroke();
    ctx.strokeStyle = rgba([255, 214, 120], .30); ctx.lineWidth = w1 * .10;
    ctx.beginPath(); ctx.moveTo(...Pp(.16, w1 * .80)); ctx.quadraticCurveTo(...Pp(.52, w1 * .77), ...Pp(.87, w1 * .44)); ctx.stroke();
    // 刀柄
    ctx.strokeStyle = rgba([26, 22, 18], .92); ctx.lineWidth = KE.h * .028;
    ctx.beginPath(); ctx.moveTo(handW[0] - nx * KE.h * .065, handW[1] - ny * KE.h * .065); ctx.lineTo(handW[0] + nx * KE.h * .004, handW[1] + ny * KE.h * .004); ctx.stroke();
    // 劈下去的那一下子：三道风
    if (chop > .12 && p > .4 && p < .95) {
      const a0 = Math.atan2(dy, dx), sw = .42 * chop;
      ctx.strokeStyle = rgba([246, 242, 232], .6 * chop); ctx.lineWidth = 1.4;
      for (let k = 0; k < 3; k++) {
        const rr = L * (1.02 + k * .13), aa = a0 + sw * (k * .5 - .5);
        ctx.beginPath(); ctx.arc(handW[0], handW[1], rr, aa - .2, aa + .2); ctx.stroke();
      }
    }
    ctx.restore();
  }
  // 身体自己的线最后走
  const headIn = pr => pr.st.P.length && pr.st.P.every(([qx, qy]) => Math.hypot(qx - pHead[0], qy - pHead[1]) < hrx * 1.55);
  drawPrims(ctx, prims, { color: 0, ink: pr => (headIn(pr) ? 0 : inkP), noKnock: true });
}
function reel(t) {
  if (!(SH.reel || SH.all)) return;
  const cx = 748, cy = 596, r = 164, a0 = (t - 15.0) * 2.6;
  const p = 1;                       // 切进来的时候盘已经在纸上了，动的是它转、带子往外拉
  const col = hex('#2c2420');
  if (p > 0) {
    const pts = []; for (let i = 0; i <= 44; i++) { const a = a0 + i / 44 * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    const st = penStroke([...pts, pts[0]], { w: 4.2, wob: 2.0, over: 8, seed: 5 });
    drawPen(ctx, st, p, col, .78);
  }
  if (p >= 1) {
    // 盘上绕着的胶片：两圈细线，让盘有厚度
    for (const rr of [r * .88, r * .80]) {
      const pts = []; for (let i = 0; i <= 40; i++) { const a = a0 + i / 40 * TAU; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      drawPen(ctx, penStroke([...pts, pts[0]], { w: 1.9, wob: 1.0, over: 4, seed: 30 + rr }), 1, col, .42);
    }
    for (let k = 0; k < 6; k++) {
      const a = a0 + k / 6 * TAU;
      const x = cx + Math.cos(a) * r * .54, y = cy + Math.sin(a) * r * .54;
      const pts = []; for (let i = 0; i <= 12; i++) { const b = i / 12 * TAU; pts.push([x + Math.cos(b) * 30, y + Math.sin(b) * 30]); }
      const st = penStroke([...pts, pts[0]], { w: 2.6, wob: 1.2, over: 3, seed: 40 + k });
      drawPen(ctx, st, 1, col, .7);
    }
    const hub = []; for (let i = 0; i <= 14; i++) { const b = i / 14 * TAU; hub.push([cx + Math.cos(b) * 22, cy + Math.sin(b) * 22]); }
    drawPen(ctx, penStroke([...hub, hub[0]], { w: 2.6, wob: 1, over: 3, seed: 9 }), 1, col, .7);
  }
}

// 把片子从盘里拉出来：一条 35mm 的带子拖到页边，有一格正好是那片海
function filmstrip(t) {
  if (!SH.reel) return;
  const p = seg(t, 15.08, 16.34);
  if (p <= 0) return;
  const A = [742, 742], B = [104, 1044], hw = 27;
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
  const nx = -dy / L, ny = dx / L;
  const C = (u, s) => [A[0] + dx * u + nx * hw * s, A[1] + dy * u + ny * hw * s];
  // 带子本身：一层很淡的冷白，从盘口一路拉出来
  if (p > .04) {
    const q = eo(clamp((p - .04) / .96));
    const poly = [...Array(9)].map((_, i) => C(i / 8 * q, -1)).concat([...Array(9)].map((_, i) => C((1 - i / 8) * q, 1)));
    ctx.save(); ctx.fillStyle = rgba([246, 242, 230], .90); ctx.beginPath();
    poly.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // 两条边
  for (const s of [-1, 1]) {
    const pts = [...Array(9)].map((_, i) => C(i / 8, s));
    drawPen(ctx, penStroke(pts, { w: 2.2, wob: 1.4, over: 4, seed: s > 0 ? 17 : 18 }), eo(p), hex('#2a2018'), .78);
  }
  // 齿孔
  for (let i = 0; i < 24; i++) {
    const u = .045 + i * .040; if (u > .96) break;
    if (p < u * 1.06) continue;
    for (const s of [-1, 1]) {
      const c = C(u, s * .80);
      ctx.save(); ctx.fillStyle = rgba([54, 44, 38], .5);
      ctx.beginPath(); ctx.rect(c[0] - 3.2, c[1] - 4.0, 6.4, 8.0); ctx.fill(); ctx.restore();
    }
  }
  // 四个画格，第三格里就是那片血海
  const frames = [[.18, .11], [.36, .11], [.54, .11], [.72, .11]];
  frames.forEach(([u0, wd], i) => {
    if (p < u0 * 1.06) return;
    const quad = [C(u0, .56), C(u0 + wd, .56), C(u0 + wd, -.56), C(u0, -.56)];
    if (i === 2) {
      ctx.save(); ctx.fillStyle = rgba([198, 40, 46], .62);
      ctx.beginPath(); quad.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
      const sc = C(u0 + wd * .55, .10);
      ctx.fillStyle = rgba([255, 206, 120], .9); ctx.beginPath(); ctx.arc(sc[0], sc[1], 7, 0, TAU); ctx.fill();
      ctx.restore();
    }
    drawPen(ctx, penStroke([...quad, quad[0]], { w: 1.9, wob: 1.0, over: 3, seed: 91 + i }), 1, hex('#2a2018'), .70);
  });
}

// 后来的一排人（站在页脚）
function laterCrowd(t) {
  for (let i = 0; i < 6; i++) {
    const t0 = 19.16 + i * .065;
    const p = seg(t, t0, t0 + .16);
    if (p <= 0) continue;
    const x = 2300 + i * 106, y = 2740, h = 112 + (i % 3) * 9;
    const ink = (pts, w = 2.8) => { const st = penStroke(pts, { w, wob: 1.1, over: 3, seed: i * 7 + 3 }); drawPen(ctx, st, eo(p), hex('#2b2320'), .72); };
    ink([[x, y], [x, y - h * .34], [x + 1, y - h * .55]]);
    ink([[x - 14, y - h * .72], [x + 14, y - h * .72], [x + 16, y - h * .3], [x - 16, y - h * .3]]);
    ink(ellipse(x, y - h * .82, 11, 12, 12).concat([[x + 10, y - h * .8]]));
  }
}

// “阴影”的那一段：把画面的四边往下压暗（在屏幕上压，不跟纸一起放大）
function shadowVignette(t) {
  if (!SH.vig) return;
  const k = ss(seg(t, 5.05, 5.7)) * (1 - ss(seg(t, 6.25, 6.75)));
  if (k <= 0) return;
  const g = ctx.createRadialGradient(960, 500, 300, 960, 540, 1080);
  g.addColorStop(0, 'rgba(24,18,16,0)');
  g.addColorStop(.5, `rgba(20,15,14,${.14 * k})`);
  g.addColorStop(1, `rgba(12,9,8,${.52 * k})`);
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
}

// 同一张画，两枚印张：左边冷色的湖边营地（一九八〇），右边血海（一九七一）
function splitPlate(t, cam) {
  const PW = 900, PH = 506, Y0 = 300, GAP = 40, L = 40, RU = L + PW + GAP;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = rgba(PAPER, 1); ctx.fillRect(0, 0, 1920, 1080);
  for (const [px, cut, seed] of [[L, -1e5, 11], [RU, 1e5, 12]]) {
    comp({ ...cam, cut }, t);
    ctx.save();
    ctx.fillStyle = rgba([246, 240, 226], 1);                       // 照片的衬纸
    ctx.fillRect(px - 12, Y0 - 12, PW + 24, PH + 24);
    ctx.shadowColor = 'rgba(58,40,32,.30)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    ctx.drawImage(glc, 0, 0, 1920, 1080, px, Y0, PW, PH);
    ctx.restore();
    // 印张的边：手画一圈，不是规规矩矩的框
    const pts = [];
    const edge = (x1, y1, x2, y2, n) => { for (let i = 0; i < n; i++) { const u = i / n; pts.push([x1 + (x2 - x1) * u, y1 + (y2 - y1) * u]); } };
    edge(px - 12, Y0 - 12, px + PW + 12, Y0 - 12, 14); edge(px + PW + 12, Y0 - 12, px + PW + 12, Y0 + PH + 12, 8);
    edge(px + PW + 12, Y0 + PH + 12, px - 12, Y0 + PH + 12, 14); edge(px - 12, Y0 + PH + 12, px - 12, Y0 - 12, 8);
    pts.push(pts[0]);
    drawPen(ctx, penStroke(pts, { w: 2.2, wob: 1.5, over: 6, seed }), eo(seg(t, 8.52, 8.95)), hex('#241c18'), .70);
  }
  // 两边的年份与注脚
  handwrite(ctx, '1980', L + PW / 2 - 62, 268, 84, seg(t, 8.62, 8.98), { font: 'Caveat', alpha: .90, rot: -.03 });
  handwrite(ctx, '1971', RU + PW / 2 - 62, 268, 84, seg(t, 9.62, 9.98), { font: 'Caveat', alpha: .90, rot: -.02 });
  handwrite(ctx, '抄的', L + PW / 2 - 58, 878, 58, seg(t, 9.04, 9.30), { font: 'MaShanZheng', col: [34, 22, 20], alpha: .92, rot: -.012 });
  handwrite(ctx, '原版', RU + PW / 2 - 58, 878, 58, seg(t, 10.06, 10.34), { font: 'MaShanZheng', col: [34, 22, 20], alpha: .94, rot: .010 });
}

// ---------------- 铅黄的色光语法 ----------------
// 依据：Tovoli 拍《阴风阵阵》定的规矩——蓝、绿、红三原色代表正常的生命，
// 再用补色黄去「污染」它们，制造病态感；巴瓦《血与黑蕾丝》给每场谋杀单独一个主色。
// 色光是硬的、饱和的、彼此交叉且没有光源理由的，不是柔光晕，也不是自然光。
const GEL = {
  red: [179, 0, 27],      // #b3001b 深红：暴力、血、迫近的危机
  blue: [27, 42, 143],    // #1b2a8f 钴蓝：真正到来的死亡
  green: [15, 122, 92],   // #0f7a5c 翠绿：还活着的那一刻
  acid: [124, 196, 26],   // 酸绿：不自然的、被施了法的东西
  gold: [214, 158, 20],   // 补色黄：污染层
  void: [11, 11, 13],     // #0b0b0d 虚空黑
};
// 硬边光束：色片灯打在物体上是把它「染成」那个颜色，所以主体走 multiply 染色，
// 只在光芯补一点 screen 提亮——这样红是浓红、蓝是浓蓝，暗部仍旧是黑，不会糊成灰。
// 环境可以失真，主体（人、关键物件）要保住：光束先画在离屏上，再把主体那圈擦掉。
let beamCv = null, beamCx = null;
let CUR = null;      // 当前帧的机位：灯光层要用它把主体圈跟着镜头搬
// hero 是按基准机位量的屏幕坐标；先换算回页面坐标，再按当前机位摆回去
function heroOnScreen() {
  const h = SH.hero; if (!h || !CUR) return null;
  const [hx, hy, hr] = h, [bx, by, bz] = SH.cam;
  const px = bx + (hx - 960) / bz, py = by + (hy - 540) / bz;
  const c = Math.cos(CUR.rot), s = Math.sin(CUR.rot);
  const dx = px - CUR.cx, dy = py - CUR.cy;
  return [960 + CUR.z * (c * dx - s * dy), 540 + CUR.z * (s * dx + c * dy), hr * (CUR.z / bz)];
}
function gelBeams(t) {
  const L = SH.beams; if (!L) return;
  if (!beamCv) { beamCv = document.createElement('canvas'); beamCv.width = 1920; beamCv.height = 1080; beamCx = beamCv.getContext('2d'); }
  const bx = beamCx;
  const pass = (mode) => {
    bx.setTransform(1, 0, 0, 1, 0, 0);
    bx.globalCompositeOperation = 'source-over';
    bx.clearRect(0, 0, 1920, 1080);
    for (const [ox, oy, ang, half, len, key, a] of L) {
      const col = GEL[key] || key;
      const drift = Math.sin(t * .34 + ox * .01) * .022;   // 灯在轻微晃，不是死的
      const a0 = ang + drift - half, a1 = ang + drift + half;
      // 边缘不是尺子画的：沿两条边各取几点，做出纸上的毛糙
      const edge = (aa, sgn) => {
        const pts = [];
        for (let i = 1; i <= 6; i++) {
          const u = i / 6, L2 = len * u;
          const jit = Math.sin(u * 9.3 + ox * .02 + sgn * 2.1) * 16 * u;
          pts.push([ox + Math.cos(aa) * L2 - Math.sin(aa) * jit, oy + Math.sin(aa) * L2 + Math.cos(aa) * jit]);
        }
        return pts;
      };
      const e0 = edge(a0, 0), e1 = edge(a1, 1);
      const path = () => {
        bx.beginPath(); bx.moveTo(ox, oy);
        for (const p of e0) bx.lineTo(p[0], p[1]);
        for (let i = e1.length - 1; i >= 0; i--) bx.lineTo(e1[i][0], e1[i][1]);
        bx.closePath();
      };
      const ex = ox + Math.cos(ang + drift) * len, ey = oy + Math.sin(ang + drift) * len;
      const g = bx.createLinearGradient(ox, oy, ex, ey);
      if (mode === 'multiply') {
        const tint = [Math.round(255 - (255 - col[0]) * .62), Math.round(255 - (255 - col[1]) * .62), Math.round(255 - (255 - col[2]) * .62)];
        g.addColorStop(0, rgba(tint, a * 1.5));
        g.addColorStop(.6, rgba(tint, a * 1.05));
        g.addColorStop(1, rgba(tint, a * .3));
      } else {
        g.addColorStop(0, rgba(col, a * .85));
        g.addColorStop(.45, rgba(col, a * .34));
        g.addColorStop(1, rgba(col, 0));
      }
      bx.fillStyle = g; path(); bx.fill();
    }
    // 主体那一圈把光擦淡，让人和关键物件从色光里立出来。
    // 圈要跟着镜头走：推近/旋转会让主体在屏幕上挪位置，圈不动就会把主体晾在光里
    const h = heroOnScreen();
    if (h) {
      const [hx, hy, hr] = h;
      const m = bx.createRadialGradient(hx, hy, hr * .25, hx, hy, hr);
      m.addColorStop(0, 'rgba(0,0,0,.88)');
      m.addColorStop(.6, 'rgba(0,0,0,.5)');
      m.addColorStop(1, 'rgba(0,0,0,0)');
      bx.globalCompositeOperation = 'destination-out';
      bx.fillStyle = m; bx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2);
    }
    ctx.globalCompositeOperation = mode;
    ctx.drawImage(beamCv, 0, 0);
  };
  pass('multiply');
  pass('screen');
  ctx.globalCompositeOperation = 'source-over';
}
// 污染黄：补色，压在画面一角，让原本干净的原色变得病态
function contaminate(t) {
  const c = SH.taint; if (!c) return;
  const [x, y, w, h, a] = c;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, rgba(GEL.gold, a));
  g.addColorStop(1, rgba(GEL.gold, 0));
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y + h * .18);
  ctx.lineTo(x + w * .92, y + h); ctx.lineTo(x - w * .06, y + h * .8);
  ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}
// 旧的柔光晕保留给不该硬的场合（双联印张等），铅黄镜头一律走 gelBeams
function gelLayers() {
  const L = SH.gel; if (!L) return;
  for (const [x, y, r, col, a, bl] of L) {
    const g = ctx.createRadialGradient(x, y, r * .07, x, y, r);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(.5, rgba(col, a * .42)); g.addColorStop(1, rgba(col, 0));
    ctx.globalCompositeOperation = bl || 'screen';
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  }
  ctx.globalCompositeOperation = 'source-over';
}
// 百叶窗：不是白光透过窗，是彩色色片透过窗——一条钴蓝一条深红交替切在人和墙上，
// 缝隙里是虚空黑。这是铅黄最标志性的一层。
function blinds(t) {
  const k = SH.blinds; if (!k) return;
  const ox = SH.blindsX ?? 320, oy = SH.blindsY ?? 120, rot = SH.blindsR ?? -.44;
  ctx.save();
  ctx.translate(ox, oy); ctx.rotate(rot);
  const w = 46, gap = 40, per = w + gap, slide = (t * 26) % per, R = 1750, fade = 1500;
  let bi = 0;
  for (let x = -R + slide; x < R; x += per, bi++) {
    const a = Math.max(0, 1 - Math.abs(x) / R), aa = a * a;
    if (aa <= .04) continue;
    const mk = (col, al) => {
      const g = ctx.createLinearGradient(0, 0, 0, fade);
      g.addColorStop(0, rgba(col, al * .9));
      g.addColorStop(.5, rgba(col, al * .5));
      g.addColorStop(1, rgba(col, 0));
      return g;
    };
    const col = bi % 2 ? GEL.blue : GEL.red;
    const tint = [Math.round(255 - (255 - col[0]) * .55), Math.round(255 - (255 - col[1]) * .55), Math.round(255 - (255 - col[2]) * .55)];
    // 亮条先压暗，再用 color 把色相强行改成这盏灯的——否则红条打在钴蓝上会相消成紫
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = mk(tint, .4 * k * aa);
    ctx.fillRect(x, 0, w, fade);
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = mk(col, .62 * k * aa);
    ctx.fillRect(x, 0, w, fade);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = mk(col, .2 * k * aa);
    ctx.fillRect(x, 0, w, fade);
    // 缝隙：虚空黑
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = mk(GEL.void, .5 * k * aa);
    ctx.fillRect(x + w, 0, gap, fade);
  }
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}
// 背光面：光在左边，右边就沉进虚空黑里——铅黄的高对比不是靠调亮度，是靠一面黑
function shadeSide() {
  const s = SH.shade; if (!s) return;
  const [x0, y0, x1, y1, a] = s;
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgba(GEL.void, 0));
  g.addColorStop(.5, rgba(GEL.void, a * .5));
  g.addColorStop(1, rgba(GEL.void, a));
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  ctx.globalCompositeOperation = 'source-over';
}

// 低空的彩雾：水里、沙上浮着一层，画面才有空气
function fogBands(t) {
  if (CV < .4) return;
  for (let i = 0; i < 3; i++) {
    const y = 905 + i * 56, h = 50 + i * 12, x = Math.sin(t * .19 + i * 1.7) * 80;
    const col = i === 1 ? GEL.blue : GEL.red, a = .12 - i * .024;
    const g = ctx.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g; ctx.fillRect(x - 200, y - h, 2320, h * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// 硬黑暗角 + 边光：四角压到虚空黑（#0b0b0d），黑边内侧描一圈钴蓝——铅黄的黑是有颜色的黑
function crush(t) {
  const k = SH.crush; if (!k) return;
  const g = ctx.createRadialGradient(960, 500, 620, 960, 500, 1180);
  g.addColorStop(0, 'rgba(11,11,13,0)');
  g.addColorStop(.42, `rgba(11,11,13,${.1 * k})`);
  g.addColorStop(.74, `rgba(11,11,13,${.6 * k})`);
  g.addColorStop(1, `rgba(8,8,10,${.98 * k})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
  // 黑边里的那一圈色：钴蓝为主、深红收尾，只贴着暗部边缘
  const r = ctx.createRadialGradient(960, 500, 780, 960, 500, 1160);
  r.addColorStop(0, 'rgba(27,42,143,0)');
  r.addColorStop(.5, `rgba(27,42,143,${.2 * k})`);
  r.addColorStop(.82, `rgba(179,0,27,${.13 * k})`);
  r.addColorStop(1, 'rgba(179,0,27,0)');
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = r; ctx.fillRect(0, 0, 1920, 1080);
  ctx.globalCompositeOperation = 'source-over';
}

// 前景黑剪影：一道压在画面下沿的东西，画面立刻有了纵深
function foreground(t) {
  const f = SH.fg; if (!f) return;
  const sway = Math.sin(t * .62) * 3.4;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#0a0408';
  if (f === 'branch') {
    // 从右上角伸进来的一枝：主干带弯、分两条小枝、叶簇是不规则的团
    const bx = 2010 + sway * .4, by = -40;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.bezierCurveTo(1770 + sway, 120, 1560 + sway, 206, 1288 + sway, 292);
    ctx.lineTo(1298 + sway, 340);
    ctx.bezierCurveTo(1584 + sway, 254, 1812 + sway, 168, 2048, 28);
    ctx.closePath(); ctx.fill();
    // 小枝：从主干上斜插出去，粗细不一样
    const twigs = [[1830, 96, 1706, 22, 15], [1650, 172, 1568, 66, 12], [1466, 236, 1372, 160, 9]];
    for (const [x0, y0, x1, y1, w] of twigs) {
      ctx.beginPath();
      ctx.moveTo(x0 + sway, y0);
      ctx.quadraticCurveTo((x0 + x1) / 2 + sway + 16, (y0 + y1) / 2 - 14, x1 + sway, y1);
      ctx.lineTo(x1 + sway + 6, y1 + w * .5);
      ctx.quadraticCurveTo((x0 + x1) / 2 + sway + 22, (y0 + y1) / 2 - 6, x0 + sway + w, y0 + w * .7);
      ctx.closePath(); ctx.fill();
    }
    // 叶团：几坨大小不一、边缘毛糙的团挂在枝上——剪影里的树冠是团，不是排列的叶片
    const R2 = rng(9042);
    const blobs = [[1946, 92, 112, 72], [1806, 152, 94, 62], [1662, 212, 116, 74], [1512, 268, 86, 58], [1372, 320, 72, 48], [1880, 188, 64, 44], [1596, 138, 60, 42]];
    for (const [bx0, by0, rw, rh] of blobs) {
      const pts = [];
      const n = 15;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU;
        const wob = .72 + R2() * .5;                     // 边缘毛糙
        pts.push([bx0 + sway + Math.cos(a) * rw * wob, by0 + Math.sin(a) * rh * wob]);
      }
      ctx.beginPath();
      ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
      for (let i = 0; i < n; i++) {
        const p0 = pts[i], p1 = pts[(i + 1) % n];
        ctx.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2);
      }
      ctx.closePath(); ctx.fill();
    }
  } else if (f === 'prow') {
    // 右下角一只搁浅的船：船舷是弧线，船头翘起来，还支着一支桨
    const s = sway * .3;
    ctx.beginPath();
    ctx.moveTo(1980, 1130);
    ctx.bezierCurveTo(1760 + s, 1064, 1470 + s, 1000, 1236 + s, 962);
    ctx.quadraticCurveTo(1188 + s, 946, 1176 + s, 906);   // 翘起的船头
    ctx.quadraticCurveTo(1224 + s, 930, 1268 + s, 946);
    ctx.bezierCurveTo(1500 + s, 986, 1790 + s, 1046, 1980, 1096);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();                                      // 船身下沿
    ctx.moveTo(1236 + s, 968);
    ctx.bezierCurveTo(1420 + s, 1046, 1700 + s, 1104, 1980, 1132);
    ctx.lineTo(1980, 1140); ctx.lineTo(1236 + s, 1000);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();                                      // 支在船边的桨
    ctx.moveTo(1332 + s, 972);
    ctx.lineTo(1120 + s, 806); ctx.lineTo(1096 + s, 786);
    ctx.quadraticCurveTo(1064 + s, 762, 1082 + s, 752);
    ctx.quadraticCurveTo(1104 + s, 748, 1122 + s, 772);
    ctx.lineTo(1346 + s, 964);
    ctx.closePath(); ctx.fill();
  } else if (f === 'reeds') {
    // 右下角一丛芦苇：高低错落、各自弯向不同（左下角留给字幕）
    const R3r = rng(613);
    const x0 = SH.fgX ?? 1140, hMax = SH.fgH ?? 190;
    for (let i = 0; i < 21; i++) {
      const x = x0 + i * 40 + R3r() * 26;
      const h = 74 + R3r() * hMax;
      const bend = (R3r() - .35) * 74 + Math.sin(t * .7 + i * .8) * 7;
      const w = 7 + R3r() * 8;
      ctx.beginPath();
      ctx.moveTo(x, 1128);
      ctx.quadraticCurveTo(x + bend * .35, 1128 - h * .62, x + bend, 1128 - h);
      ctx.quadraticCurveTo(x + bend * .35 + w, 1128 - h * .6, x + w, 1128);
      ctx.closePath(); ctx.fill();
      // 顶上的穗
      if (i % 3 !== 1) {
        ctx.save();
        ctx.translate(x + bend, 1128 - h);
        ctx.rotate(bend * .004 - .2);
        ctx.beginPath(); ctx.ellipse(0, -14, w * .8, 24, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
    // 底边不是硬直角，是一道起伏的暗岸
    ctx.beginPath();
    ctx.moveTo(x0 - 40, 1128);
    ctx.quadraticCurveTo(1400, 1078, 1700, 1096);
    ctx.quadraticCurveTo(1860, 1104, 1980, 1082);
    ctx.lineTo(1980, 1128);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

window.DUR = DUR;
// 铅黄的卖点是美女：第一帧纸上就得站着一个，海湾页沙滩上也站一个
function openingWoman(t) {
  const g = CAST.cast_girl2 || CAST.cast_girl1;
  if (!g) return;
  const ar = g.width / g.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // ① 片头 0–2.28：右侧前景，第 0 帧就满强度，慢推
  if (t <= 2.28) {
    const u = eio(seg(t, 0, 2.28));
    const h = 740 * (1 + .05 * u), w = h * ar;
    const bx = 1452 - 26 * u;
    // 身后先压一块酒红暗底，要不她在浅色纸上是个水印
    ctx.save();
    const bg = ctx.createRadialGradient(bx, 770, 30, bx, 770, 560);
    bg.addColorStop(0, 'rgba(78,12,24,.58)');
    bg.addColorStop(.55, 'rgba(42,10,30,.34)');
    bg.addColorStop(1, 'rgba(42,10,30,0)');
    ctx.fillStyle = bg; ctx.fillRect(bx - 620, 60, 1240, 1020);
    ctx.restore();
    ctx.save();
    ctx.translate(bx, 1108);
    ctx.rotate(-.014);
    ctx.filter = 'saturate(1.38) contrast(1.20) brightness(.95)';
    ctx.drawImage(g, -w / 2, -h, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = .34;
    ctx.fillStyle = 'rgba(40,14,14,.9)';
    ctx.beginPath(); ctx.ellipse(1452 - 26 * u, 1104, w * .40, 16, 0, 0, TAU); ctx.fill();
    ctx.restore();
    return;
  }
  // ② 海湾页（21.48–24.55）：沙滩右侧站一个，随镜头推进慢慢挪
  const k = seg(t, 21.48, 24.55);
  if (k > 0 && k < 1) {
    const h = 268 * (1 + .10 * k), w = h * ar;
    ctx.save();
    ctx.globalAlpha = clamp(k * 2.4) * clamp((1 - k) * 3.2);
    ctx.translate(1600 - 34 * k, 866);
    ctx.filter = 'saturate(1.18) sepia(.16) contrast(1.04)';
    ctx.drawImage(CAST.cast_girl3 || g, -w / 2, -h, w, h);
    ctx.restore();
  }
}

// 铅黄片的卖点是美女：除了已经安排好人的镜头，剩下的每一镜都往画面里排一位女主角
const WOMEN = ['cast_girl5', 'cast_girl1', 'cast_girl6', 'cast_girl3', 'cast_girl7', 'cast_girl2', 'cast_girl8', 'cast_girl4'];
function shotWoman(t, SH, idx) {
  if (t < 2.30) return;                       // 片头已有
  if (SH.bava) return;                        // 14s 那镜已经换成人
  if (SH.split) return;
  if (SH.card && /^cast_/.test(SH.card.id || '')) return;
  if (t > 21.48 && t < 24.58) return;         // 海湾页已有
  const g = CAST[WOMEN[idx % WOMEN.length]];
  if (!g) return;
  const h = 396 + (idx % 3) * 44, w = h * g.width / g.height;
  // 一律站到画面右边缘（多半压在框上、只露八成身子）——那是字幕绝对不会去的地方
  const x = 1792 - (idx % 2) * 54;
  const y = 1040;
  const bob = 1 + .012 * Math.sin(t * 1.1 + idx * 1.7);
  ctx.save();
  const bg = ctx.createRadialGradient(x, y - h * .55, 20, x, y - h * .55, h * .95);
  bg.addColorStop(0, 'rgba(70,10,22,.34)');
  bg.addColorStop(1, 'rgba(70,10,22,0)');
  ctx.fillStyle = bg; ctx.fillRect(x - h, y - h * 1.5, h * 2, h * 1.8);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = .93;
  ctx.translate(x, y);
  ctx.filter = 'saturate(1.18) sepia(.10) contrast(1.05)';
  ctx.drawImage(g, -w / 2, -h * bob, w, h * bob);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = .30;
  ctx.fillStyle = 'rgba(30,8,10,.9)';
  ctx.beginPath(); ctx.ellipse(x, y - 2, w * .36, 14, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

window.render = t => {
  SH = shotAt(t);
  CV = SH.cut === -1e5 ? 0 : SH.cut === 'reveal' ? clamp((t - SH.t0) / 1.1) : 1;
  const cam = camera(t), cut = cutY(t);
  CUR = cam;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over';
  if (SH.split) {
    splitPlate(t, cam);
    CV = 0;
  } else {
    comp({ ...cam, cut }, t);
    ctx.drawImage(glc, 0, 0);
    toScreen(cam);
    clouds(t);
    halo(t);
    ripples(t);
    shoreFoam(t);
    glitter(t);
    stars(t);
    traceStrokes(t);
    laterCrowd(t);
    reel(t);
    filmstrip(t);
    director(t);
    jason(t, SH.jason && { ...SH.jason, t0: SH.t0, t1: SH.t1 });
    notes(t);
    title(t);
    // 这一镜如果是"小画"，就在世界坐标里贴上去：它跟海湾共用同一台相机、同一副色片灯
    if (SH.card) cards(ctx, t, [SH.card], CV ? 'B' : 'A');
  }
  // 末了的压暗，在屏幕上压
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  shadeSide();
  fogBands(t);
  gelBeams(t);
  contaminate(t);
  gelLayers();
  blinds(t);
  shadowVignette(t);
  crush(t);
  // 前景离镜头更近，镜头一转它滑得更快——这是让画面立起来的那点视差
  const pdx = (cam.cx - SH.cam[0]) * cam.z, pdy = (cam.cy - SH.cam[1]) * cam.z;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(-pdx * 1.5, -pdy * 1.5);
  foreground(t);
  ctx.restore();
  openingWoman(t);
  shotWoman(t, SH, Math.max(0, SHOTS.indexOf(SH)));
  // 纸纹（压在整页上，包括后画的笔与字）
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = toothPat;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillRect(0, 0, 1920, 1080); ctx.restore();
  subtitle(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
window.STROKES = world.strokes;
window.CUES = CUES;
window.READY = true;

