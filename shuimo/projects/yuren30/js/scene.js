// scene.js · 013《羽人》前 30 秒 · 水墨样片
// 六场：象岗山 → 黑匣四物 → 南下撞冰 → 削山 → 探方黑洞 → 四十三天七室
// 一切是 t 的纯函数；画面 = 宣纸 + 生成式 SVG 山水 + Canvas 墨色道具 + 墨渗转场。

import {
  W, H, FPS, clamp, lerp, inv, sstep, E, K, mulberry32, hash,
  makePaper, makeGrain, sealSprite, drawSeal, vtext, htext,
  inkMask, swipeMask, drawMasked, splatter, inkLine, scrollEdge, scratch,
} from './ink.js';
import { buildSVG, svgToCanvas, fbm } from './kalpa-shan.js';

export { W, H, FPS };
export const V5 = false;
export const DURATION = 30;

let ctx = null;
let paper = null, grain = null;
const L = {};
const SEALS = {};

const OBJ_T = [3.59, 4.90, 5.72, 6.74];
const OBJ_NAMES = ['非洲象牙', '波斯药盒', '五色药石', '丝缕玉衣'];
const OBJ_META = ['长逾一米 · 非洲象', '锤鍱凸瓣 · 古波斯', '约两公斤 · 五石散', '丝线编缀 · 唯一完备'];

/* ================================================================ init */
export async function init(cv) {
  cv.width = W; cv.height = H;
  ctx = cv.getContext('2d');
  await Promise.all([
    document.fonts.load('100px LongCang'),
    document.fonts.load('46px KaiTi'),
    document.fonts.load('32px KaiTi'),
  ]);
  await document.fonts.ready;
  paper = makePaper(W, H, 7);
  grain = makeGrain(W, H, 19);
  const defs = [
    ['site', 'site', 2400, 1350, 13, null],
    ['objects', 'objects', 2400, 1350, 23, null],
    ['coast', 'coast', 3200, 1350, 33, null],
    ['ice', 'ice', 2600, 1350, 43, null],
    ['cut', 'cut', 2600, 1350, 53, null],
    ['cut2', 'cut', 2600, 1350, 53, { cutY: 0.585 }],
    ['pit', 'pit', 2400, 1350, 63, null],
  ];
  await Promise.all(defs.map(async ([k, kind, w, h, seed, opts]) => {
    const svg = buildSVG(kind, w, h, seed, opts || {});
    L[k] = await svgToCanvas(svg, w, h);
  }));
  SEALS['越'] = sealSprite('越', 100, 3);
  SEALS['南越'] = sealSprite('南越', 110, 5);
  SEALS['南越王墓'] = sealSprite('南越王墓', 200, 8, { vertical: true });
  SEALS['羽人'] = sealSprite('羽人', 110, 11);
  SEALS['一'] = sealSprite('一', 64, 21);
  SEALS['二'] = sealSprite('二', 64, 22);
  SEALS['三'] = sealSprite('三', 64, 23);
  SEALS['四'] = sealSprite('四', 64, 24);
  ctx.drawImage(paper, 0, 0);
}

/* ================================================================ render */
export function render(t) {
  t = clamp(t, 0, DURATION - 1e-6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(paper, 0, 0);

  if (t < 1.0) {
    const eye = K(t, [[0, -50], [0.92, H + 50, 'out3']]);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, Math.max(0, eye)); ctx.clip();
    drawTime(t);
    ctx.restore();
    scrollEdge(ctx, Math.max(0, eye), inv(0, 0.18, t) * 0.9);
  } else {
    drawTime(t);
  }

  // 纸齿 / 墨粒：统一压在最上层，像印在纸上
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(grain, 0, 0);
  ctx.restore();

  drawChrome(t);

  // 尾段收纸（字幕最后画，保证最后一句仍可读）
  const fade = sstep(29.55, 30.0, t);
  if (fade > 0) {
    ctx.save(); ctx.globalAlpha = fade * 0.94; ctx.drawImage(paper, 0, 0); ctx.restore();
  }

  drawCaption(t);
}

/* ================================================================ 时间线 */
const CUTS = [
  { t: 3.59, d: 0.62, a: 'site', b: 'objects', type: 'swipe', seed: 101 },
  { t: 8.83, d: 0.62, a: 'objects', b: 'coast', type: 'scroll' },
  { t: 13.16, d: 0.26, a: 'coast', b: 'cut', type: 'whip' },
  { t: 18.32, d: 0.62, a: 'cut', b: 'pit', type: 'vscroll' },
  { t: 24.35, d: 0.68, a: 'pit', b: 'chambers', type: 'bleed', ox: 0.50, oy: 0.66, seed: 105 },
];

function shotAt(t) {
  if (t < 3.59) return 'site';
  if (t < 8.83) return 'objects';
  if (t < 13.16) return 'coast';
  if (t < 18.32) return 'cut';
  if (t < 24.35) return 'pit';
  return 'chambers';
}
function cutAt(t) {
  for (const c of CUTS) if (t >= c.t && t < c.t + c.d) return c;
  return null;
}
function maskEdge(g, mask, alpha = 0.5, shift = 7) {
  const e = scratch('edge', W, H);
  e.drawImage(mask, 0, 0);
  e.globalCompositeOperation = 'destination-out';
  e.drawImage(mask, -shift, -shift);
  e.globalCompositeOperation = 'source-in';
  e.fillStyle = `rgba(26,19,14,${alpha})`;
  e.fillRect(0, 0, W, H);
  e.globalCompositeOperation = 'source-over';
  g.save();
  g.filter = 'blur(2px)';
  g.globalCompositeOperation = 'multiply';
  g.drawImage(e.canvas, 0, 0);
  g.restore();
}

