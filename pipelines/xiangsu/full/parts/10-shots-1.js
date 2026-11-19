// ================================================================== s08 上岸授课 10.10–16.70
function shot08(t, f) {
  const u = t - 10.10;
  skyBand(-10, 204, M(2), M(3));
  skyBand(204, 238, M(3), M(24));
  stars(f);
  halo(512, 52, 150, 110, R_COLD, 0.82, 2.1);
  moon(f, 512, 52, 19);
  // 远岸
  poly([[-10, 234], [56, 228], [132, 232], [214, 226], [300, 231], [384, 225], [468, 230], [556, 226], [650, 231], [650, 240], [-10, 240]], M(31));
  // 海
  rect(-10, 238, 660, 66, M(21));
  dither(300, 274, 700, 44, M(22), 0.42);
  halo(320, 284, 400, 96, R_TEAL, 0.55, 2.0);
  hline(-10, 238, 660, M(23));
  for (let i = 0; i < 42; i++) {
    const yy = 242 + Math.floor(hash(i, 121) * 58);
    const xx = ((hash(i, 123) * 700 + t * (5 + hash(i, 125) * 8)) % 700) - 30;
    hline(Math.round(xx), yy, 3 + Math.floor(hash(i, 127) * 9), hash(i, 129) < 0.3 ? M(22) : M(21));
  }
  for (let i = 0; i < 40; i++) {
    const yy = 240 + Math.floor(hash(i, 131) * 60);
    const xx = 512 + Math.round((hash(i, 133) - 0.5) * (10 + (yy - 238)));
    if (hash(i, 135) < 0.5) px(xx, yy, hash(i, 137) < 0.4 ? M(7) : M(6));
  }
  // 月光在海面拉出一条光路
  for (let i = 0; i < 110; i++) {
    const yy = 240 + Math.floor(hash(i, 171) * 64);
    const sp = 8 + (yy - 238) * 1.1;
    const xx = 512 + Math.round((hash(i, 173) - 0.5) * sp * 2);
    if (hash(i, 175) < 0.62) px(xx, yy, hash(i, 177) < 0.35 ? M(8) : M(7));
  }
  // 鱼人背后的水光（强背光：鱼人是暗剪影）
  halo(200, 214, 152, 98, R_COLD, 1.0, 2.4);
  // 出水 / 入水
  let off;
  if (u < 0.95) off = Math.round(142 * Math.pow(1 - clamp(u / 0.95, 0, 1), 2.2));
  else if (u < 4.55) off = Math.round(Math.sin(t * 2.1) * 1.4);
  else off = Math.round(152 * Math.pow(clamp((u - 4.55) / 0.8, 0, 1), 2));
  const wl = 258;
  apkallu(196, wl, off, t);
  // 水线以下压回海里
  rect(-10, wl, 660, 306 - wl, M(20));
  for (let y = wl; y < 306; y++) {
    const t2 = (y - wl) / 48;
    for (let x = -10; x < 650; x++) if (bay(x, y) < t2 * 0.62) px(x, y, t2 < 0.5 ? M(22) : M(21));
  }
  // 水线浪峰
  for (let i = 0; i < 90; i++) {
    const xx = 40 + i * 6.6;
    const yy = wl + Math.round(Math.sin(xx * 0.06 + t * 2.4) * 1.6);
    px(Math.round(xx), yy, (i & 1) ? M(23) : M(22));
  }
  // 人鱼潜回水下后，水线上一圈圈散开的涟漪（压扁的椭圆）
  if (u > 4.95) {
    const r0 = u - 4.95;
    for (let k = 0; k < 3; k++) {
      const rr = (r0 * 34 + k * 26) % 78;
      if (rr < 4) continue;
      ellipse(196, wl + 1, Math.round(rr * 1.9), Math.round(rr * 0.42), k === 0 ? M(23) : M(22));
    }
    for (let k = 0; k < 5; k++) {
      const bx2 = 196 + Math.round(Math.sin(t * 2 + k * 1.3) * (6 + k * 5));
      const by2 = wl - 4 - ((t * 12 + k * 17) % 42);
      if (by2 > 214) px(bx2, Math.round(by2), M(23));
    }
  }
  // 水花
  const splash = (u < 0.95 ? 1 - u / 0.95 : u > 4.55 ? clamp((u - 4.55) / 0.5, 0, 1) : 0);
  if (splash > 0) {
    const n = Math.round(70 * splash);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (hash(i, 141) - 0.5) * 2.6;
      const sp = 40 + hash(i, 143) * 120, dt = splash * 0.55;
      const xx = 196 + Math.cos(a) * sp * dt;
      const yy = wl + Math.sin(a) * sp * dt + 240 * dt * dt;
      if (yy < wl + 4) px(Math.round(xx), Math.round(yy), i % 4 === 0 ? M(8) : i % 2 ? M(7) : M(6));
    }
    for (let i = 0; i < 3; i++) {
      const rr = Math.round(splash * 62 - i * 12);
      if (rr < 4) continue;
      ellipse(196, wl + 2, rr, Math.round(rr * 0.2), i === 0 ? M(7) : M(21));
    }
  }
  // 授课面板
  const panels = [
    { k: 'temple', zh: '盖庙', en: 'TEMPLE', x: 350, y: 34, at: 1.00 },
    { k: 'tablet', zh: '法律', en: 'LAW', x: 490, y: 34, at: 2.15 },
    { k: 'wheat', zh: '农业·几何', en: 'FARM / GEO', x: 350, y: 128, at: 3.05 },
    { k: 'flood', zh: '深海', en: 'DEEP SEA', x: 490, y: 128, at: 4.55 },
  ];
  for (const pn of panels) {
    const k = clamp((u - pn.at) / 0.24, 0, 1);
    if (k <= 0) continue;
    const bx = pn.x + Math.round((1 - k) * 34), by = pn.y;
    panelBox(bx, by, 124, 86, null, null, k < 0.5 ? M(8) : M(15));
    const ix = bx + 62, iy = by + 50;
    icon(pn.k, ix, iy, 2, M(15), M(22));
    text(pn.zh, bx + 10, by + 8, M(15), 1);
    hline(bx + 10, by + 22, textW(pn.zh), M(18));
    text(pn.en, bx + 10, by + 74, M(26), 1);
    if (k < 1) { for (let s = 0; s < 40; s++) px(bx + Math.round(hash(s, 5) * 124), by + Math.round(hash(s, 9) * 86), M(8)); }
    // 与鱼人之间的虚线
    const sx0 = 250, sy0 = 186;
    for (let s = 0; s < 26; s++) {
      const kk = s / 26;
      px(Math.round(lerp(sx0, bx, kk)), Math.round(lerp(sy0, by + 60, kk)), M(23));
    }
  }
  hud('授业', 'THE TEACHING');
  dustMotes(t, 10, 151, 300, 620, 40, 220, M(7));
}

