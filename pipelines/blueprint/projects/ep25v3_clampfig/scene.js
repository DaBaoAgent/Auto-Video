import { clamp, lerp, seg, ss, eo, eio, spring, mulberry, TAU } from './lib.js';

// 蓝晒工程图（blueprint 管线做法）：深蓝图纸、纸纹、细网格；
// 可见边白实线、隐藏边淡青虚线、中心线点划线；
// 尺寸线带箭头与字，leader 末端编号气球；唯一强调色是一支红铅笔。
// EP25 第三句 —— 车架宽度与夹具落点。物件叙事，无人物。

const LINE = '#e9f4ff';
const DIM = '#9cc6e4';
const GRID = 'rgba(150,200,240,.13)';
const GRID_MAJ = 'rgba(170,215,250,.22)';
const RED = '#e0483c';

let grain = null;

export function init(W, H) {
  const n = document.createElement('canvas');
  n.width = 540; n.height = 960;
  const nc = n.getContext('2d');
  const g = nc.createRadialGradient(250, 430, 130, 250, 430, 720);
  g.addColorStop(0, '#0f3d68');
  g.addColorStop(.55, '#0b2c50');
  g.addColorStop(1, '#07203a');
  nc.fillStyle = g; nc.fillRect(0, 0, 540, 960);

  // 纸纹：细颗粒 + 不均匀云斑（蓝晒纸手做的痕迹）
  const r = mulberry(4471);
  for (let i = 0; i < 52000; i++) {
    const x = r() * 540, y = r() * 960;
    nc.fillStyle = 'rgba(226,241,255,' + (r() * .05).toFixed(3) + ')';
    nc.fillRect(x, y, 1.3, 1.3);
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * 540, y = r() * 960, rad = 40 + r() * 130;
    const rg = nc.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, 'rgba(10,45,85,' + (.02 + r() * .045).toFixed(3) + ')');
    rg.addColorStop(1, 'rgba(10,45,85,0)');
    nc.fillStyle = rg; nc.beginPath(); nc.arc(x, y, rad, 0, TAU); nc.fill();
  }
  grain = n;
}

function line(c, x0, y0, x1, y1, p, w = 2, col = LINE, al = 1) {
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= al;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y0);
  c.lineTo(lerp(x0, x1, clamp(p)), lerp(y0, y1, clamp(p)));
  c.stroke(); c.restore();
}

// 虚线段集合（隐藏边 / 中心线），按 p 逐段生长
function dash(c, pts, p, o = {}) {
  const w = o.w ?? 1.6, col = o.col ?? DIM, dash = o.dash ?? [12, 8], al = o.al ?? .8;
  c.save();
  c.globalAlpha *= al;
  c.strokeStyle = col; c.lineWidth = w;
  c.setLineDash(dash); c.lineCap = 'butt';
  let total = 0;
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, L }); total += L;
  }
  let left = total * clamp(p);
  c.beginPath();
  for (const s of segs) {
    if (left <= 0) break;
    const u = Math.min(1, left / s.L);
    c.moveTo(s.a[0], s.a[1]);
    c.lineTo(lerp(s.a[0], s.b[0], u), lerp(s.a[1], s.b[1], u));
    left -= s.L;
  }
  c.stroke(); c.restore();
}

function txt(c, str, x, y, size, col = LINE, align = 'left', weight = 600, ls = 0) {
  c.save();
  c.font = weight + ' ' + Math.round(size) + 'px "Segoe UI","Microsoft YaHei",sans-serif';
  c.textBaseline = 'middle';
  c.fillStyle = col;
  if (ls) c.letterSpacing = ls + 'px';
  c.textAlign = 'center';
  // 手工字距：逐字排版，保证与工程图一致
  let w = 0;
  const ws = [];
  for (const ch of str) { const m = c.measureText(ch).width; ws.push(m); w += m + ls; }
  w -= ls;
  let cx = align === 'left' ? x + w / 2 : align === 'right' ? x - w / 2 : x;
  const start = cx - w / 2;
  let px = start;
  c.textAlign = 'left';
  for (let i = 0; i < str.length; i++) {
    c.fillText(str[i], px, y);
    px += ws[i] + ls;
  }
  c.restore();
}

function arrow(c, x, y, dir, size = 13, col = LINE, w = 2) {
  c.save();
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + dir * size, y - size * .42);
  c.moveTo(x, y);
  c.lineTo(x + dir * size, y + size * .42);
  c.stroke(); c.restore();
}

function circle(c, cx, cy, R, p, w = 2, col = LINE, al = 1) {
  if (p <= 0) return;
  c.save();
  c.globalAlpha *= al;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath();
  c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p));
  c.stroke(); c.restore();
}

