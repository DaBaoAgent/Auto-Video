// 立轴浮世绘 · EP24「门口的小摊」试片 v2（1080×1920）
// 竖幅木版画：上段雨与瓦檐，远处一条巷子，中段木架小摊（壶、铁皮舀米杯、自行车、猫），
// 右下摊主（有脸、有手、会动：伸手取杯、端起、看杯、放回），右上竖题签与朱印。
// 分版：墨（主版）／蓝（天）／赭（木与地）／朱（衣与幌子），错版半格印上去；人物按 12fps 步进活动。
import { clamp, lerp, seg, ss, eio, hash, mulberry, TAU } from './lib.js';
import {
  W, H, FR, PAL, TX, mk, buildTextures, inkify, stampLayer, stampFn, drawSeal, cartouche,
  vtext, line, bokashi,
} from './print.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
window.DUR = 10;
const DUR = 10;

const FONT_K = '"KaiTi", "STKaiti", "SimSun", serif';
const FONT_S = '"Georgia", "Times New Roman", serif';

try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]); } catch (e) {}
buildTextures();

const REG = [[0, 0], [2.2, -1.4], [-1.8, 1.9], [1.6, 2.3]];
const SHIFT = [[4, -5], [-6, 4], [5, 5], [-5, -4]];
const rgbaHex = (h, a) => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return `rgba(${r},${g},${b},${a})`; };
const E = eio, S = ss;

// ── 构图坐标 ──
const EAVE = 700;            // 近处瓦檐（压在上方）
const LANE = 1090;           // 巷子屋脊线
const GROUND = 1530;         // 地面线
const STALL = { x0: 120, x1: 860, top: 1250, foot: GROUND };
const MAN = { x: 900, feet: 1560, h: 430 };
const CAT = { x: 470, y: GROUND + 12 };
const CART = { x: 950, y: 78, w: 82 };

// ── 蓝版：天 ──
function drawSky(x) {
  bokashi(x, 0, 0, W, LANE + 40, PAL.prus, 1, 0.04, { col2: PAL.skyL, rough: 44, seed: 7, ease: 1.35 });
  // 高空几笔淡墨云带（手工感的横擦）
  const R = mulberry(9);
  for (let i = 0; i < 5; i++) {
    const y = 250 + i * 120, w2 = 520 + R() * 380, a = .10 + R() * .10;
    x.strokeStyle = rgbaHex(PAL.skyL, a); x.lineWidth = 16 + R() * 22;
    x.beginPath();
    for (let k = 0; k <= 8; k++) x.lineTo(60 + k * (w2 / 8), y + Math.sin(k * 1.3 + i) * 8);
    x.stroke();
  }
}

// ── 赭版：木、地、屋 ──
function drawOchre(x) {
  // 台面与立柱的木头
  x.fillStyle = rgbaHex(PAL.ochreL, .92);
  x.fillRect(STALL.x0 - 14, STALL.top - 16, STALL.x1 - STALL.x0 + 28, 30);
  x.fillStyle = rgbaHex(PAL.woodL, .86);
  for (const px of [STALL.x0, (STALL.x0 + STALL.x1) / 2, STALL.x1]) x.fillRect(px - 13, STALL.top + 14, 26, STALL.foot - STALL.top - 14);
  // 台下两层隔板
  x.fillStyle = rgbaHex(PAL.wood, .55);
  for (const y of [STALL.top + 130, STALL.top + 250]) x.fillRect(STALL.x0 + 8, y, STALL.x1 - STALL.x0 - 16, 16);
  // 街面
  x.fillStyle = rgbaHex(PAL.straw, .48);
  x.fillRect(0, GROUND, W, H - GROUND);
  // 巷子里的屋墙（浅赭块）
  x.fillStyle = rgbaHex(PAL.straw, .30);
  x.fillRect(0, LANE - 20, W, 110);
}

// ── 朱版：衣与幌子 ──
function drawRed(x) {
  // 幌子一块
  x.fillStyle = rgbaHex(PAL.beniL, .96);
  x.beginPath(); x.moveTo(600, EAVE + 30); x.lineTo(706, EAVE + 30);
  x.lineTo(706, EAVE + 316); x.lineTo(672, EAVE + 342); x.lineTo(650, EAVE + 316); x.lineTo(628, EAVE + 344); x.lineTo(600, EAVE + 316);
  x.closePath(); x.fill();
  // 摊主的围裙（在身上）
  const mx = MAN.x, fy = MAN.feet, hh = MAN.h;
  x.fillStyle = rgbaHex(PAL.beni, .94);
  x.beginPath();
  x.moveTo(mx - 44, fy - hh * 0.46); x.lineTo(mx + 44, fy - hh * 0.46);
  x.lineTo(mx + 52, fy - hh * 0.16); x.lineTo(mx - 52, fy - hh * 0.16);
  x.closePath(); x.fill();
}