function drawTime(t) {
  const cut = cutAt(t);
  if (!cut) { drawShot(shotAt(t), t, ctx); return; }
  const p = (t - cut.t) / cut.d;
  if (cut.type === 'swipe') {
    drawShot(cut.a, t, ctx);
    // 竖边飞白擦除：从右往左换页
    const e = E.io2(p);
    const xe = W + 40 - e * (W + 120);
    const edge = (y) => xe + (fbm(y / 90, 3.3, cut.seed, 3) - 0.5) * 74 + Math.sin(y * 0.011) * 16;
    const clip = new Path2D();
    clip.moveTo(-20, -20);
    clip.lineTo(edge(0), -20);
    for (let y = 0; y <= H; y += 12) clip.lineTo(edge(y), y);
    clip.lineTo(-20, H + 20);
    clip.closePath();
    ctx.save(); ctx.clip(clip);
    drawShot(cut.b, t, ctx);
    ctx.restore();
    // 湿边 + 飞白
    ctx.save();
    const eg = ctx.createLinearGradient(xe - 70, 0, xe + 18, 0);
    eg.addColorStop(0, 'rgba(22,17,13,0)'); eg.addColorStop(0.65, 'rgba(22,17,13,0.38)'); eg.addColorStop(1, 'rgba(246,240,226,0.75)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.moveTo(edge(0) - 70, 0);
    for (let y = 0; y <= H; y += 14) ctx.lineTo(edge(y) - 70, y);
    for (let y = H; y >= 0; y -= 14) ctx.lineTo(edge(y) + 18, y);
    ctx.closePath(); ctx.fill();
    const RS = mulberry32(cut.seed + 9);
    for (let i = 0; i < 26; i++) {
      const y = RS() * H, len = 30 + RS() * 120;
      ctx.strokeStyle = `rgba(22,17,13,${0.06 + RS() * 0.16})`; ctx.lineWidth = 1 + RS() * 2.4;
      ctx.beginPath(); ctx.moveTo(edge(y) - 10, y); ctx.lineTo(edge(y) - 10 - len, y + (RS() - 0.5) * 24); ctx.stroke();
    }
    ctx.restore();
    if (p < 0.6) splatter(ctx, xe - 30, H * 0.62, 14, cut.seed + 5, 'rgba(24,18,14,0.26)', 100 * p);
  } else if (cut.type === 'bleed') {
    drawShot(cut.a, t, ctx);
    const m = inkMask(W, H, p, cut.ox * W, cut.oy * H, cut.seed, 1.05);
    drawMasked(ctx, m, (g) => drawShot(cut.b, t, g), 1);
    maskEdge(ctx, m, 0.42, 8);
    if (p < 0.5) splatter(ctx, cut.ox * W, cut.oy * H, 18, cut.seed + 3, 'rgba(24,18,14,0.35)', 90 * p);
  } else if (cut.type === 'scroll') {
    ctx.save(); ctx.translate(-p * W, 0); drawShot(cut.a, t, ctx); ctx.restore();
    ctx.save(); ctx.translate((1 - p) * W, 0); drawShot(cut.b, t, ctx); ctx.restore();
    const sx = (1 - p) * W;
    ctx.save();
    let g = ctx.createLinearGradient(sx - 34, 0, sx + 8, 0);
    g.addColorStop(0, 'rgba(60,44,28,0)'); g.addColorStop(0.7, 'rgba(60,44,28,0.18)'); g.addColorStop(1, 'rgba(60,44,28,0.34)');
    ctx.fillStyle = g; ctx.fillRect(sx - 34, 0, 44, H);
    ctx.fillStyle = 'rgba(247,241,228,0.92)'; ctx.fillRect(sx + 2, 0, 10, H);
    ctx.restore();
  } else if (cut.type === 'vscroll') {
    const e = E.in2(p);
    drawShot(cut.b, t, ctx);
    ctx.save(); ctx.globalAlpha = 1 - 0.15 * p; ctx.translate(0, -e * H); drawShot(cut.a, t, ctx); ctx.restore();
    // 横向接缝：一卷向下卷
    const seamY = H - e * H;
    ctx.save();
    const sg = ctx.createLinearGradient(0, seamY - 26, 0, seamY + 12);
    sg.addColorStop(0, 'rgba(22,17,13,0)'); sg.addColorStop(0.66, 'rgba(22,17,13,0.42)'); sg.addColorStop(1, 'rgba(246,240,226,0.80)');
    ctx.fillStyle = sg; ctx.fillRect(0, seamY - 26, W, 40);
    const RV = mulberry32(414);
    for (let i = 0; i < 22; i++) {
      const x = RV() * W, len = 50 + RV() * 220;
      ctx.strokeStyle = `rgba(22,17,13,${0.06 + RV() * 0.16})`; ctx.lineWidth = 1 + RV() * 3;
      ctx.beginPath(); ctx.moveTo(x, seamY - 10 + RV() * 16); ctx.lineTo(x + (RV() - 0.5) * 40, seamY - 10 - len); ctx.stroke();
    }
    ctx.restore();
  } else if (cut.type === 'whip') {
    const e = E.in2(p);
    // 新场先铺满，旧场再抽走：避免中间露纸
    drawShot(cut.b, t, ctx);
    ctx.save(); ctx.globalAlpha = 1 - 0.20 * p; ctx.translate(-e * W * 2.3, 0); drawShot(cut.a, t, ctx); ctx.restore();
    // 接缝笔痕
    const seamX = W - e * W * 2.3;
    ctx.save();
    const sg = ctx.createLinearGradient(seamX - 46, 0, seamX + 10, 0);
    sg.addColorStop(0, 'rgba(22,17,13,0)'); sg.addColorStop(0.72, 'rgba(22,17,13,0.42)'); sg.addColorStop(1, 'rgba(246,240,226,0.72)');
    ctx.fillStyle = sg; ctx.fillRect(seamX - 46, 0, 56, H);
    const RS = mulberry32(313);
    for (let i = 0; i < 16; i++) {
      const y = RS() * H, len = 40 + RS() * 180;
      ctx.strokeStyle = `rgba(22,17,13,${0.08 + RS() * 0.18})`; ctx.lineWidth = 1 + RS() * 3;
      ctx.beginPath(); ctx.moveTo(seamX - 20 + RS() * 24, y); ctx.lineTo(seamX - 20 - len, y + (RS() - 0.5) * 30); ctx.stroke();
    }
    ctx.restore();
    // 横扫飞白：一组斜向笔痕，不用实心墨带
    ctx.save();
    const a0 = Math.sin(Math.PI * p);
    const R = mulberry32(909);
    ctx.globalAlpha = 0.9 * a0;
    ctx.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      const y = -80 + i * 36 + R() * 20;
      const x = -200 + R() * 400;
      const len = 500 + R() * 1500;
      ctx.strokeStyle = `rgba(24,18,13,${0.05 + R() * 0.18})`;
      ctx.lineWidth = 2 + R() * 22;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y - len * 0.12 + (R() - 0.5) * 30); ctx.stroke();
    }
    // 主线
    ctx.strokeStyle = 'rgba(20,15,11,0.35)'; ctx.lineWidth = 60;
    ctx.beginPath(); ctx.moveTo(-100, 640); ctx.quadraticCurveTo(W * 0.5, 520, W + 100, 600); ctx.stroke();
    ctx.restore();
  }
}

/* ================================================================ 相机 */
function applyCam(g, cam) {
  const s = 0.8 * cam.z;
  g.translate(W / 2 + (cam.sx || 0), H / 2 + (cam.sy || 0));
  g.scale(s, s);
  g.translate(-cam.x, -cam.y);
}
function bgLayer(g, img, cam) {
  g.save(); applyCam(g, cam); g.drawImage(img, 0, 0); g.restore();
}
function camShot(t, keys, baseX = 1200, baseY = 675) {
  return {
    x: K(t, keys.x || [[0, baseX]]),
    y: K(t, keys.y || [[0, baseY]]),
    z: K(t, keys.z || [[0, 1.0]]),
    sx: keys.sx ? K(t, keys.sx) : 0,
    sy: keys.sy ? K(t, keys.sy) : 0,
  };
}

/* ================================================================ 场一 · 象岗山 */
function shotSite(g, t) {
  const cam = camShot(t, {
    x: [[0, 1200], [3.6, 1235, 'io2']],
    y: [[0, 700], [3.6, 742, 'io2']],
    z: [[0, 1.06], [3.6, 1.15, 'io2']],
  });
  bgLayer(g, L.site, cam);
  g.save(); applyCam(g, cam);
  drawSiteProps(g, t, cam);
  g.restore();

  // 屏幕空间题记
  branch(g, 1, t, 0.42);
  vtext(g, '象岗山', 218, 238, { size: 58, alpha: 0.55, color: 'rgba(30,24,19,0.8)' });
  vtext(g, '一九八三', 218, 585, { size: 29, alpha: 0.42 });
  g.save(); g.globalAlpha = 0.22; g.strokeStyle = '#2a211a'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(252, 200); g.lineTo(252, 660); g.stroke(); g.restore();
  drawSeal(g, SEALS['越'], 218, 730, 66, -0.05, 0.72);
}

function branch(g, side, t, alpha = 0.5) {
  g.save();
  g.translate(side > 0 ? W : 0, 0);
  g.scale(side > 0 ? -1 : 1, 1);
  g.strokeStyle = 'rgba(24,18,14,1)';
  g.lineCap = 'round';
  const R = mulberry32(4411);
  const draw = (pts, w, a) => {
    g.globalAlpha = a; g.lineWidth = w;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.quadraticCurveTo(pts[i][0] - 20, pts[i][1] + 10, pts[i][0], pts[i][1]);
    g.stroke();
    // 松针
    for (let k = 0; k < 5; k++) {
      const [px, py] = pts[pts.length - 1];
      const bx = px - 10 - R() * 26, by = py - 6 + R() * 20;
      g.lineWidth = 1.2;
      for (let j = 0; j < 7; j++) {
        g.beginPath(); g.moveTo(bx, by);
        g.lineTo(bx - 14 - R() * 18, by - 8 + j * 3.4 + R() * 4); g.stroke();
      }
    }
  };
  draw([[0, 96], [90, 120], [190, 96], [300, 40]], 7, alpha);
  draw([[120, 112], [180, 160], [250, 190]], 4, alpha * 0.8);
  draw([[220, 76], [290, 78], [350, 52]], 3, alpha * 0.7);
  g.restore();
}

function drawSiteAtmosphere(g, t) {
  // 横向雾带
  g.save();
  for (let k = 0; k < 3; k++) {
    const y = 500 + k * 95;
    const x = ((t * (9 + k * 5) + k * 700) % (W + 700)) - 350;
    const rg = g.createRadialGradient(x, y, 10, x, y, 420);
    rg.addColorStop(0, 'rgba(246,240,226,0.30)'); rg.addColorStop(1, 'rgba(246,240,226,0)');
    g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, 420, 34, 0, 0, 7); g.fill();
  }
  g.restore();
  // 飞鸟：三笔
  const bx = -120 + (t - 0.6) * 210;
  for (let i = 0; i < 3; i++) {
    const x = bx - i * 46, y = 300 + i * 22 + Math.sin(t * 2 + i) * 4;
    if (x < -60 || x > W + 60) continue;
    g.save(); g.strokeStyle = 'rgba(28,22,17,0.55)'; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 9, y); g.quadraticCurveTo(x - 4, y - 5, x, y); g.quadraticCurveTo(x + 4, y - 5, x + 9, y); g.stroke();
    g.restore();
  }
  // 浮尘
  const R = mulberry32(606);
  for (let i = 0; i < 18; i++) {
    const x = (R() * W + t * (6 + R() * 12)) % W;
    const y = 380 + R() * 480 + Math.sin(t * 1.3 + i) * 8;
    g.fillStyle = `rgba(80,64,46,${0.05 + R() * 0.10})`;
    g.beginPath(); g.arc(x, y, 0.8 + R() * 1.6, 0, 7); g.fill();
  }
}

