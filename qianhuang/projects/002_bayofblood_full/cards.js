// qianhuang · 插图卡片（贴在页上的小画）
// 海湾那一页只讲得了开场。全片剩下的内容——铅黄是什么、巴瓦是谁、十三场谋杀怎么排、
// 玩具推车怎么推轨、剧场里观众怎么被吓傻——都是另外的小画。
// 规矩跟大页一样：浓彩平涂、抖边、两盏灯从外面打进来、暗部沉进墨黑；不同的是它们有边框，
// 像解说本上贴的一格一格插图。卡片只在对应镜头的时间窗里出现，切走就撤。
import { rng, n2, hex, clamp, lerp, TAU } from './engine.js';

export const CW = 1700, CH = 1060;

// 铅黄三原色 + 一点被污染的黄（跟 world.js 的 B 版同一套）
const P = {
  red: '#b3001b', redD: '#5e040d', redB: '#d8121f',
  blue: '#1b2a8f', blueD: '#0a1440', blueB: '#2035bf',
  green: '#0f7a5c', greenD: '#04241c', acid: '#7cc41a',
  gold: '#ffc84e', goldD: '#8a6414', goldB: '#ffdf8a',
  ink: '#0b0b0d', ink2: '#171019', paper: '#f5eede', paperD: '#d8caae',
  skin: '#d9b08a', wax: '#e8d2a0', bone: '#efe6d2', brass: '#c08a2a',
};

const R = (seed) => rng(seed);

// 抖边多边形：一条手画的边，不是矢量矩形
function rough(pts, seed, amp = 7, step = 1) {
  const r = R(seed), out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const n = Math.max(2, Math.round(L / (44 * step)));
    for (let k = 0; k < n; k++) {
      const u = k / n;
      out.push([a[0] + dx * u + (r() - .5) * amp, a[1] + dy * u + (r() - .5) * amp]);
    }
  }
  return out;
}
function poly(ctx, pts, col, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col;
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.fill(); ctx.restore();
}
function edge(ctx, pts, col, w = 2, a = .9) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  ctx.stroke(); ctx.restore();
}
const box = (x, y, w, h, seed, amp = 7) => rough([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], seed, amp);
function ink(ctx, pts, w = 2.2, col = P.ink, a = .92) {
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
}
function disc(ctx, x, y, rx, ry, col, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.restore();
}
// 干边：色块里第二层更暗的一圈，手涂的痕迹
function dry(ctx, pts, col, w = 8, a = .5) { edge(ctx, pts, col, w, a); }

// ———— 卡片本体：纸片、金边、四角胶带 ————
function frame(ctx, t, seed) {
  const r = R(seed);
  poly(ctx, box(6, 6, CW - 12, CH - 12, seed, 9), '#120b12', .98);
  poly(ctx, box(20, 20, CW - 40, CH - 40, seed + 1, 7), '#0d0810', 1);
  // 金边双线
  edge(ctx, box(20, 20, CW - 40, CH - 40, seed + 1, 7), P.goldD, 3.4, .85);
  edge(ctx, box(34, 34, CW - 68, CH - 68, seed + 2, 5), P.gold, 1.6, .55 + .07 * Math.sin(t * 1.7));
  // 四角胶带
  for (const [cx, cy, sx, sy] of [[30, 30, 1, 1], [CW - 30, 30, -1, 1], [30, CH - 30, 1, -1], [CW - 30, CH - 30, -1, -1]]) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(.78 * sx);
    ctx.globalAlpha = .3; ctx.fillStyle = P.paper;
    ctx.fillRect(-62, -22, 124, 44); ctx.restore();
  }
  // 上缘一条淡纸带：留给页边注记
  poly(ctx, box(70, 26, CW - 140, 26, seed + 3, 3), P.paperD, .16);
  if (r() < 2) return;
}

// ———— 每一格小画 ————
const KIT = {};

// 黑手套握着刀：铅黄的凶手第一个记号
KIT.glove = (ctx, t) => {
  const r = R(7101);
  poly(ctx, box(0, 0, CW, CH, 7100, 10), P.blueD, 1);
  poly(ctx, box(0, 320, CW, 740, 7101, 12), P.redD, .85);
  // 斜切过来的刀身
  const kx = 300 + 40 * Math.sin(t * .6), ky = 880;
  poly(ctx, rough([[kx, ky], [kx + 900, 120], [kx + 960, 190], [kx + 60, ky + 120]], 7102, 6), '#cfd6dc', .95);
  poly(ctx, rough([[kx + 60, ky + 120], [kx + 960, 190], [kx + 1000, 240], [kx + 110, ky + 170]], 7103, 5), '#8d99a8', .8);
  ink(ctx, [[kx + 6, ky + 40], [kx + 900, 150]], 2.0, '#f6fbff', .8);
  // 白衬衫袖口 + 黑手套
  poly(ctx, rough([[150, 700], [430, 640], [470, 900], [190, 960]], 7104, 9), P.paper, .9);
  ink(ctx, [[300, 690], [330, 900]], 2.4, P.paperD, .8);
  poly(ctx, rough([[360, 700], [560, 660], [610, 880], [410, 930]], 7105, 9), '#141018', .98);
  // 指节
  for (let i = 0; i < 4; i++) ink(ctx, [[430 + i * 34, 690], [424 + i * 34, 900]], 3.0, '#2a2330', .9);
  edge(ctx, [[360, 700], [560, 660], [610, 880], [410, 930]], P.gold, 1.6, .35);
  // 血从刀尖滴下来
  disc(ctx, kx + 300, ky - 120, 16, 26, P.red, .9);
  disc(ctx, kx + 520, ky - 60, 11, 18, P.red, .8);
};

// 漂亮受害者：脸、红唇、一只捂住嘴的手
KIT.face = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7200, 10), P.blueD, 1);
  poly(ctx, box(0, 620, CW, 440, 7201, 10), P.redD, .7);
  // 脸（侧倾）
  ctx.save(); ctx.translate(860, 500); ctx.rotate(-.12);
  poly(ctx, rough([[-150, -240], [130, -270], [190, -40], [120, 250], [-60, 300], [-190, 90]], 7202, 8), P.skin, .95);
  disc(ctx, 40, 330, 60, 70, P.skin, .9);
  // 眼睛：只有一道更深的影，不画眼珠
  poly(ctx, rough([[-120, -60], [40, -78], [44, -30], [-116, -14]], 7203, 4), '#2a1a18', .9);
  poly(ctx, rough([[84, -70], [176, -84], [180, -40], [88, -28]], 7204, 4), '#2a1a18', .9);
  // 红唇
  poly(ctx, rough([[-40, 150], [80, 138], [104, 168], [10, 190], [-52, 176]], 7205, 4), P.redB, .98);
  ink(ctx, [[-40, 158], [86, 148]], 2.2, P.redD, .9);
  // 头发：两大块垂下来
  poly(ctx, rough([[-190, -200], [-20, -290], [60, -250], [-60, -160]], 7206, 7), '#1a1216', .95);
  poly(ctx, rough([[-200, 80], [-160, 260], [-60, 330], [-90, 60]], 7207, 8), '#1a1216', .95);
  ctx.restore();
  // 一只戴戒指的手捂住嘴（从右下伸进来）
  poly(ctx, rough([[1080, 720], [1260, 640], [1330, 860], [1130, 940]], 7208, 9), P.skin, .92);
  for (let i = 0; i < 4; i++) ink(ctx, [[1150 + i * 40, 690], [1120 + i * 40, 910]], 2.6, '#a8765a', .8);
  disc(ctx, 1300, 760, 12, 12, P.gold, .85);
};

// 黄皮小说：一摞斜放的 giallo 平装本
KIT.books = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7300, 9), '#160f18', 1);
  poly(ctx, box(0, 760, CW, 300, 7301, 9), P.redD, .55);
  const r = R(7302);
  // 三摞书
  const stack = (bx, by, n, rot) => {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(rot);
    for (let i = 0; i < n; i++) {
      const y = -i * 46, w = 480 - i * 12, off = (r() - .5) * 18;
      poly(ctx, box(-w / 2 + off, y - 40, w, 40, 7303 + i * 7 + bx, 4), P.gold, .95);
      poly(ctx, box(-w / 2 + off, y - 40, w, 9, 7304 + i * 7 + bx, 3), '#ffe9a8', .9);   // 上沿一道亮边
      ink(ctx, [[-w / 2 + off + 40, y - 20], [w / 2 + off - 90, y - 22]], 3.4, P.ink, .85);  // 书名条
      poly(ctx, box(w / 2 + off - 70, y - 36, 34, 30, 7305 + i * 7 + bx, 3), P.red, .9);     // 红标
    }
    // 书页侧面：白
    poly(ctx, box(-w0() / 2, -n * 46 - 6, 40, n * 46, 7306 + bx, 4), P.paper, .8);
    ctx.restore();
  };
  const w0 = () => 480;
  stack(420, 800, 5, -.06);
  stack(780, 850, 7, .04);
  stack(1180, 820, 4, -.1);
  // 中间一本摊开，右页写着 GIALLO
  ctx.save(); ctx.translate(900, 300); ctx.rotate(-.05);
  poly(ctx, rough([[-330, -140], [0, -180], [330, -140], [330, 150], [0, 190], [-330, 150]], 7307, 6), P.paper, .92);
  ink(ctx, [[0, -180], [0, 190]], 2.6, P.paperD, .8);
  for (let i = 0; i < 5; i++) ink(ctx, [[40, -80 + i * 46], [280, -92 + i * 46]], 2.2, P.ink, .55);
  // 封面上那块黄
  poly(ctx, box(-300, -110, 250, 210, 7308, 5), P.gold, .95);
  ink(ctx, [[-280, 0], [-70, -6]], 6, P.ink, .9);
  ink(ctx, [[-280, 60], [-120, 54]], 4, P.ink, .8);
  ctx.restore();
  // 一点红印
  disc(ctx, 1420, 640, 54, 54, P.red, .8);
  ink(ctx, [[1378, 616], [1462, 662]], 3.4, P.redD, .8);
};

// 巴瓦：眼镜、烟、白发、深色西装
KIT.portrait = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7400, 9), P.blueD, 1);
  // 背后的窗光
  poly(ctx, rough([[520, 60], [1180, 40], [1210, 620], [500, 640]], 7401, 8), '#243a86', .55);
  // 肩、西装
  poly(ctx, rough([[420, 1000], [520, 660], [700, 560], [1020, 560], [1240, 680], [1330, 1010]], 7402, 9), '#141018', .97);
  edge(ctx, [[420, 1000], [520, 660], [700, 560], [1020, 560], [1240, 680], [1330, 1010]], '#2b2431', 2.2, .8);
  // 白衬衫领口
  poly(ctx, rough([[770, 580], [880, 700], [1010, 580], [960, 800], [820, 800]], 7403, 5), '#d8d2c4', .9);
  // 脖子与脸
  poly(ctx, rough([[800, 560], [980, 560], [960, 300], [820, 300]], 7404, 7), P.skin, .95);
  poly(ctx, rough([[790, 320], [990, 300], [1010, 120], [900, 60], [790, 110]], 7405, 8), P.skin, .95);
  // 白发：三块，往后梳
  poly(ctx, rough([[770, 150], [880, 40], [1020, 70], [1010, 130], [860, 120]], 7406, 8), '#ded6c4', .95);
  // 眼镜：两个圆 + 鼻梁
  for (const gx of [850, 962]) {
    ctx.save(); ctx.strokeStyle = '#1a1216'; ctx.lineWidth = 4.2;
    ctx.beginPath(); ctx.arc(gx, 216, 34, 0, TAU); ctx.stroke(); ctx.restore();
    disc(ctx, gx + 8, 210, 8, 8, '#efe8d8', .5);
  }
  ink(ctx, [[884, 216], [928, 216]], 3.2, '#1a1216', .92);
  // 烟：一根细线 + 红点 + 一缕烟
  ink(ctx, [[940, 300], [1030, 372]], 3.0, '#e8dcbe', .9);
  disc(ctx, 1032, 374, 9, 9, '#ff5a20', .95);
  for (let i = 0; i < 3; i++) {
    const ph = (t * .5 + i * .33) % 1;
    ctx.save(); ctx.globalAlpha = .22 * (1 - ph); ctx.strokeStyle = '#cfc8bc'; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(1040, 370 - ph * 40);
    ctx.quadraticCurveTo(1060 + 30 * Math.sin(ph * 4), 330 - ph * 120, 1030 + 50 * Math.sin(ph * 3), 280 - ph * 160);
    ctx.stroke(); ctx.restore();
  }
  // 两盏灯的边：右红左蓝
  ink(ctx, [[1240, 700], [1330, 1010]], 6, '#d8121f', .4);
  ink(ctx, [[520, 680], [430, 1000]], 5, '#2035bf', .34);
};

