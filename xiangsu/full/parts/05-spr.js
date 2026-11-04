// ================================================================== 预烘焙 sprite 表
// 带连续动作 / 形态变化的元素（人物、道具、船、鱼、香烟、示意图），先在模块初始化时
// 把每个动画帧画进帧缓冲、拷成 sprite 表；渲染时只 blit 复用，不再逐帧重画矢量形状。
// 静态道具（石像、柱、鼓、月、旗座）同样把细节烘进一次性 sprite / 细化几何。
// 全部用固定色板 M()，不受 stageOf 的色调级影响。

function bakeFrames(name, w, h, n, draw) {
  const frames = [];
  for (let i = 0; i < n; i++) {
    IB.fill(0);
    GX = 0; GY = 0;
    draw(i / n, i);
    const d = new Uint8Array(w * h);
    let ink = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = IB[y * W + x]; d[y * w + x] = c; if (c) ink++;
    }
    frames.push({ w, h, d, id: ++sprN, name: name + '#' + i });
    if (!ink) console.warn('[spr] ' + name + ' 第 ' + i + ' 帧是空的');
  }
  IB.fill(0);
  return frames;
}

const TWO_PI = 6.2831853;

// ---------------------------------------------------------------- 阿普卡鲁（鱼人）
// 局部锚点：头心 (64, 40)。尾鳍 / 头 / 手按相位摆动，烘焙成 8 帧。
function drawApkallu(x, hy, ph) {
  const q = Math.round, S = Math.sin(ph * TWO_PI), C = Math.cos(ph * TWO_PI);
  const tf = q(S * 5), tv = q(C * 2);
  hy += q(S);
  // ---- 尾鳍（身体之后）
  poly([[x - 30, hy + 62], [x + 30, hy + 62], [x + 46 + tf, hy + 90], [x + 60 + tf, hy + 104 - tv],
    [x + 32 + tf, hy + 100], [x, hy + 92], [x - 32 + tf, hy + 100], [x - 60 + tf, hy + 104 - tv],
    [x - 46 + tf, hy + 90]], M(21));
  for (let i = 0; i < 6; i++) line(x - 25 + i * 10, hy + 67, x - 52 + tf + i * 20, hy + 99, M(20));
  polyLine([[x - 30, hy + 62], [x - 46 + tf, hy + 90], [x - 60 + tf, hy + 104 - tv], [x - 32 + tf, hy + 100],
    [x, hy + 92], [x + 32 + tf, hy + 100], [x + 60 + tf, hy + 104 - tv], [x + 46 + tf, hy + 90], [x + 30, hy + 62]], M(23), false);
  // ---- 躯干
  poly([[x - 28, hy + 36], [x + 28, hy + 36], [x + 33, hy + 68], [x - 33, hy + 68]], M(21));
  poly([[x - 31, hy + 54], [x + 31, hy + 54], [x + 33, hy + 68], [x - 33, hy + 68]], M(20));
  for (let y = hy + 42; y < hy + 67; y += 5) for (let xx = x - 30 + (((y / 5) | 0) & 1) * 5; xx < x + 28; xx += 10) {
    px(xx, y, M(22)); px(xx + 1, y + 1, M(20)); if (((xx + y) & 3) === 0) px(xx, y + 1, M(23));
  }
  arc(x - 10, hy + 48, 11, -1.2, 0.9, M(23)); arc(x + 11, hy + 48, 11, -1.0, 0.9, M(23));
  // 金项圈
  arc(x, hy + 36, 30, 0.3, 2.85, M(15)); arc(x, hy + 36, 27, 0.3, 2.85, M(29));
  for (let i = 0; i < 5; i++) { const a = 0.62 + i * 0.49; px(x + q(Math.cos(a) * 25), hy + 36 + q(Math.sin(a) * 25), i & 1 ? M(19) : M(22)); }
  // ---- 左臂上举（持锥）
  poly([[x - 24, hy + 40], [x - 42, hy + 34], [x - 50, hy + 42], [x - 32, hy + 52]], M(21));
  poly([[x - 44, hy + 36], [x - 52, hy + 18], [x - 44, hy + 12], [x - 38, hy + 34]], M(21));
  disc(x - 48, hy + 10, 5, M(22));
  for (let i = 0; i < 3; i++) line(x - 52 + i * 3, hy + 8, x - 54 + i * 3, hy + 3, M(22));
  poly([[x - 55, hy + 2], [x - 41, hy + 4], [x - 48, hy - 10]], M(10));
  hline(x - 53, hy + 1, 10, M(15)); hline(x - 51, hy - 2, 7, M(29));
  px(x - 47, hy - 4, M(12)); px(x - 43, hy + 1, M(14));
  hline(x - 46, hy + 30, 10, M(15)); px(x - 45, hy + 31, M(29));
  // ---- 右臂持桶
  poly([[x + 24, hy + 40], [x + 42, hy + 44], [x + 48, hy + 56], [x + 30, hy + 52]], M(21));
  poly([[x + 44, hy + 48], [x + 54, hy + 60], [x + 48, hy + 68], [x + 38, hy + 54]], M(21));
  poly([[x + 40, hy + 64], [x + 56, hy + 64], [x + 53, hy + 80], [x + 43, hy + 80]], M(10));
  hline(x + 40, hy + 64, 17, M(15)); hline(x + 41, hy + 74, 15, M(14));
  arc(x + 48, hy + 64, 8, Math.PI, 2 * Math.PI, M(15));
  vline(x + 47, hy + 68, 9, M(12));
  hline(x + 42, hy + 50, 9, M(15));
  // ---- 头冠鳍（头后）
  poly([[x - 24, hy - 2], [x - 12, hy - 22], [x + 4, hy - 28], [x + 18, hy - 18], [x + 24, hy - 2]], M(22));
  for (let i = 0; i < 5; i++) line(x - 20 + i * 9, hy - 3, x - 12 + i * 9, hy - 16 - (i % 2) * 4, M(20));
  polyLine([[x - 24, hy - 2], [x - 12, hy - 22], [x + 4, hy - 28], [x + 18, hy - 18], [x + 24, hy - 2]], M(23), false);
  // 耳鳍
  poly([[x - 32, hy + 10], [x - 50, hy - 2 - q(S * 2)], [x - 44, hy + 18]], M(22));
  poly([[x + 30, hy + 8], [x + 48 + q(S * 2), hy - 4], [x + 42, hy + 16]], M(22));
  line(x - 34, hy + 10, x - 47, hy + 3, M(20)); line(x + 32, hy + 8, x + 45, hy + 1, M(20));
  // ---- 鱼头
  poly([[x - 34, hy + 4], [x - 16, hy - 6], [x + 10, hy - 6], [x + 28, hy + 2], [x + 32, hy + 18],
    [x + 26, hy + 32], [x + 4, hy + 38], [x - 20, hy + 36], [x - 34, hy + 24]], M(21));
  poly([[x + 6, hy - 5], [x + 28, hy + 2], [x + 32, hy + 18], [x + 26, hy + 32], [x + 8, hy + 37]], M(22));
  // 吻部
  poly([[x - 34, hy + 12], [x - 54, hy + 18], [x - 56, hy + 26], [x - 36, hy + 28]], M(21));
  line(x - 55, hy + 25, x - 36, hy + 28, M(20));
  px(x - 54, hy + 20, M(23)); px(x - 50, hy + 19, M(23)); px(x - 46, hy + 21, M(23));
  px(x - 52, hy + 22, M(0));
  // 眼（左大右小）
  disc(x - 18, hy + 14, 8, M(8)); ring(x - 18, hy + 14, 9, M(20));
  disc(x - 18, hy + 14, 4, M(0)); px(x - 21, hy + 11, M(27)); px(x - 20, hy + 13, M(8));
  disc(x + 14, hy + 12, 5, M(8)); disc(x + 14, hy + 12, 2, M(0)); px(x + 13, hy + 11, M(27));
  line(x - 30, hy + 5, x - 6, hy + 3, M(20)); line(x + 6, hy + 4, x + 20, hy + 6, M(20));
  // 鳃裂
  arc(x + 26, hy + 18, 9, -0.9, 1.1, M(20)); arc(x + 26, hy + 18, 13, -0.9, 1.1, M(20));
  // 触须
  for (let i = 0; i < 4; i++) { px(x - 52 - i * 2, hy + 30 + i * 3 + (i > 1 ? 1 : 0), M(23)); px(x - 47 - i, hy + 31 + i * 3, M(20)); }
  // 胸鳍
  poly([[x - 30, hy + 46], [x - 40 - q(S), hy + 62], [x - 26, hy + 60]], M(22));
  line(x - 32, hy + 48, x - 37 - q(S), hy + 60, M(20));
  // 月光右缘
  for (let y = hy - 8; y < hy + 36; y++) {
    const xx = x + 30 - q((y - hy) * 0.05);
    if (bay(xx, y) < 0.7) px(xx, y, M(23));
  }
  px(x + 29, hy + 6, M(27)); px(x + 31, hy + 20, M(23));
}
const APK_FRAMES = bakeFrames('APKALLU', 128, 152, 8, (ph) => drawApkallu(64, 40, ph));
function apkalluBaked(x, wl, off, t) {
  const hy = 150 + off;
  glowSpot(x, hy + 48, 92, 1, 0.16 + 0.10 * Math.sin(t * 3.1));
  blit(APK_FRAMES[Math.floor(t * 10) % 8], x - 64, hy - 40);
  glowSpot(x - 18, hy + 14, 7, 1, 0.10 + 0.08 * Math.sin(t * 6.2));
  glowSpot(x + 14, hy + 12, 6, 1, 0.07 + 0.06 * Math.sin(t * 6.2 + 1.2));
}

