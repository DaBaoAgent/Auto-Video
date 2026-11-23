// FILMKIT · 十秒样片的共用画法库
// 给演示站 91–110 这一批管线用：人物、动物、相机、后期全部代码画出来。
// 约定：无随机漂移（同一个 t 永远同一帧）；所有随机都用种子；不依赖外部资源。
(() => {
const W = 1920, H = 1080;
const FILM = window.FILM = {};
FILM.W = W; FILM.H = H;
FILM.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
FILM.lerp = (a, b, k) => a + (b - a) * k;
FILM.ease = (x) => { x = FILM.clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
FILM.easeOut = (x) => 1 - Math.pow(1 - FILM.clamp(x), 3);
FILM.easeIn = (x) => Math.pow(FILM.clamp(x), 3);
FILM.easeOutBack = (x) => { x = FILM.clamp(x); const c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
FILM.soft = (x) => { x = FILM.clamp(x); return x * x * (3 - 2 * x); };

FILM.hash = (n) => { let h = n * 374761393 + 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };
FILM.rng = (seed) => {
  let a = 0; const s = String(seed);
  for (let i = 0; i < s.length; i++) a = (a * 31 + s.charCodeAt(i)) >>> 0;
  a = (a + 0x9e3779b9) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
FILM.n1 = (x, seed = 0) => {                       // 一维平滑噪声，0..1
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return FILM.lerp(FILM.hash(i + seed * 7919), FILM.hash(i + 1 + seed * 7919), u);
};
FILM.n2 = (x, y, seed = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const h = (a, b) => FILM.hash(a * 374761 + b * 668265 + seed * 1013);
  return FILM.lerp(FILM.lerp(h(ix, iy), h(ix + 1, iy), u), FILM.lerp(h(ix, iy + 1), h(ix + 1, iy + 1), u), v);
};
FILM.fbm = (x, y, oct = 4, seed = 0) => { let s = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { s += a * FILM.n2(x * f, y * f, seed + i); a *= .5; f *= 2; } return s; };

FILM.hex = (h) => { const s = String(h).replace('#', ''); const n = parseInt(s.length === 3 ? s.split('').map(c => c + c).join('') : s, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
FILM.rgba = (h, a = 1) => { const [r, g, b] = FILM.hex(h); return `rgba(${r},${g},${b},${a})`; };
FILM.mix = (a, b, k) => { const A = FILM.hex(a), B = FILM.hex(b); return '#' + A.map((v, i) => Math.round(FILM.lerp(v, B[i], k)).toString(16).padStart(2, '0')).join(''); };
FILM.shade = (h, k) => (k >= 0 ? FILM.mix(h, '#ffffff', k) : FILM.mix(h, '#000000', -k));

FILM.canvas = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const CACHE = {};
FILM.layer = (key, w, h, fn) => { if (!CACHE[key]) { const cv = FILM.canvas(w, h); fn(cv.getContext('2d'), cv); CACHE[key] = cv; } return CACHE[key]; };

// ---------- 形状 ----------
FILM.smooth = (pts, closed = true, k = 0.55) => {
  const p = new Path2D(), n = pts.length; if (n < 2) return p;
  const at = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3,
      p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3, p2[0], p2[1]);
  }
  if (closed) p.closePath();
  return p;
};
FILM.capsule = (A, B, wA, wB) => {
  const p = new Path2D(), a = Math.atan2(B[1] - A[1], B[0] - A[0]), n = a + Math.PI / 2;
  p.moveTo(A[0] + Math.cos(n) * wA / 2, A[1] + Math.sin(n) * wA / 2);
  p.lineTo(B[0] + Math.cos(n) * wB / 2, B[1] + Math.sin(n) * wB / 2);
  p.arc(B[0], B[1], wB / 2, n, n - Math.PI, true);
  p.lineTo(A[0] - Math.cos(n) * wA / 2, A[1] - Math.sin(n) * wA / 2);
  p.arc(A[0], A[1], wA / 2, n - Math.PI, n - 2 * Math.PI, true);
  p.closePath(); return p;
};
FILM.taper = (A, B, wA, wB, bulge = 0) => {
  const a = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
  const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], wM = (wA + wB) / 2 + bulge;
  return FILM.smooth([[A[0] + nx * wA / 2, A[1] + ny * wA / 2], [M[0] + nx * wM / 2, M[1] + ny * wM / 2],
    [B[0] + nx * wB / 2, B[1] + ny * wB / 2], [B[0] + Math.cos(a) * wB * .32, B[1] + Math.sin(a) * wB * .32],
    [B[0] - nx * wB / 2, B[1] - ny * wB / 2], [M[0] - nx * wM / 2, M[1] - ny * wM / 2],
    [A[0] - nx * wA / 2, A[1] - ny * wA / 2], [A[0] - Math.cos(a) * wA * .3, A[1] - Math.sin(a) * wA * .3]]);
};
FILM.rect = (x, y, w, h, r = 0) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
FILM.poly = (pts) => { const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])); p.closePath(); return p; };

// ---------- 渐变填充 ----------
FILM.vgrad = (c, y0, y1, stops) => { const g = c.createLinearGradient(0, y0, 0, y1); stops.forEach(([k, col]) => g.addColorStop(k, col)); return g; };
FILM.rgrad = (c, x, y, r0, r1, stops) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([k, col]) => g.addColorStop(k, col)); return g; };

