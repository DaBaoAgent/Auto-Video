const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(#n)' opacity='0.55'/></svg>`
  );

/** 胶片颗粒 + 轻微暗角 + 上下压边，4K 下按 2 倍尺寸铺 */
export const Grain: React.FC = () => {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${NOISE}")`,
          backgroundSize: '420px 420px',
          opacity: 0.05,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 44%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0.24) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 360,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 420,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};
