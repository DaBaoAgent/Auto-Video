# -*- coding: utf-8 -*-
"""zhidiao 分镜素材 · Agnes 生图 / 首帧图生视频（带失败退避队列）

输入：content/<slug>/shots.json
输出：content/<slug>/shots/<id>.png|jpg 与 <id>.mp4，状态写 content/<slug>/shots/assets.json

用法：
  python tools/zhidiao/agnes_shots.py check
  python tools/zhidiao/agnes_shots.py images --slug <slug>
  python tools/zhidiao/agnes_shots.py videos --slug <slug>
  python tools/zhidiao/agnes_shots.py all    --slug <slug>
  python tools/zhidiao/agnes_shots.py status --slug <slug>

shots.json：
  {
    "style": "纸雕剪影风格，层叠纸质山峦，暖金色调，纸张纹理与投影",
    "defaults": {"image": {"size": "2K", "ratio": "16:9"},
                 "video": {"seconds": "5", "size": "720P", "aspect_ratio": "16:9"}},
    "shots": [
      {"id": "s001", "prompt": "洪水退去，泥滩露出...", "video": true},
      {"id": "s002", "prompt": "首领站在泥脊上...", "video": true,
       "reference": ["参考视频和logo/方案A_束发骨簪首领版.png"]}
    ]
  }

reference（或 ref_images）：参考图列表，本地路径（相对项目根）/ 公网 URL / base64，
有值时走 img2img，用来锁定人物定妆与画风。

fragment 里放占位符，assembler 会自动替换：
  <div class="shotslot" data-shot="s001"></div>
可选 data-mode="image|video|auto"（默认 auto：有视频用视频）。

退出码：0 全部完成；1 有失败；2 视频队列未清空（已记 queued/pending，重跑续传）。
"""
import argparse
import json
import os
import sys
import threading
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

from agnes_api import (ROOT, AgnesClient, AgnesError, check_config, image_suffix,
                       is_queue_full, looks_like_base64, retry_call, log)

sys.stdout.reconfigure(encoding="utf-8")

DEFAULT_IMAGE = {"size": "2K", "ratio": "16:9"}
DEFAULT_VIDEO = {"seconds": "5", "size": "720P", "aspect_ratio": "16:9"}
DEFAULT_VIDEO_TAIL = "，镜头缓慢推进，主体保持稳定，画面连贯"
PENDING_TTL = 24 * 3600


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def as_path(value):
    path = Path(value)
    return path if path.is_absolute() else (ROOT / path)


def rel_to_root(path):
    try:
        return Path(path).resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return str(Path(path).resolve())


def load_shots(path):
    path = Path(path)
    if not path.is_file():
        raise SystemExit("找不到分镜文件：%s" % path)
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    shots = data.get("shots")
    if not isinstance(shots, list) or not shots:
        raise SystemExit("shots.json 缺少 shots 数组")
    seen = set()
    for shot in shots:
        sid = str(shot.get("id", "")).strip()
        if not sid:
            raise SystemExit("shots.json 有镜头缺少 id")
        if sid in seen:
            raise SystemExit("shots.json 镜头 id 重复：%s" % sid)
        if not str(shot.get("prompt", "")).strip():
            raise SystemExit("镜头 %s 缺少 prompt" % sid)
        seen.add(sid)
    return data


def load_state(path):
    if Path(path).is_file():
        try:
            return json.loads(Path(path).read_text(encoding="utf-8"))
        except ValueError:
            log("状态文件损坏，重建：%s" % path)
    return {"shots": {}}


def save_state(path, state):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    state["updated_at"] = now_iso()
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def normalize_prompt(style, prompt, no_style=False):
    text = " ".join(str(prompt).split())
    if no_style or not style:
        return text
    return "%s。%s" % (str(style).strip().rstrip("。"), text)


def shot_references(shot):
    refs = shot.get("reference") or shot.get("ref_images") or []
    if isinstance(refs, str):
        refs = [refs]
    out = []
    for item in refs:
        text = str(item).strip()
        if not text:
            continue
        passthrough = text.startswith(("http://", "https://", "data:")) or looks_like_base64(text)
        out.append(text if passthrough else str(as_path(text)))
    return out


def shot_image_cfg(shot, defaults):
    cfg = dict(DEFAULT_IMAGE)
    cfg.update(defaults.get("image") or {})
    if isinstance(shot.get("image"), dict):
        cfg.update(shot["image"])
    return cfg


