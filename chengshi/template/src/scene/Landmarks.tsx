import {useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Landmark, Terrain} from '../types';
import {sampleHeight} from '../terrain';

const STONE = '#cfc0a4';
const BRICK = '#b9a78c';
const TILE = '#3c4247';
const WHITE = '#dcd6c8';
const PLINTH = '#c6bfb1';
const ROOF_DECK = '#6f6c64';
const WOOD = '#8a5a3c';
const YELLOW = '#c9a24a';
const GOLD = '#d8a84e';
const GLASS = '#aec9d8';
const STEEL = '#c9d3d8';
const DARK = '#4c5257';

/** 幕墙分缝：横竖细线贴图，让 10km 外的塔读成「一栋楼」而不是一块奶油色板 */
let glassTexture: THREE.CanvasTexture | null = null;
const getGlassTexture = () => {
  if (glassTexture) return glassTexture;
  const cv = document.createElement('canvas');
  cv.width = 32;
  cv.height = 128;
  const g = cv.getContext('2d')!;
  g.fillStyle = GLASS;
  g.fillRect(0, 0, 32, 128);
  g.fillStyle = 'rgba(64,88,102,0.42)';
  for (let y = 5; y < 128; y += 9) g.fillRect(0, y, 32, 2);
  g.fillStyle = 'rgba(64,88,102,0.26)';
  for (let x = 7; x < 32; x += 8) g.fillRect(x, 0, 1, 128);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 2.4);
  t.anisotropy = 4;
  glassTexture = t;
  return t;
};

const Mat = {
  stone: () => <meshStandardMaterial color={STONE} roughness={0.85} metalness={0} />,
  brick: () => <meshStandardMaterial color={BRICK} roughness={0.9} metalness={0} />,
  tile: () => <meshStandardMaterial color={TILE} roughness={0.8} metalness={0.05} />,
  white: () => <meshStandardMaterial color={WHITE} roughness={0.8} metalness={0} />,
  plinth: () => <meshStandardMaterial color={PLINTH} roughness={0.9} metalness={0} />,
  wood: () => <meshStandardMaterial color={WOOD} roughness={0.75} metalness={0} />,
  yellow: () => <meshStandardMaterial color={YELLOW} roughness={0.85} metalness={0} />,
  gold: () => <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.65} />,
  // 没有环境贴图时高 metalness 会吃成黑块：压低金属度、给一点自发光托底，
  // 10km 外的玻璃塔才会像浅色玻璃而不是黑条
  glass: () => (
    <meshStandardMaterial map={getGlassTexture()} roughness={0.42} metalness={0.16} emissive="#2b4250" emissiveIntensity={0.36} />
  ),
  steel: () => (
    <meshStandardMaterial color={STEEL} roughness={0.4} metalness={0.34} emissive="#2a333a" emissiveIntensity={0.3} />
  ),
  dark: () => <meshStandardMaterial color={DARK} roughness={0.7} metalness={0.2} />,
  deck: () => <meshStandardMaterial color={ROOF_DECK} roughness={0.95} metalness={0} />,
};

/** 四坡屋顶：四棱锥压扁成宽檐 */
const HipRoof: React.FC<{
  w: number;
  d: number;
  h: number;
  y: number;
  color?: string;
}> = ({w, d, h, y, color = TILE}) => (
  <mesh position={[0, y + h / 2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w / 1.414, 1, d / 1.414]} castShadow>
    <coneGeometry args={[1, h, 4]} />
    <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
  </mesh>
);

/** 楼阁式塔：逐层收分、每层出檐，塔刹鎏金 */
const Pagoda: React.FC<{h: number; tiers: number}> = ({h, tiers}) => {
  const parts = [];
  const rBase = h * 0.115;
  const rTop = h * 0.045;
  const bodyH = (h * 0.76) / tiers;
  const roofH = h * 0.026;
  let y = 0;
  for (let i = 0; i < tiers; i++) {
    const r0 = rBase + (rTop - rBase) * (i / tiers);
    const r1 = rBase + (rTop - rBase) * ((i + 1) / tiers);
    parts.push(
      <mesh key={`b${i}`} position={[0, y + bodyH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r1 * 0.94, r0, bodyH, 8]} />
        <meshStandardMaterial color={i % 2 ? STONE : BRICK} roughness={0.85} metalness={0} />
      </mesh>,
    );
    parts.push(
      <mesh key={`r${i}`} position={[0, y + bodyH + roofH * 0.35, 0]} castShadow>
        <cylinderGeometry args={[r0 * 1.0, r0 * 1.24, roofH, 8]} />
        <meshStandardMaterial color={TILE} roughness={0.75} metalness={0.05} />
      </mesh>,
    );
    y += bodyH + roofH * 0.55;
  }
  parts.push(
    <mesh key="finial" position={[0, y + h * 0.05, 0]} castShadow>
      <coneGeometry args={[h * 0.012, h * 0.1, 8]} />
      <meshStandardMaterial color={GOLD} roughness={0.35} metalness={0.65} />
    </mesh>,
  );
  return <group>{parts}</group>;
};

