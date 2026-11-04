import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';

const D2R = Math.PI / 180;

/** 沿折线走弧长 dist，返回位置与朝向 */
const alongPath = (pts: number[][], cum: number[], dist: number) => {
  const total = cum[cum.length - 1];
  let d = ((dist % total) + total) % total;
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const seg = Math.max(1e-6, cum[lo + 1] - cum[lo]);
  const f = (d - cum[lo]) / seg;
  const [x0, z0] = pts[lo];
  const [x1, z1] = pts[lo + 1];
  return {
    x: x0 + (x1 - x0) * f,
    z: z0 + (z1 - z0) * f,
    dx: (x1 - x0) / seg,
    dz: (z1 - z0) / seg,
  };
};

type Boat = {dist: number; speed: number};

const CanalBoats: React.FC<{city: CityData; terrain: Terrain; t: number}> = ({city, terrain, t}) => {
  const boatsRef = useRef<THREE.Group[]>([]);

  const path = useMemo(() => {
    let best: number[][] = [];
    let bestLen = 0;
    for (const line of city.waterways) {
      let len = 0;
      for (let i = 1; i < line.length; i++) len += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
      if (len > bestLen) {
        bestLen = len;
        best = line;
      }
    }
    const cum = [0];
    for (let i = 1; i < best.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(best[i][0] - best[i - 1][0], best[i][1] - best[i - 1][1]));
    }
    return {pts: best, cum, total: bestLen};
  }, [city]);

  const boats: Boat[] = useMemo(
    () => [0, 1, 2].map((i) => ({dist: i * (path.total / 3) + 180 * i, speed: 1.5 + i * 0.5})),
    [path],
  );

  useLayoutEffect(() => {
    if (path.total < 50) return;
    boats.forEach((b, i) => {
      const g = boatsRef.current[i];
      if (!g) return;
      const p = alongPath(path.pts, path.cum, b.dist + t * b.speed);
      g.position.set(p.x, sampleHeight(terrain, p.x, p.z) + 0.9, p.z);
      g.rotation.y = Math.atan2(-p.dz, p.dx);
    });
  }, [t, boats, path, terrain]);

  if (path.total < 50) return null;
  return (
    <group>
      {boats.map((_, i) => (
        <group
          key={`b${i}`}
          ref={(el) => {
            if (el) boatsRef.current[i] = el;
          }}
        >
          {/* 船身 */}
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[6.4, 1.1, 2.2]} />
            <meshStandardMaterial color="#413226" roughness={0.9} />
          </mesh>
          {/* 乌篷 */}
          <mesh position={[-0.6, 1.25, 0]} castShadow>
            <boxGeometry args={[2.8, 1.2, 1.7]} />
            <meshStandardMaterial color="#2c2622" roughness={0.95} />
          </mesh>
          {/* 船尾拖出的水痕 */}
          <mesh position={[-6.5, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[7.5, 1.6]} />
            <meshBasicMaterial color="#dfeef2" transparent opacity={0.16} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const LakeSailboats: React.FC<{origin: [number, number]; terrain: Terrain; t: number}> = ({origin, terrain, t}) => {
  const boats = useMemo(
    () =>
      [
        {lon: 120.405, lat: 31.238, ph: 0.3},
        {lon: 120.436, lat: 31.2425, ph: 1.9},
      ].map((b) => {
        const coslat = Math.cos(origin[1] * D2R);
        return {
          x: (b.lon - origin[0]) * 111320 * coslat,
          z: -(b.lat - origin[1]) * 110540,
          ph: b.ph,
        };
      }),
    [origin],
  );

  const gs = useRef<THREE.Group[]>([]);
  useLayoutEffect(() => {
    boats.forEach((b, i) => {
      const g = gs.current[i];
      if (!g) return;
      const x = b.x + Math.sin(t * 0.02 + b.ph) * 40;
      const z = b.z + Math.cos(t * 0.017 + b.ph) * 30;
      g.position.set(x, sampleHeight(terrain, x, z) + 0.6, z);
      g.rotation.y = 0.5 + Math.sin(t * 0.02 + b.ph) * 0.1;
      g.rotation.z = Math.sin(t * 0.9 + b.ph) * 0.02;
    });
  }, [t, boats, terrain]);

  return (
    <group>
      {boats.map((b, i) => (
        <group
          key={`s${i}`}
          ref={(el) => {
            if (el) gs.current[i] = el;
          }}
        >
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[7.5, 1.0, 2.4]} />
            <meshStandardMaterial color="#4a3b2c" roughness={0.9} />
          </mesh>
          {/* 软帆：一块竖直四边形，落日下成暖白色剪影 */}
          <mesh position={[-2.6, 4.2, 0]} rotation={[0, Math.PI / 2, 0.14]}>
            <planeGeometry args={[5.2, 7.6]} />
            <meshStandardMaterial color="#f2e4c8" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[2.4, 3.2, 0]} rotation={[0, Math.PI / 2, -0.1]}>
            <planeGeometry args={[2.6, 4.6]} />
            <meshStandardMaterial color="#eadcbe" roughness={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-6.2, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[9, 2.2]} />
            <meshBasicMaterial color="#eaf4f2" transparent opacity={0.14} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const BIRD_N = 14;

const Flock: React.FC<{cx: number; cz: number; alt: number; radius: number; speed: number; ph: number; t: number; terrain: Terrain}> = ({
  cx,
  cz,
  alt,
  radius,
  speed,
  ph,
  t,
  terrain,
}) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < BIRD_N; i++) {
      const a = ph + (t * speed) / radius + i * 0.35;
      // V 字队形：每只鸟跟在前一只的后侧
      const back = i * 6.5;
      const side = (i % 2 === 0 ? 1 : -1) * Math.ceil(i / 2) * 5.5;
      const x = cx + Math.sin(a) * (radius - back * 0.35) + Math.cos(a) * side;
      const z = cz + Math.cos(a) * (radius - back * 0.35) - Math.sin(a) * side;
      o.position.set(x, sampleHeight(terrain, x, z) + alt + Math.sin(t * 0.8 + i) * 2.5, z);
      o.rotation.set(Math.sin(t * 6.5 + i * 1.9) * 0.55, -(a + Math.PI / 2), 0);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
  }, [t, cx, cz, alt, radius, speed, ph, terrain]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, BIRD_N]}>
      <boxGeometry args={[1.5, 0.09, 0.5]} />
      <meshStandardMaterial color="#2e2a25" roughness={1} />
    </instancedMesh>
  );
};

export const Dynamics: React.FC<{city: CityData; terrain: Terrain; t: number}> = ({city, terrain, t}) => {
  const origin = city.origin;
  const coslat = Math.cos(origin[1] * D2R);
  const toXZ = (lon: number, lat: number): [number, number] => [
    (lon - origin[0]) * 111320 * coslat,
    -(lat - origin[1]) * 110540,
  ];
  const [b1x, b1z] = toXZ(120.446, 31.2325);
  const [b2x, b2z] = toXZ(120.6175, 31.3265);

  return (
    <group>
      <CanalBoats city={city} terrain={terrain} t={t} />
      <LakeSailboats origin={origin} terrain={terrain} t={t} />
      <Flock cx={b1x} cz={b1z} alt={46} radius={90} speed={9} ph={0.7} t={t} terrain={terrain} />
      <Flock cx={b2x} cz={b2z} alt={88} radius={70} speed={11} ph={2.4} t={t} terrain={terrain} />
    </group>
  );
};
