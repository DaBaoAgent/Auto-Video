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
          728.4
        ],
        [
          1267.2,
          741.3
        ]
      ],
      "w": 5.3,
      "color": "#232323",
      "alpha": 0.94,
      "t0": 0.1,
      "dur": 0.5,
      "jitter": 2.4
    },
    {
      "pts": [
        [
          519.7,
          728.4
        ],
        [
          519.7,
          520.2
        ],
        [
          586.4,
          486.6
        ],
        [
          586.4,
          412.8
        ],
        [
          700.1,
          412.8
        ],
        [
          700.1,
          486.6
        ],
        [
          766.9,
          520.2
        ],
        [
          766.9,
          728.4
        ],
        [
          519.7,
          728.4
        ]
      ],
      "w": 6.5,
      "color": "#232323",
      "alpha": 0.89,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.4
    },
    {
      "pts": [
        [
          586.4,
          412.8
        ],
        [
          600.6,
          403.2
        ],
        [
          614.9,
          395.1
        ],
        [
          629.1,
          389.7
        ],
        [
          643.3,
          387.8
        ],
        [
          657.5,
          389.7
        ],
        [
          671.7,
          395.1
        ],
        [
          685.9,
          403.2
        ],
        [
          700.1,
          412.8
        ]
      ],
      "w": 4.4,
      "color": "#232323",
      "alpha": 0.89,
      "t0": 1.1,
      "dur": 0.35,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          1064.7,
          649.0
        ],
        [
          1061.0,
          668.6
        ],
        [
          1050.2,
          685.8
        ],
        [
          1033.6,
          698.6
        ],
        [
          1013.3,
          705.4
        ],
        [
          991.7,
          705.4
        ],
        [
          971.4,
          698.6
        ],
        [
          954.9,
          685.8
        ],
        [
          944.1,
          668.6
        ],
        [
          940.3,
          649.0
        ],
        [
          944.1,
          629.5
        ],
        [
          954.9,
          612.2
        ],
        [
          971.4,
          599.5
        ],
        [
          991.7,
          592.7
        ],
        [
          1013.3,
          592.7
        ],
        [
          1033.6,
          599.5
        ],
        [
          1050.2,
          612.2
        ],
        [
          1061.0,
          629.5
        ],
        [
          1064.7,
          649.0
        ]
      ],
      "w": 4.7,
      "color": "#232323",
      "alpha": 0.78,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          921.7,
          720.6
        ],
        [
          1077.2,
          714.3
        ]
      ],
      "w": 3.7,
      "color": "#232323",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.53,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          1335.0,
          654.2
        ],
        [
          1331.1,
          674.3
        ],
        [
          1320.1,
          691.9
        ],
        [
          1303.1,
          705.0
        ],
        [
          1282.3,
          711.9
        ],
        [
          1260.2,
          711.9
        ],
        [
          1239.4,
          705.0
        ],
        [
          1222.4,
          691.9
        ],
        [
          1211.4,
          674.3
        ],
        [
          1207.5,
          654.2
        ],
        [
          1211.4,
          634.2
        ],
        [
          1222.4,
          616.5
        ],
        [
          1239.4,
          603.4
        ],
        [
          1260.2,
          596.5
        ],
        [
          1282.3,
          596.5
        ],
        [
          1303.1,
          603.4
        ],
        [
          1320.1,
          616.5
        ],
        [
          1331.1,
          634.2
        ],
        [
          1335.0,
          654.2
        ]
      ],
      "w": 5.5,
      "color": "#232323",
      "alpha": 0.77,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          1188.4,
          727.5
        ],
        [
          1347.7,
          721.1
        ]
      ],
      "w": 3.8,
      "color": "#232323",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.43,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          694.6,
          640.9
        ],
        [
          734.1,
          600.6
        ]
      ],
      "w": 2.3,
      "color": "#232323",
      "alpha": 0.5,
      "t0": 2.43,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          637.6,
          590.6
        ],
        [
          677.2,
          550.3
        ]
      ],
      "w": 3.5,
      "color": "#232323",
      "alpha": 0.66,
      "t0": 1.72,
      "dur": 0.3,
      "jitter": 2.4
    },
    {
      "pts": [
        [
          731.1,
          639.9
        ],
        [
          770.6,
          599.6
        ]
      ],
      "w": 4.0,
      "color": "#232323",
      "alpha": 0.52,
      "t0": 2.08,
      "dur": 0.3,
      "jitter": 2.4
    },
    {
      "pts": [
        [
          551.3,
          678.3
        ],
        [
          590.9,
          638.0
        ]
      ],
      "w": 3.1,
      "color": "#232323",
      "alpha": 0.43,
      "t0": 1.99,
      "dur": 0.3,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          644.1,
          583.4
        ],
        [
          683.7,
          543.1
        ]
      ],
      "w": 2.8,
      "color": "#232323",
      "alpha": 0.57,
      "t0": 1.9,
      "dur": 0.3,
      "jitter": 1.4
    },
    {
      "pts": [
        [
          1186.9,
          414.7
        ],
        [
          1180.2,
          443.8
        ],
        [
          1160.6,
          470.5
        ],
        [
          1129.8,
          492.7
        ],
        [
          1090.2,
          508.6
        ],
        [
          1045.0,
          516.9
        ],
        [
          998.0,
          516.9
        ],
        [
          952.8,
          508.6
        ],
        [
          913.2,
          492.7
        ],
        [
          882.4,
          470.5
        ],
        [
          862.8,
          443.8
        ],
        [
          856.1,
          414.7
        ],
        [
          862.8,
          385.7
        ],
        [
          882.4,
          358.9
        ],
        [
          913.2,
          336.7
        ],
        [
          952.8,
          320.9
        ],
        [
          998.0,
          312.6
        ],
        [
          1045.0,
          312.6
        ],
        [
          1090.2,
          320.9
        ],
        [
          1129.8,
          336.7
        ],
        [
          1160.6,
          358.9
        ],
        [
          1180.2,
          385.7
        ],
        [
          1186.9,
          414.7
        ]
      ],
      "w": 4.5,
      "color": "#37a06b",
      "alpha": 0.82,
      "t0": 2.78,
      "dur": 0.7,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          841.0,
          560.5
        ],
        [
          889.2,
          441.2
        ]
      ],
      "w": 3.1,
      "color": "#37a06b",
      "alpha": 0.79,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.4
    },
    {
      "pts": [
        [
          889.2,
          441.2
        ],
        [
          865.4,
          401.5
        ]
      ],
      "w": 3,
      "color": "#37a06b",
      "alpha": 0.77,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          889.2,
          441.2
        ],
        [
          882.6,
          470.3
        ]
      ],
      "w": 3,
      "color": "#37a06b",
      "alpha": 0.88,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 0.9
    }
  ],
  "washes": [],
  "gridBoard": true,
  "chalk": false,
  "highlights": [
    {
      "x": 221.8,
      "y": 750.0,
      "w": 312.9,
      "h": 19.4,
      "color": "#37a06b",
      "t0": 2.99
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
