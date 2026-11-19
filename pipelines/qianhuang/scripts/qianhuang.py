#!/usr/bin/env python3
"""qianhuang 编排 CLI —— 千黄 · 铅黄浓彩（Giallo Gouache）管线。

  python qianhuang/scripts/qianhuang.py probe  001_bayofblood            看工程现状
  python qianhuang/scripts/qianhuang.py stills 001_bayofblood --times 5.2,14.6  静帧
  python qianhuang/scripts/qianhuang.py sfx    001_bayofblood            重跑 voice/make_sfx.py
  python qianhuang/scripts/qianhuang.py render 001_bayofblood            无声母版 out/video.mp4
  python qianhuang/scripts/qianhuang.py mux    001_bayofblood            配音+音效 → out/<名>.mp4
  python qianhuang/scripts/qianhuang.py srt    001_bayofblood            从 subs.json 导出 SRT
  python qianhuang/scripts/qianhuang.py qa     001_bayofblood            分辨率/帧率/帧数/音轨/响度
  python qianhuang/scripts/qianhuang.py pack   001_bayofblood --dest DIR 交付压缩（CRF 20）
  python qianhuang/scripts/qianhuang.py new    002_xxx                   从 001 骨架复制一份工程

从仓库根运行。只用标准库；渲染交给共享运行时 vendor/runtime/render-legacy.mjs。
字体在渲染前必须到位：python tools/sync_fonts.py --fetch && --pipeline qianhuang。
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PIPELINE = Path(__file__).resolve().parent.parent      # pipelines/qianhuang/
PROJECTS = PIPELINE / "projects"
ROOT = PIPELINE.parent.parent                           # 仓库根
RENDER_CANDIDATES = [
    ROOT / "vendor" / "runtime" / "render-legacy.mjs",
    ROOT / "vendor" / "模板库" / "runtime" / "render-legacy.mjs",
]
SKELETON = "001_bayofblood"
FPS = 30                 # 铅黄要的就是硬切与快镜，30 帧起步
LUFS, TRUE_PEAK = -14.6, -1.6
SFX_GAIN = 0.82          # 音效床相对配音的电平（amix weights 里的第二个）
CRF = 20                 # 交付压片：画质优先，暗部不能起块


def die(msg):
    print(f"✗ {msg}", file=sys.stderr)
    sys.exit(1)


def renderer():
    for p in RENDER_CANDIDATES:
        if p.exists():
            return p
    die("找不到共享渲染器 vendor/runtime/render-legacy.mjs（先 git pull，或检查 vendor 是否落地）")


def resolve(slug):
    """slug 可以是完整目录名，也可以是唯一前缀（001 / blood）。"""
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
    """片长写在 film.js 的 const DUR —— 画面时长以它为准。"""
    f = p / "film.js"
    if not f.exists():
        return None
    m = re.search(r"const DUR\s*=\s*([\d.]+)", f.read_text(encoding="utf-8", errors="replace"))
    return float(m.group(1)) if m else None


def subs(p):
    f = p / "subs.json"
    if not f.exists():
        return []
    try:
        return json.loads(f.read_text(encoding="utf-8"))
    except Exception as exc:
        die(f"subs.json 解析失败：{exc}")


def out_name(p):
    return p.name.split("_", 1)[-1]


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
    for f in ("voice/voice.wav", "voice/voice_mix.wav", "voice/mix_raw.wav"):
        (dst / f).unlink(missing_ok=True)
    print(f"✓ {dst}")
    print("  下一步：改 film.js 的 DUR / SHOTS（一镜 2–4 秒）、world.js 的地点与调色板、")
    print("          改 voice/make_sfx.py 顶部的时间点表让它咬住新的落刀与转场，")
    print("          再跑 python tools/sync_fonts.py --pipeline qianhuang 把字体放进来。")


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


# —— sfx ——
def cmd_sfx(a):
    p = resolve(a.slug)
    script = p / "voice" / "make_sfx.py"
    if not script.exists():
        die(f"{script} 不存在：这条线的音效是脚本合成的，先把它放回 voice/")
    cmd = [sys.executable, script]
    if a.out:
        cmd += ["--out", a.out]
    run(cmd)


# —— mux ——
def cmd_mux(a):
    p = resolve(a.slug)
    video = Path(a.video) if a.video else (p / "out" / "video.mp4")
    if not video.exists():
        die(f"{video} 不存在，先跑 render")
    voice = Path(a.voice) if a.voice else (p / "voice" / "voice.wav")
    sfx = Path(a.sfx) if a.sfx else (p / "voice" / "sfx.wav")
    mix = p / "voice" / "voice_mix.wav"
    raw = p / "voice" / "mix_raw.wav"
    out = Path(a.out) if a.out else (p / "out" / f"{out_name(p)}.mp4")

    if not voice.exists() and not sfx.exists():
        die("既没有 voice/voice.wav 也没有 voice/sfx.wav：先放配音，或跑 sfx 生成音效床")

    # 1) 配音预母带：先压缩，再按实测电平补增益
    bed = None
    if voice.exists():
        pre = "acompressor=threshold=-18dB:ratio=3:attack=5:release=60"
        m = loudnorm_json(voice, f"{pre},loudnorm=I={int(LUFS)}:TP=-1.2")
        gain = LUFS - float(m["input_i"])
        print(f"  · 配音压缩后 {m['input_i']} LUFS / TP {m['input_tp']} / LRA {m['input_lra']}  → 补 {gain:+.2f} dB")
        run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", voice,
             "-af", f"{pre},volume={gain:.2f}dB,alimiter=limit=-1.5dB:level=false",
             "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", mix])
        bed = mix
    if sfx.exists():
        if bed is None:
            bed = sfx
        else:
            # 2) 音效床压在配音下面：normalize=0 才不会把配音拉小，权重给音效 0.82
            run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", bed, "-i", sfx,
                 "-filter_complex",
                 f"[0:a][1:a]amix=inputs=2:duration=longest:normalize=0:weights=1 {SFX_GAIN}[a]",
                 "-map", "[a]", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", raw])
            bed = raw

    # 3) 量一遍整条音轨，把电平顶到目标再合流
    lufs, tp = loudness(bed)
    gain = LUFS - lufs if lufs is not None else 0.0
    # AAC 解码后会过冲 0.15–0.25 dB，限峰要压到目标以下留余量，否则成片测出来会破 TRUE_PEAK
    limit = TRUE_PEAK - 0.2
    print(f"  · 音轨 {lufs} LUFS / TP {tp}  → 补 {gain:+.2f} dB，限峰 {limit:.1f}")
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", video, "-i", bed,
           "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
           "-af", f"apad,volume={gain:.2f}dB,alimiter=limit={limit:.1f}dB:level=false",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
           "-shortest", "-movflags", "+faststart", out]
    run(cmd)

    lufs2, tp2 = loudness(out)
    if lufs2 is None:
        print(f"✓ {out}")
    else:
        flag = "" if abs(lufs2 - LUFS) < 0.8 and tp2 <= TRUE_PEAK + 0.1 else "  ← 偏离目标，先看 voice.wav / sfx.wav"
        print(f"✓ {out}\n   {lufs2:.1f} LUFS · 峰值 {tp2:.1f} dBFS{flag}")


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
    out = Path(a.out) if a.out else (p / "out" / f"{out_name(p)}.srt")
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
        (f"帧率 {FPS}", abs(fps - FPS) < 0.02, f"{fps}"),
        ("帧数 = 时长×帧率", abs(frames - round(dur * fps)) <= 1, f"{frames} / {round(dur * fps)}"),
        ("有音轨（无配音时至少要音效床）", True, (au.get("streams") or [{}])[0].get("codec_name", "—（默片）")),
        (f"响度 ≈ {LUFS} LUFS", (not has_audio) or (lufs is not None and abs(lufs - LUFS) <= 1.0),
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


# —— pack ——
def cmd_pack(a):
    p = resolve(a.slug)
    src = Path(a.src) if a.src else (p / "out" / f"{out_name(p)}.mp4")
    if not src.exists():
        die(f"{src} 不存在，先跑 mux")
    if a.dest:
        out = Path(a.dest) / f"{a.name or out_name(p)}.mp4"
        out.parent.mkdir(parents=True, exist_ok=True)
    else:
        out = p / "out" / f"{out_name(p)}_crf{CRF}.mp4"
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", src,
         "-c:v", "libx264", "-crf", str(CRF), "-preset", "slow", "-pix_fmt", "yuv420p",
         "-c:a", "copy", "-movflags", "+faststart", out])
    print(f"✓ {out}  {out.stat().st_size/1048576:.1f} MB")
    # 字幕跟成片走一份
    srt = src.with_suffix(".srt")
    if srt.exists() and a.dest:
        shutil.copy2(srt, Path(a.dest) / f"{a.name or out_name(p)}.srt")
        print(f"✓ {Path(a.dest) / f'{a.name or out_name(p)}.srt'}")


# —— probe ——
def cmd_probe(a):
    p = resolve(a.slug)
    print(f"· 工程 {p}")
    for f in ("index.html", "main.js", "film.js", "world.js", "poses.js", "engine.js", "subs.json",
              "fonts/Caveat.ttf", "fonts/ReenieBeanie.ttf", "fonts/LongCang-Regular.ttf",
              "fonts/MaShanZheng-Regular.ttf", "voice/voice.wav", "voice/sfx.wav", "voice/make_sfx.py"):
        q = p / f
        print(f"  {'✓' if q.exists() else '·'} {f}" + (f"  {q.stat().st_size/1024:.0f} KB" if q.exists() else ""))
    length = film_len(p)
    if length:
        print(f"  DUR {length}s → {round(length * FPS)} 帧 @{FPS}fps")
    cues = subs(p)
    print(f"  字幕 {len(cues)} 条" + (f"，末条 {cues[-1]['t1']}s" if cues else ""))
    cands = sorted((p / "out").glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True) if (p / "out").is_dir() else []
    for f in cands[:4]:
        print(f"  成片 {f.name}  {f.stat().st_size/1048576:.1f} MB")


def main():
    ap = argparse.ArgumentParser(prog="qianhuang", description="千黄 · 铅黄浓彩（Giallo Gouache）管线")
    sub = ap.add_subparsers(dest="cmd", required=True)

    n = sub.add_parser("new", help="从骨架复制一份工程")
    n.add_argument("slug")
    n.set_defaults(fn=cmd_new)

    s = sub.add_parser("stills", help="静帧")
    s.add_argument("slug")
    s.add_argument("--times", required=True, help="逗号分隔的秒：5.2,14.6")
    s.set_defaults(fn=cmd_stills)

    r = sub.add_parser("render", help="无声母版")
    r.add_argument("slug")
    r.add_argument("--fps", type=int, default=FPS)
    r.add_argument("--start", type=float, default=None)
    r.add_argument("--end", type=float, default=None)
    r.add_argument("--out", default=None)
    r.set_defaults(fn=cmd_render)

    sf = sub.add_parser("sfx", help="重跑 voice/make_sfx.py 生成音效床")
    sf.add_argument("slug")
    sf.add_argument("--out", default=None)
    sf.set_defaults(fn=cmd_sfx)

    m = sub.add_parser("mux", help="配音 + 音效 → 成片")
    m.add_argument("slug")
    m.add_argument("--video", default=None)
    m.add_argument("--voice", default=None)
    m.add_argument("--sfx", default=None)
    m.add_argument("--out", default=None)
    m.set_defaults(fn=cmd_mux)

    sr = sub.add_parser("srt", help="从 subs.json 导出 SRT")
    sr.add_argument("slug")
    sr.add_argument("--out", default=None)
    sr.set_defaults(fn=cmd_srt)

    q = sub.add_parser("qa", help="质检")
    q.add_argument("slug")
    q.set_defaults(fn=cmd_qa)

    pk = sub.add_parser("pack", help="交付压缩（CRF 20）")
    pk.add_argument("slug")
    pk.add_argument("--src", default=None)
    pk.add_argument("--dest", default=None, help="交付目录；给了就按 --name 放进去")
    pk.add_argument("--name", default=None, help="交付文件名（不含扩展名）")
    pk.set_defaults(fn=cmd_pack)

    pr = sub.add_parser("probe", help="看现状")
    pr.add_argument("slug")
    pr.set_defaults(fn=cmd_probe)

    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
