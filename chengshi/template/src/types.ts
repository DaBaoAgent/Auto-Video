export type Film = {
  slug: string;
  title: string;
  title_en?: string;
  subtitle_cn?: string;
  subtitle_en?: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  scope_cn: string;
  scope_en: string;
  credits: string[];
  data: {bbox: number[]; default_year: number};
  audio?: {music?: string; loudness?: {lufs: number; tp: number}};
  delivery?: {out_dir: string};
};

export type Era = {
  t0: number;
  t1: number;
  year: number;
  yearLabel: string;
  chapter: string;
  chapterName: string;
  chapterEn: string;
  ring?: string;
  camera: {x: number; z: number; dist: number; pitch: number; yaw: number};
};

export type Tick = {year: number; label: string; x: number};

export type Timeline = {ticks: Tick[]; eras: Era[]};

export type Caption = {t0: number; t1: number; cn: string; en: string};

export type Tag = {
  t0: number;
  t1: number;
  cn: string;
  en: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
};

export type Ring = {
  id: string;
  name: string;
  en: string;
  year: number;
  yearLabel: string;
  color: string;
  polygon: number[][];
  area: number;
  assign_year?: number;
  note?: string;
};

/** DEM 网格：行从北往南，列从西往东，h 为整米高程 */
export type Terrain = {
  x0: number;
  z0: number;
  dx: number;
  dz: number;
  nx: number;
  nz: number;
  h: number[];
};

/** 地标：经纬度 + 实测/估算高度，按建造年代决定何时出现 */
export type Landmark = {
  id: string;
  name: string;
  en: string;
  lon: number;
  lat: number;
  height: number;
  type: string;
  era: string;
  chapter: number;
  source?: string;
  note?: string;
};

export type CityData = {
  origin: [number, number];
  bbox: [number, number, number, number];
  count: number;
  /** [cx, cz, len, wid, angleDeg, height, year, zone] */
  buildings: number[][];
  roads: {k: number; p: number[][]}[];
  water: number[][][];
  waterways: number[][][];
  /** 写实底图：绿地/林地/农田多边形 {t: 类别, p: [[x,z],…]} */
  landuse?: {t: string; p: number[][]}[];
  /** 树木示意点 [x, z, 冠幅半径m] */
  trees?: number[][];
  defaultYear: number;
};
