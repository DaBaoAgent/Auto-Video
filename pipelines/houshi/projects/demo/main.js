// houshi · 后室 · 黄墙走廊的夜班
// 一条黄墙走廊，灯管一段一段亮着。夜班的人推着清洁车，从近处走向走廊尽头，
// 经过一根接触不良的灯管时，整条走廊闪了一下。最后一扇门开了一条缝。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;
const VP = [960, 520];
const FAR = { x0: 812, y0: 452, x1: 1108, y1: 632 };

function rectAt(d) {
  return {
    x0: lerp(0, FAR.x0, d), y0: lerp(0, FAR.y0, d),
    x1: lerp(W, FAR.x1, d), y1: lerp(H, FAR.y1, d),
  };
}
function pAt(d, u, v) {
  // u,v ∈ [0,1] 在走廊截面里的相对位置
  const r = rectAt(d);
  return [lerp(r.x0, r.x1, u), lerp(r.y0, r.y1, v)];
}

function corridor(c, t) {
  // 墙色
  const wallL = c.createLinearGradient(0, 0, 760, 0);
  wallL.addColorStop(0, '#7d5a2c'); wallL.addColorStop(.6, '#a97b38'); wallL.addColorStop(1, '#8a6230');
  c.fillStyle = wallL;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(FAR.x0, FAR.y0); c.lineTo(FAR.x0, FAR.y1); c.lineTo(0, H); c.fill();
  const wallR = c.createLinearGradient(W, 0, 1160, 0);
  wallR.addColorStop(0, '#7d5a2c'); wallR.addColorStop(.6, '#a97b38'); wallR.addColorStop(1, '#8a6230');
  c.fillStyle = wallR;
  c.beginPath(); c.moveTo(W, 0); c.lineTo(FAR.x1, FAR.y0); c.lineTo(FAR.x1, FAR.y1); c.lineTo(W, H); c.fill();
  // 地面
  const fl = c.createLinearGradient(0, 660, 0, H);
  fl.addColorStop(0, '#4a4438'); fl.addColorStop(.5, '#6a6354'); fl.addColorStop(1, '#8b8372');
  c.fillStyle = fl;
  c.beginPath(); c.moveTo(0, H); c.lineTo(FAR.x0, FAR.y1); c.lineTo(FAR.x1, FAR.y1); c.lineTo(W, H); c.fill();
  // 天花
  const ce = c.createLinearGradient(0, 0, 0, 460);
  ce.addColorStop(0, '#2a2620'); ce.addColorStop(1, '#4c4438');
  c.fillStyle = ce;
  c.beginPath(); c.moveTo(0, 0); c.lineTo(FAR.x0, FAR.y0); c.lineTo(FAR.x1, FAR.y0); c.lineTo(W, 0); c.fill();
  // 砖缝与墙裙
  c.strokeStyle = 'rgba(60,40,16,.35)'; c.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const v = .12 + i * .14;
    const A = pAt(0, 0, v), B = pAt(1, 0, v);
    c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke();
    const A2 = pAt(0, 1, v), B2 = pAt(1, 1, v);
    c.beginPath(); c.moveTo(...A2); c.lineTo(...B2); c.stroke();
  }
  // 墙裙线
  c.strokeStyle = 'rgba(40,28,12,.5)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(...pAt(0, 0, .80)); c.lineTo(...pAt(1, 0, .80)); c.stroke();
  c.beginPath(); c.moveTo(...pAt(0, 1, .80)); c.lineTo(...pAt(1, 1, .80)); c.stroke();
  // 地砖缝
  c.strokeStyle = 'rgba(30,26,20,.28)'; c.lineWidth = 1.6;
  for (let i = 0; i < 12; i++) {
    const d = 1 - Math.pow(1 - i / 12, 2.2);
    const A = pAt(d, 0, 1), B = pAt(d, 1, 1);
    c.beginPath(); c.moveTo(...A); c.lineTo(...B); c.stroke();
  }
  for (let i = 1; i < 9; i++) {
    const u = i / 9;
    c.beginPath(); c.moveTo(...pAt(0, u, 1)); c.lineTo(...pAt(1, u, 1)); c.stroke();
  }
}

