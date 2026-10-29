import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INK, KAI, cin, ink, solid} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, polyAt, prng, ramp} from '../lib/anim';

const PATH: [number, number][] = [
  [120, 1060],
  [410, 944],
  [318, 812],
  [566, 706],
  [812, 768],
  [1010, 626],
  [1246, 540],
  [1394, 384],
  [1636, 214],
  [1806, 40],
];

/** 折线 → 二次贝塞尔平滑路径（中点法），避免硬折角 */
const smoothPath = (pts: [number, number][]) => {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    d += ` Q ${x1} ${y1} ${(x1 + x2) / 2} ${(y1 + y2) / 2}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
};

const Rider: React.FC<{x: number; y: number; op: number; flip: boolean}> = ({x, y, op, flip}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 20,
      top: y - 20,
      width: 48,
      height: 40,
      opacity: op,
      transform: `scaleX(${flip ? -1 : 1})`,
    }}
  >
    <svg width={48} height={40} viewBox="0 0 48 40">
      {/* 马身 */}
      <path d="M 6 22 L 34 20 L 40 26 L 34 30 L 8 31 Z" fill={solid(0.92)} />
      {/* 腿 */}
      <path d="M 12 30 L 9 39 M 20 31 L 19 39 M 29 30 L 31 39" stroke={solid(0.92)} strokeWidth={2.6} strokeLinecap="round" />
      {/* 马头 */}
      <path d="M 36 20 L 44 12 L 46 18 L 40 26 Z" fill={solid(0.92)} />
      {/* 骑者 */}
      <circle cx={22} cy={8} r={4.6} fill={solid(0.92)} />
      <path d="M 22 13 L 22 22" stroke={solid(0.92)} strokeWidth={5} strokeLinecap="round" />
    </svg>
  </div>
);

/** 11 · 从华容道回北方 / 俯拍横移（top-down-pan） */
export const S11Mud: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const draw = easeOutCubic(ramp(f, 2, 38));
  const pan = easeInOutCubic(clamp(f / 79));
  const rnd = prng(3311);

  const d = smoothPath(PATH);
  const riders = [0.06, 0.2, 0.36, 0.54, 0.72];

  return (
    <AbsoluteFill style={{transform: `translateY(${-30 * pan}px)`}}>
      {/* 泥点 */}
      {Array.from({length: 90}).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: rnd() * 1920,
            top: 60 + rnd() * 1040,
            width: 2 + rnd() * 5,
            height: 2 + rnd() * 5,
            borderRadius: '50%',
            background: solid(0.08 + rnd() * 0.14),
          }}
        />
      ))}

      {/* 冬雨 */}
      {Array.from({length: 46}).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (rnd() * 2000) % 1920,
            top: (rnd() * 1200 + f * 26) % 1120,
            width: 1.4,
            height: 26 + rnd() * 22,
            background: ink(0.10),
            transform: 'rotate(14deg)',
          }}
        />
      ))}

      {/* 路边荒丛 */}
      {Array.from({length: 14}).map((_, i) => {
        const bx = 90 + rnd() * 1740;
        const by = 150 + rnd() * 880;
        const rw = 16 + rnd() * 26;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: bx,
              top: by,
              width: rw,
              height: rw * 0.8,
              borderRadius: '50% 50% 40% 40%',
              background: solid(0.07 + rnd() * 0.06),
            }}
          />
        );
      })}

      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <path d={d} stroke={ink(0.13)} strokeWidth={46} fill="none" strokeLinecap="round" />
        <path
          d={d}
          stroke={ink(0.74)}
          strokeWidth={26}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={2100}
          strokeDashoffset={2100 * (1 - draw)}
        />
        <path
          d={d}
          stroke={ink(0.20)}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={2100}
          strokeDashoffset={2100 * (1 - draw)}
        />
      </svg>

      {riders.map((t0, i) => {
        const t = clamp(t0 + f * 0.0018);
        const [x, y] = polyAt(PATH, t);
        const vis = clamp((draw - t0) * 6);
        return <Rider key={i} x={x} y={y} op={vis} flip={i % 2 === 1} />;
      })}

      <div
        style={{
          position: 'absolute',
          left: 232,
          top: 156,
          fontFamily: KAI,
          fontSize: 58,
          letterSpacing: '0.34em',
          color: INK,
          opacity: easeOutCubic(ramp(f, 0, 18)),
        }}
      >
        {c(content, 'place', '华容道')}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 234,
          top: 242,
          fontFamily: KAI,
          fontSize: 26,
          letterSpacing: '0.3em',
          color: ink(0.46),
          opacity: easeOutCubic(ramp(f, 14, 20)),
        }}
      >
        {c(content, 'sub', '泥 泞 三 十 里')}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 232,
          top: 306,
          width: 96 * easeOutCubic(ramp(f, 20, 20)),
          height: 2,
          background: cin(0.4),
        }}
      />
    </AbsoluteFill>
  );
};
