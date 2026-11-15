// ================================================================== s26 1994 航天飞机扫描 103.70–108.10
function radarSweep(cx, cy, ang, r) {
  for (let k = 0; k < 30; k++) {
    const a = ang - k * 0.022;
    line(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, k < 2 ? M(8) : k < 8 ? M(23) : M(21));
  }
}
function shot26(t, f) {
  const u = t - 103.70;
  mapBackdrop(f);
  mapPanel();
  mapLand(f);
  mapBasin(1.02, BS_SAND, f);
  mapRivers({});
  mapCoast(M(23));
  // 雷达网格
  const cx = MAPX + 270, cy = MAPY + 130;
  for (let r = 50; r <= 300; r += 52) ring(cx, cy, r, M(21));
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * 6.283;
    dottedLine(cx, cy, cx + Math.cos(a) * 300, cy + Math.sin(a) * 300, M(21), 6);
  }
  // 扫描
  radarSweep(cx, cy, u * 2.2 + 0.6, 320);
  halo(Math.round(cx + Math.cos(u * 2.2 + 0.6) * 120), Math.round(cy + Math.sin(u * 2.2 + 0.6) * 120), 70, 70, R_TEAL, 0.5, 2.0);
  // 四条河的高亮
  for (const [x, y] of [[40, 4], [70, 0], [100, 0], [128, 6]]) {
    px(MAPX + x, MAPY + y, M(8));
    ring(MAPX + x, MAPY + y, 4 + (Math.round(t * 3) % 5), M(23));
  }
  text('四条大河', MAPX + 20, MAPY - 26, M(15), 1);
  if (u > 0.5) {
    stampBox('1994', 470, 40, M(19), 1);
    text('航天飞机雷达扫描', 430, 76, M(8), 1);
  }
  if (u > 2.2) {
    chip('下面有四条古河道', 84, 296 - 8, M(15), M(0), M(23));
  }
  hud('扫描', 'THE SHUTTLE SCAN');
}

// ================================================================== s27 四条大河 四面环山 108.10–113.20
function mountainRing(c, hh) {
  for (let i = 0; i < BASIN_PTS.length; i++) {
    const [x, y] = BASIN_PTS[i];
    const dx = x - SEA_CX, dy = y - SEA_CY, d = Math.hypot(dx, dy) || 1;
    const ox = MAPX + x + (dx / d) * 16, oy = MAPY + y + (dy / d) * 16;
    const peak = 6 + Math.round(hash(i, 211) * hh);
    poly([[ox - 7, oy], [ox, oy - peak], [ox + 7, oy]], c);
    px(Math.round(ox), oy - peak, M(8));
  }
}
function shot27(t, f) {
  const u = t - 108.10;
  mapBackdrop(f);
  mapPanel();
  mapLand(f);
  mapBasin(1.02, BS_GREEN, f);
  mapRivers({ dry: [0, 3] });
  mapCoast(M(15));
  mapBahrain(M(30));
  mountainRing(M(12), 10);
  // 河道状态
  if (u > 0.5) { text('两条今天还在', MAPX + 30, MAPY - 30, M(23), 1); }
  if (u > 1.3) { text('两条早干了', MAPX + 120, MAPY - 30, M(19), 1); }
  // 四面环山
  if (u > 2.0) {
    for (const [zh, lx, ly] of [['扎格罗斯山', 300, 30], ['阿拉伯地盾', 160, 246]]) {
      text(zh, MAPX + lx, MAPY + ly, M(8), 1);
    }
  }
  // 伊甸园
  if (u > 2.9) {
    const k = clamp((u - 2.9) / 0.5, 0, 1);
    halo(MAPX + 240, MAPY + 150, 120, 80, R_GOLD, 0.7 * k, 2.0);
    textSC('伊甸园', MAPX + 240, MAPY + 120, M(15), 3);
    textC('EDEN', MAPX + 240, MAPY + 165, M(16), 1);
    textC('四条大河 · 四面环山', MAPX + 240, MAPY + 178, M(8), 1);
  }
  hud('伊甸园', 'EDEN');
}

