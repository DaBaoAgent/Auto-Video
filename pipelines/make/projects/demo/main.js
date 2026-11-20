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
          762.9
        ],
        [
          1267.2,
          775.9
        ]
      ],
      "w": 8.6,
      "color": "#1c2b3a",
      "alpha": 0.74,
      "t0": 0.1,
      "dur": 0.41,
      "jitter": 1.7
    },
    {
      "pts": [
        [
          581.3,
          762.9
        ],
        [
          581.3,
          562.7
        ],
        [
          629.4,
          530.4
        ],
        [
          629.4,
          459.3
        ],
        [
          711.2,
          459.3
        ],
        [
          711.2,
          530.4
        ],
        [
          759.3,
          562.7
        ],
        [
          759.3,
          762.9
        ],
        [
          581.3,
          762.9
        ]
      ],
      "w": 5.8,
      "color": "#1c2b3a",
      "alpha": 0.88,
      "t0": 0.3,
      "dur": 0.9,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          629.4,
          459.3
        ],
        [
          639.6,
          452.4
        ],
        [
          649.8,
          446.6
        ],
        [
          660.1,
          442.7
        ],
        [
          670.3,
          441.3
        ],
        [
          680.5,
          442.7
        ],
        [
          690.8,
          446.6
        ],
        [
          701.0,
          452.4
        ],
        [
          711.2,
          459.3
        ]
      ],
      "w": 3.5,
      "color": "#1c2b3a",
      "alpha": 0.88,
      "t0": 1.1,
      "dur": 0.48,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          1023.3,
          713.4
        ],
        [
          1020.6,
          727.4
        ],
        [
          1012.9,
          739.7
        ],
        [
          1001.1,
          748.8
        ],
        [
          986.6,
          753.7
        ],
        [
          971.2,
          753.7
        ],
        [
          956.7,
          748.8
        ],
        [
          944.9,
          739.7
        ],
        [
          937.1,
          727.4
        ],
        [
          934.5,
          713.4
        ],
        [
          937.1,
          699.5
        ],
        [
          944.9,
          687.2
        ],
        [
          956.7,
          678.0
        ],
        [
          971.2,
          673.2
        ],
        [
          986.6,
          673.2
        ],
        [
          1001.1,
          678.0
        ],
        [
          1012.9,
          687.2
        ],
        [
          1020.6,
          699.5
        ],
        [
          1023.3,
          713.4
        ]
      ],
      "w": 3.7,
      "color": "#1c2b3a",
      "alpha": 0.8,
      "t0": 1.3,
      "dur": 0.6,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          921.1,
          764.5
        ],
        [
          1032.2,
          760.1
        ]
      ],
      "w": 3.8,
      "color": "#1c2b3a",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.38,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          1102.8,
          711.7
        ],
        [
          1100.0,
          726.4
        ],
        [
          1091.9,
          739.3
        ],
        [
          1079.5,
          748.9
        ],
        [
          1064.2,
          754.0
        ],
        [
          1048.0,
          754.0
        ],
        [
          1032.8,
          748.9
        ],
        [
          1020.4,
          739.3
        ],
        [
          1012.3,
          726.4
        ],
        [
          1009.4,
          711.7
        ],
        [
          1012.3,
          697.0
        ],
        [
          1020.4,
          684.1
        ],
        [
          1032.8,
          674.5
        ],
        [
          1048.0,
          669.4
        ],
        [
          1064.2,
          669.4
        ],
        [
          1079.5,
          674.5
        ],
        [
          1091.9,
          684.1
        ],
        [
          1100.0,
          697.0
        ],
        [
          1102.8,
          711.7
        ]
      ],
      "w": 4.4,
      "color": "#1c2b3a",
      "alpha": 0.8,
      "t0": 1.6,
      "dur": 0.6,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          995.4,
          765.4
        ],
        [
          1112.2,
          760.8
        ]
      ],
      "w": 3.8,
      "color": "#1c2b3a",
      "alpha": 0.5,
      "t0": 1.9,
      "dur": 0.57,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          617.6,
          658.3
        ],
        [
          646.1,
          619.5
        ]
      ],
      "w": 2.0,
      "color": "#1c2b3a",
      "alpha": 0.45,
      "t0": 2.38,
      "dur": 0.3,
      "jitter": 0.8
    },
    {
      "pts": [
        [
          746.2,
          645.4
        ],
        [
          774.6,
          606.7
        ]
      ],
      "w": 4.2,
      "color": "#1c2b3a",
      "alpha": 0.59,
      "t0": 1.73,
      "dur": 0.3,
      "jitter": 1.9
    },
    {
      "pts": [
        [
          656.1,
          656.6
        ],
        [
          684.6,
          617.9
        ]
      ],
      "w": 4.3,
      "color": "#1c2b3a",
      "alpha": 0.54,
      "t0": 1.98,
      "dur": 0.3,
      "jitter": 1.0
    },
    {
      "pts": [
        [
          653.9,
          661.3
        ],
        [
          682.4,
          622.5
        ]
      ],
      "w": 2.7,
      "color": "#1c2b3a",
      "alpha": 0.67,
      "t0": 1.65,
      "dur": 0.3,
      "jitter": 0.9
    },
    {
      "pts": [
        [
          618.2,
          659.9
        ],
        [
          646.7,
          621.1
        ]
      ],
      "w": 4.0,
      "color": "#1c2b3a",
      "alpha": 0.53,
      "t0": 2.3,
      "dur": 0.3,
      "jitter": 1.8
    },
    {
      "pts": [
        [
          708.7,
          708.7
        ],
        [
          737.2,
          669.9
        ]
      ],
      "w": 3.4,
      "color": "#1c2b3a",
      "alpha": 0.54,
      "t0": 2.27,
      "dur": 0.3,
      "jitter": 1.5
    },
    {
      "pts": [
        [
          593.2,
          606.2
        ],
        [
          621.7,
          567.5
        ]
      ],
      "w": 4.4,
      "color": "#1c2b3a",
      "alpha": 0.38,
      "t0": 2.41,
      "dur": 0.3,
      "jitter": 1.1
    },
    {
      "pts": [
        [
          1139.1,
          517.9
        ],
        [
          1133.7,
          541.3
        ],
        [
          1117.9,
          562.9
        ],
        [
          1093.1,
          580.8
        ],
        [
          1061.1,
          593.6
        ],
        [
          1024.6,
          600.3
        ],
        [
          986.7,
          600.3
        ],
        [
          950.2,
          593.6
        ],
        [
          918.2,
          580.8
        ],
        [
          893.4,
          562.9
        ],
        [
          877.6,
          541.3
        ],
        [
          872.2,
          517.9
        ],
        [
          877.6,
          494.4
        ],
        [
          893.4,
          472.9
        ],
        [
          918.2,
          454.9
        ],
        [
          950.2,
          442.1
        ],
        [
          986.7,
          435.4
        ],
        [
          1024.6,
          435.4
        ],
        [
          1061.1,
          442.1
        ],
        [
          1093.1,
          454.9
        ],
        [
          1117.9,
          472.9
        ],
        [
          1133.7,
          494.4
        ],
        [
          1139.1,
          517.9
        ]
      ],
      "w": 3.9,
      "color": "#ff5a36",
      "alpha": 0.83,
      "t0": 2.31,
      "dur": 0.7,
      "jitter": 1.2
    },
    {
      "pts": [
        [
          812.7,
          601.4
        ],
        [
          898.9,
          539.2
        ]
      ],
      "w": 3.0,
      "color": "#ff5a36",
      "alpha": 0.94,
      "t0": 2.6,
      "dur": 0.4,
      "jitter": 2.1
    },
    {
      "pts": [
        [
          898.9,
          539.2
        ],
        [
          879.7,
          507.2
        ]
      ],
      "w": 3,
      "color": "#ff5a36",
      "alpha": 0.92,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.6
    },
    {
      "pts": [
        [
          898.9,
          539.2
        ],
        [
          893.5,
          562.7
        ]
      ],
      "w": 3,
      "color": "#ff5a36",
      "alpha": 0.88,
      "t0": 2.9,
      "dur": 0.2,
      "jitter": 1.8
    }
  ],
  "washes": [
    {
      "pts": [
        [
          527.9058432779315,
          472.2303301175381
        ],
        [
          812.6827921980481,
          488.37907314593303
        ],
        [
          866.0784701205699,
          762.9077046286466
        ],
        [
          492.3087246629169,
          762.9077046286466
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
          762.9077046286466
        ],
        [
          1267.2,
          775.8677046286466
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
      "x": 499.7,
      "y": 784.5,
      "w": 329.8,
      "h": 19.4,
      "color": "#ff5a36",
      "t0": 2.49
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
