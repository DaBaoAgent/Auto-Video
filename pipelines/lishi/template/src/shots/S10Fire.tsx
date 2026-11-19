import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PAPER, KAI} from '../look';
import {clamp, easeOutCubic, prng, ramp} from '../lib/anim';

/**
 * 10 · 火从船头烧到船尾 / 冲击抖动（impact-shake）
 *
 * 焰形用「收尖的贝塞尔焰舌」而不是椭圆：椭圆经湍流位移后只会变成圆拱，
 * 怎么调都不像火。焰舌自带宽底、细腰、摆动尖端，位移只负责把边缘撕碎。
 */
const tongue = (cx: number, baseY: number, w: number, h: number, ph: number, f: number) => {
  const sway = Math.sin(f * 0.21 + ph) * w * 0.24;
  const tipX = cx + sway;
  const tipY = baseY - h;
  return [
    `M ${cx - w / 2} ${baseY}`,
    `C ${cx - w * 0.66} ${baseY - h * 0.34}, ${cx - w * 0.34} ${baseY - h * 0.62}, ${tipX - w * 0.06} ${tipY}`,
    `C ${cx + w * 0.30} ${baseY - h * 0.66}, ${cx + w * 0.60} ${baseY - h * 0.32}, ${cx + w / 2} ${baseY}`,
    'Z',
  ].join(' ');
};

const BACK = [
  {cx: 150, w: 250, h: 430, ph: 0.4},
  {cx: 430, w: 300, h: 560, ph: 1.9},
  {cx: 700, w: 260, h: 380, ph: 3.1},
  {cx: 985, w: 320, h: 610, ph: 0.9},
  {cx: 1265, w: 270, h: 420, ph: 2.4},
  {cx: 1545, w: 310, h: 560, ph: 4.0},
  {cx: 1810, w: 250, h: 450, ph: 1.2},
];

const FRONT = [
  {cx: 90, w: 170, h: 300, ph: 2.6},
  {cx: 285, w: 200, h: 400, ph: 0.7},
  {cx: 505, w: 180, h: 330, ph: 3.6},
  {cx: 660, w: 210, h: 450, ph: 1.5},
  {cx: 845, w: 175, h: 360, ph: 4.4},
  {cx: 1010, w: 215, h: 470, ph: 2.1},
  {cx: 1185, w: 180, h: 350, ph: 5.0},
  {cx: 1360, w: 205, h: 440, ph: 0.2},
  {cx: 1550, w: 185, h: 380, ph: 2.9},
  {cx: 1720, w: 210, h: 460, ph: 1.7},
  {cx: 1880, w: 175, h: 340, ph: 3.9},
];

export const S10Fire: React.FC = () => {
  const f = useCurrentFrame();
  const rnd = prng(9001 + f * 37);
  const amp = 9 * (1 - clamp(f / 52) * 0.6);
  const dx = (rnd() - 0.5) * 2 * amp;
  const dy = (rnd() - 0.5) * 2 * amp;
  const flash = 1 - clamp(f / 5);
  const textIn = easeOutCubic(ramp(f, 22, 18));
  const boil = 0.0055 + 0.0022 * Math.sin(f * 0.17);
  const baseY = 1010;

  return (
    <AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) scale(1.07)`}}>
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <defs>
          <filter id="flameWarp" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`0.006 ${boil}`}
              numOctaves={3}
              seed={13}
              result="t"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="t"
              scale={44}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <linearGradient id="flameBack" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#ffa94e" />
            <stop offset="36%" stopColor="#ef5a1c" />
            <stop offset="74%" stopColor="#cf3a11" />
            <stop offset="100%" stopColor="#a32a0c" />
          </linearGradient>
          <linearGradient id="flameFront" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fff2d2" />
            <stop offset="24%" stopColor="#ffcf82" />
            <stop offset="58%" stopColor="#fb8636" />
            <stop offset="86%" stopColor="#dc4415" />
            <stop offset="100%" stopColor="#b02c0d" />
          </linearGradient>
          <radialGradient id="sky" cx="50%" cy="88%" r="86%">
            <stop offset="0%" stopColor="#f6b871" />
            <stop offset="26%" stopColor="#e87534" />
            <stop offset="52%" stopColor="#b73a1b" />
            <stop offset="76%" stopColor="#741a0d" />
            <stop offset="100%" stopColor="#2a0805" />
          </radialGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffe3b0" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#ff9a45" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ff7a2a" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x={-120} y={-120} width={2160} height={1320} fill="url(#sky)" />
        <ellipse cx={960} cy={980} rx={1080} ry={420} fill="url(#glow)" />

        {/* 后层火墙：更高更暗，负责天际线的起伏 */}
        <g filter="url(#flameWarp)" opacity={0.9}>
          {/* 先铺一条火焰基底，否则焰舌交叠处会漏出暗天空，看着像黑色尖缝 */}
          <rect x={-120} y={770} width={2160} height={360} fill="#d94a17" />
          {BACK.map((b, i) => (
            <path key={i} d={tongue(b.cx, baseY + 20, b.w, b.h, b.ph, f)} fill="url(#flameBack)" />
          ))}
        </g>

        {/* 前层焰舌：亮、密、交错 */}
        <g filter="url(#flameWarp)">
          {FRONT.map((b, i) => (
            <path key={i} d={tongue(b.cx, baseY + 8, b.w, b.h, b.ph, f)} fill="url(#flameFront)" />
          ))}
        </g>

        {/* 火底炽白 */}
        <ellipse cx={960} cy={1030} rx={1120} ry={150} fill="#ffe7bb" opacity={0.5} />

        {/* 飞散的火星 */}
        {Array.from({length: 26}).map((_, i) => {
          const seed = prng(4400 + i * 97);
          const x0 = seed() * 1920;
          const rise = 220 + seed() * 420;
          const life = ((f * 0.9 + seed() * 90) % 90) / 90;
          const y = 1000 - rise * life + Math.sin(life * 6 + i) * 12;
          const r = 1.6 + seed() * 3.4;
          return (
            <circle
              key={i}
              cx={x0 + Math.sin(life * 5 + i) * 26}
              cy={y}
              r={r}
              fill="#ffd39a"
              opacity={(1 - life) * 0.85}
            />
          );
        })}
      </svg>

      {/* 连锁的船影 */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = 30 + i * 400;
          const y = 930 + (i % 2) * 18;
          const bob = Math.sin(f * 0.2 + i) * 4;
          return (
            <g key={i} transform={`translate(${x} ${y + bob})`}>
              <polygon points="0,44 330,44 302,96 28,96" fill="#150c08" />
              <polygon points="0,44 330,44 328,50 2,50" fill="#ffc074" opacity={0.5} />
              <rect x={158} y={-44} width={6} height={92} fill="#150c08" />
              <polygon points="164,-40 164,44 246,44" fill="#150c08" opacity={0.9} />
            </g>
          );
        })}
      </svg>

      <AbsoluteFill style={{backgroundColor: PAPER, opacity: 0.5 * flash}} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 158,
          textAlign: 'center',
          fontFamily: KAI,
          fontSize: 120,
          letterSpacing: '0.12em',
          color: PAPER,
          opacity: textIn,
          transform: `translateY(${(1 - textIn) * 18}px)`,
          textShadow: '0 6px 34px rgba(40,10,6,0.8)',
        }}
      >
        烧到我脸上
      </div>
    </AbsoluteFill>
  );
};
