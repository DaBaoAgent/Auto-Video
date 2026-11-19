# asr.py — faster-whisper 逐词转写
# 用法：python asr.py <audio_16k.wav>
from faster_whisper import WhisperModel
import numpy as np, wave, sys

path = sys.argv[1] if len(sys.argv)>1 else "out/vo1_16k.wav"
model = WhisperModel("small", device="cpu", compute_type="int8")

with wave.open(path, "rb") as w:
    sr = w.getframerate(); n = w.getnframes()
    raw = w.readframes(n)
    audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

segments, info = model.transcribe(audio, language="zh", word_timestamps=True, vad_filter=False)
for seg in segments:
    print(f"[{seg.start:6.2f} -> {seg.end:6.2f}] {seg.text}")
    for wd in seg.words:
        print(f"  {wd.start:6.2f}  {wd.word}")
