import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {applyCloudShadow} from './clouds';
import type {AncientLayout, FieldDef, RoadSeg} from './ancientLayout';
import {insetPoly} from './ancientLayout';

const D2R = Math.PI / 180;

const PAD_COLORS = ['#9c8966', '#a3906c', '#907d5c', '#a89570'];
const WALL_COLORS = ['#8a7552', '#7d6a4a', '#94805c', '#867252'];
const TREE_COLORS = ['#264b2c', '#356031', '#43753c', '#213f25', '#4d7f42', '#2f5529'];
const AWNING_COLORS = ['#a2573f', '#b08a46', '#7f8a54', '#9b6a4a'];
const ROAD_COLORS = ['#a68f6a', '#a08a66', '#97845f'];

type GB = {pos: number[]; col: number[]};

const addQuad = (
  gb: GB,
  terrain: Terrain,
  cx: number,
  cz: number,
  len: number,
  wid: number,
  angDeg: number,
  yOff: number,
  scale: number,
  color: THREE.Color,
) => {
  const a = angDeg * D2R;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  const hx = (len * scale) / 2;
  const hz = (wid * scale) / 2;
  const pts: [number, number, number][] = [];
  for (const [lx, lz] of [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ] as const) {
    const x = cx + lx * ca + lz * sa;
    const z = cz - lx * sa + lz * ca;
    pts.push([x, sampleHeight(terrain, x, z) + yOff, z]);
  }
  for (const idx of [0, 1, 2, 0, 2, 3]) {
    const p = pts[idx];
    gb.pos.push(p[0], p[1], p[2]);
    gb.col.push(color.r, color.g, color.b);
  }
};

const makeGeo = (gb: GB) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(gb.pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(gb.col, 3));
  g.computeVertexNormals();
  return g;
};

