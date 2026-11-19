import {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {Satellite} from '../data';
import type {CityData, Terrain} from '../types';
import {smoothstep} from '../theme';
import {applyCloudShadow} from './clouds';
import {eraRevealYear} from '../sample/config';

// 卫星底图里江南的植被是压深的墨绿；早年没有影像，地表色块也要压到这个明度。
// 混入两块收割后的黄绿/土色田，色块才不会像一整片草地。
const FIELDS = [
  '#465f3b', '#557046', '#3c5233', '#67824f', '#4c653f', '#5d6b47', '#6f7d55', '#7a7358',
].map((c) => new THREE.Color(c));
const HILL = new THREE.Color('#42633a');
const PEAK = new THREE.Color('#2c4a2b');
const ROCK = new THREE.Color('#8b887c');
const SHORE = new THREE.Color('#64877c');
const URBAN = new THREE.Color('#9b9a93');

/** 楼密度 → 建成区遮罩（城市里楼之间不该露草地绿）；给 year 时只统计当年已存在的楼 */
const buildDensity = (city: CityData, cell = 220, year?: number) => {
  const [minX, minZ, maxX, maxZ] = city.bbox;
  const nx = Math.max(1, Math.ceil((maxX - minX) / cell));
  const nz = Math.max(1, Math.ceil((maxZ - minZ) / cell));
  const grid = new Float32Array(nx * nz);
  for (const b of city.buildings) {
    if (year !== undefined && eraRevealYear(b[0], b[1], b[6], b[7]) > year) continue;
    const gx = Math.min(nx - 1, Math.max(0, Math.floor((b[0] - minX) / cell)));
    const gz = Math.min(nz - 1, Math.max(0, Math.floor((b[1] - minZ) / cell)));
    grid[gz * nx + gx] += 1;
  }
  const densityAt = (x: number, z: number) => {
    const gx = Math.floor((x - minX) / cell);
    const gz = Math.floor((z - minZ) / cell);
    let sum = 0;
    for (let j = gz - 1; j <= gz + 1; j++) {
      for (let i = gx - 1; i <= gx + 1; i++) {
        if (i >= 0 && j >= 0 && i < nx && j < nz) sum += grid[j * nx + i];
      }
    }
    return sum / 9;
  };
  return densityAt;
};

/** 把高度场铺成三角网：按高程/坡度上色（低地田野拼块 → 青山 → 山脊），建成区压灰 */
const buildTerrain = (terrain: Terrain, densityAt: (x: number, z: number) => number) => {
  const {nx, nz, x0, z0, dx, dz, h} = terrain;
  const count = nx * nz;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  const smooth = (a: number, b: number, v: number) => {
    const p = Math.min(1, Math.max(0, (v - a) / (b - a || 1)));
    return p * p * (3 - 2 * p);
  };
  // 整数哈希：给每块田一个稳定色，避免原来自正弦波拼出的大片“绿色脑纹”
  const cellHash = (a: number, b: number) => {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const FIELD_ANG = 0.26;
  const ca = Math.cos(FIELD_ANG);
  const sa = Math.sin(FIELD_ANG);

  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const x = x0 + i * dx;
      const z = z0 + j * dz;
      const y = h[k];
      pos[k * 3] = x;
      pos[k * 3 + 1] = y;
      pos[k * 3 + 2] = z;

      const hx = h[j * nx + Math.min(nx - 1, i + 1)] - h[j * nx + Math.max(0, i - 1)];
      const hz = h[Math.min(nz - 1, j + 1) * nx + i] - h[Math.max(0, j - 1) * nx + i];
      const slope = Math.hypot(hx / (2 * dx), hz / (2 * dz));

      // 500×340m 的斜向田块；用整数哈希取色，边界清楚、不会随镜头出现波纹
      const rx = x * ca - z * sa;
      const rz = x * sa + z * ca;
      const patch = Math.floor(cellHash(Math.floor(rx / 500), Math.floor(rz / 340)) * FIELDS.length);
      c.copy(FIELDS[patch]);
      if (y < 4 && slope < 0.01) c.lerp(SHORE, 0.35);
      c.lerp(HILL, smooth(5, 45, y));
      c.lerp(PEAK, smooth(90, 210, y));
      if (y > 12) c.lerp(ROCK, smooth(0.38, 0.9, slope) * 0.55);
      c.lerp(URBAN, smooth(6, 28, densityAt(x, z)) * 0.9 * (1 - smooth(18, 40, y)));

      // 朝自身明度里收一点彩度：早年地表没有影像，纯色块容易比卫星底图更艳
      const lum = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722;
      c.r += (lum - c.r) * 0.18;
      c.g += (lum - c.g) * 0.18;
      c.b += (lum - c.b) * 0.18;

      // 每块田内部再压一点细碎明暗，模拟作物行垄；幅度要小，近景才不会像花布
      const n = cellHash(Math.floor(rx / 110) + 7, Math.floor(rz / 90) - 3);
      const shade = 0.95 + n * 0.1;
      col[k * 3] = c.r * shade;
      col[k * 3 + 1] = c.g * shade;
      col[k * 3 + 2] = c.b * shade;
    }
  }

  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  let p = 0;
  for (let j = 0; j < nz - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const cc = a + nx;
      const d = cc + 1;
      idx[p++] = a;
      idx[p++] = cc;
      idx[p++] = b;
      idx[p++] = b;
      idx[p++] = cc;
      idx[p++] = d;
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
};

/** 影像底图的 UV：场景是等距投影，影像在 Web Mercator 里，纬度方向必须按墨卡托换算 */
const addSatelliteUv = (
  g: THREE.BufferGeometry,
  terrain: Terrain,
  origin: [number, number],
  bbox: [number, number, number, number],
) => {
  const {nx, nz, x0, z0, dx, dz} = terrain;
  const [ox, oy] = origin;
  const coslat = Math.cos((oy * Math.PI) / 180);
  const [latB, lonL, latT, lonR] = bbox;
  const merc = (lat: number) =>
    (1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2;
  const mt = merc(latT);
  const mb = merc(latB);
  const uv = new Float32Array(nx * nz * 2);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const lon = ox + (x0 + i * dx) / (111320 * coslat);
      const lat = oy - (z0 + j * dz) / 110540;
      uv[k * 2] = (lon - lonL) / (lonR - lonL);
      uv[k * 2 + 1] = (merc(lat) - mt) / (mb - mt);
    }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
};

/**
 * 年代地表调色：只留一点旧感，不再把绿地压成土黄。
 * 参考真实航拍配色，绿色在各年代都保持绿，早年的差别交给建筑密度和卫星淡入。
 */
export const eraTint = (year: number): [number, number, number] => {
  const keys: [number, [number, number, number]][] = [
    [1896, [0.95, 0.99, 0.92]],
    [1949, [0.97, 1.0, 0.95]],
    [1978, [0.98, 1.0, 0.97]],
    [1994, [1.0, 1.0, 1.0]],
    [2026, [1.0, 1.0, 1.0]],
  ];
  if (year <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (year <= b[0]) {
      const p = (year - a[0]) / (b[0] - a[0] || 1);
      return [a[1][0] + (b[1][0] - a[1][0]) * p,
              a[1][1] + (b[1][1] - a[1][1]) * p,
              a[1][2] + (b[1][2] - a[1][2]) * p];
    }
  }
  return keys[keys.length - 1][1];
};

export const Ground: React.FC<{
  size: number;
  terrain: Terrain;
  city: CityData;
  satellite?: Satellite | null;
  /** 给年份时进入「年代地表」模式：顶点色地形 + 卫星底图按年代淡入 */
  year?: number;
  /** 直接指定卫星影像透明度：1896 开埠镜头要在年份还没到 2000 时先淡入影像 */
  satOpacity?: number;
}> = ({size, terrain, city, satellite, year, satOpacity}) => {
  // 每 10 年重算一次建成区遮罩，样片里不会逐帧重建
  const densityYear = year === undefined ? undefined : Math.floor(year / 10) * 10;
  const geom = useMemo(() => {
    const g = buildTerrain(terrain, buildDensity(city, 220, densityYear));
    if (satellite) addSatelliteUv(g, terrain, city.origin, satellite.bbox);
    return g;
  }, [terrain, city, satellite, densityYear]);

  const baseMat = useMemo(() => {
    const tint = eraTint(densityYear ?? 2026);
    const m = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.96,
      metalness: 0,
      color: new THREE.Color(tint[0], tint[1], tint[2]),
    });
    applyCloudShadow(m);
    return m;
  }, [densityYear]);

  const yearMode = year !== undefined;
  const satMat = useMemo(() => {
    if (!satellite) return null;
    const m = new THREE.MeshStandardMaterial({
      map: satellite.tex,
      roughness: 0.95,
      metalness: 0,
      transparent: true,
      opacity: yearMode ? 0 : 1,
      depthWrite: !yearMode,
    });
    applyCloudShadow(m);
    return m;
  }, [satellite, yearMode]);

  const satBlend = satOpacity ?? (year === undefined ? 1 : smoothstep(2000, 2016, year));
  useLayoutEffect(() => {
    if (!satMat) return;
    satMat.opacity = satBlend;
    const solid = satBlend >= 0.999;
    satMat.transparent = !solid;
    satMat.depthWrite = solid;
    satMat.needsUpdate = true;
  }, [satMat, satBlend]);

  return (
    <group>
      {/* 年代模式：顶点色地形打底，卫星影像按年份盖上去；老年代下面是农田/山体色块 */}
      {(!satellite || year !== undefined) && <mesh geometry={geom} material={baseMat} receiveShadow />}
      {satellite && satMat && (
        <mesh geometry={geom} material={satMat} position={year === undefined ? [0, 0, 0] : [0, 1.3, 0]} receiveShadow />
      )}
      {/* 垫底盒：只负责挡住地表背面。必须明显低于地表并整体后推深度，
          否则会在远距离与地形 z-fighting，整片低地逐帧闪成暗块 */}
      <mesh position={[0, -132, 0]}>
        <boxGeometry args={[size, 160, size]} />
        <meshBasicMaterial color="#0d0d0d" polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
      </mesh>
    </group>
  );
};
