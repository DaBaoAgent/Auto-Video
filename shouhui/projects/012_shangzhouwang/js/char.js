// shouhui · 妲己形象（代码绘制，cel/纸本）v3
// 叙事约束：全片论点是「一个字都没写」——不给清晰正脸。四款都靠背影/侧影/掩面保持神秘。
// 形似妲己的关键特征：高髻+玉笄+步摇垂珠、长鬓垂肩、宽袖长裙、双披帛飘带（后two者是妲己的标志剪影）。
// 动画：全部关节随 t 持续运动——呼吸起伏、头部微转、双袖滞后摆、飘带行波、步摇摆珠、裙摆摇曳；
//       外部仍可传 lean / hemSway / armRaise 覆盖（镜头编排用）。
// 结构：剪影分层 + 变宽笔触勾边 + 纸色挖线（衣褶）+ 朱砂点（笄/唇/结/步摇珠）。

import { PAL, hs, lerp, resample, circlePts, boil, polyPath, fillPoly, inkStroke } from './engine.js';

const INK = PAL.ink, CREAM = PAL.cream, RED = PAL.red;

// 实心剪影：填充 + 沿轮廓补一笔（让边缘有笔压变化）
function solid(c, pts, seed, o = {}) {
  const P = resample([...pts, pts[0]], 4, true);
  const Q = boil(P, seed, o.amp ?? 2.4, o.scale ?? 66);
  c.save(); c.globalAlpha = o.alpha ?? 0.96;
  fillPoly(c, Q, o.color ?? INK);
  c.restore();
  if (o.edge !== false) {
    inkStroke(c, [...Q, Q[0], Q[1]], { seed: seed + 7, color: o.color ?? INK, w: o.edgeW ?? 3.2, t0: 8, t1: 14, amp: 1.2, jit: 0.2, heavy: 0.1 });
  }
}
// 纸色挖线
function cut(c, pts, w, seed, amp = 1.6) {
  inkStroke(c, pts, { seed, color: CREAM, w, t0: 10, t1: 10, amp, jit: 0.18, heavy: 0 });
}
function dotR(c, x, y, r, seed) {
  fillPoly(c, boil(circlePts(x, y, r, 0, r * 0.9), seed, 1.4, 22), RED);
}

