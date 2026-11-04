// ================================================================== s17 洪水吞家 51.00–57.00
function shot17(t, f) {
  const u = t - 51.00;
  const rise = clamp(u / 4.6, 0, 1);
  const lvl = Math.round(lerp(300, 204, rise * rise));
  // 暴风雨
  skyBand(-10, 128, M(2), M(3));
  skyBand(128, 206, M(3), M(25));
  cloudBand(f, 26, 210, 7, M(1), M(2));
  cloudBand(f, 62, 280, 11, M(2), M(3));
  if ((f % 53) < 2) halo(420, 54, 240, 92, R_COLD, 0.72, 2.0);
  // 远岸
  poly([[-10, 202], [90, 196], [200, 200], [320, 194], [440, 199], [560, 193], [650, 197], [650, 214], [-10, 214]], M(12));
  // 后方水墙
  rect(-10, 206, 660, 24, M(21));
  dither(320, 216, 700, 13, M(22), 0.4);
  // 村子
  const huts = [[96, 30, 34], [150, 42, 46], [214, 26, 30], [268, 38, 40], [330, 46, 52], [396, 28, 32], [446, 40, 44]];
  for (const [x, w, h] of huts) houseHut(x, 268, w, h, M(12), M(11));
  palm(190, 268, 64, t, 3);
  palm(420, 268, 58, t, 7);
  hline(-10, 268, 660, M(13));
  // 上涨的水（抖动覆盖：半淹的房子能透出来）
  for (let y = lvl; y < H; y++) {
    const depth = (y - lvl) / 70;
    const cover = 0.55 + depth * 0.42;
    for (let x = -10; x < 650; x++) {
      if (bay(x, y) < cover) px(x, y, depth < 0.10 ? M(23) : depth < 0.45 ? M(22) : M(21));
    }
  }
  // 浪峰
  for (let x = -10; x < 650; x += 2) {
    const yy = lvl + Math.round(Math.sin(x * 0.07 + t * 2.6) * 2);
    px(x, yy, (x >> 3) & 1 ? M(28) : M(23));
  }
  // 逃难的船
  const bx = Math.round(lerp(118, 566, clamp(u / 5.4, 0, 1)));
  const by = lvl - 8 + Math.round(Math.sin(t * 3.1) * 2);
  halo(bx + 4, by - 10, 54, 36, R_GOLD, 0.78, 2.1);
  boatReed(bx, by, 0.8, t, true);
  // 雨
  for (let i = 0; i < 140; i++) {
    const rx = ((hash(i, 331) * 780 + t * 90) % 780) - 70;
    const ry = ((hash(i, 333) * 430 + t * 310) % 430) - 40;
    px(Math.round(rx), Math.round(ry), hash(i, 335) < 0.25 ? M(27) : M(26));
    if (hash(i, 337) < 0.5) px(Math.round(rx) + 1, Math.round(ry) - 3, M(26));
  }
  // 水位标尺
  const gx = 612, gy0 = 120, gy1 = 300;
  vline(gx, gy0, gy1 - gy0, M(27));
  for (let i = 0; i <= 6; i++) hline(gx - 5, gy0 + i * 30, 10, M(27));
  const mk = Math.round(lerp(gy1, gy0, (300 - lvl) / 180));
  rect(gx - 8, mk - 3, 16, 6, M(19));
  text('海平面', gx - 62, gy0 - 16, M(8), 1);
  if (u > 2.0) chip('家园被吞没', 28, 278, M(15), M(0), M(19));
  hud('洪水', 'THE FLOOD');
}

