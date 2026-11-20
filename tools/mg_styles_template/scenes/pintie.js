/* 拼贴剪贴 · 纸上城（自研）
   题材刻意避开上游的"半调人像开脑"：这里是旧报纸上剪出来的一座城——
   楼房剪片、纸太阳、纸火车、撕边云、飞鸟剪影，最后贴一条标题纸带与红章。
   全片 12 fps 定格，位移 ±2px 手摆抖动，纸片一律白剪边 + 落影。 */
(() => {
  const C = {
    table: '#cabca4', paper: '#efe6d0', ink: '#20252a', red: '#bd3a2c',
    kraft: '#d6b184', teal: '#41695f', cream: '#f8f1de',
  };
  const FPS_STEP = 12;

  // 定格抖动：12fps 重算一次，幅度 ±2px
  function jit(t, seed, amp = 2) {
    const f = Math.floor(t * FPS_STEP);
    return (U.hash(seed * 91.7 + f * 13.3) * 2 - 1) * amp;
  }

  // 撕边矩形（闭合多边形）
  function tornRect(w, h, seed, amp = 5) {
    const pts = [];
    const n = 10;
    const edges = [
      [-w / 2, -h / 2, w / 2, -h / 2],
      [w / 2, -h / 2, w / 2, h / 2],
      [w / 2, h / 2, -w / 2, h / 2],
      [-w / 2, h / 2, -w / 2, -h / 2],
    ];
    edges.forEach((e, ei) => {
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const x = U.lerp(e[0], e[2], u);
        const y = U.lerp(e[1], e[3], u);
        const nx = ei % 2 === 0 ? 0 : 1;
        const ny = 1 - nx;
        const off = (U.hash(seed + ei * 31 + i * 7) * 2 - 1) * amp;
        pts.push([x + nx * off, y + ny * off]);
      }
    });
    return pts;
  }

  function tornCircle(r, seed, amp = 4) {
    const pts = [];
    const n = 56;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r + (U.hash(seed + i * 5.1) * 2 - 1) * amp;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }

  function path(ctx, pts, k = 1) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p[0] * k, p[1] * k) : ctx.moveTo(p[0] * k, p[1] * k)));
    ctx.closePath();
  }

  // 一张纸片：白剪边（带影）→ 本体 → 可选半调网点
  function piece(ctx, x, y, rot, pts, fill, opt = {}) {
    const k = opt.scale === undefined ? 1 : opt.scale;
    const alpha = opt.alpha === undefined ? 1 : opt.alpha;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(k, k);
    ctx.shadowColor = 'rgba(40,28,16,0.34)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 7;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#fffdf6';
    path(ctx, pts, 1.035);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = fill;
    path(ctx, pts, 1);
    ctx.fill();
    if (opt.ht) {
      ctx.save();
      path(ctx, pts, 1);
      ctx.clip();
      ctx.fillStyle = opt.ht.color;
      const step = opt.ht.step || 9;
      for (let xx = -140; xx < 140; xx += step) {
        for (let yy = -140; yy < 140; yy += step) {
          ctx.beginPath();
          ctx.arc(xx, yy, opt.ht.r || 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function windows(ctx, x, y, w, h, cols, rows, color) {
    ctx.save();
    ctx.fillStyle = color;
    const cw = w / cols, ch = h / rows;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        ctx.fillRect(x + i * cw + cw * 0.30, y + j * ch + ch * 0.22, cw * 0.24, ch * 0.34);
      }
    }
    ctx.restore();
  }

  // 报纸版心：报头 + 假栏线 + 一块半调照片位
  function newspaper(ctx, x, y, w, h, seed) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(60,50,40,0.16)';
    ctx.fillRect(-w / 2 + 5, -h / 2 + 8, w, h);
    ctx.fillStyle = C.paper;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = 'rgba(35,32,28,0.85)';
    ctx.fillRect(-w / 2 + 18, -h / 2 + 14, w * 0.5, 14);
    ctx.fillStyle = 'rgba(35,32,28,0.5)';
    ctx.fillRect(-w / 2 + 18, -h / 2 + 38, w * 0.34, 5);
    const cols = 4, cw = (w - 40) / cols;
    const r = U.rng(seed);
    for (let c = 0; c < cols; c++) {
      const cx = -w / 2 + 20 + c * cw;
      ctx.fillStyle = 'rgba(50,46,40,0.10)';
      ctx.fillRect(cx - 6, -h / 2 + 60, 1, h - 80);
      let yy = -h / 2 + 62;
      while (yy < h / 2 - 26) {
        const lw = (0.5 + r() * 0.45) * (cw - 14);
        ctx.fillStyle = 'rgba(45,42,38,' + (0.16 + r() * 0.14) + ')';
        ctx.fillRect(cx, yy, lw, 3 + r() * 2);
        yy += 9 + r() * 3;
      }
    }
    // 半调照片位：印的是一座城的剪影，不是人像
    const px = w * 0.15, py = h * 0.06, pw = w * 0.30, ph = h * 0.24;
    ctx.fillStyle = 'rgba(240,232,214,0.9)';
    ctx.fillRect(-w / 2 + px, -h / 2 + py, pw, ph);
    const sky = [];
    for (let i = 0; i < 7; i++) sky.push(0.25 + U.hash(seed + i * 9) * 0.55);
    ctx.save();
    ctx.translate(-w / 2 + px, -h / 2 + py + ph);
    ctx.fillStyle = '#2c2a26';
    const bwid = pw / sky.length;
    sky.forEach((sh, i) => {
      ctx.fillRect(i * bwid + 1, -ph * sh, bwid - 2, ph * sh);
    });
    ctx.fillStyle = 'rgba(240,232,214,0.7)';
    for (let xx = 0; xx < pw; xx += 7) {
      for (let yy = 0; yy < ph * 0.95; yy += 7) {
        if (U.noise(xx / 22, yy / 22, seed + 3) > 0.55) {
          ctx.fillRect(xx, yy, 3, 3);
        }
      }
    }
    ctx.restore();
    ctx.restore();
  }

  function tram(ctx, x, y, s, t) {
    const wheel = (wx) => {
      ctx.fillStyle = C.ink;
      ctx.beginPath();
      ctx.arc(wx, 26, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(wx, 26, 3, 0, Math.PI * 2);
      ctx.fill();
    };
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    [-1, 0.2, 1.4].forEach((off, i) => {
      ctx.save();
      ctx.translate(off * 90, 0);
      ctx.shadowColor = 'rgba(40,28,16,0.32)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fffdf6';
      ctx.fillRect(-46, -34, 92, 56);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = i === 1 ? C.red : C.kraft;
      ctx.fillRect(-44, -32, 88, 52);
      ctx.fillStyle = 'rgba(250,244,226,0.92)';
      ctx.fillRect(-36, -24, 30, 20);
      ctx.fillRect(-2, -24, 30, 20);
      ctx.fillStyle = 'rgba(35,32,28,0.25)';
      ctx.fillRect(-36, -24, 30, 4);
      ctx.fillRect(-2, -24, 30, 4);
      wheel(-26);
      wheel(24);
      if (i === 1) {
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(-10, -64);
        ctx.stroke();
      }
      ctx.restore();
    });
    ctx.restore();
  }

  function bird(ctx, x, y, s, flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * (flip ? -1 : 1), s);
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-14, -10, -26, -2);
    ctx.quadraticCurveTo(-14, -4, 0, 6);
    ctx.quadraticCurveTo(14, -4, 26, -2);
    ctx.quadraticCurveTo(14, -10, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  window.SCENES = window.SCENES || {};
  window.SCENES.pintie = {
    init: async () => {},
    draw(ctx, t) {
      const W = U.W, H = U.H;

      U.paper(ctx, W, H, C.table, 7, 0.7);
      const vg = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.2, W * 0.5, H * 0.45, W * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(50,35,20,0.35)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // 定格式推镜：按 12fps 跳
      const step = Math.floor(t * FPS_STEP);
      const zoom = 1.0 + Math.min(step, 120) / 120 * 0.05;
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(zoom, zoom);
      ctx.translate(-W * 0.5, -H * 0.5);

      // 报纸整张（开场即滑进来）
      const nx = U.lerp(-W * 0.12, W * 0.42, U.easeOut(U.p(t, 0.0, 0.55)));
      newspaper(ctx, nx, H * 0.52, W * 0.62, H * 0.80, 11);

      // 红纸太阳（从楼后升起）
      const sunT = U.p(t, 1.1, 1.0);
      const sunY = U.lerp(H * 0.56, H * 0.30, U.easeOut(sunT));
      piece(ctx, W * 0.31 + jit(t, 5), sunY + jit(t, 6), -0.4, tornCircle(H * 0.090, 21), C.cream);
      ctx.save();
      ctx.globalAlpha = U.clamp(sunT * 1.3);
      piece(ctx, W * 0.31 + jit(t, 5), sunY + jit(t, 6), 0, tornCircle(H * 0.081, 22), C.red);
      ctx.restore();

      // 撕边云
      piece(ctx, W * (0.58 + 0.02 * Math.sin(t * 0.5)) + jit(t, 8), H * 0.155 + jit(t, 9), -0.02,
        tornCircle(H * 0.052, 31, 8), C.cream);
      piece(ctx, W * (0.20 + 0.02 * Math.cos(t * 0.4)) + jit(t, 10), H * 0.20, 0.03,
        tornCircle(H * 0.038, 32, 7), C.cream);

      // 楼群：从上方落纸到位
      const baseY = H * 0.74;
      const buildings = [
        [0.13, 0.17, 0.105, C.cream, 1.2],
        [0.245, 0.26, 0.125, C.kraft, 1.45],
        [0.375, 0.15, 0.095, C.teal, 1.7],
        [0.475, 0.31, 0.13, C.cream, 1.9],
        [0.615, 0.21, 0.115, C.red, 2.1],
      ];
      buildings.forEach((b, i) => {
        const bx = b[0], bh = b[1], bw = b[2], col = b[3], t0 = b[4];
        const p = U.clamp((t - t0) / 0.45);
        if (p <= 0) return;
        const drop = U.lerp(-H * 0.12, 0, U.easeOut(p));
        const bwpx = W * bw, bhpx = H * bh;
        piece(ctx, W * bx + jit(t, 20 + i), baseY - bhpx / 2 + drop + jit(t, 30 + i), 0,
          tornRect(bwpx, bhpx, 40 + i * 7, 4), col);
        if (p > 0.6) {
          const top = baseY - bhpx + drop;
          const wy = top + bhpx * 0.14;
          ctx.save();
          ctx.globalAlpha = U.clamp((p - 0.6) * 2.5);
          windows(ctx, W * bx - bwpx * 0.38, wy, bwpx * 0.76, bhpx * 0.72,
            4, Math.max(3, Math.round(bhpx / 42)),
            col === C.red || col === C.teal ? 'rgba(248,241,222,0.9)' : 'rgba(32,37,42,0.55)');
          ctx.restore();
          // 屋顶：天线上那颗钉
          ctx.fillStyle = 'rgba(32,37,42,0.85)';
          ctx.fillRect(W * bx, top - 14, 2, 14);
          ctx.beginPath();
          ctx.arc(W * bx, top - 16, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 轨道
      ctx.save();
      ctx.strokeStyle = 'rgba(32,37,42,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.805);
      ctx.lineTo(W * 0.74, H * 0.805);
      ctx.stroke();
      ctx.setLineDash([10, 12]);
      ctx.strokeStyle = 'rgba(32,37,42,0.35)';
      ctx.beginPath();
      ctx.moveTo(W * 0.08, H * 0.790);
      ctx.lineTo(W * 0.74, H * 0.790);
      ctx.stroke();
      ctx.restore();

      // 纸火车：先驶入停在画左，结尾再驶出
      if (t > 2.8) {
        const inP = U.easeOut(U.p(t, 2.8, 1.6));
        const outP = U.easeInOut(U.p(t, 8.2, 1.5));
        const tx = t < 8.2 ? U.lerp(-W * 0.16, W * 0.28, inP) : U.lerp(W * 0.28, W * 1.12, outP);
        tram(ctx, tx, H * 0.777 + jit(t, 41, 1.4), H / 1080 * 1.15, t);
      }

      // 飞鸟剪影
      for (let i = 0; i < 4; i++) {
        const bp = U.p(t, 2.2 + i * 0.18, 3.4);
        if (bp <= 0 || bp >= 1) continue;
        const bxp = U.lerp(W * 0.10, W * 0.82, bp);
        const byp = H * (0.30 + i * 0.035) - Math.sin(bp * Math.PI) * H * 0.10;
        bird(ctx, bxp, byp, H * 0.0022 * (1 + i * 0.12), i % 2 === 0);
      }

      // 标题纸带
      const ttl = U.p(t, 6.6, 0.55);
      if (ttl > 0) {
        const ty = U.lerp(H * 1.06, H * 0.175, U.back(ttl));
        ctx.save();
        ctx.translate(W * 0.775, ty);
        ctx.rotate(-0.055);
        ctx.shadowColor = 'rgba(40,28,16,0.4)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 12;
        ctx.fillStyle = C.paper;
        ctx.fillRect(-W * 0.155, -H * 0.085, W * 0.31, H * 0.17);
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = C.table;
        for (let i = 0; i < 8; i++) {
          const yy = -H * 0.085 + i * H * 0.021;
          ctx.beginPath();
          ctx.arc(-W * 0.155, yy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(W * 0.155, yy + 6, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = C.ink;
        ctx.font = '800 ' + Math.round(H * 0.072) + 'px "Microsoft YaHei", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('纸上城', 0, H * 0.018);
        ctx.font = '600 ' + Math.round(H * 0.020) + 'px "Segoe UI", sans-serif';
        ctx.fillStyle = C.red;
        ctx.fillText('P A P E R   C I T Y', 0, H * 0.062);
        ctx.restore();
      }

      // 红章
      const st = U.p(t, 8.4, 0.30);
      if (st > 0) {
        const k = 1.5 - 0.5 * U.back(st);
        ctx.save();
        ctx.translate(W * 0.755, H * 0.755);
        ctx.rotate(-0.14);
        ctx.scale(k, k);
        ctx.globalAlpha = 0.92;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 5;
        ctx.strokeRect(-H * 0.075, -H * 0.033, H * 0.15, H * 0.066);
        ctx.fillStyle = C.red;
        ctx.font = '800 ' + Math.round(H * 0.024) + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('剪贴 · 06', 0, H * 0.010);
        ctx.restore();
      }

      // 边角胶带
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = 'rgba(245,240,220,0.85)';
      [[0.10, 0.13, -0.5], [0.74, 0.12, 0.35]].forEach((a) => {
        ctx.save();
        ctx.translate(W * a[0], H * a[1]);
        ctx.rotate(a[2]);
        ctx.fillRect(-W * 0.035, -H * 0.015, W * 0.07, H * 0.03);
        ctx.restore();
      });
      ctx.restore();

      ctx.restore();
    },
  };
})();
