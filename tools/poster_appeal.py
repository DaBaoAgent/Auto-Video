# -*- coding: utf-8 -*-
"""重挑站点封面：在画面"成型"的后 45%~90% 里找信息最密、色彩最好的一帧。

与 build_samples.pick_poster 的区别：不追动作峰值（动作峰值常落在变形中段/半张脸），
改追"完成度"——边缘密度（细节）、饱和度（色彩）、亮度居中（不惨白不死黑）。
人工钉帧 tools/poster_overrides.json 仍然优先。
"""
from __future__ import annotations

import json, os, statistics, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SITE = REPO / "site"
SAMPLES = SITE / "assets" / "samples.json"
OVERRIDES = REPO / "tools" / "poster_overrides.json"


def run(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)


def stats(clip: Path, chain: str, tags: list[str]) -> list[dict]:
    path = Path(clip).resolve().as_posix().replace(":", "\\:")
    expr = f"movie='{path}',{chain}"
    cp = run(["ffprobe", "-v", "error", "-f", "lavfi", "-i", expr,
              "-show_entries", "frame=pts_time:frame_tags=" + ",".join(tags), "-of", "json"])
    if cp.returncode != 0 or not cp.stdout.strip():
        return []
    try:
        return json.loads(cp.stdout.decode("utf-8", "ignore")).get("frames", [])
    except json.JSONDecodeError:
        return []


def rolling(v, w):
    if w <= 1:
        return list(v)
    h = w // 2
    return [sum(v[max(0, i - h):min(len(v), i + h + 1)]) / len(v[max(0, i - h):min(len(v), i + h + 1)])
            for i in range(len(v))]


def zs(v):
    med = statistics.median(v)
    dev = statistics.median([abs(x - med) for x in v]) or 1e-6
    return [(x - med) / (1.4826 * dev) for x in v]


def pick(clip: Path, dur: float):
    base = stats(clip, "signalstats", ["lavfi.signalstats.YAVG", "lavfi.signalstats.SATAVG"])
    edge = stats(clip, "edgedetect=low=0.08:high=0.22,signalstats", ["lavfi.signalstats.YAVG"])
    if len(base) < 10 or len(edge) < 10:
        return None, None
    n = min(len(base), len(edge))
    ts = [float(base[i]["pts_time"]) for i in range(n)]
    yavg = [float(base[i]["tags"].get("lavfi.signalstats.YAVG", 0)) for i in range(n)]
    sat = [float(base[i]["tags"].get("lavfi.signalstats.SATAVG", 0)) for i in range(n)]
    edg = [float(edge[i]["tags"].get("lavfi.signalstats.YAVG", 0)) for i in range(n)]
    fps = n / max(dur, 0.1)
    edg_s = rolling(edg, max(3, int(round(fps * 0.4))))
    sat_s = rolling(sat, max(3, int(round(fps * 0.4))))
    z_edge, z_sat = zs(edg_s), zs(sat_s)
    med_edge = statistics.median(edg)
    best = None
    for i in range(n):
        t = ts[i]
        if t < dur * 0.45 or t > dur * 0.90:
            continue
        if yavg[i] > 232 or yavg[i] < 20:
            continue
        if edg[i] < med_edge * 0.75:
            continue
        # 亮度居中加分：70~190 最讨喜
        light = 1.0 - min(abs(yavg[i] - 128) / 128.0, 1.0)
        score = 0.52 * z_edge[i] + 0.30 * z_sat[i] + 0.18 * light
        if best is None or score > best[0]:
            best = (score, t, dict(score=round(score, 2), edge=round(edg[i], 1),
                                   sat=round(sat[i], 1), yavg=round(yavg[i], 1)))
    if best is None:
        return None, None
    return round(best[1], 2), best[2]


def grab(mp4: Path, out: Path, t: float, w: int, h: int):
    if h > w:
        vf = f"scale=-2:{max(360, int(1024 * w / h))}"
    else:
        vf = "scale=1024:-2"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(mp4),
         "-frames:v", "1", "-vf", vf, "-q:v", "4", str(out)])


def main():
    only = sys.argv[1:] or None
    data = json.loads(SAMPLES.read_text(encoding="utf-8"))
    items = data["items"]
    ov = {}
    if OVERRIDES.exists():
        ov = {k: v for k, v in (json.loads(OVERRIDES.read_text(encoding="utf-8")).get("by_key") or {}).items()
              if isinstance(v, dict) and v.get("seconds") is not None}
    jobs = []
    for it in items:
        if only and it["key"] not in only:
            continue
        if not it.get("mp4"):
            continue
        if it["key"] in ov:
            continue
        jobs.append(it)
    print(f"待挑 {len(jobs)} 条（人工钉帧跳过 {len(ov)} 条）")

    def work(it):
        mp4 = SITE / it["mp4"].replace("/", os.sep)
        jpg = SITE / it["poster"].replace("/", os.sep)
        dur = it.get("clip_seconds") or it.get("seconds") or 10.0
        t, meta = pick(mp4, float(dur))
        if t is None:
            # 全片后段都被判定为死黑/惨白：退到 70% 处
            t, meta = round(float(dur) * 0.7, 2), {"fallback": "no-valid-frame"}
        grab(mp4, jpg, t, it["width"], it["height"])
        it["poster_pick"] = {"by": "appeal-complete", **meta, "seconds": t}
        return it["key"], t, round(meta.get("score", 0), 2)

    with ThreadPoolExecutor(max_workers=6) as ex:
        res = list(ex.map(work, jobs))
    for r in res[:8]:
        print("pick", r)
    SAMPLES.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    print("written", SAMPLES)


if __name__ == "__main__":
    main()