// ================================================================== s18 证据墙 57.00–60.90
function shot18(t, f) {
  const u = t - 57.00;
  // 软木墙
  skyBand(-10, H, M(10), M(11));
  dotsFlecks(-10, -10, 660, 380, M(11), 0.32, 3);
  dotsFlecks(-10, -10, 660, 380, M(12), 0.10, 5);
  halo(320, -30, 440, 180, R_WARM, 0.55, 2.0);
  const cards = [
    { x: 44, y: 40, w: 148, h: 94, k: 'lang', zh: '语言', en: 'ISOLATE' },
    { x: 212, y: 28, w: 132, h: 92, k: 'photo', zh: '海湾', en: '1994' },
    { x: 362, y: 44, w: 150, h: 88, k: 'gene', zh: '基因', en: 'DNA' },
    { x: 530, y: 34, w: 92, h: 86, k: 'note', zh: '', en: '' },
    { x: 58, y: 158, w: 126, h: 92, k: 'tablet', zh: '王表', en: 'KING LIST' },
    { x: 208, y: 146, w: 148, h: 100, k: 'photo', zh: '迪尔蒙', en: 'DILMUN' },
    { x: 378, y: 152, w: 158, h: 96, k: 'chart', zh: '水位', en: 'SEA LEVEL' },
    { x: 550, y: 142, w: 72, h: 92, k: 'note', zh: '', en: '' },
  ];
  const pins = [];
  cards.forEach((c, i) => {
    const at = 0.12 * i;
    if (u < at) return;
    const j = u - at < 0.16 ? Math.round((1 - (u - at) / 0.16) * 6) : 0;
    const x = c.x + (i & 1 ? j : -j), y = c.y;
    rect(x + 3, y + 3, c.w, c.h, M(0));
    rect(x, y, c.w, c.h, M(28));
    cornerFrame(x, y, c.w, c.h, M(26), 6);
    if (c.zh) { text(c.zh, x + 7, y + 7, M(0), 1); hline(x + 7, y + 20, c.w - 14, M(26)); }
    const ix = x + Math.round(c.w / 2), iy = y + Math.round(c.h * 0.58);
    if (c.k === 'lang') {
      disc(ix, iy, 9, M(1)); ring(ix, iy, 10, M(15));
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; dottedLine(ix + Math.cos(a) * 12, iy + Math.sin(a) * 12, ix + Math.cos(a) * 22, iy + Math.sin(a) * 22, M(19), 3); }
    } else if (c.k === 'photo') {
      rect(x + 8, y + 26, c.w - 16, c.h - 34, M(20));
      poly([[x + 14, y + 50], [x + 40, y + 40], [x + 70, y + 58], [x + c.w - 20, y + 80], [x + c.w - 20, y + c.h - 12], [x + 14, y + c.h - 12]], M(13));
      for (let k = 0; k < 12; k++) px(x + 12 + Math.floor(hash(k, i + 41) * (c.w - 24)), y + 28 + Math.floor(hash(k, i + 43) * (c.h - 38)), M(22));
      if (c.en) text(c.en, x + 8, y + c.h - 13, M(8), 1);
    } else if (c.k === 'gene') {
      blit(HELIX_FRAMES[Math.floor((t * 1.6 / TWO_PI) * 12) % 12], ix - 22, y + 25);
    } else if (c.k === 'tablet') {
      rect(x + 10, y + 26, c.w - 20, c.h - 34, M(13));
      for (let r = 0; r < 6; r++) for (let k = 0; k < 4; k++) if (hash(r, k + i) < 0.7) px(x + 16 + k * 24, y + 30 + r * 9, M(11));
    } else if (c.k === 'chart') {
      hline(x + 10, y + c.h - 20, c.w - 20, M(26));
      for (let k = 0; k < 7; k++) {
        const bh = 10 + Math.floor(hash(k, i + 51) * 40);
        rect(x + 14 + k * 18, y + c.h - 20 - bh, 12, bh, k === 6 ? M(19) : M(22));
        hline(x + 14 + k * 18, y + c.h - 20 - bh, 12, M(23));
      }
    } else {
      for (let r = 0; r < 7; r++) hline(x + 8, y + 28 + r * 7, c.w - 20, M(26));
      for (let r = 0; r < 3; r++) line(x + 10, y + 30 + r * 18, x + 20, y + 34 + r * 18, M(19));
    }
    // 图钉
    disc(x + Math.round(c.w / 2), y + 4, 3, M(19));
    pins.push([x + Math.round(c.w / 2), y + 4]);
  });
  // 红线
  for (let i = 0; i + 1 < pins.length; i++) {
    if (u < 0.12 * (i + 1) + 0.1) continue;
    thickLine(pins[i][0], pins[i][1], pins[i + 1][0], pins[i + 1][1], 0, M(19));
  }
  if (u > 2.1) {
    const k = clamp((u - 2.1) / 0.3, 0, 1);
    stampBox('证据还真不少', 232, 116, M(19), 1);
    if (k < 1) for (let s = 0; s < 40; s++) px(232 + Math.round(hash(s, 61) * 168), 116 + Math.round(hash(s, 63) * 26), M(8));
  }
  hud('证据', 'EVIDENCE');
}

