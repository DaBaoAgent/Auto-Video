/* Auto-Video 自研画法脚本 · 表现主义（Munch, 1890s 奥斯陆峡湾）
   场景：黄昏的木码头，一个女人披着白裙等船，长发被风吹向一侧；两个深色人影跟在后面；
        远处一艘汽船拖着长烟，灯塔刚刚亮起。血色的天一层层压向水面，水在流动。
   一镜到底 10 秒：天与水由长弯流线笔沿扭动的方向场积分而成，风一次次把裙摆和头发掀起。
   全部由代码绘制，不使用任何外部图片。 */
SCENES['19_munch'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp } = U, P = PAINT;
  const hx = P.hex;
  const PAL = {
    sky: ['#7a1a10', '#a8281a', '#d23c14', '#e8641e', '#f2962c', '#f8bc3e', '#c8321c'],
    water: ['#07141c', '#0b2029', '#102c34', '#163a42', '#22504f', '#0a1b23'],
    refl: ['#c8481e', '#e06a26', '#a83018', '#f09032'],
    pier: ['#2a1c1e', '#3a2622', '#1e1416', '#4a3028'],
  };
  const HC = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, v.map(hx)]));
  const HZ = 428;
  const VP = [742, HZ];

  const pierPts = [[-120, 1080], [380, 1080], [VP[0] + 66, HZ], [VP[0] - 78, HZ]];
  const inPier = (x, y) => {
    if (y < HZ) return false;
    const u = (y - HZ) / (1080 - HZ);
    const l = VP[0] - 78 - u * (VP[0] - 78 + 120), r = VP[0] + 66 - u * (VP[0] + 66 - 380);
    return x > l && x < r;
  };
  const region = (x, y, t) => {
    if (inPier(x, y, t)) return 'pier';
    const hz = HZ + 10 * Math.sin(x * 0.004 + t * 1.2);
    return y < hz ? 'sky' : 'water';
  };

  function angle(x, y, t, reg) {
    if (reg === 'sky') return -0.04 + 0.32 * Math.sin(x * 0.006 + y * 0.012 - t * 1.6) + 0.10 * Math.sin(y * 0.05 + t * 2.2);
    if (reg === 'pier') return Math.atan2(y - VP[1], x - VP[0]) + 0.22 * Math.sin(t * 2.4 + x * 0.01);
    const k = clamp((y - HZ) / (1080 - HZ), 0, 1);
    if (k < 0.30) return -0.10 + 0.10 * Math.sin(x * 0.010 + t * 2.2);
    const q = (k - 0.30) / 0.70;
    return Math.PI / 2 - 0.38 * q + 0.26 * Math.sin(x * 0.009 + t * 2.4) + 0.10 * Math.sin(y * 0.03 - t * 2);
  }

  function color(reg, sx, sy, r1, t) {
    if (reg === 'sky') {
      const u = clamp((sy - 40) / (HZ - 40), 0, 1);
      const idx = clamp(Math.floor(u * PAL.sky.length + (r1 - .5) * 1.4), 0, PAL.sky.length - 1);
      return HC.sky[idx];
    }
    if (reg === 'pier') {
      const idx = clamp(Math.floor(r1 * PAL.pier.length), 0, PAL.pier.length - 1);
      return HC.pier[idx];
    }
    const u = clamp((sy - HZ) / 260, 0, 1);
    if (r1 > 0.82 && u < 0.55) return HC.refl[Math.floor(t * 3 + r1 * 99) % PAL.refl.length];
    const idx = clamp(Math.floor((1 - u) * 3 + r1 * 3), 0, PAL.water.length - 1);
    return HC.water[idx];
  }

  const PARAMS = { sky: [30, 7.5, 10, .72], water: [24, 7, 9, .66], pier: [12, 6, 8, .55] };
  const SEEDS = P.flowSeeds(26, 11);
  const SEEDS2 = P.flowSeeds(22, 29);

  function under(c, lt, t) {
    const g = c.createLinearGradient(0, 0, 0, HZ);
    g.addColorStop(0, '#6a140c'); g.addColorStop(0.35, '#a8281a'); g.addColorStop(0.72, '#e06020'); g.addColorStop(1, '#f6b43a');
    c.fillStyle = g; c.fillRect(0, 0, W, HZ + 6);
    const w = c.createLinearGradient(0, HZ, 0, H);
    w.addColorStop(0, '#5a2a20'); w.addColorStop(0.18, '#16394a'); w.addColorStop(1, '#0a1c28');
    c.fillStyle = w; c.fillRect(0, HZ, W, H - HZ);
    // 对岸山影
    c.fillStyle = '#12262c';
    c.beginPath(); c.moveTo(0, HZ - 6);
    for (let x = 0; x <= 980; x += 24) c.lineTo(x, HZ - 6 - 26 * Math.sin(x * 0.008 + 0.7) - 12 * Math.sin(x * 0.03));
    c.lineTo(980, HZ); c.lineTo(0, HZ); c.closePath(); c.fill();
    c.fillStyle = 'rgba(10,20,24,.55)';
    c.beginPath(); c.moveTo(0, HZ - 2);
    for (let x = 0; x <= 620; x += 26) c.lineTo(x, HZ - 2 - 54 * Math.sin(x * 0.007 + 2.1));
    c.lineTo(620, HZ - 2); c.closePath(); c.fill();
  }

  function pier(c, t) {
    c.fillStyle = '#241a1a';
    c.beginPath(); c.moveTo(pierPts[0][0], pierPts[0][1]); c.lineTo(pierPts[1][0], pierPts[1][1]);
    c.lineTo(pierPts[2][0], pierPts[2][1]); c.lineTo(pierPts[3][0], pierPts[3][1]); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(10,8,8,.55)'; c.lineWidth = 2;
    for (let k = 0; k < 16; k++) {
      const u = k / 15;
      const ax = lerp(pierPts[3][0], pierPts[0][0], u), ay = lerp(pierPts[3][1], pierPts[0][1], u);
      const bx = lerp(pierPts[2][0], pierPts[1][0], u), by = lerp(pierPts[2][1], pierPts[1][1], u);
      c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
    }
    for (let k = 0; k < 9; k++) {
      const u = k / 8;
      const x0 = lerp(pierPts[3][0], pierPts[0][0], u), y0 = lerp(pierPts[3][1], pierPts[0][1], u);
      const x1 = lerp(pierPts[2][0], pierPts[1][0], u), y1 = lerp(pierPts[2][1], pierPts[1][1], u);
      c.strokeStyle = 'rgba(8,6,6,.5)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x0, y0 + 6); c.lineTo(x1, y1 + 6); c.stroke();
    }
    // 右栏杆
    const rail = [[VP[0] + 62, HZ + 4], [356, 1062]];
    c.strokeStyle = '#160e0e'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(rail[0][0], rail[0][1] - 46); c.lineTo(rail[1][0], rail[1][1] - 128); c.stroke();
    for (let k = 0; k < 7; k++) {
      const u = k / 6, x = lerp(rail[0][0], rail[1][0], u), y = lerp(rail[0][1], rail[1][1], u), hh = 18 + 74 * u;
      c.strokeStyle = '#120c0c'; c.lineWidth = 3 + 4 * u;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4 * u, y - hh); c.stroke();
    }
    // 左栏杆
    c.strokeStyle = '#120c0c'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(VP[0] - 80, HZ + 2 - 30); c.lineTo(20, 940); c.stroke();
    for (let k = 0; k < 5; k++) {
      const u = k / 4, x = lerp(VP[0] - 80, 20, u), y = lerp(HZ + 2, 1010, u);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 6 * u, y - 14 - 60 * u); c.stroke();
    }
  }

  function boat(c, t) {
    const bob = Math.sin(t * 1.1) * 2;
    const bx = 1330 + 10 * Math.sin(t * 0.4), by = HZ - 8 + bob;
    c.fillStyle = '#1a1414';
    c.beginPath(); c.moveTo(bx - 92, by); c.lineTo(bx + 96, by); c.lineTo(bx + 74, by + 20); c.lineTo(bx - 68, by + 20); c.closePath(); c.fill();
    c.fillRect(bx - 26, by - 42, 52, 42);
    c.fillRect(bx - 6, by - 74, 14, 34);
    c.beginPath(); c.moveTo(bx + 78, by + 2); c.lineTo(bx + 92, by + 2); c.lineTo(bx + 88, by + 16); c.closePath(); c.fill();
    c.strokeStyle = '#1a1414'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx + 10, by - 40); c.lineTo(bx + 12, by - 108); c.stroke();
    const sr = U.rng(9);
    for (let k = 0; k < 9; k++) {
      const u = k / 8, px = bx - 14 - u * 268 - 22 * Math.sin(t * 1.4 + u * 3), py = by - 86 - u * 74 + 9 * Math.sin(t * 2 + k);
      const rr = 16 + u * 52 + sr() * 8;
      c.fillStyle = 'rgba(96,88,84,' + (0.34 - u * 0.28) + ')';
      c.beginPath(); c.ellipse(px, py, rr, rr * 0.72, -0.3, 0, Math.PI * 2); c.fill();
    }
  }

  function lighthouse(c, t) {
    const lx = 236, ly = HZ + 2, hh = 196;
    c.fillStyle = '#1c1414';
    c.beginPath(); c.moveTo(lx - 30, ly); c.lineTo(lx - 18, ly - hh); c.lineTo(lx + 18, ly - hh); c.lineTo(lx + 30, ly); c.closePath(); c.fill();
    c.fillStyle = '#2a2020'; c.fillRect(lx - 26, ly - hh - 18, 52, 22);
    const on = 0.45 + 0.55 * clamp((t - 1.6) / 2.2, 0, 1);
    const g = c.createRadialGradient(lx, ly - hh - 8, 2, lx, ly - hh - 8, 120);
    g.addColorStop(0, 'rgba(255,238,170,' + (0.85 * on) + ')'); g.addColorStop(1, 'rgba(255,220,120,0)');
    c.fillStyle = g; c.beginPath(); c.arc(lx, ly - hh - 8, 120, 0, Math.PI * 2); c.fill();
    const beam = Math.sin(t * 0.9) * 0.5 - 0.15;
    c.save(); c.translate(lx, ly - hh - 8); c.rotate(beam);
    const bg = c.createLinearGradient(0, 0, 520, 0);
    bg.addColorStop(0, 'rgba(255,240,190,' + (0.34 * on) + ')'); bg.addColorStop(1, 'rgba(255,240,190,0)');
    c.fillStyle = bg; c.beginPath(); c.moveTo(0, -10); c.lineTo(520, -92); c.lineTo(520, 78); c.lineTo(0, 12); c.closePath(); c.fill();
    c.restore();
    c.fillStyle = '#f6f0d4'; c.fillRect(lx - 8, ly - hh - 14, 16, 12);
  }

  const W_PAL = { features: false, lw: 2.4, line: 'rgba(24,18,16,.72)', skin: '#d8b28c', hair: '#1a1414', dress: '#d4cfc0', sleeve: '#c8c2b2', skirt: '#d4cfc0', shoe: '#1a1414', hem: null };
  const M_PAL = { features: false, lw: 2.4, line: 'rgba(14,10,8,.85)', skin: '#7a5a44', hair: '#12100e', coat: '#1c2226', coatLine: '#0e1418', shirt: '#38302c', trousers: '#141a1e', shoes: '#0e0c0a' };

  const FIG_G = (() => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; return cv.getContext('2d', { willReadFrequently: true }); })();

  function lady(t) {
    const x = 610, y = 828, h = 306, wind = Math.sin(t * 2.6) * 0.5 + 0.5;
    const greet = clamp((t - 7.2) / 1.2, 0, 1), wave = Math.sin(t * 6) * 0.5 + 0.5;
    const handRx = x + 0.05 * h - greet * 0.30 * h, handRy = y - 0.33 * h - greet * 0.22 * h + wave * 0.04 * h;
    const G = FIG.build({ x, y, h, face: -1, sway: Math.sin(t * 2.2) * 0.9,
      lean: -0.06, head: 0.05,
      handL: [x - 0.03 * h, y - 0.34 * h], handR: [handRx, handRy],
      hair: 'long', bottom: 'dress', hemW: 0.17, top: null, sleeve: true });
    FIG.draw(FIG_G, G, W_PAL);
    // 裙身暗面：左后侧压一道冷灰，出体积
    { const f0 = G.face;
      FIG_G.fillStyle = 'rgba(96,102,108,.55)'; FIG_G.beginPath();
      FIG_G.moveTo(x - f0 * 0.03 * h, y - 0.28 * h); FIG_G.lineTo(x + f0 * 0.02 * h, y - 0.28 * h);
      FIG_G.lineTo(x + f0 * 0.11 * h, y - 0.012 * h); FIG_G.lineTo(x + f0 * 0.02 * h, y - 0.012 * h); FIG_G.closePath(); FIG_G.fill(); }
    const f = G.face, hemY = y - 0.012 * h, sw = Math.sin(t * 2.4) * 0.03 * h;
    FIG_G.strokeStyle = 'rgba(120,110,98,.5)'; FIG_G.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const hx0 = x + f * (k - 2) * 0.042 * h + sw * (0.5 + wind);
      FIG_G.beginPath(); FIG_G.moveTo(hx0, hemY);
      FIG_G.quadraticCurveTo(hx0 + f * 0.02 * h, y - 0.14 * h, x + f * 0.015 * h, y - 0.28 * h);
      FIG_G.stroke();
    }
    const hd = G.J.headC;
    FIG_G.strokeStyle = '#1a1414'; FIG_G.lineWidth = 5; FIG_G.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const sx = hd[0] - 0.02 * h, sy = hd[1] - 0.03 * h + k * 0.012 * h;
      FIG_G.beginPath(); FIG_G.moveTo(sx, sy);
      FIG_G.quadraticCurveTo(sx - 0.10 * h - wind * 0.05 * h, sy + 0.02 * h, sx - 0.16 * h - wind * 0.09 * h, sy + 0.06 * h + k * 0.008 * h);
      FIG_G.stroke();
    }
    return G;
  }

  function men(lt) {
    const mk = (x, y, h, ph) => {
      const G = FIG.build({ x, y, h, face: 1, ...FIG.pose('idle', ph),
        lean: 0.12, handL: [x - 0.02 * h, y - 0.30 * h], handR: [x + 0.06 * h, y - 0.30 * h],
        hair: 'short', hat: 'bowler', top: 'coat', coatLong: 0.12, bottom: 'trousers', sleeve: true });
      FIG.draw(FIG_G, G, M_PAL);
    };
    mk(470, 876, 264, lt * 0.3);
    mk(534, 868, 272, lt * 0.3 + 0.4);
  }

  return {
    draw(c, lt, t) {
      under(c, lt, t);
      P.flowLines(c, SEEDS, { t: t * 0.8, region, angle, color, params: PARAMS, extraSteps: 8 });
      P.flowLines(c, SEEDS2, { t: t * 1.1 + 3, region, angle, color, params: { sky: [22, 8, 7, .55], water: [18, 8, 6, .5], pier: [8, 6, 5, .4] }, extraSteps: 6 });
      boat(c, t);
      lighthouse(c, t);
      pier(c, t);
      // 水面横纹（近处才被拉成竖条）
      const wr2 = U.rng(41);
      for (let k = 0; k < 46; k++) {
        const u = wr2(), y = HZ + 6 + Math.pow(u, 1.7) * 620, x = wr2() * W, ww = 40 + wr2() * 180;
        c.strokeStyle = 'rgba(150,196,200,' + (0.05 + wr2() * 0.10) + ')'; c.lineWidth = 1 + wr2() * 2;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + ww * .5, y - 3 + Math.sin(t * 1.6 + k) * 2, x + ww, y); c.stroke();
      }
      // 码头在水里的暗倒影
      c.fillStyle = 'rgba(6,10,12,.35)';
      c.beginPath(); c.moveTo(VP[0] - 78, HZ); c.lineTo(VP[0] + 66, HZ); c.lineTo(360, 1080); c.lineTo(-60, 1080); c.closePath(); c.fill();
      // 倒影：船与灯在水面拉出的红黄竖条
      c.save(); c.globalAlpha = 0.5;
      for (let k = 0; k < 22; k++) {
        const rx = 1330 + (k % 8 - 4) * 22 + Math.sin(t * 1.6 + k) * 6, ry = HZ + 14 + (k / 22) * 300;
        c.strokeStyle = k % 3 ? 'rgba(232,110,40,.5)' : 'rgba(248,190,90,.45)';
        c.lineWidth = 3 + (k % 4);
        c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + 4 * Math.sin(t * 2 + k), ry + 26 + (k % 6) * 8); c.stroke();
      }
      c.restore();
      FIG_G.reset();
      men(lt); lady(t);
      c.drawImage(FIG_G.canvas, 0, 0);
      c.fillStyle = 'rgba(10,8,8,.42)';
      c.beginPath(); c.ellipse(610, 830, 62, 12, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(502, 890, 86, 14, 0, 0, Math.PI * 2); c.fill();
      // 风里的光尘
      const rr = U.rng(303);
      for (let k = 0; k < 60; k++) {
        const px = rr() * W, py = rr() * H, ln = 18 + rr() * 46, a = -0.32 + 0.12 * Math.sin(t * 1.4 + k);
        c.strokeStyle = 'rgba(255,214,150,' + (0.05 + rr() * 0.12) + ')'; c.lineWidth = 1 + rr();
        c.beginPath(); c.moveTo(px + Math.sin(t * 2 + k) * 8, py); c.lineTo(px + Math.cos(a) * ln + Math.sin(t * 2 + k) * 8, py + Math.sin(a) * ln); c.stroke();
      }
      const fg = c.createLinearGradient(0, 700, 0, H);
      fg.addColorStop(0, 'rgba(6,14,18,0)'); fg.addColorStop(1, 'rgba(6,14,18,.42)');
      c.fillStyle = fg; c.fillRect(0, 660, W, H - 660);
      const vg = c.createRadialGradient(W * 0.55, H * 0.5, H * 0.35, W * 0.55, H * 0.5, H * 0.95);
      vg.addColorStop(0, 'rgba(20,10,8,0)'); vg.addColorStop(1, 'rgba(20,10,8,.55)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
