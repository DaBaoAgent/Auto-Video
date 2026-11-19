// lao_cast_full.js — 全片人物造型表（2026-11-09，待用户审核）
// 前三项是已定稿的 1953 考古队；其余为全片新增角色。字段与 lao_body.ts 的角色层对应。
window.LAO_FULL = [
  // 0–2 考古队（定稿）
  { name: '领队', note: '1953 考古队 · 高瘦 · 马灯 · 红围巾',
    jacket: '#5d6b63', pants: '#3f3a32', boots: '#2f2721', hat: 'none', skin: '#d6ab7a', lao: true, head: 1.0, scarf: '#a94c35', lantern: true, build: 'adult', hair: '#2a211a', hairStyle: 'part', face: 'long' },
  { name: '记录员', note: '1953 考古队 · 矮圆 · 圆眼镜 · 挎包',
    jacket: '#96672f', pants: '#39433d', boots: '#2b2822', hat: 'none', skin: '#dfb98a', lao: true, head: 1.03, glasses: true, satchel: '#6b4a2f', build: 'stout', hair: '#3a2a1c', hairStyle: 'bald', face: 'round' },
  { name: '挖掘工', note: '1953 考古队 · 宽肩 · 宽檐帽 · 镐',
    jacket: '#6b4e3b', pants: '#46463a', boots: '#2d2a22', hat: 'cap', cap: '#3a352a', brim: '#8a6a44', skin: '#c99563', lao: true, head: 1.04, pickaxe: true, build: 'adult', hair: '#241c16', hairStyle: 'buzz', face: 'square' },

  // 3–4 玄奘
  { name: '玄奘（青年）', note: '25 岁 · 偷渡出关 · 袈裟 · 锡杖',
    jacket: '#8a3f28', pants: '#5a2e1e', boots: '#2a211a', hat: 'none', skin: '#d8b08a', lao: true, head: 1.02, robe: '#8a3f28', kasaya: '#b23a2b', sash: '#2a211a', monk: true, staff: true, prayer: true, build: 'adult', face: 'long' },
  { name: '玄奘（晚年）', note: '60 岁 · 玉华寺译经 · 清瘦',
    jacket: '#a85f36', pants: '#7a3f24', boots: '#4a3524', hat: 'none', skin: '#d8b08a', lao: true, head: 1.0, robe: '#a85f36', kasaya: '#c47a3e', sash: '#7a3f24', monk: true, staff: true, prayer: true, thin: true, build: 'adult', face: 'long' },
  { name: '石槃陀', note: '瓜州胡商 · 毛发浓密 · 腰刀',
    jacket: '#3a2a22', pants: '#1f1a16', boots: '#120f0c', hat: 'fur', cap: '#2a211a', skin: '#a9764f', lao: true, head: 1.06, robe: '#3a2a22', sash: '#8a3a2c', beard: '#120f0c', beardLen: 0.7, knife: true, build: 'stout', face: 'square' },
  { name: '麴文泰', note: '高昌王 · 金冠 · 锦袍',
    jacket: '#7a3b2e', pants: '#4a2a22', boots: '#3a2a1e', hat: 'crown', cap: '#c9a24a', skin: '#d8b08a', lao: true, head: 1.03, robe: '#7a3b2e', sash: '#c9a24a', beard: '#2a211a', beardLen: 1.1, build: 'adult', face: 'long' },
  { name: '辩机', note: '玄奘助手 · 年轻译经僧 · 书',
    jacket: '#8a6a3c', pants: '#6a5030', boots: '#3a2a1e', hat: 'none', skin: '#e6c39a', lao: true, head: 1.0, robe: '#8a6a3c', kasaya: '#a87a44', sash: '#6a5030', monk: true, book: true, build: 'adult', face: 'round' },
  { name: '戒贤', note: '那烂陀长老 · 百岁 · 白须 · 锡杖',
    jacket: '#c46a2e', pants: '#8a4a22', boots: '#4a3524', hat: 'none', skin: '#a9764f', lao: true, head: 1.0, robe: '#c46a2e', kasaya: '#d88a3e', sash: '#8a4a22', monk: true, staff: true, prayer: true, beard: '#efe3c4', beardLen: 1.4, thin: true, build: 'adult', face: 'long' },
  { name: '戒日王', note: '曲女城辩经大会 · 头巾 · 金饰',
    jacket: '#c9a24a', pants: '#8a6a2a', boots: '#5a3a1a', hat: 'turban', cap: '#c9a24a', skin: '#a9764f', lao: true, head: 1.05, robe: '#c9a24a', sash: '#8a3a2c', beard: '#2a211a', beardLen: 1.0, build: 'stout', face: 'square' },
  { name: '婆罗门', note: '那烂陀挑战者 · 白袍 · 圣线',
    jacket: '#efe3c4', pants: '#d8c9a2', boots: '#8a6a44', hat: 'turban', cap: '#efe3c4', skin: '#8f5f3a', lao: true, head: 1.02, robe: '#efe3c4', sash: '#8a6a44', beard: '#2a211a', beardLen: 0.6, thin: true, build: 'adult', face: 'long' },
  { name: '王祥', note: '唐军烽燧校尉 · 甲胄 · 长矛',
    jacket: '#5a6a72', pants: '#3a444a', boots: '#2a3036', hat: 'helmet', cap: '#6a7a82', skin: '#d6ab7a', lao: true, head: 1.02, armor: true, beard: '#2a211a', beardLen: 0.5, spear: true, build: 'adult', face: 'square' },
  { name: '李昌', note: '瓜州官员 · 撕通缉令 · 官帽',
    jacket: '#4a5a6a', pants: '#3a3a3a', boots: '#2a2a2a', hat: 'official', cap: '#2a211a', skin: '#dfb98a', lao: true, head: 1.0, robe: '#4a5a6a', sash: '#2a3a4a', beard: '#2a211a', beardLen: 0.45, warrant: true, build: 'adult', face: 'round' },
  { name: '强盗头目', note: '恒河祭坛 · 头巾 · 腰刀',
    jacket: '#5a4632', pants: '#3a3028', boots: '#2a211a', hat: 'band', cap: '#8a3a2c', skin: '#8f5f3a', lao: true, head: 1.06, robe: '#5a4632', sash: '#8a3a2c', beard: '#2a211a', beardLen: 1.0, knife: true, build: 'stout', face: 'square' },
  { name: '吴承恩', note: '明代作者 · 方巾 · 书案',
    jacket: '#6a7a8a', pants: '#3a4a5a', boots: '#2a2a2a', hat: 'scholar', cap: '#2a211a', skin: '#d8b08a', lao: true, head: 1.0, robe: '#6a7a8a', sash: '#3a4a5a', beard: '#2a211a', beardLen: 1.0, book: true, build: 'adult', face: 'long' },
  { name: '唐太宗', note: '贞观 · 帝王 · 金冠',
    jacket: '#8a3a2c', pants: '#5a2a1e', boots: '#3a1e16', hat: 'crown', cap: '#c9a24a', skin: '#d8b08a', lao: true, head: 1.03, robe: '#8a3a2c', sash: '#c9a24a', beard: '#2a211a', beardLen: 0.9, build: 'adult', face: 'square' },
  { name: '武则天', note: '感业寺尼姑 · 灰色僧衣',
    jacket: '#5a5a6a', pants: '#4a4a56', boots: '#3a3a42', hat: 'turban', cap: '#8a8a92', skin: '#e6c39a', lao: true, head: 1.0, robe: '#5a5a6a', sash: '#8a6a44', build: 'adult', face: 'round' },
  { name: '康宁汉', note: '1861 英国考古学家 · 遮阳帽 · 望远镜',
    jacket: '#b0a080', pants: '#6a5a44', boots: '#4a3a2a', hat: 'pith', cap: '#d8c9a0', skin: '#dfb98a', lao: true, head: 1.0, beard: '#8a6a44', beardLen: 0.2, telescope: true, build: 'adult', face: 'long' },
];
window.LAO_FULL_NAMES = window.LAO_FULL.map((x) => [x.name, x.note]);

