import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CINNABAR, INK, InkChars, KAI, cin, ink} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, mix, ramp} from '../lib/anim';

/** 3 · 八月，刘表死在襄阳 / 光源熄灭（light-dies） */
export const S03Death: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const die = easeInOutCubic(ramp(f, 22, 30));
  const lit = 1 - die;
  const smoke = easeOutCubic(ramp(f, 42, 22));

  return (
    <AbsoluteFill>
      {/* 将熄的灯下光 */}
      <div
        style={{
          position: 'absolute',
          left: 470,
          top: 180,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: `radial-gradient(50% 50% at 50% 50%, ${cin(0.30 * lit)} 0%, rgba(201,162,74,${0.15 * lit}) 44%, transparent 72%)`,
          transform: `scale(${mix(1, 0.5, die)})`,
          opacity: lit,
        }}
      />
      <AbsoluteFill style={{backgroundColor: `rgba(36,33,28,${0.11 * die})`}} />

      <InkChars
        vertical
        text={c(content, 'person', '刘表')}
        size={208}
        weight={600}
        color={INK}
        stagger={6}
        delay={2}
        dur={22}
        style={{position: 'absolute', left: 812, top: 196}}
      />
      <InkChars
        vertical
        text={c(content, 'mark', '卒')}
        size={82}
        weight={500}
        font={KAI}
        color={CINNABAR}
        delay={26}
        dur={14}
        style={{position: 'absolute', left: 1118, top: 470}}
      />
      <div
        style={{
          position: 'absolute',
          left: 1118,
          top: 596,
          width: 74,
          height: 2,
          background: cin(0.45),
          opacity: easeOutCubic(ramp(f, 34, 16)),
        }}
      />

      {/* 一缕青烟（贴在右侧，不压字） */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.55 * smoke}}>
        <path
          d="M 1268 700 C 1252 618, 1302 566, 1284 500 C 1268 442, 1308 392, 1292 330"
          stroke={ink(0.26)}
          strokeWidth={2.2}
          fill="none"
          strokeDasharray={560}
          strokeDashoffset={560 * (1 - smoke)}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 116,
          textAlign: 'center',
          fontFamily: KAI,
          fontSize: 40,
          letterSpacing: '0.5em',
          color: cin(0.8),
          opacity: easeOutCubic(ramp(f, 0, 16)),
        }}
      >
        {c(content, 'month', '八月')}
      </div>
    </AbsoluteFill>
  );
};
