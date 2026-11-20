# -*- coding: utf-8 -*-
"""Demo-site sample audit: per-item frame metrics + poster duplicate scan."""
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

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
        f0 = fr[0][1]
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
    items = json.load(open(os.path.join(SITE, "assets", "samples.json"), encoding="utf-8"))["items"]
    with ThreadPoolExecutor(max_workers=8) as ex:
        res = list(ex.map(audit, items))
    # duplicate scan among posters
    dups = []
    for i in range(len(res)):
        for j in range(i + 1, len(res)):
            a, b = res[i], res[j]
            if a.get("poster_hash") and b.get("poster_hash"):
                d = hamming(a["poster_hash"], b["poster_hash"])
                if d <= 6:
                    dups.append([a["key"], b["key"], d])
    json.dump({"items": res, "dups": dups}, open(os.path.join(OUT, "audit.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("items", len(res), "dups", len(dups))
    for d in dups[:20]:
        print("DUP", d)


if __name__ == "__main__":
    main()
