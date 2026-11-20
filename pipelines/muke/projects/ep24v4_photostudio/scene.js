import { clamp, lerp, seg, ss, eio, mulberry, TAU } from './lib.js';

const BLK = '#14100d';
const RED = '#a12b20';

// ---------- carved strokes ----------
function cut(c, pts, w, rnd, amp = 2.2, split = 30) {
  c.strokeStyle = BLK; c.lineJoin = 'round'; c.lineCap = 'round';
  for (let pass = 0; pass < 2; pass++) {
    const a = pass ? amp * 1.8 : amp;
    c.beginPath();
    let first = true;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / split));
      for (let k = 0; k <= n; k++) {
        if (k === 0 && i > 0) continue;
        const u = k / n;
        const x = lerp(x0, x1, u) + (rnd() - .5) * a;
        const y = lerp(y0, y1, u) + (rnd() - .5) * a;
        if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y);
      }
    }
    c.lineWidth = pass ? w * .5 : w;
    c.stroke();
  }
}

function block(c, pts, rnd, amp = 3) {
  c.fillStyle = BLK;
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = pts[i][0] + (rnd() - .5) * amp, y = pts[i][1] + (rnd() - .5) * amp;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath(); c.fill();
}

function gouge(c, pts, w, rnd, amp = 2) {  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.strokeStyle = '#000'; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 24));
    for (let k = 0; k <= n; k++) {
      if (k === 0 && i > 0) continue;
      const u = k / n;
      const x = lerp(x0, x1, u) + (rnd() - .5) * amp, y = lerp(y0, y1, u) + (rnd() - .5) * amp;
      (i === 0 && k === 0) ? c.moveTo(x, y) : c.lineTo(x, y);
    }
  }
  c.lineWidth = w; c.stroke();
  c.restore();
}

// carve a white area out of a black mass
function erasePoly(c, pts, rnd, amp = 2) {
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = '#000';
  c.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = pts[i][0] + (rnd() - .5) * amp, y = pts[i][1] + (rnd() - .5) * amp;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath(); c.fill();
  c.restore();
}

function hatch(c, pts, ang, gap, w, rnd, amp = 1.6) {
  const path = new Path2D();
  path.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) path.lineTo(pts[i][0], pts[i][1]);
  path.closePath();
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  pts.forEach(p => { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
  const mx = (minx + maxx) / 2, my = (miny + maxy) / 2;
  const d = Math.hypot(maxx - minx, maxy - miny) * .62;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  c.save(); c.clip(path);
  c.strokeStyle = BLK; c.lineCap = 'butt';
  for (let o = -d; o <= d; o += gap) {
    const ox = mx + ca * o, oy = my + sa * o;
    c.beginPath();
    const x0 = ox - sa * d, y0 = oy + ca * d, x1 = ox + sa * d, y1 = oy - ca * d;
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const x = lerp(x0, x1, u) + (rnd() - .5) * amp, y = lerp(y0, y1, u) + (rnd() - .5) * amp;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.lineWidth = w; c.stroke();
  }
  c.restore();
}

function taper(c, x0, y0, x1, y1, w0, w1, rnd) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const g = () => (rnd() - .5) * 3;
  block(c, [
    [x0 + nx * w0 / 2 + g(), y0 + ny * w0 / 2 + g()],
    [x1 + nx * w1 / 2 + g(), y1 + ny * w1 / 2 + g()],
    [x1 - nx * w1 / 2 + g(), y1 - ny * w1 / 2 + g()],
    [x0 - nx * w0 / 2 + g(), y0 - ny * w0 / 2 + g()],
  ], rnd, 2);
}

function ring(c, x, y, r, w, rnd, amp = 1.4) {
  const n = Math.max(18, Math.round(r * .55));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
  }
  cut(c, pts, w, rnd, amp, 20);
}

