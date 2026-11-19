# -*- coding: utf-8 -*-
"""Agnes 分镜素材客户端（纯标准库）

生图：POST <base>/images/generations，模型 agnes-image-2.5-flash
生视频：POST <base>/videos（首帧/尾帧 keyframe 模式），
        GET  <origin>/agnesapi?video_id=...&model_name=...

配置读项目根 `.env`：
    AGNES_BASE_URL / AGNES_IMAGE_MODEL / AGNES_VIDEO_MODEL / AGNES_API_KEY

失败重试统一走 `retry_call`：指数退避 + 抖动，遇到
`video_queue_full` / 429 / 5xx / 网络错误都会重试，直到 deadline。
"""
import base64
import binascii
import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_BASE_URL = "https://apihub.agnes-ai.com/v1"
DEFAULT_IMAGE_MODEL = "agnes-image-2.5-flash"
DEFAULT_VIDEO_MODEL = "agnes-video-2.5-flash"
ENV_KEYS = ("AGNES_BASE_URL", "AGNES_IMAGE_MODEL", "AGNES_VIDEO_MODEL", "AGNES_API_KEY")
ALIASES = {
    "AGNES_BASE_URL": ("AGNES_API_BASE", "AGNES_URL"),
    "AGNES_IMAGE_MODEL": ("AGNES_MODEL_IMAGE",),
    "AGNES_VIDEO_MODEL": ("AGNES_MODEL_VIDEO",),
    "AGNES_API_KEY": ("AGNES_KEY",),
}
RETRYABLE_STATUS = {408, 409, 425, 429, 500, 502, 503, 504}
QUEUE_FULL_CODES = {"video_queue_full", "queue_full", "videoqueuefull"}
OVERLOAD_HINTS = ("queue is full", "overloaded", "rate limit", "too many requests",
                  "please retry later", "访问量过大")


def log(msg):
    print("[%s] %s" % (datetime.now().strftime("%H:%M:%S"), msg), file=sys.stderr, flush=True)


def strip_value(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def load_env(path):
    if path is None or not Path(path).is_file():
        return
    for line in Path(path).read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), strip_value(value))


def find_env(explicit):
    if explicit:
        return Path(explicit)
    candidate = ROOT / ".env"
    if candidate.is_file():
        return candidate
    return None


def resolve(name):
    for key in (name, *ALIASES.get(name, ())):
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return ""


def looks_like_base64(text):
    """粗判是否已经是 base64 数据（短于 64 字符的一律当路径，避免误判）。"""
    text = str(text).strip()
    if len(text) < 64 or len(text) % 4:
        return False
    if not all(c.isalnum() or c in "+/=" for c in text):
        return False
    try:
        base64.b64decode(text, validate=True)
    except (binascii.Error, ValueError):
        return False
    return True


def derive_origin(base_url):
    parts = urllib.parse.urlsplit(base_url)
    return "%s://%s" % (parts.scheme, parts.netloc)


class AgnesError(RuntimeError):
    def __init__(self, message, status=None, body=None, retryable=False):
        super().__init__(message)
        self.status = status
        self.body = body
        self.retryable = retryable


def _looks_busy(payload):
    if not isinstance(payload, dict):
        return False
    code = str(payload.get("code", "")).lower()
    if code in QUEUE_FULL_CODES:
        return True
    text = json.dumps(payload, ensure_ascii=False).lower()
    return any(hint in text for hint in OVERLOAD_HINTS)


QUEUE_FULL_TEXT = ("video_queue_full", "queue_full", "queue is full",
                   "队列已满", "队列满", "繁忙", "超时")


def is_queue_full(exc):
    """判断异常是否属于队列满（用于 queued/pending 与退出码 2）。"""
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        code = str(body.get("code") or "").lower()
        if code in QUEUE_FULL_CODES:
            return True
        nested = body.get("error")
        if isinstance(nested, dict) and str(nested.get("code", "")).lower() in QUEUE_FULL_CODES:
            return True
    text = str(exc).lower()
    return any(hint in text for hint in QUEUE_FULL_TEXT)


