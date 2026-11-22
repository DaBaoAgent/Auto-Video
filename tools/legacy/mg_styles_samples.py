#!/usr/bin/env python3
"""演示站样片：四条 mg-styles-15 管线先用上游官方成片顶着，压成站点规格。

上游 videos/<slug>.mp4 是 1920×1080（18-hanazi 是 1080×1920）/30fps/10.000s，
这里只做转码与取封面，不改画面内容；等本仓库 runtime 排完样片后，用
tools/mg_styles_samples.py --self 换成本仓库自渲的片子。

    python tools/mg_styles_samples.py
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
MEDIA = REPO / "site" / "media"
UP = REPO / "review" / "mg_up"

PLAN = {
    "pintie": {"slug": "06-collage", "poster": 5.2, "title": "拼贴剪贴 · 脑洞大开", "size": (1024, 576)},
    "yetai": {"slug": "07-liquid", "poster": 3.2, "title": "液态流动 · 一泼糖浆", "size": (1024, 576)},
    "xingbian": {"slug": "08-morph", "poster": 2.4, "title": "形变动画 · 圆到心", "size": (1024, 576)},
    "huazi": {"slug": "18-hanazi", "poster": 6.8, "title": "综艺花字 · 喵呜日记", "size": (576, 1024)},
}
SECONDS = 10.0


def run(cmd: list) -> None:
    r = subprocess.run([str(c) for c in cmd])
    if r.returncode != 0:
        raise SystemExit("命令失败：" + " ".join(str(c) for c in cmd[:4]))


def main() -> int:
    MEDIA.mkdir(parents=True, exist_ok=True)
    sp_path = REPO / "site" / "assets" / "samples.json"
    sp = json.loads(sp_path.read_text(encoding="utf-8"))
    by_key = {it.get("key"): it for it in sp["items"]}

    for pid, plan in PLAN.items():
        src = UP / f"{plan['slug']}.mp4"
        if not src.exists():
            raise SystemExit(f"缺上游样片：{src}")
        w, h = plan["size"]
        out = MEDIA / f"{pid}.mp4"
        run(["ffmpeg", "-y", "-v", "error", "-i", src,
             "-vf", f"scale={w}:{h}:flags=lanczos,setsar=1,fps=30",
             "-t", str(SECONDS), "-c:v", "libx264", "-preset", "slow", "-crf", "30",
             "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k",
             "-movflags", "+faststart", out])
        poster = MEDIA / f"{pid}.jpg"
        run(["ffmpeg", "-y", "-v", "error", "-ss", f"{plan['poster']:.2f}", "-i", src,
             "-frames:v", "1", "-vf", f"scale={w}:{h}:flags=lanczos", "-q:v", "4", poster])

        entry = by_key.get(pid, {"key": pid, "kind": "pipeline", "pipeline": pid})
        entry.update({
            "title": plan["title"],
            "badge": "10 秒样片 · 上游官方",
            "long_edge": max(w, h),
            "max_seconds": SECONDS,
            "crf": 30,
            "seconds": SECONDS,
            "duration": "0:10",
            "width": w,
            "height": h,
            "aspect": "9:16" if h > w else "16:9",
            "clip_seconds": SECONDS,
            "poster_pick": {"by": "fixed", "note": f"取 {plan['poster']:.1f} 秒处", "seconds": plan["poster"]},
            "mp4": f"media/{pid}.mp4",
            "poster": f"media/{pid}.jpg",
            "source": f"mg-styles-15 官方样片（{plan['slug']}，暂用；管线本地可重渲）",
            "music": "上游自带音轨",
            "note": "演示站暂用上游官方样片",
        })
        if pid not in by_key:
            sp["items"].append(entry)
            by_key[pid] = entry
        print("->", out.relative_to(REPO), poster.relative_to(REPO))

    sp_path.write_text(json.dumps(sp, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("samples.json 更新：", ", ".join(PLAN))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