// ================================================================== s09 知识天花板 16.70–19.84
function shot09(t, f) {
  const u = t - 16.70;
  skyBand(-10, H, M(1), M(2));
  // 天花板方向的天光
  halo(340, 118, 340, 96, R_GOLD, 0.3, 2.3);
  grid(60, 36, 516, 244, M(3), 22);
  hline(60, 280, 516, M(27));
  vline(60, 36, 244, M(27));
  for (let x = 60; x <= 576; x += 44) { vline(x, 276, 5, M(26)); }
  text('时间', 586, 272, M(7), 1);
  text('知识', 62, 26, M(7), 1);
  // 天花板：鱼的传授（预烘焙 12 帧生长曲线）
  const kc = clamp(u / 1.15, 0, 1);
  blit(CEIL_FRAMES[Math.min(11, Math.floor(kc * 12))], 60, 84);
  if (kc > 0.98) {
    for (let x = 90; x < 576; x += 10) px(x, 99, M(15));
    const fx = 100 + ((t * 46) % 470);
    fishIcon(fx, 88, t);
    text('鱼的传授', 452, 76, M(15), 1);
    text('THE APKALLU LINE', 452, 86, M(26), 1);
  }
  // 人类知识柱（预烘焙 34 帧生长柱状图）
  const vals = BAR_VALS;
  const n = vals.length;
  blit(BAR_FRAMES[Math.min(33, Math.floor(u / 0.04))], 84, 128);
  // 封顶线：最后一根顶到天花板就回弹
  const last = 278 - Math.round(vals[n - 1] * 1.75);
  text('封顶', 480, 284, M(19), 1);
  if (u > 2.35) {
    const k = clamp((u - 2.35) / 0.5, 0, 1);
    const yy = Math.round(lerp(last - 8, last + 6, Math.sin(k * 3.14)));
    hline(92 + (n - 1) * 18 - 4, yy, 20, M(16));
  }
  hud('知识天花板', 'CEILING OF KNOWLEDGE');
}

