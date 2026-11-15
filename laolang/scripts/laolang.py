#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""laolang.py — 上海美影 1980 手绘赛璐璐（老狼请客式）管线编排（Auto-Video）

用法：
  python scripts/laolang.py new <工程目录> [--title 片名]
  python scripts/laolang.py vo <工程目录> --src 配音.wav --text 口播稿.txt [--lead 0.0] [--cut 秒]
  python scripts/laolang.py asr <旁白.wav> [--start 0] [--dur 秒] [--out 工程/review/asr_a.json] [--model small]
  python scripts/laolang.py rebuild <工程目录> --asr <asr1.json> [asr2.json ...] [--sample-end 20.12]
  python scripts/laolang.py shots <工程目录|页面.html> [--video 成片.mp4]
  python scripts/laolang.py sync <工程目录|页面.html> [--video 成片.mp4] [--ocr] [--no-audio]
  python scripts/laolang.py check <工程目录>
  python scripts/laolang.py stills <工程目录> [--times 1,3.5,8] [--aspect 9:16]
  python scripts/laolang.py render <工程目录> [--scale 0.6667] [--fps 30] [--draft] [--bgm 音乐.mp3] [--bgm-volume 0.14]
  python scripts/laolang.py probe <成片.mp4>
  python scripts/laolang.py qa <工程目录>
  python scripts/laolang.py short-qa <成片.mp4> <输出目录> [shots.json]
  python scripts/laolang.py covers <工程目录> --title 片名 [--subtitle 副标题] [--time 秒]   # 备用：截帧封面
  python scripts/laolang.py deliver <工程目录> --name <片名> [--title 片名] [--seq 1] [--chugao <根目录>]
  # 交付契约见 references/delivery.md：根目录默认 <laolang>/out，子目录 "<序号> <片名>/"
  # 移动成片后，封面与发布信息一律调用 D:\@kaifa\fengmian（build / covers / gate）

前置：Node 18+、ffmpeg/ffprobe 在 PATH、Chrome 或 Edge（设置 CHROME_PATH；Windows 下未设时自动找本机 Chrome/Edge）。
short-qa 另需 numpy 与 Pillow（可选；没有就只用 qa 的 ffmpeg 检查）。
shots/sync 校验报告：完整 sync 写 review/sync_qa.json，单项写 review/sync_qa_<cmd>.json
（互不覆盖）；没有 sample.html 的工程用 index.html。
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

STYLE = "laolang"
LABEL = "上海美影手绘赛璐璐"
VIDEO_NAME = "video-16x9.mp4"
# 4:3 片门左右留黑是设计，不是黑帧；只有整帧黑 >2 s 才需要人工确认
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
    # goldenage.js 是冻结的稳定版（关闭片门晃动、静态颗粒），laolang.js 是 60 s 定稿版；
    # toon.js 是 toon-cast 定稿人物（lib/toon.js），cast-lite.js 提供 CAST.draw / lidAt。
    for name in ("core.js", "promo.js", "goldenage.js", "laolang.js", "act.js", "toon.js", "cast-lite.js"):
        src = os.path.join(RUNTIME, name)
        if not os.path.exists(src):
            sys.exit("运行时缺失：%s" % src)
        shutil.copy2(src, os.path.join(lib, name))
    # 模板自带的项目专属 lib/story.js（SHOTS + cue + win）不动


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
    print("模板是玄奘 60 秒样片的完整做法（4:3 片门 / 定稿人物 / 24 动作 / 无 BGM）；下一步：")
    print("  1. 改 brief.md（事实表）与 storyboard.md（分镜），所有屏幕文字只从这里来")
    print("  2. 配音：python %s vo %s --src 配音.wav --text 口播稿.txt" % (__file__, proj))
    print("  3. 改 index.html 的分幕与画面、score.js（可选）、sound.js")
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
    extra = ["--stills", args.times] if args.times else ["--stills", "2,8,15,25"]
    if args.aspect:
        extra += ["--aspect", args.aspect]
    render_cmd(args, extra)


