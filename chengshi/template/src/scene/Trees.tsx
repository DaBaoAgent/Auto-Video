import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';

// 树冠按株变化，深林与嫩绿的层次拉开，避免整片树冠糊成一个色块
const GREENS = ['#264b2c', '#356031', '#43753c', '#213f25', '#4d7f42', '#2f5529'];

/** 林地/公园里的树：一个 InstancedMesh 画完，冠幅低多边形 */
export const Trees: React.FC<{city: CityData; terrain: Terrain}> = ({city, terrain}) => {
  const pts = city.trees ?? [];
  const count = pts.length;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 0);
    g.translate(0, 0.9, 0);
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 1, metalness: 0, flatShading: true}),
    [],
  );

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m || !count) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const [x, z, r] = pts[i];
      o.position.set(x, sampleHeight(terrain, x, z), z);
      o.rotation.set(0, (x * 0.7 + z * 0.3) % Math.PI, 0);
      o.scale.set(r, r * 1.15, r);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      c.set(GREENS[i % GREENS.length]);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;
    m.castShadow = true;
  }, [count, pts, terrain]);

  if (!count) return null;
  return <instancedMesh ref={mesh} args={[geo, mat, count]} />;
};
