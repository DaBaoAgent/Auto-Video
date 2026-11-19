// fabu · 暗色科技发布
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（flat 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "fabu",
  "seed": "av:fabu",
  "family": "flat",
  "w": 1920,
  "h": 1080,
  "bg": "#08090d",
  "ink": "#f2f4f8",
  "accent": "#4f9dff",
  "bgForms": [
    {
      "kind": "rect",
      "x": 1073.0,
      "y": 180.3,
      "w": 721.7,
      "h": 301.6,
      "color": "#111111",
      "alpha": 0.63
    },
    {
      "kind": "arc",
      "x": 32.0,
      "y": 281.5,
      "w": 662.5,
      "h": 184.5,
      "color": "#f4f2ed",
      "alpha": 0.78
    }
  ],
  "bars": [
    {
      "x": 98.8,
      "y": 652.4,
      "w": 272.4,
      "h": 14,
      "color": "#4f9dff"
    }
  ],
  "dots": false,
  "lines": [
    {
      "text": "暗色科技发布",
      "size": 179.1,
      "x": 117.1,
      "y": 433.7,
      "color": "#f2f4f8",
      "weight": 800,
      "letter": 0
    },
    {
      "text": "Dark Tech Keynote",
      "size": 48.0,
      "x": 151.5,
      "y": 605.9,
      "color": "#f2f4f8",
      "weight": 500,
      "letter": 6
    }
  ],
  "label": {
    "zh": "暗色科技发布",
    "en": "Dark Tech Keynote",
    "station": "06 · 屏幕赛博",
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
