// shouhui · 012_商纣王 · 全片（205.7s）：样片机制 + 全段落编排
// 风格：mg-styles-15 / 05-cel-boil。1920×1080 / 24fps / 19.75s / 474 帧
//
// 分镜（按叙事节拍，不等分）：
//   A 0.00–3.60 (3.60) 设问：墨滴落纸 → 写「妲己」→ 朱砂横线
//   T1 3.60–3.86       斜墨刷承接
//   B 3.86–7.80 (3.94) 「一个字都没写」：空白卷册展开，笔尖悬停不落墨
//   T2 7.80–8.30       竹简自上方落下（落下的就是 C 镜的竹简）
//   C 8.30–12.40 (4.10)「先秦的记载里，总共就两处」：竹简 + 两处朱圈
//   T3 12.40–12.90     墨泛（自下而上淹没）
//   D 12.90–16.40 (3.50)「没长相」：妲己背影登场（举袖·掩面），殿柱 + 缓推
//   E 16.40–19.75 (3.35) 抬袖 → 墨没全屏 → 只剩笄上一点朱

import { PAL, hs, clamp, lerp, inv, E, K, resample, prefix, circlePts, boil, polyPath, fillPoly, inkStroke, inkLoop, fillShape } from './engine.js';

export const W = 1920, H = 1080, FPS = 24;
let ctx, DPR = 1;
const IMG = {};
let FONT = null, FONT_B = null;
const GLY = {}, GLY2 = {};
const QS = new URLSearchParams(location.search);
export const V5 = QS.get('v5') === '1';
const bv = (D) => (D % 4);

const BIG = 340, TAG_SCALE = 0.25;

// 竹简正文：《尚书·牧誓》原文（去标点 28 字，右起竖排）
// 「王曰：古人有言曰：牝鸡无晨。牝鸡之晨，惟家之索。今商王受，惟妇言是用。」
const SLIP_LINES = ['王曰古人有', '言曰牝鸡无', '晨牝鸡之晨', '惟家之索', '今商王受', '惟妇言', '是用'];
const SLIPGLY = {}, SLIPPOS = [], SLIPTEX = [];

// 分镜表
const S = { A1: 1.93, T1a: 1.93, T1b: 2.49, B1: 3.92, T2a: 3.92, T2b: 4.48, C1: 7.32, T3a: 7.32, T3b: 7.88, D1: 10.04, E1: 15.34 };
// 逐句字幕 cue（全片 166 条；来自 配音.json 11 段 chunk 锚框 + 逐 chunk 语音段对齐，
//          lishi align_captions 同构：段数==从句数 1:1，否则按字数份额分配；>14 字在虚词后拆条）
const SUBS = [
  { t0: 0.155, e: 1.089, tx: "先问你个问题" },
  { t0: 1.089, e: 2.228, tx: "妲己到底长什么样" },
  { t0: 2.228, e: 3.403, tx: "三千年前的人" },
  { t0: 3.403, e: 4.22, tx: "一个字都没写" },
  { t0: 4.22, e: 5.338, tx: "不是没来得及写" },
  { t0: 5.338, e: 6.444, tx: "先秦的记载里" },
  { t0: 6.444, e: 7.619, tx: "提到她总共就两处" },
  { t0: 7.619, e: 8.221, tx: "没长相" },
  { t0: 8.221, e: 8.977, tx: "没出身" },
  { t0: 8.977, e: 10.337, tx: "连她怎么死的都没写" },
  { t0: 10.337, e: 11.974, tx: "你脑子里那个酒池肉林" },
  { t0: 11.974, e: 12.628, tx: "炮烙之刑" },
  { t0: 12.628, e: 14.132, tx: "狐狸精妲己的故事" },
  { t0: 14.132, e: 15.635, tx: "其实是一个攒出来的故事" },
  { t0: 15.635, e: 16.955, tx: "先说个更颠覆的" },
  { t0: 16.955, e: 18.032, tx: "纣王的纣字" },
  { t0: 18.032, e: 19.304, tx: "压根不是他的名字" },
  { t0: 19.304, e: 20.058, tx: "他姓子" },
  { t0: 20.058, e: 22.38, tx: "名受商朝人叫他帝辛纣" },
  { t0: 22.38, e: 24.377, tx: "是周朝人打赢以后给他定的谥号" },
  { t0: 24.377, e: 25.15, tx: "意思是残义损善" },
  { t0: 25.15, e: 25.913, tx: "残害道义" },
  { t0: 25.913, e: 26.872, tx: "损害善良" },
  { t0: 26.872, e: 27.62, tx: "也就是说" },
  { t0: 27.62, e: 28.871, tx: "我们骂了三千年的这个纣王" },
  { t0: 28.871, e: 31.919, tx: "连名字都是他的敌人起的" },
  { t0: 31.919, e: 32.71, tx: "赢了的人" },
  { t0: 32.71, e: 33.996, tx: "给输了的人起名字" },
  { t0: 33.996, e: 34.761, tx: "这事你品品" },
  { t0: 34.761, e: 35.53, tx: "第一件事" },
  { t0: 35.53, e: 36.501, tx: "真实的帝辛" },
  { t0: 36.501, e: 37.31, tx: "强得离谱" },
  { t0: 37.31, e: 38.869, tx: "史记里怎么写帝辛的" },
  { t0: 38.869, e: 40.054, tx: "前半句八个字" },
  { t0: 40.054, e: 41.086, tx: "资辨捷疾" },
  { t0: 41.086, e: 42.001, tx: "闻见甚敏" },
  { t0: 42.001, e: 42.678, tx: "反应快口才好" },
  { t0: 42.678, e: 45.292, tx: "脑子比身边所有大臣都好使" },
  { t0: 45.292, e: 46.883, tx: "谁跟他辩论都辩不过" },
  { t0: 46.883, e: 47.842, tx: "后半句更狠" },
  { t0: 47.842, e: 48.748, tx: "材力过人" },
  { t0: 48.748, e: 49.713, tx: "手格猛兽赤手空拳" },
  { t0: 49.713, e: 50.468, tx: "能跟野兽肉搏" },
  { t0: 50.468, e: 51.612, tx: "这不是昏君的长相" },
  { t0: 51.612, e: 54.044, tx: "这是雄主的长相" },
  { t0: 54.044, e: 55.782, tx: "他这辈子干的最大的一件事" },
  { t0: 55.782, e: 56.482, tx: "是打东夷" },
  { t0: 56.482, e: 57.385, tx: "东夷在哪" },
  { t0: 57.385, e: 57.852, tx: "今天山东" },
  { t0: 57.852, e: 59.758, tx: "江苏安徽那一带" },
  { t0: 59.758, e: 61.044, tx: "帝辛带着商朝军队" },
  { t0: 61.044, e: 62.964, tx: "跟东夷打了很多年的拉锯战" },
  { t0: 62.964, e: 63.861, tx: "把淮河流域" },
  { t0: 63.861, e: 65.267, tx: "长江下游的大片土地" },
  { t0: 65.267, e: 67.067, tx: "第一次纳入了中原王朝的版图" },
  { t0: 67.067, e: 68.26, tx: "郭沫若评价他" },
  { t0: 68.26, e: 69.537, tx: "统一神州肇此人" },
  { t0: 69.537, e: 71.573, tx: "中原文化能往东南传播" },
  { t0: 71.573, e: 72.644, tx: "商纣王是起点" },
  { t0: 72.644, e: 73.509, tx: "这么一个人" },
  { t0: 73.509, e: 75.058, tx: "怎么就被骂成了中国历史上" },
  { t0: 75.058, e: 75.725, tx: "第一昏君" },
  { t0: 75.725, e: 76.445, tx: "第二件事" },
  { t0: 76.445, e: 77.764, tx: "罪状是怎么攒出来的" },
  { t0: 77.764, e: 79.16, tx: "孔子有个学生叫子贡" },
  { t0: 79.16, e: 80.259, tx: "这人特别精明" },
  { t0: 80.259, e: 81.417, tx: "经商特别厉害" },
  { t0: 81.417, e: 83.251, tx: "他在论语里说了一句特别清醒的" },
  { t0: 83.251, e: 83.514, tx: "话" },
  { t0: 83.514, e: 84.342, tx: "纣之不善" },
  { t0: 84.342, e: 85.214, tx: "不如是之甚也" },
  { t0: 85.214, e: 86.709, tx: "是以君子恶居下流" },
  { t0: 86.709, e: 88.244, tx: "天下之恶皆归焉" },
  { t0: 88.244, e: 89.221, tx: "翻译过来就是" },
  { t0: 89.221, e: 90.224, tx: "纣干的坏事" },
  { t0: 90.224, e: 91.406, tx: "没有传说中那么狠" },
  { t0: 91.406, e: 92.994, tx: "一个人一旦成了失败者" },
  { t0: 92.994, e: 95.329, tx: "全天下的脏水都会往他头上泼" },
  { t0: 95.329, e: 96.545, tx: "两千五百年前" },
  { t0: 96.545, e: 97.971, tx: "子贡就把这事看穿了" },
  { t0: 97.971, e: 99.286, tx: "你再顺着时间线看" },
  { t0: 99.286, e: 100.023, tx: "更有意思" },
  { t0: 100.023, e: 100.967, tx: "春秋的书里" },
  { t0: 100.967, e: 102.266, tx: "纣的罪状就几条" },
  { t0: 102.266, e: 102.917, tx: "酗酒听老婆的话" },
  { t0: 102.917, e: 104.679, tx: "不重用贵族" },
  { t0: 104.679, e: 105.16, tx: "到战国" },
  { t0: 105.16, e: 106.433, tx: "加上了炮烙之刑" },
  { t0: 106.433, e: 107.273, tx: "比干剖心" },
  { t0: 107.273, e: 108.76, tx: "到汉代司马迁笔下" },
  { t0: 108.76, e: 109.378, tx: "出现了酒池肉林" },
  { t0: 109.378, e: 110.142, tx: "到明代封神演义" },
  { t0: 110.142, e: 112.586, tx: "妲己成了狐狸精" },
  { t0: 112.586, e: 113.478, tx: "敲骨验髓" },
  { t0: 113.478, e: 114.373, tx: "鹿台自焚全套配齐" },
  { t0: 114.373, e: 115.227, tx: "朝代越晚" },
  { t0: 115.227, e: 116.173, tx: "罪状越多" },
  { t0: 116.173, e: 116.894, tx: "越具体" },
  { t0: 116.894, e: 117.773, tx: "越离谱" },
  { t0: 117.773, e: 120.107, tx: "这像不像今天的网络暴力" },
  { t0: 120.107, e: 121.834, tx: "一个人被贴上坏人的标签" },
  { t0: 121.834, e: 123.077, tx: "往后每一条黑料" },
  { t0: 123.077, e: 123.836, tx: "不管真假" },
  { t0: 123.836, e: 125.108, tx: "都自动挂在他名下" },
  { t0: 125.108, e: 126.374, tx: "三千年前的帝辛" },
  { t0: 126.374, e: 127.339, tx: "就是被这么挂的" },
  { t0: 127.339, e: 128.149, tx: "第三件事" },
  { t0: 128.149, e: 129.642, tx: "他输不是因为妲己" },
  { t0: 129.642, e: 130.672, tx: "很多人以为" },
  { t0: 130.672, e: 131.369, tx: "商朝亡于妲己祸国" },
  { t0: 131.369, e: 133.574, tx: "那你翻开先秦的史书" },
  { t0: 133.574, e: 134.58, tx: "妲己一共就出现两次" },
  { t0: 134.58, e: 135.304, tx: "一次在国语" },
  { t0: 135.304, e: 136.185, tx: "有苏氏部落战败" },
  { t0: 136.185, e: 137.502, tx: "把女儿妲己献给帝辛" },
  { t0: 137.502, e: 139.733, tx: "就一句话" },
  { t0: 139.733, e: 140.753, tx: "一次在尚书周武王列罪状" },
  { t0: 140.753, e: 141.904, tx: "骂他惟妇言是用" },
  { t0: 141.904, e: 143.142, tx: "就四个字" },
  { t0: 143.142, e: 143.917, tx: "完了" },
  { t0: 143.917, e: 144.769, tx: "一个王朝灭亡的大锅" },
  { t0: 144.769, e: 145.951, tx: "最早就建立在这四个字上" },
  { t0: 145.951, e: 147.632, tx: "商朝灭亡的真正原因" },
  { t0: 147.632, e: 149.344, tx: "是个军事问题" },
  { t0: 149.344, e: 150.45, tx: "帝辛的主力部队" },
  { t0: 150.45, e: 151.656, tx: "全压在东边打东夷" },
  { t0: 151.656, e: 153.072, tx: "一打就是很多年" },
  { t0: 153.072, e: 154.278, tx: "国力耗得非常厉害" },
  { t0: 154.278, e: 155.348, tx: "周武王在西方看准时机" },
  { t0: 155.348, e: 158.122, tx: "联合一群部落" },
  { t0: 158.122, e: 159.176, tx: "直接偷家牧野之战" },
  { t0: 159.176, e: 159.853, tx: "商军主力还在东边没回来" },
  { t0: 159.853, e: 160.764, tx: "帝辛只能把战俘和" },
  { t0: 160.764, e: 164.199, tx: "奴隶武装起来凑数" },
  { t0: 164.199, e: 165.521, tx: "结果这些人阵前倒戈" },
  { t0: 165.521, e: 166.416, tx: "一天就一天" },
  { t0: 166.416, e: 167.078, tx: "商朝亡了" },
  { t0: 167.078, e: 167.98, tx: "帝辛跑上鹿台" },
  { t0: 167.98, e: 168.65, tx: "穿上他的玉衣" },
  { t0: 168.65, e: 170.951, tx: "自焚了打了一辈子硬仗的雄主" },
  { t0: 170.951, e: 172.425, tx: "最后输在两线作战" },
  { t0: 172.425, e: 173.834, tx: "这才是历史账本上的真实记录" },
  { t0: 173.834, e: 175.789, tx: "妲己" },
  { t0: 175.789, e: 177.342, tx: "她连背锅的资格都是后人给的" },
  { t0: 177.342, e: 178.675, tx: "跟你有什么关系" },
  { t0: 178.675, e: 179.765, tx: "你看" },
  { t0: 179.765, e: 181.877, tx: "同一个人赢家的书里" },
  { t0: 181.877, e: 182.992, tx: "他叫帝辛输家的书里" },
  { t0: 182.992, e: 183.986, tx: "他叫纣王" },
  { t0: 183.986, e: 184.781, tx: "你今天听到的每一段历史" },
  { t0: 184.781, e: 186.534, tx: "每一条消息" },
  { t0: 186.534, e: 188.797, tx: "背后都有一个执笔的人" },
  { t0: 188.797, e: 189.482, tx: "这个人是赢是输" },
  { t0: 189.482, e: 190.18, tx: "站在哪边决定了" },
  { t0: 190.18, e: 191.575, tx: "你能看到什么所以下次再有人跟" },
  { t0: 191.575, e: 195.192, tx: "你讲一个十恶不赦的坏人" },
  { t0: 195.192, e: 196.236, tx: "你可以多问一句" },
  { t0: 196.236, e: 197.002, tx: "这故事" },
  { t0: 197.002, e: 198.099, tx: "是谁写的" },
  { t0: 198.099, e: 198.624, tx: "要是他输了" },
  { t0: 198.624, e: 199.15, tx: "那这些坏事" },
  { t0: 199.15, e: 200.128, tx: "可能一件都没少攒" },
  { t0: 200.128, e: 202.651, tx: "也可能一件都没干过" },
  { t0: 202.651, e: 203.697, tx: "行不扯远了" },
  { t0: 203.697, e: 204.311, tx: "我是艾伦遛狗去了" },
  { t0: 204.311, e: 205.521, tx: "白了个白" },
];
// ---- 字幕：lishi 管线样式与参数（pipeline.json caption 节）----
// 楷体 60px / 字距 0.14em / 墨色 88% / 距底 112px / 单行 ≤14 字 / 无标点从句
// 底部 400px 纸色渐变衬底全片常驻（lishi CaptionVeil：画进字幕内部会闪）
const CAP = {
  size: 60, offset: 112, max: 14, track: 0.14, veilH: 400,
  ink: 'rgba(36,33,28,0.88)',           // lishi paper 主题 text 槽 #24211c @ 0.88
  paper: 'rgba(239,230,210,',           // lishi paper 主题 page 槽 #efe6d2
  breakAfter: '的了是在和与就都也里上中后前时着过', // 拆长句优先断在这些字之后
};
let SUBFONT = false;
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
function drawSubtitle(c, t) {
  if (!SUBFONT) return;
  // 衬底常驻（与字幕开关无关，否则字幕空隙处底部亮度跳变）
  const vg = c.createLinearGradient(0, H, 0, H - CAP.veilH);
  vg.addColorStop(0, CAP.paper + '0.74)');
  vg.addColorStop(0.46, CAP.paper + '0.34)');
  vg.addColorStop(1, CAP.paper + '0)');
  c.fillStyle = vg; c.fillRect(0, H - CAP.veilH, W, CAP.veilH);
  for (const s of SUBS) {
    if (t < s.t0 || t > s.e) continue;
    // 0.17s 内出齐（lishi 5 帧@30fps ≈ 4 帧@24fps）+ 10px 上浮
    const p = easeOutCubic(Math.min(1, (t - s.t0) * FPS / 4));
    c.save();
    c.globalAlpha = p;
    c.font = `${CAP.size}px "KaiTi"`;
    try { c.letterSpacing = `${CAP.size * CAP.track}px`; } catch (e) {}
    c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillStyle = CAP.ink;
    // letterSpacing 会让 fillText 整体左偏半个字距，右补偿回来
    c.fillText(s.tx, W / 2 + CAP.size * CAP.track / 2, H - CAP.offset + (1 - p) * 10);
    c.restore();
  }
}
const B0 = S.T1b, C0 = S.T2b, D0 = S.T3b;

