// leida · 雷达扫描纪录片
// 1969 年 7 月 21 日，帕克斯 64 米天线在风暴里顶住，替全世界接住登月直播。
// 一个连续镜头：风暴里的碟面 → 提灯的人 → 控制室窗口 → 推进监视器 → 月面铺满画面。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { clamp, lerp, soft, rng, n1 } = FILM;

const CAM_KEYS = [
  { t: 0.0, x: 640, y: 590, z: 1.05 },
  { t: 2.2, x: 706, y: 606, z: 1.11, ease: soft },
  { t: 3.7, x: 836, y: 674, z: 1.04, ease: soft },
  { t: 5.1, x: 1120, y: 736, z: 1.02, ease: soft },
  { t: 6.6, x: 1740, y: 826, z: 1.16, ease: soft },
  { t: 7.8, x: 1712, y: 838, z: 1.70, ease: soft },
  { t: 8.5, x: 1710, y: 838, z: 1.86, ease: soft },
  { t: 9.5, x: 1710, y: 838, z: 1.98, ease: soft },
  { t: 10.0, x: 1710, y: 838, z: 2.05, ease: soft },
];

const DISH = { x: 690, y: 570, rx: 498, ry: 208, rot: -0.30 };

function flashAt(t, t0, dur) { return t >= t0 && t < t0 + dur ? Math.sin((t - t0) / dur * Math.PI) : 0; }

function drawSky(c, t) {
  c.fillStyle = FILM.vgrad(c, -400, 1300, [[0, '#23272a'], [.38, '#3b4145'], [.62, '#2a2e31'], [.86, '#121415'], [1, '#08090a']]);
  c.fillRect(-1400, -900, 5000, 3000);
  const r = rng('clouds');
  for (let i = 0; i < 10; i++) {
    const x = ((r() * 2800 + t * (24 + r() * 36)) % 2800) - 440;
    const y = 20 + r() * 470, rx = 450 + r() * 700, ry = 130 + r() * 190;
    FILM.mist(c, x, y, rx, ry, i < 4 ? '#0d1012' : '#5d6468', .11 + r() * .10);
  }
  // 云底那条亮缝：月亮藏在后面
  FILM.mist(c, 1300, 316, 760, 150, '#b0b8bc', .14);
  FILM.mist(c, 1370, 262, 250, 62, '#d4dade', .20);
}

function drawLightning(c, t) {
  const f1 = flashAt(t, 1.44, .14) + flashAt(t, 1.62, .07);
  const f2 = flashAt(t, 6.06, .10) + flashAt(t, 6.18, .06);
  const flash = Math.min(1, f1 + f2);
  if (flash <= 0) return;
  c.save();
  c.fillStyle = `rgba(226,234,240,${flash * .50})`;
  c.fillRect(0, 0, FILM.W, FILM.H);
  c.strokeStyle = `rgba(244,248,252,${flash})`;
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(880, 0); c.lineTo(856, 150); c.lineTo(884, 186); c.lineTo(838, 322); c.lineTo(866, 350); c.lineTo(812, 470);
  c.stroke();
  c.lineWidth = 1.7;
  c.beginPath(); c.moveTo(856, 150); c.lineTo(790, 210); c.lineTo(806, 252); c.stroke();
  c.beginPath(); c.moveTo(884, 186); c.lineTo(952, 238); c.lineTo(936, 282); c.stroke();
  c.restore();
}

function drawRainSheet(c, t) {
  FILM.rain(c, t, { n: 170, color: 'rgba(206,218,226,.26)', len: 24, speed: 720, slant: .28, seed: 5 });
  c.save(); c.globalAlpha = .055; c.strokeStyle = '#c8d2d8'; c.lineWidth = 6;
  const r = rng('sheet');
  for (let i = 0; i < 62; i++) {
    const x = (r() * 2600 + t * 280) % 2600 - 300, y = r() * 900;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 230, y + 560); c.stroke();
  }
  c.restore();
}

