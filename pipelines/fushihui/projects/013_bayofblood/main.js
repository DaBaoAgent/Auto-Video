// Toward the Mountain · 山へ五景 — Ukiyo-e style demo
import { clamp, lerp, seg, ss, eio, eo, ei, hash, mulberry, TAU } from './lib.js';
import { W, H, FR, PAL, TX, mk, buildTextures, inkify, stampLayer, stampFn, drawSeal, cartouche, sealCanvas, rgba, poly, vtext } from './print.js';
import { VIEWS } from './views.js';
import { traveler } from './traveler.js';
import { waveGeo, fclaw } from './wave.js';
import { DUR, T, VO, SLOT, SW, GAP, REVEAL_DUR, q8 } from './story.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const QS = new URLSearchParams(location.search);
const NOSUB = QS.has('nosub');
const J = async f => { try { const r = await fetch(f); if (r.ok) return await r.json(); } catch (e) { } return null; };
const LINES = (await J('lines.json')) || [], DURS = (await J('voices/dur.json')) || {};
const LINE = Object.fromEntries(LINES.map(l => [l.id, l]));

await document.fonts.load('400 40px Yuji', '血之海滩湖畔夜浜一礼一九七一年铅黄名导巴瓦');
await document.fonts.load('500 40px Shippori', '你看过十三号星期五吗湖边营地戴面具的杰森');
await document.fonts.load('700 40px Shippori', 'Aa'); buildTextures();

// —— Subtitles (title-slip style) ——
export const SUBS = Object.entries(VO).map(([id, t0]) => { const d = DURS[id] ?? (LINE[id]?.text.length || 30) * .065; return { id, t0, t1: t0 + Math.max(1.8, d + .75), text: LINE[id]?.sub || LINE[id]?.text || '' }; });
SUBS.forEach((s, i) => { if (SUBS[i + 1] && s.t1 > SUBS[i + 1].t0 - .1) s.t1 = SUBS[i + 1].t0 - .1; });

// —— Colour block cache ——
const REG = [[0, 0], [2.2, -1.3], [-1.8, 1.9], [1.5, 2.2]];
const SHIFT = [[4, -5], [-6, 4], [5, 5], [-5, -4]];
const cache = new Map();
function layer(v, name) {
  const k = v.id + ':' + name; if (cache.has(k)) return cache.get(k);
  const d = v.layers[name], c = mk(), x = c.getContext('2d');
  d.draw(x); const hk = hash(k.length * 7.3 + k.charCodeAt(0)); inkify(c, { speck: d.speck ?? .3, grain: (d.grain || 0) * 1.7, gx: hk * 400 - 200, baren: d.baren ?? (d.g ? .38 : .12), bx: (hk - .5) * 300, by: (hash(hk) - .5) * 200 });
  cache.set(k, c); return c;
}
// ink-take progress of each block
function revFor(i, g, t) {
  const list = T.print[i];
  if (!list) return 1;
  return clamp((t - list[g]) / REVEAL_DUR);
}

// —— Title slip config (position in each picture) ——
const CART = [
  { x: 1660, y: 88, title: '一 湖畔の夜', seal: [1660, 0, '湖'], series: '血の浜' },
  { x: 120, y: 88, title: '二 血の浜', seal: [120, 0, '血'], series: '血の浜' },
  { x: 1560, y: 96, title: '三 一礼', seal: [1560, 0, '礼'], series: '血の浜' },
];
const CART_T = [T.cart.v1, T.cart.v2, T.cart.v3];

