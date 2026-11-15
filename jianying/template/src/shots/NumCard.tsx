import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Paper, Seal, cin, ink, gold, KAI, SERIF} from '../look';
import {c} from '../content';
import {easeOutCubic, easeOutQuint, ramp} from '../lib/anim';
import {InkChars} from '../look';

/**
 * 通用大字卡：巨字砸入（逐字）+ 小注 + 可选印。
 * content: big / note / seal
 */
export const NumCard: React.FC<{content?: {[k: string]: string}}> = ({content}) => {
  const f = useCurrentFrame();
  const t = easeOutQuint(ramp(f, 0, 12));
  const ripple = ramp(f, 9, 13);
  const noteP = easeOutCubic(ramp(f, 12, 10));

  return (
    <AbsoluteFill>
      <Paper />

      {/* 落定墨晕 */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 430,
          top: 470 - 110,
          width: 860,
          height: 220,
          opacity: t,
          background: `radial-gradient(ellipse at center, ${ink(0.09)} 0%, ${ink(0)} 70%)`,
        }}
      />

      {/* 巨字（逐字落） */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 470 - 100,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <InkChars
          text={c(content, 'big', '')}
          size={168}
          weight={700}
          font={SERIF}
          color={ink(0.9)}
          stagger={3}
          dur={11}
        />
      </div>

      {/* 落定涟漪 */}
      {ripple > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <circle
            cx={960}
            cy={470}
            r={30 + ripple * 250}
            fill="none"
            stroke={ink(0.3 * (1 - ripple))}
            strokeWidth={4 * (1 - ripple) + 1}
          />
        </svg>
      ) : null}

      {/* 小注 */}
      {c(content, 'note', '') ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 660,
            textAlign: 'center',
            fontFamily: KAI,
            fontSize: 34,
            letterSpacing: '0.42em',
            color: ink(0.5),
            opacity: noteP,
            transform: `translateY(${(1 - noteP) * 12}px)`,
          }}
        >
          {c(content, 'note', '')}
        </div>
      ) : null}

      {/* 旧金角线 */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: noteP}}>
        <path d="M 150 190 L 150 150 L 190 150" fill="none" stroke={gold(0.36)} strokeWidth={1.6} />
        <path d="M 1770 890 L 1770 930 L 1730 930" fill="none" stroke={gold(0.36)} strokeWidth={1.6} />
      </svg>

      {/* 印 */}
      {c(content, 'seal', '') ? (
        <Seal
          text={c(content, 'seal', '')}
          size={112}
          local={f}
          delay={16}
          rotate={-6}
          style={{right: 320, bottom: 170}}
        />
      ) : null}
    </AbsoluteFill>
  );
};