function drawGround(c, t) {
  c.fillStyle = '#090a0a';
  c.beginPath();
  c.moveTo(-300, 816);
  c.bezierCurveTo(420, 792, 900, 830, 1500, 808);
  c.bezierCurveTo(1760, 798, 1980, 814, 2400, 806);
  c.lineTo(2400, 1300); c.lineTo(-300, 1300); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(150,160,164,.22)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-100, 820); c.bezierCurveTo(520, 802, 1080, 834, 1800, 812); c.stroke();
  const r = rng('grass');
  c.strokeStyle = 'rgba(120,132,136,.26)'; c.lineWidth = 1.6;
  for (let i = 0; i < 90; i++) {
    const x = r() * 2400 - 200, y = 818 + r() * 200, hh = 6 + r() * 22;
    const bend = 8 + 10 * Math.sin(t * 3 + i);
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + bend * .4, y - hh * .6, x + bend, y - hh); c.stroke();
  }
  for (let i = 0; i < 7; i++) {
    const x = 180 + i * 330 + (i % 2) * 54, y = 936 + (i % 3) * 30;
    FILM.mist(c, x, y, 120 + i * 24, 22, '#8f9aa0', .10);
  }
}

function drawDish(c, t) {
  const vib = Math.sin(t * 19) * .0035 + Math.sin(t * 7.3) * .003;
  const rot = DISH.rot + vib;
  const gx = (x, y) => [DISH.x + x * Math.cos(rot) - y * Math.sin(rot), DISH.y + x * Math.sin(rot) + y * Math.cos(rot)];
  // 背后支撑塔
  c.fillStyle = '#0a0b0c';
  c.beginPath();
  c.moveTo(DISH.x - 48, 826); c.lineTo(DISH.x + 48, 826); c.lineTo(DISH.x + 30, 992); c.lineTo(DISH.x - 32, 992); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(160,170,176,.26)'; c.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const y = 842 + i * 31; c.beginPath(); c.moveTo(DISH.x - 46 + i * 3, y); c.lineTo(DISH.x + 46 - i * 3, y); c.stroke(); }
  // 碟背的桁架
  c.strokeStyle = '#0b0c0d'; c.lineWidth = 13;
  [[-330, 120, -110, 470], [330, 120, 110, 470], [0, 210, 0, 470]].forEach(([x1, y1, x2, y2]) => {
    const A = gx(x1, y1), B = [DISH.x + x2, DISH.y + y2];
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
  });
  c.strokeStyle = 'rgba(150,160,166,.30)'; c.lineWidth = 1.6;
  [[-330, 120, -110, 470], [330, 120, 110, 470], [0, 210, 0, 470]].forEach(([x1, y1, x2, y2]) => {
    const A = gx(x1, y1), B = [DISH.x + x2, DISH.y + y2];
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke();
  });
  // 撑索
  c.strokeStyle = 'rgba(140,150,156,.20)'; c.lineWidth = 1.6;
  c.beginPath(); c.moveTo(DISH.x - 130, 806); c.lineTo(240, 996); c.stroke();
  c.beginPath(); c.moveTo(DISH.x + 120, 800); c.lineTo(1160, 998); c.stroke();

  c.save();
  c.translate(DISH.x, DISH.y); c.rotate(rot);
  // 碟背面厚度
  c.fillStyle = '#080909';
  c.beginPath(); c.ellipse(6, 20, DISH.rx * 1.005, DISH.ry * .98, 0, 0, Math.PI * 2); c.fill();
  // 碟面
  const grad = c.createLinearGradient(-DISH.rx, -DISH.ry, DISH.rx * .8, DISH.ry);
  grad.addColorStop(0, '#3a3f42'); grad.addColorStop(.42, '#191c1d'); grad.addColorStop(1, '#070808');
  c.fillStyle = grad;
  c.beginPath(); c.ellipse(0, 0, DISH.rx, DISH.ry, 0, 0, Math.PI * 2); c.fill();
  // 内圈肋条
  for (let i = 1; i <= 7; i++) {
    c.strokeStyle = `rgba(150,160,166,${.11 - i * .007})`;
    c.lineWidth = i === 1 ? 2.2 : 1.2;
    c.beginPath(); c.ellipse(0, i * 8, DISH.rx * (1 - i * .12), DISH.ry * (1 - i * .12), 0, 0, Math.PI * 2); c.stroke();
  }
  c.strokeStyle = 'rgba(160,170,176,.10)';
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2;
    c.beginPath(); c.moveTo(0, 10); c.lineTo(Math.cos(a) * DISH.rx * .99, Math.sin(a) * DISH.ry * .99 + 10); c.stroke();
  }
  // 碟缘
  c.lineWidth = 13; c.strokeStyle = '#080909';
  c.beginPath(); c.ellipse(0, 0, DISH.rx, DISH.ry, 0, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 3.2; c.strokeStyle = 'rgba(196,206,212,.50)';
  c.beginPath(); c.ellipse(0, 0, DISH.rx - 4, DISH.ry - 4, 0, Math.PI * 1.02, Math.PI * 1.90); c.stroke();
  c.lineWidth = 1.4; c.strokeStyle = 'rgba(226,234,238,.38)';
  c.beginPath(); c.ellipse(0, 0, DISH.rx - 9, DISH.ry - 9, 0, Math.PI * 1.15, Math.PI * 1.7); c.stroke();
  // 馈源与三脚架
  const feedY = -116;
  c.strokeStyle = '#0c0e0f'; c.lineWidth = 9;
  [[-180, -30], [180, -30], [0, 148]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(0, feedY); c.stroke(); });
  c.fillStyle = '#191c1d';
  c.beginPath(); c.roundRect(-28, feedY - 52, 56, 66, 8); c.fill();
  c.strokeStyle = 'rgba(190,200,206,.42)'; c.lineWidth = 1.8;
  c.beginPath(); c.roundRect(-28, feedY - 52, 56, 66, 8); c.stroke();
  c.restore();
}

