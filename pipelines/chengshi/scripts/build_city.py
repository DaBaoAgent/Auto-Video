# -*- coding: utf-8 -*-
"""把 Overpass 原始数据压成白模渲染器要的 city.json / rings.json。

- 建筑：多边形 → 最小外接矩形（PCA 定向），带楼高与「生长年份」
- 生长年份：落在哪一圈年轮内就取哪一圈的年份（示意；OSM 没有建成年份）
- 道路：按等级分类 + Douglas-Peucker 抽稀
- 水系：水面多边形 + 河道中心线
- 坐标系：以 bbox 中心为原点的米制局部坐标，x 向东，z 向南（北在上）

用法：
    python chengshi/scripts/build_city.py --project suzhou
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Paths, write_json  # noqa: E402

MAJOR = {"motorway", "trunk", "primary", "secondary", "tertiary",
         "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link"}
MINOR = {"residential", "unclassified", "service", "living_street",
         "pedestrian", "road"}
DEFAULT_HEIGHT = 9.0
TREES_MAX = 20000


def project_points(geom, origin, coslat):
    """支持两种输入：OSM 几何 [{"lon","lat"}] 和 rings.json 的 [lon, lat]。"""
    ox, oy = origin
    out = []
    for p in geom:
        lon, lat = (p["lon"], p["lat"]) if isinstance(p, dict) else (p[0], p[1])
        out.append(((lon - ox) * 111320.0 * coslat, -(lat - oy) * 110540.0))
    return out


def shoelace(pts) -> float:
    if len(pts) < 3:
        return 0.0
    x = np.array([p[0] for p in pts])
    z = np.array([p[1] for p in pts])
    return float(abs(np.dot(x, np.roll(z, -1)) - np.dot(z, np.roll(x, -1))) / 2.0)


def obb(pts):
    """PCA 定向最小外接矩形 → (cx, cz, len, wid, angle_deg)。"""
    P = np.asarray(pts, dtype=np.float64)
    if len(P) < 3:
        return None
    mean = P.mean(axis=0)
    C = np.cov((P - mean).T)
    w, v = np.linalg.eigh(C)
    axis = v[:, int(np.argmax(w))]
    ang = math.atan2(axis[1], axis[0])
    c, s = math.cos(ang), math.sin(ang)
    R = np.array([[c, s], [-s, c]])
    Q = (P - mean) @ R.T
    mn, mx = Q.min(axis=0), Q.max(axis=0)
    center = R.T @ ((mn + mx) / 2.0) + mean
    ln, wd = float(mx[0] - mn[0]), float(mx[1] - mn[1])
    if ln < wd:
        ln, wd = wd, ln
        ang += math.pi / 2
    deg = math.degrees(ang)
    while deg > 90:
        deg -= 180
    while deg < -90:
        deg += 180
    return float(center[0]), float(center[1]), ln, wd, deg


def clip_rect(pts, xmin: float, xmax: float, zmin: float, zmax: float):
    """Sutherland–Hodgman：把多边形裁到矩形内（太湖等超大水面会伸到 80km 外）。"""
    def edge(p, inside, inter):
        out = []
        n = len(p)
        for i in range(n):
            a, b = p[i], p[(i + 1) % n]
            ia, ib = inside(a), inside(b)
            if ia:
                out.append(a)
                if not ib:
                    out.append(inter(a, b))
            elif ib:
                out.append(inter(a, b))
        return out

    def cut_x(a, b, x):
        t = (x - a[0]) / ((b[0] - a[0]) or 1e-12)
        return (x, a[1] + t * (b[1] - a[1]))

    def cut_z(a, b, z):
        t = (z - a[1]) / ((b[1] - a[1]) or 1e-12)
        return (a[0] + t * (b[0] - a[0]), z)

    p = list(pts)
    for inside, inter in (
        (lambda q: q[0] >= xmin, lambda a, b: cut_x(a, b, xmin)),
        (lambda q: q[0] <= xmax, lambda a, b: cut_x(a, b, xmax)),
        (lambda q: q[1] >= zmin, lambda a, b: cut_z(a, b, zmin)),
        (lambda q: q[1] <= zmax, lambda a, b: cut_z(a, b, zmax)),
    ):
        p = edge(p, inside, inter)
        if len(p) < 3:
            return []
    return p


def point_in_poly(x: float, z: float, poly) -> bool:
    inside = False
    n = len(poly)
    for i in range(n):
        x1, z1 = poly[i]
        x2, z2 = poly[(i + 1) % n]
        if (z1 > z) != (z2 > z):
            xin = (x2 - x1) * (z - z1) / (z2 - z1 + 1e-12) + x1
            if x < xin:
                inside = not inside
    return inside


def classify_green(tags: dict):
    """OSM 绿地标签 → 写实底图配色类别；不属于绿地返回 None。"""
    nat = tags.get("natural")
    lu = tags.get("landuse")
    le = tags.get("leisure")
    if nat == "wood" or lu == "forest":
        return "forest"
    if nat in ("scrub", "heath"):
        return "scrub"
    if nat == "wetland":
        return "wetland"
    if lu in ("farmland", "orchard", "vineyard", "plant_nursery", "greenfield"):
        return "farm"
    if lu in ("grass", "meadow", "village_green") or nat == "grassland":
        return "grass"
    if le in ("park", "garden", "golf_course", "common", "nature_reserve"):
        return "park"
    if lu == "cemetery":
        return "cemetery"
    return None


def parse_height(tags: dict) -> float:
    h = tags.get("height")
    if h:
        try:
            return float(str(h).replace("m", "").replace("米", "").strip())
        except ValueError:
            pass
    lvl = tags.get("building:levels")
    if lvl:
        try:
            return float(lvl) * 3.2 + 1.5
        except ValueError:
            pass
    return DEFAULT_HEIGHT


def rdp(pts, eps: float):
    if len(pts) < 3:
        return pts
    x = np.array([p[0] for p in pts])
    z = np.array([p[1] for p in pts])
    keep = np.zeros(len(pts), dtype=bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        ax, az, bx, bz = x[i], z[i], x[j], z[j]
        dx, dz = bx - ax, bz - az
        den = math.hypot(dx, dz) or 1e-9
        d = np.abs((x[i + 1:j] - ax) * dz - (z[i + 1:j] - az) * dx) / den
        k = int(np.argmax(d))
        if d[k] > eps:
            m = i + 1 + k
            keep[m] = True
            stack.append((i, m))
            stack.append((m, j))
    return [pts[i] for i in np.nonzero(keep)[0]]


def load_raw(path: Path) -> list:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8")).get("elements", [])


def main() -> None:
    ap = argparse.ArgumentParser(prog="build_city")
    ap.add_argument("--project", required=True)
    ap.add_argument("--road-eps", type=float, default=2.5)
    args = ap.parse_args()

    P = Paths(args.project)
    film = P.film
    bbox = film["data"]["bbox"]                     # [south, west, north, east]
    s, w, n, e = bbox
    # 投影原点可固定（film.data.origin=[lon,lat]），扩数据范围时不挪动机位与标签
    oc = film["data"].get("origin")
    ox, oy = (float(oc[0]), float(oc[1])) if oc else ((w + e) / 2.0, (s + n) / 2.0)
    coslat = math.cos(math.radians(oy))
    origin = (ox, oy)
    default_year = int(film["data"].get("default_year", 2020))
    # 数据矩形（米制）：水面/绿地在边界处裁剪，太湖关系面能伸到 80km 外
    clip_x0 = (w - ox) * 111320.0 * coslat
    clip_x1 = (e - ox) * 111320.0 * coslat
    clip_z0 = -(n - oy) * 110540.0
    clip_z1 = -(s - oy) * 110540.0

    # ---------------- 地形（AWS terrain tiles 转成的经纬网格） ----------------
    terrain = None
    dem_src = P.raw / "dem.json"
    if dem_src.exists():
        dem = json.loads(dem_src.read_text(encoding="utf-8"))
        terrain = {
            "x0": round((dem["lon0"] - ox) * 111320.0 * coslat, 1),
            "z0": round(-(dem["lat0"] - oy) * 110540.0, 1),
            "dx": round(dem["dlon"] * 111320.0 * coslat, 3),
            "dz": round(dem["dlat"] * 110540.0, 3),
            "nx": int(dem["nx"]),
            "nz": int(dem["nz"]),
            "h": [int(h) for h in dem["heights"]],
        }
        # 水面/绿地裁到地形网格边界（比数据 bbox 外扩过），避免湖岸出现一条直线切边
        clip_x0 = terrain["x0"]
        clip_x1 = terrain["x0"] + (terrain["nx"] - 1) * terrain["dx"]
        clip_z0 = terrain["z0"]
        clip_z1 = terrain["z0"] + (terrain["nz"] - 1) * terrain["dz"]

    # 年轮环：项目里的 rings.json 用 lon/lat 写，这里转成本地米制坐标
    rings_src = P.data_dir / "rings.json"
    rings = json.loads(rings_src.read_text(encoding="utf-8-sig")) if rings_src.exists() else []
    for r in rings:
        r["polygon"] = project_points(r["polygon"], origin, coslat)
        r["area"] = shoelace(r["polygon"])
    rings_by_area = sorted(rings, key=lambda r: r["area"])

    # 每个圈层的「生长年份区间」：圈内建筑在 [start, end] 内确定性铺开，
    # 城市才会在整条时间轴上长出来，而不是到某一年整片同时弹出。
    timeline_src = P.data_dir / "timeline.json"
    end_year = default_year
    if timeline_src.exists():
        tl = json.loads(timeline_src.read_text(encoding="utf-8-sig"))
        eras = tl.get("eras") or []
        if eras:
            end_year = int(eras[-1].get("year", default_year))
    spans = {}
    for i, r in enumerate(rings_by_area):
        g = r.get("growth")
        start = int(g[0]) if g else int(r.get("assign_year", default_year))
        nxt = rings_by_area[i + 1] if i + 1 < len(rings_by_area) else None
        if g and len(g) > 1:
            end = int(g[1])
        elif nxt is not None:
            ng = nxt.get("growth")
            end = int(ng[0]) if ng else int(nxt.get("assign_year", end_year))
        else:
            end = end_year
        spans[r["id"]] = (start, max(start + 1, end))
    outside_start = max((v[1] for v in spans.values()), default=end_year - 10)
    outside_span = (outside_start, max(outside_start + 1, end_year))
    g_out = film["data"].get("growth_outside")     # 中环外（园区等）的生长区间
    if g_out:
        outside_span = (int(g_out[0]), max(int(g_out[0]) + 1, int(g_out[1])))

    # ---------------- 建筑 ----------------
    buildings = []
    for el in load_raw(P.raw / "buildings.json"):
        geom = el.get("geometry")
        tags = el.get("tags") or {}
        if not geom or len(geom) < 4:
            continue
        pts = project_points(geom, origin, coslat)
        area = shoelace(pts)
        if area < 10.0 or area > 2_000_000:
            continue
        box = obb(pts)
        if not box:
            continue
        cx, cz, ln, wd, ang = box
        if ln > 900 or wd > 900:
            continue
        h = parse_height(tags)
        if not (2.0 <= h <= 600.0):
            h = DEFAULT_HEIGHT
        span, zone = outside_span, -1
        for r in rings_by_area:                      # 小圈优先
            if point_in_poly(cx, cz, r["polygon"]):
                span = spans[r["id"]]
                zone = rings.index(r)
                break
        # 用坐标哈希做确定性铺开（OSM 没有建成年份，这里只求生长节奏自然）
        hf = (abs(int(round(cx))) * 73856093 ^ abs(int(round(cz))) * 19349663) % 10007
        year = round(span[0] + (span[1] - span[0]) * hf / 10006.0)
        buildings.append([round(cx, 1), round(cz, 1), round(ln, 1), round(wd, 1),
                          round(ang, 1), round(h, 1), int(year), int(zone)])

    # ---------------- 道路 ----------------
    roads = []
    for el in load_raw(P.raw / "roads.json"):
        geom = el.get("geometry")
        tags = el.get("tags") or {}
        if not geom or len(geom) < 2:
            continue
        hw = tags.get("highway", "")
        if hw in MAJOR:
            kind = 1
        elif hw in MINOR:
            kind = 2
        else:
            continue
        pts = rdp(project_points(geom, origin, coslat), args.road_eps)
        if len(pts) < 2:
            continue
        roads.append({"k": kind, "p": [[round(x, 1), round(z, 1)] for x, z in pts]})

    # ---------------- 水系 ----------------
    water, waterways = [], []
    for el in load_raw(P.raw / "water.json"):
        geom = el.get("geometry")
        tags = el.get("tags") or {}
        if not geom or len(geom) < 2:
            continue
        pts = project_points(geom, origin, coslat)
        if tags.get("natural") == "water" or tags.get("landuse") == "reservoir":
            poly = clip_rect(pts, clip_x0, clip_x1, clip_z0, clip_z1)
            if len(poly) >= 3 and shoelace(poly) > 400:
                water.append([[round(x, 1), round(z, 1)] for x, z in poly])
        elif tags.get("waterway"):
            pts2 = rdp(pts, 3.0)
            waterways.append([[round(x, 1), round(z, 1)] for x, z in pts2])

    # ---------------- 绿地 / 林地 / 农田（写实底图） ----------------
    landuse = []
    tree_pts = []
    tree_polys = []        # (kind, area, pts)：撒树前按面积排序，大山大林优先
    for el in load_raw(P.raw / "landuse.json"):
        geom = el.get("geometry")
        tags = el.get("tags") or {}
        if not geom or len(geom) < 4:
            continue
        kind = classify_green(tags)
        if not kind:
            continue
        pts = clip_rect(project_points(geom, origin, coslat),
                        clip_x0, clip_x1, clip_z0, clip_z1)
        if len(pts) < 3:
            continue
        area = shoelace(pts)
        if area < 60.0 or area > 5e7:
            continue
        # OSM 面要素首尾点重合，rdp 的基线会退化为零长度而把整圈丢掉
        open_pts = pts[:-1] if math.hypot(pts[0][0] - pts[-1][0], pts[0][1] - pts[-1][1]) < 1.0 else pts
        ring = rdp(open_pts, 4.0)
        if len(ring) < 3:
            continue
        landuse.append({"t": kind, "p": [[round(x, 1), round(z, 1)] for x, z in ring]})
        if kind in ("forest", "park") and area >= 1500:
            tree_polys.append((kind, area, pts))

    # 林地/公园里铺树（示意；OSM 没有单株树）
    for kind, _area, pts in sorted(tree_polys, key=lambda x: -x[1]):
        if len(tree_pts) >= TREES_MAX:
            break
        spacing = 26.0 if kind == "forest" else 42.0
        xs0 = [p[0] for p in pts]
        zs0 = [p[1] for p in pts]
        xa, xb, za, zb = min(xs0), max(xs0), min(zs0), max(zs0)
        gy = za + spacing / 2
        while gy < zb and len(tree_pts) < TREES_MAX:
            gx = xa + spacing / 2
            while gx < xb and len(tree_pts) < TREES_MAX:
                jx = ((int(gx * 7) ^ int(gy * 13)) % 100) / 100.0
                jz = ((int(gx * 11) ^ int(gy * 5)) % 100) / 100.0
                px = gx + (jx - 0.5) * spacing
                pz = gy + (jz - 0.5) * spacing
                if point_in_poly(px, pz, pts):
                    sc = 4.2 + jx * 4.8
                    tree_pts.append([round(px, 1), round(pz, 1), round(sc, 1)])
                gx += spacing
            gy += spacing

    city = {
        "origin": [ox, oy],
        "count": len(buildings),
        "buildings": buildings,
        "roads": roads,
        "water": water,
        "waterways": waterways,
        "landuse": landuse,
        "trees": tree_pts,
        "defaultYear": default_year,
    }
    xs = [b[0] for b in buildings] or [0]
    zs = [b[1] for b in buildings] or [0]
    for poly in water:
        xs.extend(p[0] for p in poly)
        zs.extend(p[1] for p in poly)
    for lu in landuse:
        xs.extend(p[0] for p in lu["p"])
        zs.extend(p[1] for p in lu["p"])
    # 地形与地面底板要盖住整个地形网格
    xs.extend((clip_x0, clip_x1))
    zs.extend((clip_z0, clip_z1))
    city["bbox"] = [min(xs), min(zs), max(xs), max(zs)]

    write_json(P.public / "city.json", city)
    write_json(P.public / "rings.json", rings)
    if terrain:
        write_json(P.public / "terrain.json", terrain)
        hi = [h for h in terrain["h"] if h > 60]
        print(f"地形 {terrain['nx']}×{terrain['nz']}，最高 {max(terrain['h'])} 米，60 米以上像元 {len(hi)}")
    print(f"建筑 {len(buildings)} / 道路 {len(roads)} / 水面 {len(water)} / 河道 {len(waterways)}"
          f" / 绿地 {len(landuse)} / 树 {len(tree_pts)}")
    print(f"→ {P.public / 'city.json'} ({(P.public / 'city.json').stat().st_size/1e6:.1f} MB)")

    # 时间轴 / 字幕 / 标签 / 地标 / 影片参数原样进 public
    for name in ("timeline.json", "captions.json", "tags.json", "landmarks.json"):
        src = P.data_dir / name
        if src.exists():
            (P.public / name).write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    write_json(P.public / "film.json", film)


if __name__ == "__main__":
    main()
