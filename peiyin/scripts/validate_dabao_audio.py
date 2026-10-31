#!/usr/bin/env python3
"""dabao 配音后审查门禁：校验规格、全文覆盖、幕间停顿和结尾完整性。"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import re
import sys
import tempfile
import time
from pathlib import Path

import cn2an
import numpy as np
import soundfile as sf
from pypinyin import Style, lazy_pinyin

from synthesize_dabao_paragraphs import measure_boundary_gaps


HAN_RANGE = "\u3400-\u9fff"
HAN_CHAR_RE = re.compile(f"[{HAN_RANGE}]")
NUMBER_RE = re.compile(r"(?<!\d)(\d+(?:\.\d+)?)(%?)(?!\d)")
YEAR_RE = re.compile(r"(?<!\d)((?:18|19|20|21)\d{2})(?!\d)")
DIGITS = "零一二三四五六七八九"
FIXED_ENDING = "我是艾伦遛狗去了白了个白"
SPEECH_ALIASES = (
    (
        re.compile(r"(?i)(?<![A-Z])U\s*[.\-]?\s*F\s*[.\-]?\s*O(?![A-Z])"),
        "优艾弗欧",
    ),
    (
        re.compile(r"(?i)(?<![A-Z])U\s*[.\-]?\s*A\s*[.\-]?\s*P(?![A-Z])"),
        "优诶皮",
    ),
    (
        re.compile(r"(?i)(?<![A-Z])N\s*[.\-]?\s*A\s*[.\-]?\s*S\s*[.\-]?\s*A(?![A-Z])"),
        "那萨",
    ),
    (
        re.compile(r"(?i)(?<![A-Z])D\s*[.\-]?\s*N\s*[.\-]?\s*A(?![A-Z])"),
        "迪恩诶",
    ),
    (
        re.compile(r"(?i)(?<![A-Z])T\s*[.\-]?\s*A\s*[.\-]?\s*U(?![A-Z])"),
        "涛",
    ),
    (
        re.compile("β"),
        "贝塔",
    ),
    (
        re.compile(r"(?i)(?<![A-Z])F\s*[/\-]?\s*(?:A\s*)?(?=18(?![0-9]))"),
        "F",
    ),
)


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", "", text)


def normalize_speech_aliases(text: str) -> str:
    """把 ASR 偶尔识别成拉丁缩写的朗读替换还原为实际中文发音。"""
    for pattern, replacement in SPEECH_ALIASES:
        text = pattern.sub(replacement, text)
    return text


def load_paragraphs(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    paragraphs = [
        " ".join(line.strip() for line in block.splitlines() if line.strip())
        for block in text.split("\n\n")
        if block.strip()
    ]
    if len(paragraphs) == 1:
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        if len(lines) > 1:
            return lines
    return paragraphs


def apply_speak_fixes(text: str, fixes: list[list[str]]) -> str:
    for source, target in sorted(fixes, key=lambda pair: len(pair[0]), reverse=True):
        text = text.replace(source, target)
    return text


def digits_without_place_value(value: str) -> str:
    return "".join(DIGITS[int(char)] for char in value)


def normalize_numbers(text: str) -> str:
    def replace_year(match: re.Match[str]) -> str:
        return digits_without_place_value(match.group(1))

    def replace_number(match: re.Match[str]) -> str:
        value = match.group(1)
        is_percent = match.group(2) == "%"
        if re.fullmatch(r"(?:18|19|20|21)\d{2}", value):
            spoken = digits_without_place_value(value)
        else:
            spoken = cn2an.an2cn(value, "low")
        return f"百分之{spoken}" if is_percent else spoken

    text = YEAR_RE.sub(replace_year, text)
    return NUMBER_RE.sub(replace_number, text)


def phonetics(text: str) -> tuple[list[str], list[str]]:
    chars = HAN_CHAR_RE.findall(
        normalize_numbers(normalize_speech_aliases(text))
    )
    syllables = lazy_pinyin(chars, style=Style.NORMAL, errors=lambda item: [""])
    return chars, [item for item in syllables if item]


def contains_sequence(sequence: list[str], needle: list[str]) -> bool:
    if not needle or len(needle) > len(sequence):
        return False
    return any(
        sequence[index : index + len(needle)] == needle
        for index in range(len(sequence) - len(needle) + 1)
    )


def boundary_gaps(
    audio: np.ndarray,
    sample_rate: int,
    metadata: dict,
    strict: bool,
) -> dict:
    observed = metadata.get("observed_paragraph_gap")
    if observed and isinstance(observed.get("samples_ms"), list):
        return observed
    paragraphs = metadata.get("paragraphs")
    if paragraphs and len(paragraphs) > 1:
        starts = [float(item["start"]) for item in paragraphs if "start" in item]
        if len(starts) == len(paragraphs):
            return measure_boundary_gaps(audio, sample_rate, starts)
    if strict:
        raise ValueError("元数据缺少段落时间轴，无法校验幕间停顿")
    return {}


def span_context(chars: list[str], start: int, end: int, radius: int = 24) -> str:
    left = "".join(chars[max(0, start - radius) : start])
    phrase = "".join(chars[start:end])
    right = "".join(chars[end : min(len(chars), end + radius)])
    return f"{left}【{phrase}】{right}"


def missing_ranges(
    source_text: str,
    asr_text: str,
    minimum: int,
) -> tuple[list[dict], dict]:
    source_chars, source_syllables = phonetics(source_text)
    asr_chars, asr_syllables = phonetics(asr_text)
    matcher = difflib.SequenceMatcher(
        None,
        source_syllables,
        asr_syllables,
        autojunk=False,
    )
    ranges: list[dict] = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        source_length = i2 - i1
        asr_length = j2 - j1
        is_deletion = tag == "delete"
        is_mostly_deleted = (
            tag == "replace"
            and source_length >= minimum
            and asr_length <= max(1, int(source_length * 0.35))
        )
        if source_length < minimum or not (is_deletion or is_mostly_deleted):
            continue
        ranges.append(
            {
                "source_start": i1,
                "source_end": i2,
                "source_syllables": source_length,
                "asr_syllables": asr_length,
                "source_phrase": "".join(source_chars[i1:i2]),
                "asr_phrase": "".join(asr_chars[j1:j2]),
                "context": span_context(source_chars, i1, i2),
                "kind": "deleted" if is_deletion else "mostly_deleted",
            }
        )
    metrics = {
        "source_syllables": len(source_syllables),
        "asr_syllables": len(asr_syllables),
        "similarity": round(matcher.ratio(), 6),
        "covered_syllables": max(0, len(source_syllables) - sum(item["source_syllables"] for item in ranges)),
    }
    return ranges, metrics


def spoken_paragraphs(paragraphs: list[str], metadata: dict) -> list[str]:
    fixes = metadata.get("speakFixes") or []
    chunks = sorted(
        (chunk for chunk in metadata.get("chunks", []) if "paragraph_index" in chunk),
        key=lambda item: (
            int(item["paragraph_index"]),
            float(item.get("start", 0)),
        ),
    )
    if chunks:
        grouped: dict[int, list[str]] = {}
        for chunk in chunks:
            grouped.setdefault(int(chunk["paragraph_index"]), []).append(
                str(chunk.get("spoken") or chunk.get("text") or "")
            )
        if all(index in grouped for index in range(1, len(paragraphs) + 1)):
            return ["".join(grouped[index]) for index in range(1, len(paragraphs) + 1)]
    return [apply_speak_fixes(item, fixes) for item in paragraphs]


def transcribe_audio(model, audio_input: str | Path, beam_size: int) -> tuple[str, list[dict]]:
    segments, _ = model.transcribe(
        str(audio_input),
        language="zh",
        beam_size=beam_size,
        vad_filter=True,
        condition_on_previous_text=False,
        word_timestamps=True,
    )
    records = []
    text_parts = []
    for segment in segments:
        text = segment.text.strip()
        text_parts.append(text)
        records.append(
            {
                "start": round(float(segment.start), 4),
                "end": round(float(segment.end), 4),
                "text": text,
            }
        )
    return "".join(text_parts), records


def local_recheck(
    model,
    audio: np.ndarray,
    sample_rate: int,
    metadata: dict,
    source_paragraphs: list[str],
    candidates: list[dict],
    minimum: int,
    beam_size: int,
    temp_dir: Path,
) -> list[dict]:
    confirmed: list[dict] = []
    by_paragraph: dict[int, list[dict]] = {}
    for candidate in candidates:
        by_paragraph.setdefault(candidate["paragraph_index"], []).append(candidate)

    for paragraph_index, paragraph_candidates in sorted(by_paragraph.items()):
        record = metadata["paragraphs"][paragraph_index - 1]
        start = int(round(float(record["start"]) * sample_rate))
        end = start + int(round(float(record["duration"]) * sample_rate))
        local_path = temp_dir / f"paragraph_{paragraph_index:03d}.wav"
        sf.write(local_path, audio[start:end], sample_rate, subtype="PCM_16")
        local_text, local_segments = transcribe_audio(model, local_path, beam_size)
        local_missing, local_metrics = missing_ranges(
            source_paragraphs[paragraph_index - 1],
            local_text,
            minimum,
        )
        paragraph_confirmed = 0
        for candidate in paragraph_candidates:
            rel_start = candidate["source_start"] - candidate["paragraph_token_start"]
            rel_end = candidate["source_end"] - candidate["paragraph_token_start"]
            overlap = [
                item
                for item in local_missing
                if item["source_start"] < rel_end
                and item["source_end"] > rel_start
            ]
            result = dict(candidate)
            result["local_recheck"] = {
                "asr_text": local_text,
                "segments": local_segments,
                "similarity": local_metrics["similarity"],
                "still_missing": bool(overlap),
                "local_missing": overlap,
            }
            if overlap:
                result["local_phrase"] = overlap[0]["source_phrase"]
                confirmed.append(result)
                paragraph_confirmed += 1
        print(
            f"[门禁] 第 {paragraph_index} 段局部复听完成："
            f"{'仍有漏读' if paragraph_confirmed else '疑点已排除'}",
            flush=True,
        )
    return confirmed


def add_check(checks: list[dict], code: str, ok: bool, message: str, hard: bool = True) -> None:
    checks.append(
        {
            "code": code,
            "status": "pass" if ok else ("fail" if hard else "warn"),
            "hard": hard,
            "message": message,
        }
    )


def render_markdown(result: dict) -> str:
    audio = result["audio"]
    coverage = result["coverage"]
    lines = [
        "# 配音审查门禁",
        "",
        f"- 结论：**{'通过' if result['passed'] else '不通过'}**",
        f"- 审查时间：{result['generated_at']}",
        f"- 音频：`{result['files']['audio']}`",
        f"- 口播稿：`{result['files']['text']}`",
        f"- ASR：全片 `{result['asr']['model']}` / 疑点仲裁 `{result['asr']['arbitration_model']}`"
        f"（{result['asr']['device']} / {result['asr']['compute_type']}）",
        "",
        "## 硬门禁",
        "",
    ]
    for check in result["checks"]:
        mark = "x" if check["status"] == "pass" else " "
        lines.append(f"- [{mark}] **{check['status'].upper()}** {check['message']}")

    lines.extend(
        [
            "",
            "## 全文覆盖",
            "",
            f"- 原文自然段：{coverage['paragraph_count']}",
            f"- 原文音节：{coverage['source_syllables']}",
            f"- ASR 音节：{coverage['asr_syllables']}",
            f"- 拼音序列相似度：{coverage['similarity']:.4f}",
            f"- 检测漏读：{len(result['missing_blocks'])} 处",
        ]
    )
    if result["missing_blocks"]:
        lines.append("")
        for item in result["missing_blocks"]:
            lines.append(
                f"- 第 {item['paragraph_index']} 段：`{item.get('local_phrase') or item['source_phrase']}`"
            )

    lines.extend(
        [
            "",
            "## 技术指标",
            "",
            f"- 时长：{audio['duration']:.3f} 秒",
            f"- 采样率：{audio['sample_rate']} Hz",
            f"- 声道：{audio['channels']}",
            f"- 编码：{audio['subtype']}",
            f"- 峰值：{audio['peak']:.6f}",
            f"- 削波采样：{audio['clipped_samples']}",
            f"- SHA256：`{audio['sha256']}`",
        ]
    )
    gaps = result.get("paragraph_gaps")
    if gaps:
        lines.append(
            f"- 幕间停顿：最小 {gaps['min_ms']} ms / 中位 {gaps['median_ms']:.0f} ms / 最大 {gaps['max_ms']} ms"
        )
    if result["warnings"]:
        lines.extend(["", "## 提醒", ""])
        lines.extend(f"- {item}" for item in result["warnings"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="dabao 配音后审查门禁")
    parser.add_argument("--text-file", required=True, type=Path)
    parser.add_argument("--audio-file", required=True, type=Path)
    parser.add_argument("--metadata-file", type=Path)
    parser.add_argument("--report-file", type=Path)
    parser.add_argument("--json-report", type=Path)
    parser.add_argument("--asr-model", default="small")
    parser.add_argument("--arbitration-model", default="medium")
    parser.add_argument("--asr-device", default="cpu")
    parser.add_argument("--asr-compute-type", default="int8")
    parser.add_argument("--beam-size", type=int, default=5)
    parser.add_argument("--minimum-omission-syllables", type=int, default=4)
    parser.add_argument("--expected-sample-rate", type=int, default=44100)
    parser.add_argument("--expected-paragraph-gap-ms", type=int)
    parser.add_argument("--gap-tolerance-ms", type=int, default=25)
    parser.add_argument("--expected-voice", default="dabao")
    parser.add_argument("--allow-model-download", action="store_true")
    parser.add_argument("--strict-warnings", action="store_true")
    parser.add_argument("--skip-asr", action="store_true", help="仅供调试规格，不作为正式放行。")
    args = parser.parse_args()

    text_path = args.text_file.resolve()
    audio_path = args.audio_file.resolve()
    metadata_path = (
        args.metadata_file.resolve()
        if args.metadata_file
        else audio_path.with_suffix(".json")
    )
    report_path = (
        args.report_file.resolve()
        if args.report_file
        else audio_path.parent / f"{audio_path.stem}审查报告.md"
    )
    json_report_path = (
        args.json_report.resolve()
        if args.json_report
        else audio_path.parent / f"{audio_path.stem}审查.json"
    )
    paragraphs = load_paragraphs(text_path)
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    checks: list[dict] = []
    warnings: list[str] = []
    missing_blocks: list[dict] = []
    asr_records: list[dict] = []
    asr_text = ""
    ending_recheck: dict | None = None

    audio, sample_rate = sf.read(audio_path, dtype="int16", always_2d=False)
    audio = np.asarray(audio, dtype=np.int16)
    info = sf.info(audio_path)
    peak = float(np.max(np.abs(audio.astype(np.float32))) / 32768) if len(audio) else 0.0
    clipped = int(np.sum(np.abs(audio) >= 32767))
    duration = len(audio) / sample_rate if sample_rate else 0.0
    audio_sha256 = hashlib.sha256(audio_path.read_bytes()).hexdigest().upper()

    add_check(checks, "non_empty", duration > 0, f"音频非空，时长 {duration:.3f} 秒")
    add_check(
        checks,
        "sample_rate",
        sample_rate == args.expected_sample_rate,
        f"采样率 {sample_rate} Hz（要求 {args.expected_sample_rate} Hz）",
    )
    add_check(
        checks,
        "mono",
        audio.ndim == 1 and info.channels == 1,
        f"声道数 {info.channels}",
    )
    add_check(
        checks,
        "pcm16",
        info.subtype == "PCM_16",
        f"编码 {info.subtype}（要求 PCM_16）",
    )
    add_check(checks, "peak", peak < 1.0 and clipped == 0, f"峰值 {peak:.6f}，削波采样 {clipped}")

    metadata_paragraphs = metadata.get("paragraphs") or []
    if metadata_paragraphs:
        add_check(
            checks,
            "paragraph_count",
            len(metadata_paragraphs) == len(paragraphs),
            f"元数据 {len(metadata_paragraphs)} 段 / 口播稿 {len(paragraphs)} 段",
        )
        text_matches = all(
            normalize_text(record.get("text", "")) == normalize_text(paragraph)
            for record, paragraph in zip(metadata_paragraphs, paragraphs)
        )
        add_check(checks, "paragraph_text", text_matches, "元数据段落文本与定稿一致")
        if "duration" in metadata:
            delta = abs(float(metadata["duration"]) - duration)
            add_check(
                checks,
                "metadata_duration",
                delta <= max(0.5, duration * 0.005),
                f"元数据时长与音频相差 {delta:.3f} 秒",
            )
    else:
        warnings.append("元数据没有 paragraph 数组，无法逐段映射和局部复听。")

    if metadata.get("voice_id"):
        add_check(
            checks,
            "voice",
            metadata["voice_id"] == args.expected_voice,
            f"音色 {metadata['voice_id']}（要求 {args.expected_voice}）",
        )
    sourced_spoken = spoken_paragraphs(paragraphs, metadata)
    full_source_text = "".join(sourced_spoken)

    paragraph_gaps = boundary_gaps(audio, sample_rate, metadata, strict=bool(metadata_paragraphs))
    if paragraph_gaps and args.expected_paragraph_gap_ms is not None:
        samples = paragraph_gaps.get("samples_ms") or []
        expected = args.expected_paragraph_gap_ms
        bad = [value for value in samples if abs(value - expected) > args.gap_tolerance_ms]
        add_check(
            checks,
            "paragraph_gap",
            not bad,
            f"幕间停顿要求 {expected}±{args.gap_tolerance_ms} ms；异常 {len(bad)} 处",
        )

    if not args.skip_asr:
        try:
            from faster_whisper import WhisperModel
        except ImportError as exc:
            raise SystemExit(f"缺少 faster-whisper，无法执行正式门禁：{exc}") from exc

        asr_cache_hit = False
        if json_report_path.is_file():
            try:
                previous = json.loads(json_report_path.read_text(encoding="utf-8"))
                previous_asr = previous.get("asr") or {}
                if (
                    previous.get("audio", {}).get("sha256") == audio_sha256
                    and previous_asr.get("model") == args.asr_model
                    and previous_asr.get("beam_size", args.beam_size) == args.beam_size
                    and previous_asr.get("records")
                ):
                    asr_records = previous_asr["records"]
                    asr_text = "".join(item["text"] for item in asr_records)
                    asr_cache_hit = True
                    print("[门禁] 音频未变化，复用上次整片 ASR", flush=True)
            except (OSError, ValueError, KeyError):
                pass

        model = None
        if not asr_cache_hit:
            print(
                f"[门禁] 加载 ASR：{args.asr_model} / {args.asr_device} / {args.asr_compute_type}",
                flush=True,
            )
            model = WhisperModel(
                args.asr_model,
                device=args.asr_device,
                compute_type=args.asr_compute_type,
                local_files_only=not args.allow_model_download,
            )
            print("[门禁] 整片 ASR 回听开始", flush=True)
            asr_text, asr_records = transcribe_audio(model, audio_path, args.beam_size)
        add_check(checks, "asr_non_empty", bool(HAN_CHAR_RE.search(asr_text)), "ASR 返回有效中文")

        source_chars: list[str] = []
        source_syllables: list[str] = []
        paragraph_labels: list[int] = []
        paragraph_token_starts: dict[int, int] = {}
        for paragraph_index, spoken in enumerate(sourced_spoken, start=1):
            paragraph_token_starts[paragraph_index] = len(source_syllables)
            chars, syllables = phonetics(spoken)
            source_chars.extend(chars)
            source_syllables.extend(syllables)
            paragraph_labels.extend([paragraph_index] * len(syllables))

        asr_chars, asr_syllables = phonetics(asr_text)
        matcher = difflib.SequenceMatcher(
            None,
            source_syllables,
            asr_syllables,
            autojunk=False,
        )
        raw_candidates: list[dict] = []
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            length = i2 - i1
            asr_length = j2 - j1
            if length < args.minimum_omission_syllables:
                continue
            if tag != "delete" and not (
                tag == "replace" and asr_length <= max(1, int(length * 0.35))
            ):
                continue
            paragraph_index = paragraph_labels[i1] if i1 < len(paragraph_labels) else len(paragraphs)
            raw_candidates.append(
                {
                    "paragraph_index": paragraph_index,
                    "paragraph_token_start": paragraph_token_starts[paragraph_index],
                    "source_start": i1,
                    "source_end": i2,
                    "source_syllables": length,
                    "asr_syllables": asr_length,
                    "source_phrase": "".join(source_chars[i1:i2]),
                    "asr_phrase": "".join(asr_chars[j1:j2]),
                    "context": span_context(source_chars, i1, i2),
                    "kind": "deleted" if tag == "delete" else "mostly_deleted",
                }
            )

        coverage = {
            "paragraph_count": len(paragraphs),
            "source_syllables": len(source_syllables),
            "asr_syllables": len(asr_syllables),
            "similarity": round(matcher.ratio(), 6),
        }
        if metadata_paragraphs:
            if raw_candidates:
                if args.arbitration_model == args.asr_model and model is not None:
                    arbitration_model = model
                else:
                    print(
                        f"[门禁] 加载仲裁 ASR：{args.arbitration_model}",
                        flush=True,
                    )
                    arbitration_model = WhisperModel(
                        args.arbitration_model,
                        device=args.asr_device,
                        compute_type=args.asr_compute_type,
                        local_files_only=not args.allow_model_download,
                    )
                with tempfile.TemporaryDirectory(prefix="dabao-gate-") as temp:
                    confirmed = local_recheck(
                        arbitration_model,
                        audio,
                        sample_rate,
                        metadata,
                        sourced_spoken,
                        raw_candidates,
                        args.minimum_omission_syllables,
                        args.beam_size,
                        Path(temp),
                    )
            else:
                confirmed = []
            resolved = len(raw_candidates) - len(confirmed)
            if resolved:
                warnings.append(f"整片 ASR 有 {resolved} 个疑似漏点，经对应段落局部复听后排除。")
            missing_blocks = confirmed
        else:
            missing_blocks = raw_candidates
        add_check(
            checks,
            "speech_coverage",
            not missing_blocks,
            f"全文覆盖检查发现 {len(missing_blocks)} 处漏读",
        )

        ending_syllables = phonetics(FIXED_ENDING)[1]
        source_syllable_list = phonetics(full_source_text)[1]
        if contains_sequence(source_syllable_list, ending_syllables):
            ending_ok = contains_sequence(
                phonetics(asr_text)[1],
                ending_syllables,
            )
            message = "固定收尾完整"
            if not ending_ok and metadata_paragraphs:
                last = metadata_paragraphs[-1]
                start = int(round(float(last["start"]) * sample_rate))
                end = start + int(round(float(last["duration"]) * sample_rate))
                with tempfile.TemporaryDirectory(prefix="dabao-ending-") as temp:
                    tail_path = Path(temp) / "last-paragraph.wav"
                    sf.write(
                        tail_path,
                        audio[start:end],
                        sample_rate,
                        subtype="PCM_16",
                    )
                    ending_model = model
                    if ending_model is None:
                        print(
                            f"[门禁] 加载收尾复听 ASR：{args.asr_model}",
                            flush=True,
                        )
                        ending_model = WhisperModel(
                            args.asr_model,
                            device=args.asr_device,
                            compute_type=args.asr_compute_type,
                            local_files_only=not args.allow_model_download,
                        )
                    ending_text, ending_records = transcribe_audio(
                        ending_model,
                        tail_path,
                        args.beam_size,
                    )
                ending_ok = contains_sequence(
                    phonetics(ending_text)[1],
                    ending_syllables,
                )
                ending_recheck = {
                    "paragraph_index": len(metadata_paragraphs),
                    "start": round(float(last["start"]), 4),
                    "duration": round(float(last["duration"]), 4),
                    "asr_text": ending_text,
                    "records": ending_records,
                    "passed": ending_ok,
                }
                if ending_ok:
                    message = "固定收尾完整（整片识别串位，末段局部复听通过）"
                    warnings.append(
                        "整片 ASR 的固定收尾受上下文影响，末段单独复听后确认通过。"
                    )
            add_check(checks, "fixed_ending", ending_ok, message)
    else:
        coverage = {"paragraph_count": len(paragraphs), "source_syllables": 0, "asr_syllables": 0, "similarity": 0.0}
        warnings.append("本次跳过了 ASR，只能作为调试结果，不能正式放行。")
        add_check(checks, "asr_required", False, "正式门禁必须执行 ASR", hard=True)

    failed_checks = [item for item in checks if item["status"] == "fail"]
    passed = not failed_checks and (not args.strict_warnings or not warnings)
    result = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "passed": passed,
        "files": {
            "text": str(text_path),
            "audio": str(audio_path),
            "metadata": str(metadata_path),
        },
        "checks": checks,
        "warnings": warnings,
        "coverage": coverage,
        "missing_blocks": missing_blocks,
        "ending_recheck": ending_recheck,
        "paragraph_gaps": paragraph_gaps,
        "asr": {
            "model": args.asr_model,
            "arbitration_model": args.arbitration_model,
            "device": args.asr_device,
            "compute_type": args.asr_compute_type,
            "beam_size": args.beam_size,
            "cache_hit": asr_cache_hit if not args.skip_asr else False,
            "records": asr_records,
        },
        "audio": {
            "duration": round(duration, 6),
            "sample_rate": sample_rate,
            "channels": info.channels,
            "subtype": info.subtype,
            "peak": round(peak, 8),
            "clipped_samples": clipped,
            "sha256": audio_sha256,
        },
    }

    report_path.parent.mkdir(parents=True, exist_ok=True)
    json_report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(render_markdown(result), encoding="utf-8")
    json_report_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"[门禁] {'通过' if passed else '不通过'}；报告 {report_path}",
        flush=True,
    )
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
