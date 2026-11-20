// xianwei · 显微镜下
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（plan 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "xianwei",
  "seed": "av:xianwei",
  "family": "plan",
  "w": 1920,
  "h": 1080,
  "bg": "#101426",
  "ink": "#e6ecff",
  "accent": "#f2c14e",
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
      "x": 286.1,
      "y": 590.5,
      "w": 579.8,
      "h": 84.7,
      "fill": true,
      "lw": 2
    },
    {
      "kind": "rect",
      "x": 448.9,
      "y": 374.4,
      "w": 254.2,
      "h": 216.1,
      "fill": false,
      "lw": 2.6
    },
    {
      "kind": "circle",
      "x": 514.7,
      "y": 233.4,
      "w": 122.6,
      "h": 122.6,
      "fill": false,
      "lw": 2
    },
    {
      "kind": "circle",
      "x": 1190.4,
      "y": 108.0,
      "w": 236.0,
      "h": 236.0,
      "fill": false,
      "lw": 2
    },
    {
      "kind": "gear",
      "x": 1308.4,
      "y": 226.0,
      "r": 54.3
    },
    {
      "kind": "trace",
      "pts": [
        [
          1166.8,
          254.3
        ],
        [
          1091.3,
          325.1
        ],
        [
          929.3,
          471.7
        ]
      ],
      "color": "#f2c14e",
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
      "text": "MAT",
      "size": 20,
      "color": "#e6ecff"
    },
    {
      "kind": "label",
      "x": 1204.4,
      "y": 691.2,
      "text": "C-03",
      "size": 20,
      "color": "#e6ecff"
    },
    {
      "kind": "label",
      "x": 1204.4,
      "y": 783.0,
      "text": "REF 07",
      "size": 20,
      "color": "#e6ecff"
    },
    {
      "kind": "dim",
      "x": 134.4,
      "y": 799.2,
      "w": 883.2,
      "h": 0,
      "text": "244 mm"
    },
    {
      "kind": "label",
      "x": 134.4,
      "y": 1026.0,
      "text": "VIEW A-A",
      "size": 22
    }
  ],
  "gridGap": 90,
  "sheet": "AV·DWG 01",
  "paperMode": false,
  "scan": true,
  "label": {
    "zh": "显微镜下",
    "en": "Under the Microscope",
    "station": "09 · 图纸说明",
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
