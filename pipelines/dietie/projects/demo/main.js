// dietie · 地铁线路图
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（map 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "dietie",
  "seed": "av:dietie",
  "family": "map",
  "w": 1920,
  "h": 1080,
  "bg": "#12141a",
  "ink": "#eef1f5",
  "accent": "#ff8a5c",
  "blobs": [
    {
      "x": 664.4,
      "y": 474.6,
      "r": 296.6,
      "color": "#ff8a5c"
    },
    {
      "x": 311.6,
      "y": 227.4,
      "r": 164.2,
      "color": "#ff8a5c"
    },
    {
      "x": 1278.3,
      "y": 275.2,
      "r": 359.7,
      "color": "#31c8b6"
    }
  ],
  "routes": [
    {
      "pts": [
        [
          379.6,
          383.1
        ],
        [
          313.7,
          359.0
        ],
        [
          351.6,
          492.6
        ],
        [
          381.3,
          471.9
        ]
      ],
      "color": "#ffd166",
      "width": 4
    },
    {
      "pts": [
        [
          218.1,
          299.6
        ],
        [
          156.7,
          367.5
        ],
        [
          431.7,
          382.0
        ],
        [
          666.2,
          361.0
        ]
      ],
      "color": "#ffd166",
      "width": 5
    }
  ],
  "contours": {
    "x": 664.4,
    "y": 474.6,
    "r0": 128.4,
    "step": 42,
    "rings": 4,
    "wave": 3
  },
  "points": {
    "n": 420,
    "color": "#eef1f5",
    "size": 3
  },
  "graticule": true,
  "vignette": 0.28,
  "label": {
    "zh": "地铁线路图",
    "en": "Transit Map",
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
