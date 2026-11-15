#!/usr/bin/env python3
"""清理 dabao 成品中句间明显的呼吸声，同时保留原时间轴。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf
from faster_whisper.audio import decode_audio
from faster_whisper.vad import VadOptions, get_speech_timestamps


def main() -> int:
    parser = argparse.ArgumentParser(
        description="检测并压掉句间高能非语音片段，不改变语音和时间轴。"
    )
    parser.add_argument("--audio-file", required=True, type=Path)
    parser.add_argument("--metadata-file", type=Path)
    parser.add_argument("--vad-threshold", type=float, default=0.6)
    parser.add_argument("--speech-pad-ms", type=int, default=20)
    parser.add_argument("--min-gap-ms", type=int, default=80)
    parser.add_argument("--noise-db", type=float, default=-30.0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    audio_path = args.audio_file.resolve()
    metadata_path = (
        args.metadata_file.resolve()
        if args.metadata_file
        else audio_path.with_suffix(".json")
    )
    if not audio_path.is_file():
        raise SystemExit(f"找不到音频：{audio_path}")
    if not metadata_path.is_file():
        raise SystemExit(f"找不到配音元数据：{metadata_path}")

    audio, sample_rate = sf.read(audio_path, dtype="int16", always_2d=False)
    audio = np.asarray(audio, dtype=np.int16)
    if audio.ndim != 1:
        raise SystemExit("只支持单声道配音")

    probe_rate = 16000
    probe_audio = decode_audio(audio_path, sampling_rate=probe_rate)
    speech = get_speech_timestamps(
        probe_audio,
        vad_options=VadOptions(
            threshold=args.vad_threshold,
            min_speech_duration_ms=80,
            min_silence_duration_ms=30,
            speech_pad_ms=args.speech_pad_ms,
        ),
        sampling_rate=probe_rate,
    )

    candidates: list[dict] = []
    for left, right in zip(speech, speech[1:]):
        start = float(left["end"]) / probe_rate
        end = float(right["start"]) / probe_rate
        duration = end - start
        if duration * 1000 < args.min_gap_ms:
            continue
        sample = probe_audio[
            int(start * probe_rate) : int(end * probe_rate)
        ]
        if not len(sample):
            continue
        rms = float(np.sqrt(np.mean(sample.astype(np.float32) ** 2)) + 1e-12)
        rms_db = 20 * np.log10(rms)
        if rms_db <= args.noise_db:
            continue
        peak_db = 20 * np.log10(float(np.max(np.abs(sample))) + 1e-12)
        candidates.append(
            {
                "start": round(start, 4),
                "end": round(end, 4),
                "duration": round(duration, 4),
                "rms_db": round(rms_db, 2),
                "peak_db": round(peak_db, 2),
            }
        )

    print(
        f"检测到 {len(candidates)} 段句间气声，累计 "
        f"{sum(item['duration'] for item in candidates):.2f} 秒",
        flush=True,
    )
    if args.dry_run:
        for item in candidates:
            print(
                f"  {item['start']:8.2f}-{item['end']:8.2f} "
                f"{item['duration']:.3f}s RMS {item['rms_db']:.1f} dB",
                flush=True,
            )
        return 0

    cleaned = audio.astype(np.float32).copy()
    for item in candidates:
        begin = max(0, int(round(item["start"] * sample_rate)))
        end = min(len(cleaned), int(round(item["end"] * sample_rate)))
        if begin >= end:
            continue
        region = cleaned[begin:end]
        fade = min(int(sample_rate * 0.003), len(region) // 2)
        region[:fade] *= np.linspace(
            1.0, 0.0, fade, dtype=np.float32
        )
        region[fade:] = 0.0

    peak = float(np.max(np.abs(cleaned)))
    if peak >= 32767:
        raise SystemExit("清理后存在削波，未写入")

    temp_audio = audio_path.with_name(f"{audio_path.stem}.breath-clean.tmp{audio_path.suffix}")
    sf.write(temp_audio, cleaned.astype(np.int16), sample_rate, subtype="PCM_16")

    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    previous = metadata.get("breath_cleanup")
    passes = list(previous.get("passes", [])) if previous else []
    if previous and not passes:
        passes.append(
            {
                "parameters": previous.get("parameters", {}),
                "candidate_count": int(previous.get("candidate_count", 0)),
                "attenuated_seconds": float(
                    previous.get("attenuated_seconds", 0)
                ),
                "intervals": previous.get("intervals", []),
            }
        )
    this_pass = {
        "parameters": {
            "vad_threshold": args.vad_threshold,
            "speech_pad_ms": args.speech_pad_ms,
            "min_gap_ms": args.min_gap_ms,
            "noise_db": args.noise_db,
        },
        "candidate_count": len(candidates),
        "attenuated_seconds": round(
            sum(item["duration"] for item in candidates), 4
        ),
        "intervals": candidates,
    }
    passes.append(this_pass)
    metadata["breath_cleanup"] = {
        "method": "silero-vad inter-speech gap zeroing",
        "pass_count": len(passes),
        "candidate_count": sum(
            int(item["candidate_count"]) for item in passes
        ),
        "attenuated_seconds": round(
            sum(float(item["attenuated_seconds"]) for item in passes), 4
        ),
        "latest_parameters": this_pass["parameters"],
        "passes": passes,
        "peak": round(peak / 32768, 6),
        "clipped_samples": 0,
    }
    metadata.setdefault("quality", {})["peak"] = round(peak / 32768, 6)
    metadata["quality"]["clipped_samples"] = 0
    temp_metadata = metadata_path.with_name(
        f"{metadata_path.stem}.breath-clean.tmp{metadata_path.suffix}"
    )
    temp_metadata.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    temp_audio.replace(audio_path)
    temp_metadata.replace(metadata_path)
    print(f"清理完成：{audio_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
