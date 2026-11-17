"""xiangsu 单一入口：把 build.sh / build_full.sh / verify 收成一个命令。

原来要分清「10 秒样片」和「272 秒全片」两条 bash 链，现在只有：

    python scripts/xiangsu.py check                环境自检（bash/node/ffmpeg/渲染仓库/numpy）
    python scripts/xiangsu.py cues                 cue sheet：切点/字幕/节拍
    python scripts/xiangsu.py audio                只做确定性音轨
    python scripts/xiangsu.py demo [--no-audio]    10 秒样片：音轨 → 渲染 → 验收
    python scripts/xiangsu.py full                全片：assemble → 音轨 → 渲染 → 验收（片级变量必填）
    python scripts/xiangsu.py verify [--file x]   10 秒样片四项验收
    python scripts/xiangsu.py verify-full         全片四项验收
    python scripts/xiangsu.py covers -- --t43 12 --t34 30
    python scripts/xiangsu.py all                  样片链路整条 + 验收

bash 默认按 PATH → Git for Windows 常见位置找，也能用 XIANGSU_BASH 指定。
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

PIPE = Path(__file__).resolve().parents[1]
FULL = PIPE / "full"
SAMPLE_OUT = "样片_前10秒_1920x1080.mp4"


def find_bash() -> str | None:
    for cand in (os.environ.get("XIANGSU_BASH"), shutil.which("bash")):
        if cand and Path(cand).exists():
            return cand
    for root in (Path.home() / "PortableGit", Path("C:/Program Files/Git")):
        exe = root / "bin" / "bash.exe"
        if exe.exists():
            return str(exe)
    return None


def node_bin() -> str:
    return os.environ.get("NODE") or shutil.which("node") or "node"


def env_path(name: str, *old: str) -> str:
    for key in (name, *old):
        value = os.environ.get(key)
        if value:
            return value
    return ""


def check() -> int:
    ok = True
    bash = find_bash()
    print(f"bash      {bash or '未找到：装 Git for Windows，或设 XIANGSU_BASH'}")
    ok = ok and bool(bash)

    node = node_bin()
    ver = subprocess.run([node, "--version"], capture_output=True, text=True)
    print(f"node      {ver.stdout.strip() if ver.returncode == 0 else '未找到'}")
    ok = ok and ver.returncode == 0

    for tool in ("ffmpeg", "ffprobe"):
        found = shutil.which(tool)
        print(f"{tool:<9} {found or '未找到'}")
        ok = ok and bool(found)

    repo = env_path("XIANGSU_REPO", "XIANGSU2_REPO")
    proj = env_path("XIANGSU_PROJ", "XIANGSU2_PROJ")
    chrom = os.environ.get("AV_CHROME", "C:/Program Files/Google/Chrome/Application/chrome.exe")
    print(f"XIANGSU_REPO  {repo or '未设（脚本会落到 D:/@kaifa 历史路径，必须覆盖）'}")
    print(f"XIANGSU_PROJ  {proj or '未设（同上）'}")
    print(f"AV_CHROME     {chrom}  {'存在' if Path(chrom).exists() else '不存在'}")

    if repo:
        harness = Path(repo) / "harness" / "render.mjs"
        print(f"渲染 harness  {harness}  {'就位' if harness.exists() else '缺（仓库没克隆完？）'}")
        ok = ok and harness.exists()
    py = env_path("XIANGSU_PY", "XIANGSU2_PY")
    if py and Path(py).exists():
        probe = subprocess.run([py, "-c", "import numpy,sys;print(numpy.__version__)"],
                               capture_output=True, text=True)
        print(f"音轨 python   numpy {probe.stdout.strip() or '导入失败'}")
        ok = ok and probe.returncode == 0
    else:
        print("音轨 python   未设 XIANGSU_PY（audio.py 需要 numpy）")
        ok = False

    for name, need in (("XIANGSU_FILM", "全片"), ("XIANGSU_DUR", "全片"), ("XIANGSU_COVER_OUT", "封面")):
        if not os.environ.get(name):
            print(f"提示         {name} 未设（{need}链路会直接报错，这是故意的）")

    print("结论      " + ("可以开工" if ok else "先补齐上面缺的项"))
    return 0 if ok else 1


def run(cmd: list[str], cwd: Path) -> int:
    print("  $ " + " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=str(cwd)).returncode


def main() -> int:
    choices = ["check", "cues", "audio", "demo", "assemble", "full",
               "verify", "verify-full", "covers", "all", "all-full"]
    raw = sys.argv[1:]
    dry = any(a in ("--plan", "--dry-run") for a in raw) or raw[:1] == ["plan"]
    rest = [a for a in raw if a not in ("--plan", "--dry-run")]
    if rest[:1] == ["plan"]:
        rest = rest[1:]
    stage = rest[0] if rest and rest[0] in choices else "demo"
    if rest and rest[0] in choices:
        rest = rest[1:]

    ap = argparse.ArgumentParser(prog="xiangsu", description="像素风管线单一入口")
    ap.add_argument("--file", default="", help="验收时指定 mp4（默认取 XIANGSU_PROJ 下的样片名）")
    args, extra = ap.parse_known_args(rest)

    if stage == "check":
        return check()

    bash = find_bash()
    proj = env_path("XIANGSU_PROJ", "XIANGSU2_PROJ")
    repo = env_path("XIANGSU_REPO", "XIANGSU2_REPO")
    demo_out = str(Path(proj) / SAMPLE_OUT) if proj else SAMPLE_OUT
    verify_file = args.file or demo_out

    def need_bash() -> bool:
        if bash:
            return True
        print("找不到 bash：xiangsu 的构建脚本是 bash 写的，请装 Git for Windows 或设 XIANGSU_BASH")
        return False

    steps: list[tuple[str, list[str], Path]] = []

    if stage in ("cues",):
        steps.append(("cue sheet", [node_bin(), "build_cues.mjs", *extra], PIPE))
    elif stage in ("audio",):
        if not need_bash():
            return 1
        demo = (Path(repo) / "demos" / "xiangsu-eden") if repo else Path(".")
        steps.append(("确定性音轨", [bash, "make_audio.sh", str(demo), *extra], PIPE))
    elif stage in ("demo", "all"):
        if not need_bash():
            return 1
        steps.append(("10 秒样片：音轨 → 渲染 → 验收", [bash, "build.sh", *extra], PIPE))
        steps.append(("四项验收", [node_bin(), "verify.mjs", verify_file], PIPE))
    elif stage in ("assemble", "full", "all-full"):
        steps.append(("assemble 全片 film.js", [node_bin(), "assemble.mjs", *extra], FULL))
        if stage != "assemble":
            if not need_bash():
                return 1
            steps.append(("全片：音轨 → 渲染 → 验收", [bash, "build_full.sh"], FULL))
            if stage == "all-full":
                steps.append(("全片四项验收", [node_bin(), "verify_full.mjs", verify_file], FULL))
    elif stage == "verify":
        steps.append(("四项验收", [node_bin(), "verify.mjs", verify_file], PIPE))
    elif stage == "verify-full":
        steps.append(("全片四项验收", [node_bin(), "verify_full.mjs", verify_file], FULL))
    elif stage == "covers":
        steps.append(("双封面", [node_bin(), "make_covers.mjs", *extra], FULL))

    if dry:
        for label, cmd, cwd in steps:
            print(f"[{cwd}] {label}\n    {' '.join(cmd)}")
        return 0
    for label, cmd, cwd in steps:
        print(f"[{label}]", flush=True)
        rc = run(cmd, cwd)
        if rc != 0:
            print(f"    失败（退出码 {rc}），后面阶段不再继续")
            return rc
    return 0


if __name__ == "__main__":
    sys.exit(main())
