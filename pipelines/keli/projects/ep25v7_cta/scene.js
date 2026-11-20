import { clamp, lerp, seg, ss, eo, eio, spring, mulberry, TAU } from './lib.js';

// 扁平颗粒（keli 管线做法）：暖纸 + 两色专色，体积与阴影全靠网点颗粒，
// 色块一律平涂，错版留一点偏移。EP25 第十句 —— 发我一句 FIT，一张车间纸标签。

const PAPER = '#e9dcbf';
const PAPER2 = '#f7eed8';
const INK = '#1f3b32';     // 专色一：墨绿
const RED = '#c0492f';     // 专色二：砖红
const GREY = '#8d7f66';

let grain = null;
let stipple = null;

export function init(W, H) {
  const n = document.createElement('canvas');
  n.width = 540; n.height = 960;
  const nc = n.getContext('2d');
  nc.fillStyle = PAPER; nc.fillRect(0, 0, 540, 960);
  const r = mulberry(5519);
  for (let i = 0; i < 42000; i++) {
    const x = r() * 540, y = r() * 960;
    nc.fillStyle = 'rgba(31,59,50,' + (r() * .05).toFixed(3) + ')';
    nc.fillRect(x, y, 1.2, 1.2);
  }
  grain = n;

  // 网点（专色印刷的颗粒）
  const s = document.createElement('canvas');
  s.width = 480; s.height = 480;
  const sc = s.getContext('2d');
  const rr = mulberry(8807);
  for (let y = 0; y < 480; y += 7) {
    for (let x = 0; x < 480; x += 7) {
      const a = .25 + rr() * .5;
      const rad = 1 + rr() * 1.4;
      sc.fillStyle = 'rgba(31,59,50,' + a.toFixed(2) + ')';
      sc.beginPath(); sc.arc(x + (rr() - .5) * 2, y + (rr() - .5) * 2, rad, 0, TAU); sc.fill();
    }
  }
  stipple = s;
}

function txt(c, str, x, y, size, col, align = 'left', weight = 800, ls = 0, alpha = 1) {
  c.save();
  c.globalAlpha *= alpha;
  c.font = weight + ' ' + Math.round(size) + 'px "Arial Black","Helvetica Neue",Arial,"Segoe UI",sans-serif';
  c.textBaseline = 'middle';
  c.fillStyle = col;
  let w = 0; const ws = [];
  for (const ch of str) { const m = c.measureText(ch).width; ws.push(m); w += m + ls; }
  w -= ls;
  const start = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  let px = start; c.textAlign = 'left';
  for (let i = 0; i < str.length; i++) { c.fillText(str[i], px, y); px += ws[i] + ls; }
  c.restore();
  return w;
}

