import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KAI, cin, gold, ink, solid} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, prng, ramp} from '../lib/anim';

/** 6 · 旌旗铺到江边 / 城墙 + 层叠视差（parallax-layer） */
export const S06Flags: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const pan = easeInOutCubic(clamp(f / 83));
  const label = clamp(f / 20);
  const rnd = prng(5150);

  const near = Array.from({length: 9}).map((_, i) => ({
    x: -40 + i * 226 + (rnd() - 0.5) * 44,
    h: 176 + rnd() * 74,
    w: 52 + rnd() * 22,
    ph: rnd() * 6.28,
  }));
  const far = Array.from({length: 8}).map((_, i) => ({
    x: 60 + i * 244 + (rnd() - 0.5) * 56,
    h: 96 + rnd() * 38,
    w: 30 + rnd() * 12,
    ph: rnd() * 6.28,
  }));

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {/* 远景：一道江岸与远山，给大片空纸一个纵深落点 */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <path
          d="M0 742 C 210 712, 360 748, 560 726 C 760 704, 900 742, 1120 730 C 1340 718, 1560 748, 1920 720 L1920 846 L0 846 Z"
          fill={solid(0.07)}
        />
        <path
          d="M0 786 C 260 766, 470 792, 720 776 C 980 760, 1250 790, 1520 772 C 1700 760, 1830 780, 1920 772 L1920 846 L0 846 Z"
          fill={solid(0.11)}
        />
        <rect x={0} y={820} width={1920} height={26} fill="rgba(239,230,210,0.20)" />
      </svg>

      {/* 城墙 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 846,
          bottom: 0,
          background: `linear-gradient(180deg, ${solid(0.9)} 0%, ${solid(0.97)} 78%)`,
          backgroundImage: [
            `linear-gradient(180deg, ${solid(0.95)} 0%, rgba(20,17,14,0.99) 100%)`,
            'repeating-linear-gradient(0deg, rgba(239,230,210,0.06) 0 1px, transparent 1px 46px)',
            'repeating-linear-gradient(90deg, rgba(239,230,210,0.045) 0 1px, transparent 1px 112px)',
          ].join(','),
        }}
      />
      {Array.from({length: 21}).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -10 + i * 96,
            top: 808,
            width: 58,
            height: 48,
            background: solid(0.9),
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 856,
          height: 1,
          background: 'rgba(239,230,210,0.10)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 920,
          height: 1,
          background: 'rgba(239,230,210,0.07)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 846,
          height: 2,
          background: cin(0.30),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 906,
          height: 1,
          background: 'rgba(239,230,210,0.08)',
        }}
      />

      {/* 远处旌旗（色淡、体量小，只做纵深） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-26 * pan}px)`,
          opacity: 0.8,
        }}
      >
        {far.map((b, i) => {
          const sway = Math.sin(f * 0.12 + b.ph) * 2.2;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.x,
                top: 818 - b.h,
                width: b.w,
                height: b.h,
                transform: `skewX(${sway}deg)`,
                transformOrigin: 'top center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -2,
                  top: -14,
                  width: 3,
                  height: b.h + 22,
                  background: solid(0.7),
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(100deg, ${cin(0.74)} 0%, ${cin(0.54)} 100%)`,
                  clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* 近处旌旗：朱砂旗面 + 墨黑旗杆 + 旧金横杆，靠色相差从墨色城墙里跳出来 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-64 * pan}px)`,
        }}
      >
        {near.map((b, i) => {
          const sway = Math.sin(f * 0.15 + b.ph) * 3.6;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: b.x,
                top: 846 - b.h,
                width: b.w,
                height: b.h,
                transform: `skewX(${sway}deg)`,
                transformOrigin: 'top center',
              }}
            >
              {/* 旗杆 */}
              <div
                style={{
                  position: 'absolute',
                  left: -4,
                  top: -22,
                  width: 5,
                  height: b.h + 40,
                  background: solid(0.96),
                }}
              />
              {/* 杆顶金饰 */}
              <div
                style={{
                  position: 'absolute',
                  left: -8,
                  top: -30,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  background: gold(0.5),
                }}
              />
              {/* 旗面 */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(100deg, ${cin(0.94)} 0%, ${cin(0.78)} 62%, ${cin(0.9)} 100%)`,
                  clipPath: 'polygon(0 0, 100% 0, 100% 86%, 50% 100%, 0 86%)',
                  boxShadow: 'inset 0 0 26px rgba(64,12,6,0.35)',
                }}
              />
              {/* 旗上墨字痕（竖笔，抽象处理） */}
              <div
                style={{
                  position: 'absolute',
                  left: b.w * 0.56,
                  top: 10,
                  width: 3.6,
                  height: b.h * 0.6,
                  background: solid(0.62),
                }}
              />
              {/* 顶部横杆 */}
              <div
                style={{
                  position: 'absolute',
                  left: -6,
                  top: -4,
                  width: b.w + 12,
                  height: 5,
                  background: gold(0.34),
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 124,
          top: 132,
          fontFamily: KAI,
          fontSize: 38,
          letterSpacing: '0.3em',
          color: ink(0.46),
          writingMode: 'vertical-rl',
          opacity: label,
        }}
      >
        {c(content, 'place', '襄阳城头')}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 132,
          top: 168,
          width: 2,
          height: 120 * label,
          background: cin(0.5),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 132,
          top: 302,
          fontFamily: KAI,
          fontSize: 26,
          letterSpacing: '0.36em',
          color: ink(0.5),
          opacity: label,
        }}
      >
        {c(content, 'date', '建安十三年 · 九月')}
      </div>
    </AbsoluteFill>
  );
};
