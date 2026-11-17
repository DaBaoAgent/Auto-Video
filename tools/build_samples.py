"""把样片压成网页用的短片与封面，输出到 site/media/ 并写 manifest。

统一规则：**一律从片头开始，只取前 30 秒**（片短于 30 秒就整条）。
管线样片长边 1280 / crf 30，风格样片长边 640 / crf 32，用来在卡片上悬停即播。
原片一律不动，只读。

改了裁剪规则后必须带 --force 重切（输出比源文件新时默认会跳过）。

用法：
    python tools/build_samples.py
    python tools/build_samples.py --src "D:\\BaiduSyncdisk\\@同步\\1 MG 动画\\管线样片" --force
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import (REPO, SITE_DIR, human_duration, load_pipelines, probe,
                run, utf8_stdout, write_json)

DEFAULT_SRC = Path(r"D:\BaiduSyncdisk\@同步\1 MG 动画\管线样片")


def clip_job(src: Path, out_mp4: Path, out_jpg: Path, long_edge: int,
             max_seconds: float, crf: int, force: bool) -> dict:
    info = probe(src)
    dur = float(info["format"]["duration"])
    w = h = 0
    for s in info.get("streams", []):
        if s.get("codec_type") == "video":
            w, h = s.get("width", 0), s.get("height", 0)
            break
    if not w or not h:
        raise RuntimeError(f"没有视频流：{src}")

    portrait = h > w
    if portrait:
        scale = f"scale=-2:{long_edge}"
    else:
        scale = f"scale={long_edge}:-2"

    take = min(max_seconds, dur)
    start = 0.0  # 统一从片头取，不做 12% 起切

    if force or not out_mp4.exists() or out_mp4.stat().st_mtime < src.stat().st_mtime:
        run(["ffmpeg", "-v", "error", "-y",
             "-ss", f"{start:.3f}", "-i", str(src), "-t", f"{take:.3f}",
             "-vf", f"{scale},fps=30",
             "-c:v", "libx264", "-crf", str(crf), "-preset", "veryfast",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart",
             "-c:a", "aac", "-b:a", "96k", "-ac", "2",
             str(out_mp4)])

    if force or not out_jpg.exists() or out_jpg.stat().st_mtime < src.stat().st_mtime:
        jw = long_edge if not portrait else max(360, int(long_edge * w / h))
        run(["ffmpeg", "-v", "error", "-y",
             "-ss", f"{min(2.0, max(0.0, dur - 0.2)):.3f}", "-i", str(src),
             "-frames:v", "1", "-vf", f"scale={jw}:-2", "-q:v", "4",
             str(out_jpg)])

    return {
        "seconds": round(dur, 1),
        "duration": human_duration(dur),
        "width": w,
        "height": h,
        "aspect": "9:16" if portrait else ("4:3" if abs(w / h - 4 / 3) < 0.02 else "16:9"),
        "clip_seconds": round(take, 1),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(DEFAULT_SRC))
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()
    utf8_stdout()

    src = Path(args.src)
    if not src.is_dir():
        sys.exit(f"样片目录不存在：{src}")

    media = SITE_DIR / "media"
    media.mkdir(parents=True, exist_ok=True)

    pipelines = load_pipelines()
    jobs: list[dict] = []

    # 管线样片
    used = set()
    for p in pipelines:
        s = p.get("sample")
        if not s:
            continue
        f = src / s["file"]
        if not f.exists():
            print(f"MISS  {p['id']}: {s['file']}")
            continue
        used.add(s["file"].lower())
        jobs.append({
            "key": p["id"], "kind": "pipeline", "pipeline": p["id"],
            "title": s["title"], "style": p["name_zh"], "style_en": p["name_en"],
            "station": p["station"], "src": f,
            "long_edge": 1280, "max_seconds": 30.0, "crf": 30,
        })

    # 风格样片库：源目录里剩下的
    extras = []
    for f in sorted(src.glob("*.mp4")):
        if f.name.lower() not in used:
            extras.append(f)
    bb = src / "BB-Video"
    if bb.is_dir():
        extras.extend(sorted(bb.glob("*.mp4")))

    for i, f in enumerate(extras, start=1):
        stem = f.stem
        jobs.append({
            "key": f"style-{i:02d}", "kind": "style", "pipeline": None,
            "title": stem, "style": stem, "style_en": "",
            "station": None, "src": f,
            "long_edge": 640, "max_seconds": 30.0, "crf": 32,
        })

    print(f"管线样片 {sum(1 for j in jobs if j['kind']=='pipeline')} 条 / 风格样片 {len(extras)} 条，共 {len(jobs)} 条")

    results = []
    failures = []

    def work(j):
        out_mp4 = media / f"{j['key']}.mp4"
        out_jpg = media / f"{j['key']}.jpg"
        meta = clip_job(j["src"], out_mp4, out_jpg, j["long_edge"],
                        j["max_seconds"], j["crf"], args.force)
        return {**{k: v for k, v in j.items() if k != "src"},
                **meta,
                "mp4": f"media/{j['key']}.mp4",
                "poster": f"media/{j['key']}.jpg",
                "source": j["src"].name,
                "bytes": out_mp4.stat().st_size}

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(work, j): j for j in jobs}
        for n, fut in enumerate(as_completed(futs), start=1):
            j = futs[fut]
            try:
                results.append(fut.result())
            except Exception as exc:
                failures.append(f"{j['key']} ({j['src'].name}): {exc}")
                print(f"FAIL {j['key']}: {exc}")
            if n % 10 == 0 or n == len(jobs):
                print(f"  {n}/{len(jobs)}")

    order = {p["id"]: i for i, p in enumerate(pipelines)}
    results.sort(key=lambda r: (order.get(r["pipeline"], 10_000), r["key"]))
    manifest = {
        "schema": "auto-video/samples@1",
        "clip_rule": {"start": 0, "seconds": 30, "note": "统一从片头取前 30 秒；短片整条保留"},
        "generated_from": str(src),
        "items": results,
    }
    write_json(SITE_DIR / "assets" / "samples.json", manifest)

    total = sum(r["bytes"] for r in results) / 1024 / 1024
    print(f"\n完成 {len(results)} 条，共 {total:.1f} MB，manifest → site/assets/samples.json")
    if failures:
        print(f"失败 {len(failures)} 条：")
        for f in failures:
            print("  - " + f)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
