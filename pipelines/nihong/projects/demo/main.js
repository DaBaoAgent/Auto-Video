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
          1444.8,
          487.3
        ],
        [
          1441.1,
          511.0
        ],
        [
          1430.1,
          534.0
        ],
        [
          1412.2,
          555.4
        ],
        [
          1387.9,
          574.7
        ],
        [
          1358.1,
          591.1
        ],
        [
          1323.7,
          604.2
        ],
        [
          1285.7,
          613.6
        ],
        [
          1245.5,
          618.9
        ],
        [
          1204.3,
          619.9
        ],
        [
          1163.4,
          616.7
        ],
        [
          1124.2,
          609.4
        ],
        [
          1087.8,
          598.1
        ],
        [
          1055.6,
          583.3
        ],
        [
          1028.4,
          565.4
        ],
        [
          1007.3,
          544.9
        ],
        [
          992.8,
          522.6
        ],
        [
          985.4,
          499.2
        ],
        [
          985.4,
          475.4
        ],
        [
          992.8,
          452.0
        ],
        [
          1007.3,
          429.7
        ],
        [
          1028.4,
          409.3
        ],
        [
          1055.6,
          391.4
        ],
        [
          1087.8,
          376.6
        ],
        [
          1124.2,
          365.3
        ],
        [
          1163.4,
          357.9
        ],
        [
          1204.3,
          354.7
        ],
        [
          1245.5,
          355.8
        ],
        [
          1285.7,
          361.1
        ],
        [
          1323.7,
          370.4
        ],
        [
          1358.1,
          383.6
        ],
        [
          1387.9,
          400.0
        ],
        [
          1412.2,
          419.3
        ],
        [
          1430.1,
          440.7
        ],
        [
          1441.1,
          463.6
        ],
        [
          1444.8,
          487.3
        ]
      ],
      "color": "#ff3ea5",
      "width": 4.8,
      "blur": 20
    },
    {
      "pts": [
        [
          1043.4,
          497.2
        ],
        [
          1042.0,
          533.2
        ],
        [
          1020.5,
          568.3
        ],
        [
          979.8,
          597.5
        ],
        [
          923.7,
          616.1
        ],
        [
          858.4,
          620.5
        ],
        [
          792.3,
          608.8
        ],
        [
          734.1,
          581.3
        ],
        [
          692.5,
          540.2
        ],
        [
          674.4,
          490.2
        ],
        [
          684.2,
          437.2
        ],
        [
          722.6,
          388.1
        ],
        [
          786.4,
          349.8
        ],
        [
          869.0,
          328.1
        ],
        [
          960.7,
          327.0
        ],
        [
          1050.0,
          348.0
        ],
        [
          1124.9,
          389.7
        ],
        [
          1174.6,
          447.8
        ],
        [
          1191.3,
          515.8
        ],
        [
          1170.7,
          585.4
        ],
        [
          1113.5,
          647.4
        ],
        [
          1025.2,
          693.4
        ],
        [
          915.5,
          716.6
        ],
        [
          797.7,
          712.7
        ],
        [
          686.7,
          681.0
        ],
        [
          597.0,
          624.1
        ],
        [
          541.4,
          548.2
        ],
        [
          528.7,
          462.2
        ],
        [
          562.4,
          376.8
        ],
        [
          640.4,
          302.9
        ],
        [
          754.4,
          250.7
        ],
        [
          891.3,
          227.7
        ],
        [
          1034.7,
          238.1
        ],
        [
          1166.2,
          282.0
        ]
      ],
      "color": "#4ff0e0",
      "width": 5.9,
      "blur": 20
    },
    {
      "pts": [
        [
          192.0,
          274.1
        ],
        [
          403.2,
          97.3
        ],
        [
          614.4,
          -12.9
        ],
        [
          825.6,
          -182.5
        ],
        [
          1036.8,
          -128.0
        ],
        [
          1248.0,
          10.8
        ],
        [
          1459.2,
          106.7
        ],
        [
          1670.4,
          84.2
        ],
        [
          1881.6,
          79.7
        ]
      ],
      "color": "#ffd166",
      "width": 5.7,
      "blur": 20
    }
  ],
  "dust": 313,
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
