/* rig_lite · 只给 figure.js 用的三个几何原语（不引 rig.js 全量）
   smooth(pts, closed)  Catmull-Rom → Path2D
   taper(A, B, wA, wB, bulge)  锥形肢体
   ik2(S, T, a, b, bendSign)   两骨 IK */
(() => {
  const R = window.RIG = window.RIG || {};
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  R.ik2 = (S, T, a, b, bendSign = 1) => {
    let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
    d = Math.min(d, a + b - 0.01);
    const ang = Math.atan2(dy, dx), cosA = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
    const e = ang + bendSign * Math.acos(cosA);
    const E = [S[0] + Math.cos(e) * a, S[1] + Math.sin(e) * a];
    const H = [S[0] + Math.cos(ang) * d, S[1] + Math.sin(ang) * d];
    return { E, H };
  };

  R.smooth = (pts, closed = true, k = 0.5) => {
    const p = new Path2D(), n = pts.length;
    if (n < 2) return p;
    const P_ = i => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    p.moveTo(...pts[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P_(i - 1), p1 = P_(i), p2 = P_(i + 1), p3 = P_(i + 2);
      p.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * k / 3, p1[1] + (p2[1] - p0[1]) * k / 3,
        p2[0] - (p3[0] - p1[0]) * k / 3, p2[1] - (p3[1] - p1[1]) * k / 3,
        p2[0], p2[1]);
    }
    if (closed) p.closePath();
    return p;
  };

  R.taper = (A, B, wA, wB, bulge = 0) => {
    const a = Math.atan2(B[1] - A[1], B[0] - A[0]), nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
    const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], wM = (wA + wB) / 2 + bulge;
    return R.smooth([
      [A[0] + nx * wA / 2, A[1] + ny * wA / 2],
      [M[0] + nx * wM / 2, M[1] + ny * wM / 2],
      [B[0] + nx * wB / 2, B[1] + ny * wB / 2],
      [B[0] + Math.cos(a) * wB * 0.35, B[1] + Math.sin(a) * wB * 0.35],
      [B[0] - nx * wB / 2, B[1] - ny * wB / 2],
      [M[0] - nx * wM / 2, M[1] - ny * wM / 2],
      [A[0] - nx * wA / 2, A[1] - ny * wA / 2],
      [A[0] - Math.cos(a) * wA * 0.3, A[1] - Math.sin(a) * wA * 0.3],
    ]);
  };
})();
