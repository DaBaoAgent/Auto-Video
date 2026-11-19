// 《被托管过的文明》第一段 — the whole film on one timeline: 58.0 s, 90 BPM (one beat = 0.6667 s).
// Three 2D layers (F silhouettes, R reflections, X water light) are composited by sky.js.
window.DUR = 58.0;
const DUR = 58.0, B = 2 / 3, PI = Math.PI, TAU = PI * 2;
const W = innerWidth, H = innerHeight, K = H / 1080;
const G = document.getElementById('g'); G.width = W; G.height = H;
const O = document.getElementById('o'); O.width = W; O.height = H;
const octx = O.getContext('2d');
const draw = SKY.make(G);
function layer() { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
const LF = layer(), LR = layer(), LX = layer();
const fctx = LF.getContext('2d'), rctx = LR.getContext('2d'), xctx = LX.getContext('2d');
const INK = '#05020A', LIGHT = '#FFF2D0';

// ---------------------------------------------------------------- easing and segments
const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = cl(x); return x * x * (3 - 2 * x); };
const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eout = x => 1 - Math.pow(1 - cl(x), 3);
const eback = x => { x = cl(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const env = (t, a, b) => cl((t - a) / (b - a));
const lerp = (a, b, u) => a + (b - a) * u;
function seg(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (t <= keys[i + 1][0]) {
      const [t0, v0, e] = keys[i], [t1, v1] = keys[i + 1], u = (t - t0) / (t1 - t0);
      return lerp(v0, v1, e === 'lin' ? u : (e === 'eio' ? eio(u) : ss(u)));
    }
  }
  return keys[keys.length - 1][1];
}
const beatOf = t => Math.floor(t / B + 1e-6);
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

// ---------------------------------------------------------------- camera
function project(cam, x, y, z) {
  const zz = Math.max(.05, z - (cam.cz || 0)), fpx = cam.f * H;
  return [W / 2 + ((x - cam.cx) / zz - cam.yaw) * fpx, cam.hor * H + ((cam.ch - y) / zz) * fpx, fpx / zz];
}
function place(ctx, cam, x, y, z, s, face, refl, rot) {
  const p = project(cam, x, refl ? -y : y, z), sc = p[2] * s;
  const c = Math.cos(rot || 0), sn = Math.sin(rot || 0), ys = refl ? sc : -sc;
  ctx.setTransform(sc * face * c, ys * sn, -sc * face * sn, ys * c, p[0], p[1]);
}
// the same shape into the silhouette layer and, mirrored and clipped at the waterline, into the reflection layer
function both(cam, x, y, z, s, face, fn, rot, noRefl) {
  const wl = project(cam, x, 0, z)[1];
  for (const refl of (noRefl ? [false] : [false, true])) {
    const ctx = refl ? rctx : fctx;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath();
    if (refl) ctx.rect(-10, wl, W + 20, H - wl + 20); else ctx.rect(-10, -10, W + 20, wl + 10);
    ctx.clip(); ctx.globalAlpha = refl ? .52 : 1;
    place(ctx, cam, x, y, z, s, face, refl, rot); fn(ctx); ctx.restore();
  }
}
function solo(cam, x, y, z, s, face, fn, rot) {          // above the waterline only
  const wl = project(cam, x, 0, z)[1];
  fctx.save(); fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.beginPath();
  fctx.rect(-10, -10, W + 20, wl + 10); fctx.clip();
  place(fctx, cam, x, y, z, s, face, false, rot); fn(fctx); fctx.restore();
}

// ---------------------------------------------------------------- water light
function ring(cam, x, z, r, al, lw) {
  if (al <= .003 || r <= 0) return;
  const p = project(cam, x, 0, z), rx = r * p[2], ry = Math.max(.6, rx * cam.ch / Math.max(.05, z - (cam.cz || 0)));
  if (p[0] + rx < -80 || p[0] - rx > W + 80 || p[1] - ry > H + 40) return;
  xctx.globalAlpha = cl(al); xctx.lineWidth = Math.max(1, lw * K);
  xctx.beginPath(); xctx.ellipse(p[0], p[1], rx, ry, 0, 0, TAU); xctx.stroke(); xctx.globalAlpha = 1;
  rctx.save(); rctx.setTransform(1, 0, 0, 1, 0, 0);
  rctx.globalAlpha = cl(al * .55); rctx.lineWidth = Math.max(1.4, lw * 1.2 * K); rctx.strokeStyle = '#000';
  rctx.beginPath(); rctx.ellipse(p[0], p[1] + 2.2 * K, Math.max(.6, rx - 3 * K), Math.max(.5, ry - 1.6 * K), 0, 0, TAU);
  rctx.stroke(); rctx.restore();
}
function ripple(cam, x, z, age, big) {
  if (age < 0 || age > 2.1) return;
  for (let j = 0; j < (big ? 3 : 2); j++) {
    const a = age - j * .16; if (a <= 0) continue;
    const r = .04 + (big ? .70 : .44) * Math.pow(a, .62);
    ring(cam, x, z, r, Math.pow(1 - a / 2.1, 2) * (big ? .95 : .68) * (j ? .55 : 1), 2.4 * Math.min(2.2, 10 / Math.max(1, z - (cam.cz || 0))));
  }
}
function drops(cam, x, y0, z, n, seed, spread, age, spd) {   // bright beads in the air
  if (age < 0) return;
  for (let i = 0; i < n; i++) {
    const a = age * (.45 + hash(seed + i * 3) * .8) * (spd || 1);
    const dx = (hash(seed * 3 + i) - .5) * spread, dz = (hash(seed * 7 + i) - .5) * spread * .5;
    const y = y0 - 4.4 * a * a - hash(i * 5 + seed) * .22; if (y < .01) continue;
    const p = project(cam, x + dx, y, z + dz);
    const r = Math.max(.9 * K, (.008 + hash(i + seed) * .010) * p[2]);
    xctx.globalAlpha = .92; xctx.beginPath(); xctx.arc(p[0], p[1], r, 0, TAU); xctx.fill();
    if (hash(i * 13 + seed) > .5) { xctx.globalAlpha = .30; xctx.fillRect(p[0] - r * .3, p[1] - r * 5, r * .6, r * 5); }
  }
  xctx.globalAlpha = 1;
}
function splashCrown(cam, x, z, s, age, seed) {
  const lift = Math.min(1, Math.max(0, age) * 5);
  for (let i = 0; i < 30; i++) {
    const a = i / 30 * TAU, r = (.10 + hash(i * 3 + seed) * .12) * s, h = (.05 + hash(i * 7 + seed) * .26) * s * lift;
    const p = project(cam, x + Math.cos(a) * r, h, z + Math.sin(a) * r * .8);
    const rr = Math.max(1 * K, (.007 + hash(i + seed) * .007) * p[2]);
    xctx.globalAlpha = .95; xctx.beginPath(); xctx.arc(p[0], p[1], rr, 0, TAU); xctx.fill();
  }
  xctx.globalAlpha = 1;
}
function furrow(cam, xa, xb, z, al) {                       // light lying in an empty tilled row
  const a = project(cam, xa, 0, z), b = project(cam, xb, 0, z);
  xctx.globalAlpha = al; xctx.lineWidth = 1.8 * K; xctx.beginPath();
  xctx.moveTo(a[0], a[1]); xctx.lineTo(b[0], b[1]); xctx.stroke(); xctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- the clock: colour and the sinking sun
const skyPh = t => seg(t, [[0, .02], [4, .08], [10, .16], [18, .26], [21.3, .32], [25.3, .40], [33.3, .52], [45.3, .66], [50, .78], [53.4, .86], [58, 1.0]]);
const sunV = t => seg(t, [[0, .048], [6, .040], [12, .030], [18, .020], [25, .012], [33, .007], [41, .003], [45.3, -.001], [50, -.004], [58, -.004]]);
const sunU = t => seg(t, [[0, .02], [4, -.04], [6.75, .05], [10, .02], [15.3, .04], [18, .00], [21.3, .02], [25.3, .04], [33.3, .02], [45.3, .0], [53.4, .02], [58, .0]]);
const MUSIC = [[0, 18.0], [21.9, 44.6], [46.0, 53.4]];
function pulseAt(t) { for (const [a, b] of MUSIC) if (t >= a && t < b) { const bt = ((t % B) + B) % B; return Math.exp(-bt / .15); } return 0; }

// ---------------------------------------------------------------- the freeze at the end
const FZ = 53.40, FZE = 55.60;
const tsOf = t => (t < FZ ? t : (t < FZE ? FZ : t - (FZE - FZ)));

// ---------------------------------------------------------------- sound cues
const EV = window.EV = [];
const ev = (t, type, o) => EV.push(Object.assign({ t: +(+t).toFixed(4), type }, o || {}));

// ---------------------------------------------------------------- cast helpers
const mc = (cam, x, z, pf, pose, hat, y, extra) => both(cam, x, y || 0, z, 1, pf || 1, c => {
  CAST.human(c, pose, { hat }); if (extra) extra(c, pose);
});
const P = (sched, t) => CAST.poseAt(sched, t);
const hoeAng = u => u < .55 ? lerp(1.86, -.62, eio(cl(u / .55))) : lerp(-.62, 1.86, eio(cl((u - .55) / .45)));
const HOE_TOOL = u => (c, p) => CAST.tool(c, p, 'hoe', hoeAng(u));

// ================================================================ shots
// ---------- S1 0.000–4.000  the roll call: six civilisations breathe in unison, the seventh half a beat late
const S1 = [
  { x: -4.9, z: 44.0, hat: 'feather' }, { x: -3.3, z: 45.0, hat: 'block' }, { x: -1.7, z: 44.4, hat: 'hood' },
  { x: -0.1, z: 45.2, hat: 'band' }, { x: 1.5, z: 44.6, hat: 'bun' }, { x: 3.1, z: 45.0, hat: 'feather' },
  { x: 4.9, z: 45.4, hat: 'crest' },
];
const SINK = 2.62;
function shot1(t, s) {
  const cam = { f: 5.4, hor: .615, ch: .80, cx: 0, cz: 0, yaw: 0 };
  S1.forEach((e, i) => {
    const late = i === 6 ? .333 : 0;
    const pose = P([[late, 'stand'], [.667 + late, 'lookUp'], [1.334 + late, 'stand'], [2.0 + late, 'lookUp'], [2.667 + late, 'stand'], [3.334 + late, 'lookUp']], s);
    const t0 = SINK + i * .045;
    const sink = i < 6 && s > t0 ? 2.3 * eio(env(s, t0, t0 + .58)) : 0;
    if (i < 6) ev(t0, 'sink', { i });
    mc(cam, e.x, e.z, 1, pose, e.hat, -sink);
    if (i < 6 && s > t0) {
      ripple(cam, e.x, e.z, s - t0, true);
      if (s - t0 < .8) drops(cam, e.x, .35, e.z, 5, i * 3 + 2, .5, s - t0);
    }
  });
  return { cam, sun: [sunU(t), sunV(t)], sunR: .045 };
}

// ---------- S2 4.000–6.750  the rod, the rim of the sun, and the hair of error
function shot2(t, s) {
  const cam = { f: seg(t, [[4, 5.9], [6.75, 6.5]]), hor: .70, ch: .95, cx: .28, cz: 0, yaw: 0 };
  const sun = [.075, sunV(t)], sunR = .050;
  mc(cam, .20, 20, 1, P([[-1, 'sight']], s), 'band');
  // the rod, drawn between two projected points so its notch lands exactly on the rim
  const hand = project(cam, .20 - .02, 1.875, 20);
  const fpx = cam.f * H, sx = W / 2 + (sun[0] - cam.yaw) * fpx, sy = cam.hor * H - sun[1] * fpx, rr = sunR * fpx;
  const tipX = sx, tipY = sy - rr * .995;
  const dxx = tipX - hand[0], dyy = tipY - hand[1], L = Math.hypot(dxx, dyy);
  const uxx = dxx / L, uyy = dyy / L, wxx = -uyy, wyy = uxx, th = 2.6 * K;
  fctx.save(); fctx.setTransform(1, 0, 0, 1, 0, 0);
  fctx.beginPath();
  fctx.moveTo(hand[0] + wxx * th, hand[1] + wyy * th); fctx.lineTo(tipX + wxx * th, tipY + wyy * th);
  fctx.lineTo(tipX - wxx * th, tipY - wyy * th); fctx.lineTo(hand[0] - wxx * th, hand[1] - wyy * th);
  fctx.closePath(); fctx.fill();
  const bar = (at, half) => {                                   // the sight notch at the far end
    const bx = hand[0] + uxx * L * at, by = hand[1] + uyy * L * at, hh = 3.4 * K;
    fctx.beginPath();
    fctx.moveTo(bx + wxx * half, by + wyy * half); fctx.lineTo(bx + uxx * hh + wxx * half, by + uyy * hh + wyy * half);
    fctx.lineTo(bx + uxx * hh - wxx * half, by + uyy * hh - wyy * half); fctx.lineTo(bx - wxx * half, by - wyy * half);
    fctx.closePath(); fctx.fill();
  };
  bar(1.0, 26 * K); bar(.63, 13 * K);
  fctx.restore();
  for (const a of [4.68, 5.33]) if (s > a && s < a + .55) ripple(cam, .20, 20, s - a, false);
  return { cam, sun, sunR };
}

// ---------- S3 6.750–10.000  one hoe strike per beat; no iron, no canal
const HOE = [{ x: -2.4, z: 16.5, ph: 0 }, { x: .3, z: 18.2, ph: .5 }, { x: 2.5, z: 19.6, ph: .25 }];
const hoePose = (u, t) => u < .55 ? P([[-1, 'hoeUp'], [0, 'hoeDown', .16]], u / .55) : P([[-1, 'hoeDown'], [0, 'hoeUp', .22]], (u - .55) / .45);
function shot3(t, s) {
  const cam = { f: 4.2, hor: .62, ch: .55, cx: seg(t, [[6.75, -1.1], [10, 1.3]]), cz: 0, yaw: 0 };
  for (let k = 0; k < 5; k++) furrow(cam, -5.0, 5.0, 13.4 + k * .9, .24 + .07 * Math.sin(t * 1.7 + k));
  HOE.forEach((e, i) => {
    const u = (((s - 6.75) / B + e.ph) % 2 + 2) % 2;
    mc(cam, e.x, e.z, 1, hoePose(u, s), '', 0, HOE_TOOL(u));
    const st = 6.75 + (Math.floor((s - 6.75) / B + e.ph) + 1 - e.ph) * B;
    const age = s - st;
    if (age > 0 && age < 1.1) ripple(cam, e.x + 1.1, e.z, age, false);
    if (age > 0 && age < .55) drops(cam, e.x + 1.1, .12, e.z, 4, 10 + i, .35, age, 1.3);
    ev(st, 'hoe', { i });
  });
  return { cam, sun: [sunU(t), sunV(t)], sunR: .042 };
}

// ---------- S4 10.000–15.333  pull back: the tower rises behind the thatch
function shot4(t, s) {
  const cam = { f: seg(t, [[10, 4.4], [15.33, 2.7]]), hor: .585, ch: .85, cx: 0, cz: 0, yaw: 0 };
  const rise = eout(env(t, 10.2, 13.6));
  both(cam, 9.0, 0, 120, 1, 1, c => CAST.pyramid(c, 20, 13 * rise, 7));
  both(cam, -3.6, 0, 23.5, 1, 1, c => CAST.hut(c, 2.7, 2.30));
  both(cam, -7.6, 0, 30.0, 1, 1, c => CAST.hut(c, 2.2, 1.70));
  
  // the small one stoops into the doorway and stays in
  const down = s > 14.25 ? .95 * eio(env(s, 14.25, 14.95)) : 0;
  both(cam, -3.2, -down, 23.7, 1, 1, c => CAST.human(c, P([[-1, 'stoop']], s), { hat: '' }), 0, true);
  HOE.forEach((e, i) => {
    const u = (((s - 10) / B + e.ph + 1) % 2 + 2) % 2;
    mc(cam, -1.9 + i * .4, 21.0 + i * .3, 1, hoePose(u, s), '', 0, HOE_TOOL(u));
  });  return { cam, sun: [sunU(t), sunV(t)], sunR: .040 };
}

// ---------- S5 15.333–18.000  the wide: stone and thatch in one frame, and the work stops
function shot5(t, s) {
  const cam = { f: seg(t, [[15.33, 2.7], [17.2, 2.42]]), hor: .585, ch: 1.1, cx: 0, cz: 0, yaw: 0 };
  both(cam, 9.0, 0, 120, 1, 1, c => CAST.pyramid(c, 20, 13, 7));
  both(cam, -3.6, 0, 23.5, 1, 1, c => CAST.hut(c, 2.7, 2.30));
  both(cam, -7.6, 0, 30.0, 1, 1, c => CAST.hut(c, 2.2, 1.70));
  
  HOE.forEach((e, i) => {
    const pose = s < 15.7 ? hoePose((((s - 10) / B + e.ph + 1) % 2 + 2) % 2, s) : P([[15.85, 'lookUp']], s);
    mc(cam, -1.9 + i * .4, 21.0 + i * .3, 1, pose, '', 0, s < 15.7 ? HOE_TOOL((((s - 10) / B + e.ph + 1) % 2 + 2) % 2) : null);
  });
  return { cam, sun: [sunU(t), sunV(t)], sunR: .038 };
}

// ---------- S6 18.000–21.333  alone in the glitter, and the music dies
function shot6(t, s) {
  const cam = { f: seg(t, [[18, 6.0], [21.33, 6.7]]), hor: .655, ch: .72, cx: .02, cz: 0, yaw: 0 };
  mc(cam, .02, 17.5, 1, P([[-1, 'stand'], [18.7, 'lookUp'], [19.34, 'stand'], [20.0, 'lookUp'], [20.67, 'stand']], s), 'crest');
  for (const a of [18.2, 19.0, 19.8, 20.5]) ripple(cam, .95, 17.5, s - a, false);
  return { cam, sun: [sunU(t), sunV(t)], sunR: .042 };
}

// ---------- S7 21.333–25.333  the black wipe, then the caretaker under the sun
const WIPE = 21.333, WIPE_END = 21.92;
function shot7(t, s) {
  if (s < WIPE_END) {                                  // a near giant crosses the lens: the wipe is his robe
    const cam = { f: 4.0, hor: .58, ch: .9, cx: 0, cz: 0, yaw: 0 };
    const x = lerp(7.5, -8.5, eio(env(s, WIPE, WIPE_END)));
    both(cam, x, -.2, 2.8, 3.6, 1, c => CAST.giant(c, {}, { arm: 0 }));
    return { cam, sun: [sunU(t), sunV(t)], sunR: .040 };
  }
  const cam = { f: 6.3, hor: .625, ch: .95, cx: .05, cz: 0, yaw: 0 };
  const GZ = 30, GS = 1.85;
  both(cam, .55, 0, GZ, GS, 1, c => CAST.giant(c, {}, { arm: 1, tilt: .05 }));
  [[-2.4, 30.6], [-1.9, 31.0], [-1.4, 31.4]].forEach((q, i) => {
    mc(cam, q[0], q[1], 1, P([[-1, 'stand'], [22.4 + i * .12, 'lookUp'], [23.7, i === 1 ? 'reach' : 'lookUp']], s), 'crest');
  });
  if (s > 23.6) mc(cam, lerp(-4.6, -3.4, eio(env(s, 23.6, 24.9))), 31.8, 1, P([[-1, 'walk']], s), '');
  ev(21.9, 'giant');
  return { cam, sun: [sunU(t), sunV(t)], sunR: .055 };
}

// ---------- S8 25.333–30.667  the spade, one scrape per beat
const SC = [26.55, 27.55, 28.55, 29.55];
function shot8(t, s) {
  const cam = { f: seg(t, [[25.33, 5.0], [30.67, 5.7]]), hor: .60, ch: .62, cx: seg(t, [[25.33, .1], [30.67, .55]]), cz: 0, yaw: 0 };
  const pose = P([[-1, 'kneel'], [26.05, 'stoop', .14], [26.5, 'kneel'], [27.05, 'stoop', .14], [27.5, 'kneel'],
                  [28.05, 'stoop', .14], [28.5, 'kneel'], [29.05, 'stoop', .14], [29.5, 'kneel'], [30.1, 'lookUp']], s);
  mc(cam, .55, 11.5, 1, pose, 'brim', 0, (c, p) => CAST.tool(c, p, 'spade', -.98));
  SC.forEach((a, i) => {
    if (s > a) { drops(cam, .55 + .62, .48, 11.5, 7, 40 + i * 5, 1.0, s - a); ev(a, 'scrape', { i }); }
    if (s > a) ripple(cam, .55 + .62, 11.5, s - a, false);
  });
  return { cam, sun: [sunU(t), sunV(t)], sunR: .042 };
}

// ---------- S9 30.667–33.333  pan to the water: the stela comes up dripping
const ST = { x: 3.05, z: 22.0, w: 1.05, h: 2.7 };
function shot9(t, s) {
  const cam = { f: 5.8, hor: .70, ch: .70, cx: seg(t, [[30.67, .5], [33.33, .95]]),
                cz: 0, yaw: seg(t, [[30.67, 0], [32.5, .075], [33.33, .082]]) };
  mc(cam, -1.55, 20.0, 1, P([[-1, 'kneel'], [31.7, 'lookUp']], s), 'brim');
  const up = -ST.h * 1.05 * (1 - eout(env(s, 31.2, 32.7)));
  both(cam, ST.x, up, ST.z, 1, 1, c => CAST.stela(c, ST.w, ST.h));
  if (s > 31.5 && s < 33.1) drops(cam, ST.x - .35, ST.h + up - .05, ST.z, 10, 61, .9, s - 31.5, .75);
  if (s > 31.6 && s < 33.0) ripple(cam, ST.x, ST.z, s - 31.9, true);
  ev(32.6, 'stela');
  return { cam, sun: [sunU(t), sunV(t)], sunR: .040 };
}

// ---------- S10–S13 33.333–50.000  the face of the stone: seven marks, then two columns, then the same column twice
const G7 = 7, STZ = 30;
const slabW = (t) => t < 36.0 ? 1.7 : 2.9;
function stelaFace(t, s) {
  const cam = { f: seg(t, [[33.33, 6.6], [36, 5.7], [41.33, 5.55], [45.4, 5.9], [50, 5.2]]),
                hor: .72, ch: 1.2, cx: seg(t, [[36, 0], [41.33, -.1], [45.3, .0]]), cz: 0, yaw: 0 };
  both(cam, 0, 0, STZ, 1, 1, c => CAST.stela(c, slabW(t), 4.6));
  const baseY = 3.30, step = .44;
  // the young column: cut-outs in the slab, so the sky reads through them
  const nAppear = Math.min(G7, Math.max(0, Math.floor((s - 33.34) / B) + 1));
  const wob = (t > 41.33 && t < 45.3) ? glyphWob(t) : 0;
  const merge = t < 45.5 ? 0 : eio(env(t, 45.5, 45.85));
  const colBx = t < 36.0 ? null : lerp(.72, -.40, merge);
  fctx.save(); fctx.setTransform(1, 0, 0, 1, 0, 0);
  fctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < nAppear; i++) {
    const p = project(cam, -.40, baseY - i * step, STZ);
    fctx.save(); fctx.translate(p[0], p[1]); fctx.scale(p[2] * .40, -p[2] * .40);
    CAST.glyph(fctx, i, 1, wob * (i === 3 ? 1 : .55)); fctx.restore();
  }
  if (colBx !== null) for (let i = 0; i < G7; i++) {
    const p = project(cam, colBx, baseY - i * step, STZ);
    fctx.save(); fctx.translate(p[0], p[1]); fctx.scale(p[2] * .40, -p[2] * .40);
    CAST.glyph(fctx, i, 1, 0); fctx.restore();
  }
  fctx.restore(); fctx.globalCompositeOperation = 'source-over';
  if (merge > .5) ev(45.7, 'snap');
  const labels = [];
  if (t >= 36.0 && t < 45.3) {
    const a = project(cam, -.40, 3.86, STZ), b = project(cam, colBx, 3.86, STZ);
    labels.push({ id: 'labA', text: '雏形', x: a[0], y: a[1] - 18 * K });
    labels.push({ id: 'labB', text: '成熟玛雅文', x: b[0], y: b[1] - 18 * K });
  }
  return { cam, sun: [-.02, sunV(t)], sunR: .034, labels };
}
// three attempts to grow, each snapped back
function glyphWob(t) {
  const a = [41.4, 42.05, 42.7];
  let w = 0;
  a.forEach((s0, i) => { const u = (t - s0) / .30; if (u > 0 && u < 1) w = Math.max(w, Math.sin(PI * u) * (1 + i * .25)); });
  return w;
}

// ---------- S14 50.000–53.400  the finished part, set down into the stone chamber
const CH = { x: 3.5, z: 46, w: 3.6, h: 2.0 }, PRT = { x: 3.5, z: 44.6 };
// a giant forearm reaching down out of the sky; the dressed part in its fist
function armDrop(cam, x, py, z, carry) {
  solo(cam, x, py, z, 1, 1, c => {
    c.beginPath();
    c.moveTo(-.86, 9.6); c.lineTo(-.40, 3.4); c.lineTo(-.335, 1.30); c.lineTo(-.235, .58);
    c.lineTo(.235, .58); c.lineTo(.335, 1.30); c.lineTo(.40, 3.4); c.lineTo(.86, 9.6);
    c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, .34, .40, .34, 0, 0, TAU); c.fill();          // the fist
  });
  if (carry) partAt(cam, x, py - .30, z);
}
function partAt(cam, x, y, z) {                     // the dressed part: a block with its step on top
  solo(cam, x, y, z, 1, 1, c => {
    c.beginPath(); c.rect(-.45, -.26, .90, .36); c.fill();
    c.beginPath(); c.rect(-.23, .088, .46, .10); c.fill();
  });
}
function chamberShot(t, s, down) {
  const cam = { f: seg(t, [[50, 6.2], [53.4, 6.6]]), hor: .58, ch: .95, cx: .30, cz: 0, yaw: 0 };
  both(cam, CH.x, 0, CH.z, 1, 1, c => CAST.warehouse(c, CH.w, CH.h));
  const py = lerp(3.5, .78, seg(s, [[50.2, 0], [53.0, 1]]));
  armDrop(cam, PRT.x, py, PRT.z, true);
  return { cam };
}
function shot14(t, s) {
  const r = chamberShot(t, s, false);
  if (s > 53.0) { ripple(r.cam, PRT.x, PRT.z, s - 53.0, true); drops(r.cam, PRT.x, .25, PRT.z, 6, 71, .8, s - 53.0); }
  ev(53.0, 'setdown');
  return { ...r, sun: [sunU(t), sunV(t)], sunR: .042 };
}

