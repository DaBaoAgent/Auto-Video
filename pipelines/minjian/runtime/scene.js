/* minjian · 民间故事绘本（Auto-Video 自研画法脚本）
   媒介：HB 铅笔起稿，奶油色卡纸上先用水粉铺前景（不透明、干笔边），
   越往远越薄，最后只剩淡淡一层水色和没盖住的铅笔线。
   实现：远近分层由本文件算；铅笔线先出现，前景水粉最后压上去。 */
(() => {
  const W = 1920, H = 1080;
  const PAPER = '#f3e9d2';

  const hillsFar = [
    [[0, 690], [180, 620], [380, 664], [560, 600], [760, 648], [940, 604], [1120, 650], [1320, 606], [1520, 648], [1720, 612], [1920, 646], [1920, 760], [0, 760]],
    [[0, 760], [240, 706], [470, 748], [700, 700], [940, 744], [1180, 698], [1420, 742], [1660, 700], [1920, 740], [1920, 830], [0, 830]],
  ];
  const pathRoad = [[1082, 726], [1116, 752], [1088, 806], [1026, 884], [962, 978], [934, 1080], [1096, 1080], [1044, 978], [1078, 884], [1124, 806], [1112, 752]];
  const house = [[1180, 700], [1300, 646], [1420, 700], [1420, 790], [1180, 790]];
  const roof = [[1150, 704], [1300, 628], [1450, 704]];
  const pineA = { x: 620, y: 706, h: 210 };
  const pineB = { x: 1640, y: 726, h: 168 };
  const fox = {
    body: [[1500, 900], [1478, 838], [1430, 806], [1400, 842], [1404, 900], [1440, 936], [1500, 936]],
    head: [[1404, 806], [1378, 762], [1356, 786], [1340, 750], [1322, 790], [1360, 818]],
    tail: [[1500, 900], [1558, 892], [1600, 856], [1584, 828], [1546, 862]],
    legs: [[[1440, 900], [1432, 944]], [[1466, 900], [1470, 946]], [[1494, 900], [1500, 944]]],
  };

  function pencil(ctx, pts, frac, w = 2.2, a = 0.5) {
    ctx.save();
    ctx.strokeStyle = `rgba(78,74,66,${a})`;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    U.tracePartial(ctx, pts, frac);
    ctx.restore();
  }
  function wash(ctx, pts, col, a, edge = 0) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    if (edge) { // 干笔边：沿上缘刮几道纸色
      ctx.globalAlpha = a * 0.6;
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = edge;
      for (let i = 0; i < pts.length - 1; i++) {
        if (U.hash(i * 3.3) < 0.55) continue;
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(pts[i][0] + 14, pts[i][1] - 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  window.SCENES.minjian = {
    init: async () => {},
    draw(ctx, t) {
      U.paper(ctx, W, H, PAPER, 31, 0.55);

      // 天：极薄的一层
      const sky = U.easeInOut(U.p(t, 2.0, 0.8));
      if (sky > 0) {
        ctx.save();
        ctx.globalAlpha = 0.42 * sky;
        const g = ctx.createLinearGradient(0, 0, 0, 700);
        g.addColorStop(0, '#cfe0e2');
        g.addColorStop(1, '#f6efdc');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, 700);
        ctx.restore();
      }

      // 铅笔起稿：远山脊、路、房子、树、狐狸
      const sk = U.easeInOut(U.p(t, 0.4, 1.9));
      pencil(ctx, hillsFar[0], sk, 1.8, 0.42);
      pencil(ctx, hillsFar[1], sk, 1.8, 0.36);
      pencil(ctx, [[0, 760], [1920, 760]], sk, 1.4, 0.3);
      pencil(ctx, pathRoad, sk, 2.0, 0.5);
      pencil(ctx, house, sk, 2.2, 0.55);
      pencil(ctx, roof, sk, 2.2, 0.5);
      pencil(ctx, [[1320, 700], [1320, 790]], sk, 1.6, 0.4);
      pencil(ctx, [[1244, 736], [1300, 736], [1354, 736]], sk, 1.4, 0.32);
      pencil(ctx, fox.body, sk, 2.0, 0.5);
      pencil(ctx, fox.head, sk, 2.0, 0.5);
      pencil(ctx, fox.tail, sk, 1.8, 0.45);
      fox.legs.forEach(l => pencil(ctx, l, sk, 1.8, 0.45));
      // 松树：一排倒 V
      [[pineA, 0.5], [pineB, 0.4]].forEach(([p, a]) => {
        for (let k = 0; k < 5; k++) {
          const yy = p.y - k * (p.h / 5.5);
          const hw = 70 - k * 8;
          pencil(ctx, [[p.x - hw, yy], [p.x, yy - p.h / 5.2], [p.x + hw, yy]], sk, 1.6, a);
        }
        pencil(ctx, [[p.x, p.y], [p.x, p.y - p.h]], sk, 1.6, a);
      });

      // 远山：薄水色，几乎盖不住铅笔
      const far = U.easeInOut(U.p(t, 2.3, 1.0));
      if (far > 0) {
        wash(ctx, hillsFar[0], '#8ea6a0', 0.42 * far);
        wash(ctx, hillsFar[1], '#7d9370', 0.34 * far);
      }
      // 中景：草地略厚
      const mid = U.easeInOut(U.p(t, 3.2, 0.9));
      if (mid > 0) {
        wash(ctx, [[0, 830], [1920, 830], [1920, 1080], [0, 1080]], '#a8b86a', 0.5 * mid);
      }

      // 前景水粉：房子、路、狐狸、松树，不透明、干笔边
      const fg = U.easeInOut(U.p(t, 3.9, 1.5));
      if (fg > 0) {
        // 狐狸脚下的影：先落地，再压身子
        ctx.save();
        ctx.globalAlpha = 0.22 * fg;
        const shg = ctx.createRadialGradient(1452, 948, 4, 1452, 948, 110);
        shg.addColorStop(0, 'rgba(74,52,30,0.85)');
        shg.addColorStop(1, 'rgba(74,52,30,0)');
        ctx.fillStyle = shg;
        ctx.beginPath();
        ctx.ellipse(1452, 948, 130, 26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        wash(ctx, house, '#e8d8b2', 0.98 * fg, 6);
        wash(ctx, roof, '#b4503c', 0.96 * fg, 5);
        wash(ctx, [[1320, 700], [1300, 736], [1354, 736], [1320, 790]], '#6d5a44', 0.9 * fg, 4);
        wash(ctx, pathRoad, '#dcc9a0', 0.92 * fg, 5);
        wash(ctx, fox.body, '#cf6a2e', 0.97 * fg, 5);
        wash(ctx, fox.head, '#d9773a', 0.97 * fg, 4);
        wash(ctx, fox.tail, '#c45c26', 0.97 * fg, 5);
        fox.legs.forEach(l => wash(ctx, [[l[0][0] - 7, l[0][1]], [l[0][0] + 7, l[0][1]], [l[1][0] + 5, l[1][1]], [l[1][0] - 5, l[1][1]]], '#8a3f16', 0.95 * fg));
        // 松树：深绿压一层，留干笔缝
        [[pineA, 0.95], [pineB, 0.9]].forEach(([p, a]) => {
          for (let k = 0; k < 5; k++) {
            const yy = p.y - k * (p.h / 5.5);
            const hw = 70 - k * 8;
            wash(ctx, [[p.x - hw, yy], [p.x, yy - p.h / 5.2], [p.x + hw, yy], [p.x, yy - p.h / 9]], '#3f5a34', a * fg, 4);
          }
        });
        // 狐狸的白胸与眼
        const det = U.easeOut(U.p(t, 5.2, 0.7));
        ctx.save();
        ctx.globalAlpha = 0.98 * det;
        ctx.fillStyle = '#f6efdc';
        ctx.beginPath();
        ctx.moveTo(1372, 806);
        ctx.quadraticCurveTo(1400, 852, 1436, 806);
        ctx.quadraticCurveTo(1404, 828, 1372, 806);
        ctx.fill();
        ctx.fillStyle = '#2c2118';
        ctx.beginPath();
        ctx.arc(1360, 792, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 收尾：在颜料上补铅笔，勾狐狸的边和草
      const acc = U.easeOut(U.p(t, 6.2, 0.8));
      if (acc > 0) {
        pencil(ctx, fox.body, acc, 1.5, 0.4);
        pencil(ctx, fox.head, acc, 1.5, 0.4);
        for (let i = 0; i < 26; i++) {
          const x = 40 + i * 72, y = 1010 + U.hash(i * 5.5) * 46;
          pencil(ctx, [[x, y], [x + 6, y - 26 - U.hash(i * 9.1) * 18]], acc, 1.2, 0.35);
        }
      }

      // 纸与颜料的一层颗粒：把数字感压掉
      const grain = U.easeOut(U.p(t, 0.6, 1.2));
      if (grain > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.5 * grain;
        const r = U.rng(808);
        for (let i = 0; i < 2200; i++) {
          const x = r() * W, y = r() * H;
          ctx.fillStyle = `rgba(150,132,100,${0.02 + r() * 0.05})`;
          ctx.fillRect(x, y, 1 + r() * 2.4, 1 + r() * 2.4);
        }
        ctx.restore();
      }
    },
  };
})();
