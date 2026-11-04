import type {CamState} from '../camera';
import {sampleHeight} from '../terrain';
import type {Terrain} from '../types';

/**
 * 24 镜代表静帧：每镜取一个能说明本章运动与信息的机位。
 * az=0 时机位在目标正南；给不同方位角是为了让屋脊/街巷有斜向透视，
 * 不再让 24 张全是从正南看的一张地图。
 */
export type ShotDef = {
  n: number;
  /** 该镜在全片里的代表时刻（秒） */
  t: number;
  year: number;
  /** 章节显示编号 1–11（与分镜表一致） */
  chapter: number;
  chapterName: string;
  chapterEn: string;
  /** 卫星影像透明度：0=纯地形色块，1=全影像 */
  satBlend: number;
  /** 夜景强度：0=金色时刻，1=蓝调亮灯 */
  night: number;
  x: number;
  z: number;
  dist: number;
  pitch: number;
  fov: number;
  /** 方位角（度）：0=机位在目标正南，正=机位向东偏，负=向西偏 */
  az?: number;
  /** 点名要显示的引线标签（SampleTags 的 id） */
  tags?: string[];
  note: string;
};

const CH = {
  prelude: {chapter: 1, chapterName: '序 · 江南', chapterEn: 'Prelude · Jiangnan'},
  helv: {chapter: 2, chapterName: '阖闾城', chapterEn: 'The City of Helü'},
  kuaiji: {chapter: 3, chapterName: '会稽郡', chapterEn: 'Kuaiji Commandery'},
  suzhou: {chapter: 4, chapterName: '苏州', chapterEn: 'The Name Suzhou'},
  shantang: {chapter: 5, chapterName: '山塘', chapterEn: 'Shantang Canal'},
  pingjiang: {chapter: 6, chapterName: '平江府', chapterEn: 'Pingjiang Prefecture'},
  prefecture: {chapter: 7, chapterName: '苏州府', chapterEn: 'Suzhou Prefecture'},
  gusu: {chapter: 8, chapterName: '姑苏', chapterEn: 'Gusu'},
  port: {chapter: 9, chapterName: '开埠', chapterEn: 'The Port Opens'},
  park: {chapter: 10, chapterName: '园区', chapterEn: 'The Industrial Park'},
  rings: {chapter: 11, chapterName: '年轮', chapterEn: 'Rings of the City'},
};

