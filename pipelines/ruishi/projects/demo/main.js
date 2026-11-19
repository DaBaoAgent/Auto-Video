// ruishi · 瑞士动态排版
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（flat 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "ruishi",
  "seed": "av:ruishi",
  "family": "flat",
  "w": 1920,
  "h": 1080,
  "bg": "#f4f2ed",
  "ink": "#141414",
  "accent": "#e2372c",
  "bgForms": [
    {
      "kind": "tri",
      "x": 582.2,
      "y": 139.3,
      "w": 602.8,
      "h": 301.0,
      "color": "#111111",
      "alpha": 0.6
    },
    {
      "kind": "arc",
      "x": 807.2,
      "y": 146.6,
      "w": 416.4,
      "h": 323.9,
      "color": "#f4f2ed",
      "alpha": 0.74
    },
    {
      "kind": "circle",
      "x": 210.3,
      "y": 515.1,
      "w": 909.0,
      "h": 469.5,
      "color": "#111111",
      "alpha": 0.59
    },
    {
      "kind": "tri",
      "x": 1132.2,
      "y": 82.5,
      "w": 543.5,
      "h": 290.4,
      "color": "#e2372c",
      "alpha": 0.96
    }
  ],
  "bars": [
    {
      "x": 132.8,
      "y": 652.9,
      "w": 277.9,
      "h": 10,
      "color": "#e2372c"
    }
  ],
  "dots": true,
  "lines": [
    {
      "text": "瑞士动态排版",
      "size": 204.0,
      "x": 124.0,
      "y": 474.9,
      "color": "#141414",
      "weight": 800,
      "letter": 0
    },
    {
      "text": "Swiss Motion Graphics",
      "size": 49.6,
      "x": 132.0,
      "y": 598.9,
      "color": "#141414",
      "weight": 500,
      "letter": 6
    }
  ],
  "label": {
    "zh": "瑞士动态排版",
    "en": "Swiss Motion Graphics",
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
