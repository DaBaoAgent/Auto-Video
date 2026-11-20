/* 综艺花字 · 深夜一碗面（自研）
   题材避开上游的"猫脸 + 漫画爆炸"，改成一碗宵夜：台灯、热气、夹起的面、煎蛋，
   上面压综艺花字：多层描边胖体、弹性 pop、逐字错帧、爆炸框、认证章。竖屏 9:16。 */
(() => {
  const PINK = '#ff3d6e';
  const YELLOW = '#ffcf33';
  const CYAN = '#35d7ff';

  // 多层描边花字：外彩边 → 白粗边 → 渐变填充 → 投影
  function hanazi(ctx, text, x, y, size, fill, rot, scale, alpha, stagger, t, born) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.font = '800 ' + size + 'px "Microsoft YaHei", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = [...text];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let cx = -total / 2;
    chars.forEach((ch, i) => {
      const local = U.clamp((t - born - i * stagger) / 0.34);
      if (local <= 0) { cx += widths[i]; return; }
      const pop = local < 0.55
        ? U.lerp(0, 1.16, U.easeOut(local / 0.55))
        : U.lerp(1.16, 1, U.easeOut((local - 0.55) / 0.45));
      ctx.save();
      ctx.translate(cx + widths[i] / 2, Math.sin(t * 3.1 + i) * 4);
      ctx.rotate(Math.sin(t * 2.2 + i * 1.7) * 0.03);
      ctx.scale(pop, pop);
      ctx.fillStyle = 'rgba(30,6,16,0.4)';
      ctx.fillText(ch, 6, 9);
      ctx.lineWidth = size * 0.20;
      ctx.strokeStyle = fill.outer;
      ctx.strokeText(ch, 0, 0);
      ctx.lineWidth = size * 0.10;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(ch, 0, 0);
      const g = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
      g.addColorStop(0, fill.top);
      g.addColorStop(1, fill.bottom);
      ctx.fillStyle = g;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      cx += widths[i];
    });
    ctx.restore();
  }

  function burstShape(ctx, x, y, r, color, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const rr = i % 2 === 0 ? r : r * 0.72;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 0.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 1.06, Math.sin(a) * r * 1.06);
      ctx.lineTo(Math.cos(a) * r * 1.32, Math.sin(a) * r * 1.32);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 面条：一组带波动的曲线；被筷子夹起时，条头一起收向筷子尖
  function noodles(ctx, x, y, w, t, lf, tipX, tipY) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < 9; i++) {
        const u = i / 8;
        const lw = 14 + 4 * Math.sin(i * 1.7);
        ctx.strokeStyle = pass ? '#f9e0aa' : 'rgba(110,58,22,0.55)';
        ctx.lineWidth = pass ? lw : lw + 3;
        const off = pass ? 0 : 3;
        ctx.beginPath();
        const sx = x + (u - 0.5) * w * 0.78;
        const sy = y + 12 + Math.sin(i * 2.1) * 6 + off;
        ctx.moveTo(sx, sy);
        const looseX = sx + 12 * Math.sin(i * 0.9);
        const looseY = y - w * 0.10 * (0.3 + 0.5 * Math.sin(i * 1.3)) + off;
        const ex = U.lerp(looseX, tipX + (i - 4) * 6, lf);
        const ey = U.lerp(looseY, tipY + (i - 4) * 4 + off, lf);
        ctx.quadraticCurveTo(sx + 26 * Math.sin(t * 1.8 + i) * (1 - lf), (sy + ey) * 0.5, ex, ey);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  window.SCENES = window.SCENES || {};
  window.SCENES.huazi = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;

      // 手持抖动 + 推镜
      const zoom = 1.03 + 0.05 * Math.sin(t * 0.6) + 0.05 * U.p(t, 4.4, 0.5) - 0.05 * U.p(t, 6.4, 0.5);
      ctx.save();
      ctx.translate(W * 0.5 + Math.sin(t * 7.9) * 5, H * 0.5 + Math.cos(t * 6.7) * 6);
      ctx.scale(zoom, zoom);
      ctx.translate(-W * 0.5, -H * 0.5);

      // 墙
      const wall = ctx.createLinearGradient(0, 0, 0, H * 0.62);
      wall.addColorStop(0, '#2c1d1c');
      wall.addColorStop(1, '#4a2f26');
      ctx.fillStyle = wall;
      ctx.fillRect(-W * 0.3, -H * 0.3, W * 1.6, H * 0.92);
      // 瓷砖缝
      ctx.strokeStyle = 'rgba(255,220,180,0.07)';
      ctx.lineWidth = 2;
      for (let y = H * 0.06; y < H * 0.6; y += H * 0.09) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      for (let x = 0; x < W; x += W * 0.14) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H * 0.6); ctx.stroke();
      }

      // 台灯光斑
      const glow = ctx.createRadialGradient(W * 0.5, H * 0.30, 0, W * 0.5, H * 0.30, W * 0.75);
      glow.addColorStop(0, 'rgba(255,186,110,0.40)');
      glow.addColorStop(1, 'rgba(255,186,110,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H * 0.85);

      // 桌面
      const table = ctx.createLinearGradient(0, H * 0.58, 0, H);
      table.addColorStop(0, '#7a4a30');
      table.addColorStop(1, '#4a2a1c');
      ctx.fillStyle = table;
      ctx.fillRect(-W * 0.3, H * 0.58, W * 1.6, H * 0.5);
      ctx.strokeStyle = 'rgba(255,200,150,0.13)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 7; i++) {
        const y = H * (0.61 + i * 0.055);
        ctx.beginPath();
        ctx.moveTo(0, y + Math.sin(i) * 8);
        ctx.quadraticCurveTo(W * 0.5, y + Math.sin(i * 2) * 10, W, y + Math.cos(i) * 8);
        ctx.stroke();
      }

      const cx = W * 0.5, cy = H * 0.70, br = W * 0.32;

      U.softShadow(ctx, cx, cy + br * 0.55, br * 1.3, br * 0.35, 0.35);

      // 蒸汽（先画，压在碗后）
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = 'rgba(255,240,220,' + (0.14 + i * 0.02) + ')';
        ctx.lineWidth = 10 - i * 2;
        ctx.beginPath();
        const sx = cx + (i - 1) * br * 0.34;
        for (let k = 0; k <= 20; k++) {
          const u = k / 20;
          const y = cy - br * 0.45 - u * H * 0.20;
          const x = sx + Math.sin(u * 3.4 + t * 1.5 + i) * br * 0.09 + u * 18 * (i - 1);
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 碗：口沿椭圆 + 下半碗身
      ctx.fillStyle = '#efe6d6';
      ctx.beginPath();
      ctx.ellipse(cx, cy, br, br * 0.66, 0, 0, Math.PI);
      ctx.fill();
      // 碗身侧面
      const side = ctx.createLinearGradient(cx - br, 0, cx + br, 0);
      side.addColorStop(0, 'rgba(120,90,60,0.30)');
      side.addColorStop(0.35, 'rgba(255,255,255,0)');
      side.addColorStop(0.75, 'rgba(255,255,255,0.18)');
      side.addColorStop(1, 'rgba(110,80,55,0.34)');
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, br, br * 0.66, 0, 0, Math.PI);
      ctx.clip();
      ctx.fillStyle = side;
      ctx.fillRect(cx - br, cy, br * 2, br * 0.66);
      ctx.restore();

      // 碗口内壁
      ctx.fillStyle = '#e6dac6';
      ctx.beginPath();
      ctx.ellipse(cx, cy, br * 0.96, br * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // 汤
      ctx.fillStyle = '#c9762a';
      ctx.beginPath();
      ctx.ellipse(cx, cy + br * 0.01, br * 0.90, br * 0.205, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,196,118,0.55)';
      ctx.beginPath();
      ctx.ellipse(cx - br * 0.12, cy - br * 0.055, br * 0.48, br * 0.075, -0.08, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = 'rgba(255,214,140,0.7)';
        ctx.beginPath();
        ctx.arc(cx + (U.hash(i * 7) - 0.5) * br * 1.4, cy + (U.hash(i * 11) - 0.5) * br * 0.30,
          2 + U.hash(i * 3) * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 口沿高光 + 釉下蓝线
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.ellipse(cx, cy, br * 0.98, br * 0.255, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#3f7f96';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, cy + br * 0.02, br * 0.93, br * 0.225, 0, 0.08, Math.PI - 0.08);
      ctx.stroke();

      const liftT = U.p(t, 4.5, 1.3) * (1 - U.p(t, 6.1, 0.7));
      noodles(ctx, cx, cy + br * 0.01, br * 1.16, t, U.easeInOut(liftT), cx + br * 0.42, cy - br * 0.34);

      // 煎蛋
      ctx.save();
      ctx.translate(cx + br * 0.36, cy - br * 0.04);
      ctx.rotate(0.12);
      ctx.fillStyle = '#fbf4e2';
      ctx.beginPath();
      ctx.ellipse(0, 0, br * 0.26, br * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffb52e';
      ctx.beginPath();
      ctx.ellipse(-br * 0.03, -br * 0.025, br * 0.10, br * 0.085, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(-br * 0.06, -br * 0.05, br * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 葱花
      for (let i = 0; i < 7; i++) {
        ctx.save();
        ctx.translate(cx - br * 0.5 + U.hash(i * 13) * br, cy - br * 0.06 + U.hash(i * 17) * br * 0.14);
        ctx.rotate(U.hash(i * 19) * 3);
        ctx.fillStyle = '#4f8f3f';
        ctx.fillRect(-7, -3, 14, 6);
        ctx.fillStyle = '#7cb862';
        ctx.fillRect(-5, -2, 10, 2);
        ctx.restore();
      }

      // 筷子
      const dip = U.p(t, 4.4, 0.5) * (1 - U.p(t, 5.9, 0.6));
      const px = cx + br * 0.55, py = cy - br * (0.62 - 0.10 * dip);
      ctx.save();
      ctx.strokeStyle = '#7d4f2c';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px + W * 0.20, py - H * 0.20);
      ctx.lineTo(px + br * 0.02, cy - br * 0.10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + W * 0.22, py - H * 0.205);
      ctx.lineTo(px + br * 0.10, cy - br * 0.08);
      ctx.stroke();
      // 筷子尖的段纹
      ctx.strokeStyle = 'rgba(255,220,180,0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const k = 0.55 + i * 0.14;
        const x1 = U.lerp(px + W * 0.20, px + br * 0.02, k);
        const y1 = U.lerp(py - H * 0.20, cy - br * 0.10, k);
        ctx.beginPath();
        ctx.arc(x1, y1, 12, -0.6, 0.6);
        ctx.stroke();
      }
      ctx.restore();

      // 桌面反光
      const ref = ctx.createRadialGradient(cx, cy + br * 0.7, 0, cx, cy + br * 0.7, br * 1.5);
      ref.addColorStop(0, 'rgba(255,190,120,0.16)');
      ref.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = ref;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);

      ctx.restore();

      // 暗角
      const vg = ctx.createRadialGradient(W * 0.5, H * 0.55, H * 0.3, W * 0.5, H * 0.55, W * 0.78);
      vg.addColorStop(0, 'rgba(20,10,10,0)');
      vg.addColorStop(1, 'rgba(20,10,10,0.55)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // ---- 花字 ----
      const pop = (t0) => U.clamp((t - t0) / 0.30);

      const t1 = pop(0.30);
      if (t1 > 0) {
        hanazi(ctx, '深夜放毒', W * 0.5, H * 0.145, H * 0.076,
          { top: '#ffe98a', bottom: YELLOW, outer: PINK }, -0.04,
          0.9 + 0.25 * U.back(t1), Math.min(1, t1 * 1.6), 0.07, t, 0.30);
      }

      const t2 = pop(1.9);
      if (t2 > 0) {
        hanazi(ctx, '第一口', W * 0.28, H * 0.40, H * 0.062,
          { top: '#ffffff', bottom: CYAN, outer: '#ff3b2f' }, 0.08,
          0.85 + 0.3 * U.back(t2), Math.min(1, t2 * 1.6), 0.07, t, 1.9);
      }

      if (t > 3.3) {
        const k = U.clamp((t - 3.3) / 0.35);
        ctx.save();
        ctx.translate(W * 0.63, H * 0.52);
        ctx.rotate(0.14);
        ctx.scale(0.55 + 0.6 * U.back(k), 0.55 + 0.6 * U.back(k));
        burstShape(ctx, 0, 0, H * 0.085, YELLOW, t);
        ctx.restore();
        hanazi(ctx, '香到犯规!!', W * 0.63, H * 0.52, H * 0.046,
          { top: '#fff', bottom: YELLOW, outer: '#ff4a1f' }, 0.14, 1, k, 0.05, t, 3.3);
      }

      const t4 = pop(4.9);
      if (t4 > 0) {
        ctx.save();
        ctx.globalAlpha = 0.92 * Math.min(1, t4 * 1.4);
        ctx.translate(W * 0.62, H * 0.335);
        ctx.rotate(-0.07);
        ctx.font = '600 ' + Math.round(H * 0.030) + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = H * 0.008;
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.strokeText('（小声）碳水快乐', 0, 0);
        ctx.fillStyle = '#453035';
        ctx.fillText('（小声）碳水快乐', 0, 0);
        ctx.restore();
      }

      const t5 = pop(6.2);
      if (t5 > 0) {
        hanazi(ctx, '绝了', W * 0.38, H * 0.865, H * 0.066,
          { top: '#ffffff', bottom: CYAN, outer: PINK }, -0.05,
          0.85 + 0.3 * U.back(t5), Math.min(1, t5 * 1.5), 0.07, t, 6.2);
        for (let i = 0; i < 5; i++) {
          const sa = U.clamp((t - 6.4 - i * 0.08) / 0.4);
          if (sa <= 0) continue;
          ctx.save();
          ctx.globalAlpha = sa * (0.75 + 0.25 * Math.sin(t * 8 + i));
          ctx.fillStyle = '#fff6b0';
          ctx.translate(W * (0.20 + i * 0.13), H * (0.80 - (i % 2) * 0.05));
          ctx.rotate(t * 2 + i);
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const rr = k % 2 === 0 ? 20 : 7;
            ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      if (t > 7.5) {
        const k = U.clamp((t - 7.5) / 0.35);
        ctx.save();
        ctx.translate(W * 0.74, H * 0.62);
        ctx.rotate(-0.2);
        ctx.scale(1.4 - 0.4 * U.back(k), 1.4 - 0.4 * U.back(k));
        ctx.globalAlpha = k;
        ctx.strokeStyle = '#ff3d3d';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(-H * 0.095, -H * 0.042, H * 0.19, H * 0.084, 8);
        ctx.stroke();
        ctx.fillStyle = '#ff3d3d';
        ctx.font = '800 ' + Math.round(H * 0.025) + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('干饭人认证', 0, 4);
        ctx.font = '600 ' + Math.round(H * 0.013) + 'px "Segoe UI", sans-serif';
        ctx.fillText('CERTIFIED  ·  23:40', 0, H * 0.028);
        ctx.restore();
      }

      // 顶部小字
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = '#f0cfa0';
      ctx.font = '600 ' + Math.round(H * 0.016) + 'px "Segoe UI", sans-serif';
      ctx.fillText('EP.07  ·  深夜食堂', W * 0.06, H * 0.055);
      ctx.restore();
    },
  };
})();
