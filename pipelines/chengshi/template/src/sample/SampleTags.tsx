import {useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Terrain} from '../types';
import type {CamState} from '../camera';
import {sampleHeight} from '../terrain';
import {sampleCameraAt} from './config';

type SampleTag = {
  id: string;
  name: string;
  en: string;
  lon: number;
  lat: number;
  h: number;
  from: number;
  to: number;
};

/**
 * 样片标签：每个年代最多 4 个锚点。
 * 顺序即优先级：先给近现代的水面/园区/高楼，古城的塔与园子放后面兜底，
 * 保证 1896 与 1978 不会只剩一两个名字。
 */
const TAGS: SampleTag[] = [
  {id: 'huqiu', name: '虎丘云岩寺塔', en: 'Yunyan Pagoda', lon: 120.576354, lat: 31.337992, h: 47.7, from: 1896, to: 1988},
  {id: 'beisi', name: '北寺塔', en: 'North Temple Pagoda', lon: 120.615413, lat: 31.324527, h: 76, from: 1896, to: 1998},
  {id: 'jinji', name: '金鸡湖', en: 'Jinji Lake', lon: 120.705, lat: 31.312, h: 0, from: 1994, to: 2010},
  {id: 'sip', name: '苏州工业园区', en: 'Suzhou Industrial Park', lon: 120.7005, lat: 31.3255, h: 0, from: 1994, to: 2012},
  {id: 'culture', name: '苏州文化艺术中心', en: 'Culture & Arts Centre', lon: 120.697845, lat: 31.323324, h: 40, from: 2007, to: 2026},
  {id: 'orient', name: '东方之门', en: 'Gate of the Orient', lon: 120.6736, lat: 31.3187, h: 301.8, from: 2015, to: 2026},
  {id: 'suzhoucenter', name: '苏州中心', en: 'Suzhou Center', lon: 120.673431, lat: 31.316359, h: 221.6, from: 2017, to: 2026},
  {id: 'ifs', name: '苏州国金中心', en: 'Suzhou IFS', lon: 120.7164, lat: 31.3139, h: 450, from: 2019, to: 2026},
  {id: 'panmen', name: '盘门水陆城门', en: 'Panmen Gate', lon: 120.611945, lat: 31.289543, h: 11, from: 1896, to: 1998},
  {id: 'zhuozheng', name: '拙政园', en: "Humble Administrator's Garden", lon: 120.629, lat: 31.3259, h: 8, from: 1896, to: 2026},
  {id: 'ruiguang', name: '瑞光塔', en: 'Ruiguang Pagoda', lon: 120.614437, lat: 31.291333, h: 43.2, from: 1896, to: 1960},
  {id: 'hanshan', name: '寒山寺', en: 'Hanshan Temple', lon: 120.5667, lat: 31.3074, h: 15, from: 1930, to: 1988},
  {id: 'shantang', name: '山塘街', en: 'Shantang Street', lon: 120.592021, lat: 31.324859, h: 8, from: 1896, to: 1949},
];

const CAP = 4;
// 4K 坐标下的安全区：顶部年代轴下缘 / 底部年代卡上方的压暗区
const SAFE_TOP = 296;
const SAFE_BOTTOM = 1580;

/** 按字号与字距估算标签宽度，用来避让顶部年代轴和相邻标签 */
const labelWidth = (tag: SampleTag) => tag.name.length * 49 + 12 + Math.round(tag.en.length * 13.2);