function worker(g, x, y, s, pose, seed = 1, alpha = 1) {
  const R = mulberry32(seed);
  g.save(); g.globalAlpha = alpha;
  g.strokeStyle = 'rgba(26,20,16,0.88)'; g.fillStyle = 'rgba(26,20,16,0.88)';
  g.lineCap = 'round'; g.lineJoin = 'round';
  const sw = Math.max(1.2, 2.4 * s);
  // 腿
  g.lineWidth = sw;
  g.beginPath(); g.moveTo(x, y - 20 * s); g.lineTo(x - 8 * s, y); g.moveTo(x, y - 20 * s); g.lineTo(x + 9 * s, y); g.stroke();
  // 身
  g.lineWidth = sw * 1.15;
  g.beginPath(); g.moveTo(x, y - 20 * s); g.lineTo(x + 1 * s, y - 34 * s); g.stroke();
  // 头
  g.beginPath(); g.arc(x + 1.5 * s, y - 40 * s, 4.2 * s, 0, 7); g.fill();
  // 斗笠
  g.beginPath(); g.moveTo(x - 10 * s, y - 43 * s); g.quadraticCurveTo(x + 1 * s, y - 53 * s, x + 12 * s, y - 43 * s); g.fill();
  // 手臂 + 锄头
  const a = pose;
  const hx = x + Math.cos(a) * 20 * s, hy = y - 28 * s + Math.sin(a) * 12 * s;
  g.lineWidth = sw * 0.9;
  g.beginPath(); g.moveTo(x + 1 * s, y - 33 * s); g.lineTo(hx, hy); g.stroke();
  g.lineWidth = sw * 1.6;
  g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a + 0.25) * 22 * s, hy + Math.sin(a + 0.25) * 18 * s); g.stroke();
  g.restore();
}

function drawSiteProps(g, t, cam) {
  // 近景坡石：压住画面左下角
  g.save();
  g.fillStyle = 'rgba(22,16,12,0.50)';
  g.beginPath();
  g.moveTo(-40, 1370); g.lineTo(80, 1250); g.lineTo(190, 1206); g.lineTo(300, 1232);
  g.lineTo(390, 1300); g.lineTo(460, 1370); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(18,13,10,0.35)'; g.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    g.beginPath(); g.moveTo(90 + i * 28, 1256 + i * 6); g.lineTo(60 + i * 32, 1348); g.stroke();
  }
  g.restore();
  // 人脚下留白，避免墨上叠墨
  const lg = g.createRadialGradient(1200, 1076, 10, 1200, 1076, 260);
  lg.addColorStop(0, 'rgba(243,236,222,0.26)'); lg.addColorStop(0.7, 'rgba(243,236,222,0.10)'); lg.addColorStop(1, 'rgba(243,236,222,0)');
  g.fillStyle = lg; g.beginPath(); g.ellipse(1200, 1076, 260, 80, 0, 0, 7); g.fill();
  // 工地土色
  const patch = g.createRadialGradient(1190, 1078, 10, 1190, 1078, 220);
  patch.addColorStop(0, 'rgba(60,46,32,0.16)'); patch.addColorStop(1, 'rgba(60,46,32,0)');
  g.fillStyle = patch; g.beginPath(); g.ellipse(1190, 1078, 240, 70, 0, 0, 7); g.fill();
  // 土堆
  g.fillStyle = 'rgba(52,40,29,0.20)';
  g.beginPath(); g.moveTo(980, 1080); g.quadraticCurveTo(1040, 1020, 1100, 1080); g.closePath(); g.fill();
  // 工人
  const swing = K(t, [[0, 0.20], [2.05, 0.20], [2.25, 1.15, 'in2'], [2.55, 0.55, 'out3'], [3.2, 0.22]]);
  worker(g, 1145, 1082, 1.28, swing, 5, 0.92);
  const dig2 = Math.sin(t * 1.7) * 0.18 + 0.25;
  worker(g, 1295, 1090, 1.12, dig2, 6, 0.75);
  // 黑匣子
  const ry = K(t, [[0, 1090], [3.28, 1090], [3.52, 1066, 'out3']]);
  const spin = K(t, [[3.3, 0], [3.58, 1, 'out2']]);
  g.save();
  g.translate(1210, ry); g.rotate(-0.02);
  // 匣影
  g.fillStyle = 'rgba(20,15,12,0.22)';
  g.beginPath(); g.ellipse(0, 16, 46, 11, 0, 0, 7); g.fill();
  // 匣身
  g.fillStyle = 'rgba(20,16,13,0.96)';
  g.strokeStyle = 'rgba(238,231,214,0.32)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-34, 0); g.lineTo(34, 0); g.lineTo(31, 38); g.lineTo(-31, 38); g.closePath(); g.fill(); g.stroke();
  // 匣盖（打开）
  g.save(); g.translate(-33, -1); g.rotate(-0.9 * spin);
  g.fillStyle = 'rgba(16,12,10,0.96)';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(66, 0); g.lineTo(64, 9); g.lineTo(0, 9); g.closePath(); g.fill();
  g.restore();
  // 红晕
  const glow = 0.10 + 0.08 * Math.sin(t * 3.1);
  const gg = g.createRadialGradient(0, 16, 2, 0, 16, 70);
  gg.addColorStop(0, `rgba(166,52,40,${glow})`); gg.addColorStop(1, 'rgba(166,52,40,0)');
  g.fillStyle = gg; g.beginPath(); g.arc(0, 16, 70, 0, 7); g.fill();
  g.restore();
  // 命中墨点
  if (t > 2.25 && t < 2.9) {
    const a = 1 - (t - 2.25) / 0.65;
    g.save(); g.globalAlpha = a;
    splatter(g, 1186, 1078, 30, 9, 'rgba(24,18,14,0.62)', 68);
    g.restore();
  }
}

/* ================================================================ 场二 · 黑匣四物 */
function shotObjects(g, t) {
  const cam = camShot(t, {
    x: [[3.6, 1210], [8.8, 1190]],
    y: [[3.6, 668], [8.8, 690]],
    z: [[3.6, 1.06], [8.8, 1.0]],
  });
  bgLayer(g, L.objects, cam);
  g.save(); applyCam(g, cam);
  // 左侧黑匣
  g.save(); g.translate(770, 905); g.rotate(-0.03);
  g.fillStyle = 'rgba(22,17,13,0.94)';
  g.strokeStyle = 'rgba(240,233,216,0.28)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-48, 6); g.lineTo(48, 6); g.lineTo(44, 66); g.lineTo(-44, 66); g.closePath(); g.fill(); g.stroke();
  g.save(); g.translate(-46, 4); g.rotate(-1.05);
  g.fillStyle = 'rgba(18,14,11,0.95)';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(94, 0); g.lineTo(92, 12); g.lineTo(0, 12); g.closePath(); g.fill();
  g.restore();
  const gg = g.createRadialGradient(0, 20, 4, 0, 20, 120);
  gg.addColorStop(0, 'rgba(166,52,40,0.18)'); gg.addColorStop(1, 'rgba(166,52,40,0)');
  g.fillStyle = gg; g.beginPath(); g.arc(0, 20, 120, 0, 7); g.fill();
  g.restore();

  // 四件物证：同一窗口依次换展
  const cx = 1165, cy = 462, rad = 262;
  // 窗底淡墨 + 纸窗
  const wg = g.createRadialGradient(cx, cy, 20, cx, cy, rad * 1.42);
  wg.addColorStop(0, 'rgba(42,33,26,0.085)'); wg.addColorStop(0.72, 'rgba(42,33,26,0.035)'); wg.addColorStop(1, 'rgba(42,33,26,0)');
  g.fillStyle = wg; g.beginPath(); g.arc(cx, cy, rad * 1.42, 0, 7); g.fill();
  // 断笔双环
  g.save();
  g.translate(cx, cy); g.rotate(t * 0.035);
  g.lineCap = 'round';
  for (let ring = 0; ring < 2; ring++) {
    g.strokeStyle = ring ? 'rgba(30,24,19,0.20)' : 'rgba(30,24,19,0.44)';
    g.lineWidth = ring ? 1.4 : 3.2;
    for (let i = 0; i < 4; i++) {
      const a0 = i * 1.571 + 0.22 + ring * 0.4;
      g.beginPath(); g.arc(0, 0, rad + ring * 15, a0, a0 + 1.15); g.stroke();
    }
  }
  g.restore();

  const idx = t < OBJ_T[1] ? 0 : t < OBJ_T[2] ? 1 : t < OBJ_T[3] ? 2 : 3;
  for (let i = 0; i < 4; i++) {
    const a = objAlpha(t, i);
    if (a <= 0.001) continue;
    if (i === idx && a < 0.999) {
      const m = inkMask(W, H, a, cx, cy, 510 + i * 7, 0.27);
      drawMasked(g, m, (gg) => drawObject(gg, i, cx, cy, 1.2, 1), 1, W, H, 'maskedObj');
    } else if (a > 0.001) {
      g.save(); g.globalAlpha = a; drawObject(g, i, cx, cy, 1.2, 1); g.restore();
    }
  }
  // 标签列（竖排）
  for (let i = 0; i < 4; i++) {
    const on = i === idx;
    const a = objAlpha(t, i);
    const x = 330 + i * 78;
    vtext(g, OBJ_NAMES[i], x, 238, { size: 33, gap: 44, alpha: on ? 0.90 : 0.26 + a * 0.12 });
    if (on) {
      g.save(); g.globalAlpha = 0.8; g.fillStyle = '#a63428';
      g.beginPath(); g.arc(x, 192, 4.6, 0, 7); g.fill(); g.restore();
    }
  }
  // 物件投影
  g.save();
  const sh = g.createRadialGradient(cx, cy + rad + 6, 8, cx, cy + rad + 6, 190);
  sh.addColorStop(0, 'rgba(36,28,21,0.16)'); sh.addColorStop(1, 'rgba(36,28,21,0)');
  g.fillStyle = sh; g.beginPath(); g.ellipse(cx, cy + rad + 6, 190, 26, 0, 0, 7); g.fill();
  g.restore();
  // 品名 / 注释
  const metaA = clamp((t - OBJ_T[idx] - 0.15) / 0.3);
  htext(g, OBJ_META[idx], cx, cy + rad + 54, { size: 25, align: 'center', alpha: 0.45 * metaA, track: 3 });
  // 序号印
  const sn = ['一', '二', '三', '四'][idx];
  drawSeal(g, SEALS[sn], cx + rad + 128, cy + rad - 36, 66, 0.04, 0.84 * metaA);
  g.restore();
}

