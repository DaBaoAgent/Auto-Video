"""jilupian 单一入口：把 autoup 的 S1–S9 编排器收成一个命令，并管好解释器。

autoup 是包内相对导入（`from . import config, utils`），所以只能 `python -m autoup.run`
从 jilupian 根跑，不能直接 `python autoup/run.py`。这个入口就是替你做这件事：

    python scripts/jilupian.py check                     自检：解释器、依赖、ffmpeg、配置
    python scripts/jilupian.py --batch 0130 --manifest urls.txt
    python scripts/jilupian.py run --batch 0130 --only s3,s4 --force
    python scripts/jilupian.py --batch 0130 --plan      只打印等价命令，不真跑

除 `run` / `check` 外的参数原样转给 autoup.run（--manifest/--batch/--only/--force/
--allow-partial/--voice/--limit/--set/--debug）。解释器优先级：JILUPIAN_PY →
本目录 .venv → 当前 python。
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

PIPE = Path(__file__).resolve().parents[1]
NEEDED = ("yaml", "requests", "PIL", "pydub")


def candidate_pythons() -> list[str]:
    found: list[str] = []
    env = os.environ.get("JILUPIAN_PY")
    if env:
        found.append(env)
    for rel in (".venv/Scripts/python.exe", ".venv/bin/python"):
        exe = PIPE / rel
        if exe.exists():
            found.append(str(exe))
    found.append(sys.executable)
    return found


def probe(py: str) -> tuple[bool, str]:
    code = "import autoup.run, " + ", ".join(NEEDED) + "; print('ok')"
    res = subprocess.run([py, "-c", code], cwd=str(PIPE), capture_output=True, text=True)
    if res.returncode == 0:
        return True, "依赖齐全"
    tail = (res.stderr or "").strip().splitlines()
    return False, tail[-1] if tail else "导入失败"


def check() -> int:
    ok = True
    for py in candidate_pythons():
        good, why = probe(py)
        print(f"{py}\n    {'可用' if good else '不可用：' + why}")
        if good:
            chosen = py
            break
    else:
        chosen = ""
        ok = False
        print("没有可用解释器。先在本目录执行：uv sync   或   python -m pip install -e .")

    for tool in ("ffmpeg", "ffprobe"):
        path = shutil.which(tool)
        print(f"{tool:<8}{path or '未找到（config 里 paths.ffmpeg 可写绝对路径）'}")
        ok = ok and bool(path)

    local = PIPE / "autoup" / "config.local.yaml"
    print(f"本机配置 {local}  {'有' if local.exists() else '无（用 config.yaml 默认值 + AUTOUP_* 环境变量）'}")
    print(f"解释器   {chosen or '—'}")
    print("结论     " + ("可以开工" if ok else "先补齐上面缺的项"))
    return 0 if ok else 1


def main() -> int:
    raw = sys.argv[1:]
    stage = "run"
    if raw[:1] in (["run"], ["check"], ["plan"]):
        stage = "check" if raw[0] == "check" else "run"
        raw = raw[1:]
    dry = any(a in ("--plan", "--dry-run") for a in raw)
    rest = [a for a in raw if a not in ("--plan", "--dry-run")]

    if stage == "check":
        return check()
    if raw[:1] in (["-h"], ["--help"]):
        print(__doc__.strip())
        return 0

    py = ""
    for cand in candidate_pythons():
        good, _ = probe(cand)
        if good:
            py = cand
            break
    if not py and dry:
        py = sys.executable
        print("（计划模式：解释器依赖未就绪，仅打印命令；真跑前先 uv sync）")
    if not py:
        print("没有可用解释器：先 uv sync 或 python -m pip install -e .（缺 yaml/requests/PIL/pydub 也会到这里）")
        return 1

    cmd = [py, "-m", "autoup.run", *rest]
    if dry:
        print(f"[{PIPE}] {' '.join(cmd)}")
        return 0
    print("  $ " + " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=str(PIPE)).returncode


if __name__ == "__main__":
    sys.exit(main())
