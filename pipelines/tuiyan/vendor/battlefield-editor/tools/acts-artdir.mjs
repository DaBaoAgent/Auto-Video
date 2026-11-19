// 分镜表 → 引擎字段的纯函数映射（无 I/O、无副作用，可被 apply-artdir.mjs / build-film.mjs 共用）。
//
// 创作底稿（content/<战役>/分镜表.json）每一幕都写好了 env（如「夜·案前」）、scene（画面设计）、
// engine（镜头/卡片建议）、tag。旧 build-film.mjs 只用了 paras/title/tag/est_sec，把 46 幕压成
// 9 个模板轮播 —— 画面因此重复且与旁白对不上。本模块把 env/scene/engine 真正翻成引擎字段。
//
// 只使用引擎既有词汇：7 个单位 id + 5 类结构 id + 保留字(firechain 幕另加 wind)。
// 引擎契约见 docs/authoring/scene.md；消费端见 play.html 的 gotoPhase/director/applySet/dispatchFx。

export const ENV_PRESETS = ['day', 'cold', 'dusk', 'night', 'inferno', 'dawn'];
export const UNIT_IDS = ['caoMain', 'caoNavy', 'caoRen', 'liuArmy', 'liuFleet', 'sunFleet', 'hgFleet'];
export const STRUCT_IDS = ['xiangyang', 'jiangling', 'xiakou', 'chaisang', 'campWulin', 'campChibi', 'huarongPass'];
// 世界座标（同 terrain.json / structures.json 的世界单位）：x 东西、z 南北。
// 长江沿 z≈0 由 (-340,55) 流到 (340,-55)；曹军营乌林在北岸(z<0)，联军营赤壁在南岸(z>0)。
export const LANDMARKS = {
  襄阳: [-250, -160], 江陵: [-240, -36], 夏口: [174, -58], 柴桑: [272, 21],
  乌林: [-45, -52], 赤壁: [30, 44], 华容道: [-110, -80], 华容: [-110, -80], 长坂: [-150, -104],
  陆口: [105, 50], 樊口: [185, 37], 汉水: [158, -120], 长江: [-20, -2], 邺城: [-300, -196],
  玄武池: [-300, -196], 江面: [0, 0], 北岸: [-60, -34], 南岸: [22, 30], 沙盘: [0, -10],
  荆州: [-240, -36], 隘口: [-95, -72],
};
// 舞台原型：A 江面全景 / B 沙盘全图 / C 水寨对峙 / D 火攻连锁 / E 陆战追击
//          F 城池关隘 / G 案前近景 / H 营帐朝堂 / I 收束余韵
export const STAGES = ['river', 'sandbox', 'standoff', 'firechain', 'landpursuit', 'fortress', 'desk', 'camp', 'coda'];
const STAGE_LABEL = {
  river: '江面全景', sandbox: '沙盘全图', standoff: '水寨对峙', firechain: '火攻连锁',
  landpursuit: '陆战追击', fortress: '城池关隘', desk: '案前近景', camp: '营帐近景', coda: '收束余韵',
};
// 舞台默认由 env 的地点词判定。个别幕的 env 不足以判定时，可在分镜表的该幕写可选 `stage`
// 字段直接指定（值取 STAGES 之一），不再按幕号写死覆盖表。

// ── env / stage 判定 ───────────────────────────────────────────────

/** 从分镜表的 env 字串（如「冬·晨｜长江」）取「地点」那一段。 */
function placeOf(envStr) {
  const s = String(envStr || '');
  const seg = s.split(/[·｜|→]/).filter(Boolean);
  return seg.length > 1 ? seg[seg.length - 1].trim() : '';
}

/** 环境光照 preset：先看时段词，火攻幕强制 inferno。 */
export function envFor(envStr, stage) {
  if (stage === 'firechain') return 'inferno';
  const s = String(envStr || '');
  if (/夜/.test(s)) return 'night';
  if (/晨|晓|黎明/.test(s)) return 'dawn';
  if (/黄昏|暮|夕/.test(s)) return 'dusk';
  if (/冬|寒/.test(s)) return 'cold';
  return 'day';
}

/**
 * 舞台原型：优先用分镜表该幕可选的 `stage` 字段；否则按 env 的地点词归类；
 * 最后一幕与无地点的短拍幕收束。与幕号无关，任意幕数 / 幕序都成立。
 * @param act 分镜表 act（含 no/env，可选 stage）
 * @param total 总幕数（最后一幕 → coda）
 */
export function stageFor(act, total) {
  if (act && STAGES.includes(act.stage)) return act.stage;
  if (act && act.no === total) return 'coda';
  const p = placeOf(act && act.env);
  if (!p) return 'coda';
  if (/火光/.test(p)) return 'firechain';
  if (/营帐|帐内|朝堂|宴席/.test(p)) return 'camp';
  if (/案前|书信|人物|素|文$/.test(p)) return 'desk';
  if (/江面|长江|江水|风起/.test(p)) return 'river';
  if (/北岸|南岸|南北/.test(p)) return 'standoff';
  if (/旷野|退路|泥泞/.test(p)) return 'landpursuit';
  if (/隘口|邺城|荆州|夏口|柴桑|城|关/.test(p)) return 'fortress';
  if (/沙盘|全图|地图|气象|综述|北方|双点|惊/.test(p)) return 'sandbox';
  return 'sandbox';
}

