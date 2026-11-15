/** 四角压暗：把视线收回画面中心，也给偏平的航拍一点景深暗示 */
export const Vignette: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background:
        'radial-gradient(ellipse 76% 66% at 50% 46%, rgba(0,0,0,0) 52%, rgba(6,9,14,0.16) 76%, rgba(6,9,14,0.4) 100%)',
    }}
  />
);