// 哥特：尖拱窗、烛台、十字
KIT.gothic = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7500, 9), '#0a0812', 1);
  const arch = (cx, w, h, col, a) => {
    const pts = [];
    pts.push([cx - w / 2, 980]);
    pts.push([cx - w / 2, 420]);
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([cx - w / 2 + w * u * .5, 420 - Math.sin(u * Math.PI * .5) * 300]); }
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([cx + w * .02 + w * u * .48, 120 + Math.sin(u * Math.PI * .5) * 300]); }
    pts.push([cx + w / 2, 980]);
    poly(ctx, rough(pts, 7501 + cx, 6), col, a);
    edge(ctx, pts, '#e8dccc', 3.2, .35);
    // 竖棂
    ink(ctx, [[cx, 400], [cx, 980]], 4, '#0a0812', .9);
    ink(ctx, [[cx - w * .3, 470], [cx - w * .3, 980]], 2.6, '#0a0812', .7);
    ink(ctx, [[cx + w * .3, 470], [cx + w * .3, 980]], 2.6, '#0a0812', .7);
  };
  arch(560, 300, 400, '#243a86', .5);
  arch(860, 340, 400, '#3b1420', .55);
  arch(1150, 300, 400, '#243a86', .45);
  // 窗里落下来的光：硬边梯形
  poly(ctx, rough([[700, 420], [1040, 420], [1200, 1010], [560, 1010]], 7502, 8), '#ffc84e', .12);
  // 烛台
  poly(ctx, rough([[1330, 980], [1370, 980], [1360, 820], [1340, 820]], 7503, 5), P.brass, .9);
  disc(ctx, 1350, 800, 26, 34, '#ffe9a8', .9);
  disc(ctx, 1350, 790, 12, 20, '#ff9a2a', .95);
  for (let i = 0; i < 2; i++) {
    const ph = (t * .8 + i * .5) % 1;
    disc(ctx, 1350 + 8 * Math.sin(ph * 6), 760 - ph * 30, 8, 12, '#ffb43a', .3 * (1 - ph));
  }
  // 十字
  poly(ctx, box(196, 640, 26, 320, 7504, 4), '#1a1216', .95);
  poly(ctx, box(150, 720, 120, 24, 7505, 4), '#1a1216', .95);
  edge(ctx, [[196, 640], [222, 640], [222, 960]], '#c08a2a', 1.6, .3);
};

// 欠税：一叠单据、红章、硬币
KIT.tax = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7600, 9), '#1a1016', 1);
  poly(ctx, box(0, 0, CW, 300, 7601, 9), P.redD, .5);
  // 单据堆（斜）
  for (let i = 3; i >= 0; i--) {
    const r = R(7602 + i);
    poly(ctx, rough([[300 + i * 14, 240 + i * 16], [1180 + i * 8, 200 + i * 16], [1210 + i * 8, 880 - i * 10], [330 + i * 14, 920 - i * 10]], 7603 + i, 8), i === 0 ? P.paper : '#e4d8bc', .95);
    for (let k = 0; k < 7; k++) ink(ctx, [[370 + i * 14, 300 + k * 60 + i * 16], [900 + r() * 240, 296 + k * 60 + i * 16]], 2.0, '#6a5a48', .6);
  }
  // 大号数字一样的横线（不写字，只留条）
  for (let k = 0; k < 3; k++) poly(ctx, box(360, 640 + k * 70, 420 - k * 80, 26, 7604 + k, 4), '#2a2018', .5);
  // 红章：一枚歪的方章
  ctx.save(); ctx.translate(1000, 740); ctx.rotate(-.18);
  ctx.strokeStyle = P.redB; ctx.lineWidth = 8; ctx.globalAlpha = .9;
  ctx.strokeRect(-130, -70, 260, 140);
  ctx.lineWidth = 5; ctx.strokeRect(-110, -52, 220, 104);
  for (let i = 0; i < 3; i++) ink(ctx, [[-90, -20 + i * 40], [90, -26 + i * 40]], 6, P.red, .8);
  ctx.restore();
  // 硬币
  for (const [x, y, r0] of [[1290, 880, 46], [1390, 930, 40], [1340, 800, 34]]) {
    disc(ctx, x, y, r0, r0 * .82, P.brass, .95);
    edge(ctx, [[x - r0, y], [x - r0 * .7, y - r0 * .6], [x + r0 * .7, y - r0 * .6], [x + r0, y]], '#8a6414', 2.2, .8);
  }
};

// 片场：打板、摄影机、轨道 —— 1971 年仓促开工
KIT.set = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7700, 9), '#0e0a12', 1);
  poly(ctx, box(0, 700, CW, 360, 7701, 9), '#2a1014', .7);
  // 两条轨道
  for (const y of [960, 1000]) {
    poly(ctx, box(120, y, 1460, 12, 7702 + y, 4), '#6a5a48', .85);
    ink(ctx, [[130, y + 6], [1450, y + 4]], 2.0, '#3a2e24', .7);
  }
  // 摄影机（三脚架 + 机身 + 两个片盘）
  const cx = 980, cy = 620;
  poly(ctx, rough([[cx - 60, cy + 90], [cx - 150, cy + 360], [cx - 110, cy + 360], [cx - 20, cy + 100]], 7703, 6), '#1a1418', .95);
  poly(ctx, rough([[cx + 60, cy + 90], [cx + 160, cy + 360], [cx + 120, cy + 360], [cx + 20, cy + 100]], 7704, 6), '#1a1418', .95);
  poly(ctx, rough([[cx - 30, cy + 90], [cx + 20, cy + 100], [cx + 10, cy + 380], [cx - 20, cy + 380]], 7705, 5), '#1a1418', .9);
  poly(ctx, box(cx - 150, cy - 60, 300, 170, 7706, 7), '#20161c', .97);
  disc(ctx, cx - 90, cy - 80, 66, 66, '#2a2028', .95);
  disc(ctx, cx + 80, cy - 80, 60, 60, '#2a2028', .95);
  disc(ctx, cx - 90, cy - 80, 26, 26, '#0d0810', .9);
  disc(ctx, cx + 80, cy - 80, 24, 24, '#0d0810', .9);
  // 镜头筒
  poly(ctx, box(cx + 150, cy - 20, 120, 70, 7707, 5), '#141018', .95);
  ink(ctx, [[cx + 260, cy + 10], [cx + 272, cy + 40]], 6, P.gold, .4);
  // 打板（斜举）
  ctx.save(); ctx.translate(430, 420); ctx.rotate(-.16);
  poly(ctx, box(0, 0, 300, 210, 7708, 6), '#141018', .97);
  poly(ctx, box(0, 0, 300, 44, 7709, 5), '#e8dcc8', .92);
  for (let i = 0; i < 5; i++) poly(ctx, box(24 + i * 54, 0, 26, 44, 7710 + i, 3), '#141018', .92);
  ctx.restore();
  // 右上一束蓝灯
  poly(ctx, rough([[1240, 0], [1700, 0], [1300, 520], [1080, 300]], 7711, 10), '#2035bf', .18);
};

// 别墅内景：轮椅上的老太、绳、站着的凶手
KIT.interior = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7800, 9), '#241016', 1);
  // 墙（暖金）+ 右侧紫红阴影
  poly(ctx, box(0, 0, CW, 760, 7801, 9), '#ffe8a8', .9);
  poly(ctx, box(CW - 520, 0, 520, 760, 7802, 8), '#7a2a4e', .75);
  // 窗
  poly(ctx, box(220, 120, 330, 380, 7803, 6), '#7a2a4e', .9);
  poly(ctx, box(240, 140, 290, 340, 7804, 5), '#0b0b0d', .85);
  ink(ctx, [[360, 140], [360, 480]], 3, '#ffe8a8', .6);
  // 地面
  poly(ctx, box(0, 760, CW, 300, 7805, 9), '#3a2018', .95);
  for (let i = 0; i < 4; i++) ink(ctx, [[80 + i * 30, 800], [1600 - i * 40, 1020]], 2.0, '#241016', .5);
  // 轮椅
  const wx = 1010, wy = 800;
  disc(ctx, wx - 90, wy + 130, 84, 84, '#1a1216', .95);
  disc(ctx, wx + 120, wy + 150, 60, 60, '#1a1216', .95);
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ink(ctx, [[wx - 90 + Math.cos(a) * 78, wy + 130 + Math.sin(a) * 78], [wx - 90 + Math.cos(a) * 40, wy + 130 + Math.sin(a) * 40]], 2.4, '#3a2e34', .7); }
  poly(ctx, box(wx - 150, wy - 20, 300, 40, 7806, 5), '#2a2018', .95);   // 扶手
  poly(ctx, box(wx - 120, wy + 30, 260, 120, 7807, 5), '#7a2a4e', .8);    // 座位
  // 老太：白发、驼背、深色衣服
  poly(ctx, rough([[wx - 80, wy + 20], [wx + 60, wy - 10], [wx + 90, wy - 150], [wx - 70, wy - 120]], 7808, 7), '#241826', .95);
  disc(ctx, wx - 10, wy - 210, 56, 60, P.skin, .9);
  poly(ctx, rough([[wx - 70, wy - 250], [wx + 50, wy - 260], [wx + 20, wy - 200], [wx - 60, wy - 190]], 7809, 6), '#efe6d2', .95);  // 白发
  ink(ctx, [[wx - 40, wy - 218], [wx - 14, wy - 214]], 2.6, '#2a1a18', .7);
  ink(ctx, [[wx + 6, wy - 216], [wx + 30, wy - 212]], 2.6, '#2a1a18', .7);
  // 绳：从画外垂下来，绕颈一圈，往上收紧
  ink(ctx, [[wx + 10, wy - 246], [wx + 26, wy - 330], [wx + 8, wy - 430], [wx + 30, wy - 540]], 6, '#c8b48a', .85);
  ink(ctx, [[wx - 30, wy - 244], [wx + 52, wy - 250]], 7, '#c8b48a', .9);
  // 站着的凶手：剪影，背对
  poly(ctx, rough([[430, 980], [470, 620], [560, 560], [640, 620], [680, 980]], 7810, 8), '#141018', .97);
  disc(ctx, 555, 520, 52, 56, '#241826', .95);
  ink(ctx, [[470, 640], [430, 980]], 5, '#2035bf', .3);
  ink(ctx, [[640, 640], [680, 980]], 6, '#d8121f', .34);
};

