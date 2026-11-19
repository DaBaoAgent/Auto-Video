// ---------------------------------------------------------------- 通用：实色分带 / 局部抖动
function band(y0, y1, c) { if (y1 > y0) rect(-10, y0, 660, y1 - y0, c); }
function seam(y, cDown, den = 0.5) { for (let x = -10; x < W + 10; x++) if (bay(x, y) < den) px(x, y, cDown); }
function drow(y, x0, x1, c, den = 0.45) { for (let x = x0; x < x1; x++) if (bay(x, y) < den) px(x, y, c); }
function glowRad(cx, cy, r, c, den = 0.45, pw = 2.0) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / r;
    if (d >= 1) continue;
    if (hash(x, y) < Math.pow(1 - d, pw) * den) px(x, y, c);
  }
}
function glowEll(cx, cy, rx, ry, c, den = 0.45, pw = 2.0) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 1) continue;
    if (hash(x, y) < Math.pow(1 - d, pw) * den) px(x, y, c);
  }
}

// ---------------------------------------------------------------- 镜头 1 湖岸营地
function shotCamp(lt, f) {
  band(-10, 34, P.ink);
  band(34, 78, P.n1);
  band(78, 122, P.n2);
  band(122, 170, P.n3);
  seam(34, P.n1, 0.55); seam(78, P.n2, 0.55); seam(122, P.n3, 0.55);
  stars(f, 46);
  // 月亮
  const mx = 486, my = 52, mr = 15;
  glowRad(mx, my, 44, P.n4, 0.30, 2.4);
  disc(mx, my, mr, P.cream);
  disc(mx - 5, my - 4, 3, P.g1); disc(mx + 4, my + 3, 2, P.g1); disc(mx + 7, my - 6, 1, P.g1);
  for (let j = -mr; j <= mr; j++) { const w = Math.round(Math.sqrt(Math.max(0, mr * mr - j * j))); px(mx + w, my + j, P.g1); }
  // 远山
  ridge(148, 6, 0.4, P.n2);
  ridge(162, 4, 2.0, P.n1);
  // 松林
  pine(40, 172, 74, P.ink, P.ink, false);
  pine(84, 172, 52, P.ink, P.ink, false);
  pine(118, 172, 34, P.ink, P.ink, false);
  pine(592, 172, 62, P.ink, P.ink, false);
  pine(626, 172, 94, P.ink, P.ink, false);
  // 湖
  band(172, 250, P.t1);
  band(246, 250, P.t0);
  hline(-10, 172, 660, P.t2);
  for (let i = 0; i < 22; i++) {
    const y = 176 + i * 3 + Math.floor(hash(i, 311) * 2);
    const x = Math.floor(hash(i, 313) * W) + Math.round(Math.sin(lt * 1.4 + i) * 3);
    const len = 4 + Math.floor(hash(i, 315) * 14);
    hline(x, y, len, hash(i, 317) < 0.4 ? P.t3 : P.t2);
  }
  // 月照水面：横向碎光，越近越宽
  for (let y = 174; y < 248; y += 3) {
    const k = (y - 174) / 74;
    const wid = 5 + Math.round(k * 26);
    const shift = Math.round(Math.sin(lt * 1.6 + y * 0.4) * 2);
    const segs = 2 + Math.floor(hash(y, 5) * 3);
    for (let s = 0; s < segs; s++) {
      const x = mx - wid + Math.round(hash(y + s, 9) * wid * 2) + shift;
      const len = 2 + Math.floor(hash(y + s, 13) * (3 + k * 9));
      hline(clamp(x, mx - wid, mx + wid), y, len, k < 0.35 ? P.cream : (k < 0.7 ? P.n7 : P.n6));
    }
  }
  // 岸
  band(250, 360, P.e0);
  seam(250, P.e1, 0.5);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(hash(i, 821) * W), y = 254 + Math.floor(hash(i, 823) * 44);
    px(x, y, hash(i, 825) < 0.4 ? P.e2 : P.e1);
  }
  grassTufts(252, lt, P.e1, 46, 2);
  // 码头
  rect(500, 244, 62, 4, P.e2);
  hline(500, 244, 62, P.e3);
  for (let x = 504; x < 560; x += 14) vline(x, 248, 12, P.e1);
  // 篝火
  const fx = 96, fy = 292;
  glowEll(fx, fy - 12, 44, 30, P.e2, 0.42, 2.2);
  glowEll(fx, fy - 16, 22, 16, P.gold, 0.30, 2.2);
  line(fx - 16, fy, fx + 16, fy - 6, P.e1);
  line(fx - 16, fy - 6, fx + 16, fy, P.e2);
  for (let i = 0; i < 3; i++) {
    const t2 = lt * 6 + i * 2;
    const hgt = 8 + Math.round((Math.sin(t2) * 0.5 + 0.5) * 8);
    poly([[fx - 6 + i * 5, fy - 2], [fx - 2 + i * 5, fy - 2 - hgt], [fx + 2 + i * 5, fy - 2]], i === 1 ? P.gold2 : P.gold);
  }
  for (let i = 0; i < 14; i++) {
    const up = (lt * (14 + hash(i, 909) * 26) + hash(i, 911) * 40) % 52;
    const x = fx + Math.round(Math.sin(lt * 1.2 + i * 0.7) * (3 + up * 0.22));
    px(x, fy - 8 - up, up > 40 ? P.b1 : (up > 24 ? P.gold : P.tan));
  }
  // 夜景雾气
  for (let y = 160; y < 196; y += 2) drow(y, -10, W, P.n4, 0.06);
}

