import { clamp, lerp, seg, ss, eo, eio, spring, mulberry, TAU } from './lib.js';

// 线稿剖面图解（poumian 管线做法）：纸底 + 深墨细线，
// 轮廓先画、剖面排线次之、尺寸最后上；标注用朱红，像一张正在被画完的图纸。
// EP25 第五句 —— 踏板高度与电机离地间隙。剖面视图，无人物。

const PAPER = '#f1efe8';
const INK = '#22303c';
const RED = '#c2563a';
const GREY = '#7d8f9b';
const GRID = 'rgba(140,168,190,.20)';

// 版式：1 cm ≈ 40 px。踏板厚 3 cm，电机筒 Ø8 cm，间隙 6 cm。
const GY = 1320;          // 地面
const TY0 = 660, TY1 = 780; // 踏板
const TX0 = 220, TX1 = 860;
const MX0 = 340, MX1 = 760, MY0 = 820, MY1 = 1100; // 电机
const LEG_L = 300, LEG_R = 780;

let grain = null;

export function init(W, H) {
  const n = document.createElement('canvas');
  n.width = 540; n.height = 960;
  const nc = n.getContext('2d');
  nc.fillStyle = PAPER; nc.fillRect(0, 0, 540, 960);
  const r = mulberry(6614);
  for (let i = 0; i < 40000; i++) {
    const x = r() * 540, y = r() * 960;
    nc.fillStyle = 'rgba(34,48,60,' + (r() * .035).toFixed(3) + ')';
    nc.fillRect(x, y, 1.1, 1.1);
  }
  for (let i = 0; i < 70; i++) {
    const x = r() * 540, y = r() * 960, rad = 60 + r() * 140;
    const rg = nc.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, 'rgba(196,178,150,' + (.01 + r() * .03).toFixed(3) + ')');
    rg.addColorStop(1, 'rgba(196,178,150,0)');
    nc.fillStyle = rg; nc.beginPath(); nc.arc(x, y, rad, 0, TAU); nc.fill();
  }
  grain = n;
}

function txt(c, str, x, y, size, col = INK, align = 'left', weight = 600, ls = 0, alpha = 1) {
  c.save();
  c.globalAlpha *= alpha;
  c.font = weight + ' ' + Math.round(size) + 'px "Segoe UI","Microsoft YaHei",sans-serif';
  c.textBaseline = 'middle';
  c.fillStyle = col;
  let w = 0; const ws = [];
  for (const ch of str) { const m = c.measureText(ch).width; ws.push(m); w += m + ls; }
  w -= ls;
  const start = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  let px = start; c.textAlign = 'left';
  for (let i = 0; i < str.length; i++) { c.fillText(str[i], px, y); px += ws[i] + ls; }
  c.restore();
}

function stroke(c, pts, p, w = 2, col = INK, al = 1) {
  if (p <= 0) return;
  let total = 0; const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, L }); total += L;
  }
  let left = total * clamp(p);
  c.save(); c.globalAlpha *= al;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
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

function hatchRect(c, x, y, w2, h2, p, o = {}) {
  if (p <= 0) return;
  const gap = o.gap ?? 13, ang = o.ang ?? -45, col = o.col ?? INK, lw = o.lw ?? 1.3, al = o.al ?? .5;
  c.save();
  c.beginPath(); c.rect(x, y, w2, h2); c.clip();
  c.globalAlpha *= al * clamp(p * 1.6);
  c.strokeStyle = col; c.lineWidth = lw;
  const dx = Math.cos(ang * Math.PI / 180), dy = Math.sin(ang * Math.PI / 180);
  const span = Math.hypot(w2, h2);
  const cx = x + w2 / 2, cy = y + h2 / 2;
  for (let d = -span; d <= span; d += gap) {
    const px = cx - dy * d, py = cy + dx * d;
    c.beginPath();
    c.moveTo(px - dx * span, py - dy * span);
    c.lineTo(px + dx * span, py + dy * span);
    c.stroke();
  }
  c.restore();
}

