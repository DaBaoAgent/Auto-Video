# -*- coding: utf-8 -*-
"""音色试听文件客观分析：时长/语速/基频(男女性别判定)。运行于 bash 环境（ffmpeg 在 PATH）。"""
import subprocess, wave, array, statistics, os, tempfile
from pathlib import Path
import numpy as np

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "content" / "01-赤壁之战" / "音色试听"
TMP = Path(os.environ.get("TMPDIR", tempfile.gettempdir())) / "pitch"
TMP.mkdir(parents=True, exist_ok=True)
TXT_CHARS = 83  # 试听文案字符数（含标点）

def analyze(fp):
    wav = TMP / (fp.stem + ".wav")
    subprocess.run(["ffmpeg", "-y", "-i", str(fp), "-ac", "1", "-ar", "16000", str(wav)],
                   capture_output=True, timeout=120)
    if not wav.exists():
        return None
    w = wave.open(str(wav)); sr = w.getframerate(); n = w.getnframes()
    a = array.array("h"); a.frombytes(w.readframes(n)); w.close()
    dur = n / sr
    x = np.frombuffer(a, dtype=np.int16).astype(np.float32)
    F = int(sr * 0.04); H = int(sr * 0.01)
    rms_all = float(np.sqrt(np.mean(x ** 2)) + 1e-9)
    vals = []
    for i in range(0, len(x) - F, H * 3):
        fr = x[i:i + F]
        if np.sqrt(np.mean(fr ** 2)) < rms_all * 0.5:
            continue
        fr2 = fr[::2]  # 降到 8k
        ac = np.correlate(fr2, fr2, "full")[len(fr2) - 1:]
        lo, hi = int(8000 / 300), int(8000 / 70)
        seg = ac[lo:hi]
        if len(seg) == 0:
            continue
        lag = lo + int(np.argmax(seg))
        if ac[lag] > 0.3 * ac[0]:
            f0 = 8000 / lag
            if 70 <= f0 <= 300:
                vals.append(f0)
    f0m = statistics.median(vals) if vals else 0
    wav.unlink(missing_ok=True)
    return dur, f0m

def tag(f0):
    if f0 == 0: return "?"
    if f0 < 120: return "低沉男"
    if f0 < 152: return "男声"
    if f0 < 175: return "中性偏男/少年"
    if f0 < 205: return "女声"
    if f0 < 245: return "女偏亮"
    return "高音/童声"

print(f"{'文件':<46}{'时长':>7}{'语速字/秒':>9}{'f0Hz':>7}  判定")
for fp in sorted(OUT.glob("*.mp3")):
    r = analyze(fp)
    if not r:
        print(fp.name, "分析失败"); continue
    dur, f0 = r
    print(f"{fp.name:<46}{dur:>6.1f}s{TXT_CHARS / dur:>9.2f}{f0:>7.0f}  {tag(f0)}")
print("done")
