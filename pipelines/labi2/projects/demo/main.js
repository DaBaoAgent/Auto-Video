// labi2 · 蜡笔立体世界
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（board 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "labi2",
  "seed": "av:labi2",
  "family": "board",
  "w": 1920,
  "h": 1080,
  "bg": "#f7f0df",
  "ink": "#2b241d",
  "accent": "#e07a3c",
  "board": "#f7f0df",
  "strokes": [
    {
      "pts": [
        [
          96.0,
          733.2
        ],
        [
          1267.2,
          746.1
        ]
      ],
      "w": 8.4,
      "color": "#2b241d",
      "alpha": 0.94,
      "t0": 0.1,
      "dur": 0.38,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          490.7,
          733.2
        ],
        [
          490.7,
          548.3
        ],
        [
          540.8,
          518.5
        ],
        [
          540.8,
          452.9
        ],
        [
          626.3,
          452.9
        ],
        [
          626.3,
          518.5
        ],
        [
          676.5,
          548.3
        ],
        [
          676.5,
          733.2
        ],
        [
          490.7,
          733.2
        ]
      ],
      "w": 4.0,
      "color": "#2b241d",
      "alpha": 0.88,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          540.8,
          452.9
        ],
        [
          551.5,
          445.7
        ],
        [
          562.2,
          439.6
        ],
        [
          572.9,
          435.6
        ],
        [
          583.6,
          434.1
        ],
        [
          594.3,
          435.6
        ],
        [
          605.0,
          439.6
        ],
        [
          615.6,
          445.7
        ],
        [
          626.3,
          452.9
        ]
      ],
      "w": 4.9,
      "color": "#2b241d",
      "alpha": 0.83,
      "t0": 1.1,
      "dur": 0.7,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          948.9,
          677.0
        ],
        [
          945.6,
          694.2
        ],
        [
          936.2,
          709.2
        ],
        [
          921.7,
          720.4
        ],
        [
          903.9,
          726.4
        ],
        [
          884.9,
          726.4
        ],
        [
          867.1,
          720.4
        ],
        [
          852.6,
          709.2
        ],
        [
          843.1,
          694.2
        ],
        [
          839.9,
          677.0
        ],
        [
          843.1,
          659.8
        ],
        [
          852.6,
          644.7
        ],
        [
          867.1,
          633.5
        ],
        [
          884.9,
          627.6
        ],
        [
          903.9,
          627.6
        ],
        [
          921.7,
          633.5
        ],
        [
          936.2,
          644.7
        ],
        [
          945.6,
          659.8
        ],
        [
          948.9,
          677.0
        ]
      ],
      "w": 4.3,
      "color": "#2b241d",
      "alpha": 0.89,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          823.5,
          739.7
        ],
        [
          959.8,
          734.3
        ]
      ],
      "w": 3.7,
      "color": "#2b241d",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.52,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          948.9,
          686.1
        ],
        [
          945.6,
          703.3
        ],
        [
          936.1,
          718.5
        ],
        [
          921.5,
          729.8
        ],
        [
          903.6,
          735.8
        ],
        [
          884.5,
          735.8
        ],
        [
          866.6,
          729.8
        ],
        [
          852.0,
          718.5
        ],
        [
          842.5,
          703.3
        ],
        [
          839.2,
          686.1
        ],
        [
          842.5,
          668.8
        ],
        [
          852.0,
          653.6
        ],
        [
          866.6,
          642.4
        ],
        [
          884.5,
          636.4
        ],
        [
          903.6,
          636.4
        ],
        [
          921.5,
          642.4
        ],
        [
          936.1,
          653.6
        ],
        [
          945.6,
          668.8
        ],
        [
          948.9,
          686.1
        ]
      ],
      "w": 5.0,
      "color": "#2b241d",
      "alpha": 0.74,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          822.7,
          749.1
        ],
        [
          959.9,
          743.7
        ]
      ],
      "w": 3.0,
      "color": "#2b241d",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.48,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          618.5,
          667.2
        ],
        [
          648.2,
          631.5
        ]
      ],
      "w": 2.9,
      "color": "#2b241d",
      "alpha": 0.7,
      "t0": 1.75,
      "dur": 0.3,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          643.5,
          667.7
        ],
        [
          673.2,
          632.0
        ]
      ],
      "w": 2.9,
      "color": "#2b241d",
      "alpha": 0.49,
      "t0": 1.83,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          525.3,
          575.6
        ],
        [
          555.1,
          539.8
        ]
      ],
      "w": 2.0,
      "color": "#2b241d",
      "alpha": 0.58,
      "t0": 2.59,
      "dur": 0.3,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          499.6,
          695.2
        ],
        [
          529.4,
          659.4
        ]
      ],
      "w": 2.4,
      "color": "#2b241d",
      "alpha": 0.57,
      "t0": 1.63,
      "dur": 0.3,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          536.1,
          591.2
        ],
        [
          565.8,
          555.5
        ]
      ],
      "w": 3.8,
      "color": "#2b241d",
      "alpha": 0.58,
      "t0": 2.43,
      "dur": 0.3,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          659.3,
          669.2
        ],
        [
          689.1,
          633.4
        ]
      ],
      "w": 2.8,
      "color": "#2b241d",
      "alpha": 0.37,
      "t0": 1.95,
      "dur": 0.3,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          1270.6,
          421.1
        ],
        [
          1263.7,
          451.2
        ],
        [
          1243.4,
          478.8
        ],
        [
          1211.5,
          501.8
        ],
        [
          1170.6,
          518.2
        ],
        [
          1123.9,
          526.8
        ],
        [
          1075.2,
          526.8
        ],
        [
          1028.4,
          518.2
        ],
        [
          987.5,
          501.8
        ],
        [
          955.6,
          478.8
        ],
        [
          935.4,
          451.2
        ],
        [
          928.4,
          421.1
        ],
        [
          935.4,
          391.0
        ],
        [
          955.6,
          363.4
        ],
        [
          987.5,
          340.4
        ],
        [
          1028.4,
          324.0
        ],
        [
          1075.2,
          315.5
        ],
        [
          1123.9,
          315.5
        ],
        [
          1170.6,
          324.0
        ],
        [
          1211.5,
          340.4
        ],
        [
          1243.4,
          363.4
        ],
        [
          1263.7,
          391.0
        ],
        [
          1270.6,
          421.1
        ]
      ],
      "w": 5.4,
      "color": "#e07a3c",
      "alpha": 0.94,
      "t0": 2.75,
      "dur": 0.7,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          732.3,
          584.1
        ],
        [
          962.7,
          448.5
        ]
      ],
      "w": 4.2,
      "color": "#e07a3c",
      "alpha": 0.82,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          962.7,
          448.5
        ],
        [
          938.0,
          407.4
        ]
      ],
      "w": 3,
      "color": "#e07a3c",
      "alpha": 0.84,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          962.7,
          448.5
        ],
        [
          955.8,
          478.6
        ]
      ],
      "w": 3,
      "color": "#e07a3c",
      "alpha": 0.78,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 2.1
    }
  ],
  "washes": [],
  "gridBoard": false,
  "chalk": false,
  "highlights": [
    {
      "x": 383.7,
      "y": 754.8,
      "w": 351.9,
      "h": 19.4,
      "color": "#e07a3c",
      "t0": 2.56
    }
  ],
  "label": {
    "zh": "蜡笔立体世界",
    "en": "Crayon World 3D",
    "station": "07 · 三维推演",
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
