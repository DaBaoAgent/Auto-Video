import {useMemo} from 'react';
import * as THREE from 'three';
import type {CityData, Landmark, Terrain} from '../types';
import {cityShotAt} from '../camera';
import type {CamState} from '../camera';
import {sampleHeight} from '../terrain';
import {clamp, smoothstep} from '../theme';

const GOLD = '#ffcf7a';
const GOLD_HOT = '#ffe9bb';
const GOLD_DEEP = '#ffb257';

const TAU = Math.PI * 2;

/** 只给镜头专门环绕的三座地标加光圈；窗口避开章节卡与片尾淡出 */
const WINDOWS: {id: string; t0: number; t1: number; footprint: number}[] = [
  {id: 'huqiu', t0: 63.6, t1: 74.0, footprint: 34},
  {id: 'beisi', t0: 74.4, t1: 94.0, footprint: 42},
  {id: 'suzhoucenter', t0: 145.6, t1: 156.0, footprint: 230},
];

const builtYear = (era: string) => {
  const n = parseInt(era, 10);
  return Number.isFinite(n) ? n : -3000;
};

const easeOutBack = (u: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

type Ring = {
  id: string;
  cx: number;
  cy: number;
  r: number;
  alpha: number;
  phase: number;
};

/**
 * 地标动态光圈：金色双环 + 旋转刻度 + 反向虚线环 + 四段旋弧 + 呼吸辉光。
 * 用和字幕/地标同一套相机参数做屏幕投影，所以机位怎么绕都贴在地标上；
 * 2D 绘制避免了低角度贴地环被透视压扁的问题。
 */
export const LandmarkApertures: React.FC<{
  landmarks: Landmark[];
  city: CityData;
  terrain: Terrain;
  year: number;
  t: number;
  width: number;
  height: number;
  shotAt?: (t: number) => CamState;
}> = ({landmarks, city, terrain, year, t, width, height, shotAt}) => {
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

  const rings = useMemo<Ring[]>(() => {
    const [ox, oy] = city.origin;
    const coslat = Math.cos((oy * Math.PI) / 180);
    const v = new THREE.Vector3();
    const out: Ring[] = [];

    for (const w of WINDOWS) {
      if (t < w.t0 || t > w.t1) continue;
      const l = landmarks.find((m) => m.id === w.id);
      if (!l) continue;
      // 光圈窗口都在建成年之后很久，用短尾，避免 2017 年的苏州中心在 2026 只亮三成
      const born = smoothstep(builtYear(l.era), builtYear(l.era) + 8, year);
      if (born <= 0.01) continue;

      const x = (l.lon - ox) * 111320 * coslat;
      const z = -(l.lat - oy) * 110540;
      const y0 = sampleHeight(terrain, x, z);

      const project = (px: number, py: number, pz: number) => {
        v.set(px, py, pz).project(cam);
        return {
          sx: (v.x * 0.5 + 0.5) * width,
          sy: (-v.y * 0.5 + 0.5) * height,
          inFront: v.z > -1 && v.z < 1,
        };
      };

      const base = project(x, y0, z);
      const top = project(x, y0 + l.height, z);
      const mid = project(x, y0 + l.height * 0.5, z);
      const left = project(x - w.footprint / 2, y0 + l.height * 0.5, z);
      const right = project(x + w.footprint / 2, y0 + l.height * 0.5, z);
      if (!base.inFront || !top.inFront || !mid.inFront) continue;

      const cx = mid.sx;
      const cy = mid.sy;
      if (cx < -80 * s || cx > width + 80 * s || cy < -80 * s || cy > height + 80 * s) continue;

      const hPx = Math.abs(base.sy - top.sy);
      const wPx = Math.abs(right.sx - left.sx);
      // 光圈要比塔身大一圈，但别压到字幕带与画面上沿
      const safeBottom = 846 * s;
      const safeTop = 40 * s;
      let r = Math.max(hPx * 0.74, wPx * 0.62, 96 * s);
      r = Math.min(r, (safeBottom - cy) * 0.98, (cy - safeTop) * 0.98, 360 * s);
      if (r < 70 * s) continue;

      const gu = clamp((t - w.t0) / 1.2, 0, 1);
      const fadeIn = smoothstep(w.t0, w.t0 + 0.45, t);
      const fadeOut = 1 - smoothstep(w.t1 - 1.9, w.t1 - 0.15, t);
      const alpha = fadeIn * fadeOut * born;
      if (alpha <= 0.002) continue;

      out.push({
        id: w.id,
        cx,
        cy,
        r: r * (0.2 + 0.8 * easeOutBack(gu)),
        alpha,
        phase: (l.id.charCodeAt(0) + l.id.length * 7) % 11,
      });
    }
    return out;
  }, [landmarks, city.origin, terrain, year, t, cam, width, height, s]);

  if (!rings.length) return null;

  return (
    <svg
      width={width}
      height={height}
      style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}
    >
      <defs>
        <radialGradient id="la-glow">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.22" />
          <stop offset="38%" stopColor={GOLD_DEEP} stopOpacity="0.09" />
          <stop offset="72%" stopColor={GOLD_DEEP} stopOpacity="0.03" />
          <stop offset="100%" stopColor={GOLD_DEEP} stopOpacity="0" />
        </radialGradient>
      </defs>
      {rings.map((g) => {
        const {cx, cy, r, alpha, phase} = g;
        const pulse = 0.84 + 0.12 * Math.sin(t * 2.05 + phase);
        const breathing = 1 + 0.008 * Math.sin(t * 1.63 + phase * 1.7);
        const R = r * breathing;
        const tickAng = ((t * 0.055 + phase * 0.13) * 180) / Math.PI;
        const dashAng = -((t * 0.09 + phase * 0.07) * 180) / Math.PI;
        const cometAng = ((t * 0.26 + phase * 0.21) * 180) / Math.PI;
        const tickOuter = 1.062;
        const tickInner = 1.028;
        const tickLong = 1.118;

        return (
          <g key={g.id} transform={`translate(${cx} ${cy})`} opacity={alpha}>
            {/* 呼吸辉光 */}
            <circle r={R * 1.38} fill="url(#la-glow)" opacity={pulse} />
            <circle
              r={R}
              fill="none"
              stroke={GOLD_DEEP}
              strokeWidth={R * 0.055}
              opacity={0.1 * pulse}
            />
            {/* 双细环 */}
            <circle r={R} fill="none" stroke={GOLD_HOT} strokeWidth={2.2 * s} opacity={0.92} />
            <circle r={R * 0.952} fill="none" stroke={GOLD} strokeWidth={1.1 * s} opacity={0.5} />
            {/* 旋转刻度环 */}
            <g transform={`rotate(${tickAng})`}>
              {Array.from({length: 60}, (_, i) => {
                const a = (i / 60) * TAU;
                const long = i % 6 === 0;
                const r1 = long ? tickLong : tickOuter;
                return (
                  <line
                    key={i}
                    x1={Math.cos(a) * R * tickInner}
                    y1={Math.sin(a) * R * tickInner}
                    x2={Math.cos(a) * R * r1}
                    y2={Math.sin(a) * R * r1}
                    stroke={long ? GOLD_HOT : GOLD}
                    strokeWidth={(long ? 2.4 : 1.3) * s}
                    strokeLinecap="round"
                    opacity={long ? 0.95 : 0.62}
                  />
                );
              })}
            </g>
            {/* 反向虚线环 */}
            <g transform={`rotate(${dashAng})`}>
              <circle
                r={R * 0.9}
                fill="none"
                stroke={GOLD}
                strokeWidth={1.5 * s}
                strokeDasharray={`${R * 0.16} ${R * 0.11}`}
                opacity={0.52}
              />
            </g>
            {/* 四段旋弧：比刻度环转得快，给出方向感 */}
            <g transform={`rotate(${cometAng})`}>
              <circle
                r={R * 0.82}
                fill="none"
                stroke={GOLD_HOT}
                strokeWidth={3.4 * s}
                strokeLinecap="round"
                strokeDasharray={`${R * 0.5} ${R * TAU * 0.25 - R * 0.5}`}
                opacity={0.78}
              />
            </g>
            {/* 四象限点 */}
            {[0, 1, 2, 3].map((i) => {
              const a = (i * TAU) / 4 + Math.PI / 4 + phase * 0.05;
              return (
                <circle
                  key={i}
                  cx={Math.cos(a) * R * 0.74}
                  cy={Math.sin(a) * R * 0.74}
                  r={3.2 * s}
                  fill={GOLD_HOT}
                  opacity={0.68}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
};
