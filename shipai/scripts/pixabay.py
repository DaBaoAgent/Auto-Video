# -*- coding: utf-8 -*-
"""pixabay.py · 素材检索与下载（只做 shipai 用到的那两个动作）

- search：按关键词查 Pixabay 视频，打印候选（id / 时长 / 尺寸 / 标签），可选落盘 candidates.json
- download：按 id 取视频详情后下载大尺寸源文件；也可以 --query 自动取前 N 条

为什么不用 MoneyPrinterTurbo 自带的素材检索：
  MPT 由 LLM 从口播稿自动生成英文 keywords，命中的常常是雪山瀑布/海滩这类无关画面。
  shipai 的做法是「先搜、人眼挑、再按 id 下」，把素材这一步留给人判断。

注意：
  - Pixabay API 必须带浏览器 User-Agent，否则 403
  - 国内网络需要代理，默认读 SHIPAI_PROXY（例如 http://127.0.0.1:15715），不设则直连
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

API = "https://pixabay.com/api/videos/"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
SIZES = ("large", "medium", "small", "tiny")


def opener():
    proxy = os.environ.get("SHIPAI_PROXY") or os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    handlers = []
    if proxy:
        handlers.append(urllib.request.ProxyHandler({"http": proxy, "https": proxy}))
        print(f"[pixabay] 代理 {proxy}", file=sys.stderr)
    return urllib.request.build_opener(*handlers)


def api(params, key):
    params = dict(params, key=key)
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with opener().open(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def describe(hit):
    v = hit.get("videos", {})
    size = next((s for s in SIZES if v.get(s)), None)
    meta = v.get(size, {}) if size else {}
    return {
        "id": hit["id"],
        "seconds": hit.get("duration"),
        "size": f"{meta.get('width')}×{meta.get('height')}",
        "pages": hit.get("tags"),
        "url": meta.get("url"),
    }


def cmd_search(args):
    key = args.key or os.environ.get("PIXABAY_KEY")
    if not key:
        raise SystemExit("缺 Pixabay key：--key 或环境变量 PIXABAY_KEY")
    rows = []
    for q in [x.strip() for x in args.query.split("|") if x.strip()]:
        hit = api({"q": q, "per_page": args.per_page, "safesearch": "true",
                   "video_type": "all", "order": "popular"}, key)
        print(f"\n== {q}  命中 {hit.get('totalHits', 0)} ==")
        for h in hit.get("hits", []):
            d = describe(h)
            if args.min_seconds and (d["seconds"] or 0) < args.min_seconds:
                continue
            rows.append(dict(d, query=q))
            print(f"  {d['id']:>8}  {d['seconds']:>3}s  {d['size']:>10}  {d['pages']}")
    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(rows, f, ensure_ascii=False, indent=2)
        print(f"\n[pixabay] 候选 → {args.out}")
    return rows


def download_by_id(vid, key, out_dir):
    hit = api({"id": vid}, key)
    if not hit.get("hits"):
        print(f"  {vid}: 查不到", file=sys.stderr)
        return None
    h = hit["hits"][0]
    v = h.get("videos", {})
    size = next((s for s in SIZES if v.get(s)), None)
    if not size:
        print(f"  {vid}: 没有可下载尺寸", file=sys.stderr)
        return None
    url = v[size]["url"]
    path = os.path.join(out_dir, f"pixabay_{vid}.mp4")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        print(f"  {vid}: 已存在 {path}")
        return path
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with opener().open(req, timeout=120) as r, open(path, "wb") as f:
        while True:
            chunk = r.read(1 << 16)
            if not chunk:
                break
            f.write(chunk)
    print(f"  {vid}: {os.path.getsize(path) / 1e6:.1f} MB → {path}")
    return path


def cmd_download(args):
    key = args.key or os.environ.get("PIXABAY_KEY")
    if not key:
        raise SystemExit("缺 Pixabay key：--key 或环境变量 PIXABAY_KEY")
    os.makedirs(args.out, exist_ok=True)
    ids = [x.strip() for x in (args.ids or "").split(",") if x.strip()]
    if not ids:
        if not args.query:
            raise SystemExit("给 --ids 或 --query")
        for q in [x.strip() for x in args.query.split("|") if x.strip()]:
            hit = api({"q": q, "per_page": args.count, "safesearch": "true",
                       "video_type": "all", "order": "popular"}, key)
            for h in hit.get("hits", [])[: args.count]:
                ids.append(str(h["id"]))
            if len(ids) >= args.count:
                break
        ids = ids[: args.count]
    got = [download_by_id(i, key, args.out) for i in ids]
    got = [g for g in got if g]
    manifest = os.path.join(args.out, "materials.json")
    with open(manifest, "w", encoding="utf-8") as f:
        json.dump({"ids": ids, "files": [os.path.basename(g) for g in got]}, f,
                  ensure_ascii=False, indent=2)
    print(f"\n[pixabay] {len(got)} 条素材 → {args.out}（清单 {manifest}）")


def main():
    ap = argparse.ArgumentParser(description="Pixabay 素材检索/下载")
    sub = ap.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("search", help="按关键词列候选")
    s.add_argument("--query", required=True, help='关键词，多个用 | 分隔："mayan ruins|jungle temple"')
    s.add_argument("--per-page", type=int, default=8)
    s.add_argument("--min-seconds", type=float, default=0)
    s.add_argument("--out", default=None, help="候选 JSON 落盘路径")
    s.add_argument("--key", default=None)

    d = sub.add_parser("download", help="按 id 或关键词下载")
    d.add_argument("--ids", default=None, help="逗号分隔的 Pixabay 视频 id")
    d.add_argument("--query", default=None, help="没给 ids 时按关键词取前 N 条")
    d.add_argument("--count", type=int, default=5)
    d.add_argument("--out", required=True)
    d.add_argument("--key", default=None)

    args = ap.parse_args()
    cmd_search(args) if args.cmd == "search" else cmd_download(args)


if __name__ == "__main__":
    main()
