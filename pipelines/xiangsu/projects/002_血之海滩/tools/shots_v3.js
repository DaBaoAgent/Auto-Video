// ---------------------------------------------------------------- 通用
function band(y0, y1, c) { if (y1 > y0) rect(-10, y0, 660, y1 - y0, c); }
function glowRad(cx, cy, r, c, den = 0.4, pw = 2.0) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / r;
    if (d >= 1) continue;
    if (hash(x, y) < Math.pow(1 - d, pw) * den) px(x, y, c);
  }
}
function glowEll(cx, cy, rx, ry, c, den = 0.4, pw = 2.0) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 1) continue;
    if (hash(x, y) < Math.pow(1 - d, pw) * den) px(x, y, c);
  }
}
function scatter(n, y0, y1, c1, c2, seed = 0) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash(i + seed, 1001) * W), y = y0 + Math.floor(hash(i + seed, 1003) * (y1 - y0));
    px(x, y, hash(i + seed, 1005) < 0.5 ? c1 : c2);
  }
}
function reflectPath(cx, y0, y1, t, halfMax) {
  for (let y = y0; y < y1; y += 2) {
    const k = (y - y0) / Math.max(1, y1 - y0);
    const half = 3 + Math.round(k * halfMax);
    const rows = hash(y, 77) < 0.5 ? 2 : 1;
    for (let i = 0; i < rows; i++) {
      const x0 = cx - half + Math.round(hash(y + i, 79) * half * 0.6);
      const len = Math.max(2, Math.round(half * (0.8 + hash(y + i, 81) * 0.7)));
      const shift = Math.round(Math.sin(t * 1.6 + y * 0.25) * 1.5);
      for (let x = x0 + shift; x < x0 + shift + len * 2; x += 2) {
        if (hash(x, y) < 0.55) px(x, y, k < 0.4 ? P.cream : (k < 0.75 ? P.n7 : P.n6));
      }
    }
  }
}

// ---------------------------------------------------------------- 镜头 1 湖岸营地
function shotCamp(lt, f) {
  band(-10, 26, P.ink);
  band(26, 62, P.n1);
  band(62, 100, P.n2);
  band(100, 132, P.n3);
  band(132, 158, P.n3);
  stars(f, 40);
  const mx = 486, my = 52, mr = 16;
  glowRad(mx, my, 38, P.n4, 0.34, 2.6);
  disc(mx, my, mr, P.cream);
  disc(mx - 6, my - 5, 3, P.g1); disc(mx + 5, my + 4, 3, P.g1); disc(mx + 9, my - 7, 2, P.g1);
  for (let j = -mr; j <= mr; j++) { const w = Math.round(Math.sqrt(Math.max(0, mr * mr - j * j))); px(mx + w, my + j, P.g1); }
  ridge(150, 5, 0.3, P.n2);
  ridge(158, 4, 2.2, P.n1);
  pine(36, 168, 62, P.ink, P.ink, false);
  pine(74, 168, 44, P.ink, P.ink, false);
  pine(108, 168, 28, P.ink, P.ink, false);
  pine(600, 168, 56, P.ink, P.ink, false);
  pine(628, 168, 82, P.ink, P.ink, false);
  // 湖
  band(168, 250, P.t1);
  band(232, 250, P.t0);
  hline(-10, 168, 660, P.t2);
  for (let i = 0; i < 14; i++) {
    const y = 174 + Math.floor(hash(i, 361) * 70);
    const x = Math.floor(hash(i, 363) * W);
    hline(x, y, 3 + Math.floor(hash(i, 365) * 9), P.t2);
  }
  reflectPath(mx, 170, 248, lt, 26);
  // 岸
  band(250, 360, P.e0);
  hline(-10, 250, 660, P.e1);
  scatter(50, 252, 300, P.e1, P.e2, 11);
  grassTufts(252, lt, P.e1, 50, 4);
  // 码头
  rect(498, 246, 64, 3, P.e2);
  hline(498, 246, 64, P.e3);
  for (let x = 502; x < 560; x += 16) vline(x, 249, 11, P.e1);
  // 篝火
  const fx = 96, fy = 291;
  glowEll(fx, fy - 8, 40, 26, P.e1, 0.5, 2.2);
  glowEll(fx, fy - 12, 20, 14, P.gold2, 0.35, 2.0);
  line(fx - 18, fy, fx + 18, fy - 5, P.e1);
  line(fx - 18, fy - 5, fx + 18, fy, P.e2);
  const fh = 9 + Math.round((Math.sin(lt * 7) + 1) * 3);
  poly([[fx - 9, fy - 2], [fx - 3, fy - 2 - fh], [fx + 2, fy - 2]], P.tan);
  poly([[fx - 3, fy - 2], [fx + 2, fy - 4 - fh - 4], [fx + 6, fy - 2]], P.gold);
  poly([[fx - 1, fy - 2], [fx + 1, fy - 8 - fh], [fx + 3, fy - 2]], P.gold2);
  for (let i = 0; i < 16; i++) {
    const up = (lt * (12 + hash(i, 909) * 30) + hash(i, 911) * 40) % 56;
    const x = fx + Math.round(Math.sin(lt * 1.1 + i * 0.6) * (2 + up * 0.25));
    px(x, fy - 6 - up, up > 42 ? P.b1 : (up > 22 ? P.gold : P.tan));
  }
}

