/* 液态流动 · 液态创世（自研）
   液体用"同一支全幅渐变"填球体，重叠处颜色自然接成一片，读作一大团液体而不是几个球；
   两球靠近时在两心之间拉细颈，断丝后次级液滴延迟跟随；结尾字标从液体里聚出来。 */
(() => {
  const C = [
    [0.00, '#ffb45c'],
    [0.22, '#ff7a1e'],
    [0.55, '#ff2d78'],
    [0.82, '#b02be0'],
    [1.00, '#5f22ff'],
  ];

  window.SCENES = window.SCENES || {};
  window.SCENES.yetai = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;
      const cx = W * 0.5, cy = H * 0.52;
      const ground = cy + H * 0.20;

      ctx.fillStyle = '#24072b';
      ctx.fillRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.62);
      bg.addColorStop(0, 'rgba(146,44,140,0.30)');
      bg.addColorStop(1, 'rgba(20,4,26,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const fade = 1 - U.easeInOut(U.p(t, 5.25, 0.65));   // 5.25s 后液体让位给字标

      // 全幅渐变：所有液体共用，重叠处无缝
      const lg = ctx.createLinearGradient(W * 0.16, cy - H * 0.30, W * 0.84, cy + H * 0.34);
      C.forEach(([p, c]) => lg.addColorStop(p, c));

      const drawBall = (x, y, r, sx = 1, sy = 1) => {
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(x, y);
        ctx.scale(sx, sy);
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        // 顶面一道镜面高光（窄条，不是球体渐变）
        ctx.globalAlpha = fade * 0.55;
        ctx.save();
        ctx.rotate(-0.55);
        const hg = ctx.createLinearGradient(-r * 0.5, 0, -r * 0.1, 0);
        hg.addColorStop(0, 'rgba(255,255,255,0)');
        hg.addColorStop(0.5, 'rgba(255,255,255,0.75)');
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.ellipse(-r * 0.30, -r * 0.44, r * 0.34, r * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.restore();
      };

      // 落滴（两个，落地压扁）
      const drops = [
        { t0: 0.18, x: cx - W * 0.13, r: H * 0.10 },
        { t0: 0.52, x: cx + W * 0.12, r: H * 0.085 },
      ];
      for (const d of drops) {
        const k = U.p(t, d.t0, 0.52);
        if (k <= 0) continue;
        if (k < 1) {
          const y = -d.r + (ground + d.r) * (k * k);
          drawBall(d.x, y, d.r * (1 - 0.08 * k), 1, 1 + 0.28 * k);
        } else {
          const l = U.p(t, d.t0 + 0.52, 0.45);
          const sq = Math.sin(Math.min(1, l) * Math.PI);
          drawBall(d.x, ground, d.r * (1 + sq * 0.4), 1 + sq * 0.45, 1 - sq * 0.55);
          if (l > 0.2 && l < 0.9) {
            drawBall(d.x + (d.x < cx ? -1 : 1) * d.r * (0.8 + l), ground - d.r * (0.5 + l * 0.9), d.r * 0.22);
          }
        }
      }

      // 两团融合
      if (t > 1.15 && fade > 0.05) {
        const m = U.easeInOut(U.p(t, 1.3, 1.15));
        const lx = U.lerp(cx - W * 0.20, cx - W * 0.055, m);
        const rx = U.lerp(cx + W * 0.20, cx + W * 0.06, m);
        const rl = H * 0.155, rr = H * 0.135;
        const gap = (rx - lx) - (rl + rr);
        if (gap < H * 0.09) {
          const w = Math.max(0, H * 0.055 * (1 - gap / (H * 0.09)));
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(lx, cy);
          const len = rx - lx;
          const ng = ctx.createLinearGradient(0, 0, len, 0);
          C.forEach(([p, c]) => ng.addColorStop(p, c));
          ctx.fillStyle = ng;
          ctx.beginPath();
          ctx.moveTo(0, -w);
          ctx.quadraticCurveTo(len * 0.5, -w * 0.30, len, -w);
          ctx.lineTo(len, w);
          ctx.quadraticCurveTo(len * 0.5, w * 0.30, 0, w);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        drawBall(lx, cy, rl);
        drawBall(rx, cy, rr);
        // 回弹
        const s = U.p(t, 2.4, 0.5);
        if (s > 0 && s < 1) {
          const b = Math.sin(s * Math.PI * 1.6) * 0.16;
          drawBall((lx + rx) / 2, cy, (rl + rr) * 0.88, 1 + b, 1 - b);
        }
      }

      // 主球合一
      const grow = U.easeInOut(U.p(t, 3.15, 1.1));
      if (grow > 0) drawBall(cx, cy, H * 0.185 * grow, 1.06, 0.94);

      // 波浪转场 2.9–3.8
      const wv = U.p(t, 2.9, 0.9);
      if (wv > 0 && wv < 1) {
        const front = U.easeInOut(wv) * 1.5 - 0.30;
        const grd = ctx.createLinearGradient(0, 0, W, H);
        C.forEach(([p, c]) => grd.addColorStop(p, c));
        ctx.save();
        ctx.globalAlpha = 0.9 - 0.5 * wv;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(-0.1 * W, 0);
        for (let i = 0; i <= 26; i++) {
          const y = (i / 26) * H;
          const wave = Math.sin(i * 0.78 + wv * 6.2) * H * 0.034;
          ctx.lineTo((front + wave / W) * W, y);
        }
        ctx.lineTo(-0.1 * W, H);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 字标 FLUX
      const wm = U.easeOut(U.p(t, 5.35, 0.7));
      if (wm > 0) {
        const fs = Math.round(H * 0.28);
        ctx.save();
        ctx.globalAlpha = wm;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tg = ctx.createLinearGradient(cx - W * 0.2, cy - H * 0.16, cx + W * 0.2, cy + H * 0.16);
        C.forEach(([p, c]) => tg.addColorStop(p, c));
        ctx.font = '800 ' + fs + 'px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = tg;
        ctx.fillText('FLUX', cx, cy);
        // 液体边缘：白色细描边压一点高光
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.20)';
        ctx.strokeText('FLUX', cx, cy);
        ctx.restore();
      }

      // 片尾一滴
      if (t > 6.5) {
        const dt = U.p(t, 6.55, 0.5);
        drawBall(cx + W * 0.012, cy + H * 0.11 + dt * dt * (ground - cy - H * 0.11), H * 0.04 * (1 - 0.15 * dt), 1, 1.1);
        const rp = U.p(t, 7.05, 0.9);
        if (rp > 0 && rp < 1) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255,170,205,0.45)';
          ctx.lineWidth = 2.5;
          const rr = (1 - Math.pow(1 - rp, 3)) * W * 0.09;
          ctx.beginPath();
          ctx.ellipse(cx + W * 0.012, ground, rr, rr * 0.13, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    },
  };
})();
