// zifu · CRT 字符终端
// 1971 年，静海基地。值班员在字符终端上把最后一行数据敲完，
// 屏幕用字符把“月面 + 地球”拼出来 —— 全片只有一个房间、一块绿屏。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { clamp, lerp, soft, rng, n1 } = FILM;

const CAM_KEYS = [
  { t: 0.0, x: 1030, y: 656, z: 1.56 },
  { t: 2.4, x: 1050, y: 660, z: 1.50, ease: soft },
  { t: 4.3, x: 1168, y: 686, z: 1.00, ease: soft },
  { t: 7.0, x: 1090, y: 668, z: 1.30, ease: soft },
  { t: 10.0, x: 1028, y: 660, z: 1.60, ease: soft },
];

const SCR = { x: 638, y: 386, w: 760, h: 520 };
const COLS = 68, ROWS = 28, CW = SCR.w / COLS, CH = SCR.h / ROWS;
const RAMP = ' .,:;+=*#%@';
const screenCv = FILM.canvas(760, 520);
const sctx = screenCv.getContext('2d');

// ---- 目标画面（字符画的原图）：月面、登月舱、人、地球
const targetCv = FILM.layer('zifu-target', 760, 520, (g) => {
  const W = 760, H = 520;
  // 天空
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0b0d0c'); sky.addColorStop(.55, '#171b18'); sky.addColorStop(.72, '#2b302c');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // 星
  const r = rng('zifu-stars');
  for (let i = 0; i < 90; i++) { const x = r() * W, y = r() * H * .62, s = 1 + r() * 2; g.fillStyle = `rgba(210,225,215,${.2 + r() * .5})`; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
  // 地球
  const ex = 540, ey = 128, er = 102;
  const eg = g.createRadialGradient(ex - 30, ey - 30, 10, ex, ey, er);
  eg.addColorStop(0, '#eef3ee'); eg.addColorStop(.55, '#c3ccc5'); eg.addColorStop(1, '#7b847d');
  g.fillStyle = eg; g.beginPath(); g.arc(ex, ey, er, 0, 7); g.fill();
  const rr = rng('zifu-earth');
  for (let i = 0; i < 9; i++) {
    const a = rr() * 6.28, d = Math.sqrt(rr()) * er * .8;
    g.fillStyle = `rgba(40,46,42,${.22 + rr() * .25})`;
    g.beginPath(); g.ellipse(ex + Math.cos(a) * d, ey + Math.sin(a) * d, er * (.14 + rr() * .22), er * (.09 + rr() * .16), rr() * 3, 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(255,255,245,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(ex, ey, er + 3, 0, 7); g.stroke();
  // 地平线
  g.fillStyle = '#171c19';
  g.beginPath(); g.moveTo(0, 392); g.bezierCurveTo(220, 360, 520, 358, W, 388); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
  // 地平线亮边
  g.strokeStyle = 'rgba(198,210,200,.85)'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(0, 392); g.bezierCurveTo(220, 360, 520, 358, W, 388); g.stroke();
  // 地面上的坑
  const rc = rng('zifu-craters');
  for (let i = 0; i < 26; i++) {
    const x = rc() * W, y = 396 + rc() * 110, w = 6 + rc() * 42, h = w * .28;
    g.strokeStyle = `rgba(12,14,13,${.3 + rc() * .4})`; g.lineWidth = 2;
    g.beginPath(); g.ellipse(x, y, w, h, 0, 0, 7); g.stroke();
    g.fillStyle = `rgba(90,98,92,${.12 + rc() * .18})`; g.beginPath(); g.ellipse(x, y + 2, w, h, 0, 0, 7); g.fill();
  }
  // 登月舱
  g.save(); g.translate(150, 330); g.scale(1.55, 1.55);
  g.fillStyle = '#c9d2ca'; g.strokeStyle = '#eef4ee'; g.lineWidth = 2;
  // 下降段
  g.beginPath(); g.moveTo(-40, 30); g.lineTo(40, 30); g.lineTo(34, 76); g.lineTo(-34, 76); g.closePath(); g.fill();
  g.strokeStyle = '#616964'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(-34, 44); g.lineTo(34, 44); g.stroke();
  // 上升段
  g.fillStyle = '#dde5de';
  g.beginPath(); g.moveTo(-26, 28); g.lineTo(-20, -10); g.lineTo(-8, -22); g.lineTo(14, -22); g.lineTo(24, -8); g.lineTo(26, 28); g.closePath(); g.fill();
  g.fillStyle = '#89928b'; g.beginPath(); g.roundRect(-14, -6, 28, 20, 3); g.fill();
  // 腿
  g.strokeStyle = '#b8c2ba'; g.lineWidth = 4;
  [[-34, 56, -58, 96], [34, 56, 58, 96]].forEach(([x1, y1, x2, y2]) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); });
  g.fillStyle = '#dfe7df'; g.beginPath(); g.roundRect(-64, 94, 18, 5, 2); g.fill(); g.beginPath(); g.roundRect(46, 94, 18, 5, 2); g.fill();
  // 梯子 + 天线
  g.strokeStyle = '#eef4ee'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(18, 24); g.lineTo(26, 74); g.stroke();
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(19 + i * 2, 34 + i * 10); g.lineTo(25 + i * 2, 34 + i * 10); g.stroke(); }
  g.beginPath(); g.moveTo(-6, -22); g.quadraticCurveTo(10, -46, 34, -50); g.stroke();
  g.fillStyle = '#eef4ee'; g.beginPath(); g.arc(36, -50, 5, 0, 7); g.fill();
  g.restore();
  // 宇航员
  g.save(); g.translate(360, 320); g.scale(1.75, 1.75);
  g.fillStyle = '#e8efe8';
  g.beginPath(); g.ellipse(0, -42, 15, 17, 0, 0, 7); g.fill();          // 头盔
  g.fillStyle = '#9aa39c'; g.beginPath(); g.ellipse(2, -40, 10, 11, 0, 0, 7); g.fill();
  const body = FILM.smooth([[-16, -26], [16, -26], [20, 24], [10, 30], [-10, 30], [-20, 24]]);
  g.fillStyle = '#dfe6df'; g.fill(body);
  g.fillStyle = '#b7c0b8'; g.fillRect(-14, -18, 28, 16);
  g.strokeStyle = '#eef4ee'; g.lineWidth = 7;
  g.beginPath(); g.moveTo(-15, -12); g.lineTo(-34, 16); g.stroke();
  g.beginPath(); g.moveTo(15, -12); g.lineTo(32, 6); g.stroke();
  g.strokeStyle = '#dfe6df'; g.lineWidth = 9;
  g.beginPath(); g.moveTo(-8, 28); g.lineTo(-12, 58); g.stroke();
  g.beginPath(); g.moveTo(8, 28); g.lineTo(12, 58); g.stroke();
  g.strokeStyle = '#9aa39c'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(-14, -34); g.lineTo(-14, -10); g.stroke();
  // 背包
  g.fillStyle = '#8a938c'; g.beginPath(); g.roundRect(-24, -26, 10, 34, 3); g.fill();
  g.restore();
  // 月面实验包
  g.fillStyle = '#cfd7cf'; g.beginPath(); g.roundRect(620, 388, 44, 16, 3); g.fill();
  g.strokeStyle = '#7f8881'; g.lineWidth = 2; g.strokeRect(620, 388, 44, 16);
  // 整体压暗、加颗粒
  const vg = g.createRadialGradient(380, 260, 80, 380, 260, 520);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
});

// 采样成字符亮度
const LEVELS = (() => {
  const g = targetCv.getContext('2d');
  const d = g.getImageData(0, 0, 760, 520).data;
  const arr = new Float32Array(COLS * ROWS);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    let s = 0, n = 0;
    for (let dy = -3; dy <= 3; dy += 3) for (let dx = -3; dx <= 3; dx += 3) {
      const x = Math.min(759, Math.max(0, Math.round((c + .5) * CW + dx)));
      const y = Math.min(519, Math.max(0, Math.round((r + .5) * CH + dy)));
      const i = (y * 760 + x) * 4;
      s += (d[i] * .55 + d[i + 1] * .35 + d[i + 2] * .1); n++;
    }
    arr[r * COLS + c] = Math.pow(Math.max(0, s / n / 255 - .04) / .78, .78);
  }
  return arr;
})();