// ---------------------------------------------------------------- 镜头 2 戴面具的杰森
function shotMask(lt, f) {
  band(-10, 44, P.ink);
  band(44, 100, P.n1);
  band(100, 160, P.n2);
  stars(f, 26);
  const mx = 570, my = 40;
  glowRad(mx, my, 30, P.n4, 0.3, 2.4);
  disc(mx, my, 10, P.cream);
  disc(mx - 3, my - 3, 2, P.g1);
  ridge(162, 5, 1.0, P.n2);
  pine(22, 206, 210, P.ink, P.ink, false);
  pine(78, 210, 150, P.ink, P.ink, false);
  pine(614, 204, 220, P.ink, P.ink, false);
  pine(556, 210, 152, P.ink, P.ink, false);
  band(168, 206, P.t0);
  hline(-10, 168, 660, P.t1);
  for (let i = 0; i < 10; i++) hline(Math.floor(hash(i, 371) * W), 174 + Math.floor(hash(i, 373) * 26), 3 + Math.floor(hash(i, 375) * 7), P.t1);
  // 地面 + 土路
  band(206, 360, P.e0);
  hline(-10, 206, 660, P.e1);
  poly([[-10, 360], [180, 236], [520, 238], [660, 268], [660, 360]], P.e1);
  scatter(60, 210, 340, P.e1, P.e0, 21);
  grassTufts(208, lt, P.e1, 44, 9);
  // 人物
  const step = Math.min(1, Math.max(0, (lt - 0.5) / 1.5));
  const cx = 442 - Math.round(step * 10);
  const gy = 314 + Math.round(step * 4);
  const h = 172 + Math.round(step * 6);
  // 手电锥
  const tx = cx - Math.round(h * 0.10), ty = gy - Math.round(h * 0.58);
  coneLight(150, 334, tx, ty, 26, 0.3, P.gold2);
  coneLight(150, 334, tx, ty, 12, 0.45, P.gold);
  line(150, 334, tx, ty, P.gold2);
  disc(150, 334, 3, P.cream);
  figureMasked(cx, gy, h, P.n1, P.n3);
  if (lt > 0.78) {
    const hy = gy - Math.round(h * 0.99);
    const rx = Math.max(7, Math.round(h * 0.082));
    px(cx - Math.round(rx * 0.4), hy - 3, P.b2);
    px(cx + Math.round(rx * 0.4), hy - 3, P.b2);
  }
  for (let i = 0; i < 30; i++) {
    const y = ((hash(i, 401) * (H + 30) - lt * (170 + hash(i, 403) * 120)) % (H + 30) + H + 30) % (H + 30) - 15;
    const x = (hash(i, 405) * W + lt * 5) % W;
    vline(x, y, 2 + Math.floor(hash(i, 407) * 3), i % 4 === 0 ? P.n4 : P.n3);
  }
}

