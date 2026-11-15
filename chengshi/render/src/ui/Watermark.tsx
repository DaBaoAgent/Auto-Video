import {useVideoConfig} from 'remotion';

/** 右下角作者水印，长期低透明度，不抢画面 */
export const Watermark: React.FC = () => {
  const {height} = useVideoConfig();
  const s = height / 1080;
  return (
    <div
      style={{
        position: 'absolute',
        right: 64 * s,
        bottom: 46 * s,
        fontSize: 30 * s,
        letterSpacing: 2 * s,
        color: 'rgba(255,255,255,0.5)',
        fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif',
        fontWeight: 400,
        textShadow: `0 ${2 * s}px ${10 * s}px rgba(0,0,0,0.75)`,
      }}
    >
      徐艾伦AlanXU
    </div>
  );
};
