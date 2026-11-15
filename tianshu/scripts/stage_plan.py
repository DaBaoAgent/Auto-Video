# -*- coding: utf-8 -*-
"""tianshu · 分镜（语义切分，单镜 3–6s）

切口跟着故事走，不跟着秒表走。规则（026 全片 123 镜实际跑出来的那套）：

1. 一个句子本身 3–6s → 直接成镜
2. 超过 6s → 按它自己的子句标点切成 3–6s；子句是最小语义单位，
   只有单个子句自己超 6s 才在句内硬切
3. 不足 3s → 并入同段相邻单元（合起来仍 ≤6s）；整段不足 3s 才允许跨段合并
4. 实在合不进去的独句（<3s）保留 —— 硬拉到 3s 会和配音脱轨

产出 work/shot_plan.json + out/<名>.srt（字幕就用镜头的旁白与真实时码）
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import tcfg

PUNCT = "，。；：、？！"


def clean(t: str) -> str:
    return re.sub(rf"[{PUNCT}\s]", "", t)


def split_clauses(text: str) -> list[str]:
    out, buf = [], ""
    for ch in text:
        buf += ch
        if ch in PUNCT:
            out.append(buf)
            buf = ""
    if buf.strip():
        out.append(buf)
    return [c for c in out if clean(c)]


def units_for_sentence(s: dict, MN: float, MX: float) -> list[dict]:
    if s["dur"] <= MX + 1e-6:
        return [{"text": s["text"], "t": s["dur"], "sent": s["idx"]}]

    clauses = split_clauses(s["text"])
    chars = [len(clean(c)) for c in clauses]
    csum = sum(chars) or 1
    pieces = [{"text": c, "t": s["dur"] * n / csum, "sent": s["idx"]}
              for c, n in zip(clauses, chars)]

    flat = []
    for p in pieces:
        if p["t"] <= MX:
            flat.append(p)
            continue
        n = clean(p["text"])
        k = max(2, int(-(-p["t"] // MX)))
        step = max(1, len(n) // k)
        for i in range(0, len(n), step):
            seg = n[i:i + step]
            if seg:
                flat.append({"text": seg, "t": p["t"] * len(seg) / len(n), "sent": p["sent"]})

    groups, cur, cur_t = [], [], 0.0
    for p in flat:
        if cur and cur_t + p["t"] > MX + 1e-6:
            groups.append(cur)
            cur, cur_t = [], 0.0
        cur.append(p)
        cur_t += p["t"]
    if cur:
        groups.append(cur)

    for _ in range(6):
        changed = False
        for i in range(len(groups) - 1, 0, -1):
            if sum(x["t"] for x in groups[i]) < MN - 1e-6 and len(groups[i - 1]) > 1:
                groups[i] = [groups[i - 1].pop()] + groups[i]
                changed = True
        if not changed:
            break

    return [{"text": "".join(x["text"] for x in g),
             "t": sum(x["t"] for x in g),
             "sent": s["idx"]} for g in groups]


def merge_short(units: list[dict], MN: float, MX: float) -> None:
    i = 0
    while i < len(units):
        u = units[i]
        if u["t"] >= MN - 1e-6:
            i += 1
            continue
        prev_ok = i > 0 and units[i - 1]["para"] == u["para"] and units[i - 1]["t"] + u["t"] <= MX
        next_ok = i + 1 < len(units) and units[i + 1]["para"] == u["para"] and units[i + 1]["t"] + u["t"] <= MX
        if prev_ok:
            units[i - 1].update(text=units[i - 1]["text"] + u["text"],
                                t=units[i - 1]["t"] + u["t"],
                                sent=sorted({*_as_list(units[i - 1]["sent"]), *_as_list(u["sent"])}))
            units.pop(i)
        elif next_ok:
            units[i + 1].update(text=u["text"] + units[i + 1]["text"],
                                t=units[i + 1]["t"] + u["t"],
                                sent=sorted({*_as_list(u["sent"]), *_as_list(units[i + 1]["sent"])}))
            units.pop(i)
        else:
            i += 1


def _as_list(v):
    return v if isinstance(v, list) else [v]


def merge_cross_paragraph(units: list[dict], MN: float, MX: float) -> None:
    i = 0
    while i < len(units) and len(units) > 1:
        if units[i]["t"] >= MN - 1e-6:
            i += 1
            continue
        j = i - 1 if i > 0 else i + 1
        lo, hi = min(i, j), max(i, j)
        if units[lo]["t"] + units[hi]["t"] <= MX + 0.6:
            units[lo]["text"] += units[hi]["text"]
            units[lo]["t"] += units[hi]["t"]
            units[lo]["sent"] = sorted({*_as_list(units[lo]["sent"]), *_as_list(units[hi]["sent"])})
            units.pop(hi)
        else:
            i += 1


def shape_long(units: list[dict], MN: float, MX: float) -> None:
    """过长切两半、过短并邻居，反复收敛。"""
    for _ in range(20):
        changed = False
        for i, u in enumerate(units):
            if u["t"] > MX + 0.05:
                cl = split_clauses(u["text"])
                if len(cl) < 2:
                    continue
                chars = [len(clean(c)) for c in cl]
                cs = sum(chars) or 1
                times = [u["t"] * n / cs for n in chars]
                best = None
                for k in range(1, len(cl)):
                    lt, rt = sum(times[:k]), sum(times[k:])
                    if lt <= MX and rt <= MX:
                        score = abs(lt - u["t"] / 2)
                        if best is None or score < best[0]:
                            best = (score, k)
                if best is None:
                    continue
                k = best[1]
                base = {k2: u.get(k2) for k2 in ("sent", "para", "sent_start")}
                units[i:i + 1] = [
                    {**base, "text": "".join(cl[:k]), "t": sum(times[:k])},
                    {**base, "text": "".join(cl[k:]), "t": sum(times[k:])},
                ]
                changed = True
                break
        if not changed:
            break
        i = 0
        while i < len(units):
            u = units[i]
            if u["t"] < MN - 0.05 and len(units) > 1:
                for j in (i - 1, i + 1):
                    if 0 <= j < len(units) and units[j]["t"] + u["t"] <= MX + 1e-6:
                        lo, hi = min(i, j), max(i, j)
                        units[lo]["text"] = (units[lo]["text"] + units[hi]["text"]
                                             if lo == i else units[hi]["text"] + units[lo]["text"])
                        units[lo]["t"] += units[hi]["t"]
                        units[lo]["sent"] = sorted({*_as_list(units[lo]["sent"]), *_as_list(units[hi]["sent"])})
                        units.pop(hi)
                        break
            i += 1


def borrow_for_short(units: list[dict], MN: float, MX: float) -> None:
    """2 秒镜的最后一招：从长邻居借一个子句，让两边都落回 3–6s。"""
    for _ in range(30):
        changed = False
        for i, u in enumerate(units):
            if u["t"] >= MN - 0.05:
                continue
            for j in (i - 1, i + 1):
                if not (0 <= j < len(units)):
                    continue
                v = units[j]
                if v["t"] <= MN + 0.2:
                    continue
                cl = split_clauses(v["text"])
                if len(cl) < 2:
                    continue
                csum = sum(len(clean(c)) for c in cl) or 1
                pick = cl[0] if j == i + 1 else cl[-1]
                ct = v["t"] * len(clean(pick)) / csum
                if v["t"] - ct < MN - 1e-6 or u["t"] + ct > MX + 1e-6:
                    continue
                v["text"] = "".join(cl[1:] if j == i + 1 else cl[:-1])
                v["t"] -= ct
                u["text"] = (u["text"] + pick) if j == i + 1 else (pick + u["text"])
                u["t"] += ct
                changed = True
                break
        if not changed:
            break


def build(beats: dict, MN: float, MX: float) -> dict:
    by_para: dict = {}
    for s in beats["sentences"]:
        by_para.setdefault(s.get("para"), []).append(s)

    units: list[dict] = []
    for para, sents in by_para.items():
        for s in sents:
            for u in units_for_sentence(s, MN, MX):
                u["para"] = para
                u["sent_start"] = s["start"]
                units.append(u)

    merge_short(units, MN, MX)
    merge_cross_paragraph(units, MN, MX)
    shape_long(units, MN, MX)
    borrow_for_short(units, MN, MX)

    tt = sum(u["t"] for u in units)
    total = float(beats["total"])
    shots, cursor = [], 0.0
    for k, u in enumerate(units):
        end = total if k == len(units) - 1 else cursor + u["t"] * (total / tt)
        shots.append({
            "shot_id": f"S{k + 1:03d}",
            "para": u["para"],
            "start": round(cursor, 3),
            "end": round(end, 3),
            "dur": round(end - cursor, 3),
            "narration": u["text"],
            "sentences": _as_list(u["sent"]),
        })
        cursor = end
    return {"shots": shots, "meta": {"n_shots": len(shots), "total": round(cursor, 3)}}


def write_srt(shots: list[dict], path: Path) -> None:
    def ts(t: float) -> str:
        h, r = divmod(int(round(t * 1000)), 3600_000)
        m, r = divmod(r, 60_000)
        s, ms = divmod(r, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    lines = []
    for i, s in enumerate(shots, 1):
        text = re.sub(r"[，。；：、？！]", "", s["narration"]).strip()
        lines.append(f"{i}\n{ts(s['start'])} --> {ts(s['end'])}\n{text}\n")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py plan")
    ap.add_argument("name")
    ap.add_argument("--beats", default="")
    ap.add_argument("--min", dest="mn", type=float, default=3.0)
    ap.add_argument("--max", dest="mx", type=float, default=6.0)
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    beats_path = Path(a.beats) if a.beats else pd / "work" / "narration_beats.json"
    beats = tcfg.load_json(beats_path)
    if not beats:
        print(f"缺 {beats_path}，先跑 beats")
        return 1

    plan = build(beats, a.mn, a.mx)
    tcfg.save_json(pd / "work" / "shot_plan.json", plan)
    write_srt(plan["shots"], pd / "out" / f"{a.name}.srt")

    ds = [s["dur"] for s in plan["shots"]]
    print(f"{len(ds)} 镜  总 {plan['meta']['total']:.2f}s  "
          f"最短 {min(ds):.2f} 最长 {max(ds):.2f} 均 {sum(ds) / len(ds):.2f}")
    lo = [s["shot_id"] for s in plan["shots"] if s["dur"] < a.mn - 0.05]
    hi = [s["shot_id"] for s in plan["shots"] if s["dur"] > a.mx + 0.05]
    print(f"<{a.mn}s: {len(lo)} {lo[:8]}    >{a.mx}s: {len(hi)} {hi[:8]}")
    print(f"-> {pd / 'work' / 'shot_plan.json'}")
    return 0
