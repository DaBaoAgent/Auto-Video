# -*- coding: utf-8 -*-
"""项目口播 + BGM 闪避 + 环境声 → work/public/audio/mix.m4a。

读 projects/<slug>/data/voiceover.json 的 t0 落位每句配音，BGM 自动取全曲最响的
一段对到片尾高潮（默认 片长-10s），侧链压缩做 10–12dB 闪避，最后 loudnorm。

用法：
    python chengshi/scripts/mix_audio.py --project suzhou
    python chengshi/scripts/mix_audio.py --project suzhou --voice-dir projects/suzhou/work/audio/vo

配音文件：--voice-dir 下的 NN.wav / NN.mp3 / NN.flac / NN.m4a（NN = voiceover.json 的 id）。
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]          # Auto-Video/
FF_FALLBACK = Path(r"C:/Users/20200/bin/ffmpeg.exe")
VOICE_EXTS = (".wav", ".mp3", ".flac", ".m4a")


def ffmpeg() -> str:
    if FF_FALLBACK.exists():
        return str(FF_FALLBACK)
    found = shutil.which("ffmpeg")
    if not found:
        raise SystemExit(f"找不到 ffmpeg：{FF_FALLBACK}")
    return found


def probe_duration(ff: str, path: Path) -> float:
    r = subprocess.run([ff, "-i", str(path), "-hide_banner"],
                       capture_output=True, text=True, encoding="utf-8", errors="ignore")
    for line in r.stderr.splitlines():
        line = line.strip()
        if line.startswith("Duration:"):
            h, m, s = line.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError(f"无法读取时长: {path}")


def find_climax(ff: str, bgm: Path) -> float:
    """1 秒窗 RMS，3 秒平滑，取 60s 之后的最响处"""
    sr = 8000
    raw = subprocess.run(
        [ff, "-i", str(bgm), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
        capture_output=True,
    ).stdout
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    n = len(x) // sr
    if n < 1:
        return 0.0
    rms = np.sqrt((x[: n * sr].reshape(n, sr) ** 2).mean(axis=1) + 1e-9)
    db = 20 * np.log10(rms)
    sm = np.convolve(db, np.ones(3) / 3, mode="same")
    lo = min(60, n - 1)
    return float(np.argmax(sm[lo:]) + lo)


def voice_file(voice_dir: Path, line_id: int) -> Path:
    for ext in VOICE_EXTS:
        p = voice_dir / f"{line_id:02d}{ext}"
        if p.exists():
            return p
    raise SystemExit(f"缺口播 {line_id:02d}（在 {voice_dir} 找 {VOICE_EXTS}）")


def build_filter(lines: list[dict], duration: float, start: float, no_sfx: bool) -> list[str]:
    fc = []
    for i, line in enumerate(lines):
        ms = int(round(line["t0"] * 1000))
        fc.append(f"[{i}:a]aresample=48000,adelay={ms}|{ms},volume=1.0[v{i}]")
    fc.append("".join(f"[v{i}]" for i in range(len(lines))) +
              f"amix=inputs={len(lines)}:normalize=0[vo0]")
    # 侧链键不能随最后一句口播结束，否则 sidechaincompress 会把 BGM 截短
    fc.append(f"[vo0]apad=whole_dur={duration:.3f},asplit=2[vo][vo_sc]")

    nb = len(lines)
    fc.append(
        f"[{nb}:a]atrim={start:.3f}:{start + duration:.3f},asetpts=PTS-STARTPTS,"
        f"afade=t=in:d=2.5,afade=t=out:st={duration - 3.0:.3f}:d=3.0,volume=0.85[bg0]"
    )
    fc.append("[bg0][vo_sc]sidechaincompress=threshold=0.02:ratio=10:attack=120:release=800:makeup=1[bg]")

    if no_sfx:
        fc.append("[bg][vo]amix=inputs=2:normalize=0:duration=first[mix0]")
    else:
        fc.append(
            f"anoisesrc=color=pink:sample_rate=48000:amplitude=0.35:d={duration:.3f},"
            "lowpass=f=650,highpass=f=90,tremolo=f=0.1:d=0.65,volume=0.12[wind]"
        )
        fc.append(
            f"anoisesrc=color=brown:sample_rate=48000:amplitude=0.3:d={duration:.3f},"
            "lowpass=f=1500,highpass=f=320,tremolo=f=0.1:d=0.4,volume=0.05[water]"
        )
        fc.append(
            f"[wind][water]amix=inputs=2:normalize=0,afade=t=in:d=3,"
            f"afade=t=out:st={duration - 5.0:.3f}:d=5.0[sfx]"
        )
        fc.append("[bg][vo][sfx]amix=inputs=3:normalize=0:duration=first[mix0]")
    return fc


def main() -> None:
    ap = argparse.ArgumentParser(prog="mix_audio", description="口播+BGM 闪避+环境声混音")
    ap.add_argument("--project", required=True)
    ap.add_argument("--voice-dir", type=Path, default=None)
    ap.add_argument("--bgm", default="", help="覆盖 film.json 的 audio.music")
    ap.add_argument("--duration", type=float, default=None)
    ap.add_argument("--climax-at", type=float, default=None,
                    help="BGM 高潮落在成片的第几秒（默认 片长-10）")
    ap.add_argument("--mix-tp", type=float, default=-1.8, help="混音母版真峰值")
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    proj = ROOT / "projects" / args.project
    film = json.loads((proj / "film.json").read_text(encoding="utf-8-sig"))
    vo_path = proj / "data" / "voiceover.json"
    if not vo_path.exists():
        raise SystemExit(f"缺 {vo_path}")
    lines = json.loads(vo_path.read_text(encoding="utf-8-sig"))["lines"]
    if not lines:
        raise SystemExit("voiceover.json 没有 lines")

    duration = float(args.duration if args.duration else film["duration"])
    climax_at = float(args.climax_at if args.climax_at is not None else duration - 10.0)
    bgm_s = args.bgm or (film.get("audio") or {}).get("music", "")
    if not bgm_s:
        raise SystemExit("film.json 没配 audio.music；加 --bgm 指定配乐")
    bgm = Path(bgm_s)
    if not bgm.is_absolute():
        bgm = (proj / bgm).resolve()
    if not bgm.exists():
        raise SystemExit(f"配乐不存在：{bgm}")

    voice_dir = args.voice_dir or (proj / "work" / "audio" / "vo")
    ff = ffmpeg()
    vo_files = [voice_file(voice_dir, int(line["id"])) for line in lines]

    bgm_len = probe_duration(ff, bgm)
    climax = find_climax(ff, bgm)
    start = max(0.0, min(climax - climax_at, bgm_len - duration))
    print(f"配音 {len(lines)} 句（{voice_dir}）")
    print(f"BGM {bgm_len:.1f}s，高潮 {climax:.1f}s → 从 {start:.2f}s 截 {duration:.2f}s"
          f"（高潮落在 {climax_at:.1f}s）")

    for f, line in zip(vo_files, lines):
        d = probe_duration(ff, f)
        slot = line["t1"] - line["t0"]
        if d > slot + 0.08:
            print(f"  注意：{f.name} 时长 {d:.2f}s 超过槽位 {slot:.2f}s")

    inputs = []
    for f in vo_files:
        inputs += ["-i", str(f)]
    inputs += ["-i", str(bgm)]

    lufs = float((film.get("audio") or {}).get("loudness", {}).get("lufs", -15.0))
    fc = build_filter(lines, duration, start, args.no_sfx)
    fc.append(f"[mix0]loudnorm=I={lufs}:TP={args.mix_tp}:LRA=11:print_format=summary[mix]")

    out = args.out or (proj / "work" / "public" / "audio" / "mix.m4a")
    cmd = [ff, "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[mix]",
           "-t", f"{duration:.3f}", "-ar", "48000", "-ac", "2",
           "-c:a", "aac", "-b:a", "192k", str(out)]

    if args.dry_run:
        print("[dry-run] " + " ".join(cmd))
        return

    out.parent.mkdir(parents=True, exist_ok=True)
    print("ffmpeg …")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if r.returncode != 0:
        print(r.stderr[-4000:])
        sys.exit(1)
    print(f"[OK] 混音完成 -> {out}")
    print(r.stderr[-600:])


if __name__ == "__main__":
    main()
