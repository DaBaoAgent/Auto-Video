import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFilmData} from '../data';
import {CityScene} from '../scene/CityScene';
import {ChapterCard} from '../ui/ChapterCard';
import {EraAxis} from '../ui/EraAxis';
import {Grain} from '../ui/Grain';
import {eraAt, yearAt} from '../theme';
import {nightAt, skyGradientAt} from '../lighting';
import {SAMPLE_ERAS, sampleCameraAt, stillTime} from './config';
import {EraCard} from './EraCard';
import {SampleTags} from './SampleTags';

export type SampleProps = {
  /** 给了年份 = 4K 静帧；不给 = 30 秒样片 */
  year?: number;
  withAudio?: boolean;
};

export const Sample: React.FC<SampleProps> = ({year: fixedYear, withAudio}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const data = useFilmData();
  const t = fixedYear !== undefined ? stillTime(fixedYear) : frame / fps;

  if (!data) return <AbsoluteFill style={{backgroundColor: '#050505'}} />;

  const {city, terrain, rings, landmarks, satellite} = data;
  const year = fixedYear !== undefined ? fixedYear : yearAt(SAMPLE_ERAS, t);
  const era = eraAt(SAMPLE_ERAS, t);
  // 所有文字层按 4K 设计，1080p 样片整体缩放，保证两版构图完全一致
  const uiScale = width / 3840;

  return (
    <AbsoluteFill style={{background: skyGradientAt(nightAt(t))}}>
      <CityScene
        city={city}
        terrain={terrain}
        rings={rings}
        eras={SAMPLE_ERAS}
        t={t}
        year={year}
        width={width}
        height={height}
        landmarks={landmarks}
        satellite={satellite}
        yearMode
        fixedYear={fixedYear}
        capHeights
        shotAt={(tt) => sampleCameraAt(terrain, tt)}
      />
      {withAudio && <Audio src={staticFile('audio/sample_mix.m4a')} />}
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
        {/* 文字压暗层：轴和年代卡要压在高亮卫星/农田上也读得清 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 3840,
            height: 460,
            background: 'linear-gradient(180deg, rgba(8,10,14,0.52) 0%, rgba(8,10,14,0.18) 55%, rgba(8,10,14,0) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: 3840,
            height: 840,
            background: 'linear-gradient(0deg, rgba(8,10,14,0.62) 0%, rgba(8,10,14,0.22) 55%, rgba(8,10,14,0) 100%)',
          }}
        />
        <EraAxis year={year} />
        {fixedYear === undefined ? <ChapterCard era={era} t={t} top={320} /> : <EraCard year={year} />}
        <SampleTags year={year} t={t} city={city} terrain={terrain} width={3840} height={2160} />
      </div>
    </AbsoluteFill>
  );
};
