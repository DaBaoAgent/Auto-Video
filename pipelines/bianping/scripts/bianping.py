"""bianping: 扁平尺度漫游管线编排"""
import argparse, subprocess, os, sys

# 外部引擎 lemo-opuscar 与 python 解释器都不写死盘符：
#   BIANPING_LIB 指向 lemo-opuscar 克隆；BIANPING_PY 指需要装 numpy/PIL 的解释器
LIB = os.environ.get("BIANPING_LIB", "")
PY_SYS = os.environ.get("BIANPING_PY") or sys.executable
PY_VENV = os.path.join(LIB, ".venv", "Scripts", "python.exe") if LIB else PY_SYS


def need_lib():
    if not LIB or not os.path.isdir(LIB):
        raise SystemExit(
            "✗ 需要 lemo-opuscar 引擎：设 BIANPING_LIB=/path/to/lemo-opuscar"
            "（里面要有 core/render/video.mjs 和 .venv/Scripts/python.exe）"
        )
    return LIB

def cmd_new(args):
    dst = args.dir
    tpl = os.path.join(os.path.dirname(__file__), "..", "template")
    if os.path.exists(dst):
        print(f"already exists: {dst}"); return
    subprocess.run(["xcopy", "/E", "/I", "/Y", tpl, dst], check=True)
    os.makedirs(os.path.join(dst, "out"), exist_ok=True)
    print(f"project: {dst}")

def cmd_asr(args):
    subprocess.run([PY_SYS, os.path.join(args.dir, "asr.py")], check=True)

def cmd_music(args):
    need_lib()
    subprocess.run([PY_VENV, os.path.join(args.dir, "music.py")], check=True)

def cmd_render(args):
    lib = need_lib()
    out = os.path.join(args.dir, "out", "video.mp4")
    subprocess.run(["node", "core/render/video.mjs", args.dir, "--fps", "24", "--workers", "3", "--out", out], cwd=lib, check=True)

def cmd_mux(args):
    v = os.path.join(args.dir, "out", "video.mp4")
    a = os.path.join(args.dir, "out", "amix.wav")
    subprocess.run(["ffmpeg", "-y", "-i", v, "-i", a, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", args.out], check=True)

def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd")
    for name, fn in [("new", cmd_new),("asr",cmd_asr),("music",cmd_music),("render",cmd_render),("mux",cmd_mux)]:
        s = sub.add_parser(name)
        s.add_argument("dir")
        if name == "mux": s.add_argument("--out", required=True)
        s.set_defaults(func=fn)
    args = p.parse_args()
    if not args.cmd: p.print_help(); return
    args.func(args)

if __name__ == "__main__":
    main()