// ---------------------------------------------------------------- 跪拜者（3/4 背向）
function drawWorshipper(x, gy, s, ph) {
  const q = Math.round;
  const bow = (Math.sin(ph * TWO_PI) * 1.6 + 1.6) * s;
  const top = q(gy - 42 * s);
  // 袍
  poly([[x - q(13 * s), gy], [x - q(10 * s), gy - q(28 * s)], [x - q(5 * s), top + bow],
    [x + q(5 * s), top + bow], [x + q(10 * s), gy - q(28 * s)], [x + q(13 * s), gy]], M(1));
  poly([[x - q(9 * s), gy], [x - q(7 * s), gy - q(24 * s)], [x + q(7 * s), gy - q(24 * s)], [x + q(9 * s), gy]], M(2));
  // 褶与下摆
  for (let i = -2; i <= 2; i++) line(x + q(i * 3 * s), gy - q(6 * s), x + q(i * 4 * s), gy - 1, M(2));
  hline(x - q(13 * s), gy - 1, q(26 * s), M(12));
  for (let i = -q(11 * s); i <= q(11 * s); i += Math.max(2, q(3 * s))) px(x + i, gy - q(2 * s), M(13));
  // 肩背
  poly([[x - q(9 * s), gy - q(30 * s)], [x - q(5 * s), top + bow + q(2 * s)],
    [x + q(5 * s), top + bow + q(2 * s)], [x + q(9 * s), gy - q(30 * s)]], M(2));
  hline(x - q(6 * s), gy - q(30 * s), q(12 * s), M(3));
  // 头 + 发髻
  disc(x, top - q(5 * s) + bow, Math.max(2, q(6 * s)), M(1));
  disc(x, top - q(9 * s) + bow, Math.max(1, q(3 * s)), M(0));
  px(x - q(2 * s), top - q(8 * s) + bow, M(12));
  // 轮廓光（火盆一侧）
  vline(x + q(10 * s), gy - q(27 * s), q(24 * s), M(12));
  arc(x, top - q(5 * s) + bow, Math.max(2, q(6 * s)), -1.3, 1.1, M(13));
  // 手中的供碗
  px(x + q(2 * s), gy - q(10 * s), M(15)); px(x + q(3 * s), gy - q(9 * s), M(29));
}
function bakeWorshipper(s) {
  return bakeFrames('WORSHIPPER' + s, 48, 60, 6, (ph) => drawWorshipper(24, 58, s, ph));
}
const WORSHIP_FRAMES = { 1: bakeWorshipper(1), 0.85: bakeWorshipper(0.85) };
function worshipperBaked(x, gy, s, t, seed) {
  const fs = WORSHIP_FRAMES[s >= 0.93 ? 1 : 0.85];
  const ph = ((t * 2.2 + seed * 1.7) / TWO_PI) % 1;
  blit(fs[Math.floor(ph * 6) % 6], x - 24, gy - 58);
}

