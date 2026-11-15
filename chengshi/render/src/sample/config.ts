import type {Era, Terrain} from '../types';
import type {CamState, Vec3} from '../camera';
import {sampleHeight} from '../terrain';
import {clamp, lerp, tAtYear, yearAt} from '../theme';

/**
 * 30 秒样片时间轴：前 16 秒 1896→1990 连续生长，后 14 秒按节点跳变
 * （1994 园区 / 2005 湖东 / 2015 天际线 / 2026 城长）。
 * 章节卡与顶部年代轴都读这张表。
 */
export const SAMPLE_ERAS: Era[] = [
  {t0: 0.0, t1: 3.2, year: 1896, yearLabel: '1896', chapter: '1', chapterName: '开埠', chapterEn: 'The Port Opens', camera: {x: -3210, z: 220, dist: 8500, pitch: 45, yaw: 0}},
  {t0: 3.2, t1: 7.0, year: 1927, yearLabel: '1927', chapter: '2', chapterName: '城墙消逝', chapterEn: 'The Walls Come Down', camera: {x: -3180, z: 225, dist: 8800, pitch: 45, yaw: 0}},
  {t0: 7.0, t1: 10.2, year: 1949, yearLabel: '1949', chapter: '3', chapterName: '新生', chapterEn: 'A New Era', camera: {x: -3150, z: 235, dist: 9200, pitch: 45, yaw: 0}},
  {t0: 10.2, t1: 14.0, year: 1978, yearLabel: '1978', chapter: '4', chapterName: '春潮', chapterEn: 'Spring Tide', camera: {x: -3150, z: 250, dist: 9600, pitch: 45, yaw: 0}},
  {t0: 14.0, t1: 16.0, year: 1990, yearLabel: '1990', chapter: '5', chapterName: '前夜', chapterEn: 'The Eve', camera: {x: -2900, z: 180, dist: 10000, pitch: 45, yaw: 0}},
  {t0: 16.0, t1: 19.0, year: 1994, yearLabel: '1994', chapter: '6', chapterName: '园区', chapterEn: 'The Industrial Park', camera: {x: -300, z: -350, dist: 10500, pitch: 32, yaw: 0}},
  {t0: 19.0, t1: 21.5, year: 2005, yearLabel: '2005', chapter: '7', chapterName: '湖东', chapterEn: 'East of the Lake', camera: {x: 1500, z: -1000, dist: 9800, pitch: 29, yaw: 0}},
  {t0: 21.5, t1: 24.0, year: 2015, yearLabel: '2015', chapter: '8', chapterName: '天际线', chapterEn: 'The Skyline', camera: {x: 2200, z: -1500, dist: 8500, pitch: 29, yaw: 0}},
  {t0: 24.0, t1: 30.0, year: 2026, yearLabel: '2026', chapter: '9', chapterName: '城长', chapterEn: 'The City Grew', camera: {x: 3900, z: -1725, dist: 6500, pitch: 30, yaw: 0}},
];

export const SAMPLE_FPS = 30;
export const SAMPLE_SECONDS = 30;

/** 依旧年份取一个稳定时刻：静帧与样片共用同一套机位 */
export const stillTime = (year: number) => {
  const last = SAMPLE_ERAS[SAMPLE_ERAS.length - 1];
  if (year >= last.year) return last.t0 + 0.5;
  return tAtYear(SAMPLE_ERAS, year);
};

type CamKey = {year: number; x: number; z: number; dist: number; az: number; pitch: number; fov: number};

/**
 * 机位关键帧：画面统一上北下南（机位在目标正南，az=0 朝北看）。
 * 前四个年代俯视古城；1994 起镜头东移、俯角从 45° 落到 32°，把金鸡湖收进画面，
 * 之后一路缓慢东移、推近；地标的横向分布由真实东西向位置决定。
 * 没有环绕，只有克制的东移和一次「抬头看见湖」的俯角变化。
 */
const CAM_KEYS: CamKey[] = [
  {year: 1896, x: -3210, z: 220, dist: 8500, az: 0, pitch: 45, fov: 30.5},
  {year: 1927, x: -3180, z: 225, dist: 8800, az: 0, pitch: 45, fov: 30.5},
  {year: 1949, x: -3150, z: 235, dist: 9200, az: 0, pitch: 45, fov: 30.5},
  {year: 1978, x: -3150, z: 250, dist: 9600, az: 0, pitch: 45, fov: 30.5},
  {year: 1990, x: -2900, z: 180, dist: 10000, az: 0, pitch: 45, fov: 30.2},
  {year: 1994, x: -300, z: -350, dist: 10500, az: 0, pitch: 32, fov: 36},
  {year: 2005, x: 1500, z: -1000, dist: 9800, az: 0, pitch: 29, fov: 36},
  {year: 2015, x: 2200, z: -1500, dist: 8500, az: 0, pitch: 29, fov: 34},
  {year: 2026, x: 3900, z: -1725, dist: 6500, az: 0, pitch: 30, fov: 30},
];

