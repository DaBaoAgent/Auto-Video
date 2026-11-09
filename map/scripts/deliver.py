#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""deliver.py — map 管线交付：可选 BGM 混音 → QA → 出稿包

用法：
  python scripts/deliver.py <工程目录> --chugao <出稿目录> --name <交付名> \
         [--bgm 音乐.mp3] [--bgm-gain 0.14] [--archive <归档目录>]

交付物（<交付名> 为前缀）：
  .mp4 / _封面.png / _字幕.srt / _署名.txt
QA 写回 <工程>/review/qa.json：时长、分辨率、帧率、响度、峰值、黑帧、解码错误。
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

TMP = os.path.join(os.environ.get("TEMP", "/tmp"), "map_deliver")


def run(cmd, check=True, **kw):
    return subprocess.run(cmd, check=check, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", **kw)


def probe(path):
    j = json.loads(run(["ffprobe", "-v", "error", "-print_format", "json",
                        "-show_format", "-show_streams", path]).stdout)
    v = [s for s in j["streams"] if s["codec_type"] == "video"][0]
    a = [s for s in j["streams"] if s["codec_type"] == "audio"]
    return {
        "duration": round(float(j["format"]["duration"]), 3),
        "size_mb": round(int(j["format"]["size"]) / 1048576, 2),
        "width": v["width"], "height": v["height"], "fps": v["r_frame_rate"],
        "vcodec": v["codec_name"], "frames": v.get("nb_frames"),
        "acodec": a[0]["codec_name"] if a else None,
        "sample_rate": a[0].get("sample_rate") if a else None,
        "channels": a[0].get("channels") if a else None,
    }


def loudness(path):
    p = run(["ffmpeg", "-hide_banner", "-nostdin", "-i", path, "-af", "loudnorm=print_format=json",
             "-f", "null", "-"], check=False)
    blocks = re.findall(r"\{[\s\S]*?\}", p.stderr)
    if not blocks:
        return {}
    j = json.loads(blocks[-1])
    return {"input_i": float(j["input_i"]), "input_tp": float(j["input_tp"]),
            "input_lra": float(j["input_lra"]), "target": -16.0}


def black_frames(path):
    p = run(["ffmpeg", "-hide_banner", "-nostdin", "-i", path,
             "-vf", "blackdetect=d=0.1:pix_th=0.10", "-an", "-f", "null", "-"], check=False)
    return [{"start": float(a), "end": float(b)} for a, b in
            re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", p.stderr)]


def decode_errors(path):
    p = run(["ffmpeg", "-hide_banner", "-nostdin", "-v", "error", "-i", path, "-f", "null", "-"], check=False)
    return [x for x in p.stderr.splitlines() if x.strip()]


def mix_bgm(video, voice, bgm, out, gain):
    dur = probe(video)["duration"]
    os.makedirs(TMP, exist_ok=True)
    tmp = os.path.join(TMP, "bgmmix.wav")
    fade = max(0.5, dur - 2.5)
    fc = ("[0:a]aresample=48000,apad=whole_dur=%.3f[v];"
          "[1:a]volume=%.3f,atrim=0:%.3f,afade=t=out:st=%.3f:d=2.5[m];"
          "[v][m]amix=inputs=2:duration=first:normalize=0[a]") % (dur, gain, dur, fade)
    run(["ffmpeg", "-hide_banner", "-nostdin", "-v", "error", "-y", "-i", voice,
         "-stream_loop", "-1", "-i", bgm, "-filter_complex", fc, "-map", "[a]",
         "-ar", "48000", "-ac", "2", tmp])
    ln = loudness(tmp)
    want = -16.0 - ln.get("input_i", -16.0)
    g = min(want, -1.5 - ln.get("input_tp", -1.5) + 3.0)
    g = max(min(g, 12.0), -6.0)
    run(["ffmpeg", "-hide_banner", "-nostdin", "-v", "error", "-y", "-i", video, "-i", tmp,
         "-filter_complex", "[1:a]volume=%.2fdB,alimiter=limit=0.89:attack=5:release=80:level=false[a]" % g,
         "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-ar", "48000", "-movflags", "+faststart", out])
    print("BGM 混音：%.1f LUFS / %.1f dBTP → 增益 %+.1f dB" % (ln.get("input_i", 0), ln.get("input_tp", 0), g))


def fmt_ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return ("%02d:%02d:%06.3f" % (h, m, s)).replace(".", ",")


def wrap(text, width=18):
    """按标点与字数切字幕行。"""
    parts = re.findall(r"[^，。！？；：、,.!?;:]+[，。！？；：、,.!?;:]?", text)
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("proj")
    ap.add_argument("--chugao", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--bgm")
    ap.add_argument("--bgm-gain", type=float, default=0.14)
    ap.add_argument("--archive", default=None)
    args = ap.parse_args()

    proj = os.path.abspath(args.proj)
    out = os.path.join(proj, "out")
    video = os.path.join(out, "video-16x9.mp4")
    if not os.path.exists(video):
        sys.exit("找不到 %s：先 python scripts/map.py render <proj>" % video)

    if args.bgm:
        raw = os.path.join(out, "video-16x9_raw.mp4")
        if not os.path.exists(raw):
            shutil.copy2(video, raw)
        voice = os.path.join(out, "voice.wav")
        if not os.path.exists(voice):
            sys.exit("找不到 %s：渲染器没有导出人声，无法混 BGM" % voice)
        mixed = os.path.join(out, "_mix_tmp.mp4")
        mix_bgm(video, voice, args.bgm, mixed, args.bgm_gain)
        os.replace(mixed, video)

    cover = next((os.path.join(out, n) for n in ("cover-16x9.png", "cover.png") if os.path.exists(os.path.join(out, n))), None)
    srt = next((os.path.join(out, n) for n in ("captions-16x9.srt", "captions.srt") if os.path.exists(os.path.join(out, n))), None)
    if not srt:
        tl = os.path.join(proj, "timeline.json")
        if os.path.exists(tl):
            srt = make_srt(tl, os.path.join(out, "captions-16x9.srt"))
            print("由 timeline.json 生成字幕：", srt)
    credits = os.path.join(out, "CREDITS.txt")

    info = probe(video)
    ln = loudness(video)
    blacks = black_frames(video)
    errs = decode_errors(video)
    report = {"video": video, "probe": info, "loudness": ln,
              "black_frames": blacks, "decode_errors": errs[:20], "name": args.name,
              "bgm": args.bgm, "bgm_gain": args.bgm_gain if args.bgm else None}
    os.makedirs(os.path.join(proj, "review"), exist_ok=True)
    with open(os.path.join(proj, "review", "qa.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)

    print("PROBE", json.dumps(info, ensure_ascii=False))
    print("LOUD  %.1f LUFS / %.1f dBTP (target %.0f)" % (ln.get("input_i", 0), ln.get("input_tp", 0), -16))
    print("BLACK", len(blacks), blacks[:3])
    print("DECODE_ERRORS", len(errs))

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

    ok = not errs and not blacks and abs(ln.get("input_tp", 0)) < 2.0
    print("QA", "OK" if ok else "需要人工确认", "→", os.path.join(proj, "review", "qa.json"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
