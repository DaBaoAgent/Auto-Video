// liuchang · 流场风线
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（neon 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "liuchang",
  "seed": "av:liuchang",
  "family": "neon",
  "w": 1920,
  "h": 1080,
  "bg": "#060812",
  "ink": "#dce8ff",
  "accent": "#7ab8ff",
  "paths": [
    {
      "pts": [
        [
          192.0,
          322.7
        ],
        [
          403.2,
          367.2
        ],
        [
          614.4,
          393.7
        ],
        [
          825.6,
          570.4
        ],
        [
          1036.8,
          396.4
        ],
        [
          1248.0,
          317.5
        ],
        [
          1459.2,
          306.6
        ],
        [
          1670.4,
          165.2
        ],
        [
          1881.6,
          299.7
        ]
      ],
      "color": "#7ab8ff",
      "width": 5.1,
      "blur": 20
    },
    {
      "pts": [
        [
          192.0,
          304.9
        ],
        [
          403.2,
          111.1
        ],
        [
          614.4,
          248.5
        ],
        [
          825.6,
          132.8
        ],
        [
          1036.8,
          40.5
        ],
        [
          1248.0,
          138.8
        ],
        [
          1459.2,
          92.2
        ],
        [
          1670.4,
          -58.6
        ],
        [
          1881.6,
          39.8
        ]
      ],
      "color": "#4ff0e0",
      "width": 4.4,
      "blur": 14
    },
    {
      "pts": [
        [
          115.2,
          790.2
        ],
        [
          173.5,
          756.6
        ],
        [
          231.7,
          720.3
        ],
        [
          290.0,
          654.8
        ],
        [
          348.2,
          674.5
        ],
        [
          406.5,
          608.8
        ],
        [
          464.8,
          595.5
        ],
        [
          523.0,
          510.9
        ],
        [
          581.3,
          575.6
        ],
        [
          639.6,
          487.2
        ],
        [
          697.8,
          496.3
        ],
        [
          756.1,
          490.5
        ],
        [
          814.3,
          610.0
        ],
        [
          872.6,
          494.6
        ],
        [
          930.9,
          492.6
        ],
        [
          989.1,
          645.6
        ],
        [
          1047.4,
          493.2
        ],
        [
          1105.7,
          812.7
        ],
        [
          1163.9,
          528.8
        ],
        [
          1222.2,
          814.5
        ],
        [
          1280.4,
          762.6
        ],
        [
          1338.7,
          723.1
        ],
        [
          1397.0,
          808.0
        ],
        [
          1455.2,
          813.9
        ],
        [
          1513.5,
          620.7
        ],
        [
          1571.8,
          626.3
        ],
        [
          1630.0,
          560.1
        ],
        [
          1688.3,
          723.4
        ],
        [
          1746.5,
          571.4
        ],
        [
          1804.8,
          646.6
        ]
      ],
      "color": "#ffd166",
      "width": 3.0,
      "blur": 14
    },
    {
      "pts": [
        [
          1245.9,
          652.1
        ],
        [
          1241.2,
          693.5
        ],
        [
          1227.1,
          733.6
        ],
        [
          1204.1,
          771.0
        ],
        [
          1173.0,
          804.6
        ],
        [
          1134.8,
          833.3
        ],
        [
          1090.6,
          856.2
        ],
        [
          1042.0,
          872.6
        ],
        [
          990.4,
          881.8
        ],
        [
          937.6,
          883.7
        ],
        [
          885.1,
          878.1
        ],
        [
          834.8,
          865.3
        ],
        [
          788.2,
          845.6
        ],
        [
          746.9,
          819.7
        ],
        [
          712.1,
          788.4
        ],
        [
          684.9,
          752.7
        ],
        [
          666.3,
          713.8
        ],
        [
          656.9,
          672.9
        ],
        [
          656.9,
          631.3
        ],
        [
          666.3,
          590.4
        ],
        [
          684.9,
          551.5
        ],
        [
          712.1,
          515.9
        ],
        [
          746.9,
          484.6
        ],
        [
          788.2,
          458.6
        ],
        [
          834.8,
          439.0
        ],
        [
          885.1,
          426.1
        ],
        [
          937.6,
          420.5
        ],
        [
          990.4,
          422.4
        ],
        [
          1042.0,
          431.6
        ],
        [
          1090.6,
          448.0
        ],
        [
          1134.8,
          470.9
        ],
        [
          1173.0,
          499.6
        ],
        [
          1204.1,
          533.2
        ],
        [
          1227.1,
          570.7
        ],
        [
          1241.2,
          610.7
        ],
        [
          1245.9,
          652.1
        ]
      ],
      "color": "#8a7bff",
      "width": 5.5,
      "blur": 20
    }
  ],
  "dust": 489,
  "scan": 4,
  "label": {
    "zh": "流场风线",
    "en": "Flow-field Wind Lines",
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
