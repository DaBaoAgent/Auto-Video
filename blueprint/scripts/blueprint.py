#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""blueprint.py — 蓝图工程图 管线编排（Auto-Video）

用法：
  python scripts/blueprint.py new <工程目录> [--title 片名]
  python scripts/blueprint.py vo <工程目录> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
  python scripts/blueprint.py check <工程目录>
  python scripts/blueprint.py stills <工程目录> [--times 1,3.5,8] [--aspect 9:16]
  python scripts/blueprint.py render <工程目录> [--scale 0.6667] [--fps 30] [--draft] [--bgm 音乐.mp3] [--bgm-volume 0.14]
  python scripts/blueprint.py probe <成片.mp4>
  python scripts/blueprint.py qa <工程目录>
  python scripts/blueprint.py deliver <工程目录> --chugao <出稿目录> --name <交付名> [--archive <归档目录>]

前置：Node 18+、ffmpeg/ffprobe 在 PATH、Chrome 或 Edge（设置 CHROME_PATH；Windows 下未设时自动找本机 Chrome/Edge）。
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

STYLE = "blueprint"
LABEL = "蓝图工程图"
VIDEO_NAME = "video-16x9.mp4"
# 纯黑底风格（parable）不要用黑帧做硬门槛；其它风格黑帧 >2 s 需要人工确认
BLACK_TOLERANT = False

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                 # <style>/
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


def copy_runtime_lib(proj):
    lib = os.path.join(proj, "lib")
    os.makedirs(lib, exist_ok=True)
    for name in ("core.js", "promo.js", STYLE + ".js"):
        src = os.path.join(RUNTIME, name)
        if not os.path.exists(src):
            sys.exit("运行时缺失：%s" % src)
        shutil.copy2(src, os.path.join(lib, name))


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
    copy_runtime_lib(proj)
    for d in ("audio", "out", "review"):
        os.makedirs(os.path.join(proj, d), exist_ok=True)
    if args.title:
        idx = os.path.join(proj, "index.html")
        with open(idx, encoding="utf-8") as f:
            html = f.read()
        html = re.sub(r"<title>.*?</title>", "<title>%s</title>" % args.title, html, count=1)
        with open(idx, "w", encoding="utf-8") as f:
            f.write(html)
    print("已创建 %s（%s）" % (proj, LABEL))
    print("模板是阿努纳奇样片的完整做法；下一步：")
    print("  1. 改 brief.md（事实表）与 storyboard.md（分镜），所有屏幕文字只从这里来")
    print("  2. 配音：python %s vo %s --src 配音.wav --text 口播稿.txt" % (__file__, proj))
    print("  3. 改 index.html 的分幕与画面、score.js、sound.js")
    print("  4. python %s check %s → stills → render" % (__file__, proj))


def cmd_vo(args):
    cmd = [sys.executable, os.path.join(HERE, "make_vo.py"),
           "--src", os.path.abspath(args.src), "--text", os.path.abspath(args.text),
           "--out", proj_arg(args.proj), "--lead", str(args.lead)]
    if args.cut:
        cmd += ["--cut", str(args.cut)]
    if args.fixed:
        cmd += ["--fixed", args.fixed]
    if args.voice:
        cmd += ["--voice", args.voice]
    sys.exit(run(cmd))


def render_cmd(args, extra):
    proj = proj_arg(args.proj)
    cmd = ["node", os.path.join(RUNTIME, "render.mjs"), proj] + extra
    sys.exit(run(cmd))


def cmd_check(args):
    render_cmd(args, ["--check"])


def cmd_stills(args):
    extra = ["--stills", args.times] if args.times else ["--stills", "2,5,10"]
    if args.aspect:
        extra += ["--aspect", args.aspect]
    render_cmd(args, extra)


def cmd_render(args):
    extra = []
    if args.scale:
        extra += ["--scale", str(args.scale)]
    if args.fps:
        extra += ["--fps", str(args.fps)]
    if args.draft:
        extra += ["--draft"]
    if args.bgm:
        extra += ["--bgm", os.path.abspath(args.bgm), "--bgm-volume", str(args.bgm_volume)]
    if args.no_audio:
        extra += ["--no-audio"]
    if args.workers:
        extra += ["--workers", str(args.workers)]
    if args.frame_timeout:
        extra += ["--frame-timeout", str(args.frame_timeout)]
    if args.aspect:
        extra += ["--aspect", args.aspect]
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
        "sample_rate": a[0].get("sample_rate") if a else None,
        "channels": a[0].get("channels") if a else None,
    }


