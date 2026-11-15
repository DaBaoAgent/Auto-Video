import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import shotsData from '../data/shots.json';
import {ShotContent} from './content';
import {Caption, CaptionVeil, FontGate, LookProvider, PAPER} from './look';
import {BgProvider, BgCfg} from './BgContext';
import {Ornament, OrnamentCfg} from './Ornament';
import {OldFilm, OldFilmCfg} from './OldFilm';
import {BookCard} from './shots/BookCard';
import {SealCard} from './shots/SealCard';
import {NumCard} from './shots/NumCard';
import {SignCard} from './shots/SignCard';
// 早期手写场景卡（赤壁那一集留下的，保留作参考；新片建议用上面四张内容驱动的通用卡）
import {S01Year} from './shots/S01Year';
import {S02March} from './shots/S02March';
import {S03Death} from './shots/S03Death';
import {S04Surrender} from './shots/S04Surrender';
import {S05Counties} from './shots/S05Counties';
import {S06Flags} from './shots/S06Flags';
import {S07River} from './shots/S07River';
import {S08Wind} from './shots/S08Wind';
import {S09Ignite} from './shots/S09Ignite';
import {S10Fire} from './shots/S10Fire';
import {S11Mud} from './shots/S11Mud';
import {S12Close} from './shots/S12Close';

/** 通用卡片（内容全由 content 驱动，跨项目可复用） */
const REGISTRY: Record<string, React.FC<{content?: ShotContent}>> = {
  bookcard: BookCard,
  sealcard: SealCard,
  numcard: NumCard,
  signcard: SignCard,
  s01_year: S01Year,
  s02_march: S02March,
  s03_death: S03Death,
  s04_surrender: S04Surrender,
  s05_counties: S05Counties,
  s06_flags: S06Flags,
  s07_river: S07River,
  s08_wind: S08Wind,
  s09_ignite: S09Ignite,
  s10_fire: S10Fire,
  s11_mud: S11Mud,
  s12_close: S12Close,
};

type Shot = {
  index: number;
  id: string;
  card: string;
  text: string;
  caption: string;
  caption_tone: 'ink' | 'paper';
  content?: ShotContent;
  from: number;
  frames: number;
  /** 底图池里的 key（可选）。缺省则该镜只有纸底。 */
  bg?: string;
  /** 本镜机位（可选）。缺省按镜号自动交替。 */
  cam?: {pan?: number; push?: [number, number]; opacity?: number};
};

type CaptionCue = {
  index: number;
  text: string;
  tone: 'ink' | 'paper';
  from: number;
  frames: number;
};

type Meta = {
  caption_size?: number;
  caption_offset?: number;
  /** 底图池：key → 文件与叠加强度 */
  backgrounds?: Record<string, {src: string; opacity?: number}>;
  /** 纸面装饰层（版框 / 边栏影字 / 纪年 / 角章） */
  ornament?: OrnamentCfg;
  /** 老电影动效层 */
  oldfilm?: boolean | OldFilmCfg;
  /** 人群类底图（人多、细节杂）自动再压一档，避免抢字 */
  crowded?: string[];
};

/** 没有显式机位时，按镜号交替：横移方向逐镜反、推拉三镜一换，
 *  切镜时能看出「镜头在动」，不会像同一张图放三遍。 */
const autoCam = (i: number, crowded: boolean) => ({
  pan: (i % 2 === 0 ? 1 : -1) * (22 + ((i * 7) % 16)),
  push: (i % 3 === 0 ? [1.1, 1.04] : [1.04, 1.11]) as [number, number],
  opacity: crowded ? 0.44 : 0.55,
});

export const Film: React.FC<{theme?: string; accentLock?: boolean}> = ({
  theme,
  accentLock,
}) => {
  const shots = shotsData.shots as unknown as Shot[];
  const meta = (shotsData.meta ?? {}) as Meta;
  const captionSize = meta.caption_size;
  const captionOffset = meta.caption_offset;
  const captions = (shotsData as {captions?: CaptionCue[]}).captions ?? [];
  const pool = meta.backgrounds ?? {};
  const crowded = new Set(meta.crowded ?? []);
  const oldfilm: OldFilmCfg | null = meta.oldfilm
    ? meta.oldfilm === true
      ? {}
      : (meta.oldfilm as OldFilmCfg)
    : null;

  return (
    <LookProvider theme={theme} accentLock={accentLock}>
      <FontGate>
        <AbsoluteFill style={{backgroundColor: PAPER}}>
          <AbsoluteFill>
            {shots.map((shot) => {
              const Scene = REGISTRY[shot.id];
              if (!Scene) {
                throw new Error(`未注册场景：${shot.id}`);
              }
              const bgEntry = shot.bg ? pool[shot.bg] : undefined;
              const cam = shot.cam ?? autoCam(shot.index, crowded.has(shot.bg ?? ''));
              const cfg: BgCfg | null = bgEntry
                ? {
                    src: bgEntry.src,
                    frames: shot.frames,
                    pan: cam.pan ?? 0,
                    push: cam.push ?? [1.04, 1.11],
                    opacity: cam.opacity ?? bgEntry.opacity,
                  }
                : null;

              const scene = <Scene content={shot.content} />;
              const wrapped = cfg ? <BgProvider cfg={cfg}>{scene}</BgProvider> : scene;

              return (
                <Sequence
                  key={shot.index}
                  from={shot.from}
                  durationInFrames={shot.frames}
                  name={`${String(shot.index).padStart(2, '0')} ${shot.id}`}
                >
                  {wrapped}
                  {meta.ornament ? <Ornament shot={{id: shot.id}} cfg={meta.ornament} /> : null}
                  {shot.caption ? (
                    <Caption text={shot.caption} tone={shot.caption_tone} size={captionSize} offset={captionOffset} />
                  ) : null}
                </Sequence>
              );
            })}
          </AbsoluteFill>
          {/* 字幕衬底常驻：不能画进 Caption 内部，否则字幕之间的空隙会让底部亮度跳变 */}
          <CaptionVeil />
          {captions.length > 0 ? (
            <AbsoluteFill>
              {captions.map((c) => (
                <Sequence
                  key={c.index}
                  from={c.from}
                  durationInFrames={c.frames}
                  name={`字幕 ${String(c.index).padStart(2, '0')}`}
                >
                  <Caption text={c.text} tone={c.tone} size={captionSize} offset={captionOffset} />
                </Sequence>
              ))}
            </AbsoluteFill>
          ) : null}
          {oldfilm ? <OldFilm {...oldfilm} /> : null}
          <Audio src={staticFile('audio/narration.mp3')} />
        </AbsoluteFill>
      </FontGate>
    </LookProvider>
  );
};
