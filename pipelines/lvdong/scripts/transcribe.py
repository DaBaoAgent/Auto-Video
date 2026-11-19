# -*- coding: utf-8 -*-
"""Word-level transcript of the narration (faster-whisper, Chinese).

    python transcribe.py <voice.wav> <out.json> [--model small] [--prompt 一段中文口播...] [--hot 玛雅 石碑 ...]

Defaults to the `small` model: on a Chinese explainer take it transcribes fast and its
word boundaries are good enough to hold paragraph edges. `large-v3-turbo` drifts into
repetition loops on long takes (it repeats a phrase until the segment ends); use it only
with --prompt and --hot, and always read the printed tail before trusting it.
"""
import argparse, io, json
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("wav")
ap.add_argument("out")
ap.add_argument("--model", default="small")
ap.add_argument("--prompt", default="这是一段中文科普口播。")
ap.add_argument("--hot", default="")
a = ap.parse_args()

model = WhisperModel(a.model, device="cpu", compute_type="int8")
segments, info = model.transcribe(
    a.wav, language="zh", word_timestamps=True, vad_filter=False, beam_size=5,
    initial_prompt=a.prompt, hotwords=a.hot or None)

words, segs = [], []
for s in segments:
    segs.append({"t0": round(s.start, 3), "t1": round(s.end, 3), "text": s.text})
    for w in s.words:
        words.append({"t0": round(w.start, 3), "t1": round(w.end, 3), "w": w.word})

json.dump({"dur": round(info.duration, 3), "segments": segs, "words": words},
          io.open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("segments %d  words %d  dur %.2f" % (len(segs), len(words), info.duration))
print("".join(w["w"] for w in words)[:400])