// ================================================================== s19 语言孤岛 60.90–69.00
function langNode(x, y, zh, en, col) {
  disc(x, y, 6, col); ring(x, y, 8, M(15));
  text(zh, x + 12, y - 11, M(8), 1);
  text(en, x + 12, y + 1, M(26), 1);
}
function shot19(t, f) {
  const u = t - 60.90;
  skyBand(-10, H, M(2), M(3));
  grid(20, 40, 600, 230, M(4), 30);
  // 家族簇
  const fam = [
    [430, 74, '印欧', 'INDO-EUROPEAN', 0],
    [530, 108, '汉藏', 'SINO-TIBETAN', 0.35],
    [420, 152, '闪米特', 'SEMITIC', 0.7],
    [540, 190, '乌拉尔', 'URALIC', 1.05],
    [444, 232, '达罗毗荼', 'DRAVIDIAN', 1.4],
  ];
  // 家族之间的连线（有亲缘）
  for (let i = 0; i < fam.length; i++) for (let j = i + 1; j < fam.length; j++) {
    if ((i + j) % 2) continue;
    if (u < 0.3 + (i + j) * 0.05) continue;
    dottedLine(fam[i][0], fam[i][1], fam[j][0], fam[j][1], M(22), 4);
  }
  // 苏美尔孤岛
  const sx = 156, sy = 156;
  if (u > 0.15) {
    halo(sx, sy, 96, 66, R_GOLD, 0.62, 2.0);
    disc(sx, sy, 9, M(29)); ring(sx, sy, 12, M(15)); ring(sx, sy, 14, M(29));
    text('苏美尔语', sx - 30, sy - 36, M(15), 1);
    text('SUMERIAN', sx - 30, sy - 26, M(26), 1);
  }
  // 探出的虚线头，全部断在半路
  if (u > 1.2) {
    fam.forEach(([x, y, , , ph], i) => {
      const k = clamp((u - 1.2 - i * 0.12) / 0.4, 0, 1);
      if (k <= 0) return;
      const ex = lerp(sx, x, 0.45), ey = lerp(sy, y, 0.45);
      dottedLine(sx, sy, lerp(sx, ex, k), lerp(sy, ey, k), M(19), 4);
      if (k > 0.95) {
        px(Math.round(ex) - 3, Math.round(ey) - 3, M(19)); px(Math.round(ex) + 3, Math.round(ey) + 3, M(19));
        px(Math.round(ex) - 3, Math.round(ey) + 3, M(19)); px(Math.round(ex) + 3, Math.round(ey) - 3, M(19));
      }
    });
  }
  fam.forEach(([x, y, zh, en, ph], i) => {
    if (u < 0.3 + i * 0.12) return;
    langNode(x, y, zh, en, M(22));
  });
  // 结论
  if (u > 2.5) {
    chip('没有亲缘关系', 92, 60, M(15), M(0), M(19));
    text('NO KNOWN RELATIVES', 92, 80, M(26), 1);
  }
  // 城市地名
  const cities = [['乌鲁克', 'URUK'], ['埃利都', 'ERIDU'], ['乌尔', 'UR'], ['拉尔萨', 'LARSA']];
  if (u > 4.6) {
    const k = clamp((u - 4.6) / 0.5, 0, 1);
    hline(40, 262, Math.round(440 * k), M(18));
    cities.forEach(([zh, en], i) => {
      const kk = clamp((u - 4.7 - i * 0.13) / 0.24, 0, 1);
      if (kk <= 0) return;
      const x = 44 + i * 116;
      rect(x, 268, 104, 28, M(0));
      rect(x + 2, 270, 100, 24, M(13));
      // 中英文并排、不留空格，垂直居中在框内
      text(zh, x + 6, 277, M(8), 1);
      text(en, x + 6 + textW(zh) - 2, 277, M(28), 1);
      if (kk < 1) hline(x + 2, 270 + Math.round((1 - kk) * 24), 100, M(8));
    });
    text('地名不是苏美尔语 · 前人留下的定居点', 44, 298 - 4, M(15), 1);
  }
  hud('语言孤岛', 'A LANGUAGE ISLAND');
}

