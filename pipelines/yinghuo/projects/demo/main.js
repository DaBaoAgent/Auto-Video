// yinghuo · 萤火光点
// 画面全部由本仓库的 vendor/runtime/stylekit.js 在运行时画出来（neon 族），
// SPEC 里的形状坐标、色板、节拍在生成时就按 id 播种定死，不依赖任何外部脚本。
const SPEC = {
  "id": "yinghuo",
  "seed": "av:yinghuo",
  "family": "neon",
  "w": 1920,
  "h": 1080,
  "bg": "#05090a",
  "ink": "#d8fff6",
  "accent": "#8fffe0",
  "paths": [
    {
      "pts": [
        [
          192.0,
          345.5
        ],
        [
          403.2,
          451.1
        ],
        [
          614.4,
          385.2
        ],
        [
          825.6,
          300.7
        ],
        [
          1036.8,
          384.0
        ],
        [
          1248.0,
          507.8
        ],
        [
          1459.2,
          611.8
        ],
        [
          1670.4,
          700.6
        ],
        [
          1881.6,
          684.9
        ]
      ],
      "color": "#8fffe0",
      "width": 3.1,
      "blur": 20
    },
    {
      "pts": [
        [
          786.0,
          594.8
        ],
        [
          782.7,
          620.5
        ],
        [
          772.7,
          645.4
        ],
        [
          756.4,
          668.7
        ],
        [
          734.4,
          689.6
        ],
        [
          707.3,
          707.4
        ],
        [
          676.0,
          721.6
        ],
        [
          641.5,
          731.8
        ],
        [
          604.9,
          737.6
        ],
        [
          567.5,
          738.7
        ],
        [
          530.3,
          735.2
        ],
        [
          494.6,
          727.3
        ],
        [
          461.6,
          715.0
        ],
        [
          432.3,
          698.9
        ],
        [
          407.6,
          679.5
        ],
        [
          388.4,
          657.3
        ],
        [
          375.2,
          633.1
        ],
        [
          368.5,
          607.7
        ],
        [
          368.5,
          581.8
        ],
        [
          375.2,
          556.4
        ],
        [
          388.4,
          532.2
        ],
        [
          407.6,
          510.1
        ],
        [
          432.3,
          490.6
        ],
        [
          461.6,
          474.5
        ],
        [
          494.6,
          462.3
        ],
        [
          530.3,
          454.3
        ],
        [
          567.5,
          450.8
        ],
        [
          604.9,
          452.0
        ],
        [
          641.5,
          457.7
        ],
        [
          676.0,
          467.9
        ],
        [
          707.3,
          482.1
        ],
        [
          734.4,
          500.0
        ],
        [
          756.4,
          520.9
        ],
        [
          772.7,
          544.1
        ],
        [
          782.7,
          569.0
        ],
        [
          786.0,
          594.8
        ]
      ],
      "color": "#4ff0e0",
      "width": 4.3,
      "blur": 28
    },
    {
      "pts": [
        [
          115.2,
          776.8
        ],
        [
          173.5,
          798.1
        ],
        [
          231.7,
          808.9
        ],
        [
          290.0,
          795.2
        ],
        [
          348.2,
          791.6
        ],
        [
          406.5,
          795.5
        ],
        [
          464.8,
          649.8
        ],
        [
          523.0,
          689.6
        ],
        [
          581.3,
          642.1
        ],
        [
          639.6,
          657.3
        ],
        [
          697.8,
          627.0
        ],
        [
          756.1,
          446.5
        ],
        [
          814.3,
          442.3
        ],
        [
          872.6,
          481.8
        ],
        [
          930.9,
          451.7
        ],
        [
          989.1,
          454.2
        ],
        [
          1047.4,
          622.2
        ],
        [
          1105.7,
          491.5
        ],
        [
          1163.9,
          468.0
        ],
        [
          1222.2,
          685.7
        ],
        [
          1280.4,
          449.6
        ],
        [
          1338.7,
          676.3
        ],
        [
          1397.0,
          512.0
        ],
        [
          1455.2,
          517.3
        ],
        [
          1513.5,
          539.8
        ],
        [
          1571.8,
          483.5
        ],
        [
          1630.0,
          768.3
        ],
        [
          1688.3,
          506.6
        ],
        [
          1746.5,
          466.0
        ],
        [
          1804.8,
          778.8
        ]
      ],
      "color": "#ffd166",
      "width": 4.6,
      "blur": 28
    }
  ],
  "dust": 324,
  "scan": 0,
  "label": {
    "zh": "萤火光点",
    "en": "Firefly Pointillism",
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
