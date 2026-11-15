import type {Timeline} from '../types';
import {axisX, eraAt, fmtYear} from '../theme';

const LEFT = 560;
const WIDTH = 780;
const Y = 86;

export const TimelineAxis: React.FC<{timeline: Timeline; t: number; year: number}> = ({
  timeline,
  t,
  year,
}) => {
  const era = eraAt(timeline.eras, t);
  const mx = LEFT + WIDTH * axisX(timeline.ticks, year);

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 160}}>
      <svg width={1920} height={160} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={LEFT} y1={Y} x2={LEFT + WIDTH} y2={Y} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
        {timeline.ticks.map((tick) => {
          const x = LEFT + WIDTH * tick.x;
          return (
            <g key={tick.label + tick.year}>
              <line x1={x} y1={Y - 7} x2={x} y2={Y + 7} stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
              <text x={x} y={Y + 30} fill="rgba(220,220,220,0.65)" fontSize={15} textAnchor="middle">
                {tick.label}
              </text>
            </g>
          );
        })}
        <line x1={mx} y1={Y} x2={mx} y2={Y + 16} stroke={era.ring ? 'rgba(255,255,255,0.8)' : 'rgba(230,200,150,0.9)'} strokeWidth={1.5} />
        <polygon
          points={`${mx - 7},${Y - 16} ${mx + 7},${Y - 16} ${mx},${Y - 4}`}
          fill={era.ring ? 'rgba(255,255,255,0.85)' : 'rgba(232,180,90,0.95)'}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: mx,
          top: 20,
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          color: '#f4f4f4',
          fontSize: 25,
          fontWeight: 600,
          letterSpacing: 3,
          textShadow: '0 2px 10px rgba(0,0,0,0.9)',
        }}
      >
        {era.chapterName}
      </div>
      <div
        style={{
          position: 'absolute',
          left: mx,
          top: 52,
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          color: 'rgba(235,225,205,0.92)',
          fontSize: 19,
          letterSpacing: 1.5,
        }}
      >
        {fmtYear(year)}
      </div>
    </div>
  );
};
