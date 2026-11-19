// jiandie · 60s 间谍片头
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（flat 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "jiandie",
  "seed": "av:jiandie",
  "family": "flat",
  "w": 1920,
  "h": 1080,
  "bg": "#0d1014",
  "ink": "#e8e3d6",
  "accent": "#c8a35a",
  "bgForms": [
    {
      "kind": "arc",
      "x": 334.9,
      "y": 489.5,
      "w": 639.9,
      "h": 456.5,
      "color": "#111111",
      "alpha": 0.83
    },
    {
      "kind": "circle",
      "x": 273.3,
      "y": -32.5,
      "w": 634.3,
      "h": 299.1,
      "color": "#c8a35a",
      "alpha": 0.83
    },
    {
      "kind": "tri",
      "x": 131.7,
      "y": 645.6,
      "w": 505.2,
      "h": 143.8,
      "color": "#c8a35a",
      "alpha": 0.51
    },
    {
      "kind": "rect",
      "x": -22.4,
      "y": 299.0,
      "w": 537.0,
      "h": 476.9,
      "color": "#f4f2ed",
      "alpha": 0.91
    }
  ],
  "bars": [
    {
      "x": 98.3,
      "y": 563.9,
      "w": 382.3,
      "h": 10,
      "color": "#c8a35a"
    }
  ],
  "dots": false,
  "lines": [
    {
      "text": "60s 间谍片头",
      "size": 147.8,
      "x": 141.9,
      "y": 436.3,
      "color": "#e8e3d6",
      "weight": 800,
      "letter": 0
    },
    {
      "text": "60s Spy Title Sequence",
      "size": 41.9,
      "x": 190.4,
      "y": 612.4,
      "color": "#e8e3d6",
      "weight": 500,
      "letter": 6
    }
  ],
  "label": {
    "zh": "60s 间谍片头",
    "en": "60s Spy Title Sequence",
    "station": "05 · 平面图形",
    "ink": "#ffffff",
    "sub": "#ffffff"
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