// 背后一刀：看不见的人只留一只手
KIT.stabbed = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7900, 9), '#140a12', 1);
  poly(ctx, box(0, 520, CW, 540, 7901, 9), P.redD, .6);
  // 背影（西装，肩宽）
  poly(ctx, rough([[560, 1010], [600, 520], [700, 440], [1000, 440], [1100, 520], [1150, 1010]], 7902, 9), '#1a1420', .97);
  edge(ctx, [[600, 520], [700, 440], [1000, 440], [1100, 520]], '#2b2431', 2.4, .8);
  disc(ctx, 850, 380, 74, 80, '#241826', .95);
  // 背上的刀：柄在外，刃没进去，血从刀口往下淌
  const jx = 900, jy = 620;
  poly(ctx, rough([[jx, jy], [jx + 150, jy - 90], [jx + 168, jy - 50], [jx + 26, jy + 34]], 7903, 5), '#cfd6dc', .9);
  poly(ctx, box(jx - 90, jy - 6, 96, 52, 7904, 5), '#2a2018', .95);
  poly(ctx, box(jx - 110, jy - 40, 26, 110, 7905, 4), '#3a2a1c', .95);
  // 血
  poly(ctx, rough([[jx - 20, jy + 20], [jx + 120, jy - 20], [jx + 90, jy + 150], [jx + 10, jy + 220], [jx - 40, jy + 80]], 7906, 8), P.redB, .85);
  for (let i = 0; i < 4; i++) {
    const ph = (t * .35 + i * .25) % 1;
    disc(ctx, jx - 10 + i * 34, jy + 120 + ph * 300, 10, 16 + ph * 20, P.red, .8 * (1 - ph * .6));
  }
  // 看不见的人：只有一只握刀的手从左侧伸进来
  poly(ctx, rough([[120, 470], [300, 420], [340, 600], [160, 650]], 7907, 8), P.skin, .9);
  poly(ctx, rough([[270, 420], [420, 480], [390, 540], [250, 490]], 7908, 6), '#141018', .95);
};

// 十三个人：两排斜躺的剪影，墙上十三道刻痕
KIT.thirteen = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8000, 9), '#120a10', 1);
  poly(ctx, box(0, 700, CW, 360, 8001, 9), P.redD, .55);
  const r = R(8002);
  let n = 0;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 7; i++) {
      if (n >= 13) break;
      const x = 120 + i * 230 + row * 90, y = 860 + row * 130 + (r() - .5) * 40;
      ctx.save(); ctx.translate(x, y); ctx.rotate((r() - .5) * .5);
      // 身体：一段粗线加一坨
      poly(ctx, rough([[-120, 10], [-40, -34], [90, -10], [130, 26], [40, 40], [-90, 40]], 8003 + n, 7), '#0d0810', .95);
      disc(ctx, -150, -20, 30, 34, '#0d0810', .95);
      // 血泊
      disc(ctx, 40, 60, 90 + r() * 40, 22, P.redD, .75);
      ctx.restore();
      n++;
    }
  }
  // 墙上的刻痕：十三道
  for (let i = 0; i < 13; i++) {
    ink(ctx, [[180 + i * 46, 210], [186 + i * 46, 330]], 3.4, '#e8dcc8', .55);
  }
  ink(ctx, [[170, 200], [180 + 12 * 46 + 12, 200]], 2.4, P.gold, .5);
};

// 连锁反应：三条鱼咬着尾巴转成一个环
KIT.chain = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8100, 9), P.blueD, 1);
  const cx = 850, cy = 520, Rr = 300;
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + .3 * Math.sin(t * .4), nx = cx + Math.cos(a) * Rr, ny = cy + Math.sin(a) * Rr * .82;
    ctx.save(); ctx.translate(nx, ny); ctx.rotate(a + 1.6);
    // 鱼身：一个纺锤 + 尾鳍
    poly(ctx, rough([[-150, 0], [-40, -70], [110, -20], [150, 0], [110, 22], [-40, 70]], 8101 + i, 6), i === 1 ? P.red : P.green, .9);
    poly(ctx, rough([[150, 0], [250, -66], [230, 0], [250, 60]], 8104 + i, 6), i === 1 ? P.redD : P.greenD, .9);
    disc(ctx, -96, -22, 16, 16, P.ink, .85);
    ink(ctx, [[-30, -40], [60, -10]], 2.4, P.ink, .5);
    ctx.restore();
  }
  // 环上的箭头：一环吃一环
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + .4;
    const x = cx + Math.cos(a) * (Rr + 120), y = cy + Math.sin(a) * (Rr + 120) * .82;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + 1.57);
    ink(ctx, [[-26, 0], [26, 0]], 4, P.gold, .55);
    ink(ctx, [[10, -14], [26, 0], [10, 14]], 4, P.gold, .55);
    ctx.restore();
  }
  // 中间一点血
  disc(ctx, cx, cy, 42, 42, P.red, .5);
  disc(ctx, cx, cy, 20, 20, P.redB, .8);
};

// 四个年轻人：两男两女，提着包、挂着相机，走进画面
KIT.kids = (ctx, t) => {
  poly(ctx, box(0, 0, CW, 600, 8200, 9), '#0a1230', .95);
  poly(ctx, box(0, 600, CW, 460, 8201, 9), '#2a1014', .8);
  // 远处的水与林带
  ink(ctx, [[0, 620], [400, 606], [900, 618], [1700, 604]], 3, P.blue, .5);
  const r = R(8202);
  const kid = (x, h, col, top, i) => {
    const y = 900;
    poly(ctx, rough([[x - h * .16, y], [x - h * .1, y - h * .62], [x + h * .1, y - h * .62], [x + h * .17, y]], 8203 + i, 6), col, .95);
    disc(ctx, x, y - h * .74, h * .1, h * .11, P.skin, .92);         // 头
    poly(ctx, rough([[x - h * .11, y - h * .86], [x + h * .11, y - h * .86], [x + h * .06, y - h * .72], [x - h * .06, y - h * .72]], 8210 + i, 5), '#241a16', .9); // 头发
    // 短裤/裙子的色块
    poly(ctx, box(x - h * .15, y - h * .40, h * .3, h * .18, 8220 + i, 4), top, .9);
    // 手臂
    ink(ctx, [[x - h * .1, y - h * .58], [x - h * .2, y - h * .3]], 4, col, .9);
    ink(ctx, [[x + h * .1, y - h * .58], [x + h * .21, y - h * .32]], 4, col, .9);
  };
  kid(380, 420, P.paper, P.red, 0);
  kid(700, 400, '#e8dcc8', P.blue, 1);
  kid(1060, 430, P.paper, P.acid, 2);
  kid(1370, 395, '#e8dcc8', P.red, 3);
  // 相机挂在其中一人胸前
  poly(ctx, box(660, 620, 70, 46, 8230, 4), '#141018', .95);
  disc(ctx, 695, 643, 18, 18, '#3a3a44', .9);
  // 行李袋
  poly(ctx, rough([[1150, 780], [1250, 760], [1270, 870], [1160, 890]], 8231, 6), '#5e2a18', .9);
};

// 海里游泳，撞见一具尸体
KIT.swim = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8300, 9), '#06242a', 1);
  poly(ctx, box(0, 0, CW, 420, 8301, 9), '#0a1230', .9);
  // 水面：一道道横纹，随时间移
  const r = R(8302);
  for (let i = 0; i < 16; i++) {
    const y = 440 + i * 40, ph = Math.sin(t * .8 + i * .5) * 16;
    ink(ctx, [[60 + ph, y], [500 - ph, y + 6], [1000 + ph, y - 4]], 2.6, '#1fb5a4', .35);
  }
  // 游泳者：头、肩、一道划水的手臂
  poly(ctx, rough([[520, 620], [700, 590], [760, 660], [540, 700]], 8303, 8), P.skin, .92);
  disc(ctx, 790, 570, 46, 50, P.skin, .95);
  poly(ctx, rough([[770, 520], [850, 508], [860, 566], [786, 570]], 8304, 5), '#241a16', .9);
  ink(ctx, [[700, 640], [1000, 560], [1180, 600]], 12, P.skin, .85);
  // 远处浮尸：一只手伸出水面 + 一缕头发
  poly(ctx, rough([[1300, 520], [1400, 500], [1440, 540], [1350, 570]], 8305, 6), '#cfc4b0', .9);
  ink(ctx, [[1330, 520], [1320, 420]], 9, '#cfc4b0', .9);
  ink(ctx, [[1370, 512], [1390, 430]], 8, '#cfc4b0', .85);
  ink(ctx, [[1420, 520], [1470, 470]], 7, '#cfc4b0', .8);
  // 尸体的头发散在水面
  for (let i = 0; i < 5; i++) ink(ctx, [[1300 + i * 30, 570], [1240 + i * 40, 640 + i * 14]], 5, '#1a1216', .8);
  // 水色里的一点红
  disc(ctx, 1360, 600, 60, 16, P.redD, .55);
  // 游泳者脸上那点惊
  ink(ctx, [[800, 560], [820, 556]], 3, '#2a1a18', .8);
  ink(ctx, [[806, 590], [828, 586]], 3, '#2a1a18', .8);
};

// 镰刀：一道弧光从右上斜下来
KIT.scythe = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8400, 9), '#100a10', 1);
  poly(ctx, box(0, 560, CW, 500, 8401, 9), P.redD, .6);
  // 刀柄
  ink(ctx, [[1500, 60], [980, 700], [800, 960]], 16, '#5a3a20', .95);
  ink(ctx, [[1500, 60], [980, 700], [800, 960]], 6, '#7a5230', .9);
  // 刀刃：一条大弧
  const bl = [];
  for (let i = 0; i <= 22; i++) {
    const u = i / 22, a = -1.9 + u * 2.1;
    bl.push([700 + Math.cos(a) * 760, 300 + Math.sin(a) * 560]);
  }
  poly(ctx, rough(bl, 8402, 5), '#d8dee4', .95);
  edge(ctx, bl, '#f6fbff', 2.4, .8);
  // 刃口一道亮
  for (let i = 0; i < 8; i++) {
    const u = i / 8;
    ink(ctx, [[bl[i * 2][0], bl[i * 2][1]], [bl[i * 2 + 1][0] + 6, bl[i * 2 + 1][1] + 8]], 3, '#ffffff', .5);
  }
  // 血沿刃口挂下来
  for (let i = 1; i < 5; i++) {
    const ph = (t * .5 + i * .2) % 1;
    disc(ctx, bl[i * 4][0], bl[i * 4][1] + 20 + ph * 120, 9, 20, P.redB, .85 * (1 - ph * .5));
  }
};

