"""把 114 条新管线的 10 秒样片压进演示站，并更新 samples.json。

来源：D:/tmp/samples10/<id>.mp4（77 lemo + 6 BB + 31 huashu）
输出：site/media/<id>.mp4 + <id>.jpg（长边 1024 / crf 30 / 前 10 秒）
其余 41 条旧样片保持原样，不动。
"""

from __future__ import annotations

import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from av import REPO, SITE_DIR  # noqa: E402
from build_samples import clip_job  # noqa: E402

SRC = Path(r"D:\tmp\samples10")

LEMO = [v["id"] for v in json.loads((HERE / "style_map.json").read_text(encoding="utf-8"))["styles"].values()]
HUASHU = [v["id"] for v in json.loads((HERE / "huashu_style_map.json").read_text(encoding="utf-8"))["styles"].values()
          if v.get("disposition") == "import"]
BB = ["liaotian", "keli", "andiao", "xuanyi", "oupu", "yugao"]

TITLES = {
    "liaotian": "敦煌第220窟 · 修复夜班",
    "keli": "青团 · 把春天包进糯米里",
    "andiao": "守灯人",
    "xuanyi": "第三只座钟",
    "oupu": "圆 · 呼吸",
    "yugao": "应龙",
}


def main() -> int:
    ids = LEMO + BB + HUASHU
    media = SITE_DIR / "media"
    media.mkdir(parents=True, exist_ok=True)

    def work(pid: str) -> tuple[str, dict]:
        src = SRC / f"{pid}.mp4"
        if not src.exists():
            raise FileNotFoundError(src)
        meta = clip_job(src, media / f"{pid}.mp4", media / f"{pid}.jpg",
                        1024, 10.0, 30, True)
        return pid, meta

    results: dict[str, dict] = {}
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(work, pid): pid for pid in ids}
        for n, fut in enumerate(as_completed(futs), 1):
            pid, meta = fut.result()
            results[pid] = meta
            print(f"{n:3d}/{len(ids)} {pid} {meta['seconds']}s {meta['width']}x{meta['height']}")

    manifest_path = SITE_DIR / "assets" / "samples.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    seen = set()
    for item in manifest["items"]:
        key = item.get("key")
        if key not in results:
            continue
        seen.add(key)
        meta = results[key]
        item.update(meta)
        item["badge"] = "10 秒样片"
        item["long_edge"] = 1024
        item["max_seconds"] = 10.0
        item["crf"] = 30
        item["mp4"] = f"media/{key}.mp4"
        item["poster"] = f"media/{key}.jpg"
        item["source"] = f"samples-v3/{key}-10s.mp4"
        item["bytes"] = (media / f"{key}.mp4").stat().st_size
        item["note"] = "Auto-Video 自研封装 10 秒样片"
        if key in TITLES:
            item["title"] = TITLES[key]
    missing = set(ids) - seen
    if missing:
        raise SystemExit("manifest 里缺少条目：" + "、".join(sorted(missing)))

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum((media / f"{pid}.mp4").stat().st_size for pid in ids) / 1024 / 1024
    print(f"完成 {len(ids)} 条，共 {total:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
