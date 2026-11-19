import * as THREE from 'three';

/** 云影共享 uniform：CityScene 每帧只改这几个值，所有注入了云影的材质一起动 */
export const CLOUD_UNIFORMS = {
  uCloudMap: {value: null as THREE.Texture | null},
  uCloudOffset: {value: new THREE.Vector2(0, 0)},
  uCloudScale: {value: 1 / 17000},
  uCloudStrength: {value: 0.34},
};

const SIZE = 256;

const hash2 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 可平铺 value-noise：格点坐标按 SIZE 取模，保证接缝无缝 */
const noise = (x: number, y: number, period: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = x - xi;
  const v = y - yi;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const wrap = (n: number) => ((n % period) + period) % period;
  const a = hash2(wrap(xi), wrap(yi));
  const b = hash2(wrap(xi + 1), wrap(yi));
  const c = hash2(wrap(xi), wrap(yi + 1));
  const d = hash2(wrap(xi + 1), wrap(yi + 1));
  return a * (1 - su) * (1 - sv) + b * su * (1 - sv) + c * (1 - su) * sv + d * su * sv;
};

/** 生成一张无缝云量贴图（r 通道），CPU 一次性算好，渲染时只做一次采样 */
export const makeCloudTexture = () => {
  if (CLOUD_UNIFORMS.uCloudMap.value) return CLOUD_UNIFORMS.uCloudMap.value as THREE.DataTexture;
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      let f = 0;
      let amp = 0.55;
      let per = 4;
      let fx = (i / SIZE) * per;
      let fy = (j / SIZE) * per;
      for (let o = 0; o < 4; o++) {
        f += noise(fx, fy, per) * amp;
        amp *= 0.5;
        per *= 2;
        fx *= 2;
        fy *= 2;
      }
      // 云量做对比拉伸：大片晴空 + 几团絮状阴影
      const c = Math.max(0, Math.min(1, (f - 0.45) / 0.42));
      const v = Math.round(Math.pow(c, 1.35) * 255);
      const k = (j * SIZE + i) * 4;
      data[k] = v;
      data[k + 1] = v;
      data[k + 2] = v;
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  CLOUD_UNIFORMS.uCloudMap.value = tex;
  return tex;
};

/**
 * 给标准材质注入世界坐标云影：地面/建筑/屋面的漫反射乘一个随云图滚动的阴影系数。
 * 用一张贴图而不是片元里堆噪声，SwiftShader 软渲染 4K 时才扛得住。
 */
export const applyCloudShadow = (
  material: THREE.MeshStandardMaterial,
  opts?: {
    /** 楼体底部压暗：只对 Box 楼体有效（局部 y 0–1） */
    baseAO?: boolean;
  },
) => {
  makeCloudTexture();
  material.onBeforeCompile = (shader) => {
    (shader.uniforms as Record<string, THREE.IUniform>).uCloudMap = CLOUD_UNIFORMS.uCloudMap;
    (shader.uniforms as Record<string, THREE.IUniform>).uCloudOffset = CLOUD_UNIFORMS.uCloudOffset;
    (shader.uniforms as Record<string, THREE.IUniform>).uCloudScale = CLOUD_UNIFORMS.uCloudScale;
    (shader.uniforms as Record<string, THREE.IUniform>).uCloudStrength = CLOUD_UNIFORMS.uCloudStrength;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec2 vCloudXZ;${opts?.baseAO ? '\n        varying float vBaseAO;' : ''}`,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vec4 cloudWorld = modelMatrix * vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          cloudWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #endif
        vCloudXZ = cloudWorld.xz;${opts?.baseAO ? '\n        vBaseAO = position.y;' : ''}`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec2 vCloudXZ;
        uniform sampler2D uCloudMap;
        uniform vec2 uCloudOffset;
        uniform float uCloudScale;
        uniform float uCloudStrength;${opts?.baseAO ? '\n        varying float vBaseAO;' : ''}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float cloudShade = texture2D(uCloudMap, vCloudXZ * uCloudScale + uCloudOffset).r;
        diffuseColor.rgb *= 1.0 - cloudShade * uCloudStrength;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>${
          opts?.baseAO
            ? '\ngl_FragColor.rgb *= mix(0.55, 1.0, smoothstep(0.0, 0.2, vBaseAO));'
            : ''
        }`,
      );
  };
  material.needsUpdate = true;
};
