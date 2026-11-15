import {useVideoConfig} from 'remotion';
import {clamp, smoothstep} from '../theme';

/**
 * 片名：苏州 / 城长 / 公元前一行并排。
 * 样片（persist）：左上角、出现后常驻；正片：左下角、片头淡出。
 * 尺寸按画面高度缩放，1080p 与 4K 观感一致。
 */
export const TitleCard: React.FC<{t: number; persist?: boolean}> = ({t, persist = false}) => {
  const {height} = useVideoConfig();
  const s = height / 1080;
  // 样片：出现后常驻左上角；正片：原左下角、片头结束淡出
  const op = clamp(
    smoothstep(0.9, 1.9, t) * (persist ? 1 : 1 - smoothstep(3.5, 4.4, t)),
    0,
    1,
  );
  if (op <= 0.01) return null;
  const rise = (1 - smoothstep(0.9, 2.4, t)) * 10 * s;
  const k = op;
  // 文字层不用 opacity：Chromium 4K 截图时分数 opacity 的文字合成层会整段丢字，
  // 透明度改成乘进颜色与投影的 alpha。
  const a = (v: number) => (v * k).toFixed(3);

  return (
    <div
      style={{
        position: 'absolute',
        left: 96 * s,
        ...(persist ? {top: 32 * s} : {bottom: 84 * s}),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        transform: `translateY(${rise}px)`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'baseline',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontFamily: '"Noto Serif SC", "Source Han Serif SC Heavy", "SimSun", serif',
            fontSize: 85 * s,
            fontWeight: 900,
            letterSpacing: 14 * s,
            color: `rgba(247,242,232,${a(1)})`,
            lineHeight: 1.02,
            textShadow: `0 8px 44px rgba(20,12,4,${a(0.72)}), 0 2px 6px rgba(0,0,0,${a(0.48)})`,
          }}
        >
          苏州
        </div>
        <div
          style={{
            marginLeft: 9 * s,
            fontFamily: '"Noto Serif SC", "Source Han Serif SC Heavy", "SimSun", serif',
            fontSize: 32 * s,
            fontWeight: 500,
            letterSpacing: 13 * s,
            color: `rgba(244,236,222,${a(0.94)})`,
            textShadow: `0 5px 24px rgba(20,12,4,${a(0.78)})`,
          }}
        >
          城 长
        </div>
        <div
          style={{
            marginLeft: 19 * s,
            fontSize: 18 * s,
            letterSpacing: 4 * s,
            color: `rgba(238,226,206,${a(0.86)})`,
            fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
            fontWeight: 400,
            textShadow: `0 3px 16px rgba(20,12,4,${a(0.78)})`,
          }}
        >
          公元前 1250 — 2026
        </div>
      </div>
    </div>
  );
};