export function paint(ctx, t, W, H) {
  const S = W / 1080;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .9; ctx.drawImage(grain, 0, 0, W, H); ctx.restore();

  // 平涂的大色块（右上角一块砖红，压住构图）
  const bp = seg(t, 0.0, 0.28);
  if (bp > 0) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = RED;
    const w = 300 * S, h = 210 * S;
    const x = lerp(W, W - w, eo(bp));
    ctx.fillRect(x, 0, w, h);
    ctx.restore();
    // 色块上的网点（体积）
    ctx.save();
    ctx.globalAlpha = .30 * bp;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(stipple, x, 0, w, h);
    ctx.restore();
  }

  // 标签：阴影（网点块，硬边）
  const drop = spring(seg(t, 0.06, 0.50), 10, .34);
  const ty = lerp(-260 * S, 692 * S, drop);
  const LX = 186 * S, LW = 708 * S, LH = 780 * S;
  const lx = LX, ly = ty;

  // 阴影
  ctx.save();
  ctx.globalAlpha = .55 * drop;
  ctx.fillStyle = '#6b5f47';
  ctx.fillRect(lx + 22 * S, ly + 30 * S, LW, LH);
  ctx.globalAlpha = .35 * drop;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(stipple, lx + 22 * S, ly + 30 * S, LW, LH);
  ctx.restore();

  // 标签纸
  ctx.save();
  ctx.globalAlpha = clamp(drop * 1.2);
  ctx.fillStyle = PAPER2;
  ctx.fillRect(lx, ly, LW, LH);
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.strokeRect(lx, ly, LW, LH);
  // 边缘微小错版（砖红细边）
  ctx.globalAlpha = .35 * drop;
  ctx.strokeStyle = RED; ctx.lineWidth = 1.4;
  ctx.strokeRect(lx + 4 * S, ly - 3 * S, LW, LH);
  ctx.restore();

  // 挂绳（两孔 + 两个斜线）
  const sp = seg(t, 0.30, 0.62);
  if (sp > 0) {
    ctx.save();
    ctx.globalAlpha = sp;
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(lx + LW * .30, ly); ctx.lineTo(W * .5 - 30 * S, 300 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lx + LW * .70, ly); ctx.lineTo(W * .5 + 30 * S, 300 * S); ctx.stroke();
    ctx.beginPath(); ctx.arc(W * .5, 292 * S, 46 * S, Math.PI * .15, Math.PI * .85, true); ctx.stroke();
    // 孔
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(lx + LW * .30, ly + 16 * S, 9 * S, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(lx + LW * .70, ly + 16 * S, 9 * S, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // 标签内容
  const cp = seg(t, 0.38, 0.72);
  if (cp > 0) {
    txt(ctx, 'WORKS WITH ANY CHAIR', lx + LW / 2, ly + 116 * S, 28 * S, GREY, 'center', 800, 3, cp);
    ctx.save(); ctx.globalAlpha = cp;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx + 70 * S, ly + 156 * S); ctx.lineTo(lx + LW - 70 * S, ly + 156 * S); ctx.stroke();
    ctx.restore();
  }

  // 大字 FIT：先砖红错版（+8,-6），再墨绿压上
  const fp = seg(t, 0.46, 0.92);
  if (fp > 0) {
    const sc = lerp(1.08, 1, eo(fp));
    ctx.save();
    ctx.translate(lx + LW / 2, ly + 356 * S);
    ctx.scale(sc, sc);
    ctx.globalAlpha = .85 * fp;
    txt(ctx, 'FIT', 10 * S, -8 * S, 190 * S, RED, 'center', 900, -2);
    ctx.globalAlpha = fp;
    txt(ctx, 'FIT', 0, 0, 190 * S, INK, 'center', 900, -2);
    ctx.restore();
  }

  // 下部分隔线 + MESSAGE ME + 箭头
  const mp = seg(t, 0.80, 1.15);
  if (mp > 0) {
    ctx.save(); ctx.globalAlpha = mp;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx + 60 * S, ly + 522 * S); ctx.lineTo(lx + LW - 60 * S, ly + 522 * S); ctx.stroke();
    ctx.restore();
    txt(ctx, 'MESSAGE ME', lx + 60 * S, ly + 604 * S, 42 * S, INK, 'left', 800, 2, mp);
    // 箭头
    const ax = lx + LW - 150 * S, ay = ly + 604 * S;
    const ap = seg(t, 0.95, 1.25);
    ctx.save();
    ctx.globalAlpha = ap;
    ctx.strokeStyle = RED; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax - 60 * S, ay); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 22 * S, ay - 18 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - 22 * S, ay + 18 * S); ctx.stroke();
    ctx.restore();
  }

  // 底部小字
  txt(ctx, 'EP25  ·  WILL IT FIT', lx + 60 * S, ly + LH - 66 * S, 22 * S, GREY, 'left', 800, 2, seg(t, 1.05, 1.40));

  // 全片网点（最后压一层，统一颗粒）
  ctx.save();
  ctx.globalAlpha = .16;
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(stipple, 0, 0, W, H);
  ctx.restore();
}
