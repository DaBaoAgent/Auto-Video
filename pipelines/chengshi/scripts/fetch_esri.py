# -*- coding: utf-8 -*-
"""抓 ESRI World Imagery 卫星瓦片并镶嵌（免费公开端点，无需 key）。

端点：https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
署名：Esri, Maxar, Earthstar Geographics, and the GIS User Community

产物（work/raw/）：
    esri_tiles/{z}/{x}/{y}.jpg     瓦片缓存（断点续抓）
    esri_z{z}.jpg                  整幅镶嵌（原生分辨率）
    esri_z{z}_8k.jpg               长边 8192 的运行时贴图
    esri_z{z}.json                 经纬范围 / 瓦片范围 / 署名

用法：
    python chengshi/scripts/fetch_esri.py --project suzhou --zoom 16 --workers 12
"""
from __future__ import annotations

import argparse
import math
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Paths, write_json  # noqa: E402

TILE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
UA = "chengshi-pipeline/1.0 (Auto-Video; contact: dabao)"
ATTRIBUTION = "Esri, Maxar, Earthstar Geographics, and the GIS User Community"


def lon_to_tile(lon: float, z: int) -> float:
    return (lon + 180.0) / 360.0 * (1 << z)


def lat_to_tile(lat: float, z: int) -> float:
    r = math.radians(lat)
    return (1.0 - math.asinh(math.tan(r)) / math.pi) / 2.0 * (1 << z)


def tile_to_lat(y: float, z: int) -> float:
    n = math.pi * (1.0 - 2.0 * y / (1 << z))
    return math.degrees(math.atan(math.sinh(n)))


def grab(cache: Path, z: int, x: int, y: int) -> tuple[int, int, int, str | None]:
    p = cache / str(z) / str(x) / f"{y}.jpg"
    if p.exists() and p.stat().st_size > 400:
        return x, y, p.stat().st_size, None
    p.parent.mkdir(parents=True, exist_ok=True)
    url = TILE.format(z=z, y=y, x=x)
    last = None
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=35) as r:
                b = r.read()
            if len(b) < 400 or not (b[:2] == b"\xff\xd8"):
                raise ValueError(f"bad body {len(b)}B")
            im = Image.open(__import__("io").BytesIO(b))
            if im.size != (256, 256):
                raise ValueError(f"bad size {im.size}")
            p.write_bytes(b)
            return x, y, len(b), None
        except Exception as ex:  # noqa: BLE001
            last = str(ex)
            time.sleep(min(12, 1.5 * (attempt + 1) ** 2))
    return x, y, 0, last


def main() -> None:
    ap = argparse.ArgumentParser(prog="fetch_esri")
    ap.add_argument("--project", required=True)
    ap.add_argument("--zoom", type=int, default=16)
    ap.add_argument("--pad", type=float, default=0.08, help="四周外扩（度），与 DEM 对齐")
    ap.add_argument("--bbox", default="", help="南,西,北,东；默认 film.data.bbox + pad")
    ap.add_argument("--workers", type=int, default=12)
    ap.add_argument("--mosaic-only", action="store_true", help="只重拼缓存，不下载")
    args = ap.parse_args()

    P = Paths(args.project)
    P.mkdirs()
    if args.bbox:
        s, w, n, e = [float(v) for v in args.bbox.split(",")]
    else:
        s, w, n, e = [float(v) for v in P.film["data"]["bbox"]]
        s, w, n, e = s - args.pad, w - args.pad, n + args.pad, e + args.pad

    z = args.zoom
    x0, x1 = int(lon_to_tile(w, z)), int(lon_to_tile(e, z))
    y0, y1 = int(lat_to_tile(n, z)), int(lat_to_tile(s, z))
    nx, ny = x1 - x0 + 1, y1 - y0 + 1
    total = nx * ny
    print(f"bbox {s:.4f},{w:.4f},{n:.4f},{e:.4f} z{z} → 瓦片 x {x0}-{x1} y {y0}-{y1}"
          f"（{nx}×{ny}={total} 块）", flush=True)
    cache = P.raw / "esri_tiles"

    jobs = [(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)]
    if not args.mosaic_only:
        done = 0
        failed: list[tuple[int, int, str]] = []
        lock = threading.Lock()
        t0 = time.time()
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futs = [pool.submit(grab, cache, z, x, y) for x, y in jobs]
            for f in as_completed(futs):
                x, y, size, err = f.result()
                with lock:
                    done += 1
                    if err:
                        failed.append((x, y, err))
                    if done % 100 == 0 or done == total:
                        el = time.time() - t0
                        rate = done / max(el, 1e-6)
                        eta = (total - done) / max(rate, 1e-6)
                        print(f"  {done}/{total}  {rate:.1f} 块/s  "
                              f"失败 {len(failed)}  剩余 ~{eta / 60:.1f} min", flush=True)
        if failed:
            print(f"失败 {len(failed)} 块，例：{failed[:3]}", flush=True)
    else:
        missing = [f"{x}/{y}" for x, y in jobs if not (cache / str(z) / str(x) / f"{y}.jpg").exists()]
        print(f"缓存缺失 {len(missing)} 块", flush=True)

    W, H = nx * 256, ny * 256
    print(f"镶嵌 {W}×{H}（{W * H / 1e6:.0f} MP），约 {W * H * 3 / 1e9:.2f} GB 内存", flush=True)
    mos = Image.new("RGB", (W, H), (0, 0, 0))
    blank = 0
    for j, y in enumerate(range(y0, y1 + 1)):
        for i, x in enumerate(range(x0, x1 + 1)):
            p = cache / str(z) / str(x) / f"{y}.jpg"
            if not p.exists():
                blank += 1
                continue
            try:
                with Image.open(p) as im:
                    mos.paste(im.convert("RGB"), (i * 256, j * 256))
            except Exception:  # noqa: BLE001
                blank += 1
    if blank:
        print(f"警告：{blank} 块缺失，已用黑块占位（可重跑补抓）", flush=True)

    out = P.raw / f"esri_z{z}.jpg"
    mos.save(out, quality=88, optimize=True)
    small = mos.copy()
    small.thumbnail((8192, 8192), Image.LANCZOS)
    small.save(P.raw / f"esri_z{z}_8k.jpg", quality=86, optimize=True)

    lon_l, lon_r = x0 / (1 << z) * 360.0 - 180.0, (x1 + 1) / (1 << z) * 360.0 - 180.0
    lat_t, lat_b = tile_to_lat(y0, z), tile_to_lat(y1 + 1, z)
    mid = (lat_t + lat_b) / 2
    mpp = 156543.03392 * math.cos(math.radians(mid)) / (1 << z)
    write_json(P.raw / f"esri_z{z}.json", {
        "service": "Esri World Imagery",
        "attribution": ATTRIBUTION,
        "zoom": z,
        "tile_range": [x0, x1, y0, y1],
        "mosaic_size": [W, H],
        "bbox_wgs84": [lat_b, lon_l, lat_t, lon_r],
        "meters_per_pixel": round(mpp, 3),
        "tiles_total": total,
        "tiles_missing": blank,
    })
    print(f"→ {out}（{out.stat().st_size / 1e6:.1f} MB）  {small.size} 运行时版", flush=True)
    print(f"经纬范围 {lat_b:.4f},{lon_l:.4f} – {lat_t:.4f},{lon_r:.4f}，{mpp:.2f} m/px", flush=True)


if __name__ == "__main__":
    main()
