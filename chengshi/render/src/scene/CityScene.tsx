import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {ThreeCanvas} from '@remotion/three';
import type {CityData, Era, Landmark, Ring, Terrain} from '../types';
import type {CamState} from '../camera';
import {cityShotAt} from '../camera';
import type {Satellite} from '../data';
import {nightAt, lightRigAt, eraPhaseAt} from '../lighting';
import {CLOUD_UNIFORMS} from './clouds';
import {CameraRig} from './CameraRig';
import {Ground} from './Ground';
import {Landmarks} from './Landmarks';
import {LandUse} from './LandUse';
import {Trees} from './Trees';
import {Roads} from './Roads';
import {Water} from './Water';
import {Buildings} from './Buildings';
import {Settlement} from './Settlement';
import {AncientCity} from './AncientCity';
import {buildAncientLayout} from './ancientLayout';
import {Shantang} from './Shantang';
import {Aperture} from './Aperture';
import {Walls} from './Walls';
import {Rings} from './Rings';
import {Lights} from './Lights';
import {Dynamics} from './Dynamics';

/** 固定太阳方向：西南偏西 22° 仰角。11° 时影子是楼高的 5 倍，会糊成黑贴片；
 *  22° 仍有长影，但楼与楼之间能读出体积 */
const SUN_DIR = new THREE.Vector3(-26000, 11500, 12200).normalize();
const SUN_DIST = 36000;

/**
 * R3F 只写 shadow.camera 的 left/right/top/bottom，不会重算投影矩阵，必须手动更新。
 * 阴影范围不再固定 ±22km（那样 10.7m 一个 texel，9m 楼没有影子），
 * 改成按当前镜头的可视范围收紧，并让光源/目标跟随镜头焦点。
 */
const Sun: React.FC<{
  color: string;
  intensity: number;
  focusX: number;
  focusZ: number;
  half: number;
}> = ({color, intensity, focusX, focusZ, half}) => {
  const ref = useRef<THREE.DirectionalLight>(null);
  useLayoutEffect(() => {
    const light = ref.current;
    if (!light) return;
    const cam = light.shadow.camera;
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.near = 2000;
    cam.far = 90000;
    cam.updateProjectionMatrix();
    light.target.position.set(focusX, 0, focusZ);
    light.target.updateMatrixWorld();
    light.position.set(
      focusX + SUN_DIR.x * SUN_DIST,
      SUN_DIR.y * SUN_DIST,
      focusZ + SUN_DIR.z * SUN_DIST,
    );
    light.updateMatrixWorld();
  }, [focusX, focusZ, half]);
  return (
    <directionalLight
      ref={ref}
      intensity={intensity}
      color={color}
      castShadow
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-bias={-0.00008}
      shadow-normalBias={1.2}
    />
  );
};

type Props = {
  city: CityData;
  terrain: Terrain;
  rings: Ring[];
  eras: Era[];
  t: number;
  year: number;
  width: number;
  height: number;
  landmarks?: Landmark[];
  satellite?: Satellite | null;
  /** 样片：地表/水系/道路/金线按年份替换，机位走样片航线 */
  yearMode?: boolean;
  /** 静帧：建筑直接铺到该年份 */
  fixedYear?: number;
  capHeights?: boolean;
  shotAt?: (t: number) => CamState;
  /** 卫星影像透明度覆盖（0=纯地形色块，1=全影像） */
  satOpacity?: number;
  /** 夜景强度覆盖（0=金色时刻，1=蓝调亮灯） */
  nightOverride?: number;
  /** 样片：光圈从无到有长出来（默认静态显示，不影响正片与静帧） */
  apertureGrow?: boolean;
};