function drawTechnician(c, t) {
  const k = clamp((t - 3.2) / 1.7);
  if (k <= 0 || t > 6.4) return;
  const x = lerp(978, 1128, k);
  const ph = (t * 1.45) % 1;
  const h = 178;
  const y = 952;
  const bob = Math.abs(Math.cos(ph * Math.PI)) * 4;
  const P = FILM.person(c, {
    x, y, h, face: 1, fill: '#1a1d1f', fill2: '#3a4044', rim: '#d8e2e6', rimW: 3, coat: 'long',
    pose: { lean: .12, bob: (y - (y - bob)) / h, legL: [.30 * Math.sin(ph * 6.283), .10], legR: [-.30 * Math.sin(ph * 6.283), .10], armL: [.22 + .26 * Math.sin(ph * 6.283 + 2), .32], armR: [-.32, .52] },
    hair: 'none', hat: 'cap',
  });
  const hand = P.hand;
  c.save(); c.globalCompositeOperation = 'lighter';
  const lg = c.createLinearGradient(hand[0], hand[1], hand[0] + 380, hand[1] + 200);
  lg.addColorStop(0, 'rgba(255,246,214,.40)'); lg.addColorStop(.45, 'rgba(238,236,220,.16)'); lg.addColorStop(1, 'rgba(220,230,235,0)');
  c.fillStyle = lg;
  c.beginPath(); c.moveTo(hand[0] + 6, hand[1] - 6); c.lineTo(hand[0] + 390, hand[1] + 96); c.lineTo(hand[0] + 368, hand[1] + 250); c.closePath(); c.fill();
  FILM.glow(c, hand[0] + 10, hand[1] - 6, 36, '#ffe9c0', .50);
  c.restore();
}