// ---------- 人物 ----------
// 侧身 / 微正面的人形骨架：y 为脚底，h 为身高。角度单位弧度，0 = 竖直向下，正 = 朝脸的方向（前）。
FILM.person = (c, o = {}) => {
  const { x = 960, y = 1000, h = 360, face = 1, alpha = 1, fill = '#121212', fill2 = null,
    rim = null, rimW = 3, line = null, lineW = 0, pose = {}, hat = null, hair = 'short',
    coat = null, scarf = null, hover = 0, mode = 'silhouette' } = o;
  const P = Object.assign({ lean: 0, head: 0, armL: [0.06, 0.10], armR: [-0.06, 0.10], legL: [0.03, 0.02], legR: [-0.03, 0.02], bob: 0 }, pose);
  const hipY = y - h * 0.475 + (P.bob || 0) * h;
  const hip = [x, hipY - (hover || 0) * h];
  const dir = (a) => [Math.sin(a), Math.cos(a)];
  const torsoLen = h * 0.315, shoulderW = h * 0.165, chestW = h * 0.150, waistW = h * 0.118, hipW = h * 0.135;
  const sh = [hip[0] + Math.sin(P.lean) * torsoLen, hip[1] - Math.cos(P.lean) * torsoLen];
  const perp = [Math.cos(P.lean), Math.sin(P.lean)];
  const neck = [sh[0] + Math.sin(P.lean + P.head) * h * 0.012, sh[1] - Math.cos(P.lean + P.head) * h * 0.012];
  const headC = [neck[0] + Math.sin(P.lean + P.head) * h * 0.082, neck[1] - Math.cos(P.lean + P.head) * h * 0.082];

  const leg = (i, ang) => {
    const off = i === 1 ? h * 0.042 : -h * 0.042;
    const H = [hip[0] + perp[0] * off, hip[1] + perp[1] * off];
    const K = [H[0] + dir(ang[0])[0] * h * 0.245, H[1] + dir(ang[0])[1] * h * 0.245];
    const A = [K[0] + dir(ang[1])[0] * h * 0.235, K[1] + dir(ang[1])[1] * h * 0.235];
    return { H, K, A };
  };
  const arm = (i, ang) => {
    const off = i === 1 ? h * 0.058 : -h * 0.058;
    const S = [sh[0] + perp[0] * off, sh[1] + perp[1] * off];
    const E = [S[0] + dir(ang[0])[0] * h * 0.155, S[1] + dir(ang[0])[1] * h * 0.155];
    const Hd = [E[0] + dir(ang[1])[0] * h * 0.145, E[1] + dir(ang[1])[1] * h * 0.145];
    return { S, E, Hd };
  };
  const L1 = leg(1, P.legL), L2 = leg(2, P.legR), A1 = arm(1, P.armL), A2 = arm(2, P.armR);

  const torso = FILM.smooth([
    [hip[0] + perp[0] * hipW / 2, hip[1] + perp[1] * hipW / 2],
    [hip[0] + perp[0] * waistW / 2 + Math.sin(P.lean) * h * .13, hip[1] + perp[1] * waistW / 2 - Math.cos(P.lean) * h * .13],
    [hip[0] + perp[0] * chestW / 2 + Math.sin(P.lean) * h * .24, hip[1] + perp[1] * chestW / 2 - Math.cos(P.lean) * h * .24],
    [sh[0] + perp[0] * shoulderW / 2, sh[1] + perp[1] * shoulderW / 2],
    [neck[0] + h * .018, neck[1]],
    [neck[0] - h * .018, neck[1]],
    [sh[0] - perp[0] * shoulderW / 2, sh[1] - perp[1] * shoulderW / 2],
    [hip[0] - perp[0] * chestW / 2 + Math.sin(P.lean) * h * .24, hip[1] - perp[1] * chestW / 2 - Math.cos(P.lean) * h * .24],
    [hip[0] - perp[0] * waistW / 2 + Math.sin(P.lean) * h * .13, hip[1] - perp[1] * waistW / 2 - Math.cos(P.lean) * h * .13],
    [hip[0] - perp[0] * hipW / 2, hip[1] - perp[1] * hipW / 2],
    [hip[0], hip[1] + h * .03],
  ]);
  const head = new Path2D();
  head.ellipse(headC[0], headC[1], h * .054, h * .068, P.lean + P.head, 0, Math.PI * 2);
  const jaw = FILM.smooth([[headC[0] - h * .02, headC[1] + h * .045], [headC[0] + h * .045, headC[1] + h * .03],
    [headC[0] + h * .03, headC[1] + h * .075], [headC[0] - h * .012, headC[1] + h * .072]]);
  const hairPath = FILM.smooth([[headC[0] - h * .052, headC[1] - h * .020], [headC[0] - h * .045, headC[1] - h * .065],
    [headC[0] + h * .005, headC[1] - h * .082], [headC[0] + h * .055, headC[1] - h * .058],
    [headC[0] + h * .062, headC[1] - h * .012], [headC[0] + h * .04, headC[1] - h * .03],
    [headC[0] + h * .002, headC[1] - h * .045], [headC[0] - h * .035, headC[1] - h * .034]]);
  const skirt = coat === 'skirt' || coat === 'dress' ? FILM.smooth([
    [hip[0] + perp[0] * hipW / 2 - h * .01, hip[1] + perp[1] * hipW / 2 - h * .01],
    [hip[0] + h * .085, hip[1] + h * .175], [hip[0] + h * .06, hip[1] + h * .21],
    [hip[0] - h * .075, hip[1] + h * .205], [hip[0] - h * .095, hip[1] + h * .15],
    [hip[0] - perp[0] * hipW / 2 + h * .01, hip[1] - perp[1] * hipW / 2 - h * .01]]) : null;
  const longCoat = coat === 'long' || coat === 'dress' ? FILM.smooth([
    [sh[0] + perp[0] * shoulderW * .52, sh[1] + perp[1] * shoulderW * .52],
    [hip[0] + h * .105, hip[1] + h * .195], [hip[0] + h * .10, hip[1] + h * .265],
    [hip[0] - h * .085, hip[1] + h * .255], [hip[0] - h * .095, hip[1] + h * .16],
    [sh[0] - perp[0] * shoulderW * .52, sh[1] - perp[1] * shoulderW * .52],
    [neck[0] + h * .018, neck[1] + h * .004], [neck[0] - h * .018, neck[1] + h * .004]]) : null;

  const parts = [];
  const push = (p, w, role, z) => parts.push({ p, w, role, z });
  push(FILM.taper(L2.H, L2.K, h * .078, h * .062), 1, 'leg', 1);
  push(FILM.taper(L2.K, L2.A, h * .060, h * .042), 1, 'leg', 2);
  push(FILM.smooth([[L2.A[0] - h * .012, L2.A[1] + h * .004], [L2.A[0] + h * .012, L2.A[1]], [L2.A[0] + h * .050, L2.A[1] - h * .008], [L2.A[0] + h * .052, L2.A[1] + h * .012], [L2.A[0] - h * .016, L2.A[1] + h * .016]]), 1, 'shoe', 3);
  push(FILM.taper(A2.S, A2.E, h * .052, h * .044), 1, 'arm', 4);
  push(FILM.taper(A2.E, A2.Hd, h * .044, h * .034), 1, 'arm', 5);
  push(torso, 1, 'torso', 6);
  if (skirt) push(skirt, 1, 'skirt', 7);
  if (longCoat) push(longCoat, 1, 'coat', 7.5);
  push(head, 1, 'head', 8);
  push(jaw, 1, 'head', 9);
  push(FILM.taper([neck[0] - h * .02, neck[1] + h * .01], [neck[0] + h * .02, neck[1] + h * .015], h * .034, h * .036), 1, 'neck', 9);
  if (hair !== 'none') push(hairPath, 1, 'hair', 10);
  if (hair === 'bun') { const b = new Path2D(); b.arc(headC[0] - h * .05, headC[1] - h * .03, h * .026, 0, Math.PI * 2); push(b, 1, 'hair', 11); }
  if (hat === 'cap' || hat === 'helmet' || hat === 'bowler' || hat === 'hat') {
    const hatP = hat === 'helmet'
      ? (() => { const p = new Path2D(); p.ellipse(headC[0], headC[1] - h * .012, h * .062, h * .068, P.lean + P.head, 0, Math.PI * 2); return p; })()
      : FILM.smooth([[headC[0] - h * .060, headC[1] - h * .040], [headC[0] - h * .040, headC[1] - h * .075], [headC[0] + h * .030, headC[1] - h * .078], [headC[0] + h * .062, headC[1] - h * .045], [headC[0] + h * .070, headC[1] - h * .028], [headC[0] - h * .060, headC[1] - h * .022]]);
    push(hatP, 1, 'hat', 12);
    if (hat === 'cap') push(FILM.smooth([[headC[0] + h * .030, headC[1] - h * .040], [headC[0] + h * .105, headC[1] - h * .040], [headC[0] + h * .105, headC[1] - h * .028], [headC[0] + h * .030, headC[1] - h * .024]]), 1, 'hat', 12);
  }
  push(FILM.taper(L1.H, L1.K, h * .082, h * .064), 1, 'leg', 13);
  push(FILM.taper(L1.K, L1.A, h * .064, h * .045), 1, 'leg', 14);
  push(FILM.smooth([[L1.A[0] - h * .012, L1.A[1] + h * .004], [L1.A[0] + h * .012, L1.A[1]], [L1.A[0] + h * .052, L1.A[1] - h * .008], [L1.A[0] + h * .054, L1.A[1] + h * .012], [L1.A[0] - h * .016, L1.A[1] + h * .016]]), 1, 'shoe', 15);
  push(FILM.taper(A1.S, A1.E, h * .054, h * .046), 1, 'arm', 16);
  push(FILM.taper(A1.E, A1.Hd, h * .046, h * .036), 1, 'arm', 17);
  push((() => { const p = new Path2D(); const a = Math.atan2(A1.Hd[1] - A1.E[1], A1.Hd[0] - A1.E[0]); p.ellipse(A1.Hd[0] + Math.cos(a) * h * .012, A1.Hd[1] + Math.sin(a) * h * .012, h * .026, h * .019, a, 0, Math.PI * 2); return p; })(), 1, 'hand', 18);

  const paint = (col, dx, dy, isMain) => {
    const grad = isMain && fill2 ? c.createLinearGradient(x - h * .1, y - h, x + h * .1, y) : null;
    if (grad) { grad.addColorStop(0, fill2); grad.addColorStop(1, fill); }
    c.fillStyle = grad || col;
    c.strokeStyle = col;
    parts.forEach(part => {
      c.save(); c.translate(dx || 0, dy || 0);
      c.fill(part.p);
      c.restore();
    });
    if (line && isMain && lineW) {
      c.strokeStyle = line; c.lineWidth = lineW;
      parts.forEach(part => { c.save(); c.translate(dx || 0, dy || 0); c.stroke(part.p); c.restore(); });
    }
  };

  c.save();
  c.globalAlpha = alpha;
  c.translate(x, 0); c.scale(face, 1); c.translate(-x, 0);
  if (rim) paint(FILM.rgba(rim, .9), rimW * .8, -rimW * .8, false);
  paint(fill, 0, 0, true);
  // 细节（只在足够大时生效）
  if (h > 420 && mode !== 'silhouette') {
    c.fillStyle = FILM.rgba('#000000', .35);
  }
  c.restore();
  return { head: headC, hand: A1.Hd, shoulder: sh, hip };
};

