// make · 马克笔白纸速写
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（board 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "make",
  "seed": "av:make",
  "family": "board",
  "w": 1920,
  "h": 1080,
  "bg": "#fbf9f2",
  "ink": "#1c2b3a",
  "accent": "#ff5a36",
  "board": "#fbf9f2",
  "strokes": [
    {
      "pts": [
        [
          96.0,
          792.2
        ],
        [
          1267.2,
          805.1
        ]
      ],
      "w": 8.6,
      "color": "#1c2b3a",
      "alpha": 0.73,
      "t0": 0.1,
      "dur": 0.73,
      "jitter": 0.8
    },
    {
      "pts": [
        [
          438.4,
          792.2
        ],
        [
          438.4,
          629.7
        ],
        [
          502.9,
          603.5
        ],
        [
          502.9,
          545.9
        ],
        [
          612.8,
          545.9
        ],
        [
          612.8,
          603.5
        ],
        [
          677.3,
          629.7
        ],
        [
          677.3,
          792.2
        ],
        [
          438.4,
          792.2
        ]
      ],
      "w": 5.0,
      "color": "#1c2b3a",
      "alpha": 0.86,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          502.9,
          545.9
        ],
        [
          516.7,
          536.7
        ],
        [
          530.4,
          528.8
        ],
        [
          544.1,
          523.6
        ],
        [
          557.9,
          521.7
        ],
        [
          571.6,
          523.6
        ],
        [
          585.3,
          528.8
        ],
        [
          599.1,
          536.7
        ],
        [
          612.8,
          545.9
        ]
      ],
      "w": 4.5,
      "color": "#1c2b3a",
      "alpha": 0.79,
      "t0": 1.1,
      "dur": 0.47,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          1059.7,
          734.0
        ],
        [
          1056.0,
          753.3
        ],
        [
          1045.3,
          770.3
        ],
        [
          1029.0,
          783.0
        ],
        [
          1008.9,
          789.7
        ],
        [
          987.5,
          789.7
        ],
        [
          967.4,
          783.0
        ],
        [
          951.1,
          770.3
        ],
        [
          940.4,
          753.3
        ],
        [
          936.7,
          734.0
        ],
        [
          940.4,
          714.6
        ],
        [
          951.1,
          697.6
        ],
        [
          967.4,
          684.9
        ],
        [
          987.5,
          678.2
        ],
        [
          1008.9,
          678.2
        ],
        [
          1029.0,
          684.9
        ],
        [
          1045.3,
          697.6
        ],
        [
          1056.0,
          714.6
        ],
        [
          1059.7,
          734.0
        ]
      ],
      "w": 5.5,
      "color": "#1c2b3a",
      "alpha": 0.92,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          918.2,
          804.7
        ],
        [
          1072.0,
          798.6
        ]
      ],
      "w": 2.1,
      "color": "#1c2b3a",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.53,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          1109.1,
          712.5
        ],
        [
          1105.8,
          729.5
        ],
        [
          1096.4,
          744.4
        ],
        [
          1082.1,
          755.5
        ],
        [
          1064.5,
          761.4
        ],
        [
          1045.8,
          761.4
        ],
        [
          1028.2,
          755.5
        ],
        [
          1013.8,
          744.4
        ],
        [
          1004.5,
          729.5
        ],
        [
          1001.2,
          712.5
        ],
        [
          1004.5,
          695.6
        ],
        [
          1013.8,
          680.6
        ],
        [
          1028.2,
          669.6
        ],
        [
          1045.8,
          663.7
        ],
        [
          1064.5,
          663.7
        ],
        [
          1082.1,
          669.6
        ],
        [
          1096.4,
          680.6
        ],
        [
          1105.8,
          695.6
        ],
        [
          1109.1,
          712.5
        ]
      ],
      "w": 4.1,
      "color": "#1c2b3a",
      "alpha": 0.75,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.4
    },
    {
      "pts": [
        [
          985.0,
          774.5
        ],
        [
          1119.8,
          769.1
        ]
      ],
      "w": 2.6,
      "color": "#1c2b3a",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.7,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          599.0,
          649.2
        ],
        [
          637.3,
          617.8
        ]
      ],
      "w": 3.4,
      "color": "#1c2b3a",
      "alpha": 0.51,
      "t0": 1.81,
      "dur": 0.3,
      "jitter": 1.4
    },
    {
      "pts": [
        [
          455.4,
          716.7
        ],
        [
          493.6,
          685.3
        ]
      ],
      "w": 4.4,
      "color": "#1c2b3a",
      "alpha": 0.42,
      "t0": 2.13,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          474.3,
          688.7
        ],
        [
          512.5,
          657.2
        ]
      ],
      "w": 4.3,
      "color": "#1c2b3a",
      "alpha": 0.53,
      "t0": 1.78,
      "dur": 0.3,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          648.7,
          725.1
        ],
        [
          686.9,
          693.6
        ]
      ],
      "w": 2.7,
      "color": "#1c2b3a",
      "alpha": 0.67,
      "t0": 2.37,
      "dur": 0.3,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          654.3,
          662.1
        ],
        [
          692.5,
          630.6
        ]
      ],
      "w": 4.3,
      "color": "#1c2b3a",
      "alpha": 0.67,
      "t0": 2.2,
      "dur": 0.3,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          490.4,
          745.1
        ],
        [
          528.6,
          713.7
        ]
      ],
      "w": 3.1,
      "color": "#1c2b3a",
      "alpha": 0.58,
      "t0": 1.95,
      "dur": 0.3,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          1201.6,
          470.7
        ],
        [
          1195.2,
          498.5
        ],
        [
          1176.5,
          524.1
        ],
        [
          1147.0,
          545.4
        ],
        [
          1109.0,
          560.6
        ],
        [
          1065.8,
          568.5
        ],
        [
          1020.7,
          568.5
        ],
        [
          977.4,
          560.6
        ],
        [
          939.5,
          545.4
        ],
        [
          910.0,
          524.1
        ],
        [
          891.2,
          498.5
        ],
        [
          884.8,
          470.7
        ],
        [
          891.2,
          442.8
        ],
        [
          910.0,
          417.2
        ],
        [
          939.5,
          396.0
        ],
        [
          977.4,
          380.8
        ],
        [
          1020.7,
          372.8
        ],
        [
          1065.8,
          372.8
        ],
        [
          1109.0,
          380.8
        ],
        [
          1147.0,
          396.0
        ],
        [
          1176.5,
          417.2
        ],
        [
          1195.2,
          442.8
        ],
        [
          1201.6,
          470.7
        ]
      ],
      "w": 4.0,
      "color": "#ff5a36",
      "alpha": 0.82,
      "t0": 2.09,
      "dur": 0.7,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          749.0,
          661.2
        ],
        [
          916.5,
          496.0
        ]
      ],
      "w": 3.8,
      "color": "#ff5a36",
      "alpha": 0.76,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 2.2
    },
    {
      "pts": [
        [
          916.5,
          496.0
        ],
        [
          893.7,
          458.0
        ]
      ],
      "w": 3,
      "color": "#ff5a36",
      "alpha": 0.82,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          916.5,
          496.0
        ],
        [
          910.2,
          523.9
        ]
      ],
      "w": 3,
      "color": "#ff5a36",
      "alpha": 0.86,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.1
    }
  ],
  "washes": [
    {
      "pts": [
        [
          366.7785675395236,
          556.3872939784656
        ],
        [
          748.9789143706383,
          569.4852554148322
        ],
        [
          820.6414794014725,
          792.1505998330654
        ],
        [
          319.0035241856342,
          792.1505998330654
        ]
      ],
      "color": "#ff5a36",
      "alpha": 0.28,
      "t0": 0.2
    },
    {
      "pts": [
        [
          96.0,
          792.1505998330654
        ],
        [
          1267.2,
          805.1105998330654
        ],
        [
          1267.2,
          993.6
        ],
        [
          96.0,
          993.6
        ]
      ],
      "color": "#1c2b3a",
      "alpha": 0.1,
      "t0": 0.4
    }
  ],
  "gridBoard": false,
  "chalk": false,
  "highlights": [
    {
      "x": 426.0,
      "y": 813.8,
      "w": 339.4,
      "h": 19.4,
      "color": "#ff5a36",
      "t0": 2.41
    }
  ],
  "label": {
    "zh": "马克笔白纸速写",
    "en": "Marker on Paper",
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
