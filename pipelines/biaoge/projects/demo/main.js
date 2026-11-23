// biaoge · 表格 · 藏起来的列
// 一张深色的数据表。合计那一行在往上走，可是把藏起来的列打开，
// 两组客户各自都在往下走 —— 辛普森悖论。
const canvas = document.getElementById('c');
const ENV = FILM.page(canvas);
const { soft, lerp, clamp, rng } = FILM;
const W = 1920, H = 1080;

const r = rng('biaoge');
const ROWS = [];
for (let i = 0; i < 9; i++) {
  ROWS.push({
    name: ['华东 A', '华东 B', '华南 A', '华南 B', '华北 A', '西南 A', '线上 1', '线上 2', '海外'][i],
    g: i < 5 ? 0 : 1,
    n: 120 + Math.floor(r() * 800),
    ctr: (1.2 + r() * .9).toFixed(1),
    conv: (2.4 + r() * 1.4).toFixed(1),
    rev: (18 + r() * 30).toFixed(0),
  });
}

const PANEL = { x: 120, y: 96, w: 1680, h: 888 };
const TB = { x: PANEL.x + 40, y: PANEL.y + 116, cw: 178, rh: 58 };
const CH = { x: PANEL.x + 1000, y: PANEL.y + 130, w: 600, h: 440 };

function chrome(c, t) {
  // 背景
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#070d14'); bg.addColorStop(1, '#0b1420');
  c.fillStyle = bg; c.fillRect(0, 0, W, H);
  // 面板
  c.save();
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 24;
  c.fillStyle = '#0d1622';
  c.beginPath(); c.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 18); c.fill();
  c.restore();
  c.strokeStyle = 'rgba(90,150,210,.22)'; c.lineWidth = 1.5;
  c.beginPath(); c.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 18); c.stroke();
  // 头部
  c.fillStyle = 'rgba(255,255,255,.03)';
  c.beginPath(); c.roundRect(PANEL.x, PANEL.y, PANEL.w, 74, 18); c.fill();
  c.fillRect(PANEL.x, PANEL.y + 52, PANEL.w, 22);
  c.fillStyle = '#7fd6ff'; c.beginPath(); c.arc(PANEL.x + 38, PANEL.y + 37, 7, 0, 7); c.fill();
  FILM.text(c, 'Q3 · 客户投放复盘', { x: PANEL.x + 58, y: PANEL.y + 46, size: 24, color: 'rgba(226,238,250,.9)', weight: 600, tracking: 1 });
  FILM.text(c, '9 个账户 · 21 天', { x: PANEL.x + PANEL.w - 40, y: PANEL.y + 46, align: 'right', size: 17, color: 'rgba(130,170,210,.7)', weight: 400, tracking: 2 });
}