// ================================================================== s10 卷宗 → 绿洲假说 19.84–26.88
function shot10(t, f) {
  const u = t - 19.84;
  phase(t, 22.40, 0.34, () => {
    // 桌面
    skyBand(-10, H, M(9), M(10));
    for (let y = 40; y < H; y += 26) hline(-10, y, 660, M(11));
    glowSpot(540, 40, 120, 1, 0.16);
    // 卷宗
    const fx = 150, fy = 46, fw = 330, fh = 226;
    rect(fx + 4, fy + 4, fw, fh, M(0));
    rect(fx, fy, fw, fh, M(13));
    rect(fx + 4, fy + 4, fw - 8, fh - 8, M(14));
    poly([[fx + 20, fy], [fx + 120, fy], [fx + 110, fy - 18], [fx + 34, fy - 18]], M(13));
    text('CASE FILE', fx + 20, fy + 16, M(10), 2);
    text('001 — 波斯湾', fx + 20, fy + 44, M(10), 1);
    hline(fx + 20, fy + 58, fw - 40, M(12));
    // 卷内照片：海湾
    const px0 = fx + 20, py0 = fy + 70, pw = 150, ph = 92;
    rect(px0 + 2, py0 + 2, pw, ph, M(0));
    rect(px0, py0, pw, ph, M(28));
    rect(px0 + 4, py0 + 4, pw - 8, ph - 8, M(20));
    poly([[px0 + 14, py0 + 30], [px0 + 50, py0 + 20], [px0 + 96, py0 + 44], [px0 + 130, py0 + 70],
      [px0 + 96, py0 + 82], [px0 + 48, py0 + 60], [px0 + 16, py0 + 66]], M(13));
    for (let i = 0; i < 20; i++) px(px0 + 8 + Math.floor(hash(i, 9) * 130), py0 + 8 + Math.floor(hash(i, 11) * 72), M(22));
    text('1994', px0 + 6, py0 + ph - 14, M(8), 1);
    // 便签与红线
    for (const [bx, by, bw, bh] of [[fx + 190, fy + 70, 110, 60], [fx + 190, fy + 142, 110, 54]]) {
      rect(bx + 2, by + 2, bw, bh, M(0));
      rect(bx, by, bw, bh, M(28));
      for (let j = 8; j < bh - 8; j += 7) hline(bx + 8, by + j, bw - 20, M(26));
      disc(bx + bw / 2, by - 1, 3, M(19));
    }
    thickLine(fx + 210, fy + 70, fx + 100, fy + 120, 0, M(19));
    thickLine(fx + 210, fy + 142, fx + 130, fy + 150, 0, M(19));
    stampBox('悬案', fx + 196, fy + 12, M(19), 1);
    stampBox('UNSOLVED', fx + 196, fy + 36, M(18), 1);
    // 回形针
    for (const [cx, cy] of [[fx + 70, fy + 64], [fx + 258, fy + 132]]) {
      ellipse(cx, cy, 7, 4, M(27)); ellipse(cx, cy, 5, 2, M(8));
    }
    hud('旧卷宗', 'COLD CASE');
    dustMotes(t, 12, 161, 100, 560, 40, 280, M(14));
  }, () => {
    skyBand(-10, H, M(1), M(2));
    // 标题背后的金色天光
    halo(320, 150, 320, 200, R_GOLD, 0.42, 2.1);
    // 背景水印：圆 + 经纬
    ellipse(320, 168, 250, 130, M(4));
    ellipse(320, 168, 190, 100, M(3));
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * 6.283 + t * 0.08;
      px(320 + Math.cos(a) * 250, 168 + Math.sin(a) * 130, M(15));
    }
    grid(80, 60, 480, 220, M(3), 46);
    cornerFrame(30, 26, 580, 308, M(19), 18);
    const k = clamp((u - 2.55) / 0.3, 0, 1);
    const jit = u < 2.85 ? Math.round(Math.sin(u * 90) * (2.85 - u) * 8) : 0;
    textSC('波斯湾绿洲假说', 320, 116 + Math.round((1 - k) * 14) + jit, M(15), 3);
    hline(146, 168, 348, M(18));
    hline(146, 169, 348, M(17));
    textC('THE PERSIAN GULF OASIS HYPOTHESIS', 320, 178, M(26), 1);
    chip('最古老的都市传说', 250, 204, M(8), M(0), M(19));
    textC('A NAME FOR THE UNSOLVED CASE', 320, 236, M(27), 1);
    if (u > 3.6) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      // 鱼群：三条都复用 FISHICON 帧表，主鱼居中缓慢巡游，两条伴鱼跟游
      const fx2 = 320 + Math.round(Math.sin(t * 0.55) * 34);
      const fy2 = 272 + Math.round(Math.sin(t * 0.9 + 0.6) * 3);
      fishIcon(fx2 - 66, fy2 + 8 + Math.round(Math.sin(t * 0.9 + 2.1) * 2), t, 0.35);
      fishIcon(fx2 + 62, fy2 - 6 + Math.round(Math.sin(t * 0.9 + 3.4) * 2), t, 0.7);
      fishIcon(fx2, fy2, t);
      glowSpot(fx2, fy2, 14, 1, 0.10 + 0.12 * pulse);
    }
  });
  hud('假说', 'THE HYPOTHESIS');
}

