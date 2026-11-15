import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KAI, SERIF, Seal, gold, ink} from './look';
import {easeOutCubic, prng, ramp} from './lib/anim';

/* ------------------------------------------------------------------ *
 * Ornament —— 纸面内容层（叠在卡片之上，不改卡片版式）
 *
 * 2026-10-26 由 E3《碽妃疑案》迭代定型，抽成可配置：
 *   版框 58,50 → 1862,946（外粗内细双线 + 四角角标 + 顶部鱼尾）
 *   左影字区 x92-216（4 列）· 右影字区 x1700-1826（2 列）
 *   中间 640-1280 留给卡片正文，界行 x=250 / x=1666 把边栏隔开
 *
 * 全部颜色走 ink()/gold()，与纸本系统同源，不引入新色相。
 * 文案不写死：由 film.json 的 ornament 段传入（见 ShotContent/OrnamentCfg）。
 *
 * 两个坐标必须和卡片对齐，否则会压字：
 *   · numcard 自带 top:660 小注 + 右下「志」印 → 只允许在 y<300 和左右竖线加东西
 *   · sealcard 自带 right:320 bottom:170 的 112px 方印 → 飞溅要对准它
 * ------------------------------------------------------------------ */

const F = {l: 58, t: 50, r: 1862, b: 946};

export type OrnamentCfg = {
  /** 左边栏竖排影字，最多 4 列（越靠后越淡） */
  railL?: string[];
  /** 右边栏竖排影字，最多 2 列 */
  railR?: string[];
  /** 右上角竖排纪年，如「洪武三十一年」 */
  year?: string;
  /** 纪年右侧地名，如「南京」 */
  place?: string;
  /** 左上角章，2 字 */
  sealL?: string;
  /** 右上角章，2 字（别和卡片自带的印同名） */
  sealR?: string;
  /** 巨字卡上方小字 */
  header?: string;
  /** 卷轴卡下方小字 */
  footer?: string;
  /** 名卡印泥飞溅：对准卡片的方印中心（帧内像素） */
  splatterAt?: [number, number];
};

/** 竖排影字：是真文字，不是纹理 —— 远看是墨色深浅，近看是字 */
const Ghost: React.FC<{x: number; y: number; chars: string; size: number; alpha: number}> = ({
  x, y, chars, size, alpha,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      writingMode: 'vertical-rl',
      fontFamily: SERIF,
      fontSize: size,
      letterSpacing: '0.3em',
      lineHeight: 1.62,
      color: ink(alpha),
      whiteSpace: 'nowrap',
    }}
  >
    {chars}
  </div>
);

/** 漂浮墨点：缓慢上浮 + 正弦横摆，给静止画面一点呼吸（不闪） */
const Dots: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = useMemo(() => {
    const r = prng(9091);
    return Array.from({length: 22}, () => ({
      x: 80 + r() * 1760,
      y: 70 + r() * 900,
      s: 1.1 + r() * 2.8,
      a: 0.08 + r() * 0.16,
      p: r() * 6.28,
      v: 0.25 + r() * 0.6,
    }));
  }, []);
  const t = frame / 30;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x + Math.sin(t * d.v + d.p) * 14}
          cy={d.y - ((t * 9 * d.v) % 260)}
          r={d.s}
          fill={ink(d.a)}
        />
      ))}
    </svg>
  );
};

