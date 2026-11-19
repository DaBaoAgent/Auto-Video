"""BB-Video 风格的上游复现入口。

Auto-Video 只登记，不搬 BB-Video 的渲染代码：这里负责体检、打印步骤、
调用上游 `promo/scripts/new.mjs` 建工程，再用 `promo/scripts/render.mjs` 出片。

上游库默认 `D:/@kaifa/BB-Video`（可用 `BB_VIDEO_DIR` 或 `--bb` 覆盖）。
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

DEFAULT_BB = Path("D:/@kaifa/BB-Video")


def chrome_env(env: dict) -> dict:
    """上游只认 CHROME_PATH；本仓库已有统一探测，直接复用。"""
    if env.get("CHROME_PATH"):
        return env
    try:
        from platform_paths import chrome_path  # 与本文件同目录
        cp = chrome_path()
        if cp:
            env["CHROME_PATH"] = cp
    except Exception:
        pass
    return env


def bb_root(arg: str | None) -> Path:
    raw = arg or os.environ.get("BB_VIDEO_DIR") or str(DEFAULT_BB)
    return Path(raw).expanduser().resolve()


def skill_dir(root: Path) -> Path:
    return root / "skills" / "bb-video"


def check(root: Path, slug: str) -> list[str]:
    problems = []
    if not root.is_dir():
        problems.append(f"找不到 BB-Video：{root}（用 --bb 或 BB_VIDEO_DIR 指过去）")
        return problems
    sd = skill_dir(root)
    if not (sd / "promo" / "scripts" / "new.mjs").exists():
        problems.append(f"上游缺 promo/scripts/new.mjs：{sd}")
    if not (sd / "styles" / slug / "STYLE.md").exists():
        problems.append(f"上游没有风格 {slug}：{sd / 'styles' / slug}")
    if not shutil.which("node"):
        problems.append("PATH 里没有 node（要 18+）")
    if not shutil.which("ffmpeg"):
        problems.append("PATH 里没有 ffmpeg")
    if not shutil.which("ffprobe"):
        problems.append("PATH 里没有 ffprobe")
    return problems


def plan(root: Path, slug: str, out: Path, quick: bool) -> list[list[str]]:
    new = ["node", "promo/scripts/new.mjs", str(out), "--style", slug]
    if out.exists() and any(out.iterdir()):
        # 上游 new.mjs 拒绝覆盖非空目录；已有工程只刷新 lib
        new = ["node", "promo/scripts/new.mjs", str(out), "--update-lib"]
    if quick:
        new.append("--quick")
    render = ["node", "promo/scripts/render.mjs", str(out)]
    return [new, render]


def main(slug: str) -> int:
    ap = argparse.ArgumentParser(description=f"复现 BB-Video 风格 {slug} 的上游样片")
    ap.add_argument("--bb", default=None, help="BB-Video 仓库位置")
    ap.add_argument("--out", default=None, help="工程输出目录（默认 out/bb-<slug>）")
    ap.add_argument("--quick", action="store_true", help="上游快速版（少写一点画面）")
    ap.add_argument("--check", action="store_true", help="只体检，不出片")
    ap.add_argument("--plan", action="store_true", help="只打印步骤，不执行")
    args = ap.parse_args()

    root = bb_root(args.bb)
    problems = check(root, slug)
    if problems:
        print("体检不过：")
        for p in problems:
            print("  - " + p)
        return 1
    if args.check:
        print(f"OK：{root} / styles/{slug}")
        return 0

    out = Path(args.out or f"out/bb-{slug}").resolve()
    steps = plan(root, slug, out, args.quick)
    print(f"BB-Video: {root}")
    print(f"工程目录: {out}")
    for s in steps:
        print("  + " + " ".join(s))
    if args.plan:
        return 0

    sd = skill_dir(root)
    env = chrome_env(dict(os.environ))
    for cmd in steps:
        print("+", " ".join(cmd))
        rc = subprocess.run(cmd, cwd=sd, env=env).returncode
        if rc != 0:
            print(f"上游命令失败（退出码 {rc}）")
            return rc
    print("完成。成片在上游工程的 out/ 下（见上游 GUIDE 的交付说明）。")
    return 0