class AgnesClient:
    def __init__(self, base_url=None, api_key=None, image_model=None,
                 video_model=None, env_file=None, bypass_proxy=True):
        load_env(find_env(env_file))
        self.base_url = (base_url or resolve("AGNES_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
        self.origin = derive_origin(self.base_url)
        self.api_key = api_key or resolve("AGNES_API_KEY")
        self.image_model = image_model or resolve("AGNES_IMAGE_MODEL") or DEFAULT_IMAGE_MODEL
        self.video_model = video_model or resolve("AGNES_VIDEO_MODEL") or DEFAULT_VIDEO_MODEL
        if not self.api_key:
            raise AgnesError("缺少 AGNES_API_KEY（检查项目根 .env）")
        self._opener = urllib.request.build_opener(
            urllib.request.ProxyHandler({} if bypass_proxy else None)
        )

    def _request(self, method, url, payload=None, timeout=240):
        body = None
        headers = {"Authorization": "Bearer %s" % self.api_key,
                   "User-Agent": "zhidiao-agnes/1.0"}
        if payload is not None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with self._opener.open(req, timeout=timeout) as resp:
                raw = resp.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode("utf-8", "replace")
            try:
                parsed = json.loads(raw)
            except ValueError:
                parsed = None
            raise AgnesError(
                "HTTP %s：%s" % (exc.code, raw[:500]),
                status=exc.code, body=parsed,
                retryable=(exc.code in RETRYABLE_STATUS or _looks_busy(parsed)),
            )
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            reason = getattr(exc, "reason", exc)
            raise AgnesError("连接失败：%s" % reason, retryable=True)

        try:
            parsed = json.loads(raw)
        except ValueError:
            raise AgnesError("返回不是 JSON：%s" % raw[:300])
        if _looks_busy(parsed):
            raise AgnesError("接口繁忙：%s" % json.dumps(parsed, ensure_ascii=False)[:300],
                             body=parsed, retryable=True)
        return parsed

    def _image_b64(self, source):
        text = str(source).strip()
        if text.startswith("data:"):
            text = text.split(",", 1)[1] if "," in text else ""
            return text
        if text.startswith(("http://", "https://")):
            try:
                with self._opener.open(
                        urllib.request.Request(text, headers={
                            "User-Agent": "zhidiao-agnes/1.0"}),
                        timeout=120) as resp:
                    data = resp.read()
            except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
                raise AgnesError("参考图下载失败 %s：%s" % (text, exc), retryable=True)
            return base64.b64encode(data).decode()
        if looks_like_base64(text):
            return text
        path = Path(text)
        if not path.is_absolute():
            path = ROOT / path
        if not path.is_file():
            raise AgnesError("找不到参考图：%s" % path)
        return base64.b64encode(path.read_bytes()).decode()

    def generate_image(self, prompt, size="2K", ratio="16:9", model=None,
                       response_format="url", timeout=360, images=None):
        """images：参考图列表（本地路径 / URL / base64 / data URI），走 img2img。"""
        payload = {
            "model": model or self.image_model,
            "prompt": prompt,
            "size": size,
        }
        if ratio:
            payload["ratio"] = ratio
        extra = {}
        if response_format:
            extra["response_format"] = response_format
        if images:
            extra["image"] = [self._image_b64(item) for item in images]
        if extra:
            payload["extra_body"] = extra
        result = self._request("POST", self.base_url + "/images/generations",
                               payload, timeout=timeout)
        data = result.get("data")
        if not isinstance(data, list) or not data:
            raise AgnesError("生图返回缺少 data：%s" % json.dumps(result, ensure_ascii=False)[:300])
        item = data[0]
        if not item.get("url") and not item.get("b64_json"):
            raise AgnesError("生图结果既无 url 也无 b64_json")
        return {
            "url": item.get("url"),
            "b64_json": item.get("b64_json"),
            "task_id": result.get("task_id") or result.get("id"),
            "revised_prompt": item.get("revised_prompt"),
        }

    def create_video(self, prompt, first_frame=None, last_frame=None,
                     seconds="5", size="720P", aspect_ratio="16:9",
                     mode=None, model=None, timeout=90):
        if mode is None:
            mode = "keyframe" if (first_frame or last_frame) else "text"
        if mode == "keyframe" and not (first_frame or last_frame):
            raise AgnesError("keyframe 模式需要 first_frame 或 last_frame")
        if mode == "text" and (first_frame or last_frame):
            raise AgnesError("text 模式不接受首尾帧")
        payload = {
            "model": model or self.video_model,
            "prompt": prompt,
            "mode": mode,
            "seconds": str(seconds),
            "size": size,
            "aspect_ratio": aspect_ratio,
        }
        if first_frame:
            payload["first_frame"] = first_frame
        if last_frame:
            payload["last_frame"] = last_frame
        result = self._request("POST", self.base_url + "/videos", payload, timeout=timeout)
        video_id = result.get("video_id") or result.get("id") or result.get("task_id")
        if not video_id:
            raise AgnesError("创建视频任务未返回 video_id：%s"
                             % json.dumps(result, ensure_ascii=False)[:300])
        return {"video_id": video_id, "task_id": result.get("task_id") or result.get("id"),
                "raw": result}

    def poll_video(self, video_id, model=None, timeout=60):
        query = urllib.parse.urlencode({
            "video_id": video_id,
            "model_name": model or self.video_model,
        })
        url = "%s/agnesapi?%s" % (self.origin, query)
        return self._request("GET", url, timeout=timeout)

    def wait_video(self, video_id, deadline, model=None, interval=4.0, cap=20.0):
        delay = interval
        last = None
        while True:
            last = retry_call(
                "视频任务 %s 查询" % video_id,
                lambda: self.poll_video(video_id, model=model),
                deadline, initial=2.0, factor=1.7, cap=20.0)
            status = str(last.get("status", "")).lower()
            progress = last.get("progress")
            if status in {"completed", "succeeded", "success", "done"}:
                return last
            if status in {"failed", "error", "cancelled", "canceled"}:
                raise AgnesError("视频任务失败：%s"
                                 % json.dumps(last, ensure_ascii=False)[:400])
            if time.time() >= deadline:
                raise AgnesError("等待视频超时（video_id=%s，最后状态=%s，进度=%s）"
                                 % (video_id, status or "?", progress), retryable=False)
            log("视频任务 %s：%s %s%%，%.0fs 后再查"
                % (video_id, status or "pending",
                   progress if progress is not None else "?", delay))
            time.sleep(delay)
            delay = min(cap, delay * 1.5)

    def url_alive(self, url, timeout=20):
        if not url:
            return False
        req = urllib.request.Request(url, headers={
            "Range": "bytes=0-0",
            "User-Agent": "zhidiao-agnes/1.0",
        })
        try:
            with self._opener.open(req, timeout=timeout) as resp:
                return 200 <= resp.status < 400
        except (urllib.error.URLError, urllib.error.HTTPError, OSError):
            return False

    def download(self, url, target, timeout=300):
        target = Path(target)
        target.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "zhidiao-agnes/1.0"})
        try:
            with self._opener.open(req, timeout=timeout) as resp:
                tmp = target.with_name(target.name + ".part")
                with open(tmp, "wb") as fh:
                    while True:
                        chunk = resp.read(1024 * 256)
                        if not chunk:
                            break
                        fh.write(chunk)
                tmp.replace(target)
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as exc:
            raise AgnesError("下载失败 %s：%s" % (url, exc), retryable=True)
        return target

    def save_image(self, result, target):
        target = Path(target)
        if result.get("b64_json"):
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(base64.b64decode(result["b64_json"]))
            return target
        return self.download(result["url"], target)


