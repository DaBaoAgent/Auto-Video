import type {Terrain} from './types';

/** 平面兜底：没有 DEM 时所有贴地元素都落在 0 米 */
export const FLAT_TERRAIN: Terrain = {
  x0: -1e7,
  z0: -1e7,
  dx: 1e7,
  dz: 1e7,
  nx: 2,
  nz: 2,
  h: [0, 0, 0, 0],
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 双线性采样地形高度（米）；超出数据范围按边缘值处理 */
export const sampleHeight = (t: Terrain, x: number, z: number): number => {
  if (!t || t.nx < 2 || t.nz < 2) return 0;
  const fx = (x - t.x0) / t.dx;
  const fz = (z - t.z0) / t.dz;
  const i = Math.min(t.nx - 1, Math.max(0, Math.floor(fx)));
  const j = Math.min(t.nz - 1, Math.max(0, Math.floor(fz)));
  const i1 = Math.min(t.nx - 1, i + 1);
  const j1 = Math.min(t.nz - 1, j + 1);
  const ax = clamp01(fx - i);
  const az = clamp01(fz - j);
  const h00 = t.h[j * t.nx + i];
  const h10 = t.h[j * t.nx + i1];
  const h01 = t.h[j1 * t.nx + i];
  const h11 = t.h[j1 * t.nx + i1];
  return (h00 * (1 - ax) + h10 * ax) * (1 - az) + (h01 * (1 - ax) + h11 * ax) * az;
};
