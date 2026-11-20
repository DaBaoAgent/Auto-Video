import { clamp, lerp, seg, ss, eio, mulberry, TAU } from './lib.js';

const P = {
  deep: '#1a2131',
  wall: '#222b3d',
  wall2: '#2b3549',
  bench: '#33405a',
  front: '#0e1420',
  leg: '#0a0f18',
  warm: '#f4b962',
  warm2: '#d8873c',
  rust: '#a9452c',
  cream: '#efe3cf',
  cloth: '#161d2b',
  cloth2: '#202a3c',
};

let noise = null;

export function init(W, H) {
  const n = document.createElement('canvas');
  n.width = 512; n.height = 512;
  const nc = n.getContext('2d');
  const r = mulberry(77031);
  for (let i = 0; i < 26000; i++) {
    const x = r() * 512, y = r() * 512;
    const a = r() * .5 + .1;
    nc.fillStyle = 'rgba(0,0,0,' + a.toFixed(3) + ')';
    nc.fillRect(x, y, 1 + (r() < .2 ? 1 : 0), 1);
  }
  noise = n;
}

function path(c, pts) {
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = pts[i][0], y = pts[i][1];
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}

function paper(c, pts, color, o = {}) {
  const sh = o.sh ?? 10, edge = o.edge ?? 'rgba(255,210,150,.18)';
  for (let k = 0; k < 3; k++) {
    c.save(); c.translate(0, sh * (k + 1) * .45);
    path(c, pts); c.fillStyle = 'rgba(4,4,9,' + (.30 - k * .07).toFixed(2) + ')'; c.fill();
    c.restore();
  }
  path(c, pts); c.fillStyle = color; c.fill();
  c.save(); path(c, pts); c.lineWidth = o.ew ?? 1.5; c.strokeStyle = edge; c.stroke(); c.restore();
}

function rim(c, pts, a = .26) {
  c.save(); path(c, pts); c.lineWidth = 2.4; c.strokeStyle = 'rgba(244,185,98,' + a + ')'; c.stroke(); c.restore();
}

function bar(c, x0, y0, x1, y1, w0, w1, color, sh) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  paper(c, [
    [x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2],
    [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2],
  ], color, { sh: sh ?? 6 });
}

function circ(c, x, y, r, color, sh = 8) {
  const pts = [];
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  paper(c, pts, color, { sh });
}

// ----------------------------- the boy -----------------------------
// one head, cut in profile: forehead, brow, nose, lips, chin, jaw, ear
function headPath(hx, hy, r) {
  const f = [
    [0.02, -1.02], [0.58, -0.90], [0.90, -0.52], [1.00, -0.04], [0.92, 0.34],
    [0.70, 0.66], [0.34, 0.88], [0.02, 0.84], [-0.14, 0.66], [-0.30, 0.52],
    [-0.22, 0.40], [-0.38, 0.26], [-0.22, 0.16], [-0.34, -0.04], [-0.30, -0.32],
    [-0.18, -0.62], [-0.06, -0.90],
  ];
  return f.map(p => [hx + p[0] * r, hy + p[1] * r]);
}

function handW(c, ax, ay, bx, by, s) {
  // a flat cut-paper hand: palm wedge along the forearm, thumb notch
  const dx = bx - ax, dy = by - ay, L2 = Math.hypot(dx, dy) || 1;
  const ux = dx / L2, uy = dy / L2, nx = -uy, ny = ux;
  const w = 17 * s, h = 30 * s;
  paper(c, [
    [bx + nx * w * .5, by + ny * w * .5],
    [bx + ux * h + nx * w * .28, by + uy * h + ny * w * .28],
    [bx + ux * h - nx * w * .55, by + uy * h - ny * w * .55],
    [bx - nx * w * .5, by - ny * w * .5],
  ], P.front, { sh: 4, ew: 1.2 });
}

function shoe(c, x, y, s, dir) {
  paper(c, [
    [x - 30 * s * dir, y - 16 * s], [x + 24 * s * dir, y - 12 * s],
    [x + 34 * s * dir, y + 2 * s], [x + 26 * s * dir, y + 8 * s],
    [x - 28 * s * dir, y + 6 * s],
  ], P.leg, { sh: 5 });
}

