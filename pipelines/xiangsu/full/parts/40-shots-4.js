// ================================================================== s36 新仙女木事件 156.30–159.50
function shot36(t, f) {
  const u = t - 156.30;
  skyBand(-10, H, M(2), M(3));
  halo(430, 200, 260, 150, R_COLD, 0.70, 2.0);
  // 温度曲线
  hline(70, 250, 500, M(27)); vline(70, 60, 190, M(27));
  text('温度', 74, 50, M(27), 1);
  const CUR = [[72, 130], [120, 124], [170, 136], [220, 120], [270, 126], [300, 96], [330, 210], [380, 224], [430, 236], [480, 246], [560, 250]];
  polyPath(CUR, M(15), false, 0, clamp((u - 0.2) / 1.4, 0, 1));
  // 事件标记
  if (u > 0.5) {
    const k = clamp((u - 0.5) / 0.3, 0, 1);
    const mx = 330;
    vline(mx, 60, 200, M(19));
    disc(mx, 96, 5, M(19));
    text('12,900 年前', mx + 10, 62, M(19), 1);
    text('新仙女木事件', mx + 10, 76, M(8), 1);
    text('YOUNGER DRYAS', mx + 10, 90, M(26), 1);
    if (k < 1) for (let s = 0; s < 40; s++) px(mx - 20 + Math.round(hash(s, 101) * 60), 60 + Math.round(hash(s, 103) * 40), M(8));
  }
  // 骤降
  if (u > 1.1) {
    arrow(360, 200, 430, 236, M(19), 1, 8);
    text('气温骤降', 396, 190, M(19), 1);
  }
  // 雪
  for (let i = 0; i < 70; i++) {
    const sx = ((hash(i, 111) * 700 + t * 12) % 700) - 30;
    const sy = ((hash(i, 113) * 380 + t * 34) % 380) - 20;
    px(Math.round(sx), Math.round(sy), hash(i, 115) < 0.25 ? M(8) : M(6));
  }
  hud('新仙女木', 'YOUNGER DRYAS');
}

// ================================================================== s37 冰湖溃坝 159.50–165.40
function shot37(t, f) {
  const u = t - 159.50;
  skyBand(-10, H, M(1), M(2));
  // 北美
  poly([[20, 90], [90, 60], [180, 66], [230, 96], [240, 190], [190, 240], [100, 250], [40, 210], [16, 150]], M(12));
  polyLine([[20, 90], [90, 60], [180, 66], [230, 96], [240, 190], [190, 240], [100, 250], [40, 210], [16, 150]], M(13), true);
  text('北美', 60, 176, M(8), 1);
  // 冰湖
  poly([[60, 110], [130, 96], [196, 110], [206, 160], [166, 196], [100, 190], [62, 160]], M(8));
  poly([[60, 110], [130, 96], [196, 110], [160, 130], [100, 128]], M(7));
  text('阿加西兹冰湖', 70, 148, M(1), 1);
  // 坝体
  const damX = 232;
  rect(damX, 96, 16, 130, M(6));
  for (let y = 100; y < 222; y += 8) hline(damX, y, 16, M(8));
  // 裂缝
  if (u > 0.7) {
    const k = clamp((u - 0.7) / 0.9, 0, 1);
    for (let i = 0; i < 14; i++) px(damX + 8 + Math.round(Math.sin(i * 1.7) * 4), 100 + i * 9, M(1));
    // 溃口
    rect(damX + 2, 150 - Math.round(20 * k), 12, Math.round(40 * k), M(1));
    // 水冲出
    for (let i = 0; i < 60; i++) {
      const sp = 20 + hash(i, 121) * 80, dt = k * 1.2;
      const xx = damX + 12 + Math.cos(-0.5 + hash(i, 123) * 1.0) * sp * dt;
      const yy = 158 + Math.sin(-0.5 + hash(i, 123) * 1.0) * sp * dt;
      px(Math.round(xx), Math.round(yy), hash(i, 125) < 0.4 ? M(8) : M(23));
    }
    halo(damX + 40, 160, 70, 46, R_TEAL, 0.6, 2.0);
  }
  // 大西洋
  poly([[250, 40], [650, 30], [650, 300], [250, 300]], M(21));
  for (let i = 0; i < 60; i++) {
    const x = 260 + Math.floor(hash(i, 131) * 380), y = 50 + Math.floor(hash(i, 133) * 240);
    px(x, y, hash(i, 135) < 0.3 ? M(23) : M(22));
  }
  text('大西洋', 560, 60, M(8), 1);
  // 温盐环流
  if (u > 1.5) {
    const k = clamp((u - 1.5) / 1.2, 0, 1);
    const LOOP = [[300, 90], [420, 74], [540, 96], [590, 160], [540, 226], [420, 246], [316, 220]];
    if (k < 1) polyPath(LOOP, M(19), true, 0, k);
    else {
      // 断掉的环流
      LOOP.forEach(([x, y], i) => { if ((i & 1) === 0) px(x, y, M(19)); });
      px(420, 74, M(8)); px(420, 74, M(8));
      text('环流被掐断', 400, 40, M(19), 1);
      px(414, 68, M(19)); px(426, 80, M(19)); px(414, 80, M(19)); px(426, 68, M(19));
    }
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.5 + i / 3) % 1;
      if (k < 1) { const [lx, ly] = pathAt(LOOP, ph); disc(Math.round(lx), Math.round(ly), 3, M(15)); }
    }
  }
  // 温度计
  rect(600, 50, 10, 150, M(0));
  rect(602, 52, 6, 146, M(2));
  const th = Math.round(lerp(60, 120, clamp((u - 1.0) / 2.0, 0, 1)));
  rect(602, 52, 6, th, M(19));
  disc(607, 205, 10, M(0)); disc(607, 205, 8, M(19));
  text('−', 582, 130, M(19), 2);
  hud('溃坝', 'THE DAM BURSTS');
}

