// daoshu · 实时倒计时分屏
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（flat 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "daoshu",
  "seed": "av:daoshu",
  "family": "flat",
  "w": 1920,
  "h": 1080,
  "bg": "#f2f3f5",
  "ink": "#111417",
  "accent": "#1f6ecb",
  "bgForms": [
    {
      "kind": "tri",
      "x": 505.6,
      "y": 258.5,
      "w": 801.2,
      "h": 334.8,
      "color": "#111111",
      "alpha": 0.53
    },
    {
      "kind": "circle",
      "x": 823.6,
      "y": 326.3,
      "w": 391.9,
      "h": 353.4,
      "color": "#f4f2ed",
      "alpha": 0.87
    },
    {
      "kind": "circle",
      "x": 1185.6,
      "y": 262.3,
      "w": 556.4,
      "h": 389.3,
      "color": "#1f6ecb",
      "alpha": 0.91
    }
  ],
  "bars": [
    {
      "x": 180.3,
      "y": 603.0,
      "w": 265.2,
      "h": 10,
      "color": "#1f6ecb"
    }
  ],
  "dots": true,
  "lines": [
    {
      "text": "实时倒计时分屏",
      "size": 152.8,
      "x": 143.9,
      "y": 400.7,
      "color": "#111417",
      "weight": 800,
      "letter": 4
    },
    {
      "text": "Live Countdown Split-screen",
      "size": 44.5,
      "x": 146.8,
      "y": 570.7,
      "color": "#111417",
      "weight": 500,
      "letter": 6
    }
  ],
  "label": {
    "zh": "实时倒计时分屏",
    "en": "Live Countdown Split-screen",
    "station": "10 · 实拍混剪",
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
