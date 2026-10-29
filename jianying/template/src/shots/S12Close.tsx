import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CINNABAR, GOLD, INK, InkChars, KAI, Seal, ink} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, ramp} from '../lib/anim';

/** 12 · 那一年，我输掉的不只是一场仗 / 印章落定（seal-slam-outro） */
export const S12Close: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const zoom = 1.03 - 0.03 * easeInOutCubic(clamp(f / 78));
  const ruleW = easeOutCubic(ramp(f, 34, 26));

  return (
    <AbsoluteFill style={{transform: `scale(${zoom})`}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 330,
          textAlign: 'center',
          fontFamily: KAI,
          fontSize: 42,
          letterSpacing: '0.5em',
          color: CINNABAR,
          opacity: easeOutCubic(ramp(f, 0, 18)),
        }}
      >
        {c(content, 'kicker', '那一年')}
      </div>

      <InkChars
        text={c(content, 'line', '我输掉的不只是一场仗')}
        size={96}
        weight={600}
        color={INK}
        tracking={0.1}
        stagger={3}
        delay={10}
        dur={18}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 462,
          justifyContent: 'center',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 960 - 220 * ruleW,
          top: 632,
          width: 440 * ruleW,
          height: 2,
          background: GOLD,
          opacity: 0.75,
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 740,
          top: 664,
          textAlign: 'left',
          fontFamily: KAI,
          fontSize: 26,
          letterSpacing: '0.44em',
          color: ink(0.42),
          opacity: easeOutCubic(ramp(f, 40, 20)),
        }}
      >
        {c(content, 'date', '建安十三年 · 冬')}
      </div>

      <Seal text={c(content, 'seal', '曹操')} local={f} delay={52} size={104} rotate={-6} style={{left: 1112, top: 690}} />
    </AbsoluteFill>
  );
};
