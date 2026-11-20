// shibo · 示波器数学
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（neon 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "shibo",
  "seed": "av:shibo",
  "family": "neon",
  "w": 1920,
  "h": 1080,
  "bg": "#04110b",
  "ink": "#c8ffe6",
  "accent": "#56ffa8",
  "paths": [
    {
      "pts": [
        [
          192.0,
          245.4
        ],
        [
          403.2,
          293.5
        ],
        [
          614.4,
          302.3
        ],
        [
          825.6,
          381.1
        ],
        [
          1036.8,
          308.2
        ],
        [
          1248.0,
          382.5
        ],
        [
          1459.2,
          567.2
        ],
        [
          1670.4,
          690.4
        ],
        [
          1881.6,
          823.2
        ]
      ],
      "color": "#56ffa8",
      "width": 3.9,
      "blur": 28
    },
    {
      "pts": [
        [
          1050.0,
          469.8
        ],
        [
          1048.4,
          496.8
        ],
        [
          1031.1,
          522.9
        ],
        [
          999.2,
          543.9
        ],
        [
          955.8,
          556.2
        ],
        [
          906.6,
          557.0
        ],
        [
          858.3,
          545.4
        ],
        [
          818.0,
          521.8
        ],
        [
          792.5,
          488.7
        ],
        [
          786.6,
          450.2
        ],
        [
          802.7,
          411.6
        ],
        [
          840.2,
          378.4
        ],
        [
          895.1,
          355.8
        ],
        [
          960.8,
          347.8
        ],
        [
          1028.4,
          356.5
        ],
        [
          1088.5,
          381.8
        ],
        [
          1132.0,
          421.2
        ],
        [
          1151.6,
          469.8
        ],
        [
          1143.2,
          521.2
        ],
        [
          1106.3,
          568.4
        ],
        [
          1044.5,
          604.5
        ],
        [
          965.3,
          623.6
        ],
        [
          878.9,
          622.2
        ],
        [
          797.1,
          599.4
        ],
        [
          731.7,
          557.5
        ],
        [
          692.6,
          501.2
        ],
        [
          686.7,
          437.8
        ],
        [
          716.3,
          376.0
        ],
        [
          778.9,
          324.4
        ],
        [
          867.2,
          290.6
        ],
        [
          970.0,
          280.3
        ],
        [
          1073.6,
          295.9
        ],
        [
          1163.5,
          336.2
        ],
        [
          1226.6,
          396.6
        ]
      ],
      "color": "#4ff0e0",
      "width": 5.1,
      "blur": 28
    },
    {
      "pts": [
        [
          192.0,
          450.8
        ],
        [
          403.2,
          531.3
        ],
        [
          614.4,
          403.8
        ],
        [
          825.6,
          436.8
        ],
        [
          1036.8,
          401.5
        ],
        [
          1248.0,
          460.2
        ],
        [
          1459.2,
          401.9
        ],
        [
          1670.4,
          330.5
        ],
        [
          1881.6,
          150.8
        ]
      ],
      "color": "#ffd166",
      "width": 5.5,
      "blur": 14
    }
  ],
  "dust": 364,
  "scan": 0,
  "label": {
    "zh": "示波器数学",
    "en": "Oscilloscope Math",
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
