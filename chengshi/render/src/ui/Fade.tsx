import {clamp, smoothstep} from '../theme';

/** 开场从黑里浮出来，结尾压回黑场 */
export const Fade: React.FC<{t: number; duration: number}> = ({t, duration}) => {
  const op = clamp(1 - smoothstep(0.0, 1.4, t) + smoothstep(duration - 0.9, duration, t), 0, 1);
  return <div style={{position: 'absolute', inset: 0, backgroundColor: '#000', opacity: op}} />;
};