// ---------- 四足动物 ----------
FILM.animal = (c, o = {}) => {
  const { x = 900, y = 900, h = 300, face = 1, fill = '#141414', rim = null, rimW = 2, alpha = 1,
    kind = 'deer', phase = 0, pose = {}, accent = null } = o;
  const P = Object.assign({ head: 0, leg: 0, body: 0 }, pose);
  const swing = Math.sin(phase * Math.PI * 2);
  const len = h * (kind === 'wolf' ? .92 : .78);
  const bodyH = h * (kind === 'wolf' ? .40 : .36);
  const cy = y - h * (kind === 'deer' ? .60 : .55);
  const cx = x;
  c.save(); c.globalAlpha = alpha;
  c.translate(cx, 0); c.scale(face, 1); c.translate(-cx, 0);
  const parts = [];
  const body = FILM.smooth([
    [cx - len * .48, cy - bodyH * .22], [cx - len * .22, cy - bodyH * .52], [cx + len * .18, cy - bodyH * .55],
    [cx + len * .44, cy - bodyH * .30], [cx + len * .46, cy + bodyH * .22], [cx + len * .20, cy + bodyH * .46],
    [cx - len * .26, cy + bodyH * .44], [cx - len * .50, cy + bodyH * .10]]);
  parts.push(body);
  const legX = [-len * .34, -len * .20, len * .20, len * .32];
  legX.forEach((lx, i) => {
    const sw = swing * (i % 2 ? -1 : 1) * h * .02;
    const knee = [cx + lx + sw, cy + bodyH * .45 + h * .16];
    const foot = [cx + lx + sw * 1.6, y];
    parts.push(FILM.taper([cx + lx, cy + bodyH * .38], knee, h * .040, h * .028));
    parts.push(FILM.taper(knee, foot, h * .028, h * .020));
  });
  const neck = [cx + len * .40, cy - bodyH * .34];
  const headP = [cx + len * .52, cy - bodyH * .78 - h * .02 + P.head * h * .02];
  parts.push(FILM.taper(neck, headP, h * .075, h * .052));
  const headPath = (kind === 'wolf')
    ? FILM.smooth([[headP[0] - h * .03, headP[1] - h * .035], [headP[0] + h * .055, headP[1] - h * .028], [headP[0] + h * .085, headP[1] + h * .006], [headP[0] + h * .025, headP[1] + h * .035], [headP[0] - h * .03, headP[1] + h * .022]])
    : FILM.smooth([[headP[0] - h * .028, headP[1] - h * .030], [headP[0] + h * .050, headP[1] - h * .022], [headP[0] + h * .070, headP[1] + h * .004], [headP[0] + h * .020, headP[1] + h * .040], [headP[0] - h * .030, headP[1] + h * .028]]);
  parts.push(headPath);
  if (kind === 'deer') {
    const ear = [[headP[0] - h * .02, headP[1] - h * .030], [headP[0] - h * .075, headP[1] - h * .075], [headP[0] - h * .045, headP[1] - h * .020]];
    c.strokeStyle = fill; c.lineWidth = h * .012; c.beginPath(); c.moveTo(...ear[0]); c.lineTo(...ear[1]); c.lineTo(...ear[2]); c.stroke();
    c.lineWidth = h * .009;
    for (const s of [-1, 1]) {
      const bx = headP[0] - h * .01, by = headP[1] - h * .045;
      c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + s * h * .06, by - h * .10, bx + s * h * .12, by - h * .16); c.stroke();
      c.beginPath(); c.moveTo(bx + s * h * .045, by - h * .07); c.lineTo(bx + s * h * .055, by - h * .125); c.stroke();
    }
    c.beginPath(); c.moveTo(cx - len * .48, cy - bodyH * .10); c.quadraticCurveTo(cx - len * .58, cy - bodyH * .30, cx - len * .55, cy - bodyH * .46); c.stroke();
  } else {
    parts.push(FILM.smooth([[headP[0] - h * .02, headP[1] - h * .022], [headP[0] - h * .055, headP[1] - h * .070], [headP[0] - h * .030, headP[1] - h * .005]]));
    const tail = FILM.taper([cx - len * .46, cy - bodyH * .12], [cx - len * .62, cy - bodyH * .30], h * .050, h * .020);
    parts.push(tail);
  }
  c.fillStyle = fill;
  parts.forEach(p => c.fill(p));
  if (accent) { c.fillStyle = accent; }
  c.restore();
  return { head: headP };
};

