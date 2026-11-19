// siyin · 丝印旅行海报
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（halftone 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "siyin",
  "seed": "av:siyin",
  "family": "halftone",
  "w": 1920,
  "h": 1080,
  "bg": "#f2f3f5",
  "ink": "#111417",
  "accent": "#1f6ecb",
  "inks": [
    "#111417",
    "#1f6ecb",
    "#e2372c"
  ],
  "forms": [
    {
      "kind": "circle",
      "x": 412.5,
      "y": 246.7,
      "w": 396.4,
      "h": 396.4,
      "tone": 0.7,
      "cell": 16
    },
    {
      "kind": "arc",
      "x": 778.7,
      "y": 558.7,
      "w": 882.3,
      "h": 437.8,
      "tone": 0.59,
      "cell": 11
    },
    {
      "kind": "rect",
      "x": 948.4,
      "y": 252.3,
      "w": 652.3,
      "h": 153.1,
      "tone": 0.41,
      "cell": 12
    },
    {
      "kind": "rect",
      "x": 1257.5,
      "y": 473.6,
      "w": 500.0,
      "h": 117.9,
      "tone": 0.39,
      "cell": 8
    }
  ],
  "cell": 13,
  "angle": 45,
  "deep": true,
  "grain": 0.17,
  "label": {
    "zh": "丝印旅行海报",
    "en": "Silkscreen Travel Poster",
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
