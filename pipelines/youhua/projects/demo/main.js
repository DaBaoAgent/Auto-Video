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
          735.0
        ],
        [
          1267.2,
          748.0
        ]
      ],
      "w": 7.4,
      "color": "#2a221c",
      "alpha": 0.95,
      "t0": 0.1,
      "dur": 0.5,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          500.5,
          735.0
        ],
        [
          500.5,
          553.3
        ],
        [
          552.3,
          524.0
        ],
        [
          552.3,
          459.5
        ],
        [
          640.5,
          459.5
        ],
        [
          640.5,
          524.0
        ],
        [
          692.3,
          553.3
        ],
        [
          692.3,
          735.0
        ],
        [
          500.5,
          735.0
        ]
      ],
      "w": 6.9,
      "color": "#2a221c",
      "alpha": 0.86,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          552.3,
          459.5
        ],
        [
          563.3,
          452.1
        ],
        [
          574.3,
          445.8
        ],
        [
          585.4,
          441.5
        ],
        [
          596.4,
          440.1
        ],
        [
          607.4,
          441.5
        ],
        [
          618.4,
          445.8
        ],
        [
          629.5,
          452.1
        ],
        [
          640.5,
          459.5
        ]
      ],
      "w": 4.6,
      "color": "#2a221c",
      "alpha": 0.77,
      "t0": 1.1,
      "dur": 0.42,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          841.6,
          684.7
        ],
        [
          838.2,
          702.5
        ],
        [
          828.3,
          718.1
        ],
        [
          813.3,
          729.7
        ],
        [
          794.8,
          735.9
        ],
        [
          775.2,
          735.9
        ],
        [
          756.7,
          729.7
        ],
        [
          741.7,
          718.1
        ],
        [
          731.9,
          702.5
        ],
        [
          728.5,
          684.7
        ],
        [
          731.9,
          666.9
        ],
        [
          741.7,
          651.2
        ],
        [
          756.7,
          639.6
        ],
        [
          775.2,
          633.4
        ],
        [
          794.8,
          633.4
        ],
        [
          813.3,
          639.6
        ],
        [
          828.3,
          651.2
        ],
        [
          838.2,
          666.9
        ],
        [
          841.6,
          684.7
        ]
      ],
      "w": 3.5,
      "color": "#2a221c",
      "alpha": 0.86,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          711.5,
          749.7
        ],
        [
          852.9,
          744.0
        ]
      ],
      "w": 2.6,
      "color": "#2a221c",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.41,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          1093.5,
          672.7
        ],
        [
          1090.2,
          689.9
        ],
        [
          1080.7,
          705.0
        ],
        [
          1066.2,
          716.2
        ],
        [
          1048.3,
          722.1
        ],
        [
          1029.4,
          722.1
        ],
        [
          1011.6,
          716.2
        ],
        [
          997.0,
          705.0
        ],
        [
          987.5,
          689.9
        ],
        [
          984.3,
          672.7
        ],
        [
          987.5,
          655.5
        ],
        [
          997.0,
          640.4
        ],
        [
          1011.6,
          629.2
        ],
        [
          1029.4,
          623.2
        ],
        [
          1048.3,
          623.2
        ],
        [
          1066.2,
          629.2
        ],
        [
          1080.7,
          640.4
        ],
        [
          1090.2,
          655.5
        ],
        [
          1093.5,
          672.7
        ]
      ],
      "w": 5.1,
      "color": "#2a221c",
      "alpha": 0.77,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          967.9,
          735.5
        ],
        [
          1104.4,
          730.0
        ]
      ],
      "w": 2.9,
      "color": "#2a221c",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.66,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          542.5,
          676.1
        ],
        [
          573.2,
          641.0
        ]
      ],
      "w": 2.5,
      "color": "#2a221c",
      "alpha": 0.46,
      "t0": 2.17,
      "dur": 0.3,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          566.8,
          644.2
        ],
        [
          597.5,
          609.1
        ]
      ],
      "w": 3.5,
      "color": "#2a221c",
      "alpha": 0.51,
      "t0": 2.41,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          565.6,
          578.7
        ],
        [
          596.2,
          543.5
        ]
      ],
      "w": 2.7,
      "color": "#2a221c",
      "alpha": 0.47,
      "t0": 2.25,
      "dur": 0.3,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          561.8,
          695.9
        ],
        [
          592.5,
          660.8
        ]
      ],
      "w": 3.5,
      "color": "#2a221c",
      "alpha": 0.66,
      "t0": 1.84,
      "dur": 0.3,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          578.1,
          591.8
        ],
        [
          608.8,
          556.6
        ]
      ],
      "w": 4.1,
      "color": "#2a221c",
      "alpha": 0.57,
      "t0": 1.82,
      "dur": 0.3,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          1201.4,
          493.6
        ],
        [
          1196.5,
          515.0
        ],
        [
          1182.1,
          534.7
        ],
        [
          1159.4,
          551.0
        ],
        [
          1130.3,
          562.7
        ],
        [
          1097.1,
          568.7
        ],
        [
          1062.5,
          568.7
        ],
        [
          1029.3,
          562.7
        ],
        [
          1000.2,
          551.0
        ],
        [
          977.5,
          534.7
        ],
        [
          963.1,
          515.0
        ],
        [
          958.2,
          493.6
        ],
        [
          963.1,
          472.3
        ],
        [
          977.5,
          452.6
        ],
        [
          1000.2,
          436.3
        ],
        [
          1029.3,
          424.6
        ],
        [
          1062.5,
          418.5
        ],
        [
          1097.1,
          418.5
        ],
        [
          1130.3,
          424.6
        ],
        [
          1159.4,
          436.3
        ],
        [
          1182.1,
          452.6
        ],
        [
          1196.5,
          472.3
        ],
        [
          1201.4,
          493.6
        ]
      ],
      "w": 3.9,
      "color": "#b4552f",
      "alpha": 0.74,
      "t0": 2.5,
      "dur": 0.7,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          749.8,
          588.5
        ],
        [
          982.5,
          513.1
        ]
      ],
      "w": 3.4,
      "color": "#b4552f",
      "alpha": 0.92,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          982.5,
          513.1
        ],
        [
          965.0,
          483.9
        ]
      ],
      "w": 3,
      "color": "#b4552f",
      "alpha": 0.88,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          982.5,
          513.1
        ],
        [
          977.6,
          534.5
        ]
      ],
      "w": 3,
      "color": "#b4552f",
      "alpha": 0.91,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.9
    }
  ],
  "washes": [],
  "gridBoard": false,
  "chalk": false,
  "highlights": [
    {
      "x": 537.9,
      "y": 756.6,
      "w": 343.7,
      "h": 19.4,
      "color": "#b4552f",
      "t0": 3.1
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