// 脸型/鼻长/眼大/下颌的个体差异（同一种头也读得出不同人）
const FACE_K = {
  '玄奘（青年）': { nose: 1.35, eye: 1.15, fx: 0.92, fy: 1.08 },
  '玄奘（晚年）': { nose: 1.10, eye: 0.95, fx: 0.94, fy: 1.05, jaw: 0.02 },
  '石槃陀': { fx: 1.15, fy: 0.94, nose: 1.20, eye: 0.85, jaw: 0.12 },
  '麴文泰': { fx: 0.94, fy: 1.04, nose: 1.16, eye: 0.90 },
  '辩机': { fx: 1.03, fy: 0.93, nose: 0.82, eye: 1.06 },
  '戒贤': { fx: 0.92, fy: 1.02, nose: 1.22, eye: 0.82, jaw: -0.03 },
  '戒日王': { fx: 1.10, fy: 0.97, nose: 1.12, eye: 0.94, jaw: 0.05 },
  '婆罗门': { fx: 0.88, fy: 1.06, nose: 1.28, eye: 0.88 },
  '王祥': { fx: 1.06, fy: 0.96, nose: 1.00, eye: 0.94, jaw: 0.06 },
  '李昌': { fx: 1.06, fy: 0.93, nose: 0.88, eye: 1.06 },
  '强盗头目': { fx: 1.10, fy: 0.95, nose: 1.00, eye: 0.88, jaw: 0.08 },
  '吴承恩': { fx: 0.95, fy: 1.05, nose: 1.12, eye: 0.94 },
  '唐太宗': { fx: 1.06, fy: 0.98, nose: 1.05, eye: 0.94, jaw: 0.06 },
  '武则天': { fx: 1.02, fy: 0.93, nose: 0.84, eye: 1.06 },
  '康宁汉': { fx: 0.95, fy: 1.05, nose: 1.20, eye: 0.94 },
};
window.LAO_FULL.forEach((c) => {
  if (FACE_K[c.name]) c.faceK = FACE_K[c.name];
  if (c.name.includes('晚年') || c.name === '戒贤') { c.age = 1; c.browCol = '#d8c9a2'; }
});
