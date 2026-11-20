/* yuanzhu · 圆珠笔（Auto-Video 自研画法脚本）
   媒介：一支蓝色圆珠笔在奶油色卡纸上，线宽几乎不变，明暗只靠排线堆，
   笔画收笔那一下会积一个小墨点。
   题材：一块怀表，链子拖出画面左上。
   实现：轮廓、刻度、排线、积墨都在本文件里算；排线成组出现，不一根根跳。 */
(() => {
  const W = 1920, H = 1080;
  const BLUE = '38,62,132';
  const CX = 980, CY = 540, R = 330;

  function ball(ctx, pts, frac, w = 2.2, a = 1) {
    if (frac <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(${BLUE},${a})`;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let p = 0; p < 2; p++) {
      ctx.lineWidth = w + p * 0.5;
      ctx.globalAlpha = a * (p ? 0.32 : 0.92);
      U.tracePartial(ctx, pts, frac);
    }
    if (frac > 0.97) {
      const last = pts[pts.length - 1];
      ctx.globalAlpha = a * 0.55;
      ctx.fillStyle = `rgba(${BLUE},1)`;
      ctx.beginPath();
      ctx.arc(last[0], last[1], w * 1.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function circlePts(cx, cy, r, n = 72, a0 = 0, a1 = Math.PI * 2) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  }
  function hatch(ctx, x, y, w, h, angle, gap, alpha, frac) {
    if (frac <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(${BLUE},1)`;
    ctx.lineWidth = 1.6;
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const nx = -dy, ny = dx;
    const diag = Math.hypot(w, h);
    const count = Math.ceil(diag / gap);
    const show = Math.floor(count * U.clamp(frac));
    for (let i = 0; i < show; i++) {
      const off = -diag / 2 + i * gap;
      const mx = x + w / 2 + nx * off, my = y + h / 2 + ny * off;
      ctx.beginPath();
      ctx.moveTo(mx - dx * diag * 0.5, my - dy * diag * 0.5);
      ctx.lineTo(mx + dx * diag * 0.5, my + dy * diag * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 链：从左上方垂下来，接到表冠
  function chainPath() {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const k = i / 40;
      const x = CX - 60 - k * 470;
      const y = CY - R - 6 - Math.sin(k * Math.PI * 1.15) * 150 + k * 96;
      pts.push([x, y]);
    }
    return pts;
  }
  const CHAIN = chainPath();

  window.SCENES.yuanzhu = {
    init: async () => {},
    draw(ctx, t) {
      U.paper(ctx, W, H, '#efe6cf', 55, 0.5);
      const vg = ctx.createRadialGradient(CX - 120, CY - 160, 220, CX, CY, W * 0.72);
      vg.addColorStop(0, 'rgba(255,252,240,0.12)');
      vg.addColorStop(1, 'rgba(120,104,74,0.20)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // 01 表壳：两遍，收在十二点
      ball(ctx, circlePts(CX, CY, R, 84), U.easeInOut(U.p(t, 0.3, 1.4)), 2.8, 0.95);
      ball(ctx, circlePts(CX, CY, R - 7, 84), U.easeInOut(U.p(t, 1.0, 1.1)), 1.9, 0.66);
      // 表冠
      ball(ctx, [[CX - 30, CY - R - 2], [CX - 30, CY - R - 46], [CX + 30, CY - R - 46], [CX + 30, CY - R - 2]], U.easeOut(U.p(t, 1.5, 0.5)), 2.2, 0.85);
      // 链
      ball(ctx, CHAIN, U.easeInOut(U.p(t, 1.7, 1.3)), 2.2, 0.88);
      const links = U.easeOut(U.p(t, 2.3, 1.1));
      if (links > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(${BLUE},0.78)`;
        ctx.lineWidth = 1.5;
        const total = 11;
        for (let i = 0; i < total; i++) {
          if (i / total > links) break;
          const p = CHAIN[Math.round((i / total) * (CHAIN.length - 1))];
          const q = CHAIN[Math.min(CHAIN.length - 1, Math.round((i / total) * (CHAIN.length - 1)) + 2)];
          const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
          ctx.beginPath();
          ctx.ellipse(p[0], p[1], 15, 7.5, ang + (i % 2 ? 0.55 : -0.55), 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 02 表盘：内圈、刻度、小秒盘、指针
      ball(ctx, circlePts(CX, CY, R - 44, 76), U.easeInOut(U.p(t, 2.7, 0.9)), 1.8, 0.7);
      ball(ctx, circlePts(CX - 78, CY + 84, 62, 44), U.easeInOut(U.p(t, 3.0, 0.5)), 1.4, 0.55);
      const tick = U.easeOut(U.p(t, 3.1, 1.0));
      if (tick > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(${BLUE},0.86)`;
        for (let i = 0; i < 60; i++) {
          if (i / 60 > tick) break;
          const a = (Math.PI * 2 * i) / 60 - Math.PI / 2;
          const long = i % 5 === 0;
          const r0 = R - 44, r1 = r0 - (long ? 30 : 13);
          ctx.lineWidth = long ? 2.4 : 1.3;
          ctx.beginPath();
          ctx.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0);
          ctx.lineTo(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1);
          ctx.stroke();
        }
        // 小秒盘刻度
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(CX - 78 + Math.cos(a) * 58, CY + 84 + Math.sin(a) * 58);
          ctx.lineTo(CX - 78 + Math.cos(a) * 50, CY + 84 + Math.sin(a) * 50);
          ctx.stroke();
        }
        ctx.restore();
      }
      ball(ctx, [[CX, CY], [CX - 84, CY + 122]], U.easeInOut(U.p(t, 3.7, 0.5)), 3.0, 0.95);
      ball(ctx, [[CX, CY], [CX + 146, CY - 54]], U.easeInOut(U.p(t, 4.0, 0.5)), 2.0, 0.9);
      ball(ctx, [[CX - 78, CY + 84], [CX - 62, CY + 44]], U.easeOut(U.p(t, 4.2, 0.35)), 1.6, 0.8);
      ctx.save();
      ctx.fillStyle = `rgba(${BLUE},0.92)`;
      ctx.beginPath();
      ctx.arc(CX, CY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 03 排线：表壳右侧与下沿，越靠边越密
      hatch(ctx, CX + 46, CY + 40, R * 1.45, R * 1.15, -0.72, 12, 0.52, U.easeInOut(U.p(t, 4.4, 0.8)));
      hatch(ctx, CX + 96, CY + 132, R * 1.2, R * 0.75, 0.6, 16, 0.42, U.easeInOut(U.p(t, 5.0, 0.8)));
      hatch(ctx, CX + 10, CY + 236, R * 1.35, 100, -1.18, 10, 0.46, U.easeInOut(U.p(t, 5.6, 0.7)));

      // 04 表壳外沿：只画受光的那一段，把圆收紧
      ball(ctx, circlePts(CX, CY, R + 16, 84, Math.PI * 0.08, Math.PI * 0.92), U.easeInOut(U.p(t, 5.3, 0.8)), 1.5, 0.55);

      // 05 桌面投影：横向排线
      hatch(ctx, CX - R + 40, CY + R + 6, R * 1.9, 74, 0.06, 9, 0.34, U.easeOut(U.p(t, 6.3, 0.8)));
    },
  };
})();