def cmd_short_qa(args):
    """逐帧黑/白/冻结/pop 检查（完整样片用；需要 numpy + Pillow）。"""
    script = os.path.join(HERE, "short_qa.py")
    if not os.path.exists(script):
        sys.exit("缺少 scripts/short_qa.py")
    cmd = [sys.executable, script, os.path.abspath(args.video), os.path.abspath(args.outdir)]
    if args.shots:
        cmd.append(os.path.abspath(args.shots))
    sys.exit(run(cmd))


def sync_qa_cmd(args, sub):
    cmd = [sys.executable, os.path.join(HERE, "sync_qa.py"), sub, proj_arg(args.proj)]
    for name in ("html", "video"):
        v = getattr(args, name, None)
        if v:
            cmd += ["--" + name, v]
    for name in ("min", "max", "tol", "min_gap", "offset", "start", "asr_model"):
        v = getattr(args, name, None)
        if v is not None:
            cmd += ["--" + name.replace("_", "-"), str(v)]
    for name in ("ocr", "no_audio"):
        if getattr(args, name, False):
            cmd += ["--" + name.replace("_", "-")]
    sys.exit(run(cmd))


def cmd_shots(args):
    sync_qa_cmd(args, "shots")


def cmd_sync(args):
    sync_qa_cmd(args, "sync")


def cmd_asr(args):
    cmd = [sys.executable, os.path.join(HERE, "asr_probe.py"), os.path.abspath(args.wav),
           "--model", args.model]
    if args.start:
        cmd += ["--start", str(args.start)]
    if args.dur:
        cmd += ["--dur", str(args.dur)]
    if args.out:
        cmd += ["--out", os.path.abspath(args.out)]
    sys.exit(run(cmd))


def cmd_rebuild(args):
    proj = proj_arg(args.proj)
    asr = []
    for p in args.asr:
        q = p if os.path.isabs(p) else (os.path.abspath(p) if os.path.exists(p) else os.path.join(proj, p))
        asr.append(os.path.abspath(q))
    cmd = [sys.executable, os.path.join(HERE, "rebuild_timeline.py"),
           "--project", proj, "--asr"] + asr
    if args.full_before is not None:
        cmd += ["--full-before", str(args.full_before)]
    if args.b_before is not None:
        cmd += ["--b-before", str(args.b_before)]
    if args.sample_end is not None:
        cmd += ["--sample-end", str(args.sample_end)]
    if args.dry:
        cmd += ["--dry"]
    sys.exit(run(cmd))


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
    if args.audio:
        extra += ["--audio"]
    if args.remux:
        extra += ["--remux"]
    if args.from_t is not None:
        extra += ["--from", str(args.from_t)]
    if args.to_t is not None:
        extra += ["--to", str(args.to_t)]
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


FONT_CANDIDATES = [
    r"C:\Windows\Fonts\STXINGKA.TTF",       # 华文行楷：标题毛笔
    r"C:\Windows\Fonts\STXINWEI.TTF",
    r"C:\Windows\Fonts\msyhbd.ttc",
    r"C:\Windows\Fonts\msyh.ttc",
    r"C:\Windows\Fonts\simhei.ttf",
    "/System/Library/Fonts/STHeiti Medium.ttc",
    "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc",
]


def _font_path():
    for p in FONT_CANDIDATES:
        if p and os.path.exists(p):
            return p
    return None


def gate_frame(video, t, dest):
    """裁出 laolang 的 4:3 片门（16:9 画面中间，左右是设计留黑）。"""
    info = probe(video)
    w, h = info["width"], info["height"]
    gw = min(w, int(round(h * 4 / 3)))
    gh = min(h, int(round(w * 3 / 4)))
    x, y = (w - gw) // 2, (h - gh) // 2
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    rc = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", "%.3f" % t,
                         "-i", video, "-frames:v", "1",
                         "-vf", "crop=%d:%d:%d:%d" % (gw, gh, x, y), dest]).returncode
    if rc != 0 or not os.path.exists(dest):
        sys.exit("抽片门帧失败：%s @ %.3fs" % (video, t))
    return dest, gw, gh


