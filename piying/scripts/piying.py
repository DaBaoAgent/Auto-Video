"""piying 单一入口：把 render/piying 下那串 node 脚本收成一个命令。

原来要记 6 个 node 调用顺序，现在只有：

    python scripts/piying.py sample        10 秒样片链路（gen → qc → capture → sfx）
    python scripts/piying.py full          全片链路（gen → qc → audit → capture → sfx → gate）
    python scripts/piying.py gate          只跑交付门禁
    python scripts/piying.py plan full     只打印将要执行的命令，不真跑
    python scripts/piying.py check         检查 node / ffmpeg / 渲染目录是否就位

其余阶段（qc / audit / capture / sfx / gen）也可以单独点名。参数一律透传：
    python scripts/piying.py capture -- --frames 0-120
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

PIPE = Path(__file__).resolve().parents[1]
RENDER = PIPE / "render" / "piying"

# 阶段 → [(说明, node 脚本, 额外参数)]
SAMPLE = [
    ("生成分镜与页面", "gen_sample_yandi.js", []),
    ("渲染前自检", "qc_yandi.js", []),
    ("逐帧捕获", "capture_yandi.js", []),
    ("音效与 BGM", "make_sfx_yandi.js", []),
]
FULL = [
    ("生成分镜与页面", "gen_full_yandi.js", []),
    ("渲染前自检", "qc_full_yandi.js", []),
    ("密度与文字审计", "audit_yandi.js", ["full"]),
    ("逐帧捕获", "capture_full_yandi.js", []),
    ("音效与 BGM", "make_sfx_full_yandi.js", []),
    ("交付门禁", "delivery_gate_yandi.js", []),
]

STAGES = {
    "gen": [FULL[0]],
    "qc": [FULL[1]],
    "audit": [FULL[2]],
    "capture": [FULL[3]],
    "sfx": [FULL[4]],
    "gate": [FULL[5]],
    "sample": SAMPLE,
    "full": FULL,
    "all": FULL,
}


def node_bin() -> str:
    return os.environ.get("NODE") or shutil.which("node") or "node"


def check() -> int:
    ok = True
    node = node_bin()
    version = subprocess.run([node, "--version"], capture_output=True, text=True)
    if version.returncode == 0:
        print(f"node      {version.stdout.strip()}  ({node})")
    else:
        print("node      未找到：装 Node.js 18+，或设 NODE=<node.exe>")
        ok = False
    for tool in ("ffmpeg", "ffprobe"):
        path = shutil.which(tool)
        print(f"{tool:<9} {path or '未找到（PATH 里没有）'}")
        ok = ok and bool(path)
    if RENDER.is_dir():
        print(f"渲染目录  {RENDER}")
    else:
        print(f"渲染目录  缺 {RENDER}")
        ok = False
    missing = [f for _, f, _ in FULL if not (RENDER / f).exists()]
    if missing:
        print(f"缺脚本    {', '.join(missing)}")
        ok = False
    print(f"浏览器    {os.environ.get('PLAYWRIGHT_CHROME') or '默认（本机 Edge）'}")
    print("结论      " + ("可以开工" if ok else "先补齐上面缺的项"))
    return 0 if ok else 1


def plan(stages: list[tuple[str, str, list[str]]]) -> None:
    node = node_bin()
    for i, (label, script, extra) in enumerate(stages, start=1):
        print(f"{i}. {label}")
        print(f"   {node} {script} {' '.join(extra)}".rstrip())


def main() -> int:
    raw = sys.argv[1:]
    dry = any(a in ("--plan", "--dry-run") for a in raw) or raw[:1] == ["plan"]
    rest = [a for a in raw if a not in ("--plan", "--dry-run")]
    if rest[:1] == ["plan"]:
        rest = rest[1:]
    choices = sorted(set(STAGES) | {"check"})
    stage = rest[0] if rest and rest[0] in choices else "full"
    if rest and rest[0] in choices:
        rest = rest[1:]

    ap = argparse.ArgumentParser(prog="piying", description="皮影剪影卡片管线单一入口")
    ap.add_argument("--cwd", default=str(RENDER), help="node 脚本的工作目录（默认 render/piying）")
    args, extra = ap.parse_known_args(rest)

    if stage == "check":
        return check()

    stages = STAGES[stage]
    if dry:
        plan(stages)
        return 0

    cwd = Path(args.cwd)
    if not cwd.is_dir():
        print(f"工作目录不存在：{cwd}")
        return 1
    node = node_bin()
    for i, (label, script, sargs) in enumerate(stages, start=1):
        if not (cwd / script).exists():
            print(f"[{i}/{len(stages)}] 缺脚本 {script}")
            return 1
        cmd = [node, script, *sargs, *extra]
        print(f"[{i}/{len(stages)}] {label}：{' '.join(cmd)}", flush=True)
        rc = subprocess.run(cmd, cwd=str(cwd)).returncode
        if rc != 0:
            print(f"    失败（退出码 {rc}），后面阶段不再继续")
            return rc
    print("\n完成。" if stage in ("full", "all", "sample") else "")
    return 0


if __name__ == "__main__":
    sys.exit(main())