function objAlpha(t, i) {
  const t0 = OBJ_T[i];
  const t1 = i < 3 ? OBJ_T[i + 1] : 99;
  const inA = sstep(t0 - 0.06, t0 + 0.34, t);
  const outA = i < 3 ? 1 - sstep(t1 - 0.16, t1 + 0.10, t) : 1;
  return clamp(inA * outA);
}

function drawObject(g, i, x, y, s, alpha) {
  g.save(); g.globalAlpha *= alpha;
  g.translate(x, y); g.scale(s, s);
  if (i === 0) drawTusk(g);
  else if (i === 1) drawPersia(g);
  else if (i === 2) drawStones(g);
  else drawJade(g);
  g.restore();
}

function drawTusk(g) {
  // 两支象牙，一前一后
  const tusk = (dx, dy, rot, sc, a) => {
    g.save(); g.translate(dx, dy); g.rotate(rot); g.scale(sc, sc); g.globalAlpha *= a;
    g.beginPath();
    g.moveTo(-134, 104);
    g.bezierCurveTo(-84, -8, -24, -112, 82, -178);
    g.bezierCurveTo(30, -92, -8, 6, -52, 112);
    g.closePath();
    const gr = g.createLinearGradient(-120, 100, 90, -140);
    gr.addColorStop(0, 'rgba(203,184,148,0.95)'); gr.addColorStop(0.55, 'rgba(233,220,190,0.98)'); gr.addColorStop(1, 'rgba(246,238,217,0.98)');
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(52,40,30,0.55)'; g.lineWidth = 2.2; g.stroke();
    // 牙纹
    g.strokeStyle = 'rgba(96,78,56,0.22)'; g.lineWidth = 1.1;
    for (let k = 0; k < 7; k++) {
      g.beginPath(); g.moveTo(-122 + k * 12, 76 - k * 6); g.quadraticCurveTo(-60 + k * 8, 4 - k * 18, 32 + k * 5, -96 - k * 6); g.stroke();
    }
    // 尖部留白
    g.strokeStyle = 'rgba(255,250,236,0.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(78, -172); g.quadraticCurveTo(26, -96, -6, -38); g.stroke();
    g.restore();
  };
  tusk(-26, 14, -0.10, 1.0, 0.9);
  tusk(52, 30, 0.26, 0.86, 0.78);
}

function drawPersia(g) {
  // 波斯蒜头银盒：凸瓣 + 鎏金铜圈足
  g.save(); g.translate(0, 20);
  // 盒身
  g.beginPath();
  g.moveTo(-122, -10);
  g.bezierCurveTo(-116, 66, -58, 96, 0, 96);
  g.bezierCurveTo(58, 96, 116, 66, 122, -10);
  g.closePath();
  const gr = g.createLinearGradient(0, -20, 0, 100);
  gr.addColorStop(0, 'rgba(206,201,190,0.95)'); gr.addColorStop(0.55, 'rgba(166,162,152,0.92)'); gr.addColorStop(1, 'rgba(118,114,106,0.92)');
  g.fillStyle = gr; g.fill();
  g.strokeStyle = 'rgba(40,33,27,0.6)'; g.lineWidth = 2.1; g.stroke();
  // 凸瓣
  g.strokeStyle = 'rgba(60,52,44,0.28)'; g.lineWidth = 1.4;
  for (let k = -5; k <= 5; k++) {
    const x = k * 21;
    g.beginPath(); g.moveTo(x, 4); g.quadraticCurveTo(x + 10, 48, x * 0.5, 92); g.stroke();
  }
  // 口沿
  g.beginPath(); g.ellipse(0, -10, 122, 20, 0, 0, 7);
  g.fillStyle = 'rgba(230,226,214,0.9)'; g.fill();
  g.strokeStyle = 'rgba(40,33,27,0.55)'; g.lineWidth = 1.8; g.stroke();
  // 圈足（鎏金）
  g.fillStyle = 'rgba(176,138,74,0.85)';
  g.beginPath(); g.moveTo(-52, 96); g.lineTo(52, 96); g.lineTo(42, 112); g.lineTo(-42, 112); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(96,70,36,0.6)'; g.stroke();
  // 盖
  g.save(); g.translate(0, -58); g.rotate(-0.09);
  g.beginPath(); g.ellipse(0, 0, 86, 22, 0, 0, 7);
  g.fillStyle = 'rgba(214,209,196,0.95)'; g.fill(); g.strokeStyle = 'rgba(50,42,34,0.55)'; g.lineWidth = 1.8; g.stroke();
  g.beginPath(); g.ellipse(0, -10, 52, 14, 0, 0, 7); g.fillStyle = 'rgba(190,185,172,0.95)'; g.fill(); g.stroke();
  g.beginPath(); g.arc(0, -24, 10, 0, 7); g.fillStyle = 'rgba(176,138,74,0.9)'; g.fill(); g.stroke();
  g.restore();
  g.restore();
}

function drawStones(g) {
  const stones = [
    [-84, 44, 44, 30, 'rgba(126,104,140,0.62)', -0.4],
    [-18, 66, 38, 26, 'rgba(96,130,108,0.62)', 0.3],
    [52, 52, 46, 32, 'rgba(190,160,88,0.66)', -0.2],
    [92, 88, 34, 24, 'rgba(160,88,64,0.64)', 0.6],
    [-46, 96, 40, 27, 'rgba(134,100,70,0.62)', 0.1],
  ];
  for (const [x, y, rx, ry, col, rot] of stones) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath();
    const R = mulberry32(Math.round(x * 13 + y));
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rr = 0.82 + R() * 0.3;
      const px = Math.cos(a) * rx * rr, py = Math.sin(a) * ry * rr;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fillStyle = col; g.fill();
    g.strokeStyle = 'rgba(40,32,26,0.55)'; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = 'rgba(255,250,238,0.28)';
    g.beginPath(); g.ellipse(-rx * 0.25, -ry * 0.3, rx * 0.28, ry * 0.22, -0.4, 0, 7); g.fill();
    g.restore();
  }
  // 小秤 / 注记
  g.strokeStyle = 'rgba(44,35,28,0.35)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-132, 132); g.lineTo(132, 132); g.stroke();
  for (let k = -4; k <= 4; k++) {
    g.beginPath(); g.moveTo(k * 30, 132); g.lineTo(k * 30, 140); g.stroke();
  }
}

