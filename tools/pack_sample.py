#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""演示站样片固化：一条命令把母版打成站点样片，并同步三处标题 + 站点数据。

用法（在仓库根目录）：
    python tools/pack_sample.py --key wenyi \
        --master "review/wenyi_master_v7.mp4" \
        --title "午后的银杯" --poster 3.9 \
        --tagline "十秒横摇穿过文艺复兴长厅：窗边猫、举银杯的少女、画案上校比例的学者。"

加 --push 会顺带 commit / push / 等 Pages 部署 / 校验线上标题。

固化要点（别再手改散落字段）：
  1. 卡片上不显示样片名：站点所有卡只显示管线名（对齐「拼贴剪贴」），
     --title 只写进档案字段（samples.json.display_title / sample.title），
     片名取 4–6 字裸片名，不带管线名、不带"·"。
  2. 标题三处必须一致：samples.json.display_title、
     catalog/pipelines.json.sample.title、pipelines/<key>/pipeline.json.sample.title
     —— 后两处相等是 tools/validate.py 的硬门禁。
  3. 站点版规格：长边 1024（1024×576）、30fps、CRF30、无音轨、faststart、≤10s。
  4. 只改本地不等于上线：站点由 GitHub Pages 在 push main 后构建。
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = ROOT / "site" / "assets" / "samples.json"
CATALOG = ROOT / "catalog" / "pipelines.json"
SITE_MEDIA = ROOT / "site" / "media"


def sh(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=ROOT, check=False, text=True, **kw)


def need(tool: str) -> str:
    p = shutil.which(tool)
    if not p:
        sys.exit(f"缺少 {tool}，先装好 ffmpeg 再跑")
    return p


def probe(path: Path) -> dict:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate,nb_frames",
         "-show_entries", "format=duration,size", "-of", "json", str(path)],
        cwd=ROOT, capture_output=True, text=True, check=True)
    j = json.loads(out.stdout)
    st = j["streams"][0]
    return {
        "width": int(st["width"]), "height": int(st["height"]),
        "fps": st.get("r_frame_rate"), "frames": st.get("nb_frames"),
        "seconds": round(float(j["format"]["duration"]), 3),
        "bytes": int(j["format"]["size"]),
    }


def read(p: Path) -> dict:
    return json.loads(p.read_text(encoding="utf-8"))


def write(p: Path, d: dict) -> None:
    p.write_text(json.dumps(d, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def set_titles(key: str, title: str, seconds: float) -> None:
    """标题三处同步；pipeline.json 只改 sample 里的 title/seconds，不动 file。"""
    s = read(SAMPLES)
    for it in s["items"]:
        if it.get("key") == key:
            it["display_title"] = title
            it["title"] = title
    write(SAMPLES, s)

    c = read(CATALOG)
    for it in c["pipelines"]:
        if it.get("id") == key and isinstance(it.get("sample"), dict):
            it["sample"]["title"] = title
            it["sample"]["seconds"] = seconds
    write(CATALOG, c)

    pj = ROOT / "pipelines" / key / "pipeline.json"
    d = read(pj)

    def walk(o):
        if isinstance(o, dict):
            if isinstance(o.get("sample"), dict) and "title" in o["sample"]:
                o["sample"]["title"] = title
                o["sample"]["seconds"] = seconds
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(d)
    write(pj, d)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", required=True)
    ap.add_argument("--master", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--poster", type=float, default=None, help="封面钉秒")
    ap.add_argument("--tagline", default=None)
    ap.add_argument("--push", action="store_true")
    a = ap.parse_args()

    master = (ROOT / a.master).resolve()
    if not master.exists():
        sys.exit(f"母版不存在：{master}")
    need("ffmpeg"); need("ffprobe")

    src = probe(master)
    if src["height"] >= src["width"]:
        sys.exit(f"母版要是 16:9 横版，现在 {src['width']}×{src['height']}")
    if src["seconds"] > 10.5:
        sys.exit(f"母版 {src['seconds']}s 超过 10 秒档，先剪到 10s")

    out_dir = ROOT / "samples-v3"
    out_dir.mkdir(exist_ok=True)
    clip = out_dir / f"{a.key}-10s.mp4"

    sh(["ffmpeg", "-y", "-loglevel", "error", "-i", str(master),
        "-vf", "scale=1024:576:flags=lanczos,fps=30",
        "-c:v", "libx264", "-crf", "30", "-preset", "veryfast",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(clip)])

    SITE_MEDIA.mkdir(parents=True, exist_ok=True)
    site_mp4 = SITE_MEDIA / f"{a.key}.mp4"
    shutil.copyfile(clip, site_mp4)

    if a.poster is not None:
        sh(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{a.poster:g}", "-i", str(clip),
            "-frames:v", "1", "-q:v", "6", str(SITE_MEDIA / f"{a.key}.jpg")])

    info = probe(site_mp4)
    s = read(SAMPLES)
    for it in s["items"]:
        if it.get("key") == a.key:
            it["display_title"] = a.title
            it["title"] = a.title
            it["badge"] = "10 秒样片"
            it["mp4"] = f"media/{a.key}.mp4"
            it["poster"] = f"media/{a.key}.jpg"
            it["source"] = f"samples-v3/{a.key}-10s.mp4"
            it["bytes"] = info["bytes"]
            it["width"] = info["width"]
            it["height"] = info["height"]
            it["seconds"] = round(info["seconds"], 1)
            it["clip_seconds"] = round(info["seconds"], 1)
            it["max_seconds"] = 10.0
            it["long_edge"] = 1024
            it["crf"] = 30
            if a.poster is not None:
                it["poster_pick"] = {"by": "manual", "seconds": a.poster, "edge": 0, "sat": 0,
                                     "yavg": 0, "score": 0, "note": "pack_sample 钉秒"}
    write(SAMPLES, s)

    set_titles(a.key, a.title, round(info["seconds"], 1))

    if a.tagline:
        c = read(CATALOG)
        for it in c["pipelines"]:
            if it.get("id") == a.key:
                it["tagline"] = a.tagline
        write(CATALOG, c)

    if sh([sys.executable, "tools/build_site.py"]).returncode:
        sys.exit("build_site 失败")
    if sh([sys.executable, "tools/validate.py"]).returncode:
        sys.exit("validate 失败，别提交")

    print(f"\n固化完成：{a.key} → 《{a.title}》 {info['width']}×{info['height']} "
          f"{info['seconds']}s {info['bytes']}B")

    if a.push:
        files = ["site/assets/samples.json", "site/assets/data.js",
                 f"site/media/{a.key}.mp4", f"site/media/{a.key}.jpg",
                 "catalog/pipelines.json", f"pipelines/{a.key}/pipeline.json"]
        ex = [f for f in files if (ROOT / f).exists()]
        sh(["git", "add", *ex])
        sh(["git", "commit", "-m",
            f"samples: {a.key} 样片固化《{a.title}》10 秒站点版 + 标题三处同步"])
        sh(["git", "push", "origin", "main"])
        print("已推送；等 Pages 构建后核对线上 assets/data.js 里的 title。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
