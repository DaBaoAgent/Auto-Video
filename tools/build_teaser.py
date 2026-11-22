"""把若干条管线样片剪成一支总样片（README 首页动画 + 站点可播版）。

读 site/assets/samples.json 取每条样片的最佳时段（poster_pick），
竖屏样片用同帧放大模糊做底、原片居中，不吃掉画面；每段带管线名与 id 角标，
段间 0.35 s 交叉溶解，收尾一张站点卡片。

用法：
    python tools/build_teaser.py                       # 默认 21 条，出 mp4 + gif
    python tools/build_teaser.py --ids piying,shuimo2  # 换选片
    python tools/build_teaser.py --mp4-only            # 只出 showreel
    python tools/build_teaser.py --dry-run             # 打印 ffmpeg 命令，不跑

输出：
    site/media/showreel.mp4   1440x810 / 30fps / CRF23 / 无音轨
    site/media/teaser.gif     720 宽 / 12.5fps / 128 色（README 首页动画）

规矩：样片不留白开场，第 0 帧就是第一条管线的画面；片尾才挂站点卡片。
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import REPO, read_json, utf8_stdout

MEDIA = REPO / "site" / "media"
SAMPLES = REPO / "site" / "assets" / "samples.json"

# 默认顺序：工艺 → 油画水性 → 铅笔炭笔 → 笔类 → 数码笔记 → 花字贴纸。
# 相邻两段不同质感，切起来才有节奏，不是按 id 首字母排。
DEFAULT_IDS = [
    "piying", "shuimo2", "tapestry", "fushihui",
    "youhua", "qianhuang", "gangbi", "shuicai",
    "tanbi", "pencil", "caiqian", "shouhui", "labi",
    "yuanzhu", "heiban", "make", "pingban",
    "biji", "baiban", "huazi", "map",
]

FONT_CN = Path("C:/Windows/Fonts/msyh.ttc")
# filter 里 Windows 路径的冒号要转义，且不能加引号，否则解析器会在冒号处断句
FONT_ARG = "'C\\:/Windows/Fonts/msyh.ttc'"
SITE = "dabaoagent.github.io/Auto-Video"


def sample_index() -> dict:
    data = read_json(SAMPLES)
    items = data.get("items") or data.get("samples") or []
    return {it["key"]: it for it in items if it.get("key")}


def catalog_names() -> dict:
    """samples.json 的 style 有缺项（如 huazi），中文名以 catalog 为准。"""
    data = read_json(REPO / "catalog" / "pipelines.json")
    items = data.get("pipelines") if isinstance(data, dict) else data
    return {p["id"]: p.get("name_zh") or p["id"] for p in items}


def pick_start(it: dict, shot: float) -> float:
    """取海报秒数前 1 s 起，避开片头空镜，又不越过片尾。"""
    dur = float(it.get("seconds") or it.get("clip_seconds") or 10.0)
    raw = (it.get("poster_pick") or {}).get("seconds")
    pick = float(raw) if isinstance(raw, (int, float)) else dur / 2
    return max(0.0, min(pick - 1.0, dur - shot))


def esc_text(s: str) -> str:
    """drawtext 的文本转义：冒号、反斜杠、单引号、百分号。"""
    return s.replace("\\", r"\\\\").replace(":", r"\:").replace("'", r"\'").replace("%", r"\%")


def label_filters(it: dict, idx: int, name_zh: str, total: int, w: int, h: int,
                  shot: float, xfade: float) -> str:
    """角标按画布宽度等比缩放：1440 宽时名字 44px、id 22px，960 宽时自动降到 29/15。

    角标只在「溶解结束 → 下一段溶解开始」之间出现（enable 窗口），
    否则两段交叉溶解时两张角的标签会叠在一起，糊成一团。
    """
    name = esc_text(name_zh)
    slug = esc_text(it["key"])
    fs = max(18, round(w * 0.0305))
    sub = max(11, round(w * 0.0153))
    pad = max(6, round(w * 0.0084))
    x = round(w * 0.039)
    y_name = h - round(h * 0.156)
    y_id = h - round(h * 0.082)
    mark = max(14, round(w * 0.0139))
    on = xfade + 0.02
    off = shot - xfade - 0.04
    win = f":enable='between(t,{on:.2f},{off:.2f})'" if (xfade >= 0.05 and off - on > 0.25) else ""
    common = (
        f"fontfile={FONT_ARG}:"
        f"box=1:boxcolor=black@0.55:boxborderw={pad}:"
        f"alpha=0.96{win}"
    )
    return (
        f",drawtext=fontfile={FONT_ARG}:text='AUTO-VIDEO':fontsize={mark}:fontcolor=white@0.55:"
        f"x={x}:y={round(h * 0.059)}{win}"
        f",drawtext=fontfile={FONT_ARG}:text='{idx + 1:02d}/{total:02d}':fontsize={mark}:"
        f"fontcolor=white@0.55:x=w-text_w-{x}:y={round(h * 0.059)}{win}"
        f",drawtext={common}:text='{name}':fontsize={fs}:fontcolor=white:x={x}:y={y_name}"
        f",drawtext={common}:text='{slug}':fontsize={sub}:fontcolor=white@0.68:x={x}:y={y_id}"
    )


def shot_chain(it: dict, idx: int, w: int, h: int, shot: float, start: float,
               name_zh: str, total: int, xfade: float) -> str:
    """缩到画布里，不等于画幅的部分用深色底补齐。

    早前用「同帧放大 + gblur」做底，GIF 只有 32–48 色时那块模糊渐变会出严重色带，
    改成纯色 pad：竖屏那张（综艺花字）两侧干净的深底，反而更像样片集。
    """
    fit = (
        f"scale={w}:{h}:force_original_aspect_ratio=decrease:flags=lanczos,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=0x101014"
    )
    return (
        f"[{idx}:v]trim=start={start:.3f}:duration={shot:.3f},setpts=PTS-STARTPTS,"
        f"fps=30,format=yuv420p,{fit},setsar=1"
        f"{label_filters(it, idx, name_zh, total, w, h, shot, xfade)}[v{idx}]"
    )


def end_card(idx: int, w: int, h: int, seconds: float) -> tuple[str, list[str]]:
    big = max(30, round(w * 0.0597))
    small = max(14, round(w * 0.0236))
    gap = round(w * 0.032)
    bg = (
        f"color=c=0x0d0d11:s={w}x{h}:d={seconds}:r=30,format=yuv420p,setsar=1,"
        f"drawtext=fontfile={FONT_ARG}:text='166 条画法管线':fontsize={big}:"
        f"fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-{gap},"
        f"drawtext=fontfile={FONT_ARG}:text='全部样片与逐条状态 · {SITE}':fontsize={small}:"
        f"fontcolor=white@0.72:x=(w-text_w)/2:y=(h-text_h)/2+{gap}[v{idx}]"
    )
    return bg, []


def total_len(ids: list[str], shot: float, tail: float) -> float:
    return len(ids) * shot + tail


def build_filter(ids: list[str], index: dict, names: dict, shot: float, xfade: float,
                 w: int, h: int, tail: float) -> tuple[str, list, float]:
    parts: list[str] = []
    inputs: list[str] = []
    for i, pid in enumerate(ids):
        it = index[pid]
        start = pick_start(it, shot)
        inputs += ["-i", str(MEDIA / f"{pid}.mp4")]
        parts.append(shot_chain(it, i, w, h, shot, start, names.get(pid, pid), len(ids), xfade))
        # 裁切只在滤镜里做（整段喂进来再 trim），避免 -ss 与 trim 叠加错位
    eidx = len(ids)
    inputs += ["-f", "lavfi", "-i",
               f"color=c=0x0d0d11:s={w}x{h}:d={tail}:r=30"]
    bg, _ = end_card(eidx, w, h, tail)
    parts.append(bg)

    step = shot - xfade
    if xfade < 0.05:
        # 硬切：21 次风格换场本来就够强，不加溶解，标签也不会两段打架
        labels = [f"[v{i}]" for i in range(len(ids) + 1)]
        parts.append(f"{''.join(labels)}concat=n={len(ids) + 1}:v=1:a=0[x{len(ids)}]")
        return ";".join(parts), inputs, total_len(ids, shot, tail)

    cur = "v0"
    total = shot
    for i in range(1, len(ids) + 1):
        off = i * step
        nxt = f"x{i}"
        parts.append(f"[{cur}][v{i}]xfade=transition=fade:duration={xfade}:offset={off:.3f}[{nxt}]")
        cur = nxt
        total = off + shot
    return ";".join(parts), inputs, total


def run(cmd: list[str], dry: bool) -> None:
    if dry:
        print(" ".join(f'"{c}"' if " " in c else c for c in cmd))
        return
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0:
        print((proc.stderr or "").strip()[-4000:], file=sys.stderr)
        raise SystemExit(f"✗ ffmpeg 返回 {proc.returncode}")


def human(p: Path) -> str:
    n = p.stat().st_size
    return f"{p.name}  {n/1e6:.2f} MB"


def main() -> int:
    utf8_stdout()
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", default=",".join(DEFAULT_IDS))
    ap.add_argument("--shot", type=float, default=2.0, help="每段长（秒）")
    ap.add_argument("--xfade", type=float, default=0.0, help="段间溶解（秒），默认硬切")
    ap.add_argument("--size", default="1440x810")
    ap.add_argument("--crf", type=int, default=23)
    ap.add_argument("--tail", type=float, default=2.6, help="片尾卡片长（秒）")
    ap.add_argument("--out", default="site/media/showreel.mp4")
    ap.add_argument("--gif", default="site/media/teaser.gif")
    ap.add_argument("--gif-width", type=int, default=600)
    ap.add_argument("--gif-fps", type=float, default=8)
    ap.add_argument("--gif-colors", type=int, default=48)
    ap.add_argument("--gif-shot", type=float, default=1.2, help="GIF 版每段长（秒），切得比 mp4 快")
    ap.add_argument("--gif-tail", type=float, default=1.6, help="GIF 版片尾卡片长（秒）")
    ap.add_argument("--gif-size", default="960x540", help="GIF 母版画布")
    ap.add_argument("--mp4-only", action="store_true")
    ap.add_argument("--gif-only", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    ids = [s.strip() for s in a.ids.split(",") if s.strip()]
    index = sample_index()
    missing = [i for i in ids if i not in index or not (MEDIA / f"{i}.mp4").exists()]
    if missing:
        print(f"✗ 缺样片：{', '.join(missing)}")
        return 2

    w, h = (int(x) for x in a.size.split("x"))
    if w % 2 or h % 2:
        # yuv420p 要求偶数边长，奇数直接让 x264 报 -22
        sys.exit(f"✗ 画布边长必须是偶数：{w}x{h}")
    graph, inputs, total = build_filter(ids, index, catalog_names(), a.shot, a.xfade, w, h, a.tail)
    out = REPO / a.out
    out.parent.mkdir(parents=True, exist_ok=True)

    if not a.gif_only:
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs,
             "-filter_complex", graph, "-map", f"[x{len(ids)}]",
             "-c:v", "libx264", "-preset", "slow", "-crf", str(a.crf),
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(out)], a.dry_run)
        print(f"✓ {out.name}  {w}×{h} / 30fps / {total:.2f}s  " +
              ("" if a.dry_run else human(out)))

    if not a.mp4_only:
        # GIF 单独出一版快剪母版：1.2 s 一段、无音轨，标签按画布等比放大，
        # 缩到 640 宽后仍能看清中文名；直接拿 36 s 的 showreel 压会到 7 MB+。
        gw, gh = (int(x) for x in a.gif_size.split("x"))
        ggraph, ginputs, gtotal = build_filter(ids, index, catalog_names(),
                                              a.gif_shot, min(a.gif_shot / 2, a.xfade),
                                              gw, gh, a.gif_tail)
        master = REPO / "review" / "_gif_master.mp4"
        master.parent.mkdir(parents=True, exist_ok=True)
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *ginputs,
             "-filter_complex", ggraph, "-map", f"[x{len(ids)}]",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20",
             "-pix_fmt", "yuv420p", "-an", str(master)], a.dry_run)

        gif = REPO / a.gif
        gif.parent.mkdir(parents=True, exist_ok=True)
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(master),
             "-vf", (f"fps={a.gif_fps},scale={a.gif_width}:-1:flags=lanczos,"
                     f"split[a][b];[a]palettegen=max_colors={a.gif_colors}:stats_mode=diff[p];"
                     f"[b][p]paletteuse=dither=none:diff_mode=rectangle"),
             "-loop", "0", str(gif)], a.dry_run)
        print(f"✓ {gif.name}  {a.gif_width}px / {a.gif_fps}fps / {a.gif_colors} 色 / {gtotal:.2f}s  " +
              ("" if a.dry_run else human(gif)))
        if master.exists() and not a.dry_run:
            master.unlink()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