// ── 主版：墨线（静态部分）──
function drawInk(x) {
  const ink = (pts, w = 2.6, col = PAL.sumi, closed = false) => line(x, pts, w, col, closed);
  const R = mulberry(23);

  // 近处瓦檐：粗横梁 + 一排瓦当 + 两层檐口
  ink([[-8, EAVE], [W + 8, EAVE + 4]], 4.4);
  for (let i = 0; i < 13; i++) {
    const cx = -12 + i * 88;
    ink([[cx, EAVE - 4], [cx + 54, EAVE - 4], [cx + 54, EAVE + 20], [cx, EAVE + 20]], 1.6, PAL.sumiL, true);
    ink([[cx + 27, EAVE + 20], [cx + 27, EAVE + 34]], 1.4, PAL.sumiL);
  }
  ink([[-8, EAVE - 46], [W + 8, EAVE - 42]], 2.4, PAL.sumiL);
  ink([[-8, EAVE - 52], [W + 8, EAVE - 48]], 1.2, rgbaHex(PAL.sumi, .5));

  // 巷子：一排瓦顶平房（梯形屋面 + 厚檐口 + 方窗 + 门洞）
  let hx = -24;
  while (hx < W + 40) {
    const ww = 116 + R() * 84;
    const wallTop = LANE - 40 - R() * 26;
    const ridgeY = wallTop - 42 - R() * 16;
    const c = rgbaHex(PAL.sumi, .5);
    // 墙
    ink([[hx, LANE + 36], [hx, wallTop], [hx + ww, wallTop], [hx + ww, LANE + 36]], 1.8, c);
    // 檐口（厚横线，两端出挑）
    ink([[hx - 10, wallTop], [hx + ww + 10, wallTop]], 2.6, c);
    ink([[hx - 10, wallTop + 7], [hx + ww + 10, wallTop + 7]], 1.4, rgbaHex(PAL.sumi, .32));
    // 屋面梯形 + 屋脊
    const rp = [[hx - 10, wallTop], [hx + ww * .22, ridgeY], [hx + ww * .78, ridgeY], [hx + ww + 10, wallTop]];
    ink(rp, 2.2, c);
    x.save(); x.globalAlpha = .14; x.fillStyle = PAL.sumi; fillPoly(x, rp); x.restore();
    ink([[hx + ww * .2, ridgeY - 3], [hx + ww * .8, ridgeY - 3]], 2.0, c);
    // 瓦垄（自屋脊垂到檐口）
    for (let k = 1; k < 9; k++) {
      const q = k / 9;
      const rt = [lerp(hx + ww * .22, hx + ww * .78, q), ridgeY];
      const eb = [lerp(hx - 8, hx + ww + 8, q)];
      ink([rt, [eb[0], wallTop - 2]], .9, rgbaHex(PAL.sumi, .26));
    }
    // 方窗两扇（带十字棂）
    for (const q of [.16, .58]) {
      const wx = hx + ww * q, wy = wallTop + 20, w2 = 30, h2 = 34;
      ink([[wx, wy], [wx + w2, wy], [wx + w2, wy + h2], [wx, wy + h2]], 1.2, rgbaHex(PAL.sumi, .42), true);
      ink([[wx + w2 / 2, wy], [wx + w2 / 2, wy + h2]], .9, rgbaHex(PAL.sumi, .3));
      ink([[wx, wy + h2 / 2], [wx + w2, wy + h2 / 2]], .9, rgbaHex(PAL.sumi, .3));
    }
    // 门洞（深色，带门框）
    const dx0 = hx + ww * .82;
    ink([[dx0, LANE + 36], [dx0, wallTop + 12], [dx0 + 32, wallTop + 12], [dx0 + 32, LANE + 36]], 1.2, rgbaHex(PAL.sumi, .55), true);
    hx += ww + 8;
  }
  // 巷口路灯：杆、横臂、灯罩
  ink([[150, LANE + 40], [150, LANE - 186]], 2.4, rgbaHex(PAL.sumi, .6));
  ink([[150, LANE - 186], [184, LANE - 186]], 1.8, rgbaHex(PAL.sumi, .6));
  ink([[128, LANE - 182], [172, LANE - 182], [184, LANE - 218], [116, LANE - 218]], 1.8, rgbaHex(PAL.sumi, .6), true);
  ink([[150, LANE - 218], [150, LANE - 232]], 1.3, rgbaHex(PAL.sumi, .45));



  // 檐下挂的货：一串铁皮杯、两把锅铲、一捆衣架
  ink([[120, EAVE + 26], [560, EAVE + 30]], 2.0, PAL.sumiL);
  for (let i = 0; i < 5; i++) {
    const gx = 160 + i * 82;
    ink([[gx, EAVE + 30], [gx, EAVE + 52]], 1.2, rgbaHex(PAL.sumi, .5));
    ink([[gx - 17, EAVE + 52], [gx + 17, EAVE + 52], [gx + 13, EAVE + 96], [gx - 13, EAVE + 96]], 2.0, PAL.sumi, true);
    ink(circlePts(gx, EAVE + 52, 17, 16), 1.8, PAL.sumi);
  }
  for (let i = 0; i < 2; i++) {
    const gx = 470 + i * 46;
    ink([[gx, EAVE + 30], [gx, EAVE + 96]], 1.6, PAL.sumiL);
    ink([[gx - 18, EAVE + 96], [gx + 18, EAVE + 96], [gx + 14, EAVE + 140], [gx - 14, EAVE + 140]], 1.8, PAL.sumiL, true);
  }
  // 衣架一捆
  for (let i = 0; i < 4; i++) {
    const gx = 560 + i * 12;
    ink([[gx, EAVE + 30], [gx, EAVE + 74], [gx - 16, EAVE + 104], [gx + 16, EAVE + 104], [gx, EAVE + 74]], 1.2, rgbaHex(PAL.sumi, .55));
  }

  // 小摊：台面、立柱、檩条
  ink([[STALL.x0 - 14, STALL.top - 16], [STALL.x1 + 14, STALL.top - 16]], 3.6);
  ink([[STALL.x0 - 14, STALL.top + 14], [STALL.x1 + 14, STALL.top + 14]], 2.0, PAL.sumiL);
  for (const px of [STALL.x0, (STALL.x0 + STALL.x1) / 2, STALL.x1]) {
    ink([[px - 11, STALL.top + 14], [px - 11, STALL.foot]], 2.8);
    ink([[px + 11, STALL.top + 14], [px + 11, STALL.foot]], 2.8);
    // 斜撑
    ink([[px - 11, STALL.top + 46], [px + 26, STALL.top + 130]], 1.8, PAL.sumiL);
  }
  for (const y of [STALL.top + 130, STALL.top + 250]) {
    ink([[STALL.x0 + 8, y], [STALL.x1 - 8, y]], 2.0);
    ink([[STALL.x0 + 8, y + 16], [STALL.x1 - 8, y + 16]], 1.4, PAL.sumiL);
  }
  // 台下木箱两只
  ink([[190, STALL.top + 250], [190, STALL.top + 96], [300, STALL.top + 96], [300, STALL.top + 250]], 2.0, PAL.sumiL, true);
  ink([[210, STALL.top + 170], [280, STALL.top + 170]], 1.6, PAL.sumiL);
  ink([[330, STALL.top + 250], [332, STALL.top + 130], [420, STALL.top + 130], [420, STALL.top + 250]], 1.8, PAL.sumiL, true);

  // 台面货：白铁壶（左侧）：壶身、壶盖、壶嘴、提梁
  const KX = 292, KB = STALL.top - 14, KH = 96;
  ink([[KX - 50, KB], [KX - 44, KB - KH * .55], [KX - 26, KB - KH], [KX + 26, KB - KH],
    [KX + 44, KB - KH * .55], [KX + 50, KB]], 2.8);
  ink([[KX + 50, KB], [KX - 50, KB]], 2.4, PAL.sumi);
  // 壶盖
  ink([[KX - 30, KB - KH], [KX - 22, KB - KH - 12], [KX + 22, KB - KH - 12], [KX + 30, KB - KH]], 2.2);
  ink([[KX - 8, KB - KH - 12], [KX - 6, KB - KH - 24], [KX + 6, KB - KH - 24], [KX + 8, KB - KH - 12]], 1.8);
  // 壶嘴（左出，上翘）
  ink([[KX - 46, KB - KH * .34], [KX - 74, KB - KH * .72], [KX - 82, KB - KH * .86], [KX - 68, KB - KH * .78], [KX - 36, KB - KH * .5]], 2.4);
  // 提梁（半圆，跨在壶口两侧）
  const arc = []; for (let i = 0; i <= 18; i++) { const a = Math.PI * (1 - i / 18); arc.push([KX + Math.cos(a) * 44, KB - KH * .92 - Math.sin(a) * 56]); }
  ink(arc, 2.2);
  // 壶身弦纹与錾痕
  ink([[KX - 48, KB - KH * .28], [KX + 48, KB - KH * .30]], 1.4, PAL.sumiL);
  ink([[KX - 44, KB - KH * .62], [KX + 44, KB - KH * .64]], 1.2, rgbaHex(PAL.sumi, .45));
  for (let i = 0; i < 5; i++) ink([[KX - 40 + i * 20, KB - KH * .4], [KX - 38 + i * 20, KB - 8]], .8, rgbaHex(PAL.sumi, .22));


  // 台面货：五只铁皮舀米杯（第六只由摊主手里端着，在 drawMan 里画）
  const CUPS = [[400, 0], [468, 0], [536, 0], [642, 1], [702, 1]];
  for (let i = 0; i < CUPS.length; i++) {
    const cxx = CUPS[i][0], row = CUPS[i][1];
    const cyy = STALL.top - 16, h3 = 76 - row * 8, w3 = 54;
    // 筒身（上宽下略窄，闭合）
    ink([[cxx - w3 / 2, cyy - h3], [cxx + w3 / 2, cyy - h3], [cxx + w3 / 2 - 7, cyy], [cxx - w3 / 2 + 7, cyy]], 2.6, PAL.sumi, true);
    // 杯口椭圆 + 内圈
    const rim = circlePts(cxx, cyy - h3, w3 / 2, 20);
    const rim2 = []; for (let k = 0; k < rim.length; k++) rim2.push([cxx + (rim[k][0] - cxx) * .74, cyy - h3 + (rim[k][1] - (cyy - h3)) * .55]);
    ink(rim, 2.3, PAL.sumi);
    ink(rim2.slice(1), 1.1, rgbaHex(PAL.sumi, .55));
    // 卷压痕
    ink([[cxx - w3 / 2 + 3, cyy - h3 * .46], [cxx + w3 / 2 - 3, cyy - h3 * .46]], 1.1, rgbaHex(PAL.sumi, .45));
    // 侧棱
    ink([[cxx + 12, cyy - h3 + 2], [cxx + 8, cyy - 2]], 1.0, rgbaHex(PAL.sumi, .4));
  }

  // 台面货：一摞相册（右）
  for (let i = 0; i < 4; i++) {
    const yy = STALL.top - 18 - i * 12;
    ink([[600, yy], [746, yy], [748, yy - 10], [602, yy - 10]], 1.8, PAL.sumiL, true);
  }
  ink([[660, STALL.top - 66], [664, STALL.top - 74], [700, STALL.top - 74]], 1.4, rgbaHex(PAL.sumi, .5));

  // 自行车（左，靠摊放着）
  const bx = 226, by = GROUND + 6, r = 84;
  wheel(x, bx - 108, by - r, r, 1.9);
  wheel(x, bx + 96, by - r, r, 1.9);
  ink([[bx - 108, by - r], [bx - 12, by - r * 2.02], [bx + 96, by - r]], 2.4);
  ink([[bx - 108, by - r], [bx - 26, by - 18], [bx + 28, by - r * 1.98]], 2.4);
  ink([[bx - 12, by - r * 2.02], [bx + 18, by - r * 2.02], [bx + 22, by - r * 2.16]], 2.0);
  ink([[bx + 96, by - r], [bx + 118, by - r * 2.08]], 2.0);
  // 车筐与货
  ink([[bx + 6, by - r * 1.94], [bx + 66, by - r * 1.94], [bx + 62, by - r * 1.66], [bx + 10, by - r * 1.66]], 1.8, PAL.sumiL, true);
  ink([[bx + 20, by - r * 1.9], [bx + 24, by - r * 1.68]], 1.2, rgbaHex(PAL.sumi, .4));

  // 猫：蹲在摊脚边，尾巴卷着
  catStatic(x);

  // 地面、街石、积水
  ink([[-8, GROUND], [W + 8, GROUND + 6]], 3.8);
  for (let i = 0; i < 9; i++) ink([[56 + i * 124, GROUND + 10], [34 + i * 124, H - 24]], 1.4, rgbaHex(PAL.sumi, .5));
  for (let i = 0; i < 4; i++) {
    const yy = GROUND + 70 + i * 78;
    ink([[20, yy], [W - 20, yy + 4]], 1.1, rgbaHex(PAL.grey, .45));
  }
  // 积水：几处横划
  for (let i = 0; i < 3; i++) {
    const cx2 = 240 + i * 300, cy2 = GROUND + 96 + i * 44;
    ink([[cx2 - 76, cy2], [cx2 + 76, cy2 + 3]], 2.2, rgbaHex(PAL.prusD, .35));
    ink([[cx2 - 52, cy2 + 12], [cx2 + 58, cy2 + 14]], 1.4, rgbaHex(PAL.prusD, .28));
  }

  // 幌子的边与竹竿
  ink([[560, EAVE + 18], [740, EAVE + 18]], 2.4);
  ink([[600, EAVE + 30], [600, EAVE + 318]], 2.2);
  ink([[706, EAVE + 30], [706, EAVE + 318]], 2.2);
  ink([[600, EAVE + 316], [628, EAVE + 344], [650, EAVE + 316], [672, EAVE + 342], [706, EAVE + 316]], 1.9, PAL.sumiL);
}

