// jimu · 积木玩具
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（iso 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "jimu",
  "seed": "av:jimu",
  "family": "iso",
  "w": 1920,
  "h": 1080,
  "bg": "#eae4d6",
  "ink": "#2a241c",
  "accent": "#e2574c",
  "boxes": [
    {
      "x": -3.3,
      "y": -2.7,
      "w": 1.4,
      "d": 1.6,
      "h": 1.87,
      "color": "#e8d9c3"
    },
    {
      "x": -1.1,
      "y": -1.1,
      "w": 2.3,
      "d": 2.1,
      "h": 2.53,
      "color": "#e2574c"
    },
    {
      "x": 1.2,
      "y": -2.8,
      "w": 1.6,
      "d": 1.2,
      "h": 0.74,
      "color": "#e8d9c3"
    },
    {
      "x": -2.9,
      "y": 1.5,
      "w": 1.3,
      "d": 1.0,
      "h": 1.45,
      "color": "#cfd6e0"
    },
    {
      "x": 2.7,
      "y": -0.2,
      "w": 1.7,
      "d": 1.5,
      "h": 1.25,
      "color": "#2a241c"
    },
    {
      "x": 1.3,
      "y": 1.3,
      "w": 1.7,
      "d": 1.4,
      "h": 0.9,
      "color": "#cfd6e0"
    }
  ],
  "cx": 0.54,
  "cy": 0.56,
  "fitPad": 0.08,
  "blurTop": false,
  "label": {
    "zh": "积木玩具",
    "en": "Brick Toy",
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
