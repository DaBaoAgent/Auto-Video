# -*- coding: utf-8 -*-
"""S2/S4 桥接件：行级旁白时码 → 分镜表 → Remotion 时间线数据。

输入：projects/<slug>/narration/narration.json（line_tts.py 产出，每行 start/end）
      projects/<slug>/film.json（镜头序列：scene / card / caption / tone / content）
输出：projects/<slug>/data/shots.json

规则（「2-3 秒一个分镜」的硬约束）：
  1. 一个分句 = 一个口播块；镜头与块默认 1:1，也可用 shot 的
     "chunks": [起, 止]（1 基，含端点）把多块并成一个长镜（2-5s 长镜头）；
  2. 分组必须首尾相接且全覆盖，镜界只能落在**组间静音窗**内
     （前组末块 end+0.06 … 后组首块 start−0.06），绝不切在语音中间；
  3. 若某镜 > max_shot，把出点提前到静音窗最早处；
     仍越界则打印告警，由人工改稿，不硬凑。

字幕两条路（二选一）：
  A. film.json 无 captions → 「一镜一条」：caption 文字取自分句（保留标点），
     随镜头显示（chibi 老口径）；
  B. film.json 有 captions → 句级字幕轨：[{text, from, to}]，一行一句、
     自动去标点、时序独立于分镜；per-shot caption 全部关闭。
     rules.caption_size（字号）/ rules.caption_offset（字幕底距 px）
     经 meta 传给 Caption 组件。

用法：
  python jianying/scripts/build_shots.py --project chibi
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Paths, require, strip_punct  # noqa: E402

HEAD, TAIL = 0.06, 0.06   # 镜界距语音的安全边距


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True, help="选题 slug")
    ap.add_argument("--fps", type=int, default=None, help="默认取 film.json")
    args = ap.parse_args()

    P = Paths(args.project)
    film = P.film
    fps = args.fps or film.get("fps", 30)
    width = film.get("width", 1920)
    height = film.get("height", 1080)
    rules = film.get("rules", {})
    min_shot = rules.get("min_shot", 2.0)
    max_shot = rules.get("max_shot", 3.0)
    film_caps = film.get("captions")          # 句级字幕轨（存在即接管字幕）
    max_cap_chars = rules.get("max_caption_chars", 16)
    spec = film["shots"]

    data = json.loads(
        require(P.narration_json, f"jianying_shotcraft.py tts --project {args.project}")
        .read_text(encoding="utf-8-sig")
    )
    chunks = data["chunks"]
    total = float(data["duration"])

    # 镜头 ← 口播块分组：shot 写 "chunks": [起, 止]（1 基，含端点）即把多块
    # 并成一个长镜；缺省 = 一块一镜。分组必须首尾相接且全覆盖。
    groups: list[list[int]] = []
    k = 0
    for s in spec:
        if "chunks" in s:
            a, b = int(s["chunks"][0]), int(s["chunks"][1])
            if a - 1 != k or b < a:
                raise SystemExit(
                    f"镜头 {s['scene']} 的 chunks [{a},{b}] 不连续"
                    f"（上一镜覆盖到第 {k} 块）——分组必须首尾相接"
                )
            grp = list(range(a - 1, b))
        else:
            if k >= len(chunks):
                raise SystemExit(
                    f"口播只有 {len(chunks)} 块，第 {len(groups) + 1} 镜起无块可分。\n"
                    f"一镜可含多块（shots[].chunks），先改稿或改 shots 表。"
                )
            grp = [k]
        groups.append(grp)
        k = grp[-1] + 1
    if k != len(chunks):
        raise SystemExit(
            f"口播 {len(chunks)} 块 vs 镜头覆盖到第 {k} 块，数量不一致。\n"
            f"一行 = 一块；一镜可含多块（shots[].chunks），但必须全覆盖。"
        )

    # 镜界只能落在**组间静音窗**内；默认镜界 = 后组首块起点，再夹到窗内
    bounds = [0.0]
    notes: list[str] = []
    for g in range(len(groups) - 1):
        cur_last = chunks[groups[g][-1]]
        nxt_first = chunks[groups[g + 1][0]]
        lo, hi = cur_last["end"] + HEAD, nxt_first["start"] - TAIL
        default = nxt_first["start"]
        b = min(max(default, lo), hi)
        if b != default:
            notes.append(f"镜界 {g+1}→{g+2} 提前 {default - b:.2f}s 到静音窗最早的 {b:.2f}s")
        bounds.append(round(b, 3))
    bounds.append(round(total, 3))

    shots = []
    for i, s in enumerate(spec):
        grp = groups[i]
        t0, t1 = bounds[i], bounds[i + 1]
        dur = t1 - t0
        if dur > max_shot:
            lo = chunks[grp[-1]]["end"] + HEAD
            if lo > t0 and lo - t0 <= max_shot:
                notes.append(f"镜 {i+1} 过长 {dur:.2f}s → 出点提前到 {lo:.2f}s")
                bounds[i + 1] = round(lo, 3)
                t1, dur = bounds[i + 1], bounds[i + 1] - t0
        flags = []
        if dur < min_shot:
            flags.append(f"短于 {min_shot}s")
        if dur > max_shot:
            flags.append(f"长于 {max_shot}s")
        from_f = round(t0 * fps)
        to_f = round(t1 * fps)
        shots.append({
            "index": i + 1,
            "id": s["scene"],
            "card": s.get("card", ""),
            "text": "".join(chunks[j]["text"] for j in grp),
            "caption": "" if film_caps else (chunks[grp[0]]["text"] if s.get("caption", True) else ""),
            "caption_tone": s.get("tone", "ink"),
            "content": s.get("content", {}),
            "t0": round(t0, 3),
            "t1": round(t1, 3),
            "duration": round(dur, 3),
            "from": from_f,
            "frames": max(1, to_f - from_f),
            "speech_start": chunks[grp[0]]["start"],
            "speech_end": chunks[grp[-1]]["end"],
            "warn": flags,
        })

    # 句级字幕轨：一行一句、去标点、独立时序；起点必须晚于上一条止点
    # （一次只显示一行），出点不越片长
    captions_out = None
    if film_caps:
        captions_out = []
        prev_to = 0.0
        for i, c in enumerate(film_caps):
            text = strip_punct(str(c.get("text", "")))
            if not text:
                raise SystemExit(f"captions[{i}] 去标点后为空：{c.get('text')!r}")
            t0 = float(c.get("from", prev_to))
            t1 = float(c["to"])
            if t0 < prev_to - 1e-6:
                raise SystemExit(
                    f"captions[{i}]（{text}）起点 {t0:.2f}s 早于上一条止点 "
                    f"{prev_to:.2f}s——一次只能显示一行"
                )
            if t1 > total + 1e-6:
                raise SystemExit(
                    f"captions[{i}]（{text}）出点 {t1:.2f}s 超过片长 {total:.2f}s"
                )
            from_f, to_f = round(t0 * fps), round(t1 * fps)
            if len(text) > max_cap_chars:
                notes.append(
                    f"captions[{i}]（{text}）{len(text)} 字超过 "
                    f"rules.max_caption_chars={max_cap_chars}，改稿而不是硬凑"
                )
            captions_out.append({
                "index": i + 1,
                "text": text,
                "tone": c.get("tone", "ink"),
                "from": from_f,
                "frames": max(1, to_f - from_f),
                "t0": round(t0, 3),
                "t1": round(t1, 3),
            })
            prev_to = t1
        notes.append(
            f"句级字幕 {len(captions_out)} 条接管字幕轨（per-shot caption 已全部关闭）"
        )

    # 帧级连续性校正：前一镜的 frames 必须等于后一镜 from − 前一镜 from
    for i in range(len(shots) - 1):
        shots[i]["frames"] = shots[i + 1]["from"] - shots[i]["from"]
    shots[-1]["frames"] = round(total * fps) - shots[-1]["from"]

    out = {
        "meta": {
            "slug": P.slug,
            "title": film.get("title", P.slug),
            "theme": film.get("theme", "paper"),
            "accentLock": film.get("accentLock", False),
            "fps": fps,
            "width": width,
            "height": height,
            "duration": round(total, 3),
            "durationInFrames": round(total * fps),
            "shot_count": len(shots),
            "caption_size": rules.get("caption_size", 36),
            "caption_offset": rules.get("caption_offset", 62),
            "narration": data.get("audio", ""),
            "avg_shot": round(sum(s["duration"] for s in shots) / len(shots), 2),
        },
        "shots": shots,
    }
    if captions_out:
        out["captions"] = captions_out
    P.data.mkdir(parents=True, exist_ok=True)
    P.shots.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"{'#':>2} {'秒':>5} {'帧':>4}  场景             文案")
    for s in shots:
        warn = ("  ⚠ " + "/".join(s["warn"])) if s["warn"] else ""
        print(f"{s['index']:>2} {s['duration']:>5.2f} {s['frames']:>4}  {s['id']:<16} {s['text']}{warn}")
    print(f"\n总长 {total:.2f}s / {out['meta']['durationInFrames']} 帧 / "
          f"平均 {out['meta']['avg_shot']}s 每镜 → {P.shots}")
    for n in notes:
        print("·", n)
    if captions_out:
        print("\n字幕轨（句级，一行一句）：")
        for c in captions_out:
            print(f"  {c['index']:>2} {c['t0']:>5.2f}–{c['t1']:<5.2f} "
                  f"{c['frames']:>4}f  {c['text']}")
    bad = [s for s in shots if s["warn"]]
    if bad:
        print(f"\n⚠ {len(bad)} 镜越界（{min_shot}–{max_shot}s），改稿而不是硬凑")


if __name__ == "__main__":
    main()
