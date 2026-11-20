#!/usr/bin/env python3
"""Auto-Video · huazi（综艺花字 / Variety Show Captions）

自包含入口：只调本管线的 runtime/render.py，再往下一层是 runtime/scene.js 与 runtime/lib。
不引用任何外部仓库。

    python pipelines/huazi/scripts/huazi.py --stills 0.5,2.5 --out review/huazi
    python pipelines/huazi/scripts/huazi.py --out out/huazi_试片.mp4 --seconds 6
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUNTIME = HERE.parent / "runtime" / "render.py"
SCENE = "huazi"
DEFAULT_SECONDS = 7
DEFAULT_FPS = 24


def ensure_playwright() -> None:
    try:
        import playwright  # noqa: F401
        return
    except ImportError:
        pass
    if shutil.which("uv"):
        os.execvpe("uv", ["uv", "run", "--with", "playwright", "python", __file__, *sys.argv[1:]], os.environ)
    sys.exit("需要 playwright：uv run --with playwright python pipelines/huazi/scripts/huazi.py ...")


def main() -> int:
    p = argparse.ArgumentParser(description="综艺花字（Variety Show Captions）")
    p.add_argument("--out", required=True, help="成片路径，或抽帧目录（与 --stills 同用）")
    p.add_argument("--seconds", type=float, default=DEFAULT_SECONDS)
    p.add_argument("--stills", default="")
    p.add_argument("--fps", type=int, default=DEFAULT_FPS)
    p.add_argument("--crf", type=int, default=18)
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    a = p.parse_args()

    ensure_playwright()
    cmd = [sys.executable, str(RUNTIME), "--scene", SCENE, "--out", a.out,
           "--seconds", str(a.seconds), "--fps", str(a.fps), "--crf", str(a.crf),
           "--width", str(a.width), "--height", str(a.height)]
    if a.stills:
        cmd += ["--stills", a.stills]
    print(" ".join(cmd))
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