// ---------------------------------------------------------------- 镜头 2 戴面具的杰森
function shotMask(lt, f) {
  band(-10, 52, P.ink);
  band(52, 112, P.n1);
  band(112, 172, P.n2);
  seam(52, P.n1, 0.5); seam(112, P.n2, 0.5);
  stars(f, 30);
  const mx = 566, my = 44;
  glowRad(mx, my, 34, P.n4, 0.26, 2.2);
  disc(mx, my, 10, P.cream);
  disc(mx - 3, my - 3, 2, P.g1);
  ridge(156, 6, 1.2, P.n2);
  ridge(166, 4, 2.6, P.n1);
  pine(38, 210, 200, P.ink, P.ink, false);
  pine(94, 214, 138, P.ink, P.ink, false);
  pine(602, 208, 212, P.ink, P.ink, false);
  pine(552, 214, 140, P.ink, P.ink, false);
  // 湖/湿地
  band(172, 214, P.t0);
  hline(-10, 172, 660, P.t1);
  for (let i = 0; i < 16; i++) hline(Math.floor(hash(i, 331) * W), 176 + Math.floor(hash(i, 333) * 32), 3 + Math.floor(hash(i, 335) * 8), P.t1);
  // 土路
  band(214, 360, P.e0);
  for (let y = 216; y < 300; y += 2) drow(y, -10, W, P.e1, 0.07);
  seam(214, P.e1, 0.5);
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(hash(i, 841) * W), y = 222 + Math.floor(hash(i, 843) * 120);
    hline(x, y, 2 + Math.floor(hash(i, 845) * 6), hash(i, 847) < 0.5 ? P.e1 : P.e0);
  }
  grassTufts(216, lt, P.e1, 40, 7);

  // 手电锥：从画面左下打向人物胸口
  const step = Math.min(1, Math.max(0, (lt - 0.5) / 1.4));
  const cx = 436 - Math.round(step * 8);
  const gy = 312 + Math.round(step * 3);
  const h = 168 + Math.round(step * 5);
  const tgtX = cx - 4, tgtY = gy - Math.round(h * 0.55);
  coneLight(146, 336, tgtX, tgtY, 30, 0.34, P.gold2);
  coneLight(146, 336, tgtX, tgtY, 16, 0.5, P.gold);
  disc(146, 336, 3, P.cream);
  figureMasked(cx, gy, h, P.n1, P.n3);
  if (lt > 0.8) {
    const hy = gy - Math.round(h * 0.70);
    const rx = Math.max(7, Math.round(h * 0.085));
    px(cx - Math.round(rx * 0.42), hy - 3, P.b2);
    px(cx + Math.round(rx * 0.42), hy - 3, P.b2);
  }
  // 细雨
  for (let i = 0; i < 34; i++) {
    const y = ((hash(i, 401) * (H + 30) - lt * (150 + hash(i, 403) * 120)) % (H + 30) + H + 30) % (H + 30) - 15;
    const x = (hash(i, 405) * W + lt * 6) % W;
    vline(x, y, 2 + Math.floor(hash(i, 407) * 3), i % 3 === 0 ? P.n4 : P.n3);
  }
}

