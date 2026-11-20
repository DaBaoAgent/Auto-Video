/* 形变动画 · 一条线的旅行（自研）
   只有一条墨线，在纸上把自己变成下一个东西：圆 → 杯 → 云 → 鸟 → 鱼 → 灯 → 心 → 框。
   与上游"色块填充图形在彩底上跳"分开：这里是纯描边、米白纸、手绘抖动，笔尖是一颗朱点。 */
(() => {
  const PAPER = '#f3eee3';
  const INK = '#1b2733';
  const CORAL = '#e2563f';

  function circlePts(n = 48) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    return pts;
  }

  function heartPts(n = 72) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(a), 3) / 16;
      const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16;
      pts.push([x, y]);
    }
    return pts;
  }

  const KEYS = {
    cup: [[-0.55, -0.52], [0.55, -0.52], [0.55, -0.08], [0.94, 0.04], [0.55, 0.26], [0.42, 0.56], [-0.42, 0.56], [-0.55, -0.52]],
    cloud: [[-0.6, 0.22], [-0.52, -0.18], [-0.18, -0.3], [0.02, -0.52], [0.3, -0.3], [0.55, -0.12], [0.66, 0.2], [0.24, 0.36], [-0.24, 0.36]],
    bird: [[0.78, -0.04], [0.2, -0.58], [0.04, -0.10], [-0.86, 0.02], [0.04, 0.14], [0.2, 0.6]],
    fish: [[0.86, 0.0], [0.36, -0.30], [-0.22, -0.20], [-0.72, -0.56], [-0.56, 0.0], [-0.72, 0.56], [-0.22, 0.20], [0.36, 0.30]],
    bulb: [[0.0, -0.80], [0.46, -0.62], [0.62, -0.18], [0.34, 0.16], [0.30, 0.46], [-0.30, 0.46], [-0.34, 0.16], [-0.62, -0.18], [-0.46, -0.62]],
    key: [[0.0, -0.76], [0.30, -0.60], [0.34, -0.24], [0.14, -0.04], [0.14, 0.44], [0.32, 0.58], [0.30, 0.74], [0.06, 0.74], [-0.06, 0.56], [-0.06, -0.04], [-0.34, -0.24], [-0.30, -0.60]],
    frame: [[-0.62, -0.62], [0.62, -0.62], [0.62, 0.62], [-0.62, 0.62]],
  };

  function resample(pts, N = 200) {
    // 闭合折线按弧长等分成 N 点
    let total = 0;
    const seg = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      seg.push(d);
      total += d;
    }
    const out = [];
    let acc = 0, si = 0;
    for (let k = 0; k < N; k++) {
      const target = (k / N) * total;
      while (acc + seg[si] < target) { acc += seg[si]; si++; }
      const a = pts[si], b = pts[(si + 1) % pts.length];
      const u = seg[si] < 1e-9 ? 0 : (target - acc) / seg[si];
      out.push([U.lerp(a[0], b[0], u), U.lerp(a[1], b[1], u)]);
    }
    return out;
  }

  // 统一起点（最高点）与方向（顺时针），形变才不打结
  function align(pts) {
    let imin = 0;
    for (let i = 1; i < pts.length; i++) if (pts[i][1] < pts[imin][1]) imin = i;
    const rot = pts.slice(imin).concat(pts.slice(0, imin));
    let area = 0;
    for (let i = 0; i < rot.length; i++) {
      const a = rot[i], b = rot[(i + 1) % rot.length];
      area += a[0] * b[1] - b[0] * a[1];
    }
    return area > 0 ? rot : rot.slice().reverse();
  }

  // 圆角化：把尖角磨成手画的圆转，避免形变中段出现生硬的多边形
  function smoothClosed(pts, iter = 3) {
    let cur = pts;
    for (let k = 0; k < iter; k++) {
      const out = [];
      for (let i = 0; i < cur.length; i++) {
        const a = cur[(i - 1 + cur.length) % cur.length];
        const b = cur[i];
        const c = cur[(i + 1) % cur.length];
        out.push([0.25 * a[0] + 0.5 * b[0] + 0.25 * c[0], 0.25 * a[1] + 0.5 * b[1] + 0.25 * c[1]]);
      }
      cur = out;
    }
    return cur;
  }

  const N = 200;
  const SHAPES = [
    align(resample(circlePts(48), N)),
    align(smoothClosed(resample(KEYS.cup, N), 2)),
    align(smoothClosed(resample(KEYS.cloud, N), 3)),
    align(smoothClosed(resample(KEYS.bird, N), 1)),
    align(smoothClosed(resample(KEYS.fish, N), 2)),
    align(smoothClosed(resample(KEYS.bulb, N), 2)),
    align(smoothClosed(resample(heartPts(72), N), 2)),
    align(smoothClosed(resample(KEYS.frame, N), 2)),
  ];

  const HOLD = 0.62, MORPH = 0.58, START = 0.22;

  window.SCENES = window.SCENES || {};
  window.SCENES.xingbian = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;
      U.paper(ctx, W, H, PAPER, 17, 0.55);

      // 一圈很浅的底色晕，让线有地方站
      const vg = ctx.createRadialGradient(W * 0.5, H * 0.46, H * 0.1, W * 0.5, H * 0.46, W * 0.7);
      vg.addColorStop(0, 'rgba(226,216,196,0.20)');
      vg.addColorStop(1, 'rgba(226,216,196,0)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      const cx = W * 0.5, cy = H * 0.47;
      const R = H * 0.40;

      // 当前进度：第几段、段内位置
      const el = Math.max(0, t - START);
      const cyc = HOLD + MORPH;
      let idx = Math.floor(el / cyc);
      let local = el - idx * cyc;
      idx = Math.min(idx, SHAPES.length - 1);
      const next = Math.min(idx + 1, SHAPES.length - 1);
      let mix = 0;
      if (idx < SHAPES.length - 1 && local > HOLD) mix = U.smooth((local - HOLD) / MORPH);
      if (t < START) { idx = 0; mix = 0; }

      const A = SHAPES[idx], B = SHAPES[next];
      const boilF = Math.floor(t * 12);
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = A[i], b = B[i];
        const mx = U.lerp(a[0], b[0], mix);
        const my = U.lerp(a[1], b[1], mix);
        // 形变中段给一点挤压拉伸，掩盖线性插值的机械感
        const sq = Math.sin(mix * Math.PI);
        const sx = 1 + 0.07 * sq, sy = 1 - 0.07 * sq;
        const bx = (U.hash(i * 3.1 + boilF * 7.7) - 0.5) * 2.6;
        const by = (U.hash(i * 5.3 + boilF * 9.1) - 0.5) * 2.6;
        pts.push([cx + mx * sx * R + bx, cy + my * sy * R + by]);
      }

      // 形变进入时的轻微旋转
      const rot = Math.sin(mix * Math.PI) * 0.06;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.translate(-cx, -cy);

      // 线下的浅影，纸感
      ctx.save();
      ctx.translate(4, 5);
      ctx.strokeStyle = 'rgba(40,44,50,0.10)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // 主墨线：线宽随形变轻微呼吸
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8.5 + 2.5 * Math.sin(mix * Math.PI);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      ctx.stroke();

      // 笔尖：沿轮廓跑的一颗朱点
      const dotI = Math.floor(((t * 0.55) % 1) * N);
      ctx.fillStyle = CORAL;
      ctx.beginPath();
      ctx.arc(pts[dotI][0], pts[dotI][1], 7, 0, Math.PI * 2);
      ctx.fill();

      // 停住的时候，形里掉进一个小小的朱点（像盖一下）
      if (idx === SHAPES.length - 1 && t > 8.9) {
        const k = U.p(t, 9.0, 0.35);
        if (k > 0) {
          ctx.globalAlpha = 0.9 * k;
          ctx.fillStyle = CORAL;
          ctx.beginPath();
          ctx.arc(cx + R * 0.02, cy + R * 0.02, 6 + 4 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();

      // 框里的字
      if (idx === SHAPES.length - 1 && mix > 0.7 || (idx === SHAPES.length - 1 && t > 9.0)) {
        const k = U.clamp((t - 9.0) / 0.4);
        ctx.save();
        ctx.globalAlpha = k;
        ctx.fillStyle = INK;
        ctx.font = '800 ' + Math.round(H * 0.055) + 'px "Microsoft YaHei", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('一条线', cx, cy + 2);
        ctx.restore();
      }

      // 角标
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#3a352b';
      ctx.font = '600 ' + Math.round(H * 0.018) + 'px "Segoe UI", sans-serif';
      ctx.fillText('ONE LINE   ·   08', W * 0.055, H * 0.945);
      ctx.restore();
    },
  };
})();
