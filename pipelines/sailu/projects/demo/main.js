// sailu · 80 年代赛璐璐动画 —— 站点 10 秒样片《霓虹信使》
//
// 一条跟拍长镜头：雨后的霓虹街，快递少女骑车碾过水洼，车灯在湿路面犁出一道亮痕；
// 出租车从身后掠过，猫在雨棚下甩尾巴，地缝冒白汽，远处闪电把楼群照亮一瞬。
//
// 画面全部由本文件逐帧画出来（Canvas 2D），确定性：同一秒数永远同一帧。
const SPEC = {
  id: 'sailu',
  seed: 'av:sailu',
  family: 'cel',
  w: 1920,
  h: 1080,
  sky1: '#0a0824',
  sky2: '#ff7a4d',
  hero: '#f4d35e',
  accent: '#ff4f9a',
  ground: '#120d24',
  horizon: 0.60,
  label: { zh: '80 年代赛璐璐动画', en: '80s Cel Anime', station: '04 · 卡通动画' }
};

const ENV = STYLEKIT.page(document.getElementById('c'), { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });
const K = STYLEKIT;
const W = ENV.W, H = ENV.H, ctx = ENV.ctx;
const clamp = K.clamp, lerp = K.lerp, ease = K.ease, shade = K.shade, rgba = K.rgba, mix = K.mixHex;

// ---------- 色板 ----------
const P = {
  ink: '#07040f',
  sky0: '#08061e',
  sky1: '#241044',
  sky2: '#5f1c56',
  sky3: '#b23a5e',
  haze: '#ff8a5c',
  far2: '#221741',
  mid: '#1a1136',
  shop: '#160d2a',
  road: '#0e0a1e',
  road2: '#1b1330',
  neonP: '#ff4f9a',
  neonC: '#3fe6e0',
  neonA: '#ffc25c',
  neonR: '#ff3b4e',
  skin: '#f7c9a6',
  coat: '#f2c14e',
  coat2: '#e06a3c',
  teal: '#2fd3c8',
  hair: '#140d22',
  tire: '#191129',
  rim: '#ffb3d4'
};

// ---------- 小工具 ----------
function mod(x, m) { return ((x % m) + m) % m; }
function hash01(i) { const r = K.rng('sailu:h' + i); return r(); }
function flicker(t, i) {
  const s = Math.sin(t * (2.3 + i * 0.37) + i * 1.7) + Math.sin(t * (5.1 + i * 0.21) + i * 2.9);
  return s > -1.35 ? 1 : (hash01(i + Math.floor(t * 9)) > 0.4 ? 0.75 : 0.25);
}
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ink(fill, stroke, lw) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw || 5; ctx.strokeStyle = stroke; ctx.stroke(); }
}

// ---------- 运镜 ----------
const S_SPEED = 1.72 * W;
function worldX(t) { return -0.26 * W + S_SPEED * Math.pow(clamp(t / 10), 0.94); }
function screenX(t) {
  const enter = ease(clamp(t / 2.4));
  const base = lerp(0.305 * W, 0.47 * W, enter);
  return base + Math.sin(t * 1.6) * W * 0.004;
}
function scroll(t) { return worldX(t) - screenX(t); }
function scrollSpeed(t) { const d = 0.02; return (scroll(t + d) - scroll(t - d)) / (2 * d); }

// ---------- 天 ----------
function drawSky(t) {
  const hz = H * 0.60;
  const g = ctx.createLinearGradient(0, 0, 0, hz + H * 0.10);
  g.addColorStop(0, P.sky0);
  g.addColorStop(0.34, P.sky1);
  g.addColorStop(0.68, P.sky2);
  g.addColorStop(0.92, P.sky3);
  g.addColorStop(1, P.haze);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, hz + H * 0.10);

  const drift = t * 26;
  for (let i = 0; i < 7; i++) {
    const y = H * (0.05 + i * 0.05) + Math.sin(t * 0.5 + i) * H * 0.008;
    const x = mod(i * 320 - drift * (0.5 + i * 0.08), W + 900) - 450;
    const w = W * (0.30 + hash01(i * 7) * 0.5);
    const h = H * (0.018 + hash01(i * 11) * 0.026);
    ctx.fillStyle = rgba(i < 3 ? '#120a2c' : '#3a1450', 0.55 - i * 0.04);
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const sx = W * 0.22, sy = hz - H * 0.03;
  const rg = ctx.createRadialGradient(sx, sy, 10, sx, sy, H * 0.34);
  rg.addColorStop(0, rgba('#ffcf8a', 0.8));
  rg.addColorStop(0.35, rgba('#ff7a4d', 0.40));
  rg.addColorStop(1, rgba('#ff5f7a', 0));
  ctx.fillStyle = rg;
  ctx.fillRect(sx - H * 0.34, sy - H * 0.34, H * 0.68, H * 0.68);

  // 8 秒后还没散尽的闪电
  const fl = Math.max(0, Math.sin((t - 8.05) * 26)) * Math.max(0, 1 - Math.abs(t - 8.3) / 0.35);
  if (fl > 0) {
    ctx.fillStyle = rgba('#dcd0ff', 0.45 * fl);
    ctx.fillRect(0, 0, W, hz);
    ctx.strokeStyle = rgba('#f4eaff', 0.85 * fl);
    ctx.lineWidth = 4;
    ctx.beginPath();
    let lx = W * 0.62, ly = 0;
    ctx.moveTo(lx, ly);
    for (let i = 0; i < 7; i++) {
      lx += (hash01(i + 41) - 0.45) * W * 0.055;
      ly += H * 0.05;
      ctx.lineTo(lx, ly);
    }
    ctx.stroke();
  }
}

// ---------- 远景楼群 ----------
function drawFarCity(t, off) {
  const baseY = H * 0.615;
  const m = 210;
  const i0 = Math.floor((off - m) / m);
  for (let i = i0; i < i0 + Math.ceil(W / m) + 3; i++) {
    const r = K.rng('far' + i);
    const x = i * m - off;
    const w = m * (0.94 + r() * 0.3);
    const h = H * (0.10 + r() * 0.17) * (1 + 0.25 * Math.min(1, (i % 9) / 6));
    ctx.fillStyle = mix(P.far2, '#0b0620', 0.45 + r() * 0.2);
    ctx.fillRect(x, baseY - h, w, h + H * 0.05);
    if (r() > 0.6) {
      ctx.strokeStyle = rgba('#0b0620', 0.9);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.5, baseY - h);
      ctx.lineTo(x + w * 0.5, baseY - h - H * (0.02 + r() * 0.03));
      ctx.stroke();
    }
    const cols = Math.max(2, Math.floor(w / 34)), rows = Math.max(3, Math.floor(h / 36));
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        if (r() > 0.90) {
          ctx.fillStyle = rgba(r() > 0.5 ? '#9fd6ff' : '#ffcf9a', 0.30 + r() * 0.3);
          ctx.fillRect(x + 10 + cx * (w - 20) / cols, baseY - h + 12 + cy * (h - 20) / rows, 7, 8);
        }
      }
    }
  }
  const g = ctx.createLinearGradient(0, baseY - H * 0.10, 0, baseY + H * 0.02);
  g.addColorStop(0, rgba('#ff6a86', 0));
  g.addColorStop(1, rgba('#ff8a6a', 0.5));
  ctx.fillStyle = g;
  ctx.fillRect(0, baseY - H * 0.10, W, H * 0.12);
}

