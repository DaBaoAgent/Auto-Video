// shiwu · 数据实物化
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（map 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "shiwu",
  "seed": "av:shiwu",
  "family": "map",
  "w": 1920,
  "h": 1080,
  "bg": "#0d1216",
  "ink": "#e2e6e8",
  "accent": "#d98b4a",
  "blobs": [
    {
      "x": 1464.5,
      "y": 796.6,
      "r": 162.0,
      "color": "#31c8b6"
    },
    {
      "x": 501.5,
      "y": 464.1,
      "r": 171.6,
      "color": "#d98b4a"
    },
    {
      "x": 433.8,
      "y": 308.3,
      "r": 145.2,
      "color": "#31c8b6"
    }
  ],
  "routes": [
    {
      "pts": [
        [
          449.6,
          359.0
        ],
        [
          626.3,
          505.2
        ],
        [
          922.5,
          573.7
        ],
        [
          885.7,
          505.4
        ]
      ],
      "color": "#ffd166",
      "width": 4
    },
    {
      "pts": [
        [
          469.9,
          519.6
        ],
        [
          522.7,
          427.4
        ],
        [
          803.1,
          487.3
        ],
        [
          749.5,
          583.7
        ]
      ],
      "color": "#ffd166",
      "width": 3
    }
  ],
  "contours": null,
  "points": {
    "n": 300,
    "color": "#e2e6e8",
    "size": 2
  },
  "graticule": false,
  "vignette": 0.28,
  "label": {
    "zh": "数据实物化",
    "en": "Data Physicalization",
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
