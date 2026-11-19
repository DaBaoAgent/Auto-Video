// wenzi · 文字闪切
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（flat 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "wenzi",
  "seed": "av:wenzi",
  "family": "flat",
  "w": 1920,
  "h": 1080,
  "bg": "#0d0d0f",
  "ink": "#f5f2ea",
  "accent": "#ff3b6b",
  "bgForms": [
    {
      "kind": "arc",
      "x": 329.3,
      "y": 295.5,
      "w": 352.5,
      "h": 327.5,
      "color": "#111111",
      "alpha": 0.65
    },
    {
      "kind": "rect",
      "x": 667.1,
      "y": 193.7,
      "w": 823.2,
      "h": 177.2,
      "color": "#f4f2ed",
      "alpha": 0.87
    }
  ],
  "bars": [
    {
      "x": 149.8,
      "y": 667.5,
      "w": 420.4,
      "h": 10,
      "color": "#ff3b6b"
    }
  ],
  "dots": true,
  "lines": [
    {
      "text": "文字闪切",
      "size": 183.5,
      "x": 165.6,
      "y": 447.5,
      "color": "#f5f2ea",
      "weight": 800,
      "letter": 4
    },
    {
      "text": "Text Flash Cuts",
      "size": 41.1,
      "x": 138.5,
      "y": 595.3,
      "color": "#f5f2ea",
      "weight": 500,
      "letter": 6
    }
  ],
  "label": {
    "zh": "文字闪切",
    "en": "Text Flash Cuts",
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