// ================================================================== s28 怎么灌没的 113.20–116.20
function shot28(t, f) {
  const u = t - 113.20;
  skyBand(-10, 130, M(1), M(24));
  skyBand(130, 200, M(24), M(14));
  halo(420, 196, 300, 150, R_WARM, 0.7, 2.2);
  disc(420, 200, 22, M(15));
  // 远山
  for (let i = 0; i < 14; i++) {
    const x = -10 + i * 48, hh = 20 + Math.round(hash(i, 221) * 26);
    poly([[x, 206], [x + 24, 206 - hh], [x + 48, 206]], M(11));
    px(x + 24, 206 - hh, M(13));
  }
  // 绿洲
  rect(-10, 206, 660, 100, M(30));
  for (let y = 208; y < 300; y += 7) {
    for (let x = -10; x < 650; x += 5) if (hash(x, y) < 0.3) px(x, y, hash(x + 1, y) < 0.5 ? M(22) : M(21));
  }
  // 河
  const riv = [[130, 302], [200, 266], [182, 232], [240, 214], [318, 208]];
  polyPath(riv, M(22), false, 0, 1);
  polyPath(riv.map(([x, y]) => [x, y + 2]), M(23), false, 0, 1);
  palm(96, 262, 48, t, 21); palm(150, 250, 40, t, 22); palm(286, 236, 52, t, 23);
  palm(360, 244, 44, t, 24); palm(500, 262, 46, t, 25);
  // 家
  houseHut(250, 254, 40, 32, M(12), M(11));
  houseHut(430, 268, 34, 28, M(12), M(11));
  // 水位线开始上涨
  const lvl = Math.round(lerp(320, 258, clamp((u - 0.7) / 2.2, 0, 1)));
  for (let y = lvl; y < H; y++) {
    const depth = (y - lvl) / 60;
    for (let x = -10; x < 650; x++) if (bay(x, y) < 0.5 + depth * 0.5) px(x, y, depth < 0.15 ? M(22) : M(21));
  }
  for (let x = -10; x < 650; x += 2) px(x, lvl + Math.round(Math.sin(x * 0.06 + t * 3) * 2), M(28));
  // 问句
  if (u > 0.9) textC('那么大一片绿洲，怎么灌没的？', 320, 40, M(8), 1);
  hud('灌没', 'SWALLOWED');
}

// ================================================================== s29 罗斯接手 116.20–122.90
function shot29(t, f) {
  const u = t - 116.20;
  roomWall(M(9), M(10), 26);
  halo(120, 220, 220, 170, R_WARM, 0.55, 2.0);
  // 白板
  rect(250, 40, 330, 210, M(0));
  rect(254, 44, 322, 202, M(26));
  cornerFrame(250, 40, 330, 210, M(8), 12);
  // 地球 + 冰盖
  const gx = 340, gy = 130, gr = 52;
  disc(gx, gy, gr, M(22));
  for (let j = -gr; j <= gr; j++) for (let i = -gr; i <= gr; i++) {
    if (i * i + j * j > gr * gr) continue;
    if (hash(gx + i, gy + j) < 0.16) px(gx + i, gy + j, M(23));
  }
  ellipse(gx, gy, gr - 2, gr - 2, M(8));
  // 冰盖
  rect(gx - 34, gy - gr + 6, 68, 16, M(8));
  rect(gx - 28, gy - gr + 2, 56, 6, M(7));
  rect(gx - 22, gy + gr - 22, 44, 14, M(8));
  text('冰盖', gx + 40, gy - gr + 6, M(8), 1);
  // 温度曲线
  hline(430, 200, 130, M(27)); vline(430, 60, 140, M(27));
  const CUR = [[432, 120], [460, 110], [486, 128], [512, 96], [540, 118], [558, 74]];
  polyPath(CUR, M(19), false, 0, clamp((u - 0.6) / 1.6, 0, 1));
  text('温度', 432, 52, M(27), 1);
  // 学者
  poly([[96, 300], [108, 214], [130, 186], [156, 178], [180, 190], [192, 220], [196, 300]], M(1));
  disc(152, 166, 17, M(1));
  arc(152, 166, 17, -2.7, 0.1, M(13));
  // 台灯
  rect(60, 292, 120, 8, M(11));
  vline(74, 244, 48, M(10));
  poly([[60, 244], [88, 244], [80, 232], [68, 232]], M(14));
  fire(74, 240, t, 1, 9);
  halo(74, 248, 70, 56, R_GOLD, 0.55, 2.0);
  // 名牌
  if (u > 0.3) {
    const k = clamp((u - 0.3) / 0.3, 0, 1);
    textSC('2010', 470, 46, M(15), 2);
    text('罗斯 接手这案子', 430, 270, M(8), 1);
    if (k < 1) for (let s = 0; s < 30; s++) px(430 + Math.round(hash(s, 91) * 140), 240 + Math.round(hash(s, 93) * 46), M(8));
    // 反常识
    chip('反常识', 470, 240, M(15), M(0), M(19));
  }
  // 结论
  if (u > 2.2) {
    heading('我们还活在冰河期里', 'WE ARE STILL IN AN ICE AGE', 300, clamp((u - 2.2) / 0.4, 0, 1));
  }
  hud('罗斯', 'THE COLD CASE, REOPENED');
}

// ================================================================== s30 45亿年 122.90–130.40
function shot30(t, f) {
  const u = t - 122.90;
  skyBand(-10, H, M(1), M(2));
  halo(320, 60, 380, 120, R_GOLD, 0.36, 2.2);
  // 名称
  text('地球 45 亿年', 60, 34, M(8), 2);
  text('4.5 BILLION YEARS', 60, 58, M(26), 1);
  // 时间条
  const bx = 60, by = 84, bw = 520, bh = 30;
  rect(bx, by, bw, bh, M(2));
  const icy = Math.round(bw * 0.10);
  rect(bx + bw - icy, by, icy, bh, M(8));
  rect(bx + bw - icy - 10, by, 10, bh, M(6));
  hline(bx, by, bw, M(26)); hline(bx, by + bh - 1, bw, M(26));
  // 90% 标尺
  if (u > 0.4) {
    const k = clamp((u - 0.4) / 1.2, 0, 1);
    hline(bx, by + bh + 10, Math.round((bw - icy) * k), M(19));
    text('90% 的时间，地球没有冰盖', 60, by + bh + 16, M(8), 1);
    text('NO ICE', bx + bw - icy + 2, by + bh + 16, M(8), 1);
  }
  // 冰盖 = 水银行
  if (u > 1.8) {
    const vx = 120, vy = 200;
    rect(vx - 6, vy - 6, 132, 128, M(0));
    rect(vx, vy, 120, 116, M(13));
    disc(vx + 60, vy + 52, 38, M(14));
    disc(vx + 60, vy + 52, 32, M(12));
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * 6.283 + t * 0.3;
      thickLine(vx + 60 + Math.cos(a) * 10, vy + 52 + Math.sin(a) * 10, vx + 60 + Math.cos(a) * 28, vy + 52 + Math.sin(a) * 28, 1, M(15));
    }
    disc(vx + 60, vy + 52, 6, M(15));
    text('冰盖', vx + 8, vy + 8, M(8), 1);
    text('地球的水银行', vx + 8, vy + 100, M(15), 1);
    text('THE WATER BANK', vx + 8, vy + 112 - 4, M(26), 1);
  }
  // 海平面量筒
  if (u > 3.2) {
    const gx = 380, gy0 = 190, gh = 120;
    rect(gx - 16, gy0, 44, gh, M(0));
    rect(gx - 12, gy0 + 2, 36, gh - 4, M(1));
    const v = clamp(0.25 + 0.55 * Math.abs(Math.sin(t * 0.8)), 0.1, 0.9);
    rect(gx - 12, gy0 + 2 + Math.round((gh - 4) * (1 - v)), 36, Math.round((gh - 4) * v), M(22));
    for (let i = 0; i <= 6; i++) hline(gx - 12, gy0 + 2 + i * ((gh - 4) / 6), 6, M(27));
    text('海平面', gx - 16, gy0 - 16, M(8), 1);
    // 冰越厚 海越低
    text('冰越厚 → 海越低', 448, 208, M(15), 1);
    text('THICKER ICE, LOWER SEA', 448, 224, M(26), 1);
    arrow(470, 250, 470, 300, M(19), 1, 8);
  }
  hud('冰河期', 'THE ICE AGE');
}

// ================================================================== s31 末次冰盛期 130.40–137.10
function shot31(t, f) {
  const u = t - 130.40;
  skyBand(-10, H, M(1), M(2));
  halo(300, 120, 340, 160, R_COLD, 0.5, 2.2);
  // 北美大陆（抽象）
  poly([[130, 240], [110, 180], [130, 120], [200, 92], [300, 88], [410, 100], [470, 140],
    [486, 200], [450, 250], [360, 274], [260, 268], [180, 262]], M(12));
  polyLine([[130, 240], [110, 180], [130, 120], [200, 92], [300, 88], [410, 100], [470, 140],
    [486, 200], [450, 250], [360, 274], [260, 268], [180, 262]], M(13), true);
  text('北美', 176, 200, M(8), 1);
  // 冰盖穹顶
  const DOME = [[170, 240], [190, 170], [230, 130], [300, 116], [380, 124], [430, 158], [452, 220], [400, 246], [300, 252], [220, 250]];
  poly(DOME, M(8));
  poly([[170, 240], [190, 170], [230, 130], [300, 116], [380, 124], [400, 150], [330, 160], [250, 180], [200, 220]], M(7));
  for (let y = 120; y < 250; y += 8) for (let x = 170; x < 452; x += 8) {
    if (inPoly(x, y, DOME) && hash(x, y) < 0.12) px(x, y, M(6));
  }
  text('劳伦泰德冰盖', 236, 108, M(1), 1);
  text('LAURENTIDE ICE SHEET', 236, 122 - 4, M(1), 1);
  // 3 公里厚
  if (u > 0.6) {
    const k = clamp((u - 0.6) / 0.5, 0, 1);
    vline(500, 116, 130, M(15));
    hline(494, 116, 12, M(15)); hline(494, 246, 12, M(15));
    text('3 km', 508, 172, M(15), 1);
    rect(494, 170, 12, Math.round(40 * k), M(8));
  }
  // 海平面低 120 米
  if (u > 1.8) {
    const k = clamp((u - 1.8) / 0.8, 0, 1);
    text('海平面', 40, 40, M(8), 1);
    const gy0 = 60, gy1 = 250;
    vline(52, gy0, gy1 - gy0, M(27));
    hline(46, gy0, 12, M(27));
    const now = gy0;
    const low = Math.round(lerp(gy0, gy1, k));
    hline(46, now, 12, M(23));
    text('今天', 68, now - 6, M(23), 1);
    hline(46, low, 12, M(19));
    text('−120 m', 68, low - 6, M(19), 1);
    // 水位差
    for (let y = now; y < low; y += 4) px(56, y, M(19));
    rect(30, low, 60, 4, M(20));
  }
  if (u > 2.4) chip('末次冰盛期 · 一万多年前', 180, 292, M(15), M(0), M(23));
  hud('冰盛期', 'LAST GLACIAL MAXIMUM');
}

