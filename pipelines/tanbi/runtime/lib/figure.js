// 通用人物骨架（写实比例 ~7.4 头身）：站、走、跑、坐、倚、伸手。
// 只负责几何与服装块面，不负责画法：时代代码拿到 parts / J 之后自己上色、描线、切面或笔触重画。
// 坐标：x = 脚底中心，y = 地面线，h = 全身高（px），face = 1 朝右 / -1 朝左。
// 角度：所有肢体角以「竖直向下」为 0，正角向面朝方向（前）摆。
// build(o) → { parts, J, h, box }
//   o: lean 上身前后倾、head 头俯仰、bob 整体上下、hipUp 坐姿抬髋、thighL/R、shinL/R、footL/R、
//      uaL/R、faL/R（臂角），或 handL/R: [x,y] 绝对目标点（IK），elbowL/R: 1/-1（肘往哪弯）
//      bottom: 'trousers'|'skirt'|'dress'|null, top: 'shirt'|'coat'|'jacket'|null, sleeve: true,
//      hair: 'short'|'bob'|'long'|'bun'|'braid'|null, hat: 'straw'|'boater'|'bowler'|'cap'|'wide'|null, sway
(() => {
const F = window.FIG = {};
const S = (pts, closed = true) => Object.assign(RIG.smooth(pts, closed), { pts, closed });

F.build = (o = {}) => {
  const h = o.h || 400, x = o.x || 0, y = o.y || 0, face = o.face || 1;
  const lean = o.lean || 0, headT = o.head || 0, bob = o.bob || 0, sway = o.sway || 0;
  const hipY = y - h * (0.47 - (o.hipUp || 0)) + bob;
  const rot = (dx, dy, a) => { const c = Math.cos(a), s = Math.sin(a); return [dx * c - dy * s, dx * s + dy * c]; };
  const B = (dx, dy) => { const q = rot(dx, dy, lean); return [x + face * q[0] * h, hipY + q[1] * h]; };

  const shoulderL = B(-0.100, -0.312), shoulderR = B(0.100, -0.312);
  const waistL = B(-0.072, -0.085), waistR = B(0.072, -0.085);
  const armpitL = B(-0.113, -0.242), armpitR = B(0.113, -0.242);
  const hipL = B(-0.090, 0.010), hipR = B(0.090, 0.010);
  const neck = B(0, -0.348);
  const headOff = rot(0, -0.080, lean + headT);
  const head = [neck[0] + face * headOff[0] * h, neck[1] + headOff[1] * h];
  const hrx = 0.060 * h, hry = 0.075 * h;

  const L1 = 0.168 * h, L2 = 0.156 * h, TL1 = 0.238 * h, TL2 = 0.232 * h, FL = 0.095 * h;

  // ---------- 腿 ----------
  const leg = (side) => {
    const hipJ = [x + face * (side ? 0.052 : -0.052) * h, hipY];
    const th = (side ? o.thighR : o.thighL) ?? 0, sh = (side ? o.shinR : o.shinL) ?? 0, ft = (side ? o.footR : o.footL) ?? 0;
    const knee = [hipJ[0] + face * Math.sin(th) * TL1, hipJ[1] + Math.cos(th) * TL1];
    const ankle = [knee[0] + face * Math.sin(th + sh) * TL2, knee[1] + Math.cos(th + sh) * TL2];
    const fa = th + sh + ft + Math.PI / 2;
    const toe = [ankle[0] + face * Math.sin(fa) * FL, ankle[1] + Math.cos(fa) * FL];
    const heel = [ankle[0] - face * Math.sin(fa) * FL * 0.30, ankle[1] - Math.cos(fa) * FL * 0.30];
    const parts = [];
    parts.push({ name: 'thigh' + side, role: o.bottom === 'trousers' ? 'trousers' : 'skin', z: side ? 10 : 6,
      path: RIG.taper([hipJ[0], hipJ[1] - 0.012 * h], knee, 0.066 * h, 0.046 * h, 0.006 * h) });
    parts.push({ name: 'shin' + side, role: o.bottom === 'trousers' ? 'trousers' : 'skin', z: side ? 9 : 5,
      path: RIG.taper(knee, ankle, 0.046 * h, 0.028 * h, 0.004 * h) });
    const shoePts = [heel, toe, [toe[0] + face * 0.010 * h, toe[1] - 0.012 * h], [ankle[0] + face * 0.026 * h, ankle[1] - 0.030 * h], [ankle[0] - face * 0.020 * h, ankle[1] - 0.036 * h]];
    parts.push({ name: 'shoe' + side, role: 'shoes', z: side ? 11 : 7, path: S(shoePts) });
    return { parts, J: { hip: hipJ, knee, ankle, toe, heel } };
  };

  // ---------- 臂 ----------
  const arm = (side) => {
    const sh = side ? shoulderR : shoulderL;
    const target = side ? o.handR : o.handL;
    let elbow, hand;
    if (target) {
      const bend = (side ? o.elbowR : o.elbowL) ?? (face > 0 ? 1 : -1);
      const ik = RIG.ik2(sh, target, L1, L2, bend);
      elbow = ik.E; hand = ik.H;
    } else {
      const ua = (side ? o.uaR : o.uaL) ?? 0.04, fa = (side ? o.faR : o.faL) ?? 0.10;
      const q1 = rot(Math.sin(ua) * L1, Math.cos(ua) * L1, lean);
      elbow = [sh[0] + face * q1[0], sh[1] + q1[1]];
      const q2 = rot(Math.sin(ua + fa) * L2, Math.cos(ua + fa) * L2, lean + headT * 0.1);
      hand = [elbow[0] + face * q2[0], elbow[1] + q2[1]];
    }
    const parts = [];
    const sleeveCol = o.top === 'coat' || o.top === 'jacket' ? 'coat' : 'sleeve';
    const az = o.armFront ? (side ? 34 : 30) : (side ? 42 : 14);
    if (o.sleeve !== false) parts.push({ name: 'upperArm' + side, role: sleeveCol, z: az,
      path: RIG.taper(sh, elbow, 0.046 * h, 0.034 * h, 0.004 * h) });
    parts.push({ name: 'foreArm' + side, role: 'skin', z: az + 1,
      path: RIG.taper(elbow, hand, 0.030 * h, 0.021 * h, 0.001 * h) });
    parts.push({ name: 'hand' + side, role: 'skin', z: az + 2,
      path: (() => { const p = new Path2D(); p.ellipse(hand[0], hand[1], 0.024 * h, 0.019 * h, Math.atan2(hand[1] - elbow[1], hand[0] - elbow[0]), 0, Math.PI * 2); return p; })() });
    return { parts, J: { shoulder: sh, elbow, hand } };
  };

  const legF = leg(0), legN = leg(1), armF = arm(0), armN = arm(1);
  const parts = [];
  parts.push(...legF.parts, ...armF.parts);

  // ---------- 躯干（衬衣） ----------
  const shape = new Path2D();
  shape.moveTo(shoulderL[0], shoulderL[1]);
  shape.quadraticCurveTo(armpitL[0], armpitL[1], waistL[0], waistL[1]);
  shape.quadraticCurveTo(hipL[0] - face * 0.018 * h, hipL[1], hipL[0], hipL[1]);
  shape.lineTo(hipR[0], hipR[1]);
  shape.quadraticCurveTo(hipR[0] + face * 0.018 * h, hipR[1], waistR[0], waistR[1]);
  shape.quadraticCurveTo(armpitR[0], armpitR[1], shoulderR[0], shoulderR[1]);
  shape.quadraticCurveTo(neck[0] + face * 0.034 * h, neck[1] + 0.024 * h, neck[0] + face * 0.020 * h, neck[1] - 0.004 * h);
  shape.closePath();
  parts.push({ name: 'torso', role: o.top === 'coat' || o.top === 'jacket' ? 'coat' : 'shirt', z: 26, path: shape });
  if (o.bottom === 'trousers') {
    const pelvis = S([waistL, hipL, B(0, 0.075), hipR, waistR]);
    parts.push({ name: 'pelvis', role: 'trousers', z: 25, path: pelvis });
    const belt = B(0, -0.075); const beltP = new Path2D();
    beltP.moveTo(B(-0.076, -0.088)[0], B(-0.076, -0.088)[1]);
    for (let k = 0; k <= 8; k++) { const q = B(-0.076 + 0.152 * k / 8, -0.088); beltP.lineTo(q[0], q[1]); }
    for (let k = 8; k >= 0; k--) { const q = B(-0.076 + 0.152 * k / 8, -0.068); beltP.lineTo(q[0], q[1]); }
    beltP.closePath();
    parts.push({ name: 'belt', role: 'belt', z: 27, path: beltP });
  }

  // ---------- 外套 ----------
  if (o.top === 'coat' || o.top === 'jacket') {
    const hemY = 0.020 - (o.coatLong || 0.06);
    const hemL = B(-0.112, hemY), hemR = B(0.112, hemY);
    const cPts = [B(-0.112, -0.318), B(-0.122, -0.245), B(-0.088, -0.090), hemL, B(0, hemY + 0.018), hemR, B(0.088, -0.090), B(0.122, -0.245), B(0.112, -0.318), B(0.042, -0.350), B(0, -0.358), B(-0.042, -0.350)];
    parts.push({ name: 'coat', role: 'coat', z: 28, path: S(cPts) });
    parts.push({ name: 'coatEdge', role: 'coatLine', z: 29, line: true,
      path: S([B(0.024, -0.345), B(0.056, -0.210), B(0.024, -0.045), B(0.042, hemY + 0.008)], false) });
    parts.push({ name: 'lapel', role: 'coatLine', z: 30, line: true,
      path: S([B(-0.030, -0.348), B(0.010, -0.290), B(0.052, -0.205), B(0.040, -0.150)], false) });
  }

  // ---------- 裙 / 连衣裙 ----------
  if (o.bottom === 'skirt' || o.bottom === 'dress') {
    const hemW = (o.hemW ?? 0.165) * h;
    const sw = Math.sin(sway * 2.6 + 1.2) * 0.014 * h;
    const cpts = [waistL, B(-0.088, 0.010), [x - face * hemW * 1.02 + sw, y - 0.014 * h], [x - face * hemW * 0.34 + sw * 0.8, y - 0.004 * h],
      [x + face * hemW * 0.36 + sw, y - 0.004 * h], [x + face * hemW * 1.02 + sw, y - 0.014 * h], B(0.088, 0.010), waistR];
    parts.push({ name: 'skirt', role: o.bottom === 'dress' ? 'dress' : 'skirt', z: 24, path: S(cpts) });
    parts.push({ name: 'hem', role: 'hem', z: 23, line: true, path: S([[x - face * hemW * 1.02 + sw, y - 0.014 * h], [x - face * hemW * 0.34 + sw * 0.8, y - 0.004 * h], [x + face * hemW * 0.36 + sw, y - 0.004 * h], [x + face * hemW * 1.02 + sw, y - 0.014 * h]], false) });
  }
  parts.push(...legN.parts, ...armN.parts);

  // ---------- 颈 / 头 ----------
  parts.push({ name: 'neck', role: 'skin', z: 56, path: RIG.taper(B(0, -0.365), B(0, -0.315), 0.042 * h, 0.048 * h, 0) });
  const headP = new Path2D();
  headP.ellipse(head[0], head[1], hrx, hry, (lean + headT) * 0.30, 0, Math.PI * 2);
  parts.push({ name: 'head', role: 'skin', z: 60, path: headP });
  const earP = new Path2D();
  earP.ellipse(head[0] - face * hrx * 0.80, head[1] + hry * 0.12, hrx * 0.24, hry * 0.26, 0.1, 0, Math.PI * 2);
  parts.push({ name: 'ear', role: 'skin', z: 59, path: earP });

  // ---------- 头发 ----------
  const hairStyle = o.hair || 'short';
  if (hairStyle !== 'none' && hairStyle !== 'bald') {
    const tilt = (lean + headT) * 0.30;
    const capPts = [[head[0] - face * hrx * 0.98, head[1] + hry * 0.12], [head[0] - face * hrx * 1.02, head[1] - hry * 0.45],
      [head[0] - face * hrx * 0.55, head[1] - hry * 0.95], [head[0] + face * hrx * 0.45, head[1] - hry * 0.96],
      [head[0] + face * hrx * 0.98, head[1] - hry * 0.40], [head[0] + face * hrx * 0.92, head[1] + hry * 0.02],
      [head[0] + face * hrx * 0.52, head[1] - hry * 0.28], [head[0] + face * hrx * 0.05, head[1] - hry * 0.50],
      [head[0] - face * hrx * 0.48, head[1] - hry * 0.30]];
    parts.push({ name: 'hairCap', role: 'hair', z: 63, path: S(capPts) });
    // 鬓角
    parts.push({ name: 'sideburn', role: 'hair', z: 62, path: S([[head[0] - face * hrx * 0.94, head[1] - hry * 0.30], [head[0] - face * hrx * 0.86, head[1] + hry * 0.28], [head[0] - face * hrx * 0.72, head[1] + hry * 0.10]], false) });
    if (hairStyle === 'long' || hairStyle === 'bob') {
      const len = hairStyle === 'long' ? 0.22 : 0.065;
      const sw = Math.sin(sway * 2.4 + 0.7) * 0.014 * h;
      const backX = head[0] - face * hrx * 0.92;
      const pts = [[backX + face * hrx * 0.4, head[1] - hry * 0.55], [backX - face * sw, head[1] + hry * 0.55],
        [backX - face * sw - face * 0.004 * h, head[1] + hry * 0.9 + len * h], [backX + face * hrx * 0.55 - face * sw, head[1] + hry * 0.82 + len * h],
        [backX + face * hrx * 1.25, head[1] + hry * 0.42], [head[0] + face * hrx * 0.35, head[1] - hry * 0.30]];
      parts.push({ name: 'hairBack', role: 'hair', z: 20, path: S(pts) });
    }
    if (hairStyle === 'bun') {
      const bp = new Path2D(); bp.arc(head[0] - face * hrx * 0.88, head[1] - hry * 0.55, hrx * 0.50, 0, Math.PI * 2);
      parts.push({ name: 'bun', role: 'hair', z: 57, path: bp });
    }
    if (hairStyle === 'braid') {
      for (let k = 0; k < 4; k++) {
        const bp = new Path2D();
        bp.arc(head[0] - face * hrx * 0.88 + face * 0.008 * h * (k % 2 ? 1 : -1), head[1] + hry * 0.60 + k * 0.034 * h, hry * (0.18 - k * 0.014), 0, Math.PI * 2);
        parts.push({ name: 'braid' + k, role: 'hair', z: 56, path: bp });
      }
    }
  }

  // ---------- 帽 ----------
  if (o.hat && o.hat !== 'none') {
    const tilt = (lean + headT) * 0.30;
    const top = [head[0], head[1] - hry * 0.86];
    const brimP = new Path2D();
    const rx = o.hat === 'wide' ? hrx * 2.15 : o.hat === 'straw' ? hrx * 1.86 : o.hat === 'boater' ? hrx * 1.55 : o.hat === 'bowler' ? hrx * 1.38 : hrx * 1.16;
    const ry = o.hat === 'wide' ? hry * 0.40 : o.hat === 'straw' ? hry * 0.32 : o.hat === 'boater' ? hry * 0.18 : o.hat === 'bowler' ? hry * 0.21 : hry * 0.16;
    brimP.ellipse(top[0], top[1] + hry * 0.04, rx, ry, tilt, 0, Math.PI * 2);
    parts.push({ name: 'hatBrim', role: 'hat', z: 65, path: brimP });
    const crownP = new Path2D();
    if (o.hat === 'bowler') crownP.ellipse(top[0], top[1] - hry * 0.28, hrx * 1.02, hry * 0.58, tilt, Math.PI, Math.PI * 2);
    else if (o.hat === 'cap') crownP.ellipse(top[0] - face * hrx * 0.12, top[1] - hry * 0.20, hrx * 0.94, hry * 0.50, tilt, Math.PI, Math.PI * 2);
    else crownP.ellipse(top[0], top[1] - hry * 0.24, hrx * (o.hat === 'boater' ? 0.90 : 0.84), hry * 0.54, tilt, Math.PI, Math.PI * 2);
    crownP.closePath();
    parts.push({ name: 'hatCrown', role: 'hat', z: 66, path: crownP });
    const bandP = new Path2D();
    bandP.ellipse(top[0], top[1] - hry * 0.04, hrx * 0.88, hry * 0.11, tilt, 0, Math.PI * 2);
    parts.push({ name: 'hatBand', role: 'hatBand', z: 67, path: bandP });
  }

  parts.sort((a, b) => a.z - b.z);
  const J = { hip: [x, hipY], neck, head, chest: B(0, -0.265), waist: B(0, -0.088), shoulderL, shoulderR,
    elbowF: armF.J.elbow, handF: armF.J.hand, elbowN: armN.J.elbow, handN: armN.J.hand,
    hipL: legF.J.hip, kneeL: legF.J.knee, ankleL: legF.J.ankle, toeL: legF.J.toe,
    hipR: legN.J.hip, kneeR: legN.J.knee, ankleR: legN.J.ankle, toeR: legN.J.toe,
    headC: head, top: [head[0], head[1] - hry], brim: [head[0] + face * hrx * 0.5, head[1] - hry * 0.7], face };
  return { parts, J, h, x, y, face, hrx, hry, lean, headT, box: [x - 0.25 * h, y - h - 0.12 * h, x + 0.25 * h, y + 0.04 * h] };
};

// 上色：pal 里按角色给色；line 给轮廓色（0 或不给 = 不描线）
F.draw = (c, G, pal = {}) => {
  const lw = pal.lw === undefined ? Math.max(1, G.h * 0.0045) : pal.lw;
  const line = pal.line;
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  for (const pt of G.parts) {
    const col = pal[pt.role] || pt.color;
    if (col) { c.fillStyle = col; c.fill(pt.path); }
    if (line && lw > 0 && pt.name !== 'hem') { c.strokeStyle = line; c.lineWidth = pt.line ? lw * 0.8 : lw; c.stroke(pt.path); }
  }
  if (pal.features !== false) {
    const h = G.h, face = G.face, J = G.J, hrx = G.hrx, hry = G.hry, hd = J.headC;
    c.lineWidth = Math.max(1, h * 0.0038);
    c.strokeStyle = pal.featureCol || 'rgba(40,30,26,.72)';
    const ex = hd[0] + face * hrx * 0.36, ey = hd[1] - hry * 0.02;
    if (pal.eyeOpen !== 0) { c.fillStyle = pal.eyeCol || '#2b2622'; c.beginPath(); c.ellipse(ex, ey, hrx * 0.13, hrx * 0.11, 0, 0, Math.PI * 2); c.fill(); }
    else { c.beginPath(); c.moveTo(ex - hrx * 0.16, ey); c.lineTo(ex + hrx * 0.16, ey); c.stroke(); }
    c.beginPath(); c.moveTo(ex - face * hrx * 0.20, ey - hry * 0.20); c.lineTo(ex + face * hrx * 0.20, ey - hry * 0.17); c.stroke();
    c.beginPath(); c.moveTo(hd[0] + face * hrx * 0.70, hd[1] + hry * 0.02); c.lineTo(hd[0] + face * hrx * 0.94, hd[1] + hry * 0.18); c.stroke();
    c.strokeStyle = pal.lip || 'rgba(150,60,55,.72)'; c.beginPath(); c.moveTo(hd[0] + face * hrx * 0.52, hd[1] + hry * 0.44); c.lineTo(hd[0] + face * hrx * 0.80, hd[1] + hry * 0.42); c.stroke();
    if (pal.blush) { c.fillStyle = pal.blush; c.beginPath(); c.ellipse(hd[0] + face * hrx * 0.30, hd[1] + hry * 0.30, hrx * 0.24, hry * 0.13, 0, 0, Math.PI * 2); c.fill(); }
  }
  c.restore();
};

F.pose = (name, ph = 0, k = {}) => {
  const s = Math.sin(ph * Math.PI * 2), c = Math.cos(ph * Math.PI * 2);
  const P = { lean: 0.02, head: 0, bob: 0, thighL: 0, shinL: 0, footL: 0, thighR: 0, shinR: 0, footR: 0, uaL: 0.02, faL: 0.08, uaR: 0.02, faR: 0.08 };
  switch (name) {
    case 'idle': Object.assign(P, { bob: 2 * s, uaL: 0.02 + 0.03 * s, uaR: 0.02 - 0.03 * s }); break;
    case 'walk': Object.assign(P, { lean: 0.04, bob: -0.034 * Math.abs(c),
      thighL: 0.36 * s, shinL: -0.10 - 0.42 * Math.max(0, -s), footL: 0.10 * s,
      thighR: -0.36 * s, shinR: -0.10 - 0.42 * Math.max(0, s), footR: -0.10 * s,
      uaL: -0.24 * s, faL: 0.12, uaR: 0.24 * s, faR: 0.12 }); break;
    case 'stride': Object.assign(P, { lean: 0.10, bob: -0.040 * Math.abs(c),
      thighL: 0.52 * s, shinL: -0.16 - 0.55 * Math.max(0, -s), footL: 0.14 * s,
      thighR: -0.52 * s, shinR: -0.16 - 0.55 * Math.max(0, s), footR: -0.14 * s,
      uaL: -0.50 * s, faL: 0.20, uaR: 0.50 * s, faR: 0.20, head: 0.03 * c }); break;
    case 'run': Object.assign(P, { lean: 0.20, bob: -0.030 * Math.abs(c),
      thighL: 0.80 * s + 0.08, shinL: -0.25 - 0.85 * Math.max(0, -s), footL: 0.20 * s,
      thighR: -0.80 * s + 0.08, shinR: -0.25 - 0.85 * Math.max(0, s), footR: -0.20 * s,
      uaL: -0.85 * s, faL: 0.85, uaR: 0.85 * s, faR: 0.85, head: -0.07 }); break;
    case 'sit': Object.assign(P, { hipUp: 0.18, thighL: 0.95, shinL: -0.80, footL: 0.22, thighR: 0.86, shinR: -0.74, footR: 0.22,
      lean: 0.05, uaL: 0.34, faL: 0.72, uaR: 0.32, faR: 0.72 }); break;
    case 'brace': Object.assign(P, { lean: 0.16, bob: 0.004 * s,
      thighL: 0.30, shinL: -0.28, thighR: -0.24, shinR: -0.34,
      uaL: 0.52, faL: 0.42, uaR: -0.10, faR: 0.75, head: -0.10 }); break;
  }
  return Object.assign(P, k);
};
})();

