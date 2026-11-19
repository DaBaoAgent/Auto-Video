// nihong · 霓虹灯管
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（neon 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "nihong",
  "seed": "av:nihong",
  "family": "neon",
  "w": 1920,
  "h": 1080,
  "bg": "#07070c",
  "ink": "#ffe9f6",
  "accent": "#ff3ea5",
  "paths": [
    {
      "pts": [
        [
          1070.9,
          633.2
        ],
        [
          1073.0,
          658.3
        ],
        [
          1063.8,
          684.2
        ],
        [
          1043.1,
          708.4
        ],
        [
          1011.6,
          728.7
        ],
        [
          971.0,
          742.9
        ],
        [
          924.1,
          749.2
        ],
        [
          874.4,
          746.4
        ],
        [
          826.0,
          733.9
        ],
        [
          783.1,
          712.2
        ],
        [
          749.8,
          682.3
        ],
        [
          729.6,
          646.1
        ],
        [
          725.1,
          606.3
        ],
        [
          737.8,
          565.8
        ],
        [
          767.8,
          528.2
        ],
        [
          813.6,
          496.5
        ],
        [
          872.5,
          473.9
        ],
        [
          940.5,
          462.7
        ],
        [
          1012.5,
          464.6
        ],
        [
          1082.8,
          480.0
        ],
        [
          1145.7,
          508.6
        ],
        [
          1195.6,
          548.7
        ],
        [
          1227.8,
          597.6
        ],
        [
          1238.7,
          651.9
        ],
        [
          1226.5,
          707.4
        ],
        [
          1190.9,
          759.7
        ],
        [
          1133.8,
          804.6
        ],
        [
          1058.7,
          837.9
        ],
        [
          970.8,
          856.6
        ],
        [
          876.5,
          858.4
        ],
        [
          783.1,
          842.6
        ],
        [
          698.2,
          809.5
        ],
        [
          628.8,
          761.2
        ],
        [
          581.0,
          700.8
        ]
      ],
      "color": "#ff3ea5",
      "width": 3.1,
      "blur": 14
    },
    {
      "pts": [
        [
          849.4,
          487.5
        ],
        [
          847.3,
          514.8
        ],
        [
          828.6,
          540.9
        ],
        [
          794.7,
          561.2
        ],
        [
          749.8,
          571.9
        ],
        [
          699.9,
          570.2
        ],
        [
          652.7,
          555.5
        ],
        [
          615.9,
          528.7
        ],
        [
          596.4,
          493.3
        ],
        [
          598.6,
          454.1
        ],
        [
          623.8,
          417.1
        ],
        [
          669.8,
          388.1
        ],
        [
          730.9,
          372.5
        ],
        [
          798.6,
          373.4
        ],
        [
          862.7,
          391.9
        ],
        [
          913.2,
          426.3
        ],
        [
          941.2,
          472.2
        ],
        [
          941.1,
          523.3
        ],
        [
          911.2,
          571.9
        ],
        [
          854.5,
          610.4
        ],
        [
          778.1,
          632.4
        ],
        [
          692.6,
          633.6
        ],
        [
          610.7,
          612.6
        ],
        [
          545.2,
          571.6
        ],
        [
          506.8,
          515.7
        ],
        [
          502.7,
          452.9
        ],
        [
          535.3,
          392.3
        ],
        [
          601.2,
          343.2
        ],
        [
          692.0,
          313.7
        ],
        [
          795.0,
          309.0
        ],
        [
          895.2,
          331.1
        ],
        [
          977.1,
          377.7
        ],
        [
          1027.7,
          442.8
        ],
        [
          1038.0,
          517.2
        ]
      ],
      "color": "#4ff0e0",
      "width": 5.7,
      "blur": 28
    },
    {
      "pts": [
        [
          192.0,
          217.7
        ],
        [
          403.2,
          108.3
        ],
        [
          614.4,
          244.0
        ],
        [
          825.6,
          57.7
        ],
        [
          1036.8,
          170.6
        ],
        [
          1248.0,
          180.0
        ],
        [
          1459.2,
          329.2
        ],
        [
          1670.4,
          402.8
        ],
        [
          1881.6,
          392.2
        ]
      ],
      "color": "#ffd166",
      "width": 3.3,
      "blur": 20
    }
  ],
  "dust": 379,
  "scan": 0,
  "label": {
    "zh": "霓虹灯管",
    "en": "Neon Tubes",
    "station": "06 · 屏幕赛博",
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
