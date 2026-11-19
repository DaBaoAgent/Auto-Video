"""lemo-opuscar 风格的共享入口实现。

每条 `pipelines/<id>/scripts/<id>.py` 只有十来行，真正干活的是这里：

    python <entry> --check   # 体检：库在不在、demo 齐不齐、能不能跑
    python <entry> --plan    # 只打印要跑的步骤
    python <entry>           # 真跑上游 demo/build.sh

设计取舍：上游 demo 全程按 Linux 写死（`.venv/bin/python`、`sh`、`node core/render/*.mjs`），
本仓库不假装能在 Windows 原生跑通——Windows 上自动改走 WSL，并把路径翻成 /mnt/<盘>/…。
`--check` 永远说实话，缺什么就报什么，宁可不出片也不出一份假的“成功”。
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
DEFAULT_LEMO = Path("D:/@kaifa/lemo-opuscar")


def lemo_root() -> Path:
    return Path(os.environ.get("LEMO_LIB") or DEFAULT_LEMO)


def is_windows() -> bool:
    return os.name == "nt"


def have(cmd: str) -> bool:
    return shutil.which(cmd) is not None


def check(slug: str, lib: Path) -> list[tuple[bool, str]]:
    """返回 [(是否通过, 人话)]，不抛异常，让 --check 能一次把所有缺口说完。"""
    style = lib / "styles" / slug
    rows: list[tuple[bool, str]] = []

    rows.append((style.is_dir(), f"上游风格目录 {style}"))
    rows.append(((style / "demo" / "build.sh").exists(), f"上游 build.sh styles/{slug}/demo/build.sh"))
    rows.append(((style / "STYLE.md").exists(), f"风格不变量 styles/{slug}/STYLE.md"))
    done = style / f"{slug}.mp4"
    rows.append((True, f"上游成片 {done}：{'在' if done.exists() else '不在（本机没有，站点用网络样片）'}"))

    if is_windows():
        rows.append((have("wsl"), "wsl.exe（Windows 上靠它进 Linux）"))
        if have("wsl"):
            venv = lib / ".venv" / "bin" / "python"
            ok = venv.exists()
            rows.append((ok, f"上游 .venv（{venv}；WSL 里要能看见）"))
    else:
        rows.append((have("sh"), "sh"))
        venv = lib / ".venv" / "bin" / "python"
        rows.append((venv.exists(), f"上游 .venv（{venv}）"))

    rows.append((have("node"), "node（上游 core/render/*.mjs）"))
    rows.append((have("ffmpeg"), "ffmpeg（合片与混音）"))
    core = REPO / "piying" / "node_modules" / "playwright-core"
    rows.append((True, f"PLAYWRIGHT_CORE → {os.environ.get('PLAYWRIGHT_CORE') or core}"))
    return rows


def plan(slug: str) -> str:
    return (
        f"1. 进上游库根，跑 `sh styles/{slug}/demo/build.sh`\n"
        f"2. 上游那支脚本自己会做：字体子集 → 配音 → 逐行 ASR 校验 → 配乐 → 画面事件 →\n"
        f"   自检 → 混音（−14 LUFS）→ 字幕 → 逐帧渲染 → 合片 → 抽静帧与封面\n"
        f"3. 成片落在 styles/{slug}/{slug}.mp4，本入口不搬它进仓库\n"
        f"注：具体步骤以上游 styles/{slug}/demo/build.sh 的注释为准，本入口不复制它的逻辑。"
    )


def run(slug: str, lib: Path) -> int:
    core = REPO / "piying" / "node_modules" / "playwright-core"
    env = dict(os.environ)
    env.setdefault("PLAYWRIGHT_CORE", str(core))

    if is_windows():
        if not have("wsl"):
            print("这台 Windows 没有 wsl.exe：上游 demo 跑不了。先装 WSL，或在 Linux 机器上跑。",
              file=sys.stderr)
            return 2
        # D:\a\b → /mnt/d/a/b
        win = str(lib).replace("\\", "/")
        drive, rest = win[:2].lower(), win[2:]
        wsl_lib = f"/mnt/{drive[0]}{rest}"
        script = f"cd '{wsl_lib}' && sh styles/{slug}/demo/build.sh"
        cmd = ["wsl", "bash", "-lc", script]
    else:
        cmd = ["sh", f"styles/{slug}/demo/build.sh"]

    print("跑：" + " ".join(cmd))
    print(f"LEMO_LIB={lib}  PLAYWRIGHT_CORE={env['PLAYWRIGHT_CORE']}")
    return subprocess.call(cmd, cwd=None if is_windows() else str(lib), env=env)


def main(slug: str, argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog=slug, description=f"复现 lemo-opuscar styles/{slug} 的上游样片")
    ap.add_argument("--check", action="store_true", help="只体检")
    ap.add_argument("--plan", action="store_true", help="只打印步骤")
    ap.add_argument("--lemo", default=str(lemo_root()), help="lemo-opuscar 库位置")
    args = ap.parse_args(argv)

    lib = Path(args.lemo)
    rows = check(slug, lib)

    if args.check:
        bad = 0
        for ok, msg in rows:
            if not ok:
                bad += 1
            print(("OK   " if ok else "MISS ") + msg)
        print(f"\n{'可以跑' if bad == 0 else f'缺 {bad} 项，跑不了'}：{slug}")
        return 0 if bad == 0 else 1

    if args.plan:
        print(plan(slug))
        return 0

    must = [(ok, m) for ok, m in rows if not ok]
    if must:
        print("先修这些再跑：", file=sys.stderr)
        for _ok, m in must:
            print("  - " + m, file=sys.stderr)
        print("（--check 可以一次看全）", file=sys.stderr)
        return 2

    return run(slug, lib)
