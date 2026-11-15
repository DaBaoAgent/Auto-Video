# -*- coding: utf-8 -*-
"""分镜表 → data/shots.json

输入两份：
  narration/narration.json   从句级时码（由 align 或 realign 产出）
  data/storyboard.json       人写的分镜表（每镜用哪张卡、什么文案、哪张底图、几句词）

输出：
  data/shots.json            镜头（绝对时码铺排）+ 字幕轨 + 渲染用的 meta

为什么不是「按 2 秒攒镜」：时长一变（重配、改稿），按秒攒的镜界会漂 1–2 句，
卡片、底图、音效计划全部错位。这里每镜直接写「占几句」（count），
从句数固定 → 镜数固定 → 所有按镜号的资产永远对得上。

storyboard.json 契约见 references/storyboard.md。
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

DEFAULT_META = {
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "caption_size": 60,
    "caption_offset": 112,
    "max_caption_chars": 14,
    "theme": "paper",
    "accentLock": True,
}

# 句末断点：优先断在虚词、方位词之后，避免「里清 | 楚楚写着」这类硬切
BREAK_AFTER = "的了是在和与就都也里上中后前时着过"


def split_long(text: str, limit: int) -> list[str]:
    pieces, rest = [], text
    while len(rest) > limit:
        cut = -1
        for k in range(limit, 5, -1):
            if rest[k - 1] in BREAK_AFTER:
                cut = k
                break
        if cut < 0:
            cut = limit
        pieces.append(rest[:cut])
        rest = rest[cut:]
    if rest:
        pieces.append(rest)
    return pieces


def main() -> None:
    ap = argparse.ArgumentParser(description="storyboard.json + narration.json → shots.json")
    ap.add_argument("--project", default=".", help="工程目录（含 narration/ 与 data/）")
    ap.add_argument("--storyboard", default=None, help="默认 <project>/data/storyboard.json")
    args = ap.parse_args()

    root = Path(args.project)
    sb_path = Path(args.storyboard) if args.storyboard else root / "data" / "storyboard.json"
    sb = json.loads(sb_path.read_text(encoding="utf-8"))
    nj = json.loads((root / "narration" / "narration.json").read_text(encoding="utf-8"))

    meta = {**DEFAULT_META, **sb.get("meta", {})}
    fps = int(meta["fps"])
    dur = float(nj["duration"])
    total_frames = int(round(dur * fps))
    chunks = nj["chunks"]
    limit = int(meta["max_caption_chars"])

    # 按每镜的 count 切从句；也支持 lines:[a,b]（0 基，含端点）精确指定
    groups: list[list[dict]] = []
    i = 0
    for n, s in enumerate(sb["shots"], 1):
        if "lines" in s:
            a, b = s["lines"]
            if a != i:
                raise SystemExit(f"第 {n} 镜 lines 起点 {a} 与上一镜结尾 {i} 不连续")
            grp = chunks[a:b + 1]
        else:
            cnt = int(s.get("count", 1))
            grp = chunks[i:i + cnt]
        if not grp:
            raise SystemExit(f"第 {n} 镜没分到从句（起点 {i}）")
        groups.append(grp)
        i += len(grp)
    if i != len(chunks):
        raise SystemExit(f"分镜只覆盖 {i} / {len(chunks)} 个从句，最后 {len(chunks) - i} 句没归镜")

    # 绝对时码铺排：每镜止于下一镜起点，句间静音并入前一镜
    starts = [int(round(g[0]["start"] * fps)) for g in groups]
    starts[0] = 0
    ends = starts[1:] + [total_frames]

    shots = []
    for idx, (grp, s, ts, te) in enumerate(zip(groups, sb["shots"], starts, ends), 1):
        frames = te - ts
        if frames < 1:
            raise SystemExit(f"第 {idx} 镜帧数为 {frames}，检查时码")
        shot = {
            "index": idx,
            "id": s["card"],
            "card": "",
            "text": "".join(c["text"] for c in grp),
            "caption": "",
            "caption_tone": s.get("tone", "ink"),
            "content": s.get("content", {}),
            "from": ts,
            "frames": frames,
            "t0": round(grp[0]["start"], 3),
            "t1": round(grp[-1]["end"], 3),
            "duration": round(frames / fps, 3),
            "speech_start": round(grp[0]["start"] + 0.08, 3),
            "speech_end": round(grp[-1]["end"] - 0.05, 3),
        }
        if s.get("bg"):
            shot["bg"] = s["bg"]
        if s.get("cam"):
            shot["cam"] = s["cam"]
        shots.append(shot)

    # 字幕轨：从句直转，超 limit 拆两条，在同一句时长内按字数分配
    caps = []
    for c in chunks:
        text, t0, t1 = c["text"], c["start"], c["end"]
        pieces = split_long(text, limit)
        tot = sum(len(p) for p in pieces) or 1
        t = t0
        for p in pieces:
            d = (t1 - t0) * len(p) / tot
            caps.append({
                "text": p, "tone": "ink",
                "t0": round(t, 3), "t1": round(t + d, 3),
                "from": int(round(t * fps)),
                "frames": max(5, int(round(d * fps))),
            })
            t += d
    for n, c in enumerate(caps, 1):
        c["index"] = n

    out_meta = {
        "slug": meta.get("slug", root.name),
        "title": meta.get("title", ""),
        "theme": meta["theme"],
        "accentLock": meta["accentLock"],
        "fps": fps,
        "width": meta["width"],
        "height": meta["height"],
        "duration": round(dur, 3),
        "durationInFrames": total_frames,
        "caption_size": meta["caption_size"],
        "caption_offset": meta["caption_offset"],
        "narration": meta.get("narration", "narration.mp3"),
        "shot_count": len(shots),
        "avg_shot": round(dur / len(shots), 2),
    }
    for key in ("backgrounds", "crowded", "ornament", "oldfilm"):
        if key in sb:
            out_meta[key] = sb[key]

    (root / "data").mkdir(parents=True, exist_ok=True)
    payload = {"meta": out_meta, "shots": shots, "captions": caps}
    (root / "data" / "shots.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # 音效关键镜表（若分镜里标了 audio）
    plan = {"note": "关键镜表：只有这些镜头挂音效", "risers": [], "key": {}}
    if "audio_plan" in sb:
        plan.update(sb["audio_plan"])
    else:
        for s in shots:
            if s["id"] == "sealcard":
                plan["key"][str(s["index"])] = "name"
            elif s["id"] == "signcard":
                plan["key"][str(s["index"])] = "sign"
        if shots:
            plan["key"]["1"] = "open"
            plan["key"][str(shots[-1]["index"])] = "sign"
    (root / "data" / "audio-plan.json").write_text(
        json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")

    # 校验
    bad = [(s["index"], s["duration"]) for s in shots if s["duration"] < 1.0]
    print(f"镜 {len(shots)} / 字幕 {len(caps)} / 帧 {total_frames} / {dur:.2f}s / 均 {dur/len(shots):.2f}s")
    if bad:
        print("⚠ 短于 1 秒的镜：" + ", ".join(f"#{i}({d}s)" for i, d in bad))
    over = [(s["index"], s["duration"]) for s in shots if s["duration"] > 6.0]
    if over:
        print("⚠ 长于 6 秒的镜：" + ", ".join(f"#{i}({d}s)" for i, d in over))


if __name__ == "__main__":
    main()
