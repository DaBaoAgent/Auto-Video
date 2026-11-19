import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Paper, Seal, cin, ink, solid, KAI, SERIF} from '../look';
import {c} from '../content';
import {easeOutCubic, easeOutQuint, ramp} from '../lib/anim';

/**
 * 书卷卡。mode:
 *  quote  纸页卡 + 竖排引文 + 出处印（《后汉书》）
 *  reject 稿纸 + 朱砂「退稿」印砸下
 *  scroll 卷轴横向展开 + 引文
 * content: quote / source / seal
 */
export const BookCard: React.FC<{content?: {[k: string]: string}}> = ({content}) => {
  const f = useCurrentFrame();
  const mode = c(content, 'mode', 'quote');
  const page = easeOutQuint(ramp(f, 0, 14));

  // 纸页
  const pageStyle: React.CSSProperties = {
    position: 'absolute',
    left: 960 - 330,
    top: 540 - 300 * page,
    width: 660,
    height: 600 * page,
    background: `rgb(var(--lk-paper-light-rgb) / 0.9)`,
    boxShadow: `0 6px 30px ${ink(0.18)}, 0 0 0 1px ${ink(0.12)}`,
    opacity: easeOutCubic(ramp(f, 0, 8)),
  };

  if (mode === 'reject') {
    const sealP = easeOutQuint(ramp(f, 34, 8));
    const sealS = 1.9 - 0.9 * sealP;
    const lines = ['你要是写进小说', '编辑都得退稿', '说你离谱'];
    return (
      <AbsoluteFill>
        <Paper />
        <div style={pageStyle}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              margin: '38px 60px 0',
              height: 12,
              background: ink(0.16),
              opacity: easeOutCubic(ramp(f, 10 + i * 5, 8)),
            }} />
          ))}
        </div>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center',
          fontFamily: KAI, fontSize: 40, letterSpacing: '0.4em', color: ink(0.55),
          opacity: easeOutCubic(ramp(f, 8, 10)),
        }}>
          {lines[0]}
        </div>
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 170, textAlign: 'center',
          fontFamily: KAI, fontSize: 34, letterSpacing: '0.36em', color: ink(0.45),
          opacity: easeOutCubic(ramp(f, 20, 10)),
        }}>
          {lines[2]}
        </div>
        {/* 退稿印 */}
        <AbsoluteFill style={{opacity: sealP}}>
          <div style={{
            position: 'absolute', left: 960 - 170, top: 540 - 120,
            transform: `scale(${sealS}) rotate(-12deg)`,
            fontFamily: KAI, fontSize: 130, fontWeight: 700, letterSpacing: '0.1em',
            color: cin(0.94),
            textShadow: `0 0 30px ${cin(0.3)}`,
          }}>
            退稿
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  if (mode === 'scroll') {
    const unroll = easeOutQuint(ramp(f, 4, 18));
    const w = 1000 * unroll;
    return (
      <AbsoluteFill>
        <Paper />
        {/* 卷轴轴杆 ×2 */}
        <div style={{
          position: 'absolute', left: 960 - w / 2 - 16, top: 540 - 190,
          width: 14, height: 380, background: solid(0.7), borderRadius: 6,
        }} />
        <div style={{
          position: 'absolute', left: 960 + w / 2 + 2, top: 540 - 190,
          width: 14, height: 380, background: solid(0.7), borderRadius: 6,
        }} />
        {/* 纸面 */}
        <div style={{
          position: 'absolute', left: 960 - w / 2, top: 540 - 180,
          width: w, height: 360,
          background: `rgb(var(--lk-paper-light-rgb) / 0.92)`,
          boxShadow: `0 4px 22px ${ink(0.16)}`,
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 540 - 130,
          textAlign: 'center',
          fontFamily: KAI, fontSize: 72, letterSpacing: '0.2em',
          color: ink(0.85),
          opacity: easeOutCubic(ramp(f, 20, 12)),
        }}>
          {c(content, 'source', '遗诏')}
        </div>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 540 + 60,
          textAlign: 'center',
          fontFamily: KAI, fontSize: 38, letterSpacing: '0.3em',
          color: ink(0.5),
          opacity: easeOutCubic(ramp(f, 30, 12)),
        }}>
          {c(content, 'quote', '')}
        </div>
      </AbsoluteFill>
    );
  }

  // quote：竖排引文页
  const quote = c(content, 'quote', '');
  const src = c(content, 'source', '');
  return (
    <AbsoluteFill>
      <Paper />
      <div style={pageStyle}>
        {/* 竖排引文 */}
        <div style={{
          position: 'absolute',
          right: 90,
          top: 60,
          writingMode: 'vertical-rl',
          fontFamily: KAI,
          fontSize: 76,
          letterSpacing: '0.24em',
          color: ink(0.85),
          display: 'flex',
          gap: 30,
        }}>
          <InkCharsVertical text={quote} f={f} delay={10} />
        </div>
        {/* 出处小字 */}
        <div style={{
          position: 'absolute', left: 80, bottom: 60,
          fontFamily: KAI, fontSize: 34, letterSpacing: '0.3em',
          color: ink(0.5),
          opacity: easeOutCubic(ramp(f, 30, 10)),
        }}>
          ——{src}
        </div>
      </div>
      <Seal
        text={src.slice(0, 2)}
        size={100}
        local={f}
        delay={36}
        rotate={-7}
        style={{left: 1090, top: 300}}
      />
    </AbsoluteFill>
  );
};

/** 竖排逐字入场（复用 InkChars 的节奏，方向为竖） */
const InkCharsVertical: React.FC<{text: string; f: number; delay: number}> = ({text, f, delay}) => (
  <>
    {[...text].map((ch, i) => {
      const p = easeOutQuint(ramp(f, delay + i * 3, 9));
      return (
        <span
          key={i}
          style={{
            opacity: p,
            filter: `blur(${(1 - p) * 8}px)`,
            transform: `translateX(${(1 - p) * 18}px)`,
          }}
        >
          {ch}
        </span>
      );
    })}
  </>
);
