import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {CityData, Era, Terrain} from '../types';
import {clamp, tAtYear} from '../theme';
import {sampleHeight} from '../terrain';
import {eraRevealYear, heightCapFor} from '../sample/config';
import {applyCloudShadow} from './clouds';
import {makeHeightModel} from './heights';
import {makeWaterTest} from './waterMask';

const GROW = 0.55;

/** 按建造年代取墙面/屋面主色：土垣茅舍 → 里坊青灰 → 粉墙黛瓦 → 砖厂 → 混凝土 → 玻璃 */
const ERA_PALETTE: {until: number; colors: string[]}[] = [
  {until: -500, colors: ['#8d7c5c', '#83745a', '#96835f']},
  {until: 589, colors: ['#9a8a68', '#8f8060', '#a39372']},
  {until: 960, colors: ['#a39a8c', '#989082', '#ada596']},
  {until: 1368, colors: ['#cdc6b8', '#c3bcae', '#d5cec0']},
  {until: 1896, colors: ['#ddd7c9', '#d3ccbe', '#e2dccf']},
  {until: 1950, colors: ['#a07257', '#94705c', '#a99f92']},
  {until: 1994, colors: ['#b8b2a6', '#c0bbb0', '#aaa79e']},
  {until: Infinity, colors: ['#c6c1b5', '#bdb9ad', '#cec9bd']},
];
const MODERN_CLASS = ['#6b8494', '#5d7686', '#7a93a1', '#647d8c'];
const ROOF_TILE = ['#6b655b', '#736c61', '#615b52'];

/**
 * 双坡屋面：底 1×1（局部 X 为屋脊方向），脊高 1。
 * 平盒屋顶在低机位下会变成一张张浮板；坡屋顶一上去，老城近景才读成「粉墙黛瓦」。
 */
const makeRoofGeometry = () => {
  const v: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) =>
    v.push(...a, ...b, ...c, ...a, ...c, ...d);
  const tri = (a: number[], b: number[], c: number[]) => v.push(...a, ...b, ...c);
  const bl = [-0.5, 0, -0.5];
  const br = [0.5, 0, -0.5];
  const fr = [0.5, 0, 0.5];
  const fl = [-0.5, 0, 0.5];
  const rl = [-0.5, 1, 0];
  const rr = [0.5, 1, 0];
  quad(fl, fr, rr, rl);
  quad(br, bl, rl, rr);
  tri(bl, fl, rl);
  tri(fr, br, rr);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
};

/** 屋面高度跟着屋身尺度走，长条房不会顶着一个过高的尖帽子 */
const roofHeight = (w: number, d: number) => Math.min(6.5, Math.max(2.4, Math.min(w, d) * 0.34));

const hash = (x: number, z: number) => Math.abs((x * 73856093) ^ (z * 19349663));

// OSM 里有 572m 宽的「建筑」（整个厂区/校园被画成一个面），渲染成实体会是一张巨板。
// 显示时按 140m 封顶，视觉上仍是大地块，但不会被误读成一栋楼。
const MAX_FOOT = 140;
const foot = (v: number) => Math.min(MAX_FOOT, Math.max(1.2, v));

/** 足迹四角任一角落水就整栋不画：只看中心会漏掉岸边压在水里的长条楼 */
const footprintInWater = (test: (x: number, z: number) => boolean, x: number, z: number, l: number, w: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const hl = foot(l) / 2;
  const hw = foot(w) / 2;
  for (const [dx, dz] of [[0, 0], [hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]] as const) {
    if (test(x + dx * ca + dz * sa, z - dx * sa + dz * ca)) return true;
  }
  return false;
};

const colorFor = (year: number, height: number, h: number) => {
  if (year >= 1994 && height > 24) return MODERN_CLASS[h % MODERN_CLASS.length];
  for (const p of ERA_PALETTE) if (year < p.until) return p.colors[h % p.colors.length];
  return ERA_PALETTE[ERA_PALETTE.length - 1].colors[h % 3];
};