def shot_video_cfg(shot, defaults):
    cfg = dict(DEFAULT_VIDEO)
    cfg.update(defaults.get("video") or {})
    if isinstance(shot.get("video"), dict):
        cfg.update(shot["video"])
    return cfg


def wants_video(shot, force_all=False):
    value = shot.get("video", False)
    if force_all:
        return True
    return bool(value) and value is not False


def select_shots(shots, only):
    if not only:
        return shots
    keep = {s.strip() for s in only.split(",") if s.strip()}
    missing = keep - {str(s["id"]) for s in shots}
    if missing:
        raise SystemExit("--only 里有不存在的镜头：%s" % "、".join(sorted(missing)))
    return [s for s in shots if str(s["id"]) in keep]


class ShotRunner:
    def __init__(self, data, out_dir, state_path, args, client):
        self.data = data
        self.style = data.get("style", "")
        self.defaults = data.get("defaults") or {}
        self.out_dir = Path(out_dir)
        self.state_path = Path(state_path)
        self.state = load_state(self.state_path)
        self.state.setdefault("shots", {})
        self.args = args
        self.client = client
        self.lock = threading.Lock()
        self.failed = []
        self.pending = []

    def get_state(self, sid):
        with self.lock:
            return dict(self.state["shots"].get(sid, {}))

    def patch_state(self, sid, key, value):
        with self.lock:
            entry = self.state["shots"].setdefault(sid, {})
            entry[key] = value
            save_state(self.state_path, self.state)

    def video_path(self, sid):
        return self.out_dir / (sid + ".mp4")

    # ---------- images ----------

    def run_image(self, shot):
        sid = str(shot["id"])
        if self.args.force:
            return self._generate_image(shot)
        entry = self.get_state(sid).get("image") or {}
        path = self.out_dir / entry["file"] if entry.get("file") else None
        if entry.get("status") == "done" and path and path.is_file():
            log("[%s] 图片已存在，跳过（--force 可重出）" % sid)
            return entry
        return self._generate_image(shot)

    def _generate_image(self, shot):
        sid = str(shot["id"])
        cfg = shot_image_cfg(shot, self.defaults)
        prompt = normalize_prompt(self.style, shot["prompt"], self.args.no_style)
        refs = [] if self.args.no_reference else shot_references(shot)
        deadline = time.time() + self.args.max_wait

        def attempt():
            return self.client.generate_image(
                prompt,
                size=str(cfg.get("size", "2K")),
                ratio=str(cfg.get("ratio", "16:9")),
                model=cfg.get("model"),
                images=refs or None,
            )

        log("[%s] 生图%s：%s" % (
            sid,
            "（参考图 %d 张）" % len(refs) if refs else "",
            prompt[:60] + ("…" if len(prompt) > 60 else "")))
        result = retry_call("[%s] 生图" % sid, attempt, deadline,
                            initial=3.0, factor=1.8, cap=60.0)
        suffix = image_suffix(result.get("url"))
        target = self.out_dir / (sid + suffix)
        if self.args.force:
            for old in self.out_dir.glob(sid + ".*"):
                if old.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
                    old.unlink()
        saved = self.client.save_image(result, target)
        entry = {
            "status": "done",
            "file": saved.name,
            "path": rel_to_root(saved),
            "url": result.get("url"),
            "model": cfg.get("model") or self.client.image_model,
            "size": str(cfg.get("size", "2K")),
            "ratio": str(cfg.get("ratio", "16:9")),
            "prompt": prompt,
            "reference": [rel_to_root(p) if not p.startswith(("http", "data:")) else p
                          for p in refs],
            "generated_at": now_iso(),
        }
        self.patch_state(sid, "image", entry)
        log("[%s] 图片完成：%s（%d B）" % (sid, entry["path"], saved.stat().st_size))
        return entry

    def ensure_image(self, shot):
        entry = self.get_state(str(shot["id"])).get("image") or {}
        path = self.out_dir / entry["file"] if entry.get("file") else None
        if entry.get("status") != "done" or not path or not path.is_file():
            return self._generate_image(shot)
        if not self.client.url_alive(entry.get("url")):
            log("[%s] 图片源 URL 失效，重出以取得新的公网地址" % shot["id"])
            return self._generate_image(shot)
        return entry

    # ---------- videos ----------

    def run_video(self, shot, force_all=False):
        sid = str(shot["id"])
        if not wants_video(shot, force_all):
            log("[%s] 未标记 video，跳过" % sid)
            return None
        if self.args.force:
            target = self.video_path(sid)
            if target.is_file():
                target.unlink()
        else:
            entry = self.get_state(sid).get("video") or {}
            if entry.get("status") == "done":
                path = self.out_dir / (sid + ".mp4")
                if path.is_file():
                    log("[%s] 视频已存在，跳过（--force 可重出）" % sid)
                    return entry
            if entry.get("status") == "pending" and entry.get("video_id"):
                age = time.time() - float(entry.get("submitted_ts", 0))
                if age < PENDING_TTL:
                    log("[%s] 续跑上次排队任务 %s" % (sid, entry["video_id"]))
                    return self._poll_and_save(shot, entry["video_id"],
                                               time.time() + self.args.max_wait)
        return self._start_video(shot)

    def _start_video(self, shot):
        sid = str(shot["id"])
        image = self.ensure_image(shot)
        if not image.get("url"):
            raise AgnesError("[%s] 没有可用的公网图片 URL，无法做首帧视频" % sid)
        cfg = shot_video_cfg(shot, self.defaults)
        prompt = " ".join(str(shot.get("video_prompt")
                               or (shot["prompt"] + DEFAULT_VIDEO_TAIL)).split())
        deadline = time.time() + self.args.max_wait

        def submit():
            return self.client.create_video(
                prompt,
                first_frame=image["url"],
                seconds=str(cfg.get("seconds", "5")),
                size=str(cfg.get("size", "720P")),
                aspect_ratio=str(cfg.get("aspect_ratio", "16:9")),
                model=cfg.get("model"),
            )

        log("[%s] 提交首帧视频（%ss，%s）" % (sid, cfg.get("seconds", "5"),
                                            cfg.get("aspect_ratio", "16:9")))
        result = retry_call("[%s] 提交视频" % sid, submit, deadline,
                            initial=20.0, factor=1.6, cap=180.0)
        video_id = result["video_id"]
        self.patch_state(sid, "video", {
            "status": "pending",
            "video_id": video_id,
            "task_id": result.get("task_id"),
            "prompt": prompt,
            "image_url": image.get("url"),
            "model": cfg.get("model") or self.client.video_model,
            "seconds": str(cfg.get("seconds", "5")),
            "submitted_ts": time.time(),
            "submitted_at": now_iso(),
        })
        log("[%s] 已入队 video_id=%s" % (sid, video_id))
        return self._poll_and_save(shot, video_id, deadline)

    def _poll_and_save(self, shot, video_id, deadline):
        sid = str(shot["id"])
        entry = self.get_state(sid).get("video") or {}
        model = entry.get("model")
        result = self.client.wait_video(video_id, deadline, model=model)
        url = result.get("url")
        if not url:
            raise AgnesError("[%s] 视频完成但返回没有 url：%s"
                             % (sid, json.dumps(result, ensure_ascii=False)[:300]))
        target = retry_call(
            "[%s] 下载视频" % sid,
            lambda: self.client.download(url, self.video_path(sid)),
            deadline, initial=5.0, factor=1.7, cap=60.0)
        entry.update({
            "status": "done",
            "video_id": video_id,
            "url": url,
            "file": target.name,
            "path": rel_to_root(target),
            "completed_at": now_iso(),
            "error": None,
        })
        self.patch_state(sid, "video", entry)
        log("[%s] 视频完成：%s（%d B）" % (sid, entry["path"], target.stat().st_size))
        return entry

    def record_failure(self, sid, stage, exc):
        entry = self.get_state(sid).get(stage) or {}
        entry.update({"status": "failed", "error": str(exc), "failed_at": now_iso()})
        self.patch_state(sid, stage, entry)
        self.failed.append((sid, stage, str(exc)))
        log("[%s] %s 失败：%s" % (sid, stage, exc))

    def record_pending(self, sid, exc):
        entry = self.get_state(sid).get("video") or {}
        if not entry.get("video_id"):
            entry.update({"status": "queued", "error": str(exc),
                          "queued_at": now_iso()})
            self.patch_state(sid, "video", entry)
        self.pending.append((sid, str(exc)))
        log("[%s] 队列未清空，已记录 queued/pending，稍后重跑即可续传：%s" % (sid, exc))

    # ---------- drivers ----------

    def run_images(self, shots):
        results = []
        jobs = max(1, int(self.args.jobs))
        with ThreadPoolExecutor(max_workers=jobs) as pool:
            futures = {pool.submit(self.run_image, s): s for s in shots}
            for future in as_completed(futures):
                shot = futures[future]
                sid = str(shot["id"])
                try:
                    results.append(future.result())
                except AgnesError as exc:
                    self.record_failure(sid, "image", exc)
                except Exception as exc:  # noqa: BLE001
                    traceback.print_exc()
                    self.record_failure(sid, "image", exc)
        return results

    def run_videos(self, shots, force_all=False):
        for shot in shots:
            sid = str(shot["id"])
            if not wants_video(shot, force_all):
                continue
            try:
                self.run_video(shot, force_all=force_all)
            except AgnesError as exc:
                if is_queue_full(exc):
                    self.record_pending(sid, exc)
                else:
                    self.record_failure(sid, "video", exc)
            except Exception as exc:  # noqa: BLE001
                traceback.print_exc()
                self.record_failure(sid, "video", exc)