// ── 相机镜头池：每个舞台 6 个「单镜」，一幕取 2–4 个（起始位置随幕号轮转）──
// 每个镜头只有 kind 与几何参数；dur 由 splitDurations 依旁白停顿切分。
// 世界可见范围约 x∈[-340,340]、z∈[-230,230]，相机高度多用 30–320。
const WIDE = {
  river: [
    { kind: 'line', a: [-360, 190, 250], b: [-170, 110, 140], look: [-60, 0, -6] },
    { kind: 'line', a: [330, 150, 170], b: [130, 80, 100], look: [40, 0, 0] },
    { kind: 'orbit', c: [-20, 0, -2], r: 210, h: 150, a0: 2.35, a1: 4.15 },
    { kind: 'line', a: [10, 300, 360], b: [10, 140, 170], look: [0, 0, -2] },
    { kind: 'line', a: [-300, 110, 120], b: [-90, 60, 60], look: [0, 0, 0] },
    { kind: 'orbit', c: [60, 0, 6], r: 170, h: 120, a0: 3.6, a1: 5.4 },
  ],
  sandbox: [
    { kind: 'line', a: [0, 340, 420], b: [0, 205, 300], look: [0, 0, -20] },
    { kind: 'orbit', c: [0, 0, -10], r: 300, h: 265, a0: 1.15, a1: 2.85 },
    { kind: 'line', a: [-320, 300, 300], b: [240, 220, 200], look: [0, 0, -10] },
    { kind: 'line', a: [300, 260, -260], b: [-200, 210, -60], look: [-20, 0, 0] },
    { kind: 'orbit', c: [-30, 0, -30], r: 250, h: 240, a0: 3.9, a1: 5.2 },
    { kind: 'line', a: [0, 380, 120], b: [0, 240, 40], look: [0, 0, 0] },
  ],
  standoff: [
    { kind: 'line', a: [-150, 66, 128], b: [62, 42, 92], look: [-20, 4, -12] },
    { kind: 'line', a: [-205, 92, 205], b: [-40, 52, 62], look: [-40, 4, -22] },
    { kind: 'orbit', c: [-40, 2, -16], r: 122, h: 72, a0: 2.9, a1: 4.4 },
    { kind: 'line', a: [200, 80, 150], b: [20, 46, 40], look: [-10, 2, -14] },
    { kind: 'line', a: [-90, 46, 60], b: [-40, 34, 24], look: [-30, 3, -18] },
    { kind: 'orbit', c: [10, 1, -6], r: 140, h: 84, a0: 0.8, a1: 2.4 },
  ],
  firechain: [
    { kind: 'follow', unit: 'hgFleet', off: [10, 22, -34] },
    { kind: 'orbit', c: [-42, 4, -11], r: 88, h: 42, a0: 0.5, a1: 2.3 },
    { kind: 'line', a: [-160, 70, 60], b: [-60, 92, 92], look: [-45, 6, -26] },
    { kind: 'follow', unit: 'hgFleet', off: [-16, 18, 30] },
    { kind: 'orbit', c: [-30, 6, -20], r: 74, h: 38, a0: 1.0, a1: 3.0 },
    { kind: 'line', a: [40, 84, 96], b: [-30, 110, 60], look: [-45, 6, -26] },
  ],
  landpursuit: [
    { kind: 'follow', unit: 'caoMain', off: [-36, 40, 42] },
    { kind: 'follow', unit: 'caoMain', off: [40, 34, -30] },
    { kind: 'line', a: [-180, 72, 22], b: [-262, 112, -52], look: [-240, 0, -36] },
    { kind: 'orbit', c: [-180, 0, -60], r: 120, h: 96, a0: 2.6, a1: 4.1 },
    { kind: 'line', a: [120, 60, 90], b: [-40, 52, -20], look: [-60, 0, -50] },
    { kind: 'follow', unit: 'liuArmy', off: [26, 34, 34] },
  ],
  // F / G / H 依赖落脚点（城关 / 案几 / 帐殿），故用函数生成镜头池。
};

/** 城池关隘：镜头对着该城，从高处接近 / 环绕。 */
function fortressCam([x, z]) {
  return [
    { kind: 'line', a: [x + 120, 150, z + 120], b: [x + 42, 62, z + 52], look: [x, 0, z] },
    { kind: 'orbit', c: [x, 0, z], r: 92, h: 62, a0: 2.5, a1: 4.05 },
    { kind: 'line', a: [x - 150, 180, z + 60], b: [x - 30, 70, z + 30], look: [x, 0, z] },
    { kind: 'orbit', c: [x, 0, z], r: 130, h: 96, a0: 3.7, a1: 5.3 },
    { kind: 'line', a: [x + 60, 220, z - 150], b: [x + 20, 90, z - 40], look: [x, 0, z] },
    { kind: 'line', a: [x + 200, 110, z + 170], b: [x + 70, 56, z + 70], look: [x, 2, z] },
  ];
}
/** 案前近景：低速掠过江岸 / 水面，卡片的背景（内容由卡片承载）。 */
function deskCam([x, z]) {
  return [
    { kind: 'line', a: [x + 96, 44, z - 34], b: [x + 60, 32, z - 8], look: [x + 40, 2, z + 14] },
    { kind: 'line', a: [x - 84, 36, z + 66], b: [x - 46, 28, z + 32], look: [x - 6, 2, z + 8] },
    { kind: 'orbit', c: [x, 2, z], r: 54, h: 30, a0: 3.35, a1: 4.7 },
    { kind: 'line', a: [x + 130, 70, z + 40], b: [x + 40, 34, z + 20], look: [x, 2, z] },
    { kind: 'line', a: [x - 30, 50, z - 70], b: [x - 10, 30, z - 20], look: [x + 10, 2, z + 6] },
    { kind: 'orbit', c: [x, 1, z], r: 78, h: 40, a0: 1.4, a1: 2.9 },
  ];
}
/** 营帐朝堂：夜间近景，环绕营寨 / 帐殿。 */
function campCam([x, z]) {
  return [
    { kind: 'orbit', c: [x, 1, z], r: 62, h: 34, a0: 3.4, a1: 4.75 },
    { kind: 'line', a: [x + 78, 42, z + 60], b: [x + 26, 26, z + 20], look: [x, 2, z] },
    { kind: 'line', a: [x - 90, 52, z + 30], b: [x - 30, 28, z + 10], look: [x, 2, z] },
    { kind: 'orbit', c: [x, 1, z], r: 92, h: 52, a0: 1.2, a1: 2.7 },
    { kind: 'line', a: [x + 40, 60, z - 80], b: [x + 14, 32, z - 24], look: [x, 2, z] },
    { kind: 'line', a: [x - 60, 34, z + 74], b: [x - 18, 24, z + 26], look: [x + 4, 2, z] },
  ];
}
/** 收束：拔高拉远。 */
function codaCam() {
  return [
    { kind: 'line', a: [-20, 92, 190], b: [40, 300, 400], look: [0, 0, -20] },
    { kind: 'line', a: [0, 84, 168], b: [0, 268, 420], look: [0, 0, 0] },
    { kind: 'line', a: [-120, 110, 240], b: [0, 320, 430], look: [10, 0, 0] },
  ];
}

