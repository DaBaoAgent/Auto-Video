// diaocha · 视觉调查
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（map 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "diaocha",
  "seed": "av:diaocha",
  "family": "map",
  "w": 1920,
  "h": 1080,
  "bg": "#120a0a",
  "ink": "#f3ddd0",
  "accent": "#d4382f",
  "blobs": [
    {
      "x": 1500.3,
      "y": 654.8,
      "r": 309.5,
      "color": "#8a7bff"
    },
    {
      "x": 520.7,
      "y": 459.0,
      "r": 335.3,
      "color": "#31c8b6"
    },
    {
      "x": 1499.1,
      "y": 441.6,
      "r": 351.6,
      "color": "#31c8b6"
    }
  ],
  "routes": [
    {
      "pts": [
        [
          216.7,
          461.9
        ],
        [
          421.1,
          465.2
        ],
        [
          676.6,
          342.6
        ],
        [
          749.2,
          436.8
        ]
      ],
      "color": "#d4382f",
      "width": 4
    },
    {
      "pts": [
        [
          492.7,
          487.4
        ],
        [
          674.5,
          401.6
        ],
        [
          775.6,
          411.6
        ],
        [
          1076.6,
          499.2
        ]
      ],
      "color": "#ffd166",
      "width": 4
    }
  ],
  "contours": {
    "x": 1500.3,
    "y": 654.8,
    "r0": 133.1,
    "step": 50,
    "rings": 6,
    "wave": 3
  },
  "points": {
    "n": 560,
    "color": "#f3ddd0",
    "size": 2
  },
  "graticule": false,
  "vignette": 0.28,
  "label": {
    "zh": "视觉调查",
    "en": "Visual Investigation",
    "station": "10 · 实拍混剪",
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