// ================================================================== s38 往绿洲跑 165.40–171.10
function shot38(t, f) {
  const u = t - 165.40;
  skyBand(-10, 170, M(1), M(24));
  skyBand(170, 230, M(24), M(14));
  halo(120, 120, 220, 130, R_GOLD, 0.65, 2.1);
  disc(120, 120, 20, M(15));
  // 沙漠
  rect(-10, 230, 660, 130, M(13));
  for (let i = 0; i < 9; i++) {
    const y = 236 + i * 11, x0 = (i & 1) ? -20 : 20;
    for (let x = x0; x < 660; x += 1) {
      const yy = y + Math.round(Math.sin(x * 0.021 + i) * 5);
      if ((x + i) % 2 === 0) px(x, yy, M(12));
    }
  }
  // 裂开的土
  for (let i = 0; i < 26; i++) {
    const sx = Math.floor(hash(i, 141) * 640), sy = 250 + Math.floor(hash(i, 143) * 100);
    const ex = sx + Math.round((hash(i, 145) - 0.5) * 40), ey = sy + Math.round((hash(i, 147) - 0.5) * 20);
    line(sx, sy, ex, ey, M(10));
  }
  // 绿洲
  const ox = 486, oy = 262;
  halo(ox, oy - 24, 92, 70, R_GOLD, 0.6, 2.0);
  poly([[ox - 66, oy + 10], [ox - 40, oy - 6], [ox + 30, oy - 10], [ox + 62, oy + 4], [ox + 50, oy + 22], [ox - 50, oy + 22]], M(30));
  ellipse(ox, oy + 4, 40, 12, M(22));
  palm(ox - 30, oy - 4, 52, t, 41); palm(ox, oy - 8, 60, t, 42); palm(ox + 30, oy - 2, 46, t, 43);
  text('还有水的地方', ox - 40, oy + 26, M(8), 1);
  // 四面八方的人
  const DIRS = [[40, 300], [90, 250], [250, 320], [400, 320], [220, 240], [350, 252]];
  DIRS.forEach(([sx, sy], i) => {
    const k = clamp((u - 1.0 - i * 0.12) / 1.6, 0, 1);
    if (k <= 0) return;
    const ex = lerp(sx, ox - 60, k), ey = lerp(sy, oy + 6, k);
    dottedLine(sx, sy, ex, ey, M(19), 5);
    tinyPerson(Math.round(ex), Math.round(ey), 1.0, M(1));
    px(Math.round(ex) + 2, Math.round(ey) - 24, M(15));
  });
  if (u > 0.4) text('沙漠越来越干', 40, 40, M(8), 1);
  if (u > 2.2) chip('全部往波斯湾绿洲跑', 120, 60, M(15), M(0), M(19));
  hud('逃向绿洲', 'TO THE OASIS');
}