// a flat hand lying on the edge of the stack, fingers curling over it
function palm(c, x, y, s, dir) {
  const w = 34 * s, h = 20 * s;
  paper(c, [
    [x - w * .5 * dir, y - h * .2], [x + w * .5 * dir, y - h * .5],
    [x + w * .55 * dir, y + h * .5], [x + w * .1 * dir, y + h * .8],
    [x - w * .5 * dir, y + h * .6],
  ], P.front, { sh: 4, ew: 1.2, edge: 'rgba(255,210,150,.34)' });
  // fingers curling down over the plate edge
  c.save();
  c.strokeStyle = 'rgba(255,210,150,.14)'; c.lineWidth = 1.4;
  for (let i = 0; i < 3; i++) {
    const fx = x + (-w * .22 + i * w * .22) * dir;
    c.beginPath(); c.moveTo(fx, y + h * .3); c.lineTo(fx, y + h * .95); c.stroke();
  }
  c.restore();
}

function boy(c, x, footY, ph, s, drop, t) {
  drop = clamp(drop);
  const sw = Math.sin(ph) * (1 - drop * .9);
  const bob = -Math.abs(Math.sin(ph)) * 9 * s * (1 - drop * .6);

  const hipY = footY - 262 * s + bob;
  const hipX = x;
  // the load pulls the shoulders forward and down; he straightens a touch when he sets it down
  const shX = x - (22 - drop * 8) * s;
  const shY = hipY - 172 * s + drop * 14 * s;

  const r = 33 * s;
  const hx = shX - 8 * s, hy = shY - 46 * s;

  // ---- shadow on the floor
  c.save();
  const sg = c.createRadialGradient(x, footY + 4, 6 * s, x, footY + 4, 130 * s);
  sg.addColorStop(0, 'rgba(3,3,6,.36)'); sg.addColorStop(1, 'rgba(3,3,6,0)');
  c.fillStyle = sg;
  c.beginPath(); c.ellipse(x, footY + 4, 130 * s, 22 * s, 0, 0, TAU); c.fill();
  c.restore();

  // ---- legs: thigh, shin, shoe
  const legs = [
    { fwd: 1, lift: Math.max(0, sw) * 42 * s },
    { fwd: -1, lift: Math.max(0, -sw) * 42 * s },
  ];
  legs.forEach((L, i) => {
    const fx = hipX + L.fwd * (52 * s) * (1 - .34 * Math.abs(sw)) - 10 * s;
    const fy = footY - L.lift;
    const kx = (hipX + fx) / 2 - (14 + drop * 20) * s;
    const ky = (hipY + fy) / 2 - (4 + drop * 10) * s;
    const col = i === 1 ? P.leg : P.front;
    bar(c, hipX + L.fwd * 8 * s, hipY + 2 * s, kx, ky, 48 * s, 34 * s, col, 7);
    bar(c, kx, ky, fx, fy - 12 * s, 34 * s, 24 * s, col, 7);
    shoe(c, fx, fy - 6 * s, s, 1);
    if (i === 0) rim(c, [[kx - 18 * s, ky + 8 * s], [fx - 12 * s, fy - 14 * s]], .18);
  });

  // ---- torso: jacket over a narrow waisted body, hunched into the load
  const tor = [
    [shX - 46 * s, shY + 2 * s],
    [shX - 30 * s, shY - 14 * s],
    [shX + 38 * s, shY - 12 * s],
    [shX + 52 * s, shY + 20 * s],
    [hipX + 44 * s, hipY + 8 * s],
    [hipX - 40 * s, hipY + 8 * s],
    [shX - 54 * s, shY + 44 * s],
  ];
  paper(c, tor, P.cloth, { sh: 9 });
  rim(c, [[shX - 46 * s, shY + 2 * s], [shX - 30 * s, shY - 14 * s], [shX - 4 * s, shY - 12 * s]], .36);
  // open shirt front: a sliver of lighter cloth down the chest
  paper(c, [
    [shX - 26 * s, shY - 6 * s], [shX - 8 * s, shY + 40 * s],
    [shX + 2 * s, shY + 36 * s], [shX - 14 * s, shY - 8 * s],
  ], P.cloth2, { sh: 3, ew: 1 });

  // ---- neck
  bar(c, hx + 6 * s, hy + 28 * s, shX - 2 * s, shY + 4 * s, 22 * s, 32 * s, P.front, 5);

  // ---- the tin plates: carried low at the belly, hoisted onto the bench at the end
  const stackTop = hipY - 96 * s - drop * 53 * s;
  const pw = 158 * s, phh = 12 * s;
  const sxL = shX - 152 * s;
  for (let i = 4; i >= 0; i--) {
    const yy = stackTop + i * (phh + 1 * s);
    paper(c, [
      [sxL + i * 3 * s, yy], [sxL + pw + i * 3 * s, yy - 5 * s],
      [sxL + pw + i * 3 * s, yy + phh - 5 * s], [sxL + i * 3 * s, yy + phh],
    ], i % 2 ? P.cream : '#e0d0b4', { sh: 4, ew: 1.2 });
  }
  rim(c, [[sxL + pw, stackTop - 4 * s], [sxL + pw, stackTop + 60 * s]], .20);

  // ---- arms: both bent, forearms under the stack, hands at the bottom edge
  const hA = [sxL + 34 * s, stackTop + 62 * s + phh * 4];
  const hB = [sxL + 118 * s, stackTop + 66 * s + phh * 4];
  // far arm (left, on the side he faces)
  const eA = [shX - 62 * s, shY + 74 * s];
  bar(c, shX - 40 * s, shY + 10 * s, eA[0], eA[1], 30 * s, 25 * s, P.front, 6);
  bar(c, eA[0], eA[1], hA[0], hA[1], 25 * s, 19 * s, P.front, 5);
  handW(c, eA[0], eA[1], hA[0], hA[1], s);
  rim(c, [[shX - 40 * s, shY + 10 * s], [eA[0], eA[1]]], .22);
  // near arm (right), tucked against the body
  const eB = [shX + 34 * s, shY + 82 * s];
  bar(c, shX + 30 * s, shY + 10 * s, eB[0], eB[1], 30 * s, 25 * s, P.front, 6);
  bar(c, eB[0], eB[1], hB[0], hB[1], 25 * s, 19 * s, P.front, 5);
  handW(c, eB[0], eB[1], hB[0], hB[1], s);

  // ---- head in profile, facing left, hair cut as a cap, small ear
  paper(c, headPath(hx, hy, r), P.front, { sh: 6 });
  rim(c, [[hx - .30 * r, hy - .34 * r], [hx - .30 * r, hy - .04 * r], [hx - .38 * r, hy + .26 * r], [hx - .14 * r, hy + .60 * r]], .32);
  paper(c, [
    [hx - .26 * r, hy - .52 * r], [hx - .18 * r, hy - .90 * r], [hx + .22 * r, hy - 1.06 * r],
    [hx + .68 * r, hy - .94 * r], [hx + .96 * r, hy - .56 * r], [hx + 1.00 * r, hy - .10 * r],
    [hx + .82 * r, hy - .30 * r], [hx + .50 * r, hy - .58 * r], [hx + .10 * r, hy - .64 * r],
  ], P.leg, { sh: 5 });
  // ear, a rounded wedge at the jaw
  paper(c, [
    [hx + .40 * r, hy + .04 * r], [hx + .62 * r, hy + .06 * r],
    [hx + .60 * r, hy + .30 * r], [hx + .40 * r, hy + .28 * r],
  ], P.front, { sh: 2, ew: 1 });
  // eye and mouth as thin cuts; the rest of the face stays a clean silhouette
  c.save();
  c.fillStyle = 'rgba(8,10,18,.95)';
  c.beginPath(); c.ellipse(hx - .16 * r, hy + .02 * r, 8 * s, 3 * s, -.2, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,214,160,.26)'; c.lineWidth = 1.8;
  c.beginPath(); c.moveTo(hx - .30 * r, hy + .34 * r); c.lineTo(hx - .17 * r, hy + .36 * r); c.stroke();
  c.restore();
}

