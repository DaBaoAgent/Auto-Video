# -*- coding: utf-8 -*-
"""把 ESRI 镶嵌降采样成运行时贴图，并写经纬范围元数据。

产物（work/public/data/，供 Remotion staticFile 读）：
    satellite.jpg    长边 <= --max（默认 8192）
    satellite.json   bbox_wgs84 [lat_b, lon_l, lat_t, lon_r] / 贴图尺寸 / 来源

用法：
    python chengshi/scripts/prep_satellite.py --project suzhou
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import Paths, write_json  # noqa: E402

Image.MAX_IMAGE_PIXELS = None


def main() -> None:
    ap = argparse.ArgumentParser(prog="prep_satellite")
    ap.add_argument("--project", required=True)
    ap.add_argument("--zoom", type=int, default=16)
    ap.add_argument("--max", type=int, default=8192, help="贴图长边上限")
    ap.add_argument("--quality", type=int, default=86)
    args = ap.parse_args()

    P = Paths(args.project)
    meta = json.loads((P.raw / f"esri_z{args.zoom}.json").read_text(encoding="utf-8"))
    im = Image.open(P.raw / f"esri_z{args.zoom}.jpg").convert("RGB")
    before = im.size
    im.thumbnail((args.max, args.max), Image.LANCZOS)

    P.public.mkdir(parents=True, exist_ok=True)
    out = P.public / "satellite.jpg"
    im.save(out, quality=args.quality, optimize=True, progressive=True)
    write_json(P.public / "satellite.json", {
        "source": meta["service"],
        "attribution": meta["attribution"],
        "zoom": meta["zoom"],
        "bbox_wgs84": meta["bbox_wgs84"],
        "size": list(im.size),
        "mosaic_size": meta["mosaic_size"],
        "meters_per_pixel": meta["meters_per_pixel"],
        "tiles_missing": meta.get("tiles_missing", 0),
    })
    print(f"→ {out}  {before[0]}×{before[1]} → {im.size[0]}×{im.size[1]}  "
          f"{out.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