// —— Draw one sheet (picture i) ——
function drawSheet(i, t, M) {
  const v = VIEWS[i];
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  // paper
  if (i % 2) { ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); ctx.drawImage(TX.paper, 0, 0); ctx.restore(); } else ctx.drawImage(TX.paper, 0, 0);
  const blank = false;
  let borderDone = false;
  const border = () => {
    if (borderDone) return; borderDone = true;
    const r = revFor(i, 0, t); if (r <= 0) return;
    stampFn(ctx, x => { x.strokeStyle = PAL.sumi; x.lineWidth = 3.4; x.strokeRect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); x.lineWidth = 1.3; x.strokeRect(FR.x0 - 9, FR.y0 - 9, FR.x1 - FR.x0 + 18, FR.y1 - FR.y0 + 18); }, r, SHIFT[0]);
  };
  if (!blank) {
    ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip();
    const R = {
      L: name => { const g = v.layers[name].g; stampLayer(ctx, layer(v, name), revFor(i, g, t), REG[g], SHIFT[g]); },
      D: (g, fn) => { const r = revFor(i, g, t); if (r >= 1) { ctx.save(); ctx.translate(REG[g][0], REG[g][1]); fn(ctx); ctx.restore(); } else stampFn(ctx, fn, r, SHIFT[g]); },
      free: fn => { ctx.restore(); ctx.restore(); fn(ctx); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip(); },
      border: () => { ctx.restore(); border(); ctx.save(); ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip(); },
    };
    v.paint(ctx, t, R);
    ctx.restore();
    border();
    // title slip + seal
    const ct = CART_T[i], C = CART[i];
    if (ct && t > ct[0] || (ct && QS.has('cart'))) {
      const p = QS.has('cart') ? 1 : clamp((t - ct[0]) / .35), sp = QS.has('cart') ? 1 : clamp((t - ct[1]) / .3);
      stampFn(ctx, x => { const b = cartouche(x, C.x, C.y, C.title, { series: C.series }); C._b = b; }, p, [0, -14]);
      if (C._b) drawSeal(ctx, C.seal[2], C.x + (C.so ? C.so[0] : 0), C._b.y0 + C._b.h + (C.so ? C.so[1] : 58), 62, sp, { seed: i + 3, rot: (hash(i) - .5) * .06 });
    }
  }
  ctx.globalAlpha = 1; ctx.drawImage(TX.fiber, 0, 0);
  ctx.restore(); ctx.restore();
}

// —— Film title (a paper slip laid over the first picture, peeled off later) ——
function titleCard(t) {
  if (!QS.has('title') && (t < T.title[0] || t > T.title[1] + .6)) return;
  const a = QS.has('title') ? 1 : clamp((t - T.title[0]) / .3), out = QS.has('title') ? 0 : ss(seg(t, T.title[1], T.title[1] + .6));
  ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -out * 30);
  stampFn(ctx, x => {
    const b = cartouche(x, 170, 100, '山へ五景', { series: '', w: 104, size: 70, fill: '#f3e7c6' });
    // horizontal title slip
    const x0 = 250, y0 = 100, w = 720, h = 150;
    x.fillStyle = '#f3e7c6'; x.fillRect(x0, y0, w, h); x.fillStyle = PAL.beniL; x.fillRect(x0, y0 + h - 40, w, 40);
    x.strokeStyle = PAL.sumi; x.lineWidth = 3; x.strokeRect(x0, y0, w, h); x.lineWidth = 1.2; x.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
    x.lineWidth = 1.5; x.beginPath(); x.moveTo(x0 + 6, y0 + h - 40); x.lineTo(x0 + w - 6, y0 + h - 40); x.stroke();
    x.fillStyle = PAL.sumi; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 62px Shippori'; x.fillText('Toward the Mountain', x0 + w / 2, y0 + 58);
    x.font = '500 22px Shippori'; x.fillText('F I V E   V I E W S   O N   T H E   W A Y', x0 + w / 2, y0 + h - 20);
  }, a, [0, -12]);
  drawSeal(ctx, '山旅', 925, 300, 80, QS.has('title') ? 1 : clamp((t - T.title[0] - .45) / .3), { seed: 9, rot: .03 });
  ctx.restore();
}

