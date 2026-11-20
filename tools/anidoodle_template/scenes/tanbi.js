/* tanbi · 炭笔擦画（Auto-Video 自研画法脚本）
   媒介：柳炭条起形、压缩炭压暗部、纸擦笔揉成中间调、可塑橡皮提白，再在旧痕上复画。
   题材：坡上的一棵枯树，右下压着大块阴影，天空只留纸。
   所有线条与色块都在本文件里算，不读外部图片、不引用外部库。 */
(() => {
  const W = 1920, H = 1080;
  const INK = '34,30,26';
  const CROWN = { x: 800, y: 300 };
  // 树冠由三个椭圆并起来，乱中有形
  const LOBES = [
    { x: 800, y: 292, rx: 322, ry: 236 },
    { x: 618, y: 344, rx: 196, ry: 168 },
    { x: 986, y: 330, rx: 186, ry: 158 },
  ];
  function inCrown(x, y) {
    return LOBES.some(l => ((x - l.x) / l.rx) ** 2 + ((y - l.y) / l.ry) ** 2 <= 1);
  }

  function strokePts(x0, y0, x1, y1, bend, n = 12) {
    const pts = [];
    const nx = -(y1 - y0), ny = x1 - x0;
    const len = Math.hypot(nx, ny) || 1;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const b = Math.sin(k * Math.PI) * bend;
      pts.push([x0 + (x1 - x0) * k + (nx / len) * b, y0 + (y1 - y0) * k + (ny / len) * b]);
    }
    return pts;
  }
  function arcPts(cx, cy, rx, ry, a0, a1, n) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
    }
    return out;
  }

  // 主干：从根部到梢的一段带锥度的轮廓
  function trunkPoly() {
    const base = [826, 704], top = [790, 268];
    const spine = [];
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      spine.push([U.lerp(base[0], top[0], k) + Math.sin(k * 2.6) * 16, U.lerp(base[1], top[1], k)]);
    }
    const left = [], right = [];
    spine.forEach(([x, y], i) => {
      const k = i / 30;
      const w = U.lerp(30, 7, Math.pow(k, 0.7)) + (k > 0.92 ? -3 : 0);
      left.push([x - w + Math.sin(k * 9) * 2, y]);
      right.push([x + w + Math.sin(k * 7 + 1) * 2, y]);
    });
    // 根部外撇
    left[0] = [base[0] - 40, base[1] + 6];
    right[0] = [base[0] + 38, base[1] + 8];
    return { spine, poly: left.concat(right.slice().reverse()) };
  }
  const TRUNK = trunkPoly();

  const BRANCHES = [
    strokePts(790, 300, 640, 236, 22, 12),
    strokePts(790, 286, 920, 214, -24, 12),
    strokePts(646, 240, 566, 176, 14, 9),
    strokePts(918, 218, 986, 158, -14, 9),
    strokePts(788, 372, 702, 268, 18, 11),
    strokePts(704, 272, 646, 200, 10, 8),
    strokePts(920, 216, 1046, 196, -10, 8),
    strokePts(796, 470, 892, 424, -16, 9),
    strokePts(892, 426, 946, 368, -12, 8),
    strokePts(800, 540, 690, 500, 16, 9),
    strokePts(690, 502, 628, 452, 8, 7),
    strokePts(806, 604, 900, 566, -10, 8),
  ];

  // 树冠：密的短擦痕
  function canopy() {
    const r = U.rng(913);
    const list = [];
    let guard = 0;
    while (list.length < 760 && guard++ < 4000) {
      const x = CROWN.x + (r() - 0.5) * 720;
      const y = CROWN.y + (r() - 0.5) * 560;
      if (!inCrown(x, y)) continue;
      const len = 12 + r() * 38;
      const ang = r() * Math.PI * 2;
      // 越靠下越重，越靠上越透气；再加一层成团的密度，避免糊成一个球
      const clump = U.noise(x / 130, y / 130, 5) * 0.6 + U.noise(x / 52, y / 52, 11) * 0.4;
      const dark = 0.06 + r() * 0.22 + U.clamp((y - 190) / 430) * 0.18 + clump * 0.30;
      list.push({
        pts: strokePts(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len, (r() - 0.5) * 14, 7),
        w: 1.6 + r() * 5.2,
        a: Math.min(0.62, dark),
        start: 2.3 + (list.length / 760) * 2.1,
      });
    }
    return list;
  }
  const CAN = canopy();

  // 地面排线：短、密、贴着坡走
  function groundHatch() {
    const r = U.rng(661);
    const list = [];
    for (let i = 0; i < 300; i++) {
      const y = 664 + Math.pow(r(), 0.7) * 400;
      const len = 40 + r() * 130;
      const x = r() * (W - len);
      list.push({
        pts: strokePts(x, y, x + len, y - 4 + r() * 18, (r() - 0.5) * 22, 7),
        w: 1.6 + r() * 5,
        a: 0.05 + r() * 0.16,
        start: 3.8 + r() * 1.5,
      });
    }
    return list;
  }
  const GND = groundHatch();

  const crest = arcPts(700, 712, 560, 66, Math.PI * 1.02, Math.PI * 1.98, 40);
  const farHill = [[0, 610], [340, 570], [700, 594], [1080, 556], [1460, 588], [1920, 564]];

  function charcoal(ctx, pts, frac, w = 8, alpha = 0.85) {
    if (frac <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(${INK},${alpha})`;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let p = 0; p < 3; p++) {
      const j = (p - 1) * 1.5;
      ctx.lineWidth = Math.max(1, w - p * 2);
      ctx.globalAlpha = alpha * (1 - p * 0.24);
      ctx.setTransform(1, 0, 0, 1, j, j * 0.7);
      U.tracePartial(ctx, pts, frac);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }

  window.SCENES.tanbi = {
    init: async () => {},
    draw(ctx, t) {
      U.paper(ctx, W, H, '#e6e0d3', 9, 1.0);
      const vg = ctx.createRadialGradient(W * 0.46, H * 0.42, 200, W * 0.5, H * 0.5, W * 0.8);
      vg.addColorStop(0, 'rgba(255,255,255,0.24)');
      vg.addColorStop(1, 'rgba(104,94,78,0.22)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // 远景：几根若隐若现的线
      charcoal(ctx, farHill, U.easeInOut(U.p(t, 0.6, 0.9)), 2.4, 0.24);
      charcoal(ctx, [[80, 596], [520, 590], [920, 604], [1420, 582], [1860, 600]], U.easeInOut(U.p(t, 0.9, 0.6)), 1.6, 0.16);
      charcoal(ctx, crest, U.easeInOut(U.p(t, 1.2, 1.0)), 4, 0.38);

      // 主干：一整块压下去，再补边
      const trunkIn = U.easeInOut(U.p(t, 1.4, 1.0));
      if (trunkIn > 0) {
        ctx.save();
        ctx.globalAlpha = 0.88 * trunkIn;
        ctx.fillStyle = `rgba(${INK},1)`;
        ctx.beginPath();
        TRUNK.poly.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      charcoal(ctx, TRUNK.spine, U.easeOut(U.p(t, 1.5, 0.6)), 3, 0.5);

      // 枝：一笔一笔
      BRANCHES.forEach((b, i) => {
        charcoal(ctx, b, U.easeOut(U.p(t, 2.2 + i * 0.11, 0.4)), 6.5 - i * 0.28, 0.78);
      });

      // 树冠：柔和的底 + 密的擦痕
      const mass = U.easeInOut(U.p(t, 2.3, 1.2));
      if (mass > 0) {
        ctx.save();
        ctx.globalAlpha = 0.22 * mass;
        ctx.filter = 'blur(10px)';
        ctx.fillStyle = `rgba(${INK},1)`;
        LOBES.forEach(l => {
          ctx.beginPath();
          ctx.ellipse(l.x, l.y + 10, l.rx * 0.92, l.ry * 0.9, 0.06, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }
      CAN.forEach(s => charcoal(ctx, s.pts, U.clamp((t - s.start) / 0.45), s.w, s.a));

      // 地面排线
      GND.forEach(s => charcoal(ctx, s.pts, U.clamp((t - s.start) / 0.45), s.w, s.a));

      // 树影：往右下摊开
      const shadow = U.easeInOut(U.p(t, 4.2, 1.0));
      if (shadow > 0) {
        ctx.save();
        ctx.globalAlpha = shadow;
        // 一整块往右下摊开的影，边缘靠渐变收，不留接缝
        const g2 = ctx.createRadialGradient(1150, 838, 10, 1150, 838, 640);
        g2.addColorStop(0, 'rgba(34,30,26,0.40)');
        g2.addColorStop(0.45, 'rgba(34,30,26,0.18)');
        g2.addColorStop(1, 'rgba(34,30,26,0)');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.ellipse(1150, 838, 640, 150, -0.06, 0, Math.PI * 2);
        ctx.fill();
        // 树根处压得实一点
        const g1 = ctx.createRadialGradient(866, 722, 4, 866, 722, 150);
        g1.addColorStop(0, 'rgba(34,30,26,0.26)');
        g1.addColorStop(1, 'rgba(34,30,26,0)');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.ellipse(866, 722, 150, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 纸擦笔：把树冠与坡揉成一片
      const stump = U.easeInOut(U.p(t, 4.9, 0.9));
      if (stump > 0) {
        ctx.save();
        ctx.globalAlpha = 0.22 * stump;
        ctx.filter = 'blur(30px)';
        ctx.fillStyle = `rgba(${INK},1)`;
        ctx.beginPath();
        ctx.ellipse(806, 316, 300, 236, 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(760, 726, 560, 74, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 可塑橡皮：只提亮
      const lift = U.easeInOut(U.p(t, 5.7, 1.0));
      if (lift > 0) {
        ctx.save();
        for (let i = 0; i < 9; i++) {
          const x = 620 + U.hash(i * 4.3) * 460;
          const y = 156 + U.hash(i * 2.7) * 240;
          if (!inCrown(x, y + 40)) continue;
          const r = (26 + U.hash(i * 8.9) * 78) * lift;
          if (r < 2) continue;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(238,233,224,0.88)');
          g.addColorStop(0.6, 'rgba(236,231,222,0.45)');
          g.addColorStop(1, 'rgba(234,229,220,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 在旧痕上复画
      BRANCHES.slice(0, 6).forEach((b, i) => {
        charcoal(ctx, b, U.easeInOut(U.p(t, 6.7 + i * 0.1, 0.32)), 2.4, 0.42);
      });

      // 炭粉落在右下
      const dust = U.easeOut(U.p(t, 7.3, 0.6));
      if (dust > 0) {
        ctx.save();
        ctx.globalAlpha = 0.45 * dust;
        const r = U.rng(1234);
        ctx.fillStyle = `rgba(${INK},1)`;
        for (let i = 0; i < 500; i++) {
          const x = W * 0.5 + r() * W * 0.5;
          const y = H * 0.62 + r() * H * 0.38;
          const s = 0.5 + r() * 1.7;
          ctx.fillRect(x, y, s, s);
        }
        ctx.restore();
      }
    },
  };
})();