function drawJade(g) {
  // 丝缕玉衣：玉片网格 + 朱线
  const body = new Path2D();
  body.moveTo(-16, -176);
  body.bezierCurveTo(-52, -176, -66, -146, -66, -112);
  body.lineTo(-96, -20); body.lineTo(-66, -6);
  body.lineTo(-52, -54); body.lineTo(-54, 34); body.lineTo(-30, 34); body.lineTo(-28, 178);
  body.lineTo(-2, 178); body.lineTo(2, 54); body.lineTo(6, 178); body.lineTo(32, 178);
  body.lineTo(34, 34); body.lineTo(58, 34); body.lineTo(56, -54); body.lineTo(70, -6); body.lineTo(98, -20);
  body.lineTo(68, -112); body.bezierCurveTo(68, -146, 52, -176, 16, -176);
  body.closePath();
  g.save();
  g.beginPath(); g.ellipse(0, -174, 44, 50, 0, 0, 7);
  g.fillStyle = 'rgba(160,184,164,0.78)'; g.fill();
  g.fillStyle = 'rgba(120,150,128,0.5)';
  g.beginPath(); g.ellipse(-12, -182, 4, 6, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(12, -182, 4, 6, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(43,36,29,0.55)'; g.lineWidth = 1.8;
  g.beginPath(); g.ellipse(0, -174, 44, 50, 0, 0, 7); g.stroke();

  g.save();
  g.clip(body);
  // 底层
  g.fillStyle = 'rgba(168,192,171,0.42)'; g.fillRect(-110, -190, 220, 380);
  const R = mulberry32(881);
  const tw = 17, th = 19;
  for (let row = -9; row <= 9; row++) {
    for (let col = -7; col <= 7; col++) {
      const x = col * (tw + 2.5) - 2, y = row * (th + 2.5);
      if (R() < 0.11) continue; // 缺失玉片
      const shade = 0.62 + R() * 0.28;
      g.fillStyle = `rgba(${Math.round(150 + R() * 30)},${Math.round(178 + R() * 26)},${Math.round(156 + R() * 22)},${shade})`;
      g.strokeStyle = 'rgba(46,40,32,0.20)'; g.lineWidth = 0.8;
      g.beginPath();
      const j = (R() - 0.5) * 1.6;
      g.rect(x + j, y + j, tw, th);
      g.fill(); g.stroke();
    }
  }
  // 朱线
  g.strokeStyle = 'rgba(166,64,48,0.34)'; g.lineWidth = 1.1;
  for (let y = -172; y < 180; y += 24) {
    g.beginPath(); g.moveTo(-120, y); g.lineTo(120, y + 3); g.stroke();
  }
  for (let x = -70; x <= 70; x += 24) {
    g.beginPath(); g.moveTo(x, -190); g.lineTo(x + 2, 190); g.stroke();
  }
  g.restore();
  g.strokeStyle = 'rgba(36,30,24,0.62)'; g.lineWidth = 2.2; g.stroke(body);
  g.restore();
}

/* ================================================================ 场三 · 南下撞冰 */
function shotCoast(g, t) {
  if (t < 9.84) drawCoastLeg(g, t);
  else if (t < 10.72) {
    drawCoastLeg(g, 9.84);
    const p = inv(9.84, 10.72, t);
    const m = inkMask(W, H, p, W * 0.82, H * 0.58, 203, 1.0);
    drawMasked(g, m, (gg) => drawIceLeg(gg, t), 1, W, H, 'maskedIce');
  } else drawIceLeg(g, t);
}

function drawCoastLeg(g, t) {
  const cam = camShot(t, {
    x: [[8.83, 760], [9.84, 1700, 'io2']],
    y: [[8.83, 690], [9.84, 700]],
    z: [[8.83, 1.02], [9.84, 1.10, 'io2']],
  });
  bgLayer(g, L.coast, cam);
  g.save(); applyCam(g, cam);
  // 海面：留白 + 横波
  const R = mulberry32(2201);
  g.save();
  const sea = g.createLinearGradient(0, 620, 0, 1350);
  sea.addColorStop(0, 'rgba(150,178,184,0.05)'); sea.addColorStop(1, 'rgba(150,178,184,0.10)');
  g.fillStyle = sea; g.fillRect(1050, 620, 2200, 740);
  // 海平线
  g.strokeStyle = 'rgba(40,32,25,0.20)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(1080, 760); g.lineTo(3200, 768); g.stroke();
  // 横波
  for (let i = 0; i < 54; i++) {
    const x = 1120 + R() * 1940, y = 790 + R() * 520;
    const len = 60 + R() * 230, amp = 1 + R() * 3;
    g.strokeStyle = `rgba(40,54,58,${0.08 + R() * 0.14})`;
    g.lineWidth = 0.8 + R() * 1.8;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + len * 0.3, y - amp, x + len * 0.55, y);
    g.quadraticCurveTo(x + len * 0.78, y + amp, x + len, y);
    g.stroke();
  }
  // 海岸线
  g.strokeStyle = 'rgba(28,22,17,0.50)'; g.lineWidth = 3.4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(1060, 800);
  for (let y = 800; y <= 1350; y += 30) {
    const xx = 1060 + (fbm(y / 220, 2.3, 33, 3) - 0.4) * 70 + (y - 800) * 0.92;
    g.lineTo(xx, y);
  }
  g.stroke();
  g.restore();
  // 朱砂航线
  const u = clamp((t - 8.83) / 1.0);
  const pts = [[360, 800], [700, 830], [1050, 790], [1400, 860], [1760, 900], [2150, 940], [2550, 980]];
  g.save();
  g.strokeStyle = 'rgba(166,52,40,0.72)'; g.lineWidth = 4.5; g.lineCap = 'round';
  g.setLineDash([1, 15]);
  g.lineDashOffset = -t * 40;
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.stroke();
  g.restore();
  // 航线上的小舟
  const bx = K(u, [[0, 360], [1, 2550]]);
  const by = 800 + (bx - 360) / 2190 * 180 + Math.sin(bx * 0.01) * 10;
  drawBoat(g, bx, by, 1.1, 0.85);
  g.restore();
  // 屏幕题记
  vtext(g, '南', 300, 760, { size: 74, alpha: 0.32 });
  vtext(g, '循线索南下', 1660, 210, { size: 26, alpha: 0.34 });
}

function drawBoat(g, x, y, s, a) {
  g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a;
  g.fillStyle = 'rgba(28,22,17,0.85)';
  g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, 12, 26, 0); g.quadraticCurveTo(0, 6, -26, 0); g.fill();
  g.strokeStyle = 'rgba(28,22,17,0.85)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -26); g.stroke();
  g.beginPath(); g.moveTo(2, -24); g.quadraticCurveTo(18, -16, 2, -4); g.stroke();
  g.restore();
}

function drawIceLeg(g, t) {
  const cam = camShot(t, {
    x: [[9.84, 1300], [13.16, 1370, 'io2']],
    y: [[9.84, 690], [13.16, 720, 'io2']],
    z: [[9.84, 1.02], [13.16, 1.10, 'io2']],
  });
  bgLayer(g, L.ice, cam);
  g.save(); applyCam(g, cam);
  // 冰下古河道
  const river = [[700, 1092], [950, 1038], [1190, 1058], [1420, 986], [1670, 1012], [1910, 944], [2170, 966]];
  const reveal = clamp((t - 10.02) / 2.55);
  const pulse = 0.72 + 0.28 * Math.sin(t * 2.1);
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round';
  const rp = new Path2D();
  rp.moveTo(river[0][0], river[0][1]);
  for (let i = 1; i < river.length - 1; i++) {
    const [x1, y1] = river[i], [x2, y2] = river[i + 1];
    rp.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
  }
  rp.lineTo(river[river.length - 1][0], river[river.length - 1][1]);
  const RLEN = 1750;
  const dash = (w, style, alphaMul = 1) => {
    g.setLineDash([Math.max(1, RLEN * reveal), RLEN + 10]);
    g.lineDashOffset = 0;
    g.strokeStyle = style; g.lineWidth = w; g.globalAlpha = alphaMul;
    g.stroke(rp);
  };
  // 河床暗影
  g.translate(0, 14); dash(30, 'rgba(44,64,70,0.9)', 0.22); g.translate(0, -14);
  g.save();
  g.shadowColor = 'rgba(190,235,242,0.85)'; g.shadowBlur = 34;
  dash(54, `rgba(120,170,182,${0.55 * pulse})`);
  g.restore();
  dash(22, `rgba(148,202,212,${0.50 * pulse})`);
  dash(6.5, `rgba(232,250,252,${0.92 * pulse})`);
  g.globalAlpha = 1; g.setLineDash([]);
  // 河头辉光
  if (reveal > 0.02 && reveal < 0.99) {
    const u = reveal;
    const tipX = lerp(river[0][0], river[river.length - 1][0], u);
    const tipY = 1040 - Math.sin(u * 6) * 30;
    const rg = g.createRadialGradient(tipX, tipY, 0, tipX, tipY, 70);
    rg.addColorStop(0, `rgba(232,250,252,${0.55 * pulse})`); rg.addColorStop(1, 'rgba(190,235,242,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(tipX, tipY, 70, 0, 7); g.fill();
  }
  // 支流 / 流动短划：只画到河头
  g.save();
  g.beginPath(); g.rect(0, 0, 700 + reveal * 1550, H); g.clip();
  g.strokeStyle = `rgba(190,230,236,${0.35 * pulse})`; g.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const bx = 880 + i * 280, by = 1040 - Math.sin(i) * 30;
    g.beginPath(); g.moveTo(bx, by);
    g.quadraticCurveTo(bx + 30, by + 46, bx + 90, by + 66); g.stroke();
  }
  g.setLineDash([14, 46]); g.lineDashOffset = -t * 60;
  g.strokeStyle = `rgba(245,255,255,${0.55 * pulse})`; g.lineWidth = 2.6; g.stroke(rp);
  g.setLineDash([]);
  g.restore();
  // 分段亮点
  for (let i = 0; i < 7; i++) {
    const x = 760 + i * 230, y = 1072 - Math.sin(i * 1.3) * 42;
    if (x < 700 + reveal * 1550) {
      const rr = 10 + 6 * Math.sin(t * 3 + i);
      const rg = g.createRadialGradient(x, y, 0, x, y, rr * 3);
      rg.addColorStop(0, 'rgba(232,250,252,0.85)'); rg.addColorStop(1, 'rgba(180,225,232,0)');
      g.fillStyle = rg; g.beginPath(); g.arc(x, y, rr * 3, 0, 7); g.fill();
    }
  }
  g.restore();
  g.restore();
  // 扫描环
  if (t > 9.84 && t < 10.8) {
    const p = inv(9.84, 10.8, t);
    g.save();
    g.strokeStyle = `rgba(180,225,232,${0.55 * (1 - p)})`;
    g.lineWidth = 3;
    g.beginPath(); g.arc(1400, 950, 40 + p * 620, 0, 7); g.stroke();
    g.restore();
  }
  // 冷调
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = `rgba(140,178,188,${0.16 * sstep(9.84, 10.6, t)})`; g.fillRect(-W, -H, W * 3, H * 3);
  g.restore();
  // 题记
  vtext(g, '南极冰盖', 1640, 168, { size: 32, alpha: 0.42 });
  vtext(g, '冰下古河道', 1500, 700, { size: 27, alpha: 0.5 });
  g.save(); g.strokeStyle = 'rgba(44,58,62,0.28)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(1515, 760); g.lineTo(1515, 880); g.lineTo(1670, 990); g.stroke(); g.restore();
}

