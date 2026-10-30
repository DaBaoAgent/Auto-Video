# -*- coding: utf-8 -*-
"""把逐幕配音拼成一整条，供整片试听。

    python scripts/concat-narration.py --pkg vendor/battlefield-editor/packages/chibi-full \
        --out "content/01-赤壁之战/音色试听/27_全片46幕-拼接配音试听.mp3"

幕间留白取 scene.json 里各幕的 act.dur 减掉旁白音长（即定时使用的 ACT_TAIL），
所以试听听到的节奏与成片一致（只是没有配乐）。对时未完成的幕会被跳过并提示。
"""
import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

FFMPEG = os.environ.get("FFMPEG") or str(Path.home() / "bin/ffmpeg.exe")
RATE = 32000


def read(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pkg", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--tail", type=float, default=0.5)
    args = ap.parse_args()

    pkg = Path(args.pkg).resolve()
    film = read(pkg / "film.json")
    voice = film["voice"]
    scenes = read(pkg / "scene.json")["acts"]
    cues = read(pkg / "narration/cues.json")
    audio_dir = pkg / "assets/narration" / voice

    pieces, missing, gaps = [], [], []
    for i, act in enumerate(scenes):
        n = i + 1
        clip = audio_dir / f"scene{n}.mp3"
        if not clip.exists():
            missing.append(n)
            continue
        pieces.append(clip)
        gaps.append(round(act["dur"] - cues.get(str(n), {}).get(voice, {}).get("dur", 0), 3))
    if not pieces:
        raise SystemExit("没有任何幕音频可拼接")
    if missing:
        print(f"⚠ 缺 {len(missing)} 幕音频，已跳过：{missing}", file=sys.stderr)

    gap = max(set(gaps), key=gaps.count)
    print(f"共 {len(pieces)} 幕；幕间留白 {gap:.3f} 秒")

    out = Path(args.out).resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    scratch = out.parent / (out.stem + ".parts")
    scratch.mkdir(exist_ok=True)
    sil = scratch / "_gap.mp3"
    subprocess.run([FFMPEG, "-y", "-v", "error", "-f", "lavfi", "-i",
                    f"anullsrc=r={RATE}:cl=mono", "-t", str(gap), "-c:a", "libmp3lame",
                    "-b:a", "128k", str(sil)], check=True)

    listing = scratch / "list.txt"
    with listing.open("w", encoding="utf-8") as f:
        for clip in pieces:
            f.write("file '%s'\n" % str(clip).replace("\\", "/").replace("'", "'\\''"))
            f.write("file '%s'\n" % str(sil).replace("\\", "/"))
    subprocess.run([FFMPEG, "-y", "-v", "error", "-f", "concat", "-safe", "0",
                    "-i", str(listing), "-ar", str(RATE), "-ac", "1",
                    "-c:a", "libmp3lame", "-b:a", "128k",
                    "-metadata", f"title={film.get('voice', '')} 全片配音试听", str(out)], check=True)

    dur = subprocess.check_output([os.environ.get("FFPROBE") or str(Path.home() / "bin/ffprobe.exe"),
                                   "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", str(out)], text=True).strip()
    print(f"已输出 {out}（{float(dur) / 60:.2f} 分钟）")


if __name__ == "__main__":
    main()
