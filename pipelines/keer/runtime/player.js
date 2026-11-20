/* Auto-Video 本地舞台（自研）：单场景逐帧画布。
   协议：window.renderAt(t) 画一帧；window.__ready = true 表示字体/初始化完成；
   出错写 window.__bootFailed，render.py 会拒绝渲染。 */
(() => {
  const qs = new URLSearchParams(location.search);
  const W = +qs.get('w') || 1920, H = +qs.get('h') || 1080;
  const id = qs.get('scene');
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d');
  window.__canvas = cv;
  window.__bootFailed = null;

  (async () => {
    try {
      U.setStage(W, H);
      cv.width = W; cv.height = H;
      for (const f of (window.FONT_FACES || [])) {
        const ff = new FontFace(f.family, `url(${f.url})`, f.desc || {});
        await ff.load();
        document.fonts.add(ff);
      }
      await document.fonts.ready;
      const s = window.SCENES && window.SCENES[id];
      if (!s || typeof s.draw !== 'function') throw new Error('没有这个场景：' + id);
      window.IMG = {};
      if (s.init) await s.init(window.IMG);
      window.renderAt = (t) => {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, W, H);
        s.draw(ctx, t, t, window.IMG, undefined);
        ctx.restore();
      };
      window.renderAt(0);
      window.__ready = true;
    } catch (e) {
      window.__bootFailed = String(e && e.stack || e);
      console.error('BOOT FAILED\n' + window.__bootFailed);
    }
  })();
})();