/** 取该舞台的镜头池。firechain 的 follow 镜依赖 hgFleet 出现，已在 stageSet 保证。 */
function camPool(stage, anchor) {
  if (stage === 'fortress') return fortressCam(anchor);
  if (stage === 'desk') return deskCam(anchor);
  if (stage === 'camp') return campCam(anchor);
  if (stage === 'coda') return codaCam();
  return WIDE[stage] || WIDE.sandbox;
}

// ── 镜头语言：给单镜「加字段」而非加新 kind（引擎 director 读 ease/look2/fov/roll/h2）──
const dist3 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
// 推近镜只在「人物 / 地点 / 火攻」舞台用：这几种舞台本来就是一幕聚焦一件事，
// 推近读得出来；江面 / 沙盘 / 陆战追击是大幅横移的舞台，推近会跟横移打架、且几乎幕幕一样。
const PUSH_STAGES = ['desk', 'camp', 'fortress', 'firechain'];
/** 该幕「最明显的一个推近镜」的下标（终点/起点 到注视点的距离比最小者）；-1=无。 */
function pushShotIndex(shots, stage) {
  if (!PUSH_STAGES.includes(stage)) return -1;
  let pick = -1, best = 0.6;   // 比值 < 0.6 才算得上推近
  shots.forEach((s, i) => {
    if (s.kind !== 'line') return;
    const r = dist3(s.b, s.look) / (dist3(s.a, s.look) || 1);
    if (r < best) { best = r; pick = i; }
  });
  return pick;
}
/**
 * 缓动 / 注视点插值 / FOV 推近 / 侧倾。
 * - orbit 用 linear（环绕匀速，比 ease-in-out 更像稳定的摇臂）；line 推近用 out 且收 FOV。
 * - line 的 look2 沿运动方向轻扫 16 单位：镜头不再「对着一个死点平移」，画面会扫过战场。
 * - firechain 的跟拍加 2.4° 侧倾（火攻的斜角压迫感）。
 * - FOV 只给 pushIdx 那一个镜头（全幕至多一次推近，免得连续两镜都推、观感重复）。
 */
function cameraLang(s, i, count, stage, pushIdx) {
  if (s.kind === 'orbit') { s.ease = 'linear'; return s; }
  if (s.kind === 'follow') { if (stage === 'firechain') s.roll = i % 2 ? -2.4 : 2.4; return s; }
  if (i === pushIdx) { s.ease = 'out'; s.fov = 40; }
  else if (i === 0) s.ease = 'in';
  if (i === count - 1) s.ease = 'out';
  // 大幅横移的舞台注视点扫得远一点（真扫过战场），聚焦型舞台扫得近（不甩出主体）。
  const amp = PUSH_STAGES.includes(stage) ? 16 : 24;
  const vx = s.b[0] - s.a[0], vz = s.b[2] - s.a[2], L = Math.hypot(vx, vz) || 1;
  s.look2 = [s.look[0] + (vx / L) * amp, s.look[1], s.look[2] + (vz / L) * amp];
  return s;
}

// ── 每一幕的布署（set / march / combat）────────────────────────────

