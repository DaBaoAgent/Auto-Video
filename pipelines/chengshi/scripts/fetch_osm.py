# -*- coding: utf-8 -*-
"""从 OpenStreetMap Overpass 抓城市白模数据（建筑轮廓 / 道路 / 水系）。

用法：
    python chengshi/scripts/fetch_osm.py --project suzhou \
        --bbox 31.275,120.585,31.335,120.675 \
        --layers buildings,roads,water

产物（work/raw/）：
    buildings.json   way[building] 的完整几何
    roads.json       way[highway] 的道路中心线
    water.json       way[waterway] + way[natural=water] 的水系

说明：
- 中国大陆直连 Overpass 常被墙；默认读取 ALL_PROXY / HTTPS_PROXY 环境变量，
  也可显式 --proxy socks5h://127.0.0.1:15715。
- 大 bbox 一次抓会超时。fetch_osm.py 会按 0.05° 网格自动切片，逐片抓取并合并。
- 授权：© OpenStreetMap contributors（ODbL），成片字幕卡必须署名。
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Paths  # noqa: E402

API_MAP = "https://api.openstreetmap.org/api/0.6/map"
MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]

UA = "chengshi-pipeline/1.0 (Auto-Video; contact: dabao)"

QUERIES = {
    # building:levels / height 都要，用来还原楼高
    "buildings": '[out:json][timeout:{to}];way[building]({s},{w},{n},{e});out geom tags;',
    "roads": '[out:json][timeout:{to}];way[highway]({s},{w},{n},{e});out geom tags;',
    "water": ('[out:json][timeout:{to}];('
              'way[waterway]({s},{w},{n},{e});'
              'way[natural=water]({s},{w},{n},{e});'
              'way[landuse=reservoir]({s},{w},{n},{e});'
              ');out geom tags;'),
    "landuse": ('[out:json][timeout:{to}];('
                'way[landuse]({s},{w},{n},{e});'
                'way[leisure=park]({s},{w},{n},{e});'
                'way[leisure=garden]({s},{w},{n},{e});'
                'way[natural=wood]({s},{w},{n},{e});'
                'way[natural=scrub]({s},{w},{n},{e});'
                'way[natural=grassland]({s},{w},{n},{e});'
                'way[natural=wetland]({s},{w},{n},{e});'
                ');out geom tags;'),
}


def post(query: str, proxy: str | None, timeout: int = 240) -> dict:
    last = None
    for url in MIRRORS:
        cmd = ["curl", "-sS", "--max-time", str(timeout), "-A", UA,
               "--data-urlencode", f"data={query}", url]
        if proxy:
            cmd[1:1] = ["--proxy", proxy]
        # -sS + --data-urlencode 是 POST
        try:
            out = subprocess.run(cmd, capture_output=True, text=True,
                                 encoding="utf-8", timeout=timeout + 30)
        except subprocess.TimeoutExpired as e:
            last = f"{url} 超时：{e}"
            continue
        if out.returncode != 0:
            last = f"{url} curl 失败：{out.stderr.strip()[:200]}"
            continue
        text = out.stdout.strip()
        if not text.startswith("{"):
            last = f"{url} 返回非 JSON：{text[:160]}"
            continue
        data = json.loads(text)
        if "elements" not in data:
            last = f"{url} 缺 elements"
            continue
        return data
    raise SystemExit(f"Overpass 全部失败：{last}")


def tiles(s: float, w: float, n: float, e: float, step: float):
    lat = s
    while lat < n - 1e-9:
        lon = w
        lat2 = min(lat + step, n)
        while lon < e - 1e-9:
            lon2 = min(lon + step, e)
            yield lat, lon, lat2, lon2
            lon = lon2
        lat = lat2


def merge(parts: list[dict]) -> dict:
    seen = {}
    for d in parts:
        for el in d.get("elements", []):
            key = (el.get("type"), el.get("id"))
            seen[key] = el
    return {"version": 0.6, "generator": "fetch_osm merged", "elements": list(seen.values())}


def api_get(s: float, w: float, n: float, e: float, proxy: str | None,
            timeout: int) -> tuple[int, str]:
    """OSM 主 API /map?bbox=，返回 (http_status, xml)。"""
    url = f"{API_MAP}?bbox={w},{s},{e},{n}"
    cmd = ["curl", "-sS", "--max-time", str(timeout), "-A", UA, "-w", "\n%{http_code}", url]
    if proxy:
        cmd[1:1] = ["--proxy", proxy]
    out = subprocess.run(cmd, capture_output=True, text=True,
                         encoding="utf-8", errors="replace", timeout=timeout + 30)
    body, _, status = out.stdout.rpartition("\n")
    return int(status.strip() or 0), body


def merge_rings(segments: list[list]) -> list[list]:
    """把 multipolygon 的 outer way 首尾相接成闭合环。"""
    segs = [list(s) for s in segments if len(s) >= 2]
    rings = []
    while segs:
        cur = segs.pop(0)
        joined = True
        while joined and cur[0] != cur[-1]:
            joined = False
            for i, s in enumerate(segs):
                if s[0] == cur[-1]:
                    cur += s[1:]
                elif s[-1] == cur[-1]:
                    cur += list(reversed(s))[1:]
                elif s[-1] == cur[0]:
                    cur = s + cur[1:]
                elif s[0] == cur[0]:
                    cur = list(reversed(s)) + cur[1:]
                else:
                    continue
                segs.pop(i)
                joined = True
                break
        if len(cur) >= 4:
            rings.append(cur)
    return rings


def parse_osm_xml(xml_text: str) -> dict[str, list]:
    """OSM XML（/map 或 /relation/<id>/full）→ way/relation + geometry。"""
    root = ET.fromstring(xml_text)
    nodes = {}
    for nd in root.findall("node"):
        nodes[nd.get("id")] = (float(nd.get("lat")), float(nd.get("lon")))

    def way_geom(way):
        geom = []
        for nd in way.findall("nd"):
            p = nodes.get(nd.get("ref"))
            if p is None:
                return []
            geom.append({"lat": p[0], "lon": p[1]})
        return geom

    ways = {}
    buckets: dict[str, list] = {"buildings": [], "roads": [], "water": [], "landuse": []}
    green_landuse = {"forest", "grass", "meadow", "farmland", "orchard", "vineyard",
                     "village_green", "cemetery", "plant_nursery", "greenfield"}
    green_leisure = {"park", "garden", "pitch", "common", "village_green",
                     "nature_reserve", "golf_course"}
    for way in root.findall("way"):
        tags = {t.get("k"): t.get("v") for t in way.findall("tag")}
        geom = way_geom(way)
        ways[way.get("id")] = geom
        if len(geom) < 2:
            continue
        el = {"type": "way", "id": int(way.get("id")), "tags": tags, "geometry": geom}
        if "building" in tags:
            buckets["buildings"].append(el)
        if "highway" in tags:
            buckets["roads"].append(el)
        if ("waterway" in tags or tags.get("natural") == "water"
                or tags.get("landuse") == "reservoir"):
            buckets["water"].append(el)
        if (tags.get("landuse") in green_landuse
                or tags.get("leisure") in green_leisure
                or tags.get("natural") in {"wood", "scrub", "grassland",
                                           "wetland", "heath", "fell", "bare_rock"}):
            buckets["landuse"].append(el)

    # 大水面常是 multipolygon：标签在 relation 上，外环由多条 way 拼成
    for rel in root.findall("relation"):
        tags = {t.get("k"): t.get("v") for t in rel.findall("tag")}
        if not ("waterway" in tags or tags.get("natural") == "water"
                or tags.get("landuse") == "reservoir"):
            continue
        outer = [ways[m.get("ref")] for m in rel.findall("member")
                 if m.get("type") == "way" and m.get("role") in (None, "", "outer")
                 and m.get("ref") in ways]
        for ring in merge_rings([s for s in outer if s]):
            if len(ring) >= 4:
                buckets["water"].append({"type": "relation", "id": int(rel.get("id")),
                                         "tags": tags, "geometry": ring})
    return buckets


def parse_map(xml_text: str) -> dict[str, list]:
    return parse_osm_xml(xml_text)


def fetch_relations(ids: list[int], proxy: str | None, timeout: int) -> list:
    """/api/0.6/relation/<id>/full → 水面多边形（大湖/河的多重面）。"""
    out = []
    for rid in ids:
        url = f"https://api.openstreetmap.org/api/0.6/relation/{rid}/full"
        cmd = ["curl", "-sS", "--max-time", str(timeout), "-A", UA, url]
        if proxy:
            cmd[1:1] = ["--proxy", proxy]
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=timeout + 30)
        if r.returncode != 0 or not r.stdout.lstrip().startswith("<"):
            print(f"[relation {rid}] 失败：{r.stderr.strip()[:120]}", flush=True)
            continue
        water = parse_osm_xml(r.stdout)["water"]
        got = [el for el in water if el["type"] == "relation" and el["id"] == rid]
        out.extend(got)
        print(f"[relation {rid}] {len(got)} 个外环", flush=True)
    return out


def fetch_api(s: float, w: float, n: float, e: float, proxy: str | None,
              timeout: int, step: float, boxes) -> dict[str, list]:
    """主 API 逐瓦片抓取；单块过大/失败自动四分重试。"""
    acc: dict[str, list] = {"buildings": [], "roads": [], "water": [], "landuse": []}
    seen: set[int] = set()
    total = len(boxes)

    def one(s1, w1, n1, e1, i, depth):
        nonlocal total
        print(f"[api] {i}/{total} ({s1:.3f},{w1:.3f})-({n1:.3f},{e1:.3f})", flush=True)
        status, body = api_get(s1, w1, n1, e1, proxy, timeout)
        if status == 200 and body.lstrip().startswith("<"):
            try:
                b = parse_map(body)
            except ET.ParseError:
                b = None
            if b is not None:
                got = 0
                for layer, els in b.items():
                    for el in els:
                        if el["id"] not in seen:
                            seen.add(el["id"])
                            acc[layer].append(el)
                            got += 1
                print(f"       {got} 条", flush=True)
                time.sleep(0.4)
                return
        if depth >= 3:
            print(f"       放弃：http {status}", flush=True)
            return
        print(f"       http {status} → 四分重试", flush=True)
        ms, mw, mn, me = (s1 + n1) / 2, (w1 + e1) / 2, n1, e1
        total += 3
        time.sleep(1.5)
        for j, (a, b_, c, d) in enumerate([(s1, w1, ms, mw), (s1, mw, ms, e1),
                                           (ms, w1, n1, mw), (ms, mw, n1, e1)]):
            one(a, b_, c, d, f"{i}.{j + 1}", depth + 1)

    for i, (s1, w1, n1, e1) in enumerate(boxes, 1):
        one(s1, w1, n1, e1, str(i), 0)
    return acc


def main() -> None:
    ap = argparse.ArgumentParser(prog="fetch_osm")
    ap.add_argument("--project", required=True)
    ap.add_argument("--bbox", default="", help="南,西,北,东（纬度,经度）；仅 --relation-ids 时可不填")
    ap.add_argument("--layers", default="buildings", help="buildings,roads,water")
    ap.add_argument("--source", choices=["auto", "overpass", "api"], default="auto",
                    help="auto=先试 Overpass，不可用则退回 OSM 主 API 瓦片")
    ap.add_argument("--tile", type=float, default=None,
                    help="切片边长（度）；Overpass 默认 0.05，主 API 默认 0.01")
    ap.add_argument("--proxy", default=os.environ.get("ALL_PROXY") or os.environ.get("HTTPS_PROXY"))
    ap.add_argument("--timeout", type=int, default=180)
    ap.add_argument("--relation-ids", default="",
                    help="补抓 multipolygon 水面（relation id，逗号分隔），追加到 water.json")
    ap.add_argument("--merge", action="store_true",
                    help="与已有 raw/<layer>.json 合并（按 type+id 去重），用于扩 bbox 补抓")
    args = ap.parse_args()

    if not shutil.which("curl"):
        raise SystemExit("缺 curl；Windows 建议在 Git Bash 里跑，或把 curl 放进 PATH")

    P = Paths(args.project)
    P.mkdirs()

    if args.relation_ids:
        ids = [int(x) for x in args.relation_ids.split(",") if x.strip()]
        els = fetch_relations(ids, args.proxy, args.timeout)
        out = P.raw / "water.json"
        base = (json.loads(out.read_text(encoding="utf-8")) if out.exists()
                else {"version": 0.6, "elements": []})
        # 瓦片抓取时关系面只能拿到 bbox 内的一段外环（不闭环），这里整条替换
        index = {(e.get("type"), e.get("id")): i for i, e in enumerate(base["elements"])}
        added = replaced = 0
        for el in els:
            key = (el["type"], el["id"])
            if key in index:
                base["elements"][index[key]] = el
                replaced += 1
            else:
                base["elements"].append(el)
                index[key] = len(base["elements"]) - 1
                added += 1
        out.write_text(json.dumps(base, ensure_ascii=False), encoding="utf-8")
        print(f"→ water.json 关系水面：替换 {replaced} 条、新增 {added} 条（共 {len(base['elements'])} 条）")
        return

    if not args.bbox:
        raise SystemExit("非 --relation-ids 模式必须给 --bbox")
    s, w, n, e = [float(x) for x in args.bbox.split(",")]
    layers = [x.strip() for x in args.layers.split(",") if x.strip()]

    source = args.source
    if source == "auto":
        try:
            post(f"[out:json][timeout:20];way[building]({s},{w},{s + 0.002},{w + 0.002});out count;",
                 args.proxy, 40)
            source = "overpass"
        except SystemExit as ex:
            print(f"Overpass 不可用（{str(ex)[:120]}）", flush=True)
            source = "api"
        print(f"数据源：{source}", flush=True)

    if source == "api":
        step = args.tile or 0.01
        boxes = list(tiles(s, w, n, e, step))
        print(f"主 API 瓦片 {len(boxes)} 块（{step}°）", flush=True)
        acc = fetch_api(s, w, n, e, args.proxy, args.timeout, step, boxes)
        for layer in layers:
            els = acc.get(layer, [])
            out = P.raw / f"{layer}.json"
            if args.merge and out.exists():
                base = json.loads(out.read_text(encoding="utf-8"))
                seen = {(e.get("type"), e.get("id")) for e in base.get("elements", [])}
                added = 0
                for el in els:
                    key = (el.get("type"), el.get("id"))
                    if key not in seen:
                        base["elements"].append(el)
                        seen.add(key)
                        added += 1
                data = base
                print(f"→ {layer}: 新增 {added} 条，共 {len(data['elements'])} 条 → {out}", flush=True)
            else:
                data = {"version": 0.6, "generator": "osm-api tiled", "elements": els}
                print(f"→ {layer}: {len(els)} 条 → {out}", flush=True)
            out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        return

    step = args.tile or 0.05
    for layer in layers:
        tpl = QUERIES.get(layer)
        if not tpl:
            raise SystemExit(f"未知图层：{layer}")
        parts = []
        boxes = list(tiles(s, w, n, e, step))
        for i, (s1, w1, n1, e1) in enumerate(boxes, 1):
            q = tpl.format(s=s1, w=w1, n=n1, e=e1, to=args.timeout)
            print(f"[{layer}] {i}/{len(boxes)} ({s1:.3f},{w1:.3f})-({n1:.3f},{e1:.3f})", flush=True)
            d = post(q, args.proxy, args.timeout)
            print(f"          {len(d.get('elements', []))} 条", flush=True)
            parts.append(d)
            time.sleep(1.0)
        out = P.raw / f"{layer}.json"
        out.write_text(json.dumps(merge(parts), ensure_ascii=False), encoding="utf-8")
        print(f"→ {out}")


if __name__ == "__main__":
    main()