function drawHut(c, t) {
  const x0 = 1488, y0 = 648, w = 600, hh = 360;
  c.fillStyle = '#08090a';
  c.beginPath(); c.moveTo(x0 - 30, y0); c.lineTo(x0 + w + 30, y0); c.lineTo(x0 + w + 52, y0 + 24); c.lineTo(x0 - 52, y0 + 24); c.closePath(); c.fill();
  const wall = c.createLinearGradient(x0, y0, x0 + w, y0 + hh);
  wall.addColorStop(0, '#191c1d'); wall.addColorStop(.55, '#111314'); wall.addColorStop(1, '#08090a');
  c.fillStyle = wall; c.fillRect(x0, y0 + 20, w, hh);
  c.strokeStyle = 'rgba(150,160,166,.09)'; c.lineWidth = 1.2;
  for (let i = 0; i < 30; i++) { const x = x0 + 8 + i * 20; c.beginPath(); c.moveTo(x, y0 + 24); c.lineTo(x, y0 + hh - 4); c.stroke(); }
  const wx = x0 + 36, wy = y0 + 62, ww = 500, wh = 250;
  c.save();
  const wg = c.createLinearGradient(wx, wy, wx, wy + wh);
  wg.addColorStop(0, '#3f382e'); wg.addColorStop(.62, '#292520'); wg.addColorStop(1, '#141311');
  c.fillStyle = wg; c.fillRect(wx, wy, ww, wh);
  FILM.glow(c, wx + ww * .72, wy + 30, 150, '#ffd9a0', .24);
  c.fillStyle = '#0a0a0a'; c.fillRect(wx + 24, wy + 196, ww - 40, 30);
  c.fillStyle = '#060606'; c.fillRect(wx + 24, wy + 226, ww - 40, 24);
  drawMonitor(c, t, wx + 56, wy + 34, 258, 196);
  // 守夜的人：坐在屏幕右边，只留背影
  const bx = wx + 372, by = wy + 176;
  c.fillStyle = '#070707';
  c.beginPath(); c.roundRect(bx + 34, wy + 96, 48, 134, 9); c.fill();
  c.beginPath();
  c.moveTo(bx - 62, wy + 248);
  c.bezierCurveTo(bx - 60, by + 54, bx - 40, by + 10, bx - 2, by - 2);
  c.bezierCurveTo(bx + 36, by + 10, bx + 56, by + 56, bx + 58, wy + 248);
  c.closePath(); c.fill();
  c.beginPath(); c.ellipse(bx, by - 34, 25, 31, 0.05, 0, Math.PI * 2); c.fill();
  c.strokeStyle = 'rgba(216,196,150,.34)'; c.lineWidth = 2.4;
  c.beginPath(); c.arc(bx, by - 34, 27, -1.1, 0.7); c.stroke();
  c.beginPath(); c.moveTo(bx + 56, by + 40); c.lineTo(bx + 56, wy + 240); c.stroke();
  c.fillStyle = '#0d0e0e'; c.fillRect(wx + 340, wy + 176, 58, 20);
  c.fillStyle = '#0b0c0c'; c.beginPath(); c.roundRect(wx + 404, wy + 160, 24, 36, 3); c.fill();
  c.strokeStyle = 'rgba(180,170,150,.25)'; c.lineWidth = 1.4;
  c.beginPath(); c.moveTo(wx + 415, wy + 164); c.lineTo(wx + 415, wy + 150); c.stroke();
  c.strokeStyle = '#070808'; c.lineWidth = 14; c.strokeRect(wx, wy, ww, wh);
  c.lineWidth = 5; c.strokeStyle = 'rgba(190,198,204,.14)';
  c.beginPath(); c.moveTo(wx + ww * .84, wy); c.lineTo(wx + ww * .84, wy + wh); c.stroke();
  const r = rng('glass');
  const gk = clamp((8.2 - t) / .5); c.save(); c.globalAlpha = .20 * gk; c.strokeStyle = 'rgb(210,220,226)'; c.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) {
    const gx = wx + r() * ww, gy = wy + r() * wh, len = 8 + r() * 64;
    c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + 2 + (t * 24 % 18), gy + len); c.stroke();
  }
  c.restore();
  const rg = c.createLinearGradient(wx, wy, wx + ww * .55, wy + wh);
  rg.addColorStop(0, 'rgba(210,224,232,.10)'); rg.addColorStop(.5, 'rgba(210,224,232,0)');
  c.fillStyle = rg; c.fillRect(wx, wy, ww, wh);
  c.strokeStyle = 'rgba(200,212,218,.26)'; c.lineWidth = 1.6;
  for (let i = 0; i < 24; i++) {
    const dx = x0 + (i * 26) % w, dy = y0 + 24 + ((t * 220 + i * 61) % 260);
    c.beginPath(); c.moveTo(dx, y0 + 24); c.lineTo(dx, dy); c.stroke();
  }
}