// ---------- 猫 ----------
FILM.cat = (c, o = {}) => {
  const { x = 900, y = 900, h = 150, face = 1, fill = '#0d0d12', rim = null, rimW = 2, alpha = 1, phase = 0, tail = 0, crouch = 0, arch = 0 } = o;
  const swing = Math.sin(phase * Math.PI * 2);
  const bodyH = h * (0.42 - crouch * .10);
  const cy = y - h * .52 + crouch * h * .10;
  c.save(); c.globalAlpha = alpha; c.translate(x, 0); c.scale(face, 1); c.translate(-x, 0);
  const parts = [];
  const body = FILM.smooth([[x - h * .30, cy + bodyH * .05], [x - h * .18, cy - bodyH * .40], [x + h * .06, cy - bodyH * .58],
    [x + h * .24, cy - bodyH * .42], [x + h * .30, cy - bodyH * .02], [x + h * .18, cy + bodyH * .36], [x - h * .16, cy + bodyH * .42]]);
  parts.push(body);
  const hip = [x - h * .26, cy + bodyH * .10];
  const knee = [x - h * .24, y - h * .16];
  const foot = [x - h * .30, y];
  parts.push(FILM.taper(hip, knee, h * .085, h * .065)); parts.push(FILM.taper(knee, foot, h * .06, h * .048));
  const sh = [x + h * .16, cy + bodyH * .22];
  parts.push(FILM.taper(sh, [x + h * .18, y - h * .14], h * .070, h * .052));
  parts.push(FILM.taper([x + h * .18, y - h * .14], [x + h * .22, y], h * .052, h * .040));
  const headC = [x + h * .30, cy - h * .34];
  parts.push(FILM.smooth([[headC[0] - h * .13, headC[1] - h * .03], [headC[0] - h * .09, headC[1] - h * .14], [headC[0] - h * .02, headC[1] - h * .17], [headC[0] + h * .07, headC[1] - h * .16], [headC[0] + h * .13, headC[1] - h * .07], [headC[0] + h * .14, headC[1] + h * .03], [headC[0] + h * .06, headC[1] + h * .10], [headC[0] - h * .05, headC[1] + h * .09], [headC[0] - h * .12, headC[1] + h * .03]]));
  for (const s of [-1, 1]) parts.push(FILM.poly([[headC[0] + s * h * .08, headC[1] - h * .13], [headC[0] + s * h * .11, headC[1] - h * .26], [headC[0] + s * h * .02, headC[1] - h * .17]]));
  const tailP = FILM.taper([x - h * .28, cy - bodyH * .18], [x - h * .46, cy - h * .40 + tail * h * .12], h * .036, h * .012);
  parts.push(tailP);
  if (rim) { c.fillStyle = rim; c.globalAlpha = alpha * .8; parts.forEach(p => { c.save(); c.translate(rimW, -rimW); c.fill(p); c.restore(); }); }
  c.globalAlpha = alpha; c.fillStyle = fill; parts.forEach(p => c.fill(p));
  c.restore(); return { head: headC };
};

