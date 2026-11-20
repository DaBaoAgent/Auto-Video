/* 综艺花字 · 萌宠综艺感（自研）
   竖屏 9:16。底层是一段"假实拍"的猫 vlog（代码画的房间、猫、手持抖动、推镜），
   上层是综艺花字：多层描边胖体字、弹性 pop、逐字错帧、手绘爆炸框/汗滴/闪光。 */
(() => {
  const PINK = '#ff3d8b';
  const YELLOW = '#ffd23f';
  const CYAN = '#3fe0ff';
  const INK = '#2a1a22';

  function cat(ctx, x, y, s, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    // 尾巴
    ctx.strokeStyle = '#e08a3c';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(80, 30);
    ctx.quadraticCurveTo(150, 20 + Math.sin(t * 2.4) * 14, 132, -50);
    ctx.stroke();
    // 身体
    ctx.fillStyle = '#f3a04f';
    ctx.beginPath();
    ctx.ellipse(0, 40, 92, 78, 0, 0, Math.PI * 2);
    ctx.fill();
    // 条纹
    ctx.strokeStyle = '#d9793a';
    ctx.lineWidth = 9;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 30 - 16, 6);
      ctx.quadraticCurveTo(i * 30, 22, i * 30 + 16, 6);
      ctx.stroke();
    }
    // 头
    const hb = Math.sin(t * 2.2) * 3;
    ctx.fillStyle = '#f7ac5c';
    ctx.beginPath();
    ctx.ellipse(0, -60 + hb, 74, 66, 0, 0, Math.PI * 2);
    ctx.fill();
    // 耳
    ctx.beginPath();
    ctx.moveTo(-62, -100 + hb); ctx.lineTo(-40, -140 + hb); ctx.lineTo(-18, -104 + hb); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(62, -100 + hb); ctx.lineTo(40, -140 + hb); ctx.lineTo(18, -104 + hb); ctx.fill();
    ctx.fillStyle = '#ffc9a8';
    ctx.beginPath();
    ctx.moveTo(-52, -104 + hb); ctx.lineTo(-41, -126 + hb); ctx.lineTo(-28, -106 + hb); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(52, -104 + hb); ctx.lineTo(41, -126 + hb); ctx.lineTo(28, -106 + hb); ctx.fill();
    // 眼
    const blink = Math.abs(Math.sin(t * 1.15)) > 0.96 ? 6 : 1;
    ctx.fillStyle = '#2a1a12';
    ctx.beginPath();
    ctx.ellipse(-28, -66 + hb, 9, 10 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(28, -66 + hb, 9, 10 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-31, -70 + hb, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(25, -70 + hb, 3, 0, Math.PI * 2);
    ctx.fill();
    // 鼻、嘴
    ctx.fillStyle = '#e0665c';
    ctx.beginPath();
    ctx.moveTo(0, -50 + hb); ctx.lineTo(-6, -44 + hb); ctx.lineTo(6, -44 + hb); ctx.fill();
    ctx.strokeStyle = '#7a3a22';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -44 + hb);
    ctx.quadraticCurveTo(-12, -34 + hb, -18, -44 + hb);
    ctx.moveTo(0, -44 + hb);
    ctx.quadraticCurveTo(12, -34 + hb, 18, -44 + hb);
    ctx.stroke();
    // 胡须
    ctx.strokeStyle = 'rgba(90,60,40,0.7)';
    ctx.lineWidth = 2;
    for (const sgn of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(sgn * 40, -52 + i * 8 + hb);
        ctx.lineTo(sgn * 96, -64 + i * 16 + hb);
        ctx.stroke();
      }
    }
    // 前爪
    ctx.fillStyle = '#ffd3a8';
    ctx.beginPath();
    ctx.ellipse(-42, 108, 26, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(42, 108, 26, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 多层描边花字：外彩边 → 白粗边 → 渐变填充 → 投影
  function hanazi(ctx, text, x, y, size, fill, rot, scale, alpha, stagger = 0, t = 0, born = 0) {
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
      ctx.translate(cx + widths[i] / 2, Math.sin(t * 3.1 + i) * 3);
      ctx.rotate(Math.sin(t * 2.2 + i * 1.7) * 0.035);
      ctx.scale(pop, pop);
      // 投影
      ctx.fillStyle = 'rgba(40,10,30,0.35)';
      ctx.fillText(ch, 6, 8);
      // 外彩边
      ctx.lineWidth = size * 0.20;
      ctx.strokeStyle = fill.outer;
      ctx.strokeText(ch, 0, 0);
      // 白边
      ctx.lineWidth = size * 0.11;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeText(ch, 0, 0);
      // 填充渐变
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

  function burst(ctx, x, y, r, color, t) {
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
    // 放射线
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + t * 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05);
      ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35);
      ctx.stroke();
    }
    ctx.restore();
  }

  window.SCENES = window.SCENES || {};
  window.SCENES.huazi = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;

      // ---- 底层"实拍"：手持抖动 + 推镜 ----
      const shake = 0.004;
      const zoom = 1.04 + 0.05 * Math.sin(t * 0.7) + 0.06 * U.p(t, 2.5, 0.4) - 0.06 * U.p(t, 5.6, 0.4);
      ctx.save();
      ctx.translate(W * 0.5 + Math.sin(t * 8.3) * W * shake, H * 0.5 + Math.cos(t * 7.1) * H * shake);
      ctx.scale(zoom, zoom);
      ctx.translate(-W * 0.5, -H * 0.5);

      // 房间墙
      const wall = ctx.createLinearGradient(0, 0, 0, H);
      wall.addColorStop(0, '#ffe9c9');
      wall.addColorStop(0.6, '#ffd3ad');
      wall.addColorStop(1, '#f4b98c');
      ctx.fillStyle = wall;
      ctx.fillRect(-W * 0.3, -H * 0.3, W * 1.6, H * 1.6);

      // 窗
      ctx.fillStyle = '#bfe6ff';
      ctx.beginPath();
      ctx.roundRect(W * 0.08, H * 0.10, W * 0.40, H * 0.22, 18);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(W * 0.08, H * 0.10, W * 0.40, H * 0.03);
      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = 14;
      ctx.strokeRect(W * 0.08, H * 0.10, W * 0.40, H * 0.22);
      ctx.beginPath();
      ctx.moveTo(W * 0.28, H * 0.10);
      ctx.lineTo(W * 0.28, H * 0.32);
      ctx.stroke();

      // 地毯
      ctx.fillStyle = '#f6d7b8';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.86, W * 0.62, H * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      // 坐垫
      ctx.fillStyle = '#8fd0c8';
      ctx.beginPath();
      ctx.roundRect(W * 0.24, H * 0.62, W * 0.52, H * 0.16, 34);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.roundRect(W * 0.27, H * 0.64, W * 0.46, H * 0.04, 18);
      ctx.fill();

      // 猫
      cat(ctx, W * 0.50, H * 0.66, H / 900, t);

      // 小盆栽
      ctx.fillStyle = '#e07a5f';
      ctx.beginPath();
      ctx.roundRect(W * 0.80, H * 0.42, W * 0.12, H * 0.07, 8);
      ctx.fill();
      ctx.fillStyle = '#4f9d69';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(W * (0.82 + i * 0.025), H * (0.38 - i * 0.01), W * 0.05, H * 0.02, -0.4 + i * 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 底部一层柔光，让字压得住
      const vg = ctx.createLinearGradient(0, H * 0.55, 0, H);
      vg.addColorStop(0, 'rgba(60,20,40,0)');
      vg.addColorStop(1, 'rgba(60,20,40,0.28)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // ---- 花字 ----
      const pop = (t0) => U.clamp((t - t0) / 0.30);

      // 1) 今日份快乐
      const t1 = pop(0.35);
      if (t1 > 0) {
        hanazi(ctx, '今日份快乐', W * 0.5, H * 0.165, H * 0.068,
          { top: '#fff3a8', bottom: YELLOW, outer: PINK }, -0.045,
          0.9 + 0.25 * U.back(t1), Math.min(1, t1 * 1.6), 0.07, t, 0.35);
      }

      // 2) ？？？
      const t2 = pop(2.0);
      if (t2 > 0) {
        const qs = ['？', '？', '？'];
        qs.forEach((q, i) => {
          const qa = U.clamp((t - 2.0 - i * 0.12) / 0.3);
          if (qa <= 0) return;
          const bob = Math.sin(t * 5.2 + i * 1.9) * H * 0.012;
          ctx.save();
          ctx.globalAlpha = qa;
          ctx.translate(W * (0.16 + i * 0.11), H * 0.44 + bob);
          ctx.rotate(-0.2 + i * 0.22);
          ctx.font = '800 ' + Math.round(H * 0.07) + 'px "Microsoft YaHei", sans-serif';
          ctx.lineWidth = H * 0.012;
          ctx.strokeStyle = CYAN;
          ctx.strokeText(q, 0, 0);
          ctx.lineWidth = H * 0.007;
          ctx.strokeStyle = '#fff';
          ctx.strokeText(q, 0, 0);
          ctx.fillStyle = PINK;
          ctx.fillText(q, 0, 0);
          ctx.restore();
        });
      }

      // 3) 震惊!!
      if (t > 3.5) {
        const k = U.clamp((t - 3.5) / 0.35);
        ctx.save();
        ctx.translate(W * 0.30, H * 0.55);
        ctx.rotate(-0.18);
        ctx.scale(0.6 + 0.55 * U.back(k), 0.6 + 0.55 * U.back(k));
        burst(ctx, 0, 0, H * 0.10, YELLOW, t);
        ctx.restore();
        hanazi(ctx, '震惊!!', W * 0.30, H * 0.55, H * 0.062,
          { top: '#fff', bottom: YELLOW, outer: '#ff5a2b' }, -0.18,
          1, k, 0.05, t, 3.5);
      }

      // 4) （小声）
      const t4 = pop(5.0);
      if (t4 > 0) {
        ctx.save();
        ctx.globalAlpha = 0.9 * Math.min(1, t4 * 1.4);
        ctx.translate(W * 0.66, H * 0.38);
        ctx.rotate(0.10);
        ctx.font = '600 ' + Math.round(H * 0.030) + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = H * 0.008;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.strokeText('（小声）猫又拆家了', 0, 0);
        ctx.fillStyle = '#5a4a52';
        ctx.fillText('（小声）猫又拆家了', 0, 0);
        ctx.restore();
      }

      // 5) 绝绝子 + 闪光
      const t5 = pop(6.1);
      if (t5 > 0) {
        hanazi(ctx, '绝绝子', W * 0.5, H * 0.78, H * 0.070,
          { top: '#ffffff', bottom: CYAN, outer: '#ff3d8b' }, 0.05,
          0.85 + 0.3 * U.back(t5), Math.min(1, t5 * 1.5), 0.07, t, 6.1);
        for (let i = 0; i < 5; i++) {
          const sa = U.clamp((t - 6.3 - i * 0.08) / 0.4);
          if (sa <= 0) continue;
          const sx = W * (0.26 + i * 0.12), sy = H * (0.72 - (i % 2) * 0.04);
          ctx.save();
          ctx.globalAlpha = sa * (0.8 + 0.2 * Math.sin(t * 8 + i));
          ctx.fillStyle = '#fff7b0';
          ctx.translate(sx, sy);
          ctx.rotate(t * 2 + i);
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            const rr = k % 2 === 0 ? 22 : 8;
            ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 6) 猫主子认证 印章
      if (t > 7.3) {
        const k = U.clamp((t - 7.3) / 0.35);
        ctx.save();
        ctx.translate(W * 0.72, H * 0.62);
        ctx.rotate(-0.22);
        ctx.scale(1.4 - 0.4 * U.back(k), 1.4 - 0.4 * U.back(k));
        ctx.globalAlpha = k;
        ctx.strokeStyle = '#e03a3a';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(-H * 0.10, -H * 0.045, H * 0.20, H * 0.09, 8);
        ctx.stroke();
        ctx.fillStyle = '#e03a3a';
        ctx.font = '800 ' + Math.round(H * 0.026) + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('猫主子认证', 0, 4);
        ctx.font = '600 ' + Math.round(H * 0.014) + 'px "Segoe UI", sans-serif';
        ctx.fillText('CERTIFIED · 2026', 0, H * 0.030);
        ctx.restore();
      }

      // 顶部小字：vlog 编号
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#8a5545';
      ctx.font = '600 ' + Math.round(H * 0.016) + 'px "Segoe UI", sans-serif';
      ctx.fillText('EP.07  ·  喵呜日记', W * 0.06, H * 0.055);
      ctx.restore();
    },
  };
})();