def _vgrad(size, stops):
    """竖直线性渐变蒙版；stops = [(y, alpha), ...]，alpha 0–255。"""
    from PIL import Image
    w, h = size
    mask = Image.new("L", (1, h))
    px = mask.load()
    stops = sorted(stops)
    for y in range(h):
        if y <= stops[0][0]:
            a = stops[0][1]
        elif y >= stops[-1][0]:
            a = stops[-1][1]
        else:
            a = 0
            for i in range(len(stops) - 1):
                y0, a0 = stops[i]
                y1, a1 = stops[i + 1]
                if y0 <= y <= y1:
                    a = a0 if y1 == y0 else int(round(a0 + (a1 - a0) * (y - y0) / (y1 - y0)))
                    break
        px[0, y] = max(0, min(255, a))
    return mask.resize((w, h))


def _draw_centered(draw, cx, y, text, font, fill, stroke=3, stroke_fill=(20, 14, 8)):
    draw.text((cx, y), text, font=font, fill=fill, anchor="mm",
              stroke_width=stroke, stroke_fill=stroke_fill)


def make_covers(proj, video, t, title, subtitle):
    """从成片某一帧生成 4:3 / 3:4 两张封面（备用方案；正式封面用即梦提示词生成）。"""
    try:
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
    except Exception:
        sys.exit("covers 需要 Pillow：用 D:\\@kaifa\\tools\\python-media\\Scripts\\python.exe 运行")
    fp = _font_path()
    if not fp:
        sys.exit("找不到中文字体（试过 STXINGKA / STXINWEI / msyh / simhei）")

    out_dir = os.path.join(proj, "out")
    gate_png = os.path.join(proj, "review", "_cover_gate.png")
    _, gw, gh = gate_frame(video, t, gate_png)
    gate = Image.open(gate_png).convert("RGB")
    # 成片每帧都带烧录字幕：把片门底部 150 px 的亮色字迹 inpaint 掉，免得和封面副标题叠字
    try:
        import cv2
        import numpy as np
        im = cv2.imdecode(np.fromfile(gate_png, dtype=np.uint8), cv2.IMREAD_COLOR)
        hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
        mask = np.zeros(im.shape[:2], np.uint8)
        roi = hsv[im.shape[0] - 150:, :, :]
        mask[im.shape[0] - 150:, :] = (((roi[:, :, 2] > 190) & (roi[:, :, 1] < 70)) * 255).astype(np.uint8)
        mask = cv2.dilate(mask, np.ones((7, 7), np.uint8), iterations=2)
        if mask.any():
            im = cv2.inpaint(im, mask, 4, cv2.INPAINT_TELEA)
        gate = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    except Exception as e:
        print("字幕 inpaint 跳过（%s），改裁底部 130 px" % e)
        gate = gate.crop((0, 0, gw, gh - 130))
    gold = (216, 165, 63)
    cream = (239, 227, 196)

    # ---------- 4:3 横版 1440×1080 ----------
    c43 = gate.resize((1440, 1080), Image.LANCZOS).convert("RGBA")
    dark = Image.new("RGBA", c43.size, (8, 10, 12, 255))
    top_a = _vgrad(c43.size, [(0, 255), (280, 235), (420, 0)])
    bot_a = _vgrad(c43.size, [(950, 0), (1080, 160)])
    c43 = Image.composite(dark, c43, top_a)
    c43 = Image.composite(dark, c43, bot_a)
    d = ImageDraw.Draw(c43)
    f_title = ImageFont.truetype(fp, 138)
    f_sub = ImageFont.truetype(fp, 40)
    _draw_centered(d, 720, 128, title, f_title, gold)
    d.line([(430, 214), (1010, 214)], fill=gold + (210,), width=3)
    if subtitle:
        _draw_centered(d, 720, 1015, subtitle, f_sub, cream, stroke=2)
    p43 = os.path.join(out_dir, "cover_4x3.png")
    c43.convert("RGB").save(p43, quality=95)

    # ---------- 3:4 竖版 1080×1440 ----------
    art_h = int(round(1080 * gate.height / gate.width))
    art = gate.resize((1080, art_h), Image.LANCZOS)
    y_art = 480
    bg = art.resize((1080, 1440), Image.LANCZOS).filter(ImageFilter.GaussianBlur(28))
    bg = Image.eval(bg, lambda v: int(v * 0.42)).convert("RGBA")
    c34 = bg.copy()
    c34.paste(art, (0, y_art))
    top_a = _vgrad((1080, 1440), [(0, 250), (470, 225), (480, 120), (600, 0)])
    bot_a = _vgrad((1080, 1440), [(y_art + art_h, 0), (1440, 250)])
    dark = Image.new("RGBA", c34.size, (8, 10, 12, 255))
    c34 = Image.composite(dark, c34, top_a)
    c34 = Image.composite(dark, c34, bot_a)
    d = ImageDraw.Draw(c34)
    f_title = ImageFont.truetype(fp, 146)
    f_sub = ImageFont.truetype(fp, 42)
    _draw_centered(d, 540, 235, title, f_title, gold)
    d.line([(240, 325), (840, 325)], fill=gold + (210,), width=3)
    if subtitle:
        _draw_centered(d, 540, 1352, subtitle, f_sub, cream, stroke=2)
    p34 = os.path.join(out_dir, "cover_3x4.png")
    c34.convert("RGB").save(p34, quality=95)
    return p43, p34


