import {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';

const hash = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** 圆形光斑贴图：一次画好，城市灯海和路灯共用 */
const makeGlow = () => {
  const s = 64;
  const c = document.createElement('canvas');
  c.width = s;
  c.height = s;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.18, 'rgba(255,255,255,0.9)');
  grd.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

const WARM = ['#ffd9a2', '#ffc477', '#ffe6bd', '#ffb260'];
const COOL = ['#cfe0ff', '#b9d4ff', '#e6f0ff'];

/** 远距离补偿：27km 全景里点光源按透视缩成亚像素，按机距放宽，近景不变 */
const makePointsMaterial = (glow: THREE.Texture, size: number) => {
  const m = new THREE.PointsMaterial({
    map: glow,
    size,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      'if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );',
      'if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z ) * clamp( - mvPosition.z / 9000.0, 1.0, 3.4 );',
    );
  };
  m.customProgramCacheKey = () => 'city-lights-farboost';
  return m;
};

export const Lights: React.FC<{city: CityData; terrain: Terrain; night: number}> = ({city, terrain, night}) => {
  const {bGeo, rGeo, bMat, rMat} = useMemo(() => {
    const glow = makeGlow();

    // 楼宇窗灯：按哈希抽样，楼高的点抬到 0.75 楼高处
    const bp: number[] = [];
    const bc: number[] = [];
    const col = new THREE.Color();
    city.buildings.forEach((b, i) => {
      if (i % 2 !== 0) return;
      const [cx, cz, len, wid, , hgt, yr] = b;
      const jx = (hash(cx, cz) - 0.5) * Math.min(len, 40);
      const jz = (hash(cz, cx) - 0.5) * Math.min(wid, 40);
      const x = cx + jx;
      const z = cz + jz;
      const gy = sampleHeight(terrain, x, z);
      const pal = yr >= 1994 && hgt > 40 && hash(cz, cx + 11) > 0.45 ? COOL : WARM;
      const k = Math.floor(hash(cx + 1.7, cz - 2.3) * pal.length);
      col.set(pal[k]);
      bp.push(x, gy + hgt * (0.6 + 0.25 * hash(cx + 7, cz + 3)), z);
      bc.push(col.r, col.g, col.b);
      // 高层再补一盏，城市天际线更亮
      if (hgt > 40) {
        bp.push(x, gy + hgt * 0.92, z);
        bc.push(col.r, col.g, col.b);
      }
    });
    const bGeo = new THREE.BufferGeometry();
    bGeo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
    bGeo.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));

    // 路灯：沿道路每约 260m 一盏
    const rp: number[] = [];
    const rc: number[] = [];
    for (const road of city.roads) {
      if (road.k < 2) continue;
      for (const line of [road.p]) {
        for (let i = 1; i < line.length; i++) {
          const [x0, z0] = line[i - 1];
          const [x1, z1] = line[i];
          const seg = Math.hypot(x1 - x0, z1 - z0);
          const n = Math.floor(seg / 260);
          if (!n) continue;
          for (let s = 1; s < n; s++) {
            const f = s / n;
            const x = x0 + (x1 - x0) * f + (hash(x0 + s, z0) - 0.5) * 22;
            const z = z0 + (z1 - z0) * f + (hash(z0 + s, x0) - 0.5) * 22;
            rp.push(x, sampleHeight(terrain, x, z) + 9, z);
            col.set(WARM[s % 4]);
            rc.push(col.r * 0.9, col.g * 0.85, col.b * 0.8);
          }
        }
      }
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
    rGeo.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));

    return {bGeo, rGeo, bMat: makePointsMaterial(glow, 58), rMat: makePointsMaterial(glow, 38)};
  }, [city, terrain]);

  useLayoutEffect(() => {
    bMat.opacity = night;
    rMat.opacity = night;
  }, [night, bMat, rMat]);

  if (night <= 0.01) return null;
  return (
    <group>
      <points geometry={bGeo} material={bMat} />
      <points geometry={rGeo} material={rMat} />
    </group>
  );
};
