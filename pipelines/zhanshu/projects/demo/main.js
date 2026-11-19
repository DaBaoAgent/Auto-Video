// zhanshu · 体育战术板
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（plan 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "zhanshu",
  "seed": "av:zhanshu",
  "family": "plan",
  "w": 1920,
  "h": 1080,
  "bg": "#0c2033",
  "ink": "#d6e9ff",
  "accent": "#ffb36b",
  "grid": "#8fb6d8",
  "parts": [
    {
      "kind": "rect",
      "x": 134.4,
      "y": 118.8,
      "w": 883.2,
      "h": 604.8,
      "lw": 2.4,
      "fill": false
    },
    {
      "kind": "rect",
      "x": 280.8,
      "y": 590.5,
      "w": 590.3,
      "h": 84.7,
      "fill": true,
      "lw": 2
    },
    {
      "kind": "rect",
      "x": 466.9,
      "y": 349.7,
      "w": 218.2,
      "h": 240.8,
      "fill": false,
      "lw": 2.6
    },
    {
      "kind": "circle",
      "x": 494.4,
      "y": 162.0,
      "w": 163.2,
      "h": 163.2,
      "fill": false,
      "lw": 2
    },
    {
      "kind": "circle",
      "x": 1190.4,
      "y": 108.0,
      "w": 217.6,
      "h": 217.6,
      "fill": false,
      "lw": 2
    },
    {
      "kind": "gear",
      "x": 1299.2,
      "y": 216.8,
      "r": 50.1
    },
    {
      "kind": "trace",
      "pts": [
        [
          1168.6,
          242.9
        ],
        [
          1099.0,
          308.2
        ],
        [
          929.3,
          458.1
        ]
      ],
      "color": "#ffb36b",
      "lw": 1.8
    },
    {
      "kind": "rect",
      "x": 1190.4,
      "y": 540.0,
      "w": 576.0,
      "h": 91.8,
      "lw": 1.2,
      "fill": true
    },
    {
      "kind": "rect",
      "x": 1190.4,
      "y": 631.8,
      "w": 576.0,
      "h": 91.8,
      "lw": 1.2,
      "fill": false
    },
    {
      "kind": "rect",
      "x": 1190.4,
      "y": 723.6,
      "w": 576.0,
      "h": 91.8,
      "lw": 1.2,
      "fill": false
    },
    {
      "kind": "label",
      "x": 1204.4,
      "y": 599.4,
      "text": "SCALE 1:12",
      "size": 20,
      "color": "#d6e9ff"
    },
    {
      "kind": "label",
      "x": 1204.4,
      "y": 691.2,
      "text": "B-02",
      "size": 20,
      "color": "#d6e9ff"
    },
    {
      "kind": "label",
      "x": 1204.4,
      "y": 783.0,
      "text": "REF 11",
      "size": 20,
      "color": "#d6e9ff"
    },
    {
      "kind": "dim",
      "x": 134.4,
      "y": 799.2,
      "w": 883.2,
      "h": 0,
      "text": "305 mm"
    },
    {
      "kind": "label",
      "x": 134.4,
      "y": 1026.0,
      "text": "PLAN 01",
      "size": 22
    }
  ],
  "gridGap": 90,
  "sheet": "AV·DWG 01",
  "paperMode": false,
  "scan": false,
  "label": {
    "zh": "体育战术板",
    "en": "Sports Telestrator",
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
