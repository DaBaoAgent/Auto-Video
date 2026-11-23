// fabu · 发布 · 一键归位
// 黑暗的发布厅，台上一枚巨大的键。按下的一瞬，散落在空中的一切碎片飞回来，
// 一格一格归位，最后亮起一行字。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;

const r = rng('fabu');
const CARD_COLS = 3, CARD_ROWS = 2;
const CARDS = [];
for (let i = 0; i < CARD_COLS * CARD_ROWS; i++) {
  const col = i % CARD_COLS, row = Math.floor(i / CARD_COLS);
  CARDS.push({
    gx: 640 + col * 300, gy: 330 + row * 210,
    sx: r() * 1900 - 100, sy: r() * 900 - 100,
    sr: (r() - .5) * 1.4,
    delay: .06 * i + r() * .10,
  });
}

function hall(c, t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#05060b'); g.addColorStop(.55, '#090c14'); g.addColorStop(1, '#030408');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // 顶上的灯桁架与光束
  c.fillStyle = '#0d1018'; c.fillRect(0, 0, W, 90);
  for (let i = 0; i < 7; i++) {
    const x = 220 + i * 240;
    c.fillStyle = '#171b26'; c.fillRect(x - 26, 40, 52, 34);
    const beam = c.createLinearGradient(x, 80, x + (i % 2 ? 160 : -160), 780);
    beam.addColorStop(0, 'rgba(140,190,255,.16)'); beam.addColorStop(1, 'rgba(140,190,255,0)');
    c.fillStyle = beam;
    c.beginPath(); c.moveTo(x - 10, 74); c.lineTo(x + 10, 74); c.lineTo(x + (i % 2 ? 260 : -260), 800); c.lineTo(x + (i % 2 ? 130 : -130), 800); c.fill();
  }
  // 舞台地面（镜面）
  const st = c.createLinearGradient(0, 760, 0, 1080);
  st.addColorStop(0, '#0b1018'); st.addColorStop(1, '#05070c');
  c.fillStyle = st; c.fillRect(0, 760, W, 320);
  c.strokeStyle = 'rgba(120,180,255,.13)'; c.lineWidth = 2;
  for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(i * 40, 1080); c.lineTo(960 + (i * 40 - 960) * .18, 760); c.stroke(); }
  // 观众剪影
  const rr = rng('aud');
  for (let i = 0; i < 34; i++) {
    const x = rr() * W, y = 990 + rr() * 80, h = 60 + rr() * 40;
    c.fillStyle = '#020306';
    c.beginPath(); c.arc(x, y - h * .52, h * .16, 0, 7); c.fill();
    c.beginPath(); c.roundRect(x - h * .22, y - h * .36, h * .44, h * .5, 12); c.fill();
  }
}

function screen(c, t) {
  const x = 520, y = 250, w = 900, h = 520;
  c.save();
  c.fillStyle = 'rgba(6,10,18,.92)';
  c.beginPath(); c.roundRect(x - 14, y - 14, w + 28, h + 28, 10); c.fill();
  c.strokeStyle = 'rgba(90,150,255,.22)'; c.lineWidth = 2;
  c.beginPath(); c.roundRect(x, y, w, h, 6); c.stroke();
  // 网格
  c.strokeStyle = 'rgba(70,130,220,.10)'; c.lineWidth = 1;
  for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo(x + w / 12 * i, y); c.lineTo(x + w / 12 * i, y + h); c.stroke(); }
  for (let j = 1; j < 7; j++) { c.beginPath(); c.moveTo(x, y + h / 7 * j); c.lineTo(x + w, y + h / 7 * j); c.stroke(); }
  c.restore();
  return { x, y, w, h };
}