// ---------------------------------------------------------------- 镜头 3 一个接一个倒下
function shotFalls(lt, f) {
  band(-10, 40, P.ink);
  band(40, 96, P.n2);
  band(96, 140, P.n3);
  seam(40, P.n2, 0.5); seam(96, P.n3, 0.5);
  stars(f, 20);
  const mx = 108, my = 44;
  glowRad(mx, my, 40, P.n5, 0.26, 2.2);
  disc(mx, my, 12, P.cream);
  disc(mx - 3, my - 2, 2, P.g1);
  pine(10, 150, 120, P.ink, P.ink, false);
  pine(56, 154, 84, P.ink, P.ink, false);
  pine(616, 150, 128, P.ink, P.ink, false);
  pine(574, 154, 86, P.ink, P.ink, false);
  // 被月光压亮的空地：地面比剪影亮
  band(140, 204, P.e2);
  band(204, 280, P.e1);
  band(280, 360, P.e2);
  seam(140, P.e1, 0.6); seam(204, P.e1, 0.5);
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(hash(i, 851) * W), y = 150 + Math.floor(hash(i, 853) * 200);
    px(x, y, hash(i, 855) < 0.35 ? P.tan : P.e2);
  }
  grassTufts(206, lt, P.e1, 60, 13);
  // 帐篷（说明这是营地）
  poly([[520, 206], [560, 168], [600, 206]], P.ink);
  line(560, 168, 560, 206, P.e0);
  // 三人
  const h = 104;
  const gys = [302, 300, 298];
  const xs = [392, 438, 484];
  const k = [clamp((lt - 0.06) / 0.5, 0, 1), clamp((lt - 0.44) / 0.5, 0, 1), clamp((lt - 0.82) / 0.5, 0, 1)];
  for (let i = 0; i < 3; i++) if (k[i] >= 0.98) bloodPool(xs[i] + 16, gys[i] + 1, 13, Math.min(1, (lt - (0.06 + i * 0.38) - 0.4) * 2.6));
  for (let i = 2; i >= 0; i--) silhouetteFall(xs[i], gys[i], h, k[i], P.ink, P.tan);
  // 地面薄雾
  for (let y = 200; y < 230; y += 2) drow(y, -10, W, P.e3, 0.05);
}

