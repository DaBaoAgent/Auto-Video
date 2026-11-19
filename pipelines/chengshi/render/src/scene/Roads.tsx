import {useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {makeWaterTest} from './waterMask';

const ROAD_COLORS: Record<number, [number, number, number]> = {
  1: [0.60, 0.58, 0.54],
  2: [0.46, 0.44, 0.41],
};

export const Roads: React.FC<{city: CityData; terrain: Terrain; year?: number}> = ({city, terrain, year}) => {
  const geom = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    // OSM 路网里穿过湖面的路段在三维里会变成悬在水上的白线；
    // 只要有一端落在水面就整段跳过，避免岸线处留下一小截横跨水面的线段
    const onWater = makeWaterTest(city, 15);
    for (const road of city.roads) {
      const c = ROAD_COLORS[road.k] ?? ROAD_COLORS[2];
      const p = road.p;
      for (let i = 1; i < p.length; i++) {
        const [x0, z0] = p[i - 1];
        const [x1, z1] = p[i];
        if (onWater(x0, z0) || onWater(x1, z1)) continue;
        pos.push(x0, sampleHeight(terrain, x0, z0) + 1.4, z0,
                 x1, sampleHeight(terrain, x1, z1) + 1.4, z1);
        col.push(c[0], c[1], c[2], c[0], c[1], c[2]);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [city, terrain]);

  // 年代模式：老年代的现代路网要退到背景，否则 1896 的古城会被高速路穿帮
  const opacity =
    year === undefined ? 0.8 : year < 1949 ? 0.07 : year < 1978 ? 0.16 : year < 1994 ? 0.32 : year < 2010 ? 0.5 : 0.68;

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial vertexColors transparent opacity={opacity} />
    </lineSegments>
  );
};
