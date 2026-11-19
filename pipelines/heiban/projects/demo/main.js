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
          777.1
        ],
        [
          1267.2,
          790.1
        ]
      ],
      "w": 7.2,
      "color": "#f2f3ea",
      "alpha": 0.92,
      "t0": 0.1,
      "dur": 0.67,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          531.5,
          777.1
        ],
        [
          531.5,
          591.4
        ],
        [
          594.3,
          561.4
        ],
        [
          594.3,
          495.5
        ],
        [
          701.1,
          495.5
        ],
        [
          701.1,
          561.4
        ],
        [
          763.8,
          591.4
        ],
        [
          763.8,
          777.1
        ],
        [
          531.5,
          777.1
        ]
      ],
      "w": 6.4,
      "color": "#f2f3ea",
      "alpha": 0.75,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          594.3,
          495.5
        ],
        [
          607.6,
          486.5
        ],
        [
          621.0,
          478.9
        ],
        [
          634.3,
          473.8
        ],
        [
          647.7,
          472.0
        ],
        [
          661.0,
          473.8
        ],
        [
          674.4,
          478.9
        ],
        [
          687.8,
          486.5
        ],
        [
          701.1,
          495.5
        ]
      ],
      "w": 3.2,
      "color": "#f2f3ea",
      "alpha": 0.81,
      "t0": 1.1,
      "dur": 0.56,
      "jitter": 2.2
    },
    {
      "pts": [
        [
          1012.5,
          699.9
        ],
        [
          1008.6,
          720.4
        ],
        [
          997.3,
          738.4
        ],
        [
          979.9,
          751.8
        ],
        [
          958.7,
          758.9
        ],
        [
          936.1,
          758.9
        ],
        [
          914.8,
          751.8
        ],
        [
          897.5,
          738.4
        ],
        [
          886.2,
          720.4
        ],
        [
          882.3,
          699.9
        ],
        [
          886.2,
          679.4
        ],
        [
          897.5,
          661.4
        ],
        [
          914.8,
          648.0
        ],
        [
          936.1,
          640.9
        ],
        [
          958.7,
          640.9
        ],
        [
          979.9,
          648.0
        ],
        [
          997.3,
          661.4
        ],
        [
          1008.6,
          679.4
        ],
        [
          1012.5,
          699.9
        ]
      ],
      "w": 4.9,
      "color": "#f2f3ea",
      "alpha": 0.81,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          862.7,
          774.8
        ],
        [
          1025.5,
          768.2
        ]
      ],
      "w": 3.8,
      "color": "#f2f3ea",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.59,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          1294.5,
          719.7
        ],
        [
          1291.2,
          736.8
        ],
        [
          1281.8,
          751.7
        ],
        [
          1267.4,
          762.8
        ],
        [
          1249.8,
          768.7
        ],
        [
          1231.0,
          768.7
        ],
        [
          1213.4,
          762.8
        ],
        [
          1199.0,
          751.7
        ],
        [
          1189.6,
          736.8
        ],
        [
          1186.3,
          719.7
        ],
        [
          1189.6,
          702.7
        ],
        [
          1199.0,
          687.8
        ],
        [
          1213.4,
          676.7
        ],
        [
          1231.0,
          670.7
        ],
        [
          1249.8,
          670.7
        ],
        [
          1267.4,
          676.7
        ],
        [
          1281.8,
          687.8
        ],
        [
          1291.2,
          702.7
        ],
        [
          1294.5,
          719.7
        ]
      ],
      "w": 4.6,
      "color": "#f2f3ea",
      "alpha": 0.77,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          1170.1,
          781.9
        ],
        [
          1305.3,
          776.5
        ]
      ],
      "w": 3.2,
      "color": "#f2f3ea",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.45,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          578.4,
          683.8
        ],
        [
          615.6,
          647.8
        ]
      ],
      "w": 4.0,
      "color": "#f2f3ea",
      "alpha": 0.37,
      "t0": 2.42,
      "dur": 0.3,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          694.6,
          707.8
        ],
        [
          731.7,
          671.9
        ]
      ],
      "w": 4.2,
      "color": "#f2f3ea",
      "alpha": 0.6,
      "t0": 2.44,
      "dur": 0.3,
      "jitter": 2.2
    },
    {
      "pts": [
        [
          572.8,
          697.8
        ],
        [
          609.9,
          661.9
        ]
      ],
      "w": 2.3,
      "color": "#f2f3ea",
      "alpha": 0.65,
      "t0": 2.23,
      "dur": 0.3,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          735.2,
          720.7
        ],
        [
          772.3,
          684.8
        ]
      ],
      "w": 4.2,
      "color": "#f2f3ea",
      "alpha": 0.7,
      "t0": 1.81,
      "dur": 0.3,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          1244.7,
          537.2
        ],
        [
          1239.5,
          559.9
        ],
        [
          1224.2,
          580.8
        ],
        [
          1200.1,
          598.2
        ],
        [
          1169.1,
          610.6
        ],
        [
          1133.8,
          617.1
        ],
        [
          1096.9,
          617.1
        ],
        [
          1061.6,
          610.6
        ],
        [
          1030.6,
          598.2
        ],
        [
          1006.5,
          580.8
        ],
        [
          991.2,
          559.9
        ],
        [
          986.0,
          537.2
        ],
        [
          991.2,
          514.4
        ],
        [
          1006.5,
          493.5
        ],
        [
          1030.6,
          476.2
        ],
        [
          1061.6,
          463.8
        ],
        [
          1096.9,
          457.3
        ],
        [
          1133.8,
          457.3
        ],
        [
          1169.1,
          463.8
        ],
        [
          1200.1,
          476.2
        ],
        [
          1224.2,
          493.5
        ],
        [
          1239.5,
          514.4
        ],
        [
          1244.7,
          537.2
        ]
      ],
      "w": 4.6,
      "color": "#e6d06a",
      "alpha": 0.73,
      "t0": 2.46,
      "dur": 0.7,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          833.5,
          627.3
        ],
        [
          1011.8,
          557.9
        ]
      ],
      "w": 3.8,
      "color": "#e6d06a",
      "alpha": 0.91,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          1011.8,
          557.9
        ],
        [
          993.2,
          526.8
        ]
      ],
      "w": 3,
      "color": "#e6d06a",
      "alpha": 0.91,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 0.8
    },
    {
      "pts": [
        [
          1011.8,
          557.9
        ],
        [
          1006.7,
          580.7
        ]
      ],
      "w": 3,
      "color": "#e6d06a",
      "alpha": 0.9,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 2.4
    }
  ],
  "washes": [],
  "gridBoard": false,
  "chalk": true,
  "highlights": [
    {
      "x": 245.6,
      "y": 798.7,
      "w": 335.7,
      "h": 19.4,
      "color": "#e6d06a",
      "t0": 3.01
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