// ---------- 鸟 ----------
FILM.bird = (c, o = {}) => {
  const { x = 900, y = 500, h = 90, face = 1, fill = '#141414', flap = 0, alpha = 1 } = o;
  const w = Math.sin(flap * Math.PI * 2);
  c.save(); c.globalAlpha = alpha; c.translate(x, 0); c.scale(face, 1); c.translate(-x, 0);
  c.fillStyle = fill;
  const body = new Path2D(); body.ellipse(x, y, h * .42, h * .20, 0, 0, Math.PI * 2); c.fill(body);
  const head = new Path2D(); head.arc(x + h * .40, y - h * .10, h * .13, 0, Math.PI * 2); c.fill(head);
  const beak = FILM.poly([[x + h * .51, y - h * .12], [x + h * .66, y - h * .06], [x + h * .50, y - h * .01]]); c.fill(beak);
  const tail = FILM.poly([[x - h * .38, y - h * .02], [x - h * .64, y - h * .12], [x - h * .58, y + h * .06], [x - h * .36, y + h * .10]]); c.fill(tail);
  for (const s of [-1, 1]) {
    const wy = y - h * .02 + s * h * .02;
    const tip = [x + s * h * .10 - s * h * .30, wy - h * (.32 + w * .22) * (s > 0 ? 1 : 1)];
    c.beginPath(); c.moveTo(x, wy); c.quadraticCurveTo(x + s * h * .10, wy - h * (.35 + w * .25), tip[0], tip[1]); c.lineTo(x + s * h * .10, wy + h * .10); c.closePath(); c.fill();
  }
  c.restore();
};

