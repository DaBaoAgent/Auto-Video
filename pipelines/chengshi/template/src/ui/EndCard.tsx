import {useVideoConfig} from 'remotion';
import type {Film} from '../types';
import {smoothstep} from '../theme';

const SERIF = '"Noto Serif SC", "Source Han Serif SC Heavy", "SimSun", serif';
const SANS = '"Noto Sans SC", "Microsoft YaHei", sans-serif';

/** 片尾：全景定格之上浮出片名与署名，画面右侧留出来看城市 */
export const EndCard: React.FC<{film: Film; t: number; duration: number}> = ({film, t, duration}) => {
  const {height} = useVideoConfig();
  const s = height / 1080;
  const start = duration - 4.8;
  if (t < start) return null;
  const op = smoothstep(start, start + 0.9, t);
  if (op <= 0.002) return null;
  // 文字层不用 opacity：Chromium 4K 截图时分数 opacity 的文字合成层会整段丢字，
  // 透明度改成乘进颜色、投影与暗角的 alpha。
  const k = op;
  const a = (v: number) => (v * k).toFixed(3);

  return (
    <div style={{position: 'absolute', inset: 0}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, rgba(3,6,12,${a(0.82)}) 0%, rgba(3,6,12,${a(0.6)}) 26%, rgba(3,6,12,${a(0.22)}) 48%, rgba(3,6,12,0) 64%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 420 * s,
          background: `linear-gradient(0deg, rgba(3,6,12,${a(0.55)}) 0%, rgba(3,6,12,0) 100%)`,
        }}
      />
      {/* 整体上移并压缩行距：最后一句字幕在 bottom 96 一带，credits 必须在 y≈850 前收住 */}
      <div style={{position: 'absolute', left: 180 * s, top: 160 * s, maxWidth: 1250 * s}}>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: 150 * s,
            fontWeight: 900,
            letterSpacing: 30 * s,
            lineHeight: 1,
            color: `rgba(244,241,234,${a(1)})`,
            textShadow: `0 ${8 * s}px ${40 * s}px rgba(0,0,0,${a(0.7)})`,
          }}
        >
          苏州
        </div>
        <div
          style={{
            marginTop: 16 * s,
            fontFamily: SERIF,
            fontSize: 54 * s,
            fontWeight: 500,
            letterSpacing: 18 * s,
            color: `rgba(244,238,226,${a(0.92)})`,
            textShadow: `0 ${6 * s}px ${26 * s}px rgba(0,0,0,${a(0.7)})`,
          }}
        >
          {(film.subtitle_cn ?? '苏州 · 从阖闾城到金鸡湖').replace(/^苏州\s*[·:：]\s*/, '')}
        </div>
        <div
          style={{
            marginTop: 14 * s,
            fontSize: 26 * s,
            letterSpacing: 4 * s,
            color: `rgba(230,222,206,${a(0.7)})`,
            fontFamily: 'Georgia, "Times New Roman", serif',
          }}
        >
          {film.title_en}
        </div>
        <div style={{marginTop: 20 * s, width: 470 * s, height: 2 * s, background: `rgba(232,180,90,${a(0.8)})`}} />
        <div
          style={{
            marginTop: 18 * s,
            fontSize: 24 * s,
            lineHeight: 1.6,
            color: `rgba(214,210,200,${a(0.78)})`,
            letterSpacing: 0.8 * s,
            fontFamily: SANS,
            fontWeight: 400,
          }}
        >
          {film.credits.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          <div style={{marginTop: 14 * s, color: `rgba(232,180,90,${a(0.85)})`, letterSpacing: 3 * s}}>
            导演 · 徐艾伦 Alan XU
          </div>
        </div>
      </div>
    </div>
  );
};
