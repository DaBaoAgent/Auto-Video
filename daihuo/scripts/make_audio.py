# daihuo · 音频合成：人声 + BGM + 音效 → 单轨 48k，响度归一到 -14 LUFS
# 用法：python make_audio.py --narration=... --cues=... --bgm=... --sfxdir=... --out=...
import argparse
import json
import subprocess
import sys

FFMPEG = "ffmpeg"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--narration", required=True)
    ap.add_argument("--cues", required=True)
    ap.add_argument("--bgm", required=True)
    ap.add_argument("--sfxdir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--bgm-gain", type=float, default=0.38)
    ap.add_argument("--sfx-gain", type=float, default=0.85)
    ap.add_argument("--duration", type=float, default=None)
    args = ap.parse_args()

    cues = json.load(open(args.cues, encoding="utf-8"))
    dur = args.duration or float(cues["duration"])

    # 音效挂点：钩子起 / 信息段起 / 价格段起
    sfx = []
    for sc in cues.get("scenes", []):
        kind = sc.get("kind")
        if kind == "hook":
            sfx.append(("hit.wav", sc["start"], 0.95))
        elif kind == "info":
            sfx.append(("stamp.wav", sc["start"], 0.7))
        elif kind == "price":
            sfx.append(("coin.wav", sc["start"], 0.8))

    cmd = [FFMPEG, "-hide_banner", "-v", "error", "-y",
           "-i", args.narration, "-i", args.bgm]
    for (name, _, _) in sfx:
        cmd += ["-i", f"{args.sfxdir}/{name}"]

    parts = []
    parts.append(f"[0:a]volume=1.0,apad=whole_dur={dur},atrim=0:{dur},asetpts=N/SR/TB[nar]")
    decay = max(0.0, dur - 1.0)
    parts.append(
        f"[1:a]volume={args.bgm_gain},afade=t=in:st=0:d=0.5,"
        f"afade=t=out:st={decay:.2f}:d=1.0,apad=whole_dur={dur},atrim=0:{dur}[bgm]"
    )
    labels = ["[nar]", "[bgm]"]
    for i, (name, start, gain) in enumerate(sfx):
        ms = int(round(start * 1000))
        parts.append(f"[{i + 2}:a]volume={gain},adelay={ms}|{ms}[sfx{i}]")
        labels.append(f"[sfx{i}]")

    mix_in = "".join(labels)
    parts.append(
        f"{mix_in}amix=inputs={len(labels)}:duration=longest:normalize=0,"
        f"alimiter=limit=0.94:level=false,atrim=0:{dur}[out]"
    )

    tmp = args.out + ".mix.wav"
    cmd += ["-filter_complex", ";".join(parts), "-map", "[out]",
            "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", tmp]

    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:], file=sys.stderr)
        raise SystemExit(1)

    # 两遍 loudnorm：第一遍只测量，第二遍按测量值线性归一到 -14 LUFS
    probe = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", tmp, "-af",
         "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    text = probe.stderr
    import re
    hit = re.search(r'\{\s*"input_i".*?\}', text, re.S)
    if not hit:
        print(text[-1200:], file=sys.stderr)
        raise SystemExit("loudnorm 测量结果解析失败")
    meas = json.loads(hit.group(0))
    norm = (
        "loudnorm=I=-14:TP=-1.5:LRA=11"
        f":measured_I={meas['input_i']}:measured_TP={meas['input_tp']}"
        f":measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}"
        f":offset={meas['target_offset']}:linear=true:print_format=summary"
    )
    r2 = subprocess.run(
        [FFMPEG, "-hide_banner", "-v", "error", "-y", "-i", tmp, "-af", norm,
         "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", args.out],
        capture_output=True, text=True,
    )
    if r2.returncode != 0:
        print(r2.stderr[-2000:], file=sys.stderr)
        raise SystemExit(1)
    import os
    try:
        os.remove(tmp)
    except OSError:
        pass

    print(json.dumps({
        "ok": True, "out": args.out, "duration": dur, "sfx": len(sfx),
        "loudness_in": {"I": meas["input_i"], "TP": meas["input_tp"], "LRA": meas["input_lra"]},
    }))


if __name__ == "__main__":
    main()
