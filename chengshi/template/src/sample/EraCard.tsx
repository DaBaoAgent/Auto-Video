import {fmtYear} from '../theme';
import {eraInfoFor} from './config';

/** 左下年代卡：大年份 + 时代名 + 英文，静帧审片时最先读到的一层信息 */
export const EraCard: React.FC<{year: number}> = ({year}) => {
  const info = eraInfoFor(year);
  return (
    <div style={{position: 'absolute', left: 150, bottom: 280}}>
      <div
        style={{
          fontFamily: '"Noto Serif SC", "Source Han Serif SC Heavy", "SimSun", serif',
          fontSize: 116,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: 4,
          color: 'rgba(250,246,236,0.97)',
          textShadow: '0 4px 26px rgba(12,8,2,0.85)',
        }}
      >
        {fmtYear(year)}
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 8}}>
        <div
          style={{
            fontFamily: '"Noto Serif SC", "Source Han Serif SC Heavy", "SimSun", serif',
            fontSize: 50,
            fontWeight: 600,
            letterSpacing: 14,
            color: 'rgba(246,240,228,0.95)',
            textShadow: '0 3px 18px rgba(12,8,2,0.85)',
          }}
        >
          {info.name}
        </div>
        <div
          style={{
            fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
            fontSize: 26,
            letterSpacing: 4,
            color: 'rgba(240,232,216,0.88)',
            textShadow: '0 2px 12px rgba(12,8,2,0.85)',
          }}
        >
          {info.en.toUpperCase()}
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          width: 300,
          height: 2,
          background: 'linear-gradient(90deg, rgba(232,180,90,0.95) 0%, rgba(232,180,90,0) 100%)',
        }}
      />
    </div>
  );
};
