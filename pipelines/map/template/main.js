// main.js — map 管线模板（PROMO.compose 骨架）
//
// 结构：片头 → 地名与路线 → 贴纸（锚定经纬度/沿线移动）→ 一条连续镜头。
// 屏幕文字一律取自 brief.md 的旁白原文；示意路线必须标注「方向示意，非实测路线」。
// API 速查见 ../SKILL.md 与 ../references/storyboard.md；贴纸规范见 ../references/asset-spec.md。

PROMO.compose({
  bpm: 96, offset: 0.2, grain: false, tail: 1.2,
  captions: { size: 46, bg: 'rgba(46,41,36,.78)' },
  theme: {
    bg: '#E9E2D0', fg: '#2E2924', muted: '#857864', ink: '#2E2924', paper: '#FBF7EE', accent: '#C23B22',
    fonts: { display: '"Noto Serif SC", serif', serif: '"Noto Serif SC", serif',
             sans: '"Noto Sans SC", sans-serif', script: '"Crimson Pro", serif' },
  },
  build: async (F) => {
    const TL = F.T, s0 = TL.start, fin = F.duration;
    const a1 = s0('l1'), a2 = s0('l2'), a3 = s0('l3'), a4 = s0('l4');
    const T = window.PARAGRAPHS.map((p) => [p.start, p.end]);
    const S = T.map((t) => t[0]), E = T.map((t) => t[1]);

    const G = await PROMO.map(F, { ground: 'atlas', globeZoom: 3.6 });
    await G.world({ detail: '50m', states: false });

    // 地理锚点（今天坐标，只作画布位置；历史疆界另说）
    const A = [108.94, 34.34];      // 起点
    const MID = [94.0, 38.5];       // 中途
    const B = [66.90, 36.70];       // 终点
    const ROUTE = [A, [103.8, 36.1], [98.0, 39.3], MID, [82.5, 39.5], [74.0, 38.4], B];

    G.scale({ at: 1.0, until: fin, pos: 'br' });
    G.north({ at: 1.0, until: fin, pos: 'tr' });

    // ---- 片头与地名 ----
    G.title({ kicker: '一个想法', text: '一条路的故事', sub: '地图动画 · 模板', at: 0.25, until: 3.0, size: 84 });
    G.label(A, '起点', { kind: 'city', dir: 'e', at: a1 + 1.0, until: E[0] });
    G.label(MID, '中途', { kind: 'town', dir: 's', at: a1 + 2.6, until: E[1] });
    G.label(B, '终点', { kind: 'city', dir: 'e', at: a2 + 0.6, until: E[1] });

    // ---- 路线（示意）与移动 ----
    const R = G.line(ROUTE, { color: 'accent', width: 5, dash: [8, 8], at: a1 + 1.4, dur: 3.2, head: true });
    G.travel(ROUTE, { at: a1 + 1.6, dur: 4.0, marker: 'dot', color: 'accent', trail: true, until: E[1] });
    G.note('方向示意，非实测路线', { at: a1 + 1.0, until: fin, pos: 'br' });

    // ---- 贴纸：锚定经纬度 / 沿线移动（规范见 references/asset-spec.md） ----
    const artDefs = [
      { f: 'demo_traveler.svg', path: ROUTE, from: a1 + 1.6, to: a1 + 5.0, w: 170, at: a1 + 1.6, until: E[1], dy: 20, lift: 170 },
      { f: 'demo_dune.svg', ll: [82.5, 39.5], w: 240, at: a2 + 0.4, until: E[1] + 0.4, dy: 16 },
    ];
    await MAP_STICKERS(G, artDefs, { dir: 'assets/models/' });

    // ---- 一条连续镜头 ----
    G.camera([
      { at: 0, center: [88, 36], zoom: 2.0 },
      { at: a1 + 0.2, center: [100, 37], zoom: 4.2, dur: 2.4 },
      { at: a2 + 0.2, center: [76, 38], zoom: 4.6, dur: 2.4 },
      { at: a3 + 0.2, center: [88, 37], zoom: 3.6, dur: 2.2 },
    ]);

    T.forEach((p, i) => F.section(p[0], 1 + (i % 3), { name: 'para' + (i + 1) }));
    TL.lines.filter((l) => !l.silence).forEach((l) => F.info('map', l.start, Math.min(l.end + 0.2, F.duration), { group: l.id }));
    F.coverAt(a2 + 1.0);
  },
});