// ================================================================== s39 炼丹 171.10–176.80
function shot39(t, f) {
  const u = t - 171.10;
  skyBand(-10, H, M(1), M(2));
  halo(320, 230, 320, 190, R_GOLD, 0.62, 2.1);
  // 坩埚
  const cx = 320, cy = 236;
  poly([[cx - 90, cy - 60], [cx + 90, cy - 60], [cx + 66, cy + 40], [cx - 66, cy + 40]], M(12));
  poly([[cx - 90, cy - 60], [cx + 90, cy - 60], [cx + 84, cy - 44], [cx - 84, cy - 44]], M(14));
  for (let i = 0; i < 9; i++) vline(cx - 80 + i * 20, cy - 56, 90, M(11));
  ellipse(cx, cy - 58, 88, 10, M(16));
  ellipse(cx, cy - 58, 78, 7, M(29));
  // 火
  fire(cx - 46, cy + 44, t, 1.2, 3);
  fire(cx, cy + 44, t, 1.5, 4);
  fire(cx + 46, cy + 44, t, 1.2, 5);
  // 咕嘟
  for (let i = 0; i < 14; i++) {
    const kk = (t * 0.4 + hash(i, 151)) % 1;
    const bx = cx - 70 + Math.floor(hash(i, 153) * 140);
    px(bx, cy - 58 - Math.round(kk * 40), kk < 0.5 ? M(15) : M(29));
  }
  // 四面的技术在往里倒
  const TECH = [['wheel', -1, 0], ['star', 1, 0], ['gear', -1, 1], ['tablet', 1, 1], ['boat', -1, 2], ['wheat', 1, 2]];
  TECH.forEach(([kind, side, row], i) => {
    const at = 0.35 + i * 0.22;
    if (u < at) return;
    const k = clamp((u - at) / 0.9, 0, 1);
    const sx = side < 0 ? 60 : 580, sy = 60 + row * 64;
    const ex = lerp(sx, cx + side * 40, k), ey = lerp(sy, cy - 70, k);
    icon(kind, Math.round(ex), Math.round(ey), 1.2, k < 1 ? M(29) : M(15), M(22));
  });
  // 出丹
  if (u > 3.3) {
    const k = clamp((u - 3.3) / 0.6, 0, 1);
    halo(cx, cy - 90, 90, 70, R_GOLD, k, 1.8);
    textSC('前文明', cx, cy - 130, M(15), 3);
    textC('PRECURSOR CIVILIZATION', cx, cy - 96, M(16), 1);
  }
  if (u > 1.2) text('四面八方的最强者', 40, 40, M(8), 1);
  if (u > 2.2) text('带着各部族的顶尖技术凑一块儿', 40, 58, M(8), 1);
  hud('炼丹', 'ALCHEMY');
}