// ---------------------------------------------------------------- 棕榈叶（树干单独细化）
function drawPalmTop(tx, ty, ph, seed) {
  const q = Math.round;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + 0.16 + (i / 8) * (Math.PI - 0.32);
    const sway = Math.sin(ph * TWO_PI + i * 0.7 + seed) * 0.055;
    const L = 23 + (i % 3) * 4 + q(hash(i, seed + 5) * 6);
    const ex = tx + Math.cos(a + sway) * L;
    const ey = ty + 19 + Math.sin(a + sway) * (L * 0.45);
    const qx = tx + Math.cos(a + sway) * (L * 0.55);
    const qy = ty - 6 + Math.sin(a + sway) * 7;
    let lx = tx, ly = ty;
    for (let u = 0; u <= 1.001; u += 0.05) {
      const pt = qPoint([tx, ty], [qx, qy], [ex, ey], u);
      const xx = q(pt[0]), yy = q(pt[1]);
      px(xx, yy, u < 0.4 ? M(23) : u < 0.75 ? M(22) : M(21));
      if (u > 0.1 && u < 0.96) {
        const dx = pt[0] - lx, dy = pt[1] - ly, dl = Math.hypot(dx, dy) || 1;
        const nx = -dy / dl, ny = dx / dl;
        const leaf = 1 + ((i + q(u * 7)) % 2);
        px(q(pt[0] + nx * leaf), q(pt[1] + ny * leaf), M(22));
        px(q(pt[0] - nx * leaf), q(pt[1] - ny * leaf), M(21));
        if (u > 0.3 && u < 0.7) px(q(pt[0] + nx * (leaf + 1)), q(pt[1] + ny * (leaf + 1)), M(20));
      }
      lx = pt[0]; ly = pt[1];
    }
  }
  // 果簇
  for (let i = 0; i < 3; i++) { disc(tx - 7 + i * 7, ty + 7, 2, M(15)); px(tx - 7 + i * 7, ty + 6, M(16)); }
  // 顶心
  disc(tx, ty, 3, M(23)); px(tx + 1, ty + 1, M(22));
  return seed;
}
const PALM_SETS = [3, 7, 11].map((sd) => bakeFrames('PALM' + sd, 80, 80, 8, (ph) => drawPalmTop(40, 42, ph, sd)));
function palmBaked(x, gy, h, t, seed) {
  const q = Math.round;
  const bend = (hash(seed, 2) - 0.5) * 12;
  for (let j = 0; j < h; j++) {
    const u = j / h;
    const xx = q(x + bend * u * u);
    const band = ((j + q(hash(seed, 4) * 6)) % 8) < 2;
    px(xx - 1, gy - j, M(10));
    px(xx, gy - j, band ? M(13) : M(12));
    px(xx + 1, gy - j, band ? M(11) : M(13));
    if ((j % 9) === 0) px(xx + 2, gy - j, M(11));
    if ((j % 11) === 5) px(xx - 2, gy - j, M(9));
  }
  hline(x - 3, gy, 7, M(10));
  const topX = q(x + bend), topY = gy - h;
  const set = PALM_SETS[Math.abs(seed) % 3];
  blit(set[Math.floor((t * 1.1 + seed * 0.13) * 8) % 8], topX - 40, topY - 42);
}

// ---------------------------------------------------------------- 香火（8 帧烟柱）
function drawIncense(x0, y0, ph) {
  const q = Math.round;
  for (let k = 0; k < 7; k++) {
    for (let u = 0.02; u < 1; u += 0.024) {
      const yy = y0 - u * 126;
      const amp = 2 + u * 10;
      const xx = x0 + Math.sin(u * 6.4 + ph * TWO_PI + k * 1.31) * amp * (0.4 + (k / 7) * 0.85)
        + Math.sin(u * 2.2 + k * 0.9) * 2;
      const c = u < 0.16 ? M(27) : u < 0.42 ? M(26) : u < 0.76 ? M(9) : M(0);
      px(q(xx), q(yy), c);
      if (u > 0.22 && u < 0.68 && (k & 1)) px(q(xx) + 1, q(yy), M(9));
      if (u > 0.5 && u < 0.8 && (k % 3 === 0)) px(q(xx) - 1, q(yy), M(0));
    }
  }
}
const INCENSE_FRAMES = bakeFrames('INCENSE', 40, 132, 8, (ph) => drawIncense(20, 130, ph));
function incenseBaked(x, y, t, seed) {
  blit(INCENSE_FRAMES[Math.floor((t * 3.5 + seed * 1.7) * 2) % 8], x - 20, y - 130);
}

// ---------------------------------------------------------------- 苇舟（含两名划手，桨随相位摆）
function drawBoat(x, y, s, ph, lit) {
  const q = Math.round;
  const bob = q(Math.sin(ph * TWO_PI) * 1 * s);
  const yy = y + bob;
  // 船体
  poly([[x - q(22 * s), yy], [x + q(22 * s), yy], [x + q(14 * s), yy + q(7 * s)], [x - q(14 * s), yy + q(7 * s)]], M(9));
  poly([[x - q(21 * s), yy], [x + q(21 * s), yy], [x + q(15 * s), yy + q(3 * s)], [x - q(15 * s), yy + q(3 * s)]], M(11));
  polyLine([[x - q(22 * s), yy], [x + q(22 * s), yy], [x + q(14 * s), yy + q(7 * s)], [x - q(14 * s), yy + q(7 * s)]], M(12), true);
  for (let i = -2; i <= 2; i++) vline(x + q(i * 7 * s), yy + q(1 * s), q(5 * s), M(10));
  hline(x - q(19 * s), yy + q(1 * s), q(38 * s), M(12));
  line(x - q(22 * s), yy, x - q(26 * s), yy - q(4 * s), M(9));
  line(x + q(22 * s), yy, x + q(26 * s), yy - q(4 * s), M(9));
  // 桅杆与帆
  vline(x + q(2 * s), yy - q(30 * s), q(30 * s), M(9));
  vline(x + q(3 * s), yy - q(30 * s), q(30 * s), M(11));
  const fl = q(Math.sin(ph * TWO_PI) * 1);
  poly([[x + q(3 * s), yy - q(29 * s)], [x + q(26 * s), yy - q(15 * s) + fl], [x + q(3 * s), yy - q(3 * s)]], lit ? M(28) : M(12));
  poly([[x + q(3 * s), yy - q(29 * s)], [x + q(12 * s), yy - q(24 * s)], [x + q(3 * s), yy - q(6 * s)]], lit ? M(29) : M(11));
  for (let j = 1; j < 5; j++) line(x + q(3 * s), yy - q((29 - j * 5) * s), x + q((3 + 20 * (1 - j / 5)) * s), yy - q(15 * s), M(21));
  px(x + q(2 * s), yy - q(31 * s), M(15));
  // 划手 + 桨
  for (let r = 0; r < 2; r++) {
    const hx = x + q((r ? 9 : -8) * s), hy2 = yy - q(7 * s);
    disc(hx, hy2 - q(3 * s), Math.max(1, q(1.5 * s)), M(1));
    rect(hx - Math.max(1, q(1 * s)), hy2 - q(2 * s), Math.max(2, q(2 * s)), Math.max(2, q(3 * s)), M(1));
    const sw2 = Math.sin(ph * TWO_PI + r * 3.14) * 0.55;
    const ox = hx + q(Math.cos(sw2) * 15 * s), oy = yy + q(2 * s) + q(Math.sin(sw2) * 2 * s);
    line(hx, hy2, ox, oy, M(10));
    px(ox, oy, M(12)); px(ox + 1, oy + 1, M(20));
  }
  hline(x - q(20 * s), yy + q(8 * s), q(40 * s), M(20));
}
const BOAT_SETS = {
  0.6: bakeFrames('BOAT06', 72, 56, 6, (ph) => drawBoat(36, 44, 0.6, ph, true)),
  0.8: bakeFrames('BOAT08', 72, 56, 6, (ph) => drawBoat(36, 44, 0.8, ph, true)),
};
function boatReedBaked(x, y, s, t, lit) {
  const fs = s >= 0.7 ? BOAT_SETS[0.8] : BOAT_SETS[0.6];
  blit(fs[Math.floor(t * 5) % 6], x - 36, y - 44);
}

