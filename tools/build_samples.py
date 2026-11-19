"""把样片压成网页用的短片与封面，输出到 site/media/ 并写 manifest。

统一规则：**一律从片头开始，只取前 30 秒**（片短于 30 秒就整条）。
管线样片长边 1280 / crf 30，风格样片长边 640 / crf 32，用来在卡片上悬停即播。
原片一律不动，只读。

封面不抽固定片头帧：逐帧统计运动（YDIF）与边缘密度（edgedetect），排除白屏 / 黑场 /
空镜后取动作最丰富的一帧；对整片空镜、白屏、纯文字卡的样片，用
tools/poster_overrides.json 手工钉秒（优先于自动选帧）。改完用 --posters-only 只重出封面。

改了裁剪规则后必须带 --force 重切（输出比源文件新时默认会跳过）。

用法：
    python tools/build_samples.py
    python tools/build_samples.py --src "$SAMPLES_DIR" --force
    python tools/build_samples.py --posters-only
"""

from __future__ import annotations

import argparse
import json
import os
import statistics
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import (REPO, SITE_DIR, human_duration, load_pipelines, probe,
                run, utf8_stdout, write_json)

DEFAULT_SRC = Path(os.environ.get("SAMPLES_DIR") or (Path.home() / "Auto-Video-samples"))   # 用 $SAMPLES_DIR 指定
OVERRIDES = REPO / "tools" / "poster_overrides.json"


def load_poster_overrides() -> dict[str, dict]:
    """人工挑帧表：自动选帧对空镜 / 白屏 / 纯文字卡无效时，用它把 key 钉到某一秒。"""
    if not OVERRIDES.exists():
        return {}
    data = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    return {k: v for k, v in (data.get("by_key") or {}).items()
            if isinstance(v, dict) and v.get("seconds") is not None}



def _clip_stats(clip: Path, chain: str, tags: list[str]) -> list[dict]:
    """跑一遍 lavfi 统计，返回逐帧 [{pts_time, tag: value}]。失败返回空表。"""
    path = Path(clip).resolve().as_posix().replace(":", "\\:")
    expr = f"movie='{path}',{chain}"
    cp = run(["ffprobe", "-v", "error", "-f", "lavfi", "-i", expr,
              "-show_entries", "frame=pts_time:frame_tags=" + ",".join(tags),
              "-of", "json"], check=False)
    if cp.returncode != 0 or not cp.stdout.strip():
        return []
    try:
        return json.loads(cp.stdout).get("frames", [])
    except json.JSONDecodeError:
        return []


def _rolling(vals: list[float], w: int) -> list[float]:
    if w <= 1 or not vals:
        return list(vals)
    half = w // 2
    out = []
    for i in range(len(vals)):
        lo, hi = max(0, i - half), min(len(vals), i + half + 1)
        out.append(sum(vals[lo:hi]) / (hi - lo))
    return out


def _zscores(vals: list[float]) -> list[float]:
    if not vals:
        return []
    med = statistics.median(vals)
    dev = statistics.median([abs(v - med) for v in vals]) or 1e-6
    return [(v - med) / (1.4826 * dev) for v in vals]