export function paint(ctx, t, W, H) {
  const S = W / 1080;
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .9; ctx.drawImage(grain, 0, 0, W, H); ctx.restore();

  const gp = seg(t, -0.3, 0.45);
  ctx.save();
  ctx.strokeStyle = GRID; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 45 * S) { ctx.globalAlpha = gp * .5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 45 * S) { ctx.globalAlpha = gp * .5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();

  // 标题
  const tp = seg(t, 0.32, 0.72);
  txt(ctx, '03 / HEIGHT', 76 * S, 206 * S, 25 * S, GREY, 'left', 700, 4, tp);
  txt(ctx, 'FOOTREST CLEARANCE', 76 * S, 256 * S, 42 * S, INK, 'left', 700, 2, tp);
  stroke(ctx, [[76 * S, 288 * S], [76 * S + 470 * S, 288 * S]], seg(t, .45, .85), 2, INK, .8 * tp);
  txt(ctx, 'SECTION  B–B    ·    MOTOR UNDER TRAY', 76 * S, 316 * S, 20 * S, GREY, 'left', 500, 2, seg(t, .55, .95));

  // 地面（实线 + 向下剖面线）
  stroke(ctx, [[130 * S, GY * S], [950 * S, GY * S]], seg(t, 0.42, 1.15), 3.6, INK);
  if (t > 0.9) {
    const p = seg(t, 0.9, 1.6);
    ctx.save();
    ctx.globalAlpha = .6 * p;
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3;
    for (let x = 130 * S; x <= 950 * S; x += 16 * S) {
      ctx.beginPath(); ctx.moveTo(x, GY * S + 2 * S); ctx.lineTo(x - 28 * S, GY * S + 42 * S); ctx.stroke();
    }
    ctx.strokeStyle = GREY; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(130 * S, GY * S + 44 * S); ctx.lineTo(950 * S, GY * S + 44 * S); ctx.stroke();
    ctx.restore();
  }

  // 立柱（从踏板底到地面）
  stroke(ctx, [[LEG_L * S - 26 * S, TY1 * S], [LEG_L * S - 26 * S, GY * S]], seg(t, 0.95, 1.75), 2.2, INK);
  stroke(ctx, [[LEG_L * S, TY1 * S], [LEG_L * S, GY * S]], seg(t, 1.05, 1.85), 1.4, INK, .85);
  stroke(ctx, [[LEG_R * S, TY1 * S], [LEG_R * S, GY * S]], seg(t, 1.15, 1.95), 2.2, INK);
  stroke(ctx, [[LEG_R * S + 26 * S, TY1 * S], [LEG_R * S + 26 * S, GY * S]], seg(t, 1.25, 2.05), 1.4, INK, .85);

  // 踏板（四边依次长 + 剖面线）
  stroke(ctx, [[TX0 * S, TY0 * S], [TX1 * S, TY0 * S]], seg(t, 1.25, 1.60), 2.8, INK);
  stroke(ctx, [[TX1 * S, TY0 * S], [TX1 * S, TY1 * S]], seg(t, 1.42, 1.70), 2.8, INK);
  stroke(ctx, [[TX1 * S, TY1 * S], [TX0 * S, TY1 * S]], seg(t, 1.52, 1.88), 2.8, INK);
  stroke(ctx, [[TX0 * S, TY1 * S], [TX0 * S, TY0 * S]], seg(t, 1.62, 1.95), 2.8, INK);
  hatchRect(ctx, TX0 * S, TY0 * S, (TX1 - TX0) * S, (TY1 - TY0) * S, seg(t, 1.80, 2.40), { gap: 15, ang: -42, lw: 1.3, al: .45 });

  // 电机（筒 + 端盖），先悬在上方，再落到踏板下
  const fall = spring(seg(t, 2.55, 3.30), 9, .38);
  const oy = (1 - clamp(fall)) * -80 * S;
  const my0 = (MY0 + (1 - clamp(fall)) * -80) * S, my1 = (MY1 + (1 - clamp(fall)) * -80) * S;

  stroke(ctx, [[MX0 * S, my0], [MX1 * S, my0]], seg(t, 1.95, 2.25), 2.6, INK);
  stroke(ctx, [[MX1 * S, my0], [MX1 * S, my1]], seg(t, 2.10, 2.32), 2.6, INK);
  stroke(ctx, [[MX1 * S, my1], [MX0 * S, my1]], seg(t, 2.20, 2.48), 2.6, INK);
  stroke(ctx, [[MX0 * S, my1], [MX0 * S, my0]], seg(t, 2.30, 2.55), 2.6, INK);

  // 端盖（右端椭圆）
  ctx.save();
  ctx.globalAlpha *= seg(t, 2.35, 2.80);
  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(MX1 * S + 4 * S, (my0 + my1) / 2, 26 * S, (my1 - my0) / 2 * .96, 0, 0, TAU); ctx.stroke();
  ctx.globalAlpha *= .55;
  ctx.beginPath(); ctx.ellipse(MX1 * S + 4 * S, (my0 + my1) / 2, 12 * S, (my1 - my0) / 2 * .55, 0, 0, TAU); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= seg(t, 2.35, 2.85) * .75;
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(MX0 * S + 8 * S, (my0 + my1) / 2, 16 * S, (my1 - my0) / 2 * .72, 0, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
  ctx.restore();

  // 内部定子线
  ctx.save();
  ctx.globalAlpha *= .55 * seg(t, 2.55, 3.05);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const y = my0 + 40 * S + i * 42 * S;
    if (y > my1 - 28 * S) break;
    ctx.beginPath(); ctx.moveTo(MX0 * S + 60 * S, y); ctx.lineTo(MX1 * S - 34 * S, y); ctx.stroke();
  }
  ctx.restore();

  // 与踏板连接的挂杆
  stroke(ctx, [[420 * S, TY1 * S], [420 * S, my0]], seg(t, 3.05, 3.40), 1.6, INK, .8);
  stroke(ctx, [[680 * S, TY1 * S], [680 * S, my0]], seg(t, 3.15, 3.50), 1.6, INK, .8);

  // 间隙：朱红双箭头
  const dp = seg(t, 3.55, 4.35);
  if (dp > 0) {
    const ax = 952 * S;
    const topY = my1, botY = GY * S;
    const midY = (topY + botY) / 2;
    ctx.save();
    ctx.strokeStyle = RED; ctx.lineWidth = 2.2; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(MX1 * S + 30 * S, topY); ctx.lineTo(ax + 18 * S, topY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(950 * S, botY); ctx.lineTo(ax + 18 * S, botY); ctx.stroke();
    const p2 = clamp(dp * 1.12);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ax, midY); ctx.lineTo(ax, lerp(midY, topY, p2)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, midY); ctx.lineTo(ax, lerp(midY, botY, p2)); ctx.stroke();
    const ah = 12 * S;
    const tY = lerp(midY, topY, p2), bY = lerp(midY, botY, p2);
    ctx.beginPath();
    ctx.moveTo(ax, tY); ctx.lineTo(ax - ah, tY + ah * 1.7);
    ctx.moveTo(ax, tY); ctx.lineTo(ax + ah, tY + ah * 1.7);
    ctx.moveTo(ax, bY); ctx.lineTo(ax - ah, bY - ah * 1.7);
    ctx.moveTo(ax, bY); ctx.lineTo(ax + ah, bY - ah * 1.7);
    ctx.stroke();
    ctx.restore();
  }

  // 6 CM 计数（从 0 数到 6），落在间隙区内、箭头左侧
  const np = seg(t, 3.90, 4.55);
  if (np > 0) {
    const val = Math.round(lerp(0, 6, ss(np)));
    const bx = 368 * S, by = 1186 * S;
    ctx.save();
    ctx.globalAlpha *= np;
    ctx.fillStyle = 'rgba(241,239,232,.86)';
    ctx.fillRect(bx, by - 38 * S, 224 * S, 76 * S);
    ctx.strokeStyle = RED; ctx.lineWidth = 1.8;
    ctx.strokeRect(bx, by - 38 * S, 224 * S, 76 * S);
    ctx.restore();
    txt(ctx, val + ' CM', bx + 112 * S, by + 2 * S, 36 * S, RED, 'center', 700, 2, np);
  }

  // 踏板厚度标注（左侧竖标，TRAY）
  const d2 = seg(t, 4.95, 5.40);
  if (d2 > 0) {
    const x = (TX0 - 52) * S;
    ctx.save(); ctx.globalAlpha = d2;
    ctx.strokeStyle = RED; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(TX0 * S, TY0 * S); ctx.lineTo(x - 10 * S, TY0 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TX0 * S, TY1 * S); ctx.lineTo(x - 10 * S, TY1 * S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, TY0 * S); ctx.lineTo(x, TY1 * S); ctx.stroke();
    ctx.restore();
    txt(ctx, 'TRAY', x + 6 * S, (TY0 + TY1) / 2 * S, 18 * S, RED, 'center', 700, 2, d2);
  }

  // 底注
  txt(ctx, 'MOTOR MUST NOT TOUCH GROUND', 76 * S, 1448 * S, 19 * S, GREY, 'left', 500, 2, seg(t, 5.05, 5.55));
  txt(ctx, 'SCALE  1 : 2', 968 * S, 1448 * S, 19 * S, GREY, 'right', 500, 2, seg(t, 5.15, 5.60));
}