def cmd_covers(args):
    proj = proj_arg(args.proj)
    video = find_video(proj) if not args.video else os.path.abspath(args.video)
    if not video:
        sys.exit("找不到成片：先 render")
    p43, p34 = make_covers(proj, video, args.time, args.title, args.subtitle or "")
    print("cover_4x3", p43)
    print("cover_3x4", p34)


def _find_first(proj, names):
    for root in (os.path.join(proj, "out"), proj):
        for name in names:
            p = os.path.join(root, name)
            if os.path.exists(p):
                return p
    return None


def _img_size(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                          "-show_entries", "stream=width,height", "-of", "csv=p=0", path],
                         capture_output=True, text=True, encoding="utf-8", errors="replace")
    if out.returncode != 0:
        return None
    try:
        w, h = out.stdout.strip().split(",")[:2]
        return int(w), int(h)
    except Exception:
        return None


def next_delivery_seq(root):
    n = 0
    if os.path.isdir(root):
        for d in os.listdir(root):
            m = re.match(r"(\d{1,4})(?:\s|_|-)", d)
            if m:
                n = max(n, int(m.group(1)))
    return n + 1


def _delivery_cfg(proj):
    for p in (os.path.join(proj, "delivery.json"), os.path.join(proj, "out", "delivery.json")):
        if os.path.exists(p):
            with open(p, encoding="utf-8-sig") as f:
                return json.load(f)
    return {}


def _fengmian():
    d = os.environ.get("FENGMIAN_DIR", r"D:\@kaifa\fengmian")
    p = os.path.join(d, "fengmian.py")
    if not os.path.exists(p):
        sys.exit("找不到 fengmian：%s（设 FENGMIAN_DIR 指向 fengmian 目录）" % p)
    return d, p


def run_fengmian(sub, argv):
    """封面与发布信息一律交给 fengmian（宝哥 2026-11-11 定），不在 laolang 里重复实现。"""
    d, p = _fengmian()
    cmd = [sys.executable, p, sub] + argv
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=d).returncode


