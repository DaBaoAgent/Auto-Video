// shuju · 数据叙事
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（map 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "shuju",
  "seed": "av:shuju",
  "family": "map",
  "w": 1920,
  "h": 1080,
  "bg": "#0a0d14",
  "ink": "#e6ecf5",
  "accent": "#ffb84d",
  "blobs": [
    {
      "x": 958.5,
      "y": 419.6,
      "r": 336.0,
      "color": "#8a7bff"
    },
    {
      "x": 618.6,
      "y": 599.5,
      "r": 143.7,
      "color": "#ffb84d"
    },
    {
      "x": 1533.2,
      "y": 661.7,
      "r": 335.2,
      "color": "#8a7bff"
    }
  ],
  "routes": [
    {
      "pts": [
        [
          387.7,
          243.6
        ],
        [
          634.0,
          115.4
        ],
        [
          818.8,
          131.4
        ],
        [
          1080.6,
          60
        ]
      ],
      "color": "#7ef0ff",
      "width": 3
    },
    {
      "pts": [
        [
          154.9,
          428.6
        ],
        [
          210.7,
          391.1
        ],
        [
          157.9,
          419.9
        ],
        [
          112.5,
          497.2
        ]
      ],
      "color": "#7ef0ff",
      "width": 3
    }
  ],
  "contours": {
    "x": 958.5,
    "y": 419.6,
    "r0": 171.7,
    "step": 50,
    "rings": 5,
    "wave": 2
  },
  "points": {
    "n": 300,
    "color": "#e6ecf5",
    "size": 3
  },
  "graticule": true,
  "vignette": 0.28,
  "label": {
    "zh": "数据叙事",
    "en": "Data Storytelling",
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
