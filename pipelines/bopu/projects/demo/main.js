// bopu · 波普艺术
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（flat 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "bopu",
  "seed": "av:bopu",
  "family": "flat",
  "w": 1920,
  "h": 1080,
  "bg": "#ffd84d",
  "ink": "#111111",
  "accent": "#e2372c",
  "bgForms": [
    {
      "kind": "arc",
      "x": 1073.0,
      "y": 390.7,
      "w": 643.2,
      "h": 305.8,
      "color": "#f4f2ed",
      "alpha": 0.6
    },
    {
      "kind": "rect",
      "x": -91.2,
      "y": 409.4,
      "w": 908.9,
      "h": 280.3,
      "color": "#f4f2ed",
      "alpha": 0.9
    },
    {
      "kind": "arc",
      "x": 516.5,
      "y": 479.5,
      "w": 702.6,
      "h": 417.4,
      "color": "#111111",
      "alpha": 0.94
    },
    {
      "kind": "tri",
      "x": 707.8,
      "y": -21.8,
      "w": 520.1,
      "h": 265.8,
      "color": "#e2372c",
      "alpha": 0.7
    }
  ],
  "bars": [
    {
      "x": 214.0,
      "y": 587.5,
      "w": 346.3,
      "h": 10,
      "color": "#e2372c"
    }
  ],
  "dots": false,
  "lines": [
    {
      "text": "波普艺术",
      "size": 142.4,
      "x": 188.8,
      "y": 437.4,
      "color": "#111111",
      "weight": 800,
      "letter": 2
    },
    {
      "text": "Pop Art",
      "size": 52.1,
      "x": 124.2,
      "y": 570.0,
      "color": "#111111",
      "weight": 500,
      "letter": 6
    }
  ],
  "label": {
    "zh": "波普艺术",
    "en": "Pop Art",
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