export const SHOTS: ShotDef[] = [
  {
    n: 1, t: 3.0, year: -1250, ...CH.prelude, satBlend: 0, night: 0,
    x: 0, z: 0, dist: 22000, pitch: 38, fov: 34, az: 8,
    note: '高空俯瞰太湖以东：湖面、水网、平原，城市尚未出现',
  },
  {
    n: 2, t: 9.0, year: -1250, ...CH.prelude, satBlend: 0, night: 0,
    x: -2400, z: 500, dist: 2000, pitch: 6, fov: 32, az: -18,
    note: '贴水面低平前推，河道如叶脉，一条水色年轮线亮起',
  },
  {
    n: 3, t: 15.5, year: -514, ...CH.helv, satBlend: 0, night: 0,
    x: -3200, z: 400, dist: 6600, pitch: 24, fov: 34, az: 16,
    tags: ['panmen'],
    note: '斜俯视古城，八边形城墙轮廓闭合，八门依次点亮',
  },
  {
    n: 4, t: 22.0, year: -514, ...CH.helv, satBlend: 0, night: 0,
    x: -3200, z: -300, dist: 2000, pitch: 20, fov: 34, az: -26,
    note: '低空侧掠水巷，河道与街巷并肩',
  },
  {
    n: 5, t: 26.5, year: -514, ...CH.helv, satBlend: 0, night: 0,
    x: -3200, z: 0, dist: 7200, pitch: 28, fov: 34, az: 8,
    note: '缓升，三横四直网格铺满全城',
  },
  {
    n: 6, t: 34.0, year: -221, ...CH.kuaiji, satBlend: 0, night: 0,
    x: -3600, z: -300, dist: 5400, pitch: 29, fov: 32, az: -14,
    note: '斜俯西移，粮船光点沿运河向北方流动',
  },
  {
    n: 7, t: 41.0, year: -221, ...CH.kuaiji, satBlend: 0, night: 0,
    x: -6000, z: 0, dist: 10800, pitch: 28, fov: 32, az: 18,
    note: '拉升到区域尺度，运河光带向画外延伸',
  },
  {
    n: 8, t: 48.0, year: 589, ...CH.suzhou, satBlend: 0, night: 0,
    x: -3200, z: -300, dist: 6400, pitch: 27, fov: 33, az: -10,
    note: '缓推古城，城名落版',
  },
  {
    n: 9, t: 55.0, year: 589, ...CH.suzhou, satBlend: 0, night: 0,
    x: -2400, z: -300, dist: 2800, pitch: 18, fov: 32, az: 22,
    note: '东移沿运河，镜头降到低空',
  },
  {
    n: 10, t: 62.0, year: 825, ...CH.shantang, satBlend: 0, night: 0,
    x: -5700, z: -2300, dist: 2200, pitch: 16, fov: 33, az: -24,
    tags: ['shantang'],
    note: '沿山塘河低飞，水街与灯带',
  },
  {
    n: 11, t: 70.5, year: 825, ...CH.shantang, satBlend: 0, night: 0,
    x: -5700, z: -2400, dist: 6000, pitch: 27, fov: 32, az: 12,
    tags: ['shantang', 'huqiu'],
    note: '拉升，山塘线从阊门延伸至虎丘',
  },
  {
    n: 12, t: 78.0, year: 1229, ...CH.pingjiang, satBlend: 0, night: 0,
    x: -3200, z: 300, dist: 6800, pitch: 27, fov: 33, az: -16,
    tags: ['panmen', 'ruiguang'],
    note: '斜俯视，《平江图》网格叠加城市',
  },
  {
    n: 13, t: 83.0, year: 1229, ...CH.pingjiang, satBlend: 0, night: 0,
    x: -2900, z: -600, dist: 2200, pitch: 18, fov: 34, az: 26,
    note: '低飞斜穿双棋盘，桥点逐座亮起',
  },
  {
    n: 14, t: 91.0, year: 1229, ...CH.pingjiang, satBlend: 0, night: 0,
    x: -3500, z: -400, dist: 2400, pitch: 18, fov: 33, az: -22,
    note: '低飞侧掠，一桥一巷',
  },
  {
    n: 15, t: 98.0, year: 1368, ...CH.prefecture, satBlend: 0, night: 0,
    x: -3000, z: -1400, dist: 6400, pitch: 27, fov: 33, az: 14,
    tags: ['zhuozheng', 'beisi'],
    note: '斜俯慢东移，园林与塔的光点',
  },
  {
    n: 16, t: 106.0, year: 1368, ...CH.prefecture, satBlend: 0, night: 0,
    x: -3100, z: -1300, dist: 1900, pitch: 16, fov: 34, az: -28,
    tags: ['beisi'],
    note: '低飞巷子，屋檐与灯',
  },
  {
    n: 17, t: 114.0, year: 1750, ...CH.gusu, satBlend: 0, night: 0.55,
    x: -6900, z: -250, dist: 2600, pitch: 16, fov: 33, az: 24,
    tags: ['hanshan'],
    note: '运河夜航，商船光点往来',
  },
  {
    n: 18, t: 121.0, year: 1750, ...CH.gusu, satBlend: 0, night: 0.8,
    x: -4000, z: 0, dist: 8200, pitch: 28, fov: 33, az: -14,
    tags: ['hanshan', 'beisi'],
    note: '拉升，全城灯火铺开',
  },
  {
    n: 19, t: 127.5, year: 1896, ...CH.port, satBlend: 0.55, night: 0.12,
    x: -3500, z: 700, dist: 6400, pitch: 26, fov: 32, az: 20,
    tags: ['panmen'],
    note: '卫星影像首次淡入，城墙内外',
  },
  {
    n: 20, t: 133.5, year: 1896, ...CH.port, satBlend: 1, night: 0,
    x: -3200, z: 900, dist: 4200, pitch: 24, fov: 33, az: -16,
    tags: ['panmen'],
    note: '东移侧掠，城外新街区浮出',
  },
  {
    n: 21, t: 138.5, year: 1994, ...CH.park, satBlend: 1, night: 0,
    x: 1500, z: -1000, dist: 9000, pitch: 24, fov: 36, az: 22,
    tags: ['jinji', 'sip'],
    note: '金鸡湖面光带，第一根桩升起光柱',
  },
  {
    n: 22, t: 141.0, year: 2015, ...CH.park, satBlend: 1, night: 0,
    x: 2200, z: -1500, dist: 5200, pitch: 20, fov: 34, az: -18,
    tags: ['orient', 'suzhoucenter'],
    note: '楼群从地面挤出生长，天际线立起',
  },
  {
    n: 23, t: 144.5, year: 2026, ...CH.rings, satBlend: 1, night: 0,
    x: -800, z: 0, dist: 12000, pitch: 24, fov: 36, az: 14,
    tags: ['ifs', 'orient'],
    note: '升至全景，多层年轮同时升起',
  },
  {
    n: 24, t: 148.2, year: 2026, ...CH.rings, satBlend: 1, night: 0,
    x: -900, z: -150, dist: 11000, pitch: 22, fov: 36, az: 8,
    tags: ['ifs', 'orient', 'suzhoucenter'],
    note: '年轮扩张减速，水光带与年轮重合，落版',
  },
];

export const shotByNumber = (n: number) => SHOTS.find((s) => s.n === n) ?? SHOTS[0];

const D2R = Math.PI / 180;

/** az=0：机位在目标正南、朝北看；距离/俯角/方位角换算出机位 */
export const cameraFor = (s: ShotDef, terrain: Terrain): CamState => {
  const tilt = s.pitch * D2R;
  const rad = s.dist * Math.cos(tilt);
  const alt = s.dist * Math.sin(tilt);
  const az = (s.az ?? 0) * D2R;
  const px = s.x + Math.sin(az) * rad;
  const pz = s.z + Math.cos(az) * rad;
  // 低空镜头要收近裁剪面，否则脚下地面直接被剪掉；远平面同步收缩保深度精度
  const near = alt < 500 ? 10 : alt < 1500 ? 60 : alt < 4000 ? 300 : 500;
  const far = alt < 500 ? 60000 : alt < 1500 ? 120000 : alt < 4000 ? 180000 : 260000;
  return {
    pos: [px, sampleHeight(terrain, px, pz) + alt, pz],
    target: [s.x, sampleHeight(terrain, s.x, s.z) + 24, s.z],
    fov: s.fov,
    near,
    far,
  };
};