function wheel(x, cx, cy, r, lw) {
  line(x, circlePts(cx, cy, r, 40), lw, PAL.sumi, true);
  line(x, circlePts(cx, cy, r * .8, 32), 1.1, rgbaHex(PAL.sumi, .55), true);
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU;
    line(x, [[cx + Math.cos(a) * r * .12, cy + Math.sin(a) * r * .12], [cx + Math.cos(a) * r * .78, cy + Math.sin(a) * r * .78]], .8, rgbaHex(PAL.sumi, .5));
  }
}

function catStatic(x) {
  const { x: cx, y: cy } = CAT;
  // 身：一团，背线
  line(x, [[cx - 46, cy], [cx - 30, cy - 48], [cx - 4, cy - 64], [cx + 22, cy - 56], [cx + 40, cy - 26], [cx + 42, cy]], 2.4, PAL.sumi, true);
  // 头 + 两耳
  line(x, [[cx + 22, cy - 68], [cx + 14, cy - 92], [cx + 34, cy - 84], [cx + 50, cy - 96], [cx + 50, cy - 70]], 2.2, PAL.sumi, true);
  // 尾（静态底，动态在 render 里补）
  line(x, [[cx - 46, cy - 6], [cx - 78, cy - 22], [cx - 92, cy - 52]], 2.2, PAL.sumi);
}