def pick_poster(clip: Path, dur: float) -> tuple[float, dict]:
    """挑封面帧：动作最丰富、且不是白屏 / 空镜。

    - 动作：YDIF（与上一帧的亮度差）做 ±0.3 s 平滑，取局部持续运动而不是单帧抖动；
    - 空镜：edgedetect 后的边缘密度，低于全片 35% 分位的帧不选；
    - 白屏 / 黑场：YAVG > 205 且 SATAVG < 12，或 YAVG < 16，直接排除；
    - 首尾各 0.7 s 不选（避开片头字幕与结尾淡出）。
    返回 (时间秒, 依据)。挑不到就退回 2.0 s。
    """
    base = _clip_stats(clip, "signalstats",
                       ["lavfi.signalstats.YAVG", "lavfi.signalstats.YDIF",
                        "lavfi.signalstats.SATAVG"])
    edge = _clip_stats(clip, "edgedetect=low=0.08:high=0.24,signalstats",
                       ["lavfi.signalstats.YAVG"])
    if len(base) < 8 or len(edge) < 8:
        return min(2.0, max(0.0, dur - 0.2)), {"fallback": "stats-unavailable"}

    n = min(len(base), len(edge))
    ts, yavg, sat, motion, edg = [], [], [], [], []
    for i in range(n):
        tb = base[i].get("tags", {})
        te = edge[i].get("tags", {})
        ts.append(float(base[i].get("pts_time", 0.0)))
        yavg.append(float(tb.get("lavfi.signalstats.YAVG", 0.0)))
        sat.append(float(tb.get("lavfi.signalstats.SATAVG", 0.0)))
        motion.append(float(tb.get("lavfi.signalstats.YDIF", 0.0)))
        edg.append(float(te.get("lavfi.signalstats.YAVG", 0.0)))

    fps = n / max(dur, 0.1)
    smooth = _rolling(motion, max(3, int(round(fps * 0.6))))
    z_motion, z_edge = _zscores(smooth), _zscores(_rolling(edg, max(3, int(round(fps * 0.3)))))
    edge_floor = statistics.median(edg) * 0.35 if edg else 0.0

    best_i, best_score = -1, -1e9
    for i in range(n):
        if ts[i] < 0.7 or ts[i] > dur - 0.7:
            continue
        if yavg[i] > 205 and sat[i] < 12:      # 白屏 / 纯白闪帧
            continue
        if yavg[i] < 16:                        # 黑场
            continue
        if edg[i] < edge_floor:                 # 空镜 / 无内容
            continue
        score = 0.68 * z_motion[i] + 0.32 * z_edge[i]
        if score > best_score:
            best_i, best_score = i, score

    if best_i < 0:
        return min(2.0, max(0.0, dur - 0.2)), {"fallback": "no-valid-frame"}

    return round(ts[best_i], 2), {
        "score": round(best_score, 2),
        "motion": round(smooth[best_i], 2),
        "edge": round(edg[best_i], 1),
        "yavg": round(yavg[best_i], 1),
        "frames": n,
    }


def clip_job(src: Path, out_mp4: Path, out_jpg: Path, long_edge: int,
             max_seconds: float, crf: int, force: bool,
             posters_only: bool = False, override: dict | None = None) -> dict:
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

    poster_meta = {"fallback": "clip-missing"}
    if force or posters_only or not out_jpg.exists() or out_jpg.stat().st_mtime < src.stat().st_mtime:
        jw = long_edge if not portrait else max(360, int(long_edge * w / h))
        if override and override.get("seconds") is not None:
            t_pick = min(float(override["seconds"]), max(0.0, take - 0.2))
            poster_meta = {"by": "manual-override",
                           "note": override.get("note", "")}
        else:
            t_pick, poster_meta = pick_poster(out_mp4, take)
        run(["ffmpeg", "-v", "error", "-y",
             "-ss", f"{t_pick:.2f}", "-i", str(out_mp4),
             "-frames:v", "1", "-vf", f"scale={jw}:-2", "-q:v", "4",
             str(out_jpg)])
        poster_meta["seconds"] = t_pick

    return {
        "seconds": round(dur, 1),
        "duration": human_duration(dur),
        "width": w,
        "height": h,
        "aspect": "9:16" if portrait else ("4:3" if abs(w / h - 4 / 3) < 0.02 else "16:9"),
        "clip_seconds": round(take, 1),
        "poster_pick": poster_meta,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", default=str(DEFAULT_SRC))
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--posters-only", action="store_true", help="只重挑封面帧，不重切短片")
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()
    utf8_stdout()

    src = Path(args.src)
    if not src.is_dir():
        sys.exit(f"样片目录不存在：{src}")

    media = SITE_DIR / "media"
    media.mkdir(parents=True, exist_ok=True)

    pipelines = load_pipelines()
    overrides = load_poster_overrides()
    if overrides:
        print(f"人工挑帧覆盖 {len(overrides)} 条（tools/poster_overrides.json）")
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
    bb = src / "模板库"
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
                        j["max_seconds"], j["crf"], args.force,
                        posters_only=args.posters_only,
                        override=overrides.get(j["key"]))
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
        "poster_rule": {
            "by": "max-motion+edge",
            "note": "逐帧统计 YDIF（运动）与 edgedetect 边缘密度，排除白屏 / 黑场 / 空镜后取动作最丰富的一帧；首尾各 0.7 秒不选",
            "overrides": "tools/poster_overrides.json，人工挑帧优先于自动选帧",
        },
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