// ---------- S15 53.400–58.000  the hand lets go, the freeze, the orbit, and the one who walks into the sun
function shot15(t, s) {
  const frozen = t < FZE;
  const cam = { f: 7.0 - .6 * (frozen ? eio(env(t, FZ, FZE)) : 1), hor: .555, ch: .95,
                cx: .30 - (frozen ? .12 * eio(env(t, FZ, FZE)) : .12),
                cz: 0, yaw: (frozen ? .014 * eio(env(t, FZ, FZE)) : .014) };
  both(cam, CH.x, 0, CH.z, 1, 1, c => CAST.warehouse(c, CH.w, CH.h), 0, true);
  partAt(cam, PRT.x, .48, PRT.z);
  const arm = .78 + 2.55 * eio(env(t, 53.06, 53.40)) + 10.0 * eio(env(t, 55.60, 56.30));
  if (arm < 9.0) armDrop(cam, PRT.x, arm, PRT.z, false);
  const wf = frozen ? FZ - 53.4 : t - 53.4;
  ripple(cam, PRT.x, PRT.z, 0, true);
  if (wf < 1.4) splashCrown(cam, PRT.x, PRT.z, .9, wf, 5);
  // he turns and walks along the water into the disc
  if (t > 55.4) {
    const face = t > 55.85 ? -1 : 1;
    both(cam, lerp(-12.0, -.60, eio(env(t, 55.4, 57.1))), 0, 44, 1.45, face, c => CAST.giant(c, { arm: 0 }, { tilt: .05 }));
    ev(55.5, 'step');
  }
  if (t > 57.0) { cam.f = lerp(cam.f, 4.9, eio(env(t, 57.0, 58.0))); cam.hor = .60; }
  return { cam, sun: [sunU(t), sunV(t)], sunR: .042 };
}

