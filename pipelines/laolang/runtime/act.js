// act.js: a standard set of character actions — the gait, the stop, the look, the expressions.
// Pure functions of time, style-agnostic, no DOM, nothing here draws. Every action computes the
// per-frame POSE values that a style's character function consumes (laolang's arch() is the
// reference consumer; any style that draws figures can read the same fields).
//
//   <script src="lib/act.js"></script>            → window.ACT
//
// ---- the pose contract (numbers, one per field; a character function reads what it draws) ----
//   ph      gait phase (cycles; one cycle per stride)          walk    0..1 how much of the gait shows
//   stop    0 walking → 1 fully stopped                        settle  0..1 the sink on the final plant
//   L       stride length (logical units ≈ height / 3)         lift    how high the foot swings
//   lean    body lean (radians-ish, character decides)         nod     0..1 head-nod amount
//   armAmp  arm swing amplitude                                push    0..1 reach-and-press progress
//   face    head turn -1..1 (0 = straight ahead)               look    pupil x -1..1
//   lookY   pupil y -1..1 (-1 = up)                            blink   0/1 (1 = eyes shut)
//   brow    brow pressed down 0..1 (effort)                    browUp  brow raised 0..1 (curious / surprised)
//   mo      mouth openness (character's unit)                  teeth   0/1 show teeth
//   eyeWide eye enlargement 0..1                               sm      smile -1..1
//   rim     0..1 warm rim light (a lamp, an open door)
//
// ---- the one rule of the gait ----
// The gait phase must advance one cycle per stride travelled (dφ = dx / L), never per second.
// walkCurve() integrates that for you. Driven by t * frequency, a foot always slides.
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = (u) => u * u * (3 - 2 * u);
  const eIn = (u) => u * u, eOut = (u) => 1 - (1 - u) * (1 - u);
  const frac = (v) => v - Math.floor(v);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ============================================================
     THE GAIT
     ============================================================ */

  /* footStep(ph, L, lift, r) → { x, y }: foot offset relative to the hip centre,
     +x forward. Stance (planted) takes the fraction r of the cycle: the foot sweeps
     back exactly with the body's travel, so it never slides. Swing lifts it and
     carries it forward to the next plant. */
  const footStep = (ph, L, lift, r = 0.56) => {
    let u = ph % 1; if (u < 0) u += 1;
    if (u < r) return { x: L * (0.5 - u), y: 0 };
    const k = (u - r) / (1 - r), sw = (1 - Math.cos(Math.PI * k)) / 2;
    return { x: L * (0.5 - r) + L * r * sw, y: -lift * Math.sin(Math.PI * k) };
  };

  /* walkCurve({ t0, t1, x0, x1, L0, phEnd, slowStart, LMin }) → at(t) → { x, ph, stop, settle }
     A pre-integrated walk from (t0, x0) to a full stop at (t1, x1).
       - the position curve starts brisk (the character enters already walking) and ends
         with zero velocity: the last strides slow down by themselves;
       - the last part of the walk shortens the stride to LMin (small steps to a stop);
       - the final phase is shifted so the character stands with the feet apart
         (phEnd ≈ 0.06–0.14), never mid-stride, never both feet together;
       - after t1 everything freezes (x, ph, stop = 1) — call it a stand, not a slide;
       - settle rises to 1 a beat after t1: the sink of the final plant.
     Returns a table-backed function; safe to call every frame (pure, no state). */
  const walkCurve = (o) => {
    const { t0, t1, x0, x1, L0 } = o;
    const phEnd = o.phEnd ?? 0.1, slowStart = o.slowStart ?? 0.66, LMin = o.LMin ?? 0.6;
    const N = 400, D = x1 - x0;
    const slow = (t) => { const u = (t - t0) / (t1 - t0); return u <= 0 ? 0 : u >= 1 ? 1 : sm(seg(u, slowStart, 1)); };
    const g = (u) => 1 - Math.pow(1 - u, 2.2);
    const xs = [], phs = [], st = [];
    let phi = 0;
    for (let i = 0; i <= N; i++) {
      const u = i / N, t = t0 + (t1 - t0) * u, L = L0 * (1 - (1 - LMin) * slow(t));
      if (i > 0) phi += D * (g(u) - g((i - 1) / N)) / L;
      xs.push(x0 + D * g(u));
      phs.push(phi);
      st.push(sm(seg(t, t1 - 0.62, t1)));
    }
    const shift = phEnd - phi;
    for (let i = 0; i <= N; i++) phs[i] += shift;
    return (t) => {
      const u = clamp((t - t0) / (t1 - t0), 0, 1) * N;
      const i = Math.min(N - 1, Math.floor(u)), f = u - i;
      return {
        x: xs[i] + (xs[i + 1] - xs[i]) * f,
        ph: phs[i] + (phs[i + 1] - phs[i]) * f,
        stop: st[i] + (st[i + 1] - st[i]) * f,
        settle: t <= t1 ? 0 : Math.sin(Math.PI * clamp((t - t1) / 0.36, 0, 1)),
        walk: 1,
      };
    };
  };

  /* a walk that loops every `period` seconds across the stage: at(p) = walkCurve(p - period * k)
     with t0/t1 inside [0, period). For demonstrations and background extras. */
  const loopWalk = ({ period, t0, t1, x0, x1, L0, phEnd }) => {
    const base = walkCurve({ t0, t1, x0, x1, L0, phEnd });
    return (t) => base(t - period * Math.floor(t / period));
  };

  /* the body bob: the torso dips every half cycle (a foot plants twice per stride) */
  const bob = (ph, amp = 2.2) => -amp * Math.abs(Math.sin(TAU * 2 * (ph - 0.06)));

  /* the arm swing: front arm ↔ front leg (phase ph), back arm ↔ back leg (ph + 0.5) */
  const armSwing = (ph, amp) => ({
    front: Math.sin(TAU * ph + Math.PI) * amp,
    back: Math.sin(TAU * (ph + 0.5) + Math.PI) * amp,
  });

  /* footfall times of a walker: every crossing of a half cycle is a plant.
     Walkers[ ] is walkCurve functions; returns [{ t, walker }] — cue a step sound at each. */
  const footfalls = (walkers, from, to, step = 1 / 60) => {
    const out = [];
    for (let w0 = 0; w0 < walkers.length; w0++) {
      const w = walkers[w0];
      let prev = w(0).ph;
      for (let t = from; t < to; t += step) {
        const ph = w(t).ph;
        if (Math.floor(ph * 2 + 0.01) !== Math.floor(prev * 2 + 0.01)) out.push({ t, walker: w0 });
        prev = ph;
      }
    }
    return out;
  };

  /* ============================================================
     THE FACE
     ============================================================ */

  /* blinkOf(seed, t, per): a blink every `per` seconds, each person on their own beat.
     per may be a number or a function of t. */
  const blinkOf = (seed, t, per = 2.6) => frac(t / per) < 0.05 ? 1 : 0;

  /* window(t, at, dur, { ease }) → 0..1: a smooth rise used to switch a pose on.
     pulse(t, at, dur) → 0..1..0: a one-shot action and its return. */
  const windowAt = (t, at, dur, ease = sm) => dur <= 0 ? 0 : ease(seg(t, at, at + dur));
  const pulse = (t, at, dur, ease = sm) => {
    if (dur <= 0) return 0;
    const u = seg(t, at, at + dur);
    return u <= 0.5 ? ease(u * 2) : ease((1 - u) * 2);
  };

  /* lookAt(t, { at, dur, face, look, lookY, from }) → { face, look, lookY }: turn the head
     and the eyes to a target (face -1..1 around the body axis, look pupil, lookY -1 up).
     With dur = 0 it is a cut; from are the values to return to. */
  const lookAt = (t, o) => {
    const u = windowAt(t, o.at ?? 0, o.dur ?? 0.4);
    const from = o.from ?? {};
    return {
      face: lerp(from.face ?? 0, o.face ?? 0.4, u),
      look: lerp(from.look ?? 0, o.look ?? 0.5, u),
      lookY: lerp(from.lookY ?? 0, o.lookY ?? 0, u),
    };
  };

  /* ---- named expressions, one window each (compose with poseBlend) ----
     curious:  browUp, eyes up — noticed something above / ahead
     effort:   brow down, mouth shut tight — pushing, lifting
     surprise: eyes wide, pupils small, brows up, mouth open (teeth)
     idle:     the standing small print — a slow breath, an occasional blink */
  const curious = (t, at = 0, dur = 0.4) => {
    const u = windowAt(t, at, dur);
    return { browUp: 0.8 * u, lookY: -0.55 * u, look: 0.2 * u, face: 0.1 * u, mo: 0 };
  };
  const effort = (t, at = 0, dur = 0.3) => {
    const u = windowAt(t, at, dur);
    return { brow: 0.7 * u, mo: 0.18 * u, lean: 0.35 * u, sm: -0.3 * u };
  };
  const surprise = (t, at = 0, dur = 0.55) => {
    const u = windowAt(t, at, dur);
    return { eyeWide: u, browUp: u, mo: 0.42 * u, teeth: u > 0.55 ? 1 : 0, lean: -0.25 * u, rim: 0 };
  };
  const idle = (t, seed = 0) => {
    const br = 0.035 * Math.sin(TAU * (t / 3.1) + seed);          // breathing: chest rises and falls slowly
    const shift = 0.10 * Math.sin(TAU * (t / 5.7) + seed * 2);    // weight shifts foot to foot
    return { lean: 0.08 * (0.5 + 0.5 * Math.sin(TAU * (t / 7.3) + seed)), breath: br, shift, blink: blinkOf(seed, t, 2.6 + seed) };
  };

  /* ============================================================
     COMPOSING POSES
     ============================================================ */

  /* poseBlend(a, b, u): numbers lerp, 0/1 flags switch at u ≥ 0.5. Use it to layer a windowed
     expression (curious / effort / surprise) on top of the standing pose. */
  const poseBlend = (a, b, u) => {
    const o = {};
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
      const va = a ? a[k] : undefined, vb = b ? b[k] : undefined;
      if (vb === undefined) { o[k] = va; continue; }
      if (va === undefined) { o[k] = vb; continue; }
      o[k] = (k === 'teeth' || k === 'blink') ? (u >= 0.5 ? vb : va) : lerp(va, vb, u);
    }
    return o;
  };

  /* standAt(t, { at, dur, ph, ...rest }): the pose of a character who has stopped —
     feet planted in a natural stand, a tiny idle life on top. */
  const standAt = (t, o = {}) => {
    const u = windowAt(t, o.at ?? 0, o.dur ?? 0.4);
    const s = (o.settle ?? 0) * (1 - u);
    return {
      ph: o.ph ?? 0.1, L: o.L ?? 22, lift: o.lift ?? 8, walk: 1 - u, stop: u, settle: s,
      lean: lerp(o.lean ?? 0.9, o.standLean ?? 0.55, u),
      nod: (o.nod ?? 0.4) * (1 - u), armAmp: (o.armAmp ?? 12) * (1 - u),
      ...o.extra,
    };
  };

  window.ACT = {
    TAU, clamp, lerp, sm, eIn, eOut, frac, seg, hash,
    footStep, walkCurve, loopWalk, bob, armSwing, footfalls,
    blinkOf, windowAt, pulse, lookAt,
    curious, effort, surprise, idle,
    poseBlend, standAt,
  };
})();
