import {useMemo} from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {useFilmData} from './data';
import {CityScene} from './scene/CityScene';
import {ChapterCard} from './ui/ChapterCard';
import {Captions} from './ui/Captions';
import {EndCard} from './ui/EndCard';
import {LandmarkTags} from './ui/LandmarkTags';
import {LandmarkApertures} from './ui/LandmarkApertures';
import {Grain} from './ui/Grain';
import {Vignette} from './ui/Vignette';
import {Fade} from './ui/Fade';
import {TitleCard} from './ui/TitleCard';
import {Watermark} from './ui/Watermark';
import {eraAt, yearAt} from './theme';
import {nightAt, skyGradientAt} from './lighting';
import {makeFilmCamera} from './camera';
import {makeOpeningCamera} from './sample/openingCamera';

export const Chengshi: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const data = useFilmData();
  const t = frame / fps;

  // 前 30 s 与已审样片同一条航线；30 s 后按 11 章镜头表接续。
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

  const shotAt = useMemo(() => {
    if (!data || !center) return undefined;
    const opening = makeOpeningCamera(data.terrain, center);
    return makeFilmCamera(opening, data.timeline.eras, data.city.origin, data.terrain);
  }, [data, center]);

  if (!data) {
    return <AbsoluteFill style={{backgroundColor: '#000'}} />;
  }

  const {film, city, terrain, rings, timeline, captions, landmarks, satellite} = data;
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
        apertureGrow
      />
      <Audio src={staticFile('audio/mix.m4a')} />
      <Vignette />
      <Grain />
      <TitleCard t={t} persist />
      <ChapterCard era={era} t={t} corner="tr" />
      <Captions captions={captions} t={t} />
      <LandmarkApertures
        landmarks={landmarks}
        city={city}
        terrain={terrain}
        year={year}
        t={t}
        width={width}
        height={height}
        shotAt={shotAt}
      />
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
      <EndCard film={film} t={t} duration={duration} />
      <Watermark />
      <Fade t={t} duration={duration} />
    </AbsoluteFill>
  );
};
