# -*- coding: utf-8 -*-
"""10 秒新样片 · 配音批量合成（edge-tts，并发 2）。

用法：
    python samples-v2/make_tts.py                # 全量
    python samples-v2/make_tts.py --only pencil,manga
    python samples-v2/make_tts.py --force        # 已存在也重做

产物：
    samples-v2/audio/<id>.mp3     edge-tts 原始
    samples-v2/audio/<id>.wav     48 kHz 单声道，给各管线
    samples-v2/audio/durations.json
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "manifest.json"
AUDIO = ROOT / "audio"
CJK = re.compile(r"[\u4e00-\u9fff]")

CONCURRENCY = 2
RETRIES = 3


def ffmpeg() -> str:
    exe = os.environ.get("FFMPEG_PATH") or shutil.which("ffmpeg")
    if not exe:
        sys.exit("找不到 ffmpeg：设 FFMPEG_PATH 或加进 PATH")
    return exe


def ffprobe() -> str:
    exe = os.environ.get("FFPROBE_PATH") or shutil.which("ffprobe")
    if not exe:
        sys.exit("找不到 ffprobe：设 FFPROBE_PATH 或加进 PATH")
    return exe


def load() -> list[dict]:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))["samples"]


async def synth(item: dict, sem: asyncio.Semaphore, force: bool) -> dict:
    import edge_tts

    mp3 = AUDIO / f"{item['id']}.mp3"
    wav = AUDIO / f"{item['id']}.wav"
    async with sem:
        if not force and wav.exists():
            return {"id": item["id"], "status": "skip"}
        last = ""
        for attempt in range(1, RETRIES + 1):
            try:
                rate = item.get("rate", "+0%")
                if rate.endswith("%") and not rate[0] in "+-":
                    rate = "+" + rate
                com = edge_tts.Communicate(item["narration"], item["voice"], rate=rate)
                await com.save(str(mp3))
                if mp3.stat().st_size > 2000:
                    break
                last = "输出过小"
            except Exception as exc:  # noqa: BLE001
                last = f"{type(exc).__name__}: {exc}"
            await asyncio.sleep(1.5 * attempt)
        else:
            return {"id": item["id"], "status": "fail", "error": last}

        subprocess.run(
            [ffmpeg(), "-y", "-v", "error", "-i", str(mp3),
             "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(wav)],
            check=True,
        )
        out = subprocess.run(
            [ffprobe(), "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(wav)],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return {"id": item["id"], "status": "ok", "seconds": round(float(out), 3)}


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    AUDIO.mkdir(parents=True, exist_ok=True)
    items = load()
    if args.only:
        want = {s.strip() for s in args.only.split(",") if s.strip()}
        items = [i for i in items if i["id"] in want]
        missing = want - {i["id"] for i in items}
        if missing:
            sys.exit("清单里没有：" + ",".join(sorted(missing)))

    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*(synth(i, sem, args.force) for i in items))

    rows = []
    for item, res in zip(items, results):
        n = len(CJK.findall(item["narration"]))
        if res["status"] == "ok":
            sec = res["seconds"]
            rows.append({"id": item["id"], "chars": n, "seconds": sec,
                         "voice": item["voice"], "rate": item.get("rate", "0%"),
                         "cps": round(n / sec, 2) if sec else None})
            print(f"{item['id']:<14} {n:>3}字 {sec:>6.2f}s  {item['voice']:<22} {item.get('rate','0%')}")
        elif res["status"] == "skip":
            print(f"{item['id']:<14} 已存在，跳过")
        else:
            print(f"{item['id']:<14} 失败：{res.get('error')}")

    prev = {}
    dpath = AUDIO / "durations.json"
    if dpath.exists():
        try:
            prev = json.loads(dpath.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            prev = {}
    merged = {**{k: v for k, v in prev.items() if k not in {r["id"] for r in rows}}, **{r["id"]: r for r in rows}}
    dpath.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")

    over = [r for r in rows if r["seconds"] > 9.4]
    print("\n超过 9.4 s 需要调语速：", over or "无")


if __name__ == "__main__":
    asyncio.run(main())