// 夫妻抱着庆祝：钥匙、遗嘱、一地血
KIT.couple = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8500, 9), '#1a0e14', 1);
  poly(ctx, box(0, 640, CW, 420, 8501, 9), P.redD, .55);
  // 两个人抱在一起：两条剪影合成一个团
  const cx = 830, cy = 700;
  poly(ctx, rough([[cx - 230, 1000], [cx - 190, 620], [cx - 90, 520], [cx + 10, 560], [cx + 40, 1000]], 8502, 8), '#141018', .97);
  poly(ctx, rough([[cx + 210, 1000], [cx + 170, 640], [cx + 70, 520], [cx - 10, 570], [cx - 40, 1000]], 8503, 8), '#241426', .97);
  disc(ctx, cx - 120, 470, 52, 56, P.skin, .9);
  disc(ctx, cx + 96, 470, 50, 54, P.skin, .95);
  // 她一头长发垂在他肩上
  poly(ctx, rough([[cx + 40, 430], [cx + 160, 440], [cx + 150, 640], [cx + 80, 620]], 8504, 7), '#1a1216', .95);
  // 手里那把钥匙 + 一张纸
  poly(ctx, box(cx - 300, 640, 110, 80, 8505, 5), P.paper, .95);
  for (let i = 0; i < 3; i++) ink(ctx, [[cx - 288, 664 + i * 20], [cx - 210, 660 + i * 20]], 2.2, '#6a5a48', .7);
  ink(ctx, [[cx - 210, 700], [cx - 130, 690]], 9, P.brass, .9);
  disc(ctx, cx - 124, 688, 18, 18, P.brass, .95);
  disc(ctx, cx - 124, 688, 8, 8, '#1a0e14', .9);
  // 光从上面下来，暖
  poly(ctx, rough([[300, 0], [700, 0], [860, 1000], [420, 1000]], 8506, 10), '#ffc84e', .12);
  // 地上一摊血，从画面右下漫进来
  poly(ctx, rough([[1100, 1000], [1700, 940], [1700, 1060], [1080, 1060]], 8507, 8), P.red, .5);
};

// 两个熊孩子举着枪
KIT.kidsgun = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8600, 9), '#0e0a12', 1);
  poly(ctx, box(0, 620, CW, 440, 8601, 9), '#2a1016', .75);
  const child = (x, h, i, gun) => {
    const y = 960;
    poly(ctx, rough([[x - h * .2, y], [x - h * .12, y - h * .58], [x + h * .12, y - h * .58], [x + h * .2, y]], 8602 + i, 6), i ? P.paper : '#e8dcc8', .95);
    disc(ctx, x, y - h * .72, h * .11, h * .12, P.skin, .95);
    poly(ctx, rough([[x - h * .12, y - h * .84], [x + h * .12, y - h * .84], [x + h * .07, y - h * .7], [x - h * .07, y - h * .7]], 8606 + i, 5), '#241a16', .9);
    // 短裤
    poly(ctx, box(x - h * .18, y - h * .34, h * .36, h * .16, 8610 + i, 4), P.blue, .85);
    if (gun) {
      // 手臂举起、枪口朝左（朝父母那边）
      ink(ctx, [[x - h * .12, y - h * .54], [x - h * .34, y - h * .64]], 5, P.skin, .95);
      poly(ctx, box(x - h * .44, y - h * .68, h * .18, h * .06, 8620, 4), '#2a2a34', .95);
      poly(ctx, box(x - h * .44, y - h * .68, h * .06, h * .12, 8621, 3), '#141018', .95);
      // 枪口的一点火
      disc(ctx, x - h * .46, y - h * .65, 22, 26, '#ffc84e', .85);
      disc(ctx, x - h * .46, y - h * .65, 10, 12, '#ff5a20', .95);
    }
  };
  child(560, 420, 0, 1);
  child(1180, 390, 1, 0);
  // 地上倒着的两个人（画面外延伸进来）
  poly(ctx, rough([[300, 1040], [620, 980], [700, 1030], [380, 1070]], 8630, 8), '#141018', .9);
  poly(ctx, rough([[1100, 1050], [1420, 990], [1500, 1040], [1180, 1080]], 8631, 8), '#141018', .9);
  disc(ctx, 560, 990, 70, 14, P.red, .6);
};

// 电影院：一排后脑勺，银幕的光从画面外打过来
KIT.cinema = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8700, 9), '#07060a', 1);
  // 银幕方向的红光：一整个扇面
  poly(ctx, rough([[0, 60], [0, 620], [1700, 980], [1700, 200]], 8701, 10), '#ff3a22', .16);
  poly(ctx, rough([[0, 180], [0, 480], [1700, 760], [1700, 420]], 8702, 10), '#ffc84e', .07);
  // 一排观众的后脑（大小不一，越近越大）
  const r = R(8703);
  for (let i = 0; i < 9; i++) {
    const x = -60 + i * 210, y = 640 + r() * 90, h = 150 + r() * 60;
    poly(ctx, rough([[x - h * .5, 1060], [x - h * .34, y], [x + h * .34, y], [x + h * .5, 1060]], 8704 + i, 7), '#0d0a10', .98);
    disc(ctx, x, y - h * .12, h * .3, h * .32, '#0d0a10', .98);
    // 头发的一道轮廓光（红 / 金）
    ink(ctx, [[x - h * .26, y - h * .28], [x, y - h * .44], [x + h * .26, y - h * .28]], 4, i % 2 ? '#ff5a20' : '#ffc84e', .3);
  }
  // 有人张开嘴（看傻了）
  disc(ctx, 560, 660, 16, 22, P.ink, .9);
  disc(ctx, 1450, 700, 14, 20, P.ink, .9);
};

// 蜡模假人 + 一刀喷出来的血
KIT.fx = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8800, 9), '#0e0a12', 1);
  poly(ctx, box(0, 700, CW, 360, 8801, 9), '#2a1016', .7);
  // 台子
  poly(ctx, box(120, 900, 1460, 120, 8802, 8), '#5a3a24', .9);
  // 蜡桶
  poly(ctx, rough([[180, 780], [380, 760], [400, 920], [200, 940]], 8803, 7), '#8a7040', .9);
  poly(ctx, rough([[190, 770], [370, 750], [372, 790], [192, 810]], 8804, 6), P.wax, .95);
  // 假人：半身、蜡黄、胸口一刀
  const dx = 900, dy = 420;
  disc(ctx, dx, dy, 78, 86, P.wax, .95);
  poly(ctx, rough([[dx - 150, 920], [dx - 120, dy + 120], [dx + 120, dy + 120], [dx + 150, 920]], 8805, 9), P.wax, .92);
  // 脸上的凹（没有五官细节，只有两个点）
  disc(ctx, dx - 28, dy - 12, 9, 11, '#8a7040', .8);
  disc(ctx, dx + 28, dy - 12, 9, 11, '#8a7040', .8);
  // 刀口：一道横切 + 喷出来的血柱（扇形）
  const ph = ((t % 3) / 3);
  ink(ctx, [[dx - 60, dy + 200], [dx + 70, dy + 190]], 8, P.redD, .95);
  poly(ctx, rough([[dx + 10, dy + 195], [dx + 260, dy + 60], [dx + 380, dy + 150], [dx + 120, dy + 260]], 8806, 12), P.red, .82);
  poly(ctx, rough([[dx + 40, dy + 200], [dx + 300, dy + 130], [dx + 340, dy + 180], [dx + 90, dy + 240]], 8807, 10), P.redB, .7);
  // 喷溅的点，随时间往外飞
  for (let i = 0; i < 14; i++) {
    const a = -.6 + i / 14 * 1.9, d = 120 + ph * 420 * (i % 3 === 0 ? 1.2 : .8);
    disc(ctx, dx + 30 + Math.cos(a) * d, dy + 210 + Math.sin(a) * d, 6 + (i % 4) * 4, 8 + (i % 3) * 6, P.red, .9 - ph * .5);
  }
  // 假人旁边的锤子与蜡刀
  ink(ctx, [[1250, 940], [1400, 860]], 10, '#3a2a1c', .9);
  poly(ctx, box(1390, 830, 70, 40, 8808, 4), '#8d99a8', .9);
};

// 沙发音乐：一张唱片、两只酒杯、沙发扶手
KIT.lounge = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8900, 9), '#2a1608', 1);
  poly(ctx, box(0, 0, CW, 300, 8901, 9), '#8a4a18', .55);
  // 唱片：黑圆 + 纹路
  const cx = 560, cy = 520, r0 = 300;
  disc(ctx, cx, cy, r0, r0, '#141018', .96);
  for (let i = 1; i < 9; i++) {
    ctx.save(); ctx.globalAlpha = .28; ctx.strokeStyle = '#5a5a68'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r0 * i / 9, 0, TAU); ctx.stroke(); ctx.restore();
  }
  disc(ctx, cx, cy, 70, 70, P.red, .95);
  // 中心的一点金
  disc(ctx, cx, cy, 22, 22, P.gold, .9);
  // 两道反光（铅黄的光是硬的）
  ctx.save(); ctx.globalAlpha = .18; ctx.fillStyle = '#fff2d0';
  ctx.beginPath(); ctx.moveTo(cx - 200, cy - 200); ctx.lineTo(cx - 90, cy - 240); ctx.lineTo(cx + 40, cy + 60); ctx.lineTo(cx - 60, cy + 20); ctx.closePath(); ctx.fill(); ctx.restore();
  // 酒杯
  for (const [x, y, s] of [[1080, 700, 1], [1240, 760, .86]]) {
    poly(ctx, rough([[x - 60 * s, y - 90 * s], [x + 60 * s, y - 90 * s], [x + 30 * s, y + 20 * s], [x - 30 * s, y + 20 * s]], 8902, 5), '#d8c8a8', .25);
    poly(ctx, rough([[x - 50 * s, y - 80 * s], [x + 50 * s, y - 80 * s], [x + 26 * s, y - 10 * s], [x - 26 * s, y - 10 * s]], 8903, 5), '#8a1030', .5);
    ink(ctx, [[x, y + 20 * s], [x, y + 90 * s]], 4, '#d8c8a8', .5);
    disc(ctx, x, y + 96 * s, 34 * s, 10 * s, '#d8c8a8', .35);
  }
  // 沙发扶手：两道弧
  ink(ctx, [[700, 1060], [760, 900], [900, 860], [1000, 900]], 30, '#5a2a14', .9);
  ink(ctx, [[1180, 1060], [1220, 920], [1360, 880], [1480, 920]], 26, '#5a2a14', .85);
  // 一点甜的光
  poly(ctx, rough([[600, 0], [980, 0], [1120, 620], [720, 620]], 8904, 10), '#ffc84e', .1);
};

// 改名海报：蹭热度的那个新标题
KIT.poster = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9000, 9), '#0e0a12', 1);
  // 竖版海报，略歪
  ctx.save(); ctx.translate(850, 520); ctx.rotate(-.03);
  poly(ctx, rough([[-420, -460], [420, -480], [430, 470], [-430, 460]], 9001, 8), '#e8dcc4', .95);
  edge(ctx, [[-420, -460], [420, -480], [430, 470], [-430, 460]], '#8a6414', 2.6, .6);
  // 上半：血红的块
  poly(ctx, box(-400, -450, 800, 300, 9002, 7), P.red, .9);
  poly(ctx, box(-380, -430, 760, 120, 9003, 6), '#140a12', .85);
  // 三行标题条（英文不写成字，用条代替）
  for (let i = 0; i < 3; i++) poly(ctx, box(-330, -400 + i * 44, 620 - i * 90, 28, 9004 + i, 5), P.gold, .9);
  // 下面的署名条与小字块
  for (let i = 0; i < 5; i++) poly(ctx, box(-380, -60 + i * 54, 420 - i * 40, 18, 9007 + i, 4), '#2a2018', .55);
  // 一条斜的红带，盖在纸上
  poly(ctx, rough([[-430, 300], [430, 180], [430, 290], [-430, 410]], 9012, 6), P.redB, .85);
  for (let i = 0; i < 7; i++) ink(ctx, [[-380 + i * 120, 250 - i * 14], [-320 + i * 120, 240 - i * 14]], 4, P.paper, .6);
  // 右下角一个红标
  disc(ctx, 320, 400, 56, 56, P.red, .9);
  ink(ctx, [[292, 372], [348, 428]], 3.4, P.ink, .8);
  ctx.restore();
  // 两盏灯的边（左蓝右红），打在纸面上
  poly(ctx, rough([[0, 0], [260, 0], [180, 1060], [0, 1060]], 9013, 12), '#2035bf', .14);
  poly(ctx, rough([[1500, 0], [1700, 0], [1700, 1060], [1560, 1060]], 9014, 12), '#d8121f', .16);
};

