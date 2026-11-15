import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {prng} from './lib/anim';

/* ------------------------------------------------------------------ *
 * OldFilm —— 老电影动效（叠加在最上层，字幕也一起吃）
 *
 * 【2026-10-26 修订：去掉画面频闪】
 * 原版有四个高频闪烁源，观感是「画面在闪」，不是「胶片有质感」：
 *   1 逐帧亮度抖动（sin(frame*2.1) ≈ 10Hz）—— 删除
 *   2 片门闪白（每 6.5s 一次曝光跳变）—— 删除
 *   3 灰尘每 2 帧全部重抽（15Hz 颗粒闪烁）—— 改为固定粒子 + 连续上浮
 *   4 划痕每 4 帧换位（7.5Hz）—— 改为固定位置 + 极缓漂移
 *
 * 保留下来的都是有质感但不会闪的：
 *   · 暖调偏色（老片偏黄、反差略低）
 *   · 暗角（固定强度，不再呼吸）
 *   · 划痕 3 条（常驻，alpha 恒定，缓慢漂移）
 *   · 灰尘 22 颗（常驻，缓慢上浮，到顶循环）
 * 全部由帧号驱动，确定性渲染。
 * ------------------------------------------------------------------ */

export type OldFilmCfg = {
  /** 总强度（划痕/灰尘/暖调一起吃） */
  intensity?: number;
  /** 划痕条数，默认 3；0 = 不要划痕 */
  scratch?: number;
  /** 灰尘颗数，默认 22；0 = 不要灰尘 */
  dust?: number;
  /** 暖调强度倍数，默认 1；0 = 不加偏色 */
  warm?: number;
  /** 暗角强度，默认 0.40 */
  vignette?: number;
};

export const OldFilm: React.FC<OldFilmCfg> = ({
  intensity = 1,
  scratch = 3,
  dust: dustCount = 22,
  warm = 1,
  vignette = 0.4,
}) => {
  const frame = useCurrentFrame();

  // 划痕：固定 3 条，位置只做极缓漂移（约 0.4px/帧），alpha 恒定
  const scratches = useMemo(() => {
    const r = prng(31337);
    return Array.from({length: Math.max(0, scratch)}, (_, i) => ({
      x: 180 + r() * 1560,
      w: 1 + r() * 1.3,
      a: i === 0 ? 0.26 : 0.12 + r() * 0.08,
      light: i !== 1,
      tilt: (r() - 0.5) * 5,
      drift: (r() - 0.5) * 0.5,
    }));
  }, [scratch]);

  // 灰尘：固定 18 颗，缓慢上浮（6-16 px/s），到顶后循环，不重生
  const dust = useMemo(() => {
    const r = prng(7717);
    return Array.from({length: Math.max(0, dustCount)}, () => ({
      x: r() * 1920,
      y: r() * 1080,
      s: 0.8 + r() * 1.9,
      a: 0.26 + r() * 0.36,
      dark: r() < 0.45,
      vy: 6 + r() * 10,
      vx: (r() - 0.5) * 3,
    }));
  }, [dustCount]);

  const t = frame / 30;
  const vig = vignette;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* 划痕（常驻，只做缓慢漂移） */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: intensity}}>
        {scratches.map((s, i) => {
          const dx = s.drift * t * 8;
          return (
            <line
              key={i}
              x1={s.x + dx}
              y1={-10}
              x2={s.x + dx + s.tilt}
              y2={1090}
              stroke={s.light ? '#fff8e8' : '#2a1c10'}
              strokeWidth={s.w}
              opacity={s.a}
            />
          );
        })}
      </svg>

      {/* 灰尘（常驻，连续上浮到顶后从底部回来） */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: intensity}}>
        {dust.map((d, i) => {
          const y = ((d.y - d.vy * t) % 1080 + 1080) % 1080;
          const x = ((d.x + d.vx * t) % 1920 + 1920) % 1920;
          return (
            <circle key={i} cx={x} cy={y} r={d.s} fill={d.dark ? '#241708' : '#fff6e2'} opacity={d.a} />
          );
        })}
      </svg>

      {/* 暖调：老片偏黄、反差略低 */}
      <AbsoluteFill
        style={{
          backgroundColor: '#8a5f22',
          opacity: 0.085 * intensity * warm,
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          backgroundColor: '#ffe9bd',
          opacity: 0.05 * intensity * warm,
          mixBlendMode: 'soft-light',
        }}
      />
      {/* 暗角（固定强度，不呼吸） */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 74% 66% at 50% 47%, rgba(0,0,0,0) 42%, rgba(26,14,4,${vig.toFixed(3)}) 118%)`,
        }}
      />
    </AbsoluteFill>
  );
};
