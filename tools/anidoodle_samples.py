#!/usr/bin/env python3
"""给 6 条 anidoodle 画法管线出自渲的 10 秒样片，替换演示站上的上游封面。

做法：本管线 runtime/render.py 出 1920x1080 母版（--retime 把 6–8 秒的画法拉长到 10 秒），
再压成站点规格 1024x576 / crf 30 / 10.000 秒，配一段很轻的氛围底乐，取一帧做封面。

    python tools/anidoodle_samples.py                 # 全部重出
    python tools/anidoodle_samples.py --only tanbi     # 只出一条
    python tools/anidoodle_samples.py --skip-render    # 只更新 samples.json（片子已在）
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MEDIA = REPO / "site" / "media"
TMP = REPO / "review" / "anidoodle_samples"
BGM_ROOT = Path(r"D:\@kaifa\@\BGM")
BGM_CANDIDATES = [
    BGM_ROOT / "宇宙" / "宇宙-氛围 Royalty Free Ambient Space Music (promo video) For Documentary & Film by Simon Wilkinson.mp3",
    Path(r"D:\@kaifa\@\@风格动画BGM\宇宙-氛围 Royalty Free Ambient Space Music (promo video) For Documentary & Film by Simon Wilkinson.mp3"),
]
BGM_VOLUME = "-24dB"
BGM_LOUDNORM = "loudnorm=I=-23:TP=-2:LRA=11"

# id: 画法内容长度 → retime；封面取哪一秒；标题
PLAN = {
    "tanbi":    {"content": 8.0, "poster": 7.0, "title": "炭笔擦画 · 坡上一棵枯树",
                 "bgm": r"自然\自然-静谧 Invisible_Beauty.mp3", "music_at": 26},
    "youcai":   {"content": 7.0, "poster": 7.6, "title": "梦境釉彩 · 陶罐与梨",
                 "bgm": r"人文\人文-情感 Documentary Cinematic (Inspiring Emotional Ambient Background)No Copyright Background Music.mp3", "music_at": 24},
    "cixiu":    {"content": 6.0, "poster": 9.4, "title": "刺绣 · 绣绷里的花枝",
                 "bgm": r"自然\自然 Liquid_Time.mp3", "music_at": 34},
    "minjian":  {"content": 7.0, "poster": 7.5, "title": "民间故事绘本 · 坡路上的狐狸",
                 "bgm": r"乡村\乡村 Juneberry_Junction.mp3", "music_at": 10},
    "diduo":    {"content": 6.0, "poster": 7.0, "title": "低多边形 · 湖与落日",
                 "bgm": r"宇宙\宇宙-氛围 Space Cinematic Ambient Music For Videos ｜ Free Download.mp3", "music_at": 18},
    "yuanzhu":  {"content": 7.0, "poster": 7.0, "title": "圆珠笔 · 一块怀表",
                 "bgm": r"悬疑\悬疑 BGM_ambient.mp3", "music_at": 8},
}
SHOT_SECONDS = 10.0


def run(cmd: list[str]) -> None:
    print(" ".join(str(c) for c in cmd[:3]), "...", flush=True)
    r = subprocess.run([str(c) for c in cmd])
    if r.returncode != 0:
        raise SystemExit(f"命令失败：{cmd[0]}")


def bgm(pid: str = "") -> Path | None:
    rel = PLAN.get(pid, {}).get("bgm")
    if rel:
        p = BGM_ROOT / rel
        if p.exists():
            return p
        print(f"  ! 定点曲子缺失，回退：{rel}", flush=True)
    for p in BGM_CANDIDATES:
        if p.exists():
            return p
    return None


def py_cmd() -> list[str]:
    """有 playwright 就直接用当前解释器，没有就借 uv 带一次依赖跑。"""
    try:
        import playwright  # noqa: F401
        return [sys.executable]
    except ImportError:
        import shutil
        if shutil.which("uv"):
            return ["uv", "run", "--with", "playwright", "python"]
        raise SystemExit("需要 playwright：uv run --with playwright python tools/anidoodle_samples.py")


def render_master(pid: str, content: float) -> Path:
    TMP.mkdir(parents=True, exist_ok=True)
    master = TMP / f"{pid}_master.mp4"
    run([*py_cmd(), REPO / "pipelines" / pid / "runtime" / "render.py",
         "--scene", pid, "--out", master,
         "--seconds", str(SHOT_SECONDS), "--fps", "24",
         "--crf", "18", "--width", "1920", "--height", "1080",
         "--retime", f"{content / SHOT_SECONDS:.3f}"])
    return master


def pack(master: Path, pid: str, at: float) -> None:
    MEDIA.mkdir(parents=True, exist_ok=True)
    out = MEDIA / f"{pid}.mp4"
    music = bgm(pid)
    at_music = float(PLAN[pid].get("music_at", 0))
    if music:
        fc = (f"[0:v]scale=1024:576:flags=lanczos,setsar=1[v];"
              f"[1:a]{BGM_LOUDNORM},afade=t=in:st=0:d=0.9,afade=t=out:st=9.0:d=1.0[a]")
        run(["ffmpeg", "-y", "-v", "error", "-i", master,
             "-ss", f"{at_music:.2f}", "-t", str(SHOT_SECONDS), "-i", music,
             "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
             "-t", str(SHOT_SECONDS), "-c:v", "libx264", "-preset", "slow", "-crf", "30",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k",
             "-movflags", "+faststart", out])
    else:
        run(["ffmpeg", "-y", "-v", "error", "-i", master,
             "-vf", "scale=1024:576:flags=lanczos,setsar=1",
             "-t", str(SHOT_SECONDS), "-c:v", "libx264", "-preset", "slow", "-crf", "30",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", out])
    poster = MEDIA / f"{pid}.jpg"
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{at:.2f}", "-i", master,
         "-frames:v", "1", "-vf", "scale=1024:576:flags=lanczos", "-q:v", "4", poster])
    print("  ->", out.relative_to(REPO), poster.relative_to(REPO), flush=True)


def write_samples(names: dict[str, str]) -> None:
    sp_path = REPO / "site" / "assets" / "samples.json"
    sp = json.loads(sp_path.read_text(encoding="utf-8"))
    by_key = {it.get("key"): it for it in sp["items"]}
    for pid, plan in PLAN.items():
        entry = by_key.get(pid, {"key": pid, "kind": "pipeline", "pipeline": pid})
        entry.update({
            "title": plan["title"],
            "station": entry.get("station") or "",
            "badge": "10 秒样片 · 自渲",
            "long_edge": 1024,
            "max_seconds": SHOT_SECONDS,
            "crf": 30,
            "seconds": SHOT_SECONDS,
            "duration": "0:10",
            "width": 1024,
            "height": 576,
            "aspect": "16:9",
            "clip_seconds": SHOT_SECONDS,
            "poster_pick": {"by": "fixed", "note": f"取 {plan['poster']:.1f} 秒处", "seconds": plan["poster"]},
            "mp4": f"media/{pid}.mp4",
            "poster": f"media/{pid}.jpg",
            "source": f"Auto-Video 本地 runtime 自渲（内容 {plan['content']:.0f}s 拉伸到 10s）",
            "music": Path(plan["bgm"]).stem if plan.get("bgm") else "",
            "note": "本仓库自渲 10 秒样片",
        })
        if pid not in by_key:
            sp["items"].append(entry)
            by_key[pid] = entry
    sp_path.write_text(json.dumps(sp, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("samples.json 更新：", ", ".join(PLAN))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--skip-render", action="store_true")
    a = ap.parse_args()

    ids = [x for x in PLAN if not a.only or x == a.only]
    names = {pid: PLAN[pid]["title"] for pid in ids}
    for pid in ids:
        plan = PLAN[pid]
        print(f"[{pid}] content {plan['content']}s -> {SHOT_SECONDS}s, poster @ {plan['poster']}s")
        if a.skip_render:
            master = TMP / f"{pid}_master.mp4"
        else:
            master = render_master(pid, plan["content"])
        pack(master, pid, plan["poster"])

    write_samples(names)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
