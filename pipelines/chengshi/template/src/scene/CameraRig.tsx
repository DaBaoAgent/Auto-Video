import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import type * as THREE from 'three';
import {cityShotAt} from '../camera';
import type {CamState} from '../camera';
import type {Terrain} from '../types';

type Props = {
  origin: [number, number];
  terrain: Terrain;
  t: number; // 影片秒数：全片一条连续航线，无章节切换
  /** 样片/静帧可替换整条航线 */
  shotAt?: (t: number) => CamState;
};

/** 城市级一镜到底：螺旋外扩航线，视线始终俯瞰老城中心 */
export const CameraRig: React.FC<Props> = ({origin, terrain, t, shotAt}) => {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    const {pos, target, fov, near, far} = (shotAt ?? ((tt: number) => cityShotAt(origin, terrain, tt)))(t);
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(target[0], target[1], target[2]);
    // near 决定深度精度：2 配 260 km 远平面时，16 km 处只能分辨约 4 m，
    // 地表与脚下垫底盒会逐帧 z-fighting 闪成暗帧。城市级机位离地约 5 km，500 安全；
    // 低空镜头由 shotAt 显式给 near/far，否则近处地面会被剪掉。
    camera.near = near ?? 500;
    camera.far = far ?? 260000;
    const persp = camera as THREE.PerspectiveCamera;
    if ((persp as unknown as {isPerspectiveCamera?: boolean}).isPerspectiveCamera) {
      persp.fov = fov;
    }
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, origin, terrain, t, shotAt]);

  return null;
};
