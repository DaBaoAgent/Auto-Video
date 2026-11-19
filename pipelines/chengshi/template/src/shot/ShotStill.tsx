import {useMemo} from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {useFilmData} from '../data';
import {CityScene} from '../scene/CityScene';
import {ChapterCard} from '../ui/ChapterCard';
import {Captions} from '../ui/Captions';
import {EraAxis} from '../ui/EraAxis';
import {Grain} from '../ui/Grain';
import {Vignette} from '../ui/Vignette';
import {SampleTags} from '../sample/SampleTags';
import {skyGradientAt} from '../lighting';
import {fmtYear} from '../theme';
import type {Era} from '../types';
import {cameraFor, shotByNumber} from './shots';

export type ShotStillProps = {
  /** 1–24，对应分镜表 */
  shot: number;
  /** 审片用场记条：右下角显示镜号/章节/年份/代表时刻 */
  slate?: boolean;
};

/**
 * 24 镜代表静帧：直接把影片的场景层与 HUD 层按指定年份/机位铺开。
 * 不做转场，只回答「这一镜长什么样」。
 */
export const ShotStill: React.FC<ShotStillProps> = ({shot, slate = true}) => {
  const {width, height} = useVideoConfig();
  const data = useFilmData();
  const s = shotByNumber(shot);

  const cam = useMemo(() => (data ? cameraFor(s, data.terrain) : null), [data, s]);
  const shotAt = useMemo(() => (cam ? () => cam : undefined), [cam]);

  if (!data || !cam) return <AbsoluteFill style={{backgroundColor: '#050505'}} />;

  const {city, terrain, rings, landmarks, satellite, captions} = data;
  const uiScale = width / 3840;

  const cardEra: Era = {
    t0: 0,
    t1: 2,
    year: s.year,
    yearLabel: fmtYear(s.year),
    chapter: String(s.chapter),
    chapterName: s.chapterName,
    chapterEn: s.chapterEn,
    camera: {x: s.x, z: s.z, dist: s.dist, pitch: s.pitch, yaw: 0},
  };

  return (
    <AbsoluteFill style={{background: skyGradientAt(s.night)}}>
      <CityScene
        city={city}
        terrain={terrain}
        rings={rings}
        eras={[cardEra]}
        t={s.t}
        year={s.year}
        width={width}
        height={height}
        landmarks={landmarks}
        satellite={satellite}
        yearMode
        fixedYear={s.year}
        capHeights
        shotAt={shotAt}
        satOpacity={s.satBlend}
        nightOverride={s.night}
      />
      <Vignette />
      <Grain />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 3840,
          height: 2160,
          transform: `scale(${uiScale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 3840,
            height: 460,
            background:
              'linear-gradient(180deg, rgba(8,10,14,0.52) 0%, rgba(8,10,14,0.18) 55%, rgba(8,10,14,0) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 3840,
            height: 840,
            background:
              'linear-gradient(0deg, rgba(8,10,14,0.62) 0%, rgba(8,10,14,0.22) 55%, rgba(8,10,14,0) 100%)',
          }}
        />
        <EraAxis year={s.year} />
        <ChapterCard era={cardEra} t={1.5} top={320} />
        <SampleTags
          year={s.year}
          t={s.t}
          city={city}
          terrain={terrain}
          width={3840}
          height={2160}
          ids={s.tags}
          cam={cam}
        />
        <Captions captions={captions} t={s.t} />
        {slate && (
          <div
            style={{
              position: 'absolute',
              left: 150,
              bottom: 34,
              fontFamily: 'Consolas, "Courier New", monospace',
              fontSize: 26,
              letterSpacing: 2,
              color: 'rgba(255,255,255,0.42)',
              whiteSpace: 'nowrap',
            }}
          >
            {`S${String(s.n).padStart(2, '0')} · ${String(s.chapter).padStart(2, '0')} ${s.chapterName} · ${fmtYear(s.year)} · t=${s.t.toFixed(1)}s`}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
