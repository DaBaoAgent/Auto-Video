#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把参考视频转写成文本 + SRT，供文案风格/叙事结构研究。

用法:
    python transcribe-ref.py <视频1> [视频2] ...
输出: 与视频同目录的 <同名>.txt（纯文本，段落）与 <同名>.srt（带时间轴）。
模型: 复用 battlefield-editor 已下载的 faster-whisper small（本地缓存）。
"""
import os, sys, subprocess
from pathlib import Path

MODEL = os.environ.get("BFE_ALIGN_MODEL", r"C:\Users\20200\.cache\battlefield-editor\faster-whisper-small")


def srt_time(t):
    h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    from faster_whisper import WhisperModel
    print(f"加载模型 {MODEL} (cpu/int8)…", flush=True)
    model = WhisperModel(MODEL, device="cpu", compute_type="int8", cpu_threads=4)

    for src in sys.argv[1:]:
        p = Path(src)
        if not p.exists():
            print(f"[SKIP] 不存在: {src}"); continue
        print(f"\n=== 转写 {p.name} ===", flush=True)
        segments, info = model.transcribe(str(p), language="zh", beam_size=5,
                                          vad_filter=True, word_timestamps=False)
        lines, srt = [], []
        for i, seg in enumerate(segments, 1):
            t = seg.text.strip()
            if not t:
                continue
            lines.append(t)
            srt.append(f"{i}\n{srt_time(seg.start)} --> {srt_time(seg.end)}\n{t}\n")
            print(f"  [{seg.start:7.1f}-{seg.end:7.1f}] {t}", flush=True)
        txt_out = p.with_suffix(".txt")
        srt_out = p.with_suffix(".srt")
        txt_out.write_text("\n".join(lines), encoding="utf-8")
        srt_out.write_text("\n".join(srt), encoding="utf-8")
        n_chars = sum(len(l) for l in lines)
        print(f"[DONE] {txt_out.name}  段={len(lines)}  字≈{n_chars}  srt={srt_out.name}", flush=True)


if __name__ == "__main__":
    main()
