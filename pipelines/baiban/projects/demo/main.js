// baiban · 白板讲解
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（board 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "baiban",
  "seed": "av:baiban",
  "family": "board",
  "w": 1920,
  "h": 1080,
  "bg": "#fcfcf8",
  "ink": "#1f2a33",
  "accent": "#2f7fd1",
  "board": "#fcfcf8",
  "strokes": [
    {
      "pts": [
        [
          96.0,
          760.7
        ],
        [
          1267.2,
          773.7
        ]
      ],
      "w": 6.1,
      "color": "#1f2a33",
      "alpha": 0.89,
      "t0": 0.1,
      "dur": 0.53,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          460.9,
          760.7
        ],
        [
          460.9,
          560.9
        ],
        [
          527.6,
          528.7
        ],
        [
          527.6,
          457.8
        ],
        [
          641.2,
          457.8
        ],
        [
          641.2,
          528.7
        ],
        [
          707.9,
          560.9
        ],
        [
          707.9,
          760.7
        ],
        [
          460.9,
          760.7
        ]
      ],
      "w": 4.4,
      "color": "#1f2a33",
      "alpha": 0.88,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 2.4
    },
    {
      "pts": [
        [
          527.6,
          457.8
        ],
        [
          541.8,
          448.2
        ],
        [
          556.0,
          440.1
        ],
        [
          570.2,
          434.7
        ],
        [
          584.4,
          432.8
        ],
        [
          598.6,
          434.7
        ],
        [
          612.8,
          440.1
        ],
        [
          627.0,
          448.2
        ],
        [
          641.2,
          457.8
        ]
      ],
      "w": 3.1,
      "color": "#1f2a33",
      "alpha": 0.81,
      "t0": 1.1,
      "dur": 0.58,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          1067.4,
          685.6
        ],
        [
          1063.9,
          704.1
        ],
        [
          1053.6,
          720.5
        ],
        [
          1037.9,
          732.6
        ],
        [
          1018.7,
          739.0
        ],
        [
          998.2,
          739.0
        ],
        [
          978.9,
          732.6
        ],
        [
          963.2,
          720.5
        ],
        [
          953.0,
          704.1
        ],
        [
          949.4,
          685.6
        ],
        [
          953.0,
          667.0
        ],
        [
          963.2,
          650.7
        ],
        [
          978.9,
          638.5
        ],
        [
          998.2,
          632.1
        ],
        [
          1018.7,
          632.1
        ],
        [
          1037.9,
          638.5
        ],
        [
          1053.6,
          650.7
        ],
        [
          1063.9,
          667.0
        ],
        [
          1067.4,
          685.6
        ]
      ],
      "w": 4.1,
      "color": "#1f2a33",
      "alpha": 0.76,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          931.7,
          753.4
        ],
        [
          1079.2,
          747.5
        ]
      ],
      "w": 2.5,
      "color": "#1f2a33",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.7,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          1239.8,
          697.8
        ],
        [
          1236.3,
          715.9
        ],
        [
          1226.3,
          731.8
        ],
        [
          1211.1,
          743.6
        ],
        [
          1192.3,
          749.9
        ],
        [
          1172.4,
          749.9
        ],
        [
          1153.6,
          743.6
        ],
        [
          1138.4,
          731.8
        ],
        [
          1128.4,
          715.9
        ],
        [
          1124.9,
          697.8
        ],
        [
          1128.4,
          679.8
        ],
        [
          1138.4,
          663.9
        ],
        [
          1153.6,
          652.1
        ],
        [
          1172.4,
          645.8
        ],
        [
          1192.3,
          645.8
        ],
        [
          1211.1,
          652.1
        ],
        [
          1226.3,
          663.9
        ],
        [
          1236.3,
          679.8
        ],
        [
          1239.8,
          697.8
        ]
      ],
      "w": 5.6,
      "color": "#1f2a33",
      "alpha": 0.94,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          1107.7,
          763.9
        ],
        [
          1251.3,
          758.1
        ]
      ],
      "w": 3.6,
      "color": "#1f2a33",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.61,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          589.4,
          722.8
        ],
        [
          628.9,
          684.1
        ]
      ],
      "w": 4.0,
      "color": "#1f2a33",
      "alpha": 0.37,
      "t0": 2.49,
      "dur": 0.3,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          612.8,
          588.4
        ],
        [
          652.3,
          549.7
        ]
      ],
      "w": 3.5,
      "color": "#1f2a33",
      "alpha": 0.66,
      "t0": 1.89,
      "dur": 0.3,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          654.7,
          693.7
        ],
        [
          694.2,
          655.0
        ]
      ],
      "w": 2.3,
      "color": "#1f2a33",
      "alpha": 0.45,
      "t0": 2.04,
      "dur": 0.3,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          583.2,
          727.4
        ],
        [
          622.7,
          688.7
        ]
      ],
      "w": 2.7,
      "color": "#1f2a33",
      "alpha": 0.57,
      "t0": 2.51,
      "dur": 0.3,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          473.4,
          719.0
        ],
        [
          512.9,
          680.3
        ]
      ],
      "w": 2.2,
      "color": "#1f2a33",
      "alpha": 0.46,
      "t0": 2.13,
      "dur": 0.3,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          559.0,
          589.1
        ],
        [
          598.5,
          550.4
        ]
      ],
      "w": 4.2,
      "color": "#1f2a33",
      "alpha": 0.59,
      "t0": 2.14,
      "dur": 0.3,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          682.0,
          601.4
        ],
        [
          721.5,
          562.7
        ]
      ],
      "w": 4.2,
      "color": "#1f2a33",
      "alpha": 0.52,
      "t0": 2.47,
      "dur": 0.3,
      "jitter": 1.4
    },
    {
      "pts": [
        [
          1339.0,
          523.2
        ],
        [
          1332.6,
          551.0
        ],
        [
          1313.9,
          576.6
        ],
        [
          1284.4,
          597.8
        ],
        [
          1246.6,
          613.0
        ],
        [
          1203.4,
          620.9
        ],
        [
          1158.3,
          620.9
        ],
        [
          1115.1,
          613.0
        ],
        [
          1077.3,
          597.8
        ],
        [
          1047.8,
          576.6
        ],
        [
          1029.1,
          551.0
        ],
        [
          1022.7,
          523.2
        ],
        [
          1029.1,
          495.4
        ],
        [
          1047.8,
          469.8
        ],
        [
          1077.3,
          448.6
        ],
        [
          1115.1,
          433.4
        ],
        [
          1158.3,
          425.5
        ],
        [
          1203.4,
          425.5
        ],
        [
          1246.6,
          433.4
        ],
        [
          1284.4,
          448.6
        ],
        [
          1313.9,
          469.8
        ],
        [
          1332.6,
          495.4
        ],
        [
          1339.0,
          523.2
        ]
      ],
      "w": 5.2,
      "color": "#2f7fd1",
      "alpha": 0.82,
      "t0": 2.24,
      "dur": 0.7,
      "jitter": 2.0
    },
    {
      "pts": [
        [
          782.0,
          599.6
        ],
        [
          1054.3,
          548.5
        ]
      ],
      "w": 3.1,
      "color": "#2f7fd1",
      "alpha": 0.74,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          1054.3,
          548.5
        ],
        [
          1031.5,
          510.5
        ]
      ],
      "w": 3,
      "color": "#2f7fd1",
      "alpha": 0.9,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          1054.3,
          548.5
        ],
        [
          1048.0,
          576.3
        ]
      ],
      "w": 3,
      "color": "#2f7fd1",
      "alpha": 0.83,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.8
    }
  ],
  "washes": [],
  "gridBoard": true,
  "chalk": false,
  "highlights": [
    {
      "x": 570.5,
      "y": 782.3,
      "w": 299.9,
      "h": 19.4,
      "color": "#2f7fd1",
      "t0": 2.53
    }
  ],
  "label": {
    "zh": "白板讲解",
    "en": "Whiteboard Explainer",
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
