#!/usr/bin/env python3
"""Auto-Video 一键 demo：一条命令，出一段能看的片。

只依赖三样东西：Python 3、Node 18+、一个 Chrome/Chromium、ffmpeg。
不需要 TTS、不需要本地大模型、不需要 GPU，也不下载任何素材——分幕从模板的
TIMELINE 长出来（见 vendor/runtime/autoscene.js）。

用法：
    python demo/run.py                       # pencil 模板，15 秒，720p
    python demo/run.py --pipeline manga --seconds 10
    python demo/run.py --keep                # 保留中间工程目录

Docker（推荐，宿主什么都不用装）：
    docker compose run --rm demo
产物：demo/out/demo.mp4
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "demo" / "out"

# 能直接吃「模板 + 任意行数稿子」的管线
PIPELINES = {
    "pencil": "pencil/scripts/pencil.py",
    "manga": "manga/scripts/manga.py",
    "goldenage": "goldenage/scripts/goldenage.py",
    "shadow": "shadow/scripts/shadow.py",
    "tapestry": "tapestry/scripts/tapestry.py",
    "parable": "parable/scripts/parable.py",
    "blueprint": "blueprint/scripts/blueprint.py",
    "isometric": "isometric/scripts/isometric.py",
}

CHROME_CANDIDATES = [
    os.environ.get("CHROME_PATH", ""),
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]


def chrome() -> str:
    for c in CHROME_CANDIDATES:
        if c and Path(c).exists():
            return c
    sys.exit("找不到 Chrome/Chromium：装一个，或者设置 CHROME_PATH")


def run(cmd: list[str], env: dict) -> None:
    print("+ " + " ".join(str(c) for c in cmd), flush=True)
    rc = subprocess.run(cmd, env=env).returncode
    if rc != 0:
        sys.exit(f"命令失败（退出码 {rc}）")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pipeline", default="pencil", choices=sorted(PIPELINES))
    ap.add_argument("--seconds", type=float, default=15, help="出片时长（秒），默认 15")
    ap.add_argument("--scale", type=float, default=0.5, help="渲染分辨率比例，默认 0.5（960×540）")
    ap.add_argument("--keep", action="store_true", help="保留中间工程目录")
    args = ap.parse_args()

    which = args.pipeline
    if which not in PIPELINES:
        sys.exit(f"demo 还没接 {which}，可选：{', '.join(sorted(PIPELINES))}")
    entry = ROOT / PIPELINES[which]
    runtime = ROOT / which / "runtime" / "render.mjs"
    for f in (entry, runtime):
        if not f.exists():
            sys.exit(f"缺文件：{f}")

    env = dict(os.environ, CHROME_PATH=chrome())
    OUT.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="auto-video-demo-"))
    proj = work / "demo-proj"
    try:
        print(f"工程：{proj}")
        run([sys.executable, str(entry), "new", str(proj), "--title", "Auto-Video 一键演示"], env)
        run([
            "node", str(runtime), str(proj),
            "--scale", str(args.scale),
            "--no-audio",              # 演示不需要配音，也就绕开了 TTS 依赖
            "--to", str(args.seconds),
            "--allow-font-fallback",   # 容器里没装网页字体时用系统 CJK 字体兜底，不中断
        ], env)
        made = proj / "out" / "video-16x9.mp4"
        if not made.exists():
            cands = sorted((proj / "out").glob("*.mp4"))
            if not cands:
                sys.exit("渲染完成但没找到 mp4，检查上面的日志")
            made = cands[0]
        target = OUT / "demo.mp4"
        shutil.copy2(made, target)
        size = target.stat().st_size / 1048576
        print(f"\n✓ 完成：{target}（{size:.1f} MB）")
    finally:
        if args.keep:
            print(f"中间工程保留在：{proj}")
        else:
            shutil.rmtree(work, ignore_errors=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
