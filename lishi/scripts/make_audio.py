# -*- coding: utf-8 -*-
"""全片音轨：28 个程序化音色 + 按情节选点 + BGM 闪避

环境没有 scipy / soundfile（pip 走不通），滤波用 FFT 掩码，读写用标准库 wave。
BGM 由 ffmpeg 先转成 wav 再进来。

用法：
  python scripts/make_audio.py --project projects/xxx/work \
      --voice "出稿/xxx/配音.wav" \
      [--bgm "D:/@kaifa/BGM/未解/xxx.mp3"] \
      [--plan projects/xxx/work/data/audio-plan.json] \
      [--mode key|shot]

  --mode key   只在关键镜挂音效（推荐；E3 定型为 40 条 / 19 镜）
  --mode shot  每镜 2 个点（约 106 条，密度上限）

  --plan 缺省时自动推导关键镜：首镜 open / 名卡 name / 落款 sign / 每 6 镜 turn
"""
from __future__ import annotations

import argparse
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
TARGET_VOICE_RMS = -21.4   # 人声目标 RMS（与刘秀/E3 定版一致）
BGM_OFFSET = 12.9          # BGM 增益 = 人声 RMS + 12.9dB（定版时人声 -21.4 → BGM -8.5）
ROOT = Path(__file__).resolve().parent
VOICE_SRC: Path | None = None
BGM_SRC: Path | None = None


# ----------------------------- WAV IO -----------------------------

def read_wav(p: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(p), "rb") as w:
        n, ch, sw, sr = w.getnframes(), w.getnchannels(), w.getsampwidth(), w.getframerate()
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f"{p} 不是 16bit PCM")
    x = np.frombuffer(raw, dtype="<i2").astype(np.float32) / 32768.0
    if ch == 2:
        x = x.reshape(-1, 2).mean(axis=1)
    return x, sr


def write_wav(p: Path, x: np.ndarray, sr: int = SR) -> None:
    x = np.clip(x, -1.0, 1.0)
    p.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(p), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((x * 32767.0).astype("<i2").tobytes())


def resample(x: np.ndarray, sr_in: int, sr_out: int) -> np.ndarray:
    if sr_in == sr_out:
        return x
    n_out = int(round(len(x) * sr_out / sr_in))
    xs = np.linspace(0, len(x) - 1, n_out)
    return np.interp(xs, np.arange(len(x)), x).astype(np.float32)


# ----------------------------- DSP -----------------------------

def band(x: np.ndarray, lo: float, hi: float, soft: float = 0.25) -> np.ndarray:
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    m = np.zeros_like(f)
    m[(f >= lo) & (f <= hi)] = 1.0
    lo_i = np.where((f >= lo * (1 - soft)) & (f < lo))[0]
    hi_i = np.where((f > hi) & (f <= hi * (1 + soft)))[0]
    if len(lo_i):
        m[lo_i] = np.linspace(0, 1, len(lo_i))
    if len(hi_i):
        m[hi_i] = np.linspace(1, 0, len(hi_i))
    return np.fft.irfft(X * m, n).astype(np.float32)


def norm(x: np.ndarray, peak: float = 0.9) -> np.ndarray:
    m = float(np.abs(x).max())
    return x if m < 1e-9 else (x / m * peak).astype(np.float32)


def noise(n: int, seed: int) -> np.ndarray:
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


# ----------------------------- 音色 -----------------------------

def s_whoosh(dur=0.85, lo=320, hi=2600, seed=11):
    n = int(dur * SR); z = noise(n, seed)
    low = band(z, lo * 0.6, lo * 2.2) * np.linspace(1, 0, n)
    high = band(z, hi * 0.5, hi * 1.4) * np.linspace(0, 1, n)
    x = 0.55 * band(z, lo, hi) + 0.75 * band(low + high, lo * 0.5, hi * 1.6)
    t = np.arange(n) / SR
    amp = np.exp(-((t - dur * 0.55) ** 2) / (2 * (dur * 0.26) ** 2))
    return norm(x * amp.astype(np.float32), 0.85)


def s_whoosh_low():
    return s_whoosh(1.10, 180, 1200, seed=17)


def s_wind(dur=2.6, seed=23):
    n = int(dur * SR); z = noise(n, seed)
    x = band(z, 120, 900)
    t = np.arange(n) / SR
    amp = (0.55 + 0.45 * np.sin(2 * np.pi * 0.35 * t + 1.1)).astype(np.float32)
    return norm(x * amp, 0.7)


