// 铅黄剪影 · qianhuang2 —— cast：骨架姿势库与三种人形（她 / 男人 / 倒地者）
// 坐标全以身高 h 为单位（脚底 y=0，头顶 y≈-0.96h）；STAGE_Y / HEAD_Y 是整条线的构图硬规。

  function lying(x, base, h, rim) {
    const B = base;
    ctx.save();
    if (rim) { ctx.shadowColor = rim; ctx.shadowBlur = 10; ctx.shadowOffsetX = -5; }
    ctx.fillStyle = '#060608';

    // 躯干：侧卧，肩高脚低，背脊微凹
    ctx.beginPath();
    ctx.moveTo(x + h * 0.255, B - h * 0.108);
    ctx.quadraticCurveTo(x + h * 0.100, B - h * 0.150, x - h * 0.075, B - h * 0.132);
    ctx.quadraticCurveTo(x - h * 0.235, B - h * 0.116, x - h * 0.315, B - h * 0.074);
    ctx.lineTo(x - h * 0.335, B - h * 0.008);
    ctx.quadraticCurveTo(x - h * 0.180, B + h * 0.014, x - h * 0.010, B + h * 0.006);
    ctx.quadraticCurveTo(x + h * 0.150, B - h * 0.004, x + h * 0.222, B - h * 0.040);
    ctx.closePath(); ctx.fill();

    // 颈与头（略抬，带下颌）
    ctx.beginPath();
    ctx.moveTo(x + h * 0.245, B - h * 0.118);
    ctx.quadraticCurveTo(x + h * 0.285, B - h * 0.140, x + h * 0.318, B - h * 0.152);
    ctx.lineTo(x + h * 0.330, B - h * 0.098);
    ctx.quadraticCurveTo(x + h * 0.285, B - h * 0.078, x + h * 0.238, B - h * 0.070);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + h * 0.383, B - h * 0.163, h * 0.068, h * 0.058, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + h * 0.345, B - h * 0.128);
    ctx.quadraticCurveTo(x + h * 0.372, B - h * 0.116, x + h * 0.318, B - h * 0.104);
    ctx.closePath(); ctx.fill();

    // 前伸的手臂 + 手
    ctx.beginPath();
    ctx.moveTo(x + h * 0.205, B - h * 0.096);
    ctx.quadraticCurveTo(x + h * 0.070, B - h * 0.072, x - h * 0.055, B - h * 0.040);
    ctx.lineTo(x - h * 0.090, B - h * 0.012);
    ctx.quadraticCurveTo(x + h * 0.040, B + h * 0.004, x + h * 0.150, B - h * 0.030);
    ctx.lineTo(x + h * 0.198, B - h * 0.056);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - h * 0.072, B - h * 0.020, h * 0.030, h * 0.016, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 屈起的腿：膝高抬，小腿落回地面
    ctx.beginPath();
    ctx.moveTo(x - h * 0.300, B - h * 0.086);
    ctx.quadraticCurveTo(x - h * 0.420, B - h * 0.115, x - h * 0.500, B - h * 0.070);
    ctx.lineTo(x - h * 0.512, B - h * 0.020);
    ctx.quadraticCurveTo(x - h * 0.452, B - h * 0.028, x - h * 0.362, B + h * 0.004);
    ctx.lineTo(x - h * 0.300, B + h * 0.006);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - h * 0.360, B + h * 0.004);
    ctx.lineTo(x - h * 0.418, B - h * 0.004);
    ctx.lineTo(x - h * 0.402, B + h * 0.018);
    ctx.closePath(); ctx.fill();

    // 平放的腿
    ctx.beginPath();
    ctx.moveTo(x - h * 0.330, B - h * 0.020);
    ctx.lineTo(x - h * 0.560, B + h * 0.004);
    ctx.lineTo(x - h * 0.560, B + h * 0.026);
    ctx.quadraticCurveTo(x - h * 0.430, B + h * 0.030, x - h * 0.320, B + h * 0.014);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    if (rim) {
      // 顶缘细轮廓光，不用一团模糊
      ctx.save();
      ctx.strokeStyle = 'rgba(52,158,148,0.42)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x + h * 0.318, B - h * 0.152);
      ctx.quadraticCurveTo(x + h * 0.250, B - h * 0.130, x + h * 0.205, B - h * 0.112);
      ctx.quadraticCurveTo(x + h * 0.095, B - h * 0.088, x - h * 0.030, B - h * 0.062);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(180,32,34,0.26)';
      ctx.beginPath();
      ctx.moveTo(x - h * 0.300, B - h * 0.088);
      ctx.quadraticCurveTo(x - h * 0.420, B - h * 0.116, x - h * 0.502, B - h * 0.072);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 男人：同一套"偏移描边"做法，不再用 shadowBlur 糊一圈青光
  function figureBody(h) {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * h * 0.050, -h * 0.008, h * 0.044, h * 0.015, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(s * h * 0.020, -h * 0.014);
      ctx.quadraticCurveTo(s * h * 0.014, -h * 0.120, s * h * 0.028, -h * 0.205);
      ctx.lineTo(s * h * 0.036, -h * 0.238);
      ctx.lineTo(s * h * 0.070, -h * 0.250);
      ctx.lineTo(s * h * 0.072, -h * 0.014);
      ctx.closePath(); ctx.fill();

      ctx.beginPath();
      ctx.moveTo(s * h * 0.034, -h * 0.228);
      ctx.lineTo(s * h * 0.068, -h * 0.246);
      ctx.quadraticCurveTo(s * h * 0.092, -h * 0.340, s * h * 0.088, -h * 0.470);
      ctx.lineTo(s * h * 0.002, -h * 0.470);
      ctx.quadraticCurveTo(s * h * 0.004, -h * 0.330, s * h * 0.034, -h * 0.228);
      ctx.closePath(); ctx.fill();

      ctx.beginPath();
      ctx.moveTo(s * h * 0.112, -h * 0.805);
      ctx.quadraticCurveTo(s * h * 0.148, -h * 0.700, s * h * 0.138, -h * 0.612);
      ctx.lineTo(s * h * 0.130, -h * 0.462);
      ctx.lineTo(s * h * 0.104, -h * 0.466);
      ctx.quadraticCurveTo(s * h * 0.110, -h * 0.642, s * h * 0.092, -h * 0.800);
      ctx.closePath(); ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(-h * 0.086, -h * 0.456);
    ctx.quadraticCurveTo(-h * 0.072, -h * 0.600, -h * 0.083, -h * 0.735);
    ctx.quadraticCurveTo(-h * 0.112, -h * 0.772, -h * 0.119, -h * 0.812);
    ctx.quadraticCurveTo(-h * 0.058, -h * 0.858, 0, -h * 0.860);
    ctx.quadraticCurveTo(h * 0.058, -h * 0.858, h * 0.119, -h * 0.812);
    ctx.quadraticCurveTo(h * 0.112, -h * 0.772, h * 0.083, -h * 0.735);
    ctx.quadraticCurveTo(h * 0.072, -h * 0.600, h * 0.086, -h * 0.456);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-h * 0.028, -h * 0.856); ctx.lineTo(-h * 0.024, -h * 0.888);
    ctx.lineTo(h * 0.024, -h * 0.888); ctx.lineTo(h * 0.028, -h * 0.856);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, -h * 0.922, h * 0.055, h * 0.066, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-h * 0.038, -h * 0.906);
    ctx.quadraticCurveTo(-h * 0.026, -h * 0.872, 0, -h * 0.868);
    ctx.quadraticCurveTo(h * 0.026, -h * 0.872, h * 0.038, -h * 0.906);
    ctx.closePath(); ctx.fill();
  }

  function figure(x, base, h, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, base);
    if (o.rot) ctx.rotate(o.rot);
    const dx = h * 0.005;
    if (o.rim) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(-dx, 0);
      ctx.globalAlpha = 0.26; ctx.fillStyle = '#0F6F63';
      figureBody(h);
      ctx.translate(dx * 2.0, 0);
      ctx.globalAlpha = 0.17; ctx.fillStyle = '#B3121F';
      figureBody(h);
      ctx.restore();
    }
    ctx.fillStyle = o.fill || '#070709';
    figureBody(h);
    ctx.restore();
  }

  // 铅黄片里的“那个女人”：同一身形、同一条迷你裙、同一条血红腰带，两段呼应
  // ---------- 人物：骨架 + 姿势插值（P1） ----------
  // 所有坐标以 h 为单位的局部坐标，脚底在 y=0，头顶在 y≈-0.96h
  const POSES = {
    back: {
      spine: 0.000, hip: 0.000, headYaw: 0.00, headTilt: 0.04, hem: 0.000, wScale: 1.00,
      armL: { elbow: [-0.106, -0.654], hand: [-0.100, -0.522] },
      armR: { elbow: [0.118, -0.660], hand: [0.066, -0.508] },
      legL: { knee: [0.042, -0.252], ankle: [0.048, -0.006] },
      legR: { knee: [-0.006, -0.242], ankle: [-0.036, -0.020] }
    },
    glance: {
      spine: -0.032, hip: 0.014, headYaw: 0.36, headTilt: 0.08, hem: -0.010, wScale: 0.80,
      armL: { elbow: [-0.136, -0.724], hand: [-0.082, -0.844] },
      armR: { elbow: [0.104, -0.656], hand: [0.060, -0.506] },
      legL: { knee: [0.040, -0.250], ankle: [0.046, -0.006] },
      legR: { knee: [-0.010, -0.240], ankle: [-0.038, -0.020] }
    }
  };

  function lerpVal(a, b, m) {
    if (typeof a === 'number') return a + (b - a) * m;
    if (Array.isArray(a)) return a.map((v, i) => lerpVal(v, b[i], m));
    const o = {};
    for (const k in a) o[k] = lerpVal(a[k], b[k], m);
    return o;
  }
  function mixPose(a, b, m) { return lerpVal(a, b, m); }

  function smoothPath(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }

  // 一次完整绘制（供黑版与两侧缘光共用同一轮廓）
  function womanBody(h, p, t, drawBelt) {
    const sp = p.spine + Math.sin(t * 0.80) * 0.005;
    const px = p.hip * h, py = -0.500 * h;
    const ux = Math.sin(sp), uy = -Math.cos(sp);
    const nx = Math.cos(sp), ny = Math.sin(sp);
    const ws = p.wScale === undefined ? 1 : p.wScale;
    const P = (f, w) => [px + (ux * f + nx * w * ws) * h, py + (uy * f + ny * w * ws) * h];
    const sway = Math.sin(t * 0.92) * 0.004 * h;
    const hy = (p.headYawLag === undefined ? p.headYaw : p.headYawLag);
    const hairS = Math.sin(t * 1.25 + 1.1) * 0.005 * h - hy * 0.045 * h;
    const hemX = p.hip * h + (p.hem + Math.sin(t * 0.78) * 0.003) * h;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 头心
    const neck = P(0.355, 0);
    const hcx = neck[0] + ux * 0.058 * h + p.headYaw * 0.030 * h;
    const hcy = neck[1] + uy * 0.058 * h;

    // 头发（后层）：两束，随呼吸与回头摆；回头时整束后撤，露出脖颈
    ctx.beginPath();
    ctx.moveTo(hcx + 0.004 * h, hcy - 0.052 * h);
    ctx.bezierCurveTo(hcx - 0.070 * h + hairS, hcy - 0.030 * h, hcx - 0.088 * h + hairS, hcy + 0.078 * h, hcx - 0.066 * h + hairS, hcy + 0.146 * h);
    ctx.bezierCurveTo(hcx - 0.076 * h + hairS, hcy + 0.196 * h, hcx - 0.048 * h + hairS * 0.6, hcy + 0.238 * h, hcx - 0.018 * h, hcy + 0.240 * h);
    ctx.bezierCurveTo(hcx - 0.038 * h + hairS * 0.5, hcy + 0.178 * h, hcx - 0.030 * h, hcy + 0.088 * h, hcx - 0.006 * h, hcy + 0.016 * h);
    ctx.closePath(); ctx.fill();

    ctx.beginPath();
    ctx.moveTo(hcx + 0.012 * h + hairS * 0.4, hcy - 0.044 * h);
    ctx.bezierCurveTo(hcx + 0.056 * h + hairS, hcy - 0.032 * h, hcx + 0.066 * h + hairS * 0.6, hcy + 0.020 * h, hcx + 0.040 * h + hairS * 0.4, hcy + 0.056 * h);
    ctx.bezierCurveTo(hcx + 0.034 * h, hcy + 0.014 * h, hcx + 0.024 * h, hcy - 0.010 * h, hcx + 0.006 * h, hcy - 0.018 * h);
    ctx.closePath(); ctx.fill();

    // 腿（先画，裙摆压在上面）：大腿粗、小腿细，重心压一条腿，另一条屈膝提踵
    for (const leg of [p.legL, p.legR]) {
      const hipJ = [px + (leg === p.legL ? 0.036 : -0.036) * ws * h, -0.498 * h];
      const kx = leg.knee[0] * h, ky = leg.knee[1] * h;
      const axx = leg.ankle[0] * h, ayy = leg.ankle[1] * h;
      ctx.lineWidth = 0.030 * h;
      ctx.beginPath();
      ctx.moveTo(hipJ[0], hipJ[1]);
      ctx.quadraticCurveTo((hipJ[0] + kx) / 2 + (kx - hipJ[0]) * 0.10, hipJ[1] + (ky - hipJ[1]) * 0.55, kx, ky);
      ctx.stroke();
      ctx.lineWidth = 0.020 * h;
      ctx.beginPath();
      ctx.moveTo(kx, ky);
      ctx.quadraticCurveTo(kx + (axx - kx) * 0.35, ky + (ayy - ky) * 0.45, axx, ayy);
      ctx.stroke();
      // 脚 + 细高跟
      ctx.beginPath();
      ctx.ellipse(axx + 0.016 * h, ayy + 0.012 * h, 0.026 * h, 0.010 * h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(axx - 0.004 * h, ayy + 0.010 * h);
      ctx.lineTo(axx - 0.012 * h, ayy - 0.014 * h);
      ctx.lineTo(axx - 0.004 * h, ayy - 0.012 * h);
      ctx.closePath(); ctx.fill();
    }

    // 躯干 + 裙摆：一条闭合轮廓
    const hf = 0.55 + 0.45 * ws;
    const torso = [
      P(0.000, -0.074), P(0.170, -0.036), P(0.270, -0.060), P(0.310, -0.076),
      P(0.345, -0.022), P(0.352, 0.000), P(0.345, 0.022),
      P(0.310, 0.076), P(0.270, 0.060), P(0.170, 0.036), P(0.000, 0.074),
      [hemX + 0.104 * hf * h, -0.384 * h],
      [hemX + 0.040 * hf * h, -0.374 * h],
      [hemX - 0.024 * hf * h, -0.372 * h],
      [hemX - 0.100 * hf * h, -0.380 * h]
    ];
    smoothPath(torso);
    ctx.closePath();
    ctx.fill();

    // 脖子
    ctx.beginPath();
    ctx.moveTo(P(0.330, -0.022)[0], P(0.330, -0.022)[1]);
    ctx.lineTo(hcx - 0.016 * h, hcy + 0.030 * h);
    ctx.lineTo(hcx + 0.018 * h, hcy + 0.030 * h);
    ctx.lineTo(P(0.330, 0.022)[0], P(0.330, 0.022)[1]);
    ctx.closePath(); ctx.fill();

    // 头：椭圆底 + 随回头程度渐显的侧脸轮廓（k=0 时完全藏在椭圆里）
    ctx.beginPath();
    ctx.ellipse(hcx, hcy, 0.038 * h, 0.050 * h, p.headTilt, 0, Math.PI * 2);
    ctx.fill();
    // 回头时脸侧吃一道月白边：剪影里唯一能读出"脸转过去了"的信号
    if (p.headYaw > 0.04) {
      const ka = Math.min(1, p.headYaw / 0.36);
      ctx.save();
      ctx.strokeStyle = `rgba(239,227,200,${0.17 * ka})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(hcx, hcy, 0.038 * h, 0.050 * h, p.headTilt, -0.85, 0.80);
      ctx.stroke();
      ctx.restore();
    }
    const kProfile = 0;
    if (false) {
      ctx.beginPath();
      ctx.ellipse(hcx + p.headYaw * 0.030 * h, hcy + 0.034 * h, 0.017 * h, 0.018 * h, p.headTilt, 0, Math.PI * 2);
      ctx.fill();
    }

    // 手臂
    const drawArm = (side, a) => {
      const sh = P(0.310, side * 0.068);
      ctx.lineWidth = 0.023 * h;
      ctx.beginPath();
      ctx.moveTo(sh[0], sh[1]);
      ctx.quadraticCurveTo((sh[0] + a.elbow[0] * h) / 2 + side * 0.010 * h, (sh[1] + a.elbow[1] * h) / 2, a.elbow[0] * h, a.elbow[1] * h);
      ctx.stroke();
      ctx.lineWidth = 0.019 * h;
      ctx.beginPath();
      ctx.moveTo(a.elbow[0] * h, a.elbow[1] * h);
      ctx.quadraticCurveTo((a.elbow[0] + a.hand[0]) / 2 * h, (a.elbow[1] + a.hand[1]) / 2 * h, a.hand[0] * h, a.hand[1] * h);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(a.hand[0] * h, a.hand[1] * h, 0.014 * h, 0.010 * h, 0.5, 0, Math.PI * 2);
      ctx.fill();
    };
    drawArm(-1, p.armL);
    drawArm(1, p.armR);

    // 血红腰带：两段之间唯一的红记号
    if (drawBelt) {
      ctx.fillStyle = 'rgba(179,18,31,0.58)';
      const bw = 0.036;
      ctx.beginPath();
      ctx.moveTo(P(0.160, -bw)[0], P(0.160, -bw)[1]);
      ctx.quadraticCurveTo(px, P(0.160, 0)[1] + 0.004 * h, P(0.160, bw)[0], P(0.160, bw)[1]);
      ctx.lineTo(P(0.186, bw * 0.95)[0], P(0.186, bw * 0.95)[1]);
      ctx.quadraticCurveTo(px, P(0.186, 0)[1] - 0.002 * h, P(0.186, -bw * 0.95)[0], P(0.186, -bw * 0.95)[1]);
      ctx.closePath(); ctx.fill();
    }
  }

  function woman(x, base, h, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, base);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(o.flip ? -1 : 1, 1);
    const t = o.t || 0;
    const p = typeof o.pose === 'string' ? (POSES[o.pose] || POSES.back) : (o.pose || POSES.back);
    const dx = h * 0.0042;

    // 落地：两只脚各一枚接触影，脚跟另点一点，免得人像浮在光池上
    for (const leg of [p.legL, p.legR]) {
      const axx = leg.ankle[0] * h, ayy = leg.ankle[1] * h;
      ctx.save();
      ctx.fillStyle = 'rgba(1,3,3,0.52)';
      ctx.beginPath();
      ctx.ellipse(axx + 0.014 * h, ayy + 0.011 * h, 0.038 * h, 0.009 * h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(1,3,3,0.34)';
      ctx.beginPath();
      ctx.ellipse(axx - 0.008 * h, ayy - 0.012 * h, 0.010 * h, 0.014 * h, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 双缘光：整副轮廓偏移一层，左冷青右血红，天然贴着姿势走
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#0F6F63'; ctx.strokeStyle = '#0F6F63';
    ctx.globalAlpha = 0.30;
    ctx.translate(-dx, 0);
    womanBody(h, p, t, false);
    ctx.fillStyle = '#B3121F'; ctx.strokeStyle = '#B3121F';
    ctx.globalAlpha = 0.24;
    ctx.translate(dx * 2.1, 0);
    womanBody(h, p, t, false);
    ctx.restore();

    // 黑身
    ctx.fillStyle = '#05060A'; ctx.strokeStyle = '#05060A';
    womanBody(h, p, t, o.belt !== false);
    ctx.restore();
  }

  // 舞台线（固化）：所有出场人物脚底压在 STAGE_Y，头顶落在 HEAD_Y 附近（画面中线）
  const STAGE_Y = 872;
  const HEAD_Y = 540;
