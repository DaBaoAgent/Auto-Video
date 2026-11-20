#!/usr/bin/env python3
"""Auto-Video · jibuli（吉卜力水彩 / Ghibli Watercolor）

调用仓库内 vendor/huashu-art-motion/engine/render.py，只渲 25_ghibli 这一段。
上游用法是整片/片段，这里收成两个动作：抽帧（--stills）与出风格段（--seconds）。

    python pipelines/jibuli/scripts/jibuli.py --stills 0.5,2.5 --out review/jibuli
    python pipelines/jibuli/scripts/jibuli.py --out out/jibuli_试片.mp4 --seconds 6
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ENGINE = ROOT / "vendor" / "huashu-art-motion" / "engine" / "render.py"
SCENE = "25_ghibli"
FILM = "gallery"
DEFAULT_SECONDS = 6
DEFAULT_FPS = 24

WIN_CHROME = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Users\Administrator\AppData\Local\Google\Chrome\Application\chrome.exe",
]


def ensure_playwright() -> None:
    try:
        import playwright  # noqa: F401
        return
    except ImportError:
        pass
    if shutil.which("uv"):
        os.execvpe("uv", ["uv", "run", "--with", "playwright", "python", __file__, *sys.argv[1:]], os.environ)
    sys.exit("需要 playwright：uv run --with playwright python pipelines/jibuli/scripts/jibuli.py ...")


def find_chrome(env: dict) -> None:
    if env.get("CHROME_PATH") or env.get("CHROME_CHANNEL") or os.name != "nt":
        return
    for p in WIN_CHROME:
        if Path(p).exists():
            env["CHROME_PATH"] = p
            return


def main() -> int:
    p = argparse.ArgumentParser(description="吉卜力水彩（Ghibli Watercolor）")
    p.add_argument("--out", required=True, help="成片路径，或抽帧目录（与 --stills 同用）")
    p.add_argument("--seconds", type=float, default=DEFAULT_SECONDS, help="风格段长度，默认 %(default)s 秒")
    p.add_argument("--stills", default="", help="逗号分隔的秒数：只抽这几帧 PNG")
    p.add_argument("--fps", type=int, default=DEFAULT_FPS)
    p.add_argument("--crf", type=int, default=18)
    p.add_argument("--width", type=int, default=0)
    p.add_argument("--height", type=int, default=0)
    p.add_argument("--no-counter", action="store_true", help="不画年份角标")
    a = p.parse_args()

    ensure_playwright()
    env = dict(os.environ)
    find_chrome(env)

    cmd = [sys.executable, str(ENGINE), "--film", FILM, "--solo", SCENE, "--fps", str(a.fps), "--crf", str(a.crf)]
    if a.stills:
        cmd += ["--stills", a.stills]
    else:
        cmd += ["--from", "0", "--to", str(a.seconds)]
    if a.width and a.height:
        cmd += ["--width", str(a.width), "--height", str(a.height)]
    if a.no_counter:
        cmd.append("--no-counter")
    cmd += ["--out", a.out]
    print(" ".join(cmd))
    return subprocess.call(cmd, env=env)


if __name__ == "__main__":
    raise SystemExit(main())
