import {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFilmData} from '../data';
import {CityScene} from '../scene/CityScene';
import {ChapterCard} from '../ui/ChapterCard';
import {Captions} from '../ui/Captions';
import {LandmarkTags} from '../ui/LandmarkTags';
import {Grain} from '../ui/Grain';
import {Vignette} from '../ui/Vignette';
import {Fade} from '../ui/Fade';
import {TitleCard} from '../ui/TitleCard';
import {Watermark} from '../ui/Watermark';
import {eraAt, yearAt} from '../theme';
import {nightAt, skyGradientAt} from '../lighting';
import {makeOpeningCamera} from './openingCamera';

/**
 * 30 秒样片：只用于审片，不改正片与其他静帧。
 * 两个年代两套签名运镜，首段同时完成光圈「光笔描环 + 由中心点亮」的生长。
 */
export const ApertureSample: React.FC<{grow?: boolean}> = ({grow = true}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const data = useFilmData();

  const helv = data?.rings.find((r) => r.id === 'helv');
  const center = useMemo<[number, number] | null>(() => {
    if (!helv || helv.polygon.length < 3) return null;
    let cx = 0;
    let cz = 0;
    for (const [x, z] of helv.polygon) {
      cx += x;
      cz += z;
    }
    return [cx / helv.polygon.length, cz / helv.polygon.length];
  }, [helv]);

  const shotAt = useMemo(
    () => (data && center ? makeOpeningCamera(data.terrain, center) : undefined),
    [data, center],
  );

  if (!data) {
    return <AbsoluteFill style={{backgroundColor: '#000'}} />;
  }

  const {city, terrain, rings, timeline, captions, landmarks, satellite} = data;
  const year = yearAt(timeline.eras, t);
  const era = eraAt(timeline.eras, t);
  const duration = durationInFrames / fps;

  return (
    <AbsoluteFill style={{background: skyGradientAt(nightAt(t))}}>
      <CityScene
        city={city}
        terrain={terrain}
        rings={rings}
        eras={timeline.eras}
        t={t}
        year={year}
        width={width}
        height={height}
        landmarks={landmarks}
        satellite={satellite}
        shotAt={shotAt}
        apertureGrow={grow}
      />
      <Audio src={staticFile('audio/mix.m4a')} />
      <Vignette />
      <Grain />
      <TitleCard t={t} persist />
      <ChapterCard era={era} t={t} corner="tr" />
      <Captions captions={captions} t={t} />
      <LandmarkTags
        landmarks={landmarks}
        city={city}
        terrain={terrain}
        eras={timeline.eras}
        year={year}
        t={t}
        width={width}
        height={height}
        shotAt={shotAt}
      />
      <Watermark />
      <Fade t={t} duration={duration} />
    </AbsoluteFill>
  );
};
