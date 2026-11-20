import { clamp, lerp, seg, ss, eo, eio, spring, mulberry, TAU } from './lib.js';

// 瑞士动态排版（ruishi 管线做法）：纸底 + 黑字 + 一块红，
// 几何先压底、字按行从左进场、横线随进度长出来；一页只有一条规矩被打破，就是红。
// EP25 第六、七句 —— 三样对上 / 差一样就不行。判定页，纯排版，无物件。

const PAPER = '#f4f2ed';
const INK = '#141414';
const RED = '#e2372c';
const GREY = '#8d8b86';

let grain = null;

export function init(W, H) {
  const n = document.createElement('canvas');
  n.width = 540; n.height = 960;
  const nc = n.getContext('2d');
  nc.fillStyle = PAPER; nc.fillRect(0, 0, 540, 960);
  const r = mulberry(2280);
  for (let i = 0; i < 30000; i++) {
    const x = r() * 540, y = r() * 960;
    nc.fillStyle = 'rgba(20,20,20,' + (r() * .028).toFixed(3) + ')';
    nc.fillRect(x, y, 1.1, 1.1);
  }
  grain = n;
}

function txt(c, str, x, y, size, col = INK, align = 'left', weight = 700, ls = -1, alpha = 1) {
  c.save();
  c.globalAlpha *= alpha;
  c.font = weight + ' ' + Math.round(size) + 'px "Helvetica Neue",Helvetica,Arial,"Segoe UI",sans-serif';
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

const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
function lerp2(a, b, t) {
  const pa = hex(a), pb = hex(b), u = clamp(t);
  return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], u))).join(',') + ')';
}

function hr(c, x0, y, x1, p, col = INK, w = 1.6) {
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'butt';
  c.beginPath(); c.moveTo(x0, y); c.lineTo(lerp(x0, x1, clamp(p)), y); c.stroke();
  c.restore();
}

// x,y = 方框左上角；size = 方框边长
function tick(c, x, y, p, col = INK, size = 46, w = 3.4) {
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
  const a = clamp(p * 2), b = clamp(p * 2 - 1);
  if (a > 0) {
    c.beginPath();
    c.moveTo(x + size * .16, y + size * .52);
    c.lineTo(x + size * .16 + size * .26 * a, y + size * .52 + size * .28 * a);
    c.stroke();
  }
  if (b > 0) {
    c.beginPath();
    c.moveTo(x + size * .42, y + size * .80);
    c.lineTo(x + size * .42 + size * .46 * b, y + size * .80 - size * .62 * b);
    c.stroke();
  }
  c.restore();
}

function cross(c, x, y, p, col = RED, size = 46, w = 3.4) {
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  const a = clamp(p * 1.4), b = clamp(p * 1.4 - .4);
  if (a > 0) {
    c.beginPath();
    c.moveTo(x + size * .14, y + size * .14);
    c.lineTo(x + size * .14 + size * .72 * a, y + size * .14 + size * .72 * a);
    c.stroke();
  }
  if (b > 0) {
    c.beginPath();
    c.moveTo(x + size * .86, y + size * .14);
    c.lineTo(x + size * .86 - size * .72 * b, y + size * .14 + size * .72 * b);
    c.stroke();
  }
  c.restore();
}

