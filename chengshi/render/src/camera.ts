import type {Terrain} from './types';
import {sampleHeight} from './terrain';
import {smoothstep} from './theme';

export type Vec3 = [number, number, number];

/**
 * 一章一镜：掠地接近 → 环绕地标 → 拉升收尾。
 * 方位角 0=正北，顺时针；相机放在 focus 的该方位。
 */
export type ShotSpec = {
  id: string;
  focus: [number, number]; // 焦点经纬度
  focusAlt: number;        // 目标点离地高度（塔身中段等）
  yaw0: number;            // 起始方位角（度）
  sweep: number;           // 环绕扫过角度（度，负数反向）
  skimDist: number;        // 掠近阶段与焦点距离
  skimAlt: number;         // 掠近离地高度
  orbitR: number;
  orbitAlt: number;
  pullR: number;
  pullAlt: number;
  fovSkim?: number;
  fovOrbit?: number;
  fovPull?: number;
  pullAim?: [number, number]; // 拉升阶段的注视点（默认仍是 focus）
  hold?: number;              // 进度到此冻结（片尾定格）
  seg?: [number, number, number, number]; // 本镜三段关键帧的时间占比，默认 [0,0.42,0.72,1]
};

/** 11 章机位（与 timeline.eras 顺序一一对应） */
export const CHAPTER_SHOTS: ShotSpec[] = [
  {
    id: 'lake',
    focus: [120.42, 31.235],
    focusAlt: 0,
    yaw0: 262,
    sweep: 12,
    skimDist: 8500,
    skimAlt: 75,
    orbitR: 5200,
    orbitAlt: 260,
    pullR: 12000,
    pullAlt: 1100,
    fovSkim: 34,
    fovOrbit: 36,
    fovPull: 40,
  },
  {
    id: 'panmen',
    focus: [120.6119, 31.2895],
    focusAlt: 14,
    yaw0: 232,
    sweep: 46,
    skimDist: 2200,
    skimAlt: 80,
    orbitR: 800,
    orbitAlt: 150,
    pullR: 3000,
    pullAlt: 900,
    fovSkim: 30,
    fovOrbit: 34,
    fovPull: 38,
  },
  {
    id: 'kuaiji',
    focus: [120.6225, 31.3095],
    focusAlt: 8,
    yaw0: 254,
    sweep: 38,
    skimDist: 2000,
    skimAlt: 65,
    orbitR: 700,
    orbitAlt: 120,
    pullR: 3200,
    pullAlt: 850,
  },
  {
    id: 'suzhou-name',
    focus: [120.6095, 31.3025],
    focusAlt: 10,
    yaw0: 244,
    sweep: 42,
    skimDist: 2300,
    skimAlt: 75,
    orbitR: 750,
    orbitAlt: 130,
    pullR: 3200,
    pullAlt: 900,
  },
  {
    id: 'shantang',
    focus: [120.5764, 31.338],
    focusAlt: 22,
    yaw0: 246,
    sweep: 60,
    skimDist: 2200,
    skimAlt: 80,
    orbitR: 700,
    orbitAlt: 140,
    pullR: 3000,
    pullAlt: 1000,
  },
  {
    id: 'pingjiang',
    focus: [120.6154, 31.3245],
    focusAlt: 42,
    yaw0: 236,
    sweep: 55,
    skimDist: 1900,
    skimAlt: 70,
    orbitR: 620,
    orbitAlt: 120,
    pullR: 2800,
    pullAlt: 900,
  },
  {
    id: 'garden',
    focus: [120.6245, 31.326],
    focusAlt: 6,
    yaw0: 228,
    sweep: 46,
    skimDist: 1600,
    skimAlt: 60,
    orbitR: 550,
    orbitAlt: 90,
    pullR: 2600,
    pullAlt: 750,
  },
  {
    id: 'hanshan',
    focus: [120.5667, 31.3074],
    focusAlt: 10,
    yaw0: 252,
    sweep: 48,
    skimDist: 2200,
    skimAlt: 75,
    orbitR: 650,
    orbitAlt: 110,
    pullR: 3000,
    pullAlt: 850,
  },
  {
    id: 'port',
    focus: [120.6119, 31.2895],
    focusAlt: 12,
    yaw0: 214,
    sweep: -54,
    skimDist: 2500,
    skimAlt: 90,
    orbitR: 850,
    orbitAlt: 170,
    pullR: 3400,
    pullAlt: 1100,
  },
  {
    id: 'park',
    focus: [120.6736, 31.3187],
    focusAlt: 110,
    yaw0: 264,
    sweep: 16,
    skimDist: 4000,
    skimAlt: 240,
    orbitR: 3000,
    orbitAlt: 520,
    pullR: 4600,
    pullAlt: 1650,
  },
  {
    id: 'rings',
    focus: [120.6734, 31.3164],
    focusAlt: 90,
    yaw0: 246,
    sweep: 34,
    skimDist: 2400,
    skimAlt: 360,
    orbitR: 1500,
    orbitAlt: 450,
    pullR: 22000,
    pullAlt: 4200,
    fovSkim: 34,
    fovOrbit: 38,
    fovPull: 46,
    pullAim: [120.62, 31.31],
    hold: 1.0,
    seg: [0, 0.34, 0.56, 1],
  },
];

