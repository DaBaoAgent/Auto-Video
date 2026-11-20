// recheng · 热成像
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（field 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "recheng",
  "seed": "av:recheng",
  "family": "field",
  "w": 1920,
  "h": 1080,
  "bg": "#050608",
  "ink": "#ffffff",
  "accent": "#ff5b2e",
  "blobs": [
    {
      "x": 851.3,
      "y": 257.4,
      "r": 358.5,
      "a": 0.8
    },
    {
      "x": 718.6,
      "y": 753.3,
      "r": 348.3,
      "a": 1.1
    },
    {
      "x": 1354.5,
      "y": 552.5,
      "r": 174.4,
      "a": 0.7
    },
    {
      "x": 880.8,
      "y": 695.2,
      "r": 289.7,
      "a": 1.04
    }
  ],
  "ramp": [
    [
      0,
      "#05060a"
    ],
    [
      0.3,
      "#3a0d5a"
    ],
    [
      0.6,
      "#ff2d55"
    ],
    [
      0.85,
      "#ffb84d"
    ],
    [
      1,
      "#fff6d6"
    ]
  ],
  "iso": true,
  "step": 10,
  "wave": 5,
  "readout": "S/N 0.92",
  "label": {
    "zh": "热成像",
    "en": "Thermal Camera",
    "station": "08 · 地图地理",
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