// ================================================================== s11 三步 26.88–31.06
function shot11(t, f) {
  const u = t - 26.88;
  skyBand(-10, H, M(10), M(11));
  for (let y = 44; y < 300; y += 22) hline(-10, y, 660, M(12));
  // 油灯把整面墙照亮（灯与光晕一起极缓地摆动）
  const sway = Math.round(Math.sin(t * 0.8) * 2);
  halo(520 + sway, 150, 190, 150, R_WARM, 0.5, 2.0);
  halo(519 + sway, 176, 108, 92, R_GOLD, 0.42, 2.1);
  // 书架
  for (const bx of [16, 96]) {
    rect(bx, 60, 58, 180, M(10));
    for (let j = 0; j < 4; j++) {
      const yy = 72 + j * 44;
      hline(bx + 2, yy, 54, M(12));
      for (let i = 0; i < 7; i++) {
        const bh = 16 + Math.floor(hash(i + j, bx) * 14);
        const col = [M(11), M(13), M(18), M(21)][(i + j) % 4];
        const xx = bx + 4 + i * 7;
        rect(xx, yy - bh, 5, bh, col);
        // 书脊压条 + 烫金书名条 + 页口
        vline(xx, yy - bh + 2, bh - 3, col === M(18) ? M(17) : M(12));
        hline(xx + 1, yy - bh + 3, 3, M(15));
        if ((i + j) & 1) hline(xx + 4, yy - bh + 3, 1, M(9));
        if (bh > 22) { hline(xx + 1, yy - 8, 3, M(15)); hline(xx + 1, yy - 6, 2, M(14)); }
        if ((i + j) % 3 === 1 && bh > 18) px(xx + 2, yy - bh + 6, M(19));
      }
    }
  }
  // 阶梯（三级）
  const steps = [
    { x: 156, y: 268, w: 66, h: 22, zh: '一', at: 0.55 },
    { x: 210, y: 246, w: 66, h: 44, zh: '二', at: 1.30 },
    { x: 264, y: 224, w: 66, h: 66, zh: '三', at: 2.05 },
  ];
  for (const s of steps) {
    rect(s.x, s.y, s.w, s.h, M(12));
    rect(s.x, s.y, s.w, 4, M(14));
    for (let j = 8; j < s.h; j += 9) hline(s.x + 2, s.y + j, s.w - 4, M(11));
    vline(s.x + s.w - 1, s.y, s.h, M(10));
    const lit = clamp((u - s.at) / 0.25, 0, 1);
    if (lit > 0) {
      const col = lit < 1 ? M(15) : M(14);
      textSC(s.zh, s.x + s.w / 2, s.y + 6, col, 2);
      glowSpot(s.x + s.w / 2, s.y + 16, 20, 1, 0.22 * lit);
    }
  }
  // 灯 + 书桌 + 学者
  const lampX = 520 + sway, lampY = 150;
  rect(462, 236, 132, 12, M(11));
  rect(470, 248, 8, 56, M(10)); rect(578, 248, 8, 56, M(10));
  vline(520, lampY - 30, 30, M(10));
  line(520, lampY - 30, lampX, lampY - 25, M(10));
  poly([[lampX - 16, lampY - 30], [lampX + 16, lampY - 30], [lampX + 10, lampY - 18], [lampX - 10, lampY - 18]], M(14));
  fire(lampX, lampY - 26, t, 1, 3);
  glowSpot(lampX, lampY + 6, 96, 1, 0.20 + 0.03 * Math.sin(t * 3.4));
  // 学者侧影（背向）
  poly([[470, 236], [478, 190], [500, 168], [520, 162], [540, 168], [556, 190], [560, 236]], M(1));
  disc(519, 156, 15, M(1));
  arc(519, 156, 15, -2.6, 0.2, M(13));
  poly([[476, 200], [500, 186], [520, 190], [536, 208], [512, 214], [486, 212]], M(2));
  // 羽毛笔
  line(506, 208, 486, 236, M(28));
  px(485, 235, M(0));
  // 报纸
  const nk = clamp((u - 2.35) / 0.4, 0, 1);
  if (nk > 0) {
    const nx = 300, ny = 40 + Math.round((1 - nk) * -26), nw = 210, nh = 128;
    rect(nx + 3, ny + 3, nw, nh, M(0));
    rect(nx, ny, nw, nh, M(28));
    rect(nx + 4, ny + 4, nw - 8, nh - 8, M(8));
    rect(nx + 8, ny + 8, nw - 16, 20, M(0));
    text('号外', nx + 12, ny + 12, M(15), 1);
    text('THE GREAT MELON', nx + 52, ny + 12, M(28), 1);
    hline(nx + 8, ny + 32, nw - 16, M(0));
    // 大瓜
    disc(nx + 60, ny + 76, 26, M(22));
    disc(nx + 52, ny + 68, 16, M(23));
    for (let i = -24; i <= 24; i += 8) {
      ellipse(nx + 60, ny + 76, i, 26, M(21));
    }
    px(nx + 44, ny + 62, M(30));
    for (let j = 0; j < 6; j++) hline(nx + 104, ny + 44 + j * 12, 92, M(26));
    text('一百年前', nx + 104, ny + 104, M(18), 1);
    if (nk < 1) for (let s = 0; s < 60; s++) px(nx + Math.round(hash(s, 21) * nw), ny + Math.round(hash(s, 23) * nh), M(8));
  }
  hud('三步', 'THREE STEPS');
  dustMotes(t, 12, 171, 200, 600, 60, 250, M(14));
}