def s_air_low(dur=3.2, seed=29):
    n = int(dur * SR); z = noise(n, seed)
    x = band(z, 60, 420)
    t = np.arange(n) / SR
    return norm(x * (0.6 + 0.4 * np.sin(2 * np.pi * 0.12 * t)).astype(np.float32), 0.55)


def s_stone(dur=1.70, seed=31):
    n = int(dur * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(78 * np.exp(-t * 2.2) + 52) / SR) * np.exp(-t / 0.42)
    click = band(noise(n, seed), 180, 2400) * np.exp(-t / 0.06)
    return norm(0.95 * thud + 0.35 * click, 0.9)


def s_stone_low(dur=2.2, seed=37):
    n = int(dur * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(46 * np.exp(-t * 1.4) + 34) / SR) * np.exp(-t / 0.7)
    return norm(0.9 * thud + 0.15 * band(noise(n, seed), 80, 900) * np.exp(-t / 0.12), 0.9)


def s_paper(dur=0.45, seed=41):
    n = int(dur * SR)
    t = np.arange(n) / SR
    e = np.exp(-t / 0.07) + 0.6 * np.exp(-((t - 0.18) ** 2) / (2 * 0.05 ** 2))
    return norm(band(noise(n, seed), 1400, 7200) * e.astype(np.float32), 0.8)


