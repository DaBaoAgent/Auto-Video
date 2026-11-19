import {useMemo} from 'react';
import type {Ring, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {smoothstep} from '../theme';

// 真实苏州城墙约 10–12m；城市级镜头里 12m 只剩一条线，
// 抬到 26m 才能在 5–8km 机位下读出城墙的厚度和影子（示意夸张）。
const WALL_H = 26;
const WALL_T = 15;

/** 逐朝城墙：沿阖闾大城八边形实体墙 + 八座城门楼；1918–1958 逐步拆除，只留盘门 */
export const Walls: React.FC<{rings: Ring[]; terrain: Terrain; year: number}> = ({rings, terrain, year}) => {
  const ring = rings.find((r) => r.id === 'helv');
  const fade = 1 - smoothstep(1918, 1958, year);
  const op = fade < 0.02 ? 0 : fade;
  // 夯土/青砖都要比地表暗两档，否则 7km 机位下城墙会被绿田吞掉
  const color = year < 589 ? '#6b5334' : year < 1368 ? '#6f675b' : '#655f55';

  const segs = useMemo(() => {
    if (!ring) return [];
    const p = ring.polygon;
    return p.map(([x0, z0], i) => {
      const [x1, z1] = p[(i + 1) % p.length];
      const mx = (x0 + x1) / 2;
      const mz = (z0 + z1) / 2;
      const dx = x1 - x0;
      const dz = z1 - z0;
      const len = Math.hypot(dx, dz);
      return {
        mx,
        mz,
        len: len + 10,
        rot: Math.atan2(-dz, dx),
        y: sampleHeight(terrain, mx, mz),
        gx: x0,
        gz: z0,
      };
    });
  }, [ring, terrain]);

  if (!ring || op === 0) return null;

  return (
    <group>
      {segs.map((s, i) => (
        <group key={`w${i}`}>
          <mesh
            position={[s.mx, s.y + WALL_H / 2, s.mz]}
            rotation={[0, s.rot, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[s.len, WALL_H, WALL_T]} />
            <meshStandardMaterial color={color} roughness={0.92} metalness={0} transparent opacity={op} />
          </mesh>
          {/* 墙顶女墙压边 */}
          <mesh position={[s.mx, s.y + WALL_H + 0.6, s.mz]} rotation={[0, s.rot, 0]}>
            <boxGeometry args={[s.len, 1.2, WALL_T + 1.4]} />
            <meshStandardMaterial color="#6f6a62" roughness={0.9} transparent opacity={op} />
          </mesh>
        </group>
      ))}
      {segs.map((s, i) => {
        const gy = s.y;
        return (
          <group key={`g${i}`} position={[s.gx, gy, s.gz]}>
            {/* 城台 */}
            <mesh position={[0, WALL_H * 0.55, 0]} castShadow receiveShadow>
              <boxGeometry args={[26, WALL_H * 1.1, 20]} />
              <meshStandardMaterial color={color} roughness={0.92} transparent opacity={op} />
            </mesh>
            {/* 门洞 */}
            <mesh position={[0, 4, 0]}>
              <boxGeometry args={[9, 8, 21]} />
              <meshStandardMaterial color="#26221e" roughness={1} transparent opacity={op} />
            </mesh>
            {/* 城楼 */}
            <mesh position={[0, WALL_H * 1.1 + 3.4, 0]} castShadow>
              <boxGeometry args={[17, 6.8, 12]} />
              <meshStandardMaterial color="#7c5138" roughness={0.8} transparent opacity={op} />
            </mesh>
            <mesh position={[0, WALL_H * 1.1 + 8.2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[11, 1, 8]} castShadow>
              <coneGeometry args={[1, 4.6, 4]} />
              <meshStandardMaterial color="#3c4247" roughness={0.8} transparent opacity={op} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
