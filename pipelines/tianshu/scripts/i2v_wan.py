# -*- coding: utf-8 -*-
"""tianshu · 图生视频（Wan2.2 TI2V-5B Q4 / ComfyUI HTTP）

只喂「没有人」的底图。动态只给氛围：云、水、火、烟、尘。
相机一律不动 —— 运镜全部放到后期 cam2d 做，这样重挑运镜不用重跑视频。

定版：960×720（std）/ 1152×864（big，横移和长镜用，给后期裁切留 20% 余量）
      121 帧 / 24fps / 20 步 / cfg 5.0 / uni_pc·simple / ModelSamplingSD3 shift 8
"""
from __future__ import annotations

import argparse
import json
import shutil
import time
import urllib.request
import uuid
from pathlib import Path

import tcfg

NEG = (
    "色调艳丽，过曝，静态，细节模糊不清，字幕，风格，作品，画作，画面，静止，整体发灰，"
    "最差质量，低质量，JPEG压缩残留，丑陋的，残缺的，多余的手指，画得不好的手部，"
    "画得不好的脸部，畸形的，毁容的，形态畸形的肢体，手指融合，静止不动的画面，"
    "杂乱的背景，三条腿，背景人很多，倒着走，三维渲染，写实，照片级，景深，体积光，体积阴影"
)