// ================================================================== s20 农业词借来的 69.00–74.20
function shot20(t, f) {
  const u = t - 69.00;
  roomWall(M(9), M(10), 30);
  halo(320, 120, 420, 190, R_WARM, 0.45, 2.0);
  // 中央词条
  const words = [
    { zh: '犁', en: 'PLOUGH', at: 0.15, src: 'SEMITIC' },
    { zh: '农夫', en: 'FARMER', at: 0.95, src: 'HURRIAN' },
    { zh: '播种', en: 'SOW', at: 1.75, src: 'AKKADIAN' },
  ];
  words.forEach((wd, i) => {
    if (u < wd.at) return;
    const k = clamp((u - wd.at) / 0.3, 0, 1);
    const y = 84 + i * 68;
    // 外来箭头
    const ax = lerp(-30, 96, k);
    thickLine(ax, y + 14, ax + 52, y + 14, 0, M(19));
    poly([[ax + 60, y + 14], [ax + 48, y + 8], [ax + 48, y + 20]], M(19));
    // 词卡
    const cx = 168 + Math.round((1 - k) * 40);
    rect(cx + 3, y + 3, 300, 40, M(0));
    rect(cx, y, 300, 40, M(28));
    cornerFrame(cx, y, 300, 40, M(26), 8);
    // 中英文并排、不留空格，两个字面中心都对齐卡片中线
    text(wd.zh, cx + 10, y + 8, M(0), 2);
    text(wd.en, cx + 10 + textW(wd.zh) * 2 - 4, y + 14, M(27), 1);
    // 借
    stampBox('借', cx + 240, y + 6, M(19), 1);
    text(wd.src, cx + 296 - textW(wd.src), y + 30, M(26), 1);
  });
  // 苏美尔的神庙：词从外面流进来
  icon('temple', 566, 214, 2, M(15), M(22));
  text('苏美尔', 534, 258, M(8), 1);
  if (u > 2.5) {
    const k = clamp((u - 2.5) / 0.4, 0, 1);
    hline(40, 48, Math.round(540 * k), M(18));
    text('最核心的农业词汇', 40, 26, M(15), 1);
    text('THE CORE FARMING WORDS ARE ALL LOANWORDS', 40, 40 - 2, M(26), 1);
  }
  if (u > 3.4) stampBox('全是借的', 244, 296, M(19), 1);
  hud('外来语', 'LOANWORDS');
}

