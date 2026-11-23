/* 画法脚本：手绘水彩背景美术（本仓库自写，闭环在本管线 runtime/ 内）
   《夏日·田埂上》——稻田、积雨云、田埂上走的小女孩、蜻蜓。
   管线：纸（多层噪声）→ 洗染（同形叠几种邻近色 + 水痕边 + 干笔收边）→ 会动的母题（云飘、水面亮带、
        稻丛成片摆、蜻蜓、光斑）→ 赛璐璐角色（基色 + 月牙阴影 + 暖褐线 + 水彩颗粒）→ screen 暖光 + 纸颗粒统色 */
SCENES['25_ghibli'] = (() => {
  const W = 1920, H = 1080, { clamp, lerp, ease, rng } = U, P = PAINT, TAU = Math.PI * 2;
  const LINE = '#6b4a37';
  const wash = P.watercolor, rect = P.rectPts, ellipsePts = P.ellipsePts;

  const HZ = 512;                            // 地平线
  const PATH_Y = (x) => 876 - x * 0.024;     // 田埂中线

  // 同形多色叠染：在同一个形状里叠 2–3 种邻近色，色彩才有水彩的呼吸感
  const lay = (g, pts, cols, seed, opt = {}) => {
    cols.forEach((col, i) => wash(g, pts, col, {
      layers: 3, alpha: (opt.alpha || 0.26) * (i === 0 ? 1.2 : 1), amp: opt.amp || 9,
      seed: seed + i * 17, edge: i === 0 ? (opt.edge ?? 0.09) : 0.03, blend: opt.blend || 'multiply', fill: opt.fill,
    }));
  };
  // 干笔：沿形状边缘扫几段半透明短笔，破掉矢量硬边
  const dry = (g, pts, col, n, seed, len = 90) => {
    const r = rng(seed);
    g.save(); g.globalCompositeOperation = 'multiply'; g.lineCap = 'round';
    for (let k = 0; k < n; k++) {
      const i = (r() * pts.length) | 0, a = pts[i], b = pts[(i + 1) % pts.length];
      const q = r(), x = lerp(a[0], b[0], q), y = lerp(a[1], b[1], q);
      g.strokeStyle = col; g.globalAlpha = 0.07 + r() * 0.1; g.lineWidth = 3 + r() * 5;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * len, y + (r() - .5) * len * 0.4); g.stroke();
    }
    g.restore();
  };
  // 色晕
  const bloom = (g, x, y, r0, col, a) => {
    g.save(); g.globalCompositeOperation = 'multiply';
    const gr = g.createRadialGradient(x, y, 0, x, y, r0);
    gr.addColorStop(0, P.rgb(P.hex(col), a)); gr.addColorStop(1, P.rgb(P.hex(col), 0));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r0, 0, TAU); g.fill(); g.restore();
  };

  // ---------- 精灵：积雨云 / 稻丛 ----------
  const cloud = (key, w, h, seed) => P.cached('gh3_cloud_' + key, w, h, (g) => {
    const r = rng(seed), puffs = [];
    for (let i = 0; i < 26; i++) {
      const x = w * (0.22 + r() * 0.56);
      const yy = h * 0.80 - Math.sin((x / w) * Math.PI) * h * (0.30 + r() * 0.34);
      puffs.push([x, yy, 18 + r() * 30]);
    }
    puffs.push([w * 0.48, h * 0.74, w * 0.26], [w * 0.32, h * 0.80, w * 0.15], [w * 0.66, h * 0.78, w * 0.16]);
    g.save(); g.filter = 'blur(1.4px)';
    puffs.forEach(([x, y, rr], i) => wash(g, ellipsePts(x, y, rr, rr * 0.86, 12), '#fffdf6', {
      layers: 4, alpha: 0.42, amp: 9, seed: seed * 3 + i, edge: 0, blend: 'source-over',
    }));
    g.restore();
    g.save(); g.globalCompositeOperation = 'source-atop';
    const sh = g.createLinearGradient(0, h * 0.40, 0, h);
    sh.addColorStop(0, 'rgba(150,164,200,0)');
    sh.addColorStop(0.55, 'rgba(140,152,192,0.42)');
    sh.addColorStop(1, 'rgba(112,124,168,0.82)');
    g.fillStyle = sh; g.fillRect(0, 0, w, h);
    const hi = g.createLinearGradient(0, 0, 0, h * 0.55);
    hi.addColorStop(0, 'rgba(255,252,238,0.55)'); hi.addColorStop(1, 'rgba(255,252,238,0)');
    g.fillStyle = hi; g.fillRect(0, 0, w, h);
    g.restore();
  });

  const clump = (key, seed) => P.cached('gh3_clump_' + key, 220, 300, (g) => {
    const r = rng(seed); g.lineCap = 'round';
    const greens = ['#6f9a3a', '#83a944', '#5c8a33', '#96b750'];
    for (let i = 0; i < 13; i++) {
      const bx = 110, tilt = (r() - .5) * 46, hh = 170 + r() * 110;
      const col = greens[i % greens.length];
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = col; g.globalAlpha = 0.55 + r() * 0.35; g.lineWidth = 2.6 + r() * 2.4;
        g.beginPath(); g.moveTo(bx + (r() - .5) * 26, 298);
        g.quadraticCurveTo(bx + tilt * 0.5 + (r() - .5) * 18, 298 - hh * 0.55, bx + tilt + (r() - .5) * 12, 298 - hh);
        g.stroke();
      }
      if (r() < 0.75) {
        const tx = bx + tilt, ty = 298 - hh;
        g.strokeStyle = '#cbb858'; g.globalAlpha = 0.85; g.lineWidth = 2.2;
        for (let m = 0; m < 5; m++) {
          const dir = m % 2 ? 1 : -1;
          g.beginPath(); g.moveTo(tx, ty + m * 7); g.lineTo(tx + dir * (9 + r() * 5), ty + m * 7 - 8); g.stroke();
        }
        g.fillStyle = 'rgba(214,196,88,0.8)';
        for (let m = 0; m < 4; m++) { g.beginPath(); g.ellipse(tx + (m % 2 ? 4 : -4), ty + 4 + m * 6, 3.6, 2.2, 0.4, 0, TAU); g.fill(); }
      }
    }
    g.globalAlpha = 1;
  });

  // ---------- ① 底版 ----------
  const bg = () => P.cached('gh3_bg', W, H, (g) => {
    g.drawImage(P.texture('gh3_paper', '#fdf8ea', { scale: 0.006, amt: 10, grain: 15, seed: 5 }), 0, 0);

    // 天空
    const sky = g.createLinearGradient(0, -40, 0, HZ + 20);
    sky.addColorStop(0, '#5fa9d4'); sky.addColorStop(0.5, '#9fcbdf'); sky.addColorStop(1, '#f2e7c4');
    wash(g, rect(-30, -30, W + 60, HZ + 60), '#8cc2dc', { layers: 5, alpha: 0.5, amp: 18, seed: 2, edge: 0, fill: sky });
    g.save(); g.globalCompositeOperation = 'multiply';
    const g1 = g.createLinearGradient(0, 0, W * 0.9, HZ);
    g1.addColorStop(0, 'rgba(96,158,206,0.25)'); g1.addColorStop(1, 'rgba(96,158,206,0)');
    g.fillStyle = g1; g.fillRect(0, 0, W, HZ);
    g.restore();
    bloom(g, 1500, 200, 620, '#b9d6e4', 0.3);
    bloom(g, 260, 470, 520, '#f6dfb0', 0.4);
    for (let i = 0; i < 26; i++) {
      const y = 40 + (i / 26) * (HZ - 60), a = Math.sin(i * 1.7) * 30;
      wash(g, [[-40, y], [W + 40, y + a], [W + 40, y + a + 26 + (i % 4) * 8], [-40, y + 20]], i % 3 ? '#a9d2e2' : '#cfe6e8',
        { layers: 2, alpha: 0.07, amp: 16, seed: 20 + i, edge: 0 });
    }

    // 远山
    const ridge1 = [[-30, HZ - 2], [210, 420], [430, 388], [610, 410], [820, 366], [1010, 392], [1200, 356], [1420, 392], [1640, 372], [W + 30, 398], [W + 30, HZ + 40], [-30, HZ + 40]];
    lay(g, ridge1, ['#8fb0a7', '#a6c2b8', '#7d9e97'], 8, { alpha: 0.3, amp: 11, edge: 0.12 });
    dry(g, ridge1, '#5d7f7a', 26, 33, 110);
    const ridge2 = [[-30, HZ + 4], [280, 462], [520, 442], [760, 462], [980, 438], [1230, 466], [1500, 448], [W + 30, 452], [W + 30, HZ + 50], [-30, HZ + 50]];
    lay(g, ridge2, ['#6f9885', '#84a992', '#5e8778'], 11, { alpha: 0.34, amp: 9, edge: 0.14 });
    { const r = rng(66);
      for (let i = 0; i < 22; i++) {
        const x = 40 + r() * (W - 80), y = HZ - 10 - r() * 60, rr = 8 + r() * 18;
        wash(g, ellipsePts(x, y, rr, rr * 0.8, 8), '#4c7466', { layers: 2, alpha: 0.4, amp: 4, seed: 700 + i, edge: 0.1 });
      }
    }

    // 稻田：7 层，每层一块块不规则的田，各自不同色
    const bands = [
      { y: HZ + 2, h: 64, cols: ['#8ab045', '#9cbd52', '#7aa33e'] },
      { y: HZ + 66, h: 72, cols: ['#a0bf55', '#8fb34a', '#b0c866'] },
      { y: HZ + 138, h: 82, cols: ['#7ea83f', '#93b64b', '#6d9738'] },
      { y: HZ + 220, h: 96, cols: ['#9ab94f', '#86a842', '#a8c25c'] },
    ];
    bands.forEach((bd, bi) => {
      const r = rng(300 + bi * 7);
      let x = -60;
      while (x < W + 60) {
        const w = 90 + r() * 280;
        const yj = (r() - .5) * 10;
        const pts = [[x, bd.y + yj], [x + w * 0.5, bd.y + yj - 5], [x + w, bd.y + yj + (r() - .5) * 8],
          [x + w, bd.y + bd.h + (r() - .5) * 10], [x + w * 0.5, bd.y + bd.h + 4], [x, bd.y + bd.h + (r() - .5) * 10]];
        lay(g, pts, bd.cols, 400 + bi * 60 + (x | 0), { alpha: 0.34, amp: 8, edge: 0.045 });
        dry(g, pts, bd.cols[2], 10, 900 + bi * 33 + (x | 0), 60);
        wash(g, [[x - 2, bd.y + bd.h - 3], [x + w + 2, bd.y + bd.h + 1], [x + w + 2, bd.y + bd.h + 4], [x - 2, bd.y + bd.h + 2]],
          '#c3a469', { layers: 2, alpha: 0.1, amp: 3, seed: 1000 + bi * 50 + (x | 0), edge: 0 });
        x += w;
      }
    });
    // 田里的水面：略深一点的横向水色（不用白色反光，免得出玻璃条）
    for (let i = 0; i < 7; i++) {
      const rr = rng(1500 + i);
      const x = rr() * W, y = HZ + 24 + rr() * 270, w = 180 + rr() * 300;
      g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.12 + rr() * 0.08;
      g.fillStyle = '#8fb9a0'; g.fillRect(x, y, w, 6);
      g.restore();
    }
    // 田埂前面的近景地（先铺一层底色，避免纸在缝合处露白）
    g.save(); g.fillStyle = '#6f9a3c'; g.fillRect(-10, 850, W + 20, H - 850 + 10); g.restore();
    lay(g, [[-40, 866], [W + 40, 866], [W + 40, H + 40], [-40, H + 40]], ['#5f8a34', '#6f9a3c', '#4e7729'], 21,
      { alpha: 0.34, amp: 10, edge: 0.1 });
    { const r = rng(17);
      for (let i = 0; i < 60; i++) {
        const x = r() * W, y = 940 + r() * 110, h = 20 + r() * 34;
        wash(g, [[x, y], [x + 3, y - h * 0.6], [x + 9 + r() * 8, y - h], [x + 12, y - h * 0.5], [x + 10, y]],
          ['#4c7528', '#5d8a32', '#3f6522'][i % 3], { layers: 2, alpha: 0.3, amp: 3, seed: 1600 + i, edge: 0 });
      }
    }

    // 田埂
    const top = [], bot = [];
    for (let x = -30; x <= W + 30; x += 150) {
      top.push([x, PATH_Y(x) - 50 + Math.sin(x * 0.011) * 6]);
      bot.push([x, PATH_Y(x) + 48 + Math.sin(x * 0.014 + 1) * 6]);
    }
    const pathPts = top.concat(bot.reverse());
    lay(g, pathPts, ['#cfae74', '#bd9a60', '#e0c28c'], 12, { alpha: 0.4, amp: 7, edge: 0.16 });
    { const r = rng(77);
      for (let i = 0; i < 220; i++) {
        const x = r() * W, y = PATH_Y(x) + (r() - .5) * 78, rr = 1.4 + r() * 3.4;
        wash(g, ellipsePts(x, y, rr * 1.7, rr, 7), i % 4 ? '#a8875a' : '#efdcb4',
          { layers: 2, alpha: 0.28, amp: 1.4, seed: 1100 + i, edge: 0.12 });
      }
      for (let i = 0; i < 40; i++) {
        const x = r() * W, y = PATH_Y(x) + (r() - .5) * 60;
        g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.12;
        g.strokeStyle = '#8a663c'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26 + r() * 60, y + (r() - .5) * 4); g.stroke(); g.restore();
      }
    }

    // 底版草（远处）
    { const r = rng(55);
      for (let i = 0; i < 120; i++) {
        const x = r() * W, y = 952 + r() * 40, h = 16 + r() * 26;
        wash(g, [[x, y], [x + 2, y - h * 0.6], [x + 6 + r() * 8, y - h], [x + 9, y - h * 0.5], [x + 7, y]],
          ['#6f9a3e', '#8db14a', '#5b8a36'][i % 3], { layers: 2, alpha: 0.26, amp: 3, seed: 1200 + i, edge: 0 });
      }
    }
    // 纸颗粒：整张图落到纸上
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55;
    g.drawImage(P.texture('gh3_gran', '#f7f1e0', { scale: 0.02, amt: 12, grain: 20, seed: 7 }), 0, 0);
    g.restore();
  });

  const gust = (t) => 0.45 + 0.55 * Math.sin(t * 1.05 + 0.5) * Math.sin(t * 0.34 + 1.2);

  function field(c, t) {
    const cA = clump('a', 1), cB = clump('b', 2), cC = clump('c', 3);
    const g = gust(t);
    // 只留一排稻丛（站在田埂后面、遮住一点地平线），太高太密会把田全糊掉
    [[700, 0.52, 0.66]].forEach(([yy, sc, alpha]) => {
      for (let i = 0; i < 26; i++) {
        const x = -30 + i * 76;
        const jx = Math.sin(i * 2.3) * 10;
        const sp = [cA, cB, cC][i % 3];
        const sway = (0.25 + g * 0.75) * 18 * sc;
        c.save();
        c.translate(x + jx, yy + Math.sin(i * 1.9) * 7);
        c.rotate(Math.sin(t * 2.3 + i * 0.8) * 0.04 + sway * 0.012);
        c.globalAlpha = alpha;
        c.drawImage(sp, -110 * sc, -300 * sc, 220 * sc, 300 * sc);
        c.restore();
      }
    });
    c.globalAlpha = 1;
    // 前景：一条近景草带（宽笔、双层低 α 当景深，不用 filter blur：CPU 下太慢）
    c.save(); c.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      c.globalAlpha = pass ? 0.5 : 0.22;
      for (let i = 0; i < 30; i++) {
        const x = -60 + i * 70, y = 1128, h = 96 + (i % 5) * 34;
        const sw = Math.sin(t * 2.6 - x * 0.011) * (0.4 + g) * 30;
        c.strokeStyle = ['#4a7328', '#5f8a32', '#3d6522'][i % 3];
        c.lineWidth = (pass ? 9 : 15) + (i % 3) * 5;
        c.beginPath(); c.moveTo(x, y);
        c.quadraticCurveTo(x + sw * 0.3, y - h * 0.55, x + sw, y - h);
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    c.restore();
  }

  function dragonfly(c, t, cx, cy, s, ph) {
    const x = cx + Math.sin(t * 1.4 + ph) * 44, y = cy + Math.cos(t * 1.1 + ph) * 20;
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 2 + ph) * 0.1 - 0.18);
    const flap = 0.4 + 0.35 * Math.sin(t * 26 + ph);
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dx, dy]) => {
      c.save(); c.rotate(dy * 0.4 * flap);
      c.fillStyle = 'rgba(226,240,242,0.62)';
      c.beginPath(); c.ellipse(dx * 22, dy * 9, 27, 6.4, dy * 0.32, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(120,140,150,0.5)'; c.lineWidth = 1; c.stroke();
      c.restore();
    });
    c.fillStyle = '#3c6046';
    c.beginPath(); c.ellipse(0, 0, 27, 5.2, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(-31, 0, 7, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,250,220,0.5)';
    c.beginPath(); c.ellipse(-6, -1.6, 16, 1.6, 0, 0, TAU); c.fill();
    c.restore();
  }

  // ---------- ③ 赛璐璐：小女孩 ----------
  const cel = (c, p, base, shade, dx = 10, dy = 7, lw = 2.4) => P.cel(c, p, base, shade, null, { sd: 1, lx: -dx, ly: -dy, line: LINE, lw });
  const G = { skin: '#fce4cf', skinS: '#edc1a2', shirt: '#fdf8ee', shirtS: '#d9d2c8', skirt: '#4b87a6', skirtS: '#305e79', hat: '#e9cb84', hatS: '#c09a4c', hair: '#4a3226', bag: '#c8663e', bagS: '#95411f', shoe: '#6b4030' };
  function girl(c, t, baseX, step) {
    const y = PATH_Y(baseX) + 4 + Math.abs(step) * 3;
    c.save(); c.globalAlpha = 0.2; c.fillStyle = '#7a5a34';
    c.beginPath(); c.ellipse(baseX + 18, y + 6, 74, 14, -0.04, 0, TAU); c.fill(); c.restore();

    c.save(); c.translate(baseX, y); c.lineJoin = 'round'; c.lineCap = 'round';
    // 后腿＋鞋
    c.strokeStyle = G.skinS; c.lineWidth = 12;
    c.beginPath(); c.moveTo(-4, -108); c.lineTo(-12 + step * 18, -56); c.lineTo(-8 + step * 30, -6); c.stroke();
    c.fillStyle = G.shoe; c.beginPath(); c.ellipse(-8 + step * 30, 0, 12, 6.5, 0, 0, TAU); c.fill();
    // 裙
    const dress = new Path2D();
    dress.moveTo(-38, -172); dress.lineTo(32, -172);
    dress.quadraticCurveTo(44, -126, 40 + Math.sin(t * 3.2) * 10, -88);
    dress.lineTo(-48 - Math.sin(t * 3.2 + 1) * 6, -88);
    dress.quadraticCurveTo(-52, -132, -38, -172); dress.closePath();
    cel(c, dress, G.skirt, G.skirtS, 13, 7);
    // 上衣
    const torso = new Path2D();
    torso.moveTo(-28, -238); torso.lineTo(24, -238);
    torso.quadraticCurveTo(33, -196, 30, -168); torso.lineTo(-34, -168);
    torso.quadraticCurveTo(-39, -200, -28, -238); torso.closePath();
    cel(c, torso, G.shirt, G.shirtS, 12, 6);
    // 领子
    c.fillStyle = G.shirtS;
    c.beginPath(); c.moveTo(-12, -238); c.lineTo(0, -224); c.lineTo(12, -238); c.closePath(); c.fill();
    // 背带
    c.strokeStyle = G.skirtS; c.lineWidth = 6;
    c.beginPath(); c.moveTo(-18, -238); c.lineTo(-14, -176); c.stroke();
    c.beginPath(); c.moveTo(14, -238); c.lineTo(12, -176); c.stroke();
    // 包
    const bag = new Path2D();
    bag.roundRect ? bag.roundRect(18, -218, 34, 42, 6) : bag.rect(18, -218, 34, 42);
    cel(c, bag, G.bag, G.bagS, 6, 5, 2);
    c.strokeStyle = G.bagS; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(22, -218); c.lineTo(2, -240); c.stroke();
    // 手臂
    c.strokeStyle = G.skin; c.lineWidth = 9;
    c.beginPath(); c.moveTo(-24, -228); c.lineTo(-38 - step * 13, -180); c.stroke();
    c.beginPath(); c.moveTo(22, -228); c.lineTo(34 + step * 13, -182); c.stroke();
    // 脖子
    cel(c, (() => { const p = new Path2D(); p.ellipse(0, -248, 11, 12, 0, 0, TAU); return p; })(), G.skin, G.skinS, 5, 3, 2);
    // 头
    cel(c, (() => { const p = new Path2D(); p.ellipse(-1, -282, 28, 32, 0, 0, TAU); return p; })(), G.skin, G.skinS, 10, 6, 2.2);
    // 刘海与侧发
    c.fillStyle = G.hair;
    c.beginPath(); c.moveTo(-28, -284); c.quadraticCurveTo(-24, -310, -2, -312); c.quadraticCurveTo(20, -312, 27, -286);
    c.quadraticCurveTo(12, -296, -2, -294); c.quadraticCurveTo(-16, -294, -28, -284); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-26, -288); c.quadraticCurveTo(-34, -268, -30, -252); c.lineTo(-22, -256); c.quadraticCurveTo(-24, -272, -20, -286); c.closePath(); c.fill();
    // 眼
    [[-11, 0.95], [7, 1]].forEach(([ex, sc]) => {
      c.fillStyle = '#3a2a22';
      c.beginPath(); c.ellipse(ex, -286, 4.2 * sc, 5.4 * sc, 0.05, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)';
      c.beginPath(); c.arc(ex + 1.2, -288, 1.2, 0, TAU); c.fill();
    });
    // 眉
    c.strokeStyle = '#33211a'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-16, -297); c.quadraticCurveTo(-11, -299, -6, -297); c.stroke();
    c.beginPath(); c.moveTo(3, -298); c.quadraticCurveTo(8, -300, 12, -297); c.stroke();
    // 鼻、嘴、腮红
    c.strokeStyle = G.skinS; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(3, -278); c.quadraticCurveTo(5, -274, 3, -272); c.stroke();
    c.strokeStyle = '#b4564a'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-2, -268); c.quadraticCurveTo(3, -264, 8, -268); c.stroke();
    c.fillStyle = 'rgba(238,146,136,0.32)';
    c.beginPath(); c.ellipse(15, -274, 7, 5, 0, 0, TAU); c.fill();
    // 耳
    c.fillStyle = G.skin; c.beginPath(); c.ellipse(27, -280, 4.5, 7, 0, 0, TAU); c.fill();
    // 草帽
    const hat = new Path2D();
    hat.moveTo(-56, -302); hat.quadraticCurveTo(-2, -326, 54, -300);
    hat.lineTo(44, -292); hat.quadraticCurveTo(-2, -312, -46, -293); hat.closePath();
    cel(c, hat, G.hat, G.hatS, 9, 6, 2.2);
    const crown = new Path2D();
    crown.moveTo(-24, -302); crown.lineTo(-16, -336);
    crown.quadraticCurveTo(-2, -346, 14, -336); crown.lineTo(22, -300); crown.closePath();
    cel(c, crown, G.hat, G.hatS, 9, 6, 2.2);
    c.strokeStyle = G.hatS; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-22, -318); c.lineTo(20, -318); c.stroke();
    // 前腿
    c.strokeStyle = G.skin; c.lineWidth = 11;
    c.beginPath(); c.moveTo(6, -108); c.lineTo(13 - step * 18, -56); c.lineTo(17 - step * 30, -6); c.stroke();
    c.fillStyle = G.shoe; c.beginPath(); c.ellipse(17 - step * 30, 0, 12, 6.5, 0, 0, TAU); c.fill();
    c.restore();
  }

  const charTex = () => P.cached('gh3_charTex', W, H, (g) => {
    const r = rng(88);
    for (let i = 0; i < 34; i++) {
      const x = 420 + r() * 800, y = 640 + r() * 400;
      wash(g, ellipsePts(x, y, 26 + r() * 54, 20 + r() * 40, 8), ['#e8c8a0', '#a8c0d0', '#f0d8a8', '#d8c0a8'][i % 4],
        { layers: 2, alpha: 0.12, amp: 12, seed: 900 + i, edge: 0.05 });
    }
  });

  return {
    draw(c, lt, t) {
      c.drawImage(bg(), 0, 0);
      c.drawImage(cloud('a', 520, 300, 11), 300 + t * 14, 120);
      c.drawImage(cloud('b', 440, 250, 23), 1010 + t * 22, 190);
      c.drawImage(cloud('c', 360, 210, 31), 1540 + t * 28, 84);
      c.save(); c.globalCompositeOperation = 'screen';
      for (let i = 0; i < 4; i++) {
        const y = HZ + 34 + i * 74 + Math.sin(t * 1.15 + i) * 4;
        const x0 = 120 + i * 260 + Math.sin(t * 0.8 + i) * 40;
        const g = c.createLinearGradient(x0, y, x0 + 520, y);
        g.addColorStop(0, 'rgba(230,246,246,0)'); g.addColorStop(0.5, 'rgba(230,246,246,0.28)'); g.addColorStop(1, 'rgba(230,246,246,0)');
        c.fillStyle = g; c.fillRect(x0, y, 520, 10);
      }
      c.restore();
      field(c, t);
      const p = clamp(t / 10, 0, 1);
      const bx = lerp(545, 1055, ease.inOut(p));
      const step = Math.sin(t * 4.4);
      const L = P.scratch('gh3_char'), cl = L.getContext('2d');
      cl.reset(); cl.clearRect(0, 0, W, H);
      girl(cl, t, bx, step);
      c.save(); c.globalAlpha = 0.97; c.drawImage(L, 0, 0); c.restore();
      dragonfly(c, t, 1290, 690, 0.92, 0);
      dragonfly(c, t, 735, 615, 0.6, 2.3);
      c.save(); c.globalCompositeOperation = 'screen';
      const lg = c.createRadialGradient(1580, 96, 40, 1580, 96, 1060);
      lg.addColorStop(0, 'rgba(255,246,214,0.34)'); lg.addColorStop(1, 'rgba(255,246,214,0)');
      c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
      const vg = c.createRadialGradient(W / 2, H / 2, 430, W / 2, H / 2, 1200);
      vg.addColorStop(0, 'rgba(120,88,46,0)'); vg.addColorStop(1, 'rgba(120,88,46,0.2)');
      c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
  };
})();
