import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useIsDark, CINNABAR, KAI, PAPER, cin, ink} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, ramp} from '../lib/anim';

const COUNTIES = ['南阳', '南郡', '江夏', '长沙', '武陵', '零陵', '桂阳', '章陵'];
const TILE_W = 296;
const TILE_H = 168;
const GAP = 26;
const START_X = (1920 - (TILE_W * 4 + GAP * 3)) / 2;
const START_Y = 384;

/** 5 · 八郡一夜改姓 / 逐格漫染（ink-flood-fill） */
export const S05Counties: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const dark = useIsDark();
  const label = easeOutCubic(ramp(f, 0, 18));
  const ruleW = easeInOutCubic(ramp(f, 46, 26));

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: START_X,
          top: 296,
          fontFamily: KAI,
          fontSize: 36,
          letterSpacing: '0.34em',
          color: ink(0.62),
          opacity: label,
        }}
      >
        {c(content, 'title', '荆州 · 八郡')}
      </div>

      {COUNTIES.map((name, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const x = START_X + col * (TILE_W + GAP);
        const y = START_Y + row * (TILE_H + GAP);
        const t = easeInOutCubic(ramp(f, 6 + i * 4, 18));
        const stamped = t > 0.55;

        return (
          <div
            key={name}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: TILE_W,
              height: TILE_H,
              border: `1px solid ${ink(0.24)}`,
              background: 'rgba(246,239,221,0.38)',
              overflow: 'hidden',
            }}
          >
            {/* 朱砂漫上 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: TILE_H * t,
                background: cin(0.88),
                mixBlendMode: dark ? 'screen' : 'multiply',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 3,
                background: cin(0.9),
                opacity: t > 0.02 ? 1 : 0,
              }}
            />
            {/* 郡名 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: KAI,
                fontSize: 44,
                letterSpacing: '0.14em',
                color: stamped ? PAPER : ink(0.62),
              }}
            >
              {name}
            </div>
            {/* 曹 印 */}
            {stamped ? (
              <div
                style={{
                  position: 'absolute',
                  right: 14,
                  top: 14,
                  width: 40,
                  height: 40,
                  background: CINNABAR,
                  color: PAPER,
                  fontFamily: KAI,
                  fontSize: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 0 2px ${PAPER}`,
                  transform: `rotate(-6deg) scale(${clamp((t - 0.55) * 6)})`,
                }}
              >
                曹
              </div>
            ) : null}
          </div>
        );
      })}

      <div
        style={{
          position: 'absolute',
          left: 960 - (TILE_W * 4 + GAP * 3) * ruleW / 2,
          top: 812,
          width: (TILE_W * 4 + GAP * 3) * ruleW,
          height: 2,
          background: CINNABAR,
          opacity: 0.5,
        }}
      />
    </AbsoluteFill>
  );
};