// 电影节：旗、台阶、雪
KIT.festival = (ctx, t) => {
  poly(ctx, box(0, 0, CW, 560, 9100, 9), '#0a1028', .95);
  poly(ctx, box(0, 560, CW, 500, 9101, 9), '#241016', .9);
  // 台阶
  for (let i = 0; i < 5; i++) poly(ctx, box(0, 700 + i * 70, CW, 24, 9102 + i, 4), '#3a2418', .8 - i * .1);
  // 两根旗杆 + 垂下来的旗
  for (const [x, s] of [[520, 1], [1180, -1]]) {
    ink(ctx, [[x, 620], [x, 120]], 8, '#c8b48a', .9);
    poly(ctx, rough([[x, 130], [x + s * 300, 170], [x + s * 290, 320], [x, 300]], 9103 + x, 8), s > 0 ? P.red : P.blue, .8);
    ink(ctx, [[x + s * 20, 180], [x + s * 250, 210]], 3, P.gold, .5);
  }
  // 红毯
  poly(ctx, rough([[620, 1060], [1080, 1060], [960, 700], [760, 700]], 9104, 8), P.redD, .9);
  ink(ctx, [[700, 1060], [800, 700]], 3, P.gold, .35);
  ink(ctx, [[980, 1060], [900, 700]], 3, P.gold, .35);
  // 雪：一堆小白点，慢慢落
  const r = R(9105);
  for (let i = 0; i < 90; i++) {
    const x = r() * CW, y0 = r() * CH, sp = 40 + r() * 60;
    const y = (y0 + t * sp) % CH;
    disc(ctx, x, y, 3 + r() * 4, 3 + r() * 4, '#efe6d2', .35 + r() * .3);
  }
  // 一块 1971 的小牌子
  poly(ctx, box(760, 620, 200, 70, 9106, 5), '#141018', .8);
  ink(ctx, [[790, 646], [930, 650]], 5, P.gold, .8);
};

// 克里斯托弗·李：披风、高领、半张黑着的脸
KIT.lee = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9200, 9), '#08080e', 1);
  // 背后的红光
  poly(ctx, rough([[420, 0], [1280, 0], [1180, 1060], [500, 1060]], 9201, 12), P.redD, .35);
  const cx = 850, cy = 380;
  // 披风：一座三角，下摆铺开
  poly(ctx, rough([[cx - 420, 1060], [cx - 190, cy + 120], [cx - 120, cy - 40], [cx + 120, cy - 40], [cx + 200, cy + 130], [cx + 430, 1060]], 9202, 10), '#0d0810', .97);
  // 领子立起来
  poly(ctx, rough([[cx - 150, cy + 130], [cx - 200, cy - 120], [cx - 80, cy - 60], [cx, cy + 40]], 9203, 7), '#1a1216', .95);
  poly(ctx, rough([[cx + 150, cy + 130], [cx + 200, cy - 120], [cx + 80, cy - 60], [cx, cy + 40]], 9204, 7), '#1a1216', .95);
  // 脸：苍白，左半边压进黑
  poly(ctx, rough([[cx - 80, cy - 150], [cx + 80, cy - 150], [cx + 96, cy + 30], [cx, cy + 90], [cx - 96, cy + 30]], 9205, 7), '#e8dcc8', .95);
  poly(ctx, rough([[cx - 80, cy - 150], [cx - 6, cy - 150], [cx - 4, cy + 86], [cx - 96, cy + 30]], 9206, 6), '#0d0810', .78);
  // 眼、眉、一点胡
  ink(ctx, [[cx - 56, cy - 60], [cx - 16, cy - 66]], 4, '#0d0810', .9);
  ink(ctx, [[cx + 16, cy - 66], [cx + 56, cy - 60]], 4, '#0d0810', .9);
  ink(ctx, [[cx - 10, cy + 40], [cx + 22, cy + 40]], 3, '#3a2a24', .7);
  // 手：一只握在胸前
  poly(ctx, rough([[cx - 40, cy + 240], [cx + 60, cy + 220], [cx + 80, cy + 330], [cx - 30, cy + 350]], 9207, 7), '#e8dcc8', .8);
  // 离席：他起身，披风往左一带（随时间的位移很小，只给一点动）
  const k = clamp((t * .08) % 1);
  poly(ctx, rough([[cx - 420 + k * 20, 1060], [cx - 190 + k * 14, cy + 120]], 9208, 6), '#241826', .5);
};

// 十三号星期五：湖、木屋、码头、一轮低月
KIT.f13 = (ctx, t) => {
  poly(ctx, box(0, 0, CW, 560, 9300, 9), '#08122e', .95);
  poly(ctx, box(0, 560, CW, 500, 9301, 9), '#0a1a2a', .95);
  // 月
  disc(ctx, 1240, 240, 92, 92, '#e8f0ff', .85);
  ctx.save(); ctx.globalAlpha = .2; ctx.fillStyle = '#cfe4f2';
  ctx.beginPath(); ctx.arc(1240, 240, 150, 0, TAU); ctx.fill(); ctx.restore();
  // 远处林线
  const r = R(9302);
  for (let i = 0; i < 26; i++) {
    const x = i * 70 + r() * 30, h = 90 + r() * 150;
    poly(ctx, rough([[x, 620], [x + 16, 620 - h], [x + 34, 620]], 9303 + i, 5), '#061024', .9);
  }
  // 湖面
  for (let i = 0; i < 9; i++) ink(ctx, [[100, 680 + i * 32], [700, 674 + i * 32], [1200, 686 + i * 32]], 2.4, '#2a5a8a', .3);
  // 木屋：尖顶、亮着的窗
  const hx = 520, hy = 640;
  poly(ctx, rough([[hx - 190, hy], [hx - 190, hy - 200], [hx, hy - 340], [hx + 190, hy - 200], [hx + 190, hy]], 9304, 8), '#1a1216', .97);
  poly(ctx, rough([[hx - 220, hy - 190], [hx, hy - 380], [hx + 220, hy - 190]], 9305, 7), '#0d0810', .97);
  poly(ctx, box(hx - 70, hy - 150, 70, 70, 9306, 4), '#ffc23a', .8);
  poly(ctx, box(hx + 30, hy - 150, 60, 70, 9307, 4), '#ff8a2a', .55);
  // 码头伸进水里
  poly(ctx, rough([[hx + 220, hy], [1300, 700], [1300, 740], [hx + 220, hy + 30]], 9308, 6), '#4a2a1a', .95);
  for (let i = 0; i < 5; i++) ink(ctx, [[hx + 240 + i * 110, hy + 6], [hx + 240 + i * 110, hy + 72]], 5, '#2a1610', .9);
  // 水里的倒影：一条竖着的碎光
  for (let i = 0; i < 8; i++) ink(ctx, [[1230 + Math.sin(t * .7 + i) * 8, 300 + i * 46], [1260 + Math.sin(t * .7 + i) * 8, 300 + i * 46]], 3, '#cfe4f2', .2);
};

// 抄作业：左格一把钩刀，右格一柄长矛串着两个人，中间一个等号
KIT.copy = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9400, 9), '#0e0a12', 1);
  // 左格
  poly(ctx, box(40, 60, 760, 940, 9401, 8), '#141018', .96);
  edge(ctx, box(40, 60, 760, 940, 9401, 8), P.gold, 1.6, .4);
  // 钩刀：一段直刀身 + 弯钩
  const hx = 420, hy = 300;
  poly(ctx, rough([[hx + 120, hy], [hx + 150, hy + 460], [hx + 90, hy + 470], [hx + 74, hy]], 9402, 5), '#cfd6dc', .9);
  for (let i = 0; i <= 12; i++) {
    const u = i / 12, a = Math.PI * 1.1 + u * 1.5;
    ink(ctx, [[hx + 120 + Math.cos(a) * 130, hy + 20 + Math.sin(a) * 130], [hx + 120 + Math.cos(a + .18) * 160, hy + 20 + Math.sin(a + .18) * 160]], 16, '#cfd6dc', .85);
  }
  ink(ctx, [[hx + 96, hy + 40], [hx + 104, hy + 460]], 3, '#ffffff', .5);
  // 一抹血
  poly(ctx, rough([[hx + 60, hy + 420], [hx + 160, hy + 400], [hx + 150, hy + 500], [hx + 70, hy + 520]], 9403, 6), P.red, .6);
  // 右格
  poly(ctx, box(900, 60, 760, 940, 9404, 8), '#141018', .96);
  edge(ctx, box(900, 60, 760, 940, 9404, 8), P.gold, 1.6, .4);
  // 长矛：一根斜穿画面的杆 + 尖
  ink(ctx, [[960, 860], [1640, 220]], 9, '#8a6a3a', .95);
  poly(ctx, rough([[1620, 230], [1680, 180], [1672, 250], [1640, 268]], 9405, 5), '#cfd6dc', .9);
  // 两个剪影被串在一起（简化：两团人形，中间一根杆）
  for (const [px, py, s] of [[1180, 620, 1], [1420, 700, .9]]) {
    poly(ctx, rough([[px - 70 * s, py + 120 * s], [px - 50 * s, py - 40 * s], [px + 50 * s, py - 40 * s], [px + 70 * s, py + 120 * s]], 9406 + s * 7, 7), '#1a1420', .9);
    disc(ctx, px, py - 80 * s, 34 * s, 38 * s, P.skin, .85);
  }
  ink(ctx, [[960, 860], [1640, 220]], 3, P.red, .0);
  // 中间等号
  ink(ctx, [[800, 480], [900, 480]], 10, P.gold, .7);
  ink(ctx, [[800, 560], [900, 560]], 10, P.gold, .7);
};

// 百大第九十四：一张榜单纸，94 被红圈住
KIT.rank = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9500, 9), '#160e14', 1);
  ctx.save(); ctx.translate(850, 520); ctx.rotate(.02);
  poly(ctx, rough([[-460, -470], [460, -460], [470, 470], [-470, 460]], 9501, 8), '#e8dcc4', .95);
  // 榜单：一列一列的小条
  const r = R(9502);
  for (let c = 0; c < 3; c++) for (let i = 0; i < 22; i++) {
    const x = -420 + c * 300, y = -420 + i * 38;
    poly(ctx, box(x, y, 200 + r() * 50, 14, 9503 + c * 30 + i, 3), '#2a2018', .38 + r() * .2);
  }
  // 第 94 位：红圈 + 加粗
  const ry = 300;
  poly(ctx, box(-420, ry - 6, 250, 20, 9600, 4), '#141018', .8);
  ctx.save(); ctx.strokeStyle = P.redB; ctx.lineWidth = 6; ctx.globalAlpha = .95;
  ctx.beginPath(); ctx.ellipse(-300, ry + 4, 190, 46, .02, 0, TAU); ctx.stroke(); ctx.restore();
  // 大字 94（用两个块形的"数"表示不了，就画 9 与 4 的骨架）
  const n9 = (x, y, s) => {
    ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 16 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, 70 * s, Math.PI * .9, Math.PI * 2.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 40 * s, y + 150 * s); ctx.lineTo(x - 120 * s, y + 40 * s); ctx.stroke(); ctx.restore();
  };
  const n4 = (x, y, s) => {
    ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 16 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 60 * s, y - 80 * s); ctx.lineTo(x + 20 * s, y + 40 * s); ctx.lineTo(x + 20 * s, y + 160 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 20 * s, y + 40 * s); ctx.lineTo(x - 60 * s, y + 40 * s); ctx.stroke(); ctx.restore();
  };
  n9(1180, 380, 1.0); n4(1400, 380, 1.0);
  ctx.restore();
};