// ---------------------------------------------------------------- 帆船（大帆脉冲光带 = 4 帧）
function drawShip(ph) {
  const bx = 80, by = 100;
  // 船体与板缝
  poly([[bx - 62, by - 12], [bx + 62, by - 12], [bx + 48, by + 12], [bx - 48, by + 12]], M(9));
  poly([[bx - 62, by - 12], [bx + 62, by - 12], [bx + 54, by - 4], [bx - 54, by - 4]], M(11));
  for (let i = 0; i < 3; i++) hline(bx - 56 + i * 3, by + 1 + i * 3, 112 - i * 6, M(10));
  polyLine([[bx - 62, by - 12], [bx + 62, by - 12], [bx + 48, by + 12], [bx - 48, by + 12]], M(23), true);
  line(bx - 62, by - 12, bx - 72, by - 24, M(9));
  line(bx + 62, by - 12, bx + 72, by - 22, M(9));
  // 舷窗
  disc(bx + 10, by - 5, 3, M(10)); disc(bx + 10, by - 5, 2, M(15));
  // 桅、索具
  vline(bx, by - 80, 68, M(10)); vline(bx + 1, by - 80, 68, M(12));
  line(bx, by - 80, bx - 58, by - 13, M(12)); line(bx, by - 80, bx + 58, by - 13, M(12));
  // 大帆
  const SAIL = [[bx - 46, by - 70], [bx + 44, by - 70], [bx + 38, by - 22], [bx - 40, by - 22]];
  poly(SAIL, M(12));
  poly([[bx - 46, by - 70], [bx - 10, by - 70], [bx - 6, by - 22], [bx - 40, by - 22]], M(13));
  for (let j = 0; j <= 5; j++) {
    const yy = Math.round(lerp(by - 70, by - 22, j / 5));
    for (let xx = bx - 46; xx < bx + 44; xx++) if (inPoly(xx, yy, SAIL) && (xx >> 2) % 3) px(xx, yy, j === 0 ? M(8) : M(22));
  }
  for (let i = 0; i <= 6; i++) {
    const xx = Math.round(lerp(bx - 46, bx + 44, i / 6));
    for (let yy = by - 70; yy < by - 22; yy++) if (inPoly(xx, yy, SAIL)) px(xx, yy, (i + (yy >> 3)) % 3 ? M(21) : M(23));
  }
  polyLine(SAIL, M(23), true);
  // 帆上的脉冲光带（帧动画）
  for (let xx = bx - 46; xx < bx + 44; xx++) {
    const u = (xx - (bx - 46)) / 90;
    if (u < ph && u > ph - 0.10) for (let yy = by - 70; yy < by - 22; yy++) if (inPoly(xx, yy, SAIL)) px(xx, yy, M(16));
  }
  // 桅顶旗
  const wav = Math.round(Math.sin(ph * TWO_PI) * 1.2);
  poly([[bx, by - 80], [bx + 12, by - 78 + wav], [bx, by - 74]], M(18));
  px(bx + 4, by - 78 + wav, M(19));
  // 船上的人
  tinyPerson(bx + 50, by - 12, 1.6, M(1), true);
  tinyPerson(bx - 22, by - 12, 1.4, M(1));
  // 灯火
  disc(bx + 8, by - 16, 2, M(15));
  // 船体高光
  hline(bx - 58, by - 11, 112, M(12));
  px(bx + 26, by - 11, M(23)); px(bx + 27, by - 11, M(23));
}
const SHIP_FRAMES = bakeFrames('SHIP', 160, 132, 4, (ph) => drawShip(ph));

// ---------------------------------------------------------------- 鱼图标（6 帧摆尾）
function drawFishIcon(cx, cy, ph) {
  const q = Math.round, tw = Math.sin(ph * TWO_PI);
  const tx = cx + 9;
  poly([[tx, cy], [tx + q(8 + tw * 2), cy - 6], [tx + q(7 + tw * 2), cy + 5]], M(15));
  line(tx + 2, cy, tx + q(7 + tw * 2), cy - 4, M(29));
  poly([[cx - 10, cy], [cx - 4, cy - 6], [cx + 5, cy - 6], [cx + 9, cy], [cx + 5, cy + 6], [cx - 4, cy + 6]], M(15));
  poly([[cx - 2, cy - 6], [cx + 3, cy - 9], [cx + 6, cy - 6]], M(29));
  poly([[cx - 2, cy + 6], [cx + 2, cy + 8], [cx + 5, cy + 6]], M(29));
  arc(cx + 2, cy, 4, -1.0, 1.0, M(29));
  disc(cx - 4, cy - 2, 2, M(8)); px(cx - 4, cy - 2, M(0)); px(cx - 5, cy - 3, M(31));
  for (let i = 0; i < 3; i++) px(cx + i * 3, cy - 1 + (i & 1) * 3, M(29));
  hline(cx - 12, cy + 9, 6, M(8)); hline(cx - 8, cy + 11, 9, M(29));
  return tw;
}
const FISH_FRAMES = bakeFrames('FISHICON', 36, 24, 6, (ph) => drawFishIcon(18, 12, ph));
function fishIcon(cx, cy, t, ph = 0) {
  const fr = FISH_FRAMES[(((Math.floor(t * 8 + ph) % 6) + 6) % 6)];
  blit(fr, Math.round(cx) - 18, Math.round(cy) - 12);
}

// ---------------------------------------------------------------- 放大镜（静态，一次性）
function drawMag() {
  const cx = 38, cy = 38;
  line(cx + 21, cy + 21, cx + 33, cy + 33, M(10));
  line(cx + 22, cy + 20, cx + 34, cy + 32, M(12));
  rect(cx + 30, cy + 29, 6, 6, M(10));
  hline(cx + 30, cy + 29, 6, M(14));
  ring(cx, cy, 31, M(18)); ring(cx, cy, 30, M(8)); ring(cx, cy, 29, M(27));
  line(cx + 22, cy + 22, cx + 26, cy + 26, M(15));
  ring(cx, cy, 24, M(4));
  vline(cx, cy - 22, 45, M(3)); hline(cx - 22, cy, 45, M(3));
  arc(cx, cy, 26, -2.3, -1.0, M(27));
  px(cx - 9, cy - 9, M(8));
}
const MAG_FRAME = bakeFrames('MAGNIFIER', 76, 76, 1, () => drawMag())[0];

