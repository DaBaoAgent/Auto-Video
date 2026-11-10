var STORY = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var story_exports = {};
  __export(story_exports, {
    ACTS: () => ACTS,
    FPS: () => FPS,
    SHOTS: () => SHOTS,
    TOTAL: () => TOTAL,
    cue: () => cue,
    shotAt: () => shotAt,
    win: () => win
  });
  const FPS = 30;
  const TOTAL = 20.1;
  const SHOTS = [
    { id: 1, a: 0, b: 4.15, place: "cliff", label: "\u6D1E\u5916 \xB7 \u63A8\u95E8" },
    { id: 2, a: 4.15, b: 8.56, place: "mural", label: "\u58C1\u753B \xB7 \u548C\u5C1A / \u7626\u9A6C / \u7334\u8138" },
    { id: 3, a: 8.56, b: 10.8, place: "reaction", label: "\u8003\u53E4\u961F\u6123\u4E86" },
    { id: 4, a: 10.8, b: 14.14, place: "book", label: "\u300A\u897F\u6E38\u8BB0\u300B \xB7 \u660E" },
    { id: 5, a: 14.14, b: 15.55, place: "span", label: "\u4E94\u767E\u5E74" },
    { id: 6, a: 15.55, b: 20.1, place: "puzzle", label: "\u53EA\u6709\u4E00\u79CD\u89E3\u91CA" }
  ];
  const T = () => window.TIMELINE;
  function cue(line, ch) {
    const tl = T();
    const l = tl?.lines?.find((x) => x.id === line);
    if (!l) return 0;
    const w = l.words?.find((x) => x.text.includes(ch));
    return w ? w.start : l.start;
  }
  const ACTS = {
    push: cue("l1", "\u63A8"),
    open: cue("l1", "\u5F00"),
    monk: cue("l2", "\u548C"),
    horse: cue("l2", "\u7626"),
    ape: cue("l2", "\u7334"),
    ring: cue("l2", "\u91D1"),
    stun: cue("l3", "\u6123"),
    tang: cue("l4", "\u5510"),
    book: cue("l5", "\u897F"),
    ming: cue("l5", "\u660E"),
    gap: cue("l6", "\u4E94"),
    explain: cue("l7", "\u600E"),
    only: cue("l8", "\u53EA")
  };
  function shotAt(t) {
    return SHOTS.find((s) => t >= s.a && t < s.b) ?? SHOTS[SHOTS.length - 1];
  }
  function win(t, at, dur) {
    const u = Math.max(0, Math.min(1, (t - at) / Math.max(1e-3, dur)));
    return u * u * (3 - 2 * u);
  }
  return __toCommonJS(story_exports);
})();