// ----------------------------- the boy, at the bench -----------------------------
// waist-up behind the workbench: his hips sit below the table line, so the bench
// itself crops the figure and the whole read is head, shoulders and hands.
function boyBench(c, x, tableY, footY, s, lift, wipe, ph) {
  const reach = 1 - lift;
  const breathe = Math.sin(ph * .55) * 1.6 * s;
  const hipX = x, hipY = footY - 262 * s;
  const shX = x - (16 + reach * 14) * s;
  const shY = hipY - 172 * s + reach * 12 * s + breathe;
  const r = 33 * s;
  const hx = shX - 12 * s, hy = shY - 42 * s + wipe * 3 * s;

  // ---- jacket, hunched under the load
  const tor = [
    [shX - 46 * s, shY + 2 * s],
    [shX - 24 * s, shY - 18 * s],
    [shX + 18 * s, shY - 16 * s],
    [shX + 42 * s, shY + 6 * s],
    [hipX + 48 * s, hipY + 10 * s],
    [hipX - 42 * s, hipY + 10 * s],
    [shX - 52 * s, shY + 48 * s],
  ];
  paper(c, tor, P.cloth, { sh: 9 });
  rim(c, [[shX - 44 * s, shY + 8 * s], [shX - 32 * s, shY - 14 * s], [shX - 6 * s, shY - 13 * s]], .34);
  // open collar: two thin lapels, no big wedge
  paper(c, [
    [shX - 22 * s, shY - 8 * s], [shX - 12 * s, shY + 26 * s],
    [shX - 4 * s, shY + 22 * s], [shX - 12 * s, shY - 9 * s],
  ], P.cloth2, { sh: 3, ew: 1 });
  c.save();
  c.strokeStyle = 'rgba(244,185,98,.14)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(shX - 20 * s, shY + 62 * s); c.lineTo(shX - 6 * s, shY + 96 * s); c.stroke();
  c.beginPath(); c.moveTo(shX + 16 * s, shY + 46 * s); c.lineTo(shX + 30 * s, shY + 84 * s); c.stroke();
  c.restore();

  // ---- neck
  bar(c, hx + 6 * s, hy + 26 * s, shX - 2 * s, shY + 2 * s, 22 * s, 32 * s, P.front, 5);

  // ---- the plates: coming up out of the dark below the bench, settling on it
  const phh = 12 * s, pw = 122 * s;
  const band = 5 * (phh + 1 * s);
  const rest = tableY - band - 2 * s;
  const wob = Math.sin(ph * 2.4) * 2.2 * s * lift * reach;
  const stackTop = lerp(rest + 62 * s, rest, lift) + wob;
  const sxL = shX - 128 * s;

  // ---- arms behind the load, palms flat over the two ends of the top plate
  const hL = [sxL + 14 * s, stackTop + 7 * s];
  const hR = [sxL + pw - 14 * s, stackTop + 10 * s];
  const brow = [hx - .30 * r, hy - .04 * r];
  const hR2 = [lerp(hR[0], brow[0], wipe), lerp(hR[1], brow[1], wipe) - Math.sin(wipe * Math.PI) * 12 * s];
  const eA = [shX - 52 * s, shY + 92 * s];
  const eB = [lerp(shX + 38 * s, shX + 8 * s, wipe), lerp(shY + 96 * s, shY + 26 * s, wipe)];
  bar(c, shX - 36 * s, shY + 8 * s, eA[0], eA[1], 26 * s, 21 * s, P.front, 6);
  bar(c, eA[0], eA[1], hL[0], hL[1] + band * .55, 21 * s, 15 * s, P.front, 5);
  rim(c, [[shX - 36 * s, shY + 8 * s], [eA[0], eA[1]]], .18);
  bar(c, shX + 26 * s, shY + 8 * s, eB[0], eB[1], 26 * s, 21 * s, P.front, 6);
  bar(c, eB[0], eB[1], hR2[0], hR2[1], 21 * s, 15 * s, P.front, 5);

  for (let i = 4; i >= 0; i--) {
    const yy = stackTop + i * (phh + 1 * s);
    paper(c, [
      [sxL + i * 3 * s, yy], [sxL + pw + i * 3 * s, yy - 5 * s],
      [sxL + pw + i * 3 * s, yy + phh - 5 * s], [sxL + i * 3 * s, yy + phh],
    ], i % 2 ? P.cream : '#e0d0b4', { sh: 4, ew: 1.2 });
  }
  rim(c, [[sxL + pw, stackTop - 4 * s], [sxL + pw, stackTop + band]], .22);
  // palms resting flat on the ends, fingers curled over the edge
  palm(c, hL[0], hL[1], s, 1);
  palm(c, hR2[0], hR2[1], s, -1);
  // wiping the brow: a sleeve cuff at the wrist so the hand reads
  if (wipe > .05) {
    c.save();
    c.globalAlpha = Math.min(1, wipe * 1.6);
    paper(c, [
      [hR2[0] - 26 * s, hR2[1] - 6 * s], [hR2[0] - 8 * s, hR2[1] - 14 * s],
      [hR2[0] - 4 * s, hR2[1] + 2 * s], [hR2[0] - 22 * s, hR2[1] + 8 * s],
    ], P.front, { sh: 3, ew: 1 });
    c.restore();
  }

  // ---- head, cut in profile facing left
  paper(c, headPath(hx, hy, r), P.front, { sh: 6 });
  rim(c, [[hx - .30 * r, hy - .34 * r], [hx - .30 * r, hy - .04 * r], [hx - .38 * r, hy + .26 * r], [hx - .14 * r, hy + .58 * r]], .32);
  paper(c, [
    [hx - .24 * r, hy - .54 * r], [hx - .14 * r, hy - .92 * r], [hx + .24 * r, hy - 1.04 * r],
    [hx + .70 * r, hy - .92 * r], [hx + .96 * r, hy - .52 * r], [hx + .98 * r, hy - .04 * r],
    [hx + .78 * r, hy - .30 * r], [hx + .44 * r, hy - .58 * r], [hx + .06 * r, hy - .64 * r],
  ], P.leg, { sh: 5 });
  // the hairline, a thin cut so the cap separates from the skull
  c.save();
  c.strokeStyle = 'rgba(244,185,98,.20)'; c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(hx - .24 * r, hy - .54 * r);
  c.lineTo(hx + .06 * r, hy - .64 * r);
  c.lineTo(hx + .44 * r, hy - .58 * r);
  c.lineTo(hx + .78 * r, hy - .30 * r);
  c.stroke();
  c.restore();
  // ear, small and rounded, set back at the jaw
  {
    const ex = hx + .46 * r, ey = hy + .16 * r, er = .15 * r;
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; pts.push([ex + Math.cos(a) * er * .8, ey + Math.sin(a) * er]); }
    paper(c, pts, P.front, { sh: 2, ew: 1 });
  }
  c.save();
  c.fillStyle = 'rgba(8,10,18,.95)';
  c.beginPath(); c.ellipse(hx - .14 * r, hy + .02 * r, 7 * s, 2.8 * s, -.2, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,214,160,.24)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(hx - .28 * r, hy + .32 * r); c.lineTo(hx - .16 * r, hy + .33 * r); c.stroke();
  c.restore();
}