// ================================================================== s12 第一步：不是怪物 31.06–33.90
function shot12(t, f) {
  const u = t - 31.06;
  skyBand(-10, H, M(1), M(2));
  // 光锥
  poly([[280, -10], [360, -10], [470, 300], [190, 300]], M(2));
  halo(330, 190, 190, 140, R_GOLD, 0.32, 2.2);
  for (let y = 0; y < 300; y += 1) {
    const x0 = Math.round(280 + (y / 300) * -90), x1 = Math.round(360 + (y / 300) * 110);
    for (let x = x0; x < x1; x++) {
      const edge = Math.min(x - x0, x1 - x) / 40;
      if (bay(x, y) < 0.28 * clamp(edge, 0, 1)) px(x, y, M(2));
    }
  }
  // 地面
  rect(-10, 292, 660, 20, M(9));
  hline(-10, 292, 660, M(11));
  // 基座
  rect(262, 268, 116, 24, M(12));
  hline(262, 268, 116, M(14));
  for (let x = 268; x < 372; x += 12) rect(x, 274, 7, 2, M(11));
  statueGod(t);
  // 灰尘
  dustMotes(t, 20, 181, 220, 420, 40, 290, M(14));
  // 问号 → 三个图标
  const qk = clamp(u / 0.35, 0, 1);
  if (u < 1.55) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5.2);
    const flick = u > 1.2 ? (Math.floor(u * 18) % 2 === 0 ? 1 : 0.3) : 1;
    textC('?', 452, 48 + Math.round((1 - qk) * 6), pulse > 0.7 ? M(15) : M(29), 5);
    if (flick < 1) { px(448, 60, M(19)); px(456, 90, M(19)); }
  } else {
    const items = [['boat', '航海'], ['gear', '技术'], ['tablet', '文字']];
    items.forEach(([k, zh], i) => {
      const kk = clamp((u - 1.55 - i * 0.16) / 0.24, 0, 1);
      if (kk <= 0) return;
      const bx = 398 + (i % 2) * 0, by = 40 + i * 66;
      panelBox(392, by, 108, 58, null, null, kk < 1 ? M(8) : M(15));
      icon(k, bx + 54, by + 30, 1.5, M(15), M(22));
      text(zh, bx + 84, by + 24, M(8), 1);
    });
    chip('哪是什么怪物', 372, 258, M(15), M(0), M(19));
  }
  hud('第一步', 'STEP ONE');
}