// ---------------------------------------------------------------- 字形
function glyphPolys(font, ch, size) {
  const g = font.charToGlyph(ch);
  const path = g.getPath(0, 0, size);
  const polys = []; let cur = [], lx = 0, ly = 0;
  for (const cmd of path.commands) {
    if (cmd.type === 'M') { if (cur.length > 2) polys.push(cur); cur = [[cmd.x, cmd.y]]; lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'L') { cur.push([cmd.x, cmd.y]); lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'Q') { for (let k = 1; k <= 6; k++) { const u = k / 6, a = (1 - u) ** 2, b = 2 * u * (1 - u), cc = u * u; cur.push([a * lx + b * cmd.x1 + cc * cmd.x, a * ly + b * cmd.y1 + cc * cmd.y]); } lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'C') { for (let k = 1; k <= 8; k++) { const u = k / 8, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, cc = 3 * u * u * (1 - u), d = u ** 3; cur.push([a * lx + b * cmd.x1 + cc * cmd.x2 + d * cmd.x, a * ly + b * cmd.y1 + cc * cmd.y2 + d * cmd.y]); } lx = cmd.x; ly = cmd.y; }
    else if (cmd.type === 'Z') { if (cur.length > 2) polys.push(cur); cur = []; }
  }
  if (cur.length > 2) polys.push(cur);
  const area = (P) => { let A = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A += p[0] * q[1] - q[0] * p[1]; } return Math.abs(A / 2); };
  polys.sort((a, b) => area(b) - area(a));
  return { polys, width: g.advanceWidth * (size / font.unitsPerEm) };
}
function bboxOf(polys) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const P of polys) for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

// 每片简预渲染成一张透明贴图（真字，竖排），避免每帧重算 28 个字的轮廓
function buildSlipTex() {
  const SZ = 100, CHAR_H = 74, Y0 = 138;
  for (let i = 0; i < SLIPS; i++) {
    const line = SLIP_LINES[SLIPS - 1 - i];   // 右起读
    const n = line.length;
    const sp = n > 1 ? Math.min(118, 430 / (n - 1)) : 0;
    SLIPPOS[i] = [];
    const dpr = 2;
    const cv = document.createElement('canvas');
    cv.width = SV_W * dpr; cv.height = SV_H * dpr;
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);
    for (let k = 0; k < n; k++) {
      const ch = line[k];
      const G = SLIPGLY[ch];
      const cy = Y0 + k * sp;
      SLIPPOS[i].push({ k, cy });
      if (!G) continue;
      const bb = G.bb;
      const sc = CHAR_H / bb.h;
      g.save();
      g.translate(SV_W / 2, cy);
      g.scale(sc, sc);
      g.translate(-(bb.x0 + bb.w / 2), -(bb.y0 + bb.h / 2));
      // 墨渗：先一层淡、再一层实，边缘带 boil
      for (const pass of [{ a: 0.20, d: 3.0, w: 2 }, { a: 0.94, d: 0 }]) {
        g.save(); g.globalAlpha = pass.a;
        g.beginPath();
        for (const P of G.polys) {
          const dense = resample(P, 3.0, true);
          polyPath(g, pass.d ? boil(dense.map(([x, y]) => [x + pass.d, y + pass.d * 0.5]), 900 + k * 7, pass.w, 40) : boil(dense, 700 + k * 7 + i, 1.1, 46));
        }
        g.fillStyle = '#1b120c'; g.fill('nonzero'); g.restore();
      }
      g.restore();
    }
    SLIPTEX[i] = cv;
  }
}
const SV_W = 104, SV_H = 700;   // 与 SLIP_W / SLIP_H 同值

function glyphBox(ch) {
  const G = GLY[ch];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const P of G.polys) for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
function writeGlyph(c, ch, ox, oy, frac, seed, o = {}) {
  const G = GLY[ch];
  if (!G || frac <= 0) return null;
  const sv = bv(Math.floor(seed)), color = o.color ?? PAL.ink, w = o.w ?? 5;
  let tip = null;
  const per = G.polys.length;
  G.polys.forEach((P, i) => {
    const local = clamp(frac * 1.45 - (i / per) * 0.28, 0, 1);
    if (local <= 0.002) return;
    const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.0, true);
    const seg = local < 0.995 ? prefix([...dense, dense[0]], local) : [...dense, dense[0]];
    if (seg.length > 2) {
      const pts = inkStroke(c, seg, { seed: seed + i * 17 + sv, amp: 1.5, scale: 60, color, w, t0: 4, t1: 4, jit: 0.22, heavy: 0.15 });
      if (i === 0 && pts && pts.length) tip = pts[pts.length - 1];
    }
  });
  if (frac > 0.52) {
    const a = clamp((frac - 0.52) / 0.34, 0, 1) * 0.90;
    c.save(); c.globalAlpha = a; c.beginPath();
    for (const P of G.polys) {
      const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.2, true);
      polyPath(c, boil(dense, seed + 900 + sv, 1.5, 55));
    }
    c.fillStyle = color; c.fill('nonzero'); c.restore();
  }
  return tip;
}
function fillGlyph(c, ch, ox, oy, color, seed, alpha = 1, amp = 1.4, G = null) {
  G = G || GLY[ch];
  if (!G) return;
  const sv = bv(Math.floor(seed));
  c.save(); c.globalAlpha = alpha; c.beginPath();
  for (const P of G.polys) {
    const dense = resample(P.map(([x, y]) => [x + ox, y + oy]), 3.2, true);
    polyPath(c, boil(dense, seed + sv, amp, 55));
  }
  c.fillStyle = color; c.fill('nonzero'); c.restore();
}

// ---------------------------------------------------------------- 纸 / 机位
function drawPaper(c) { const s = 1.05; c.drawImage(IMG.paper, (W - W * s) / 2, (H - H * s) / 2, W * s, H * s); }
function drawTooth(c, D) {
  const v = bv(D);
  const ox = Math.floor(hs(v, 51) * 470), oy = Math.floor(hs(v, 52) * 310);
  c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.5;
  c.drawImage(IMG.tooth, ox, oy, W, H, 0, 0, W, H);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.20;
  const dm = IMG.dust[v % 2];
  c.save(); c.translate(W / 2, H / 2); c.scale(v % 2 ? -1 : 1, 1); c.drawImage(dm, -W / 2, -H / 2, W, H); c.restore();
  c.restore();
}
const CAM = {
  A: { k0: 0.95, k1: 0.98, cx: 960, cy: 600 },
  B: { k0: 1.06, k1: 1.03, cx: 960, cy: 560 },
  C: { k0: 1.34, k1: 1.28, cx: 960, cy: 560 },
  D: { k0: 0.98, k1: 1.06, cx: 900, cy: 560 },
  E: { k0: 1.04, k1: 1.12, cx: 960, cy: 540 },
};
function camFor(shot, lt, dur) {
  const m = CAM[shot];
  const k = lerp(m.k0, m.k1, E.io2(clamp(lt / dur, 0, 1)));
  return { k, cx: m.cx, cy: m.cy, jx: Math.sin(lt * 2.13) * 1.4, jy: Math.cos(lt * 1.71) * 1.2 };
}
function camApply(c, cam) {
  c.translate(W / 2 + cam.jx, H / 2 + cam.jy);
  c.scale(cam.k, cam.k);
  c.translate(-cam.cx, -cam.cy);
}

