import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {CityData, Ring, Terrain} from '../types';
import {clamp, smoothstep} from '../theme';
import {sampleHeight} from '../terrain';
import {makeWaterTest} from './waterMask';
import type {WaterTest} from './waterMask';

// 略饱和的金黄：在暖色秋景卫星图上仍能与地表拉开 r-b 差值
const GOLD = new THREE.Color('#ffc94a');
const HALF_W = 8;

/**
 * 年轮金线：贴着当年城墙/水岸边界画一条两三角宽的发光带。
 * 几何体按地面高程逐点落位，不是悬浮光环；shader 里按长度比例"描线"出现。
 */
const buildRibbon = (ring: Ring, terrain: Terrain, isWater: WaterTest) => {
  const poly = ring.polygon;
  const n = poly.length;
  // 平滑折线：Catmull-Rom 闭曲线，每段约 40m 取一点
  const curve = new THREE.CatmullRomCurve3(
    poly.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    'catmullrom',
    0.15,
  );
  const approxLen = curve.getLength();
  const steps = Math.min(900, Math.max(64, Math.round(approxLen / 40)));
  const pts = curve.getSpacedPoints(steps);
  pts.pop(); // 闭合曲线首尾重复

  let cx = 0;
  let cz = 0;
  for (const p of poly) {
    cx += p[0];
    cz += p[1];
  }
  cx /= n;
  cz /= n;

  const m = pts.length;
  const pos = new Float32Array(m * 2 * 3);
  const cen = new Float32Array(m * 2 * 3);
  const uv = new Float32Array(m * 2 * 2);
  const wat = new Float32Array(m * 2);
  for (let i = 0; i < m; i++) {
    const p = pts[i];
    const prev = pts[(i - 1 + m) % m];
    const next = pts[(i + 1) % m];
    let tx = next.x - prev.x;
    let tz = next.z - prev.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl;
    tz /= tl;
    // 法线朝城外，避免金线被城墙挡住
    let nx = -tz;
    let nz = tx;
    if (nx * (p.x - cx) + nz * (p.z - cz) < 0) {
      nx = -nx;
      nz = -nz;
    }
    const cy = sampleHeight(terrain, p.x, p.z) + 2.2;
    const wet = isWater(p.x, p.z) ? 1 : 0;
    for (let s = 0; s < 2; s++) {
      const k = (i * 2 + s) * 3;
      const side = s === 0 ? 1 : -1;
      const x = p.x + nx * HALF_W * side;
      const z = p.z + nz * HALF_W * side;
      pos[k] = x;
      pos[k + 1] = sampleHeight(terrain, x, z) + 2.2;
      pos[k + 2] = z;
      cen[k] = p.x;
      cen[k + 1] = cy;
      cen[k + 2] = p.z;
      const t = (i * 2 + s) * 2;
      uv[t] = i / m;
      uv[t + 1] = s;
      wat[i * 2 + s] = wet;
    }
  }

  const idx: number[] = [];
  for (let i = 0; i < m; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = ((i + 1) % m) * 2;
    const d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aCenter', new THREE.BufferAttribute(cen, 3));
  g.setAttribute('aWater', new THREE.BufferAttribute(wat, 1));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
};

const RingBand: React.FC<{
  ring: Ring;
  terrain: Terrain;
  geometry: THREE.BufferGeometry;
  progress: number;
  alpha: number;
  t: number;
  viewportH: number;
  boost: number;
}> = ({ring, geometry, progress, alpha, t, viewportH, boost}) => {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uProg: {value: 0},
      uAlpha: {value: 0},
      uTime: {value: 0},
      uColor: {value: GOLD.clone()},
      uMinPx: {value: 4.4},
      uHalfW: {value: HALF_W},
      uViewportH: {value: 2160},
      uBoost: {value: 1},
    }),
    [],
  );

  useLayoutEffect(() => {
    uniforms.uViewportH.value = viewportH;
    uniforms.uBoost.value = boost;
  }, [uniforms, viewportH, boost]);

  useLayoutEffect(() => {
    uniforms.uProg.value = progress;
    uniforms.uAlpha.value = alpha;
    uniforms.uTime.value = t;
  }, [progress, alpha, t, uniforms]);

  if (alpha <= 0.002) return null;
  return (
    <mesh geometry={geometry} renderOrder={6}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        // 金线贴地，必须参与深度测试：关掉后它会从高楼和湖面上穿过去
        depthTest
        // 城市级俯瞰下加法混合会被明亮卫星底图的自身亮度吃掉（实测线内反而更暗），
        // 改用预乘 alpha 的普通混合：金线以真实金色覆盖地面，任何光照下都清晰可辨
        premultipliedAlpha
        blending={THREE.NormalBlending}
        vertexShader={`
          attribute vec3 aCenter;
          attribute float aWater;
          uniform float uMinPx;
          uniform float uHalfW;
          uniform float uViewportH;
          varying vec2 vUv;
          varying float vDist;
          varying float vWater;
          void main() {
            vUv = uv;
            vWater = aWater;
            vec4 cWorld = modelMatrix * vec4(aCenter, 1.0);
            vec4 pWorld = modelMatrix * vec4(position, 1.0);
            float dist = length(cameraPosition - cWorld.xyz);
            float pxPerMeter = projectionMatrix[1][1] * 0.5 * uViewportH / max(dist, 1.0);
            float wantHalf = uMinPx / max(pxPerMeter, 1e-5);
            // 远处把带子放宽到屏幕最小宽度，27km 全景里金线仍然是线而不是断点
            float k = clamp(wantHalf / uHalfW, 1.0, 8.0);
            pWorld.xz = cWorld.xz + (pWorld.xz - cWorld.xz) * k;
            vec4 mv = viewMatrix * pWorld;
            vDist = length(mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          uniform float uProg;
          uniform float uAlpha;
          uniform float uTime;
          uniform float uBoost;
          uniform vec3 uColor;
          varying vec2 vUv;
          varying float vDist;
          varying float vWater;
          void main() {
            if (vWater > 0.15) discard;
            float edge = smoothstep(0.0, 0.38, vUv.y) * smoothstep(1.0, 0.62, vUv.y);
            float body = 1.0 - smoothstep(uProg - 0.004, uProg, vUv.x);
            float head = exp(-pow((uProg - vUv.x) / 0.012, 2.0)) * step(vUv.x, uProg);
            float pulse = 0.82 + 0.18 * sin(vUv.x * 46.0 - uTime * 1.5);
            // 近景收敛：贴地金线是航拍语言，掠过时不铺满画面
            float near = smoothstep(350.0, 1600.0, vDist);
            float a = edge * (body * 0.85 + head * 1.2) * pulse * uAlpha * near * uBoost;
            if (a < 0.004) discard;
            gl_FragColor = vec4(uColor * a, a);
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
};

export const Rings: React.FC<{
  rings: Ring[];
  terrain: Terrain;
  year: number;
  t: number;
  height: number;
  city?: CityData;
  /** film：原片的 t 驱动；year：样片/静帧按年份直接点亮 */
  variant?: 'film' | 'year';
  /** 静帧：金线直接画满，不留半截断头的「描线中」状态 */
  instant?: boolean;
}> = ({rings, terrain, year, t, height, city, variant = 'film', instant}) => {
  const geos = useMemo(() => {
    // 40m 外扩：金线在离岸前就断，避免在湖面中间出现生硬的断头
    const isWater = makeWaterTest(city, 40);
    return rings.map((r) => buildRibbon(r, terrain, isWater));
  }, [rings, terrain, city]);
  const finale = variant === 'film' && t >= 143;

  return (
    <group>
      {rings.map((ring, i) => {
        let progress = 0;
        let alpha = 0;
        if (variant === 'year') {
          if (ring.id === 'helv') {
            // 金线从筑城那一年开始沿城墙描，到 1896 已完整一圈
            progress = instant ? 1 : clamp((year + 514) / (1896 + 514), 0, 1);
            alpha = year >= -514 ? 0.95 : 0;
          } else {
            const from = ring.assign_year ?? ring.year;
            progress = instant
              ? year >= from
                ? 1
                : 0
              : clamp((year - from) / Math.max(1, ring.year - from), 0, 1);
            alpha = year >= from ? 0.82 : 0;
          }
        } else if (ring.id === 'helv') {
          // 第一章：城墙落成时沿 boundary 描出，之后一镜到底里常驻
          progress = smoothstep(15.2, 29.5, t);
          alpha = smoothstep(14.6, 16.2, t) * 0.95;
        } else {
          // 2003 / 2015 扩城：年份跨过哪一年，哪一圈点亮并保留
          progress = clamp((year - ring.year) / 8, 0, 1);
          alpha = year >= ring.year ? 0.82 : 0;
        }
        if (finale) {
          // 拉升揭示城市轮廓：三圈金线在镜头后退时依次描出，落在片尾字幕之前
          const start = 143.4 + i * 0.55;
          const p2 = clamp((t - start) / 2.2, 0, 1);
          progress = Math.max(progress, p2);
          alpha = Math.max(alpha, p2);
        }
        return (
          <RingBand
            key={ring.id}
            ring={ring}
            terrain={terrain}
            geometry={geos[i]}
            progress={progress}
            alpha={alpha}
            t={t}
            viewportH={height}
            boost={finale ? 1.6 : year >= 2024 ? 1.3 : 1}
          />
        );
      })}
    </group>
  );
};
