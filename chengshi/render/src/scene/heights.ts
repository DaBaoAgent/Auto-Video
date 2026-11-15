import type {CityData} from '../types';

/**
 * OSM 在苏州只覆盖 0.85% 建筑高度，其余全按 9m 兜底，城市因此是一张纸。
 * 这里按年轮圈层 + 片区 + 占地面积为缺失高度补一个确定性的示意值，
 * 再做一层低倍垂直夸张，让楼体在 3–8km 机位下真正有体积。
 *
 * 这是视觉补全，不是实测高度；成片署名里已经写明「示意重建」。
 */
export const HEIGHT_GAIN = 1.5;

const D2R = Math.PI / 180;

/** 古城中心（阖闾大城）与金鸡湖/园区中心，用于判断片区 */
const OLD_CENTER: [number, number] = [120.6185, 31.3051];
const SIP_CENTER: [number, number] = [120.6736, 31.3187];

const hash01 = (x: number, z: number) => {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const lonlatToXZ = (
  lon: number,
  lat: number,
  origin: [number, number],
): [number, number] => {
  const coslat = Math.cos(origin[1] * D2R);
  return [(lon - origin[0]) * 111320 * coslat, -(lat - origin[1]) * 110540];
};

export const makeHeightModel = (origin: [number, number]) => {
  const [oldX, oldZ] = lonlatToXZ(OLD_CENTER[0], OLD_CENTER[1], origin);
  const [sipX, sipZ] = lonlatToXZ(SIP_CENTER[0], SIP_CENTER[1], origin);

  /** [cx, cz, len, wid, angle, height, year, zone] */
  return (b: number[]): number => {
    const real = b[5];
    if (real > 9.5) return real;

    const cx = b[0];
    const cz = b[1];
    const year = b[6];
    const zone = b[7];
    const r = hash01(cx, cz);
    const area = Math.max(1, b[2] * b[3]);
    // 大屋顶/厂房占地在老城里反而更矮，给一个反向的小修正
    const areaLift = Math.min(18, Math.sqrt(area) * 0.22);

    let h: number;
    if (year < 1896) {
      // 古代/近代民居：1–2 层，偶尔一座小楼
      h = 5 + r * 5 + Math.min(6, areaLift * 0.3);
    } else if (zone === 0) {
      // 古城内：粉墙黛瓦的两三层，少量沿街多层
      h = 7 + r * 7 + Math.min(8, areaLift * 0.35);
    } else if (zone === 1) {
      h = 12 + r * 16 + Math.min(12, areaLift * 0.5);
    } else if (zone === 2) {
      h = 18 + r * 30 + Math.min(18, areaLift * 0.7);
    } else {
      // 中环外：园区靠湖一线高，其他地方按新市镇低层
      const toSip = Math.hypot(cx - sipX, cz - sipZ);
      const lakeBoost = Math.max(0, 1 - toSip / 4200);
      const east = cx > sipX - 9000 && cz > sipZ - 6000;
      if (east) {
        h = 20 + r * 38 + lakeBoost * 52 + Math.min(34, areaLift);
      } else {
        h = 10 + r * 18 + Math.min(10, areaLift * 0.5);
      }
    }

    // 占地越大楼不能越矮：200m 宽的厂房只有 9m 高时，低机位下就成了一张浮板。
    // 按短边给一个高度下限（封顶后约 36m），让大屋顶的楼体和屋面连成一体。
    const minDim = Math.max(1, Math.min(b[2], b[3]));
    h = Math.max(h, Math.min(24, minDim * 0.2));

    return Math.max(4, h * HEIGHT_GAIN);
  };
};

/** 楼高只用于渲染，不改 city.json；静帧与整片共用同一套推断 */
export const heightModelFor = (city: CityData) => makeHeightModel(city.origin);