// ================================================================ the reel
const SEC = [
  [0.000, 4.000, shot1], [4.000, 6.750, shot2], [6.750, 10.000, shot3], [10.000, 15.333, shot4],
  [15.333, 18.000, shot5], [18.000, 21.333, shot6], [21.333, 25.333, shot7], [25.333, 30.667, shot8],
  [30.667, 33.333, shot9], [33.333, 50.000, stelaFace], [50.000, 53.400, shot14], [53.400, 58.000, shot15],
];

// ---------------------------------------------------------------- type
const CREAM = '#FFF6DC';
const NOSUB = /subs=0/.test(location.search);        // stills for a poster carry no burnt subtitle
let CUES = [], SUB = null;
fetch('out/cues.json').then(r => r.json()).then(j => { CUES = j; }).catch(() => { });

function type(t, r) {
  octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, W, H);
  const cue = NOSUB ? null : CUES.find(c => t >= c.t0 && t < c.t1);
  if (cue) {
    octx.font = `700 ${Math.round(46 * K)}px SCBold`;
    octx.fillStyle = CREAM; octx.textBaseline = 'alphabetic'; octx.globalAlpha = .96;
    octx.fillText(cue.text, 118 * K, H - 92 * K);
    octx.globalAlpha = 1;
  }
  if (t >= 4.55 && t < 6.76) {                       // the one number, landing on a beat
    const u = eback(env(t, 4.58, 4.78));
    octx.globalAlpha = .97;
    octx.font = `${Math.round(96 * K)}px Anton`;
    octx.fillStyle = CREAM; octx.textBaseline = 'alphabetic';
    octx.fillText('17′28″', 122 * K, H - 250 * K + (1 - u) * 26 * K);
    octx.globalAlpha = 1;
  }
  if (r && r.labels) {
    octx.font = `700 ${Math.round(34 * K)}px SCBold`;
    octx.fillStyle = CREAM; octx.textAlign = 'center'; octx.globalAlpha = .92;
    for (const L of r.labels) octx.fillText(L.text, L.x, L.y);
    octx.textAlign = 'left'; octx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- render
function clearAll() {
  for (const x of [fctx, rctx, xctx]) {
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.fillStyle = INK;
  }
  xctx.strokeStyle = LIGHT; xctx.fillStyle = LIGHT;
}
window.render = t => {
  t = cl(t, 0, DUR - 1e-4);
  clearAll();
  const sec = SEC.find(s => t >= s[0] && t < s[1]) || SEC[SEC.length - 1];
  const r = sec[2](t, tsOf(t));
  draw({
    T: t, hor: r.cam.hor * H, fpx: r.cam.f * H, yaw: r.cam.yaw, cx: r.cam.cx, ch: r.cam.ch,
    sun: r.sun, sunR: r.sunR, ph: skyPh(t), pulse: pulseAt(t), flash: 0,
    rays: 1, vs: 1 + (r.cam.f - 3) / 5,
  }, [LF, LR, LX]);
  type(t, r);
};
window.TEXTS = t => {
  const out = [];
  if (t >= 4.55 && t < 6.76) out.push({ id: 'err', text: '17′28″', x0: 122 * K, y0: H - 350 * K, x1: 122 * K + 420 * K, y1: H - 245 * K });
  return out;
};
window.READY = false;
document.fonts.ready.then(() => { window.READY = true; });
