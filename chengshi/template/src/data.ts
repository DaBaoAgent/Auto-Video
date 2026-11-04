import {useEffect, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import type {Caption, CityData, Film, Landmark, Ring, Tag, Terrain, Timeline} from './types';
import {FLAT_TERRAIN} from './terrain';

/** 卫星底图：贴图 + 影像经纬范围 [lat_b, lon_l, lat_t, lon_r] */
export type Satellite = {tex: THREE.Texture; bbox: [number, number, number, number]};

export type FilmData = {
  film: Film;
  city: CityData;
  terrain: Terrain;
  rings: Ring[];
  timeline: Timeline;
  captions: Caption[];
  tags: Tag[];
  landmarks: Landmark[];
  satellite: Satellite | null;
};

const load = async (name: string) => {
  const res = await fetch(staticFile(`data/${name}`));
  if (!res.ok) {
    if (name === 'tags.json') return [];
    throw new Error(`读不到 data/${name}（${res.status}）`);
  }
  return res.json();
};

const loadOptional = async (name: string) => {
  const res = await fetch(staticFile(`data/${name}`));
  return res.ok ? res.json() : null;
};

/** 贴图必须在捕获前完全解码，否则首帧会是灰面 */
const loadTexture = (name: string) =>
  new Promise<THREE.Texture>((resolve, reject) => {
    const handle = delayRender(`加载 ${name}`);
    new THREE.TextureLoader().load(
      staticFile(`data/${name}`),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        tex.anisotropy = 4;
        continueRender(handle);
        resolve(tex);
      },
      undefined,
      (err) => {
        continueRender(handle);
        reject(new Error(`读不到 data/${name}（${String(err)}）`));
      },
    );
  });

export const useFilmData = (): FilmData | null => {
  const [data, setData] = useState<FilmData | null>(null);
  const [handle] = useState(() => delayRender('加载城市数据'));

  useEffect(() => {
    let alive = true;
    Promise.all([
      load('film.json'),
      load('city.json'),
      load('rings.json'),
      load('timeline.json'),
      load('captions.json'),
      load('tags.json'),
      load('terrain.json').catch(() => FLAT_TERRAIN),
      loadOptional('satellite.json'),
      loadOptional('landmarks.json'),
    ])
      .then(async ([film, city, rings, timeline, captions, tags, terrain, satMeta, landmarks]) => {
        const satellite: Satellite | null = satMeta
          ? {tex: await loadTexture('satellite.jpg'), bbox: satMeta.bbox_wgs84}
          : null;
        if (!alive) return;
        setData({
          film,
          city,
          terrain,
          rings,
          timeline,
          captions,
          tags,
          landmarks: landmarks ?? [],
          satellite,
        });
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
    return () => {
      alive = false;
    };
  }, [handle]);

  return data;
};