def retry_call(desc, fn, deadline, initial=3.0, factor=1.7, cap=90.0,
               jitter=0.35, retry_if=None):
    """指数退避重试。retry_if(exc)->bool 可覆盖默认判断。"""
    delay = initial
    attempt = 0
    while True:
        attempt += 1
        try:
            return fn()
        except AgnesError as exc:
            ok = exc.retryable if retry_if is None else retry_if(exc)
            if not ok:
                raise
            remaining = deadline - time.time()
            if remaining <= 1:
                raise AgnesError("%s 在截止时间前仍未成功：%s" % (desc, exc),
                                 retryable=False)
            wait = min(cap, delay) * (1 - jitter + random.random() * jitter * 2)
            wait = max(1.0, min(wait, remaining))
            log("%s 失败（%s），%.1fs 后重试（第 %d 次）" % (desc, exc, wait, attempt))
            time.sleep(wait)
            delay = min(cap, delay * factor)


def image_suffix(url, default=".png"):
    if not url:
        return default
    suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
    return suffix if suffix in {".png", ".jpg", ".jpeg", ".webp"} else default


def check_config(env_file=None):
    load_env(find_env(env_file))
    rows = [
        ("base_url", resolve("AGNES_BASE_URL") or DEFAULT_BASE_URL),
        ("image_model", resolve("AGNES_IMAGE_MODEL") or DEFAULT_IMAGE_MODEL),
        ("video_model", resolve("AGNES_VIDEO_MODEL") or DEFAULT_VIDEO_MODEL),
        ("api_key", "已设置" if resolve("AGNES_API_KEY") else "(未设置)"),
        ("env_file", str(find_env(env_file) or "(未找到)")),
    ]
    for key, value in rows:
        print("%s: %s" % (key, value))
    return 0 if resolve("AGNES_API_KEY") else 1