// ---------------------------------------------------------------- 镜头 3 一个接一个倒下
function shotFalls(lt, f) {
  band(-10, 36, P.ink);
  band(36, 88, P.n2);
  band(88, 136, P.n3);
  stars(f, 18);
  const mx = 96, my = 40;
  glowRad(mx, my, 34, P.n5, 0.28, 2.2);
  disc(mx, my, 11, P.cream);
  disc(mx - 3, my - 2, 2, P.g1);
  pine(6, 150, 118, P.ink, P.ink, false);
  pine(54, 152, 80, P.ink, P.ink, false);
  pine(620, 150, 130, P.ink, P.ink, false);
  pine(578, 152, 88, P.ink, P.ink, false);
  // 空地：暗底 + 月光亮块，剪影才立得住
  band(140, 300, P.e1);
  band(300, 360, P.e0);
  glowEll(392, 250, 190, 74, P.e2, 0.85, 1.6);
  glowEll(392, 258, 120, 52, P.e3, 0.7, 1.8);
  scatter(46, 150, 296, P.e2, P.tan, 31);
  grassTufts(200, lt, P.e2, 40, 13);
  poly([[516, 208], [560, 166], [604, 208]], P.ink);
  line(560, 166, 560, 208, P.e0);
  const h = 106;
  const gys = [300, 297, 294];
  const xs = [372, 424, 476];
  const k = [clamp((lt - 0.06) / 0.5, 0, 1), clamp((lt - 0.44) / 0.5, 0, 1), clamp((lt - 0.82) / 0.5, 0, 1)];
  for (let i = 0; i < 3; i++) if (k[i] >= 0.98) bloodPool(xs[i] + 14, gys[i] + 2, 14, Math.min(1, (lt - (0.06 + i * 0.38) - 0.42) * 2.6));
  for (let i = 2; i >= 0; i--) silhouetteFall(xs[i], gys[i], h, k[i], P.ink, P.tan);
}

// ---------------------------------------------------------------- 镜头 4 胶片撕口
function shotTear(lt, f) {
  band(-10, 380, P.ink);
  rect(26, 88, 590, 20, P.e0);
  rect(26, 268, 590, 18, P.e0);
  rect(26, 92, 590, 188, P.brown);
  for (let y = 96; y < 276; y += 3) hline(26, y, 590, P.e0);
  sprocketRow(30, 94, 580, P.ink, P.e1);
  sprocketRow(30, 266, 580, P.ink, P.e1);
  miniCamp(58, 106, 210, 156, lt);
  miniBay(300, 106, 210, 156, lt);
  const tearT = Math.min(1, Math.max(0, (lt - 0.40) / 0.45));
  if (tearT < 1) {
    const cy2 = Math.round(94 + tearT * 172);
    for (let y = 94; y < cy2; y++) {
      px(296 + Math.round(Math.sin(y * 0.8) * 1.6), y, P.n8);
      px(298 + Math.round(Math.sin(y * 0.8) * 1.6), y, P.cream);
    }
  } else {
    for (let y = 94; y < 266; y++) {
      const w = 2 + Math.round(Math.abs(Math.sin(y * 0.7)) * 3);
      for (let x = 296 - w; x <= 296 + w; x++) if (hash(x, y) < 0.8) px(x, y, hash(x, y * 3) < 0.55 ? P.cream : P.n8);
    }
  }
  const st = Math.max(0, lt - 1.02);
  if (st > 0) {
    const scl = st < 0.1 ? 1.15 : 1;
    const cw = Math.round(86 * scl), ch = Math.round(66 * scl);
    stampBox("抄", 462 - cw / 2, 214 - ch / 2, cw, ch);
  }
  for (let i = 0; i < 9; i++) vline(36 + Math.floor(hash(i, 861) * 560), 98 + Math.floor(hash(i, 863) * 168), 2 + Math.floor(hash(i, 865) * 9), P.e1);
}
function stampBox(zh, x, y, w, h) {
  const bw = Math.max(2, Math.round(h / 20));
  rect(x, y, w, h, P.ink);
  rect(x + bw, y + bw, w - bw * 2, h - bw * 2, P.b2);
  textSC(zh, x + w / 2 + 1, y + Math.round((h - 30) / 2), P.cream, 2, 1, P.ink);
  for (let i = 0; i < 8; i++) {
    const ex = x + Math.floor(hash(i, 971) * w), ey = y + Math.floor(hash(i, 973) * h);
    rect(ex, ey, 2 + Math.floor(hash(i, 975) * 3), 2, P.b1);
  }
}
function miniCamp(x, y, w, h, lt) {
  rect(x, y, w, h, P.n1);
  rect(x, y, w, Math.round(h * 0.42), P.n2);
  const hz = y + Math.round(h * 0.58);
  rect(x, hz, w, y + h - hz, P.t0);
  hline(x, hz, w, P.t1);
  const mx = x + w - 42, my = y + 26;
  disc(mx, my, 7, P.cream);
  glowRad(mx, my, 22, P.n4, 0.3, 2.2);
  disc(mx, my, 7, P.cream);
  for (let i = 0; i < 5; i++) {
    const bx = x + 20 + i * 24;
    poly([[bx - 10, hz], [bx, hz - 40], [bx + 10, hz]], P.ink);
  }
  rect(x, hz, w, y + h - hz, P.e0);
  hline(x, hz, w, P.e1);
  const fx = x + 38, fy = hz + 40;
  glowEll(fx, fy - 6, 18, 14, P.e2, 0.4, 2.0);
  disc(fx, fy, 3, P.gold2);
  disc(fx, fy, 1, P.cream);
  for (let i = 0; i < 5; i++) px(fx + Math.round(Math.sin(lt * 4 + i) * 2), fy - 5 - i * 2, P.gold);
}
function miniBay(x, y, w, h, lt) {
  const hz = y + Math.round(h * 0.58);
  rect(x, y, w, Math.round(h * 0.30), P.n5);
  rect(x, y + Math.round(h * 0.30), w, Math.round(h * 0.28), P.tan);
  rect(x, hz, w, y + h - hz, P.t2);
  hline(x, hz, w, P.t3);
  const sx = x + 40, sy = hz - 4;
  glowRad(sx, sy, 26, P.gold, 0.3, 2.0);
  disc(sx, sy, 7, P.cream);
  disc(sx, sy, 5, P.n8);
  for (let yy = hz + 2; yy < y + h; yy += 2) {
    const wid = 2 + Math.round((yy - hz) * 0.55);
    for (let i = 0; i < 2; i++) hline(sx - wid + i * wid, yy, Math.max(2, wid), P.gold2);
  }
  poly([[x, y + h], [x + 30, hz + 10], [x + 66, y + h]], P.e0);
  poly([[x + w, y + h], [x + w - 36, hz + 14], [x + w - 70, y + h]], P.e0);
  const bx = x + w * 0.60, by = hz + 16;
  poly([[bx - 11, by], [bx + 11, by], [bx + 8, by + 5], [bx - 8, by + 5]], P.e1);
  line(bx, by - 13, bx, by, P.e2);
  poly([[bx, by - 13], [bx, by - 3], [bx + 6, by - 5]], P.cream);
}

