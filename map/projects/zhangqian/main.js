
// 张骞寻路 · 全片（口播稿 32 自然段 / 542.99 s 旁白）
// 规范见 ../../references/asset-spec.md：44 个纯 SVG 贴纸锚定经纬度；人物位于路线与城市「上方」（z-index 5 + lift）。
// 所有屏幕文字取自 brief.md 的旁白原文；所有路线标注「示意」。
PROMO.compose({
  bpm: 96, offset: 0.2, grain: false, tail: 1.2,
  captions: { size: 46, bg: 'rgba(46,41,36,.78)' },
  theme: { bg: '#E9E2D0', fg: '#2E2924', muted: '#857864', ink: '#2E2924', paper: '#FBF7EE', accent: '#C23B22', fonts: { display: '"Noto Serif SC", serif', serif: '"Noto Serif SC", serif', sans: '"Noto Sans SC", sans-serif', script: '"Crimson Pro", serif' } },
  build: async (F) => {
    const TL = F.T, s0 = TL.start, fin = F.duration;
    const a1 = s0('l1'), a2 = s0('l2'), a3 = s0('l3'), a4 = s0('l4'),
          a5 = s0('l5'), a6 = s0('l6'), a7 = s0('l7'), a8 = s0('l8');
    const T = window.PARAGRAPHS.map(p => [p.start, p.end]);
    const S = T.map(t => t[0]), E = T.map(t => t[1]);   // 32 段起止

    const G = await PROMO.map(F, { ground: 'atlas', globeZoom: 3.6 });
    await G.world({ detail: '50m', states: false });

    // 地理锚点（今天坐标，仅作画布位置，不代表历史疆界）
    const CHANGAN = [108.94, 34.34], AFG = [66.90, 36.70];
    const CHENGDU = [104.07, 30.67], QIONG = [103.20, 30.40], INDIA = [78.0, 22.0];
    const XIONGNU = [107.0, 42.0], PLATEAU = [89.0, 32.0], DESERT = [82.5, 39.5];
    const QINGHAI = [96.0, 35.0], YUNNAN = [102.7, 25.0], DIAN = [101.5, 24.5], YELANG = [105.5, 27.2];
    const DABA = [107.5, 32.2], SANXINGDUI = [104.2, 31.0];
    const INDIAN_OCEAN = [72.0, 10.0], SOUTH_SEA = [112.0, 15.0];
    const SUMER = [44.0, 32.0], EGYPT = [31.0, 30.0], LONDON = [0.0, 51.5];
    const DUJIANGYAN = [103.62, 31.00], JIANGEGUAN = [105.56, 32.25];
    const HIMALAYA = [86.0, 28.5], LASA = [91.13, 29.65], BOMI = [95.77, 29.86];
    const JIARESA = [95.30, 29.20], SUILA = [95.15, 29.50], MEDOG = [95.33, 29.33];
    const GRAND_BEND = [95.00, 29.60], ERLANG = [102.35, 29.85], Q72 = [102.47, 29.73];
    const NORTH = [CHANGAN, [103.8, 36.1], [98.0, 39.3], [90.0, 40.3], [82.5, 39.5], [74.0, 38.4], AFG];
    const SECRET = [CHENGDU, [101.6, 27.8], [98.6, 25.6], [94.0, 24.2], [88.0, 23.4], [82.0, 22.8], INDIA];
    const HOMEWARD = NORTH.slice().reverse();
    const BAMBOO_ROUTE = [QIONG, [95, 33.5], [82, 35.5], AFG];
    const SCOUT_ROUTES = [[CHENGDU, [99, 27], [95, 24]], [CHENGDU, [102, 25], YUNNAN], [CHENGDU, [98, 31], [92, 33]]];
    const JINNIU = [CHENGDU, [105.5, 31.8], [107.5, 32.2], [108.5, 33.2]];
    const SOUTH_MARCH = [CHANGAN, [106, 29], YUNNAN];
    const SEA_TRADE = [CHENGDU, [98, 24], [88, 18], INDIAN_OCEAN];
    const FAR_WEST = [SANXINGDUI, [75, 34], [55, 34], SUMER];
    // 全片新增路线（全部为方向示意）
    const YUNNAN_ROAD = [CHENGDU, [102.7, 25.0], [97.5, 21.8], [92.0, 22.0], INDIA];
    const LIXIHOFEN = [CHANGAN, [103.0, 36.0], [98.0, 39.3], [90.0, 40.3], [82.5, 39.5], [74.0, 38.4], [70.0, 37.0]];
    const SHU_SHENDU = [CHENGDU, [102.5, 30.8], [100.0, 31.6], [96.0, 31.6], [92.0, 30.6], [88.0, 28.6], [84.0, 26.4], [80.0, 23.4], INDIA];
    const G318 = [CHENGDU, [103.5, 30.2], [102.4, 29.9], [101.0, 29.6], [99.0, 29.7], [97.0, 29.7], [95.0, 29.6], [93.0, 29.6], LASA];
    const SUILA_ROUTE = [JIARESA, [95.15, 29.50], [95.45, 29.75], BOMI];
    const MEDOG_ROAD = [BOMI, [95.55, 29.60], MEDOG];
    const PAI_MEDOG = [[94.90, 29.50], [95.10, 29.40], MEDOG];

    G.scale({ at: 1.0, until: fin, pos: 'br' });
    G.north({ at: 1.0, until: fin, pos: 'tr' });

    // ============ 第 1 段 · 张骞的报告与秘道（沿用 34s 成片的固化逻辑） ============
    G.title({ kicker: '公元前一百二十多年', text: '一件奇怪的报告', sub: '地图动画 · 全片', at: 0.25, until: 3.05, size: 84 });
    G.label(CHANGAN, '长安', { kind: 'city', dir: 'e', at: a1 + 1.7, until: E[0] });
    G.label(AFG, '阿富汗', { kind: 'city', dir: 'w', at: a1 + 2.1, until: E[0] });
    G.label(CHENGDU, '蜀地', { kind: 'town', dir: 'n', at: a3 + 1.5, until: E[0] });
    G.label(INDIA, '印度', { kind: 'city', dir: 's', at: a7 + 0.9, until: E[0] });
    const north = G.line(NORTH, { color: 'muted', width: 3.5, dash: [7, 7], at: a1 + 1.4, dur: 2.4, until: S[1] });
    G.travel(north, { at: a1 + 2.4, dur: 2.2, marker: 'dot', color: 'ink', from: 1, to: 0, until: a2 + 0.2 });
    G.callout(CHANGAN, { kicker: '张骞 · 汉武帝', title: '一件奇怪的报告', sub: '从阿富汗回来', at: a1 + 3.0, until: a2 + 0.15, side: 't' });
    G.note('官方北线（示意）', { at: a1 + 2.0, until: a3 + 0.1, pos: 'tl' });
    G.pins([AFG], { at: a2 + 0.25, stagger: 0.1, until: a4, style: 'pin', color: 'accent' });
    G.callout(AFG, { kicker: '阿富汗', title: '集市', sub: '两根四川的东西', at: a2 + 0.6, until: a3 + 0.5, side: 'r' });
    G.line([CHENGDU, AFG], { color: 'accent', width: 2.6, dash: [5, 8], at: a3 + 1.5, dur: 1.4, until: a6 + 0.6 });
    G.line([QIONG, AFG], { color: 'accent', width: 2.6, dash: [5, 8], at: a3 + 1.8, dur: 1.4, until: a6 + 0.6 });
    G.legend({ title: '两根四川的东西', rows: [{ color: 'accent', text: '蜀布' }, { color: 'accent', dash: true, text: '邛竹杖' }], note: '产地（示意）', at: a3 + 0.8, until: a4 + 1.1, pos: 'bl', width: 300 });
    G.callout(CHANGAN, { kicker: '汉武帝', title: '皇帝当时就愣了', at: a4, until: a5 + 0.25, side: 'r', size: 40 });
    G.note('一万二千里', { at: a5 + 0.25, until: a6 + 0.2, pos: 'tc', size: 40 });
    G.label(XIONGNU, '匈奴骑兵', { kind: 'note', at: a5 + 0.9, until: a6 + 1.0, dir: 'n' });
    G.label([95, 34], '青藏高原', { kind: 'note', at: a5 + 1.5, until: a6 + 1.0, dir: 's' });
    G.label(DESERT, '大沙漠', { kind: 'note', at: a5 + 2.1, until: a6 + 1.0, dir: 'n' });
    G.callout(AFG, { kicker: '西亚集市', title: '几千公里外', sub: '怎么绕过去的', at: a6 + 0.4, until: a7 + 0.15, side: 'r' });
    const secret = G.line(SECRET, { color: 'accent', width: 6, at: a7 + 0.45, dur: 2.3, until: S[1] });
    G.travel(secret, { at: a7 + 0.45, dur: 2.3, marker: 'dot', color: 'accent', until: E[0] });
    G.callout(CHENGDU, { kicker: '汉朝官方视野之外', title: '一条直通印度的秘道', sub: '秘道（示意）', at: a7 + 1.3, until: a8 + 0.9, side: 'l', size: 38 });
    G.note('四川 → 印度', { at: a7 + 0.8, until: a8, pos: 'tl', size: 34 });
    G.note('方向示意，非实测路线', { at: a7 + 0.5, until: E[0], pos: 'br' });

    // ============ 第 2 段 · 汉武帝算账：买马与两条被堵的路 ============
    G.label(QINGHAI, '青海', { kind: 'town', dir: 'n', at: S[1] + 1.0, until: E[1] });
    G.label(XIONGNU, '匈奴', { kind: 'note', at: S[1] + 1.6, until: E[1], dir: 'n' });
    G.line([[108.94, 34.34], [98, 39.3], AFG], { color: 'muted', width: 3, dash: [7, 7], at: S[1] + 0.5, dur: 2.0, until: E[1] });
    G.line([CHANGAN, QINGHAI, [82, 36], AFG], { color: 'muted', width: 3, dash: [7, 7], at: S[1] + 1.2, dur: 2.2, until: E[1] });
    G.callout(CHANGAN, { kicker: '汉武帝', title: '最缺战马', sub: '从长安去阿富汗买马', at: S[1] + 1.4, until: E[1] + 0.3, side: 't', size: 42 });
    G.note('北线一出河西走廊就被匈奴截', { at: S[1] + 3.0, until: S[1] + 6.0, pos: 'tc' });
    G.note('西线走青海，羌人又凶得很', { at: S[1] + 6.0, until: E[1], pos: 'tc' });

    // ============ 第 3 段 · 分几路探路 ============
    G.label(CHENGDU, '四川西部', { kind: 'town', dir: 'n', at: S[2] + 0.4, until: E[2] });
    SCOUT_ROUTES.forEach((r, i) => G.line(r, { color: 'accent', width: 2.8, dash: [6, 8], at: S[2] + 1.0 + i * 0.5, dur: 2.2, until: E[2] + 0.4 }));
    G.callout(CHENGDU, { kicker: '派张骞牵头', title: '分好几路', sub: '同时往外探路', at: S[2] + 1.6, until: E[2], side: 'r', size: 40 });
    G.note('没有卫星地图，没有定位', { at: S[2] + 5.0, until: S[2] + 9.0, pos: 'tc' });
    G.note('原始森林和雪山里硬蹚', { at: S[2] + 9.0, until: E[2], pos: 'tc' });

    // ============ 第 4 段 · 昆明夷阻路、汉军南下 ============
    G.label(YUNNAN, '云南', { kind: 'city', dir: 'e', at: S[3] + 0.5, until: E[3] });
    G.label(DIAN, '古滇国', { kind: 'town', dir: 'w', at: S[3] + 2.0, until: E[3] });
    G.label(YELANG, '夜郎', { kind: 'town', dir: 'e', at: S[3] + 2.6, until: E[3] });
    G.line(SOUTH_MARCH, { color: 'accent', width: 4, dash: [8, 6], at: S[3] + 4.0, dur: 3.0, until: E[3] + 0.5 });
    G.callout(YUNNAN, { kicker: '昆明夷', title: '摁在半路', sub: '不但不让过，还劫杀汉使', at: S[3] + 0.8, until: S[3] + 8.0, side: 'l', size: 40 });
    G.callout(DIAN, { kicker: '反手派兵南下', title: '古滇国和夜郎', sub: '路没找着，先灭了俩国', at: S[3] + 9.0, until: E[3] + 0.4, side: 'r', size: 38 });
    G.note('我们可能被引到云南去了', { at: S[3] + 15.0, until: E[3], pos: 'tc' });

    // ============ 第 5 段 · 悬崖开路之问 ============
    G.label(DABA, '大巴山', { kind: 'town', dir: 'n', at: S[4] + 0.3, until: E[4] });
    G.callout(DABA, { kicker: '要回答这个问题', title: '在悬崖上开路', sub: '古代的四川人', at: S[4] + 0.5, until: E[4] + 0.5, side: 't', size: 40 });

    // ============ 第 6 段 · 石牛粪金与金牛道 ============
    G.label(CHENGDU, '成都', { kind: 'city', dir: 'n', at: S[5] + 0.5, until: E[5] });
    G.label(DABA, '大巴山', { kind: 'town', dir: 'n', at: S[5] + 1.0, until: E[5] });
    G.line(JINNIU, { color: 'accent', width: 5, at: S[5] + 10.0, dur: 3.5, until: E[5] + 0.5 });
    G.callout(CHENGDU, { kicker: '秦国', title: '五头大石牛', sub: '牛屁股后面撒金子', at: S[5] + 0.8, until: S[5] + 9.0, side: 'l', size: 42 });
    G.callout(DABA, { kicker: '蜀王', title: '五个大力士', sub: '逢山开路遇水搭桥', at: S[5] + 9.5, until: S[5] + 19.0, side: 'r', size: 40 });
    G.callout(CHANGAN, { kicker: '等路修通了', title: '秦国的大军', sub: '蜀国，就这么没了', at: S[5] + 19.5, until: E[5] + 0.4, side: 'r', size: 40 });
    G.note('今天成都还有个金牛区', { at: S[5] + 24.0, until: E[5], pos: 'tc' });

    // ============ 第 7 段 · 能不能翻青藏高原 ============
    G.label(PLATEAU, '青藏高原', { kind: 'note', at: S[6] + 0.5, until: E[6], dir: 'n' });
    G.line([CHENGDU, [96, 30], PLATEAU, [88, 26], INDIA], { color: 'accent', width: 3.5, dash: [6, 8], at: S[6] + 1.0, dur: 3.0, until: E[6] + 0.4 });
    G.callout(PLATEAU, { kicker: '连大巴山都能凿穿', title: '连青藏高原都翻过去了', sub: '青藏高原', at: S[6] + 1.5, until: E[6] + 0.3, side: 'l', size: 38 });

    // ============ 第 8 段 · 三星堆 ============
    G.label(SANXINGDUI, '三星堆', { kind: 'city', dir: 'e', at: S[7] + 0.2, until: E[8] });
    G.callout(SANXINGDUI, { kicker: '真凭实据', title: '从三星堆挖出来的', at: S[7] + 0.2, until: E[7] + 0.6, side: 'r', size: 40 });

    // ============ 第 9 段 · 象牙、海贝与印度洋商路 ============
    G.label([72, 16], '印度洋', { kind: 'water', dir: 'n', at: S[8] + 3.0, until: E[8] });
    G.label([110, 18], '南海', { kind: 'water', dir: 'n', at: S[8] + 3.6, until: E[8] });
    G.line(SEA_TRADE, { color: 'accent', width: 4, dash: [7, 7], at: S[8] + 5.0, dur: 3.5, until: E[8] + 0.5 });
    G.callout(SANXINGDUI, { kicker: '祭祀坑里', title: '上千根象牙', sub: '还有一大堆海贝', at: S[8] + 0.5, until: S[8] + 9.0, side: 'r', size: 42 });
    G.callout(INDIAN_OCEAN, { kicker: '货贝和环纹贝', title: '印度洋和南海的暖水', sub: '古蜀人做买卖', at: S[8] + 9.5, until: E[8] + 0.4, side: 'l', size: 38 });
    G.note('买卖做到了印度洋边上', { at: S[8] + 18.0, until: E[8], pos: 'tc' });

    // ============ 第 10 段 · 青铜大面具与遥远的对视 ============
    G.label(SUMER, '苏美尔', { kind: 'town', dir: 's', at: S[9] + 2.0, until: E[9] });
    G.label(EGYPT, '古埃及', { kind: 'town', dir: 's', at: S[9] + 2.6, until: E[9] });
    G.label(LONDON, '伦敦', { kind: 'town', dir: 's', at: S[9] + 3.2, until: E[9] });
    G.line(FAR_WEST, { color: 'muted', width: 3, dash: [7, 9], at: S[9] + 3.0, dur: 3.5, until: E[9] });
    G.callout(SANXINGDUI, { kicker: '更怪的是', title: '青铜大面具', sub: '眼睛突出、耳朵拉得老长', at: S[9] + 0.5, until: S[9] + 10.0, side: 'r', size: 42 });
    G.callout(LONDON, { kicker: '一九九六年', title: '伦敦一次考古会', sub: '全场鸦雀无声', at: S[9] + 10.5, until: E[9] + 0.4, side: 'r', size: 38 });
    G.note('中间不可能没有一条踩出来的路', { at: S[9] + 18.0, until: E[9] + 1.0, pos: 'tc', size: 34 });
    G.note('方向示意，非实测路线', { at: S[9] + 1.0, until: E[9], pos: 'br' });

    // ============ 第 11 段 · 云南道不是主力 ============
    G.label(YUNNAN, '云南', { kind: 'city', dir: 'e', at: S[10] + 1.2, until: E[10] });
    G.label([96.5, 21.5], '缅甸', { kind: 'town', dir: 's', at: S[10] + 1.8, until: E[10] });
    G.line(YUNNAN_ROAD, { color: 'muted', width: 3, dash: [6, 8], at: S[10] + 1.2, dur: 2.2, until: E[10] });
    G.callout(YUNNAN, { kicker: '传统说法', title: '四川走云南，下缅甸', sub: '进印度', at: S[10] + 0.6, until: S[10] + 4.6, side: 'l', size: 38 });
    G.note('云南那条道，不是主力', { at: S[10] + 5.2, until: E[10], pos: 'tc' });

    // ============ 第 12 段 · 李希霍芬与丝绸之路 ============
    G.label(CHANGAN, '长安', { kind: 'city', dir: 's', at: S[11] + 0.2, until: S[11] + 8.0 });
    G.label([101.0, 39.0], '河西走廊', { kind: 'note', dir: 'n', at: S[11] + 5.0, until: S[11] + 12.0 });
    G.label([85.0, 41.0], '新疆', { kind: 'town', dir: 'n', at: S[11] + 6.2, until: S[11] + 12.5 });
    G.label([73.0, 38.0], '帕米尔', { kind: 'town', dir: 'n', at: S[11] + 7.4, until: S[11] + 13.5 });
    G.line(LIXIHOFEN, { color: 'accent', width: 3.5, dash: [7, 8], at: S[11] + 4.0, dur: 4.0, until: S[11] + 13.5 });
    G.callout([70.0, 37.0], { kicker: '李希霍芬', title: '丝绸之路', sub: '就是他命名的', at: S[11] + 4.6, until: S[11] + 10.5, side: 'r', size: 40 });
    G.label(DUJIANGYAN, '都江堰', { kind: 'town', dir: 'e', at: S[11] + 14.5, until: E[11] });
    G.label(JIANGEGUAN, '剑门关', { kind: 'town', dir: 'e', at: S[11] + 16.0, until: E[11] });
    G.callout(JIANGEGUAN, { kicker: '晚年钻进四川', title: '张骞找错方向了', sub: '站都江堰看玉垒山，爬剑门关看栈道', at: S[11] + 14.8, until: E[11] + 0.4, side: 'r', size: 40 });

    // ============ 第 13 段 · 蜀身毒道西线与三个难题 ============
    G.label(CHENGDU, '成都', { kind: 'city', dir: 'n', at: S[12] + 0.3, until: E[12] });
    G.label(PLATEAU, '青藏高原', { kind: 'note', dir: 'n', at: S[12] + 2.2, until: E[12] });
    G.label(HIMALAYA, '喜马拉雅', { kind: 'note', dir: 's', at: S[12] + 5.0, until: E[12] });
    G.label(INDIA, '印度', { kind: 'city', dir: 's', at: S[12] + 7.0, until: E[12] });
    G.line(SHU_SHENDU, { color: 'accent', width: 5, at: S[12] + 2.0, dur: 4.0, until: E[12] + 0.4 });
    G.callout(CHENGDU, { kicker: '真正的蜀身毒道', title: '不该往云南绕', sub: '成都往西，顺河谷上青藏高原', at: S[12] + 0.4, until: S[12] + 9.5, side: 'r', size: 38 });
    G.note('最短的一条线', { at: S[12] + 9.6, until: S[12] + 11.0, pos: 'tc' });
    G.note('没炸药没机械，怎么开山？', { at: S[12] + 11.0, until: S[12] + 15.0, pos: 'tc' });
    G.note('栈道的遗址在哪？', { at: S[12] + 15.1, until: S[12] + 16.6, pos: 'tc' });
    G.note('喜马拉雅，人怎么翻？', { at: S[12] + 16.7, until: E[12], pos: 'tc' });

    // ============ 第 14 段 · 老石匠火烧泼水 ============
    G.label(JIANGEGUAN, '剑门关', { kind: 'town', dir: 'n', at: S[13] + 0.3, until: E[13] });
    G.callout(JIANGEGUAN, { kicker: '第一个难题', title: '老石匠早就解了', at: S[13] + 0.3, until: S[13] + 5.0, side: 'r', size: 40 });
    G.callout(JIANGEGUAN, { kicker: '祖传的开山法子', title: '火烧泼水', sub: '笨得离谱', at: S[13] + 5.5, until: S[13] + 11.0, side: 'l', size: 40 });
    G.note('先烧红，再泼一桶冰水', { at: S[13] + 6.2, until: S[13] + 10.2, pos: 'tc' });
    G.note('石头自己炸裂', { at: S[13] + 10.4, until: E[13], pos: 'tc' });

    // ============ 第 15 段 · 桩孔、五年、栈道一成 ============
    G.note('四十厘米宽、七十厘米深', { at: S[14] + 2.4, until: S[14] + 7.0, pos: 'tc' });
    G.note('一万个桩孔 · 一百个石匠 · 四百天', { at: S[14] + 7.2, until: S[14] + 10.5, pos: 'tc' });
    G.note('栈道只占一成', { at: S[14] + 11.0, until: S[14] + 14.0, pos: 'tc' });
    G.note('五年也能蹚出一条道', { at: S[14] + 15.0, until: S[14] + 21.0, pos: 'tc' });
    G.note('第二个难题，解了一半', { at: S[14] + 21.2, until: E[14], pos: 'tc' });

    // ============ 第 16 段 · 两千年没断过 ============
    G.line([CHENGDU, [98, 31], [93, 30], [89, 29], HIMALAYA], { color: 'accent', width: 4, at: S[15] + 0.4, dur: 2.2, until: S[16] + 0.4 });
    G.note('这条路，两千年了，根本没断过', { at: S[15] + 1.2, until: E[15], pos: 'tc' });

    // ============ 第 17 段 · 318 国道、二郎山、雪崩 ============
    G.label(CHENGDU, '成都', { kind: 'city', dir: 's', at: S[16] + 0.3, until: E[16] });
    G.label(LASA, '拉萨', { kind: 'city', dir: 'e', at: S[16] + 1.0, until: E[16] });
    G.line(G318, { color: 'accent', width: 4, dash: [8, 6], at: S[16] + 0.5, dur: 3.5, until: E[16] + 0.4 });
    G.callout(CHENGDU, { kicker: '上世纪五十年代', title: '解放军进西藏', sub: '一双手两条腿', at: S[16] + 0.6, until: S[16] + 7.5, side: 'r', size: 40 });
    G.label(ERLANG, '二郎山', { kind: 'town', dir: 'n', at: S[16] + 10.5, until: E[16] });
    G.label(Q72, '七十二道拐', { kind: 'note', dir: 'e', at: S[16] + 12.2, until: E[16] });
    G.note('一百公里，海拔五百米抬到三千米', { at: S[16] + 10.4, until: S[16] + 14.0, pos: 'tc' });
    G.note('眼睛在天堂，身体在地狱', { at: S[16] + 23.4, until: E[16], pos: 'tc' });

    // ============ 第 18 段 · 喜马拉雅怎么翻 ============
    G.label(LASA, '拉萨', { kind: 'city', dir: 'e', at: S[17] + 0.2, until: S[17] + 5.5 });
    G.label(HIMALAYA, '喜马拉雅', { kind: 'note', dir: 's', at: S[17] + 1.0, until: E[17] });
    G.label(INDIA, '印度', { kind: 'city', dir: 's', at: S[17] + 2.4, until: E[17] });
    G.note('世界屋脊', { at: S[17] + 0.4, until: S[17] + 3.8, pos: 'tc' });
    G.note('连鸟都飞不过去', { at: S[17] + 4.0, until: E[17], pos: 'tc' });

    // ============ 第 19 段 · 雅鲁藏布江大拐弯、加雷萨 ============
    G.label(GRAND_BEND, '雅鲁藏布江大拐弯', { kind: 'water', dir: 'n', at: S[18] + 0.3, until: E[18] });
    G.label(JIARESA, '加雷萨村', { kind: 'town', dir: 'e', at: S[18] + 2.6, until: S[19] + 6.0 });
    G.callout(GRAND_BEND, { kicker: '二零一零年', title: '一个摄影队', sub: '钻进西藏东南角', at: S[18] + 0.4, until: S[18] + 5.0, side: 'l', size: 38 });
    G.note('全村六百人', { at: S[18] + 5.8, until: E[18], pos: 'tc' });

    // ============ 第 20 段 · 十个月封山 ============
    G.note('朝南的山谷，四季如春', { at: S[19] + 1.0, until: S[19] + 4.2, pos: 'tc' });
    G.note('一年十个月大雪封山', { at: S[19] + 4.4, until: S[19] + 9.0, pos: 'tc' });
    G.note('只有八九月能进出', { at: S[19] + 9.2, until: S[19] + 12.0, pos: 'tc' });
    G.note('十个月与世隔绝', { at: S[19] + 12.2, until: S[19] + 16.0, pos: 'tc' });
    G.note('换零件得拿命翻过山去背', { at: S[19] + 16.2, until: E[19], pos: 'tc' });

    // ============ 第 21 段 · 马队翻随拉山到波密 ============
    G.label(SUILA, '随拉山', { kind: 'town', dir: 'w', at: S[20] + 2.5, until: E[20] });
    G.label(BOMI, '波密', { kind: 'town', dir: 'e', at: S[20] + 4.0, until: E[20] });
    G.line(SUILA_ROUTE, { color: 'accent', width: 3.5, dash: [6, 6], at: S[20] + 3.5, dur: 2.5, until: E[20] + 0.4 });
    G.callout(SUILA, { kicker: '每年雪一化', title: '组织马队', sub: '四千六百五十米', at: S[20] + 3.8, until: S[20] + 10.5, side: 'l', size: 38 });
    G.note('木材、粮食、家具、金属窗', { at: S[20] + 11.2, until: S[20] + 15.0, pos: 'tc' });
    G.note('这不是赶集，这是赌命', { at: S[20] + 15.5, until: E[20], pos: 'tc' });

    // ============ 第 22 段 · 吉格与珞巴族 ============
    G.callout(JIARESA, { kicker: '领队', title: '吉格 · 三十三岁', sub: '跑这条线跑了八年', at: S[21] + 0.3, until: S[21] + 4.5, side: 'r', size: 40 });
    G.note('珞巴人 · 不到三千人', { at: S[21] + 3.2, until: S[21] + 7.0, pos: 'tl' });
    G.note('十一岁跟着父亲跑运输', { at: S[21] + 6.8, until: S[21] + 11.5, pos: 'tr' });
    G.note('二十五岁，成了家里的顶梁柱', { at: S[21] + 16.2, until: E[21], pos: 'tc' });

    // ============ 第 23 段 · 一台洗衣机 ============
    G.callout(JIARESA, { kicker: '八月的一天', title: '他备马准备进山', at: S[22] + 0.2, until: S[22] + 3.0, side: 'l', size: 38 });
    G.callout(JIARESA, { kicker: '妻子轻轻说了一句', title: '今年，想要一台洗衣机', at: S[22] + 2.0, until: S[22] + 8.5, side: 'r', size: 40 });
    G.note('那么高的山，那么险的路', { at: S[22] + 6.0, until: S[22] + 8.6, pos: 'tc' });
    G.callout(JIARESA, { kicker: '吉格没多话', title: '那是当年我背回来的', sub: '屋里的电视和大衣柜', at: S[22] + 9.2, until: E[22], side: 'l', size: 38 });

    // ============ 第 24 段 · 7 人 19 马、悬崖雪崩 ============
    G.line(SUILA_ROUTE, { color: 'accent', width: 3.5, dash: [6, 6], at: S[23] + 0.4, dur: 2.2, until: E[23] + 0.4 });
    G.note('七个人，十九匹马', { at: S[23] + 0.5, until: S[23] + 3.0, pos: 'tc' });
    G.note('中午之前必须翻过山口', { at: S[23] + 3.2, until: S[23] + 6.5, pos: 'tc' });
    G.note('氧气只有平原的六成', { at: S[23] + 6.6, until: S[23] + 9.5, pos: 'tc' });
    G.note('三十公斤的洗衣机', { at: S[23] + 9.6, until: S[23] + 14.0, pos: 'tc' });
    G.note('八年前，叔叔遇上雪崩', { at: S[23] + 14.2, until: S[23] + 18.0, pos: 'tc' });
    G.note('七条人命没了', { at: S[23] + 18.2, until: E[23], pos: 'tc' });

    // ============ 第 25 段 · 翻过山、雨林、冰箱 ============
    G.note('可吉格翻过去了', { at: S[24] + 0.2, until: S[24] + 2.0, pos: 'tc' });
    G.note('从雪山扎进热带雨林', { at: S[24] + 2.0, until: S[24] + 5.5, pos: 'tl' });
    G.note('蛇、熊和蚂蟥', { at: S[24] + 5.0, until: S[24] + 7.0, pos: 'tr' });
    G.callout(JIARESA, { kicker: '到家那天下午', title: '先演示洗衣机怎么用', at: S[24] + 7.0, until: S[24] + 10.8, side: 'l', size: 38 });
    G.note('明年，我想要台冰箱', { at: S[24] + 11.0, until: E[24], pos: 'tc' });

    // ============ 第 26 段 · 世界屋脊的一道缝 ============
    G.label([94.2, 28.2], '岗日嘎布', { kind: 'note', dir: 's', at: S[25] + 4.0, until: E[25] });
    G.note('随拉山，位置太巧了', { at: S[25] + 1.2, until: S[25] + 4.0, pos: 'tc' });
    G.note('喜马拉雅东端最薄的缺口', { at: S[25] + 4.2, until: S[25] + 9.0, pos: 'tc' });
    G.note('地球留下的一道没合严的缝', { at: S[25] + 9.2, until: E[25], pos: 'tc' });

    // ============ 第 27 段 · 墨脱、派墨公路、三千年 ============
    G.label(BOMI, '波密', { kind: 'town', dir: 'n', at: S[26] + 0.3, until: E[26] });
    G.label(MEDOG, '墨脱', { kind: 'city', dir: 's', at: S[26] + 0.8, until: E[26] });
    G.label([95.0, 29.6], '三一八国道', { kind: 'note', dir: 'w', at: S[26] + 0.3, until: S[26] + 7.0 });
    G.line(MEDOG_ROAD, { color: 'accent', width: 4, at: S[26] + 4.0, dur: 2.2, until: E[26] + 0.4 });
    G.line(PAI_MEDOG, { color: 'accent', width: 4, dash: [6, 6], at: S[26] + 10.0, dur: 2.2, until: E[26] + 0.4 });
    G.note('中国最后一个通公路的县', { at: S[26] + 3.0, until: S[26] + 9.5, pos: 'tl' });
    G.note('二零一三年底通车', { at: S[26] + 7.2, until: S[26] + 9.5, pos: 'tr' });
    G.note('二零二二年，派墨公路', { at: S[26] + 9.8, until: S[26] + 13.0, pos: 'tc' });
    G.note('三千年，走的都是这道缝', { at: S[26] + 13.2, until: E[26], pos: 'tc' });

    // ============ 第 28 段 · 吉格的脸与三星堆 ============
    G.label(SANXINGDUI, '三星堆', { kind: 'city', dir: 's', at: S[27] + 1.6, until: E[27] });
    G.label(JIARESA, '加雷萨', { kind: 'town', dir: 'e', at: S[27] + 0.3, until: S[27] + 7.0 });
    G.callout(JIARESA, { kicker: '有人盯着吉格的脸', title: '有几分像三星堆面具', sub: '轮廓、高颧骨', at: S[27] + 0.4, until: S[27] + 7.0, side: 'l', size: 38 });
    G.line([JIARESA, SANXINGDUI], { color: 'accent', width: 3, dash: [6, 8], at: S[27] + 6.2, dur: 2.0, until: E[27] });
    G.note('三千年前，第一条商路', { at: S[27] + 9.0, until: E[27], pos: 'tc' });

    // ============ 第 29 段 · 暖气房与雪山 ============
    G.note('今天你刷到这条视频，可能正躺在有暖气的屋里', { at: S[28] + 0.2, until: S[28] + 5.0, pos: 'tc' });
    G.note('同一个星球，四千六百米的雪山', { at: S[28] + 4.0, until: E[28], pos: 'tc' });

    // ============ 第 30 段 · 普通人背出来的世界 ============
    G.callout([CHENGDU], { kicker: '文明交流 · 丝绸之路', title: '不是帝王将相画出来的', at: S[29] + 0.4, until: S[29] + 6.0, side: 'r', size: 38 });
    G.note('从来不是诏书', { at: S[29] + 6.2, until: S[29] + 9.0, pos: 'tl' });
    G.note('一个个想把日子过好的普通人', { at: S[29] + 8.5, until: S[29] + 14.0, pos: 'tc' });
    G.note('贝壳、象牙、丝绸和一整个文明的对视', { at: S[29] + 14.2, until: S[29] + 20.5, pos: 'tc' });
    G.note('一代一代，硬踩出来的', { at: S[29] + 20.8, until: E[29], pos: 'tc' });

    // ============ 第 31 段 · 每一个弯 ============
    G.note('古道申遗、盘山隧道通车', { at: S[30] + 0.3, until: S[30] + 5.0, pos: 'tc' });
    G.note('那路的每一个弯', { at: S[30] + 5.2, until: S[30] + 8.5, pos: 'tl' });
    G.note('一步一步试出来的', { at: S[30] + 8.2, until: E[30], pos: 'tc' });

    // ============ 第 32 段 · 片尾 ============
    G.note('我是艾伦', { at: S[31] + 0.1, until: fin, pos: 'tc', size: 40 });

    // 常驻合规标注
    G.note('方向示意，非实测路线', { at: S[10] + 0.2, until: fin, pos: 'br' });

    // ============ 44 个漫画资产：锚定经纬度，随镜头移动 ============
    // 规范 ../../references/asset-spec.md §3：z-index 5（路线/城市之上）；人物用 lift 抬到路线「上方」。
    const artDefs = [
      // 段 1（固化规则：谁动谁不动）
      { f:'01_zhangqian.svg', path:HOMEWARD, from:a1+1.80, to:a1+4.20, w:240, at:a1+1.80, until:a1+4.70, dy:20, lift:200 },
      { f:'02_wudi.svg', ll:[112.5,30.5], w:260, at:a1+2.40, until:a2+0.30, dy:22, lift:215 },
      { f:'05_shu_cloth.svg', ll:[62.5,34.8], w:200, at:a2+0.35, until:S[1]+0.5, dy:28 },
      { f:'04_bamboo_staff.svg', ll:[68.5,33.6], w:170, at:a2+0.75, until:a6, dy:28 },
      { f:'04_bamboo_staff.svg', path:BAMBOO_ROUTE, from:a6+0.15, to:a6+3.15, w:150, at:a6+0.15, until:S[1]+0.5, dy:26 },
      { f:'03_xiongnu_rider.svg', ll:[111,44.5], w:300, at:a5+0.55, until:a6+0.80, dy:18 },
      { f:'06_tibetan_plateau.svg', ll:[89,35], w:250, at:a5+1.20, until:a6+0.80, dy:18 },
      { f:'07_desert.svg', ll:[74,41], w:250, at:a5+1.90, until:a6+0.80, dy:18 },
      { f:'08_ancient_traveler.svg', path:SECRET, from:a7, to:a7+3.90, w:170, at:a7, until:E[0]+0.4, dy:20, lift:170 },
      { f:'09_war_horse.svg', ll:[100,36.5], w:210, at:S[1]+1.0, until:E[1]+0.4, dy:18 },
      { f:'03_xiongnu_rider.svg', ll:[107,42], w:250, at:S[1]+2.0, until:E[1]+0.4, dy:16 },
      { f:'10_scout_party.svg', ll:[99,27.5], w:250, at:S[2]+1.2, until:E[2]+0.4, dy:18, lift:150 },
      { f:'08_ancient_traveler.svg', path:SCOUT_ROUTES[0], from:S[2]+2.0, to:S[2]+8.0, w:130, at:S[2]+2.0, until:E[2], dy:16, lift:130 },
      { f:'11_kunming_warrior.svg', ll:[102.7,25.0], w:210, at:S[3]+0.6, until:S[3]+9.0, dy:18, lift:180 },
      { f:'12_han_soldiers.svg', path:SOUTH_MARCH, from:S[3]+4.0, to:S[3]+11.0, w:230, at:S[3]+4.0, until:E[3]+0.4, dy:18, lift:180 },
      { f:'11_kunming_warrior.svg', ll:[105.5,27.2], w:170, at:S[3]+9.0, until:E[3]+0.4, dy:14, lift:145 },
      { f:'15_strongman.svg', ll:[107.5,32.2], w:210, at:S[4]+0.4, until:S[6]+0.5, dy:18, lift:175 },
      { f:'13_stone_ox.svg', ll:[106.0,32.8], w:150, at:S[5]+0.6, until:S[5]+12.0, dy:14 },
      { f:'13_stone_ox.svg', ll:[108.0,33.4], w:130, at:S[5]+1.4, until:S[5]+12.0, dy:14 },
      { f:'13_stone_ox.svg', ll:[104.5,33.2], w:120, at:S[5]+2.2, until:S[5]+12.0, dy:14 },
      { f:'14_gold_nuggets.svg', ll:[109.5,34.0], w:140, at:S[5]+1.0, until:S[5]+12.0, dy:14 },
      { f:'15_strongman.svg', path:JINNIU, from:S[5]+10.0, to:S[5]+20.0, w:180, at:S[5]+10.0, until:S[5]+21.0, dy:16, lift:155 },
      { f:'12_han_soldiers.svg', path:JINNIU, from:S[5]+19.5, to:S[5]+26.0, w:200, at:S[5]+19.5, until:E[5]+0.4, dy:16, lift:160 },
      { f:'06_tibetan_plateau.svg', ll:[89,32], w:230, at:S[6]+0.6, until:E[6]+0.4, dy:16 },
      { f:'16_sacrifice_pit.svg', ll:[104.2,31.0], w:230, at:S[7]+0.1, until:E[8]+0.5, dy:16 },
      { f:'17_ivory_tusks.svg', ll:[100.5,29.5], w:160, at:S[8]+0.5, until:S[8]+12.0, dy:14 },
      { f:'18_cowrie_shells.svg', ll:[107.0,28.0], w:160, at:S[8]+1.5, until:S[8]+12.0, dy:14 },
      { f:'20_shu_banner.svg', path:SEA_TRADE, from:S[8]+5.0, to:S[8]+18.0, w:170, at:S[8]+5.0, until:E[8]+0.4, dy:18, lift:150 },
      { f:'08_ancient_traveler.svg', path:SEA_TRADE, from:S[8]+6.0, to:S[8]+20.0, w:140, at:S[8]+6.0, until:E[8]+0.4, dy:16, lift:135 },
      { f:'19_bronze_mask.svg', ll:[104.2,31.0], w:250, at:S[9]+0.3, until:E[9]+0.5, dy:18 },
      { f:'19_bronze_mask.svg', ll:[44.0,32.0], w:150, at:S[9]+3.0, until:E[9]+0.5, dy:14 },
      // 段 11 · 探路队堵在云南
      { f:'10_scout_party.svg', ll:[102.7,25.0], w:210, at:S[10]+0.5, until:E[10]+0.3, dy:16, lift:150 },
      // 段 12 · 李希霍芬沿丝路考察，再入川
      { f:'21_lixihofen.svg', path:LIXIHOFEN, from:S[11]+3.8, to:S[11]+12.5, w:210, at:S[11]+3.8, until:S[11]+14.0, dy:20, lift:190 },
      { f:'39_dujiangyan.svg', ll:[103.62,31.00], w:210, at:S[11]+14.2, until:E[11]+0.3, dy:16 },
      { f:'38_jiange_pass.svg', ll:[105.56,32.25], w:240, at:S[11]+15.6, until:E[11]+0.3, dy:16 },
      // 段 13 · 蜀身毒道西线
      { f:'08_ancient_traveler.svg', path:SHU_SHENDU, from:S[12]+2.2, to:S[12]+8.5, w:150, at:S[12]+2.2, until:E[12]+0.3, dy:18, lift:145 },
      { f:'42_himalaya_peaks.svg', ll:[86.0,28.5], w:290, at:S[12]+4.6, until:S[13]+0.5, dy:16 },
      // 段 14 · 老石匠火烧泼水
      { f:'22_old_mason.svg', ll:[105.56,32.25], w:210, at:S[13]+0.4, until:E[13]+0.5, dy:20, lift:180 },
      { f:'33_fire_water.svg', ll:[106.2,32.5], w:170, at:S[13]+6.0, until:S[13]+11.5, dy:14 },
      { f:'31_suspension_plank.svg', ll:[105.2,32.4], w:200, at:S[13]+8.5, until:E[13]+0.5, dy:14 },
      // 段 15 · 桩孔与栈道
      { f:'32_stone_holes.svg', ll:[104.8,31.8], w:220, at:S[14]+1.2, until:S[14]+12.0, dy:14 },
      { f:'31_suspension_plank.svg', ll:[106.5,32.0], w:220, at:S[14]+11.0, until:E[14]+0.4, dy:14 },
      { f:'42_himalaya_peaks.svg', ll:[86.0,28.5], w:260, at:S[14]+22.5, until:S[15]+0.4, dy:16 },
      // 段 16 · 两千年没断
      { f:'08_ancient_traveler.svg', path:[CHENGDU, [98,31], [93,30], [89,29], [84,27], INDIA], from:S[15]+0.4, to:S[15]+3.0, w:150, at:S[15]+0.4, until:E[15]+0.4, dy:16, lift:140 },
      // 段 17 · 解放军修 318
      { f:'23_pla_soldier.svg', path:G318, from:S[16]+0.6, to:S[16]+12.0, w:200, at:S[16]+0.6, until:S[16]+14.0, dy:18, lift:180 },
      { f:'30_truck_318.svg', ll:[102.4,29.95], w:190, at:S[16]+9.0, until:E[16]+0.4, dy:14 },
      { f:'34_avalanche.svg', ll:[100.5,29.8], w:220, at:S[16]+17.0, until:E[16]+0.4, dy:14 },
      // 段 18 · 喜马拉雅
      { f:'42_himalaya_peaks.svg', ll:[86.0,28.5], w:290, at:S[17]+0.4, until:S[18]+0.4, dy:16 },
      // 段 19–20 · 大拐弯、加雷萨、封山
      { f:'43_photo_crew.svg', ll:[95.65,29.45], w:190, at:S[18]+0.5, until:S[18]+6.5, dy:16, lift:150 },
      { f:'35_village_jiaresa.svg', ll:[95.30,29.20], w:250, at:S[18]+2.2, until:S[21]+0.4, dy:16 },
      { f:'42_himalaya_peaks.svg', ll:[94.0,28.2], w:300, at:S[19]+0.8, until:E[19]+0.4, dy:14 },
      // 段 21 · 马队翻随拉山
      { f:'26_horse_caravan.svg', path:SUILA_ROUTE, from:S[20]+3.6, to:S[20]+11.0, w:240, at:S[20]+3.6, until:S[20]+13.0, dy:16, lift:150 },
      { f:'27_washing_machine.svg', ll:[96.1,29.9], w:120, at:S[20]+12.0, until:E[20]+0.4, dy:14 },
      // 段 22 · 吉格
      { f:'24_jige.svg', ll:[95.30,29.20], w:230, at:S[21]+0.4, until:S[22]+0.4, dy:20, lift:190 },
      // 段 23 · 洗衣机
      { f:'25_jige_wife.svg', ll:[95.55,29.25], w:210, at:S[22]+0.3, until:S[23]+0.4, dy:20, lift:180 },
      { f:'27_washing_machine.svg', ll:[94.95,29.05], w:140, at:S[22]+2.2, until:S[23]+0.4, dy:14 },
      { f:'29_tv_cabinet.svg', ll:[95.95,29.35], w:180, at:S[22]+9.0, until:E[22]+0.4, dy:14 },
      // 段 24 · 7 人 19 马
      { f:'26_horse_caravan.svg', path:SUILA_ROUTE, from:S[23]+0.5, to:S[23]+14.0, w:260, at:S[23]+0.5, until:E[23]+0.4, dy:16, lift:150 },
      { f:'24_jige.svg', path:SUILA_ROUTE, from:S[23]+3.0, to:S[23]+16.0, w:200, at:S[23]+3.0, until:E[23]+0.4, dy:18, lift:180 },
      { f:'34_avalanche.svg', ll:[94.85,28.65], w:230, at:S[23]+14.0, until:E[23]+0.4, dy:14 },
      // 段 25 · 雨林与冰箱
      { f:'36_tropical_forest.svg', ll:[95.10,28.40], w:260, at:S[24]+2.0, until:S[24]+7.0, dy:14 },
      { f:'35_village_jiaresa.svg', ll:[95.30,29.20], w:230, at:S[24]+6.5, until:E[24]+0.4, dy:16 },
      { f:'25_jige_wife.svg', ll:[95.55,29.20], w:180, at:S[24]+7.2, until:E[24]+0.4, dy:18, lift:170 },
      { f:'27_washing_machine.svg', ll:[94.95,29.00], w:120, at:S[24]+7.3, until:S[24]+11.0, dy:14 },
      { f:'28_fridge.svg', ll:[96.05,29.35], w:140, at:S[24]+11.0, until:E[24]+0.4, dy:14 },
      // 段 26 · 一道缝
      { f:'42_himalaya_peaks.svg', ll:[92.0,28.0], w:300, at:S[25]+0.6, until:S[26]+0.4, dy:14 },
      // 段 27 · 墨脱公路
      { f:'37_medog_road.svg', ll:[95.55,29.55], w:240, at:S[26]+2.0, until:E[26]+0.4, dy:14 },
      { f:'26_horse_caravan.svg', path:SUILA_ROUTE, from:S[26]+13.2, to:S[26]+18.0, w:150, at:S[26]+13.2, until:E[26]+0.4, dy:14, lift:90 },
      // 段 28 · 吉格与三星堆
      { f:'24_jige.svg', ll:[95.30,29.20], w:200, at:S[27]+0.4, until:S[27]+7.0, dy:18, lift:180 },
      { f:'19_bronze_mask.svg', ll:[104.2,31.0], w:220, at:S[27]+5.8, until:E[27]+0.4, dy:16 },
      { f:'26_horse_caravan.svg', ll:[99.5,27.0], w:170, at:S[27]+9.0, until:E[27]+0.4, dy:14, lift:100 },
      { f:'17_ivory_tusks.svg', ll:[101.5,29.0], w:130, at:S[27]+9.2, until:E[27]+0.4, dy:12 },
      { f:'18_cowrie_shells.svg', ll:[97.0,26.8], w:130, at:S[27]+9.2, until:E[27]+0.4, dy:12 },
      // 段 29 · 暖气房与雪山
      { f:'35_village_jiaresa.svg', ll:[95.3,29.2], w:220, at:S[28]+2.0, until:E[28]+0.4, dy:14 },
      // 段 30 · 普通人背出来的世界
      { f:'44_goods_pile.svg', ll:[97.0,27.0], w:260, at:S[29]+12.0, until:E[29]+0.4, dy:14 },
      { f:'41_footprints.svg', ll:[90.0,27.0], w:300, at:S[29]+19.0, until:E[29]+0.4, dy:14 },
      // 段 31 · 每一个弯
      { f:'41_footprints.svg', ll:[95.0,27.0], w:280, at:S[30]+4.0, until:E[30]+0.4, dy:14 },
      { f:'37_medog_road.svg', ll:[98.5,28.0], w:220, at:S[30]+5.5, until:E[30]+0.4, dy:14 },
    ];

    // 贴纸层：z-index 5（路线/城市之上）；人物用 lift 抬到路线「上方」（规范见 references/asset-spec.md §3）
    await MAP_STICKERS(G, artDefs, { dir: 'assets/models/' });

    // ============ 一条连续镜头（全程平面地图，仅片头地球） ============
    G.camera([
      { at: 0,        center: [88, 35], zoom: 2.0 },
      { at: a1+0.15,  center: [90, 36], zoom: 4.5, dur: 2.6 },
      { at: a2+0.1,   center: [70, 35], zoom: 5.7, dur: 1.7 },
      { at: a3+0.1,   center: [88, 33], zoom: 4.9, dur: 1.9 },
      { at: a4,       center: [103, 33], zoom: 5.5, dur: 1.1 },
      { at: a5+0.1,   center: [90, 37], zoom: 4.5, dur: 1.7 },
      { at: a6+0.1,   center: [90, 33], zoom: 4.4, dur: 1.6 },
      { at: a7+0.1,   center: [93, 28], zoom: 4.9, dur: 1.9 },
      { at: a8+0.1,   center: [90, 30], zoom: 4.2, dur: 2.3 },
      { at: S[1]+0.2, center: [92, 35], zoom: 4.6, dur: 2.2 },
      { at: S[2]+0.2, center: [98, 29], zoom: 5.0, dur: 2.2 },
      { at: S[3]+0.2, center: [103, 27], zoom: 5.2, dur: 2.2 },
      { at: S[4]+0.2, center: [106, 31], zoom: 5.4, dur: 1.6 },
      { at: S[5]+0.2, center: [106, 32], zoom: 5.2, dur: 2.0 },
      { at: S[6]+0.2, center: [95, 30], zoom: 4.8, dur: 2.0 },
      { at: S[7]+0.2, center: [104, 30], zoom: 5.8, dur: 1.8 },
      { at: S[8]+0.2, center: [94, 22], zoom: 4.0, dur: 2.4 },
      { at: S[9]+0.2, center: [58, 36], zoom: 3.8, dur: 2.4 },
      { at: S[10]+0.2, center: [99, 25], zoom: 5.0, dur: 2.0 },
      { at: S[11]+0.2, center: [88, 36], zoom: 3.9, dur: 2.2 },
      { at: S[11]+14.2, center: [104, 31], zoom: 6.2, dur: 2.4 },
      { at: S[12]+0.2, center: [94, 30], zoom: 4.4, dur: 2.2 },
      { at: S[13]+0.2, center: [106, 31.5], zoom: 6.6, dur: 1.8 },
      { at: S[14]+0.2, center: [106, 31.5], zoom: 6.8, dur: 1.8 },
      { at: S[15]+0.2, center: [101, 30], zoom: 5.4, dur: 2.0 },
      { at: S[16]+0.2, center: [101, 29], zoom: 5.2, dur: 2.0 },
      { at: S[16]+7.0, center: [95, 29.6], zoom: 5.0, dur: 2.0 },
      { at: S[16]+10.3, center: [102.4, 29.8], zoom: 6.4, dur: 2.2 },
      { at: S[17]+0.2, center: [89, 28], zoom: 4.0, dur: 2.2 },
      { at: S[18]+0.2, center: [95, 29.4], zoom: 6.4, dur: 2.0 },
      { at: S[19]+0.2, center: [95.2, 29.2], zoom: 7.0, dur: 1.8 },
      { at: S[20]+0.2, center: [95.2, 29.0], zoom: 6.6, dur: 1.8 },
      { at: S[21]+0.2, center: [95.2, 29.1], zoom: 7.2, dur: 1.8 },
      { at: S[22]+0.2, center: [95.2, 29.1], zoom: 7.2, dur: 1.6 },
      { at: S[23]+0.2, center: [95.0, 28.8], zoom: 6.8, dur: 1.8 },
      { at: S[24]+0.2, center: [95.1, 28.4], zoom: 6.4, dur: 1.8 },
      { at: S[25]+0.2, center: [93, 28.6], zoom: 4.4, dur: 2.2 },
      { at: S[26]+0.2, center: [95, 29.2], zoom: 6.0, dur: 2.0 },
      { at: S[27]+0.2, center: [104, 30], zoom: 4.0, dur: 2.6 },
      { at: S[28]+0.2, center: [85, 28], zoom: 3.8, dur: 2.4 },
      { at: S[29]+0.2, center: [90, 27], zoom: 3.8, dur: 2.4 },
      { at: S[30]+0.2, center: [95, 27], zoom: 3.7, dur: 2.2 },
      { at: S[31]+0.2, center: [95, 27], zoom: 3.7, dur: 1.8 },
    ]);

    T.forEach((p, i) => F.section(p[0], 1 + (i % 3), { name: 'para' + (i + 1) }));
    TL.lines.filter((l) => !l.silence).forEach((l) => F.info('map', l.start, Math.min(l.end + 0.2, F.duration), { group: l.id }));
    F.coverAt(S[27] + 3.0);
  },
});