// ---------- 中景：带霓虹招牌的楼 ----------
function drawMidCity(t, off) {
  const baseY = H * 0.688;
  const m = 330;
  const i0 = Math.floor((off - m) / m);
  const signs = ['磁带', '录像', '茶室', '霓虹', '夜宵', '旅馆', '电器'];
  for (let i = i0; i < i0 + Math.ceil(W / m) + 3; i++) {
    const r = K.rng('mid' + i);
    const x = i * m - off;
    const w = m * (0.86 + r() * 0.26);
    const h = H * (0.19 + r() * 0.13);
    ctx.fillStyle = mix(P.mid, '#0c0720', 0.35 + (mod(i, 3)) * 0.15);
    ctx.fillRect(x, baseY - h, w, h + H * 0.02);
    ctx.fillStyle = rgba('#ff7a5c', 0.18);
    ctx.fillRect(x + w - 5, baseY - h, 5, h);
    const cols = Math.max(3, Math.floor(w / 52)), rows = Math.max(4, Math.floor(h / 46));
    for (let cx = 0; cx < cols; cx++) {
      for (let cy = 0; cy < rows; cy++) {
        const k = r();
        if (k > 0.42) {
          const warm = k > 0.7;
          ctx.fillStyle = rgba(warm ? P.neonA : '#8fb8ff', 0.16 + k * 0.32);
          ctx.fillRect(x + 16 + cx * (w - 26) / cols, baseY - h + 14 + cy * (h - 22) / rows,
            Math.max(4, (w - 26) / cols - 12), Math.max(4, (h - 22) / rows - 16));
        }
      }
    }
    if (mod(i, 2) === 0) {
      drawSign(x + w * 0.9, baseY - h * 0.88, 0.085 * H, t, i, signs[mod(i * 3, signs.length)],
        mod(i, 3) === 0 ? P.neonP : P.neonC);
    }
    if (mod(i, 3) === 1) {
      const by = baseY - h - H * 0.05;
      ctx.fillStyle = rgba('#0d0820', 0.9);
      ctx.fillRect(x + 12, by, w * 0.62, H * 0.045);
      ctx.strokeStyle = rgba(P.neonC, 0.4 + 0.2 * Math.sin(t * 2 + i));
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 12, by, w * 0.62, H * 0.045);
      ctx.fillStyle = rgba(P.neonC, 0.55);
      for (let d = 0; d < 6; d++) ctx.fillRect(x + 26 + d * 22, by + H * 0.014, 12, H * 0.018);
    }
  }
}