const TYPE_LINES = [
  'PARKES 64M ................ LINK LOCK',
  'APOLLO 11 / EASEP / TAPE 12',
  '> SCAN LUNAR SURFACE ............ OK',
  '> RENDER FRAME 0001 ............. OK',
  '> RENDER FRAME 0218 ............. OK',
  '> BUILD PICTURE FROM CHARACTERS ..',
];

function drawAscii(c, t) {
  sctx.clearRect(0, 0, 760, 520);
  sctx.fillStyle = '#020604'; sctx.fillRect(0, 0, 760, 520);
  const reveal = clamp((t - 4.10) / 2.95);
  const rows = Math.floor(reveal * ROWS);
  const line = (reveal * ROWS) - rows;
  const sc = 1 + Math.sin(t * 2) * .004;
  sctx.save();
  sctx.translate(380, 260); sctx.scale(sc, 1); sctx.translate(-380, -260);
  sctx.font = `500 ${Math.round(CH * .92)}px Consolas, "Courier New", monospace`;
  sctx.textBaseline = 'middle';
  for (let r = 0; r <= rows && r < ROWS; r++) {
    const lim = r < rows ? COLS : Math.floor(line * COLS);
    for (let c = 0; c < lim; c++) {
      const v = LEVELS[r * COLS + c];
      const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(v * (RAMP.length - .01)))];
      if (ch === ' ') continue;
      const flick = 1 - .25 * (n1(t * 26 + r * 3 + c * .4, 9) > .78 ? 1 : 0);
      const br = (0.30 + v * .70) * flick;
      sctx.fillStyle = `rgb(${Math.round(16 + br * 205)},${Math.round(135 + br * 120)},${Math.round(58 + br * 180)})`;
      sctx.fillText(ch, c * CW + 1, r * CH + CH * .52);
    }
  }
  // 底部的提示与游标
  if (reveal >= 1) {
    sctx.font = '400 13px Consolas, monospace';
    sctx.fillStyle = 'rgba(120,255,175,.85)';
    sctx.fillText('TRANQUILITY BASE  ·  EASEP  ·  FRAME 0218', 14, 500);
    if (Math.floor(t * 2.4) % 2 === 0) sctx.fillRect(632, 489, 9, 14);
  }
  sctx.restore();
  // 扫描线
  for (let y = 0; y < 520; y += 3) { sctx.fillStyle = 'rgba(0,0,0,.36)'; sctx.fillRect(0, y, 760, 1.4); }
}