// ---------------------------------------------------------------- 镜头 4 胶片撕口：抄
function shotTear(lt, f) {
  band(-10, 380, P.ink);
  rect(26, 92, 590, 24, P.e0);
  rect(26, 262, 590, 22, P.e0);
  // 胶片带
  rect(26, 92, 590, 192, P.brown);
  for (let y = 96; y < 280; y += 2) hline(26, y, 590, P.e0);
  sprocketRow(30, 92, 580, P.ink, P.e1);
  sprocketRow(30, 268, 580, P.ink, P.e1);
  miniCamp(58, 110, 212, 152, lt);
  miniBay(300, 110, 212, 152, lt);
  // 撕裂
  const tearT = Math.min(1, Math.max(0, (lt - 0.40) / 0.45));
  if (tearT < 1) {
    const cutY = Math.round(92 + tearT * 192);
    for (let y = 92; y < cutY; y++) {
      px(296 + Math.round(Math.sin(y * 0.7) * 1.5), y, P.n8);
      px(298 + Math.round(Math.sin(y * 0.7) * 1.5), y, P.cream);
    }
  } else {
    for (let y = 92; y < 284; y++) {
      const w = 2 + Math.round(Math.abs(Math.sin(y * 0.6)) * 3);
      for (let x = 297 - w; x <= 297 + w; x++) {
        if (hash(x, y) < 0.85) px(x, y, hash(x, y * 2) < 0.5 ? P.cream : P.n8);
      }
    }
  }
  // 盖章
  const st = Math.max(0, lt - 1.02);
  if (st > 0) {
    const scl = st < 0.1 ? 1.12 : 1;
    const cw = Math.round(84 * scl), ch = Math.round(64 * scl);
    stampBox("抄", 470 - cw / 2, 236 - ch / 2, cw, ch);
  }
  // 划痕
  for (let i = 0; i < 10; i++) {
    const x = 36 + Math.floor(hash(i, 861) * 570);
    vline(x, 96 + Math.floor(hash(i, 863) * 180), 2 + Math.floor(hash(i, 865) * 10), P.e1);
  }
}
function stampBox(zh, x, y, w, h) {
  const bw = Math.max(2, Math.round(h / 18));
  rect(x, y, w, h, P.ink);
  rect(x + bw, y + bw, w - bw * 2, h - bw * 2, P.b2);
  const tw = textW(zh);
  textSC(zh, x + w / 2 + 1, y + Math.round((h - 24) / 2), P.cream, 2, 1, P.ink);
  // 盖印边缘缺角
  for (let i = 0; i < 6; i++) {
    const ex = x + Math.floor(hash(i, 971) * w), ey = y + Math.floor(hash(i, 973) * h);
    rect(ex, ey, 2 + Math.floor(hash(i, 975) * 3), 2, P.b1);
  }
}
function miniCamp(x, y, w, h, lt) {
  rect(x, y, w, h, P.ink);
  band(0, 0, P.ink);
  rect(x, y, w, Math.round(h * 0.62), P.n1);
  rect(x, y, w, Math.round(h * 0.30), P.n2);
  hline(x, y + Math.round(h * 0.62), w, P.t1);
  rect(x, y + Math.round(h * 0.62), w, Math.round(h * 0.38), P.t0);
  const mx = x + w - 40, my = y + 24;
  disc(mx, my, 7, P.cream);
  glowRad(mx, my, 24, P.n4, 0.28, 2.2);
  disc(mx, my, 7, P.cream);
  for (let i = 0; i < 4; i++) {
    const bx = x + 18 + i * 26;
    poly([[bx - 9, y + h - 30], [bx, y + h - 62], [bx + 9, y + h - 30]], P.ink);
  }
  rect(x, y + h - 30, w, 30, P.e0);
  const fx = x + 34, fy = y + h - 14;
  disc(fx, fy, 2, P.gold2);
  glowEll(fx, fy, 16, 12, P.e2, 0.35, 2.0);
  disc(fx, fy, 2, P.gold2);
  for (let i = 0; i < 6; i++) px(fx + Math.round(Math.sin(lt * 3 + i) * 3), fy - 6 - i * 2, P.gold);
}
function miniBay(x, y, w, h, lt) {
  const horizon = y + Math.round(h * 0.58);
  rect(x, y, w, h, P.n4);
  rect(x, y, w, Math.round(h * 0.28), P.n5);
  rect(x, y + Math.round(h * 0.28), w, Math.round(h * 0.30), P.tan);
  rect(x, horizon, w, h, P.t3);
  const sx = x + 42, sy = horizon - 4;
  glowRad(sx, sy, 30, P.gold, 0.30, 2.0);
  disc(sx, sy, 7, P.cream);
  disc(sx, sy, 5, P.n8);
  for (let yy = horizon + 2; yy < y + h; yy += 2) {
    const wid = 3 + (yy - horizon) * 0.5;
    hline(sx - wid * 0.4, yy, wid, P.gold2);
  }
  poly([[x, y + h], [x + 34, horizon + 8], [x + 70, y + h]], P.e0);
  poly([[x + w, y + h], [x + w - 40, horizon + 12], [x + w - 74, y + h]], P.e0);
  const bx = x + w * 0.62, by = horizon + 14;
  poly([[bx - 12, by], [bx + 12, by], [bx + 8, by + 5], [bx - 8, by + 5]], P.e1);
  line(bx, by - 14, bx, by, P.e2);
  poly([[bx, by - 14], [bx, by - 2], [bx + 7, by - 4]], P.cream);
}