// ================================================================== s13 航海文明 33.90–37.04
function shot13(t, f) {
  const u = t - 33.90;
  skyBand(-10, 150, M(2), M(3));
  skyBand(150, 214, M(3), M(25));
  skyBand(214, 244, M(25), M(12));
  stars(f);
  // 地平线的余晖：船就是逆光剪影
  halo(320, 238, 430, 96, R_GOLD, 0.85, 2.2);
  // 低星与远岸
  poly([[-10, 240], [80, 234], [180, 238], [280, 232], [390, 237], [500, 231], [610, 236], [650, 234], [650, 248], [-10, 248]], M(31));
  // 海
  rect(-10, 244, 660, 62, M(21));
  dither(320, 276, 700, 42, M(22), 0.42);
  halo(320, 286, 420, 80, R_TEAL, 0.45, 2.0);
  hline(-10, 244, 660, M(23));
  // 星座：船形（预烘焙 12 帧逐笔连线）
  const CON = CON_PTS;
  blit(CON_FRAMES[Math.min(11, Math.floor(clamp((u - 0.2) / 1.1, 0, 1) * 12))], 130, 30);
  CON.forEach(([x, y], i) => {
    if (!((Math.floor(f / 5) + i) & 3)) return;
    disc(x, y, 1, M(8)); glowSpot(x, y, 5, 1, 0.18);
  });
  // 船（预烘焙 4 帧大帆脉冲）
  const bx = Math.round(lerp(590, 178, clamp(u / 3.4, 0, 1)));
  const by = 256 + Math.round(Math.sin(t * 1.3) * 2);
  blit(SHIP_FRAMES[Math.floor((t * 0.6 % 1) * 4) % 4], bx - 80, by - 100);
  // 灯火
  glowSpot(bx + 8, by - 16, 14, 1, 0.5);
  // 尾迹
  for (let i = 0; i < 26; i++) {
    const xx = bx + 52 + i * 7;
    if (xx > 650) continue;
    const yy = by + 6 + Math.round(Math.sin(i * 0.7 + t * 3) * 3 + i * 0.6);
    hline(xx, yy, 4 + (i % 3), i < 6 ? M(8) : M(23));
  }
  hud('航海', 'SEAFARERS');
}

// ================================================================== s14 北上登陆 37.04–40.86
function shot14(t, f) {
  const u = t - 37.04;
  mapBackdrop(f);
  mapPanel();
  mapLand(f);
  mapBasin(1.02, BS_SAND, f);
  mapRivers({});
  mapCoast(M(23));
  mapBahrain(); mapQatar(); mapMusandam();
  mapTag('美索不达米亚', 96, 24, M(15), 1);
  mapTag('波斯湾', 262, 148, M(8), 1);
  mapTag('阿拉伯', 168, 214, M(15), 1);
  mapTag('伊朗', 392, 52, M(15), 1);
  // 路线
  const ROUTE = [[MAPX + 452, MAPY + 232], [MAPX + 396, MAPY + 196], [MAPX + 330, MAPY + 150],
    [MAPX + 260, MAPY + 116], [MAPX + 190, MAPY + 86], [MAPX + 124, MAPY + 58], [MAPX + 96, MAPY + 46]];
  const k = clamp((u - 0.25) / 2.2, 0, 1);
  polyPath(ROUTE, M(15), false, 0, k);
  // 小舟沿路前进
  const bp = pathAt(ROUTE, clamp((u - 0.35) / 2.5, 0, 1));
  const bob = Math.round(Math.sin(t * 4) * 1);
  boatReed(Math.round(bp[0]), Math.round(bp[1] + bob), 0.6, t, true);
  // 登陆点
  const lx = MAPX + 96, ly = MAPY + 46;
  if (u > 2.4) {
    const kk = clamp((u - 2.4) / 0.4, 0, 1);
    glowSpot(lx, ly, Math.round(30 * kk), 1, 0.5);
    ellipse(lx, ly, Math.round(18 * kk), Math.round(12 * kk), M(15));
    text('登陆', lx + 12, ly - 16, M(15), 1);
  }
  // 两件货物
  const cargo = [['tablet', '文字', 0.95], ['flood', '灌溉', 1.75]];
  cargo.forEach(([k2, zh, at], i) => {
    const kk = clamp((u - at) / 0.25, 0, 1);
    if (kk <= 0) return;
    const bx = 560, by = 40 + i * 84;
    panelBox(bx, by, 72, 72, null, null, kk < 1 ? M(8) : M(15));
    icon(k2, bx + 36, by + 32, 1.3, M(15), M(22));
    textC(zh, bx + 36, by + 58, M(8), 1);
  });
  hud('北上', 'UP THE GULF');
}

// ================================================================== s15 神吗 40.86–45.62
function shot15(t, f) {
  const u = t - 40.86;
  skyBand(-10, 120, M(2), M(3));
  skyBand(120, 200, M(3), M(24));
  skyBand(200, 250, M(24), M(14));
  // 朝日
  halo(430, 212, 240, 170, R_WARM, 1.0, 2.2);
  disc(430, 214, 30, M(14));
  disc(430, 214, 24, M(15));
  disc(430, 214, 16, M(16));
  glowSpot(430, 214, 110, 1, 0.34 + Math.sin(t * 2.2) * 0.04);
  // 远岸
  poly([[-10, 244], [70, 238], [160, 243], [260, 236], [360, 242], [470, 235], [570, 241], [650, 238], [650, 252], [-10, 252]], M(31));
  // 海
  rect(-10, 248, 660, 58, M(21));
  dither(320, 274, 700, 34, M(22), 0.34);
  halo(430, 288, 330, 72, R_GOLD, 0.42, 2.1);
  hline(-10, 248, 660, M(23));
  for (let i = 0; i < 50; i++) {
    const yy = 250 + Math.floor(hash(i, 191) * 50);
    const xx = ((hash(i, 193) * 700 + t * (4 + hash(i, 195) * 8)) % 700) - 30;
    hline(Math.round(xx), yy, 3 + Math.floor(hash(i, 197) * 10), hash(i, 199) < 0.3 ? M(23) : M(22));
  }
  for (let i = 0; i < 84; i++) {
    const yy = 250 + Math.floor(hash(i, 201) * 52);
    const xx = 430 + Math.round((hash(i, 203) - 0.5) * (14 + (yy - 248) * 1.4));
    if (hash(i, 205) < 0.62) px(xx, yy, hash(i, 207) < 0.4 ? M(16) : M(15));
  }
  // 鱼人（大）
  apkallu(232, 252, -46 + Math.round(Math.sin(t * 1.8) * 1.2), t);
  // 海滩
  poly([[-10, 286], [80, 278], [180, 284], [300, 276], [430, 283], [560, 277], [650, 283], [650, 306], [-10, 306]], M(12));
  hline(-10, 288, 660, M(13));
  // 土著
  const grp = [[420, 300, 1.0], [446, 302, 0.9], [470, 299, 1.05], [496, 302, 0.85], [518, 300, 0.95], [544, 303, 0.8]];
  grp.forEach(([x, y, s2], i) => {
    tinyPerson(x, y, s2, M(1));
    if (u > 2.5) { const b = Math.sin(t * 3 + i) * 1; px(x, y - Math.round(10 * s2) + Math.round(b), M(1)); }
  });
  // 惊叹号
  if (u > 2.4) {
    const k = clamp((u - 2.4) / 0.3, 0, 1);
    textC('!', 466, 246 - Math.round(k * 24), M(15), 3);
  }
  // 神？
  if (u > 3.1) {
    const k = clamp((u - 3.1) / 0.3, 0, 1);
    const jit = u < 3.4 ? Math.round(Math.sin(u * 80) * (3.4 - u) * 8) : 0;
    textSC('神 ?', 502, 52 + Math.round((1 - k) * 10), M(15), 4);
    chip('对土著来说', 430, 108, M(8), M(0), M(15));
  }
  hud('神吗', 'A GOD?');
  dustMotes(t, 12, 211, 380, 640, 200, 300, M(14));
}