function circlePts(cx, cy, r, n = 24, a0 = 0) {
  const p = []; for (let i = 0; i <= n; i++) { const a = a0 + i / n * TAU; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p;
}

// 巷子里撑伞的路人（远景小影，会走）
function drawPed(x, cx, base, t) {
  const h = 96, st = Math.floor(t * 8) / 8, stepPh = (t * 8) % 2;
  const inkW = (pts, w = 1.8, col = rgbaHex(PAL.sumi, .62), closed = false) => line(x, pts, w, col, closed);
  const sw = Math.sin(stepPh * Math.PI) * 5;
  // 伞
  const uy = base - h - 18;
  inkW([[cx - 2, uy], [cx - 2, base - h * .52]], 1.3);
  const arc = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (i / 14); arc.push([cx - 2 + Math.cos(a) * 34, uy - Math.sin(a) * 16]); }
  inkW(arc, 1.8);
  for (let i = 1; i < 8; i++) { const a = Math.PI * (i / 8); inkW([[cx - 2 + Math.cos(a) * 34 * .92, uy - Math.sin(a) * 14], [cx - 2 + Math.cos(a) * 5, uy]], .8, rgbaHex(PAL.sumi, .4)); }
  // 身
  inkW([[cx - 1, base - h * .52], [cx + 2, base - h * .22], [cx + 12, base - h * .18]], 2.2);
  inkW([[cx - 9, base - h * .3], [cx - 2, base - h * .16]], 1.6);
  // 腿（交替迈）
  inkW([[cx + 8, base - h * .2], [cx + 14 + sw, base]], 1.8);
  inkW([[cx + 8, base - h * .2], [cx + 2 - sw, base]], 1.8);
}


// ── 色块缓存（只留胡麻摺）──
const BK = { ink: mk(), sky: mk(), ochre: mk(), red: mk() };
{
  const xi = BK.ink.getContext('2d'); drawInk(xi);
  inkify(BK.ink, { speck: .34, grain: 0, baren: .10 });
  const xs = BK.sky.getContext('2d'); drawSky(xs);
  inkify(BK.sky, { speck: .20, grain: 0, baren: .08 });
  const xo = BK.ochre.getContext('2d'); drawOchre(xo);
  inkify(BK.ochre, { speck: .26, grain: 0, baren: .10 });
  const xr = BK.red.getContext('2d'); drawRed(xr);
  inkify(BK.red, { speck: .22, grain: 0, baren: .08 });
}

