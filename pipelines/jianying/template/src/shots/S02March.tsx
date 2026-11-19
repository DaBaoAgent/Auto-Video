import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {INK, InkChars, KAI, cin, gold, ink} from '../look';
import {ShotContent, c} from '../content';
import {clamp, easeInOutCubic, easeOutCubic, ramp} from '../lib/anim';

const CITIES: {x: number; y: number; name: string}[] = [
  {x: 470, y: 618, name: '新野'},
  {x: 830, y: 612, name: '襄阳'},
  {x: 1150, y: 626, name: '江陵'},
  {x: 1440, y: 616, name: '夏口'},
];

/** 2 · 二十万人南下 / 舆图推进（camera-push-in） */
export const S02March: React.FC<{content?: ShotContent}> = ({content}) => {
  const f = useCurrentFrame();
  const prog = easeInOutCubic(ramp(f, 4, 48));
  const gridOp = easeOutCubic(ramp(f, 0, 22));
  const label = easeOutCubic(ramp(f, 26, 20));

  const rows = [300, 372, 444, 516, 588, 660, 732, 804];
  const arrowX = 190 + prog * 1330;

  return (
    <AbsoluteFill>
      {/* 舆图经纬 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-26 * prog}px)`,
          opacity: gridOp,
        }}
      >
        {rows.map((y, i) => (
          <div
            key={y}
            style={{
              position: 'absolute',
              left: 150,
              right: 150,
              top: y,
              height: 1,
              background: ink(i % 2 ? 0.10 : 0.16),
            }}
          />
        ))}
        {[320, 640, 960, 1280, 1600].map((x) => (
          <div
            key={x}
            style={{
              position: 'absolute',
              left: x,
              top: 280,
              bottom: 240,
              width: 1,
              background: ink(0.07),
            }}
          />
        ))}
      </div>

      {/* 偏师两道（细） */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-44 * prog}px)`,
          opacity: gridOp,
        }}
      >
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <path
            d="M 200 752 C 700 752, 900 716, 1530 700"
            stroke={cin(0.22)}
            strokeWidth={4}
            fill="none"
            strokeDasharray="14 12"
          />
          <path
            d="M 210 452 C 700 452, 980 486, 1560 500"
            stroke={ink(0.11)}
            strokeWidth={3}
            fill="none"
            strokeDasharray="10 14"
          />
        </svg>
      </div>

      {/* 主力箭头 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-58 * prog}px)`,
        }}
      >
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <defs>
            <clipPath id="s02clip">
              <rect x={0} y={0} width={arrowX} height={1080} />
            </clipPath>
          </defs>
          <g clipPath="url(#s02clip)">
            <polygon
              points="186,548 1406,548 1406,516 1598,560 1406,604 1406,572 186,572"
              fill={cin(0.80)}
            />
            {Array.from({length: 9}).map((_, i) => (
              <circle key={i} cx={230 + i * 128} cy={560} r={4.5} fill={gold(0.6)} />
            ))}
          </g>
        </svg>
      </div>

      {/* 城标 */}
      {CITIES.map((c) => {
        const t = clamp((arrowX - 160 - c.x) / 130);
        if (t <= 0) {
          return null;
        }
        return (
          <div key={c.name} style={{position: 'absolute', left: c.x, top: c.y}}>
            <div
              style={{
                position: 'absolute',
                left: -14 * t,
                top: -14 * t,
                width: 28 * t,
                height: 28 * t,
                border: `2px solid ${ink(0.55)}`,
                borderRadius: '50%',
                background: 'rgba(239,230,210,0.75)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 26,
                top: 6,
                fontFamily: KAI,
                fontSize: 27,
                letterSpacing: '0.16em',
                color: ink(0.62),
                opacity: t,
                whiteSpace: 'nowrap',
              }}
            >
              {c.name}
            </div>
          </div>
        );
      })}

      <InkChars
        text={c(content, 'line', '二十万人南下')}
        size={78}
        weight={600}
        color={INK}
        stagger={5}
        delay={2}
        dur={20}
        style={{position: 'absolute', left: 168, top: 170}}
      />

      <div
        style={{
          position: 'absolute',
          right: 168,
          top: 186,
          fontFamily: KAI,
          fontSize: 30,
          letterSpacing: '0.32em',
          color: ink(0.55),
          opacity: label,
        }}
      >
        {c(content, 'date', '建安十三年 · 秋')}
      </div>
    </AbsoluteFill>
  );
};
