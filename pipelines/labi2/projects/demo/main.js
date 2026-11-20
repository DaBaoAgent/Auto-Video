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
          760.9
        ],
        [
          1267.2,
          773.8
        ]
      ],
      "w": 7.6,
      "color": "#2b241d",
      "alpha": 0.74,
      "t0": 0.1,
      "dur": 0.41,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          379.7,
          760.9
        ],
        [
          379.7,
          533.8
        ],
        [
          438.2,
          497.1
        ],
        [
          438.2,
          416.5
        ],
        [
          538.1,
          416.5
        ],
        [
          538.1,
          497.1
        ],
        [
          596.7,
          533.8
        ],
        [
          596.7,
          760.9
        ],
        [
          379.7,
          760.9
        ]
      ],
      "w": 4.6,
      "color": "#2b241d",
      "alpha": 0.81,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 0.8
    },
    {
      "pts": [
        [
          438.2,
          416.5
        ],
        [
          450.7,
          408.1
        ],
        [
          463.2,
          401.0
        ],
        [
          475.7,
          396.3
        ],
        [
          488.2,
          394.6
        ],
        [
          500.6,
          396.3
        ],
        [
          513.1,
          401.0
        ],
        [
          525.6,
          408.1
        ],
        [
          538.1,
          416.5
        ]
      ],
      "w": 3.2,
      "color": "#2b241d",
      "alpha": 0.94,
      "t0": 1.1,
      "dur": 0.8,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          770.3,
          689.4
        ],
        [
          767.4,
          704.8
        ],
        [
          758.8,
          718.4
        ],
        [
          745.8,
          728.4
        ],
        [
          729.8,
          733.8
        ],
        [
          712.8,
          733.8
        ],
        [
          696.7,
          728.4
        ],
        [
          683.7,
          718.4
        ],
        [
          675.2,
          704.8
        ],
        [
          672.2,
          689.4
        ],
        [
          675.2,
          673.9
        ],
        [
          683.7,
          660.4
        ],
        [
          696.7,
          650.3
        ],
        [
          712.8,
          644.9
        ],
        [
          729.8,
          644.9
        ],
        [
          745.8,
          650.3
        ],
        [
          758.8,
          660.4
        ],
        [
          767.4,
          673.9
        ],
        [
          770.3,
          689.4
        ]
      ],
      "w": 5.7,
      "color": "#2b241d",
      "alpha": 0.86,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          657.5,
          745.8
        ],
        [
          780.1,
          740.9
        ]
      ],
      "w": 2.1,
      "color": "#2b241d",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.56,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          894.0,
          700.2
        ],
        [
          890.7,
          717.7
        ],
        [
          881.1,
          733.0
        ],
        [
          866.3,
          744.4
        ],
        [
          848.2,
          750.5
        ],
        [
          829.0,
          750.5
        ],
        [
          810.9,
          744.4
        ],
        [
          796.2,
          733.0
        ],
        [
          786.5,
          717.7
        ],
        [
          783.2,
          700.2
        ],
        [
          786.5,
          682.8
        ],
        [
          796.2,
          667.5
        ],
        [
          810.9,
          656.1
        ],
        [
          829.0,
          650.0
        ],
        [
          848.2,
          650.0
        ],
        [
          866.3,
          656.1
        ],
        [
          881.1,
          667.5
        ],
        [
          890.7,
          682.8
        ],
        [
          894.0,
          700.2
        ]
      ],
      "w": 5.7,
      "color": "#2b241d",
      "alpha": 0.78,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          766.6,
          764.0
        ],
        [
          905.1,
          758.4
        ]
      ],
      "w": 2.0,
      "color": "#2b241d",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.52,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          456.4,
          722.2
        ],
        [
          491.1,
          678.3
        ]
      ],
      "w": 4.1,
      "color": "#2b241d",
      "alpha": 0.43,
      "t0": 2.05,
      "dur": 0.3,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          543.6,
          701.9
        ],
        [
          578.3,
          657.9
        ]
      ],
      "w": 2.3,
      "color": "#2b241d",
      "alpha": 0.63,
      "t0": 2.13,
      "dur": 0.3,
      "jitter": 0.8
    },
    {
      "pts": [
        [
          528.9,
          597.5
        ],
        [
          563.6,
          553.6
        ]
      ],
      "w": 4.1,
      "color": "#2b241d",
      "alpha": 0.61,
      "t0": 2.21,
      "dur": 0.3,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          514.8,
          630.2
        ],
        [
          549.6,
          586.2
        ]
      ],
      "w": 3.1,
      "color": "#2b241d",
      "alpha": 0.59,
      "t0": 1.88,
      "dur": 0.3,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          463.4,
          690.5
        ],
        [
          498.1,
          646.5
        ]
      ],
      "w": 3.6,
      "color": "#2b241d",
      "alpha": 0.46,
      "t0": 2.21,
      "dur": 0.3,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          373.2,
          595.0
        ],
        [
          407.9,
          551.1
        ]
      ],
      "w": 2.4,
      "color": "#2b241d",
      "alpha": 0.55,
      "t0": 2.09,
      "dur": 0.3,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          451.7,
          667.8
        ],
        [
          486.4,
          623.9
        ]
      ],
      "w": 2.8,
      "color": "#2b241d",
      "alpha": 0.66,
      "t0": 1.94,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          1179.2,
          545.5
        ],
        [
          1173.9,
          568.6
        ],
        [
          1158.3,
          589.8
        ],
        [
          1133.9,
          607.5
        ],
        [
          1102.4,
          620.1
        ],
        [
          1066.5,
          626.6
        ],
        [
          1029.1,
          626.6
        ],
        [
          993.3,
          620.1
        ],
        [
          961.8,
          607.5
        ],
        [
          937.3,
          589.8
        ],
        [
          921.8,
          568.6
        ],
        [
          916.5,
          545.5
        ],
        [
          921.8,
          522.4
        ],
        [
          937.3,
          501.2
        ],
        [
          961.8,
          483.5
        ],
        [
          993.3,
          470.9
        ],
        [
          1029.1,
          464.3
        ],
        [
          1066.5,
          464.3
        ],
        [
          1102.4,
          470.9
        ],
        [
          1133.9,
          483.5
        ],
        [
          1158.3,
          501.2
        ],
        [
          1173.9,
          522.4
        ],
        [
          1179.2,
          545.5
        ]
      ],
      "w": 3.8,
      "color": "#e07a3c",
      "alpha": 0.93,
      "t0": 2.02,
      "dur": 0.7,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          661.8,
          577.7
        ],
        [
          942.7,
          566.5
        ]
      ],
      "w": 2.8,
      "color": "#e07a3c",
      "alpha": 0.74,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          942.7,
          566.5
        ],
        [
          923.8,
          535.0
        ]
      ],
      "w": 3,
      "color": "#e07a3c",
      "alpha": 0.78,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          942.7,
          566.5
        ],
        [
          937.5,
          589.6
        ]
      ],
      "w": 3,
      "color": "#e07a3c",
      "alpha": 0.86,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.3
    }
  ],
  "washes": [],
  "gridBoard": false,
  "chalk": false,
  "highlights": [
    {
      "x": 370.1,
      "y": 782.5,
      "w": 400.2,
      "h": 19.4,
      "color": "#e07a3c",
      "t0": 2.43
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