// ================================================================== s21 后来搬来的 74.20–80.70
function shot21(t, f) {
  const u = t - 74.20;
  skyBand(-10, 190, M(1), M(2));
  halo(180, 196, 340, 150, R_GOLD, 0.6, 2.2);
  // 田
  rect(-10, 196, 660, 120, M(13));
  hline(-10, 196, 660, M(14));
  for (let r = 0; r < 5; r++) {
    const y = 206 + r * 22;
    for (let i = 0; i < 30; i++) icon('wheat', 12 + i * 21 + (r & 1) * 10, y, 0.5, M(29), M(15));
  }
  // 农舍
  houseHut(70, 200, 56, 44, M(12), M(11));
  palm(150, 200, 52, t, 5);
  // 迁来的人（从右往左走）
  const walk = clamp(u / 4.6, 0, 1);
  for (let i = 0; i < 7; i++) {
    const x = Math.round(lerp(636, 400, clamp(walk - i * 0.05, 0, 1)) - i * 4);
    const gy = 224 + (i % 3) * 10;
    tinyPerson(x, gy, 1.1, M(1), true);
    // 扛着工具
    line(x + 2, gy - 8, x + 9, gy - 18, M(13));
  }
  arrow(600, 250, 470, 250, M(19), 2, 10);
  // 结论
  if (u > 2.4) {
    chip('后来搬来的', 400, 82, M(15), M(0), M(19));
    text('THEY MOVED IN LATER', 400, 104, M(26), 1);
  }
  if (u > 3.4) {
    text('干农活的词，全是借来的', 400, 126, M(8), 1);
  }
  // 对比：一个靠种地起家的民族
  if (u > 0.6) {
    text('一个靠种地起家的民族', 400, 52, M(28), 1);
  }
  hud('后来搬来的', 'LATER ARRIVALS');
}

// ================================================================== s22 迪尔蒙 = 巴林 80.70–86.40
function shot22(t, f) {
  const u = t - 80.70;
  skyBand(-10, 150, M(1), M(24));
  skyBand(150, 220, M(24), M(14));
  halo(320, 214, 380, 120, R_GOLD, 0.6, 2.2);
  // 海
  seaBand(214, 300, t, M(21), M(22), 5);
  // 岛
  poly([[150, 246], [200, 216], [300, 208], [400, 214], [470, 240], [430, 252], [330, 256], [240, 254], [180, 252]], M(12));
  poly([[150, 246], [200, 216], [300, 208], [400, 214], [470, 240], [400, 240], [300, 238], [200, 240]], M(13));
  palm(250, 232, 46, t, 11);
  palm(300, 226, 54, t, 12);
  palm(352, 230, 44, t, 13);
  // 阶梯神庙
  for (let i = 0; i < 3; i++) {
    const w = 56 - i * 14;
    rect(398 - w / 2, 214 - i * 10, w, 10, M(14));
    hline(398 - w / 2, 214 - i * 10, w, M(16));
  }
  // 泉眼：从海里冒出的淡水
  for (let i = 0; i < 26; i++) {
    const bx = 190 + Math.floor(hash(i, 71) * 250);
    const ph = (t * 0.5 + hash(i, 73)) % 1;
    const by = 250 - Math.round(ph * 70);
    if (by < 210) continue;
    const col = ph < 0.3 ? M(23) : ph < 0.6 ? M(22) : M(21);
    px(bx, by, col);
    if (ph > 0.85) ellipse(bx, 250, 4 + Math.round(ph * 6), 1, M(23));
  }
  text('泉水从海底往上冒', 168, 268, M(8), 1);
  // 地图小图
  if (u > 2.2) {
    const k = clamp((u - 2.2) / 0.4, 0, 1);
    rect(486, 40, 130, 116, M(0));
    rect(488, 42, 126, 112, M(1));
    cornerFrame(486, 40, 130, 116, M(15), 8);
    // 巴林
    disc(540, 100, 5, M(15)); ring(540, 100, 8, M(15));
    text('迪尔蒙', 494, 56, M(15), 1);
    text('DILMUN', 494, 70, M(26), 1);
    hline(494, 86, 60, M(18));
    text('= 巴林', 494, 112, M(8), 1);
    text('BAHRAIN', 494, 126, M(15), 1);
    if (k < 1) for (let s = 0; s < 60; s++) px(486 + Math.round(hash(s, 75) * 130), 40 + Math.round(hash(s, 77) * 116), M(8));
  }
  heading('迪尔蒙', 'THE PARADISE ISLAND', 34, clamp(u / 0.6, 0, 1));
  text('祖先来自一个叫迪尔蒙的天堂岛', 40, 300 - 6, M(8), 1);
  hud('天堂岛', 'DILMUN');
}

