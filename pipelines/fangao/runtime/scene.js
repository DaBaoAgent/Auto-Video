/* Auto-Video 自研画法脚本 · 后印象派（Post-Impressionism / Van Gogh）
   1888 阿尔郊外的黄昏麦田：播种者一路走一路撒种，麦浪顺风伏倒，乌鸦群从天上掠过。
   一镜到底 10 秒；天空的漩涡、麦田的厚涂笔、乌鸦的翅、种子的弧线全在动。
   管线：平涂底稿 → 旋风/麦浪方向场短厚笔 → 前景麦秆与人物单独一层 → 复描轮廓 → 光晕/飞种/乌鸦。
   全部由代码绘制，不使用任何外部图片。 */
SCENES['09_postimp'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const HZ = 620;
  const SUN = [470, 300];
  const SWIRLS = [[300, 250, 150], [660, 190, 110], [880, 330, 90], [160, 430, 80]];

  const angle = (x, y, t) => {
    if (y < HZ) {
      let best = 0, wsum = 0.0001;
      for (let i = 0; i < SWIRLS.length; i++) {
        const [cx, cy, r] = SWIRLS[i];
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        const w = Math.exp(-Math.pow(d / (r * 1.9), 2));
        const a = Math.atan2(dy, dx) + Math.PI / 2 + Math.sin(t * .5 + i) * .35;
        best += a * w; wsum += w;
      }
      return best / wsum;
    }
    return 0.06 + 0.22 * P.noise(x * .004, y * .003) - 0.10 * (y - HZ) / (H - HZ) + Math.sin(t * 1.1 + x * .01) * .06;
  };

  const PAL = {
    sky: P.swatch(['#1b3a8a', '#2d56b0', '#4a74c8', '#8fb0dc', '#cfe0f0', '#e8e8d8', '#f6e8b0', '#24488f'], 0.40),
    cloud: P.swatch(['#f8f0d8', '#e8e0c0', '#d8d8e8', '#c0d0e8', '#f0e8c0'], 0.45),
    field: P.swatch(['#d8a828', '#e8c250', '#b8821c', '#f0d070', '#c89830', '#8a7420', '#e0b040', '#f8e090'], 0.38),
  };

  function base(g, t) {
    const sg = g.createLinearGradient(0, 0, 0, HZ + 20);
    sg.addColorStop(0, '#17327c'); sg.addColorStop(0.45, '#3a62b8');
    sg.addColorStop(0.78, '#9cb8d8'); sg.addColorStop(1, '#e8dfae');
    g.fillStyle = sg; g.fillRect(0, 0, W, HZ + 30);
    const halo = g.createRadialGradient(SUN[0], SUN[1], 40, SUN[0], SUN[1], 320);
    halo.addColorStop(0, 'rgba(255,246,190,.95)'); halo.addColorStop(0.25, 'rgba(255,230,140,.55)');
    halo.addColorStop(0.6, 'rgba(240,200,90,.20)'); halo.addColorStop(1, 'rgba(240,200,90,0)');
    g.fillStyle = halo; g.fillRect(SUN[0] - 400, SUN[1] - 400, 800, 800);
    g.fillStyle = '#ffe88a'; g.beginPath(); g.arc(SUN[0], SUN[1], 58, 0, 7); g.fill();
    g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(SUN[0], SUN[1], 38, 0, 7); g.fill();
    g.fillStyle = '#6a7a58'; g.fillRect(0, HZ - 26, W, 26);
    for (const [x, s] of [[760, 1], [840, .8], [930, .9], [1010, .7]]) {
      g.fillStyle = '#d8c8a8'; g.fillRect(x - 26 * s, HZ - 54 * s, 52 * s, 30 * s);
      g.fillStyle = '#a04a38'; g.beginPath(); g.moveTo(x - 32 * s, HZ - 54 * s); g.lineTo(x, HZ - 74 * s); g.lineTo(x + 32 * s, HZ - 54 * s); g.closePath(); g.fill();
    }
    const fg = g.createLinearGradient(0, HZ, 0, H);
    fg.addColorStop(0, '#c8a030'); fg.addColorStop(0.4, '#e0b040'); fg.addColorStop(1, '#a87c20');
    g.fillStyle = fg; g.fillRect(0, HZ, W, H - HZ);
    for (let k = 0; k < 14; k++) {
      const x0 = -200 + k * 150;
      g.strokeStyle = 'rgba(120,90,20,.35)'; g.lineWidth = 6;
      g.beginPath(); g.moveTo(960 + (x0 - 960) * .12, HZ + 4); g.lineTo(x0, H); g.stroke();
    }
    const sw = Math.sin(t * 1.4) * 6;
    g.fillStyle = '#1f3a24';
    g.beginPath(); g.moveTo(1520, HZ + 10);
    g.bezierCurveTo(1470 + sw, 520, 1500 + sw, 300, 1560 + sw, 150);
    g.bezierCurveTo(1620 + sw, 300, 1650 + sw, 520, 1610, HZ + 10); g.closePath(); g.fill();
    g.fillStyle = '#2f5230';
    g.beginPath(); g.moveTo(1530, HZ); g.bezierCurveTo(1500 + sw, 560, 1526 + sw, 330, 1556 + sw, 200);
    g.bezierCurveTo(1576 + sw, 360, 1588 + sw, 560, 1590, HZ); g.closePath(); g.fill();
    g.fillStyle = '#3f6a3a';
    for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(1554 + Math.sin(t * 2 + k) * 14, 300 + k * 60, 16, 40, 0.2, 0, 7); g.fill(); }
    g.fillStyle = '#1a1a24';
    for (const [x, y, s] of [[1180, 250, 1], [1240, 210, .8], [1300, 280, .7]]) {
      g.beginPath(); g.ellipse(x, y, 10 * s, 4 * s, 0, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(255,232,150,.18)'; g.beginPath(); g.ellipse(800, 900, 700, 160, -0.05, 0, 7); g.fill();
  }

  function wheat(g, t) {
    const r = U.rng(77);
    for (let i = 0; i < 900; i++) {
      const x = r() * W, y = HZ + 10 + r() * (H - HZ - 20);
      const depth = (y - HZ) / (H - HZ);
      const hh = 12 + depth * 90 + r() * 20;
      const sw = Math.sin(t * 1.8 + x * .02 + y * .01) * (2 + depth * 10);
      const col = depth > .6 ? '#8a6a18' : r() < .5 ? '#d8ac30' : '#e8c850';
      g.strokeStyle = col; g.lineWidth = 1 + depth * 2.4;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw * .4, y - hh * .55, x + sw, y - hh); g.stroke();
      if (r() < .22) { g.fillStyle = '#f0d878'; g.beginPath(); g.ellipse(x + sw, y - hh, 2 + depth * 2, 4 + depth * 3, 0.2, 0, 7); g.fill(); }
    }
    for (let i = 0; i < 90; i++) {
      const x = r() * W, y = 940 + r() * 150, hh = 40 + r() * 60, sw = Math.sin(t * 1.6 + i) * 8;
      g.strokeStyle = '#b89020'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, y + 40); g.quadraticCurveTo(x + sw * .5, y, x + sw, y - hh); g.stroke();
      g.fillStyle = '#e8c050'; g.beginPath(); g.ellipse(x + sw, y - hh, 7, 20, sw * .02, 0, 7); g.fill();
      g.strokeStyle = 'rgba(140,100,20,.5)'; g.lineWidth = 1.4;
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + sw - 5, y - hh + k * 8); g.lineTo(x + sw + 5, y - hh + 2 + k * 8); g.stroke(); }
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * W, y = HZ + 30 + r() * 300;
      g.fillStyle = i % 2 ? '#c8302a' : '#e04838';
      g.beginPath(); g.arc(x + Math.sin(t * 2 + i) * 3, y, 4 + r() * 3, 0, 7); g.fill();
    }
  }

  function sower(g, t, lt) {
    const x = lerp(1180, 1330, clamp(lt / 9.6)), y = 1052, h = 420;
    const phase = (lt * 1.15) % 1;
    const cast = Math.sin(lt * 4.2);
    const G = FIG.build({ x, y, h, face: 1, armFront: true, ...FIG.pose('walk', phase),
      lean: 0.10, head: 0.06,
      uaR: 2.34 + cast * 0.16, faR: 0.58 + cast * 0.22,
      uaL: 0.62, faL: 0.40,
      hair: 'short', hat: 'straw', bottom: 'trousers', top: 'shirt', sleeve: true });
    FIG.draw(g, G, PAL_SOWER);
    const x0 = x - 0.24 * h, x1 = x + 0.26 * h;
    for (const p of G.parts) {
      if (p.line || !p.path || !['skin', 'shirt', 'trousers', 'hat', 'hair', 'shoes'].includes(p.role)) continue;
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, 'rgba(40,30,70,.30)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,236,170,.26)');
      g.save(); g.clip(p.path); g.fillStyle = gr; g.fillRect(x0, y - 1.1 * h, 0.5 * h, 1.2 * h); g.restore();
    }
    const hd = G.J.headC, rx = G.hrx, ry = G.hry, f = G.face;
    g.fillStyle = 'rgba(60,40,26,.7)'; g.beginPath(); g.ellipse(hd[0] + f * rx * .42, hd[1], rx * .11, ry * .10, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(70,50,34,.6)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(hd[0] + f * rx * .22, hd[1] - ry * .22); g.quadraticCurveTo(hd[0] + f * rx * .44, hd[1] - ry * .26, hd[0] + f * rx * .60, hd[1] - ry * .18); g.stroke();
    g.strokeStyle = '#8a4a3a'; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(hd[0] + f * rx * .34, hd[1] + ry * .42); g.quadraticCurveTo(hd[0] + f * rx * .46, hd[1] + ry * .50, hd[0] + f * rx * .58, hd[1] + ry * .40); g.stroke();
    { // 种子麻袋：挂在左手，背带绕过左肩
      const hn = G.J.handF, shL = G.J.shoulderR;
      g.strokeStyle = '#6a5228'; g.lineWidth = 5;
      g.beginPath(); g.moveTo(shL[0], shL[1]); g.quadraticCurveTo(shL[0] - 0.03 * h, y - 0.24 * h, hn[0] - 0.02 * h, hn[1] - 0.02 * h); g.stroke();
      g.fillStyle = '#c2a468';
      g.beginPath(); g.moveTo(hn[0] - 0.044 * h, hn[1] + 0.055 * h);
      g.quadraticCurveTo(hn[0] - 0.074 * h, hn[1] + 0.140 * h, hn[0] - 0.010 * h, hn[1] + 0.168 * h);
      g.quadraticCurveTo(hn[0] + 0.054 * h, hn[1] + 0.144 * h, hn[0] + 0.044 * h, hn[1] + 0.058 * h);
      g.closePath(); g.fill();
      g.fillStyle = '#a88848';
      g.beginPath(); g.ellipse(hn[0] - 0.004 * h, hn[1] + 0.058 * h, 0.048 * h, 0.016 * h, 0.08, 0, 7); g.fill();
      g.strokeStyle = 'rgba(90,70,34,.55)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(hn[0] - 0.052 * h, hn[1] + 0.055 * h); g.quadraticCurveTo(hn[0] - 0.005 * h, hn[1] + 0.090 * h, hn[0] + 0.036 * h, hn[1] + 0.060 * h); g.stroke();
    }
    return G;
  }

  const PAL_SOWER = { features: false, skin: '#dca878', hair: '#3a2a1a', shirt: '#2f4a86', sleeve: '#2a4278', trousers: '#6a4a2a', shoes: '#2a2018', hat: '#e0c070', hatBand: '#8a2a22', belt: '#4a3a20', lw: 2.6, line: 'rgba(40,30,26,.55)' };

  function crows(c, t) {
    c.save();
    for (let i = 0; i < 9; i++) {
      const sp = 0.9 + i * .13, off = i * 90;
      const x = ((t * 130 * sp + off) % 2100) - 60, y = 200 + (i % 4) * 55 + Math.sin(t * 1.6 + i) * 22;
      const s = 0.75 + (i % 3) * .22, flap = Math.sin(t * 7 + i * 2.1);
      c.save(); c.translate(x, y); c.rotate(-0.06 + Math.sin(t + i) * .05);
      c.fillStyle = '#16161f';
      c.beginPath(); c.ellipse(0, 0, 15 * s, 6 * s, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-11 * s, -2 * s); c.lineTo(-30 * s, -14 * s * flap); c.lineTo(-12 * s, 3 * s); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(11 * s, -2 * s); c.lineTo(30 * s, -14 * s * flap); c.lineTo(12 * s, 3 * s); c.closePath(); c.fill();
      c.fillStyle = '#2a2a36'; c.beginPath(); c.arc(15 * s, -3 * s, 4.5 * s, 0, 7); c.fill();
      c.fillStyle = '#8a7a40'; c.beginPath(); c.moveTo(19 * s, -3 * s); c.lineTo(25 * s, -1 * s); c.lineTo(19 * s, 1 * s); c.closePath(); c.fill();
      c.restore();
    }
    c.restore();
  }

  function seeds(c, t, G) {
    if (!G) return;
    const hand = G.J.handN;
    c.save();
    for (let i = 0; i < 26; i++) {
      const ph = (t * 1.9 + i * 0.09) % 1;
      const x = hand[0] + ph * 190 - ph * ph * 60, y = hand[1] - 40 + ph * 40 + ph * ph * 130;
      if (y > 1040) continue;
      c.fillStyle = `rgba(240,220,140,${0.8 - ph * .5})`;
      c.beginPath(); c.ellipse(x, y, 3, 2, ph * 2, 0, 7); c.fill();
    }
    c.restore();
  }

  return {
    draw(c, lt, t) {
      const b = P.scratch('fangoBase'), bg = b.getContext('2d', { willReadFrequently: true });
      bg.clearRect(0, 0, W, H);
      base(bg, t);

      c.fillStyle = '#e8dfb8'; c.fillRect(0, 0, W, H);
      const skyPal = (x, y, col, r) => y < HZ - 30 ? PAL.sky(col, r) : PAL.cloud(col, r);
      const fieldPal = (x, y, col, r) => PAL.field(col, r);
      P.strokes(c, b, { cell: 13, len: 40, width: 11, angle, seed: 7, t, boil: 0, outline: .7, outlineMix: .45, jitterCol: 30, palette: skyPal, mask: (x, y) => y < HZ + 6 });
      P.strokes(c, b, { cell: 10, len: 30, width: 9, angle, seed: 17, t, boil: 0, outline: .65, outlineMix: .42, jitterCol: 36, palette: fieldPal, mask: (x, y) => y >= HZ });
      P.strokes(c, b, { cell: 6, len: 18, width: 5, angle, seed: 27, t, boil: 0, outline: .4, outlineMix: .3, jitterCol: 30, palette: fieldPal, mask: (x, y) => y > HZ + 180 });

      const F = P.scratch('fangoFg'), fg = F.getContext('2d', { willReadFrequently: true });
      fg.clearRect(0, 0, W, H);
      wheat(fg, t);
      fg.fillStyle = 'rgba(80,62,14,.40)'; fg.beginPath(); fg.ellipse(1260, 1060, 250, 34, 0, 0, 7); fg.fill();
      const G = sower(fg, t, lt);
      fgStrokes(fg, F);
      c.drawImage(F, 0, 0);

      // 太阳（笔触之后补，保证不被盖掉）
      const sg2 = c.createRadialGradient(SUN[0], SUN[1], 30, SUN[0], SUN[1], 240);
      sg2.addColorStop(0, 'rgba(255,252,214,.98)'); sg2.addColorStop(0.35, 'rgba(255,232,140,.55)');
      sg2.addColorStop(0.75, 'rgba(250,210,110,.18)'); sg2.addColorStop(1, 'rgba(250,210,110,0)');
      c.fillStyle = sg2; c.beginPath(); c.arc(SUN[0], SUN[1], 240, 0, 7); c.fill();
      c.fillStyle = '#ffe878'; c.beginPath(); c.arc(SUN[0], SUN[1], 66, 0, 7); c.fill();
      c.fillStyle = '#fff8c8'; c.beginPath(); c.arc(SUN[0] - 6, SUN[1] - 6, 44, 0, 7); c.fill();
      for (let k = 0; k < 26; k++) {
        const a = k / 26 * Math.PI * 2 + t * .2, rr = 70 + Math.sin(t * 1.3 + k) * 8;
        c.strokeStyle = 'rgba(255,244,180,.75)'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(SUN[0] + Math.cos(a) * (rr - 12), SUN[1] + Math.sin(a) * (rr - 12)); c.lineTo(SUN[0] + Math.cos(a) * (rr + 26), SUN[1] + Math.sin(a) * (rr + 26)); c.stroke();
      }

      // 柏树（笔触之后再压，浓绿不透明）
      const swc = Math.sin(t * 1.4) * 8;
      c.fillStyle = '#172e1c';
      c.beginPath(); c.moveTo(1510, HZ + 20);
      c.bezierCurveTo(1450 + swc, 520, 1490 + swc, 270, 1562 + swc, 110);
      c.bezierCurveTo(1636 + swc, 290, 1670 + swc, 540, 1620, HZ + 20); c.closePath(); c.fill();
      c.save(); c.globalAlpha = .9;
      for (let k = 0; k < 120; k++) {
        const hsh = U.hash(k, 11), hsh2 = U.hash(k, 23);
        const yy = 130 + hsh * 470, wid = 34 + (yy - 130) * 0.10;
        const xx = 1562 + swc * (1 - (yy - 130) / 480) + (hsh2 - .5) * wid * 1.4;
        c.strokeStyle = k % 4 ? '#2b4a28' : '#3f6634'; c.lineWidth = 6 + hsh * 5;
        c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + (hsh2 - .5) * 26, yy + 26); c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(180,200,120,.35)'; c.lineWidth = 5;
      for (let k = 0; k < 18; k++) { const yy = 200 + k * 24; c.beginPath(); c.moveTo(1516 + swc, yy); c.lineTo(1530 + swc, yy + 14); c.stroke(); }

      crows(c, t);
      seeds(c, t, G);

      const a = 0.10 + 0.05 * Math.sin(t * 2.4);
      const halo = c.createRadialGradient(SUN[0], SUN[1], 60, SUN[0], SUN[1], 420);
      halo.addColorStop(0, `rgba(255,240,170,${a})`); halo.addColorStop(1, 'rgba(255,240,170,0)');
      c.fillStyle = halo; c.fillRect(0, 0, W, HZ + 100);

      const vg = c.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0, 'rgba(20,20,40,.10)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(50,36,10,.20)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };

  function fgStrokes(g, src) {
    const sd = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    const cell = 7;
    g.save(); g.globalCompositeOperation = 'source-atop'; g.lineCap = 'round';
    for (let j = 0; j < H / cell; j++) for (let i = 0; i < W / cell; i++) {
      const hx = U.hash(i, j), hy = U.hash(j + 7919, i), X = (i + hx) * cell, Y = (j + hy) * cell, k = ((Y | 0) * W + (X | 0)) * 4;
      if (X > W - 1 || Y > H - 1 || sd[k + 3] < 170) continue;
      const h3 = U.hash(i + 31, j + 17), h4 = U.hash(i + 97, j + 53);
      const ang = -0.5 + 1.0 * (h4 - .5), L = 12 * (0.7 + h4 * 0.6);
      const col = [sd[k] + (h3 - .5) * 24, sd[k + 1] + (h4 - .5) * 18, sd[k + 2] - (h3 - .5) * 14];
      g.strokeStyle = P.rgb(col); g.lineWidth = 5.0;
      g.beginPath(); g.moveTo(X - Math.cos(ang) * L / 2, Y - Math.sin(ang) * L / 2); g.lineTo(X + Math.cos(ang) * L / 2, Y + Math.sin(ang) * L / 2); g.stroke();
    }
    g.restore();
  }
})();
