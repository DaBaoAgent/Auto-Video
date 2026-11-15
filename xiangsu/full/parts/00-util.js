// ================================================================== 全片共享场景库
// 新增镜头一律用固定色板 M()，不经过 stageOf 的金色调级——成片后半段色阶不会再漂。
// 本文件只做“零件”：UI 框、图标、人物、波斯湾地图、分相位转场。

// ---------------------------------------------------------------- UI
function chip(zh, x, y, col = M(8), bg = M(0), bd = M(15), sc = 1) {
  const w = textW(zh) * sc + 12, h = 12 * sc + 6;
  rect(x, y, w, h, bg);
  hline(x, y, w, bd); hline(x, y + h - 1, w, bd);
  vline(x, y, h, bd); vline(x + w - 1, y, h, bd);
  text(zh, x + 6, y + 3, col, sc);
  return w;
}
function cornerFrame(x, y, w, h, c, L = 10) {
  rect(x, y, L, 2, c); rect(x, y, 2, L, c);
  rect(x + w - L, y, L, 2, c); rect(x + w - 2, y, 2, L, c);
  rect(x, y + h - 2, L, 2, c); rect(x, y + h - L, 2, L, c);
  rect(x + w - L, y + h - 2, L, 2, c); rect(x + w - 2, y + h - L, 2, L, c);
}
function panelBox(x, y, w, h, title, en, col = M(15)) {
  rect(x, y, w, h, M(0));
  rect(x + 2, y + 2, w - 4, h - 4, M(0));
  dither(x + 3, y + 3, w - 6, h - 6, M(3), 0.34);
  hline(x + 3, y + 3, w - 6, M(31));
  cornerFrame(x, y, w, h, col);
  if (title) { text(title, x + 10, y + 8, col, 1); hline(x + 10, y + 22, textW(title), M(18)); }
  if (en) text(en, x + 10, y + h - 13, M(26), 1);
}
function stampBox(zh, x, y, col = M(19), sc = 1) {
  const w = textW(zh) * sc + 16, h = 12 * sc + 10;
  rect(x + 2, y + 2, w, h, M(0));
  rect(x, y, w, h, M(0));
  for (const d of [0, 2]) {
    hline(x + d, y + d, w - 2 * d, col); hline(x + d, y + h - 1 - d, w - 2 * d, col);
    vline(x + d, y + d, h - 2 * d, col); vline(x + w - 1 - d, y + d, h - 2 * d, col);
  }
  text(zh, x + 8, y + 5, col, sc);
  return w;
}
function heading(zh, en, cy, k = 1, col = M(15)) {
  const sc = 3, w = textW(zh) * sc;
  const jit = k < 1 ? Math.round((1 - k) * 9) : 0;
  textSC(zh, 320, cy + jit, col, sc);
  hline(320 - w / 2, cy + 12 * sc + 4, w, M(18));
  hline(320 - w / 2, cy + 12 * sc + 5, w, M(17));
  textC(en, 320, cy + 12 * sc + 9, M(26), 1);
}
function arrow(x0, y0, x1, y1, c, w = 2, head = 9) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const bx = x1 - ux * head * 0.7, by = y1 - uy * head * 0.7;
  for (let k = -w; k <= w; k++) line(x0 + nx * k, y0 + ny * k, bx + nx * k, by + ny * k, c);
  for (let k = 0; k <= head; k++) {
    const half = Math.round((1 - k / head) * (w + 4));
    line(x1 - ux * k - nx * half, y1 - uy * k - ny * half, x1 - ux * k + nx * half, y1 - uy * k + ny * half, c);
  }
}
function barMeter(x, y, w, h, v, bg, fg, edge) {
  rect(x, y, w, h, bg);
  const fw = Math.max(0, Math.round(w * clamp(v, 0, 1)));
  if (fw) rect(x, y, fw, h, fg);
  if (edge) { hline(x, y, w, edge); hline(x, y + h - 1, w, edge); vline(x, y, h, edge); vline(x + w - 1, y, h, edge); }
}
function grid(x, y, w, h, c, s = 16) {
  for (let xx = x; xx <= x + w; xx += s) vline(xx, y, h, c);
  for (let yy = y; yy <= y + h; yy += s) hline(x, yy, w, c);
}
function ellipse(cx, cy, rx, ry, c, phase = 0) {
  const n = Math.max(14, Math.round((rx + ry) * 2.2));
  for (let i = 0; i < n; i++) { const a = i / n * 6.2832 + phase; px(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, c); }
}
function hud(zh, en) { labelBlock(zh, en, 24, 12, 2); }