// ══════════════ 人物：摊主（有脸、有手、会动）══════════════
// 关节：肩、肘（两骨 IK）；衣服为大袖工装（深墨填），红围裙在朱版里。
function ik(shoulder, target, l1, l2, bend = 1) {
  const dx = target[0] - shoulder[0], dy = target[1] - shoulder[1];
  const raw = Math.hypot(dx, dy) || 1e-3;
  const d = Math.min(raw, l1 + l2 - 2);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const base = Math.atan2(dy, dx) + a * bend;
  const elbow = [shoulder[0] + Math.cos(base) * l1, shoulder[1] + Math.sin(base) * l1];
  const hand = [shoulder[0] + (dx / raw) * d, shoulder[1] + (dy / raw) * d];
  return { elbow, hand };
}

const CUP_SLOT = { x: 800, y: STALL.top - 78 };   // 他伸手取的那只杯

function drawMan(x, t) {
  const h = MAN.h, mx = MAN.x, fy = MAN.feet;
  const top = fy - h;
  const headR = 30, headC = [mx + 2, top + 34];
  const neck = [mx + 1, top + 64];
  const sh = [mx - 4, top + 88];                     // 肩线
  const hip = [mx, top + 250];
  const breathe = Math.sin(t * 1.6) * 1.4;
  const sway = Math.sin(t * 0.8) * 1.6;

  const armL1 = h * 0.182, armL2 = h * 0.178;
  const rest = [mx + 54, top + 306];
  const keys = [
    [2.4, rest], [3.6, [CUP_SLOT.x + 10, CUP_SLOT.y + 12]], [4.9, [mx - 92, top + 236]],
    [6.1, [CUP_SLOT.x + 10, CUP_SLOT.y + 12]], [7.3, rest], [99, rest],
  ];
  const handTarget = (tt) => {
    for (let i = 1; i < keys.length; i++) if (tt < keys[i][0]) {
      const q = E(clamp((tt - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
      return [lerp(keys[i - 1][1][0], keys[i][1][0], q), lerp(keys[i - 1][1][1], keys[i][1][1], q)];
    }
    return keys[keys.length - 1][1];
  };
  const rightHand = handTarget(t);
  const armR = ik([sh[0] + 46, sh[1] + 12], rightHand, armL1, armL2, 1);
  const leftHand = [mx - 58 + Math.sin(t * 1.1) * 4, top + 300];
  const armL = ik([sh[0] - 46, sh[1] + 12], leftHand, armL1, armL2, 1);

  const stroke = (pts, w = 2.4, col = PAL.sumi, closed = false) => line(x, pts, w, col, closed);
  const polyFill = (pts, a = .34) => { x.save(); x.globalAlpha = a; x.fillStyle = PAL.sumi; fillPoly(x, pts); x.restore(); };

  // 影子
  x.save(); x.globalAlpha = .16; x.fillStyle = PAL.sumi;
  x.beginPath(); x.ellipse(mx + 6, fy + 6, 96, 15, 0, 0, TAU); x.fill(); x.restore();

  // ── 腿：两条裤筒（上宽下窄，带膝褶）──
  const legPts = (sgn) => [
    [hip[0] + sgn * 30, hip[1] + 4], [hip[0] + sgn * 44, hip[1] + 62],
    [hip[0] + sgn * 34 + sway, fy - 40], [hip[0] + sgn * 20 + sway, fy - 36],
    [hip[0] + sgn * 8, hip[1] + 70],
  ];
  for (const sgn of [-1, 1]) {
    const pts = legPts(sgn);
    polyFill(pts, .30);
    stroke(pts, 2.3, PAL.sumi, true);
    stroke([[hip[0] + sgn * 26, hip[1] + 74], [hip[0] + sgn * 20 + sway, fy - 44]], 1.1, rgbaHex(PAL.sumi, .5));
  }
  // 鞋：布鞋（前圆后跟）
  for (const sgn of [-1, 1]) {
    const bx = hip[0] + sgn * 30 + sway;
    stroke([[bx - 22, fy - 34], [bx + 22, fy - 34], [bx + 30, fy - 6], [bx + 20, fy], [bx - 24, fy], [bx - 30, fy - 8]], 2.4, PAL.sumi, true);
    stroke([[bx - 18, fy - 26], [bx + 12, fy - 26]], 1.0, rgbaHex(PAL.sumi, .45));
  }

  // ── 上身：工装（肩宽腰窄）──
  const torso = [
    [sh[0] - 52 + sway, sh[1] + breathe], [sh[0] - 56 + sway, sh[1] + 70],
    [hip[0] - 44, hip[1] - 26], [hip[0] - 40, hip[1] + 6],
    [hip[0] + 40, hip[1] + 6], [hip[0] + 44, hip[1] - 26],
    [sh[0] + 56 + sway, sh[1] + 70], [sh[0] + 52 + sway, sh[1] + breathe],
  ];
  polyFill(torso, .34);
  stroke(torso, 2.8, PAL.sumi, true);

  // 肩线、领口、门襟
  stroke([[sh[0] - 52, sh[1] + 4], [sh[0] - 18, sh[1] - 4], [headC[0] - 28, sh[1] - 4]], 2.2);
  stroke([[sh[0] + 52, sh[1] + 4], [sh[0] + 18, sh[1] - 4], [headC[0] + 28, sh[1] - 4]], 2.2);
  stroke([[headC[0] - 26, sh[1] - 2], [headC[0] + 4, sh[1] + 62], [headC[0] + 30, sh[1] - 2]], 2.0);
  stroke([[headC[0] + 12, sh[1] + 30], [hip[0] + 2, hip[1] - 8]], 1.6, rgbaHex(PAL.sumi, .65));
  // 扣子三枚
  for (let i = 0; i < 3; i++) { x.save(); x.fillStyle = PAL.sumi; x.beginPath(); x.arc(headC[0] + 14 + i * 2, sh[1] + 56 + i * 34, 2.4, 0, TAU); x.fill(); x.restore(); }
  // 衣褶：腰侧、下摆
  stroke([[sh[0] - 40, sh[1] + 92], [hip[0] - 34, hip[1] - 34]], 1.2, rgbaHex(PAL.sumi, .45));
  stroke([[sh[0] + 40, sh[1] + 96], [hip[0] + 30, hip[1] - 40]], 1.2, rgbaHex(PAL.sumi, .45));
  stroke([[hip[0] - 36, hip[1] - 2], [hip[0] + 36, hip[1] - 2]], 1.2, rgbaHex(PAL.sumi, .35));

  // ── 袖：沿两骨的宽条，一头接肩一头收袖口 ──
  sleevePoly(x, [sh[0] - 46, sh[1] + 10], armL.elbow, armL.hand, 26, 15);
  sleevePoly(x, [sh[0] + 46, sh[1] + 12], armR.elbow, armR.hand, 28, 16);

  // 手腕
  stroke([armL.elbow, armL.hand], 2.0, rgbaHex(PAL.sumi, .8));
  stroke([armR.elbow, armR.hand], 2.0, rgbaHex(PAL.sumi, .8));

  // 手
  hand(x, armR.hand, Math.atan2(armR.hand[1] - armR.elbow[1], armR.hand[0] - armR.elbow[0]), 1);
  hand(x, armL.hand, Math.atan2(armL.hand[1] - armL.elbow[1], armL.hand[0] - armL.elbow[0]), -1);

  // 脖子（填一块，短）
  x.save(); x.globalAlpha = .30; x.fillStyle = PAL.sumi;
  x.beginPath(); x.moveTo(headC[0] - 15, headC[1] + 18); x.lineTo(headC[0] + 15, headC[1] + 18);
  x.lineTo(sh[1] - 4, sh[1] * 0 + sh[1] - 4); x.lineTo(headC[0] - 15, headC[1] + 18); x.closePath(); x.fill(); x.restore();
  stroke([[headC[0] - 13, headC[1] + 20], [headC[0] - 15, sh[1] - 2]], 1.6, rgbaHex(PAL.sumi, .5));
  stroke([[headC[0] + 13, headC[1] + 20], [headC[0] + 15, sh[1] - 2]], 1.6, rgbaHex(PAL.sumi, .5));


  // 手里那只铁皮杯（他取的那只）：3.4–6.9 s 跟着手走，其余时间在台面上
  const cupFollow = t > 3.4 && t < 6.9;
  const cupPos = cupFollow ? [armR.hand[0] - 2, armR.hand[1] - 12] : [CUP_SLOT.x, CUP_SLOT.y + 62];
  drawTinCup(x, cupPos[0], cupPos[1], cupFollow);


  head(x, headC, headR, Math.sin(t * 0.6) * .05 + (cupFollow ? -0.10 : 0), t);
}

function fillPoly(x, pts) { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) x.lineTo(p[0], p[1]); x.closePath(); x.fill(); }

// 铁皮舀米杯：口椭圆 + 锥筒 + 卷边 + 一道卷压痕
function drawTinCup(x, cx, mouthY, held) {
  const w = 48, hh = 62;
  x.save();
  x.strokeStyle = PAL.sumi; x.lineWidth = 2.4; x.lineCap = 'round';
  // 筒身
  x.beginPath();
  x.moveTo(cx - w / 2, mouthY);
  x.quadraticCurveTo(cx - w / 2 + 3, mouthY + hh * .55, cx - w / 2 + 6, mouthY + hh);
  x.quadraticCurveTo(cx, mouthY + hh + 6, cx + w / 2 - 6, mouthY + hh);
  x.quadraticCurveTo(cx + w / 2 - 3, mouthY + hh * .55, cx + w / 2, mouthY);
  x.stroke();
  // 杯口（椭圆）
  x.beginPath(); x.ellipse(cx, mouthY, w / 2, 9, 0, 0, TAU); x.stroke();
  x.beginPath(); x.ellipse(cx, mouthY + 2, w / 2 - 5, 6, 0, 0, TAU); x.lineWidth = 1.2; x.stroke();
  // 卷压的一道横纹
  x.lineWidth = 1.1; x.globalAlpha = .55;
  x.beginPath(); x.moveTo(cx - w / 2 + 3, mouthY + hh * .42);
  x.quadraticCurveTo(cx, mouthY + hh * .42 + 7, cx + w / 2 - 3, mouthY + hh * .42); x.stroke();
  x.globalAlpha = 1;
  if (held) { x.lineWidth = 1.0; x.globalAlpha = .35; x.beginPath(); x.ellipse(cx, mouthY + hh + 4, w / 2 - 2, 5, 0, 0, TAU); x.stroke(); x.globalAlpha = 1; }
  x.restore();
}

function sleevePoly(x, sh, el, hd, w0, w1) {
  // 法向按肩→手的总方向取，保证袖管是一条，不会绕成圈
  const dx = hd[0] - sh[0], dy = hd[1] - sh[1];
  const L = Math.hypot(dx, dy) || 1, ux = -dy / L, uy = dx / L;
  const pts = [
    [sh[0] + ux * w0, sh[1] + uy * w0],
    [el[0] + ux * (w0 * .86), el[1] + uy * (w0 * .86)],
    [hd[0] + ux * w1, hd[1] + uy * w1],
    [hd[0] - ux * w1, hd[1] - uy * w1],
    [el[0] - ux * (w0 * .86), el[1] - uy * (w0 * .86)],
    [sh[0] - ux * w0, sh[1] - uy * w0],
  ];
  x.save(); x.globalAlpha = .44; x.fillStyle = PAL.sumi; fillPoly(x, pts); x.restore();
  line(x, pts, 2.8, PAL.sumi, true);
  // 袖口
  const c = [lerp(el[0], hd[0], .72), lerp(el[1], hd[1], .72)];
  line(x, [[c[0] + ux * (w1 * 1.15), c[1] + uy * (w1 * 1.15)], [c[0] - ux * (w1 * 1.15), c[1] - uy * (w1 * 1.15)]], 1.5, rgbaHex(PAL.sumi, .6));
  // 肘部褶两笔
  line(x, [[el[0] + ux * (w0 * .8), el[1] + uy * (w0 * .8)], [el[0] + ux * (w0 * .2), el[1] + uy * (w0 * .2) + 4]], 1.0, rgbaHex(PAL.sumi, .4));
}

function hand(x, p, ang, side) {
  x.save(); x.translate(p[0], p[1]); x.rotate(ang);
  x.strokeStyle = PAL.sumi; x.lineWidth = 1.9; x.lineCap = 'round';
  // 掌（掌心 + 虎口）
  x.beginPath(); x.moveTo(-13, -9); x.quadraticCurveTo(6, -14, 15, -5);
  x.quadraticCurveTo(18, 3, 12, 10); x.quadraticCurveTo(-4, 15, -14, 7); x.closePath(); x.stroke();
  // 四指（长短不一）
  const fw = [15, 18, 17, 14];
  for (let i = 0; i < 4; i++) {
    const yy = -8 + i * 5.2;
    x.beginPath(); x.moveTo(11, yy); x.lineTo(11 + fw[i], yy - side * (1 + i * .5)); x.stroke();
  }
  // 拇指
  x.beginPath(); x.moveTo(-9, 8); x.quadraticCurveTo(-16, 12, -13, 17); x.stroke();
  x.restore();
}

function head(x, c, r, turn, t) {
  x.save(); x.translate(c[0], c[1]); x.rotate(turn);
  x.strokeStyle = PAL.sumi; x.lineWidth = 2.6; x.lineCap = 'round';
  // 脸型：短额、宽颧、收下巴
  x.beginPath();
  x.moveTo(-r, -4); x.quadraticCurveTo(-r + 1, -r * .78, -r * .5, -r);
  x.quadraticCurveTo(r * .2, -r * 1.16, r * .8, -r * .72);
  x.quadraticCurveTo(r + 1, -6, r * .92, r * .30);
  x.quadraticCurveTo(r * .7, r * .92, 0, r * 1.0);
  x.quadraticCurveTo(-r * .72, r * .9, -r, r * .26);
  x.closePath(); x.stroke();
  // 头发：顶部一块重墨，两侧留短鬓
  x.save(); x.fillStyle = PAL.sumi; x.globalAlpha = .92;
  x.beginPath();
  x.moveTo(-r - 1, -6); x.quadraticCurveTo(-r - 2, -r * 1.1, -r * .4, -r * 1.18);
  x.quadraticCurveTo(r * .5, -r * 1.26, r * .9, -r * .8);
  x.quadraticCurveTo(r + 2, -r * .5, r + 1, -6);
  x.quadraticCurveTo(r - 6, -r * .62, r - 16, -r * .58);
  x.quadraticCurveTo(0, -r * .96, -r + 14, -r * .56);
  x.quadraticCurveTo(-r + 2, -r * .66, -r - 1, -6);
  x.closePath(); x.fill(); x.restore();
  // 鬓角两笔
  x.lineWidth = 1.6;
  x.beginPath(); x.moveTo(-r + 2, -8); x.quadraticCurveTo(-r - 1, 4, -r + 1, 12); x.stroke();
  x.beginPath(); x.moveTo(r - 1, -8); x.quadraticCurveTo(r + 3, 4, r, 12); x.stroke();
  // 耳
  x.beginPath(); x.ellipse(-r - 2, 3, 5, 9, .16, 0, TAU); x.stroke();
  x.beginPath(); x.ellipse(r + 2, 3, 5, 9, -.16, 0, TAU); x.stroke();
  // 眉（左高右低，年纪）
  x.lineWidth = 2.0;
  x.beginPath(); x.moveTo(-22, -13); x.quadraticCurveTo(-14, -19, -5, -14); x.stroke();
  x.beginPath(); x.moveTo(6, -15); x.quadraticCurveTo(15, -19, 23, -12); x.stroke();
  // 眼（含眨眼）
  const blink = (t > 5.2 && t < 5.42) || (t > 8.0 && t < 8.2);
  if (!blink) {
    x.lineWidth = 1.7;
    x.beginPath(); x.moveTo(-19, -4); x.quadraticCurveTo(-12, 3, -4, -4); x.stroke();
    x.beginPath(); x.moveTo(4, -4); x.quadraticCurveTo(12, 3, 18, -4); x.stroke();
    x.fillStyle = PAL.sumi;
    x.beginPath(); x.arc(-11.5, -1, 2.4, 0, TAU); x.fill();
    x.beginPath(); x.arc(11, -1, 2.4, 0, TAU); x.fill();
    // 卧蚕
    x.lineWidth = .9; x.globalAlpha = .5;
    x.beginPath(); x.moveTo(-18, 5); x.quadraticCurveTo(-11, 8, -5, 5); x.stroke();
    x.globalAlpha = 1;
  } else {
    x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(-19, -3); x.quadraticCurveTo(-12, 1, -4, -3); x.stroke();
    x.beginPath(); x.moveTo(4, -3); x.quadraticCurveTo(12, 1, 18, -3); x.stroke();
  }
  // 鼻（鼻梁 + 鼻头 + 翼）
  x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(0, -2); x.quadraticCurveTo(3, 9, -2, 12); x.stroke();
  x.beginPath(); x.moveTo(-4, 14); x.lineTo(6, 14); x.stroke();
  x.lineWidth = 1;
  x.beginPath(); x.moveTo(6, 12); x.quadraticCurveTo(9, 14, 6, 17); x.stroke();
  // 嘴（上唇一笔，下唇一笑）
  x.lineWidth = 1.8;
  x.beginPath(); x.moveTo(-9, 22); x.quadraticCurveTo(0, 25, 9, 21); x.stroke();
  x.lineWidth = 1.0;
  x.beginPath(); x.moveTo(-6, 29); x.quadraticCurveTo(1, 32, 7, 28); x.stroke();
  // 法令、眼角纹
  x.lineWidth = 1.0; x.globalAlpha = .45;
  x.beginPath(); x.moveTo(-15, 9); x.quadraticCurveTo(-11, 18, -7, 23); x.stroke();
  x.beginPath(); x.moveTo(17, 9); x.quadraticCurveTo(13, 18, 9, 23); x.stroke();
  x.globalAlpha = 1;
  // 下巴一道阴影
  x.globalAlpha = .2; x.fillStyle = PAL.sumi;
  x.beginPath(); x.ellipse(0, r * .62, r * .42, 5, 0, 0, TAU); x.fill();
  x.restore();
}

// ══════════════ 一帧 ══════════════
window.render = function render(t) {
  const zoom = 1 + 0.035 * S(clamp(t / DUR));
  const camX = 540, camY = 960;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = PAL.mountD; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);

  ctx.drawImage(TX.paper, -160, -160, W + 320, H + 320);
  ctx.save();
  ctx.beginPath(); ctx.rect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0); ctx.clip();

  const rSky = clamp((t - 0.45) / 1.2), rInk = clamp(t / 1.6);
  const rOch = clamp((t - 1.0) / 1.0), rRed = clamp((t - 1.5) / 0.95);
  if (rSky > 0) stampLayer(ctx, BK.sky, rSky, REG[1], SHIFT[1]);
  if (rOch > 0) stampLayer(ctx, BK.ochre, rOch, REG[2], SHIFT[2]);
  if (rInk > 0) stampLayer(ctx, BK.ink, rInk, REG[0], SHIFT[0]);

  // 人在色块之后（压在印层上），也要带一点错版：红围裙偏移半格
  const manA = clamp((t - 2.2) / 0.8);
  if (manA > 0) {
    ctx.save(); ctx.globalAlpha = manA;
    drawMan(ctx, t);
    ctx.restore();
  }
  if (rRed > 0) { ctx.save(); ctx.translate(SHIFT[3][0] * .4, SHIFT[3][1] * .4); ctx.globalAlpha = rRed * .96; stampLayer(ctx, BK.red, 1, [0, 0], [0, 0]); ctx.restore(); }

  // 巷子里一个撑伞的人，慢慢往左走（远景小影）
  const pedX = 1010 - E(clamp(t / 9.2)) * 700;
  if (t > 2.0) drawPed(ctx, pedX, LANE + 32, t);

  // 落雨：12 fps 步进（轻微斜）
  const step = Math.floor(t * 12) / 12;
  const RAIN_N = 78;
  const R = mulberry(17);
  for (let i = 0; i < RAIN_N; i++) {
    const x0 = 6 + R() * (W - 12);
    const y0 = -60 + ((i * 37 + step * 700) % (GROUND - 60));
    const len = 40 + R() * 110;
    const a = .30 + R() * .18;
    ctx.strokeStyle = rgbaHex(PAL.prusD, a); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 - 5, y0 + len); ctx.stroke();
  }
  // 雨打篷布：幌子上的水珠顺着边跑
  const wsw = Math.sin(t * 2.2) * 4;
  ctx.strokeStyle = rgbaHex(PAL.prusD, .35); ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    const yy = EAVE + 60 + ((t * 90 + i * 110) % 240);
    ctx.beginPath(); ctx.moveTo(706 - i * 34, yy); ctx.lineTo(706 - i * 34 - 2, yy + 16); ctx.stroke();
  }

  // 猫尾巴：摆动
  const catA = Math.sin(t * 1.4) * 12;
  ctx.strokeStyle = PAL.sumi; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(CAT.x - 44, CAT.y - 8);
  ctx.quadraticCurveTo(CAT.x - 80, CAT.y - 26 + catA, CAT.x - 92, CAT.y - 54 + catA * .6);
  ctx.stroke();

  // 题签 + 朱印
  const rCart = clamp((t - 3.6) / 0.45), rSeal = clamp((t - 4.4) / 0.3);
  if (rCart > 0) {
    let box = null;
    stampFn(ctx, xx => { box = cartouche(xx, CART.x, CART.y, '门口的小摊', { series: '陆鸿 · 二四', w: CART.w, size: 40, ssize: 19, fill: '#f3e7c6' }); }, rCart, [0, -12]);
    if (box && rSeal > 0) drawSeal(ctx, '陆', CART.x, box.y0 + box.h + 60, 58, rSeal, { seed: 5, rot: .04 });
  }
  // 底下小字
  const a2 = clamp((t - 6.0) / 0.8);
  if (a2 > 0) {
    ctx.globalAlpha = a2; ctx.fillStyle = PAL.sumi; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `500 30px ${FONT_S}`;
    ctx.fillText('bikes · kettles · tin', W / 2, 1810);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  ctx.globalAlpha = .85; ctx.drawImage(TX.fiber, -160, -160, W + 320, H + 320); ctx.globalAlpha = 1;

  const rBor = clamp(t / 0.6);
  if (rBor > 0) stampFn(ctx, xx => {
    xx.strokeStyle = PAL.sumi; xx.lineWidth = 3.6; xx.strokeRect(FR.x0, FR.y0, FR.x1 - FR.x0, FR.y1 - FR.y0);
    xx.lineWidth = 1.3; xx.strokeRect(FR.x0 - 9, FR.y0 - 9, FR.x1 - FR.x0 + 18, FR.y1 - FR.y0 + 18);
  }, rBor, SHIFT[0]);

  ctx.restore();
  window.READY = true;
};

window.render(0);
window.READY = true;