// ---------------------------------------------------------------- 神像（鱼头人身，一次性细化）
function drawStatue() {
  const cx = 85;
  // 旧坐标整体上移 100：y 世界 104..268 → 局部 4..168
  const y = (v) => v - 100;
  // 鱼头
  poly([[cx - 24, y(118)], [cx + 24, y(118)], [cx + 32, y(134)], [cx + 28, y(152)], [cx, y(160)], [cx - 28, y(152)], [cx - 32, y(134)]], M(21));
  poly([[cx + 4, y(118)], [cx + 24, y(118)], [cx + 32, y(134)], [cx + 28, y(152)], [cx + 6, y(158)]], M(22));
  // 吻部
  poly([[cx - 32, y(134)], [cx - 20, y(140)], [cx - 4, y(146)], [cx - 4, y(158)], [cx - 20, y(154)], [cx - 32, y(146)]], M(20));
  hline(cx - 28, y(148), 12, M(20)); px(cx - 26, y(143), M(23)); px(cx - 22, y(142), M(23));
  // 眼
  disc(cx - 14, y(136), 5, M(8)); disc(cx - 14, y(136), 2, M(0)); px(cx - 15, y(135), M(27));
  disc(cx + 14, y(136), 5, M(8)); disc(cx + 14, y(136), 2, M(0)); px(cx + 13, y(135), M(27));
  // 鳃
  arc(cx + 20, y(146), 9, -0.6, 1.2, M(20)); arc(cx + 20, y(146), 12, -0.6, 1.2, M(20));
  // 背鳍
  for (let i = 0; i < 6; i++) { const fx = cx - 18 + i * 7; poly([[fx, y(120)], [fx + 3, y(108)], [fx + 6, y(120)]], M(22)); }
  // 金项圈
  arc(cx, y(162), 26, 0.25, 2.9, M(15)); arc(cx, y(162), 23, 0.25, 2.9, M(29));
  for (let i = 0; i < 6; i++) { const a = 0.45 + i * 0.4; px(cx + Math.round(Math.cos(a) * 22), y(162) + Math.round(Math.sin(a) * 22), i % 2 ? M(19) : M(22)); }
  // 躯干
  poly([[cx - 22, y(164)], [cx + 22, y(164)], [cx + 32, y(236)], [cx - 32, y(236)]], M(22));
  // 鳞（每行错位 + 高光）
  for (let yy = y(168); yy < y(232); yy += 5) {
    for (let xx = cx - 28 + ((((yy - y(168)) / 5) | 0) & 1) * 4; xx < cx + 30; xx += 8) {
      px(xx, yy, M(23)); px(xx + 1, yy + 1, M(21));
      if (((xx + yy) & 7) === 0) px(xx + 2, yy, M(20));
    }
  }
  // 腰带
  hline(cx - 30, y(218), 60, M(15)); hline(cx - 30, y(219), 60, M(29));
  for (let xx = cx - 24; xx < cx + 28; xx += 10) px(xx, y(219), M(19));
  // 双臂
  poly([[cx - 22, y(170)], [cx - 32, y(174)], [cx - 36, y(206)], [cx - 28, y(208)]], M(21));
  poly([[cx + 22, y(170)], [cx + 32, y(174)], [cx + 36, y(206)], [cx + 28, y(208)]], M(21));
  hline(cx - 35, y(190), 8, M(15)); px(cx - 33, y(191), M(29));
  hline(cx + 29, y(190), 8, M(15)); px(cx + 31, y(191), M(29));
  // 手
  disc(cx - 32, y(210), 4, M(22)); disc(cx + 32, y(210), 4, M(22));
  // 左手桶
  rect(cx - 44, y(214), 15, 13, M(12));
  hline(cx - 44, y(214), 15, M(14)); hline(cx - 42, y(220), 11, M(15));
  arc(cx - 37, y(214), 7, Math.PI, 2 * Math.PI, M(10));
  // 右手锥
  poly([[cx + 32, y(212)], [cx + 39, y(202)], [cx + 43, y(212)]], M(14));
  hline(cx + 38, y(203), 4, M(16));
  // 裙摆与基座
  rect(cx - 32, y(236), 64, 16, M(20));
  hline(cx - 32, y(236), 64, M(12));
  for (let i = 0; i < 5; i++) vline(cx - 24 + i * 12, y(238), 12, M(19));
  rect(cx - 52, y(252), 104, 16, M(12));
  hline(cx - 52, y(252), 104, M(14));
  for (let xx = cx - 44; xx < cx + 44; xx += 12) rect(xx, y(258), 7, 2, M(11));
  // 基座铭文
  for (let i = 0; i < 7; i++) { px(cx - 36 + i * 12, y(262), M(10)); px(cx - 34 + i * 12, y(263), M(13)); }
}
const STATUE_FRAME = bakeFrames('STATUE', 170, 180, 1, () => drawStatue())[0];
function statueGodBaked(t) {
  glowSpot(320, 210, 82, 1, 0.16 + 0.05 * Math.sin(t * 2.0));
  blit(STATUE_FRAME, 235, 100);
  const ek = 0.35 + 0.25 * Math.sin(t * 3.4);
  glowSpot(306, 136, 8, 1, 0.16 * ek);
  glowSpot(334, 136, 8, 1, 0.16 * ek);
}

// ---------------------------------------------------------------- 塔庙角旗（6 帧）
function drawFlag(ph) {
  const wav = Math.round(Math.sin(ph * TWO_PI) * 2);
  vline(1, 0, 25, M(10)); px(1, 0, M(14));
  poly([[1, 2], [16, 4 + wav], [13, 11 + wav], [1, 13]], M(18));
  px(5, 4 + wav, M(19)); px(9, 6 + wav, M(19));
  polyLine([[1, 2], [16, 4 + wav], [13, 11 + wav], [1, 13]], M(15), false);
}
const FLAG_FRAMES = bakeFrames('FLAG', 20, 26, 6, (ph) => drawFlag(ph));
function zigguratBaked(t) {
  const tiers = [
    [340, 600, 236, 262],
    [364, 576, 214, 236],
    [388, 552, 194, 214],
    [412, 528, 176, 194],
  ];
  for (const [x0, x1, y0, y1] of tiers) {
    rect(x0, y0, x1 - x0, y1 - y0, M(12));
    hline(x0, y0, x1 - x0, M(14));
    hline(x0, y0 + 1, x1 - x0, M(13));
    hline(x0, y1 - 1, x1 - x0, M(10));
    vline(x0, y0, y1 - y0, M(13));
    vline(x1 - 1, y0, y1 - y0, M(10));
    // 砖缝：两层错缝 + 竖向短缝
    for (let yy = y0 + 5; yy < y1; yy += 5) {
      hline(x0 + 2, yy, x1 - x0 - 4, M(11));
      for (let xx = x0 + 18 + ((yy / 5) & 1) * 17; xx < x1 - 8; xx += 34) px(xx, yy - 2, M(10));
    }
    // 角部隅石
    for (let xx = x0 + 2; xx < x0 + 10; xx += 4) vline(xx, y0 + 3, y1 - y0 - 4, M(13));
    for (let xx = x1 - 9; xx < x1 - 2; xx += 4) vline(xx, y0 + 3, y1 - y0 - 4, M(11));
  }
  // 中央大台阶（朝祭坛）
  for (let yy = 258; yy > 178; yy -= 4) {
    const w = 30 + (258 - yy) * 0.10;
    hline(470 - w / 2, yy, w, M(14));
    hline(470 - w / 2 + 2, yy + 1, w - 4, M(11));
    px(470 - w / 2, yy, M(13)); px(470 + w / 2 - 1, yy, M(10));
  }
  // 蓝釉饰带
  hline(342, 240, 256, M(21)); hline(342, 241, 256, M(20));
  hline(366, 218, 208, M(21)); hline(366, 219, 208, M(20));
  hline(390, 198, 160, M(21)); hline(390, 199, 160, M(20));
  // 顶层神庙
  rect(444, 152, 52, 24, M(12));
  hline(444, 152, 52, M(14));
  rect(466, 160, 8, 16, M(0));
  arc(470, 160, 4, Math.PI, 2 * Math.PI, M(15));
  hline(444, 168, 52, M(15));
  px(448, 156, M(15)); px(492, 156, M(15));
  px(470, 148, M(15)); px(470, 147, M(16));
  // 角旗（sprite 帧）
  for (const [fx, fy] of [[344, 236], [506, 176]]) {
    blit(FLAG_FRAMES[Math.floor((t * 6 + fx) % 6)], fx - 1, fy - 24);
  }
}

