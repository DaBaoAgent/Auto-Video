import { clamp, lerp, seg, ss, eo, eio, spring, mulberry, TAU } from './lib.js';

// 分色机械图解（jixie 管线做法）：深底图纸，一套系统一种颜色，
// 白线先立结构，再按"介质流向"逐层染色，测量系统最后压上。
// EP25 第四句 —— 管径 22–25 mm。一段竖管的剖面，壁厚染绿、内腔染青，卡尺量一遍。

const BG = '#0e2436';
const INK = '#d8ecff';
const GRID = '#8fb6d8';
const GREEN = '#9be8a0';
const CYAN = '#6fb3c9';
const SLATE = '#4a6d8c';

// 版式：1 mm ≈ 8.8 px。外径 25 → 半宽 110；内径 22 → 半宽 96.8 取 78（示意剖面）
const CX = 540, TOP = 380, BOT = 1300;
const RXO = 110, RXS = 78;   // 外/内半宽
const RYO = 28, RYS = 20;    // 端面椭圆

let grain = null;

export function init(W, H) {
  const n = document.createElement('canvas');
  n.width = 540; n.height = 960;
  const nc = n.getContext('2d');
  const g = nc.createRadialGradient(260, 400, 120, 260, 400, 700);
  g.addColorStop(0, '#123048'); g.addColorStop(.6, '#0e2436'); g.addColorStop(1, '#08161f');
  nc.fillStyle = g; nc.fillRect(0, 0, 540, 960);
  const r = mulberry(3321);
  for (let i = 0; i < 34000; i++) {
    const x = r() * 540, y = r() * 960;
    nc.fillStyle = 'rgba(216,236,255,' + (r() * .045).toFixed(3) + ')';
    nc.fillRect(x, y, 1.2, 1.2);
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
  for (const ch of str) { const m = c.measureText(ch); ws.push(m.width); w += m.width + ls; }
  w -= ls;
  const start = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
  let px = start; c.textAlign = 'left';
  for (let i = 0; i < str.length; i++) { c.fillText(str[i], px, y); px += ws[i] + ls; }
  c.restore();
}

function vline(c, x, y0, y1, p, w = 2.4, col = INK, al = 1) {
  if (p <= 0) return;
  c.save(); c.globalAlpha *= al;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y0); c.lineTo(x, lerp(y0, y1, clamp(p))); c.stroke();
  c.restore();
}