// ---------------------------------------------------------------- 镜头 5 一九七一 意大利 海湾
function shotBay(lt, f) {
  band(-10, 66, P.dusk);
  band(66, 104, P.n3);
  band(104, 136, P.n5);
  band(136, 164, P.tan);
  band(164, 188, P.gold2);
  seam(66, P.n3, 0.5); seam(104, P.n5, 0.5); seam(136, P.tan, 0.5); seam(164, P.gold2, 0.5);
  // 云
  for (let i = 0; i < 4; i++) {
    const y = 34 + i * 20;
    const x0 = 20 + Math.round(Math.sin(lt * 0.25 + i) * 6);
    hline(x0, y, 120 + i * 30, P.n4);
    hline(x0 + 18, y + 2, 90 + i * 24, P.n3);
  }
  // 太阳
  const sx = 106, sy = 178 - Math.round(lt * 1.2);
  glowRad(sx, sy, 56, P.gold, 0.34, 2.0);
  disc(sx, sy, 13, P.cream);
  disc(sx, sy, 10, P.n8);
  // 海
  band(186, 252, P.t3);
  hline(-10, 186, 660, P.t2);
  for (let i = 0; i < 26; i++) {
    const y = 190 + Math.floor(hash(i, 341) * 60);
    const x = Math.round(hash(i, 343) * W + Math.sin(lt * 1.2 + i) * 4);
    hline(x, y, 3 + Math.floor(hash(i, 345) * 12), hash(i, 347) < 0.4 ? P.t2 : P.t1);
  }
  for (let y = 188; y < 250; y += 3) {
    const k = (y - 188) / 62;
    const wid = 4 + Math.round(k * 30);
    const segs = 2 + Math.floor(hash(y, 21) * 3);
    for (let s = 0; s < segs; s++) {
      const x = sx - wid + Math.round(hash(y + s, 25) * wid * 2);
      const len = 2 + Math.floor(hash(y + s, 29) * (3 + k * 10));
      hline(clamp(x, sx - wid, sx + wid), y, len, k < 0.4 ? P.cream : P.gold2);
    }
  }
  cliffLeft();
  cliffRight();
  boat(392, 214);
  for (let i = 0; i < 4; i++) {
    const x = 250 + i * 44 + Math.round(Math.sin(lt * 0.7 + i) * 6);
    const y = 84 + i * 7 + Math.round(Math.sin(lt * 1.0 + i * 2) * 2);
    px(x - 2, y, P.ink); px(x - 1, y - 1, P.ink); px(x, y - 1, P.ink); px(x + 1, y, P.ink);
  }
  chipZh("1971 · 意大利", 26, 24, P.cream, P.ink, P.gold);
  // 前景草叶
  band(330, 360, P.ink);
  for (let i = 0; i < 22; i++) {
    const x = 8 + Math.floor(hash(i, 881) * 240);
    const hgt = 10 + Math.floor(hash(i, 883) * 26);
    line(x, 344, x + Math.round((hash(i, 885) - 0.5) * 12), 344 - hgt, P.ink);
  }
}
function cliffLeft() {
  poly([[-20, 320], [2, 262], [40, 246], [60, 222], [86, 220], [112, 240], [140, 268], [150, 320]], P.e0);
  poly([[2, 262], [40, 246], [60, 222], [86, 220], [80, 240], [46, 262], [22, 280]], P.e1);
  poly([[86, 220], [112, 240], [140, 268], [150, 320], [128, 300], [100, 250]], P.e2);
  for (let i = 0; i < 5; i++) line(6 + i * 20, 306 - i * 8, 28 + i * 18, 266 - i * 8, P.e1);
  for (let i = 0; i < 14; i++) px(Math.floor(hash(i, 891) * 130), 240 + Math.floor(hash(i, 893) * 44), P.e2);
  // 受光缘
  for (let i = 0; i < 5; i++) px(6 + i * 18, 258 - i * 8, P.tan);
  band(320, 360, P.ink);
}
function cliffRight() {
  poly([[462, 320], [478, 268], [500, 244], [534, 234], [566, 240], [600, 258], [660, 258], [660, 320]], P.e0);
  poly([[478, 268], [500, 244], [534, 234], [566, 240], [556, 252], [516, 262], [494, 280]], P.e1);
  poly([[566, 240], [600, 258], [660, 258], [660, 300], [590, 292]], P.e2);
  for (let i = 0; i < 4; i++) line(486 + i * 16, 306 - i * 8, 506 + i * 16, 264 - i * 6, P.e1);
  // 崖顶别墅
  rect(506, 200, 72, 28, P.cream);
  rect(506, 200, 72, 3, P.g1);
  for (let i = 0; i < 3; i++) rect(512 + i * 20, 204, 12, 9, P.n8);
  rect(502, 195, 80, 6, P.b1);
  vline(572, 180, 15, P.e0);
  for (let i = 0; i < 10; i++) px(508 + Math.floor(hash(i, 911) * 68), 228 + Math.floor(hash(i, 913) * 6), P.e1);
  for (let i = 0; i < 6; i++) px(486 + i * 14, 252 - i * 4, P.tan);
}
function boat(x, y) {
  poly([[x - 20, y], [x + 20, y], [x + 14, y + 7], [x - 14, y + 7]], P.e0);
  hline(x - 18, y, 36, P.cream);
  poly([[x - 1, y - 26], [x - 1, y - 3], [x + 9, y - 7]], P.cream);
  line(x - 1, y - 26, x - 1, y - 3, P.e2);
  for (let i = 0; i < 3; i++) hline(x - 10 + i * 7, y + 2, 5, P.b1);
}

