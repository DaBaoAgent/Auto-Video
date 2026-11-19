var TOON = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // toon.build.ts
  var toon_build_exports = {};
  __export(toon_build_exports, {
    INK: () => INK,
    KID: () => KID,
    OFFICER: () => OFFICER,
    PARENT: () => PARENT,
    Pen: () => Pen,
    RIFLEMAN: () => RIFLEMAN,
    SKIN: () => SKIN,
    SKINS: () => SKINS,
    blobPts: () => blobPts,
    bodyFront: () => bodyFront,
    bodySide: () => bodySide,
    fxBlob: () => fxBlob,
    fxBurst: () => fxBurst,
    fxCloud: () => fxCloud,
    fxContact: () => fxContact,
    fxCreak: () => fxCreak,
    fxDrum: () => fxDrum,
    fxNote: () => fxNote,
    fxPlank: () => fxPlank,
    fxPuff: () => fxPuff,
    fxRing: () => fxRing,
    fxShadow: () => fxShadow,
    fxSign: () => fxSign,
    fxSplash: () => fxSplash,
    fxStars: () => fxStars,
    headBlob: () => headBlob,
    mix: () => mix,
    mul: () => mul,
    shade: () => shade,
    soldier: () => soldier,
    swingKid: () => swingKid,
    thickAngle: () => thickAngle,
    townsfolk: () => townsfolk
  });
  var INK = "#241726";
  var SKIN = "#ffe2c2";
  var WHITE = "#ffffff";
  var MOUTH = "#5a1e28";
  var TONGUE = "#e86e78";
  var SH_SKIN = [0.96, 0.86, 0.84];
  var SH_CLOTH = [0.64, 0.66, 0.74];
  var SH_FELT = [0.62, 0.62, 0.7];
  var rad = (d) => d * Math.PI / 180;
  var clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  var mul = (c, m) => {
    const n = parseInt(c.slice(1), 16);
    const ch = (v, k) => Math.min(255, Math.round(v * k)).toString(16).padStart(2, "0");
    return `#${ch(n >> 16 & 255, m[0])}${ch(n >> 8 & 255, m[1])}${ch(n & 255, m[2])}`;
  };
  var shade = (c, k) => mul(c, [k, k, k]);
  var mix = (a, b, t) => {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round((A >> s & 255) * (1 - t) + (B >> s & 255) * t).toString(16).padStart(2, "0");
    return `#${ch(16)}${ch(8)}${ch(0)}`;
  };
  var rnd = (seed, k) => {
    const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  var rotPts = (pts, a, cx, cy) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
  var rotAbout = (q, a, c) => rotPts([q], a, c[0], c[1])[0];
  var lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  var curve = (a, k, b, n = 10) => {
    const c = [2 * k[0] - (a[0] + b[0]) / 2, 2 * k[1] - (a[1] + b[1]) / 2], out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, s = 1 - t;
      out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]);
    }
    return out;
  };
  var RIFLEMAN = { jacket: "#357650", pants: "#3d4440", boots: INK, hat: "shako", belt: "#f1efe6", buttons: "#d9dde0", rifle: true };
  var OFFICER = { ...RIFLEMAN, hat: "shako_tall", buttons: "#e8c45a", sash: "#c0353a", sword: true, moustache: "#4a3020", rifle: false, belt: null, build: "stout" };
  var KID = { jacket: "#f08a2c", pants: "#3b5b9a", boots: "#f4f1ea", hat: "cap", cap: "#e2453c", build: "kid" };
  var PARENT = { jacket: "#7b5ac9", pants: "#3b3f52", boots: "#5a3b2a", hat: "hair", hair: "#5a3b2a" };
  var SKINS = [SKIN, "#f5c9a0", "#ecd0b6", "#c99067"];
  var soldier = (v = 0, extra = {}) => {
    const o = { ...RIFLEMAN, skin: SKINS[v % 4] };
    if (v % 4 === 1) o.moustache = "#4a3426";
    if (v % 4 === 3) o.moustache = "#2a201a";
    return { ...o, ...extra };
  };
  var townsfolk = (v = 0) => {
    const coats = ["#3f6fb5", "#8c3b4a", "#5d7a3a", "#b5653f", "#2f5f6a", "#7b5ac9"];
    const o = { jacket: coats[v % 6], pants: "#3b3f52", boots: "#4a3426", skin: SKINS[v % 4] };
    return v % 2 ? { ...o, hat: "bonnet", dress: ["#d9a441", "#c25a7a", "#5a8fc2"][v % 3] } : { ...o, hat: "tophat" };
  };
  var Pen = class {
    g;
    ol = 12;
    /** [angle, cx, cy] rotation about (cx, cy), optional post-translation [.., dx, dy] */
    rot = null;
    constructor(g) {
      this.g = g;
    }
    P(x, y) {
      if (!this.rot) return [x, y];
      const r = this.rot, a = r[0], cx = r[1], cy = r[2], dx = r.length > 3 ? r[3] : 0, dy = r.length > 4 ? r[4] : 0, c = Math.cos(a), s = Math.sin(a);
      return [cx + (x - cx) * c - (y - cy) * s + dx, cy + (x - cx) * s + (y - cy) * c + dy];
    }
    path(pts, close) {
      const g = this.g;
      g.beginPath();
      pts.forEach((p, i) => {
        const [x, y] = this.P(p[0], p[1]);
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      });
      if (close) g.closePath();
    }
    /** filled shape with an ink outline; fill=null draws the outline only */
    poly(pts, fill, ol) {
      const g = this.g, w = ol ?? this.ol;
      this.path(pts, true);
      if (fill) {
        g.fillStyle = fill;
        g.fill();
      }
      if (w) {
        g.lineWidth = w;
        g.strokeStyle = INK;
        g.lineJoin = "round";
        g.stroke();
      }
    }
    ell(cx, cy, rx, ry, fill, ol, a0 = 0, a1 = 360, rot = 0) {
      this.poly(ellPts(cx, cy, rx, ry, a0, a1, rot), fill, ol);
    }
    /** thick round-capped limb with an ink rim (effects, rope) */
    line(pts, fill, w, ink = true) {
      const g = this.g;
      g.lineCap = "round";
      g.lineJoin = "round";
      if (ink) {
        this.path(pts, false);
        g.strokeStyle = INK;
        g.lineWidth = w + 2 * this.ol * 0.9;
        g.stroke();
      }
      this.path(pts, false);
      g.strokeStyle = fill;
      g.lineWidth = w;
      g.stroke();
    }
    stroke(pts, w, fill = INK) {
      const g = this.g;
      g.lineCap = "round";
      g.lineJoin = "round";
      this.path(pts, false);
      g.strokeStyle = fill;
      g.lineWidth = w;
      g.stroke();
    }
    arc(cx, cy, rx, ry, a0, a1, w, fill = INK) {
      const pts = [];
      for (let i = 0; i <= 24; i++) pts.push([cx + rx * Math.cos(rad(a0 + (a1 - a0) * i / 24)), cy + ry * Math.sin(rad(a0 + (a1 - a0) * i / 24))]);
      this.stroke(pts, w, fill);
    }
    dot(cx, cy, r, fill = INK) {
      const [x, y] = this.P(cx, cy);
      this.g.beginPath();
      this.g.arc(x, y, r, 0, Math.PI * 2);
      this.g.fillStyle = fill;
      this.g.fill();
    }
    /** draw with a closed shape as clip */
    clip(pts, fn) {
      const g = this.g;
      g.save();
      this.path(pts, true);
      g.clip();
      fn();
      g.restore();
    }
    /** flat fill + soft crescent on the side away from the light (light = canvas angle the light comes FROM).
     *  Radial ramp centred `shift` R toward the light: flat out to ~0.6 R on the far side, full shadow by ~0.8 R. */
    shadedFill(pts, base, shadow, light, R, shift = 0.45, r0 = 1.05, r1 = 1.25) {
      const g = this.g, n = pts.length;
      let cx = 0, cy = 0;
      for (const [x, y] of pts) {
        cx += x / n;
        cy += y / n;
      }
      const [gx, gy] = this.P(cx + Math.cos(light) * shift * R, cy + Math.sin(light) * shift * R);
      const gr = g.createRadialGradient(gx, gy, 0, gx, gy, r1 * R);
      gr.addColorStop(0, base);
      gr.addColorStop(r0 / r1, base);
      gr.addColorStop(1, shadow);
      this.path(pts, true);
      g.fillStyle = gr;
      g.fill();
    }
    /** broad gradient across a shape along the light: lit edge = base, far edge = shadow (torsos, coats) */
    gradFill(pts, base, shadow, light, flat = 0.22) {
      const g = this.g, dx = Math.cos(light), dy = Math.sin(light), n = pts.length;
      let cx = 0, cy = 0, lo = Infinity, hi = -Infinity;
      for (const [x, y] of pts) {
        cx += x / n;
        cy += y / n;
        const d = x * dx + y * dy;
        lo = Math.min(lo, d);
        hi = Math.max(hi, d);
      }
      const dc = cx * dx + cy * dy;
      const [ax, ay] = this.P(cx + dx * (hi - dc), cy + dy * (hi - dc)), [bx, by] = this.P(cx + dx * (lo - dc), cy + dy * (lo - dc));
      const gr = g.createLinearGradient(ax, ay, bx, by);
      gr.addColorStop(0, base);
      gr.addColorStop(flat, base);
      gr.addColorStop(1, shadow);
      this.path(pts, true);
      g.fillStyle = gr;
      g.fill();
    }
    /** thick-thin ink ring: w(θ) = w0 (1 + k cos(θ − thick)), θ from the contour centroid (canvas angles) */
    inkRing(pts, w0, thick, k = 0.45, col = INK) {
      const n = pts.length;
      let cx = 0, cy = 0;
      for (const [x, y] of pts) {
        cx += x / n;
        cy += y / n;
      }
      const out = [], inn = [];
      pts.forEach((q, i) => {
        const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
        let nx = b[1] - a[1], ny = a[0] - b[0];
        const l = Math.hypot(nx, ny) || 1;
        nx /= l;
        ny /= l;
        const h = 0.5 * w0 * (1 + k * Math.cos(Math.atan2(q[1] - cy, q[0] - cx) - thick));
        out.push([q[0] + nx * h, q[1] + ny * h]);
        inn.push([q[0] - nx * h, q[1] - ny * h]);
      });
      const g = this.g;
      const trace = (r) => {
        r.forEach(([x0, y0], i) => {
          const [x, y] = this.P(x0, y0);
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        });
        g.closePath();
      };
      g.beginPath();
      trace(out);
      trace(inn.reverse());
      g.fillStyle = col;
      g.fill("evenodd");
    }
    /** flat strap with a thin ink rim (cross belts, sash, rifle, handles) */
    band(pts, fill, w, rim, cap = "butt") {
      const g = this.g;
      g.lineCap = cap;
      g.lineJoin = "round";
      this.path(pts, false);
      g.strokeStyle = INK;
      g.lineWidth = w + 2 * rim;
      g.stroke();
      this.path(pts, false);
      g.strokeStyle = fill;
      g.lineWidth = w;
      g.stroke();
      g.lineCap = "round";
    }
  };
  var ellPts = (cx, cy, rx, ry, a0 = 0, a1 = 360, rot = 0, n = 48) => {
    const r = rad(rot), pts = [];
    for (let i = 0; i <= n; i++) {
      const a = rad(a0 + (a1 - a0) * i / n), x = rx * Math.cos(a), y = ry * Math.sin(a);
      pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
    }
    return pts;
  };
  var rrect = (x0, y0, x1, y1, r, n = 8) => {
    const pts = [];
    for (const [cx, cy, a] of [[x1 - r, y0 + r, -90], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 90], [x0 + r, y0 + r, 180]])
      for (let i = 0; i <= n; i++) pts.push([cx + r * Math.cos(rad(a + 90 * i / n)), cy + r * Math.sin(rad(a + 90 * i / n))]);
    return pts;
  };
  var taper = (p, a, b, wa, wb, col = INK) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    p.poly([
      [a[0] + nx * wa / 2, a[1] + ny * wa / 2],
      [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
      [b[0] - nx * wb / 2, b[1] - ny * wb / 2],
      [a[0] - nx * wa / 2, a[1] - ny * wa / 2]
    ], col, 0);
    p.dot(a[0], a[1], wa / 2, col);
    p.dot(b[0], b[1], wb / 2, col);
  };
  var blobPts = (cx, cy, B, n = 72) => {
    const ph = [rnd(B.seed, 11), rnd(B.seed, 12), rnd(B.seed, 13)].map((v) => v * Math.PI * 2);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / (s < 0 ? B.nTop : B.nBot);
      let X = Math.sign(c) * Math.abs(c) ** e;
      const Y = Math.sign(s) * Math.abs(s) ** e;
      X *= (1 + B.egg * Y) * (1 + B.asym * Math.sign(X));
      const r = 1 + B.noise * (Math.cos(2 * t + ph[0]) + 0.7 * Math.cos(3 * t + ph[1]) + 0.5 * Math.cos(4 * t + ph[2]));
      const x = B.a * X * r, y = B.b * Y * r;
      pts.push([cx + x * Math.cos(B.rot) - y * Math.sin(B.rot), cy + x * Math.sin(B.rot) + y * Math.cos(B.rot)]);
    }
    return pts;
  };
  var headBlob = (seed, a = 118, facing = 0) => ({
    a,
    b: a * (0.94 + 0.08 * (rnd(seed, 1) - 0.5)),
    nTop: 1.75 + 0.3 * (rnd(seed, 2) - 0.5),
    nBot: 2.3 + 0.3 * (rnd(seed, 3) - 0.5),
    egg: -0.12 + 0.06 * (rnd(seed, 4) - 0.5),
    asym: (0.06 + 0.04 * rnd(seed, 5)) * (facing || (rnd(seed, 6) < 0.5 ? -1 : 1)),
    rot: rad(8 * (rnd(seed, 7) - 0.5)),
    noise: 8e-3,
    seed
  });
  var thickAngle = (light) => Math.atan2(-Math.sin(light) + 0.8, -Math.cos(light));
  var DEF_LIGHT = rad(-120);
  var FACE = {
    neutral: { eye: ["lid", "lid"], brow: [0, -1], mouth: "dash" },
    stern: { eye: ["lid", "lid"], brow: [3, -2], mouth: "frown" },
    grin: { eye: ["happy", "happy"], brow: [-3, -3], mouth: "grin" },
    laugh: { eye: ["squeeze", "squeeze"], brow: [-4, -4], mouth: "laugh" },
    whistle: { eye: ["dash", "dash"], brow: [-2, -4], mouth: "o" },
    nervous: { eye: ["small", "small"], brow: [-3, 2], mouth: "wave" },
    shock: { eye: ["shock", "shock"], brow: [-7, -6], mouth: "O" },
    relief: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "smileWide" },
    relief_open: { eye: ["happy", "happy"], brow: [-2, 1], mouth: "grin" },
    dazed: { eye: ["spiral", "spiral"], brow: [-3, 2], mouth: "wave" },
    pained: { eye: ["squeeze", "lid"], brow: [-3, 2], mouth: "teeth" },
    smile: { eye: ["dot", "dot"], brow: [0, -1], mouth: "smirk" },
    smile_closed: { eye: ["happy", "happy"], brow: [0, -1], mouth: "smile" },
    lick: { eye: ["dot", "dot"], brow: [0, -1], mouth: "lick" }
  };
  var halfLid = (k) => k === "dot" || k === "small" ? "lid" : k === "lid" ? "slit" : k === "shock" ? "shockHalf" : k;
  var eyeKind = (k, lid) => lid >= 1 && k !== "happy" && k !== "squeeze" && k !== "spiral" ? "dash" : lid > 0 ? halfLid(k) : k;
  var lidOf = (b) => b === true ? 1 : Number(b) || 0;
  var eye = (p, kind, x, ey, u, side, look, skin) => {
    const lx = x + look * 3 * u, lw = 3.8 * u;
    switch (kind) {
      case "dot":
        p.ell(lx, ey, 3.8 * u, 5.5 * u, INK, 0);
        break;
      case "small":
        p.ell(lx, ey, 3 * u, 4.4 * u, INK, 0);
        break;
      case "lid":
        p.ell(lx, ey - u, 7 * u, 6 * u, INK, 0, 0, 180);
        p.stroke([[x - 9 * u, ey - u], [x + 9 * u, ey - u]], lw);
        break;
      case "slit":
        p.ell(lx, ey, 7 * u, 2.6 * u, INK, 0, 0, 180);
        p.stroke([[x - 9 * u, ey], [x + 9 * u, ey]], lw);
        break;
      case "happy":
        p.arc(x, ey + 3 * u, 8 * u, 6 * u, 200, 340, lw);
        break;
      case "dash":
        p.stroke([[x - 8.5 * u, ey], [x + 8.5 * u, ey]], lw);
        break;
      case "squeeze":
        p.stroke([[x + 6 * u * side, ey - 5 * u], [x - 6 * u * side, ey], [x + 6 * u * side, ey + 5 * u]], lw);
        break;
      case "shock":
      case "shockHalf":
        p.ell(x, ey, 11 * u, 11 * u, WHITE, 2.6 * u);
        p.dot(lx - side * 1.5 * u, ey + 1.5 * u, 3 * u);
        if (kind === "shockHalf") {
          p.ell(x, ey, 11 * u, 11 * u, skin, 0, 180, 360);
          p.stroke([[x - 11 * u, ey], [x + 11 * u, ey]], 2.6 * u);
        }
        break;
      default: {
        const s = [];
        for (let t = 1; t < 15; t++) s.push([x + Math.cos(t * 0.9) * t * 0.55 * u, ey + Math.sin(t * 0.9) * t * 0.55 * u]);
        p.stroke(s, 2.4 * u);
      }
    }
  };
  var dmouth = (p, mx, y, rx, ry, u, tongue = false) => {
    p.ell(mx, y, rx, ry, MOUTH, 0, 0, 180);
    p.clip([[mx - rx, y], [mx + rx, y], [mx + rx, y + 3 * u], [mx - rx, y + 3 * u]], () => p.ell(mx, y, rx, ry, WHITE, 0, 0, 180));
    if (tongue) p.ell(mx + 2 * u, y + 0.62 * ry, 0.4 * rx, 0.28 * ry, TONGUE, 0);
    p.ell(mx, y, rx, ry, null, 3 * u, 0, 180);
  };
  var mouth = (p, kind, mx, my, u, k = 1) => {
    const mw = 4 * u;
    switch (kind) {
      case "dash":
        p.stroke([[mx - 5.5 * u * k, my], [mx + 5.5 * u * k, my - 0.8 * u]], mw);
        break;
      case "frown":
        p.arc(mx, my + 3 * u, 6.5 * u * k, 3.5 * u, 200, 340, mw);
        break;
      case "smirk":
        p.arc(mx + u, my - 3 * u, 7 * u * k, 4 * u, 10, 150, mw);
        break;
      case "smile":
        p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
        break;
      case "smileWide":
        p.arc(mx, my - 4 * u, 11 * u * k, 6 * u, 15, 165, mw);
        break;
      case "grin":
        dmouth(p, mx, my - u, 12 * u * k, 8 * u, u);
        break;
      case "laugh":
        dmouth(p, mx, my, 16 * u * k, 11 * u, u, true);
        break;
      case "o":
        p.ell(mx + 4 * u, my, 3.5 * u, 4 * u, MOUTH, 2.8 * u);
        break;
      case "O":
        p.ell(mx, my + 2 * u, 9 * u * k, 11 * u, MOUTH, 3.2 * u);
        break;
      case "wave": {
        const s = [];
        for (let i = 0; i <= 12; i++) s.push([mx - 9 * u * k + i * 1.5 * u * k, my + 1.5 * u * Math.sin(i * 1.3)]);
        p.stroke(s, 3 * u);
        break;
      }
      case "teeth":
        p.poly([[mx - 12 * u * k, my - 4 * u], [mx + 12 * u * k, my - 4 * u], [mx + 11 * u * k, my + 4 * u], [mx - 11 * u * k, my + 4 * u]], WHITE, 3 * u);
        for (const j of [-1, 0, 1]) p.stroke([[mx + j * 6 * u * k, my - 4 * u], [mx + j * 6 * u * k, my + 4 * u]], 1.5 * u);
        break;
      case "lick":
        p.arc(mx, my - 3 * u, 8 * u * k, 4.5 * u, 20, 160, mw);
        p.ell(mx + 6 * u * k, my + 3 * u, 3.6 * u, 4.6 * u, TONGUE, 2.4 * u);
        break;
    }
  };
  var faceFront = (p, cx, cy, W, expr, facing, look, lid, brim, skin, moustache, stout = false) => {
    const u = W / 100, F = FACE[expr], fx = cx + 7 * u * facing;
    const ex = (F.eye[0] === "shock" ? 12 : 13) * u, ey = cy;
    for (const side of [-1, 1]) {
      const x = fx + side * ex;
      const kind = eyeKind(F.eye[(facing ? side === facing : side > 0) ? 1 : 0], lid);
      eye(p, kind, x, ey, u, side, look, skin);
      const [dI, dO] = F.brow, by = ey - (brim ? 17 : 20) * u;
      if (kind === "shock" || kind === "shockHalf") p.arc(x, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
      else taper(p, [x - side * 8.5 * u, by + dI * u], [x + side * 8.5 * u, by + dO * u], 5 * u, 2.5 * u);
    }
    const mx = cx + 8 * u * facing, my = cy + 20 * u;
    mouth(p, F.mouth, mx, my, u);
    if (moustache) for (const s of [-1, 1])
      taper(p, [mx + s * 1.5 * u, cy + 12.5 * u], [mx + s * (stout ? 19 : 15) * u, cy + (stout ? 10.5 : 15) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(cx + 40 * u * (facing || 1), cy - 22 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
  };
  var faceSide = (p, hx, hy, W, expr, lid, brim, skin, moustache, stout = false) => {
    const u = W / 100, F = FACE[expr], ex = hx + 27 * u, ey = hy;
    const kind = eyeKind(F.eye[1], lid);
    eye(p, kind, ex, ey, u, 1, 0.6, skin);
    const by = ey - (brim ? 17 : 20) * u, [dI, dO] = F.brow;
    if (kind === "shock" || kind === "shockHalf") p.arc(ex, by - 6 * u, 9 * u, 3 * u, 200, 340, 4 * u);
    else taper(p, [ex + 8 * u, by + dI * u], [ex - 7 * u, by - u + dO * u], 5 * u, 2.5 * u);
    p.stroke([[hx + 44 * u, hy + 4 * u], [hx + 47.5 * u, hy + 9 * u], [hx + 43 * u, hy + 10 * u]], 3 * u);
    mouth(p, F.mouth, hx + 33 * u, hy + 21 * u, u, 0.62);
    if (moustache) taper(p, [hx + 41 * u, hy + 13.5 * u], [hx + 25 * u, hy + (stout ? 11.5 : 16) * u], stout ? 5.5 * u : 4.5 * u, 1.6 * u, moustache);
    if (expr === "nervous") p.ell(hx - 30 * u, hy - 24 * u, 3 * u, 5 * u, "#9fd4ff", 2 * u);
  };
  var BONNET = "#e9cf8f";
  var BONNET_BRIM = "#d6b46a";
  var hatBehind = (p, o, H, cx, hc, light, thick, ow, side) => {
    if (o.hat !== "bonnet") return;
    const bb = blobPts(cx - (side ? 12 : 0) * (H.a / 50), hc - 0.07 * 2 * H.b, { ...H, a: H.a * 1.17, b: H.b * 1.13, asym: 0, egg: 0.04, seed: H.seed + 3 });
    p.shadedFill(bb, BONNET, mul(BONNET, SH_CLOTH), light, H.a * 1.17);
    p.inkRing(bb, ow * 0.85, thick);
  };
  var hatOn = (p, o, hp, H, cx, hc, light, seed, facing, side) => {
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, crown = hc - H.b, ow = 0.85 * 5 * u;
    const a = H.rot + rad(4 * (rnd(seed, 20) - 0.5));
    const R = (pts) => rotPts(pts, a, cx, hc);
    const sag = (yb, wb) => {
      const base = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 12;
        base.push([cx + wb * (2 * t - 1), yb + 3 * u * (1 - (2 * t - 1) ** 2)]);
      }
      return base;
    };
    if (o.hat === "shako" || o.hat === "shako_tall") {
      const tall = o.hat === "shako_tall", yb = crown + 0.25 * HH, ht = (tall ? 0.66 : 0.56) * HH, wb = 46 * u, wt = 52 * u;
      const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
      p.shadedFill(body, "#3a3d47", "#24262d", light, wt, 0.4);
      if (tall) p.clip(body, () => p.band(R([[cx - wt - 5 * u, yb - ht + 0.07 * HH], [cx + wt + 5 * u, yb - ht + 0.07 * HH]]), "#e8c45a", 0.06 * HH, 1.5 * u));
      p.poly(body, null, ow);
      const deg = a * 180 / Math.PI;
      if (side) {
        p.poly(R([[cx + 36 * u, yb - 1 * u], [cx + 60 * u, yb + 8 * u], [cx + 34 * u, yb + 6 * u]]), "#16171b", 2.5 * u);
        const [tx, ty] = R([[cx + 24 * u, yb - ht - 6 * u]])[0];
        p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
      } else {
        const [px, py] = R([[cx + 3 * u * facing, yb + 3 * u]])[0];
        p.ell(px, py, 34 * u, 0.045 * HH, "#16171b", 2.5 * u, 0, 180, deg);
        const [bx, by] = R([[cx, yb - 0.45 * ht]])[0];
        p.ell(bx, by, 7 * u, 6 * u, tall ? "#e8c45a" : "#c9ccd2", 2 * u, 0, 360, deg);
        p.arc(bx, by, 3.5 * u, 2.8 * u, 200, 500, 1.6 * u);
        const [tx, ty] = R([[cx, yb - ht - 6 * u]])[0];
        p.ell(tx, ty, 7 * u, 7 * u, "#2b7a4b", 2.5 * u);
      }
    } else if (o.hat === "cap" || o.hat === "hair") {
      const cut = crown + (o.hat === "cap" ? 0.3 : 0.42) * HH;
      const keep = (x, y) => y < cut || side && o.hat === "hair" && x < cx - 6 * u && y < hc + 0.42 * H.b;
      const n = hp.length, startIdx = Math.max(0, hp.findIndex(([x, y], i) => keep(x, y) && !keep(hp[(i + n - 1) % n][0], hp[(i + n - 1) % n][1])));
      const arc = [...hp.slice(startIdx), ...hp.slice(0, startIdx)].filter(([x, y]) => keep(x, y)).map(([x, y]) => [cx + (x - cx) * 1.03, hc + (y - hc) * 1.03]);
      if (arc.length < 3) return;
      if (o.hat === "hair") {
        const [x0, y0] = arc[arc.length - 1], [x1, y1] = arc[0];
        for (let i = 1; i < 6; i++) arc.push([x0 + (x1 - x0) * i / 6, y0 + (y1 - y0) * i / 6 + (i % 2 ? 4 * u : 0)]);
      }
      const col = o.hat === "cap" ? o.cap : o.hair;
      p.shadedFill(arc, col, mul(col, SH_FELT), light, H.a, 0.35);
      p.poly(arc, null, ow);
      if (o.hat === "hair") {
        const s = side ? -1 : facing || 1;
        p.stroke([[cx + s * 10 * u, cut - 30 * u], [cx + s * 2 * u, cut - 12 * u]], 1.2 * u);
      }
      if (o.hat === "cap") {
        const deg = a * 180 / Math.PI;
        if (side) p.poly(R([[cx + 40 * u, cut - 2 * u], [cx + 74 * u, cut + 4 * u], [cx + 40 * u, cut + 6 * u]]), shade(col, 0.8), ow);
        else {
          const s = facing || (rnd(seed, 21) < 0.5 ? -1 : 1), [px, py] = R([[cx + s * 4 * u, cut + 1.5 * u]])[0];
          p.ell(px, py, 32 * u, 0.06 * HH, shade(col, 0.8), ow, 0, 180, deg);
        }
      }
    } else if (o.hat === "tophat") {
      const yb = crown + 0.22 * HH, ht = 0.8 * HH, wb = 0.31 * W, wt = 0.33 * W, col = "#2e2a36";
      const body = R([...sag(yb, wb).reverse(), [cx - wt, yb - ht], [cx + wt, yb - ht]]);
      p.shadedFill(body, col, mul(col, SH_FELT), light, wt, 0.4);
      p.clip(body, () => p.band(R([[cx - wt - 4 * u, yb - 0.13 * HH], [cx + wt + 4 * u, yb - 0.13 * HH]]), shade(o.jacket, 0.9), 0.14 * HH, 0.8 * u));
      p.poly(body, null, ow);
      const [bx, by] = R([[cx, yb + 1 * u]])[0];
      p.ell(bx, by, 0.45 * W, 0.05 * HH, "#1d1b22", ow, 0, 360, a * 180 / Math.PI);
    } else if (o.hat === "bonnet") {
      const [bx, by] = R([[cx + (side ? 6 * u : 0), crown + 0.16 * HH]])[0];
      p.arc(bx, by, 0.5 * W, 0.2 * HH, 200, 340, 7 * u, BONNET_BRIM);
      p.arc(bx, by, 0.5 * W + 3.5 * u, 0.2 * HH + 3.5 * u, 200, 340, 1.2 * u);
      const cy = hc + H.b * 0.98;
      p.stroke([[cx - 14 * u, cy - 4 * u], [cx, cy + 2 * u], [cx + 14 * u, cy - 4 * u]], 2 * u, BONNET_BRIM);
    }
  };
  var BUILD = {
    adult: { a: 118, torso: 1.1, legs: 1.4, tw: 0.8 },
    stout: { a: 118, torso: 1.15, legs: 1.32, tw: 0.92 },
    kid: { a: 112, torso: 0.85, legs: 1, tw: 0.72 }
  };
  var footStroke = (p, a, b, w, col) => {
    if (col !== INK) p.stroke([a, b], w + 3, INK);
    p.stroke([a, b], w, col);
  };
  var bodyFront = (p, o, opts) => {
    if (o.lao) return lbodyFront(p, o, opts);
    const {
      phase = 0,
      expr = "neutral",
      mode = "march",
      look = 0,
      blink = false,
      lift = 60,
      prop = null,
      tilt = 0,
      headTilt = 0,
      wave,
      light = DEF_LIGHT,
      facing = 0,
      seed = 1
    } = opts;
    const _Bd = BUILD[o.build ?? "adult"], Bd = o.lao ? { ..._Bd, legs: _Bd.legs * 0.78, torso: _Bd.torso * 1.12 } : _Bd, skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const _hf = headBlob(seed, Bd.a, facing), _kf = o.head ?? 1, H = { ..._hf, a: _hf.a * _kf * (o.lao ? 0.94 : 1), b: _hf.b * _kf * (o.lao ? 1.14 : 1) }, W = 2 * H.a, HH = 2 * H.b, u = W / 100;
    const tall = (1 + Bd.torso + Bd.legs) * HH, sole = 975;
    const bob = mode === "march" ? 0.025 * tall * Math.cos(2 * two * phase) : mode === "stroll" ? 0.015 * tall * Math.cos(2 * two * phase) : 0;
    const torsoBot = mode === "sit" ? sole - 0.2 * HH : sole - Bd.legs * HH + bob;
    const chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hipY = torsoBot - 0.12 * HH;
    const thick = thickAngle(light), ow = 5 * u;
    const legCol = mix(o.pants, INK, 0.55), armCol = mix(o.jacket, INK, 0.5), footCol = o.boots;
    const legW = 5.8 * u, footW = 7.5 * u;
    p.rot = null;
    if (mode === "sit") {
      for (const side of [-1, 1]) {
        const h = [300 + side * 15 * u, hipY], k = [300 + side * 36 * u, hipY + 0.2 * HH], f = [300 + side * 44 * u, sole - 8 * u];
        p.stroke(curve(h, k, f), legW, legCol);
        footStroke(p, [f[0] - side * 2 * u, f[1]], [f[0] + side * 12 * u, f[1] - 5 * u], footW, footCol);
      }
    } else if (mode === "fall") {
      const legs = [
        [[300 - 15 * u, hipY], [300 - 46 * u, hipY + 0.5 * HH], [300 - 70 * u, hipY + 0.72 * HH]],
        [[300 + 15 * u, hipY], [300 + 50 * u, hipY + 0.45 * HH], [300 + 76 * u, hipY + 0.22 * HH]]
      ];
      legs.forEach(([h, k, f], i) => {
        p.stroke(curve(h, k, f), legW, legCol);
        footStroke(p, f, [f[0] + (i ? 14 : -14) * u, f[1] + (i ? -6 : 4) * u], footW, footCol);
      });
    } else if (o.dress) {
      for (const side of [-1, 1]) {
        const fx = 300 + side * 12 * u, fy = sole - 4 * u;
        p.stroke([[fx, sole - 0.4 * HH], [fx + side * u, fy]], legW, legCol);
        footStroke(p, [fx - side * 3 * u, fy], [fx + side * 12 * u, fy + u], footW, footCol);
      }
    } else {
      const L = mode === "march" ? lift * 1.25 : mode === "stroll" ? lift * 0.55 : 0;
      for (const [side, ph] of [[-1, 0], [1, 0.5]]) {
        const up = Math.max(0, Math.sin(two * (phase + ph))) * L;
        const hx = 300 + side * 15 * u, fx = 300 + side * 22 * u, fy = sole - 4 * u - up;
        const k = [(hx + fx) / 2 + side * (1.5 * u + up * 0.16), (hipY + fy) / 2 - up * 0.08];
        p.stroke(curve([hx, hipY], k, [fx, fy]), legW, legCol);
        footStroke(p, [fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u], footW, footCol);
      }
    }
    const sway = mode === "march" ? 1.6 * Math.sin(two * phase) : mode === "stroll" ? 1 * Math.sin(two * phase) : 0;
    const A = tilt + sway;
    p.rot = A ? [rad(A), 300, hipY] : null;
    const dress = !!o.dress && mode !== "sit" && mode !== "fall";
    const T = {
      a: Bd.tw / 2 * W / 1.06 * (o.lao ? 1.16 : 1),
      b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
      nTop: 2.2,
      nBot: 2.6,
      egg: o.build === "stout" ? 0.17 : 0.12,
      asym: 0.04 * facing,
      rot: 0,
      noise: 6e-3,
      seed: seed + 7
    };
    const tcx = 300 + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const sh = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
    const hang = (side, fwd) => {
      const S = sh(side), ex = tcx + side * (1.12 * T.a + 4 * u);
      const hx = ex + side * 3 * u - side * 6 * u * Math.max(0, fwd) + side * 4 * u * Math.max(0, -fwd);
      return [S, [ex, S[1] + 0.48 * HH], [hx, chin + 1.04 * HH - Math.abs(fwd) * 9 * u]];
    };
    const sw = mode === "march" || mode === "stroll" ? Math.sin(two * phase) : 0;
    const R0 = [300 + 47 * u, torsoBot + 0.12 * HH], R1 = [300 + 64 * u, crown - 0.32 * HH];
    const rifle = !!o.rifle && (mode === "march" || mode === "stand" || mode === "stroll");
    const arms = [];
    if (mode === "sit") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.1 * T.a + 6 * u), sh(side)[1] + 0.4 * HH], [tcx + side * (1.2 * T.a + 10 * u), torsoBot + 0.04 * HH]], front: false });
    else if (mode === "fall") for (const side of [-1, 1]) arms.push({ pts: [sh(side), [tcx + side * (1.15 * T.a + 12 * u), sh(side)[1] - 0.25 * HH], [tcx + side * (1.3 * T.a + 24 * u), sh(side)[1] - 0.68 * HH]], front: false });
    else {
      arms.push({ pts: prop === "shako" ? hang(-1, 0) : hang(-1, -sw), front: false });
      if (rifle) {
        const G = lerp2(R0, R1, 0.1);
        arms.push({ pts: [sh(1), [tcx + 1.12 * T.a + 5 * u, sh(1)[1] + 0.45 * HH], G], front: false });
      } else if (wave !== void 0) {
        const S = sh(1);
        arms.push({ pts: [S, [tcx + 1.1 * T.a + 10 * u + 3 * u * wave, S[1] - 0.22 * HH], [tcx + 1.18 * T.a + 16 * u + 12 * u * wave, S[1] - 0.6 * HH]], front: false });
      } else if (prop === "icecream") {
        const S = sh(1);
        arms.push({ pts: [S, [tcx + 1.05 * T.a + 4 * u, S[1] + 0.45 * HH], [tcx + 0.5 * T.a, S[1] + 0.4 * HH]], front: true });
      } else if (Array.isArray(prop)) {
        const S = sh(1), k = clamp(prop[1], 0, 1);
        const E = lerp2([tcx + 1.1 * T.a + 10 * u, S[1] - 0.15 * HH], [tcx + 1.2 * T.a + 10 * u, S[1] + 0.3 * HH], k);
        const Hd = lerp2([tcx + 1.15 * T.a + 14 * u, S[1] - 0.55 * HH], [tcx + 1.45 * T.a + 22 * u, S[1] + 0.35 * HH], k);
        arms.push({ pts: [S, E, Hd], front: true });
      } else arms.push({ pts: hang(1, sw), front: false });
    }
    const drawArm = (a) => {
      p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
      p.dot(a.pts[2][0], a.pts[2][1], 5.5 * u);
    };
    if (rifle) {
      p.band([R0, R1], "#7a4b2a", 5 * u, 1.5 * u, "round");
      p.band([lerp2(R0, R1, 0.6), R1], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    if (o.sword && mode !== "sit") {
      const s0 = [tcx - 0.75 * T.a, torsoBot - 0.2 * HH];
      p.band([s0, [s0[0] - Math.sin(rad(25)) * 0.8 * HH, s0[1] + Math.cos(rad(25)) * 0.8 * HH]], "#c9ccd2", 3 * u, 1.2 * u, "round");
    }
    for (const a of arms) if (!a.front) drawArm(a);
    if (dress) {
      const D = { a: 0.5 * W * 0.98, b: 0.5 * (sole - 0.35 * HH - (chin - 0.2 * HH)), nTop: 2, nBot: 3, egg: 0.35, asym: 0.03 * facing, rot: 0, noise: 6e-3, seed: seed + 9 };
      const dp = blobPts(300, sole - 0.35 * HH - D.b, D);
      p.gradFill(dp, o.dress, mul(o.dress, SH_CLOTH), light);
      p.inkRing(dp, ow, thick);
      const Sw = { a: 0.37 * W, b: 0.3 * HH, nTop: 2.2, nBot: 2.4, egg: 0.1, asym: 0, rot: 0, noise: 6e-3, seed: seed + 8 };
      const sp = blobPts(300, chin + 0.12 * HH, Sw);
      p.gradFill(sp, o.jacket, mul(o.jacket, SH_CLOTH), light);
      p.inkRing(sp, ow * 0.9, thick);
    } else {
      p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
      p.clip(tp, () => {
        if (o.belt) {
          for (const s of [-1, 1]) p.band([[tcx - s * 0.75 * T.a, chin - 0.05 * HH], [tcx + s * 0.8 * T.a, torsoBot - 0.1 * HH]], o.belt, 5.5 * u, 1.8 * u);
          const xc = tcx + 0.025 * T.a, yc = chin - 0.05 * HH + (torsoBot - 0.1 * HH - (chin - 0.05 * HH)) * (0.75 / 1.55);
          p.poly([[xc - 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc - 3.5 * u], [xc + 3.5 * u, yc + 3.5 * u], [xc - 3.5 * u, yc + 3.5 * u]], "#d9dde0", 1.5 * u);
        }
        if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
        for (let i = 0; i < 4; i++) {
          const y = chin + 0.12 * HH + i * 0.2 * HH;
          if (o.sash && Math.abs(y - (torsoBot - 0.32 * HH)) < 0.08 * HH) continue;
          p.dot(tcx + 2 * u * facing, y, 2.2 * u + 0.8 * u, INK);
          p.dot(tcx + 2 * u * facing, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
        }
      });
      if (o.sash) {
        const s = facing || 1;
        p.poly([[tcx + s * 0.55 * T.a, torsoBot - 0.3 * HH], [tcx + s * 0.75 * T.a, torsoBot + 0.05 * HH], [tcx + s * 0.45 * T.a, torsoBot + 0.02 * HH]], o.sash, 1.6 * u);
      }
      p.inkRing(tp, ow, thick);
    }
    for (const a of arms) if (a.front) {
      drawArm(a);
      const [hx, hy] = a.pts[2];
      if (prop === "icecream") {
        p.poly([[hx - 8 * u, hy - 12 * u], [hx + 8 * u, hy - 12 * u], [hx, hy + 7 * u]], "#e0a35a", 1.8 * u);
        p.ell(hx, hy - 19 * u, 11 * u, 10 * u, "#f7c6d9", 2.2 * u);
        p.dot(hx, hy, 5.5 * u);
      } else if (Array.isArray(prop)) {
        const ang = rad(-70 + 105 * clamp(prop[1], 0, 1));
        const Rh = (pts) => rotPts(pts, ang, hx, hy);
        p.band(Rh([[hx, hy + 12 * u], [hx, hy - 44 * u]]), "#8a5a34", 5 * u, 1.5 * u, "round");
        p.poly(Rh([[hx - 12 * u, hy - 58 * u], [hx + 20 * u, hy - 58 * u], [hx + 20 * u, hy - 42 * u], [hx - 12 * u, hy - 42 * u]]), "#7d848c", 2.2 * u);
        p.dot(hx, hy, 5.5 * u);
      }
    }
    if (prop === "shako") {
      const [hx, hy] = arms[0].pts[2];
      p.poly([[hx - 14 * u, hy + 3 * u], [hx + 14 * u, hy + 3 * u], [hx + 16 * u, hy + 30 * u], [hx - 16 * u, hy + 30 * u]], "#3a3d47", 2.2 * u);
      p.ell(hx, hy + 31 * u, 3.5 * u, 3.5 * u, "#2b7a4b", 1.5 * u);
      p.dot(hx, hy, 5.5 * u);
    }
    const Ah = A + headTilt, [cpx, cpy] = rotAbout([300, chin], rad(A), [300, hipY]);
    p.rot = Ah ? [rad(Ah), 300, chin, cpx - 300, cpy - chin] : null;
    hatBehind(p, o, H, 300, hc, light, thick, ow, false);
    const hp = blobPts(300, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, 300, hc, light, seed, facing, false);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    if (o.lao) laoFaceFront(p, o, 300, hc, W, expr, facing, lid, W / 100);
    else faceFront(p, 300, hc, W, expr, facing, look, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
  };
  var ik = (hip, ank, l1, l2) => {
    const dx = ank[0] - hip[0], dy = ank[1] - hip[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
    const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), k = Math.atan2(dy, dx) - A;
    return [hip[0] + l1 * Math.cos(k), hip[1] + l1 * Math.sin(k)];
  };
  var SWING_HIP = 733;
  var bodySide = (p, o, opts) => {
    if (o.lao) return lbodySide(p, o, opts);
    const { phase = 0, expr = "neutral", mode = "march", blink = false, stomp = 1, pose = 0, stride = 1, light = DEF_LIGHT, seed = 1 } = opts;
    const _Bd = BUILD[o.build ?? "adult"], Bd = o.lao ? { ..._Bd, legs: _Bd.legs * 0.78, torso: _Bd.torso * 1.12 } : _Bd, skin = o.skin ?? SKIN, two = Math.PI * 2, lid = lidOf(blink);
    const _h = headBlob(seed, Bd.a, 1), _k = o.head ?? 1;
    const H = { ..._h, a: _h.a * _k * (o.lao ? 0.94 : 1), b: _h.b * _k * (o.lao ? 1.14 : 1), asym: o.lao ? 0.2 : 0.12, rot: rad(3 + 3 * (rnd(seed, 7) - 0.5)) };
    const W = 2 * H.a, HH = 2 * H.b, u = W / 100, sole = 975, ankY = sole - 4 * u;
    const thick = thickAngle(light), ow = 5 * u;
    const legLen = (Bd.legs + 0.12) * HH - 4 * u, l1 = legLen / 2, l2 = legLen / 2;
    const nearCol = mix(o.pants, INK, 0.55), farCol = mix(o.pants, INK, 0.75), footCol = o.boots;
    const legs = [];
    let hipY = ankY - legLen * 0.995, lean = 0, nearFwd = 0;
    if (mode === "march") {
      const S2 = 370 * stride, liftH = Math.max(22, 40 + 70 * (stomp - 1));
      const st = (ph) => {
        const c = ((phase + ph) % 1 + 1) % 1;
        if (c < 0.5) {
          const s2 = c / 0.5;
          return { x: S2 / 2 - S2 * s2, h: 0, stance: true, s: s2 };
        }
        const s = (c - 0.5) / 0.5;
        return { x: -S2 / 2 + S2 * s - S2 / Math.PI * Math.sin(2 * Math.PI * s), h: liftH * Math.sin(Math.PI * s), stance: false, s };
      };
      const nL = st(0), fL = st(0.5), stance = nL.stance ? nL : fL;
      const Leff = legLen * (1 - 0.035 * Math.sin(Math.PI * stance.s));
      hipY = ankY - Math.sqrt(Math.max(1, Leff * Leff - stance.x * stance.x));
      for (const [L, near2] of [[fL, false], [nL, true]])
        legs.push({ ank: [300 + L.x, ankY - L.h], pitch: L.stance ? 0 : rad(35 * Math.sin(Math.PI * L.s) * (1 - 1.6 * L.s)), near: near2 });
      lean = 4 + 3 * Math.cos(2 * two * phase);
      nearFwd = nL.x / (S2 / 2);
    } else if (mode === "push") {
      hipY = ankY - 0.87 * legLen;
      legs.push({ ank: [300 - 0.5 * legLen, ankY], pitch: rad(-8), near: false }, { ank: [300 + 0.32 * legLen, ankY], pitch: 0, near: true });
      lean = 14 * pose;
    } else if (mode === "swing") {
      hipY = SWING_HIP;
      const a = rad(60 * pose);
      for (const [dx, near2] of [[-6, false], [0, true]]) {
        const knee = [300 + l1 * 0.98 + dx * u, hipY + 6 * u];
        legs.push({ ank: [knee[0] + l2 * Math.sin(a), knee[1] + l2 * Math.cos(a)], pitch: -a * 0.5, near: near2 });
      }
    } else {
      legs.push({ ank: [300 - 4 * u, ankY], pitch: 0, near: false }, { ank: [300 + 4 * u, ankY], pitch: 0, near: true });
    }
    const torsoBot = hipY + 0.12 * HH, chin = torsoBot - Bd.torso * HH, hc = chin - H.b, crown = hc - H.b, hip = [300, hipY];
    p.rot = null;
    for (const L of legs) {
      const knee = mode === "swing" ? [300 + l1 * 0.98 + (L.near ? 0 : -6 * u), hipY + 6 * u] : ik(hip, L.ank, l1, l2);
      const hp0 = [300 + (L.near ? 0 : -5 * u), hipY];
      p.stroke([hp0, knee, L.ank], 10.2 * u, L.near ? nearCol : farCol);
      const c = Math.cos(L.pitch), s = Math.sin(L.pitch);
      footStroke(
        p,
        [L.ank[0] - 3 * u * c, L.ank[1] - 3 * u * s],
        [L.ank[0] + 13 * u * c, L.ank[1] + 13 * u * s + 0.5 * u],
        9.5 * u,
        L.near ? footCol : footCol === INK ? INK : shade(footCol, 0.82)
      );
    }
    p.rot = lean ? [rad(lean), 300, hipY] : null;
    const T = {
      a: (o.build === "stout" ? 0.46 : 0.4) * W,
      b: 0.5 * (torsoBot - (chin - 0.25 * HH)),
      nTop: 2.2,
      nBot: 2.5,
      egg: 0.1,
      asym: 0.06,
      rot: 0,
      noise: 6e-3,
      seed: seed + 7
    };
    const tcx = 300 + 2 * u, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
    const armCol = mix(o.jacket, INK, 0.5), farArm = mix(o.jacket, INK, 0.68);
    const S = [tcx + 0.05 * T.a, chin + 0.14 * HH], aLen = 0.95 * HH;
    const swingArm = (ang) => {
      const e = [S[0] + Math.sin(ang) * aLen * 0.5, S[1] + Math.cos(ang) * aLen * 0.5], a2 = ang + rad(16) * Math.sign(ang || 1);
      return [S, e, [e[0] + Math.sin(a2) * aLen * 0.5, e[1] + Math.cos(a2) * aLen * 0.5]];
    };
    const rifle = !!o.rifle && (mode === "march" || mode === "stand");
    const B0 = [tcx + 0.72 * T.a, chin + 0.58 * HH], B1 = [tcx - 0.95 * T.a - 22 * u, crown - 0.4 * HH];
    let near, far;
    if (mode === "swing") {
      near = [S, [S[0] + 12 * u, S[1] - 0.16 * HH], [300 + 6 * u, chin - 0.3 * HH]];
      far = [S, [S[0] + 8 * u, S[1] - 0.18 * HH], [300 + 2 * u, chin - 0.36 * HH]];
    } else if (mode === "push") {
      const reach = 0.55 * HH + 0.45 * HH * pose;
      let hN = [S[0] + reach, S[1] + 0.06 * HH];
      if (opts.hand) {
        const th = -rad(lean), dx = opts.hand[0] - 300, dy = opts.hand[1] - hipY;
        const tg = [300 + dx * Math.cos(th) - dy * Math.sin(th), hipY + dx * Math.sin(th) + dy * Math.cos(th)];
        hN = [hN[0] + (tg[0] - hN[0]) * pose, hN[1] + (tg[1] - hN[1]) * pose];
      }
      near = [S, [(S[0] + hN[0]) / 2, (S[1] + hN[1]) / 2 + 0.06 * HH], hN];
      far = [S, [(S[0] + hN[0]) / 2 - 4 * u, (S[1] + hN[1]) / 2 - 0.02 * HH], [hN[0] - 6 * u, hN[1] - 0.08 * HH]];
    } else if (rifle) {
      near = [S, [S[0] - 4 * u, S[1] + 0.42 * HH], B0];
      far = mode === "march" ? swingArm(rad(30) * nearFwd) : swingArm(0);
    } else {
      near = swingArm(rad(-30) * nearFwd);
      far = mode === "march" ? swingArm(rad(30) * nearFwd) : null;
    }
    if (far) {
      p.stroke(curve(far[0], far[1], far[2]), 9 * u, farArm);
      p.dot(far[2][0], far[2][1], 8.5 * u, shade(skin, 0.9));
    }
    p.gradFill(tp, o.jacket, mul(o.jacket, SH_CLOTH), light);
    p.clip(tp, () => {
      if (o.belt) p.band([[tcx - 0.65 * T.a, chin - 0.05 * HH], [tcx + 0.75 * T.a, torsoBot - 0.1 * HH]], o.belt, 5.5 * u, 1.8 * u);
      if (o.sash) p.band([[tcx - 1.3 * T.a, torsoBot - 0.32 * HH], [tcx + 1.3 * T.a, torsoBot - 0.32 * HH]], o.sash, 0.13 * HH, 1.8 * u);
      if (!o.dress) for (let i = 0; i < 3; i++) {
        const y = chin + 0.16 * HH + i * 0.24 * HH;
        p.dot(tcx + 0.8 * T.a, y, 3 * u, INK);
        p.dot(tcx + 0.8 * T.a, y, 2.2 * u, o.buttons ?? shade(o.jacket, 0.7));
      }
    });
    p.inkRing(tp, ow, thick);
    if (rifle) {
      p.band([B0, B1], "#7a4b2a", 5 * u, 1.5 * u, "round");
      p.band([lerp2(B0, B1, 0.6), B1], "#8d949c", 2.4 * u, 1.2 * u, "round");
    }
    p.stroke(curve(near[0], near[1], near[2]), 9 * u, armCol);
    p.dot(near[2][0], near[2][1], 8.5 * u, skin);
    if (o.lantern) {
      const [lx, ly] = near[2];
      p.poly([[lx - 6 * u, ly + 2 * u], [lx + 6 * u, ly + 2 * u], [lx + 5 * u, ly + 19 * u], [lx - 5 * u, ly + 19 * u]], "#d8a53f", 2.5 * u);
      p.ell(lx, ly + 11 * u, 3.5 * u, 5 * u, "#ffd98a", 1.5 * u);
    }
    if (o.satchel) {
      p.band([[tcx + 0.7 * T.a, chin + 0.3 * HH], [tcx + 0.95 * T.a, torsoBot - 0.1 * HH]], o.satchel, 3.5 * u, 1.2 * u);
      p.poly([[tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 1.15 * T.a, torsoBot - 0.18 * HH], [tcx + 1.1 * T.a, torsoBot + 0.05 * HH], [tcx + 0.5 * T.a, torsoBot + 0.03 * HH]], o.satchel, 3 * u);
    }
    if (o.pickaxe) {
      p.band([[tcx - 0.7 * T.a, chin + 0.4 * HH], [tcx + 0.5 * T.a, crown - 0.55 * HH]], "#6b4a2f", 3 * u, 1 * u, "round");
      p.poly([[tcx + 0.35 * T.a, crown - 0.55 * HH], [tcx + 0.8 * T.a, crown - 0.72 * HH], [tcx + 0.55 * T.a, crown - 0.8 * HH]], "#4a3a2c", 2 * u);
    }
    const hx = 300 + 4 * u;
    hatBehind(p, o, H, hx, hc, light, thick, ow, true);
    const hp = blobPts(hx, hc, H);
    p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
    p.inkRing(hp, ow, thick);
    hatOn(p, o, hp, H, hx, hc, light, seed, 1, true);
    if (o.brim) p.ell(hx + 4 * u, hc - 0.16 * HH, 0.55 * W, 0.075 * HH, o.brim, ow);
    const brim = !!o.hat && o.hat !== "hair" && o.hat !== "bonnet" && o.hat !== "cap";
    if (o.lao) laoFaceSide(p, o, hx, hc, W, expr, lid, u);
    else faceSide(p, hx, hc, W, expr, lid, brim, skin, o.moustache, o.build === "stout");
    p.rot = null;
  };
  var swingKid = (p, o, kick, expr, light = DEF_LIGHT, blink = 0) => {
    const rope = 1830, k = 1.1, HH = 2 * headBlob(5, BUILD[o.build ?? "adult"].a, 1).b;
    const seat = rope + 18, x0 = 150, x1 = 550;
    p.line([[350, 20], [x0 + 16, seat + 4]], "#a07a4c", 10);
    p.poly(rrect(x0, seat, x1, seat + 36, 10), "#b5653f", 9);
    const g = p.g;
    g.save();
    g.translate(350 - 300 * k, rope + 18 - (SWING_HIP + 0.12 * HH) * k);
    g.scale(k, k);
    bodySide(new Pen(g), o, { expr, mode: "swing", pose: kick, light, seed: 5, blink });
    g.restore();
    p.line([[350, 20], [x1 - 16, seat + 4]], "#a07a4c", 10);
  };
  var fxNote = (p, kind, col = "#1f2a44") => {
    p.ell(70, 200, 46, 34, col, 8, 0, 360, -20);
    p.stroke([[110, 190], [110, 40]], 14);
    if (kind === 0) p.poly([[110, 40], [170, 70], [170, 110], [110, 82]], col, 8);
    else {
      p.ell(150, 170, 40, 30, col, 8, 0, 360, -20);
      p.stroke([[186, 160], [186, 20]], 14);
      p.poly([[110, 40], [186, 20], [186, 50], [110, 70]], col, 8);
    }
  };
  var fxBurst = (p, t, col = "#fff3b0", rays = 10, r0 = 40, r1 = 230) => {
    const c = 250, e = 1 - (1 - t) ** 3;
    for (let i = 0; i < rays; i++) {
      const a = rad(i * 360 / rays + 7 * (i % 2)), ra = r0 + (r1 - r0) * e * (0.75 + 0.25 * (i % 2));
      p.poly([
        [c + r0 * 0.5 * Math.cos(a + 0.18), c + r0 * 0.5 * Math.sin(a + 0.18)],
        [c + ra * Math.cos(a), c + ra * Math.sin(a)],
        [c + r0 * 0.5 * Math.cos(a - 0.18), c + r0 * 0.5 * Math.sin(a - 0.18)]
      ], col, Math.max(3, 8 * (1 - t)));
    }
    if (t < 0.5) p.ell(c, c, r0 * (1.4 - t), r0 * (1.4 - t), WHITE, 8);
  };
  var fxSplash = (p, t) => {
    const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
    const blue = "#bfe8ff", deep = "#6cc0f0";
    if (rise > 0.02) {
      const pts = [];
      for (let i = 0; i < 19; i++) {
        const h = (i % 2 ? 260 : 130) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
        pts.push([c - 330 + 660 * i / 18, size - 120 - h]);
      }
      p.poly([...pts, [c + 330, size - 90], [c - 330, size - 90]], blue, 10);
      p.ell(c, size - 100, 360, 46, deep, 10);
    }
    for (let i = 0; i < 8; i++) {
      const a = rad(200 + i * 18), d = 120 + 380 * t, y = size - 160 + d * Math.sin(a) + 520 * t * t, r = 26 * (1 - t) + 6;
      if (t > 0.08 && y < size - 40) p.ell(c + d * Math.cos(a), y, r, r * 1.25, blue, 7);
    }
  };
  var fxPuff = (p, t) => {
    for (let i = 0; i < 5; i++) {
      const a = rad(160 + i * 55), d = 40 + 70 * t, r = (34 + 20 * (i % 2)) * (1 - 0.6 * t);
      p.ell(150 + d * Math.cos(a), 180 + d * 0.45 * Math.sin(a), r, r * 0.8, `rgba(238,225,205,${(1 - t).toFixed(3)})`, 0);
    }
  };
  var fxStars = (p, t) => {
    for (let i = 0; i < 4; i++) {
      const a = t * Math.PI * 2 + i * Math.PI / 2, x = 210 + 150 * Math.cos(a), y = 110 + 40 * Math.sin(a), pts = [];
      for (let k = 0; k < 10; k++) {
        const r = k % 2 ? 14 : 34, b = rad(k * 36 - 90);
        pts.push([x + r * Math.cos(b), y + r * Math.sin(b)]);
      }
      p.poly(pts, "#ffd84a", 6);
    }
  };
  var fxCreak = (p, t) => {
    const j = 6 * Math.sin(t * 40);
    for (const a of [-30, 0, 30]) {
      const b = rad(a - 90);
      p.stroke([
        [150 + 70 * Math.cos(b) + j, 230 + 70 * Math.sin(b)],
        [150 + 100 * Math.cos(b) + 10 + j, 230 + 100 * Math.sin(b)],
        [150 + 130 * Math.cos(b) + j, 230 + 130 * Math.sin(b)]
      ], 10);
    }
  };
  var fxRing = (p, t) => {
    const g = p.g;
    for (let k = 0; k < 3; k++) {
      const u = t - k * 0.22;
      if (u <= 0 || u >= 1) continue;
      g.beginPath();
      g.ellipse(300, 300, 60 + 230 * u, 60 + 230 * u, 0, 0, Math.PI * 2);
      g.strokeStyle = k === 0 ? "#f6fcff" : "#cfe8fa";
      g.lineWidth = 9 * (1 - u) + 3;
      g.stroke();
    }
  };
  var fxSign = (p) => {
    const g = p.g, RED = "#d42f2f";
    p.poly(rrect(14, 14, 686, 506, 40), "#f6ecd2", 0);
    p.poly(rrect(14, 14, 686, 506, 40), null, 14);
    p.poly(rrect(70, 352, 630, 384, 8), "#8a5a3a", 9);
    g.beginPath();
    g.moveTo(112, 470);
    g.quadraticCurveTo(350, 300, 588, 470);
    g.strokeStyle = INK;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.stroke();
    for (const x of [88, 612]) p.poly(rrect(x - 16, 384, x + 16, 470, 4), "#8a5a3a", 9);
    for (const x of [150, 278, 406, 534]) {
      p.poly(rrect(x - 30, 150, x + 30, 214, 14), "#357650", 9);
      p.stroke([[x - 8, 210], [x + 34, 262], [x + 46, 338]], 15, INK);
      p.stroke([[x + 6, 210], [x - 12, 274], [x - 36, 336]], 15, INK);
      p.poly(rrect(x + 30, 330, x + 74, 350, 9), INK, 0);
      p.poly(rrect(x - 52, 328, x - 8, 348, 9), INK, 0);
    }
    for (const [a, b] of [[[96, 70], [604, 452]], [[604, 70], [96, 452]]]) {
      p.stroke([a, b], 58, "#ffffff");
      p.stroke([a, b], 42, RED);
    }
  };
  var fxCloud = (p, seed) => {
    const blobs = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
    for (const [x, y, r] of blobs) p.ell(x + seed * 37 % 20 - 10, y, r, r * 0.8, "#ffffff", 0);
    p.ell(300, 235, 230, 40, "#ffffff", 0);
  };
  var fxShadow = (p, col) => {
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 256);
    g.save();
    g.filter = "blur(9px)";
    const lg = g.createLinearGradient(0, 205, 0, 22);
    lg.addColorStop(0, mix(col, WHITE, 0.08));
    lg.addColorStop(0.55, mix(col, WHITE, 0.3));
    lg.addColorStop(1, mix(col, WHITE, 0.85));
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(40, 205);
    g.bezierCurveTo(36, 120, 46, 50, 64, 30);
    g.bezierCurveTo(82, 50, 92, 120, 88, 205);
    g.closePath();
    g.fill();
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(64, 205, 30, 17, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  var fxContact = (p, col) => {
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [[0, 0], [0.32, 0.02], [0.5, 0.22], [0.66, 0.58], [0.82, 0.88], [1, 1]]) gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  };
  var fxPlank = (p) => {
    p.poly(rrect(14, 30, 306, 78, 10), "#a8744a", 9);
    p.line([[40, 46], [150, 44], [270, 50]], "#7d5234", 4);
    p.line([[60, 62], [200, 64], [284, 60]], "#7d5234", 4);
    p.dot(36, 54, 5, INK);
    p.dot(284, 54, 5, INK);
  };
  var fxDrum = (p) => {
    p.poly(rrect(40, 70, 220, 190, 16), "#f1ece0", 9);
    p.poly(rrect(32, 58, 228, 86, 12), "#c9373a", 8);
    p.poly(rrect(32, 176, 228, 204, 12), "#c9373a", 8);
    p.line([[52, 88], [82, 172], [112, 88], [142, 172], [172, 88], [202, 172]], INK, 6);
    p.ell(130, 58, 98, 18, "#f7f3ea", 8);
  };
  var fxBlob = (p, col) => {
    const g = p.g;
    g.fillStyle = WHITE;
    g.fillRect(0, 0, 128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [r, k] of [[0, 0], [0.5, 0.04], [0.64, 0.18], [0.76, 0.42], [0.87, 0.72], [0.95, 0.92], [1, 1]]) gr.addColorStop(r, mix(col, WHITE, k));
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  };
  function laoFaceSide(p, o, hx, hy, W, expr, lid, u) {
    const skin = o.skin ?? SKIN;
    p.ell(hx - 17 * u, hy + 2 * u, 10 * u, 14 * u, skin, 4 * u);
    p.ell(hx - 17 * u, hy + 3 * u, 4.5 * u, 7 * u, mul(skin, [0.9, 0.8, 0.78]), 0);
    if (o.muzzle) p.ell(hx + 38 * u, hy + 15 * u, 17 * u, 14 * u, o.muzzle, 0);
    const ex = hx + 24 * u, ey = hy - 2 * u;
    if (lid > 0.5) p.stroke([[ex - 12 * u, ey], [ex + 12 * u, ey - 1 * u]], 4 * u);
    else {
      p.ell(ex, ey, 13 * u, 15 * u, WHITE, 3 * u);
      p.ell(ex + 4 * u, ey + 1 * u, 7.5 * u, 9.5 * u, INK, 1.4 * u);
      p.ell(ex + 7 * u, ey - 3 * u, 2.2 * u, 2.6 * u, WHITE, 0);
      p.stroke([[ex - 13 * u, ey - 2 * u], [ex - 4 * u, ey - 9 * u], [ex + 12 * u, ey - 7 * u]], 3 * u, INK);
    }
    const shock = expr === "shock", stern = expr === "stern" || expr === "pained";
    const by = ey - 20 * u + (shock ? -5 * u : 0) + (stern ? 5 * u : 0);
    p.stroke([[ex - 13 * u, by + 4 * u], [ex - 1 * u, by - (shock ? 2 : 0) * u], [ex + 14 * u, by + 2 * u]], 5 * u, INK);
    const np = [[hx + 33 * u, hy + 1 * u], [hx + 45 * u, hy + 6 * u], [hx + 50 * u, hy + 17 * u], [hx + 44 * u, hy + 25 * u], [hx + 35 * u, hy + 23 * u], [hx + 32 * u, hy + 11 * u]];
    p.poly(np, mul(skin, [0.99, 0.93, 0.9]), 0);
    p.stroke([np[0], np[1], np[2]], 2.6 * u, mul(skin, [0.55, 0.45, 0.42]));
    p.stroke([[hx + 36 * u, hy + 23 * u], [hx + 44 * u, hy + 21 * u]], 2 * u, mul(skin, [0.5, 0.4, 0.38]));
    p.stroke([[hx + 46 * u, hy + 12 * u], [hx + 48 * u, hy + 18 * u]], 1.6 * u, mul(skin, [0.7, 0.58, 0.55]));
    const mx = hx + 27 * u, my = hy + 28 * u;
    if (expr === "shock") {
      p.ell(mx, my, 7 * u, 10 * u, MOUTH, 3 * u);
      p.ell(mx, my - 3 * u, 4 * u, 3.5 * u, WHITE, 0);
    } else if (expr === "grin" || expr === "laugh" || expr === "relief_open") {
      p.poly([[mx - 9 * u, my - 3 * u], [mx + 9 * u, my - 3 * u], [mx + 8 * u, my + 6 * u], [mx - 8 * u, my + 6 * u]], MOUTH, 3 * u);
      p.poly([[mx - 7 * u, my - 2 * u], [mx + 7 * u, my - 2 * u], [mx + 7 * u, my + 1 * u], [mx - 7 * u, my + 1 * u]], WHITE, 0);
    } else if (expr === "pained") {
      p.poly([[mx - 9 * u, my - 2 * u], [mx + 9 * u, my - 2 * u], [mx + 8 * u, my + 4 * u], [mx - 8 * u, my + 4 * u]], WHITE, 2.5 * u);
      for (const d of [-4, 0, 4]) p.stroke([[mx + d * u, my - 2 * u], [mx + d * u, my + 4 * u]], 1.4 * u);
    } else if (expr === "nervous") p.stroke([[mx - 9 * u, my], [mx - 4 * u, my - 3 * u], [mx + 1 * u, my + 2 * u], [mx + 8 * u, my - 1 * u]], 3 * u);
    else if (expr === "smile" || expr === "smile_closed" || expr === "relief") p.arc(mx, my - 3 * u, 10 * u, 5.5 * u, 20, 160, 3 * u);
    else if (stern) p.stroke([[mx - 9 * u, my + 1 * u], [mx + 9 * u, my + 1 * u]], 3 * u);
    else p.stroke([[mx - 9 * u, my], [mx + 9 * u, my - 1 * u]], 3 * u);
    p.stroke([[hx + 10 * u, hy + 23 * u], [hx + 16 * u, hy + 33 * u], [hx + 27 * u, hy + 35 * u]], 2.4 * u, mul(skin, [0.6, 0.5, 0.48]));
    if (o.glasses) {
      p.ell(ex, ey, 15 * u, 15 * u, null, 2.6 * u);
      p.stroke([[ex + 15 * u, ey], [ex + 23 * u, ey + 2 * u]], 2 * u);
    }
    if (o.scarf) {
      p.poly([[hx - 9 * u, hy + 38 * u], [hx + 10 * u, hy + 40 * u], [hx + 8 * u, hy + 51 * u], [hx - 10 * u, hy + 49 * u]], o.scarf, 3 * u);
      p.poly([[hx + 2 * u, hy + 50 * u], [hx + 10 * u, hy + 57 * u], [hx + 2 * u, hy + 77 * u], [hx - 4 * u, hy + 59 * u]], o.scarf, 2.5 * u);
    }
  }
  function laoFaceFront(p, o, cx, cy, W, expr, facing, lid, u) {
    const skin = o.skin ?? SKIN;
    p.ell(cx - 31 * u, cy + 2 * u, 9 * u, 13 * u, skin, 3.5 * u);
    p.ell(cx + 31 * u, cy + 2 * u, 9 * u, 13 * u, skin, 3.5 * u);
    const shock = expr === "shock", stern = expr === "stern" || expr === "pained";
    const by = cy - 20 * u + (shock ? -5 * u : 0) + (stern ? 5 * u : 0);
    for (const s of [-1, 1]) {
      const ex = cx + s * 14 * u;
      if (lid > 0.5) p.stroke([[ex - 11 * u, cy], [ex + 11 * u, cy]], 4 * u);
      else {
        p.ell(ex, cy, 12 * u, 14 * u, WHITE, 3 * u);
        p.ell(ex + s * 3 * u, cy + 1 * u, 7 * u, 9 * u, INK, 1.4 * u);
        p.ell(ex + s * 5 * u, cy - 3 * u, 2 * u, 2.4 * u, WHITE, 0);
        p.stroke([[ex - 12 * u, cy - 3 * u], [ex - 4 * u, cy - 9 * u], [ex + 12 * u, cy - 6 * u]], 3 * u, INK);
      }
      p.stroke([[ex - 10 * u, by + 4 * u], [ex + 2 * u, by - (shock ? 2 : 0) * u], [ex + 11 * u, by + 2 * u]], 4.5 * u, INK);
      if (o.glasses) p.ell(ex, cy, 14 * u, 14 * u, null, 2.4 * u);
    }
    if (o.glasses) p.stroke([[cx - 14 * u, cy], [cx + 14 * u, cy]], 2 * u);
    if (o.muzzle) p.ell(cx, cy + 18 * u, 19 * u, 15 * u, o.muzzle, 0);
    p.poly([[cx - 6 * u, cy - 2 * u], [cx + 6 * u, cy - 2 * u], [cx + 9 * u, cy + 17 * u], [cx, cy + 23 * u], [cx - 9 * u, cy + 17 * u]], skin, 3 * u);
    p.stroke([[cx - 4 * u, cy + 19 * u], [cx + 4 * u, cy + 19 * u]], 2 * u, mul(skin, [0.5, 0.4, 0.38]));
    const my = cy + 29 * u;
    if (expr === "shock") {
      p.ell(cx, my, 8 * u, 11 * u, MOUTH, 3 * u);
      p.ell(cx, my - 3 * u, 4.5 * u, 4 * u, WHITE, 0);
    } else if (expr === "grin" || expr === "laugh" || expr === "relief_open") {
      p.poly([[cx - 11 * u, my - 4 * u], [cx + 11 * u, my - 4 * u], [cx + 10 * u, my + 6 * u], [cx - 10 * u, my + 6 * u]], MOUTH, 3 * u);
      p.poly([[cx - 8 * u, my - 3 * u], [cx + 8 * u, my - 3 * u], [cx + 8 * u, my], [cx - 8 * u, my]], WHITE, 0);
    } else if (expr === "pained") {
      p.poly([[cx - 11 * u, my - 3 * u], [cx + 11 * u, my - 3 * u], [cx + 10 * u, my + 4 * u], [cx - 10 * u, my + 4 * u]], WHITE, 2.5 * u);
      for (const d of [-5, 0, 5]) p.stroke([[cx + d * u, my - 3 * u], [cx + d * u, my + 4 * u]], 1.4 * u);
    } else if (expr === "nervous") p.stroke([[cx - 10 * u, my], [cx - 5 * u, my - 3 * u], [cx + 1 * u, my + 2 * u], [cx + 9 * u, my - 1 * u]], 3 * u);
    else if (expr === "smile" || expr === "smile_closed" || expr === "relief") p.arc(cx, my - 4 * u, 11 * u, 6 * u, 20, 160, 3 * u);
    else if (stern) p.stroke([[cx - 10 * u, my + 1 * u], [cx + 10 * u, my + 1 * u]], 3 * u);
    else p.stroke([[cx - 10 * u, my], [cx + 10 * u, my - 1 * u]], 3 * u);
    if (o.scarf) {
      p.poly([[cx - 14 * u, cy + 36 * u], [cx + 14 * u, cy + 36 * u], [cx + 12 * u, cy + 49 * u], [cx - 12 * u, cy + 49 * u]], o.scarf, 3 * u);
      p.poly([[cx + 4 * u, cy + 47 * u], [cx + 13 * u, cy + 55 * u], [cx + 8 * u, cy + 73 * u], [cx - 1 * u, cy + 57 * u]], o.scarf, 2.5 * u);
    }
  }
  var LK = "#241726";
  var lcr = (P, n = 7) => {
    const out = [], N = P.length;
    for (let i = 0; i < N; i++) {
      const p0 = P[(i - 1 + N) % N], p1 = P[i], p2 = P[(i + 1) % N], p3 = P[(i + 2) % N];
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    return out;
  };
  var lops = (P, n = 8) => {
    const out = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(P[P.length - 1]);
    return out;
  };
  var ltape = (P, W) => {
    const sm = lops(P, 10), L = [], R = [];
    for (let i = 0; i < sm.length; i++) {
      const a = sm[Math.max(0, i - 1)], b = sm[Math.min(sm.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      const w = W[Math.min(W.length - 1, Math.round(i / (sm.length - 1) * (W.length - 1)))] / 2;
      L.push([sm[i][0] - dy * w, sm[i][1] + dx * w]);
      R.push([sm[i][0] + dy * w, sm[i][1] - dx * w]);
    }
    return [...L, ...R.reverse()];
  };
  var lmul = (c, k) => mul(c, [k, k, k]);
  var lskin = (o) => o.skin || "#d6ab7a";
  var lstroke = (p, P, w0, w1, col = LK) => {
    const sm = lops(P, 8), L = [], R = [];
    for (let i = 0; i < sm.length; i++) {
      const a = sm[Math.max(0, i - 1)], b = sm[Math.min(sm.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l;
      dy /= l;
      const w = (w0 + (w1 - w0) * (i / (sm.length - 1))) / 2;
      L.push([sm[i][0] - dy * w, sm[i][1] + dx * w]);
      R.push([sm[i][0] + dy * w, sm[i][1] - dx * w]);
    }
    p.poly([...L, ...R.reverse()], col, 0);
  };
  var lhand = (p, x, y, ang, s, skin, kind = "palm") => {
    const c = Math.cos(ang), sn = Math.sin(ang);
    p.ell(x, y, 18 * s, 15 * s, skin, 3.2 * s, 0, 360, ang * 180 / Math.PI);
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
    p.ell(x, y, 18 * s, 15 * s, null, 2.6 * s, 0, 360, ang * 180 / Math.PI);
    p.stroke([[x - c * 6 * s, y - sn * 6 * s], [x - c * 10 * s, y - sn * 10 * s]], 2 * s, lmul(skin, 0.72));
  };
  var lshoe = (p, x, y, pitch, col, s) => {
    const P = [[-20, -12], [-8, -20], [12, -18], [30, -10], [44, 0], [44, 12], [22, 18], [-8, 17], [-22, 9], [-24, -2]];
    const c = Math.cos(pitch), sn = Math.sin(pitch);
    p.poly(lcr(P.map(([a, b]) => [x + (a * c - b * sn) * s, y + (a * sn + b * c) * s])), col, 3.6 * s);
    p.stroke([[x + (2 * c - 15 * sn) * s, y + (2 * sn + 15 * c) * s], [x + (34 * c - 13 * sn) * s, y + (34 * sn + 13 * c) * s]], 2.4 * s, lmul(col, 0.6));
  };
  var LEX = {
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
    dazed: { browY: 2, browIn: 4, eyeW: 1, eyeH: 1, lid: 0.08, pupil: 0.34, lookX: 4, lookY: 3, open: 0.24, smile: 0, teeth: 0, tongue: 0, jaw: 0.1 }
  };
  var lexOf = (expr, lid) => {
    const e = LEX[expr] || LEX.neutral;
    return lid >= 1 ? { ...e, lid: 1 } : lid > 0 ? { ...e, lid: Math.max(e.lid, lid) } : e;
  };
  var leye = (p, x, y, w, h, lookX, lookY, pupil, lid, skin) => {
    const a = [x - w / 2, y + 2], b = [x + w / 2, y - 2];
    const cu = [x + w * 0.03, y - h * 1.18], cl = [x - w * 0.02, y + h * 0.8];
    const up = [], lo = [];
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
      p.clip(shape, () => p.poly([...shape.map(([u0, v0]) => [u0, Math.min(v0, cy)]), ...shape.map(() => [x + w / 2, cy]), [x - w / 2, cy]], skin, 0));
      p.stroke([[x - w / 2, cy + 1], [x + w / 2, cy - 1]], 4.4, LK);
    }
    p.stroke(up, 5.2, LK);
    p.stroke([[x + w * 0.05, y + h * 0.5], [x + w * 0.3, y + h * 0.28]], 1.4, lmul(skin, 0.68));
  };
  var lbrow = (p, x, y, w, browY, browIn, col = LK) => {
    const inner = [x - w * 0.42, y + 7 + browIn], mid = [x + w * 0.02, y - 2 + browY], outer = [x + w * 0.5, y + 8 + browY];
    p.poly(lcr([inner, mid, outer, [x + w * 0.47, y + 16 + browY], [x, y + 8 + browY], [x - w * 0.36, y + 16 + browIn]], 4), col, 0);
  };
  var lmouth = (p, hx, hy, s, e, lip, fx = 1, fy = 1) => {
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
      const G = [[mx - 2 * s * fx, my - 3 * s * fy], [bx + 3 * s * fx, by - 1 * s * fy], [bx + 1 * s * fx, by + 16 * s * fy], [mx - 4 * s * fx, my + 16 * s * fy]];
      p.poly(lcr(G, 5), "#fff6e4", 3.2 * s);
      for (let i = 1; i < 4; i++) p.stroke([[mx + (bx - mx) * i / 4, my - 2 * s * fy], [mx + (bx - mx) * i / 4 - 2 * s * fx, my + 15 * s * fy]], 1.6 * s, "rgba(42,33,26,.5)");
      p.stroke(lops([[mx, my - 3 * s * fy], [mx - 20 * s * fx, my], [bx, by - 1 * s * fy]], 8), 3 * s, LK);
      return;
    }
    const P = [[mx + 2 * s * fx, my - 3 * s * fy], [mx - 18 * s * fx, my - 4 * s * fy], [bx, by], [bx - 2 * s * fx, by + drop * 0.55], [mx - 10 * s * fx, my + drop], [mx + 2 * s * fx, my + drop * 0.8]];
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
  var lheadSide = (p, o, hx, hy, s, expr, lid) => {
    const skin = lskin(o), e = lexOf(expr, lid), jaw = e.jaw;
    const face = o.face || "long";
    const kf = o.faceK || {};
    const fx = (face === "round" ? 1.12 : face === "square" ? 1.08 : 1) * (kf.fx || 1);
    const fy = (face === "round" ? 0.9 : face === "square" ? 0.97 : 1) * (kf.fy || 1);
    const noseK = kf.nose || 1, jawK = kf.jaw || 0;
    const H = (x, y) => {
      let X = hx + (x - hx) * s * fx;
      const Y = hy + (y - hy) * s * fy;
      if (y - hy > 40) X += (x - hx) * s * (0.06 * (face === "square" ? 1 : 0) + jawK);
      if (x - hx > 70) X = hx + 70 * s * fx + (X - (hx + 70 * s * fx)) * noseK;
      return [X, Y];
    };
    const C = [
      [hx - 4, hy - 116],
      [hx + 44, hy - 104],
      [hx + 76, hy - 72],
      [hx + 80, hy - 44],
      [hx + 74, hy - 30],
      [hx + 92, hy - 22],
      [hx + 102, hy - 8],
      [hx + 114, hy + 8],
      [hx + 118, hy + 22],
      [hx + 114, hy + 36],
      [hx + 126, hy + 46],
      [hx + 112, hy + 50],
      [hx + 116, hy + 58],
      [hx + 110, hy + 66],
      [hx + 114, hy + 74 + jaw * 4],
      [hx + 116, hy + 86],
      [hx + 104, hy + 98 + jaw * 12],
      [hx + 82, hy + 106 + jaw * 14],
      [hx + 46, hy + 110 + jaw * 10],
      [hx + 2, hy + 104],
      [hx - 44, hy + 102],
      [hx - 76, hy + 78],
      [hx - 96, hy + 44],
      [hx - 100, hy + 8],
      [hx - 92, hy - 38],
      [hx - 72, hy - 78],
      [hx - 36, hy - 104]
    ].map(([x, y]) => H(x, y));
    const shape = lcr(C, 6);
    p.poly(shape, skin, 0);
    p.clip(shape, () => {
      p.poly([H(hx - 104, hy - 6), H(hx - 42, hy - 18), H(hx - 34, hy + 46), H(hx - 52, hy + 92), H(hx - 96, hy + 56)], lmul(skin, 0.85), 0);
      p.poly([H(hx + 26, hy + 14), H(hx + 60, hy + 16), H(hx + 68, hy + 30), H(hx + 50, hy + 36), H(hx + 30, hy + 28)], lmul(skin, 0.92), 0);
    });
    p.inkRing(shape, 4.4 * s, Math.atan2(0.55, -0.83), 0.42);
    lstroke(p, [H(hx + 78, hy - 30), H(hx + 90, hy + 2), H(hx + 108, hy + 30)], 3.2 * s, 1.2 * s, lmul(skin, 0.64));
    p.arc(hx + 120 * s * fx, hy + 36 * s * fy, 9 * s, 6 * s, 15, 150, 2.2 * s, lmul(skin, 0.58));
    const ex = hx + 56 * s * fx, ey = hy - 15 * s * fy;
    leye(p, ex, ey, 64 * s * e.eyeW * (kf.eye || 1), 44 * s * e.eyeH * (kf.eye || 1), e.lookX * s, e.lookY * s, e.pupil, e.lid, skin);
    lbrow(p, ex + 2 * s, ey - 32 * s, 72 * s * (kf.brow || 1), e.browY * s, e.browIn * s, o.browCol || LK);
    const J = [H(hx + 24, hy + 46), H(hx + 70, hy + 40), H(hx + 104, hy + 52), H(hx + 110, hy + 84), H(hx + 98, hy + 106), H(hx + 70, hy + 114), H(hx + 40, hy + 104), H(hx + 24, hy + 80)];
    p.poly(lcr(J, 6), lmul(skin, 0.985), 0);
    lstroke(p, [H(hx + 24, hy + 80), H(hx + 40, hy + 104), H(hx + 70, hy + 114), H(hx + 96, hy + 106)], 2.6 * s, 1.2 * s, lmul(skin, 0.68));
    lmouth(p, hx, hy, s, e, lmul(skin, 0.55), fx, fy);
    if (o.age) {
      p.stroke(lops([H(hx + 26, hy - 58), H(hx + 48, hy - 62), H(hx + 66, hy - 56)], 7), 2.2 * s, lmul(skin, 0.74));
      p.stroke(lops([H(hx + 30, hy - 44), H(hx + 52, hy - 47)], 5), 1.8 * s, lmul(skin, 0.76));
      p.stroke(lops([H(hx + 80, hy + 64), H(hx + 94, hy + 78), H(hx + 90, hy + 94)], 6), 2 * s, lmul(skin, 0.72));
    }
    if (o.beard) {
      const bc = o.beard, bl = o.beardLen || 1;
      p.poly([H(hx - 56, hy + 20), H(hx - 38, hy + 24), H(hx - 18, hy + 64), H(hx - 34, hy + 72)], bc, 2.4 * s);
      p.poly(lcr([H(hx - 18, hy + 62), H(hx + 20, hy + 78), H(hx + 60, hy + 86), H(hx + 92, hy + 80), H(hx + 98, hy + 96), H(hx + 80, hy + 110 + 10 * bl), H(hx + 48, hy + 116 + 30 * bl), H(hx + 20, hy + 106 + 20 * bl), H(hx - 8, hy + 92)], 6), bc, 3 * s);
      p.poly(lcr([H(hx + 64, hy + 40), H(hx + 88, hy + 38), H(hx + 106, hy + 46), H(hx + 92, hy + 56), H(hx + 70, hy + 50)], 5), bc, 2.2 * s);
    }
    if (o.hat === "turban") {
      p.poly(lcr([H(hx - 88, hy - 66), H(hx - 84, hy - 104), H(hx - 50, hy - 126), H(hx + 6, hy - 132), H(hx + 58, hy - 120), H(hx + 84, hy - 92), H(hx + 86, hy - 66), H(hx + 20, hy - 58), H(hx - 44, hy - 60)], 5), o.cap || "#c9a24a", 4 * s);
      for (let i = 1; i <= 3; i++) p.stroke([H(hx - 82, hy - 66 - i * 14), H(hx + 20, hy - 60 - i * 14), H(hx + 82, hy - 70 - i * 14)], 2.4 * s, lmul(o.cap || "#c9a24a", 0.72));
      p.poly([H(hx + 60, hy - 92), H(hx + 78, hy - 88), H(hx + 76, hy - 74), H(hx + 58, hy - 78)], "#b23a2b", 2 * s);
    } else if (o.hat === "crown") {
      p.poly(lcr([H(hx - 82, hy - 66), H(hx - 78, hy - 100), H(hx - 46, hy - 118), H(hx + 10, hy - 122), H(hx + 56, hy - 110), H(hx + 80, hy - 86), H(hx + 82, hy - 66), H(hx + 20, hy - 58), H(hx - 42, hy - 60)], 5), o.cap || "#c9a24a", 4 * s);
      p.poly([H(hx - 10, hy - 120), H(hx + 4, hy - 150), H(hx + 18, hy - 120)], lmul(o.cap || "#c9a24a", 1.08), 3 * s);
      p.stroke([H(hx - 80, hy - 72), H(hx + 80, hy - 70)], 3 * s, "#8a5a2c");
    } else if (o.hat === "official") {
      p.poly(lcr([H(hx - 80, hy - 70), H(hx - 76, hy - 100), H(hx - 40, hy - 118), H(hx + 20, hy - 120), H(hx + 64, hy - 104), H(hx + 80, hy - 78), H(hx + 20, hy - 66), H(hx - 42, hy - 68)], 5), "#2a211a", 4 * s);
      p.poly([H(hx - 2, hy - 74), H(hx + 130, hy - 80), H(hx + 134, hy - 68), H(hx + 2, hy - 64)], "#2a211a", 3 * s);
      p.poly([H(hx - 4, hy - 74), H(hx - 130, hy - 82), H(hx - 134, hy - 70), H(hx - 4, hy - 64)], "#2a211a", 3 * s);
    } else if (o.hat === "fur") {
      p.poly(lcr([H(hx - 90, hy - 64), H(hx - 88, hy - 100), H(hx - 54, hy - 122), H(hx + 8, hy - 128), H(hx + 62, hy - 114), H(hx + 88, hy - 84), H(hx + 90, hy - 62), H(hx + 20, hy - 54), H(hx - 46, hy - 56)], 5), o.cap || "#5a4632", 4 * s);
      for (let i = 0; i < 7; i++) p.dot(hx - 66 + i * 20, hy - 66, 4 * s, lmul(o.cap || "#5a4632", 1.25));
    } else if (o.hat === "helmet") {
      p.poly(lcr([H(hx - 86, hy - 66), H(hx - 82, hy - 102), H(hx - 44, hy - 122), H(hx + 14, hy - 126), H(hx + 62, hy - 110), H(hx + 84, hy - 86), H(hx + 86, hy - 64), H(hx + 20, hy - 56), H(hx - 44, hy - 58)], 5), "#6a7a82", 4 * s);
      p.poly([H(hx - 10, hy - 124), H(hx + 2, hy - 156), H(hx + 14, hy - 124)], "#8a9aa2", 2.6 * s);
      p.poly([H(hx - 90, hy - 50), H(hx - 62, hy - 44), H(hx - 66, hy + 20), H(hx - 92, hy + 12)], "#4a5a62", 3 * s);
    } else if (o.hat === "band") {
      p.poly([H(hx - 84, hy - 58), H(hx + 82, hy - 56), H(hx + 80, hy - 42), H(hx - 86, hy - 44)], o.cap || "#8a3a2c", 3 * s);
      p.poly([H(hx - 86, hy - 46), H(hx - 120, hy - 30), H(hx - 112, hy - 14), H(hx - 80, hy - 34)], o.cap || "#8a3a2c", 2.4 * s);
    } else if (o.hat === "scholar") {
      p.poly(lcr([H(hx - 84, hy - 64), H(hx - 80, hy - 92), H(hx - 48, hy - 108), H(hx + 12, hy - 112), H(hx + 58, hy - 100), H(hx + 80, hy - 78), H(hx + 82, hy - 64), H(hx + 20, hy - 58), H(hx - 44, hy - 60)], 5), "#2a211a", 3.8 * s);
      p.stroke([H(hx - 84, hy - 66), H(hx + 82, hy - 64)], 4 * s, "#1a1410");
      p.poly([H(hx + 28, hy - 104), H(hx + 64, hy - 96), H(hx + 62, hy - 76), H(hx + 26, hy - 84)], lmul("#2a211a", 1.25), 2.4 * s);
    } else if (o.hat === "pith") {
      p.ell(hx + 10 * s * fx, hy - 76 * s * fy, 118 * s, 15 * s, "#c9b98a", 3.4 * s);
      p.poly(lcr([H(hx - 78, hy - 80), H(hx - 72, hy - 106), H(hx - 40, hy - 120), H(hx + 20, hy - 120), H(hx + 60, hy - 106), H(hx + 76, hy - 84), H(hx + 20, hy - 74), H(hx - 40, hy - 76)], 5), "#d8c9a0", 3.8 * s);
      p.stroke([H(hx - 76, hy - 84), H(hx + 76, hy - 82)], 4 * s, "#8a6a44");
    }
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
    const earX = hx - 88 * s * fx, earY = hy + 22 * s * fy;
    p.ell(earX, earY, 16 * s, 22 * s, lmul(skin, 0.97), 3.8 * s);
    p.stroke(lops([[earX, earY - 14 * s], [earX - 8 * s * fx, earY], [earX, earY + 14 * s]], 8), 3 * s, lmul(skin, 0.7));
    p.ell(earX, earY, 6 * s, 9 * s, null, 1.8 * s);
    if (o.monk) p.stroke(lops([H(hx - 30, hy - 100), H(hx, hy - 108), H(hx + 30, hy - 100)], 6), 3 * s, lmul(skin, 1.08));
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
    if (o.glasses) {
      p.ell(ex, ey, 30 * s, 26 * s, null, 2.9 * s);
      p.stroke([[ex - 30 * s, ey - 1 * s], [hx - 64 * s * fx, ey + 3 * s]], 2.2 * s);
    }
    if (o.scarf) {
      p.poly(lcr([H(hx - 58, hy + 112), H(hx + 50, hy + 116), H(hx + 54, hy + 142), H(hx - 62, hy + 138)], 5), o.scarf, 3 * s);
      p.poly(lcr([H(hx + 22, hy + 134), H(hx + 46, hy + 140), H(hx + 42, hy + 184), H(hx + 14, hy + 160)], 5), o.scarf, 2.6 * s);
      p.stroke([H(hx + 20, hy + 152), H(hx + 15, hy + 170)], 1.8 * s, lmul(o.scarf, 0.7));
    }
  };
  var lbodySide = (p, o, opts) => {
    const { phase = 0, expr = "neutral", mode = "stand", blink = false, stomp = 1, pose = 0, stride = 1, light = -2.1 } = opts;
    const skin = lskin(o), lid = lidOf(blink), two = Math.PI * 2;
    const stout = o.build === "stout";
    const s = (o.head ?? 1) * 1.08 * (stout ? 1.02 : 1);
    const AP = opts.actPose || (window.LAO_POSE || {})[opts.act || ""] || null;
    const actT = opts.actT || 0;
    const straightArm = opts.straightArm === true;
    let armWrist = null;
    const sole = 975, hipY = 850, S = 170 * (AP?.run ? 1.5 : stride);
    if (AP?.sit) {
      p.g.save();
      p.g.translate(0, 190);
      p.g.scale(0.82, 0.82);
    }
    if (AP?.hip) {
      p.g.save();
      p.g.translate(0, AP.hip);
    }
    const st = (ph) => {
      const c = ((phase + ph) % 1 + 1) % 1;
      if (c < 0.5) {
        const k2 = c / 0.5;
        return { x: S / 2 - S * k2, h: 0, stance: true, s: k2 };
      }
      const k = (c - 0.5) / 0.5;
      return { x: -S / 2 + S * k - S / Math.PI * Math.sin(2 * Math.PI * k), h: ((AP?.run ? 36 : 22) + 16 * (stomp - 1)) * Math.sin(Math.PI * k), stance: false, s: k };
    };
    const nL = st(0), fL = st(0.5);
    const bob = mode === "march" ? 5 * Math.cos(2 * two * phase) : 0;
    const lean = AP ? AP.lean ?? 0 : mode === "push" ? 11 * pose : mode === "march" ? 3 : 0;
    const legLen = 125, l1 = legLen * 0.52, l2 = legLen * 0.48;
    const legs = [];
    if (mode === "march") {
      for (const [L, near] of [[fL, false], [nL, true]])
        legs.push({ ank: [300 + (near ? 46 : -46) + L.x * 0.9, sole - 8 - L.h], pitch: L.stance ? 0 : 0.34 * Math.sin(Math.PI * L.s), near });
    } else if (mode === "push") {
      legs.push({ ank: [300 - 66 - 10 * pose, sole - 6], pitch: -0.05, near: false }, { ank: [300 + 62 + 12 * pose, sole - 6], pitch: 0.06, near: true });
    } else {
      legs.push({ ank: [300 - 56, sole - 6], pitch: -0.02, near: false }, { ank: [300 + 56, sole - 6], pitch: 0.04, near: true });
    }
    if (!AP?.kneel && !AP?.sit) {
      for (const L of legs) {
        const hip = [300 + (L.near ? 26 : -26), hipY - bob];
        const knee = mode === "march" ? ik(hip, L.ank, l1, l2) : [hip[0] + (L.ank[0] - hip[0]) * 0.5 + (L.near ? 7 : -7), (hip[1] + L.ank[1]) / 2];
        const pants = lmul(o.pants, L.near ? 1 : 0.8);
        p.poly(ltape([hip, [(knee[0] + hip[0]) / 2, (knee[1] + hip[1]) / 2], knee, [(knee[0] + L.ank[0]) / 2, (knee[1] + L.ank[1]) / 2], L.ank], [36, 33, 30, 26, 24]), pants, 3.4);
        p.stroke([[L.ank[0] - 22, L.ank[1] - 4], [L.ank[0] + 16, L.ank[1] - 4]], 6, lmul(pants, 0.55));
        lshoe(p, L.ank[0] + 4, L.ank[1] + 12, L.pitch, lmul(o.boots, L.near ? 1.55 : 1.25), 1.42);
      }
    }
    if (AP?.kneel) {
      for (const [off, near] of [[-10, false], [10, true]]) {
        const hipK = [286 + off, 850 + bob];
        const kneeK = [226 + off, 902 + bob];
        const ankK = [166 + off, 936 + bob];
        p.poly(ltape([hipK, kneeK, ankK], [38, 34, 30]), lmul(o.pants, near ? 1 : 0.8), 3.4);
        lshoe(p, ankK[0] - 4, ankK[1] + 10, -1.15, lmul(o.boots, near ? 1.55 : 1.25), 1.42);
      }
    }
    p.rot = lean ? [rad(lean), 300, hipY] : null;
    if (o.pickaxe) {
      p.band([[206, 836 + bob], [342, 500 + bob]], "#6b4a2f", 7, 2);
      p.poly([[334, 508 + bob], [390, 484 + bob], [398, 504 + bob], [344, 526 + bob]], "#4a3a2c", 2.6);
    }
    const widen = stout ? 16 : o.thin ? -14 : 0;
    if (!o.robe) {
      const T = [
        [236, 498],
        [206, 540],
        [184, 600],
        [178, 664],
        [184, 728],
        [198, 788],
        [220, 830],
        [256, 850],
        [300, 864],
        [344, 850],
        [376, 830],
        [400, 788],
        [420, 728],
        [426, 664],
        [420, 600],
        [398, 540],
        [364, 502],
        [330, 496],
        [294, 490]
      ].map(([x, y]) => [x + (x < 300 ? -widen : widen), y + bob]);
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
    if (o.robe) {
      const RT = [
        [236, 498],
        [206, 540],
        [184, 600],
        [178, 664],
        [184, 728],
        [196, 800],
        [214, 868],
        [246, 912],
        [300, 926],
        [354, 912],
        [386, 868],
        [404, 800],
        [420, 728],
        [426, 664],
        [420, 600],
        [398, 540],
        [364, 502],
        [330, 496],
        [294, 490]
      ].map(([x, y]) => [x + (x < 300 ? -widen : widen), y + bob]);
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
        if (o.prayer) for (let i = 0; i < 9; i++) {
          const a = i / 9 * Math.PI * 2;
          p.dot(300 + Math.cos(a) * 70, 640 + Math.sin(a) * 90 + bob, 4, "#5a3a2a");
        }
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
      p.poly(lcr([[238, 500 + bob], [292, 492 + bob], [300, 556 + bob], [248, 566 + bob]], 5), "#6a7a82", 3.4);
      p.poly(lcr([[306, 494 + bob], [360, 502 + bob], [354, 566 + bob], [304, 558 + bob]], 5), "#6a7a82", 3.4);
      p.poly([[250, 560 + bob], [354, 558 + bob], [348, 690 + bob], [258, 690 + bob]], "#53636c", 3.2);
      for (let i = 0; i < 3; i++) p.stroke([[262, 590 + i * 30 + bob], [344, 588 + i * 30 + bob]], 2, "rgba(30,30,30,.35)");
    }
    const drawArm = (shoulder, elbow, wrist, near, handKind = "palm") => {
      const cloth = o.robe || o.jacket;
      const col = lmul(cloth, near ? 1.18 : 0.72), w = o.robe ? near ? [64, 56, 50] : [60, 52, 46] : near ? [40, 35, 31] : [38, 33, 29];
      p.poly(ltape([shoulder, elbow, wrist], w), col, 3.4);
      if (near) p.stroke([shoulder, elbow, wrist], 1.4, "rgba(239,227,196,.38)");
      p.stroke([[wrist[0] - (o.robe ? 15 : 13), wrist[1] - 2], [wrist[0] + (o.robe ? 15 : 13), wrist[1] + 1]], o.robe ? 6 : 4.6, lmul(cloth, near ? 0.72 : 0.6));
      const hAng = Math.atan2(wrist[1] - elbow[1], wrist[0] - elbow[0]);
      lhand(p, wrist[0], wrist[1], hAng, 1.22, lmul(skin, near ? 1 : 0.88), handKind);
    };
    const drawFar = (shoulder, elbow, wrist, handKind = "palm", front = false) => {
      if (!front) return;
      const root = [342, 540 + bob];
      p.poly(ltape([root, wrist], [30, 26]), lmul(o.robe || o.jacket, 0.72), 3);
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
      const armPts = (sh, a1, a22, l12 = 78, l22 = 72) => {
        const e = [sh[0] - Math.sin(a1 * D) * l12, sh[1] + Math.cos(a1 * D) * l12];
        const w = [e[0] - Math.sin(a22 * D) * l22, e[1] + Math.cos(a22 * D) * l22];
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
        p.poly(ltape([[316, 650 + bob], [316, 580 + bob]], [34, 30]), lmul(cloth, 0.85), 3);
        p.ell(px - 7, py, 11, 24, lmul(skin, 0.92), 2.6);
        p.ell(px + 7, py, 11, 24, skin, 2.6);
        p.stroke([[px, py - 20], [px, py + 20]], 1.2, "rgba(74,58,40,.35)");
        for (let k = 0; k < 4; k++) {
          p.stroke([[px - 4, py + 18 - k * 5], [px - 4, py + 22 - k * 5]], 1, "rgba(74,58,40,.35)");
          p.stroke([[px + 4, py + 18 - k * 5], [px + 4, py + 22 - k * 5]], 1, "rgba(74,58,40,.35)");
        }
      } else {
        if (!AP.lookUpFace && !AP.wipe) {
          drawArm(nP[0], nP[1], nP[2], true, AP.handN || "palm");
          armWrist = nP[2];
        }
        if (!AP.wipe) drawFar(fP[0], fP[1], fP[2], AP.handF || "palm", !!AP.farFront);
      }
      const wr = nP[2], a2 = (nA[1] + osc) * D;
      if (AP.prop === "knife") {
        const dx = -Math.sin(a2), dy = Math.cos(a2);
        p.poly([[wr[0] - 6 * dy, wr[1] + 6 * dx], [wr[0] + dx * 54 - 8 * dy, wr[1] + dy * 54 + 8 * dx], [wr[0] + dx * 60, wr[1] + dy * 60], [wr[0] + 6 * dy, wr[1] - 6 * dx]], "#c9c9c9", 2.4);
        p.band([[wr[0] - dx * 6, wr[1] - dy * 6], [wr[0] + dx * 6, wr[1] + dy * 6]], "#5a3a2a", 8, 2);
      }
      if (AP.prop === "book") {
        p.poly(lcr([[wr[0] - 4, wr[1] - 6], [wr[0] + 40, wr[1] - 14], [wr[0] + 44, wr[1] + 22], [wr[0], wr[1] + 30]], 5), "#efe3c4", 2.4);
        p.stroke([[wr[0] + 2, wr[1] + 8], [wr[0] + 40, wr[1] + 1]], 1.6, "rgba(74,58,40,.4)");
      }
      if (AP.prop === "sack") {
        p.poly(lcr([[206, 420 + bob], [286, 404 + bob], [306, 500 + bob], [268, 560 + bob], [204, 540 + bob]], 5), "#9a7a4e", 3.2);
        p.stroke([[216, 440 + bob], [280, 430 + bob]], 2.4, "rgba(74,58,40,.5)");
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
        p.poly(lcr([[lx - 24, ly + 16], [lx + 24, ly + 16], [lx + 20, ly + 66], [lx - 20, ly + 66]], 5), "#b23a2b", 3);
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
        const hx2 = o.staff ? 438 : o.spear ? 450 : o.pickaxe ? 430 : 430;
        drawArm([300, 496 + bob], [355, 555 + bob], [hx2, 610 + bob], true);
        armWrist = [hx2, 610 + bob];
      } else if (mode === "stand") {
        drawArm([300, 496 + bob], [300, 590 + bob], [300, 680 + bob], true);
        armWrist = [300, 680 + bob];
      } else {
        drawArm([300, 496 + bob], [408 + 18 * Math.sin(sw2), 606 + bob], [416 + 48 * Math.sin(sw2 * 0.85), 694 + bob], true);
        armWrist = [416 + 48 * Math.sin(sw2 * 0.85), 694 + bob];
      }
    }
    const neckY = 470 + bob;
    const neck = lcr([[252, neckY], [348, neckY], [356, 500 + bob], [244, 500 + bob]], 5);
    p.poly(neck, skin, 3.6);
    p.clip(neck, () => p.poly([[248, neckY], [300, neckY], [304, 498 + bob], [248, 498 + bob]], lmul(skin, 0.82), 0));
    const hx = 300, hy = 362 + bob + (AP?.head || 0);
    lheadSide(p, o, hx, hy, s, expr, lid);
    if (AP?.lookUpFace || AP?.wipe) {
      const wx = AP.wipe ? 336 + 8 * Math.sin(actT * 12) : 326;
      const wy = AP.wipe ? 325 : 315;
      p.poly(ltape([[345, 500 + bob], [350, 430 + bob], [wx - 4, wy + 12]], [38, 32, 28]), lmul(o.robe || o.jacket, 0.84), 3.2);
      p.poly(ltape([[350, 430 + bob], [wx - 2, wy + 8]], [26, 22]), lmul(skin, 0.96), 2.6);
      lhand(p, wx, wy, -0.4, 1.15, skin, "palm");
    }
    p.rot = null;
    if (o.staff) {
      if (AP?.pray || AP?.sit) {
        p.band([[190, 930 + bob], [380, 260 + bob]], 7, "#6b4a2f", 1.8);
        p.ell(380, 258 + bob, 14, 14, null, 4);
        p.ell(380, 258 + bob, 7, 7, null, 2.2);
        p.ell(330, 430 + bob, 8, 8, null, 2.6);
      } else {
        p.band([[438, 936 + bob], [438, 300 + bob]], "#6b4a2f", 6, 1.8);
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
      p.poly([[390, 762 + bob], [444, 720 + bob], [454, 734 + bob], [400, 776 + bob]], "#4a3524", 2.4);
      p.poly([[400, 760 + bob], [444, 720 + bob], [448, 728 + bob], [406, 768 + bob]], "#8a6a44", 1.2);
      p.band([[380, 772 + bob], [396, 760 + bob]], "#2a211a", 8, 2);
      p.ell(450, 724 + bob, 3.2, 3.2, null, 1.2);
    }
    if (o.book) {
      p.poly(lcr([[392, 700 + bob], [452, 690 + bob], [458, 730 + bob], [398, 740 + bob]], 5), "#efe3c4", 2.4);
      p.stroke([[398, 712 + bob], [452, 703 + bob]], 1.8, "rgba(74,58,40,.4)");
    }
    if (o.spear) {
      p.band([[430, 940 + bob], [510, 250 + bob]], "#6b4a2f", 5, 1.6);
      p.poly([[506, 258 + bob], [516, 226 + bob], [526, 258 + bob], [516, 270 + bob]], "#c9c9c9", 2.4);
      if (!AP) {
        p.ell(450, 610 + bob, 10, 14, skin, 2.6);
        for (let k = 0; k < 3; k++) p.stroke([[441, 602 + k * 5 + bob], [459, 602 + k * 5 + bob]], 1.2, LK);
      }
    }
    if (o.warrant) {
      p.poly(lcr([[394, 696 + bob], [450, 686 + bob], [456, 728 + bob], [400, 738 + bob]], 5), "#efe3c4", 2.2);
      p.stroke([[406, 710 + bob], [446, 703 + bob]], 1.6, "rgba(74,58,40,.4)");
    }
    if (o.telescope) p.band([[398, 700 + bob], [458, 668 + bob]], "#3a3a3a", 13, 2);
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
  var lheadFront = (p, o, cx, cy, s, expr, lid) => {
    const skin = lskin(o), e = lexOf(expr, lid);
    const face = o.face || "long";
    const fx = face === "round" ? 1.12 : face === "square" ? 1.08 : 1;
    const fy = face === "round" ? 0.9 : face === "square" ? 0.97 : 1;
    const F = (x, y) => {
      let X = cx + (x - cx) * s * fx;
      const Y = cy + (y - cy) * s * fy;
      if (face === "square" && y - cy > 40) X += (x - cx) * s * 0.05;
      return [X, Y];
    };
    const neck = lcr([[cx - 36, cy + 96], [cx + 36, cy + 96], [cx + 42, cy + 152], [cx - 42, cy + 152]], 5);
    p.poly(neck, skin, 3.6);
    p.clip(neck, () => p.poly([[cx - 42, cy + 96], [cx - 6, cy + 96], [cx - 2, cy + 152], [cx - 42, cy + 152]], lmul(skin, 0.82), 0));
    const C = [
      [cx, cy - 112],
      [cx + 58, cy - 100],
      [cx + 96, cy - 62],
      [cx + 102, cy - 18],
      [cx + 96, cy + 30],
      [cx + 84, cy + 70],
      [cx + 56, cy + 98],
      [cx, cy + 108],
      [cx - 56, cy + 98],
      [cx - 84, cy + 70],
      [cx - 96, cy + 30],
      [cx - 102, cy - 18],
      [cx - 96, cy - 62],
      [cx - 58, cy - 100]
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
    p.poly(lcr([F(cx - 15, cy - 12), F(cx + 15, cy - 12), F(cx + 22, cy + 24), F(cx + 12, cy + 44), F(cx - 12, cy + 44), F(cx - 22, cy + 24)], 5), skin, 3.2 * s);
    p.arc(cx - 11 * s * fx, cy + 39 * s * fy, 8 * s, 4.5 * s, 20, 160, 2 * s, lmul(skin, 0.58));
    p.arc(cx + 11 * s * fx, cy + 39 * s * fy, 8 * s, 4.5 * s, 20, 160, 2 * s, lmul(skin, 0.58));
    const my = cy + 68 * s * fy, open = e.open, w = 92 * s * fx;
    if (open < 0.12) {
      p.stroke(lops([[cx - w / 2, my + 1 * s * fy], [cx, my - 3 * s * fy], [cx + w / 2, my + 1 * s * fy]], 8), 4.2 * s, LK);
      p.stroke(lops([[cx - w / 2 + 8 * s, my + 12 * s * fy], [cx + w / 2 - 8 * s, my + 12 * s * fy]], 6), 1.8 * s, lmul(skin, 0.72));
    } else {
      const drop = (22 + 30 * open + 10 * e.jaw) * s * fy;
      const M = [[cx - w / 2, my], [cx - w / 2 + 10 * s, my - 5 * s * fy], [cx + w / 2 - 10 * s, my - 5 * s * fy], [cx + w / 2, my], [cx + w / 2 - 8 * s, my + drop], [cx - w / 2 + 8 * s, my + drop]];
      const mshape = lcr(M, 6);
      p.poly(mshape, "#5a1e28", 3.4 * s);
      p.clip(mshape, () => {
        if (e.teeth > 0.35) p.poly([[cx - w / 2 + 8 * s, my - 4 * s * fy], [cx + w / 2 - 8 * s, my - 4 * s * fy], [cx + w / 2 - 10 * s, my + 4 * s * fy], [cx - w / 2 + 10 * s, my + 4 * s * fy]], "#fff6e4", 0);
        if (e.tongue > 0.4) p.ell(cx, my + drop * 0.62, 18 * s, 8 * s, "#e86e78", 0);
      });
    }
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
  var lbodyFront = (p, o, opts) => {
    const { phase = 0, expr = "neutral", mode = "stand", blink = false, light = -2.1 } = opts;
    const skin = lskin(o), lid = lidOf(blink), s = (o.head ?? 1) * 1.04;
    const stout = o.build === "stout", sole = 975, hipY = 850;
    const step = mode === "march" ? 16 * Math.sin(2 * Math.PI * phase) : 0;
    for (const sign of [-1, 1]) {
      const hip = [300 + sign * 22, hipY];
      const ank = [300 + sign * 42 + step * sign, sole - 6];
      const knee = ik(hip, ank, 68, 62);
      p.poly(ltape([hip, knee, ank], [46, 40, 34]), lmul(o.pants, sign < 0 ? 0.8 : 1), 3.4);
      lshoe(p, ank[0], ank[1] + 10, 0, lmul(o.boots, sign < 0 ? 1.25 : 1.55), 1.42);
    }
    const widen = stout ? 16 : o.thin ? -14 : 0;
    const T = [
      [300, 492],
      [220 - widen, 514],
      [186 - widen, 584],
      [178 - widen, 664],
      [184 - widen, 744],
      [200 - widen, 804],
      [226, 838],
      [270, 854],
      [330, 854],
      [374, 838],
      [400 + widen, 804],
      [416 + widen, 744],
      [422 + widen, 664],
      [414 + widen, 584],
      [380 + widen, 514]
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
      const sh = [300 + sign * 118, 518];
      const el = [300 + sign * 150, 668 + step * 0.3 * sign];
      const wr = [300 + sign * 156, 792 - step * 0.4 * sign];
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
  return __toCommonJS(toon_build_exports);
})();
