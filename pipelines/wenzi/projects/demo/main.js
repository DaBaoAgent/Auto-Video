// wenzi · 文字闪切（动态字体：大字一个个被切进来，字距自己会呼吸）
// 句子《慢一点，反而更快》：四段字先后落位，最后合成整句；品红只用来画下划线。
const canvas = document.getElementById('c');
const W = 1920, H = 1080;
const ENV = STYLEKIT.page(canvas, { w: W, h: H, seed: 'av:wenzi:v4' });
const { ctx } = ENV;
const S = STYLEKIT;
const TAU = Math.PI * 2;

const BG = '#0e0e11';
const FG = '#f5f2ea';
const PINK = '#ff3b6b';
const SANS = '"Source Han Sans SC","Noto Sans SC","Microsoft YaHei",sans-serif';

// 用竖直条遮罩把字「擦」出来：prog 0→1
function wipeText(txt, x, y, size, prog, dir, col) {
  ctx.save();
  ctx.fillStyle = col || FG;
  ctx.font = `800 ${size}px ${SANS}`;
  const w = ctx.measureText(txt).width;
  const reveal = S.ease(prog);
  if (dir > 0) {
    ctx.beginPath();
    ctx.rect(x - 40, y - size * 1.1, (w + 80) * reveal, size * 1.9);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x + w + 40 - (w + 80) * reveal, y - size * 1.1, (w + 80) * reveal, size * 1.9);
    ctx.clip();
  }
  ctx.fillText(txt, x, y);
  ctx.restore();
  return w;
}

window.renderAt = (t) => {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ---------- 底纹：细横线（字幕机的基线） ----------
  ctx.strokeStyle = 'rgba(245,242,234,0.10)';
  ctx.lineWidth = 1;
  [300, 500, 700, 900].forEach((y) => {
    ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(W - 120, y); ctx.stroke();
  });
  // 左侧一道品红的竖规
  ctx.fillStyle = PINK;
  ctx.fillRect(120, 120, 10, 840);

  // ---------- 小标题 ----------
  ctx.fillStyle = 'rgba(245,242,234,0.62)';
  ctx.font = `500 24px ${SANS}`;
  ctx.fillText('KINETIC  TYPE  /  SCENE  01', 170, 168);
  ctx.fillStyle = PINK;
  ctx.fillText('★', 170, 208);

  // ---------- 第一段：慢 ----------
  const p1 = S.clamp((t - 0.15) / 0.9, 0, 1);
  const p2 = S.clamp((t - 1.95) / 0.9, 0, 1);
  const p3 = S.clamp((t - 3.9) / 0.9, 0, 1);
  const p4 = S.clamp((t - 5.85) / 0.9, 0, 1);
  const pAll = S.clamp((t - 7.6) / 1.2, 0, 1);

  if (t < 7.6) {
    // 单字大字（每段换位置、换方向）
    const big = 260;
    if (t < 1.95) {
      wipeText('慢', 300, 700, big * 1.15, p1, 1);
      ctx.fillStyle = 'rgba(245,242,234,0.5)';
      ctx.font = `500 26px ${SANS}`;
      ctx.fillText('SLOW', 308, 780);
    } else if (t < 3.9) {
      wipeText('快', 1180, 640, big * 1.15, p2, -1);
      ctx.fillStyle = 'rgba(245,242,234,0.5)';
      ctx.font = `500 26px ${SANS}`;
      ctx.fillText('FAST', 1188, 720);
    } else if (t < 5.85) {
      // 「一点」两个字，错位落
      const w1 = wipeText('一', 420, 660, big * 0.8, p3, 1);
      wipeText('点', 420 + w1 + 40, 720, big * 0.8, S.clamp((p3 - 0.25) / 0.75, 0, 1), -1);
    } else {
      const w1 = wipeText('反', 380, 640, big * 0.8, p4, 1);
      const w2 = wipeText('而', 380 + w1 + 40, 700, big * 0.8, S.clamp((p4 - 0.16) / 0.84, 0, 1), -1);
      wipeText('更', 380 + w1 + w2 + 80, 760, big * 0.8, S.clamp((p4 - 0.3) / 0.7, 0, 1), 1, PINK);
      wipeText('快', 380 + w1 + w2 + 80 + 300, 700, big * 0.8, S.clamp((p4 - 0.44) / 0.56, 0, 1), -1);
    }
  } else {
    // ---------- 合成整句 ----------
    const e = S.ease(pAll);
    const size = 150 + (1 - e) * 40;
    ctx.globalAlpha = 0.15 * (1 - e);
    ctx.fillStyle = FG;
    ctx.font = `800 ${size}px ${SANS}`;
    ctx.fillText('慢一点，反而更快', 250, 650);
    ctx.globalAlpha = 1;
    const w = wipeText('慢一点，反而更快', 250, 650, size, pAll, 1);
    // 下划线（品红，从左扫到右）
    const uw = ctx.measureText('慢一点，反而更快').width;
    ctx.fillStyle = PINK;
    ctx.fillRect(252, 700, uw * S.clamp((t - 8.4) / 1.4, 0, 1), 10);
    ctx.fillStyle = 'rgba(245,242,234,0.6)';
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText('SLOW  IS  FASTER', 254, 770);
  }

  // ---------- 右上角：走时的计数 ----------
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(245,242,234,0.45)';
  ctx.font = `500 26px ${SANS}`;
  ctx.fillText(String(t.toFixed(2)).padStart(5, '0'), W - 130, 168);
  ctx.textAlign = 'left';

  // 右下角：闪切的小方块（每 0.4 秒换位置）
  {
    const k = Math.floor(t * 2.5) % 5;
    ctx.fillStyle = k % 2 ? PINK : 'rgba(245,242,234,0.5)';
    ctx.fillRect(W - 200, 860 + k * 8, 60, 8);
  }

  // ---------- 闪白：换段时来一下 ----------
  const flashes = [1.95, 3.9, 5.85, 7.6];
  let fl = 0;
  flashes.forEach((ft) => {
    const d = t - ft;
    if (d > 0 && d < 0.12) fl = Math.max(fl, 0.16 * (1 - d / 0.12));
  });
  if (fl > 0) {
    ctx.fillStyle = `rgba(245,242,234,${fl})`;
    ctx.fillRect(0, 0, W, H);
  }

  // 细颗粒（避免纯平）
  ctx.fillStyle = 'rgba(245,242,234,0.04)';
  for (let i = 0; i < 700; i++) ctx.fillRect((i * 2731) % W, (i * 1913) % H, 2, 2);
};

window.renderAt(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
