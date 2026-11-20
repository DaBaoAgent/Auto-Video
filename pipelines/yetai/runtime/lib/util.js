/* Auto-Video · 本地舞台工具（自研）
   只做舞台尺寸、确定性随机、缓动、噪声、纸纹与颜色这几件事。
   场景脚本不依赖任何外部库；同一个时间点永远画出同一帧。 */
(() => {
  const U = {};
  U.W = 1920;
  U.H = 1080;
  U.setStage = (w, h) => { U.W = w; U.H = h; };

  // mulberry32：定种子随机，逐帧调用也不会漂
  U.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  U.hash = (n) => {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  U.clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.p = (t, start, dur) => U.clamp((t - start) / Math.max(1e-6, dur));
  U.easeOut = (x) => 1 - Math.pow(1 - U.clamp(x), 3);
  U.easeInOut = (x) => { x = U.clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  U.smooth = (x) => { x = U.clamp(x); return x * x * (3 - 2 * x); };
  U.back = (x) => { x = U.clamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  // 值噪声：纸纹、岩面、粒子抖动都用它
  U.noise = (x, y, seed = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = x - xi, fy = y - yi;
    const h = (a, b) => U.hash(a * 157.31 + b * 311.7 + seed * 91.7);
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return U.lerp(U.lerp(h(xi, yi), h(xi + 1, yi), ux), U.lerp(h(xi, yi + 1), h(xi + 1, yi + 1), ux), uy);
  };

  // 折线按比例揭示：一条笔画从起笔长到收笔
  U.tracePartial = (ctx, pts, frac) => {
    if (frac <= 0) return;
    const n = pts.length;
    const end = Math.max(2, Math.ceil(n * U.clamp(frac)));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < end; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  };

  U.rgba = (hex, a) => {
    if (typeof hex === 'string' && (hex.startsWith('rgb(') || hex.startsWith('rgba('))) return hex;
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  };

  // 纸纹：底色 + 纤维 + 细颗粒，固定种子，逐帧不变
  U.paper = (ctx, w, h, base, seed = 1, grain = 0.5) => {
    ctx.save();
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const r = U.rng(seed);
    ctx.globalAlpha = 0.35 * grain;
    for (let i = 0; i < 2400; i++) {
      const x = r() * w, y = r() * h, l = 2 + r() * 14, a = r() * 0.5;
      ctx.strokeStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 0.5})`;
      ctx.lineWidth = 0.6 + r() * 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + l, y + (r() - 0.5) * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < w * h / 1400; i++) {
      const x = r() * w, y = r() * h;
      ctx.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.05 * grain})`;
      ctx.fillRect(x, y, 1 + r() * 2, 1 + r() * 2);
    }
    ctx.restore();
  };

  // 柔和投影：场景里给纸片/笔触垫一层环境影
  U.softShadow = (ctx, x, y, rx, ry, a = 0.18) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / Math.max(rx, ry));
    ctx.translate(-x, -y);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  window.U = U;
})();
