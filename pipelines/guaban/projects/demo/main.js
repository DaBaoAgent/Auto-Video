// guaban · 刮版画（整块黑板上用刀刮出白线，白线就是全部的光）
// 场景《暴风雨里的灯塔》：塔顶的灯一圈圈扫过海面，浪被刀刮成一层层白丝，雨斜着往下砸。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:guaban:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const BOARD = '#0e0f13';
const CHALK = '239,238,232';

function wake(alpha) { ctx.strokeStyle = `rgba(${CHALK},${alpha})`; }

// 手刮的线：端点抖一点，粗细不匀
function scratch(x0, y0, x1, y1, w, a, jit) {
  const n = 4, j = jit == null ? 1.6 : jit;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const q = i / n;
    const x = x0 + (x1 - x0) * q + Math.sin(q * 9 + x0) * j;
    const y = y0 + (y1 - y0) * q + Math.cos(q * 7 + y0) * j;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.lineWidth = w;
  ctx.stroke();
}

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // 黑板
  ctx.fillStyle = BOARD;
  ctx.fillRect(0, 0, W, H);
  // 板面本身的手工粗糙（很暗的白噪点）
  ctx.fillStyle = 'rgba(239,238,232,0.05)';
  for (let i = 0; i < 1400; i++) ctx.fillRect((i * 2711) % W, (i * 1873) % H, 2, 2);

  const HZ = 500;

  // ---------- 天空：云被刮成一团团横向白丝 ----------
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, HZ - 20); ctx.clip();
  for (let c = 0; c < 6; c++) {
    const cy = 90 + c * 74;
    const drift = Math.sin(t * 0.22 + c) * 26;
    const n = 46 - c * 3;
    for (let i = 0; i < n; i++) {
      const x = -40 + i * (W + 80) / n + drift + Math.sin(i * 1.7 + c) * 22;
      const len = 60 + Math.sin(i * 2.3 + c) * 40;
      const yy = cy + Math.sin(i * 1.1 + c * 2) * 16 + (c % 2 ? 8 : -8);
      wake(0.10 + 0.5 * (1 - c / 6));
      scratch(x, yy, x + len, yy + Math.sin(i) * 3, 1.4 + (i % 3) * 0.5, 0.14, 2);
    }
  }
  ctx.restore();

  // 星（很少，被云压着）
  ctx.fillStyle = 'rgba(239,238,232,0.9)';
  [[820, 132, 2.4], [1080, 96, 1.8], [1420, 168, 2.2], [620, 210, 1.6], [1020, 250, 1.4]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  });

  // ---------- 海：一层层白浪丝，越近越粗 ----------
  ctx.save();
  ctx.beginPath(); ctx.rect(0, HZ - 30, W, H - HZ + 30); ctx.clip();
  // 海平线：一道亮的刮痕（只在右侧海面上）
  wake(0.85); scratch(360, HZ - 10, W + 20, HZ - 2, 2.6, 0.9, 2);
  for (let row = 0; row < 16; row++) {
    const y0 = HZ + 10 + row * 44;
    const speed = 14 + row * 7;
    const n = 24 - row;
    for (let i = 0; i < n; i++) {
      const h1 = Math.sin(i * 12.9 + row * 7.7) * 0.5 + 0.5;
      const h2 = Math.sin(i * 4.3 + row * 2.1) * 0.5 + 0.5;
      const x = -200 + i * (W + 400) / n + ((t * speed) % ((W + 400) / n));
      const len = 70 + h1 * 190 + row * 8;
      const yy = y0 + h2 * 22 - 11;
      const amp = 4 + h2 * (10 + row * 3);
      ctx.beginPath();
      for (let k = 0; k <= 12; k++) {
        const q = k / 12;
        const x2 = x + q * len;
        const y2 = yy + Math.sin(q * Math.PI * (1 + h1)) * -amp + Math.sin(t * 2.2 + i + q * 4) * 1.6;
        k ? ctx.lineTo(x2, y2) : ctx.moveTo(x2, y2);
      }
      const a = 0.14 + 0.34 * (1 - row / 18) + h1 * 0.12;
      ctx.strokeStyle = `rgba(${CHALK},${a})`;
      ctx.lineWidth = 1.2 + row * 0.2;
      ctx.stroke();
      // 浪尖上的碎线
      if (row < 8 && h1 > 0.45) {
        for (let k = 0; k < 2; k++) {
          const x2 = x + len * (0.3 + k * 0.34);
          const y2 = yy - amp * 0.8;
          ctx.strokeStyle = `rgba(${CHALK},${0.1 + 0.24 * (1 - row / 9)})`;
          scratch(x2, y2, x2 + 10 + h2 * 22, y2 + 6 + h1 * 8, 1.1, 0.5, 2);
        }
      }
    }
  }
  ctx.restore();

  // ---------- 礁石 ----------
  ctx.fillStyle = BOARD;
  ctx.beginPath();
  ctx.moveTo(-40, H + 40); ctx.lineTo(-40, 940);
  ctx.lineTo(180, 900); ctx.lineTo(360, 860); ctx.lineTo(520, 830);
  ctx.lineTo(640, 890); ctx.lineTo(760, H + 40);
  ctx.closePath(); ctx.fill();
  // 礁石的刀口
  for (let i = 0; i < 22; i++) {
    const x = 30 + i * 30, y = 906 + Math.sin(i * 0.7) * 22;
    wake(0.18 + 0.1 * (i % 3)); scratch(x, y, x + 26, y - 22 - (i % 4) * 7, 1.6, 0.5, 2);
  }
  // 激起的水花
  ctx.fillStyle = 'rgba(239,238,232,0.55)';
  for (let i = 0; i < 30; i++) {
    const ph = (t * 0.7 + i / 30) % 1;
    const x = 520 + i * 10 + Math.sin(i * 5) * 30;
    const y = 830 - ph * 70 + Math.cos(i * 3) * 10;
    ctx.globalAlpha = 0.5 * (1 - ph);
    ctx.beginPath(); ctx.arc(x, y, 1.8 + 4 * (1 - ph), 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ---------- 灯塔 ----------
  const LX = 300;  ctx.save();
  // 塔身（上窄下宽，带白边）
  ctx.fillStyle = BOARD;
  ctx.beginPath();
  ctx.moveTo(LX - 78, 880); ctx.lineTo(LX - 52, 380);
  ctx.lineTo(LX + 52, 380); ctx.lineTo(LX + 78, 880);
  ctx.closePath(); ctx.fill();
  // 白描塔身两侧 + 横带
  wake(0.8);
  scratch(LX - 78, 878, LX - 52, 382, 2.6, 0.5, 3);
  scratch(LX + 78, 878, LX + 52, 382, 2.6, 0.5, 3);
  for (let k = 0; k < 6; k++) {
    const y = 430 + k * 96;
    const half = 48 + k * 4.6;
    ctx.strokeStyle = 'rgba(239,238,232,0.36)';
    ctx.beginPath(); ctx.moveTo(LX - half, y); ctx.lineTo(LX + half, y); ctx.stroke();
  }
  // 塔身竖刻（砖石缝）
  ctx.strokeStyle = 'rgba(239,238,232,0.16)';
  for (let k = -3; k <= 3; k++) {
    ctx.beginPath(); ctx.moveTo(LX + k * 16, 400); ctx.lineTo(LX + k * 22, 876); ctx.stroke();
  }
  // 灯室
  ctx.fillStyle = BOARD;
  ctx.fillRect(LX - 62, 330, 124, 56);
  ctx.strokeStyle = 'rgba(239,238,232,0.7)'; ctx.lineWidth = 2;
  ctx.strokeRect(LX - 62, 330, 124, 56);
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(LX + k * 24, 332); ctx.lineTo(LX + k * 24, 386); ctx.stroke(); }
  // 穹顶 + 风向球
  ctx.beginPath();
  ctx.moveTo(LX - 66, 330); ctx.quadraticCurveTo(LX, 268, LX + 66, 330); ctx.lineTo(LX + 66, 336); ctx.lineTo(LX - 66, 336);
  ctx.closePath(); ctx.fillStyle = BOARD; ctx.fill();
  ctx.strokeStyle = 'rgba(239,238,232,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(LX - 64, 334); ctx.quadraticCurveTo(LX, 272, LX + 64, 334); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(LX, 268); ctx.lineTo(LX, 240); ctx.stroke();
  ctx.beginPath(); ctx.arc(LX, 234, 8, 0, TAU); ctx.stroke();
  ctx.restore();

  // ---------- 前景的礁石（压在塔脚前，塔就长在石头上） ----------
  ctx.fillStyle = BOARD;
  ctx.beginPath();
  ctx.moveTo(-40, H + 40);
  ctx.lineTo(-40, 902);
  ctx.lineTo(150, 858); ctx.lineTo(330, 836); ctx.lineTo(470, 862);
  ctx.lineTo(600, 910); ctx.lineTo(700, H + 40);
  ctx.closePath(); ctx.fill();
  // 石头的刀口：上面亮，下面暗
  for (let i = 0; i < 26; i++) {
    const x = -20 + i * 27;
    const y = 900 + Math.sin(i * 0.42) * 14 - (i < 14 ? 22 : 0);
    ctx.strokeStyle = `rgba(${CHALK},${0.14 + (i % 3) * 0.1})`;
    scratch(x, y, x + 30, y - 12 - (i % 4) * 8, 1.4, 0.5, 2.4);
  }
  // 石顶一道亮边
  ctx.strokeStyle = 'rgba(239,238,232,0.5)';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-40, 902); ctx.lineTo(150, 858); ctx.lineTo(330, 836); ctx.lineTo(470, 862); ctx.lineTo(600, 910);
  ctx.stroke();
  const ang = t * 0.62;
  [-1, 1].forEach((dir) => {
    const a = dir * 0.42 + Math.sin(ang + (dir > 0 ? Math.PI : 0)) * 0.5;
    const len = 1500;
    const spread = 0.055;
    ctx.save();
    ctx.globalAlpha = 0.9;
    for (let i = 0; i < 22; i++) {
      const off = (i / 21 - 0.5) * spread * 2;
      const a2 = a + off;
      const x0 = LX, y0 = 358;
      const x1 = x0 + Math.cos(a2) * len;
      const y1 = y0 + Math.sin(a2 * 0.55) * 260 + Math.sin(a2) * len * 0.22;
      const fade = 1 - Math.abs(off) / (spread * 1.15);
      ctx.strokeStyle = `rgba(${CHALK},${0.30 * fade * (0.7 + 0.3 * Math.sin(t * 3 + i))})`;
      ctx.lineWidth = 3 + fade * 5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.18, x1, y1);
      ctx.stroke();
    }
    ctx.restore();
    // 灯芯的一团亮
    const g = ctx.createRadialGradient(LX, 358, 4, LX, 358, 120);
    g.addColorStop(0, 'rgba(255,252,236,0.95)');
    g.addColorStop(0.4, 'rgba(255,250,226,0.35)');
    g.addColorStop(1, 'rgba(255,250,226,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(LX, 358, 120, 0, TAU); ctx.fill();
  });

  // ---------- 雨：斜着往下砸的白丝 ----------
  ctx.save();
  for (let i = 0; i < 120; i++) {
    const x = ((i * 137 + t * 40) % (W + 200)) - 100;
    const y = ((i * 211 + t * 620) % (H + 200)) - 100;
    const len = 34 + (i % 4) * 16;
    ctx.strokeStyle = `rgba(${CHALK},${0.1 + (i % 4) * 0.05})`;
    ctx.lineWidth = 1.2;
    scratch(x, y, x - 14, y + len, 1.2, 0.6, 0.8);
  }
  ctx.restore();

  // 四角压暗 + 板边
   const vg = ctx.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 1160);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  // 板边的一道细白（像刮板的边界）
  ctx.strokeStyle = 'rgba(239,238,232,0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, W - 56, H - 56);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
