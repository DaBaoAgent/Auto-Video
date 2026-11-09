#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""map.py — map 管线编排（Auto-Video · 第 16 条成片管线）

用法：
  python scripts/map.py new <工程目录> [--title 片名]     从 template 建工程（复制 lib/）
  python scripts/map.py vo <工程目录> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
  python scripts/map.py check <工程目录>                  --check（lint，不渲染）
  python scripts/map.py stills <工程目录> [--times 1,3.5,8]
  python scripts/map.py render <工程目录> [--scale 0.6667] [--fps 30] [--draft]
  python scripts/map.py probe <成片.mp4>
  python scripts/map.py deliver <工程目录> --chugao <出稿目录> --name <交付名> [--bgm 音乐.mp3] [--bgm-gain 0.14]

前置：Node 18+、ffmpeg 在 PATH、Chrome（设置 CHROME_PATH；Windows 下未设时自动找本机 Chrome/Edge）。
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                 # map/
RUNTIME = os.path.join(ROOT, "runtime")
TEMPLATE = os.path.join(ROOT, "template")

CHROME_CANDIDATES = [
    os.environ.get("CHROME_PATH", ""),
    r"C:\Users\Administrator\AppData\Local\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
]


def chrome_path():
    for p in CHROME_CANDIDATES:
        if p and os.path.exists(p):
            return p
    return os.environ.get("CHROME_PATH")


def env_with_runtime():
    env = dict(os.environ)
    cp = chrome_path()
    if cp:
        env["CHROME_PATH"] = cp
    return env


def run(cmd, cwd=None):
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=cwd, env=env_with_runtime()).returncode


def proj_arg(p):
    return os.path.abspath(p)


def cmd_new(args):
    proj = proj_arg(args.dir)
    if os.path.exists(proj) and os.listdir(proj):
        sys.exit("目标目录非空：%s" % proj)
    os.makedirs(proj, exist_ok=True)
    for name in os.listdir(TEMPLATE):
        src = os.path.join(TEMPLATE, name)
        dst = os.path.join(proj, name)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(src, dst)
    lib = os.path.join(proj, "lib")
    os.makedirs(lib, exist_ok=True)
    for name in ("core.js", "promo.js", "map.js", "stickers.js"):
        shutil.copy2(os.path.join(RUNTIME, name), os.path.join(lib, name))
    if args.title:
        idx = os.path.join(proj, "index.html")
        with open(idx, encoding="utf-8") as f:
            html = f.read()
        html = html.replace("__TITLE__", args.title)
        with open(idx, "w", encoding="utf-8") as f:
            f.write(html)
    print("已创建 %s" % proj)
    print("下一步：")
    print("  1. 写 brief.md（事实表）与 storyboard.md（分镜）")
    print("  2. 配音：python %s vo %s --src 配音.wav --text 口播稿.txt" % (__file__, proj))
    print("  3. 画 assets/models/*.svg 与 main.js，改 score.js / sound.js")
    print("  4. python %s check %s → stills → render" % (__file__, proj))


def cmd_vo(args):
    cmd = [sys.executable, os.path.join(HERE, "make_vo.py"),
           "--src", os.path.abspath(args.src), "--text", os.path.abspath(args.text),
           "--out", proj_arg(args.proj), "--lead", str(args.lead)]
    if args.cut:
        cmd += ["--cut", str(args.cut)]
    if args.fixed:
        cmd += ["--fixed", args.fixed]
    sys.exit(run(cmd))


def render_cmd(args, extra):
    proj = proj_arg(args.proj)
    cmd = ["node", os.path.join(RUNTIME, "render.mjs"), proj] + extra
    sys.exit(run(cmd))


def cmd_check(args):
    render_cmd(args, ["--check"])


def cmd_stills(args):
    extra = ["--stills", args.times] if args.times else ["--stills", "2,5,10"]
    render_cmd(args, extra)


def cmd_render(args):
    extra = []
    if args.scale:
        extra += ["--scale", str(args.scale)]
    if args.fps:
        extra += ["--fps", str(args.fps)]
    if args.draft:
        extra += ["--draft"]
    render_cmd(args, extra)


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json",
                          "-show_format", "-show_streams", path],
                         capture_output=True, text=True, encoding="utf-8", errors="replace")
    if out.returncode != 0:
        sys.exit(out.stderr.strip())
    j = json.loads(out.stdout)
    v = [s for s in j["streams"] if s["codec_type"] == "video"][0]
    a = [s for s in j["streams"] if s["codec_type"] == "audio"]
    return {
        "duration": round(float(j["format"]["duration"]), 3),
        "size_mb": round(int(j["format"]["size"]) / 1048576, 2),
        "width": v["width"], "height": v["height"],
        "fps": v["r_frame_rate"], "vcodec": v["codec_name"],
        "acodec": a[0]["codec_name"] if a else None,
    }


def cmd_probe(args):
    print(json.dumps(probe(args.video), ensure_ascii=False, indent=1))


def cmd_deliver(args):
    cmd = [sys.executable, os.path.join(HERE, "deliver.py"),
           proj_arg(args.proj), "--chugao", os.path.abspath(args.chugao), "--name", args.name]
    if args.bgm:
        cmd += ["--bgm", os.path.abspath(args.bgm)]
    if args.bgm_gain:
        cmd += ["--bgm-gain", str(args.bgm_gain)]
    sys.exit(run(cmd))


def main():
    ap = argparse.ArgumentParser(description="map 管线编排")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("new"); p.add_argument("dir"); p.add_argument("--title"); p.set_defaults(fn=cmd_new)
    p = sub.add_parser("vo"); p.add_argument("proj"); p.add_argument("--src", required=True)
    p.add_argument("--text", required=True); p.add_argument("--lead", type=float, default=0.7)
    p.add_argument("--cut", type=float); p.add_argument("--fixed"); p.set_defaults(fn=cmd_vo)
    p = sub.add_parser("check"); p.add_argument("proj"); p.set_defaults(fn=cmd_check)
    p = sub.add_parser("stills"); p.add_argument("proj"); p.add_argument("--times"); p.set_defaults(fn=cmd_stills)
    p = sub.add_parser("render"); p.add_argument("proj"); p.add_argument("--scale", type=float)
    p.add_argument("--fps", type=int); p.add_argument("--draft", action="store_true"); p.set_defaults(fn=cmd_render)
    p = sub.add_parser("probe"); p.add_argument("video"); p.set_defaults(fn=cmd_probe)
    p = sub.add_parser("deliver"); p.add_argument("proj"); p.add_argument("--chugao", required=True)
    p.add_argument("--name", required=True); p.add_argument("--bgm"); p.add_argument("--bgm-gain", type=float)
    p.set_defaults(fn=cmd_deliver)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
