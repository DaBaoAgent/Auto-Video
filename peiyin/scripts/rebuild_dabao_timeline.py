#!/usr/bin/env python3
"""按元数据自然段重建 dabao 主音频，并恢复固定幕间停顿。"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import soundfile as sf

from synthesize_dabao_paragraphs import (
    measure_boundary_gaps,
    trim_edge_silence,
)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="按自然段重组配音，统一幕间停顿并刷新时间轴。"
    )
    parser.add_argument("--audio-file", required=True, type=Path)
    parser.add_argument("--metadata-file", type=Path)
    parser.add_argument("--paragraph-gap-ms", type=int, default=200)
    parser.add_argument("--edge-pad-ms", type=int, default=10)
    parser.add_argument("--silence-db", type=float, default=-40.0)
    args = parser.parse_args()

    audio_path = args.audio_file.resolve()
    metadata_path = (
        args.metadata_file.resolve()
        if args.metadata_file
        else audio_path.with_suffix(".json")
    )
    audio, sample_rate = sf.read(audio_path, dtype="int16", always_2d=False)
    audio = np.asarray(audio, dtype=np.int16)
    if audio.ndim != 1:
        raise SystemExit("只支持单声道配音")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    old_paragraphs = metadata.get("paragraphs") or []
    if not old_paragraphs:
        raise SystemExit("元数据缺少自然段时间轴")

    pieces: list[np.ndarray] = []
    paragraphs: list[dict] = []
    chunks: list[dict] = []
    timeline = 0.0
    gap = np.zeros(
        int(sample_rate * args.paragraph_gap_ms / 1000), dtype=np.int16
    )

    for index, old in enumerate(old_paragraphs, start=1):
        start = int(round(float(old["start"]) * sample_rate))
        end = start + int(round(float(old["duration"]) * sample_rate))
        part, trim_begin, trim_end = trim_edge_silence(
            audio[start:end],
            sample_rate,
            args.edge_pad_ms,
            args.silence_db,
        )
        duration = len(part) / sample_rate
        part_start = timeline

        for chunk in metadata.get("chunks", []):
            if int(chunk.get("paragraph_index", 0)) != index:
                continue
            relative_start = max(
                0.0,
                float(chunk["start"])
                - float(old["start"])
                - trim_begin / sample_rate,
            )
            chunks.append(
                {
                    **chunk,
                    "start": round(part_start + relative_start, 4),
                }
            )

        paragraphs.append(
            {
                **old,
                "index": index,
                "start": round(part_start, 4),
                "duration": round(duration, 4),
                "gap_after_ms": (
                    args.paragraph_gap_ms
                    if index < len(old_paragraphs)
                    else 0
                ),
                "edge_trim_ms": {
                    "start": round(trim_begin / sample_rate * 1000, 1),
                    "end": round(
                        (len(audio[start:end]) - trim_end)
                        / sample_rate
                        * 1000,
                        1,
                    ),
                },
            }
        )
        pieces.append(part)
        timeline += duration
        if index < len(old_paragraphs):
            pieces.append(gap)
            timeline += len(gap) / sample_rate

    rebuilt = np.concatenate(pieces)
    clipped = int(np.sum(np.abs(rebuilt) >= 32767))
    if clipped:
        raise SystemExit(f"重建后存在 {clipped} 个削波采样")

    temp_audio = audio_path.with_name(
        f"{audio_path.stem}.timeline.tmp{audio_path.suffix}"
    )
    sf.write(temp_audio, rebuilt, sample_rate, subtype="PCM_16")
    metadata["duration"] = round(len(rebuilt) / sample_rate, 4)
    metadata["paragraph_gap_ms"] = args.paragraph_gap_ms
    metadata["edge_pad_ms"] = args.edge_pad_ms
    metadata["paragraphs"] = paragraphs
    metadata["chunks"] = chunks
    metadata["observed_paragraph_gap"] = measure_boundary_gaps(
        rebuilt,
        sample_rate,
        [item["start"] for item in paragraphs],
    )
    metadata["quality"] = {
        "peak": round(
            float(np.max(np.abs(rebuilt.astype(np.float32))) / 32768), 6
        ),
        "clipped_samples": clipped,
    }
    metadata.setdefault("timeline_rebuild", {})
    metadata["timeline_rebuild"] = {
        "paragraph_gap_ms": args.paragraph_gap_ms,
        "edge_pad_ms": args.edge_pad_ms,
        "silence_db": args.silence_db,
    }
    temp_metadata = metadata_path.with_name(
        f"{metadata_path.stem}.timeline.tmp{metadata_path.suffix}"
    )
    temp_metadata.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp_audio.replace(audio_path)
    temp_metadata.replace(metadata_path)
    print(
        f"时间轴重建完成：{len(paragraphs)} 段，"
        f"{len(rebuilt) / sample_rate:.2f} 秒，"
        f"幕间目标 {args.paragraph_gap_ms}ms",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
