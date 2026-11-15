#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""lvdong — one film in the silhouette-rhythm style, end to end.

    python lvdong.py new  <name> [--script script.md] [--title ...] [--paras 3]
    python lvdong.py transcribe <project>
    python lvdong.py align      <project>
    python lvdong.py cues       <project>
    python lvdong.py sound      <project>
    python lvdong.py stage      <project>
    python lvdong.py still      <project> 12.0 23.2 [--q "subs=0"]
    python lvdong.py video      <project> [--workers 3]
    python lvdong.py mux        <project>
    python lvdong.py srt        <project>
    python lvdong.py poster     <project> [--at 23.2]
    python lvdong.py check      <project>
    python lvdong.py beats      <project> [--from 0] [--to 30]
    python lvdong.py make       <project>          # align → cues → sound → stage → video → mux → srt → poster → check

<project> is a name under lvdong/projects/ or a path to a project folder.
Everything machine-specific comes from the environment, so nothing is hard-coded:

    LVDONG_LIB     the lemo-opuscar library root (default: project.json "lib")
    LVDONG_PY      the python that has numpy/scipy/soundfile (default <LIB>/.venv/Scripts/python.exe)
    LVDONG_FFMPEG  ffmpeg binary (default: ffmpeg on PATH)

The picture is rendered by the library (core/render/*.mjs), the sound by scripts/sound.py and
out/score.json, the muxing by ffmpeg here — no bash needed on Windows.
"""
import argparse, json, math, os, re, shutil, subprocess, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                       # lvdong/
PROJECTS = os.path.join(ROOT, "projects")
TPL = os.path.join(ROOT, "template")
ASSETS = os.path.join(ROOT, "assets")

FF = os.environ.get("LVDONG_FFMPEG", "ffmpeg")


def die(msg):
    print("ERROR " + msg)
    sys.exit(1)


def run(cmd, cwd=None, quiet=False):
    if not quiet:
        print("$ " + " ".join(cmd if isinstance(cmd, str) else cmd))
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if not quiet and (p.stdout or "").strip():
        print((p.stdout or "").rstrip())
    if p.returncode != 0:
        print((p.stdout or "")[-1500:])
        print((p.stderr or "")[-3000:])
        die("command failed: " + (cmd[0] if isinstance(cmd, list) else cmd))
    return p


def project_dir(arg):
    p = arg if os.path.isdir(arg) else os.path.join(PROJECTS, arg)
    if not os.path.isdir(p):
        die("no project: " + arg)
    return os.path.abspath(p)


def meta(p):
    f = os.path.join(p, "project.json")
    if not os.path.isfile(f):
        die("project.json missing in " + p)
    return json.load(open(f, encoding="utf-8"))


def lib_of(p):
    lib = os.environ.get("LVDONG_LIB") or meta(p).get("lib") or r"D:\@kaifa\lemo-opuscar"
    if not os.path.isdir(lib):
        die("library not found: %s (set LVDONG_LIB)" % lib)
    return lib


def py_of(lib):
    py = os.environ.get("LVDONG_PY")
    if py:
        return py
    for c in (os.path.join(lib, ".venv", "Scripts", "python.exe"), os.path.join(lib, ".venv", "bin", "python")):
        if os.path.isfile(c):
            return c
    return sys.executable


def slug_of(p):
    m = meta(p)
    return m.get("slug") or ("lvdong_" + re.sub(r"[^0-9A-Za-z_]", "_", m.get("name", "film")))


def outdir(p):
    d = os.path.join(p, "out")
    os.makedirs(d, exist_ok=True)
    return d


# ------------------------------------------------------------------ new
def cmd_new(a):
    src = os.path.join(PROJECTS, a.name)
    if os.path.isdir(src):
        die("project exists: " + src)
    os.makedirs(os.path.join(src, "voice"))
    os.makedirs(os.path.join(src, "out"))
    title = a.title or a.name
    html = open(os.path.join(TPL, "index.html"), encoding="utf-8").read().replace("{{TITLE}}", title)
    open(os.path.join(src, "index.html"), "w", encoding="utf-8").write(html)
    for f in ("film.js", "cast.js"):
        shutil.copyfile(os.path.join(TPL, f), os.path.join(src, f))
    script = ""
    paras = a.paras
    if a.script:
        raw = open(a.script, encoding="utf-8").read()
        blocks = [b.strip() for b in raw.split("\n\n") if b.strip()]
        script = "\n\n".join(blocks[:paras]) if blocks and len(blocks[0]) < 900 else raw
        script = script.replace("\r\n", "\n").strip() + "\n"
    open(os.path.join(src, "script.txt"), "w", encoding="utf-8").write(script)
    m = {
        "name": a.name, "title": title, "slug": "lvdong_" + re.sub(r"[^0-9A-Za-z_]", "_", a.name),
        "style": "silhouette-rhythm", "lib": os.environ.get("LVDONG_LIB") or r"D:\@kaifa\lemo-opuscar",
        "canvas": {"w": 1920, "h": 1080, "fps": 30},
        "duration": a.duration, "bpm": 90, "section_end": 0.0,
        "voice": "voice/source_full.wav", "script": "script.txt", "paras": paras, "drop": [],
        "cues": {"want": 16, "hard": 20, "min_hold": 1.6, "tail": 0.45},
        "labels": "", "poster_at": 10.0, "fonts": ["NotoSansSC.ttf", "Anton-Regular.ttf"], "note": "",
    }
    open(os.path.join(src, "project.json"), "w", encoding="utf-8").write(
        json.dumps(m, ensure_ascii=False, indent=1) + "\n")
    fdir = os.path.join(src, "fonts")
    if os.path.isdir(os.path.join(ASSETS, "fonts")):
        shutil.copytree(os.path.join(ASSETS, "fonts"), fdir, dirs_exist_ok=True)
    print("created " + src)
    print("next: put the narration at %s\\voice\\source_full.wav, then `python lvdong.py transcribe %s`" % (src, a.name))


# ------------------------------------------------------------------ voice
def cmd_transcribe(a):
    p = project_dir(a.project)
    m = meta(p)
    wav = os.path.join(p, m.get("voice", "voice/source_full.wav"))
    if not os.path.isfile(wav):
        die("narration missing: " + wav)
    run([py_of(lib_of(p)), os.path.join(HERE, "transcribe.py"), wav,
         os.path.join(p, "voice", "words_full.json"),
         "--prompt", a.prompt or "这是一段中文科普口播。"],
        cwd=ROOT)


def cmd_align(a):
    p = project_dir(a.project)
    m = meta(p)
    run([py_of(lib_of(p)), os.path.join(HERE, "align.py"), p, os.path.join(p, m.get("script", "script.txt")),
         "--paras", str(a.paras or m.get("paras", 3)),
         "--limit", str(a.limit or (m.get("duration", 0) - 1.0)),
         "--drop", "|".join(a.drop.split("|") if a.drop else m.get("drop", []))], cwd=ROOT)


def cmd_cues(a):
    p = project_dir(a.project)
    m = meta(p)
    c = m.get("cues", {})
    run([py_of(lib_of(p)), os.path.join(HERE, "make_cues.py"), p,
         "--end", str(a.end or m.get("section_end") or m.get("duration", 0) - 4.0),
         "--want", str(c.get("want", 16)), "--hard", str(c.get("hard", 20)),
         "--min-hold", str(c.get("min_hold", 1.6)), "--tail", str(c.get("tail", 0.45)),
         "--labels", m.get("labels", "")], cwd=ROOT)


def cmd_sound(a):
    p = project_dir(a.project)
    sf_file = os.path.join(p, "score.json")
    if not os.path.isfile(sf_file):
        die("score.json missing — copy projects/004_玛雅巨人文明/score.json and rewrite it")
    voice = os.path.join(p, meta(p).get("voice", "voice/source_full.wav"))
    run([py_of(lib_of(p)), os.path.join(HERE, "sound.py"), p, "--voice", voice, "--out", outdir(p)], cwd=ROOT)


# ------------------------------------------------------------------ picture
def cmd_stage(a):
    p = project_dir(a.project)
    lib = lib_of(p)
    m = meta(p)
    slug = slug_of(p)
    dst = os.path.join(lib, "films", slug)
    os.makedirs(dst, exist_ok=True)
    for f in ("index.html", "cast.js", "film.js"):
        s = os.path.join(p, f)
        if not os.path.isfile(s):
            die("missing %s in the project" % f)
        shutil.copyfile(s, os.path.join(dst, f))
    os.makedirs(os.path.join(dst, "out"), exist_ok=True)
    cues = os.path.join(p, "out", "cues.json")
    if os.path.isfile(cues):
        shutil.copyfile(cues, os.path.join(dst, "out", "cues.json"))
    fdir = os.path.join(p, "fonts")
    if not os.path.isdir(fdir):
        fdir = os.path.join(ASSETS, "fonts")
    if os.path.isdir(fdir):
        shutil.copytree(fdir, os.path.join(dst, "fonts"), dirs_exist_ok=True)
    else:
        print("WARNING no fonts/ — subtitles will fall back or fail to load "
              "(put NotoSansSC.ttf and Anton-Regular.ttf in lvdong/assets/fonts/)")
    print("staged -> " + dst)
    return dst


def _stage_dir(p):
    return os.path.join(lib_of(p), "films", slug_of(p))


def cmd_still(a):
    p = project_dir(a.project)
    lib = lib_of(p)
    d = _stage_dir(p)
    if not os.path.isdir(d):
        d = cmd_stage(a)
    sd = os.path.join(p, "stills")
    os.makedirs(sd, exist_ok=True)
    cmd = ["node", os.path.join("core", "render", "still.mjs"), "films/" + slug_of(p)] + [str(x) for x in a.times] + \
          ["--out", sd, "--prefix", a.prefix]
    if a.q:
        cmd += ["--q", a.q]
    run(cmd, cwd=lib)


def cmd_video(a):
    p = project_dir(a.project)
    lib = lib_of(p)
    d = _stage_dir(p)
    if not os.path.isdir(d):
        d = cmd_stage(a)
    vout = os.path.join(d, "out", "video.mp4")
    run(["node", os.path.join("core", "render", "video.mjs"), "films/" + slug_of(p),
         "--fps", str(a.fps or meta(p).get("canvas", {}).get("fps", 30)),
         "--workers", str(a.workers), "--out", vout], cwd=lib)
    shutil.copyfile(vout, os.path.join(outdir(p), "video.mp4"))
    print("video -> " + os.path.join(outdir(p), "video.mp4"))


def probe(path, stream=None):
    cmd = [FF.replace("ffmpeg", "ffprobe"), "-v", "error", "-show_entries",
           ("format=duration,size:stream=codec_name,width,height,r_frame_rate,sample_rate,channels" if stream
            else "format=duration,size"), "-of", "json", path]
    p = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        return {}
    return json.loads(p.stdout or "{}")


def loudness(path):
    p = subprocess.run([FF, "-hide_banner", "-i", path, "-af",
                        "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null",
                        os.devnull], capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", p.stderr or "")
    if not m:
        return {}
    try:
        return json.loads(m.group(0))
    except Exception:
        return {}


def cmd_mux(a):
    p = project_dir(a.project)
    m = meta(p)
    o = outdir(p)
    video = os.path.join(o, "video.mp4")
    mix = os.path.join(o, "mix.wav")
    for f in (video, mix):
        if not os.path.isfile(f):
            die("missing " + f)
    dst = os.path.join(o, (m.get("output") or (slug_of(p) + ".mp4")))
    L = loudness(mix)
    if not L:
        die("could not measure the mix with loudnorm")
    print("mix measured: I=%s LUFS  TP=%s  LRA=%s" % (L.get("input_i"), L.get("input_tp"), L.get("input_lra")))
    vq = ["-c:v", "copy"] if a.copy else ["-c:v", "libx264", "-preset", a.preset, "-crf", str(a.crf),
                                          "-pix_fmt", "yuv420p"]
    run([FF, "-y", "-i", video, "-i", mix,
         "-af", ("loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:"
                 "measured_thresh=%s:offset=%s:linear=true" % (
                     L["input_i"], L["input_tp"], L["input_lra"], L["input_thresh"], L["target_offset"])),
         ] + vq + ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
         "-movflags", "+faststart", dst], cwd=ROOT)
    print("film -> " + dst)
    return dst


def cmd_srt(a):
    p = project_dir(a.project)
    cues = json.load(open(os.path.join(p, "out", "cues.json"), encoding="utf-8"))

    def tstamp(x):
        h = int(x // 3600); m = int(x % 3600 // 60); s = int(x % 60); ms = int(round((x - int(x)) * 1000))
        return "%02d:%02d:%02d,%03d" % (h, m, s, ms)

    lines = []
    for i, c in enumerate(cues, 1):
        lines.append("%d\n%s --> %s\n%s\n" % (i, tstamp(c["t0"]), tstamp(c["t1"]), c["text"]))
    f = os.path.join(outdir(p), (meta(p).get("output") or (slug_of(p) + ".mp4")).rsplit(".", 1)[0] + ".srt")
    open(f, "w", encoding="utf-8").write("\n".join(lines))
    print("srt %d cues -> %s" % (len(cues), f))


def cmd_poster(a):
    p = project_dir(a.project)
    at = a.at or meta(p).get("poster_at", 10.0)
    sd = os.path.join(p, "stills")
    cmd_still(argparse.Namespace(project=a.project, times=[at], prefix="poster_", q="subs=0"))
    cand = sorted(f for f in os.listdir(sd) if f.startswith("poster_") and f.endswith(".jpg"))
    if not cand:
        die("poster still not produced")
    src = os.path.join(sd, cand[-1])
    run([FF, "-y", "-i", src, "-frames:v", "1", "-q:v", "2", os.path.join(p, "poster.jpg")], cwd=ROOT)
    print("poster -> " + os.path.join(p, "poster.jpg"))


def cmd_check(a):
    p = project_dir(a.project)
    m = meta(p)
    o = outdir(p)
    film = os.path.join(o, (m.get("output") or (slug_of(p) + ".mp4")))
    ok = True
    if os.path.isfile(film):
        pr = probe(film, stream=True)
        fmt = pr.get("format", {}); st = (pr.get("streams") or [{}])
        print("film  %.3f s  %s B" % (float(fmt.get("duration", 0)), fmt.get("size")))
        for s in st:
            if s.get("width"):
                fr = s.get("r_frame_rate") or "-"
                if "/" in fr:
                    try:
                        n, d = fr.split("/"); fr = "%.2f" % (float(n) / float(d or 1))
                    except ValueError:
                        pass
                print("      %s %sx%s  %s fps" % (s.get("codec_name"), s.get("width"), s.get("height"), fr))
            else:
                print("      %s  %s Hz %sch" % (s.get("codec_name"), s.get("sample_rate", "-"),
                                               s.get("channels", "-")))
        L = loudness(film)
        if L:
            print("      LUFS %s  TP %s" % (L.get("input_i"), L.get("input_tp")))
            if abs(float(L.get("input_i", 0)) + 14) > 0.6:
                print("      WARN loudness off target (-14)")
                ok = False
    else:
        print("film not yet muxed")
    cues = json.load(open(os.path.join(p, "out", "cues.json"), encoding="utf-8")) if \
        os.path.isfile(os.path.join(p, "out", "cues.json")) else []
    if cues:
        worst_cps, short = 0.0, 0
        for c in cues:
            n = len(c["text"]); hold = c["t1"] - c["t0"]
            worst_cps = max(worst_cps, n / max(.01, hold))
            if hold < 1.2:
                short += 1
        print("cues  %d  max %.1f 字/秒  short lines %d  span %.2f-%.2f" %
              (len(cues), worst_cps, short, cues[0]["t0"], cues[-1]["t1"]))
        if worst_cps > 9.0 or short:
            ok = False
        names = {c["text"] for c in cues}
        print("      first: %s" % cues[0]["text"])
        print("      last : %s" % cues[-1]["text"])
        del names
    print("CHECK " + ("ok" if ok else "needs a look"))


def cmd_beats(a):
    p = project_dir(a.project)
    m = meta(p)
    b = 60.0 / float(m.get("bpm", 90))
    t, bar = a.start, int(math.floor(a.start / (4 * b)) + 1)
    stop = a.end or m.get("duration", 30.0)
    while t < stop:
        beats = ["%.3f" % (t + k * b) for k in range(4)]
        print("bar %2d  t %7.3f   %s" % (bar, t, "  ".join(beats)))
        t += 4 * b
        bar += 1


def cmd_make(a):
    cmd_align(argparse.Namespace(project=a.project, paras=None, limit=None, drop=""))
    cmd_cues(argparse.Namespace(project=a.project, end=None))
    cmd_sound(argparse.Namespace(project=a.project))
    cmd_stage(a)
    cmd_video(argparse.Namespace(project=a.project, workers=a.workers, fps=None))
    cmd_mux(a)
    cmd_srt(a)
    cmd_poster(argparse.Namespace(project=a.project, at=None))
    cmd_check(a)


def main():
    ap = argparse.ArgumentParser(prog="lvdong")
    sub = ap.add_subparsers(dest="cmd", required=True)
    n = sub.add_parser("new")
    n.add_argument("name"); n.add_argument("--script"); n.add_argument("--title")
    n.add_argument("--paras", type=int, default=3); n.add_argument("--duration", type=float, default=30.0)
    for name in ("transcribe", "align", "cues", "sound", "stage", "video", "mux", "srt", "poster", "check"):
        s = sub.add_parser(name)
        s.add_argument("project")
        if name == "transcribe":
            s.add_argument("--prompt")
        if name == "align":
            s.add_argument("--paras", type=int); s.add_argument("--limit", type=float); s.add_argument("--drop")
        if name == "cues":
            s.add_argument("--end", type=float)
        if name == "video":
            s.add_argument("--workers", type=int, default=3); s.add_argument("--fps", type=int)
        if name == "poster":
            s.add_argument("--at", type=float)
        if name == "mux":
            s.add_argument("--crf", type=int, default=18); s.add_argument("--preset", default="medium")
            s.add_argument("--copy", action="store_true", help="copy the video stream instead of re-encoding")
    st = sub.add_parser("still")
    st.add_argument("project"); st.add_argument("times", nargs="+")
    st.add_argument("--prefix", default="look_"); st.add_argument("--q")
    bt = sub.add_parser("beats")
    bt.add_argument("project"); bt.add_argument("--from", dest="start", type=float, default=0.0)
    bt.add_argument("--to", dest="end", type=float)
    mk = sub.add_parser("make")
    mk.add_argument("project"); mk.add_argument("--workers", type=int, default=3)
    a = ap.parse_args()
    fn = {"new": cmd_new, "transcribe": cmd_transcribe, "align": cmd_align, "cues": cmd_cues,
          "sound": cmd_sound, "stage": cmd_stage, "still": cmd_still, "video": cmd_video,
          "mux": cmd_mux, "srt": cmd_srt, "poster": cmd_poster, "check": cmd_check,
          "beats": cmd_beats, "make": cmd_make}[a.cmd]
    fn(a)


if __name__ == "__main__":
    main()