export const Buildings: React.FC<{
  city: CityData;
  terrain: Terrain;
  eras: Era[];
  t: number;
  year: number;
  /** 静帧：直接按年份铺满，不跑生长动画 */
  fixedYear?: number;
  /** 样片：楼高按年代封顶，1896 的老城不会被今天的数据拔高 */
  capHeights?: boolean;
}> = ({city, terrain, eras, t, year, fixedYear, capHeights}) => {
  const count = city.buildings.length;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const roof = useRef<THREE.InstancedMesh>(null);
  // OSM 里夹在湖面/河道多边形里的码头与浮建筑，三维里会变成水上漂的方块，直接不画
  const onWater = useMemo(() => makeWaterTest(city, 6), [city]);

  const {geo, mat, roofGeo, roofMat, data, order, appear, roofSlot, roofBld, roofCount} = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.92, metalness: 0.02});
    applyCloudShadow(mat, {baseAO: true});
    const roofGeo = makeRoofGeometry();
    const roofMat = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.85, metalness: 0.02});
    applyCloudShadow(roofMat);
    // OSM 缺高度：按圈层/片区补一个确定性高度，再做低倍垂直夸张
    const heightOf = makeHeightModel(city.origin);
    const data = new Float32Array(count * 7);
    const appear = new Float32Array(count);
    const slotOf = new Int32Array(count).fill(-1);
    const slotIdx: number[] = [];
    city.buildings.forEach((b, i) => {
      data[i * 7] = b[0];
      data[i * 7 + 1] = b[1];
      data[i * 7 + 2] = foot(b[2]);
      data[i * 7 + 3] = foot(b[3]);
      data[i * 7 + 4] = b[4];
      data[i * 7 + 5] = Math.max(3, heightOf(b));
      data[i * 7 + 6] = b[7];
      if (footprintInWater(onWater, b[0], b[1], b[2], b[3], b[4])) {
        appear[i] = Infinity;
        return;
      }
      const birth = eraRevealYear(b[0], b[1], b[6], b[7]);
      appear[i] = tAtYear(eras, birth);
      // 老城低层民居加一圈黛瓦屋面
      if (b[6] < 1896 && b[5] <= 16) {
        slotOf[i] = slotIdx.length;
        slotIdx.push(i);
      }
    });
    const idx = new Array<number>(count);
    for (let i = 0; i < count; i++) idx[i] = i;
    idx.sort((a, b) => appear[a] - appear[b] || a - b);
    const order = new Uint32Array(idx);
    return {
      geo,
      mat,
      roofGeo,
      roofMat,
      data,
      order,
      appear,
      roofSlot: slotOf,
      roofBld: slotIdx,
      roofCount: slotIdx.length,
    };
  }, [city, eras, count, capHeights, onWater]);

  // 初始矩阵全为 0：还没有到建筑出生的年份
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) m.setMatrixAt(i, zero);
    city.buildings.forEach((b, i) => {
      const h = hash(b[0], b[1]);
      c.set(colorFor(b[6], data[i * 7 + 5], h));
      m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.frustumCulled = false;

    const rm = roof.current;
    if (rm) {
      for (let i = 0; i < roofCount; i++) rm.setMatrixAt(i, zero);
      for (let s = 0; s < roofCount; s++) {
        const b = city.buildings[roofBld[s]];
        c.set(ROOF_TILE[hash(b[0], b[1]) % ROOF_TILE.length]);
        rm.setColorAt(s, c);
      }
      rm.instanceMatrix.needsUpdate = true;
      if (rm.instanceColor) rm.instanceColor.needsUpdate = true;
      rm.frustumCulled = false;
    }
  }, [count, city, roofCount, roofBld]);

  const state = useRef({lastT: -1, cursor: 0, cap: -1, active: [] as {i: number; start: number}[]});

  // 静帧模式：按年份把已建成的楼一次性铺满，不做生长动画
  useLayoutEffect(() => {
    if (fixedYear === undefined || !count) return;
    const m = mesh.current;
    const rm = roof.current;
    if (!m) return;
    const cap = capHeights ? heightCapFor(fixedYear) : Infinity;
    // 先秦聚落：OSM 小民居在 6km 机位下只剩像素，需要放大；
    // 但 OSM 里被画成一整片的厂区/校园不能跟着放大，否则城内会冒出几块 200m 的大厂房
    const early = fixedYear <= -100;
    const earlyCap = early ? 13 : cap;
    const zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
    const o = new THREE.Object3D();
    const ro = new THREE.Object3D();
    for (let i = 0; i < count; i++) m.setMatrixAt(i, zero);
    if (rm) for (let i = 0; i < roofCount; i++) rm.setMatrixAt(i, zero);
    for (let i = 0; i < count; i++) {
      const b = city.buildings[i];
      if (footprintInWater(onWater, b[0], b[1], b[2], b[3], b[4])) continue;
      const birth = eraRevealYear(b[0], b[1], b[6], b[7]);
      if (birth > fixedYear) continue;
      const gy = sampleHeight(terrain, b[0], b[1]);
      const bw0 = data[i * 7 + 2];
      const bd0 = data[i * 7 + 3];
      const span = Math.max(bw0, bd0);
      const bs = early ? (span <= 26 ? 1.75 : 1.15) : 1;
      const bw = early ? Math.min(bw0, 54) : bw0;
      const bd = early ? Math.min(bd0, 42) : bd0;
      const hh = Math.max(3, Math.min(data[i * 7 + 5], earlyCap)) * (early ? 1.2 : 1);
      // 30m DEM 与三角面插值有米级误差，低角度下会露出缝；楼体往地下埋 3m 封边
      const sink = Math.min(3, hh * 0.25);
      o.position.set(b[0], gy - sink, b[1]);
      o.rotation.set(0, (b[4] * Math.PI) / 180, 0);
      o.scale.set(bw * bs, hh + sink, bd * bs);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      const slot = roofSlot[i];
      if (rm && slot >= 0 && b[6] < 1896 && b[5] <= 16) {
        const rw = bw * bs;
        const rd = bd * bs;
        ro.position.set(b[0], gy + hh, b[1]);
        ro.rotation.set(0, (b[4] * Math.PI) / 180, 0);
        ro.scale.set(rw * 1.04, roofHeight(rw, rd) * (early ? 1.15 : 1), rd * 1.04);
        ro.updateMatrix();
        rm.setMatrixAt(slot, ro.matrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (rm) rm.instanceMatrix.needsUpdate = true;
    state.current.lastT = -1;
    state.current.cursor = 0;
    state.current.cap = -1;
    state.current.active = [];
  }, [fixedYear, capHeights, count, city, terrain, roofCount, roofSlot, onWater]);

  useLayoutEffect(() => {
    if (fixedYear !== undefined) return;
    const m = mesh.current;
    const rm = roof.current;
    if (!m || !count) return;
    const st = state.current;
    const cap = capHeights ? heightCapFor(year) : Infinity;

    const o = new THREE.Object3D();
    const ro = new THREE.Object3D();

    // 写一栋楼：hh 为已封顶的实际高度
    const write = (i: number, hh: number) => {
      const k = i * 7;
      const gy = sampleHeight(terrain, data[k], data[k + 1]);
      const sink = Math.min(3, hh * 0.25);
      o.position.set(data[k], gy - sink, data[k + 1]);
      o.rotation.set(0, (data[k + 4] * Math.PI) / 180, 0);
      o.scale.set(data[k + 2], hh + sink, data[k + 3]);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      const slot = roofSlot[i];
      if (rm && slot >= 0) {
        ro.position.set(data[k], gy + hh, data[k + 1]);
        ro.rotation.set(0, (data[k + 4] * Math.PI) / 180, 0);
        ro.scale.set(
          data[k + 2] * 1.04,
          roofHeight(data[k + 2], data[k + 3]),
          data[k + 3] * 1.04,
        );
        ro.updateMatrix();
        rm.setMatrixAt(slot, ro.matrix);
      }
    };

    let changed = false;

    // 时间回退、首帧、或封顶高度变化（例如 1990→2000）时整体重铺
    if (t < st.lastT || st.lastT < 0 || cap !== st.cap) {
      const zero = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
      for (let i = 0; i < count; i++) m.setMatrixAt(i, zero);
      if (rm) for (let i = 0; i < roofCount; i++) rm.setMatrixAt(i, zero);
      st.cursor = 0;
      st.active = [];
      while (st.cursor < count && appear[order[st.cursor]] <= t + 1e-6) {
        const i = order[st.cursor];
        write(i, Math.min(data[i * 7 + 5], cap));
        st.cursor++;
      }
      st.cap = cap;
      changed = true;
    }

    while (st.cursor < count && appear[order[st.cursor]] <= t + 1e-6) {
      const i = order[st.cursor];
      st.active.push({i, start: appear[i]});
      st.cursor++;
    }

    const keep: {i: number; start: number}[] = [];
    for (const a of st.active) {
      const p = clamp((t - a.start) / GROW, 0, 1);
      const s = p * p * (3 - 2 * p);
      write(a.i, Math.min(data[a.i * 7 + 5], cap) * s + 0.001);
      changed = true;
      if (p < 1) keep.push(a);
    }
    st.active = keep;
    st.lastT = t;
    if (changed) {
      m.instanceMatrix.needsUpdate = true;
      if (rm) rm.instanceMatrix.needsUpdate = true;
    }
  }, [t, year, capHeights, fixedYear, appear, order, data, count, terrain, roofCount, roofSlot]);

  if (!count) return null;
  return (
    <group>
      <instancedMesh ref={mesh} args={[geo, mat, count]} castShadow receiveShadow />
      {roofCount > 0 && <instancedMesh ref={roof} args={[roofGeo, roofMat, roofCount]} castShadow />}
    </group>
  );
};