// 十三场谋杀：4×4 的格子，填满十三格
KIT.killgrid = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9700, 9), '#120b12', 1);
  const r = R(9701);
  const sym = [
    'knife', 'rope', 'gun', 'water', 'fire', 'hook', 'spear', 'axe', 'saw', 'stone', 'car', 'window', 'boat', 'rope',
  ];
  let n = 0;
  for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
    if (n >= 13) break;
    const x = 80 + gx * 420, y = 60 + gy * 260;
    poly(ctx, box(x, y, 390, 220, 9702 + n, 5), '#0d0810', .9);
    edge(ctx, box(x, y, 390, 220, 9702 + n, 5), P.gold, 1.2, .22);
    const cx = x + 195, cy = y + 110, s = 1;
    ctx.save(); ctx.strokeStyle = '#e8dcc8'; ctx.lineWidth = 4; ctx.globalAlpha = .8; ctx.lineCap = 'round';
    // 只画一两笔符号，不画细节
    ctx.beginPath();
    if (sym[n] === 'knife') { ctx.moveTo(cx - 40, cy + 50); ctx.lineTo(cx + 40, cy - 50); }
    else if (sym[n] === 'rope') { ctx.arc(cx, cy, 46, 0, TAU); ctx.moveTo(cx - 10, cy - 60); ctx.lineTo(cx + 20, cy - 100); }
    else if (sym[n] === 'gun') { ctx.moveTo(cx - 60, cy - 10); ctx.lineTo(cx + 50, cy - 10); ctx.lineTo(cx + 50, cy + 20); ctx.lineTo(cx - 20, cy + 20); }
    else if (sym[n] === 'water') { ctx.moveTo(cx - 70, cy + 10); ctx.quadraticCurveTo(cx - 30, cy - 20, cx, cy + 10); ctx.quadraticCurveTo(cx + 30, cy + 40, cx + 70, cy + 10); }
    else if (sym[n] === 'fire') { ctx.moveTo(cx, cy - 70); ctx.quadraticCurveTo(cx + 50, cy, cx, cy + 60); ctx.quadraticCurveTo(cx - 50, cy, cx, cy - 70); }
    else if (sym[n] === 'hook') { ctx.arc(cx, cy, 50, -1.2, 2.4); }
    else if (sym[n] === 'spear') { ctx.moveTo(cx - 80, cy + 60); ctx.lineTo(cx + 70, cy - 60); }
    else if (sym[n] === 'axe') { ctx.moveTo(cx, cy + 70); ctx.lineTo(cx, cy - 40); ctx.moveTo(cx - 40, cy - 40); ctx.lineTo(cx + 50, cy - 70); }
    else if (sym[n] === 'saw') { ctx.moveTo(cx - 70, cy); ctx.lineTo(cx + 70, cy); }
    else if (sym[n] === 'stone') { ctx.arc(cx, cy, 44, 0, TAU); }
    else if (sym[n] === 'car') { ctx.rect(cx - 60, cy - 20, 120, 40); }
    else if (sym[n] === 'window') { ctx.rect(cx - 45, cy - 55, 90, 110); }
    else if (sym[n] === 'boat') { ctx.moveTo(cx - 70, cy + 20); ctx.quadraticCurveTo(cx, cy + 60, cx + 70, cy + 20); }
    else { ctx.moveTo(cx - 60, cy + 40); ctx.lineTo(cx + 50, cy - 40); }
    ctx.stroke(); ctx.restore();
    // 每一格都有一点血
    disc(ctx, cx + 60 * (r() - .5), cy + 60, 22, 8, P.red, .5);
    n++;
  }
  // 空着的三格打叉
  for (let i = 13; i < 16; i++) {
    poly(ctx, box(80 + (i % 4) * 420, 60 + Math.floor(i / 4) * 260, 390, 220, 9740 + i, 5), '#0a060c', .8);
  }
};

// 评分卡：十分，给三分
KIT.score = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9800, 9), '#140c10', 1);
  // 十个格子
  for (let i = 0; i < 10; i++) {
    const x = 90 + i * 154, y = 420;
    const filled = i < 3;
    poly(ctx, box(x, y, 132, 300, 9801 + i, 5), filled ? P.gold : '#0d0810', filled ? .95 : .7);
    edge(ctx, box(x, y, 132, 300, 9801 + i, 5), filled ? P.goldB : '#3a2a2a', 1.6, filled ? .7 : .4);
    if (filled) ink(ctx, [[x + 20, y + 260], [x + 60, y + 120], [x + 100, y + 230]], 6, P.ink, .5);
  }
  // 下面一行：扣掉的七分
  for (let i = 3; i < 10; i++) {
    const x = 90 + i * 154;
    ink(ctx, [[x + 20, 700], [x + 110, 780]], 4, P.redB, .55);
    ink(ctx, [[x + 110, 700], [x + 20, 780]], 4, P.redB, .55);
  }
  // 顶上的大字：一个 3（三笔）
  ctx.save(); ctx.strokeStyle = P.gold; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.globalAlpha = .9;
  ctx.beginPath(); ctx.moveTo(700, 120); ctx.quadraticCurveTo(840, 60, 840, 170); ctx.quadraticCurveTo(840, 280, 700, 300); ctx.stroke();
  ctx.restore();
  poly(ctx, rough([[560, 340], [900, 330]], 9811, 6), P.gold, .5);
};

// 遛狗：沙滩上一人一狗，天边还剩一条金
KIT.dog = (ctx, t) => {
  poly(ctx, box(0, 0, CW, 620, 9900, 9), '#2a1020', .95);
  poly(ctx, box(0, 620, CW, 440, 9901, 9), '#c07a3a', .9);
  // 地平线一条污染金
  poly(ctx, rough([[0, 600], [1700, 596], [1700, 640], [0, 646]], 9902, 5), P.gold, .8);
  disc(ctx, 1360, 560, 110, 60, P.goldB, .7);
  // 人
  const x = 720, y = 900;
  poly(ctx, rough([[x - 60, y], [x - 40, y - 300], [x + 40, y - 300], [x + 60, y]], 9903, 6), '#141018', .95);
  disc(ctx, x, y - 340, 40, 44, P.skin, .9);
  ink(ctx, [[x + 40, y - 280], [x + 160, y - 330]], 5, P.skin, .9);
  // 狗绳
  ink(ctx, [[x + 160, y - 330], [x + 360, y - 300], [x + 420, y - 260]], 3, '#e8dcc8', .7);
  // 狗：四足 + 尾巴 + 头
  const dx = 500, dy = 890;
  poly(ctx, rough([[dx - 90, dy - 60], [dx + 80, dy - 70], [dx + 96, dy - 20], [dx - 80, dy - 10]], 9904, 6), '#2a1a12', .9);
  disc(ctx, dx + 110, dy - 90, 34, 30, '#2a1a12', .9);
  for (const [lx, ly] of [[dx - 70, dy], [dx - 30, dy], [dx + 40, dy], [dx + 80, dy]]) ink(ctx, [[lx, ly - 20], [lx + (lx - dx) * .1, ly + 60]], 8, '#2a1a12', .85);
  ink(ctx, [[dx - 90, dy - 60], [dx - 130, dy - 96]], 9, '#2a1a12', .9);
  // 脚印
  for (let i = 0; i < 6; i++) disc(ctx, 200 + i * 110, 1000 + (i % 2) * 20, 14, 8, '#8a4a24', .5);
};

// ———— 定版覆盖：试拍里比例崩了的几格（portrait 长脖子、interior 白发盖脸、glove 手像黑板、books 白条错位、fx 太空）重画 ————
KIT.portrait = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7400, 9), P.blueD, 1);
  poly(ctx, box(0, 560, CW, 500, 7401, 9), '#2a1018', .86);
  poly(ctx, rough([[280, 0], [1080, 0], [1240, 1060], [400, 1060]], 7402, 12), P.gold, .10);
  const hx = 850, hy = 330;
  // 西装：肩宽 400，往下展开
  poly(ctx, rough([[556, 1060], [596, 628], [700, 556], [1000, 556], [1104, 628], [1144, 1060]], 7403, 9), '#141018', .97);
  edge(ctx, [[556, 1060], [596, 628], [700, 556], [1000, 556], [1104, 628], [1144, 1060]], '#2b2431', 2.2, .7);
  // 脖子（短）
  poly(ctx, box(hx - 44, 444, 88, 78, 7404, 6), P.skin, .95);
  poly(ctx, box(hx - 44, 444, 28, 78, 7405, 6), '#b58a68', .45);
  // 头
  disc(ctx, hx, hy, 104, 122, P.skin, .96);
  poly(ctx, rough([[hx - 74, hy + 62], [hx + 74, hy + 56], [hx + 52, hy + 116], [hx - 52, hy + 114]], 7406, 6), '#b58a68', .35);
  // 白发：帽状往后梳，不碰脸
  poly(ctx, rough([[hx - 104, hy - 34], [hx - 72, hy - 128], [hx, hy - 152], [hx + 72, hy - 128], [hx + 104, hy - 44],
    [hx + 58, hy - 84], [hx, hy - 96], [hx - 58, hy - 84]], 7407, 9), '#ded6c4', .96);
  // 眉、鼻、嘴
  ink(ctx, [[hx - 72, hy - 8], [hx - 22, hy - 12]], 4, '#3a2a24', .75);
  ink(ctx, [[hx + 22, hy - 12], [hx + 72, hy - 8]], 4, '#3a2a24', .75);
  ink(ctx, [[hx - 4, hy - 6], [hx - 14, hy + 44], [hx + 10, hy + 42]], 3, '#a8765a', .65);
  ink(ctx, [[hx - 34, hy + 74], [hx + 34, hy + 70]], 3.4, '#7a3a30', .8);
  // 眼镜：两圆 + 鼻梁
  for (const gx of [hx - 46, hx + 46]) {
    ctx.save(); ctx.strokeStyle = '#1a1216'; ctx.lineWidth = 4; ctx.globalAlpha = .95;
    ctx.beginPath(); ctx.arc(gx, hy + 4, 34, 0, TAU); ctx.stroke(); ctx.restore();
    disc(ctx, gx + 10, hy - 4, 7, 7, '#efe8d8', .55);
  }
  ink(ctx, [[hx - 12, hy + 4], [hx + 12, hy + 4]], 3, '#1a1216', .9);
  // 烟 + 三缕烟
  ink(ctx, [[hx + 34, hy + 72], [hx + 122, hy + 116]], 3, '#e8dcbe', .92);
  disc(ctx, hx + 124, hy + 118, 8, 8, '#ff5a20', .95);
  for (let i = 0; i < 3; i++) {
    const ph = (t * .45 + i * .34) % 1;
    ctx.save(); ctx.globalAlpha = .2 * (1 - ph); ctx.strokeStyle = '#cfc8bc'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(hx + 128, hy + 108 - ph * 30);
    ctx.quadraticCurveTo(hx + 168 + 26 * Math.sin(ph * 5), hy + 30 - ph * 120, hx + 120 + 40 * Math.sin(ph * 3), hy - 60 - ph * 150);
    ctx.stroke(); ctx.restore();
  }
  // 衬衫领口 + 领带
  poly(ctx, rough([[hx - 92, 558], [hx - 16, 604], [hx - 12, 706], [hx - 74, 620]], 7411, 6), '#d8d2c4', .9);
  poly(ctx, rough([[hx + 92, 558], [hx + 16, 604], [hx + 12, 706], [hx + 74, 620]], 7412, 6), '#d8d2c4', .9);
  poly(ctx, rough([[hx - 16, 600], [hx + 16, 600], [hx + 10, 768], [hx - 10, 768]], 7413, 5), P.redD, .88);
  // 两盏灯咬出来的边
  ink(ctx, [[1104, 640], [1144, 1050]], 6, '#d8121f', .38);
  ink(ctx, [[596, 640], [556, 1050]], 5, '#2035bf', .32);
};