// ---------- 鱼 ----------
FILM.fish = (c, o = {}) => {
  const { x = 900, y = 500, len = 260, face = 1, fill = '#161616', belly = null, fin = '#0e0e0e', alpha = 1, glow = null, phase = 0, eye = true } = o;
  const wag = Math.sin(phase * Math.PI * 2);
  c.save(); c.globalAlpha = alpha; c.translate(x, 0); c.scale(face, 1); c.translate(-x, 0);
  const p = FILM.smooth([[x + len * .50, y], [x + len * .28, y - len * .18], [x - len * .06, y - len * .22],
    [x - len * .38, y - len * .10], [x - len * .50, y + wag * len * .04], [x - len * .38, y + len * .10],
    [x - len * .06, y + len * .18], [x + len * .28, y + len * .14]]);
  c.fillStyle = belly || fill; c.fill(p);
  c.fillStyle = fill; c.save(); c.globalAlpha = .55; c.fill(p); c.restore();
  const tail = FILM.poly([[x - len * .40, y], [x - len * .62, y - len * .22 + wag * len * .06], [x - len * .58, y + wag * len * .02], [x - len * .62, y + len * .22 + wag * len * .06]]);
  c.fillStyle = fin; c.fill(tail);
  const dorsal = FILM.poly([[x - len * .10, y - len * .18], [x + len * .10, y - len * .34], [x + len * .22, y - len * .16]]);
  c.fill(dorsal);
  if (eye) { c.fillStyle = '#e8e8e8'; c.beginPath(); c.arc(x + len * .34, y - len * .03, len * .035, 0, Math.PI * 2); c.fill(); c.fillStyle = '#0a0a0a'; c.beginPath(); c.arc(x + len * .35, y - len * .03, len * .015, 0, Math.PI * 2); c.fill(); }
  c.restore();
};

