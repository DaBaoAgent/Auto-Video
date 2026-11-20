// guaban · 刮版画长镜头
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（hatch 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "guaban",
  "seed": "av:guaban",
  "family": "hatch",
  "w": 1920,
  "h": 1080,
  "bg": "#f2e6cd",
  "ink": "#3a2413",
  "accent": "#b06a22",
  "inks": [
    "#3a2413",
    "#b06a22"
  ],
  "hatchColor": "#f2e6cd",
  "forms": [
    {
      "kind": "arc",
      "x": -68.3,
      "y": 507.0,
      "w": 766.6,
      "h": 176.1,
      "angle": 30,
      "tone": 0.63
    },
    {
      "kind": "arc",
      "x": 355.0,
      "y": 470.6,
      "w": 823.8,
      "h": 212.4,
      "angle": 40,
      "tone": 0.71
    },
    {
      "kind": "rect",
      "x": 547.3,
      "y": 473.0,
      "w": 378.7,
      "h": 210.0,
      "angle": 20,
      "tone": 0.3
    },
    {
      "kind": "tri",
      "x": 509.4,
      "y": 343.4,
      "w": 454.4,
      "h": 129.6,
      "angle": 20,
      "tone": 0.85
    },
    {
      "kind": "arc",
      "x": -40,
      "y": 704.6,
      "w": 2000,
      "h": 367.2,
      "angle": 8,
      "tone": 0.3
    },
    {
      "kind": "arc",
      "x": -40,
      "y": 785.6,
      "w": 2000,
      "h": 475.2,
      "angle": -12,
      "tone": 0.46
    },
    {
      "kind": "arc",
      "x": -40,
      "y": 866.6,
      "w": 2000,
      "h": 583.2,
      "angle": 8,
      "tone": 0.62
    }
  ],
  "angle": 40,
  "density": 12,
  "lineWidth": 3.0,
  "cross": false,
  "label": {
    "zh": "刮版画长镜头",
    "en": "Scratchboard Long Take",
    "station": "05 · 平面图形",
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