def s_paper_turn(dur=0.62, seed=43):
    """翻页：两段擦声 + 一次轻落"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = noise(n, seed)
    a = band(z, 900, 5200) * np.exp(-t / 0.09).astype(np.float32)
    b = band(z, 1200, 6800) * np.exp(-((t - 0.30) ** 2) / (2 * 0.06 ** 2)).astype(np.float32) * 0.7
    c = np.sin(2 * np.pi * 120 * t) * np.exp(-((t - 0.55) ** 2) / (2 * 0.03 ** 2)).astype(np.float32) * 0.25
    return norm(a + b + c, 0.82)


def s_paper_tear(dur=0.55, seed=47):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 1800, 9000)
    mod = (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 26 * t))).astype(np.float32)
    return norm(z * mod * np.exp(-t / 0.22).astype(np.float32), 0.8)


def s_book_close(dur=0.7, seed=53):
    n = int(dur * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(64 * np.exp(-t * 3) + 40) / SR) * np.exp(-t / 0.25)
    slap = band(noise(n, seed), 300, 3000) * np.exp(-t / 0.05)
    return norm(0.85 * thud + 0.45 * slap, 0.88)


def s_seal(dur=0.60, seed=59):
    n = int(dur * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(62 * np.exp(-t * 3.0) + 44) / SR) * np.exp(-t / 0.30)
    hit = band(noise(n, seed), 300, 1600) * np.exp(-t / 0.035)
    return norm(1.0 * thud + 0.45 * hit, 0.95)


def s_step(dur=0.42, seed=61):
    n = int(dur * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(52 * np.exp(-t * 6) + 34) / SR) * np.exp(-t / 0.10)
    scuff = band(noise(n, seed), 700, 4000) * np.exp(-t / 0.05)
    return norm(0.8 * thud + 0.3 * scuff, 0.7)


def s_robe(dur=0.85, seed=67):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 800, 5200)
    mod = (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.2 * t))).astype(np.float32)
    return norm(z * mod * np.exp(-t / 0.4).astype(np.float32), 0.55)


def s_brush(dur=0.55, seed=71):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 2200, 11000)
    mod = (0.35 + 0.65 * np.abs(np.sin(2 * np.pi * 9 * t))).astype(np.float32)
    env = (np.clip(t / 0.05, 0, 1) * np.exp(-t / 0.3)).astype(np.float32)
    return norm(z * mod * env, 0.62)


def s_ink_drop(dur=0.5, seed=73):
    n = int(dur * SR)
    t = np.arange(n) / SR
    drop = np.sin(2 * np.pi * np.cumsum(420 * np.exp(-t * 18) + 90) / SR) * np.exp(-t / 0.06)
    wet = band(noise(n, seed), 300, 2400) * np.exp(-t / 0.15) * 0.25
    return norm(drop + wet, 0.7)


def s_bell_low(dur=2.4, seed=79):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for mult, amp, dec in [(1.0, 1.0, 1.5), (2.02, 0.45, 0.9), (3.01, 0.22, 0.6), (4.34, 0.1, 0.4)]:
        y += (amp * np.sin(2 * np.pi * 168.0 * mult * t) * np.exp(-t / dec)).astype(np.float32)
    return norm(y * np.clip(t / 0.006, 0, 1).astype(np.float32), 0.85)


def s_gong(dur=3.0, seed=83):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for mult, amp, dec in [(1.0, 1.0, 1.8), (1.51, 0.5, 1.1), (2.33, 0.3, 0.8), (3.71, 0.16, 0.5), (5.2, 0.08, 0.3)]:
        y += (amp * np.sin(2 * np.pi * 96 * mult * t + mult) * np.exp(-t / dec)).astype(np.float32)
    y += band(noise(n, seed), 200, 3000) * np.exp(-t / 0.05) * 0.3
    return norm(y * np.clip(t / 0.01, 0, 1).astype(np.float32), 0.9)


def s_chime(dur=1.6, seed=89):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for mult, amp, dec in [(1.0, 1.0, 0.8), (2.76, 0.4, 0.5), (5.4, 0.18, 0.3)]:
        y += (amp * np.sin(2 * np.pi * 1240 * mult * t) * np.exp(-t / dec)).astype(np.float32)
    return norm(y * np.clip(t / 0.003, 0, 1).astype(np.float32), 0.6)


def s_heart(dur=1.2, seed=97):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for at in (0.02, 0.30):
        y += np.sin(2 * np.pi * 52 * t) * np.exp(-((t - at) ** 2) / (2 * 0.045 ** 2)).astype(np.float32)
    return norm(y, 0.75)


def s_breath(dur=1.8, seed=101):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 300, 2200)
    env = np.exp(-((t - 0.5) ** 2) / (2 * 0.35 ** 2)).astype(np.float32)
    return norm(z * env, 0.5)


def s_whisper(dur=2.2, seed=103):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 900, 5000)
    mod = (0.3 + 0.7 * np.abs(np.sin(2 * np.pi * 2.7 * t) * np.sin(2 * np.pi * 0.7 * t))).astype(np.float32)
    env = np.exp(-((t - 1.0) ** 2) / (2 * 0.55 ** 2)).astype(np.float32)
    return norm(z * mod * env, 0.45)


def s_sub_rise(dur=2.8, seed=107):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 38 + 26 * (t / dur)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    y += 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    env = np.clip(t / (dur * 0.75), 0, 1) ** 1.5
    return norm((y * env).astype(np.float32), 0.8)


def s_flint(dur=0.5, seed=109):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 2500, 12000)
    spark = (np.abs(np.sin(2 * np.pi * 70 * t)) > 0.93).astype(np.float32)
    return norm(z * (0.35 + 0.9 * spark) * np.exp(-t / 0.18).astype(np.float32), 0.65)


def s_hoof(dur=1.4, seed=113):
    n = int(dur * SR)
    out = np.zeros(n, np.float32)
    for at in (0.0, 0.24, 0.50, 0.74, 1.00, 1.26):
        i = int(at * SR)
        seg = s_step(0.22, 61 + int(at * 100))[: min(4000, n - i)]
        out[i:i + len(seg)] += seg * (0.9 if at < 1.1 else 0.6)
    return norm(out, 0.75)


def s_wood_creak(dur=1.1, seed=127):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 90 + 40 * np.sin(2 * np.pi * 2.4 * t)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    y *= (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 5.5 * t)))
    return norm(y * np.exp(-t / 0.7).astype(np.float32), 0.55)


def s_drawer(dur=0.9, seed=131):
    n = int(dur * SR)
    t = np.arange(n) / SR
    slide = band(noise(n, seed), 240, 1800) * np.clip(t / 0.15, 0, 1).astype(np.float32)
    stop = np.sin(2 * np.pi * 70 * t) * np.exp(-((t - 0.72) ** 2) / (2 * 0.03 ** 2)).astype(np.float32)
    env = np.exp(-((t - 0.45) ** 2) / (2 * 0.3 ** 2)).astype(np.float32)
    return norm(slide * env + 0.7 * stop, 0.7)


def s_crack(dur=0.6, seed=137):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 1200, 9000)
    gate = (np.abs(np.sin(2 * np.pi * 40 * t)) > 0.88).astype(np.float32)
    return norm(z * gate * np.exp(-t / 0.12).astype(np.float32), 0.75)


def s_water(dur=1.6, seed=139):
    n = int(dur * SR)
    t = np.arange(n) / SR
    z = band(noise(n, seed), 400, 4000)
    mod = (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.1 * t))).astype(np.float32)
    return norm(z * mod * np.exp(-t / 0.9).astype(np.float32), 0.5)


SYNTH = {
    "whoosh": s_whoosh, "whoosh_low": s_whoosh_low, "wind": s_wind, "air_low": s_air_low,
    "stone": s_stone, "stone_low": s_stone_low, "paper": s_paper, "paper_turn": s_paper_turn,
    "paper_tear": s_paper_tear, "book_close": s_book_close, "seal": s_seal, "step": s_step,
    "robe": s_robe, "brush": s_brush, "ink_drop": s_ink_drop, "bell_low": s_bell_low,
    "gong": s_gong, "chime": s_chime, "heart": s_heart, "breath": s_breath,
    "whisper": s_whisper, "sub_rise": s_sub_rise, "flint": s_flint, "hoof": s_hoof,
    "wood_creak": s_wood_creak, "drawer": s_drawer, "crack": s_crack, "water": s_water,
}

# 关键镜的 5 种音效类型，每类固定 2 个点：入场 + 一个重音。
# 具体哪些镜是 key、哪些是 riser，由 data/audio-plan.json 决定（无 plan 时 auto_key 推导）。
TYPE_CUES: dict[str, list[tuple[str, float, float]]] = {
    # 点数少了，每个点可以更有分量（不再有累积吵闹风险）
    "open": [("paper_turn", 0.05, -11.5), ("wind", 0.70, -19.0)],
    "name": [("whoosh_low", 0.00, -18.0), ("seal", 0.30, -9.0)],
    "turn": [("whoosh", 0.00, -15.5), ("stone", 0.30, -12.5)],
    "map":  [("wind", 0.00, -18.0), ("hoof", 0.60, -17.5)],
    "sign": [("breath", 0.00, -16.5), ("chime", 0.85, -17.5)],
}


def auto_key(shots: list[dict]) -> dict[int, str]:
    """没有 audio-plan.json 时，按卡片类型与节奏推导关键镜。"""
    kinds: dict[int, str] = {}
    for s in shots:
        i, card = int(s["index"]), s["id"]
        if i == 1:
            kinds[i] = "open"
        elif card == "sealcard":
            kinds[i] = "name"
        elif card == "signcard":
            kinds[i] = "sign"
        elif i % 6 == 0:
            kinds[i] = "turn"
    if shots and int(shots[-1]["index"]) not in kinds:
        kinds[int(shots[-1]["index"])] = "sign"
    return kinds


def cues_for(idx: int, card: str, key: dict[int, str], risers: set[int],
             mode: str = "key") -> list[tuple[str, float, float]]:
    if mode == "shot":
        # 每镜 2 个点（密度上限，约每镜 2 个）
        kind = "name" if card == "sealcard" else "sign" if card == "signcard" else "turn"
        return list(TYPE_CUES[kind])
    kind = key.get(idx)
    if kind is None:
        return []
    out = list(TYPE_CUES[kind])
    if idx in risers:
        out.append(("sub_rise", 1.30, -16.5))
    return out


def bgm_track(dur: float) -> np.ndarray:
    if BGM_SRC is None:
        return np.zeros(int(dur * SR), np.float32)
    tmp = ROOT / "audio" / "_bgm.wav"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(BGM_SRC),
                    "-ac", "1", "-ar", str(SR), str(tmp)], check=True)
    x, _ = read_wav(tmp)
    need = int(dur * SR)
    if len(x) < need:
        reps = need // len(x) + 1
        x = np.tile(x, reps)
    x = x[:need].copy()
    f = int(1.6 * SR)
    x[:f] *= np.linspace(0, 1, f)
    x[-f:] *= np.linspace(1, 0, f)
    return x


def main() -> None:
    global ROOT, VOICE_SRC, BGM_SRC

    ap = argparse.ArgumentParser(description="生成全片音轨（旁白 + 程序化音效床 + BGM）")
    ap.add_argument("--project", default=".", help="工程目录（含 data/shots.json 与 audio/）")
    ap.add_argument("--voice", required=True, help="旁白 wav（单声道 16bit）")
    ap.add_argument("--bgm", default=None, help="BGM 文件；不给则不铺")
    ap.add_argument("--plan", default=None, help="data/audio-plan.json（关键镜表）")
    ap.add_argument("--mode", choices=["key", "shot"], default="key",
                    help="key=只在关键镜挂音效；shot=每镜 2 个点")
    args = ap.parse_args()

    ROOT = Path(args.project)
    VOICE_SRC = Path(args.voice)
    BGM_SRC = Path(args.bgm) if args.bgm else None
    mode = args.mode

    data = json.loads((ROOT / "data" / "shots.json").read_text(encoding="utf-8"))
    DUR = float(data["meta"]["duration"])
    total = int(DUR * SR)

    # 关键镜表：有 plan 用 plan，否则自动推导
    if args.plan:
        plan = json.loads(Path(args.plan).read_text(encoding="utf-8"))
        key = {int(k): v for k, v in plan.get("key", {}).items()}
        risers = set(int(x) for x in plan.get("risers", []))
    else:
        key = auto_key(data["shots"])
        risers = set()

    voice, sr0 = read_wav(VOICE_SRC)
    voice = resample(voice, sr0, SR)[:total]
    if len(voice) < total:
        voice = np.pad(voice, (0, total - len(voice)))

    # 人声归一：重配的音量常常和上一版差 5-10dB（换设备/换环境），
    # 不归一会导致 BGM 闪避阈值失效、终混电平整体偏离。
    rms_in = float(np.sqrt((voice ** 2).mean()) + 1e-9)
    gain_db = TARGET_VOICE_RMS - 20 * np.log10(rms_in)
    voice = voice * (10 ** (gain_db / 20.0))
    peak = float(np.abs(voice).max())
    ceil = 10 ** (-1.5 / 20.0)
    if peak > ceil:
        voice = voice * (ceil / peak)
        gain_db -= 20 * np.log10(peak / ceil)
    print(f"人声归一 {gain_db:+.1f} dB → 峰值 {20*np.log10(float(np.abs(voice).max())):.1f} / "
          f"RMS {20*np.log10(float(np.sqrt((voice**2).mean()))):.1f} dBFS"
          f"（目标 RMS {TARGET_VOICE_RMS}，若被峰值限制会低于目标）")

    f = int(0.015 * SR)
    voice[:f] *= np.linspace(0, 1, f)
    voice[-f:] *= np.linspace(1, 0, f)
    write_wav(ROOT / "narration" / "narration.wav", voice)

    bed = np.zeros(total, np.float32)
    used, kinds = 0, set()
    for s in data["shots"]:
        for name, off, gain in cues_for(s["index"], s["id"], key, risers, mode):
            if name not in SYNTH:
                raise SystemExit(f"未知音色 {name}")
            clip = SYNTH[name]() * (10 ** (gain / 20.0))
            start = int(max(0.0, s["t0"] + off) * SR)
            end = min(total, start + len(clip))
            if end > start:
                bed[start:end] += clip[: end - start]
                used += 1
                kinds.add(name)
    peak = float(np.abs(bed).max()) or 1.0
    bed = bed / peak * 0.5
    write_wav(ROOT / "audio" / "sfx-bed.wav", bed)

    # BGM：基值 -21dB，说话时再压 5dB（简易闪避）
    bgm = bgm_track(DUR)
    hop = int(0.02 * SR)
    n = total // hop
    rms = np.sqrt((voice[: n * hop].reshape(n, hop) ** 2).mean(axis=1))
    act = (rms > 0.012).astype(np.float32)
    k = int(0.35 / 0.02)
    act = np.convolve(act, np.ones(k, np.float32) / k, mode="same")
    env = np.repeat(act, hop)[:total]
    if len(env) < total:
        env = np.pad(env, (0, total - len(env)))
    # BGM 电平跟着人声走：人声低 2dB，BGM 也低 2dB，比例恒定。
    # 固定 -8.5dB 只在人声恰好 -21.4 dBFS 时成立（重配换设备就会失衡）。
    voice_db = 20 * np.log10(float(np.sqrt((voice ** 2).mean())) + 1e-9)
    bgm_db = voice_db + BGM_OFFSET
    bgm = bgm * (10 ** (bgm_db / 20.0)) * (1.0 - 0.40 * env)

    mixed = voice + bed * (10 ** (-4.0 / 20.0)) + bgm
    m = float(np.abs(mixed).max())
    if m > 0.98:
        mixed = mixed / m * 0.98
    write_wav(ROOT / "audio" / "final-audio.wav", mixed)

    print(f"音效 {used} 条 / {len(kinds)} 种音色｜床峰值 {np.abs(bed).max():.2f}")
    print(f"人声 RMS {voice_db:.1f} dBFS｜BGM {bgm_db:.1f}dB（人声 +{BGM_OFFSET}，说话时再压 4.4）")


if __name__ == "__main__":
    main()