const ringStrip = (poly: number[][], terrain: Terrain, kInner: number, kOuter: number, yOff: number) => {
  const inner = insetPoly(poly, kInner);
  const outer = insetPoly(poly, kOuter);
  const pos: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    const len = Math.hypot(inner[j][0] - inner[i][0], inner[j][1] - inner[i][1]);
    const n = Math.max(1, Math.ceil(len / 30));
    for (let s = 0; s < n; s++) {
      const f0 = s / n;
      const f1 = (s + 1) / n;
      const ia: [number, number] = [inner[i][0] + (inner[j][0] - inner[i][0]) * f0, inner[i][1] + (inner[j][1] - inner[i][1]) * f0];
      const oa: [number, number] = [outer[i][0] + (outer[j][0] - outer[i][0]) * f0, outer[i][1] + (outer[j][1] - outer[i][1]) * f0];
      const ob: [number, number] = [outer[i][0] + (outer[j][0] - outer[i][0]) * f1, outer[i][1] + (outer[j][1] - outer[i][1]) * f1];
      const ib: [number, number] = [inner[i][0] + (inner[j][0] - inner[i][0]) * f1, inner[i][1] + (inner[j][1] - inner[i][1]) * f1];
      for (const p of [ia, oa, ob, ia, ob, ib]) {
        pos.push(p[0], sampleHeight(terrain, p[0], p[1]) + yOff, p[1]);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
};

const roadsGeo = (roads: RoadSeg[], terrain: Terrain) => {
  const gb: GB = {pos: [], col: []};
  const c = new THREE.Color();
  for (const s of roads) {
    const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0);
    if (len < 1) continue;
    const dx = (s.x1 - s.x0) / len;
    const dz = (s.z1 - s.z0) / len;
    const nx = -dz;
    const nz = dx;
    const half = s.w / 2;
    const n = Math.max(1, Math.ceil(len / 24));
    c.set(ROAD_COLORS[s.tone]);
    for (let i = 0; i < n; i++) {
      const f0 = i / n;
      const f1 = (i + 1) / n;
      const ax = s.x0 + (s.x1 - s.x0) * f0;
      const az = s.z0 + (s.z1 - s.z0) * f0;
      const bx = s.x0 + (s.x1 - s.x0) * f1;
      const bz = s.z0 + (s.z1 - s.z0) * f1;
      const pts: [number, number][] = [
        [ax - nx * half, az - nz * half],
        [ax + nx * half, az + nz * half],
        [bx + nx * half, bz + nz * half],
        [bx - nx * half, bz - nz * half],
      ];
      for (const idx of [0, 1, 2, 0, 2, 3]) {
        const [x, z] = pts[idx];
        gb.pos.push(x, sampleHeight(terrain, x, z) + 1.32, z);
        gb.col.push(c.r, c.g, c.b);
      }
    }
  }
  return makeGeo(gb);
};

type InstItem = {
  x: number;
  z: number;
  ang: number;
  sx: number;
  sy: number;
  sz: number;
  yOff: number;
  color?: string;
};

const fillInstances = (mesh: THREE.InstancedMesh | null, items: InstItem[], terrain: Terrain) => {
  if (!mesh || !items.length) return;
  const o = new THREE.Object3D();
  const c = new THREE.Color();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    o.position.set(it.x, sampleHeight(terrain, it.x, it.z) + it.yOff, it.z);
    o.rotation.set(0, it.ang * D2R, 0);
    o.scale.set(it.sx, it.sy, it.sz);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
    if (it.color) {
      c.set(it.color);
      mesh.setColorAt(i, c);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.frustumCulled = false;
};

export const AncientCity: React.FC<{
  city: CityData;
  terrain: Terrain;
  layout: AncientLayout;
  year: number;
}> = ({terrain, layout, year}) => {
  const {poly, huts, roads, fields, trees, compounds, boats, carts, smoke, docks, special} = layout;

  const mats = useMemo(() => {
    const field = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide});
    const road = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.98, metalness: 0, side: THREE.DoubleSide});
    applyCloudShadow(road);
    const moat = new THREE.MeshStandardMaterial({
      color: '#2f6b8c',
      roughness: 0.34,
      metalness: 0.05,
      transparent: true,
      opacity: 0.93,
      emissive: '#0d3350',
      emissiveIntensity: 0.26,
      side: THREE.DoubleSide,
    });
    applyCloudShadow(moat);
    const pad = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 1, metalness: 0});
    const wall = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.95, metalness: 0});
    applyCloudShadow(wall);
    const tree = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 1, metalness: 0, flatShading: true});
    const wood = new THREE.MeshStandardMaterial({color: '#4a3828', roughness: 0.95, metalness: 0});
    const canopy = new THREE.MeshStandardMaterial({color: '#5c5142', roughness: 0.95, metalness: 0});
    const dock = new THREE.MeshStandardMaterial({color: '#7a6245', roughness: 0.95, metalness: 0});
    const earth = new THREE.MeshStandardMaterial({color: '#8a7452', roughness: 0.96, metalness: 0});
    applyCloudShadow(earth);
    const earthDark = new THREE.MeshStandardMaterial({color: '#756044', roughness: 0.96, metalness: 0});
    applyCloudShadow(earthDark);
    const courtyard = new THREE.MeshStandardMaterial({color: '#a38d65', roughness: 1, metalness: 0});
    const thatch = new THREE.MeshStandardMaterial({color: '#5c5142', roughness: 0.94, metalness: 0});
    const cloth = new THREE.MeshStandardMaterial({color: '#8f3f2f', roughness: 0.9, metalness: 0, side: THREE.DoubleSide});
    const stall = new THREE.MeshStandardMaterial({color: '#b9a783', roughness: 1, metalness: 0});
    const awning = new THREE.MeshStandardMaterial({color: '#ffffff', roughness: 0.95, metalness: 0, side: THREE.DoubleSide});
    const granary = new THREE.MeshStandardMaterial({color: '#8a7350', roughness: 0.95, metalness: 0});
    const kiln = new THREE.MeshStandardMaterial({color: '#6f5a44', roughness: 1, metalness: 0});
    const smokeMat = new THREE.MeshBasicMaterial({
      color: '#d9d5cc',
      transparent: true,
      opacity: 0.085,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plaza = new THREE.MeshStandardMaterial({color: '#a68a60', roughness: 1, metalness: 0, side: THREE.DoubleSide});
    return {field, road, moat, pad, wall, tree, wood, canopy, dock, earth, earthDark, courtyard, thatch, cloth, stall, awning, granary, kiln, smokeMat, plaza};
  }, []);

  const unitGeos = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    const boxUp = box.clone().translate(0, 0.5, 0);
    const coneUp = new THREE.ConeGeometry(1, 1, 10).translate(0, 0.5, 0);
    const cylUp = new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0);
    const icoUp = new THREE.IcosahedronGeometry(1, 0).translate(0, 0.9, 0);
    const smokeUp = new THREE.CylinderGeometry(1, 0.35, 1, 6, 1, true).translate(0, 0.5, 0);
    const padFlat = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    return {box, boxUp, coneUp, cylUp, icoUp, smokeUp, padFlat};
  }, []);

  const geos = useMemo(() => {
    const fgb: GB = {pos: [], col: []};
    const c = new THREE.Color();
    const addField = (f: FieldDef) => {
      c.set(f.color).multiplyScalar(0.66);
      addQuad(fgb, terrain, f.x, f.z, f.len, f.wid, f.ang, 0.4, 1, c);
      c.set(f.color);
      addQuad(fgb, terrain, f.x, f.z, f.len, f.wid, f.ang, 0.54, 0.9, c);
    };
    for (const f of fields) addField(f);
    return {
      field: makeGeo(fgb),
      road: roadsGeo(roads, terrain),
      moat: ringStrip(poly, terrain, 1.006, 1.03, 1.2),
    };
  }, [fields, roads, poly, terrain]);

  const padItems = useMemo<InstItem[]>(
    () =>
      huts.map((h, i) => ({
        x: h.x,
        z: h.z,
        ang: h.ang,
        sx: h.len * 1.9,
        sy: 1,
        sz: h.wid * 2.2,
        yOff: 0.33,
        color: PAD_COLORS[i % PAD_COLORS.length],
      })),
    [huts],
  );

  const compoundItems = useMemo<InstItem[]>(() => {
    const out: InstItem[] = [];
    const gap = 6;
    compounds.forEach((p, i) => {
      const color = WALL_COLORS[i % WALL_COLORS.length];
      const a = p.ang * D2R;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const pushSeg = (lx: number, lz: number, sx: number, sz: number) => {
        const x = p.x + lx * ca + lz * sa;
        const z = p.z - lx * sa + lz * ca;
        out.push({x, z, ang: p.ang, sx, sy: 3.6, sz, yOff: -0.4, color});
      };
      pushSeg(0, -p.wid / 2, p.len, 2);
      pushSeg(-(p.len + gap) / 4, p.wid / 2, (p.len - gap) / 2, 2);
      pushSeg((p.len + gap) / 4, p.wid / 2, (p.len - gap) / 2, 2);
      pushSeg(p.len / 2, 0, 2, p.wid);
      pushSeg(-p.len / 2, 0, 2, p.wid);
    });
    return out;
  }, [compounds]);

  const treeItems = useMemo<InstItem[]>(
    () =>
      trees.map((t) => ({
        x: t.x,
        z: t.z,
        ang: 0,
        sx: t.r,
        sy: t.r * 1.15,
        sz: t.r,
        yOff: 0,
        color: TREE_COLORS[t.tone % TREE_COLORS.length],
      })),
    [trees],
  );

  const boatItems = useMemo<InstItem[]>(
    () => boats.map((b) => ({x: b.x, z: b.z, ang: (b.ang / D2R) | 0, sx: b.len, sy: 1.7, sz: 4.2, yOff: 1.5})),
    [boats],
  );
  const canopyItems = useMemo<InstItem[]>(
    () =>
      boats.map((b) => ({
        x: b.x,
        z: b.z,
        ang: (b.ang / D2R) | 0,
        sx: b.len * 0.42,
        sy: 2.4,
        sz: 3,
        yOff: 3.1,
      })),
    [boats],
  );
  const cartItems = useMemo<InstItem[]>(
    () => carts.map((c) => ({x: c.x, z: c.z, ang: (c.ang / D2R) | 0, sx: 6, sy: 2.2, sz: 3, yOff: 1.7})),
    [carts],
  );
  const dockItems = useMemo<InstItem[]>(
    () => docks.map((d) => ({x: d.x, z: d.z, ang: (d.ang / D2R) | 0, sx: d.len, sy: 0.8, sz: 9, yOff: 1.9})),
    [docks],
  );
  const smokeItems = useMemo<InstItem[]>(
    () => smoke.map((s, i) => ({x: s.x, z: s.z, ang: 0, sx: 5 + (i % 4), sy: s.h, sz: 5 + (i % 4), yOff: s.y})),
    [smoke],
  );

  const kilnItems = useMemo<InstItem[]>(() => {
    const out: InstItem[] = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      out.push({
        x: special.kilns.x + Math.cos(a) * 42,
        z: special.kilns.z + Math.sin(a) * 42,
        ang: 0,
        sx: 9,
        sy: 8,
        sz: 9,
        yOff: 0,
      });
    }
    return out;
  }, [special]);
  const shedItems = useMemo<InstItem[]>(() => {
    const out: InstItem[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      out.push({
        x: special.kilns.x + Math.cos(a) * 90,
        z: special.kilns.z + Math.sin(a) * 90,
        ang: (a / D2R) | 0,
        sx: 24,
        sy: 5,
        sz: 14,
        yOff: 0,
        color: '#7d6a4a',
      });
    }
    return out;
  }, [special]);

  const stallItems = useMemo<InstItem[]>(() => {
    const out: InstItem[] = [];
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 9; i++) {
        out.push({
          x: special.market.x - 80 + i * 20,
          z: special.market.z + (row === 0 ? -34 : 34),
          ang: 0,
          sx: 12,
          sy: 3,
          sz: 7,
          yOff: 1.6,
          color: '#b9a783',
        });
      }
    }
    return out;
  }, [special]);
  const awningItems = useMemo<InstItem[]>(() => {
    const out: InstItem[] = [];
    let k = 0;
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 9; i++) {
        out.push({
          x: special.market.x - 80 + i * 20,
          z: special.market.z + (row === 0 ? -34 : 34),
          ang: 0,
          sx: 13,
          sy: 0.3,
          sz: 8,
          yOff: 3.2,
          color: AWNING_COLORS[k++ % AWNING_COLORS.length],
        });
      }
    }
    return out;
  }, [special]);

  const granaryItems = useMemo<InstItem[]>(() => {
    const out: InstItem[] = [];
    for (let i = 0; i < 10; i++) {
      const row = Math.floor(i / 5);
      out.push({
        x: special.granary.x - 60 + (i % 5) * 30,
        z: special.granary.z + row * 34,
        ang: 0,
        sx: 7,
        sy: 7,
        sz: 7,
        yOff: 0,
        color: '#8a7350',
      });
    }
    return out;
  }, [special]);
  const granaryRoofItems = useMemo<InstItem[]>(
    () => granaryItems.map((g) => ({...g, sx: 8.5, sy: 4.5, sz: 8.5, yOff: 7, color: '#5c5142'})),
    [granaryItems],
  );

  const padRef = useRef<THREE.InstancedMesh>(null);
  const wallRef = useRef<THREE.InstancedMesh>(null);
  const treeRef = useRef<THREE.InstancedMesh>(null);
  const boatRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const cartRef = useRef<THREE.InstancedMesh>(null);
  const dockRef = useRef<THREE.InstancedMesh>(null);
  const smokeRef = useRef<THREE.InstancedMesh>(null);
  const kilnRef = useRef<THREE.InstancedMesh>(null);
  const shedRef = useRef<THREE.InstancedMesh>(null);
  const stallRef = useRef<THREE.InstancedMesh>(null);
  const awningRef = useRef<THREE.InstancedMesh>(null);
  const granaryRef = useRef<THREE.InstancedMesh>(null);
  const granaryRoofRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    fillInstances(padRef.current, padItems, terrain);
    fillInstances(wallRef.current, compoundItems, terrain);
    fillInstances(treeRef.current, treeItems, terrain);
    fillInstances(boatRef.current, boatItems, terrain);
    fillInstances(canopyRef.current, canopyItems, terrain);
    fillInstances(cartRef.current, cartItems, terrain);
    fillInstances(dockRef.current, dockItems, terrain);
    fillInstances(smokeRef.current, smokeItems, terrain);
    fillInstances(kilnRef.current, kilnItems, terrain);
    fillInstances(shedRef.current, shedItems, terrain);
    fillInstances(stallRef.current, stallItems, terrain);
    fillInstances(awningRef.current, awningItems, terrain);
    fillInstances(granaryRef.current, granaryItems, terrain);
    fillInstances(granaryRoofRef.current, granaryRoofItems, terrain);
  }, [padItems, compoundItems, treeItems, boatItems, canopyItems, cartItems, dockItems, smokeItems, kilnItems, shedItems, stallItems, awningItems, granaryItems, granaryRoofItems, terrain]);

  if (year < -520 || year > -80) return null;

  const {palace, market, kilns, granary} = special;
  const py = sampleHeight(terrain, palace.x, palace.z);
  const my = sampleHeight(terrain, market.x, market.z);
  const ky = sampleHeight(terrain, kilns.x, kilns.z);
  const gy = sampleHeight(terrain, granary.x, granary.z);

  return (
    <group>
      <mesh geometry={geos.field} material={mats.field} receiveShadow />
      <mesh geometry={geos.road} material={mats.road} receiveShadow />
      <mesh geometry={geos.moat} material={mats.moat} receiveShadow />

      {padItems.length > 0 && (
        <instancedMesh ref={padRef} args={[unitGeos.padFlat, mats.pad, padItems.length]} receiveShadow />
      )}
      {compoundItems.length > 0 && (
        <instancedMesh ref={wallRef} args={[unitGeos.boxUp, mats.wall, compoundItems.length]} castShadow receiveShadow />
      )}
      {treeItems.length > 0 && (
        <instancedMesh ref={treeRef} args={[unitGeos.icoUp, mats.tree, treeItems.length]} castShadow />
      )}
      {boatItems.length > 0 && (
        <instancedMesh ref={boatRef} args={[unitGeos.box, mats.wood, boatItems.length]} castShadow />
      )}
      {canopyItems.length > 0 && (
        <instancedMesh ref={canopyRef} args={[unitGeos.box, mats.canopy, canopyItems.length]} castShadow />
      )}
      {cartItems.length > 0 && (
        <instancedMesh ref={cartRef} args={[unitGeos.box, mats.wood, cartItems.length]} castShadow />
      )}
      {dockItems.length > 0 && (
        <instancedMesh ref={dockRef} args={[unitGeos.box, mats.dock, dockItems.length]} receiveShadow />
      )}
      {smokeItems.length > 0 && (
        <instancedMesh ref={smokeRef} args={[unitGeos.smokeUp, mats.smokeMat, smokeItems.length]} />
      )}
      {kilnItems.length > 0 && (
        <instancedMesh ref={kilnRef} args={[unitGeos.coneUp, mats.kiln, kilnItems.length]} castShadow receiveShadow />
      )}
      {shedItems.length > 0 && (
        <instancedMesh ref={shedRef} args={[unitGeos.boxUp, mats.earth, shedItems.length]} castShadow receiveShadow />
      )}
      {stallItems.length > 0 && (
        <instancedMesh ref={stallRef} args={[unitGeos.box, mats.stall, stallItems.length]} castShadow receiveShadow />
      )}
      {awningItems.length > 0 && (
        <instancedMesh ref={awningRef} args={[unitGeos.box, mats.awning, awningItems.length]} />
      )}
      {granaryItems.length > 0 && (
        <instancedMesh ref={granaryRef} args={[unitGeos.cylUp, mats.granary, granaryItems.length]} castShadow receiveShadow />
      )}
      {granaryRoofItems.length > 0 && (
        <instancedMesh ref={granaryRoofRef} args={[unitGeos.coneUp, mats.granary, granaryRoofItems.length]} castShadow />
      )}

      <mesh position={[market.x, my + 0.9, market.z]} rotation={[-Math.PI / 2, 0, 0]} material={mats.plaza} receiveShadow>
        <planeGeometry args={[210, 150]} />
      </mesh>

      {/* 宫城 */}
      <group position={[palace.x, py, palace.z]}>
        <mesh position={[0, -1, 0]} material={mats.earth} receiveShadow castShadow>
          <boxGeometry args={[330, 14, 240]} />
        </mesh>
        <mesh position={[0, 6.25, 0]} material={mats.courtyard} receiveShadow>
          <boxGeometry args={[306, 0.5, 216]} />
        </mesh>
        <mesh position={[0, 9.5, -130]} material={mats.earthDark} castShadow receiveShadow>
          <boxGeometry args={[350, 7, 4]} />
        </mesh>
        <mesh position={[-94, 9.5, 130]} material={mats.earthDark} castShadow receiveShadow>
          <boxGeometry args={[162, 7, 4]} />
        </mesh>
        <mesh position={[94, 9.5, 130]} material={mats.earthDark} castShadow receiveShadow>
          <boxGeometry args={[162, 7, 4]} />
        </mesh>
        <mesh position={[-175, 9.5, 0]} material={mats.earthDark} castShadow receiveShadow>
          <boxGeometry args={[4, 7, 264]} />
        </mesh>
        <mesh position={[175, 9.5, 0]} material={mats.earthDark} castShadow receiveShadow>
          <boxGeometry args={[4, 7, 264]} />
        </mesh>
        {[
          [-160, -115],
          [160, -115],
          [-160, 115],
          [160, 115],
        ].map(([x, z], i) => (
          <group key={`pt${i}`} position={[x, 0, z]}>
            <mesh position={[0, 19, 0]} material={mats.earth} castShadow receiveShadow>
              <boxGeometry args={[24, 26, 24]} />
            </mesh>
            <mesh position={[0, 34, 0]} rotation={[0, Math.PI / 4, 0]} scale={[20, 7, 20]} material={mats.thatch} castShadow>
              <coneGeometry args={[1, 1, 4]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 7.6, -22]} material={mats.earthDark} castShadow receiveShadow>
          <boxGeometry args={[100, 3.2, 60]} />
        </mesh>
        <mesh position={[0, 15.2, -22]} material={mats.earth} castShadow receiveShadow>
          <boxGeometry args={[86, 12, 48]} />
        </mesh>
        <mesh position={[0, 26.8, -22]} rotation={[0, Math.PI / 4, 0]} scale={[104, 12, 62]} material={mats.thatch} castShadow>
          <coneGeometry args={[1, 1, 4]} />
        </mesh>
        <mesh position={[0, 12, 78]} material={mats.earth} castShadow receiveShadow>
          <boxGeometry args={[64, 12, 38]} />
        </mesh>
        <mesh position={[0, 21.5, 78]} rotation={[0, Math.PI / 4, 0]} scale={[78, 9, 48]} material={mats.thatch} castShadow>
          <coneGeometry args={[1, 1, 4]} />
        </mesh>
        {[-112, 112].map((x, i) => (
          <group key={`ph${i}`} position={[x, 0, 16]}>
            <mesh position={[0, 10, 0]} material={mats.earth} castShadow receiveShadow>
              <boxGeometry args={[44, 10, 28]} />
            </mesh>
            <mesh position={[0, 18, 0]} rotation={[0, Math.PI / 4, 0]} scale={[56, 8, 38]} material={mats.thatch} castShadow>
              <coneGeometry args={[1, 1, 4]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 12, 130]} material={mats.earthDark} castShadow receiveShadow>
          <boxGeometry args={[38, 14, 20]} />
        </mesh>
        <mesh position={[0, 22.5, 130]} rotation={[0, Math.PI / 4, 0]} scale={[32, 7, 20]} material={mats.thatch} castShadow>
          <coneGeometry args={[1, 1, 4]} />
        </mesh>
        {[
          [-150, -100],
          [150, -100],
          [-150, 100],
          [150, 100],
        ].map(([x, z], i) => (
          <group key={`flag${i}`} position={[x, 0, z]}>
            <mesh position={[0, 16, 0]} material={mats.wood}>
              <cylinderGeometry args={[0.4, 0.5, 26, 6]} />
            </mesh>
            <mesh position={[3.6, 27, 0]} material={mats.cloth}>
              <planeGeometry args={[7.5, 4.6]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 八座城门外的堑桥 */}
      {poly.map(([x, z], i) => {
        const dx = x - layout.center[0];
        const dz = z - layout.center[1];
        const len = Math.hypot(dx, dz);
        const ux = dx / len;
        const uz = dz / len;
        const mx = layout.center[0] + ux * len * 1.019;
        const mz = layout.center[1] + uz * len * 1.019;
        const ang = Math.atan2(-uz, ux);
        return (
          <group key={`bridge${i}`} position={[mx, sampleHeight(terrain, mx, mz) + 2.1, mz]} rotation={[0, ang, 0]}>
            <mesh material={mats.wood} castShadow receiveShadow>
              <boxGeometry args={[len * 0.034 + 10, 1.8, 22]} />
            </mesh>
            {[-10.5, 10.5].map((oz, k) => (
              <mesh key={k} position={[0, 1.3, oz]} material={mats.wood}>
                <boxGeometry args={[len * 0.034 + 10, 1.4, 0.8]} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* 城墙上的望楼 */}
      {[0, 2, 4, 6].map((i) => {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const x = (a[0] + b[0]) / 2;
        const z = (a[1] + b[1]) / 2;
        const yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
        return (
          <group key={`wt${i}`} position={[x, sampleHeight(terrain, x, z), z]} rotation={[0, yaw, 0]}>
            <mesh position={[0, 18, 0]} material={mats.earthDark} castShadow receiveShadow>
              <boxGeometry args={[30, 36, 30]} />
            </mesh>
            <mesh position={[0, 39, 0]} rotation={[0, Math.PI / 4, 0]} scale={[24, 8, 24]} material={mats.thatch} castShadow>
              <coneGeometry args={[1, 1, 4]} />
            </mesh>
          </group>
        );
      })}

      <group position={[kilns.x, ky, kilns.z]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + 0.4;
          return (
            <group key={`kw${i}`} position={[Math.cos(a) * 90, 0, Math.sin(a) * 90]} rotation={[0, a, 0]}>
              <mesh position={[0, 5.8, 0]} rotation={[0, Math.PI / 4, 0]} scale={[28, 4, 18]} material={mats.thatch} castShadow>
                <coneGeometry args={[1, 1, 4]} />
              </mesh>
            </group>
          );
        })}
      </group>

      <group position={[granary.x, gy, granary.z]}>
        <mesh position={[0, 3, 0]} material={mats.earthDark} receiveShadow>
          <boxGeometry args={[190, 6, 100]} />
        </mesh>
      </group>
    </group>
  );
};
