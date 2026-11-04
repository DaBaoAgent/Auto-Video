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
  return up * (1 - down) * 0.82;
};

const mix = (a: string, b: string, p: number) =>
  '#' +
  new THREE.Color(a)
    .lerp(new THREE.Color(b), p)
    .getHexString();

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export type LightRig = ReturnType<typeof lightRigAt>;

export const lightRigAt = (n: number) => ({
  sunColor: mix('#ffb26a', '#8fa4cf', n),
  sunIntensity: lerp(3.2, 0.62, n),
  ambientColor: mix('#b98f70', '#43577e', n),
  ambientIntensity: lerp(0.62, 0.8, n),
  hemiSky: mix('#ffd9ad', '#5a719b', n),
  hemiGround: mix('#413528', '#202838', n),
  hemiIntensity: lerp(0.82, 0.86, n),
  fogColor: mix('#e6c39a', '#2b3d5e', n),
  fogDensity: lerp(0.000017, 0.00002, n),
  fillColor: mix('#8aa8cc', '#6684be', n),
  fillIntensity: lerp(0.35, 0.5, n),
});

const DAY_STOPS = ['#274863', '#4f6d88', '#93a3a4', '#e0bd93', '#f3d6ae', '#f3d6ae'];
const NIGHT_STOPS = ['#0a1426', '#122036', '#1c2d49', '#2b3d59', '#3a4d6b', '#3a4d6b'];
const POS = ['0%', '14%', '24%', '33%', '46%', '100%'];

/** 背景天空渐变（CSS）：跟着云影和亮灯同步走向蓝调 */
export const skyGradientAt = (n: number) =>
  `linear-gradient(180deg, ${DAY_STOPS.map(
    (c, i) => `${mix(c, NIGHT_STOPS[i], n)} ${POS[i]}`,
  ).join(', ')})`;
