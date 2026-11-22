"""把 chengshi / shipai / tuiyan / jilupian 的四条 10 秒裁剪卡，以及配音前端的封面卡，写进 samples.json。

用法：python tools/add_old10s_cards.py
"""
from __future__ import annotations

import json
import os
from pathlib import Path

REPO = Path(r"D:\@kaifa\Auto-Video")
SITE = REPO / "site"
SAMPLES = SITE / "assets" / "samples.json"


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


def dump(p: Path, obj):
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def main():
    data = load(SAMPLES)
    items = data["items"]
    catalog = load(REPO / "catalog" / "pipelines.json")["pipelines"]
    cat = {p["id"]: p for p in catalog}
    by_key = {i["key"]: i for i in items}

    def put(entry):
        items[items.index(by_key[entry["key"]])] = entry if entry["key"] in by_key else entry
        by_key[entry["key"]] = entry

    # --- 四条老管线的 10 秒裁剪卡 ---
    cuts = {
        "chengshi": (1024, 576, "16:9"),
        "shipai": (576, 1024, "9:16"),
        "tuiyan": (1024, 576, "16:9"),
        "jilupian": (1024, 576, "16:9"),
    }
    for pid, (w, h, aspect) in cuts.items():
        p = cat[pid]
        mp4 = SITE / "media" / f"{pid}.mp4"
        entry = {
            "key": pid,
            "kind": "pipeline",
            "pipeline": pid,
            "title": (p.get("sample") or {}).get("title", ""),
            "style": p["name_zh"],
            "style_en": p["name_en"],
            "station": p["station"],
            "badge": "10 秒样片",
            "long_edge": 1024,
            "max_seconds": 10.0,
            "crf": 30,
            "seconds": 10.0,
            "duration": "0:10",
            "width": w,
            "height": h,
            "aspect": aspect,
            "clip_seconds": 10.0,
            "poster_pick": {"by": "fixed", "note": "取 3.2 秒处", "seconds": 3.2},
            "mp4": f"media/{pid}.mp4",
            "poster": f"media/{pid}.jpg",
            "source": f"samples-v2/old-{pid}-10s.mp4",
            "bytes": mp4.stat().st_size,
            "voice": None,
            "rate": None,
            "subtitle": None,
            "narration": None,
        }
        if pid in by_key:
            idx = items.index(by_key[pid])
            items[idx] = entry
        else:
            items.append(entry)
        by_key[pid] = entry

    # --- 配音前端：只有封面，没有样片 ---
    pei = cat["peiyin"]
    cover = SITE / "media" / "peiyin-cover.jpg"
    entry = {
        "key": "peiyin",
        "kind": "pipeline",
        "pipeline": "peiyin",
        "title": "",
        "style": pei["name_zh"],
        "style_en": pei["name_en"],
        "station": pei["station"],
        "badge": "封面",
        "long_edge": 1024,
        "max_seconds": None,
        "crf": None,
        "seconds": None,
        "duration": "—",
        "width": 1024,
        "height": 576,
        "aspect": "16:9",
        "clip_seconds": None,
        "poster_pick": {"by": "cover", "note": "封面图，不出片"},
        "mp4": None,
        "poster": "media/peiyin-cover.jpg",
        "source": "tools/cover-peiyin.html",
        "bytes": cover.stat().st_size,
        "voice": None,
        "rate": None,
        "subtitle": None,
        "narration": None,
        "note": "配音前端不出片，只出口播稿与配音",
    }
    if "peiyin" in by_key:
        items[items.index(by_key["peiyin"])] = entry
    else:
        items.append(entry)

    data["generated_from"] = str(REPO / "samples-v2")
    dump(SAMPLES, data)
    print(f"samples.json 现有 {len(items)} 张卡（{sum(1 for i in items if i.get('mp4'))} 张有样片）")


if __name__ == "__main__":
    main()
