// weixing · 卫星简报
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（map 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "weixing",
  "seed": "av:weixing",
  "family": "map",
  "w": 1920,
  "h": 1080,
  "bg": "#061019",
  "ink": "#dceeff",
  "accent": "#31c8b6",
  "blobs": [
    {
      "x": 1434.5,
      "y": 762.3,
      "r": 202.3,
      "color": "#31c8b6"
    },
    {
      "x": 908.4,
      "y": 516.1,
      "r": 347.7,
      "color": "#31c8b6"
    },
    {
      "x": 661.9,
      "y": 350.4,
      "r": 281.3,
      "color": "#31c8b6"
    },
    {
      "x": 1073.5,
      "y": 850.1,
      "r": 330.4,
      "color": "#31c8b6"
    }
  ],
  "routes": [
    {
      "pts": [
        [
          295.1,
          785.5
        ],
        [
          494.0,
          744.1
        ],
        [
          742.2,
          741.2
        ],
        [
          702.8,
          820.7
        ]
      ],
      "color": "#7ef0ff",
      "width": 3
    },
    {
      "pts": [
        [
          155.1,
          858.1
        ],
        [
          368.8,
          720.8
        ],
        [
          337.5,
          709.4
        ],
        [
          308.5,
          651.5
        ]
      ],
      "color": "#7ef0ff",
      "width": 4
    }
  ],
  "contours": null,
  "points": {
    "n": 420,
    "color": "#dceeff",
    "size": 2
  },
  "graticule": true,
  "vignette": 0.28,
  "label": {
    "zh": "卫星简报",
    "en": "Satellite Briefing",
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
