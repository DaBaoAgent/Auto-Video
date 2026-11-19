import type {Film} from '../types';

export const Header: React.FC<{film: Film}> = ({film}) => {
  return (
    <div style={{position: 'absolute', left: 86, top: 44, color: '#f2f2f2'}}>
      <div
        style={{
          fontSize: 29,
          fontWeight: 600,
          letterSpacing: 2,
          textShadow: '0 2px 12px rgba(0,0,0,0.85)',
        }}
      >
        {film.scope_cn}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 17,
          color: 'rgba(220,220,220,0.72)',
          letterSpacing: 0.6,
          fontFamily: 'Georgia, "Times New Roman", serif',
          textShadow: '0 2px 10px rgba(0,0,0,0.85)',
        }}
      >
        {film.scope_en}
      </div>
    </div>
  );
};
