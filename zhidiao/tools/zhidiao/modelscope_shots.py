# -*- coding: utf-8 -*-
"""魔搭 Qwen-Image 出无参考图镜头的像素样张（先 s001）。"""
import json
import re
import sys
import time
import urllib.request

ROOT = r"D:\@kaifa\tushuo"
env = open(ROOT + r"\.env", encoding="utf-8", errors="ignore").read()
KEY = re.search(r"^MODELSCOPE_API_KEY=(\S+)", env, re.M).group(1)
cfg = json.load(open(ROOT + r"\content\warring-states-20min\shots.json", encoding="utf-8"))
op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
HDR_SUB = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json",
           "X-ModelScope-Async-Mode": "true"}
HDR_Q = {"Authorization": "Bearer " + KEY, "X-ModelScope-Task-Type": "image_generation"}


def gen(shot_id):
    shot = next(s for s in cfg["shots"] if s["id"] == shot_id)
    prompt = cfg["style"] + "。" + shot["prompt"]
    body = json.dumps({"model": "Qwen/Qwen-Image", "prompt": prompt, "size": "1344x768"}).encode()
    req = urllib.request.Request("https://api-inference.modelscope.cn/v1/images/generations",
                                 data=body, method="POST", headers=HDR_SUB)
    tid = json.loads(op.open(req, timeout=60).read())["task_id"]
    print("[%s] submitted %s" % (shot_id, tid), flush=True)
    t0 = time.time()
    for i in range(40):
        time.sleep(10)
        q = urllib.request.Request("https://api-inference.modelscope.cn/v1/tasks/" + tid, headers=HDR_Q)
        d = json.loads(op.open(q, timeout=30).read())
        st = d.get("task_status")
        if st == "SUCCEED":
            url = d["output_images"][0]
            out = ROOT + r"\content\warring-states-20min\shots\_ms-test\%s-ms.png" % shot_id
            open(out, "wb").write(op.open(url, timeout=60).read())
            print("[%s] DONE %.0fs -> %s" % (shot_id, time.time() - t0, out), flush=True)
            return True
        if st == "FAILED":
            print("[%s] FAILED: %s" % (shot_id, json.dumps(d, ensure_ascii=False)[:300]), flush=True)
            return False
    print("[%s] timeout" % shot_id, flush=True)
    return False


if __name__ == "__main__":
    for sid in (sys.argv[1:] or ["s001"]):
        gen(sid)
