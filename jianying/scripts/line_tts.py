# -*- coding: utf-8 -*-
"""按「行」合成旁白：一行 = 一个分句 = 一个分镜的语音单位。

与 dabao_batch_tts.py 的区别：后者按 78 字合并成段（段级时码太粗，无法做
2-3 秒级分镜）；本脚本**逐行一次请求**，因此每行都有精确的起止时间，
可直接喂给 pipeline/build_shots.py 生成分镜表。

服务仍是 D:\\GPT-SoVITS 的 api_v2（V3 + dabao 音色，参数从 preset.json 读）。

用法：
  python modules/narration/line_tts.py \
      --text-file content/cc-chibi/口播稿.txt \
      --out output/sample-30s/narration.mp3 \
      --gap-ms 480 --force

输出：
  <out>.mp3 / <out>.wav   成片旁白（行间留 gap，首尾留 lead/tail）
  <out>.json              行级元数据：text/spoken/start/end/duration/chars_per_sec
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import requests
import soundfile as sf

PRESET = Path(r"D:\GPT-SoVITS\voices\dabao\preset.json")
SR = 44100


def apply_fixes(text: str, fixes: list[list[str]]) -> str:
    for src, dst in sorted(fixes, key=lambda p: len(p[0]), reverse=True):
        text = text.replace(src, dst)
    return text


def clean_len(s: str) -> int:
    return len(re.sub(r"[^\w\u3400-\u9fff]", "", s))


def read_lines(path: Path) -> list[str]:
    out = []
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if line:
            out.append(line)
    return out


def trim_and_tighten(x: np.ndarray, sr: int, thr_db: float = -40.0,
                     keep_ms: int = 170, min_ms: int = 240) -> np.ndarray:
    """去首尾静音，并把过长的内部停顿压到 keep_ms。"""
    hop = sr // 100
    n = len(x) // hop
    if n < 3:
        return x
    frames = x[: n * hop].reshape(n, hop)
    rms = np.sqrt((frames.astype(np.float64) ** 2).mean(axis=1) + 1e-12)
    voiced = 20 * np.log10(rms) > thr_db
    idx = np.flatnonzero(voiced)
    if idx.size == 0:
        return x
    a = max(0, idx[0] * hop - int(sr * 0.02))
    b = min(len(x), (idx[-1] + 1) * hop + int(sr * 0.03))
    x = x[a:b]

    # 内部停顿压缩
    hop = sr // 100
    n = len(x) // hop
    frames = x[: n * hop].reshape(n, hop)
    rms = np.sqrt((frames.astype(np.float64) ** 2).mean(axis=1) + 1e-12)
    voiced = 20 * np.log10(rms) > thr_db
    keep = int(sr * keep_ms / 1000)
    min_gap = int(sr * min_ms / 1000)
    out, cursor, i = [], 0, 0
    while i < n:
        if voiced[i]:
            i += 1
            continue
        j = i
        while j < n and not voiced[j]:
            j += 1
        s, e = i * hop, min(len(x), j * hop)
        if j == n:
            break
        out.append(x[cursor:s])
        span = e - s
        if span > min_gap:
            half = keep // 2
            out.append(x[s:s + half])
            out.append(x[e - half:e])
        else:
            out.append(x[s:e])
        cursor = e
        i = j
    out.append(x[cursor:])
    y = np.concatenate(out).astype(np.float32)
    fade = int(sr * 0.008)
    if len(y) > 2 * fade:
        y[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
        y[-fade:] *= np.linspace(1, 0, fade, dtype=np.float32)
    return y


def server_ready(base: str) -> bool:
    for p in ("/docs", "/tts"):
        try:
            if requests.get(base + p, timeout=3).status_code in (200, 405, 422):
                return True
        except requests.RequestException:
            pass
    return False


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", help="选题 slug（给这个就不用再写 --text-file/--out）")
    ap.add_argument("--text-file", type=Path)
    ap.add_argument("--out", type=Path, help="默认 <project>/narration/narration.mp3")
    ap.add_argument("--gap-ms", type=int, default=None, help="行间静音")
    ap.add_argument("--lead-ms", type=int, default=None, help="首行前留白")
    ap.add_argument("--tail-ms", type=int, default=None, help="末行后留白")
    ap.add_argument("--max-cps", type=float, default=None, help="字/秒上限，超过判定截断")
    ap.add_argument("--retries", type=int, default=3)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    # 选题模式：路径与配音参数都从 film.json 推，命令行可覆盖
    if args.project:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from common import Paths
        P = Paths(args.project)
        cfg_nar = P.film.get("narration", {})
        args.text_file = args.text_file or P.script
        args.out = args.out or P.narration_mp3
        args.gap_ms = args.gap_ms if args.gap_ms is not None else cfg_nar.get("gap_ms", 480)
        args.lead_ms = args.lead_ms if args.lead_ms is not None else cfg_nar.get("lead_ms", 140)
        args.tail_ms = args.tail_ms if args.tail_ms is not None else cfg_nar.get("tail_ms", 600)
        args.max_cps = args.max_cps if args.max_cps is not None else cfg_nar.get("max_cps", 6.4)
    else:
        args.gap_ms = 480 if args.gap_ms is None else args.gap_ms
        args.lead_ms = 140 if args.lead_ms is None else args.lead_ms
        args.tail_ms = 600 if args.tail_ms is None else args.tail_ms
        args.max_cps = 6.4 if args.max_cps is None else args.max_cps
    if not args.text_file or not args.out:
        sys.exit("要么给 --project，要么同时给 --text-file 与 --out")

    cfg = json.loads(PRESET.read_text(encoding="utf-8"))
    voice, srv, syn = cfg["voice"], cfg["server"], cfg["synthesis"]
    post = cfg["postprocess"]
    fixes = list((cfg.get("speak_fixes") or {}).get("global", []))
    base = f"http://{srv['host']}:{srv['port']}"
    if not server_ready(base):
        sys.exit(f"GPT-SoVITS 服务未就绪：{base}（先启动 api_v2.py）")

    lines = read_lines(args.text_file)
    chunks_dir = args.out.parent / "narration-lines"
    chunks_dir.mkdir(parents=True, exist_ok=True)

    session = requests.Session()
    session.trust_env = False
    wavs: list[np.ndarray] = []
    meta: list[dict] = []

    for i, line in enumerate(lines, 1):
        spoken = apply_fixes(line, fixes)
        cache = chunks_dir / f"{i:02d}.wav"
        if args.force or not cache.exists():
            payload = {
                "text": spoken,
                "text_lang": voice["text_lang"],
                "ref_audio_path": voice["ref_audio_path"],
                "prompt_text": voice["prompt_text"],
                "prompt_lang": voice["prompt_lang"],
                "top_k": syn["top_k"], "top_p": syn["top_p"],
                "temperature": syn["temperature"],
                "text_split_method": syn["text_split_method"],
                "batch_size": syn["batch_size"], "speed_factor": syn["speed_factor"],
                "fragment_interval": syn["fragment_interval"], "seed": syn["seed"],
                "repetition_penalty": syn.get("repetition_penalty", 1.35),
                "media_type": "wav", "streaming_mode": False,
            }
            t0 = time.time()
            for attempt in range(args.retries):
                r = session.post(base + "/tts", json=payload, timeout=(10, 1800))
                r.raise_for_status()
                if len(r.content) < 1000 or r.content[:4] != b"RIFF":
                    continue
                tmp = cache.with_suffix(".tmp.wav")
                tmp.write_bytes(r.content)
                x, sr = sf.read(tmp, dtype="float32")
                if x.ndim > 1:
                    x = x.mean(axis=1)
                cps = clean_len(spoken) / max(len(x) / sr, 1e-6)
                if cps <= args.max_cps:
                    sf.write(cache, x, sr, subtype="PCM_16")
                    tmp.unlink(missing_ok=True)
                    print(f"[{i:02d}] {len(spoken)}字 {len(x)/sr:.2f}s "
                          f"({cps:.2f}字/秒) 合成 {time.time()-t0:.1f}s", flush=True)
                    break
                tmp.unlink(missing_ok=True)
                print(f"[{i:02d}] 疑似截断 {cps:.2f}字/秒，重配", flush=True)
            else:
                sys.exit(f"第 {i} 行连续 {args.retries} 次不合格")

        x, sr = sf.read(cache, dtype="float32")
        if x.ndim > 1:
            x = x.mean(axis=1)
        if sr != SR:
            import librosa  # noqa: F401  (venv 已有)
            x = librosa.resample(x, orig_sr=sr, target_sr=SR)
            sr = SR
        tight = trim_and_tighten(x, sr)
        wavs.append(tight)
        meta.append({"index": i, "text": line, "spoken": spoken,
                     "chars": clean_len(line)})

    gap = np.zeros(int(SR * args.gap_ms / 1000), np.float32)
    lead = np.zeros(int(SR * args.lead_ms / 1000), np.float32)
    tail = np.zeros(int(SR * args.tail_ms / 1000), np.float32)
    parts: list[np.ndarray] = [lead]
    t = len(lead) / SR
    for i, (x, m) in enumerate(zip(wavs, meta)):
        dur = len(x) / SR
        m.update(start=round(t, 3), end=round(t + dur, 3), duration=round(dur, 3),
                 chars_per_sec=round(m["chars"] / dur, 2) if dur else 0)
        parts.append(x)
        t += dur
        if i < len(wavs) - 1:
            parts.append(gap)
            t += args.gap_ms / 1000
    parts.append(tail)
    t += len(tail) / SR

    pcm = np.concatenate(parts).astype(np.float32)
    peak = float(np.abs(pcm).max()) or 1.0
    pcm = (pcm / peak * 0.89).astype(np.float32)  # ~-1dBFS 峰值
    args.out.parent.mkdir(parents=True, exist_ok=True)
    wav_out = args.out.with_suffix(".wav")
    sf.write(wav_out, pcm, SR, subtype="PCM_16")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav_out),
                    "-c:a", "libmp3lame", "-b:a", post.get("mp3_bitrate", "192k"),
                    "-ar", str(SR), "-ac", "1", str(args.out)], check=True)

    data = {
        "preset": cfg.get("preset", ""), "voice": voice.get("label", ""),
        "model": syn.get("model", ""), "sample_rate": SR,
        "gap_ms": args.gap_ms, "lead_ms": args.lead_ms, "tail_ms": args.tail_ms,
        "duration": round(t, 3), "line_count": len(meta),
        "total_chars": sum(m["chars"] for m in meta),
        "audio": str(args.out).replace("\\", "/"),
        "chunks": meta,
    }
    args.out.with_suffix(".json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n成片旁白 {t:.2f}s / {data['total_chars']} 字 / {len(meta)} 行 → {args.out}")


if __name__ == "__main__":
    main()