// ---------------------------------------------------------------- 部件
function skirt(c, seed, hem = 0) {
  const hw = 156 + hem * 6;
  const pts = [
    [-hw, -4], [-hw + 18, -26], [-hw * 0.66, -150], [-hw * 0.40, -300], [-56, -392],
    [56, -392], [hw * 0.40, -300], [hw * 0.66, -150], [hw - 18, -26], [hw, -4],
  ];
  solid(c, pts, seed, { amp: 3.2, scale: 74 });
  // 褶：4 条从腰到摆的长挖线（不是等距短线）
  const folds = [-0.34, -0.12, 0.14, 0.36];
  folds.forEach((u, i) => {
    cut(c, [[u * 92, -386], [u * 150, -230], [u * 240 + (i % 2 ? 14 : -10), -18]], 2.2 + 1.2 * hs(seed, i), seed + 11 + i, 2.2);
  });
  // 摆边：3 段起伏（不是缝线）
  for (let i = 0; i < 3; i++) {
    const x = -hw * 0.6 + i * hw * 0.6;
    cut(c, [[x, -10], [x + 26, -16], [x + 54, -8]], 2.4, seed + 31 + i, 1.6);
  }
}
function torso(c, seed) {
  solid(c, [[-78, -516], [-62, -524], [0, -528], [62, -524], [78, -516], [60, -392], [-60, -392]], seed, { amp: 2.6, scale: 68 });
  // 曲裾交领
  cut(c, [[-42, -520], [-2, -436], [26, -404]], 3.0, seed + 3, 1.8);
  cut(c, [[42, -518], [10, -440]], 2.4, seed + 4, 1.6);
  // 背缝
  cut(c, [[0, -528], [0, -430]], 1.6, seed + 5, 1.2);
}
function neck(c, seed) {
  // 加宽加高：顶进头底、底插进衣领，boil 抖动也不会露缝
  solid(c, [[-24, -512], [24, -512], [21, -566], [-21, -566]], seed, { amp: 1.4, scale: 36, edge: false });
}
function sleeveL(c, seed, swing = 0) {
  // 绕肩点(-76,-514)转 swing（正角=向后外摆）
  c.save(); c.translate(-76, -514); c.rotate(swing); c.translate(76, 514);
  solid(c, [[-76, -514], [-104, -500], [-134, -430], [-126, -318], [-96, -300], [-72, -330]], seed, { amp: 2.8, scale: 66 });
  cut(c, [[-126, -338], [-98, -318]], 2.2, seed + 2, 1.4);
  c.restore();
}
function sleeveR(c, seed, swing = 0) {
  c.save(); c.translate(76, -514); c.rotate(swing); c.translate(-76, 514);
  solid(c, [[76, -514], [104, -500], [134, -430], [126, -318], [96, -300], [72, -330]], seed, { amp: 2.8, scale: 66 });
  cut(c, [[126, -338], [98, -318]], 2.2, seed + 2, 1.4);
  c.restore();
}
function sash(c, seed) {
  solid(c, [[-62, -404], [62, -404], [60, -352], [-60, -352]], seed + 5, { amp: 2.0, scale: 44 });
  cut(c, [[-58, -392], [58, -392]], 2.0, seed + 6, 1.2);
  cut(c, [[-58, -364], [58, -364]], 2.0, seed + 7, 1.2);
  dotR(c, 0, -378, 9.5, seed + 8);
  cut(c, [[-8, -352], [-16, -258], [-8, -212]], 3.0, seed + 9, 1.8);
  cut(c, [[8, -352], [18, -270], [12, -228]], 3.0, seed + 10, 1.8);
}
function head(c, seed, face = 0, tilt = 0) {
  c.save(); c.translate(0, -600); c.rotate(tilt);
  // 头部整体轮廓（含颈口），一次成形，避免"戴帽子"
  const hp = [
    [-42, 44], [-50, 24], [-50, 4], [-46, -16], [-34, -32], [-14, -40],
    [8, -40], [28, -34], [42, -20], [48, 0], [46, 22], [38, 38],
    [28, 44], [16, 40], [4, 36], [-8, 36], [-20, 40], [-32, 46],
  ];
  solid(c, hp, seed, { amp: 1.8, scale: 40, edgeW: 2.6 });
  if (face > 0) {
    // 侧脸：右半挖纸色（贴着头缘），只留一线眼 + 一点朱唇
    const fc = [
      [47, -6], [49, 12], [45, 30], [36, 42], [26, 46], [23, 32], [26, 12], [31, -4],
    ];
    c.save(); c.globalAlpha = 0.99;
    fillPoly(c, boil(resample([...fc, fc[0]], 3, true), seed + 2, 1.0, 26), CREAM);
    c.restore();
    inkStroke(c, [[31, -2], [44, -4]], { seed: seed + 3, color: INK, w: 3.0, t0: 4, t1: 5, amp: 0.5 });
    inkStroke(c, [[30, -14], [43, -15]], { seed: seed + 4, color: INK, w: 2.0, t0: 4, t1: 5, amp: 0.5 });
    dotR(c, 39, 26, 5.6, seed + 5);
  }
  c.restore();
}
function hair(c, seed, fox = 0) {
  // 髻：贴在脑后的一个扁圆坨 + 一撮小顶髻（与头相接，不悬空）
  solid(c, [[-30, -624], [-24, -648], [-4, -660], [18, -654], [30, -636], [26, -616], [-6, -612]], seed, { amp: 1.8, scale: 38 });
  solid(c, circlePts(4, -662, 15, 0, 14), seed + 1, { amp: 1.4, scale: 30 });
  // 鬓发：两侧贴颊的窄弧条（贴着头缘垂到颌下，不是尖刺）
  solid(c, [[-40, -560], [-50, -530], [-47, -498], [-40, -510], [-36, -544]], seed + 3, { amp: 1.6, scale: 36 });
  solid(c, [[40, -560], [50, -530], [47, -498], [40, -510], [36, -544]], seed + 4, { amp: 1.6, scale: 36 });
  // 发髻上的三道盘发弧（挖线，背面才看得出是"盘"上去的）
  cut(c, [[-26, -636], [-6, -648], [16, -642]], 1.8, seed + 5, 1.0);
  cut(c, [[-22, -624], [0, -634], [20, -628]], 1.4, seed + 6, 0.8);
  if (fox) {
    // 狐耳：从髻两侧斜出的两片，底宽尖窄
    solid(c, [[-26, -646], [-46, -696], [-8, -660]], seed + 7, { amp: 2.4, scale: 34 });
    solid(c, [[18, -652], [44, -700], [46, -650]], seed + 8, { amp: 2.4, scale: 34 });
    cut(c, [[-22, -652], [-36, -682]], 1.6, seed + 9, 0.8);
  }
}
function pin(c, seed) {
  // 玉笄横穿髻顶，两端都露在剪影外；右端一点朱砂
  inkStroke(c, [[-70, -684], [62, -696]], { seed: seed + 1, color: INK, w: 3.8, t0: 10, t1: 12, amp: 0.8, heavy: 0 });
  cut(c, [[-64, -686], [56, -697]], 1.2, seed + 2, 0.5);
  dotR(c, 68, -698, 5.6, seed + 3);
}
function buyao(c, seed, t = 0) {
  // 步摇：从高髻两侧垂下的短链珠，末端朱砂珠，随步幅/呼吸轻摆（妲己标志性发饰）
  const sw = Math.sin(t * 2.6) * 0.12;
  for (const side of [-1, 1]) {
    const bx = side * 20, by = -656;
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const u = i / 4;
      pts.push([bx + side * (4 + u * 10) + Math.sin(u * 2.4 + t * 2.6 + side) * (6 * u) + sw * 60 * u * u,
                by + u * 62]);
    }
    inkStroke(c, pts, { seed: seed + 1 + side, color: INK, w: 2.8, t0: 4, t1: 7, amp: 0.7, heavy: 0 });
    const e = pts[pts.length - 1];
    dotR(c, e[0], e[1] + 4, 5.0, seed + 5 + side);
  }
}
function ribbons(c, seed, t = 0, sway = 0) {
  // 双披帛：从两肩后向外下飘的长带（妲己剪影标志），行波随 t，hemSway 加大摆幅
  // 造型：先贴肩下垂、中段外抛、尾端回勾——S 形垂坠，不是直线
  for (const side of [-1, 1]) {
    const seg = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const wave = Math.sin(u * 5.6 - t * 2.3 + (side > 0 ? 1.2 : 0)) * (6 + 46 * u) * (0.8 + sway * 0.5);
      const out = 50 + 118 * Math.sin(u * Math.PI * 0.62) + u * u * 46;   // 中段外抛、尾端略收
      seg.push([side * out + wave * 0.55,
                -502 + u * 338 + wave + u * u * 26 + (hs(seed + side * 3, i) - 0.5) * 6]);
    }
    c.save(); c.globalAlpha = 0.52;
    inkStroke(c, seg, { seed: seed + 7 + side, color: INK, w: 16, t0: 20, t1: 90, amp: 2.6, jit: 0.5, heavy: 0.15 });
    c.globalAlpha = 0.34;
    inkStroke(c, seg.map(([x, y]) => [x + side * 9, y + 6]), { seed: seed + 11 + side, color: INK, w: 6, t0: 14, t1: 60, amp: 2.2, jit: 0.6, heavy: 0 });
    c.restore();
  }
}
function tail(c, seed, t = 0) {
  // 狐尾：从腰后拖到地面，宽笔触，半透明
  c.save(); c.globalAlpha = 0.42;
  const spine = [];
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    spine.push([26 + u * 190, -300 + u * 250 + Math.sin(u * 3.0 + t * 0.9) * 40]);
  }
  inkStroke(c, spine, { seed: seed + 3, color: INK, w: 96, t0: 30, t1: 140, amp: 4.2, jit: 0.6, heavy: 0.3 });
  c.restore();
}
// 抬袖掩面：一条弯带越过脸的下半与右侧
function sleeveMask(c, seed, k = 1) {
  // k=0 垂下，k=1 抬到脸前
  const down = [[-78, -516], [-116, -470], [-118, -380], [-96, -350], [-64, -392], [-56, -470], [-64, -520], [-56, -500], [-46, -520], [-58, -540], [-66, -520]];
  const up = [
    [-92, -516], [-124, -566], [-118, -626], [-78, -660],
    [-10, -664], [44, -640], [54, -600], [30, -566], [-6, -572], [-42, -586], [-66, -548],
  ];
  const pts = up.map(([x, y], i) => [lerp(down[i][0], x, k), lerp(down[i][1], y, k)]);
  solid(c, pts, seed, { amp: 3.2, scale: 56 });
  if (k > 0.55) {
    cut(c, [[-112, -600], [-66, -628], [-6, -632], [34, -614]], 3.0, seed + 3, 2.0);
    cut(c, [[-96, -560], [-52, -580], [4, -584]], 2.4, seed + 4, 1.6);
  } else {
    cut(c, [[-110, -430], [-70, -404], [-40, -420]], 2.6, seed + 3, 1.8);
  }
}
function shadow(c, seed) {
  c.save(); c.globalAlpha = 0.10;
  fillPoly(c, boil(circlePts(0, -6, 120, 0, 38), seed, 6, 90), INK);
  c.restore();
}

