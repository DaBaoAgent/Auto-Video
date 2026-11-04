import * as THREE from 'three';
import {smoothstep} from './theme';

/**
 * 0=深秋午后金色时刻，1=蓝调亮灯。
 * 日转夜只发生在「姑苏」一章（运河夜航），开埠时天已亮回，
 * 片尾年轮是白天全景，不再回到夜景。
 */
export const nightAt = (t: number) => {
  const up = smoothstep(108, 118, t);
  const down = smoothstep(124, 131, t);
  return up * (1 - down) * 0.95;
};

const mix = (a: string, b: string, p: number) =>
  '#' +
  new THREE.Color(a)
    .lerp(new THREE.Color(b), p)
    .getHexString();

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * 四段主色（对标《一座城的年轮》「一张地图多套染色」）：用色彩当章节叙事。
 *  段0 先秦（0–44s）  ：冷灰 + 金，历史开端的「未成型土地」
 *  段1 唐宋（44–94s） ：暖土黄，盛世营城
 *  段2 明清（94–124s）：蓝调夜景（姑苏夜）
 *  段3 近现代（124–156s）：高光提亮，园区与年轮收束
 * 返回浮点 phase，在切换点前后 2s 用 smoothstep 平滑，避免「冷→暖」瞬间跳变。
 */
const PHASE_BOUND = [0, 44, 94, 124];
export const eraPhaseAt = (t: number): number => {
  const w = 2.0;
  for (let i = 0; i < 3; i++) {
    if (t < PHASE_BOUND[i + 1] - w) return i;
    if (t < PHASE_BOUND[i + 1] + w) {
      return i + smoothstep(PHASE_BOUND[i + 1] - w, PHASE_BOUND[i + 1] + w, t);
    }
  }
  return 3;
};

/** 四段暖度：段0冷(0.35)、段1暖(1.0)、段2夜(0.25)、段3亮暖(0.9)——四幕分明但整体不暗 */
const PHASE_WARM = [0.35, 1.0, 0.25, 0.9];

/** 各段雾色：精确对齐天空渐变 46% 高度（地平线）处的颜色 */
const PHASE_FOG: [string, string, number][] = [
  ['#c2b294', '#22324f', 0.000034],
  ['#f3d6ae', '#22324f', 0.000032],
  ['#2b3d59', '#22324f', 0.000034],
  ['#f7e2c0', '#22324f', 0.000030],
];

/** 各段天空渐变（日版），段0冷灰、段1暖土黄、段3提亮（段2走夜景） */
const PHASE_DAY: string[][] = [
  ['#1f2e3d', '#3d5366', '#6f7d85', '#9c8a6e', '#c2b294', '#c2b294'],
  ['#274863', '#4f6d88', '#93a3a4', '#e0bd93', '#f3d6ae', '#f3d6ae'],
  ['#0a1426', '#122036', '#1c2d49', '#2b3d59', '#3a4d6b', '#3a4d6b'],
  ['#274863', '#4f6d88', '#a5b4b5', '#f0d6ae', '#f7e2c0', '#f7e2c0'],
];

const NIGHT_STOPS = ['#0a1426', '#122036', '#1c2d49', '#2b3d59', '#3a4d6b', '#3a4d6b'];
const POS = ['0%', '14%', '24%', '33%', '46%', '100%'];

/** 相邻两段标量插值 */
const phaseLerpNum = (arr: number[], phase: number) => {
  const i = Math.min(arr.length - 1, Math.floor(phase));
  const j = Math.min(arr.length - 1, i + 1);
  const f = phase - i;
  return lerp(arr[i], arr[j], f);
};
/** 相邻两段颜色数组插值（等长） */
const phaseLerpColors = (arr: string[][], phase: number) => {
  const i = Math.min(arr.length - 1, Math.floor(phase));
  const j = Math.min(arr.length - 1, i + 1);
  const f = phase - i;
  return arr[i].map((c, k) => mix(c, arr[j][k], f));
};

export type LightRig = ReturnType<typeof lightRigAt>;

export const lightRigAt = (n: number, phase: number = 1) => {
  const warm = phaseLerpNum(PHASE_WARM, phase);
  const fogA = PHASE_FOG[Math.min(3, Math.floor(phase))];
  const fogB = PHASE_FOG[Math.min(3, Math.floor(phase) + 1)];
  const f = phase - Math.floor(phase);
  const fog0 = mix(fogA[0], fogB[0], f);
  const fog1 = mix(fogA[1], fogB[1], f);
  const fogD = lerp(fogA[2], fogB[2], f);
  const boost = phase >= 3 ? 1.12 : 1;
  return {
    sunColor: mix('#8fb4d0', '#ffb26a', warm * (1 - n)),
    sunIntensity: lerp(4.0, 0.62, n) * boost,
    ambientColor: mix('#5a6a80', '#b98f70', warm),
    ambientIntensity: lerp(0.88, 0.9, n) * (phase >= 3 ? 1.05 : 1),
    hemiSky: mix('#6f87a0', '#ffd9ad', warm),
    hemiGround: mix('#2a3038', '#413528', warm),
    hemiIntensity: lerp(1.05, 1.08, n),
    fogColor: mix(fog0, fog1, n),
    fogDensity: lerp(fogD, 0.000034, n),
    fillColor: mix('#8aa8cc', '#6684be', n),
    fillIntensity: lerp(0.5, 0.6, n),
  };
};

/** 背景天空渐变（CSS）：按四段主色（浮点插值）+ 夜景强度同步走向 */
export const skyGradientAt = (n: number, phase: number = 1) => {
  const day = phaseLerpColors(PHASE_DAY, phase);
  const night = Math.floor(phase) === 2 ? day : NIGHT_STOPS;
  return `linear-gradient(180deg, ${day.map(
    (c, i) => `${mix(c, night[i], n)} ${POS[i]}`,
  ).join(', ')})`;
};