export type CamState = {
  pos: Vec3;
  target: Vec3;
  fov: number;
  /** 低空镜头要收近裁剪面，否则脚下 500m 内的地面被直接剪掉 */
  near?: number;
  far?: number;
};

const D2R = Math.PI / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 城市级一镜到底：固定俯瞰老城中心，长焦 ~30° */
export const CITY_VIEW = {
  center: [120.6185, 31.3051] as [number, number],
  fov: 30,
  tiltDeg: 56, // 相机俯角（相对水平面）
};

const lonlatToXZ = (lon: number, lat: number, origin: [number, number]): [number, number] => {
  const coslat = Math.cos(origin[1] * D2R);
  return [(lon - origin[0]) * 111320 * coslat, -(lat - origin[1]) * 110540];
};

/** 标准 Catmull-Rom：u 是 p1→p2 段内的 0..1 参数 */
const cr = (p0: number, p1: number, p2: number, p3: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
  );
};

/** 4 个关键帧、不等段落 [0, a, b, 1] 的 Catmull-Rom 取样 */
const SEG = [0, 0.42, 0.72, 1];

const sampleKeys = (keys: Vec3[], p: number, seg: number[] = SEG): Vec3 => {
  let k = 0;
  if (p >= seg[2]) k = 2;
  else if (p >= seg[1]) k = 1;
  const u = clamp01((p - seg[k]) / (seg[k + 1] - seg[k]));
  const a = keys[Math.max(0, k - 1)];
  const b = keys[k];
  const c = keys[k + 1];
  const d = keys[Math.min(3, k + 2)];
  return [
    cr(a[0], b[0], c[0], d[0], u),
    cr(a[1], b[1], c[1], d[1], u),
    cr(a[2], b[2], c[2], d[2], u),
  ];
};

export const shotAt = (
  spec: ShotSpec,
  origin: [number, number],
  terrain: Terrain,
  progress: number,
  time: number,
): CamState => {
  const p = Math.min(spec.hold ?? 1, clamp01(progress));
  const [fx, fz] = lonlatToXZ(spec.focus[0], spec.focus[1], origin);
  const fg = sampleHeight(terrain, fx, fz);
  const fy = fg + spec.focusAlt;
  const focus: Vec3 = [fx, fy, fz];

  const yaw0 = spec.yaw0 * D2R;
  const sweep = spec.sweep * D2R;
  const posAt = (a: number, r: number, alt: number): Vec3 => {
    const x = fx + Math.sin(a) * r;
    const z = fz + Math.cos(a) * r;
    // 近景克制：除「年轮」拉升章与序章湖面外，低空贴地镜头统一抬到 200m 以上，
    // 远景出大片感，近景才暴露 OSM 拉伸体的简。
    const minAlt = spec.id === 'rings' ? alt : spec.id === 'lake' ? alt : Math.max(alt, 200);
    return [x, sampleHeight(terrain, x, z) + minAlt, z];
  };

  const P: Vec3[] = [
    posAt(yaw0, spec.skimDist, spec.skimAlt),
    posAt(yaw0 + sweep * 0.3, spec.orbitR, spec.orbitAlt),
    posAt(yaw0 + sweep * 0.7, spec.orbitR * 1.1, spec.orbitAlt * 1.1),
    posAt(yaw0 + sweep, spec.pullR, spec.pullAlt),
  ];

  // 掠近时视线投向焦点的前方（地标从画面下方入画），其余阶段锁焦点
  const T0: Vec3 = [
    P[0][0] + (focus[0] - P[0][0]) * 0.55,
    fy,
    P[0][2] + (focus[2] - P[0][2]) * 0.55,
  ];
  let pull: Vec3 = focus;
  if (spec.pullAim) {
    const [ax, az] = lonlatToXZ(spec.pullAim[0], spec.pullAim[1], origin);
    pull = [ax, sampleHeight(terrain, ax, az) + 20, az];
  }
  const T: Vec3[] = [T0, focus, focus, pull];

  const keys = [P[0], P[1], P[2], P[3]];
  const tkeys = [T[0], T[1], T[2], T[3]];
  const seg = spec.seg ?? SEG;
  const pos = sampleKeys(keys, p, seg);
  const target = sampleKeys(tkeys, p, seg);

  const f0 = spec.fovSkim ?? 32;
  const f1 = spec.fovOrbit ?? 37;
  const f2 = spec.fovPull ?? 41;
  const fov = sampleKeys(
    [
      [f0, 0, 0],
      [f1, 0, 0],
      [f1 + (f2 - f1) * 0.5, 0, 0],
      [f2, 0, 0],
    ],
    p,
    seg,
  )[0];

  // 轻微手持浮动（米级），避免轨道机位太"机器"
  pos[0] += Math.sin(time * 0.63) * 6;
  pos[1] += Math.sin(time * 0.51 + 1.3) * 3.5;
  pos[2] += Math.cos(time * 0.57 + 0.4) * 5;
  target[0] += Math.sin(time * 0.41 + 2.1) * 2.5;
  target[2] += Math.cos(time * 0.47 + 0.8) * 2;

  // 掠地阶段的机位只有几十米高，near=500 会把脚下地面整片剪掉
  const alt = pos[1] - sampleHeight(terrain, pos[0], pos[2]);
  const near = alt < 800 ? 10 : alt < 2000 ? 60 : alt < 5000 ? 300 : 500;
  const far = alt < 800 ? 60000 : alt < 2000 ? 120000 : alt < 5000 ? 180000 : 260000;

  return {pos, target, fov, near, far};
};

/**
 * 正片全片运镜：
 * 0–30 s 完全沿用已审样片航线（opening），保证样片与正片首段一致；
 * 30 s 之后按 CHAPTER_SHOTS 每章一套「掠近→环绕→拉升」，
 * 章节交界用约 1.2 s 的上抛弧线过渡，不做硬切。
 */
export const makeFilmCamera = (
  opening: (t: number) => CamState,
  eras: {t0: number; t1: number}[],
  origin: [number, number],
  terrain: Terrain,
): ((t: number) => CamState) => {
  const HANDOFF = 30; // 样片航线交接时刻
  const H_IN = 1.6;
  const H_OUT = 2.4;
  const X_IN = 1.5;
  const X_OUT = 2.2;

  const chapterCam = (i: number, t: number): CamState => {
    const era = eras[i];
    const raw = clamp01((t - era.t0) / (era.t1 - era.t0 || 1));
    // 缓起缓停：章内前 18% 做 smoothstep 缓起，后 12% 做缓停，中段线性。
    // 一镜到底不等于匀速，缓起缓停才有呼吸感；收尾的弧线过渡由交界处负责。
    const p =
      raw < 0.18
        ? smoothstep(0, 0.18, raw) * 0.18
        : raw > 0.88
          ? 0.18 + (1 - smoothstep(0.88, 1, raw)) * (1 - 0.18)
          : 0.18 + ((raw - 0.18) / 0.7) * (1 - 0.18);
    return shotAt(CHAPTER_SHOTS[i], origin, terrain, Math.min(1, p), t);
  };

  const mix = (a: CamState, b: CamState, w: number): CamState => {
    const u = smoothstep(0, 1, clamp01(w));
    const pos: Vec3 = [
      a.pos[0] + (b.pos[0] - a.pos[0]) * u,
      a.pos[1] + (b.pos[1] - a.pos[1]) * u,
      a.pos[2] + (b.pos[2] - a.pos[2]) * u,
    ];
    // 飞行弧线：横移越远，中段抬得越高，避免贴着山脊/楼顶掠过；
    // 抬到 2 km 量级后地面视差明显变小，横向飞行不会闪成抽帧
    const horiz = Math.hypot(b.pos[0] - a.pos[0], b.pos[2] - a.pos[2]);
    pos[1] += Math.sin(Math.PI * u) * Math.min(2200, horiz * 0.42);
    const ground = sampleHeight(terrain, pos[0], pos[2]);
    pos[1] = Math.max(pos[1], ground + 45);
    const target: Vec3 = [
      a.target[0] + (b.target[0] - a.target[0]) * u,
      a.target[1] + (b.target[1] - a.target[1]) * u,
      a.target[2] + (b.target[2] - a.target[2]) * u,
    ];
    const fov = a.fov + (b.fov - a.fov) * u;
    const alt = pos[1] - ground;
    const near = alt < 800 ? 10 : alt < 2000 ? 60 : alt < 5000 ? 300 : 500;
    const far = alt < 800 ? 60000 : alt < 2000 ? 120000 : alt < 5000 ? 180000 : 260000;
    return {pos, target, fov, near, far};
  };

  return (t: number): CamState => {
    if (t < HANDOFF - H_IN) return opening(t);
    if (t < HANDOFF + H_OUT) {
      const w = (t - (HANDOFF - H_IN)) / (H_IN + H_OUT);
      return mix(opening(Math.min(t, HANDOFF)), chapterCam(2, t), w);
    }
    // 之后的章节交界（44 s 起）：前后各留一小段做弧线过渡
    for (let k = 3; k < eras.length; k++) {
      const B = eras[k].t0;
      if (t >= B - X_IN && t < B + X_OUT) {
        const w = (t - (B - X_IN)) / (X_IN + X_OUT);
        return mix(chapterCam(k - 1, t), chapterCam(k, t), w);
      }
    }
    let i = 2;
    while (i < eras.length - 1 && t >= eras[i].t1) i++;
    return chapterCam(i, t);
  };
};

/**
 * 全片一镜到底的城市级航线：视线始终锁住老城中心，
 * 距离 20km 起 → 100s 收近到 15km → 片尾螺旋外扩到 25km，同期方位角顺时针扫过约 190°。
 * 片尾 150.2s 后定格，给片尾字幕留稳定画面。
 */
export const cityShotAt = (origin: [number, number], terrain: Terrain, t: number): CamState => {
  const [cx, cz] = lonlatToXZ(CITY_VIEW.center[0], CITY_VIEW.center[1], origin);
  const cy = sampleHeight(terrain, cx, cz) + 30;
  const tt = Math.min(t, 150.2);

  // 距离按公里设定，换算成米
  const dist = (20.2 - 5.2 * smoothstep(6, 100, tt) + 10.2 * smoothstep(100, 150.2, tt)) * 1000;
  const az = (262 + 190 * smoothstep(0, 150.2, tt)) * D2R;

  const tilt = CITY_VIEW.tiltDeg * D2R;
  const rad = dist * Math.cos(tilt);
  const alt = dist * Math.sin(tilt);
  const x = cx + Math.sin(az) * rad;
  const z = cz + Math.cos(az) * rad;
  const pos: Vec3 = [x, sampleHeight(terrain, x, z) + alt, z];
  const target: Vec3 = [cx, cy, cz];

  pos[0] += Math.sin(t * 0.63) * 12;
  pos[1] += Math.sin(t * 0.51 + 1.3) * 8;
  pos[2] += Math.cos(t * 0.57 + 0.4) * 10;

  return {pos, target, fov: CITY_VIEW.fov};
};
