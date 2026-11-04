// ================================================================== s46 恩基泄密 209.10–212.50
function shot46(t, f) {
  const u = t - 209.10;
  skyBand(-10, H, M(1), M(2));
  halo(200, 150, 220, 170, R_GOLD, 0.5, 2.0);
  // 神：鱼头冠 + 长袍
  poly([[112, 300], [126, 206], [148, 180], [186, 174], [214, 190], [224, 214], [230, 300]], M(21));
  godHead(180, 168, 1.6, M(21), M(22), 1);
  // 鱼冠
  poly([[152, 152], [176, 138], [206, 144], [212, 156], [186, 160]], M(22));
  polyLine([[152, 152], [176, 138], [206, 144], [212, 156], [186, 160]], M(23), true);
  // 低头耳语
  line(206, 196, 246, 208, M(15));
  // 人：跪坐
  poly([[236, 300], [240, 240], [252, 216], [276, 210], [296, 226], [300, 300]], M(13));
  disc(266, 200, 15, M(13));
  arc(266, 200, 15, -2.7, 0.2, M(14));
  // 密语的气泡
  if (u > 0.5) {
    const k = clamp((u - 0.5) / 0.6, 0, 1);
    for (let i = 0; i < 16; i++) {
      const a = hash(i, 191) * 6.283;
      const rr = 4 + hash(i, 193) * 22;
      px(Math.round(240 + Math.cos(a) * rr), Math.round(186 + Math.sin(a) * rr * 0.6 - k * 6), M(16));
    }
    text('恩基', 116, 200, M(15), 1);
    text('ENKI', 116, 214, M(26), 1);
  }
  // 方舟
  if (u > 1.4) {
    const k = clamp((u - 1.4) / 0.9, 0, 1);
    const bx = 440, by = 262;
    poly([[bx - 90, by], [bx + 90, by], [bx + 66, by + 34], [bx - 66, by + 34]], M(12));
    polyLine([[bx - 90, by], [bx + 90, by], [bx + 66, by + 34], [bx - 66, by + 34]], M(14), true);
    for (let i = -3; i <= 3; i++) vline(bx + i * 24, by + 4, 26, M(11));
    // 船屋
    rect(bx - 50, by - 54, 100, 54, M(12));
    poly([[bx - 58, by - 54], [bx, by - 92], [bx + 58, by - 54]], M(11));
    for (let i = 0; i < Math.round(6 * k); i++) {
      tinyPerson(bx - 44 + i * 18, by - 54, 1.0, M(1));
    }
    text('造方舟', bx - 24, by + 44, M(15), 1);
    halo(bx, by - 20, 120, 90, R_GOLD, 0.4, 2.0);
  }
  // 泄密
  if (u > 0.9) chip('只有智慧之神泄了密', 300, 40, M(15), M(0), M(19));
  hud('泄密', 'THE LEAK');
}

// ================================================================== s47 洪水故事 212.50–217.30
function clayTablet(x, y, w, h, glow) {
  rect(x + 3, y + 3, w, h, M(0));
  rect(x, y, w, h, M(14));
  rect(x + 5, y + 5, w - 10, h - 10, M(13));
  for (let r = 0; r < Math.floor((h - 20) / 11); r++) for (let c = 0; c < Math.floor((w - 20) / 16); c++) {
    if (hash(r * 5 + 1, c + 3) < 0.68) {
      const px0 = x + 10 + c * 16, py0 = y + 10 + r * 11;
      px(px0, py0, M(11)); px(px0 + 1, py0 + 1, M(11)); px(px0 + 2, py0, M(10));
    }
  }
  if (glow) { cornerFrame(x, y, w, h, M(15), 10); }
}
function shot47(t, f) {
  const u = t - 212.50;
  roomWall(M(9), M(10), 30);
  halo(320, 60, 380, 160, R_WARM, 0.45, 2.1);
  text('苏美尔', 52, 30, M(15), 1);
  text('SUMER · ~2100 BC', 52, 44, M(26), 1);
  text('圣经', 486, 30, M(15), 1);
  text('GENESIS · ~500 BC', 486, 44, M(26), 1);
  clayTablet(46, 66, 200, 200, true);
  clayTablet(480, 66, 140, 200, false);
  // 相同细节
  const beats = ['洪水', '方舟', '放鸟', '停山', '献祭'];
  const k = clamp((u - 0.6) / 1.8, 0, 1);
  beats.forEach((zh, i) => {
    const y = 84 + i * 36;
    const kk = clamp((u - 0.6 - i * 0.25) / 0.4, 0, 1);
    if (kk <= 0) return;
    rect(258, y, 100, 20, M(0));
    text(zh, 262, y + 4, M(15), 1);
    hline(250, y + 10, Math.round(8 * kk), M(8));
    hline(358 + Math.round(8 * (1 - kk)), y + 10, Math.round(8 * kk), M(8));
    disc(252, y + 10, 2, M(19)); disc(362, y + 10, 2, M(19));
  });
  // 早一千多年
  if (u > 2.4) {
    const k2 = clamp((u - 2.4) / 0.4, 0, 1);
    stampBox('早一千多年', 176, 292, M(19), 1);
    if (k2 < 1) for (let s = 0; s < 50; s++) px(176 + Math.round(hash(s, 201) * 160), 292 + Math.round(hash(s, 203) * 24), M(8));
  }
  hud('同一场洪水', 'THE SAME FLOOD');
}

// ================================================================== s48 家园变孤岛 217.30–223.40
function shot48(t, f) {
  const u = t - 217.30;
  skyBand(-10, 120, M(1), M(24));
  halo(320, 130, 380, 130, R_GOLD, 0.5, 2.2);
  seaBand(190, 320, t, M(21), M(22), 4);
  // 丘陵 → 孤岛
  const hills = [
    { x: 120, w: 150, h: 76, at: 0.2, village: true },
    { x: 320, w: 120, h: 62, at: 1.2, village: true },
    { x: 500, w: 130, h: 70, at: 2.2, village: true },
    { x: 236, w: 90, h: 52, at: 3.0, village: false },
  ];
  const lvl = Math.round(lerp(300, 186, clamp(u / 6, 0, 1)));
  hills.forEach((hl, i) => {
    const bot = 232 + i * 2;
    poly([[hl.x, bot], [hl.x + hl.w * 0.2, bot - hl.h * 0.7], [hl.x + hl.w * 0.5, bot - hl.h],
      [hl.x + hl.w * 0.8, bot - hl.h * 0.65], [hl.x + hl.w, bot]], M(12));
    if (hl.village) {
      houseHut(hl.x + hl.w * 0.32, bot - hl.h * 0.55, 16, 12, M(14), M(13));
      houseHut(hl.x + hl.w * 0.56, bot - hl.h * 0.7, 14, 10, M(14), M(13));
      palm(hl.x + hl.w * 0.72, bot - hl.h * 0.5, 26, t, 51 + i);
    }
  });
  // 上涨的水
  for (let y = lvl; y < H; y++) {
    for (let x = -10; x < 650; x++) if (bay(x, y) < 0.6) px(x, y, (y - lvl) < 16 ? M(22) : M(21));
  }
  for (let x = -10; x < 650; x += 2) px(x, lvl + Math.round(Math.sin(x * 0.05 + t * 2.6) * 2), M(28));
  if (u > 3.6) {
    chip('一座接一座变成孤岛', 240, 40, M(15), M(0), M(19));
  }
  if (u > 0.4) text('海平面又涨了几百年', 40, 300 - 40, M(8), 1);
  hud('孤岛', 'ISLANDS ONE BY ONE');
}