// ================================================================== s23 幽灵人群 86.40–90.40
function shot23(t, f) {
  const u = t - 86.40;
  skyBand(-10, H, M(2), M(3));
  halo(430, 176, 240, 180, R_TEAL, 0.9, 2.2);
  // DNA 双螺旋
  const cx = 250;
  for (let j = 0; j < 250; j++) {
    const a = j * 0.115 + t * 2.4;
    const x1 = cx + Math.sin(a) * 34, x2 = cx - Math.sin(a) * 34;
    px(Math.round(x1), 40 + j, (j & 8) ? M(23) : M(8));
    px(Math.round(x2), 40 + j, (j & 8) ? M(15) : M(22));
    if ((j & 11) === 0) line(x1, 40 + j, x2, 40 + j, M(21));
  }
  // 幽灵剪影
  const gx = 470, gy = 300;
  const gh = 120;
  for (let k = 0; k < 3; k++) {
    const o = k * 22, s = 1 - k * 0.18;
    const col = k === 0 ? M(23) : k === 1 ? M(22) : M(21);
    ellipse(gx + o, gy - gh * s - 30 * s, Math.round(9 * s), Math.round(10 * s), col);
    for (let y = 0; y < Math.round(70 * s); y += 6) {
      if ((y / 6 | 0) & 1) continue;
      hline(gx + o - Math.round(16 * s), gy - gh * s + y, Math.round(32 * s), col);
    }
  }
  // 虚线的“算出来”
  for (let i = 0; i < 20; i++) {
    const k = i / 20;
    px(Math.round(lerp(300, 440, k)), Math.round(lerp(160, 170, k) + Math.sin(k * 9 + t * 4) * 3), M(8));
  }
  text('从现代人的基因里', 320, 300 - 40, M(8), 1);
  if (u > 0.4) {
    const k = clamp((u - 0.4) / 0.3, 0, 1);
    textSC('2021', 470, 40 + Math.round((1 - k) * 12), M(15), 4);
    chip('科学家的推算', 440, 66, M(8), M(0), M(23));
  }
  if (u > 1.9) {
    textSC('幽灵人群', 470, 100, M(8), 2);
    text('GHOST POPULATION', 396, 130, M(23), 1);
  }
  hud('幽灵人群', 'GHOST POPULATION');
}