def cmd_status(data, state_path, out_dir):
    state = load_state(state_path)
    entries = state.get("shots", {})
    print("%-8s %-10s %-10s %s" % ("镜头", "图片", "视频", "文件"))
    for shot in data["shots"]:
        sid = str(shot["id"])
        entry = entries.get(sid, {})
        img = entry.get("image") or {}
        vid = entry.get("video") or {}
        files = []
        if img.get("file"):
            files.append(img["file"])
        if vid.get("file"):
            files.append(vid["file"])
        print("%-8s %-10s %-10s %s" % (
            sid,
            img.get("status", "-"),
            vid.get("status", "-"),
            " ".join(files) or "-",
        ))
    return 0


def build_parser():
    ap = argparse.ArgumentParser(description="zhidiao 分镜素材：Agnes 生图 / 首帧图生视频")
    ap.add_argument("--env-file", help="默认项目根 .env")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("check", help="检查配置")

    helps = {"images": "生成分镜图片", "videos": "首帧图生视频",
             "all": "先生图再视频", "status": "查看素材状态"}
    for name in ("images", "videos", "all", "status"):
        p = sub.add_parser(name, help=helps[name])
        p.add_argument("--slug", required=True)
        p.add_argument("--shots-file")
        p.add_argument("--out-dir")
        p.add_argument("--only", help="逗号分隔的镜头 id")
        p.add_argument("--force", action="store_true", help="重出已有素材")
        p.add_argument("--no-style", action="store_true", help="不拼接全局 style")
        p.add_argument("--no-reference", action="store_true", help="忽略 shots.json 里的参考图")
        p.add_argument("--max-wait", type=int, default=1800,
                       help="单个任务最长等待秒数（videos 默认 3600）")
        p.add_argument("--jobs", type=int, default=2, help="生图并发数（默认 2）")
        p.add_argument("--all-videos", action="store_true",
                       help="videos/all 时给所有镜头都做视频")
        p.add_argument("--image-model")
        p.add_argument("--video-model")
    return ap


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.cmd == "check":
        return check_config(args.env_file)

    shots_path = as_path(args.shots_file or "content/%s/shots.json" % args.slug)
    data = load_shots(shots_path)
    out_dir = as_path(args.out_dir or "content/%s/shots" % args.slug)
    state_path = out_dir / "assets.json"

    if args.cmd == "status":
        return cmd_status(data, state_path, out_dir)

    if args.cmd in ("videos", "all") and args.max_wait == 1800:
        args.max_wait = 3600

    client = AgnesClient(image_model=args.image_model, video_model=args.video_model,
                         env_file=args.env_file)
    runner = ShotRunner(data, out_dir, state_path, args, client)
    shots = select_shots(data["shots"], args.only)

    if args.cmd in ("images", "all"):
        runner.run_images(shots)
    if args.cmd in ("videos", "all"):
        runner.run_videos(shots, force_all=args.all_videos)

    done_images = sum(1 for s in shots
                      if (runner.get_state(str(s["id"])).get("image") or {}).get("status") == "done")
    done_videos = sum(1 for s in shots
                      if (runner.get_state(str(s["id"])).get("video") or {}).get("status") == "done")
    print("汇总：图片 %d/%d，视频 %d，失败 %d，待续 %d；状态 %s"
          % (done_images, len(shots), done_videos, len(runner.failed),
             len(runner.pending), state_path))
    if runner.failed:
        return 1
    return 2 if runner.pending else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AgnesError as exc:
        print("错误：%s" % exc, file=sys.stderr)
        raise SystemExit(1)