def build_wf(ref_name: str, prompt: str, seed: int, w: int, h: int,
             shift: float, cfg: float, steps: int, length: int, fps: int,
             neg: str | None = None, prefix: str = "tianshu") -> dict:
    m = tcfg.cfg()["models"]["wan"]
    return {
        "37": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": m["unet"]}},
        "38": {"class_type": "CLIPLoader",
               "inputs": {"clip_name": m["clip"], "type": "wan", "device": "default"}},
        "39": {"class_type": "VAELoader", "inputs": {"vae_name": m["vae"]}},
        "48": {"class_type": "ModelSamplingSD3", "inputs": {"model": ["37", 0], "shift": shift}},
        "56": {"class_type": "LoadImage", "inputs": {"image": ref_name}},
        "55": {"class_type": "Wan22ImageToVideoLatent",
               "inputs": {"vae": ["39", 0], "width": w, "height": h,
                          "length": length, "batch_size": 1, "start_image": ["56", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["38", 0], "text": prompt}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["38", 0], "text": neg or NEG}},
        "3": {"class_type": "KSampler",
              "inputs": {"seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "uni_pc",
                         "scheduler": "simple", "denoise": 1.0, "model": ["48", 0],
                         "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["55", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["39", 0]}},
        "57": {"class_type": "CreateVideo", "inputs": {"images": ["8", 0], "fps": fps}},
        "58": {"class_type": "SaveVideo",
               "inputs": {"video": ["57", 0], "filename_prefix": prefix,
                          "format": "auto", "codec": "auto"}},
    }


def submit(wf: dict) -> str:
    req = urllib.request.Request(
        tcfg.server() + "/prompt",
        data=json.dumps({"prompt": wf, "client_id": str(uuid.uuid4())}).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())["prompt_id"]


def check(pid: str) -> dict | None:
    try:
        with urllib.request.urlopen(f"{tcfg.server()}/history/{pid}", timeout=15) as r:
            return json.loads(r.read()).get(pid)
    except Exception:
        return None


def wait(pid: str, timeout: int = 3600) -> tuple[dict | None, float]:
    t0, last = time.time(), 0.0
    while time.time() - t0 < timeout:
        res = check(pid)
        if res:
            return res, time.time() - t0
        el = time.time() - t0
        if el - last >= 60:
            print(f"  …{el:.0f}s", flush=True)
            last = el
        time.sleep(5)
    return None, time.time() - t0


def find_video(res: dict) -> tuple[Path | None, str]:
    for out in (res.get("outputs") or {}).values():
        for key in ("videos", "gifs", "images"):
            for item in out.get(key, []) or []:
                fn = item.get("filename")
                if fn and fn.lower().endswith((".mp4", ".webm", ".mov")):
                    return tcfg.comfy_output() / item.get("subfolder", "") / fn, fn
    return None, ""


def alive() -> bool:
    try:
        with urllib.request.urlopen(tcfg.server() + "/system_stats", timeout=8):
            return True
    except Exception:
        return False


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py i2v")
    ap.add_argument("name")
    ap.add_argument("--jobs", default="")
    ap.add_argument("--only", default="")
    ap.add_argument("--tier", default="", choices=["", "std", "big"])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--timeout", type=int, default=3600)
    a = ap.parse_args(argv)

    c = tcfg.cfg()["i2v"]
    pd = tcfg.project_dir(a.name)
    proj = tcfg.load_project(a.name)
    ratio = proj.get("ratio", "4:3")

    jobs_path = Path(a.jobs) if a.jobs else pd / "work" / "jobs_i2v.json"
    raw = tcfg.load_json(jobs_path)
    if not raw:
        print(f"缺 {jobs_path}，先跑 scaffold")
        return 1
    jobs = raw["jobs"] if isinstance(raw, dict) else raw
    if a.only:
        ids = {s.strip() for s in a.only.split(",") if s.strip()}
        jobs = [j for j in jobs if j["id"] in ids]

    out_dir = tcfg.pdir(a.name, "i2v")
    state_path = pd / "work" / "state_i2v.json"
    state = tcfg.load_json(state_path, {})
    from PIL import Image

    for j in jobs:
        jid = j["id"]
        final = out_dir / f"{jid}.mp4"
        if final.exists():
            print(f"[{jid}] 已有片段，跳过")
            continue

        tier = j.get("tier") or a.tier or "std"
        if j.get("res"):
            w, h = (int(v) for v in str(j["res"]).lower().split("x"))
        else:
            w, h = tcfg.ratio_res(ratio, "i2v_big" if tier == "big" else "i2v_std")

        src = pd / j["image"] if not Path(j["image"]).is_absolute() else Path(j["image"])
        if not src.exists():
            print(f"[{jid}] 缺底图 {src}（先跑 post）")
            continue

        wf = None
        ref_name = f"tianshu_{jid}.png"
        if not state.get(jid):
            tcfg.comfy_input().mkdir(parents=True, exist_ok=True)
            Image.open(src).convert("RGB").resize((w, h), Image.LANCZOS).save(tcfg.comfy_input() / ref_name)
            wf = build_wf(ref_name, j["prompt"], int(j.get("seed", 42)), w, h,
                          float(j.get("shift", c["shift"])), float(j.get("cfg", c["cfg"])),
                          int(j.get("steps") or c["steps"]),
                          int(j.get("length") or c["length"]), int(c["fps"]), j.get("neg"),
                          prefix=f"tianshu_{jid}")

        if a.dry_run:
            dd = tcfg.pdir(a.name, "work_dryrun")
            tcfg.save_json(dd / f"wf_i2v_{jid}.json", wf or {"note": "state 已有 prompt_id", "id": jid})
            print(f"[{jid}] dry-run {w}x{h} tier={tier}")
            continue

        if not alive():
            print(f"ComfyUI 不在线：{tcfg.server()}")
            return 1

        pid = state.get(jid)
        if pid:
            print(f"[{jid}] 续跑 prompt_id={pid}", flush=True)
        else:
            pid = submit(wf)
            state[jid] = pid
            tcfg.save_json(state_path, state)
            print(f"[{jid}] 提交 prompt_id={pid}  {w}x{h} tier={tier}", flush=True)

        res = check(pid)
        if res is None:
            res, el = wait(pid, a.timeout)
        else:
            el = 0.0
        if res is None:
            print(f"[{jid}] 超时")
            continue
        st = res.get("status", {})
        if st.get("status_str") == "error":
            print(f"[{jid}] 出错 {str(st.get('messages', [])[:2])[:300]}")
            state.pop(jid, None)
            tcfg.save_json(state_path, state)
            continue
        vid, fn = find_video(res)
        if vid is None or not vid.exists():
            print(f"[{jid}] 没有视频输出：{json.dumps(res.get('outputs', {}), ensure_ascii=False)[:300]}")
            continue
        shutil.copyfile(vid, final)
        print(f"[{jid}] 完成 {final}  {el:.0f}s", flush=True)
    return 0
