#!/usr/bin/env python3
"""把四条 mg 管线重排成自渲的 10 秒样片，替换演示站上暂用的上游片子。

每条都按自己风格的强项重排了题材（不是把上游画面换个色）：
pintie 纸上城、yetai 墨入奶、xingbian 一条线、huazi 深夜一碗面。
母版由本仓库 runtime 出 1920×1080（huazi 1080×1920），再压站点规格并各配一首底乐。

    python tools/mg_styles_selfsamples.py
    python tools/mg_styles_selfsamples.py --only yetai
    python tools/mg_styles_selfsamples.py --skip-render
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MEDIA = REPO / "site" / "media"
TMP = REPO / "review" / "mg_selfsamples"
BGM_ROOT = Path(r"D:\@kaifa\@\BGM")
SHOT = 10.0

PLAN = {
    "pintie": {
        "title": "拼贴剪贴 · 旧报纸上的纸上城",
        "size": (1024, 576), "poster": 9.1,
        "bgm": r"搞笑\搞笑 Funny Quirky Comedy (Free Download Background Music).mp3",
        "music_at": 46,
    },
    "yetai": {
        "title": "液态流动 · 墨落进牛奶里",
        "size": (1024, 576), "poster": 7.9,
        "bgm": r"未解\未解 Spacetime_Blues.mp3",
        "music_at": 58,
    },
    "xingbian": {
        "title": "形变动画 · 一条线的旅行",
        "size": (1024, 576), "poster": 9.4,
        "bgm": r"宇宙\宇宙 Magnetic_Lullaby.mp3",
        "music_at": 40,
    },
    "huazi": {
        "title": "综艺花字 · 深夜一碗面",
        "size": (576, 1024), "poster": 5.6,
        "bgm": r"搞笑\搞笑-节日 Playful & Quirky Music (royalty free background music) - Halloween.mp3",
        "music_at": 18,
    },
}
LOUDNORM = "loudnorm=I=-23:TP=-2:LRA=11"


def run(cmd: list) -> None:
    r = subprocess.run([str(c) for c in cmd])
    if r.returncode != 0:
        raise SystemExit("命令失败：" + " ".join(str(c) for c in cmd[:4]))


def py_cmd() -> list:
    try:
        import playwright  # noqa: F401
        return [sys.executable]
    except ImportError:
        if shutil.which("uv"):
            return ["uv", "run", "--with", "playwright", "python"]
        raise SystemExit("需要 playwright")


def render_master(pid: str) -> Path:
    TMP.mkdir(parents=True, exist_ok=True)
    out = TMP / f"{pid}_master.mp4"
    w, h = PLAN[pid]["size"]
    mw, mh = (1920, 1080) if h < w else (1080, 1920)
    run([*py_cmd(), REPO / "pipelines" / pid / "runtime" / "render.py",
         "--scene", pid, "--out", out, "--seconds", str(SHOT), "--fps", "24",
         "--crf", "18", "--width", str(mw), "--height", str(mh)])
    return out


def pack(master: Path, pid: str) -> None:
    plan = PLAN[pid]
    w, h = plan["size"]
    music = BGM_ROOT / plan["bgm"]
    out = MEDIA / f"{pid}.mp4"
    if music.exists():
        fc = (f"[0:v]scale={w}:{h}:flags=lanczos,setsar=1[v];"
              f"[1:a]{LOUDNORM},afade=t=in:st=0:d=0.9,afade=t=out:st=9.0:d=1.0[a]")
        run(["ffmpeg", "-y", "-v", "error", "-i", master,
             "-ss", str(plan["music_at"]), "-t", str(SHOT), "-i", music,
             "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
             "-t", str(SHOT), "-c:v", "libx264", "-preset", "slow", "-crf", "30",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k",
             "-movflags", "+faststart", out])
    else:
        print("  ! 缺曲子，只出静片：", plan["bgm"])
        run(["ffmpeg", "-y", "-v", "error", "-i", master,
             "-vf", f"scale={w}:{h}:flags=lanczos,setsar=1", "-t", str(SHOT),
             "-c:v", "libx264", "-preset", "slow", "-crf", "30",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", out])

    poster = MEDIA / f"{pid}.jpg"
    run(["ffmpeg", "-y", "-v", "error", "-ss", f"{plan['poster']:.2f}", "-i", master,
         "-frames:v", "1", "-vf", f"scale={w}:{h}:flags=lanczos", "-q:v", "4", poster])
    print("  ->", out.relative_to(REPO), poster.relative_to(REPO))


def write_samples(ids: list) -> None:
    sp_path = REPO / "site" / "assets" / "samples.json"
    sp = json.loads(sp_path.read_text(encoding="utf-8"))
    by_key = {it.get("key"): it for it in sp["items"]}
    for pid in ids:
        plan = PLAN[pid]
        w, h = plan["size"]
        entry = by_key.get(pid, {"key": pid, "kind": "pipeline", "pipeline": pid})
        entry.update({
            "title": plan["title"],
            "badge": "10 秒样片 · 自渲",
            "long_edge": max(w, h),
            "max_seconds": SHOT,
            "crf": 30,
            "seconds": SHOT,
            "duration": "0:10",
            "width": w,
            "height": h,
            "aspect": "9:16" if h > w else "16:9",
            "clip_seconds": SHOT,
            "poster_pick": {"by": "fixed", "note": f"取 {plan['poster']:.1f} 秒处", "seconds": plan["poster"]},
            "mp4": f"media/{pid}.mp4",
            "poster": f"media/{pid}.jpg",
            "source": "Auto-Video 本地 runtime 自渲（10 s，题材与画法均为本仓库重写）",
            "music": Path(plan["bgm"]).stem,
            "note": "本仓库自渲 10 秒样片",
        })
        by_key[pid] = entry
    sp_path.write_text(json.dumps(sp, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("samples.json 更新：", ", ".join(ids))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--skip-render", action="store_true")
    a = ap.parse_args()
    ids = [p for p in PLAN if not a.only or p == a.only]

    MEDIA.mkdir(parents=True, exist_ok=True)
    for pid in ids:
        print(f"[{pid}] {PLAN[pid]['title']}")
        master = TMP / f"{pid}_master.mp4"
        if not a.skip_render:
            master = render_master(pid)
        pack(master, pid)
    write_samples(ids)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