export function paint(ctx, t, W, H) {
  const S = W / 1080;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = .95; ctx.drawImage(grain, 0, 0, W, H); ctx.restore();

  // 网格
  const gp = seg(t, -0.4, 0.5);
  ctx.save();
  ctx.strokeStyle = GRID; ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 45 * S) { ctx.globalAlpha = gp * .16; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 45 * S) { ctx.globalAlpha = gp * .16; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let x = 0; x <= W; x += 270 * S) { ctx.globalAlpha = gp * .32; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 270 * S) { ctx.globalAlpha = gp * .32; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();

  // 标题
  txt(ctx, '01 / TUBE', 74 * S, 208 * S, 25 * S, GRID, 'left', 700, 4, seg(t, .30, .70));
  txt(ctx, 'DIAMETER', 74 * S, 258 * S, 44 * S, INK, 'left', 700, 2, seg(t, .30, .70));
  ctx.save(); ctx.globalAlpha = seg(t, .35, .75);
  ctx.strokeStyle = GRID; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(74 * S, 290 * S); ctx.lineTo(74 * S + 238 * S, 290 * S); ctx.stroke();
  ctx.restore();

  const cx = CX * S, top = TOP * S, bot = BOT * S;
  const rxo = RXO * S, rxs = RXS * S, ryo = RYO * S, rys = RYS * S;

  // 内腔染色（第三套系统：介质）自下往上
  const ip = seg(t, 1.90, 2.85);
  if (ip > 0) {
    const grd = ctx.createLinearGradient(0, bot, 0, top);
    grd.addColorStop(0, 'rgba(111,179,201,.30)');
    grd.addColorStop(1, 'rgba(111,179,201,.10)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - rxs, lerp(bot, top, clamp(ip)), rxs * 2, bot - lerp(bot, top, clamp(ip)));
    ctx.fillStyle = grd; ctx.fill();
    ctx.restore();
  }

  // 外壁（两条竖线，自上而下）
  vline(ctx, cx - rxo, top, bot, seg(t, 0.45, 1.35), 2.8, INK);
  vline(ctx, cx - rxo, top, bot, seg(t, 0.55, 1.45), 1.6, INK, .35);
  vline(ctx, cx + rxo, top, bot, seg(t, 0.55, 1.45), 2.8, INK);
  vline(ctx, cx + rxo - 3 * S, top, bot, seg(t, 0.65, 1.55), 1.6, INK, .35);

  // 内壁（两条竖线，自上而下）
  vline(ctx, cx - rxs, top + 10 * S, bot - 10 * S, seg(t, 1.25, 2.00), 2.2, INK, .92);
  vline(ctx, cx + rxs, top + 10 * S, bot - 10 * S, seg(t, 1.35, 2.10), 2.2, INK, .92);

  // 端面椭圆（能看到内壁，是"管子"的关键）
  const ep = seg(t, 0.70, 1.35);
  if (ep > 0) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(cx, top, rxo, ryo, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(ep)); ctx.stroke();
    ctx.restore();
  }
  const ep2 = seg(t, 1.60, 2.05);
  if (ep2 > 0) {
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.globalAlpha = .92;
    ctx.beginPath(); ctx.ellipse(cx, top + 6 * S, rxs, rys, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(ep2)); ctx.stroke();
    ctx.restore();
  }
  // 底端椭圆（虚线，隐藏端）
  ctx.save();
  ctx.globalAlpha = .55 * seg(t, 2.0, 2.4);
  ctx.strokeStyle = GRID; ctx.lineWidth = 1.6; ctx.setLineDash([12 * S, 8 * S]);
  ctx.beginPath(); ctx.ellipse(cx, bot, rxo, ryo, 0, 0, TAU); ctx.stroke();
  ctx.restore();

  // 壁厚染色：两条绿带自上而下灌（第二套系统）
  const fp = seg(t, 2.55, 3.70);
  if (fp > 0) {
    const yEnd = lerp(top, bot, clamp(fp));
    ctx.save();
    ctx.fillStyle = GREEN;
    ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.rect(cx - rxo, top, rxo - rxs, yEnd - top); ctx.fill();
    ctx.beginPath(); ctx.rect(cx + rxs, top, rxo - rxs, yEnd - top); ctx.fill();
    ctx.restore();
  }

  // 壁带剖面斜线
  const hp = seg(t, 3.35, 4.05);
  if (hp > 0) {
    ctx.save();
    ctx.globalAlpha = .55 * hp;
    ctx.strokeStyle = '#0e2436'; ctx.lineWidth = 1.4;
    for (let y = top + 10 * S; y < lerp(top, bot, clamp(hp)) - 6 * S; y += 14 * S) {
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? cx - rxo : cx + rxs;
        ctx.beginPath();
        ctx.moveTo(x0 + 4 * S, y);
        ctx.lineTo(x0 + (rxo - rxs) - 4 * S, y + (rxo - rxs));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 中心线
  ctx.save();
  ctx.globalAlpha = .5 * seg(t, 2.2, 2.7);
  ctx.strokeStyle = GRID; ctx.lineWidth = 1.4; ctx.setLineDash([18 * S, 8 * S]);
  ctx.beginPath(); ctx.moveTo(cx, top - 40 * S); ctx.lineTo(cx, bot + 40 * S); ctx.stroke();
  ctx.restore();

  // 卡尺：主尺横杆从右侧滑入（4.0 起）
  const sp = seg(t, 4.00, 4.70);
  const BAR_Y = 1000 * S, BAR_H = 48 * S;
  if (sp > 0) {
    const bx = lerp(W * 1.05, 196 * S, ss(sp));
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.rect(bx, BAR_Y, 700 * S, BAR_H); ctx.stroke();
    ctx.strokeStyle = GRID; ctx.lineWidth = 1.1;
    for (let i = 0; i <= 36; i++) {
      const x = bx + 14 * S + i * 18.6 * S;
      if (x > bx + 686 * S) break;
      const h = i % 5 === 0 ? 22 * S : 12 * S;
      ctx.beginPath(); ctx.moveTo(x, BAR_Y + 4 * S); ctx.lineTo(x, BAR_Y + 4 * S + h); ctx.stroke();
    }
    ctx.restore();
    txt(ctx, '0', bx + 14 * S, BAR_Y + 40 * S, 20 * S, GRID, 'left', 500, 0, .8);
    txt(ctx, '50', bx + 14 * S + 36 * 18.6 * S - 26 * S, BAR_Y + 40 * S, 20 * S, GRID, 'left', 500, 0, .8);
  }

  // 量爪：两片贴管外壁，自下往上合
  const jp = seg(t, 4.55, 5.20);
  if (jp > 0) {
    const up = lerp(120 * S, 30 * S, eo(jp));
    ctx.save();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    for (const side of [-1, 1]) {
      const x = cx + side * rxo;
      const y0 = BAR_Y, y1 = BAR_Y - up - 150 * S;
      const xx = x + side * 16 * S;
      ctx.beginPath(); ctx.moveTo(xx, y0); ctx.lineTo(xx, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xx, y1); ctx.lineTo(x - side * 6 * S, y1); ctx.stroke();
    }
    ctx.restore();
  }

  // 读数 22.0 → 25.0
  const rp = seg(t, 5.05, 6.70);
  if (rp > 0) {
    const v = lerp(22.0, 25.0, ss(rp));
    const vx = 690 * S, vy = 1052 * S;
    ctx.save();
    ctx.globalAlpha *= seg(rp, 0, .18);
    ctx.fillStyle = 'rgba(155,232,160,.12)';
    ctx.fillRect(vx, vy, 300 * S, 92 * S);
    ctx.strokeStyle = GREEN; ctx.lineWidth = 2;
    ctx.strokeRect(vx, vy, 300 * S, 92 * S);
    ctx.restore();
    txt(ctx, v.toFixed(1), vx + 132 * S, vy + 48 * S, 54 * S, GREEN, 'center', 700, 0, seg(rp, 0, .18));
    txt(ctx, 'mm', vx + 216 * S, vy + 56 * S, 26 * S, GREEN, 'left', 600, 1, seg(rp, 0, .18));
    // 游标指示
    ctx.save();
    ctx.globalAlpha *= .9;
    ctx.strokeStyle = GREEN; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lerp(520 * S, 700 * S, ss(rp)), BAR_Y - 10 * S);
    ctx.lineTo(lerp(520 * S, 700 * S, ss(rp)), BAR_Y + 4 * S);
    ctx.stroke();
    ctx.restore();
  }

  // 尺寸标注 Ø22（内） / Ø25（外）
  const dp = seg(t, 6.45, 7.35);
  if (dp > 0) {
    // 内径：顶部开口内水平双箭头
    const y = 520 * S;
    ctx.save(); ctx.globalAlpha *= dp;
    ctx.strokeStyle = GRID; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - rxs, y); ctx.lineTo(cx + rxs, y); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - rxs, y); ctx.lineTo(cx - rxs + 12 * S, y - 6 * S);
    ctx.moveTo(cx - rxs, y); ctx.lineTo(cx - rxs + 12 * S, y + 6 * S);
    ctx.moveTo(cx + rxs, y); ctx.lineTo(cx + rxs - 12 * S, y - 6 * S);
    ctx.moveTo(cx + rxs, y); ctx.lineTo(cx + rxs - 12 * S, y + 6 * S);
    ctx.stroke();
    ctx.restore();
    txt(ctx, 'Ø 22', cx, 470 * S, 30 * S, INK, 'center', 700, 2, dp);

    // 外径：底部水平双箭头
    const y2 = 1364 * S;
    ctx.save(); ctx.globalAlpha *= dp;
    ctx.strokeStyle = GRID; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx - rxo, y2); ctx.lineTo(cx + rxo, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - rxo, y2); ctx.lineTo(cx - rxo + 14 * S, y2 - 7 * S);
    ctx.moveTo(cx - rxo, y2); ctx.lineTo(cx - rxo + 14 * S, y2 + 7 * S);
    ctx.moveTo(cx + rxo, y2); ctx.lineTo(cx + rxo - 14 * S, y2 - 7 * S);
    ctx.moveTo(cx + rxo, y2); ctx.lineTo(cx + rxo - 14 * S, y2 + 7 * S);
    ctx.stroke();
    ctx.restore();
    txt(ctx, 'Ø 25', cx, 1412 * S, 30 * S, INK, 'center', 700, 2, dp);
  }

  // RANGE 徽标（左侧，竖向留白处）
  const bp = seg(t, 7.15, 7.75);
  if (bp > 0) {
    ctx.save(); ctx.globalAlpha *= bp;
    ctx.fillStyle = 'rgba(155,232,160,.10)';
    ctx.strokeStyle = GREEN; ctx.lineWidth = 1.8;
    ctx.fillRect(74 * S, 740 * S, 250 * S, 104 * S);
    ctx.strokeRect(74 * S, 740 * S, 250 * S, 104 * S);
    ctx.restore();
    txt(ctx, 'FITS', 96 * S, 772 * S, 22 * S, GREEN, 'left', 700, 3, bp);
    txt(ctx, '22 – 25', 96 * S, 812 * S, 34 * S, GREEN, 'left', 700, 1, bp);
  }

  txt(ctx, 'EP25 / WILL IT FIT', 1006 * S, 1524 * S, 18 * S, GRID, 'right', 500, 3, seg(t, 7.5, 8.1) * .65);
}