// ---------------------------------------------------------------- 镜头 6 铅黄书封
function shotBook(lt, f) {
  band(-10, 380, P.ink);
  stars(f, 24);
  const cx0 = 60, cy0 = 64, cw = 250, ch = 230;
  rect(cx0 + 6, cy0 + 6, cw, ch, P.ink);
  rect(cx0, cy0, cw, ch, P.gold);
  for (let y = cy0; y < cy0 + ch; y += 4) hline(cx0, y, cw, P.gold2);
  rect(cx0 + 10, cy0 + 10, cw - 20, ch - 20, P.ink);
  rect(cx0 + 13, cy0 + 13, cw - 26, ch - 26, P.gold);
  for (let y = cy0 + 13; y < cy0 + ch - 13; y += 4) hline(cx0 + 13, y, cw - 26, P.gold2);
  // 匕首
  const d1 = [cx0 + 52, cy0 + 158], d2 = [cx0 + 168, cy0 + 40];
  for (let i = -4; i <= 4; i++) line(d1[0], d1[1] + i, d2[0], d2[1] + i, i === 0 ? P.n8 : (i === 1 ? P.cream : P.ink));
  line(d1[0] - 2, d1[1] + 1, d1[0] - 22, d1[1] + 18, P.e0);
  line(d1[0] - 6, d1[1] - 6, d1[0] + 8, d1[1] + 8, P.e2);
  // 血滴
  ellipseFill(d1[0] + 34, cy0 + 70, 3, 5, P.b2);
  ellipseFill(d1[0] + 34, cy0 + 82, 2, 3, P.b1);
  // 底部标题带
  rect(cx0 + 8, cy0 + ch - 56, cw - 16, 38, P.cream);
  hline(cx0 + 8, cy0 + ch - 56, cw - 16, P.e1);
  textSC("血之海滩", cx0 + cw / 2, cy0 + ch - 51, P.ink, 1, 0);
  textC("1971", cx0 + cw / 2, cy0 + ch - 30, P.b1, 1);
  // 右侧文案
  const rx0 = 350;
  text("马里奥·巴瓦", rx0, 128, P.cream, 2);
  hline(rx0, 164, 180, P.gold);
  text("铅黄名导", rx0, 182, P.gold2, 1);
  text("意大利 · 1971", rx0, 202, P.n7, 1);
  text("REAZIONE", rx0, 232, P.n6, 1);
  text("A CATENA", rx0, 250, P.n6, 1);
  // 顶部主标题
  textSC("血之海滩", 320, 18, P.cream, 2, 1, P.ink);
  chipZh("铅黄 · 1971", 350, 276, P.cream, P.ink, P.b1);
}

