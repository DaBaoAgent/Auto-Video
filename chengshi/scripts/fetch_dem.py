# -*- coding: utf-8 -*-
"""下载 SRTM/地形瓦片（AWS Terrain Tiles, terrarium 编码）并重采样成经纬网格。

数据源：https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png
编码：elevation = R*256 + G + B/256 - 32768（米）

产物（work/raw/）：
    dem.json   {lon0, lat0, dlon, dlat, nx, nz, heights:[int 米]}
               行序从北(bbox.n)往南(bbox.s)，列从西往东。

用法：
    python chengshi/scripts/fetch_dem.py --project suzhou --zoom 13 --step 0.0007
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Paths, write_json  # noqa: E402

TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
UA = "chengshi-pipeline/1.0 (Auto-Video; contact: dabao)"


def lon_to_px(lon, z: int):
    return (np.asarray(lon) + 180.0) / 360.0 * (256 * (1 << z))


def lat_to_px(lat, z: int):
    r = np.radians(lat)
    return (1.0 - np.arcsinh(np.tan(r)) / np.pi) / 2.0 * (256 * (1 << z))


def fetch_tile(cache: Path, z: int, x: int, y: int) -> np.ndarray | None:
    p = cache / str(z) / str(x) / f"{y}.png"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        url = TILE_URL.format(z=z, x=x, y=y)
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as r:
                    p.write_bytes(r.read())
                break
            except Exception as ex:  # noqa: BLE001
                if attempt == 2:
                    print(f"[tile {z}/{x}/{y}] 失败：{ex}", flush=True)
                    return None
    img = np.asarray(Image.open(p).convert("RGB"), dtype=np.float64)
    return img[:, :, 0] * 256.0 + img[:, :, 1] + img[:, :, 2] / 256.0 - 32768.0


def main() -> None:
    ap = argparse.ArgumentParser(prog="fetch_dem")
    ap.add_argument("--project", required=True)
    ap.add_argument("--zoom", type=int, default=13)
    ap.add_argument("--step", type=float, default=0.0007, help="网格步长（度）")
    ap.add_argument("--pad", type=float, default=0.08,
                    help="四周外扩（度）；广角机位不能看到地形边缘")
    args = ap.parse_args()

    P = Paths(args.project)
    s, w, n, e = [float(x) for x in P.film["data"]["bbox"]]
    s, w, n, e = s - args.pad, w - args.pad, n + args.pad, e + args.pad
    z = args.zoom
    cache = P.raw / "dem_tiles"

    gx_w, gx_e = lon_to_px(w, z), lon_to_px(e, z)
    gy_n, gy_s = lat_to_px(n, z), lat_to_px(s, z)
    tx0, tx1 = int(gx_w // 256), int(gx_e // 256)
    ty0, ty1 = int(gy_n // 256), int(gy_s // 256)
    print(f"bbox {s},{w},{n},{e} → 瓦片 x {tx0}-{tx1} y {ty0}-{ty1}"
          f"（{(tx1 - tx0 + 1) * (ty1 - ty0 + 1)} 块，z{z}）", flush=True)

    mos = np.full(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.nan)
    ok = 0
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            h = fetch_tile(cache, z, tx, ty)
            if h is None:
                continue
            r0 = (ty - ty0) * 256
            c0 = (tx - tx0) * 256
            mos[r0:r0 + 256, c0:c0 + 256] = h
            ok += 1
    if ok == 0:
        raise SystemExit("所有地形瓦片都下载失败")
    print(f"瓦片成功 {ok} 块，镶嵌尺寸 {mos.shape}", flush=True)
    mos = np.nan_to_num(mos, nan=0.0)

    nx = int(round((e - w) / args.step)) + 1
    nz = int(round((n - s) / args.step)) + 1
    lons = w + np.arange(nx) * args.step
    lats = n - np.arange(nz) * args.step

    fx = lon_to_px(lons, z) - tx0 * 256
    fy = lat_to_px(lats, z) - ty0 * 256
    H = mos.shape[0]
    W = mos.shape[1]
    x1 = np.clip(np.floor(fx).astype(int), 0, W - 2)
    y1 = np.clip(np.floor(fy).astype(int), 0, H - 2)
    ax = np.clip(fx - x1, 0, 1)
    ay = np.clip(fy - y1, 0, 1)
    rows = []
    for j, (yy, wy) in enumerate(zip(y1, ay)):
        top = mos[yy][x1] * (1 - ax) + mos[yy][x1 + 1] * ax
        bot = mos[yy + 1][x1] * (1 - ax) + mos[yy + 1][x1 + 1] * ax
        rows.append(top * (1 - wy) + bot * wy)
    heights = np.rint(np.vstack(rows))
    # 太湖水面约 2m、平原在 0–5m；SRTM 的负值和 nodata 都归零，避免出现低于湖面的坑
    heights = np.clip(heights, 0, 2000).astype(int)

    out = {
        "lon0": w, "lat0": n, "dlon": args.step, "dlat": args.step,
        "nx": int(nx), "nz": int(nz),
        "heights": heights.reshape(-1).tolist(),
    }
    write_json(P.raw / "dem.json", out)
    hi = heights > 60
    print(f"地形网格 {nx}×{nz}，高程 {heights.min()}–{heights.max()} 米，"
          f"60 米以上像元 {hi.mean() * 100:.1f}%", flush=True)
    print(f"→ {P.raw / 'dem.json'}", flush=True)


if __name__ == "__main__":
    main()
