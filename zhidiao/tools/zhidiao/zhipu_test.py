# -*- coding: utf-8 -*-
"""智谱 BigModel 免费模型测试：CogView-3-Flash 生图 + CogVideoX-Flash 首帧视频。

从 Api Key txt 解析密钥（不打印、不落日志）。
输出目录: content/warring-states-20min/shots/_ms-test/
用法:
  python zhipu_test.py image            # s001 静帧
  python zhipu_test.py video            # s02 首帧视频
  python zhipu_test.py all
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
KEY_FILE = r"D:\BaiduSyncdisk\2 @AI编程\Api Key\智普 glm-5.3 flash.txt"
SHOTS = os.path.join(ROOT, "content", "warring-states-20min", "shots.json")
OUT_DIR = os.path.join(ROOT, "content", "warring-states-20min", "shots", "_ms-test")
S02_PNG = os.path.join(ROOT, "content", "warring-states-20min", "shots", "s02.png")
ENV_FILE = os.path.join(ROOT, ".env")

BASE = "https://open.bigmodel.cn/api/paas/v4"
IMG_MODEL = "cogview-3-flash"
VID_MODEL = "cogvideox-flash"

_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # 绕过本机 socks 代理


def load_key():
    # 优先读项目 .env 的 ZHIPU_API_KEY；否则回退到 Api Key txt
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        with open(env, "r", encoding="utf-8", errors="ignore") as f:
            m = re.search(r"^ZHIPU_API_KEY=(\S+)", f.read(), re.M)
            if m:
                return m.group(1)
    with open(KEY_FILE, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    m = re.search(r"([0-9a-f]{32}\.[A-Za-z0-9]+)", text)
    if not m:
        raise SystemExit("ERROR: key not found in %s" % KEY_FILE)
    return m.group(1)


def post(url, key, payload, timeout=120):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": "Bearer " + key,
        "Content-Type": "application/json",
    })
    with _opener.open(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get(url, key, timeout=30):
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + key})
    with _opener.open(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download(url, path, timeout=180):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with _opener.open(req, timeout=timeout) as resp, open(path, "wb") as f:
        f.write(resp.read())
    return os.path.getsize(path)


def load_shots():
    with open(SHOTS, "r", encoding="utf-8") as f:
        return json.load(f)


def test_image(key, shot_id="s001"):
    cfg = load_shots()
    shot = next((s for s in cfg["shots"] if s["id"] == shot_id), None)
    if not shot:
        raise SystemExit("shot %s not found" % shot_id)
    prompt = cfg["style"] + "。" + shot["prompt"]
    payload = {"model": IMG_MODEL, "prompt": prompt, "size": "1344x768"}
    t0 = time.time()
    resp = post(BASE + "/images/generations", key, payload)
    elapsed = time.time() - t0
    url = resp["data"][0]["url"]
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, "%s-zhipu.png" % shot_id)
    size = download(url, out)
    print("[image] model=%s shot=%s submit+wait=%.1fs download=%.0fKB file=%s"
          % (IMG_MODEL, shot_id, elapsed, size / 1024, out))
    return out


def make_first_frame(max_w=1280, quality=88):
    """s02.png 缩到 1280 宽 JPEG，控制 base64 体积。"""
    from PIL import Image
    img = Image.open(S02_PNG).convert("RGB")
    if img.width > max_w:
        h = round(img.height * max_w / img.width)
        img = img.resize((max_w, h), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=quality)
    b = buf.getvalue()
    out = os.path.join(OUT_DIR, "s02-firstframe.jpg")
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(out, "wb") as f:
        f.write(b)
    return b, out


def test_video(key, shot_id="s02", model=VID_MODEL):
    cfg = load_shots()
    shot = next((s for s in cfg["shots"] if s["id"] == shot_id), None)
    if not shot:
        raise SystemExit("shot %s not found" % shot_id)
    blob, ff_path = make_first_frame()
    b64 = base64.b64encode(blob).decode("ascii")
    print("[video] first frame: %s (%.0fKB)" % (ff_path, len(blob) / 1024))
    payload = {
        "model": model,
        "prompt": shot.get("video_prompt") or "缓慢推近，环境微动",
        "image_url": b64,
        "quality": "speed",
        "with_audio": False,
        "fps": 30,
    }
    t0 = time.time()
    resp = None
    attempt = 0
    while resp is None:
        attempt += 1
        try:
            resp = post(BASE + "/videos/generations", key, payload, timeout=300)
        except Exception as e:
            body = getattr(e, "read", None)
            detail = body().decode("utf-8", "ignore") if body else str(e)
            if ("1305" in detail or "访问量过大" in detail) and attempt <= 12:
                wait = min(20 * attempt, 90)
                print("[video] attempt %d rate-limited (1305), retry in %ds" % (attempt, wait))
                time.sleep(wait)
            else:
                raise
    submit_s = time.time() - t0
    task_id = resp.get("id") or resp.get("task_id")
    status = resp.get("task_status", "?")
    print("[video] submitted in %.1fs task_id=%s status=%s" % (submit_s, task_id, status))
    if not task_id:
        print("[video] unexpected response:", json.dumps(resp, ensure_ascii=False)[:500])
        return None

    poll = 0.0
    interval = 5.0
    while True:
        time.sleep(interval)
        poll += interval
        r = get(BASE + "/async-result/" + task_id, key)
        st = r.get("task_status")
        if st == "SUCCESS":
            vurl = r["video_result"][0]["url"]
            out = os.path.join(OUT_DIR, "%s-zhipu.mp4" % shot_id)
            size = download(vurl, out)
            print("[video] DONE total=%.0fs (submit %.0fs + poll %.0fs) file=%s (%.1fMB)"
                  % (submit_s + poll, submit_s, poll, out, size / 1048576))
            return out
        if st in ("FAIL", "FAILED"):
            print("[video] FAILED after %.0fs:" % poll, json.dumps(r, ensure_ascii=False)[:500])
            return None
        print("[video] %.0fs status=%s" % (poll, st))


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    vid_model = sys.argv[2] if len(sys.argv) > 2 else VID_MODEL
    key = load_key()
    os.makedirs(OUT_DIR, exist_ok=True)
    results = {}
    if mode in ("image", "all"):
        try:
            results["image"] = test_image(key)
        except Exception as e:
            body = getattr(e, "read", None)
            detail = body().decode("utf-8", "ignore")[:300] if body else str(e)
            print("[image] ERROR:", detail)
    if mode in ("video", "all"):
        try:
            results["video"] = test_video(key, model=vid_model)
        except Exception as e:
            import traceback
            body = getattr(e, "read", None)
            detail = body().decode("utf-8", "ignore")[:500] if body else ""
            print("[video] ERROR %s: %s" % (type(e).__name__, e))
            if detail:
                print("[video] body:", detail)
            traceback.print_exc()
    print("RESULT:", json.dumps(results, ensure_ascii=False))


if __name__ == "__main__":
    main()
