// laolang.js — 1980 上海美术电影制片厂《老狼请客》式手绘赛璐璐 / 装饰绘景（laolang style）
// Load after goldenage.js: it borrows the ink engine, camera, lettering and the projected-print treatment,
// and adds its own painted plates (cliff, cave, mural), its own invented cast (three archaeologists),
// and the flat painted figures of the mural. Technique only — no character, design, gag, cue or lettering
// is taken from the film; the cast and the wall painting here are original.
//
//   const G = PROMO.laolang(F, { seed, drawings: 12.5, boil: .35, film: true, captions })
//   G.lib.lao.cliff() / .mural() / .door(t) / .arch(x,y,s,pose,dir,id) / .muralScene(t, opt)
//
// The logical page is a 4:3 gate (960×720) pillarboxed inside the 16:9 frame by the goldenage engine.
(function () {
  const P = window.PROMO;
  const M = (P && P.M) || ((zh, en) => (/^zh/i.test(document.documentElement.lang || '') ? zh : en));
  if (!P) throw new Error(M('laolang.js 要在 promo.js / goldenage.js 之后加载', 'laolang.js must load after promo.js / goldenage.js'));
  const TAU = Math.PI * 2, PI = Math.PI;

  // The palette is read off the film: faded teal and olive, warm ochre and rust, cream, a soot-brown ink.
  const PAL = {
    ink: '#2a211a', inkSoft: '#4a3a2c', inkBlue: '#23332f',
    cream: '#efe3c4', cream2: '#e2d0a8', cream3: '#d5c092',
    teal0: '#1d403f', teal1: '#2c5450', teal2: '#3f6b60', teal3: '#5d7f6d', teal4: '#7e9a7c',
    olive0: '#41491f', olive1: '#5f682b', olive2: '#7f8840', olive3: '#a0a45a',
    ochre0: '#6b4a2f', ochre1: '#8f6633', ochre2: '#b98a49', ochre3: '#d3aa63', ochre4: '#e6c98d',
    rust: '#a34c32', rust2: '#c06a45', red: '#a8372c', red2: '#c84a35',
    magenta: '#a24b6b', blue: '#4c6b72', blue2: '#6b8e8a',
    gold: '#d8a53f', gold2: '#f0cf7a', wall: '#2c5450',
  };
  const rgba = (hex, a) => {
    const h = String(hex).replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${a})`;
  };

  P.laolang = function (FM, opt = {}) {
    const G = P.goldenage(FM, {
      seed: opt.seed ?? 'laolang',
      academy: true,
      drawings: opt.drawings ?? 12.5,
      boil: opt.boil ?? 0.38,
      film: opt.film !== false,
      gate: opt.gate !== false,
      accent: opt.accent ?? PAL.red,
      colors: { ink: PAL.ink, cream: PAL.cream, gold: PAL.gold, red: PAL.red, ...(opt.colors || {}) },
      fonts: {
        display: '"Ma Shan Zheng", "KaiTi", "STKaiti", serif',
        body: '"Noto Serif SC", "SimSun", "Songti SC", serif',
        serif: '"Noto Serif SC", "SimSun", serif',
        sans: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
        ...(opt.fonts || {}),
      },
      captions: opt.captions ?? { max: 20, size: 36 },
    });
    const L = G.lib, W = G.W, H = G.H, RS = G.RS;
    const { S, F, L: line, push, pop, tr, rot, scl, seed, pEll, pQuad, pLine, pCub, pRR, spl, off, cel, tube, limb, eye40, mouth40, puff, clamp, lerp, hash, camPush, veil } = L;
    const box = (...a) => a;
    const shadow = (x, y, rx, ry, a = 0.34) => F(pEll(x, y, rx, ry, 0, TAU, 18), rgba(PAL.ink, a));

    /* ============================================================
       PAINTED PLATES — gouache/water-colour shapes with a dry brush
       and a soot outline; everything is painted once into an
       offscreen canvas and then flown under the same camera.
       ============================================================ */
    let prn = 20251109;
    const rnd = () => { prn = (prn * 16807) % 2147483647; return prn / 2147483647; };
    const rs = (n) => { prn = (n * 7919 + 13) % 2147483647 || 7; };
    const rr = (a, b) => a + (b - a) * rnd();
    const mk = (w, h, fn) => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * RS));
      c.height = Math.max(1, Math.round(h * RS));
      const x = c.getContext('2d');
      x.scale(RS, RS);
      fn(x, w, h);
      return c;
    };
    /* smooth hand-cut polygon through points [x,y,…] */
    const pathIn = (x, pts, close = true) => {
      const n = pts.length / 2 | 0;
      if (n < 2) return;
      const g = (i) => [pts[2 * ((i + n) % n)], pts[2 * ((i + n) % n) + 1]];
      if (close) {
        const a = g(0), b = g(n - 1);
        x.beginPath(); x.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        for (let i = 0; i < n; i++) { const c0 = g(i), c1 = g(i + 1); x.quadraticCurveTo(c0[0], c0[1], (c0[0] + c1[0]) / 2, (c0[1] + c1[1]) / 2); }
        x.closePath();
      } else {
        x.beginPath(); x.moveTo(pts[0], pts[1]);
        for (let i = 1; i < n; i++) x.lineTo(pts[2 * i], pts[2 * i + 1]);
      }
    };
    /* subdivide every edge: a smoothed path through many points stays a rectangle instead of turning into an ellipse */
    const sub = (pts, n = 5) => {
      const m = pts.length / 2 | 0, o = [];
      for (let i = 0; i < m; i++) {
        const ax = pts[2 * i], ay = pts[2 * i + 1], bx = pts[2 * ((i + 1) % m)], by = pts[2 * ((i + 1) % m) + 1];
        for (let k = 0; k < n; k++) { const u = k / n; o.push(ax + (bx - ax) * u, ay + (by - ay) * u); }
      }
      return o;
    };
    const paint = (x, pts, fill, stroke = PAL.ink, lw = 1.4, alpha = 1) => {
      x.save(); x.globalAlpha = alpha; pathIn(x, pts, true);
      if (fill) { x.fillStyle = fill; x.fill(); }
      if (stroke && lw > 0) { x.strokeStyle = stroke; x.lineWidth = lw; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }
      x.restore();
    };
    const paintLine = (x, pts, stroke, lw = 1.6, alpha = 1, close = false) => {
      x.save(); x.globalAlpha = alpha; pathIn(x, pts, close); x.strokeStyle = stroke; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(); x.restore();
    };
    const wash = (x, x0, y0, w, h, stops, vert = true) => {
      const g = vert ? x.createLinearGradient(0, y0, 0, y0 + h) : x.createLinearGradient(x0, 0, x0 + w, 0);
      for (const s of stops) g.addColorStop(s[0], s[1]);
      x.fillStyle = g; x.fillRect(x0, y0, w, h);
    };
    const blob = (x, cx, cy, rx, ry, col, a = 0.2, n = 7) => {
      const pts = [];
      for (let i = 0; i < n; i++) { const an = i / n * TAU; const k = 0.72 + rnd() * 0.5; pts.push(cx + Math.cos(an) * rx * k, cy + Math.sin(an) * ry * k); }
      x.save(); x.globalAlpha = a; pathIn(x, pts, true); x.fillStyle = col; x.fill(); x.restore();
    };
    const dots = (x, x0, y0, w, h, n, col, a = 0.25, r0 = 0.5, r1 = 2) => {
      x.save(); x.fillStyle = col;
      for (let i = 0; i < n; i++) { x.globalAlpha = a * rr(0.3, 1); x.beginPath(); x.arc(x0 + rnd() * w, y0 + rnd() * h, rr(r0, r1), 0, TAU); x.fill(); }
      x.restore();
    };
    const dry = (x, x0, y0, x1, y1, w, col, n = 8, a = 0.12) => {
      x.save(); x.strokeStyle = col; x.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        x.globalAlpha = a * rr(0.4, 1.2); x.lineWidth = w * rr(0.4, 1.1);
        const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, o = rr(-w, w);
        x.beginPath(); x.moveTo(x0 + nx * o, y0 + ny * o);
        x.quadraticCurveTo((x0 + x1) / 2 + nx * (o + rr(-3, 3)), (y0 + y1) / 2 + ny * (o + rr(-3, 3)), x1 + nx * o, y1 + ny * o);
        x.stroke();
      }
      x.restore();
    };
    const crack = (x, x0, y0, x1, y1, col = rgba(PAL.ink, 0.45), lw = 1) => {
      const n = 5, pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n; pts.push(x0 + (x1 - x0) * u + rr(-5, 5), y0 + (y1 - y0) * u + rr(-4, 4)); }
      paintLine(x, pts, col, lw, 1, false);
    };
    const leaf = (x, cx, cy, rx, ry, col, stroke = PAL.inkBlue, a = 0.9) => paint(x, [cx - rx, cy, cx, cy - ry, cx + rx, cy, cx, cy + ry * 0.7], col, stroke, 0.9, a);
    const tree = (x, bx, by, s, trunk = PAL.teal0, leafCol = PAL.olive1) => {
      x.save(); x.translate(bx, by); x.scale(s, s);
      paintLine(x, [0, 0, -8, -100, 6, -180, -4, -260], trunk, 13, 0.95);
      paintLine(x, [-2, -120, -38, -170, -52, -210], trunk, 7, 0.9);
      paintLine(x, [2, -160, 38, -205, 50, -245], trunk, 6, 0.9);
      for (let i = 0; i < 14; i++) {
        const px = rr(-58, 58), py = -190 + rr(-78, 30);
        leaf(x, px, py, rr(7, 15), rr(12, 26), leafCol, PAL.inkBlue, 0.9);
      }
      x.restore();
    };

    /* settle the paint into paper: fine pigment grain + a faint canvas tooth, seeded once per plate */
    const paperize = (c, amt = 0.10, sd = 7) => {
      const x = c.getContext('2d'), w = c.width, h = c.height, im = x.getImageData(0, 0, w, h), d = im.data;
      let a = (sd * 2654435761) >>> 0;
      const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] === 0) continue;
        const n = (r() - 0.5) * 255 * amt;
        d[i] = clamp(d[i] + n * 1.12, 0, 255); d[i + 1] = clamp(d[i + 1] + n, 0, 255); d[i + 2] = clamp(d[i + 2] + n * 0.82, 0, 255);
      }
      x.putImageData(im, 0, 0);
      // canvas tooth: a few thousand very faint horizontal fibres
      x.save(); x.globalAlpha = 0.035; x.strokeStyle = '#2a211a';
      for (let i = 0; i < 1400; i++) { const yy = r() * h, xx = r() * w, l = 3 + r() * 18; x.lineWidth = 0.4 + r() * 0.8; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + l, yy + (r() - 0.5) * 1.2); x.stroke(); }
      x.restore();
    };
    const PL = {};
    const plate = (name, fn) => { if (!PL[name]) { rs(name.length * 131 + 17); PL[name] = mk(W, H, fn); paperize(PL[name], name === 'cliff' ? 0.11 : 0.085, name.length + 3); } return PL[name]; };

    /* ---- 1. the cliff at 榆林窟, late afternoon ---- */
    const cliff = () => plate('cliff', (x, w, h) => {
      wash(x, 0, 0, w, h, [[0, '#a99763'], [0.38, '#8f9468'], [0.66, '#6e8574'], [1, '#4f6e68']]);
      // low sun
      x.save();
      const sg = x.createRadialGradient(178, 158, 6, 178, 158, 128);
      sg.addColorStop(0, 'rgba(255,236,178,.34)'); sg.addColorStop(0.32, 'rgba(248,214,146,.15)'); sg.addColorStop(1, 'rgba(248,214,146,0)');
      x.fillStyle = sg; x.fillRect(40, 20, 300, 300);
      
      x.restore();
      // far hills: three cut-paper layers
      paint(x, [-40, 390, 90, 330, 210, 360, 320, 305, 430, 350, 560, 300, 690, 345, 820, 292, 990, 340, 990, 520, -40, 520], '#71856c', rgba(PAL.teal0, 0.72), 1.6);
      paint(x, [-40, 450, 80, 400, 190, 430, 290, 385, 390, 425, 500, 380, 620, 420, 740, 372, 860, 410, 990, 380, 990, 560, -40, 560], '#5f7a68', rgba(PAL.teal0, 0.82), 1.7);
      // long painted cloud bands, the kind that sit still in an old background
      for (let i = 0; i < 4; i++) {
        const cy = 118 + i * 34, a = 0.16 + i * 0.03;
        paint(x, sub([-40, cy, 160, cy - 8, 330, cy + 3, 500, cy - 6, 680, cy + 2, 860, cy - 5, 1000, cy + 1, 1000, cy + 14, 860, cy + 9, 680, cy + 16, 500, cy + 7, 330, cy + 15, 160, cy + 5, -40, cy + 12], 5), rgba(PAL.cream, a), null, 0, 1);
      }
      // the cliff mass
      const mass = [360, 112, 404, 92, 452, 118, 500, 88, 556, 108, 612, 76, 674, 98, 736, 70, 800, 94, 866, 60, 930, 82, 990, 58, 990, 732, 500, 732, 486, 692, 500, 652, 470, 614, 486, 566, 462, 526, 476, 478, 448, 428, 462, 376, 432, 334, 446, 286, 410, 252, 422, 204, 388, 176, 396, 144];
      const mg = x.createLinearGradient(380, 100, 700, 720);
      mg.addColorStop(0, '#9a7a48'); mg.addColorStop(0.42, '#7d6638'); mg.addColorStop(0.78, '#54603f'); mg.addColorStop(1, '#394b3f');
      paint(x, mass, mg, '#3a2f22', 3.1);
      // a deep teal shadow down the broken left face
      paint(x, [396, 144, 422, 204, 410, 252, 446, 286, 432, 334, 462, 376, 448, 428, 476, 478, 462, 526, 486, 566, 470, 614, 500, 652, 486, 692, 500, 732, 380, 732, 392, 560, 376, 430, 392, 300], 'rgba(30,62,55,.34)', null, 0, 1);
      // strata, clipped inside the cliff
      x.save(); pathIn(x, mass, true); x.clip();
      for (let i = 0; i < 9; i++) {
        const y0 = 145 + i * 58, k = i % 3;
        const pts = [370, y0, 500, y0 - 16, 640, y0 + 7, 780, y0 - 20, 920, y0 + 3, 1000, y0 - 10, 1000, y0 + 26, 920, y0 + 26, 780, y0 + 4, 640, y0 + 32, 500, y0 + 10, 370, y0 + 22];
        paint(x, pts, k === 0 ? 'rgba(72,102,84,.38)' : k === 1 ? 'rgba(211,170,99,.28)' : 'rgba(143,102,51,.24)', 'rgba(50,42,30,.42)', 1.5);
      }
      // vertical cracks and moss
      for (let i = 0; i < 22; i++) crack(x, rr(400, 940), rr(100, 620), rr(390, 960), rr(160, 700), 'rgba(55,43,30,.42)', rr(0.6, 1.5));
      for (let i = 0; i < 16; i++) blob(x, rr(430, 950), rr(480, 710), rr(18, 60), rr(10, 30), PAL.teal1, 0.18, 9);
      dots(x, 380, 100, 610, 620, 900, PAL.ochre4, 0.12, 0.4, 1.2);
      x.restore();
      // foreground path and shelf
      paint(x, [-40, 620, 120, 598, 260, 606, 400, 630, 510, 616, 560, 650, 560, 740, -40, 740], '#a8793f', PAL.ochre0, 2.4);
      paint(x, [-40, 668, 160, 650, 320, 668, 470, 655, 566, 690, 566, 740, -40, 740], '#8f6633', rgba(PAL.ochre0, 0.9), 1.8);
      for (let i = 0; i < 30; i++) blob(x, rr(20, 540), rr(640, 730), rr(2, 12), rr(1, 5), i % 4 === 0 ? PAL.cream3 : PAL.ochre0, 0.35, 7);
      dry(x, 0, 690, 560, 690, 38, PAL.ochre0, 20, 0.12);
      // a heavy tree cropped by the frame, as the film's title card does
      x.save();
      paintLine(x, [-10, 740, 26, 560, 18, 360, 54, 150], PAL.teal0, 34, 0.95);
      paintLine(x, [24, 430, 96, 330, 142, 260], PAL.teal0, 14, 0.9);
      paintLine(x, [30, 300, 104, 210, 166, 178], PAL.teal0, 10, 0.9);
      for (let i = 0; i < 42; i++) {
        const px = rr(-40, 190), py = rr(60, 330);
        leaf(x, px, py, rr(8, 24), rr(14, 44), i % 4 === 0 ? PAL.teal1 : i % 3 ? PAL.olive1 : PAL.olive0, PAL.inkBlue, 0.94);
      }
      x.restore();
      // framing trees on the left
      tree(x, 54, 720, 1.05, PAL.teal0, PAL.olive1);
      tree(x, 142, 735, 0.82, PAL.teal1, PAL.olive2);
      tree(x, -8, 750, 1.18, PAL.teal0, PAL.olive0);
      // a near outcrop and boulders at the bottom right, to give the stage depth
      paint(x, sub([690, 732, 716, 672, 750, 642, 796, 650, 834, 678, 874, 704, 884, 732], 5), '#4f5f48', '#2a211a', 2.4);
      paint(x, sub([690, 732, 716, 686, 760, 702, 800, 728, 800, 732], 5), '#3c4d3f', '#2a211a', 1.8);
      for (const [bx, by, rx, ry] of [[620, 716, 24, 10], [664, 724, 18, 8], [850, 722, 30, 12]]) paint(x, pEll(bx, by, rx, ry, 0, TAU, 16), '#6b5a3d', '#2a211a', 1.6);
      // cave mouth
      const arch = [560, 640, 560, 500, 566, 458, 584, 424, 610, 405, 654, 405, 680, 424, 698, 458, 704, 500, 704, 640];
      paint(x, arch, PAL.ink, PAL.ochre0, 3.4);
      paint(x, [574, 640, 574, 504, 580, 466, 596, 438, 616, 422, 650, 422, 670, 438, 686, 466, 692, 504, 692, 640], '#17130f', '#5a4028', 1.8);
      // carved arch rings
      paintLine(x, [552, 646, 552, 496, 560, 450, 580, 414, 610, 394, 656, 394, 686, 414, 706, 450, 714, 496, 714, 646], PAL.ochre2, 3.2, 0.9, false);
      paintLine(x, [566, 646, 566, 500, 572, 462, 590, 428, 612, 412, 652, 412, 676, 428, 694, 462, 700, 500, 700, 646], PAL.ochre1, 1.6, 0.8, false);
      // small carved curls at the spring of the arch
      for (const q of [-1, 1]) {
        const cx = 610 + q * 46;
        for (let i = 0; i < 3; i++) { x.save(); x.strokeStyle = rgba(PAL.ochre2, 0.8); x.lineWidth = 1.4; x.beginPath(); x.arc(cx, 452, 6 + i * 5, 0.2, PI * 1.5); x.stroke(); x.restore(); }
      }
      // step
      paint(x, sub([540, 640, 722, 640, 734, 664, 528, 664], 5), PAL.ochre1, PAL.ochre0, 2);
      paint(x, sub([552, 662, 716, 662, 722, 682, 544, 682], 5), '#8f6633', PAL.ochre0, 1.6);
      // the numbered plaque, painted by hand
      paint(x, sub([724, 420, 766, 420, 766, 512, 724, 512], 4), '#4a3524', PAL.ochre3, 2.2);
      x.save(); x.fillStyle = PAL.cream; x.font = '21px "KaiTi","STKaiti",serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      ['第', '2', '窟'].forEach((c, i) => x.fillText(c, 745, 444 + i * 25)); x.restore();
      // grass and small red flowers at the threshold
      for (let i = 0; i < 26; i++) {
        const gx = rr(500, 760), gy = rr(650, 700);
        paintLine(x, [gx, gy, gx + rr(-8, 8), gy - rr(8, 26)], PAL.olive0, rr(0.8, 1.8), 0.85, false);
      }
      for (let i = 0; i < 7; i++) {
        const fx = rr(510, 760), fy = rr(652, 692);
        x.save(); x.fillStyle = PAL.rust2; x.globalAlpha = 0.85;
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.ellipse(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3, 2, a, 0, TAU); x.fill(); }
        x.fillStyle = PAL.gold2; x.beginPath(); x.arc(fx, fy, 1.6, 0, TAU); x.fill(); x.restore();
      }
      // warm edge of the door, even when closed
      paintLine(x, [574, 500, 574, 636], rgba(PAL.gold, 0.35), 2, 0.8, false);
      dry(x, 0, 0, w, 0, 0, '', 0, 0); // keep randomness stable for later plates
      dots(x, 0, 0, w, h, 420, PAL.ink, 0.05, 0.3, 1.1);
    });

    /* ---- 2. the mural wall inside cave 2 ---- */
    const PANEL = { x: 92, y: 142, w: 776, h: 404 };
    const GROUND = 470;
    const mural = () => plate('mural', (x, w, h) => {
      wash(x, 0, 0, w, h, [[0, '#081f1e'], [0.55, '#123532'], [1, '#061817']]);
      for (let i = 0; i < 34; i++) blob(x, rr(0, w), rr(0, h), rr(50, 190), rr(24, 110), i % 3 ? PAL.teal0 : PAL.teal1, 0.26, 9);
      for (let i = 0; i < 18; i++) crack(x, rr(0, w), rr(0, 80), rr(0, w), rr(80, h), 'rgba(15,28,26,.22)', rr(0.5, 1.1));
      dots(x, 0, 0, w, h, 900, PAL.cream, 0.05, 0.3, 1.2);
      // the painted panel
      const p = PANEL;
      paint(x, sub([p.x - 14, p.y - 14, p.x + p.w + 14, p.y - 14, p.x + p.w + 14, p.y + p.h + 14, p.x - 14, p.y + p.h + 14], 7), PAL.ochre1, PAL.ochre0, 2.6);
      paint(x, sub([p.x, p.y, p.x + p.w, p.y, p.x + p.w, p.y + p.h, p.x, p.y + p.h], 7), '#123a37', PAL.ochre3, 4.0);
      paint(x, sub([p.x + 12, p.y + 12, p.x + p.w - 12, p.y + 12, p.x + p.w - 12, p.y + p.h - 12, p.x + 12, p.y + p.h - 12], 7), '#284c44', PAL.ochre2, 2.2);
      // border pattern: little ochre diamonds
      for (let i = 0; i < 22; i++) {
        const dx = p.x + 22 + i * (p.w - 44) / 21;
        for (const yy of [p.y + 7, p.y + p.h - 7]) paint(x, [dx - 4, yy, dx, yy - 4, dx + 4, yy, dx, yy + 4], i % 2 ? PAL.ochre3 : PAL.rust2, null, 0, 0.9);
      }
      for (let i = 0; i < 10; i++) {
        const dy = p.y + 24 + i * (p.h - 48) / 9;
        for (const xx of [p.x + 7, p.x + p.w - 7]) paint(x, [xx - 4, dy, xx, dy - 4, xx + 4, dy, xx, dy + 4], i % 2 ? PAL.ochre3 : PAL.rust2, null, 0, 0.9);
      }
      // faint cloud / wave scrolls behind the figures
      x.save(); x.strokeStyle = 'rgba(190,210,180,.18)'; x.lineWidth = 3;
      for (let i = 0; i < 7; i++) {
        const cx = rr(p.x + 60, p.x + p.w - 60), cy = rr(p.y + 50, p.y + 250);
        x.beginPath(); x.arc(cx, cy, rr(18, 46), PI * 0.15, PI * 1.1); x.stroke();
        x.beginPath(); x.arc(cx + 26, cy + 10, rr(10, 26), PI * 1.1, PI * 1.9); x.stroke();
      }
      x.restore();
      // a faded mountain range and a pale sun behind the figures, the way a cave mural fills its field
      paint(x, [p.x + 30, 330, p.x + 150, 262, p.x + 250, 306, p.x + 350, 246, p.x + 450, 300, p.x + 560, 252, p.x + 680, 292, p.x + 746, 270, p.x + 746, 330], 'rgba(166,142,92,.24)', null, 0, 1);
      paint(x, [p.x + 30, 360, p.x + 170, 318, p.x + 300, 348, p.x + 430, 308, p.x + 570, 342, p.x + 690, 312, p.x + 746, 330, p.x + 746, 360], 'rgba(120,128,82,.20)', null, 0, 1);
      x.save(); x.fillStyle = 'rgba(206,172,104,.20)'; x.beginPath(); x.arc(p.x + 640, 232, 34, 0, TAU); x.fill(); x.restore();
      for (let i = 0; i < 6; i++) {
        const bx = p.x + 80 + i * 110, by = 214 + (i % 3) * 16;
        paintLine(x, [bx, by, bx + 8, by - 5], 'rgba(40,46,36,.20)', 1.1, 1, false);
        paintLine(x, [bx + 8, by - 5, bx + 16, by], 'rgba(40,46,36,.20)', 1.1, 1, false);
      }
      // the ground line of the painting
      paintLine(x, [p.x + 24, GROUND, p.x + p.w - 24, GROUND], rgba(PAL.ochre3, 0.65), 2, 1, false);
      dry(x, p.x + 24, GROUND + 2, p.x + p.w - 24, GROUND + 2, 12, PAL.ochre1, 10, 0.16);
      // aged flakes: patches of bare wall bitten out of the painting
      for (let i = 0; i < 26; i++) {
        const fx = rr(p.x + 20, p.x + p.w - 20), fy = rr(p.y + 20, p.y + p.h - 20);
        blob(x, fx, fy, rr(5, 26), rr(4, 16), i % 2 ? PAL.teal1 : PAL.teal0, 0.7, 8);
      }
      for (let i = 0; i < 8; i++) crack(x, rr(p.x + 20, p.x + p.w - 20), rr(p.y + 20, p.y + p.h - 20), rr(p.x + 20, p.x + p.w - 20), rr(p.y + 20, p.y + p.h - 20), 'rgba(20,30,26,.32)', rr(0.5, 1.0));
      // a warm pool of lantern light on the lower-left plaster
      x.save(); const lg = x.createRadialGradient(150, 610, 10, 150, 610, 260);
      lg.addColorStop(0, 'rgba(238,178,92,.16)'); lg.addColorStop(1, 'rgba(238,178,92,0)'); x.fillStyle = lg; x.fillRect(0, 380, 500, 340); x.restore();
      // dark at the edges of the gate
      x.save(); const vg = x.createRadialGradient(w / 2, h * 0.52, h * 0.24, w / 2, h * 0.52, h * 0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(3,10,9,.66)'); x.fillStyle = vg; x.fillRect(0, 0, w, h); x.restore();
    });

    /* ============================================================
       THE MURAL — flat paint on plaster, not cel characters.
       Heads are separate so they can turn at the last line.
       ============================================================ */
    const mFill = (pts, col, a = 0.92, lw = 1.5, stroke = rgba(PAL.ink, 0.62)) => S(pts, rgba(col, a), lw, stroke);
    const mLine = (pts, col = rgba(PAL.ink, 0.55), lw = 1.3) => line(pts, lw, col, { taper: 0.2 });

    function muralMonk(x, y, s = 1, p = {}) {
      const turn = p.turn || 0, look = p.look || 0, blink = p.blink || 0;
      push(); tr(x, y); scl(s);
      seed(710);
      // staff behind
      mLine([40, -202, 44, 4], rgba(PAL.ink, 0.5), 2.2);
      mFill(pEll(40, -210, 6, 6, 0, TAU, 12), PAL.ochre1, 0.8, 1);
      for (let i = 0; i < 2; i++) line(pEll(40, -210, 8 + i * 4, 8 + i * 4, 0, TAU, 18), 1.1, rgba(PAL.ochre2, 0.55), { taper: 0.1 });
      // the sutra pack on the back
      mFill(pRR(-44, -160, 34, 66, 8), PAL.ochre1, 0.92, 1.6);
      mLine([-44, -146, -10, -146], rgba(PAL.cream, 0.55), 1.4);
      mLine([-44, -128, -10, -128], rgba(PAL.cream, 0.4), 1.2);
      // robe
      mFill([-18, -150, 8, -156, 20, -132, 26, -56, 30, -4, -26, -4, -24, -60, -28, -128], PAL.cream2, 0.94, 1.8);
      // red kasaya over the left shoulder and across the body
      mFill([-16, -152, 10, -158, 22, -136, 10, -122, -4, -88, -26, -70, -30, -122], PAL.rust, 0.86, 1.5);
      mLine([-2, -122, 14, -92, 9, -42], rgba(PAL.rust2, 0.8), 2.2);
      mLine([-14, -118, -18, -70, -22, -12], rgba(PAL.ochre0, 0.35), 1.3);
      mLine([6, -118, 12, -70, 16, -12], rgba(PAL.ochre0, 0.3), 1.2);
      mLine([-20, -136, -26, -96, -22, -52], rgba(PAL.ochre0, 0.28), 1.2);
      mLine([-6, -132, -2, -90, 4, -46], rgba(PAL.cream, 0.3), 1.1);
      mLine([12, -128, 18, -88, 14, -44], rgba(PAL.ochre0, 0.22), 1.0);
      mLine([-16, -104, 12, -100], rgba(PAL.cream, 0.28), 1.0);
      S([8, -150, 20, -132, 26, -56, 16, -8, 8, -8, 10, -60, 2, -128], 'rgba(74,58,40,.16)', 0, 'rgba(0,0,0,0)');
      S([-18, -150, -8, -156, -24, -128, -28, -60, -24, -8, -16, -8, -20, -60, -26, -128], 'rgba(239,227,196,.16)', 0, 'rgba(0,0,0,0)');
      // feet
      mFill([-24, -8, -2, -8, 2, 2, -28, 2], PAL.ochre0, 0.9, 1.4);
      mFill([10, -8, 30, -8, 34, 2, 8, 2], PAL.ochre0, 0.9, 1.4);
      // lotus base
      mFill([-32, 1, 38, 1, 34, 10, -28, 10], PAL.ochre1, 0.82, 1.2);
      for (let i = 0; i < 5; i++) mFill(pEll(-26 + i * 14, 7, 9, 4, 0, TAU, 10), PAL.ochre2, 0.82, 1);
      // halo behind the head
      S(pEll(10, -168, 30, 34, 0, TAU, 24), 'rgba(201,162,74,.08)', 1.2, 'rgba(201,162,74,.22)');
      line(pEll(10, -168, 34, 38, 0, TAU, 24), 1.1, rgba(PAL.gold, 0.3), { taper: 0.1 });
      // head
      push(); tr(10, -168); rot(turn);
      mFill(pEll(0, 0, 15, 20, 0, TAU, 22), PAL.cream3, 0.95, 1.8);
      mFill(pEll(-2, -11, 14, 10, 0, TAU, 18), PAL.cream2, 0.55, 0);
      // ear
      mFill(pEll(-13, 0, 5, 9, 0, TAU, 12), PAL.cream3, 0.9, 1.2);
      // profile: nose and chin
      mFill([13, -6, 23, 0, 13, 7], PAL.cream3, 0.95, 1.3);
      mFill(pEll(10, 15, 7, 5, 0, TAU, 12), PAL.cream3, 0.9, 1.1);
      // eye and brow
      if (blink < 0.5) { F(pEll(10 + look * 2, -3, 2.4, 3.2, 0, TAU, 10), rgba(PAL.ink, 0.8)); F(pEll(9.3 + look * 2, -4, 0.8, 1, 0, TAU, 6), rgba(PAL.cream, 0.8)); }
      else mLine([9, -3, 15, -2], rgba(PAL.ink, 0.6), 1.2);
      mLine([5, -10, 14, -12], rgba(PAL.ink, 0.55), 1.5);
      mLine([13, 7, 18, 8], rgba(PAL.ink, 0.5), 1.2);
      mLine([14, 12, 20, 12], rgba(PAL.ink, 0.45), 1.1);
      mLine([3, -14, 14, -16], rgba(PAL.ink, 0.5), 1.4);
      mFill([7, 19, 20, 15, 19, 34, 9, 31], PAL.cream3, 0.55, 0.7);
      mLine([9, 22, 18, 20], rgba(PAL.cream, 0.45), 1.0);
      pop();
      // staff hand and rosary
      mFill(pEll(-4, -92, 5, 5, 0, TAU, 10), PAL.cream3, 0.9, 1.1);
      for (let i = 0; i < 5; i++) F(pEll(4 + i * 4, -82 - i * 2, 2, 2, 0, TAU, 8), rgba(PAL.ochre2, 0.7));
      pop();
    }

    function muralHorse(x, y, s = 1, p = {}) {
      push(); tr(x, y); scl(s);
      seed(720);
      // four thin legs with a joint, hooves on the painted ground line
      for (const [hx, kx, fx] of [[-44, -49, -52], [-28, -32, -34], [30, 36, 38], [46, 51, 54]]) {
        mFill([hx - 7, -90, hx + 7, -88, kx + 4, -46, kx - 4, -46], PAL.ochre0, 0.92, 1.5);
        mLine([kx, -46, fx, -2], rgba(PAL.ink, 0.55), 2.8);
        F(pEll(kx, -44, 3.0, 3.0, 0, TAU, 8), rgba(PAL.ink, 0.4));
        mFill([fx - 4, -2, fx + 5, -2, fx + 5, 2, fx - 4, 2], PAL.ochre0, 0.92, 1.1);
        mLine([hx, -86, kx, -50], rgba(PAL.ochre0, 0.3), 1.2);
      }
      // body: a thin barrel, ribs showing a little
      mFill([-68, -110, -54, -124, -26, -130, 12, -128, 38, -118, 46, -104, 38, -92, 2, -86, -36, -90, -62, -100], PAL.ochre0, 0.92, 1.8);
      mFill([28, -120, 48, -114, 54, -98, 42, -88, 30, -94], PAL.ochre0, 0.92, 1.6);
      mFill([-70, -112, -82, -102, -76, -88, -60, -88, -56, -100], PAL.ochre0, 0.92, 1.6);
      S([-64, -104, -36, -96, 2, -92, 38, -100, 36, -108, 0, -100, -38, -110], 'rgba(143,102,51,.25)', 0, 'rgba(0,0,0,0)');
      S([-54, -122, -26, -128, 12, -126, 38, -116, 34, -110, 0, -118, -30, -120], 'rgba(239,227,196,.18)', 0, 'rgba(0,0,0,0)');
      mLine([-50, -108, -12, -118, 30, -112], rgba(PAL.ochre0, 0.35), 1.2);
      // neck and long head, facing right
      mFill([22, -124, 36, -166, 54, -184, 70, -172, 60, -138, 42, -108], PAL.ochre0, 0.92, 1.6);
      mFill([48, -188, 66, -194, 88, -190, 104, -180, 100, -170, 82, -164, 60, -168, 50, -176], PAL.ochre0, 0.94, 1.6);
      mFill([52, -192, 54, -202, 62, -194], PAL.ochre0, 0.85, 1.1); // near ear
      mFill([72, -194, 77, -204, 83, -193], PAL.ochre0, 0.85, 1.1); // far ear
      for (let i = 0; i < 5; i++) mLine([60 - i * 2, -190, 52 - i * 3, -176], rgba(PAL.ochre0, 0.5), 1.2); // forelock
      F(pEll(76, -181, 2.4, 2.6, 0, TAU, 8), rgba(PAL.ink, 0.72)); // eye
      F(pEll(99, -178, 1.8, 1.4, 0, TAU, 6), rgba(PAL.ink, 0.55)); // nostril
      F(pEll(77, -182, 0.8, 0.8, 0, TAU, 6), rgba(PAL.cream, 0.8));
      mLine([56, -170, 100, -176], rgba(PAL.ink, 0.45), 1.2); // mouth
      mFill([70, -188, 82, -186, 80, -172, 72, -174], PAL.cream2, 0.55, 0);
      mLine([86, -176, 60, -164, 34, -142], rgba(PAL.rust, 0.65), 1.8);
      // mane
      for (let i = 0; i < 12; i++) mLine([34 + i * 2, -164 + i * 3, 46 + i * 2, -152 + i * 3], rgba(PAL.rust, 0.58), 1.5);
      for (let i = 0; i < 12; i++) mLine([30 + i * 3, -170 + i * 2, 42 + i * 3, -156 + i * 2], rgba(PAL.ochre0, 0.45), 1.2);
      mLine([-50, -118, -12, -110, 28, -114], rgba(PAL.ochre0, 0.3), 1.4);
      mLine([-44, -102, -6, -96, 30, -100], rgba(PAL.ochre0, 0.22), 1.1);
      // tail
      mFill([-64, -116, -54, -110, -78, -96, -90, -70, -86, -52, -80, -56, -84, -72, -74, -94], PAL.ochre0, 0.9, 1.4);
      mLine([-58, -112, -80, -100, -88, -72, -80, -54], rgba(PAL.ink, 0.48), 2.2);
      for (let i = 0; i < 8; i++) mLine([-62 - i * 4, -108 + i * 3, -84 - i * 5, -78 + i * 5, -84 - i * 3, -56 + i * 2], rgba(PAL.ochre0, 0.3), 1.1);
      // red saddle blanket under the packs
      mFill([-46, -138, 22, -134, 26, -106, -40, -110], PAL.rust, 0.55, 1.2);
      mLine([-40, -126, 20, -122], rgba(PAL.cream, 0.25), 1.2);
      // the sutra packs
      mFill(pRR(-32, -154, 50, 30, 7), PAL.rust, 0.82, 1.4);
      mFill(pRR(12, -150, 30, 24, 6), PAL.cream2, 0.86, 1.4);
      mLine([-28, -140, 12, -140], rgba(PAL.cream, 0.55), 1.2);
      mLine([16, -140, 38, -140], rgba(PAL.ink, 0.3), 1);
      // reins
      mLine([62, -172, 18, -128, -18, -112], rgba(PAL.ink, 0.38), 1.1);
      pop();
    }

    function muralApe(x, y, s = 1, p = {}) {
      const turn = p.turn || 0, look = p.look || 0, grin = p.grin || 0;
      push(); tr(x, y); scl(s);
      seed(730);
      // tail: a long curl to the right
      mLine([24, -70, 54, -54, 64, -24, 52, -2, 34, -6], rgba(PAL.ink, 0.48), 3.4);
      // legs: furred thighs over thin shins, bent at the knee
      mFill([-18, -62, -4, -60, -10, -30, -18, -4, -26, -2, -24, -30], PAL.ochre0, 0.95, 1.6);
      mFill([4, -62, 18, -60, 16, -30, 10, -2, 2, -2, 4, -30], PAL.ochre0, 0.95, 1.6);
      mLine([-13, -34, -17, -6], rgba(PAL.ink, 0.55), 2.2);
      mLine([11, -34, 8, -6], rgba(PAL.ink, 0.55), 2.2);
      mFill([-34, -4, -12, -4, -10, 2, -36, 2], PAL.ochre0, 0.92, 1.2);
      mFill([2, -4, 26, -4, 28, 2, 0, 2], PAL.ochre0, 0.92, 1.2);
      for (let k = 0; k < 4; k++) { mLine([-30 + k * 5, -1, -30 + k * 5, 1], rgba(PAL.ink, 0.4), 0.9); mLine([6 + k * 5, -1, 6 + k * 5, 1], rgba(PAL.ink, 0.4), 0.9); }
      // hunched body, short tunic, a little belly
      mFill([-20, -132, 2, -140, 22, -128, 28, -96, 24, -58, 4, -50, -18, -56, -28, -96], PAL.ochre0, 0.9, 1.7);
      mFill([-30, -128, -18, -142, 0, -140, -8, -124, -22, -116], PAL.ochre0, 0.95, 1.5);
      mFill([-12, -130, 0, -136, 6, -56, -10, -56], PAL.cream2, 0.22, 0);
      mFill([-20, -126, 10, -132, 18, -100, 12, -64, -12, -58, -22, -96], PAL.rust, 0.48, 1.2);
      mLine([-16, -120, 12, -116], rgba(PAL.cream, 0.22), 1.1);
      S([-25, -126, -13, -131, -8, -62, -18, -55, -29, -97], 'rgba(82,50,30,.26)', 0, 'rgba(0,0,0,0)');
      S([3, -130, 20, -123, 24, -95, 16, -60, 4, -54, 1, -95], 'rgba(214,171,122,.18)', 0, 'rgba(0,0,0,0)');
      S([-26, -132, 0, -140, 24, -126, 18, -108, 2, -112, -16, -108], 'rgba(120,80,45,.30)', 0, 'rgba(0,0,0,0)');
      for (let i = 0; i < 8; i++) mLine([-24 + i * 7, -112, -22 + i * 7, -103 - (i % 2) * 3], rgba(PAL.ochre0, 0.45), 1.2);
      for (let i = 0; i < 12; i++) mLine([-26 + i * 4, -124 + (i % 3) * 6, -28 + i * 4, -112 + (i % 4) * 4], rgba(PAL.ochre0, 0.28), 1.0);
      S([16, -128, 28, -96, 24, -58, 10, -52, 14, -96], 'rgba(80,48,28,.22)', 0, 'rgba(0,0,0,0)');
      S([-20, -130, -6, -136, -10, -110, -20, -108], 'rgba(239,227,196,.12)', 0, 'rgba(0,0,0,0)');
      for (let i = 0; i < 22; i++) mLine([-24 + i * 3, -122 + (i % 4) * 6, -26 + i * 3 + (i % 3), -70 + (i % 5) * 4], rgba(PAL.ochre0, 0.34), 1.1);
      mLine([-20, -90, 22, -88], rgba(PAL.ochre0, 0.35), 1.2);
      // belt
      mFill([-26, -76, 26, -74, 26, -64, -26, -66], PAL.rust, 0.82, 1.2);
      // long arms: the left hand rests on the staff, the right hangs
      mFill([-22, -126, -8, -120, -30, -100, -42, -76, -48, -78, -38, -104, -26, -128], PAL.ochre0, 0.94, 1.5);
      mFill([14, -124, 26, -118, 40, -100, 40, -68, 32, -68, 34, -98, 20, -120], PAL.ochre0, 0.94, 1.5);
      mLine([-34, -104, -42, -80], rgba(PAL.ink, 0.45), 1.4);
      mLine([30, -102, 34, -72], rgba(PAL.ink, 0.45), 1.4);
      mFill(pEll(-42, -76, 5, 6, 0, TAU, 10), PAL.cream3, 0.9, 1.1);
      mFill(pEll(34, -68, 5, 6, 0, TAU, 10), PAL.cream3, 0.9, 1.1);
      for (let k = 0; k < 3; k++) { mLine([-45 + k * 3, -78 + k, -48 + k * 3, -70 + k], rgba(PAL.ink, 0.45), 1.0); mLine([31 + k * 3, -70 + k, 28 + k * 3, -62 + k], rgba(PAL.ink, 0.45), 1.0); }
      // staff leaning across the body
      mLine([-58, -196, 28, -104], rgba(PAL.ink, 0.56), 3.2);
      mFill(pEll(-60, -200, 8, 8, 0, TAU, 14), PAL.gold, 0.8, 1.2);
      // head, hunched forward to the left: a monkey's face, not a man's
      push(); tr(-18, -152); rot(turn);
      // dark fur skull and a ruff of cheek fur
      mFill(pEll(0, -1, 19, 16, 0, TAU, 24), PAL.ochre2, 0.96, 1.7);
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.15 + i * 0.09);
        const px = Math.cos(a) * 18, py = Math.sin(a) * 15 - 1;
        mFill([px - 4, py + 2, px + 2, py - 7, px + 5, py + 4], PAL.ochre0, 0.9, 1.0);
      }
      // ears, large and furred
      mFill(pEll(-14, -11, 9, 10, 0, TAU, 14), PAL.ochre0, 0.92, 1.3);
      mFill(pEll(-14, -11, 5, 6, 0, TAU, 10), PAL.cream3, 0.9, 1.0);
      mFill(pEll(12, -11, 8, 9, 0, TAU, 12), PAL.ochre0, 0.92, 1.2);
      mFill(pEll(12, -11, 4, 5, 0, TAU, 8), PAL.cream3, 0.9, 1.0);
      // pale face: a heart-shaped patch, wide at the brow, narrowing to the muzzle
      mFill([-12, -8, -3, -12, 7, -9, 11, -2, 8, 5, 2, 8, -7, 8, -14, 3], PAL.cream3, 0.96, 1.5);
      // protruding muzzle, lower left
      mFill(pEll(-13, 5, 10, 8, 0, TAU, 18), PAL.cream2, 0.97, 1.3);
      mFill(pEll(-16, 3, 5, 4, 0, TAU, 12), PAL.cream3, 0.95, 1.0);
      // heavy brow ridge
      mFill([-16, -8, -3, -12, 7, -9, 6, -5, -4, -7, -14, -5], PAL.ochre0, 0.85, 1.2);
      mLine([-14, -6, -8, -8], rgba(PAL.ink, 0.35), 1.2);
      mLine([-5, -8, 4, -6], rgba(PAL.ink, 0.35), 1.2);
      // deep-set eyes under the brow
      F(pEll(-8, -2, 3.2, 3.6, 0, TAU, 10), rgba(PAL.ink, 0.9));
      F(pEll(-1, -2, 3.0, 3.4, 0, TAU, 10), rgba(PAL.ink, 0.9));
      F(pEll(-8.6 + look * 1.2, -3, 1.0, 1.2, 0, TAU, 6), rgba(PAL.cream, 0.9));
      F(pEll(-1.6 + look * 1.2, -3, 1.0, 1.2, 0, TAU, 6), rgba(PAL.cream, 0.9));
      // nostril and wide mouth on the muzzle
      F(pEll(-16, 3, 1.4, 1.1, 0, TAU, 6), rgba(PAL.ink, 0.6));
      F(pEll(-11, 3, 1.4, 1.1, 0, TAU, 6), rgba(PAL.ink, 0.6));
      if (grin > 0.2) {
        mFill([-22, 8, 0, 9, -2, 14, -20, 13], PAL.ink, 0.55, 0.9);
        mLine([-20, 10, -2, 10.5], rgba(PAL.cream, 0.75), 1.4);
      } else mLine([-21, 9, 0, 10], rgba(PAL.ink, 0.6), 1.4);
      // chin fur
      mLine([-18, 13, -4, 14], rgba(PAL.ochre0, 0.5), 1.2);
      // headband + a small tuft
      mFill([-18, -15, 14, -17, 15, -11, -18, -9], PAL.rust, 0.84, 1.1);
      mLine([-6, -17, -8, -24, -2, -21], rgba(PAL.ink, 0.55), 2.2);
      pop();
      // a small belt buckle instead of the old ring
      mFill([-18, -78, -12, -78, -12, -72, -18, -72], PAL.gold, 0.85, 1.0);
      pop();
    }

    const muralScene = (t, o = {}) => {
      const monkTurn = o.monkTurn || 0, apeTurn = o.apeTurn || 0, look = o.look || 0, grin = o.grin || 0;
      // painted ground shadows
      for (const [cx, r] of [[268, 70], [514, 86], [728, 64]]) S(pEll(cx, GROUND + 2, r, 7, 0, TAU, 20), 'rgba(42,33,26,.16)', 0, 'rgba(0,0,0,0)');
      muralMonk(268, GROUND, 1.16, { turn: monkTurn, look, blink: o.blink || 0 });
      muralHorse(514, GROUND, 1.0, {});
      muralApe(728, GROUND, 1.05, { turn: apeTurn, look, grin });
      // a few flakes of paint over the figures keep them on the wall
      for (let i = 0; i < 16; i++) F(pEll(160 + (i * 53) % 640, 190 + (i * 37) % 220, 9, 5, 0, TAU, 8), rgba(PAL.teal1, 0.25));
      // a warm pigment veil, as if the plaster has yellowed over the painting
      S([PANEL.x + 16, PANEL.y + 16, PANEL.x + PANEL.w - 16, PANEL.y + 16, PANEL.x + PANEL.w - 16, PANEL.y + PANEL.h - 16, PANEL.x + 16, PANEL.y + PANEL.h - 16], 'rgba(224,196,140,.055)', 0, 'rgba(0,0,0,0)');
    };

    /* ============================================================
       THE CAST — three invented archaeologists, 1953.
       Flat cel colour, a soot line, a hard cel shadow, rubber limbs.
       ============================================================ */
    const CAST = [
      { coat: '#6f7b72', coatS: '#4f5b54', trouser: '#4b4036', boot: '#2f2721', skin: '#d6ab7a', skinS: '#b9895c', cap: '#5a4a3a', capS: '#40342a', scarf: '#a94c35', hat: 'cap', lantern: true },
      { coat: '#a8793f', coatS: '#7d5528', trouser: '#3f4a44', boot: '#2b2822', skin: '#dfb98a', skinS: '#c09263', cap: '#3f4a44', capS: '#2c3531', shirt: '#d8c9a2', hat: 'glasses', satchel: '#6b4a2f' },
      { coat: '#7a5a45', coatS: '#5a3f30', trouser: '#4a4a3a', boot: '#2d2a22', skin: '#c99563', skinS: '#a9774a', cap: '#3a352a', capS: '#28251c', shirt: '#cfc09a', hat: 'brim', pick: true },
    ];
    function lantern(x, y, s = 1, glow = 1) {
      push(); tr(x, y); scl(s);
      F(pEll(0, 2, 34, 30, 0, TAU, 20), rgba('#f7c46a', 0.10 * glow));
      F(pEll(0, 2, 21, 19, 0, TAU, 18), rgba('#f7c46a', 0.16 * glow));
      F(pEll(0, 2, 12, 11, 0, TAU, 14), rgba('#ffe0a0', 0.38 * glow));
      S(pRR(-8, -13, 16, 24, 3), PAL.gold, 1.4, rgba(PAL.ink, 0.8));
      F(pRR(-5.5, -10, 11, 18, 2), rgba('#ffd98a', 0.95 * glow));
      line(pEll(0, -16, 7, 5, PI, TAU, 8), 1.3, rgba(PAL.ink, 0.8), { taper: 0.2 });
      line(pLine(-8, 9, 8, 9, 3), 1, rgba(PAL.ink, 0.7));
      pop();
    }
    /* ---------------- the walk cycle ----------------
       One full cycle per stride: each foot has a stance (planted on the ground,
       it does not move while the body travels over it) and a swing (lifted,
       carried forward to the next plant). The body x is driven from outside;
       the phase must advance one cycle per stride length travelled — then a
       planted foot can never slide.
    */
    const footStep = (ph, L, lift, r) => {
      let u = ph % 1; if (u < 0) u += 1;
      if (u < r) return { x: L * (0.5 - u), y: 0 };          // planted: sweeps back exactly with the body's travel
      const k = (u - r) / (1 - r), sw = (1 - Math.cos(Math.PI * k)) / 2;
      return { x: L * (0.5 - r) + L * r * sw, y: -lift * Math.sin(Math.PI * k) };
    };
    /* a bird in flight, one flap per stride of its own; dark silhouette */
    function bird(x, y, s = 1, ph = 0) {
      push(); tr(x, y); scl(s);
      const flap = Math.sin(ph);
      S(spl([-9, 0, -2, -3, 2, -2, 9, 0, 4, 2, -1, 1, -5, 2], true, 4), '#232019', 1.2, '#232019');
      for (const q of [-1, 1]) {
        const wy = -2 - flap * (3 + Math.abs(q));
        S([q * 6, -1, q * 16, wy, q * 22, wy + 3 + flap * 2, q * 9, 2], '#232019', 1, '#232019');
      }
      S([-4, 1, -9, 3, -8, 5, -3, 3], '#232019', 1, '#232019');
      pop();
    }
    /* a startled rabbit: one squat hop pose, placed by the caller */
    function rabbit(x, y, s = 1, stretch = 0, dir = -1) {
      push(); tr(x, y); scl(s * dir, s);
      seed(771);
      cel([-16, 0, -14, -10, -6, -14, 2, -13, 8, -8, 12, -2, 14, 4, 6, 6, -10, 6], '#8f6a48', '#6f4c32', -3, 2, 1.6);
      S(spl([-12, -8, -4, -12, 6, -11, 10, -7], true, 3), '#8f6a48', 1.2);
      S(spl([-14, -18, -8, -26, 0, -24, 8, -20], true, 4), '#8f6a48', 1.4);
      S(spl([-16, -17, -10, -25, -2, -23, 6, -19], true, 3), '#b98a63', 1.1);
      S(pEll(8, -8, 2, 2, 0, TAU, 8), '#232019', 0.9);
      S(pEll(12, -6, 1.6, 1.4, 0, TAU, 6), '#6f4c32', 0.9);
      F(pEll(-14, -4, 2.4, 1.6, 0, TAU, 6), '#e2d0a8');
      pop();
    }
    function arch(x, y, s = 1, p = {}, dir = 1, id = 0) {
      const C = CAST[id % 3];
      const walk = p.walk == null ? 1 : p.walk;
      const stop = p.stop || 0;                       // 0 walking → 1 stopped
      const L = (p.L || 17) * (1 - 0.45 * stop);      // the last strides shorten
      const lift = (p.lift == null ? 9 : p.lift) * (1 - 0.3 * stop);
      const r = 0.56;                                 // stance fraction of the cycle
      const ph = p.ph || 0;
      const lean = (p.lean || 0) * (1 - 0.38 * stop);
      const face = (p.face || 0) * (0.55 + 0.45 * stop);   // head turns to the cave as they stop
      const look = p.look || 0, lookY = p.lookY || 0;
      const armAmp = (p.armAmp == null ? 12 : p.armAmp) * walk;
      // arms swing opposite to the same-side leg; slight overlap (elbow lags)
      const arm = (k) => Math.sin(TAU * (ph + k) + Math.PI);
      const backArm = arm(0.5), frontArm = arm(0);
      // legs: same phase, half a cycle apart
      const back = footStep(ph + 0.5, L, lift, r);
      const front = footStep(ph, L, lift, r);
      // the body rides over the planted feet: it dips when a foot plants
      const bob = -2.2 * walk * Math.abs(Math.sin(TAU * 2 * (ph - 0.06))) * (1 - 0.4 * stop);
      const settle = (p.settle || 0);
      const bobY = bob - settle * 1.6;
      const knee = settle * 9;
      const nod = (p.nod || 0) * walk;
      const pushArm = p.push || 0;
      const build = id === 1 ? 1.16 : id === 2 ? 1.10 : 1.0, tall = id === 1 ? 0.94 : id === 2 ? 1.0 : 1.04;
      push(); tr(x, y + bobY); scl(s * dir * build, s * tall);
      seed(500 + id * 37);
      // ---- the far (back) leg and arm first, so the body covers them ----
      const baY = -58 - Math.max(0, backArm) * 7 * walk - Math.sin(TAU * (ph + 0.5)) * 1.5 * walk;
      limb(-9, -88, -14 + backArm * armAmp, baY, -6, 9, 6, C.coatS, 2.1);
      F(pEll(-15 + backArm * armAmp, baY + 1, 4.5, 5, 0, TAU, 10), C.skin);
      if (C.lantern && (p.lantern == null ? 1 : p.lantern) && pushArm > 0.5) lantern(-7, -47, 0.82, 1);
      limb(-5, -47, back.x, back.y, 5 + knee, 11, 7, id === 1 ? '#363f39' : C.trouser, 2.2);
      S(spl([back.x - 8, back.y, back.x - 8, back.y - 7, back.x + 2, back.y - 8, back.x + 9, back.y - 4, back.x + 9, back.y + 1, back.x - 8, back.y + 1], true, 3), C.boot, 1.5);
      // ---- torso ----
      push(); tr(0, -48); rot(lean * 0.02); scl(1, (1 - 0.07 * settle) * (1 + (p.breath || 0) * 0.018));
      const coatPts = [-15, 0, -13, -38, -10, -48, 0, -54, 11, -47, 14, -37, 17, 0, 10, 3, -9, 3];
      cel(coatPts, C.coat, C.coatS, -4, 4, 2.3);
      if (C.shirt) S([-7, -46, 1, -53, 9, -46, 5, -40, 1, -43, -3, -40], C.shirt, 1.2);
      else line([-7, -46, 1, -52, 8, -46], 1.6, rgba(PAL.ink, 0.7), { taper: 0.2 });
      for (let i = 0; i < 3; i++) F(pEll(2, -37 + i * 9, 1.1, 1.1, 0, TAU, 6), rgba(PAL.ink, 0.7));
      line(pLine(-14, -8, 16, -8, 4), 2, rgba(PAL.ink, 0.55));
      pop();
      // ---- front leg ----
      limb(3, -47, front.x, front.y, 4 + knee, 11, 7, C.trouser, 2.2);
      S(spl([front.x - 8, front.y, front.x - 8, front.y - 7, front.x + 2, front.y - 8, front.x + 9, front.y - 4, front.x + 9, front.y + 1, front.x - 8, front.y + 1], true, 3), C.boot, 1.5);
      // ---- head ----
      push(); tr(2, -96); rot(lean * 0.012 + nod * 0.05 * Math.sin(TAU * ph)); scl(1.08, 1.06);
      push(); rot(face * 0.24); tr(0, lookY * -2.5);
      const hx = 4, hy = -17;
      S(pRR(-2, -6, 10, 10, 2), C.skin, 1.4);
      const head = [hx - 14, hy - 10, hx - 8, hy - 22, hx + 4, hy - 24, hx + 14, hy - 16, hx + 18, hy - 8, hx + 29, hy - 5, hx + 21, hy + 3, hx + 13, hy + 8, hx + 12, hy + 15, hx + 2, hy + 19, hx - 10, hy + 12, hx - 14, hy + 2];
      cel(head, C.skin, C.skinS, -3, 3, 2.3);
      S(pEll(hx - 12, hy - 1, 4, 6, 0, TAU, 10), C.skin, 1.3);
      const wide = p.eyeWide || 0;
      const er = (id === 1 ? 4.2 : 3.7) * (1 + wide * 0.38);
      eye40(hx + 10, hy - 5, er, er * 1.05, look, lookY, p.blink ? 0 : 1, { p: Math.max(0.26, 0.42 - wide * 0.14), w: 1.3, lid: C.skinS, white: '#f4e8cc' });
      const browUp = p.browUp || 0;
      line([hx + 4, hy - 12 - (p.brow || 0) * 2 + browUp * 3.2, hx + 15, hy - 13 - (p.brow || 0) * 2 + browUp * 4.6], 1.8, rgba(PAL.ink, 0.8), { taper: 0.2 });
      if (browUp > 0.3) line([hx + 9, hy - 8, hx + 13, hy - 8], 1, rgba(PAL.ink, 0.35), { taper: 0.2 });
      const mo = p.mo == null ? 0.26 : p.mo;
      mouth40(hx + 14, hy + 8, 4.2, mo, (p.sm || 0), { lw: 1.2, dim: 0, teeth: p.teeth ? 0.3 : 0 });
      if (C.hat === 'cap') {
        cel([hx - 15, hy - 16, hx - 6, hy - 26, hx + 8, hy - 26, hx + 17, hy - 18, hx + 17, hy - 12, hx + 24, hy - 10, hx + 22, hy - 6, hx + 4, hy - 9, hx - 14, hy - 8], C.cap, C.capS, -3, 2, 1.6);
      } else if (C.hat === 'brim') {
        cel([hx - 22, hy - 15, hx - 10, hy - 25, hx + 8, hy - 24, hx + 18, hy - 15, hx + 30, hy - 12, hx + 28, hy - 6, hx + 4, hy - 8, hx - 22, hy - 8], C.cap, C.capS, -3, 2, 1.5);
      } else {
        cel([hx - 14, hy - 14, hx - 6, hy - 24, hx + 8, hy - 24, hx + 15, hy - 15, hx + 13, hy - 10, hx - 13, hy - 9], '#3a332a', '#28231c', -2, 2, 1.3);
        line(pEll(hx + 10, hy - 4, 7, 7, 0, TAU, 20), 1.2, rgba(PAL.ink, 0.7), { closed: true });
        line(pLine(hx + 17, hy - 4, hx + 22, hy - 5, 2), 1, rgba(PAL.ink, 0.6));
        F(pEll(hx + 10, hy - 4, 6, 6, 0, TAU, 18), rgba('#cfe0d8', 0.22));
      }
      if (C.scarf) {
        S([hx - 8, hy + 14, hx + 3, hy + 16, hx + 1, hy + 27, hx - 7, hy + 29], C.scarf, 1.3);
        line([hx - 2, hy + 27, hx + 5, hy + 40], 4.5, C.scarf, { taper: 0.4 });
      }
      const rim = p.rim || 0;
      if (rim > 0.02) {
        F([hx + 16, hy - 14, hx + 22, hy - 10, hx + 21, hy - 2, hx + 17, hy + 4, hx + 13, hy - 2], rgba('#f2c47a', 0.30 * rim));
        F([14, -34, 20, -20, 18, -6], rgba('#f2c47a', 0.18 * rim));
        F([-10, -30, -6, -16], rgba('#f2c47a', 0.10 * rim));
      }
      pop(); pop();
      // ---- front arm ----
      let handX, handY;
      if (pushArm > 0.02) {
        handX = lerp(24 + frontArm * armAmp, 48, pushArm);
        handY = lerp(-58 + Math.max(0, frontArm) * 5 * walk, -86, pushArm);
      } else {
        handX = 24 + frontArm * armAmp;
        handY = -58 + Math.max(0, frontArm) * 5 * walk;
      }
      limb(10, -86, handX, handY, 6, 9, 6, C.coat, 2.1);
      if (pushArm > 0.5) {
        F(pEll(handX + 2, handY + 1, 4.5, 5, 0, TAU, 10), C.skin);
        for (let i = 0; i < 3; i++) line([handX + 2, handY + 3 + i * 1.6, handX + 7 + i, handY + 1 + i * 1.4], 1.4, C.skin, { taper: 0.3 });
      } else {
        F(pEll(handX + 2, handY + 1, 4.5, 5, 0, TAU, 10), C.skin);
      }
      if (C.satchel) {
        line([8, -86, 18, -62], 2.4, C.satchel, { taper: 0.2 });
        S(pRR(10, -62, 18, 15, 3), C.satchel, 1.4);
      }
      if (C.pick) {
        line([-18, -92, 30, -138], 2.4, '#6b4a2f', { taper: 0.2 });
        line([18, -132, 42, -146], 2.2, '#4a3a2c', { taper: 0.2 });
      }
      if (C.lantern && (p.lantern == null ? 1 : p.lantern) && pushArm <= 0.5) lantern(handX + 8, handY + 10, 0.82, 1);
      pop();
    }

    const archSil = (x, y, s = 1, id = 0, glow = 1) => {
      // a back-lit archaeologist for the reverse shot: shoulders, neck, head, hat, a single warm rim
      push(); tr(x, y); scl(s);
      seed(900 + id * 13);
      const dark = 'rgba(20,16,12,.98)', rim = `rgba(230,180,100,${0.30 * glow})`;
      // coat / shoulders
      S(spl([-48, -82, -34, -94, 0, -98, 34, -94, 48, -82, 58, 40, -58, 40], true, 5), dark, 1.6, dark);
      // neck
      S(pRR(-10, -112, 20, 22, 3), dark, 1.2, dark);
      // head
      S(pEll(0, -128, 27, 33, 0, TAU, 26), dark, 1.5, dark);
      // hats / hair: three different skull-lines so the three backs read apart
      if (id === 0) {
        S(spl([-30, -146, -22, -160, 10, -164, 29, -152, 31, -144, 12, -148, -26, -140], true, 4), dark, 1.3, dark);
        S([-38, -146, 32, -148, 34, -140, -40, -138], dark, 1.2, dark); // cap brim
      } else if (id === 2) {
        S(spl([-46, -146, -8, -158, 30, -150, 48, -140, 44, -133, 4, -143, -42, -136], true, 4), dark, 1.3, dark); // wide brim
        S(spl([-22, -150, -4, -168, 20, -160, 24, -148, -2, -152], true, 4), dark, 1.2, dark);
      } else {
        S(spl([-29, -146, -16, -160, 12, -160, 28, -146, 24, -140, -24, -140], true, 4), dark, 1.3, dark); // short hair
        // round spectacles catch a little light
        line(pEll(12, -128, 9, 9, 0, TAU, 18), 1.2, 'rgba(230,190,120,.16)', { closed: true });
      }
      // a single rim along the lamp side
      line([-38, -150, -46, -86, -54, 30], 2.4, rim, { taper: 0.35 });
      line([-26, -158, -30, -146], 1.8, `rgba(240,207,122,${0.45 * glow})`, { taper: 0.2 });
      // collar
      line([-20, -92, 0, -84, 20, -92], 1.6, 'rgba(70,54,38,.8)', { taper: 0.2 });
      pop();
    };

    /* ============================================================
       DOOR — one leaf on the outer wall; it swings inward on the word 推开
       ============================================================ */
    const door = (t, openAt = 2.95, dur = 0.95) => {
      const q = clamp((t - openAt) / dur, 0, 1), e = q * q * (3 - 2 * q);
      if (e > 0.01) {
        // the light coming out of the cave
        F([566, 500, 698, 500, 840, 690, 500, 690], rgba('#f2be66', 0.20 * e));
        F([574, 512, 692, 512, 800, 670, 540, 670], rgba('#f7d48a', 0.18 * e));
        F(pEll(636, 540, 92, 86, 0, TAU, 24), rgba('#ffd98a', 0.18 * e));
        F([586, 500, 680, 500, 680, 640, 586, 640], rgba('#ffcf7a', 0.22 * e));
      }
      const hx = 564, hy = 394, w0 = 136, h0 = 242;
      const a = e * 1.42;
      const w = w0 * Math.cos(a), ex = hx + w, ey = hy + 12 * Math.sin(a);
      // an arched plank door: straight jambs and a semicircular head
      const leaf = [hx, ey + h0, hx, ey + 42, hx + w * 0.16, ey + 10, hx + w * 0.5, ey, hx + w * 0.84, ey + 10, ex, ey + 42, ex, ey + h0];
      // the leaf's shadow on the threshold
      F([hx, ey + h0, ex, ey + h0, ex + 18, ey + h0 + 16, hx + 8, ey + h0 + 14], rgba(PAL.ink, 0.24));
      S(sub(leaf, 6), '#6b4a2f', 2.2, rgba(PAL.ink, 0.8));
      // planks, projected with the leaf (they stop under the arch)
      for (let i = 1; i < 5; i++) {
        const u = i / 5, x0 = hx + w * u;
        line([x0, ey + 36 + Math.sin(u * Math.PI) * 12, x0, ey + h0], 1.1, rgba(PAL.ink, 0.55), { taper: 0.1 });
      }
      // two iron bands and a studded handle
      for (const yy of [ey + 56, ey + 184]) line([hx + 2, yy, ex - 2, yy], 5, '#3f3024', { taper: 0.1 });
      for (let i = 0; i < 6; i++) F(pEll(hx + 12 + i * 18, ey + 56, 1.6, 1.6, 0, TAU, 6), rgba(PAL.ochre3, 0.7));
      F(pEll(hx + 22, ey + 132, 5.5, 5.5, 0, TAU, 10), rgba(PAL.gold, 0.8));
      // carved inner line following the arch
      line([hx + 8, ey + h0 - 6, hx + 8, ey + 44, hx + w * 0.2, ey + 18, hx + w * 0.5, ey + 9, hx + w * 0.8, ey + 18, ex - 8, ey + 44, ex - 8, ey + h0 - 6], 1.2, rgba(PAL.ochre3, 0.45), { taper: 0.2 });
      // a warm rim on the free edge
      line([ex, ey, ex, ey + h0], 1.8, rgba('#f0cf7a', 0.4 * (0.3 + e)), { taper: 0.2 });
      return e;
    };

    G.lib.lao = { PAL, PANEL, GROUND, plates: PL, cliff, mural, door, arch, archSil, muralScene, muralMonk, muralHorse, muralApe, lantern, shadow, rgba, bird, rabbit, footStep };
    return G;
  };
})();
