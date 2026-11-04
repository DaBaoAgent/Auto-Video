import {fmtYear} from '../theme';
import {FONTS} from '../fonts';

export const YearBadge: React.FC<{year: number; t: number}> = ({year, t}) => {
  if (t < 8) return null;
  return (
    <div
      style={{
        position: 'absolute',
        right: 104,
        bottom: 150,
        fontFamily: FONTS.serif,
        fontSize: 22,
        letterSpacing: 0.14 * 22,
        fontVariantNumeric: 'lining-nums',
        color: 'rgba(235,225,205,0.62)',
        textShadow: '0 2px 10px rgba(0,0,0,0.9)',
      }}
    >
      {fmtYear(year)}
    </div>
  );
};
