// lao_cast_022.js — 022《澳洲土著 / 潘德明》人物运行时表（项目级，不改 toon-cast 冻结源码）
// 29 人 cfg 与审核页的服装 / 道具 / 绘纹覆盖层同源；TOON.bodySide / bodyFront 只画身体与表情，
// 覆盖层在这里按 600×1000 设计坐标叠在身体前后。用法：CAST022.draw(id, opts, side) → 600×1000 canvas。
(function () {
  const INK = '#241726';
  const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const shade = (c, k) => {
    const [r, g, b] = hex(c);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
    return '#' + f(r) + f(g) + f(b);
  };
  const poly = (g, P, fill, lw = 3) => {
    let f = fill, w = lw;
    if (typeof P === 'string') { f = P; w = fill === undefined ? 3 : fill; }
    if (f) { g.fillStyle = f; g.fill(); }
    if (w) { g.strokeStyle = INK; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  };
  const path = (g, P) => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
  const line = (g, P, lw = 3, col = INK) => {
    g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y));
    g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  };
  const ell = (g, x, y, rx, ry, fill, lw = 3, rot = 0) => {
    g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (lw) { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); }
  };

  // ---------- 背层：在身体之前画 ----------
  function back(g, ch, hide) {
    const cfg = ch.cfg, s = (cfg.head ?? 1) * 1.08 * (cfg.build === 'stout' ? 1.02 : 1);
    for (const k of ch.back || []) {
      if (hide && hide.indexOf(k) >= 0) continue;
      if (k === 'longHair') {
        path(g, [[176, 548], [166, 470], [176, 360], [206, 272], [264, 232], [332, 228], [392, 258], [418, 330], [412, 438], [390, 528], [352, 552], [322, 500], [292, 522], [250, 546]]);
        poly(g, null, cfg.hair || '#2a211a', 4.2);
      }
      if (k === 'bun') {
        ell(g, 182, 296, 44, 46, cfg.hair || '#2a211a', 3.8);
        ell(g, 182, 296, 18, 20, shade(cfg.hair || '#2a211a', 1.25), 2.2);
        line(g, [[148, 278], [124, 264]], 3, shade(cfg.hair || '#2a211a', 0.75));
      }
      if (k === 'hood') {
        path(g, [[200, 494], [196, 420], [222, 352], [276, 326], [330, 330], [382, 358], [402, 424], [398, 492], [366, 470], [330, 458], [300, 466], [268, 458], [232, 474]]);
        poly(g, shade(cfg.jacket, 0.82), 2.8);
      }
      if (k === 'bike') {
        const w1 = [478, 894], w2 = [574, 894], r = 60;
        for (const [cx, cy] of [w1, w2]) {
          ell(g, cx, cy, r, null, 4.2);
          for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(g, [[cx, cy], [cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86]], 1.6, '#5a5650'); }
          ell(g, cx, cy, 6, 6, '#8a3a2c', 2);
        }
        line(g, [w1, [526, 792], w2], 4.2, '#3a3a34');
        line(g, [[526, 792], [478, 894]], 4.2, '#3a3a34');
        line(g, [[526, 792], [520, 764]], 4, '#3a3a34');
        line(g, [[504, 764], [540, 764]], 7, '#2a211a');
        line(g, [[574, 894], [592, 782]], 3.6, '#3a3a34');
        line(g, [[584, 784], [606, 774]], 5, '#2a211a');
        ell(g, 526, 894, 11, 11, null, 2.4);
      }
      if (k === 'wheelchair') {
        ell(g, 470, 858, 70, null, 4.4);
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; line(g, [[470, 858], [470 + Math.cos(a) * 60, 858 + Math.sin(a) * 60]], 1.4, '#6a5a44'); }
        ell(g, 470, 858, 7, 7, '#8a6a44', 2);
        ell(g, 566, 930, 27, null, 3.6);
        line(g, [[420, 790], [524, 790]], 6, '#4a3a2a');
        line(g, [[424, 584], [430, 790]], 6, '#4a3a2a');
        line(g, [[420, 748], [512, 748]], 5, '#4a3a2a');
        line(g, [[424, 584], [404, 556]], 5, '#4a3a2a');
        line(g, [[566, 930], [524, 790]], 4, '#4a3a2a');
      }
    }
  }

  // ---------- 前层：在身体之后画 ----------
  function front(g, ch, side, hide) {
    const cfg = ch.cfg, s = (cfg.head ?? 1) * (side ? 1.08 : 1.04) * (cfg.build === 'stout' ? 1.02 : 1);
    const fk = cfg.faceK || {}, fx = (cfg.face === 'round' ? 1.12 : cfg.face === 'square' ? 1.08 : 1) * (fk.fx || 1), fy = (cfg.face === 'round' ? 0.9 : cfg.face === 'square' ? 0.97 : 1) * (fk.fy || 1);
    const hx = 300, hy = side ? 362 : 330;
    const suit = shade(cfg.jacket, 0.86), suitL = shade(cfg.jacket, 1.12);
    for (const k of ch.front || []) {
      if (hide && hide.includes(k)) continue;
      if (k === 'suit') {
        if (side) {
          path(g, [[292, 494], [322, 497], [317, 542], [298, 548]]); poly(g, '#f4ead2', 2.2);
          path(g, [[300, 498], [272, 520], [280, 604], [302, 574]]); poly(g, suit, 2.4);
          path(g, [[300, 498], [328, 520], [318, 604], [302, 574]]); poly(g, suitL, 2.4);
        } else {
          path(g, [[282, 496], [318, 496], [315, 548], [285, 548]]); poly(g, '#f4ead2', 2.2);
          path(g, [[300, 500], [262, 522], [276, 618], [300, 570]]); poly(g, suit, 2.4);
          path(g, [[300, 500], [338, 522], [324, 618], [300, 570]]); poly(g, suitL, 2.4);
        }
      }
      if (k === 'tie') {
        const tc = ch.tie || '#a34c32';
        if (side) { path(g, [[304, 512], [314, 516], [310, 636], [303, 652], [298, 636]]); poly(g, tc, 2.2); }
        else { path(g, [[294, 504], [306, 504], [314, 646], [300, 662], [286, 646]]); poly(g, tc, 2.2); }
      }
      if (k === 'uniform') {
        if (side) {
          path(g, [[286, 494], [330, 498], [322, 540], [300, 548]]); poly(g, '#3a3a34', 2.6);
          line(g, [[300, 548], [300, 700]], 3, '#2a2a24');
          line(g, [[238, 700], [362, 704]], 5, '#2a211a');
          line(g, [[330, 585], [372, 590], [368, 612], [328, 608]], 3, '#2a2a24');
        } else {
          path(g, [[266, 496], [334, 496], [322, 540], [278, 540]]); poly(g, '#3a3a34', 2.6);
          line(g, [[300, 540], [300, 690]], 3, '#2a2a24');
          line(g, [[214, 700], [386, 700]], 5, '#2a211a');
          for (const sx of [-1, 1]) { line(g, [[300 + sx * 54, 578], [300 + sx * 54, 622]], 2.6, '#2a2a24'); line(g, [[300 + sx * 40, 600], [300 + sx * 68, 600]], 2.6, '#2a2a24'); }
        }
      }
      if (k === 'moustache' || k === 'toothbrush') {
        const mx = side ? hx + 100 * s * fx : hx, my = side ? hy + 54 * s * fy : hy + 68 * s * fy;
        if (k === 'toothbrush') {
          path(g, [[mx - 14, my - 9], [mx + 12, my - 9], [mx + 12, my - 1], [mx - 14, my - 1]]); poly(g, '#241a12', 1.8);
        } else {
          path(g, [[mx - 26, my - 7], [mx - 4, my - 10], [mx + 2, my - 4], [mx - 6, my + 2], [mx - 24, my + 1]]); poly(g, '#241a12', 1.8);
          if (!side) { path(g, [[mx + 26, my - 7], [mx + 4, my - 10], [mx - 2, my - 4], [mx + 6, my + 2], [mx + 24, my + 1]]); poly(g, '#241a12', 1.8); }
        }
      }
      if (k === 'apron') {
        if (!side) {
          path(g, [[250, 540], [350, 540], [362, 850], [238, 850]]); poly(g, '#efe8d6', 3.2);
          line(g, [[256, 650], [344, 650]], 3, '#c9b98a');
          line(g, [[238, 660], [214, 690]], 3, '#c9b98a'); line(g, [[362, 660], [386, 690]], 3, '#c9b98a');
        } else {
          path(g, [[252, 548], [352, 550], [364, 848], [236, 848]]); poly(g, '#efe8d6', 3.2);
          line(g, [[258, 652], [346, 652]], 3, '#c9b98a');
          line(g, [[258, 540], [276, 498]], 3, '#c9b98a');
          line(g, [[364, 660], [392, 690]], 3, '#c9b98a');
        }
      }
      if (k === 'chef') {
        line(g, [[300, 505], [300, 850]], 2.2, '#c9b98a');
        for (let i = 0; i < 5; i++) ell(g, (side ? 318 : 300) + (i % 2 ? 14 : -10), 568 + i * 54, 4, 4, '#c9b98a', 1.4);
      }
      if (k === 'toque') {
        path(g, [[252, 286], [348, 286], [352, 246], [248, 246]]); poly(g, '#f6efdc', 3.6);
        for (const [cx, cy, rx, ry] of [[270, 232, 34, 30], [312, 222, 38, 34], [344, 236, 28, 26]]) ell(g, cx, cy, rx, ry, '#f6efdc', 3.2);
        line(g, [[252, 286], [348, 286]], 4, '#d8c9b0');
      }
      if (k === 'hoodFront') {
        line(g, [[300, 520], [300, 816]], 2.6, shade(cfg.jacket, 0.55));
        line(g, [[292, 524], [284, 618]], 3, '#efe3c4'); line(g, [[308, 524], [316, 618]], 3, '#efe3c4');
        ell(g, 284, 620, 4, 4, '#8a6a44', 1.4); ell(g, 316, 620, 4, 4, '#8a6a44', 1.4);
      }
      if (k === 'bunFront') {
        if (side) { ell(g, 182, 296, 44, 46, null, 2.2); path(g, [[166, 258], [196, 268], [202, 322], [180, 344], [156, 318]]); poly(g, shade(cfg.hair || '#241c16', 1.18), 2.6); }
        else { ell(g, 300, 222, 44, 36, cfg.hair || '#241c16', 3.4); line(g, [[274, 228], [326, 228]], 2.4, shade(cfg.hair || '#241c16', 0.7)); }
      }
      if (k === 'longHairFront') {
        if (side) { path(g, [[196, 296], [226, 300], [232, 430], [214, 506], [190, 486]]); poly(g, shade(cfg.hair || '#2a211a', 1.04), 3.2); }
        else {
          path(g, [[204, 318], [228, 306], [236, 470], [220, 516], [198, 484]]); poly(g, shade(cfg.hair || '#2a211a', 1.04), 3.2);
          path(g, [[396, 318], [372, 306], [364, 470], [380, 516], [402, 484]]); poly(g, shade(cfg.hair || '#2a211a', 1.04), 3.2);
        }
      }
      if (k === 'femaleLips') {
        const mx = side ? hx + 100 * s * fx : hx, my = side ? hy + 54 * s * fy : hy + 68 * s * fy;
        line(g, [[mx - 10, my], [mx + 8, my - 1]], 4, '#b23a2b');
      }
      if (k === 'drum') {
        const dx = side ? 432 : 370, dy = 690;
        line(g, [[side ? 340 : 340, 540], [dx - 16, dy - 22]], 4, '#6b4a2f');
        ell(g, dx, dy, 27, 29, '#c9a24a', 3.4);
        ell(g, dx, dy, 20, 22, '#efe3c4', 2);
        line(g, [[dx - 26, dy - 12], [dx + 26, dy - 12]], 3, '#8a3a2c');
        line(g, [[dx - 26, dy + 12], [dx + 26, dy + 12]], 3, '#8a3a2c');
        line(g, [[dx - 10, dy + 30], [dx - 14, dy + 52]], 2, '#8a3a2c'); line(g, [[dx + 10, dy + 30], [dx + 14, dy + 52]], 2, '#8a3a2c');
      }
      if (k === 'watch') {
        ell(g, 336, 646, 13, 13, '#d8a53f', 2.4); ell(g, 336, 646, 7, 7, '#efe3c4', 1.6);
        line(g, [[326, 638], [306, 620]], 2, '#d8a53f');
      }
      if (k === 'medal') {
        ell(g, 340, 586, 12, 13, '#d8a53f', 2.4);
        line(g, [[334, 572], [340, 582], [346, 572]], 2, '#b23a2b');
        line(g, [[340, 599], [340, 640]], 2, '#8a3a2c');
      }
      if (k === 'brush') {
        const h = side ? [300, 684] : [452, 798];
        line(g, [h, [h[0] + 44, h[1] + 72]], 7, '#5a3a2a');
        line(g, [[h[0] + 42, h[1] + 68], [h[0] + 52, h[1] + 82]], 3, '#b0b0a8');
        path(g, [[h[0] + 50, h[1] + 80], [h[0] + 70, h[1] + 104], [h[0] + 58, h[1] + 110], [h[0] + 44, h[1] + 86]]); poly(g, '#2a211a', 1.6);
      }
      if (k === 'boomerang') {
        const bx = side ? 492 : 398, by = 716, sc = side ? 1.2 : 1;
        const pts = [[-40, 0], [-8, -24], [20, -2], [8, 10], [-12, -6], [-30, 16]];
        path(g, pts.map(([x, y]) => [bx + x * sc, by + y * sc]));
        poly(g, '#8a5a2c', 3.2);
        line(g, [[bx - 28 * sc, by + 4 * sc], [bx - 10 * sc, by - 9 * sc]], 2, '#5a3a1e');
      }
      if (k === 'book' && !side) {
        path(g, [[350, 742], [404, 732], [410, 772], [356, 782]]); poly(g, '#efe3c4', 2.6);
        line(g, [[356, 754], [404, 746]], 1.8, 'rgba(74,58,40,.45)');
      }
      if (k === 'paintElder' || k === 'paintWarrior') {
        const warrior = k === 'paintWarrior', col = warrior ? '#f2ead2' : '#e8d8b0';
        for (let i = -1; i <= 1; i++) line(g, [[hx + (26 + i * 6) * s * fx, hy + (10 + i * 4) * s * fy], [hx + (60 + i * 6) * s * fx, hy + (34 + i * 4) * s * fy]], warrior ? 8 : 6, col);
        if (!side) for (let i = -1; i <= 1; i++) line(g, [[hx - (26 + i * 6) * s * fx, hy + (10 + i * 4) * s * fy], [hx - (60 + i * 6) * s * fx, hy + (34 + i * 4) * s * fy]], warrior ? 8 : 6, col);
        if (warrior) {
          for (let i = 0; i < 3; i++) { line(g, [[232, 556 + i * 66], [338, 550 + i * 66]], 10, '#f2ead2'); line(g, [[232, 568 + i * 66], [338, 562 + i * 66]], 3.4, '#b23a2b'); }
          for (let i = 0; i < 2; i++) line(g, [[282, 596 + i * 48], [318, 592 + i * 48]], 9, '#f2ead2');
        } else {
          line(g, [[242, 586], [330, 580]], 7, '#e8d8b0');
          line(g, [[242, 650], [330, 644]], 7, '#e8d8b0');
          for (let i = 0; i < 3; i++) ell(g, 300 + i * 16, 310, 4, 4, '#e8d8b0', 1.2);
        }
      }
    }
    if (!side) {
      if (cfg.staff) { line(g, [[452, 952], [452, 300]], 6, '#6b4a2f'); ell(g, 452, 300, 14, 14, null, 3.4); ell(g, 452, 300, 7, 7, null, 2.2); }
      if (cfg.spear) { line(g, [[438, 952], [512, 270]], 5, '#6b4a2f'); path(g, [[508, 278], [518, 244], [528, 278], [518, 290]]); poly(g, '#c9c9c9', 2.4); }
      if (cfg.knife) { path(g, [[378, 760], [430, 720], [438, 732], [386, 772]]); poly(g, '#4a3524', 2.2); }
    }
  }

  // ---------- 29 人参数（与 08_人物设定/lao_cast_022.candidate.js 一致） ----------
  const LIST = [
    { id: 1, name: '潘德明 · 青年', cfg: { jacket: '#2f4258', pants: '#26313f', boots: '#1b1712', skin: '#d8b08a', head: 1.02, hair: '#241c16', hairStyle: 'part', face: 'long', faceK: { fx: 0.96, fy: 1.06, nose: 1.15, eye: 1.1 }, build: 'adult' }, back: ['bike'], front: ['suit', 'tie', 'drum'], expr: 'neutral' },
    { id: 2, name: '潘德明 · 少年', cfg: { jacket: '#8a6a4a', pants: '#5a4632', boots: '#3a2a1e', skin: '#dfb98a', head: 1.06, hair: '#241c16', hairStyle: 'buzz', face: 'round', faceK: { fx: 1.02, fy: 0.95, nose: 0.9, eye: 1.15 }, build: 'adult', thin: true }, front: ['apron'], expr: 'curious' },
    { id: 3, name: '潘德明 · 晚年', cfg: { jacket: '#efe8d6', pants: '#4a4640', boots: '#2a2620', skin: '#c99563', head: 1.0, hair: '#d8d0c0', hairStyle: 'buzz', face: 'round', faceK: { fx: 0.98, fy: 0.96, nose: 1.0, eye: 0.95 }, build: 'stout', age: 1, browCol: '#d8d0c0' }, front: ['chef', 'apron', 'toque'], expr: 'neutral' },
    { id: 4, name: '驴友', cfg: { jacket: '#3f6b60', pants: '#2f3a36', boots: '#2a211a', skin: '#d6ab7a', head: 1.0, hair: '#241c16', hairStyle: 'buzz', face: 'square', faceK: { fx: 1.05, fy: 0.96, nose: 1.05, eye: 0.95 }, build: 'adult', hat: 'cap', cap: '#b98a49', satchel: '#8f6633' }, back: ['hood'], front: ['hoodFront'], expr: 'smile' },
    { id: 5, name: '朋友（潘家孙辈）', cfg: { jacket: '#5d6b63', pants: '#3f3a32', boots: '#2a211a', skin: '#d6ab7a', head: 1.02, hair: '#2a211a', hairStyle: 'part', face: 'round', faceK: { fx: 1.06, fy: 0.93, nose: 0.95, eye: 1.04 }, build: 'stout', glasses: true }, front: [], expr: 'shock' },
    { id: 6, name: '表弟', cfg: { jacket: '#7f8840', pants: '#3a444a', boots: '#2a211a', skin: '#dfb98a', head: 1.0, hair: '#241c16', hairStyle: 'part', face: 'long', faceK: { fx: 0.97, fy: 1.04, nose: 1.0, eye: 1.02 }, build: 'adult' }, front: [], expr: 'curious' },
    { id: 7, name: '姐姐', cfg: { jacket: '#a34c32', pants: '#6b2f24', boots: '#3a1e16', skin: '#e6c39a', head: 1.0, hair: '#241c16', hairStyle: 'part', face: 'round', faceK: { fx: 1.04, fy: 0.94, nose: 0.85, eye: 1.1 }, build: 'adult', thin: true, robe: '#a34c32', sash: '#8a3a2c' }, back: ['bun'], front: ['bunFront', 'femaleLips'], expr: 'smile' },
    { id: 8, name: '亚洲步行团领队', cfg: { jacket: '#4a5a6a', pants: '#3a3a3a', boots: '#2a2a2a', skin: '#dfb98a', head: 1.02, hair: '#2a211a', hairStyle: 'part', face: 'long', faceK: { fx: 0.95, fy: 1.05, nose: 1.12, eye: 0.98 }, build: 'adult', hat: 'scholar', cap: '#2a211a', robe: '#4a5a6a', glasses: true }, front: ['book'], expr: 'stern' },
    { id: 9, name: '中国驻新加坡大使', cfg: { jacket: '#2f4258', pants: '#26313f', boots: '#1b1712', skin: '#dfb98a', head: 1.0, hair: '#241c16', hairStyle: 'part', face: 'long', faceK: { fx: 0.94, fy: 1.06, nose: 1.0, eye: 0.95 }, build: 'adult', thin: true }, front: ['suit', 'tie'], expr: 'stern' },
    { id: 10, name: '胡文虎', cfg: { jacket: '#3a3a42', pants: '#2a2a30', boots: '#1b1712', skin: '#c99563', head: 1.04, hair: '#2a211a', hairStyle: 'part', face: 'round', faceK: { fx: 1.08, fy: 0.94, nose: 1.0, eye: 0.94 }, build: 'stout', hat: 'cap', cap: '#2a211a', glasses: true, age: 1 }, front: ['suit', 'tie', 'watch'], expr: 'smile' },
    { id: 11, name: '泰戈尔', cfg: { jacket: '#efe3c4', pants: '#d8c9a2', boots: '#8a6a44', skin: '#b98252', head: 1.02, hair: '#cfc6b4', hairStyle: 'bald', face: 'long', faceK: { fx: 0.94, fy: 1.08, nose: 1.25, eye: 1.0 }, build: 'adult', thin: true, robe: '#efe3c4', beard: '#d8d0c0', beardLen: 1.25 }, back: ['longHair'], front: ['longHairFront'], expr: 'smile' },
    { id: 12, name: '甘地', cfg: { jacket: '#efe3c4', pants: '#e2d0a8', boots: '#8a6a44', skin: '#8a5a35', head: 1.0, hair: '#d8d0c0', hairStyle: 'bald', face: 'long', faceK: { fx: 0.9, fy: 1.04, nose: 1.1, eye: 0.92 }, build: 'adult', thin: true, robe: '#efe3c4', glasses: true, staff: true, age: 1, browCol: '#d8d0c0' }, front: [], expr: 'smile' },
    { id: 13, name: '希特勒', cfg: { jacket: '#5a5a52', pants: '#3a3a34', boots: '#1b1712', skin: '#e0b98c', head: 1.0, hair: '#2a211a', hairStyle: 'part', face: 'square', faceK: { fx: 1.04, fy: 0.98, nose: 1.0, eye: 0.92 }, build: 'adult' }, front: ['uniform', 'toothbrush'], expr: 'stern' },
    { id: 14, name: '罗斯福', cfg: { jacket: '#2f3440', pants: '#26313f', boots: '#1b1712', skin: '#dfb98a', head: 1.02, hair: '#8a8a82', hairStyle: 'part', face: 'long', faceK: { fx: 0.96, fy: 1.05, nose: 1.05, eye: 0.94 }, build: 'stout', glasses: true, age: 1, browCol: '#8a8a82' }, back: ['wheelchair'], front: ['suit', 'tie'], expr: 'smile' },
    { id: 15, name: '大马士革推销员', cfg: { jacket: '#6a5a44', pants: '#4a3a2a', boots: '#2a211a', skin: '#c99563', head: 1.02, hair: '#2a211a', hairStyle: 'part', face: 'round', faceK: { fx: 1.06, fy: 0.92, nose: 1.05, eye: 0.95 }, build: 'stout', hat: 'cap', cap: '#5a4632' }, back: ['bike'], front: ['suit', 'moustache'], expr: 'grin' },
    { id: 16, name: '阿拉伯土匪头目', cfg: { jacket: '#5a4632', pants: '#3a3028', boots: '#2a211a', skin: '#8f5f3a', head: 1.06, hair: '#241c16', hairStyle: 'buzz', face: 'square', faceK: { fx: 1.1, fy: 0.95, nose: 1.0, eye: 0.88, jaw: 0.08 }, build: 'stout', hat: 'band', cap: '#8a3a2c', beard: '#2a211a', beardLen: 1.2, knife: true }, front: [], expr: 'stern' },
    { id: 17, name: '礼萨汗', cfg: { jacket: '#3f5a4a', pants: '#2f3a32', boots: '#1f1a16', skin: '#c99563', head: 1.04, hair: '#2a211a', hairStyle: 'part', face: 'square', faceK: { fx: 1.06, fy: 0.97, nose: 1.08, eye: 0.94 }, build: 'adult', hat: 'crown', cap: '#c9a24a', robe: '#3f5a4a', sash: '#c9a24a', beard: '#2a211a', beardLen: 0.9 }, front: [], expr: 'stern' },
    { id: 18, name: '凯末尔', cfg: { jacket: '#4a5a5a', pants: '#3a444a', boots: '#1b1712', skin: '#d6ab7a', head: 1.02, hair: '#241c16', hairStyle: 'buzz', face: 'square', faceK: { fx: 1.05, fy: 0.96, nose: 1.0, eye: 0.94 }, build: 'adult', hat: 'cap', cap: '#3a444a', sash: '#b23a2b', armor: true }, front: ['moustache', 'medal'], expr: 'stern' },
    { id: 19, name: '顾维钧', cfg: { jacket: '#2b3442', pants: '#222a34', boots: '#1b1712', skin: '#dfb98a', head: 1.0, hair: '#241c16', hairStyle: 'part', face: 'long', faceK: { fx: 0.94, fy: 1.06, nose: 0.95, eye: 1.02 }, build: 'adult', thin: true, glasses: true }, front: ['suit', 'tie'], expr: 'neutral' },
    { id: 20, name: '张学良', cfg: { jacket: '#6a6a5a', pants: '#4a4a3e', boots: '#2a2620', skin: '#dfb98a', head: 1.05, hair: '#241c16', hairStyle: 'part', face: 'long', faceK: { fx: 0.96, fy: 1.04, nose: 1.0, eye: 1.02 }, build: 'adult', hat: 'helmet', cap: '#6a7a82', sash: '#b23a2b', armor: true }, front: [], expr: 'smile' },
    { id: 21, name: '徐悲鸿', cfg: { jacket: '#3a4a5a', pants: '#2a2a2a', boots: '#1f1a16', skin: '#d8b08a', head: 1.02, hair: '#2a211a', hairStyle: 'part', face: 'long', faceK: { fx: 0.95, fy: 1.05, nose: 1.1, eye: 0.96 }, build: 'adult', thin: true, hat: 'scholar', cap: '#2a211a', robe: '#3a4a5a', beard: '#2a211a', beardLen: 0.35 }, front: ['brush'], expr: 'smile' },
    { id: 22, name: '季一德', cfg: { jacket: '#6b4e3b', pants: '#3a444a', boots: '#2a2620', skin: '#d6ab7a', head: 1.02, hair: '#2a211a', hairStyle: 'part', face: 'round', faceK: { fx: 1.04, fy: 0.95, nose: 1.0, eye: 1.02 }, build: 'adult', glasses: true, satchel: '#4a3524', warrant: true, age: 1 }, front: [], expr: 'curious' },
    { id: 23, name: '澳大利亚女华侨', cfg: { jacket: '#7f8840', pants: '#3f3a32', boots: '#2f2721', skin: '#dfb98a', head: 1.02, hair: '#241c16', hairStyle: 'part', face: 'round', faceK: { fx: 1.04, fy: 0.94, nose: 0.9, eye: 1.06 }, build: 'stout' }, back: ['bike', 'bun'], front: ['bunFront', 'femaleLips'], expr: 'smile' },
    { id: 24, name: '澳洲土著长老', cfg: { jacket: '#8f6633', pants: '#5a3620', boots: '#3a2418', skin: '#6b4326', head: 1.02, hair: '#e8e0d0', hairStyle: 'bald', face: 'long', faceK: { fx: 0.94, fy: 1.05, nose: 1.12, eye: 0.9 }, build: 'adult', thin: true, robe: '#8f6633', sash: '#b23a2b', hat: 'band', cap: '#b98a49', beard: '#e8e0d0', beardLen: 1.8, spear: true, age: 1, browCol: '#e8e0d0' }, front: ['paintElder'], expr: 'smile' },
    { id: 25, name: '土著武士 · 长矛', cfg: { jacket: '#8f6633', pants: '#5a3620', boots: '#3a2418', skin: '#6b4326', head: 1.04, hair: '#241a12', hairStyle: 'buzz', face: 'square', faceK: { fx: 1.06, fy: 0.97, nose: 1.02, eye: 0.94 }, build: 'adult', robe: '#8f6633', hat: 'band', cap: '#b23a2b', spear: true }, front: ['paintWarrior'], expr: 'stern' },
    { id: 26, name: '土著武士 · 回旋镖', cfg: { jacket: '#8f6633', pants: '#5a3620', boots: '#3a2418', skin: '#6b4326', head: 1.06, hair: '#241a12', hairStyle: 'buzz', face: 'square', faceK: { fx: 1.1, fy: 0.95, nose: 1.0, eye: 0.9, jaw: 0.08 }, build: 'stout', robe: '#8f6633', hat: 'band', cap: '#e8d8b0' }, front: ['paintWarrior', 'boomerang'], expr: 'stern' },
    { id: 27, name: '开罗中国留学生', cfg: { jacket: '#3a444a', pants: '#2a3036', boots: '#1b1712', skin: '#d6ab7a', head: 1.02, hair: '#241c16', hairStyle: 'part', face: 'round', faceK: { fx: 1.02, fy: 0.95, nose: 0.92, eye: 1.08 }, build: 'adult', glasses: true }, front: ['suit', 'tie', 'book'], expr: 'smile' },
    { id: 28, name: '埃及向导 / 学生', cfg: { jacket: '#d8c9a2', pants: '#b98a49', boots: '#8a6a44', skin: '#a9764f', head: 1.02, hair: '#2a211a', hairStyle: 'part', face: 'long', faceK: { fx: 0.96, fy: 1.04, nose: 1.12, eye: 1.0 }, build: 'adult', thin: true, robe: '#d8c9a2', hat: 'turban', cap: '#efe3c4', beard: '#2a211a', beardLen: 0.8, staff: true }, front: [], expr: 'smile' },
    { id: 29, name: '印度学生', cfg: { jacket: '#e2d0a8', pants: '#d8c9a2', boots: '#8a6a44', skin: '#8f5f3a', head: 1.02, hair: '#241c16', hairStyle: 'part', face: 'round', faceK: { fx: 1.0, fy: 0.96, nose: 0.95, eye: 1.06 }, build: 'adult', robe: '#e2d0a8', book: true }, front: [], expr: 'curious' },
  ];
  const byId = new Map(LIST.map((x) => [x.id, x]));
  const pool = [];
  function draw(id, opts = {}, side = true) {
    const ch = byId.get(id) || LIST[0], cfg = { ...ch.cfg };
    if (!cfg.lao) cfg.lao = true;
    const key = ch.id * 2 + (side ? 0 : 1);
    let c = pool[key];
    if (!c) { c = document.createElement('canvas'); c.width = 600; c.height = 1000; pool[key] = c; }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 600, 1000);
    back(g, ch, opts.hideBack);
    const p = new TOON.Pen(g);
    const o = Object.assign({ expr: ch.expr || 'neutral', mode: 'stand', seed: ch.id * 7 + 3, blink: false, light: -2.1 }, opts);
    if (side) TOON.bodySide(p, cfg, o); else TOON.bodyFront(p, cfg, o);
    front(g, ch, side, opts.hideFront);
    return c;
  }
  window.CAST022 = { list: LIST, get: (id) => byId.get(id), draw };
})();
