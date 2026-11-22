/* Auto-Video 自研画法脚本 · 印象派（Impressionism）
   1874 塞纳河岸的午后：划艇从右侧划近岸边，船夫把一束花递上岸，撑阳伞的女士俯身接过。
   一镜到底 10 秒；日光、水光、草坡光斑、芦苇、花瓣全在动。
   管线：平涂底稿（天/远岸/水/草坡）→ 粗短笔触重画 → 前景物件与人物单独一层轻笔触
        → 复描结构线与五官 → 云、反光、光斑、水闪、花瓣。
   全部由代码绘制，不使用任何外部图片。 */
SCENES['08_impressionism'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const HZ = 468, SHORE = 900;
  const SUN = [1520, 96];
  const topY = (x) => HZ + Math.sin(x * .0035) * 3;

  const angle = (x, y) => {
    if (y < HZ) return 0.05 + 0.22 * P.noise(x * .006, y * .006 + 3) + 0.10 * P.noise(x * .002, y * .004 + 9);
    if (y < SHORE) return 0.02 + 0.10 * P.noise(x * .008, y * .02) - 0.02 * P.noise(x * .02, y * .01);
    return -0.45 + 0.6 * P.noise(x * .006, y * .006);
  };

  const SW = {
    sky: P.swatch(['#8ab8de', '#a8ccde', '#c8dde6', '#e8e2cc', '#f0e0c0', '#b8d2e0', '#dce6e6'], 0.40),
    cloud: P.swatch(['#fff8ec', '#f6eee0', '#ede2e4', '#fbead2', '#e6dce6'], 0.42),
    water: P.swatch(['#4e8ea6', '#6fa8bc', '#8cc0c0', '#367088', '#a0c8c0', '#d8dcc0', '#c0d4b8', '#5e98ae', '#b8d8d4'], 0.38),
    grass: P.swatch(['#8ab646', '#a4c454', '#6c9640', '#c8cc60', '#587f34', '#dccc68', '#e0d088', '#a8b04c'], 0.42),
  };

  const womanX = 1010, WOMAN_Y = 936, H_WOMAN = 306;
  const boatX = (lt) => lerp(1900, 1280, U.ease.out(clamp(lt / 7.0)));
  const boatY = (lt) => 862 + Math.sin(lt * 1.5 + 0.4) * 3.5;
  const bowX = (lt) => boatX(lt) - 178;
  const bouquetPos = (lt) => {
    if (lt < 6.9) return [bowX(lt) + 46, boatY(lt) - 66];
    if (lt < 8.5) return [bowX(lt) + 40 + (lt - 6.9) * 8, 800 + Math.sin(lt * 3) * 2];
    return [1046, 826 + Math.sin(lt * 2) * 2];
  };

  // ================= 背景：天 =================
  function drawSky(g, t) {
    const sg = g.createLinearGradient(0, 0, 0, HZ + 30);
    sg.addColorStop(0, '#6ea6d2'); sg.addColorStop(0.38, '#9cc4dc');
    sg.addColorStop(0.7, '#d4e2e2'); sg.addColorStop(1, '#f2e4c8');
    g.fillStyle = sg; g.fillRect(0, 0, W, HZ + 30);
    const sun = g.createRadialGradient(SUN[0], SUN[1], 20, SUN[0], SUN[1], 560);
    sun.addColorStop(0, 'rgba(255,246,206,.92)');
    sun.addColorStop(0.35, 'rgba(255,236,180,.38)');
    sun.addColorStop(1, 'rgba(255,232,170,0)');
    g.fillStyle = sun; g.fillRect(SUN[0] - 700, 0, 1400, 620);
    g.fillStyle = 'rgba(142,172,168,.26)'; g.beginPath(); g.moveTo(0, HZ);
    for (let x = 0; x <= 700; x += 30) g.lineTo(x, HZ - 14 - Math.abs(P.noise(x * .009, 2)) * 30);
    g.lineTo(700, HZ); g.closePath(); g.fill();
  }

  // ================= 背景：远岸 =================
  function drawFarBank(g, t) {
    const fg = g.createLinearGradient(0, HZ - 40, 0, HZ + 20);
    fg.addColorStop(0, '#7d9a54'); fg.addColorStop(1, '#4f7040');
    g.fillStyle = fg; g.beginPath(); g.moveTo(0, HZ - 34);
    for (let x = 0; x <= W; x += 60) g.lineTo(x, HZ - 34 + P.noise(x * .01, 7) * 16);
    g.lineTo(W, HZ + 14); g.lineTo(0, HZ + 14); g.closePath(); g.fill();
    const r = U.rng(29);
    for (let i = 0; i < 12; i++) {
      let x = 60 + r() * 1760; if (x > 700 && x < 1450) x = 700 - r() * 400;
      const hh = 18 + r() * 34, ww = 10 + r() * 26, sw = Math.sin(t * .9 + i) * 2;
      g.fillStyle = ['#2f5a34', '#3e6e38', '#4a7840', '#356036'][i % 4];
      g.beginPath(); g.ellipse(x + sw, HZ - 30 - hh * .5, ww, hh, 0, 0, 7); g.fill();
    }
    for (const [x, s] of [[180, 1], [288, .8], [392, 1.1], [520, .75]]) {
      g.fillStyle = '#f0e6d2'; g.fillRect(x - 30 * s, HZ - 30 - 26 * s, 60 * s, 30 * s);
      g.fillStyle = '#c0523c'; g.beginPath(); g.moveTo(x - 36 * s, HZ - 30 - 26 * s); g.lineTo(x, HZ - 30 - 46 * s); g.lineTo(x + 36 * s, HZ - 30 - 26 * s); g.closePath(); g.fill();
    }
    for (let k = 0; k < 4; k++) {
      const x = 1560 + k * 92, sw = Math.sin(t * 1.1 + k) * 3;
      g.fillStyle = '#5a7a3a'; g.fillRect(x - 3 + sw * .4, HZ - 84 - k * 8, 6, 60);
      g.fillStyle = '#6f8f3e'; g.beginPath(); g.ellipse(x + sw, HZ - 104 - k * 8, 18 - k, 46 + k * 4, 0.05, 0, 7); g.fill();
    }
  }

  // ================= 背景：水 =================
  function drawWater(g, t) {
    const wg = g.createLinearGradient(0, HZ, 0, SHORE);
    wg.addColorStop(0, '#9ec4c8'); wg.addColorStop(0.28, '#6fa4b8');
    wg.addColorStop(0.7, '#4e8aa2'); wg.addColorStop(1, '#5c96a4');
    g.fillStyle = wg; g.fillRect(0, HZ, W, SHORE - HZ);
    g.fillStyle = 'rgba(90,120,80,.30)'; g.fillRect(0, HZ, W, 22);
    const r = U.rng(43);
    for (let i = 0; i < 120; i++) {
      const y = HZ + 12 + r() * (SHORE - HZ - 10), x = SUN[0] + Math.sin(t * .9 + i) * 8 + (r() - .5) * 130 * (0.3 + (y - HZ) / (SHORE - HZ));
      const L = 10 + r() * 26, a = (0.22 + r() * .35) * (1 - (y - HZ) / (SHORE - HZ) * .35);
      g.strokeStyle = `rgba(255,248,214,${a})`; g.lineWidth = 3 + r() * 4;
      g.beginPath(); g.moveTo(x - L / 2, y); g.lineTo(x + L / 2, y + Math.sin(t * 2 + i) * 2); g.stroke();
    }
    for (let k = 0; k < 26; k++) {
      const y = HZ + 26 + k * 10.5, a = 0.10 + (k / 26) * 0.10;
      g.strokeStyle = `rgba(236,244,230,${a})`; g.lineWidth = 2 + k * .06;
      g.beginPath(); for (let x = 0; x <= W; x += 30) g.lineTo(x, y + Math.sin(x * .02 + k * .7 + t * 1.6) * 3); g.stroke();
    }
  }

  // ================= 背景：草坡 =================
  function bankY(x) { return SHORE + Math.sin(x * .005 + 1) * 5 + P.noise(x * .008, 5) * 7; }
  function drawBank(g, t) {
    const bg = g.createLinearGradient(0, SHORE - 10, 0, H);
    bg.addColorStop(0, '#a6ca60'); bg.addColorStop(0.35, '#8cb84c'); bg.addColorStop(1, '#4e7a34');
    g.fillStyle = bg; g.beginPath(); g.moveTo(0, bankY(0));
    for (let x = 0; x <= W; x += 30) g.lineTo(x, bankY(x));
    g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
    const r = U.rng(61);
    for (let x = 0; x < W; x += 6) {
      const y = bankY(x) + 2, hh = 8 + r() * 26, sw = Math.sin(t * 2 + x * .03) * 4;
      g.strokeStyle = r() < .45 ? '#6a9440' : '#8cb650'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y - 6); g.quadraticCurveTo(x + sw * .6, y - hh * .5, x + sw * 1.8, y - hh); g.stroke();
    }
    g.strokeStyle = 'rgba(244,250,236,.55)'; g.lineWidth = 4;
    g.beginPath(); for (let x = 0; x <= W; x += 30) g.lineTo(x, bankY(x) + 3); g.stroke();
    for (let i = 0; i < 520; i++) {
      const x = r() * W, y = SHORE + 8 + r() * 270, hh = 9 + r() * 30, sw = Math.sin(t * 2.2 + i) * 2.4;
      g.strokeStyle = r() < .5 ? '#5a8a38' : '#77a444'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw, y - hh * .6, x + sw * 1.5, y - hh); g.stroke();
    }
    for (let i = 0; i < 150; i++) {
      const x = r() * W, y = SHORE + 14 + r() * 250;
      g.fillStyle = ['#e83828', '#f8d040', '#ffffff', '#e06a88', '#8a6ac8'][i % 5];
      g.beginPath(); g.arc(x + Math.sin(t * 1.4 + i) * 2, y, 3 + r() * 3, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(232,226,142,.26)'; g.beginPath(); g.ellipse(1300, 970, 400, 92, -0.10, 0, 7); g.fill();
    g.fillStyle = 'rgba(50,92,48,.22)'; g.beginPath(); g.ellipse(520, 1040, 380, 76, 0.04, 0, 7); g.fill();
  }

  function shade(g, G) {
    const x0 = G.x - 0.24 * G.h, x1 = G.x + 0.26 * G.h;
    for (const p of G.parts) {
      if (p.line || !p.path) continue;
      if (!['skin', 'dress', 'skirt', 'shirt', 'trousers', 'hat', 'hair', 'coat', 'shoes'].includes(p.role)) continue;
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, 'rgba(58,36,62,.26)');
      gr.addColorStop(0.45, 'rgba(0,0,0,0)');
      gr.addColorStop(1, 'rgba(255,250,222,.22)');
      g.save(); g.clip(p.path); g.fillStyle = gr;
      g.fillRect(G.x - 0.3 * G.h, G.y - 1.1 * G.h, 0.62 * G.h, 1.25 * G.h); g.restore();
    }
  }

  function drawSailboat(g, t, x, y, s) {
    const bob = Math.sin(t * 1.3 + x) * 2;
    g.save(); g.translate(x, y + bob); g.scale(s, s);
    g.fillStyle = 'rgba(24,60,66,.30)'; g.beginPath(); g.ellipse(0, 8, 96, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#2f5e66'; g.beginPath(); g.moveTo(-86, 0); g.quadraticCurveTo(0, 16, 86, -2); g.lineTo(80, -14); g.quadraticCurveTo(0, 4, -78, -10); g.closePath(); g.fill();
    g.strokeStyle = '#c8a878'; g.lineWidth = 3; g.beginPath(); g.moveTo(-78, -10); g.quadraticCurveTo(0, 4, 80, -14); g.stroke();
    g.strokeStyle = '#6a5030'; g.lineWidth = 4; g.beginPath(); g.moveTo(6, -12); g.lineTo(6, -128); g.stroke();
    g.fillStyle = '#f6eedd'; g.beginPath(); g.moveTo(6, -126); g.quadraticCurveTo(-52, -96, -6, -42); g.lineTo(6, -42); g.closePath(); g.fill();
    g.fillStyle = '#e8dcc4'; g.beginPath(); g.moveTo(10, -118); g.quadraticCurveTo(56, -86, 12, -44); g.closePath(); g.fill();
    g.fillStyle = '#c84030'; g.beginPath(); g.moveTo(6, -126); g.lineTo(22, -121); g.lineTo(6, -114); g.closePath(); g.fill();
    g.restore();
  }

  function drawDucks(g, t, x, y, s) {
    for (const [dx, dy, ph] of [[0, 0, 0], [46, 12, 1.7]]) {
      const bob = Math.sin(t * 2.4 + ph) * 2;
      g.save(); g.translate(x + dx, y + dy + bob); g.scale(s * .7, s * .7);
      g.fillStyle = 'rgba(24,50,50,.18)'; g.beginPath(); g.ellipse(0, 8, 26, 6, 0, 0, 7); g.fill();
      g.fillStyle = '#e8e0c8'; g.beginPath(); g.ellipse(0, 0, 22, 12, 0, 0, 7); g.fill();
      g.fillStyle = '#8a7048'; g.beginPath(); g.ellipse(-2, -2, 14, 7, -0.1, 0, 7); g.fill();
      g.fillStyle = '#3f6a4a'; g.beginPath(); g.arc(-12, -14, 8, 0, 7); g.fill();
      g.fillStyle = '#e8e0c8'; g.beginPath(); g.ellipse(0, -8, 8, 6, 0, 0, 7); g.fill();
      g.fillStyle = '#f0c040'; g.beginPath(); g.moveTo(4, -15); g.lineTo(14, -12); g.lineTo(4, -9); g.closePath(); g.fill();
      g.fillStyle = '#2a2018'; g.beginPath(); g.arc(-15, -16, 2, 0, 7); g.fill();
      g.restore();
    }
  }

  // ================= 前景：划艇 =================
  function drawBoat(g, t, lt) {
    const cx = boatX(lt), cy = boatY(lt), pitch = Math.sin(lt * 1.15) * 0.022, roll = Math.sin(lt * 0.9 + 0.4) * 0.012;
    g.fillStyle = 'rgba(20,56,62,.38)'; g.beginPath(); g.ellipse(cx, cy + 6, 224, 18, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(242,250,240,.5)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(cx + 196, cy - 24); g.quadraticCurveTo(cx + 330, cy - 46, cx + 452, cy - 30); g.stroke();
    g.save(); g.translate(cx, cy); g.rotate(pitch); g.scale(1, 1 + roll * 2);
    // 外船体
    const hull = new Path2D();
    hull.moveTo(-218, -62); hull.quadraticCurveTo(-160, 30, -18, 48); hull.quadraticCurveTo(110, 44, 198, -14);
    hull.lineTo(198, -60); hull.quadraticCurveTo(120, -26, 0, -30); hull.quadraticCurveTo(-120, -28, -218, -62); hull.closePath();
    g.fillStyle = '#2a6068'; g.fill(hull);
    g.fillStyle = '#35707a'; g.beginPath();
    g.moveTo(-218, -62); g.quadraticCurveTo(-160, 30, -18, 48); g.quadraticCurveTo(40, 46, 70, 40);
    g.lineTo(70, 4); g.quadraticCurveTo(20, 26, -60, 22); g.quadraticCurveTo(-160, 8, -206, -56); g.closePath(); g.fill();
    // 内舱
    g.fillStyle = '#1c444a'; g.beginPath();
    g.moveTo(-196, -58); g.quadraticCurveTo(-120, -22, 0, -26); g.quadraticCurveTo(110, -22, 180, -56);
    g.quadraticCurveTo(120, -14, 0, -12); g.quadraticCurveTo(-120, -16, -196, -58); g.closePath(); g.fill();
    // 舱底木板
    g.strokeStyle = 'rgba(150,196,196,.30)'; g.lineWidth = 3;
    for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-160 + k * 8, -30 + k * 4); g.quadraticCurveTo(0, -6 + k * 3, 160 - k * 6, -34 + k * 3); g.stroke(); }
    // 舷缘
    g.strokeStyle = '#d0a05c'; g.lineWidth = 13;
    g.beginPath(); g.moveTo(-218, -62); g.quadraticCurveTo(-120, -26, 0, -30); g.quadraticCurveTo(120, -26, 198, -60); g.stroke();
    g.strokeStyle = '#f0daa8'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-218, -66); g.quadraticCurveTo(-120, -30, 0, -34); g.quadraticCurveTo(120, -30, 198, -64); g.stroke();
    // 船头靠垫与花篮
    g.fillStyle = '#c84030'; g.beginPath(); g.ellipse(-150, -54, 30, 9, -0.15, 0, 7); g.fill();
    g.fillStyle = '#8a6a44'; g.beginPath(); g.ellipse(-96, -50, 34, 9, 0, 0, 7); g.fill();
    // 桨
    const stroke = Math.sin(lt * 3.2);
    for (const [px, dir] of [[-118, -1], [116, 1]]) {
      g.save(); g.translate(px, -40); g.rotate(0.18 * stroke * dir);
      g.strokeStyle = '#c09458'; g.lineWidth = 8; g.beginPath(); g.moveTo(-dir * 20, 8); g.lineTo(dir * 168, 34); g.stroke();
      g.fillStyle = '#b08248'; g.beginPath(); g.ellipse(dir * 176, 38, 30, 11, dir * 0.12, 0, 7); g.fill();
      g.strokeStyle = 'rgba(240,238,220,.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(dir * 176, 38, 30, 11, dir * 0.12, 0, 7); g.stroke();
      g.restore();
    }
    if (Math.abs(stroke) > 0.55) {
      g.fillStyle = 'rgba(246,252,246,.85)';
      for (let k = 0; k < 10; k++) { const h = U.hash(k, (lt * 26) | 0), x = -120 + (k - 5) * 15 + stroke * 26, y = 20 + h * 18; g.beginPath(); g.arc(x, y, 2 + h * 4.5, 0, 7); g.fill(); }
    }
    g.restore();
  }

  function drawRower(g, cx, cy, lt) {
    const hands = Math.sin(lt * 3.2);
    const G = FIG.build({ x: cx - 16, y: cy - 14, h: 190, face: -1, armFront: true,
      hipUp: 0.36, thighL: 1.30, shinL: -1.62, footL: 0.34, thighR: 1.18, shinR: -1.52, footR: 0.34,
      lean: 0.16 + hands * 0.05, head: 0.02,
      handR: [cx + 92, cy - 34 + hands * 8], handL: [cx - 98, cy - 32 - hands * 8],
      hair: 'short', hat: 'boater', bottom: 'trousers', top: 'shirt', sleeve: true });
    FIG.draw(g, G, PAL_ROWER);
    shade(g, G);

    stripeShirt(g, G, '#3a6ab0');
    const neck = G.J.neck; g.fillStyle = '#c84030'; g.beginPath(); g.arc(neck[0], neck[1] + 6, 11, 0.2, Math.PI - 0.2); g.fill();
  }

  function stripeShirt(g, G, blue) {
    const torso = G.parts.find(p => p.name === 'torso'); if (!torso) return;
    g.save(); g.clip(torso.path);
    const x0 = G.x - 0.17 * G.h, y0 = G.y - 0.86 * G.h, w = 0.34 * G.h, hh = 0.44 * G.h;
    for (let k = 0; k < 8; k++) {
      g.fillStyle = k % 2 ? 'rgba(248,248,240,.9)' : 'rgba(40,80,150,.85)';
      g.fillRect(x0, y0 + k * hh / 8, w, hh / 8);
    }
    g.restore();
    for (const nm of ['upperArm0', 'upperArm1']) { const q = G.parts.find(p => p.name === nm); if (q) { g.fillStyle = blue; g.fill(q.path); } }
  }

  function paintArms(g, G, pal) {
    const h = G.h, skin = pal.skin || '#e8bd9c', sleeve = pal.sleeve && pal.sleeve !== '#f8f2e8' ? pal.sleeve : null;
    const lwU = 0.052 * h, lwF = 0.034 * h;
    const seg = (a, b, w, col) => {
      g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    };
    const lineC = 'rgba(104,70,50,.55)';
    for (const [sh, el, hd] of [[G.J.shoulderL, G.J.elbowF, G.J.handF], [G.J.shoulderR, G.J.elbowN, G.J.handN]]) {
      if (!sh || !el || !hd) continue;
      g.lineCap = 'round'; g.lineJoin = 'round';
      seg(sh, el, lwU + 3, lineC);
      seg(el, hd, lwF + 3, lineC);
      if (sleeve) seg(sh, el, lwU, sleeve);
      seg(sh, el, lwU, skin);
      seg(el, hd, lwF, skin);
      // 暗面
      g.strokeStyle = 'rgba(120,72,56,.20)'; g.lineWidth = lwF * 0.45;
      g.beginPath(); g.moveTo(el[0] - 3, el[1] + 1); g.lineTo(hd[0] - 3, hd[1] + 1); g.stroke();
      g.fillStyle = skin; g.beginPath(); g.ellipse(hd[0], hd[1], 0.026 * h, 0.020 * h, Math.atan2(hd[1] - el[1], hd[0] - el[0]), 0, 7); g.fill();
      g.strokeStyle = lineC; g.lineWidth = 2; g.beginPath(); g.ellipse(hd[0], hd[1], 0.026 * h, 0.020 * h, Math.atan2(hd[1] - el[1], hd[0] - el[0]), 0, 7); g.stroke();
    }
  }

  // ================= 前景：女士 =================
  function drawWoman(g, t, lt) {
    const x = womanX, y = WOMAN_Y, h = H_WOMAN;
    const bend = lt > 8.4 ? 0.06 : 0.02;
    const bp = bouquetPos(lt);
    const handL = lt > 8.3 ? bp : [x + 0.03 * h, y - 0.40 * h];
    const G = FIG.build({ x, y, h, face: 1, armFront: true, ...FIG.pose('idle', lt * .6), lean: bend,
      handL, handR: [x - 0.02 * h, y - 0.62 * h],
      hair: 'long', hat: 'straw', bottom: 'dress', top: 'shirt', sleeve: false, hemW: 0.17, sway: t });
    FIG.draw(g, G, PAL_WOMAN);
    shade(g, G);

    const w = G.J.waist; g.fillStyle = '#3f5fc0'; g.fillRect(w[0] - 0.08 * h, w[1] - 7, 0.16 * h, 14);
    g.beginPath(); g.moveTo(w[0], w[1]); g.quadraticCurveTo(w[0] - 0.05 * h, w[1] + 0.07 * h + Math.sin(t * 4) * 8, w[0] - 0.02 * h, w[1] + 0.19 * h); g.lineTo(w[0] + 0.02 * h, w[1] + 0.17 * h); g.quadraticCurveTo(w[0] + 0.01 * h, w[1] + 0.07 * h, w[0] + 0.03 * h, w[1]); g.closePath(); g.fill();
    for (let k = -2; k <= 2; k++) {
      g.strokeStyle = 'rgba(120,120,180,.30)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(w[0] + k * 20, w[1] + 12); g.quadraticCurveTo(w[0] + k * 36 + Math.sin(t * 1.6 + k) * 9, y - 0.18 * h, w[0] + k * 50 + Math.sin(t * 1.6 + k) * 13, y - 4); g.stroke();
    }
    for (let k = 0; k < 7; k++) {
      const xx = x - 0.13 * h + k * 0.043 * h;
      g.strokeStyle = 'rgba(150,140,190,.34)'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(xx, w[1] + 0.16 * h); g.quadraticCurveTo(xx + Math.sin(t * 1.8 + k) * 6, y - 0.14 * h, xx + Math.sin(t * 1.8 + k) * 9, y - 3); g.stroke();
    }
    return G;
  }

  function drawParasol(g, x, y, h, t) {
    const hand = [x + 0.07 * h, y - 0.45 * h];
    const top = [x - 0.16 * h, y - 1.10 * h];
    const tilt = -0.16 + Math.sin(t * 1.2) * 0.03, R = 0.195 * h;
    g.strokeStyle = '#7a5a34'; g.lineWidth = 6; g.beginPath(); g.moveTo(hand[0], hand[1] + 20); g.lineTo(top[0], top[1]); g.stroke();
    g.save(); g.translate(top[0], top[1]); g.rotate(tilt);
    for (let k = 0; k < 8; k++) {
      const a0 = Math.PI + k / 8 * Math.PI, a1 = Math.PI + (k + 1) / 8 * Math.PI;
      g.fillStyle = k % 2 ? '#f8efe4' : '#f0c0bc';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a0) * R, Math.sin(a0) * R * 0.60); g.quadraticCurveTo(Math.cos((a0 + a1) / 2) * R * 1.05, Math.sin((a0 + a1) / 2) * R * 0.60 + 12, Math.cos(a1) * R, Math.sin(a1) * R * 0.60); g.closePath(); g.fill();
    }
    g.strokeStyle = 'rgba(120,90,70,.40)'; g.lineWidth = 2;
    for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R, Math.sin(a) * R * 0.60); g.stroke(); }
    g.strokeStyle = '#cf9e74'; g.lineWidth = 4; g.beginPath(); for (let k = 0; k <= 16; k++) { const a = Math.PI + k / 16 * Math.PI; g.lineTo(Math.cos(a) * R, Math.sin(a) * R * 0.60); } g.stroke();
    g.fillStyle = '#c8a060'; g.beginPath(); g.arc(0, -5, 6, 0, 7); g.fill();
    g.restore();
  }

  function drawBouquet(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#f4e8d4'; g.beginPath(); g.moveTo(-13, 4); g.lineTo(15, 4); g.lineTo(7, 56); g.lineTo(-5, 56); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(160,130,90,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-9, 18); g.lineTo(9, 20); g.stroke();
    for (let k = 0; k < 13; k++) {
      const a = -2.4 + k * 0.20, rr = 20 + (k % 3) * 8;
      const bx = Math.cos(a) * rr, by = -10 + Math.sin(a) * rr * 0.72;
      g.strokeStyle = '#4a7a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(bx * .4, -2, bx, by); g.stroke();
      g.fillStyle = ['#e83828', '#f8b040', '#ffffff', '#e86a88', '#c84a70', '#9a6ac8'][k % 6];
      g.beginPath(); g.arc(bx, by, 7 + (k % 2) * 2 + Math.sin(t * 3 + k) * .6, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,242,206,.7)'; g.beginPath(); g.arc(bx - 2, by - 2, 3, 0, 7); g.fill();
    }
    g.restore();
  }

  // ================= 前景：野餐布与道具 =================
  function drawBlanket(g, t) {
    const q = [[1370, 1002], [1900, 986], [1920, 1080], [1400, 1080]];
    // 布下阴影
    g.fillStyle = 'rgba(44,80,40,.28)'; g.beginPath(); g.ellipse(1620, 1040, 280, 40, 0, 0, 7); g.fill();
    g.fillStyle = '#f4e9d8';
    g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[1]); g.lineTo(...q[2]); g.lineTo(...q[3]); g.closePath(); g.fill();
    // 红条边
    g.strokeStyle = 'rgba(186,68,58,.7)'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(q[0][0] + 16, q[0][1] + 8); g.lineTo(q[1][0] - 16, q[1][1] + 8); g.stroke();
    g.beginPath(); g.moveTo(q[3][0] + 16, q[3][1] - 8); g.lineTo(q[2][0] - 16, q[2][1] - 8); g.stroke();
    // 褶
    g.strokeStyle = 'rgba(150,120,96,.35)'; g.lineWidth = 4;
    for (let k = 0; k < 3; k++) {
      const x = 1400 + k * 120;
      g.beginPath(); g.moveTo(x, 890 + k * 2); g.quadraticCurveTo(x + 30 + Math.sin(t + k) * 3, 930, x + 6, 962 - k * 3); g.stroke();
    }
    g.fillStyle = 'rgba(255,252,244,.45)';
    g.beginPath(); g.moveTo(1310, 900); g.lineTo(1440, 896); g.lineTo(1430, 920); g.lineTo(1300, 924); g.closePath(); g.fill();
    // 草叶压住布边
    g.strokeStyle = 'rgba(88,128,48,.6)'; g.lineWidth = 2;
    for (let k = 0; k < 26; k++) { const x = 1300 + k * 18; g.beginPath(); g.moveTo(x, 958 + Math.sin(k) * 3); g.lineTo(x + 5, 946 + Math.sin(k * 2) * 4); g.stroke(); }
  }

  function drawProps(g, t) {
    // 藤篮（左）
    g.fillStyle = '#c9a468'; g.beginPath(); g.ellipse(1352, 982, 54, 20, -0.05, 0, 7); g.fill();
    g.fillStyle = '#ae8850'; g.beginPath(); g.moveTo(1302, 978); g.quadraticCurveTo(1294, 958, 1318, 1026); g.lineTo(1388, 1024); g.quadraticCurveTo(1412, 952, 1404, 916); g.closePath(); g.fill();
    g.strokeStyle = '#8a6838'; g.lineWidth = 2.6;
    for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(1306 + k * 20, 922); g.lineTo(1310 + k * 20, 962); g.stroke(); }
    g.strokeStyle = '#a88450'; g.lineWidth = 5; g.beginPath(); g.arc(1352, 968, 38, Math.PI * 1.05, -0.05); g.stroke();
    // 法棍
    g.save(); g.translate(1372, 962); g.rotate(-0.42); g.fillStyle = '#e2bc7c'; g.beginPath(); g.roundRect(-10, -40, 20, 74, 9); g.fill();
    g.strokeStyle = '#c09250'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-8, -28 + k * 16); g.lineTo(8, -34 + k * 16); g.stroke(); } g.restore();
    // 酒瓶
    g.fillStyle = '#2f5a3a'; g.beginPath(); g.roundRect(1482, 954, 26, 66, 8); g.fill();
    g.fillStyle = '#24462c'; g.fillRect(1490, 922, 10, 36);
    g.fillStyle = '#d8c8a8'; g.fillRect(1486, 982, 18, 20);
    g.fillStyle = '#8a2a22'; g.fillRect(1498, 934, 12, 6);
    // 两只杯
    for (const [x, y] of [[1436, 996], [1464, 1000]]) {
      g.fillStyle = 'rgba(238,244,230,.55)'; g.beginPath(); g.moveTo(x - 9, y - 24); g.quadraticCurveTo(x - 13, y, x - 4, y); g.lineTo(x + 4, y); g.quadraticCurveTo(x + 13, y, x + 9, y - 24); g.closePath(); g.fill();
      g.strokeStyle = '#c8d8c0'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 18); g.stroke();
      g.fillStyle = 'rgba(190,60,52,.45)'; g.beginPath(); g.ellipse(x, y - 8, 7, 5, 0, 0, 7); g.fill();
    }
    // 草帽（右）
    g.save(); g.translate(1660, 988); g.rotate(0.10);
    g.fillStyle = 'rgba(60,84,40,.25)'; g.beginPath(); g.ellipse(2, 6, 70, 18, 0, 0, 7); g.fill();
    g.fillStyle = '#e6c886'; g.beginPath(); g.ellipse(0, 0, 70, 22, 0, 0, 7); g.fill();
    g.fillStyle = '#d2b06c'; g.beginPath(); g.ellipse(0, -8, 36, 20, 0, Math.PI, 0); g.fill();
    g.strokeStyle = '#3f5fc0'; g.lineWidth = 7; g.beginPath(); g.ellipse(0, -6, 37, 14, 0, Math.PI * 1.02, -0.05); g.stroke();
    g.restore();
    // 苹果与花
    for (const [x, y, c] of [[1580, 994, '#c84a3a'], [1604, 1000, '#d8a04a'], [1560, 1004, '#b84232']]) {
      g.fillStyle = c; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,240,210,.4)'; g.beginPath(); g.arc(x - 4, y - 4, 4, 0, 7); g.fill();
    }
    for (let i = 0; i < 8; i++) {
      const x = 1700 + (i * 29) % 60, y = 1000 + (i * 17) % 18;
      g.fillStyle = ['#e84838', '#f8b040', '#ffffff', '#e07090'][i % 4];
      g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill();
    }
  }

  function drawCat(g, x, y, s, t, lt) {
    const walk = lt > 8.4 && lt < 9.7, ph = (lt * 2.1) % 1;
    const bob = walk ? Math.abs(Math.sin(ph * Math.PI * 2)) * 2 : Math.sin(t * 2) * 1;
    g.save(); g.translate(x, y - bob); g.scale(s, s);
    g.fillStyle = '#e8923e'; g.beginPath(); g.ellipse(0, -34, 40, 24, 0, 0, 7); g.fill();
    g.fillStyle = '#f6e6d0'; g.beginPath(); g.ellipse(10, -28, 20, 18, 0, 0, 7); g.fill();
    g.fillStyle = '#e8923e';
    for (let k = 0; k < 4; k++) { const lx = -22 + k * 14 + (walk ? Math.sin(ph * 6.28 + k * 1.6) * 6 : 0), ly = -16; g.beginPath(); g.roundRect(lx - 3, ly, 6, 18, 3); g.fill(); }
    g.beginPath(); g.arc(-28, -58, 22, 0, 7); g.fill();
    for (const d of [-1, 1]) { g.beginPath(); g.moveTo(-28 + d * 13, -74); g.lineTo(-28 + d * 20, -94); g.lineTo(-28 + d * 6, -82); g.closePath(); g.fill(); }
    g.strokeStyle = '#c8702a'; g.lineWidth = 3;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 12, -50); g.quadraticCurveTo(k * 12 + 4, -36, k * 12 + 8, -26); g.stroke(); }
    g.fillStyle = '#8ac060'; g.beginPath(); g.arc(-37, -62, 4, 0, 7); g.fill(); g.beginPath(); g.arc(-25, -63, 4, 0, 7); g.fill();
    g.fillStyle = '#2a2018'; g.beginPath(); g.arc(-37, -62, 1.6, 0, 7); g.fill(); g.beginPath(); g.arc(-25, -63, 1.6, 0, 7); g.fill();
    g.fillStyle = '#d87878'; g.beginPath(); g.arc(-31, -54, 3, 0, 7); g.fill();
    g.strokeStyle = '#e8923e'; g.lineWidth = 7; g.beginPath(); g.moveTo(36, -30); g.quadraticCurveTo(64 + Math.sin(t * 3) * 10, -46, 58 + Math.sin(t * 3) * 16, -74); g.stroke();
    g.restore();
  }

  function face(g, G, col, blush) {
    const hd = G.J.headC, rx = G.hrx, ry = G.hry, face = G.face;
    g.save(); g.lineCap = 'round';
    // 眼窝淡影
    g.fillStyle = 'rgba(150,96,80,.16)'; g.beginPath(); g.ellipse(hd[0] + face * rx * .40, hd[1] - ry * .03, rx * .26, ry * .16, 0, 0, 7); g.fill();
    // 眼
    g.fillStyle = '#f6ece2'; g.beginPath(); g.ellipse(hd[0] + face * rx * .41, hd[1] - ry * .02, rx * .15, ry * .09, 0, 0, 7); g.fill();
    g.fillStyle = '#3a2c24'; g.beginPath(); g.ellipse(hd[0] + face * rx * .44, hd[1] - ry * .02, rx * .075, ry * .075, 0, 0, 7); g.fill();
    // 眉
    g.strokeStyle = 'rgba(96,68,48,.75)'; g.lineWidth = Math.max(1.6, G.h * .006);
    g.beginPath(); g.moveTo(hd[0] + face * rx * .22, hd[1] - ry * .20); g.quadraticCurveTo(hd[0] + face * rx * .44, hd[1] - ry * .27, hd[0] + face * rx * .62, hd[1] - ry * .18); g.stroke();
    // 鼻
    g.strokeStyle = 'rgba(176,118,94,.65)'; g.lineWidth = Math.max(1.4, G.h * .005);
    g.beginPath(); g.moveTo(hd[0] + face * rx * .70, hd[1] - ry * .06); g.quadraticCurveTo(hd[0] + face * rx * .80, hd[1] + ry * .12, hd[0] + face * rx * .66, hd[1] + ry * .16); g.stroke();
    // 唇
    g.strokeStyle = '#c06a62'; g.lineWidth = Math.max(2, G.h * .007);
    g.beginPath(); g.moveTo(hd[0] + face * rx * .30, hd[1] + ry * .44); g.quadraticCurveTo(hd[0] + face * rx * .44, hd[1] + ry * .52, hd[0] + face * rx * .58, hd[1] + ry * .42); g.stroke();
    g.fillStyle = 'rgba(200,120,110,.22)'; g.beginPath(); g.ellipse(hd[0] + face * rx * .48, hd[1] + ry * .47, rx * .15, ry * .06, 0, 0, 7); g.fill();
    if (blush) { g.fillStyle = 'rgba(216,116,108,.26)'; g.beginPath(); g.ellipse(hd[0] + face * rx * .24, hd[1] + ry * .22, rx * .22, ry * .11, 0, 0, 7); g.fill(); }
    // 下颌／颈部投影
    g.fillStyle = 'rgba(168,108,84,.14)'; g.beginPath(); g.ellipse(hd[0] + face * rx * .16, hd[1] + ry * .88, rx * .40, ry * .14, 0.2, 0, 7); g.fill();
    g.restore();
  }

  const PAL_WOMAN = { features: false, lw: 2.0, line: 'rgba(118,82,58,.5)', skin: '#eec9ad', hair: '#e0b85a', shirt: '#f4ece2', sleeve: '#efe6da', dress: '#f6efe6', skirt: '#f6efe6', shoes: '#c8a878', hat: '#e6cc90', hatBand: null, hem: '#dcd0e4', belt: '#3f5fc0', lw: 0, blush: 'rgba(230,130,120,.35)' };
  const PAL_ROWER = { features: false, lw: 2.0, line: 'rgba(78,56,40,.55)', skin: '#d8a074', hair: '#3a2a1c', shirt: '#e8eef4', sleeve: '#3a6ab0', trousers: '#3a4a64', shoes: '#3a2c20', belt: '#8a5a30', hat: '#d8b878', hatBand: '#b03a2a', lw: 0 };

  function fgStrokes(g, src) {
    const sd = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const cell = 7;
    g.save(); g.globalCompositeOperation = 'source-atop'; g.lineCap = 'round';
    for (let j = 0; j < H / cell; j++) for (let i = 0; i < W / cell; i++) {
      const hx = U.hash(i, j), hy = U.hash(j + 7919, i), X = (i + hx) * cell, Y = (j + hy) * cell, k = ((Y | 0) * W + (X | 0)) * 4;
      if (X > W - 1 || Y > H - 1 || sd[k + 3] < 170) continue;
      const h3 = U.hash(i + 31, j + 17), h4 = U.hash(i + 97, j + 53), ang = -0.42 + 0.84 * (h4 - .5), L = 12 * (0.7 + h4 * 0.6);
      const col = [sd[k] + (h3 - .5) * 26, sd[k + 1] + (h4 - .5) * 18, sd[k + 2] - (h3 - .5) * 16];
      g.strokeStyle = P.rgb(col); g.lineWidth = 5.0;
      g.beginPath(); g.moveTo(X - Math.cos(ang) * L / 2, Y - Math.sin(ang) * L / 2); g.lineTo(X + Math.cos(ang) * L / 2, Y + Math.sin(ang) * L / 2); g.stroke();
    }
    g.restore();
  }

  // ================= 云（笔触后叠） =================
  function clouds(c, t) {
    const r = U.rng(9);
    c.save(); c.globalAlpha = .92;
    for (const [bx, by, rw, rh, sp] of [[300, 130, 240, 54, .06], [980, 96, 300, 62, .05], [1560, 180, 210, 44, .07]]) {
      const dx = Math.sin(t * sp + bx) * 22;
      for (let k = 0; k < 26; k++) {
        const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 0.9;
        const x = bx + dx + Math.cos(a) * rw * rr, y = by + Math.sin(a) * rh * rr;
        c.fillStyle = r() < .55 ? 'rgba(255,248,236,.9)' : r() < .8 ? 'rgba(246,235,225,.8)' : 'rgba(226,216,230,.7)';
        c.beginPath(); c.ellipse(x, y, 40 + r() * 40, 14 + r() * 10, r() * .3 - .15, 0, 7); c.fill();
      }
    }
    c.restore();
  }

  function waterGlints(c, t) {
    const r = U.rng(19); c.save(); c.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const x = r() * W, y = HZ + 14 + r() * (SHORE - HZ - 20);
      const a = Math.max(0, Math.sin(t * (1.2 + r() * 1.4) + i * 1.3));
      if (a < 0.3) continue;
      const L = 8 + r() * 24;
      c.strokeStyle = `rgba(255,250,224,${0.5 * a})`; c.lineWidth = 2 + r() * 2.5;
      c.beginPath(); c.moveTo(x - L / 2, y); c.lineTo(x + L / 2, y + Math.sin(t * 2 + i) * 2); c.stroke();
    }
    c.restore();
  }

  function sunSpots(c, t) {
    const r = U.rng(7); c.save(); c.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = 780 + r() * 1100, y = SHORE + 26 + r() * 230, rx = 34 + r() * 76, ry = 9 + r() * 16, ph = r() * 6, sp = 4 + r() * 5;
      const a = clamp(0.5 + 0.5 * Math.sin(t * sp + ph) * Math.sin(t * sp * .57 + ph * 2) - .18) * 0.68;
      if (a < 0.05) continue;
      for (let k = 0; k < 22; k++) {
        const u = r() * 2 - 1, v = r() * 2 - 1; if (u * u + v * v > 1) continue;
        const xx = x + u * rx, yy = y + v * ry;
        c.strokeStyle = `rgba(255,246,190,${a})`; c.lineWidth = 5 + r() * 4;
        c.beginPath(); c.moveTo(xx - 8, yy + 2); c.lineTo(xx + 8, yy - 2); c.stroke();
      }
    }
    c.restore();
  }

  function petals(c, t) {
    const r = U.rng(33); c.save();
    for (let i = 0; i < 22; i++) {
      const bx = r() * W, by = 240 + r() * 640, sp = 8 + r() * 16, ph = r() * 6;
      const x = bx + Math.sin(t * 1.3 + ph) * 36, y = by + ((t * sp + ph * 60) % 280) - 140;
      const a = Math.max(0, Math.sin(t * 4 + ph)); if (a < .4) continue;
      c.fillStyle = r() < .6 ? `rgba(255,250,240,${.7 * a})` : `rgba(240,120,120,${.6 * a})`;
      c.beginPath(); c.ellipse(x, y, 4 + r() * 3, 2 + r() * 2, t * .8 + ph, 0, 7); c.fill();
    }
    c.restore();
  }

  // ================= 主绘制 =================
  return {
    draw(c, lt, t) {
      const b = P.scratch('impBase'), bg = b.getContext('2d', { willReadFrequently: true });
      bg.clearRect(0, 0, W, H);
      drawSky(bg, t); drawWater(bg, t); drawBank(bg, t);

      c.fillStyle = '#f2e6da'; c.fillRect(0, 0, W, H);
      const skyPal = (x, y, col, r) => y < HZ ? SW.sky(col, r) : SW.cloud(col, r);
      const waterPal = (x, y, col, r) => SW.water(col, r);
      const grassPal = (x, y, col, r) => SW.grass(col, r);
      P.strokes(c, b, { cell: 12, len: 34, width: 11, angle, seed: 11, t, boil: 0, outline: 0.55, outlineMix: 0.35, jitterCol: 30, palette: skyPal, mask: (x, y) => y < topY(x) });
      P.strokes(c, b, { cell: 11, len: 30, width: 9, angle: (x,y)=>0.01+0.06*P.noise(x*.01,y*.01), seed: 13, t, boil: 0, outline: 0.45, outlineMix: 0.3, jitterCol: 32, palette: waterPal, mask: (x, y) => y >= topY(x) && y < bankY(x) });
      P.strokes(c, b, { cell: 10, len: 24, width: 8, angle, seed: 15, t, boil: 0, outline: 0.5, outlineMix: 0.38, jitterCol: 36, palette: grassPal, mask: (x, y) => y >= bankY(x) });
      P.strokes(c, b, { cell: 7.5, len: 17, width: 5, angle: (x,y)=>0.01+0.08*P.noise(x*.02,y*.01), seed: 12, t, boil: 0, outline: 0.3, outlineMix: 0.25, jitterCol: 26, palette: waterPal, mask: (x, y) => y >= topY(x) + 14 && y < bankY(x) - 90 });

      const F = P.scratch('impFg'), fg = F.getContext('2d', { willReadFrequently: true });
      fg.clearRect(0, 0, W, H);
      drawFarBank(fg, t);
      drawSailboat(fg, t, 620, 706, 0.86);
      drawDucks(fg, t, 790, 772, 1.0);
      drawBlanket(fg, t);
      drawProps(fg, t);
      fg.fillStyle = 'rgba(46,88,44,.26)'; fg.beginPath(); fg.ellipse(womanX, WOMAN_Y + 6, 96, 15, 0.03, 0, 7); fg.fill();
      drawBoat(fg, t, lt);
      const catX = lt > 8.4 ? lerp(1330, 1210, clamp((lt - 8.4) / 1.3)) : 1330;
      drawCat(fg, catX, 1058, 0.66, t, lt);
      fgStrokes(fg, F);
      c.drawImage(F, 0, 0);

      boatLines(c, t, lt);
      drawRower(c, boatX(lt), boatY(lt), lt);
      const womanG = drawWoman(c, t, lt);
      face(c, womanG, '#4a3628', true);
      drawParasol(c, womanX, WOMAN_Y, H_WOMAN, t);
      const bp = bouquetPos(lt);
      drawBouquet(c, bp[0], bp[1], 0.92, t);
      if (lt > 8.4) {
        c.fillStyle = '#eec9ad'; c.beginPath(); c.ellipse(bp[0] + 4, bp[1] + 6, 11, 8, -0.4, 0, 7); c.fill();
        c.strokeStyle = 'rgba(104,70,50,.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(bp[0] + 4, bp[1] + 6, 11, 8, -0.4, 0, 7); c.stroke();
      }

      clouds(c, t);
      // 船与帆的倒影
      c.save(); c.globalAlpha = .35;
      for (let k = 0; k < 18; k++) {
        const x = boatX(lt) - 140 + k * 16, y = boatY(lt) + 8 + (k % 3) * 5;
        c.strokeStyle = k % 2 ? '#2f6670' : '#d8c890'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10, y + 6 + Math.sin(t * 2 + k) * 2); c.stroke();
      }
      c.restore();
      // 前景芦苇（左侧压边）
      for (let k = 0; k < 46; k++) {
        const x = 30 + k * 9 + U.hash(k, 3) * 30, base = 1090, hh = 120 + U.hash(k, 7) * 210;
        const sw = Math.sin(t * 1.6 + k * .7) * 10;
        c.strokeStyle = k % 3 ? '#2f5a30' : '#48763a'; c.lineWidth = 3 + U.hash(k, 11) * 3;
        c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x + sw * .5, base - hh * .6, x + sw, base - hh); c.stroke();
        if (k % 5 === 0) { c.fillStyle = '#5a4230'; c.beginPath(); c.ellipse(x + sw, base - hh, 5, 16, sw * .02, 0, 7); c.fill(); }
      }
      sunSpots(c, t); waterGlints(c, t); petals(c, t);

      const vg = c.createRadialGradient(960, 480, 480, 960, 540, 1240);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,20,35,.16)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };

  function boatLines(c, t, lt) {
    const cx = boatX(lt), cy = boatY(lt);
    c.save();
    c.strokeStyle = 'rgba(224,176,104,.9)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(cx - 186, cy - 72); c.quadraticCurveTo(cx - 120, cy - 44, cx, cy - 46); c.quadraticCurveTo(cx + 120, cy - 42, cx + 176, cy - 70); c.stroke();
    c.strokeStyle = 'rgba(20,52,58,.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx - 168, cy - 70); c.quadraticCurveTo(cx - 110, cy - 48, cx, cy - 50); c.quadraticCurveTo(cx + 112, cy - 44, cx + 162, cy - 68); c.stroke();
    c.restore();
  }
})();



