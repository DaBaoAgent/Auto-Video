"""取 lemo-opuscar 风格的 720p 网络样片，供演示站临时使用。

为什么不下进仓库：这些是上游发的网络版（`lemomo-ai/lemo-opuscar-films`），
仓库只认 `site/media/` 里的 30 秒短片，原片一律留在本机缓存目录。

用法：
    python tools/fetch_lemo_samples.py --out "D:/@kaifa/lemo-film-cache"
    python tools/fetch_lemo_samples.py --out ... --only muke,boli
"""

from __future__ import annotations

import argparse
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import load_pipelines, utf8_stdout

BASE = "https://lemomo-ai.github.io/lemo-opuscar-films/"


def fetch(url: str, dst: Path, retries: int = 3) -> int:
    """流式下载到临时文件再改名，避免半截文件被当成完整样片。"""
    tmp = dst.with_suffix(dst.suffix + ".part")
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Auto-Video/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r, open(tmp, "wb") as f:
                while True:
                    chunk = r.read(1 << 16)
                    if not chunk:
                        break
                    f.write(chunk)
            size = tmp.stat().st_size
            if size < 1024:
                raise RuntimeError(f"只有 {size} 字节，不是片子")
            tmp.replace(dst)
            return size
        except (urllib.error.URLError, RuntimeError, TimeoutError) as exc:
            if attempt == retries:
                tmp.unlink(missing_ok=True)
                raise RuntimeError(f"{url} 第 {attempt} 次失败：{exc}") from exc
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True, help="本机缓存目录（不要放仓库里）")
    ap.add_argument("--only", default="", help="只取这几个管线 id，逗号分隔")
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    utf8_stdout()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    only = {s.strip() for s in args.only.split(",") if s.strip()}

    jobs = []
    for p in load_pipelines():
        slug = p.get("lemo_style")
        sample = p.get("sample")
        if not slug or not sample:
            continue
        if only and p["id"] not in only:
            continue
        dst = out / sample["file"]
        if dst.exists() and not args.force and dst.stat().st_size > 1024:
            continue
        jobs.append((p["id"], slug, dst, f"{BASE}{slug}.mp4"))

    if not jobs:
        print("没有要取的东西（都已存在）")
        return 0

    print(f"要取 {len(jobs)} 条 → {out}")
    ok, bad = 0, []
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(fetch, url, dst): (pid, dst) for pid, _slug, dst, url in jobs}
        for n, fut in enumerate(as_completed(futs), start=1):
            pid, dst = futs[fut]
            try:
                size = fut.result()
                ok += 1
                print(f"  [{n}/{len(jobs)}] {dst.name} {size / 1048576:.1f} MB")
            except Exception as exc:
                bad.append(f"{pid}: {exc}")
                print(f"  [{n}/{len(jobs)}] FAIL {pid}: {exc}")

    print(f"\n完成 {ok} 条，失败 {len(bad)} 条")
    for b in bad:
        print("  - " + b)
    return 0 if not bad else 1


if __name__ == "__main__":
    raise SystemExit(main())
