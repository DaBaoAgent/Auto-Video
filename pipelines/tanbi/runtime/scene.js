/* tanbi · 雪夜的街灯（Auto-Video 自研画法脚本）
   媒介：灰纸上的三色炭笔——柳炭压暗部、纸擦笔揉中间调、可塑橡皮与白垩提亮，赭红只点两笔。
   题材：雪夜街口，一盏煤气街灯、一张长椅、一棵枯树，一对撑伞走过的男女，一条小狗。
   画法要点：人物只做剪影（不描轮廓），剪影上再压排线；黑里透出纸纹，才有炭笔的味道。 */
(() => {
  const W = 1920, H = 1080;
  const INK = '40,36,31';
  const CHALK = '250,247,238';
  const SAN = '152,84,60';
  const PAPER = '#8f8a7c';
  const GY = 700;

  function charcoal(ctx, pts, frac, w = 8, alpha = 0.85, col = INK) {
    if (frac <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(${col},${alpha})`;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let p = 0; p < 3; p++) {
      const j = (p - 1) * 1.7;
      ctx.lineWidth = Math.max(1, w - p * 2);
      ctx.globalAlpha = alpha * (1 - p * 0.27);
      ctx.setTransform(1, 0, 0, 1, j, j * 0.7);
      U.tracePartial(ctx, pts, frac);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }
  function mass(ctx, path, alpha = 0.6, col = INK) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(${col},1)`;
    ctx.fill(path);
    ctx.restore();
  }
  function chalkFill(ctx, path, alpha = 0.7) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(${CHALK},1)`;
    ctx.fill(path);
    ctx.restore();
  }
  function chalkStroke(ctx, pts, frac, w = 6, alpha = 0.6) {
    if (frac <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(${CHALK},${alpha})`;
    ctx.lineCap = 'round';
    ctx.lineWidth = w;
    U.tracePartial(ctx, pts, frac);
    ctx.restore();
  }
  const ell = (cx, cy, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); return p; };
  const box = (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };
  const poly = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };

  const HOUSES = [
    { x: -40, w: 300, top: 322, a: 0.50 },
    { x: 286, w: 240, top: 386, a: 0.40 },
    { x: 552, w: 288, top: 300, a: 0.54 },
    { x: 862, w: 236, top: 392, a: 0.36 },
    { x: 1112, w: 320, top: 330, a: 0.48 },
    { x: 1452, w: 258, top: 400, a: 0.34 },
    { x: 1734, w: 260, top: 344, a: 0.46 },
  ];
  const WINS = (() => {
    const r = U.rng(91), out = [];
    HOUSES.forEach((h, i) => {
      const cols = Math.max(2, Math.round(h.w / 108));
      for (let c = 0; c < cols; c++) for (let ro = 0; ro < 3; ro++) {
        if (r() > 0.42) continue;
        out.push({ x: h.x + 26 + c * (h.w - 48) / cols, y: h.top + 46 + ro * 74, w: 32 + r() * 12, h: 40 + r() * 10, a: 0.28 + r() * 0.46 });
      }
      if (i % 2 === 0) out.push({ door: true, x: h.x + h.w * 0.42, y: GY - 148, w: 54, h: 148, a: 0.62 });
    });
    return out;
  })();
  const LAMP_X = 470, LAMP_TOP = 232, LAMP_BOT = 736;
  const Wi2 = (k) => 4 * k * (1 - k) * 4.2;   // 抛物线垂度

  const TREE = (() => {
    const r = U.rng(313);
    const B = [];
    const branch = (x0, y0, ang, len, w, depth) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      const bend = (r() - 0.5) * len * 0.22;
      B.push({ pts: [[x0, y0], [(x0 + x1) / 2 - Math.sin(ang) * bend, (y0 + y1) / 2 + Math.cos(ang) * bend], [x1, y1]], w });
      if (depth > 0) {
        branch(x1, y1, ang - 0.34 - r() * 0.22, len * (0.62 + r() * 0.16), w * 0.6, depth - 1);
        branch(x1, y1, ang + 0.30 + r() * 0.24, len * (0.58 + r() * 0.2), w * 0.58, depth - 1);
        if (r() > 0.4) branch(x1, y1, ang + (r() - 0.5) * 0.8, len * 0.48, w * 0.45, depth - 1);
      }
    };
    branch(196, GY + 6, -Math.PI / 2 + 0.06, 150, 16, 4);
    return B;
  })();

  const groundPath = () => poly([[-40, GY - 8], [560, GY - 2], [1200, GY + 4], [1960, GY - 6], [1960, 1100], [-40, 1100]]);

  const STEPS = (() => {
    const out = [];
    for (let i = 0; i < 12; i++) {
      const k = i / 11;
      out.push({ x: 236 + k * 900 + Math.sin(k * 5.1) * 12 + (i % 2 ? 26 : 0), y: 1048 - k * 108, s: 26 - k * 12, a: 0.26 - k * 0.12 });
    }
    return out;
  })();

  const FLAKES = (() => {
    const r = U.rng(991), out = [];
    for (let i = 0; i < 260; i++) out.push({ x: r() * W, y: r() * H, s: 0.9 + r() * 1.9, v: 22 + r() * 46, ph: r() * 6.28, a: 0.22 + r() * 0.36 });
    return out;
  })();

  // ---------- 人物：整块剪影（不拼零件，没有内部接缝） ----------
  function charFill(ctx, paths, tone) {
    ctx.save();
    ctx.globalAlpha = tone;
    ctx.fillStyle = `rgba(${INK},1)`;
    // 逐个填，不合成路径：同色重叠看不出来，也不会被 winding 挖洞
    paths.forEach(p => ctx.fill(p));
    ctx.restore();
    return paths;
  }
  function grain(ctx, paths, box) {
    // 剪影里压几道很淡的白垩排线，黑里透一点纸味
    ctx.save();
    const r = U.rng(2311 + Math.round(box[0]));
    ctx.strokeStyle = `rgba(${CHALK},0.7)`;
    for (let i = 0; i < 26; i++) {
      const y = box[1] + r() * box[3];
      const x = box[0] + r() * box[2];
      const len = box[2] * (0.10 + r() * 0.26);
      ctx.globalAlpha = 0.025 + r() * 0.035;
      ctx.lineWidth = 1 + r() * 2.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + len * 0.22);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 大衣行人：头+帽、长外套、两条腿、一条摆臂——只做剪影，靠外形说话
  function walker(ctx, o) {
    const { x, y, h, face = -1, phase = 0, tone = 0.96, skirt = false, hat = 'cap', bag = false, scarf = false, coatTo = 0.20 } = o;
    const sw = Math.sin(phase * Math.PI * 2);
    const hy = y - h * 0.885;
    const shY = y - h * 0.795, hipY = y - h * 0.475, hemY = y - h * coatTo;
    const hw = h * 0.052;                       // 半头宽
    const hr = h * 0.070;
    const paths = [];

    // 远腿（先画，被外套压住）
    const legFar = (dir, spread, bend) => {
      const hip = [x + face * spread * h * 0.045, hipY];
      const knee = [hip[0] + face * dir * h * 0.055, hipY + h * 0.185];
      const ankle = [knee[0] + face * (dir * 0.03 + bend) * h, y - h * 0.045];
      paths.push(RIG.taper(hip, knee, h * 0.062, h * 0.045, h * 0.004));
      paths.push(RIG.taper(knee, ankle, h * 0.045, h * 0.028, h * 0.002));
      // 鞋：前掌翘一点
      paths.push(RIG.smooth([[ankle[0] - h * 0.030, ankle[1]],
        [ankle[0] + face * h * 0.012, ankle[1] - h * 0.006],
        [ankle[0] + face * h * 0.070, y - h * 0.012],
        [ankle[0] + face * h * 0.062, y + h * 0.008],
        [ankle[0] - h * 0.028, y + h * 0.008]]));
    };
    legFar(-1, -1, -0.02 + sw * 0.02);
    legFar(1, 1, 0.02 - sw * 0.02);

    // 远侧手臂（露一小段）
    const shFar = [x + face * h * 0.115, shY + h * 0.012];
    const elFar = [shFar[0] + face * h * 0.020, shY + h * 0.16];
    const haFar = [elFar[0] + face * h * 0.010 - sw * h * 0.012, shY + h * 0.30];
    paths.push(RIG.taper(shFar, elFar, h * 0.058, h * 0.044, h * 0.004));
    paths.push(RIG.taper(elFar, haFar, h * 0.044, h * 0.030, h * 0.002));

    // 外套：肩宽、腰收、下摆放开
    if (skirt) {
      const hemW = h * 0.215;
      paths.push(RIG.smooth([
        [x + face * h * 0.085, shY - h * 0.008],
        [x + face * h * 0.128, shY + h * 0.055],
        [x + face * h * 0.098, hipY + h * 0.01],
        [x + face * hemW, y - h * 0.055],
        [x + face * (hemW + h * 0.012), y - h * 0.006 + sw * h * 0.004],
        [x - face * (hemW * 0.9), y - h * 0.004 - sw * h * 0.004],
        [x - face * (hemW * 0.94), y - h * 0.06],
        [x - face * h * 0.098, hipY + h * 0.012],
        [x - face * h * 0.132, shY + h * 0.05],
        [x - face * h * 0.092, shY - h * 0.010],
        [x - face * h * 0.030, shY - h * 0.036],
        [x + face * h * 0.026, shY - h * 0.036],
      ]));
    } else {
      paths.push(RIG.smooth([
        [x + face * h * 0.088, shY - h * 0.006],
        [x + face * h * 0.132, shY + h * 0.06],
        [x + face * h * 0.104, hipY - h * 0.02],
        [x + face * h * 0.112, hemY + h * 0.02],
        [x + face * h * 0.090, hemY - h * 0.004],
        [x - face * h * 0.098, hemY - h * 0.004],
        [x - face * h * 0.116, hemY + h * 0.03],
        [x - face * h * 0.104, hipY - h * 0.02],
        [x - face * h * 0.136, shY + h * 0.06],
        [x - face * h * 0.092, shY - h * 0.008],
        [x - face * h * 0.030, shY - h * 0.038],
        [x + face * h * 0.028, shY - h * 0.038],
      ]));
    }

    // 近侧手臂：贴着大衣，随步伐前后甩
    const shNear = [x - face * h * 0.118, shY + h * 0.014];
    const elNear = [shNear[0] - face * h * 0.008 - face * sw * h * 0.022, shY + h * 0.165];
    const haNear = [elNear[0] + face * sw * h * 0.028, shY + h * 0.31];
    paths.push(RIG.taper(shNear, elNear, h * 0.060, h * 0.046, h * 0.004));
    paths.push(RIG.taper(elNear, haNear, h * 0.046, h * 0.032, h * 0.002));

    // 脖子与头
    paths.push(RIG.taper([x - face * h * 0.018, shY - h * 0.028], [x - face * h * 0.006, hy + hr * 0.6], h * 0.048, h * 0.040, 0));
    paths.push((() => { const p2 = new Path2D(); p2.ellipse(x, hy, hw * 1.12, hr * 1.15, 0, 0, Math.PI * 2); return p2; })());

    // 帽
    if (hat === 'wide') {
      paths.push((() => { const p2 = new Path2D(); p2.ellipse(x + face * h * 0.004, hy - hr * 0.62, h * 0.098, h * 0.020, -0.05 * face, 0, Math.PI * 2); return p2; })());
      paths.push((() => { const p2 = new Path2D(); p2.ellipse(x + face * h * 0.004, hy - hr * 0.78, h * 0.056, h * 0.036, 0, 0, Math.PI * 2); return p2; })());
    } else {
      paths.push((() => { const p2 = new Path2D(); p2.ellipse(x + face * h * 0.002, hy - hr * 0.72, h * 0.062, h * 0.030, 0, 0, Math.PI * 2); return p2; })());
      paths.push((() => { const p2 = new Path2D(); p2.ellipse(x + face * h * 0.048, hy - hr * 0.44, h * 0.048, h * 0.013, 0.06 * face, 0, Math.PI * 2); return p2; })());
    }

    // 手提包
    if (bag) {
      const bx = x - face * h * 0.10, by = hy + h * 0.30;
      paths.push(RIG.smooth([[bx - h * 0.035, by], [bx + h * 0.030, by - h * 0.006], [bx + h * 0.034, by + h * 0.058], [bx - h * 0.032, by + h * 0.062]]));
    }

    const U2 = charFill(ctx, paths, tone);

    // 灯在左：给左缘一道白垩的边光
    ctx.save();
    ctx.globalAlpha = 0.85 * tone;
    ctx.strokeStyle = `rgba(${CHALK},0.20)`;
    ctx.lineWidth = h * 0.004;
    ctx.beginPath();
    ctx.moveTo(shNear[0] - face * h * 0.006, shNear[1]);
    ctx.lineTo(elNear[0] - face * h * 0.008, elNear[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - h * 0.136, shY + h * 0.02);
    ctx.lineTo(x - h * 0.128, shY + h * 0.09);
    ctx.stroke();
    // 帽檐受光
    ctx.strokeStyle = `rgba(${CHALK},0.22)`;
    ctx.lineWidth = h * 0.004;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.05, hy - hr * 0.72);
    ctx.lineTo(x + h * 0.04, hy - hr * 0.86);
    ctx.stroke();
    ctx.restore();

    if (scarf) {
      ctx.save();
      ctx.globalAlpha = 0.55 * tone;
      ctx.fillStyle = `rgba(${SAN},0.9)`;
      ctx.beginPath();
      ctx.ellipse(x + face * h * 0.004, shY - h * 0.022, h * 0.062, h * 0.026, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 小狗：侧身、四条腿、尾巴
  function dog(ctx, x, y, h, phase, tone = 0.94) {
    const sw = Math.sin(phase * Math.PI * 2);
    const paths = [];
    const bodyC = [x, y - h * 0.54];
    paths.push((() => { const p2 = new Path2D(); p2.ellipse(bodyC[0], bodyC[1], h * 0.295, h * 0.205, -0.04, 0, Math.PI * 2); return p2; })());
    paths.push((() => { const p2 = new Path2D(); p2.ellipse(bodyC[0] - h * 0.22, bodyC[1] + h * 0.02, h * 0.12, h * 0.14, 0.1, 0, Math.PI * 2); return p2; })());
    // 颈与头
    paths.push(RIG.taper([bodyC[0] + h * 0.20, bodyC[1] - h * 0.10], [bodyC[0] + h * 0.34, bodyC[1] - h * 0.20], h * 0.17, h * 0.14, 0));
    paths.push((() => { const p2 = new Path2D(); p2.ellipse(bodyC[0] + h * 0.40, bodyC[1] - h * 0.22, h * 0.115, h * 0.095, 0.1, 0, Math.PI * 2); return p2; })());
    // 口鼻
    paths.push(RIG.taper([bodyC[0] + h * 0.46, bodyC[1] - h * 0.24], [bodyC[0] + h * 0.58, bodyC[1] - h * 0.20], h * 0.075, h * 0.052, 0));
    // 耳朵
    paths.push(RIG.smooth([[bodyC[0] + h * 0.33, bodyC[1] - h * 0.30], [bodyC[0] + h * 0.36, bodyC[1] - h * 0.41], [bodyC[0] + h * 0.42, bodyC[1] - h * 0.30]]));
    // 四腿
    [[-0.19, 0.0, 0], [-0.10, 1.2, 0], [0.16, 0.6, 1], [0.24, 1.8, 1]].forEach(([lx, ph, near]) => {
      const hip = [bodyC[0] + h * lx, bodyC[1] + h * 0.07];
      const knee = [hip[0] + Math.sin(phase * Math.PI * 2 + ph) * h * 0.05, y - h * 0.27];
      const ank = [knee[0] + Math.sin(phase * Math.PI * 2 + ph) * h * 0.03, y - h * 0.05];
      paths.push(RIG.taper(hip, knee, h * 0.10, h * 0.075, 0.002));
      paths.push(RIG.taper(knee, ank, h * 0.075, h * 0.05, 0.002));
      paths.push((() => { const p2 = new Path2D(); p2.ellipse(ank[0] + h * 0.015, y - h * 0.018, h * 0.055, h * 0.022, 0, 0, Math.PI * 2); return p2; })());
    });
    // 尾巴
    const tSw = Math.sin(phase * Math.PI * 2 * 1.6) * h * 0.06;
    paths.push(RIG.taper([bodyC[0] - h * 0.28, bodyC[1] - h * 0.08], [bodyC[0] - h * 0.40, bodyC[1] - h * 0.34 + tSw], h * 0.075, h * 0.030, 0.004));
    charFill(ctx, paths, tone);
  }

  // 纸齿颗粒层：整张纸的粗糙感，算一次、缓存成离屏图，逐帧直接贴
  let PAPER_TOOTH = null;
  function paperTooth(W, H) {
    if (PAPER_TOOTH) return PAPER_TOOTH;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const r = U.rng(9301);
    // 细颗粒
    for (let i = 0; i < 9000; i++) {
      const x = r() * W, y = r() * H;
      const s = 1.0 + r() * 2.2;
      g.globalAlpha = 0.06 + r() * 0.14;
      g.fillStyle = r() > 0.32 ? `rgba(${INK},1)` : `rgba(${CHALK},1)`;
      g.fillRect(x, y, s, s);
    }
    // 纸纤维：短横丝
    for (let i = 0; i < 2600; i++) {
      const x = r() * W, y = r() * H, len = 6 + r() * 34;
      g.globalAlpha = 0.04 + r() * 0.07;
      g.strokeStyle = r() > 0.72 ? `rgba(${INK},1)` : `rgba(${CHALK},1)`;
      g.lineWidth = 0.6 + r() * 1.2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + len, y + (r() - 0.5) * 2.4);
      g.stroke();
    }
    // 成片的擦痕（炭粉被抹开的地方）
    for (let i = 0; i < 120; i++) {
      const x = r() * W, y = r() * H, len = 60 + r() * 300;
      g.globalAlpha = 0.02 + r() * 0.05;
      g.strokeStyle = `rgba(${INK},1)`;
      g.lineWidth = 6 + r() * 26;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + len, y + (r() - 0.5) * 18);
      g.stroke();
    }
    PAPER_TOOTH = c;
    return c;
  }

  window.SCENES.tanbi = {
    init: async () => {},
    draw(ctx, t) {
      U.paper(ctx, W, H, PAPER, 9, 1.0);
      const vg = ctx.createRadialGradient(W * 0.50, H * 0.40, 260, W * 0.5, H * 0.54, W * 0.9);
      vg.addColorStop(0, 'rgba(255,255,255,0.18)');
      vg.addColorStop(0.6, 'rgba(255,255,255,0.02)');
      vg.addColorStop(1, 'rgba(56,50,42,0.36)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      const sc = 1.010 + 0.040 * U.easeInOut(U.p(t, 0, 7));
      ctx.save();
      ctx.translate(1120, 560);
      ctx.scale(sc, sc);
      ctx.translate(-1120, -560);

      const sky = U.easeInOut(U.p(t, -1.5, 1.6));
      if (sky > 0) {
        ctx.save();
        ctx.globalAlpha = sky * 0.96;
        const g = ctx.createLinearGradient(0, -20, 0, GY + 10);
        g.addColorStop(0, `rgba(${INK},0.62)`);
        g.addColorStop(0.55, `rgba(${INK},0.38)`);
        g.addColorStop(1, `rgba(${INK},0.12)`);
        ctx.fillStyle = g;
        ctx.fillRect(-40, -40, W + 80, GY + 50);
        const r = U.rng(55);
        for (let i = 0; i < 40; i++) {
          const y = r() * GY * 0.92, len = 260 + r() * 620, x = r() * W - 120;
          charcoal(ctx, [[x, y], [x + len, y - 6 + r() * 10]], 1, 4 + r() * 9, 0.05 + r() * 0.10);
        }
        ctx.restore();
      }

      // 01b 底板擦痕：先擦纸，再落笔（人物身上不留横条）
      const rT = U.rng(7788);
      ctx.save();
      for (let i = 0; i < 42; i++) {
        const y = rT() * (GY - 40), x = rT() * W - 200, len = 200 + rT() * 520;
        ctx.globalAlpha = 0.020 + rT() * 0.030;
        ctx.strokeStyle = `rgba(${INK},1)`;
        ctx.lineWidth = 8 + rT() * 26;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y + (rT() - 0.5) * 22);
        ctx.stroke();
      }
      for (let i = 0; i < 22; i++) {
        const y = rT() * (GY + 40), x = rT() * W - 200, len = 140 + rT() * 420;
        ctx.globalAlpha = 0.024 + rT() * 0.03;
        ctx.strokeStyle = `rgba(${CHALK},1)`;
        ctx.lineWidth = 4 + rT() * 16;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y - (rT() - 0.5) * 16);
        ctx.stroke();
      }
      ctx.restore();

      HOUSES.forEach((h, i) => {
        const a = U.easeInOut(U.p(t, -1.1 + i * 0.06, 0.5));
        if (a <= 0) return;
        mass(ctx, box(h.x, h.top, h.w, GY - h.top), h.a * a);
        charcoal(ctx, [[h.x, h.top], [h.x + h.w, h.top]], U.clamp(a), 3, 0.5);
        mass(ctx, box(h.x - 4, h.top - 10, h.w + 8, 8), 0.34 * a, CHALK);
        // 墙面竖排线，让块面有纸纹
        for (let k = 0; k < 14; k++) {
          const x = h.x + (k + 0.5) * h.w / 14;
          charcoal(ctx, [[x, h.top + 16], [x + 2, GY - 8]], a, 2.0, 0.025 + (k % 3) * 0.012);
        }
        if (h.w > 260) mass(ctx, box(h.x + h.w * 0.18, h.top - 52, 44, 52), h.a * a);
      });

      WINS.forEach((w, i) => {
        const a = U.easeOut(U.p(t, -0.55 + i * 0.02, 0.36));
        if (a <= 0) return;
        if (w.door) { mass(ctx, box(w.x, w.y, w.w, w.h), 0.7 * a); return; }
        chalkFill(ctx, box(w.x, w.y, w.w, w.h), w.a * a * 0.92);
        ctx.save();
        ctx.globalAlpha = 0.42 * a;
        ctx.fillStyle = 'rgba(240,182,96,1)';
        ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
        ctx.restore();
        chalkStroke(ctx, [[w.x + w.w / 2, w.y], [w.x + w.w / 2, w.y + w.h]], a, 1.6, 0.30);
        chalkStroke(ctx, [[w.x, w.y + w.h * 0.55], [w.x + w.w, w.y + w.h * 0.55]], a, 1.6, 0.24);
      });

      const gp = U.easeInOut(U.p(t, -1.35, 0.9));
      if (gp > 0) {
        chalkFill(ctx, groundPath(), 0.34 * gp);
        ctx.save();
        ctx.fillStyle = 'rgba(126,140,158,1)';
        ctx.strokeStyle = 'rgba(118,132,152,1)';
        const sr = U.rng(6111);
        [[1180, 830, 540, 40], [520, 874, 430, 46], [1560, 902, 470, 38]].forEach(([x, y, w2, h2]) => {
          // 打底：几块半透明不规则块叠出影子，边缘不封死
          for (let k = 0; k < 5; k++) {
            const cx = x + (sr() - 0.5) * w2 * 0.55;
            const cy = y + (sr() - 0.5) * h2 * 0.5;
            const rw = w2 * (0.28 + sr() * 0.22), rh = h2 * (0.5 + sr() * 0.4);
            ctx.globalAlpha = (0.026 + sr() * 0.028) * gp;
            const n = 10, pts = [];
            for (let i = 0; i < n; i++) {
              const ang = i / n * Math.PI * 2;
              const rr = 0.72 + sr() * 0.34;
              pts.push([cx + Math.cos(ang) * rw * rr, cy + Math.sin(ang) * rh * rr * 0.62]);
            }
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.fill();
          }
          // 炭粉擦痕：一排短横线把影子"扫"出来
          ctx.lineCap = 'butt';
          for (let k = 0; k < 58; k++) {
            const cy = y + (sr() - 0.5) * h2 * 0.85;
            const cx = x + (sr() - 0.5) * w2 * 0.92;
            const len = 14 + sr() * 46;
            ctx.globalAlpha = (0.030 + sr() * 0.055) * gp;
            ctx.lineWidth = 2 + sr() * 5;
            ctx.beginPath();
            ctx.moveTo(cx - len / 2, cy);
            ctx.lineTo(cx + len / 2, cy + (sr() - 0.5) * 3);
            ctx.stroke();
          }
        });
        ctx.restore();
        charcoal(ctx, [[-40, GY + 2], [520, GY + 8], [1040, GY + 10], [1520, GY + 2], [1960, GY + 6]], U.clamp(gp), 3.4, 0.30);
      }

      const treeIn = U.easeInOut(U.p(t, -0.5, 1.15));
      TREE.forEach((b, i) => charcoal(ctx, b.pts, U.clamp(treeIn * 1.15 - i * 0.006), b.w, 0.62));

      // 头顶的电线（两根，微微下垂）＋线上的积雪
      const wireIn = U.easeInOut(U.p(t, -0.3, 0.95));
      if (wireIn > 0) {
        [[86, 40], [62, 34]].forEach(([y0, sag], wi) => {
          const pts = [];
          for (let i = 0; i <= 26; i++) {
            const k = i / 26;
            pts.push([-40 + k * (W + 80), y0 + Wi2(k) * sag]);
          }
          charcoal(ctx, pts, wireIn, 2.0, 0.42);
          // 线上的雪
          for (let i = 1; i < 20; i++) {
            const q = pts[Math.round(i / 20 * 26)];
            chalkFill(ctx, ell(q[0], q[1] - 2, 6, 2.2), 0.30 * wireIn);
          }
        });
      }

      const postIn = U.easeOut(U.p(t, -0.15, 0.55));
      if (postIn > 0) {
        charcoal(ctx, [[LAMP_X, LAMP_BOT], [LAMP_X + 2, (LAMP_BOT + LAMP_TOP) / 2], [LAMP_X, LAMP_TOP + 12]], postIn, 11, 0.9);
        mass(ctx, poly([[LAMP_X - 30, LAMP_BOT], [LAMP_X + 30, LAMP_BOT], [LAMP_X + 20, LAMP_BOT - 40], [LAMP_X - 20, LAMP_BOT - 40]]), 0.8 * postIn);
        const headIn = U.easeOut(U.p(t, 0.05, 0.4));
        mass(ctx, poly([[LAMP_X - 40, LAMP_TOP + 2], [LAMP_X - 22, LAMP_TOP - 40], [LAMP_X + 22, LAMP_TOP - 40], [LAMP_X + 40, LAMP_TOP + 2]]), 0.80 * headIn);
        charcoal(ctx, [[LAMP_X, LAMP_TOP - 76], [LAMP_X, LAMP_TOP - 40]], headIn, 5, 0.7);
        chalkStroke(ctx, [[LAMP_X - 30, LAMP_TOP + 0], [LAMP_X - 14, LAMP_TOP - 34]], headIn, 7, 0.4);
      }
      const glow = U.easeInOut(U.p(t, 0.2, 0.65));
      if (glow > 0) {
        const fl = 0.92 + 0.08 * Math.sin(t * 8.4) + 0.04 * Math.sin(t * 19.3);
        const g = ctx.createRadialGradient(LAMP_X, LAMP_TOP - 6, 4, LAMP_X, LAMP_TOP - 6, 300);
        g.addColorStop(0, `rgba(252,226,178,${0.84 * glow})`);
        g.addColorStop(0.16, `rgba(248,214,160,${0.38 * glow * fl})`);
        g.addColorStop(0.52, `rgba(242,206,152,${0.12 * glow})`);
        g.addColorStop(1, `rgba(${CHALK},0)`);
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(LAMP_X, LAMP_TOP - 6, 300, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // 光晕之后把灯罩压回实心：罩框 + 中间一块亮的玻璃 + 一根灯芯
        // 玻璃罩
        mass(ctx, poly([[LAMP_X - 38, LAMP_TOP + 4], [LAMP_X - 21, LAMP_TOP - 42], [LAMP_X + 21, LAMP_TOP - 42], [LAMP_X + 38, LAMP_TOP + 4]]), 0.95 * glow);
        chalkFill(ctx, poly([[LAMP_X - 30, LAMP_TOP + 1], [LAMP_X - 17, LAMP_TOP - 37], [LAMP_X + 17, LAMP_TOP - 37], [LAMP_X + 30, LAMP_TOP + 1]]), 0.66 * glow);
        // 灯芯与火苗
        ctx.save();
        ctx.globalAlpha = glow * 0.95;
        ctx.fillStyle = `rgba(255,196,120,1)`;
        ctx.beginPath();
        ctx.ellipse(LAMP_X, LAMP_TOP - 12, 5.5, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // 竖棂
        ctx.save();
        ctx.globalAlpha = glow * 0.75;
        ctx.strokeStyle = `rgba(${INK},0.50)`;
        ctx.lineWidth = 1.8;
        [-12, 0, 12].forEach(dx => {
          ctx.beginPath();
          ctx.moveTo(LAMP_X + dx * 0.72, LAMP_TOP - 36);
          ctx.lineTo(LAMP_X + dx, LAMP_TOP + 0);
          ctx.stroke();
        });
        ctx.restore();
        // 钟形罩顶
        mass(ctx, poly([[LAMP_X - 44, LAMP_TOP - 40], [LAMP_X + 44, LAMP_TOP - 40], [LAMP_X + 22, LAMP_TOP - 62], [LAMP_X - 22, LAMP_TOP - 62]]), 0.96 * glow);
        const dome = [];
        for (let i = 0; i <= 14; i++) {
          const a2 = Math.PI + (i / 14) * Math.PI;
          dome.push([LAMP_X + Math.cos(a2) * 22, LAMP_TOP - 62 + Math.sin(a2) * 14]);
        }
        mass(ctx, poly(dome), 0.96 * glow);
        // 顶针
        mass(ctx, poly([[LAMP_X - 5, LAMP_TOP - 62], [LAMP_X + 5, LAMP_TOP - 62], [LAMP_X + 3, LAMP_TOP - 82], [LAMP_X - 3, LAMP_TOP - 82]]), 0.96 * glow);
        chalkFill(ctx, box(LAMP_X - 44, LAMP_TOP - 41, 88, 3), 0.30 * glow);
        const g2 = ctx.createRadialGradient(LAMP_X, GY + 46, 4, LAMP_X, GY + 46, 250);
        g2.addColorStop(0, `rgba(${CHALK},${0.22 * glow})`);
        g2.addColorStop(1, `rgba(${CHALK},0)`);
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.ellipse(LAMP_X, GY + 46, 250, 50, 0, 0, Math.PI * 2);
        ctx.fill();

      }

      const benchIn = U.easeInOut(U.p(t, 0.55, 0.75));
      if (benchIn > 0) {
        const bx = 668, bw = 286, by = 652, a = 0.86 * benchIn;
        mass(ctx, box(bx, by, bw, 15), a);
        mass(ctx, box(bx, by + 40, bw, 12), a * 0.92);
        mass(ctx, box(bx - 10, by + 92, bw + 20, 17), a);
        charcoal(ctx, [[bx + 6, by + 100], [bx + 8, by + 168]], benchIn, 9, 0.92);
        charcoal(ctx, [[bx + bw, by + 100], [bx + bw - 4, by + 168]], benchIn, 9, 0.92);
        charcoal(ctx, [[bx + 16, by + 12], [bx + 14, by + 92]], benchIn, 5, 0.7);
        charcoal(ctx, [[bx + bw - 14, by + 12], [bx + bw - 16, by + 92]], benchIn, 5, 0.7);
        chalkFill(ctx, box(bx - 8, by + 86, bw + 16, 8), 0.44 * benchIn);
        chalkFill(ctx, box(bx - 2, by - 6, bw + 4, 7), 0.40 * benchIn);
      }

      const mboxIn = U.easeInOut(U.p(t, 0.85, 0.55));
      if (mboxIn > 0) {
        const mx = 1758, my = GY + 8;
        mass(ctx, poly([[mx - 40, my - 132], [mx + 40, my - 132], [mx + 40, my - 44], [mx + 26, my - 26], [mx - 26, my - 26], [mx - 40, my - 44]]), 0.86 * mboxIn);
        // 顶盖与投信口
        mass(ctx, poly([[mx - 48, my - 132], [mx + 48, my - 132], [mx + 34, my - 152], [mx - 34, my - 152]]), 0.9 * mboxIn);
        chalkFill(ctx, box(mx - 26, my - 118, 52, 6), 0.42 * mboxIn);
        charcoal(ctx, [[mx - 30, my - 26], [mx - 30, my + 4]], mboxIn, 8, 0.7);
        charcoal(ctx, [[mx + 30, my - 26], [mx + 30, my + 4]], mboxIn, 8, 0.7);
        chalkFill(ctx, box(mx - 44, my - 158, 92, 7), 0.34 * mboxIn);
      }

      const manX = 1152 + 24 * U.easeInOut(U.p(t, 3.1, 3.9));
      const manIn = U.easeOut(U.p(t, 1.25, 0.5));
      if (manIn > 0) {
        const g = ctx.createRadialGradient(manX, GY + 206, 4, manX, GY + 206, 130);
        g.addColorStop(0, `rgba(${INK},${0.32 * manIn})`);
        g.addColorStop(1, `rgba(${INK},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(manX, GY + 206, 130, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        walker(ctx, { x: manX, y: GY + 206, h: 566, phase: t * 0.95, tone: 1.0 * manIn, hat: 'cap', coatTo: 0.185 });
      }

      const womX = 1298 + 20 * U.easeInOut(U.p(t, 3.6, 3.4));
      const womIn = U.easeOut(U.p(t, 1.6, 0.5));
      if (womIn > 0) {
        const g = ctx.createRadialGradient(womX, GY + 210, 4, womX, GY + 210, 104);
        g.addColorStop(0, `rgba(${INK},${0.28 * womIn})`);
        g.addColorStop(1, `rgba(${INK},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(womX, GY + 210, 104, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        walker(ctx, { x: womX, y: GY + 210, h: 528, phase: t * 0.95 + 0.44, tone: 1.0 * womIn, skirt: true, hat: 'wide', bag: true, scarf: true, coatTo: 0.16 });
      }

      const umbIn = U.easeInOut(U.p(t, 2.05, 0.6));
      if (umbIn > 0) {
        const cx = manX + 74, cy = 330, R = 206;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0.09 + 0.025 * Math.sin(t * 1.5));
        const canopy = new Path2D();
        canopy.moveTo(-R, 4);
        canopy.quadraticCurveTo(-R * 0.55, -R * 0.88, 0, -R * 0.96);
        canopy.quadraticCurveTo(R * 0.55, -R * 0.88, R, 4);
        canopy.quadraticCurveTo(0, R * 0.26, -R, 4);
        canopy.closePath();
        ctx.globalAlpha = 0.94 * umbIn;
        ctx.fillStyle = `rgba(${INK},1)`;
        ctx.fill(canopy);
        ctx.save();
        ctx.clip(canopy);
        ctx.globalAlpha = 0.26 * umbIn;
        ctx.strokeStyle = `rgba(${CHALK},1)`;
        ctx.lineWidth = 1.5;
        for (let i = -3; i <= 3; i++) {
          const k = i / 3;
          ctx.beginPath();
          ctx.moveTo(0, -R * 0.94);
          ctx.quadraticCurveTo(k * R * 0.5, -R * 0.50, k * R, 6);
          ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 0.66 * umbIn;
        ctx.fillStyle = `rgba(${CHALK},1)`;
        ctx.beginPath();
        ctx.ellipse(0, 2, R * 0.96, 5, 0, 0, Math.PI);
        ctx.fill();
        ctx.globalAlpha = 0.9 * umbIn;
        ctx.strokeStyle = `rgba(${INK},0.92)`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(4, 120);
        ctx.stroke();
        ctx.restore();
      }

      const dogIn = U.easeOut(U.p(t, 2.45, 0.55));
      if (dogIn > 0) {
        const dx = 1512 + 20 * U.easeInOut(U.p(t, 4.55, 2.45));
        const dy = GY + 210;
        ctx.save();
        ctx.globalAlpha = dogIn;
        dog(ctx, dx, dy, 212, t * 1.9, 1.0);
        // 绳子：从女人手到狗颈
        ctx.globalAlpha = dogIn * 0.85;
        charcoal(ctx, [[womX - 30, GY + 168], [womX - 84, GY + 198], [dx + 24, dy - 148]], 1, 2.0, 0.5);
        ctx.restore();
      }

      // 雪地底纹：一开场就把地面"扫"出排线与擦痕，别留白纸
      const base = U.easeInOut(U.p(t, -1.15, 1.3));
      if (base > 0) {
        const r0 = U.rng(3312);
        for (let i = 0; i < 170; i++) {
          const y = GY + 16 + Math.pow(r0(), 0.66) * 390;
          const len = 30 + r0() * 130;
          const x = r0() * (W - len);
          charcoal(ctx, [[x, y], [x + len, y - 4 + r0() * 10]], 1, 1.0 + r0() * 2.4, (0.055 + r0() * 0.115) * base);
        }
        // 远去的一串脚印
        for (let i = 0; i < 34; i++) {
          const k = i / 34;
          const side = i % 2 ? 1 : -1;
          const x = 190 + k * 640 + Math.sin(i * 0.7) * 9 + side * (5 - k * 3);
          const y = GY + 296 - k * 206 + side * 6;
          const sc = 13 - k * 6;
          ctx.save();
          ctx.globalAlpha = (0.13 - k * 0.06) * base;
          ctx.fillStyle = `rgba(${INK},1)`;
          ctx.beginPath();
          ctx.ellipse(x, y, sc, sc * 0.44, 0.24 + k + side * 0.1, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        // 灯柱脚下的一圈雪堆
        chalkFill(ctx, ell(LAMP_X - 2, LAMP_BOT + 1, 34, 9, 0), 0.16 * base);
      }

      const hatchIn2 = U.easeInOut(U.p(t, 3.0, 0.9));
      if (hatchIn2 > 0) {
        const r = U.rng(661);
        for (let i = 0; i < 280; i++) {
          const y = GY + 22 + Math.pow(r(), 0.72) * 350;
          const len = 40 + r() * 160;
          const x = r() * (W - len);
          charcoal(ctx, [[x, y], [x + len, y - 5 + r() * 12]], 1, 1.4 + r() * 3.0, (0.05 + r() * 0.13) * hatchIn2);
        }
        [[manX, 130], [womX, 100], [1520, 80]].forEach(([x, rx]) => {
          const g = ctx.createRadialGradient(x, GY + 208, 4, x, GY + 208, rx);
          g.addColorStop(0, `rgba(${INK},${0.24 * hatchIn2})`);
          g.addColorStop(1, `rgba(${INK},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(x, GY + 208, rx, 20, 0, 0, Math.PI * 2);
          ctx.fill();
        });
        STEPS.forEach(s => {
          const a = hatchIn2 * s.a;
          if (a <= 0) return;
          mass(ctx, ell(s.x, s.y, s.s, s.s * 0.5, 0), a * 0.55);
          mass(ctx, ell(s.x + s.s * 0.78, s.y - 5, s.s * 0.36, s.s * 0.30, 0), a * 0.5);
        });
      }

      const lift = U.easeInOut(U.p(t, 3.5, 0.8));
      if (lift > 0) {
        chalkStroke(ctx, [[LAMP_X + 7, LAMP_BOT - 24], [LAMP_X + 7, LAMP_TOP + 56]], lift, 3.4, 0.46);
        chalkStroke(ctx, [[1790, 690], [1866, 570]], lift, 4, 0.34);
      }

      const again = U.easeInOut(U.p(t, 4.0, 0.6));
      if (again > 0) {
        charcoal(ctx, [[LAMP_X, LAMP_BOT], [LAMP_X + 1, LAMP_TOP + 24]], again, 3.4, 0.5);
        charcoal(ctx, [[660, 746], [950, 748]], again, 3, 0.4);
        ctx.save();
        ctx.globalAlpha = 0.5 * again;
        ctx.fillStyle = `rgba(${SAN},0.9)`;
        ctx.beginPath();
        ctx.ellipse(LAMP_X, LAMP_TOP + 8, 15, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const dust = U.easeOut(U.p(t, 4.3, 0.65));
      if (dust > 0) {
        const r = U.rng(1234);
        ctx.save();
        ctx.globalAlpha = 0.36 * dust;
        ctx.fillStyle = `rgba(${INK},1)`;
        for (let i = 0; i < 420; i++) {
          const x = r() * W, y = H * 0.56 + r() * H * 0.44;
          const s = 0.6 + r() * 1.7;
          ctx.fillRect(x, y, s, s);
        }
        ctx.restore();
      }

      const snowA = 0.4 + 0.45 * U.easeOut(U.p(t, -0.4, 1.1));
      ctx.save();
      for (const f of FLAKES) {
        const yy = (f.y + t * f.v) % (H + 40) - 20;
        const xx = (f.x + Math.sin(t * 0.8 + f.ph) * 24 + t * 7 + W) % W;
        ctx.globalAlpha = f.a * snowA;
        ctx.fillStyle = `rgba(${CHALK},1)`;
        ctx.beginPath();
        ctx.arc(xx, yy, f.s, 0, Math.PI * 2);
        ctx.fill();
      }
      // 16b 纸齿颗粒
      if (dust > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5 * dust;
        ctx.drawImage(paperTooth(W, H), 0, 0);
        ctx.restore();
      }

      // 17 暗角
      const tooth = U.rng(5150);
      ctx.save();
      for (let i = 0; i < 1500; i++) {
        const x = tooth() * W, y = tooth() * H;
        ctx.globalAlpha = 0.02 + tooth() * 0.05;
        ctx.fillStyle = tooth() > 0.55 ? `rgba(${INK},1)` : `rgba(${CHALK},1)`;
        const s3 = 0.8 + tooth() * 1.9;
        ctx.fillRect(x, y, s3, s3);
      }
      ctx.restore();
      const vg2 = ctx.createRadialGradient(W * 0.5, H * 0.48, H * 0.42, W * 0.5, H * 0.5, W * 0.78);
      vg2.addColorStop(0, 'rgba(0,0,0,0)');
      vg2.addColorStop(1, 'rgba(26,22,18,0.40)');
      ctx.fillStyle = vg2;
      ctx.fillRect(0, 0, W, H);

      ctx.restore();
    },
  };
})();
