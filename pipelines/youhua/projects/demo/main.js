// youhua · 油画厚涂
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（board 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "youhua",
  "seed": "av:youhua",
  "family": "board",
  "w": 1920,
  "h": 1080,
  "bg": "#efe7d6",
  "ink": "#2a221c",
  "accent": "#b4552f",
  "board": "#efe7d6",
  "strokes": [
    {
      "pts": [
        [
          96.0,
          720.3
        ],
        [
          1267.2,
          733.3
        ]
      ],
      "w": 5.7,
      "color": "#2a221c",
      "alpha": 0.76,
      "t0": 0.1,
      "dur": 0.61,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          476.9,
          720.3
        ],
        [
          476.9,
          502.6
        ],
        [
          532.8,
          467.4
        ],
        [
          532.8,
          390.2
        ],
        [
          628.0,
          390.2
        ],
        [
          628.0,
          467.4
        ],
        [
          683.9,
          502.6
        ],
        [
          683.9,
          720.3
        ],
        [
          476.9,
          720.3
        ]
      ],
      "w": 4.1,
      "color": "#2a221c",
      "alpha": 0.85,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          532.8,
          390.2
        ],
        [
          544.7,
          382.2
        ],
        [
          556.6,
          375.4
        ],
        [
          568.5,
          370.8
        ],
        [
          580.4,
          369.2
        ],
        [
          592.3,
          370.8
        ],
        [
          604.2,
          375.4
        ],
        [
          616.1,
          382.2
        ],
        [
          628.0,
          390.2
        ]
      ],
      "w": 3.6,
      "color": "#2a221c",
      "alpha": 0.8,
      "t0": 1.1,
      "dur": 0.61,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          866.8,
          659.3
        ],
        [
          863.7,
          675.6
        ],
        [
          854.7,
          689.9
        ],
        [
          841.0,
          700.5
        ],
        [
          824.1,
          706.2
        ],
        [
          806.2,
          706.2
        ],
        [
          789.3,
          700.5
        ],
        [
          775.5,
          689.9
        ],
        [
          766.5,
          675.6
        ],
        [
          763.4,
          659.3
        ],
        [
          766.5,
          643.1
        ],
        [
          775.5,
          628.7
        ],
        [
          789.3,
          618.1
        ],
        [
          806.2,
          612.5
        ],
        [
          824.1,
          612.5
        ],
        [
          841.0,
          618.1
        ],
        [
          854.7,
          628.7
        ],
        [
          863.7,
          643.1
        ],
        [
          866.8,
          659.3
        ]
      ],
      "w": 4.9,
      "color": "#2a221c",
      "alpha": 0.74,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 2.2
    },
    {
      "pts": [
        [
          747.9,
          718.8
        ],
        [
          877.2,
          713.6
        ]
      ],
      "w": 2.2,
      "color": "#2a221c",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.78,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          1148.2,
          652.1
        ],
        [
          1144.7,
          670.1
        ],
        [
          1134.8,
          685.9
        ],
        [
          1119.7,
          697.6
        ],
        [
          1101.1,
          703.8
        ],
        [
          1081.3,
          703.8
        ],
        [
          1062.7,
          697.6
        ],
        [
          1047.5,
          685.9
        ],
        [
          1037.6,
          670.1
        ],
        [
          1034.1,
          652.1
        ],
        [
          1037.6,
          634.2
        ],
        [
          1047.5,
          618.4
        ],
        [
          1062.7,
          606.7
        ],
        [
          1081.3,
          600.5
        ],
        [
          1101.1,
          600.5
        ],
        [
          1119.7,
          606.7
        ],
        [
          1134.8,
          618.4
        ],
        [
          1144.7,
          634.2
        ],
        [
          1148.2,
          652.1
        ]
      ],
      "w": 4.5,
      "color": "#2a221c",
      "alpha": 0.73,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          1017.0,
          717.7
        ],
        [
          1159.6,
          712.0
        ]
      ],
      "w": 3.6,
      "color": "#2a221c",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.64,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          666.3,
          536.7
        ],
        [
          699.4,
          494.6
        ]
      ],
      "w": 3.7,
      "color": "#2a221c",
      "alpha": 0.67,
      "t0": 1.91,
      "dur": 0.3,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          651.2,
          562.4
        ],
        [
          684.3,
          520.3
        ]
      ],
      "w": 4.1,
      "color": "#2a221c",
      "alpha": 0.6,
      "t0": 2.12,
      "dur": 0.3,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          504.7,
          534.5
        ],
        [
          537.9,
          492.4
        ]
      ],
      "w": 3.2,
      "color": "#2a221c",
      "alpha": 0.62,
      "t0": 2.25,
      "dur": 0.3,
      "jitter": 0.8
    },
    {
      "pts": [
        [
          554.6,
          577.4
        ],
        [
          587.7,
          535.3
        ]
      ],
      "w": 2.8,
      "color": "#2a221c",
      "alpha": 0.44,
      "t0": 2.23,
      "dur": 0.3,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          612.5,
          620.2
        ],
        [
          645.6,
          578.0
        ]
      ],
      "w": 3.3,
      "color": "#2a221c",
      "alpha": 0.36,
      "t0": 2.38,
      "dur": 0.3,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          607.3,
          570.3
        ],
        [
          640.4,
          528.2
        ]
      ],
      "w": 4.3,
      "color": "#2a221c",
      "alpha": 0.35,
      "t0": 1.66,
      "dur": 0.3,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          1203.8,
          499.2
        ],
        [
          1197.6,
          526.3
        ],
        [
          1179.4,
          551.2
        ],
        [
          1150.6,
          571.9
        ],
        [
          1113.7,
          586.7
        ],
        [
          1071.6,
          594.4
        ],
        [
          1027.7,
          594.4
        ],
        [
          985.6,
          586.7
        ],
        [
          948.7,
          571.9
        ],
        [
          920.0,
          551.2
        ],
        [
          901.7,
          526.3
        ],
        [
          895.5,
          499.2
        ],
        [
          901.7,
          472.1
        ],
        [
          920.0,
          447.2
        ],
        [
          948.7,
          426.5
        ],
        [
          985.6,
          411.7
        ],
        [
          1027.7,
          404.0
        ],
        [
          1071.6,
          404.0
        ],
        [
          1113.7,
          411.7
        ],
        [
          1150.6,
          426.5
        ],
        [
          1179.4,
          447.2
        ],
        [
          1197.6,
          472.1
        ],
        [
          1203.8,
          499.2
        ]
      ],
      "w": 5.7,
      "color": "#b4552f",
      "alpha": 0.85,
      "t0": 2.38,
      "dur": 0.7,
      "jitter": 0.8
    },
    {
      "pts": [
        [
          746.0,
          544.7
        ],
        [
          926.3,
          523.9
        ]
      ],
      "w": 2.7,
      "color": "#b4552f",
      "alpha": 0.78,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          926.3,
          523.9
        ],
        [
          904.1,
          486.9
        ]
      ],
      "w": 3,
      "color": "#b4552f",
      "alpha": 0.84,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          926.3,
          523.9
        ],
        [
          920.2,
          551.0
        ]
      ],
      "w": 3,
      "color": "#b4552f",
      "alpha": 0.88,
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
      "x": 487.4,
      "y": 741.9,
      "w": 397.3,
      "h": 19.4,
      "color": "#b4552f",
      "t0": 2.54
    }
  ],
  "label": {
    "zh": "油画厚涂",
    "en": "Impasto Oil Painting",
    "station": "02 · 手绘笔触",
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
