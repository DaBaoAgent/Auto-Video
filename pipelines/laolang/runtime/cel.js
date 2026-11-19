// cel.js — 1980 上海美影厂手绘赛璐璐的"整帧"工艺层（《老狼请客》质感）
// 挂在 goldenage 的 opt.post 上：一张画完的整帧（绘景 + 人物）当成一张赛璐璐片来洗印。
//   1) 描线：在手绘形体的边缘落暖褐墨线，笔压随形体变化，低频道断开（不是照片滤镜）
//   2) 调色：提亮、暖高光、冷暗部、收反差、提饱和——80 年代拷贝片的天光色
//   3) 纸纹：颜料颗粒 + 纸纤维，平涂面不再是矢量色块
// 用法：
//   PROMO.laolang(F, { post: (c) => CEL.frame(c, { exp: 1.06, con: 1.02, sat: 1.12 }) })
//   CEL.ink(c) / CEL.grade(c) / CEL.tooth(c) 可单独调用。
(function () {
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const INK = [40, 31, 24];          // 暖褐墨：不是死黑
  const lumOf = (r, g, b) => (r * 0.299 + g * 0.587 + b * 0.114) / 255;

  const seeded = (s) => { let a = (s >>> 0) || 7; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };

  /* 低频道噪声：512px 一格，双线性 —— 用来让墨线一段实一段虚 */
  const noiseGrid = (seed) => {
    const N = 64, g = new Float32Array(N * N), r = seeded(seed * 7919 + 13);
    for (let i = 0; i < g.length; i++) g[i] = r();
    return (x, y) => {
      const fx = x * N / 512, fy = y * N / 512;
      const x0 = ((fx | 0) % N + N) % N, y0 = ((fy | 0) % N + N) % N;
      const x1 = (x0 + 1) % N, y1 = (y0 + 1) % N;
      const tx = fx - Math.floor(fx), ty = fy - Math.floor(fy);
      const a0 = g[y0 * N + x0] * (1 - tx) + g[y0 * N + x1] * tx;
      const a1 = g[y1 * N + x0] * (1 - tx) + g[y1 * N + x1] * tx;
      return a0 * (1 - ty) + a1 * ty;
    };
  };

  /* ---------------- 1. 描线 ---------------- */
  const ink = (c, o = {}) => {
    const x = c.getContext('2d'), w = c.width, h = c.height, im = x.getImageData(0, 0, w, h), d = im.data;
    const n = w * h, lum = new Float32Array(n);
    for (let p = 0, i = 0; p < n; p++, i += 4) lum[p] = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    // 3×3 高斯：先压掉纸纹，只留形体边
    const bl = new Float32Array(n);
    for (let y = 0; y < h; y++) {
      const y0 = y > 0 ? y - 1 : 0, y1 = y < h - 1 ? y + 1 : h - 1;
      for (let xx = 0; xx < w; xx++) {
        const x0 = xx > 0 ? xx - 1 : 0, x1 = xx < w - 1 ? xx + 1 : w - 1;
        bl[y * w + xx] = (lum[y0 * w + x0] + lum[y0 * w + xx] * 2 + lum[y0 * w + x1] +
          lum[y * w + x0] * 2 + lum[y * w + xx] * 4 + lum[y * w + x1] * 2 +
          lum[y1 * w + x0] + lum[y1 * w + xx] * 2 + lum[y1 * w + x1]) / 16;
      }
    }
    const thr = o.inkThr ?? 7, k = (o.inkAmt ?? 0.55) / 100, max = o.inkMax ?? 0.62;
    const cInk = o.inkColor ?? INK, brk = noiseGrid(o.seed ?? 7);
    for (let y = 1; y < h - 1; y++) {
      for (let xx = 1; xx < w - 1; xx++) {
        const p = y * w + xx;
        const gx = bl[p + 1] - bl[p - 1], gy = bl[p + w] - bl[p - w];
        const g = Math.abs(gx) + Math.abs(gy);
        if (g <= thr) continue;
        const b = 0.52 + 0.48 * brk(xx, y);          // 手描的断笔
        const a = cl((g - thr) * k, 0, max) * b;
        if (a < 0.015) continue;
        const i = p * 4, l = bl[p] / 255;
        d[i] = d[i] * (1 - a) + (cInk[0] + 6 * l) * a;
        d[i + 1] = d[i + 1] * (1 - a) + (cInk[1] + 4 * l) * a;
        d[i + 2] = d[i + 2] * (1 - a) + (cInk[2] + 2 * l) * a;
      }
    }
    x.putImageData(im, 0, 0);
  };

  /* ---------------- 2. 调色 ---------------- */
  const grade = (c, o = {}) => {
    const x = c.getContext('2d'), im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    const exp = o.exp ?? 1.06, con = o.con ?? 1.02, sat = o.sat ?? 1.12, gam = o.gamma ?? 0.90;
    const liftR = o.liftR ?? 0.050, liftG = o.liftG ?? 0.034, liftB = o.liftB ?? -0.016;  // 高光暖
    const shR = o.shR ?? -0.004, shG = o.shG ?? 0.009, shB = o.shB ?? 0.045;             // 暗部偏青灰，不是全暖
    const floorV = o.floor ?? 0.06;
    // 高光肩部：曝光乘完先软压缩再进 gamma，天空才不会一刀切到 255（亮度 232 以上的像素全烧成纯白）
    const knee = (v) => {
      v *= exp;
      if (v > 0.82) v = 0.82 + 0.18 * Math.tanh((v - 0.82) / 0.18);
      return Math.pow(cl(v, 0, 1), gam);
    };
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      // 曝光 → 提暗部（gamma<1，拷贝片的高调子）→ 反差
      r = knee(r); g = knee(g); b = knee(b);
      r = (r - 0.5) * con + 0.5;
      g = (g - 0.5) * con + 0.5;
      b = (b - 0.5) * con + 0.5;
      // 饱和
      const l = lumOf(r, g, b);
      r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;
      // 分离色调：亮部暖黄、暗部青灰
      const lc = cl(l, 0, 1), hl = lc * lc * lc, sh = (1 - lc) * (1 - lc) * (1 - lc);
      r += liftR * hl + shR * sh;
      g += liftG * hl + shG * sh;
      b += liftB * hl + shB * sh;
      // 黑位留在暖褐，不压死
      // 反差之后可能为负：先夹到 0 再套黑位，否则 floor 被负值吃掉（树冠曾掉到 #0a070a）
      // 饱和+分离色调之后可能超过 1：上端一起夹住。
      // 顶在 0.97（247）——天空不该有一块纯白，那是数码高光溢出，不是 1980 年的拷贝片。
      r = cl(r, 0, 0.97); g = cl(g, 0, 0.97); b = cl(b, 0, 0.97);
      d[i] = cl((floorV + r * (1 - floorV)) * 255, 0, 255);
      d[i + 1] = cl((floorV + g * (1 - floorV)) * 255, 0, 255);
      d[i + 2] = cl((floorV + b * (1 - floorV)) * 255, 0, 255);
    }
    x.putImageData(im, 0, 0);
  };

  /* ---------------- 3. 纸纹 / 颜料颗粒 ---------------- */
  const tooth = (c, o = {}) => {
    const x = c.getContext('2d'), w = c.width, h = c.height, im = x.getImageData(0, 0, w, h), d = im.data;
    const amt = o.tooth ?? 0.055, r = seeded(o.seed ?? 3), n = w * h;
    for (let p = 0, i = 0; p < n; p++, i += 4) {
      if (d[i + 3] === 0) continue;
      const l = lumOf(d[i], d[i + 1], d[i + 2]);
      const mid = 1 - Math.abs(l - 0.5) * 1.6;            // 中间调颗粒最重，亮部/暗部轻
      const v = (r() - 0.5) * 255 * amt * (0.55 + 0.45 * mid);
      d[i] = cl(d[i] + v * 1.10, 0, 255);
      d[i + 1] = cl(d[i + 1] + v, 0, 255);
      d[i + 2] = cl(d[i + 2] + v * 0.84, 0, 255);
    }
    x.putImageData(im, 0, 0);
    // 纸纤维：极淡的横向短毛
    x.save(); x.globalAlpha = 0.030; x.strokeStyle = '#2a211a';
    const rr = seeded((o.seed ?? 3) + 11);
    for (let i = 0; i < (o.fiber ?? 800); i++) {
      const yy = rr() * h, xx = rr() * w, len = 6 + rr() * 22;
      const ang = (rr() - 0.5) * 0.9;              // 纤维方向散开，不要全部横向拉丝
      x.lineWidth = 0.9 + rr() * 1.6;
      x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + Math.cos(ang) * len, yy + Math.sin(ang) * len); x.stroke();
    }
    x.restore();
  };

  /* ---------------- 0. 手绘抖动 ----------------
     把每一条“数学上笔直”的边轻微推歪 1px（低频噪声位移重采样）。
     赛璐璐的线是手描的，窗口、墙沿、水线都不该是尺子画出来的。 */
  const wobble = (c, o = {}) => {
    const amp = o.wobble ?? 0.85;
    if (amp <= 0) return;
    const x = c.getContext('2d'), w = c.width, h = c.height;
    const im = x.getImageData(0, 0, w, h), src = new Uint8ClampedArray(im.data), d = im.data;
    const N = noiseGrid((o.seed ?? 5) + 31);
    for (let y = 1; y < h - 1; y++) {
      for (let xx = 1; xx < w - 1; xx++) {
        const dx = (N(xx, y) - 0.5) * 2 * amp;
        const dy = (N(xx + 317, y + 641) - 0.5) * 2 * amp;
        const fx = xx + dx, fy = y + dy;
        const x0 = fx | 0, y0 = fy | 0;
        if (x0 < 0 || y0 < 0 || x0 >= w - 1 || y0 >= h - 1) continue;
        const tx = fx - x0, ty = fy - y0, i = (y * w + xx) * 4;
        const i00 = (y0 * w + x0) * 4, i10 = i00 + 4, i01 = i00 + w * 4, i11 = i01 + 4;
        for (let k = 0; k < 3; k++) {
          const a0 = src[i00 + k] * (1 - tx) + src[i10 + k] * tx;
          const a1 = src[i01 + k] * (1 - tx) + src[i11 + k] * tx;
          d[i + k] = a0 * (1 - ty) + a1 * ty;
        }
      }
    }
    x.putImageData(im, 0, 0);
  };

  /* ---------------- 整帧：抖动 → 描线 → 调色 → 纸纹 ---------------- */
  const frame = (c, o = {}) => {
    if (o.wobble !== 0) wobble(c, o);
    if (o.ink !== false) ink(c, o);
    if (o.grade !== false) grade(c, o);
    if (o.tooth !== false) tooth(c, o);
  };

  /* ---------------- 绘景用的水粉笔触 ----------------
     在一片区域上刷 n 道方向一致的软笔触，色相从 cols 里取，打破平涂。
     dir: 0=横 1=竖 2=斜下(45°) 3=斜上 */
  const brush = (x, x0, y0, w, h, n, cols, o = {}) => {
    const a = o.a ?? 0.10, dir = o.dir ?? 0, len = o.len ?? 1, wid = o.wid ?? 1;
    const r = seeded(o.seed ?? 9);
    x.save();
    for (let i = 0; i < n; i++) {
      const px = x0 + r() * w, py = y0 + r() * h;
      const L = (30 + r() * 120) * len, W = (3 + r() * 12) * wid;
      const ang = dir === 0 ? (r() - 0.5) * 0.10 : dir === 1 ? Math.PI / 2 + (r() - 0.5) * 0.10 : dir === 2 ? Math.PI / 4 + (r() - 0.5) * 0.2 : -Math.PI / 4 + (r() - 0.5) * 0.2;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      x.globalAlpha = a * (0.35 + r() * 0.9);
      x.strokeStyle = cols[(r() * cols.length) | 0];
      x.lineWidth = W; x.lineCap = 'round';
      x.beginPath(); x.moveTo(px, py);
      x.quadraticCurveTo(px + dx * L * 0.55 + dy * (r() - 0.5) * W, py + dy * L * 0.55 - dx * (r() - 0.5) * W, px + dx * L, py + dy * L);
      x.stroke();
    }
    x.restore();
  };

  /* ---------------- 湿边：水粉/水彩边缘的颜料沉淀 ---------------- */
  const wetEdge = (x, x0, y0, w, h, col = 'rgba(40,52,46,.10)', n = 60, seed = 5) => {
    const r = seeded(seed);
    x.save(); x.globalAlpha = 1;
    for (let i = 0; i < n; i++) {
      const yy = y0 + r() * h, xx = x0 + r() * w, len = 20 + r() * 90;
      x.strokeStyle = col; x.lineWidth = 0.6 + r() * 1.4; x.globalAlpha = 0.35 + r() * 0.5;
      x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + len, yy + (r() - 0.5) * 2); x.stroke();
    }
    x.restore();
  };

  window.CEL = { frame, ink, grade, tooth, wobble, brush, wetEdge, mk, seeded, INK };
})();
