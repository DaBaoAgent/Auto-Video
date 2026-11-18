# -*- coding: utf-8 -*-
"""用 samples-v2 的 34 条 10 秒样片重建站点卡片（samples.json）。"""
import json, pathlib, os

ROOT = pathlib.Path(r"D:\@kaifa\Auto-Video")
MAN = json.loads((ROOT / "samples-v2" / "manifest.json").read_text(encoding="utf-8"))
CAT = json.loads((ROOT / "catalog" / "pipelines.json").read_text(encoding="utf-8"))
OLD = json.loads((ROOT / "site" / "assets" / "samples.json").read_text(encoding="utf-8"))

cat = {p["id"]: p for p in CAT["pipelines"]}
old_items = {it.get("pipeline"): it for it in OLD["items"] if it.get("kind") == "pipeline"}
style_items = [it for it in OLD["items"] if it.get("kind") == "style"]

# 工位顺序取 data.js
data = (ROOT / "site" / "assets" / "data.js").read_text(encoding="utf-8")
stations = []
for line in data.splitlines():
    if '"id": "' in line and '"no": "' in line:
        stations.append(line.split('"id": "')[1].split('"')[0])
if not stations:
    stations = ["paper", "hand", "ink", "vector", "screen", "space", "map", "other"]

items = []
for s in MAN["samples"]:
  sid = s["id"]
  media = ROOT / "site" / "media" / f"{sid}.mp4"
  if not media.exists():
      print("skip (无媒体)", sid)
      continue
  c = cat.get(sid, {})
  old = old_items.get(sid, {})
  items.append({
      "key": sid,
      "kind": "pipeline",
      "pipeline": sid,
      "title": old.get("title") or c.get("sample", {}).get("title") or s["name_zh"],
      "style": c.get("name_zh") or s["name_zh"],
      "style_en": c.get("name_en") or old.get("style_en", ""),
      "station": s["station"],
      "badge": "10 秒样片",
      "long_edge": 1024,
      "max_seconds": 10.0,
      "crf": 30,
      "seconds": 10.0,
      "duration": "0:10",
      "width": 1024,
      "height": 576,
      "aspect": "16:9",
      "clip_seconds": 10.0,
      "poster_pick": {"by": "fixed", "note": "取 3.2 秒处", "seconds": 3.2},
      "mp4": f"media/{sid}.mp4",
      "poster": f"media/{sid}.jpg",
      "source": f"samples-v2/{sid}-10s.mp4",
      "bytes": media.stat().st_size,
      "voice": s["voice"],
      "rate": s["rate"],
      "subtitle": s["subtitle"],
      "narration": s["narration"],
  })

order = {st: i for i, st in enumerate(stations)}
items.sort(key=lambda it: (order.get(it.get("station"), 99, )))

out = {
    "schema": OLD.get("schema", "auto-video/samples@1"),
    "clip_rule": {"start": 0, "seconds": 10, "note": "每条管线一支 10 秒样片，samples-v2 版"},
    "poster_rule": {"by": "fixed-3.2s", "note": "统一取第 3.2 秒画面作封面"},
    "generated_from": "D:\\@kaifa\\Auto-Video\\samples-v2",
    "items": items + style_items,
}
p = ROOT / "site" / "assets" / "samples.json"
p.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print("pipeline", len(items), "style", len(style_items), "->", p)

# 更新 data.js 的生成日期与统计
d = data.replace('"generated": "2026-11-15"', '"generated": "2026-11-18"')
(ROOT / "site" / "assets" / "data.js").write_text(d, encoding="utf-8")
print("data.js updated")