export const SampleTags: React.FC<{
  year: number;
  t: number;
  city: CityData;
  terrain: Terrain;
  width: number;
  height: number;
  /** 指定标签 id（静帧用）：绕过 from/to 年份过滤，按镜头需要点名 */
  ids?: string[];
  /** 指定投影机位（静帧用）：不传则走样片航线 */
  cam?: CamState;
}> = ({year, t, city, terrain, width, height, ids, cam: camOverride}) => {
  const cam = useMemo(() => {
    const {pos, target, fov, near, far} = camOverride ?? sampleCameraAt(terrain, t);
    const c = new THREE.PerspectiveCamera(fov, width / height, near ?? 500, far ?? 260000);
    c.position.set(pos[0], pos[1], pos[2]);
    c.lookAt(target[0], target[1], target[2]);
    c.updateMatrixWorld();
    c.updateProjectionMatrix();
    return c;
  }, [terrain, t, width, height, camOverride]);

  const [ox, oy] = city.origin;
  const coslat = Math.cos((oy * Math.PI) / 180);
  const v = new THREE.Vector3();

  const marks: {tag: SampleTag; sx: number; sy: number}[] = [];
  const allowed = ids ? new Set(ids) : null;
  for (const tag of TAGS) {
    if (allowed ? !allowed.has(tag.id) : year < tag.from || year > tag.to) continue;
    if (marks.length >= CAP) break;
    const x = (tag.lon - ox) * 111320 * coslat;
    const z = -(tag.lat - oy) * 110540;
    // 高层地标把点压在塔顶附近；低矮地标统一抬高 120m，避免点被街区的楼群淹没
    const lift = tag.h > 40 ? tag.h * 0.82 + 40 : tag.h + 120;
    const y = sampleHeight(terrain, x, z) + lift;
    v.set(x, y, z).project(cam);
    if (v.z < -1 || v.z > 1) continue;
    const sx = (v.x * 0.5 + 0.5) * width;
    const sy = (-v.y * 0.5 + 0.5) * height;
    // 锚点落进顶部年代轴或画面外就不放，宁缺也不要压字
    if (sx < 0 || sx > width || sy < SAFE_TOP || sy > SAFE_BOTTOM) continue;
    marks.push({tag, sx, sy});
  }

  const placed: {left: number; top: number; w: number}[] = [];
  const items = marks.map((m) => {
    const w = labelWidth(m.tag);
    const sides = m.sx < width * 0.58 ? [1, -1] : [-1, 1];
    let left = 0;
    let top = 0;
    let ok = false;
    const base = Math.min(Math.max(m.sy - 30, SAFE_TOP), SAFE_BOTTOM);
    for (let k = 0; k < 10 && !ok; k++) {
      // 上下交替避让，先向下推；每一档都两侧各试一次，标签才能贴着光点而不是被甩到别处
      const t2 = base + (k % 2 ? -Math.ceil(k / 2) : Math.ceil(k / 2)) * 64;
      if (t2 < SAFE_TOP || t2 > SAFE_BOTTOM) continue;
      for (const side of sides) {
        if (ok) break;
        const l = Math.max(60, Math.min(side > 0 ? m.sx + 24 : m.sx - 24 - w, width - 60 - w));
        const clash = placed.some((q) => Math.abs(q.top - t2) < 62 && !(q.left + q.w < l - 8 || l + w < q.left - 8));
        if (!clash) {
          left = l;
          top = t2;
          ok = true;
        }
      }
    }
    if (ok) placed.push({left, top, w});
    return {...m, left, top, ok};
  });

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {items.map(
        ({tag, sx, sy, left, top, ok}) =>
          ok && (
            <div key={tag.id}>
              <div
                style={{
                  position: 'absolute',
                  left: sx - 9,
                  top: sy - 9,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, #fff5dd 0%, #ffd08a 34%, rgba(255,190,96,0.55) 64%, rgba(255,180,80,0) 100%)',
                  boxShadow: '0 0 16px 5px rgba(255,190,100,0.42)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left,
                  top,
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 12,
                  fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
                  textShadow: '0 2px 3px rgba(0,0,0,0.9), 0 4px 20px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{fontSize: 44, fontWeight: 600, letterSpacing: 5, color: 'rgba(255,236,200,0.98)'}}>
                  {tag.name}
                </div>
                <div style={{fontSize: 22, letterSpacing: 2, color: 'rgba(255,238,208,0.62)'}}>
                  {tag.en.toUpperCase()}
                </div>
              </div>
            </div>
          ),
      )}
    </div>
  );
};
