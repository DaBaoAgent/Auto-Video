import type {CityData, Ring} from '../types';
import {makeWaterTest} from './waterMask';

/**
 * 前 514—前 100 年阖闾城的确定性布局：聚落、街巷、田块、院落、宫城、市集、窑址、船只……
 * 这里只算「放在哪、多大、朝向」，几何和材质在 AncientCity.tsx 里生成。
 * 所有随机量都由坐标哈希得到，同一份城市数据每次得到完全一样的结果。
 */

export const hash01 = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export const insidePoly = (poly: number[][], x: number, z: number) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = !hit;
  }
  return hit;
};

export const insetPoly = (poly: number[][], k: number) => {
  let cx = 0;
  let cz = 0;
  for (const [x, z] of poly) {
    cx += x;
    cz += z;
  }
  cx /= poly.length;
  cz /= poly.length;
  return poly.map(([x, z]) => [cx + (x - cx) * k, cz + (z - cz) * k]);
};

const centroid = (poly: number[][]) => {
  let cx = 0;
  let cz = 0;
  for (const [x, z] of poly) {
    cx += x;
    cz += z;
  }
  return [cx / poly.length, cz / poly.length] as [number, number];
};

const distToSeg = (x: number, z: number, x0: number, z0: number, x1: number, z1: number) => {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const l2 = dx * dx + dz * dz;
  if (l2 < 1e-6) return Math.hypot(x - x0, z - z0);
  const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / l2));
  return Math.hypot(x - (x0 + dx * t), z - (z0 + dz * t));
};

export type Hut = {x: number; z: number; len: number; wid: number; ang: number; h: number};
export type RoadSeg = {x0: number; z0: number; x1: number; z1: number; w: number; tone: 0 | 1 | 2};
export type FieldDef = {x: number; z: number; len: number; wid: number; ang: number; color: string};
export type TreeDef = {x: number; z: number; r: number; tone: number};
export type BoatDef = {x: number; z: number; ang: number; len: number};
export type CartDef = {x: number; z: number; ang: number};
export type SmokeDef = {x: number; z: number; h: number; y: number};
export type CompoundDef = {x: number; z: number; len: number; wid: number; ang: number};
export type DockDef = {x: number; z: number; ang: number; len: number};

export type SpecialZone = {
  palace: {x: number; z: number};
  market: {x: number; z: number};
  kilns: {x: number; z: number};
  granary: {x: number; z: number};
};

export type AncientLayout = {
  center: [number, number];
  radius: number;
  poly: number[][];
  gates: [number, number][];
  huts: Hut[];
  roads: RoadSeg[];
  fields: FieldDef[];
  trees: TreeDef[];
  compounds: CompoundDef[];
  boats: BoatDef[];
  carts: CartDef[];
  smoke: SmokeDef[];
  docks: DockDef[];
  special: SpecialZone;
};

const FIELD_COLORS = ['#7f9450', '#8c9c58', '#748a48', '#96a05e', '#a59963', '#b3a56d', '#9c8a5e'];

const lineRuns = (
  ax: number,
  az: number,
  bx: number,
  bz: number,
  w: number,
  tone: 0 | 1 | 2,
  inside: (x: number, z: number) => boolean,
  onWater: (x: number, z: number) => boolean,
) => {
  const out: RoadSeg[] = [];
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(len / 22));
  let sx = 0;
  let sz = 0;
  let open = false;
  let px = ax;
  let pz = az;
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const x = ax + (bx - ax) * f;
    const z = az + (bz - az) * f;
    const ok = inside(x, z) && !onWater(x, z);
    if (ok && !open) {
      open = true;
      sx = x;
      sz = z;
    }
    if (!ok && open) {
      if (Math.hypot(px - sx, pz - sz) > 8) out.push({x0: sx, z0: sz, x1: px, z1: pz, w, tone});
      open = false;
    }
    px = x;
    pz = z;
  }
  if (open && Math.hypot(px - sx, pz - sz) > 8) out.push({x0: sx, z0: sz, x1: px, z1: pz, w, tone});
  return out;
};

const makeSegIndex = (segs: RoadSeg[]) => {
  const CELL = 200;
  const map = new Map<string, RoadSeg[]>();
  for (const s of segs) {
    const minX = Math.min(s.x0, s.x1) - s.w;
    const maxX = Math.max(s.x0, s.x1) + s.w;
    const minZ = Math.min(s.z0, s.z1) - s.w;
    const maxZ = Math.max(s.z0, s.z1) + s.w;
    for (let gx = Math.floor(minX / CELL); gx <= Math.floor(maxX / CELL); gx++) {
      for (let gz = Math.floor(minZ / CELL); gz <= Math.floor(maxZ / CELL); gz++) {
        const k = `${gx},${gz}`;
        const list = map.get(k);
        if (list) list.push(s);
        else map.set(k, [s]);
      }
    }
  }
  const nearest = (x: number, z: number) => {
    const list = map.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`);
    if (!list) return Infinity;
    let best = Infinity;
    for (const s of list) {
      best = Math.min(best, distToSeg(x, z, s.x0, s.z0, s.x1, s.z1) - s.w / 2);
    }
    return best;
  };
  return {nearest};
};

export const buildAncientLayout = (city: CityData, ring: Ring): AncientLayout => {
  const poly = ring.polygon;
  const [cx, cz] = centroid(poly);
  let radius = 0;
  for (const [x, z] of poly) radius = Math.max(radius, Math.hypot(x - cx, z - cz));
  const water = makeWaterTest(city, 6);
  const waterNear = makeWaterTest(city, 14);
  const inner935 = insetPoly(poly, 0.935);
  const insideRoad = (x: number, z: number) => insidePoly(inner935, x, z);

  const pick = (offsets: [number, number][]): {x: number; z: number} => {
    for (const [dx, dz] of offsets) {
      const x = cx + dx;
      const z = cz + dz;
      if (insidePoly(insetPoly(poly, 0.8), x, z) && !waterNear(x, z)) return {x, z};
    }
    return {x: cx, z: cz};
  };

  const palace = pick([[0, -720], [280, -690], [-280, -690], [520, -520], [0, -500], [0, 0]]);
  const market = pick([[1050, 420], [1200, 120], [860, 640], [1300, -220], [760, 900]]);
  const kilns = pick([[-1250, 860], [-1050, 700], [-1420, 420], [-1180, 1100]]);
  const granary = pick([[palace.x - cx + 300, palace.z - cz + 30], [palace.x - cx - 300, palace.z - cz + 30]]);
  const special: SpecialZone = {palace, market, kilns, granary};

  const rects = [
    {x: palace.x, z: palace.z, hw: 190, hd: 140},
    {x: market.x, z: market.z, hw: 120, hd: 90},
  ];
  const circles = [
    {x: kilns.x, z: kilns.z, r: 150},
    {x: granary.x, z: granary.z, r: 100},
  ];
  const inSpecial = (x: number, z: number, pad = 0) => {
    for (const r of rects) {
      if (Math.abs(x - r.x) < r.hw + pad && Math.abs(z - r.z) < r.hd + pad) return true;
    }
    for (const c of circles) {
      if (Math.hypot(x - c.x, z - c.z) < c.r + pad) return true;
    }
    return false;
  };

  // ---- 街巷 ----
  const roads: RoadSeg[] = [];
  const bb = insetPoly(poly, 0.94);
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, z] of bb) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  // 三横四直：主街 16m，街边会成排种房
  const hz = [0.28, 0.5, 0.72].map((f) => minZ + (maxZ - minZ) * f);
  const vx = [0.16, 0.39, 0.61, 0.84].map((f) => minX + (maxX - minX) * f);
  for (const z of hz) roads.push(...lineRuns(minX - 200, z, maxX + 200, z, 16, 0, insideRoad, water));
  for (const x of vx) roads.push(...lineRuns(x, minZ - 200, x, maxZ + 200, 16, 0, insideRoad, water));
  // 次街 / 巷
  for (const f of [0.12, 0.2, 0.36, 0.44, 0.6, 0.66, 0.84]) {
    const z = minZ + (maxZ - minZ) * f;
    roads.push(...lineRuns(minX - 120, z, maxX + 120, z, 7, 2, insideRoad, water));
  }
  for (const f of [0.08, 0.27, 0.5, 0.7, 0.93]) {
    const x = minX + (maxX - minX) * f;
    roads.push(...lineRuns(x, minZ - 120, x, maxZ + 120, 7, 2, insideRoad, water));
  }
  // 顺城街（内环路）与外环路
  const ringIn = insetPoly(poly, 0.905);
  const ringOut = insetPoly(poly, 1.075);
  const addRing = (rp: number[][], w: number, tone: 0 | 1 | 2) => {
    for (let i = 0; i < rp.length; i++) {
      const a = rp[i];
      const b = rp[(i + 1) % rp.length];
      roads.push(...lineRuns(a[0], a[1], b[0], b[1], w, tone, () => true, water));
    }
  };
  addRing(ringIn, 12, 1);
  addRing(ringOut, 9, 2);
  // 八门：门内大道 + 门外官道
  const gates: [number, number][] = poly.map(([x, z]) => [x, z]);
  for (const [x, z] of poly) {
    const ix = cx + (x - cx) * 0.93;
    const iz = cz + (z - cz) * 0.93;
    roads.push(...lineRuns(ix, iz, cx + (x - cx) * 0.992, cz + (z - cz) * 0.992, 14, 1, () => true, water));
    roads.push(
      ...lineRuns(cx + (x - cx) * 1.04, cz + (z - cz) * 1.04, cx + (x - cx) * 1.12, cz + (z - cz) * 1.12, 12, 2, () => true, water),
    );
  }
  // 四条通向城门的主轴
  for (const i of [0, 2, 4, 6]) {
    const [x, z] = poly[i];
    roads.push(...lineRuns(cx, cz, cx + (x - cx) * 0.9, cz + (z - cz) * 0.9, 11, 1, insideRoad, water));
  }
  const segIndex = makeSegIndex(roads);

  // ---- 聚落 ----
  const cells = new Map<string, number[][]>();
  for (const b of city.buildings) {
    const key = `${Math.floor(b[0] / 45)},${Math.floor(b[1] / 45)}`;
    const list = cells.get(key);
    if (list) list.push([b[0], b[1]]);
    else cells.set(key, [[b[0], b[1]]]);
  }
  const osmOccupied = (x: number, z: number) => {
    const gx = Math.floor(x / 45);
    const gz = Math.floor(z / 45);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = cells.get(`${gx + dx},${gz + dz}`);
        if (!list) continue;
        for (const [bx, bz] of list) if (Math.hypot(bx - x, bz - z) < 26) return true;
      }
    }
    return false;
  };

  const huts: Hut[] = [];
  const hutIndex = new Map<string, Hut[]>();
  const HC = 80;
  const addHutIndex = (h: Hut) => {
    const k = `${Math.floor(h.x / HC)},${Math.floor(h.z / HC)}`;
    const list = hutIndex.get(k);
    if (list) list.push(h);
    else hutIndex.set(k, [h]);
  };
  const nearHut = (x: number, z: number, r: number) => {
    const gx = Math.floor(x / HC);
    const gz = Math.floor(z / HC);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const list = hutIndex.get(`${gx + dx},${gz + dz}`);
        if (!list) continue;
        for (const h of list) if (Math.hypot(h.x - x, h.z - z) < r) return true;
      }
    }
    return false;
  };
  const pushHut = (h: Hut, minGap = 13) => {
    if (nearHut(h.x, h.z, minGap)) return;
    huts.push(h);
    addHutIndex(h);
  };

  const polyHut = insetPoly(poly, 0.945);
  const step = 56;
  for (let gx = minX; gx <= maxX; gx += step) {
    for (let gz = minZ; gz <= maxZ; gz += step) {
      const x = gx + (hash01(gx, gz) - 0.5) * step * 0.82;
      const z = gz + (hash01(gx + 17, gz - 9) - 0.5) * step * 0.82;
      if (!insidePoly(polyHut, x, z)) continue;
      if (water(x, z) || osmOccupied(x, z)) continue;
      if (segIndex.nearest(x, z) < 13 || inSpecial(x, z, 12)) continue;
      const q = hash01(x * 1.7, z * 1.3);
      if (q < 0.15) continue;
      const r1 = hash01(x + 31, z - 7);
      const r2 = hash01(x - 13, z + 41);
      const r3 = hash01(x + 77, z + 5);
      pushHut({
        x,
        z,
        len: 12 + r1 * 10,
        wid: 8 + r2 * 6,
        h: 6 + r3 * 5,
        ang: (r1 < 0.72 ? 0 : 90) + (r2 - 0.5) * 18,
      });
    }
  }

  // 沿主街/顺城街成排面街的房子：让街道两侧读出连续的街坊，而不是散点
  for (const s of roads) {
    if (s.tone === 2) continue;
    const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0);
    const n = Math.max(1, Math.floor(len / 30));
    const dx = (s.x1 - s.x0) / len;
    const dz = (s.z1 - s.z0) / len;
    const ang = (Math.atan2(-dz, dx) * 180) / Math.PI;
    const off = s.w / 2 + 10;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const bx = s.x0 + (s.x1 - s.x0) * f;
      const bz = s.z0 + (s.z1 - s.z0) * f;
      for (const side of [-1, 1]) {
        if (hash01(bx + side * 13, bz - side * 7) < 0.42) continue;
        const x = bx + -dz * off * side;
        const z = bz + dx * off * side;
        if (!insidePoly(polyHut, x, z) || water(x, z) || inSpecial(x, z, 10)) continue;
        const r1 = hash01(x + 3, z - 11);
        const r2 = hash01(x - 7, z + 19);
        const r3 = hash01(x + 23, z + 3);
        pushHut(
          {
            x,
            z,
            len: 10 + r1 * 7,
            wid: 7 + r2 * 3,
            h: 5.5 + r3 * 4,
            ang: ang + (r2 - 0.5) * 10,
          },
          10,
        );
      }
    }
  }

  // ---- 田块 ----
  const fields: FieldDef[] = [];
  const fieldColor = (x: number, z: number) =>
    FIELD_COLORS[Math.floor(hash01(x * 0.7 + 5, z * 0.9 - 3) * FIELD_COLORS.length)];

  const insideFieldsPoly = insetPoly(poly, 0.875);
  let minFX = Infinity;
  let maxFX = -Infinity;
  let minFZ = Infinity;
  let maxFZ = -Infinity;
  for (const [x, z] of insideFieldsPoly) {
    minFX = Math.min(minFX, x);
    maxFX = Math.max(maxFX, x);
    minFZ = Math.min(minFZ, z);
    maxFZ = Math.max(maxFZ, z);
  }
  for (let gx = minFX; gx <= maxFX; gx += 118) {
    for (let gz = minFZ; gz <= maxFZ; gz += 118) {
      const x = gx + (hash01(gx - 4, gz + 9) - 0.5) * 80;
      const z = gz + (hash01(gx + 21, gz - 6) - 0.5) * 80;
      if (!insidePoly(insideFieldsPoly, x, z)) continue;
      if (waterNear(x, z)) continue;
      if (segIndex.nearest(x, z) < 10) continue;
      if (nearHut(x, z, 34)) continue;
      if (inSpecial(x, z, 18)) continue;
      let local = 0;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const list = hutIndex.get(`${Math.floor(x / HC) + dx},${Math.floor(z / HC) + dz}`);
          if (list) local += list.length;
        }
      }
      if (local > 4) continue;
      const len = 44 + hash01(x + 11, z + 4) * 50;
      const wid = 32 + hash01(x - 9, z + 17) * 42;
      const ang = (hash01(x + 2, z + 8) < 0.5 ? 0 : 90) + (hash01(x, z) - 0.5) * 10;
      fields.push({x, z, len, wid, ang, color: fieldColor(x, z)});
      if (fields.length >= 170) break;
    }
    if (fields.length >= 170) break;
  }

  // 城外农田：一圈拼块，补足「水乡平原」的质地
  const outMin = Math.floor((cx - radius * 2.35) / 168);
  const outMax = Math.floor((cx + radius * 2.35) / 168);
  const outMinZ = Math.floor((cz - radius * 2.35) / 168);
  const outMaxZ = Math.floor((cz + radius * 2.35) / 168);
  const outPoly = insetPoly(poly, 1.1);
  const outerCap = 340;
  for (let gx = outMin; gx <= outMax && fields.length < 170 + outerCap; gx++) {
    for (let gz = outMinZ; gz <= outMaxZ && fields.length < 170 + outerCap; gz++) {
      const bx = gx * 168;
      const bz = gz * 168;
      const x = bx + (hash01(bx + 7, bz - 3) - 0.5) * 100;
      const z = bz + (hash01(bx - 12, bz + 15) - 0.5) * 100;
      const d = Math.hypot(x - cx, z - cz);
      if (d < radius * 1.12 || d > radius * 2.35) continue;
      if (insidePoly(outPoly, x, z)) continue;
      if (waterNear(x, z)) continue;
      const len = 78 + hash01(x + 3, z + 21) * 72;
      const wid = 52 + hash01(x - 14, z + 6) * 62;
      const ang = (hash01(x + 9, z - 2) < 0.5 ? 0 : 90) + (hash01(x + 1, z + 1) - 0.5) * 8;
      fields.push({x, z, len, wid, ang, color: fieldColor(x + 17, z - 9)});
    }
  }

  // ---- 院落 ----
  const compounds: CompoundDef[] = [];
  for (const h of huts) {
    if (compounds.length >= 230) break;
    if (hash01(h.x + 41, h.z - 17) < 0.68) continue;
    if (segIndex.nearest(h.x, h.z) < 26 || inSpecial(h.x, h.z, 8)) continue;
    compounds.push({x: h.x, z: h.z, len: h.len + 25, wid: h.wid + 21, ang: h.ang});
  }

  // ---- 树 ----
  const trees: TreeDef[] = [];
  const pushTree = (x: number, z: number) => {
    if (water(x, z)) return;
    trees.push({x, z, r: 5 + hash01(x + 5, z - 7) * 5.5, tone: Math.floor(hash01(x - 2, z + 3) * 6)});
  };
  // 城外树丛
  for (let c = 0; c < 34; c++) {
    const a = c * 2.39996 + hash01(c, 7) * 0.8;
    const rr = radius * (1.14 + hash01(c, 19) * 0.72);
    const ccx = cx + Math.cos(a) * rr;
    const ccz = cz + Math.sin(a) * rr;
    const spread = 55 + hash01(c, 31) * 85;
    const n = 12 + Math.floor(hash01(c, 43) * 20);
    for (let i = 0; i < n; i++) {
      const aa = hash01(i + c * 13, 3) * Math.PI * 2;
      const d = Math.sqrt(hash01(i + c * 7, 11)) * spread;
      pushTree(ccx + Math.cos(aa) * d, ccz + Math.sin(aa) * d);
    }
  }
  // 护城河外一圈柳树
  const moatTrees = insetPoly(poly, 1.072);
  for (let i = 0; i < moatTrees.length; i++) {
    const a = moatTrees[i];
    const b = moatTrees[(i + 1) % moatTrees.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.floor(len / 34);
    for (let j = 0; j < n; j++) {
      const f = (j + 0.5) / Math.max(1, n);
      pushTree(a[0] + (b[0] - a[0]) * f + (hash01(i, j) - 0.5) * 16, a[1] + (b[1] - a[1]) * f + (hash01(j, i) - 0.5) * 16);
    }
  }
  // 城内空地的树丛
  for (let c = 0; c < 16; c++) {
    const a = hash01(c * 3 + 1, 5) * Math.PI * 2;
    const rr = radius * (0.2 + hash01(c, 9) * 0.55);
    const ccx = cx + Math.cos(a) * rr;
    const ccz = cz + Math.sin(a) * rr;
    const n = 8 + Math.floor(hash01(c, 23) * 10);
    for (let i = 0; i < n; i++) {
      const aa = hash01(i + c, 17) * Math.PI * 2;
      const d = Math.sqrt(hash01(i, c)) * 70;
      const x = ccx + Math.cos(aa) * d;
      const z = ccz + Math.sin(aa) * d;
      if (!insidePoly(insetPoly(poly, 0.9), x, z)) continue;
      if (segIndex.nearest(x, z) < 8 || nearHut(x, z, 12) || inSpecial(x, z, 12)) continue;
      pushTree(x, z);
    }
  }

  // ---- 水系：船只与码头 ----
  const boats: BoatDef[] = [];
  const docks: DockDef[] = [];
  const waterPoly = insetPoly(poly, 1.18);
  for (const line of city.waterways) {
    if (line.length < 2) continue;
    let total = 0;
    const cum = [0];
    for (let i = 1; i < line.length; i++) {
      total += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
      cum.push(total);
    }
    for (let d = 180; d < total && boats.length < 44; d += 250) {
      let lo = 0;
      let hi = cum.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (cum[mid] <= d) lo = mid;
        else hi = mid;
      }
      const seg = Math.max(1e-6, cum[lo + 1] - cum[lo]);
      const f = (d - cum[lo]) / seg;
      const x = line[lo][0] + (line[lo + 1][0] - line[lo][0]) * f;
      const z = line[lo][1] + (line[lo + 1][1] - line[lo][1]) * f;
      if (!insidePoly(waterPoly, x, z)) continue;
      if (hash01(x + 7, z - 5) < 0.35) continue;
      const dx = line[lo + 1][0] - line[lo][0];
      const dz = line[lo + 1][1] - line[lo][1];
      const ang = Math.atan2(-dz, dx);
      boats.push({x, z, ang, len: 9 + hash01(x, z) * 8});
      if (boats.length % 5 === 0 && docks.length < 9) {
        docks.push({x: x - dz * 0.02, z: z + dx * 0.02, ang, len: 24 + hash01(z, x) * 8});
      }
    }
  }

  // ---- 板车 ----
  const carts: CartDef[] = [];
  for (const s of roads) {
    if (s.tone === 2) continue;
    const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0);
    const n = Math.floor(len / 320);
    const dx = (s.x1 - s.x0) / len;
    const dz = (s.z1 - s.z0) / len;
    for (let i = 0; i < n && carts.length < 28; i++) {
      const f = (i + 0.5) / Math.max(1, n);
      const side = (hash01(s.x0 + i, s.z0 - i) - 0.5) * s.w * 0.5;
      carts.push({
        x: s.x0 + (s.x1 - s.x0) * f - dz * side,
        z: s.z0 + (s.z1 - s.z0) * f + dx * side,
        ang: Math.atan2(-dz, dx),
      });
    }
  }

  // ---- 炊烟 ----
  const smoke: SmokeDef[] = [];
  for (let i = 0; i < huts.length && smoke.length < 22; i += 37) {
    const h = huts[i];
    const gy = 0;
    smoke.push({x: h.x, z: h.z, h: 42 + hash01(h.x, h.z) * 38, y: gy + h.h});
  }
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2;
    smoke.push({x: kilns.x + Math.cos(a) * 38, z: kilns.z + Math.sin(a) * 38, h: 70 + k * 6, y: 12});
  }

  return {
    center: [cx, cz],
    radius,
    poly,
    gates,
    huts,
    roads,
    fields,
    trees,
    compounds,
    boats,
    carts,
    smoke,
    docks,
    special,
  };
};
