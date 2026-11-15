# -*- coding: utf-8 -*-
"""智谱免费 CogVideoX-Flash s02 首帧视频：通宵退避重试器。

每 10 分钟提交一次（1305 限流就退避），成功后轮询下载到 _ms-test/s02-zhipu.mp4。
日志: logs/zhipu/retry-s02.log   状态: logs/zhipu/retry-s02.state.json
用法: python zhipu_video_retry.py [max_hours]   默认 8 小时
"""
import base64
import io
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "content", "warring-states-20min", "shots", "_ms-test")
LOG_DIR = os.path.join(ROOT, "logs", "zhipu")
BASE = "https://open.bigmodel.cn/api/paas/v4"
INTERVAL = 600.0          # 每轮间隔 10 分钟
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def log(msg):
    os.makedirs(LOG_DIR, exist_ok=True)
    stamp = time.strftime("%m-%d %H:%M:%S")
    line = "[%s] %s" % (stamp, msg)
    print(line, flush=True)
    with open(os.path.join(LOG_DIR, "retry-s02.log"), "a", encoding="utf-8") as f:
        f.write(line + "\n")


def load_key():
    env = open(os.path.join(ROOT, ".env"), encoding="utf-8", errors="ignore").read()
    return re.search(r"^ZHIPU_API_KEY=(\S+)", env, re.M).group(1)


def first_frame_b64():
    from PIL import Image
    img = Image.open(os.path.join(ROOT, "content", "warring-states-20min", "shots", "s02.png")).convert("RGB")
    img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode()


def load_video_prompt():
    cfg = json.load(open(os.path.join(ROOT, "content", "warring-states-20min", "shots.json"), encoding="utf-8"))
    shot = next(s for s in cfg["shots"] if s["id"] == "s02")
    return shot["video_prompt"]


def save_state(d):
    with open(os.path.join(LOG_DIR, "retry-s02.state.json"), "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)


def main():
    max_hours = float(sys.argv[1]) if len(sys.argv) > 1 else 8.0
    deadline = time.time() + max_hours * 3600
    key = load_key()
    b64 = first_frame_b64()
    vprompt = load_video_prompt()
    payload = {"model": "cogvideox-flash", "prompt": vprompt, "image_url": b64,
               "quality": "speed", "with_audio": False, "fps": 30}
    state = {"attempts": 0, "task_id": None, "done": False}
    log("retry loop start, max %.1fh, first frame %.0fKB(b64)" % (max_hours, len(b64) * 3 / 4 / 1024))

    while time.time() < deadline and not state["done"]:
        state["attempts"] += 1
        try:
            # 已有 task_id 就直接续轮询，不重复提交
            if state.get("task_id"):
                r = api_get(key, state["task_id"])
            else:
                r = api_post(key, payload)
            code = r.get("error", {}).get("code")
            if code == "1305":
                log("attempt %d: 1305 congested, sleep %ds" % (state["attempts"], INTERVAL))
            elif code in ("1113",):
                log("attempt %d: balance error 1113, stop." % state["attempts"])
                break
            elif r.get("id") or r.get("task_status") in ("PROCESSING", "SUCCESS", "PENDING"):
                state["task_id"] = r.get("id") or state.get("task_id")
                st = r.get("task_status", "?")
                log("attempt %d: task_id=%s status=%s" % (state["attempts"], state["task_id"], st))
                if st == "SUCCESS" and r.get("video_result"):
                    url = r["video_result"][0]["url"]
                    out = os.path.join(OUT_DIR, "s02-zhipu.mp4")
                    with opener.open(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=300) as resp, open(out, "wb") as f:
                        f.write(resp.read())
                    state["done"] = True
                    state["file"] = out
                    log("DONE -> %s (%.1fMB)" % (out, os.path.getsize(out) / 1048576))
            else:
                log("attempt %d: unexpected %s" % (state["attempts"], json.dumps(r, ensure_ascii=False)[:200]))
        except Exception as e:
            body = ""
            if hasattr(e, "read"):
                try:
                    body = e.read().decode("utf-8", "ignore")[:200]
                except Exception:
                    pass
            log("attempt %d: EXC %s %s %s" % (state["attempts"], type(e).__name__, e, body))
        save_state(state)
        if not state["done"]:
            time.sleep(INTERVAL)
    log("loop end, done=%s" % state["done"])


def api_post(key, payload):
    req = urllib.request.Request(BASE + "/videos/generations", data=json.dumps(payload).encode(), method="POST",
                                 headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    with opener.open(req, timeout=120) as r:
        return json.loads(r.read().decode())


def api_get(key, task_id):
    req = urllib.request.Request(BASE + "/async-result/" + task_id, headers={"Authorization": "Bearer " + key})
    with opener.open(req, timeout=30) as r:
        return json.loads(r.read().decode())


if __name__ == "__main__":
    main()
