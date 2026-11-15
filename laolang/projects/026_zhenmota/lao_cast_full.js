// lao_cast_full.js — 镇魔塔全片人物造型表（2026-11-11）
// 基于玄奘样片的18人扩展，新增镇魔塔专属角色。
// 风格：1980上海美影手绘赛璐璐，长鼻大眼平涂人物。
window.LAO_FULL = [
  // ========== 吴越国君主 ==========
  // 0 钱镠 - 吴越国开国君主，贩私盐出身，八都兵领袖
  { name: '钱镠', note: '吴越开国 · 贩私盐出身 · 八都兵领袖 · 粗布戎装',
    jacket: '#6b4e3b', pants: '#3f3a32', boots: '#2f2721', hat: 'none', skin: '#c99563', lao: true, head: 1.05,
    robe: '#6b4e3b', sash: '#8a3a2c', beard: '#2a211a', beardLen: 0.8, knife: true, build: 'stout',
    hair: '#2a211a', hairStyle: 'part', face: 'square', age: 1 },

  // 1 钱俶 - 钱镠孙子，吴越国最后一位君主
  { name: '钱俶', note: '吴越末代王 · 纳土归宋 · 锦袍儒冠',
    jacket: '#7a5a3c', pants: '#4a3a2a', boots: '#3a2a1e', hat: 'scholar', cap: '#2a211a', skin: '#d8b08a', lao: true, head: 1.0,
    robe: '#7a5a3c', sash: '#c9a24a', beard: '#3a2a1c', beardLen: 0.6, book: true, build: 'adult',
    hair: '#3a2a1c', hairStyle: 'part', face: 'long' },

  // ========== 宋朝与南唐 ==========
  // 2 宋太宗 - 宋朝皇帝
  { name: '宋太宗', note: '北宋皇帝 · 黄袍 · 金冠 · 帝王威仪',
    jacket: '#8a3a2c', pants: '#5a2a1e', boots: '#3a1e16', hat: 'crown', cap: '#c9a24a', skin: '#d8b08a', lao: true, head: 1.03,
    robe: '#8a3a2c', sash: '#c9a24a', beard: '#2a211a', beardLen: 0.9, build: 'adult', face: 'square' },

  // 3 李煜 - 南唐后主，词帝
  { name: '李煜', note: '南唐后主 · 词帝 · 文弱忧郁 · 书生袍',
    jacket: '#5a6a8a', pants: '#3a4a5a', boots: '#2a2a2a', hat: 'scholar', cap: '#3a3a4a', skin: '#e6c39a', lao: true, head: 1.0,
    robe: '#5a6a8a', sash: '#3a4a5a', beard: '#3a2a1c', beardLen: 0.5, book: true, thin: true, build: 'adult', face: 'long' },

  // ========== 佛教与传说 ==========
  // 4 法海 - 白蛇传中的和尚
  { name: '法海', note: '金山寺方丈 · 戒律森严 · 锡杖袈裟',
    jacket: '#8a6a3c', pants: '#6a5030', boots: '#3a2a1e', hat: 'none', skin: '#d8b08a', lao: true, head: 1.02,
    robe: '#8a6a3c', kasaya: '#a87a44', sash: '#6a5030', monk: true, staff: true, prayer: true,
    beard: '#2a211a', beardLen: 0.4, build: 'adult', face: 'long' },

  // 5 白娘子 - 白蛇传人物
  { name: '白娘子', note: '白蛇传 · 白素贞 · 素衣 · 温婉',
    jacket: '#efe3c4', pants: '#d8c9a2', boots: '#8a6a44', hat: 'none', skin: '#f0d8b8', lao: true, head: 0.98,
    robe: '#efe3c4', sash: '#8a9aa8', build: 'adult', hair: '#1a1512', hairStyle: 'bun', face: 'round' },

  // 6 许仙 - 白蛇传人物
  { name: '许仙', note: '白蛇传 · 许仙 · 药铺伙计 · 青布长衫',
    jacket: '#5a6a5a', pants: '#3a4a3a', boots: '#2a2a2a', hat: 'scholar', cap: '#3a3a3a', skin: '#e6c39a', lao: true, head: 1.0,
    robe: '#5a6a5a', sash: '#3a4a3a', book: true, build: 'adult', hair: '#2a211a', hairStyle: 'part', face: 'round' },

  // ========== 农民起义与百姓 ==========
  // 7 方腊 - 北宋起义领袖
  { name: '方腊', note: '北宋起义军领袖 · 头巾 · 腰刀 · 壮汉',
    jacket: '#5a4632', pants: '#3a3028', boots: '#2a211a', hat: 'band', cap: '#8a3a2c', skin: '#a9764f', lao: true, head: 1.06,
    robe: '#5a4632', sash: '#8a3a2c', beard: '#2a211a', beardLen: 0.9, knife: true, build: 'stout', face: 'square' },

  // 8 北宋村民 - 抠塔砖的百姓
  { name: '村民', note: '北宋百姓 · 粗布短打 · 扛麻袋 · 抠塔砖',
    jacket: '#6b5a3c', pants: '#4a3a2a', boots: '#2d2a22', hat: 'none', skin: '#c99563', lao: true, head: 1.02,
    robe: '#6b5a3c', sash: '#5a4a2c', beard: '#3a2a1c', beardLen: 0.3, build: 'adult',
    hair: '#2a211a', hairStyle: 'buzz', face: 'square' },

  // ========== 现代人物 ==========
  // 9 鲁迅 - 新文化运动旗手
  { name: '鲁迅', note: '民国作家 · 立领长衫 · 短发 · 冷峻',
    jacket: '#3a3a3a', pants: '#2a2a2a', boots: '#1a1a1a', hat: 'none', skin: '#d8b08a', lao: true, head: 1.0,
    robe: '#3a3a3a', sash: '#2a2a2a', beard: '#1a1512', beardLen: 0.3, build: 'adult',
    hair: '#1a1512', hairStyle: 'buzz', face: 'long' },

  // 10 考古队长 - 2001年雷峰塔地宫发掘
  { name: '考古队长', note: '现代考古 · 卡其夹克 · 安全帽 · 严谨',
    jacket: '#8a7a5a', pants: '#5a5a4a', boots: '#3a3a2a', hat: 'cap', cap: '#8a7a5a', skin: '#dfb98a', lao: true, head: 1.0,
    build: 'adult', hair: '#4a3a2a', hairStyle: 'buzz', face: 'long', satchel: '#6b4a2f' },

  // 11 文物研究员 - 实验室开铁函
  { name: '文物研究员', note: '现代 · 白大褂 · 眼镜 · 小心翼翼',
    jacket: '#e8e8e8', pants: '#3a4a5a', boots: '#2a2a2a', hat: 'none', skin: '#dfb98a', lao: true, head: 1.0,
    build: 'adult', hair: '#3a2a1c', hairStyle: 'part', face: 'round', glasses: true, satchel: '#6b4a2f' },

  // ========== 配角 ==========
  // 12 印度僧人 - 身毒国商船来的僧人
  { name: '印度僧人', note: '身毒国来僧 · 白袍 · 托钵',
    jacket: '#efe3c4', pants: '#d8c9a2', boots: '#8a6a44', hat: 'turban', cap: '#efe3c4', skin: '#8f5f3a', lao: true, head: 1.02,
    robe: '#efe3c4', sash: '#8a6a44', monk: true, prayer: true, thin: true, build: 'adult', face: 'long' },

  // 13 宋代文官 - 钱俶的谋臣
  { name: '宋代文官', note: '吴越文官 · 官帽 · 奏折',
    jacket: '#4a5a6a', pants: '#3a3a3a', boots: '#2a2a2a', hat: 'official', cap: '#2a211a', skin: '#dfb98a', lao: true, head: 1.0,
    robe: '#4a5a6a', sash: '#2a3a4a', beard: '#2a211a', beardLen: 0.4, book: true, build: 'adult', face: 'round' },

  // 14 艄公 - 西湖摇船的
  { name: '艄公', note: '西湖船工 · 斗笠 · 竹篙',
    jacket: '#5a6a5a', pants: '#3a4a3a', boots: '#2a2a2a', hat: 'cap', cap: '#6b5a3c', brim: '#8a7a4a', skin: '#a9764f', lao: true, head: 1.03,
    robe: '#5a6a5a', sash: '#4a5a4a', beard: '#3a2a1c', beardLen: 0.5, build: 'adult', face: 'square' },
];

