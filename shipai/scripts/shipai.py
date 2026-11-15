# -*- coding: utf-8 -*-
"""shipai.py · 实拍素材口播竖屏短片编排

一条命令跑完本次玛雅那支片子的完整链路，且只跑这条链路真正用到的部分：
    配音 → 切段与字级时间 → 素材（Pixabay 检索 / 按 id 下载）→ MoneyPrinterTurbo CLI 出底片
    → 一行式字幕烧录 → 校验

子命令：
    new <名字> --text 口播稿.md --wav 配音.wav [--title 片名]
    vo <名字> --paragraph 3          # 切第 3 段 + 生成 timeline.json
    terms <名字> --terms "a|b|c"     # Pixabay 查候选，写 materials/candidates.json
    material <名字> --ids 1,2,3      # 按 id 下载（顺序即拼接顺序）
    base <名字>                      # MoneyPrinterTurbo 出无字幕底片
    caption <名字>                   # 烧一行式字幕
    make <名字> --paragraph 3 [--ids ...] [--terms ...]
    probe <名字>                     # ffprobe 校验

所有路径默认能力都写进 ../pipeline.json，可用环境变量覆盖：
    SHIPAI_MPT        MoneyPrinterTurbo 目录
    SHIPAI_PYTHON     MoneyPrinterTurbo 的 python.exe
    PIXABAY_KEY       Pixabay API key
    SHIPAI_PROXY      下载/接口代理
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PIPE_ROOT = os.path.dirname(HERE)
PIPE_JSON = os.path.join(PIPE_ROOT, "pipeline.json")


def cfg():
    with open(PIPE_JSON, encoding="utf-8") as f:
        return json.load(f)


def mpt_dir(c):
    return os.environ.get("SHIPAI_MPT") or c["engine"]["dir"]


def mpt_python(c):
    p = os.environ.get("SHIPAI_PYTHON")
    if p and os.path.isfile(p):
        return p
    cand = os.path.join(mpt_dir(c), c["engine"]["python"])
    if os.path.isfile(cand):
        return cand
    raise SystemExit(f"找不到 MoneyPrinterTurbo 的 python：{cand}")


def proj_dir(name):
    return os.path.join(PIPE_ROOT, "projects", name)


def load_project(name):
    p = os.path.join(proj_dir(name), "project.json")
    if not os.path.isfile(p):
        raise SystemExit(f"工程不存在：{proj_dir(name)}（先跑 new）")
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def save_project(name, data):
    with open(os.path.join(proj_dir(name), "project.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def py():
    """跑管线脚本的解释器：SHIPAI_PY → MoneyPrinterTurbo 的 venv（已带 faster-whisper + Pillow）。"""
    explicit = os.environ.get("SHIPAI_PY")
    if explicit and os.path.isfile(explicit):
        return explicit
    try:
        return mpt_python(cfg())
    except SystemExit:
        return sys.executable


def run_script(script, args, cwd=None):
    cmd = [py(), os.path.join(HERE, script)] + args
    print(f"\n$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd or os.getcwd(), check=True)


# ---------------------------------------------------------------- new

def cmd_new(args):
    c = cfg()
    d = proj_dir(args.name)
    os.makedirs(os.path.join(d, "audio"), exist_ok=True)
    os.makedirs(os.path.join(d, "materials"), exist_ok=True)
    txt = args.text or os.path.join(d, "script.txt")
    if args.text:
        shutil.copyfile(args.text, os.path.join(d, "script.txt"))
    if not os.path.isfile(txt):
        raise SystemExit("要给 --text 口播稿（或工程里已有 script.txt）")
    wav = args.wav or os.path.join(d, "voice.wav")
    if args.wav:
        shutil.copyfile(args.wav, os.path.join(d, "voice.wav"))
    if not os.path.isfile(wav):
        raise SystemExit("要给 --wav 配音（或工程里已有 voice.wav）")
    data = {
        "name": args.name,
        "title": args.title or args.name,
        "paragraph": args.paragraph,
        "voice": "voice.wav",
        "script": "script.txt",
        "terms": "",
        "ids": [],
        "clip_seconds": c["materials"]["clip_seconds"],
        "concat": c["materials"]["concat"],
        "note": "",
    }
    save_project(args.name, data)
    print(f"[new] {d}")


# ---------------------------------------------------------------- vo / 素材 / 出片

def cmd_vo(args):
    c = cfg()
    p = load_project(args.name)
    d = proj_dir(args.name)
    para = args.paragraph or p.get("paragraph", 1)
    run_script("vo_segment.py", [
        "--wav", os.path.join(d, p["voice"]),
        "--text", os.path.join(d, p["script"]),
        "--paragraph", str(para),
        "--out", d,
        "--model", args.model or c["vo"]["model"],
        "--device", c["vo"]["device"],
        "--compute-type", c["vo"]["compute_type"],
        "--language", c["vo"]["language"],
    ])
    p["paragraph"] = int(para)
    save_project(args.name, p)


def cmd_terms(args):
    p = load_project(args.name)
    d = proj_dir(args.name)
    out = os.path.join(d, "materials", "candidates.json")
    key_args = ["--key", args.key] if args.key else []
    run_script("pixabay.py", ["search", "--query", args.terms, "--per-page", str(args.per_page),
                              "--out", out] + key_args)
    p["terms"] = args.terms
    save_project(args.name, p)


def cmd_material(args):
    c = cfg()
    p = load_project(args.name)
    d = proj_dir(args.name)
    mats = os.path.join(d, "materials")
    key_args = ["--key", args.key] if args.key else []
    if args.ids:
        run_script("pixabay.py", ["download", "--ids", args.ids, "--out", mats] + key_args)
        p["ids"] = [x.strip() for x in args.ids.split(",") if x.strip()]
    elif p.get("terms"):
        run_script("pixabay.py", ["download", "--query", p["terms"].replace("|", "|"),
                                  "--count", str(args.count or c["materials"]["count"]),
                                  "--out", mats] + key_args)
    else:
        raise SystemExit("要给 --ids，或先跑 terms 让工程记下关键词")
    save_project(args.name, p)


def cmd_base(args):
    c = cfg()
    p = load_project(args.name)
    d = proj_dir(args.name)
    tl = json.load(open(os.path.join(d, "timeline.json"), encoding="utf-8"))
    mats_json = os.path.join(d, "materials", "materials.json")
    if not os.path.isfile(mats_json):
        raise SystemExit("还没有素材清单 materials/materials.json（先跑 material）")
    files = json.load(open(mats_json, encoding="utf-8"))["files"]
    paths = [os.path.join(d, "materials", f) for f in files]
    missing = [x for x in paths if not os.path.isfile(x)]
    if missing:
        raise SystemExit(f"素材缺失：{missing}")

    mpt = mpt_dir(c)
    seg = os.path.join(d, tl["segment"]["path"].replace("/", os.sep))
    out_log = os.path.join(d, "logs", "base.log")
    os.makedirs(os.path.dirname(out_log), exist_ok=True)

    script = tl["text"]
    cmd = [mpt_python(c), "cli.py",
           "--video-subject", p.get("title") or args.name,
           "--video-script", script,
           "--custom-audio-file", os.path.abspath(seg),
           "--video-source", "local",
           "--video-materials", ",".join(os.path.abspath(x) for x in paths),
           "--video-concat-mode", p.get("concat") or c["materials"]["concat"],
           "--video-clip-duration", str(p.get("clip_seconds") or c["materials"]["clip_seconds"]),
           "--video-aspect", c["canvas"]["aspect"],
           "--video-count", "1",
           "--bgm-type", c["audio"]["bgm"],
           "--no-subtitle-enabled",
           "--n-threads", str(args.threads or c["engine"]["n_threads"])]
    env = dict(os.environ, PYTHONPATH=mpt)
    print(f"\n$ (cd {mpt}) {' '.join(cmd)}")
    with open(out_log, "w", encoding="utf-8") as log:
        proc = subprocess.run(cmd, cwd=mpt, env=env, stdout=subprocess.PIPE,
                              stderr=subprocess.STDOUT, text=True,
                              encoding="utf-8", errors="replace")
        log.write(proc.stdout)
    if proc.returncode != 0:
        print(proc.stdout[-1200:], file=sys.stderr)
        raise SystemExit(f"CLI 出片失败，看 {out_log}")

    result = None
    for line in reversed(proc.stdout.strip().splitlines()):
        line = line.strip()
        if line.startswith("{") and '"result"' in line:
            result = json.loads(line)
            break
    if not result:
        raise SystemExit(f"CLI 输出里没有结果 JSON，看 {out_log}")
    videos = result["result"]["videos"]
    if not videos:
        raise SystemExit("CLI 没产出视频")
    dst = os.path.join(d, "base-9x16.mp4")
    shutil.copyfile(videos[0], dst)
    p["task_id"] = result["task_id"]
    save_project(args.name, p)
    print(f"[base] {dst}  ({os.path.getsize(dst) / 1e6:.1f} MB, task {result['task_id']})")


def cmd_caption(args):
    c = cfg()
    d = proj_dir(args.name)
    base = os.path.join(d, "base-9x16.mp4")
    if not os.path.isfile(base):
        raise SystemExit("还没有底片 base-9x16.mp4（先跑 base）")
    cs = c["captions"]
    run_script("captions.py", [
        "--video", base,
        "--timeline", os.path.join(d, "timeline.json"),
        "--out", os.path.join(d, "final-9x16.mp4"),
        "--mpt", mpt_dir(c),
        "--size", str(args.size or cs["size"]),
        "--stroke", str(args.stroke if args.stroke is not None else cs["stroke"]),
        "--shadow-alpha", str(args.shadow_alpha if args.shadow_alpha is not None else cs["shadow"]["alpha"]),
        "--shadow-offset", str(cs["shadow"]["offset"]),
        "--y-ratio", str(args.y_ratio or cs["y_ratio"]),
    ])


def cmd_probe(args):
    d = proj_dir(args.name)
    tl = json.load(open(os.path.join(d, "timeline.json"), encoding="utf-8"))
    target = os.path.join(d, args.file or "final-9x16.mp4")
    if not os.path.isfile(target):
        raise SystemExit(f"没有 {target}")
    info = json.loads(subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", target],
        capture_output=True, text=True, encoding="utf-8").stdout)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    dur = float(info["format"]["duration"])
    ok = True
    checks = [
        ("分辨率 1080×1920", v["width"] == 1080 and v["height"] == 1920),
        ("有音轨", a is not None),
        ("时长≈切段", abs(dur - tl["segment"]["seconds"]) < 1.0),
    ]
    print(f"\n[probe] {target}")
    print(f"  {v['width']}×{v['height']}  {v['r_frame_rate']}  {dur:.3f}s  "
          f"{os.path.getsize(target) / 1e6:.1f} MB")
    for label, good in checks:
        print(f"  {'OK ' if good else 'FAIL'} {label}")
        ok &= good
    if not ok:
        raise SystemExit("校验未过")
    tl_ok = all(c["end"] > c["start"] for c in tl["clauses"])
    print(f"  {'OK ' if tl_ok else 'FAIL'} 字幕 {len(tl['clauses'])} 条时间轴单调")
    if not tl_ok:
        raise SystemExit("字幕时间轴异常")


# ---------------------------------------------------------------- make

def cmd_make(args):
    c = cfg()
    if not os.path.isdir(proj_dir(args.name)):
        cmd_new(args)
    cmd_vo(args)
    if args.terms:
        cmd_terms(args)
    if args.ids or args.terms:
        cmd_material(args)
    cmd_base(args)
    cmd_caption(args)
    cmd_probe(args)
    print("\n[make] 完成 →", os.path.join(proj_dir(args.name), "final-9x16.mp4"))


def main():
    ap = argparse.ArgumentParser(description="shipai · 实拍素材口播竖屏短片")
    sub = ap.add_subparsers(dest="cmd", required=True)

    n = sub.add_parser("new")
    n.add_argument("name")
    n.add_argument("--text")
    n.add_argument("--wav")
    n.add_argument("--title")
    n.add_argument("--paragraph", type=int, default=1)

    for name in ("vo", "material", "base", "caption", "probe", "make"):
        s = sub.add_parser(name)
        s.add_argument("name")
        s.add_argument("--paragraph", type=int, default=None)
        s.add_argument("--ids", default=None)
        s.add_argument("--terms", default=None)
        s.add_argument("--count", type=int, default=None)
        s.add_argument("--key", default=None)
        s.add_argument("--model", default=None)
        s.add_argument("--threads", type=int, default=None)
        s.add_argument("--text", default=None)
        s.add_argument("--wav", default=None)
        s.add_argument("--title", default=None)
        s.add_argument("--size", type=int, default=None)
        s.add_argument("--stroke", type=int, default=None)
        s.add_argument("--shadow-alpha", type=float, default=None)
        s.add_argument("--y-ratio", type=float, default=None)
        s.add_argument("--file", default=None)

    t = sub.add_parser("terms")
    t.add_argument("name")
    t.add_argument("--terms", required=True, help='用 | 分隔："mayan ruins|jungle temple"')
    t.add_argument("--per-page", type=int, default=8)
    t.add_argument("--key", default=None)

    args = ap.parse_args()
    handlers = {
        "new": cmd_new, "vo": cmd_vo, "terms": cmd_terms, "material": cmd_material,
        "base": cmd_base, "caption": cmd_caption, "probe": cmd_probe, "make": cmd_make,
    }
    handlers[args.cmd](args)


if __name__ == "__main__":
    sys.exit(main())
