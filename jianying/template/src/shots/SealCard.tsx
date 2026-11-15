import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Paper, Seal, ink, gold, KAI, SERIF} from '../look';
import {c} from '../content';
import {easeOutCubic, easeOutQuint, ramp} from '../lib/anim';

/**
 * 名字/称号卡：竖排大字名 + 朱砂方印砸落 + 小注。
 * content: name / note / seal
 */
export const SealCard: React.FC<{content?: {[k: string]: string}}> = ({content}) => {
  const f = useCurrentFrame();
  const chars = [...c(content, 'name', '名')];
  const ring = easeOutCubic(ramp(f, 2, 12));
  const noteP = easeOutCubic(ramp(f, 14, 10));
  const isBig = chars.length <= 2;

  return (
    <AbsoluteFill>
      <Paper />

      {/* 旧金定位圈 */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: ring * 0.8}}>
        <circle cx={960} cy={470} r={300} fill="none" stroke={gold(0.26)} strokeWidth={1.4} />
        <circle cx={960} cy={470} r={262} fill="none" stroke={gold(0.12)} strokeWidth={1} />
      </svg>

      {/* 竖排名（逐字落） */}
      <div
        style={{
          position: 'absolute',
          left: 960 - (isBig ? 150 : 110),
          top: 470 - (chars.length * (isBig ? 240 : 130)) / 2 - 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {chars.map((ch, i) => {
          const p = easeOutQuint(ramp(f, i * 4, 10));
          return (
            <span
              key={i}
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: isBig ? 220 : 120,
                lineHeight: isBig ? 1.08 : 1.18,
                color: ink(0.9),
                opacity: p,
                filter: `blur(${(1 - p) * 9}px)`,
                transform: `translateY(${(1 - p) * 26}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      {/* 朱砂方印 */}
      <Seal
        text={c(content, 'seal', '名')}
        size={128}
        local={f}
        delay={chars.length * 4 + 6}
        rotate={-6}
        style={{left: 1080, top: 300}}
      />

      {c(content, 'note', '') ? (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center',
          fontFamily: KAI, fontSize: 36, letterSpacing: '0.42em', color: ink(0.62),
          opacity: noteP,
          // 纸色柔光描边：底图有人物时也能读清，纯纸底上看不出来
          textShadow: '0 0 22px rgba(243,236,220,0.95), 0 0 10px rgba(243,236,220,0.9), 0 0 4px rgba(243,236,220,0.8)',
        }}>
          {c(content, 'note', '')}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