function table(c, t) {
  const cols = ['账户', '花费', 'CTR', 'CVR', 'ROAS'];
  const reveal = soft((t - 4.6) / .6);
  // 表头
  cols.forEach((s, i) => {
    FILM.text(c, s, { x: TB.x + 24 + i * TB.cw, y: TB.y, size: 17, color: 'rgba(120,160,205,.75)', weight: 500, tracking: 3 });
  });
  c.strokeStyle = 'rgba(90,140,190,.22)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(TB.x, TB.y + 20); c.lineTo(TB.x + TB.cw * 5 - 20, TB.y + 20); c.stroke();
  // 行
  ROWS.forEach((row, ri) => {
    const y = TB.y + 44 + ri * TB.rh;
    const revealRow = soft((t - .6 - ri * .28) / .5);
    if (revealRow <= 0) return;
    c.save(); c.globalAlpha = revealRow;
    if (ri % 2 === 0) { c.fillStyle = 'rgba(255,255,255,.022)'; c.fillRect(TB.x - 10, y, TB.cw * 5 - 12, TB.rh - 6); }
    FILM.text(c, row.name, { x: TB.x + 24, y: y + 30, size: 20, color: 'rgba(210,226,242,.92)', weight: 500 });
    const vals = [row.n.toLocaleString(), row.ctr + '%', row.conv + '%', (row.rev * 100).toLocaleString()];
    vals.forEach((v, i) => {
      FILM.text(c, v, { x: TB.x + 24 + (i + 1) * TB.cw, y: y + 34, size: 20, color: 'rgba(150,190,225,.8)', weight: 400 });
    });
    // 客群：前期是一团，后面才分开
    if (reveal > 0) {
      c.save(); c.globalAlpha = revealRow * reveal;
      c.fillStyle = row.g ? 'rgba(255,150,120,.85)' : 'rgba(120,220,255,.85)';
      c.beginPath(); c.arc(TB.x + 14, y + 46, 3, 0, 7); c.fill();
      FILM.text(c, row.g ? '高客单' : '低客单', { x: TB.x + 24, y: y + 51, size: 12, color: row.g ? 'rgba(255,160,132,.7)' : 'rgba(130,220,255,.7)' });
      c.restore();
    }
    c.restore();
  });
  // 隐藏列的那一列的问号
  if (reveal < 1) {
    for (let i = 0; i < 6; i++) {
      FILM.text(c, '?', { x: TB.x + 24 + 5 * TB.cw + 10, y: TB.y + 44 + i * TB.rh + 34, size: 20, color: `rgba(255,210,120,${.25 + .25 * Math.sin(t * 4 + i)})` });
    }
  }
  // 合计行
  const sumY = TB.y + 44 + 9 * TB.rh + 10;
  c.fillStyle = 'rgba(120,200,255,.06)'; c.fillRect(TB.x - 10, sumY, TB.cw * 5 - 12, 56);
  FILM.text(c, '合计', { x: TB.x + 24, y: sumY + 36, size: 20, color: 'rgba(190,230,255,.9)', weight: 600 });
  FILM.text(c, '3,148', { x: TB.x + 24 + TB.cw, y: sumY + 36, size: 20, color: 'rgba(190,230,255,.9)', weight: 500 });
  FILM.text(c, '1.6%', { x: TB.x + 24 + TB.cw * 2, y: sumY + 36, size: 20, color: 'rgba(190,230,255,.9)' });
  FILM.text(c, '3.1%', { x: TB.x + 24 + TB.cw * 3, y: sumY + 36, size: 20, color: 'rgba(190,230,255,.9)' });
  FILM.text(c, '31', { x: TB.x + 24 + TB.cw * 4, y: sumY + 36, size: 20, color: 'rgba(190,230,255,.9)' });
}

function chart(c, t) {
  const { x, y, w, h } = CH;
  c.save();
  c.fillStyle = 'rgba(12,22,34,.7)';
  c.beginPath(); c.roundRect(x, y, w, h, 12); c.fill();
  c.strokeStyle = 'rgba(90,150,210,.18)'; c.lineWidth = 1;
  c.beginPath(); c.roundRect(x, y, w, h, 12); c.stroke();
  // 网格
  for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(x + 56, y + h * i / 5); c.lineTo(x + w - 24, y + h * i / 5); c.stroke(); }
  FILM.text(c, 'ROAS', { x: x + 24, y: y + 30, size: 14, color: 'rgba(120,160,205,.6)', tracking: 3 });
  // 合计线：往上
  const agg = soft((t - 4.4) / 1.6);
  if (agg > 0) {
    c.save(); c.globalAlpha = agg;
    c.strokeStyle = 'rgba(120,220,255,.95)'; c.lineWidth = 4;
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const k = i / 20, px = x + 56 + k * (w - 90), py = y + h - 60 - (18 + 90 * k) * clamp(agg * 1.6 - k * .6);
      i ? c.lineTo(px, py) : c.moveTo(px, py);
    }
    c.stroke();
    c.shadowColor = 'rgba(120,220,255,.8)'; c.shadowBlur = 18; c.stroke();
    c.restore();
  }
  // 两条分组线：往下，最后交叉
  const grp = soft((t - 7.0) / 1.6);
  if (grp > 0) {
    const draw = (col, off, slope) => {
      c.save(); c.globalAlpha = grp;
      c.strokeStyle = col; c.lineWidth = 3;
      c.beginPath();
      for (let i = 0; i <= 20; i++) {
        const k = i / 20, px = x + 56 + k * (w - 90), py = y + h - 60 - (86 + off - slope * k) * clamp(grp * 1.8 - k * .8);
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
      c.shadowColor = col; c.shadowBlur = 14; c.stroke();
      c.restore();
    };
    draw('rgba(255,140,110,.9)', 6, 34);
    draw('rgba(170,130,255,.9)', -22, 26);
  }
  // 标注
  const note = soft((t - 8.6) / .7);
  if (note > 0) {
    c.save(); c.globalAlpha = note;
    FILM.text(c, '合在一起是涨的', { x: x + w - 24, y: y + 44, align: 'right', size: 16, color: 'rgba(130,225,255,.9)' });
    FILM.text(c, '分开看都在跌', { x: x + w - 24, y: y + h - 26, align: 'right', size: 16, color: 'rgba(255,160,130,.9)' });
    c.restore();
  }
  c.restore();
}