// ================================================================== s40 8200 冰湖绷不住了 176.80–180.30
function shot40(t, f) {
  const u = t - 176.80;
  skyBand(-10, H, M(1), M(2));
  halo(300, 120, 380, 170, R_COLD, 0.55, 2.1);
  // 冰湖
  poly([[60, 50], [300, 40], [520, 56], [540, 150], [500, 230], [260, 246], [80, 220], [40, 140]], M(8));
  poly([[60, 50], [300, 40], [520, 56], [420, 90], [280, 84], [140, 96]], M(7));
  for (let i = 0; i < 10; i++) { const y = 70 + i * 16; hline(80, y, 430 - i * 10, M(6)); }
  text('超级冰湖', 200, 60, M(1), 2);
  // 坝
  rect(300, 246, 260, 60, M(6));
  for (let y = 250; y < 300; y += 10) hline(300, y, 260, M(8));
  // 裂缝
  const k = clamp((u - 0.5) / 2.0, 0, 1);
  if (k > 0) {
    for (let i = 0; i < 16; i++) {
      const yy = 246 + i * 4;
      px(300 + 120 + Math.round(Math.sin(i * 2.2) * (4 + k * 14)), yy, M(1));
    }
    // 喷出的水
    for (let i = 0; i < 90; i++) {
      const a = -1.4 + hash(i, 161) * 2.8;
      const sp = 30 + hash(i, 163) * 90, dt = k * 1.4;
      const xx = 420 + Math.cos(a) * sp * dt, yy = 262 + Math.sin(a) * sp * dt;
      if (yy > 246) px(Math.round(xx), Math.round(yy), hash(i, 165) < 0.4 ? M(8) : M(23));
    }
    halo(420, 250, 120, 60, R_TEAL, 0.5 * k, 2.0);
  }
  // 日期
  const kk = clamp((u - 0.3) / 0.4, 0, 1);
  textSC('8200', 470, 40, M(19), 3);
  text('年以后', 508, 44, M(19), 1);
  if (u > 1.6) textC('那个超级冰湖终于绷不住了', 320, 300 - 26, M(8), 1);
  if (kk < 1) for (let s = 0; s < 50; s++) px(400 + Math.round(hash(s, 171) * 120), 34 + Math.round(hash(s, 173) * 60), M(8));
  hud('绷不住了', 'THE BREAK');
}

// ================================================================== s41 78 倍 180.30–186.20
function shot41(t, f) {
  const u = t - 180.30;
  skyBand(-10, H, M(1), M(2));
  halo(200, 120, 300, 160, R_TEAL, 0.45, 2.1);
  // 两根柱子
  const base = 280;
  rect(120, 230, 90, 50, M(22));
  hline(120, 230, 90, M(23));
  textC('米苏拉湖', 165, 286, M(8), 1);
  textC('1×', 165, 214, M(15), 2);
  const h2 = 236;
  rect(270, base - h2, 90, h2, M(22));
  rect(272, base - h2, 86, 20, M(23));
  for (let y = base - h2 + 20; y < base; y += 18) hline(272, y, 86, M(21));
  textC('超级冰湖', 315, 286, M(8), 1);
  if (u > 0.6) {
    const k = clamp((u - 0.6) / 0.8, 0, 1);
    textSC('78×', 315, base - h2 - 44 + Math.round((1 - k) * 20), M(15), 4);
    arrow(240, 262, 270, 262, M(19), 1, 7);
  }
  // 中国 17 米
  if (u > 2.0) {
    const k = clamp((u - 2.0) / 0.7, 0, 1);
    // 地图形状
    poly([[420, 180], [470, 160], [520, 172], [560, 150], [600, 166], [596, 240], [540, 256], [470, 250], [430, 232], [410, 200]], M(12));
    polyLine([[420, 180], [470, 160], [520, 172], [560, 150], [600, 166], [596, 240], [540, 256], [470, 250], [430, 232], [410, 200]], M(13), true);
    // 水柱 17 m
    const wl = 200, hh = Math.round(40 * k);
    rect(420, wl - hh, 180, hh, M(22));
    for (let y = wl - hh; y < wl; y += 3) hline(420, y, 180, M(23));
    hline(420, wl - hh, 180, M(8));
    vline(606, wl - hh, hh, M(15));
    hline(600, wl - hh, 12, M(15)); hline(600, wl, 12, M(15));
    text('17 m', 612, wl - hh + 2, M(15), 1);
    text('能把整个中国淹上 17 米', 40, 300 - 32, M(8), 1);
  }
  hud('水量', 'SEVENTY-EIGHT TIMES');
}