/* ================================================================ 场四 · 削山 */
function shotCut(g, t) {
  const cam = camShot(t, {
    x: [[13.38, 1220], [18.32, 1200]],
    y: [[13.38, 660], [18.32, 690]],
    z: [[13.38, 1.14], [18.32, 1.02]],
  });
  const cutY = 0.585 * 1350;
  const wipe = clamp((t - 17.18) / 0.62);
  if (wipe <= 0) bgLayer(g, L.cut, cam);
  else {
    bgLayer(g, L.cut, cam);
    const sx = wipe * 2700 - 100;
    g.save(); applyCam(g, cam);
    g.beginPath(); g.rect(-500, -500, sx + 500, 3000); g.clip();
    g.drawImage(L.cut2, 0, 0);
    g.restore();
    // 切口
    g.save(); applyCam(g, cam);
    g.strokeStyle = 'rgba(30,23,18,0.55)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(sx, cutY); g.lineTo(sx, 1240); g.stroke();
    g.restore();
    // 粉尘
    const R = mulberry32(661);
    g.save(); applyCam(g, cam);
    for (let i = 0; i < 70; i++) {
      const x = sx - R() * 500, y0 = cutY + R() * 40;
      const life = clamp((t - 17.18 - R() * 0.5) / 1.0);
      if (life <= 0 || life >= 1) continue;
      const y = y0 + life * (160 + R() * 220);
      g.fillStyle = `rgba(70,56,42,${0.35 * (1 - life)})`;
      g.beginPath(); g.arc(x, y, 1 + R() * 3, 0, 7); g.fill();
    }
    g.restore();
  }
  branch(g, -1, t, 0.38);
  // 削山工地：脊线上的小人
  const wpos = [[560, 748, 1.05, 0.0], [980, 790, 0.95, 1.7], [1450, 752, 1.0, 3.1]];
  for (let i = 0; i < wpos.length; i++) {
    const [wx, wy, ws, ph] = wpos[i];
    const rg = g.createRadialGradient(wx, wy - 26, 4, wx, wy - 26, 66);
    rg.addColorStop(0, 'rgba(243,236,222,0.18)'); rg.addColorStop(1, 'rgba(243,236,222,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(wx, wy - 26, 46, 0, 7); g.fill();
    worker(g, wx, wy, ws, 0.5 + Math.sin(t * 2.2 + ph) * 0.45, 200 + i, 0.85);
  }
  // 高度尺（屏幕空间）
  const topY = K(t, [[16.6, 560], [17.18, 560], [17.52, 690, 'out3']]);
  g.save();
  g.strokeStyle = 'rgba(40,32,25,0.42)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(352, topY); g.lineTo(352, 900); g.stroke();
  g.beginPath(); g.moveTo(336, topY); g.lineTo(368, topY); g.moveTo(336, 900); g.lineTo(368, 900); g.stroke();
  // 五十 / 三十 刻度
  g.setLineDash([2, 6]);
  g.beginPath(); g.moveTo(352, topY); g.lineTo(700, topY); g.stroke();
  g.restore();
  const labA = 1 - sstep(17.18, 17.42, t);
  vtext(g, '近五十米', 300, 660, { size: 26, alpha: 0.55 * labA });
  vtext(g, '三十多米', 300, 790, { size: 26, alpha: 0.55 * sstep(17.2, 17.6, t) });
  // 那年六月
  vtext(g, '那年六月', 1660, 190, { size: 34, alpha: 0.42 * sstep(13.6, 14.2, t) });
  // 山体横向切痕
  g.save(); applyCam(g, cam);
  g.strokeStyle = 'rgba(28,22,18,0.22)'; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const y = cutY + 16 + i * 34;
    g.beginPath(); g.moveTo(500 + i * 30, y); g.lineTo(2100 - i * 40, y + 4); g.stroke();
  }
  g.restore();
}

/* ================================================================ 场五 · 探方黑洞 */
function shotPit(g, t) {
  const cam = camShot(t, {
    x: [[18.32, 1200], [24.35, 1230]],
    y: [[18.32, 690], [24.35, 720]],
    z: [[18.32, 1.05], [24.35, 1.0]],
  });
  bgLayer(g, L.pit, cam);
  g.save();
  const sky = g.createLinearGradient(0, 0, 0, 700);
  sky.addColorStop(0, 'rgba(50,40,30,0.20)'); sky.addColorStop(0.55, 'rgba(50,40,30,0.08)'); sky.addColorStop(1, 'rgba(50,40,30,0)');
  g.fillStyle = sky; g.fillRect(-W, -H, W * 3, H * 3);
  g.restore();
  g.save(); applyCam(g, cam);
  drawPit(g, t);
  g.restore();
  // 探方题记
  vtext(g, '宿舍墙基', 350, 760, { size: 28, alpha: 0.36 * sstep(18.5, 19.2, t) });
  // 手电光束（屏幕空间更可控）
  if (t > 22.31) drawFlashlight(g, t);
  // 渐黑
  const dark = K(t, [[23.30, 0], [23.48, 0.35, 'out2'], [24.1, 0.86], [24.35, 0.9]]);
  if (dark > 0) {
    g.save();
    const rg = g.createRadialGradient(W * 0.5, H * 0.62, 80, W * 0.5, H * 0.62, W * 0.78);
    rg.addColorStop(0, `rgba(10,8,6,${dark * 0.94})`);
    rg.addColorStop(1, `rgba(10,8,6,${dark * 0.86})`);
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
    // 保留一点纸边与灯芯，避免全黑
    g.globalCompositeOperation = 'lighter';
    const wg = g.createRadialGradient(820, 736, 0, 820, 736, 260);
    wg.addColorStop(0, `rgba(120,98,70,${0.10 * dark})`); wg.addColorStop(1, 'rgba(120,98,70,0)');
    g.fillStyle = wg; g.fillRect(560, 480, 540, 520);
    g.restore();
  }
}