export const Ornament: React.FC<{shot: {id: string}; cfg?: OrnamentCfg}> = ({shot, cfg}) => {
  const frame = useCurrentFrame();
  const p = easeOutCubic(ramp(frame, 0, 10));
  const g = (a: number) => gold(a);
  const c = cfg ?? {};

  const splatter = useMemo(() => {
    const [cx, cy] = c.splatterAt ?? [1144, 369];
    const r = prng(4471);
    return Array.from({length: 18}, () => {
      const ang = r() * Math.PI * 2;
      const rad = 62 + r() * 46;
      return {
        cx: cx + Math.cos(ang) * rad,
        cy: cy + Math.sin(ang) * rad * 1.2,
        rr: 1.8 + r() * 5.2,
        a: 0.12 + r() * 0.3,
      };
    });
  }, [c.splatterAt]);

  // 影字：位置与透明度按列递减，数量由配置决定
  const leftCols = (c.railL ?? []).slice(0, 4);
  const rightCols = (c.railR ?? []).slice(0, 2);
  const leftX = [92, 128, 160, 190];
  const leftA = [0.085, 0.07, 0.06, 0.05];
  const rightX = [1700, 1732];

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {/* ================= 边栏 ================= */}
      <AbsoluteFill style={{opacity: p}}>
        {leftCols.map((chars, i) => (
          <Ghost key={`l${i}`} x={leftX[i]} y={286} chars={chars} size={i === 0 ? 30 : 26} alpha={leftA[i]} />
        ))}
        {rightCols.map((chars, i) => (
          <Ghost key={`r${i}`} x={rightX[i]} y={286} chars={chars} size={26} alpha={i === 0 ? 0.065 : 0.055} />
        ))}
        {c.year ? <Ghost x={1796} y={186} chars={c.year} size={24} alpha={0.2} /> : null}
        {c.place ? <Ghost x={1826} y={186} chars={c.place} size={22} alpha={0.16} /> : null}
        <svg width={1920} height={1080} style={{position: 'absolute'}}>
          <line x1={250} y1={190} x2={250} y2={870} stroke={g(0.22)} strokeWidth={1} />
          <line x1={1666} y1={190} x2={1666} y2={870} stroke={g(0.22)} strokeWidth={1} />
        </svg>
      </AbsoluteFill>

      {/* ================= 版框 ================= */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: p}}>
        <rect x={F.l} y={F.t} width={F.r - F.l} height={F.b - F.t}
              fill="none" stroke={g(0.32)} strokeWidth={2} />
        <rect x={F.l + 9} y={F.t + 9} width={F.r - F.l - 18} height={F.b - F.t - 18}
              fill="none" stroke={g(0.16)} strokeWidth={1} />
        {[
          [F.l, F.t, 1, 1],
          [F.r, F.t, -1, 1],
          [F.l, F.b, 1, -1],
          [F.r, F.b, -1, -1],
        ].map(([x, y, sx, sy], i) => (
          <path key={i} d={`M${x + 24 * sx},${y} L${x},${y} L${x},${y + 24 * sy}`}
                stroke={g(0.58)} strokeWidth={2.4} fill="none" />
        ))}
        <path d={`M934,${F.t + 12} L960,${F.t + 32} L986,${F.t + 12}`}
              fill="none" stroke={g(0.42)} strokeWidth={1.8} />
        <line x1={838} y1={F.t + 12} x2={904} y2={F.t + 12} stroke={g(0.26)} strokeWidth={1} />
        <line x1={1016} y1={F.t + 12} x2={1082} y2={F.t + 12} stroke={g(0.26)} strokeWidth={1} />
      </svg>

      {/* ================= 浮尘 ================= */}
      <Dots />

      {/* ================= 角章 ================= */}
      {c.sealL ? <Seal text={c.sealL} size={50} local={frame} delay={16} rotate={-6} style={{left: 120, top: 108}} /> : null}
      {c.sealR ? <Seal text={c.sealR} size={46} local={frame} delay={24} rotate={5} style={{left: 1790, top: 104}} /> : null}

      {/* ================= 每张卡自己的装饰 ================= */}
      {shot.id === 'bookcard' && c.footer ? (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute', opacity: p}}>
            <line x1={300} y1={840} x2={1620} y2={840} stroke={g(0.3)} strokeWidth={1} />
          </svg>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 856, textAlign: 'center',
            fontFamily: KAI, fontSize: 21, letterSpacing: '0.5em', color: ink(0.42), opacity: p,
          }}>
            {c.footer}
          </div>
        </>
      ) : null}

      {shot.id === 'numcard' && c.header ? (
        <>
          <svg width={1920} height={1080} style={{position: 'absolute', opacity: p}}>
            <line x1={560} y1={348} x2={560} y2={596} stroke={g(0.4)} strokeWidth={1} />
            <line x1={1360} y1={348} x2={1360} y2={596} stroke={g(0.4)} strokeWidth={1} />
            <line x1={300} y1={292} x2={1620} y2={292} stroke={g(0.28)} strokeWidth={1} />
          </svg>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 254, textAlign: 'center',
            fontFamily: KAI, fontSize: 21, letterSpacing: '0.5em', color: ink(0.4), opacity: p,
          }}>
            {c.header}
          </div>
        </>
      ) : null}

      {shot.id === 'sealcard' ? (
        <svg width={1920} height={1080} style={{position: 'absolute', opacity: p}}>
          {splatter.map((d, i) => (
            <circle key={i} cx={d.cx} cy={d.cy} r={d.rr} fill="#b33a2b" opacity={d.a} />
          ))}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
