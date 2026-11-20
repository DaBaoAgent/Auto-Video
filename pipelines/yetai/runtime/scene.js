/* 液态流动 · 墨入奶（自研）
   俯拍的浅盘牛奶，墨滴从上方落下：撞击成环 → 指状扩散 → 两色交融 → 打旋 → 收成一枚墨印。
   刻意与上游"3D 玻璃团块"分开：这里没有球体高光，只有俯视的平面墨迹、涟漪与丝状边缘。 */
(() => {
  const CREAM = '#f2ece0';
  const MILK = '#fcf8ef';
  const INKS = { indigo: '#1d2b6e', coral: '#cf4034', teal: '#28665c' };

  // 泼墨轮廓的路径（只建路径，填色/裁切各自来）
  function blotPath(ctx, cx, cy, R, seed, t) {
    const n = 160;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 0.62
        + 0.26 * Math.sin(3.1 * a + seed * 2.1 + t * 0.9)
        + 0.12 * Math.sin(6.7 * a - seed * 1.3 + t * 1.4)
        + 0.08 * U.noise(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + seed * 0.7);
      const r = R * wob;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // 泼墨轮廓：极坐标半径被人为扰动，边缘永远是波浪，不是几何圆
  function blot(ctx, cx, cy, R, seed, t, color, alpha) {
    blotPath(ctx, cx, cy, R, seed, t);
    ctx.fillStyle = U.rgba(color, alpha);
    ctx.fill();
  }

  // 奶纹：在墨块里面留几道奶白的丝，墨才像"淌进奶里"而不是一块色
  function milkVeins(ctx, cx, cy, R, seed, t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    blotPath(ctx, cx, cy, R * 0.96, seed, t);
    ctx.clip();
    ctx.strokeStyle = U.rgba(MILK, alpha);
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const yy = cy + (i - 2) * R * 0.28;
      ctx.lineWidth = 4 + U.hash(seed + i) * 6;
      ctx.beginPath();
      ctx.moveTo(cx - R * 1.1, yy);
      ctx.bezierCurveTo(
        cx - R * 0.4, yy - R * 0.35 + Math.sin(t * 0.8 + i) * 8,
        cx + R * 0.3, yy + R * 0.40,
        cx + R * 1.1, yy - R * 0.18
      );
      ctx.stroke();
    }
    // 两颗没被墨盖住的奶泡
    ctx.fillStyle = U.rgba(MILK, alpha * 1.2);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + (U.hash(seed + i * 4) - 0.5) * R * 1.1, cy + (U.hash(seed + i * 9) - 0.5) * R * 0.8,
        R * (0.03 + U.hash(seed + i * 7) * 0.05), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 丝：从墨心甩出去的细线，像奶里被拉开的墨
  function filaments(ctx, cx, cy, R, seed, t, color, count, alpha) {
    ctx.save();
    ctx.strokeStyle = U.rgba(color, alpha);
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + U.hash(seed + i) * 0.4;
      const len = R * (0.9 + U.hash(seed + i * 3) * 0.8);
      const wob = 0.22 * Math.sin(t * 1.2 + i);
      ctx.lineWidth = 2 + U.hash(seed + i * 5) * 3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.45);
      ctx.quadraticCurveTo(
        cx + Math.cos(a + wob) * len * 0.7, cy + Math.sin(a + wob) * len * 0.7,
        cx + Math.cos(a + wob * 1.8) * len, cy + Math.sin(a + wob * 1.8) * len
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function ripple(ctx, cx, cy, r, alpha, w = 2) {
    if (alpha <= 0 || r <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(30,36,60,${alpha})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  window.SCENES = window.SCENES || {};
  window.SCENES.yetai = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;
      U.paper(ctx, W, H, CREAM, 3, 0.5);

      const cx = W * 0.5, cy = H * 0.48;
      const dishR = H * 0.43;

      // 定机位：缓慢推近 + 轻微旋转，像俯拍支架在动
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.004 * Math.sin(t * 0.35));
      const cam = 1.06 + 0.08 * U.smooth(U.p(t, 0, 10));
      ctx.scale(cam, cam);
      ctx.translate(-cx, -cy);

      // 盘子的影
      U.softShadow(ctx, cx + 8, cy + 14, dishR * 1.12, dishR * 1.12, 0.22);

      // 盘
      ctx.fillStyle = '#eae2d2';
      ctx.beginPath();
      ctx.arc(cx, cy, dishR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = MILK;
      ctx.beginPath();
      ctx.arc(cx, cy, dishR * 0.965, 0, Math.PI * 2);
      ctx.fill();
      // 盘沿
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, dishR * 0.975, 0, Math.PI * 2);
      ctx.stroke();

      // 奶面：淡淡的既有涟漪（开场第 0 帧就有画面）
      for (let i = 0; i < 3; i++) {
        ripple(ctx, cx, cy, dishR * (0.55 + i * 0.13), 0.10 - i * 0.02, 1.5);
      }
      ctx.fillStyle = 'rgba(210,200,180,0.18)';
      ctx.beginPath();
      ctx.arc(cx - dishR * 0.2, cy - dishR * 0.22, dishR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // ---- 墨滴 1（靛蓝，主笔）----
      const d1 = 1.05, hit1 = 1.42;
      if (t < hit1) {
        const p = U.clamp((t - d1) / (hit1 - d1));
        const y = U.lerp(-H * 0.05, cy - H * 0.02, p * p);
        const r = H * 0.020;
        ctx.fillStyle = INKS.indigo;
        ctx.beginPath();
        ctx.arc(cx, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(29,43,110,0.55)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx, y - r);
        ctx.lineTo(cx - 2, y - r - H * 0.06 * p);
        ctx.stroke();
      }
      if (t > hit1) {
        const gt = U.clamp((t - hit1) / 2.1);
        const grow = U.easeOut(gt);
        const R1 = dishR * 0.46 * (0.22 + 0.78 * grow);
        // 撞击环
        for (let i = 0; i < 3; i++) {
          const rt = U.p(t, hit1 + i * 0.12, 1.4);
          if (rt > 0 && rt < 1) ripple(ctx, cx, cy, dishR * 0.14 + rt * dishR * 0.34, 0.28 * (1 - rt), 2.5);
        }
        blot(ctx, cx, cy, R1, 1.3, t, INKS.indigo, 0.94);
        blot(ctx, cx + R1 * 0.12, cy - R1 * 0.06, R1 * 0.72, 2.6, t, INKS.indigo, 0.55);
        milkVeins(ctx, cx, cy, R1 * 1.02, 5.5, t, 0.30 * U.clamp(grow * 2));
        if (grow > 0.4) filaments(ctx, cx, cy, R1 * 1.25, 5, t, INKS.indigo, 18, 0.32 * U.clamp((grow - 0.4) * 3));
      }

      // ---- 墨滴 2（朱红，落在侧边与蓝交融）----
      const d2 = 2.55, hit2 = 2.92;
      const c2x = cx + dishR * 0.20, c2y = cy + dishR * 0.12;
      if (t > d2 && t < hit2) {
        const p = U.clamp((t - d2) / (hit2 - d2));
        ctx.fillStyle = INKS.coral;
        ctx.beginPath();
        ctx.arc(c2x, U.lerp(-H * 0.06, c2y, p * p), H * 0.014, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t > hit2) {
        const gt = U.clamp((t - hit2) / 1.9);
        const R2 = dishR * 0.20 * (0.2 + 0.8 * U.easeOut(gt));
        ripple(ctx, c2x, c2y, R2 * 2.4 + dishR * 0.05, 0.22 * (1 - gt), 2);
        blot(ctx, c2x, c2y, R2, 3.7, t, INKS.coral, 0.62);
        blot(ctx, c2x - R2 * 0.1, c2y + R2 * 0.08, R2 * 0.6, 4.1, t, INKS.coral, 0.40);
        filaments(ctx, c2x, c2y, R2 * 1.5, 9, t, INKS.coral, 10, 0.26 * U.clamp(gt * 2));
      }

      // ---- 墨滴 3（青，细，二次落点带来第三层网纹）----
      const d3 = 4.1, hit3 = 4.42;
      const c3x = cx - dishR * 0.16, c3y = cy - dishR * 0.18;
      if (t > d3 && t < hit3) {
        const p = U.clamp((t - d3) / (hit3 - d3));
        ctx.fillStyle = INKS.teal;
        ctx.beginPath();
        ctx.arc(c3x, U.lerp(-H * 0.02, c3y, p * p), H * 0.010, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t > hit3) {
        const gt = U.clamp((t - hit3) / 1.6);
        blot(ctx, c3x, c3y, dishR * 0.13 * (0.2 + 0.8 * U.easeOut(gt)), 6.2, t, INKS.teal, 0.5);
        filaments(ctx, c3x, c3y, dishR * 0.22, 12, t, INKS.teal, 8, 0.24 * gt);
      }

      // ---- 打旋：整盘墨迹在 5.4–7.4 之间被搅动 ----
      const sw = U.p(t, 5.4, 2.0);
      if (sw > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(29,43,110,${0.30 * Math.sin(sw * Math.PI)})`;
        ctx.lineWidth = 3;
        for (let s = 0; s < 4; s++) {
          ctx.beginPath();
          const rr = dishR * (0.30 + s * 0.06);
          for (let i = 0; i <= 60; i++) {
            const a = (i / 60) * Math.PI * 2 * 1.15 + sw * 2.2 + s * 0.7;
            const rad = rr * (1 + 0.06 * Math.sin(a * 3));
            const x = cx + Math.cos(a) * rad;
            const y = cy + Math.sin(a) * rad;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // ---- 收成一枚墨印 ----
      const seal = U.p(t, 6.8, 1.1);
      if (seal > 0) {
        const bias = U.easeInOut(seal);
        const sr = dishR * (0.34 + 0.02 * bias);
        ctx.save();
        ctx.globalAlpha = 0.96;
        ctx.translate(cx, cy);
        blot(ctx, 0, 0, sr, 2.1, 0.4, INKS.indigo, 0.97);
        ctx.strokeStyle = U.rgba(MILK, 0.9);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, sr * 0.80, 0, Math.PI * 2);
        ctx.stroke();
        // 印里的奶白字
        ctx.globalAlpha = U.clamp((seal - 0.35) / 0.5);
        ctx.fillStyle = MILK;
        ctx.font = '900 ' + Math.round(sr * 0.62) + 'px "STSong", "SimSun", "Microsoft YaHei", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('墨', 0, sr * 0.02);
        ctx.restore();
      }

      // 片尾那一小滴（8.9 秒）
      const dd = 8.9;
      if (t > dd) {
        const p = U.p(t, dd, 0.4);
        if (p < 1) {
          ctx.fillStyle = INKS.coral;
          ctx.beginPath();
          ctx.arc(cx + dishR * 0.02, cy - H * 0.02 - p * H * 0.02, H * 0.008, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const rt = U.p(t, dd + 0.4, 0.9);
          ripple(ctx, cx, cy - H * 0.02, dishR * 0.10 + rt * dishR * 0.10, 0.18 * (1 - rt), 2);
        }
      }

      // 角标
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#3a3226';
      ctx.font = '600 ' + Math.round(H * 0.018) + 'px "Segoe UI", sans-serif';
      ctx.fillText('INK IN MILK   ·   07', W * 0.055, H * 0.945);
      ctx.restore();

      ctx.restore();
    },
  };
})();
