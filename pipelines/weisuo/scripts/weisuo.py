#!/usr/bin/env python3
"""weisuo 编排 CLI —— 孟菲斯微缩（Memphis Diorama）管线。

  python weisuo/scripts/weisuo.py probe  012_pomelo                    看工程现状
  python weisuo/scripts/weisuo.py stills 012_pomelo --times 3,12,28    静帧
  python weisuo/scripts/weisuo.py render 012_pomelo                    无声母版 out/video.mp4
  python weisuo/scripts/weisuo.py mux    012_pomelo                    预母带 + 合流 → out/<名>.mp4
  python weisuo/scripts/weisuo.py qa     012_pomelo                    分辨率/帧率/帧数/音轨/响度
  python weisuo/scripts/weisuo.py new    013_xxx                   从骨架复制一份工程

从仓库根运行。只用标准库；渲染交给共享运行时 vendor/runtime/render-legacy.mjs。
字体在渲染前必须到位：python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline weisuo
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PIPELINE = Path(__file__).resolve().parent.parent
PROJECTS = PIPELINE / "projects"
ROOT = PIPELINE.parent.parent
RENDER_CANDIDATES = [
    ROOT / "vendor" / "runtime" / "render-legacy.mjs",
    ROOT / "vendor" / "模板库" / "runtime" / "render-legacy.mjs",
]
SKELETON = "012_pomelo"
GRAIN = 6
LUFS, TRUE_PEAK = -14.0, -1.5
SOURCES = ["index.html", "main.js", "memphis.js", "people.js", "lib/three.module.js"]
FONTS = ["NotoSansSC-400.woff2", "NotoSansSC-600.woff2", "InterTight-400.woff2", "InterTight-600.woff2", "IBMPlexMono-400.woff2"]
FONT_GLOB = None


def die(msg):
    print(f"✗ {msg}", file=sys.stderr)
    sys.exit(1)


def renderer():
    for p in RENDER_CANDIDATES:
        if p.exists():
            return p
    die("找不到共享渲染器 vendor/runtime/render-legacy.mjs（先 git pull，或检查 vendor 是否落地）")


def resolve(slug):
    if not PROJECTS.is_dir():
        die(f"{PROJECTS} 不存在")
    exact = PROJECTS / slug
    if exact.is_dir():
        return exact
    hits = [p for p in PROJECTS.iterdir() if p.is_dir() and slug.lower() in p.name.lower()]
    if len(hits) == 1:
        return hits[0]
    if not hits:
        die(f"projects/ 下找不到匹配 {slug!r} 的工程")
    die("匹配到多个工程：" + "、".join(p.name for p in hits))


def run(cmd):
    print("· " + " ".join(str(c) for c in cmd))
    r = subprocess.run([str(c) for c in cmd])
    if r.returncode != 0:
        die(f"命令失败（exit {r.returncode}）")


def film_len(p):
    """片长写在哪由原工程决定，抓不到就交给渲染器读页面的 window.DUR。"""
    for f, pat in (("film.js", r"export const DUR\s*=\s*([\d.]+)"),
                   ("main.js", r"const DUR\s*=\s*([\d.]+)"),
                   ("scene.js", r"const DUR\s*=\s*([\d.]+)"),
                   ("story.js", r"export const DUR\s*=\s*([\d.]+)")):
        q = p / f
        if q.exists():
            m = re.search(pat, q.read_text(encoding="utf-8", errors="replace"))
            if m:
                return float(m.group(1))
    return None


def subs(p):
    f = p / "subs.json"
    if not f.exists():
        return []
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except Exception as exc:
        die(f"subs.json 解析失败：{exc}")


def ffprobe_json(path, streams="v"):
    r = subprocess.run(["ffprobe", "-hide_banner", "-v", "error", "-select_streams", streams,
                        "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames,duration",
                        "-show_entries", "format=duration,size", "-of", "json", str(path)],
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        die(f"ffprobe 读不了 {path}：{r.stderr.strip()}")
    return json.loads(r.stdout)


def loudnorm_json(path, chain):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", chain + ":print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8")
    txt = r.stderr
    if "input_i" not in txt:
        die(f"loudnorm 测量失败：{txt.strip().splitlines()[-1] if txt.strip() else '无输出'}")
    return json.loads(txt[txt.rindex("{"):txt.rindex("}") + 1])


def loudness(path):
    try:
        js = loudnorm_json(path, "loudnorm=I=-14:TP=-1.2")
    except SystemExit:
        return None, None
    return float(js["input_i"]), float(js["input_tp"])


def cmd_new(a):
    src = PROJECTS / SKELETON
    if not src.is_dir():
        die(f"骨架 {SKELETON} 不见了")
    dst = PROJECTS / a.slug
    if dst.exists():
        die(f"{dst} 已存在")
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("out", "*.mp4", "*.wav", "*.jpg", "*.srt", "__pycache__"))
    for f in ("voice/voice.wav", "voice/voice_mix.wav"):
        (dst / f).unlink(missing_ok=True)
    print(f"✓ {dst}")
    print("  下一步：改时间轴、这一页的世界、字幕文本，再跑 python tools/sync_fonts.py --pipeline weisuo 把字体放进工程。")


def cmd_stills(a):
    p = resolve(a.slug)
    run(["node", renderer(), p, "--still", a.times])


def cmd_render(a):
    p = resolve(a.slug)
    length = a.end if a.end is not None else film_len(p)
    out = a.out or (p / "out" / "video.mp4")
    cmd = ["node", renderer(), p, "--fps", str(a.fps), "--out", out]
    if a.start is not None:
        cmd += ["--from", str(a.start)]
    if length is not None:
        cmd += ["--to", str(length)]
    run(cmd)


def cmd_mux(a):
    p = resolve(a.slug)
    video = Path(a.video) if a.video else (p / "out" / "video.mp4")
    if not video.exists():
        die(f"{video} 不存在，先跑 render")
    voice = Path(a.voice) if a.voice else (p / "voice" / "voice.wav")
    if not voice.exists():
        die(f"{voice} 不存在：把配音放进去，或用 --voice 指定")
    mix = p / "voice" / "voice_mix.wav"
    out = Path(a.out) if a.out else (p / "out" / f"{p.name.split('_', 1)[-1]}.mp4")
    pre = "acompressor=threshold=-18dB:ratio=3:attack=5:release=60"
    m = loudnorm_json(voice, f"{pre},loudnorm=I={int(LUFS)}:TP=-1.2")
    gain = LUFS - float(m["input_i"])
    print(f"  · 配音压缩后 {m['input_i']} LUFS / TP {m['input_tp']} / LRA {m['input_lra']}  → 补 {gain:+.2f} dB")
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", voice,
         "-af", f"{pre},volume={gain:.2f}dB,alimiter=limit=-1.5dB:level=false",
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", mix])
    vcodec = ["-c:v", "copy"]
    vf = []
    if a.grain > 0:
        vcodec = ["-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p"]
        vf = ["-vf", f"noise=alls={a.grain}:allf=t+u"]
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", video, "-i", mix,
           "-map", "0:v:0", "-map", "1:a:0"] + vcodec + vf + [
           "-af", "apad,alimiter=limit=-1.6dB:level=false",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
           "-shortest", "-movflags", "+faststart", out]
    run(cmd)
    lufs, tp = loudness(out)
    if lufs is None:
        print(f"✓ {out}")
    else:
        flag = "" if abs(lufs - LUFS) < 0.8 and tp <= TRUE_PEAK + 0.1 else "  ← 偏离目标"
        print(f"✓ {out}\n   {lufs:.1f} LUFS · 峰值 {tp:.1f} dBFS{flag}")


def cmd_srt(a):
    p = resolve(a.slug)
    cues = subs(p)
    if not cues:
        die("本工程没有 subs.json：字幕由 JS 现场排字（不是外挂字幕源），要 SRT 就先在工程里放一份 subs.json")
    def ts(t):
        h, rem = divmod(int(t), 3600)
        m, s = divmod(rem, 60)
        ms = int(round((t - int(t)) * 1000))
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    out = Path(a.out) if a.out else (p / "out" / f"{p.name.split('_', 1)[-1]}.srt")
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    for i, c in enumerate(cues, 1):
        lines += [str(i), f"{ts(float(c['t0']))} --> {ts(float(c['t1']))}", str(c["text"]), ""]
    out.write_text("\n".join(lines), encoding="utf-8-sig")
    print(f"✓ {out}  {len(cues)} 条")


def cmd_qa(a):
    p = resolve(a.slug)
    cands = sorted((p / "out").glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not cands:
        die("out/ 下没有 mp4")
    f = cands[0]
    v = ffprobe_json(f, "v")
    au = ffprobe_json(f, "a")
    st = v["streams"][0]
    num, den = st["r_frame_rate"].split("/")
    fps = round(int(num) / int(den), 2)
    dur = float(v["format"]["duration"])
    frames = int(st.get("nb_frames") or round(dur * fps))
    has_audio = bool(au.get("streams"))
    lufs, tp = loudness(f) if has_audio else (None, None)
    try:
        fps_expect = int(json.loads((PIPELINE / "pipeline.json").read_text(encoding="utf-8"))["meta"].get("fps", 24))
    except Exception:
        fps_expect = 24
    checks = [
        ("分辨率 1920×1080", st["width"] == 1920 and st["height"] == 1080, f"{st['width']}×{st['height']}"),
        (f"帧率 = 声明的 {fps_expect}", abs(fps - fps_expect) < 0.02, f"{fps}"),
        ("帧数 = 时长×帧率", abs(frames - round(dur * fps)) <= 1, f"{frames} / {round(dur * fps)}"),
        ("有音轨（无配音时可缺）", True, (au.get("streams") or [{}])[0].get("codec_name", "—（默片）")),
        (f"响度 ≈ {LUFS:.0f} LUFS", (not has_audio) or (lufs is not None and abs(lufs - LUFS) <= 1.0),
         (f"{lufs:.1f}" if lufs else "—（默片）")),
        (f"峰值 ≤ {TRUE_PEAK} dBFS", (not has_audio) or (tp is not None and tp <= TRUE_PEAK + 0.1),
         (f"{tp:.1f}" if tp else "—（默片）")),
    ]
    print(f"· {f}  {dur:.2f}s / {frames} 帧 / {int(v['format']['size'])/1048576:.1f} MB")
    ok = True
    for name, good, val in checks:
        print(f"  {'✓' if good else '✗'} {name}：{val}")
        ok &= good
    sys.exit(0 if ok else 1)


def cmd_probe(a):
    p = resolve(a.slug)
    print(f"· 工程 {p}")
    for f in SOURCES + [f"fonts/{x}" for x in FONTS] + ["voice/voice.wav"]:
        q = p / f
        print(f"  {'✓' if q.exists() else '·'} {f}" + (f"  {q.stat().st_size/1024:.0f} KB" if q.exists() else ""))
    if FONT_GLOB:
        n = len(list((p / "fonts").glob("*.woff2"))) + len(list((p / "fonts").glob("*.ttf")))
        print(f"  {'✓' if n else '·'} fonts/ 里 {n} 个字体文件（按片子裁的子集，随工程入库）")
    length = film_len(p)
    print(f"  DUR {length}s → {round(length * 24)} 帧 @24fps" if length else "  DUR 由页面自己给（渲染器读 window.DUR）")
    cues = subs(p)
    print(f"  字幕 {len(cues)} 条" if cues else "  字幕：JS 内联排字（无 subs.json）")
    if (p / "out").is_dir():
        for f in sorted((p / "out").glob("*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True)[:3]:
            print(f"  成片 {f.name}  {f.stat().st_size/1048576:.1f} MB")


def main():
    ap = argparse.ArgumentParser(prog="weisuo", description="孟菲斯微缩（Memphis Diorama）管线")
    sub = ap.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("new", help="从骨架复制一份工程"); n.add_argument("slug"); n.set_defaults(fn=cmd_new)
    s = sub.add_parser("stills", help="静帧"); s.add_argument("slug"); s.add_argument("--times", required=True); s.set_defaults(fn=cmd_stills)
    r = sub.add_parser("render", help="无声母版"); r.add_argument("slug"); r.add_argument("--fps", type=int, default=24)
    r.add_argument("--start", type=float, default=None); r.add_argument("--end", type=float, default=None)
    r.add_argument("--out", default=None); r.set_defaults(fn=cmd_render)
    m = sub.add_parser("mux", help="预母带 + 合流"); m.add_argument("slug"); m.add_argument("--video", default=None)
    m.add_argument("--voice", default=None); m.add_argument("--out", default=None)
    m.add_argument("--grain", type=int, default=GRAIN); m.set_defaults(fn=cmd_mux)
    sr = sub.add_parser("srt", help="导出 SRT（要有 subs.json）"); sr.add_argument("slug"); sr.add_argument("--out", default=None); sr.set_defaults(fn=cmd_srt)
    q = sub.add_parser("qa", help="质检"); q.add_argument("slug"); q.set_defaults(fn=cmd_qa)
    pr = sub.add_parser("probe", help="看现状"); pr.add_argument("slug"); pr.set_defaults(fn=cmd_probe)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
