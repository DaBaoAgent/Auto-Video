# -*- coding: utf-8 -*-
"""字幕：句级字幕轨（film.json captions）或行级/分句级时码 → SRT。

优先用 film.json 的 captions——SRT 必须与烧进片子的字幕逐条一致
（一行一句、无标点）；缺省走 narration.json 分句路径
（≤max_chars 字/条，超长按字符数分配时长，与原文逐字一致）。

用法：
  python pipeline/build_srt.py --narration output/sample-30s/narration.json \
      --out out/01-chibi/字幕.srt
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

MAX_CHARS = 16
SPLIT = re.compile(r"(?<=[，。；：！？、])")


def secs_to_srt(t: float) -> str:
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        s, ms = s + 1, 0
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", help="选题 slug（给这个就不用再写 --narration/--out）")
    ap.add_argument("--narration", type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--max-chars", type=int, default=None)
    args = ap.parse_args()

    film_caps = None
    if args.project:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from common import Paths
        P = Paths(args.project)
        args.narration = args.narration or P.narration_json
        args.out = args.out or P.srt
        film_caps = P.film.get("captions")
        if args.max_chars is None:
            args.max_chars = P.film.get("rules", {}).get("max_caption_chars", MAX_CHARS)
    args.max_chars = MAX_CHARS if args.max_chars is None else args.max_chars
    if not args.narration or not args.out:
        raise SystemExit("要么给 --project，要么同时给 --narration 与 --out")

    data = json.loads(args.narration.read_text(encoding="utf-8-sig"))
    cues: list[tuple[float, float, str]] = []
    if film_caps:
        # 句级字幕轨：与烧进片子的 Caption 同一数据源
        from common import strip_punct
        for c in film_caps:
            cues.append((float(c["from"]), float(c["to"]),
                         strip_punct(str(c["text"]))))
    else:
        for c in data["chunks"]:
            text = c["text"]
            pieces = [p for p in SPLIT.split(text) if p.strip()]
            # 合并相邻短句，超过上限再切
            merged: list[str] = []
            for p in pieces:
                if merged and len(merged[-1]) + len(p) <= args.max_chars:
                    merged[-1] += p
                else:
                    merged.append(p)
            total = sum(len(p) for p in merged) or 1
            t = c["start"]
            span = c["end"] - c["start"]
            for p in merged:
                d = span * len(p) / total
                cues.append((t, t + d, p.strip()))
                t += d

    lines = []
    for i, (a, b, txt) in enumerate(cues, 1):
        lines.append(f"{i}\n{secs_to_srt(a)} --> {secs_to_srt(b)}\n{txt}\n")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("\n".join(lines), encoding="utf-8")
    long_cues = [c for c in cues if len(c[2]) > args.max_chars]
    print(f"字幕 {len(cues)} 条 → {args.out}"
          + (f"（{len(long_cues)} 条超过 {args.max_chars} 字）" if long_cues else ""))


if __name__ == "__main__":
    main()
