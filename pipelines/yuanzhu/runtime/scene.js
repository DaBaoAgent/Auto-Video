/* yuanzhu · 修车摊的午后（Auto-Video 自研画法脚本）
   媒介：蓝色圆珠笔在奶油卡纸上。线宽几乎不变，明暗只靠排线堆，收笔积一颗小墨点。
   题材：墙根下的修车摊——一辆立着的大杠车、弯腰查前轮的师傅、蹲在木箱边的孩子，
        工具箱、气筒、靠墙的备胎、墙上的海报与旧轮胎，斜进来的午后暖光。
   画法：形体用"胶囊笔"（粗圆头线）叠出来，暗部成组排线，最后两笔签名收住。 */
(() => {
  const W = 1920, H = 1080;
  const BLUE = '36,58,128';
  const GY = 872;

  function ball(ctx, pts, frac, w = 2.2, a = 1) {
    if (frac <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(${BLUE},${a})`;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let p = 0; p < 2; p++) {
      ctx.lineWidth = w + p * 0.35;
      ctx.globalAlpha = a * (p ? 0.26 : 0.95);
      U.tracePartial(ctx, pts, frac);
    }
    if (frac > 0.985 && pts.length) {
      const last = pts[pts.length - 1];
      ctx.globalAlpha = a * 0.45;
      ctx.fillStyle = `rgba(${BLUE},1)`;
      ctx.beginPath();
      ctx.arc(last[0], last[1], w * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  const arc = (cx, cy, r, a0, a1, n = 52) => {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + (a1 - a0) * (i / n);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return out;
  };
  function hatchIn(ctx, path, box, angle, gap, alpha, frac, w = 1.25) {
    if (frac <= 0) return;
    ctx.save();
    ctx.clip(path);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = `rgba(${BLUE},1)`;
    ctx.lineWidth = w;
    const [x, y, wd, ht] = box;
    const dx = Math.cos(angle), dy = Math.sin(angle), nx = -dy, ny = dx;
    const diag = Math.hypot(wd, ht), n = Math.ceil(diag / gap), show = Math.floor(n * U.clamp(frac));
    const cx = x + wd / 2, cy = y + ht / 2;
    for (let i = 0; i < show; i++) {
      const off = -diag / 2 + i * gap;
      const mx = cx + nx * off, my = cy + ny * off;
      ctx.beginPath();
      ctx.moveTo(mx - dx * diag * 0.6, my - dy * diag * 0.6);
      ctx.lineTo(mx + dx * diag * 0.6, my + dy * diag * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  const box = (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };
  const ell = (cx, cy, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); return p; };
  const sm = (pts) => RIG.smooth(pts, true);
  const poly = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };

  // 胶囊笔：圆头粗线的形体，先铺一层淡蓝，再压轮廓，里面成组排线
  function capPath(a, b, w) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const p = new Path2D();
    p.arc(a[0], a[1], w / 2, ang + Math.PI / 2, ang - Math.PI / 2);
    p.arc(b[0], b[1], w / 2, ang - Math.PI / 2, ang + Math.PI / 2);
    p.closePath();
    return p;
  }
  function cap_(ctx, a, b, w, alpha = 0.95, hatch = 0.2, endCap = false) {
    const p = capPath(a, b, w);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = -Math.sin(ang) * w / 2, ny = Math.cos(ang) * w / 2;
    const bx = Math.min(a[0], b[0]) - w, by = Math.min(a[1], b[1]) - w;
    const bw = Math.abs(a[0] - b[0]) + w * 2, bh = Math.abs(a[1] - b[1]) + w * 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(${BLUE},0.055)`;
    ctx.fill(p);
    if (hatch > 0) hatchIn(ctx, p, [bx, by, bw, bh], 1.24, 7.5, hatch * 0.9, 0.92, 1.2);
    // 只描两条长边，不画端头的圆——不然四肢到处是圆圈
    ctx.strokeStyle = `rgba(${BLUE},0.9)`;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a[0] + nx, a[1] + ny);
    ctx.lineTo(b[0] + nx, b[1] + ny);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(a[0] - nx, a[1] - ny);
    ctx.lineTo(b[0] - nx, b[1] - ny);
    ctx.stroke();
    if (endCap) {
      ctx.beginPath();
      ctx.arc(b[0], b[1], w / 2, ang - Math.PI / 2, ang + Math.PI / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- 人：骨架点 → 胶囊体块 ----------
  function skeleton(ctx, o) {
    const { pts: P, h, a = 1 } = o;
    const wT = h * 0.150, wL = h * 0.080, wA = h * 0.058;
    // 先排好顺序：后肢 → 躯干 → 前肢
    const parts = [
      [P.sh, P.elb2, wA, 0.16, 0.18], [P.elb2, P.hand2, wA * 0.94, 0.12, 0],
      [P.hip, P.kne2, wL, 0.34, 0.1], [P.kne2, P.ank2, wL * 0.84, 0.2, 0],
      [P.sh, P.hip, wT, 0.36, 0],
      [P.hip, P.kne1, wL, 0.26, 0.1], [P.kne1, P.ank1, wL * 0.84, 0.16, 0],
      [P.sh, P.elb1, wA * 0.94, 0.16, 0.22], [P.elb1, P.hand1, wA, 0.12, 0],
      [P.sh, P.hd, h * 0.052, 0.14, 0.5],
    ];
    const caps = parts.map(([p0, p1, w]) => capPath(p0, p1, w));

    // 1 不透明纸色打底：人站在车前，遮住车架线
    const union = new Path2D();
    caps.forEach(c => union.addPath(c));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(242,233,214,0.96)';
    ctx.fill(union);
    // 2 一层淡蓝的体块
    ctx.fillStyle = `rgba(${BLUE},0.14)`;
    ctx.fill(union);
    ctx.restore();

    // 3 每个形体里排线
    parts.forEach(([p0, p1, w, hp], i) => {
      const bx = Math.min(p0[0], p1[0]) - w, by = Math.min(p0[1], p1[1]) - w;
      const bw = Math.abs(p0[0] - p1[0]) + w * 2, bh = Math.abs(p0[1] - p1[1]) + w * 2;
      hatchIn(ctx, caps[i], [bx, by, bw, bh], 1.24, 5.2, hp * a * 0.95, 0.96, 1.3);
      hatchIn(ctx, caps[i], [bx, by, bw, bh], 0.40, 9, hp * 0.45 * a, 0.6, 1.1);
    });

    // 3b 关节：肘 / 膝 / 肩 / 腕，补小块把缝接上
    const joints = [[P.elb2, wA * 0.9], [P.elb1, wA * 0.9], [P.kne2, wL * 0.82], [P.kne1, wL * 0.82], [P.sh, wT * 0.34], [P.ank1, wL * 0.7], [P.ank2, wL * 0.7]];
    joints.forEach(([c, r]) => {
      const jp = ell(c[0], c[1], r, r);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(242,233,214,0.96)';
      ctx.fill(jp);
      ctx.fillStyle = `rgba(${BLUE},0.13)`;
      ctx.fill(jp);
      hatchIn(ctx, jp, [c[0] - r, c[1] - r, r * 2, r * 2], 1.24, 5.2, 0.2 * a, 0.9, 1.2);
      ctx.strokeStyle = `rgba(${BLUE},0.86)`;
      ctx.lineWidth = 2.0;
      ctx.stroke(jp);
      ctx.restore();
    });

    // 4 描边：只画两条长边，端头只画手脚那一头
    parts.forEach(([p0, p1, w, hp, trim], i) => {
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const nx = -Math.sin(ang) * w / 2, ny = Math.cos(ang) * w / 2;
      const t0 = trim || 0;
      const s0 = [p0[0] + (p1[0] - p0[0]) * t0, p0[1] + (p1[1] - p0[1]) * t0];
      ctx.save();
      ctx.globalAlpha = a * 0.88;
      ctx.strokeStyle = `rgba(${BLUE},1)`;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s0[0] + nx, s0[1] + ny);
      ctx.lineTo(p1[0] + nx, p1[1] + ny);
      ctx.moveTo(s0[0] - nx, s0[1] - ny);
      ctx.lineTo(p1[0] - nx, p1[1] - ny);
      ctx.stroke();
      if (i === 1 || i === 3 || i === 4 || i === 6 || i === 8) {
        ctx.beginPath();
        ctx.arc(p1[0], p1[1], w / 2, ang - Math.PI / 2, ang + Math.PI / 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  // ---------- 车轮 ----------
  function wheel(ctx, cx, cy, r, spin, frac, spokes = 30) {
    ball(ctx, arc(cx, cy, r, 0, Math.PI * 2), frac, 3.0, 0.95);
    ball(ctx, arc(cx, cy, r - 9, 0, Math.PI * 2), frac, 1.4, 0.45);
    if (frac > 0.4) {
      ctx.save();
      ctx.strokeStyle = `rgba(${BLUE},0.7)`;
      ctx.lineWidth = 1.15;
      const n = Math.round(spokes * U.clamp((frac - 0.4) / 0.6));
      for (let i = 0; i < n; i++) {
        const a = spin + (i / spokes) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9);
        ctx.lineTo(cx + Math.cos(a) * (r - 11), cy + Math.sin(a) * (r - 11));
        ctx.stroke();
      }
      ctx.restore();
    }
    ball(ctx, arc(cx, cy, 9, 0, Math.PI * 2), frac, 2.2, 0.9);
  }

  // 车的关键点（1m ≈ 330px：轮径 0.68m ≈ 224px）
  const R = [520, 762], F = [900, 762], BB = [700, 762], S = [606, 600], HB = [912, 588];

  window.SCENES.yuanzhu = {
    init: async () => {},
    draw(ctx, t) {
      U.paper(ctx, W, H, '#f1e8d2', 52, 0.55);
      const vg = ctx.createRadialGradient(W * 0.40, H * 0.34, 240, W * 0.5, H * 0.52, W * 0.9);
      vg.addColorStop(0, 'rgba(255,253,242,0.18)');
      vg.addColorStop(1, 'rgba(122,104,72,0.22)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      const sc = 1.006 + 0.034 * U.easeInOut(U.p(t, 0.00, 7.00));
      ctx.save();
      ctx.translate(940, 600);
      ctx.scale(sc, sc);
      ctx.translate(-940, -600);

      // 01 量线
      const gd = 1;
      ball(ctx, [[-40, GY], [640, GY + 2], [1300, GY + 4], [1960, GY + 1]], gd, 1.7, 0.4);
      ball(ctx, [[-40, 158], [700, 162], [1400, 158], [1960, 162]], gd, 1.3, 0.26);

      // 02 墙：淡排线 + 砖缝
      const wallIn = 1;
      if (wallIn > 0) {
        hatchIn(ctx, box(-60, 158, W + 120, GY - 158), [-60, 158, W + 120, GY - 158], 1.22, 21, 0.10, wallIn);
        for (let y = 200; y < GY - 12; y += 56) ball(ctx, [[-40, y], [1960, y + 1]], wallIn, 0.9, 0.14);
        ball(ctx, [[-40, GY - 3], [900, GY - 1], [1960, GY - 4]], wallIn, 2.8, 0.45);
      }

      // 03 墙上的海报
      const postIn = U.easeInOut(U.p(t, -0.9, 0.7));
      if (postIn > 0) {
        const P2 = { x: 1520, y: 206, w: 214, h: 268 };
        ball(ctx, [[P2.x, P2.y], [P2.x + P2.w, P2.y], [P2.x + P2.w, P2.y + P2.h], [P2.x, P2.y + P2.h], [P2.x, P2.y]], postIn, 2.3, 0.82);
        ball(ctx, [[P2.x + 24, P2.y + 34], [P2.x + 132, P2.y + 32]], postIn, 4.5, 0.8);
        for (let i = 0; i < 7; i++) {
          const y = P2.y + 74 + i * 22;
          ball(ctx, [[P2.x + 24, y], [P2.x + P2.w - 26 - (i % 3) * 30, y + 1]], postIn, 1.2, 0.34);
        }
        ball(ctx, arc(P2.x + 64, P2.y + 222, 21, 0, Math.PI * 2, 20), postIn, 1.5, 0.55);
        ball(ctx, arc(P2.x + 142, P2.y + 222, 21, 0, Math.PI * 2, 20), postIn, 1.5, 0.55);
        ball(ctx, [[P2.x + 64, P2.y + 222], [P2.x + 103, P2.y + 214], [P2.x + 142, P2.y + 222]], postIn, 1.6, 0.5);
      }

      // 04 墙上挂的旧轮胎（带轮毂和辐条）
      const tireIn = U.easeInOut(U.p(t, -0.7, 0.8));
      if (tireIn > 0) {
        const sway = 0.028 * Math.sin(t * 1.9);
        ctx.save();
        ctx.translate(226, 172);
        ctx.rotate(sway);
        ball(ctx, arc(0, 104, 100, 0, Math.PI * 2, 52), tireIn, 3.0, 0.9);
        ball(ctx, arc(0, 104, 78, 0, Math.PI * 2, 44), tireIn, 1.4, 0.5);
        ball(ctx, arc(0, 104, 16, 0, Math.PI * 2, 16), tireIn, 1.6, 0.6);
        ctx.save();
        ctx.strokeStyle = `rgba(${BLUE},0.42)`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 17, 104 + Math.sin(a) * 17);
          ctx.lineTo(Math.cos(a) * 76, 104 + Math.sin(a) * 76);
          ctx.stroke();
        }
        ctx.restore();
        hatchIn(ctx, ell(0, 104, 92, 92), [-96, 8, 192, 192], -0.95, 11, 0.13, tireIn);
        ball(ctx, [[0, -4], [0, 14]], tireIn, 2.2, 0.75);
        ball(ctx, [[-14, 6], [0, -10], [14, 6]], tireIn, 1.8, 0.6);
        ctx.restore();
      }

      // 05 后轮 → 06 前轮
      const rwIn = U.easeInOut(U.p(t, -0.85, 0.75));
      if (rwIn > 0) wheel(ctx, R[0], R[1], 112, t * 0.45, rwIn, 28);
      const fwIn = U.easeInOut(U.p(t, -0.35, 0.8));
      if (fwIn > 0) wheel(ctx, F[0], F[1], 112, t * 0.45 + 0.15, fwIn, 28);

      // 07 车架
      const frIn = U.easeInOut(U.p(t, 0.05, 0.82));
      if (frIn > 0) {
        ball(ctx, [BB, S], frIn, 3.6, 0.86);
        ball(ctx, [S, HB], frIn, 3.4, 0.86);
        ball(ctx, [BB, HB], frIn, 3.8, 0.86);
        ball(ctx, [BB, R], frIn, 3.2, 0.78);
        ball(ctx, [S, R], frIn, 3.0, 0.78);
        ball(ctx, [HB, [898, 660], [892, 762]], frIn, 3.4, 0.86);
        ball(ctx, arc(BB[0], BB[1], 42, 0, Math.PI * 2, 30), frIn, 2.6, 0.75);
        ball(ctx, arc(BB[0], BB[1], 15, 0, Math.PI * 2, 16), frIn, 1.8, 0.65);
        // 曲柄：缓慢地转
        const ck = t * 0.9;
        for (let k = 0; k < 2; k++) {
          const a = ck + k * Math.PI;
          const ex = BB[0] + Math.cos(a) * 62, ey = BB[1] + Math.sin(a) * 62;
          ball(ctx, [[BB[0], BB[1]], [ex, ey]], frIn, 3.0, 0.72);
          ball(ctx, [[ex - 14, ey - 4], [ex + 14, ey - 4], [ex + 14, ey + 6], [ex - 14, ey + 6], [ex - 14, ey - 4]], frIn, 1.8, 0.6);
        }
        ball(ctx, [[BB[0] + 42, BB[1] - 4], [R[0] + 24, R[1] - 24], [R[0] + 24, R[1] + 24], [BB[0] + 42, BB[1] + 4]], frIn, 1.3, 0.42);
        ball(ctx, [[S[0] - 48, S[1] - 8], [S[0] + 12, S[1] - 18], [S[0] + 50, S[1] - 6], [S[0] + 8, S[1] + 4], [S[0] - 44, S[1] + 2]], frIn, 2.2, 0.8);
        ball(ctx, [[HB[0], HB[1]], [HB[0] - 14, HB[1] - 38], [HB[0] + 32, HB[1] - 50], [HB[0] + 78, HB[1] - 44]], frIn, 3.0, 0.86);
        ball(ctx, [[HB[0] + 58, HB[1] - 46], [HB[0] + 78, HB[1] - 44]], frIn, 4.2, 0.9);
        ball(ctx, arc(HB[0] + 6, HB[1] - 62, 11, 0, Math.PI * 2, 16), frIn, 1.8, 0.7);
        ball(ctx, arc(R[0], R[1], 128, Math.PI * 1.06, Math.PI * 1.50, 20), frIn, 2.2, 0.6);
        ball(ctx, arc(F[0], F[1], 128, Math.PI * 1.50, Math.PI * 1.94, 20), frIn, 2.2, 0.6);
      }

      // 08 木箱（暖赭色块）
      const crateIn = U.easeOut(U.p(t, 0.42, 0.6));
      if (crateIn > 0) {
        const bx = 130, by = 800, bw = 208, bh = 152;
        ctx.save();
        ctx.globalAlpha = 0.16 * crateIn;
        ctx.fillStyle = 'rgba(196,126,58,1)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.restore();
        ball(ctx, [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh], [bx, by]], crateIn, 2.5, 0.85);
        ball(ctx, [[bx + 4, by + 36], [bx + bw - 4, by + 36]], crateIn, 1.6, 0.5);
        ball(ctx, [[bx + 4, by + 104], [bx + bw - 4, by + 104]], crateIn, 1.6, 0.5);
        hatchIn(ctx, box(bx, by, bw, bh), [bx, by, bw, bh], 1.16, 10, 0.14, crateIn);
      }

      // 09 孩子：坐在木箱棱上（整块剪影）
      const boyIn = U.easeOut(U.p(t, 0.95, 0.7));
      if (boyIn > 0) {
        const a0 = boyIn;
        const paintFig = (path, hatchA, box) => {
          ctx.save();
          ctx.globalAlpha = a0;
          ctx.fillStyle = 'rgba(242,233,214,0.97)';
          ctx.fill(path);
          ctx.fillStyle = `rgba(${BLUE},0.11)`;
          ctx.fill(path);
          if (hatchA) hatchIn(ctx, path, box, 1.24, 6.4, hatchA * a0, 0.94, 1.25);
          ctx.strokeStyle = `rgba(${BLUE},0.92)`;
          ctx.lineWidth = 2.3;
          ctx.lineJoin = 'round';
          ctx.stroke(path);
          ctx.restore();
        };
        // 躯干（前倾一点点）
        const torso = sm([[342, 700], [352, 716], [346, 790], [330, 812], [300, 812], [296, 760], [300, 706], [326, 694]]);
        paintFig(torso, 0.26, [292, 690, 66, 130]);
        // 腿：大腿压在箱面、膝顶出、小腿垂下来
        const legs = sm([[336, 806], [396, 830], [402, 866], [386, 872], [370, 856], [318, 836], [300, 812], [330, 800]]);
        paintFig(legs, 0.2, [296, 800, 112, 76]);
        // 鞋
        ball(ctx, [[374, 862], [404, 862], [406, 876], [372, 878], [374, 862]], a0, 1.9, 0.8);
        ball(ctx, [[336, 866], [364, 866], [366, 878], [334, 880], [336, 866]], a0, 1.8, 0.7);
        // 手臂：搭在箱沿
        const armA = sm([[338, 704], [318, 730], [304, 776], [300, 800], [314, 800], [322, 772], [338, 736], [350, 712]]);
        paintFig(armA, 0.14, [296, 698, 58, 108]);
        // 头
        const hp = ell(312, 660, 21, 26, 0.12);
        ctx.save();
        ctx.globalAlpha = a0;
        ctx.fillStyle = 'rgba(242,233,214,0.97)';
        ctx.fill(hp);
        ctx.fillStyle = `rgba(${BLUE},0.16)`;
        ctx.fill(hp);
        hatchIn(ctx, hp, [286, 630, 52, 58], 1.25, 5.5, 0.3 * a0, 0.95, 1.2);
        ctx.strokeStyle = `rgba(${BLUE},0.92)`;
        ctx.lineWidth = 2.2;
        ctx.stroke(hp);
        ctx.restore();
        // 头发、帽檐
        ball(ctx, arc(310, 652, 23, Math.PI * 1.02, Math.PI * 1.88, 16), a0, 2.2, 0.8);
        ball(ctx, [[286, 654], [336, 646]], a0, 2.0, 0.72);
        // 领口
        ball(ctx, [[300, 690], [326, 686]], a0, 1.8, 0.6);
      }

      // 10 师傅：站在车把边上，一手扶着车把、一手拿抹布，低头看车
      const manIn = U.easeOut(U.p(t, 1.35, 0.8));
      if (manIn > 0) {
        const a1 = manIn;
        const br = Math.sin(t * 1.7) * 3;            // 呼吸
        const paintFig = (path, hatchA, box, ang = 1.22, gap = 6.2) => {
          ctx.save();
          ctx.globalAlpha = a1;
          ctx.fillStyle = 'rgba(242,233,214,0.97)';
          ctx.fill(path);
          ctx.fillStyle = `rgba(${BLUE},0.12)`;
          ctx.fill(path);
          if (hatchA) hatchIn(ctx, path, box, ang, gap, hatchA * a1, 0.95, 1.3);
          ctx.strokeStyle = `rgba(${BLUE},0.92)`;
          ctx.lineWidth = 2.4;
          ctx.lineJoin = 'round';
          ctx.stroke(path);
          ctx.restore();
        };

        // 两条腿：左腿略前，中间留一条缝，别读成一条柱子
        const legL = poly([
          [962, 650], [994, 648], [998, 700], [1000, 858],
          [1004, 884], [972, 888], [948, 886], [952, 858], [956, 700],
        ]);
        paintFig(legL, 0.24, [948, 640, 66, 252], 1.3, 7.5);
        const legR = poly([
          [1014, 648], [1044, 650], [1048, 700], [1050, 856],
          [1056, 884], [1026, 888], [1008, 886], [1010, 856], [1008, 700],
        ]);
        paintFig(legR, 0.18, [996, 640, 52, 252], 1.3, 8);

        // 鞋
        ball(ctx, [[948, 876], [1002, 876], [1004, 892], [944, 894], [948, 876]], a1, 2.0, 0.78);
        ball(ctx, [[1012, 876], [1058, 876], [1060, 892], [1008, 894], [1012, 876]], a1, 2.0, 0.78);

        // 上衣：肩、腰、衣摆
        const coat = poly([
          [930, 486], [954, 470], [986, 480], [1008, 520],
          [1016, 590], [1014, 648], [986, 656], [958, 650], [944, 590], [930, 526],
        ]);
        paintFig(coat, 0.28, [926, 464, 94, 196], 1.24, 6.0);

        // 手臂：扶把的那只手
        const armL = poly([
          [934, 492], [956, 500], [930, 556], [912, 586],
          [918, 602], [904, 606], [898, 578], [916, 540], [922, 502],
        ]);
        paintFig(armL, 0.18, [894, 486, 66, 124], 1.3, 7);
        // 另一只手拿抹布，垂在身侧
        const armR = poly([
          [984, 486], [1006, 492], [1018, 556], [1024, 620 + br],
          [1002, 626 + br], [996, 556], [988, 498],
        ]);
        paintFig(armR, 0.16, [980, 480, 50, 152], 1.3, 7.5);

        // 手
        ctx.save();
        ctx.globalAlpha = a1;
        ctx.strokeStyle = `rgba(${BLUE},0.9)`;
        ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.arc(908, 594, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(1013, 628 + br, 11, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        // 抹布：一小块挂在手里
        ctx.save();
        ctx.globalAlpha = 0.18 * a1;
        ctx.fillStyle = 'rgba(96,120,168,1)';
        ctx.beginPath();
        ctx.moveTo(998, 630 + br); ctx.lineTo(1030, 626 + br);
        ctx.lineTo(1036, 668 + br); ctx.lineTo(1000, 672 + br);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ball(ctx, [[998, 630 + br], [1030, 626 + br], [1036, 668 + br], [1000, 672 + br], [998, 630 + br]], a1, 1.5, 0.5);

        // 头：低头看向车把
        const rot = 0.26;
        const hp2 = ell(932, 428, 23, 28, rot);
        ctx.save();
        ctx.globalAlpha = a1;
        ctx.fillStyle = 'rgba(242,233,214,0.97)';
        ctx.fill(hp2);
        ctx.fillStyle = `rgba(${BLUE},0.15)`;
        ctx.fill(hp2);
        hatchIn(ctx, hp2, [906, 398, 52, 66], 1.24, 5.5, 0.28 * a1, 0.95, 1.25);
        ctx.strokeStyle = `rgba(${BLUE},0.92)`;
        ctx.lineWidth = 2.3;
        ctx.stroke(hp2);
        ctx.restore();
        // 后脑与工作帽
        ball(ctx, arc(932, 428, 27, Math.PI * 1.00, Math.PI * 1.78, 18), a1, 2.4, 0.82);
        ctx.save();
        ctx.globalAlpha = a1;
        ctx.fillStyle = `rgba(${BLUE},0.20)`;
        ctx.beginPath();
        ctx.ellipse(930, 402, 25, 11, 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(${BLUE},0.9)`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();
        ball(ctx, [[904, 410], [958, 414]], a1, 2.2, 0.8);
        ball(ctx, [[892, 420], [906, 404]], a1, 1.8, 0.6);

        // 脖子与下颚
        ball(ctx, [[926, 452], [950, 452], [956, 486], [928, 488], [926, 452]], a1, 1.8, 0.62);
        ball(ctx, arc(928, 438, 24, Math.PI * 0.35, Math.PI * 0.85, 12), a1, 1.6, 0.5);

        // 领口、衣襟、口袋、袖口
        ball(ctx, [[930, 492], [958, 486]], a1, 2.0, 0.6);
        ball(ctx, [[984, 510], [992, 570], [996, 630]], a1, 1.6, 0.42);
        ball(ctx, [[948, 520], [924, 516], [924, 552], [948, 556], [948, 520]], a1, 1.4, 0.4);
        ball(ctx, [[1006, 620], [1020, 618]], a1, 1.8, 0.5);

        // 脚下的影
        hatchIn(ctx, ell(992, 896, 96, 16), [890, 878, 210, 32], 1.14, 9, 0.2 * a1, 1);
      }

      // 10b 墙上的木牌：补胎
      const signIn = U.easeOut(U.p(t, 2.5, 0.6));
      if (signIn > 0) {
        const bx2 = 1180, by2 = 330;
        ctx.save();
        ctx.globalAlpha = 0.2 * signIn;
        ctx.fillStyle = 'rgba(190,142,72,1)';
        ctx.fillRect(bx2, by2, 150, 62);
        ctx.restore();
        ball(ctx, [[bx2, by2], [bx2 + 150, by2 - 4], [bx2 + 152, by2 + 60], [bx2 + 2, by2 + 64], [bx2, by2]], signIn, 2.2, 0.8);
        ball(ctx, [[bx2 + 20, by2 + 22], [bx2 + 60, by2 + 18]], signIn, 3.2, 0.75);
        ball(ctx, [[bx2 + 20, by2 + 46], [bx2 + 96, by2 + 42]], signIn, 1.6, 0.45);
        ball(ctx, [[bx2 + 66, by2 - 8], [bx2 + 66, by2 - 22]], signIn, 1.4, 0.4);
        ball(ctx, [[bx2 + 96, by2 - 8], [bx2 + 96, by2 - 22]], signIn, 1.4, 0.4);
      }

      // 11 工具箱 / 气筒 / 靠墙的备胎
      const toolIn = U.easeOut(U.p(t, 2.1, 0.75));
      if (toolIn > 0) {
        const tb = { x: 1150, y: 806, w: 222, h: 82 };
        ctx.save();
        ctx.globalAlpha = 0.18 * toolIn;
        ctx.fillStyle = 'rgba(58,104,76,1)';
        ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
        ctx.restore();
        ball(ctx, [[tb.x, tb.y], [tb.x + tb.w, tb.y], [tb.x + tb.w, tb.y + tb.h], [tb.x, tb.y + tb.h], [tb.x, tb.y]], toolIn, 2.4, 0.86);
        ball(ctx, [[tb.x, tb.y], [tb.x + 14, tb.y - 52], [tb.x + tb.w - 4, tb.y - 42], [tb.x + tb.w, tb.y]], toolIn, 2.2, 0.8);
        hatchIn(ctx, box(tb.x, tb.y, tb.w, tb.h), [tb.x, tb.y, tb.w, tb.h], 0.82, 9, 0.18, toolIn);
        ball(ctx, [[tb.x + 26, tb.y - 24], [tb.x + 96, tb.y - 56]], toolIn, 3.2, 0.82);
        ball(ctx, [[tb.x + 96, tb.y - 60], [tb.x + 110, tb.y - 64], [tb.x + 104, tb.y - 48]], toolIn, 2.4, 0.8);
        ball(ctx, [[tb.x + 126, tb.y - 34], [tb.x + 176, tb.y - 52]], toolIn, 2.4, 0.76);
        ball(ctx, [[tb.x + 176, tb.y - 52], [tb.x + 184, tb.y - 56]], toolIn, 4.0, 0.8);
        ctx.save();
        ctx.globalAlpha = 0.38 * toolIn;
        ctx.fillStyle = 'rgba(198,72,52,1)';
        ctx.beginPath();
        ctx.moveTo(tb.x + 150, tb.y + 30);
        ctx.lineTo(tb.x + 206, tb.y + 22);
        ctx.lineTo(tb.x + 210, tb.y + 56);
        ctx.lineTo(tb.x + 154, tb.y + 64);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ball(ctx, [[tb.x + 150, tb.y + 30], [tb.x + 206, tb.y + 22], [tb.x + 210, tb.y + 56], [tb.x + 154, tb.y + 64], [tb.x + 150, tb.y + 30]], toolIn, 1.4, 0.6);
        ball(ctx, [[tb.x + tb.w + 22, tb.y + 68], [tb.x + tb.w + 22, tb.y + 4], [tb.x + tb.w + 96, tb.y - 28]], toolIn, 3.2, 0.75);
        ball(ctx, [[tb.x + tb.w + 86, tb.y - 34], [tb.x + tb.w + 108, tb.y - 22]], toolIn, 4.0, 0.8);
        ball(ctx, arc(1466, 812, 98, 0, Math.PI * 2, 46), toolIn, 2.6, 0.82);
        ball(ctx, arc(1466, 812, 74, 0, Math.PI * 2, 40), toolIn, 1.4, 0.5);
        ball(ctx, arc(1466, 812, 14, 0, Math.PI * 2, 14), toolIn, 1.5, 0.55);
      }

      // 12 午后的暖光
      const sunIn = U.easeInOut(U.p(t, 2.6, 1.0));
      if (sunIn > 0) {
        ctx.save();
        ctx.globalAlpha = 0.15 * sunIn;
        const warm = ctx.createLinearGradient(1240, 200, 1900, 880);
        warm.addColorStop(0, 'rgba(219,142,62,1)');
        warm.addColorStop(1, 'rgba(219,142,62,0)');
        ctx.fillStyle = warm;
        const dx = Math.sin(t * 0.7) * 14;
        ctx.beginPath();
        ctx.moveTo(1810 + dx, 170); ctx.lineTo(1960, 170);
        ctx.lineTo(1960, 820); ctx.lineTo(1330 + dx, GY + 96);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        // 光柱里的浮尘
        const rr = U.rng(771);
        ctx.save();
        ctx.globalAlpha = 0.3 * sunIn;
        ctx.fillStyle = 'rgba(120,96,60,1)';
        for (let i = 0; i < 34; i++) {
          const px = 1300 + rr() * 520 + Math.sin(t * 0.6 + i) * 16;
          const py = 250 + rr() * 620 + Math.cos(t * 0.45 + i * 2) * 12;
          ctx.beginPath();
          ctx.arc(px, py, 0.8 + rr() * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 13 地面排线、长影、散落物
      const shadeIn = U.easeInOut(U.p(t, 2.95, 0.95));
      if (shadeIn > 0) {
        hatchIn(ctx, poly([[486, 786], [934, 786], [1010, 824], [552, 830]]), [486, 786, 530, 48], 1.02, 10, 0.17, shadeIn);
        hatchIn(ctx, box(-40, GY - 24, W + 80, 26), [-40, GY - 24, W + 80, 26], 0.05, 8, 0.18, shadeIn);
        hatchIn(ctx, box(-40, GY + 4, W + 80, 210), [-40, GY + 4, W + 80, 210], 0.06, 16, 0.10, shadeIn);
        ctx.save();
        ctx.globalAlpha = 0.13 * shadeIn;
        ctx.strokeStyle = 'rgba(70,52,30,1)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const x0 = 470 + i * 40, len = 176 - i * 5;
          ctx.beginPath();
          ctx.moveTo(x0, GY + 8);
          ctx.lineTo(x0 + len, GY + 8 - len * 0.12);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 14 细节：螺丝、油迹、小瓶、粉笔牌
      const detIn = U.easeOut(U.p(t, 3.6, 0.7));
      if (detIn > 0) {
        [[868, 936], [900, 950], [934, 934], [820, 948]].forEach(([x, y]) => ball(ctx, arc(x, y, 7, 0, Math.PI * 2, 12), detIn, 1.3, 0.5));
        const r2 = U.rng(3310);
        ctx.save();
        ctx.globalAlpha = 0.26 * detIn;
        ctx.fillStyle = `rgba(${BLUE},1)`;
        for (let i = 0; i < 46; i++) {
          ctx.beginPath();
          ctx.arc(700 + r2() * 320, 800 + r2() * 130, 0.9 + r2() * 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.22 * detIn;
        ctx.fillStyle = 'rgba(72,132,86,1)';
        ctx.fillRect(1122, 906, 18, 44);
        ctx.restore();
        ball(ctx, [[1122, 906], [1140, 906], [1140, 950], [1122, 950], [1122, 906]], detIn, 1.6, 0.55);
        ball(ctx, [[1126, 898], [1136, 898]], detIn, 1.6, 0.5);
        ball(ctx, [[1010, 946], [1092, 932], [1098, 958], [1016, 970], [1010, 946]], detIn, 1.7, 0.55);
      }

      // 15 收笔签名
      const sigIn = U.easeOut(U.p(t, 4.7, 0.6));
      if (sigIn > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3 * sigIn;
        ctx.strokeStyle = `rgba(${BLUE},1)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(1806, 1006);
        ctx.bezierCurveTo(1832, 988, 1850, 1020, 1870, 998);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    },
  };
})();
