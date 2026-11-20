#!/usr/bin/env python3
"""qianhuang2 编排 CLI —— 铅黄剪影 · 剪影舞台（Giallo Silhouette Stage）管线。

  python qianhuang2/scripts/qianhuang2.py probe  001_bayofblood_stage          看工程现状
  python qianhuang2/scripts/qianhuang2.py stills 001_bayofblood_stage --times 3.0,7.6,20.4
  python qianhuang2/scripts/qianhuang2.py render 001_bayofblood_stage          无声母版 out/video.mp4
  python qianhuang2/scripts/qianhuang2.py mux    001_bayofblood_stage --voice <配音.mp4|wav>
  python qianhuang2/scripts/qianhuang2.py qa     001_bayofblood_stage          六项质检 + 色彩范围
  python qianhuang2/scripts/qianhuang2.py pack   001_bayofblood_stage --dest DIR --name 片名
  python qianhuang2/scripts/qianhuang2.py new    002_xxx                       从骨架复制一份工程

从仓库根运行。只用标准库；渲染交给共享运行时 vendor/runtime/render-legacy.mjs。
这条线不合成音效：声音是上游配音，直接合一条音轨（与 qianhuang 的合成音效床不同）。
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PIPELINE = Path(__file__).resolve().parent.parent      # pipelines/qianhuang2/
PROJECTS = PIPELINE / "projects"
ROOT = PIPELINE.parent.parent                           # 仓库根
RENDER_CANDIDATES = [
    ROOT / "vendor" / "runtime" / "render-legacy.mjs",
    ROOT / "vendor" / "模板库" / "runtime" / "render-legacy.mjs",
]
SKELETON = "001_bayofblood_stage"
FPS = 30                 # 30 fps：0.066 s 的发丝滞后、两帧级细节都靠它撑住
LUFS, TRUE_PEAK = -14.6, -1.6
CRF = 18                 # 剪影片几乎全黑，暗部一要起块整张画就脏，交付比常线多压 2 档质量
ENCODE_PRESET = "medium"

# 画布是 JPEG 逐帧 pipe 进来的，颜色是 full range；libx264 默认不写 range 标记，
# 播放器按 limited 解释就发灰。渲染完必须显式转一次 tv range（照 dengju/shuimo 的做法）。
RANGE_FIX = "scale=out_color_matrix=bt709:out_range=tv:flags=lanczos,format=yuv420p"


def die(msg):
    print(f"✗ {msg}", file=sys.stderr)
    sys.exit(1)


def renderer():
    for p in RENDER_CANDIDATES:
        if p.exists():
            return p
    die("找不到共享渲染器 vendor/runtime/render-legacy.mjs（先 git pull，或检查 vendor 是否落地）")


def resolve(slug):
    """slug 可以是完整目录名，也可以是唯一前缀（001 / bay）。"""
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


def shots(p):
    """镜头表：{ name, t0, t1 }，只在 probe 里报给人看。"""
    f = p / "film.js"
    if not f.exists():
        return []
    txt = f.read_text(encoding="utf-8", errors="replace")
    return [{"name": n, "t0": float(a), "t1": float(b)}
            for n, a, b in re.findall(r"name:\s*'([^']+)',\s*t0:\s*([\d.]+),\s*t1:\s*([\d.]+)", txt)]


def out_name(p):
    return p.name.split("_", 1)[-1]


def ffprobe_json(path, streams="v"):
    r = subprocess.run(["ffprobe", "-hide_banner", "-v", "error", "-select_streams", streams,
                        "-show_entries",
                        "stream=codec_name,width,height,r_frame_rate,nb_frames,duration,"
                        "sample_rate,channels,color_range,color_space,pix_fmt",
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
    print(f"✓ {dst}")
    print("  下一步：改 film.js 的 DUR / SHOTS（每一段贴着配音的时间码），")
    print("          world.js 换场景与物件坐标（脚底一律压 STAGE_Y=872，头顶压 HEAD_Y=540），")
    print("          cast.js 改 POSES 与身高，最后把配音丢进 voice/ 再 mux。")


# —— stills ——
def cmd_stills(a):
    p = resolve(a.slug)
    run(["node", renderer(), p, "--still", a.times, "--fps", str(a.fps)])


# —— render ——
def cmd_render(a):
    p = resolve(a.slug)
    raw = p / "out" / "raw.mp4"
    out = Path(a.out) if a.out else (p / "out" / "video.mp4")
    raw.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["node", renderer(), p, "--fps", str(a.fps), "--out", raw]
    if a.from_ is not None:
        cmd += ["--from", str(a.from_)]
    if a.to is not None:
        cmd += ["--to", str(a.to)]
    run(cmd)

    # 逐帧 JPEG 是 full range，这里显式落成 tv range + bt709，否则暗场在播放器里发灰
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", raw,
         "-vf", RANGE_FIX, "-c:v", "libx264", "-crf", str(CRF), "-preset", ENCODE_PRESET,
         "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
         "-an", "-movflags", "+faststart", out])
    print(f"✓ {out}  {out.stat().st_size / 1048576:.1f} MB")


# —— mux ——
def cmd_mux(a):
    p = resolve(a.slug)
    video = Path(a.video) if a.video else (p / "out" / "video.mp4")
    if not video.exists():
        die(f"{video} 不存在，先跑 render")
    voice = Path(a.voice) if a.voice else (p / "voice" / "voice.wav")
    if not voice.exists():
        die(f"配音 {voice} 不存在：这条线不自带音效，--voice 必须给一条真配音（wav/mp3/mp4 都行）")
    mix = p / "voice" / "voice_mix.wav"
    mix.parent.mkdir(parents=True, exist_ok=True)
    out = Path(a.out) if a.out else (p / "out" / f"{out_name(p)}.mp4")

    # 1) 配音预母带：先压缩吃掉口播的峰，再按实测补增益
    pre = "acompressor=threshold=-18dB:ratio=3:attack=5:release=60"
    m = loudnorm_json(voice, f"{pre},loudnorm=I={int(LUFS)}:TP=-1.2")
    gain = LUFS - float(m["input_i"])
    print(f"  · 配音压缩后 {m['input_i']} LUFS / TP {m['input_tp']} / LRA {m['input_lra']}  → 补 {gain:+.2f} dB")
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", voice, "-vn",
         "-af", f"{pre},volume={gain:.2f}dB,alimiter=limit=-1.5dB:level=false",
         "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", mix])

    # 2) AAC 解码会过冲 0.15–0.25 dB，限峰压到目标以下留余量
    limit = TRUE_PEAK - 0.2
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-y", "-i", video, "-i", mix,
         "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
         "-af", f"apad,alimiter=limit={limit:.1f}dB:level=false",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
         "-shortest", "-movflags", "+faststart", out])

    lufs2, tp2 = loudness(out)
    if lufs2 is None:
        print(f"✓ {out}")
    else:
        flag = "" if abs(lufs2 - LUFS) < 0.8 and tp2 <= TRUE_PEAK + 0.1 else "  ← 偏离目标，先看 voice 文件的电平"
        print(f"✓ {out}\n   {lufs2:.1f} LUFS · 峰值 {tp2:.1f} dBFS{flag}")


# —— qa ——
def cmd_qa(a):
    p = resolve(a.slug)
    cands = sorted((p / "out").glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True)
    cands = [f for f in cands if f.name != "raw.mp4"]
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
        ("有音轨（配音）", True, (au.get("streams") or [{}])[0].get("codec_name", "—（默片）")),
        (f"响度 ≈ {LUFS} LUFS", (not has_audio) or (lufs is not None and abs(lufs - LUFS) <= 1.0),
         (f"{lufs:.1f}" if lufs else "—（默片）")),
        (f"峰值 ≤ {TRUE_PEAK} dBFS", (not has_audio) or (tp is not None and tp <= TRUE_PEAK + 0.1),
         (f"{tp:.1f}" if tp else "—（默片）")),
        ("色彩范围 tv / bt709", st.get("color_range") == "tv" and st.get("pix_fmt") == "yuv420p",
         f"{st.get('color_range') or '—'} / {st.get('pix_fmt') or '—'}"),
    ]
    print(f"· {f}  {dur:.2f}s / {frames} 帧 / {int(v['format']['size']) / 1048576:.1f} MB")
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
         "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
         "-c:a", "copy", "-movflags", "+faststart", out])
    print(f"✓ {out}  {out.stat().st_size / 1048576:.1f} MB")


# —— probe ——
def cmd_probe(a):
    p = resolve(a.slug)
    print(f"· 工程 {p}")
    for f in ("index.html", "engine.js", "cast.js", "world.js", "film.js"):
        q = p / f
        print(f"  {'✓' if q.exists() else '·'} {f}" + (f"  {q.stat().st_size / 1024:.0f} KB" if q.exists() else ""))
    length = film_len(p)
    if length:
        print(f"  DUR {length}s → {round(length * FPS)} 帧 @{FPS}fps")
    for s in shots(p):
        print(f"  镜 {s['name']:<8} {s['t0']:.2f} – {s['t1']:.2f} s")
    voice = p / "voice" / "voice.wav"
    print(f"  {'✓' if voice.exists() else '·'} voice/voice.wav")
    cands = sorted((p / "out").glob("*.mp4"), key=lambda f: f.stat().st_mtime, reverse=True) if (p / "out").is_dir() else []
    for f in cands[:4]:
        print(f"  成片 {f.name}  {f.stat().st_size / 1048576:.1f} MB")


def main():
    ap = argparse.ArgumentParser(prog="qianhuang2", description="铅黄剪影 · 剪影舞台（Giallo Silhouette Stage）管线")
    sub = ap.add_subparsers(dest="cmd", required=True)

    n = sub.add_parser("new", help="从骨架复制一份工程")
    n.add_argument("slug")
    n.set_defaults(fn=cmd_new)

    s = sub.add_parser("stills", help="静帧")
    s.add_argument("slug")
    s.add_argument("--times", required=True, help="逗号分隔的秒：3.0,7.6,20.4")
    s.add_argument("--fps", type=int, default=FPS)
    s.set_defaults(fn=cmd_stills)

    r = sub.add_parser("render", help="无声母版（已转 tv range）")
    r.add_argument("slug")
    r.add_argument("--fps", type=int, default=FPS)
    r.add_argument("--from", dest="from_", type=float, default=None)
    r.add_argument("--to", type=float, default=None)
    r.add_argument("--out", default=None)
    r.set_defaults(fn=cmd_render)

    m = sub.add_parser("mux", help="配音 → 成片")
    m.add_argument("slug")
    m.add_argument("--video", default=None)
    m.add_argument("--voice", default=None, help="配音轨：wav/mp3/mp4 均可")
    m.add_argument("--out", default=None)
    m.set_defaults(fn=cmd_mux)

    q = sub.add_parser("qa", help="六项质检 + 色彩范围")
    q.add_argument("slug")
    q.set_defaults(fn=cmd_qa)

    pk = sub.add_parser("pack", help="交付压缩（CRF 18）")
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
