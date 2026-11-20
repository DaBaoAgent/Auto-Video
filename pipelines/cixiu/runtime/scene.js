/* cixiu · 刺绣（Auto-Video 自研画法脚本）
   媒介：棉线在平纹亚麻上一针针绣，绷在榉木绣绷里；针脚方向决定形体，线本身带丝光。
   题材：一枝斜生的花，叶用缎面绣铺满，枝用轮廓绣往前拱，花心最后打结。
   实现：布纹、绷子、针脚全部由本文件算出来；针脚按绣娘次序逐针出现。 */
(() => {
  const W = 1920, H = 1080;
  const CX = 960, CY = 520, R = 372;

  function linen(ctx, x, y, w, h, step, base, alt) {
    ctx.save();
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    const r = U.rng(77);
    for (let i = 0, xx = x; xx < x + w; i++, xx += step) {
      ctx.fillStyle = U.rgba(alt, 0.05 + (i % 2 ? 0.05 : 0) + r() * 0.03);
      ctx.fillRect(xx, y, 1.5, h);
    }
    for (let i = 0, yy = y; yy < y + h; i++, yy += step) {
      ctx.fillStyle = U.rgba(alt, (i % 2 ? 0.07 : 0.02) + r() * 0.03);
      ctx.fillRect(x, yy, w, 1.5);
    }
    ctx.restore();
  }

  function stitch(ctx, a, b, col, width, alpha = 1) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 1.2) return;
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(38,32,24,0.30)';
    ctx.lineWidth = width + 1.8;
    ctx.beginPath();
    ctx.moveTo(a[0] + 1.3, a[1] + 1.5);
    ctx.lineTo(b[0] + 1.3, b[1] + 1.5);
    ctx.stroke();
    const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, U.rgba(col, 0.9));
    g.addColorStop(0.4, U.rgba(col, 1));
    g.addColorStop(1, U.rgba(col, 0.84));
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(0.8, width * 0.18);
    ctx.beginPath();
    ctx.moveTo(a[0] - Math.sin(ang) * width * 0.26, a[1] + Math.cos(ang) * width * 0.26);
    ctx.lineTo(b[0] - Math.sin(ang) * width * 0.26, b[1] + Math.cos(ang) * width * 0.26);
    ctx.stroke();
    ctx.restore();
  }

  // 花瓣/叶子：梭形，沿轴按 sin 曲线算半宽，一针从一边穿到另一边
  function satinLeaf(c, ang, len, wid, col, n, curve = 0) {
    const out = [];
    const ax = Math.cos(ang), ay = Math.sin(ang);
    const nx = -ay, ny = ax;
    for (let i = 1; i <= n; i++) {
      const d = (i / (n + 1)) * len - len * 0.5;
      const hw = wid * Math.sin(Math.PI * (i / (n + 1)));
      const bx = c[0] + ax * d + nx * Math.sin(d / len * Math.PI) * curve;
      const by = c[1] + ay * d + ny * Math.sin(d / len * Math.PI) * curve;
      out.push({
        a: [bx + nx * hw, by + ny * hw],
        b: [bx - nx * hw, by - ny * hw],
        col,
        w: Math.max(9, 15 - Math.abs(i / n - 0.5) * 4),
      });
    }
    return out;
  }

  function build() {
    const list = [];

    // 枝：一条平滑曲线（二次插值），轮廓绣一针接一针
    const ctrl = [[470, 880], [660, 780], [880, 700], [1100, 600], [1310, 470], [1470, 352]];
    const curve = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[i], p1 = ctrl[i + 1];
      for (let k = 0; k < 8; k++) {
        const u = k / 8;
        curve.push([U.lerp(p0[0], p1[0], u) + Math.sin(u * Math.PI) * 6, U.lerp(p0[1], p1[1], u) - Math.sin(u * Math.PI) * 10]);
      }
    }
    for (let i = 0; i < curve.length - 1; i++) {
      const p = curve[i], q = curve[i + 1];
      const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      list.push({
        a: [p[0] + nx * 5, p[1] + ny * 5],
        b: [q[0] - nx * 5 + Math.cos(ang) * 4, q[1] - ny * 5 + Math.sin(ang) * 4],
        col: '#7a5734', w: 10,
      });
    }

    // 叶：沿枝四片
    [
      { c: [640, 806], ang: -0.55, len: 176, wid: 56 },
      { c: [900, 706], ang: 2.42, len: 190, wid: 60 },
      { c: [1130, 588], ang: -0.5, len: 168, wid: 54 },
      { c: [1350, 452], ang: 2.38, len: 150, wid: 48 },
    ].forEach((L, i) => satinLeaf(L.c, L.ang, L.len, L.wid, i % 2 ? '#69863c' : '#7d9a48', 15, 8).forEach(s => list.push(s)));
    // 叶脉
    [[640, 806, -0.55, 176], [900, 706, 2.42, 190], [1130, 588, -0.5, 168], [1350, 452, 2.38, 150]].forEach(([x, y, ang, len]) => {
      list.push({ a: [x - Math.cos(ang) * len * 0.32, y - Math.sin(ang) * len * 0.32], b: [x + Math.cos(ang) * len * 0.34, y + Math.sin(ang) * len * 0.34], col: '#57702f', w: 3.4 });
    });

    // 花：五瓣放射，每瓣一梭形针组；花心结粒
    const flowers = [
      { c: [588, 806], len: 132, wid: 46, col: '#c2534c', pet: 5 },
      { c: [962, 636], len: 158, wid: 54, col: '#d0736a', pet: 6 },
      { c: [1272, 462], len: 136, wid: 48, col: '#b64a4b', pet: 5 },
      { c: [1462, 356], len: 108, wid: 38, col: '#d9a252', pet: 5 },
    ];
    flowers.forEach(F => {
      for (let p = 0; p < F.pet; p++) {
        const a = -Math.PI * 0.5 + (Math.PI * 2 * p) / F.pet;
        const cc = [F.c[0] + Math.cos(a) * F.len * 0.42, F.c[1] + Math.sin(a) * F.len * 0.42];
        satinLeaf(cc, a, F.len * 0.86, F.wid, F.col, 13, 0).forEach(s => list.push(s));
        // 瓣尖一道深色收边
        list.push({
          a: [cc[0] + Math.cos(a) * F.len * 0.30, cc[1] + Math.sin(a) * F.len * 0.30],
          b: [cc[0] + Math.cos(a) * F.len * 0.38 - Math.sin(a) * 12, cc[1] + Math.sin(a) * F.len * 0.38 + Math.cos(a) * 12],
          col: '#8d3230', w: 6,
        });
      }
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        list.push({ knot: [F.c[0] + Math.cos(a) * F.wid * 0.5, F.c[1] + Math.sin(a) * F.wid * 0.5], r: 8.5, col: '#e8be63' });
      }
      list.push({ knot: F.c, r: 11, col: '#f0cd7c' });
    });

    return list;
  }
  const ST = build();

  window.SCENES.cixiu = {
    init: async () => {},
    draw(ctx, t) {
      linen(ctx, 0, 0, W, H, 7, '#efe6d3', '#b8a98c');
      const vg = ctx.createRadialGradient(CX, CY, R * 0.85, CX, CY, R * 2.2);
      vg.addColorStop(0, 'rgba(255,252,244,0.12)');
      vg.addColorStop(1, 'rgba(84,70,52,0.38)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.clip();
      linen(ctx, CX - R, CY - R, R * 2, R * 2, 6, '#f8f1e0', '#c9bb9e');
      const inLight = ctx.createRadialGradient(CX - 110, CY - 150, 20, CX, CY, R);
      inLight.addColorStop(0, 'rgba(255,255,250,0.30)');
      inLight.addColorStop(1, 'rgba(118,100,78,0.18)');
      ctx.fillStyle = inLight;
      ctx.fillRect(CX - R, CY - R, R * 2, R * 2);

      const prog = U.easeInOut(U.p(t, 0.3, 5.4));
      const count = Math.floor(ST.length * prog);
      for (let i = 0; i < count; i++) {
        const s = ST[i];
        if (s.knot) {
          ctx.save();
          ctx.fillStyle = U.rgba(s.col, 1);
          ctx.beginPath();
          ctx.ellipse(s.knot[0], s.knot[1], s.r, s.r * 0.82, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(s.knot[0] - 1.2, s.knot[1] - 1.2, s.r * 0.56, Math.PI * 0.9, Math.PI * 1.7);
          ctx.stroke();
          ctx.restore();
        } else stitch(ctx, s.a, s.b, s.col, s.w);
      }
      // 正在走的那一针：线尾
      if (prog > 0 && prog < 0.999 && count < ST.length && ST[count] && ST[count].b) {
        const s = ST[count];
        ctx.save();
        ctx.strokeStyle = 'rgba(252,250,242,0.85)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(s.b[0], s.b[1]);
        ctx.quadraticCurveTo(s.b[0] + 70, s.b[1] - 46, s.b[0] + 44, s.b[1] + 34);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      const hoop = U.easeOut(U.p(t, 0.05, 0.55));
      if (hoop > 0) {
        ctx.save();
        ctx.translate(CX, CY); ctx.scale(hoop, hoop); ctx.translate(-CX, -CY);
        U.softShadow(ctx, CX + 28, CY + 44, R * 1.22, R * 1.22, 0.26);
        const wood = ctx.createLinearGradient(CX - R, CY - R, CX + R, CY + R);
        wood.addColorStop(0, '#c99c5f');
        wood.addColorStop(0.35, '#a97a44');
        wood.addColorStop(0.7, '#8a5f33');
        wood.addColorStop(1, '#6b4622');
        ctx.strokeStyle = wood;
        ctx.lineWidth = 46;
        ctx.beginPath();
        ctx.arc(CX, CY, R + 23, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(70,44,22,0.26)';
        for (let i = 0; i < 30; i++) {
          const a = (Math.PI * 2 * i) / 30;
          ctx.lineWidth = 1 + U.hash(i * 4.7) * 2.2;
          ctx.beginPath();
          ctx.arc(CX, CY, R + 23 + (U.hash(i * 2.3) - 0.5) * 32, a, a + 0.3);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(48,34,20,0.4)';
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.arc(CX, CY, R + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,240,210,0.45)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(CX, CY, R + 40, -Math.PI * 1.12, -Math.PI * 0.6);
        ctx.stroke();
        // 绷子上的紧螺丝
        ctx.fillStyle = '#8a6a44';
        ctx.beginPath();
        ctx.roundRect(CX - 26, CY - R - 48, 52, 30, 8);
        ctx.fill();
        ctx.restore();
      }
    },
  };
})();
