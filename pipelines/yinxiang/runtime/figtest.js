SCENES['fig_test'] = { init: async () => {}, draw(c, lt) {
  c.fillStyle = '#e8e2d4'; c.fillRect(0, 0, 1920, 1080);
  c.fillStyle = '#cfc7b6'; c.fillRect(0, 760, 1920, 320);
  const P = { skin: '#e6c3a1', hair: '#6b4a30', shirt: '#eef2f6', sleeve: '#dfe7ee', trousers: '#4a5568', skirt: '#7a8fa6', dress: '#c9b2a0', shoes: '#3a3330', hat: '#d8b878', hatBand: '#5a4a36', coat: '#3f4c5a', line: '#2a2622', lw: 2, features: true, blush: 'rgba(190,110,90,.25)' };
  // 站
  let g = FIG.build({ x: 300, y: 1000, h: 620, face: 1, ...FIG.pose('idle', lt * .5), hair: 'bob', hat: 'none', bottom: 'skirt', top: 'shirt', hemW: .16 });
  FIG.draw(c, g, P);
  // 走
  g = FIG.build({ x: 760, y: 1000, h: 600, face: 1, ...FIG.pose('walk', lt * 1.3), hair: 'short', hat: 'boater', bottom: 'trousers', top: 'shirt', sleeve: true });
  FIG.draw(c, g, { ...P, shirt: '#8fb0c8', sleeve: '#8fb0c8', trousers: '#3c4654' });
  // 跑
  g = FIG.build({ x: 1180, y: 1000, h: 560, face: -1, ...FIG.pose('run', lt * 1.6), hair: 'short', hat: 'cap', bottom: 'trousers', top: 'jacket', coatLong: .06 });
  FIG.draw(c, g, { ...P, coat: '#6a4a3a', sleeve: '#6a4a3a', trousers: '#2f3b46' });
  // 坐
  g = FIG.build({ x: 1600, y: 1000, h: 520, face: -1, ...FIG.pose('sit', 0), hair: 'long', hat: 'none', bottom: 'skirt', top: 'shirt', sway: lt });
  FIG.draw(c, g, { ...P, skirt: '#5f7a8c', dress: '#5f7a8c' });
  // 伸手 IK
  g = FIG.build({ x: 300, y: 480, h: 300, face: 1, lean: .05, handR: [520, 300], handL: [300, 520], hair: 'bun', bottom: 'dress', top: 'shirt' });
  FIG.draw(c, g, { ...P, dress: '#d8c6b2', skirt: '#d8c6b2' });
} };