// ---------- 等轴方块 ----------
FILM.isoBox = (c, o = {}) => {
  const { cx, cy, sz = 80, hgt = 1.2, w = 1, d = 1, top = '#eee', left = '#ccc', right = '#999', r = 0, glass = 0, stroke = null } = o;
  const k = sz / 2, hh = k * 0.5;
  const P = (x, y, z) => [cx + (x - y) * k, cy + (x + y) * hh - z * sz];
  const A = P(-w, -d, hgt), B = P(w, -d, hgt), C = P(w, d, hgt), D = P(-w, d, hgt);
  const B2 = P(w, -d, 0), C2 = P(w, d, 0), D2 = P(-w, d, 0);
  c.save(); c.globalAlpha = 1 - glass * .55;
  c.fillStyle = top; c.fill(FILM.poly([A, B, C, D]));
  c.fillStyle = left; c.fill(FILM.poly([D, C, C2, D2]));
  c.fillStyle = right; c.fill(FILM.poly([B, C, C2, B2]));
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.stroke(FILM.poly([A, B, C, D])); }
  c.restore();
  return { A, B, C, D };
};

// ---------- 相机 ----------
FILM.cam = (keys, t) => {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) {
      const e = (b.ease || FILM.ease)((t - a.t) / Math.max(.001, b.t - a.t));
      return { x: FILM.lerp(a.x, b.x, e), y: FILM.lerp(a.y, b.y, e), z: FILM.lerp(a.z, b.z, e), r: FILM.lerp(a.r || 0, b.r || 0, e) };
    }
  }
  return { ...keys[keys.length - 1] };
};
FILM.withCam = (c, cam, fn, W0 = W, H0 = H) => {
  c.save();
  c.translate(W0 / 2, H0 / 2);
  if (cam.r) c.rotate(cam.r);
  c.scale(cam.z, cam.z);
  c.translate(-cam.x, -cam.y);
  fn();
  c.restore();
};
FILM.screen = (cam, x, y) => [W / 2 + (x - cam.x) * cam.z, H / 2 + (y - cam.y) * cam.z];

// ---------- 月面纹理 ----------
FILM.moonTex = (seed = 1) => FILM.layer('moontex' + seed, 512, 512, (g) => {
  const S = 512, R = S / 2, r0 = FILM.rng('moont' + seed);
  const im = g.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const n = FILM.fbm(x / S * 7, y / S * 7, 5, seed) * .6 + FILM.fbm(x / S * 20, y / S * 20, 3, seed + 3) * .4;
      const m = FILM.fbm(x / S * 2.1 + 3, y / S * 2.1 + 7, 3, seed + 11);
      const v = 200 + (n - .5) * 72 - Math.max(0, m - .54) * 245;
      im.data[i] = v * 1.02; im.data[i + 1] = v * 1.01; im.data[i + 2] = v * .97; im.data[i + 3] = 255;
    }
  }
  g.putImageData(im, 0, 0);
  for (let k = 0; k < 130; k++) {
    const a = r0() * Math.PI * 2, d2 = Math.sqrt(r0()) * R * .94;
    const x = R + Math.cos(a) * d2, y = R + Math.sin(a) * d2, cr = 2 + r0() * r0() * 20;
    const gr = g.createRadialGradient(x - cr * .25, y - cr * .25, 0, x, y, cr);
    gr.addColorStop(0, 'rgba(72,72,68,.40)'); gr.addColorStop(.55, 'rgba(112,112,106,.18)');
    gr.addColorStop(.83, 'rgba(248,246,238,.26)'); gr.addColorStop(1, 'rgba(120,120,114,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, cr, 0, Math.PI * 2); g.fill();
  }
  const lg = g.createRadialGradient(R * .62, R * .62, R * .3, R, R, R);
  lg.addColorStop(0, 'rgba(20,20,18,0)'); lg.addColorStop(.82, 'rgba(20,20,18,.10)'); lg.addColorStop(1, 'rgba(20,20,18,.52)');
  g.fillStyle = lg; g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.fill();
});