function drawMonitor(c, t, x, y, w, h) {
  c.fillStyle = '#050506';
  c.beginPath(); c.roundRect(x - 12, y - 12, w + 24, h + 30, 9); c.fill();
  c.strokeStyle = 'rgba(160,170,176,.22)'; c.lineWidth = 1.6;
  c.beginPath(); c.roundRect(x - 12, y - 12, w + 24, h + 30, 9); c.stroke();
  const sx = x, sy = y, sw = w, sh = h;
  c.fillStyle = '#07090a'; c.fillRect(sx, sy, sw, sh);
  const cx = sx + sw * .5, cy = sy + sh * .48;
  drawMoon(c, cx, cy, sh * .34, 0, false);
  c.save(); c.globalAlpha = .5 * clamp((8.5 - t) / .55);
  for (let yy = sy; yy < sy + sh; yy += 3) { c.fillStyle = 'rgba(0,0,0,.30)'; c.fillRect(sx, yy, sw, 1.4); }
  c.restore();
  const rg = rng(Math.floor(t * 30) + 11);
  c.save(); c.globalAlpha = .09;
  for (let i = 0; i < 80; i++) { c.fillStyle = rg() < .5 ? '#fff' : '#000'; c.fillRect(sx + rg() * sw, sy + rg() * sh, 2, 1.6); }
  c.restore();
  const osd = clamp((8.55 - t) / .7);
  if (osd > 0) {
    c.save(); c.globalAlpha = osd;
    FILM.text(c, 'APOLLO 11', { x: sx + 12, y: sy + 26, size: Math.max(10, sh * .085), color: 'rgba(226,232,236,.72)', weight: 500, tracking: 1.4 });
    FILM.text(c, '03:56:20 AEST', { x: sx + 12, y: sy + sh - 12, size: Math.max(9, sh * .068), color: 'rgba(226,232,236,.55)', weight: 400, tracking: 1 });
    c.fillStyle = Math.floor(t * 2) % 2 ? 'rgba(255,90,70,.8)' : 'rgba(255,90,70,.28)';
    c.beginPath(); c.arc(sx + sw - 16, sy + 16, 4.2, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  const rg2 = c.createLinearGradient(sx, sy, sx + sw, sy + sh);
  rg2.addColorStop(0, 'rgba(255,255,255,.09)'); rg2.addColorStop(.38, 'rgba(255,255,255,0)');
  c.fillStyle = rg2; c.fillRect(sx, sy, sw, sh);
  FILM.glow(c, sx + sw * .5, sy + sh * .5, sw * .9, '#9fb4c4', .10);
  c.fillStyle = '#050506'; c.fillRect(sx + sw * .42, sy + sh + 18, sw * .16, 26);
  c.fillRect(sx + sw * .3, sy + sh + 40, sw * .4, 8);
}

function drawMoon(c, cx, cy, rr, t, full) {
  const tex = FILM.moonTex(1);
  c.save();
  c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.clip();
  c.drawImage(tex, cx - rr, cy - rr, rr * 2, rr * 2);
  // 明暗交界：右下方压下去
  c.globalCompositeOperation = 'multiply';
  const term = c.createLinearGradient(cx - rr * .3, cy - rr * .8, cx + rr * .95, cy + rr * .85);
  term.addColorStop(0, 'rgb(255,255,255)'); term.addColorStop(.48, 'rgb(238,236,229)'); term.addColorStop(1, 'rgb(138,136,128)');
  c.fillStyle = term; c.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  c.globalCompositeOperation = 'source-over';
  // 左上迎光
  const hi = c.createRadialGradient(cx - rr * .42, cy - rr * .46, 0, cx - rr * .42, cy - rr * .46, rr);
  hi.addColorStop(0, 'rgba(255,253,244,.28)'); hi.addColorStop(1, 'rgba(255,253,244,0)');
  c.fillStyle = hi; c.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  c.restore();
  c.strokeStyle = 'rgba(118,120,116,.35)'; c.lineWidth = Math.max(1, rr * .008);
  c.beginPath(); c.arc(cx, cy, rr - .5, 0, Math.PI * 2); c.stroke();
}

// 电视画面铺满：从监视器里“推”出去，扫描线留在屏幕上
function drawTVFull(c, t) {
  const k = soft((t - 8.45) / .30);
  if (k <= 0) return;
  const grow = soft((t - 8.48) / .92);
  const rr = lerp(80, 372, grow), cx = 960, cy = 500;
  c.save(); c.globalAlpha = k;
  c.fillStyle = '#050607'; c.fillRect(0, 0, FILM.W, FILM.H);
  FILM.glow(c, cx, cy, rr * 1.5, '#9fb4c4', .10);
  drawMoon(c, cx, cy, rr, t, true);
  // 扫描线
  const sl = .34 * (1 - soft((t - 9.35) / .45));
  if (sl > 0) {
    c.save(); c.globalAlpha = k * sl;
    for (let y = 0; y < FILM.H; y += 3) { c.fillStyle = 'rgba(0,0,0,.9)'; c.fillRect(0, y, FILM.W, 1.35); }
    c.restore();
  }
  // 合成噪点
  const rg = rng(Math.floor(t * 30) + 7);
  c.save(); c.globalAlpha = k * .10;
  for (let i = 0; i < 240; i++) { c.fillStyle = rg() < .55 ? '#000' : '#fff'; c.fillRect(rg() * FILM.W, rg() * FILM.H, 2.2, 1.6); }
  c.restore();
  // 屏显
  const osd = k * clamp((9.15 - t) / .55);
  if (osd > 0) {
    c.save(); c.globalAlpha = osd * .8;
    FILM.text(c, 'APOLLO 11', { x: 92, y: 128, size: 30, color: 'rgba(226,232,236,.9)', weight: 500, tracking: 2 });
    FILM.text(c, '03:56:20 AEST', { x: 92, y: 166, size: 18, color: 'rgba(210,218,224,.55)', weight: 400, tracking: 1.4 });
    c.restore();
  }
  c.globalAlpha = k;
  FILM.vignette(c, { inner: .40, outer: .95, a: .55 });
  c.restore();
}

function drawCaption(c, t) {
  const k = soft((t - 9.0) / .55);
  if (k <= 0) return;
  c.save(); c.globalAlpha = k * .9;
  FILM.text(c, 'PARKES · 21 JUL 1969', { x: 1836, y: 972, align: 'right', size: 27, color: 'rgba(232,238,242,.82)', weight: 500, tracking: 4 });
  FILM.text(c, '64 M RADIO TELESCOPE', { x: 1836, y: 1004, align: 'right', size: 17, color: 'rgba(206,214,220,.48)', weight: 400, tracking: 3 });
  c.restore();
}

function drawWindDebris(c, t) {
  const r = rng('debris');
  c.save(); c.strokeStyle = 'rgba(190,200,206,.26)'; c.lineWidth = 1.3;
  for (let i = 0; i < 24; i++) {
    const sp = 700 + r() * 520;
    const x = ((r() * 2600 + t * sp) % 2700) - 340;
    const y = 380 + r() * 520 + Math.sin(t * 4 + i) * 26;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 15, y + 5); c.stroke();
  }
  c.restore();
}

function frame(t) {
  const cam = FILM.cam(CAM_KEYS, t);
  const shx = (n1(t * 9, 3) - .5) * 8, shy = (n1(t * 7, 4) - .5) * 7;
  const c = ENV.ctx;
  ENV.reset('#060707');
  c.save();
  c.translate(shx, shy);
  FILM.withCam(c, cam, () => {
    drawSky(c, t);
    drawLightning(c, t);
    drawGround(c, t);
    drawDish(c, t);
    drawTechnician(c, t);
    drawRainSheet(c, t);
    drawHut(c, t);
    drawWindDebris(c, t);
  });
  c.restore();
  drawTVFull(c, t);
  drawCaption(c, t);
  c.save(); c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgba(198,206,214,.14)'; c.fillRect(0, 0, FILM.W, FILM.H); c.restore();
  FILM.grain(c, .18, 0);
  FILM.grain(c, .10, 1);
  FILM.vignette(c, { inner: .32, outer: .88, a: .58 });
  FILM.letterbox(c, .045, '#000');
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  frame(0);
  window.__ready = true;
});
