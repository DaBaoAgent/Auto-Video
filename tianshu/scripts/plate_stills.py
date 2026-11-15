# -*- coding: utf-8 -*-
"""tianshu · 定帧（Qwen-Image 2.1 Q4 / ComfyUI HTTP）

定版参数（改之前先看 pipeline.json 里的依据）：
  qwen-image-2.1-Q4_K_M + qwen3vl_8b_w4a8 + qwen_image_2.1_vae_bf16
  1024×768 / euler·simple / 25 步 / cfg 1.5 / ModelSamplingAuraFlow shift 3.1 / resolution 0

两条硬约束：
  * cfg 不能等于 1.0 —— guidance-distilled 下负词分支会被整条跳过，
    参考图里的雾、锯齿石柱会被原样照抄进画面；
  * 参考图只能给一张（多图会把色板打架），且必须复制进 ComfyUI/input 的纯 ASCII 名字。
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


def build(job: dict, size: tuple[int, int]) -> dict:
    c = tcfg.cfg()
    st, m = c["stills"], c["models"]["qwen"]
    w, h = size
    wf = {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": m["unet"]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": m["clip"], "type": m["clip_type"]}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": m["vae"]}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": st["shift"]}},
        "7": {"class_type": "TextEncodeQwenImage21", "inputs": {
            "clip": ["2", 0],
            "prompt": job["prompt"],
            "negative_prompt": job.get("negative") or tcfg.NEG_DEFAULT,
            "vae": ["3", 0],
            "resolution": st.get("resolution", 0),
        }},
        "8": {"class_type": "KSampler", "inputs": {
            "model": ["4", 0], "seed": int(job.get("seed", 7)), "steps": int(st["steps"]),
            "cfg": float(st["cfg"]), "sampler_name": st["sampler"], "scheduler": st["scheduler"],
            "denoise": 1.0, "positive": ["7", 0], "negative": ["7", 1], "latent_image": ["7", 2]}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0],
                                                     "filename_prefix": f"tianshu_{job['id']}"}},
    }
    # 尺寸是从 TextEncodeQwenImage21 的 latent 输出拿的（64 通道，跟 qwen2.1 VAE 对齐）：
    #   resolution=0 + 有参考图 -> 画布 = 参考图尺寸（这就是 1024×768 的来路）
    #   resolution=0 + 无参考图 -> 画布 1024×1024 正方形
    # 所以参考图必须先缩到目标画布尺寸再送进 ComfyUI，且宽高都是 32 的倍数。
    ref = job.get("ref")
    if ref:
        src = Path(ref)
        if not src.is_absolute():
            src = tcfg.project_dir(job.get("_project", "")) / src
        if not src.exists():
            raise FileNotFoundError(src)
        from PIL import Image
        name = f"tianshu_ref_{job['id']}.png"
        tcfg.comfy_input().mkdir(parents=True, exist_ok=True)
        im = Image.open(src).convert("RGB")
        if im.size != (w, h):
            im = im.resize((w, h), Image.LANCZOS)
        im.save(tcfg.comfy_input() / name)
        wf["5"] = {"class_type": "LoadImage", "inputs": {"image": name, "upload": "image"}}
        wf["7"]["inputs"]["images.image_1"] = ["5", 0]
    elif (w, h) != (1024, 1024):
        print(f"[{job['id']}] 警告：这镜没有参考图，出图会是 1024×1024 方图；"
              f"要 {w}×{h} 请给 ref_image（同场已过审底图）")
    return wf


def submit(wf: dict) -> str:
    req = urllib.request.Request(
        tcfg.server() + "/prompt",
        data=json.dumps({"prompt": wf, "client_id": str(uuid.uuid4())}).encode(),
        headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())["prompt_id"]


def wait(pid: str, timeout: int = 1800) -> tuple[dict | None, float]:
    t0, last = time.time(), 0.0
    while time.time() - t0 < timeout:
        try:
            with urllib.request.urlopen(f"{tcfg.server()}/history/{pid}", timeout=15) as r:
                h = json.loads(r.read())
        except Exception:
            time.sleep(3)
            continue
        if pid in h:
            return h[pid], time.time() - t0
        el = time.time() - t0
        if el - last >= 30:
            print(f"  …{el:.0f}s", flush=True)
            last = el
        time.sleep(4)
    return None, time.time() - t0


def alive() -> bool:
    try:
        with urllib.request.urlopen(tcfg.server() + "/system_stats", timeout=8):
            return True
    except Exception:
        return False


def pick_ids(jobs: list[dict], only: str, frm: int, to: int) -> list[dict]:
    if only:
        ids = {s.strip() for s in only.split(",") if s.strip()}
        jobs = [j for j in jobs if j["id"] in ids]
    if frm or to:
        jobs = jobs[(frm - 1 if frm else 0):(to or len(jobs))]
    return jobs


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py stills")
    ap.add_argument("name")
    ap.add_argument("--jobs", default="")
    ap.add_argument("--only", default="")
    ap.add_argument("--from", dest="frm", type=int, default=0)
    ap.add_argument("--to", type=int, default=0)
    ap.add_argument("--size", default="", help="覆盖 pipeline.json 的 plate 尺寸，如 1280x720")
    ap.add_argument("--dry-run", action="store_true", help="只生成工作流 JSON，不提交")
    ap.add_argument("--timeout", type=int, default=1800)
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    jobs_path = Path(a.jobs) if a.jobs else pd / "work" / "jobs_stills.json"
    raw = tcfg.load_json(jobs_path)
    if not raw:
        print(f"缺 {jobs_path}，先跑 scaffold")
        return 1
    jobs = raw["jobs"] if isinstance(raw, dict) else raw
    jobs = pick_ids(jobs, a.only, a.frm, a.to)
    if not jobs:
        print("没有要出的镜头")
        return 1

    size = tuple(int(v) for v in (a.size or tcfg.cfg()["stills"]["size"]).lower().split("x"))
    out = tcfg.pdir(a.name, "plates")
    state_path = pd / "work" / "state_stills.json"
    state = tcfg.load_json(state_path, {})

    if a.dry_run:
        dd = tcfg.pdir(a.name, "work_dryrun")
        for j in jobs:
            jj = dict(j, _project=a.name)
            tcfg.save_json(dd / f"wf_still_{j['id']}.json", build(jj, size))
        print(f"dry-run：{len(jobs)} 个工作流已写到 {dd}（未提交）")
        return 0

    if not alive():
        print(f"ComfyUI 不在线：{tcfg.server()} —— 先起 ComfyUI 再跑 stills")
        return 1

    for j in jobs:
        final = out / f"{j['id']}.png"
        if final.exists():
            print(f"[{j['id']}] 已有底图，跳过")
            continue
        pid = state.get(j["id"])
        if pid:
            print(f"[{j['id']}] 续跑 prompt_id={pid}")
        else:
            wf = build(dict(j, _project=a.name), size)
            pid = submit(wf)
            state[j["id"]] = pid
            tcfg.save_json(state_path, state)
            print(f"[{j['id']}] 提交 prompt_id={pid}", flush=True)
        res, el = wait(pid, a.timeout)
        if res is None:
            print(f"[{j['id']}] 超时（任务还在 ComfyUI 队列里，可重跑续上）")
            continue
        st = res.get("status", {})
        if st.get("status_str") == "error":
            print(f"[{j['id']}] 出错 {str(st.get('messages', [])[:2])[:300]}")
            state.pop(j["id"], None)
            tcfg.save_json(state_path, state)
            continue
        files = [im.get("filename") for o in res.get("outputs", {}).values() for im in o.get("images", [])]
        if not files:
            print(f"[{j['id']}] 没有出图")
            continue
        src = tcfg.comfy_output() / files[0]
        if not src.exists():
            print(f"[{j['id']}] 输出文件缺失 {src}")
            continue
        shutil.copyfile(src, final)
        print(f"[{j['id']}] 完成 {final}  {el:.0f}s", flush=True)
    return 0
