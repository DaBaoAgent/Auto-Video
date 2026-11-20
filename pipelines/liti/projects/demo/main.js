// liti · 纸片立体书
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（iso 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "liti",
  "seed": "av:liti",
  "family": "iso",
  "w": 1920,
  "h": 1080,
  "bg": "#f4eedf",
  "ink": "#332b22",
  "accent": "#c0562f",
  "boxes": [
    {
      "x": -4.4,
      "y": -0.1,
      "w": 1.5,
      "d": 1.6,
      "h": 0.93,
      "color": "#c0562f"
    },
    {
      "x": -1.1,
      "y": -1.1,
      "w": 2.2,
      "d": 2.2,
      "h": 3.73,
      "color": "#332b22"
    },
    {
      "x": -3.3,
      "y": 1.3,
      "w": 1.5,
      "d": 1.5,
      "h": 1.58,
      "color": "#9fb4c7"
    },
    {
      "x": 1.2,
      "y": 0.9,
      "w": 1.3,
      "d": 1.1,
      "h": 1.35,
      "color": "#c0562f"
    },
    {
      "x": 2.4,
      "y": -0.2,
      "w": 1.0,
      "d": 1.4,
      "h": 1.59,
      "color": "#c0562f"
    }
  ],
  "cx": 0.55,
  "cy": 0.58,
  "fitPad": 0.08,
  "blurTop": false,
  "label": {
    "zh": "纸片立体书",
    "en": "Paper Pop-up Book",
    "station": "07 · 三维推演",
    "ink": "#141414",
    "sub": "#4a4a46"
  }
};

const canvas = document.getElementById('c');
const ENV = STYLEKIT.page(canvas, { w: SPEC.w, h: SPEC.h, seed: SPEC.seed });

// 左下角的版式牌：哪条管线、哪个工位
function plate(t) {
  const L = SPEC.label;
  const k = STYLEKIT.ease(STYLEKIT.clamp((t - 0.15) / 0.8));
  if (k <= 0) return;
  const ctx = ENV.ctx, W = ENV.W, H = ENV.H;
  const m = Math.round(Math.min(W, H) * 0.035);
  ctx.save();
  ctx.globalAlpha = 0.92 * k;
  // 一块极淡的衬底，保证字在任何画面上都读得出
  const panelW = Math.round(Math.min(W, H) * 0.40);
  const panelH = Math.round(Math.min(W, H) * 0.145);
  ctx.fillStyle = SPEC.label.ink === '#ffffff' ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.55)';
  ctx.fillRect(m - 14, H - m - panelH, panelW, panelH);
  ctx.strokeStyle = SPEC.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(m - 14, H - m - panelH);
  ctx.lineTo(m - 14 + panelW * k, H - m - panelH);
  ctx.stroke();

  // 三行分开：工位 → 中文名 → 英文名，避免长名字和工位号撞车
  STYLEKIT.type(ENV, L.station, { x: m, y: H - m - panelH + Math.round(panelH * 0.22),
                                 size: Math.round(Math.min(W, H) * 0.016), color: L.sub, weight: 500, letter: 2 });
  STYLEKIT.type(ENV, L.zh, { x: m, y: H - m - panelH + Math.round(panelH * 0.66),
                             size: Math.round(Math.min(W, H) * 0.044), color: L.ink, weight: 800 });
  STYLEKIT.type(ENV, L.en, { x: m, y: H - m - panelH + Math.round(panelH * 0.92),
                            size: Math.round(Math.min(W, H) * 0.016), color: L.sub, weight: 500, letter: 2 });
  ctx.restore();
}

window.renderAt = (t) => {
  STYLEKIT.scene(ENV, SPEC, t);
  plate(t);
};

// 先画第 0 秒，等字体就绪再宣布 ready
STYLEKIT.scene(ENV, SPEC, 0);
plate(0);
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  window.renderAt(0);
  window.__ready = true;
});