// ---------------------------------------------------------------- 小件
function dot(c, x, y, r, color, seed, amp = 1.6) {
  fillPoly(c, boil(circlePts(x, y, r, 0, r * (0.8 + 0.4 * hs(seed, 1))), seed, amp, 26), color);
}
function spark(c, x, y, r, color, seed) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + hs(seed, i) * 0.3, rr = i % 2 ? r * 0.3 : r * (1 + 0.22 * hs(seed, i, 3));
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  fillPoly(c, boil(pts, seed, 0.9, 20), color);
}

// ---------------------------------------------------------------- 分镜 A：墨滴 → 写「妲己」→ 朱砂线
const PAIR = { da: [0, 0], ji: [0, 0] };
const A = { drop: 0.55, wA: 0.72, wAe: 1.85, wB: 1.85, wBe: 2.60, q1: 2.62, q2: 2.90, line: [3.10, 3.44], pid: 0.95 };
function rrectPts(x, y, w, h, r) {
  const pts = [];
  const seg = (cx, cy, a0, a1) => { for (let i = 0; i <= 6; i++) { const a = a0 + (a1 - a0) * i / 6; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  seg(x + w - r, y + r, -Math.PI / 2, 0); seg(x + w - r, y + h - r, 0, Math.PI / 2);
  seg(x + r, y + h - r, Math.PI / 2, Math.PI); seg(x + r, y + r, Math.PI, Math.PI * 1.5);
  return pts;
}
// 视频角色层·闪现版：t0 时刻从右侧快速滑入 + 白闪 + 墨色速度线 + 残影（可复用）
function drawVideoCharFlash(c, frames, t, x, groundY, o = {}) {
  const t0 = o.t0 ?? 0.42, slideD = o.slideD ?? 0.16;
  const emerge = clamp((t - t0) / 0.05, 0, 1);
  if (emerge <= 0) return;
  const slide = E.out3(clamp((t - t0) / slideD, 0, 1));
  const px = lerp(o.fromX ?? 1980, x, slide);
  const sv = Math.floor(t * 24) % 4;
  // 残影（滑入期间，身后两道渐隐）
  if (t < t0 + slideD + 0.14) {
    const gu = clamp((t - t0) / (slideD + 0.14), 0, 1);
    drawVideoChar(c, frames, o.tf ?? t, px + 120 + 150 * (1 - gu), groundY, { s: o.s, alpha: 0.12 * (1 - gu) });
    drawVideoChar(c, frames, o.tf ?? t, px + 240 + 260 * (1 - gu), groundY, { s: o.s, alpha: 0.07 * (1 - gu) });
  }
  drawVideoChar(c, frames, o.tf ?? t, px, groundY, { s: o.s, alpha: o.alpha ?? 1 });
  // 白闪一瞬
  const fl = 1 - clamp((t - t0) / 0.10, 0, 1);
  if (fl > 0.01) { c.save(); c.globalAlpha = 0.30 * fl; c.fillStyle = PAL.cream; c.fillRect(-20, -20, 1960, 1120); c.restore(); }
  // 速度线（墨色，向右拖尾渐隐）
  const st = clamp((t - t0) / 0.30, 0, 1);
  if (st < 1) {
    c.save(); c.globalAlpha = 0.55 * (1 - st);
    for (let i = 0; i < 6; i++) {
      const yy = 250 + i * 128 + (hs(60, i) - 0.5) * 50;
      const x0 = px + 320 + hs(61, i) * 60, x1 = 1900 - hs(62, i) * 220 * st;
      if (x1 > x0) inkStroke(c, [[x0, yy], [x1, yy + (hs(63, i) - 0.5) * 16]], { seed: 4400 + i + sv, color: PAL.ink, w: 3 + 5 * hs(64, i), t0: 6, t1: 14, amp: 2.2 });
    }
    c.restore();
  }
}
function shotA(c, t) {
  const sv = bv(Math.round(t * FPS));
  // 主：妲己大立绘——从右侧闪现（白闪+速度线+残影）
  drawVideoCharFlash(c, IMG.dajiA, t, 1180, 1012, { s: 1.06, t0: 0.42, tf: t * 0.92 + 0.42 });

  // 贴纸：名条「妲己」（左上，纸底贴纸 + 墨滴落 + 双字书写 + 朱砂线）
  const bob = Math.sin(t * 1.8) * 5;
  const pop = E.outBack(clamp((t - 0.25) / 0.5, 0, 1), 1.8);
  c.save(); c.translate(415, 470 + bob); c.rotate(-0.05); c.scale(pop * 0.5, pop * 0.5);
  c.save(); c.globalAlpha = 0.13; fillPoly(c, boil(rrectPts(-560, -370, 1120, 770, 46), 90 + sv, 2.2, 70), PAL.ink); c.restore();
  c.save(); c.globalAlpha = 0.97; fillPoly(c, boil(rrectPts(-580, -395, 1160, 810, 50), 93 + sv, 1.6, 70), '#f4ecd9'); c.restore();
  inkStroke(c, rrectPts(-580, -395, 1160, 810, 50), { seed: 96 + sv, color: PAL.ink, w: 5, t0: 12, t1: 20, amp: 1.6 });
  if (t < A.drop + 0.05) {
    const u = clamp(t / A.drop, 0, 1), y = lerp(-720, -60, E.in2(u)), r = 15 + 7 * u;
    c.save(); c.globalAlpha = 0.95;
    if (u < 0.985) {
      const tail = 60 + 260 * u, tipY = y - tail, L = [], R = [];
      for (let i = 0; i <= 10; i++) { const v = i / 10, half = r * Math.pow(v, 0.55); L.push([-80 - half, tipY + (y - tipY) * v]); R.push([-80 + half, tipY + (y - tipY) * v]); }
      fillPoly(c, boil([...L, ...R.reverse()], 120 + sv, 1.8, 40), PAL.ink);
    }
    dot(c, -80, y, r, PAL.ink, 60 + sv, 1.8);
    c.restore();
  }
  if (t >= A.drop - 0.02) {
    const u = clamp((t - A.drop) / 0.8, 0, 1);
    fillPoly(c, boil(circlePts(-80, -60, 44 + 16 * E.out3(clamp(u * 1.6, 0, 1)), 0, 50), 200 + sv, 3.4, 46), PAL.ink);
    for (let i = 0; i < 8; i++) {
      const a = hs(9, i) * Math.PI * 2, d = 60 + 120 * E.out3(u) * (0.6 + 0.7 * hs(9, i, 1));
      const rr = (5 + 7 * hs(9, i, 2)) * (1 - 0.55 * u);
      if (rr > 1) dot(c, -80 + Math.cos(a) * d, -60 + Math.sin(a) * d * 0.7, rr, PAL.ink, 300 + i + sv, 1.2);
    }
  }
  const fa = clamp((t - A.wA) / (A.wAe - A.wA), 0, 1);
  const fb = clamp((t - A.wB) / (A.wBe - A.wB), 0, 1);
  c.save(); c.translate(0, 130); c.scale(0.9, 0.9);
  const ta = writeGlyph(c, '妲', PAIR.da[0], 0, fa, 1000, { w: 5 });
  const tb = writeGlyph(c, '己', PAIR.ji[0], 0, fb, 1500, { w: 5 });
  c.restore();
  const und = clamp((t - A.line[0]) / (A.line[1] - A.line[0]), 0, 1);
  if (und > 0) {
    c.save(); c.globalAlpha = 0.92;
    inkStroke(c, [[-320, 305], [lerp(-320, 320, E.out3(und)), 299]], { seed: 800 + sv, color: PAL.red, w: 9, t0: 18, t1: 26, amp: 2.6 });
    c.restore();
  }
  c.restore();
  // 贴纸：问号 ×2（pop 弹出）
  const q1 = clamp((t - A.q1) / 0.34, 0, 1), q2 = clamp((t - A.q2) / 0.34, 0, 1);
  if (q1 > 0) {
    const s = E.outBack(q1, 2.4);
    c.save(); c.translate(680, 185); c.rotate(-0.14); c.scale(s * 0.78, s * 0.78);
    writeGlyph(c, '？', -75, 75, clamp(q1 * 1.9, 0, 1), 3000 + sv, { color: PAL.red, w: 8 });
    c.restore();
  }
  if (q2 > 0) {
    const s = E.outBack(q2, 2.6);
    c.save(); c.translate(128, 700); c.rotate(0.2); c.scale(s * 0.55, s * 0.55);
    writeGlyph(c, '？', -75, 75, clamp(q2 * 1.9, 0, 1), 3200 + sv, { color: PAL.yel, w: 9 });
    c.restore();
  }
}

// ---------------------------------------------------------------- 分镜 B：空白卷册，笔尖悬停不落墨
function drawScroll(c, open, seed) {
  c.save(); c.translate(960, 0);
  const halfW = lerp(60, 520, open), cy = 540, hh = 250;
  // 卷面
  c.save();
  fillShape(c, boil([[-halfW, cy - hh], [halfW, cy - hh], [halfW, cy + hh], [-halfW, cy + hh]], seed, 2.0, 80), '#f1e3c6', { seed: seed + 1, amp: 1.6 });
  // 纸纤维：横向短笔
  c.save(); c.globalAlpha = 0.16;
  for (let i = 0; i < 26; i++) {
    const y = cy - hh + 20 + hs(seed, i) * (hh * 2 - 40);
    const x0 = -halfW + 24 + hs(seed, i, 1) * (halfW * 2 - 48);
    inkStroke(c, [[x0, y], [x0 + 40 + 90 * hs(seed, i, 2), y + (hs(seed, i, 3) - 0.5) * 4]], { seed: seed + i, color: '#8a7358', w: 1.2, amp: 0.6, t0: 4, t1: 10 });
  }
  c.restore();
  // 界格（三道极淡横线）
  c.save(); c.globalAlpha = 0.18;
  for (let i = 1; i <= 3; i++) {
    const y = cy - hh + (i * hh * 2) / 4;
    inkStroke(c, [[-halfW + 16, y], [halfW - 16, y]], { seed: seed + 60 + i, color: '#8a7358', w: 1.6, amp: 1.0, t0: 20, t1: 30 });
  }
  c.restore();
  // 卷边（上下两道折）
  c.save(); c.globalAlpha = 0.5;
  inkStroke(c, [[-halfW, cy - hh + 6], [halfW, cy - hh + 10]], { seed: seed + 31, color: '#b9a483', w: 2.0, amp: 1.2, t0: 20, t1: 30 });
  inkStroke(c, [[-halfW, cy + hh - 8], [halfW, cy + hh - 4]], { seed: seed + 32, color: '#b9a483', w: 2.0, amp: 1.2, t0: 20, t1: 30 });
  c.restore();
  // 两端卷轴
  for (const sx of [-1, 1]) {
    const x = sx * (halfW + 22);
    c.save();
    fillShape(c, boil([[-14, -hh - 6], [14, -hh - 6], [14, hh + 6], [-14, hh + 6]].map(([px, py]) => [px + x, py + cy]), seed + (sx > 0 ? 41 : 42), 2.2, 60), PAL.ink, { seed: seed + 43, amp: 1.8 });
    c.restore();
    dot(c, x, cy - hh - 12, 9, PAL.ink, seed + (sx > 0 ? 44 : 45), 1.4);
    dot(c, x, cy + hh + 12, 9, PAL.ink, seed + (sx > 0 ? 46 : 47), 1.4);
  }
  c.restore();
  c.restore();
  return { halfW, cy, hh };
}
function shotB(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  const open = clamp(lt / 1.15, 0, 1);
  // 贴纸：空白卷册（左下，微倾+浮沉）
  const bob1 = Math.sin(lt * 1.7) * 5;
  c.save(); c.translate(-165, 285 + bob1); c.rotate(-0.045); c.scale(0.58, 0.58);
  const S0 = drawScroll(c, E.out3(open), 300);
  c.restore();
  // 主：妲己静立扇扇（vid0），画面主体
  drawVideoChar(c, IMG.daji0, lt * 0.95 + 0.25, 985, 1008, { s: 1.0, alpha: 0.97 });
  // 笔：大笔饱墨，从上方垂入，笔尖悬在纸上方不落墨（右上贴纸位）
  const hover = K(lt, [[1.50, 0], [2.32, 1]]);
  if (hover > 0) {
    const bx = 1560, by = lerp(-320, 470, E.out3(hover));
    const sway = Math.sin(lt * 2.4) * 7 * hover + Math.sin(lt * 0.9) * 3;
    c.save(); c.translate(bx + sway, by); c.rotate(Math.sin(lt * 1.7) * 0.012 * hover);
    // ---- 笔杆（竹）
    fillShape(c, [[-12, -470], [12, -470], [9, -132], [-9, -132]], PAL.ink, { seed: 500 + sv, amp: 1.1 });
    c.save(); c.globalAlpha = 0.55; c.fillStyle = PAL.cream;
    c.fillRect(-6, -462, 3.4, 322);
    c.restore();
    c.save(); c.globalAlpha = 0.95; c.fillStyle = PAL.ink;
    c.fillRect(-12, -352, 24, 6); c.fillRect(-12, -246, 24, 6);
    c.restore();
    // ---- 笔头：枣核形，顶接杆、腰最鼓、锋收成尖
    const HW = 24, LEN = 136, N = 12, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, y = -LEN + u * LEN;
      const w = u < 0.40
        ? 9 + (HW - 9) * Math.sin((u / 0.40) * Math.PI / 2)
        : HW * Math.pow(1 - (u - 0.40) / 0.60, 0.82);
      L.push([-w, y]); R.push([w, y]);
    }
    fillShape(c, [...L, ...R.reverse()], PAL.ink, { seed: 508 + sv, amp: 1.3 });
    // 笔锋：两道纸色缝把笔毛分成三束，越往下越细
    c.save(); c.globalAlpha = 0.62; c.strokeStyle = PAL.cream; c.lineCap = 'round';
    for (const [x0, x1] of [[-9, -1], [8, 1]]) {
      c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(x0, -78); c.quadraticCurveTo((x0 + x1) / 2, -36, x1, -6); c.stroke();
    }
    c.restore();
    // 笔尖将落未落的一滴墨：拉长的泪滴 + 一线墨丝
    const hang = K(lt, [[2.86, 0], [3.60, 1]]);
    if (hang > 0.02) {
      const dy = 5 + 26 * hang, dr = 2.5 + 8 * hang;
      inkStroke(c, [[0, 0], [0, Math.max(1, dy - dr)]], { seed: 522 + sv, color: PAL.ink, w: 2.0, amp: 0.4, t0: 4, t1: 6 });
      const el = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        el.push([Math.cos(a) * dr * 0.80, dy + Math.sin(a) * dr * 1.42]);
      }
      fillPoly(c, boil(el, 520 + sv, 1.1, 22), PAL.ink);
    }
    c.restore();
  }
  // 空白处的一行小字（卷册上的"没有"）：极淡墨痕
  if (lt > 2.2) {
    c.save(); c.globalAlpha = 0.10 * clamp((lt - 2.2) / 0.6, 0, 1);
    for (let i = 0; i < 5; i++) {
      inkStroke(c, [[225 + i * 62, 555], [225 + i * 62, 635]], { seed: 600 + i + sv, color: PAL.ink, w: 2.0, amp: 1.2, t0: 6, t1: 10 });
    }
    c.restore();
  }
}