// ---------------------------------------------------------------- 月（细化陨石坑）
function moonBaked(f, cx, cy, r) {
  for (let j = -r - 16; j <= r + 16; j++) for (let i = -r - 16; i <= r + 16; i++) {
    const d = Math.sqrt(i * i + j * j);
    if (d < r + 16 && d > r) { const t = (r + 16 - d) / 16; if (bay(cx + i, cy + j) < t * 0.5) px(cx + i, cy + j, E.moonG); }
  }
  disc(cx, cy, r, E.moon);
  // 月海
  disc(cx - Math.round(r * 0.30), cy - Math.round(r * 0.22), Math.round(r * 0.46), M(8));
  disc(cx + Math.round(r * 0.34), cy + Math.round(r * 0.30), Math.round(r * 0.26), M(8));
  // 环形山（坑缘暗、坑底亮）
  for (let i = 0; i < 14; i++) {
    const a = hash(i, 3) * TWO_PI, rr = hash(i, 5) * (r - 3);
    const mx = cx + Math.round(Math.cos(a) * rr), my = cy + Math.round(Math.sin(a) * rr);
    const mr = 1 + (i % 3);
    px(mx, my, M(7)); px(mx + 1, my, M(7));
    if (mr > 1) { px(mx, my + 1, M(7)); px(mx + 1, my + 1, M(31)); }
  }
  // 右侧晨昏线
  for (let y = -r + 2; y <= r - 2; y++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
    for (let i = 0; i < 4; i++) if (bay(cx + w - i, cy + y) < 0.5) px(cx + w - i, cy + y, M(7));
  }
}

// ---------------------------------------------------------------- 乌鸦（2 帧拍翅）
function drawCrow(flap) {
  const x = 7, y = 5, c = M(0);
  for (const [dx, dy] of [[0, -2], [1, -1], [2, 0], [1, 1], [0, 1], [-1, 1]]) px(x + dx, y + dy, c);
  if (flap) { for (const [dx, dy] of [[-3, -2], [-2, -1], [-1, 0], [3, -1], [4, -1]]) px(x + dx, y + dy, c); }
  else { for (const [dx, dy] of [[-3, 2], [-2, 1], [-1, 1], [3, 2], [4, 2]]) px(x + dx, y + dy, c); }
}
const CROW_FRAMES = bakeFrames('CROW', 14, 10, 2, (ph, i) => drawCrow(i === 0));
function crowBaked(f, x, y) {
  blit(CROW_FRAMES[((f / 3) | 0) & 1], x - 7, y - 5);
}

// ---------------------------------------------------------------- 尘埃（全片降密降速）
function dustMotesBaked(t, n, seed, x0, x1, y0, y1, c = M(6)) {
  const m = Math.max(2, Math.round(n * 0.55));
  for (let i = 0; i < m; i++) {
    const sp = (2.2 + hash(i, seed) * 4.0) * 0.45;
    const x = x0 + ((hash(i, seed + 1) * (x1 - x0) + t * sp) % (x1 - x0));
    const y = y0 + ((hash(i, seed + 2) * (y1 - y0) + t * sp * 0.3 + Math.sin(t * 0.9 + i) * 4) % (y1 - y0));
    px(Math.round(x), Math.round(y), hash(i, seed + 3) < 0.28 ? M(15) : c);
  }
}

// ---------------------------------------------------------------- 静态道具细化：石像 / 柱鼓 / 神庙柱
function relicBaked(x, gy, s, lean, opt = {}) {
  const q = Math.round;
  const xT = q(x + lean);
  const shY = q(gy - 60 * s);
  const hem = q(gy);
  // 落地投影
  for (let i = -q(17 * s); i <= q(17 * s); i++) if (bay(x + i, gy + 1) < 0.5) px(x + i, gy + 1, M(9));
  // 袍身
  poly([[xT - q(11 * s), shY], [xT + q(11 * s), shY], [x + q(15 * s), hem], [x - q(15 * s), hem]], M(14));
  poly([[xT - q(11 * s), shY], [xT - q(4 * s), shY], [x + q(2 * s), hem], [x - q(15 * s), hem]], M(28));
  poly([[xT + q(5 * s), shY], [xT + q(11 * s), shY], [x + q(15 * s), hem], [x + q(7 * s), hem]], M(11));
  // 衣褶（双线 + 细点）
  line(xT - q(5 * s), shY + q(6 * s), x - q(8 * s), hem - q(2 * s), M(27));
  line(xT - q(3 * s), shY + q(7 * s), x - q(6 * s), hem - q(2 * s), M(26));
  line(xT + q(4 * s), shY + q(6 * s), x + q(8 * s), hem - q(2 * s), M(10));
  line(xT + q(2 * s), shY + q(8 * s), x + q(6 * s), hem - q(2 * s), M(12));
  for (let j = shY + q(10 * s); j < hem - q(4 * s); j += Math.max(3, q(5 * s))) {
    px(x - q(10 * s) + ((j >> 1) % 3), j, M(13));
    px(x + q(10 * s) + ((j >> 1) % 2), j, M(10));
  }
  // 下摆
  hline(x - q(15 * s), hem - 1, q(30 * s), M(12));
  for (let i = -q(14 * s); i <= q(14 * s); i += Math.max(3, q(3 * s))) px(x + i, hem - 2, (i & 6) === 0 ? M(15) : M(13));
  // 肩披
  poly([[xT - q(13 * s), shY + q(2 * s)], [xT + q(13 * s), shY + q(2 * s)], [xT + q(9 * s), shY - q(5 * s)], [xT - q(9 * s), shY - q(5 * s)]], M(13));
  hline(xT - q(13 * s), shY + q(2 * s), q(26 * s), M(12));
  hline(xT - q(12 * s), shY + q(1 * s), q(24 * s), M(14));
  px(xT - q(11 * s), shY + q(2 * s), M(15)); px(xT + q(5 * s), shY + q(2 * s), M(15));
  // 头
  rect(xT - q(6 * s), shY - q(17 * s), q(12 * s), q(13 * s), M(28));
  vline(xT - q(6 * s), shY - q(17 * s), q(13 * s), M(8));
  vline(xT + q(5 * s), shY - q(17 * s), q(13 * s), M(27));
  hline(xT - q(5 * s), shY - q(15 * s), q(10 * s), M(27));
  // 三层高冠（每层加金线）
  rect(xT - q(8 * s), shY - q(23 * s), q(16 * s), q(6 * s), M(28));
  rect(xT - q(6 * s), shY - q(28 * s), q(12 * s), q(5 * s), M(27));
  rect(xT - q(4 * s), shY - q(32 * s), q(8 * s), q(4 * s), M(28));
  hline(xT - q(8 * s), shY - q(18 * s), q(16 * s), M(15));
  hline(xT - q(6 * s), shY - q(24 * s), q(12 * s), M(15));
  hline(xT - q(4 * s), shY - q(29 * s), q(8 * s), M(15));
  for (let i = -q(7 * s); i <= q(7 * s); i += Math.max(2, q(3 * s))) px(xT + i, shY - q(26 * s), M(27));
  disc(xT, shY - q(34 * s), Math.max(1, q(2 * s)), M(15));
  px(xT, shY - q(35 * s), M(16));
  // 受光边
  vline(xT - q(8 * s), shY - q(23 * s), q(6 * s), M(8));
  vline(xT - q(6 * s), shY - q(17 * s), q(12 * s), M(8));
  vline(xT - q(13 * s), shY - q(5 * s), q(7 * s), M(8));
  // 面部
  if (opt.face) {
    px(xT - Math.max(1, q(3 * s)), shY - q(13 * s), M(10));
    px(xT + Math.max(1, q(2 * s)), shY - q(13 * s), M(10));
    px(xT - Math.max(1, q(3 * s)) - 1, shY - q(14 * s), M(27));
    hline(xT - q(2 * s), shY - q(19 * s), q(5 * s), M(27));
    hline(xT - q(1 * s), shY - q(10 * s), q(3 * s), M(10));
  }
  hline(xT - q(6 * s), shY - q(15 * s), q(12 * s), M(27));
}
function drumBaked(x, y, w, r) {
  rect(x, y - r, w, r * 2 + 1, M(13));
  for (let i = 1; i < 6; i++) {
    const xx = x + Math.round(i * w / 6);
    vline(xx, y - r + 2, r * 2 - 3, M(12));
    vline(xx + 1, y - r + 3, r * 2 - 4, M(14));
  }
  hline(x, y - r, w, M(14)); hline(x, y - r + 1, w, M(15));
  hline(x, y + r, w, M(10));
  // 端面
  disc(x, y, r, M(14)); disc(x + w, y, r, M(12));
  ring(x, y, Math.max(2, r - 2), M(11)); disc(x, y, Math.max(1, r - 3), M(13));
  ring(x + w, y, Math.max(2, r - 2), M(11));
  px(x - 1, y - 2, M(10)); px(x + w + 1, y + 1, M(9));
  for (let i = 0; i < 3; i++) px(x + Math.round(w * 0.3) + i * 5, y - r + 1, M(9));
}
function columnBaked(x, w, y0, y1, dim = 0) {
  const base = dim ? M(10) : M(12);
  rect(x, y0, w, y1 - y0, base);
  // 凹槽：双线
  for (let i = 2; i < w - 2; i += 4) {
    vline(x + i, y0 + 6, y1 - y0 - 12, dim ? M(11) : M(13));
    vline(x + i + 1, y0 + 7, y1 - y0 - 14, dim ? M(10) : M(11));
  }
  vline(x + w - 3, y0 + 6, y1 - y0 - 12, M(9));
  // 柱头
  rect(x - 4, y0, w + 8, 7, dim ? M(11) : M(13));
  hline(x - 4, y0, w + 8, M(14));
  hline(x - 4, y0 + 1, w + 8, M(15));
  // 涡卷
  for (const cx0 of [x - 1, x + w]) {
    disc(cx0, y0 + 8, 4, dim ? M(11) : M(13));
    ring(cx0, y0 + 8, 3, dim ? M(10) : M(12));
    px(cx0, y0 + 8, M(9)); px(cx0 + 1, y0 + 6, dim ? M(12) : M(14));
    arc(cx0, y0 + 8, 2, 0.4, 4.4, dim ? M(10) : M(12));
  }
  // 颈带
  rect(x - 3, y0 + 16, w + 6, 5, M(18));
  hline(x - 3, y0 + 16, w + 6, M(19));
  rect(x - 3, y0 + 21, w + 6, 3, dim ? M(20) : M(21));
  hline(x - 3, y0 + 21, w + 6, M(20));
  for (let i = 0; i < w; i += 6) px(x + i, y0 + 18, M(15));
  // 柱础
  rect(x - 4, y1 - 9, w + 8, 9, dim ? M(11) : M(13));
  hline(x - 4, y1 - 9, w + 8, M(14));
  hline(x - 5, y1 - 2, w + 10, M(12));
  px(x - 2, y1 - 4, M(9)); px(x + w + 1, y1 - 5, M(9));
}

// ---------------------------------------------------------------- 示意图：知识曲线 / 柱状图 / 星座 / 基因
const CEIL_PTS = [[88, 168], [150, 140], [220, 122], [300, 108], [390, 100], [480, 96], [576, 96]];
const CEIL_FRAMES = bakeFrames('CEIL', 520, 96, 12, (ph, i) => {
  const k = i / 11;
  const pts = CEIL_PTS.map(([x, y]) => [x - 60, y - 84]);
  polyPath(pts, M(15), false, 0, k);
  polyPath(pts.map(([x, y]) => [x, y - 3]), M(29), false, 0, k);
});

const BAR_VALS = [8, 12, 16, 21, 27, 33, 37, 44, 49, 54, 57, 61, 60, 64, 67, 70, 68, 72, 74, 69, 73, 76, 75, 79, 80, 82];
function drawBars(u) {
  for (let i = 0; i < BAR_VALS.length; i++) {
    const grow = clamp(u * 1.35 - i * 0.028, 0, 1);
    const h = Math.round(BAR_VALS[i] * 1.75 * grow);
    if (h <= 0) continue;
    const bx = (92 + i * 18) - 84, w = 12, top = 150 - h;
    const near = h > 132;
    rect(bx, top, w, h, near ? M(29) : M(22));
    rect(bx + 1, top, w - 2, Math.max(1, Math.round(h * 0.55)), near ? M(15) : M(23));
    hline(bx, top, w, near ? M(16) : M(8));
    vline(bx, top, h, near ? M(19) : M(20));
    px(bx + 2, top + 2, M(0)); px(bx + w - 3, top + 2, M(0));
    for (let j = 4; j < h - 2; j += 8) px(bx + w - 2, top + j, near ? M(15) : M(23));
  }
}
const BAR_FRAMES = bakeFrames('BARS', 480, 156, 34, (ph, i) => drawBars(i * 0.04));

const CON_PTS = [[140, 60], [200, 44], [266, 52], [318, 40], [372, 54], [330, 92], [260, 100], [196, 88]];
const CON_FRAMES = bakeFrames('SHIPCON', 260, 90, 12, (ph, i) => {
  polyPath(CON_PTS.map(([x, y]) => [x - 130, y - 30]), M(21), true, 0, i / 11);
});
// FISH_CON 由片头段（demo/film.js）定义，这里直接复用
const CON_FISH_LENS = FISH_CON.map(([x, y], i) => {
  const b = FISH_CON[(i + 1) % FISH_CON.length];
  return Math.hypot(b[0] - x, b[1] - y);
});
const CON_FISH_TOTAL = CON_FISH_LENS.reduce((a, b) => a + b, 0);
const CON_FISH_FRAMES = bakeFrames('FISHCON', 340, 110, 12, (ph, i) => {
  const p = i / 11;
  const pts = FISH_CON.map(([x, y]) => [x - 140, y - 50]);
  polyPath(pts, M(29), true, 0, p);
  polyPath(pts.map(([x, y]) => [x, y - 1]), M(15), true, 0, p * 0.7);
  let run = 0;
  for (let j = 0; j < FISH_CON.length; j++) {
    if (p >= run / CON_FISH_TOTAL - 0.001) {
      const lx = FISH_CON[j][0] - 140, ly = FISH_CON[j][1] - 50;
      disc(lx, ly, 2, M(15)); px(lx, ly, M(8));
    }
    run += CON_FISH_LENS[j];
  }
});

