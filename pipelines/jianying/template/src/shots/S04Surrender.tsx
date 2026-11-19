import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {GOLD, InkChars, KAI, PAPER, Seal, gold, solid} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, ramp} from '../lib/anim';

const brick = {
  backgroundImage: [
    'repeating-linear-gradient(0deg, rgba(239,230,210,0.055) 0 1px, transparent 1px 58px)',
    'repeating-linear-gradient(90deg, rgba(239,230,210,0.045) 0 1px, transparent 1px 96px)',
  ].join(','),
};

/** 4 · 一仗没打就开城投降 / 城门分开（gate-open） */
export const S04Surrender: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const open = easeInOutCubic(ramp(f, 6, 34));
  const d = 286 * open;
  const lightOp = easeOutCubic(ramp(f, 8, 26));

  const nails = () =>
    Array.from({length: 18}).map((_, i) => {
      const r = Math.floor(i / 3);
      const c = i % 3;
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 74 + c * 140,
            top: 86 + r * 132,
            width: 17,
            height: 17,
            borderRadius: '50%',
            background: gold(0.26),
          }}
        />
      );
    });

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* 门洞里的光 */}
      <div
        style={{
          position: 'absolute',
          left: 960 - d - 12,
          top: 120,
          width: 2 * d + 24,
          height: 830,
          background: `linear-gradient(180deg, ${gold(0.7 * lightOp)} 0%, #f8f0da 40%, ${gold(0.55 * lightOp)} 100%)`,
        }}
      />

      {/* 城门楼：上楣 / 左右城墙 / 门槛 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 120,
          background: solid(0.94),
          ...brick,
        }}
      />
      {[0, 1].map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            left: side === 0 ? 0 : 1490,
            width: 430,
            top: 120,
            bottom: 0,
            background: solid(0.93),
            ...brick,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 950,
          bottom: 0,
          // 只写 background:linear-gradient 再 ...brick 会被 backgroundImage 整层替换，
          // 底色直接变透明、背景纸从底下透出来（成片里就是一条硬边灰带），故用 backgroundColor 保底
          backgroundColor: solid(0.96),
          ...brick,
        }}
      />

      {/* 门扇 */}
      {(['l', 'r'] as const).map((side) => (
        <div
          key={side}
          style={{
            position: 'absolute',
            top: 120,
            left: side === 'l' ? 430 - d : 960 + d,
            width: 530,
            height: 830,
            background: `linear-gradient(${side === 'l' ? '90deg' : '270deg'}, rgba(24,21,18,0.98) 0%, ${solid(0.94)} 58%, rgba(20,18,16,0.99) 100%)`,
            boxShadow: `${side === 'l' ? '' : '-'}0 0 46px rgba(20,16,12,0.5)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(239,230,210,0.045) 0 2px, transparent 2px 30px)',
            }}
          />
          {nails()}
          <div
            style={{
              position: 'absolute',
              top: 40,
              bottom: 40,
              [side === 'l' ? 'right' : 'left']: 26,
              width: 8,
              background: gold(0.14),
            }}
          />
        </div>
      ))}

      <InkChars
        vertical
        text={c(content, 'banner', '一仗没打')}
        size={54}
        weight={500}
        font={KAI}
        color={'rgba(239,230,210,0.82)'}
        stagger={5}
        delay={4}
        dur={18}
        style={{position: 'absolute', left: 116, top: 200}}
      />

      <Seal text={c(content, 'seal', '降')} local={f} delay={50} size={104} rotate={-7} style={{left: 908, top: 700}} />

      <div
        style={{
          position: 'absolute',
          left: 152,
          top: 792,
          width: 2,
          height: 86 * easeOutCubic(ramp(f, 20, 22)),
          background: gold(0.5),
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 8,
          background: PAPER,
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 8,
          height: 2,
          background: GOLD,
          opacity: 0.28,
        }}
      />
    </AbsoluteFill>
  );
};
