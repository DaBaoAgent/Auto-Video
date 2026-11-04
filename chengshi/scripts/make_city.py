# -*- coding: utf-8 -*-
"""新城市一键出片：抓数据 → 建白模 → 配音 → 混音 → 1080p 成片。

前置：项目已用 chengshi.py new 建好，并写好 data/ 下的
rings / timeline / captions / landmarks / voiceover（tags 可选）。

用法：
    python chengshi/scripts/make_city.py --project chengdu
    python chengshi/scripts/make_city.py --project chengdu --skip-fetch   # 数据已抓过
    python chengshi/scripts/make_city.py --project chengdu --skip-tts     # 已有人声

数据已存在默认跳过抓取；--force-fetch 强制重抓。所有阶段可单独跳过，便于断点续跑。
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # Auto-Video/
SCRIPTS = ROOT / "chengshi" / "scripts"
PY = sys.executable
LAYERS = ("buildings", "roads", "water", "landuse")


def run(step: str, argv: list[str], dry: bool) -> None:
    cmd = [PY, str(SCRIPTS / step), *argv]
    print(f"\n=== {step} ===", flush=True)
    print("$ " + " ".join(cmd), flush=True)
    if dry:
        return
    env = dict(os.environ)
    env.setdefault("PYTHONIOENCODING", "utf-8")
    subprocess.run(cmd, cwd=ROOT, check=True, env=env)


def main() -> None:
    ap = argparse.ArgumentParser(prog="make_city", description="新城市一键出片")
    ap.add_argument("--project", required=True)
    ap.add_argument("--skip-fetch", action="store_true")
    ap.add_argument("--force-fetch", action="store_true")
    ap.add_argument("--skip-tts", action="store_true")
    ap.add_argument("--skip-audio", action="store_true", help="不重新混音（沿用已有 mix.m4a）")
    ap.add_argument("--skip-render", action="store_true", help="只准备数据与音轨")
    ap.add_argument("--voice-dir", type=Path, default=None)
    ap.add_argument("--esri-zoom", type=int, default=16)
    ap.add_argument("--dem-zoom", type=int, default=13)
    ap.add_argument("--concurrency", type=int, default=2)
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--frames", default=None)
    ap.add_argument("--scale", type=float, default=None)
    ap.add_argument("--allow-4k", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--keep-bundle", action="store_true")
    ap.add_argument("--keep-render", action="store_true")
    ap.add_argument("--no-limit", action="store_true")
    ap.add_argument("--no-remux", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    proj = ROOT / "projects" / args.project
    film_path = proj / "film.json"
    if not film_path.exists():
        raise SystemExit(f"缺 {film_path}；先跑 chengshi.py new --project {args.project}")
    film = json.loads(film_path.read_text(encoding="utf-8-sig"))
    data_dir = proj / "data"
    for name in ("rings.json", "timeline.json", "captions.json"):
        if not (data_dir / name).exists():
            raise SystemExit(f"缺 {data_dir / name}")
    if not (data_dir / "landmarks.json").exists():
        print(f"注意：缺 {data_dir / 'landmarks.json'}，将不画地标光圈/标签")
    if not args.skip_audio and not (data_dir / "voiceover.json").exists():
        raise SystemExit(f"缺 {data_dir / 'voiceover.json'}（或加 --skip-audio）")

    raw = proj / "work" / "raw"
    bbox = ",".join(str(x) for x in film["data"]["bbox"])

    if not args.skip_fetch:
        missing = [n for n in LAYERS if args.force_fetch or not (raw / f"{n}.json").exists()]
        if missing:
            run("fetch_osm.py", ["--project", args.project, "--bbox", bbox,
                                 "--layers", ",".join(missing)], args.dry_run)
        if args.force_fetch or not (raw / "dem.json").exists():
            run("fetch_dem.py", ["--project", args.project, "--zoom", str(args.dem_zoom)],
                args.dry_run)
        if args.force_fetch or not (raw / f"esri_z{args.esri_zoom}.jpg").exists():
            run("fetch_esri.py", ["--project", args.project, "--zoom", str(args.esri_zoom)],
                args.dry_run)
        run("prep_satellite.py", ["--project", args.project, "--zoom", str(args.esri_zoom)],
            args.dry_run)

    run("build_city.py", ["--project", args.project], args.dry_run)

    voice_args = ["--voice-dir", str(args.voice_dir)] if args.voice_dir else []
    if not args.skip_audio:
        if not args.skip_tts:
            run("tts_voice.py", ["--project", args.project, *voice_args], args.dry_run)
        run("mix_audio.py", ["--project", args.project, *voice_args], args.dry_run)

    if not args.skip_render:
        comp = "Chengshi" if args.allow_4k else "ChengshiReview"
        render = ["--project", args.project, "--composition", comp,
                  "--concurrency", str(args.concurrency), "--crf", str(args.crf)]
        if args.out:
            render += ["--out", str(args.out)]
        if args.frames:
            render += ["--frames", args.frames]
        if args.scale:
            render += ["--scale", str(args.scale)]
        for flag, on in (("--allow-4k", args.allow_4k), ("--force", args.force),
                         ("--keep-bundle", args.keep_bundle), ("--keep-render", args.keep_render),
                         ("--no-limit", args.no_limit), ("--no-remux", args.no_remux),
                         ("--dry-run", args.dry_run)):
            if on:
                render.append(flag)
        run("render_cut.py", render, False)

    print("\n[DONE] 管线结束", flush=True)


if __name__ == "__main__":
    main()