/** 盘门：陆门 + 水门，墙顶敌楼 */
const PanmenGate: React.FC<{h: number}> = ({h}) => (
  <group>
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[52, h, 12]} />
      {Mat.brick()}
    </mesh>
    {/* 陆门洞 */}
    <mesh position={[0, h * 0.28, 6.2]}>
      <boxGeometry args={[9, h * 0.56, 1.4]} />
      <meshStandardMaterial color="#2b2724" roughness={1} />
    </mesh>
    {/* 水门：向内折的一段墙 */}
    <mesh position={[18, h / 2, -4]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[34, h * 0.92, 10]} />
      {Mat.brick()}
    </mesh>
    {/* 城楼 */}
    <mesh position={[0, h + 3.6, 0]} castShadow>
      <boxGeometry args={[16, 7.2, 9]} />
      {Mat.wood()}
    </mesh>
    <HipRoof w={20} d={13} h={5.2} y={h + 7.2} />
    {/* 雉堞 */}
    {Array.from({length: 13}, (_, i) => (
      <mesh key={`m${i}`} position={[-24 + i * 4, h + 0.9, 6]} castShadow>
        <boxGeometry args={[2.2, 1.8, 1.2]} />
        {Mat.brick()}
      </mesh>
    ))}
  </group>
);

/** 寺院：黄墙、主殿、配殿、院墙 */
const Temple: React.FC<{h: number; big?: boolean}> = ({h, big}) => (
  <group>
    <mesh position={[0, h * 0.3, 0]} castShadow receiveShadow>
      <boxGeometry args={[big ? 30 : 20, h * 0.6, big ? 16 : 11]} />
      {Mat.yellow()}
    </mesh>
    <HipRoof w={big ? 35 : 24} d={big ? 21 : 15} h={h * 0.42} y={h * 0.6} />
    <mesh position={[big ? -22 : -16, h * 0.14, 6]} castShadow receiveShadow>
      <boxGeometry args={[10, h * 0.28, 9]} />
      {Mat.yellow()}
    </mesh>
    <HipRoof w={12} d={11} h={h * 0.18} y={h * 0.28} />
    <mesh position={[0, 1.2, 12]}>
      <boxGeometry args={[big ? 46 : 34, 2.4, 0.8]} />
      {Mat.brick()}
    </mesh>
  </group>
);

/** 园林：厅堂、六角亭、廊、假山 */
const Garden: React.FC<{h: number}> = ({h}) => (
  <group>
    <mesh position={[-12, 3.2, 8]} castShadow receiveShadow>
      <boxGeometry args={[18, 6.4, 10]} />
      {Mat.white()}
    </mesh>
    <HipRoof w={21} d={13} h={3.4} y={6.4} />
    {[[14, -6], [26, 10], [-2, -14]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 2.2, 0]} castShadow>
          <cylinderGeometry args={[2.6, 2.8, 4.4, 6]} />
          {Mat.white()}
        </mesh>
        <mesh position={[0, 5.4, 0]} castShadow>
          <coneGeometry args={[4.2, 2.6, 6]} />
          {Mat.tile()}
        </mesh>
      </group>
    ))}
    <mesh position={[8, 2, 24]} rotation={[0, 0.35, 0]} castShadow receiveShadow>
      <boxGeometry args={[40, 3.2, 3]} />
      {Mat.white()}
    </mesh>
    <mesh position={[8, 4.4, 24]} rotation={[0, 0.35, 0]} castShadow>
      <boxGeometry args={[41, 1.2, 4]} />
      {Mat.tile()}
    </mesh>
    <mesh position={[30, 3.4, -18]} scale={[1.6, 1, 1.2]} castShadow receiveShadow>
      <dodecahedronGeometry args={[5, 0]} />
      {Mat.dark()}
    </mesh>
  </group>
);

