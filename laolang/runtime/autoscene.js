// AUTOSCENE · 数据驱动的通用分幕
//
// 背景：BB-Video 派生的 8 条管线（pencil / isometric / manga / tapestry / shadow /
// parable / goldenage / blueprint）原来的 template/index.html 是按某条样片的 8 句旁白
// 手写死的（s('l1')…s('l8')），换一份 5 句或 12 句的稿子，渲染器直接报
// `timeline: narration line id "l2" not found` —— 也就是说模板只能复刻那一支片。
//
// 这里换一种做法：**分幕从 TIMELINE 长出来**，一句旁白一张卡，几行都行。画面用各管线
// compose 里那套 theme（底色、墨色、强调色、字体）做排版，不假装有手绘/三维美术——
// 需要那种美术的片子仍旧走 projects/ 里手写的 index.html，模板保底是「能出片、风格不跑」。
//
// 用法（模板里）：
//   PROMO.compose({ ...theme..., build: (F) => AUTOSCENE.build(F, { title: '片名' }) })
//
// 约束：确定性渲染，不用 Date.now() / Math.random()；所有时间只来自 TIMELINE。

(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);

  // 一句话拆成「标题短句」和「余下的解释」：标题取第一个分句，过长再截断
  function split(text, maxHead) {
    const src = String(text || '').replace(/\s+/g, '');
    const parts = src.split(/[，。；：！？、,;:.!?…—]/).filter((s) => s.length);
    let head = parts.shift() || src;
    if (head.length > maxHead) {
      // 中文没有词边界，按字数切，切点尽量落在虚词前
      let cut = maxHead;
      const soft = head.slice(0, maxHead).search(/[的地得和与跟把被在是从对为]{1}$/);
      if (soft > maxHead * 0.6) cut = soft;
      head = head.slice(0, cut);
    }
    const rest = parts.join('，');
    return { head, rest };
  }

  window.AUTOSCENE = {
    build(F, opts) {
      opts = opts || {};
      const P = window.PROMO;   // 运行时再取：autoscene.js 可以排在 promo.js 之后、也可以被延迟加载
      const set = P.set, el = P.el, esc = P.esc;
      const T = F.T || {};
      const all = ((T.lines) || []).filter((l) => !l.silence && l.end > l.start);
      const ls = all.length ? all : [{ id: 'l1', text: opts.title || document.title || '', start: 0, end: Math.max(1, F.duration - 1) }];
      const th = F.theme || {};
      const ink = th.ink || th.fg || '#141414';
      const bg = th.bg || '#F6F5F1';
      const muted = th.muted || ink;
      const accent = th.accent || ink;
      const fontDisplay = (th.fonts && th.fonts.display) || (th.fonts && th.fonts.serif) || 'serif';
      const fontSans = (th.fonts && th.fonts.sans) || 'sans-serif';
      const portrait = !!F.portrait;
      const short = Math.min(F.W, F.H);
      const title = opts.title || document.title || '';

      // ---------- 底板：一层底色 + 一条细边，避免整帧纯白/纯黑 ----------
      const ground = F.layer(`background:${bg}`, 0);
      const frame = el('div', `position:absolute;left:${Math.round(short * 0.028)}px;top:${Math.round(short * 0.028)}px;`
        + `right:${Math.round(short * 0.028)}px;bottom:${Math.round(short * 0.028)}px;`
        + `border:1px solid ${ink}1f;pointer-events:none`, ground);

      // ---------- 每句一张卡 ----------
      const sizeHead = portrait ? short * 0.082 : Math.min(F.H * 0.088, F.W * 0.058);
      const sizeRest = sizeHead * 0.46;
      const gutter = portrait ? F.W * 0.1 : F.W * 0.085;
      const maxHead = portrait ? 12 : 14;

      const cards = [];
      ls.forEach((l, i) => {
        const a0 = i === 0 ? Math.max(0, l.start - 1.1) : Math.max(0, l.start - 0.32);
        const b0 = i === ls.length - 1 ? F.duration : Math.min(F.duration, l.end + 0.36);
        const card = F.layer('', 2);
        card.style.opacity = 0;
        const { head, rest } = split(l.text, maxHead);

        const box = el('div', 'position:absolute;display:flex;flex-direction:column;'
          + (portrait
            ? `left:${gutter}px;right:${gutter}px;top:50%;transform:translateY(-50%)`
            : `left:${gutter}px;width:${Math.round(F.W * 0.62)}px;top:50%;transform:translateY(-50%)`), card);

        const idx = el('div', `font-family:${fontSans};font-size:${Math.round(sizeRest * 0.62)}px;letter-spacing:.18em;`
          + `color:${muted};margin-bottom:${Math.round(sizeHead * 0.28)}px;opacity:.85`, box,
          `<span style="color:${accent}">${String(i + 1).padStart(2, '0')}</span> / ${String(ls.length).padStart(2, '0')}`);

        const rule = el('div', `height:${Math.max(2, Math.round(sizeHead * 0.035))}px;width:${Math.round(sizeHead * 0.9)}px;`
          + `background:${accent};margin-bottom:${Math.round(sizeHead * 0.3)}px`, box);

        const h = el('div', `font-family:${fontDisplay};font-size:${Math.round(sizeHead)}px;line-height:1.16;`
          + `color:${ink};letter-spacing:.01em`, box, esc(head));
        F.text(h, 'caption', head, a0, b0, { noFact: true });

        let sub = null;
        if (rest) {
          sub = el('div', `font-family:${fontSans};font-size:${Math.round(sizeRest)}px;line-height:1.5;`
            + `color:${muted};margin-top:${Math.round(sizeHead * 0.22)}px;max-width:${Math.round(F.W * (portrait ? 0.86 : 0.58))}px`, box, esc(rest));
          F.text(sub, 'caption', rest, a0, b0, { noFact: true });
        }

        // 入/出：位移 + 透明度；卡内一条强调线随说话进度长出来
        const rise = Math.round(sizeHead * 0.22);
        F.add((t) => {
          const fin = ease((t - a0) / 0.55);
          const fout = i === ls.length - 1 ? 1 : clamp((b0 - t) / 0.34);
          const on = t >= a0 && t <= b0;
          const k = clamp((t - a0) / Math.max(0.4, l.end - a0));
          set(card, { opacity: on ? Math.min(fin, fout) : 0 });
          set(box, { transform: `translateY(${-50 + (1 - fin) * 6}%)` });
          set(rule, { width: `${Math.round(sizeHead * 0.9 * Math.max(0.12, k))}px` });
          set(idx, { opacity: String(0.85 * Math.max(0.25, k)) });
        });

        F.cut(l.start);
        F.section(l.start, i === 0 ? 1 : i % 3 === 0 ? 2 : 1, { name: 'line-' + (i + 1) });
        cards.push({ a: a0, b: b0 });
      });

      // ---------- 片头：片名压在第一句上，1 秒后让位 ----------
      if (title && ls.length) {
        const a0 = 0, b0 = Math.max(1.2, Math.min(ls[0].end || 2.2, 2.6));
        const tcard = F.layer('background:' + bg + ';display:flex;align-items:center;justify-content:center', 4);
        const tbox = el('div', 'text-align:center;padding:0 8%', tcard);
        const t1 = el('div', `font-family:${fontDisplay};font-size:${Math.round(sizeHead * (portrait ? 1.25 : 1.5))}px;`
          + `line-height:1.12;color:${ink}`, tbox, esc(title));
        F.text(t1, 'headline', title, a0, b0, { noFact: true });
        const t2 = el('div', `width:${Math.round(sizeHead * 0.8)}px;height:${Math.max(2, Math.round(sizeHead * 0.04))}px;`
          + `background:${accent};margin:${Math.round(sizeHead * 0.36)}px auto 0`, tbox);
        F.add((t) => {
          const on = t <= b0;
          const k = ease(t / 0.5);
          set(tcard, { opacity: on ? 1 - ease((t - (b0 - 0.45)) / 0.45) : 0, visibility: on ? 'visible' : 'hidden' });
          set(t1, { transform: `translateY(${Math.round((1 - k) * sizeHead * 0.18)}px)`, opacity: String(k) });
          set(t2, { width: `${Math.round(sizeHead * 0.8 * k)}px` });
        });
      }

      F.coverAt((cards[0] ? cards[0].a : 0) + Math.max(1.2, Math.min(2.4, F.duration * 0.1)));
    },
  };
})();