function frame(t) {
  const c = ENV.ctx;
  ENV.reset('#080d14');
  const camZ = 1.02 + soft(t / 10) * .05;
  c.save();
  c.translate(960, 540); c.scale(camZ, camZ); c.translate(-960, -540);
  chrome(c, t);
  table(c, t);
  chart(c, t);
  // 备注卡
  const note = soft((t - 8.8) / .7);
  if (note > 0) {
    c.save(); c.globalAlpha = note;
    const nx = PANEL.x + 1010, ny = PANEL.y + 610, nw = 580, nh = 120;
    c.fillStyle = 'rgba(255,255,255,.035)';
    c.beginPath(); c.roundRect(nx, ny, nw, nh, 10); c.fill();
    c.strokeStyle = 'rgba(255,200,120,.28)'; c.lineWidth = 1;
    c.beginPath(); c.roundRect(nx, ny, nw, nh, 10); c.stroke();
    FILM.text(c, '合计在涨，是因为高客单的占比变了 ——', { x: nx + 24, y: ny + 44, size: 18, color: 'rgba(238,226,200,.85)' });
    FILM.text(c, '两组各自的转化，其实都在往下走。', { x: nx + 24, y: ny + 76, size: 18, color: 'rgba(238,226,200,.65)' });
    c.restore();
  }
  // 指针：点开那一列
  const click = soft((t - 3.9) / .5) * (1 - soft((t - 5.2) / .6) * .7);
  const mx = lerp(1560, TB.x + 24 + 5 * TB.cw + 30, click);
  const my = lerp(760, TB.y + 60, click);
  c.save(); c.globalAlpha = .9;
  c.fillStyle = '#ffffff';
  c.beginPath(); c.moveTo(mx, my); c.lineTo(mx + 26, my + 34); c.lineTo(mx + 12, my + 36); c.lineTo(mx + 20, my + 52); c.lineTo(mx + 10, my + 56); c.lineTo(mx + 2, my + 40); c.lineTo(mx - 4, my + 48); c.closePath(); c.fill();
  c.restore();
  // 点击的涟漪
  const rip = soft((t - 4.2) / .8);
  if (rip > 0 && rip < 1) {
    c.strokeStyle = `rgba(255,210,120,${.6 * (1 - rip)})`; c.lineWidth = 3;
    c.beginPath(); c.arc(TB.x + 24 + 5 * TB.cw + 30, TB.y + 60, 16 + rip * 70, 0, 7); c.stroke();
  }
  c.restore();
  FILM.grain(c, .07, 71);
  FILM.vignette(c, { inner: .42, outer: .98, a: .42 });
}

window.renderAt = (t) => frame(t);
frame(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { frame(0); window.__ready = true; });




