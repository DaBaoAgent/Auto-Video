# -*- coding: utf-8 -*-
"""组装分部 composition：fragment(pXX-scenes.html) + manifest -> films/<slug>/pXX/index.html

fragment 约定：
  - 若干 <section id="sN" class="scene" data-scene="N"> ... </section>（N 从 1 起）
  - 尾部 <script> 设置 window.PART_CHAPTER / PART_TOP / PART_TAG（每幕顶栏颜色）/
    PART_TIMELINE = function(tl, T, DUR) {...}
模板自动处理：场景 z-index/初始 opacity、叠化转场、chrome 淡入与逐幕换色、字幕循环。

Agnes 分镜素材（可选）：
  fragment 内放 <div class="shotslot" data-shot="s001"></div>
  assembler 会读 content/<slug>/shots/assets.json，把对应图片/视频复制到
  films/<slug>/<part>/assets/shots/，并替换成 <img>/<video> 层。
  data-mode="image|video|auto" 可覆盖默认（auto=有视频用视频）。

用法：
  python zhidiao_assemble.py --slug <slug> [p01 p02 ...]
"""
import argparse
import json
import os
import re
import shutil
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SLUG = "china-history-20min"

SHOT_CSS = """
/* Agnes 分镜素材层（assembler 自动注入） */
.agh-shot { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.agh-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.shotslot-missing { position: absolute; inset: 0; }
"""

SHOTSLOT_RE = re.compile(
    r'<div\s+class="([^"]*\bshotslot\b[^"]*)"([^>]*?)>\s*</div>', re.I)
DATA_SHOT_RE = re.compile(r'data-shot="([^"]+)"', re.I)
DATA_MODE_RE = re.compile(r'data-mode="([^"]+)"', re.I)

TEMPLATE = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1920, height=1080">
<title>{title}</title>
<link rel="stylesheet" href="../lib/common.css">
<style>
{extra_css}
</style>
</head>
<body>
<div id="root" data-composition-id="{cid}" data-start="0" data-width="1920" data-height="1080" data-duration="{dur}">
{sections}
  <div id="grain" data-layout-ignore></div>
  <div id="vignette" data-layout-ignore></div>
  <div id="caption-wrap"></div>
  <div id="topline"><i></i>图说历史 · 徐艾伦</div>
  <div id="chapter-tag">{chapter}</div>
  <audio id="vo" src="assets/narration.mp3" data-start="0" data-duration="{audiodur}"></audio>
</div>
<script src="../vendor/gsap.min.js"></script>
<script src="../lib/fx.js"></script>
<script>
const T = {t};
const DUR = {dur};
const CAPS = {caps};

/* captions */
const capWrap = document.getElementById("caption-wrap");
CAPS.forEach((s, i) => {{
  const el = document.createElement("div");
  el.className = "cap";
  el.id = "cap-" + i;
  el.textContent = s.text;
  capWrap.appendChild(el);
}});

function buildTimeline() {{
  const tl = gsap.timeline({{ paused: true, defaults: {{ ease: "power2.out" }} }});

  /* 场景初始态 */
  document.querySelectorAll(".scene").forEach((sec, i) => {{
    if (i > 0) gsap.set(sec, {{ opacity: 0 }});
  }});

  /* chrome */
  tl.to("#topline", {{ opacity: 1, duration: 0.8 }}, 0.6);
  tl.to("#chapter-tag", {{ opacity: 1, duration: 0.8 }}, 0.9);
  for (let i = 1; i < T.length; i++) {{
    if (PART_TOP[i] && PART_TOP[i] !== PART_TOP[i - 1])
      tl.to("#topline", {{ color: PART_TOP[i], duration: 0.3 }}, T[i] - 0.1);
    if (PART_TAG[i] && PART_TAG[i] !== PART_TAG[i - 1])
      tl.to("#chapter-tag", {{ color: PART_TAG[i], duration: 0.3 }}, T[i] - 0.1);
  }}

  /* 叠化转场（无墨幕） */
  for (let i = 1; i < T.length; i++) {{
    const top = "#s" + (i + 1), bottom = "#s" + i;
    tl.to(top, {{ opacity: 1, duration: 0.3, ease: "none" }}, T[i] - 0.15);
    tl.set(bottom, {{ opacity: 0 }}, T[i] + 0.16);
  }}

  /* captions（nextStart 填充句间） */
  CAPS.forEach((s, i) => {{
    const el = document.getElementById("cap-" + i);
    const nextStart = i + 1 < CAPS.length ? CAPS[i + 1].t : s.end + 1.0;
    const effEnd = Math.min(nextStart - 0.06, s.end + 3.0);
    tl.fromTo(el, {{ opacity: 0 }}, {{ opacity: 1, duration: 0.01, ease: "none" }}, s.t);
    tl.to(el, {{ opacity: 0, duration: 0.01, ease: "none" }}, effEnd);
  }});

  PART_TIMELINE(tl, T, DUR);

  window.__timelines["{cid}"] = tl;
}}

