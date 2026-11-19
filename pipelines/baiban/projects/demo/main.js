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
          776.2
        ],
        [
          1267.2,
          789.2
        ]
      ],
      "w": 6.6,
      "color": "#1f2a33",
      "alpha": 0.73,
      "t0": 0.1,
      "dur": 0.71,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          366.5,
          776.2
        ],
        [
          366.5,
          575.6
        ],
        [
          420.1,
          543.2
        ],
        [
          420.1,
          472.0
        ],
        [
          511.3,
          472.0
        ],
        [
          511.3,
          543.2
        ],
        [
          564.9,
          575.6
        ],
        [
          564.9,
          776.2
        ],
        [
          366.5,
          776.2
        ]
      ],
      "w": 4.8,
      "color": "#1f2a33",
      "alpha": 0.85,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 2.2
    },
    {
      "pts": [
        [
          420.1,
          472.0
        ],
        [
          431.5,
          464.4
        ],
        [
          442.9,
          457.8
        ],
        [
          454.3,
          453.5
        ],
        [
          465.7,
          452.0
        ],
        [
          477.1,
          453.5
        ],
        [
          488.5,
          457.8
        ],
        [
          499.9,
          464.4
        ],
        [
          511.3,
          472.0
        ]
      ],
      "w": 3.6,
      "color": "#1f2a33",
      "alpha": 0.77,
      "t0": 1.1,
      "dur": 0.77,
      "jitter": 2.3
    },
    {
      "pts": [
        [
          819.4,
          713.1
        ],
        [
          816.2,
          729.8
        ],
        [
          807.1,
          744.4
        ],
        [
          793.0,
          755.3
        ],
        [
          775.7,
          761.0
        ],
        [
          757.4,
          761.0
        ],
        [
          740.1,
          755.3
        ],
        [
          726.1,
          744.4
        ],
        [
          716.9,
          729.8
        ],
        [
          713.7,
          713.1
        ],
        [
          716.9,
          696.5
        ],
        [
          726.1,
          681.9
        ],
        [
          740.1,
          671.0
        ],
        [
          757.4,
          665.2
        ],
        [
          775.7,
          665.2
        ],
        [
          793.0,
          671.0
        ],
        [
          807.1,
          681.9
        ],
        [
          816.2,
          696.5
        ],
        [
          819.4,
          713.1
        ]
      ],
      "w": 3.3,
      "color": "#1f2a33",
      "alpha": 0.76,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          697.8,
          773.9
        ],
        [
          830.0,
          768.6
        ]
      ],
      "w": 3.3,
      "color": "#1f2a33",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.65,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          988.9,
          711.4
        ],
        [
          985.7,
          728.1
        ],
        [
          976.5,
          742.8
        ],
        [
          962.4,
          753.7
        ],
        [
          945.2,
          759.5
        ],
        [
          926.8,
          759.5
        ],
        [
          909.5,
          753.7
        ],
        [
          895.4,
          742.8
        ],
        [
          886.2,
          728.1
        ],
        [
          883.0,
          711.4
        ],
        [
          886.2,
          694.8
        ],
        [
          895.4,
          680.1
        ],
        [
          909.5,
          669.2
        ],
        [
          926.8,
          663.4
        ],
        [
          945.2,
          663.4
        ],
        [
          962.4,
          669.2
        ],
        [
          976.5,
          680.1
        ],
        [
          985.7,
          694.8
        ],
        [
          988.9,
          711.4
        ]
      ],
      "w": 5.2,
      "color": "#1f2a33",
      "alpha": 0.88,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          867.1,
          772.4
        ],
        [
          999.5,
          767.1
        ]
      ],
      "w": 3.6,
      "color": "#1f2a33",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.51,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          555.4,
          631.7
        ],
        [
          587.1,
          592.9
        ]
      ],
      "w": 3.8,
      "color": "#1f2a33",
      "alpha": 0.47,
      "t0": 2.53,
      "dur": 0.3,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          562.8,
          691.8
        ],
        [
          594.5,
          653.0
        ]
      ],
      "w": 2.5,
      "color": "#1f2a33",
      "alpha": 0.46,
      "t0": 1.62,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          487.5,
          693.9
        ],
        [
          519.3,
          655.0
        ]
      ],
      "w": 2.3,
      "color": "#1f2a33",
      "alpha": 0.67,
      "t0": 2.27,
      "dur": 0.3,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          451.2,
          734.2
        ],
        [
          483.0,
          695.4
        ]
      ],
      "w": 2.2,
      "color": "#1f2a33",
      "alpha": 0.48,
      "t0": 1.64,
      "dur": 0.3,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          360.9,
          716.6
        ],
        [
          392.7,
          677.8
        ]
      ],
      "w": 3.5,
      "color": "#1f2a33",
      "alpha": 0.53,
      "t0": 1.66,
      "dur": 0.3,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          1308.2,
          416.7
        ],
        [
          1300.7,
          449.3
        ],
        [
          1278.8,
          479.3
        ],
        [
          1244.2,
          504.1
        ],
        [
          1199.8,
          521.9
        ],
        [
          1149.2,
          531.2
        ],
        [
          1096.5,
          531.2
        ],
        [
          1045.8,
          521.9
        ],
        [
          1001.5,
          504.1
        ],
        [
          966.9,
          479.3
        ],
        [
          945.0,
          449.3
        ],
        [
          937.5,
          416.7
        ],
        [
          945.0,
          384.2
        ],
        [
          966.9,
          354.2
        ],
        [
          1001.5,
          329.3
        ],
        [
          1045.8,
          311.6
        ],
        [
          1096.5,
          302.3
        ],
        [
          1149.2,
          302.3
        ],
        [
          1199.8,
          311.6
        ],
        [
          1244.2,
          329.3
        ],
        [
          1278.8,
          354.2
        ],
        [
          1300.7,
          384.2
        ],
        [
          1308.2,
          416.7
        ]
      ],
      "w": 4.9,
      "color": "#2f7fd1",
      "alpha": 0.93,
      "t0": 2.7,
      "dur": 0.7,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          624.5,
          614.4
        ],
        [
          974.6,
          446.4
        ]
      ],
      "w": 4.3,
      "color": "#2f7fd1",
      "alpha": 0.77,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 1.3
    },
    {
      "pts": [
        [
          974.6,
          446.4
        ],
        [
          947.9,
          401.9
        ]
      ],
      "w": 3,
      "color": "#2f7fd1",
      "alpha": 0.79,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 2.4
    },
    {
      "pts": [
        [
          974.6,
          446.4
        ],
        [
          967.2,
          479.0
        ]
      ],
      "w": 3,
      "color": "#2f7fd1",
      "alpha": 0.89,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 2.3
    }
  ],
  "washes": [],
  "gridBoard": true,
  "chalk": false,
  "highlights": [
    {
      "x": 203.4,
      "y": 797.8,
      "w": 421.3,
      "h": 19.4,
      "color": "#2f7fd1",
      "t0": 2.7
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