// ---------------------------------------------------------------- 镜头 5 一九七一 意大利 海湾
function shotBay(lt, f) {
  band(-10, 34, P.dusk);
  band(34, 62, P.n3);
  band(62, 90, P.n4);
  band(90, 118, P.n5);
  band(118, 146, P.tan);
  band(146, 170, P.gold);
  band(170, 188, P.gold2);
  // 云：短段堆叠，不画长直线
  for (let c = 0; c < 3; c++) {
    const y0 = 44 + c * 24, x0 = 40 + c * 120 + Math.round(Math.sin(lt * 0.2 + c) * 8);
    for (let i = 0; i < 9; i++) {
      const yy = y0 + Math.floor(hash(c * 9 + i, 381) * 8);
      hline(x0 + i * 16 + Math.floor(hash(c * 9 + i, 383) * 6), yy, 8 + Math.floor(hash(c * 9 + i, 385) * 12), c < 2 ? P.n4 : P.n6);
    }
  }
  const sx = 100, sy = 180 - Math.round(lt * 1.2);
  glowRad(sx, sy, 62, P.gold, 0.3, 2.2);
  disc(sx, sy, 13, P.cream);
  disc(sx, sy, 11, P.n8);
  ring(sx, sy, 14, P.gold);
  // 海
  band(188, 244, P.t2);
  band(244, 252, P.t1);
  hline(-10, 188, 660, P.t3);
  for (let i = 0; i < 20; i++) {
    const y = 194 + Math.floor(hash(i, 391) * 52);
    const x = Math.round(hash(i, 393) * W + Math.sin(lt * 1.2 + i) * 5);
    hline(x, y, 4 + Math.floor(hash(i, 395) * 12), hash(i, 397) < 0.4 ? P.t3 : P.t1);
  }
  reflectPath(sx, 190, 250, lt, 30);
  cliffLeft();
  cliffRight();
  boat(398, 214);
  for (let i = 0; i < 3; i++) {
    const x = 258 + i * 40 + Math.round(Math.sin(lt * 0.7 + i) * 5);
    const y = 86 + i * 8 + Math.round(Math.sin(lt * 1.0 + i * 2) * 2);
    px(x - 2, y, P.ink); px(x - 1, y - 1, P.ink); px(x, y - 1, P.ink); px(x + 1, y, P.ink);
  }
  chipZh("1971 · 意大利", 26, 24, P.cream, P.ink, P.gold);
  // 前景左下角草丛
  for (let i = 0; i < 20; i++) {
    const x = 4 + Math.floor(hash(i, 881) * 150);
    const hgt = 8 + Math.floor(hash(i, 883) * 30);
    line(x, 350, x + Math.round((hash(i, 885) - 0.3) * 14), 350 - hgt, P.ink);
  }
}
function cliffLeft() {
  poly([[-20, 340], [-6, 272], [22, 252], [46, 226], [78, 222], [102, 238], [128, 262], [140, 300], [146, 340]], P.e0);
  poly([[-6, 272], [22, 252], [46, 226], [78, 222], [72, 240], [40, 262], [18, 288]], P.e1);
  poly([[78, 222], [102, 238], [128, 262], [140, 300], [120, 296], [96, 250]], P.e2);
  for (let i = 0; i < 6; i++) line(2 + i * 18, 320 - i * 10, 22 + i * 16, 274 - i * 8, P.e1);
  for (let i = 0; i < 18; i++) px(Math.floor(hash(i, 891) * 120), 246 + Math.floor(hash(i, 893) * 60), hash(i, 897) < 0.5 ? P.e2 : P.e1);
  for (let i = 0; i < 7; i++) px(8 + i * 16, 252 - i * 6, P.tan);
  for (let y = 300; y < 340; y += 4) hline(-10, y, 150, P.e1);
}
function cliffRight() {
  poly([[466, 340], [478, 276], [498, 250], [530, 240], [562, 246], [592, 262], [660, 262], [660, 340]], P.e0);
  poly([[478, 276], [498, 250], [530, 240], [562, 246], [552, 258], [512, 268], [492, 288]], P.e1);
  poly([[562, 246], [592, 262], [660, 262], [660, 316], [588, 306]], P.e2);
  for (let i = 0; i < 4; i++) line(486 + i * 17, 320 - i * 10, 506 + i * 17, 268 - i * 6, P.e1);
  // 崖顶别墅
  rect(508, 208, 66, 26, P.cream);
  rect(508, 208, 66, 3, P.g1);
  for (let i = 0; i < 3; i++) rect(514 + i * 19, 213, 11, 8, P.n8);
  rect(504, 203, 74, 6, P.b1);
  vline(566, 188, 15, P.e0);
  for (let i = 0; i < 8; i++) px(510 + Math.floor(hash(i, 911) * 62), 236 + Math.floor(hash(i, 913) * 4), P.e1);
}
function boat(x, y) {
  poly([[x - 19, y], [x + 19, y], [x + 13, y + 7], [x - 13, y + 7]], P.e0);
  hline(x - 17, y, 34, P.cream);
  poly([[x - 1, y - 24], [x - 1, y - 3], [x + 9, y - 7]], P.cream);
  line(x - 1, y - 24, x - 1, y - 3, P.e2);
  for (let i = 0; i < 3; i++) hline(x - 9 + i * 7, y + 2, 5, P.b1);
}

