import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INK, InkChars, KAI, ink, solid} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, ramp} from '../lib/anim';

/** 7 · 天下只剩一条江 / 一线展开（line-draw-sweep） */
export const S07River: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const draw = easeInOutCubic(ramp(f, 2, 28));
  const half = 960 * draw;
  const water = easeOutCubic(ramp(f, 22, 30));

  return (
    <AbsoluteFill>
      <InkChars
        text={c(content, 'line', '天下只剩一条江')}
        size={86}
        weight={600}
        color={INK}
        tracking={0.16}
        stagger={4}
        delay={4}
        dur={20}
        style={{position: 'absolute', left: 0, right: 0, top: 330, justifyContent: 'center'}}
      />

      {/* 江面 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 762,
          height: 320,
          background: `linear-gradient(180deg, ${ink(0.07)} 0%, ${ink(0.02)} 60%, ${ink(0)} 100%)`,
          opacity: water,
        }}
      />
      {/* 水纹：细波线，随流缓移 */}
      {Array.from({length: 9}).map((_, i) => {
        const y = 790 + (i % 5) * 34 + Math.floor(i / 5) * 18;
        const x = ((i * 431 + f * (1.6 + (i % 3) * 0.5)) % 1900) - 160;
        const len = 150 + (i % 4) * 54;
        return (
          <svg
            key={i}
            width={len}
            height={12}
            style={{position: 'absolute', left: x, top: y, opacity: water * 0.9}}
          >
            <path
              d={`M 0 8 C ${len * 0.3} 2, ${len * 0.62} 12, ${len} 6`}
              stroke={ink(0.13)}
              strokeWidth={1.5}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );
      })}

      {/* 主水线 */}
      <div style={{position: 'absolute', top: 758, left: 960 - half, width: half, height: 3.5, background: ink(0.86)}} />
      <div style={{position: 'absolute', top: 758, left: 960, width: half, height: 3.5, background: ink(0.86)}} />
      <div
        style={{
          position: 'absolute',
          top: 762,
          left: 960 - 960 * draw * 0.66,
          width: 1920 * draw * 0.66,
          height: 1.4,
          background: ink(0.24),
        }}
      />

      {/* 一叶小舟，给尺度 */}
      <div
        style={{
          position: 'absolute',
          left: 430 + f * 2.2,
          top: 726,
          width: 64,
          height: 30,
          opacity: water,
        }}
      >
        <svg width={64} height={30} viewBox="0 0 64 30">
          <path d="M 2 22 L 62 22 L 52 30 L 12 30 Z" fill={solid(0.72)} />
          <path d="M 32 22 L 32 4 L 52 22 Z" fill={solid(0.55)} />
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 120,
          top: 150,
          fontFamily: KAI,
          fontSize: 26,
          letterSpacing: '0.34em',
          color: ink(0.34),
          writingMode: 'vertical-rl',
          opacity: easeOutCubic(ramp(f, 34, 24)),
        }}
      >
        {c(content, 'place', '长江 · 赤壁')}
      </div>
    </AbsoluteFill>
  );
};
