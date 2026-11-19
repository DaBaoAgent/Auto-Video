// jianzhi · 红色窗花剪纸
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（paper 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "jianzhi",
  "seed": "av:jianzhi",
  "family": "paper",
  "w": 1920,
  "h": 1080,
  "bg": "#120a0a",
  "ink": "#a8272a",
  "accent": "#d4382f",
  "backlight": "#fff1cf",
  "leading": null,
  "holes": true,
  "forms": [
    {
      "kind": "rect",
      "x": -30,
      "y": 828.8,
      "w": 1980,
      "h": 281.2,
      "holes": 4
    },
    {
      "kind": "circle",
      "x": 1300.5,
      "y": 550.1,
      "w": 302.9,
      "h": 302.9,
      "holes": 6
    },
    {
      "kind": "arc",
      "x": -20,
      "y": 591.2,
      "w": 1190.4,
      "h": 259.2,
      "holes": 0
    },
    {
      "kind": "rect",
      "x": 422.0,
      "y": 504.8,
      "w": 82.4,
      "h": 324.0,
      "holes": 0
    },
    {
      "kind": "circle",
      "x": 240.7,
      "y": 353.6,
      "w": 445.2,
      "h": 216.0,
      "holes": 7
    },
    {
      "kind": "rect",
      "x": 936.9,
      "y": 656.0,
      "w": 341.7,
      "h": 172.8,
      "holes": 3
    },
    {
      "kind": "tri",
      "x": 902.7,
      "y": 537.2,
      "w": 410.0,
      "h": 118.8,
      "holes": 0
    },
    {
      "kind": "arc",
      "x": 956.0,
      "y": 172.2,
      "w": 102.3,
      "h": 43.0,
      "holes": 0
    },
    {
      "kind": "arc",
      "x": 985.0,
      "y": 263.6,
      "w": 97.6,
      "h": 41.0,
      "holes": 0
    }
  ],
  "label": {
    "zh": "红色窗花剪纸",
    "en": "Red Paper-cut",
    "station": "03 · 传统工艺",
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