export function paint(ctx, t, W, H) {
  const S = W / 1080;

  ctx.fillStyle = '#08203a';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalAlpha = .96;
  ctx.drawImage(grain, 0, 0, W, H);
  ctx.restore();

  // 网格：细格 54，粗格 270，随曝光揭出
  const gp = seg(t, -0.35, 0.32);
  ctx.save();
  ctx.globalAlpha = gp * (1 - .35 * seg(t, 2.6, 4));
  for (let x = 0; x <= W; x += 54 * S) {
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 54 * S) {
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let x = 0; x <= W; x += 270 * S) {
    ctx.strokeStyle = GRID_MAJ; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += 270 * S) {
    ctx.strokeStyle = GRID_MAJ; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // 暗角
  const vg = ctx.createRadialGradient(W * .5, H * .42, W * .35, W * .5, H * .5, W * .98);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,22,.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  // 图框（双线）
  const FX = 52 * S, FY = 196 * S, FW = 976 * S, FH = 1348 * S;
  const fp = seg(t, -0.25, 0.26);
  const per = 2 * (FW + FH);
  const drawFrame = (inset, w, col, p) => {
    const x = FX + inset, y = FY + inset, ww = FW - inset * 2, hh = FH - inset * 2;
    const L = 2 * (ww + hh);
    let left = L * clamp(p);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'butt';
    ctx.beginPath();
    const path4 = [[x, y], [x + ww, y], [x + ww, y + hh], [x, y + hh], [x, y]];
    for (let i = 0; i < 4; i++) {
      if (left <= 0) break;
      const a = path4[i], b = path4[i + 1];
      const Ls = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const u = Math.min(1, left / Ls);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u));
      left -= Ls;
    }
    ctx.stroke(); ctx.restore();
  };
  drawFrame(0, 2.6, LINE, fp);
  drawFrame(11 * S, 1.2, DIM, seg(t, -0.05, 0.34));

  // 图号与片名（左上）
  const hp = seg(t, 0.22, 0.44);
  if (hp > 0) {
    ctx.save(); ctx.globalAlpha = hp;
    txt(ctx, 'BP-025', FX + 28 * S, FY + 46 * S, 24 * S, DIM, 'left', 700, 3);
    txt(ctx, 'WILL IT FIT', FX + 28 * S, FY + 96 * S, 52 * S, LINE, 'left', 700, 2);
    line(ctx, FX + 28 * S, FY + 130 * S, FX + 28 * S + 300 * S, FY + 130 * S, seg(t, .30, .52), 2, DIM);
    txt(ctx, 'SECTION  A–A   ·   CLAMP MOUNTING', FX + 28 * S, FY + 158 * S, 22 * S, DIM, 'left', 500, 2);
    ctx.restore();
  }

  // ── 主体：车架横断面（两根管 + 夹具）
  const cy = 900 * S, R = 110 * S, ri = 82 * S;
  const cxL = 310 * S, cxR = 720 * S;

  // 左管
  circle(ctx, cxL, cy, R, seg(t, 0.36, 0.78), 2.4, LINE);
  circle(ctx, cxL, cy, ri, seg(t, 0.56, 0.86), 1.6, LINE, .9);
  // 右管
  circle(ctx, cxR, cy, R, seg(t, 0.46, 0.86), 2.4, LINE);
  circle(ctx, cxR, cy, ri, seg(t, 0.66, 0.94), 1.6, LINE, .9);

  // 中心线（点划线，伸出管外）
  const cp = seg(t, 0.72, 0.98);
  for (const cx of [cxL, cxR]) {
    dash(ctx, [[cx - R - 30 * S, cy], [cx + R + 30 * S, cy]], cp, { w: 1.3, col: DIM, dash: [16, 6, 4, 6], al: .7 });
    dash(ctx, [[cx, cy - R - 30 * S], [cx, cy + R + 30 * S]], cp, { w: 1.3, col: DIM, dash: [16, 6, 4, 6], al: .7 });
  }

  // 剖面线（管壁）
  const hp2 = seg(t, 0.80, 1.06);
  const hat = (cx, p) => {
    ctx.save();
    ctx.globalAlpha = .55 * p;
    ctx.strokeStyle = DIM; ctx.lineWidth = 1.2;
    const gap = 9 * S;
    for (let d = -R; d <= R; d += gap) {
      const x = cx + d;
      const dy = Math.sqrt(Math.max(0, R * R - d * d));
      const dy2 = Math.sqrt(Math.max(0, ri * ri - d * d));
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x, cy + sgn * dy2);
        ctx.lineTo(x + 5 * S, cy + sgn * dy);
        ctx.stroke();
      }
    }
    ctx.restore();
  };
  if (hp2 > 0) { hat(cxL, hp2); hat(cxR, hp2); }

  // 尺寸线（frame width）：延伸线 + 尺寸线 + 箭头 + 字
  const dy0 = cy + R + 62 * S;
  const dp = seg(t, 0.88, 1.18);
  line(ctx, cxL, cy + R + 12 * S, cxL, dy0 + 16 * S, seg(t, 0.86, 1.02), 1.2, DIM, .8);
  line(ctx, cxR, cy + R + 12 * S, cxR, dy0 + 16 * S, seg(t, 0.86, 1.02), 1.2, DIM, .8);
  if (dp > 0) {
    const x0 = lerp(cxL, cxR, .5 - .5 * clamp(dp)), x1 = lerp(cxL, cxR, .5 + .5 * clamp(dp));
    line(ctx, x0, dy0, x1, dy0, 1, 1.8, LINE, 1);
    if (dp > .45) { arrow(ctx, x0, dy0, -1, 13 * S); arrow(ctx, x1, dy0, 1, 13 * S); }
  }
  const dt = seg(t, 1.02, 1.26);
  if (dt > 0) {
    ctx.save(); ctx.globalAlpha = dt;
    txt(ctx, 'FRAME  WIDTH', (cxL + cxR) / 2, dy0 + 48 * S, 32 * S, LINE, 'center', 600, 4);
    txt(ctx, 'CLAMP REF · 03', (cxL + cxR) / 2, dy0 + 100 * S, 20 * S, DIM, 'center', 500, 3);
    ctx.restore();
  }

  // 夹具：抱箍 + 两颗螺栓（右管）
  const gp2 = seg(t, 1.06, 1.36);
  if (gp2 > 0) {
    const a0 = -Math.PI * .62, a1 = Math.PI * .62;
    ctx.save();
    ctx.strokeStyle = LINE; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cxR, cy, R + 22 * S, a0, lerp(a0, a1, clamp(gp2)));
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cxR, cy, R + 40 * S, a0, lerp(a0, a1, clamp(gp2)));
    ctx.stroke();
    ctx.restore();
    // 端部两块耳板与螺栓
    const ep = seg(t, 1.28, 1.46);
    if (ep > 0) {
      ctx.save(); ctx.globalAlpha = clamp(ep);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
      for (const sgn of [-1, 1]) {
        const by = cy + sgn * (R + 30 * S);
        ctx.beginPath();
        ctx.rect(cxR + 30 * S, by - 15 * S, 62 * S, 30 * S);
        ctx.stroke();
        // 螺栓（六角）
        const bx = cxR + 74 * S;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const ang = i * TAU / 6 + Math.PI / 6;
          const px = bx + Math.cos(ang) * 11 * S, py = by + Math.sin(ang) * 11 * S;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx - 74 * S, by); ctx.lineTo(bx - 20 * S, by); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // leader + 编号气球
  const lp = seg(t, 1.34, 1.52);
  if (lp > 0) {
    const x0 = cxR + 88 * S, y0 = cy - 108 * S, x1 = 916 * S, y1 = 520 * S;
    ctx.save();
    ctx.strokeStyle = DIM; ctx.lineWidth = 1.4; ctx.globalAlpha = .9;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(lerp(x0, x1, clamp(lp)), lerp(y0, y1, clamp(lp)));
    ctx.stroke();
    ctx.restore();
    if (lp > .7) {
      ctx.save(); ctx.globalAlpha = seg(lp, .7, 1);
      ctx.strokeStyle = LINE; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(x1, y1, 24 * S, 0, TAU); ctx.stroke();
      txt(ctx, '3', x1, y1 + 1 * S, 26 * S, LINE, 'center', 700);
      txt(ctx, 'CLAMP', x1 - 44 * S, y1 - 44 * S, 24 * S, LINE, 'right', 700, 3);
      txt(ctx, 'SITS HERE', x1 - 44 * S, y1 - 16 * S, 24 * S, LINE, 'right', 700, 3);
      ctx.restore();
    }
  }

  // 底部信息条（标题块）
  const bp2 = seg(t, 1.12, 1.32);
  if (bp2 > 0) {
    ctx.save(); ctx.globalAlpha = bp2;
    const bx = FX + 28 * S, by = FY + FH - 108 * S;
    line(ctx, bx, by, bx + 520 * S, by, 1, 1.4, DIM, .8);
    txt(ctx, 'SCALE 1:1', bx, by + 32 * S, 20 * S, DIM, 'left', 500, 2);
    txt(ctx, 'DRAWN  LH', bx + 200 * S, by + 32 * S, 20 * S, DIM, 'left', 500, 2);
    txt(ctx, 'SHEET 1 / 1', bx + 420 * S, by + 32 * S, 20 * S, DIM, 'left', 500, 2);
    ctx.restore();
  }

  // 红铅笔：两圈手绘椭圆（唯一强调色）
  const rp = seg(t, 1.42, 1.70);
  if (rp > 0) {
    ctx.save();
    ctx.strokeStyle = RED;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      const rr = mulberry(7712 + pass * 37);
      const pts = [];
      const N = 96;
      const rx = 136 * S + pass * 7 * S, ry = 160 * S - pass * 9 * S;
      const rot = -.10 + pass * .05;
      for (let i = 0; i <= N * clamp((rp - pass * .18) * 1.15); i++) {
        const a = -Math.PI * .62 + (i / N) * TAU * .96;
        const wob = (rr() - .5) * 5 * S;
        const x = cxR + 4 * S + Math.cos(a) * (rx + wob) * Math.cos(rot) - Math.sin(a) * (ry + wob) * Math.sin(rot);
        const y = cy - 4 * S + Math.cos(a) * (rx + wob) * Math.sin(rot) + Math.sin(a) * (ry + wob) * Math.cos(rot);
        pts.push([x, y]);
      }
      if (pts.length > 2) {
        ctx.lineWidth = (pass ? 3.2 : 5.4) * S;
        ctx.globalAlpha = pass ? .75 : .92;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