// ---------------------------------------------------------------- 光：点绘光晕
// glowSpot 只能提亮已有像素，纯黑区提不起来；halo 直接按色阶 ramp 点绘，
// 所以在夜戏/暗室里也能造出真正发亮的灯、月亮、洞口。先画 halo，再画主体。
const B4 = (x, y) => [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][((y & 3) << 2) | (x & 3)] / 16 - 0.5;
const R_WARM = [M(12), M(13), M(14), M(15), M(16)];
const R_GOLD = [M(29), M(14), M(15), M(16)];
const R_TEAL = [M(20), M(21), M(22), M(23)];
const R_COLD = [M(1), M(2), M(3), M(4), M(5), M(6), M(7), M(8)];
const R_RED = [M(17), M(18), M(19)];
const R_EARTH = [M(9), M(10), M(11), M(12), M(13)];
function halo(cx, cy, rx, ry, ramp, amt = 1, p = 1.7) {
  const n = ramp.length;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 1) continue;
    const q = Math.pow(1 - d, p) * amt;
    if (q < 0.02) continue;
    const l = Math.floor(q * n + B4(x, y) + 0.5);
    if (l < 0) continue;
    px(x, y, ramp[l < n ? l : n - 1]);
  }
}

// ---------------------------------------------------------------- 通用背景
function nightSky(f, top = M(1), bot = M(3)) {
  skyBand(-10, 168, top, bot);
  skyBand(168, 214, bot, M(24));
  stars(f);
}
function seaBand(y0, y1, t, base = M(20), hi = M(22), spd = 6) {
  rect(-10, y0, 660, y1 - y0, base);
  hline(-10, y0, 660, hi);
  for (let i = 0; i < Math.round((y1 - y0) * 0.75); i++) {
    const yy = y0 + 2 + Math.floor(hash(i, 301) * (y1 - y0 - 3));
    const xx = ((hash(i, 303) * 700 + t * (spd * 0.4 + hash(i, 305) * spd)) % 700) - 30;
    hline(Math.round(xx), yy, 3 + Math.floor(hash(i, 307) * 10), hash(i, 309) < 0.28 ? M(23) : hi);
  }
}
function roomWall(c = M(9), line = M(10), step = 24) {
  skyBand(-10, H, c, line);
  for (let y = 44; y < H; y += step) hline(-10, y, 660, line);
}
function dustGlow(t, cx, cy, r, c) {
  halo(cx, cy, r, r * 0.8, R_GOLD, 0.5, 2.2);
}

