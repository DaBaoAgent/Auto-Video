import {useVideoConfig} from 'remotion';
import type {Caption} from '../types';
import {clamp, smoothstep} from '../theme';

/** 中英双语字幕：中文一次一行（文本已在数据里按标点断好、不含标点），英文小一号垫底 */
export const Captions: React.FC<{captions: Caption[]; t: number}> = ({captions, t}) => {
  const {height} = useVideoConfig();
  const s = height / 1080;
  const cap = captions.find((c) => t >= c.t0 && t <= c.t1);
  if (!cap) return null;
  const op = clamp(smoothstep(cap.t0, cap.t0 + 0.22, t) * (1 - smoothstep(cap.t1 - 0.22, cap.t1, t)), 0, 1);
  if (op <= 0.002) return null;
  // 文字层不用 opacity：Chromium 4K 截图时分数 opacity 的文字合成层会整段丢字，
  // 透明度改成乘进颜色与投影的 alpha。
  const a = op.toFixed(3);
  const sh = (0.95 * op).toFixed(3);
  const sh2 = (0.9 * op).toFixed(3);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 96 * s,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9 * s,
      }}
    >
      <div
        style={{
          fontSize: 50 * s,
          fontWeight: 600,
          letterSpacing: 2.3 * s,
          color: `rgba(250,250,250,${a})`,
          textShadow: `0 ${4 * s}px ${26 * s}px rgba(0,0,0,${sh}), 0 ${2 * s}px ${6 * s}px rgba(0,0,0,${sh2})`,
          fontFamily: '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif',
          textAlign: 'center',
          maxWidth: 2600 * s,
          lineHeight: 1.24,
        }}
      >
        {cap.cn}
      </div>
      <div
        style={{
          fontSize: 22 * s,
          fontWeight: 400,
          color: `rgba(232,232,232,${(0.88 * op).toFixed(3)})`,
          fontFamily: '"Noto Sans SC", Georgia, serif',
          letterSpacing: 0.6 * s,
          textShadow: `0 ${3 * s}px ${18 * s}px rgba(0,0,0,${sh})`,
          textAlign: 'center',
          maxWidth: 2300 * s,
        }}
      >
        {cap.en}
      </div>
    </div>
  );
};