window.LAO_FULL_NAMES = window.LAO_FULL.map((x) => [x.name, x.note]);

// 脸型/鼻长/眼大/下颌的个体差异
const FACE_K = {
  '钱镠': { fx: 1.08, fy: 0.96, nose: 1.10, eye: 0.90, jaw: 0.08 },
  '钱俶': { fx: 0.96, fy: 1.02, nose: 1.05, eye: 0.95 },
  '宋太宗': { fx: 1.06, fy: 0.98, nose: 1.05, eye: 0.94, jaw: 0.06 },
  '李煜': { fx: 0.94, fy: 1.06, nose: 0.95, eye: 1.08 },
  '法海': { fx: 0.98, fy: 1.02, nose: 1.15, eye: 0.88 },
  '白娘子': { fx: 0.92, fy: 0.95, nose: 0.75, eye: 1.25 },
  '许仙': { fx: 1.02, fy: 0.94, nose: 0.85, eye: 1.08 },
  '方腊': { fx: 1.10, fy: 0.95, nose: 1.00, eye: 0.88, jaw: 0.10 },
  '村民': { fx: 1.05, fy: 0.96, nose: 1.00, eye: 0.92, jaw: 0.05 },
  '鲁迅': { fx: 0.95, fy: 1.05, nose: 1.12, eye: 0.94, jaw: 0.03 },
  '考古队长': { fx: 0.95, fy: 1.05, nose: 1.05, eye: 0.98 },
  '文物研究员': { fx: 1.03, fy: 0.93, nose: 0.85, eye: 1.10 },
  '印度僧人': { fx: 0.88, fy: 1.06, nose: 1.28, eye: 0.88 },
  '宋代文官': { fx: 1.06, fy: 0.93, nose: 0.88, eye: 1.06 },
  '艄公': { fx: 1.04, fy: 0.95, nose: 1.00, eye: 0.90, jaw: 0.06 },
};

window.LAO_FULL.forEach((c) => {
  if (FACE_K[c.name]) c.faceK = FACE_K[c.name];
  if (c.age) { c.age = 1; c.browCol = '#d8c9a2'; }
});
