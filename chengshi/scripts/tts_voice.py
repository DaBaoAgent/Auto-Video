# -*- coding: utf-8 -*-
"""把 projects/<slug>/data/voiceover.json 的每句中文送进本机 GPT-SoVITS，出一句一个 WAV。

服务：http://127.0.0.1:9880/v1/audio/speech（真武 GPT-SoVITS，启动方式见 chengshi/USAGE.md）
输出：projects/<slug>/work/audio/vo/NN.wav，供 mix_audio.py 按 t0 贴轨。

voiceover.json 每句可选的覆盖项：speed / tail（秒）。
用法：
    python chengshi/scripts/tts_voice.py --project suzhou
    python chengshi/scripts/tts_voice.py --project suzhou --only 13,14 --force
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # Auto-Video/
FF_FALLBACK = Path(r"C:/Users/20200/bin/ffmpeg.exe")
EQ = ("bass=g=3:f=150,equalizer=f=250:t=q:w=1.5:g=2,"
      "equalizer=f=3000:t=q:w=1.5:g=2,highshelf=f=8000:g=1")


def ffmpeg() -> str:
    if FF_FALLBACK.exists():
        return str(FF_FALLBACK)
    found = shutil.which("ffmpeg")
    if not found:
        raise SystemExit(f"找不到 ffmpeg：{FF_FALLBACK}")
    return found


def synth(url: str, text: str, speed: float) -> bytes:
    body = json.dumps({"input": text, "speed": speed}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def main() -> None:
    ap = argparse.ArgumentParser(prog="tts_voice", description="逐句 TTS 配音")
    ap.add_argument("--project", required=True)
    ap.add_argument("--url", default="http://127.0.0.1:9880/v1/audio/speech")
    ap.add_argument("--speed", type=float, default=0.75)
    ap.add_argument("--out-dir", "--voice-dir", dest="out_dir", type=Path, default=None)
    ap.add_argument("--only", default="", help="只做这些 id，如 13,14")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    proj = ROOT / "projects" / args.project
    vo_path = proj / "data" / "voiceover.json"
    if not vo_path.exists():
        raise SystemExit(f"缺 {vo_path}")
    vo = json.loads(vo_path.read_text(encoding="utf-8-sig"))
    lines = vo["lines"]
    only = {int(x) for x in args.only.split(",") if x.strip()}
    out_dir = args.out_dir or (proj / "work" / "audio" / "vo")
    out_dir.mkdir(parents=True, exist_ok=True)
    ff = ffmpeg()

    for line in lines:
        lid = int(line["id"])
        if only and lid not in only:
            continue
        dst = out_dir / f"{lid:02d}.wav"
        if dst.exists() and not args.force:
            print(f"[skip] {dst.name} 已存在（--force 覆盖）")
            continue
        text = line["cn"]
        speed = float(line.get("speed", args.speed))
        tail = float(line.get("tail", 0.0) or 0.0)
        if args.dry_run:
            print(f"[dry-run] {lid:02d} speed={speed} tail={tail} {text}")
            continue
        print(f"[{lid:02d}] speed={speed} {text[:24]}…", flush=True)
        try:
            data = synth(args.url, text, speed)
        except urllib.error.URLError as ex:
            raise SystemExit(f"TTS 服务不可用：{args.url}\n{ex}\n"
                             "→ 先启动 GPT-SoVITS（见 USAGE.md），或 --dry-run 检查稿件")
        raw = out_dir / f"_{lid:02d}.raw"
        raw.write_bytes(data)
        af = EQ + (f",apad=pad_dur={tail}" if tail else "")
        r = subprocess.run([ff, "-y", "-v", "error", "-i", str(raw), "-af", af,
                            "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(dst)],
                           capture_output=True, text=True, encoding="utf-8", errors="ignore")
        raw.unlink(missing_ok=True)
        if r.returncode != 0:
            print(r.stderr[-1500:])
            sys.exit(1)
        print(f"  -> {dst.name}")


if __name__ == "__main__":
    main()
