import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CINNABAR, INK, InkChars, KAI, Seal, cin, ink} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, ramp} from '../lib/anim';

/** 1 · 建安十三年 / 竖排年份字卡（paper-title-card） */
export const S01Year: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const push = 1 + 0.030 * easeInOutCubic(clamp(f / 76));
  const wash = easeOutCubic(ramp(f, 0, 34));
  const ruleH = easeOutCubic(ramp(f, 12, 26));

  return (
    <AbsoluteFill style={{transform: `scale(${push})`}}>
      {/* 远山淡影，压住左下留白 */}
      <svg
        width={1920}
        height={1080}
        style={{position: 'absolute', opacity: 0.5 * wash}}
      >
        <path
          d="M -40 980 C 180 902, 300 946, 470 886 C 640 826, 760 900, 900 862 L 900 1080 L -40 1080 Z"
          fill={ink(0.09)}
        />
        <path
          d="M -40 1030 C 150 990, 280 1022, 430 986 C 560 956, 680 1002, 820 976 L 820 1080 L -40 1080 Z"
          fill={ink(0.13)}
        />
      </svg>

      <InkChars
        vertical
        text={c(content, 'year', '建安十三年')}
        size={156}
        weight={600}
        color={INK}
        stagger={5}
        delay={2}
        dur={20}
        style={{position: 'absolute', right: 206, top: 112}}
      />
      <div
        style={{
          position: 'absolute',
          right: 742,
          top: 336,
          width: 2,
          height: 462 * ruleH,
          background: cin(0.5),
        }}
      />
      <InkChars
        vertical
        text={c(content, 'age', '我五十三岁')}
        size={54}
        weight={500}
        font={KAI}
        color={CINNABAR}
        stagger={4}
        delay={16}
        dur={18}
        style={{position: 'absolute', right: 800, top: 418}}
      />
      <Seal text={c(content, 'seal', '曹操')} local={f} delay={48} size={94} style={{right: 792, top: 800}} />
    </AbsoluteFill>
  );
};
