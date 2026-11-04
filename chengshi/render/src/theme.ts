import type {Era, Timeline} from './types';

export const COLORS = {
  bg: '#050505',
  ink: '#f2f2f2',
  dim: '#a9a9a9',
  faint: 'rgba(255,255,255,0.16)',
  cyan: '#8fd8e8',
  gold: '#e8b45a',
  rose: '#d894ac',
  violet: '#b08fd8',
  blue: '#8fb7e8',
};

/** 建筑按年轮分区的轻着色：整体仍是白模，只在圈内透一点颜色 */
export const ZONE_COLORS: Record<number, string> = {
  [-1]: '#c9c9c9',
  0: '#ece4d8',
  1: '#eae4e8',
  2: '#e6e4ee',
};

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const p = clamp((x - e0) / (e1 - e0 || 1), 0, 1);
  return p * p * (3 - 2 * p);
};

export const eraAt = (eras: Era[], t: number): Era => {
  for (let i = 0; i < eras.length; i++) {
    if (t < eras[i].t1 || i === eras.length - 1) return eras[i];
  }
  return eras[eras.length - 1];
};

/** 当前年份：在相邻两个章节的年份之间做线性插值，时间轴才会连续走 */
export const yearAt = (eras: Era[], t: number): number => {
  if (!eras.length) return 2022;
  const era = eraAt(eras, t);
  const i = eras.indexOf(era);
  const next = eras[i + 1];
  if (!next) return era.year;
  const p = clamp((t - era.t0) / (era.t1 - era.t0 || 1), 0, 1);
  return lerp(era.year, next.year, p);
};

/** 某一年第一次出现在片中的时刻（用于建筑生长动画） */
export const tAtYear = (eras: Era[], year: number): number => {
  if (!eras.length) return 0;
  if (year <= eras[0].year) return 0;
  for (let i = 0; i < eras.length - 1; i++) {
    const a = eras[i];
    const b = eras[i + 1];
    if (year <= b.year) {
      const p = (year - a.year) / (b.year - a.year || 1);
      return a.t0 + p * (a.t1 - a.t0);
    }
  }
  return eras[eras.length - 1].t1;
};

/** 相机：章节内从本章参数平滑过渡到下一章参数，结尾稳在章节机位 */
export const cameraAt = (eras: Era[], t: number) => {
  if (!eras.length) {
    return {x: 0, z: 0, dist: 8000, pitch: 55, yaw: 0};
  }
  const era = eraAt(eras, t);
  const i = eras.indexOf(era);
  const next = eras[i + 1];
  if (!next) return era.camera;
  const p = smoothstep(0.12, 0.88, (t - era.t0) / (era.t1 - era.t0 || 1));
  return {
    x: lerp(era.camera.x, next.camera.x, p),
    z: lerp(era.camera.z, next.camera.z, p),
    dist: lerp(era.camera.dist, next.camera.dist, p),
    pitch: lerp(era.camera.pitch, next.camera.pitch, p),
    yaw: lerp(era.camera.yaw, next.camera.yaw, p),
  };
};

export const axisX = (ticks: Timeline['ticks'], year: number) => {
  if (!ticks.length) return 0.5;
  if (year <= ticks[0].year) return ticks[0].x;
  for (let i = 0; i < ticks.length - 1; i++) {
    const a = ticks[i];
    const b = ticks[i + 1];
    if (year <= b.year) {
      const p = (year - a.year) / (b.year - a.year || 1);
      return lerp(a.x, b.x, p);
    }
  }
  return ticks[ticks.length - 1].x;
};

export const fmtYear = (year: number) => {
  const y = Math.round(year);
  if (y < 0) return `前${Math.abs(y)}`;
  return `${y}`;
};
