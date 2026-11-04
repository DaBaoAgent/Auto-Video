import {Composition, staticFile} from 'remotion';
import {Chengshi} from './Chengshi';
import {Sample} from './sample/Sample';
import {ShotStill} from './shot/ShotStill';
import {ApertureSample} from './sample/ApertureSample';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Chengshi"
        component={Chengshi}
        durationInFrames={4821}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={async () => {
          const film = await fetch(staticFile('data/film.json')).then((r) => r.json());
          return {
            durationInFrames: Math.max(1, Math.round(film.duration * film.fps)),
            fps: film.fps,
            width: film.width,
            height: film.height,
          };
        }}
      />
      {/* 正片 1080p 审片版：同一套组件与数据，UI 按 1080 基准等比呈现 */}
      <Composition
        id="ChengshiReview"
        component={Chengshi}
        durationInFrames={4821}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* 24 镜代表静帧（4K）：--props='{"shot":3}' */}
      <Composition
        id="ShotStill"
        component={ShotStill}
        durationInFrames={30}
        fps={30}
        width={3840}
        height={2160}
        defaultProps={{shot: 1, slate: true}}
      />
      {/* 4K 关键静帧：--props='{"year":1896}' */}
      <Composition
        id="SampleStill"
        component={Sample}
        durationInFrames={30 * 30}
        fps={30}
        width={3840}
        height={2160}
        defaultProps={{year: 1896}}
      />
      {/* 30 秒 1080p 样片 */}
      <Composition
        id="Sample"
        component={Sample}
        durationInFrames={30 * 30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{withAudio: false}}
      />
      {/* 30 秒动态审片样片：光圈生长 + 两个年代各一套签名运镜（不动正片） */}
      <Composition
        id="ApertureSample"
        component={ApertureSample}
        durationInFrames={30 * 30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{grow: true}}
      />
    </>
  );
};