function door(c, d, side, open) {
  const u = side === 'L' ? 0 : 1;
  const d2 = d + .045 * (1 - d * .5);
  const A = pAt(d, u, .93), A2 = pAt(d, u, .30);
  const B = pAt(d2, u, .93), B2 = pAt(d2, u, .30);
  const wopen = open || 0;
  c.save();
  // 门框
  c.fillStyle = '#33240f';
  c.beginPath(); c.moveTo(A[0], A[1] - 4); c.lineTo(A2[0], A2[1] - 4); c.lineTo(B2[0], B2[1] - 4); c.lineTo(B[0], B[1] - 4);
  c.lineTo(B[0], B[1] + 6); c.lineTo(B2[0], B2[1] + 6); c.lineTo(A2[0], A2[1] + 6); c.lineTo(A[0], A[1] + 6); c.fill();
  // 门板（带透视）
  const grad = c.createLinearGradient(A[0], 0, B[0], 0);
  grad.addColorStop(0, '#7d5c2f'); grad.addColorStop(1, '#5c4423');
  c.fillStyle = grad;
  const sh = (B[0] - A[0]) * .16 * wopen;
  c.beginPath();
  c.moveTo(A[0], A2[1]); c.lineTo(B[0], B2[1]); c.lineTo(B[0] - sh, B[1]); c.lineTo(A[0] - sh, A[1]); c.fill();
  // 门缝里透出来的光
  if (wopen > .02) {
    c.fillStyle = 'rgba(255,242,196,.95)';
    c.beginPath(); c.moveTo(A[0], A2[1]); c.lineTo(A[0] - sh, A2[1]); c.lineTo(A[0] - sh, A[1]); c.lineTo(A[0], A[1]); c.fill();
    FILM.glow(c, A[0] - sh * .5, (A[1] + A2[1]) / 2, Math.max(40, (A[1] - A2[1]) * .7), '#ffe9a8', .30 * wopen);
    // 光洒到地上的一片
    const F1 = pAt(d + .02, u, 1), F2 = pAt(d + .16, u === 0 ? .45 : .55, 1);
    const lg2 = c.createLinearGradient(A[0], A[1], F2[0], F2[1]);
    lg2.addColorStop(0, `rgba(255,238,180,${.34 * wopen})`); lg2.addColorStop(1, 'rgba(255,238,180,0)');
    c.fillStyle = lg2;
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(F2[0] - 60, F2[1]); c.lineTo(F2[0] + 60, F2[1]); c.lineTo(B[0], B[1]); c.fill();
  }
  // 把手
  c.fillStyle = '#d8b062';
  c.beginPath(); c.arc(B[0] - (B[0] - A[0]) * .14 - sh, (A[1] + A2[1]) / 2 + 6, 4, 0, 7); c.fill();
  // 门牌
  c.fillStyle = 'rgba(30,24,14,.75)';
  c.fillRect(B2[0] + 4, B2[1] - 26, Math.max(10, (B[0] - A[0]) * .5), 18);
  c.restore();
}
function tube(c, d, t, flick) {
  const r = rectAt(d);
  const y = r.y0 + (r.y1 - r.y0) * .04;
  const x0 = lerp(r.x0, r.x1, .3), x1 = lerp(r.x0, r.x1, .7);
  const h = (r.y1 - r.y0) * .045;
  c.save();
  c.fillStyle = 'rgba(30,26,20,.9)'; c.fillRect(x0 - 8, y - h * .5 - 4, x1 - x0 + 16, h + 8);
  c.fillStyle = `rgba(255,248,218,${.35 + .6 * flick})`;
  c.fillRect(x0, y - h * .28, x1 - x0, h * .56);
  c.restore();
  FILM.glow(c, (x0 + x1) / 2, y, (x1 - x0) * .9, '#ffe9b0', .30 * flick);
  // 地上的一片反光
  const fp = pAt(d, .5, 1);
  const gg = c.createRadialGradient(fp[0], fp[1], 2, fp[0], fp[1], (x1 - x0) * .55);
  gg.addColorStop(0, `rgba(255,240,190,${.30 * flick})`); gg.addColorStop(1, 'rgba(255,240,190,0)');
  c.fillStyle = gg;
  c.beginPath(); c.ellipse(fp[0], fp[1] + 10, (x1 - x0) * .5, 34, 0, 0, 7); c.fill();
}