// ================================================================== s32 平均水深 35 米 137.10–140.40
function shot32(t, f) {
  const u = t - 137.10;
  skyBand(-10, H, M(1), M(2));
  halo(320, 60, 380, 110, R_TEAL, 0.42, 2.2);
  text('波斯湾', 60, 34, M(8), 2);
  text('PERSIAN GULF', 60, 58, M(26), 1);
  // 剖面
  const ySea = 120;
  rect(60, ySea, 520, 18, M(22));
  for (let x = 60; x < 580; x += 3) px(x, ySea + 1, M(23));
  // 海底碗
  const FLOOR = [[60, ySea + 18], [140, ySea + 34], [260, ySea + 42], [380, ySea + 44], [500, ySea + 34], [580, ySea + 16]];
  poly([...FLOOR, [580, 300], [60, 300]], M(12));
  polyLine(FLOOR, M(13), false);
  for (let i = 0; i < FLOOR.length - 1; i++) for (let s = 0; s < 12; s++) {
    const k = s / 12;
    px(Math.round(lerp(FLOOR[i][0], FLOOR[i + 1][0], k)), Math.round(lerp(FLOOR[i][1], FLOOR[i + 1][1], k) + 4 + (s & 1) * 3), M(11));
  }
  // 35 米标尺
  const mk = 320;
  vline(mk, ySea + 18, 26, M(15));
  hline(mk - 6, ySea + 18, 12, M(15)); hline(mk - 6, ySea + 44, 12, M(15));
  text('35 m', mk + 10, ySea + 24, M(15), 1);
  // 120 米：比海深得多
  if (u > 0.9) {
    const k = clamp((u - 0.9) / 0.8, 0, 1);
    const gy0 = ySea, gh = Math.round(210 * k);
    vline(540, gy0, gh, M(19));
    hline(534, gy0, 12, M(19)); hline(534, gy0 + gh, 12, M(19));
    text('−120 m', 552, gy0 + gh - 6, M(19), 1);
    rect(534, ySea + 18, 12, Math.min(gh, 244) - 18, M(19));
  }
  if (u > 1.6) {
    textC('比平均水深还深三倍多', 320, 300 - 34, M(8), 1);
    textC('MEAN DEPTH: ONLY 35 m', 320, 276, M(26), 1);
  }
  hud('水深', 'DEPTH');
}

// ================================================================== s33 裸露的陆地 140.40–145.90
function shot33(t, f) {
  const u = t - 140.40;
  mapBackdrop(f);
  mapPanel();
  mapLand(f);
  mapBasin(0, BS_GREEN, f);
  mapRivers({});
  mapCoast(M(15));
  // 干燥的盆地
  if (u > 0.4) text('一大块裸露的陆地', MAPX + 150, MAPY + 22, M(8), 1);
  if (u > 1.2) {
    halo(MAPX + 240, MAPY + 150, 150, 90, R_GOLD, 0.35, 2.0);
    textC('面积顶六七个台湾', MAPX + 240, MAPY + 150, M(15), 1);
  }
  // 台湾 x7
  if (u > 2.2) {
    const tx = 460, ty = 214;
    for (let i = 0; i < 7; i++) {
      const k = clamp((u - 2.2 - i * 0.08) / 0.2, 0, 1);
      if (k <= 0) continue;
      const x = tx + i * 22, y = ty + (i & 1) * 4;
      poly([[x, y], [x + 7, y - 3], [x + 12, y + 8], [x + 8, y + 20], [x + 2, y + 16], [x - 2, y + 6]], M(30));
      polyLine([[x, y], [x + 7, y - 3], [x + 12, y + 8], [x + 8, y + 20], [x + 2, y + 16], [x - 2, y + 6]], M(8), true);
    }
    text('台湾 ×7', tx - 2, ty + 30, M(15), 1);
  }
  hud('陆地', 'DRY LAND');
}