// ---------------------------------------------------------------- 镜头 6 铅黄书封
function shotBook(lt, f) {
  band(-10, 380, P.ink);
  const cx0 = 60, cy0 = 62, cw = 248, ch = 232;
  rect(cx0 + 6, cy0 + 6, cw, ch, P.ink);
  rect(cx0, cy0, cw, ch, P.gold);
  for (let y = cy0; y < cy0 + ch; y += 4) hline(cx0, y, cw, P.gold2);
  rect(cx0 + 10, cy0 + 10, cw - 20, ch - 20, P.ink);
  rect(cx0 + 13, cy0 + 13, cw - 26, ch - 26, P.gold);
  for (let y = cy0 + 13; y < cy0 + ch - 13; y += 4) hline(cx0 + 13, y, cw - 26, P.gold2);
  const d1 = [cx0 + 54, cy0 + 158], d2 = [cx0 + 168, cy0 + 42];
  for (let i = -4; i <= 4; i++) line(d1[0], d1[1] + i, d2[0], d2[1] + i, i === 0 ? P.n8 : (i === 1 ? P.cream : P.ink));
  line(d1[0] - 2, d1[1] + 1, d1[0] - 22, d1[1] + 18, P.e0);
  line(d1[0] - 6, d1[1] - 6, d1[0] + 8, d1[1] + 8, P.e2);
  ellipseFill(d1[0] + 34, cy0 + 72, 3, 5, P.b2);
  ellipseFill(d1[0] + 34, cy0 + 84, 2, 3, P.b1);
  rect(cx0 + 8, cy0 + ch - 56, cw - 16, 38, P.cream);
  hline(cx0 + 8, cy0 + ch - 56, cw - 16, P.e1);
  textSC("血之海滩", cx0 + cw / 2, cy0 + ch - 50, P.ink, 1, 0);
  textC("1971", cx0 + cw / 2, cy0 + ch - 30, P.b1, 1);
  const rx0 = 348;
  text("马里奥·巴瓦", rx0, 126, P.cream, 2);
  hline(rx0, 162, 182, P.gold);
  text("铅黄名导", rx0, 180, P.gold2, 1);
  text("意大利 · 1971", rx0, 200, P.n7, 1);
  text("REAZIONE", rx0, 230, P.n6, 1);
  text("A CATENA", rx0, 248, P.n6, 1);
  textSC("血之海滩", 320, 16, P.cream, 2, 1, P.ink);
  chipZh("铅黄 · 1971", 348, 274, P.cream, P.ink, P.b1);
}

