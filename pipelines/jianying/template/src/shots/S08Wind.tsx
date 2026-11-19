import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KAI, gold, ink} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, ramp} from '../lib/anim';

const WIND = [
  {y: 214, x: 1600, len: 340, w: 2.4, d: 0, op: 0.26, sp: 10},
  {y: 268, x: 1240, len: 240, w: 1.8, d: 6, op: 0.20, sp: 13},
  {y: 322, x: 1700, len: 380, w: 2.8, d: 12, op: 0.24, sp: 9},
  {y: 380, x: 1120, len: 280, w: 1.8, d: 3, op: 0.18, sp: 14},
  {y: 432, x: 1500, len: 320, w: 2.2, d: 16, op: 0.26, sp: 11},
  {y: 486, x: 1200, len: 210, w: 1.6, d: 9, op: 0.16, sp: 15},
  {y: 540, x: 1640, len: 290, w: 2.0, d: 20, op: 0.22, sp: 12},
  {y: 592, x: 1300, len: 250, w: 1.8, d: 5, op: 0.18, sp: 13},
  {y: 646, x: 1760, len: 220, w: 1.6, d: 24, op: 0.15, sp: 16},
  {y: 700, x: 1080, len: 300, w: 2.0, d: 28, op: 0.20, sp: 11},
  {y: 746, x: 1520, len: 260, w: 1.8, d: 33, op: 0.16, sp: 12},
  {y: 240, x: 900, len: 260, w: 2.0, d: 8, op: 0.20, sp: 11},
  {y: 356, x: 820, len: 300, w: 2.2, d: 18, op: 0.18, sp: 10},
  {y: 560, x: 760, len: 240, w: 1.8, d: 12, op: 0.16, sp: 12},
  {y: 668, x: 980, len: 280, w: 2.0, d: 26, op: 0.18, sp: 9},
  {y: 300, x: 560, len: 220, w: 1.6, d: 21, op: 0.14, sp: 13},
  {y: 610, x: 400, len: 200, w: 1.6, d: 30, op: 0.12, sp: 14},
];

/** 侧身立像：冠 + 头 + 广袖 + 落地衣摆 */
const Figure: React.FC<{x: number; h: number; label: string; appear: number; local: number}> = ({
  x,
  h,
  label,
  appear,
  local,
}) => {
  const p = easeOutCubic(ramp(local, appear, 16));
  const scale = h / 160;
  const w = 100 * scale;

  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: 786 - h - 8,
        width: w,
        opacity: p,
      }}
    >
      <svg width={w} height={h + 10} viewBox="0 0 100 170">
        <ellipse cx={50} cy={166} rx={40} ry={3.4} fill={ink(0.13)} />
        <path d="M 12 116 L 88 116 L 95 163 C 70 168, 30 168, 5 163 Z" fill={ink(0.9)} />
        <path
          d="M 34 30 C 22 42, 12 74, 7 108 L 7 120 L 93 120 L 93 108 C 88 74, 78 42, 66 30 Z"
          fill={ink(0.92)}
        />
        <rect x={42} y={1} width={16} height={7} rx={1.5} fill={ink(0.9)} />
        <circle cx={50} cy={16} r={10} fill={ink(0.9)} />
        <path d="M 50 40 L 50 116" stroke={ink(0.55)} strokeWidth={1.6} />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: -34,
          width: w,
          textAlign: 'center',
          fontFamily: KAI,
          fontSize: 28,
          letterSpacing: '0.2em',
          color: ink(0.6),
          transform: `translateY(${(1 - p) * 8}px)`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

/** 芦苇丛：一丛多叶，从同一根部散开 */
const Reeds: React.FC<{x: number; h: number; sway: number; seed: number}> = ({x, h, sway, seed}) => {
  const blades = 5;
  return (
    <svg width={110} height={h + 20} style={{position: 'absolute', left: x, top: 790 - h}}>
      {Array.from({length: blades}).map((_, i) => {
        const spread = (i - (blades - 1) / 2) * 9;
        const bh = h * (0.66 + ((seed + i * 7) % 10) / 30);
        const tip = 50 + spread + sway * (1 + i * 0.12);
        return (
          <path
            key={i}
            d={`M 54 ${h + 12} C ${56 + spread * 0.4} ${h * 0.55}, ${60 + spread * 0.8} ${bh * 0.4}, ${tip} ${h - bh}`}
            stroke={ink(0.34)}
            strokeWidth={3.2}
            strokeLinecap="round"
            fill="none"
          />
        );
      })}
      <ellipse cx={47 + sway * 1.2} cy={h * 0.1} rx={3.4} ry={9} fill={ink(0.3)} />
    </svg>
  );
};

/** 8 · 江对岸，孙权和周瑜在等风 / 风向线（wind-streak） */
export const S08Wind: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const push = 1 + 0.028 * easeInOutCubic(clamp(f / 81));
  const bank = easeOutCubic(ramp(f, 0, 18));

  return (
    <AbsoluteFill style={{transform: `scale(${push})`}}>
      <Figure x={1214} h={140} label="孙权" appear={12} local={f} />
      <Figure x={1396} h={146} label="周瑜" appear={24} local={f} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 786,
          bottom: 0,
          background: `linear-gradient(180deg, ${ink(0.17)} 0%, ${ink(0.05)} 58%, transparent 100%)`,
          opacity: bank,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 786,
          height: 2.5,
          background: ink(0.46),
          opacity: bank,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 770,
          height: 1,
          background: ink(0.14),
          opacity: bank,
        }}
      />

      {[0, 1, 2, 3].map((i) => (
        <Reeds
          key={i}
          x={62 + i * 58}
          h={120 + (i % 3) * 42}
          sway={Math.sin(f * 0.15 + i * 0.8) * 10}
          seed={i * 3 + 1}
        />
      ))}

      {WIND.map((w, i) => {
        const t = (f * w.sp + i * 130) % 2600;
        const x = w.x - t;
        const op = w.op * easeOutCubic(ramp(f, w.d, 18));
        return (
          <svg
            key={i}
            width={w.len + 40}
            height={40}
            style={{position: 'absolute', left: x, top: w.y, opacity: op}}
          >
            <path
              d={`M 0 20 C ${w.len * 0.3} 6, ${w.len * 0.66} 34, ${w.len} 20`}
              stroke={i % 3 === 0 ? gold(0.95) : ink(0.6)}
              strokeWidth={w.w}
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );
      })}

      <div
        style={{
          position: 'absolute',
          right: 126,
          top: 132,
          fontFamily: KAI,
          fontSize: 34,
          letterSpacing: '0.34em',
          color: ink(0.42),
          writingMode: 'vertical-rl',
          opacity: easeOutCubic(ramp(f, 30, 22)),
        }}
      >
        {c(content, 'label', '东 南 风')}
      </div>
    </AbsoluteFill>
  );
};