// ================================================================== s42 海水倒灌 186.20–192.80
function shot42(t, f) {
  const u = t - 186.20;
  const front = clamp((u - 0.5) / 4.4, 0, 1) * 1.02;
  mapBackdrop(f);
  mapPanel();
  mapLand(f);
  mapBasin(front, BS_GREEN, f);
  mapRivers({});
  mapCoast(M(23));
  // 霍尔木兹的山：被冲垮
  const mx = MAPX + 458, my = MAPY + 238;
  mountainRing(M(12), 6);
  if (u < 2.6) {
    for (let i = 0; i < 5; i++) {
      const ox = mx - 24 + i * 12;
      poly([[ox - 7, my], [ox, my - 12 - (i & 1) * 5], [ox + 7, my]], M(12));
      px(ox, my - 12 - (i & 1) * 5, M(8));
    }
    text('基什山', mx - 72, my + 8, M(8), 1);
  } else {
    // 崩塌
    for (let i = 0; i < 14; i++) {
      const ox = mx - 40 + Math.floor(hash(i, 181) * 80);
      const oy = my - 4 + Math.floor(hash(i, 183) * 14);
      rect(ox, oy, 4, 3, M(12));
    }
    text('冲垮了', mx - 78, my + 10, M(19), 1);
  }
  // 推进的水头：一排白浪
  if (front < 1.02) {
    for (let i = 0; i < 400; i++) {
      const lx = Math.floor(hash(i, 185) * MAP_W), ly = Math.floor(hash(i, 187) * MAP_H);
      const idx = ly * MAP_W + lx;
      if (!BASIN_MASK[idx]) continue;
      const p = BASIN_PROG[idx];
      if (p > front || p < front - 0.02) continue;
      px(MAPX + lx, MAPY + ly, hash(lx, ly + (f >> 1)) < 0.5 ? M(8) : M(28));
    }
  }
  // 标注
  if (u > 2.2) {
    text('海水倒灌', MAPX + 330, MAPY + 190, M(8), 1);
    arrow(MAPX + 420, MAPY + 226, MAPX + 330, MAPY + 168, M(8), 1, 8);
  }
  if (u > 4.6) {
    const k = clamp((u - 4.6) / 0.4, 0, 1);
    textSC('一夜之间', 320, 32 + Math.round((1 - k) * 10), M(15), 3);
    textC('整片绿洲变成了波斯湾', 320, 70, M(8), 1);
  }
  if (u > 0.6 && front < 0.7) chip('一波波往上跳', MAPX + 90, MAPY - 30, M(15), M(0), M(23));
  hud('倒灌', 'THE SEA POURS IN');
}

// ================================================================== s43 创世纪 192.80–200.10
function shot43(t, f) {
  const u = t - 192.80;
  skyBand(-10, H, M(9), M(10));
  halo(150, 60, 240, 160, R_WARM, 0.5, 2.0);
  // 泥板
  rect(64, 40, 220, 190, M(0));
  rect(70, 46, 208, 178, M(14));
  for (let r = 0; r < 12; r++) for (let c = 0; c < 8; c++) {
    if (hash(r * 3, c + 7) < 0.72) {
      const x = 82 + c * 24, y = 56 + r * 13;
      px(x, y, M(12)); px(x + 1, y + 1, M(12)); px(x + 2, y, M(11));
    }
  }
  text('创世纪', 70, 24 - 2, M(15), 1);
  // 洪水
  if (u > 1.2) {
    const k = clamp((u - 1.2) / 1.2, 0, 1);
    const lvl = Math.round(lerp(300, 200, k));
    for (let y = lvl; y < H; y++) {
      for (let x = 300; x < 650; x++) if (bay(x, y) < 0.62) px(x, y, (y - lvl) < 20 ? M(22) : M(21));
    }
    for (let x = 300; x < 650; x += 2) px(x, lvl + Math.round(Math.sin(x * 0.05 + t * 3) * 2), M(28));
    // 众神狼狈
    const gods = [[380, 230, 1], [450, 244, 0], [530, 236, 1], [596, 250, 0]];
    gods.forEach(([gx, gy, fl], i) => {
      const bob = Math.round(Math.sin(t * 2.4 + i) * 3);
      godHead(gx, gy + bob, 1.4, M(18), M(19), fl ? 1 : -1);
      // 举起的手臂
      line(gx + (fl ? 22 : -22), gy + 12 + bob, gx + (fl ? 34 : -34), gy - 6 + bob, M(18));
    });
    text('众神也被冲得狼狈', 380, 196, M(8), 1);
  }
  // 洪水退后
  if (u > 4.4) {
    const k = clamp((u - 4.4) / 0.6, 0, 1);
    skyBand(300, H, M(9), M(10));
    rect(300, 300 - Math.round(100 * k), 350, Math.round(100 * k), M(13));
    // 神 + 人 + 孩子
    godHead(380, 236, 1.5, M(15), M(29), 1);
    tinyPerson(430, 268, 1.8, M(1), true);
    tinyPerson(470, 276, 1.0, M(1), true);
    text('洪水退后，还能跟人类生孩子', 300, 292, M(8), 1);
  }
  hud('创世纪', 'GENESIS');
}