KIT.interior = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7800, 9), '#241016', 1);
  poly(ctx, box(0, 0, CW, 752, 7801, 9), '#ffe8a8', .92);
  poly(ctx, box(CW - 480, 0, 480, 752, 7802, 8), '#7a2a4e', .72);
  // 窗：紫红框、黑内、十字格
  poly(ctx, box(240, 130, 320, 380, 7803, 6), '#7a2a4e', .92);
  poly(ctx, box(266, 156, 294, 328, 7804, 5), '#0b0b0d', .88);
  ink(ctx, [[410, 156], [410, 484]], 4, '#ffe8a8', .55);
  ink(ctx, [[266, 320], [560, 320]], 4, '#ffe8a8', .45);
  // 地面
  poly(ctx, box(0, 752, CW, 308, 7805, 9), '#3a2018', .95);
  for (let i = 0; i < 4; i++) ink(ctx, [[60 + i * 26, 800], [1620 - i * 34, 1020]], 2.2, '#241016', .45);
  // 轮椅：大轮 + 小轮 + 扶手 + 座
  const wx = 1040, wy = 720;
  disc(ctx, wx - 90, wy + 170, 96, 96, '#1a1216', .96);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; ink(ctx, [[wx - 90 + Math.cos(a) * 88, wy + 170 + Math.sin(a) * 88], [wx - 90 + Math.cos(a) * 46, wy + 170 + Math.sin(a) * 46]], 2.6, '#3a2e34', .62); }
  disc(ctx, wx + 150, wy + 220, 52, 52, '#1a1216', .96);
  poly(ctx, box(wx - 160, wy + 40, 330, 32, 7806, 5), '#2a2018', .95);        // 扶手
  poly(ctx, box(wx + 56, wy + 16, 92, 196, 7807, 5), '#7a2a4e', .78);        // 靠背（在人身后）
  ink(ctx, [[wx + 170, wy + 60], [wx + 176, wy + 210]], 6, '#2a2018', .8);    // 后把手
  // 老太：坐姿、驼背、深衣、白发只到耳侧
  poly(ctx, rough([[wx - 84, wy + 84], [wx + 60, wy + 60], [wx + 84, wy - 60], [wx - 52, wy - 40]], 7808, 7), '#2a1a2c', .95);
  const hx = wx - 6, hy = wy - 128;
  disc(ctx, hx, hy, 46, 52, P.skin, .93);
  // 白发：头顶 + 两侧，留出脸
  poly(ctx, rough([[hx - 50, hy - 18], [hx - 34, hy - 86], [hx + 36, hy - 90], [hx + 52, hy - 22],
    [hx + 36, hy - 56], [hx - 30, hy - 54]], 7809, 8), '#efe6d2', .95);
  ink(ctx, [[hx - 30, hy - 18], [hx - 12, hy - 20]], 2.6, '#2a1a18', .8);
  ink(ctx, [[hx + 10, hy - 20], [hx + 28, hy - 18]], 2.6, '#2a1a18', .8);
  ink(ctx, [[hx - 16, hy + 26], [hx + 12, hy + 22]], 2.4, '#8a4a40', .7);
  // 绳：从画外垂下来，绕颈一圈，再垂下去
  ink(ctx, [[hx + 40, 0], [hx + 26, hy + 6], [hx - 52, hy + 16]], 9, '#c8b48a', .86);
  ink(ctx, [[hx - 52, hy + 16], [hx + 60, hy - 4]], 9, '#c8b48a', .92);
  ink(ctx, [[hx - 52, hy + 16], [hx - 74, hy + 84]], 7, '#c8b48a', .74);
  // 凶手：站在左边，背对，纯剪影
  poly(ctx, rough([[392, 1040], [432, 640], [520, 566], [610, 640], [650, 1040]], 7810, 8), '#141018', .97);
  disc(ctx, 505, 512, 54, 58, '#241826', .95);
  ink(ctx, [[432, 660], [392, 1040]], 5, '#2035bf', .28);
  ink(ctx, [[610, 660], [650, 1040]], 6, '#d8121f', .32);
};

KIT.glove = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7100, 10), P.blueD, 1);
  poly(ctx, box(0, 380, CW, 680, 7101, 12), P.redD, .88);
  poly(ctx, rough([[0, 340], [1700, 300], [1700, 380], [0, 420]], 7102, 6), P.gold, .30);   // 地平线那一线金
  // 刀：从右下斜向左上，刀身窄一点（柄握在手里，别横穿整格）
  const kx = 700, ky = 862;
  poly(ctx, rough([[kx, ky], [kx + 560, 336], [kx + 604, 388], [kx + 52, ky + 44]], 7103, 6), '#cfd6dc', .95);
  poly(ctx, rough([[kx + 52, ky + 44], [kx + 604, 388], [kx + 636, 430], [kx + 92, ky + 94]], 7104, 5), '#8d99a8', .82);
  ink(ctx, [[kx + 8, ky + 18], [kx + 578, 372]], 2.2, '#f6fbff', .82);
  // 血从刀尖往下淌
  disc(ctx, kx + 356, ky - 262, 14, 24, P.redB, .9);
  disc(ctx, kx + 500, ky - 150, 10, 17, P.red, .8);
  // 白衬衫袖口：贴着手的左下方，别飘出去
  poly(ctx, rough([[286, 596], [548, 556], [584, 800], [324, 846]], 7105, 9), P.paper, .92);
  ink(ctx, [[408, 582], [440, 816]], 2.6, P.paperD, .8);
  ink(ctx, [[368, 590], [400, 826]], 1.6, P.paperD, .5);
  // 黑手套：手掌 + 四根手指握在刀柄上（剪影，五指分明）
  const px = kx - 40, py = ky - 30;
  poly(ctx, rough([[px - 170, py - 60], [px + 40, py - 120], [px + 66, py + 60], [px - 150, py + 110]], 7106, 8), '#141018', .97);
  for (let i = 0; i < 4; i++) {
    const fxx = px - 120 + i * 46, fyy = py - 80 - i * 6;
    poly(ctx, rough([[fxx, fyy], [fxx + 34, fyy - 14], [fxx + 40, fyy + 96], [fxx + 4, fyy + 104]], 7110 + i, 5), '#1c1620', .95);
    ink(ctx, [[fxx + 6, fyy + 4], [fxx + 12, fyy + 96]], 2.0, '#3a3040', .7);
  }
  // 拇指：绕到刀的另一侧
  poly(ctx, rough([[px + 10, py + 30], [px + 86, py + 6], [px + 96, py + 100], [px + 24, py + 118]], 7120, 6), '#1c1620', .95);
  edge(ctx, [[px - 170, py - 60], [px + 40, py - 120], [px + 66, py + 60], [px - 150, py + 110]], P.gold, 2.2, .52);
  // 手指之间刻三道浅口，把黑块拆成"手"而不是"黑板"
  for (let i = 0; i < 3; i++) ink(ctx, [[px - 96 + i * 46, py - 106], [px - 84 + i * 46, py + 6]], 2.4, '#6a5c70', .55);
  // 手套上的一道红边（灯打过来的）
  ink(ctx, [[px + 40, py - 100], [px + 60, py + 50]], 5, '#d8121f', .3);
};

KIT.books = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 7300, 9), '#1a1014', 1);
  poly(ctx, box(0, 700, CW, 360, 7301, 9), P.redD, .5);
  const r = R(7302);
  const stack = (bx, by, n, rot, s) => {
    ctx.save(); ctx.translate(bx, by); ctx.rotate(rot); ctx.scale(s, s);
    for (let i = 0; i < n; i++) {
      const y = -i * 40, w = 330 - i * 8, off = (r() - .5) * 14;
      poly(ctx, box(-w / 2 + off, y - 36, w, 36, 7303 + i * 7 + bx, 4), P.gold, .95);
      poly(ctx, box(-w / 2 + off, y - 36, w, 8, 7304 + i * 7 + bx, 3), '#ffe9a8', .9);
      ink(ctx, [[-w / 2 + off + 26, y - 18], [w / 2 + off - 76, y - 20]], 3.0, P.ink, .8);
      poly(ctx, box(w / 2 + off - 62, y - 32, 26, 26, 7305 + i * 7 + bx, 3), P.red, .9);
    }
    // 书口：一条窄的纸色（不要亮）
    poly(ctx, box(-330 / 2, -n * 40, 22, n * 40, 7306 + bx, 4), P.paperD, .5);
    ctx.restore();
  };
  stack(300, 780, 4, -.06, 1.05);
  stack(660, 840, 6, .03, .95);
  stack(1040, 790, 3, -.09, 1.0);
  // 摊开的一本（在中间偏上）
  ctx.save(); ctx.translate(820, 330); ctx.rotate(-.05);
  poly(ctx, rough([[-250, -110], [0, -140], [250, -110], [250, 110], [0, 140], [-250, 110]], 7307, 6), P.paper, .94);
  ink(ctx, [[0, -140], [0, 140]], 2.4, P.paperD, .8);
  for (let i = 0; i < 4; i++) ink(ctx, [[36, -60 + i * 44], [210, -70 + i * 44]], 2.0, P.ink, .5);
  // 左页那块封面色
  poly(ctx, box(-226, -86, 190, 172, 7308, 5), P.gold, .95);
  ink(ctx, [[-210, -30], [-70, -36]], 5.5, P.ink, .85);
  ink(ctx, [[-210, 30], [-100, 24]], 3.6, P.ink, .7);
  ctx.restore();
  // 右边一枚红印
  disc(ctx, 1370, 720, 44, 44, P.red, .82);
  ink(ctx, [[1338, 698], [1402, 742]], 3.2, P.redD, .8);
};

KIT.fx = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 8800, 9), '#0e0a12', 1);
  poly(ctx, box(0, 700, CW, 360, 8801, 9), '#2a1016', .72);
  poly(ctx, rough([[0, 660], [1700, 640], [1700, 720], [0, 740]], 8802, 6), P.gold, .22);
  // 台子
  poly(ctx, box(120, 900, 1400, 110, 8802, 8), '#5a3a24', .9);
  // 蜡桶
  poly(ctx, rough([[200, 760], [400, 740], [420, 900], [220, 920]], 8803, 7), '#8a7040', .9);
  poly(ctx, rough([[212, 750], [388, 730], [390, 772], [214, 792]], 8804, 6), P.wax, .95);
  // 假人：头 + 躯干（蜡黄）
  const dx = 880, dy = 300;
  disc(ctx, dx, dy, 88, 96, P.wax, .95);
  poly(ctx, rough([[dx - 150, 900], [dx - 118, dy + 150], [dx + 118, dy + 150], [dx + 150, 900]], 8805, 9), P.wax, .92);
  disc(ctx, dx - 30, dy - 10, 9, 11, '#8a7040', .8);
  disc(ctx, dx + 30, dy - 10, 9, 11, '#8a7040', .8);
  // 刀口 + 喷出来的血（扇形往右上）
  const cy2 = dy + 220;
  ink(ctx, [[dx - 66, cy2], [dx + 76, cy2 - 8]], 8, P.redD, .95);
  poly(ctx, rough([[dx + 10, cy2 - 6], [dx + 300, cy2 - 200], [dx + 420, cy2 - 120], [dx + 130, cy2 + 60]], 8806, 12), P.red, .84);
  poly(ctx, rough([[dx + 30, cy2], [dx + 330, cy2 - 150], [dx + 372, cy2 - 96], [dx + 90, cy2 + 30]], 8807, 10), P.redB, .72);
  const ph = (t % 3) / 3;
  for (let i = 0; i < 14; i++) {
    const a = -.9 + i / 14 * 1.8, d = 150 + ph * 340 * (i % 3 === 0 ? 1.2 : .8);
    disc(ctx, dx + 40 + Math.cos(a) * d, cy2 - 40 + Math.sin(a) * d, 6 + (i % 4) * 4, 8 + (i % 3) * 6, P.red, .9 - ph * .45);
  }
  // 锤子与蜡刀
  ink(ctx, [[1230, 940], [1400, 850]], 10, '#3a2a1c', .9);
  poly(ctx, box(1390, 818, 74, 44, 8808, 4), '#8d99a8', .9);
};