export function paint(ctx, t, W, H) {
  const S = W / 1080;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .92; ctx.drawImage(grain, 0, 0, W, H); ctx.restore();

  const X = 82 * S;
  const RW = W - X * 2;

  // 顶部红块（从右滑入）
  const bp = seg(t, 0.05, 0.55);
  if (bp > 0) {
    const bw = 300 * S, bh = 132 * S;
    const bx = lerp(W, W - bw - 62 * S, eo(bp));
    ctx.save();
    ctx.fillStyle = RED;
    ctx.beginPath(); ctx.rect(bx, 122 * S, bw, bh); ctx.fill();
    ctx.restore();
    txt(ctx, '02', bx + 26 * S, 188 * S, 64 * S, PAPER, 'left', 700, -2, seg(bp, .4, 1));
  }

  // 标题
  const tp = seg(t, 0.18, 0.62);
  ctx.save();
  ctx.globalAlpha = tp;
  ctx.translate(0, (1 - eo(tp)) * 22 * S);
  txt(ctx, 'THE THREE NUMBERS', X, 176 * S, 30 * S, GREY, 'left', 500, 2);
  txt(ctx, 'WILL IT FIT', X, 236 * S, 56 * S, INK, 'left', 700, -1.5);
  ctx.restore();
  hr(ctx, X, 292 * S, X + RW, seg(t, .35, .75), INK, 2.4);

  // 三行清单
  const rows = [
    { no: '01', name: 'WIDTH', sub: 'FRAME' },
    { no: '02', name: 'TUBE', sub: 'Ø 22 – 25' },
    { no: '03', name: 'HEIGHT', sub: 'CLEARANCE' },
  ];
  const RY = [672, 858, 1044];
  const inT = [[.45, .80], [1.02, 1.36], [1.58, 1.92]];
  const tickT = [[.82, 1.04], [1.38, 1.60], [1.94, 2.16]];
  // 07 阶段：第二行变红划掉
  const rp = seg(t, 3.90, 4.45);
  const cp = seg(t, 4.20, 4.62);

  rows.forEach((r, i) => {
    const y = RY[i] * S;
    const p = seg(t, inT[i][0], inT[i][1]);
    if (p <= 0) return;
    const dx = -34 * S * (1 - eo(p));
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(dx, 0);
    const isRed = i === 1 && rp > 0;
    const col = isRed ? lerp2(INK, RED, rp) : INK;
    txt(ctx, r.no, X, y, 26 * S, isRed ? RED : GREY, 'left', 500, 1);
    txt(ctx, r.name, X + 58 * S, y, 46 * S, col, 'left', 700, -1);
    // 名称后的副标（右对齐到横线末端）
    txt(ctx, r.sub, X + RW - 106 * S, y + 2 * S, 24 * S, isRed ? RED : GREY, 'right', 500, 1);
    // 勾选框
    const bx = X + RW - 66 * S;
    ctx.strokeStyle = isRed ? RED : INK; ctx.lineWidth = 2;
    ctx.strokeRect(bx, y - 24 * S, 46 * S, 46 * S);
    ctx.restore();

    // 勾
    const tk = seg(t, tickT[i][0], tickT[i][1]);
    if (tk > 0 && !(i === 1 && cp > 0)) {
      tick(ctx, X + RW - 66 * S, y - 24 * S, tk, isRed ? RED : INK, 46 * S, 3.4);
    }
    // 07：红叉盖住勾 + 划掉名称
    if (i === 1) {
      if (cp > 0) cross(ctx, X + RW - 66 * S, y - 24 * S, cp, RED, 46 * S, 3.6);
      if (rp > .5) {
        const st = seg(rp, .5, 1);
        hr(ctx, X + 52 * S, y - 1 * S, X + 52 * S + 250 * S, st, RED, 3.2);
      }
    }
    // 行线
    hr(ctx, X, y + 46 * S, X + RW, seg(t, inT[i][0] + .12, inT[i][1] + .18), isRed ? RED : INK, isRed ? 3 : 1.4);
  });

  // 结论：IT FITS.（06）→ 被红线划掉；NO FIT.（07）
  const fp = seg(t, 2.28, 2.92);
  if (fp > 0) {
    ctx.save();
    ctx.globalAlpha = fp * (1 - seg(t, 4.58, 4.92));
    const sc = lerp(1.06, 1, eo(fp));
    ctx.translate(X, 1290 * S);
    ctx.scale(sc, sc);
    txt(ctx, 'IT FITS.', 0, 0, 96 * S, INK, 'left', 700, -3);
    ctx.restore();
    hr(ctx, X, 1348 * S, X + RW, seg(t, 2.45, 2.90), RED, 8);
  }

  const np = seg(t, 4.62, 5.15);
  if (np > 0) {
    // 先划掉 IT FITS.
    const sp = seg(t, 4.55, 4.85);
    if (sp > 0) { ctx.save(); ctx.globalAlpha = (1 - np * .95) * sp; hr(ctx, X - 6 * S, 1272 * S, X + 430 * S, sp, RED, 6); ctx.restore(); }
    ctx.save();
    ctx.globalAlpha = np;
    const sc = lerp(1.14, 1, eo(np));
    ctx.translate(X, 1290 * S);
    ctx.scale(sc, sc);
    txt(ctx, 'NO FIT.', 0, 0, 96 * S, RED, 'left', 700, -3);
    ctx.restore();
  }

  // 底注
  txt(ctx, 'MISS ONE  —  I SAY NO', X, 1432 * S, 22 * S, GREY, 'left', 500, 2, seg(t, 4.9, 5.4));
}
