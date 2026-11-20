# -*- coding: utf-8 -*-
"""Demo-site sample audit: per-item frame metrics + poster duplicate scan."""
import argparse
import json
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from itertools import combinations

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
OUT = os.path.join(ROOT, "review", "audit")
os.makedirs(OUT, exist_ok=True)


def run(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL).stdout


def probe(path):
    out = run(["ffprobe", "-v", "error", "-show_entries",
               "format=duration:stream=width,height", "-of", "json", path])
    try:
        d = json.loads(out.decode("utf-8", "ignore"))
        st = d.get("streams", [{}])[0]
        return float(d["format"]["duration"]), int(st.get("width", 0)), int(st.get("height", 0))
    except Exception:
        return 0.0, 0, 0


def frames(path, ts, w=160, h=90):
    """extract n frames at given timestamps as raw rgb"""
    import numpy as np
    res = []
    for t in ts:
        raw = run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1",
                   "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"])
        if len(raw) == w * h * 3:
            res.append((t, np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3)))
    return res


def metrics(img):
    import numpy as np
    f = img.astype(np.float32)
    g = f.mean(axis=2)
    bright = float(g.mean())
    contrast = float(g.std())
    rf, gf, bf = f[:, :, 0], f[:, :, 1], f[:, :, 2]
    rg = rf - gf
    yb = 0.5 * (rf + gf) - bf
    colorful = float((np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)))
    gy, gx = np.gradient(g)
    edge = float(np.abs(gx).mean() + np.abs(gy).mean())
    sat = float((f.max(axis=2) - f.min(axis=2)).mean())
    uniq = float(len(np.unique((g // 8).astype(np.uint8))))
    dark = float((g < 24).mean())
    white = float((g > 236).mean())
    return dict(bright=round(bright, 1), contrast=round(contrast, 1), color=round(colorful, 1),
                edge=round(edge, 2), sat=round(sat, 1), uniq=round(uniq, 1),
                dark=round(dark * 100, 1), white=round(white * 100, 1))


def dhash(img):
    import numpy as np
    g = img.mean(axis=2).astype(np.float32)
    # resize to 9x8 by simple sampling
    h, w = g.shape
    ys = (np.arange(8) + 0.5) * h / 8
    xs = (np.arange(9) + 0.5) * w / 9
    s = g[ys.astype(int)][:, xs.astype(int)]
    bits = s[:, 1:] > s[:, :-1]
    return "".join("1" if b else "0" for b in bits.flatten())


def hamming(a, b):
    return sum(1 for x, y in zip(a, b) if x != y)


def audit(item):
    key = item["key"]
    if not item.get("mp4"):
        return {"key": key, "missing": True}
    mp4 = os.path.join(SITE, item["mp4"].replace("/", os.sep))
    jpg = os.path.join(SITE, item["poster"].replace("/", os.sep))
    if not os.path.exists(mp4):
        return {"key": key, "missing": True}
    dur, w, h = probe(mp4)
    ts = [0.05, 0.5, dur * 0.25, dur * 0.45, dur * 0.65, dur * 0.85, max(0.1, dur - 0.35)]
    fr = frames(mp4, ts)
    rec = {"key": key, "dur": round(dur, 2), "w": w, "h": h,
           "file_mb": round(os.path.getsize(mp4) / 1048576, 2),
           "frames": [dict(t=round(t, 2), **metrics(im)) for t, im in fr]}
    if fr:
        rec["hash"] = dhash(fr[len(fr) // 2][1])
        rec["first"] = rec["frames"][0]
        # opening blankness: first frame near-flat and near-uniform
        rec["open_flat"] = bool(rec["frames"][0]["contrast"] < 12 or rec["frames"][0]["uniq"] < 12)
    if os.path.exists(jpg):
        import numpy as np
        from PIL import Image
        im = Image.open(jpg).convert("RGB").resize((160, 90))
        arr = np.asarray(im)
        rec["poster"] = metrics(arr)
        rec["poster_hash"] = dhash(arr)
        rec["poster_bytes"] = os.path.getsize(jpg)
    return rec


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", nargs="+", help="check these sample IDs")
    parser.add_argument("--check", action="store_true", help="fail on an empty opening or weak/near-duplicate cover")
    args = parser.parse_args()
    if args.check and not args.only:
        parser.error("--check requires --only so legacy samples do not block a new batch")
    with open(os.path.join(SITE, "assets", "samples.json"), encoding="utf-8") as f:
        items = json.load(f)["items"]
    if args.only:
        known = {r["key"]: r for r in items}
        unknown = set(args.only) - known.keys()
        if unknown:
            parser.error("unknown samples: " + ", ".join(sorted(unknown)))
        items = [known[key] for key in dict.fromkeys(args.only)]
    with ThreadPoolExecutor(max_workers=8) as ex:
        res = list(ex.map(audit, items))
    dups = []
    for a, b in combinations(res, 2):
        if a.get("poster_hash") and b.get("poster_hash"):
            d = hamming(a["poster_hash"], b["poster_hash"])
            if d <= (10 if args.check else 6):
                dups.append([a["key"], b["key"], d])
    report = "selected.json" if args.only else "audit.json"
    with open(os.path.join(OUT, report), "w", encoding="utf-8") as f:
        json.dump({"items": res, "dups": dups}, f, ensure_ascii=False, indent=1)
    print("items", len(res), "dups", len(dups))
    for d in dups[:20]:
        print("DUP", d)
    if not args.check:
        return 0
    failures = []
    for row in res:
        key, poster = row["key"], row.get("poster", {})
        if row.get("open_flat", True):
            failures.append(f"{key}: missing/near-flat opening")
        if not poster or not (20 < poster["bright"] < 232 and poster["white"] < 85):
            failures.append(f"{key}: missing/near-flat poster")
    for failure in failures:
        print(failure)
    return 1 if failures or dups else 0


if __name__ == "__main__":
    raise SystemExit(main())
