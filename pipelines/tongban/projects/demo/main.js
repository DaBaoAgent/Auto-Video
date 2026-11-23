// tongban · 铜版画（雕版/蚀刻：奶油纸 + 赭墨细排线，明暗全靠交叠的线）
// 场景《台风前的海堤》：排线堆出来的阴天，黑海翻白浪，堤上的灯和人被风压着；白线就是光。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:tongban:v5' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const PAPER = '#efe4cd';
const INK = '#241608';

function lineTile(ang, gap, lw, rgb, alpha) {
  const s = 72;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  g.strokeStyle = `rgba(${rgb},${alpha})`;
  g.lineWidth = lw;
  g.save();
  g.translate(s / 2, s / 2);
  g.rotate(ang);
  for (let d = -s; d <= s * 2; d += gap) { g.beginPath(); g.moveTo(-s, d); g.lineTo(s, d); g.stroke(); }
  g.restore();
  return cv;
}
const H_A = ctx.createPattern(lineTile(0.02, 5, 1.5, '36,22,8', 0.52), 'repeat');   // 横细线
const H_B = ctx.createPattern(lineTile(-0.95, 6, 1.3, '36,22,8', 0.46), 'repeat');   // 交叉
const H_C = ctx.createPattern(lineTile(0.02, 8, 2.6, '36,22,8', 0.7), 'repeat');     // 粗横
const H_D = ctx.createPattern(lineTile(0.7, 7, 1.4, '36,22,8', 0.4), 'repeat');

const BAR = { x: 150, y: 96, w: 1620, h: 900 };
const CEN = { x: 960, y: 540 };

function tone(pats, build, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.beginPath(); build();
  (Array.isArray(pats) ? pats : [pats]).forEach((p) => { ctx.fillStyle = p; ctx.fill(); });
  ctx.restore();
}