function drawCanoe(ph) {
  const bob = Math.round(Math.sin(ph * TWO_PI));
  poly([[6, 24 + bob], [34, 24 + bob], [29, 29 + bob], [11, 29 + bob]], M(9));
  px(5, 23 + bob, M(9)); px(35, 23 + bob, M(9));
  hline(12, 25 + bob, 18, M(11));
  vline(22, 14 + bob, 10, M(9)); disc(22, 12 + bob, 2, M(9));
  const sw = Math.sin(ph * TWO_PI) * 0.6;
  const ex = Math.round(22 + Math.cos(sw + 0.4) * 12), ey = Math.round(26 + Math.sin(sw + 0.4) * 4);
  line(24, 18 + bob, ex, ey, M(9));
  px(ex, ey, M(9)); px(ex + 1, ey + 1, M(9));
  return bob;
}
const CANOE_FRAMES = bakeFrames('CANOE', 40, 32, 4, (ph) => drawCanoe(ph));

function drawHelix(ph) {
  const cx = 22, top = 5;
  for (let k = 0; k < 34; k++) {
    const a = k * 0.42 + ph * TWO_PI;
    const x1 = cx + Math.round(Math.sin(a) * 10), x2 = cx - Math.round(Math.sin(a) * 10);
    px(x1, top + k, (k & 4) ? M(22) : M(15));
    px(x2, top + k, (k & 4) ? M(15) : M(22));
    if (k % 4 === 0) line(x1, top + k, x2, top + k, M(26));
  }
}
const HELIX_FRAMES = bakeFrames('HELIX', 44, 48, 12, (ph) => drawHelix(ph));

// ---------------------------------------------------------------- 第 7 镜（星图）用 sprite 重写星座与苇舟
function bayShotFBaked(t, f) {
  const jx = Math.round(Math.sin(t * 10.5) * 0.9), jy = Math.round(Math.cos(t * 8.5) * 0.7);
  GX += jx; GY += jy;
  const pan = Math.round(2 - (t - 6.96) * 1.4);
  GX += pan;
  // 夜空
  skyBand(-8, 122, E.sky0, E.sky1);
  skyBand(122, 184, E.sky1, E.sky2);
  skyBand(184, 214, E.sky2, E.sky3);
  stars(f);
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(hash(i, 31) * W), y = Math.floor(hash(i, 33) * 172);
    const ph = (f / 22 + hash(i, 35)) % 1;
    if (ph < 0.42) px(x, y, ph < 0.1 ? M(8) : M(7));
  }
  moon(f, 516, 58, 20);
  // 海
  rect(-10, 212, 660, 94, M(20));
  dithGrad(-10, 214, 660, 258, M(21), M(20));
  hline(-10, 212, 660, M(21));
  // 月光碎道
  for (let i = 0; i < 72; i++) {
    const u = hash(i, 41);
    const yy = 214 + Math.floor(Math.pow(u, 0.8) * 88);
    const spread = 6 + (yy - 214) * 0.30;
    const xx = 516 + Math.round((hash(i, 43) - 0.5) * spread * 2 + Math.sin(t * 2.2 + i * 1.7) * 3);
    if (hash(i, 45) < 0.28 + (yy - 214) / 420) continue;
    const len = 2 + Math.floor(hash(i, 47) * 4);
    hline(xx, yy, len, hash(i, 49) < 0.35 ? M(8) : M(7));
    if (hash(i, 51) < 0.5) px(xx + len + 1, yy, M(21));
  }
  // 波浪
  for (let i = 0; i < 46; i++) {
    const yy = 216 + Math.floor(hash(i, 51) * 84);
    const speed = 5 + hash(i, 53) * 9;
    const xx = ((hash(i, 55) * 700 + t * speed) % 700) - 30;
    const len = 3 + Math.floor(hash(i, 57) * 12);
    hline(Math.round(xx), Math.round(yy), len, hash(i, 59) < 0.25 ? M(22) : M(21));
  }
  // 远岸与远处灯火
  poly([[486, 212], [520, 206], [560, 209], [600, 204], [642, 207], [642, 212]], M(0));
  rect(556, 196, 12, 8, M(0));
  hline(560, 194, 4, M(0));
  if (((f >> 3) & 1) === 0) px(557, 200, M(15));
  if (((f >> 4) & 1) === 0) px(566, 202, M(16));
  // 苇舟（4 帧 sprite）
  const bx = Math.round(196 - (t - 6.96) * 9);
  const by = 224 + Math.round(Math.sin(t * 1.6) * 1);
  blit(CANOE_FRAMES[Math.floor(t * 6) % 4], bx - 20, by - 24);
  // 鱼形星座：帧表 + 节点闪烁
  const p = clamp((t - 7.02) / 1.15, 0, 1);
  blit(CON_FISH_FRAMES[Math.min(11, Math.floor(p * 12))], 140, 50);
  let run = 0;
  for (let i = 0; i < FISH_CON.length; i++) {
    const lit = p >= run / CON_FISH_TOTAL - 0.001;
    const tw = 0.5 + 0.5 * Math.sin(f * 0.4 + i * 2.1);
    if (lit) glowSpot(FISH_CON[i][0], FISH_CON[i][1], 7, 1, 0.22 + 0.2 * tw);
    else px(FISH_CON[i][0], FISH_CON[i][1], M(7));
    run += CON_FISH_LENS[i];
  }
  // 鱼眼星
  if (p > 0.55) {
    const k = clamp((p - 0.55) / 0.25, 0, 1);
    glowSpot(442, 92, 10, 1, 0.5 * k);
    disc(442, 92, 2, M(16)); px(442, 92, M(8));
  }
  labelBlock('波斯湾', 'PERSIAN GULF', 24, 12, 2);
  dustMotes(t, 10, 61, 40, 600, 60, 200, M(7));
  GX -= jx; GY -= jy;
  GX -= pan;
}

// ---------------------------------------------------------------- 用烘焙版本覆盖片头段的同名函数
// 模块里函数声明是可变绑定：片头段（demo/film.js，逐字节不动）里的调用点会在渲染时
// 命中这里重新赋过值的实现。必须在 tail 组装 SHOTS 之前执行——本文件排序在 90-tail 之前。
apkallu = apkalluBaked;
worshipper = worshipperBaked;
palm = palmBaked;
incense = incenseBaked;
boatReed = boatReedBaked;
statueGod = statueGodBaked;
ziggurat = zigguratBaked;
moon = moonBaked;
crow = crowBaked;
dustMotes = dustMotesBaked;
relic = relicBaked;
drum = drumBaked;
column = columnBaked;
bayShotF = bayShotFBaked;