// ---------------------------------------------------------------- 分镜 C：竹简 + 两处朱圈
const SLIPS = 7, SLIP_W = 104, SLIP_GAP = 16, SLIP_H = 700;
function slipX(i) { return (i - (SLIPS - 1) / 2) * (SLIP_W + SLIP_GAP); }
function drawSlips(c, lt, dropOff = 0) {
  c.save();
  const sv = bv(Math.round(lt * FPS));
  const top = 200 + dropOff;
  for (let i = 0; i < SLIPS; i++) {
    const x = slipX(i);
    const wob = Math.sin(i * 1.7) * 2;
    solidSlip(c, x + wob, top, i, sv);
  }
  // 两道编绳
  c.save(); c.globalAlpha = 0.85;
  inkStroke(c, [[slipX(0) - 30, top + 70], [slipX(SLIPS - 1) + 30, top + 74]], { seed: 700 + sv, color: PAL.ink, w: 3.0, amp: 1.6, t0: 20, t1: 24 });
  inkStroke(c, [[slipX(0) - 30, top + SLIP_H - 70], [slipX(SLIPS - 1) + 30, top + SLIP_H - 64]], { seed: 710 + sv, color: PAL.ink, w: 3.0, amp: 1.6, t0: 20, t1: 24 });
  c.restore();
  c.restore();
}
function solidSlip(c, x, y, i, sv) {
  const hw = SLIP_W / 2, r = 6;
  const pts = [
    [x - hw + r, y], [x + hw - r, y], [x + hw, y + r], [x + hw, y + SLIP_H - r],
    [x + hw - r, y + SLIP_H], [x - hw + r, y + SLIP_H], [x - hw, y + SLIP_H - r], [x - hw, y + r],
  ];
  fillShape(c, pts, '#eddfb9', { seed: 800 + i + sv, amp: 1.2 });
  c.save(); c.globalAlpha = 0.22; c.fillStyle = '#8a7358';
  c.fillRect(x - hw, y, 5, SLIP_H); c.fillRect(x + hw - 5, y, 5, SLIP_H);
  c.restore();
  // 正文（预渲染的真字贴图）
  const tex = SLIPTEX[i];
  if (tex) {
    c.save(); c.globalAlpha = 0.93;
    c.drawImage(tex, x - hw, y, SLIP_W, SLIP_H);
    c.restore();
    // 竹纹压过墨：让字吃进木头
    c.save(); c.globalAlpha = 0.09; c.fillStyle = '#7a6244';
    for (let k = 0; k < 5; k++) c.fillRect(x - hw + 1, y + 66 + k * 138, SLIP_W - 2, 1.6);
    c.restore();
  }
  // 简边
  inkStroke(c, [[x - SLIP_W / 2 + 2, y + 4], [x - SLIP_W / 2 + 2, y + SLIP_H - 4]], { seed: 810 + i + sv, color: '#6b5540', w: 1.8, amp: 1.0, t0: 8, t1: 14 });
  inkStroke(c, [[x + SLIP_W / 2 - 2, y + 4], [x + SLIP_W / 2 - 2, y + SLIP_H - 4]], { seed: 820 + i + sv, color: '#6b5540', w: 1.8, amp: 1.0, t0: 8, t1: 14 });
}
function shotC(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  // 主：妲己化狐（vidB），中偏右大立绘——朱圈落下时的命运预兆
  drawVideoChar(c, IMG.dajiB, lt * 0.9 + 0.5, 1250, 1008, { s: 0.94, alpha: 0.95 });
  // 贴纸：竹简（左侧，缩小 0.55，落下 + 朱圈动效）
  const top = 200;
  c.save(); c.translate(25, 245); c.rotate(0.02); c.scale(0.55, 0.55); c.translate(960, 0);
  drawSlips(c, lt, 0);
  // 两处朱圈：「牝鸡」的鸡（第 5 简第 3 字）与「妇言」的妇（第 2 简第 2 字）
  const r1 = clamp((lt - 2.7) / 0.46, 0, 1), r2 = clamp((lt - 3.5) / 0.46, 0, 1);
  [{ u: r1, i: 4, k: 2 }, { u: r2, i: 1, k: 1 }].forEach(({ u, i, k }) => {
    if (u <= 0) return;
    const P0 = SLIPPOS[i] && SLIPPOS[i][k];
    if (!P0) return;
    const x = slipX(i) + Math.sin(i * 1.7) * 2, y = top + P0.cy;
    const P = [], n = 38;
    for (let a = 0; a < n * u * 1.04; a++) {
      const ang = (a / n) * Math.PI * 2 - Math.PI / 2 + 0.10;
      const rx = 46 * (1 + 0.04 * Math.sin(a * 1.3)), ry = 55;
      P.push([x + Math.cos(ang) * rx, y + Math.sin(ang) * ry]);
    }
    if (P.length > 3) {
      c.save(); c.globalAlpha = 0.95;
      inkStroke(c, P, { seed: 1000 + i * 11 + k + sv, color: PAL.red, w: 7.0, t0: 14, t1: 22, amp: 1.6 });
      c.restore();
    }
  });
  c.restore();
}

// ---------------------------------------------------------------- 分镜 D/E：妲己登场 → 墨没（AI 视频抠像层）
// 人物层：VideoGen i2v 定稿造型（09）动作片段，逐帧抠像 PNG 序列
// 底图 768×1152，人物脚底约 y=1130、水平中心约 x=384；scale 0.78 时人物高约 835px，脚底贴地面
const DAJI = { x: 1310, ground: 986, scale: 0.78, fw: 768, fh: 1152, feetY: 1130, cx: 384 };
function drawVideoChar(c, frames, t, x, groundY, o = {}) {
  if (!frames || !frames.length) return;
  const idx = Math.min(frames.length - 1, Math.max(0, Math.floor(t * FPS)));
  const s = DAJI.scale * (o.s || 1);
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  c.drawImage(frames[idx], x - DAJI.cx * s, groundY - DAJI.feetY * s, DAJI.fw * s, DAJI.fh * s);
  c.restore();
}
// 画中画：带原背景的视频片段 + 墨色画框（A 镜开场用）
function drawVideoInset(c, frames, t, cx, cy, ih, o = {}) {
  if (!frames || !frames.length) return;
  const idx = Math.min(frames.length - 1, Math.max(0, Math.floor(t * FPS)));
  const pop = o.pop ? E.out3(clamp((o.pop[1] - o.pop[0]) / 0.4, 0, 1)) : 1;
  const s = ih / DAJI.fh * (0.94 + 0.06 * (1 - pop));
  const fw = DAJI.fw * s, fh = DAJI.fh * s;
  c.save();
  c.globalAlpha = 0.97 * (o.alpha ?? 1);
  c.translate(cx, cy); c.rotate(o.rot ?? -0.015);
  c.drawImage(frames[idx], -fw / 2, -fh / 2, fw, fh);
  c.strokeStyle = PAL.ink; c.lineWidth = 5; c.strokeRect(-fw / 2 - 7, -fh / 2 - 7, fw + 14, fh + 14);
  c.lineWidth = 1.6; c.strokeRect(-fw / 2 - 15, -fh / 2 - 15, fw + 30, fh + 30);
  c.restore();
}
function drawHall(c, seed) {
  // 殿柱：左侧竖构图（柱占左 1/4，人物压右三分线）+ 地面线
  const colX = 150, colW = 84;
  c.save(); c.globalAlpha = 0.94; c.fillStyle = PAL.ink;
  c.fillRect(colX, -80, colW, 1070);               // 柱身
  c.fillRect(colX - 18, 932, colW + 36, 60);       // 础石
  c.fillRect(colX - 22, -80, colW + 44, 30);       // 栌斗
  c.globalAlpha = 0.42; c.fillStyle = PAL.cream; c.fillRect(colX + colW / 2 - 2, 0, 4, 928);  // 高光
  c.globalAlpha = 0.22; c.fillStyle = PAL.ink; c.fillRect(0, 986, W, 3);  // 地面
  // 柱后虚影：第二根柱更远、更淡（纵深）
  c.globalAlpha = 0.16; c.fillStyle = PAL.ink;
  c.fillRect(colX + 360, -40, 52, 880);
  c.restore();
}
function shotD(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  drawHall(c, 1200);
  // 人物：vidA 掩面→露面（对应「没长相」设问），从墨中显形 + 自右向左缓步走位
  const emerge = clamp(lt / 1.1, 0, 1);
  const walkU = E.out3(clamp((lt - 0.25) / 1.9, 0, 1));
  const px = lerp(DAJI.x + 170, DAJI.x, walkU);
  drawVideoChar(c, IMG.dajiA, lt * 0.92 + 0.42, px, 994, { s: 0.92, alpha: 0.35 + 0.65 * E.out3(emerge) });
  // 脚下墨影（跟随走位）
  c.save(); c.globalAlpha = 0.16;
  fillShape(c, boil(circlePts(px, 1000, 150, 0, 34), 1300 + sv, 6, 90), PAL.ink, { seed: 1310 + sv, amp: 4 });
  c.restore();
}
function shotE(c, lt) {
  const sv = bv(Math.round(lt * FPS));
  drawHall(c, 1200);
  // 人物：vidC 低叹→转身拂袖离去（对应「什么都不剩」——人走茶凉，墨淹没一切）
  const ES = 0.88;
  drawVideoChar(c, IMG.dajiC, lt * 0.9 + 0.5, DAJI.x, 994, { s: ES });
  // 墨没：从下往上淹没，最后全屏（压快，给退墨留时间）
  const flood = K(lt, [[2.20, 0], [3.00, 1]]);
  if (flood > 0.01) {
    const front = lerp(H + 120, -160, E.io2(flood));
    c.save();
    c.beginPath(); c.rect(-300, front, W + 600, H + 600); c.clip();
    c.fillStyle = PAL.ink; c.fillRect(-300, front, W + 600, H + 600);
    c.restore();
    const top = [];
    for (let i = 0; i <= 22; i++) {
      const x = -60 + (i / 22) * (W + 120);
      top.push([x, front + Math.sin(i * 1.3 + lt * 6) * 22 + (hs(1400, i) - 0.5) * 26]);
    }
    fillPoly(c, [...top, [W + 60, H + 300], [-60, H + 300]], PAL.ink);
    c.save(); c.globalAlpha = 0.85;
    for (let i = 0; i < 7; i++) {
      const x = 120 + i * 260 + hs(1410, i) * 80;
      inkStroke(c, [[x, front + 10], [x + 30, front - 26 - 40 * hs(1420, i)]], { seed: 1430 + i + sv, color: PAL.ink, w: 6, amp: 3.0, t0: 8, t1: 20 });
    }
    c.restore();
  }
  // 结尾：墨从两侧退开，只留中间一道竖缝，笄上一点朱定在缝心
  const recede = K(lt, [[3.30, 0], [4.60, 1]]);
  if (recede > 0.01) {
    const hx = DAJI.x, hy = 994 - 950 * DAJI.scale * ES;
    const gap = lerp(6, 128, E.out3(recede));      // 缝半宽 6→128
    // 中间露纸的竖缝（缝心在 hx，红点也在 hx）
    c.save();
    c.beginPath(); c.rect(hx - gap, -40, gap * 2, H + 80); c.clip();
    drawPaper(c);
    c.restore();
    // 缝两侧的墨边（不规则、带飞白）
    c.save();
    for (const side of [-1, 1]) {
      const ex = hx + side * gap;
      c.globalAlpha = 0.96;
      const edge = [];
      for (let i = 0; i <= 20; i++) {
        const y = -60 + (i / 20) * (H + 120);
        edge.push([ex + side * (hs(1520 + (side > 0 ? 30 : 0), i) - 0.5) * 24 + Math.sin(y * 0.012 + lt * 4) * 9, y]);
      }
      c.beginPath(); c.moveTo(edge[0][0], edge[0][1]);
      for (const [exx, ey] of edge) c.lineTo(exx, ey);
      c.lineTo(side > 0 ? W + 60 : -60, H + 80); c.lineTo(side > 0 ? W + 60 : -60, -80); c.closePath();
      c.fillStyle = PAL.ink; c.fill();
      c.globalAlpha = 0.8;
      inkStroke(c, edge, { seed: 1560 + (side > 0 ? 40 : 0) + sv, color: PAL.ink, w: 5, amp: 3.4, t0: 10, t1: 20 });
    }
    c.restore();
    // 缝心红点（笄上那一点，越退越亮，固定缝心 hx）
    c.save(); c.globalAlpha = 0.5 + 0.5 * recede;
    dot(c, hx, hy, 11, PAL.red, 1510 + sv, 1.2);
    c.restore();
  }
}

