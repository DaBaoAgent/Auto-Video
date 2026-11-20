/* 拼贴剪贴 · 脑洞拼贴（自研）
   报纸底 + 半调网点人像剪片 + 白剪边 + 关节纸片，头上开盖露出深空，
   花、鸟、手、火箭从里面喷出来；主体按 12 fps 定格，位置带 ±2px 手摆抖动。 */
(() => {
  const NEWS = '#e8dfc9';
  const INK = '#1b1712';
  const RED = '#c9382b';
  const KRAFT = '#d9c49c';

  // 侧脸轮廓（面向右），单位坐标 0..1
  const FACE = [
    [0.06, 0.99], [0.01, 0.72], [0.05, 0.46], [0.15, 0.26],
    [0.32, 0.16], [0.50, 0.18], [0.60, 0.28], [0.63, 0.38],
    [0.61, 0.43], [0.77, 0.50], [0.63, 0.52], [0.69, 0.55],
    [0.66, 0.60], [0.57, 0.65], [0.45, 0.72], [0.41, 0.84],
    [0.33, 0.99],
  ];

  function polyPath(pts, x, y, w, h) {
    const p = new Path2D();
    pts.forEach(([u, v], i) => {
      const px = x + u * w, py = y + v * h;
      if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
    });
    p.closePath();
    return p;
  }

  // 撕纸边：一条带锯齿的长边
  function tornEdge(ctx, x0, y0, x1, y1, amp, seed) {
    const n = 26;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const j = (U.hash(seed + i * 7.3) - 0.5) * amp;
      ctx.lineTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + j);
    }
  }

  function halftonePortrait(ctx, path, box, t) {
    const { x, y, w, h } = box;
    const step = Math.max(4, Math.round(h / 118));
    for (let yy = y; yy < y + h; yy += step) {
      for (let xx = x; xx < x + w; xx += step) {
        if (!ctx.isPointInPath(path, xx, yy)) continue;
        // 左上方受光 → 点更小；越往下越大
        const lx = (xx - x) / w, ly = (yy - y) / h;
        const shade = U.clamp(0.35 + 0.55 * ly + 0.25 * lx);
        const r = step * (0.16 + shade * 0.34);
        ctx.beginPath();
        ctx.arc(xx, yy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  window.SCENES = window.SCENES || {};
  window.SCENES.pintie = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;
      const stepT = Math.floor(t * 12) / 12;             // 12 fps 定格
      const jx = (U.hash(stepT * 13.1) - 0.5) * 4;
      const jy = (U.hash(stepT * 17.7) - 0.5) * 4;

      // 报纸底
      ctx.fillStyle = NEWS;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#5b5348';
      const dot = 3.2;
      for (let y = -dot; y < H; y += dot * 2.4) {
        for (let x = -dot; x < W; x += dot * 2.4) {
          ctx.beginPath();
          ctx.arc(x + (Math.floor(y / (dot * 2.4)) % 2 ? dot * 1.2 : 0), y, dot * 0.34, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      // 报头细线与栏目栏
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(W * 0.04, H * (0.1 + i * 0.19));
        ctx.lineTo(W * 0.96, H * (0.1 + i * 0.19));
        ctx.stroke();
      }
      ctx.restore();

      // 页边：上下各压一道暗边
      ctx.fillStyle = 'rgba(90,70,40,0.10)';
      ctx.fillRect(0, 0, W, H * 0.04);
      ctx.fillRect(0, H * 0.96, W, H * 0.04);

      // 牛皮纸patch + 撕边
      const bx = W * 0.50, by = H * 0.16, bw = W * 0.40, bh = H * 0.66;
      ctx.save();
      ctx.translate(jx * 0.5, jy * 0.5);
      ctx.rotate(-0.012);
      U.softShadow(ctx, bx + bw * 0.5, by + bh * 0.56, bw * 0.56, bh * 0.52, 0.16);
      ctx.fillStyle = KRAFT;
      ctx.beginPath();
      ctx.moveTo(bx, by + 8);
      tornEdge(ctx, bx, by, bx + bw, by, 10, 3.1);
      ctx.lineTo(bx + bw, by + bh);
      tornEdge(ctx, bx + bw, by + bh, bx, by + bh, 12, 8.9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 人像剪片
      const pw = W * 0.27, ph = pw * 1.30;
      const px = W * 0.585, py = H * 0.17;
      const face = polyPath(FACE, px, py, pw, ph);
      ctx.save();
      U.softShadow(ctx, px + pw * 0.56, py + ph * 0.62, pw * 0.5, ph * 0.42, 0.22);
      // 白剪边：把人像放大一点填白，再压深色网点
      ctx.save();
      ctx.translate(px + pw * 0.5, py + ph * 0.5);
      ctx.scale(1.035, 1.035);
      ctx.translate(-(px + pw * 0.5), -(py + ph * 0.5));
      ctx.fillStyle = '#fbf6e8';
      ctx.fill(face);
      ctx.restore();

      ctx.fillStyle = INK;
      ctx.save();
      halftonePortrait(ctx, face, { x: px, y: py, w: pw, h: ph }, t);
      ctx.restore();
      ctx.restore();

      // 嘴：单独一片纸，随音效开合
      const mouthY = py + ph * 0.735;
      const flap = Math.abs(Math.sin(stepT * 9.4)) * 10;
      ctx.save();
      ctx.fillStyle = '#fbf6e8';
      ctx.beginPath();
      ctx.ellipse(px + pw * 0.76, mouthY, pw * 0.045, 6 + flap * 0.6, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3a2118';
      ctx.beginPath();
      ctx.ellipse(px + pw * 0.76, mouthY, pw * 0.028, 2 + flap * 0.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 头盖：以眉线为轴向后翻，翻开后露出颅内的深空
      const open = U.easeInOut(U.p(t, 2.35, 0.95));
      const hingeY = py + ph * 0.36;
      const lidAngle = open * 1.75;
      const lidSy = Math.cos(lidAngle);

      if (open > 0.02) {
        // 颅内：只画在脸的轮廓里
        ctx.save();
        ctx.clip(face);
        ctx.fillStyle = '#0a0f22';
        ctx.beginPath();
        ctx.ellipse(px + pw * 0.36, py + ph * 0.28, pw * 0.44, ph * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
        const rnd = U.rng(77);
        for (let i = 0; i < 90; i++) {
          const sx = px + pw * (0.02 + rnd() * 0.62);
          const sy = py + ph * (0.10 + rnd() * 0.30);
          ctx.fillStyle = `rgba(255,240,210,${0.35 + rnd() * 0.6})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 0.7 + rnd() * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // 带环行星
        const plx = px + pw * 0.44, ply = py + ph * 0.27;
        ctx.fillStyle = '#e9c06a';
        ctx.beginPath();
        ctx.arc(plx, ply, pw * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(233,192,106,0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(plx, ply, pw * 0.13, pw * 0.032, -0.35, 0, Math.PI * 2);
        ctx.stroke();
        // 颅内一层暖反光，别是纯黑洞
        const ig = ctx.createRadialGradient(plx, ply, 0, plx, ply, pw * 0.3);
        ig.addColorStop(0, 'rgba(120,90,160,0.35)');
        ig.addColorStop(1, 'rgba(10,15,34,0)');
        ctx.fillStyle = ig;
        ctx.fillRect(px, py, pw, ph);
        ctx.restore();
      }

      // 头盖本体：faces 上半部分，按 hinge 折叠
      ctx.save();
      ctx.translate(px + pw * 0.50, hingeY);
      ctx.rotate(-open * 0.08);
      ctx.scale(1, lidSy);
      ctx.translate(-(px + pw * 0.50), -hingeY);
      ctx.save();
      ctx.clip(face);
      ctx.fillStyle = '#fbf6e8';
      ctx.fillRect(px - 30, py - 40, pw + 60, hingeY - py + 44);
      ctx.fillStyle = INK;
      halftonePortrait(ctx, face, { x: px, y: py, w: pw, h: hingeY - py }, t);
      ctx.restore();
      // 头的断面：一条暗线
      ctx.strokeStyle = 'rgba(27,23,18,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px + pw * 0.02, hingeY);
      ctx.lineTo(px + pw * 0.62, hingeY);
      ctx.stroke();
      ctx.restore();

      // ---------- 喷出来的东西 ----------
      const pop = (t0, dur) => U.easeOut(U.p(t, t0, dur));
      const spill = [
        { t0: 3.0, x: 0.30, y: 0.62, kind: 'flower', c: RED },
        { t0: 3.35, x: 0.66, y: 0.42, kind: 'bird', c: '#1e3a5f' },
        { t0: 3.7, x: 0.20, y: 0.38, kind: 'hand', c: KRAFT },
        { t0: 4.05, x: 0.74, y: 0.66, kind: 'rocket', c: '#efe7d2' },
        { t0: 4.4, x: 0.38, y: 0.30, kind: 'flower', c: '#e8a33d' },
        { t0: 4.75, x: 0.58, y: 0.72, kind: 'bird', c: RED },
      ];
      for (const s of spill) {
        const k = pop(s.t0, 0.55);
        if (k <= 0) continue;
        const ox = W * (0.42 + (s.x - 0.42) * k) + Math.sin(k * 6.2) * W * 0.012;
        const oy = H * (0.42 + (s.y - 0.42) * k) - Math.sin(k * Math.PI) * H * 0.10;
        const rot = (1 - k) * 1.2 + s.t0 * 0.4;
        const sc = 0.9 + k * 1.35;
        ctx.save();
        ctx.translate(ox + jx, oy + jy);
        ctx.rotate(rot);
        ctx.scale(sc, sc);
        if (s.kind === 'flower') {
          ctx.fillStyle = s.c;
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(Math.cos(a) * 26, Math.sin(a) * 26, 22, 15, a, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#fbf6e8';
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.kind === 'bird') {
          ctx.fillStyle = s.c;
          ctx.beginPath();
          ctx.moveTo(-46, 6); ctx.quadraticCurveTo(-10, -34, 18, -2);
          ctx.quadraticCurveTo(44, -30, 54, 4);
          ctx.quadraticCurveTo(16, 24, -46, 6);
          ctx.fill();
          ctx.fillStyle = '#fbf6e8';
          ctx.beginPath();
          ctx.arc(20, -2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (s.kind === 'hand') {
          ctx.fillStyle = s.c;
          ctx.beginPath();
          ctx.roundRect(-16, -50, 32, 74, 10);
          ctx.fill();
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.roundRect(-15 + i * 9, -74 - (i === 1 || i === 2 ? 6 : 0), 7, 34, 3.5);
            ctx.fill();
          }
          ctx.strokeStyle = 'rgba(27,23,18,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-10, 20); ctx.lineTo(-10, -20);
          ctx.stroke();
        } else {
          ctx.fillStyle = s.c;
          ctx.beginPath();
          ctx.moveTo(0, -56);
          ctx.quadraticCurveTo(24, -10, 16, 34);
          ctx.lineTo(-16, 34);
          ctx.quadraticCurveTo(-24, -10, 0, -56);
          ctx.fill();
          ctx.fillStyle = RED;
          ctx.beginPath();
          ctx.moveTo(-16, 16); ctx.lineTo(-34, 44); ctx.lineTo(-16, 40); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(16, 16); ctx.lineTo(34, 44); ctx.lineTo(16, 40); ctx.fill();
          ctx.fillStyle = '#1e3a5f';
          ctx.beginPath();
          ctx.arc(0, -20, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 胶带
      ctx.save();
      ctx.translate(W * 0.53, H * 0.19);
      ctx.rotate(-0.35);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#f3e7b8';
      ctx.fillRect(-70, -18, 140, 36);
      ctx.restore();

      // 构成主义红黑标题
      const tg = U.easeOut(U.p(t, 1.2, 0.5));
      if (tg > 0) {
        ctx.save();
        ctx.translate(W * 0.075 + jx, H * 0.26 + jy);
        ctx.rotate(-0.06);
        ctx.globalAlpha = tg;
        ctx.fillStyle = RED;
        ctx.font = '800 ' + Math.round(H * 0.105) + 'px "Microsoft YaHei", "Segoe UI", sans-serif';
        ctx.fillText('脑洞', 0, 0);
        ctx.fillStyle = INK;
        ctx.fillText('大开', H * 0.06, H * 0.115);
        ctx.fillStyle = RED;
        ctx.fillRect(-6, H * 0.135, W * 0.16, 6);
        ctx.fillStyle = INK;
        ctx.font = '600 ' + Math.round(H * 0.022) + 'px "Segoe UI", sans-serif';
        ctx.fillText('THE MIND IS A COLLAGE', 0, H * 0.185);
        ctx.restore();
      }

      // 页翻到结束卡
      const flip = U.easeInOut(U.p(t, 6.7, 0.9));
      if (flip > 0) {
        // 原页面沿左边翻起
        ctx.save();
        ctx.translate(0, 0);
        const sc = Math.max(0.02, Math.cos(flip * Math.PI / 2));
        ctx.translate(W * 0.5, H * 0.5);
        ctx.scale(sc, 1);
        ctx.translate(-W * 0.5, -H * 0.5);
        ctx.globalAlpha = 1 - flip * 0.3;
        ctx.fillStyle = NEWS;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        if (flip > 0.45) {
          const a = U.p(flip, 0.45, 0.55);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.fillStyle = '#f2ead6';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = INK;
          ctx.font = '800 ' + Math.round(H * 0.10) + 'px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('THE MIND', W * 0.5, H * 0.45);
          ctx.fillStyle = RED;
          ctx.fillText('IS A COLLAGE', W * 0.5, H * 0.60);
          ctx.restore();
        }
      }
    },
  };
})();
