const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(#n)' opacity='0.55'/></svg>`
  );

/**
 * 胶片颗粒 + 做旧纸质感 + 轻微暗角 + 上下压边，4K 下按 2 倍尺寸铺。
 * 对标《一座城的年轮》：承认「示意重建」，用颗粒与暖旧色调把三维模型压成
 * 哑光纸感，而不是硬追实拍。颗粒比旧版略强（0.05→0.085），并叠一层微弱的
 * 暖旧 tint，让全片有「被时间书写过」的档案气质。
 */
export const Grain: React.FC = () => {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("${NOISE}")`,
          backgroundSize: '420px 420px',
          opacity: 0.12,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
      {/* 做旧暖 tint：极淡的羊皮纸/旧照片底色，不抢色，只压掉数字感的高饱和 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(96,74,48,0.10) 0%, rgba(74,58,40,0.07) 100%)',
          mixBlendMode: 'soft-light',
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
          background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 100%)',
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
          background: 'linear-gradient(0deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};