function drawPit(g, t) {
  const top = 700, bot = 980, xl0 = 520, xr0 = 1440, xl1 = 690, xr1 = 1290;
  const R = mulberry32(1701);
  // 工地地面：不规则土色
  g.save();
  const gp = g.createRadialGradient(980, 880, 40, 980, 880, 560);
  gp.addColorStop(0, 'rgba(58,44,30,0.13)'); gp.addColorStop(1, 'rgba(58,44,30,0)');
  g.fillStyle = gp;
  g.beginPath();
  for (let i = 0; i <= 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const rr = 1 + (R() - 0.5) * 0.18;
    const x = 980 + Math.cos(a) * 560 * rr, y = 872 + Math.sin(a) * 250 * rr;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath(); g.fill();
  g.restore();
  // 坑口外沿：翻起的土
  g.save();
  g.strokeStyle = 'rgba(244,236,220,0.55)'; g.lineWidth = 7; g.lineCap = 'round';
  g.beginPath(); g.moveTo(xl0 - 10, top + 2); g.lineTo(xr0 + 8, top + 2); g.stroke();
  g.strokeStyle = 'rgba(52,38,26,0.30)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(xl0 - 4, top + 9); g.lineTo(xr0 + 2, top + 9); g.stroke();
  g.restore();
  // 坑壁：下切 + 毛边
  const side = (x0, x1, n) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      pts.push([lerp(x0, x1, u) + (R() - 0.5) * 12, lerp(top, bot, u)]);
    }
    return pts;
  };
  const left = side(xl0, xl1, 10), right = side(xr0, xr1, 10).reverse();
  const rim = [];
  for (let i = 0; i <= 14; i++) rim.push([lerp(xl0, xr0, i / 14) + (R() - 0.5) * 10, top + (R() - 0.5) * 6]);
  const poly = [...rim, ...right, ...left.slice().reverse()];
  g.save();
  g.beginPath(); poly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  const gr = g.createLinearGradient(0, top, 0, bot);
  gr.addColorStop(0, 'rgba(62,47,33,0.30)');
  gr.addColorStop(0.45, 'rgba(44,33,23,0.52)');
  gr.addColorStop(0.82, 'rgba(28,21,15,0.72)');
  gr.addColorStop(1, 'rgba(20,15,11,0.80)');
  g.fillStyle = gr; g.fill();
  g.clip();
  // 土层：横向沉积 + 墙面竖擦
  for (let i = 0; i < 9; i++) {
    const y = top + 18 + i * 29 + (R() - 0.5) * 10;
    g.strokeStyle = `rgba(20,15,11,${0.06 + R() * 0.12})`;
    g.lineWidth = 1.2 + R() * 3.4;
    g.beginPath(); g.moveTo(xl1 - 40, y);
    for (let x = xl1 + 20; x < xr1 + 40; x += 80) g.lineTo(x, y + (R() - 0.5) * 7);
    g.stroke();
  }
  for (let i = 0; i < 120; i++) {
    const x = lerp(xl1, xr1, R()), y = lerp(top + 20, bot - 10, R());
    g.strokeStyle = `rgba(16,12,9,${0.05 + R() * 0.12})`;
    g.lineWidth = 0.8 + R() * 1.6;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 8, y + 8 + R() * 22); g.stroke();
  }
  // 台阶
  for (let i = 0; i < 3; i++) {
    const y = top + 74 + i * 74;
    const k = (y - top) / (bot - top);
    const l = lerp(xl0, xl1, k), r = lerp(xr0, xr1, k);
    g.strokeStyle = 'rgba(245,238,222,0.18)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(l + 18, y); g.lineTo(r - 18, y + 2); g.stroke();
    g.strokeStyle = 'rgba(18,13,10,0.20)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(l + 18, y + 4); g.lineTo(r - 18, y + 6); g.stroke();
  }
  g.restore();
  // 边缘浓墨
  g.save();
  g.strokeStyle = 'rgba(22,16,12,0.62)'; g.lineWidth = 3.2; g.lineJoin = 'round';
  g.beginPath(); poly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke();
  g.restore();
  // 土堆
  g.save();
  g.fillStyle = 'rgba(52,38,25,0.22)';
  g.beginPath(); g.moveTo(380, 700); g.quadraticCurveTo(470, 636, 560, 700); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(1400, 704); g.quadraticCurveTo(1490, 650, 1570, 704); g.closePath(); g.fill();
  g.restore();
  // 宿舍墙基：三排砖 + 半截墙
  g.save(); g.translate(410, 628);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) {
    const off = r % 2 ? 13 : 0;
    g.fillStyle = `rgba(${86 + r * 4},${66 + r * 3},${46 + r * 2},${0.26 + r * 0.05})`;
    g.fillRect(i * 27 + off, r * 15, 24, 12);
    g.strokeStyle = 'rgba(32,24,17,0.34)'; g.lineWidth = 0.8; g.strokeRect(i * 27 + off, r * 15, 24, 12);
  }
  g.strokeStyle = 'rgba(36,27,19,0.4)'; g.lineWidth = 1.2;
  g.strokeRect(-4, -2, 194, 50);
  g.restore();
  // 独轮车
  drawWheelbarrow(g, 1510, 712, 0.9);
  // 工人
  const dig = 0.35 + Math.sin(t * 2.4) * 0.28;
  worker(g, 1355, 704, 1.35, dig, 71, 0.88);
  worker(g, 600, 700, 1.15, 0.18 + Math.sin(t * 1.9 + 1) * 0.22, 72, 0.78);
  // 石板
  if (t > 19.94) {
    for (let i = 0; i < 7; i++) {
      const st = 19.94 + i * 0.055;
      const p = clamp((t - st) / 0.34);
      if (p <= 0) continue;
      const x = 795 + i * 64, y = 918 - Math.sin(Math.PI * p) * 30;
      g.save(); g.translate(x, y); g.scale(1, 0.45 + 0.55 * E.out2(p));
      g.fillStyle = 'rgba(158,150,132,0.72)';
      g.strokeStyle = 'rgba(32,26,20,0.66)'; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(-31, -12); g.lineTo(31, -14); g.lineTo(38, 9); g.lineTo(-27, 11); g.closePath();
      g.fill(); g.stroke();
      g.strokeStyle = 'rgba(244,237,220,0.45)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-25, -7); g.lineTo(29, -9); g.stroke();
      g.strokeStyle = 'rgba(60,50,40,0.25)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(-20, 0); g.lineTo(24, -2); g.stroke();
      g.restore();
    }
  }
  // 石缝黑口
  if (t > 22.0) {
    const p = clamp((t - 22.0) / 1.3);
    g.save();
    g.fillStyle = `rgba(6,5,4,${0.62 * p})`;
    g.beginPath();
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rr = 1 + (R() - 0.5) * 0.16;
      const x = 1010 + Math.cos(a) * (150 + p * 55) * rr;
      const y = 936 + Math.sin(a) * (30 + p * 14) * rr;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    g.restore();
  }
  // 手电光斑
  if (t > 22.31) {
    const p = clamp((t - 22.31) / 0.4);
    const rg = g.createRadialGradient(1010, 936, 2, 1010, 936, 110);
    rg.addColorStop(0, `rgba(255,232,178,${0.42 * p})`); rg.addColorStop(1, 'rgba(255,232,178,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(1010, 936, 110, 0, 7); g.fill();
  }
  // 墨点
  g.save(); g.globalAlpha = 0.5;
  splatter(g, 700, 720, 24, 44, 'rgba(50,38,26,0.4)', 130);
  splatter(g, 1300, 710, 20, 45, 'rgba(50,38,26,0.35)', 120);
  g.restore();
}

