/* Auto-Video 自研画法脚本 · 分析立体主义（Cubism, 1912 巴黎）
   场景：咖啡馆一角。吉他手在桌边拨弦，侍者俯身斟酒，报纸被风掀起一角，窗外屋顶碎成切面。
   一镜到底 10 秒：切面网在「沸」、窗格错位、琴弦与酒线在抖，镜头极慢横移。
   管线：①叠面底版（每面明→暗渐变）→ ②点画/排线/木纹肌理 → ③人物平涂进离屏层 → 自写切面器 facetize
        → ④毕加索式侧脸、直线外轮廓（端点外伸）→ ⑤桌沿遮住下身 → ⑥最上层低透明叠面把人和物嵌进空间。
   全部由代码绘制，不使用任何外部图片。 */
SCENES['11_cubism'] = (() => {
  const W = 1920, H = 1080, { clamp } = U, P = PAINT, TAU = Math.PI * 2;
  const C = { paper: '#d6c8ac', cream: '#ece3cf', ochre: '#b8975f', brown: '#7a5a34', dbrown: '#3a2c1e', grey: '#a8a395', bgrey: '#8e9eab', dgrey: '#5a5852', ink: '#2e241a', blue: '#5f7488', olive: '#77784a', rust: '#9c5330', teal: '#2f4858' };
  const H2 = P.hex;
  const LAYERS = {}; const layer = (k) => { if (!LAYERS[k]) { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d', { willReadFrequently: true }); LAYERS[k] = cv; } return LAYERS[k]; };
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); };
  const plane = (g, pts, col, alpha, r, dark = 0.4, light = 0.25) => {
    const c0 = Array.isArray(col) ? col : H2(col);
    let a = pts[0], b = pts[(r() * pts.length) | 0]; if (a === b) b = pts[(pts.length / 2) | 0];
    const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]);
    gr.addColorStop(0, P.rgb(P.mix(c0, [250, 244, 228], light), alpha));
    gr.addColorStop(0.55, P.rgb(c0, alpha));
    gr.addColorStop(1, P.rgb(P.mix(c0, [45, 35, 25], dark), alpha));
    g.fillStyle = gr; poly(g, pts); g.fill();
  };
  const wood = (g, x, y, w, h, vertical, seed, base = '#b8874a', dark = '#7a5228') => {
    const r = U.rng(seed); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = base; g.fillRect(x, y, w, h);
    g.strokeStyle = dark; const L = vertical ? h : w, S = vertical ? w : h, kx = 0.35 + r() * 0.3, ky = 0.3 + r() * 0.4;
    for (let i = 0; i < S / 6; i++) { g.lineWidth = 0.8 + r() * 1.6; g.globalAlpha = 0.35 + r() * 0.4; g.beginPath();
      for (let s = 0; s <= L; s += 6) { const u = s / L, off = i * 6 + Math.sin(u * 7 + i * 0.4) * 3 + 14 * Math.exp(-((u - kx) ** 2) / 0.01) * Math.sign(i * 6 - S * ky);
        const X = vertical ? x + off : x + s, Y = vertical ? y + s : y + off; s ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.stroke(); }
    g.globalAlpha = 1; g.restore();
  };
  const seg = (g, a, b, w, col) => { g.strokeStyle = col || C.ink; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };

  // 桌面透视：左高右低
  const SY = (x) => 820 - (x - 520) * 0.0327;

  // ---------- ① 墙面与窗 ----------
  function wall(c, lt, t) {
    const r = U.rng(1912);
    c.fillStyle = C.paper; c.fillRect(0, 0, W, H);
    const big = [
      [[[0, 0], [430, 0], [300, 300], [0, 250]], C.grey, .62],
      [[[390, 0], [900, 0], [770, 250], [330, 220]], C.cream, .58],
      [[[860, 0], [1290, 0], [1230, 290], [880, 250]], C.ochre, .5],
      [[[1270, 0], [1920, 0], [1920, 430], [1470, 300]], C.cream, .44],
      [[[0, 240], [270, 300], [210, 770], [0, 720]], C.dgrey, .4],
      [[[0, 700], [380, 730], [430, 1080], [0, 1080]], C.ochre, .42],
      [[[1330, 300], [1920, 280], [1920, 700], [1480, 740]], C.grey, .38],
      [[[1400, 690], [1920, 640], [1920, 1080], [1450, 1080]], C.teal, .16],
      [[[820, 0], [1000, 300], [890, 640]], C.bgrey, .3],
      [[[980, 250], [1300, 230], [1330, 690], [1000, 700]], C.brown, .22],
      [[[430, 120], [760, 100], [760, 560], [420, 580]], C.ochre, .18],
    ];
    big.forEach(([pts, col, a]) => plane(c, pts, col, a, r));
    // 三块强色切面：锈红／橄榄／石板蓝，压住米黄
    plane(c, [[790, 0], [900, 0], [880, 430], [800, 470]], C.rust, .52, U.rng(7), .55, .14);
    plane(c, [[900, 0], [1006, 0], [996, 340], [908, 300]], C.olive, .44, U.rng(8), .5, .12);
    plane(c, [[1298, 60], [1420, 40], [1440, 470], [1320, 500]], C.blue, .38, U.rng(6), .5, .14);
    plane(c, [[470, 620], [700, 600], [706, 760], [478, 780]], C.rust, .34, U.rng(5), .5, .12);
    // 窗
    plane(c, [[232, 122], [772, 104], [788, 574], [220, 590]], C.cream, .7, r);
    c.save(); poly(c, [[240, 132], [762, 114], [778, 564], [230, 580]]); c.clip();
    c.fillStyle = '#c4cfd6'; c.fillRect(228, 110, 560, 480);
    const wr = U.rng(77);
    for (let k = 0; k < 14; k++) { const x = 240 + wr() * 500, y = 180 + wr() * 240, w = 70 + wr() * 130, hh = 50 + wr() * 130;
      plane(c, [[x, y + hh], [x + w, y + hh - wr() * 20], [x + w * .8, y], [x + w * .1, y + 8]], k % 3 ? C.bgrey : C.blue, .55, wr, .5, .2); }
    for (let k = 0; k < 7; k++) { const x = 246 + k * 74, y = 478, s = 58 + wr() * 42;
      plane(c, [[x, y], [x + s * .55, y - s * .58], [x + s, y]], k % 2 ? C.dgrey : C.bgrey, .82, wr, .4);
      c.fillStyle = 'rgba(50,44,38,.55)'; c.fillRect(x + s * .68, y - s * .5, 9, 24); }
    c.restore();
    seg(c, [244, 130], [764, 112], 10); seg(c, [228, 580], [780, 562], 10);
    seg(c, [238, 126], [222, 584], 10); seg(c, [770, 108], [786, 564], 10);
    seg(c, [244, 330 + Math.sin(t * .4) * 3], [770, 316 + Math.sin(t * .4) * 3], 6);
    seg(c, [508 + Math.cos(t * .5) * 4, 120], [516 + Math.cos(t * .5) * 4, 570], 5);
    // 吊灯
    const sw = Math.sin(t * 1.4) * 6;
    seg(c, [1430, 0], [1430 + sw, 246], 5);
    c.fillStyle = '#2e241a'; c.beginPath(); c.ellipse(1430 + sw, 252, 64, 14, 0.05, 0, TAU); c.fill();
    c.fillStyle = '#d8a457'; c.beginPath(); c.moveTo(1392 + sw, 250); c.lineTo(1470 + sw, 250); c.lineTo(1454 + sw, 338); c.lineTo(1406 + sw, 338); c.closePath(); c.fill();
    c.fillStyle = '#f8eec6'; c.beginPath(); c.ellipse(1430 + sw, 338, 20, 8, 0, 0, TAU); c.fill();
    // 右墙：立体派静物小画
    c.save(); c.translate(1730, 330); c.rotate(-0.03);
    c.fillStyle = '#d8ccb0'; c.fillRect(-112, -122, 224, 244);
    seg(c, [-112, -122], [112, -122], 8); seg(c, [112, -122], [112, 122], 8); seg(c, [112, 122], [-112, 122], 8); seg(c, [-112, 122], [-112, -122], 8);
    plane(c, [[-100, -110], [26, -110], [26, 34], [-100, 34]], C.blue, .5, r);
    plane(c, [[26, -110], [104, -98], [92, 62], [26, 34]], C.cream, .55, r);
    plane(c, [[-100, 34], [8, 26], [24, 108], [-92, 112]], C.olive, .45, r);
    c.fillStyle = '#8a6a3a'; c.beginPath(); c.ellipse(44, 44, 44, 22, -0.2, 0, TAU); c.fill();
    c.restore();
    // 墙上小搁板＋酒瓶（吃掉中段空白）
    plane(c, [[880, 372], [1230, 356], [1240, 384], [872, 398]], C.ochre, .6, r);
    seg(c, [880, 392], [1230, 378], 4, 'rgba(40,30,20,.5)');
    const br = U.rng(303);
    for (let k = 0; k < 5; k++) {
      const x = 918 + k * 62, y = 356 - (x - 880) * 0.045, hh = 62 + br() * 46, w = 18 + br() * 10;
      c.fillStyle = ['#3a4a3a', '#5a3a2a', '#2e3a4a', '#6a5a2a', '#4a2a2a'][k % 5];
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.lineTo(x + w, y - hh + 18); c.lineTo(x + w * .68, y - hh + 6); c.lineTo(x + w * .32, y - hh + 6); c.lineTo(x, y - hh + 18); c.closePath(); c.fill();
      c.fillStyle = 'rgba(240,230,200,.35)'; c.fillRect(x + 3, y - hh + 26, w - 6, 10);
    }
    // 地面：墙脚线 → 木地板 → 投影，把人钉在地上
    plane(c, [[0, 992], [1920, 960], [1920, 1080], [0, 1080]], C.brown, .85, U.rng(101), .55, .12);
    c.save(); c.beginPath(); c.moveTo(0, 992); c.lineTo(1920, 960); c.lineTo(1920, 1080); c.lineTo(0, 1080); c.closePath(); c.clip();
    const fr = U.rng(102);
    for (let i = 0; i < 16; i++) { c.strokeStyle = 'rgba(40,26,14,' + (0.18 + fr() * 0.25) + ')'; c.lineWidth = 1.4 + fr() * 2; c.beginPath();
      for (let x = -200; x < 2100; x += 60) c.lineTo(x, 972 + i * 8 - (x / 1920) * 32 + Math.sin(x * .008 + i) * 1.6); c.stroke(); }
    c.restore();
    seg(c, [0, 992], [1920, 960], 7, 'rgba(40,28,16,.55)');
    // 桌与人的投影
    for (const [sx, sy, rx] of [[630, 1024, 240], [1610, 1000, 210], [760, 1046, 130], [1230, 1020, 150]]) {
      const gg = c.createRadialGradient(sx, sy, 4, sx, sy, rx);
      gg.addColorStop(0, 'rgba(20,14,8,.45)'); gg.addColorStop(1, 'rgba(20,14,8,0)');
      c.fillStyle = gg; c.beginPath(); c.ellipse(sx, sy, rx, rx * 0.28, 0, 0, TAU); c.fill();
    }
    // 右墙一块冷色切面（打散米黄）
    plane(c, [[1430, 400], [1920, 366], [1920, 700], [1466, 740]], C.teal, .16, U.rng(103));
    // 衣帽架
    seg(c, [1806, 1080], [1808, 596], 7);
    for (const [dx, dy] of [[-40, 626], [38, 618], [0, 600]]) { seg(c, [1807, 642], [1807 + dx, 642 - 30], 5); c.strokeStyle = C.ink; c.lineWidth = 5; c.beginPath(); c.arc(1807 + dx, 610, 9, 0.6, 3.4); c.stroke(); }
    c.fillStyle = '#6a4a2a'; c.beginPath(); c.ellipse(1808, 588, 46, 12, 0.04, Math.PI, 0); c.fill();
    c.fillRect(1832, 550, 12, 34);
  }

  // ---------- ② 桌面（人物之前） ----------
  function tableTop(c) {
    const r = U.rng(77);
    plane(c, [[520, 820], [1560, 786], [1700, 882], [500, 916]], C.brown, .92, r, .5, .18);
    c.fillStyle = '#b8874a'; c.beginPath(); c.moveTo(522, 821); c.lineTo(1558, 787); c.lineTo(1692, 876); c.lineTo(502, 912); c.closePath(); c.fill();
    c.save(); c.beginPath(); c.moveTo(522, 821); c.lineTo(1558, 787); c.lineTo(1690, 876); c.lineTo(502, 912); c.closePath(); c.clip();
    const rr = U.rng(88);
    for (let i = 0; i < 24; i++) { c.strokeStyle = 'rgba(90,58,26,' + (0.18 + rr() * 0.22) + ')'; c.lineWidth = 1 + rr() * 2.4; c.beginPath();
      const y0 = 792 + i * 4.4; for (let x = 500; x < 1720; x += 40) c.lineTo(x, y0 - (x - 520) * 0.0327 + Math.sin(x * .01 + i) * 2.6); c.stroke(); }
    c.restore();
  }

  // 座椅（人物之前）
  function chairs(c) {
    const r = U.rng(77);
    // 大扶手椅（右侧，深蓝绿，压住右端）
    plane(c, [[1580, 700], [1780, 676], [1800, 940], [1596, 964]], C.teal, .82, U.rng(120), .5, .1);
    plane(c, [[1590, 720], [1772, 698], [1784, 860], [1602, 882]], '#4a6a64', .7, U.rng(121), .5, .12);
    seg(c, [1592, 724], [1774, 702], 6, 'rgba(20,16,12,.55)');
    seg(c, [1782, 690], [1796, 946], 7, 'rgba(20,16,12,.5)');
    c.fillStyle = '#c8b48a'; c.fillRect(1606, 760, 168, 24);
    // 椅子（吉他手身后，先画）
    plane(c, [[1246, 726], [1408, 710], [1420, 846], [1258, 862]], C.brown, .62, r);
    seg(c, [1256, 762], [1410, 746], 5); seg(c, [1259, 806], [1413, 790], 5);
    plane(c, [[1224, 848], [1436, 834], [1450, 896], [1236, 910]], C.ochre, .55, r);
  }

  // 桌面（人物之后，遮住坐在桌前的人身下半截）
  function tableSurface(c) {
    const r = U.rng(77);
    plane(c, [[520, 820], [1560, 786], [1700, 882], [500, 916]], C.brown, .92, r, .5, .18);
    c.fillStyle = '#b8874a'; c.beginPath(); c.moveTo(522, 821); c.lineTo(1558, 787); c.lineTo(1692, 876); c.lineTo(502, 912); c.closePath(); c.fill();
    c.save(); c.beginPath(); c.moveTo(522, 821); c.lineTo(1558, 787); c.lineTo(1690, 876); c.lineTo(502, 912); c.closePath(); c.clip();
    const rr = U.rng(88);
    for (let i = 0; i < 24; i++) { c.strokeStyle = 'rgba(90,58,26,' + (0.18 + rr() * 0.22) + ')'; c.lineWidth = 1 + rr() * 2.4; c.beginPath();
      const y0 = 792 + i * 4.4; for (let x = 500; x < 1720; x += 40) c.lineTo(x, y0 - (x - 520) * 0.0327 + Math.sin(x * .01 + i) * 2.6); c.stroke(); }
    c.restore();
  }

  // ---------- ③ 桌沿（人物之后，遮住下半身） ----------
  function tableFront(c) {
    const r = U.rng(55);
    plane(c, [[500, 916], [1700, 882], [1702, 946], [498, 980]], C.ochre, .85, r, .55, .14);
    c.fillStyle = '#8a5a30'; c.beginPath(); c.moveTo(500, 916); c.lineTo(1700, 882); c.lineTo(1702, 938); c.lineTo(498, 972); c.closePath(); c.fill();
    c.save(); c.beginPath(); c.moveTo(500, 916); c.lineTo(1700, 882); c.lineTo(1702, 938); c.lineTo(498, 972); c.closePath(); c.clip();
    const rr = U.rng(66);
    for (let i = 0; i < 14; i++) { c.strokeStyle = 'rgba(70,44,20,' + (0.2 + rr() * 0.3) + ')'; c.lineWidth = 1.4 + rr() * 2; c.beginPath();
      const y0 = 890 + i * 3.6; for (let x = 490; x < 1720; x += 40) c.lineTo(x, y0 - (x - 520) * 0.0327 + Math.sin(x * .01 + i) * 1.8); c.stroke(); }
    c.restore();
    seg(c, [500, 916], [1700, 882], 6, 'rgba(40,28,16,.7)');
    // 桌腿
    plane(c, [[600, 970], [660, 964], [646, 1080], [588, 1080]], C.dbrown, .8, r);
    plane(c, [[1580, 932], [1640, 926], [1652, 1080], [1594, 1080]], C.dbrown, .8, r);
    seg(c, [598, 974], [588, 1078], 5, 'rgba(30,20,12,.55)'); seg(c, [1580, 936], [1594, 1078], 5, 'rgba(30,20,12,.55)');
    // 桌下的深影：把坐在桌后的人的脚藏进去
    const us = c.createLinearGradient(0, 930, 0, 1080);
    us.addColorStop(0, 'rgba(20,14,8,.55)'); us.addColorStop(0.55, 'rgba(20,14,8,.38)'); us.addColorStop(1, 'rgba(20,14,8,.06)');
    c.fillStyle = us; c.fillRect(480, 930, 1240, 150);
  }

  // ---------- ④ 桌上物件 ----------
  function items(c, lt, t) {
    const r = U.rng(21), fl = Math.sin(t * 3.1) * 6;
    // 报纸（平放，被风掀起一角）
    c.save(); c.translate(1060, SY(1060) + 6); c.rotate(-0.10 + fl * 0.006);
    c.fillStyle = '#efe7d4'; c.beginPath(); c.moveTo(-112, 4); c.lineTo(100, -12); c.lineTo(108 + fl, 30); c.lineTo(-106, 44); c.closePath(); c.fill();
    seg(c, [-112, 4], [100, -12], 2, 'rgba(50,40,30,.35)');
    for (let k = 0; k < 5; k++) seg(c, [-98, 12 + k * 7], [16, 6 + k * 7], 1.6, 'rgba(50,40,30,.4)');
    c.fillStyle = C.ink; c.font = 'bold 20px serif'; c.fillText('JOURNAL', 38, 26); c.restore();
    // 两只玻璃杯
    for (let k = 0; k < 2; k++) {
      const gx = 726 + k * 52, gy = SY(726 + k * 52);
      c.fillStyle = 'rgba(226,232,214,.45)'; c.beginPath(); c.moveTo(gx - 17, gy - 34); c.lineTo(gx + 17, gy - 34); c.lineTo(gx + 12, gy - 2); c.lineTo(gx - 12, gy - 2); c.closePath(); c.fill();
      seg(c, [gx - 17, gy - 34], [gx - 12, gy - 2], 2, 'rgba(50,40,30,.55)'); seg(c, [gx + 17, gy - 34], [gx + 12, gy - 2], 2, 'rgba(50,40,30,.55)');
      c.strokeStyle = 'rgba(60,50,40,.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(gx, gy - 34, 17, 5, 0, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(140,60,30,.55)'; c.beginPath(); c.ellipse(gx, gy - 14, 13, 4, 0, 0, TAU); c.fill();
    }
    // 酒瓶（侍者倒的那瓶之外的备用瓶）
    const bx = 962, by = SY(962);
    c.fillStyle = '#3a4a3a'; c.beginPath(); c.moveTo(bx - 13, by - 96); c.lineTo(bx + 13, by - 96); c.lineTo(bx + 15, by - 2); c.lineTo(bx - 15, by - 2); c.closePath(); c.fill();
    c.fillRect(bx - 6, by - 128, 12, 34);
    c.fillStyle = 'rgba(230,236,220,.4)'; c.fillRect(bx - 10, by - 80, 20, 22);
    // 烟灰缸＋方糖罐
    c.fillStyle = '#e8e2d2'; c.beginPath(); c.ellipse(1246, SY(1246) - 2, 34, 11, 0, 0, TAU); c.fill();
    c.fillStyle = '#c8bfa8'; c.beginPath(); c.ellipse(1246, SY(1246) - 8, 24, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#d8cfb8'; c.fillRect(1336, SY(1336) - 62, 44, 60);
    seg(c, [1336, SY(1336) - 62], [1336, SY(1336) - 2], 2, 'rgba(50,40,30,.5)'); seg(c, [1380, SY(1380) - 62], [1380, SY(1380) - 2], 2, 'rgba(50,40,30,.5)');
    c.fillStyle = '#e8dfc8'; c.beginPath(); c.ellipse(1358, SY(1358) - 62, 22, 7, 0, 0, TAU); c.fill();
    // 右侧：酒壶（带高光）、盘子、餐巾
    const cx = 1502, cy = SY(1502);
    c.fillStyle = 'rgba(210,220,206,.6)'; c.beginPath(); c.moveTo(cx - 26, cy - 96); c.lineTo(cx + 26, cy - 96); c.lineTo(cx + 20, cy - 4); c.lineTo(cx - 20, cy - 4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(50,40,30,.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 26, cy - 96); c.lineTo(cx - 20, cy - 4); c.moveTo(cx + 26, cy - 96); c.lineTo(cx + 20, cy - 4); c.stroke();
    c.strokeStyle = 'rgba(60,50,40,.5)'; c.lineWidth = 2.4; c.beginPath(); c.ellipse(cx, cy - 96, 26, 8, 0, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(150,60,40,.5)'; c.beginPath(); c.ellipse(cx, cy - 40, 18, 6, 0, 0, TAU); c.fill();
    c.fillStyle = '#e8e0cc'; c.beginPath(); c.ellipse(1400, SY(1400) - 4, 44, 13, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(70,55,40,.5)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#efe7d4'; c.beginPath(); c.moveTo(1420, SY(1420) - 12); c.lineTo(1462, SY(1462) - 14); c.lineTo(1466, SY(1466) - 2); c.lineTo(1424, SY(1424)); c.closePath(); c.fill();
    // 桌下暖光池与投影
    const sh = c.createLinearGradient(0, 800, 0, 900);
    sh.addColorStop(0, 'rgba(30,22,14,.22)'); sh.addColorStop(1, 'rgba(30,22,14,0)');
    c.fillStyle = sh; c.fillRect(500, 800, 1200, 100);
  }

  // ---------- 切面器 ----------
  function facetize(g, src, box, cell, seed, t, { boilFrac = 0.25, alpha = 0.95, edge = 'rgba(40,30,20,.32)', light = 0.2, dark = 0.32, minA = 120, only = null } = {}) {
    const [x0, y0, x1, y1] = box, w = x1 - x0, h = y1 - y0, d = src.getContext('2d').getImageData(x0, y0, w, h).data;
    const nx = Math.ceil(w / cell), ny = Math.ceil(h / cell), r = U.rng(seed), pts = [];
    const st = P.boilSeed(t, 8);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const k = j * (nx + 1) + i; pts.push([x0 + i * cell + (r() - .5) * cell * 0.85 + (U.hash(k, st * 3 + seed) - .5) * cell * 0.16, y0 + j * cell + (r() - .5) * cell * 0.85 + (U.hash(k, st * 5 + seed) - .5) * cell * 0.16]); }
    const at = (x, y) => { const ix = clamp(Math.round(x - x0), 0, w - 1), iy = clamp(Math.round(y - y0), 0, h - 1), k = (iy * w + ix) * 4; return [d[k], d[k + 1], d[k + 2], d[k + 3]]; };
    g.lineJoin = 'round';
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const A = pts[j * (nx + 1) + i], B = pts[j * (nx + 1) + i + 1], Cc = pts[(j + 1) * (nx + 1) + i], D = pts[(j + 1) * (nx + 1) + i + 1];
      const tris = r() < 0.5 ? [[A, B, D], [A, D, Cc]] : [[A, B, Cc], [B, D, Cc]];
      tris.forEach((tri, k) => {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3, s = at(cx, cy);
        const shadeR = r(); if (s[3] < minA || (only && !only(s))) return;
        const flick = U.hash(i * 31 + j, k + st * 7) < boilFrac ? (U.hash(i, j + st) - 0.5) * 0.25 : 0;
        const sh = 0.8 + shadeR * 0.38 + flick, col = [s[0] * sh, s[1] * sh, s[2] * sh];
        const gr = g.createLinearGradient(tri[0][0], tri[0][1], tri[2][0], tri[2][1]);
        gr.addColorStop(0, P.rgb(P.mix(col, [250, 244, 228], light), alpha)); gr.addColorStop(1, P.rgb(P.mix(col, [40, 32, 24], dark), alpha));
        g.fillStyle = gr; poly(g, tri); g.fill(); g.strokeStyle = edge; g.lineWidth = 1; g.stroke();
      });
    }
  }

  // ---------- 人物 ----------
  const GIT = { features: false, lw: 2.6, line: 'rgba(35,26,18,.78)', skin: '#c98a5e', hair: '#241a12', shirt: '#c89a54', sleeve: '#b8863e', trousers: '#33465c', shoes: '#241c14', hat: '#7a5330', belt: '#4a2e16' };
  const WTR = { features: false, lw: 2.6, line: 'rgba(35,26,18,.78)', skin: '#c98a5e', hair: '#241a12', shirt: '#e6ddc6', sleeve: '#d8cfb6', trousers: '#26303a', shoes: '#1e1a16', belt: '#26303a' };
  const FIG_G = (() => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv.getContext('2d', { willReadFrequently: true }); })();

  function guitarist(t, lt) {
    const x = 1206, y = 966, h = 500, strum = Math.sin(lt * 6.4);
    const G = FIG.build({ x, y, h, face: -1, armFront: true, hipUp: 0.30,
      thighL: 1.62, shinL: -1.52, footL: 0.10, thighR: 1.40, shinR: -1.30, footR: 0.10,
      lean: 0.10, head: 0.14,
      handL: [x - 0.31 * h, y - 0.62 * h], handR: [x - 0.06 * h, y - 0.44 * h + strum * 0.026 * h],
      hair: 'short', hat: 'bowler', bottom: 'trousers', top: 'shirt', sleeve: true });
    FIG.draw(FIG_G, G, GIT);
    { // 深绿马甲
      const a = G.J.shoulderL, b = G.J.shoulderR, w = G.J.waist;
      FIG_G.fillStyle = '#39463a'; FIG_G.beginPath();
      FIG_G.moveTo(a[0] + 0.012 * h, a[1] + 0.02 * h); FIG_G.lineTo(b[0], b[1] + 0.03 * h);
      FIG_G.lineTo(w[0] + 0.05 * h, w[1]); FIG_G.lineTo(w[0] - 0.03 * h, w[1] + 0.01 * h);
      FIG_G.lineTo(a[0] - 0.01 * h, a[1] + 0.10 * h); FIG_G.closePath(); FIG_G.fill();
      seg(FIG_G, [a[0], a[1] + 0.02 * h], [w[0] - 0.02 * h, w[1]], 2, 'rgba(30,24,16,.55)');
    }
    // 吉他
    const gx = x - 0.27 * h, gy = y - 0.56 * h;
    FIG_G.save(); FIG_G.translate(gx, gy); FIG_G.rotate(-0.32);
    FIG_G.fillStyle = '#a8682c'; FIG_G.beginPath(); FIG_G.ellipse(0, 0, 0.135 * h, 0.105 * h, 0, 0, TAU); FIG_G.fill();
    FIG_G.fillStyle = '#7a4620'; FIG_G.beginPath(); FIG_G.ellipse(-0.025 * h, 0.025 * h, 0.112 * h, 0.088 * h, 0, 0, TAU); FIG_G.fill();
    FIG_G.fillStyle = '#2e2018'; FIG_G.beginPath(); FIG_G.ellipse(0, 0, 0.037 * h, 0.031 * h, 0, 0, TAU); FIG_G.fill();
    FIG_G.strokeStyle = '#5a3818'; FIG_G.lineWidth = 9; FIG_G.beginPath(); FIG_G.moveTo(0.10 * h, -0.04 * h); FIG_G.lineTo(0.34 * h, -0.17 * h); FIG_G.stroke();
    FIG_G.fillStyle = '#3a2414'; FIG_G.beginPath(); FIG_G.ellipse(0.35 * h, -0.18 * h, 0.036 * h, 0.052 * h, -0.3, 0, TAU); FIG_G.fill();
    FIG_G.strokeStyle = 'rgba(240,230,200,.8)'; FIG_G.lineWidth = 1.2;
    for (let k = -2; k <= 2; k++) { FIG_G.beginPath(); FIG_G.moveTo(k * 0.013 * h, -0.09 * h); FIG_G.lineTo(0.33 * h + k * 0.008 * h, -0.18 * h); FIG_G.stroke(); }
    FIG_G.restore();
    return G;
  }

  function waiter(t, lt) {
    const x = 404, y = 1072, h = 520, tilt = Math.sin(lt * 1.5) * 0.08;
    const G = FIG.build({ x, y, h, face: 1, armFront: true, ...FIG.pose('idle', lt * .5),
      lean: 0.26, head: 0.22,
      handR: [x + 0.40 * h, y - 0.56 * h], handL: [x + 0.16 * h, y - 0.30 * h],
      hair: 'short', bottom: 'trousers', top: 'shirt', sleeve: true });
    FIG.draw(FIG_G, G, WTR);
    { // 深灰背心
      const a = G.J.shoulderL, b = G.J.shoulderR, w = G.J.waist;
      FIG_G.fillStyle = '#2b3238'; FIG_G.beginPath();
      FIG_G.moveTo(a[0] + 0.012 * h, a[1] + 0.02 * h); FIG_G.lineTo(b[0], b[1] + 0.03 * h);
      FIG_G.lineTo(w[0] + 0.05 * h, w[1]); FIG_G.lineTo(w[0] - 0.03 * h, w[1] + 0.01 * h);
      FIG_G.lineTo(a[0] - 0.01 * h, a[1] + 0.10 * h); FIG_G.closePath(); FIG_G.fill();
      seg(FIG_G, [a[0], a[1] + 0.02 * h], [w[0] - 0.02 * h, w[1]], 2, 'rgba(20,16,12,.6)');
    }
    { // 白围裙
      const f = G.face, w = G.J.waist;
      FIG_G.fillStyle = '#efe9da'; FIG_G.beginPath();
      FIG_G.moveTo(w[0] - f * 0.055 * h, w[1] - 0.01 * h); FIG_G.lineTo(w[0] + f * 0.055 * h, w[1] - 0.01 * h);
      FIG_G.lineTo(w[0] + f * 0.045 * h, y - 0.34 * h); FIG_G.lineTo(w[0] - f * 0.048 * h, y - 0.34 * h);
      FIG_G.closePath(); FIG_G.fill();
    }
    // 搭在左小臂上的白毛巾
    { const e = G.J.elbowN, hn = G.J.handN;
      FIG_G.strokeStyle = '#f4eedf'; FIG_G.lineWidth = 0.032 * h; FIG_G.lineCap = 'round';
      FIG_G.beginPath(); FIG_G.moveTo((e[0] + hn[0]) / 2, (e[1] + hn[1]) / 2 - 0.012 * h); FIG_G.lineTo(e[0] - 0.008 * h, e[1] + 0.022 * h); FIG_G.stroke(); }
    // 酒瓶（右手）
    const hp = G.J.handN;
    FIG_G.save(); FIG_G.translate(hp[0] + 0.01 * h, hp[1]); FIG_G.rotate(-0.75 + tilt);
    FIG_G.fillStyle = '#3c4a32'; FIG_G.beginPath(); FIG_G.moveTo(-15, -66); FIG_G.lineTo(15, -66); FIG_G.lineTo(21, 22); FIG_G.lineTo(-19, 22); FIG_G.closePath(); FIG_G.fill();
    FIG_G.fillStyle = '#e8e2d2'; FIG_G.fillRect(-9, -92, 18, 28);
    FIG_G.fillStyle = '#8a2a22'; FIG_G.fillRect(-9, -68, 18, 9);
    FIG_G.restore();
    return G;
  }

  // 切面之后再落一张「毕加索式侧脸」
  function faceProf(c, G, { brow = 0, mouth = true, stache = false } = {}) {
    const f = G.face, hd = G.J.headC, rx = G.hrx, ry = G.hry;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(28,22,16,.66)'; c.lineWidth = Math.max(1.8, G.h * 0.005);
    c.beginPath();
    c.moveTo(hd[0] + f * rx * 0.04, hd[1] - ry * 0.50);
    c.lineTo(hd[0] + f * rx * 0.50, hd[1] - ry * 0.38 + brow);
    c.lineTo(hd[0] + f * rx * 0.80, hd[1] - ry * 0.08);
    c.lineTo(hd[0] + f * rx * 0.88, hd[1] + ry * 0.12);
    c.lineTo(hd[0] + f * rx * 0.60, hd[1] + ry * 0.18);
    c.stroke();
    c.fillStyle = 'rgba(26,20,14,.92)';
    c.beginPath(); c.ellipse(hd[0] + f * rx * 0.38, hd[1] - ry * 0.14, rx * 0.15, ry * 0.085, f > 0 ? 0.12 : -0.12, 0, TAU); c.fill();
    c.fillStyle = 'rgba(245,238,220,.9)';
    c.beginPath(); c.ellipse(hd[0] + f * rx * 0.43, hd[1] - ry * 0.17, rx * 0.045, ry * 0.035, 0, 0, TAU); c.fill();
    if (mouth) { c.strokeStyle = 'rgba(120,42,34,.85)'; c.lineWidth = Math.max(2.2, G.h * 0.0075);
      c.beginPath(); c.moveTo(hd[0] + f * rx * 0.40, hd[1] + ry * 0.50); c.lineTo(hd[0] + f * rx * 0.74, hd[1] + ry * 0.46); c.stroke(); }
    if (stache) { c.fillStyle = 'rgba(30,22,14,.85)'; c.beginPath(); c.ellipse(hd[0] + f * rx * 0.54, hd[1] + ry * 0.34, rx * 0.26, ry * 0.09, 0, 0, TAU); c.fill(); }
    c.restore();
  }

  // ---------- 主绘制 ----------
  return {
    draw(c, lt, t) {
      const drift = -18 + 24 * (t / 10);
      c.save(); c.translate(drift, Math.sin(t * 0.5) * 3);
      wall(c, lt, t);
      tableTop(c);
      FIG_G.reset();
      const GW = waiter(t, lt);
      const GG = guitarist(t, lt);
      facetize(FIG_G, FIG_G.canvas, [430, 420, 1560, 1060], 44, 13, t, { boilFrac: 0.22, alpha: 1, edge: 'rgba(30,22,14,.30)', light: 0.12, dark: 0.36 });
      c.drawImage(FIG_G.canvas, 0, 0);
      faceProf(c, GW, { brow: 2 });
      faceProf(c, GG, { stache: true, brow: 3 });
      // 酒线：从瓶口落到杯子
      if (lt % 3.4 < 2.6) {
        const hp = GG ? null : null;
        c.strokeStyle = 'rgba(150,90,40,.75)'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(404 + 0.40 * 520 + 10, 1072 - 0.56 * 520 - 70);
        c.quadraticCurveTo(700, 800, 744, SY(744) - 30); c.stroke();
      }
      tableFront(c);
      items(c, lt, t);
      // 最上层叠面：把人和物嵌进空间
      const r = U.rng(31);
      for (let k = 0; k < 7; k++) {
        const x = 560 + r() * 980, y = 470 + r() * 420, s = 130 + r() * 210;
        plane(c, [[x, y], [x + s, y - 18], [x + s * .7, y + s * .68], [x - 18, y + s * .5]], r() < .5 ? C.cream : C.ochre, .08 + r() * .10, r);
      }
      // 前景：贴脸的椅背（裁切，制造纵深）
      plane(c, [[-30, 800], [268, 772], [300, 1080], [-30, 1080]], C.dbrown, 1, U.rng(44), .7, .04);
      c.strokeStyle = 'rgba(20,14,8,.55)'; c.lineWidth = 6;
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(20 + k * 62, 790); c.lineTo(30 + k * 62, 1080); c.stroke(); }
      plane(c, [[-30, 786], [280, 758], [286, 812], [-30, 844]], C.ochre, .75, U.rng(45), .55, .08);
      // 灯晕
      const lg = c.createRadialGradient(1430, 336, 10, 1430, 336, 150);
      lg.addColorStop(0, 'rgba(255,226,150,.42)'); lg.addColorStop(1, 'rgba(255,240,180,0)');
      c.fillStyle = lg; c.fillRect(1270, 180, 320, 320);
      const lg2 = c.createRadialGradient(1180, 760, 20, 1180, 760, 400);
      lg2.addColorStop(0, 'rgba(255,236,186,.16)'); lg2.addColorStop(1, 'rgba(255,236,186,0)');
      c.fillStyle = lg2; c.fillRect(760, 520, 900, 500);
      const vg = c.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0, 'rgba(30,24,16,.07)'); vg.addColorStop(1, 'rgba(30,24,16,.26)');
      c.fillStyle = vg; c.fillRect(-40, 0, W + 80, H);
      c.restore();
    },
  };
})();