// ---------------------------------------------------------------- 镜头 7 倒带盘片
function shotReels(lt, f) {
  band(-10, 250, P.dusk);
  band(250, 360, P.e0);
  hline(-10, 250, 660, P.e2);
  // 台灯
  const lx = 66, ly = 92;
  glowRad(lx, ly + 14, 84, P.e2, 0.28, 2.2);
  glowRad(lx, ly + 12, 46, P.gold2, 0.22, 2.4);
  poly([[lx - 14, ly], [lx + 14, ly], [lx + 20, ly + 14], [lx - 20, ly + 14]], P.e2);
  rect(lx - 2, ly + 14, 5, 44, P.e1);
  rect(lx - 12, ly + 58, 24, 4, P.e2);
  disc(lx, ly + 11, 2, P.cream);
  const ang = lt * 3.2;
  reelAt(268, 148, 60, ang, P.e2, P.e1, P.ink);
  reelAt(428, 142, 42, -ang * 1.5, P.e2, P.e1, P.ink);
  for (let i = 0; i < 3; i++) {
    const a0 = ang * 0.6 + i * 2.1;
    for (let k = 0; k < 34; k++) {
      const a = a0 + k * 0.05;
      px(268 + Math.round(Math.cos(a) * (62 + i)), 148 + Math.round(Math.sin(a) * (62 + i)), P.e3);
    }
  }
  line(328, 148, 386, 142, P.e3);
  line(328, 150, 386, 144, P.ink);
  // 桌上胶片条
  for (let i = 0; i < 40; i++) {
    const x = 466 + i * 3, y = 236 + Math.round(Math.sin(i * 0.35 + lt * 2) * 2) + Math.floor(i / 9) * 3;
    rect(x, y, 3, 9, P.e1);
    px(x + 1, y + 4, P.ink);
  }
}

// ---------------------------------------------------------------- 镜头 8 尾卡
function shotTail(lt, f) {
  band(-10, 380, P.ink);
  const ang = lt * 1.1;
  for (let i = 0; i < 3; i++) ring(320, 124, 72 + i * 5, i === 0 ? P.n3 : P.n2, ang + i * 0.2);
  for (let i = 0; i < 6; i++) {
    const a = ang + i * 1.047;
    line(320 + Math.round(Math.cos(a) * 12), 124 + Math.round(Math.sin(a) * 12),
      320 + Math.round(Math.cos(a) * 68), 124 + Math.round(Math.sin(a) * 68), P.n2);
  }
  disc(320, 124, 6, P.n3);
  const k = Math.min(1, lt / 0.45);
  const y = 196 + Math.round((1 - k) * 8);
  textSC("全都欠它一句谢谢", 320, y, P.cream, 2, 1, P.ink);
  hline(150, y + 36, 340, P.gold);
  textC("《血之海滩》 1971 · 马里奥·巴瓦", 320, 262, P.n7, 1);
  textC("口播 徐艾伦 · xiangsu 像素管线", 320, 282, P.n5, 1);
  for (let i = 0; i < 30; i++) {
    const y2 = 8 + Math.floor(hash(i, 951) * 200);
    const x = Math.floor((hash(i, 953) * W + lt * (2 + hash(i, 955) * 5)) % W);
    if (hash(i, 957) < 0.25) px(x, y2, P.gold2);
  }
}