// ================================================================== s16 挖不到 45.62–50.98
function shot16(t, f) {
  const u = t - 45.62;
  skyBand(-10, H, M(9), M(10));
  const X0 = 72, Y0 = 58, XW = 500, YH = 224;
  rect(X0 - 6, Y0 - 6, XW + 12, YH + 12, M(0));
  rect(X0 - 2, Y0 - 2, XW + 4, YH + 4, M(12));
  // 地层（越往下越老）
  const layers = [
    { h: 34, c1: M(13), c2: M(14), zh: '地表' },
    { h: 38, c1: M(12), c2: M(13), zh: '苏美尔 3500 BC' },
    { h: 40, c1: M(11), c2: M(12), zh: '5000 BC' },
    { h: 40, c1: M(10), c2: M(11), zh: '6000 BC' },
    { h: 40, c1: M(9), c2: M(10), zh: '7000 BC' },
    { h: 32, c1: M(9), c2: M(9), zh: '8000 BC ↓' },
  ];
  let yy = Y0;
  layers.forEach((L, li) => {
    const wave = 3 + (li % 3) * 2;
    for (let x = 0; x < XW; x++) {
      const bh = Math.round(Math.sin(x * 0.05 + li * 1.7) * wave);
      for (let j = 0; j < L.h; j++) {
        const c = ((x + j) & 3) === 0 ? L.c2 : L.c1;
        px(X0 + x, yy + bh + j, c);
      }
    }
    for (let i = 0; i < 120; i++) {
      const rx = Math.floor(hash(i, li * 7 + 1) * XW);
      const ry = yy + Math.floor(hash(i, li * 7 + 2) * L.h);
      px(X0 + rx, ry, L.c2);
    }
    // 层内包含物：上面两层是陶片，往下只剩骨屑/炭点
    for (let i = 0; i < 9; i++) {
      const sx2 = X0 + 18 + Math.floor(hash(i, li * 11 + 3) * (XW - 36));
      const sy2 = yy + 7 + Math.floor(hash(i, li * 11 + 4) * (L.h - 12));
      if (li <= 1) {
        px(sx2, sy2, M(15)); px(sx2 + 1, sy2, M(15)); px(sx2, sy2 + 1, M(14));
        if (i % 3 === 0) { px(sx2 + 2, sy2 + 1, M(19)); px(sx2 + 2, sy2, M(13)); }
      } else if (i % 2 === 0) {
        px(sx2, sy2, M(26)); px(sx2 + 2, sy2 + 1, M(19));
      }
    }
    // 标签
    rect(X0 + 4, yy + 5, textW(L.zh) + 8, 14, M(0));
    text(L.zh, X0 + 8, yy + 7, li === 0 ? M(15) : M(26), 1);
    yy += L.h;
  });
  // 上层文物（苏美尔）
  for (let i = 0; i < 5; i++) {
    const cx = X0 + 40 + i * 92, cy = Y0 + 52;
    icon('jar', cx, cy, 1, M(14), M(12));
  }
  // 更深处：空的
  const qk = clamp((u - 0.5) / 0.6, 0, 1);
  if (qk > 0) {
    for (const [qx, qy] of [[X0 + 96, Y0 + 122], [X0 + 250, Y0 + 146], [X0 + 386, Y0 + 128], [X0 + 300, Y0 + 186]]) {
      textC('?', qx, qy, M(26), 2);
    }
  }
  // 深度标尺
  vline(X0 + XW + 6, Y0, YH, M(27));
  for (let i = 0; i <= 6; i++) hline(X0 + XW + 2, Y0 + i * (YH / 6), 9, M(27));
  text('老', X0 + XW + 14, Y0 + 20, M(26), 1);
  text('↓', X0 + XW + 14, Y0 + 40, M(26), 1);
  // 放大镜扫描
  const span = XW - 60;
  const mx = X0 + 40 + ((u * 62) % span);
  const my = Y0 + 118 + Math.round(Math.sin(u * 1.6) * 44);
  glowSpot(Math.round(mx), Math.round(my), 34, 1, 0.5);
  blit(MAG_FRAME, Math.round(mx) - 38, Math.round(my) - 38);
  // 计数
  panelBox(486, 10, 132, 40, null, null, M(15));
  text('发现', 496, 16, M(8), 1);
  textC('0', 566, 14, M(19), 2);
  // 问句
  if (u > 2.0) chip('比苏美尔更老？', 76, 12, M(15), M(0), M(19));
  hud('考古层位', 'STRATA');
}