def cmd_deliver(args):
    """交付契约（2026-11-11 宝哥定）：out/<序号> <片名>/。

    移动成片 + 建交付子目录由本命令做；封面与发布信息一律调用 D:\\@kaifa\\fengmian：
    fengmian build → 发布信息.txt + 源文件/封面提示词-4比3|3比4.txt + 封面元信息.json
    fengmian covers → 封面-4比3.png（2048×1536）/ 封面-3比4.png（1536×2048）
    fengmian gate → 交付根多余封面/提示词门禁
    详见 references/delivery.md。
    """
    proj = proj_arg(args.proj)
    video = find_video(proj)
    if not video:
        sys.exit("找不到成片：先 python scripts/%s.py render %s" % (STYLE, proj))
    report, ok = qa_report(proj, video)

    name = args.name
    title = args.title or name
    root = os.path.abspath(args.chugao or os.path.join(ROOT, "out"))
    seq = args.seq or next_delivery_seq(root)
    dest = os.path.join(root, "%03d %s" % (seq, title))
    if os.path.exists(dest) and not args.force:
        sys.exit("交付目录已存在：%s（换 --seq，或确认后加 --force）" % dest)

    srt = None
    for nm in ("captions-16x9.srt", "captions.srt"):
        p = os.path.join(proj, "out", nm)
        if os.path.exists(p):
            srt = p
            break
    if not srt:
        tl = os.path.join(proj, "timeline.json")
        if os.path.exists(tl):
            srt = make_srt(tl, os.path.join(proj, "out", "captions-16x9.srt"))
            print("由 timeline.json 生成字幕：", srt)
    if not srt or not os.path.exists(srt):
        sys.exit("交付需要字幕 srt（fengmian 用它解析文案）：先重建 out/captions-16x9.srt")
    credits = ensure_credits(proj)

    # 1) 建交付子目录，先放成片；srt/署名进 源文件/
    os.makedirs(dest, exist_ok=True)
    shutil.copy2(video, os.path.join(dest, name + "_全片.mp4"))
    print("deliver", name + "_全片.mp4", round(os.path.getsize(video) / 1048576, 2), "MB")
    extra = os.path.join(dest, "源文件")
    os.makedirs(extra, exist_ok=True)
    for src, dst in ((srt, name + "_字幕.srt"), (credits, name + "_署名.txt")):
        if src and os.path.exists(src):
            shutil.copy2(src, os.path.join(extra, dst))
            print("  源文件/", dst)

    # 2) fengmian build：发布信息 + 两张封面提示词 + 元信息
    cfg = _delivery_cfg(proj)
    build = ["--src", srt, "--out", dest, "--name", name,
             "--style", args.style or cfg.get("style", "laolang")]
    for key, opt in (("cover_main", "--main"), ("cover_sub", "--sub"),
                     ("publish_title", "--title"), ("tags", "--tags"),
                     ("scene43", "--scene43"), ("scene34", "--scene34")):
        val = cfg.get(key)
        if val:
            build += [opt, val]
    if run_fengmian("build", build) != 0:
        sys.exit("fengmian build 失败：发布信息或封面提示词未通过校验")

    # 3) fengmian covers：有 ARK_API_KEY 直出；没有就留提示词待出图
    if os.environ.get("ARK_API_KEY"):
        if run_fengmian("covers", ["--dir", dest, "--backend", "ark"]) != 0:
            sys.exit("fengmian covers 失败")
    else:
        print("未配置 ARK_API_KEY：封面未出图，提示词在 源文件/封面提示词-4比3.txt / -3比4.txt")

    # 4) 封面尺寸校验（fengmian 规格：4:3 = 2048×1536，3:4 = 1536×2048）
    missing = []
    for fn, want in (("封面-4比3.png", (2048, 1536)), ("封面-3比4.png", (1536, 2048))):
        p = os.path.join(dest, fn)
        if not os.path.exists(p):
            missing.append(fn)
        elif _img_size(p) != want:
            sys.exit("封面尺寸不对：%s = %s，要求 %s（重跑 fengmian covers）" % (fn, _img_size(p), want))
    if missing and not args.allow_missing:
        sys.exit("缺少封面：%s（配 ARK_API_KEY 后跑 fengmian covers，或确需先交加 --allow-missing）"
                 % "、".join(missing))

    # 5) fengmian 交付门禁：根目录只许成片 / 两张封面 / 发布信息 / 子目录
    gate_rc = run_fengmian("gate", ["--dir", dest, "--dry-run"])
    if gate_rc != 0 and not (missing and args.allow_missing):
        sys.exit("fengmian 交付门禁未过：根目录有多余封面/提示词")

    if args.archive:
        os.makedirs(args.archive, exist_ok=True)
        for src, dst in ((video, name + "_全片.mp4"),
                         (os.path.join(dest, "发布信息.txt"), "发布信息.txt"),
                         (os.path.join(dest, "封面-4比3.png"), "封面-4比3.png"),
                         (os.path.join(dest, "封面-3比4.png"), "封面-3比4.png")):
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(args.archive, dst))
        print("archive", args.archive)
    print("DELIVERY", dest)
    sys.exit(0 if ok else 1)