// ---------------------------------------------------------------- 转场
function inkWipe(c, u, sv, edgeX) {
  const half = 240 + 52 * Math.sin(u * 8);
  const L = [], R = [];
  for (let i = 0; i <= 20; i++) {
    const y = -160 + (i / 20) * (H + 320), ex = edgeX(y);
    L.push([ex - half + (hs(201, i) - 0.5) * 26, y]);
    R.push([ex + half * (0.55 + 0.5 * hs(202, i)) + (hs(203, i) - 0.5) * 26, y]);
  }
  fillPoly(c, [...L, ...R.reverse()], PAL.ink);
  c.save(); c.globalAlpha = 0.8;
  for (let i = 0; i < 8; i++) {
    const y0 = 40 + i * 140 + hs(204, i) * 36, ex = edgeX(y0);
    inkStroke(c, [[ex + half * 0.6, y0], [ex + half * 0.6 + 140 + 120 * hs(205, i), y0 + 14]], { seed: 8700 + i + sv, color: PAL.ink, w: 4 + 6 * hs(206, i), amp: 3.6, t0: 8, t1: 26 });
  }
  c.restore();
}

// ---------------------------------------------------------------- 主渲染
export async function init(canvas, dpr = 1) {
  DPR = dpr || 1;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  ctx = canvas.getContext('2d');
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  IMG.paper = await load('assets/paper_base.jpg');
  IMG.tooth = await load('assets/paper_tooth.png');
  IMG.dust = [await load('assets/dust_ink_01.png'), await load('assets/dust_ink_02.png')];
  const opentype = (await import('opentype')).default || (await import('opentype'));
  const bufA = await (await fetch('assets/font/LongCang-Regular.ttf')).arrayBuffer();
  const bufB = await (await fetch('assets/font/LXGWMarkerGothic-Regular.ttf')).arrayBuffer();
  FONT = opentype.parse(bufA); FONT_B = opentype.parse(bufB);
  try {
    const bufK = await (await fetch('assets/font/KaiTi.ttf')).arrayBuffer();
    const ffK = new FontFace('KaiTi', bufK.slice(0)); await ffK.load(); document.fonts.add(ffK); SUBFONT = true;
  } catch (e) { console.warn('字幕字体注册失败', e); }
  for (const ch of '妲己？纣帝辛敌人起的名字品昏君雄主怎被骂成看穿越多晚具体离谱惟妇言是用倒戈一天谁写的背锅白了个不') GLY[ch] = glyphPolys(FONT, ch, BIG);
  for (const ch of '无字') GLY2[ch] = glyphPolys(FONT_B, ch, BIG);
  // 竹简正文：逐个字形取轮廓，主字体缺字时回退到马克笔体
  for (const ch of [...new Set(SLIP_LINES.join(''))]) {
    const f = FONT.charToGlyph(ch).index ? FONT : (FONT_B.charToGlyph(ch).index ? FONT_B : null);
    if (!f) { console.warn('[slip] 缺字', ch); continue; }
    const G = glyphPolys(f, ch, 100);
    G.bb = bboxOf(G.polys);
    SLIPGLY[ch] = G;
  }
  buildSlipTex();
  // 妲己动作视频帧（抠像 PNG 序列，D/E 镜用）
  const loadSeq = async (dir, start = 0) => {
    const arr = [];
    for (let i = start; i < start + 200; i++) {
      const im = await new Promise((res) => {
        const x = new Image();
        x.onload = () => res(x); x.onerror = () => res(null);
        x.src = `assets/vid/${dir}/${String(i).padStart(4, '0')}.png`;
      });
      if (!im) break;
      arr.push(im);
    }
    return arr;
  };
  IMG.dajiA = await loadSeq('frames_vidA');
  IMG.dajiC = await loadSeq('frames_vidC');
  IMG.daji0 = await loadSeq('frames_vid0');
  IMG.dajiB = await loadSeq('frames_vidB');
  IMG.vidCraw = await loadSeq('rawC', 1);   // ffmpeg 序号从 0001 起
  IMG.zhouW = await loadSeq('frames_vidZ');
  IMG.zhouF = await loadSeq('frames_vidZ2');
  IMG.wuYue = await loadSeq('frames_vidW');
  for (const n of ['周武王', '子贡', '孔子', '郭沫若', '比干']) IMG['ch_' + n] = await load('assets/chars/' + n + '.png');
  const gd = glyphBox('妲'), gj = glyphBox('己');
  const gap = 44, total = gd.w + gap + gj.w;
  PAIR.da = [-total / 2 - gd.x0, 0];
  PAIR.ji = [-total / 2 + gd.w + gap - gj.x0, 0];
}

// ================================================================ 全片段落（21.78–205.70）
const FULL = { EH: 15.34, G: 26.57, H: 34.46, I: 53.74, K: 77.46, L: 97.67, M: 117.47, N: 127.04, O: 149.04, W: 177.04, P: 195.94, END: 205.70 };

// 静态角色贴纸：pop 入场 + 呼吸浮沉（底边中心锚定）
function drawCharSticker(c, img, t, t0, x, groundY, h, o = {}) {
  if (!img) return;
  const pop = E.outBack(clamp((t - t0) / (o.popD ?? 0.5), 0, 1), 1.7);
  if (pop <= 0.01) return;
  const bob = Math.sin(t * 1.6 + (o.ph ?? 0)) * (o.bob ?? 4);
  const s = h / img.height * (0.97 + 0.03 * pop);
  c.save(); c.globalAlpha = o.alpha ?? 0.97;
  c.translate(x + (o.dx ?? 0), groundY + bob); c.rotate(o.rot ?? 0); c.scale(pop * s, pop * s);
  c.drawImage(img, -img.width / 2, -img.height);
  c.restore();
}
// 静态角色滑入（从右侧/左侧快速进入）
function drawCharSlide(c, img, t, t0, x, groundY, h, o = {}) {
  if (!img) return;
  const u = clamp((t - t0) / (o.dur ?? 0.4), 0, 1);
  if (u <= 0) return;
  const px = lerp(o.fromX ?? 2100, x, E.out3(u));
  drawCharSticker(c, img, t, t0, px, groundY, h, o);
}
// 朱印盖章
function stampSeal(c, t, t0, x, y, chars, label) {
  const u = clamp((t - t0) / 0.28, 0, 1);
  if (u <= 0) return;
  const s = (1 - Math.pow(1 - u, 3)) * (1 + 0.22 * Math.sin(u * Math.PI) * (1 - u));
  c.save(); c.translate(x, y); c.rotate(-0.06); c.scale(s, s);
  c.save(); c.globalAlpha = 0.92;
  fillPoly(c, boil(rrectPts(-150, -110, 300, 220, 26), 6200, 1.4, 50), PAL.red);
  c.restore();
  c.fillStyle = '#f4ecd9'; c.font = '700 82px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'middle';
  chars.forEach((ch, i) => c.fillText(ch, -75 + (i % 2) * 150, -52 + Math.floor(i / 2) * 106));
  c.restore();
  if (label) {
    c.save(); c.globalAlpha = 0.9 * u; c.fillStyle = PAL.ink;
    c.font = '600 34px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.fillText(label, x, y + 155);
    c.restore();
  }
}
// 逐字墨砸大字
function bigInk(c, t, t0, chars, x, y, size, o = {}) {
  const gap = size * 1.16, per = o.per ?? 0.5;
  chars.forEach((ch, i) => {
    const f = clamp((t - t0 - i * per) / 0.55, 0, 1);
    if (f <= 0) return;
    const s = E.outBack(f, 2.2) * (size / BIG);
    c.save(); c.translate(x + (i - (chars.length - 1) / 2) * gap, y); c.rotate((hs(70, i) - 0.5) * 0.08);
    c.scale(s, s);
    writeGlyph(c, ch, -75, 75, clamp(f * 2.2, 0, 1), 6000 + i * 31, { w: o.w ?? 8, color: o.color ?? PAL.ink });
    c.restore();
  });
}
// 竖排小字（手写体，用于引文）
function inkColumn(c, text, x, y, size, seed, o = {}) {
  const s = size / BIG;
  [...text].forEach((ch, i) => {
    if (ch === '，' || ch === '。' || ch === '、') return;
    c.save(); c.translate(x, y + i * size * 1.06); c.scale(s, s);
    writeGlyph(c, ch, -75, 75, 1, seed + i * 13, { w: o.w ?? 3.2 });
    c.restore();
  });
}
// 纸卡贴纸（圆角纸底 + 阴影 + 标题/正文）
function paperCard(c, t, t0, x, y, w, h, o = {}) {
  const pop = E.outBack(clamp((t - t0) / 0.5, 0, 1), 1.8);
  if (pop <= 0.01) return null;
  const bob = Math.sin(t * 1.7 + (o.ph ?? 1)) * 5;
  c.save(); c.translate(x, y + bob); c.rotate(o.rot ?? -0.03); c.scale(pop, pop);
  c.save(); c.globalAlpha = 0.13; fillPoly(c, boil(rrectPts(-w / 2 + 7, -h / 2 + 10, w, h, 24), 6300 + (o.ph ?? 1), 2.2, 70), PAL.ink); c.restore();
  c.save(); c.globalAlpha = 0.97; fillPoly(c, boil(rrectPts(-w / 2, -h / 2, w, h, 26), 6310 + (o.ph ?? 1), 1.6, 70), o.color ?? '#f4ecd9'); c.restore();
  inkStroke(c, rrectPts(-w / 2, -h / 2, w, h, 26), { seed: 6320 + (o.ph ?? 1), color: PAL.ink, w: 4, t0: 12, t1: 20, amp: 1.5 });
  return { w, h };
}
// 墨焰（自下而上）
function inkFlames(c, t, y0, h) {
  c.save();
  for (let i = 0; i < 9; i++) {
    const x = 160 + i * 200 + hs(6500, i) * 60;
    const sway = Math.sin(t * 5.5 + i * 1.7) * 26;
    const hh = h * (0.6 + hs(6510, i) * 0.5) * (0.85 + 0.15 * Math.sin(t * 7 + i));
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const v = k / 8;
      pts.push([x + sway * v * v - (1 - v) * 46 * (hs(6520 + i, k) - 0.5), y0 - hh * v]);
    }
    inkStroke(c, pts, { seed: 6530 + i + Math.floor(t * 12) % 4, color: PAL.ink, w: 34 + hs(6540, i) * 26, t0: 26, t1: 80, amp: 3.4, jit: 0.7, heavy: 0.25 });
  }
  c.restore();
}