/** 依舞台给单位布署与行军线。reset:true 时每幕从干净世界起，故都要写明。 */
function stageSet(stage, dur) {
  const mv = d => Math.max(4, Math.min(16, Math.round(d * 0.42 * 10) / 10));
  switch (stage) {
    case 'river':
      return {
        set: {
          caoNavy: { visible: true, path: [[-300, 22], [-150, 6], [-30, -4]], dur: mv(dur) },
          sunFleet: { visible: true, path: [[300, -34], [190, -14], [110, -2]], dur: mv(dur) },
          liuFleet: { visible: true, path: [[176, -44], [146, -26]], dur: mv(dur) },
          hgFleet: { visible: false },
        },
        march: [{ pts: [[-300, 30], [-150, 8], [-30, -4]], fac: 'cao' }, { pts: [[300, -36], [120, -4]], fac: 'sun' }],
        featured: ['caoNavy', 'sunFleet'],
      };
    case 'standoff':
      return {
        set: {
          caoNavy: { visible: true, formation: 'tight', path: [[-200, -18], [-120, -22], [-52, -18]], dur: mv(dur) },
          sunFleet: { visible: true, path: [[126, 16], [64, 18], [32, 20]], dur: mv(dur) },
          liuFleet: { visible: true, path: [[172, -10], [120, 6]], dur: mv(dur) },
          campWulin: { visible: true }, campChibi: { visible: true },
        },
        march: [{ pts: [[-210, -20], [-60, -18]], fac: 'cao' }, { pts: [[140, 16], [36, 20]], fac: 'sun' }],
        combat: ['caoNavy', 'sunFleet'],
        featured: ['caoNavy', 'sunFleet'],
      };
    case 'firechain':
      return {
        set: {
          hgFleet: { visible: true, path: [[62, 26], [0, 10], [-40, -6]], dur: mv(dur) },
          caoNavy: { visible: true, state: 'burn' },
          sunFleet: { visible: true, path: [[112, 22], [42, 14]], dur: mv(dur) },
          liuFleet: { visible: true, path: [[152, 12], [62, 12]], dur: mv(dur) },
          campWulin: { visible: true, fire: 1 },
          wind: true,
        },
        march: [{ pts: [[62, 26], [-40, -6]], fac: 'sun' }],
        combat: ['caoNavy', 'sunFleet'],
        fx: fireFx(dur),
        featured: ['hgFleet', 'caoNavy'],
      };
    case 'landpursuit':
      return {
        set: {
          caoMain: { visible: true, path: [[-60, -60], [-110, -84], [-180, -66], [-240, -40]], dur: mv(dur) },
          liuArmy: { visible: true, path: [[120, 40], [60, 42], [30, 44]], dur: mv(dur) },
          caoNavy: { visible: false }, hgFleet: { visible: false },
          campWulin: { visible: true, smoke: 0.8 },
        },
        march: [{ pts: [[-60, -56], [-180, -66], [-240, -40]], fac: 'cao' }, { pts: [[120, 42], [30, 44]], fac: 'liu' }],
        featured: ['caoMain', 'liuArmy'],
      };
    case 'fortress':
      return {
        set: {
          caoMain: { visible: true }, liuArmy: { visible: true },
          caoNavy: { visible: true },
        },
        march: [{ pts: [[-250, -150], [-240, -44]], fac: 'cao' }],
        featured: ['caoMain', 'liuArmy'],
      };
    case 'sandbox':
      return {
        set: {
          caoMain: { visible: true }, liuArmy: { visible: true },
          caoNavy: { visible: true }, sunFleet: { visible: true }, liuFleet: { visible: true },
        },
        featured: ['caoMain', 'sunFleet'],
      };
    case 'desk':
      return {
        set: {
          caoNavy: { visible: true, path: [[-240, 6], [-180, 0]], dur: mv(dur) },
          sunFleet: { visible: true, path: [[250, -30], [210, -18]], dur: mv(dur) },
          caoMain: { visible: false }, liuArmy: { visible: false }, hgFleet: { visible: false },
        },
        featured: ['caoNavy', 'sunFleet'],
      };
    case 'camp':
      return {
        set: {
          campWulin: { visible: true }, campChibi: { visible: true },
          caoNavy: { visible: true }, sunFleet: { visible: true },
        },
        featured: ['caoNavy', 'sunFleet'],
      };
    case 'coda':
    default:
      return {
        set: {
          caoMain: { visible: true, path: [[-240, -100], [-250, -150]], dur: mv(dur) },
          sunFleet: { visible: true, path: [[-120, 6], [-200, 0]], dur: mv(dur) },
          liuArmy: { visible: true, path: [[80, 80], [60, 130]], dur: mv(dur) },
          hgFleet: { visible: false },
        },
        march: [{ pts: [[-240, -60], [-248, -140]], fac: 'cao' }, { pts: [[40, 46], [62, 128]], fac: 'liu' }],
        featured: ['caoMain', 'liuArmy'],
      };
  }
}

/** 火攻幕的 fx：点燃 + 烧营 + 火箭齐射，时点落在幕内前 2/3。 */
function fireFx(dur) {
  const t = f => Math.round(dur * f * 10) / 10;
  return [
    { at: t(0.10), type: 'ignite', unit: 'hgFleet' },
    { at: t(0.30), type: 'ignite', unit: 'caoNavy', shake: 2.2 },
    { at: t(0.34), type: 'campFire', camp: 'campWulin' },
    { at: t(0.34), type: 'volley', from: [-6, 6], to: [-44, -12], n: 60, fire: true },
    { at: t(0.48), type: 'volley', from: [-12, 2], to: [-50, -16], n: 60, fire: true },
    { at: t(0.62), type: 'volley', from: [-30, -2], to: [-58, -20], n: 50, fire: true },
  ];
}

/** 水战／火攻的额外粒子（splash 水花 / spray 水柱 / embers 灰烬 / debris 木屑）。
    时点铺在幕内，与 fireFx／事件卡错开；引擎侧位置由 CPU 积分，种子计数器化(on 逐帧可复现)。 */
function stageFx(stage, dur) {
  const t = f => Math.round(dur * f * 10) / 10;
  if (stage === 'river' || stage === 'standoff') {
    const out = [
      { at: t(0.12), type: 'splash', from: [-140, 2], n: 46, speed: 9 },
      { at: t(0.46), type: 'splash', from: [120, -6], n: 42, speed: 8 },
    ];
    if (dur > 26) out.push({ at: t(0.74), type: 'splash', from: [-60, 0], n: 40, speed: 8 });
    return out;
  }
  if (stage === 'firechain') {
    return [
      { at: t(0.36), type: 'embers', unit: 'hgFleet', n: 80, speed: 7 },
      { at: t(0.52), type: 'debris', from: [-46, -14], n: 60, speed: 11 },
      { at: t(0.66), type: 'embers', unit: 'caoNavy', n: 90, speed: 8 },
      { at: t(0.78), type: 'spray', from: [-40, -10], n: 50, speed: 13 },
    ];
  }
  return [];
}

// ── 事件卡（地图小卡）：从 scene/engine 的「」引文与地标自动抽取 ──────

/** 取文本里「」『』“” 内的短语当卡片文案。 */
function quotes(...strs) {
  const out = [];
  for (const s of strs || []) {
    if (!s) continue;
    for (const m of String(s).matchAll(/[「『“"]([^」』”"]{2,34})[」』”"]/g)) out.push(m[1].trim());
  }
  return out;
}

/** 括号里以 /、· 并列的清单逐项成卡（分镜表常用「（草船借箭/借东风/华容道放曹操）」列画面元素）。 */
function listed(...strs) {
  const out = [];
  for (const s of strs || []) {
    if (!s) continue;
    for (const m of String(s).matchAll(/[（(]([^）)]{4,48})[）)]/g)) {
      const parts = m[1].split(/[/、·]/).map(x => x.trim()).filter(x => x.length >= 2 && x.length <= 16);
      if (parts.length >= 2) out.push(...parts);
    }
  }
  return out;
}
/** 文本里最先出现的地标 → 世界座标。 */
function anchorOf(text, fallback) {
  for (const k of Object.keys(LANDMARKS)) if (text.includes(k)) return LANDMARKS[k];
  return fallback || LANDMARKS.赤壁;
}

/** 镜头落脚点：城关跟着该城；案前/营帐用江心（卡片内容才是主体）；其余舞台用固定镜位。 */
function cameraAnchor(stage, act) {
  if (stage === 'fortress') return LANDMARKS[placeOf(act.env)] || anchorOf([act.scene, act.engine].join(' '), LANDMARKS.荆州);
  if (stage === 'desk' || stage === 'camp') return LANDMARKS.长江;
  if (stage === 'sandbox' || stage === 'coda') return LANDMARKS.沙盘;
  return LANDMARKS.赤壁;
}

/**
 * 事件卡：优先用引文（最贴旁白），不足补 engine 关键词。
 * declutterEvents 每帧对每张卡 getBoundingClientRect → 每幕最多 3 张。
 */
function extractEvents(act, dur, stage) {
  const blob = [act.scene, act.engine].filter(Boolean).join(' ');
  const tag = act.tag === '演义' ? '演义' : '史';
  const items = [...listed(act.scene, act.engine), ...quotes(act.scene, act.engine)];
  const uniq = [...new Set(items)].filter(t => t && !/^(演义|正史|史|计|文化)$/.test(t)).slice(0, 3);
  // 案前/营帐幕的卡片是抽象辨析，落到故事中心而非文中偶然提到的地标。
  const box = (stage === 'desk' || stage === 'camp') ? LANDMARKS.赤壁 : anchorOf(blob, LANDMARKS.赤壁);
  const n = uniq.length || 1;
  return (uniq.length ? uniq : [act.title]).slice(0, 3).map((t, i) => ({
    at: Math.round(dur * (0.18 + 0.28 * i) * 10) / 10,
    x: box[0] + (i - (n - 1) / 2) * 34,
    z: box[1] + (i - (n - 1) / 2) * 22,
    t,
    tag,
  }));
}

/** 演义辨析幕才给大卡（每幕至多一张，引擎 7.5s 后自动收）。 */
function stratFor(act) {
  if (act.tag !== '演义') return undefined;
  return {
    at: 1.5,
    name: act.title,
    by: '罗贯中《三国演义》',
    tag: '演义',
    desc: act.scene || act.title,
  };
}

// ── 叙事卡（引文／时间线／风玫瑰／信笺／印章）──────────────────────
// 分镜表的 scene/engine 里已经写明该幕要哪张卡（「引文大字卡」「风玫瑰图」「盖章动效」
// 「信笺特写」「时间线卡」）与被引的原句。这里把它翻成 cards 阵列：每幕至多 2 张，
// 时点优先贴「旁白真的念到这句」的那一行（quoteTime），否则退回幕内分数的停顿时点。
// 卡位（slot）由舞台决定，避开左下的情报栏、右上的主帅栏与底部字幕／时间轴。

const clampv = (v, a, b) => Math.max(a, Math.min(b, v));
/** 去掉标点与空白，用于把引文和旁白逐句文本对齐。 */
const bare = s => String(s || '').replace(/[\p{P}\p{S}\s]/gu, '');

/** 把时点贴到最近的旁白停顿中点；无 lines 时原样返回。 */
function snapToGap(t, dur, lines) {
  const ls = (lines || []).filter(l => typeof l.t === 'number' && typeof l.end === 'number');
  let best = t, bestD = 1.5;
  for (let i = 0; i + 1 < ls.length; i++) {
    if (ls[i + 1].t - ls[i].end < 0.06) continue;          // 句中无停顿
    const mid = (ls[i].end + ls[i + 1].t) / 2;
    if (Math.abs(mid - t) < bestD) { bestD = Math.abs(mid - t); best = mid; }
  }
  return Math.round(clampv(best, 0.2, Math.max(0.3, dur - 0.4)) * 10) / 10;
}

/** 引文卡时点＝旁白念到这句的那一行；对齐不上就用 fallback（幕内分数点）。 */
function quoteTime(q, dur, lines, fallback) {
  const key = bare(q);
  if (key.length >= 2) {
    const ls = lines || [];
    for (const l of ls) if (bare(l.text).includes(key)) return Math.round(clampv(l.t, 0.2, dur - 0.4) * 10) / 10;
    for (const l of ls) if (key.includes(bare(l.text)) && bare(l.text).length >= 3) return Math.round(clampv(l.t, 0.2, dur - 0.4) * 10) / 10;
  }
  return snapToGap(fallback, dur, lines);
}

/** 引文卡能用的句子：排掉时间标签（「两年后·三十六岁」）、角标词（「演义」「待验」）。 */
const CARD_STOPWORD = /^(演义|正史|史|计|文化|待验|张冠李戴|未加强|小说戏曲印象)$/;
const SENTENCE = /[，。！？；：、…—]/;
/** strict=true 时要求「像句子的文言」；分镜表点名「引文」的句子可放宽到 2 字（如「风盛猛」）。 */
function quotable(q, strict) {
  if (!q || q.length < (strict ? 5 : 2)) return false;
  if (/(后·|^[〇○一二三四五六七八九十百千两\d]+[年月日岁])/.test(q)) return false;
  if (CARD_STOPWORD.test(q)) return false;
  return strict ? SENTENCE.test(q) : true;
}
/**
 * 引文卡的正文（可多句＝「引文连击」）。分镜表点名「引文」的那一幕，取紧随其后、同一小段里的
 * 所有「」原句（如第32幕「风盛猛」「火烈风猛」「烟炎张天」）；没点名就只认「像句子的文言」。
 */
function pickQuotes(act, max = 2) {
  // 引文写在 scene 里（engine 里跟着的常是字幕）；「」有时也用作水印（如「小说戏曲印象」），故须过 quotable。
  const blobs = [act.scene, act.engine].filter(Boolean);
  const named = blobs.some(s => /引文/.test(s));
  const out = [];
  for (const s of blobs) {
    const i = s.indexOf('引文'); if (i < 0) continue;
    for (const q of quotes(s.slice(i).split(/[；;]/)[0])) if (quotable(q, false) && !out.includes(q)) out.push(q);
  }
  if (!out.length) for (const s of blobs) for (const q of quotes(s)) if (quotable(q, !named) && !out.includes(q)) out.push(q);
  return out.slice(0, max);
}
/** 信笺卡没写落款时，用兜底正文（同样要过 quotable）。 */
function proseQuote(act) {
  return quotes(act.scene, act.engine).find(q => quotable(q, false)) || '';
}

/** 时间线条目：优先取首段的「A/B/C」并列清单，否则用各分号段。 */
function splitYear(s) {
  // 只认「七月／两年后／三十六岁」这类带数量词的时间前缀；裸「后」会把
  // 「船尾拴小快船留后路」误切两段，故后缀必须跟着数量词一起匹配。
  const m = s.match(/^([〇○一二三四五六七八九十百千两\d]{1,3}(?:年|月|日|岁|载)[后时初末]?)/);
  if (m && m[1].length < s.length) return [m[1], s.slice(m[1].length).replace(/^[，,、\s]+/, '').slice(0, 18)];
  return ['', s.slice(0, 18)];
}
const TIMELINE_DROP = /引文|事件卡|字幕|角标|小图|示意|特效|氛围|快闪|印章|字卡|卡片|动画/;
function timelineItems(act) {
  const unwrap = t => t.replace(/[「『“"]([^」』”"]*)[」』”"]/g, '$1');     // 「锁二乔」打叉 → 锁二乔打叉
  const segs = String(act.scene || '').split(/[；;]/)
    .map(t => unwrap(t).replace(/^[^：:]{0,8}[：:]/, '').trim())
    .filter(t => t.length >= 2);
  const first = (segs[0] || '').split(/[/、]/).map(t => t.trim()).filter(t => t.length >= 2);
  const items = (first.length >= 2 ? first : segs).filter(t => !TIMELINE_DROP.test(t));
  const out = items.slice(0, 4).map(splitYear);
  return out.length >= 2 ? out : [];
}

/**
 * 信笺卡的落款与印文（scene 只有画面描述，正文/落款要补）。
 * 按该幕文案关键词匹配，不绑幕号：会猎信 / 黄盖诈降书 / 曹操报孙权书 三种。
 * @returns {text,sig,seal} 或 null（无信笺幕）
 */
function letterFor(act) {
  const S = [act.scene, act.engine, act.title].filter(Boolean).join(' ');
  if (/复信|值有疾病|烧船自退/.test(S)) return { text: '值有疾病，孤烧船自退，横使周瑜虚获此名', sig: '— 曹操报孙权书', seal: '曹' };
  if (/诈降信|诈降书|归降/.test(S)) return { text: '盖受孙氏厚恩，愿率众归降', sig: '— 黄盖诈降书', seal: '盖' };
  if (/会猎|八十万众/.test(S)) return { text: '今治水军八十万众，方与将军会猎于吴', sig: '— 曹操致孙权书', seal: '曹' };
  return null;
}

/**
 * 逐幕叙事卡：分镜表说该幕要什么卡，就给什么卡（至多 2 张）。
 * @returns [{kind, at, life, slot, ...}]  kind ∈ windrose|timeline|letter|seal|quote
 */
export function extractCards(act, dur, stage, lines) {
  const S = [act.scene, act.engine].filter(Boolean).join(' ');
  // 案前／营帐／城池幕的世界是近景，卡片让到左中；江面／沙盘幕卡片占正中。
  const main = (stage === 'desk' || stage === 'camp' || stage === 'fortress') ? 'L' : 'C';
  const alt = 'U';
  const out = [];
  // 卡的存活时长：按幕长比例，但封顶 11 秒、且绝不越过幕尾（否则引擎已切幕还在画）。
  const span = (at, f) => Math.round(Math.min(dur * f, 11, Math.max(1.2, dur - at - 0.25)) * 10) / 10;
  const AT = f => snapToGap(dur * f, dur, lines);

  // 分镜表常在一幕里同时写「信笺特写」和「时间轴」；逐个试，取第一个成立的。
  // 盖章（演义/史辨析）排在信笺前：辨析幕的文案里会顺带提「诈降信」，不该因此被当成信笺幕。
  const builders = [
    () => /风玫瑰/.test(S) && { kind: 'windrose', title: '冬月长江风向', bearing: 135,
      caption: '常年西北风・那一夜忽转东南', at: AT(0.12), slot: main },
    () => /盖章|印章|盖戳|盖「(?:演义|史|计|待验)」/.test(S) && { kind: 'seal',
      text: act.tag === '演义' ? '演义' : (/计/.test(S) ? '计' : '史'), caption: act.title,
      at: AT(0.16), slot: 'R' },
    () => /信笺|书信|信件|诈降信|密信|复信/.test(S) && (() => {
      const L = letterFor(act) || {};
      return { kind: 'letter', text: L.text || proseQuote(act) || act.title, sig: L.sig || act.section || '',
        seal: L.seal || '印', at: AT(0.10), slot: main };
    })(),
    () => {
      if (!/时间线|时间轴|四条|四连弹|四软肋|清单|逐条打勾/.test(S)) return null;
      const items = timelineItems(act);
      return items.length >= 2 && { kind: 'timeline', title: act.title, items, at: AT(0.10), slot: main };
    },
  ];
  for (const build of builders) { const c = build(); if (c) { out.push({ ...c, life: span(c.at, 0.6) }); break; } }

  const first = out[0];
  // 信笺卡的正文本身就是那句引文，再挂一张引文卡就是重字。
  const dupQ = q => first && first.text && bare(first.text).includes(bare(q));
  const qs = pickQuotes(act, 2).filter(q => q && !dupQ(q));
  // 引文卡逐句排（「引文连击」前后两句）：至少让主卡亮相过半引文才进；每张上界留 4.2s。
  // 两张卡落在同一竖列（C 压 U），故前一张在下一张进场前 0.4s 收起，杜绝互压。
  let cursor = first ? first.at + Math.min(first.life * 0.55, 4) : dur * 0.14;
  const placed = qs.map(q => {
    let at = quoteTime(q, dur, lines, dur * (first ? 0.55 : 0.16));
    if (at < cursor) at = snapToGap(cursor, dur, lines);
    at = Math.round(clampv(at, 0.2, Math.max(0.3, dur - 4.2)) * 10) / 10;
    cursor = at + 2.5;
    return { q, at };
  }).slice(0, Math.max(0, 2 - out.length));
  placed.forEach(({ q, at }, i) => {
    const next = placed[i + 1], natural = span(at, first ? 0.42 : 0.62);
    const life = next ? Math.max(2, Math.min(natural, next.at - at - 0.4)) : natural;
    out.push({ kind: 'quote', text: q, src: [act.section, act.tag].filter(v => v && v !== '—').join('・'),
      vert: Array.from(q).length <= 14, at, life: Math.round(life * 10) / 10, slot: out.length ? alt : main });
  });
  return out.slice(0, 2);
}

// ── 逐幕战况（右下角势力面板）──────────────────────────────────────
// 兵力字串、百分比、状态短语按「卷」取（分镜表各卷叙述）；不再按幕号写死 1..46 的表，
// 因此改幕数 / 重排幕都无需维护。卷名对不上时退回「按全局进度单调下行」的兜底。
const POWER_BY_SECTION = {
  '序·开场':      { cao: ['约 200,000+（号称八十万）', 100, '南下江东・兵锋正盛'], sun: ['30,000', 15, '据有江东・整军'], liu: ['约 20,000（含刘琦）', 10, '退保夏口・待援'] },
  '卷一·起势':    { cao: ['约 200,000+（号称八十万）', 100, '尽得荆州水师'], sun: ['30,000', 15, '联刘抗曹'], liu: ['约 20,000（含刘琦）', 10, '合兵樊口'] },
  '卷二·隔江布阵': { cao: ['约 200,000', 90, '远来疲弊・军中疫起'], sun: ['30,000', 15, '谋破连舰'], liu: ['约 20,000', 12, '南岸并进'] },
  '卷三·火攻':    { cao: ['约 200,000', 60, '连舰被火・水陆大溃'], sun: ['30,000', 15, '雷鼓大进'], liu: ['约 20,000', 15, '水陆合围'] },
  '卷四·复盘':    { cao: ['折损过半', 40, '大疫・败归北方'], sun: ['30,000', 15, '围攻江陵'], liu: ['约 20,000', 18, '进取荆南'] },
  '卷五·余韵':    { cao: ['残部北撤', 28, '退守北方'], sun: ['30,000', 15, '据有江陵'], liu: ['扩编中', 22, '鼎足之势'] },
};
function powerFor(act, total) {
  const row = POWER_BY_SECTION[act.section || ''];
  if (row) return { cao: [...row.cao], sun: [...row.sun], liu: [...row.liu] };
  const p = total > 1 ? (act.no - 1) / (total - 1) : 0;   // 兜底：全局进度，曹军满血 → 残破
  return {
    cao: ['—', Math.round(100 - 72 * p), '—'],
    sun: ['—', 15, '—'],
    liu: ['—', Math.round(10 + 12 * p), '—'],
  };
}

// ── 镜头时长：按旁白停顿切分 ────────────────────────────────────────

/**
 * 把 act.dur 切成 count 段：切点尽量落在旁白停顿上，但每个切点限制在各自的均分窗口内，
 * 免得多个切点挤在一处（会出现一段 25 秒一动不动、另一段 3 秒的畸形分镜）。
 * 保证 Σ durs == dur（末段吸收舍入误差），切点升序。
 */
export function splitDurations(dur, lines, count) {
  const n = Math.max(1, count | 0);
  if (n === 1) return [dur];
  const step = dur / n;
  const ls = (lines || []).filter(l => typeof l.t === 'number' && typeof l.end === 'number');
  const gaps = [];
  for (let i = 0; i + 1 < ls.length; i++) {
    const g = ls[i + 1].t - ls[i].end;
    const mid = (ls[i].end + ls[i + 1].t) / 2;
    if (g > 0.02 && mid > 0.3 && mid < dur - 0.3) gaps.push({ g, mid });
  }
  const cuts = [];
  for (let k = 1; k < n; k++) {
    const target = step * k;
    let best = target, bestScore = -Infinity;
    for (const { g, mid } of gaps) {
      if (Math.abs(mid - target) > step * 0.45) continue;                       // 只在窗口内找
      if (cuts.some(c => Math.abs(c - mid) < step * 0.5)) continue;             // 每窗口至多一个切点
      const score = g - Math.abs(mid - target) * 0.15;
      if (score > bestScore) { bestScore = score; best = mid; }
    }
    cuts.push(best);
  }
  cuts.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < n; i++) out.push((i === n - 1 ? dur : cuts[i]) - (i ? cuts[i - 1] : 0));
  const rounded = out.map(x => Math.round(x * 1000) / 1000);
  const drift = dur - rounded.reduce((s, x) => s + x, 0);
  rounded[rounded.length - 1] = Math.round((rounded[rounded.length - 1] + drift) * 1000) / 1000;
  return rounded;
}

/** 镜头数：短幕 2、中幕 3、长幕 4。 */
function shotCount(dur) {
  if (dur < 17) return 2;
  if (dur < 33) return 3;
  return 4;
}

// ── 主函数 ────────────────────────────────────────────────────────

/**
 * 把分镜表一幕翻成引擎字段。
 * @param act 分镜表 act（no/section/title/env/scene/engine/tag）
 * @param ctx {dur, lines, index, total}
 * @returns {stage, env, title, era, key, featured, shots, set, fx, events, strat, march, combat, baseline}
 */
export function artDirect(act, ctx = {}) {
  const no = act.no ?? ctx.index + 1;
  const total = ctx.total ?? 30;
  const dur = Number(ctx.dur) > 0 ? Number(ctx.dur) : (Number(act.est_sec) || 20);
  const stage = stageFor(act, total);
  const env = envFor(act.env, stage);
  const anchor = cameraAnchor(stage, act);

  const pool = camPool(stage, anchor);
  const count = shotCount(dur);
  const start = (no - 1) % pool.length;   // 幕号轮转起始镜，避免同舞台相邻幕用同一序列
  const moves = Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
  const durs = splitDurations(dur, ctx.lines, count);
  const pushIdx = pushShotIndex(moves.map((m, i) => ({ ...m, dur: durs[i] })), stage);
  const shots = moves.map((m, i) => cameraLang({ ...m, dur: durs[i] }, i, count, stage, pushIdx));

  const base = stageSet(stage, dur);
  const fxList = [...(base.fx || []), ...stageFx(stage, dur)];
  const fx = fxList.length ? fxList : undefined;

  // 大卡抢眼，同幕的小事件卡让位：① 文案已在大卡上出现的事件卡直接去掉（同句既当引文卡又当地图小卡＝重字）；
  // ② 再去到「有 2 张大卡留 1 张小卡、1 张留 2 张」。
  const cards = extractCards(act, dur, stage, ctx.lines);
  const events = extractEvents(act, dur, stage);
  if (cards.length) {
    const cardTexts = cards.map(c => bare(c.text || '')).filter(t => t.length >= 2);
    const kept = events.filter(e => { const bt = bare(e.t); return !cardTexts.some(t => t === bt || t.includes(bt) || bt.includes(t)); });
    events.length = 0;
    events.push(...kept.slice(0, cards.length >= 2 ? 1 : 2));
  }

  return {
    stage, stageLabel: STAGE_LABEL[stage], env,
    key: `第${no}幕`, era: act.section || '', title: act.title,
    power: powerFor(act, total),
    featured: base.featured,
    shots,
    set: base.set,
    march: base.march,
    combat: base.combat,
    fx,
    cards,
    events,
    strat: stratFor(act),
    baseline: [],
  };
}

/** 覆盖自检：1..total 每一幕都要有舞台归属（纯资料断言，不抛则代表全覆盖）。 */
export function coverage(plan) {
  const total = plan.acts.length;
  const rows = plan.acts.map(a => {
    const stage = stageFor(a, total);
    return { no: a.no, env: a.env, stage, label: STAGE_LABEL[stage] };
  });
  const missing = rows.filter(r => !STAGES.includes(r.stage));
  const tally = {};
  for (const r of rows) tally[r.stage] = (tally[r.stage] || 0) + 1;
  return { rows, missing, tally, total };
}

const { pathToFileURL, fileURLToPath: _f2u } = await import('node:url');
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const mapFile = path.join(ROOT, 'tools/chibi-film-map.json');
  const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  const plan = JSON.parse(fs.readFileSync(path.resolve(path.dirname(mapFile), map.source, '分镜表.json'), 'utf8'));
  const { rows, missing, tally, total } = coverage(plan);
  console.log(`舞台覆盖 ${rows.length}/${total} 幕；缺归属 ${missing.length}`);
  console.log('分布：', Object.entries(tally).map(([k, v]) => `${STAGE_LABEL[k]}×${v}`).join('  '));
  if (missing.length) { console.error('未归属幕：', missing); process.exit(1); }
  const kinds = {};
  for (const a of plan.acts) {
    const cs = extractCards(a, Number(a.est_sec) || 20, stageFor(a, total), []);
    for (const c of cs) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    console.log(`  第${String(a.no).padStart(2)}幕 ${String(a.env || '—').padEnd(12)} → ${STAGE_LABEL[stageFor(a, total)]}` +
      (cs.length ? `  ｜ 卡：${cs.map(c => c.kind).join('+')}` : ''));
  }
  console.log('卡片分布：', Object.entries(kinds).map(([k, v]) => `${k}×${v}`).join('  ') || '（无）');
}