def main():
    ap = argparse.ArgumentParser(description="%s · %s 管线编排" % (STYLE, LABEL))
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("new"); p.add_argument("dir"); p.add_argument("--title"); p.set_defaults(fn=cmd_new)
    p = sub.add_parser("vo"); p.add_argument("proj"); p.add_argument("--src", required=True)
    p.add_argument("--text", required=True); p.add_argument("--lead", type=float, default=0.0)
    p.add_argument("--cut", type=float); p.add_argument("--fixed")
    p.add_argument("--voice", default="zh-CN-YunyangNeural"); p.set_defaults(fn=cmd_vo)
    p = sub.add_parser("check"); p.add_argument("proj"); p.set_defaults(fn=cmd_check)
    p = sub.add_parser("stills"); p.add_argument("proj"); p.add_argument("--times")
    p.add_argument("--aspect"); p.set_defaults(fn=cmd_stills)
    p = sub.add_parser("render"); p.add_argument("proj"); p.add_argument("--scale", type=float)
    p.add_argument("--fps", type=int); p.add_argument("--draft", action="store_true")
    p.add_argument("--bgm"); p.add_argument("--bgm-volume", type=float, default=0.14)
    p.add_argument("--no-audio", action="store_true")
    p.add_argument("--audio", action="store_true", help="sound only → out/audio.wav")
    p.add_argument("--remux", action="store_true", help="rebuild the sound track onto the existing video")
    p.add_argument("--from", dest="from_t", type=float, help="segment start (s)")
    p.add_argument("--to", dest="to_t", type=float, help="segment end (s)")
    p.add_argument("--workers", type=int); p.add_argument("--frame-timeout", type=float)
    p.add_argument("--aspect"); p.set_defaults(fn=cmd_render)
    p = sub.add_parser("asr"); p.add_argument("wav"); p.add_argument("--start", type=float)
    p.add_argument("--dur", type=float); p.add_argument("--out"); p.add_argument("--model", default="small")
    p.set_defaults(fn=cmd_asr)
    p = sub.add_parser("rebuild"); p.add_argument("proj"); p.add_argument("--asr", nargs="+", required=True)
    p.add_argument("--full-before", type=float); p.add_argument("--b-before", type=float)
    p.add_argument("--sample-end", type=float); p.add_argument("--dry", action="store_true")
    p.set_defaults(fn=cmd_rebuild)
    for name, fn in (("shots", cmd_shots), ("sync", cmd_sync)):
        p = sub.add_parser(name); p.add_argument("proj"); p.add_argument("--html")
        p.add_argument("--video"); p.add_argument("--min", type=float, default=2.0)
        p.add_argument("--max", type=float, default=4.0); p.add_argument("--tol", type=float, default=0.35)
        p.add_argument("--min-gap", type=float, default=0.12)
        p.add_argument("--start", type=float, default=0.0)
        if name == "sync":
            p.add_argument("--offset", type=float, default=0.0); p.add_argument("--asr-model", default="small")
            p.add_argument("--ocr", action="store_true"); p.add_argument("--no-audio", action="store_true")
        p.set_defaults(fn=fn)
    p = sub.add_parser("probe"); p.add_argument("video"); p.set_defaults(fn=cmd_probe)
    p = sub.add_parser("qa"); p.add_argument("proj"); p.set_defaults(fn=cmd_qa)
    p = sub.add_parser("short-qa"); p.add_argument("video"); p.add_argument("outdir")
    p.add_argument("--shots"); p.set_defaults(fn=cmd_short_qa)
    p = sub.add_parser("covers"); p.add_argument("proj")
    p.add_argument("--title", required=True); p.add_argument("--subtitle", default="")
    p.add_argument("--time", type=float, default=0.0); p.add_argument("--video")
    p.set_defaults(fn=cmd_covers)
    p = sub.add_parser("deliver"); p.add_argument("proj")
    p.add_argument("--chugao", help="交付根目录，默认 <laolang>/out")
    p.add_argument("--name", required=True, help="片名：成片叫 <片名>_全片.mp4")
    p.add_argument("--title", help="子目录片名，默认同 --name")
    p.add_argument("--seq", type=int, help="序号，默认取 out/ 里最大序号 +1")
    p.add_argument("--style", help="fengmian 风格预设（laolang / tuiyan / auto），默认读 delivery.json")
    p.add_argument("--archive"); p.add_argument("--allow-missing", action="store_true")
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_deliver)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
