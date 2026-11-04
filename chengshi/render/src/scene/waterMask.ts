import type {CityData} from '../types';

export type WaterTest = (x: number, z: number) => boolean;

/**
 * 水面点判定：把 OSM 水面多边形按包围盒预筛后做射线法。
 * pad > 0 时把判定向外扩一圈（米），用来让贴地金线/道路在离岸前就断开，
 * 而不是在水面中间出现一个生硬的断头。
 */
export const makeWaterTest = (city?: CityData, pad = 0): WaterTest => {
  if (!city) return () => false;
  const polys = city.water
    .filter((p) => p.length >= 3)
    .map((p) => {
      let minX = Infinity;
      let maxX = -Infinity;
      let minZ = Infinity;
      let maxZ = -Infinity;
      for (const [x, z] of p) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      return {p, minX, maxX, minZ, maxZ};
    });

  const inside = (x: number, z: number) => {
    for (const q of polys) {
      if (x < q.minX || x > q.maxX || z < q.minZ || z > q.maxZ) continue;
      const p = q.p;
      let hit = false;
      for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
        const xi = p[i][0];
        const zi = p[i][1];
        const xj = p[j][0];
        const zj = p[j][1];
        if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
      }
      if (hit) return true;
    }
    return false;
  };

  if (pad <= 0) return inside;
  return (x, z) =>
    inside(x, z) || inside(x + pad, z) || inside(x - pad, z) || inside(x, z + pad) || inside(x, z - pad);
};