/** 苏博：粉墙黛瓦的几何体块 + 玻璃金字塔 */
const Museum: React.FC<{h: number}> = ({h}) => (
  <group>
    <mesh position={[-10, h * 0.22, 0]} castShadow receiveShadow>
      <boxGeometry args={[26, h * 0.44, 18]} />
      {Mat.white()}
    </mesh>
    <mesh position={[12, h * 0.3, 4]} castShadow receiveShadow>
      <boxGeometry args={[16, h * 0.6, 14]} />
      {Mat.white()}
    </mesh>
    <mesh position={[-10, h * 0.46, 0]} castShadow>
      <boxGeometry args={[27, h * 0.04, 19]} />
      {Mat.dark()}
    </mesh>
    <mesh position={[12, h * 0.62, 4]} castShadow>
      <boxGeometry args={[17, h * 0.04, 15]} />
      {Mat.dark()}
    </mesh>
    <mesh position={[4, h * 0.18, -14]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[7, h * 0.36, 4]} />
      {Mat.glass()}
    </mesh>
  </group>
);

/** 宝带桥：长堤多孔石拱 */
const BaodaiBridge: React.FC<{h: number}> = ({h}) => {
  const len = 317;
  const spans = 53;
  const piers = useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i <= spans; i++) out.push(-len / 2 + (len / spans) * i);
    return out;
  }, [spans]);
  return (
    <group>
      {[-1, 0, 1].map((k) => (
        <mesh
          key={k}
          position={[k * (len / 3), h - 0.6 - Math.abs(k) * 0.8, 0]}
          rotation={[0, 0, k * 0.02]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[len / 3 + 1, 1.4, 4.2]} />
          {Mat.stone()}
        </mesh>
      ))}
      {piers.map((x, i) => (
        <mesh key={i} position={[x, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, h, 4.6]} />
          {Mat.stone()}
        </mesh>
      ))}
    </group>
  );
};

/**
 * 东方之门：双塔门形。两条腿沿南北向分开（相机自西向东看时装进画框的是门洞，
 * 而不是一条与视线重合的实心板），顶部连桥封口；洞宽 54m，10km 外仍读得出门。
 */
const OrientGate: React.FC<{h: number}> = ({h}) => (
  <group>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[0, (h * 0.86) / 2, s * 42]} castShadow receiveShadow>
        <boxGeometry args={[30, h * 0.86, 30]} />
        {Mat.glass()}
      </mesh>
    ))}
    <mesh position={[0, h * 0.9, 0]} castShadow>
      <boxGeometry args={[30, h * 0.2, 114]} />
      {Mat.glass()}
    </mesh>
    {/* 连桥幕墙分缝：给顶部大面一条浅色横带，远看不像一整块黑板 */}
    <mesh position={[15.2, h * 0.9, 0]}>
      <boxGeometry args={[0.6, h * 0.07, 100]} />
      {Mat.steel()}
    </mesh>
  </group>
);