function cart(c, d, phase) {
  const P = (u, v) => pAt(d, u, v);
  const s = lerp(1.0, .42, d); // 尺度
  const base = P(.40, 1);
  const w = 150 * s;
  c.save();
  // 桶
  c.fillStyle = '#2f6b64'; c.strokeStyle = 'rgba(220,240,235,.35)'; c.lineWidth = 2;
  c.beginPath(); c.roundRect(base[0] - w, base[1] - 110 * s, w * .9, 110 * s, 6); c.fill(); c.stroke();
  c.fillStyle = 'rgba(120,190,180,.5)'; c.fillRect(base[0] - w + 6, base[1] - 100 * s, w * .9 - 12, 18 * s);
  // 桶把手
  c.strokeStyle = '#9aa8a4'; c.lineWidth = 5 * s;
  c.beginPath(); c.moveTo(base[0] - w + 4, base[1] - 110 * s); c.lineTo(base[0] - w + 4, base[1] - 140 * s); c.stroke();
  // 推杆
  c.strokeStyle = '#7d8a86'; c.lineWidth = 6 * s;
  c.beginPath(); c.moveTo(base[0] + w * .1, base[1] - 90 * s); c.quadraticCurveTo(base[0] + w * .5, base[1] - 150 * s, base[0] + w * .62, base[1] - 88 * s); c.stroke();
  // 轮子
  c.fillStyle = '#1c1c1a';
  c.beginPath(); c.arc(base[0] - w * .85, base[1] - 4, 12 * s, 0, 7); c.fill();
  c.beginPath(); c.arc(base[0] + w * .1, base[1] - 4, 12 * s, 0, 7); c.fill();
  // 拖把
  c.strokeStyle = '#b08c5a'; c.lineWidth = 5 * s;
  const mAng = Math.sin(phase) * .10;
  c.save(); c.translate(base[0] + w * .62, base[1] - 88 * s); c.rotate(mAng);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 120 * s); c.stroke();
  c.fillStyle = '#d9d2c2';
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.ellipse(i * 4 * s, 124 * s, 3.5 * s, 16 * s, i * .1, 0, 7); c.fill(); }
  c.restore();
  c.restore();
}

function worker(c, d, t, phase) {
  const P = pAt(d, .62, 1);
  const s = lerp(1.0, .42, d);
  FILM.person(c, {
    x: P[0], y: P[1], h: 320 * s, face: -1,
    fill: '#252a32', rim: 'rgba(255,226,170,.55)', rimW: 2,
    coat: 'long', hat: 'cap',
    pose: {
      armL: [0.16, 0.42], armR: [-0.30, 0.36],
      legL: [Math.sin(phase) * .18, 0.10], legR: [-Math.sin(phase) * .18, 0.10],
      lean: -.03, bob: Math.abs(Math.sin(phase)) * .02,
    },
  });
  // 手里的手电
  FILM.glow(c, P[0] - 70 * s, P[1] - 150 * s, 40 * s, '#ffdf9a', .35);
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#141008');
  const flick = .78 + .22 * Math.sin(t * 7.4) * (t > 3.6 && t < 5.2 ? .4 : 1) + (t > 4.0 && t < 4.35 ? -.45 : 0);
  corridor(c, t);
  // 门
  door(c, .34, 'L', 0);
  door(c, .58, 'L', 0);
  door(c, .30, 'R', 0);
  door(c, .62, 'R', soft((t - 7.6) / .9));
  // 灯管
  tube(c, .12, t, flick);
  tube(c, .30, t, .95 + .05 * Math.sin(t * 3));
  tube(c, .48, t, t > 4.0 && t < 4.3 ? .25 : .9);
  tube(c, .68, t, .85);
  tube(c, .88, t, .8);
  // 走近的人与车
  const d = lerp(.16, .62, soft((t - .6) / 8.4));
  const phase = t * 3.2;
  cart(c, d, phase);
  worker(c, d, t, phase);
  // 空气里的尘
  const r = rng('dust');
  for (let i = 0; i < 60; i++) {
    const x = r() * W, y = 200 + r() * 700;
    c.fillStyle = `rgba(255,238,196,${.05 + r() * .10})`;
    c.beginPath(); c.arc(x + Math.sin(t * .6 + i) * 6, y + Math.cos(t * .5 + i) * 4, 1 + r() * 1.6, 0, 7); c.fill();
  }
  // 走廊尽头的光
  FILM.mist(c, 960, 540, 190, 120, '#ffe0a0', .10);
  // 录像带质感
  c.save(); c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgba(236,214,176,.10)'; c.fillRect(-60, -60, W + 120, H + 120); c.restore();
  FILM.scanlines(c, 4, .10);
  FILM.grain(c, .22, 31);
  FILM.vignette(c, { inner: .30, outer: .95, a: .66 });
  // 右上角时间码
  c.save();
  FILM.text(c, 'CAM 03  ·  02:1' + (Math.floor(t) % 10), { x: 1840, y: 92, align: 'right', size: 24, color: 'rgba(255,255,255,.62)', weight: 500, tracking: 2 });
  c.restore();
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });



