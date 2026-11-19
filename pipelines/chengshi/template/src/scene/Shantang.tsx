import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {makeWaterTest} from './waterMask';

const D2R = Math.PI / 180;

/** 阊门 → 通贵桥 → 虎丘：七里山塘的河街走向（120.59–120.60E, 31.31–31.34N） */
const PATH_LONLAT: [number, number][] = [
  [120.60095, 31.31335],
  [120.5983, 31.3163],
  [120.5956, 31.3196],
  [120.59202, 31.32486],
  [120.5889, 31.3286],
  [120.5856, 31.3318],
  [120.5818, 31.3346],
  [120.5786, 31.3367],
  [120.57635, 31.33799],
];

const CANAL_HALF = 9.0;
const STREET_HALF = 4.6;

const WALL = ['#ddd6c6', '#d3cab8', '#e4ddcd', '#c9c2b1', '#cfc6b2'];
const ROOF_TILE = ['#4a4a44', '#54524a', '#403f3a', '#5b584e'];

const hash01 = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

type P = {x: number; z: number; tx: number; tz: number; nx: number; nz: number};

/**
 * 山塘街：s10/s11 的「水街」主体。
 * 河水、石板街、两岸民居、沿街灯点、三座小石桥全部按真实河街走向生成；
 * 之前的版本只有一座通贵桥，低飞时读不出七里山塘的连续街市。
 */
