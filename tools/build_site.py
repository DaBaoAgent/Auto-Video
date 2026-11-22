"""把 catalog 与 samples.json 合成站点用的 assets/data.js。

站点不 fetch，直接读 window.AV，所以本地双击 index.html 也能看。

用法：
    python tools/build_site.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import (REPO, SITE_DIR, load_pipelines, load_stations, read_json,
                utf8_stdout)

REPO_URL = "https://github.com/DaBaoAgent/Auto-Video"
DOC_URL = REPO_URL + "/blob/main/pipelines/{id}/SKILL.md"


def stamp_index() -> None:
    """给 index.html 里的 assets/*.css|js 加 ?v=<内容哈希>，杜绝缓存旧文件。

    只改 href/src 属性；正文里 <code>assets/data.js</code> 这类说明文字保持干净。
    """
    import hashlib
    import re

    idx = SITE_DIR / "index.html"
    if not idx.exists():
        return
    html = idx.read_text(encoding="utf-8")
    # 先清掉上一轮误伤正文的指纹
    html = re.sub(r'<code>(assets/[^<\s]+?)\?v=[0-9a-f]+</code>', r'<code>\1</code>', html)
    for name in ("app.css", "data.js", "app.js"):
        f = SITE_DIR / "assets" / name
        if not f.exists():
            continue
        h = hashlib.sha1(f.read_bytes()).hexdigest()[:8]
        pat = re.compile(r'((?:href|src)="assets/' + re.escape(name) + r')(\?v=[0-9a-f]+)?(")')
        html = pat.sub(r'\1?v=' + h + r'\3', html)
    idx.write_text(html, encoding="utf-8", newline="\n")


def main() -> int:
    utf8_stdout()
    stations = load_stations()
    order = read_json(REPO / "catalog" / "stations.json")["stations"]
    pipelines = load_pipelines()

    samples_path = SITE_DIR / "assets" / "samples.json"
    samples = read_json(samples_path)["items"] if samples_path.exists() else []
    media = {s["key"]: s for s in samples}

    items = []
    for i, p in enumerate(pipelines, start=1):
        m = media.get(p["id"], {})
        items.append({
            "key": p["id"],
            "kind": "pipeline",
            "pipeline": p["id"],
            "station": p["station"],
            "station_name": stations[p["station"]]["name_zh"],
            "no": f"{i:02d}",
            "name_zh": p["name_zh"],
            "name_en": p["name_en"],
            # 卡片只显示管线名：样片名不再上卡（对齐「拼贴剪贴」这类无片名样片）；
            # 片名仍保留在 samples.json / catalog 里作档案与校验用。
            "title": "",
            "sample_title": m.get("display_title") or (p.get("sample") or {}).get("title", ""),
            "engine": p["engine"],
            "tagline": p["tagline"],
            "aspect": m.get("aspect") or p["aspect"] or "16:9",
            "seconds": m.get("seconds") or (p.get("sample") or {}).get("seconds"),
            "duration": m.get("duration") or "—",
            "clip": m.get("clip_seconds"),
            "mp4": m.get("mp4"),
            "poster": m.get("poster"),
            "note": None if m.get("display_title") and m.get("mp4") else p.get("sample_note"),
            "badge": (m.get("badge") if m.get("display_title") else None) or p["engine"],
            "doc": DOC_URL.format(id=p["id"]),
        })

    # 样片库模块已下线：风格样片（kind=style）不再进 data.js，
    # 站点只按工位展示管线卡。需要恢复时把下面这段取消注释即可。
    # for s in samples:
    #     if s["kind"] != "style":
    #         continue
    #     items.append({...})

    data = {
        "generated": read_json(REPO / "catalog" / "pipelines.json").get("updated", ""),
        "repo": REPO_URL,
        "stations": [
            {"id": st["id"], "no": st["no"], "name_zh": st["name_zh"],
             "name_en": st["name_en"], "blurb": st["blurb"], "line": st["line"]}
            for st in order
        ],
        "items": items,
    }

    out = SITE_DIR / "assets" / "data.js"
    out.parent.mkdir(parents=True, exist_ok=True)
    body = "window.AV = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n"
    out.write_text(body, encoding="utf-8", newline="\n")

    with_m = sum(1 for it in items if it["mp4"])

    # 静态资源加内容指纹：避免浏览器缓存旧 data.js / app.js（线上"没更新"的元凶）
    stamp_index()

    print(f"data.js：{len(data['stations'])} 工位 / {len(pipelines)} 管线 / {len(items)} 张卡（{with_m} 张有样片）")
    print(f"  {out.relative_to(REPO)}  {out.stat().st_size / 1024:.0f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