const D2R = Math.PI / 180;

const camKeyAt = (year: number): CamKey => {
  if (year <= CAM_KEYS[0].year) return CAM_KEYS[0];
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    const a = CAM_KEYS[i];
    const b = CAM_KEYS[i + 1];
    if (year <= b.year) {
      const p = clamp((year - a.year) / (b.year - a.year || 1), 0, 1);
      // 机位滑移比年份更慢一点：先看到城市变化，镜头再跟上
      const q = p * p * (3 - 2 * p);
      return {
        year,
        x: lerp(a.x, b.x, q),
        z: lerp(a.z, b.z, q),
        dist: lerp(a.dist, b.dist, q),
        az: lerp(a.az, b.az, q),
        pitch: lerp(a.pitch, b.pitch, q),
        fov: lerp(a.fov, b.fov, q),
      };
    }
  }
  return CAM_KEYS[CAM_KEYS.length - 1];
};

export const SAMPLE_FOV = 30.5;

export const sampleCameraAt = (terrain: Terrain, t: number): CamState => {
  const year = yearAt(SAMPLE_ERAS, t);
  const k = camKeyAt(year);
  const tilt = k.pitch * D2R;
  const rad = k.dist * Math.cos(tilt);
  const alt = k.dist * Math.sin(tilt);
  const az = k.az * D2R;
  const x = k.x + Math.sin(az) * rad;
  const z = k.z + Math.cos(az) * rad;
  const pos: Vec3 = [x, sampleHeight(terrain, x, z) + alt, z];
  const target: Vec3 = [k.x, sampleHeight(terrain, k.x, k.z) + 24, k.z];
  // 轻微手持浮动，航线仍然是直线东移
  pos[0] += Math.sin(t * 0.53) * 10;
  pos[1] += Math.sin(t * 0.41 + 1.2) * 6;
  pos[2] += Math.cos(t * 0.47 + 0.3) * 9;
  target[0] += Math.sin(t * 0.37 + 2.0) * 3;
  target[2] += Math.cos(t * 0.43 + 0.7) * 2.5;
  return {pos, target, fov: k.fov};
};

/** 楼高上限：越早的年代，城市越矮（今天的高楼数据不能直接搬回 1896） */
export const heightCapFor = (year: number) =>
  year >= 2010 ? 800 : year >= 2000 ? 200 : year >= 1990 ? 75 : year >= 1950 ? 30 : year >= 1900 ? 24 : 16;

const hash01 = (x: number, z: number) => {
  const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

/**
 * 年代模式下的「出现年份」。老城（zone 0）今天的数据是满的，直接拿到 1896 会看不出
 * 与 1978 的差别；这里只保留四成多，其余在 1896—1978 年间陆续出现，
 * 让城墙内也有生长，第一眼就能读出年代差（视觉冲击优先于绝对史实）。
 */
export const eraRevealYear = (x: number, z: number, birth: number, zone: number) => {
  const q = hash01(x, z);
  if (zone === 0) {
    // 先秦：OSM 没有这么老的建筑记录，按数据里 -514～-221 这批老城足迹重排——
    // 七成在阖闾城落成时就有，其余在到会稽郡之间补齐，第一章城内才不是一块空绿地
    if (birth <= -221) {
      if (q < 0.7) return -600 + (q / 0.7) * 86;
      return Math.max(birth, -514 + ((q - 0.7) / 0.3) * 293);
    }
    if (q < 0.44) return birth;
    // 只有「1896 年之后才记录」的现代楼才需要摊到 1896–1978 里补生长；
    // 有真实历史出生年的老楼必须按原本年份出现，否则 1368 的城里会凭空少一半
    if (birth < 1896) return birth;
    return Math.max(birth, 1896 + ((q - 0.44) / 0.56) * 82);
  }
  // 城墙外 3km 内的近郊在 1896 已有人烟，不留一圈空田；
  // 这些 footprint 多数是后来翻建的，按年代上限压低即可当旧聚落读
  if (zone === -1 && Math.hypot(x + 3210, z + 110) < 3000 && q < 0.4) {
    return 1896 + (q / 0.4) * 54;
  }
  // 1960—1978 城墙外成片的工厂与新村，1978 的外围轮廓明显比 1896 鼓出来
  if (zone === 1 && q < 0.28) return 1962 + (q / 0.28) * 16;
  return birth;
};

export type EraInfo = {year: number; name: string; en: string};

/** 年代卡与章节卡共用 SAMPLE_ERAS：年份连续推进时停在当前章节，不会在半章里跳名 */
export const eraInfoFor = (year: number): EraInfo => {
  let cur = SAMPLE_ERAS[0];
  for (const era of SAMPLE_ERAS) {
    if (era.year <= year) cur = era;
  }
  return {year: cur.year, name: cur.chapterName, en: cur.chapterEn};
};