function card(c, x, y, w, h, rot, alpha, kind) {
  c.save(); c.globalAlpha = alpha;
  c.translate(x + w / 2, y + h / 2); c.rotate(rot);
  c.fillStyle = 'rgba(16,22,36,.94)';
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 8); c.fill();
  c.strokeStyle = 'rgba(110,170,255,.35)'; c.lineWidth = 1.6;
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 8); c.stroke();
  if (kind === 0) {
    c.fillStyle = 'rgba(120,190,255,.55)'; c.fillRect(-w / 2 + 16, -h / 2 + 18, w * .5, 10);
    for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(160,200,255,${.16 + i * .04})`; c.fillRect(-w / 2 + 16, -h / 2 + 44 + i * 16, w * (.72 - i * .10), 6); }
  } else if (kind === 1) {
    c.strokeStyle = 'rgba(120,200,255,.6)'; c.lineWidth = 2;
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-w / 2 + 20 + i * 34, h / 2 - 22); c.lineTo(-w / 2 + 20 + i * 34, h / 2 - 22 - (14 + i * 12)); c.stroke(); }
  } else {
    c.fillStyle = 'rgba(140,220,255,.5)'; c.beginPath(); c.arc(0, 0, Math.min(w, h) * .22, 0, 7); c.fill();
    c.fillStyle = 'rgba(10,16,26,.8)'; c.beginPath(); c.arc(0, 0, Math.min(w, h) * .12, 0, 7); c.fill();
  }
  c.restore();
}

function keycap(c, x, y, press, t) {
  const k = 96;
  const zTop = 1.0 - .22 * press;
  const P = (a, b, z) => [x + (a - b) * k, y + (a + b) * k * .52 - z * k * 1.1 + 120];
  const A = P(-1, -1, zTop), B = P(1, -1, zTop), C = P(1, 1, zTop), D = P(-1, 1, zTop);
  const B0 = P(1, -1, 0), C0 = P(1, 1, 0), D0 = P(-1, 1, 0);
  c.save();
  // 底座的光圈
  c.strokeStyle = 'rgba(110,180,255,.35)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(x, y + 120, k * 1.9, k * .62, 0, 0, 7); c.stroke();
  // 右侧面
  c.fillStyle = press > .3 ? '#1e63a8' : '#1b3f6b';
  c.beginPath(); c.moveTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.lineTo(C0[0], C0[1]); c.lineTo(B0[0], B0[1]); c.fill();
  // 左侧面
  c.fillStyle = '#122a45';
  c.beginPath(); c.moveTo(C[0], C[1]); c.lineTo(D[0], D[1]); c.lineTo(D0[0], D0[1]); c.lineTo(C0[0], C0[1]); c.fill();
  // 顶面
  const g = c.createLinearGradient(A[0], A[1], C[0], C[1]);
  g.addColorStop(0, press > .3 ? '#8fd0ff' : '#5b8fd0'); g.addColorStop(1, press > .3 ? '#3f9bff' : '#2f5d94');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.lineTo(D[0], D[1]); c.fill();
  // 顶面高光边
  c.strokeStyle = 'rgba(200,235,255,.75)'; c.lineWidth = 2.4;
  c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.stroke();
  // 键上的字
  c.save();
  c.translate(x, y - zTop * k * 1.1 + 96);
  c.transform(1, 0, -.4, .78, 0, 0);
  c.fillStyle = 'rgba(8,20,36,.85)';
  FILM.text(c, '⏎', { x: 0, y: 10, align: 'center', size: 46, color: 'rgba(8,18,32,.85)', weight: 700 });
  c.restore();
  c.restore();
  FILM.glow(c, x, y - zTop * 60 + 60, k * 2.2, '#4ea8ff', .16 + .28 * press);
}
function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#04060a');
  const press = soft((t - 4.15) / .55) * (1 - soft((t - 5.4) / 1.4) * .35);
  const camZ = 1.04 + soft(t / 10) * .12;
  c.save();
  c.translate(960, 560); c.scale(camZ, camZ); c.translate(-960, -560);
  hall(c, t);
  const scr = screen(c, t);
  // 归位的碎片
  const snap = soft((t - 4.7) / 1.1);
  CARDS.forEach((cd, i) => {
    const k = clamp((snap - cd.delay) / .55);
    const e = FILM.easeOutBack(k);
    const x = lerp(cd.sx, cd.gx, e), y = lerp(cd.sy, cd.gy, e);
    const rot = lerp(cd.sr, 0, e);
    card(c, x, y, 250, 160, rot, .25 + .75 * k, i % 3);
  });
  // 冲击波
  const wave = soft((t - 4.15) / 1.1);
  if (wave > 0 && wave < 1) {
    c.save();
    c.strokeStyle = `rgba(120,200,255,${.55 * (1 - wave)})`; c.lineWidth = 6 * (1 - wave) + 1;
    c.beginPath(); c.ellipse(960, 640, 300 + wave * 900, (300 + wave * 900) * .32, 0, 0, 7); c.stroke();
    c.restore();
  }
  // 按键
  keycap(c, 960, 690, press, t);
  // 主持人
  FILM.person(c, {
    x: 1500, y: 860, h: 300, face: -1,
    fill: '#0a0d14', rim: 'rgba(150,200,255,.5)', rimW: 2,
    coat: 'suit',
    pose: { armL: [.10, .38], armR: [-.55, .10], lean: -.02 },
  });
  // 地面倒影
  c.save(); c.globalAlpha = .22; c.scale(1, -1); c.translate(0, -1560);
  keycap(c, 960, 690, press, t);
  c.restore();
  c.restore();
  // 标题
  const ti = soft((t - 8.3) / .8);
  if (ti > 0) {
    c.save(); c.globalAlpha = ti;
    FILM.text(c, 'ONE KEY', { x: 960, y: 150, align: 'center', size: 64, color: 'rgba(220,238,255,.94)', weight: 700, tracking: 10 });
    FILM.text(c, '所有窗口，一次归位', { x: 960, y: 196, align: 'center', size: 26, color: 'rgba(150,190,240,.75)', weight: 400, tracking: 4 });
    c.restore();
  }
  FILM.grain(c, .10, 41);
  FILM.vignette(c, { inner: .34, outer: .96, a: .62 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });

