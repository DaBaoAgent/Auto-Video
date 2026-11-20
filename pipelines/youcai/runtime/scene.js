/* youcai · 梦境釉彩（Auto-Video 自研画法脚本）
   媒介：树脂稀释的油画罩染，极软的细笔在白底上一层层薄涂；看不见笔触，
   每个形体像被逐像素修过，边缘一律硬，只有一束很低的光。
   题材：一只陶罐、一只梨、两颗李子，桌面一条硬边。
   实现：形体路径由把剖面点镜像得到；罩染靠裁剪逐层推进，投影硬边、不羽化。 */
(() => {
  const W = 1920, H = 1080;

  // 陶罐：剖面右缘一串点，镜像成整只
  const JUG_RIGHT = [
    [178, 892], [206, 838], [218, 768], [220, 700], [214, 640],
    [200, 584], [178, 534], [150, 490], [112, 452], [74, 430],
    [66, 404], [68, 378], [56, 366], [74, 356],
  ];
  const JUG_CX = 700;
  const jugOutline = (() => {
    const half = JUG_RIGHT.map(([dx, y]) => [JUG_CX + dx, y]);
    const left = JUG_RIGHT.slice().reverse().map(([dx, y]) => [JUG_CX - dx, y]);
    return half.concat(left);
  })();
  const jugLip = [[JUG_CX - 66, 366], [JUG_CX - 74, 352], [JUG_CX + 74, 352], [JUG_CX + 66, 366]];
  const jugHandle = (() => {
    const pts = [];
    for (let i = 0; i <= 36; i++) {
      const a = -Math.PI * 0.52 + Math.PI * 0.9 * (i / 36);
      pts.push([JUG_CX + 196 + Math.cos(a) * 96, 610 + Math.sin(a) * 100]);
    }
    for (let i = 36; i >= 0; i--) {
      const a = -Math.PI * 0.52 + Math.PI * 0.9 * (i / 36);
      pts.push([JUG_CX + 196 + Math.cos(a) * 46, 610 + Math.sin(a) * 52]);
    }
    return pts;
  })();

  // 梨：上窄下圆的剖面，镜像成整只
  const PEAR_PROFILE = [
    [22, 524], [30, 544], [40, 568], [52, 596], [66, 626], [82, 660], [96, 696],
    [108, 732], [110, 764], [100, 796], [82, 822], [56, 842], [26, 852], [0, 856],
  ];
  const PEAR = (() => {
    const right = PEAR_PROFILE.map(([dx, y]) => [1146 + dx, y]);
    const left = PEAR_PROFILE.slice().reverse().map(([dx, y]) => [1146 - dx, y]);
    return right.concat(left);
  })();
  const PEAR_STEM = [[1146, 524], [1166, 486], [1188, 470], [1206, 462]];
  const PLUM_A = (() => {
    const p = [];
    for (let i = 0; i <= 40; i++) { const a = Math.PI * 2 * (i / 40); p.push([1396 + Math.cos(a) * 84, 772 + Math.sin(a) * 74]); }
    return p;
  })();
  const PLUM_B = (() => {
    const p = [];
    for (let i = 0; i <= 40; i++) { const a = Math.PI * 2 * (i / 40); p.push([1516 + Math.cos(a) * 70, 804 + Math.sin(a) * 62]); }
    return p;
  })();

  const TABLE_Y = 892;

  function poly(ctx, pts, close = true) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (close) ctx.closePath();
  }

  // 硬边投影：底面一块饼 + 往右拉长的尾，全是不羽化的实色
  function castShadow(ctx, cx, baseY, rx, ry, len, alpha) {
    ctx.save();
    ctx.fillStyle = `rgba(96,82,92,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(cx + rx * 0.55, baseY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.4, baseY - ry * 1.05);
    ctx.lineTo(cx + rx * 0.55 + len, baseY - ry * 0.5);
    ctx.lineTo(cx + rx * 0.55 + len, baseY + ry * 0.55);
    ctx.lineTo(cx - rx * 0.4, baseY + ry * 1.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 罩染：裁剪到形体，铺色层，前沿一条湿边
  function glaze(ctx, pts, layers, prog) {
    if (prog <= 0) return;
    const xs = pts.map(p => p[0]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const solid = U.easeInOut(U.clamp(prog * 1.5 - 0.15));
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    layers.forEach(L => {
      const a = L.a * solid;
      if (a <= 0.001) return;
      if (L.kind === 'grad') {
        const g = ctx.createLinearGradient(L.x0, L.y0, L.x1, L.y1);
        g.addColorStop(0, U.rgba(L.c0, a));
        g.addColorStop(0.5, U.rgba(L.c1, a * 0.94));
        g.addColorStop(1, U.rgba(L.c2, a));
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = U.rgba(L.c, a);
      }
      ctx.fillRect(minX - 20, 300, maxX - minX + 40, 620);
    });
    if (prog < 0.999) {
      const fx = minX - 20 + (maxX - minX + 40) * U.easeInOut(prog);
      const g = ctx.createLinearGradient(fx - 54, 0, fx + 8, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(255,255,255,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(fx - 54, 300, 62, 620);
    }
    ctx.restore();
  }

  window.SCENES.youcai = {
    init: async () => {},
    draw(ctx, t) {
      // 底：奶白ground，往下极淡地沉一点
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#f7f4ec');
      bg.addColorStop(0.62, '#f1ece1');
      bg.addColorStop(1, '#e4ded1');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // 桌面：一块比墙略深的硬边平面
      const tableIn = U.easeInOut(U.p(t, 0.15, 0.7));
      if (tableIn > 0) {
        ctx.save();
        ctx.globalAlpha = 0.92 * tableIn;
        ctx.fillStyle = '#ddd5c6';
        ctx.fillRect(0, TABLE_Y, W, H - TABLE_Y);
        ctx.strokeStyle = 'rgba(120,104,90,0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, TABLE_Y);
        ctx.lineTo(W, TABLE_Y);
        ctx.stroke();
        ctx.restore();
      }

      // 背景一层暖罩：物件后头一团极淡的光，把纵深拉开
      const wash = U.easeInOut(U.p(t, 0.4, 1.2));
      if (wash > 0) {
        ctx.save();
        ctx.globalAlpha = 0.55 * wash;
        const wg = ctx.createRadialGradient(760, 470, 40, 760, 470, 720);
        wg.addColorStop(0, 'rgba(255,238,206,0.85)');
        wg.addColorStop(0.55, 'rgba(246,226,196,0.30)');
        wg.addColorStop(1, 'rgba(246,226,196,0)');
        ctx.fillStyle = wg;
        ctx.fillRect(0, 0, W, TABLE_Y);
        ctx.restore();
      }

      // 桌布：物件底下铺一条亚麻桌旗，几处折面，落到桌沿外
      const cloth = U.easeInOut(U.p(t, 0.5, 0.9));
      if (cloth > 0) {
        ctx.save();
        ctx.globalAlpha = cloth;
        const L = 0, Rr = W, top = TABLE_Y + 1, bot = H;
        const cg = ctx.createLinearGradient(0, top, 0, bot);
        cg.addColorStop(0, '#f4ecdd');
        cg.addColorStop(0.35, '#e9dfcc');
        cg.addColorStop(1, '#d2c5ae');
        ctx.fillStyle = cg;
        ctx.fillRect(L, top, Rr - L, bot - top);
        // 折面：三处不齐的竖折，暗面只压一半，不做等距排布
        const folds = [[620, 150, 0.20], [1180, 118, 0.16], [1520, 96, 0.13]];
        folds.forEach(([fx, wd, a]) => {
          const fg = ctx.createLinearGradient(fx - wd, 0, fx + wd, 0);
          fg.addColorStop(0, 'rgba(150,130,104,0)');
          fg.addColorStop(0.35, `rgba(150,130,104,${a})`);
          fg.addColorStop(0.62, 'rgba(255,252,242,0.10)');
          fg.addColorStop(1, 'rgba(150,130,104,0)');
          ctx.fillStyle = fg;
          ctx.fillRect(fx - wd, top, wd * 2, bot - top);
        });
        ctx.strokeStyle = 'rgba(120,103,82,0.34)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, top + 2);
        ctx.lineTo(W, top + 2);
        ctx.stroke();
        ctx.restore();
      }

      // 投影：硬边，一律往右下
      const sh = U.easeInOut(U.p(t, 2.5, 0.9));
      if (sh > 0) {
        ctx.save();
        ctx.globalAlpha = sh;
        castShadow(ctx, JUG_CX + 40, TABLE_Y + 8, 236, 26, 250, 0.30);
        castShadow(ctx, 1180, TABLE_Y + 4, 140, 18, 150, 0.26);
        castShadow(ctx, 1420, TABLE_Y + 2, 88, 12, 84, 0.24);
        castShadow(ctx, 1530, TABLE_Y + 2, 74, 10, 70, 0.22);
        castShadow(ctx, 352, TABLE_Y + 2, 70, 10, 58, 0.24);
        ctx.restore();
      }

      // 陶罐：底釉、形体暗面、高光侧、收口
      glaze(ctx, jugOutline, [
        { kind: 'grad', x0: 520, y0: 400, x1: 900, y1: 880, c0: '#b4713f', c1: '#99552c', c2: '#6f3a1d', a: 0.96 },
        { kind: 'grad', x0: 540, y0: 420, x1: 700, y1: 820, c0: 'rgba(255,236,198,0.55)', c1: 'rgba(255,222,176,0.12)', c2: 'rgba(84,44,22,0.30)', a: 0.85 },
        { kind: 'solid', c: '#40200f', a: 0.20 },
      ], U.p(t, 0.6, 1.5));
      glaze(ctx, jugLip, [
        { kind: 'grad', x0: 640, y0: 352, x1: 780, y1: 372, c0: '#c78046', c1: '#7d4420', c2: '#5a2c13', a: 0.95 },
      ], U.p(t, 1.6, 0.6));
      glaze(ctx, jugHandle, [
        { kind: 'grad', x0: 860, y0: 520, x1: 990, y1: 700, c0: '#cf8b52', c1: '#93501f', c2: '#5a2c13', a: 0.9 },
      ], U.p(t, 2.0, 0.6));

      // 梨：黄绿，受光面窄高光
      glaze(ctx, PEAR, [
        { kind: 'grad', x0: 1040, y0: 560, x1: 1260, y1: 860, c0: '#cdd477', c1: '#a8b34a', c2: '#5f6b24', a: 0.95 },
        { kind: 'grad', x0: 1084, y0: 600, x1: 1110, y1: 800, c0: 'rgba(255,255,232,0.62)', c1: 'rgba(255,255,232,0.06)', c2: 'rgba(255,255,232,0)', a: 0.9 },
        { kind: 'solid', c: '#3d4416', a: 0.18 },
      ], U.p(t, 2.4, 1.1));
      const stem = U.easeOut(U.p(t, 3.2, 0.4));
      if (stem > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(74,52,26,0.92)';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        U.tracePartial(ctx, PEAR_STEM, stem);
        ctx.restore();
      }

      // 李子
      glaze(ctx, PLUM_A, [
        { kind: 'grad', x0: 1320, y0: 700, x1: 1470, y1: 840, c0: '#94405a', c1: '#6a2440', c2: '#371021', a: 0.96 },
        { kind: 'solid', c: '#ffffff', a: 0.10 },
      ], U.p(t, 3.3, 0.8));
      glaze(ctx, PLUM_B, [
        { kind: 'grad', x0: 1450, y0: 750, x1: 1580, y1: 868, c0: '#9d465c', c1: '#722a42', c2: '#3c1325', a: 0.96 },
        { kind: 'solid', c: '#ffffff', a: 0.08 },
      ], U.p(t, 3.6, 0.8));

      // 左侧小陶杯：给画面一个轻一点的对位
      const CUP_CX = 352, CUP_TOP = 806, CUP_R = 62, CUP_BOT = 888;
      const cupPts = [];
      for (let i = 0; i <= 40; i++) { const a = Math.PI * (i / 40); cupPts.push([CUP_CX + Math.cos(a) * CUP_R, CUP_TOP + Math.sin(a) * 16]); }
      for (let i = 40; i >= 0; i--) { const a = Math.PI * (i / 40); cupPts.push([CUP_CX + Math.cos(a) * (CUP_R * 0.82), CUP_BOT + Math.sin(a) * 12]); }
      glaze(ctx, cupPts, [
        { kind: 'grad', x0: CUP_CX - CUP_R, y0: CUP_TOP, x1: CUP_CX + CUP_R, y1: CUP_BOT, c0: '#dcd2c0', c1: '#bfb29b', c2: '#8d7f68', a: 0.95 },
        { kind: 'solid', c: '#5a4c3a', a: 0.14 },
      ], U.p(t, 3.9, 0.9));
      const cupRim = U.easeOut(U.p(t, 4.6, 0.4));
      if (cupRim > 0) {
        ctx.save();
        ctx.globalAlpha = cupRim;
        ctx.strokeStyle = 'rgba(255,251,240,0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(CUP_CX, CUP_TOP, CUP_R, 16, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(120,104,84,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(CUP_CX, CUP_TOP + 4, CUP_R - 6, 12, 0, 0.15, Math.PI * 1.2);
        ctx.stroke();
        ctx.restore();
      }

      // 右侧一枝橄榄叶：几片叶子从桌沿外探进来
      const sprig = U.easeInOut(U.p(t, 4.2, 1.0));
      if (sprig > 0) {
        ctx.save();
        ctx.globalAlpha = sprig;
        const stemPts = [[1876, 906], [1810, 886], [1744, 862], [1688, 838]];
        ctx.strokeStyle = 'rgba(92,86,44,0.95)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        U.tracePartial(ctx, stemPts, sprig);
        const leaves = [[1840, 892, 0.55, 80, 26], [1782, 872, -0.55, 86, 28],
                        [1724, 852, 0.6, 78, 24], [1676, 834, -0.5, 70, 22]];
        leaves.forEach(([lx, ly, ang, lw, lh], i) => {
          const k = U.clamp(sprig * 1.6 - i * 0.12);
          if (k <= 0) return;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(ang);
          ctx.scale(k, k);
          const lg = ctx.createLinearGradient(-lw * 0.5, -lh, lw * 0.5, lh);
          lg.addColorStop(0, '#93a05a');
          lg.addColorStop(0.55, '#77883f');
          lg.addColorStop(1, '#4e5a26');
          ctx.fillStyle = lg;
          ctx.beginPath();
          ctx.ellipse(0, 0, lw * 0.5, lh * 0.44, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(56,64,28,0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-lw * 0.42, 0);
          ctx.lineTo(lw * 0.44, 0);
          ctx.stroke();
          ctx.restore();
        });
        ctx.restore();
      }

      // 硬高光：一处不多，边缘清
      const hi = U.easeOut(U.p(t, 4.3, 0.6));
      if (hi > 0) {
        ctx.save();
        ctx.globalAlpha = 0.92 * hi;
        ctx.fillStyle = '#fffdf2';
        ctx.beginPath();
        ctx.ellipse(620, 606, 9, 30, -0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(1098, 668, 6, 18, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(1358, 742, 6, 9, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // 罐口的一线反光
        ctx.globalAlpha = 0.5 * hi;
        ctx.strokeStyle = '#ffe9c8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(JUG_CX - 58, 360);
        ctx.lineTo(JUG_CX + 46, 358);
        ctx.stroke();
        ctx.restore();
      }

      // 清漆：一道极薄的斜掠光
      const varn = U.easeInOut(U.p(t, 5.2, 1.3));
      if (varn > 0 && varn < 0.999) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const bandX = -700 + (W + 1400) * varn;
        const g = ctx.createLinearGradient(bandX - 420, 0, bandX + 420, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.14)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(bandX - 420, 0);
        ctx.lineTo(bandX + 420, 0);
        ctx.lineTo(bandX + 180, H);
        ctx.lineTo(bandX - 640, H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 暗角：把注意力收回到物件上
      const vg = ctx.createRadialGradient(W * 0.5, 620, 320, W * 0.5, 600, 1180);
      vg.addColorStop(0, 'rgba(60,44,32,0)');
      vg.addColorStop(0.62, 'rgba(60,44,32,0.05)');
      vg.addColorStop(1, 'rgba(48,34,24,0.16)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // 桌面边缘的一根落款线
      const sg = U.easeOut(U.p(t, 6.1, 0.5));      if (sg > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3 * sg;
        ctx.strokeStyle = 'rgba(80,62,50,1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(300, 986);
        ctx.lineTo(300 + 220 * sg, 986);
        ctx.stroke();
        ctx.restore();
      }
    },
  };
})();
