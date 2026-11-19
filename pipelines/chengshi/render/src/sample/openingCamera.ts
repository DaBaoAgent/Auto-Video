import type {CamState, Vec3} from '../camera';
import type {Terrain} from '../types';
import {sampleHeight} from '../terrain';

const D2R = Math.PI / 180;

type Key = {t: number; dist: number; pitch: number; az: number; fov: number};

/**
 * 30 秒样片专用航线，两个年代各一套签名运镜，段内连续、不硬切：
 * - 前 1250（0–12 s）：26000 m 高空俯冲 → 落定光圈 → 贴地掠行 → 猛拉升；
 * - 前 514–前 221（12–30 s）：绕城墙低空盘旋近一整圈 → 拉升到区域尺度。
 * 方位角 0 表示机位在城址正南；负值向东侧绕。
 */
const KEYS: Key[] = [
  {t: 0.0, dist: 26000, pitch: 74, az: 10, fov: 36},
  {t: 1.2, dist: 16500, pitch: 65, az: 14, fov: 35},
  {t: 2.4, dist: 10000, pitch: 50, az: 19, fov: 34},
  {t: 3.4, dist: 7000, pitch: 35, az: 24, fov: 33},
  {t: 4.3, dist: 6100, pitch: 28, az: 30, fov: 33},
  {t: 5.8, dist: 4400, pitch: 21, az: 42, fov: 34},
  {t: 7.5, dist: 7200, pitch: 34, az: 60, fov: 36},
  {t: 9.5, dist: 10000, pitch: 45, az: 45, fov: 37},
  {t: 12.0, dist: 7800, pitch: 34, az: 0, fov: 35},
  {t: 13.5, dist: 5200, pitch: 24, az: -35, fov: 33},
  {t: 15.2, dist: 4200, pitch: 18, az: -75, fov: 32},
  {t: 16.8, dist: 3900, pitch: 16, az: -115, fov: 31},
  {t: 18.4, dist: 3500, pitch: 14, az: -155, fov: 31},
  {t: 20.2, dist: 3900, pitch: 17, az: -200, fov: 32},
  {t: 22.2, dist: 6500, pitch: 30, az: -238, fov: 34},
  {t: 24.2, dist: 10500, pitch: 43, az: -268, fov: 36},
  {t: 26.2, dist: 12500, pitch: 49, az: -288, fov: 37},
  {t: 28.2, dist: 9000, pitch: 37, az: -312, fov: 36},
  {t: 30.0, dist: 6500, pitch: 29, az: -330, fov: 34},
];

const hermite = (p0: number, p1: number, m0: number, m1: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    (2 * u3 - 3 * u2 + 1) * p0 +
    (u3 - 2 * u2 + u) * m0 +
    (-2 * u3 + 3 * u2) * p1 +
    (u3 - u2) * m1
  );
};

/** 关键帧按时间做 C1 连续的 Hermite 插值，速度不归零，镜头一直“在走” */
const at = (t: number) => {
  const first = KEYS[0];
  const last = KEYS[KEYS.length - 1];
  if (t <= first.t) return first;
  if (t >= last.t) return last;
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const dt = b.t - a.t;
  const u = (t - a.t) / dt;
  const prev = KEYS[Math.max(0, i - 1)];
  const next = KEYS[Math.min(KEYS.length - 1, i + 2)];
  const pick = (k: 'dist' | 'pitch' | 'az' | 'fov') => {
    const m0 = i === 0 ? (b[k] - a[k]) / dt : (b[k] - prev[k]) / (b.t - prev.t);
    const m1 =
      i + 1 === KEYS.length - 1 ? (b[k] - a[k]) / dt : (next[k] - a[k]) / (next.t - a.t);
    return hermite(a[k], b[k], m0 * dt, m1 * dt, u);
  };
  return {dist: pick('dist'), pitch: pick('pitch'), az: pick('az'), fov: pick('fov')};
};

/** center 为阖闾城光圈中心（世界坐标） */
export const makeOpeningCamera =
  (terrain: Terrain, center: [number, number]) =>
  (t: number): CamState => {
    const k = at(t);
    const dist = Math.max(2500, k.dist);
    const pitch = Math.min(82, Math.max(10, k.pitch)) * D2R;
    const az = k.az * D2R;
    const rad = dist * Math.cos(pitch);
    const alt = dist * Math.sin(pitch);
    const x = center[0] + Math.sin(az) * rad;
    const z = center[1] + Math.cos(az) * rad;
    const pos: Vec3 = [x, sampleHeight(terrain, x, z) + alt, z];
    const target: Vec3 = [
      center[0],
      sampleHeight(terrain, center[0], center[1]) + 30,
      center[1],
    ];

    // 轻微手持浮动（米级），高速移动时避免完全“机器感”
    pos[0] += Math.sin(t * 0.83) * 8;
    pos[1] += Math.sin(t * 0.71 + 1.1) * 5;
    pos[2] += Math.cos(t * 0.77 + 0.4) * 7;
    target[0] += Math.sin(t * 0.37 + 2.0) * 3;
    target[2] += Math.cos(t * 0.43 + 0.7) * 2.5;

    const near = alt < 800 ? 10 : alt < 2000 ? 60 : alt < 5000 ? 300 : 500;
    const far = alt < 800 ? 60000 : alt < 2000 ? 120000 : alt < 5000 ? 180000 : 260000;
    return {pos, target, fov: k.fov, near, far};
  };