// ---------------------------------------------------------------- 镜头 7 倒带盘片
function shotReels(lt, f) {
  band(-10, 248, P.dusk);
  band(248, 360, P.e0);
  hline(-10, 248, 660, P.e2);
  const lx = 70, ly = 96;
  glowRad(lx, ly + 26, 70, P.e2, 0.26, 2.4);
  glowRad(lx, ly + 22, 34, P.gold2, 0.2, 2.6);
  poly([[lx - 15, ly], [lx + 15, ly], [lx + 21, ly + 13], [lx - 21, ly + 13]], P.e2);
  hline(lx - 20, ly + 12, 41, P.e3);
  rect(lx - 2, ly + 13, 4, 42, P.e1);
  rect(lx - 11, ly + 54, 22, 4, P.e2);
  disc(lx, ly + 10, 2, P.cream);
  const ang = lt * 3.2;
  reelAt(268, 148, 58, ang, P.e2, P.e1, P.ink);
  reelAt(428, 142, 40, -ang * 1.5, P.e2, P.e1, P.ink);
  for (let i = 0; i < 3; i++) {
    const a0 = ang * 0.6 + i * 2.1;
    for (let k = 0; k < 30; k++) {
      const a = a0 + k * 0.06;
      px(268 + Math.round(Math.cos(a) * (60 + i)), 148 + Math.round(Math.sin(a) * (60 + i)), P.e3);
    }
  }
  line(326, 148, 388, 142, P.e3);
  line(326, 150, 388, 144, P.ink);
  for (let i = 0; i < 38; i++) {
    const x = 470 + i * 3, y = 232 + Math.round(Math.sin(i * 0.4 + lt * 2) * 2) + Math.floor(i / 9) * 3;
    rect(x, y, 3, 9, P.e1);
    px(x + 1, y + 4, P.ink);
  }
}

// ---------------------------------------------------------------- 镜头 8 尾卡
function shotTail(lt, f) {
  band(-10, 380, P.ink);
  const ang = lt * 1.1;
  for (let i = 0; i < 3; i++) ring(320, 118, 66 + i * 5, i === 0 ? P.n3 : P.n2, ang + i * 0.2);
  for (let i = 0; i < 6; i++) {
    const a = ang + i * 1.047;
    line(320 + Math.round(Math.cos(a) * 12), 118 + Math.round(Math.sin(a) * 12),
      320 + Math.round(Math.cos(a) * 62), 118 + Math.round(Math.sin(a) * 62), P.n2);
  }
  disc(320, 118, 6, P.n3);
  const k = Math.min(1, lt / 0.5);
  textSC("血之海滩", 320, 182 + Math.round((1 - k) * 8), P.cream, 2, 1, P.ink);
  hline(196, 224, 248, P.gold);
  textC("1971 · 马里奥·巴瓦", 320, 236, P.gold2, 1);
  textC("口播 徐艾伦 · xiangsu 像素管线", 320, 262, P.n6, 1);
}
