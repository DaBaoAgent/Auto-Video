"""bianping: 扁平尺度漫游管线编排（仓库内自研抓帧，不依赖任何外部引擎）

    python scripts/bianping.py new    <工程目录> [--title 片名]
    python scripts/bianping.py check  <工程目录>
    python scripts/bianping.py stills <工程目录> [--times 1,4,9] [--w 1920 --h 1080]
    python scripts/bianping.py render <工程目录> [--dur 36] [--fps 24] [--keep-frames]
    python scripts/bianping.py mux    <工程目录> --audio 配音.wav --out 成片.mp4

画面：工程目录里的 index.html + film.js / scenes.js / flat.js / heroes.js / orbi.js，
抓帧走仓库的 vendor/runtime/style-frames.mjs（puppeteer-core + 本机 Edge），合流走 ffmpeg。
环境变量：CHROME_PATH / STYLE_EDGE 指浏览器；STYLE_PUPPETEER 指 puppeteer-core 目录。
"""
import argparse
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                       # pipelines/bianping
REPO = os.path.dirname(os.path.dirname(ROOT))      # 仓库根
TPL = os.path.join(ROOT, "template")
HARNESS = os.path.join(REPO, "vendor", "runtime", "style-frames.mjs")


def die(msg):
    print("ERROR " + msg)
    sys.exit(1)


def run(cmd, cwd=None):
    print("$ " + " ".join(cmd))
    p = subprocess.run(cmd, cwd=cwd)
    if p.returncode != 0:
        die("command failed: " + cmd[0])
    return p


def project_dir(arg):
    if os.path.isabs(arg):
        p = arg
    else:
        p = os.path.join(ROOT, "projects", arg)
        if not os.path.isdir(p) and os.path.isdir(arg):
            p = os.path.abspath(arg)
    if not os.path.isdir(p):
        die("no project: " + arg)
    return os.path.abspath(p)


def cmd_new(a):
    dst = os.path.abspath(a.dir) if os.path.isabs(a.dir) else os.path.join(ROOT, "projects", a.dir)
    if os.path.exists(dst):
        die("already exists: " + dst)
    shutil.copytree(TPL, dst)
    os.makedirs(os.path.join(dst, "out"), exist_ok=True)
    if a.title:
        html = os.path.join(dst, "index.html")
        s = open(html, encoding="utf-8").read().replace("扁平尺度漫游", a.title)
        open(html, "w", encoding="utf-8").write(s)
    print("project: " + dst)


def cmd_check(a):
    p = project_dir(a.dir)
    problems = []
    for f in ("index.html", "film.js", "scenes.js", "flat.js", "heroes.js", "orbi.js"):
        if not os.path.isfile(os.path.join(p, f)):
            problems.append("缺文件 " + f)
    if not os.path.isfile(HARNESS):
        problems.append("缺抓帧器 vendor/runtime/style-frames.mjs")
    if shutil.which("node") is None:
        problems.append("node 不在 PATH")
    if shutil.which("ffmpeg") is None:
        problems.append("ffmpeg 不在 PATH")
    for m in problems:
        print("  - " + m)
    print("check %s: %s" % (p, "OK" if not problems else "%d problems" % len(problems)))
    return 0 if not problems else 1


def harness_cmd(p, args, extra):
    cmd = ["node", HARNESS, "--project", p, "--w", str(args.w), "--h", str(args.h),
           "--fps", str(args.fps), "--page", "index.html"] + extra
    run(cmd, cwd=REPO)


def cmd_stills(a):
    p = project_dir(a.dir)
    harness_cmd(p, a, ["--stills", a.times, "--out", os.path.join(p, "out", "stills")])


def cmd_render(a):
    p = project_dir(a.dir)
    frames = os.path.join(p, "out", "frames")
    harness_cmd(p, a, ["--dur", str(a.dur), "--out", frames])
    out = os.path.join(p, "out", "video.mp4")
    run(["ffmpeg", "-y", "-framerate", str(a.fps), "-i", os.path.join(frames, "%04d.png"),
         "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out])
    print("video: " + out)
    if not a.keep_frames:
        shutil.rmtree(frames, ignore_errors=True)


def cmd_mux(a):
    p = project_dir(a.dir)
    v = os.path.join(p, "out", "video.mp4")
    if not os.path.isfile(v):
        die("先 render：缺 " + v)
    run(["ffmpeg", "-y", "-i", v, "-i", a.audio, "-c:v", "copy", "-c:a", "aac",
         "-b:a", "192k", "-shortest", a.out])
    print("film: " + a.out)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd")
    for name, fn in [("new", cmd_new), ("check", cmd_check), ("stills", cmd_stills),
                     ("render", cmd_render), ("mux", cmd_mux)]:
        s = sub.add_parser(name)
        s.add_argument("dir")
        s.set_defaults(func=fn)
        if name == "new":
            s.add_argument("--title", default="")
        if name in ("stills", "render"):
            s.add_argument("--w", type=int, default=1920)
            s.add_argument("--h", type=int, default=1080)
            s.add_argument("--fps", type=int, default=24)
        if name == "stills":
            s.add_argument("--times", default="1,4,9")
        if name == "render":
            s.add_argument("--dur", type=float, default=36.0)
            s.add_argument("--keep-frames", action="store_true")
        if name == "mux":
            s.add_argument("--audio", required=True)
            s.add_argument("--out", required=True)
    a = ap.parse_args()
    if not a.cmd:
        ap.print_help()
        return 0
    if a.cmd == "check":
        return a.func(a)
    a.func(a)
    return 0


if __name__ == "__main__":
    sys.exit(main())