function drawSign(x, y, w, t, i, text, color) {
  const h = w * 5.0;
  const fl = flicker(t, i);
  ctx.save();
  ctx.strokeStyle = '#0a0618';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y - h - 10);
  ctx.lineTo(x + w * 0.6, y - h - 10);
  ctx.stroke();
  ctx.shadowColor = rgba(color, 0.85 * fl);
  ctx.shadowBlur = 34;
  ctx.fillStyle = rgba('#120a26', 0.95);
  ctx.fillRect(x, y - h, w, h);
  ctx.strokeStyle = rgba(color, 0.85 * fl);
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y - h, w, h);
  ctx.shadowBlur = 26 * fl;
  ctx.fillStyle = rgba(color, 0.95 * fl);
  ctx.font = `700 ${Math.round(w * 0.66)}px "AlibabaPuHuiTi", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let c = 0; c < text.length; c++) {
    ctx.fillText(text[c], x + w / 2, y - h + h * (c + 0.55) / text.length);
  }
  ctx.restore();
}

// ---------- 街面：店面、雨棚、猫 ----------
function drawStreet(t, off) {
  const baseY = H * 0.706;
  const m = 260;
  const i0 = Math.floor((off - m) / m);
  for (let i = i0; i < i0 + Math.ceil(W / m) + 3; i++) {
    const r = K.rng('shop' + i);
    const x = i * m - off;
    const w = m * 0.96;
    ctx.fillStyle = mix(P.shop, '#080414', 0.5);
    ctx.fillRect(x, baseY - H * 0.062, w, H * 0.068);

    if (mod(i, 3) === 0) {
      // 卷帘门
      ctx.fillStyle = rgba('#0c0718', 0.9);
      ctx.fillRect(x + 18, baseY - H * 0.058, w * 0.5, H * 0.056);
      for (let y = 0; y < H * 0.05; y += 7) {
        ctx.fillStyle = rgba('#3b2a52', 0.28);
        ctx.fillRect(x + 18, baseY - H * 0.058 + y, w * 0.5, 3);
      }
    } else {
      // 亮着的玻璃窗 + 柜后人影
      const g = ctx.createLinearGradient(0, baseY - H * 0.06, 0, baseY + H * 0.01);
      g.addColorStop(0, rgba(P.neonA, 0.55));
      g.addColorStop(0.6, rgba('#ff8b52', 0.32));
      g.addColorStop(1, rgba('#ff8b52', 0.13));
      ctx.fillStyle = g;
      ctx.fillRect(x + 16, baseY - H * 0.058, w * 0.54, H * 0.056);
      ctx.fillStyle = rgba('#2a1030', 0.85);
      ctx.fillRect(x + 26, baseY - H * 0.036, w * 0.14, H * 0.034);
      ctx.fillStyle = rgba('#8f1f4a', 0.9);
      ctx.fillRect(x + 28, baseY - H * 0.05, w * 0.10, H * 0.012);
      ctx.fillStyle = rgba('#0d0a1c', 0.72);
      ctx.beginPath();
      ctx.arc(x + w * 0.43, baseY - H * 0.038, H * 0.014, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x + w * 0.38, baseY - H * 0.03, w * 0.10, H * 0.026);
    }
    if (mod(i, 2) === 0) {
      const ay = baseY - H * 0.07;
      const aw = w * 0.64;
      ctx.fillStyle = mod(i, 4) === 0 ? rgba('#c9305a', 0.94) : rgba('#1f8f8a', 0.94);
      ctx.beginPath();
      ctx.moveTo(x + 8, ay);
      ctx.lineTo(x + 8 + aw, ay);
      ctx.lineTo(x + 8 + aw - 14, ay + H * 0.03);
      ctx.lineTo(x + 22, ay + H * 0.03);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba('#000', 0.22);
      for (let s = 0; s < 5; s++) ctx.fillRect(x + 16 + s * aw / 5, ay, 5, H * 0.03);
      // 雨棚上的雨水连成线
      for (let d = 0; d < 5; d++) {
        ctx.fillStyle = rgba('#cfe9ff', 0.28);
        ctx.fillRect(x + 20 + d * aw / 5 + 2, ay + H * 0.03, 2, 6 + (d % 2) * 6);
      }
      if (mod(i, 7) === 2) drawCat(x + w * 0.34, baseY - H * 0.004, t);
    }
  }
}

function drawCat(x, y, t) {
  const s = H * 0.020;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#120a1e';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.7, s * 1.1, s * 0.66, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.95, -s * 1.25, s * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(s * 0.7, -s * 1.6);
  ctx.lineTo(s * 0.84, -s * 2.1);
  ctx.lineTo(s * 1.08, -s * 1.6);
  ctx.fill();
  ctx.strokeStyle = '#120a1e';
  ctx.lineWidth = s * 0.36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 1.05, -s * 0.45);
  ctx.quadraticCurveTo(-s * 2.0, -s * (0.7 + 0.5 * Math.sin(t * 4.2)), -s * 1.55, -s * 1.5);
  ctx.stroke();
  ctx.fillStyle = rgba('#ffe07a', 0.95);
  ctx.beginPath();
  ctx.arc(s * 1.06, -s * 1.3, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- 路面 ----------
function drawRoad(t, off) {
  const y0 = H * 0.716;
  const g = ctx.createLinearGradient(0, y0, 0, H);
  g.addColorStop(0, P.road2);
  g.addColorStop(0.25, P.road);
  g.addColorStop(1, '#070414');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, H - y0);

  ctx.fillStyle = '#1a1230';
  ctx.fillRect(0, y0, W, H * 0.026);
  ctx.fillStyle = rgba('#3a2a55', 0.5);
  ctx.fillRect(0, y0, W, 3);
  ctx.fillStyle = '#241838';
  ctx.fillRect(0, y0 + H * 0.026, W, H * 0.012);
  ctx.fillStyle = rgba('#ffb3d4', 0.18);
  ctx.fillRect(0, y0 + H * 0.026, W, 2);

  const m = 300;
  const i0 = Math.floor((off - m) / m);
  for (let i = i0; i < i0 + Math.ceil(W / m) + 3; i++) {
    const r = K.rng('wet' + i);
    const x = i * m - off + r() * 60;
    const w = m * (0.5 + r() * 0.5);
    ctx.fillStyle = rgba('#3b2a5c', 0.16 + r() * 0.1);
    ctx.beginPath();
    ctx.ellipse(x, H * (0.80 + r() * 0.1), w, H * (0.012 + r() * 0.016), 0, 0, Math.PI * 2);
    ctx.fill();
    // 水洼里的一小片霓虹
    if (r() > 0.55) {
      ctx.fillStyle = rgba(r() > 0.5 ? P.neonP : P.neonC, 0.10);
      ctx.beginPath();
      ctx.ellipse(x + 20, H * 0.90, w * 0.4, H * 0.006, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const dash = 170, gap = 130;
  const dOff = mod(off, dash + gap);
  for (let x = -dash + dOff; x < W + dash; x += dash + gap) {
    ctx.fillStyle = rgba('#d9c9a0', 0.5);
    ctx.beginPath();
    ctx.moveTo(x, H * 0.905);
    ctx.lineTo(x + dash * 0.9, H * 0.905);
    ctx.lineTo(x + dash * 0.9 + 26, H * 0.915);
    ctx.lineTo(x + 26, H * 0.915);
    ctx.closePath();
    ctx.fill();
  }
}

function neonReflections(t, off) {
  const items = [
    { x: 0.18, c: P.neonP, w: 0.10 },
    { x: 0.44, c: P.neonC, w: 0.06 },
    { x: 0.72, c: P.neonA, w: 0.12 },
    { x: 0.92, c: P.neonR, w: 0.05 }
  ];
  items.forEach((it, i) => {
    const x = mod(it.x * W - off * 0.55, W * 1.3) - W * 0.15;
    const wob = Math.sin(t * 2.2 + i * 1.4) * 5;
    const half = it.w * W * 0.5;
    // 湿路面倒影：软边光柱 + 横向断层，避免玻璃幕墙感
    const al = 0.26 * flicker(t, 20 + i);
    const g = ctx.createLinearGradient(0, H * 0.752, 0, H * 0.985);
    g.addColorStop(0, rgba(it.c, al));
    g.addColorStop(0.45, rgba(it.c, al * 0.55));
    g.addColorStop(1, rgba(it.c, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    const steps = 22;
    for (let k = 0; k <= steps; k++) {
      const p = k / steps;
      const yy = H * (0.752 + p * 0.233);
      const ww = half * (1 + Math.sin(p * 6 + i) * 0.10) * (1 + p * 0.22);
      const jx = Math.sin(t * 2.4 + p * 5 + i) * 5 + Math.sin(t * 1.1 + k) * 3;
      const px = x + wob + jx;
      if (k === 0) ctx.moveTo(px - ww, yy);
      else if (k % 2 === 0) ctx.lineTo(px - ww, yy);
      else ctx.quadraticCurveTo(px - ww * 1.06, yy, px - ww, yy);
    }
    for (let k = steps; k >= 0; k--) {
      const p = k / steps;
      const yy = H * (0.752 + p * 0.233);
      const ww = half * (1 + Math.sin(p * 6 + i + 1) * 0.10) * (1 + p * 0.22);
      const jx = Math.sin(t * 2.4 + p * 5 + i) * 5 + Math.sin(t * 1.1 + k) * 3;
      const px = x + wob + jx;
      ctx.lineTo(px + ww, yy);
    }
    ctx.closePath();
    ctx.fill();
    // 水面细高光
    for (let k = 0; k < 6; k++) {
      const yy = H * (0.79 + k * 0.030);
      const ww = half * (0.4 + (k % 3) * 0.16);
      ctx.fillStyle = rgba('#ffffff', 0.055 * flicker(t, 30 + i + k));
      ctx.fillRect(x + wob - ww * 0.5 + Math.sin(t * 4 + k) * 4, yy, ww, 2);
    }
  });
}

// ---------- 水洼与水花 ----------
function puddleX(t) { return 0.548 * W - (t - 4.55) * scrollSpeed(t) * 0.98; }
function puddle(t) {
  const x = puddleX(t), y = H * 0.895;
  const rx = W * 0.115, ry = H * 0.030;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(x - rx, y, x + rx, y);
  g.addColorStop(0, rgba('#2a1c46', 0.92));
  g.addColorStop(0.45, rgba('#ff4f9a', 0.18));
  g.addColorStop(1, rgba('#3fe6e0', 0.24));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba('#ffd9ea', 0.22);
  ctx.lineWidth = 2;
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const k = mod(t * 0.6 + i * 0.25, 1);
    ctx.strokeStyle = rgba('#ffe6f2', 0.18 * (1 - k));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x - rx * 0.2 + i * rx * 0.18, y, rx * 0.16 * (1 + k * 2.2), ry * 0.16 * (1 + k * 2.2), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function splash(t) {
  const dt = t - 4.55;
  if (dt < -0.05 || dt > 0.95) return;
  const x = puddleX(4.62) + W * 0.01, y = H * 0.895;
  const r = K.rng('splash' + Math.floor(dt * 30));
  const k = clamp(dt / 0.5);
  ctx.save();
  ctx.globalAlpha = 1 - k * 0.55;
  ctx.fillStyle = rgba('#d8f6ff', 0.30);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - W * 0.05, y - H * 0.10 * (1 - k * 0.4), x - W * 0.14, y - H * 0.02);
  ctx.quadraticCurveTo(x - W * 0.06, y + H * 0.005, x, y);
  ctx.fill();
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI * (0.15 + r() * 0.62);
    const v = 0.45 + r() * 0.8;
    const px = x + Math.cos(a) * W * 0.17 * v * k * 1.5;
    const py = y + Math.sin(a) * H * 0.14 * v * k * 1.5 + H * 0.30 * k * k * (0.3 + r() * 0.6);
    const sz = 2 + r() * 4;
    ctx.fillStyle = rgba(r() > 0.6 ? '#ffffff' : '#9fe9ff', 0.75 * (1 - k));
    ctx.fillRect(px, py, sz, sz * 1.6);
  }
  ctx.restore();
}

// ---------- 地缝白汽 ----------
function drawSteam(t) {
  const t0 = 6.0, t1 = 9.6;
  if (t < t0 - 0.2 || t > t1) return;
  const x = W * 0.70 - (t - t0) * scrollSpeed(t) * 0.9;
  const y = H * 0.905;
  const r = K.rng('steam');
  for (let i = 0; i < 30; i++) {
    const life = mod(t * 0.5 + r(), 1);
    const px = x + Math.sin(i * 2.1 + t * 1.5) * W * 0.022 * (0.4 + life);
    const py = y - life * H * 0.26;
    const rad = H * 0.011 * (0.6 + life * 2.6);
    const a = 0.11 * (1 - life) * clamp((t - t0 + 0.2) / 0.6);
    ctx.fillStyle = rgba('#dfe8ff', a);
    ctx.beginPath();
    ctx.ellipse(px, py, rad * 1.5, rad, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- 出租车 / 打伞的人 ----------
function drawTaxi(t) {
  const t0 = 1.85, t1 = 5.15;
  if (t < t0 || t > t1) return;
  const k = (t - t0) / (t1 - t0);
  const x = lerp(W * 1.20, -W * 0.30, ease(k));
  const y = H * 0.760;
  const s = H * 0.048;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = rgba('#05030d', 0.5);
  ctx.beginPath();
  ctx.ellipse(0, s * 0.15, s * 2.6, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 2.3, 0);
  ctx.lineTo(-s * 2.25, -s * 0.62);
  ctx.lineTo(-s * 1.35, -s * 0.72);
  ctx.lineTo(-s * 1.0, -s * 1.32);
  ctx.lineTo(s * 0.72, -s * 1.32);
  ctx.lineTo(s * 1.25, -s * 0.72);
  ctx.lineTo(s * 2.22, -s * 0.6);
  ctx.lineTo(s * 2.3, 0);
  ctx.closePath();
  ink(mix(P.neonA, '#c24a2a', 0.35), P.ink, 6);
  ctx.beginPath();
  ctx.moveTo(-s * 0.95, -s * 0.78);
  ctx.lineTo(-s * 0.6, -s * 1.2);
  ctx.lineTo(s * 0.6, -s * 1.2);
  ctx.lineTo(s * 0.9, -s * 0.78);
  ctx.closePath();
  ink(rgba('#1a2740', 0.95), P.ink, 4);
  ctx.fillStyle = rgba('#ffe9b0', 0.95);
  ctx.fillRect(-s * 0.22, -s * 1.5, s * 0.44, s * 0.2);
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(-s * 0.22, -s * 1.5, s * 0.44, s * 0.2);
  [-s * 1.5, s * 1.45].forEach((wx) => {
    ctx.fillStyle = P.tire;
    ctx.beginPath(); ctx.arc(wx, 0, s * 0.38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3a66';
    ctx.beginPath(); ctx.arc(wx, 0, s * 0.17, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = rgba('#fff3cf', 0.95);
  ctx.fillRect(-s * 2.34, -s * 0.5, s * 0.18, s * 0.24);
  ctx.fillStyle = rgba(P.neonR, 0.95);
  ctx.fillRect(s * 2.22, -s * 0.45, s * 0.12, s * 0.2);
  ctx.restore();
  const g = ctx.createLinearGradient(x + s * 2.3, 0, x + s * 7.0, 0);
  g.addColorStop(0, rgba('#ffe8b8', 0.38));
  g.addColorStop(1, rgba('#ffe8b8', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x + s * 2.3, y, s * 4.6, H * 0.026);
  const g2 = ctx.createLinearGradient(x - s * 2.3, 0, x - s * 6.0, 0);
  g2.addColorStop(0, rgba(P.neonR, 0.42));
  g2.addColorStop(1, rgba(P.neonR, 0));
  ctx.fillStyle = g2;
  ctx.fillRect(x - s * 5.8, y + 6, s * 3.4, H * 0.016);
}

function drawWalker(t) {
  const x = lerp(W * 1.18, W * 0.02, clamp((t / 10) * 1.06));
  const y = H * 0.700;
  const s = H * 0.045;
  const step = Math.sin(t * 5.2);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = rgba('#05030d', 0.4);
  ctx.beginPath();
  ctx.ellipse(0, 4, s * 0.5, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d3358';
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  [-1, 1].forEach((d) => {
    ctx.beginPath();
    ctx.moveTo(d * s * 0.1, -s * 0.5);
    ctx.lineTo(d * s * 0.1 + step * d * s * 0.22, -s * 0.02);
    ctx.stroke();
  });
  ctx.beginPath();
  ctx.moveTo(-s * 0.26, -s * 1.0);
  ctx.quadraticCurveTo(-s * 0.34, -s * 0.5, -s * 0.22, -s * 0.42);
  ctx.lineTo(s * 0.26, -s * 0.42);
  ctx.quadraticCurveTo(s * 0.32, -s * 0.62, s * 0.24, -s * 1.0);
  ctx.closePath();
  ink(P.coat2, P.ink, 4);
  // 撑伞的手臂
  ctx.strokeStyle = shade(P.coat2, -0.18);
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.18, -s * 0.96);
  ctx.lineTo(s * 0.24, -s * 0.74);
  ctx.lineTo(s * 0.10, -s * 0.66);
  ctx.stroke();
  ctx.fillStyle = P.skin;
  ctx.beginPath(); ctx.arc(s * 0.06, -s * 0.65, s * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = P.skin;
  ctx.beginPath(); ctx.arc(0, -s * 1.16, s * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
  ctx.save();
  ctx.translate(0, -s * 1.28);
  ctx.rotate(Math.sin(t * 1.6) * 0.06);
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.62, s * 0.78, s * 0.30, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = rgba('#bfe9ff', 0.30);
  ctx.fill();
  ctx.strokeStyle = rgba('#e9f8ff', 0.7);
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = rgba('#e9f8ff', 0.4);
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * s * 0.3, -s * 0.6);
    ctx.lineTo(i * s * 0.34, -s * 0.28);
    ctx.stroke();
  }
  ctx.strokeStyle = '#2a2036';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.62);
  ctx.lineTo(0, s * 0.05);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ---------- 街灯 / 信号灯 ----------
function drawStreetLamp(t, off) {
  const m = 640;
  const i0 = Math.floor((off - m) / m);
  for (let i = i0; i < i0 + Math.ceil(W / m) + 3; i++) {
    const x = i * m - off;
    const y = H * 0.744;
    ctx.strokeStyle = '#0b0718';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - H * 0.30);
    ctx.quadraticCurveTo(x, y - H * 0.33, x + W * 0.045, y - H * 0.33);
    ctx.stroke();
    ctx.fillStyle = '#0e0a1e';
    ctx.beginPath();
    ctx.ellipse(x + W * 0.045, y - H * 0.327, W * 0.018, H * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(x + W * 0.045, y - H * 0.325, 4, x + W * 0.045, y - H * 0.325, H * 0.24);
    g.addColorStop(0, rgba('#ffdc9a', 0.85));
    g.addColorStop(0.3, rgba('#ffb45c', 0.26));
    g.addColorStop(1, rgba('#ffb45c', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x + W * 0.045, y - H * 0.325, H * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba('#ffcf8a', 0.10);
    ctx.beginPath();
    ctx.moveTo(x + W * 0.045 - W * 0.02, y - H * 0.31);
    ctx.lineTo(x + W * 0.045 + W * 0.02, y - H * 0.31);
    ctx.lineTo(x + W * 0.045 + W * 0.09, H * 0.95);
    ctx.lineTo(x + W * 0.045 - W * 0.10, H * 0.95);
    ctx.closePath();
    ctx.fill();
  }
}

function drawTrafficLight(t, off) {
  const m = 1280;
  const i0 = Math.floor((off - m) / m);
  for (let i = i0; i < i0 + Math.ceil(W / m) + 3; i++) {
    const x = i * m - off + 300;
    const y0 = H * 0.800;
    ctx.strokeStyle = '#0a0616';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y0 - H * 0.235);
    ctx.stroke();
    const boxY = y0 - H * 0.235;
    ctx.fillStyle = '#0d0819';
    ctx.strokeStyle = '#070410';
    ctx.lineWidth = 4;
    rr(x - 22, boxY, 44, H * 0.10, 8);
    ctx.fill(); ctx.stroke();
    const phase = mod(t + i * 2, 8.4);
    const on = phase < 3.2 ? 0 : phase < 6.4 ? 2 : 1;
    [P.neonR, P.neonA, '#39e08a'].forEach((c, k) => {
      const cy = boxY + H * 0.018 + k * H * 0.031;
      const lit = k === on;
      ctx.fillStyle = lit ? rgba(c, 0.95) : rgba(c, 0.16);
      ctx.beginPath();
      ctx.arc(x, cy, H * 0.013, 0, Math.PI * 2);
      ctx.fill();
      if (lit) {
        const g = ctx.createRadialGradient(x, cy, 2, x, cy, H * 0.06);
        g.addColorStop(0, rgba(c, 0.5));
        g.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, cy, H * 0.06, 0, Math.PI * 2); ctx.fill();
      }
    });
  }
}

// ---------- 骑手 ----------
function drawRider(t) {
  const x = screenX(t);
  const y = H * 0.862 + Math.sin(t * 7.5) * H * 0.003;
  const s = H * 0.175;
  const wheelA = (worldX(t) / W) * 7.6;
  const crank = wheelA * 0.62;

  // 影子
  ctx.fillStyle = rgba('#05030d', 0.55);
  ctx.beginPath();
  ctx.ellipse(x, y + H * 0.012, s * 1.30, s * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // 倒影
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.translate(x, y);
  ctx.scale(1, -0.40);
  ctx.translate(0, -H * 0.010);
  drawBike(s, wheelA, crank);
  drawGirl(s, t, crank, wheelA, true);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  drawBike(s, wheelA, crank);
  drawGirl(s, t, crank, wheelA, false);
  ctx.restore();

  // 车灯
  const lx = x + s * 0.86, ly = y - s * 0.86;
  const g = ctx.createLinearGradient(lx, ly, lx + s * 3.4, ly + s * 0.5);
  g.addColorStop(0, rgba('#fff6d0', 0.60));
  g.addColorStop(0.5, rgba('#ffe2a0', 0.18));
  g.addColorStop(1, rgba('#ffe2a0', 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(lx, ly - s * 0.06);
  ctx.lineTo(lx + s * 3.2, ly - s * 0.60);
  ctx.lineTo(lx + s * 3.2, ly + s * 0.42);
  ctx.lineTo(lx, ly + s * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = rgba('#fff6d0', 0.95);
  ctx.beginPath();
  ctx.arc(lx, ly, s * 0.045, 0, Math.PI * 2);
  ctx.fill();

  // 车灯在湿路面上的暖光池
  const pool = ctx.createRadialGradient(x + s * 1.9, y + s * 0.02, 0, x + s * 1.9, y + s * 0.02, s * 1.5);
  pool.addColorStop(0, rgba('#ffd28a', 0.34));
  pool.addColorStop(0.55, rgba('#ffb066', 0.14));
  pool.addColorStop(1, rgba('#ff9a5a', 0));
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(x + s * 1.9, y + s * 0.02, s * 1.6, s * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  // 车铃 + 6.0s 按铃的声波圈
  ctx.fillStyle = '#e8d9a8';
  ctx.beginPath();
  ctx.ellipse(x + s * 0.47, y - s * 0.865, s * 0.048, s * 0.040, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba('#0a0610', 0.85);
  ctx.lineWidth = 2.5;
  ctx.stroke();
  const dingK = (t - 6.0) / 0.62;
  if (dingK > 0 && dingK < 1) {
    for (let i = 0; i < 3; i++) {
      const rr = (dingK + i * 0.26) * s * 1.5;
      const al = (1 - dingK) * 0.55 * (1 - i * 0.22);
      if (al <= 0) continue;
      ctx.strokeStyle = rgba('#bff6ff', al);
      ctx.lineWidth = 3 - i;
      ctx.beginPath();
      ctx.arc(x + s * 0.50, y - s * 0.88, rr, -1.05, -0.15);
      ctx.stroke();
    }
  }

  // 起步速度线
  const sp = clamp((2.4 - t) / 1.5);
  if (sp > 0) {
    for (let i = 0; i < 10; i++) {
      const ly2 = y - s * (0.15 + i * 0.14);
      const len = s * (0.35 + hash01(i) * 0.9) * sp;
      ctx.fillStyle = rgba('#ffffff', 0.08 + sp * 0.18);
      ctx.fillRect(x - s * 1.9 - len, ly2, len, 3);
    }
  }
  // 后轮甩水
  for (let i = 0; i < 14; i++) {
    const r = K.rng('spray' + i);
    const k = mod(t * 1.8 + r(), 1);
    ctx.fillStyle = rgba('#cdefff', 0.26 * (1 - k));
    ctx.fillRect(x - s * 1.05 - k * s * 0.7, y - k * s * 0.55, 3 + r() * 4, 2 + r() * 3);
  }
}

// 车：后轮 -0.62、前轮 0.64、中轴 -0.06/-0.11、座 -0.34/-0.87、车头 0.40/-0.82
function drawBike(s, wheelA, crank) {
  const inkC = P.ink;
  const BB = [-s * 0.06, -s * 0.11];
  const SEAT = [-s * 0.34, -s * 0.86];
  const HEAD = [s * 0.40, -s * 0.80];
  const REAR = [-s * 0.62, 0];
  const FRONT = [s * 0.64, 0];

  drawWheel(REAR[0], 0, s * 0.36, wheelA);
  drawWheel(FRONT[0], 0, s * 0.36, wheelA);

  // 链条
  ctx.strokeStyle = rgba('#cdbdab', 0.75);
  ctx.lineWidth = s * 0.018;
  ctx.beginPath();
  ctx.moveTo(BB[0], BB[1] + s * 0.075);
  ctx.lineTo(REAR[0], s * 0.02);
  ctx.stroke();

  // 车架：描边 + 填色
  const segs = [
    [BB, SEAT], [SEAT, HEAD], [HEAD, BB], [BB, REAR], [SEAT, REAR], [HEAD, FRONT]
  ];
  ctx.strokeStyle = inkC;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  segs.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  });
  ctx.strokeStyle = P.teal;
  ctx.lineWidth = 6;
  segs.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  });

  // 牙盘
  ctx.fillStyle = '#3a2a48';
  ctx.beginPath(); ctx.arc(BB[0], BB[1], s * 0.085, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#c8b8a8';
  ctx.beginPath(); ctx.arc(BB[0], BB[1], s * 0.028, 0, Math.PI * 2); ctx.fill();

  // 座垫
  ctx.fillStyle = '#2a1730';
  ctx.beginPath();
  ctx.ellipse(SEAT[0] - s * 0.02, SEAT[1] - s * 0.02, s * 0.16, s * 0.048, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.stroke();

  // 车把（城市车的上翘把）
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(HEAD[0] + s * 0.01, HEAD[1]);
  ctx.lineTo(HEAD[0] + s * 0.04, HEAD[1] - s * 0.10);
  ctx.quadraticCurveTo(HEAD[0] + s * 0.16, HEAD[1] - s * 0.14, HEAD[0] + s * 0.14, HEAD[1] - s * 0.01);
  ctx.stroke();
  ctx.strokeStyle = '#d8cfc0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(HEAD[0] + s * 0.08, HEAD[1] - s * 0.13);
  ctx.quadraticCurveTo(HEAD[0] + s * 0.16, HEAD[1] - s * 0.12, HEAD[0] + s * 0.14, HEAD[1] - s * 0.01);
  ctx.stroke();

  // 前筐（挂在车把前）
  ctx.save();
  ctx.translate(HEAD[0] + s * 0.10, HEAD[1] - s * 0.12);
  ctx.fillStyle = rgba('#3a2a48', 0.95);
  rr(-s * 0.06, s * 0.02, s * 0.34, s * 0.26, 5);
  ctx.fill();
  ctx.strokeStyle = '#1a1226';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = rgba('#c8bfae', 0.5);
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.06 + i * s * 0.11, s * 0.02);
    ctx.lineTo(-s * 0.06 + i * s * 0.11, s * 0.28);
    ctx.stroke();
  }
  // 磁带盒
  ctx.fillStyle = '#14101e';
  ctx.fillRect(s * 0.02, s * 0.07, s * 0.20, s * 0.13);
  ctx.fillStyle = rgba(P.neonP, 0.9);
  ctx.fillRect(s * 0.05, s * 0.10, s * 0.14, s * 0.04);
  ctx.restore();

  // 车灯（在把前）
  ctx.fillStyle = '#e8dcc8';
  ctx.beginPath();
  ctx.arc(HEAD[0] + s * 0.10, HEAD[1] - s * 0.05, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.stroke();

  // 后货架 + 快递箱
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-s * 0.86, -s * 0.70);
  ctx.lineTo(-s * 0.34, -s * 0.70);
  ctx.moveTo(-s * 0.62, -s * 0.70);
  ctx.lineTo(-s * 0.62, -s * 0.30);
  ctx.moveTo(-s * 0.36, -s * 0.70);
  ctx.lineTo(-s * 0.40, -s * 0.46);
  ctx.stroke();
  const bx = -s * 0.86, by = -s * 1.06;
  ctx.fillStyle = P.coat;
  rr(bx, by, s * 0.46, s * 0.37, 5);
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#c93b3b';
  ctx.fillRect(bx, by + s * 0.11, s * 0.46, s * 0.065);
  ctx.fillStyle = '#fff4e2';
  ctx.fillRect(bx + s * 0.10, by + s * 0.04, s * 0.17, s * 0.05);
  // 箱上的反光条
  ctx.fillStyle = rgba('#fff2b8', 0.5);
  ctx.fillRect(bx + s * 0.03, by + s * 0.27, s * 0.40, s * 0.032);
  // 尾灯
  ctx.fillStyle = rgba(P.neonR, 0.95);
  ctx.beginPath();
  ctx.arc(-s * 0.72, -s * 0.74, s * 0.030, 0, Math.PI * 2);
  ctx.fill();
}

function drawWheel(cx, cy, r, a) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = P.tire;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = P.rim;
  ctx.lineWidth = r * 0.14;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = rgba('#ffe3f0', 0.8);
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    ctx.save();
    ctx.rotate(a + i * Math.PI / 9);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(r * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#d8cfc0';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// 骑姿：髋 -0.30/-0.88、肩 0.02/-1.34、头 0.17/-1.56
function drawGirl(s, t, crank, wheelA, mirror) {
  const BB = [-s * 0.06, -s * 0.11];
  const R = s * 0.17;
  const pedalN = [BB[0] + Math.cos(crank) * R, BB[1] + Math.sin(crank) * R];
  const pedalF = [BB[0] - Math.cos(crank) * R, BB[1] - Math.sin(crank) * R];
  const hip = [-s * 0.30, -s * 0.88];
  const shoulder = [s * 0.02, -s * 1.26];
  const head = [s * 0.17, -s * 1.47];
  const flutter = Math.sin(t * 11) * 0.16;

  if (mirror) {
    // 倒影里只留一个剪影，省得细节在水里翻
    ctx.fillStyle = rgba('#f2c14e', 0.85);
    ctx.beginPath();
    ctx.ellipse(head[0], head[1], s * 0.16, s * 0.17, -0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hip[0], hip[1]);
    ctx.lineTo(shoulder[0], shoulder[1]);
    ctx.lineWidth = s * 0.3;
    ctx.strokeStyle = rgba('#f2c14e', 0.85);
    ctx.stroke();
    return;
  }

  // 远侧腿
  drawLeg(s, hip, pedalF, '#241d3c', -1);
  // 远侧曲柄
  ctx.strokeStyle = rgba('#0a0610', 0.85);
  ctx.lineWidth = s * 0.030;
  ctx.beginPath();
  ctx.moveTo(BB[0], BB[1]);
  ctx.lineTo(pedalF[0], pedalF[1]);
  ctx.stroke();

  // 衣摆（向后飘）
  ctx.fillStyle = shade(P.coat, -0.12);
  ctx.beginPath();
  ctx.moveTo(hip[0] - s * 0.02, hip[1] - s * 0.12);
  ctx.quadraticCurveTo(hip[0] - s * 0.26, hip[1] - s * (0.02 + flutter * 2.0),
    hip[0] - s * 0.40, hip[1] + s * (0.12 + flutter * 2.6));
  ctx.quadraticCurveTo(hip[0] - s * 0.20, hip[1] + s * 0.10, hip[0] - s * 0.02, hip[1] + s * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 躯干
  ctx.beginPath();
  ctx.moveTo(hip[0] - s * 0.09, hip[1] + s * 0.02);
  ctx.quadraticCurveTo(hip[0] - s * 0.15, hip[1] - s * 0.24, shoulder[0] - s * 0.11, shoulder[1] + s * 0.10);
  ctx.quadraticCurveTo(shoulder[0] - s * 0.01, shoulder[1] - s * 0.04, shoulder[0] + s * 0.09, shoulder[1] + s * 0.02);
  ctx.quadraticCurveTo(shoulder[0] + s * 0.15, shoulder[1] + s * 0.10, shoulder[0] + s * 0.04, shoulder[1] + s * 0.16);
  ctx.quadraticCurveTo(hip[0] + s * 0.16, hip[1] - s * 0.28, hip[0] + s * 0.16, hip[1] + s * 0.05);
  ctx.closePath();
  ink(P.coat, P.ink, 6);
  // 反光条
  ctx.strokeStyle = rgba('#fff6d0', 0.9);
  ctx.lineWidth = s * 0.026;
  ctx.beginPath();
  ctx.moveTo(hip[0] - s * 0.01, hip[1] - s * 0.12);
  ctx.quadraticCurveTo(hip[0] + s * 0.07, hip[1] - s * 0.30, shoulder[0] - s * 0.01, shoulder[1] + s * 0.20);
  ctx.stroke();
  // 斜挎带
  ctx.strokeStyle = rgba('#3a1a2a', 0.85);
  ctx.lineWidth = s * 0.035;
  ctx.beginPath();
  ctx.moveTo(shoulder[0] + s * 0.05, shoulder[1] + s * 0.04);
  ctx.lineTo(hip[0] + s * 0.12, hip[1] + s * 0.02);
  ctx.stroke();

  // 手臂
  const hand = [s * 0.50, -s * 0.80];
  const elbow = [s * 0.28, -s * 1.10];
  ctx.strokeStyle = P.ink;
  ctx.lineWidth = s * 0.10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulder[0] + s * 0.03, shoulder[1] + s * 0.13);
  ctx.lineTo(elbow[0], elbow[1]);
  ctx.lineTo(hand[0], hand[1]);
  ctx.stroke();
  ctx.strokeStyle = shade(P.coat, -0.18);
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.moveTo(shoulder[0] + s * 0.03, shoulder[1] + s * 0.13);
  ctx.lineTo(elbow[0], elbow[1]);
  ctx.lineTo(hand[0], hand[1]);
  ctx.stroke();
  ctx.fillStyle = '#161022';
  ctx.beginPath(); ctx.arc(hand[0], hand[1], s * 0.05, 0, Math.PI * 2); ctx.fill();

  // 近侧腿 + 曲柄
  ctx.strokeStyle = rgba('#0a0610', 0.9);
  ctx.lineWidth = s * 0.030;
  ctx.beginPath();
  ctx.moveTo(BB[0], BB[1]);
  ctx.lineTo(pedalN[0], pedalN[1]);
  ctx.stroke();
  drawLeg(s, hip, pedalN, '#3a2f5c', 1);

  // 脖子
  ctx.strokeStyle = P.skin;
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(shoulder[0] + s * 0.02, shoulder[1] + s * 0.06);
  ctx.lineTo(head[0] - s * 0.03, head[1] + s * 0.15);
  ctx.stroke();

  // 脸（侧脸）
  ctx.fillStyle = P.skin;
  ctx.beginPath();
  ctx.ellipse(head[0], head[1], s * 0.15, s * 0.16, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  // 鼻子
  ctx.beginPath();
  ctx.moveTo(head[0] + s * 0.145, head[1] - s * 0.02);
  ctx.lineTo(head[0] + s * 0.175, head[1] + s * 0.035);
  ctx.lineTo(head[0] + s * 0.125, head[1] + s * 0.05);
  ctx.fillStyle = P.skin;
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.stroke();

  // 头发：贴住后脑的一层 + 往后飘的马尾
  ctx.fillStyle = P.hair;
  ctx.beginPath();
  ctx.moveTo(head[0] - s * 0.14, head[1] + s * 0.07);
  ctx.quadraticCurveTo(head[0] - s * 0.24, head[1] - s * 0.06, head[0] - s * 0.06, head[1] - s * 0.19);
  ctx.quadraticCurveTo(head[0] + s * 0.02, head[1] - s * 0.12, head[0] - s * 0.01, head[1] - s * 0.04);
  ctx.quadraticCurveTo(head[0] - s * 0.06, head[1] + s * 0.04, head[0] - s * 0.14, head[1] + s * 0.07);
  ctx.closePath();
  ctx.fill();
  // 马尾（两股，向后平飘）
  const tailA = [head[0] - s * 0.17, head[1] + s * 0.00];
  ctx.lineCap = 'round';
  ctx.strokeStyle = P.hair;
  ctx.lineWidth = s * 0.075;
  ctx.beginPath();
  ctx.moveTo(tailA[0], tailA[1]);
  ctx.quadraticCurveTo(tailA[0] - s * 0.22, tailA[1] + s * (0.03 + flutter * 1.1),
    tailA[0] - s * 0.42, tailA[1] + s * (0.11 + flutter * 1.5));
  ctx.stroke();
  ctx.strokeStyle = shade(P.hair, -0.12);
  ctx.lineWidth = s * 0.040;
  ctx.beginPath();
  ctx.moveTo(tailA[0] - s * 0.01, tailA[1] - s * 0.01);
  ctx.quadraticCurveTo(tailA[0] - s * 0.24, tailA[1] - s * (0.04 - flutter * 1.3),
    tailA[0] - s * 0.46, tailA[1] - s * (0.00 - flutter * 1.4));
  ctx.stroke();
  // 发绳
  ctx.fillStyle = P.teal;
  ctx.beginPath();
  ctx.ellipse(tailA[0] + s * 0.01, tailA[1] + s * 0.01, s * 0.030, s * 0.042, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // 头盔
  ctx.fillStyle = '#d13a4e';
  ctx.beginPath();
  ctx.ellipse(head[0] + s * 0.005, head[1] - s * 0.13, s * 0.17, s * 0.115, -0.12, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = '#b52f42';
  ctx.beginPath();
  ctx.moveTo(head[0] + s * 0.10, head[1] - s * 0.14);
  ctx.lineTo(head[0] + s * 0.22, head[1] - s * 0.11);
  ctx.lineTo(head[0] + s * 0.15, head[1] - s * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba('#ffe3ea', 0.8);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(head[0] - s * 0.14, head[1] - s * 0.18);
  ctx.quadraticCurveTo(head[0], head[1] - s * 0.24, head[0] + s * 0.13, head[1] - s * 0.17);
  ctx.stroke();

  // 眼、腮红、嘴
  ctx.fillStyle = P.ink;
  ctx.beginPath();
  ctx.ellipse(head[0] + s * 0.07, head[1] - s * 0.02, s * 0.022, s * 0.030, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba('#ff8aa0', 0.40);
  ctx.beginPath();
  ctx.arc(head[0] + s * 0.09, head[1] + s * 0.06, s * 0.030, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba('#8a2a34', 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(head[0] + s * 0.085, head[1] + s * 0.085, s * 0.024, 0.15, 1.1);
  ctx.stroke();

  // 围巾：脖圈 + 两条向后飘的带子
  ctx.fillStyle = P.teal;
  ctx.beginPath();
  ctx.moveTo(shoulder[0] - s * 0.08, shoulder[1] + s * 0.01);
  ctx.quadraticCurveTo(shoulder[0] + s * 0.02, shoulder[1] - s * 0.04, shoulder[0] + s * 0.10, shoulder[1] + 0.01 * s);
  ctx.quadraticCurveTo(shoulder[0] + s * 0.01, shoulder[1] + s * 0.09, shoulder[0] - s * 0.08, shoulder[1] + s * 0.01);
  ctx.closePath();
  ink(P.teal, P.ink, 3);
  [[0.02, 0.10], [0.06, 0.03]].forEach(([dy, th], k) => {
    ctx.strokeStyle = k === 0 ? rgba(P.teal, 0.95) : rgba(shade(P.teal, -0.2), 0.95);
    ctx.lineWidth = s * (k === 0 ? 0.045 : 0.030);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulder[0] - s * 0.07, shoulder[1] + s * (0.04 + dy));
    ctx.quadraticCurveTo(shoulder[0] - s * 0.30, shoulder[1] - s * (0.01 - flutter * 2.2) + s * dy,
      shoulder[0] - s * 0.52, shoulder[1] + s * (0.10 + flutter * 2.6) + s * dy);
    ctx.stroke();
  });
}

function legIK(hip, pedal, l1, l2, sign) {
  const dx = pedal[0] - hip[0], dy = pedal[1] - hip[1];
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 1);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * Math.max(1e-6, d)), -1, 1));
  const base = Math.atan2(dy, dx);
  const ang = base + sign * a;
  return [hip[0] + Math.cos(ang) * l1, hip[1] + Math.sin(ang) * l1];
}

function drawLeg(s, hip, pedal, cloth, sign) {
  const l1 = s * 0.40, l2 = s * 0.40;
  const knee = legIK(hip, pedal, l1, l2, sign);
  ctx.strokeStyle = shade(cloth, -0.14);
  ctx.lineWidth = s * 0.135;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hip[0], hip[1]);
  ctx.lineTo(knee[0], knee[1]);
  ctx.stroke();
  ctx.strokeStyle = cloth;
  ctx.lineWidth = s * 0.095;
  ctx.beginPath();
  ctx.moveTo(knee[0], knee[1]);
  ctx.lineTo(pedal[0], pedal[1]);
  ctx.stroke();
  // 反光脚踝环
  ctx.strokeStyle = rgba('#fff6d0', 0.8);
  ctx.lineWidth = s * 0.016;
  ctx.beginPath();
  ctx.moveTo(knee[0] * 0.3 + pedal[0] * 0.7, knee[1] * 0.3 + pedal[1] * 0.7);
  ctx.lineTo(pedal[0], pedal[1]);
  ctx.stroke();
  // 鞋
  ctx.save();
  ctx.translate(pedal[0], pedal[1]);
  ctx.rotate(0.12);
  ctx.fillStyle = '#141021';
  ctx.beginPath();
  ctx.ellipse(s * 0.03, -s * 0.005, s * 0.075, s * 0.042, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba('#fff4e2', 0.45);
  ctx.fillRect(-s * 0.02, -s * 0.03, s * 0.08, s * 0.010);
  ctx.restore();
  // 踏板
  ctx.fillStyle = '#2a2036';
  ctx.fillRect(pedal[0] - s * 0.055, pedal[1] + s * 0.03, s * 0.12, s * 0.024);
}

// ---------- 前景 ----------
function drawForeground(t, off) {
  // 画面左下角压一角：护柱 + 垃圾袋，制造前景层次（固定不横移，不挡主角）
  const bx = -34;
  ctx.fillStyle = rgba('#08040f', 0.95);
  ctx.fillRect(bx, H * 0.60, 54, H * 0.42);
  ctx.fillRect(bx - 12, H * 0.578, 78, 20);
  ctx.fillStyle = rgba('#ffc25c', 0.30);
  ctx.fillRect(bx + 8, H * 0.71, 38, 13);
  ctx.fillStyle = rgba('#0c0716', 0.97);
  ctx.beginPath();
  ctx.ellipse(bx + 128, H * 0.995, 74, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bx + 208, H * 1.005, 52, 32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = rgba('#3a2a52', 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(bx + 128, H * 0.995, 74, 46, 0, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();
}

// ---------- 雨 ----------
function drawRain(t, layer) {
  const n = [110, 70, 40][layer];
  const len = [H * 0.045, H * 0.075, H * 0.115][layer];
  const spd = [0.5, 0.85, 1.45][layer];
  const alpha = [0.13, 0.22, 0.32][layer];
  const wdt = [1.2, 1.8, 2.6][layer];
  const r = K.rng('rain' + layer);
  ctx.strokeStyle = rgba('#dff0ff', alpha);
  ctx.lineWidth = wdt;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x0 = r() * W;
    const y0 = r() * H;
    const y = mod(t * spd * H * 1.6 + y0, H * 1.2) - H * 0.1;
    const slant = -0.20;
    ctx.beginPath();
    ctx.moveTo(x0 + y * slant, y);
    ctx.lineTo(x0 + (y + len) * slant, y + len);
    ctx.stroke();
  }
  // 雨打在水面上的小竖点
  if (layer === 1) {
    const r2 = K.rng('rainspot');
    for (let i = 0; i < 26; i++) {
      const x = r2() * W;
      const ph = mod(t * 2.2 + r2(), 1);
      ctx.fillStyle = rgba('#cfe9ff', 0.22 * (1 - ph));
      ctx.fillRect(x, H * (0.78 + r2() * 0.2), 2, 4 + ph * 6);
    }
  }
}

function drawCables(t) {
  ctx.strokeStyle = rgba('#0a0616', 0.85);
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const y = H * (0.24 + i * 0.033);
    ctx.beginPath();
    ctx.moveTo(-20, y);
    ctx.quadraticCurveTo(W * 0.5, y + H * (0.06 + i * 0.02) + Math.sin(t * 0.8 + i) * 4, W + 20, y - H * 0.01);
    ctx.stroke();
  }
}

// ---------- 后处理 ----------
function grade(t) {
  const g = ctx.createRadialGradient(W * 0.5, H * 0.52, H * 0.35, W * 0.5, H * 0.52, H * 0.95);
  g.addColorStop(0, rgba('#000000', 0));
  g.addColorStop(1, rgba('#0a0212', 0.55));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = rgba('#ff2f7a', 0.05);
  ctx.fillRect(0, 0, W, H);

  const fr = Math.round(t * 30);
  const r = K.rng('grain' + fr);
  for (let i = 0; i < 2400; i++) {
    const g2 = 120 + Math.floor(r() * 135);
    ctx.fillStyle = `rgba(${g2},${g2},${g2},${0.03 + r() * 0.07})`;
    ctx.fillRect(r() * W, r() * H, 2, 2);
  }
}

// ---------- 一帧 ----------
window.renderAt = (t) => {
  ENV.reset();
  ctx.fillStyle = P.sky0;
  ctx.fillRect(0, 0, W, H);

  const off = scroll(t);
  drawSky(t);
  drawFarCity(t, off * 0.34);
  drawCables(t);
  drawMidCity(t, off * 0.58);
  drawStreet(t, off * 0.92);
  drawStreetLamp(t, off * 0.92);
  drawTrafficLight(t, off * 0.92);
  drawRoad(t, off);
  neonReflections(t, off);
  puddle(t);
  drawTaxi(t);
  drawWalker(t);
  drawSteam(t);
  drawRider(t);
  splash(t);
  drawRain(t, 0);
  drawRain(t, 1);
  drawRain(t, 2);
  drawForeground(t, off);
  grade(t);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