// —— Camera (world coordinates = handscroll coordinates) ——
const C = i => [SLOT(i) + 960, 540];
const TOTAL = SLOT(0) + W;
const REP = [5.6, 13.0, 18.2];   // representative time each picture freezes at when pulling back
function camera(t) {
  let cx, cy, z = 1, rot = 0;
  const pan = (a, b, t0, t1) => { const u = eio(seg(t, t0, t1)); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
  if (t < T.pan12[0]) {
    // 一 · 湖畔の夜：极慢地往画心里推，别让镜头抢戏
    const u = ss(seg(t, T.v1[0], T.pan12[0]));
    [cx, cy] = C(0); cx += 26 * u; cy -= 30 * u; z = 1 + .035 * u;
  }
  else if (t < T.pan12[1]) {
    const u = eio(seg(t, ...T.pan12)); [cx, cy] = pan(C(0), C(1), ...T.pan12); z = 1 + .035 * (1 - u);
  }
  else if (t < T.pan23[0]) {
    const u = ss(seg(t, T.v2[0], T.pan23[0]));
    [cx, cy] = C(1); cx -= 20 * u; cy += 18 * u; z = 1 + .05 * u;
  }
  else if (t < T.pan23[1]) {
    const u = eio(seg(t, ...T.pan23)); [cx, cy] = pan(C(1), C(2), ...T.pan23); z = 1.05 - .05 * u;
  }
  else {
    // 三 · 一礼：最后慢慢抽开，整卷收在纸里
    const u = ss(seg(t, T.v3[0], T.v3[1]));
    [cx, cy] = C(2);
    const k = ss(seg(t, 19.4, 21.46)), zEnd = (W * .96) / (TOTAL + 300);
    z = Math.exp(lerp(Math.log(1 + .03 * u), Math.log(zEnd), eio(k)));
    cx = lerp(C(2)[0] + 10, (TOTAL - 120) / 2, eio(k)); cy = lerp(C(2)[1], 500, eio(k));
    rot = lerp(0, -.004, eio(k));
  }
  return { cx, cy, z, rot };
}
function camMatrix(cam) {
  const c = Math.cos(cam.rot) * cam.z, s = Math.sin(cam.rot) * cam.z;
  // screen = R*z*(world - center) + (W/2,H/2)
  return [c, s, -s, c, W / 2 - (c * cam.cx - s * cam.cy), H / 2 - (s * cam.cx + c * cam.cy)];
}

// —— Handscroll mounting paper and background ——
const BAND = [-430, 1510];
function drawScroll(M, t) {
  ctx.save(); ctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
  ctx.fillStyle = PAL.mount; ctx.fillRect(-60, BAND[0], TOTAL + 120, BAND[1] - BAND[0]);
  // mounting texture: tiled washi (darkened)
  ctx.globalAlpha = .55; ctx.globalCompositeOperation = 'multiply';
  for (let X = -60; X < TOTAL + 60; X += W) for (let Y = BAND[0]; Y < BAND[1]; Y += H) ctx.drawImage(TX.paper, X, Y);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  // thin borders top and bottom
  ctx.fillStyle = PAL.mountD; ctx.fillRect(-60, BAND[0], TOTAL + 120, 34); ctx.fillRect(-60, BAND[1] - 34, TOTAL + 120, 34);
  // roller at the left end (the unrolled part is wound on the left)
  const rx = -160, rw = 150;
  const g = ctx.createLinearGradient(rx, 0, rx + rw, 0); g.addColorStop(0, '#8f7a55'); g.addColorStop(.35, '#d8c69c'); g.addColorStop(1, '#8a744e');
  ctx.fillStyle = g; ctx.fillRect(rx, BAND[0] - 30, rw, BAND[1] - BAND[0] + 60);
  ctx.fillStyle = '#3a2a1c'; ctx.fillRect(rx + 30, BAND[0] - 120, rw - 60, 90); ctx.fillRect(rx + 30, BAND[1] + 30, rw - 60, 90);
  ctx.restore();
}

// —— Subtitles (screen space, horizontal title slip) ——
function subtitle(t) {
  const s = SUBS.find(s => t >= s.t0 - .05 && t < s.t1); if (!s) return;
  const a = clamp((t - s.t0 + .05) / .22), fo = 1 - clamp((t - (s.t1 - .25)) / .25);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.font = '500 40px NotoSerifSC';
  const lines = String(s.text).split('\n');
  const tw = Math.max(...lines.map(l => ctx.measureText(l).width));
  const lh = 56, h = 34 + lh * lines.length, w = tw + 168, x0 = (W - w) / 2, y0 = H - 60 - h;
  ctx.globalAlpha = fo;
  stampFn(ctx, x => {
    x.fillStyle = 'rgba(243,231,198,.96)'; x.fillRect(x0, y0, w, h);
    x.strokeStyle = PAL.sumi; x.lineWidth = 2.6; x.strokeRect(x0, y0, w, h); x.lineWidth = 1; x.strokeRect(x0 + 5, y0 + 5, w - 10, h - 10);
    x.fillStyle = PAL.sumi; x.textAlign = 'left'; x.textBaseline = 'middle'; x.font = '500 40px NotoSerifSC';
    lines.forEach((l, i) => x.fillText(l, x0 + 104, y0 + 17 + lh * (i + .5)));
  }, a, [0, 0]);
  const sc = sealCanvas('血', 38, { seed: 17 }); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = fo * a * .92; ctx.drawImage(sc, x0 + 30, y0 + h / 2 - sc.height / 2);
  ctx.restore();
}

// —— Breaking-wave white-out: claws burst from the lip and fill the screen; the white is the paper ——
function whiteout(t, M) {
  const c = seg(t, T.crash[0] - .15, T.crash[1]); if (c <= 0 || t >= T.ma[0]) return;
  const G = waveGeo(1, Math.pow(seg(t, T.fall[0], T.crash[1]), 1.5)), wx = SLOT(3) + G.tip[0] - 60, wy = G.tip[1] + 40;
  const sx = M[0] * wx + M[2] * wy + M[4], sy = M[1] * wx + M[3] * wy + M[5];
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const R = mulberry(9), e = Math.pow(c, 1.7), st = { fill: '#f4ecd6', ink: PAL.prusD, lw: 3 }, st2 = { fill: '#cfdde6', ink: PAL.prusD, lw: 2.6 };
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 16; i++) {
    const a = i / 16 * TAU + R() * .3 + pass * .2, len = (160 + R() * 220) * (.3 + e * 7), wid = (40 + R() * 40) * (.4 + e * 6);
    fclaw(ctx, sx + Math.cos(a) * 30, sy + Math.sin(a) * 30, a, len, wid, .9 + R() * .4, 2, pass ? st : st2, R);
  }
  const R2 = mulberry(11);
  for (let i = 0; i < 26; i++) { const a = R2() * TAU, d = (40 + R2() * 400) * (.3 + e * 3), r = (6 + R2() * 20) * (.5 + e * 5); ctx.fillStyle = '#f4ecd6'; ctx.beginPath(); ctx.arc(sx + Math.cos(a) * d, sy + Math.sin(a) * d, r, 0, TAU); ctx.fill(); ctx.strokeStyle = PAL.prusD; ctx.lineWidth = 2.4; ctx.stroke(); }
  if (c > .72) { ctx.globalAlpha = ss(clamp((c - .72) / .26)); ctx.drawImage(TX.paper, 0, 0); }
  ctx.restore();
}

