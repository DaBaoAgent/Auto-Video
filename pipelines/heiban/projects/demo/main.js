// heiban · 黑板粉笔
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（board 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "heiban",
  "seed": "av:heiban",
  "family": "board",
  "w": 1920,
  "h": 1080,
  "bg": "#1c2420",
  "ink": "#f2f3ea",
  "accent": "#e6d06a",
  "board": "#1c2420",
  "strokes": [
    {
      "pts": [
        [
          96.0,
          720.6
        ],
        [
          1267.2,
          733.6
        ]
      ],
      "w": 7.1,
      "color": "#f2f3ea",
      "alpha": 0.91,
      "t0": 0.1,
      "dur": 0.49,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          389.7,
          720.6
        ],
        [
          389.7,
          540.6
        ],
        [
          444.0,
          511.6
        ],
        [
          444.0,
          447.7
        ],
        [
          536.3,
          447.7
        ],
        [
          536.3,
          511.6
        ],
        [
          590.5,
          540.6
        ],
        [
          590.5,
          720.6
        ],
        [
          389.7,
          720.6
        ]
      ],
      "w": 6.4,
      "color": "#f2f3ea",
      "alpha": 0.86,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          444.0,
          447.7
        ],
        [
          455.5,
          440.0
        ],
        [
          467.0,
          433.4
        ],
        [
          478.6,
          429.0
        ],
        [
          490.1,
          427.4
        ],
        [
          501.7,
          429.0
        ],
        [
          513.2,
          433.4
        ],
        [
          524.8,
          440.0
        ],
        [
          536.3,
          447.7
        ]
      ],
      "w": 3.0,
      "color": "#f2f3ea",
      "alpha": 0.86,
      "t0": 1.1,
      "dur": 0.58,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          902.9,
          658.0
        ],
        [
          900.2,
          672.2
        ],
        [
          892.3,
          684.7
        ],
        [
          880.3,
          694.0
        ],
        [
          865.6,
          698.9
        ],
        [
          849.9,
          698.9
        ],
        [
          835.1,
          694.0
        ],
        [
          823.1,
          684.7
        ],
        [
          815.3,
          672.2
        ],
        [
          812.5,
          658.0
        ],
        [
          815.3,
          643.8
        ],
        [
          823.1,
          631.3
        ],
        [
          835.1,
          622.0
        ],
        [
          849.9,
          617.1
        ],
        [
          865.6,
          617.1
        ],
        [
          880.3,
          622.0
        ],
        [
          892.3,
          631.3
        ],
        [
          900.2,
          643.8
        ],
        [
          902.9,
          658.0
        ]
      ],
      "w": 3.8,
      "color": "#f2f3ea",
      "alpha": 0.73,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          799.0,
          710.0
        ],
        [
          911.9,
          705.4
        ]
      ],
      "w": 4.0,
      "color": "#f2f3ea",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.44,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          903.6,
          663.8
        ],
        [
          900.1,
          682.4
        ],
        [
          889.8,
          698.7
        ],
        [
          874.1,
          710.9
        ],
        [
          854.8,
          717.3
        ],
        [
          834.2,
          717.3
        ],
        [
          814.9,
          710.9
        ],
        [
          799.2,
          698.7
        ],
        [
          789.0,
          682.4
        ],
        [
          785.4,
          663.8
        ],
        [
          789.0,
          645.2
        ],
        [
          799.2,
          628.8
        ],
        [
          814.9,
          616.7
        ],
        [
          834.2,
          610.2
        ],
        [
          854.8,
          610.2
        ],
        [
          874.1,
          616.7
        ],
        [
          889.8,
          628.8
        ],
        [
          900.1,
          645.2
        ],
        [
          903.6,
          663.8
        ]
      ],
      "w": 5.4,
      "color": "#f2f3ea",
      "alpha": 0.73,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          767.6,
          731.8
        ],
        [
          915.5,
          725.8
        ]
      ],
      "w": 3.4,
      "color": "#f2f3ea",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.39,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          564.9,
          618.9
        ],
        [
          597.0,
          584.1
        ]
      ],
      "w": 4.4,
      "color": "#f2f3ea",
      "alpha": 0.4,
      "t0": 2.31,
      "dur": 0.3,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          480.3,
          640.8
        ],
        [
          512.4,
          605.9
        ]
      ],
      "w": 4.2,
      "color": "#f2f3ea",
      "alpha": 0.5,
      "t0": 1.83,
      "dur": 0.3,
      "jitter": 2.2
    },
    {
      "pts": [
        [
          391.7,
          602.3
        ],
        [
          423.8,
          567.4
        ]
      ],
      "w": 3.5,
      "color": "#f2f3ea",
      "alpha": 0.7,
      "t0": 2.25,
      "dur": 0.3,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          420.4,
          570.5
        ],
        [
          452.6,
          535.7
        ]
      ],
      "w": 4.1,
      "color": "#f2f3ea",
      "alpha": 0.61,
      "t0": 2.02,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          437.2,
          628.7
        ],
        [
          469.3,
          593.9
        ]
      ],
      "w": 3.3,
      "color": "#f2f3ea",
      "alpha": 0.64,
      "t0": 1.64,
      "dur": 0.3,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          1342.2,
          433.9
        ],
        [
          1335.5,
          462.8
        ],
        [
          1316.1,
          489.3
        ],
        [
          1285.4,
          511.4
        ],
        [
          1246.1,
          527.2
        ],
        [
          1201.2,
          535.4
        ],
        [
          1154.4,
          535.4
        ],
        [
          1109.5,
          527.2
        ],
        [
          1070.1,
          511.4
        ],
        [
          1039.5,
          489.3
        ],
        [
          1020.1,
          462.8
        ],
        [
          1013.4,
          433.9
        ],
        [
          1020.1,
          405.0
        ],
        [
          1039.5,
          378.4
        ],
        [
          1070.1,
          356.4
        ],
        [
          1109.5,
          340.6
        ],
        [
          1154.4,
          332.4
        ],
        [
          1201.2,
          332.4
        ],
        [
          1246.1,
          340.6
        ],
        [
          1285.4,
          356.4
        ],
        [
          1316.1,
          378.4
        ],
        [
          1335.5,
          405.0
        ],
        [
          1342.2,
          433.9
        ]
      ],
      "w": 5.6,
      "color": "#e6d06a",
      "alpha": 0.88,
      "t0": 2.63,
      "dur": 0.7,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          650.8,
          575.5
        ],
        [
          1046.3,
          460.2
        ]
      ],
      "w": 3.4,
      "color": "#e6d06a",
      "alpha": 0.87,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          1046.3,
          460.2
        ],
        [
          1022.6,
          420.7
        ]
      ],
      "w": 3,
      "color": "#e6d06a",
      "alpha": 0.91,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          1046.3,
          460.2
        ],
        [
          1039.7,
          489.1
        ]
      ],
      "w": 3,
      "color": "#e6d06a",
      "alpha": 0.81,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.4
    }
  ],
  "washes": [],
  "gridBoard": false,
  "chalk": true,
  "highlights": [
    {
      "x": 544.1,
      "y": 742.2,
      "w": 416.0,
      "h": 19.4,
      "color": "#e6d06a",
      "t0": 2.85
    }
  ],
  "label": {
    "zh": "黑板粉笔",
    "en": "Chalkboard",
    "station": "02 · 手绘笔触",
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