// ---------------- F · 名字（15.34–26.57；动效锚定实测语音：纣字 16.96/朱叉 18.03/帝辛 20.58/朱印 24.38）
function shotF(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 大「纣」字写出（16.96 起），朱叉落在“压根不是他的名字”（18.03）
  const u1 = clamp((lt - 1.62) / 1.5, 0, 1);
  c.save(); c.translate(640, 460); c.scale(1.18, 1.18);
  writeGlyph(c, '纣', -75, 75, clamp(u1 * 1.9, 0, 1), 5000 + sv, { w: 9 });
  c.restore();
  if (lt > 2.69) {
    const u = clamp((lt - 2.69) / 0.4, 0, 1);
    c.save(); c.globalAlpha = 0.95;
    inkStroke(c, [[370, 230], [lerp(370, 930, E.out3(u)), 700]], { seed: 7100 + sv, color: PAL.red, w: 13, t0: 20, t1: 30, amp: 3.4 });
    inkStroke(c, [[910, 250], [lerp(910, 390, E.out3(u)), 710]], { seed: 7110 + sv, color: PAL.red, w: 11, t0: 20, t1: 28, amp: 3.0 });
    c.restore();
  }
  // 贴纸：姓子名受 → 大字「帝辛」（商朝人叫他帝辛 20.58 起）
  if (lt > 5.24) {
    const u = E.outBack(clamp((lt - 5.24) / 0.6, 0, 1), 1.9);
    c.save(); c.translate(1360, 320); c.scale(u * 0.82, u * 0.82); c.rotate(-0.03);
    writeGlyph(c, '帝', -95, 75, clamp((lt - 5.74) / 1.2, 0, 1), 5200 + sv, { w: 7 });
    writeGlyph(c, '辛', 95, 75, clamp((lt - 6.34) / 1.2, 0, 1), 5400 + sv, { w: 7 });
    c.restore();
    c.save(); c.globalAlpha = 0.9 * clamp((lt - 7.3) / 0.5, 0, 1);
    c.fillStyle = PAL.ink; c.font = '600 36px "Microsoft YaHei"'; c.textAlign = 'center';
    c.fillText('商朝人叫他 · 帝辛', 1360, 560);
    c.restore();
  }
  // 朱印谥号（意思是「残义损善」 24.38 起，右下避开底部字幕区）
  if (lt > 9.04) stampSeal(c, lt, 9.04, 1360, 730, ['残', '义', '损', '善'], '「残义损善」· 周人定的谥号');
  // 小注：纣 ≠ 名字
  if (lt > 1.4 && lt < 4.9) {
    c.save(); c.globalAlpha = 0.85 * clamp((lt - 1.4) / 0.4, 0, 1) * clamp((4.9 - lt) / 0.5, 0, 1);
    c.fillStyle = PAL.red; c.font = '700 42px "Microsoft YaHei"'; c.textAlign = 'center';
    c.fillText('「纣」压根不是他的名字', 640, 760);
    c.restore();
  }
}

// ---------------- G · 赢家的名字（41.89–59.57）
function shotG(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 主：周武王贴纸滑入（持钺），s9 36.48 起
  drawCharSlide(c, IMG['ch_周武王'], lt, 0.35, 1310, 1010, 900, { fromX: 2150, rot: 0.015 });
  // 大字：敌人起的（s9 尾）——控制在画内左区
  bigInk(c, lt, 3.2, ['敌', '人', '起', '的'], 540, 290, 260, { per: 0.4 });
  // 「品」字回味（s10 41.93–46.79）
  bigInk(c, lt, 7.6, ['品'], 540, 740, 320, { per: 0.5, color: PAL.red, w: 9 });
}

