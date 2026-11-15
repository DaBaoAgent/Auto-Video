# -*- coding: utf-8 -*-
"""智谱免费 CogVideoX-Flash 通用视频赛道：覆盖所有已有首帧图的镜头。

与 Agnes 主赛道并行抢队，独立状态文件、绝不写 assets.json。
每轮循环：
  1. 读 assets.json（只读），跳过 Agnes 已出片的镜头（防重复）
  2. 当前镜头无 task_id 则提交 i2v（1305 限流则退避）
  3. 有 task_id 则轮询，SUCCESS 即下载到 _ms-test/<sid>-zhipu.mp4
用法: python zhipu_video_lane.py [max_hours]   默认 8 小时
日志: logs/zhipu/lane.log   状态: logs/zhipu/lane.state.json
"""
import base64
import io
import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHOTS_DIR = os.path.join(ROOT, "content", "warring-states-20min", "shots")
OUT_DIR = os.path.join(SHOTS_DIR, "_ms-test")
LOG_DIR = os.path.join(ROOT, "logs", "zhipu")
BASE = "https://open.bigmodel.cn/api/paas/v4"
INTERVAL = 600.0          # 每轮间隔 10 分钟
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

LANE_LOG = os.path.join(LOG_DIR, "lane.log")
LANE_STATE = os.path.join(LOG_DIR, "lane.state.json")


def log(msg):
    os.makedirs(LOG_DIR, exist_ok=True)
    line = "[%s] %s" % (time.strftime("%m-%d %H:%M:%S"), msg)
    print(line, flush=True)
    with open(LANE_LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def load_key():
    env = open(os.path.join(ROOT, ".env"), encoding="utf-8", errors="ignore").read()
    return re.search(r"^ZHIPU_API_KEY=(\S+)", env, re.M).group(1)


def video_shots():
    """返回带 video_prompt 且 video:true 的镜头列表（按定义顺序）。"""
    cfg = json.load(open(os.path.join(ROOT, "content", "warring-states-20min",
                                      "shots.json"), encoding="utf-8"))
    return [s for s in cfg["shots"] if s.get("video") and s.get("video_prompt")]


def agnes_video_done(sid):
    """只读检查 Agnes 主赛道是否已出该镜头的视频。"""
    try:
        d = json.load(open(os.path.join(SHOTS_DIR, "assets.json"), encoding="utf-8"))
        v = (d["shots"].get(sid) or {}).get("video") or {}
        return v.get("status") == "done"
    except Exception:
        return False


def first_frame_b64(entry):
    """从 assets.json 的图片条目取本地文件，缩到 1280 宽转 JPEG b64。"""
    from PIL import Image
    rel = entry.get("path") or entry.get("file")
    path = os.path.join(ROOT, rel) if rel else None
    if not path or not os.path.isfile(path):
        return None
    img = Image.open(path).convert("RGB")
    img = img.resize((1280, round(img.height * 1280 / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode()


def save_state(d):
    with open(LANE_STATE, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2)


def api_post(key, payload):
    req = urllib.request.Request(BASE + "/videos/generations",
                                 data=json.dumps(payload).encode(), method="POST",
                                 headers={"Authorization": "Bearer " + key,
                                          "Content-Type": "application/json"})
    with opener.open(req, timeout=120) as r:
        return json.loads(r.read().decode())


def api_get(key, task_id):
    req = urllib.request.Request(BASE + "/async-result/" + task_id,
                                 headers={"Authorization": "Bearer " + key})
    with opener.open(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    max_hours = float(sys.argv[1]) if len(sys.argv) > 1 else 8.0
    deadline = time.time() + max_hours * 3600
    key = load_key()
    shots = {s["id"]: s for s in video_shots()}
    state = json.load(open(LANE_STATE, encoding="utf-8")) if os.path.isfile(LANE_STATE) else {}
    state.setdefault("done_shots", [])
    log("lane start, max %.1fh, candidates: %s" % (max_hours, " ".join(shots)))

    while time.time() < deadline:
        # 找下一个待做镜头：跳过 Agnes 已出片 / 本赛道已出片
        cur = None
        for sid in shots:
            if sid in state["done_shots"] or agnes_video_done(sid):
                if sid not in state["done_shots"]:
                    state["done_shots"].append(sid)
                    log("[%s] Agnes 已出片，跳过" % sid)
                continue
            cur = sid
            break
        save_state(state)
        if cur is None:
            log("所有镜头均已完成，收工")
            break

        entry = state.setdefault(cur, {})
        payload = state.setdefault("_payloads", {}).get(cur)
        try:
            if entry.get("task_id"):
                r = api_get(key, entry["task_id"])
            else:
                assets = json.load(open(os.path.join(SHOTS_DIR, "assets.json"),
                                        encoding="utf-8"))
                img_entry = (assets["shots"].get(cur) or {}).get("image") or {}
                b64 = first_frame_b64(img_entry)
                if not b64:
                    log("[%s] 本地首帧图缺失，跳过" % cur)
                    state["done_shots"].append(cur)
                    save_state(state)
                    continue
                payload = {"model": "cogvideox-flash",
                           "prompt": shots[cur]["video_prompt"],
                           "image_url": b64, "quality": "speed",
                           "with_audio": False, "fps": 30}
                state["_payloads"] = {cur: payload}   # 只保留当前，省内存
                r = api_post(key, payload)

            code = (r.get("error") or {}).get("code")
            if code == "1305":
                log("[%s] 1305 拥堵，退避 %ds" % (cur, INTERVAL))
            elif code == "1113":
                log("[%s] 余额不足 1113，整个赛道停止" % cur)
                break
            elif r.get("id") or r.get("task_status"):
                entry["task_id"] = r.get("id") or entry.get("task_id")
                st = r.get("task_status", "?")
                entry["status"] = st
                log("[%s] task_id=%s status=%s" % (cur, entry["task_id"], st))
                if st == "SUCCESS" and r.get("video_result"):
                    url = r["video_result"][0]["url"]
                    out = os.path.join(OUT_DIR, "%s-zhipu.mp4" % cur)
                    with opener.open(urllib.request.Request(
                            url, headers={"User-Agent": "Mozilla/5.0"}),
                            timeout=300) as resp, open(out, "wb") as f:
                        f.write(resp.read())
                    entry["file"] = out
                    state["done_shots"].append(cur)
                    log("[%s] DONE -> %s (%.1fMB)" % (cur, out,
                        os.path.getsize(out) / 1048576))
            else:
                log("[%s] unexpected %s" % (cur, json.dumps(r, ensure_ascii=False)[:200]))
        except Exception as e:
            body = ""
            if hasattr(e, "read"):
                try:
                    body = e.read().decode("utf-8", "ignore")[:200]
                except Exception:
                    pass
            log("[%s] EXC %s %s %s" % (cur, type(e).__name__, e, body))
        save_state(state)
        time.sleep(INTERVAL)
    log("lane end, done=%s" % state["done_shots"])


if __name__ == "__main__":
    main()
