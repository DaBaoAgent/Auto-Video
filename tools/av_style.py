"""自研风格管线的公共入口实现。

77 条风格管线（zimu / youhua / muke …）的 scripts/<id>.py 都只转调这里。
画面由仓库自己的 vendor/runtime/stylekit.js 画，帧由 style-frames.mjs 抓，
ffmpeg 合流。不依赖任何外部仓库的脚本。

用法（在管线入口里）：
    python pipelines/muke/scripts/muke.py --check
    python pipelines/muke/scripts/muke.py --stills 0.6,2.0,5.0
    python pipelines/muke/scripts/muke.py --render
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

# 各画幅 → 像素（长边 1920 打底，短片口径与站点一致）
ASPECT_PX = {
    "16:9": (1920, 1080),
    "4:3": (1440, 1080),
    "1:1": (1080, 1080),
    "9:16": (1080, 1920),
    "3:4": (1080, 1440),
    "2.35:1": (1920, 817),
    "2.39:1": (1920, 804),
}


def repo_root() -> Path:
    for up in Path(__file__).resolve().parents:
        if (up / "tools" / "av_style.py").exists() and (up / "vendor" / "runtime" / "stylekit.js").exists():
            return up
    raise SystemExit("找不到仓库根（需要 tools/av_style.py 与 vendor/runtime/stylekit.js）")


def load_pipeline(root: Path, pid: str) -> dict:
    p = root / "pipelines" / pid / "pipeline.json"
    if not p.exists():
        raise SystemExit(f"缺少 {p}")
    return json.loads(p.read_text(encoding="utf-8"))


def project_dir(root: Path, pid: str) -> Path:
    return root / "pipelines" / pid / "projects" / "demo"


def find_puppeteer(root: Path) -> Path | None:
    env = os.environ.get("STYLE_PUPPETEER")
    cands = [Path(env)] if env else []
    cands += [
        root / "dengju" / "node_modules" / "puppeteer-core",
        root / "piying" / "node_modules" / "puppeteer-core",
        root / "vendor" / "mg-styles-15" / "node_modules" / "puppeteer-core",
    ]
    for c in cands:
        if (c / "package.json").exists():
            return c
    return None


def edge_path() -> Path | None:
    env = os.environ.get("STYLE_EDGE")
    cands = [env] if env else []
    cands += [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        "/usr/bin/microsoft-edge",
        "/usr/bin/google-chrome",
    ]
    for c in cands:
        if c and Path(c).exists():
            return Path(c)
    return None


def check(root: Path, pid: str, pipe: dict) -> int:
    """体检：缺什么就报什么，不假装能跑。"""
    rows = []

    def add(name: str, ok: bool, note: str = "") -> None:
        rows.append((ok, name, note))

    proj = project_dir(root, pid)
    add("管线目录", (root / "pipelines" / pid).is_dir(), str(root / "pipelines" / pid))
    add("画布页面", (proj / "index.html").exists(), str(proj / "index.html"))
    add("画面脚本", (proj / "main.js").exists(), str(proj / "main.js"))
    add("绘制内核", (root / "vendor" / "runtime" / "stylekit.js").exists(), "vendor/runtime/stylekit.js")
    add("抓帧器", (root / "vendor" / "runtime" / "style-frames.mjs").exists(), "vendor/runtime/style-frames.mjs")

    node = shutil.which("node")
    add("node", node is not None, node or "未安装")

    pp = find_puppeteer(root)
    add("puppeteer-core", pp is not None, str(pp) if pp else "装一条带 puppeteer-core 的管线，或设 STYLE_PUPPETEER")

    edge = edge_path()
    add("浏览器", edge is not None, str(edge) if edge else "装 Edge / Chrome，或设 STYLE_EDGE")

    ff = shutil.which("ffmpeg")
    add("ffmpeg", ff is not None, ff or "未在 PATH 里，出片会用不了")

    # 画面脚本里声明的 family 必须在内核里实现
    fam = (pipe.get("spec", {}).get("style") or {}).get("family")
    kit = root / "vendor" / "runtime" / "stylekit.js"
    fam_ok = bool(fam) and kit.exists() and (f"{fam}:" in kit.read_text(encoding="utf-8"))
    add("风格族", fam_ok, f"family={fam}")

    w = max(len(n) for _, n, _ in rows)
    for ok, name, note in rows:
        print(("OK   " if ok else "FAIL ") + name.ljust(w) + "  " + note)

    bad = [n for ok, n, _ in rows if not ok]
    if bad:
        print("\n体检未过：" + "、".join(bad))
        return 1
    print(f"\nOK {pid} 可以出帧（{pipe.get('name_zh', pid)} · {pipe.get('meta', {}).get('aspect', '16:9')}）")
    return 0


def canvas_size(pipe: dict) -> tuple[int, int]:
    aspect = (pipe.get("meta") or {}).get("aspect") or "16:9"
    return ASPECT_PX.get(aspect, (1920, 1080))


def run_frames(root: Path, pid: str, pipe: dict, extra: list[str], stills: str | None) -> int:
    pp = find_puppeteer(root)
    edge = edge_path()
    if not edge:
        print("找不到浏览器，先跑 --check 看缺什么", file=sys.stderr)
        return 1
    w, h = canvas_size(pipe)
    proj = project_dir(root, pid)
    cmd = [
        "node", str(root / "vendor" / "runtime" / "style-frames.mjs"),
        "--project", str(proj), "--w", str(w), "--h", str(h),
    ]
    if stills:
        cmd += ["--stills", stills, "--out", str(proj / "out" / "stills")]
    cmd += extra
    env = os.environ.copy()
    env["STYLE_EDGE"] = str(edge)
    if pp:
        env["STYLE_PUPPETEER"] = str(pp)
    return subprocess.run(cmd, cwd=str(root), env=env).returncode


def render_mp4(root: Path, pid: str, pipe: dict, dur: float, fps: int) -> int:
    ff = shutil.which("ffmpeg")
    if not ff:
        print("ffmpeg 不在 PATH 里", file=sys.stderr)
        return 1
    proj = project_dir(root, pid)
    frames = proj / "frames"
    if not frames.exists() or not any(frames.glob("*.png")):
        print("还没有帧，先跑 --render 的抓帧部分", file=sys.stderr)
        return 1
    out = proj / "out"
    out.mkdir(parents=True, exist_ok=True)
    mp4 = out / f"{pid}.mp4"
    cmd = [
        ff, "-y", "-v", "error", "-framerate", str(fps), "-i", str(frames / "%04d.png"),
        "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(mp4),
    ]
    rc = subprocess.run(cmd).returncode
    if rc == 0:
        mb = mp4.stat().st_size / 1e6
        print(f"成片 {mp4}（{dur:.1f}s / {mb:.1f} MB）")
    return rc


def main(pid: str, argv: list[str] | None = None) -> int:
    root = repo_root()
    pipe = load_pipeline(root, pid)
    fps = int((pipe.get("meta") or {}).get("fps") or 30)
    dur = float((pipe.get("sample") or {}).get("seconds") or 10)

    ap = argparse.ArgumentParser(prog=pid, description=f"{pipe.get('name_zh', pid)}：自研风格演示片")
    ap.add_argument("--check", action="store_true", help="体检环境与素材，缺什么报什么")
    ap.add_argument("--plan", action="store_true", help="只打印工序，不动手")
    ap.add_argument("--figure", type=float, default=dur, help="片长（秒）")
    ap.add_argument("--fps", type=int, default=fps, help="帧率")
    ap.add_argument("--stills", default=None, help="只出静帧，逗号分隔的秒数")
    ap.add_argument("--render", action="store_true", help="抓帧 → 合流，出 mp4")
    ap.add_argument("--frames-only", action="store_true", help="只抓帧，不合流")
    ap.add_argument("--mp4", action="store_true", help="只把已有帧合成 mp4")
    args = ap.parse_args(argv or sys.argv[1:])

    if args.check:
        return check(root, pid, pipe)

    if args.plan:
        w, h = canvas_size(pipe)
        print(f"{pid} · {pipe.get('name_zh')} / {pipe.get('name_en')}")
        print(f"  画幅 {w}×{h} · {args.fps} fps · 片长 {args.figure:.1f}s")
        print(f"  风格族 family={(pipe.get('spec', {}).get('style') or {}).get('family')}")
        print("  1 体检      python pipelines/%s/scripts/%s.py --check" % (pid, pid))
        print("  2 静帧      --stills 0.6,2.0,5.0 → projects/demo/out/stills")
        print("  3 抓帧      --frames-only → projects/demo/frames/NNNN.png")
        print("  4 合流      --mp4 → projects/demo/out/%s.mp4" % pid)
        return 0

    if args.stills:
        return run_frames(root, pid, pipe, ["--fps", str(args.fps)], args.stills)

    if args.mp4:
        return render_mp4(root, pid, pipe, args.figure, args.fps)

    if args.render or args.frames_only:
        rc = run_frames(root, pid, pipe, ["--dur", str(args.figure), "--fps", str(args.fps)], None)
        if rc != 0 or args.frames_only:
            return rc
        return render_mp4(root, pid, pipe, args.figure, args.fps)

    ap.print_help()
    return 0
