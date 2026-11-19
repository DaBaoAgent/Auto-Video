#!/usr/bin/env python3
"""Synthesize dabao narration paragraph by paragraph and join with a controlled gap."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PYTHON = PROJECT_ROOT / "GPT-SoVITS" / ".venv" / "Scripts" / "python.exe"
DEFAULT_ENGINE = PROJECT_ROOT / "GPT-SoVITS" / "dabao_tts.py"


def load_paragraphs(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = []
    for block in text.split("\n\n"):
        normalized = " ".join(line.strip() for line in block.splitlines() if line.strip())
        if normalized:
            paragraphs.append(normalized)
    if len(paragraphs) == 1:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if len(lines) > 1:
            return lines
    return paragraphs


def run_engine(
    python: Path,
    engine: Path,
    text_path: Path,
    out_path: Path,
    keep_gap_ms: int,
    min_gap_ms: int,
    index: int,
    total: int,
) -> None:
    command = [
        str(python),
        "-X",
        "utf8",
        str(engine),
        "--text-file",
        str(text_path),
        "--out",
        str(out_path),
        "--force",
        "--keep-server",
        "--keep-gap-ms",
        str(keep_gap_ms),
        "--min-gap-ms",
        str(min_gap_ms),
    ]
    print(f"[{index}/{total}] 合成第 {index} 段", flush=True)
    result = subprocess.run(command, cwd=str(PROJECT_ROOT))
    if result.returncode:
        raise RuntimeError(f"第 {index} 段配音失败，退出码 {result.returncode}")


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    audio, sample_rate = sf.read(path, dtype="int16", always_2d=False)
    if audio.ndim != 1:
        raise RuntimeError(f"{path} 不是单声道")
    return np.asarray(audio, dtype=np.int16), sample_rate


def trim_edge_silence(
    audio: np.ndarray,
    sample_rate: int,
    pad_ms: int,
    threshold_db: float = -40.0,
) -> tuple[np.ndarray, int, int]:
    """Trim only leading/trailing silence while keeping a short safety pad."""
    if not len(audio):
        return audio, 0, 0
    hop = max(1, sample_rate // 100)
    frame_count = len(audio) // hop
    if not frame_count:
        return audio, 0, 0
    frames = (
        audio[: frame_count * hop].astype(np.float32) / 32768.0
    ).reshape(frame_count, hop)
    rms = np.sqrt(np.mean(frames * frames, axis=1))
    db = 20 * np.log10(rms + 1e-12)
    voiced = np.flatnonzero(db > threshold_db)
    if not len(voiced):
        return audio, 0, 0
    pad = int(sample_rate * pad_ms / 1000)
    begin = max(0, int(voiced[0]) * hop - pad)
    end = min(len(audio), (int(voiced[-1]) + 1) * hop + pad)
    trimmed = audio[begin:end].copy()
    fade = min(int(sample_rate * 0.004), len(trimmed) // 2)
    if fade:
        trimmed[:fade] = (
            trimmed[:fade].astype(np.float32)
            * np.linspace(0.0, 1.0, fade, dtype=np.float32)
        ).astype(np.int16)
        trimmed[-fade:] = (
            trimmed[-fade:].astype(np.float32)
            * np.linspace(1.0, 0.0, fade, dtype=np.float32)
        ).astype(np.int16)
    return trimmed, begin, end


def measure_boundary_gaps(
    audio: np.ndarray,
    sample_rate: int,
    starts: list[float],
    threshold_db: float = -40.0,
) -> dict[str, float | list[int]]:
    hop = max(1, sample_rate // 100)
    frame_count = len(audio) // hop
    if frame_count < 2:
        return {"min_ms": 0, "median_ms": 0, "max_ms": 0, "samples_ms": []}
    frames = (
        audio[: frame_count * hop].astype(np.float32) / 32768.0
    ).reshape(frame_count, hop)
    rms = np.sqrt(np.mean(frames * frames, axis=1))
    voiced = 20 * np.log10(rms + 1e-12) > threshold_db
    gaps = []
    for start in starts[1:]:
        frame = int(start * sample_rate / hop)
        left = frame - 1
        while left >= 0 and not voiced[left]:
            left -= 1
        right = frame
        while right < frame_count and not voiced[right]:
            right += 1
        if left >= 0 and right < frame_count:
            gaps.append((right - left - 1) * hop * 1000 // sample_rate)
    if not gaps:
        return {"min_ms": 0, "median_ms": 0, "max_ms": 0, "samples_ms": []}
    return {
        "min_ms": int(min(gaps)),
        "median_ms": float(np.median(gaps)),
        "max_ms": int(max(gaps)),
        "samples_ms": gaps,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="按自然段合成 dabao 配音，并在段落之间加入固定短停顿。"
    )
    parser.add_argument("--text-file", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--paragraph-gap-ms", type=int, default=200)
    parser.add_argument("--keep-gap-ms", type=int, default=80)
    parser.add_argument("--min-gap-ms", type=int, default=150)
    parser.add_argument("--edge-pad-ms", type=int, default=10)
    parser.add_argument("--python", type=Path, default=DEFAULT_PYTHON)
    parser.add_argument("--engine", type=Path, default=DEFAULT_ENGINE)
    parser.add_argument(
        "--reuse-temp-dir",
        type=Path,
        help="复用已经合成好的 paragraph_NN.wav，只重新拼接和生成元数据。",
    )
    parser.add_argument("--keep-temp", action="store_true")
    args = parser.parse_args()

    text_path = args.text_file.resolve()
    output_path = args.out.resolve()
    paragraphs = load_paragraphs(text_path)
    if not paragraphs:
        raise SystemExit("口播稿为空")
    if args.paragraph_gap_ms <= 0:
        raise SystemExit("--paragraph-gap-ms 必须大于零")
    if not 0 < args.keep_gap_ms < args.min_gap_ms:
        raise SystemExit("需要 0 < --keep-gap-ms < --min-gap-ms")
    if not args.python.is_file() or not args.engine.is_file():
        raise SystemExit("配音引擎或项目虚拟环境不完整")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    reuse_temp = bool(args.reuse_temp_dir)
    if reuse_temp:
        temp_dir = args.reuse_temp_dir.resolve()
        if not temp_dir.is_dir():
            raise SystemExit(f"待复用目录不存在：{temp_dir}")
    else:
        temp_dir = Path(
            tempfile.mkdtemp(
                prefix=f"_{output_path.stem}_paragraphs_",
                dir=str(output_path.parent),
            )
        )
    metadata_path = output_path.with_suffix(".json")
    temp_output = output_path.with_name(f"{output_path.stem}.tmp{output_path.suffix}")
    temp_metadata = metadata_path.with_name(f"{metadata_path.stem}.tmp{metadata_path.suffix}")

    paragraph_records = []
    flat_chunks = []
    audio_pieces = []
    timeline = 0.0
    sample_rate = 0

    try:
        for index, paragraph in enumerate(paragraphs, start=1):
            audio_part = temp_dir / f"paragraph_{index:02d}.wav"
            meta_part = audio_part.with_suffix(".json")
            if not reuse_temp:
                text_part = temp_dir / f"paragraph_{index:02d}.txt"
                text_part.write_text(paragraph + "\n", encoding="utf-8")
                run_engine(
                    python=args.python,
                    engine=args.engine,
                    text_path=text_part,
                    out_path=audio_part,
                    keep_gap_ms=args.keep_gap_ms,
                    min_gap_ms=args.min_gap_ms,
                    index=index,
                    total=len(paragraphs),
                )
            elif not audio_part.is_file() or not meta_part.is_file():
                raise SystemExit(f"复用目录缺少第 {index} 段音频或元数据")

            audio, current_rate = read_wav(audio_part)
            original_length = len(audio)
            if sample_rate == 0:
                sample_rate = current_rate
            elif current_rate != sample_rate:
                raise RuntimeError("各段采样率不一致")
            audio, trim_begin, trim_end = trim_edge_silence(
                audio,
                sample_rate,
                args.edge_pad_ms,
            )
            duration = len(audio) / sample_rate
            part_metadata = json.loads(meta_part.read_text(encoding="utf-8"))
            for chunk in part_metadata["chunks"]:
                chunk_record = dict(chunk)
                chunk_record["paragraph_index"] = index
                relative_start = max(
                    0.0,
                    float(chunk["start"]) - trim_begin / sample_rate,
                )
                chunk_record["start"] = round(timeline + relative_start, 4)
                flat_chunks.append(chunk_record)

            paragraph_records.append(
                {
                    "index": index,
                    "text": paragraph,
                    "start": round(timeline, 4),
                    "duration": round(duration, 4),
                    "chunk_count": len(part_metadata["chunks"]),
                    "gap_after_ms": args.paragraph_gap_ms if index < len(paragraphs) else 0,
                    "edge_trim_ms": {
                        "start": round(trim_begin / sample_rate * 1000, 1),
                        "end": round((original_length - trim_end) / sample_rate * 1000, 1),
                    },
                }
            )
            audio_pieces.append(audio)
            timeline += duration
            if index < len(paragraphs):
                gap = np.zeros(
                    int(sample_rate * args.paragraph_gap_ms / 1000),
                    dtype=np.int16,
                )
                audio_pieces.append(gap)
                timeline += len(gap) / sample_rate

        final_audio = np.concatenate(audio_pieces)
        clipped = int(np.sum(np.abs(final_audio) >= 32767))
        if clipped:
            raise RuntimeError(f"最终音频存在 {clipped} 个削波采样")
        sf.write(temp_output, final_audio, sample_rate, subtype="PCM_16")
        temp_output.replace(output_path)

        first_metadata = json.loads(
            (temp_dir / "paragraph_01.json").read_text(encoding="utf-8")
        )
        observed_gaps = measure_boundary_gaps(
            final_audio,
            sample_rate,
            [item["start"] for item in paragraph_records],
        )
        final_metadata = {
            key: first_metadata[key]
            for key in (
                "fingerprint",
                "preset",
                "voice_id",
                "voice",
                "model",
                "split",
                "speed",
                "sampling",
                "speakFixes",
                "tone_filter",
            )
            if key in first_metadata
        }
        final_metadata.update(
            {
                "duration": round(len(final_audio) / sample_rate, 4),
                "sample_rate": sample_rate,
                "channels": 1,
                "codec": "pcm_s16le",
                "paragraph_count": len(paragraphs),
                "paragraph_gap_ms": args.paragraph_gap_ms,
                "edge_pad_ms": args.edge_pad_ms,
                "observed_paragraph_gap": observed_gaps,
                "tighten": {
                    "min_gap_ms": args.min_gap_ms,
                    "keep_gap_ms": args.keep_gap_ms,
                    "silence_db": first_metadata["tighten"]["silence_db"],
                    "gate_db": first_metadata["tighten"]["gate_db"],
                    "gate_floor": first_metadata["tighten"]["gate_floor"],
                },
                "script": str(text_path),
                "paragraphs": paragraph_records,
                "chunks": flat_chunks,
                "quality": {
                    "peak": round(float(np.max(np.abs(final_audio.astype(np.float32))) / 32768), 6),
                    "clipped_samples": clipped,
                },
            }
        )
        temp_metadata.write_text(
            json.dumps(final_metadata, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        temp_metadata.replace(metadata_path)
        print(
            f"完成：{output_path}，{len(paragraphs)} 个自然段，"
            f"{len(final_audio) / sample_rate:.2f} 秒，段间停顿 {args.paragraph_gap_ms}ms",
            flush=True,
        )
    except Exception:
        temp_output.unlink(missing_ok=True)
        temp_metadata.unlink(missing_ok=True)
        raise
    finally:
        if reuse_temp:
            print(f"复用分段目录：{temp_dir}", flush=True)
        elif not args.keep_temp:
            shutil.rmtree(temp_dir, ignore_errors=True)
        else:
            print(f"临时目录保留：{temp_dir}", flush=True)

    return 0


if __name__ == "__main__":
    sys.exit(main())