// ———— 二轮定版：这三格在联系表里读不出来（swim 像把白伞、kidsgun 像条码、set 几乎空白） ————
KIT.swim = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9100, 9), '#071026', 1);
  poly(ctx, box(0, 430, CW, 630, 9101, 9), P.blue, .78);
  poly(ctx, box(0, 430, CW, 90, 9102, 8), '#2b3fbf', .5);
  for (let i = 0; i < 6; i++) {
    const y = 470 + i * 92 + Math.sin(t * .6 + i) * 6;
    ink(ctx, [[60 + i * 40, y], [300 + i * 50, y - 8], [900, y + 4], [1620 - i * 30, y - 6]], 3.4, '#8ea6ff', .3 - i * .03);
  }
  // 游泳的人：头露出水面，两条手臂划水
  const hx = 690, hy = 452;
  disc(ctx, hx, hy, 62, 66, P.skin, .95);
  poly(ctx, rough([[hx - 66, hy - 10], [hx - 40, hy - 74], [hx + 30, hy - 82], [hx + 64, hy - 24],
    [hx + 30, hy - 54], [hx - 34, hy - 50]], 9103, 7), '#120c10', .95);
  poly(ctx, rough([[hx - 60, hy + 40], [hx - 250, hy + 96], [hx - 240, hy + 128], [hx - 40, hy + 76]], 9104, 7), P.skin, .9);
  poly(ctx, rough([[hx + 60, hy + 40], [hx + 230, hy + 70], [hx + 236, hy + 104], [hx + 50, hy + 74]], 9105, 7), P.skin, .9);
  ink(ctx, [[hx - 26, hy + 4], [hx - 10, hy + 2]], 3, '#2a1a18', .8);
  ink(ctx, [[hx + 10, hy + 2], [hx + 26, hy + 4]], 3, '#2a1a18', .8);
  // 水下：一具浮尸浮上来（苍白的手 + 一缕血往上飘）
  poly(ctx, rough([[980, 900], [1046, 806], [1108, 830], [1052, 926]], 9106, 7), '#cfc6b2', .85);
  disc(ctx, 1018, 796, 26, 20, '#e2dac6', .8);
  poly(ctx, rough([[1000, 880], [980, 640], [1012, 610], [1040, 866]], 9107, 10), P.red, .38);
  poly(ctx, rough([[1050, 900], [1074, 690], [1104, 676], [1092, 906]], 9108, 10), P.redB, .32);
  disc(ctx, 1210, 780, 24, 34, '#cfc6b2', .55);
  ink(ctx, [[0, 430], [1700, 424]], 4, '#dfe6ff', .35);
};

KIT.kidsgun = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9200, 9), '#2a0a12', 1);
  poly(ctx, box(0, 760, CW, 300, 9201, 9), '#12080c', .95);
  poly(ctx, rough([[0, 744], [1700, 736], [1700, 772], [0, 782]], 9202, 6), P.gold, .22);
  const kid = (kx, ky, s, col, col2, armUp) => {
    disc(ctx, kx, ky, 34 * s, 38 * s, P.skin, .95);
    poly(ctx, box(kx - 30 * s, ky + 34 * s, 60 * s, 96 * s, 9203 + kx, 5), col, .95);
    poly(ctx, box(kx - 26 * s, ky + 128 * s, 22 * s, 96 * s, 9204 + kx, 4), col2, .9);
    poly(ctx, box(kx + 6 * s, ky + 128 * s, 22 * s, 96 * s, 9205 + kx, 4), col2, .9);
    if (armUp) poly(ctx, rough([[kx + 24 * s, ky + 44 * s], [kx + 120 * s, ky + 10 * s], [kx + 126 * s, ky + 44 * s], [kx + 30 * s, ky + 72 * s]], 9206, 5), col, .95);
  };
  kid(560, 560, 1.05, '#e8dcc4', '#5a3a24', false);
  kid(1080, 556, 1.0, '#1c2a6a', '#1c2a6a', true);
  // 手枪：L 形剪影，握在小个子手里，指着另一边
  ctx.save(); ctx.translate(1180, 520); ctx.rotate(-.14);
  poly(ctx, box(0, 0, 150, 30, 9207, 3), '#0c0a0e', .95);
  poly(ctx, box(0, 28, 40, 78, 9208, 3), '#0c0a0e', .95);
  ink(ctx, [[24, 12], [140, 12]], 3, '#6a6070', .55);
  ctx.restore();
  // 枪口的三道放射线 + 一点火
  const mx = 1330, my = 496;
  disc(ctx, mx, my, 22, 22, P.gold, .9);
  for (let i = 0; i < 3; i++) ink(ctx, [[mx + 10, my - 6 + i * 6], [mx + 150 + i * 30, my - 40 + i * 46]], 5, P.gold, .5 - i * .1);
  // 地上两摊血
  disc(ctx, 900, 1010, 120, 26, P.redD, .8);
  disc(ctx, 760, 1040, 70, 18, P.redD, .6);
};

KIT.set = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9300, 9), '#141018', 1);
  poly(ctx, box(0, 880, CW, 180, 9301, 9), '#2a1c14', .95);
  // 两条轨道 + 枕木
  ink(ctx, [[0, 906], [1700, 900]], 7, '#8d99a8', .55);
  ink(ctx, [[0, 962], [1700, 956]], 7, '#8d99a8', .45);
  for (let i = 0; i < 14; i++) ink(ctx, [[110 + i * 118, 890], [104 + i * 118, 978]], 4, '#5a3a24', .6);
  // 玩具小推车（推轨的家伙）
  ctx.save(); ctx.translate(420, 830);
  poly(ctx, box(-90, -70, 180, 76, 9302, 4), '#b3001b', .9);
  disc(ctx, -56, 34, 30, 30, '#0c0a0e', .9);
  disc(ctx, 56, 34, 30, 30, '#0c0a0e', .9);
  ink(ctx, [[-88, -74], [-150, -140]], 6, '#cfd6dc', .6);
  ctx.restore();
  // 摄影机：机身 + 镜头 + 三脚架
  ctx.save(); ctx.translate(1010, 520);
  poly(ctx, box(-110, -80, 220, 140, 9303, 4), '#2b2431', .97);
  poly(ctx, box(108, -56, 66, 60, 9304, 4), '#0c0a0e', .95);
  poly(ctx, box(174, -50, 22, 48, 9305, 3), '#8d99a8', .8);
  disc(ctx, -60, -40, 34, 34, '#d8caae', .35);
  poly(ctx, box(-16, 60, 32, 60, 9306, 3), '#2b2431', .95);
  ink(ctx, [[0, 118], [-150, 340]], 8, '#2b2431', .9);
  ink(ctx, [[0, 118], [0, 352]], 8, '#2b2431', .9);
  ink(ctx, [[0, 118], [150, 340]], 8, '#2b2431', .9);
  ctx.restore();
  // 打板：左上角，黑板 + 白斜条 + 一圈米色描边（不然深底上看不见板，只剩几根白棍）
  ctx.save(); ctx.translate(300, 250); ctx.rotate(-.22);
  poly(ctx, box(-150, -96, 300, 192, 9307, 3), '#0c0a0e', 1);
  edge(ctx, [[-150, -96], [150, -96], [150, 96], [-150, 96]], '#efe6d2', 3.2, .72);
  for (let i = 0; i < 5; i++) poly(ctx, box(-150 + i * 60, -96, 30, 192, 9308 + i, 3), '#efe6d2', .88);
  ink(ctx, [[-150, 26], [150, 26]], 4, '#efe6d2', .55);
  ctx.restore();
  // 一盏灯从右边打进来
  poly(ctx, rough([[1400, 0], [1620, 0], [1700, 300], [1520, 420]], 9309, 8), P.gold, .18);
};

// 镰刀那格：原来刀身太大太白，读成了一把伞。缩成弯月，补一道血色弧光。
KIT.scythe = (ctx, t) => {
  poly(ctx, box(0, 0, CW, CH, 9400, 9), '#1c0a10', 1);
  poly(ctx, box(0, 620, CW, 440, 9401, 9), P.redD, .55);
  ink(ctx, [[0, 618], [1700, 612]], 5, P.gold, .28);
  // 木柄
  ink(ctx, [[600, 940], [1006, 372]], 14, '#6a4a26', .92);
  ink(ctx, [[640, 900], [1006, 400]], 6, '#8a6432', .6);
  // 弯月刀身
  poly(ctx, [[1000, 300], [1110, 326], [1214, 392], [1290, 492], [1330, 606],
    [1272, 530], [1190, 442], [1096, 386], [1000, 366]], '#cfd6dc', .86);
  poly(ctx, [[1004, 306], [1108, 332], [1210, 396], [1284, 496],
    [1250, 470], [1170, 400], [1082, 358], [1004, 348]], '#f4f9ff', .8);
  // 血色弧光（挥过去的轨迹）
  poly(ctx, rough([[1130, 300], [1290, 380], [1400, 520], [1440, 700], [1390, 860], [1330, 940],
    [1370, 800], [1376, 660], [1330, 540], [1210, 420]], 9412, 12), P.red, .34);
  poly(ctx, rough([[1240, 340], [1380, 470], [1440, 640], [1410, 800], [1360, 900],
    [1390, 760], [1396, 620], [1350, 520], [1290, 440]], 9413, 10), P.redB, .22);
  disc(ctx, 1090, 980, 130, 26, P.redD, .8);
  disc(ctx, 1300, 1000, 80, 18, P.redD, .6);
};

export { P, box, poly, edge, ink, disc, rough };

export function cards(ctx, t, list, pal) {
  for (const c of list) {
    if (t < c.t0 || t > c.t1) continue;
    const kit = KIT[c.id];
    if (!kit) continue;
    ctx.save();
    ctx.translate(c.x - CW / 2, c.y - CH / 2);
    frame(ctx, t, c.seed || (c.id.length * 977));
    ctx.save();
    ctx.beginPath(); ctx.rect(40, 40, CW - 80, CH - 80); ctx.clip();
    // 画里的东西整体再收一圈：卡片是框，框里还得留边，画面才像贴上去的一张小画
    ctx.translate(CW / 2, CH / 2); ctx.scale(.88, .88); ctx.translate(-CW / 2, -CH / 2);
    kit(ctx, t, pal);
    ctx.restore();
    ctx.restore();
  }
}

export const CARD_IDS = Object.keys(KIT);