// ---------------------------------------------------------------- 人物 / 器物
function humanIcon(x, gy, h, c) {
  const hd = Math.max(2, Math.round(h * 0.15));
  disc(x, gy - h + hd, hd, c);
  rect(x - Math.max(1, Math.round(h * 0.10)), gy - h + hd * 2, Math.max(2, Math.round(h * 0.20)), Math.max(2, Math.round(h * 0.42)), c);
  const hip = gy - Math.round(h * 0.38);
  line(x - 1, hip, x - Math.max(2, Math.round(h * 0.11)), gy, c);
  line(x + 1, hip, x + Math.max(2, Math.round(h * 0.11)), gy, c);
  line(x - 2, gy - Math.round(h * 0.62), x - Math.round(h * 0.22), gy - Math.round(h * 0.44), c);
  line(x + 2, gy - Math.round(h * 0.62), x + Math.round(h * 0.22), gy - Math.round(h * 0.44), c);
}
function tinyPerson(x, gy, s, c, flip = false) {
  const d = flip ? -1 : 1;
  disc(x, gy - Math.round(8 * s), Math.max(1, Math.round(1.5 * s)), c);
  rect(x - Math.round(1.4 * s), gy - Math.round(6.4 * s), Math.max(2, Math.round(2.8 * s)), Math.max(2, Math.round(3.4 * s)), c);
  line(x - s, gy - Math.round(3 * s), x - Math.round(1.6 * s) * d, gy, c);
  line(x + s, gy - Math.round(3 * s), x + Math.round(1.6 * s) * d, gy, c);
  line(x - Math.round(1.2 * s), gy - Math.round(5.4 * s), x - Math.round(2.6 * s) * d, gy - Math.round(3.4 * s), c);
}
function boatReed(x, y, s, t, lit) {
  const q = Math.round;
  poly([[x - q(22 * s), y], [x + q(22 * s), y], [x + q(14 * s), y + q(7 * s)], [x - q(14 * s), y + q(7 * s)]], M(9));
  polyLine([[x - q(22 * s), y], [x + q(22 * s), y], [x + q(14 * s), y + q(7 * s)], [x - q(14 * s), y + q(7 * s)]], M(11), true);
  hline(x - q(19 * s), y + 1, q(38 * s), M(11));
  for (let i = -2; i <= 2; i++) vline(x + q(i * 7 * s), y + 1, q(4 * s), M(10));
  vline(x + q(2 * s), y - q(30 * s), q(30 * s), M(9));
  vline(x + q(3 * s), y - q(30 * s), q(30 * s), M(10));
  poly([[x + q(3 * s), y - q(29 * s)], [x + q(26 * s), y - q(15 * s)], [x + q(3 * s), y - q(3 * s)]], lit ? M(28) : M(12));
  poly([[x + q(3 * s), y - q(29 * s)], [x + q(12 * s), y - q(24 * s)], [x + q(3 * s), y - q(6 * s)]], lit ? M(29) : M(11));
  for (let j = 1; j < 5; j++) line(x + q(3 * s), y - q((29 - j * 5) * s), x + q((3 + 20 * (1 - j / 5)) * s), y - q(15 * s), M(21));
  hline(x - q(20 * s), y + q(8 * s), q(40 * s), M(20));
  px(x + q(2 * s), y - q(31 * s), M(15));
}
function houseHut(x, gy, w, h, cWall, cRoof) {
  // 土坯墙：错缝砖层 + 墙角明暗
  const q = Math.round;
  const wallHi = cWall === M(12) ? M(13) : M(14);
  rect(x, gy - h, w, h, cWall);
  for (let j = 3; j < h; j += 5) {
    hline(x + 1, gy - h + j, w - 2, cWall === M(12) ? M(11) : M(13));
    for (let i = 3 + (((j / 5) | 0) & 1) * 4; i < w - 3; i += 8) px(x + i, gy - h + j - 2, M(11));
  }
  vline(x + 1, gy - h + 1, h - 2, wallHi);
  vline(x + w - 2, gy - h + 1, h - 2, cWall === M(12) ? M(10) : M(12));
  // 芦苇顶：放射草纹 + 檐口
  const peakY = gy - h - q(w * 0.5);
  const roofLine = cRoof === M(11) ? M(12) : M(10);
  poly([[x - 4, gy - h], [x + q(w / 2), peakY], [x + w + 4, gy - h]], cRoof);
  for (let i = 4; i < w + 4; i += 4) line(x + q(w / 2), peakY + 2, x - 4 + i, gy - h, roofLine);
  line(x - 3, gy - h - 1, x + q(w / 2), peakY, cRoof === M(11) ? M(12) : cRoof);
  hline(x - 4, gy - h, w + 8, cRoof === M(11) ? M(12) : cRoof);
  for (let i = 0; i < w + 8; i += 4) px(x - 4 + i, gy - h + 1, M(10));
  // 门：门框 + 门楣 + 门板缝
  const dh = q(h * 0.55), dx = x + q(w / 2) - 4;
  rect(dx - 1, gy - dh - 1, 10, dh + 1, cWall);
  rect(dx, gy - dh, 8, dh, M(8));
  rect(dx + 1, gy - dh + 1, 6, dh - 1, M(0));
  hline(dx - 1, gy - dh - 1, 10, M(11));
  px(dx + 6, gy - q(dh * 0.5), M(15));
  // 窗
  if (w >= 28) {
    rect(x + 4, gy - h + 7, 4, 4, M(0)); px(x + 5, gy - h + 8, M(15));
    rect(x + w - 8, gy - h + 7, 4, 4, M(0)); px(x + w - 7, gy - h + 8, M(15));
  }
}
function godHead(x, y, s, c, c2, flip = 1) {
  const q = Math.round, f = flip;
  poly([[x - q(16 * s) * f, y + q(2 * s)], [x - q(4 * s) * f, y - q(6 * s)], [x + q(10 * s) * f, y - q(5 * s)],
    [x + q(16 * s) * f, y + q(4 * s)], [x + q(12 * s) * f, y + q(13 * s)], [x - q(2 * s) * f, y + q(15 * s)],
    [x - q(14 * s) * f, y + q(11 * s)]], c);
  poly([[x - q(16 * s) * f, y + q(3 * s)], [x - q(24 * s) * f, y + q(6 * s)], [x - q(25 * s) * f, y + q(10 * s)],
    [x - q(16 * s) * f, y + q(11 * s)]], c);
  poly([[x - q(10 * s) * f, y - q(4 * s)], [x - q(6 * s) * f, y - q(14 * s)], [x + q(2 * s) * f, y - q(16 * s)],
    [x + q(8 * s) * f, y - q(11 * s)], [x + q(11 * s) * f, y - q(3 * s)]], c2);
  for (let i = 0; i < 4; i++) line(x + q((-6 + i * 4) * s) * f, y - q(4 * s), x + q((-4 + i * 4) * s) * f, y - q(11 * s), c);
  const ex = x - q(6 * s) * f;
  disc(ex, y + q(3 * s), Math.max(2, q(3 * s)), M(8));
  disc(ex, y + q(3 * s), Math.max(1, q(1 * s)), M(0));
  ring(ex, y + q(3 * s), Math.max(2, q(3.6 * s)), c2);
  arc(x + q(9 * s) * f, y + q(6 * s), q(5 * s), -0.8, 1.1, c2);
  arc(x + q(9 * s) * f, y + q(6 * s), q(8 * s), -0.8, 1.1, c2);
}

