// CAST — this film's own silhouettes: local metres, y up, feet at y = 0, facing +x.
// Pure black shapes, one smooth contour each. People are hand-keyed pose targets blended joint by
// joint (never forward kinematics — a puppet reads as a puppet).
window.CAST = (function () {
  const TAU = Math.PI * 2, PI = Math.PI;
  const back = x => { x = Math.max(0, Math.min(1, x)); const c1 = 2.0, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

  // smooth closed contour through the given points (quadratic through the midpoints)
  function smooth(ctx, pts, closed) {
    const n = pts.length;
    if (closed) {
      const m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
      ctx.beginPath(); ctx.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[(i + 1) % n];
        ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) {
        const p = pts[i], q = pts[i + 1];
        ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      ctx.lineTo(pts[n - 1][0], pts[n - 1][1]);
      ctx.closePath(); ctx.fill();
    }
  }
  // a tapered tube along a polyline (thigh, calf, arm): offsets each point by its width
  function tube(ctx, pts, ws) {
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const L = Math.hypot(dx, dy) || 1e-4;
      dx /= L; dy /= L;
      const nx = -dy, ny = dx, w = ws[i] / 2;
      left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
      right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    smooth(ctx, left.concat(right.reverse()), true);
  }
  function bone(ctx, a, b, wa, wb, capA) {       // a short limb segment with round joints
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-4;
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    ctx.beginPath();
    ctx.moveTo(a[0] + nx * wa / 2, a[1] + ny * wa / 2);
    ctx.lineTo(b[0] + nx * wb / 2, b[1] + ny * wb / 2);
    ctx.lineTo(b[0] - nx * wb / 2, b[1] - ny * wb / 2);
    ctx.lineTo(a[0] - nx * wa / 2, a[1] - ny * wa / 2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(b[0], b[1], wb / 2, 0, TAU); ctx.fill();
    if (capA !== false) { ctx.beginPath(); ctx.arc(a[0], a[1], wa / 2, 0, TAU); ctx.fill(); }
  }

  // ---- skeleton of a 1.75 m adult; a pose is joint positions, not angles
  const J = {
    ankle: [.015, .075], knee: [.030, .470], hip: [.000, .900],
    pelvis: [.005, .920], waist: [.015, 1.100], chest: [.025, 1.290], shoulder: [.005, 1.420],
    neck: [.015, 1.455], head: [.045, 1.600],
    elbow: [.140, 1.150], wrist: [.198, .930],
    foot: [.135, .025],
  };
  const POSE = {
    stand: {},
    sight: { elbow: [-.075, 1.495], wrist: [-.020, 1.875], head: [.030, 1.615], neck: [.005, 1.460], chest: [-.005, 1.310] },
    hoeUp: { pelvis: [-.060, .940], waist: [-.095, 1.115], chest: [-.150, 1.295], shoulder: [-.185, 1.395],
             elbow: [-.300, 1.575], wrist: [-.255, 1.895], head: [-.200, 1.545], neck: [-.155, 1.435],
             knee: [-.020, .470], ankle: [.030, .075], hip: [-.075, .880] },
    hoeDown: { pelvis: [.030, .840], waist: [.140, .965], chest: [.255, 1.060], shoulder: [.290, 1.105],
               elbow: [.150, .930], wrist: [.300, .680], head: [.385, 1.190], neck: [.330, 1.145],
               knee: [.070, .440], ankle: [.030, .075], hip: [.050, .860] },
    stoop: { pelvis: [-.050, .800], waist: [.070, .930], chest: [.210, 1.020], shoulder: [.250, 1.090],
             elbow: [.140, .880], wrist: [.270, .650], head: [.375, 1.070], neck: [.310, 1.060],
             knee: [.010, .410], ankle: [-.030, .080], hip: [-.030, .820] },
    lookUp: { head: [.045, 1.635], neck: [.010, 1.470], chest: [.000, 1.300], shoulder: [-.020, 1.410] },
    reach: { chest: [-.030, 1.350], shoulder: [-.055, 1.440], elbow: [.120, 1.540], wrist: [.300, 1.700], head: [.055, 1.615] },
    carry: { chest: [.030, 1.330], shoulder: [.005, 1.430], elbow: [.170, 1.220], wrist: [.280, 1.170],
             elbowF: [-.020, 1.200], wristF: [.240, 1.130], head: [.050, 1.600] },
    walk: { hip: [.030, .900], knee: [.210, .520], ankle: [.290, .095], foot: [.380, .030],
            pelvis: [.020, .920], waist: [.005, 1.100], chest: [-.015, 1.290], shoulder: [-.035, 1.420],
            elbow: [-.110, 1.180], wrist: [-.075, .960], head: [.020, 1.600] },
    walkF: { hipF: [-.050, .900], kneeF: [-.170, .500], ankleF: [-.260, .090], footF: [-.180, .030],
             elbowF: [.035, 1.200], wristF: [.100, .980] },
    point: { chest: [-.020, 1.330], shoulder: [-.040, 1.430], elbow: [.160, 1.520], wrist: [.400, 1.600], head: [.060, 1.600] },
    kneel: { pelvis: [.010, .520], waist: [.060, .720], chest: [.100, .880], shoulder: [.120, .960],
             elbow: [.020, .740], wrist: [.140, .560], head: [.200, 1.020], neck: [.150, .960],
             knee: [.300, .400], ankle: [.160, .075], foot: [.280, .030], hip: [.020, .520],
             kneeF: [-.100, .060], ankleF: [-.260, .060], footF: [-.200, .030] },
  };

  function mix(a, b, u) {
    const o = {};
    for (const k in J) {
      const va = (a[k] !== undefined ? a[k] : J[k]), vb = (b[k] !== undefined ? b[k] : J[k]);
      if (va === undefined || vb === undefined) continue;
      if (Array.isArray(va) && Array.isArray(vb)) o[k] = [va[0] + (vb[0] - va[0]) * u, va[1] + (vb[1] - va[1]) * u];
      else if (typeof va === 'number' && typeof vb === 'number') o[k] = va + (vb - va) * u;
      else o[k] = va;
    }
    return o;
  }
  function poseAt(sched, t) {                    // [[t, name, dur], ...]
    let cur = POSE[sched[0][1]] || POSE.stand;
    for (let i = 1; i < sched.length; i++) {
      const [tk, name, d] = sched[i];
      if (t < tk) break;
      const u = (t - tk) / (d || .13);
      const tgt = POSE[name] || POSE.stand;
      cur = u >= 1 ? tgt : mix(cur, tgt, back(u));
    }
    return mix(J, cur, 1);
  }

  // ---- the head: a real profile (brow, nose, lips, chin, jaw) + this group's head-dress
  const HEAD_PTS = [
    [-.070, .000], [-.078, .062], [-.030, .100], [.030, .102], [.062, .066], [.068, .034],
    [.098, .006], [.080, -.008], [.086, -.021], [.077, -.029], [.079, -.050], [.068, -.066],
    [.034, -.088], [-.004, -.092], [-.044, -.076], [-.070, -.030],
  ];
  function head(ctx, p, s, hat, tilt) {
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(tilt || 0); ctx.scale(s, s);
    smooth(ctx, HEAD_PTS, true);
    ctx.beginPath(); ctx.ellipse(-.028, .014, .019, .026, .22, 0, TAU); ctx.fill();   // ear
    if (hat === 'crest') {           // Maya: the sloped forehead continues into a tall crest
      smooth(ctx, [[-.074, .000], [-.098, .120], [-.050, .186], [.030, .190], [.070, .120], [.062, .070], [.020, .058], [-.040, .030], [-.070, .005]], true);
    } else if (hat === 'feather') {  // a fan of plumes
      for (let i = 0; i < 7; i++) {
        const a = -.46 - i * .15, L = .150 + .030 * Math.sin(i * 1.3);
        ctx.save(); ctx.translate(-.028, .060); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, L, .020, L * .95, 0, 0, TAU); ctx.fill(); ctx.restore();
      }
      ctx.beginPath(); ctx.ellipse(-.038, .046, .052, .050, 0, 0, TAU); ctx.fill();
    } else if (hat === 'block') {    // a square head-block
      smooth(ctx, [[-.086, .006], [-.080, .148], [.020, .146], [.076, .136], [.080, .020], [.020, .050], [-.040, .030]], true);
    } else if (hat === 'brim') {     // wide archaeologist's brim
      ctx.beginPath(); ctx.ellipse(.014, .058, .172, .024, -.05, 0, TAU); ctx.fill();
      smooth(ctx, [[-.086, .046], [-.070, .140], [.010, .144], [.082, .124], [.090, .050], [.020, .080], [-.040, .060]], true);
    } else if (hat === 'hood') {
      smooth(ctx, [[-.090, -.034], [-.108, .080], [-.040, .132], [.030, .128], [.076, .082], [.070, .046], [.020, .080], [-.040, .010]], true);
    } else if (hat === 'band') {
      smooth(ctx, [[-.080, .034], [-.066, .108], [.010, .120], [.048, .100], [.050, .046], [.010, .072]], true);
    } else if (hat === 'bun') {
      ctx.beginPath(); ctx.ellipse(-.056, .086, .044, .042, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-.102, .044, .028, .030, .35, 0, TAU); ctx.fill();
    } else if (hat === 'crown') {     // the caretaker: a stepped crest that reads at distance
      smooth(ctx, [[-.110, -.010], [-.116, .130], [-.092, .208], [-.020, .246], [.052, .226], [.080, .150], [.046, .074], [-.020, .040], [-.082, .004]], true);
      ctx.beginPath(); ctx.rect(-.104, .146, .176, .030); ctx.fill();
    }
    ctx.restore();
  }

  // ---- the body: one continuous contour; the near/far limbs tuck behind it
  function human(ctx, p, o) {
    o = o || {};
    const hat = o.hat || '', tilt = o.tilt || 0;
    const pel = p.pelvis, sh = p.shoulder, ch = p.chest, wa = p.waist;
    const bx = sh[0] - pel[0], by = sh[1] - pel[1];
    const L = Math.hypot(bx, by) || 1e-4, nx = -by / L, ny = bx / L;      // across the body, front +
    const T = (base, d, dy) => [base[0] + nx * d, base[1] + ny * d + (dy || 0)];

    // far leg, far arm
    if (p.hipF && p.kneeF && p.ankleF && p.footF) {
      tube(ctx, [[p.hipF[0] - .02, p.hipF[1] + .02], p.hipF, p.kneeF, p.ankleF], [.150, .145, .100, .062]);
      bone(ctx, p.ankleF, p.footF, .062, .050);
    }
    if (p.elbowF && p.wristF) { tube(ctx, [p.shoulder, p.elbowF, p.wristF], [.090, .072, .050]); }
    // legs
    tube(ctx, [[p.hip[0] + .045, p.hip[1] + .02], [p.hip[0] + .035, p.hip[1]], p.knee, p.ankle], [.150, .150, .105, .064]);
    bone(ctx, p.ankle, p.foot, .064, .052);
    // torso
    smooth(ctx, [
      T([pel[0] - .010, pel[1] - .055], -.140),      // buttock
      T(wa, -.112), T(ch, -.126), T(sh, -.110),      // back rail
      T([sh[0] + .020, sh[1] + .010], .020),
      T(sh, .094), T(ch, .120), T([wa[0] + .005, wa[1] - .010], .114), T([pel[0] + .010, pel[1] + .010], .144),
      T([pel[0] + .005, pel[1] - .070], .105),
      T([pel[0] - .004, pel[1] - .115], .010),
    ], true);
    // the seat closes the crotch: a silhouette never shows a gap there
    ctx.beginPath(); ctx.ellipse(pel[0] + .012, pel[1] - .030, .105, .085, 0, 0, TAU); ctx.fill();
    // neck
    tube(ctx, [[p.neck[0], p.neck[1] - .085], [p.head[0] - .010, p.head[1] - .078]], [.132, .098]);
    // near arm
    tube(ctx, [p.shoulder, p.elbow, p.wrist], [.098, .076, .055]);
    head(ctx, p.head, o.headS || 1, hat, tilt);
  }

  // ---- the caretaker: the same rig as everyone else, a gown instead of legs, a stepped crown
  function giant(ctx, p, o) {
    o = o || {};
    // the gown: a long skirt that reaches the water; everything inside it merges, so the legs vanish
    smooth(ctx, [[-.300, .000], [-.322, .300], [-.250, .620], [-.196, .880], [-.158, 1.130],
                 [.158, 1.130], [.200, .880], [.256, .620], [.328, .300], [.302, .000]], true);
    ctx.beginPath(); ctx.ellipse(-.108, .026, .040, .055, 0, 0, TAU); ctx.fill();       // two folds at the hem
    ctx.beginPath(); ctx.ellipse(.100, .022, .036, .050, 0, 0, TAU); ctx.fill();
    const base = poseAt([[0, 'stand']], 0);
    const pp = Object.assign({}, base);
    if (o.arm) {                                     // the near arm comes forward, the far hand steadies the part
      pp.elbow = [.250, 1.140]; pp.wrist = [.404, 1.186];
      pp.elbowF = [.208, 1.108]; pp.wristF = [.330, 1.170];
    } else {
      pp.elbow = [.232, 1.070]; pp.wrist = [.196, .900];
      pp.elbowF = [.196, 1.060]; pp.wristF = [.158, .880];
    }
    human(ctx, pp, { hat: 'crown', tilt: o.tilt === undefined ? .04 : o.tilt, headS: 1.14 });
    if (o.arm) {                                     // the finished part, resting across both palms
      ctx.save(); ctx.translate(.352, 1.148); ctx.rotate(-.06);
      ctx.beginPath(); ctx.rect(.000, .030, .390, .150); ctx.fill();
      ctx.beginPath(); ctx.rect(.046, .180, .300, .040); ctx.fill();                  // its dressed lip
      ctx.beginPath(); ctx.rect(.120, .000, .150, .034); ctx.fill();                  // the shadow gap under it
      ctx.restore();
    }
  }

  // ---- a tool held in the hand: ang is the shaft's direction in local radians (y up), so the swing is exact
  function tool(ctx, p, kind, ang) {
    const wx = p.wrist;
    let dx = Math.cos(ang), dy = Math.sin(ang);
    if (!isFinite(dx) || !isFinite(dy)) { const ex = p.elbow; dx = wx[0] - ex[0]; dy = wx[1] - ex[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; }
    const px = -dy, py = dx;
    const len = kind === 'spade' ? 1.02 : 1.06, th = kind === 'spade' ? .026 : .030;
    const tip = [wx[0] + dx * len, wx[1] + dy * len];
    ctx.beginPath();
    ctx.moveTo(wx[0] - .10 * dx + px * th, wx[1] - .10 * dy + py * th);
    ctx.lineTo(tip[0] + px * th, tip[1] + py * th);
    ctx.lineTo(tip[0] - px * th, tip[1] - py * th);
    ctx.lineTo(wx[0] - .12 * dx - px * th, wx[1] - .12 * dy - py * th);
    ctx.closePath(); ctx.fill();
    if (kind === 'spade') {                       // a blade turned square to the shaft, below its end
      const bx = tip[0] + dx * .02, by = tip[1] + dy * .02;
      smooth(ctx, [[bx + px * .112, by + py * .112], [bx + px * .074 + dx * .27, by + py * .074 + dy * .27],
                   [bx - px * .074 + dx * .27, by - py * .074 + dy * .27], [bx - px * .112, by - py * .112]], true);
    } else {                                      // a hoe head across the shaft's end, turned to face the swing
      const bx = tip[0] + dx * .02, by = tip[1] + dy * .02;
      ctx.beginPath();
      ctx.moveTo(bx + px * .10, by + py * .10);
      ctx.lineTo(bx + dx * .085 + px * .10, by + dy * .085 + py * .10);
      ctx.lineTo(bx + dx * .085 + px * .028, by + dy * .085 + py * .028);
      ctx.lineTo(bx + px * .028, by + py * .028);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(bx + dx * .10 + px * .055, by + dy * .10 + py * .055, .055, .030, Math.atan2(dy, dx), 0, TAU); ctx.fill();
    }
  }

  // ---- props -------------------------------------------------------------
  function hand(ctx, p, s, rot) {
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(rot || 0); ctx.scale(s, s);
    smooth(ctx, [[-.030, -.050], [.040, -.058], [.078, -.030], [.086, .012], [.060, .050], [.010, .058], [-.032, .020]], true);
    ctx.restore();
  }
  function rod(ctx, p, ang, L) {                    // the sighting rod: shaft, two notches
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang); ctx.scale(L, L);
    ctx.beginPath(); ctx.rect(-.011, 0, .022, 1); ctx.fill();
    ctx.beginPath(); ctx.rect(-.068, .880, .136, .026); ctx.fill();
    ctx.beginPath(); ctx.rect(-.048, .585, .096, .020); ctx.fill();
    ctx.restore();
  }
  function pyramid(ctx, w, h, steps) {             // stepped pyramid
    const n = steps || 6;
    for (let i = 0; i < n; i++) {
      const u = (i + 1) / n, y = h * u, hw = w * .5 * (1 - u * .80);
      ctx.beginPath(); ctx.rect(-hw, 0, hw * 2, y); ctx.fill();
    }
    ctx.beginPath(); ctx.rect(-w * .07, 0, w * .14, h * .92); ctx.fill();   // the stair on its face
  }
  function hut(ctx, w, h) {                        // mud wall + ragged thatch
    smooth(ctx, [[-w * .50, 0], [-w * .53, h * .30], [-w * .40, h * .52], [-w * .10, h * .58],
                 [w * .22, h * .56], [w * .44, h * .44], [w * .48, 0]], true);
    smooth(ctx, [[-w * .62, h * .46], [-w * .30, h * .92], [-w * .04, h * 1.02], [w * .26, h * .94],
                 [w * .58, h * .46], [w * .20, h * .54], [-w * .22, h * .54]], true);
    for (let i = 0; i < 12; i++) {                   // the fringe
      const u = i / 11, x = -w * .60 + w * 1.18 * u, y = h * .48 + h * .07 * Math.sin(PI * u);
      ctx.beginPath(); ctx.moveTo(x - w * .018, y + h * .04); ctx.lineTo(x, y - h * .06); ctx.lineTo(x + w * .020, y + h * .04); ctx.closePath(); ctx.fill();
    }
  }
  function stela(ctx, w, h) {                      // a cut slab: straight edges, chamfered shoulders
    const hw = w * .52;
    ctx.beginPath();
    ctx.moveTo(-hw, 0); ctx.lineTo(-hw * .96, h * .62); ctx.lineTo(-hw * .90, h * .935);
    ctx.lineTo(-hw * .76, h * .985); ctx.lineTo(-hw * .28, h); ctx.lineTo(hw * .28, h);
    ctx.lineTo(hw * .76, h * .985); ctx.lineTo(hw * .90, h * .935); ctx.lineTo(hw * .96, h * .62);
    ctx.lineTo(hw, 0);
    ctx.closePath(); ctx.fill();
  }
  function glyph(ctx, i, s, wob) {                 // a trigram-like mark: three bars, solid or broken
    ctx.save(); ctx.scale(s, s);
    const so = [[1, 0, 1], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 0], [0, 1, 1], [1, 1, 1]][i % 7];
    const w2 = Math.min(1, wob || 0);
    for (let k = 0; k < 3; k++) {
      const y = -.36 + k * .36;
      if (so[k] || w2 > .5) { ctx.beginPath(); ctx.rect(-.43, y - .068, .86, .136); ctx.fill(); }
      else {
        const gap = .105 * (1 - w2);
        ctx.beginPath(); ctx.rect(-.43, y - .068, .43 - gap / 2, .136); ctx.fill();
        ctx.beginPath(); ctx.rect(gap / 2, y - .068, .43 - gap / 2, .136); ctx.fill();
      }
    }
    ctx.restore();
  }
  function warehouse(ctx, w, h) {                   // a stone store in the shallows: one cut outline, door cut through it
    const hw = w * .50, dw = w * .20, ph = h * .11, dh = h * .78, ch = h * .055;
    ctx.beginPath();
    ctx.moveTo(-hw * 1.16, 0); ctx.lineTo(hw * 1.16, 0);              // plinth, standing in the water
    ctx.lineTo(hw * 1.16, ph); ctx.lineTo(hw, ph);
    ctx.lineTo(hw, h - ch);
    ctx.lineTo(hw * 1.06, h - ch); ctx.lineTo(hw * 1.06, h);           // coping, a course proud of the wall
    ctx.lineTo(-hw * 1.06, h); ctx.lineTo(-hw * 1.06, h - ch);
    ctx.lineTo(-hw, h - ch);
    ctx.lineTo(-hw, ph);
    ctx.lineTo(-hw * 1.16, ph);
    ctx.closePath();
    ctx.moveTo(-dw, ph); ctx.lineTo(dw, ph);                          // the doorway, cut through
    ctx.lineTo(dw, dh); ctx.lineTo(-dw, dh); ctx.closePath();
    ctx.fill('evenodd');
    ctx.beginPath(); ctx.rect(-dw + w * .04, ph - h * .012, (dw - w * .04) * 2, h * .052); ctx.fill(); // threshold
  }
  function block(ctx, s) {                          // the finished part: cut stone with a step on top
    ctx.save(); ctx.scale(s, s);
    smooth(ctx, [[-.50, -.30], [.50, -.30], [.50, .16], [.28, .32], [-.50, .32]], true);
    ctx.beginPath(); ctx.rect(-.30, .32, .13, .11); ctx.fill();
    ctx.restore();
  }
  return { human, head, giant, hand, rod, tool, pyramid, hut, stela, glyph, warehouse, block, poseAt, POSE, J, mix, back, bone, smooth, tube };
})();