// ================================================================== s44 众神是谁 200.10–203.50
function shot44(t, f) {
  const u = t - 200.10;
  skyBand(-10, H, M(1), M(2));
  halo(320, 170, 260, 200, R_GOLD, 0.7, 2.1);
  grid(120, 30, 400, 260, M(3), 26);
  // 高大的神像剪影
  const cx = 320;
  poly([[cx - 54, 300], [cx - 44, 190], [cx - 30, 140], [cx - 12, 120], [cx + 14, 120], [cx + 32, 142], [cx + 46, 192], [cx + 56, 300]], M(1));
  disc(cx, 104, 20, M(1));
  arc(cx, 104, 20, -2.7, 0.2, M(15));
  // 冕
  for (let i = 0; i < 5; i++) { const x = cx - 16 + i * 8; rect(x, 82 - (i & 1) * 4, 5, 10, M(1)); px(x + 2, 80 - (i & 1) * 4, M(15)); }
  // 光环
  ring(cx, 150, 90, M(29)); ring(cx, 150, 96, M(15));
  // 技术手环
  icon('gear', cx - 74, 200, 1.2, M(15), M(22));
  icon('star', cx + 74, 200, 1.2, M(15), M(22));
  icon('tablet', cx - 66, 250, 1.0, M(15), M(22));
  icon('boat', cx + 68, 250, 1.0, M(15), M(22));
  text('科技比人类高一大截', 40, 40, M(8), 1);
  if (u > 1.4) {
    textSC('前文明', 320, 40, M(15), 2);
    textC('A CIVILIZATION FAR AHEAD', 320, 66, M(16), 1);
  }
  hud('众神是谁', 'WHO ARE THE GODS');
}

// ================================================================== s45 开会瞒着人类 203.50–209.10
function shot45(t, f) {
  const u = t - 203.50;
  roomWall(M(9), M(10), 30);
  halo(320, 210, 260, 160, R_GOLD, 0.55, 2.0);
  // 圆桌
  ellipse(320, 240, 210, 54, M(12)); ellipse(320, 240, 200, 48, M(14));
  rect(120, 240, 400, 34, M(12));
  hline(120, 240, 400, M(16));
  // 桌面上的地图：山崩
  ellipse(320, 236, 110, 26, M(20));
  for (let i = 0; i < 6; i++) {
    const ox = 250 + i * 24;
    poly([[ox - 8, 238], [ox, 238 - 12 - (i & 1) * 6], [ox + 8, 238]], u > 2.2 && i > 2 ? M(19) : M(13));
  }
  if (u > 2.2) textC('基什山要崩', 320, 252, M(19), 1);
  // 六位神
  for (let i = 0; i < 6; i++) {
    const a = -0.15 + i / 5 * (Math.PI + 0.3);
    const gx = 320 + Math.cos(a) * 190, gy = 240 + Math.sin(a) * 40;
    const fl = i < 3 ? 1 : -1;
    poly([[gx - 26, 240], [gx - 18, 196], [gx, 184], [gx + 18, 196], [gx + 26, 240]], M(1));
    godHead(gx, 172, 1.5, M(18), M(19), fl);
  }
  // 门与封条
  if (u > 1.2) {
    rect(548, 52, 76, 120, M(0));
    rect(552, 56, 68, 112, M(11));
    text('SECRET', 556, 170, M(19), 1);
    for (let i = 0; i < 6; i++) hline(552, 60 + i * 16, 68, M(10));
    // 封条
    rect(540, 100, 92, 14, M(19));
    text('瞒着人类', 544, 102, M(8), 1);
  }
  if (u > 0.6) text('算得出大限将至，但拦不住', 40, 40, M(8), 1);
  if (u > 3.2) text('于是开了个会', 40, 60, M(8), 1);
  hud('开会', 'THE COUNCIL');
}
