// fugu · 复古版画拼贴（旧纸、双色油墨、粗衬线、细花边框，一张 1930 年代的航空海报）
// 场景《越洋航空邮件》：螺旋桨飞机沿虚线航线飞过云海，太阳的光芒在背后慢慢转。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:fugu:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const PAPER = '#e9dcc0';
const INK = '#2c2620';
const RED = '#b6402c';
const TEAL = '#3f7b74';

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  // ---------- 旧纸 ----------
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  // 泛黄斑（旧纸上那种一块块的深色）
  const spots = [[320, 260, 210], [980, 760, 260], [1520, 400, 190], [640, 900, 220], [1180, 180, 160]];
  spots.forEach(([x, y, r], i) => {
    const g = ctx.createRadialGradient(x, y, 10, x, y, r);
    g.addColorStop(0, 'rgba(150,116,66,0.16)');
    g.addColorStop(1, 'rgba(150,116,66,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  });
  // 纸的纤维和脏点
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(120,94,58,${0.05 + (i % 5) * 0.02})`;
    ctx.fillRect((i * 2731) % W, (i * 1871) % H, 2 + (i % 3), 2);
  }
  // 折痕（两道竖、一道横）
  ctx.strokeStyle = 'rgba(150,120,80,0.16)';
  ctx.lineWidth = 3;
  [640, 1290].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 8, H); ctx.stroke(); });
  ctx.beginPath(); ctx.moveTo(0, 560); ctx.lineTo(W, 552); ctx.stroke();

  // ---------- 花边框 ----------
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;
  ctx.strokeRect(56, 56, W - 112, H - 112);
  ctx.lineWidth = 2.4;
  ctx.strokeRect(78, 78, W - 156, H - 156);
  // 四角的小方块纹
  [[56, 56], [W - 96, 56], [56, H - 96], [W - 96, H - 96]].forEach(([x, y]) => {
    ctx.fillStyle = INK;
    ctx.fillRect(x, y, 40, 40);
    ctx.fillStyle = PAPER;
    ctx.fillRect(x + 12, y + 12, 16, 16);
  });

  // 画面里的东西都压在边框以内
  ctx.save();
  ctx.beginPath();
  ctx.rect(80, 80, W - 160, H - 160);
  ctx.clip();

  const CX = 940, CY = 470;

  // ---------- 太阳光芒（慢慢转） ----------
  ctx.save();
  ctx.translate(CX, CY + 10);
  ctx.rotate(t * 0.03);
  ctx.fillStyle = 'rgba(182,64,44,0.5)';
  for (let k = 0; k < 20; k++) {
    const a = k / 20 * TAU;
    const h = 0.055;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - h) * 1200, Math.sin(a - h) * 1200);
    ctx.lineTo(Math.cos(a + h) * 1200, Math.sin(a + h) * 1200);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // 太阳盘
  ctx.fillStyle = RED;
  ctx.beginPath(); ctx.arc(CX, CY + 10, 200, 0, TAU); ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.globalAlpha = 0.12;
  ctx.beginPath(); ctx.arc(CX - 40, CY - 20, 150, 0, TAU); ctx.fill();
  ctx.globalAlpha = 1;

  // ---------- 云海：横向条带 ----------
  for (let row = 0; row < 5; row++) {
    const y = 740 + row * 52;
    const drift = Math.sin(t * 0.35 + row) * 14;
    ctx.fillStyle = row % 2 ? 'rgba(63,123,116,0.5)' : 'rgba(63,123,116,0.32)';
    ctx.beginPath();
    ctx.moveTo(100, y + 26);
    for (let x = 100; x <= W - 100; x += 40) {
      ctx.quadraticCurveTo(x + 20 + drift, y - 22, x + 40, y + 6);
    }
    ctx.lineTo(W - 100, y + 40); ctx.lineTo(100, y + 40);
    ctx.closePath(); ctx.fill();
  }

  // ---------- 航线虚线 ----------
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 18]);
  ctx.lineDashOffset = -t * 26;
  ctx.beginPath();
  ctx.moveTo(180, 860);
  ctx.quadraticCurveTo(760, 690, 1200, 560);
  ctx.quadraticCurveTo(1520, 470, 1740, 380);
  ctx.stroke();
  ctx.setLineDash([]);

  // ---------- 飞机（沿航线飞） ----------
  {
    const p = S.ease(S.clamp(t / 10, 0, 1)) * 0.86 + 0.02;
    const x = S.lerp(180, 1740, Math.pow(p, 0.9));
    const y = 860 - Math.pow(p, 0.85) * 470 - Math.sin(p * 3) * 26;
    const ang = -0.36 + Math.sin(t * 0.7) * 0.02;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    // 机身
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.moveTo(-118, -6); ctx.quadraticCurveTo(-60, -34, 70, -26);
    ctx.quadraticCurveTo(122, -22, 134, 0);
    ctx.quadraticCurveTo(70, 28, -118, 12);
    ctx.closePath(); ctx.fill();
    // 翼
    ctx.beginPath();
    ctx.moveTo(-16, -18); ctx.lineTo(60, -78); ctx.lineTo(84, -70); ctx.lineTo(24, -14);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-16, 8); ctx.lineTo(46, 62); ctx.lineTo(66, 56); ctx.lineTo(20, 8);
    ctx.closePath(); ctx.fill();
    // 尾翼
    ctx.beginPath();
    ctx.moveTo(-118, -6); ctx.lineTo(-166, -44); ctx.lineTo(-140, -44); ctx.lineTo(-96, -8);
    ctx.closePath(); ctx.fill();
    // 螺旋桨
    ctx.save();
    ctx.translate(134, 0);
    ctx.rotate(t * 24);
    ctx.fillStyle = 'rgba(44,38,32,0.55)';
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 44, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = RED;
    ctx.beginPath(); ctx.arc(120, -4, 9, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------- 字 ----------
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = '700 96px Georgia,"Times New Roman","Source Han Serif SC",serif';
  ctx.fillText('越 洋 航 空 邮 件', CX, 234);
  ctx.font = '600 30px Georgia,"Times New Roman",serif';
  ctx.fillStyle = RED;
  ctx.fillText('AIR  MAIL  ·  TRANS-PACIFIC  ·  1936', CX, 282);
  // 下角的小标注
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(44,38,32,0.75)';
  ctx.font = '500 22px Georgia,"Times New Roman",serif';
  ctx.fillText('SAN FRANCISCO  →  HONOLULU', 120, 986);
  ctx.textAlign = 'right';
  ctx.fillText('No. 07', W - 120, 986);
  ctx.textAlign = 'left';

  ctx.restore();

  // 印刷的轻重不均：整体压一层薄网点
  ctx.fillStyle = 'rgba(44,38,32,0.05)';
  for (let i = 0; i < 620; i++) ctx.fillRect((i * 2411) % W, (i * 1657) % H, 2, 2);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
