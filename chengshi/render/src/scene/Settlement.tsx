import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {Terrain} from '../types';
import {sampleHeight} from '../terrain';
import type {Hut} from './ancientLayout';

const EARTH = ['#b5a27c', '#a89570', '#bdaa85', '#9f8d6a'];
const THATCH = ['#5c5142', '#655948', '#51483b'];

/**
 * 前 514—前 221 年阖闾城内的聚落。
 * 布局（含沿街成排的房子）统一由 ancientLayout 生成，
 * 这里只负责把 hut 列表画成土屋 + 茅草屋顶。
 */
export const Settlement: React.FC<{
  huts: Hut[];
  terrain: Terrain;
  year: number;
}> = ({huts, terrain, year}) => {
  const body = useRef<THREE.InstancedMesh>(null);
  const roof = useRef<THREE.InstancedMesh>(null);

  const count = huts.length;
  const {bodyGeo, roofGeo, bodyMat, roofMat} = useMemo(() => {
    const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
    bodyGeo.translate(0, 0.5, 0);
    // 四棱锥压扁当茅草/瓦顶，底边与屋身对齐
    const roofGeo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4);
    roofGeo.rotateY(Math.PI / 4);
    const bodyMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.95, metalness: 0});
    const roofMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.92, metalness: 0});
    return {bodyGeo, roofGeo, bodyMat, roofMat};
  }, []);

  useLayoutEffect(() => {
    const bm = body.current;
    const rm = roof.current;
    if (!bm || !rm) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    const zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
    for (let i = 0; i < count; i++) {
      bm.setMatrixAt(i, zero);
      rm.setMatrixAt(i, zero);
    }
    huts.forEach((h, i) => {
      const y = sampleHeight(terrain, h.x, h.z);
      const rad = (h.ang * Math.PI) / 180;
      o.position.set(h.x, y - 0.8, h.z);
      o.rotation.set(0, rad, 0);
      o.scale.set(h.len, h.h + 0.8, h.wid);
      o.updateMatrix();
      bm.setMatrixAt(i, o.matrix);
      c.set(EARTH[i % EARTH.length]);
      bm.setColorAt(i, c);

      const roofH = Math.min(5.2, Math.max(2.8, Math.min(h.len, h.wid) * 0.4));
      o.position.set(h.x, y + h.h, h.z);
      o.rotation.set(0, rad, 0);
      o.scale.set(h.len * 1.12, roofH, h.wid * 1.12);
      o.updateMatrix();
      rm.setMatrixAt(i, o.matrix);
      c.set(THATCH[i % THATCH.length]);
      rm.setColorAt(i, c);
    });
    bm.instanceMatrix.needsUpdate = true;
    if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
    rm.instanceMatrix.needsUpdate = true;
    if (rm.instanceColor) rm.instanceColor.needsUpdate = true;
    bm.frustumCulled = false;
    rm.frustumCulled = false;
  }, [huts, count, terrain]);

  if (year < -514 || year > -100 || !count) return null;

  return (
    <group>
      <instancedMesh ref={body} args={[bodyGeo, bodyMat, count]} castShadow receiveShadow />
      <instancedMesh ref={roof} args={[roofGeo, roofMat, count]} castShadow />
    </group>
  );
};
