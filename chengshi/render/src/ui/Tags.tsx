import type {Tag} from '../types';
import {clamp, smoothstep} from '../theme';

export const Tags: React.FC<{tags: Tag[]; t: number}> = ({tags, t}) => {
  const active = tags.filter((tg) => t >= tg.t0 && t <= tg.t1);
  if (!active.length) return null;
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {active.map((tg, i) => {
          const op = clamp(smoothstep(tg.t0, tg.t0 + 0.3, t) * (1 - smoothstep(tg.t1 - 0.3, tg.t1, t)), 0, 1);
          return (
            <line
              key={i}
              x1={tg.x + 6}
              y1={tg.y + 56}
              x2={tg.tx}
              y2={tg.ty}
              stroke={`rgba(220,220,220,${0.5 * op})`}
              strokeWidth={1}
            />
          );
        })}
      </svg>
      {active.map((tg, i) => {
        const op = clamp(smoothstep(tg.t0, tg.t0 + 0.3, t) * (1 - smoothstep(tg.t1 - 0.3, tg.t1, t)), 0, 1);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: tg.x,
              top: tg.y,
              opacity: op,
              background: 'rgba(16,16,16,0.82)',
              border: '1px solid rgba(255,255,255,0.14)',
              padding: '10px 16px 12px',
              color: '#f0f0f0',
              boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{fontSize: 27, fontWeight: 600, letterSpacing: 1.5}}>{tg.cn}</div>
            <div
              style={{
                marginTop: 4,
                fontSize: 17,
                color: 'rgba(205,205,205,0.78)',
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              {tg.en}
            </div>
          </div>
        );
      })}
    </>
  );
};
