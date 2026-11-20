/* 形变动画 · 一形万象（自研）
   轮廓按弧长重采样成等点数闭合折线，形变走 "A → 圆 → B" 两段，
   因此不会打结；每段先亮相再变，配硬边色块擦除与 12% 挤压拉伸。 */
(() => {
  const N = 160;
  const SEG = 8 / 7;          // 七段，8 秒

  const circlePts = (() => {
    const p = [];
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      p.push([Math.cos(a) * 0.94, Math.sin(a) * 0.94]);
    }
    return p;
  })();

  const sunPts = (() => {
    const raw = [];
    const rays = 12;
    for (let i = 0; i < rays * 2; i++) {
      const a = -Math.PI / 2 + (i / (rays * 2)) * Math.PI * 2;
      const r = i % 2 === 0 ? 1.36 : 0.97;
      raw.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return resampleClosed(raw, N);
  })();

  const starPts = (() => {
    const raw = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? 1.02 : 0.46;
      raw.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return resampleClosed(raw, N);
  })();

  const heartPts = (() => {
    const p = [];
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(a), 3) / 17;
      const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17;
      p.push([x, y]);
    }
    return p;
  })();

  const pinPts = (() => {
    const p = [];
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
      let x = Math.cos(a), y = Math.sin(a);
      const down = Math.max(0, y);
      x *= 1 - 0.16 * down;
      y = y < 0 ? y * 1.5 : y;
      p.push([x, y]);
    }
    // 质心归零
    const cy = p.reduce((s, q) => s + q[1], 0) / p.length;
    const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
    return p.map(([x, y]) => [x - cx, y - cy]);
  })();

  const planePts = (() => {
    const raw = [[1.00, 0.00], [-0.24, -0.60], [0.14, -0.04], [-0.74, 0.00], [0.14, 0.04], [-0.24, 0.60]];
    return resampleClosed(raw, N);
  })();

  const squarePts = (() => {
    const raw = [];
    const s = 0.80, r = 0.24;
    const arc = (cx, cy, a0, a1, n = 10) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * (i / n);
        raw.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    raw.push([-s + r, -s]);
    raw.push([s - r, -s]);
    arc(s - r, -s + r, -Math.PI / 2, 0);
    raw.push([s, s - r]);
    arc(s - r, s - r, 0, Math.PI / 2);
    raw.push([-s + r, s]);
    arc(-s + r, s - r, Math.PI / 2, Math.PI);
    raw.push([-s, -s + r]);
    arc(-s + r, -s + r, Math.PI, Math.PI * 1.5);
    return resampleClosed(raw, N);
  })();

  function resampleClosed(raw, n) {
    const segs = [];
    let total = 0;
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i], b = raw[(i + 1) % raw.length];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push({ a, b, d, t0: total });
      total += d;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const target = (i / n) * total;
      let s = segs[segs.length - 1];
      for (const c of segs) if (target >= c.t0 && target <= c.t0 + c.d) { s = c; break; }
      const u = (target - s.t0) / Math.max(1e-6, s.d);
      out.push([U.lerp(s.a[0], s.b[0], u), U.lerp(s.a[1], s.b[1], u)]);
    }
    return out;
  }

  const SHAPES = [circlePts, sunPts, starPts, heartPts, pinPts, planePts, squarePts];
  const BG = ['#efe9de', '#12100e', '#2f5f9c', '#f5c24a', '#e2503f', '#efe9de', '#12100e'];
  const FG = ['#1b1815', '#ffcf47', '#f5f0e4', '#20170e', '#fbf6ec', '#1b1815', '#ffcf47'];

  const bez = (x) => {
    x = U.clamp(x);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  };

  const mixPts = (a, b, k) => {
    k = bez(k);
    return a.map((p, i) => [U.lerp(p[0], b[i][0], k), U.lerp(p[1], b[i][1], k)]);
  };

  window.SCENES = window.SCENES || {};
  window.SCENES.xingbian = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;
      const cx = W / 2, cy = H * 0.47;
      const R = Math.min(W, H) * 0.30;

      const k = U.clamp(Math.floor(t / SEG), 0, SHAPES.length - 1);
      const u = U.clamp(t - k * SEG);

      const prev = Math.max(0, k - 1);
      ctx.fillStyle = BG[prev];
      ctx.fillRect(0, 0, W, H);
      const wipe = bez(U.p(u, 0.24, 0.26));
      if (wipe > 0) {
        const front = wipe * 1.32 - 0.16;
        ctx.fillStyle = BG[k];
        ctx.beginPath();
        ctx.moveTo(-0.05 * W, 0);
        ctx.lineTo(front * W, 0);
        ctx.lineTo((front - 0.09) * W, H);
        ctx.lineTo(-0.05 * W, H);
        ctx.closePath();
        ctx.fill();
      }

      const nk = Math.min(SHAPES.length - 1, k + 1);
      let pts, col, mix = 0;
      if (u < 0.30) {
        pts = SHAPES[k]; mix = 0;
      } else if (u < 0.64) {
        mix = U.p(u, 0.30, 0.34);
        pts = mixPts(SHAPES[k], circlePts, mix);
      } else {
        mix = U.p(u, 0.64, 0.34);
        pts = mixPts(circlePts, SHAPES[nk], mix);
      }
      col = mix < 0.5 ? FG[k] : FG[nk];
      const sq = Math.sin(Math.PI * U.clamp((u - 0.30) / 0.68)) * 0.10;
      const rot = Math.sin(t * 0.95) * 0.04 + Math.sin(Math.PI * U.clamp((u - 0.30) / 0.68)) * 0.08;

      // 落影
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(cx + 30, cy + R * 1.06, R * 0.58, R * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(R * (1 + sq), R * (1 - sq));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();

      // 方标最后点一颗点
      if (k === SHAPES.length - 1 && u > 0.55) {
        const d = U.easeOut(U.p(t, 7.45, 0.4));
        ctx.save();
        ctx.globalAlpha = d;
        ctx.fillStyle = '#e2503f';
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.15 * d, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 角标
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = [1, 3, 5].includes(k) ? '#f4efe4' : '#1b1815';
      ctx.font = '600 ' + Math.round(H * 0.019) + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('MORPH ' + String(k + 1).padStart(2, '0') + ' / 07', W * 0.05, H * 0.94);
      ctx.restore();

      // 片尾字标
      const wm = U.easeOut(U.p(t, 7.5, 0.45));
      if (wm > 0) {
        ctx.save();
        ctx.globalAlpha = wm;
        ctx.fillStyle = '#12100e';
        ctx.font = '700 ' + Math.round(H * 0.068) + 'px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('morphe', cx, H * 0.895);
        ctx.restore();
      }
    },
  };
})();