// ================================================================== s49 穿鱼头装去教 223.40–230.90
function shot49(t, f) {
  const u = t - 223.40;
  skyBand(-10, 150, M(1), M(24));
  skyBand(150, 214, M(24), M(14));
  halo(180, 190, 320, 130, R_GOLD, 0.6, 2.2);
  seaBand(210, 262, t, M(21), M(22), 4);
  // 岸
  poly([[-10, 258], [80, 252], [180, 258], [300, 250], [420, 256], [540, 250], [650, 256], [650, 320], [-10, 320]], M(12));
  hline(-10, 260, 660, M(13));
  // 新村
  houseHut(430, 258, 34, 28, M(13), M(12));
  houseHut(486, 256, 28, 24, M(13), M(12));
  houseHut(534, 258, 38, 30, M(13), M(12));
  palm(580, 256, 44, t, 61);
  // 鱼人上岸
  const off = Math.round(lerp(120, 0, clamp((u - 0.4) / 1.6, 0, 1)));
  apkallu(190, 262, off - 6, t);
  // 三个教学面板
  const panels = [['wheat', '种地', 0.9], ['temple', '盖庙', 1.9], ['tablet', '写字', 2.9]];
  panels.forEach(([kind, zh, at], i) => {
    const k = clamp((u - at) / 0.3, 0, 1);
    if (k <= 0) return;
    const bx = 268 + i * 122, by = 40 + Math.round((1 - k) * -14);
    panelBox(bx, by, 108, 84, null, null, k < 1 ? M(8) : M(15));
    icon(kind, bx + 54, by + 44, 1.6, M(15), M(22));
    text(zh, bx + 8, by + 8, M(15), 1);
    hline(bx + 8, by + 22, 32, M(18));
    // 虚线指到鱼人
    dottedLine(bx + 54, by + 84, 230, 210, M(23), 4);
  });
  if (u > 0.3) text('六千五百年前', 40, 34, M(8), 1);
  if (u > 4.2) chip('冰盖化完了', 40, 52, M(15), M(0), M(23));
  hud('登岸', 'TEACHING THE NEW WORLD');
}

// ================================================================== s50 满身黑科技 230.90–234.10
function shot50(t, f) {
  const u = t - 230.90;
  skyBand(-10, H, M(1), M(2));
  halo(320, 168, 240, 170, R_GOLD, 0.65, 2.1);
  // 城市剪影
  for (let i = 0; i < 9; i++) {
    const w = 26 + Math.round(hash(i, 211) * 20);
    const h = 40 + Math.round(hash(i, 213) * 70);
    const x = 120 + i * 46;
    rect(x, 300 - h, w, h, M(1));
    if (i % 3 === 0) rect(x + 4, 300 - h - 12, w - 8, 12, M(1));
    for (let k = 0; k < 4; k++) if (hash(i, k + 215) < 0.6) px(x + 6 + k * 5, 300 - h + 8, M(15));
  }
  // 诞生的光
  const k = clamp(u / 1.2, 0, 1);
  disc(320, 170, Math.round(20 + 30 * k), M(16));
  disc(320, 170, Math.round(14 + 22 * k), M(8));
  // 放射线
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * 6.283 + t * 0.2;
    const r0 = 40 + k * 20, r1 = r0 + 26 + hash(i, 217) * 30;
    line(320 + Math.cos(a) * r0, 170 + Math.sin(a) * r0, 320 + Math.cos(a) * r1, 170 + Math.sin(a) * r1, i & 1 ? M(15) : M(29));
  }
  // 黑科技图标飞散
  const IC = [['wheel', -1, -1], ['star', 1, -1], ['gear', -1, 1], ['tablet', 1, 1], ['wheat', -1, 0], ['boat', 1, 0]];
  IC.forEach(([kind, sx, sy], i) => {
    const at = 0.9 + i * 0.15;
    if (u < at) return;
    const kk = clamp((u - at) / 0.6, 0, 1);
    const x = 320 + sx * (60 + 90 * kk) + (sx ? 0 : 0), y = 170 + sy * (50 + 70 * kk);
    icon(kind, Math.round(x), Math.round(y), 1.2, M(15), M(23));
  });
  if (u > 0.2) textSC('苏美尔文明', 320, 30, M(15), 3);
  if (u > 1.4) textC('一出生就满身黑科技', 320, 74, M(8), 1);
  hud('诞生', 'BORN FULL-GROWN');
}

// ================================================================== s51 王表：洪水前 234.10–239.70
function kingRows(x, y, w, rows, col) {
  rows.forEach(([name, yrs, at], i) => {
    const ry = y + i * 30;
    text(name, x + 8, ry + 6, M(8), 1);
    text(yrs, x + w - 8 - textW(yrs), ry + 4, col, 1);
    hline(x + 8, ry + 22, w - 16, M(11));
  });
}
function shot51(t, f) {
  const u = t - 234.10;
  roomWall(M(9), M(10), 30);
  halo(320, 60, 360, 160, R_WARM, 0.5, 2.1);
  // 长泥板
  rect(96, 32, 448, 300, M(0));
  rect(104, 40, 432, 284, M(14));
  for (let r = 0; r < 20; r++) for (let c = 0; c < 12; c++) if (hash(r + 5, c + 9) < 0.3) px(120 + c * 34, 50 + r * 14, M(13));
  rect(112, 44, 416, 24, M(0));
  text('苏美尔王表', 118, 48, M(15), 1);
  text('THE SUMERIAN KING LIST', 236, 48, M(26), 1);
  const rows = [
    ['阿卢利姆', '28,800 年', 0.4],
    ['阿拉尔加', '36,000 年', 0.9],
    ['恩门卢安纳', '43,200 年', 1.4],
    ['恩门加兰纳', '28,800 年', 1.9],
    ['杜姆齐德', '36,000 年', 2.4],
  ];
  rows.forEach(([name, yrs, at], i) => {
    if (u < at) return;
    const k = clamp((u - at) / 0.25, 0, 1);
    const ry = 82 + i * 34;
    text(name, 124, ry + 6, M(8), 1);
    text(yrs, 420 - textW(yrs), ry + 4, M(15), 1);
    hline(120, ry + 24, 408, k < 1 ? M(8) : M(11));
  });
  if (u > 2.6) {
    textC('动不动在位几万年', 320, 296 - 18, M(15), 1);
    stampBox('洪水前', 452, 268, M(19), 1);
  }
  hud('王表', 'THE KING LIST');
}

// ================================================================== s52 洪水线之后 239.70–245.60
function shot52(t, f) {
  const u = t - 239.70;
  roomWall(M(9), M(10), 30);
  halo(320, 60, 360, 160, R_WARM, 0.5, 2.1);
  rect(96, 20, 448, 316, M(0));
  rect(104, 28, 432, 300, M(14));
  for (let r = 0; r < 22; r++) for (let c = 0; c < 12; c++) if (hash(r + 7, c + 11) < 0.3) px(120 + c * 34, 36 + r * 13, M(13));
  // 洪水前的国王
  const before = [['阿卢利姆', '28,800 年'], ['阿拉尔加', '36,000 年'], ['杜姆齐德', '36,000 年']];
  before.forEach(([n, y], i) => {
    text(n, 120, 40 + i * 26, M(8), 1);
    text(y, 420 - textW(y), 38 + i * 26, M(15), 1);
  });
  // 洪水线
  const lineY = 128;
  if (u > 0.3) {
    const k = clamp((u - 0.3) / 0.6, 0, 1);
    hline(108, lineY, Math.round(424 * k), M(19));
    hline(108, lineY + 2, Math.round(424 * k), M(18));
    text('洪水线', 108, lineY - 14, M(19), 1);
    text('THE FLOOD LINE', 160, lineY - 14, M(26), 1);
    for (let i = 0; i < Math.round(30 * k); i++) px(108 + Math.round(hash(i, 221) * 424), lineY + 1, M(8));
  }
  // 之后的国王：正常寿命
  const after = [['基什王', '1,200 年'], ['恩美巴拉格西', '900 年'], ['吉尔伽美什', '126 年'], ['乌尔王', '25 年'], ['拉格什王', '10 年']];
  after.forEach(([n, y], i) => {
    const at = 1.0 + i * 0.4;
    if (u < at) return;
    const yy = lineY + 14 + i * 30;
    text(n, 120, yy + 6, M(8), 1);
    text(y, 420 - textW(y), yy + 4, i > 2 ? M(15) : M(16), 1);
    hline(116, yy + 22, 408, M(11));
  });
  if (u > 3.4) {
    textC('一过这条线，就变回正常人类', 320, 306 - 16, M(8), 1);
    chip('被淹前的记忆', 380, 320 - 30, M(15), M(0), M(19));
  }
  hud('洪水线', 'AFTER THE FLOOD');
}

// ================================================================== s53 文明灭亡 245.60–251.30
function shot53(t, f) {
  const u = t - 245.60;
  skyBand(-10, 190, M(1), M(24));
  skyBand(190, 250, M(24), M(14));
  halo(400, 210, 300, 130, R_WARM, 0.45, 2.2);
  disc(410, 204, 18, M(14));
  // 废墟
  rect(-10, 262, 660, 100, M(13));
  const cols = [140, 232, 330, 430, 520];
  cols.forEach((x, i) => {
    const h = 70 + Math.round(hash(i, 231) * 60);
    rect(x, 262 - h, 22, h, M(12));
    for (let j = 0; j < h; j += 6) hline(x + 2, 262 - h + j, 18, M(11));
    rect(x - 4, 262 - h - 8, 30, 8, M(13));
    if (i & 1) { px(x + 4, 262 - h + 12, M(1)); px(x + 12, 262 - h + 20, M(1)); }
  });
  // 断柱
  poly([[586, 262], [596, 200], [616, 196], [620, 262]], M(12));
  // 沙
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(hash(i, 233) * 660), y = 268 + Math.floor(hash(i, 235) * 60);
    px(x, y, hash(i, 237) < 0.4 ? M(14) : M(12));
  }
  // 陶罐与骨骸
  icon('jar', 360, 286, 1.2, M(14), M(12));
  for (let i = 0; i < 8; i++) { const x = 452 + i * 7, y = 288 - Math.round(Math.sin(i * 1.4) * 5); px(x, y, M(28)); }
  disc(456, 280, 6, M(28));
  // 为什么
  if (u > 1.0) {
    const k = clamp((u - 1.0) / 0.4, 0, 1);
    textSC('?', 380, 40 + Math.round((1 - k) * 12), M(15), 5);
    text('苏美尔文明最终灭亡', 40, 40, M(8), 1);
  }
  if (u > 2.6) {
    textC('科学家挖出来的原因是', 320, 300 - 26, M(15), 1);
  }
  dustMotes(t, 20, 241, 80, 620, 220, 300, M(14));
  hud('灭亡', 'THE END');
}

// ================================================================== s54 三百年超级干旱 251.30–255.30
function shot54(t, f) {
  const u = t - 251.30;
  skyBand(-10, 150, M(1), M(14));
  halo(180, 150, 280, 150, R_WARM, 0.7, 2.1);
  disc(180, 150, 26, M(15));
  // 龟裂的大地
  rect(-10, 200, 660, 160, M(13));
  for (let i = 0; i < 60; i++) {
    const sx = Math.floor(hash(i, 251) * 640), sy = 204 + Math.floor(hash(i, 253) * 130);
    const a = hash(i, 255) * 6.283, len = 16 + hash(i, 257) * 34;
    line(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len, M(10));
  }
  for (let i = 0; i < 40; i++) {
    const sx = Math.floor(hash(i, 259) * 640), sy = 210 + Math.floor(hash(i, 261) * 120);
    const a = hash(i, 263) * 6.283, len = 10 + hash(i, 265) * 22;
    line(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len, M(11));
  }
  // 枯树
  vline(520, 232, 60, M(10));
  line(520, 250, 500, 226, M(10)); line(520, 244, 542, 220, M(10));
  line(520, 236, 536, 214, M(10));
  // 300 年
  if (u > 0.6) {
    const k = clamp((u - 0.6) / 0.6, 0, 1);
    textSC('300 年', 400, 60, M(19), 3);
    text('超级干旱', 400, 104, M(8), 1);
    // 干裂的进度条
    barMeter(300, 130, 320, 12, k, M(1), M(19), M(27));
  }
  if (u > 2.0) {
    chip('温盐环流突然减弱', 320, 170, M(15), M(0), M(23));
    text('THE CONVEYOR WEAKENED', 320, 190, M(26), 1);
  }
  hud('超级干旱', 'THREE CENTURIES OF DROUGHT');
}

// ================================================================== s55 凭什么减弱 255.30–259.50
function shot55(t, f) {
  const u = t - 255.30;
  skyBand(-10, H, M(2), M(3));
  halo(320, 170, 300, 180, R_TEAL, 0.68, 2.1);
  // 冰盖：空
  poly([[90, 240], [110, 190], [160, 172], [220, 184], [240, 232], [200, 252], [130, 250]], M(3));
  polyLine([[90, 240], [110, 190], [160, 172], [220, 184], [240, 232], [200, 252], [130, 250]], M(6), true);
  // 残留碎冰：亮棱面给画面一个硬锚点
  const ICY = [[286, 258, 26, 11], [336, 266, 18, 8], [250, 272, 14, 6], [376, 276, 24, 9]];
  for (const [ix, iy, iw, ih] of ICY) {
    poly([[ix - iw, iy], [ix - iw + 7, iy - ih], [ix + iw - 8, iy - ih + 2], [ix + iw, iy]], M(4));
    polyLine([[ix - iw, iy], [ix - iw + 7, iy - ih], [ix + iw - 8, iy - ih + 2], [ix + iw, iy]], M(7), true);
    hline(ix - iw + 7, iy - ih, 10, M(8));
  }
  text('冰盖早化完了', 80, 140, M(8), 1);
  text('NO ICE LEFT', 80, 156, M(26), 1);
  // 环流
  const LOOP = [[300, 90], [400, 70], [500, 96], [540, 170], [492, 236], [400, 254], [310, 226]];
  for (let i = 0; i < LOOP.length; i++) {
    const a = LOOP[i], b = LOOP[(i + 1) % LOOP.length];
    const ph = ((t * 0.4 + i * 0.16) % 1);
    const bx = lerp(a[0], b[0], ph), by = lerp(a[1], b[1], ph);
    px(Math.round(bx), Math.round(by), M(19));
    px(Math.round(bx) + 1, Math.round(by), M(18));
  }
  // 断口
  px(400, 70, M(8));
  for (let i = 0; i < 4; i++) px(394 + (i & 1) * 12, 64 + (i >> 1) * 12, M(19));
  // 大问号
  if (u > 0.8) {
    const k = clamp((u - 0.8) / 0.5, 0, 1);
    textSC('?', 400, 120 + Math.round((1 - k) * -14), M(15), 7);
  }
  if (u > 1.8) {
    textC('没人说得清', 320, 292, M(8), 1);
    chip('它凭什么减弱', 40, 40, M(15), M(0), M(19));
  }
  hud('说不清', 'NOBODY CAN SAY');
}

// ================================================================== s56 还得涨 70 米 259.50–265.50
function shot56(t, f) {
  const u = t - 259.50;
  skyBand(-10, 160, M(1), M(24));
  halo(300, 200, 340, 140, R_GOLD, 0.5, 2.2);
  // 地球
  const gx = 200, gy = 112, gr = 58;
  disc(gx, gy, gr, M(22));
  for (let j = -gr; j <= gr; j++) for (let i = -gr; i <= gr; i++) {
    if (i * i + j * j > gr * gr) continue;
    if (hash(gx + i, gy + j) < 0.2) px(gx + i, gy + j, M(30));
  }
  ellipse(gx, gy, gr - 2, gr - 2, M(8));
  // 温度计
  rect(gx + gr + 14, gy - 46, 8, 96, M(0));
  rect(gx + gr + 16, gy - 44, 4, 92, M(2));
  const th = Math.round(lerp(70, 20, clamp((u - 0.4) / 2.4, 0, 1)));
  rect(gx + gr + 16, gy - 44, 4, th, M(19));
  disc(gx + gr + 18, gy + 54, 8, M(19));
  // 海岸城市
  rect(-10, 240, 660, 120, M(13));
  for (let i = 0; i < 12; i++) {
    const w = 18 + Math.round(hash(i, 271) * 18);
    const h = 26 + Math.round(hash(i, 273) * 54);
    const x = 30 + i * 50;
    rect(x, 240 - h, w, h, M(12));
    for (let k = 0; k < 3; k++) if (hash(i, k + 275) < 0.5) px(x + 4 + k * 6, 240 - h + 6, M(16));
  }
  // 涨 70 米
  if (u > 1.2) {
    const k = clamp((u - 1.2) / 1.2, 0, 1);
    const lvl = Math.round(lerp(240, 150, k));
    for (let y = lvl; y < H; y++) for (let x = -10; x < 650; x++) if (bay(x, y) < 0.62) px(x, y, (y - lvl) < 14 ? M(22) : M(21));
    for (let x = -10; x < 650; x += 2) px(x, lvl + Math.round(Math.sin(x * 0.05 + t * 2.4) * 2), M(28));
    // 标尺
    vline(614, 150, 90, M(15));
    hline(608, 150, 12, M(15)); hline(608, 240, 12, M(15));
    text('70 m', 570, 146, M(15), 1);
  }
  if (u > 0.3) text('地球这场感冒还没好', 40, 40, M(8), 1);
  if (u > 2.6) chip('海平面还得再涨七十米', 320, 40, M(15), M(0), M(23));
  hud('七十米', 'SEVENTY METRES MORE');
}

// ================================================================== s57 谁的伊甸园 265.50–269.60
function shot57(t, f) {
  const u = t - 265.50;
  skyBand(-10, 150, M(1), M(24));
  halo(320, 180, 380, 150, R_GOLD, 0.55, 2.2);
  // 今天的城市
  for (let i = 0; i < 14; i++) {
    const w = 20 + Math.round(hash(i, 281) * 26);
    const h = 40 + Math.round(hash(i, 283) * 90);
    const x = 10 + i * 46;
    rect(x, 220 - h, w, h, M(2));
    for (let r = 0; r < Math.floor(h / 12); r++) for (let c = 0; c < Math.floor(w / 8); c++) {
      if (hash(i * 9 + r, c + 285) < 0.55) px(x + 4 + c * 8, 220 - h + 6 + r * 12, hash(i, r + 287) < 0.2 ? M(15) : M(26));
    }
  }
  // 水
  const lvl = Math.round(lerp(300, 196, clamp((u - 0.8) / 2.2, 0, 1)));
  for (let y = lvl; y < H; y++) for (let x = -10; x < 650; x++) if (bay(x, y) < 0.6) px(x, y, (y - lvl) < 16 ? M(22) : M(21));
  for (let x = -10; x < 650; x += 2) px(x, lvl + Math.round(Math.sin(x * 0.06 + t * 2.6) * 2), M(28));
  if (u > 1.6) {
    textC('我们现在站的地方', 320, 40, M(8), 1);
    const k = clamp((u - 2.4) / 0.4, 0, 1);
    textSC('会不会也变成谁的伊甸园', 320, 58 + Math.round((1 - k) * 10), M(15), 2);
  }
  hud('谁的伊甸园', 'WHOSE EDEN NEXT');
}

// ================================================================== s58 白了个白 269.60–272.05
function shot58(t, f) {
  const u = t - 269.60;
  skyBand(-10, H, M(1), M(2));
  halo(320, 150, 300, 200, R_GOLD, 0.45, 2.1);
  stars(f);
  // 地平线
  hline(-10, 262, 660, M(21));
  rect(-10, 262, 660, 98, M(20));
  // 人和狗
  const walk = clamp(u / 2.4, 0, 1);
  const px0 = Math.round(lerp(150, 470, walk));
  tinyPerson(px0, 262, 2.2, M(8), true);
  // 狗
  const dx = px0 + 26, dy = 262;
  rect(dx, dy - 10, 18, 8, M(13));
  rect(dx + 14, dy - 18, 8, 8, M(13));
  line(dx + 2, dy - 2, dx + 2, dy, M(13)); line(dx + 15, dy - 2, dx + 15, dy, M(13));
  line(dx - 1, dy - 12, dx - 5, dy - 18, M(13));
  px(dx + 20, dy - 14, M(1));
  line(px0 + 4, dy - 14, dx + 18, dy - 12, M(26));
  // 标题
  if (u > 0.5) {
    const k = clamp((u - 0.5) / 0.7, 0, 1);
    textSC('白了个白', 320, 96 + Math.round((1 - k) * 16), M(15), 4);
    textC('SEE YOU NEXT TIME', 320, 152, M(26), 1);
  }
  if (u > 1.2) {
    textC('我是艾伦 · 遛狗去了', 320, 186, M(8), 1);
  }
  hud('白了个白', 'THAT IS ALL');
}
