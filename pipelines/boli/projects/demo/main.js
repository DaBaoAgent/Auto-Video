// boli · 彩色玻璃窗
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（paper 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "boli",
  "seed": "av:boli",
  "family": "paper",
  "w": 1920,
  "h": 1080,
  "bg": "#e8eef3",
  "ink": "#2f6ecf",
  "accent": "#4aa3c8",
  "backlight": "#e9f6ff",
  "leading": "#c8a35a",
  "holes": false,
  "forms": [
    {
      "kind": "rect",
      "x": -30,
      "y": 797.5,
      "w": 1980,
      "h": 312.5,
      "holes": 4
    },
    {
      "kind": "circle",
      "x": 1329.8,
      "y": 549.0,
      "w": 270.1,
      "h": 270.1,
      "holes": 6
    },
    {
      "kind": "arc",
      "x": -20,
      "y": 559.9,
      "w": 1190.4,
      "h": 259.2,
      "holes": 0
    },
    {
      "kind": "rect",
      "x": 429.3,
      "y": 473.5,
      "w": 99.1,
      "h": 324.0,
      "holes": 0
    },
    {
      "kind": "circle",
      "x": 211.4,
      "y": 322.3,
      "w": 534.9,
      "h": 216.0,
      "holes": 7
    },
    {
      "kind": "rect",
      "x": 846.7,
      "y": 624.7,
      "w": 271.2,
      "h": 172.8,
      "holes": 3
    },
    {
      "kind": "tri",
      "x": 819.6,
      "y": 505.9,
      "w": 325.5,
      "h": 118.8,
      "holes": 0
    },
    {
      "kind": "arc",
      "x": 579.0,
      "y": 129.9,
      "w": 120.6,
      "h": 50.7,
      "holes": 0
    },
    {
      "kind": "arc",
      "x": 1101.2,
      "y": 247.0,
      "w": 126.1,
      "h": 53.0,
      "holes": 0
    }
  ],
  "label": {
    "zh": "彩色玻璃窗",
    "en": "Stained Glass",
    "station": "03 · 传统工艺",
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