{part_js}

buildTimeline();
</script>
</body>
</html>
"""


def load_shot_assets(path):
    path = Path(path)
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except ValueError as exc:
        raise SystemExit(f"分镜素材状态不是合法 JSON：{path}（{exc}）")
    return data.get("shots") or {}


def _entry_file(entry):
    if not entry or entry.get("status") != "done":
        return None
    rel = entry.get("path") or entry.get("file")
    if not rel:
        return None
    path = ROOT / rel
    return path if path.is_file() else None


def expand_shotslots(html, assets, part_assets, default_mode="auto"):
    used = {"image": 0, "video": 0}
    missing = []

    def repl(match):
        attrs = match.group(2)
        shot_m = DATA_SHOT_RE.search(attrs)
        if not shot_m:
            missing.append("(缺少 data-shot)")
            return '<div class="shotslot-missing"></div>'
        sid = shot_m.group(1)
        mode_m = DATA_MODE_RE.search(attrs)
        # 命令行 --shot-mode 非 auto 时全局覆盖；否则尊重占位符的 data-mode
        mode = default_mode if default_mode != "auto" else (
            mode_m.group(1) if mode_m else "auto").lower()
        entry = assets.get(sid) or {}
        image = entry.get("image") or {}
        video = entry.get("video") or {}
        image_path = _entry_file(image)
        video_path = _entry_file(video)

        use_video = mode in ("auto", "video") and video_path is not None
        if mode == "video" and video_path is None:
            missing.append(f"{sid}（没有已完成视频）")
        if mode == "image":
            use_video = False

        if not use_video and image_path is None:
            missing.append(f"{sid}（没有已完成图片）")
            return f'<div class="shotslot-missing" data-shot="{sid}"></div>'

        shot_dir = Path(part_assets) / "shots"
        shot_dir.mkdir(parents=True, exist_ok=True)
        if use_video:
            shutil.copy2(video_path, shot_dir / video_path.name)
            used["video"] += 1
            poster = ""
            if image_path is not None:
                shutil.copy2(image_path, shot_dir / image_path.name)
                poster = f' poster="assets/shots/{image_path.name}"'
            return (f'<div class="agh-shot" data-shot="{sid}">'
                    f'<video class="agh-media" src="assets/shots/{video_path.name}"'
                    f'{poster} muted playsinline loop preload="auto"></video></div>')
        shutil.copy2(image_path, shot_dir / image_path.name)
        used["image"] += 1
        return (f'<div class="agh-shot" data-shot="{sid}">'
                f'<img class="agh-media" src="assets/shots/{image_path.name}" alt=""></div>')

    html = SHOTSLOT_RE.sub(repl, html)
    return html, used, missing


def build(pid, slug, mani_dir, src_dir, films_dir, shots_file, shot_mode):
    mani = json.load(open(os.path.join(mani_dir, pid, "manifest.json"), encoding="utf-8"))
    src_path = os.path.join(src_dir, pid + "-scenes.html")
    src = open(src_path, encoding="utf-8").read()

    # 分离 sections 与 script
    m = re.search(r"<script>(.*)</script>\s*$", src, re.S)
    if not m:
        raise SystemExit(f"{src_path} 缺少 <script> 块")
    part_js = m.group(1)
    body = src[:m.start()]

    # 移除 script 中可能的 section 残留（只留 window.PART_* 与函数）
    scenes_html = body.strip()

    # 场景 z-index / 初始 opacity
    idx = {"n": 0}
    def sect_repl(mm):
        idx["n"] += 1
        z = 10 + idx["n"] - 1
        op = "" if idx["n"] == 1 else " opacity:0;"
        return f'<section id="s{idx["n"]}" class="scene" style="z-index:{z};{op}">'
    scenes_html = re.sub(r'<section id="s\d+" class="scene"[^>]*>', sect_repl, scenes_html)

    scene_count = idx["n"]
    if scene_count != len(mani["scenes"]):
        raise SystemExit(
            f"[{pid}] 场景数 {scene_count} != manifest {len(mani['scenes'])}，"
            "会导致尾部黑屏，先修正 fragment 或口播分段")

    out_dir = os.path.join(films_dir, pid)
    os.makedirs(os.path.join(out_dir, "assets"), exist_ok=True)

    # Agnes 分镜素材占位符 -> img/video
    assets = load_shot_assets(shots_file)
    scenes_html, used, missing = expand_shotslots(
        scenes_html, assets, os.path.join(out_dir, "assets"), shot_mode)
    if missing:
        print(f"[{pid}] 警告：分镜素材缺失 {', '.join(missing)}", file=sys.stderr)

    # 场景时间
    starts = [float(sc["start"]) for sc in mani["scenes"]]
    dur = float(mani["duration"]) + 0.15
    t_arr = starts + [round(dur, 3)]

    # 字幕 -> {t, end, text}
    caps = [{"t": c["start"], "end": c["end"], "text": c["text"]} for c in mani["captions"]]

    cid = f"{slug}-{pid}"
    title_m = re.search(r'window\.PART_TITLE\s*=\s*"([^"]+)"', part_js)
    chapter_m = re.search(r'window\.PART_CHAPTER\s*=\s*"([^"]+)"', part_js)
    title = title_m.group(1) if title_m else cid
    chapter = chapter_m.group(1) if chapter_m else ""

    # extra_css：fragment 中 <style> 块
    css_m = re.search(r"<style>(.*?)</style>", scenes_html, re.S)
    extra_css = css_m.group(1) if css_m else ""
    if css_m:
        scenes_html = (scenes_html[:css_m.start()] + scenes_html[css_m.end():])
    if used["image"] or used["video"]:
        extra_css += SHOT_CSS

    html = TEMPLATE.format(
        title=title, cid=cid, dur=f"{dur:.2f}", audiodur=f"{float(mani['duration']):.2f}",
        sections=scenes_html, chapter=chapter, t=json.dumps(t_arr), caps=json.dumps(caps, ensure_ascii=False),
        part_js=part_js, extra_css=extra_css,
    )

    open(os.path.join(out_dir, "index.html"), "w", encoding="utf-8").write(html)
    shutil.copy(os.path.join(mani_dir, pid, "narration.mp3"),
                os.path.join(out_dir, "assets", "narration.mp3"))
    shot_info = ""
    if used["image"] or used["video"]:
        shot_info = f" / 素材 图{used['image']} 视频{used['video']}"
    print(f"[{pid}] built -> films/{slug}/{pid}/index.html  "
          f"({len(mani['scenes'])} 幕 / {len(caps)} 字幕 / {dur:.1f}s{shot_info})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", default=DEFAULT_SLUG)
    ap.add_argument("--base", help="项目根（默认脚本所在仓库；测试时可指向沙箱）")
    ap.add_argument("--shots-file", help="默认 content/<slug>/shots/assets.json")
    ap.add_argument("--shot-mode", choices=("auto", "image", "video"), default="auto")
    ap.add_argument("parts", nargs="*", help="p01 p02 ...（默认全部）")
    args = ap.parse_args()

    base = Path(args.base) if args.base else ROOT
    if not base.is_absolute():
        base = ROOT / base
    mani_dir = base / "output" / args.slug / "parts"
    src_dir = base / "films" / args.slug / "parts-src"
    films_dir = base / "films" / args.slug
    shots_file = Path(args.shots_file) if args.shots_file else (
        base / "content" / args.slug / "shots" / "assets.json")
    if not shots_file.is_absolute():
        shots_file = ROOT / shots_file

    ids = args.parts or [p for p in sorted(os.listdir(src_dir)) if p.endswith("-scenes.html")]
    failed = 0
    for f in ids:
        pid = f.replace("-scenes.html", "") if f.endswith("-scenes.html") else f
        try:
            build(pid, args.slug, str(mani_dir), str(src_dir), str(films_dir),
                  str(shots_file), args.shot_mode)
        except FileNotFoundError as e:
            print(f"[{pid}] 跳过：{e}")
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
