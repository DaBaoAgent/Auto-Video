import {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {smoothstep} from '../theme';
import {applyCloudShadow} from './clouds';

const N = 128;

/** 可平铺的水波法线：几组正弦叠加，周期落在贴图边界上，滚动时不会跳缝 */
const makeRippleNormal = () => {
  const data = new Uint8Array(N * N * 4);
  const waves = [
    {ax: 3, ay: 1, amp: 0.55, ph: 0.0},
    {ax: 5, ay: -2, amp: 0.3, ph: 1.3},
    {ax: 2, ay: 4, amp: 0.22, ph: 2.1},
  ];
  const s = 0.045;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const v = j / N;
      let gx = 0;
      let gy = 0;
      for (const w of waves) {
        const c = Math.cos(2 * Math.PI * (w.ax * u + w.ay * v) + w.ph) * w.amp * 2 * Math.PI;
        gx += c * w.ax;
        gy += c * w.ay;
      }
      const nx = -gx * s;
      const ny = -gy * s;
      const nz = 1;
      const l = Math.hypot(nx, ny, nz);
      const k = (j * N + i) * 4;
      data[k] = Math.round(((nx / l) * 0.5 + 0.5) * 255);
      data[k + 1] = Math.round(((ny / l) * 0.5 + 0.5) * 255);
      data[k + 2] = Math.round(((nz / l) * 0.5 + 0.5) * 255);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.repeat.set(1 / 1800, 1 / 1800);
  tex.needsUpdate = true;
  return tex;
};

export const Water: React.FC<{
  city: CityData;
  terrain: Terrain;
  t: number;
  year?: number;
}> = ({city, terrain, t, year}) => {
  const surface = useMemo(() => {
    const pos: number[] = [];
    for (const poly of city.water) {
      const contour = poly.map(([x, z]) => new THREE.Vector2(x, z));
      // 湖面是一个水平面：取岸线高程的 70 分位再抬一点，兼顾“不淹没岸”和“地形不戳穿湖面”。
      // 卫星底图整体抬了 1.3m，水面也必须压在它上面，否则 2026 的湖面会透出底图的褐色纹理
      const hs = poly.map(([x, z]) => sampleHeight(terrain, x, z)).sort((a, b) => a - b);
      let y = 1.6;
      if (hs.length) y = Math.max(y, hs[Math.floor(hs.length * 0.7)] + 1.8);
      let tris: number[][] = [];
      try {
        tris = THREE.ShapeUtils.triangulateShape(contour, []);
      } catch {
        tris = [];
      }
      for (let [a, b, c] of tris) {
        const ux = contour[b].x - contour[a].x;
        const uz = contour[b].y - contour[a].y;
        const vx = contour[c].x - contour[a].x;
        const vz = contour[c].y - contour[a].y;
        if (ux * vz - uz * vx > 0) {
          const t = b;
          b = c;
          c = t;
        }
        pos.push(contour[a].x, y, contour[a].y,
                 contour[b].x, y, contour[b].y,
                 contour[c].x, y, contour[c].y);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const n = new Float32Array(pos.length);
    for (let i = 1; i < n.length; i += 3) n[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
    const uv = new Float32Array((pos.length / 3) * 2);
    for (let i = 0; i < pos.length / 3; i++) {
      uv[i * 2] = pos[i * 3];
      uv[i * 2 + 1] = pos[i * 3 + 2];
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return g;
  }, [city, terrain]);

  const streams = useMemo(() => {
    const pos: number[] = [];
    for (const line of city.waterways) {
      for (let i = 1; i < line.length; i++) {
        const [x0, z0] = line[i - 1];
        const [x1, z1] = line[i];
        pos.push(x0, sampleHeight(terrain, x0, z0) + 1.0, z0,
                 x1, sampleHeight(terrain, x1, z1) + 1.0, z1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [city, terrain]);

  const {mat, ripple} = useMemo(() => {
    const ripple = makeRippleNormal();
    const mat = new THREE.MeshStandardMaterial({
      // 参考真实航拍：湖水是明确的湖蓝，而不是土黄或墨绿；色相压到蓝侧，别滑向青绿
      color: '#2b668c',
      // 太光滑会在太阳下拍出一整条镜面光带；0.3 保留一点水光但不抢戏
      roughness: 0.3,
      metalness: 0.05,
      transparent: true,
      // 半透明叠在卫星/地表上会透出褐色，水色会被拉灰；提高不透明度让湖蓝立住
      opacity: 0.94,
      // 暖光会把蓝水往灰黄里拉，用冷色自发光把湖蓝托住
      emissive: '#0d3350',
      emissiveIntensity: 0.32,
      normalMap: ripple,
      // 俯瞰时高频水波会在湖面上拍出斜向摩尔纹，压低法线强度并放大纹理尺度
      normalScale: new THREE.Vector2(0.13, 0.13),
    });
    applyCloudShadow(mat);
    return {mat, ripple};
  }, []);

  const canalMat = useMemo(
    () => new THREE.LineBasicMaterial({color: '#2f6f96', transparent: true, opacity: 1}),
    [],
  );

  // 年代水系：越早水色略深、河道越显；近现代暗渠化/填埋后河道退到背景
  const oldness = year === undefined ? 0 : 1 - smoothstep(1950, 2005, year);
  useLayoutEffect(() => {
    // 两个年代都保持湖蓝，早年只是更深一点，不再退回墨绿
    mat.color.setRGB(
      0.15 + (0.10 - 0.15) * oldness,
      0.34 + (0.27 - 0.34) * oldness,
      0.54 + (0.45 - 0.54) * oldness,
    );
    mat.opacity = 0.94;
    canalMat.opacity = year === undefined ? 1 : 0.55 + oldness * 0.4;
    canalMat.transparent = year !== undefined;
  }, [oldness, mat, canalMat, year]);

  // 水波缓慢漂移：两层相位错开的时间，低掠过水面时才看得出流动
  useLayoutEffect(() => {
    ripple.offset.set(t * 0.013, t * 0.007);
  }, [t, ripple]);

  return (
    <group>
      <mesh geometry={surface} material={mat} receiveShadow />
      <lineSegments geometry={streams} material={canalMat} />
    </group>
  );
};
