/* 站点是纯静态的：assets/data.js 由 tools/build_site.py 从 catalog 与 samples.json 生成，
   这里只负责把数据铺成工位、卡片、样片库，以及悬停即播与放大出声。 */
(() => {
  const AV = window.AV;
  if (!AV) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

  const items = AV.items || [];
  const stations = AV.stations || [];
  const byStation = (id) => items.filter((it) => it.kind === "pipeline" && it.station === id);

  /* ---------------------------------------------------------- 首屏计数 */
  const withSample = items.filter((it) => it.kind === "pipeline" && it.mp4).length;
  const allSamples = items.filter((it) => it.mp4).length;
  $("#kicker").textContent = `${stations.length} 个工位 · ${items.filter(i => i.kind === "pipeline").length} 条管线 · ${allSamples} 段样片`;

  /* ---------------------------------------------------------- 目录与跳转 */
  const contents = $("#contents");
  const jump = $("#jump");
  stations.forEach((st) => {
    const a = el("a", null,
      `<span>${esc(st.no)}</span><span>${esc(st.name_zh)}</span><span>${byStation(st.id).length}</span>`);
    a.href = `#s${st.no}`;
    contents.appendChild(a);

    const j = el("a", null, `${esc(st.no)}`);
    j.href = `#s${st.no}`;
    j.dataset.station = st.id;
    jump.appendChild(j);
  });

  /* -------------------------------------------------------------- 卡片 */
  function makeCard(it, opts = {}) {
    const has = Boolean(it.mp4);
    const card = el(has ? "a" : "a", "card" + (has ? "" : " empty"));
    card.href = has ? "#play" : it.doc;
    if (!has) {
      card.target = "_blank";
      card.rel = "noopener";
    }
    card.dataset.key = it.key;
    card.setAttribute("aria-label", `${it.name_zh || it.title}${has ? " 播放样片" : " 查看管线文档"}`);

    const aspect = it.aspect === "9:16" ? " portrait" : it.aspect === "4:3" ? " square" : "";
    const shot = el("div", "shot" + aspect);
    if (has) {
      const img = el("img");
      img.src = it.poster;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      shot.appendChild(img);

      const vid = el("video");
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = "none";
      vid.dataset.src = it.mp4;
      shot.appendChild(vid);
      shot.appendChild(el("span", "badge", esc(it.kind === "pipeline" ? it.badge || "管线样片" : "风格样片")));
      const pl = el("span", "play");
      pl.setAttribute("aria-hidden", "true");
      shot.appendChild(pl);
    } else {
      shot.appendChild(el("span", null, esc(it.note || "样片待补")));
    }
    card.appendChild(shot);

    const cap = el("div", "cap");
    cap.appendChild(el("h3", null, esc(it.name_zh || it.title)));
    cap.appendChild(el("span", "dur", has ? esc(it.duration) : "—"));
    if (it.name_en) cap.appendChild(el("span", "en", esc(it.name_en)));
    if (it.title && it.kind === "pipeline") cap.appendChild(el("span", "title", `《${esc(it.title)}》`));
    card.appendChild(cap);

    if (has) {
      card.addEventListener("mouseenter", () => playInline(card));
      card.addEventListener("mouseleave", () => stopInline(card));
      card.addEventListener("click", (e) => {
        e.preventDefault();
        openLightbox(it);
      });
    }
    return card;
  }

  const playing = new Set();
  const maxPlaying = 4;

  function playInline(card) {
    const vid = $("video", card);
    if (!vid) return;
    if (!vid.src) vid.src = vid.dataset.src;
    while (playing.size >= maxPlaying) {
      const first = playing.values().next().value;
      if (first) stopInline(first);
      else break;
    }
    const p = vid.play();
    if (p && p.catch) p.catch(() => {});
    card.classList.add("playing");
    playing.add(card);
  }

  function stopInline(card) {
    const vid = $("video", card);
    if (vid) {
      vid.pause();
      try { vid.currentTime = 0; } catch (_) {}
    }
    card.classList.remove("playing");
    playing.delete(card);
  }

  /* ------------------------------------------------------------ 工位区 */
  const host = $("#stations");
  stations.forEach((st, i) => {
    const list = byStation(st.id);
    if (!list.length) return;
    const sec = el("section", "station");
    sec.id = `s${st.no}`;
    sec.dataset.station = st.id;

    const head = el("div", "station__head");
    head.appendChild(el("div", "station__no", `工位<b>${esc(st.no)} / ${String(stations.length).padStart(2, "0")}</b>`));

    const title = el("div", "station__title");
    title.appendChild(el("h2", null, `<i>${esc(st.no)}</i>${esc(st.name_zh)}`));
    title.appendChild(el("span", "en", esc(st.name_en)));
    title.appendChild(el("p", null, esc(st.blurb)));
    head.appendChild(title);
    head.appendChild(el("div", "station__count", `${list.length} 条管线`));
    sec.appendChild(head);

    const grid = el("div", "grid");
    list.forEach((it) => grid.appendChild(makeCard(it)));
    sec.appendChild(grid);

    const foot = el("div", "station__foot");
    foot.appendChild(el("q", null, esc(st.line)));
    const withSample = list.filter((x) => x.mp4).length;
    const films = list.filter((x) => !x.note).length;
    const fronts = list.length - films;
    const tally = films
      ? `${withSample}/${films} 有样片` + (fronts ? ` · ${fronts} 个前端模块` : "")
      : `${fronts} 个前端模块 · 不出片`;
    foot.appendChild(el("div", "meta", `${esc(st.name_en)} · ${tally}`));
    sec.appendChild(foot);

    host.appendChild(sec);
  });

  /* ------------------------------------------------------------ 样片库 */
  const lib = items.filter((it) => it.mp4);
  $("#libcount").textContent = `${lib.length} 段`;
  const libgrid = $("#libgrid");
  const libempty = $("#libempty");
  let filter = "all";
  let query = "";

  function match(it) {
    if (filter === "pipeline" && it.kind !== "pipeline") return false;
    if (filter === "style" && it.kind !== "style") return false;
    if (filter === "portrait" && it.aspect !== "9:16") return false;
    if (filter === "landscape" && it.aspect === "9:16") return false;
    if (filter === "long" && !(it.seconds >= 60)) return false;
    if (!query) return true;
    const hay = [it.name_zh, it.name_en, it.title, it.pipeline, it.station_name].join(" ").toLowerCase();
    return hay.includes(query);
  }

  function renderLib() {
    libgrid.innerHTML = "";
    const hits = lib.filter(match);
    hits.forEach((it) => libgrid.appendChild(makeCard(it)));
    libempty.hidden = hits.length > 0;
    $("#libcount").textContent = `${hits.length} / ${lib.length} 段`;
  }
  renderLib();

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
      filter = chip.dataset.filter;
      renderLib();
    });
  });

  const q = $("#q");
  q.addEventListener("input", () => {
    query = q.value.trim().toLowerCase();
    renderLib();
  });

  /* ------------------------------------------------------------- 灯箱 */
  const lb = $("#lightbox");
  const lbv = $("#lbvideo");
  const lbt = $("#lbtitle");
  const lbe = $("#lben");
  const lbm = $("#lbmeta");

  function openLightbox(it) {
    lbv.pause();
    lbv.src = it.mp4;
    lbv.currentTime = 0;
    lbv.poster = it.poster || "";
    lbt.textContent = it.name_zh || it.title;
    lbe.textContent = it.name_en || "";
    const bits = [it.duration];
    if (it.clip) bits.push(`试片 ${it.clip}s`);
    if (it.engine) bits.push(it.engine);
    if (it.doc) bits.push(`<a href="${it.doc}" target="_blank" rel="noopener">管线文档 ↗</a>`);
    lbm.innerHTML = bits.join(" · ");
    lb.classList.add("on");
    document.body.style.overflow = "hidden";
    const p = lbv.play();
    if (p && p.catch) p.catch(() => {});
  }

  function closeLightbox() {
    lbv.pause();
    lbv.removeAttribute("src");
    lb.classList.remove("on");
    document.body.style.overflow = "";
  }

  $("#close").addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target.classList.contains("lightbox__stage")) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lb.classList.contains("on")) closeLightbox();
    if (e.key === "/" && document.activeElement !== q) {
      e.preventDefault();
      q.focus();
      q.select();
    }
  });

  /* --------------------------------------------------------- 顶栏状态 */
  const jumpLinks = [...jump.children];
  const secs = [...document.querySelectorAll(".station")];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const id = en.target.dataset.station;
      jumpLinks.forEach((a) => a.classList.toggle("on", a.dataset.station === id));
    });
  }, { rootMargin: "-30% 0px -60% 0px" });
  secs.forEach((s) => io.observe(s));

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      document.body.classList.toggle("scrolled", scrollY > 40);
      ticking = false;
    });
  }, { passive: true });

  /* 鼠标离开窗口时全部暂停 */
  document.addEventListener("mouseleave", () => {
    [...playing].forEach(stopInline);
  });
})();