function drawTerminalText(c, t) {
  sctx.clearRect(0, 0, 760, 520);
  sctx.fillStyle = '#020704'; sctx.fillRect(0, 0, 760, 520);
  sctx.font = '500 15px Consolas, "Courier New", monospace';
  sctx.textBaseline = 'middle';
  let total = 0;
  for (let i = 0; i < TYPE_LINES.length; i++) total += TYPE_LINES[i].length;
  const typed = 58 + Math.floor(clamp((t - .03) / 1.85) * total);
  let count = 0;
  for (let i = 0; i < TYPE_LINES.length; i++) {
    const ln = TYPE_LINES[i];
    const chars = Math.max(0, Math.min(ln.length, typed - count));
    count += ln.length;
    for (let k = 0; k < chars; k++) {
      const ch = ln[k];
      const bright = i === TYPE_LINES.length - 1 || k < 2 ? .95 : .62;
      sctx.fillStyle = `rgba(${60 + bright * 120},${170 + bright * 70},${90 + bright * 100},${bright})`;
      sctx.fillText(ch, 26 + k * 9.2, 60 + i * 30);
    }
  }
  // 提示符游标
  if (Math.floor(t * 3) % 2 === 0) { sctx.fillStyle = 'rgba(140,255,180,.9)'; sctx.fillRect(26 + Math.min(74, typed % 74) * 9.2, 60 + Math.min(5, Math.floor(typed / 74)) * 30 - 8, 8, 16); }
  // 右上角状态
  sctx.font = '400 12px Consolas, monospace';
  sctx.fillStyle = 'rgba(110,230,160,.55)';
  sctx.fillText('CH 03', 690, 24);
  sctx.fillText('7001', 690, 40);
  // 屏幕外框光
  for (let y = 0; y < 520; y += 3) { sctx.fillStyle = 'rgba(0,0,0,.28)'; sctx.fillRect(0, y, 760, 1.5); }
}

