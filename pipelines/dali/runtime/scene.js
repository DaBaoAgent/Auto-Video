/* Auto-Video 自研画法脚本 · 超现实主义（Dali, 1930s 加泰罗尼亚海岸）
   场景：正午的荒原石台。一个人在薄布下午睡，石台边搁着一台正在融化的留声机，
        黄铜喇叭像布一样塌下来；一只怀表挂在石角上，表针慢慢爬；
        远处一头细长腿的大象走过，影子拖得很长；几只蚂蚁在沙上绕圈。
   一镜到底 10 秒：布随呼吸起伏，喇叭一寸寸瘫软，表针爬行、蜜滴下坠，蚂蚁移动，地平线在热浪里抖。
   全部由代码绘制，不使用任何外部图片。 */
SCENES['23_dali'] = (() => {
  const W = 1920, H = 1080, { clamp } = U, P = PAINT, TAU = Math.PI * 2;
  const C = { skyTop: '#12325f', skyMid: '#4a86a8', skyLow: '#a8cfd6', haze: '#e6ddc4', sand: '#d0913f', slab: '#d2ccbe', slabLo: '#8e8574', cloth: '#efe6d0', brass: '#c8932e' };
  const HZ = 470;

  function sky(c, lt, t) {
    const g = c.createLinearGradient(0, 0, 0, HZ + 40);
    g.addColorStop(0, C.skyTop); g.addColorStop(0.42, C.skyMid); g.addColorStop(0.86, C.skyLow); g.addColorStop(1, C.haze);
    c.fillStyle = g; c.fillRect(0, 0, W, HZ + 40);
    const r = U.rng(71);
    for (let k = 0; k < 12; k++) {
      const x = r() * W + Math.sin(t * 0.3 + k) * 18, y = 40 + r() * 240, w = 120 + r() * 300, hh = 8 + r() * 16;
      const cg = c.createRadialGradient(x, y, 2, x, y, w);
      cg.addColorStop(0, 'rgba(236,244,246,' + (0.10 + r() * 0.16) + ')'); cg.addColorStop(1, 'rgba(236,244,246,0)');
      c.save(); c.translate(x, y); c.scale(1, hh / w); c.fillStyle = cg; c.beginPath(); c.arc(0, 0, w, 0, TAU); c.fill(); c.restore();
    }
    const sx = 392, sy = HZ - 44;
    const sg = c.createRadialGradient(sx, sy, 4, sx, sy, 190);
    sg.addColorStop(0, 'rgba(255,246,210,.95)'); sg.addColorStop(0.18, 'rgba(255,232,160,.55)'); sg.addColorStop(1, 'rgba(255,226,150,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 190, 0, TAU); c.fill();
  }

  function land(c, lt, t) {
    const mesa = (x0, x1, top, col) => {
      c.fillStyle = col;
      c.beginPath(); c.moveTo(x0, HZ + 4); c.lineTo(x0 + (x1 - x0) * .12, top);
      c.lineTo(x1 - (x1 - x0) * .1, top + 6); c.lineTo(x1, HZ + 4); c.closePath(); c.fill();
    };
    mesa(120, 620, 372, '#a8663a');
    mesa(640, 900, 400, '#9c5c34');
    mesa(1260, 1860, 356, '#b07040');
    // 台地地层：每座台地各自裁剪，画完立刻 restore
    for (const [x0, x1, top] of [[120, 620, 372], [640, 900, 400], [1260, 1860, 356]]) {
      c.save();
      c.beginPath(); c.moveTo(x0, HZ + 4); c.lineTo(x0 + (x1 - x0) * .12, top);
      c.lineTo(x1 - (x1 - x0) * .1, top + 6); c.lineTo(x1, HZ + 4); c.closePath(); c.clip();
      for (let k = 0; k < 7; k++) {
        const y = top + 12 + k * 13;
        c.strokeStyle = 'rgba(90,50,26,' + (0.10 + k * 0.02) + ')'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x0 - 10, y); c.lineTo(x1 + 10, y + 4); c.stroke();
      }
      c.restore();
    }
    c.fillStyle = 'rgba(226,170,110,.35)';
    c.beginPath(); c.moveTo(1260, HZ); c.lineTo(1320, 356); c.lineTo(1500, 360); c.lineTo(1480, HZ); c.closePath(); c.fill();
    c.fillStyle = 'rgba(70,36,24,.35)';
    c.beginPath(); c.moveTo(560, HZ); c.lineTo(590, 376); c.lineTo(620, 372); c.lineTo(640, HZ); c.closePath(); c.fill();
    const hg = c.createLinearGradient(0, HZ - 110, 0, HZ + 30);
    hg.addColorStop(0, 'rgba(232,222,196,0)'); hg.addColorStop(0.75, 'rgba(232,222,196,.4)'); hg.addColorStop(1, 'rgba(232,222,196,.75)');
    c.fillStyle = hg; c.fillRect(0, HZ - 110, W, 140);
    const sg = c.createLinearGradient(0, HZ, 0, H);
    sg.addColorStop(0, '#d39a4c'); sg.addColorStop(0.35, C.sand); sg.addColorStop(1, '#a96a2c');
    c.fillStyle = sg; c.fillRect(0, HZ, W, H - HZ);
    const r = U.rng(33);
    for (let k = 0; k < 30; k++) {
      const u = Math.pow(r(), 0.7), y = HZ + 6 + u * 600;
      c.strokeStyle = 'rgba(150,90,40,' + (0.10 + r() * 0.18) + ')'; c.lineWidth = 1 + r() * 3;
      c.beginPath(); c.moveTo(-40, y);
      for (let x = 0; x < W + 60; x += 60) c.lineTo(x, y + Math.sin(x * 0.007 + k) * (2 + u * 8) + Math.sin(t * 0.8 + k) * 1.4);
      c.stroke();
    }
  }

  const SLAB = [[858, 726], [1398, 700], [1462, 796], [898, 826]];
  function slab(c, t) {
    const cg = c.createLinearGradient(0, 800, 0, 940);
    cg.addColorStop(0, 'rgba(70,38,20,.45)'); cg.addColorStop(1, 'rgba(70,38,20,0)');
    c.fillStyle = cg;
    c.beginPath(); c.moveTo(SLAB[3][0] - 30, 830); c.lineTo(SLAB[2][0] + 70, 800); c.lineTo(SLAB[2][0] + 120, 950); c.lineTo(SLAB[3][0] - 90, 930); c.closePath(); c.fill();
    c.fillStyle = 'rgba(70,38,20,.42)';
    c.beginPath(); c.moveTo(SLAB[3][0] + 40, SLAB[3][1] + 8); c.lineTo(SLAB[3][0] + 190, SLAB[3][1] + 44);
    c.lineTo(SLAB[3][0] + 150, 900); c.lineTo(SLAB[3][0] - 10, 880); c.closePath(); c.fill();
    c.fillStyle = C.slabLo;
    c.beginPath(); c.moveTo(SLAB[3][0], SLAB[3][1]); c.lineTo(SLAB[2][0], SLAB[2][1]);
    c.lineTo(SLAB[2][0], SLAB[2][1] + 46); c.lineTo(SLAB[3][0], SLAB[3][1] + 52); c.closePath(); c.fill();
    const g = c.createLinearGradient(SLAB[0][0], SLAB[0][1], SLAB[2][0], SLAB[2][1]);
    g.addColorStop(0, '#e2dbcb'); g.addColorStop(0.45, C.slab); g.addColorStop(1, '#b6ae9c');
    c.fillStyle = g;
    c.beginPath(); SLAB.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(90,78,62,.45)'; c.lineWidth = 2;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(940 + k * 26, 760 + k * 2); c.lineTo(1010 + k * 40, 742 - k * 6); c.lineTo(1090 + k * 30, 752); c.stroke(); }
    c.fillStyle = 'rgba(214,150,90,.22)';
    c.beginPath(); c.moveTo(1250, 706); c.lineTo(1400, 700); c.lineTo(1432, 760); c.lineTo(1280, 756); c.closePath(); c.fill();
  }

  function sleeper(c, lt, t) {
    const br = Math.sin(t * 1.1) * 2.4;                  // 呼吸
    const sx = 1180, sy = 716;                            // 身体中线
    // 胸腹起伏（浅麻布衬衫）
    const tg = c.createLinearGradient(1250, 690, 1330, 750);
    tg.addColorStop(0, '#f0e8d2'); tg.addColorStop(1, '#cdbf9e');
    c.fillStyle = tg;
    c.beginPath(); c.moveTo(1334, 700);
    c.quadraticCurveTo(1300, 688 - br, 1266, 694 - br);
    c.quadraticCurveTo(1236, 700 - br * .8, 1216, 706 - br * .5);
    c.lineTo(1216, 754); c.lineTo(1338, 744); c.closePath(); c.fill();
    // 衬衫的褶与领口
    c.strokeStyle = 'rgba(150,134,106,.55)'; c.lineWidth = 2;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(1244 + k * 26, 694 - br * .8); c.quadraticCurveTo(1256 + k * 26, 722, 1248 + k * 26, 750); c.stroke(); }
    c.strokeStyle = 'rgba(60,46,34,.6)'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(1318, 700); c.quadraticCurveTo(1310, 712, 1302, 722); c.stroke();
    // 薄毯只盖腿：起伏的布丘
    const bg2 = c.createLinearGradient(1078, 700, 1226, 770);
    bg2.addColorStop(0, '#f6efdb'); bg2.addColorStop(0.6, '#e8dfc8'); bg2.addColorStop(1, '#c9bda0');
    c.fillStyle = bg2;
    c.beginPath(); c.moveTo(1216, 700 - br * .4);
    c.quadraticCurveTo(1160, 686 - br * .8, 1112, 700);
    c.quadraticCurveTo(1078, 712, 1072, 740);
    c.quadraticCurveTo(1080, 758, 1110, 760);
    c.quadraticCurveTo(1160, 766, 1216, 754); c.closePath(); c.fill();
    // 毯褶：三道向膝头收
    c.strokeStyle = 'rgba(146,132,106,.5)'; c.lineWidth = 2.4;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(1102 + k * 28, 702 + k * 2); c.quadraticCurveTo(1128 + k * 28, 730, 1116 + k * 28, 758); c.stroke(); }
    // 膝头顶起的高光
    c.fillStyle = 'rgba(255,252,238,.6)';
    c.beginPath(); c.ellipse(1136, 706 - br * .9, 30, 14, -0.2, 0, TAU); c.fill();
    // 头：枕在弯起的臂上
    const hx0 = 1352, hy0 = 692 - br * 0.5;
    // 支撑臂（上臂从肩到手肘，前臂垫在头下）
    c.fillStyle = '#cfa274';
    c.beginPath(); c.moveTo(1296, 706); c.quadraticCurveTo(1322, 730, 1348, 726);
    c.lineTo(1348, 738); c.quadraticCurveTo(1310, 744, 1288, 720); c.closePath(); c.fill();
    c.fillStyle = '#d8b28c'; c.beginPath(); c.ellipse(1358, 716, 26, 15, 0.1, 0, TAU); c.fill();
    // 头
    c.fillStyle = '#dcb692'; c.beginPath(); c.ellipse(hx0 - 2, hy0 - 6, 46, 36, -0.2, 0, TAU); c.fill();
    // 头发：从后脑铺到耳后
    c.fillStyle = '#241a14';
    c.beginPath(); c.moveTo(hx0 - 50, hy0 - 4);
    c.quadraticCurveTo(hx0 - 34, hy0 - 44, hx0 + 6, hy0 - 38);
    c.quadraticCurveTo(hx0 + 26, hy0 - 28, hx0 + 16, hy0 - 8);
    c.quadraticCurveTo(hx0 - 12, hy0 - 24, hx0 - 50, hy0 - 4); c.fill();
    // 耳朵
    c.fillStyle = '#cfa274'; c.beginPath(); c.ellipse(hx0 - 30, hy0 + 2, 9, 12, -0.3, 0, TAU); c.fill();
    // 侧脸：额-鼻-唇-下巴
    c.strokeStyle = 'rgba(70,46,32,.85)'; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(hx0 + 6, hy0 - 22); c.quadraticCurveTo(hx0 + 24, hy0 - 16, hx0 + 30, hy0 - 2);
    c.quadraticCurveTo(hx0 + 34, hy0 + 8, hx0 + 26, hy0 + 12); c.stroke();
    // 闭着的眼＋眉
    c.strokeStyle = 'rgba(60,40,30,.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(hx0 + 10, hy0 - 10); c.quadraticCurveTo(hx0 + 20, hy0 - 6, hx0 + 26, hy0 - 9); c.stroke();
    c.beginPath(); c.moveTo(hx0 + 8, hy0 - 18); c.quadraticCurveTo(hx0 + 18, hy0 - 20, hx0 + 26, hy0 - 16); c.stroke();
    // 唇
    c.strokeStyle = 'rgba(150,70,56,.8)'; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(hx0 + 18, hy0 + 16); c.lineTo(hx0 + 30, hy0 + 13); c.stroke();
    // 毯下的暗影与被压出的轮廓
    const sg2 = c.createLinearGradient(0, 740, 0, 776);
    sg2.addColorStop(0, 'rgba(110,96,74,.0)'); sg2.addColorStop(1, 'rgba(110,96,74,.45)');
    c.fillStyle = sg2;
    c.beginPath(); c.moveTo(1074, 742); c.lineTo(1220, 756); c.lineTo(1216, 770); c.lineTo(1078, 760); c.closePath(); c.fill();
    // 露在毯子外的一只脚
    c.fillStyle = '#d8b28c';
    c.beginPath(); c.ellipse(1082, 750, 22, 12, -0.25, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(150,110,80,.5)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(1066, 754); c.lineTo(1092, 746); c.stroke();
    // 颈部与下颌阴影
    c.fillStyle = 'rgba(150,110,80,.45)';
    c.beginPath(); c.ellipse(1330, 710, 16, 8, -0.3, 0, TAU); c.fill();
    // 另一只手搭在毯上
    c.fillStyle = '#d8b28c'; c.beginPath(); c.ellipse(1244, 730, 22, 13, 0.3, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,80,50,.5)'; c.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(1236 + k * 6, 726); c.lineTo(1232 + k * 6, 738); c.stroke(); }
  }

  function gramophone(c, t) {
    const sag = Math.sin(t * 0.7) * 0.5 + 0.5;               // 0..1 瘫软度
    const bx = 986, by = 742;
    // 木箱与唱盘
    c.fillStyle = '#6a3f22'; c.beginPath(); c.moveTo(bx - 54, by - 24); c.lineTo(bx + 54, by - 30); c.lineTo(bx + 60, by + 22); c.lineTo(bx - 58, by + 26); c.closePath(); c.fill();
    c.fillStyle = '#8a5228'; c.beginPath(); c.moveTo(bx - 54, by - 24); c.lineTo(bx + 54, by - 30); c.lineTo(bx + 56, by - 8); c.lineTo(bx - 56, by - 2); c.closePath(); c.fill();
    c.fillStyle = '#2e261c'; c.beginPath(); c.ellipse(bx - 4, by - 26, 34, 11, -0.04, 0, TAU); c.fill();
    c.fillStyle = '#1d180f'; c.beginPath(); c.ellipse(bx - 4, by - 28, 26, 8, -0.04, 0, TAU); c.fill();
    // 喇叭：颈口小、口沿大，整根向下塌
    const nx = bx - 26, ny = by - 36;                        // 颈
    const rx0 = nx - 128, ry0 = ny + 44 + sag * 52;          // 口沿中心（随时间下垂）
    const rN = 8, rM = 52 + sag * 14;
    const ax = rx0 - nx, ay = ry0 - ny, L = Math.hypot(ax, ay), ux = ax / L, uy = ay / L, px = -uy, py = ux;
    const gr = c.createLinearGradient(nx, ny - 40, rx0, ry0 + 60);
    gr.addColorStop(0, '#e8cf82'); gr.addColorStop(0.42, C.brass); gr.addColorStop(1, '#8a5e18');
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(nx + px * rN, ny + py * rN);
    c.quadraticCurveTo(nx + ax * 0.55 + px * rM * 0.8, ny + ay * 0.4 + py * rM * 0.8, rx0 + px * rM, ry0 + py * rM);
    c.quadraticCurveTo(rx0 + ux * rM * 0.55, ry0 + uy * rM * 0.55, rx0 - px * rM, ry0 - py * rM);
    c.quadraticCurveTo(nx + ax * 0.55 - px * rM * 0.8, ny + ay * 0.4 - py * rM * 0.8, nx - px * rN, ny - py * rN);
    c.closePath(); c.fill();
    // 口沿外圈与暗内壁
    c.strokeStyle = 'rgba(255,232,160,.8)'; c.lineWidth = 4; c.stroke();
    c.save(); c.translate(rx0, ry0); c.rotate(Math.atan2(uy, ux));
    c.fillStyle = 'rgba(52,34,10,.92)'; c.beginPath(); c.ellipse(0, 0, rM * 0.26, rM, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(240,208,120,.7)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, rM * 0.26, rM, 0, 0, TAU); c.stroke();
    c.restore();
    // 融化的金属舌：从口沿垂下去，随时间更长
    // 口沿淌下的融金：一小段挂滴＋正下方一小滩
    c.fillStyle = '#a87a22';
    c.beginPath(); c.moveTo(rx0 - 12, ry0 + rM * 0.92);
    c.quadraticCurveTo(rx0 - 10 + Math.sin(t) * 3, ry0 + rM + 18, rx0 - 16, ry0 + rM + 30 + sag * 8);
    c.quadraticCurveTo(rx0 - 24, ry0 + rM + 14, rx0 - 22, ry0 + rM * 0.90); c.closePath(); c.fill();
    c.fillStyle = 'rgba(200,152,44,.92)';
    c.beginPath(); c.ellipse(rx0 - 16, ry0 + rM + 40, 20, 7, 0.04, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,228,150,.6)';
    c.beginPath(); c.ellipse(rx0 - 22, ry0 + rM + 37, 7, 2.6, 0.04, 0, TAU); c.fill();
  }

  function watch(c, t) {
    const cx = 1462, cy = 812, dr = Math.sin(t * 0.9) * 3;
    c.strokeStyle = '#8a7a4a'; c.lineWidth = 2.4;
    for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(1406 + k * 3.4, 786 - k * 2.6, 4, 0, TAU); c.stroke(); }
    const g = c.createLinearGradient(cx - 60, cy - 50, cx + 40, cy + 90);
    g.addColorStop(0, '#f0e4bc'); g.addColorStop(0.5, '#d8c892'); g.addColorStop(1, '#a89458');
    c.fillStyle = g;
    c.beginPath(); c.ellipse(cx, cy, 54, 50, 0.18, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(cx - 48, cy + 10);
    c.quadraticCurveTo(cx - 30, cy + 96 + dr, cx - 6, cy + 92 + dr);
    c.quadraticCurveTo(cx + 22, cy + 88 - dr, cx + 40, cy + 20); c.closePath(); c.fill();
    c.fillStyle = '#f6efd6'; c.beginPath(); c.ellipse(cx, cy - 2, 42, 39, 0.18, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(120,100,60,.7)'; c.lineWidth = 2; c.stroke();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + 0.18; c.beginPath(); c.moveTo(cx + Math.cos(a) * 33, cy - 2 + Math.sin(a) * 31); c.lineTo(cx + Math.cos(a) * 40, cy - 2 + Math.sin(a) * 37); c.stroke(); }
    const a1 = -1.2 + (t * 0.42) % TAU, a2 = 2.1 + (t * 0.11) % TAU;
    c.strokeStyle = '#4a3a22'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(cx, cy - 2); c.lineTo(cx + Math.cos(a1) * 30, cy - 2 + Math.sin(a1) * 28); c.stroke();
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx, cy - 2); c.lineTo(cx + Math.cos(a2) * 20, cy - 2 + Math.sin(a2) * 18); c.stroke();
    const dy = 24 + (t * 18) % 60;
    c.fillStyle = 'rgba(200,180,110,.85)';
    c.beginPath(); c.ellipse(cx - 6, cy + 92 + dr + dy, 5, 9, 0, 0, TAU); c.fill();
  }

  function ants(c, t) {
    for (let k = 0; k < 4; k++) {
      const ph = t * 0.35 + k * 1.7;
      const x = 700 + k * 56 + Math.sin(ph) * 26, y = 940 + k * 26 + Math.cos(ph * 1.3) * 12;
      const dir = Math.cos(ph) > 0 ? 1 : -1;
      c.fillStyle = '#2a1c12';
      for (let s = -1; s <= 1; s++) { c.beginPath(); c.ellipse(x + s * 8 * dir, y - Math.abs(s) * 2, 5.5 - Math.abs(s) * 1.4, 4, 0, 0, TAU); c.fill(); }
      c.strokeStyle = '#2a1c12'; c.lineWidth = 1.4;
      for (let s = 0; s < 3; s++) { const sx = x + (s - 1) * 7 * dir; c.beginPath(); c.moveTo(sx, y + 2); c.lineTo(sx - 6 * dir, y + 10 + s * 2); c.stroke(); }
    }
  }

  function elephant(c, t) {
    const ex = 560 + Math.sin(t * 0.16) * 30, ey = 556, sc = 1.25;
    const bob = Math.sin(t * 1.6) * 3;
    // 长影（日光低，影子拖向右下）
    c.fillStyle = 'rgba(80,44,24,.34)';
    c.beginPath(); c.moveTo(ex + 30, ey - 4); c.lineTo(ex + 620, ey + 150); c.lineTo(ex + 560, ey + 186); c.lineTo(ex - 10, ey + 8); c.closePath(); c.fill();
    // 四条细长腿（大腿-膝-小腿）
    c.strokeStyle = '#4a3628'; c.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const lx = ex - 60 + k * 40, lift = Math.sin(t * 1.5 + k * 1.4) * 7, sw = (k - 1.5) * 6;
      c.lineWidth = 11 * sc;
      c.beginPath(); c.moveTo(lx, ey - 34 + bob); c.lineTo(lx + sw, ey + 60 + lift); c.stroke();
      c.lineWidth = 8 * sc;
      c.beginPath(); c.moveTo(lx + sw, ey + 60 + lift); c.lineTo(lx + sw * 1.6, ey + 138 + lift); c.stroke();
      c.lineWidth = 10 * sc;
      c.beginPath(); c.moveTo(lx + sw * 1.6, ey + 138 + lift); c.lineTo(lx + sw * 1.6 + 18, ey + 142 + lift); c.stroke();
    }
    // 身体
    const g = c.createLinearGradient(ex - 90, ey - 100, ex + 90, ey);
    g.addColorStop(0, '#9a7a58'); g.addColorStop(0.5, '#6a4c36'); g.addColorStop(1, '#42301f');
    c.fillStyle = g; c.beginPath(); c.ellipse(ex, ey - 56 + bob, 88 * sc, 50 * sc, -0.05, 0, TAU); c.fill();
    // 头
    c.fillStyle = '#6a4c36'; c.beginPath(); c.ellipse(ex + 82, ey - 66 + bob, 40, 42, 0.16, 0, TAU); c.fill();
    // 大耳（扇动）
    const flap = Math.sin(t * 1.9) * 6;
    c.fillStyle = '#7e5c42'; c.beginPath();
    c.moveTo(ex + 58, ey - 96 + bob);
    c.quadraticCurveTo(ex + 34 + flap, ey - 60 + bob, ex + 66 + flap, ey - 18 + bob);
    c.quadraticCurveTo(ex + 84, ey - 50 + bob, ex + 58, ey - 96 + bob); c.fill();
    // 长鼻（垂下并摆动）
    c.strokeStyle = '#6a4c36'; c.lineWidth = 13 * sc; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ex + 108, ey - 44 + bob);
    c.bezierCurveTo(ex + 132, ey - 4 + bob, ex + 120, ey + 60 + bob, ex + 104 + Math.sin(t * 1.2) * 10, ey + 118 + bob); c.stroke();
    // 牙
    c.strokeStyle = '#e6dcc2'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(ex + 116, ey - 30 + bob); c.lineTo(ex + 146, ey + 6 + bob); c.stroke();
    // 眼
    c.fillStyle = '#20160e'; c.beginPath(); c.arc(ex + 98, ey - 74 + bob, 3.6, 0, TAU); c.fill();
  }

  function heat(c, t) {
    c.save();
    for (let k = 0; k < 9; k++) {
      const y = HZ + 4 + k * 7;
      c.strokeStyle = 'rgba(255,236,190,' + (0.10 - k * 0.008) + ')'; c.lineWidth = 2;
      c.beginPath();
      for (let x = 0; x <= W; x += 40) c.lineTo(x, y + Math.sin(x * 0.011 + t * 2.4 + k) * (2.6 + k * 0.4));
      c.stroke();
    }
    c.restore();
  }

  function grain(c) {
    const r = U.rng(404);
    c.save(); c.globalAlpha = 0.06; c.fillStyle = '#3a2c1e';
    for (let k = 0; k < 2400; k++) { const x = r() * W, y = r() * H; c.fillRect(x, y, 1.5, 1.5); }
    c.restore();
  }

  return {
    draw(c, lt, t) {
      sky(c, lt, t);
      land(c, lt, t);
      elephant(c, t);
      // 枯树与石块
      { const tx = 262, ty = 636, sway = Math.sin(t * 0.9) * 3;
        c.fillStyle = 'rgba(74,40,22,.30)';
        c.beginPath(); c.moveTo(tx + 6, ty); c.lineTo(tx + 330, ty + 74); c.lineTo(tx + 300, ty + 96); c.lineTo(tx - 16, ty + 14); c.closePath(); c.fill();
        c.strokeStyle = '#3a2a20'; c.lineWidth = 9; c.lineCap = 'round';
        c.beginPath(); c.moveTo(tx, ty + 4); c.quadraticCurveTo(tx + 14 + sway, ty - 80, tx + 6 + sway, ty - 168); c.stroke();
        c.lineWidth = 6;
        for (const [a, b, cc] of [[tx + 4, ty - 96, tx - 62 + sway, ty - 148], [tx + 8, ty - 128, tx + 78 + sway, ty - 176], [tx + 6 + sway, ty - 166, tx - 30 + sway, ty - 208]]) {
          c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo((a + cc) / 2 + 8, b - 34, cc, cc === undefined ? 0 : b - 30 + Math.abs(cc - a) * 0.12); c.stroke();
        }
        c.lineWidth = 3;
        for (let k = 0; k < 6; k++) { const bx2 = tx + 6 + k * 2 + sway; c.beginPath(); c.moveTo(bx2, ty - 150 + k * 4); c.lineTo(bx2 - 26 + k * 5, ty - 186 + k * 2); c.stroke(); }
        // 石头
        c.fillStyle = 'rgba(74,40,22,.28)';
        c.beginPath(); c.ellipse(1530, 986, 96, 20, 0, 0, TAU); c.fill();
        c.fillStyle = '#8a7458'; c.beginPath(); c.moveTo(1470, 962); c.quadraticCurveTo(1494, 918, 1538, 924); c.quadraticCurveTo(1576, 932, 1568, 966); c.lineTo(1470, 972); c.fill();
        c.fillStyle = '#6a5642'; c.beginPath(); c.moveTo(1538, 924); c.quadraticCurveTo(1576, 932, 1568, 966); c.lineTo(1530, 968); c.closePath(); c.fill();
        c.fillStyle = 'rgba(74,40,22,.25)';
        c.beginPath(); c.ellipse(1180, 1006, 64, 14, 0, 0, TAU); c.fill();
        c.fillStyle = '#7e6a54'; c.beginPath(); c.moveTo(1136, 992); c.quadraticCurveTo(1154, 960, 1188, 966); c.lineTo(1194, 996); c.closePath(); c.fill();
      }
      c.save(); c.translate(1180, 766); c.scale(1.30, 1.30); c.translate(-1180, -766);
      slab(c, t);
      sleeper(c, lt, t);
      gramophone(c, t);
      watch(c, t);
      c.restore();
      ants(c, t);
      heat(c, t);
      const vg = c.createLinearGradient(0, 0, W, H);
      vg.addColorStop(0, 'rgba(30,22,14,.16)'); vg.addColorStop(0.5, 'rgba(30,22,14,0)'); vg.addColorStop(1, 'rgba(255,210,140,.10)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
      grain(c);
    },
  };
})();
