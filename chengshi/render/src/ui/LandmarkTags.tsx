import {useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Era, Landmark, Terrain} from '../types';
import {sampleHeight} from '../terrain';
import {cityShotAt} from '../camera';
import type {CamState} from '../camera';
import {smoothstep} from '../theme';

const builtYear = (era: string) => {
  const n = parseInt(era, 10);
  return Number.isFinite(n) ? n : -3000;
};

/**
 * 城市级远景下地标只有几个像素，用金色光点 + 小字名称标注。
 * 全部已建成地标常驻光点，当前章节的地标额外显示名称。
 */
export const LandmarkTags: React.FC<{
  landmarks: Landmark[];
  city: CityData;
  terrain: Terrain;
  eras: Era[];
  year: number;
  t: number;
  width: number;
  height: number;
  /** 样片专用机位；不传则沿用正片航线。标注必须和实际渲染相机同一套参数，否则会漂 */
  shotAt?: (t: number) => CamState;
}> = ({landmarks, city, terrain, eras, year, t, width, height, shotAt}) => {
  const s = height / 1080;
  const cam = useMemo(() => {
    const shot = (shotAt ?? ((tt: number) => cityShotAt(city.origin, terrain, tt)))(t);
    const c = new THREE.PerspectiveCamera(shot.fov, width / height, 2, 260000);
    c.position.set(shot.pos[0], shot.pos[1], shot.pos[2]);
    c.lookAt(shot.target[0], shot.target[1], shot.target[2]);
    c.updateMatrixWorld();
    c.updateProjectionMatrix();
    return c;
  }, [city.origin, terrain, t, width, height, shotAt]);

  const fade = smoothstep(5.6, 6.8, t) * (1 - smoothstep(155.2, 156.0, t));
  if (fade <= 0.002) return null;

  let ei = eras.length - 1;
  for (let i = 0; i < eras.length; i++) {
    if (t < eras[i].t1) {
      ei = i;
      break;
    }
  }

  const [ox, oy] = city.origin;
  const coslat = Math.cos((oy * Math.PI) / 180);
  const v = new THREE.Vector3();
  const marks: {id: string; name: string; sx: number; sy: number; born: number; active: boolean; named: boolean}[] = [];
  // 每帧同时显示名字的标签上限：密集处（如第 116s 附近）最多 4 个，避免标成一张地图
  let namedCount = 0;
  for (const l of landmarks) {
    const born = smoothstep(builtYear(l.era), builtYear(l.era) + 25, year);
    if (born <= 0.01) continue;
    const x = (l.lon - ox) * 111320 * coslat;
    const z = -(l.lat - oy) * 110540;
    // 光点钉在实物上方：塔类(高)用较小抬升，矮建筑(园林/城门/街道)贴得更近，
    // 修正「北寺塔/拙政园文字太高、没钉住实物」的问题（原 +140 飘太高）。
    const liftOff = l.height > 40 ? 40 : l.height > 15 ? 30 : 22;
    const y = sampleHeight(terrain, x, z) + l.height + liftOff;
    v.set(x, y, z).project(cam);
    if (v.z < -1 || v.z > 1) continue;
    const sx = (v.x * 0.5 + 0.5) * width;
    const sy = (-v.y * 0.5 + 0.5) * height;
    if (sx < -140 || sx > width + 140 || sy < -90 || sy > height + 90) continue;
    // 每个地标只在它所属章节标注一次；八座水陆城门特殊：集中在 23–27s 全部标注，
    // 之后不再重复（避免 14s 就标出、与年代轴游标文字重叠）。
    const isGate = l.type === 'gate';
    const gateWindow = t >= 23 && t <= 27;
    const named = isGate ? gateWindow : ei === l.chapter;
    if (named && namedCount >= 8) continue;
    if (named) namedCount++;
    marks.push({
      id: l.id,
      name: l.name,
      sx,
      sy,
      born,
      active: l.chapter === ei,
      named,
    });
  }

  const STAGGER = [0, -58 * s, 58 * s, -116 * s, 116 * s];
  const staggerOf = (id: string) => STAGGER[(id.charCodeAt(0) + id.length * 3) % STAGGER.length];

  // 文字层不用 opacity：Chromium 4K 截图时分数 opacity 的文字合成层会整段丢字，
  // 透明度改成乘进颜色与投影的 alpha。
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {marks.map((m) => {
        const pulse = 0.86 + 0.14 * Math.sin(t * 2.0 + m.sx * 0.003);
        const dy = m.named ? staggerOf(m.id) : 0;
        // 字幕带自 y≈850 起；标签文字底边约在 sy+dy+32，接近时平滑上抬，别压住字幕
        const lift = m.named ? 70 * s * smoothstep(770 * s, 830 * s, m.sy + dy) : 0;
        // 文字不做呼吸，恒定近白，避免在明亮地表上被拉淡
        const k = fade * m.born;
        return (
          <div key={m.id} style={{position: 'absolute', left: m.sx, top: m.sy}}>
            <div
              style={{
                position: 'absolute',
                left: -9 * s,
                top: -9 * s,
                width: 18 * s,
                height: 18 * s,
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, #fff5dd 0%, #ffd08a 34%, rgba(255,190,96,0.55) 64%, rgba(255,180,80,0) 100%)',
                boxShadow: m.active
                  ? `0 0 ${22 * s}px ${7 * s}px rgba(255,190,100,0.55)`
                  : `0 0 ${14 * s}px ${4 * s}px rgba(255,190,100,0.32)`,
                opacity: fade * m.born * (m.active ? pulse : 0.62),
              }}
            />
            {m.named && (() => {
              // 接近右边缘时文字翻到光点左侧，避免「盘门水陆城门」被裁掉。
              // 字宽按字号比例估算，长名要乘补偿系数，否则 9 字长名会严重低估
              const estW = [...m.name].length * 49 * s * 1.25 + 13 * s;
              const flip = m.sx + 26 * s + estW > width - 20 * s;
              return (
                <div
                  style={{
                    position: 'absolute',
                    ...(flip ? {right: 26 * s, textAlign: 'right'} : {left: 26 * s}),
                    top: dy - 26 * s - lift,
                    whiteSpace: 'nowrap',
                    fontSize: 44 * s,
                    fontWeight: 600,
                    letterSpacing: 5 * s,
                    color: `rgba(255,236,200,${((m.active ? 0.98 : 0.88) * k).toFixed(3)})`,
                    fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
                    textShadow: `0 ${2 * s}px ${3 * s}px rgba(0,0,0,${(0.88 * k).toFixed(3)}), 0 ${4 * s}px ${20 * s}px rgba(0,0,0,${(0.78 * k).toFixed(3)})`,
                  }}
                >
                  {m.name}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
};
