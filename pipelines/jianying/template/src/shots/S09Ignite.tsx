import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useIsDark, CINNABAR, PAPER, KAI, cin} from '../look';
import {clamp, easeInOutCubic, easeOutCubic, easeOutQuint, mix, prng, ramp} from '../lib/anim';

/** 9 · 他们只放了一把火 / 一点引爆（dot-ignition） */
export const S09Ignite: React.FC = () => {
  const f = useCurrentFrame();
  const dark = useIsDark();
  const dotIn = easeOutQuint(ramp(f, 10, 8));
  const pulse = 1 + 0.22 * Math.sin(f * 0.55) * (1 - ramp(f, 30, 10));
  const rise = easeOutCubic(ramp(f, 40, 30));
  const rnd = prng(7717);

  return (
    <AbsoluteFill>
      {/* 一点朱砂 */}
      <div
        style={{
          position: 'absolute',
          left: 700 - 10,
          top: 588 - 10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: CINNABAR,
          transform: `scale(${dotIn * pulse})`,
          opacity: 1 - ramp(f, 34, 10) * 0.2,
          boxShadow: `0 0 ${18 + 12 * Math.sin(f * 0.6)}px ${cin(0.45)}`,
        }}
      />

      {/* 冲击环 */}
      {[0, 7, 14].map((delay, i) => {
        const t = clamp((f - 34 - delay) / 26);
        if (t <= 0) return null;
        const r = mix(8, 820, easeOutCubic(t));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 700 - r,
              top: 598 - r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: '50%',
              border: `${2.5 - i * 0.5}px solid ${cin(0.5 * (1 - t))}`,
            }}
          />
        );
      })}

      {/* 江面被染红 */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${cin(0)} 6%, ${cin(0.62)} 46%, ${cin(0.92)} 100%)`,
          transform: `translateY(${(1 - rise) * 34}%)`,
          opacity: rise,
          mixBlendMode: dark ? 'screen' : 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(80% 60% at 50% 104%, ${cin(0.55)} 0%, transparent 62%)`,
          opacity: rise,
          mixBlendMode: dark ? 'screen' : 'multiply',
        }}
      />

      {/* 余烬 */}
      {Array.from({length: 18}).map((_, i) => {
        const x = 200 + rnd() * 1560;
        const sp = 0.5 + rnd() * 1.2;
        const y = 940 - ((f * 2.2 * sp + rnd() * 300) % 780);
        const op = clamp((f - 36) / 20) * (0.3 + rnd() * 0.4);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 3 + rnd() * 3,
              height: 3 + rnd() * 3,
              borderRadius: '50%',
              background: cin(0.9),
              opacity: op,
              mixBlendMode: dark ? 'screen' : 'multiply',
            }}
          />
        );
      })}

      <div
        style={{
          position: 'absolute',
          right: 196,
          top: 646,
          fontFamily: KAI,
          fontSize: 78,
          lineHeight: 1.24,
          color: PAPER,
          writingMode: 'vertical-rl',
          letterSpacing: '0.16em',
          opacity: easeOutCubic(ramp(f, 52, 18)),
          textShadow: '0 3px 22px rgba(50,12,8,0.7)',
        }}
      >
        江面红了
      </div>
    </AbsoluteFill>
  );
};