// ---------------- H · 雄主（34.46–53.74；锚定：闪现 35.53/卷条 37.31/解说 42.0/挥拳 46.88/对比 50.47）
function shotH(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 主：纣王闪现登场（真实的帝辛 35.53，《史记》引文同步）
  drawVideoCharFlash(c, IMG.zhouW, lt, 1240, 1012, { s: 1.02, t0: 1.07, tf: lt });
  // 卷条上句（史记里怎么写帝辛的 37.31）
  if (lt > 2.85) {
    const card = paperCard(c, lt, 2.85, 430, 280, 720, 190, { rot: -0.035, ph: 3 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '600 42px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('《史记》· 前半句八个字：', 0, -18);
      c.font = '700 46px "Microsoft YaHei"';
      c.fillText('资辨捷疾，闻见甚敏', 0, 48);
    }
  }
  // 解说小签（反应快，口才好 42.0）
  if (lt > 7.54) {
    const card = paperCard(c, lt, 7.54, 430, 560, 700, 150, { rot: -0.02, ph: 19 });
    if (card) {
      c.fillStyle = '#5a5044'; c.font = '400 30px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('反应快，口才好，谁跟他辩论都辩不过', 0, 8);
    }
  }
  // 挥拳（后半句更狠 46.88）+ 猛兽剪影
  if (lt > 12.42) {
    const s = 0.62;
    c.save(); c.globalAlpha = 0.97;
    c.drawImage(IMG.zhouF[Math.min(IMG.zhouF.length - 1, Math.floor((lt - 12.42) * 24))],
      210 - DAJI.fw * s / 2, 1015 - DAJI.fh * s, DAJI.fw * s, DAJI.fh * s);
    c.restore();
    c.save(); c.globalAlpha = 0.5 * clamp((lt - 13.2) / 0.6, 0, 1);
    fillPoly(c, boil([[-620, -160], [-540, -230], [-430, -200], [-370, -260], [-330, -180], [-390, -120], [-470, -100], [-560, -120]], 6600 + sv, 3, 70), PAL.ink);
    c.restore();
    if (lt < 15.0) {
      c.save(); c.globalAlpha = 0.9;
      c.fillStyle = PAL.ink; c.font = '700 40px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('手格猛兽', 260, 200);
      c.restore();
    }
  }
  // 对比：昏君 ✗ / 雄主 ○（这不是昏君的长相 50.47 / 这是雄主的长相 51.61）
  if (lt > 16.01) {
    const u = E.outBack(clamp((lt - 16.01) / 0.5, 0, 1), 1.9);
    c.save(); c.translate(390, 620); c.scale(u, u);
    c.save(); c.globalAlpha = 0.95; fillPoly(c, boil(rrectPts(-190, -80, 380, 160, 22), 6700 + sv, 1.6, 60), '#f4ecd9'); c.restore();
    c.fillStyle = '#8a7a62'; c.font = '700 52px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('昏君？', 0, 0);
    inkStroke(c, [[-150, -20], [150, 30]], { seed: 6720 + sv, color: PAL.red, w: 9, t0: 16, t1: 24, amp: 2.6 });
    c.restore();
    if (lt > 17.15) {
      const u2 = E.outBack(clamp((lt - 17.15) / 0.5, 0, 1), 2.0);
      c.save(); c.translate(1000, 620); c.scale(u2, u2);
      c.save(); c.globalAlpha = 0.96; fillPoly(c, boil(rrectPts(-200, -84, 400, 168, 22), 6730 + sv, 1.6, 60), '#f7efdd'); c.restore();
      c.fillStyle = PAL.red; c.font = '700 56px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('雄主。', 0, 0);
      c.restore();
    }
  }
}

// ---------------- I · 东征 + 郭沫若 + 设问（81.20–99.86）
function shotI(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 地图贴纸：中原 + 东夷 + 箭头推进
  if (lt < 14.5) {
    const card = paperCard(c, lt, 0.3, 520, 460, 880, 560, { rot: -0.02, ph: 4, color: '#f2e8d2' });
    if (card) {
      c.save(); c.translate(-260, -120);
      // 中原块
      c.save(); c.globalAlpha = 0.9;
      fillPoly(c, boil([[0, 60], [90, -40], [260, -80], [430, -30], [520, 80], [470, 210], [300, 270], [120, 240]], 6800 + sv, 2.4, 80), '#e8d9b8');
      c.restore();
      inkStroke(c, [[0, 60], [90, -40], [260, -80], [430, -30], [520, 80], [470, 210], [300, 270], [120, 240], [0, 60]], { seed: 6810 + sv, color: PAL.ink, w: 3.5, t0: 12, t1: 20, amp: 1.8 });
      // 东夷 hatch 区
      c.save(); c.globalAlpha = 0.35;
      for (let i = 0; i < 7; i++) inkStroke(c, [[540 + i * 34, -60 + i * 10], [480 + i * 34, 250 - i * 8]], { seed: 6820 + i + sv, color: PAL.ink, w: 5, t0: 10, t1: 16, amp: 2 });
      c.restore();
      c.fillStyle = PAL.ink; c.font = '700 40px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('东夷', 620, 100);
      c.fillStyle = '#7a6c52'; c.font = '600 30px "Microsoft YaHei"';
      c.fillText('中原', 250, 110);
      // 三支箭头推进
      for (let i = 0; i < 3; i++) {
        const u = clamp((lt - (2.2 + i * 1.8)) / 0.9, 0, 1);
        if (u <= 0) continue;
        const y = 60 + i * 52, x1 = 470 + u * 120;
        c.save(); c.globalAlpha = 0.9;
        inkStroke(c, [[360, y], [x1, y - 6]], { seed: 6830 + i + sv, color: PAL.red, w: 7, t0: 8, t1: 12, amp: 1.6 });
        fillPoly(c, [[x1 + 26, y - 12], [x1, y - 20], [x1, y + 4]], PAL.red);
        c.restore();
      }
      c.restore();
      if (lt > 8.2) {
        c.save(); c.globalAlpha = 0.9 * clamp((lt - 8.2) / 0.4, 0, 1);
        c.fillStyle = PAL.red; c.font = '700 40px "Microsoft YaHei"'; c.textAlign = 'center';
        c.fillText('第一次纳入中原王朝版图', 60, 210);
        c.restore();
      }
    }
  }
  // 郭沫若 + 题字（设问大字出现前淡出）
  if (lt > 10.0 && lt < 16.6) {
    const fadeOut = 1 - clamp((lt - 15.4) / 0.9, 0, 1);
    drawCharSlide(c, IMG['ch_郭沫若'], lt, 10.0, 1180, 1010, 860, { fromX: 2150, rot: -0.02, ph: 5, alpha: 0.97 * fadeOut });
    if (lt > 12.0) {
      c.save(); c.globalAlpha = 0.94 * clamp((lt - 12.0) / 0.5, 0, 1) * fadeOut;
      inkStroke(c, [[980, 330], [lerp(980, 1660, E.out3(clamp((lt - 12.0) / 2.2, 0, 1))), 318]], { seed: 6900 + sv, color: PAL.red, w: 10, t0: 18, t1: 26, amp: 2.4 });
      c.restore();
      c.save(); c.globalAlpha = 0.95 * clamp((lt - 12.4) / 0.5, 0, 1) * fadeOut;
      c.fillStyle = PAL.ink; c.font = '700 52px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('「统一神州肇此人」', 1320, 260);
      c.fillStyle = '#8a7a62'; c.font = '400 28px "Microsoft YaHei"';
      c.fillText('—— 郭沫若', 1320, 396);
      c.restore();
    }
  }
  // 设问大字（段尾）
  if (lt > 15.5) {
    bigInk(c, lt, 15.5, ['怎', '被', '骂', '成'], 960, 300, 280, { per: 0.28, color: PAL.red });
    c.save(); c.globalAlpha = 0.9 * clamp((lt - 17.0) / 0.4, 0, 1);
    c.fillStyle = PAL.ink; c.font = '700 60px "Microsoft YaHei"'; c.textAlign = 'center';
    c.fillText('中 国 历 史 第 一 昏 君 ？', 960, 560);
    c.restore();
  }
}

// ---------------- K · 子贡（99.86–119.92）
function shotK(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 孔子小贴纸（左上，引出）
  drawCharSticker(c, IMG['ch_孔子'], lt, 0.3, 300, 620, 480, { ph: 6, rot: -0.03 });
  if (lt > 0.9) {
    c.save(); c.globalAlpha = 0.9 * clamp((lt - 0.9) / 0.4, 0, 1);
    c.fillStyle = '#8a7a62'; c.font = '600 30px "Microsoft YaHei"'; c.textAlign = 'center';
    c.fillText('孔子的高徒', 300, 660);
    c.restore();
  }
  // 子贡滑入
  drawCharSlide(c, IMG['ch_子贡'], lt, 1.4, 620, 1030, 950, { fromX: 1750, rot: 0.02, ph: 7 });
  // 论语卷贴纸（右）
  if (lt > 4.0) {
    const card = paperCard(c, lt, 4.0, 1430, 400, 820, 460, { rot: 0.025, ph: 8 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '700 40px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('《论语 · 子张》', 0, -170);
      inkColumn(c, '纣之不善，不如是之甚也', -190, -120, 62, 7400, { w: 3.4 });
      inkColumn(c, '是以君子恶居下流', 40, -120, 62, 7500, { w: 3.4 });
      inkColumn(c, '天下之恶皆归焉', 230, -120, 62, 7600, { w: 3.4 });
      if (lt > 8.0) {
        const u = clamp((lt - 8.0) / 0.4, 0, 1);
        c.save(); c.globalAlpha = 0.9 * u;
        inkStroke(c, [[-260, -60], [lerp(-260, 300, E.out3(u)), -66]], { seed: 7700 + sv, color: PAL.red, w: 8, t0: 14, t1: 20, amp: 2.2 });
        c.restore();
      }
    }
  }
  // 白话贴纸
  if (lt > 10.5) {
    const card = paperCard(c, lt, 10.5, 1430, 780, 760, 170, { rot: -0.02, ph: 9 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '600 36px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('纣干的坏事，没有传说中那么狠', 0, -14);
      c.fillText('失败者，会被泼满全身的脏水', 0, 44);
    }
  }
  // 脏水泼（墨点溅在「纣」字上）
  if (lt > 14.0) {
    c.save(); c.translate(620, 420); c.scale(0.72, 0.72);
    writeGlyph(c, '纣', -75, 75, 1, 7800, { w: 8 });
    c.restore();
    for (let wv = 0; wv < 3; wv++) {
      const u = clamp((lt - 14.0 - wv * 1.6) / 0.5, 0, 1);
      if (u <= 0 || u >= 1) continue;
      c.save(); c.globalAlpha = 0.7 * (1 - u);
      for (let i = 0; i < 10; i++) {
        const a = hs(7800 + wv, i) * Math.PI * 2, d = 60 + 190 * E.out3(u) * (0.5 + hs(7801 + wv, i));
        dot(c, 620 + Math.cos(a) * d * 0.8, 420 + Math.sin(a) * d, 4 + 9 * hs(7802 + wv, i) * (1 - u), PAL.ink, 7900 + i + wv + sv, 1.4);
      }
      c.restore();
    }
  }
  // 大字：天下之恶皆归焉
  if (lt > 16.2) bigInk(c, lt, 16.2, ['天', '下', '之', '恶'], 1180, 220, 250, { per: 0.3, color: PAL.red });
}

// ---------------- L · 时间线（119.92–139.52）
function shotL(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 贴纸：子贡看穿
  if (lt < 4.6) {
    const card = paperCard(c, lt, 0.2, 960, 350, 1100, 300, { ph: 10 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '700 58px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('两千五百年前，子贡就把这事看穿了', 0, 0);
    }
  }
  // 时间轴
  const nodes = [
    { x: 330, t0: 5.4, name: '春秋', items: ['酗酒', '听妇言', '不用贵族'] },
    { x: 730, t0: 9.4, name: '战国', items: ['炮烙之刑', '比干剖心'], ch: '比干' },
    { x: 1130, t0: 13.4, name: '汉', items: ['酒池肉林'] },
    { x: 1530, t0: 17.0, name: '明', items: ['狐狸精', '敲骨验髓', '鹿台自焚'], fox: true },
  ];
  const u = clamp((lt - 4.0) / 0.7, 0, 1);
  if (u > 0) {
    c.save(); c.globalAlpha = 0.9;
    inkStroke(c, [[160, 620], [lerp(160, 1760, E.out3(u)), 620]], { seed: 8000 + sv, color: PAL.ink, w: 8, t0: 16, t1: 22, amp: 2 });
    c.restore();
  }
  nodes.forEach((n, i) => {
    if (lt < n.t0) return;
    const pu = E.outBack(clamp((lt - n.t0) / 0.45, 0, 1), 1.9);
    c.save(); c.translate(n.x, 620); c.scale(pu, pu);
    fillPoly(c, boil(circlePts(0, 0, 16, 0, 20), 8100 + i + sv, 1.4, 40), PAL.red);
    c.restore();
    c.save(); c.globalAlpha = pu * 0.95;
    c.fillStyle = PAL.ink; c.font = '700 44px "Microsoft YaHei"'; c.textAlign = 'center';
    c.fillText(n.name, n.x, 540);
    c.restore();
    // 罪状签条堆叠
    n.items.forEach((it, k) => {
      const tu = E.outBack(clamp((lt - n.t0 - 0.35 - k * 0.4) / 0.4, 0, 1), 1.7);
      if (tu <= 0.01) return;
      c.save(); c.translate(n.x - 60 + k * 14, 700 + k * 74 + Math.sin(lt * 1.6 + i + k) * 3);
      c.rotate((hs(8200 + i * 10 + k, 1) - 0.5) * 0.12); c.scale(tu, tu);
      c.save(); c.globalAlpha = 0.96; fillPoly(c, boil(rrectPts(-130, -32, 260, 64, 14), 8210 + i * 10 + k, 1.5, 50), k === n.items.length - 1 && n.fox ? '#f3ddda' : '#f4ecd9'); c.restore();
      inkStroke(c, rrectPts(-130, -32, 260, 64, 14), { seed: 8220 + i * 10 + k, color: PAL.ink, w: 3, t0: 10, t1: 16, amp: 1.2 });
      c.fillStyle = PAL.ink; c.font = '600 32px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(it, 0, 0); c.textBaseline = 'alphabetic';
      c.restore();
    });
    // 比干小头像（战国节点）
    if (n.ch && lt > n.t0 + 1.1) {
      drawCharSticker(c, IMG['ch_' + n.ch], lt, n.t0 + 1.1, n.x + 4, 460, 260, { ph: 11 + i, alpha: 0.96 });
    }
    // 明节点：妲己化狐小窗
    if (n.fox && lt > n.t0 + 1.2 && IMG.dajiB.length) {
      const s = 0.42;
      c.save(); c.globalAlpha = 0.97;
      c.drawImage(IMG.dajiB[Math.min(IMG.dajiB.length - 1, Math.floor((lt - n.t0 - 1.2) * 24))],
        Math.min(1700, n.x + 30) - DAJI.fw * s / 2, 1050 - DAJI.fh * s, DAJI.fw * s, DAJI.fh * s);
      c.restore();
    }
  });
}

// ---------------- M · 网络暴力（139.52–158.76）
function shotM(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 三连大字
  if (lt < 7.0) {
    bigInk(c, lt, 0.7, ['越', '多'], 960, 300, 340, { per: 0.5, color: PAL.red, w: 10 });
    bigInk(c, lt, 2.4, ['越', '具', '体'], 960, 620, 280, { per: 0.4 });
    bigInk(c, lt, 4.1, ['越', '离', '谱'], 960, 900, 280, { per: 0.4, color: PAL.red });
  }
  // 网络暴力贴纸
  if (lt > 7.0) {
    const card = paperCard(c, lt, 7.0, 960, 200, 1200, 240, { ph: 12 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '700 62px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('这像不像今天的 · 网络暴力？', 0, 10);
    }
    // 弹幕签条雨，落在中央大「纣」字上
    const u0 = clamp((lt - 8.5) / 10.0, 0, 1);
    c.save(); c.translate(960, 660); c.scale(0.85, 0.85);
    writeGlyph(c, '纣', -75, 75, 1, 8300, { w: 9 });
    c.restore();
    for (let i = 0; i < 12; i++) {
      const delay = 8.5 + i * 0.55 + hs(8400, i) * 0.4;
      const u = clamp((lt - delay) / (0.35 + hs(8401, i) * 0.3), 0, 1);
      if (u <= 0) continue;
      const txt = ['炮烙', '酒池', '肉林', '狐狸精', '剖心', '验髓', '祸国', '殃民', '暴虐', '无道', '妖妃', '自焚'][i];
      const fx = 330 + hs(8402, i) * 1260, fy = lerp(-80, 560 + hs(8403, i) * 120, E.out3(u));
      c.save(); c.translate(fx, fy); c.rotate((hs(8404, i) - 0.5) * 0.24);
      c.globalAlpha = 0.96;
      fillPoly(c, boil(rrectPts(-92, -30, 184, 60, 14), 8500 + i, 1.5, 50), i % 3 === 0 ? '#f3ddda' : '#f4ecd9');
      inkStroke(c, rrectPts(-92, -30, 184, 60, 14), { seed: 8510 + i, color: PAL.ink, w: 2.6, t0: 8, t1: 14, amp: 1.1 });
      c.fillStyle = PAL.ink; c.font = '600 30px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(txt, 0, 0); c.textBaseline = 'alphabetic';
      c.restore();
    }
  }
}

// ---------------- N · 两处记载（158.76–180.67）
function shotN(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 《国语》卷
  if (lt > 0.5) {
    const card = paperCard(c, lt, 0.5, 470, 350, 800, 220, { ph: 13 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '700 38px "Microsoft YaHei"'; c.textAlign = 'left';
      c.fillText('《国语》：', -330, -40);
      c.font = '600 40px "Microsoft YaHei"';
      c.fillText('有苏氏战败，献女妲己 —— 就一句', -330, 40);
    }
  }
  // 《尚书》卷 + 四字大写 + 朱圈
  if (lt > 4.5) {
    const card = paperCard(c, lt, 4.5, 470, 720, 800, 320, { ph: 14 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '700 38px "Microsoft YaHei"'; c.textAlign = 'left';
      c.fillText('《尚书》：', -330, -100);
      c.font = '700 64px "Microsoft YaHei"';
      c.fillText('惟 妇 言 是 用', -330, 30);
      c.fillStyle = '#8a7a62'; c.font = '400 30px "Microsoft YaHei"';
      c.fillText('—— 就这四个字', -330, 110);
      if (lt > 8.0) {
        c.save(); c.globalAlpha = 0.92 * clamp((lt - 8.0) / 0.4, 0, 1);
        inkStroke(c, [[-290, -20], [-20, -20]], { seed: 8600 + sv, color: PAL.red, w: 9, t0: 14, t1: 20, amp: 2.2 });
        c.restore();
      }
    }
  }
  // 大字：锅，建立在这四个字上
  if (lt > 10.5) {
    bigInk(c, lt, 10.5, ['一', '个', '大', '锅'], 1330, 300, 260, { per: 0.34, color: PAL.red });
    if (lt > 13.0) {
      c.save(); c.globalAlpha = 0.95 * clamp((lt - 13.0) / 0.4, 0, 1);
      c.fillStyle = PAL.ink; c.font = '700 46px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('王朝灭亡的大锅', 1330, 520);
      c.fillText('最早就扣在这四个字上', 1330, 590);
      c.restore();
    }
  }
  // 妲己转身（vidC 重用）：听到这句话，转身离去
  if (lt > 15.0 && IMG.dajiC.length) {
    const s = 0.72;
    c.save(); c.globalAlpha = 0.97;
    c.drawImage(IMG.dajiC[Math.min(IMG.dajiC.length - 1, Math.floor((lt - 15.0) * 24))],
      1600 - DAJI.fw * s / 2, 1055 - DAJI.fh * s, DAJI.fw * s, DAJI.fh * s);
    c.restore();
  }
  // 转军事问题（段尾引出）
  if (lt > 18.0) {
    c.save(); c.globalAlpha = 0.94 * clamp((lt - 18.0) / 0.4, 0, 1);
    c.fillStyle = PAL.ink; c.font = '700 54px "Microsoft YaHei"'; c.textAlign = 'center';
    c.fillText('真正的原因，是个军事问题', 960, 200);
    c.restore();
  }
}

// ---------------- O · 牧野 + 鹿台（180.67–203.43）
function shotO(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 双箭头示意：主力在东 / 偷家在西
  if (lt < 3.8) {
    const card = paperCard(c, lt, 0.2, 960, 300, 1300, 300, { ph: 15 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '600 40px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('商军主力 · 全在东边打东夷', -260, -40);
      c.fillStyle = PAL.red; c.font = '700 46px "Microsoft YaHei"';
      c.fillText('周武王 · 看准时机直接偷家', 160, 50);
    }
  }
  // 倒戈：士兵剪影翻面
  if (lt > 3.8) {
    for (let i = 0; i < 6; i++) {
      const st = clamp((lt - 3.8 - i * 0.28) / 0.5, 0, 1);
      if (st <= 0) continue;
      const fx = Math.cos(st * Math.PI);
      const x = 250 + i * 210, y = 560 + Math.sin(i * 2.1) * 30;
      c.save(); c.translate(x, y); c.scale(Math.max(0.06, Math.abs(fx)), 1);
      const flip = fx < 0;
      fillPoly(c, boil([[0, -170], [34, -150], [40, -60], [30, 0], [-30, 0], [-40, -60], [-34, -150]], 8700 + i + sv, 2, 60), PAL.ink);
      fillPoly(c, boil(circlePts(0, -192, 24, 0, 16), 8710 + i + sv, 1.2, 30), PAL.ink);
      c.fillStyle = PAL.ink;
      c.fillRect(-3, -286, 6, 66);
      if (!flip) fillPoly(c, [[-28, -286], [28, -286], [14, -252], [-14, -252]], PAL.red);
      else fillPoly(c, [[-28, -286], [28, -286], [14, -252], [-14, -252]], PAL.ink);
      c.restore();
    }
    if (lt > 5.2 && lt < 9.8) bigInk(c, lt, 5.2, ['倒', '戈'], 960, 200, 320, { per: 0.45, color: PAL.red, w: 10 });
  }
  // 武王挥钺
  if (lt > 7.4 && IMG.wuYue.length) {
    const s = 0.92;
    c.save(); c.globalAlpha = 0.98;
    c.drawImage(IMG.wuYue[Math.min(IMG.wuYue.length - 1, Math.floor((lt - 7.4) * 24))],
      1210 - DAJI.fw * s / 2, 1078 - DAJI.fh * s, DAJI.fw * s, DAJI.fh * s);
    c.restore();
  }
  // 「一天。就一天。」
  if (lt > 10.9) {
    bigInk(c, lt, 10.9, ['一', '天'], 420, 270, 360, { per: 0.5, w: 11 });
    if (lt > 12.0) bigInk(c, lt, 12.0, ['就', '一', '天'], 480, 640, 280, { per: 0.4, color: PAL.red, w: 10 });
  }
  // 鹿台墨焰 + 纣王渐隐
  if (lt > 13.6) {
    const fu = clamp((lt - 13.6) / 2.6, 0, 1);
    c.save(); c.globalAlpha = 0.85 * (1 - fu * 0.35);
    c.drawImage(IMG.zhouW[Math.min(IMG.zhouW.length - 1, 100)],
      960 - DAJI.fw * 0.9 / 2, 1080 - DAJI.fh * 0.9, DAJI.fw * 0.9, DAJI.fh * 0.9);
    c.restore();
    inkFlames(c, lt, 1080, 780 * fu + 120);
    if (fu >= 1) {
      c.save(); c.globalAlpha = clamp((lt - 16.2) / 0.6, 0, 1);
      c.fillStyle = PAL.ink; c.fillRect(0, 300, 1920, 780);
      c.restore();
    }
  }
  // 两线作战 + 背锅
  if (lt > 17.4) {
    const card = paperCard(c, lt, 17.4, 960, 460, 1200, 220, { ph: 16 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '700 50px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('打了一辈子硬仗的雄主，输在两线作战', 0, 0);
    }
    if (lt > 20.0) {
      const card2 = paperCard(c, lt, 20.0, 960, 760, 1240, 180, { ph: 17, color: '#f7efdd' });
      if (card2) {
        c.fillStyle = PAL.red; c.font = '700 46px "Microsoft YaHei"'; c.textAlign = 'center';
        c.fillText('妲己？她连背锅的资格，都是后人给的', 0, 12);
      }
    }
  }
}

// ---------------- Q · 收尾上篇（177.04–195.94）：同一个人 / 执笔的人
function shotQ(c, lt) {
  const sv = bv(Math.round(lt * 24));
  drawPaper(c);
  // 双牌：赢家的书里「帝辛」（181.88） vs 输家的书里「纣王」（182.99）
  const u1 = E.outBack(clamp((lt - 4.54) / 0.5, 0, 1), 1.9);
  if (u1 > 0) {
    c.save(); c.translate(600, 430); c.scale(u1, u1);
    c.save(); c.globalAlpha = 0.96; fillPoly(c, boil(rrectPts(-170, -110, 340, 220, 20), 7700 + sv, 1.6, 60), '#f7efdd'); c.restore();
    c.fillStyle = PAL.ink; c.font = '700 72px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('帝辛', 0, -8);
    c.font = '400 28px "Microsoft YaHei"'; c.fillStyle = '#8a7a62';
    c.fillText('赢家的书里', 0, 74);
    c.restore();
  }
  const u2 = E.outBack(clamp((lt - 5.65) / 0.5, 0, 1), 1.9);
  if (u2 > 0) {
    c.save(); c.translate(1320, 430); c.scale(u2, u2);
    c.save(); c.globalAlpha = 0.96; fillPoly(c, boil(rrectPts(-170, -110, 340, 220, 20), 7730 + sv, 1.6, 60), '#f4ecd9'); c.restore();
    c.fillStyle = '#8a7a62'; c.font = '700 72px "Microsoft YaHei"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('纣王', 0, -8);
    inkStroke(c, [[-110, -30], [110, 12]], { seed: 7760 + sv, color: PAL.red, w: 9, t0: 12, t1: 20, amp: 2.6 });
    c.font = '400 28px "Microsoft YaHei"';
    c.fillText('输家的书里', 0, 74);
    c.restore();
  }
  // 中央纸卡：执笔的人（186.53）
  if (lt > 9.19) {
    const card = paperCard(c, lt, 9.19, 960, 720, 760, 170, { rot: -0.02, ph: 27 });
    if (card) {
      c.fillStyle = PAL.ink; c.font = '600 44px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('每个故事背后，都有一个执笔的人', 0, -6);
      c.font = '400 30px "Microsoft YaHei"'; c.fillStyle = '#5a5044';
      c.fillText('是赢是输，站在哪边，决定你能看到什么', 0, 48);
    }
  }
}

// ---------------- P · 收尾（195.94–205.70；谁写的 196.24 / 白了个白 204.31）
function shotP(c, lt) {
  drawPaper(c);
  bigInk(c, lt, 0.30, ['谁', '写', '的'], 960, 400, 380, { per: 0.3, w: 11 });
  c.save(); c.globalAlpha = 0.9 * clamp((lt - 1.06) / 0.3, 0, 1);
  c.fillStyle = PAL.ink; c.font = '700 54px "Microsoft YaHei"'; c.textAlign = 'center';
  c.fillText('这故事，是谁写的？', 960, 700);
  c.restore();
  if (lt > 8.37) {
    const card = paperCard(c, lt, 8.37, 1450, 850, 380, 150, { ph: 18, rot: 0.06 });
    if (card) {
      c.fillStyle = '#8a7a62'; c.font = '600 44px "Microsoft YaHei"'; c.textAlign = 'center';
      c.fillText('白了个白', 0, 14);
    }
  }
}

// 各段内部节拍按 新/旧时长 比例重映射（lt_new = lt_old * k），段起点已精确锚到口播从句
const SEGK = { G: 0.762, I: 1.271, K: 1.007, L: 1.010, M: 0.497, N: 1.004, O: 1.230 };
function dispatchFull(c, t) {
  if (t < FULL.G) shotF(c, t - FULL.EH);
  else if (t < FULL.H) shotG(c, (t - FULL.G) / SEGK.G);
  else if (t < FULL.I) shotH(c, t - FULL.H);
  else if (t < FULL.K) shotI(c, (t - FULL.I) / SEGK.I);
  else if (t < FULL.L) shotK(c, (t - FULL.K) / SEGK.K);
  else if (t < FULL.M) shotL(c, (t - FULL.L) / SEGK.L);
  else if (t < FULL.N) shotM(c, (t - FULL.M) / SEGK.M);
  else if (t < FULL.O) shotN(c, (t - FULL.N) / SEGK.N);
  else if (t < FULL.W) shotO(c, (t - FULL.O) / SEGK.O);
  else if (t < FULL.P) shotQ(c, t - FULL.W);
  else shotP(c, t - FULL.P);
}


export function render(t) {
  const D = Math.round(t * FPS), sv = bv(D);
  const c = ctx;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = PAL.cream; c.fillRect(0, 0, W, H);

  const inT1 = t >= S.T1a && t < S.T1b;
  const inB = t >= B0 && t < S.B1;
  const inT2 = t >= S.T2a && t < S.T2b;
  const inC = t >= C0 && t < S.C1;
  const inT3 = t >= S.T3a && t < S.T3b;
  const inD = t >= D0 && t < S.D1;

  if (t < S.A1) {
    camApply(c, camFor('A', t, S.A1)); drawPaper(c); shotA(c, t / 0.585);
  }

  if (inT1) {
    const u = inv(S.T1a, S.T1b, t);
    camApply(c, camFor('B', 0, S.B1 - B0)); drawPaper(c); shotB(c, 0.02);
    const xw = lerp(-420, W + 420, E.io2(u));
    const edgeX = (y) => xw + (y - H / 2) * 0.3;
    c.save();
    camApply(c, camFor('A', S.A1, S.A1));
    c.beginPath();
    c.moveTo(edgeX(-300), -300); c.lineTo(W + 900, -300); c.lineTo(W + 900, H + 300); c.lineTo(edgeX(H + 300), H + 300);
    c.closePath(); c.clip();
    drawPaper(c); shotA(c, Math.min(t, S.A1) / 0.585);
    c.restore();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    inkWipe(c, u, sv, edgeX);
  }

  if (inB) {
    camApply(c, camFor('B', t - B0, S.B1 - B0)); drawPaper(c); shotB(c, (t - B0) / 0.668);
  }

  if (inT2) {
    const u = inv(S.T2a, S.T2b, t);
    camApply(c, camFor('B', S.B1 - B0, S.B1 - B0)); drawPaper(c); shotB(c, S.B1 - B0);
    // 竹简自上方落下，逐渐盖住 B
    const drop = lerp(-1250, 0, E.out3(Math.min(1, u * 1.35)));
    camApply(c, camFor('C', 0, S.C1 - C0));
    c.save(); c.translate(960, 0); drawSlips(c, 0, drop); c.restore();
  }

  if (inC) {
    camApply(c, camFor('C', t - C0, S.C1 - C0)); drawPaper(c); shotC(c, (t - C0) / 0.710);
  }

  if (inT3) {
    const u = inv(S.T3a, S.T3b, t);
    camApply(c, camFor('D', 0, S.D1 - D0)); drawPaper(c); shotD(c, 0.05);
    const front = lerp(H + 120, -160, E.io2(u));
    c.save();
    c.beginPath(); c.rect(-300, -300, W + 600, front + 300); c.clip();
    camApply(c, camFor('C', S.C1 - C0, S.C1 - C0)); drawPaper(c); shotC(c, S.C1 - C0);
    c.restore();
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const top = [];
    for (let i = 0; i <= 22; i++) {
      const x = -60 + (i / 22) * (W + 120);
      top.push([x, front + Math.sin(i * 1.3 + t * 7) * 20 + (hs(1600, i) - 0.5) * 24]);
    }
    fillPoly(c, [...top, [W + 60, H + 300], [-60, H + 300]], PAL.ink);
  }

  if (inD) {
    camApply(c, camFor('D', t - D0, S.D1 - D0)); drawPaper(c); shotD(c, (t - D0) / 0.617);
  }
  if (t >= S.D1) {
    camApply(c, camFor('E', t - S.D1, S.E1 - S.D1)); drawPaper(c); shotE(c, Math.min(t - S.D1, S.E1 - S.D1));
  }
  // ---- 全片段落（15.34 起，段起点锚定口播从句）----
  if (t >= FULL.EH) {
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    dispatchFull(c, t);
  }
  // 口播字幕（全局，底部，手写体同风格）
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawSubtitle(c, t);

  drawTooth(c, D);
  c.save();
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(28,22,19,0)'); g.addColorStop(1, 'rgba(28,22,19,0.22)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

export function linkAt() { return null; }
export const SHOTS = S;