// ---------------------------------------------------------------- 图标（基础尺寸 ±12，s 为整数倍）
function icon(kind, cx, cy, s, c, c2) {
  s = s || 1; c2 = c2 === undefined ? c : c2;
  const k = v => Math.round(v * s);
  const r = (x, y, w, h, cc) => rect(cx + k(x), cy + k(y), Math.max(1, k(w)), Math.max(1, k(h)), cc);
  const p = (x, y, cc) => px(cx + k(x), cy + k(y), cc);
  const l = (x0, y0, x1, y1, cc) => line(cx + k(x0), cy + k(y0), cx + k(x1), cy + k(y1), cc);
  const d = (x, y, rr, cc) => disc(cx + k(x), cy + k(y), Math.max(1, k(rr)), cc);
  const o = (x, y, rr, cc) => ring(cx + k(x), cy + k(y), Math.max(2, k(rr)), cc);
  switch (kind) {
    case 'temple':
      // 三级台基 + 砖缝 + 檐口 + 中央阶梯 + 门与顶饰
      r(-13, 7, 26, 6, c); r(-10, 1, 20, 6, c2); r(-7, -5, 14, 6, c); r(-3, -11, 6, 6, c2);
      hline(cx - k(13), cy + k(7), k(26), c2);
      hline(cx - k(10), cy + k(1), k(20), c);
      hline(cx - k(7), cy - k(5), k(14), c2);
      for (let i = -12; i <= 10; i += 4) p(i, 9 + (i & 4 ? 1 : 0), c2);
      for (let i = -9; i <= 7; i += 4) p(i, 3, c);
      for (let i = -6; i <= 4; i += 4) p(i, -3, c2);
      for (let y = 12; y >= -9; y -= 2) { p(-1, y, c2); p(0, y, c2); }
      r(-2, -8, 4, 3, M(0)); p(0, -10, M(0));
      p(0, -13, c2); p(0, -12, c); break;
    case 'tablet':
      // 泥板：外框 + 五列楔形刻痕 + 缺口 + 底面阴影
      r(-9, -12, 18, 24, c); r(-7, -10, 14, 20, c2);
      hline(cx - k(9), cy - k(12), k(18), c2);
      for (let j = 0; j < 5; j++) {
        const yy = -7 + j * 4;
        for (let i = 0; i < 3; i++) { p(-4 + i * 4, yy, c); p(-3 + i * 4, yy + 1, c); p(-5 + i * 4, yy + 1, c2); }
      }
      p(6, -9, M(0)); p(7, -8, M(0)); p(7, -7, M(0));
      hline(cx - k(9), cy + k(11), k(18), M(0)); break;
    case 'wheat':
      // 三株：茎 + 对生麦粒 + 麦芒 + 束带
      for (let i = -1; i <= 1; i++) {
        l(i * 5, 12, i * 2, -4, c);
        for (let j = 0; j < 4; j++) {
          p(i * 2 - 2, -4 - j * 3, c2); p(i * 2 + 2, -5 - j * 3, c2);
          p(i * 2 - 1, -3 - j * 3, c); p(i * 2 + 1, -4 - j * 3, c);
          l(i * 2 - 2, -4 - j * 3, i * 2 - 4, -7 - j * 3, c2);
          l(i * 2 + 2, -4 - j * 3, i * 2 + 4, -7 - j * 3, c2);
        }
        p(i * 2, -16, c2);
      }
      hline(cx - k(7), cy + k(9), k(14), c2); break;
    case 'geo':
      l(-10, 9, 10, 9, c); l(-10, 9, 2, -9, c); l(2, -9, 10, 9, c);
      o(2, -4, 3, c2); p(2, -4, c2); break;
    case 'boat':
      // 船体 + 舷缘 + 肋骨 + 桅 + 方帆 + 旗
      poly([[cx - k(13), cy + k(4)], [cx + k(13), cy + k(4)], [cx + k(9), cy + k(9)], [cx - k(9), cy + k(9)]], c);
      hline(cx - k(11), cy + k(5), k(22), c2);
      for (let i = -2; i <= 2; i++) l(i * 4, 5, i * 3, 8, c2);
      l(0, 3, 0, -12, c); l(1, 3, 1, -12, c2);
      poly([[cx, cy - k(12)], [cx + k(10), cy - k(1)], [cx, cy + k(2)]], c2);
      l(0, -12, 10, -1, c);
      p(0, -13, c2); p(1, -13, c2); p(2, -13, c); break;
    case 'gear':
      o(0, 0, 7, c); o(0, 0, 5, c2); d(0, 0, 2, c); d(0, 0, 1, M(0));
      for (let i = 0; i < 8; i++) { const a = i * 0.785; l(Math.cos(a) * 7, Math.sin(a) * 7, Math.cos(a) * 11, Math.sin(a) * 11, c); p(Math.cos(a) * 10, Math.sin(a) * 10, c2); }
      for (let i = 0; i < 4; i++) { const a = i * 1.571 + 0.785; p(Math.cos(a) * 4, Math.sin(a) * 4, c); }
      break;
    case 'wheel':
      o(0, 0, 9, c); d(0, 0, 2, c2);
      for (let i = 0; i < 4; i++) { const a = i * 0.785 + 0.39; l(Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * 8, Math.sin(a) * 8, c); }
      break;
    case 'star':
      l(0, -11, 0, 11, c); l(-11, 0, 11, 0, c); l(-6, -6, 6, 6, c2); l(-6, 6, 6, -6, c2); d(0, 0, 2, c2);
      break;
    case 'atom':
      d(0, 0, 3, c);
      ellipse(cx, cy, k(11), k(5), c2, 0); ellipse(cx, cy, k(11), k(5), c2, 1.05); ellipse(cx, cy, k(11), k(5), c2, 2.1);
      break;
    case 'drop':
      poly([[cx, cy - k(11)], [cx + k(7), cy + k(1)], [cx + k(4), cy + k(8)], [cx, cy + k(10)], [cx - k(4), cy + k(8)], [cx - k(7), cy + k(1)]], c);
      p(-2, 2, c2); p(-3, 4, c2); break;
    case 'sun':
      d(0, 0, 7, c);
      for (let i = 0; i < 8; i++) { const a = i * 0.785; l(Math.cos(a) * 9, Math.sin(a) * 9, Math.cos(a) * 12, Math.sin(a) * 12, c2); }
      break;
    case 'snow':
      for (let i = 0; i < 3; i++) { const a = i * 1.047; l(Math.cos(a) * 10, Math.sin(a) * 10, -Math.cos(a) * 10, -Math.sin(a) * 10, c); }
      for (let i = 0; i < 6; i++) { const a = i * 1.047; l(Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a) * 9 + Math.cos(a + 1) * 3, Math.sin(a) * 9 + Math.sin(a + 1) * 3, c2); }
      break;
    case 'fish':
      poly([[cx - k(10), cy], [cx - k(4), cy - k(6)], [cx + k(5), cy - k(6)], [cx + k(9), cy],
        [cx + k(5), cy + k(6)], [cx - k(4), cy + k(6)]], c);
      poly([[cx + k(9), cy], [cx + k(14), cy - k(5)], [cx + k(13), cy + k(5)]], c);
      d(-4, -2, 1, c2); break;
    case 'dna':
      for (let j = -10; j <= 10; j++) {
        const xx = Math.round(Math.sin(j * 0.32) * 6);
        p(xx, j, c); p(-xx, j, c2);
        if (j % 4 === 0) l(xx, j, -xx, j, c);
      }
      break;
    case 'fire':
      poly([[cx, cy - k(11)], [cx + k(5), cy - k(2)], [cx + k(4), cy + k(6)], [cx, cy + k(9)], [cx - k(4), cy + k(6)], [cx - k(5), cy - k(2)]], c);
      poly([[cx, cy - k(4)], [cx + k(2), cy + k(2)], [cx - k(2), cy + k(2)]], c2); break;
    case 'jar':
      // 口沿 / 颈 / 鼓腹 / 双耳 / 弦纹 / 高光
      hline(cx - k(5), cy - k(11), k(10), c2);
      r(-4, -10, 8, 2, c); r(-3, -8, 6, 3, c);
      poly([[cx - k(4), cy - k(5)], [cx + k(4), cy - k(5)], [cx + k(8), cy + k(2)],
        [cx + k(6), cy + k(9)], [cx - k(6), cy + k(9)], [cx - k(8), cy + k(2)]], c);
      arc(cx - k(6), cy - k(4), Math.max(2, k(3)), 2.2, 4.6, c2);
      arc(cx + k(6), cy - k(4), Math.max(2, k(3)), -1.5, 0.9, c2);
      hline(cx - k(7), cy + k(1), k(14), c2);
      hline(cx - k(6), cy + k(4), k(12), c2);
      vline(cx - k(5), cy - k(3), k(9), c2);
      p(-6, 8, c2); p(6, 8, c2); break;
    case 'scroll':
      r(-9, -7, 18, 14, c); r(-7, -5, 14, 10, c2);
      for (let j = -3; j <= 3; j += 3) hline(cx - 5, cy + k(j), k(10), c);
      break;
    case 'wheelbarrow':
      r(-8, -2, 14, 6, c); l(-1, 4, 5, 8, c2); d(6, 9, 2, c2); d(-8, 5, 2, c2); break;
    case 'cross':
      l(-8, -8, 8, 8, c); l(-8, 8, 8, -8, c); break;
    case 'check':
      l(-9, 0, -2, 8, c); l(-2, 8, 10, -8, c); break;
    case 'flood':
      // 四层浪 + 半淹的屋 + 雨丝
      for (let j = 0; j < 4; j++) {
        const yy = 1 + j * 4;
        for (let i = -12 + (j & 1) * 2; i <= 10; i += 4) {
          p(i, yy, c); p(i + 1, yy - 1, c); p(i + 2, yy, c); p(i + 2, yy + 1, c2);
        }
      }
      r(-5, -8, 10, 7, c2); poly([[cx - k(8), cy - k(8)], [cx, cy - k(15)], [cx + k(8), cy - k(8)]], c2);
      r(-1, -4, 3, 3, M(0));
      l(-9, -13, -11, -10, c2); l(3, -14, 1, -11, c2); l(9, -12, 7, -9, c2);
      break;
    case 'hut':
      r(-9, -2, 18, 10, c); poly([[cx - k(12), cy - k(2)], [cx, cy - k(11)], [cx + k(12), cy - k(2)]], c2); break;
    case 'eye':
      ellipse(cx, cy, k(11), k(6), c); d(0, 0, 3, c2); break;
    case 'people':
      tinyPerson(cx - k(7), cy + k(8), s, c); tinyPerson(cx + k(6), cy + k(8), s, c2); break;
    case 'question': {
      const b = bmp('?');
      for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.m[j * b.w + i])
        for (let sy = 0; sy < s; sy++) for (let sx = 0; sx < s; sx++)
          px(cx - b.w * s / 2 + i * s + sx, cy - b.h * s / 2 + j * s + sy, c);
      break;
    }
  }
}

// ---------------------------------------------------------------- 相位转场
function phase(t, at, dur, A, B) {
  if (t < at) { A(); return; }
  if (t >= at + dur) { B(); return; }
  A();
  JB.set(IB);
  B();
  mixCols(IB, JB, (t - at) / dur);
}

// ---------------------------------------------------------------- 波斯湾地图（本地 500×260）
const MAPX = 70, MAPY = 22, MAP_W = 500, MAP_H = 260;
// 西北（两河口）→ 东南（霍尔木兹）：伊朗岸在上，阿拉伯岸在下
const SEA_PTS = [
  [86, 58], [118, 46], [168, 40], [218, 44], [268, 54], [318, 70],
  [358, 92], [390, 118], [412, 148], [428, 180], [442, 212], [458, 238],
  [430, 246], [402, 226], [382, 204], [364, 180], [342, 158], [316, 140],
  [286, 126], [254, 114], [220, 104], [188, 96], [156, 86], [126, 74], [100, 64],
];
const SEA_CX = 272, SEA_CY = 148;
const BASIN_PTS = SEA_PTS.map(([x, y]) => [Math.round(SEA_CX + (x - SEA_CX) * 1.075), Math.round(SEA_CY + (y - SEA_CY) * 1.075)]);
const MAPAX = 458, MAPAY = 238;                 // 霍尔木兹（水进来的地方）
const AXU = [-0.8957, -0.4334];                 // 盆地轴线：东南 → 西北
const AX_LEN = 415;
const BASIN_MASK = new Uint8Array(MAP_W * MAP_H);
const BASIN_PROG = new Float32Array(MAP_W * MAP_H);
(function mapPrecompute() {
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (!inPoly(x, y, BASIN_PTS)) continue;
    const i = y * MAP_W + x;
    BASIN_MASK[i] = 1;
    BASIN_PROG[i] = ((x - MAPAX) * AXU[0] + (y - MAPAY) * AXU[1]) / AX_LEN;
  }
})();

function mapP(lx, ly) { return [MAPX + lx, MAPY + ly]; }
function mapBackdrop(f) {
  skyBand(-10, H, M(0), M(1));
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(hash(i, 311) * W), y = Math.floor(hash(i, 313) * H);
    const ph = (f / 30 + hash(i, 317)) % 1;
    if (ph < 0.3) px(x, y, ph < 0.08 ? M(7) : M(31));
  }
}
function mapPanel() {
  rect(MAPX - 8, MAPY - 8, MAP_W + 16, MAP_H + 16, M(0));
  rect(MAPX - 4, MAPY - 4, MAP_W + 8, MAP_H + 8, M(1));
  cornerFrame(MAPX - 8, MAPY - 8, MAP_W + 16, MAP_H + 16, M(15));
}
// 陆地：沙色底 + 伊朗高原 + 山脉 + 沙丘
function mapLand(f) {
  rect(MAPX, MAPY, MAP_W, MAP_H, M(13));
  for (let y = 0; y < MAP_H; y += 3) for (let x = 0; x < MAP_W; x += 3) {
    if (hash(x * 7 + y, 91) < 0.18) px(MAPX + x, MAPY + y, M(14));
    if (hash(x + y * 5, 93) < 0.05) px(MAPX + x, MAPY + y, M(12));
  }
  // 伊朗高原（东北侧）
  const NE = SEA_PTS.slice(0, 12);
  poly([...NE.map(([x, y]) => [MAPX + x, MAPY + y]), [MAPX + 520, MAPY - 16], [MAPX + 60, MAPY - 16]], M(11));
  for (let y = 0; y < MAP_H; y += 4) for (let x = 0; x < MAP_W; x += 4) {
    const sx = MAPX + x, sy = MAPY + y;
    if (get(sx, sy) === M(11) && hash(x + 3, y + 7) < 0.22) px(sx, sy, M(12));
  }
  // 扎格罗斯山脊：沿伊朗岸外侧
  for (let i = 0; i < NE.length - 1; i++) {
    const [x0, y0] = NE[i], [x1, y1] = NE[i + 1];
    const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 9));
    for (let s = 0; s < steps; s++) {
      const u = s / steps, lx = x0 + (x1 - x0) * u - 9, ly = y0 + (y1 - y0) * u - 13;
      const hh = 5 + Math.round(hash(i * 31 + s, 17) * 5);
      poly([[MAPX + lx - 6, MAPY + ly], [MAPX + lx, MAPY + ly - hh], [MAPX + lx + 6, MAPY + ly]], M(10));
      px(MAPX + lx, MAPY + ly - hh, M(12));
    }
  }
  // 阿拉伯地盾：西南侧小丘陵
  const SW = SEA_PTS.slice(11).reverse();
  for (let i = 0; i < SW.length - 1; i++) {
    const [x0, y0] = SW[i], [x1, y1] = SW[i + 1];
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 16));
    for (let s = 0; s < steps; s++) {
      const u = s / steps, lx = x0 + (x1 - x0) * u + 9, ly = y0 + (y1 - y0) * u + 13;
      const hh = 3 + Math.round(hash(i * 13 + s, 29) * 4);
      poly([[MAPX + lx - 5, MAPY + ly], [MAPX + lx, MAPY + ly - hh], [MAPX + lx + 5, MAPY + ly]], M(11));
    }
  }
}
// 盆地 + 海水：front 0=干盆，1=灌满（沿轴线自霍尔木兹向西北推进）
const BS_GREEN = 0, BS_SAND = 1;
function mapBasin(front, style, f) {
  const deep = M(20), mid = M(21), shal = M(22), hi = M(23);
  for (let ly = 0; ly < MAP_H; ly++) {
    const py = MAPY + ly + GY;
    if (py < 0 || py >= H) continue;
    for (let lx = 0; lx < MAP_W; lx++) {
      const i = ly * MAP_W + lx;
      if (!BASIN_MASK[i]) continue;
      const sx = MAPX + lx + GX;
      if (sx < 0 || sx >= W) continue;
      const p = BASIN_PROG[i];
      let c;
      if (p <= front) {
        const d = front - p;
        c = d < 0.018 ? hi : d < 0.07 ? shal : d < 0.22 ? mid : deep;
        if (d > 0.02 && hash(lx, ly) < 0.045 && (((lx * 3 + ly * 7 + (f >> 1)) & 15) === 0)) c = hi;
        if (front < 1.02 && d < 0.014) c = hash(lx + 3, ly + (f >> 1)) < 0.5 ? M(8) : M(28);
      } else if (style === BS_SAND) {
        c = hash(lx * 5, ly * 3) < 0.10 ? M(28) : hash(lx, ly * 7) < 0.25 ? M(14) : M(13);
      } else {
        const n = hash(lx * 3 + 1, ly * 5 + 2);
        c = n < 0.30 ? M(30) : n < 0.62 ? M(22) : M(21);
        if (hash(lx, ly) < 0.05) c = M(23);
      }
      IB[py * W + sx] = c;
    }
  }
}
function mapCoast(c = M(23)) {
  polyLine(SEA_PTS.map(([x, y]) => [MAPX + x, MAPY + y]), c, true);
}
function mapRivers(mode = {}) {
  const src = [[40, 4, 0], [70, 0, 1], [100, 0, 2], [128, 6, 3]];
  const mid = [[58, 28], [78, 24], [96, 22], [110, 28]];
  const end = [MAPX + 88, MAPY + 54];
  src.forEach(([x, y, i]) => {
    const dry = mode.dry && mode.dry.includes(i);
    if (dry) {
      dottedLine(MAPX + x, MAPY + y, MAPX + mid[i][0], MAPY + mid[i][1], M(12), 3);
      dottedLine(MAPX + mid[i][0], MAPY + mid[i][1], end[0], end[1], M(12), 3);
      return;
    }
    thickLine(MAPX + x, MAPY + y, MAPX + mid[i][0], MAPY + mid[i][1], 1, M(22));
    thickLine(MAPX + mid[i][0], MAPY + mid[i][1], end[0], end[1], 1, M(22));
    px(MAPX + mid[i][0], MAPY + mid[i][1] - 1, M(23));
  });
  disc(end[0], end[1], 4, M(22));
  disc(end[0], end[1], 2, M(23));
}
function mapPlace(lx, ly, r, c, zh, col) {
  const x = MAPX + lx, y = MAPY + ly;
  disc(x, y, r, c);
  ring(x, y, r + 1, col || M(15));
  if (zh) text(zh, x + r + 4, y - 5, col || M(15), 1);
  return [x, y];
}
function mapTag(zh, lx, ly, col = M(15), dir = 1) {
  const x = MAPX + lx, y = MAPY + ly;
  const w = textW(zh) + 10;
  const bx = dir > 0 ? x : x - w;
  rect(bx, y - 2, w, 14, M(0));
  hline(bx, y - 2, w, M(31));
  text(zh, bx + 5, y, col, 1);
  return [bx + w / 2, y];
}
function mapBahrain(c = M(28)) {
  const x = MAPX + 300, y = MAPY + 118;
  disc(x, y, 4, c);
  px(x - 1, y - 1, M(14)); px(x + 1, y + 1, M(14));
  ring(x, y, 6, M(15));
  return [x, y];
}
function mapQatar(c = M(14)) {
  const x = MAPX + 330, y = MAPY + 150;
  poly([[x - 3, y + 10], [x + 1, y - 10], [x + 8, y - 12], [x + 5, y + 9]], c);
}
function mapMusandam(c = M(12)) {
  const x = MAPX + 452, y = MAPY + 236;
  poly([[x - 4, y + 6], [x + 2, y - 8], [x + 10, y - 2], [x + 6, y + 6]], c);
}