function drawWheelbarrow(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = 'rgba(30,23,17,0.72)'; g.fillStyle = 'rgba(52,40,28,0.28)';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(-58, -26); g.lineTo(20, -30); g.lineTo(34, 6); g.lineTo(-40, 10); g.closePath();
  g.fill(); g.stroke();
  g.beginPath(); g.arc(-34, 16, 16, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(-34, 16); g.lineTo(-28, 16); g.stroke();
  g.beginPath(); g.moveTo(34, 4); g.lineTo(72, -18); g.stroke();
  g.beginPath(); g.moveTo(30, 8); g.lineTo(70, -12); g.stroke();
  g.restore();
}

function drawFlashlight(g, t) {
  const p = clamp((t - 22.31) / 0.35);
  const flick = 0.88 + 0.12 * Math.sin(t * 17.3) * Math.sin(t * 5.1);
  const ox = 520, oy = 558, tx = 800, ty = 735;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(ox, oy, tx, ty);
  gr.addColorStop(0, `rgba(255,234,182,${0.30 * p * flick})`);
  gr.addColorStop(0.55, `rgba(255,226,160,${0.13 * p * flick})`);
  gr.addColorStop(1, 'rgba(255,226,160,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(ox, oy);
  g.lineTo(tx - 70, ty + 6); g.lineTo(tx + 70, ty + 6);
  g.closePath(); g.fill();
  // 灯头
  g.fillStyle = `rgba(255,244,210,${0.85 * p})`;
  g.beginPath(); g.arc(ox, oy, 4.5, 0, 7); g.fill();
  // 尘粒
  const R = mulberry32(931);
  for (let i = 0; i < 26; i++) {
    const u = R(), v = R();
    const x = lerp(ox, tx, u) + (v - 0.5) * 80 * u;
    const y = lerp(oy, ty, u) + (R() - 0.5) * 50 * u;
    g.fillStyle = `rgba(255,240,200,${0.25 * p * (0.4 + 0.6 * Math.sin(t * 2 + i))})`;
    g.beginPath(); g.arc(x, y, 0.8 + R() * 1.6, 0, 7); g.fill();
  }
  g.restore();
}

/* ================================================================ 场六 · 四十三天 · 七室 */
function shotChambers(g, t) {
  const cam = camShot(t, { x: [[24.35, 1200], [30, 1200]], y: [[24.35, 675], [30, 675]], z: [[24.35, 1.02], [30, 1.0]] });
  bgLayer(g, L.objects, cam);
  // 从黑洞里出来
  const dark = 0.78 * (1 - sstep(25.40, 26.10, t) * 0.95);
  if (dark > 0.01) {
    g.save(); g.fillStyle = `rgba(10,8,6,${dark})`; g.fillRect(0, 0, W, H); g.restore();
  }
  // 四十三根刻度
  const cx = W / 2, cy = 600, R0 = 330;
  const ringA = 1 - 0.72 * sstep(25.60, 26.30, t);
  // 环底纸光
  const bgGlow = g.createRadialGradient(cx, cy, 40, cx, cy, R0 + 90);
  bgGlow.addColorStop(0, 'rgba(244,236,220,0.10)'); bgGlow.addColorStop(0.7, 'rgba(244,236,220,0.05)'); bgGlow.addColorStop(1, 'rgba(244,236,220,0)');
  g.save(); g.fillStyle = bgGlow; g.beginPath(); g.arc(cx, cy, R0 + 90, 0, 7); g.fill(); g.restore();
  g.save();
  g.globalAlpha = ringA;
  g.strokeStyle = 'rgba(214,190,150,0.10)'; g.lineWidth = 1;
  g.beginPath(); g.arc(cx, cy, R0, 0, 7); g.stroke();
  for (let i = 0; i < 43; i++) {
    const a = -Math.PI / 2 + (i / 43) * Math.PI * 2;
    const lit = sstep(24.40 + i * 0.021, 24.46 + i * 0.021, t);
    const l = 16 + 14 * lit;
    g.strokeStyle = `rgba(232,208,164,${0.22 + 0.75 * lit})`;
    g.lineWidth = lit > 0.5 ? 3.2 : 1.6;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0);
    g.lineTo(cx + Math.cos(a) * (R0 + l), cy + Math.sin(a) * (R0 + l));
    g.stroke();
  }
  g.restore();
  if (t < 25.44) {
    const n = Math.min(43, Math.max(0, Math.floor((t - 24.40) / 0.021) + 1));
    const a = 1 - sstep(25.30, 25.46, t);
    htext(g, '四十三天', cx, cy + R0 + 64, { size: 34, align: 'center', alpha: 0.7 * a, track: 6 });
    htext(g, String(n).padStart(2, '0'), cx, cy + 6, { size: 112, align: 'center', alpha: 0.82 * a, font: 'KaiTi', track: 2, color: 'rgba(238,218,178,0.9)' });
  }
  // 落印
  if (t > 25.41) {
    const p = clamp((t - 25.41) / 0.18);
    const sc = lerp(2.2, 1, E.out3(p));
    g.save();
    g.globalAlpha = p;
    const spr = SEALS['南越王墓'];
    g.globalAlpha = p * (1 - 0.55 * sstep(28.8, 29.4, t));
    g.translate(cx + 432, cy - 268); g.rotate(-0.035); g.scale(sc, sc);
    g.drawImage(spr, -90, -90, 180, 180);
    g.restore();
    if (p > 0.6) splatter(g, cx + 432, cy - 268, 24, 77, 'rgba(166,52,40,0.45)', 66);
  }
  // 七室平面（题名出现时退成底纹）
  const pa = sstep(25.56, 26.2, t);
  const ta0 = sstep(28.7, 29.25, t);
  const planA = pa * (1 - 0.86 * ta0);
  if (planA > 0.005) {
    g.save();
    g.globalAlpha = planA;
    g.translate(cx, cy + 8); g.scale(1.0 + 0.07 * E.out2(pa), 1.0 + 0.07 * E.out2(pa));
    drawPlan(g, t);
    g.restore();
  }
  // 遗物与殉人
  if (t > 26.38 && planA > 0.02) { g.save(); g.globalAlpha = planA; drawRelics(g, t, cx, cy + 8); g.restore(); }
  if (t > 27.31 && planA > 0.02) { g.save(); g.globalAlpha = planA; drawRetainers(g, t, cx, cy + 8); g.restore(); }
  // 题名
  const ta = sstep(28.7, 29.25, t);
  if (ta > 0.01) {
    g.save(); g.globalAlpha = ta;
    // 纸色题跋背（柔边，不切边）
    const hg = g.createRadialGradient(cx, 430, 24, cx, 430, 430);
    hg.addColorStop(0, 'rgba(245,239,226,0.94)'); hg.addColorStop(0.55, 'rgba(245,239,226,0.78)'); hg.addColorStop(1, 'rgba(245,239,226,0)');
    g.fillStyle = hg; g.fillRect(cx - 440, 20, 880, 800);
    g.font = '300px LongCang, KaiTi, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(26,20,16,0.90)';
    g.fillText('羽人', cx, 390);
    htext(g, '南越王墓 · 前三十秒', cx, 620, { size: 32, align: 'center', alpha: 0.55, track: 5 });
    drawSeal(g, SEALS['南越'], cx + 250, 680, 86, 0.04, 0.8);
    g.restore();
  }
}

function drawPlan(g, t) {
  // 士字七室：前室 / 东西耳室 / 主室 / 东西侧室 / 后藏室
  const wall = 'rgba(28,22,17,0.86)';
  const wash = 'rgba(48,38,29,0.085)';
  const rooms = [
    // x, y, w, h, label
    [-90, 120, 180, 74, '前室'],
    [-286, 92, 150, 102, '东耳室'],
    [136, 92, 150, 102, '西耳室'],
    [-100, -6, 200, 118, '主室'],
    [-286, -6, 150, 80, '东侧室'],
    [136, -6, 150, 80, '西侧室'],
    [-118, -148, 236, 116, '后藏室'],
  ];
  // 外墙
  g.fillStyle = wash;
  g.strokeStyle = wall; g.lineWidth = 8; g.lineJoin = 'miter';
  g.beginPath();
  g.rect(-300, -160, 600, 366);
  g.rect(-110, 100, 220, 110);
  g.fill(); g.stroke();
  g.lineWidth = 5.5;
  for (const [x, y, w, h, label] of rooms) {
    g.beginPath(); g.rect(x, y, w, h);
    g.fillStyle = 'rgba(243,237,223,0.4)'; g.fill();
    g.strokeStyle = wall; g.lineWidth = 5; g.stroke();
    // 房间注记
    const fs = label.length > 2 ? 20 : 22;
    g.font = `${fs}px KaiTi, serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(34,27,21,0.72)';
    g.fillText(label, x + w / 2, y + h - 16);
  }
  // 主室棺椁
  g.fillStyle = 'rgba(120,60,42,0.35)';
  g.fillRect(-44, 12, 88, 46);
  g.strokeStyle = 'rgba(70,36,26,0.6)'; g.lineWidth = 2;
  g.strokeRect(-44, 12, 88, 46);
  g.beginPath(); g.moveTo(-44, 24); g.lineTo(44, 24); g.stroke();
  // 方位
  g.font = '18px KaiTi, serif'; g.fillStyle = 'rgba(38,30,23,0.4)';
  g.textAlign = 'center'; g.fillText('北', 0, -176);
  g.strokeStyle = 'rgba(38,30,23,0.25)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, -168); g.lineTo(0, -160); g.stroke();
}

function drawRelics(g, t, cx, cy) {
  const spots = [[-210, 140], [-110, 140], [0, 150], [110, 140], [210, 140], [-70, 40], [30, 40], [-70, -100], [70, -100], [0, -120], [-210, 40], [210, 40]];
  g.save();
  for (let i = 0; i < spots.length; i++) {
    const st = 26.38 + i * 0.07;
    const p = sstep(st, st + 0.3, t);
    if (p <= 0) continue;
    const [x, y] = spots[i];
    const r = 3.2 + 2.2 * p;
    g.fillStyle = `rgba(184,140,66,${0.85 * p})`;
    g.beginPath(); g.arc(cx + x, cy + y, r, 0, 7); g.fill();
    if (p < 0.8) {
      g.strokeStyle = `rgba(220,186,120,${0.5 * (1 - p)})`; g.lineWidth = 1;
      g.beginPath(); g.arc(cx + x, cy + y, r + (1 - p) * 14, 0, 7); g.stroke();
    }
  }
  g.restore();
}
function drawRetainers(g, t, cx, cy) {
  const spots = [[-250, 120], [-250, 150], [-250, 180], [250, 120], [250, 150], [250, 180], [-210, 30], [-230, 60], [210, 30], [230, 60], [-60, 120], [0, 122], [60, 120], [-20, -110], [40, -110]];
  g.save();
  for (let i = 0; i < spots.length; i++) {
    const st = 27.31 + i * 0.06;
    const p = sstep(st, st + 0.25, t);
    if (p <= 0) continue;
    const [x, y] = spots[i];
    g.fillStyle = `rgba(150,70,52,${0.8 * p})`;
    g.beginPath(); g.arc(cx + x, cy + y, 3.4, 0, 7); g.fill();
  }
  htext(g, '十五殉人', cx + 316, cy + 150, { size: 19, alpha: 0.45 * sstep(27.4, 28.0, t), track: 2 });
  g.restore();
}

/* ================================================================ 字幕 / 版式 */
let CAPTIONS = null;
export function setCaptions(list) { CAPTIONS = list; }
function drawCaption(t) {
  // 常驻衬底，杜绝字幕间亮度跳变
  const band = ctx.createLinearGradient(0, 918, 0, H);
  band.addColorStop(0, 'rgba(239,233,220,0)');
  band.addColorStop(0.5, 'rgba(239,233,220,0.34)');
  band.addColorStop(1, 'rgba(239,233,220,0.62)');
  ctx.save(); ctx.fillStyle = band; ctx.fillRect(0, 918, W, H - 918); ctx.restore();
  if (!CAPTIONS) return;
  const c = CAPTIONS.find(x => t >= x.t0 - 1e-6 && t < x.t1 - 1e-6) || CAPTIONS[CAPTIONS.length - 1];
  if (!c) return;
  const a = Math.min(1, (t - c.t0) / 0.10, (c.t1 - t) / 0.10);
  ctx.save();
  ctx.globalAlpha = clamp(a);
  ctx.font = '46px KaiTi, serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(38,31,24,0.92)';
  ctx.shadowColor = 'rgba(247,241,228,0.95)'; ctx.shadowBlur = 16;
  const chars = [...c.text];
  const track = 2.6;
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width + track;
  let x = W / 2 - w / 2;
  for (const ch of chars) {
    ctx.fillText(ch, x, 1002);
    x += ctx.measureText(ch).width + track;
  }
  ctx.restore();
}

function drawChrome(t) {
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.font = '22px KaiTi, serif';
  ctx.fillStyle = 'rgba(40,32,25,0.9)';
  ctx.fillText('013', 74, 84);
  ctx.globalAlpha = 0.25;
  ctx.fillRect(74, 96, 46, 1);
  ctx.restore();
  // 右侧竖排片名（常驻、极淡）
  vtext(ctx, '南越王墓', 1848, 118, { size: 20, gap: 27, alpha: 0.26, font: 'KaiTi' });
  vtext(ctx, '羽人', 1848, 320, { size: 20, gap: 27, alpha: 0.26, font: 'KaiTi' });
}

/* ================================================================ 场景入口 */
const SHOTS = { site: shotSite, objects: shotObjects, coast: shotCoast, cut: shotCut, pit: shotPit, chambers: shotChambers };
function drawShot(name, t, g) { SHOTS[name](g, t); }