def cmd_probe(args):
    print(json.dumps(probe(args.video), ensure_ascii=False, indent=1))


def loudness(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", path,
                        "-af", "loudnorm=print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    blocks = re.findall(r"\{[\s\S]*?\}", p.stderr)
    if not blocks:
        return {}
    j = json.loads(blocks[-1])
    return {"input_i": float(j["input_i"]), "input_tp": float(j["input_tp"]),
            "input_lra": float(j["input_lra"]), "target": -16.0}


def black_frames(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-i", path,
                        "-vf", "blackdetect=d=0.2:pix_th=0.02", "-an", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    return [{"start": float(a), "end": float(b)} for a, b in
            re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", p.stderr)]


def decode_errors(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostdin", "-v", "error", "-i", path, "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    return [x for x in p.stderr.splitlines() if x.strip()]


def fmt_ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return ("%02d:%02d:%06.3f" % (h, m, s)).replace(".", ",")


def wrap(text, width=18):
    parts = re.findall(r"[^，。！？；：、,.!?;:]+[，。！？；、,.!?;:]?", text)
    lines, cur = [], ""
    for p in parts:
        if len(cur) + len(p) <= width:
            cur += p
        else:
            if cur:
                lines.append(cur)
            cur = p
    if cur:
        lines.append(cur)
    return lines or [text]


def make_srt(timeline_json, out):
    d = json.load(open(timeline_json, encoding="utf-8"))
    blocks, n = [], 1
    for line in d["lines"]:
        s, e, text = line["start"], line["end"], line["text"].strip()
        if not text:
            continue
        rows = wrap(text)
        total = sum(len(r) for r in rows) or 1
        t = s
        for r in rows:
            d2 = (e - s) * len(r) / total
            blocks.append("%d\n%s --> %s\n%s\n" % (n, fmt_ts(t), fmt_ts(min(t + d2, e)), r))
            n += 1
            t += d2
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))
    return out


def find_video(proj):
    out = os.path.join(proj, "out")
    for name in (VIDEO_NAME, "video.mp4"):
        p = os.path.join(out, name)
        if os.path.exists(p):
            return p
    return None


def ensure_cover(proj, video):
    out = os.path.join(proj, "out")
    for name in ("cover-16x9.png", "cover.png"):
        p = os.path.join(out, name)
        if os.path.exists(p):
            return p
    print("没有封面，补渲染封面帧 …")
    rc = subprocess.run(["node", os.path.join(RUNTIME, "render.mjs"), proj, "--cover"],
                        env=env_with_runtime()).returncode
    if rc != 0:
        return None
    for name in ("cover-16x9.png", "cover.png"):
        p = os.path.join(out, name)
        if os.path.exists(p):
            return p
    return None


def ensure_credits(proj):
    out = os.path.join(proj, "out")
    p = os.path.join(out, "CREDITS.txt")
    if os.path.exists(p):
        return p
    text = ("画面运行时：BB-Video（MIT）\n"
            "管线：Auto-Video · %s（%s）\n"
            "字体：页面所用 @fontsource 字体，各自 OFL 许可\n" % (STYLE, LABEL))
    with open(p, "w", encoding="utf-8") as f:
        f.write(text)
    return p


def qa_report(proj, video):
    info = probe(video)
    ln = loudness(video)
    blacks = black_frames(video)
    errs = decode_errors(video)
    long_black = [b for b in blacks if b["end"] - b["start"] >= 2.0]
    report = {"video": video, "style": STYLE, "probe": info, "loudness": ln,
              "black_frames": blacks, "long_black": long_black,
              "decode_errors": errs[:20]}
    os.makedirs(os.path.join(proj, "review"), exist_ok=True)
    with open(os.path.join(proj, "review", "qa.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print("PROBE", json.dumps(info, ensure_ascii=False))
    print("LOUD  %.1f LUFS / %.1f dBTP (target %.0f)" % (ln.get("input_i", 0), ln.get("input_tp", 0), -16))
    print("BLACK", len(blacks), blacks[:3])
    print("DECODE_ERRORS", len(errs))
    ok_loud = abs(ln.get("input_tp", 99)) < 2.0 and abs(ln.get("input_i", 99) + 16) <= 1.5
    ok = not errs and ok_loud and (BLACK_TOLERANT or not long_black)
    print("QA", "OK" if ok else "需要人工确认", "→", os.path.join(proj, "review", "qa.json"))
    return report, ok


def cmd_qa(args):
    proj = proj_arg(args.proj)
    video = find_video(proj)
    if not video:
        sys.exit("找不到成片：先 python scripts/%s.py render %s" % (STYLE, proj))
    _, ok = qa_report(proj, video)
    sys.exit(0 if ok else 1)


def cmd_deliver(args):
    proj = proj_arg(args.proj)
    video = find_video(proj)
    if not video:
        sys.exit("找不到成片：先 python scripts/%s.py render %s" % (STYLE, proj))
    cover = ensure_cover(proj, video)
    credits = ensure_credits(proj)
    srt = None
    for name in ("captions-16x9.srt", "captions.srt"):
        p = os.path.join(proj, "out", name)
        if os.path.exists(p):
            srt = p
            break
    if not srt:
        tl = os.path.join(proj, "timeline.json")
        if os.path.exists(tl):
            srt = make_srt(tl, os.path.join(proj, "out", "captions-16x9.srt"))
            print("由 timeline.json 生成字幕：", srt)
    report, ok = qa_report(proj, video)
    os.makedirs(args.chugao, exist_ok=True)
    targets = [args.chugao] + ([args.archive] if args.archive else [])
    pairs = [(video, args.name + ".mp4"),
             (cover, args.name + "_封面.png"),
             (srt, args.name + "_字幕.srt"),
             (credits, args.name + "_署名.txt")]
    for src, dst in pairs:
        if not src or not os.path.exists(src):
            print("MISSING", src)
            continue
        for root in targets:
            os.makedirs(root, exist_ok=True)
            shutil.copy2(src, os.path.join(root, dst))
        print("deliver", dst, round(os.path.getsize(src) / 1048576, 2), "MB")
    sys.exit(0 if ok else 1)


def main():
    ap = argparse.ArgumentParser(description="%s · %s 管线编排" % (STYLE, LABEL))
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("new"); p.add_argument("dir"); p.add_argument("--title"); p.set_defaults(fn=cmd_new)
    p = sub.add_parser("vo"); p.add_argument("proj"); p.add_argument("--src", required=True)
    p.add_argument("--text", required=True); p.add_argument("--lead", type=float, default=0.7)
    p.add_argument("--cut", type=float); p.add_argument("--fixed")
    p.add_argument("--voice", default="zh-CN-YunxiNeural"); p.set_defaults(fn=cmd_vo)
    p = sub.add_parser("check"); p.add_argument("proj"); p.set_defaults(fn=cmd_check)
    p = sub.add_parser("stills"); p.add_argument("proj"); p.add_argument("--times")
    p.add_argument("--aspect"); p.set_defaults(fn=cmd_stills)
    p = sub.add_parser("render"); p.add_argument("proj"); p.add_argument("--scale", type=float)
    p.add_argument("--fps", type=int); p.add_argument("--draft", action="store_true")
    p.add_argument("--bgm"); p.add_argument("--bgm-volume", type=float, default=0.14)
    p.add_argument("--no-audio", action="store_true")
    p.add_argument("--workers", type=int); p.add_argument("--frame-timeout", type=float)
    p.add_argument("--aspect"); p.set_defaults(fn=cmd_render)
    p = sub.add_parser("probe"); p.add_argument("video"); p.set_defaults(fn=cmd_probe)
    p = sub.add_parser("qa"); p.add_argument("proj"); p.set_defaults(fn=cmd_qa)
    p = sub.add_parser("deliver"); p.add_argument("proj"); p.add_argument("--chugao", required=True)
    p.add_argument("--name", required=True); p.add_argument("--archive"); p.set_defaults(fn=cmd_deliver)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