export const CityScene: React.FC<Props> = ({
  city,
  terrain,
  rings,
  eras,
  t,
  year,
  width,
  height,
  landmarks,
  satellite,
  yearMode,
  fixedYear,
  capHeights,
  shotAt,
  satOpacity,
  nightOverride,
  apertureGrow,
}) => {
  const night = nightOverride ?? nightAt(t);
  const rig = lightRigAt(night, eraPhaseAt(t));

  // 当前机位既是渲染相机的来源，也是阴影范围的依据：
  // 镜头越近，阴影贴图覆盖越小、阴影越实；宽景则自动放宽，避免影子跑出画面。
  const camNow = useMemo(
    () => (shotAt ?? ((tt: number) => cityShotAt(city.origin, terrain, tt)))(t),
    [shotAt, t, city.origin, terrain],
  );
  const camDist = Math.hypot(
    camNow.pos[0] - camNow.target[0],
    camNow.pos[1] - camNow.target[1],
    camNow.pos[2] - camNow.target[2],
  );
  const shadowHalf = Math.min(
    16000,
    Math.max(1400, camDist * Math.tan((camNow.fov * Math.PI) / 360) * 1.45),
  );
  const focusX = camNow.target[0];
  const focusZ = camNow.target[2];
  // 年代模式是俯拍旧城：屋顶占画面主体，黄金时刻的低角度太阳照不到坡屋面，
  // 只靠原来的环境光会把屋顶压成墨块。这里提亮环境/半球光并加一点雾，让屋面有层次。
  // 入夜镜头要收回这套「白天补光」，否则夜里的运河仍是暖白日光。
  const eraLight = yearMode ? 1 - night * 0.6 : 0;
  const ambient = rig.ambientIntensity * (1 + 0.35 * eraLight);
  const hemi = rig.hemiIntensity * (1 + 0.6 * eraLight);
  const sun = rig.sunIntensity * (1 - 0.12 * eraLight);
  const fill = rig.fillIntensity * (1 + 0.3 * eraLight);
  const fogDensity = rig.fogDensity * 1.2 * (1 + 0.4 * eraLight);
  // 年代模式按真实航拍配色：把金色时刻的暖光收回来一些，湖蓝和植绿才不会被烤成土黄
  const mixHex = (a: string, b: string, p: number) =>
    '#' + new THREE.Color(a).lerp(new THREE.Color(b), p).getHexString();
  const day = yearMode ? 0.8 * (1 - night) : 0;
  const sunColor = mixHex(rig.sunColor, '#fff6ec', day);
  const ambientColor = mixHex(rig.ambientColor, '#c6cbc4', day);
  const hemiSky = mixHex(rig.hemiSky, '#dfe9f4', day);
  const hemiGround = mixHex(rig.hemiGround, '#4a5344', day);
  const fogColor = mixHex(rig.fogColor, '#dfe4e0', day * 0.85);

  // 云影随风滚动；入夜后云影自然淡出
  CLOUD_UNIFORMS.uCloudOffset.value.set(t * 0.00055, t * -0.00032);
  CLOUD_UNIFORMS.uCloudStrength.value = 0.24 * (1 - night * 0.85);

  let extent = 4000;
  const [minX, minZ, maxX, maxZ] = city.bbox;
  extent = Math.max(Math.abs(minX), Math.abs(maxX), Math.abs(minZ), Math.abs(maxZ));
  for (const r of rings) {
    for (const [x, z] of r.polygon) extent = Math.max(extent, Math.abs(x), Math.abs(z));
  }
  const size = extent * 2.9;
  const helvRing = rings.find((r) => r.id === 'helv');
  // 先秦城市细节层只在 -520～-80 年存在；其余年代不生成，避免给全片白算
  const ancientOn = year >= -520 && year <= -80 && !!helvRing;
  const ancient = useMemo(
    () => (ancientOn && helvRing ? buildAncientLayout(city, helvRing) : null),
    [ancientOn, city, helvRing],
  );

  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      style={{position: 'absolute', inset: 0, filter: 'contrast(1.03) saturate(1.0) brightness(1.0)'}}
      gl={{antialias: true, alpha: true, preserveDrawingBuffer: true, toneMappingExposure: 1 + 0.1 * eraLight}}
      camera={{fov: 38, near: 2, far: 260000, position: [0, 8000, 8000]}}
    >
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />
      <ambientLight intensity={ambient} color={ambientColor} />
      <hemisphereLight args={[hemiSky, hemiGround, hemi]} />
      <Sun color={sunColor} intensity={sun} focusX={focusX} focusZ={focusZ} half={shadowHalf} />
      <directionalLight position={[9000, 3500, -8000]} intensity={fill} color={rig.fillColor} />

      <Ground
        size={size}
        terrain={terrain}
        city={city}
        satellite={satellite}
        year={yearMode ? year : undefined}
        satOpacity={yearMode ? satOpacity : undefined}
      />
      {/* 有卫星影像时，绿地农田本身就是真实纹理，不再叠色块；年代模式要保留农田拼块 */}
      {(!satellite || yearMode) && <LandUse city={city} terrain={terrain} year={yearMode ? year : undefined} />}
      <Water city={city} terrain={terrain} t={t} year={yearMode ? year : undefined} />
      {/* 有卫星影像时，路网已被真实纹理覆盖，白色线框是重复且更丑的 CAD 线，直接不画 */}
      {(!satellite || yearMode) && <Roads city={city} terrain={terrain} year={yearMode ? year : undefined} />}
      <Trees city={city} terrain={terrain} />
      <Buildings
        city={city}
        terrain={terrain}
        eras={eras}
        t={t}
        year={year}
        fixedYear={fixedYear}
        capHeights={capHeights}
      />
      {ancient && <AncientCity city={city} terrain={terrain} layout={ancient} year={year} />}
      <Settlement huts={ancient?.huts ?? []} terrain={terrain} year={year} />
      <Walls rings={rings} terrain={terrain} year={year} />
      <Landmarks landmarks={landmarks ?? []} city={city} terrain={terrain} year={year} />
      <Shantang city={city} terrain={terrain} year={year} />
      <Aperture ring={helvRing} terrain={terrain} year={year} t={t} grow={apertureGrow} />
      <Rings
        rings={rings}
        terrain={terrain}
        year={year}
        t={t}
        height={height}
        city={city}
        variant={yearMode ? 'year' : 'film'}
        instant={fixedYear !== undefined}
      />
      <Dynamics city={city} terrain={terrain} t={t} />
      <Lights city={city} terrain={terrain} night={night} />
      <CameraRig origin={city.origin} terrain={terrain} t={t} shotAt={shotAt} />
    </ThreeCanvas>
  );
};
