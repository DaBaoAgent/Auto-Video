// biji · 视觉笔记
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（board 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "biji",
  "seed": "av:biji",
  "family": "board",
  "w": 1920,
  "h": 1080,
  "bg": "#fdfbf3",
  "ink": "#232323",
  "accent": "#37a06b",
  "board": "#fdfbf3",
  "strokes": [
    {
      "pts": [
        [
          96.0,
          778.9
        ],
        [
          1267.2,
          791.9
        ]
      ],
      "w": 6.9,
      "color": "#232323",
      "alpha": 0.9,
      "t0": 0.1,
      "dur": 0.69,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          453.0,
          778.9
        ],
        [
          453.0,
          582.0
        ],
        [
          500.4,
          550.3
        ],
        [
          500.4,
          480.4
        ],
        [
          581.2,
          480.4
        ],
        [
          581.2,
          550.3
        ],
        [
          628.5,
          582.0
        ],
        [
          628.5,
          778.9
        ],
        [
          453.0,
          778.9
        ]
      ],
      "w": 5.3,
      "color": "#232323",
      "alpha": 0.78,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          500.4,
          480.4
        ],
        [
          510.5,
          473.6
        ],
        [
          520.6,
          467.9
        ],
        [
          530.7,
          464.0
        ],
        [
          540.8,
          462.6
        ],
        [
          550.9,
          464.0
        ],
        [
          561.0,
          467.9
        ],
        [
          571.1,
          473.6
        ],
        [
          581.2,
          480.4
        ]
      ],
      "w": 3.2,
      "color": "#232323",
      "alpha": 0.81,
      "t0": 1.1,
      "dur": 0.47,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          756.8,
          727.2
        ],
        [
          754.2,
          740.6
        ],
        [
          746.8,
          752.5
        ],
        [
          735.5,
          761.2
        ],
        [
          721.5,
          765.9
        ],
        [
          706.7,
          765.9
        ],
        [
          692.8,
          761.2
        ],
        [
          681.4,
          752.5
        ],
        [
          674.0,
          740.6
        ],
        [
          671.4,
          727.2
        ],
        [
          674.0,
          713.8
        ],
        [
          681.4,
          702.0
        ],
        [
          692.8,
          693.2
        ],
        [
          706.7,
          688.5
        ],
        [
          721.5,
          688.5
        ],
        [
          735.5,
          693.2
        ],
        [
          746.8,
          702.0
        ],
        [
          754.2,
          713.8
        ],
        [
          756.8,
          727.2
        ]
      ],
      "w": 4.6,
      "color": "#232323",
      "alpha": 0.74,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          658.6,
          776.3
        ],
        [
          765.4,
          772.0
        ]
      ],
      "w": 3.7,
      "color": "#232323",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.75,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          980.7,
          734.0
        ],
        [
          978.0,
          748.2
        ],
        [
          970.2,
          760.6
        ],
        [
          958.2,
          769.8
        ],
        [
          943.6,
          774.7
        ],
        [
          928.0,
          774.7
        ],
        [
          913.3,
          769.8
        ],
        [
          901.4,
          760.6
        ],
        [
          893.6,
          748.2
        ],
        [
          890.9,
          734.0
        ],
        [
          893.6,
          719.9
        ],
        [
          901.4,
          707.5
        ],
        [
          913.3,
          698.3
        ],
        [
          928.0,
          693.4
        ],
        [
          943.6,
          693.4
        ],
        [
          958.2,
          698.3
        ],
        [
          970.2,
          707.5
        ],
        [
          978.0,
          719.9
        ],
        [
          980.7,
          734.0
        ]
      ],
      "w": 3.4,
      "color": "#232323",
      "alpha": 0.83,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          877.4,
          785.7
        ],
        [
          989.7,
          781.2
        ]
      ],
      "w": 3.2,
      "color": "#232323",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.67,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          553.8,
          699.2
        ],
        [
          581.9,
          661.1
        ]
      ],
      "w": 3.3,
      "color": "#232323",
      "alpha": 0.62,
      "t0": 2.55,
      "dur": 0.3,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          626.5,
          663.6
        ],
        [
          654.5,
          625.5
        ]
      ],
      "w": 3.4,
      "color": "#232323",
      "alpha": 0.43,
      "t0": 2.19,
      "dur": 0.3,
      "jitter": 2.2
    },
    {
      "pts": [
        [
          452.6,
          716.1
        ],
        [
          480.7,
          678.0
        ]
      ],
      "w": 3.3,
      "color": "#232323",
      "alpha": 0.67,
      "t0": 2.03,
      "dur": 0.3,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          471.0,
          607.2
        ],
        [
          499.1,
          569.1
        ]
      ],
      "w": 2.7,
      "color": "#232323",
      "alpha": 0.48,
      "t0": 2.37,
      "dur": 0.3,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          479.7,
          657.3
        ],
        [
          507.8,
          619.2
        ]
      ],
      "w": 4.2,
      "color": "#232323",
      "alpha": 0.57,
      "t0": 2.2,
      "dur": 0.3,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          520.6,
          692.4
        ],
        [
          548.7,
          654.3
        ]
      ],
      "w": 2.3,
      "color": "#232323",
      "alpha": 0.4,
      "t0": 2.26,
      "dur": 0.3,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          458.7,
          656.9
        ],
        [
          486.7,
          618.8
        ]
      ],
      "w": 3.0,
      "color": "#232323",
      "alpha": 0.69,
      "t0": 2.11,
      "dur": 0.3,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          606.2,
          710.9
        ],
        [
          634.3,
          672.8
        ]
      ],
      "w": 3.3,
      "color": "#232323",
      "alpha": 0.68,
      "t0": 1.7,
      "dur": 0.3,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          1327.4,
          400.2
        ],
        [
          1321.7,
          425.1
        ],
        [
          1305.0,
          447.9
        ],
        [
          1278.7,
          466.8
        ],
        [
          1244.9,
          480.4
        ],
        [
          1206.3,
          487.4
        ],
        [
          1166.1,
          487.4
        ],
        [
          1127.6,
          480.4
        ],
        [
          1093.8,
          466.8
        ],
        [
          1067.4,
          447.9
        ],
        [
          1050.8,
          425.1
        ],
        [
          1045.0,
          400.2
        ],
        [
          1050.8,
          375.4
        ],
        [
          1067.4,
          352.6
        ],
        [
          1093.8,
          333.6
        ],
        [
          1127.6,
          320.1
        ],
        [
          1166.1,
          313.0
        ],
        [
          1206.3,
          313.0
        ],
        [
          1244.9,
          320.1
        ],
        [
          1278.7,
          333.6
        ],
        [
          1305.0,
          352.6
        ],
        [
          1321.7,
          375.4
        ],
        [
          1327.4,
          400.2
        ]
      ],
      "w": 5.4,
      "color": "#37a06b",
      "alpha": 0.79,
      "t0": 2.14,
      "dur": 0.7,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          681.2,
          620.1
        ],
        [
          1073.3,
          422.8
        ]
      ],
      "w": 3.6,
      "color": "#37a06b",
      "alpha": 0.87,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.4
    },
    {
      "pts": [
        [
          1073.3,
          422.8
        ],
        [
          1052.9,
          388.9
        ]
      ],
      "w": 3,
      "color": "#37a06b",
      "alpha": 0.8,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          1073.3,
          422.8
        ],
        [
          1067.6,
          447.7
        ]
      ],
      "w": 3,
      "color": "#37a06b",
      "alpha": 0.74,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 2.2
    }
  ],
  "washes": [],
  "gridBoard": true,
  "chalk": false,
  "highlights": [
    {
      "x": 316.6,
      "y": 800.5,
      "w": 341.1,
      "h": 19.4,
      "color": "#37a06b",
      "t0": 3.2
    }
  ],
  "label": {
    "zh": "视觉笔记",
    "en": "Sketchnote",
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
