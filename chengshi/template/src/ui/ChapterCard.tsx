import {useVideoConfig} from 'remotion';
import type {Era} from '../types';
import {clamp, smoothstep} from '../theme';

const NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一'];

/** 过场章节名：默认左上角思源宋体；corner="tr" 时贴右上，出现即淡出 */
export const ChapterCard: React.FC<{era: Era; t: number; top?: number; corner?: 'tl' | 'tr'}> = ({
  era,
  t,
  top = 150,
  corner = 'tl',
}) => {
  const {height} = useVideoConfig();
  const s = height / 1080;
  if (era.chapter === '0') return null; // 序章由片名承担
  const inP = smoothstep(era.t0 + 0.15, era.t0 + 0.85, t);
  const outP = 1 - smoothstep(era.t0 + 1.9, era.t0 + 2.7, t);
  const opacity = clamp(t >= era.t0 ? inP * outP : 0, 0, 1);
  if (opacity <= 0.01) return null;
  const idx = parseInt(era.chapter, 10);
  const num = Number.isFinite(idx) ? NUM[Math.min(NUM.length - 1, idx)] : '';
  const k = opacity;
  // 文字层不用 opacity：Chromium 4K 截图时分数 opacity 的文字合成层会整段丢字，
  // 透明度改成乘进颜色与投影的 alpha。
  const sh = (0.85 * k).toFixed(3);
  const tr = corner === 'tr';

  return (
    <div
      style={{
        position: 'absolute',
        ...(tr ? {right: 150 * s} : {left: 150 * s}),
        top: top * s,
        display: 'flex',
        flexDirection: 'column',
        alignItems: tr ? 'flex-end' : 'flex-start',
        whiteSpace: 'nowrap',
      }}
    >
      {/* 序号与章名同一行并贴紧，避免按英文行宽右对齐把序号甩到很左 */}
      <div style={{display: 'flex', alignItems: 'baseline', gap: 10 * s}}>
        <div
          style={{
            flex: '0 0 auto',
            fontFamily: '"Noto Serif SC", "Source Han Serif SC Heavy", "SimSun", serif',
            fontSize: 66 * s,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: 2 * s,
            color: `rgba(247,242,232,${(0.92 * k).toFixed(3)})`,
            textShadow: `0 ${5 * s}px ${24 * s}px rgba(20,12,4,${sh})`,
          }}
        >
          {num}
        </div>
        <div
          style={{
            flex: '0 0 auto',
            fontFamily: '"Noto Serif SC", "Source Han Serif SC Heavy", "SimSun", serif',
            fontSize: 48 * s,
            fontWeight: 600,
            letterSpacing: 8 * s,
            lineHeight: 1.1,
            color: `rgba(244,241,234,${k.toFixed(3)})`,
            textShadow: `0 ${4 * s}px ${20 * s}px rgba(20,12,4,${sh})`,
          }}
        >
          {era.chapterName}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11 * s,
          marginTop: 7 * s,
          flexDirection: tr ? 'row-reverse' : 'row',
        }}
      >
        <div
          style={{
            width: 56 * s,
            height: 1.4 * s,
            background: `rgba(232,180,90,${(0.85 * k).toFixed(3)})`,
          }}
        />
        <div
          style={{
            fontSize: 18 * s,
            letterSpacing: 2 * s,
            color: `rgba(238,230,214,${(0.75 * k).toFixed(3)})`,
            fontFamily: '"Noto Sans SC", Georgia, serif',
            textShadow: `0 ${3 * s}px ${12 * s}px rgba(20,12,4,${sh})`,
          }}
        >
          {era.chapterEn}
        </div>
      </div>
    </div>
  );
};
