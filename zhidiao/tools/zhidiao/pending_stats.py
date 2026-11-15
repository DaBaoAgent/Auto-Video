# -*- coding: utf-8 -*-
"""统计 shots.json 中尚未完成的图/视频数量（assets.json 不含未注册的新镜头）。

输出: IMG_MISSING=<n>  VID_LEFT=<n>
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHOTS_DIR = os.path.join(ROOT, "content", "warring-states-20min", "shots")


def main():
    cfg = json.load(open(os.path.join(ROOT, "content", "warring-states-20min",
                                      "shots.json"), encoding="utf-8"))
    state_path = os.path.join(SHOTS_DIR, "assets.json")
    assets = {}
    if os.path.isfile(state_path):
        assets = json.load(open(state_path, encoding="utf-8")).get("shots", {})

    img_missing, vid_left = [], []
    for s in cfg["shots"]:
        sid = str(s["id"])
        st = assets.get(sid) or {}
        im = st.get("image") or {}
        img_ok = False
        if im.get("status") == "done":
            rel = im.get("path") or im.get("file")
            if rel and os.path.isfile(os.path.join(ROOT, rel)):
                img_ok = True
            elif rel and os.path.isfile(os.path.join(SHOTS_DIR, os.path.basename(rel))):
                img_ok = True
        if not img_ok:
            img_missing.append(sid)
        if s.get("video"):
            vd = st.get("video") or {}
            vid_ok = vd.get("status") == "done" and os.path.isfile(
                os.path.join(SHOTS_DIR, sid + ".mp4"))
            if not vid_ok:
                vid_left.append(sid)
    print("IMG_MISSING=%d" % len(img_missing))
    print("VID_LEFT=%d" % len(vid_left))
    if "-v" in sys.argv:
        print("img_missing:", " ".join(img_missing[:40]))
        print("vid_left:", " ".join(vid_left[:40]))


if __name__ == "__main__":
    main()
