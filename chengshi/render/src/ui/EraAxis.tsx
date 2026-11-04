import {clamp, fmtYear, lerp} from '../theme';
import {FONTS} from '../fonts';

/** 顶部年代轴：非线性刻度，给前 514–1896 留出呼吸，近现代节点更密 */
const TICKS = [
  {year: -1250, label: '前1250', x: 0.02},
  {year: -514, label: '前514', x: 0.13},
  {year: -221, label: '前221', x: 0.21},
  {year: 589, label: '589', x: 0.34},
  {year: 1229, label: '1229', x: 0.52},
  {year: 1896, label: '1896', x: 0.68},
  {year: 1949, label: '1949', x: 0.76},
  {year: 1978, label: '1978', x: 0.83},
  {year: 1994, label: '1994', x: 0.88},
  {year: 2026, label: '2026', x: 0.97},
];

const xAt = (year: number) => {
  if (year <= TICKS[0].year) return TICKS[0].x;
  for (let i = 0; i < TICKS.length - 1; i++) {
    const a = TICKS[i];
    const b = TICKS[i + 1];
    if (year <= b.year) {
      const p = clamp((year - a.year) / (b.year - a.year || 1), 0, 1);
      return lerp(a.x, b.x, p);
    }
  }
  return TICKS[TICKS.length - 1].x;
};

/**
 * 顶部年代轴：左侧片名，右侧一条时间线，金色游标指示当前年份。
 * 文字透明度全部写进颜色，避免 Chromium 4K 截图丢字。
 */
export const EraAxis: React.FC<{year: number}> = ({year}) => {
  const x = xAt(year);
  return (
    <div style={{position: 'absolute', left: 150, right: 150, top: 96}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
        <div
          style={{
            fontFamily: FONTS.serifTitle,
            fontSize: 46,
            fontWeight: 900,
            letterSpacing: 0.26 * 46,
            color: 'rgba(248,244,236,0.95)',
            textShadow: '0 3px 18px rgba(12,8,2,0.85)',
          }}
        >
          苏州 · 城长
        </div>
        <div
          style={{
            fontFamily: FONTS.sansMedium,
            fontSize: 24,
            letterSpacing: 0.22 * 24,
            color: 'rgba(232,180,90,0.9)',
            fontVariantNumeric: 'lining-nums',
            textShadow: '0 2px 12px rgba(12,8,2,0.85)',
          }}
        >
          公元前 1250 — 2026
        </div>
      </div>

      <div style={{position: 'relative', height: 80, marginTop: 10}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 37,
            height: 3,
            background: 'rgba(255,255,255,0.38)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.55)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            width: `${x * 100}%`,
            top: 37,
            height: 3,
            background: 'linear-gradient(90deg, rgba(232,180,90,0.55) 0%, rgba(255,205,120,0.98) 100%)',
            boxShadow: '0 0 12px rgba(255,190,100,0.45)',
          }}
        />
        {TICKS.map((t) => (
          <div key={t.year} style={{position: 'absolute', left: `${t.x * 100}%`, top: 0}}>
            <div
              style={{
                position: 'absolute',
                left: -1,
                top: 31,
                width: 2,
                height: 14,
                background: 'rgba(255,255,255,0.62)',
              }}
            />
            {/* 游标已经显示当前年份，刻度上的同一年份不再重复 */}
            {Math.abs(t.year - year) > 0.6 && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 52,
                  transform: 'translateX(-50%)',
                  fontFamily: FONTS.sans,
                  fontSize: 30,
                  letterSpacing: 2,
                  color: 'rgba(255,255,255,0.88)',
                  fontVariantNumeric: 'lining-nums',
                  textShadow: '0 2px 10px rgba(12,8,2,0.9)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
              </div>
            )}
          </div>
        ))}
        <div style={{position: 'absolute', left: `${x * 100}%`, top: 0}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: -6,
              transform: 'translateX(-50%)',
              fontFamily: FONTS.serifBold,
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: 2,
              fontVariantNumeric: 'lining-nums',
              color: 'rgba(255,214,140,0.99)',
              textShadow: '0 2px 16px rgba(12,8,2,0.95)',
              whiteSpace: 'nowrap',
            }}
          >
            {fmtYear(year)}
          </div>
          <div
            style={{
              position: 'absolute',
              left: -9,
              top: 30,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, #fff5dd 0%, #ffd08a 40%, rgba(255,190,96,0.6) 70%, rgba(255,180,80,0) 100%)',
              boxShadow: '0 0 18px 6px rgba(255,190,100,0.5)',
            }}
          />
        </div>
      </div>
    </div>
  );
};
