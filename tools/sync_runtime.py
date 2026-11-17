#!/usr/bin/env python3
"""把 BB-Video 共享运行时从单一源同步到各管线。

背景：10 条 BB-Video 派生管线（pencil / isometric / manga / tapestry / shadow /
parable / goldenage / blueprint / laolang / map）各自带一份 runtime/，其中
core.js、promo.js、render.mjs、music.mjs、sound.mjs、bgm.mjs、lang.mjs、net.mjs、
scores/ 这些文件逐字节相同。以前改一个 bug 要在 10 个目录里改 10 次，漏一处就
出现「这条管线修好了、那条没好」的幽灵问题。

现在唯一的源是 vendor/bb-video/runtime/。管线自己的画法文件（pencil.js、manga.js、
shadow.js、rods.js、map.js、toon.js、cel.js、act.js、cast-lite.js …）不在同步范围内，
各管线自己维护。

用法：
    python tools/sync_runtime.py           # 把 vendor 里的共享文件覆盖到各管线
    python tools/sync_runtime.py --check   # 只检查有没有漂移，有就退出码 1（CI 用）
    python tools/sync_runtime.py --list    # 看哪些目录会被同步

改了共享运行时之后的标准流程：
    1. 只改 vendor/bb-video/runtime/<file>
    2. python tools/sync_runtime.py
    3. 抽一条管线渲一版样片（或跑 tools/render_smoke.py）确认没坏
"""
from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "vendor" / "bb-video" / "runtime"

# 共享文件 / 目录的清单（新增共享文件时加到这里）
SHARED = [
    "core.js",
    "promo.js",
    "render.mjs",
    "music.mjs",
    "sound.mjs",
    "bgm.mjs",
    "lang.mjs",
    "net.mjs",
    "autoscene.js",
    "LICENSE.BB-Video",
    "scores",
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def targets() -> list[Path]:
    """带 runtime/ 且有 pipeline.json 的管线目录。"""
    out = []
    for child in sorted(ROOT.iterdir()):
        if not child.is_dir():
            continue
        if (child / "pipeline.json").is_file() and (child / "runtime").is_dir():
            out.append(child)
    return out


def pairs():
    """(源文件, 目标文件) 的完整清单。"""
    for name in SHARED:
        src = SRC / name
        if not src.exists():
            raise SystemExit(f"单一源缺文件：{src}（先把它放进 vendor/bb-video/runtime/）")
        if src.is_dir():
            for f in sorted(src.rglob("*")):
                if f.is_file():
                    yield f, f.relative_to(SRC)
        else:
            yield src, Path(name)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只检查漂移，不写盘")
    ap.add_argument("--list", action="store_true", help="只列出会同步的管线")
    args = ap.parse_args()

    pipes = targets()
    if args.list:
        print(f"单一源：{SRC.relative_to(ROOT)}")
        print(f"同步到 {len(pipes)} 条管线：")
        for p in pipes:
            print(f"  - {p.name}")
        return 0

    drift: list[str] = []
    copied = 0
    for pipe in pipes:
        for src, rel in pairs():
            dst = pipe / "runtime" / rel
            if not dst.exists():
                drift.append(f"{pipe.name}/runtime/{rel} 缺失")
            elif sha(dst) != sha(src):
                drift.append(f"{pipe.name}/runtime/{rel} 与单一源不一致")
            else:
                continue
            if not args.check:
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dst)
                copied += 1

    if args.check:
        if drift:
            print("✗ 共享运行时漂移（单一源是 vendor/bb-video/runtime/）：")
            for d in drift:
                print("  - " + d)
            print("  修：python tools/sync_runtime.py")
            return 1
        print(f"OK 共享运行时一致（{len(pipes)} 条管线）")
        return 0

    print(f"OK 同步完成：{copied} 个文件；{len(pipes)} 条管线" + (f"，{len(drift)} 处漂移已修" if drift else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
