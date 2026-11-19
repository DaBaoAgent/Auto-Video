// STYLEKIT · Auto-Video 自研风格渲染内核
//
// 77 条 外部风格管线共用这一份绘制原语，但每条管线的画面（形状坐标、色板、纹理、
// 运镜节拍）都写在自己的 main.js 里，不依赖任何上游脚本。
//
// 约束（与 CONTRIBUTING 一致）：
//   1. 确定性：只用 seeded RNG，禁 Math.random / Date.now。
//   2. 一帧一画：render(t) 从空白画布重画，不叠加上一帧残留。
//   3. 只输出画面：不做配音、不写字幕，字幕由管线外层负责。
//
// 用法（main.js）：
//   const ENV = STYLEKIT.page(canvas, { w: 1920, h: 1080, seed: 'muke' });
//   window.renderAt = (t) => STYLEKIT.scene(ENV, SPEC, t);
//   window.__ready = true;

(function () {
  'use strict';

  // ---------- 基础 ----------
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const easeIn = (x) => Math.pow(clamp(x), 2.2);
  const lerp = (a, b, k) => a + (b - a) * k;

  function hash(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  // mulberry32：同一 seed 永远是同一串数
  function rng(seed) {
    let a = typeof seed === 'string' ? hash(seed) : seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const pick = (r, arr) => arr[Math.floor(r() * arr.length) % arr.length];
  const range = (r, a, b) => a + (b - a) * r();

  // 颜色：给定十六进制，按比例混白/混黑/调透明
  function parseHex(hex) {
    const s = String(hex).replace('#', '');
    const n = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  }
  function rgba(hex, alpha = 1) {
    const [r, g, b] = parseHex(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function mixHex(a, b, k) {
    const A = parseHex(a), B = parseHex(b);
    const c = A.map((v, i) => Math.round(lerp(v, B[i], k)));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  const shade = (hex, k) => (k >= 0 ? mixHex(hex, '#ffffff', k) : mixHex(hex, '#000000', -k));

  // ---------- 画布 ----------
  function page(canvas, opts) {
    const W = opts.w || 1920, H = opts.h || 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    // 每次 render 都重置到默认状态，避免上一帧的设置漏进来
    const reset = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.lineJoin = 'miter';
      ctx.lineCap = 'butt';
    };
    return { ctx, W, H, root: rng(opts.seed || 'style'), reset };
  }

  // ---------- 纸 / 底 ----------
  function paper(env, spec, r) {
    const { ctx, W, H } = env;
    const base = spec.bg || '#f2ede1';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // 纸纹：细噪点 + 稀疏纤维，靠 seeded RNG 逐点画，不用外部贴图
    const tooth = spec.tooth == null ? 0.5 : spec.tooth;
    if (tooth > 0) {
      const n = Math.round(W * H / 900 * tooth);
      const dark = shade(base, -0.22), light = shade(base, 0.16);
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H;
        ctx.fillStyle = rgba(r() < 0.5 ? dark : light, range(r, 0.05, 0.16));
        ctx.fillRect(x, y, range(r, 1, 2.4), range(r, 1, 2.4));
      }
    }
    // 纤维：几道很浅的长弧，让底不"死平"
    if (spec.fibers) {
      ctx.strokeStyle = rgba(shade(base, -0.3), 0.06);
      ctx.lineWidth = 1;
      for (let i = 0; i < 26; i++) {
        const y0 = r() * H;
        ctx.beginPath();
        ctx.moveTo(-20, y0);
        ctx.bezierCurveTo(W * 0.3, y0 + range(r, -30, 30), W * 0.7, y0 + range(r, -30, 30), W + 20, y0 + range(r, -18, 18));
        ctx.stroke();
      }
    }
    // 版心外的压痕
    if (spec.plate) {
      ctx.strokeStyle = rgba(shade(base, -0.45), 0.18);
      ctx.lineWidth = 2;
      const m = Math.round(Math.min(W, H) * 0.03);
      ctx.strokeRect(m, m, W - m * 2, H - m * 2);
    }
    vignette(env, spec.vignette == null ? 0.12 : spec.vignette, spec.vignetteColor || '#000000');
  }

  function vignette(env, amt, color) {
    if (!amt) return;
    const { ctx, W, H } = env;
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.78);
    g.addColorStop(0, rgba(color, 0));
    g.addColorStop(1, rgba(color, amt));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- 形状工具 ----------
  function shapesFromSpec(spec, r) {
    return (spec.forms || []).map((f) => ({ ...f }));
  }

  // 一条手绘感的折线：把直线拆成小节，每节加一点点偏移
  function handPath(ctx, pts, jitter, r) {
    ctx.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 12));
      for (let s = 0; s <= steps; s++) {
        const k = s / steps;
        const jx = s === 0 || s === steps ? 0 : range(r, -jitter, jitter);
        const jy = s === 0 || s === steps ? 0 : range(r, -jitter, jitter);
        const x = lerp(x0, x1, k) + jx, y = lerp(y0, y1, k) + jy;
        if (i === 0 && s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    }
  }

  // 形状 → 路径（供排线/网点/抖动取遮罩用）
  function formPath(ctx, f) {
    const { x, y, w, h } = f;
    ctx.beginPath();
    const kind = f.kind || 'blob';
    if (kind === 'rect') {
      ctx.rect(x, y, w, h);
    } else if (kind === 'circle') {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    } else if (kind === 'tri') {
      ctx.moveTo(x, y + h); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w, y + h); ctx.closePath();
    } else if (kind === 'arc') {
      ctx.moveTo(x, y + h);
      ctx.quadraticCurveTo(x + w / 2, y, x + w, y + h);
      ctx.closePath();
    } else if (kind === 'wave') {
      const amp = f.amp == null ? h : f.amp;
      ctx.moveTo(x, y + amp);
      for (let i = 0; i <= 6; i++) {
        const k = i / 6;
        ctx.lineTo(x + w * k, y + amp + Math.sin(k * Math.PI * 2 + (f.phase || 0)) * amp * 0.5);
      }
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    } else {
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, f.rot || 0, 0, Math.PI * 2);
    }
  }

  // ---------- 排线 ----------
  // 在形状内按固定角度排线，间距/线宽随形状明度变化（模拟刻刀的疏密）
  function hatch(env, f, opt, r) {
    const { ctx } = env;
    const angle = ((opt.angle == null ? 45 : opt.angle) * Math.PI) / 180;
    const gap = opt.gap || 8, lw = opt.width || 2, color = opt.color || '#111';
    const alpha = opt.alpha == null ? 1 : opt.alpha;
    const len = Math.hypot(f.w, f.h) + 20;
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;

    ctx.save();
    formPath(ctx, f);
    ctx.clip();
    ctx.strokeStyle = rgba(color, alpha);
    ctx.lineWidth = lw;
    ctx.lineCap = 'butt';
    const ca = Math.cos(angle), sa = Math.sin(angle);
    for (let d = -len; d <= len; d += gap) {
      const jitter = opt.jitter == null ? 0.6 : opt.jitter;
      ctx.beginPath();
      ctx.moveTo(cx - ca * len + sa * d + (r() - 0.5) * jitter, cy - sa * len - ca * d + (r() - 0.5) * jitter);
      ctx.lineTo(cx + ca * len + sa * d + (r() - 0.5) * jitter, cy + sa * len - ca * d + (r() - 0.5) * jitter);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 交叉排线：同一形状再压一道反角度的短排线
  function crossHatch(env, f, opt, r) {
    hatch(env, f, { ...opt, angle: (opt.angle || 45) - 78, jitter: 0.4 }, r);
  }

  // ---------- 网点 ----------
  // 半调网点：按颜色通道做偏移，模拟套印错位
  function halftone(env, f, opt, r) {
    const { ctx } = env;
    const cell = opt.cell || 14, color = opt.color || '#111', alpha = opt.alpha == null ? 0.9 : opt.alpha;
    const ang = ((opt.angle == null ? 45 : opt.angle) * Math.PI) / 180;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    ctx.save();
    formPath(ctx, f);
    ctx.clip();
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    const R = Math.hypot(f.w, f.h) * 0.75;
    for (let u = -R; u <= R; u += cell) {
      for (let v = -R; v <= R; v += cell) {
        const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
        const k = (f.tone == null ? 0.55 : f.tone) * range(r, 0.85, 1.15);
        ctx.fillStyle = rgba(color, alpha);
        ctx.beginPath();
        ctx.arc(x, y, (cell / 2) * Math.min(0.92, k), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 一位抖动：Bayer 4×4，只落黑点
  function dither(env, f, opt, r) {
    const { ctx } = env;
    const scale = opt.scale || 6, color = opt.color || '#101010';
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    ctx.save();
    formPath(ctx, f);
    ctx.clip();
    for (let y = Math.floor(f.y); y < f.y + f.h; y += scale) {
      for (let x = Math.floor(f.x); x < f.x + f.w; x += scale) {
        const ix = ((x - f.x) / scale) | 0, iy = ((y - f.y) / scale) | 0;
        const th = bayer[(iy % 4) * 4 + (ix % 4)] / 16;
        const k = f.tone == null ? 0.6 : f.tone;
        if (r() * 0.35 + k > th) {
          ctx.fillStyle = rgba(color, 0.92);
          ctx.fillRect(x, y, scale - 1, scale - 1);
        }
      }
    }
    ctx.restore();
  }

  // ---------- 光 ----------
  function glow(env, drawFn, opt) {
    const { ctx } = env;
    ctx.save();
    if (opt.blur) { ctx.shadowBlur = opt.blur; ctx.shadowColor = opt.color || '#fff'; }
    drawFn(ctx);
    ctx.restore();
  }

  function additiveGlowStroke(env, pts, opt, r) {
    const { ctx } = env;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const pass = opt.passes || 3;
    for (let p = 0; p < pass; p++) {
      ctx.strokeStyle = rgba(opt.color || '#7ff', (opt.alpha || 0.6) * (1 - p / (pass + 1)) * 0.7);
      ctx.lineWidth = (opt.width || 4) * (1 + p * 2.4);
      handPath(ctx, pts, opt.jitter == null ? 1.2 : opt.jitter, r);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 屏幕 ----------
  function scanlines(env, opt) {
    const { ctx, W, H } = env;
    const gap = opt.gap || 4, alpha = opt.alpha == null ? 0.22 : opt.alpha;
    ctx.fillStyle = rgba(opt.color || '#000', alpha);
    for (let y = 0; y < H; y += gap) ctx.fillRect(0, y, W, Math.max(1, gap / 2.2));
    // 色散：左右各一层极淡的红/青
    if (opt.chroma) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = rgba('#ff3b3b', 0.05);
      ctx.fillRect(-3, 0, W, H);
      ctx.fillStyle = rgba('#3bffff', 0.05);
      ctx.fillRect(3, 0, W, H);
      ctx.restore();
    }
  }

  // ---------- 三维推演 ----------
  // 等轴测投影：把 (x,y,z) 投到屏幕，供立体微缩/积木/白模用
  function iso(cx, cy, scale) {
    const c = (Math.sqrt(3) / 2) * scale;
    return {
      p: (x, y, z) => [cx + (x - y) * c, cy + (x + y) * scale * 0.5 - z * scale],
      box(ctx, x, y, z, w, d, h, colors) {
        const A = this.p(x, y, z + h), B = this.p(x + w, y, z + h);
        const C = this.p(x + w, y + d, z + h), D = this.p(x, y + d, z + h);
        const B2 = this.p(x + w, y, z), D2 = this.p(x, y + d, z);
        const top = [A, B, C, D];
        ctx.fillStyle = colors.top;
        poly(ctx, top);
        ctx.fillStyle = colors.left;
        poly(ctx, [D, C, this.p(x + w, y + d, z), D2]);
        ctx.fillStyle = colors.right;
        poly(ctx, [C, B, B2, this.p(x + w, y + d, z)]);
      },
    };
  }
  function poly(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
  }

  // ---------- 图纸 ----------
  function grid(env, opt) {
    const { ctx, W, H } = env;
    const gap = opt.gap || 80, minor = opt.minor || 20;
    ctx.save();
    ctx.strokeStyle = rgba(opt.color || '#8fb6d8', opt.alpha == null ? 0.35 : opt.alpha);
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += minor) { ctx.globalAlpha = x % gap === 0 ? 1 : 0.4; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += minor) { ctx.globalAlpha = y % gap === 0 ? 1 : 0.4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  function dimension(ctx, x1, y1, x2, y2, label, opt) {
    const color = (opt && opt.color) || '#20303d';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const tick = 8;
    [[x1, y1], [x2, y2]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x - Math.sin(ang) * tick, y + Math.cos(ang) * tick);
      ctx.lineTo(x + Math.sin(ang) * tick, y - Math.cos(ang) * tick);
      ctx.stroke();
    });
    if (label) {
      ctx.fillStyle = color;
      ctx.font = `${(opt && opt.size) || 18}px "AlibabaPuHuiTi"`;
      ctx.textAlign = 'center';
      ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 8);
    }
    ctx.restore();
  }

  // ---------- 粒子 ----------
  function particles(env, opt, r) {
    const { ctx, W, H } = env;
    const n = opt.n || 260;
    for (let i = 0; i < n; i++) {
      const x = range(r, 0, W), y = range(r, 0, H);
      const s = range(r, 0.6, opt.size || 3);
      ctx.fillStyle = rgba(opt.color || '#fff', range(r, 0.2, opt.alpha == null ? 0.9 : opt.alpha));
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- 字 ----------
  function type(env, text, opt) {
    const { ctx, W, H } = env;
    const size = opt.size || 96;
    ctx.save();
    ctx.fillStyle = opt.color || '#111';
    ctx.textAlign = opt.align || 'left';
    ctx.textBaseline = opt.baseline || 'alphabetic';
    const weight = opt.weight || 700;
    ctx.font = `${weight} ${size}px ${opt.font || '"AlibabaPuHuiTi", "Microsoft YaHei", sans-serif'}`;
    if (opt.letter) ctx.letterSpacing = `${opt.letter}px`;
    if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    if (opt.max) {
      // 中文按字宽硬切，够用就好
      let cur = '', out = [];
      for (const ch of text) {
        if (ctx.measureText(cur + ch).width > opt.max) { out.push(cur); cur = ch; } else cur += ch;
      }
      out.push(cur);
      out.forEach((line, i) => ctx.fillText(line, opt.x, opt.y + i * size * (opt.leading || 1.12)));
    } else {
      ctx.fillText(text, opt.x, opt.y);
    }
    ctx.restore();
  }

  // ============================================================
  // 风格族：每条管线挑一族 + 自己的形状表/色板/节拍
  // ============================================================

  // 1 刻印：木刻 / 铜版 / 凸版 / 孔版 / 丝印 —— 一色底 + 排线造明暗
  function famHatch(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    const r = rng(spec.seed + ':plate');
    paper(env, spec, r);
    const inks = spec.inks || ['#151515', '#c8452c'];
    const forms = shapesFromSpec(spec, r);
    const reveal = ease(clamp(t / (spec.beat || 3.2)));

    forms.forEach((f, i) => {
      const k = ease(clamp((t - i * 0.16) / 1.1));
      if (k <= 0) return;
      const g = ctx.createLinearGradient(f.x, f.y, f.x + f.w, f.y + f.h);
      g.addColorStop(0, rgba(inks[i % inks.length], 0.96));
      g.addColorStop(1, rgba(inks[(i + 1) % inks.length], 0.96));
      ctx.save();
      formPath(ctx, f);
      ctx.clip();
      ctx.fillStyle = g;
      ctx.globalAlpha = k;
      ctx.fillRect(f.x - 4, f.y - 4, f.w + 8, f.h + 8);
      ctx.restore();

      // 刻线：间距随形状大小变化，深色块上排浅线
      const gap = Math.max(5, Math.min(f.w, f.h) / (spec.density || 14));
      hatch(env, f, {
        angle: f.angle == null ? (spec.angle || 38) : f.angle,
        gap, width: spec.lineWidth || 2.2,
        color: spec.hatchColor || '#f6efe2',
        alpha: 0.5 * k,
      }, r);
      if (spec.cross) crossHatch(env, f, { angle: (spec.angle || 38) - 74, gap: gap * 1.6, width: 1.4, color: spec.hatchColor || '#f6efe2', alpha: 0.35 * k }, r);
    });

    // 刀口：粗黑轮廓一笔带过
    if (spec.outline !== false) {
      ctx.save();
      ctx.strokeStyle = rgba(inks[0], 0.9);
      ctx.lineWidth = spec.outlineWidth || 3;
      forms.forEach((f) => { formPath(ctx, f); ctx.globalAlpha = 0.55 * reveal; ctx.stroke(); });
      ctx.restore();
    }
    if (spec.grain != null) grainLayer(env, spec.grain, r);
  }

  // 2 网点：孔版 / 半调档案 / 丝印海报 / 印刷长镜 —— 网角 + 套色错位
  function famHalftone(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    const r = rng(spec.seed + ':press');
    paper(env, spec, r);
    const forms = shapesFromSpec(spec, r);
    const inks = spec.inks || ['#0f0f0f', '#e2483f', '#1f6ecb'];
    const k = ease(clamp(t / (spec.beat || 2.6)));

    forms.forEach((f, i) => {
      const local = ease(clamp((t - i * 0.2) / 1.0));
      if (local <= 0) return;
      const ink = inks[i % inks.length];
      // 底色块（偏移 3px 制造套印错位）
      ctx.save();
      formPath(ctx, f);
      ctx.translate(i % 2 ? 3 : -3, i % 3 ? 2 : -2);
      ctx.fillStyle = rgba(ink, 0.18 * local);
      ctx.fill();
      ctx.restore();
      halftone(env, f, {
        cell: f.cell || spec.cell || 13,
        angle: (i % 3) * 30 + (spec.angle || 45),
        color: ink, alpha: 0.85 * local,
      }, r);
    });

    // 叠一版黑，压住最深处
    if (spec.deep) {
      forms.slice(0, 2).forEach((f) => halftone(env, f, { cell: 9, angle: 15, color: inks[0], alpha: 0.5 * k }, r));
    }
    if (spec.grain != null) grainLayer(env, spec.grain, r);
  }

  // 3 霓虹：霓虹管 / 萤火 / 流场 / 暗纪录片 —— 黑底 + 加色描线
  function famNeon(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#07080d';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':neon');

    // 远底：一层很淡的星点/尘
    particles(env, { n: spec.dust || 300, color: '#ffffff', alpha: 0.22, size: 2.2 }, r);

    const paths = spec.paths || [];
    paths.forEach((p, i) => {
      const k = ease(clamp((t - i * 0.18) / 1.2));
      if (k <= 0) return;
      const pts = p.pts;
      const n = Math.max(2, Math.round(pts.length * k));
      const cut = pts.slice(0, n);
      additiveGlowStroke(env, cut, { color: p.color || '#4ff0e0', width: p.width || 5, alpha: 0.9, blur: p.blur || 18 }, r);
    });

    // 灯管亮芯：细白线压在描线中段
    paths.slice(0, 4).forEach((p, i) => {
      const k = ease(clamp((t - i * 0.18) / 1.4));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#ffffff', 0.55 * k);
      ctx.lineWidth = (p.width || 5) * 0.35;
      handPath(ctx, p.pts, 0.6, r);
      ctx.stroke();
      ctx.restore();
    });
    if (spec.scan) scanlines(env, { gap: spec.scan, alpha: 0.16 });
    vignette(env, 0.4, '#000000');
  }

  // 屏幕族的两种界面式画法：桌面窗口 / 表格
  function screenUI(env, spec, t, r, m, iw, ih) {
    const { ctx } = env;
    const fg = spec.fg || '#dbeeff';
    const acc = spec.accent || '#4fa8ff';
    const tb = ih * 0.11;
    // 标题栏 + 三个点
    ctx.fillStyle = rgba(fg, 0.10);
    ctx.fillRect(m, m, iw, tb);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = rgba([acc, '#ffd166', '#8ef0b6'][i], 0.75);
      ctx.beginPath();
      ctx.arc(m + tb * 0.55 + i * tb * 0.6, m + tb * 0.5, tb * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = rgba(fg, 0.55);
    ctx.fillRect(m + tb * 2.6, m + tb * 0.28, iw * 0.3, tb * 0.44);

    // 侧栏：一列文件行
    const sw = iw * 0.26;
    ctx.fillStyle = rgba(fg, 0.06);
    ctx.fillRect(m, m + tb, sw, ih - tb);
    for (let i = 0; i < 9; i++) {
      const k = ease(clamp((t - i * 0.08) / 0.6));
      const y = m + tb + ih * 0.045 + i * ih * 0.062;
      ctx.fillStyle = rgba(i === 2 ? acc : fg, (i === 2 ? 0.5 : 0.22) * k);
      ctx.fillRect(m + sw * 0.12, y, sw * (0.5 + 0.3 * r()) * k, ih * 0.020);
    }

    // 主区：内容行 + 进度条 + 光标
    const cx0 = m + sw, cw = iw - sw;
    for (let i = 0; i < 7; i++) {
      const k = ease(clamp((t - 0.4 - i * 0.12) / 0.7));
      if (k <= 0) continue;
      const y = m + tb + ih * 0.10 + i * ih * 0.088;
      ctx.fillStyle = rgba(fg, 0.30 * k);
      ctx.fillRect(cx0 + cw * 0.08, y, cw * (0.3 + 0.5 * r()) * k, ih * 0.016);
      if (r() > 0.5) {
        ctx.fillStyle = rgba(acc, 0.55 * k);
        ctx.fillRect(cx0 + cw * 0.72, y, cw * 0.14, ih * 0.016);
      }
    }
    // 进度条
    const pw = cw * 0.84, py = m + ih - ih * 0.14;
    ctx.fillStyle = rgba(fg, 0.12);
    ctx.fillRect(cx0 + cw * 0.08, py, pw, ih * 0.022);
    const prog = clamp(t / 4);
    ctx.fillStyle = rgba(acc, 0.85);
    ctx.fillRect(cx0 + cw * 0.08, py, pw * prog, ih * 0.022);
    // 光标闪烁
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = rgba(fg, 0.8);
      ctx.fillRect(cx0 + cw * 0.08, py + ih * 0.05, 3, ih * 0.030);
    }
    if (spec.record) {
      ctx.fillStyle = rgba('#ff4d4d', 0.35 + 0.35 * Math.abs(Math.sin(t * 2)));
      ctx.beginPath();
      ctx.arc(m + iw - tb * 0.6, m + tb * 0.5, tb * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function screenSheet(env, spec, t, r, m, iw, ih) {
    const { ctx } = env;
    const fg = spec.fg || '#e6ecf2';
    const acc = spec.accent || '#7ad2a0';
    const cols = 9, rows = 13;
    const gw = iw * 0.66, gh = ih * 0.86;
    const x0 = m + iw * 0.04, y0 = m + ih * 0.07;
    const cw = gw / cols, ch = gh / rows;
    ctx.strokeStyle = rgba(fg, 0.22);
    ctx.lineWidth = 1;
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath(); ctx.moveTo(x0 + c * cw, y0); ctx.lineTo(x0 + c * cw, y0 + gh); ctx.stroke();
    }
    for (let rr = 0; rr <= rows; rr++) {
      ctx.beginPath(); ctx.moveTo(x0, y0 + rr * ch); ctx.lineTo(x0 + gw, y0 + rr * ch); ctx.stroke();
    }
    // 表头
    ctx.fillStyle = rgba(acc, 0.22);
    ctx.fillRect(x0, y0, gw, ch);
    // 数据块
    for (let rr = 1; rr < rows; rr++) {
      for (let c = 0; c < cols; c++) {
        if (r() > 0.55) {
          const k = ease(clamp((t - (rr + c) * 0.03) / 0.6));
          ctx.fillStyle = rgba(r() > 0.7 ? acc : fg, (0.10 + 0.2 * r()) * k);
          ctx.fillRect(x0 + c * cw + 2, y0 + rr * ch + 2, cw - 4, ch - 4);
        }
      }
    }
    // 右侧小图表：柱状
    const cx = m + iw * 0.74, cbase = m + ih * 0.86;
    for (let i = 0; i < 6; i++) {
      const k = ease(clamp((t - 0.5 - i * 0.1) / 0.7));
      const bh = ih * (0.10 + 0.26 * r());
      ctx.fillStyle = rgba(i % 2 ? acc : fg, 0.6 * k);
      ctx.fillRect(cx + i * iw * 0.035, cbase - bh * k, iw * 0.022, bh * k);
    }
    ctx.strokeStyle = rgba(fg, 0.35);
    ctx.beginPath(); ctx.moveTo(cx - 6, cbase); ctx.lineTo(cx + iw * 0.23, cbase); ctx.stroke();
  }

  // 4 屏幕：ASCII-CRT / 默片 / 后室 / 划痕 / 双重曝光 / 录屏 —— 框 + 扫描 + 信号
  function famScreen(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#0a0d0a';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':screen');

    // 屏幕内区
    const m = Math.round(Math.min(W, H) * (spec.margin || 0.06));
    const iw = W - m * 2, ih = H - m * 2;
    ctx.fillStyle = spec.screen || '#0f1712';
    ctx.fillRect(m, m, iw, ih);

    // 内容：按 mode 分——字符阵 / 桌面窗口 / 表格
    if (spec.mode === 'ui') {
      screenUI(env, spec, t, r, m, iw, ih);
    } else if (spec.mode === 'sheet') {
      screenSheet(env, spec, t, r, m, iw, ih);
    } else {
      const cols = spec.cols || 64, rows = spec.rows || 30;
      const cw = iw / cols, ch = ih / rows;
      const chars = spec.chars || ' .:-=+*#%@';
      const t0 = t;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const u = x / cols, v = y / rows;
          const wave = Math.sin((u * 6.1 + v * 2.3) + t0 * (spec.speed || 1.1)) * 0.5 + 0.5;
          const val = (wave * 0.7 + Math.sin((u - v) * 4.2 + t0 * 0.7) * 0.3);
          const ch2 = chars[Math.min(chars.length - 1, Math.floor(clamp(val) * chars.length))];
          if (ch2 === ' ' || ch2 === '.') continue;
          ctx.fillStyle = rgba(spec.fg || '#7ef0a8', 0.55 + 0.35 * val);
          ctx.font = `${Math.round(ch * 0.92)}px "Cascadia Mono", "Consolas", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(ch2, m + x * cw + cw / 2, m + (y + 0.85) * ch);
        }
      }
      // 一条横移的亮带
      const bandY = m + ih * (0.5 + 0.35 * Math.sin(t * 0.6));
      const g = ctx.createLinearGradient(0, bandY - 60, 0, bandY + 60);
      g.addColorStop(0, rgba(spec.fg || '#7ef0a8', 0));
      g.addColorStop(0.5, rgba(spec.fg || '#7ef0a8', 0.18));
      g.addColorStop(1, rgba(spec.fg || '#7ef0a8', 0));
      ctx.fillStyle = g;
      ctx.fillRect(m, bandY - 60, iw, 120);
    }

    scanlines(env, { gap: spec.scanGap || 4, alpha: spec.scanAlpha || 0.3, color: '#000', chroma: spec.chroma !== false });
    if (spec.scratch) {
      const n = 3 + (Math.floor(t * 12) % 3);
      for (let i = 0; i < n; i++) {
        ctx.strokeStyle = rgba('#ffffff', range(r, 0.15, 0.5));
        ctx.lineWidth = range(r, 0.6, 1.8);
        ctx.beginPath();
        const x = m + r() * iw;
        ctx.moveTo(x, m);
        ctx.lineTo(x + range(r, -12, 12), m + ih);
        ctx.stroke();
      }
    }
    vignette(env, 0.55, '#000000');
    // 屏幕边框
    ctx.strokeStyle = rgba('#000000', 0.7);
    ctx.lineWidth = 6;
    ctx.strokeRect(m - 3, m - 3, iw + 6, ih + 6);
  }

  // 5 像素：HD-2D / 微游 / 像素 RPG —— 大块像素 + 有限色板
  function famPixel(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#101426';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':pixel');
    const px = spec.px || 12;

    // 远景层：几条山/城市剪影
    const layers = spec.layers || [];
    layers.forEach((L, li) => {
      const off = Math.round((t * (L.speed || 8)) % (W + 200)) - 100;
      ctx.fillStyle = L.color || '#1b2440';
      for (let x = -100; x < W + 100; x += px * 2) {
        const hgt = Math.round(L.base + Math.sin((x + off) / (L.wave || 180)) * L.amp);
        ctx.fillRect(x, H - hgt, px * 2, hgt);
      }
    });

    // 主角：像素小人（头/身/腿/臂按 px 块拼），落地跟着节拍弹
    const bob = Math.round(Math.sin(t * 3.2) * 2) * px;
    const heroC = spec.hero || '#f2c14e';
    const hx = Math.round(W * (spec.heroX == null ? 0.5 : spec.heroX));
    const hy = Math.round(H * 0.72) + bob;
    const sprite = [
      '....1111....',
      '...111111...',
      '...111111...',
      '....2222....',
      '..22222222..',
      '.2222222222.',
      '.2222222222.',
      '..22222222..',
      '...3..3.....',
      '...3..3.....',
      '...33.33....',
    ];
    const cols = sprite[0].length;
    for (let row = 0; row < sprite.length; row++) {
      for (let col = 0; col < cols; col++) {
        const ch = sprite[row][col];
        if (ch === '.') continue;
        ctx.fillStyle = ch === '3' ? shade(heroC, -0.45) : ch === '2' ? heroC : shade(heroC, 0.18);
        ctx.fillRect(hx - (cols * px) / 2 + col * px, hy - sprite.length * px + row * px, px, px);
      }
    }

    // 地面格
    ctx.fillStyle = rgba(spec.ground || '#2a3a5e', 0.9);
    for (let y = H * 0.74; y < H; y += px) {
      for (let x = 0; x < W; x += px) {
        if (((x / px) + (y / px)) % 2 === 0) ctx.fillRect(x, y, px, px);
      }
    }
    // 限定调色板抖动：整帧压 12 色
    if (spec.paletteLimit !== false) posterize(env, spec.levels || 12);
    scanlines(env, { gap: 3, alpha: 0.12 });
  }

  // 6 立体：积木 / 纸艺 / 移轴 / 玻璃产品 —— 等轴测体块 + 投影
  function famIso(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#eae5da';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':iso');
    const boxes = spec.boxes || [];

    // 自动取景：按体块的包围盒算投影尺寸，让主体占到画幅的八成左右
    const bound = { x0: -3, x1: 3, y0: -3, y1: 3, z1: 3 };
    if (boxes.length) {
      bound.x0 = Math.min(...boxes.map((b) => b.x));
      bound.x1 = Math.max(...boxes.map((b) => b.x + b.w));
      bound.y0 = Math.min(...boxes.map((b) => b.y));
      bound.y1 = Math.max(...boxes.map((b) => b.y + b.d));
      bound.z1 = Math.max(...boxes.map((b) => Math.max(b.h, 0.4)));
    }
    const pad = spec.fitPad == null ? 0.10 : spec.fitPad;
    const wUnits = ((bound.x1 - bound.y0) - (bound.x0 - bound.y1)) * (Math.sqrt(3) / 2);
    const hUnits = ((bound.x1 + bound.y1) - (bound.x0 + bound.y0)) * 0.5 + bound.z1;
    const scale = Math.min((W * (1 - pad * 2)) / Math.max(1e-6, wUnits), (H * (1 - pad * 2)) / Math.max(1e-6, hUnits));
    const probe = iso(0, 0, scale);
    const corners = [[bound.x0, bound.y0, 0], [bound.x1, bound.y1, 0], [bound.x0, bound.y0, bound.z1], [bound.x1, bound.y1, bound.z1]];
    let px0 = 1e9, px1 = -1e9, py0 = 1e9, py1 = -1e9;
    corners.forEach(([x, y, z]) => {
      const p = probe.p(x, y, z);
      px0 = Math.min(px0, p[0]); px1 = Math.max(px1, p[0]);
      py0 = Math.min(py0, p[1]); py1 = Math.max(py1, p[1]);
    });
    const S = iso(W * (spec.cx || 0.5) - (px0 + px1) / 2, H * (spec.cy || 0.58) - (py0 + py1) / 2, scale);

    // 台面：比包围盒再放宽一圈，压一层淡色 + 网格线，撑住构图
    const padX = 1.2, padY = 1.2;
    const bgShade = shade(spec.bg || '#eae5da', -0.10);
    ctx.fillStyle = rgba(bgShade, 0.72);
    poly(ctx, [S.p(bound.x0 - padX, bound.y0 - padY, 0), S.p(bound.x1 + padX, bound.y0 - padY, 0),
      S.p(bound.x1 + padX, bound.y1 + padY, 0), S.p(bound.x0 - padX, bound.y1 + padY, 0)]);
    ctx.save();
    ctx.strokeStyle = rgba('#ffffff', 0.18);
    ctx.lineWidth = 1;
    for (let gx = Math.floor(bound.x0 - padX); gx <= bound.x1 + padX; gx += 2) {
      ctx.beginPath();
      const a = S.p(gx, bound.y0 - padY, 0), b = S.p(gx, bound.y1 + padY, 0);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    for (let gy = Math.floor(bound.y0 - padY); gy <= bound.y1 + padY; gy += 2) {
      ctx.beginPath();
      const a = S.p(bound.x0 - padX, gy, 0), b = S.p(bound.x1 + padX, gy, 0);
      ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.restore();

    boxes.forEach((b, i) => {
      const k = ease(clamp((t - i * 0.12) / 0.9));
      if (k <= 0) return;
      const lift = (1 - k) * 3;
      const base = b.color || '#cfd6e0';
      const hh = b.h * k;
      S.box(ctx, b.x, b.y, lift, b.w, b.d, hh, {
        top: shade(base, 0.28), left: shade(base, -0.1), right: shade(base, -0.28),
      });
      // 落地影
      ctx.fillStyle = rgba('#000000', 0.14 * k);
      poly(ctx, [S.p(b.x, b.y, 0), S.p(b.x + b.w, b.y, 0), S.p(b.x + b.w, b.y + b.d, 0), S.p(b.x, b.y + b.d, 0)]);
    });

    if (spec.blurTop) {
      // 移轴：上下两条虚化带，用半透明底压
      const g1 = ctx.createLinearGradient(0, 0, 0, H * 0.28);
      g1.addColorStop(0, rgba(spec.bg || '#eae5da', 0.85));
      g1.addColorStop(1, rgba(spec.bg || '#eae5da', 0));
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H * 0.28);
      const g2 = ctx.createLinearGradient(0, H, 0, H * 0.72);
      g2.addColorStop(0, rgba(spec.bg || '#eae5da', 0.85));
      g2.addColorStop(1, rgba(spec.bg || '#eae5da', 0));
      ctx.fillStyle = g2;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);
    }
  }

  // 7 图纸：拆解 / 机械 / 说明书 / 绘图笔 / 流水线 / 显微 / 简报 / 安检 —— 线稿 + 标注
  function famPlan(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#0e2233';
    ctx.fillRect(0, 0, W, H);
    if (spec.paperMode) {
      paper(env, { bg: spec.bg, tooth: 0.25 }, rng(spec.seed));
    }
    grid(env, { gap: spec.gridGap || 90, minor: 22, color: spec.grid || '#8fb6d8', alpha: spec.gridAlpha == null ? 0.3 : spec.gridAlpha });

    const ink = spec.ink || '#cfe6ff';
    const accent = spec.accent || '#ffb86b';
    const r = rng(spec.seed + ':plan');
    const draw = ease(clamp(t / (spec.beat || 2.4)));

    (spec.parts || []).forEach((p, i) => {
      const k = ease(clamp((t - i * 0.18) / 0.9));
      if (k <= 0) return;
      ctx.save();
      ctx.strokeStyle = rgba(p.color || ink, 0.9);
      ctx.fillStyle = rgba(p.fill || ink, 0.1);
      ctx.lineWidth = p.lw || 2;
      // 以"画线进度"呈现：路径只画到 k
      const w = p.w * (p.grow === false ? 1 : k), h = p.h * (p.grow === false ? 1 : k);
      if (p.kind === 'rect') {
        ctx.strokeRect(p.x, p.y, w, h);
      } else if (p.kind === 'circle') {
        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        if (p.fill) ctx.fill();
      } else if (p.kind === 'gear') {
        const cx = p.x, cy = p.y, rr = p.r * k;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
          const rad = rr + (Math.round(a * 8 / Math.PI) % 2 ? rr * 0.08 : 0);
          ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.stroke();
      } else if (p.kind === 'trace') {
        const pts = p.pts;
        ctx.beginPath();
        pts.forEach(([x, y], j) => {
          const kk = clamp(k * (pts.length - 1) - j);
          if (kk <= 0) return;
          const nx = j ? lerp(pts[j - 1][0], x, kk) : x, ny = j ? lerp(pts[j - 1][1], y, kk) : y;
          if (j && kk < 1) ctx.lineTo(nx, ny);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (p.kind === 'label') {
        ctx.fillStyle = rgba(p.color || accent, 0.9 * k);
        ctx.font = `600 ${p.size || 20}px "AlibabaPuHuiTi"`;
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.kind === 'dim') {
        dimension(ctx, p.x, p.y, p.x + k * p.w, p.y + k * p.h, p.text, { color: p.color || ink, size: p.size || 18 });
      }
      ctx.restore();
    });

    // 边角：图号 / 比例尺
    if (spec.sheet) {
      ctx.strokeStyle = rgba(ink, 0.4);
      ctx.lineWidth = 1.2;
      const m = 40;
      ctx.strokeRect(m, m, W - m * 2, H - m * 2);
      ctx.fillStyle = rgba(ink, 0.65);
      ctx.font = '20px "Cascadia Mono", monospace';
      ctx.fillText(spec.sheet, m + 18, H - m - 18);
    }
    if (spec.scan) scanlines(env, { gap: 3, alpha: 0.1 });
  }

  // 8 地图：卫星 / 测绘 / 热成像 / 数据 / 白模 / 实体 / 地铁 / 模拟 —— 场 + 等值线 + 点
  function famMap(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#08131f';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':map');

    // 场：几团径向斑
    (spec.blobs || []).forEach((b, i) => {
      const k = ease(clamp((t - i * 0.2) / 1.4));
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, rgba(b.color || '#31c8b6', 0.8 * k));
      g.addColorStop(0.6, rgba(b.color || '#31c8b6', 0.28 * k));
      g.addColorStop(1, rgba(b.color || '#31c8b6', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 等值线：围绕 blob 画几圈
    if (spec.contours) {
      const c = spec.contours;
      for (let i = 0; i < c.rings; i++) {
        ctx.strokeStyle = rgba(c.color || '#8af0e0', 0.5 - i * 0.06);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const rr = c.r0 + i * (c.step || 42);
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.12) {
          const wob = 1 + Math.sin(a * (c.wave || 3) + i) * 0.06;
          ctx.lineTo(c.x + Math.cos(a) * rr * wob, c.y + Math.sin(a) * rr * wob * 0.82);
        }
        ctx.stroke();
      }
    }

    // 经纬网
    if (spec.graticule) {
      ctx.save();
      ctx.strokeStyle = rgba('#ffffff', 0.12);
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += W / 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += H / 8) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();
    }

    // 点云 / 站点 / 数据点
    if (spec.points) {
      const pn = spec.points;
      for (let i = 0; i < (pn.n || 400); i++) {
        const x = range(r, 0, W), y = range(r, 0, H);
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.2 + i));
        ctx.fillStyle = rgba(pn.color || '#7ef0ff', a * 0.6);
        ctx.fillRect(x, y, pn.size || 2, pn.size || 2);
      }
    }
    // 线路
    (spec.routes || []).forEach((rt, i) => {
      const k = ease(clamp((t - i * 0.15) / 1.3));
      ctx.strokeStyle = rgba(rt.color || '#ff8a5c', 0.9);
      ctx.lineWidth = rt.width || 4;
      ctx.beginPath();
      rt.pts.forEach(([x, y], j) => {
        const kk = clamp(k * (rt.pts.length - 1) - j);
        if (!j) ctx.moveTo(x, y);
        else if (kk > 0) ctx.lineTo(lerp(rt.pts[j - 1][0], x, kk), lerp(rt.pts[j - 1][1], y, kk));
      });
      ctx.stroke();
      rt.pts.forEach(([x, y]) => {
        ctx.fillStyle = rgba('#ffffff', 0.8);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      });
    });
    if (spec.vignette != null) vignette(env, spec.vignette, '#000');
  }

  // 摄影族的主体：按 subject 画不同景物，统一近黑剪影 + 极淡边缘受光
  function photoSubject(ctx, spec, box, t, r) {
    const { m, iw, ih, hz } = box;
    const sy = hz + ih * 0.02;
    const base = m + iw * (spec.subjectX == null ? 0.6 : spec.subjectX);
    const scale = Math.min(iw, ih);
    const alpha = spec.subjectAlpha == null ? 0.88 : spec.subjectAlpha;
    const kind = spec.subject || 'figure';

    ctx.save();
    ctx.fillStyle = rgba('#000000', alpha);
    ctx.strokeStyle = rgba('#000000', alpha);

    if (kind === 'city') {
      // 天际线：一排高低错落的楼，个别带天线与亮窗
      let x = m - iw * 0.02;
      for (let i = 0; i < 30 && x < m + iw * 1.02; i++) {
        const w = iw * (0.028 + 0.055 * r());
        const h = ih * (0.09 + 0.28 * r());
        ctx.fillRect(x, hz - h, w, h + (ih - hz + m));
        if (r() > 0.62) ctx.fillRect(x + w * 0.46, hz - h - scale * 0.065, w * 0.07, scale * 0.065);
        for (let k = 0; k < 7; k++) {
          if (r() > 0.55) {
            ctx.save();
            ctx.globalAlpha = 0.16 + 0.16 * r();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + w * (0.16 + 0.7 * r()), hz - h + h * r() * 0.75, w * 0.11, h * 0.028);
            ctx.restore();
          }
        }
        x += w + iw * 0.005;
      }
    } else if (kind === 'figure') {
      const s = scale * (spec.subjectS == null ? 0.15 : spec.subjectS);
      ctx.fillStyle = rgba('#000000', 0.16);
      ctx.beginPath();
      ctx.ellipse(base + s * 0.25, sy, s * 1.2, s * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba('#000000', alpha);
      ctx.fillRect(base - s * 0.32, sy - s * 1.06, s * 0.24, s * 1.06);
      ctx.fillRect(base + s * 0.08, sy - s * 1.06, s * 0.24, s * 1.06);
      ctx.beginPath();
      ctx.moveTo(base - s * 0.56, sy - s * 2.15);
      ctx.quadraticCurveTo(base - s * 0.72, sy - s * 1.05, base - s * 0.42, sy - s * 0.98);
      ctx.lineTo(base + s * 0.42, sy - s * 0.98);
      ctx.quadraticCurveTo(base + s * 0.72, sy - s * 1.05, base + s * 0.52, sy - s * 2.15);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(base, sy - s * 2.52, s * 0.33, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = rgba('#ffffff', 0.3);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(base - s * 0.04, sy - s * 2.52, s * 0.33, Math.PI * 0.72, Math.PI * 1.5);
      ctx.stroke();
    } else if (kind === 'tree') {
      const s = scale * 0.2;
      ctx.beginPath();
      ctx.moveTo(base - s * 0.09, sy);
      ctx.lineTo(base + s * 0.09, sy);
      ctx.lineTo(base + s * 0.055, sy - s * 1.55);
      ctx.lineTo(base - s * 0.055, sy - s * 1.55);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = s * 0.055;
      ctx.lineCap = 'round';
      [[-0.72, 1.75, 0], [0.7, 1.85, 1], [-0.3, 2.15, 0], [0.36, 2.3, 1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(base + s * dx * 0.14, sy - s * 1.45);
        ctx.quadraticCurveTo(base + s * dx * 0.55, sy - s * (dy - 0.2), base + s * dx, sy - s * dy);
        ctx.stroke();
      });
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = rgba('#000000', 0.55 + 0.4 * r());
        ctx.beginPath();
        ctx.ellipse(base + s * (-0.85 + 1.6 * r()), sy - s * (1.75 + 0.85 * r()), s * (0.4 + 0.2 * r()), s * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'room') {
      // 室内：窗、桌、灯，一条室内地平线
      const s = scale * 0.34;
      ctx.lineWidth = 3;
      ctx.strokeRect(base - iw * 0.22, m + ih * 0.12, iw * 0.44, ih * 0.36);
      ctx.beginPath();
      ctx.moveTo(base, m + ih * 0.12);
      ctx.lineTo(base, m + ih * 0.48);
      ctx.moveTo(base - iw * 0.22, m + ih * 0.30);
      ctx.lineTo(base + iw * 0.22, m + ih * 0.30);
      ctx.stroke();
      ctx.fillStyle = rgba('#000000', 0.85);
      ctx.fillRect(base - iw * 0.3, sy - s * 0.55, iw * 0.6, s * 0.12);
      ctx.fillRect(base - iw * 0.16, sy - s * 0.45, s * 0.08, s * 0.45);
      ctx.fillRect(base + iw * 0.14, sy - s * 0.45, s * 0.08, s * 0.45);
      // 灯：杆 + 罩
      ctx.fillRect(base - iw * 0.02, sy - s * 1.5, s * 0.05, s * 1.5);
      ctx.beginPath();
      ctx.moveTo(base - s * 0.55, sy - s * 1.42);
      ctx.lineTo(base + s * 0.6, sy - s * 1.42);
      ctx.lineTo(base + s * 0.34, sy - s * 1.78);
      ctx.lineTo(base - s * 0.28, sy - s * 1.78);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(base - s * 0.5, sy - s * 1.4);
      ctx.lineTo(base + s * 0.55, sy - s * 1.4);
      ctx.lineTo(base + s * 1.0, sy);
      ctx.lineTo(base - s * 0.95, sy);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'machine') {
      const s = scale * 0.16;
      // 大轮 + 小轮 + 连杆，机械的剪影
      ctx.lineWidth = s * 0.14;
      ctx.strokeStyle = rgba('#000000', alpha);
      ctx.beginPath();
      ctx.arc(base - s * 0.6, sy - s * 1.1, s * 1.02, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(base + s * 0.95, sy - s * 0.72, s * 0.56, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(base - s * 0.6, sy - s * 1.1);
      ctx.lineTo(base + s * 0.95, sy - s * 0.72);
      ctx.stroke();
      // 齿
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        ctx.fillStyle = rgba('#000000', alpha);
        ctx.fillRect(base - s * 0.6 + Math.cos(a) * s * 1.06 - s * 0.05, sy - s * 1.1 + Math.sin(a) * s * 1.06 - s * 0.05, s * 0.14, s * 0.14);
      }
      ctx.fillRect(base - s * 1.9, sy - s * 0.2, s * 3.4, s * 0.2);
    } else if (kind === 'ring') {
      // 环形结构：雷达盘 / 摩天轮
      const s = scale * 0.2;
      ctx.lineWidth = s * 0.07;
      ctx.strokeStyle = rgba('#000000', alpha);
      ctx.beginPath();
      ctx.arc(base, sy - s * 2.0, s * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(base, sy - s * 2.0);
        ctx.lineTo(base + Math.cos(a) * s * 1.35, sy - s * 2.0 + Math.sin(a) * s * 1.35);
        ctx.stroke();
        ctx.fillStyle = rgba('#000000', alpha);
        ctx.beginPath();
        ctx.arc(base + Math.cos(a) * s * 1.35, sy - s * 2.0 + Math.sin(a) * s * 1.35, s * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = rgba('#000000', alpha);
      ctx.beginPath();
      ctx.moveTo(base - s * 0.5, sy);
      ctx.lineTo(base + s * 0.5, sy);
      ctx.lineTo(base + s * 0.16, sy - s * 2.0);
      ctx.lineTo(base - s * 0.16, sy - s * 2.0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 9 摄影：新闻片 / 城市交响 / 档案灯箱 / 双重曝光 —— 灰阶 + 颗粒 + 齿孔
  function famPhoto(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#0c0c0c';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':photo');

    // 画面区
    const m = spec.frame === false ? 0 : Math.round(Math.min(W, H) * 0.055);
    const iw = W - m * 2, ih = H - m * 2;

    // 灰阶构图：几层斜向的亮块 + 一个人形剪影
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.5);
    const g = ctx.createLinearGradient(m, m, m + iw, m + ih);
    g.addColorStop(0, rgba(spec.tone1 || '#2a2a2a', 1));
    g.addColorStop(0.55, rgba(spec.tone2 || '#7a7a7a', 1));
    g.addColorStop(1, rgba(spec.tone3 || '#141414', 1));
    ctx.fillStyle = g;
    ctx.fillRect(m, m, iw, ih);

    // 光斑
    for (let i = 0; i < 3; i++) {
      const cx = m + iw * (0.2 + 0.3 * i) + Math.sin(t * 0.4 + i) * 40;
      const cy = m + ih * (0.35 + 0.12 * i);
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, iw * 0.2);
      rg.addColorStop(0, rgba('#ffffff', 0.22 + 0.1 * pulse));
      rg.addColorStop(1, rgba('#ffffff', 0));
      ctx.fillStyle = rg;
      ctx.fillRect(m, m, iw, ih);
    }

    // 地平线与压深的景层：先铺纵深，再放主体
    const hz = m + ih * (spec.horizon == null ? 0.66 : spec.horizon);
    const fog = ctx.createLinearGradient(0, hz - ih * 0.1, 0, hz + ih * 0.25);
    fog.addColorStop(0, rgba(spec.tone3 || '#141414', 0.15));
    fog.addColorStop(1, rgba(spec.tone3 || '#141414', 0.62));
    ctx.fillStyle = fog;
    ctx.fillRect(m, hz - ih * 0.1, iw, ih - (hz - ih * 0.1) - m);

    // 主体剪影
    if (spec.subject && spec.subject !== 'none') photoSubject(ctx, spec, { m, iw, ih, hz }, t, r);

    // 胶片齿孔
    if (spec.sprocket) {
      ctx.fillStyle = rgba('#000000', 0.9);
      const pw = iw / 22;
      for (let i = 0; i < 22; i++) {
        const x = m + i * pw + pw * 0.2;
        ctx.fillRect(x, m - m * 0.55, pw * 0.6, m * 0.36);
        ctx.fillRect(x, m + ih + m * 0.2, pw * 0.6, m * 0.36);
      }
    }
    grainLayer(env, spec.grain == null ? 0.55 : spec.grain, r);
    // 灰尘与划痕
    if (spec.dust !== false) {
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = rgba('#ffffff', range(r, 0.06, 0.3));
        ctx.fillRect(range(r, m, m + iw), range(r, m, m + ih), range(r, 0.8, 2.4), range(r, 0.8, 2.4));
      }
    }
    vignette(env, 0.4, '#000000');
    if (spec.flare) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const fy = m + ih * 0.18;
      const fg = ctx.createLinearGradient(0, fy, 0, fy + ih * 0.2);
      fg.addColorStop(0, rgba('#ffd2a0', 0));
      fg.addColorStop(0.5, rgba('#ffd2a0', 0.16));
      fg.addColorStop(1, rgba('#ffd2a0', 0));
      ctx.fillStyle = fg;
      ctx.fillRect(m, fy, iw, ih * 0.2);
      ctx.restore();
    }
  }

  // 10 纸艺：剪纸 / 彩玻 / 金箔抄本 / 纸灯 —— 分层镂空 + 背光
  function famPaper(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.backlight || '#ffedc4';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':paper');
    // 背光渐变，让"纸"有厚度
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, Math.max(W, H) * 0.7);
    g.addColorStop(0, rgba(spec.glow || '#fff6dc', 0.9));
    g.addColorStop(1, rgba(spec.backlight || '#ffedc4', 0.2));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const layerInk = spec.ink || '#a8272a';
    (spec.forms || []).forEach((f, i) => {
      const k = ease(clamp((t - i * 0.14) / 1.0));
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = f.color || layerInk;
      formPath(ctx, f);
      ctx.fill();
      // 镂空：形状内再挖几个小白孔
      if (f.holes) {
        ctx.fillStyle = rgba(spec.backlight || '#ffedc4', 0.92);
        const rr = rng(spec.seed + ':holes' + i);
        for (let h = 0; h < f.holes; h++) {
          const hx = f.x + range(rr, f.w * 0.15, f.w * 0.85);
          const hy = f.y + range(rr, f.h * 0.15, f.h * 0.85);
          ctx.beginPath();
          ctx.arc(hx, hy, range(rr, 4, Math.min(f.w, f.h) * 0.08), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // 彩玻：金线
      if (spec.leading) {
        ctx.strokeStyle = rgba(spec.leading, 0.85);
        ctx.lineWidth = 5;
        formPath(ctx, f);
        ctx.stroke();
      }
      ctx.restore();
    });
    if (spec.gold) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      particles(env, { n: 120, color: '#ffd98a', alpha: 0.5, size: 3 }, r);
      ctx.restore();
    }
  }

  // 11 板书写字：白板 / 黑板 / 速记 / 马克笔 / 一笔画 / 厚涂 —— 逐笔画出来
  function famBoard(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.board || '#fbfbf7';
    ctx.fillRect(0, 0, W, H);
    // 板面纹理
    const r = rng(spec.seed + ':board');
    if (spec.gridBoard) {
      ctx.strokeStyle = rgba(spec.gridColor || '#cfe3f5', 0.5);
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 46) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 46) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    } else {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = rgba('#ffffff', range(r, 0.2, 0.5));
        ctx.fillRect(r() * W, r() * H, range(r, 8, 40), 1);
      }
    }

    // 色块：厚涂底色 / 马克笔块面，先铺再压线
    (spec.washes || []).forEach((w, i) => {
      const k = ease(clamp((t - (w.t0 || 0.1 + i * 0.2)) / 0.9));
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = (w.alpha == null ? 0.5 : w.alpha) * k;
      ctx.fillStyle = w.color || spec.accent || '#b4552f';
      ctx.beginPath();
      const pts = w.pts && w.pts.length ? w.pts : [[w.x, w.y], [w.x + w.w, w.y], [w.x + w.w, w.y + (w.h || 0)], [w.x, w.y + (w.h || 0)]];
      pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    const strokes = spec.strokes || [];
    const ink = spec.ink || '#1d1d1d';
    strokes.forEach((s, i) => {
      const k = ease(clamp((t - (s.t0 || i * 0.28)) / (s.dur || 0.7)));
      if (k <= 0) return;
      ctx.save();
      ctx.strokeStyle = rgba(s.color || ink, s.alpha == null ? 0.95 : s.alpha);
      ctx.lineWidth = s.w || 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = s.pts;
      const n = Math.max(1, Math.floor((pts.length - 1) * k));
      const cut = pts.slice(0, n + 1);
      if (k < 1 && pts[n] && pts[n + 1]) {
        const kk = (pts.length - 1) * k - n;
        cut.push([lerp(pts[n][0], pts[n + 1][0], kk), lerp(pts[n][1], pts[n + 1][1], kk)]);
      }
      handPath(ctx, cut, s.jitter == null ? 1.5 : s.jitter, r);
      ctx.stroke();
      ctx.restore();
    });

    // 高亮：马克笔压在关键笔画上
    (spec.highlights || []).forEach((h, i) => {
      const k = ease(clamp((t - (h.t0 || 1 + i * 0.3)) / 0.6));
      if (k <= 0) return;
      ctx.save();
      ctx.globalAlpha = 0.55 * k;
      ctx.fillStyle = h.color || '#ffd84d';
      ctx.fillRect(h.x, h.y, h.w * k, h.h);
      ctx.restore();
    });
    // 橡皮屑 / 粉笔灰
    if (spec.chalk) {
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = rgba('#ffffff', range(r, 0.05, 0.2));
        ctx.fillRect(range(r, 0, W), range(r, H * 0.55, H), range(r, 1, 4), range(r, 1, 3));
      }
    }
  }

  // 12 平面：瑞士 / 包豪斯 / 波普 / 拼贴 / 谍报片头 / 象形 / 字闪 —— 大色块 + 大字
  function famFlat(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = spec.bg || '#f3efe6';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':flat');

    // 背景几何
    (spec.bgForms || []).forEach((f, i) => {
      const k = ease(clamp((t - i * 0.1) / 0.9));
      ctx.save();
      ctx.globalAlpha = k * (f.alpha == null ? 1 : f.alpha);
      ctx.fillStyle = f.color || spec.accent || '#e2372c';
      formPath(ctx, f);
      ctx.fill();
      ctx.restore();
    });

    // 文字：主角
    const lines = spec.lines || [];
    lines.forEach((L, i) => {
      const k = ease(clamp((t - (L.t0 || 0.25 + i * 0.45)) / 0.6));
      if (k <= 0) return;
      ctx.save();
      const dy = (1 - k) * (L.slide == null ? 26 : L.slide);
      ctx.translate(0, dy);
      ctx.globalAlpha = k;
      type(env, L.text, {
        x: L.x == null ? W * 0.08 : L.x, y: (L.y == null ? H * 0.4 : L.y) + i * 0,
        size: L.size || Math.round(Math.min(W, H) * 0.12),
        color: L.color || spec.ink || '#12100e',
        font: L.font || '"AlibabaPuHuiTi", "Microsoft YaHei", sans-serif',
        weight: L.weight || 800, letter: L.letter || 0, max: L.max,
        align: L.align, baseline: L.baseline,
      });
      ctx.restore();
    });

    // 装饰：圆点阵 / 斜条纹 / 网格
    if (spec.dots) {
      ctx.fillStyle = rgba(spec.accent || '#e2372c', 0.9);
      for (let y = 0; y < H; y += 26) for (let x = 0; x < W; x += 26) {
        if (r() > 0.86) { ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.3); ctx.fill(); }
      }
    }
    if (spec.bars) {
      spec.bars.forEach((b, i) => {
        const k = ease(clamp((t - 0.4 - i * 0.12) / 0.5));
        ctx.fillStyle = rgba(b.color || spec.accent || '#e2372c', 0.9);
        ctx.fillRect(b.x, b.y, b.w * k, b.h);
      });
    }
  }

  // 赛璐珞族的主体：人物 / 机器人 / 载具 / 彗星，平涂 + 粗描边
  // 赛璐珞族的地形：与远山同一套公式，保证主体能"站在坡上"而不是飘在天上
  function celHillY(x, W, H, yy, amp, i) {
    return H * yy - Math.sin((x / W) * Math.PI * (1.5 + i * 0.9) + i * 1.3) * H * amp
      - Math.cos((x / W) * Math.PI * 3.2) * H * amp * 0.3;
  }

  function celSubject(env, spec, t, r, hz) {
    const { ctx, W, H } = env;
    const hero = spec.hero || '#f4d35e';
    const line = spec.line || '#101010';
    const ox = W * (spec.heroX == null ? 0.5 : spec.heroX);
    const oy = H * clamp(spec.heroY == null ? 0.84 : spec.heroY, 0.76, 0.94);
    const s = Math.min(W, H) * (spec.heroS == null ? 0.16 : spec.heroS);
    const kind = spec.heroKind || 'figure';
    const bob = Math.sin(t * 1.8) * s * 0.04;

    ctx.save();
    ctx.translate(ox, oy + bob);
    ctx.lineWidth = 7;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = line;

    if (kind === 'robot') {
      // 方脑袋 + 圆身 + 一节天线
      ctx.fillStyle = shade(hero, -0.2);
      ctx.fillRect(-s * 0.62, -s * 0.95, s * 1.24, s * 1.05);
      ctx.strokeRect(-s * 0.62, -s * 0.95, s * 1.24, s * 1.05);
      ctx.fillStyle = hero;
      ctx.fillRect(-s * 0.52, -s * 2.0, s * 1.04, s * 0.92);
      ctx.strokeRect(-s * 0.52, -s * 2.0, s * 1.04, s * 0.92);
      ctx.fillStyle = line;
      ctx.fillRect(-s * 0.34, -s * 1.72, s * 0.22, s * 0.2);
      ctx.fillRect(s * 0.12, -s * 1.72, s * 0.22, s * 0.2);
      ctx.beginPath();
      ctx.moveTo(0, -s * 2.0);
      ctx.lineTo(0, -s * 2.42);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -s * 2.48, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = spec.accent || '#ffd166';
      ctx.fill();
    } else if (kind === 'cart') {
      // 一台小载具：底盘 + 舱 + 两个轮
      ctx.fillStyle = hero;
      ctx.beginPath();
      ctx.moveTo(-s * 1.5, -s * 0.25);
      ctx.lineTo(-s * 1.1, -s * 0.95);
      ctx.lineTo(s * 0.35, -s * 1.05);
      ctx.quadraticCurveTo(s * 0.95, -s * 0.95, s * 1.1, -s * 0.35);
      ctx.lineTo(s * 1.35, -s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = shade(hero, 0.28);
      ctx.beginPath();
      ctx.moveTo(-s * 1.0, -s * 0.82);
      ctx.lineTo(s * 0.3, -s * 0.9);
      ctx.lineTo(s * 0.42, -s * 0.55);
      ctx.lineTo(-s * 1.02, -s * 0.5);
      ctx.closePath();
      ctx.fill();
      [-s * 0.85, s * 0.75].forEach((wx) => {
        ctx.fillStyle = line;
        ctx.beginPath();
        ctx.arc(wx, s * 0.12, s * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = shade(hero, 0.35);
        ctx.beginPath();
        ctx.arc(wx, s * 0.12, s * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (kind === 'comet') {
      // 拖尾的彗星：尾巴 + 核
      ctx.save();
      ctx.fillStyle = rgba(spec.accent || '#f2603c', 0.55);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.2);
      for (let i = 0; i <= 10; i++) {
        const k = i / 10;
        ctx.lineTo(-s * (1.2 + 3.2 * k) + Math.sin(i * 1.7) * s * 0.06, -s * 0.2 - s * (0.1 + 1.6 * k) * Math.sin(k * Math.PI));
      }
      ctx.lineTo(0, s * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = hero;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // 人物：披风剪影，头比肩窄
      ctx.fillStyle = shade(hero, -0.15);
      ctx.beginPath();
      ctx.moveTo(-s * 0.78, s * 0.95);
      ctx.quadraticCurveTo(-s * 0.95, -s * 0.05, -s * 0.26, -s * 0.34);
      ctx.quadraticCurveTo(0, -s * 0.48, s * 0.26, -s * 0.34);
      ctx.quadraticCurveTo(s * 0.95, -s * 0.05, s * 0.78, s * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = hero;
      ctx.beginPath();
      ctx.arc(0, -s * 0.92, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = line;
      ctx.beginPath();
      ctx.arc(-s * 0.14, -s * 0.98, s * 0.055, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * 0.14, -s * 0.98, s * 0.055, 0, Math.PI * 2);
      ctx.fill();
      // 围巾飘带
      ctx.fillStyle = rgba(spec.accent || '#f2603c', 0.9);
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.6);
      ctx.quadraticCurveTo(-s * (0.9 + 0.15 * Math.sin(t * 2)), -s * 0.4, -s * (1.3 + 0.2 * Math.sin(t * 2.4)), -s * 0.8);
      ctx.lineTo(-s * 1.05, -s * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 13 赛璐珞：八十年代动画 / 科幻卡通 / 五十年代卡通 / 漫画历史 / 综艺 —— 平涂 + 描边 + 速度线
  function famCel(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, spec.sky1 || '#1d2a5c');
    sky.addColorStop(1, spec.sky2 || '#f26d3d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':cel');

    // 速度线
    if (spec.speed) {
      for (let i = 0; i < 26; i++) {
        ctx.strokeStyle = rgba('#ffffff', range(r, 0.08, 0.28));
        ctx.lineWidth = range(r, 1, 3);
        const y = r() * H;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W * range(r, 0.35, 1), y - range(r, -20, 20));
        ctx.stroke();
      }
    }

    // 场景：地平线、日轮、两层远山，再放主体
    const hz = H * (spec.horizon == null ? 0.76 : spec.horizon);
    if (spec.sun !== false) {
      const sx = W * (spec.sunX == null ? 0.74 : spec.sunX), sy = hz - H * 0.2;
      const sr = Math.min(W, H) * (spec.sunS == null ? 0.10 : spec.sunS);
      const sg = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 1.9);
      sg.addColorStop(0, rgba(spec.sun || '#ffe9a8', 0.95));
      sg.addColorStop(0.5, rgba(spec.sun || '#ffe9a8', 0.3));
      sg.addColorStop(1, rgba(spec.sun || '#ffe9a8', 0));
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(spec.sun || '#ffe9a8', 0.92);
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    // 远山：两层平的剪影，越远越淡
    const hillBase = spec.ground || '#0e1220';
    [[0.60, 0.10, 0.34], [0.70, 0.10, 0.12]].forEach(([yy, amp, light], i) => {
      ctx.fillStyle = rgba(shade(hillBase, light), 0.95);
      ctx.beginPath();
      ctx.moveTo(-W * 0.06, H);
      const baseY = H * yy;
      for (let x = -W * 0.06; x <= W * 1.06; x += W / 22) {
        ctx.lineTo(x, celHillY(x, W, H, yy, amp, i));
      }
      ctx.lineTo(W * 1.06, H);
      ctx.closePath();
      ctx.fill();
    });

    // 前景地平线（先铺地，再放主体，人才站得住）
    ctx.fillStyle = rgba(spec.ground || '#0e1220', 0.95);
    ctx.beginPath();
    ctx.moveTo(0, H * 0.82);
    ctx.quadraticCurveTo(W * 0.5, H * (0.78 + 0.02 * Math.sin(t)), W, H * 0.86);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    celSubject(env, spec, t, r, hz);
    if (spec.celGrain) grainLayer(env, 0.2, r);
  }

  // 14 数据/热成像/流场：渐变场 + 等温带 + 数值
  function famField(env, spec, t) {
    const { ctx, W, H, reset } = env;
    reset();
    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, W, H);
    const r = rng(spec.seed + ':field');

    // 场：多个高斯斑 → 热色阶
    const blobs = spec.blobs || [];
    const step = spec.step || 12;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        let v = 0;
        blobs.forEach((b) => {
          const d2 = ((x - b.x) ** 2 + (y - b.y) ** 2) / (b.r * b.r);
          v += b.a * Math.exp(-d2);
        });
        v += Math.sin((x / W * (spec.wave || 4)) + t * 0.8) * 0.05;
        v = clamp(v);
        ctx.fillStyle = rgba(spec.ramp ? rampColor(spec.ramp, v) : '#ff5b2e', 0.9);
        ctx.fillRect(x, y, step, step);
      }
    }
    // 等温线
    if (spec.iso) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('#ffffff', 0.28);
      ctx.lineWidth = 1.2;
      blobs.forEach((b) => {
        for (let i = 1; i <= 4; i++) {
          const rr = b.r * (i / 5) * (1 + 0.03 * Math.sin(t + i));
          ctx.beginPath();
          ctx.ellipse(b.x, b.y, rr, rr * 0.86, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.restore();
    }
    if (spec.readout) {
      ctx.fillStyle = rgba('#ffffff', 0.8);
      ctx.font = '22px "Cascadia Mono", monospace';
      ctx.fillText(spec.readout, W * 0.06, H * 0.9);
    }
    scanlines(env, { gap: 3, alpha: 0.12 });
  }

  // ---------- 通用后处理 ----------
  function grainLayer(env, amt, r) {
    const { ctx, W, H } = env;
    const n = Math.round((W * H) / 220 * amt);
    for (let i = 0; i < n; i++) {
      const g = Math.round(range(r, 60, 255));
      ctx.fillStyle = `rgba(${g},${g},${g},${range(r, 0.04, 0.14) * amt})`;
      ctx.fillRect(r() * W, r() * H, 1.6, 1.6);
    }
  }

  // 压色阶：整帧量化到 N 级，出"限定调色板"的复古感
  function posterize(env, levels) {
    const { ctx, W, H } = env;
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data;
    const step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(d[i] / step) * step;
      d[i + 1] = Math.round(d[i + 1] / step) * step;
      d[i + 2] = Math.round(d[i + 2] / step) * step;
    }
    ctx.putImageData(img, 0, 0);
  }

  function rampColor(stops, v) {
    // stops: [[0,'#001'],...] 按 v 线性取色
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (v >= stops[i][0] && v <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    }
    const k = b[0] === a[0] ? 0 : (v - a[0]) / (b[0] - a[0]);
    return mixHex(a[1], b[1], clamp(k));
  }

  // ---------- 调度 ----------
  const FAMS = {
    hatch: famHatch, halftone: famHalftone, neon: famNeon, screen: famScreen,
    pixel: famPixel, iso: famIso, plan: famPlan, map: famMap, photo: famPhoto,
    paper: famPaper, board: famBoard, flat: famFlat, cel: famCel, field: famField,
  };

  function scene(env, spec, t) {
    const fam = FAMS[spec.family];
    if (!fam) throw new Error('unknown family: ' + spec.family);
    fam(env, spec, t);
    // 片尾：极轻的暗角收束，避免每族各写一遍
  }

  window.STYLEKIT = {
    page, rng, scene, type, grid, paper, hatch, halftone, dither, iso, dimension,
    particles, rampColor, mixHex, shade, rgba, clamp, ease, lerp, FAMS,
  };
})();
