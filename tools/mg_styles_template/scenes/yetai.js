/* 液态流动 · 墨落进牛奶（自研 v3）
   俯拍浅盘，墨滴一枚枚落下：撞出冠环与飞溅小滴 → 长成旋转的指状墨团 →
   多色在奶里互相咬合 → 打旋拉出旋臂 → 收成一枚墨印。
   没有球体高光、没有玻璃倒影：只有平面墨迹、涟漪、奶纹与边缘的深色圈。 */
(() => {
  const CREAM = '#efe7d8';
  const MILK = '#fcf8ef';
  const INKS = { indigo: '#1a2a60', violet: '#43265f', coral: '#c33a2b', teal: '#1f5a4f', gold: '#bd8628' };

  // 墨团轮廓：半径被几组正弦扰动；phase 让它在奶里缓慢自转
  function blobPath(ctx, cx, cy, R, seed, phase, rot = 1) {
    const n = 180;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 0.62
        + 0.17 * Math.sin(3.0 * a + phase * rot + seed * 2.1)
        + 0.11 * Math.sin(4.0 * a - phase * 1.3 * rot + seed * 1.7)
        + 0.09 * Math.sin(7.0 * a + phase * 1.6 + seed * 3.3)
        + 0.05 * U.noise(Math.cos(a) * 1.8 + seed, Math.sin(a) * 1.8 + seed * 0.6);
      const r = R * wob;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  // 一团墨：外晕 → 本体（正片叠底让叠色变深）→ 边圈
  function inkBlob(ctx, cx, cy, R, seed, phase, color, alpha, deep) {
    if (R <= 1) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha * 0.12;
    blobPath(ctx, cx, cy, R * 1.16, seed, phase);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = alpha;
    blobPath(ctx, cx, cy, R, seed, phase);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // 边：墨在奶里会积一圈更深的边
    ctx.strokeStyle = U.rgba(deep || color, 0.42);
    ctx.lineWidth = 5;
    blobPath(ctx, cx, cy, R, seed, phase);
    ctx.stroke();
    ctx.restore();
  }

  // 奶纹：墨块里的奶白丝，绕成弧形，随时间慢慢转
  function milkVeins(ctx, cx, cy, R, seed, phase, alpha) {
    if (alpha <= 0 || R <= 1) return;
    ctx.save();
    blobPath(ctx, cx, cy, R * 0.94, seed, phase);
    ctx.clip();
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a0 = phase * 0.8 + i * 0.9;
      const rr = R * (0.30 + i * 0.11);
      ctx.strokeStyle = U.rgba(MILK, alpha * (0.55 + i * 0.07));
      ctx.lineWidth = 4 + (i % 3) * 3;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const u = k / 24;
        const a = a0 + u * 1.5;
        const r = rr * (1 + 0.25 * Math.sin(u * 3 + i));
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.9;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 落到奶面的溅滴：先飞出去，再被表面张力拉回
  function splash(ctx, cx, cy, t0, t, R, color, seed) {
    const p = U.clamp((t - t0) / 0.55);
    if (p <= 0 || p >= 1) return;
    for (let i = 0; i < 9; i++) {
      const a = seed + (i / 9) * Math.PI * 2 + U.hash(i + seed) * 0.4;
      const dist = R * (0.45 + p * 1.15) * (0.8 + U.hash(seed + i * 3) * 0.5);
      const drop = R * 0.055 * (1 - p * 2.2) * (0.7 + U.hash(seed + i * 7) * 0.6);
      if (drop <= 0.5) continue;
      const x = cx + Math.cos(a) * dist;
      const y = cy + Math.sin(a) * dist;
      ctx.fillStyle = U.rgba(color, 0.75 * (1 - p));
      ctx.beginPath();
      ctx.arc(x, y, drop, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = U.rgba(color, 0.30 * (1 - p));
      ctx.lineWidth = drop * 1.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(cx + Math.cos(a) * dist * 0.82, cy + Math.sin(a) * dist * 0.82);
      ctx.stroke();
    }
  }

  function ripple(ctx, cx, cy, r, alpha, w = 2) {
    if (alpha <= 0 || r <= 0) return;
    ctx.strokeStyle = `rgba(26,34,60,${alpha})`;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 旋臂：从墨心甩出的螺旋，打旋时最抢眼
  function spiralArms(ctx, cx, cy, R, t, phase, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.strokeStyle = U.rgba(INKS.indigo, alpha);
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      ctx.lineWidth = 7 - k * 1.5;
      ctx.beginPath();
      for (let i = 0; i <= 90; i++) {
        const u = i / 90;
        const a = phase + k * (Math.PI * 2 / 3) + u * 2.9;
        const r = R * (0.18 + u * 1.05);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 0.94;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 指状前沿：墨在奶里往外爬时留下的几条锥形舌
  function fingers(ctx, cx, cy, R, t, color, alpha, seed) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.fillStyle = U.rgba(color, alpha);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + seed * 0.7 + Math.sin(t * 0.6 + i) * 0.10;
      const len = R * (0.94 + 0.22 * Math.sin(t * 0.9 + i * 1.7));
      const w = R * 0.16 * (0.7 + 0.5 * Math.sin(t * 1.1 + i));
      const x0 = cx + Math.cos(a) * R * 0.50, y0 = cy + Math.sin(a) * R * 0.50;
      const x1 = cx + Math.cos(a + 0.10) * len, y1 = cy + Math.sin(a + 0.10) * len;
      const nx = -Math.sin(a), ny = Math.cos(a);
      ctx.beginPath();
      ctx.moveTo(x0 + nx * w, y0 + ny * w);
      ctx.quadraticCurveTo(x0 + nx * w * 0.7 + Math.cos(a) * len * 0.55,
        y0 + ny * w * 0.7 + Math.sin(a) * len * 0.55, x1, y1);
      ctx.quadraticCurveTo(x0 - nx * w * 0.7 + Math.cos(a) * len * 0.55,
        y0 - ny * w * 0.7 + Math.sin(a) * len * 0.55, x0 - nx * w, y0 - ny * w);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 墨在奶面上扩散的前沿（不规则的细圈）
  function inkFront(ctx, cx, cy, R, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(26,34,60,${alpha})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) {
      const a = (i / 90) * Math.PI * 2;
      const r = R * (1 + 0.05 * Math.sin(a * 9 + 1.3) + 0.03 * Math.sin(a * 5));
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // 倒进来的奶：一道奶白的流，横过墨面把墨推开
  function milkStream(ctx, cx, cy, R, t, prog, offset, jitter) {
    if (prog <= 0) return;
    const p0 = [cx + R * 0.78 + offset * 0.1, cy - R * 0.92 + offset];
    const c1 = [cx + R * 0.62 + offset * 0.2, cy - R * 0.10 + offset * 0.6];
    const c2 = [cx - R * 0.10 + offset * 0.3, cy + R * 0.28 + offset * 0.4];
    const p3 = [cx - R * 0.68 + offset * 0.1, cy + R * 0.95 + offset];
    const n = 64;
    const run = Math.ceil(n * U.clamp(prog));
    const head = [p0, c1, c2, p3];
    const pt = (u) => {
      const a = 1 - u;
      return [
        a * a * a * head[0][0] + 3 * a * a * u * head[1][0] + 3 * a * u * u * head[2][0] + u * u * u * head[3][0] + Math.sin(u * 7 + jitter) * R * 0.03,
        a * a * a * head[0][1] + 3 * a * a * u * head[1][1] + 3 * a * u * u * head[2][1] + u * u * u * head[3][1] + Math.cos(u * 6 + jitter) * R * 0.02,
      ];
    };
    ctx.save();
    ctx.lineCap = 'round';
    // 外层：奶白略透
    ctx.strokeStyle = 'rgba(252,248,239,0.90)';
    ctx.lineWidth = R * 0.11;
    ctx.beginPath();
    for (let i = 0; i <= run; i++) {
      const q = pt(i / n);
      if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
    }
    ctx.stroke();
    // 内层：更亮的一道，像奶的筋
    ctx.strokeStyle = 'rgba(255,255,252,0.85)';
    ctx.lineWidth = R * 0.06;
    ctx.beginPath();
    for (let i = 0; i <= run; i++) {
      const q = pt(i / n);
      const q2 = pt(Math.min(1, i / n + 0.02));
      const nx = q[1] - q2[1], ny = q2[0] - q[0];
      const ln = Math.hypot(nx, ny) || 1;
      const off = R * 0.035;
      if (i === 0) ctx.moveTo(q[0] + nx / ln * off, q[1] + ny / ln * off);
      else ctx.lineTo(q[0] + nx / ln * off, q[1] + ny / ln * off);
    }
    ctx.stroke();

    ctx.restore();
  }

  window.SCENES = window.SCENES || {};
  window.SCENES.yetai = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;
      U.paper(ctx, W, H, CREAM, 3, 0.45);

      const cx = W * 0.5, cy = H * 0.49;
      const dishR = H * 0.50;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.006 * Math.sin(t * 0.4));
      const cam = 1.02 + 0.10 * U.smooth(U.p(t, 0, 10));
      ctx.scale(cam, cam);
      ctx.translate(-cx, -cy);

      U.softShadow(ctx, cx + 10, cy + 16, dishR * 1.16, dishR * 1.16, 0.24);

      // 盘（略大于画面，像贴着拍）
      ctx.fillStyle = '#e7dfcd';
      ctx.beginPath();
      ctx.arc(cx, cy, dishR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = MILK;
      ctx.beginPath();
      ctx.arc(cx, cy, dishR * 0.985, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, dishR * 0.92, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // 奶面原有的轻微起伏
      for (let i = 0; i < 4; i++) {
        ripple(ctx, cx, cy, dishR * (0.5 + i * 0.13), 0.09 - i * 0.015, 1.5);
      }
      const sheen = ctx.createRadialGradient(cx - dishR * 0.25, cy - dishR * 0.28, 0,
        cx - dishR * 0.25, cy - dishR * 0.28, dishR * 0.7);
      sheen.addColorStop(0, 'rgba(255,255,255,0.65)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(cx - dishR, cy - dishR, dishR * 2, dishR * 2);

      // 时间线
      const hit1 = 1.25, hit2 = 2.75, hit3 = 3.95, hit4 = 5.05;
      const swirl = U.p(t, 5.4, 2.0);
      const seal = U.p(t, 7.3, 1.15);

      // ---- 开场：奶里已经落过一小滴，第 0 帧就有墨 ----
      if (t < hit1) {
        const pre = dishR * (0.10 + 0.06 * U.p(t, 0, hit1));
        inkBlob(ctx, cx, cy, pre, 0.9, 0.5 + t * 0.4, INKS.indigo, 0.82, '#101a3d');
        milkVeins(ctx, cx, cy, pre * 1.02, 1.9, t * 0.4, 0.22);
        ripple(ctx, cx, cy, dishR * (0.15 + 0.06 * U.p(t, 0, hit1)), 0.12, 1.5);
      }

      // ---- 第一滴：靛蓝主笔 ----
      if (t < hit1) {
        const p = U.clamp((t - 0.55) / (hit1 - 0.55));
        const y = U.lerp(-H * 0.08, cy - H * 0.02, p * p);
        const r = H * 0.024;
        ctx.strokeStyle = 'rgba(27,42,99,0.45)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx, y - r);
        ctx.lineTo(cx - 3, y - r - H * 0.09 * p);
        ctx.stroke();
        ctx.fillStyle = INKS.indigo;
        ctx.beginPath();
        ctx.arc(cx, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t > hit1) {
        const g = U.easeOut(U.clamp((t - hit1) / 2.0));
        const R1 = dishR * 0.55 * (0.20 + 0.80 * g);
        for (let i = 0; i < 3; i++) {
          const rt = U.p(t, hit1 + i * 0.14, 1.6);
          if (rt > 0 && rt < 1) ripple(ctx, cx, cy, dishR * 0.12 + rt * dishR * 0.62, 0.24 * (1 - rt) * (1 - i * 0.2), 2.5);
        }
        splash(ctx, cx, cy, hit1, t, R1, INKS.indigo, 1.1);
        const phase = t * 0.32;
        if (g > 0.45) inkFront(ctx, cx, cy, R1 * 1.12, 0.07 * U.clamp((g - 0.45) * 2.5));
        inkBlob(ctx, cx, cy, R1, 1.3, phase, INKS.indigo, 0.90, '#101a3d');
        milkVeins(ctx, cx, cy, R1 * 1.02, 5.2, phase, 0.26 * U.clamp(g * 1.6));
        if (g > 0.35) {
          ctx.save();
          ctx.strokeStyle = U.rgba(INKS.indigo, 0.15 * U.clamp((g - 0.35) * 3));
          ctx.lineCap = 'round';
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 + U.hash(i * 3) * 0.5;
            const len = R1 * (1.15 + U.hash(i * 7) * 0.8);
            ctx.lineWidth = 2 + U.hash(i * 11) * 4;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * R1 * 0.6, cy + Math.sin(a) * R1 * 0.6);
            ctx.quadraticCurveTo(
              cx + Math.cos(a + 0.25) * len * 0.85, cy + Math.sin(a + 0.25) * len * 0.85,
              cx + Math.cos(a + 0.5) * len, cy + Math.sin(a + 0.5) * len
            );
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // ---- 第二滴：朱红 ----
      const c2x = cx + dishR * 0.26, c2y = cy + dishR * 0.16;
      if (t > 2.0 && t < hit2) {
        const p = U.clamp((t - 2.0) / (hit2 - 2.0));
        ctx.fillStyle = INKS.coral;
        ctx.beginPath();
        ctx.arc(c2x, U.lerp(-H * 0.06, c2y, p * p), H * 0.017, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t > hit2) {
        const g = U.easeOut(U.clamp((t - hit2) / 1.8));
        const R2 = dishR * 0.26 * (0.18 + 0.82 * g);
        ripple(ctx, c2x, c2y, R2 * 2.2 + dishR * 0.06, 0.20 * (1 - g), 2);
        splash(ctx, c2x, c2y, hit2, t, R2 * 0.9, INKS.coral, 2.2);
        inkBlob(ctx, c2x, c2y, R2, 3.7, -t * 0.28, INKS.coral, 0.62, '#8f2a22');
        // 咬合处压一层深色，像真的混了色
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.35 * g;
        ctx.fillStyle = '#3a1638';
        ctx.beginPath();
        ctx.ellipse((cx + c2x) / 2, (cy + c2y) / 2, R2 * 0.65, R2 * 0.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        milkVeins(ctx, c2x, c2y, R2, 4.4, -t * 0.28, 0.34 * g);
        if (g > 0.5) {
          ctx.strokeStyle = U.rgba(INKS.coral, 0.26 * (g - 0.5) * 2);
          ctx.lineCap = 'round';
          for (let i = 0; i < 10; i++) {
            const a = (i / 10) * Math.PI * 2 + 0.7;
            const len = R2 * (1.2 + U.hash(i * 5) * 0.7);
            ctx.lineWidth = 2.5 + U.hash(i * 9) * 3;
            ctx.beginPath();
            ctx.moveTo(c2x + Math.cos(a) * R2 * 0.7, c2y + Math.sin(a) * R2 * 0.7);
            ctx.lineTo(c2x + Math.cos(a + 0.3) * len, c2y + Math.sin(a + 0.3) * len);
            ctx.stroke();
          }
        }
      }

      // ---- 第三滴：青，落在左上 ----
      const c3x = cx - dishR * 0.24, c3y = cy - dishR * 0.22;
      if (t > 3.3 && t < hit3) {
        const p = U.clamp((t - 3.3) / (hit3 - 3.3));
        ctx.fillStyle = INKS.teal;
        ctx.beginPath();
        ctx.arc(c3x, U.lerp(-H * 0.03, c3y, p * p), H * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t > hit3) {
        const g = U.easeOut(U.clamp((t - hit3) / 1.4));
        const R3 = dishR * 0.17 * (0.2 + 0.8 * g);
        ripple(ctx, c3x, c3y, R3 * 2.4 + dishR * 0.04, 0.18 * (1 - g), 2);
        splash(ctx, c3x, c3y, hit3, t, R3, INKS.teal, 3.3);
        inkBlob(ctx, c3x, c3y, R3, 6.2, t * 0.4, INKS.teal, 0.5, '#16382f');
        milkVeins(ctx, c3x, c3y, R3, 7.1, t * 0.4, 0.3 * g);
      }

      // ---- 第四滴：金，细小但亮 ----
      const c4x = cx + dishR * 0.02, c4y = cy - dishR * 0.34;
      if (t > 4.6 && t < hit4) {
        const p = U.clamp((t - 4.6) / (hit4 - 4.6));
        ctx.fillStyle = INKS.gold;
        ctx.beginPath();
        ctx.arc(c4x, U.lerp(0, c4y, p * p), H * 0.008, 0, Math.PI * 2);
        ctx.fill();
      }
      if (t > hit4) {
        const g = U.easeOut(U.clamp((t - hit4) / 1.0));
        inkBlob(ctx, c4x, c4y, dishR * 0.09 * g, 8.4, t * 0.5, INKS.gold, 0.55, '#8a6520');
        ripple(ctx, c4x, c4y, dishR * 0.14 + g * dishR * 0.10, 0.14 * (1 - g), 1.5);
      }

      // ---- 打旋：旋臂从墨心拉出去 ----
      if (swirl > 0) {
        const k = Math.sin(Math.min(1, swirl) * Math.PI);
        spiralArms(ctx, cx, cy, dishR * 0.62, t, t * 1.1, 0.30 * k);
        ctx.save();
        ctx.strokeStyle = U.rgba(MILK, 0.22 * k);
        ctx.lineWidth = 10;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const u = i / 80;
          const a = t * 1.2 + u * 3.4;
          const r = dishR * (0.30 + u * 0.42);
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r * 0.94;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // ---- 奶冲进来，把墨推开 ----
      const pour = U.p(t, 5.9, 1.4);
      const pourFade = 1 - U.p(t, 7.3, 0.45);
      if (pour > 0 && pourFade > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, dishR * 0.965, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = 0.72 * pourFade;
        for (let i = 0; i < 3; i++) {
          milkStream(ctx, cx, cy, dishR, t, U.clamp(pour - i * 0.12), (i - 1) * dishR * 0.13, i * 1.7);
        }
        ctx.restore();
      }

      // ---- 收成墨印 ----
      if (seal > 0) {
        const g = U.easeInOut(seal);
        const sr = dishR * (0.34 + 0.04 * g);
        ripple(ctx, cx, cy, dishR * (0.55 - 0.18 * g), 0.22 * (1 - g), 3);
        ctx.save();
        ctx.globalAlpha = 0.18 * g;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(cx + 6, cy + 10, sr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.94 * g;
        // 印是圆的，只留一点点手按的不齐
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const a = (i / 120) * Math.PI * 2;
          const r = sr * (1 + 0.028 * Math.sin(a * 7 + 0.6) + 0.018 * Math.sin(a * 13));
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = '#1a2a52';
        ctx.fill();
        ctx.strokeStyle = 'rgba(14,22,44,0.55)';
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.globalAlpha = 0.85 * U.clamp((seal - 0.3) / 0.5);
        ctx.strokeStyle = U.rgba(MILK, 0.85);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, sr * 0.78, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = MILK;
        ctx.font = '900 ' + Math.round(sr * 0.60) + 'px "STSong", "SimSun", "Microsoft YaHei", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('墨', cx, cy + sr * 0.02);
        ctx.restore();
      }

      // 片尾：一滴朱红落在印边
      if (t > 9.0) {
        const p = U.p(t, 9.0, 0.45);
        const ex = cx + dishR * 0.30, ey = cy + dishR * 0.20;
        if (p < 1) {
          ctx.fillStyle = INKS.coral;
          ctx.beginPath();
          ctx.arc(ex, ey - (1 - p) * H * 0.10, H * 0.0075, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const rt = U.p(t, 9.45, 0.6);
          ctx.fillStyle = U.rgba(INKS.coral, 0.55 * (1 - rt));
          ctx.beginPath();
          ctx.arc(ex, ey, H * 0.0065, 0, Math.PI * 2);
          ctx.fill();
          ripple(ctx, ex, ey, dishR * 0.05 + rt * dishR * 0.08, 0.16 * (1 - rt), 1.6);
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