/** 国金中心：收分方塔 + 塔冠 + 天线 */
const IFS: React.FC<{h: number}> = ({h}) => (
  <group>
    <mesh position={[0, (h * 0.84) / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[58, h * 0.84, 58]} />
      {Mat.glass()}
    </mesh>
    <mesh position={[0, h * 0.84 + (h * 0.08) / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[46, h * 0.08, 46]} />
      {Mat.glass()}
    </mesh>
    <mesh position={[0, h * 0.92 + (h * 0.04) / 2, 0]} castShadow>
      <boxGeometry args={[24, h * 0.04, 24]} />
      {Mat.steel()}
    </mesh>
    <mesh position={[0, h * 0.96 + (h * 0.04) / 2, 0]} castShadow>
      <boxGeometry args={[4.5, h * 0.04, 4.5]} />
      {Mat.steel()}
    </mesh>
  </group>
);

/** 苏州中心：七塔连体 + 基座 */
const SuzhouCenter: React.FC<{h: number}> = ({h}) => (
  <group>
    {/* 基座拆成玻璃裙房 + 浅色裙顶，再压一层深色屋面；整块白盒子从空中看会像反光板 */}
    <mesh position={[0, 7, 0]} castShadow receiveShadow>
      <boxGeometry args={[190, 14, 130]} />
      {Mat.glass()}
    </mesh>
    <mesh position={[0, 18, 0]} castShadow receiveShadow>
      <boxGeometry args={[186, 8, 126]} />
      {Mat.plinth()}
    </mesh>
    <mesh position={[0, 22.4, 0]} receiveShadow>
      <boxGeometry args={[184, 1.2, 124]} />
      {Mat.deck()}
    </mesh>
    {[
      [-64, -34, 0.86],
      [-22, -40, 0.95],
      [22, -42, 0.8],
      [64, -34, 0.72],
      [-44, 34, 0.66],
      [0, 38, 1.0],
      [46, 34, 0.6],
    ].map(([x, z, k], i) => (
      <mesh key={i} position={[x, 22 + (h * k) / 2, z]} castShadow receiveShadow>
        <boxGeometry args={[30, h * k, 30]} />
        {Mat.glass()}
      </mesh>
    ))}
  </group>
);

/** 文化艺术中心：曲面金属壳 */
const CultureHall: React.FC<{h: number}> = ({h}) => (
  <group>
    <mesh position={[0, 5, 0]} castShadow receiveShadow>
      <boxGeometry args={[130, 10, 100]} />
      {Mat.glass()}
    </mesh>
    <mesh position={[0, 10.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[128, 11, 98]} />
      {Mat.plinth()}
    </mesh>
    <mesh position={[0, 16.2, 0]} receiveShadow>
      <boxGeometry args={[126, 0.8, 96]} />
      {Mat.deck()}
    </mesh>
    <mesh position={[0, 16, 0]} scale={[52, h * 0.55, 40]} castShadow>
      <sphereGeometry args={[1, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      {Mat.steel()}
    </mesh>
  </group>
);

/** 山塘通贵桥：单孔石拱 */
const ArchBridge: React.FC<{h: number}> = ({h}) => (
  <group>
    <mesh position={[0, h * 0.55, 0]} castShadow receiveShadow>
      <boxGeometry args={[14, 1.2, 4]} />
      {Mat.stone()}
    </mesh>
    {[-5.4, 5.4].map((x, i) => (
      <mesh key={i} position={[x, h * 0.28, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, h * 0.55, 3.6]} />
        {Mat.stone()}
      </mesh>
    ))}
    <mesh position={[0, h * 0.9, 0]}>
      <torusGeometry args={[5, 0.7, 6, 12, Math.PI]} />
      {Mat.stone()}
    </mesh>
  </group>
);

const builtYear = (era: string) => {
  const n = parseInt(era, 10);
  return Number.isFinite(n) ? n : -3000;
};

const Model: React.FC<{l: Landmark; year: number}> = ({l, year}) => {
  if (year < builtYear(l.era)) return null;
  switch (l.id) {
    case 'beisi':
      return <Pagoda h={l.height} tiers={9} />;
    case 'huqiu':
    case 'ruiguang':
      return <Pagoda h={l.height} tiers={7} />;
    case 'panmen':
      return <PanmenGate h={l.height} />;
    case 'hanshan':
      return <Temple h={l.height} big />;
    case 'shangzhen':
      return <Temple h={l.height} />;
    case 'zhuozheng':
      return <Garden h={l.height} />;
    case 'museum':
      return <Museum h={l.height} />;
    case 'baodai':
      return <BaodaiBridge h={l.height} />;
    case 'orient':
      return <OrientGate h={l.height} />;
    case 'ifs':
      return <IFS h={l.height} />;
    case 'suzhoucenter':
      return <SuzhouCenter h={l.height} />;
    case 'culture':
      return <CultureHall h={l.height} />;
    case 'shantang':
      return <ArchBridge h={l.height} />;
    default:
      return null;
  }
};

export const Landmarks: React.FC<{
  landmarks: Landmark[];
  city: CityData;
  terrain: Terrain;
  year: number;
}> = ({landmarks, city, terrain, year}) => {
  const [ox, oy] = city.origin;
  const coslat = Math.cos((oy * Math.PI) / 180);
  return (
    <group>
      {landmarks.map((l) => {
        const x = (l.lon - ox) * 111320 * coslat;
        const z = -(l.lat - oy) * 110540;
        const y = sampleHeight(terrain, x, z);
        return (
          <group key={l.id} position={[x, y, z]}>
            <Model l={l} year={year} />
          </group>
        );
      })}
    </group>
  );
};
