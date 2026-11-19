"""Transcribe a WAV with faster-whisper, bypassing PyAV (decode via ffmpeg CLI)."""
import argparse, json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel


def load_audio(path, start=0.0, dur=None, sr=16000):
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start)]
    if dur is not None:
        cmd += ["-t", str(dur)]
    cmd += ["-i", path, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wav")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--dur", type=float, default=None)
    ap.add_argument("--out", default=None)
    ap.add_argument("--model", default="small")
    args = ap.parse_args()

    audio = load_audio(args.wav, args.start, args.dur)
    print(f"decoded {len(audio)/16000:.2f}s", file=sys.stderr)
    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segs, info = model.transcribe(
        audio, language="zh", word_timestamps=True, vad_filter=False,
        initial_prompt="以下是普通话口播稿。",
    )
    rows = []
    for s in segs:
        words = [{"w": w.word, "s": round(w.start + args.start, 3), "e": round(w.end + args.start, 3)} for w in (s.words or [])]
        rows.append({"start": round(s.start + args.start, 3), "end": round(s.end + args.start, 3), "text": s.text.strip(), "words": words})
        print(f"[{s.start+args.start:7.2f} - {s.end+args.start:7.2f}] {s.text.strip()}", file=sys.stderr)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump({"duration": len(audio) / 16000, "segments": rows}, f, ensure_ascii=False, indent=1)
        print("written", args.out, file=sys.stderr)


if __name__ == "__main__":
    main()