// ================================================================== s24 六万年前 90.40–95.80
function shot24(t, f) {
  const u = t - 90.40;
  skyBand(-10, H, M(1), M(2));
  grid(30, 34, 580, 200, M(3), 32);
  halo(200, 140, 180, 110, R_GOLD, 0.42, 2.0);
  // 非洲
  poly([[60, 70], [150, 58], [208, 84], [222, 140], [196, 196], [150, 214], [110, 190], [78, 140]], M(13));
  poly([[60, 70], [150, 58], [208, 84], [180, 90], [120, 84], [80, 104]], M(14));
  text('非洲', 96, 120, M(8), 1);
  // 大部队：向东
  const mainPath = [[206, 128], [300, 110], [400, 96], [520, 88], [600, 92]];
  polyPath(mainPath, M(15), false, 0, clamp((u - 0.3) / 1.4, 0, 1));
  arrow(560, 92, 600, 92, M(15), 1, 8);
  // 分道扬镳的那一支：拐回波斯湾
  const off = [[206, 140], [260, 170], [330, 196], [400, 206], [452, 196]];
  const ko = clamp((u - 1.2) / 1.6, 0, 1);
  if (ko > 0) {
    polyPath(off, M(19), false, 0, ko);
    const [hx, hy] = pathAt(off, ko);
    disc(Math.round(hx), Math.round(hy), 4, M(19));
    ring(Math.round(hx), Math.round(hy), 6, M(15));
  }
  if (u > 2.4) {
    chip('独自藏了五万年', 372, 214, M(15), M(0), M(19));
    ellipse(470, 190, 34, 22, M(19));
    text('波斯湾', 452, 176, M(19), 1);
  }
  // 空墓
  if (u > 3.2) {
    rect(60, 250, 90, 34, M(0));
    cornerFrame(56, 246, 98, 42, M(26), 8);
    text('零遗骸', 60, 276 - 20, M(26), 1);
    text('NO REMAINS FOUND', 56, 290 - 4, M(26), 1);
  }
  // 时间轴
  hline(40, 322, 560, M(27));
  for (const [p, lab] of [[0.02, '60,000 BP'], [0.42, '11,000 BP'], [0.72, 'NOW']]) {
    const x = 40 + Math.round(560 * p);
    vline(x, 316, 12, M(8));
    text(lab, x - 8, 306, M(27), 1);
  }
  text('六万年前，刚走出非洲就分了家', 40, 34, M(8), 1);
  hud('幽灵人群', 'GHOST LINEAGE');
}

// ================================================================== s25 尼人探针 95.80–103.70
function shot25(t, f) {
  const u = t - 95.80;
  mapBackdrop(f);
  mapPanel();
  mapLand(f);
  mapBasin(1.02, BS_GREEN, f);
  mapCoast(M(23));
  mapBahrain(); mapQatar(); mapMusandam();
  // 探针扫描线（沿伊朗岸）
  const sp = clamp((u - 0.5) / 3.2, 0, 1);
  const px0 = MAPX + 96, py0 = MAPY + 60;
  const sx = lerp(px0, MAPX + 430, sp), sy = lerp(py0, MAPY + 210, sp);
  halo(Math.round(sx), Math.round(sy), 58, 58, R_TEAL, 0.55, 2.2);
  ring(Math.round(sx), Math.round(sy), 30, M(8));
  ring(Math.round(sx), Math.round(sy), 31, M(23));
  line(Math.round(sx), Math.round(sy), Math.round(sx) + 30, Math.round(sy) - 24, M(8));
  // 沿岸读数
  const pts = [[MAPX + 118, MAPY + 70, '1.9%'], [MAPX + 190, MAPY + 96, '1.2%'], [MAPX + 268, MAPY + 132, '0.6%'],
    [MAPX + 330, MAPY + 168, '0.2%'], [MAPX + 396, MAPY + 206, '0.1%']];
  pts.forEach(([x, y, v], i) => {
    const at = 0.9 + i * 0.5;
    if (u < at) return;
    disc(x, y, 2, M(15));
    rect(x + 4, y - 14, 40, 14, M(0));
    text(v, x + 6, y - 12, M(8), 1);
  });
  // 盆地里的 ≈0
  if (u > 3.4) {
    const k = clamp((u - 3.4) / 0.4, 0, 1);
    textSC('≈ 0', MAPX + 250, MAPY + 150, M(23), 3);
    text('尼人血统几乎为零', MAPX + 200, MAPY + 186, M(8), 1);
    chip('八成就是他们隐居的地方', MAPX + 120, MAPY - 30, M(15), M(0), M(23));
  }
  // 对比条
  if (u > 5.2) {
    panelBox(430, 210, 190, 70, '尼人血统占比', 'NEANDERTHAL SHARE', M(15));
    barMeter(442, 240, 160, 8, 0.34, M(1), M(22), M(26));
    barMeter(442, 256, 160, 8, 0.02, M(1), M(15), M(26));
    text('欧洲 1.8%', 442, 230 - 2, M(26), 1);
    text('波斯湾 0.1%', 442, 268, M(15), 1);
  }
  hud('探针', 'THE PROBE');
}
