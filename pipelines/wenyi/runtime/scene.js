/* 画法脚本：1503 盛期文艺复兴长厅（达芬奇式晕涂）——纯代码。
   一镜到底横摇：窗边猫 → 少女银杯 → 学者画案 → 拉远收全景（少女与学者同框）。
   长厅是一整幅世界画布（3720×1220），相机只横移/推拉；罩层（龟裂＋黄釉＋画布经纬＋笔触）钉在屏幕空间。 */
SCENES['06_renaissance'] = (() => {
  const W = 3720, H = 1220, WY = 790;                 // 世界画布与墙脚线
  const { clamp, lerp } = U, P = PAINT, R = RIG;
  const R_ = (s) => U.rng(s);
  const LG = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; };
  const RGd = (c, x, y, r0, r1, stops) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); for (const s of stops) g.addColorStop(s[0], s[1]); return g; };
  const poly = (pts, closed = true) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); if (closed) p.closePath(); return p; };
  const arch = (xl, xr, cy, yb) => { const p = new Path2D(), r = (xr - xl) / 2; p.moveTo(xl, yb); p.lineTo(xl, cy); p.arc(xl + r, cy, r, Math.PI, 0); p.lineTo(xr, yb); p.closePath(); return p; };

  const CACHE = {};
  const cache = (key, w, h, fn) => { if (!CACHE[key]) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), cv); CACHE[key] = cv; } return CACHE[key]; };

  // ---------- 抹灰纹理 ----------
  function noiseCv(w, h, base, dark, scale, amt, grain, seed) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    const b = P.hex(base), k = P.hex(dark || base), r = R_(seed);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = P.fbm(x * scale + seed, y * scale, 5), gr = (r() - .5) * grain;
      const c = P.mix(b, k, clamp(n * 1.3 + 0.36, 0, 1)), i = (y * w + x) * 4;
      d[i] = c[0] + n * amt + gr; d[i + 1] = c[1] + n * amt + gr; d[i + 2] = c[2] + n * amt * .85 + gr; d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0); return cv;
  }

  // ---------- 油彩重涂：沿明暗梯度切线的笔触（世界画布自带尺寸，P.strokes 绑舞台尺寸不能直接用） ----------
  function brushPass(cv, cell, alpha) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height;
    const d = g.getImageData(0, 0, w, h).data;
    const lum = (x, y) => { const i = (y * w + x) << 2; return d[i] * 0.32 + d[i + 1] * 0.55 + d[i + 2] * 0.13; };
    const r = R_(53 + cell);
    g.save(); g.lineCap = 'round';
    for (let y = cell; y < h - cell; y += cell) for (let x = cell; x < w - cell; x += cell) {
      const i = (y * w + x) << 2;
      if (d[i + 3] < 24) continue;
      const gx = (lum(x + cell, y - cell) + 2 * lum(x + cell, y) + lum(x + cell, y + cell)) - (lum(x - cell, y - cell) + 2 * lum(x - cell, y) + lum(x - cell, y + cell));
      const gy = (lum(x - cell, y + cell) + 2 * lum(x, y + cell) + lum(x + cell, y + cell)) - (lum(x - cell, y - cell) + 2 * lum(x, y - cell) + lum(x + cell, y - cell));
      // 沿等照度线（垂直于梯度）走笔；梯度很小时给一个缓的斜向
      let a = (Math.abs(gx) + Math.abs(gy) < 6) ? 0.22 + (r() - .5) * .3 : Math.atan2(gy, gx) + Math.PI / 2;
      const px = x + (r() - .5) * cell * .4, py = y + (r() - .5) * cell * .4;
      const L = cell * (1.9 + r() * 0.9), W = cell * (0.62 + r() * 0.22);
      g.strokeStyle = `rgba(${d[i]},${d[i + 1]},${d[i + 2]},${alpha})`;
      g.lineWidth = W;
      g.beginPath(); g.moveTo(px - Math.cos(a) * L / 2, py - Math.sin(a) * L / 2); g.lineTo(px + Math.cos(a) * L / 2, py + Math.sin(a) * L / 2); g.stroke();
    }
    g.restore();
  }

  function oilPass(cv, cell, alpha, atop) {
    const g = cv.getContext('2d'), w = cv.width, h = cv.height;
    const src = g.getImageData(0, 0, w, h).data, r = R_(91 + cell);
    g.save(); g.globalCompositeOperation = atop ? 'source-atop' : 'source-over';
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      let R0 = 0, G0 = 0, B0 = 0, A0 = 0, n = 0;
      for (let sy = 0; sy < cell; sy += 2) for (let sx = 0; sx < cell; sx += 2) {
        const xx = x + sx, yy = y + sy;
        if (xx >= w || yy >= h) continue;
        const i = (yy * w + xx) * 4;
        R0 += src[i]; G0 += src[i + 1]; B0 += src[i + 2]; A0 += src[i + 3]; n++;
      }
      if (!n) continue;
      R0 /= n; G0 /= n; B0 /= n; A0 /= n;
      if (A0 < 24) continue;
      const ang = (P.fbm(x * 0.0042, y * 0.0042, 3) - 0.5) * 1.0 + (y > WY ? 0 : 0.1);
      const L = cell * (1.3 + r() * 0.9);
      g.fillStyle = `rgba(${R0 | 0},${G0 | 0},${B0 | 0},${alpha})`;
      g.beginPath();
      g.ellipse(x + cell * .5 + (r() - .5) * cell * .35, y + cell * .5 + (r() - .5) * cell * .35, L * .5, cell * .34 + r() * 1.1, ang, 0, 7);
      g.fill();
    }
    g.restore();
  }

  // ---------- 拱窗 ----------
  const OUT = arch(250, 830, 400, 706), IN = arch(286, 794, 408, 690);
  const OUT2 = arch(3520, 3700, 452, 662), IN2 = arch(3544, 3676, 458, 650);

  // ---------- 墙 ----------
  function paintWall(g) {
    g.drawImage(noiseCv(1860, 400, '#4d3823', '#241809', 0.0034, 22, 9, 21), 0, 0, W, WY);
    // 顶暗、腰亮
    g.fillStyle = LG(g, 0, 0, 0, WY, [[0, 'rgba(9,5,2,.62)'], [0.22, 'rgba(9,5,2,.24)'], [0.5, 'rgba(9,5,2,0)'], [1, 'rgba(14,8,4,.16)']]);
    g.fillRect(0, 0, W, WY);
    // 窗光晕（暖金）
    g.fillStyle = RGd(g, 540, 470, 90, 1650, [[0, 'rgba(214,168,110,.52)'], [0.35, 'rgba(170,120,70,.22)'], [1, 'rgba(120,80,40,0)']]);
    g.fillRect(0, 0, W, 980);
    // 小窗冷光
    g.fillStyle = RGd(g, 3610, 520, 40, 620, [[0, 'rgba(150,180,205,.26)'], [1, 'rgba(120,150,180,0)']]);
    g.fillRect(3100, 120, 620, 620);
    const r = R_(31);
    // 墙面斑驳：大块明暗
    for (let k = 0; k < 34; k++) {
      const x = r() * W, y = 60 + r() * 690, rr = 120 + r() * 320;
      const c = RGd(g, x, y, 0, rr, [[0, `rgba(${r() < .5 ? '255,235,195' : '30,18,8'},${0.03 + r() * 0.05})`], [1, 'rgba(0,0,0,0)']]);
      g.fillStyle = c; g.save(); g.translate(x, y); g.scale(1, 0.72); g.translate(-x, -y); g.fillRect(x - rr, y - rr, rr * 2, rr * 2); g.restore();
    }
    // 墙板凹槽（三开间）
    const bays = [[130, 1080], [1200, 2180], [2300, 3480]];
    for (const [x0, x1] of bays) {
      const y0 = 210, y1 = 672;
      g.fillStyle = 'rgba(255,236,200,.045)'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.strokeStyle = 'rgba(18,10,4,.5)'; g.lineWidth = 3; g.strokeRect(x0 + 14, y0 + 14, x1 - x0 - 28, y1 - y0 - 28);
      g.strokeStyle = 'rgba(255,238,205,.14)'; g.lineWidth = 2; g.strokeRect(x0 + 18, y0 + 18, x1 - x0 - 36, y1 - y0 - 36);
      g.strokeStyle = 'rgba(255,238,205,.10)'; g.lineWidth = 3; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      g.strokeStyle = 'rgba(18,10,4,.4)'; g.lineWidth = 2; g.strokeRect(x0 + 3, y0 + 3, x1 - x0 - 6, y1 - y0 - 6);
    }
    // 檐口（线脚＋齿饰）
    g.fillStyle = LG(g, 0, 60, 0, 150, [[0, '#8e7551'], [0.35, '#c2a97e'], [0.7, '#a98f66'], [1, '#6d5637']]);
    g.fillRect(0, 60, W, 78);
    g.fillStyle = 'rgba(22,13,6,.5)'; g.fillRect(0, 138, W, 16);
    for (let x = 0; x < W; x += 30) { g.fillStyle = 'rgba(255,240,205,.12)'; g.fillRect(x, 104, 12, 24); g.fillStyle = 'rgba(30,18,8,.35)'; g.fillRect(x + 12, 104, 3, 24); }
    g.fillStyle = LG(g, 0, 150, 0, 215, [[0, 'rgba(25,15,7,.55)'], [1, 'rgba(25,15,7,0)']]); g.fillRect(0, 150, W, 66);
    g.fillStyle = LG(g, 0, 40, 0, 62, [[0, '#6b5638'], [1, '#9a815a']]); g.fillRect(0, 40, W, 22);
    // 墙裙（铜绿绿漆）
    g.fillStyle = LG(g, 0, 690, 0, WY, [[0, '#4a6a52'], [0.25, '#37533f'], [1, '#23352a']]);
    g.fillRect(0, 690, W, WY - 690);
    g.fillStyle = 'rgba(255,236,200,.22)'; g.fillRect(0, 690, W, 5);
    g.fillStyle = 'rgba(10,6,3,.45)'; g.fillRect(0, 695, W, 3);
    g.fillStyle = 'rgba(10,6,3,.55)'; g.fillRect(0, WY - 6, W, 6);
    for (const [x0, x1] of bays) {
      g.strokeStyle = 'rgba(210,225,190,.13)'; g.lineWidth = 2; g.strokeRect(x0 + 26, 712, x1 - x0 - 52, 56);
      g.strokeStyle = 'rgba(8,14,9,.45)'; g.lineWidth = 2; g.strokeRect(x0 + 29, 715, x1 - x0 - 58, 50);
    }
    // 壁柱
    for (const [px0, px1] of [[36, 116], [1130, 1200], [2210, 2280], [3590, 3670]]) {
      g.fillStyle = LG(g, px0, 0, px1, 0, [[0, '#d5bf95'], [0.3, '#c3ab80'], [0.72, '#9d855d'], [1, '#6f593c']]);
      g.fillRect(px0, 150, px1 - px0, WY - 150);
      // 柱头
      g.fillStyle = LG(g, px0 - 12, 0, px1 + 12, 0, [[0, '#e2cda4'], [0.5, '#cbb287'], [1, '#8a7350']]);
      g.fillRect(px0 - 12, 176, px1 - px0 + 24, 30);
      g.fillRect(px0 - 6, 206, px1 - px0 + 12, 16);
      for (let k = 0; k < 2; k++) { g.fillStyle = 'rgba(255,242,210,.35)'; g.beginPath(); g.arc(px0 + 8 + k * (px1 - px0 - 16), 194, 7, 0, 7); g.fill(); }
      // 柱基
      g.fillStyle = LG(g, px0 - 10, 0, px1 + 10, 0, [[0, '#c9b184'], [1, '#7c6647']]);
      g.fillRect(px0 - 10, 700, px1 - px0 + 20, 26);
      g.fillRect(px0 - 6, 726, px1 - px0 + 12, 64);
      g.fillStyle = 'rgba(10,6,3,.35)'; g.fillRect(px0 - 10, 726, px1 - px0 + 20, 4);
      // 柱影
      g.fillStyle = LG(g, px1, 0, px1 + 26, 0, [[0, 'rgba(20,11,5,.42)'], [1, 'rgba(20,11,5,0)']]); g.fillRect(px1, 150, 26, WY - 150);
    }
  }

  // ---------- 墙面装饰：壁龛胸像、圆形镶板画、壁灯 ----------
  function wallDecor(g) {
    // ══ 壁龛（窗与挂毯之间的空墙）══
    const NX = 978, NY = 380, NW = 236, NH = 204;
    // 外框石线脚
    g.fillStyle = LG(g, NX - NW / 2, 0, NX + NW / 2, 0, [[0, '#d8c39a'], [0.34, '#bfa87c'], [0.7, '#9a8258'], [1, '#726049']]);
    g.fill(arch(NX - NW / 2, NX + NW / 2, NY + 60, NY + NH));
    // 内凹
    const inner = arch(NX - NW / 2 + 14, NX + NW / 2 - 14, NY + 66, NY + NH - 10);
    g.fillStyle = LG(g, 0, NY, 0, NY + NH, [[0, '#1d150d'], [0.35, '#2b2015'], [0.8, '#3a2b1b'], [1, '#4a3823']]); g.fill(inner);
    g.save(); g.clip(inner);
    // 龛内的暗影与暖光（窗光从左侧擦进来）
    g.fillStyle = RGd(g, NX - 60, NY + 120, 10, 200, [[0, 'rgba(190,160,110,.22)'], [1, 'rgba(190,160,110,0)']]); g.fillRect(NX - 130, NY, 260, NH);
    g.fillStyle = LG(g, 0, NY, 0, NY + 90, [[0, 'rgba(0,0,0,.55)'], [1, 'rgba(0,0,0,0)']]); g.fillRect(NX - 130, NY, 260, 90);
    // 胸像：大理石，四分之三侧脸，朝向窗（左）
    const BX = NX - 2, BY = 452;
    // 肩与胸
    g.fillStyle = LG(g, BX - 70, 0, BX + 40, 0, [[0, '#efe0c8'], [0.4, '#d8c6ab'], [0.78, '#b09a7c'], [1, '#7d6a52']]);
    g.fill(R.smooth([[BX - 74, 566], [BX - 66, 512], [BX - 34, 496], [BX + 20, 496], [BX + 54, 508], [BX + 62, 566]]));
    // 胸部褶皱（托加）
    g.strokeStyle = 'rgba(120,100,74,.45)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(BX - 52, 512); g.quadraticCurveTo(BX - 10, 542, BX + 34, 520); g.stroke();
    g.beginPath(); g.moveTo(BX - 40, 540); g.quadraticCurveTo(BX - 6, 556, BX + 30, 540); g.stroke();
    // 颈
    g.fillStyle = LG(g, BX - 20, 0, BX + 20, 0, [[0, '#e6d5ba'], [1, '#a48c72']]);
    g.fill(R.smooth([[BX - 16, 486], [BX + 18, 484], [BX + 20, 508], [BX - 18, 510]]));
    // 头（侧脸，略低头）
    const head = R.smooth([[BX - 26, 404], [BX - 30, 424], [BX - 34, 440], [BX - 40, 452], [BX - 34, 458], [BX - 33, 470], [BX - 26, 480], [BX - 5, 486], [BX + 16, 480], [BX + 22, 456], [BX + 18, 428], [BX + 2, 408]]);
    g.fillStyle = LG(g, BX - 42, 0, BX + 24, 0, [[0, '#f4e8d4'], [0.5, '#dcccaf'], [1, '#a08a70']]);
    g.fill(head);
    g.save(); g.clip(head);
    // 眼窝、颊、颌
    g.fillStyle = 'rgba(140,116,90,.30)'; g.beginPath(); g.ellipse(BX - 22, 442, 8, 6, -.2, 0, 7); g.fill();
    g.fillStyle = 'rgba(160,134,104,.24)'; g.beginPath(); g.ellipse(BX - 12, 462, 12, 9, .3, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,248,232,.35)'; g.beginPath(); g.ellipse(BX - 30, 446, 5, 9, .2, 0, 7); g.fill();
    g.restore();
    // 发（挽起的髻）＋发带
    g.fillStyle = LG(g, BX - 4, 396, BX + 30, 440, [[0, '#e7d9bd'], [0.55, '#c4b294'], [1, '#8f7c60']]);
    g.beginPath(); g.ellipse(BX + 10, 418, 20, 17, 0.2, 0, 7); g.fill();
    g.beginPath(); g.ellipse(BX + 26, 432, 9, 12, 0.5, 0, 7); g.fill();
    g.strokeStyle = 'rgba(196,178,148,.5)'; g.lineWidth = 2;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(BX - 2 + k * 4, 402); g.quadraticCurveTo(BX + 8 + k * 4, 412, BX + 6 + k * 4, 428); g.stroke(); }
    // 眼（浅刻）
    g.fillStyle = 'rgba(96,76,56,.55)'; g.beginPath(); g.ellipse(BX - 24, 444, 4.2, 2.4, -.15, 0, 7); g.fill();
    // 鼻、口
    g.strokeStyle = 'rgba(132,106,80,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(BX - 38, 452); g.quadraticCurveTo(BX - 42, 458, BX - 36, 460); g.stroke();
    g.strokeStyle = 'rgba(140,108,86,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(BX - 32, 472); g.quadraticCurveTo(BX - 24, 474, BX - 18, 471); g.stroke();
    // 底座
    g.fillStyle = LG(g, NX - 70, 0, NX + 70, 0, [[0, '#cbb58e'], [0.5, '#a68f68'], [1, '#6f5c40']]);
    g.fillRect(NX - 66, 566, 132, 16);
    g.fillRect(NX - 52, 582, 104, 12);
    g.fillStyle = 'rgba(20,12,6,.35)'; g.fillRect(NX - 66, 580, 132, 4);
    g.restore();
    // 龛口石边高光与投影
    g.strokeStyle = 'rgba(255,238,200,.28)'; g.lineWidth = 2; g.stroke(inner);
    g.fillStyle = 'rgba(12,7,3,.35)'; g.fillRect(NX + NW / 2 - 8, NY + 80, 14, NH);
    g.strokeStyle = 'rgba(255,240,206,.22)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(NX - NW / 2 + 4, NY + 40); g.quadraticCurveTo(NX, NY - 40, NX + NW / 2 - 4, NY + 40); g.stroke();

    // ══ 圆形镶板画（桌上方，镀金框）══
    const TX = 1902, TY = 386, TR = 132;
    g.fillStyle = LG(g, TX - TR, 0, TX + TR, 0, [[0, '#e0c078'], [0.35, '#b98f42'], [0.72, '#7d5a22'], [1, '#4e360f']]);
    g.beginPath(); g.arc(TX, TY, TR, 0, 7); g.fill();
    g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(TX, TY, TR - 12, 0, 7); g.fill();
    // 画心：暗底上的圣母子（低光、柔边）
    g.save(); g.beginPath(); g.arc(TX, TY, TR - 16, 0, 7); g.clip();
    g.fillStyle = LG(g, 0, TY - TR, 0, TY + TR, [[0, '#3a3428'], [0.5, '#5a4a34'], [1, '#7a6544']]); g.fillRect(TX - TR, TY - TR, TR * 2, TR * 2);
    g.save(); g.filter = 'blur(1.2px)';
    // 金地光环
    g.fillStyle = 'rgba(226,192,120,.30)'; g.beginPath(); g.arc(TX - 8, TY - 30, 62, 0, 7); g.fill();
    // 圣母（深蓝斗篷＋赭红袍）
    g.fillStyle = '#2b3a52'; g.fill(R.smooth([[TX - 78, TY + 80], [TX - 52, TY + 6], [TX - 26, TY - 22], [TX - 6, TY - 46], [TX + 14, TY - 30], [TX + 30, TY + 6], [TX + 44, TY + 80]]));
    g.fillStyle = '#7d3b2a'; g.fill(R.smooth([[TX - 44, TY + 40], [TX - 22, TY - 8], [TX, TY - 2], [TX + 12, TY + 40]]));
    g.fillStyle = '#e0bfa0'; g.beginPath(); g.ellipse(TX - 12, TY - 34, 15, 19, 0.15, 0, 7); g.fill();
    g.fillStyle = '#c8a888'; g.beginPath(); g.ellipse(TX - 12, TY - 30, 6, 9, 0.15, 0, 7); g.fill();
    // 圣婴
    g.fillStyle = '#eccbae'; g.beginPath(); g.ellipse(TX + 20, TY + 18, 15, 13, -.2, 0, 7); g.fill();
    g.beginPath(); g.arc(TX + 26, TY + 4, 9, 0, 7); g.fill();
    g.fillStyle = 'rgba(226,192,120,.5)'; g.beginPath(); g.arc(TX + 26, TY + 2, 11, 0, 7); g.fill();
    g.restore();
    // 画的暗角
    g.fillStyle = RGd(g, TX, TY, TR * .5, TR, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.55)']]); g.fillRect(TX - TR, TY - TR, TR * 2, TR * 2);
    g.restore();
    // 框的明暗与钉
    g.strokeStyle = 'rgba(255,236,190,.40)'; g.lineWidth = 2.4; g.beginPath(); g.arc(TX, TY, TR - 5, Math.PI * .9, Math.PI * 1.6); g.stroke();
    g.strokeStyle = 'rgba(30,18,6,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(TX, TY, TR - 2, Math.PI * 1.7, Math.PI * 2.4); g.stroke();

    // ══ 壁灯（挂毯右侧的柱前）══
    const SX = 2196, SY = 520;
    g.strokeStyle = '#7a5a28'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(SX, SY + 60); g.quadraticCurveTo(SX, SY + 20, SX + 6, SY - 6); g.stroke();
    g.fillStyle = LG(g, SX - 20, 0, SX + 20, 0, [[0, '#e8c98a'], [0.4, '#b78d3e'], [1, '#6e4a18']]);
    g.beginPath(); g.ellipse(SX + 6, SY - 10, 16, 6, 0, 0, 7); g.fill();
    g.fillStyle = '#efe6cf'; g.fillRect(SX + 2, SY - 44, 7, 34);
    g.strokeStyle = '#3a2a18'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(SX + 5, SY - 44); g.lineTo(SX + 5, SY - 50); g.stroke();
    g.fillStyle = 'rgba(255,240,200,.25)'; g.beginPath(); g.arc(SX + 6, SY - 40, 22, 0, 7); g.fill();
  }

  // ---------- 地砖 ----------
  function paintFloor(g) {
    g.fillStyle = LG(g, 0, WY, 0, H, [[0, '#3a2317'], [0.35, '#5b3621'], [1, '#2c1a10']]); g.fillRect(0, WY, W, H - WY);
    const F = 1120, CHs = 3.4, VPx = 1880;
    const py = (Z) => WY + F * CHs / Z, px = (X, Z) => VPx + F * X / Z;
    const zs = [40, 34, 28, 23, 19, 16, 13.6, 11.6, 10, 8.8];
    const r = R_(13);
    for (let j = 0; j < zs.length - 1; j++) {
      const z0 = zs[j], z1 = zs[j + 1], step = 1.7;
      const i0 = Math.floor((-VPx / (F / z0)) / step) - 1, i1 = Math.ceil(((W - VPx) / (F / z0)) / step) + 1;
      for (let i = i0; i <= i1; i++) {
        const X0 = i * step, X1 = X0 + step;
        const p = [[px(X0, z0), py(z0)], [px(X1, z0), py(z0)], [px(X1, z1), py(z1)], [px(X0, z1), py(z1)]];
        const alt = (i + j) % 2;
        const base = alt ? [144, 126, 100] : [112, 96, 76];
        const lit = clamp(1 - Math.abs(px((X0 + X1) / 2, z0) - 900) / 2600, 0, 1) * 0.55;
        const c = P.mix(base, [212, 194, 162], lit);
        const jt = P.jitter(c, r, 9);
        g.fillStyle = P.rgb(jt); g.fill(poly(p));
        g.strokeStyle = `rgba(40,32,22,${0.16 + r() * 0.10})`; g.lineWidth = 1.2; g.stroke(poly(p));
        g.strokeStyle = 'rgba(240,232,210,.07)'; g.lineWidth = 1; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.stroke();
      }
    }
    // 窗光落地（soft-light 光池，斜向）
    g.save(); g.globalCompositeOperation = 'soft-light';
    const pool = g.createLinearGradient(560, WY, 1500, H);
    pool.addColorStop(0, 'rgba(255,232,180,.95)'); pool.addColorStop(0.55, 'rgba(255,220,160,.55)'); pool.addColorStop(1, 'rgba(255,210,150,0)');
    g.fillStyle = pool; g.fill(poly([[330, WY], [900, WY], [1760, H], [980, H]])); g.restore();
    // 四周压暗
    g.fillStyle = RGd(g, 900, 1060, 380, 2100, [[0, 'rgba(16,8,4,0)'], [0.45, 'rgba(16,8,4,.32)'], [1, 'rgba(8,4,2,.82)']]); g.fillRect(0, WY, W, H - WY);
    g.fillStyle = LG(g, 0, WY, 0, WY + 70, [[0, 'rgba(14,8,4,.62)'], [1, 'rgba(14,8,4,0)']]); g.fillRect(0, WY, W, 70);
    // 地毯（桌下，近景铺开）
    const carpet = poly([[1430, 872], [2062, 872], [2172, H], [1300, H]]);
    g.fillStyle = LG(g, 1430, 872, 2100, H, [[0, '#7c1d1c'], [0.5, '#8e2a22'], [1, '#54120f']]); g.fill(carpet);
    g.save(); g.clip(carpet);
    g.strokeStyle = 'rgba(214,168,86,.5)'; g.lineWidth = 9; g.beginPath(); g.moveTo(1462, 890); g.lineTo(2038, 890); g.stroke();
    g.strokeStyle = 'rgba(58,92,120,.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(1452, 906); g.lineTo(2046, 906); g.stroke();
    for (let k = 0; k < 9; k++) { const x = 1470 + k * 66, y = 940 + k * 0; g.fillStyle = `rgba(214,170,90,${0.32 + (k % 2) * 0.1})`; g.beginPath(); g.moveTo(x, 930); g.lineTo(x + 26, 966); g.lineTo(x, 1002); g.lineTo(x - 26, 966); g.closePath(); g.fill(); }
    for (let k = 0; k < 6; k++) { const y = 1010 + k * 34; g.strokeStyle = 'rgba(46,26,14,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(1360 - k * 8, y); g.lineTo(2130 + k * 8, y); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(30,16,8,.5)'; g.lineWidth = 3; g.stroke(carpet);
  }

  // ---------- 窗洞远景 ----------
  function landscape(g) {
    g.save(); g.clip(IN);
    const rc = R_(71);
    // ══ 天（150–520）══
    g.fillStyle = LG(g, 0, 146, 0, 524, [[0, '#4b6f96'], [0.2, '#5f83a6'], [0.46, '#85a2b6'], [0.7, '#b0c2c3'], [0.88, '#d9dcc8'], [1, '#efe6c8']]);
    g.fillRect(240, 140, 620, 390);
    g.fillStyle = RGd(g, 366, 486, 6, 260, [[0, 'rgba(255,244,212,.50)'], [0.45, 'rgba(255,236,196,.16)'], [1, 'rgba(255,236,196,0)']]);
    g.fillRect(230, 420, 360, 110);
    // 高空薄云（条状）
    g.save(); g.filter = 'blur(3.4px)';
    for (let k = 0; k < 14; k++) {
      const x = 250 + rc() * 570, y = 200 + rc() * 190, rw = 40 + rc() * 90, rh = 3 + rc() * 7;
      g.fillStyle = `rgba(246,242,230,${0.06 + rc() * 0.12})`;
      g.save(); g.translate(x, y); g.scale(1, rh / rw); g.translate(-x, -y); g.beginPath(); g.arc(x, y, rw, 0, 7); g.fill(); g.restore();
    }
    g.restore();
    // 云：三层，远淡近实
    g.save(); g.filter = 'blur(2.6px)';
    for (let k = 0; k < 26; k++) {
      const x = 258 + rc() * 566, y = 418 + rc() * 74, rw = 22 + rc() * 70, rh = 4 + rc() * 10;
      const al = 0.10 + rc() * 0.22;
      g.fillStyle = RGd(g, x, y, 0, rw, [[0, `rgba(253,248,234,${al * 1.7})`], [0.55, `rgba(240,234,216,${al})`], [1, 'rgba(240,234,216,0)']]);
      g.save(); g.translate(x, y); g.scale(1, rh / rw); g.translate(-x, -y); g.beginPath(); g.arc(x, y, rw, 0, 7); g.fill(); g.restore();
    }
    g.restore();

    // ══ 远山（两个山脊，柔和空气感）══
    const ridgePts = (base, amp, seed, step) => {
      const pts = [];
      for (let x = 240; x <= 870; x += step) {
        const n1 = P.fbm(x * 0.0075, seed, 4), n2 = P.fbm(x * 0.028, seed + 7, 3);
        pts.push([x, base - (0.28 + n1 * 0.9) * amp - n2 * amp * 0.2]);
      }
      return pts;
    };
    const fillRidge = (pts, topCol, botCol) => {
      const p = poly(pts);
      const gr = LG(g, 0, Math.min(...pts.map(q => q[1])), 0, 690, [[0, topCol], [0.42, topCol], [1, botCol]]);
      g.fillStyle = gr; g.fill(p);
    };
    g.save(); g.filter = 'blur(1.8px)';
    fillRidge(ridgePts(508, 46, 4, 4), '#9bb0bd', '#8296a8');
    // 雪：山脊顶上的暖白碎块
    g.fillStyle = 'rgba(248,249,240,.30)';
    for (const [x, y] of ridgePts(508, 46, 4, 4)) if (y < 480) g.fillRect(x, y + 2, 3, 9);
    g.restore();
    g.save(); g.filter = 'blur(1.2px)';
    fillRidge(ridgePts(518, 24, 12, 4), '#8ea19c', '#73879a');
    g.restore();
    // 山脚雾
    g.save(); g.filter = 'blur(4px)';
    g.fillStyle = LG(g, 0, 500, 0, 522, [[0, 'rgba(238,234,214,0)'], [0.6, 'rgba(238,234,214,.55)'], [1, 'rgba(238,234,214,0)']]);
    g.fillRect(240, 498, 620, 28);
    g.restore();

    // ══ 湖（506–524）══
    g.fillStyle = LG(g, 0, 505, 0, 526, [[0, '#aabcb9'], [0.5, '#93a9a6'], [1, '#7f9490']]);
    g.fillRect(240, 505, 620, 22);
    g.save(); g.globalAlpha = 0.35; g.filter = 'blur(2px)';
    for (let k = 0; k < 10; k++) { const x = 296 + k * 54, w = 14 + (k % 3) * 10; g.fillStyle = '#6f8494'; g.fillRect(x, 506, w, 13 + (k % 2) * 6); }
    g.restore();
    for (let k = 0; k < 46; k++) { const x = 252 + rc() * 570, y = 508 + rc() * 16; g.fillStyle = `rgba(242,246,234,${0.06 + rc() * 0.26})`; g.fillRect(x, y, 4 + rc() * 18, 1); }

    // ══ 丘陵与河谷（522–690）══
    const hillTop = [];
    for (let x = 240; x <= 870; x += 5) hillTop.push([x, 524 + P.noise(x * 0.014, 3) * 12]);
    g.fillStyle = LG(g, 0, 522, 0, 690, [[0, '#8d9a72'], [0.18, '#7c8a58'], [0.45, '#8b7c48'], [0.75, '#796237'], [1, '#5a4628']]);
    g.fill(poly([...hillTop, [870, 690], [240, 690]]));
    // 田块（顺坡的软色带）
    const fw = ['rgba(160,162,108,.55)', 'rgba(118,126,72,.5)', 'rgba(178,158,102,.42)', 'rgba(100,98,58,.45)', 'rgba(150,130,78,.38)'];
    for (let k = 0; k < 14; k++) {
      const y = 530 + k * 11, wd = 2.5 + k * 1.5;
      g.strokeStyle = fw[k % fw.length]; g.lineWidth = wd; g.globalAlpha = 0.55;
      g.beginPath(); g.moveTo(240, y); g.bezierCurveTo(470, y - 8 - k * .8, 660, y + 10 + k * .8, 870, y - 2); g.stroke();
    }
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(66,58,36,.22)'; g.lineWidth = 0.9;
    for (let k = 0; k < 10; k++) { const y = 536 + k * 14; g.beginPath(); g.moveTo(240, y); g.bezierCurveTo(480, y - 7, 650, y + 7, 870, y); g.stroke(); }

    // 河：远窄近宽，两岸土色
    const RV = [[544, 524, 2], [572, 532, 3], [604, 546, 5], [640, 564, 8], [676, 586, 12], [706, 612, 17], [726, 640, 22], [740, 668, 27], [748, 690, 32]];
    const band = (mul) => { const l = [], rr = []; for (const [x, y, w] of RV) { l.push([x - w * mul, y]); rr.push([x + w * mul, y]); } return [...rr.reverse(), ...l]; };
    g.fillStyle = LG(g, 0, 524, 0, 690, [[0, '#bcc7c0'], [0.4, '#a3b3af'], [1, '#8fa5a1']]);
    g.fill(poly(band(1)));
    g.strokeStyle = 'rgba(72,58,34,.45)'; g.lineWidth = 2; g.stroke(poly(band(1.3)));
    for (let k = 0; k < 34; k++) {
      const i = k % (RV.length - 1), a = RV[i], b = RV[i + 1], f = rc();
      const x = lerp(a[0], b[0], f) + (rc() - .5) * a[2] * 1.5, y = lerp(a[1], b[1], f);
      g.fillStyle = `rgba(250,250,236,${0.08 + rc() * 0.32})`; g.fillRect(x, y, 1.5 + a[2], 1);
    }

    // 村落
    const village = (vx, vy, vs) => {
      g.save(); g.translate(vx, vy); g.scale(vs, vs);
      for (let k = 0; k < 8; k++) {
        const x = -24 + (k % 4) * 13, y = (k % 3) * 4;
        g.fillStyle = '#cbb99a'; g.fillRect(x, y - 6, 12, 7);
        g.fillStyle = '#96684a'; g.beginPath(); g.moveTo(x - 1, y - 6); g.lineTo(x + 6, y - 11); g.lineTo(x + 13, y - 6); g.closePath(); g.fill();
        g.fillStyle = 'rgba(36,24,12,.35)'; g.fillRect(x, y, 12, 2);
      }
      g.fillStyle = '#c6b494'; g.fillRect(-8, -26, 7, 22); g.fillStyle = '#8a6242'; g.beginPath(); g.moveTo(-10, -26); g.lineTo(-4.5, -34); g.lineTo(1, -26); g.closePath(); g.fill();
      g.restore();
    };
    village(626, 540, 0.85); village(690, 556, 1.0);
    // 石桥
    g.fillStyle = '#c3b28d'; g.fillRect(650, 566, 40, 5);
    g.fillStyle = 'rgba(58,42,26,.5)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(658 + k * 11, 571, 3.8, Math.PI, 0); g.fill(); }
    g.fillStyle = 'rgba(255,248,226,.3)'; g.fillRect(650, 566, 40, 1.2);

    // 柏树列（沿路）
    const cyprus = (x, yb, h, w, dark) => {
      const gr = LG(g, x - w / 2, 0, x + w / 2, 0, [[0, dark ? '#3f4d2c' : '#4a5a33'], [0.4, dark ? '#334027' : '#57683a'], [1, '#2a3520']]);
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, yb - h);
      g.bezierCurveTo(x + w * .5, yb - h * .7, x + w * .48, yb - h * .22, x + w * .4, yb);
      g.lineTo(x - w * .4, yb);
      g.bezierCurveTo(x - w * .48, yb - h * .22, x - w * .5, yb - h * .7, x, yb - h);
      g.fill();
      g.fillStyle = 'rgba(206,208,160,.18)'; g.beginPath(); g.ellipse(x - w * .16, yb - h * .58, w * .12, h * .22, 0.08, 0, 7); g.fill();
    };
    for (let k = 0; k < 10; k++) cyprus(292 + k * 42 + (k % 3) * 6, 560 + k * 4, 22 + k * 1.1, 6 + k * .5, k % 2);
    for (let k = 0; k < 7; k++) cyprus(664 + k * 16, 592 + k * 8, 30 + k * 5, 8 + k * 1.1, k % 3 !== 0);

    // 橄榄树（近大远小，带影）
    for (let k = 0; k < 22; k++) {
      const x = 252 + rc() * 570, y = 556 + rc() * 130, s = 0.45 + (y - 550) / 130;
      if (Math.abs(x - 700) < 36 && y > 600) continue;
      g.fillStyle = 'rgba(48,54,30,.32)'; g.beginPath(); g.ellipse(x + 5 * s, y + 2 * s, 11 * s, 2.6 * s, .2, 0, 7); g.fill();
      g.fillStyle = '#4b5932'; g.beginPath(); g.arc(x, y - 8 * s, 8.5 * s, 0, 7); g.fill();
      g.fillStyle = 'rgba(132,142,84,.5)'; g.beginPath(); g.arc(x - 3 * s, y - 10 * s, 4.6 * s, 0, 7); g.fill();
      g.strokeStyle = '#5a4a2c'; g.lineWidth = 1.4 * s; g.beginPath(); g.moveTo(x, y - 2 * s); g.lineTo(x, y + 2 * s); g.stroke();
    }
    // 路
    g.strokeStyle = 'rgba(120,102,64,.28)'; g.lineWidth = 7; g.beginPath(); g.moveTo(306, 700); g.bezierCurveTo(348, 642, 400, 600, 486, 560); g.stroke();
    g.strokeStyle = 'rgba(210,196,152,.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(306, 700); g.bezierCurveTo(346, 644, 398, 602, 484, 562); g.stroke();

    // 前景灌木（左右成篱，压住底部）
    for (let k = 0; k < 26; k++) {
      const x = 246 + rc() * 580, y = 654 + rc() * 34, s = 0.7 + rc() * 1.1;
      g.fillStyle = `rgba(${44 + rc() * 26},${52 + rc() * 26},${28 + rc() * 16},${0.35 + rc() * 0.3})`;
      g.beginPath(); g.ellipse(x, y, 9 * s, 6 * s, (rc() - .5) * .4, 0, 7); g.fill();
    }
    // 两侧大树（框住窗口）
    const bigTree = (x, yb, s) => {
      g.strokeStyle = '#4a3a22'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(x, yb); g.lineTo(x - 3 * s, yb - 26 * s); g.stroke();
      for (let k = 0; k < 7; k++) {
        const a = -1.2 + k * 0.34, cx2 = x - 3 * s + Math.cos(a) * 13 * s, cy2 = yb - 26 * s + Math.sin(a) * 12 * s;
        g.fillStyle = k % 2 ? 'rgba(52,62,34,.85)' : 'rgba(68,78,42,.85)';
        g.beginPath(); g.ellipse(cx2, cy2, 12 * s, 9 * s, a * .3, 0, 7); g.fill();
      }
      g.fillStyle = 'rgba(150,158,96,.30)'; g.beginPath(); g.ellipse(x - 12 * s, yb - 38 * s, 10 * s, 7 * s, -.3, 0, 7); g.fill();
    };
    bigTree(268, 700, 1.0);

    // 空气雾（远处更淡）
    g.fillStyle = LG(g, 0, 408, 0, 570, [[0, 'rgba(224,224,204,.14)'], [0.45, 'rgba(224,224,204,.10)'], [1, 'rgba(224,224,204,0)']]);
    g.fillRect(240, 408, 620, 162);
    g.restore();
  }

  function paintWindow(g) {
    // 石框投影
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; g.shadowOffsetX = 14; g.shadowOffsetY = 18;
    g.fillStyle = LG(g, 250, 0, 830, 0, [[0, '#e0cca4'], [0.35, '#c6ae82'], [0.7, '#a2885f'], [1, '#77613f']]);
    g.fill(OUT); g.restore();
    // 左受光
    g.fillStyle = LG(g, 246, 0, 470, 0, [[0, 'rgba(255,244,214,.55)'], [1, 'rgba(255,244,214,0)']]); g.fill(OUT);
    // 拱石缝
    g.save(); g.clip(OUT);
    g.strokeStyle = 'rgba(70,48,26,.5)'; g.lineWidth = 2.5;
    for (let k = 0; k <= 11; k++) {
      const a = Math.PI - k * Math.PI / 11, r1 = 254, r2 = 290;
      g.beginPath(); g.moveTo(540 + Math.cos(a) * r1, 400 + Math.sin(a) * r1); g.lineTo(540 + Math.cos(a) * r2, 400 + Math.sin(a) * r2); g.stroke();
    }
    g.restore();
    // 窗洞：远景
    landscape(g);
    // 洞内上缘阴影（拱券厚度的暗）
    g.save(); g.clip(IN);
    g.fillStyle = LG(g, 0, 150, 0, 430, [[0, 'rgba(20,14,8,.62)'], [0.35, 'rgba(20,14,8,.28)'], [1, 'rgba(20,14,8,0)']]); g.fillRect(250, 150, 590, 290);
    g.fillStyle = LG(g, 286, 0, 372, 0, [[0, 'rgba(20,14,8,.38)'], [1, 'rgba(20,14,8,0)']]); g.fillRect(286, 380, 120, 320);
    g.fillStyle = LG(g, 794, 0, 742, 0, [[0, 'rgba(20,14,8,.30)'], [1, 'rgba(20,14,8,0)']]); g.fillRect(742, 380, 60, 320);
    g.restore();
    // 内框
    g.strokeStyle = 'rgba(54,36,18,.65)'; g.lineWidth = 4; g.stroke(IN);
    g.strokeStyle = 'rgba(255,246,220,.22)'; g.lineWidth = 1.5; g.stroke(IN);
    // 窗台
    g.fillStyle = LG(g, 0, 690, 0, 740, [[0, '#e6d2a8'], [0.5, '#c2a97e'], [1, '#8a7250']]);
    g.beginPath(); g.moveTo(214, 690); g.lineTo(866, 690); g.lineTo(880, 730); g.lineTo(200, 730); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,246,214,.3)'; g.fillRect(214, 690, 652, 4);
    g.fillStyle = 'rgba(8,4,2,.45)'; g.fillRect(200, 730, 680, 12);
    g.fillStyle = LG(g, 0, 740, 0, 800, [[0, 'rgba(8,4,2,.5)'], [1, 'rgba(8,4,2,0)']]); g.fillRect(200, 740, 680, 60);
  }

  function paintWindow2(g) {
    // 右侧小拱窗：冷光，衬地球仪与学者后背
    g.fillStyle = LG(g, 3520, 0, 3700, 0, [[0, '#a48d64'], [0.4, '#cbb48a'], [1, '#8b7450']]);
    g.fill(OUT2);
    g.save(); g.clip(IN2);
    g.fillStyle = LG(g, 0, 440, 0, 660, [[0, '#7291ad'], [0.45, '#a8bcc4'], [0.8, '#d6d8c4'], [1, '#e8dfc2']]);
    g.fillRect(3520, 430, 180, 240);
    const r = R_(23);
    for (let k = 0; k < 7; k++) { const x = 3540 + r() * 140, y = 490 + r() * 60, rw = 26 + r() * 46; g.fillStyle = RGd(g, x, y, 0, rw, [[0, 'rgba(250,246,232,.5)'], [1, 'rgba(250,246,232,0)']]); g.save(); g.translate(x, y); g.scale(1, .35); g.translate(-x, -y); g.beginPath(); g.arc(x, y, rw, 0, 7); g.fill(); g.restore(); }
    // 远山与树
    g.fillStyle = '#7e95a4'; g.beginPath(); g.moveTo(3520, 600);
    for (let x = 3520; x <= 3700; x += 4) g.lineTo(x, 584 - Math.abs(P.fbm(x * 0.012, 11, 4)) * 26);
    g.lineTo(3700, 600); g.closePath(); g.fill();
    g.fillStyle = '#87996f'; g.fillRect(3520, 604, 180, 60);
    for (let k = 0; k < 9; k++) { const x = 3530 + r() * 160, y = 610 + r() * 34; g.fillStyle = '#46562f'; g.beginPath(); g.ellipse(x, y - 7, 3, 9, 0, 0, 7); g.fill(); }
    g.restore();
    g.strokeStyle = 'rgba(50,34,18,.6)'; g.lineWidth = 3; g.stroke(IN2);
    // 窗台
    g.fillStyle = LG(g, 0, 650, 0, 690, [[0, '#d9c39b'], [1, '#8e7654']]); g.fillRect(3496, 650, 208, 14);
    g.fillStyle = 'rgba(6,3,1,.5)'; g.fillRect(3496, 664, 208, 10);
  }

  // ---------- 二开间：挂毯、桌、椅 ----------
  function tapestry(g) {
    g.fillStyle = '#8d7551'; g.fillRect(1204, 286, 274, 12);                 // 挂杆
    g.fillStyle = '#5a4526'; g.fillRect(1204, 296, 274, 4);
    const tv = poly([[1220, 300], [1458, 300], [1470, 672], [1208, 672]]);
    g.fillStyle = LG(g, 1220, 300, 1460, 672, [[0, '#24402e'], [0.5, '#2f4f36'], [1, '#1b3123']]); g.fill(tv);
    g.save(); g.clip(tv);
    // 金线框与纹样
    g.strokeStyle = 'rgba(206,168,92,.75)'; g.lineWidth = 5; g.strokeRect(1240, 320, 218, 340);
    g.strokeStyle = 'rgba(206,168,92,.4)'; g.lineWidth = 2; g.strokeRect(1252, 332, 194, 316);
    for (let k = 0; k < 5; k++) {
      const x = 1268 + k * 44, y = 366 + (k % 2) * 10;
      g.fillStyle = 'rgba(196,150,72,.5)'; g.beginPath(); g.ellipse(x, y + 60, 13, 30, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(226,192,120,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y + 30); g.lineTo(x, y + 92); g.stroke();
      g.beginPath(); g.ellipse(x, y + 18, 6, 12, 0, 0, 7); g.stroke();
    }
    // 下部石榴纹
    for (let k = 0; k < 3; k++) {
      const x = 1290 + k * 78, y = 560;
      g.fillStyle = 'rgba(150,60,48,.55)'; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill();
      g.strokeStyle = 'rgba(232,198,128,.5)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 22, 0, 7); g.stroke();
    }
    // 皱影
    const wg = g.createLinearGradient(1220, 0, 1460, 0);
    wg.addColorStop(0, 'rgba(6,10,6,.45)'); wg.addColorStop(.25, 'rgba(6,10,6,0)'); wg.addColorStop(.6, 'rgba(6,10,6,.12)'); wg.addColorStop(.82, 'rgba(6,10,6,.42)'); wg.addColorStop(1, 'rgba(6,10,6,.55)');
    g.fillStyle = wg; g.fillRect(1200, 300, 280, 380);
    g.restore();
  }

  function table(g) {
    // 桌下软影（贴地、边缘化开）
    g.save(); g.filter = 'blur(10px)';
    g.fillStyle = 'rgba(12,6,2,.46)'; g.beginPath(); g.ellipse(1734, 1004, 336, 30, 0, 0, 7); g.fill();
    g.restore();
    // 桌腿：旋木腿（柱身＋两道铜箍）
    const leg = (x, y0, y1, w) => {
      g.fillStyle = LG(g, x - w / 2, 0, x + w / 2, 0, [[0, '#9a6434'], [0.35, '#7a4a24'], [0.72, '#54301a'], [1, '#361d0d']]);
      g.fill(R.smooth([[x - w / 2, y0], [x + w / 2, y0], [x + w * .42, y0 + 26], [x + w * .34, y1 - 30], [x + w * .52, y1], [x - w * .52, y1], [x - w * .34, y1 - 30], [x - w * .42, y0 + 26]]));
      g.fillStyle = 'rgba(240,190,120,.22)'; g.fillRect(x - w * .3, y0 + 34, 3, y1 - y0 - 70);
      g.fillStyle = 'rgba(18,9,3,.5)'; g.fillRect(x + w * .16, y0 + 30, 4, y1 - y0 - 60);
      g.fillStyle = 'rgba(214,180,110,.30)'; g.fillRect(x - w * .5, y0 + 40, w, 4); g.fillRect(x - w * .48, y1 - 46, w * .96, 4);
    };
    leg(1502, 878, 1004, 34); leg(1994, 878, 1004, 34);
    // 横撑
    g.fillStyle = LG(g, 0, 940, 0, 954, [[0, '#7a4a24'], [1, '#3a2010']]); g.fillRect(1508, 940, 490, 13);
    // 桌布垂下的主体（含上表面一条窄带）
    const front = poly([[1406, 706], [2076, 706], [2094, 872], [1500, 890], [1398, 876]]);
    g.fillStyle = LG(g, 1390, 0, 2090, 0, [[0, '#efe0bf'], [0.28, '#e3d1ac'], [0.6, '#cbb692'], [0.86, '#a89072'], [1, '#7d6850']]);
    g.fill(front);
    g.save(); g.clip(front);
    // 上表面（受窗光，暖白）
    g.fillStyle = LG(g, 0, 690, 0, 708, [[0, '#f6ecd2'], [1, 'rgba(246,236,210,0)']]); g.fillRect(1400, 686, 690, 24);
    // 褶：不等距的暗谷 + 亮脊（顺桌沿垂下）
    const folds = [[1434, 18], [1478, 26], [1522, 14], [1558, 30], [1604, 16], [1640, 24], [1690, 14], [1726, 28], [1772, 18], [1812, 22], [1858, 14], [1898, 26], [1942, 16], [1984, 22], [2030, 26], [2070, 12]];
    for (const [x, w] of folds) {
      const gr = LG(g, x - w / 2, 0, x + w / 2, 0, [[0, 'rgba(60,42,24,0)'], [0.34, 'rgba(60,42,24,.12)'], [0.5, 'rgba(40,26,12,.17)'], [0.74, 'rgba(60,42,24,.08)'], [1, 'rgba(255,248,224,.16)']]);
      g.fillStyle = gr; g.fillRect(x - w / 2, 704, w, 190);
    }
    // 一条横向的软褶（布压在桌沿上）
    g.fillStyle = LG(g, 0, 748, 0, 790, [[0, 'rgba(40,26,12,0)'], [0.5, 'rgba(40,26,12,.14)'], [1, 'rgba(40,26,12,0)']]); g.fillRect(1400, 748, 700, 42);
    // 桌沿翻折的高光（受光边）
    g.fillStyle = LG(g, 0, 700, 0, 716, [[0, 'rgba(255,250,232,0)'], [0.5, 'rgba(255,250,232,.55)'], [1, 'rgba(255,250,232,0)']]); g.fillRect(1404, 700, 680, 16);
    // 布角堆积（左端下垂多一点）
    g.fillStyle = 'rgba(48,30,14,.28)'; g.beginPath(); g.moveTo(1400, 720); g.quadraticCurveTo(1420, 812, 1406, 878); g.lineTo(1450, 884); g.quadraticCurveTo(1452, 790, 1462, 712); g.closePath(); g.fill();
    // 金线绣边（下摆）
    g.strokeStyle = 'rgba(202,162,86,.9)'; g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(1500, 884); g.quadraticCurveTo(1740, 878, 2090, 866); g.stroke();
    g.strokeStyle = 'rgba(226,190,116,.5)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(1500, 890); g.quadraticCurveTo(1740, 884, 2090, 872); g.stroke();
    for (let x = 1520; x < 2060; x += 30) {
      g.strokeStyle = 'rgba(214,176,100,.45)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(x, 878 + Math.sin(x * .02) * 2); g.lineTo(x + 7, 890); g.lineTo(x + 15, 878); g.stroke();
    }
    // 底部压暗（桌布在阴影里）
    g.fillStyle = LG(g, 0, 826, 0, 892, [[0, 'rgba(34,20,10,0)'], [0.6, 'rgba(34,20,10,.18)'], [1, 'rgba(34,20,10,.44)']]); g.fillRect(1390, 826, 700, 70);
    g.restore();
    g.strokeStyle = 'rgba(74,54,34,.30)'; g.lineWidth = 1.6; g.stroke(front);
    // 桌下暗部
    g.fillStyle = LG(g, 0, 872, 0, 1004, [[0, 'rgba(10,5,2,.55)'], [1, 'rgba(10,5,2,.18)']]); g.fillRect(1500, 872, 500, 132);
  }

  function chair(g) {
    const wood = (x, y, w, h, d) => { g.fillStyle = LG(g, x, 0, x + w, 0, [[0, d ? '#4c2a14' : '#8a5528'], [0.4, d ? '#3a1f0e' : '#a96c34'], [1, '#3a1f0e']]); g.fillRect(x, y, w, h); };
    // 影
    g.save(); g.filter = 'blur(6px)'; g.fillStyle = 'rgba(10,5,2,.35)'; g.beginPath(); g.ellipse(2072, 1002, 96, 12, 0, 0, 7); g.fill(); g.restore();
    // 后腿＋靠背框
    wood(2116, 700, 16, 304, true); wood(2016, 706, 15, 296, true);
    wood(2016, 452, 116, 14, false);                    // 顶横档
    wood(2016, 452, 14, 254, false);                    // 左立柱
    wood(2118, 452, 14, 254, true);                     // 右立柱
    for (let k = 0; k < 4; k++) wood(2034, 486 + k * 44, 84, 10, k % 2 === 1);
    g.fillStyle = 'rgba(226,186,124,.35)'; g.beginPath(); g.arc(2023, 440, 9, 0, 7); g.fill();
    // 座面
    g.fillStyle = LG(g, 2006, 690, 2140, 700, [[0, '#a96c34'], [1, '#5a3218']]);
    g.fill(poly([[2022, 706], [2126, 700], [2132, 714], [2028, 720]]));
    g.fillStyle = 'rgba(20,10,4,.4)'; g.fillRect(2028, 716, 104, 6);
    // 前腿
    wood(2024, 718, 18, 286, false); wood(2120, 712, 18, 292, true);
    // 横撑
    wood(2030, 880, 100, 10, true);
  }

  function cushion(g) {
    g.save(); g.filter = 'blur(9px)'; g.fillStyle = 'rgba(12,6,2,.32)'; g.beginPath(); g.ellipse(980, 1018, 148, 11, 0, 0, 7); g.fill(); g.restore();
    // 垫体厚度（下缘鼓出）
    const cb = new Path2D(); cb.ellipse(980, 1006, 158, 42, 0, 0, Math.PI * 2);
    g.fillStyle = LG(g, 820, 0, 1140, 0, [[0, '#5e1214'], [0.45, '#7a1c1c'], [1, '#3c0a0a']]); g.fill(cb);
    const cu = new Path2D(); cu.ellipse(980, 1000, 158, 42, 0, 0, Math.PI * 2);
    g.fillStyle = LG(g, 820, 0, 1140, 0, [[0, '#7e1a1c'], [0.42, '#a02c28'], [0.78, '#7c1718'], [1, '#521010']]); g.fill(cu);
    g.save(); g.clip(cu);
    // 丝绒的明暗与绒面
    g.fillStyle = RGd(g, 930, 980, 10, 130, [[0, 'rgba(226,120,96,.32)'], [1, 'rgba(226,120,96,0)']]); g.fillRect(820, 958, 320, 84);
    g.fillStyle = 'rgba(24,6,6,.35)'; g.fillRect(820, 1012, 320, 30);
    const r0 = R_(33);
    for (let k = 0; k < 220; k++) { const x = 828 + r0() * 304, y = 962 + r0() * 76; g.strokeStyle = r0() < .5 ? 'rgba(255,170,140,.10)' : 'rgba(30,6,4,.12)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 2); g.stroke(); }
    // 三处绒面凹窝
    for (const [x, y] of [[918, 986], [980, 992], [1044, 986]]) { g.fillStyle = 'rgba(40,8,6,.28)'; g.beginPath(); g.ellipse(x, y, 7, 3, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,190,160,.18)'; g.beginPath(); g.ellipse(x, y - 4, 9, 3, 0, 0, 7); g.fill(); }
    g.restore();
    g.strokeStyle = 'rgba(232,190,112,.55)'; g.lineWidth = 2.2; g.stroke(cu);
    for (const x of [826, 1134]) { g.fillStyle = '#d0a458'; g.beginPath(); g.arc(x, 1024, 7, 0, 7); g.fill(); g.strokeStyle = 'rgba(88,58,20,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, 1030); g.quadraticCurveTo(x + 3, 1044, x, 1054); g.stroke(); }
  }

  function chest(g) {
    // 橡木箱（中景空档里的暖色块）
    const x0 = 2592, x1 = 2856, yb = 1000, yt = 900;
    g.save(); g.filter = 'blur(12px)'; g.fillStyle = 'rgba(10,5,2,.42)';
    g.beginPath(); g.ellipse((x0 + x1) / 2, yb + 8, (x1 - x0) / 2 + 26, 16, 0, 0, 7); g.fill(); g.restore();
    // 侧面（受右后方空气影响略暗）
    g.fillStyle = LG(g, x0, 0, x1, 0, [[0, '#6b4526'], [0.3, '#84552f'], [0.75, '#4e2f18'], [1, '#301a0c']]);
    g.fill(poly([[x0, yt], [x1, yt - 6], [x1 + 10, yb - 4], [x0 - 6, yb]]));
    // 箱盖（微拱）
    g.fillStyle = LG(g, 0, yt - 26, 0, yt + 10, [[0, '#9a6434'], [0.45, '#7a4a24'], [1, '#4a2a14']]);
    g.fill(poly([[x0 - 8, yt + 2], [x1 + 12, yt - 6], [x1 + 12, yt + 18], [x0 - 8, yt + 24]]));
    g.fillStyle = 'rgba(255,214,158,.16)'; g.fillRect(x0 - 4, yt + 3, x1 - x0 + 12, 3);
    // 铁箍
    for (const t of [0.16, 0.5, 0.84]) {
      const x = x0 + (x1 - x0) * t;
      g.fillStyle = LG(g, x - 9, 0, x + 11, 0, [[0, '#3a3a3e'], [0.45, '#6d6a68'], [1, '#26262a']]);
      g.fill(poly([[x - 9, yt + 22], [x + 11, yt + 20], [x + 15, yb - 2], [x - 7, yb]]));
      g.fillStyle = 'rgba(240,236,220,.18)'; g.fillRect(x - 6, yt + 24, 3, yb - yt - 30);
    }
    // 锁扣
    g.fillStyle = '#c8a45c'; g.fillRect(2812, 916, 30, 34);
    g.fillStyle = '#8a6a2c'; g.fillRect(2818, 924, 24, 12);
    g.fillStyle = 'rgba(255,240,190,.5)'; g.fillRect(2813, 918, 26, 3);
    // 木纹与磨损
    const r = R_(77);
    for (let k = 0; k < 70; k++) {
      const x = x0 + 6 + r() * (x1 - x0 - 12), y = yt + 30 + r() * (yb - yt - 36);
      g.strokeStyle = r() < .5 ? 'rgba(46,26,12,.28)' : 'rgba(226,186,132,.10)';
      g.lineWidth = 1 + r() * 1.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 14, y + (r() - .5) * 8, x + 30 + r() * 26, y + (r() - .5) * 6); g.stroke();
    }
    // 箱盖上的叠布
    g.fillStyle = LG(g, 2646, 0, 2860, 0, [[0, '#7e2a22'], [0.4, '#9a3a2c'], [1, '#54150f']]);
    g.fill(poly([[2650, yt + 4], [2740, yt - 4], [2796, yt + 8], [2700, yt + 20]]));
    g.fillStyle = 'rgba(255,190,150,.12)'; g.fill(poly([[2652, yt + 6], [2742, yt - 2], [2760, yt + 3], [2670, yt + 12]]));
    // 箱底暗影
    g.fillStyle = LG(g, 0, yb - 24, 0, yb, [[0, 'rgba(10,5,2,0)'], [1, 'rgba(10,5,2,.55)']]); g.fillRect(x0 - 8, yb - 26, x1 - x0 + 20, 28);
  }

  // ---------- 三开间：书架、维特鲁威、画案 ----------
  function shelves(g) {
    g.fillStyle = 'rgba(14,7,3,.4)'; g.fillRect(2290, 690, 200, 8);
    const wood = (x, y, w, h) => { g.fillStyle = LG(g, x, 0, x + w, 0, [[0, '#4a2c16'], [0.4, '#6d4324'], [1, '#2f1a0c']]); g.fillRect(x, y, w, h); };
    wood(2296, 250, 12, 440); wood(2462, 250, 12, 440); wood(2296, 250, 178, 10);
    const spines = ['#7c1c1a', '#3f4a2a', '#6b4a24', '#2f3f55', '#cbb489', '#8a5a2a', '#4a2a3e'];
    for (let s2 = 0; s2 < 4; s2++) {
      const y = 300 + s2 * 96; wood(2296, y + 80, 178, 9);
      let x = 2306;
      const r = R_(40 + s2);
      while (x < 2450) {
        const w = 6 + r() * 12, h = 56 + r() * 18;
        g.fillStyle = spines[(r() * spines.length) | 0]; g.fillRect(x, y + 78 - h, w, h);
        g.fillStyle = 'rgba(255,226,180,.35)'; g.fillRect(x, y + 78 - h, w, 2);
        g.fillStyle = 'rgba(20,10,4,.4)'; g.fillRect(x + w - 1, y + 78 - h, 1.5, h);
        if (r() < 0.35) { g.fillStyle = 'rgba(206,170,92,.5)'; g.fillRect(x + 1, y + 78 - h + 12, w - 2, 3); }
        x += w + 1.5;
      }
      // 横放的卷册
      if (s2 % 2) { g.fillStyle = '#d8c9a4'; g.fillRect(2312, y + 62, 74, 8); g.fillRect(2312, y + 52, 74, 8); g.fillStyle = 'rgba(60,40,20,.45)'; g.fillRect(2312, y + 60, 74, 2); }
    }
  }

  function vitruvian(g) {
    g.save(); g.translate(2645, 480); g.rotate(-0.018);
    const sheet = poly([[-132, -158], [132, -150], [140, 156], [-126, 162]]);
    g.fillStyle = LG(g, -132, 0, 138, 0, [[0, '#e5d6b2'], [0.55, '#d6c49c'], [1, '#b9a276']]); g.fill(sheet);
    g.save(); g.clip(sheet);
    // 旧纸斑
    const r = R_(51);
    for (let k = 0; k < 22; k++) { const x = -120 + r() * 250, y = -150 + r() * 300, rr = 10 + r() * 40; g.fillStyle = RGd(g, x, y, 0, rr, [[0, 'rgba(150,110,60,.18)'], [1, 'rgba(150,110,60,0)']]); g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); }
    // 圆与方
    g.strokeStyle = 'rgba(78,48,22,.72)'; g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, 112, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(78,48,22,.55)'; g.lineWidth = 1.6; g.strokeRect(-108, -108, 216, 216);
    g.beginPath(); g.moveTo(-108, 108); g.lineTo(108, -108); g.moveTo(-108, -108); g.lineTo(108, 108); g.stroke();
    // 人体比例图（正面站姿 + 双臂平举）
    g.strokeStyle = 'rgba(64,38,16,.8)'; g.lineWidth = 2;
    g.beginPath(); g.arc(0, -76, 17, 0, 7); g.stroke();                     // 头
    g.beginPath(); g.moveTo(0, -59); g.lineTo(0, 34); g.stroke();           // 脊
    g.beginPath(); g.moveTo(-78, -30); g.lineTo(78, -30); g.stroke();       // 平举双臂
    g.beginPath(); g.moveTo(-26, 46); g.lineTo(0, 34); g.lineTo(26, 46); g.stroke();
    g.beginPath(); g.moveTo(0, 34); g.lineTo(-16, 108); g.moveTo(0, 34); g.lineTo(18, 108); g.stroke();
    g.beginPath(); g.ellipse(0, 6, 30, 46, 0, 0, 7); g.stroke();
    // 角注：小字行（写成短线，远看是笔记）
    g.strokeStyle = 'rgba(70,44,20,.5)'; g.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) { const y = -150 + k * 9; g.beginPath(); g.moveTo(-120, y); g.lineTo(-120 + 40 + (k % 3) * 12, y); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(80,55,28,.45)'; g.lineWidth = 2; g.stroke(sheet);
    g.restore();
    // 钉：两枚红蜡封
    for (const [x, y] of [[2522, 330], [2762, 326]]) { g.fillStyle = '#8c2018'; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,170,.35)'; g.beginPath(); g.arc(x - 3, y - 3, 4, 0, 7); g.fill(); }
  }

  function desk(g) {
    g.fillStyle = 'rgba(12,6,2,.5)'; g.beginPath(); g.ellipse(3140, 1006, 330, 24, 0, 0, 7); g.fill();
    const wood = (p, d) => { g.fillStyle = LG(g, p[0][0], p[0][1], p[1][0], p[1][1], [[0, d ? '#4a2c16' : '#7c4a24'], [0.4, d ? '#5d3620' : '#9a6234'], [1, '#2c1809']]); g.fill(poly(p)); };
    // 斜面板：后高前低
    g.fillStyle = LG(g, 0, 700, 0, 806, [[0, '#8a5730'], [0.45, '#6d4122'], [1, '#422512']]);
    g.fill(poly([[2838, 700], [3448, 700], [3462, 800], [2862, 810]]));
    // 前裙板
    wood([[2862, 810], [3462, 800], [3464, 872], [2860, 884]], true);
    g.fillStyle = 'rgba(255,226,180,.10)'; g.fillRect(2866, 812, 596, 4);
    // 桌腿（X 形撑）
    wood([[2892, 884], [2916, 884], [2912, 1000], [2888, 1000]], true);
    wood([[3404, 872], [3428, 872], [3432, 1000], [3408, 1000]], true);
    g.strokeStyle = 'rgba(60,34,16,.9)'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(2904, 930); g.lineTo(3418, 990); g.moveTo(2904, 990); g.lineTo(3418, 930); g.stroke();
    // 桌面上的羊皮纸（静态底稿）
    const sh = poly([[2920, 726], [3142, 720], [3152, 792], [2928, 800]]);
    g.fillStyle = LG(g, 2920, 0, 3150, 0, [[0, '#e9dcba'], [0.6, '#d9c79f'], [1, '#bfa87c']]); g.fill(sh);
    g.strokeStyle = 'rgba(90,60,30,.45)'; g.lineWidth = 1.5; g.stroke(sh);
    g.save(); g.clip(sh);
    g.strokeStyle = 'rgba(96,62,30,.55)'; g.lineWidth = 1.6;
    g.beginPath(); g.arc(3028, 762, 62, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(2966, 762); g.lineTo(3090, 762); g.stroke();
    g.beginPath(); g.arc(3028, 762, 44, Math.PI * .85, Math.PI * 1.65); g.stroke();
    for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2; g.beginPath(); g.moveTo(3028 + Math.cos(a) * 56, 762 + Math.sin(a) * 56); g.lineTo(3028 + Math.cos(a) * 62, 762 + Math.sin(a) * 62); g.stroke(); }
    g.restore();
    // 第二张纸：鸟翼标本草图
    const sh2 = poly([[3160, 716], [3378, 710], [3390, 780], [3168, 792]]);
    g.fillStyle = LG(g, 3160, 0, 3380, 0, [[0, '#e6d8b6'], [1, '#c8b088']]); g.fill(sh2);
    g.strokeStyle = 'rgba(88,58,28,.4)'; g.lineWidth = 1.4; g.stroke(sh2);
    g.save(); g.clip(sh2);
    g.strokeStyle = 'rgba(92,58,26,.7)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(3200, 752); g.lineTo(3270, 736); g.stroke();
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(3206 + k * 11, 750 - k * 2); g.quadraticCurveTo(3220 + k * 12, 716, 3244 + k * 11, 742 - k * 3); g.stroke(); }
    g.restore();
    // 墨水瓶与羽管笔
    g.fillStyle = '#2e1a0c'; g.beginPath(); g.ellipse(2892, 736, 18, 7, 0, 0, 7); g.fill();
    g.fillStyle = LG(g, 2874, 0, 2910, 0, [[0, '#8a9aa0'], [0.4, '#c8d2d2'], [1, '#4a5a60']]); g.fillRect(2876, 718, 34, 18);
    g.fillStyle = '#1b2226'; g.beginPath(); g.ellipse(2893, 719, 15, 5, 0, 0, 7); g.fill();
    g.strokeStyle = '#efe6d0'; g.lineWidth = 3; g.beginPath(); g.moveTo(2896, 718); g.quadraticCurveTo(2912, 686, 2932, 662); g.stroke();
    g.fillStyle = 'rgba(160,140,110,.5)'; g.beginPath(); g.ellipse(2920, 676, 12, 16, 0.5, 0, 7); g.fill();
  }

  function stool(g) {
    const wood = (p) => { g.fillStyle = '#4a2c16'; g.fill(poly(p)); };
    wood([[3086, 866], [3100, 866], [3080, 1004], [3066, 1004]]);
    wood([[3216, 866], [3230, 866], [3244, 1004], [3230, 1004]]);
    g.fillStyle = LG(g, 0, 856, 0, 876, [[0, '#8a5730'], [1, '#4a2c16']]); g.fillRect(3080, 856, 152, 20);
    g.fillStyle = 'rgba(12,6,2,.4)'; g.beginPath(); g.ellipse(3156, 1006, 96, 12, 0, 0, 7); g.fill();
  }

  function globeStand(g) {
    g.strokeStyle = LG(g, 0, 760, 0, 810, [[0, '#e2c07a'], [1, '#8a6328']]); g.lineWidth = 5;
    g.beginPath(); g.moveTo(3385, 800); g.lineTo(3385, 736); g.stroke();
    g.fillStyle = '#c8a45c'; g.beginPath(); g.ellipse(3385, 804, 42, 10, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,236,180,.4)'; g.beginPath(); g.ellipse(3378, 800, 22, 5, 0, 0, 7); g.fill();
    // 黄铜子午环
    g.strokeStyle = LG(g, 3330, 0, 3450, 0, [[0, '#e8c98a'], [0.5, '#b78d3e'], [1, '#6e4a18']]); g.lineWidth = 6;
    g.beginPath(); g.ellipse(3385, 660, 56, 62, 0.12, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(255,240,190,.45)'; g.lineWidth = 2; g.beginPath(); g.ellipse(3381, 656, 51, 57, 0.12, 0, 7); g.stroke();
  }

  // ---------- 静物（桌面） ----------
  function stillLife(g) {
    // 桌旗：深红天鹅绒，压金边（给桌面一条重色）
    const run = poly([[1444, 676], [2050, 676], [2062, 706], [1436, 706]]);
    g.fillStyle = LG(g, 1436, 0, 2062, 0, [[0, '#6d1418'], [0.3, '#8a1e20'], [0.68, '#6a1216'], [1, '#4a0c10']]); g.fill(run);
    g.save(); g.clip(run);
    g.fillStyle = 'rgba(255,190,150,.12)'; g.fillRect(1440, 678, 620, 4);
    const rr0 = R_(44);
    for (let k = 0; k < 300; k++) { const x = 1436 + rr0() * 626, y = 678 + rr0() * 28; g.strokeStyle = rr0() < .5 ? 'rgba(255,160,130,.06)' : 'rgba(20,4,4,.10)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y + 2); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(206,166,92,.85)'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(1444, 678); g.lineTo(2050, 678); g.stroke();
    g.strokeStyle = 'rgba(206,166,92,.6)'; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(1440, 704); g.lineTo(2058, 704); g.stroke();

    const shade = (x, y, rx, ry) => { g.save(); g.filter = 'blur(5px)'; g.fillStyle = 'rgba(28,14,6,.34)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.restore(); };

    // —— 银盘与果物 —— 
    shade(1560, 700, 62, 8);
    const dish = new Path2D(); dish.ellipse(1534, 690, 64, 14, 0, 0, Math.PI * 2);
    g.fillStyle = LG(g, 1470, 676, 1600, 704, [[0, '#f4f7f7'], [0.3, '#cfd7d8'], [0.62, '#93a0a2'], [1, '#5c6768']]); g.fill(dish);
    g.save(); g.clip(dish);
    g.fillStyle = 'rgba(60,40,20,.35)'; g.fillRect(1470, 688, 160, 20);
    g.fillStyle = 'rgba(255,255,250,.5)'; g.fillRect(1476, 682, 130, 3);
    g.restore();
    g.strokeStyle = 'rgba(255,255,252,.55)'; g.lineWidth = 1.8; g.stroke(dish);
    g.strokeStyle = 'rgba(40,50,52,.3)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(1534, 689, 52, 10, 0, 0, 7); g.stroke();

    // 石榴
    const pom = (x, y, r0) => {
      g.fillStyle = RGd(g, x - 6, y - 7, 2, r0 * 1.15, [[0, '#d8573f'], [0.42, '#a02420'], [1, '#540b0b']]);
      g.beginPath(); g.arc(x, y, r0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,214,180,.35)'; g.beginPath(); g.ellipse(x - r0 * .32, y - r0 * .38, r0 * .3, r0 * .18, -.6, 0, 7); g.fill();
      g.fillStyle = '#6d1412'; g.beginPath(); g.moveTo(x - 4, y - r0 + 1); g.lineTo(x - 2, y - r0 - 8); g.lineTo(x + 3, y - r0 - 5); g.lineTo(x + 5, y - r0 + 2); g.closePath(); g.fill();
    };
    pom(1514, 672, 19); pom(1548, 678, 15);
    // 无花果
    for (const [x, y] of [[1558, 688], [1528, 690], [1574, 690]]) {
      g.fillStyle = RGd(g, x - 2, y - 4, 1, 13, [[0, '#7d5a34'], [0.45, '#4e341c'], [1, '#28170a']]);
      g.beginPath(); g.ellipse(x, y, 10, 8, .25, 0, 7); g.fill();
      g.strokeStyle = 'rgba(186,150,96,.45)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 2, y - 11); g.stroke();
    }
    // 葡萄
    const rv = R_(6);
    for (let k = 0; k < 14; k++) {
      const x = 1584 + (rv() - .5) * 34, y = 682 - rv() * 24;
      g.fillStyle = RGd(g, x - 2, y - 3, 1, 9, [[0, '#9c7aa8'], [0.42, '#5f3a66'], [1, '#2c1834']]);
      g.beginPath(); g.arc(x, y, 7.4, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,236,255,.3)'; g.beginPath(); g.arc(x - 2, y - 2.6, 1.9, 0, 7); g.fill();
    }
    g.strokeStyle = 'rgba(110,80,50,.7)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1590, 664); g.quadraticCurveTo(1602, 650, 1614, 646); g.stroke();

    // —— 黄铜烛台（烛已点着，火苗在动态层）—— 
    shade(1646, 700, 26, 6);
    g.fillStyle = LG(g, 1612, 0, 1672, 0, [[0, '#f4d898'], [0.28, '#c99a48'], [0.66, '#8a6326'], [1, '#4e3610']]);
    g.beginPath(); g.ellipse(1642, 700, 26, 7, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(1632, 698); g.quadraticCurveTo(1628, 676, 1634, 660); g.lineTo(1650, 660); g.quadraticCurveTo(1656, 676, 1652, 698); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(1642, 656, 19, 6, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,240,190,.5)'; g.fillRect(1633, 662, 3, 34);
    // 蜡烛
    g.fillStyle = LG(g, 1634, 0, 1652, 0, [[0, '#efe6cd'], [0.45, '#f7f0da'], [1, '#c2b697']]);
    g.fillRect(1636, 604, 13, 52);
    g.fillStyle = 'rgba(255,250,232,.5)'; g.fillRect(1637, 606, 3, 48);
    g.fillStyle = 'rgba(120,90,50,.35)'; g.fillRect(1645, 610, 2.5, 44);
    // 烛芯
    g.strokeStyle = '#3a2a18'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1642, 605); g.lineTo(1641, 597); g.stroke();

    // —— 沙漏 —— 
    shade(1706, 700, 22, 5);
    const hg = poly([[1688, 618], [1690, 620], [1690, 650], [1704, 668], [1690, 690], [1690, 700], [1722, 700], [1722, 690], [1708, 668], [1722, 650], [1722, 620], [1724, 618]])
    ;
    g.fillStyle = 'rgba(198,222,214,.30)'; g.fill(hg);
    g.save(); g.clip(hg);
    g.fillStyle = 'rgba(255,255,250,.55)'; g.fillRect(1694, 622, 2, 34); g.fillRect(1700, 670, 1.6, 19);
    g.fillStyle = 'rgba(120,150,140,.35)'; g.fillRect(1706, 626, 8, 30);
    g.restore();
    g.strokeStyle = 'rgba(70,96,88,.55)'; g.lineWidth = 1.4; g.stroke(hg);
    g.fillStyle = '#5a3a1c'; g.fillRect(1686, 612, 38, 7); g.fillRect(1686, 696, 38, 6);
    g.fillStyle = 'rgba(230,190,120,.35)'; g.fillRect(1686, 612, 38, 2);
    // 沙
    g.fillStyle = '#d9b273';
    g.beginPath(); g.moveTo(1694, 692); g.lineTo(1716, 692); g.lineTo(1705, 676); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(1697, 626); g.lineTo(1713, 626); g.lineTo(1708, 636); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(214,176,110,.8)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(1705, 640); g.lineTo(1705, 668); g.stroke();

    // —— 摊开的书 —— 
    shade(1810, 704, 60, 6);
    g.fillStyle = '#4a2a12'; g.fill(poly([[1752, 684], [1760, 680], [1884, 688], [1876, 692]]));
    const bk = poly([[1758, 684], [1878, 690], [1886, 706], [1750, 706]]);
    g.fillStyle = LG(g, 1750, 0, 1888, 0, [[0, '#f1e6c8'], [0.5, '#dfcfa8'], [1, '#b8a67e']]); g.fill(bk);
    g.save(); g.clip(bk);
    g.strokeStyle = 'rgba(88,58,30,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(1822, 686); g.lineTo(1826, 706); g.stroke();
    g.strokeStyle = 'rgba(88,58,30,.26)'; g.lineWidth = .9;
    for (let k = 0; k < 7; k++) { const y = 688 + k * 2.2; g.beginPath(); g.moveTo(1762, y + 1); g.lineTo(1818, y); g.stroke(); g.beginPath(); g.moveTo(1830, y); g.lineTo(1878, y + 1); g.stroke(); }
    // 红书签
    g.fillStyle = '#9e2a26'; g.fillRect(1824, 684, 6, 24);
    g.fillStyle = 'rgba(40,0,0,.3)'; g.fillRect(1829, 684, 2, 20);
    g.restore();
    g.strokeStyle = 'rgba(90,60,30,.4)'; g.lineWidth = 1.4; g.stroke(bk);

    // —— 绿玻璃瓶 —— 
    shade(1928, 700, 24, 5);
    const fl = poly([[1918, 640], [1930, 634], [1938, 642], [1938, 664], [1952, 676], [1956, 700], [1900, 700], [1904, 676], [1918, 664]])
    ;
    g.fillStyle = 'rgba(126,172,146,.52)'; g.fill(fl);
    g.save(); g.clip(fl);
    g.fillStyle = 'rgba(34,66,50,.55)'; g.fillRect(1900, 676, 60, 26);
    g.fillStyle = 'rgba(255,255,244,.6)'; g.fillRect(1913, 642, 3.4, 34); g.fillRect(1943, 682, 2.6, 18);
    g.fillStyle = 'rgba(220,240,220,.3)'; g.fillRect(1926, 644, 8, 28);
    g.restore();
    g.strokeStyle = 'rgba(78,116,96,.6)'; g.lineWidth = 1.4; g.stroke(fl);
    g.fillStyle = '#8d7b4c'; g.beginPath(); g.ellipse(1928, 634, 6, 3, 0, 0, 7); g.fill();
  }

  // 烛火：世界空间里的动态小光源
  function candleFlame(c, t) {
    const x = 1641, y = 596, fl = 1 + Math.sin(t * 9.3) * 0.12 + Math.sin(t * 21.7) * 0.06;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const halo = RGd(c, x, y - 4, 2, 56, [[0, `rgba(255,206,130,${0.34 * fl})`], [0.35, 'rgba(255,186,100,.13)'], [1, 'rgba(255,186,100,0)']]);
    c.fillStyle = halo; c.fillRect(x - 60, y - 60, 120, 120);
    c.fillStyle = 'rgba(255,248,214,.95)';
    c.beginPath(); c.moveTo(x, y - 16 * fl); c.bezierCurveTo(x + 6, y - 6, x + 4.6, y + 1, x, y + 2.4); c.bezierCurveTo(x - 4.6, y + 1, x - 6, y - 6, x, y - 16 * fl); c.fill();
    c.fillStyle = 'rgba(255,232,160,.9)';
    c.beginPath(); c.ellipse(x, y - 2, 3.6, 5.2 * fl, 0, 0, 7); c.fill();
    c.restore();
  }

  // ---------- 静态层 ----------
  const STATIC = () => cache('world', W, H, (g) => {
    const raw = document.createElement('canvas'); raw.width = W; raw.height = H;
    const rg = raw.getContext('2d');
    paintWall(rg); wallDecor(rg); paintFloor(rg);
    paintWindow(rg); paintWindow2(rg);
    tapestry(rg); table(rg); chair(rg); cushion(rg);
    chest(rg); shelves(rg); vitruvian(rg); desk(rg); stool(rg); globeStand(rg);
    stillLife(rg);
    rg.fillStyle = 'rgba(10,6,3,.35)'; rg.beginPath(); rg.ellipse(3110, 1004, 250, 18, 0, 0, 7); rg.fill();
    rg.fillStyle = 'rgba(10,6,3,.22)'; rg.beginPath(); rg.ellipse(3120, 640, 170, 22, 0, 0, 7); rg.fill();
    // 定向光：窗光为主光，越往右越冷、越暗（先塑体积，再揉笔触）
    const lmask = new Path2D(); lmask.rect(0, 0, W, H); lmask.addPath(OUT); lmask.addPath(OUT2);
    rg.save(); rg.clip(lmask, 'evenodd'); rg.globalCompositeOperation = 'multiply';
    rg.fillStyle = RGd(rg, 470, 420, 40, 2980, [[0, 'rgb(255,251,242)'], [0.3, 'rgb(246,236,218)'], [0.62, 'rgb(206,198,192)'], [0.85, 'rgb(160,156,162)'], [1, 'rgb(120,118,128)']]);
    rg.fillRect(0, 0, W, H);
    rg.restore(); rg.globalCompositeOperation = 'source-over';
    g.filter = 'blur(1.8px)'; g.drawImage(raw, 0, 0); g.filter = 'none';
    oilPass(g.canvas, 4, 0.30, false);
    oilPass(g.canvas, 10, 0.16, false);
  });

  // ---------- 镜内动态：云影、河光、飞鸟、扑翼机 ----------
  function ornithopter(c, t) {
    const q = clamp(t / 3.25, 0, 1), x = lerp(310, 790, q), y = 462 - q * 54 + Math.sin(t * 4.2) * 8;
    c.save(); c.clip(IN); c.translate(x, y); c.rotate(-0.07 + Math.sin(t * 3.4 + 1) * 0.06); c.scale(1.65, 1.65);
    const wing = (sc, dark, ph) => {
      const up = 0.5 + 0.5 * Math.sin(t * 11 + ph);
      const tip = [-26 * sc, (-114 * up + 26 * (1 - up)) * sc];
      const back = [-130 * sc, (-28 * up + 20) * sc];
      const ribs = 6, ends = [];
      for (let k = 0; k <= ribs; k++) {
        const u = k / ribs;
        ends.push([lerp(tip[0], back[0], u) - Math.sin(u * Math.PI) * 24 * sc, lerp(tip[1], back[1], u) - Math.sin(u * Math.PI) * 9 * sc * (up - 0.3)]);
      }
      c.fillStyle = dark ? 'rgba(146,112,74,.94)' : 'rgba(222,196,150,.97)';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(...ends[0]);
      for (let k = 1; k <= ribs; k++) { const a = ends[k - 1], b = ends[k], m = [(a[0] + b[0]) / 2 + 6 * sc, (a[1] + b[1]) / 2 + 9 * sc]; c.quadraticCurveTo(m[0], m[1], b[0], b[1]); }
      c.lineTo(-30 * sc, 6 * sc); c.closePath(); c.fill();
      c.strokeStyle = '#4e321a'; c.lineWidth = 1.6; c.stroke();
      c.strokeStyle = 'rgba(80,52,24,.9)'; c.lineWidth = 1.4;
      ends.forEach((e, k) => { c.beginPath(); c.moveTo(-4, 1); c.lineTo(e[0], e[1]); c.lineWidth = k ? 1.3 : 2.6; c.stroke(); });
    };
    wing(0.78, true, 0.55);                                  // 远翼：小一号、暗一点、相位错开
    c.strokeStyle = '#4e321a'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(42, 8); c.lineTo(-84, 13); c.stroke();
    c.lineWidth = 1.8; c.beginPath(); c.moveTo(-10, 10); c.lineTo(-30, 30); c.lineTo(10, 30); c.closePath(); c.stroke();
    // 尾舵
    c.fillStyle = 'rgba(222,196,150,.95)'; c.beginPath(); c.moveTo(-80, 13); c.lineTo(-122, -8 + Math.sin(t * 5) * 4); c.quadraticCurveTo(-114, 12, -120, 34 + Math.sin(t * 5) * 4); c.closePath(); c.fill();
    c.strokeStyle = '#4e321a'; c.lineWidth = 1.5; c.stroke();
    // 驾驶者（红衣）
    c.fillStyle = '#9e2a1e'; c.beginPath(); c.ellipse(6, 15, 30, 6.5, 0.03, 0, 7); c.fill();
    c.fillStyle = '#dcb492'; c.beginPath(); c.arc(38, 12, 5.6, 0, 7); c.fill();
    c.strokeStyle = '#9e2a1e'; c.lineWidth = 3.2; c.beginPath(); c.moveTo(-22, 16); c.lineTo(-40, 19); c.stroke();
    c.fillStyle = 'rgba(255,238,196,.35)'; c.beginPath(); c.ellipse(2, 11, 20, 3, 0, 0, 7); c.fill();
    wing(1.0, false, 0);
    c.restore();
  }

  function birds(c, t) {
    c.save(); c.clip(IN); c.strokeStyle = 'rgba(44,34,26,.8)'; c.lineWidth = 1.7; c.lineCap = 'round';
    const r = R_(9);
    for (let k = 0; k < 12; k++) {
      const x0 = 300 + r() * 480, y0 = 250 + r() * 130, s = 0.9 + r() * 0.9, sp = 26 + r() * 34, ph = r() * 7;
      const x = x0 + t * sp, y = y0 + Math.sin(t * 2.6 + ph) * 5, f = Math.sin(t * 9 + ph) * 4 * s;
      c.beginPath(); c.moveTo(x - 7 * s, y - f); c.quadraticCurveTo(x - 3 * s, y - 2, x, y + 1); c.quadraticCurveTo(x + 3 * s, y - 2, x + 7 * s, y - f); c.stroke();
    }
    c.restore();
  }

  function riverLight(c, t) {
    // 云影掠过河谷
    c.save(); c.clip(IN);
    for (let k = 0; k < 3; k++) {
      const x = 300 + ((t * 58 + k * 200) % 560), y = 470 + k * 60, rr = 100;
      const g = RGd(c, x, y, 5, rr, [[0, 'rgba(24,34,34,.26)'], [1, 'rgba(24,34,34,0)']]);
      c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1, 0.3); c.translate(-x, -y); c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); c.restore();
    }
    // 河面碎光顺流
    c.globalCompositeOperation = 'lighter';
    const RV = [[520, 548], [600, 566], [668, 590], [700, 618], [660, 650], [706, 682], [760, 700]];
    for (let k = 0; k < 22; k++) {
      const u = ((t * 0.16 + k / 22) % 1) * (RV.length - 1), i = Math.floor(u), f = u - i, a = RV[i], b = RV[i + 1];
      const x = lerp(a[0], b[0], f), y = lerp(a[1], b[1], f), tw = Math.max(0, Math.sin(t * 7 + k * 2.3));
      c.fillStyle = `rgba(255,255,242,${0.55 * tw})`; c.beginPath(); c.ellipse(x, y, 2 + i * 0.6, 1.2, 0, 0, 7); c.fill();
    }
    c.restore();
  }

  // 光柱（窗→地面，斜穿长厅到少女桌前）
  const BEAM_POLY = poly([[300, 690], [830, 690], [1790, 1220], [1055, 1220]]);
  const BEAM = () => cache('beam', 1560, 600, (g) => {
    g.translate(-250, -640);
    g.filter = 'blur(58px)';
    g.fillStyle = LG(g, 0, 680, 0, 1220, [[0, 'rgba(255,232,178,.26)'], [0.35, 'rgba(255,226,166,.14)'], [1, 'rgba(255,214,150,.04)']]);
    g.fill(BEAM_POLY);
  });
  function beamAndDust(c, t) {
    c.save(); c.globalCompositeOperation = 'screen';
    c.globalAlpha = 0.72 + 0.26 * Math.sin(t * 1.9 + 0.6); c.drawImage(BEAM(), 250, 640);
    c.globalAlpha = 1;
    const ps = P.particles(96, 23, t, { x0: 320, x1: 1640, y0: 1200, y1: 690, speed: 46, drift: 22, life: 7 });
    for (const p of ps) {
      const tw = 0.5 + 0.5 * Math.sin(t * 5 + p.i * 1.7), a = 0.85 * tw * Math.sin(p.q * Math.PI);
      const g = RGd(c, p.x, p.y, 0, 3.4 * p.s + 1, [[0, `rgba(255,242,206,${a})`], [1, 'rgba(255,242,206,0)']]);
      c.fillStyle = g; c.fillRect(p.x - 6, p.y - 6, 12, 12);
    }
    c.restore();
  }

  // 地球仪（只在角色层之前画，球面转到光里）
  function globeSphere(c, t) {
    const cx = 3385, cy = 662, r0 = 46, rot = t * 0.22;
    c.save();
    const bg = RGd(c, cx - 14, cy - 16, 6, r0 * 1.5, [[0, '#9ec2b8'], [0.55, '#5d8f86'], [1, '#26483f']]);
    c.fillStyle = bg; c.beginPath(); c.arc(cx, cy, r0, 0, 7); c.fill();
    c.beginPath(); c.arc(cx, cy, r0, 0, 7); c.clip();
    const land = [[0.2, '#b7a05e'], [1.9, '#a89052'], [3.4, '#c0ac6c'], [4.6, '#9d8547'], [5.6, '#bda868']];
    for (const [lon, col] of land) {
      const a = lon + rot, s = Math.sin(a), k = Math.cos(a);
      if (k <= 0.05) continue;
      const x = cx + s * r0, w = 20 * k + 8;
      c.fillStyle = col; c.globalAlpha = 0.55 + 0.45 * k;
      c.beginPath(); c.ellipse(x, cy - 12 + Math.sin(lon * 3) * 16, w, 20 * k + 12, 0.2, 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    // 明暗交界＋高光
    c.fillStyle = RGd(c, cx + 18, cy + 14, 8, r0 * 1.3, [[0, 'rgba(10,22,18,.55)'], [1, 'rgba(10,22,18,0)']]);
    c.fillRect(cx - r0, cy - r0, r0 * 2, r0 * 2);
    c.fillStyle = RGd(c, cx - 18, cy - 18, 1, 26, [[0, 'rgba(255,252,238,.55)'], [1, 'rgba(255,252,238,0)']]);
    c.fillRect(cx - r0, cy - r0, r0 * 2, r0 * 2);
    c.restore();
    c.strokeStyle = 'rgba(255,238,190,.28)'; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, r0, r0, 0, 0, 7); c.stroke();
  }

  // ---------- 角色：猫（橘白，朝左坐，尾巴轻摆） ----------
  function catPaint(c, t) {
    const OR = '#c07a38', OR_D = '#8a4a18', OR_L = '#eeb271', WH = '#f2e8d8';
    const tilt = 0.10 * Math.sin(t * 2.9) + 0.04 * Math.sin(t * 7.4);
    const look = Math.sin(t * 0.8) * 1.2;
    const blink = (t % 3.6) > 3.46;
    const br = Math.sin(t * 2.2) * 1.2;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // 身体（坐姿，胸在前，臀在后）
    const body = R.smooth([[1006, 1002], [1048, 996], [1062, 950], [1058, 900], [1042, 866], [1012, 856 + br], [980, 862 + br], [958, 890], [948, 930], [952, 972], [966, 1002]]);
    const bg = RGd(c, 962, 960, 10, 130, [[0, WH], [0.5, '#ece0cd'], [0.82, '#c9b99f'], [1, '#9c8a70']]);
    c.fillStyle = bg; c.fill(body);
    c.save(); c.clip(body);
    const coat = RGd(c, 1032, 886, 8, 120, [[0, OR_L], [0.5, OR], [0.82, OR_D], [1, 'rgba(138,74,24,0)']]);
    c.fillStyle = coat; c.fillRect(940, 840, 140, 170);
    c.strokeStyle = 'rgba(120,58,16,.17)';
    for (let k = 0; k < 9; k++) {
      const y = 872 + k * 15;
      c.lineWidth = 4.4 + (k % 3);
      c.beginPath(); c.moveTo(1002, y + 4); c.quadraticCurveTo(1030, y - 10, 1052, y + 6); c.stroke();
    }
    c.fillStyle = LG(c, 0, 940, 0, 1006, [[0, 'rgba(90,45,12,0)'], [1, 'rgba(70,34,8,.30)']]); c.fillRect(944, 940, 124, 70);
    c.fillStyle = RGd(c, 966, 905, 6, 52, [[0, 'rgba(255,252,244,.55)'], [1, 'rgba(255,252,244,0)']]); c.fillRect(940, 860, 100, 90);
    const r = R_(3);
    for (let k = 0; k < 420; k++) {
      const x = 946 + r() * 116, y = 856 + r() * 146;
      const a = Math.PI * 0.62 + (x - 1000) * 0.006 + (r() - .5) * 0.4, L = 5 + r() * 9;
      c.strokeStyle = r() < 0.55 ? 'rgba(255,226,182,.40)' : 'rgba(104,52,14,.28)';
      c.lineWidth = 1.3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke();
    }
    c.strokeStyle = 'rgba(96,52,16,.22)'; c.lineWidth = 15; c.stroke(body);
    c.restore();
    // 尾巴
    const sw = Math.sin(t * 3.0) * 16, sw2 = Math.sin(t * 3.0 + 0.9) * 12;
    c.strokeStyle = LG(c, 1040, 1000, 1120, 900, [[0, OR], [0.6, '#b06c2e'], [1, OR_D]]);
    c.lineWidth = 23;
    c.beginPath(); c.moveTo(1046, 978); c.bezierCurveTo(1078, 1010, 1106 + sw * .3, 985, 1104 + sw, 946); c.bezierCurveTo(1102 + sw2, 922, 1116 + sw2, 908, 1126 + sw2, 906); c.stroke();
    for (let k = 0; k < 6; k++) {
      const u = 0.2 + k * 0.13;
      const x = lerp(1046, 1108, u) + Math.sin(u * 6) * 4, y = lerp(978, 920, u);
      c.strokeStyle = 'rgba(110,52,14,.38)'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(x - 8, y + 4); c.lineTo(x + 8, y - 2); c.stroke();
    }
    c.fillStyle = WH; c.beginPath(); c.arc(1126 + sw2, 906, 12, 0, 7); c.fill();
    // 前爪
    for (const [x1, y1, rx, ry] of [[962, 992, 19, 11], [988, 995, 18, 10]]) {
      c.fillStyle = RGd(c, x1 - 4, y1 - 4, 2, 22, [[0, '#fdf6ea'], [0.7, '#efe4d0'], [1, '#cabba4']]);
      c.beginPath(); c.ellipse(x1, y1, rx, ry, 0, 0, 7); c.fill();
      c.strokeStyle = 'rgba(120,90,60,.22)'; c.lineWidth = 1.1;
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x1 + k * 7, y1 + 4); c.lineTo(x1 + k * 8, y1 + 10); c.stroke(); }
    }
    // 头（歪头／看窗外）
    const hc = [972, 806];
    c.save(); c.translate(hc[0], hc[1] + 48); c.rotate(tilt); c.translate(-hc[0], -(hc[1] + 48));
    // 耳（三角带绒毛边）
    for (const [bx, by, tx, ty, ex, ey] of [[940, 788, 932, 754, 964, 780], [996, 786, 1004, 750, 1020, 780]]) {
      c.fillStyle = OR_D; c.beginPath(); c.moveTo(bx, by); c.lineTo(tx, ty); c.lineTo(ex, ey); c.closePath(); c.fill();
      c.fillStyle = 'rgba(226,146,134,.8)'; c.beginPath(); c.moveTo(bx + 4, by - 6); c.lineTo(tx + 2, ty + 10); c.lineTo(ex - 5, ey - 3); c.closePath(); c.fill();
    }
    // 颅：两颊宽、颅顶窄的梨形
    const skull = R.smooth([[928, 802], [934, 780], [950, 764], [972, 758], [992, 764], [1006, 782], [1010, 806], [1002, 828], [984, 842], [960, 843], [936, 828]]);
    const hg = RGd(c, hc[0] - 16, hc[1] - 20, 6, 70, [[0, OR_L], [0.5, OR], [1, '#93501c']]);
    c.fillStyle = hg; c.fill(skull);
    c.save(); c.clip(skull);
    // 口鼻：两片软垫，融进毛里（不是白球）
    c.fillStyle = RGd(c, 944, 824, 3, 26, [[0, 'rgba(246,240,228,.78)'], [0.55, 'rgba(240,232,216,.42)'], [1, 'rgba(240,232,216,0)']]);
    c.beginPath(); c.ellipse(946, 823, 20, 15, -.1, 0, 7); c.fill();
    c.fillStyle = RGd(c, 972, 826, 2, 24, [[0, 'rgba(246,240,228,.55)'], [1, 'rgba(246,240,228,0)']]);
    c.beginPath(); c.ellipse(968, 826, 17, 13, .1, 0, 7); c.fill();
    // 头顶虎斑
    c.strokeStyle = 'rgba(120,58,16,.40)';
    for (let k = 0; k < 4; k++) { c.lineWidth = 4.4; c.beginPath(); c.moveTo(956 + k * 12, 768); c.quadraticCurveTo(958 + k * 12, 782, 961 + k * 12, 792); c.stroke(); }
    // 右颊暗面
    c.fillStyle = RGd(c, hc[0] + 34, hc[1] + 18, 4, 46, [[0, 'rgba(90,45,12,.30)'], [1, 'rgba(90,45,12,0)']]); c.fillRect(958, 764, 60, 86);
    c.restore();
    // 眼：杏仁形，只在眼角描一点深
    const eyes = [[948, 802], [986, 800]];
    if (blink) {
      c.strokeStyle = 'rgba(52,30,16,.9)'; c.lineWidth = 2;
      eyes.forEach(e => { c.beginPath(); c.arc(e[0], e[1] + 1.5, 6, Math.PI * 1.14, Math.PI * 1.86); c.stroke(); });
    } else {
      eyes.forEach(e => {
        const ex = e[0], ey = e[1];
        c.fillStyle = 'rgba(120,90,40,.5)';
        c.beginPath(); c.ellipse(ex, ey, 6.2, 4.4, 0, 0, 7); c.fill();
        c.fillStyle = '#8a9c52'; c.beginPath(); c.ellipse(ex, ey, 5.4, 4.0, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(30,38,16,.6)'; c.beginPath(); c.ellipse(ex, ey - 1, 5.2, 3.0, 0, 0, 7); c.fill();
        c.fillStyle = '#100c04'; c.beginPath(); c.ellipse(ex - 1.2 + look, ey - 1.6, 1.9, 4.6, 0, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,246,.8)'; c.beginPath(); c.arc(ex - 2.6 + look, ey - 3.2, 1.3, 0, 7); c.fill();
        c.strokeStyle = 'rgba(58,34,16,.8)'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(ex, ey + .5, 5.8, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
      });
    }
    // 鼻、嘴
    c.fillStyle = '#b06a60'; c.beginPath(); c.moveTo(950, 812); c.lineTo(960, 812); c.lineTo(955, 819); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(70,44,26,.55)'; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(955, 819); c.quadraticCurveTo(953, 824, 951, 825); c.moveTo(955, 819); c.quadraticCurveTo(957, 824, 959, 825); c.stroke();
    // 胡须：细、短、淡
    c.strokeStyle = 'rgba(248,244,232,.38)'; c.lineWidth = .9;
    for (const [a, b] of [[[938, 820], [912, 814]], [[938, 824], [910, 826]], [[966, 820], [990, 815]]]) { c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); }
    // 轮廓绒毛：打散剪影的硬边
    const rf = R_(9);
    for (let k = 0; k < 70; k++) {
      const a = Math.PI * 3.05 + rf() * Math.PI * 1.1, R0 = 36 + rf() * 10;
      const x = hc[0] + Math.cos(a) * R0, y = hc[1] + Math.sin(a) * R0 * 0.95;
      c.strokeStyle = 'rgba(198,132,66,.45)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * (3 + rf() * 5), y + Math.sin(a) * (3 + rf() * 5)); c.stroke();
    }
    c.restore();
    c.restore();
  }
  // ---------- 角色：少女（红天鹅绒＋孔雀绿袖＋银杯） ----------
  function goblet(c, cup) {
    const hw = cup.w * 0.5, h = cup.h;
    c.save(); c.translate(cup.x, cup.y); c.rotate(cup.tilt || 0);
    c.fillStyle = LG(c, -hw, 0, hw, 0, [[0, '#6b6b70'], [0.28, '#f6f6f1'], [0.52, '#bfbfc2'], [0.8, '#7c7c82'], [1, '#43434a']]);
    c.beginPath(); c.moveTo(-hw, 0); c.bezierCurveTo(-hw, h * .62, -hw * .42, h, 0, h); c.bezierCurveTo(hw * .42, h, hw, h * .62, hw, 0); c.closePath(); c.fill();
    c.fillRect(-hw * .12, h - 2, hw * .24, h * .6);
    c.beginPath(); c.ellipse(0, h + h * .62, hw * .38, h * .1, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(0, h - 2, hw, h * .24, 0, 0, 7); c.fill();
    c.fillStyle = LG(c, -hw, 0, hw, 0, [[0, '#3b0510'], [0.4, '#6e0f1c'], [0.75, '#8e1a26'], [1, '#2c040c']]);
    c.beginPath(); c.ellipse(0, h * .04, hw * .94, h * .2, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,225,190,.5)'; c.beginPath(); c.ellipse(-hw * .3, h * .02, hw * .2, h * .05, -.2, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,252,.85)'; c.fillRect(-hw * .62, h * .16, hw * .1, h * .5);
    c.fillStyle = 'rgba(255,255,252,.4)'; c.fillRect(hw * .45, h * .2, hw * .06, h * .38);
    c.restore();
  }

  function girlPaint(c, t, cup, sip, closed) {
    const G = R.girl({ dx: 449, dy: 90, s: 0.966, cup, sip, breathe: Math.sin(t * 2.1) * 0.014, hair: 'long' });
    const T = (x, y) => G.T(x, y), A = G.A;
    const SK = '#eec6a3', SK_D = '#a97a58', HAIR = '#b8914f', HAIR_L = '#e8cd8c', HAIR_D = '#563a14';
    const RED = '#7e1418', RED_L = '#a8312a', RED_D = '#360606', EM = '#173d30', EM_L = '#3d7a5c', EM_D = '#0c2a20', GOLD = '#cfa254';
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // 长发（背后，垂到腰）
    const sw = Math.sin(t * 2.4) * 9, nape = A.nape;
    const hair = R.smooth([[nape[0] - 42, nape[1] - 126], [nape[0] + 42, nape[1] - 116], [nape[0] + 70, nape[1] - 40], [nape[0] + 76, nape[1] + 34], [nape[0] + 94 + sw, nape[1] + 86], [nape[0] + 84 + sw, nape[1] + 136], [nape[0] + 100 + sw, nape[1] + 188], [nape[0] + 84 + sw, nape[1] + 236], [nape[0] + 56 + sw, nape[1] + 244], [nape[0] + 34, nape[1] + 176], [nape[0] + 18, nape[1] + 92], [nape[0] - 12, nape[1] + 32], [nape[0] - 42, nape[1] - 24]]);
    c.fillStyle = LG(c, nape[0], nape[1] - 100, nape[0] + 92, nape[1] + 240, [[0, HAIR_L], [0.42, HAIR], [1, HAIR_D]]);
    c.fill(hair);
    c.save(); c.clip(hair);
    for (let k = 0; k < 11; k++) {
      c.strokeStyle = k % 2 ? 'rgba(255,226,150,.55)' : 'rgba(76,48,12,.6)'; c.lineWidth = k % 2 ? 2.4 : 3;
      c.beginPath();
      for (let s2 = 0; s2 <= 26; s2++) { const q = s2 / 26, x = nape[0] - 18 + k * 10 + q * 54 + Math.sin(q * 10 + k) * 7, y = nape[1] - 110 + q * 345; s2 ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    c.restore();
    // 远侧袖＋金袖口＋手
    c.fillStyle = LG(c, T(1212, 0)[0], 0, T(1370, 0)[0], 0, [[0, EM_L], [0.5, EM], [1, EM_D]]); c.fill(G.farSleeve);
    c.save(); c.clip(G.farSleeve); c.strokeStyle = 'rgba(228,238,214,.16)'; c.lineWidth = 9; c.beginPath(); c.moveTo(...T(1336, 480)); c.quadraticCurveTo(...T(1310, 540), ...T(1250, 600)); c.stroke(); c.restore();
    c.fillStyle = GOLD; c.fill(G.farCuff);
    c.fillStyle = SK; c.fill(G.farHand);
    c.fillStyle = 'rgba(190,120,90,.25)'; c.beginPath(); c.ellipse(T(1180, 620)[0], T(1180, 620)[1], 12, 5, 0.1, 0, 7); c.fill();
    // 红天鹅绒长裙
    const sg = LG(c, T(1100, 600)[0], 600, T(1450, 950)[0], 950, [[0, RED_L], [0.42, RED], [1, RED_D]]);
    c.fillStyle = sg; c.fill(G.skirt);
    c.save(); c.clip(G.skirt);
    const folds = [[1150, 700, 1120, 928, 24], [1200, 680, 1180, 932, 28], [1250, 662, 1250, 936, 22], [1300, 660, 1312, 932, 20], [1362, 700, 1382, 922, 17]];
    folds.forEach(([x0, y0, x1, y1, w]) => {
      c.strokeStyle = 'rgba(206,84,66,.32)'; c.lineWidth = w; c.beginPath(); c.moveTo(...T(x0 - 8, y0 + 60)); c.quadraticCurveTo(...T((x0 + x1) / 2 - 12, (y0 + y1) / 2), ...T(x1, y1)); c.stroke();
      c.strokeStyle = 'rgba(36,0,0,.46)'; c.lineWidth = w * .68; c.beginPath(); c.moveTo(...T(x0 + 26, y0 + 8)); c.quadraticCurveTo(...T((x0 + x1) / 2 + 20, (y0 + y1) / 2), ...T(x1 + 26, y1)); c.stroke();
    });
    c.strokeStyle = GOLD; c.lineWidth = 5; c.beginPath(); c.moveTo(...T(1100, 920)); c.quadraticCurveTo(...T(1230, 940), ...T(1360, 920)); c.stroke();
    c.strokeStyle = 'rgba(230,190,110,.55)'; c.lineWidth = 1.8;
    for (let k = 0; k < 9; k++) { const p = T(1122 + k * 26, 900 - k * 1.2); c.beginPath(); c.arc(p[0], p[1], 5, 0, 7); c.stroke(); }
    c.fillStyle = 'rgba(20,0,0,.3)'; c.fillRect(T(1100, 930)[0], 936, 290, 40);
    c.restore();
    c.fillStyle = '#2a1608'; c.fill(G.shoe);
    // 胸衣
    const tg = LG(c, T(1285, 430)[0], 430, T(1420, 620)[0], 620, [[0, RED_L], [0.55, RED], [1, RED_D]]);
    c.fillStyle = tg; c.fill(G.torso);
    // 胸前的细麻衬衣（米白，锁边细绣）——不是围巾
    c.fillStyle = LG(c, T(1290, 440)[0], 440, T(1350, 520)[0], 520, [[0, '#f6eddc'], [1, '#d8c8ab']]); c.fill(G.bib);
    c.save(); c.clip(G.bib);
    c.strokeStyle = 'rgba(150,126,92,.35)'; c.lineWidth = 1;
    for (let k = 0; k < 9; k++) { const p = T(1296 + k * 7, 452); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + 2, p[1] + 58); c.stroke(); }
    c.strokeStyle = 'rgba(206,168,104,.55)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(...T(1288, 466)); c.quadraticCurveTo(...T(1314, 490), ...T(1346, 468)); c.stroke();
    c.restore();
    c.save(); c.clip(G.torso);
    c.strokeStyle = 'rgba(230,110,84,.38)'; c.lineWidth = 18; c.beginPath(); c.moveTo(...T(1300, 470)); c.lineTo(...T(1300, 604)); c.stroke();
    c.strokeStyle = 'rgba(30,0,0,.35)'; c.lineWidth = 10; c.beginPath(); c.moveTo(...T(1336, 470)); c.lineTo(...T(1340, 600)); c.stroke();
    c.restore();
    c.strokeStyle = GOLD; c.lineWidth = 5;
    c.beginPath(); c.moveTo(...T(1290, 448)); c.lineTo(...T(1300, 500)); c.lineTo(...T(1338, 500)); c.lineTo(...T(1360, 448)); c.stroke();
    c.fillStyle = '#f6efdd';
    for (let k = 0; k < 7; k++) { const p = T(1300 + k * 6, 446); c.beginPath(); c.arc(p[0], p[1], 4.4, 0, 7); c.fill(); }
    c.fillStyle = '#8c1414'; c.beginPath(); c.arc(T(1320, 470)[0], T(1320, 470)[1], 4, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,246,.7)'; c.beginPath(); c.arc(T(1319, 468)[0], T(1319, 468)[1], 1.6, 0, 7); c.fill();
    // 颈
    c.fillStyle = LG(c, T(1286, 0)[0], 0, T(1324, 0)[0], 0, [[0, '#f7d5b2'], [1, SK_D]]);
    c.fill(G.neck);
    c.fillStyle = 'rgba(150,90,60,.22)'; c.beginPath(); c.ellipse(T(1310, 440)[0], T(1310, 440)[1], 16, 6, 0, 0, 7); c.fill();
    // 珍珠项圈
    for (let k = 0; k <= 15; k++) {
      const q = k / 15, x = lerp(1288, 1336, q), y = 448 + Math.sin(q * Math.PI) * 16, p = T(x, y), rr = 3.4 + Math.sin(q * Math.PI) * 1.2;
      c.fillStyle = '#f7f0df'; c.beginPath(); c.arc(p[0], p[1], rr, 0, 7); c.fill();
      c.fillStyle = 'rgba(150,130,105,.55)'; c.beginPath(); c.arc(p[0] + rr * .3, p[1] + rr * .35, rr * .42, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,250,.9)'; c.beginPath(); c.arc(p[0] - rr * .35, p[1] - rr * .4, rr * .3, 0, 7); c.fill();
    }
    // 头发（头顶）＋脸
    c.fillStyle = HAIR; c.fill(G.hairBack);
    const fg = LG(c, A.forehead[0] - 12, 0, A.ear[0] + 12, 0, [[0, '#f8d8b8'], [0.55, SK], [1, SK_D]]);
    c.fillStyle = fg; c.fill(G.face);
    c.save(); c.clip(G.face);
    c.fillStyle = 'rgba(206,120,98,.13)'; c.beginPath(); c.arc(G.cheek[0] - 4, G.cheek[1] + 2, 13, 0, 7); c.fill();
    c.fillStyle = 'rgba(120,70,40,.16)'; c.beginPath(); c.ellipse(G.eye.x + 9, G.eye.y + 2, 13, 8, 0, 0, 7); c.fill();
    c.fillStyle = RGd(c, G.eye.x - 12, G.eye.y - 6, 2, 40, [[0, 'rgba(255,242,220,.42)'], [1, 'rgba(255,242,220,0)']]); c.fillRect(G.eye.x - 40, G.eye.y - 40, 80, 60);
    // 侧脸塑形：鼻梁、颊、颌（顺着轮廓的柔影，不是线）
    c.fillStyle = LG(c, G.eye.x - 30, 0, G.eye.x + 6, 0, [[0, 'rgba(150,102,76,.26)'], [1, 'rgba(150,102,76,0)']]);
    c.fillRect(G.eye.x - 34, G.eye.y - 8, 42, 46);
    c.fillStyle = 'rgba(255,236,212,.34)'; c.beginPath(); c.ellipse(G.eye.x - 20, G.eye.y + 16, 5, 9, .15, 0, 7); c.fill();
    c.fillStyle = 'rgba(96,62,44,.20)'; c.beginPath(); c.ellipse(G.lips[0][0] - 6, G.lips[0][1] - 6, 5, 8, .2, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,238,214,.30)'; c.beginPath(); c.ellipse(G.lips[1][0] - 2, G.lips[1][1] + 12, 6, 4, .2, 0, 7); c.fill();
    c.restore();
    c.fillStyle = SK_D; c.beginPath(); c.ellipse(G.ear[0], G.ear[1], 7, 11, 0.2, 0, 7); c.fill();
    c.fillStyle = 'rgba(230,160,140,.55)'; c.beginPath(); c.ellipse(G.ear[0] + 1, G.ear[1], 3, 6, 0.2, 0, 7); c.fill();
    // 刘海＋发丝
    c.fillStyle = HAIR; c.fill(G.bangs);
    c.save(); c.clip(G.bangs);
    c.strokeStyle = 'rgba(252,228,164,.6)'; c.lineWidth = 2.2; G.hairLines.forEach(h => c.stroke(h));
    c.restore();
    c.strokeStyle = HAIR_D; c.lineWidth = 1.8; G.hairLines.forEach(h => c.stroke(h));
    G.locks.forEach(h => { c.strokeStyle = HAIR_D; c.lineWidth = 7.5; c.stroke(h); c.strokeStyle = HAIR; c.lineWidth = 4.5; c.stroke(h); });
    // 发丝：只落在发团内部（顺着头形，打散"头盔"感）
    const hr = R_(77);
    c.lineCap = 'round';
    c.save(); c.clip(G.hairBack);
    for (let k = 0; k < 60; k++) {
      const u = hr(), v = hr();
      const x0 = A.ear[0] - 16 + u * 88, y0 = A.forehead[1] + 6 + v * 190;
      const len = 18 + hr() * 54, bend = (hr() - .5) * 16;
      c.strokeStyle = hr() < .5 ? `rgba(238,214,158,${0.16 + hr() * 0.26})` : `rgba(86,58,20,${0.14 + hr() * 0.24})`;
      c.lineWidth = 1 + hr() * 2;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 6 + bend, y0 + len * .55, x0 - 4 + bend, y0 + len); c.stroke();
    }
    c.restore();
    // 头顶的高光带（柔，限制在刘海内）
    c.save(); c.clip(G.bangs);
    c.fillStyle = 'rgba(246,226,176,.20)';
    c.beginPath(); c.ellipse(A.forehead[0] - 8, A.forehead[1] - 30, 36, 14, -0.18, 0, 7); c.fill();
    c.restore();
    // 珍珠额链
    const f0 = A.forehead, e0 = A.ear;
    for (let k = 0; k <= 12; k++) {
      const q = k / 12, x = lerp(f0[0] + 6, e0[0] + 4, q), y = lerp(f0[1] + 4, e0[1] - 28, q) - Math.sin(q * Math.PI) * 10;
      c.fillStyle = '#f6eeda'; c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill();
      c.fillStyle = 'rgba(120,100,80,.55)'; c.beginPath(); c.arc(x + .8, y + .8, 1, 0, 7); c.fill();
    }
    // 五官
    c.strokeStyle = '#4a2a18'; c.lineWidth = 2.1;
    if (closed) {
      c.beginPath(); c.arc(G.eye.x + 1, G.eye.y - 2, 7, 0.35, Math.PI - 0.5); c.stroke();
      c.lineWidth = 1.3; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(G.eye.x - 4 + k * 4, G.eye.y + 3); c.lineTo(G.eye.x - 6 + k * 4, G.eye.y + 7); c.stroke(); }
    } else {
      c.fillStyle = '#f2ebdd'; c.beginPath(); c.ellipse(G.eye.x, G.eye.y, 7.4, 4.2, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(120,74,40,.18)'; c.beginPath(); c.ellipse(G.eye.x, G.eye.y - 2.6, 7.4, 2.6, 0, 0, 7); c.fill();
      c.fillStyle = '#6b4e2c'; c.beginPath(); c.arc(G.eye.x - 2.2, G.eye.y + .4, 3.4, 0, 7); c.fill();
      c.fillStyle = 'rgba(40,26,16,.55)'; c.beginPath(); c.arc(G.eye.x - 2.2, G.eye.y + .4, 1.9, 0, 7); c.fill();
      c.fillStyle = '#1a120a'; c.beginPath(); c.arc(G.eye.x - 2.2, G.eye.y + .4, 1.1, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,250,.75)'; c.beginPath(); c.arc(G.eye.x - 3.4, G.eye.y - 1.2, .9, 0, 7); c.fill();
      c.strokeStyle = 'rgba(84,54,32,.75)'; c.lineWidth = 1.4; c.stroke(G.lid);
    }
    c.strokeStyle = 'rgba(132,98,56,.42)'; c.lineWidth = 1.4; c.stroke(G.brow);
    // 唇：偏赭，不用亮红；上唇暗、下唇亮
    c.fillStyle = '#9a5648'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(...G.lips[1]); c.lineTo(...G.lips[2]); c.closePath(); c.fill();
    c.fillStyle = 'rgba(96,40,34,.45)'; c.beginPath(); c.moveTo(...G.lips[0]); c.lineTo(G.lips[1][0] - 1, G.lips[1][1]); c.lineTo(G.lips[2][0] + 1, G.lips[2][1]); c.closePath(); c.fill();
    c.fillStyle = 'rgba(246,190,168,.35)'; c.beginPath(); c.ellipse(G.lips[1][0] + .5, G.lips[1][1] + 1.6, 2.6, 1.1, 0, 0, 7); c.fill();
    // 近侧手臂：孔雀绿天鹅绒袖＋肩珠＋金袖口
    for (const [p, a, b] of [[G.upperArm, A.shoulder, A.elbow], [G.foreArm, A.elbow, A.hand]]) {
      c.fillStyle = LG(c, a[0] - 34, a[1] - 34, a[0] + 34, a[1] + 34, [[0, EM_L], [0.55, EM], [1, EM_D]]); c.fill(p);
      c.save(); c.clip(p);
      const s0 = [lerp(a[0], b[0], 0.08) - 5, lerp(a[1], b[1], 0.08) - 6], s1 = [lerp(a[0], b[0], 0.88) - 5, lerp(a[1], b[1], 0.88) - 6];
      c.strokeStyle = 'rgba(176,206,166,.17)'; c.lineWidth = 7; c.beginPath(); c.moveTo(...s0); c.quadraticCurveTo(lerp(s0[0], s1[0], .5) + 3, lerp(s0[1], s1[1], .5), ...s1); c.stroke();
      c.strokeStyle = 'rgba(232,244,220,.10)'; c.lineWidth = 3; c.beginPath(); c.moveTo(s0[0] - 3, s0[1] - 4); c.quadraticCurveTo(lerp(s0[0], s1[0], .5), lerp(s0[1], s1[1], .5) - 5, s1[0] - 3, s1[1] - 4); c.stroke();
      c.strokeStyle = 'rgba(8,32,24,.35)'; c.lineWidth = 8; c.beginPath(); c.moveTo(s0[0] + 16, s0[1] + 12); c.lineTo(s1[0] + 16, s1[1] + 12); c.stroke();
      c.restore();
    }
    for (let k = 0; k < 4; k++) {
      const q = k / 3, x = lerp(A.shoulder[0] - 24, A.shoulder[0] + 26, q), y = lerp(A.shoulder[1] - 8, A.shoulder[1] + 12, q);
      c.fillStyle = '#f6eeda'; c.beginPath(); c.arc(x, y, 3.4, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,248,.9)'; c.beginPath(); c.arc(x - 1, y - 1.2, 1.1, 0, 7); c.fill();
    }
    c.fillStyle = GOLD; c.fill(G.cuff);
    c.fillStyle = SK; c.fill(G.hand);
    goblet(c, G.cup);
    // 手指绕杯胫（拇指对侧）
    const st0 = G.cup.y + G.cup.h * 0.92;
    for (let k = 0; k < 3; k++) {
      const yy = st0 + k * 4.6;
      c.fillStyle = k === 2 ? '#dca77f' : SK;
      c.beginPath(); c.ellipse(G.cup.x + G.cup.w * 0.16, yy, 7.4, 2.9, 0.12, 0, 7); c.fill();
      c.strokeStyle = 'rgba(148,92,60,.30)'; c.lineWidth = 1;
      c.beginPath(); c.ellipse(G.cup.x + G.cup.w * 0.16, yy + 1.5, 7.0, 2.2, 0.12, 0, 7); c.stroke();
    }
    c.fillStyle = SK; c.beginPath(); c.arc(G.thumb[0], G.thumb[1], 6.5, 0, 7); c.fill();
    c.fillStyle = 'rgba(190,120,86,.35)'; c.beginPath(); c.ellipse(G.hand.x + 4, G.hand.y - 2, 6, 3.4, 0.4, 0, 7); c.fill();
    c.restore();
  }

  // ---------- 角色：学者（长须、红帽、鹄褐长袍，用两脚规校比例） ----------
    function scholarPaint(c, t) {
    const HX = 3142;
    const SK = '#e0b287', SK_L = '#f4d5b0', SK_D = '#9e6f4a', SK_S = '#66402a';
    const GOWN_L = '#7d6540', GOWN = '#4c3a24', GOWN_D = '#281d10', GOWN_X = '#150e06';
    const LINEN = '#ded4bc', LINEN_D = '#a99b80';
    const HAIRW = '#efeade', HAIRW_D = '#a89e88';
    const nod = Math.sin(t * 1.1) * 1.4;
    const r0s = R_(63);
    c.save();
    c.beginPath(); c.rect(2960, 360, 530, 490); c.clip();
    const oy = nod * 0.8;

    // —— 高背椅（在他身后，给出"坐着"的空间关系）——
    const woodG = (x0, y0, x1, y1, a, b) => LG(c, x0, y0, x1, y1, [[0, a || '#6b4526'], [0.55, '#472a13'], [1, '#22110a']]);
    c.fillStyle = woodG(2990, 470, 3300, 470); c.fillRect(2986, 424, 316, 20);            // 顶横档
    c.fillStyle = 'rgba(255,214,158,.16)'; c.fillRect(2990, 426, 308, 4);
    c.fillStyle = woodG(3000, 440, 3010, 440); c.fillRect(2994, 440, 20, 300);            // 左立柱
    c.fillStyle = woodG(3280, 440, 3290, 440); c.fillRect(3276, 440, 20, 300);            // 右立柱
    c.fillStyle = woodG(3000, 560, 3290, 560); c.fillRect(3010, 556, 272, 14);            // 中横档
    c.fillStyle = 'rgba(12,6,2,.55)'; c.fillRect(3014, 570, 266, 8);
    // 椅背软垫（暗红丝绒，被身体挡住大半）
    c.fillStyle = LG(c, 3010, 0, 3290, 0, [[0, '#5e1a1c'], [0.5, '#431012'], [1, '#280809']]); c.fillRect(3014, 444, 266, 116);
    c.save(); c.globalAlpha = .5;
    for (let k = 0; k < 26; k++) { const y = 450 + k * 4.3; c.strokeStyle = k % 2 ? 'rgba(255,140,120,.10)' : 'rgba(0,0,0,.16)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(3016, y); c.lineTo(3278, y); c.stroke(); }
    c.restore();

    // —— 长袍：坐姿上半身，肩线低、胸廓厚 ——
    const robe = R.smooth([
      [HX - 158, 706], [HX - 154, 664], [HX - 140, 630 + oy], [HX - 106, 606 + oy],
      [HX - 52, 592 + oy], [HX + 16, 588 + oy], [HX + 78, 596 + oy], [HX + 124, 616 + oy],
      [HX + 148, 648], [HX + 152, 706]
    ]);
    c.fillStyle = LG(c, HX - 168, 596, HX + 160, 706, [[0, GOWN_L], [0.22, GOWN], [0.62, GOWN_D], [1, GOWN_X]]);
    c.fill(robe);
    c.save(); c.clip(robe);
    // 胸前的体积与褶（垂坠感）
    c.fillStyle = RGd(c, HX - 96, 640, 10, 100, [[0, 'rgba(190,152,96,.34)'], [1, 'rgba(190,152,96,0)']]); c.fillRect(HX - 170, 586, 300, 128);
    for (const [x, w, al] of [[HX - 116, 16, .34], [HX - 74, 22, .26], [HX - 26, 14, .3], [HX + 26, 20, .2], [HX + 74, 16, .26], [HX + 112, 12, .2]]) {
      c.strokeStyle = `rgba(14,8,3,${al})`; c.lineWidth = w * .62;
      c.beginPath(); c.moveTo(x, 606 + oy); c.quadraticCurveTo(x + 6, 660, x - 8, 710); c.stroke();
      c.strokeStyle = 'rgba(214,178,120,.13)'; c.lineWidth = w * .26;
      c.beginPath(); c.moveTo(x + 10, 608 + oy); c.quadraticCurveTo(x + 15, 662, x + 3, 710); c.stroke();
    }
    // 右肩暗部
    c.fillStyle = LG(c, HX + 56, 0, HX + 160, 0, [[0, 'rgba(16,8,3,0)'], [1, 'rgba(16,8,3,.62)']]); c.fillRect(HX + 56, 584, 110, 128);
    c.restore();

    // —— 落在桌面上的接触阴影 ——
    c.save(); c.filter = 'blur(11px)';
    c.fillStyle = 'rgba(14,7,3,.44)'; c.beginPath(); c.ellipse(HX + 2, 712, 176, 18, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(14,7,3,.26)'; c.beginPath(); c.ellipse(HX + 2, 742, 208, 24, 0, 0, 7); c.fill();
    c.restore();

    // —— 领：深褐毛边＋内衬白麻（不是白花边领）——
    c.fillStyle = LG(c, HX - 96, 596, HX + 96, 626, [[0, '#6a5136'], [0.45, '#4a3621'], [1, '#2a1a0c']]);
    c.beginPath(); c.ellipse(HX, 612 + oy, 96, 20, 0, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = LINEN; c.beginPath(); c.ellipse(HX - 4, 604 + oy, 54, 13, 0, Math.PI * 1.04, Math.PI * 1.96); c.fill();
    c.fillStyle = 'rgba(120,104,80,.35)'; c.beginPath(); c.ellipse(HX - 4, 606 + oy, 54, 9, 0, Math.PI * 1.1, Math.PI * 1.9); c.fill();
    // 毛边的碎绒
    for (let k = 0; k < 54; k++) {
      const u = k / 53, x = HX - 94 + u * 188, y = 614 + oy + Math.sin(u * 3.1) * 5;
      c.strokeStyle = k % 3 ? 'rgba(96,74,48,.5)' : 'rgba(150,124,86,.45)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + (u - .5) * 6, y + 5 + (k % 5)); c.stroke();
    }

    // —— 颈 ——
    c.fillStyle = LG(c, HX - 24, 560, HX + 26, 606, [[0, SK_D], [0.5, '#b78157'], [1, '#8b5b39']]);
    c.fill(R.smooth([[HX - 22, 556 + oy], [HX + 24, 552 + oy], [HX + 30, 598], [HX - 26, 600]]));
    c.fillStyle = 'rgba(70,40,22,.34)'; c.beginPath(); c.ellipse(HX - 2, 566 + oy, 26, 8, 0, 0, 7); c.fill();

    // —— 头（四分之三侧脸）——
    const fx = HX, fy = 508 + oy;
    // 后脑白发：收成贴颈的几缕，不做白球
    const hairMass = R.smooth([[fx - 4, 466 + oy], [fx + 28, 458 + oy], [fx + 48, 480 + oy], [fx + 50, 516 + oy], [fx + 42, 548 + oy], [fx + 26, 566 + oy], [fx + 8, 566 + oy], [fx + 18, 520 + oy], [fx + 14, 486 + oy], [fx - 2, 470 + oy]]);
    c.fillStyle = LG(c, fx + 6, 452 + oy, fx + 62, 574, [[0, '#d3ccb8'], [0.5, '#b2a992'], [1, '#7e7461']]);
    c.fill(hairMass);
    c.save(); c.clip(hairMass);
    for (let k = 0; k < 26; k++) {
      const x = fx + 4 + r0s() * 54, y = 462 + oy + r0s() * 100;
      c.strokeStyle = r0s() < .55 ? 'rgba(255,254,246,.85)' : 'rgba(140,130,112,.55)';
      c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 9, y + 22, x + 4, y + 44); c.stroke();
    }
    c.restore();
    // 脸
    const face = R.smooth([
      [fx - 12, 458 + oy], [fx - 32, 468 + oy], [fx - 40, 484 + oy], [fx - 44, 498 + oy],
      [fx - 56, 508 + oy], [fx - 48, 516 + oy], [fx - 46, 526 + oy], [fx - 41, 538 + oy],
      [fx - 33, 550 + oy], [fx - 8, 558 + oy], [fx + 20, 550 + oy], [fx + 32, 532 + oy],
      [fx + 33, 504 + oy], [fx + 24, 478 + oy], [fx + 8, 462 + oy]
    ]);
    c.fillStyle = LG(c, fx - 58, 0, fx + 34, 0, [[0, SK_L], [0.44, SK], [1, SK_D]]);
    c.fill(face);
    c.save(); c.clip(face);
    // 面部结构：太阳穴凹、颧骨、法令、下颌
    c.fillStyle = 'rgba(120,74,44,.24)'; c.beginPath(); c.ellipse(fx - 6, fy - 16, 16, 20, .3, 0, 7); c.fill();
    c.fillStyle = 'rgba(206,126,88,.16)'; c.beginPath(); c.ellipse(fx - 28, fy + 14, 16, 11, .2, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,228,200,.30)'; c.beginPath(); c.ellipse(fx - 38, fy - 4, 9, 14, .2, 0, 7); c.fill();
    c.fillStyle = 'rgba(150,90,58,.20)'; c.beginPath(); c.ellipse(fx - 4, fy + 8, 22, 26, .1, 0, 7); c.fill();
    // 眼窝
    c.fillStyle = 'rgba(110,64,38,.26)'; c.beginPath(); c.ellipse(fx - 35, fy - 9, 12, 7, -.12, 0, 7); c.fill();
    c.restore();
    // 眉
    c.strokeStyle = 'rgba(238,232,216,.9)'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(fx - 45, fy - 17); c.quadraticCurveTo(fx - 33, fy - 25, fx - 19, fy - 19); c.stroke();
    c.strokeStyle = 'rgba(148,140,122,.45)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(fx - 43, fy - 13); c.quadraticCurveTo(fx - 33, fy - 19, fx - 22, fy - 15); c.stroke();
    // 眼
    c.fillStyle = '#efe5d2'; c.beginPath(); c.ellipse(fx - 35, fy - 5, 6.8, 3.9, -.1, 0, 7); c.fill();
    c.fillStyle = '#3a2817'; c.beginPath(); c.arc(fx - 36, fy - 5, 2.9, 0, 7); c.fill();
    c.strokeStyle = 'rgba(70,44,26,.8)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx - 41, fy - 8); c.quadraticCurveTo(fx - 35, fy - 12, fx - 28, fy - 7); c.stroke();
    // 鼻
    c.fillStyle = 'rgba(208,144,108,.26)'; c.beginPath(); c.ellipse(fx - 49, fy + 3, 6, 11, .1, 0, 7); c.fill();
    c.strokeStyle = 'rgba(138,84,56,.5)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(fx - 47, fy + 5); c.quadraticCurveTo(fx - 53, fy + 9, fx - 51, fy + 11); c.stroke();
    // 口
    c.strokeStyle = 'rgba(142,80,62,.45)'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(fx - 44, fy + 24); c.quadraticCurveTo(fx - 36, fy + 26, fx - 28, fy + 23); c.stroke();
    // 耳
    c.fillStyle = SK_D; c.beginPath(); c.ellipse(fx + 30, fy + 4, 6.5, 13, 0.12, 0, 7); c.fill();
    c.fillStyle = 'rgba(206,132,100,.42)'; c.beginPath(); c.ellipse(fx + 30, fy + 5, 2.8, 7, 0.12, 0, 7); c.fill();

    // —— 红丝绒小帽：圆顶＋卷边，压得更低一点 ——
    const cap = R.smooth([[fx - 26, 470 + oy], [fx - 20, 448 + oy], [fx + 2, 438 + oy], [fx + 30, 442 + oy], [fx + 44, 458 + oy], [fx + 42, 478 + oy], [fx + 8, 483 + oy], [fx - 18, 481 + oy]]);
    c.fillStyle = LG(c, fx - 24, 444, fx + 44, 482, [[0, '#a83127'], [0.42, '#821f18'], [1, '#460d09']]);
    c.fill(cap);
    c.save(); c.clip(cap);
    for (let k = 0; k < 6; k++) { const x = fx - 20 + k * 10; c.strokeStyle = 'rgba(255,178,142,.22)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, 442); c.quadraticCurveTo(x + 3, 460, x + 1, 483); c.stroke(); }
    c.restore();
    c.fillStyle = LG(c, fx - 26, 470, fx + 44, 490, [[0, '#7a1c14'], [0.6, '#580f0b'], [1, '#300605']]);
    c.fill(R.smooth([[fx - 28, 474 + oy], [fx + 42, 478 + oy], [fx + 44, 490 + oy], [fx - 26, 486 + oy]]));
    c.strokeStyle = 'rgba(255,190,150,.26)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx - 26, 476 + oy); c.quadraticCurveTo(fx + 6, 482 + oy, fx + 42, 479 + oy); c.stroke();
    // 帽下鬓发
    c.strokeStyle = 'rgba(244,238,222,.8)'; c.lineWidth = 1.9;
    for (let k = 0; k < 9; k++) { const x = fx + 10 + r0s() * 28, y = 486 + oy + r0s() * 5; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 7, y + 13, x + 3, y + 24); c.stroke(); }

    // —— 白须：窄、长、成缕 ——
    const bx = fx - 42, by = fy + 24;
    const beard = R.smooth([[bx - 1, by - 4], [bx + 14, by + 2], [bx + 16, by + 24], [bx + 7, by + 58], [bx - 3, by + 92], [bx - 16, by + 118], [bx - 29, by + 130], [bx - 24, by + 96], [bx - 22, by + 60], [bx - 27, by + 30], [bx - 37, by + 9]]);
    c.fillStyle = LG(c, bx - 34, by, bx + 16, by + 132, [[0, '#ded7c4'], [0.38, '#c6bdA6'], [0.72, '#a89d86'], [1, '#847a66']]);
    c.fill(beard);
    c.save(); c.clip(beard);
    for (let k = 0; k < 74; k++) {
      const u = r0s(), x = bx - 34 + r0s() * 46, y = by + 3 + u * 124;
      c.strokeStyle = r0s() < .55 ? 'rgba(255,253,244,.84)' : 'rgba(124,114,94,.56)';
      c.lineWidth = 1.3 + r0s() * 1.5;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 5, y + 18, x - 2 + r0s() * 7, y + 36); c.stroke();
    }
    c.restore();
    // 须尖破形
    for (let k = 0; k < 10; k++) {
      const x0 = bx - 22 + r0s() * 26, y0 = by + 92 + r0s() * 32;
      const tx = x0 + (r0s() - .5) * 22, ty = y0 + 16 + r0s() * 26;
      c.fillStyle = r0s() < .6 ? 'rgba(243,239,226,.6)' : 'rgba(172,162,140,.48)';
      c.beginPath(); c.moveTo(x0 - 2, y0); c.lineTo(x0 + 2, y0); c.lineTo(tx, ty); c.closePath(); c.fill();
    }
    // 上唇髭
    c.strokeStyle = 'rgba(248,244,234,.88)'; c.lineWidth = 4.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx + 2, by - 6); c.quadraticCurveTo(bx - 12, by - 2, bx - 24, by + 5); c.stroke();
    c.beginPath(); c.moveTo(bx + 8, by - 4); c.quadraticCurveTo(bx - 2, by + 4, bx - 12, by + 9); c.stroke();

    // —— 双臂：宽袖垂到桌面，袖口白麻 ——
    const sleeve = (pts, w0, w1) => {
      const p = R.taper(pts[0], pts[1], w0, w1, 3);
      c.fillStyle = LG(c, pts[0][0] - 40, pts[0][1] - 20, pts[1][0] + 30, pts[1][1] + 20, [[0, GOWN_L], [0.3, GOWN], [0.75, GOWN_D], [1, GOWN_X]]);
      c.fill(p);
      c.save(); c.clip(p);
      c.strokeStyle = 'rgba(10,6,2,.38)'; c.lineWidth = 9;
      c.beginPath(); c.moveTo(pts[0][0] + 8, pts[0][1] + 6); c.lineTo(pts[1][0] + 8, pts[1][1] + 4); c.stroke();
      c.strokeStyle = 'rgba(206,170,112,.14)'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(pts[0][0] - 14, pts[0][1] + 10); c.quadraticCurveTo((pts[0][0] + pts[1][0]) / 2 - 10, (pts[0][1] + pts[1][1]) / 2, pts[1][0] - 12, pts[1][1] - 6); c.stroke();
      c.restore();
    };
    sleeve([[HX - 124, 646 + oy], [3018, 724]], 54, 40);
    sleeve([[HX + 88, 652 + oy], [3164, 732]], 50, 38);
    // 袖口（白麻）
    for (const [cx, cy, r] of [[3020, 728, 19], [3156, 736, 17]]) {
      c.fillStyle = LG(c, cx - r, cy - 14, cx + r, cy + 14, [[0, LINEN], [0.5, '#cfc3a8'], [1, LINEN_D]]);
      c.beginPath(); c.ellipse(cx, cy, r, 13, -0.35, 0, 7); c.fill();
      c.strokeStyle = 'rgba(120,104,76,.4)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx, cy + 2, r - 2, 10, -0.35, 0, 7); c.stroke();
    }

    // —— 手：放在桌面，捏着两脚规 ——
    const handShape = (hx, hy, dir) => {
      const g2 = RGd(c, hx - 8, hy - 10, 4, 28, [[0, '#f2cda8'], [0.55, SK], [1, '#a06e48']]);
      c.fillStyle = g2;
      c.beginPath(); c.ellipse(hx, hy, 17, 11, 0.16 * dir, 0, 7); c.fill();
      c.beginPath(); c.ellipse(hx - 9 * dir, hy + 6, 6.5, 8.5, 0.5, 0, 7); c.fill();
      c.strokeStyle = 'rgba(148,94,62,.5)'; c.lineWidth = 1.2;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(hx - 1 + k * 5 * dir, hy + 1); c.quadraticCurveTo(hx + k * 5 * dir, hy + 6, hx + 1 + k * 5 * dir, hy + 9); c.stroke(); }
      c.fillStyle = 'rgba(255,232,206,.42)'; c.beginPath(); c.ellipse(hx - 5, hy - 5, 6, 3, .2, 0, 7); c.fill();
    };
    handShape(3048, 764, 1);
    handShape(3116, 772, -1);

    // —— 两脚规（黄铜，随绘制微摆）——
    const piv = [3086, 762], sw = Math.sin(t * 1.6) * 0.045 + (t > 6.4 ? Math.sin((t - 6.4) * 1.4) * 0.045 : 0);
    c.strokeStyle = LG(c, piv[0], piv[1], 3040, 770, [[0, '#f2daa0'], [0.5, '#c39a56'], [1, '#7a5a26']]);
    c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(...piv); c.lineTo(3048, 770 - 4 * sw); c.moveTo(...piv); c.lineTo(3114, 776 + 3 * sw); c.stroke();
    c.strokeStyle = 'rgba(255,246,206,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(...piv); c.lineTo(3049, 760); c.stroke();
    c.fillStyle = '#e8c987'; c.beginPath(); c.arc(piv[0], piv[1], 4.6, 0, 7); c.fill();
    c.fillStyle = '#6a4a1c'; c.beginPath(); c.arc(piv[0], piv[1], 2.1, 0, 7); c.fill();
    c.strokeStyle = '#4a3418'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(3048, 760); c.lineTo(3046, 774); c.moveTo(3112, 770); c.lineTo(3114, 782); c.stroke();

    // —— 纸上正在生成的弧 ——
    const prog = clamp((t - 6.3) / 2.2, 0, 1);
    c.strokeStyle = `rgba(66,40,18,${0.5 * Math.sin(Math.min(1, prog) * Math.PI) + 0.10})`;
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(3072, 762, 54, Math.PI * 0.95, Math.PI * (0.95 + 1.1 * prog)); c.stroke();

    c.restore();
  }

// ---------- 罩层（屏幕空间）：龟裂＋黄釉＋画布经纬＋油彩笔触 ----------
  const OVER = () => cache('over', window.__canvas.width, window.__canvas.height, (g) => {
    const SW = g.canvas.width, SH = g.canvas.height;
    g.fillStyle = RGd(g, SW * .42, SH * .46, SH * .3, SH * 1.25, [[0, 'rgba(18,9,4,0)'], [0.55, 'rgba(18,9,4,.26)'], [1, 'rgba(8,4,2,.8)']]); g.fillRect(0, 0, SW, SH);
    g.fillStyle = 'rgba(154,112,42,.075)'; g.fillRect(0, 0, SW, SH);
    const r = R_(4); g.lineWidth = 1;
    for (let y = 0; y < SH; y += 3) { if (r() < 0.42) continue; g.strokeStyle = `rgba(0,0,0,${0.008 + r() * 0.014})`; g.beginPath(); g.moveTo(0, y + .5); g.lineTo(SW, y + .5); g.stroke(); }
    for (let x = 0; x < SW; x += 3) { if (r() < 0.42) continue; g.strokeStyle = `rgba(255,240,210,${0.006 + r() * 0.012})`; g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, SH); g.stroke(); }
    g.lineCap = 'round';
    for (let k = 0; k < 7000; k++) {
      const x = r() * SW, y = r() * SH, a = r() * Math.PI, L = 10 + r() * 16;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,235,200,.016)' : 'rgba(20,10,0,.020)'; g.lineWidth = 5 + r() * 5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    g.globalAlpha = 0.13; g.drawImage(P.craquelure('ren', 0.45), 0, 0);
    g.globalAlpha = 0.05; g.globalCompositeOperation = 'lighter'; g.filter = 'brightness(0) invert(1)';
    g.drawImage(P.craquelure('ren', 0.45), 1, 1); g.filter = 'none';
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  });

  // ---------- 相机：一镜到底横摇 ----------
  const KEYS = [
    { t: 0.0, x: 1086, y: 610, z: 1.02, ease: MO.sineInOut },
    { t: 1.2, x: 1098, y: 610, z: 1.07 },
    { t: 2.7, x: 1104, y: 608, z: 1.13 },
    { t: 4.4, x: 1745, y: 606, z: 1.15 },
    { t: 5.7, x: 1778, y: 604, z: 1.22 },
    { t: 7.2, x: 2905, y: 610, z: 1.16, ease: MO.longTail },
    { t: 8.4, x: 2932, y: 612, z: 1.14 },
    { t: 12.4, x: 2350, y: 600, z: 1.00, ease: MO.sineInOut },
  ];

  const sm = (x) => { const q = clamp(x, 0, 1); return q * q * (3 - 2 * q); };
  const cupAt = (t) => (t < 3.9 ? 0 : t < 5.3 ? sm((t - 3.9) / 1.4) : t < 6.4 ? 1 : t < 7.2 ? 1 - sm((t - 6.4) / 0.8) : 0);

  return {
    init() { STATIC(); OVER(); },
    draw(c, lt, t) {
      const cam = CAM.at(KEYS, t);
      c.save(); CAM.apply(c, cam);
      c.drawImage(STATIC(), 0, 0);
      riverLight(c, t); birds(c, t);
      beamAndDust(c, t); candleFlame(c, t);
      globeSphere(c, t);
      c.restore();

      // 角色层：世界空间画完后在屏幕空间做晕涂（模糊层＋清晰层）
      const L = P.scratch('renChars'), g = L.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, L.width, L.height);
      g.save(); CAM.apply(g, cam);
      // 地面影
      g.fillStyle = 'rgba(12,6,2,.42)'; g.beginPath(); g.ellipse(980, 1012, 150, 16, 0, 0, 7); g.fill();
      catPaint(g, t);
      const cup = Math.min(0.55, cupAt(t)), sip = cup * 0.12;
      g.save(); g.beginPath(); g.rect(1400, 300, 720, 404); g.clip();
      girlPaint(g, t, cup, sip, cup > 0.72);
      g.restore();
      scholarPaint(g, t);
      g.restore();

      c.filter = 'blur(0.9px)'; c.drawImage(L, 0, 0); c.filter = 'none';
      c.globalAlpha = 0.9; c.drawImage(L, 0, 0); c.globalAlpha = 1;
      c.drawImage(OVER(), 0, 0);
      // 统一色调：降饱和、暖釉、提对比（让各处平涂归到同一套油彩里）
      const GR = P.scratch('renGrade'), gr = GR.getContext('2d');
      gr.setTransform(1, 0, 0, 1, 0, 0); gr.clearRect(0, 0, GR.width, GR.height);
      gr.drawImage(c.canvas, 0, 0);
      c.save(); c.clearRect(0, 0, c.canvas.width, c.canvas.height);
      c.filter = 'saturate(.84) contrast(1.08) brightness(.985) sepia(.10)';
      c.drawImage(GR, 0, 0); c.filter = 'none'; c.restore();
    },
  };
})();


