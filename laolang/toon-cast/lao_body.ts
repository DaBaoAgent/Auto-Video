// lao_body.ts — 1980 Shanghai Animation Film Studio caricature, built for the laolang cast.
// Long elastic nose, big almond eye, heavy brow, wide mouth, pear torso, noodle limbs, big hands/shoes.
// Original characters only: no wolf / bear / fox from the reference film is copied.
// Side view faces screen-right. Design canvas 600 x 1000, sole at y = 975.

type LP = [number, number];
const LK = "#241726";

/** closed Catmull-Rom through the control points */
const lcr = (P: LP[], n = 7): LP[] => {
  const out: LP[] = [], N = P.length;
  for (let i = 0; i < N; i++) {
    const p0 = P[(i - 1 + N) % N], p1 = P[i], p2 = P[(i + 1) % N], p3 = P[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
};

/** open Catmull-Rom through the control points */
const lops = (P: LP[], n = 8): LP[] => {
  const out: LP[] = [];
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(P[P.length - 1]);
  return out;
};

/** tapered polygon along an open polyline: widths at each control point */
const ltape = (P: LP[], W: number[]): LP[] => {
  const sm = lops(P, 10), L: LP[] = [], R: LP[] = [];
  for (let i = 0; i < sm.length; i++) {
    const a = sm[Math.max(0, i - 1)], b = sm[Math.min(sm.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = W[Math.min(W.length - 1, Math.round((i / (sm.length - 1)) * (W.length - 1)))] / 2;
    L.push([sm[i][0] - dy * w, sm[i][1] + dx * w]); R.push([sm[i][0] + dy * w, sm[i][1] - dx * w]);
  }
  return [...L, ...R.reverse()];
};

const lmul = (c: string, k: number) => mul(c, [k, k, k]);
const lskin = (o: any) => o.skin || "#d6ab7a";
const lstroke = (p: Pen, P: LP[], w0: number, w1: number, col = LK) => {
  const sm = lops(P, 8), L: LP[] = [], R: LP[] = [];
  for (let i = 0; i < sm.length; i++) {
    const a = sm[Math.max(0, i - 1)], b = sm[Math.min(sm.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const w = (w0 + (w1 - w0) * (i / (sm.length - 1))) / 2;
    L.push([sm[i][0] - dy * w, sm[i][1] + dx * w]); R.push([sm[i][0] + dy * w, sm[i][1] - dx * w]);
  }
  p.poly([...L, ...R.reverse()], col, 0);
};


/** one hand: palm + thumb + three fingers; angle in radians points along the fingers */
const lhand = (p: Pen, x: number, y: number, ang: number, s: number, skin: string, kind = "palm") => {
  const c = Math.cos(ang), sn = Math.sin(ang);
  p.ell(x, y, 18 * s, 15 * s, skin, 3.2 * s, 0, 360, (ang * 180) / Math.PI);
  if (kind === "fist") {
    p.stroke([[x - c * 4 * s - sn * 12 * s, y - sn * 4 * s + c * 12 * s], [x + c * 6 * s - sn * 14 * s, y + sn * 6 * s + c * 14 * s]], 7 * s, skin);
    p.stroke([[x - c * 4 * s, y - sn * 4 * s], [x - c * 8 * s, y - sn * 8 * s]], 1.8 * s, lmul(skin, 0.72));
  } else if (kind === "point") {
    p.stroke([[x + c * 6 * s, y + sn * 6 * s], [x + c * 30 * s, y + sn * 30 * s]], 7.5 * s, skin);
    p.dot(x + c * 31 * s, y + sn * 31 * s, 4 * s, skin);
    p.stroke([[x - c * 2 * s - sn * 13 * s, y - sn * 2 * s + c * 13 * s], [x + c * 7 * s - sn * 16 * s, y + sn * 7 * s + c * 16 * s]], 7 * s, skin);
  } else {
    for (let i = -1; i <= 1; i++) {
      const ox = -sn * i * 8 * s, oy = c * i * 8 * s;
      p.stroke([[x + c * 10 * s + ox, y + sn * 10 * s + oy], [x + c * 25 * s + ox, y + sn * 25 * s + oy]], 8 * s, skin);
      p.dot(x + c * 25 * s + ox, y + sn * 25 * s + oy, 4 * s, skin);
    }
    p.stroke([[x - c * 1 * s - sn * 16 * s, y - sn * 1 * s + c * 16 * s], [x + c * 9 * s - sn * 19 * s, y + sn * 9 * s + c * 19 * s]], 8.5 * s, skin);
  }
  p.ell(x, y, 18 * s, 15 * s, null, 2.6 * s, 0, 360, (ang * 180) / Math.PI);
  p.stroke([[x - c * 6 * s, y - sn * 6 * s], [x - c * 10 * s, y - sn * 10 * s]], 2 * s, lmul(skin, 0.72));
};

/** a big soft shoe, ankle at x,y, toe forward (+x) */
const lshoe = (p: Pen, x: number, y: number, pitch: number, col: string, s: number) => {
  const P: LP[] = [[-20, -12], [-8, -20], [12, -18], [30, -10], [44, 0], [44, 12], [22, 18], [-8, 17], [-22, 9], [-24, -2]];
  const c = Math.cos(pitch), sn = Math.sin(pitch);
  p.poly(lcr(P.map(([a, b]) => [x + (a * c - b * sn) * s, y + (a * sn + b * c) * s])), col, 3.6 * s);
  p.stroke([[x + (2 * c - 15 * sn) * s, y + (2 * sn + 15 * c) * s], [x + (34 * c - 13 * sn) * s, y + (34 * sn + 13 * c) * s]], 2.4 * s, lmul(col, 0.6));
};

type LX = { browY: number; browIn: number; eyeW: number; eyeH: number; lid: number; pupil: number; lookX: number; lookY: number; open: number; smile: number; teeth: number; tongue: number; jaw: number };

const LEX: Record<string, LX> = {
  neutral: { browY: 0, browIn: 0, eyeW: 1.04, eyeH: 0.95, lid: 0.22, pupil: 0.95, lookX: 0, lookY: 0, open: 0.05, smile: 0.05, teeth: 0, tongue: 0, jaw: 0 },
  curious: { browY: -7, browIn: -5, eyeW: 1.08, eyeH: 1.1, lid: 0, pupil: 1.02, lookX: 4, lookY: -5, open: 0.12, smile: 0.2, teeth: 0, tongue: 0, jaw: 0 },
  stern: { browY: 5, browIn: 11, eyeW: 0.96, eyeH: 0.72, lid: 0.36, pupil: 0.95, lookX: 1, lookY: 0, open: 0.03, smile: -0.34, teeth: 0, tongue: 0, jaw: 0 },
  nervous: { browY: -5, browIn: -10, eyeW: 1.04, eyeH: 1.04, lid: 0.02, pupil: 0.78, lookX: 7, lookY: 1, open: 0.18, smile: -0.1, teeth: 0, tongue: 0, jaw: 0 },
  shock: { browY: -10, browIn: -8, eyeW: 1.16, eyeH: 1.42, lid: 0, pupil: 0.5, lookX: 0, lookY: 0, open: 0.95, smile: 0, teeth: 0, tongue: 0, jaw: 0.9 },
  effort: { browY: 7, browIn: 13, eyeW: 0.94, eyeH: 0.56, lid: 0.44, pupil: 0.9, lookX: 3, lookY: 1, open: 0.32, smile: -0.12, teeth: 1, tongue: 0, jaw: 0.25 },
  grin: { browY: -5, browIn: -2, eyeW: 0.94, eyeH: 0.48, lid: 0.54, pupil: 1, lookX: 1, lookY: 0, open: 0.5, smile: 1, teeth: 1, tongue: 0, jaw: 0.35 },
  laugh: { browY: -7, browIn: -5, eyeW: 0.94, eyeH: 0.2, lid: 0.84, pupil: 1, lookX: 0, lookY: 0, open: 1, smile: 1, teeth: 1, tongue: 1, jaw: 1 },
  smile: { browY: -2, browIn: -1, eyeW: 0.98, eyeH: 0.7, lid: 0.26, pupil: 1, lookX: 1, lookY: 0, open: 0.1, smile: 0.66, teeth: 0, tongue: 0, jaw: 0 },
  pained: { browY: 7, browIn: 10, eyeW: 0.95, eyeH: 0.38, lid: 0.52, pupil: 1, lookX: 1, lookY: 1, open: 0.24, smile: -0.22, teeth: 1, tongue: 0, jaw: 0.22 },
  sad: { browY: 5, browIn: 9, eyeW: 0.96, eyeH: 0.7, lid: 0.3, pupil: 1, lookX: 2, lookY: 4, open: 0.05, smile: -0.2, teeth: 0, tongue: 0, jaw: 0 },
  dazed: { browY: 2, browIn: 4, eyeW: 1, eyeH: 1, lid: 0.08, pupil: 0.34, lookX: 4, lookY: 3, open: 0.24, smile: 0, teeth: 0, tongue: 0, jaw: 0.1 },
};
const lexOf = (expr: string, lid: number): LX => {
  const e = LEX[expr] || LEX.neutral;
  return lid >= 1 ? { ...e, lid: 1 } : lid > 0 ? { ...e, lid: Math.max(e.lid, lid) } : e;
};

/** almond eye, pupil, heavy upper lid; x,y = eye centre */
const leye = (p: Pen, x: number, y: number, w: number, h: number, lookX: number, lookY: number, pupil: number, lid: number, skin: string) => {
  const a: LP = [x - w / 2, y + 2], b: LP = [x + w / 2, y - 2];
  const cu: LP = [x + w * 0.03, y - h * 1.18], cl: LP = [x - w * 0.02, y + h * 0.8];
  const up: LP[] = [], lo: LP[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    up.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cu[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cu[1] + t * t * b[1]]);
    lo.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cl[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cl[1] + t * t * b[1]]);
  }
  const shape = [...up, ...lo.reverse()];
  if (lid >= 1) {
    p.poly(shape, skin, 2.6);
    p.stroke([[x - w / 2 - 1, y + 1], [x + w / 2 + 1, y - 1]], 4.4, LK);
    return;
  }
  p.poly(shape, "#fffdf4", 2.5);
  p.ell(x + lookX, y + lookY, 5.4 * pupil, 6.6 * pupil, LK, 0);
  p.dot(x + lookX + 2.2 * pupil, y + lookY - 2.6 * pupil, 1.4 * pupil, "#fffdf4");
  if (lid > 0) {
    const cy = y - h * 0.5 + lid * h * 0.7;
    p.clip(shape, () => p.poly([...shape.map(([u0, v0]) => [u0, Math.min(v0, cy)] as LP), ...shape.map(() => [x + w / 2, cy] as LP), [x - w / 2, cy]], skin, 0));
    p.stroke([[x - w / 2, cy + 1], [x + w / 2, cy - 1]], 4.4, LK);
  }
  p.stroke(up, 5.2, LK);
  p.stroke([[x + w * 0.05, y + h * 0.5], [x + w * 0.3, y + h * 0.28]], 1.4, lmul(skin, 0.68));
};

const lbrow = (p: Pen, x: number, y: number, w: number, browY: number, browIn: number, col = LK) => {
  const inner: LP = [x - w * 0.42, y + 7 + browIn], mid: LP = [x + w * 0.02, y - 2 + browY], outer: LP = [x + w * 0.5, y + 8 + browY];
  p.poly(lcr([inner, mid, outer, [x + w * 0.47, y + 16 + browY], [x, y + 8 + browY], [x - w * 0.36, y + 16 + browIn]], 4), col, 0);
};

/** side mouth: hinge near the nose, corner back toward the ear */
const lmouth = (p: Pen, hx: number, hy: number, s: number, e: LX, lip: string, fx = 1, fy = 1) => {
  const mx = hx + 100 * s * fx, my = hy + 54 * s * fy, bx = hx + 20 * s * fx, by = hy + 54 * s * fy - e.smile * 12 * s * fy;
  const open = e.open;
  if (open < 0.12) {
    p.stroke(lops([[mx, my], [mx - 22 * s * fx, my + 3 * s * fy], [bx, by]], 8), 4.2 * s, LK);
    lstroke(p, [[mx - 4 * s * fx, my + 9 * s * fy], [mx - 24 * s * fx, my + 10 * s * fy]], 4 * s, 2 * s, lmul(lip, 0.78));
    if (e.smile > 0.2) p.stroke(lops([[bx + 2 * s * fx, by + 3 * s * fy], [bx - 8 * s * fx, by + 12 * s * fy]], 5), 2 * s, LK);
    else if (e.smile < -0.05) p.stroke(lops([[bx + 2 * s * fx, by - 2 * s * fy], [bx - 10 * s * fx, by + 7 * s * fy]], 5), 2 * s, LK);
    return;
  }
  const drop = (24 + 34 * open + 12 * e.jaw) * s * fy;
  if (e.teeth > 0.8 && open < 0.5) {
    const G: LP = [[mx - 2 * s * fx, my - 3 * s * fy], [bx + 3 * s * fx, by - 1 * s * fy], [bx + 1 * s * fx, by + 16 * s * fy], [mx - 4 * s * fx, my + 16 * s * fy]];
    p.poly(lcr(G, 5), "#fff6e4", 3.2 * s);
    for (let i = 1; i < 4; i++) p.stroke([[mx + (bx - mx) * i / 4, my - 2 * s * fy], [mx + (bx - mx) * i / 4 - 2 * s * fx, my + 15 * s * fy]], 1.6 * s, "rgba(42,33,26,.5)");
    p.stroke(lops([[mx, my - 3 * s * fy], [mx - 20 * s * fx, my], [bx, by - 1 * s * fy]], 8), 3 * s, LK);
    return;
  }
  const P: LP[] = [[mx + 2 * s * fx, my - 3 * s * fy], [mx - 18 * s * fx, my - 4 * s * fy], [bx, by], [bx - 2 * s * fx, by + drop * 0.55], [mx - 10 * s * fx, my + drop], [mx + 2 * s * fx, my + drop * 0.8]];
  const shape = lcr(P, 6);
  p.poly(shape, "#5a1e28", 3.4 * s);
  p.clip(shape, () => {
    if (e.teeth > 0.35) {
      p.poly([[mx + 2 * s * fx, my - 2 * s * fy], [bx + 2 * s * fx, by - 1 * s * fy], [bx, by + 9 * s * fy], [mx, my + 8 * s * fy]], "#fff6e4", 0);
      for (let i = 1; i < 4; i++) p.stroke([[mx + (bx - mx) * i / 4, my - 2 * s * fy], [mx + (bx - mx) * i / 4 - 1 * s * fx, my + 7 * s * fy]], 1.2 * s, "rgba(42,33,26,.35)");
    }
    if (e.tongue > 0.4) p.ell(mx - 16 * s * fx, my + drop * 0.68, 14 * s, 7 * s, "#e86e78", 0);
  });
  p.stroke(lops([[bx - 2 * s * fx, by + drop * 0.5], [mx - 12 * s * fx, my + drop * 0.92]], 8), 2.4 * s, lip);
  if (e.smile > 0.5) p.stroke(lops([[bx - 2 * s * fx, by + 2 * s * fy], [bx - 16 * s * fx, by - 4 * s * fy]], 5), 2.2 * s, LK);
};

/** side head + face, centred at hx,hy; face shape from o.face, hair from o.hairStyle */
const lheadSide = (p: Pen, o: any, hx: number, hy: number, s: number, expr: string, lid: number) => {
  const skin = lskin(o), e = lexOf(expr, lid), jaw = e.jaw;
  const face = o.face || "long";
  const kf = o.faceK || {};
  const fx = (face === "round" ? 1.12 : face === "square" ? 1.08 : 1) * (kf.fx || 1);
  const fy = (face === "round" ? 0.9 : face === "square" ? 0.97 : 1) * (kf.fy || 1);
  const noseK = kf.nose || 1, jawK = kf.jaw || 0;
  const H = (x: number, y: number): LP => {
    let X = hx + (x - hx) * s * fx;
    const Y = hy + (y - hy) * s * fy;
    if (y - hy > 40) X += (x - hx) * s * (0.06 * (face === "square" ? 1 : 0) + jawK);
    if (x - hx > 70) X = hx + 70 * s * fx + (X - (hx + 70 * s * fx)) * noseK;
    return [X, Y];
  };
  const C: LP[] = [
    [hx - 4, hy - 116], [hx + 44, hy - 104], [hx + 76, hy - 72], [hx + 80, hy - 44], [hx + 74, hy - 30],
    [hx + 92, hy - 22], [hx + 102, hy - 8], [hx + 114, hy + 8], [hx + 118, hy + 22], [hx + 114, hy + 36],
    [hx + 126, hy + 46], [hx + 112, hy + 50], [hx + 116, hy + 58], [hx + 110, hy + 66], [hx + 114, hy + 74 + jaw * 4],
    [hx + 116, hy + 86], [hx + 104, hy + 98 + jaw * 12], [hx + 82, hy + 106 + jaw * 14], [hx + 46, hy + 110 + jaw * 10],
    [hx + 2, hy + 104], [hx - 44, hy + 102], [hx - 76, hy + 78], [hx - 96, hy + 44], [hx - 100, hy + 8],
    [hx - 92, hy - 38], [hx - 72, hy - 78], [hx - 36, hy - 104],
  ].map(([x, y]) => H(x, y));
  const shape = lcr(C, 6);
  p.poly(shape, skin, 0);
  p.clip(shape, () => {
    p.poly([H(hx - 104, hy - 6), H(hx - 42, hy - 18), H(hx - 34, hy + 46), H(hx - 52, hy + 92), H(hx - 96, hy + 56)], lmul(skin, 0.85), 0);
    p.poly([H(hx + 26, hy + 14), H(hx + 60, hy + 16), H(hx + 68, hy + 30), H(hx + 50, hy + 36), H(hx + 30, hy + 28)], lmul(skin, 0.92), 0);
  });
  p.inkRing(shape, 4.4 * s, Math.atan2(0.55, -0.83), 0.42);
  // nose crease + nostril
  lstroke(p, [H(hx + 78, hy - 30), H(hx + 90, hy + 2), H(hx + 108, hy + 30)], 3.2 * s, 1.2 * s, lmul(skin, 0.64));
  p.arc(hx + 120 * s * fx, hy + 36 * s * fy, 9 * s, 6 * s, 15, 150, 2.2 * s, lmul(skin, 0.58));
  // eye + brow
  const ex = hx + 56 * s * fx, ey = hy - 15 * s * fy;
  leye(p, ex, ey, 64 * s * e.eyeW * (kf.eye || 1), 44 * s * e.eyeH * (kf.eye || 1), e.lookX * s, e.lookY * s, e.pupil, e.lid, skin);
  lbrow(p, ex + 2 * s, ey - 32 * s, 72 * s * (kf.brow || 1), e.browY * s, e.browIn * s, o.browCol || LK);
  // jaw plane
  const J: LP[] = [H(hx + 24, hy + 46), H(hx + 70, hy + 40), H(hx + 104, hy + 52), H(hx + 110, hy + 84), H(hx + 98, hy + 106), H(hx + 70, hy + 114), H(hx + 40, hy + 104), H(hx + 24, hy + 80)];
  p.poly(lcr(J, 6), lmul(skin, 0.985), 0);
  lstroke(p, [H(hx + 24, hy + 80), H(hx + 40, hy + 104), H(hx + 70, hy + 114), H(hx + 96, hy + 106)], 2.6 * s, 1.2 * s, lmul(skin, 0.68));
  // mouth
  lmouth(p, hx, hy, s, e, lmul(skin, 0.55), fx, fy);
  if (o.age) {
    p.stroke(lops([H(hx + 26, hy - 58), H(hx + 48, hy - 62), H(hx + 66, hy - 56)], 7), 2.2 * s, lmul(skin, 0.74));
    p.stroke(lops([H(hx + 30, hy - 44), H(hx + 52, hy - 47)], 5), 1.8 * s, lmul(skin, 0.76));
    p.stroke(lops([H(hx + 80, hy + 64), H(hx + 94, hy + 78), H(hx + 90, hy + 94)], 6), 2 * s, lmul(skin, 0.72));
  }
  // beard + moustache (role layer)
  if (o.beard) {
    const bc = o.beard, bl = o.beardLen || 1;
    p.poly([H(hx - 56, hy + 20), H(hx - 38, hy + 24), H(hx - 18, hy + 64), H(hx - 34, hy + 72)], bc, 2.4 * s);
    p.poly(lcr([H(hx - 18, hy + 62), H(hx + 20, hy + 78), H(hx + 60, hy + 86), H(hx + 92, hy + 80), H(hx + 98, hy + 96), H(hx + 80, hy + 110 + 10 * bl), H(hx + 48, hy + 116 + 30 * bl), H(hx + 20, hy + 106 + 20 * bl), H(hx - 8, hy + 92)], 6), bc, 3 * s);
    p.poly(lcr([H(hx + 64, hy + 40), H(hx + 88, hy + 38), H(hx + 106, hy + 46), H(hx + 92, hy + 56), H(hx + 70, hy + 50)], 5), bc, 2.2 * s);
  }
  // headwear beyond the soft cap (role layer)
  if (o.hat === "turban") {
    p.poly(lcr([H(hx - 88, hy - 66), H(hx - 84, hy - 104), H(hx - 50, hy - 126), H(hx + 6, hy - 132), H(hx + 58, hy - 120), H(hx + 84, hy - 92), H(hx + 86, hy - 66), H(hx + 20, hy - 58), H(hx - 44, hy - 60)], 5), o.cap || '#c9a24a', 4 * s);
    for (let i = 1; i <= 3; i++) p.stroke([H(hx - 82, hy - 66 - i * 14), H(hx + 20, hy - 60 - i * 14), H(hx + 82, hy - 70 - i * 14)], 2.4 * s, lmul(o.cap || '#c9a24a', 0.72));
    p.poly([H(hx + 60, hy - 92), H(hx + 78, hy - 88), H(hx + 76, hy - 74), H(hx + 58, hy - 78)], '#b23a2b', 2 * s);
  } else if (o.hat === "crown") {
    p.poly(lcr([H(hx - 82, hy - 66), H(hx - 78, hy - 100), H(hx - 46, hy - 118), H(hx + 10, hy - 122), H(hx + 56, hy - 110), H(hx + 80, hy - 86), H(hx + 82, hy - 66), H(hx + 20, hy - 58), H(hx - 42, hy - 60)], 5), o.cap || '#c9a24a', 4 * s);
    p.poly([H(hx - 10, hy - 120), H(hx + 4, hy - 150), H(hx + 18, hy - 120)], lmul(o.cap || '#c9a24a', 1.08), 3 * s);
    p.stroke([H(hx - 80, hy - 72), H(hx + 80, hy - 70)], 3 * s, '#8a5a2c');
  } else if (o.hat === "official") {
    p.poly(lcr([H(hx - 80, hy - 70), H(hx - 76, hy - 100), H(hx - 40, hy - 118), H(hx + 20, hy - 120), H(hx + 64, hy - 104), H(hx + 80, hy - 78), H(hx + 20, hy - 66), H(hx - 42, hy - 68)], 5), '#2a211a', 4 * s);
    p.poly([H(hx - 2, hy - 74), H(hx + 130, hy - 80), H(hx + 134, hy - 68), H(hx + 2, hy - 64)], '#2a211a', 3 * s);
    p.poly([H(hx - 4, hy - 74), H(hx - 130, hy - 82), H(hx - 134, hy - 70), H(hx - 4, hy - 64)], '#2a211a', 3 * s);
  } else if (o.hat === "fur") {
    p.poly(lcr([H(hx - 90, hy - 64), H(hx - 88, hy - 100), H(hx - 54, hy - 122), H(hx + 8, hy - 128), H(hx + 62, hy - 114), H(hx + 88, hy - 84), H(hx + 90, hy - 62), H(hx + 20, hy - 54), H(hx - 46, hy - 56)], 5), o.cap || '#5a4632', 4 * s);
    for (let i = 0; i < 7; i++) p.dot(hx - 66 + i * 20, hy - 66, 4 * s, lmul(o.cap || '#5a4632', 1.25));
  } else if (o.hat === "helmet") {
    p.poly(lcr([H(hx - 86, hy - 66), H(hx - 82, hy - 102), H(hx - 44, hy - 122), H(hx + 14, hy - 126), H(hx + 62, hy - 110), H(hx + 84, hy - 86), H(hx + 86, hy - 64), H(hx + 20, hy - 56), H(hx - 44, hy - 58)], 5), '#6a7a82', 4 * s);
    p.poly([H(hx - 10, hy - 124), H(hx + 2, hy - 156), H(hx + 14, hy - 124)], '#8a9aa2', 2.6 * s);
    p.poly([H(hx - 90, hy - 50), H(hx - 62, hy - 44), H(hx - 66, hy + 20), H(hx - 92, hy + 12)], '#4a5a62', 3 * s);
  } else if (o.hat === "band") {
    p.poly([H(hx - 84, hy - 58), H(hx + 82, hy - 56), H(hx + 80, hy - 42), H(hx - 86, hy - 44)], o.cap || '#8a3a2c', 3 * s);
    p.poly([H(hx - 86, hy - 46), H(hx - 120, hy - 30), H(hx - 112, hy - 14), H(hx - 80, hy - 34)], o.cap || '#8a3a2c', 2.4 * s);
  } else if (o.hat === "scholar") {
    p.poly(lcr([H(hx - 84, hy - 64), H(hx - 80, hy - 92), H(hx - 48, hy - 108), H(hx + 12, hy - 112), H(hx + 58, hy - 100), H(hx + 80, hy - 78), H(hx + 82, hy - 64), H(hx + 20, hy - 58), H(hx - 44, hy - 60)], 5), '#2a211a', 3.8 * s);
    p.stroke([H(hx - 84, hy - 66), H(hx + 82, hy - 64)], 4 * s, '#1a1410');
    p.poly([H(hx + 28, hy - 104), H(hx + 64, hy - 96), H(hx + 62, hy - 76), H(hx + 26, hy - 84)], lmul('#2a211a', 1.25), 2.4 * s);
  } else if (o.hat === "pith") {
    p.ell(hx + 10 * s * fx, hy - 76 * s * fy, 118 * s, 15 * s, '#c9b98a', 3.4 * s);
    p.poly(lcr([H(hx - 78, hy - 80), H(hx - 72, hy - 106), H(hx - 40, hy - 120), H(hx + 20, hy - 120), H(hx + 60, hy - 106), H(hx + 76, hy - 84), H(hx + 20, hy - 74), H(hx - 40, hy - 76)], 5), '#d8c9a0', 3.8 * s);
    p.stroke([H(hx - 76, hy - 84), H(hx + 76, hy - 82)], 4 * s, '#8a6a44');
  }
  // hair (drawn under the hat, over the skull)
  const hair = o.hair || "#2a211a";
  if (o.hairStyle === "part") {
    p.poly(lcr([H(hx - 94, hy - 10), H(hx - 90, hy - 60), H(hx - 72, hy - 104), H(hx - 30, hy - 126), H(hx + 20, hy - 128), H(hx + 62, hy - 112), H(hx + 80, hy - 86), H(hx + 78, hy - 70), H(hx + 54, hy - 78), H(hx + 24, hy - 86), H(hx - 10, hy - 80), H(hx - 44, hy - 64), H(hx - 62, hy - 30)], 5), hair, 3.2 * s);
    lstroke(p, [H(hx + 34, hy - 118), H(hx + 26, hy - 96), H(hx + 34, hy - 78)], 2.6 * s, 1 * s, lmul(hair, 1.45));
    p.poly(lcr([H(hx + 12, hy - 98), H(hx + 58, hy - 88), H(hx + 82, hy - 72), H(hx + 70, hy - 58), H(hx + 44, hy - 66), H(hx + 18, hy - 78)], 5), lmul(hair, 1.08), 2.4 * s);
    p.poly([H(hx - 62, hy - 40), H(hx - 48, hy - 38), H(hx - 44, hy + 18), H(hx - 58, hy + 30)], hair, 2.4 * s);
  } else if (o.hairStyle === "bald") {
    p.poly(lcr([H(hx - 94, hy + 10), H(hx - 92, hy - 24), H(hx - 76, hy - 44), H(hx - 58, hy - 40), H(hx - 52, hy - 6), H(hx - 54, hy + 34), H(hx - 70, hy + 50), H(hx - 88, hy + 40)], 5), hair, 3 * s);
    p.poly([H(hx - 86, hy + 20), H(hx - 64, hy + 14), H(hx - 60, hy + 40), H(hx - 80, hy + 52)], hair, 2.4 * s);
    p.stroke(lops([H(hx - 30, hy - 96), H(hx - 6, hy - 102), H(hx + 18, hy - 98)], 6), 3 * s, lmul(skin, 1.07));
  } else if (o.hairStyle === "buzz") {
    p.poly(lcr([H(hx - 92, hy - 20), H(hx - 88, hy - 56), H(hx - 68, hy - 80), H(hx - 30, hy - 94), H(hx + 20, hy - 94), H(hx + 56, hy - 80), H(hx + 70, hy - 60), H(hx + 64, hy - 48), H(hx + 30, hy - 60), H(hx - 20, hy - 64), H(hx - 58, hy - 52), H(hx - 78, hy - 30)], 5), hair, 3 * s);
    p.poly([H(hx - 60, hy - 26), H(hx - 44, hy - 24), H(hx - 40, hy + 26), H(hx - 56, hy + 36)], hair, 2.6 * s);
  }
  // ear
  const earX = hx - 88 * s * fx, earY = hy + 22 * s * fy;
  p.ell(earX, earY, 16 * s, 22 * s, lmul(skin, 0.97), 3.8 * s);
  p.stroke(lops([[earX, earY - 14 * s], [earX - 8 * s * fx, earY], [earX, earY + 14 * s]], 8), 3 * s, lmul(skin, 0.7));
  p.ell(earX, earY, 6 * s, 9 * s, null, 1.8 * s);

  if (o.monk) p.stroke(lops([H(hx - 30, hy - 100), H(hx, hy - 108), H(hx + 30, hy - 100)], 6), 3 * s, lmul(skin, 1.08));
  // hat: only for 'cap'; 'none' leaves the hair visible
  const cap = o.cap || lmul(o.jacket, 0.7);
  if (o.hat === "cap") {
    if (o.brim) {
      p.ell(hx + 22 * s * fx, hy - 78 * s * fy, 112 * s, 14 * s, o.brim, 3.4 * s);
      p.ell(hx + 22 * s * fx, hy - 74 * s * fy, 112 * s, 14 * s, lmul(o.brim, 0.82), 0);
    }
    p.poly(lcr([H(hx - 86, hy - 90), H(hx - 80, hy - 114), H(hx - 44, hy - 128), H(hx + 12, hy - 132), H(hx + 62, hy - 124), H(hx + 86, hy - 100), H(hx + 88, hy - 80), H(hx + 26, hy - 72), H(hx - 42, hy - 74)], 5), cap, 4 * s);
    p.poly(lcr([H(hx - 82, hy - 74), H(hx - 40, hy - 80), H(hx + 20, hy - 82), H(hx + 72, hy - 74), H(hx + 74, hy - 62), H(hx + 20, hy - 66), H(hx - 40, hy - 66), H(hx - 84, hy - 60)], 5), lmul(cap, 0.7), 3 * s);
    if (!o.brim) p.poly(lcr([H(hx + 64, hy - 76), H(hx + 134, hy - 66), H(hx + 132, hy - 52), H(hx + 62, hy - 58)], 5), lmul(cap, 0.76), 3 * s);
    p.dot(hx - 4 * s * fx, hy - 142 * s * fy, 3 * s, lmul(cap, 0.7));
  }
  // glasses
  if (o.glasses) {
    p.ell(ex, ey, 30 * s, 26 * s, null, 2.9 * s);
    p.stroke([[ex - 30 * s, ey - 1 * s], [hx - 64 * s * fx, ey + 3 * s]], 2.2 * s);
  }
  // scarf
  if (o.scarf) {
    p.poly(lcr([H(hx - 58, hy + 112), H(hx + 50, hy + 116), H(hx + 54, hy + 142), H(hx - 62, hy + 138)], 5), o.scarf, 3 * s);
    p.poly(lcr([H(hx + 22, hy + 134), H(hx + 46, hy + 140), H(hx + 42, hy + 184), H(hx + 14, hy + 160)], 5), o.scarf, 2.6 * s);
    p.stroke([H(hx + 20, hy + 152), H(hx + 15, hy + 170)], 1.8 * s, lmul(o.scarf, 0.7));
  }
};

const lbodySide = (p: Pen, o: any, opts: SideOpts) => {
  const { phase = 0, expr = "neutral", mode = "stand", blink = false, stomp = 1, pose = 0, stride = 1, light = -2.1 } = opts;
  const skin = lskin(o), lid = lidOf(blink), two = Math.PI * 2;
  const stout = o.build === "stout";
  const s = (o.head ?? 1) * 1.08 * (stout ? 1.02 : 1);
  const AP = opts.actPose || (window.LAO_POSE || {})[opts.act || ""] || null;
  const actT = opts.actT || 0;
  const straightArm = (opts as any).straightArm === true;
  let armWrist: LP | null = null;
  const sole = 975, hipY = 850, S = 170 * (AP?.run ? 1.5 : stride);
  if (AP?.sit) { p.g.save(); p.g.translate(0, 190); p.g.scale(0.82, 0.82); }
  if (AP?.hip) { p.g.save(); p.g.translate(0, AP.hip); }
  const st = (ph: number) => {
    const c = (((phase + ph) % 1) + 1) % 1;
    if (c < 0.5) { const k = c / 0.5; return { x: S / 2 - S * k, h: 0, stance: true, s: k }; }
    const k = (c - 0.5) / 0.5;
    return { x: -S / 2 + S * k - (S / Math.PI) * Math.sin(2 * Math.PI * k), h: ((AP?.run ? 36 : 22) + 16 * (stomp - 1)) * Math.sin(Math.PI * k), stance: false, s: k };
  };
  const nL = st(0), fL = st(0.5);
  const bob = mode === "march" ? 5 * Math.cos(2 * two * phase) : 0;
  const lean = AP ? (AP.lean ?? 0) : (mode === "push" ? 11 * pose : mode === "march" ? 3 : 0);
  // ---- half-length legs ----
  const legLen = 125, l1 = legLen * 0.52, l2 = legLen * 0.48;
  const legs: { ank: LP; pitch: number; near: boolean }[] = [];
  if (mode === "march") {
    for (const [L, near] of [[fL, false], [nL, true]] as const)
      legs.push({ ank: [300 + (near ? 46 : -46) + L.x * 0.9, sole - 8 - L.h], pitch: L.stance ? 0 : 0.34 * Math.sin(Math.PI * L.s), near });
  } else if (mode === "push") {
    legs.push({ ank: [300 - 66 - 10 * pose, sole - 6], pitch: -0.05, near: false }, { ank: [300 + 62 + 12 * pose, sole - 6], pitch: 0.06, near: true });
  } else {
    legs.push({ ank: [300 - 56, sole - 6], pitch: -0.02, near: false }, { ank: [300 + 56, sole - 6], pitch: 0.04, near: true });
  }
  if (!AP?.kneel && !AP?.sit) {
  for (const L of legs) {
    const hip: LP = [300 + (L.near ? 26 : -26), hipY - bob];
    const knee = mode === "march" ? ik(hip, L.ank, l1, l2) : ([hip[0] + (L.ank[0] - hip[0]) * 0.5 + (L.near ? 7 : -7), (hip[1] + L.ank[1]) / 2] as LP);
    const pants = lmul(o.pants, L.near ? 1 : 0.8);
    p.poly(ltape([hip, [(knee[0] + hip[0]) / 2, (knee[1] + hip[1]) / 2], knee, [(knee[0] + L.ank[0]) / 2, (knee[1] + L.ank[1]) / 2], L.ank], [36, 33, 30, 26, 24]), pants, 3.4);
    p.stroke([[L.ank[0] - 22, L.ank[1] - 4], [L.ank[0] + 16, L.ank[1] - 4]], 6, lmul(pants, 0.55));
    lshoe(p, L.ank[0] + 4, L.ank[1] + 12, L.pitch, lmul(o.boots, L.near ? 1.55 : 1.25), 1.42);
  }
  }
  if (AP?.kneel) {
    for (const [off, near] of [[-10, false], [10, true]] as const) {
      const hipK: LP = [286 + off, 850 + bob];
      const kneeK: LP = [226 + off, 902 + bob];
      const ankK: LP = [166 + off, 936 + bob];
      p.poly(ltape([hipK, kneeK, ankK], [38, 34, 30]), lmul(o.pants, near ? 1 : 0.8), 3.4);
      lshoe(p, ankK[0] - 4, ankK[1] + 10, -1.15, lmul(o.boots, near ? 1.55 : 1.25), 1.42);
    }
  }
  // ---- short, round torso; head sits low ----
  p.rot = lean ? [rad(lean), 300, hipY] : null;
  if (o.pickaxe) {
    p.band([[206, 836 + bob], [342, 500 + bob]], "#6b4a2f", 7, 2);
    p.poly([[334, 508 + bob], [390, 484 + bob], [398, 504 + bob], [344, 526 + bob]], "#4a3a2c", 2.6);
  }
  const widen = stout ? 16 : o.thin ? -14 : 0;
  if (!o.robe) {
  const T: LP[] = [
    [236, 498], [206, 540], [184, 600], [178, 664], [184, 728], [198, 788], [220, 830], [256, 850], [300, 864],
    [344, 850], [376, 830], [400, 788], [420, 728], [426, 664], [420, 600], [398, 540], [364, 502], [330, 496], [294, 490],
  ].map(([x, y]) => [x + (x < 300 ? -widen : widen), y + bob] as LP);
  const tshape = lcr(T, 6);
  p.poly(tshape, o.jacket, 0);
  p.clip(tshape, () => {
    p.poly([[178 - widen, 540 + bob], [250, 520 + bob], [244, 824 + bob], [218, 802 + bob], [184, 650 + bob]], lmul(o.jacket, 0.78), 0);
    p.poly([[338, 540 + bob], [418, 650 + bob], [396, 790 + bob], [352, 824 + bob], [344, 650 + bob]], lmul(o.jacket, 0.93), 0);
    p.stroke([[286, 496 + bob], [300, 548 + bob]], 3.6, lmul(o.jacket, 0.7));
    p.stroke([[334, 498 + bob], [322, 548 + bob]], 3.6, lmul(o.jacket, 0.7));
    p.stroke([[324, 556 + bob], [382, 660 + bob], [414, 780 + bob], [418, 836 + bob]], 2.6, lmul(o.jacket, 0.5));
    for (let i = 0; i < 4; i++) p.dot(390 + i * 3, 590 + i * 62 + bob, 3.8, o.buttons || "#c8b48a");
    p.poly([[298, 592 + bob], [330, 588 + bob], [331, 602 + bob], [299, 606 + bob]], lmul(o.jacket, 0.88), 2);
    p.stroke([[238, 836 + bob], [364, 840 + bob]], 3, lmul(o.jacket, 0.55));
  });
  p.inkRing(tshape, 4.8, Math.atan2(0.5, -0.86), 0.42);
  }
  // ---- long robe (role layer) ----
  if (o.robe) {
    const RT: LP[] = [
      [236, 498], [206, 540], [184, 600], [178, 664], [184, 728], [196, 800], [214, 868], [246, 912], [300, 926],
      [354, 912], [386, 868], [404, 800], [420, 728], [426, 664], [420, 600], [398, 540], [364, 502], [330, 496], [294, 490],
    ].map(([x, y]) => [x + (x < 300 ? -widen : widen), y + bob] as LP);
    const rs = lcr(RT, 6);
    p.poly(rs, o.robe, 0);
    p.clip(rs, () => {
      p.poly([[178 - widen, 540 + bob], [250, 520 + bob], [244, 900 + bob], [218, 880 + bob], [184, 650 + bob]], lmul(o.robe, 0.82), 0);
      p.stroke([[300, 500 + bob], [300, 900 + bob]], 3, lmul(o.robe, 0.55));
      if (o.sash) {
        p.poly([[190, 700 + bob], [410, 700 + bob], [410, 736 + bob], [190, 736 + bob]], o.sash, 3);
        p.poly([[386, 720 + bob], [420, 748 + bob], [404, 820 + bob], [382, 780 + bob]], o.sash, 2.4);
      }
      if (o.kasaya) p.poly([[330, 505 + bob], [356, 540 + bob], [240, 760 + bob], [212, 720 + bob]], o.kasaya, 3);
      if (o.prayer) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; p.dot(300 + Math.cos(a) * 70, 640 + Math.sin(a) * 90 + bob, 4, '#5a3a2a'); }
    });
    p.inkRing(rs, 4.8, Math.atan2(0.5, -0.86), 0.42);
    p.poly(lcr([[246, 505 + bob], [300, 492 + bob], [354, 505 + bob], [374, 566 + bob], [340, 584 + bob], [300, 574 + bob], [260, 584 + bob], [226, 566 + bob]], 5), o.robe, 3.4);
    p.poly([[270, 500 + bob], [330, 502 + bob], [326, 530 + bob], [274, 528 + bob]], lmul(o.robe, 0.8), 2.6);
    p.poly([[286, 500 + bob], [314, 504 + bob], [306, 540 + bob], [300, 560 + bob], [292, 540 + bob]], o.robe, 3);
  }
  if (AP?.sit) {
    const rc = o.robe || o.jacket;
    p.ell(300, 926 + bob, 120, 24, lmul(rc, 0.92), 3.2);
  }
  if (o.armor) {
    p.poly(lcr([[238, 500 + bob], [292, 492 + bob], [300, 556 + bob], [248, 566 + bob]], 5), '#6a7a82', 3.4);
    p.poly(lcr([[306, 494 + bob], [360, 502 + bob], [354, 566 + bob], [304, 558 + bob]], 5), '#6a7a82', 3.4);
    p.poly([[250, 560 + bob], [354, 558 + bob], [348, 690 + bob], [258, 690 + bob]], '#53636c', 3.2);
    for (let i = 0; i < 3; i++) p.stroke([[262, 590 + i * 30 + bob], [344, 588 + i * 30 + bob]], 2, 'rgba(30,30,30,.35)');
  }
  // ---- arms, one third shorter ----
  const drawArm = (shoulder: LP, elbow: LP, wrist: LP, near: boolean, handKind = "palm") => {
    const cloth = o.robe || o.jacket;
    const col = lmul(cloth, near ? 1.18 : 0.72), w = o.robe ? (near ? [64, 56, 50] : [60, 52, 46]) : (near ? [40, 35, 31] : [38, 33, 29]);
    p.poly(ltape([shoulder, elbow, wrist], w), col, 3.4);
    if (near) p.stroke([shoulder, elbow, wrist], 1.4, 'rgba(239,227,196,.38)');
    p.stroke([[wrist[0] - (o.robe ? 15 : 13), wrist[1] - 2], [wrist[0] + (o.robe ? 15 : 13), wrist[1] + 1]], o.robe ? 6 : 4.6, lmul(cloth, near ? 0.72 : 0.6));
    const hAng = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
    lhand(p, wrist[0], wrist[1], hAng, 1.22, lmul(skin, near ? 1 : 0.88), handKind);
  };
  // side view: the far (left) arm is behind the torso; only half the upper arm shows.
  // Actions that need the far hand in front set AP.farFront.
  const drawFar = (shoulder: LP, elbow: LP, wrist: LP, handKind = "palm", front = false) => {
    if (!front) return; // the left arm is fully behind the body in side view
    const root: LP = [342, 540 + bob];
    p.poly(ltape([root, wrist], [30, 26]), lmul(o.robe || o.jacket, 0.72), 3.0);
    lhand(p, wrist[0], wrist[1], Math.atan2(wrist[1] - root[1], wrist[0] - root[0]), 1.1, lmul(skin, 0.88), handKind);
  };
  if ((AP?.run || mode === "march") && straightArm && !(o.staff || o.spear || o.pickaxe || o.book)) {
    const amp = AP?.run ? 0.65 : 0.38;
    const a = -amp * (nL.x / (S / 2));
    const len = AP?.run ? 200 : 190;
    const sx = 300, sy = 496 + bob;
    const ex = sx + Math.sin(a) * len * 0.5, ey = sy + Math.cos(a) * len * 0.5;
    const wx = sx + Math.sin(a) * len, wy = sy + Math.cos(a) * len;
    drawArm([sx, sy], [ex, ey], [wx, wy], true);
    armWrist = [wx, wy];
  } else if (AP) {
    const D = Math.PI / 180;
    const armPts = (sh: LP, a1: number, a2: number, l1 = 78, l2 = 72): [LP, LP, LP] => {
      const e: LP = [sh[0] - Math.sin(a1 * D) * l1, sh[1] + Math.cos(a1 * D) * l1];
      const w: LP = [e[0] - Math.sin(a2 * D) * l2, e[1] + Math.cos(a2 * D) * l2];
      return [sh, e, w];
    };
    const osc = AP.wave ? 14 * Math.sin(actT * 9) : AP.knock ? 12 * Math.sin(actT * 11) : AP.swing ? 38 * Math.sin(actT * 7) : AP.wipe ? 8 * Math.sin(actT * 12) : 0;
    const oscF = AP.wipe ? 10 * Math.sin(actT * 12) : 0;
    const nA = AP.armN || [6, 3], fA = AP.armF || [-6, -3];
    const nP = armPts([300, 496 + bob], nA[0], nA[1] + osc);
    const fP = armPts([214, 514 + bob], fA[0], fA[1] + oscF);
    if (AP.pray) {
      const px = 306, py = 540 + bob, cloth = o.robe || o.jacket;
      p.poly(ltape([[300, 650 + bob], [300, 580 + bob]], [40, 34]), cloth, 3.2);
      p.poly(ltape([[316, 650 + bob], [316, 580 + bob]], [34, 30]), lmul(cloth, 0.85), 3.0);
      p.ell(px - 7, py, 11, 24, lmul(skin, 0.92), 2.6);
      p.ell(px + 7, py, 11, 24, skin, 2.6);
      p.stroke([[px, py - 20], [px, py + 20]], 1.2, "rgba(74,58,40,.35)");
      for (let k = 0; k < 4; k++) {
        p.stroke([[px - 4, py + 18 - k * 5], [px - 4, py + 22 - k * 5]], 1.0, "rgba(74,58,40,.35)");
        p.stroke([[px + 4, py + 18 - k * 5], [px + 4, py + 22 - k * 5]], 1.0, "rgba(74,58,40,.35)");
      }
    } else {
      if (!AP.lookUpFace && !AP.wipe) { drawArm(nP[0], nP[1], nP[2], true, AP.handN || "palm"); armWrist = nP[2]; }
      if (!AP.wipe) drawFar(fP[0], fP[1], fP[2], AP.handF || "palm", !!AP.farFront);
    }
    const wr = nP[2], a2 = (nA[1] + osc) * D;
    if (AP.prop === "knife") {
      const dx = -Math.sin(a2), dy = Math.cos(a2);
      p.poly([[wr[0] - 6 * dy, wr[1] + 6 * dx], [wr[0] + dx * 54 - 8 * dy, wr[1] + dy * 54 + 8 * dx], [wr[0] + dx * 60, wr[1] + dy * 60], [wr[0] + 6 * dy, wr[1] - 6 * dx]], '#c9c9c9', 2.4);
      p.band([[wr[0] - dx * 6, wr[1] - dy * 6], [wr[0] + dx * 6, wr[1] + dy * 6]], '#5a3a2a', 8, 2);
    }
    if (AP.prop === "book") {
      p.poly(lcr([[wr[0] - 4, wr[1] - 6], [wr[0] + 40, wr[1] - 14], [wr[0] + 44, wr[1] + 22], [wr[0], wr[1] + 30]], 5), '#efe3c4', 2.4);
      p.stroke([[wr[0] + 2, wr[1] + 8], [wr[0] + 40, wr[1] + 1]], 1.6, 'rgba(74,58,40,.4)');
    }
    if (AP.prop === "sack") {
      p.poly(lcr([[206, 420 + bob], [286, 404 + bob], [306, 500 + bob], [268, 560 + bob], [204, 540 + bob]], 5), '#9a7a4e', 3.2);
      p.stroke([[216, 440 + bob], [280, 430 + bob]], 2.4, 'rgba(74,58,40,.5)');
    }
    if (AP.lookDownStaff) {
      p.poly(ltape([[420, 590 + bob], [438, 590 + bob]], [26, 22]), lmul(o.robe || o.jacket, 0.8), 2.6);
    }
    if (AP.lookUpStaff) {
      p.poly(ltape([[420, 600 + bob], [438, 600 + bob]], [26, 22]), lmul(o.robe || o.jacket, 0.8), 2.6);
    }
    if (AP.prop === "lantern") {
      const lx = nP[2][0] + 20, ly = nP[2][1] + 4;
      p.band([[nP[2][0], nP[2][1]], [lx, ly + 10]], 3.6, "#4a3524", 1.6);
      p.ell(lx, ly + 38, 28, 36, "rgba(255,217,138,.10)", 0);
      p.poly(lcr([[lx - 24, ly + 16], [lx + 24, ly + 16], [lx + 20, ly + 66], [lx - 20, ly + 66]], 5), "#b23a2b", 3.0);
      p.band([[lx - 24, ly + 16], [lx + 24, ly + 16]], 6, "#d8a53f", 1.8);
      p.band([[lx - 17, ly + 66], [lx + 17, ly + 66]], 5, "#d8a53f", 1.5);
      p.stroke([[lx, ly + 68], [lx, ly + 84]], 1.8, "#d8a53f");
      p.ell(lx, ly + 40, 15, 22, "rgba(255,217,138,.42)", 1.4);
    }
  } else if (mode === "push") {
    drawFar([214, 514 + bob], [254 + 18 * pose, 552 + bob], [296 + 44 * pose, 584 + bob], "palm", false);
    const reach = 44 + 56 * pose;
    drawArm([300, 496 + bob], [386 + reach * 0.55, 552 + bob], [386 + reach, 584 + bob], true);
    armWrist = [386 + reach, 584 + bob];
  } else {
    const sw = mode === "march" ? -0.52 * nL.x / (S / 2) : -0.06;
    drawFar([214, 514 + bob], [196 + 16 * Math.sin(sw), 602 + bob], [188 + 46 * Math.sin(sw * 0.9), 690 + bob], "palm", false);
    const sw2 = mode === "march" ? 0.58 * nL.x / (S / 2) : 0.1;
    if (o.staff || o.spear || o.pickaxe || o.book) {
      const hx = o.staff ? 438 : o.spear ? 450 : o.pickaxe ? 430 : 430;
      drawArm([300, 496 + bob], [355, 555 + bob], [hx, 610 + bob], true);
      armWrist = [hx, 610 + bob];
    } else if (mode === "stand") {
      drawArm([300, 496 + bob], [300, 590 + bob], [300, 680 + bob], true);
      armWrist = [300, 680 + bob];
    } else {
      drawArm([300, 496 + bob], [408 + 18 * Math.sin(sw2), 606 + bob], [416 + 48 * Math.sin(sw2 * 0.85), 694 + bob], true);
      armWrist = [416 + 48 * Math.sin(sw2 * 0.85), 694 + bob];
    }
  }
  // ---- neck + head ----
  const neckY = 470 + bob;
  const neck = lcr([[252, neckY], [348, neckY], [356, 500 + bob], [244, 500 + bob]], 5);
  p.poly(neck, skin, 3.6);
  p.clip(neck, () => p.poly([[248, neckY], [300, neckY], [304, 498 + bob], [248, 498 + bob]], lmul(skin, 0.82), 0));
  const hx = 300, hy = 362 + bob + (AP?.head || 0);
  lheadSide(p, o, hx, hy, s, expr, lid);
  if (AP?.lookUpFace || AP?.wipe) {
    const wx = AP.wipe ? 336 + 8 * Math.sin(actT * 12) : 326;
    const wy = AP.wipe ? 325 : 315;
    // sleeve from the front edge of the chest to the elbow, then bare forearm to the brow
    p.poly(ltape([[345, 500 + bob], [350, 430 + bob], [wx - 4, wy + 12]], [38, 32, 28]), lmul(o.robe || o.jacket, 0.84), 3.2);
    p.poly(ltape([[350, 430 + bob], [wx - 2, wy + 8]], [26, 22]), lmul(skin, 0.96), 2.6);
    lhand(p, wx, wy, -0.4, 1.15, skin, "palm");
  }
  p.rot = null;
  // ---- role props ----
  if (o.staff) {
    if (AP?.pray || AP?.sit) {
      // staff rests diagonally on the near shoulder
      p.band([[190, 930 + bob], [380, 260 + bob]], 7, '#6b4a2f', 1.8);
      p.ell(380, 258 + bob, 14, 14, null, 4);
      p.ell(380, 258 + bob, 7, 7, null, 2.2);
      p.ell(330, 430 + bob, 8, 8, null, 2.6);
    } else {
      p.band([[438, 936 + bob], [438, 300 + bob]], '#6b4a2f', 6, 1.8);
      p.ell(438, 298 + bob, 14, 14, null, 4);
      p.ell(438, 298 + bob, 7, 7, null, 2.4);
      const gy = AP?.lookUpStaff ? 600 : AP?.lookDownStaff ? 590 : 610;
      if (!AP || AP?.lookUpStaff || AP?.lookDownStaff) {
        p.ell(438, gy + bob, 10, 14, skin, 2.6);
        for (let k = 0; k < 3; k++) p.stroke([[429, gy - 8 + k * 5 + bob], [447, gy - 8 + k * 5 + bob]], 1.2, LK);
      }
    }
  }
  if (o.knife && !(AP && AP.prop === "knife")) {
    // sheathed knife at the belt: dark leather, gold trim, handle
    p.poly([[390, 762 + bob], [444, 720 + bob], [454, 734 + bob], [400, 776 + bob]], "#4a3524", 2.4);
    p.poly([[400, 760 + bob], [444, 720 + bob], [448, 728 + bob], [406, 768 + bob]], "#8a6a44", 1.2);
    p.band([[380, 772 + bob], [396, 760 + bob]], "#2a211a", 8, 2);
    p.ell(450, 724 + bob, 3.2, 3.2, null, 1.2);
  }
  if (o.book) {
    p.poly(lcr([[392, 700 + bob], [452, 690 + bob], [458, 730 + bob], [398, 740 + bob]], 5), '#efe3c4', 2.4);
    p.stroke([[398, 712 + bob], [452, 703 + bob]], 1.8, 'rgba(74,58,40,.4)');
  }
  if (o.spear) {
    p.band([[430, 940 + bob], [510, 250 + bob]], '#6b4a2f', 5, 1.6);
    p.poly([[506, 258 + bob], [516, 226 + bob], [526, 258 + bob], [516, 270 + bob]], '#c9c9c9', 2.4);
    if (!AP) { p.ell(450, 610 + bob, 10, 14, skin, 2.6); for (let k = 0; k < 3; k++) p.stroke([[441, 602 + k * 5 + bob], [459, 602 + k * 5 + bob]], 1.2, LK); }
  }
  if (o.warrant) {
    p.poly(lcr([[394, 696 + bob], [450, 686 + bob], [456, 728 + bob], [400, 738 + bob]], 5), '#efe3c4', 2.2);
    p.stroke([[406, 710 + bob], [446, 703 + bob]], 1.6, 'rgba(74,58,40,.4)');
  }
  if (o.telescope) p.band([[398, 700 + bob], [458, 668 + bob]], '#3a3a3a', 13, 2);
  // ---- props ----
  if (o.satchel) {
    p.band([[342, 522 + bob], [250, 790 + bob]], o.satchel, 7, 2);
    p.poly(lcr([[200, 776 + bob], [278, 772 + bob], [282, 838 + bob], [204, 842 + bob]], 5), o.satchel, 3.2);
    p.stroke([[214, 790 + bob], [268, 788 + bob]], 2, lmul(o.satchel, 0.7));
    p.dot(232, 810 + bob, 2.4, lmul(o.satchel, 0.5));
  }
  if (o.lantern && !(AP?.prop === "lantern")) {
    const lx = armWrist ? armWrist[0] : 442;
    const ly = armWrist ? armWrist[1] : 548 + bob;
    p.stroke([[lx, ly - 8], [lx + 1, ly + 14]], 2.6, LK);
    p.poly(lcr([[lx - 17, ly + 14], [lx + 17, ly + 14], [lx + 16, ly + 22], [lx - 16, ly + 22]], 4), "#8a5a2c", 2.4);
    p.poly(lcr([[lx - 15, ly + 22], [lx + 15, ly + 22], [lx + 13, ly + 62], [lx - 13, ly + 62]], 4), "#d8a53f", 2.8);
    p.ell(lx, ly + 42, 9, 16, "#ffd98a", 1.8);
    p.poly(lcr([[lx - 16, ly + 62], [lx + 16, ly + 62], [lx + 12, ly + 70], [lx - 12, ly + 70]], 4), "#8a5a2c", 2.4);
    p.ell(lx, ly - 4, 10, 13, skin, 2.4);
  }
  if (AP?.hip) p.g.restore();
  if (AP?.sit) p.g.restore();
};

/** front view: wide cheeks, ball nose, short neck; for the model sheet */
/** front view: wide cheeks, ball nose, short neck; face shape and hair per outfit */
const lheadFront = (p: Pen, o: any, cx: number, cy: number, s: number, expr: string, lid: number) => {
  const skin = lskin(o), e = lexOf(expr, lid);
  const face = o.face || "long";
  const fx = face === "round" ? 1.12 : face === "square" ? 1.08 : 1;
  const fy = face === "round" ? 0.9 : face === "square" ? 0.97 : 1;
  const F = (x: number, y: number): LP => {
    let X = cx + (x - cx) * s * fx;
    const Y = cy + (y - cy) * s * fy;
    if (face === "square" && y - cy > 40) X += (x - cx) * s * 0.05;
    return [X, Y];
  };
  const neck = lcr([[cx - 36, cy + 96], [cx + 36, cy + 96], [cx + 42, cy + 152], [cx - 42, cy + 152]], 5);
  p.poly(neck, skin, 3.6);
  p.clip(neck, () => p.poly([[cx - 42, cy + 96], [cx - 6, cy + 96], [cx - 2, cy + 152], [cx - 42, cy + 152]], lmul(skin, 0.82), 0));
  const C: LP[] = [
    [cx, cy - 112], [cx + 58, cy - 100], [cx + 96, cy - 62], [cx + 102, cy - 18], [cx + 96, cy + 30], [cx + 84, cy + 70],
    [cx + 56, cy + 98], [cx, cy + 108], [cx - 56, cy + 98], [cx - 84, cy + 70], [cx - 96, cy + 30], [cx - 102, cy - 18],
    [cx - 96, cy - 62], [cx - 58, cy - 100],
  ].map(([x, y]) => F(x, y));
  const shape = lcr(C, 6);
  for (const sign of [-1, 1]) {
    p.ell(cx + sign * 101 * s * fx, cy + 8 * s * fy, 18 * s, 27 * s, lmul(skin, 0.97), 3.6 * s);
    p.stroke(lops([[cx + sign * 100 * s * fx, cy - 10 * s * fy], [cx + sign * 109 * s * fx, cy + 8 * s * fy], [cx + sign * 98 * s * fx, cy + 27 * s * fy]], 8), 2.8 * s, lmul(skin, 0.7));
  }
  p.poly(shape, skin, 0);
  p.clip(shape, () => p.poly([F(cx - 106, cy - 10), F(cx - 54, cy - 22), F(cx - 46, cy + 78), F(cx - 92, cy + 44)], lmul(skin, 0.86), 0));
  p.inkRing(shape, 4.4 * s, Math.atan2(0.4, -0.9), 0.38);
  const ex = 40 * s * fx, ey = cy - 20 * s * fy;
  for (const sign of [-1, 1]) {
    leye(p, cx + sign * ex, ey, 54 * s * e.eyeW, 40 * s * e.eyeH, sign * e.lookX * s, e.lookY * s, e.pupil, e.lid, skin);
    lbrow(p, cx + sign * ex, ey - 36 * s, 62 * s, e.browY * s, e.browIn * s);
  }
  // nose: a ball between the eyes
  p.poly(lcr([F(cx - 15, cy - 12), F(cx + 15, cy - 12), F(cx + 22, cy + 24), F(cx + 12, cy + 44), F(cx - 12, cy + 44), F(cx - 22, cy + 24)], 5), skin, 3.2 * s);
  p.arc(cx - 11 * s * fx, cy + 39 * s * fy, 8 * s, 4.5 * s, 20, 160, 2 * s, lmul(skin, 0.58));
  p.arc(cx + 11 * s * fx, cy + 39 * s * fy, 8 * s, 4.5 * s, 20, 160, 2 * s, lmul(skin, 0.58));
  // mouth
  const my = cy + 68 * s * fy, open = e.open, w = 92 * s * fx;
  if (open < 0.12) {
    p.stroke(lops([[cx - w / 2, my + 1 * s * fy], [cx, my - 3 * s * fy], [cx + w / 2, my + 1 * s * fy]], 8), 4.2 * s, LK);
    p.stroke(lops([[cx - w / 2 + 8 * s, my + 12 * s * fy], [cx + w / 2 - 8 * s, my + 12 * s * fy]], 6), 1.8 * s, lmul(skin, 0.72));
  } else {
    const drop = (22 + 30 * open + 10 * e.jaw) * s * fy;
    const M: LP[] = [[cx - w / 2, my], [cx - w / 2 + 10 * s, my - 5 * s * fy], [cx + w / 2 - 10 * s, my - 5 * s * fy], [cx + w / 2, my], [cx + w / 2 - 8 * s, my + drop], [cx - w / 2 + 8 * s, my + drop]];
    const mshape = lcr(M, 6);
    p.poly(mshape, "#5a1e28", 3.4 * s);
    p.clip(mshape, () => {
      if (e.teeth > 0.35) p.poly([[cx - w / 2 + 8 * s, my - 4 * s * fy], [cx + w / 2 - 8 * s, my - 4 * s * fy], [cx + w / 2 - 10 * s, my + 4 * s * fy], [cx - w / 2 + 10 * s, my + 4 * s * fy]], "#fff6e4", 0);
      if (e.tongue > 0.4) p.ell(cx, my + drop * 0.62, 18 * s, 8 * s, "#e86e78", 0);
    });
  }
  // hair
  const hair = o.hair || "#2a211a";
  if (o.hairStyle === "part") {
    p.poly(lcr([F(cx - 96, cy - 30), F(cx - 92, cy - 70), F(cx - 64, cy - 102), F(cx - 20, cy - 116), F(cx + 28, cy - 114), F(cx + 70, cy - 96), F(cx + 94, cy - 64), F(cx + 96, cy - 30), F(cx + 60, cy - 44), F(cx + 20, cy - 50), F(cx - 20, cy - 44), F(cx - 60, cy - 36)], 5), hair, 3.2 * s);
    p.poly(lcr([F(cx - 30, cy - 108), F(cx + 10, cy - 102), F(cx + 40, cy - 84), F(cx + 30, cy - 62), F(cx - 6, cy - 70), F(cx - 34, cy - 88)], 5), lmul(hair, 1.1), 2.6 * s);
    lstroke(p, [F(cx - 18, cy - 110), F(cx - 24, cy - 92)], 2.4 * s, 1 * s, lmul(hair, 1.4));
  } else if (o.hairStyle === "bald") {
    for (const sign of [-1, 1]) p.poly(lcr([F(cx + sign * 104, cy - 14), F(cx + sign * 101, cy - 40), F(cx + sign * 94, cy - 50), F(cx + sign * 89, cy - 34), F(cx + sign * 88, cy + 6), F(cx + sign * 95, cy + 20), F(cx + sign * 104, cy + 10)], 5), hair, 2.8 * s);
    p.stroke(lops([F(cx - 34, cy - 98), F(cx, cy - 104), F(cx + 34, cy - 98)], 6), 3 * s, lmul(skin, 1.08));
  } else if (o.hairStyle === "buzz") {
    p.poly(lcr([F(cx - 98, cy - 40), F(cx - 94, cy - 76), F(cx - 66, cy - 102), F(cx - 20, cy - 112), F(cx + 28, cy - 110), F(cx + 70, cy - 94), F(cx + 94, cy - 64), F(cx + 96, cy - 38), F(cx + 60, cy - 52), F(cx + 20, cy - 58), F(cx - 20, cy - 52), F(cx - 60, cy - 44)], 5), hair, 3 * s);
    for (const sign of [-1, 1]) p.poly([F(cx + sign * 94, cy - 30), F(cx + sign * 78, cy - 26), F(cx + sign * 76, cy + 20), F(cx + sign * 90, cy + 28)], hair, 2.4 * s);
  }
  // cap: only the wide-brim digger still wears one
  const cap = o.cap || lmul(o.jacket, 0.7);
  if (o.hat === "cap") {
    if (o.brim) p.ell(cx, cy - 86 * s * fy, 116 * s * fx, 14 * s, o.brim, 3.4 * s);
    p.poly(lcr([F(cx - 92, cy - 84), F(cx - 86, cy - 110), F(cx - 48, cy - 130), F(cx + 14, cy - 136), F(cx + 66, cy - 126), F(cx + 90, cy - 100), F(cx + 92, cy - 78), F(cx + 28, cy - 70), F(cx - 46, cy - 72)], 5), cap, 4 * s);
    p.poly(lcr([F(cx - 90, cy - 78), F(cx + 90, cy - 76), F(cx + 88, cy - 62), F(cx - 92, cy - 64)], 5), lmul(cap, 0.7), 3 * s);
    if (!o.brim) p.poly(lcr([F(cx - 4, cy - 80), F(cx + 92, cy - 76), F(cx + 90, cy - 60), F(cx - 4, cy - 64)], 5), lmul(cap, 0.76), 3 * s);
  }
  if (o.glasses) {
    for (const sign of [-1, 1]) p.ell(cx + sign * ex, ey, 32 * s, 27 * s, null, 2.9 * s);
    p.stroke([[cx - 10 * s, ey - 1 * s], [cx + 10 * s, ey - 1 * s]], 2.2 * s);
  }
  if (o.scarf) {
    p.poly(lcr([F(cx - 46, cy + 98), F(cx + 46, cy + 98), F(cx + 48, cy + 116), F(cx - 48, cy + 116)], 5), o.scarf, 3 * s);
    p.poly(lcr([F(cx + 16, cy + 112), F(cx + 38, cy + 118), F(cx + 30, cy + 156), F(cx + 8, cy + 136)], 5), o.scarf, 2.6 * s);
  }
};

const lbodyFront = (p: Pen, o: any, opts: FrontOpts) => {
  const { phase = 0, expr = "neutral", mode = "stand", blink = false, light = -2.1 } = opts;
  const skin = lskin(o), lid = lidOf(blink), s = (o.head ?? 1) * 1.04;
  const stout = o.build === "stout", sole = 975, hipY = 850;
  const step = mode === "march" ? 16 * Math.sin(2 * Math.PI * phase) : 0;
  for (const sign of [-1, 1]) {
    const hip: LP = [300 + sign * 22, hipY];
    const ank: LP = [300 + sign * 42 + step * sign, sole - 6];
    const knee = ik(hip, ank, 68, 62);
    p.poly(ltape([hip, knee, ank], [46, 40, 34]), lmul(o.pants, sign < 0 ? 0.8 : 1), 3.4);
    lshoe(p, ank[0], ank[1] + 10, 0, lmul(o.boots, sign < 0 ? 1.25 : 1.55), 1.42);
  }
  const widen = stout ? 16 : o.thin ? -14 : 0;
  const T: LP[] = [
    [300, 492], [220 - widen, 514], [186 - widen, 584], [178 - widen, 664], [184 - widen, 744], [200 - widen, 804],
    [226, 838], [270, 854], [330, 854], [374, 838], [400 + widen, 804], [416 + widen, 744], [422 + widen, 664], [414 + widen, 584], [380 + widen, 514],
  ];
  const tshape = lcr(T, 6);
  p.poly(tshape, o.jacket, 0);
  p.clip(tshape, () => {
    p.poly([[196 - widen, 540], [244, 520], [238, 830], [214, 806], [200, 660]], lmul(o.jacket, 0.78), 0);
    p.poly([[286, 496], [314, 496], [310, 550], [300, 568], [290, 550]], lmul(o.jacket, 0.5), 0);
  });
  p.inkRing(tshape, 4.8, Math.atan2(0.4, -0.9), 0.4);
  p.stroke([[286, 498], [300, 536], [300, 568]], 4.2, lmul(o.jacket, 0.74));
  p.stroke([[314, 498], [300, 536], [300, 568]], 4.2, lmul(o.jacket, 0.74));
  p.stroke([[300, 568], [300, 826]], 2.6, lmul(o.jacket, 0.5));
  for (let i = 0; i < 4; i++) p.dot(300, 596 + i * 60, 3.8, o.buttons || "#c8b48a");
  for (const sign of [-1, 1]) {
    const sh: LP = [300 + sign * 118, 518];
    const el: LP = [300 + sign * 150, 668 + step * 0.3 * sign];
    const wr: LP = [300 + sign * 156, 792 - step * 0.4 * sign];
    p.poly(ltape([sh, el, wr], [40, 35, 31]), lmul(o.jacket, sign < 0 ? 0.72 : 0.97), 3.4);
    lhand(p, wr[0], wr[1] + 13, 1.57, 1.22, lmul(skin, sign < 0 ? 0.88 : 1));
  }
  const hy = 330;
  lheadFront(p, o, 300, hy, s, expr, lid);
  if (o.satchel) {
    p.band([[342, 522], [250, 790]], o.satchel, 7, 2);
    p.poly(lcr([[200, 776], [278, 772], [282, 838], [204, 842]], 5), o.satchel, 3.2);
  }
  if (o.pickaxe) p.band([[206, 836], [376, 490]], "#6b4a2f", 7, 2);
};