export const Shantang: React.FC<{
  city: CityData;
  terrain: Terrain;
  year: number;
}> = ({city, terrain, year}) => {
  const body = useRef<THREE.InstancedMesh>(null);
  const roof = useRef<THREE.InstancedMesh>(null);

  const built = useMemo(() => {
    const [ox, oy] = city.origin;
    const coslat = Math.cos(oy * D2R);
    const pts = PATH_LONLAT.map(
      ([lon, lat]) =>
        new THREE.Vector3((lon - ox) * 111320 * coslat, 0, -(lat - oy) * 110540),
    );
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.18);
    const raw = curve.getSpacedPoints(180);
    const samples: P[] = raw.map((p, i) => {
      const prev = raw[Math.max(0, i - 1)];
      const next = raw[Math.min(raw.length - 1, i + 1)];
      const tx0 = next.x - prev.x;
      const tz0 = next.z - prev.z;
      const tl = Math.hypot(tx0, tz0) || 1;
      const tx = tx0 / tl;
      const tz = tz0 / tl;
      return {x: p.x, z: p.z, tx, tz, nx: -tz, nz: tx};
    });

    const water = makeWaterTest(city, 2);
    let plus = 0;
    let minus = 0;
    for (const p of samples) {
      if (!water(p.x + p.nx * 22, p.z + p.nz * 22)) plus++;
      if (!water(p.x - p.nx * 22, p.z - p.nz * 22)) minus++;
    }
    // 街道与沿街民居放在陆侧，水侧只留一条窄岸
    const side = plus >= minus ? 1 : -1;

    const ribbon = (offset: number, halfW: number, lift: number) => {
      const pos: number[] = [];
      const idx: number[] = [];
      for (const p of samples) {
        const cx = p.x + p.nx * offset;
        const cz = p.z + p.nz * offset;
        const ax = cx + p.nx * halfW;
        const az = cz + p.nz * halfW;
        const bx = cx - p.nx * halfW;
        const bz = cz - p.nz * halfW;
        pos.push(ax, sampleHeight(terrain, ax, az) + lift, az);
        pos.push(bx, sampleHeight(terrain, bx, bz) + lift, bz);
      }
      for (let i = 0; i < samples.length - 1; i++) {
        const a = i * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };

    type House = {x: number; z: number; len: number; wid: number; ang: number; h: number};
    const houses: House[] = [];
    const pushRow = (p: P, offset: number, scale: number) => {
      const x = p.x + p.nx * offset;
      const z = p.z + p.nz * offset;
      if (water(x, z)) return;
      const r1 = hash01(x + 11, z - 7);
      const r2 = hash01(x - 23, z + 19);
      const r3 = hash01(x + 53, z + 3);
      houses.push({
        x,
        z,
        len: (10.5 + r1 * 8.5) * scale,
        wid: (6.2 + r2 * 3.8) * scale,
        ang: Math.atan2(-p.tz, p.tx) + (r3 - 0.5) * 0.05,
        // 沿街店面偶尔起二层：低飞时街面才有高低错落，而不是一排等高的盒子
        h: (5.6 + r3 * 4.0 + (r1 > 0.78 ? 2.2 : 0)) * scale,
      });
    };
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      const q = hash01(i * 3.1, i * 7.7);
      // 主街一排贴着街面，第二排在河对岸，第三排退到街后，第四排补对岸纵深
      if (q > 0.06) pushRow(p, side * (CANAL_HALF + STREET_HALF * 2 + 6), 1.04);
      if (q > 0.18) pushRow(p, -side * (CANAL_HALF + 7), 0.94);
      if (q > 0.4) pushRow(p, side * (CANAL_HALF + STREET_HALF * 2 + 22), 1.12);
      if (q > 0.64) pushRow(p, -side * (CANAL_HALF + 21), 1.0);
    }

    // 石桥：七里山塘上的桥，是低飞时最有辨识度的横向节奏
    const bridgeIdx = [Math.round(samples.length * 0.2), Math.round(samples.length * 0.46), Math.round(samples.length * 0.72)];
    const bridges = bridgeIdx.map((i) => {
      const p = samples[i];
      const y = sampleHeight(terrain, p.x, p.z);
      return {x: p.x, z: p.z, y, ang: Math.atan2(-p.tz, p.tx)};
    });

    // 沿街灯点：白天是暖白的檐下灯，夜里成串
    const lanterns: number[] = [];
    for (let i = 0; i < samples.length; i += 2) {
      const p = samples[i];
      for (const off of [side * (CANAL_HALF + STREET_HALF * 2 + 1), -side * (CANAL_HALF + 2)]) {
        const x = p.x + p.nx * off;
        const z = p.z + p.nz * off;
        if (water(x, z)) continue;
        lanterns.push(x, sampleHeight(terrain, x, z) + 6.4, z);
      }
    }

    const canalGeo = ribbon(0, CANAL_HALF, 1.5);
    const streetGeo = ribbon(side * (CANAL_HALF + STREET_HALF + 0.8), STREET_HALF, 1.7);
    const bankGeo = ribbon(side * (CANAL_HALF + 1.4), 1.3, 2.1);

    const lanternGeo = new THREE.BufferGeometry();
    lanternGeo.setAttribute('position', new THREE.Float32BufferAttribute(lanterns, 3));

    return {houses, bridges, canalGeo, streetGeo, bankGeo, lanternGeo};
  }, [city, terrain]);

  const count = built.houses.length;
  const {bodyGeo, roofGeo, bodyMat, roofMat, canalMat, streetMat, bankMat, lanternMat} = useMemo(() => {
    const bodyGeo = new THREE.BoxGeometry(1, 1, 1);
    bodyGeo.translate(0, 0.5, 0);
    const roofGeo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4);
    roofGeo.rotateY(Math.PI / 4);
    return {
      bodyGeo,
      roofGeo,
      bodyMat: new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.88, metalness: 0}),
      roofMat: new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.85, metalness: 0.02}),
      canalMat: new THREE.MeshStandardMaterial({
        color: '#245a73',
        roughness: 0.3,
        metalness: 0.05,
        transparent: true,
        opacity: 0.96,
        emissive: '#0a2c44',
        emissiveIntensity: 0.34,
      }),
      streetMat: new THREE.MeshStandardMaterial({color: '#c7bca4', roughness: 0.95, metalness: 0}),
      bankMat: new THREE.MeshStandardMaterial({color: '#9a8f7a', roughness: 0.95, metalness: 0}),
      lanternMat: new THREE.PointsMaterial({
        color: '#ffd58a',
        size: 7,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    };
  }, []);

  useLayoutEffect(() => {
    const bm = body.current;
    const rm = roof.current;
    if (!bm || !rm) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    built.houses.forEach((h, i) => {
      const y = sampleHeight(terrain, h.x, h.z);
      o.position.set(h.x, y - 0.7, h.z);
      o.rotation.set(0, h.ang, 0);
      o.scale.set(h.len, h.h + 0.7, h.wid);
      o.updateMatrix();
      bm.setMatrixAt(i, o.matrix);
      c.set(WALL[i % WALL.length]);
      bm.setColorAt(i, c);

      const roofH = Math.min(4.6, Math.max(2.2, Math.min(h.len, h.wid) * 0.38));
      o.position.set(h.x, y + h.h, h.z);
      o.rotation.set(0, h.ang, 0);
      o.scale.set(h.len * 1.12, roofH, h.wid * 1.12);
      o.updateMatrix();
      rm.setMatrixAt(i, o.matrix);
      c.set(ROOF_TILE[i % ROOF_TILE.length]);
      rm.setColorAt(i, c);
    });
    bm.instanceMatrix.needsUpdate = true;
    if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
    rm.instanceMatrix.needsUpdate = true;
    if (rm.instanceColor) rm.instanceColor.needsUpdate = true;
    bm.frustumCulled = false;
    rm.frustumCulled = false;
  }, [built, terrain]);

  if (year < 825 || !count) return null;

  return (
    <group>
      {/* 河、主街、石岸：逐点贴地，3.6km 连续不断 */}
      <mesh geometry={built.canalGeo} material={canalMat} receiveShadow />
      <mesh geometry={built.streetGeo} material={streetMat} receiveShadow />
      <mesh geometry={built.bankGeo} material={bankMat} receiveShadow />
      <instancedMesh ref={body} args={[bodyGeo, bodyMat, count]} castShadow receiveShadow />
      <instancedMesh ref={roof} args={[roofGeo, roofMat, count]} castShadow />
      {built.bridges.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]} rotation={[0, b.ang, 0]}>
          <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
            <boxGeometry args={[8.5, 3.0, CANAL_HALF * 2 + 12]} />
            <meshStandardMaterial color="#c2b59c" roughness={0.9} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 2.0, s * (CANAL_HALF + 2)]} castShadow receiveShadow>
              <boxGeometry args={[6, 6, 2.8]} />
              <meshStandardMaterial color="#b0a28a" roughness={0.94} />
            </mesh>
          ))}
        </group>
      ))}
      <points geometry={built.lanternGeo} material={lanternMat} />
    </group>
  );
};