// ---------- 后期 ----------
const GRAIN = {};
FILM.grain = (c, amt = .12, seed = 0) => {
  if (!GRAIN[seed]) {
    const cv = FILM.canvas(256, 256), g = cv.getContext('2d'), im = g.createImageData(256, 256);
    const r = FILM.rng('grain' + seed);
    for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() - .5) * 190; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); GRAIN[seed] = cv;
  }
  c.save(); c.globalAlpha = amt; c.globalCompositeOperation = 'overlay';
  c.fillStyle = c.createPattern(GRAIN[seed], 'repeat'); c.fillRect(0, 0, W, H); c.restore();
};
FILM.vignette = (c, { inner = .34, outer = .82, color = 'rgba(0,0,0,', a = .55 } = {}) => {
  const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * inner, W / 2, H / 2, Math.max(W, H) * outer);
  g.addColorStop(0, color + '0)'); g.addColorStop(.65, color + (a * .45) + ')'); g.addColorStop(1, color + a + ')');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
};
const SCAN = {};
FILM.scanlines = (c, gap = 4, alpha = .2) => {
  const key = gap + '_' + alpha;
  if (!SCAN[key]) {
    const cv = FILM.canvas(4, gap), g = cv.getContext('2d');
    g.fillStyle = `rgba(0,0,0,${alpha})`; g.fillRect(0, 0, 4, Math.max(1, Math.round(gap / 3))); SCAN[key] = cv;
  }
  c.save(); c.fillStyle = c.createPattern(SCAN[key], 'repeat'); c.fillRect(0, 0, W, H); c.restore();
};
FILM.glow = (c, x, y, r, color, a = .5) => {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, FILM.rgba(color, a)); g.addColorStop(.35, FILM.rgba(color, a * .45)); g.addColorStop(1, FILM.rgba(color, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
};
FILM.letterbox = (c, hRatio = .055, color = '#000') => {
  const bar = H * hRatio; c.fillStyle = color; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
};
FILM.text = (c, str, o = {}) => {
  const { x = 100, y = 100, size = 40, color = '#fff', weight = 700, tracking = 0, align = 'left', alpha = 1,
    font = 'AlibabaPuHuiTi', baseline = 'alphabetic', shadow = 0, rotate = 0 } = o;
  c.save(); c.globalAlpha = alpha; c.font = `${weight} ${size}px "${font}", "Microsoft YaHei", sans-serif`;
  c.fillStyle = color; c.textBaseline = baseline;
  if (rotate) { c.translate(x, y); c.rotate(rotate); c.translate(-x, -y); }
  let total = 0;
  for (const ch of String(str)) total += c.measureText(ch).width + tracking;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  if (shadow) { c.shadowColor = 'rgba(0,0,0,.75)'; c.shadowBlur = shadow; c.shadowOffsetY = shadow * .35; }
  for (const ch of String(str)) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + tracking; }
  c.restore();
  return total;
};

// ---------- 背景工具 ----------
FILM.sky = (c, stops, y0 = 0, y1 = H) => { c.fillStyle = FILM.vgrad(c, y0, y1, stops); c.fillRect(0, 0, W, H); };
FILM.clouds = (c, t, o = {}) => {
  const { y = 200, n = 14, color = 'rgba(255,255,255,.14)', scale = 1, speed = 18, seed = 1, spread = W * 1.4 } = o;
  const r0 = FILM.rng('clouds' + seed);
  c.save();
  for (let i = 0; i < n; i++) {
    const x = ((r0() * spread + t * speed * (0.6 + r0() * .8)) % (spread + 400)) - 200;
    const cy = y + r0() * 120, rx = (120 + r0() * 260) * scale, ry = (26 + r0() * 40) * scale;
    c.fillStyle = color;
    c.beginPath(); c.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
};
FILM.rain = (c, t, o = {}) => {
  const { n = 260, color = 'rgba(220,230,255,.5)', len = 26, speed = 900, slant = .18, seed = 2, alpha = 1 } = o;
  const r = FILM.rng('rain' + seed);
  c.save(); c.globalAlpha = alpha; c.strokeStyle = color; c.lineWidth = 1.4;
  for (let i = 0; i < n; i++) {
    const x0 = r() * (W + 200) - 100, y0 = r() * H;
    const y = (y0 + t * speed * (0.5 + r() * .9)) % (H + 100);
    const x = x0 + y * slant;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x - slant * len, y - len); c.stroke();
  }
  c.restore();
};
FILM.stars = (c, t, o = {}) => {
  const { n = 160, color = '#ffffff', seed = 3, alpha = .8 } = o;
  const r = FILM.rng('stars' + seed);
  c.save();
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H * .8, s = .6 + r() * 1.8;
    const tw = .55 + .45 * Math.sin(t * (1 + r() * 2) + i);
    c.globalAlpha = alpha * tw; c.fillStyle = color;
    c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  }
  c.restore();
};
FILM.mist = (c, x, y, w, h, color, a) => { c.fillStyle = FILM.rgrad(c, x, y, 0, Math.max(w, h), [[0, FILM.rgba(color, a)], [1, FILM.rgba(color, 0)]]); c.beginPath(); c.ellipse(x, y, w, h, 0, 0, Math.PI * 2); c.fill(); };

FILM.page = (canvas, opts = {}) => {
  const ctx = canvas.getContext('2d', { alpha: false });
  const env = { ctx, W: opts.w || W, H: opts.h || H };
  env.reset = (bg) => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = bg || '#000'; ctx.fillRect(0, 0, env.W, env.H); };
  return env;
};
})();