// ---------------------------------------------------------------- 总装
// 0 背影·玉笄 / 1 背影·狐影 / 2 侧影·垂袖 / 3 举袖·掩面
export function drawDaji(c, o = {}) {
  const { x = 0, y = 0, s = 1, variant = 0, t = 0, seed = 500, lean, hemSway, alpha = 1, armRaise = 1 } = o;
  const sv = Math.floor(t * 12) % 4;
  // 内建关节动画（外部未传时生效）：呼吸→lean；裙摆→hemSway；双袖滞后摆
  const breath = Math.sin(t * 1.9);
  const leanV = lean ?? breath * 0.012;
  const hemV = hemSway ?? Math.sin(t * 1.4) * 0.5;
  // 双袖：肩先动、肘后跟（滞后 0.55rad）——手签拖带延迟
  const armPhase = Math.sin(t * 1.7);
  const swR = armPhase * 0.055, swL = Math.sin(t * 1.7 - 0.55) * 0.055;
  const headTilt = (variant === 3 ? 0.02 : variant === 2 ? -0.05 : 0) + Math.sin(t * 0.8) * 0.028;

  c.save(); c.globalAlpha = alpha;
  c.translate(x, y); c.scale(s, s); c.rotate(leanV);

  if (variant === 1) tail(c, seed + sv * 17, t * 0.7);
  ribbons(c, seed + sv * 13, t, hemV);
  shadow(c, seed + sv * 5);
  skirt(c, seed + sv * 7, hemV);
  torso(c, seed + 13 + sv * 3);
  neck(c, seed + 15 + sv * 2);
  sleeveR(c, seed + 17 + sv * 9, swR);
  if (variant === 3) { head(c, seed + 29 + sv * 3, 0, headTilt); hair(c, seed + 37 + sv * 6, 0); pin(c, seed + 43 + sv * 2); buyao(c, seed + 61 + sv * 3, t); sleeveMask(c, seed + 91 + sv * 4, armRaise); }
  else {
    sleeveL(c, seed + 19 + sv * 4, swL);
    if (armRaise > 0.02) sleeveMask(c, seed + 91 + sv * 4, armRaise);
    head(c, seed + 29 + sv * 3, variant === 2 ? 1 : 0, headTilt);
    hair(c, seed + 37 + sv * 6, variant === 1 ? 1 : 0);
    pin(c, seed + 43 + sv * 2);
    buyao(c, seed + 61 + sv * 3, t);
  }
  c.restore();
}

export const VARIANTS = [
  { id: 0, name: '背影 · 玉笄', note: '全墨剪影，玉笄一点朱砂；不给脸' },
  { id: 1, name: '背影 · 狐影', note: '身后水墨狐尾 + 发髻上一对狐耳' },
  { id: 2, name: '侧影 · 垂袖', note: '露一侧下颌与朱唇，只给一线眼' },
  { id: 3, name: '举袖 · 掩面', note: '抬袖遮脸，袖口即画面分割' },
];