// 浪脊：一条白刻线 + 下面若干短刻
function crest(x0, y, len, amp, t, seed) {
  ctx.strokeStyle = 'rgba(239,228,205,1)';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  for (let k = 0; k <= 20; k++) {
    const q = k / 20;
    const x = x0 + q * len;
    const yy = y + Math.sin(q * Math.PI) * -amp + Math.sin(t * 3 + seed) * 2;
    k ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(239,228,205,0.4)';
  ctx.lineWidth = 1.4;
  for (let k = 0; k < 7; k++) {
    const q = 0.12 + k * 0.12;
    const x = x0 + q * len;
    const yy = y + Math.sin(q * Math.PI) * -amp;
    ctx.beginPath(); ctx.moveTo(x, yy + 4); ctx.lineTo(x + 10, yy + 12 + k % 3 * 3); ctx.stroke();
  }
}

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  {
    const g = ctx.createRadialGradient(CEN.x, CEN.y, 60, CEN.x, CEN.y, 1150);
    g.addColorStop(0, 'rgba(255,250,236,0.92)');
    g.addColorStop(0.7, 'rgba(232,216,188,0.34)');
    g.addColorStop(1, 'rgba(178,155,124,0.58)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.strokeStyle = 'rgba(140,116,88,0.12)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 140; i++) {
    const x = ((i * 733) % W), y = ((i * 449) % H), l = 12 + (i % 7) * 9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y + (i % 3) - 1); ctx.stroke();
  }

  ctx.save();
  ctx.beginPath(); ctx.rect(BAR.x, BAR.y, BAR.w, BAR.h); ctx.clip();

  const HZ = 470;   // 海平线

  // ---------- 天：越往上越压得低 ----------
  tone(H_A, () => ctx.rect(BAR.x, BAR.y, BAR.w, HZ), 1);
  ctx.save();
  ctx.beginPath(); ctx.rect(BAR.x, BAR.y, BAR.w, HZ); ctx.clip();
  ctx.globalAlpha = 0.7; ctx.fillStyle = H_B; ctx.fillRect(BAR.x, BAR.y, BAR.w, 230);
  ctx.globalAlpha = 0.55; ctx.fillStyle = H_C; ctx.fillRect(BAR.x, BAR.y, BAR.w, 120);
  ctx.restore();
  // 低云：几条横向的厚排线带，被风推着走
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = H_C;
  [[-260, 214, 900, 62], [280, 286, 1080, 44], [820, 372, 980, 34]].forEach(([x0, y0, w, h], i) => {
    const dx = Math.sin(t * 0.35 + i) * 26 + i * 10;
    ctx.beginPath();
    ctx.ellipse(x0 + w / 2 + dx, y0, w / 2, h / 2, -0.03, 0, TAU);
    ctx.fill();
  });
  ctx.restore();

  // ---------- 海：排线堆出来的深灰，不是实黑 ----------
  tone([H_B, H_C], () => ctx.rect(BAR.x, HZ - 6, BAR.w, BAR.y + BAR.h - HZ + 20), 0.92);
  // 海面：白刻线一层层往左跑
  for (let i = 0; i < 9; i++) {
    const y = HZ + 16 + i * 30;
    const len = 420 + i * 60;
    const x0 = 1500 - ((t * (18 + i * 3) + i * 260) % 1700) + i * 40;
    crest(x0, y, len, 12 + i * 2, t, i);
    crest(x0 - 900, y + 6, len * 0.8, 10 + i * 2, t, i + 9);
  }
  // 远处浪花（小点子）
  ctx.fillStyle = 'rgba(239,228,205,0.55)';
  for (let i = 0; i < 70; i++) {
    const x = BAR.x + ((i * 197 + t * 20) % BAR.w);
    const y = HZ + 10 + ((i * 53) % 120);
    ctx.beginPath(); ctx.arc(x, y, 1.6 + (i % 3), 0, TAU); ctx.fill();
  }

  // ---------- 海堤（左下往右上的斜块） ----------
  const DY = 905;
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.moveTo(BAR.x - 20, BAR.y + BAR.h + 20);
  ctx.lineTo(BAR.x - 20, 760);
  ctx.lineTo(560, 742);
  ctx.lineTo(1180, 806);
  ctx.lineTo(1620, 860);
  ctx.lineTo(BAR.x + BAR.w + 20, 900);
  ctx.lineTo(BAR.x + BAR.w + 20, BAR.y + BAR.h + 20);
  ctx.closePath(); ctx.fill();
  // 堤面上的石块接缝（白刻）+ 排线明暗
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(BAR.x - 20, BAR.y + BAR.h + 20);
  ctx.lineTo(BAR.x - 20, 760); ctx.lineTo(560, 742); ctx.lineTo(1180, 806); ctx.lineTo(1620, 860);
  ctx.lineTo(BAR.x + BAR.w + 20, 900); ctx.lineTo(BAR.x + BAR.w + 20, BAR.y + BAR.h + 20);
  ctx.closePath(); ctx.clip();
  ctx.strokeStyle = 'rgba(239,228,205,0.42)';
  ctx.lineWidth = 1.6;
  for (let r = 0; r < 7; r++) {
    const y0 = 770 + r * 26;
    for (let c = 0; c < 16; c++) {
      const x0 = BAR.x - 40 + c * 108 + (r % 2) * 54;
      ctx.beginPath();
      ctx.moveTo(x0, y0 + (x0 - 600) * 0.11);
      ctx.lineTo(x0 + 96, y0 + (x0 + 96 - 600) * 0.11);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0 + 96, y0 + (x0 + 96 - 600) * 0.11);
      ctx.lineTo(x0 + 92, y0 + 26 + (x0 + 92 - 600) * 0.11);
      ctx.stroke();
    }
  }
  // 堤顶受光：一道白
  ctx.strokeStyle = 'rgba(239,228,205,0.8)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(BAR.x - 20, 760); ctx.lineTo(560, 742); ctx.lineTo(1180, 806); ctx.lineTo(1620, 860);
  ctx.stroke();
  ctx.restore();
  // 浪打在堤脚：白色喷溅
  {
    ctx.fillStyle = 'rgba(239,228,205,0.7)';
    for (let i = 0; i < 26; i++) {
      const ph = (t * 0.9 + i / 26) % 1;
      const x = 600 + i * 44;
      const y = 748 + (x - 600) * 0.1 - ph * 70;
      ctx.globalAlpha = 0.72 * (1 - ph);
      ctx.beginPath(); ctx.arc(x + Math.sin(i) * 16, y, 2 + 3 * (1 - ph), 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- 灯柱 ----------
  {
    const lx = 700, ly = 758;
    ctx.fillStyle = INK;
    ctx.fillRect(lx - 9, ly - 300, 18, 300);
    ctx.beginPath();
    ctx.moveTo(lx - 9, ly - 300); ctx.lineTo(lx, ly - 356); ctx.lineTo(lx + 9, ly - 300);
    ctx.closePath(); ctx.fill();
    // 灯罩 + 灯
    ctx.beginPath();
    ctx.moveTo(lx - 30, ly - 352); ctx.lineTo(lx + 30, ly - 352);
    ctx.lineTo(lx + 16, ly - 396); ctx.lineTo(lx - 16, ly - 396);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(lx, ly - 356, 15, 0, TAU); ctx.fill();
    // 灯光：把排线冲淡的一团暖光
    const flick = 0.86 + 0.14 * Math.sin(t * 9);
    const lg = ctx.createRadialGradient(lx, ly - 360, 8, lx, ly - 360, 210 * flick);
    lg.addColorStop(0, 'rgba(255,247,216,0.95)');
    lg.addColorStop(0.42, 'rgba(255,238,190,0.42)');
    lg.addColorStop(1, 'rgba(255,238,190,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, ly - 360, 210 * flick, 0, TAU); ctx.fill();
  }

  // ---------- 堤上的人（雨衣 + 帽，衣角被风掀起） ----------
  {
    const bx = 1040, by = 800;
    const gust = Math.sin(t * 2.2) * 0.5 + 0.5;
    ctx.save();
    ctx.translate(bx, by);
    ctx.fillStyle = INK;
    // 雨衣（下摆被风掀起）
    ctx.beginPath();
    ctx.moveTo(-36, -148); ctx.lineTo(30, -148);
    ctx.quadraticCurveTo(48, -80, 66 + gust * 30, -30 - gust * 14);
    ctx.lineTo(20, -22); ctx.lineTo(10, -70); ctx.lineTo(-6, -24);
    ctx.quadraticCurveTo(-40, -60, -44, -110);
    ctx.closePath(); ctx.fill();
    // 雨衣白刻褶
    ctx.strokeStyle = 'rgba(239,228,205,0.5)';
    ctx.lineWidth = 2;
    [[-18, -140, -22, -40], [4, -140, 8, -60], [22, -138, 38, -44]].forEach(([x0, y0, x1, y1]) => {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    });
    // 腿
    ctx.fillStyle = INK;
    ctx.fillRect(-20, -24, 15, 26);
    ctx.fillRect(12, -24, 15, 26);
    // 手臂（抓着堤栏）
    ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-30, -126); ctx.lineTo(-6, -70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26, -126); ctx.lineTo(44, -64); ctx.stroke();
    // 头 + 雨帽
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(-2, -170, 21, 0, TAU); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-46, -178); ctx.quadraticCurveTo(-2, -212, 42, -178);
    ctx.lineTo(34, -172); ctx.quadraticCurveTo(-2, -198, -38, -172);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // ---------- 海鸥 ----------
  [[1180, 300, 1.0, 1.1], [1300, 262, 0.72, 1.5]].forEach(([bx, by, s, ph], i) => {
    const x = bx + Math.sin(t * 0.9 * ph + i) * 60 - t * 8;
    const y = by + Math.cos(t * 0.7 * ph + i) * 10;
    const f = Math.sin(t * 4.4 * ph + i * 2);
    ctx.save();
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = INK; ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-26, 4); ctx.quadraticCurveTo(-8, -10 - f * 12, 4, 2);
    ctx.moveTo(4, 2); ctx.quadraticCurveTo(18, -10 - f * 12, 34, -2);
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();

  // 画框双线
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(BAR.x, BAR.y, BAR.w, BAR.h);
  ctx.lineWidth = 1.4;
  ctx.strokeRect(BAR.x + 10, BAR.y + 10, BAR.w - 20, BAR.h - 20);

  const vg = ctx.createRadialGradient(CEN.x, CEN.y, 380, CEN.x, CEN.y, 1180);
  vg.addColorStop(0, 'rgba(56,34,16,0)');
  vg.addColorStop(1, 'rgba(56,34,16,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