// ================================================================== s34 泉水 145.90–150.30
function shot34(t, f) {
  const u = t - 145.90;
  skyBand(-10, H, M(1), M(2));
  halo(320, 190, 400, 130, R_TEAL, 0.5, 2.2);
  // 两侧高原
  poly([[-10, 200], [60, 160], [130, 150], [160, 200]], M(12));
  poly([[480, 200], [520, 148], [600, 140], [650, 196]], M(12));
  poly([[-10, 200], [60, 160], [130, 150], [128, 176], [60, 184]], M(13));
  poly([[480, 200], [520, 148], [650, 196], [610, 196], [540, 176]], M(13));
  text('高原', 40, 176, M(8), 1);
  text('高原', 570, 170, M(8), 1);
  // 碳酸盐岩层
  rect(-10, 200, 660, 26, M(14));
  for (let y = 200; y < 226; y += 6) for (let x = -10; x < 650; x += 9) {
    px(x + (y & 6), y, M(13));
  }
  text('碳酸盐岩', 240, 204, M(1), 1);
  // 含水层
  const AQ = [[130, 226], [480, 226], [520, 266], [110, 266]];
  poly(AQ, M(22));
  for (let y = 228; y < 264; y += 4) for (let x = 120; x < 520; x += 6) if (hash(x, y) < 0.35) px(x, y, M(23));
  text('地下水', 270, 238, M(8), 1);
  // 泉眼
  const springs = [170, 250, 330, 410, 452];
  springs.forEach((sx, i) => {
    const ph = (t * 0.8 + i * 0.3) % 1;
    for (let k = 0; k < 10; k++) {
      const kk = (k / 10 + t * 0.5 + i * 0.17) % 1;
      const bx = sx + Math.round(Math.sin(kk * 8 + i) * 3);
      const by = 200 - Math.round(kk * 60);
      px(bx, by, kk < 0.4 ? M(8) : kk < 0.7 ? M(23) : M(22));
    }
    halo(sx, 180, 26, 34, R_TEAL, 0.5, 1.8);
    rect(sx - 5, 196, 10, 6, M(23));
  });
  // 挤压箭头
  if (u > 0.8) {
    arrow(80, 236, 130, 236, M(19), 1, 7);
    arrow(580, 236, 520, 236, M(19), 1, 7);
    textC('地下水被挤成泉眼', 320, 292 - 20, M(8), 1);
  }
  hud('泉眼', 'SPRINGS');
}

// ================================================================== s35 巴林 = 两片海 150.30–156.30
function shot35(t, f) {
  const u = t - 150.30;
  skyBand(-10, 90, M(1), M(2));
  halo(320, 200, 360, 140, R_GOLD, 0.55, 2.2);
  // 两片海
  seaBand(120, 220, t, M(21), M(22), 4);
  hline(-10, 120, 660, M(23));
  text('一头是湾', 60, 100, M(8), 1);
  text('另一头也是海', 470, 100, M(8), 1);
  // 岛
  poly([[240, 226], [280, 196], [360, 190], [416, 206], [430, 232], [380, 242], [300, 240], [250, 236]], M(12));
  poly([[240, 226], [280, 196], [360, 190], [416, 206], [380, 210], [300, 212], [250, 218]], M(13));
  palm(300, 216, 44, t, 31); palm(350, 210, 52, t, 32);
  // 淡水泉
  for (let i = 0; i < 24; i++) {
    const sx = 260 + Math.floor(hash(i, 41) * 130);
    const kk = (t * 0.6 + hash(i, 43)) % 1;
    px(sx, 236 - Math.round(kk * 60), kk < 0.5 ? M(8) : M(23));
  }
  text('淡水不缺', 260, 250, M(8), 1);
  // 大河汇入
  if (u > 0.8) {
    for (let i = 0; i < 3; i++) {
      const k = clamp((u - 0.8 - i * 0.2) / 0.6, 0, 1);
      if (k <= 0) continue;
      polyPath([[120 + i * 50, 300], [180 + i * 40, 268], [250 + i * 20, 240]], M(22), false, 0, k);
    }
    text('大河汇入', 120, 288, M(15), 1);
  }
  if (u > 2.0) {
    heading('巴林 = 两片海', 'BAHRAIN: TWO SEAS', 36, clamp((u - 2.0) / 0.4, 0, 1));
    textC('这地方过去真是片绿洲', 320, 296 - 12, M(8), 1);
  }
  hud('两片海', 'TWO SEAS');
}
