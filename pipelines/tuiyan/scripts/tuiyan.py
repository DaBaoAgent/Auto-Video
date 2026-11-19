"""tuiyan 单一入口：3D 兵棋推演从数据校验到成片发布，一条命令。

    python scripts/tuiyan.py check                 环境自检（node/ffmpeg/引擎包）
    python scripts/tuiyan.py data --pkg packages/chibi-full/battlefield.json
    python scripts/tuiyan.py audio                 音频缺失与中文残留检查
    python scripts/tuiyan.py zh                    繁体/英文残留门禁（必须 errors: 0）
    python scripts/tuiyan.py render --out <目录>    全片稳帧渲染（--detach 走后台启动器）
    python scripts/tuiyan.py reburn --video <mp4> --out <目录>   免重渲换配乐
    python scripts/tuiyan.py publish --dir content  发布信息两行 + 4 话题校验
    python scripts/tuiyan.py all --out <目录>        data → audio → zh → render

所有 node 命令都在 vendor/battlefield-editor 里执行（引擎只认相对 tools/ 的路径）；
--pkg 相对引擎根，默认 packages/chibi-full/battlefield.json。
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

PIPE = Path(__file__).resolve().parents[1]
ENGINE = PIPE / "vendor" / "battlefield-editor"
SCRIPTS = PIPE / "scripts"
DEFAULT_PKG = "packages/chibi-full/battlefield.json"


def node_bin() -> str:
    return os.environ.get("NODE") or shutil.which("node") or "node"


def check() -> int:
    ok = True
    node = node_bin()
    ver = subprocess.run([node, "--version"], capture_output=True, text=True)
    print(f"node      {ver.stdout.strip() if ver.returncode == 0 else '未找到（需 Node.js 18+）'}")
    ok = ok and ver.returncode == 0
    for tool in ("ffmpeg", "ffprobe"):
        found = shutil.which(tool)
        print(f"{tool:<9} {found or '未找到'}")
        ok = ok and bool(found)
    tools = ENGINE / "tools"
    print(f"引擎      {ENGINE}  {'就位' if tools.is_dir() else '缺（vendor 没落地？）'}")
    ok = ok and tools.is_dir()
    for name in ("render-film.mjs", "validate-data.mjs", "audio-check.mjs", "verify-zh.mjs"):
        f = tools / name
        print(f"  {name:<18}{'有' if f.exists() else '缺'}")
        ok = ok and f.exists()
    pkg = ENGINE / DEFAULT_PKG
    print(f"赤壁包    {pkg}  {'有' if pkg.exists() else '缺'}")
    ok = ok and pkg.exists()
    print("结论      " + ("可以开工" if ok else "先补齐上面缺的项"))
    return 0 if ok else 1


def run(cmd: list[str], cwd: Path) -> int:
    print("  $ " + " ".join(cmd), flush=True)
    return subprocess.run(cmd, cwd=str(cwd)).returncode


def main() -> int:
    choices = ["check", "data", "audio", "zh", "render", "reburn", "publish", "all"]
    raw = sys.argv[1:]
    dry = any(a in ("--plan", "--dry-run") for a in raw) or raw[:1] == ["plan"]
    rest = [a for a in raw if a not in ("--plan", "--dry-run")]
    if rest[:1] == ["plan"]:
        rest = rest[1:]
    stage = rest[0] if rest and rest[0] in choices else "all"
    if rest and rest[0] in choices:
        rest = rest[1:]

    ap = argparse.ArgumentParser(prog="tuiyan", description="3D 战场推演管线单一入口")
    ap.add_argument("--pkg", default=DEFAULT_PKG, help="相对引擎根的 battlefield.json")
    ap.add_argument("--out", default="", help="成片/中间产物目录（默认 tuiyan/out/<时间戳>）")
    ap.add_argument("--video", default="", help="reburn 用的原成片")
    ap.add_argument("--dir", default=str(PIPE / "content"), help="publish 要校验的交付目录")
    ap.add_argument("--detach", action="store_true", help="render 走 PowerShell 启动器，后台跑并记 PID")
    args, extra = ap.parse_known_args(rest)

    if stage == "check":
        return check()

    out = Path(args.out) if args.out else PIPE / "out" / time.strftime("%Y%m%d_%H%M%S")
    node = node_bin()
    steps: list[tuple[str, list[str], Path]] = []

    data = ("数据 Schema 校验", [node, "tools/validate-data.mjs", "--pkg", args.pkg, *extra], ENGINE)
    audio = ("音频与中文残留", [node, "tools/audio-check.mjs", "--pkg", args.pkg, *extra], ENGINE)
    zh = ("繁体英文门禁", [node, "tools/verify-zh.mjs", *extra], ENGINE)
    render = ("全片稳帧渲染", [node, "tools/render-film.mjs", "--pkg", args.pkg, "--out", str(out), *extra], ENGINE)
    reburn = ("免重渲换配乐", [node, "tools/reburn-bgm.mjs", "--pkg", args.pkg,
                              "--video", args.video, "--out", str(out), *extra], ENGINE)
    publish = ("发布信息校验", [sys.executable, str(SCRIPTS / "validate_publication_info.py"), args.dir, *extra], PIPE)

    if stage == "data":
        steps = [data]
    elif stage == "audio":
        steps = [audio]
    elif stage == "zh":
        os.environ.setdefault("PROXY", "1")
        steps = [zh]
    elif stage == "render":
        if args.detach:
            launcher = SCRIPTS / "start-film-render.ps1"
            cmd = ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(launcher),
                   "-Engine", str(ENGINE), "-OutDir", str(out), "-Pkg", args.pkg, "-Node", node]
            steps = [("后台渲染已启动", cmd, PIPE)]
        else:
            steps = [render]
    elif stage == "reburn":
        if not args.video:
            print("reburn 需要 --video <原成片.mp4>")
            return 1
        steps = [reburn]
    elif stage == "publish":
        steps = [publish]
    elif stage == "all":
        steps = [data, audio, zh, render, publish]

    if dry:
        for label, cmd, cwd in steps:
            print(f"[{cwd.name}] {label}\n    {' '.join(cmd)}")
        return 0

    if not ENGINE.is_dir() and any(cwd == ENGINE for _, _, cwd in steps):
        print(f"引擎目录不存在：{ENGINE}")
        return 1
    for label, cmd, cwd in steps:
        print(f"[{label}]", flush=True)
        rc = run(cmd, cwd)
        if rc != 0:
            print(f"    失败（退出码 {rc}），后面阶段不再继续")
            return rc
    if stage in ("render", "all"):
        print(f"\n产物目录：{out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