// —— End card ——
function endCard(t) {
  const a = ss(seg(t, T.endcard, T.endcard + .8)); if (a <= 0) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  ctx.fillStyle = PAL.paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 64px Shippori'; ctx.fillText('Toward the Mountain', W / 2, 250);
  ctx.font = '400 34px Yuji'; ctx.fillText('山へ五景', W / 2, 318);
  ctx.font = '700 40px Shippori'; ctx.fillText('U K I Y O - E', W / 2, 790);
  ctx.font = '500 26px Shippori'; ctx.globalAlpha = a * .85; ctx.fillText('an Auto-Video demo', W / 2, 840);
  ctx.font = '500 30px Shippori'; ctx.globalAlpha = a; ctx.fillText('Auto-Video 样片', W / 2, 920);
  ctx.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); drawSeal(ctx, '山旅', W / 2 + 402, 250, 64, clamp((t - T.endcard - .5) / .3), { seed: 31, normal: true }); ctx.restore();
}

// —— Character test page ——
function testTrav(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(TX.paper, 0, 0);
  const poses = [['walk', 0], ['walk', .25], ['walk', .5], ['walk', .75]];
  poses.forEach(([m, ph], i) => traveler(ctx, 200 + i * 300, 520, 420, { mode: m, ph, t: ph, wind: 1 }));
  traveler(ctx, 1450, 520, 420, { mode: 'stand', t: 0, wind: 2, holdHat: true });
  traveler(ctx, 1750, 520, 420, { mode: 'walk', ph: .3, t: 0, mino: true, tilt: -.16 });
  traveler(ctx, 250, 1040, 420, { mode: 'sit', t: 0, cup: 0 }); traveler(ctx, 600, 1040, 420, { mode: 'sit', t: 0, cup: 1 });
  traveler(ctx, 1000, 1040, 420, { mode: 'back', t: 0, hatOff: 0 }); traveler(ctx, 1400, 1040, 420, { mode: 'back', t: 0, hatOff: 1 });
  ctx.drawImage(TX.fiber, 0, 0);
}
// —— Poster: great wave breaking out of the frame + film title slip ——
function poster() {
  renderFrame(28.1, true);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const b = cartouche(ctx, 120, 330, '山へ五景', { series: '', w: 110, size: 74 });
  const x0 = 196, y0 = 330, w = 760, h = 160;
  ctx.fillStyle = '#f3e7c6'; ctx.fillRect(x0, y0, w, h); ctx.fillStyle = PAL.beniL; ctx.fillRect(x0, y0 + h - 42, w, 42);
  ctx.strokeStyle = PAL.sumi; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, w, h); ctx.lineWidth = 1.2; ctx.strokeRect(x0 + 6, y0 + 6, w - 12, h - 12);
  ctx.fillStyle = PAL.sumi; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 66px Shippori'; ctx.fillText('Toward the Mountain', x0 + w / 2, y0 + 62);
  ctx.font = '500 22px Shippori'; ctx.fillText('A N   U K I Y O - E   F I L M   ·   F I V E   V I E W S', x0 + w / 2, y0 + h - 21);
  ctx.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); drawSeal(ctx, '山旅', 260, 570, 80, 1, { seed: 9 }); ctx.restore();
}
// —— Main render ——
function render(t) {
  if (QS.get('test') === 'trav') return testTrav(t);
  if (QS.has('poster')) return poster();
  renderFrame(t, NOSUB);
}
function renderFrame(t, nosub) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#161a22'; ctx.fillRect(0, 0, W, H);
  const cam = camera(t), M = camMatrix(cam);
  drawScroll(M, t);
  // visible sheets (coarse culling)
  const half = (W / 2) / cam.z * 1.6;
  for (let i = 0; i < 3; i++) {
    const x0 = SLOT(i); if (x0 + W < cam.cx - half || x0 > cam.cx + half) continue;
    const Mi = [M[0], M[1], M[2], M[3], M[4] + M[0] * x0, M[5] + M[1] * x0];
    drawSheet(i, t, Mi);
  }
  if (!nosub) subtitle(t);
}

// —— Events (foley / dialogue / music cues) ——
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const [id, t0] of Object.entries(VO)) add('vo', t0, { id });
  const P = T.print;
  P.forEach((list, i) => list.forEach((t, g) => { add('block', t - .12, { v: .45 + g * .12 }); add('baren', t, { d: .32, v: .6 + g * .08 }); }));
  for (const k of ['v1', 'v2', 'v3']) { add('slip', T.cart[k][0], { v: .45 }); add('seal', T.cart[k][1], { v: .85 }); }
  add('scroll', T.pan12[0], { d: T.pan12[1] - T.pan12[0], v: .7 });
  add('scroll', T.pan23[0], { d: T.pan23[1] - T.pan23[0], v: .75 });
  add('amb', 0.2, { w: 'night', d: T.pan12[1] - .2 });
  add('amb', T.pan12[1] - .2, { w: 'sea', d: DUR - T.pan12[1] + .2 });
  [19.0, 20.2].forEach(t => add('gust', t, { v: .6 }));
  return ev.sort((a, b) => a.t - b.t);
}

window.render = render; window.DUR = DUR; window.EV = events(); window.SUBS = SUBS;
render(parseFloat(QS.get('t') ?? '20'));
window.READY = true;
