#!/usr/bin/env python3
"""gangbi 编排 CLI —— 钢笔淡彩（Urban Sketch · Pen & Wash）管线。

  python gangbi/scripts/gangbi.py probe  012_wind                    看工程现状
  python gangbi/scripts/gangbi.py stills 012_wind --times 3,12,28    静帧（改了节拍先看它）
  python gangbi/scripts/gangbi.py render 012_wind                    无声母版 out/video.mp4
  python gangbi/scripts/gangbi.py mux    012_wind                    预母带 + 合流 → out/<名>.mp4
  python gangbi/scripts/gangbi.py srt    012_wind                    从 subs.json 导出 SRT
  python gangbi/scripts/gangbi.py qa     012_wind                    分辨率/帧率/帧数/音轨/响度
  python gangbi/scripts/gangbi.py new    013_xxx                     从 012 骨架复制一份工程

从仓库根运行。只用标准库；渲染交给共享运行时 vendor/runtime/render-legacy.mjs。
字体在渲染前必须到位：python tools/sync_fonts.py --fetch。
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PIPELINE = Path(__file__).resolve().parent.parent      # gangbi/
PROJECTS = PIPELINE / "projects"
ROOT = PIPELINE.parent.parent                                  # 仓库根
# 共享运行时只有一个源。历史上有的机器上它叫 vendor/模板库/runtime，两处都认，
# 免得脚本在别人的 checkout 上找不到渲染器。
RENDER_CANDIDATES = [
    ROOT / "vendor" / "runtime" / "render-legacy.mjs",
    ROOT / "vendor" / "模板库" / "runtime" / "render-legacy.mjs",
]
SKELETON = "012_wind"
GRAIN = 0                # 纸齿已经画在画面里，不再叠噪点
LUFS, TRUE_PEAK = -14.0, -1.5


def die(msg):
    print(f"✗ {msg}", file=sys.stderr)
    sys.exit(1)


def renderer():
    for p in RENDER_CANDIDATES:
        if p.exists():
            return p
    die("找不到共享渲染器 vendor/runtime/render-legacy.mjs（先 git pull，或检查 vendor 是否落地）")


def resolve(slug):
    """slug 可以是完整目录名，也可以是唯一前缀（012 / wind）。"""
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
    """片长写在 film.js 的 const DUR —— 画面时长以它为准，字幕/音频都要对得上。"""
    f = p / "film.js"
    if not f.exists():
        return None
    m = re.search(r"const DUR\s*=\s*([\d.]+)", f.read_text(encoding="utf-8", errors="replace"))
    return float(m.group(1)) if m else None


def subs(p):
    """字幕只有一个源：工程内的 subs.json（[{"t0","t1","text"}]）。"""
    f = p / "subs.json"
    if not f.exists():
        return []
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except Exception as exc:
        die(f"subs.json 解析失败：{exc}")


def ffprobe_json(path, streams="v"):
    r = subprocess.run(["ffprobe", "-hide_banner", "-v", "error", "-select_streams", streams,
                        "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames,duration,sample_rate,channels",
                        "-show_entries", "format=duration,size", "-of", "json", str(path)],
                       capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        die(f"ffprobe 读不了 {path}：{r.stderr.strip()}")
    return json.loads(r.stdout)


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "loudnorm=print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8")
    txt = r.stderr
    try:
        js = json.loads(txt[txt.rindex("{"):txt.rindex("}") + 1])
        return float(js["input_i"]), float(js["input_tp"])
    except Exception:
        return None, None


def loudnorm_json(path, chain):
    """跑一遍 loudnorm 只为测量：返回 input_i / lra / tp / thresh / target_offset。"""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", chain + ":print_format=json",
                        "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8")
    txt = r.stderr
    if "input_i" not in txt:
        die(f"loudnorm 测量失败：{txt.strip().splitlines()[-1] if txt.strip() else '无输出'}")
    return json.loads(txt[txt.rindex("{"):txt.rindex("}") + 1])


# —— new ——
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
    print("  下一步：改 film.js 的 DUR 与事件、world.js 的地点、subs.json 的字幕、")
    print("          再跑 python tools/sync_fonts.py --pipeline gangbi 把字体放进工程。")


# —— stills ——
def cmd_stills(a):
    p = resolve(a.slug)
    run(["node", renderer(), p, "--still", a.times])


# —— render ——
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


# —— mux ——
def cmd_mux(a):
    p = resolve(a.slug)
    video = Path(a.video) if a.video else (p / "out" / "video.mp4")
    if not video.exists():
        die(f"{video} 不存在，先跑 render")
    voice = Path(a.voice) if a.voice else (p / "voice" / "voice.wav")
    if not voice.exists():
        die(f"{voice} 不存在：把配音放进去，或用 --voice 指定；这条线也可以完全不用配音")
    mix = p / "voice" / "voice_mix.wav"
    out = Path(a.out) if a.out else (p / "out" / f"{p.name.split('_', 1)[-1]}.mp4")

    # 1) 预母带：先压缩，再按实测电平精确补增益
    #    （loudnorm 的 measured_* 双遍在本机 ffmpeg 上不生效，实测只补了 0.4 dB；volume 增益可验证）
    pre = "acompressor=threshold=-18dB:ratio=3:attack=5:release=60"
    m = loudnorm_json(voice, f"{pre},loudnorm=I={int(LUFS)}:TP=-1.2")
    gain = LUFS - float(m["input_i"])
    print(f"  · 配音压缩后 {m['input_i']} LUFS / TP {m['input_tp']} / LRA {m['input_lra']}  → 补 {gain:+.2f} dB")
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", voice,
         "-af", f"{pre},volume={gain:.2f}dB,alimiter=limit=-1.5dB:level=false",
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", mix])

    # 2) 合流：视频按需重编码（要颗粒时），音频 AAC + limiter 保险
    vcodec = ["-c:v", "copy"]
    vf = []
    if a.grain > 0:
        vcodec = ["-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p"]
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
        flag = "" if abs(lufs - LUFS) < 0.8 and tp <= TRUE_PEAK + 0.1 else "  ← 偏离目标，重跑 mux 前先看 voice.wav"
        print(f"✓ {out}\n   {lufs:.1f} LUFS · 峰值 {tp:.1f} dBFS{flag}")


# —— srt ——
def ts(t):
    h, rem = divmod(int(t), 3600)
    m, s = divmod(rem, 60)
    ms = int(round((t - int(t)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def cmd_srt(a):
    p = resolve(a.slug)
    cues = subs(p)
    if not cues:
        die("subs.json 里没有字幕行（t0/t1/text）")
    out = Path(a.out) if a.out else (p / "out" / f"{p.name.split('_', 1)[-1]}.srt")
    out.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    for i, c in enumerate(cues, 1):
        lines += [str(i), f"{ts(float(c['t0']))} --> {ts(float(c['t1']))}", str(c["text"]), ""]
    out.write_text("\n".join(lines), encoding="utf-8-sig")
    print(f"✓ {out}  {len(cues)} 条")


# —— qa ——
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
    lufs, tp = loudness(f)
    has_audio = bool(au.get("streams"))

    checks = [
        ("分辨率 1920×1080", st["width"] == 1920 and st["height"] == 1080, f"{st['width']}×{st['height']}"),
        ("帧率 24", abs(fps - 24) < 0.02, f"{fps}"),
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


# —— probe ——
def cmd_probe(a):
    p = resolve(a.slug)
    print(f"· 工程 {p}")
    for f in ("index.html", "main.js", "film.js", "world.js", "poses.js", "engine.js", "subs.json",
              "fonts/Caveat.ttf", "fonts/ReenieBeanie.ttf", "voice/voice.wav"):
        q = p / f
        print(f"  {'✓' if q.exists() else '·'} {f}" + (f"  {q.stat().st_size/1024:.0f} KB" if q.exists() else ""))
    length = film_len(p)
    if length:
        print(f"  DUR {length}s → {round(length * 24)} 帧 @24fps")
    cues = subs(p)
    print(f"  字幕 {len(cues)} 条" + (f"，末条 {cues[-1]['t1']}s" if cues else ""))
    cands = sorted((p / "out").glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True) if (p / "out").is_dir() else []
    for f in cands[:4]:
        print(f"  成片 {f.name}  {f.stat().st_size/1048576:.1f} MB")


def main():
    ap = argparse.ArgumentParser(prog="gangbi", description="钢笔淡彩（Urban Sketch · Pen & Wash）管线")
    sub = ap.add_subparsers(dest="cmd", required=True)

    n = sub.add_parser("new", help="从骨架复制一份工程")
    n.add_argument("slug")
    n.set_defaults(fn=cmd_new)

    s = sub.add_parser("stills", help="静帧")
    s.add_argument("slug")
    s.add_argument("--times", required=True, help="逗号分隔的秒：3,12,28")
    s.set_defaults(fn=cmd_stills)

    r = sub.add_parser("render", help="无声母版")
    r.add_argument("slug")
    r.add_argument("--fps", type=int, default=24)
    r.add_argument("--start", type=float, default=None)
    r.add_argument("--end", type=float, default=None)
    r.add_argument("--out", default=None)
    r.set_defaults(fn=cmd_render)

    m = sub.add_parser("mux", help="预母带 + 合流")
    m.add_argument("slug")
    m.add_argument("--video", default=None)
    m.add_argument("--voice", default=None)
    m.add_argument("--out", default=None)
    m.add_argument("--grain", type=int, default=GRAIN)
    m.set_defaults(fn=cmd_mux)

    sr = sub.add_parser("srt", help="从 subs.json 导出 SRT")
    sr.add_argument("slug")
    sr.add_argument("--out", default=None)
    sr.set_defaults(fn=cmd_srt)

    q = sub.add_parser("qa", help="质检")
    q.add_argument("slug")
    q.set_defaults(fn=cmd_qa)

    pr = sub.add_parser("probe", help="看现状")
    pr.add_argument("slug")
    pr.set_defaults(fn=cmd_probe)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