function stampState(t) {
  const cyc = 1.2, off = .6;
  const q = (t - off) / cyc;
  const u = .5 - .5 * Math.cos(TAU * (((q % 1) + 1) % 1));
  // u peaks at q = .5 + k, i.e. t = 1.2 + 1.2k: that is the impact
  const first = off + cyc * .5;
  const age = t >= first ? (t - first) % cyc : 9;
  return { u, age };
}

export function paint(c, t, W, H) {
  const K = W / 1080;
  const rnd = mulberry(4113);

  const zc = ss(seg(t, 1.2, 8.4));
  const sc = lerp(1.02, 1.085, zc);
  const camX = lerp(W * .50, W * .535, zc), camY = lerp(H * .50, H * .515, zc);

  c.fillStyle = P.deep;
  c.fillRect(0, 0, W, H);

  c.save();
  c.translate(W / 2, H / 2); c.scale(sc, sc); c.translate(-camX, -camY);

  // ---------- back wall ----------
  paper(c, [[-W * .1, -H * .1], [W * 1.1, -H * .1], [W * 1.1, H * .78], [-W * .1, H * .78]], P.wall, { sh: 16 });
  c.save();
  c.strokeStyle = 'rgba(8,10,16,.55)'; c.lineWidth = 2 * K;
  for (let i = 1; i < 5; i++) {
    c.beginPath(); c.moveTo(W * i * .2, -H * .06); c.lineTo(W * i * .2, H * .76); c.stroke();
  }
  c.restore();

  // ---------- the window, lit from behind ----------
  const winA = ss(seg(t, 0, .4));
  const wx0 = W * .15, wx1 = W * .585, wy0 = H * .125, wy1 = H * .395;
  c.save();
  c.globalAlpha = winA;
  const g = c.createRadialGradient((wx0 + wx1) / 2, (wy0 + wy1) / 2, 20 * K, (wx0 + wx1) / 2, (wy0 + wy1) / 2, W * .55);
  g.addColorStop(0, 'rgba(244,185,98,.55)');
  g.addColorStop(.45, 'rgba(244,185,98,.20)');
  g.addColorStop(1, 'rgba(244,185,98,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(244,185,98,.10)';
  path(c, [[wx0, wy1], [wx1, wy1], [W * .86, H * .92], [W * .26, H * .92]]); c.fill();
  c.fillStyle = P.warm;
  c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  c.fillStyle = 'rgba(216,135,60,.55)';
  c.fillRect(wx0, wy0 + (wy1 - wy0) * .55, wx1 - wx0, (wy1 - wy0) * .45);
  paper(c, [[wx0 - 12 * K, wy0 - 12 * K], [wx1 + 12 * K, wy0 - 12 * K], [wx1 + 12 * K, wy1 + 12 * K], [wx0 - 12 * K, wy1 + 12 * K]], P.wall2, { sh: 12 });
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  c.globalCompositeOperation = 'source-over';
  c.restore();
  c.fillStyle = P.warm;
  c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
  c.fillStyle = 'rgba(216,135,60,.5)';
  c.fillRect(wx0, wy0 + (wy1 - wy0) * .58, wx1 - wx0, (wy1 - wy0) * .42);
  c.fillStyle = P.wall2;
  c.fillRect((wx0 + wx1) / 2 - 5 * K, wy0, 10 * K, wy1 - wy0);
  c.fillRect(wx0, (wy0 + wy1) / 2 - 5 * K, wx1 - wx0, 10 * K);
  c.restore();

  // ---------- tools hanging on the wall ----------
  const toolA = ss(seg(t, .9, 1.5));
  c.save();
  c.globalAlpha = toolA;
  paper(c, [[W * .64, H * .20], [W * .945, H * .20], [W * .945, H * .44], [W * .64, H * .44]], P.wall2, { sh: 12 });
  paper(c, [[W * .672, H * .235], [W * .690, H * .235], [W * .690, H * .335], [W * .672, H * .335]], P.bench, { sh: 6 });
  paper(c, [[W * .642, H * .205], [W * .726, H * .205], [W * .726, H * .245], [W * .642, H * .245]], P.bench, { sh: 6 });
  bar(c, W * .790, H * .225, W * .770, H * .350, 13 * K, 6 * K, P.bench);
  bar(c, W * .808, H * .225, W * .828, H * .350, 13 * K, 6 * K, P.bench);
  paper(c, [[W * .850, H * .235], [W * .925, H * .250], [W * .920, H * .300], [W * .845, H * .285]], P.bench, { sh: 6 });
  c.restore();

  // ---------- the bench ----------
  paper(c, [[W * .02, H * .628], [W * .98, H * .628], [W * .98, H * .668], [W * .02, H * .668]], P.bench, { sh: 14 });
  bar(c, W * .10, H * .665, W * .085, H * .915, 26 * K, 20 * K, P.bench);
  bar(c, W * .90, H * .665, W * .918, H * .915, 26 * K, 20 * K, P.bench);

  // leaning tin sheets, left
  for (let i = 0; i < 4; i++) {
    const ox = i * 12 * K;
    paper(c, [
      [W * .070 + ox, H * .620], [W * .250 + ox, H * .612],
      [W * .262 + ox, H * .505], [W * .082 + ox, H * .515],
    ], i % 2 ? P.cream : '#dfd0b6', { sh: 7, ew: 1.2 });
  }

  // ---------- the press ----------
  const st = stampState(t);
  const pressX = W * .660, pressTop = H * .380, pressBot = H * .628;
  const ramCX = pressX + W * .115;
  paper(c, [[pressX, pressTop], [pressX + W * .050, pressTop], [pressX + W * .050, pressBot], [pressX, pressBot]], P.wall2, { sh: 12 });
  paper(c, [[pressX + W * .180, pressTop], [pressX + W * .230, pressTop], [pressX + W * .230, pressBot], [pressX + W * .180, pressBot]], P.wall2, { sh: 12 });
  paper(c, [[pressX, H * .38], [pressX + W * .230, H * .38], [pressX + W * .230, H * .405], [pressX, H * .405]], P.bench, { sh: 10 });

  // the wheel
  const wheelY = H * .455, wheelX = pressX + W * .115;
  circ(c, wheelX, wheelY, 56 * K, P.leg, 10);
  c.save();
  c.translate(wheelX, wheelY); c.rotate(t * .42);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU;
    bar(c, 0, 0, Math.cos(a) * 78 * K, Math.sin(a) * 78 * K, 7 * K, 5 * K, P.bench);
  }
  c.restore();
  c.save();
  c.strokeStyle = P.rust; c.lineWidth = 7 * K;
  c.beginPath(); c.arc(wheelX, wheelY, 56 * K, 0, TAU); c.stroke();
  c.restore();

  // the ram, driven down by the crank
  const ramTop = H * .470 + 96 * K * st.u;
  const ramH = 74 * K;
  // connecting rod: crank pin -> ram head
  const pinA = t * .42;
  const pinX = wheelX + Math.cos(pinA) * 42 * K, pinY = wheelY + Math.sin(pinA) * 42 * K;
  bar(c, pinX, pinY, ramCX, ramTop + 12 * K, 14 * K, 11 * K, P.bench, 5);
  circ(c, pinX, pinY, 7 * K, P.rust, 4);
  // ram block
  paper(c, [
    [ramCX - 70 * K, ramTop], [ramCX + 70 * K, ramTop],
    [ramCX + 62 * K, ramTop + ramH], [ramCX - 62 * K, ramTop + ramH],
  ], P.cloth2, { sh: 12, edge: 'rgba(255,210,150,.26)' });
  rim(c, [[ramCX - 66 * K, ramTop + 6 * K], [ramCX - 62 * K, ramTop + ramH]], .24);
  // guide rails
  paper(c, [[ramCX - 86 * K, pressTop + 26 * K], [ramCX - 72 * K, pressTop + 26 * K], [ramCX - 72 * K, H * .560], [ramCX - 86 * K, H * .560]], P.wall2, { sh: 5 });
  paper(c, [[ramCX + 72 * K, pressTop + 26 * K], [ramCX + 86 * K, pressTop + 26 * K], [ramCX + 86 * K, H * .560], [ramCX + 72 * K, H * .560]], P.wall2, { sh: 5 });

  // the tin plate on the bed, flattened a hair at impact
  const sq = Math.exp(-Math.pow(st.age, 2) / .015) * 4 * K;
  const bedY = H * .556;
  paper(c, [[pressX + W * .055 - sq, bedY + sq], [pressX + W * .175 + sq, bedY - 2 * K + sq],
    [pressX + W * .175 + sq, bedY + 20 * K - sq], [pressX + W * .055 - sq, bedY + 22 * K - sq]], P.cream, { sh: 5, ew: 1.2 });

  // sparks off the contact point
  if (st.age > 0 && st.age < .42) {
    const life = 1 - st.age / .42;
    const cxp = ramCX, cyp = bedY - 2 * K;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const fg = c.createRadialGradient(cxp, cyp, 4 * K, cxp, cyp, 120 * K);
    fg.addColorStop(0, 'rgba(255,206,120,' + (.55 * life).toFixed(3) + ')');
    fg.addColorStop(.4, 'rgba(255,150,60,' + (.22 * life).toFixed(3) + ')');
    fg.addColorStop(1, 'rgba(255,140,50,0)');
    c.fillStyle = fg;
    c.beginPath(); c.ellipse(cxp, cyp, 130 * K, 70 * K, 0, 0, TAU); c.fill();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + (i % 3) * .2;
      const len = (34 + (i % 4) * 26) * K * (.35 + .65 * (1 - Math.pow(st.age / .42, .6)));
      const x0 = cxp + Math.cos(a) * 26 * K, y0 = cyp + Math.sin(a) * 14 * K;
      const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len * .5 + 16 * K * (st.age / .42);
      c.strokeStyle = 'rgba(255,' + (196 - i % 3 * 26) + ',120,' + (.85 * life).toFixed(3) + ')';
      c.lineWidth = 2.6 * K;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const dd = (60 + i * 9) * K * (st.age / .42);
      c.fillStyle = 'rgba(255,224,168,' + (.7 * life).toFixed(3) + ')';
      c.beginPath(); c.arc(cxp + Math.cos(a) * dd, cyp + Math.sin(a) * dd * .6 + 20 * K * st.age, 2.4 * K, 0, TAU); c.fill();
    }
    c.restore();
  }

  // ---------- floor ----------
  paper(c, [[-W * .1, H * .905], [W * 1.1, H * .905], [W * 1.1, H * 1.15], [-W * .1, H * 1.15]], P.leg, { sh: 22 });

  // ---------- the lamp ----------
  const lx = W * .795, ly = H * .092;
  const sway = Math.sin(t * 1.15) * .06;
  c.save();
  c.translate(lx, ly); c.rotate(sway);
  paper(c, [[-4 * K, -H * .09], [4 * K, -H * .09], [4 * K, 0], [-4 * K, 0]], P.leg, { sh: 3 });
  paper(c, [[-72 * K, 0], [72 * K, 0], [40 * K, 70 * K], [-40 * K, 70 * K]], P.wall2, { sh: 12 });
  const lg = c.createRadialGradient(0, 76 * K, 6 * K, 0, 76 * K, 260 * K);
  lg.addColorStop(0, 'rgba(244,185,98,.50)');
  lg.addColorStop(.45, 'rgba(244,185,98,.16)');
  lg.addColorStop(1, 'rgba(244,185,98,0)');
  c.fillStyle = lg;
  c.beginPath(); c.arc(0, 76 * K, 260 * K, 0, TAU); c.fill();
  c.fillStyle = 'rgba(244,185,98,.95)';
  c.beginPath(); c.arc(0, 74 * K, 16 * K, 0, TAU); c.fill();
  c.restore();

  // ---------- the boy at the bench ----------
  const tableY = H * .628;
  const lift = ss(seg(t, 1.8, 5.9));
  const wipe = ss(seg(t, 8.0, 9.4));
  c.save();
  c.beginPath(); c.rect(-W * .2, -H * .2, W * 1.4, tableY + H * .2); c.clip();
  boyBench(c, W * .600, tableY, H * .885, 1.75, lift, wipe, t * 6.4);
  c.restore();

  // ---------- dust in the light ----------
  for (let i = 0; i < 16; i++) {
    const px = W * .10 + rnd() * W * .72;
    const py = H * .18 + ((rnd() * H * .72 + t * (12 + i * 2.2)) % (H * .72));
    const r = (1.2 + rnd() * 2.2) * K;
    c.fillStyle = 'rgba(244,201,140,' + (.10 + rnd() * .14).toFixed(2) + ')';
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }

  c.restore();

  // ---------- paper tooth over the whole page ----------
  if (noise) {
    const pat = c.createPattern(noise, 'repeat');
    c.save();
    c.globalCompositeOperation = 'overlay';
    c.globalAlpha = .10;
    c.fillStyle = pat;
    c.fillRect(0, 0, W, H);
    c.restore();
  }
  const vg = c.createRadialGradient(W / 2, H * .46, W * .22, W / 2, H * .5, W * .95);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,.42)');
  c.fillStyle = vg;
  c.fillRect(0, 0, W, H);
}