function drawRoom(c, t) {
  // 墙与地面
  c.fillStyle = '#040705'; c.fillRect(-200, -200, 2400, 1600);
  FILM.mist(c, 1080, 700, 760, 460, '#0b1a11', .55);
  c.fillStyle = '#060a08'; c.fillRect(-200, 984, 2400, 200);
  // 墙面水渍与接缝
  c.strokeStyle = 'rgba(90,120,100,.06)'; c.lineWidth = 2;
  for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(i * 260 - 100, 0); c.lineTo(i * 260 - 60, 984); c.stroke(); }
  // 墙上贴的任务徽章
  c.save(); c.globalAlpha = .16; c.translate(268, 318);
  c.strokeStyle = '#7fbf98'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 92, 0, 7); c.stroke();
  c.beginPath(); c.arc(0, 0, 62, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(160,230,190,.6)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-30, 22); c.lineTo(30, -6); c.stroke();
  c.restore();
  // 控制台桌
  c.fillStyle = '#0a0f0c'; c.fillRect(548, 930, 1000, 34);
  c.fillStyle = '#070a08'; c.fillRect(548, 964, 1000, 60);
  c.strokeStyle = 'rgba(120,180,140,.18)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(548, 930); c.lineTo(1548, 930); c.stroke();
  // 桌面绿光
  c.save(); c.globalCompositeOperation = 'lighter';
  const deal = c.createLinearGradient(SCR.x, 930, SCR.x + SCR.w, 936);
  deal.addColorStop(0, 'rgba(30,150,80,.18)'); deal.addColorStop(.7, 'rgba(30,150,80,.04)'); deal.addColorStop(1, 'rgba(30,150,80,0)');
  c.fillStyle = deal; c.fillRect(SCR.x, 930, SCR.w, 10);
  c.restore();
  // 键盘
  c.fillStyle = '#0c1410'; c.beginPath(); c.roundRect(690, 900, 420, 34, 6); c.fill();
  c.strokeStyle = 'rgba(130,220,170,.22)'; c.lineWidth = 1.4;
  for (let r = 0; r < 3; r++) for (let k = 0; k < 26; k++) { c.strokeRect(702 + k * 15, 906 + r * 10, 11, 7); }
  // 磁带机
  c.fillStyle = '#0b110e'; c.beginPath(); c.roundRect(572, 830, 220, 100, 8); c.fill();
  c.strokeStyle = 'rgba(120,180,140,.25)'; c.lineWidth = 2; c.strokeRect(578, 836, 208, 88);
  for (let i = 0; i < 2; i++) {
    const rx = 620 + i * 96, ry = 880, r = 30;
    c.fillStyle = '#131a16'; c.beginPath(); c.arc(rx, ry, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(140,220,170,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry, r - 4, 0, 7); c.stroke();
    c.save(); c.translate(rx, ry); c.rotate(t * (i ? -3 : 4));
    for (let k = 0; k < 6; k++) { c.rotate(Math.PI / 3); c.strokeStyle = 'rgba(160,240,190,.30)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(r - 8, 0); c.stroke(); }
    c.restore();
  }
  // 纸张、杯子、耳机
  c.fillStyle = '#161d18'; c.fillRect(1138, 916, 96, 14);
  c.fillStyle = '#0e1511'; c.beginPath(); c.roundRect(1256, 890, 26, 40, 4); c.fill();
  c.strokeStyle = 'rgba(160,220,180,.25)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(1269, 894); c.lineTo(1269, 880); c.stroke();
}

function drawAstronaut(c, t) {
  const H = 468, x = 1548, y = 1024, k = H / 470;
  const bob = Math.sin(t * 1.6) * 3.2;
  c.save();
  c.translate(x, y + bob); c.scale(-1, 1); c.scale(k, k);   // 局部 +x 朝屏幕（向左）
  const base = '#3d463f', light = '#707c73', mid = '#56625a', dark = '#2b332d';
  const suit = (p, col1, col2) => {
    const g = c.createLinearGradient(-80, -430, 90, -40);
    g.addColorStop(0, col1 || light); g.addColorStop(.55, col2 || base); g.addColorStop(1, dark);
    c.fillStyle = g; c.fill(p);
  };
  // 背包
  c.fillStyle = '#4c574f';
  c.beginPath(); c.roundRect(-112, -372, 66, 176, 12); c.fill();
  c.strokeStyle = 'rgba(190,255,215,.22)'; c.lineWidth = 2.4; c.stroke();
  c.strokeStyle = 'rgba(170,210,185,.35)'; c.lineWidth = 5;
  c.beginPath(); c.moveTo(-46, -330); c.bezierCurveTo(-6, -360, 16, -300, 30, -272); c.stroke();
  c.beginPath(); c.moveTo(-40, -290); c.bezierCurveTo(-4, -260, 2, -330, 34, -310); c.stroke();
  // 远腿
  suit(FILM.taper([-40, -222], [-46, -120], 58, 44), '#6f7a72', '#59645c');
  suit(FILM.taper([-46, -120], [-40, -18], 44, 34), '#6a756d', '#4d574f');
  c.fillStyle = '#4a544c';
  c.beginPath(); c.roundRect(-76, -22, 74, 30, 9); c.fill();
  // 远臂
  suit(FILM.taper([-62, -340], [-90, -250], 40, 32), '#6f7a72', '#57625a');
  suit(FILM.taper([-90, -250], [-52, -180], 32, 26), '#6a756d', '#4f5951');
  // 躯干
  suit(FILM.smooth([[-58, -338], [56, -338], [72, -296], [66, -250], [46, -214], [-46, -214], [-66, -252], [-72, -296]]), '#c8d1c8', '#7f8b81');
  // 胸前控制盒
  c.fillStyle = '#3f4a42';
  c.beginPath(); c.roundRect(4, -322, 54, 56, 6); c.fill();
  c.strokeStyle = 'rgba(220,255,230,.30)'; c.lineWidth = 1.6; c.strokeRect(4, -322, 54, 56);
  for (let i = 0; i < 3; i++) {
    c.fillStyle = i === 1 ? 'rgba(140,255,175,.9)' : 'rgba(190,220,200,.45)';
    c.beginPath(); c.arc(14 + i * 15, -310, 3.4, 0, 7); c.fill();
  }
  c.fillStyle = 'rgba(230,255,240,.18)'; c.fillRect(10, -292, 42, 12);
  // 髋部环
  c.strokeStyle = 'rgba(220,255,235,.25)'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(0, -216, 52, 12, 0, 0, 7); c.stroke();
  // 近腿
  suit(FILM.taper([34, -222], [42, -118], 60, 46), '#c8d1c8', '#77837a');
  suit(FILM.taper([42, -118], [38, -16], 46, 36), '#c2ccc2', '#6b766e');
  c.strokeStyle = 'rgba(230,255,240,.22)'; c.lineWidth = 2;
  c.beginPath(); c.arc(40, -118, 30, -2.4, 1.0); c.stroke();
  c.fillStyle = '#465048';
  c.beginPath(); c.roundRect(4, -24, 78, 32, 10); c.fill();
  // 颈环
  c.fillStyle = '#5c675f';
  c.beginPath(); c.ellipse(0, -350, 40, 15, 0, 0, 7); c.fill();
  // 头盔
  const hg = c.createRadialGradient(-14, -436, 6, 0, -410, 62);
  hg.addColorStop(0, '#f2f6f0'); hg.addColorStop(.6, '#bcc7bd'); hg.addColorStop(1, '#6d7870');
  c.fillStyle = hg;
  c.beginPath(); c.ellipse(0, -410, 46, 50, 0, 0, 7); c.fill();
  // 面罩
  const vg = c.createLinearGradient(20, -442, -26, -378);
  vg.addColorStop(0, '#20342a'); vg.addColorStop(.5, '#0d1a13'); vg.addColorStop(1, '#071009');
  c.fillStyle = vg;
  c.beginPath(); c.ellipse(-4, -409, 33, 36, 0, 0, 7); c.fill();
  // 面罩里的绿光反射
  c.fillStyle = 'rgba(90,220,140,.28)';
  c.beginPath(); c.ellipse(-14, -414, 16, 12, -.4, 0, 7); c.fill();
  c.strokeStyle = 'rgba(200,255,220,.55)'; c.lineWidth = 2.4;
  c.beginPath(); c.arc(-16, -418, 20, -1.2, .9); c.stroke();
  c.strokeStyle = 'rgba(232,255,242,.35)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(-4, -409, 34, 37, 0, 0, 7); c.stroke();
  // 近臂（伸到键盘上）
  suit(FILM.taper([62, -338], [122, -288], 44, 36), '#c8d1c8', '#7b877e');
  suit(FILM.taper([122, -288], [170, -186], 36, 30), '#c2ccc2', '#6f7a72');
  c.strokeStyle = 'rgba(225,255,240,.22)'; c.lineWidth = 2;
  c.beginPath(); c.arc(122, -288, 21, -1.2, 1.4); c.stroke();
  // 手套
  c.fillStyle = '#3f4a42';
  c.beginPath(); c.ellipse(176, -176, 24, 18, .5, 0, 7); c.fill();
  // 左边缘轮廓光
  c.strokeStyle = 'rgba(150,255,190,.55)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(-72, -300); c.quadraticCurveTo(-86, -230, -62, -180); c.stroke();
  c.beginPath(); c.arc(-6, -410, 48, 2.0, 3.9); c.stroke();
  c.restore();
  // 手边绿光
  FILM.glow(c, x - 176 * k, y - 176 * k, 42, '#4dff96', .16);
}

function drawBezel(c, t, cam) {
  // 显示器外壳
  c.fillStyle = '#070b09';
  c.beginPath(); c.roundRect(SCR.x - 26, SCR.y - 24, SCR.w + 52, SCR.h + 58, 12); c.fill();
  c.strokeStyle = 'rgba(130,190,155,.20)'; c.lineWidth = 2;
  c.beginPath(); c.roundRect(SCR.x - 26, SCR.y - 24, SCR.w + 52, SCR.h + 58, 12); c.stroke();
  // 屏架
  c.fillStyle = '#0a0f0c'; c.fillRect(SCR.x + SCR.w * .4, SCR.y + SCR.h + 30, SCR.w * .2, 28);
  c.fillRect(SCR.x + SCR.w * .26, SCR.y + SCR.h + 56, SCR.w * .48, 12);
  // 电源灯
  c.fillStyle = 'rgba(90,255,150,.9)'; c.beginPath(); c.arc(SCR.x + SCR.w + 12, SCR.y + SCR.h + 18, 3.6, 0, 7); c.fill();
  FILM.glow(c, SCR.x + SCR.w + 12, SCR.y + SCR.h + 18, 16, '#4dff96', .35);
}

function drawScreen(c, t) {
  drawBezel(c, t);
  // 屏幕内容
  const img = screenCv;
  c.save();
  c.filter = 'blur(5px)'; c.globalAlpha = .30;
  c.drawImage(img, SCR.x - 4, SCR.y - 4, SCR.w + 8, SCR.h + 8);
  c.filter = 'none'; c.globalAlpha = 1;
  c.drawImage(img, SCR.x, SCR.y, SCR.w, SCR.h);
  c.restore();
  // 玻璃反光
  const gl = c.createLinearGradient(SCR.x, SCR.y, SCR.x + SCR.w * .6, SCR.y + SCR.h);
  gl.addColorStop(0, 'rgba(210,255,230,.02)'); gl.addColorStop(.4, 'rgba(220,255,235,.06)'); gl.addColorStop(.55, 'rgba(220,255,235,0)');
  c.fillStyle = gl; c.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
  // 屏幕压暗（四角）
  const vg = c.createRadialGradient(SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, SCR.h * .35, SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, SCR.h * .82);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
  c.fillStyle = vg; c.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
}

function drawDust(c, t) {
  const r = rng('dust');
  c.save(); c.fillStyle = 'rgba(150,255,190,.18)';
  for (let i = 0; i < 40; i++) {
    const x = 700 + r() * 800, y = 640 + ((r() * 360 + t * 18) % 340);
    c.globalAlpha = .10 + .22 * r();
    c.beginPath(); c.arc(x + Math.sin(t * .6 + i) * 8, y, .8 + r() * 1.4, 0, 7); c.fill();
  }
  c.restore();
}

function drawCaption(c, t) {
  const k = soft((t - 9.1) / .6);
  if (k <= 0) return;
  c.save(); c.globalAlpha = k * .85;
  FILM.text(c, 'TRANQUILITY BASE · 1971', { x: 1836, y: 1008, align: 'right', size: 24, color: 'rgba(180,255,205,.80)', weight: 500, tracking: 4 });
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#020403');
  // 屏幕内容：前 4.4 秒打字，之后字符画逐行亮起
  if (t < 4.35) drawTerminalText(c, t); else drawAscii(c, t);
  const cam = FILM.cam(CAM_KEYS, t);
  const shx = (n1(t * 8, 2) - .5) * 5, shy = (n1(t * 6, 3) - .5) * 4;
  c.save(); c.translate(shx, shy);
  FILM.withCam(c, cam, () => {
    drawRoom(c, t);
    drawScreen(c, t);
    drawAstronaut(c, t);
    drawDust(c, t);
  });
  c.restore();
  // 房间整体绿调 + 颗粒 + 暗角
  c.save(); c.globalCompositeOperation = 'multiply';
  c.fillStyle = 'rgba(190,230,200,.10)'; c.fillRect(0, 0, FILM.W, FILM.H); c.restore();
  FILM.grain(c, .14, 2);
  FILM.vignette(c, { inner: .34, outer: .86, a: .60 });
  FILM.letterbox(c, .045, '#000');
  drawCaption(c, t);
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });
