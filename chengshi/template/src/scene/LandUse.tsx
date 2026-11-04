import {useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {eraTint} from './Ground';

// 按真实航拍分层：森林最深、园地/公园次之、农田略亮；整体比旧版提一档亮度，
// 近两千片绿地叠在顶点色地形上不再像一块块墨绿补丁，远看不抢城里的建筑。
const GREEN: Record<string, string> = {
  forest: '#3d5c40',
  scrub: '#547049',
  grass: '#67894f',
  park: '#4c7045',
  farm: '#80975b',
  wetland: '#4f7d6b',
  cemetery: '#5f7055',
};

/** 写实底图：把绿地/农田多边形三角化后，按类别各合成一个 mesh（少量 draw call） */
export const LandUse: React.FC<{city: CityData; terrain: Terrain; year?: number}> = ({city, terrain, year}) => {
  const groups = useMemo(() => {
    const byKind: Record<string, number[]> = {};
    for (const lu of city.landuse ?? []) {
      const color = GREEN[lu.t];
      if (!color) continue;
      const pos = (byKind[lu.t] ??= []);
      const contour = lu.p.map(([x, z]) => new THREE.Vector2(x, z));
      let tris: number[][] = [];
      try {
        tris = THREE.ShapeUtils.triangulateShape(contour, []);
      } catch {
        tris = [];
      }
      for (let [a, b, c] of tris) {
        // 统一绕序：保证面朝 +Y（三角化结果绕序不稳定，朝下的面几乎不受光）
        const ux = contour[b].x - contour[a].x;
        const uz = contour[b].y - contour[a].y;
        const vx = contour[c].x - contour[a].x;
        const vz = contour[c].y - contour[a].y;
        if (ux * vz - uz * vx > 0) {
          const t = b;
          b = c;
          c = t;
        }
        for (const v of [a, b, c]) {
          pos.push(contour[v].x, sampleHeight(terrain, contour[v].x, contour[v].y) + 0.3, contour[v].y);
        }
      }
    }
    return Object.entries(byKind).map(([kind, pos]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      // 贴地后法线要跟着坡度走（非索引三角形 → 逐面上法线），平地自然还是 +Y
      g.computeVertexNormals();
      return {kind, geom: g};
    });
  }, [city, terrain]);

  // 与地表顶点色共用同一条 era tint：1896 的绿地压进旧纸色里，不会跳出荧光绿条带
  const colors = useMemo(() => {
    const t = year === undefined ? [1, 1, 1] : eraTint(year);
    const tint = new THREE.Color(t[0], t[1], t[2]);
    const out: Record<string, string> = {};
    for (const [kind, hex] of Object.entries(GREEN)) {
      out[kind] = '#' + new THREE.Color(hex).multiply(tint).getHexString();
    }
    return out;
  }, [year]);

  return (
    <group>
      {groups.map(({kind, geom}) => (
        <mesh key={kind} geometry={geom} receiveShadow>
          <meshStandardMaterial color={colors[kind]} roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
};
