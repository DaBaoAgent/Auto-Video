#!/usr/bin/env python3
"""Rebuild selected dabao paragraphs from short requests and splice them into a master WAV."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

from synthesize_dabao_paragraphs import (
    DEFAULT_ENGINE,
    DEFAULT_PYTHON,
    load_paragraphs,
    measure_boundary_gaps,
    trim_edge_silence,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def split_long_clause(text: str, maximum: int) -> list[str]:
    """按长度切开超长分句，并把过短的尾片并回前一片，避免只剩标点。"""
    parts = [
        text[start : start + maximum]
        for start in range(0, len(text), maximum)
    ]
    while len(parts) > 1 and len(parts[-1]) < 6:
        tail = parts.pop()
        parts[-1] += tail
    return parts


def split_requests(text: str, maximum: int, clause_per_request: bool = False) -> list[str]:
    sentences = [
        item.strip()
        for item in re.split(r"(?<=[。！？；])", text)
        if item.strip()
    ]
    clauses: list[str] = []
    for sentence in sentences:
        if clause_per_request:
            clauses.extend(
                item.strip()
                for item in re.split(r"(?<=[，；：])", sentence)
                if item.strip()
            )
            continue
        if len(sentence) <= maximum:
            clauses.append(sentence)
            continue
        parts = [
            item.strip()
            for item in re.split(r"(?<=[，；：])", sentence)
            if item.strip()
        ]
        clauses.extend(parts or [sentence])

    if clause_per_request:
        requests: list[str] = []
        for clause in clauses:
            if len(clause) <= maximum:
                requests.append(clause)
            else:
                requests.extend(split_long_clause(clause, maximum))
        return requests

    requests = []
    current = ""
    for clause in clauses:
        if len(clause) > maximum:
            if current:
                requests.append(current)
                current = ""
            requests.extend(split_long_clause(clause, maximum))
        elif current and len(current) + len(clause) > maximum:
            requests.append(current)
            current = clause
        else:
            current += clause
    if current:
        requests.append(current)
    return requests


def synthesize_request(
    python: Path,
    engine: Path,
    text: str,
    text_path: Path,
    audio_path: Path,
    keep_gap_ms: int,
    min_gap_ms: int,
) -> dict:
    text_path.write_text(text + "\n", encoding="utf-8")
    command = [
        str(python),
        "-X",
        "utf8",
        str(engine),
        "--text-file",
        str(text_path),
        "--out",
        str(audio_path),
        "--force",
        "--keep-server",
        "--keep-gap-ms",
        str(keep_gap_ms),
        "--min-gap-ms",
        str(min_gap_ms),
    ]
    result = subprocess.run(command, cwd=str(PROJECT_ROOT))
    if result.returncode:
        raise RuntimeError(f"短句配音失败，退出码 {result.returncode}")
    return json.loads(audio_path.with_suffix(".json").read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="修复指定自然段的漏读并重新拼接整片。")
    parser.add_argument("--text-file", required=True, type=Path)
    parser.add_argument("--audio-file", required=True, type=Path)
    parser.add_argument("--metadata-file", required=True, type=Path)
    parser.add_argument("--paragraphs", required=True, help="逗号分隔的自然段序号")
    parser.add_argument("--request-max-chars", type=int, default=38)
    parser.add_argument(
        "--clause-per-request",
        action="store_true",
        help="每个逗号/分号分句单独合成，适合修复枚举类漏读。",
    )
    parser.add_argument(
        "--whole-paragraph",
        action="store_true",
        help="按整段一次合成，适合只修正读音或语气且不希望拆碎节奏的情况。",
    )
    parser.add_argument("--sentence-gap-ms", type=int, default=60)
    parser.add_argument("--paragraph-gap-ms", type=int, default=200)
    parser.add_argument("--edge-pad-ms", type=int, default=10)
    parser.add_argument("--keep-gap-ms", type=int, default=80)
    parser.add_argument("--min-gap-ms", type=int, default=150)
    parser.add_argument("--python", type=Path, default=DEFAULT_PYTHON)
    parser.add_argument("--engine", type=Path, default=DEFAULT_ENGINE)
    parser.add_argument("--work-dir", type=Path)
    parser.add_argument("--keep-temp", action="store_true")
    args = parser.parse_args()

    text_path = args.text_file.resolve()
    audio_path = args.audio_file.resolve()
    metadata_path = args.metadata_file.resolve()
    paragraphs = load_paragraphs(text_path)
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    previous_repair = metadata.get("repair", {})
    previously_repaired = {
        int(item) for item in previous_repair.get("paragraphs", [])
    }
    if len(paragraphs) != len(metadata["paragraphs"]):
        raise SystemExit("口播稿自然段数与配音元数据不一致")
    targets = {int(item) for item in args.paragraphs.split(",") if item.strip()}
    if not targets or min(targets) < 1 or max(targets) > len(paragraphs):
        raise SystemExit("--paragraphs 超出自然段范围")
    for index, paragraph in enumerate(paragraphs, start=1):
        if paragraph != metadata["paragraphs"][index - 1]["text"]:
            raise SystemExit(f"第 {index} 段文本与配音元数据不一致")
    if not 0 < args.keep_gap_ms < args.min_gap_ms:
        raise SystemExit("需要 0 < --keep-gap-ms < --min-gap-ms")
    if args.request_max_chars < 12:
        raise SystemExit("--request-max-chars 至少为 12")

    master_audio, sample_rate = sf.read(audio_path, dtype="int16", always_2d=False)
    master_audio = np.asarray(master_audio, dtype=np.int16)
    if master_audio.ndim != 1:
        raise SystemExit("原配音不是单声道")

    work_dir = (
        args.work_dir.resolve()
        if args.work_dir
        else Path(
            tempfile.mkdtemp(
                prefix=f"_{audio_path.stem}_repair_",
                dir=str(audio_path.parent),
            )
        )
    )
    work_dir.mkdir(parents=True, exist_ok=True)

    old_paragraphs: list[np.ndarray] = []
    for record in metadata["paragraphs"]:
        start = int(round(float(record["start"]) * sample_rate))
        end = start + int(round(float(record["duration"]) * sample_rate))
        old_paragraphs.append(master_audio[start:end])

    replacements: dict[int, tuple[np.ndarray, list[dict]]] = {}
    gap_samples = int(sample_rate * args.sentence_gap_ms / 1000)
    sentence_gap = np.zeros(gap_samples, dtype=np.int16)

    for index in sorted(targets):
        requests = (
            [paragraphs[index - 1]]
            if args.whole_paragraph
            else split_requests(
                paragraphs[index - 1],
                args.request_max_chars,
                args.clause_per_request,
            )
        )
        print(f"第 {index} 段拆成 {len(requests)} 个短句请求", flush=True)
        pieces: list[np.ndarray] = []
        records: list[dict] = []
        cursor = 0.0
        for request_index, text in enumerate(requests, start=1):
            request_text = work_dir / f"paragraph_{index:02d}_{request_index:03d}.txt"
            request_audio = work_dir / f"paragraph_{index:02d}_{request_index:03d}.wav"
            request_meta = synthesize_request(
                python=args.python,
                engine=args.engine,
                text=text,
                text_path=request_text,
                audio_path=request_audio,
                keep_gap_ms=args.keep_gap_ms,
                min_gap_ms=args.min_gap_ms,
            )
            audio, current_rate = sf.read(request_audio, dtype="int16", always_2d=False)
            audio = np.asarray(audio, dtype=np.int16)
            if current_rate != sample_rate or audio.ndim != 1:
                raise RuntimeError(f"第 {index} 段短句音频规格不一致")
            audio, _, _ = trim_edge_silence(audio, sample_rate, args.edge_pad_ms)
            duration = len(audio) / sample_rate
            source_chunk = request_meta["chunks"][0]
            records.append(
                {
                    "paragraph_index": index,
                    "request_index": request_index,
                    "text": text,
                    "spoken": source_chunk["spoken"],
                    "start": round(cursor, 4),
                    "duration": round(duration, 4),
                }
            )
            pieces.append(audio)
            cursor += duration
            if request_index < len(requests):
                pieces.append(sentence_gap)
                cursor += len(sentence_gap) / sample_rate
            print(
                f"  短句 {request_index}/{len(requests)} 完成：{len(text)} 字",
                flush=True,
            )
        paragraph_audio = np.concatenate(pieces)
        replacements[index] = (paragraph_audio, records)

    final_pieces: list[np.ndarray] = []
    final_paragraphs: list[dict] = []
    final_chunks: list[dict] = []
    paragraph_gap = np.zeros(
        int(sample_rate * args.paragraph_gap_ms / 1000),
        dtype=np.int16,
    )
    timeline = 0.0
    global_chunk_index = 1

    for index, (record, original_audio) in enumerate(
        zip(metadata["paragraphs"], old_paragraphs),
        start=1,
    ):
        if index in replacements:
            paragraph_audio, request_records = replacements[index]
            paragraph_chunks = []
            for item in request_records:
                paragraph_chunks.append(
                    {
                        **item,
                        "index": global_chunk_index,
                        "start": round(timeline + float(item["start"]), 4),
                    }
                )
                global_chunk_index += 1
            edge_trim = {"start": args.edge_pad_ms, "end": args.edge_pad_ms}
        else:
            paragraph_audio = original_audio
            paragraph_chunks = []
            for chunk in metadata["chunks"]:
                if chunk["paragraph_index"] != index:
                    continue
                relative_start = float(chunk["start"]) - float(record["start"])
                paragraph_chunks.append(
                    {
                        **chunk,
                        "index": global_chunk_index,
                        "start": round(timeline + relative_start, 4),
                    }
                )
                global_chunk_index += 1
            edge_trim = record.get("edge_trim_ms", {})

        duration = len(paragraph_audio) / sample_rate
        final_paragraphs.append(
            {
                "index": index,
                "text": paragraphs[index - 1],
                "start": round(timeline, 4),
                "duration": round(duration, 4),
                "chunk_count": len(paragraph_chunks),
                "gap_after_ms": args.paragraph_gap_ms if index < len(paragraphs) else 0,
                "edge_trim_ms": edge_trim,
                "repaired_with_short_requests": (
                    index in replacements
                    or bool(record.get("repaired_with_short_requests"))
                ),
            }
        )
        final_chunks.extend(paragraph_chunks)
        final_pieces.append(paragraph_audio)
        timeline += duration
        if index < len(paragraphs):
            final_pieces.append(paragraph_gap)
            timeline += len(paragraph_gap) / sample_rate

    final_audio = np.concatenate(final_pieces)
    clipped = int(np.sum(np.abs(final_audio) >= 32767))
    if clipped:
        raise RuntimeError(f"修复后存在 {clipped} 个削波采样")
    temp_audio = audio_path.with_name(f"{audio_path.stem}.repair.tmp{audio_path.suffix}")
    sf.write(temp_audio, final_audio, sample_rate, subtype="PCM_16")
    temp_audio.replace(audio_path)

    metadata["duration"] = round(len(final_audio) / sample_rate, 4)
    metadata["paragraphs"] = final_paragraphs
    metadata["chunks"] = final_chunks
    metadata["observed_paragraph_gap"] = measure_boundary_gaps(
        final_audio,
        sample_rate,
        [item["start"] for item in final_paragraphs],
    )
    metadata["repair"] = {
        "paragraphs": sorted(previously_repaired | targets),
        "latest_short_request_repair": sorted(targets),
        "request_max_chars": args.request_max_chars,
        "clause_per_request": args.clause_per_request,
        "whole_paragraph": args.whole_paragraph,
        "sentence_gap_ms": args.sentence_gap_ms,
        "edge_pad_ms": args.edge_pad_ms,
    }
    metadata["quality"] = {
        "peak": round(
            float(np.max(np.abs(final_audio.astype(np.float32))) / 32768),
            6,
        ),
        "clipped_samples": clipped,
    }
    temp_metadata = metadata_path.with_name(
        f"{metadata_path.stem}.repair.tmp{metadata_path.suffix}"
    )
    temp_metadata.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp_metadata.replace(metadata_path)
    print(
        f"修复完成：{audio_path}，{len(final_audio) / sample_rate:.2f} 秒",
        flush=True,
    )

    if not args.keep_temp and not args.work_dir:
        shutil.rmtree(work_dir, ignore_errors=True)
    else:
        print(f"修复分段保留：{work_dir}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
