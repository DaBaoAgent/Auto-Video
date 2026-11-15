import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Paper, Seal, ink, solid, KAI, SERIF} from '../look';
import {c} from '../content';
import {easeOutCubic, easeOutQuint, ramp} from '../lib/anim';

/**
 * 收尾签名卡：人牵狗剪影慢慢走过 + 名字 + 拜了个拜。
 * content: name / label
 */
export const SignCard: React.FC<{content?: {[k: string]: string}}> = ({content}) => {
  const f = useCurrentFrame();
  const walk = easeOutCubic(ramp(f, 2, 10));
  const x = 480 + f * 7.5;
  const nameP = easeOutQuint(ramp(f, 12, 10));
  const byeP = easeOutQuint(ramp(f, 30, 10));
  const swing = Math.sin(f * 0.28) * 8;

  return (
    <AbsoluteFill>
      <Paper />
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {/* 地平线 */}
        <line x1={160} y1={780} x2={1760} y2={780} stroke={ink(0.35)} strokeWidth={2} opacity={walk} />
        {/* 夕阳（淡金圆） */}
        <circle cx={1480} cy={420} r={110} fill={solid(0.14)} opacity={walk} />
        <circle cx={1480} cy={420} r={110} fill="none" stroke={solid(0.2)} strokeWidth={1.6} opacity={walk} />

        {/* 牵狗人：迈步摆腿 */}
        <g transform={`translate(${x} 780)`} opacity={walk}>
          <circle cx={0} cy={-148} r={15} fill={solid(0.72)} />
          <path d="M 0 -132 L 0 -60" stroke={solid(0.72)} strokeWidth={13} strokeLinecap="round" />
          <path d={`M 0 -60 L ${-18 + swing} 0`} stroke={solid(0.72)} strokeWidth={10} strokeLinecap="round" />
          <path d={`M 0 -60 L ${18 - swing} 0`} stroke={solid(0.72)} strokeWidth={10} strokeLinecap="round" />
          <path d="M 0 -120 L 30 -96" stroke={solid(0.72)} strokeWidth={8} strokeLinecap="round" />
          {/* 缰绳 */}
          <path d={`M 30 -96 Q 62 -50 92 ${-34 + swing * 0.4}`} fill="none" stroke={ink(0.4)} strokeWidth={2.4} />
          {/* 狗 */}
          <g transform={`translate(92 ${-34 + swing * 0.4})`}>
            <ellipse cx={0} cy={0} rx={26} ry={12} fill={solid(0.66)} />
            <circle cx={24} cy={-10} r={9} fill={solid(0.66)} />
            <path d="M 24 -17 l 5 -9 l 5 9 Z" fill={solid(0.66)} />
            <path d={`M -18 8 L ${-20 + swing * 0.5} 22`} stroke={solid(0.66)} strokeWidth={4} strokeLinecap="round" />
            <path d={`M 14 8 L ${16 - swing * 0.5} 22`} stroke={solid(0.66)} strokeWidth={4} strokeLinecap="round" />
            <path d="M 34 -6 q 8 4 0 12" fill="none" stroke={solid(0.66)} strokeWidth={3} />
          </g>
        </g>
      </svg>

      {/* 名字 + 告别 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center',
        fontFamily: SERIF, fontWeight: 700, fontSize: 84, letterSpacing: '0.16em',
        color: ink(0.85), opacity: nameP,
      }}>
        我是{c(content, 'name', '艾伦')}
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 370, textAlign: 'center',
        fontFamily: KAI, fontSize: 40, letterSpacing: '0.44em', color: ink(0.55),
        opacity: byeP,
      }}>
        {c(content, 'label', '遛狗去了 · 拜了个拜')}
      </div>
      <Seal text="下回" size={96} local={f} delay={36} rotate={-7} style={{right: 400, top: 200}} />
    </AbsoluteFill>
  );
};