// ---------- one frame ----------
export function paint(A, t, W, H) {
  const K = W / 1080;
  const rnd = mulberry(19970117);
  const cd = A.cd, cc = A.cc;

  // camera: slow push, settles a touch right of centre
  const zc = ss(seg(t, 2.2, 7.4));
  const sc = lerp(1.035, 1.085, zc);
  const camX = lerp(W * .50, W * .528, zc), camY = lerp(H * .47, H * .486, zc);
  A.xf(sc, W / 2 - camX * sc, H / 2 - camY * sc);

  // ---------- safelight ----------
  const bx = W * .862, by = H * .078;
  const pulse = .55 + .22 * Math.sin(t * 2.2);
  cc.save();
  const gr = cc.createRadialGradient(bx, by, 6 * K, bx, by, 190 * K);
  gr.addColorStop(0, 'rgba(161,43,32,' + (.52 * pulse).toFixed(3) + ')');
  gr.addColorStop(.45, 'rgba(161,43,32,' + (.20 * pulse).toFixed(3) + ')');
  gr.addColorStop(1, 'rgba(161,43,32,0)');
  cc.fillStyle = gr;
  cc.beginPath(); cc.arc(bx, by, 190 * K, 0, TAU); cc.fill();
  cc.fillStyle = 'rgba(161,43,32,.80)';
  cc.beginPath(); cc.arc(bx, by - 4 * K, 16 * K, 0, TAU); cc.fill();
  cc.restore();
  cut(cd, [[bx, 0], [bx, by - 22 * K]], 3 * K, rnd, 1.2);
  cut(cd, [[bx - 10 * K, by - 14 * K], [bx + 10 * K, by - 14 * K]], 3 * K, rnd, 1.2);

  // ---------- the print lying on the light box ----------
  const px0 = W * .105, px1 = W * .895, py0 = H * .197, py1 = H * .772;
  const PX = u => px0 + (px1 - px0) * u;
  const PY = v => py0 + (py1 - py0) * v;
  const PW = px1 - px0, PH = py1 - py0;

  // a real wooden frame around the print: band + grain + mitred corners
  const fr = 42 * K;
  const fx0 = px0 - fr, fx1 = px1 + fr, fy0 = py0 - fr, fy1 = py1 + fr;
  block(cd, [[fx0, fy0], [fx1, fy0], [fx1, fy1], [fx0, fy1]], rnd, 3);
  erasePoly(cd, [[px0, py0], [px1, py0], [px1, py1], [px0, py1]], rnd, 3);
  // grain, running along each band
  for (let i = 0; i < 26; i++) {
    const gx = fx0 + 14 * K + rnd() * (fx1 - fx0 - 28 * K);
    gouge(cd, [[gx, fy0 + 8 * K + rnd() * 8 * K], [gx + 18 * K + rnd() * 22 * K, fy0 + 10 * K + rnd() * 10 * K]], 1.6 * K, rnd, 1.2);
    gouge(cd, [[gx, fy1 - 14 * K - rnd() * 8 * K], [gx + 16 * K + rnd() * 20 * K, fy1 - 12 * K - rnd() * 10 * K]], 1.6 * K, rnd, 1.2);
  }
  for (let i = 0; i < 16; i++) {
    const gy = fy0 + 14 * K + rnd() * (fy1 - fy0 - 28 * K);
    gouge(cd, [[fx0 + 8 * K + rnd() * 8 * K, gy], [fx0 + 12 * K + rnd() * 10 * K, gy + 20 * K + rnd() * 24 * K]], 1.6 * K, rnd, 1.2);
    gouge(cd, [[fx1 - 12 * K - rnd() * 10 * K, gy], [fx1 - 8 * K - rnd() * 8 * K, gy + 18 * K + rnd() * 22 * K]], 1.6 * K, rnd, 1.2);
  }
  // mitre joints at the four corners
  [[fx0, fy0, 1, 1], [fx1, fy0, -1, 1], [fx1, fy1, -1, -1], [fx0, fy1, 1, -1]].forEach(([cxx, cyy, sx, sy]) => {
    gouge(cd, [[cxx + sx * 6 * K, cyy + sy * 6 * K], [cxx + sx * fr * .92, cyy + sy * fr * .92]], 2 * K, rnd, 1.4);
  });
  // bevel: a carved line just inside the band
  cut(cd, [[fx0 + 7 * K, fy0 + 7 * K], [fx1 - 7 * K, fy0 + 7 * K], [fx1 - 7 * K, fy1 - 7 * K], [fx0 + 7 * K, fy1 - 7 * K], [fx0 + 7 * K, fy0 + 7 * K]], 2 * K, rnd, 1.6);

  // print border + torn corner
  cd.save();
  cd.strokeStyle = BLK; cd.lineWidth = 3.2 * K;
  cd.strokeRect(px0 + 1.6 * K, py0 + 1.6 * K, PW - 3.2 * K, PH - 3.2 * K);
  cd.globalCompositeOperation = 'destination-out';
  cd.beginPath();
  cd.moveTo(px1 - PW * .16, py0);
  cd.lineTo(px1, py0);
  cd.lineTo(px1, py0 + PH * .10);
  cd.closePath(); cd.fill();
  cd.restore();
  cut(cd, [[px1 - PW * .16, py0 + 2 * K], [px1 - 2 * K, py0 + PH * .10]], 2.6 * K, rnd, 1.6);

  // ---------- what is inside the photograph ----------
  // studio backdrop: a rolled curtain on the right
  hatch(cd, [[PX(.60), PY(.05)], [PX(.99), PY(.03)], [PX(.99), PY(.62)], [PX(.60), PY(.60)]], .02, 26 * K, 1.6 * K, rnd, 1.2);
  cut(cd, [[PX(.60), PY(.04)], [PX(.585), PY(.62)]], 2.2 * K, rnd, 1.6);

  // mother
  const mx = PX(.315), my = PY(.275), mr = PW * .098;
  ring(cd, mx, my, mr, 3.6 * K, rnd, 1.6);
  // hair: a thick carved band over the top of the head + a bun behind
  const hairPts = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI * (1.02 + i * .095);
    hairPts.push([mx + Math.cos(a) * mr * .96, my + Math.sin(a) * mr * .96]);
  }
  cut(cd, hairPts, mr * .62, rnd, 2.2, 24);
  block(cd, [[mx - mr * .98, my - mr * .28], [mx - mr * 1.30, my + mr * .10], [mx - mr * 1.02, my + mr * .52], [mx - mr * .78, my + mr * .30]], rnd, 2);
  // brow, eye, nose, mouth, ear, jaw
  cut(cd, [[mx - mr * .44, my - mr * .28], [mx + mr * .12, my - mr * .34]], 2.8 * K, rnd, 1.4);
  cut(cd, [[mx - mr * .34, my - mr * .04], [mx + mr * .08, my - mr * .07]], 3.2 * K, rnd, 1.2);
  block(cd, [[mx - mr * .26, my - mr * .04], [mx - mr * .11, my - mr * .10], [mx - mr * .05, my + mr * .02]], rnd, 1.4);
  cut(cd, [[mx + mr * .10, my - mr * .12], [mx + mr * .15, my + mr * .14], [mx - mr * .01, my + mr * .20]], 2.4 * K, rnd, 1.2);
  cut(cd, [[mx - mr * .30, my + mr * .46], [mx + mr * .03, my + mr * .48]], 2.8 * K, rnd, 1.2);
  ring(cd, mx - mr * .78, my + mr * .10, mr * .14, 2.2 * K, rnd, 1.2);
  // the extra cuts that make a face: second brow, lid, nostril, philtrum, lower lip, jaw, ear
  cut(cd, [[mx - mr * .46, my - mr * .40], [mx + mr * .10, my - mr * .46]], 2 * K, rnd, 1.2);
  cut(cd, [[mx - mr * .36, my - mr * .14], [mx + mr * .05, my - mr * .17]], 1.8 * K, rnd, 1.2);
  block(cd, [[mx + mr * .04, my + mr * .08], [mx + mr * .12, my + mr * .07], [mx + mr * .11, my + mr * .15]], rnd, 1.2);
  cut(cd, [[mx - mr * .16, my + mr * .30], [mx - mr * .14, my + mr * .41]], 1.6 * K, rnd, 1.2);
  cut(cd, [[mx - mr * .30, my + mr * .57], [mx + mr * .01, my + mr * .56]], 2.2 * K, rnd, 1.2);
  cut(cd, [[mx - mr * .68, my + mr * .28], [mx - mr * .44, my + mr * .76], [mx - mr * .04, my + mr * .88]], 2 * K, rnd, 1.4);
  cut(cd, [[mx - mr * .80, my + mr * .06], [mx - mr * .70, my + mr * .22]], 1.4 * K, rnd, 1);
  gouge(cd, [[mx - mr * .90, my - mr * .58], [mx - mr * .28, my - mr * .70]], 2.4 * K, rnd, 1.4);
  gouge(cd, [[mx - mr * .76, my - mr * .30], [mx - mr * .30, my - mr * .40]], 1.6 * K, rnd, 1.2);
  hatch(cd, [[mx + mr * .20, my + mr * .22], [mx + mr * .72, my + mr * .12], [mx + mr * .62, my + mr * .70], [mx + mr * .12, my + mr * .62]], 1.1, 7 * K, 1.4 * K, rnd, 1.2);
  // neck and body
  block(cd, [
    [mx - mr * .34, my + mr * .86], [mx + mr * .12, my + mr * .86],
    [mx + mr * .18, my + mr * 1.58], [mx - mr * .38, my + mr * 1.58],
  ], rnd, 2.4);
  gouge(cd, [[mx - mr * .30, my + mr * 1.30], [mx + mr * .12, my + mr * 1.28]], 2 * K, rnd, 1.2);
  block(cd, [
    [mx - mr * 2.45, py1 - 4 * K],
    [mx - mr * 2.05, my + mr * 1.92],
    [mx - mr * .92, my + mr * 1.38],
    [mx + mr * .82, my + mr * 1.38],
    [mx + mr * 2.05, my + mr * 1.95],
    [mx + mr * 2.45, py1 - 4 * K],
  ], rnd, 3);
  // a white apron carved out of the black dress
  erasePoly(cd, [
    [mx - mr * .86, my + mr * 2.12],
    [mx + mr * .80, my + mr * 2.12],
    [mx + mr * 1.08, py1 - 18 * K],
    [mx - mr * 1.22, py1 - 18 * K],
  ], rnd, 3);
  hatch(cd, [
    [mx - mr * .78, my + mr * 2.20], [mx + mr * .72, my + mr * 2.20],
    [mx + mr * .98, py1 - 26 * K], [mx - mr * 1.12, py1 - 26 * K],
  ], .04, 15 * K, 1.5 * K, rnd, 1.2);
  // folds carved out of the dress
  gouge(cd, [[mx - mr * 1.35, my + mr * 2.35], [mx - mr * 1.50, py1 - 26 * K]], 3 * K, rnd, 2);
  gouge(cd, [[mx + mr * 1.32, my + mr * 2.35], [mx + mr * 1.45, py1 - 30 * K]], 3 * K, rnd, 2);
  gouge(cd, [[mx - mr * 2.05, my + mr * 2.8], [mx - mr * 2.15, py1 - 40 * K]], 2.4 * K, rnd, 2);

  // the child beside her
  const kx = PX(.685), ky = PY(.42), kr = mr * .66;
  ring(cd, kx, ky, kr, 3 * K, rnd, 1.4);
  const hair2 = [];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (1.05 + i * .11);
    hair2.push([kx + Math.cos(a) * kr * .94, ky + Math.sin(a) * kr * .94]);
  }
  cut(cd, hair2, kr * .58, rnd, 2, 18);
  cut(cd, [[kx - kr * .40, ky - kr * .10], [kx + kr * .10, ky - kr * .16]], 2.6 * K, rnd, 1.2);
  block(cd, [[kx - kr * .24, ky - kr * .12], [kx - kr * .10, ky - kr * .18], [kx - kr * .04, ky - kr * .04]], rnd, 1.4);
  cut(cd, [[kx - kr * .24, ky + kr * .42], [kx + kr * .04, ky + kr * .44]], 2.4 * K, rnd, 1.2);
  // his face: second brow, lid, nose, lip, jaw
  cut(cd, [[kx - kr * .38, ky - kr * .18], [kx + kr * .06, ky - kr * .22]], 1.8 * K, rnd, 1.2);
  cut(cd, [[kx - kr * .30, ky + kr * .04], [kx + kr * .02, ky + kr * .02]], 1.4 * K, rnd, 1.2);
  cut(cd, [[kx + kr * .06, ky + kr * .06], [kx + kr * .10, ky + kr * .18], [kx - kr * .02, ky + kr * .20]], 1.6 * K, rnd, 1.2);
  cut(cd, [[kx - kr * .28, ky + kr * .50], [kx + kr * .02, ky + kr * .50]], 1.6 * K, rnd, 1.2);
  cut(cd, [[kx - kr * .58, ky + kr * .20], [kx - kr * .36, ky + kr * .64], [kx - kr * .02, ky + kr * .72]], 1.6 * K, rnd, 1.2);
  gouge(cd, [[kx - kr * .62, ky - kr * .52], [kx - kr * .12, ky - kr * .58]], 1.8 * K, rnd, 1.2);
  block(cd, [
    [kx - kr * .30, ky + kr * .86], [kx + kr * .10, ky + kr * .86],
    [kx + kr * .14, ky + kr * 1.30], [kx - kr * .34, ky + kr * 1.30],
  ], rnd, 2);
  block(cd, [
    [kx - kr * 1.62, py1 - 4 * K],
    [kx - kr * 1.40, ky + kr * 1.55],
    [kx - kr * .50, ky + kr * 1.15],
    [kx + kr * .62, ky + kr * 1.20],
    [kx + kr * 1.55, ky + kr * 1.75],
    [kx + kr * 1.70, py1 - 4 * K],
  ], rnd, 3);
  erasePoly(cd, [
    [kx - kr * .62, ky + kr * 2.10],
    [kx + kr * .60, ky + kr * 2.10],
    [kx + kr * .86, py1 - 16 * K],
    [kx - kr * .92, py1 - 16 * K],
  ], rnd, 3);
  gouge(cd, [[kx - kr * .20, ky + kr * 1.6], [kx - kr * .30, py1 - 34 * K]], 2.4 * K, rnd, 2);
  gouge(cd, [[kx + kr * .95, ky + kr * 2.4], [kx + kr * 1.05, py1 - 40 * K]], 2.2 * K, rnd, 2);

  // age: two scratches on the print, and chisel marks in the big black masses
  for (let i = 0; i < 30; i++) {
    const dx = PX(.04 + rnd() * .92), dy = PY(.56 + rnd() * .40);
    gouge(cd, [[dx, dy], [dx + 7 * K + rnd() * 9 * K, dy + 2 * K + rnd() * 5 * K]], 1.3 * K, rnd, 1);
  }
  gouge(cd, [[PX(.12), PY(.16)], [PX(.46), PY(.11)]], 1.8 * K, rnd, 1.4);
  gouge(cd, [[PX(.50), PY(.88)], [PX(.90), PY(.82)]], 1.6 * K, rnd, 1.4);

  // ---------- the loupe, going over her face ----------
  const loupeA = ss(seg(t, 3.1, 3.9)) * (1 - ss(seg(t, 5.9, 6.3)));
  if (loupeA > .01) {
    const lx = lerp(PX(.16), PX(.55), ss(seg(t, 3.2, 6.0)));
    const ly = lerp(PY(.30), PY(.40), ss(seg(t, 3.2, 6.0))) + Math.sin(t * 3.1) * 4 * K;
    const lr = 118 * K;
    cd.save();
    cd.globalAlpha = loupeA;
    hatch(cd, [[lx - lr, ly - lr], [lx + lr, ly - lr], [lx + lr, ly + lr], [lx - lr, ly + lr]], .8, 9 * K, 2.4 * K, rnd, 1.2);
    cc.save(); cc.globalAlpha = loupeA;
    ring(cd, lx, ly, lr, 9 * K, rnd, 1.4);
    ring(cd, lx, ly, lr - 12 * K, 2 * K, rnd, 1.2);
    cut(cd, [[lx + lr * .95, ly + lr * .30], [lx + lr * 1.7, ly + lr * .95]], 8 * K, rnd, 1.6);
    cd.restore();
  }

  // ---------- the strip of prints he mended, laid out under the light box ----------
  const strip = [
    [W * .105, H * .800], [W * .365, H * .800], [W * .625, H * .800],
  ];
  const sw = W * .210, sh = H * .128;
  strip.forEach(([x, y], i) => {
    const a = ss(seg(t, 1.05 + i * .55, 1.65 + i * .55));
    if (a < .02) return;
    cd.save();
    cd.beginPath(); cd.rect(x - 10 * K, y - 10 * K, (sw + 20 * K) * a, sh + 20 * K); cd.clip();
    cd.strokeStyle = BLK; cd.lineWidth = 3.6 * K;
    cd.strokeRect(x, y, sw, sh);
    // a small mended portrait inside
    ring(cd, x + sw * .33, y + sh * .34, sh * .13, 2 * K, rnd, 1.2);
    block(cd, [
      [x + sw * .10, y + sh - 3 * K], [x + sw * .20, y + sh * .52],
      [x + sw * .46, y + sh * .50], [x + sw * .56, y + sh - 3 * K],
    ], rnd, 2);
    ring(cd, x + sw * .70, y + sh * .44, sh * .10, 1.8 * K, rnd, 1);
    block(cd, [
      [x + sw * .57, y + sh - 3 * K], [x + sw * .64, y + sh * .58],
      [x + sw * .80, y + sh * .58], [x + sw * .88, y + sh - 3 * K],
    ], rnd, 2);
    gouge(cd, [[x + sw * .08, y + sh * .18], [x + sw * .30, y + sh * .12]], 1.4 * K, rnd, 1);
    cd.restore();
  });
  // a small hand note in the lower corner
  cd.save();
  cd.fillStyle = BLK; cd.globalAlpha = ss(seg(t, 2.6, 3.2));
  cd.font = (46 * K).toFixed(0) + 'px MaShanZheng, serif';
  cd.fillText('修', W * .865, H * .945);
  cd.restore();

  // ---------- last beat: a carved page, three parts / seven parts ----------
  const cA = seg(t, 6.2, 6.9);
  if (cA > 0.001) {
    const wA = ss(cA);
    for (const c of [cd, cc]) {
      c.save();
      c.beginPath(); c.rect(0, H * (1 - wA), W, H * wA + 2); c.clip();
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);
      c.restore();
    }
    cut(cd, [[W * .085, H * .150], [W * .915, H * .146]], 2.4 * K, rnd, 1.6);
    cut(cd, [[W * .085, H * .858], [W * .915, H * .862]], 2 * K, rnd, 1.6);

    const tA = ss(seg(t, 6.95, 7.5)), tB = ss(seg(t, 7.3, 7.85));
    cd.fillStyle = BLK;
    cd.font = '700 ' + (232 * K).toFixed(0) + 'px Cormorant, serif';
    cd.globalAlpha = tA; cd.fillText('3', W * .215, H * .505);
    cd.globalAlpha = tB; cd.fillText('7', W * .615, H * .505);
    cd.globalAlpha = 1;

    cd.font = (104 * K).toFixed(0) + 'px MaShanZheng, serif';
    cd.globalAlpha = ss(seg(t, 7.45, 8.0));
    cd.fillText('拍', W * .245, H * .595);
    cd.fillText('修', W * .645, H * .595);
    cd.globalAlpha = 1;

    const barA = seg(t, 7.5, 8.4);
    if (barA > 0) {
      const y = H * .640, x0 = W * .135, x1 = W * .870;
      const xa = lerp(x0, x1, ss(barA) * .30), xb = lerp(xa, x1, ss(seg(t, 8.0, 9.15)));
      block(cd, [[x0, y], [xa, y], [xa, y + 30 * K], [x0, y + 30 * K]], rnd, 2);
      if (xb > xa + 6) {
        hatch(cd, [[xa + 4 * K, y], [xb, y], [xb, y + 30 * K], [xa + 4 * K, y + 30 * K]], .82, 8 * K, 2.2 * K, rnd, 1.2);
      }
      cd.save();
      cd.strokeStyle = BLK; cd.lineWidth = 2.4 * K;
      cd.beginPath(); cd.moveTo(x0, y - 8 * K); cd.lineTo(x1, y - 8 * K); cd.stroke();
      cd.restore();
    }

    // the sentence itself, in brush
    cd.save();
    cd.fillStyle = BLK;
    cd.textAlign = 'center';
    cd.globalAlpha = ss(seg(t, 8.35, 9.0));
    cd.font = (66 * K).toFixed(0) + 'px MaShanZheng, serif';
    cd.fillText('三分拍　七分修', W * .5, H * .755);
    cd.restore();

    const sA = ss(seg(t, 8.9, 9.4));
    if (sA > 0) {
      const sx = W * .842, syy = H * .815, sz = 62 * K;
      cc.save();
      cc.globalAlpha = sA * .92;
      cc.fillStyle = 'rgba(161,43,32,.86)';
      cc.fillRect(sx - sz / 2, syy - sz / 2, sz, sz);
      cc.fillStyle = 'rgba(252,248,238,.94)';
      cc.font = (44 * K).toFixed(0) + 'px MaShanZheng, serif';
      cc.textAlign = 'center'; cc.textBaseline = 'middle';
      cc.fillText('陆', sx, syy + 2 * K);
      cc.restore();
    }
  }
}
