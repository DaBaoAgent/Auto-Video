# -*- coding: utf-8 -*-
"""tianshu · 镜头表 → 四个阶段 jobs

work/shots.json 是人写的唯一画面来源（画面描述、色板、运镜、是否进图生视频），
分镜时码来自 work/shot_plan.json。这一步把两者合到一起，生成：

  work/jobs_stills.json   Qwen 出定帧
  work/jobs_post.json     统一后期（含逐镜亮度/饱和目标）
  work/jobs_i2v.json      图生视频（跳过 no_i2v 的镜头）
  work/jobs_cam.json      后期 2D 运镜

shots.json 每条基础字段：
  {"shot_id":"S001", "subject":"...", "scene":"...", "motion":"...",
   "palette":["#bcc390", ...], "ref":"c15", "move":"pan_right",
   "amount":0.14, "no_i2v":false, "res":"1152x864"}
"""
from __future__ import annotations

import argparse
import copy
from pathlib import Path

import tcfg

MOVE_CYCLE = ["pan_right", "push_in", "drift", "tilt_down", "orbit_right", "pan_left", "pull_out"]


def resolve_target(shot: dict, refstats: dict | None, base: dict) -> tuple[float, float, str]:
    if shot.get("target_val") and shot.get("target_sat"):
        return float(shot["target_val"]), float(shot["target_sat"]), "explicit"
    ref = shot.get("ref")
    if ref and refstats and ref in refstats.get("frames", {}):
        f = refstats["frames"][ref]
        return float(f["val"]), float(f["sat"]), f"frame {ref}"
    b = (refstats or {}).get("baseline", {}).get("median_1024x768") or base
    return float(b.get("val", 60.0)), float(b.get("sat", 22.0)), "baseline median"


def still_prompt(shot: dict, palette: list[str]) -> str:
    parts = [tcfg.STYLE_HEAD, "Composition: " + shot.get("subject", "").strip()]
    if palette:
        parts.append("Palette: " + " ".join(palette) + ".")
    parts.append(tcfg.STYLE_TAIL)
    return " ".join(p.strip() for p in parts if p.strip())


def i2v_prompt(shot: dict) -> str:
    scene = (shot.get("scene") or shot.get("subject") or "").strip()
    motion = (shot.get("motion") or "Fine dust drifts slowly through the air; everything else stays still.").strip()
    return (f"Hand-painted flat cel animation, 1983 Shanghai Animation Film Studio style. {scene} "
            f"Thin near-black ink contour, flat colour blocks, no gradient shading, visible paper grain. "
            f"{motion} {tcfg.I2V_TAIL}")


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py scaffold")
    ap.add_argument("name")
    ap.add_argument("--fresh", action="store_true", help="用分镜表重建 shots.json（丢弃人工字段）")
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    plan = tcfg.load_json(pd / "work" / "shot_plan.json")
    if not plan:
        print("缺 work/shot_plan.json，先跑 plan")
        return 1
    shots_raw = tcfg.load_json(pd / "work" / "shots.json", {"shots": []})
    manual = shots_raw["shots"] if isinstance(shots_raw, dict) else shots_raw
    refstats = tcfg.load_json(pd / "work" / "refstats.json")
    base = tcfg.cfg()["post"]

    by_id = {str(s.get("shot_id") or s.get("id")): s for s in manual if (s.get("shot_id") or s.get("id"))}
    shots, missing_subject, no_palette = [], [], []

    for i, p in enumerate(plan["shots"]):
        sid = p["shot_id"]
        m = {} if a.fresh else (by_id.get(sid) or (manual[i] if i < len(manual) and not by_id else {}))
        s = {"shot_id": sid, "start": p["start"], "end": p["end"], "dur": p["dur"],
             "narration": m.get("narration") or p["narration"],
             "para": p["para"]}
        for k in ("subject", "scene", "motion", "palette", "ref", "move", "amount", "zoom",
                  "rise", "no_i2v", "res", "target_val", "target_sat", "warm", "extra_gamma",
                  "ref_image", "seed", "trim", "note"):
            if m.get(k) not in (None, "", []):
                s[k] = copy.deepcopy(m[k])

        tval, tsat, src = resolve_target(s, refstats, base)
        s["target_val"], s["target_sat"], s["target_source"] = tval, tsat, src
        if not s.get("palette") and s.get("ref") and refstats:
            f = refstats["frames"].get(s["ref"])
            if f:
                s["palette"] = f["palette"]
        if not s.get("palette"):
            no_palette.append(sid)
        if not s.get("subject"):
            missing_subject.append(sid)
        if not s.get("move"):
            s["move"] = MOVE_CYCLE[i % len(MOVE_CYCLE)]
        s["seed"] = tcfg.seed_of(s)
        shots.append(s)

    jobs_stills, jobs_post, jobs_i2v, jobs_cam = [], [], [], []
    for s in shots:
        sid = s["shot_id"]
        jobs_stills.append({
            "id": sid, "seed": s["seed"],
            "prompt": still_prompt(s, s.get("palette") or []),
            "negative": tcfg.NEG_DEFAULT,
            **({"ref": s["ref_image"]} if s.get("ref_image") else {}),
        })
        post_job = {"id": sid, "image": f"plates/{sid}.png",
                    "target_val": s["target_val"], "target_sat": s["target_sat"],
                    "seed": s["seed"], "target_source": s["target_source"]}
        for k in ("warm", "extra_gamma"):
            if s.get(k) is not None:
                post_job[k] = s[k]
        jobs_post.append(post_job)

        if not s.get("no_i2v"):
            job = {"id": sid, "image": f"post/{sid}.png", "seed": s["seed"],
                   "prompt": i2v_prompt(s)}
            if s.get("res"):
                job["res"] = s["res"]
            jobs_i2v.append(job)

        cam = {"id": sid, "src": f"anchored/{sid}.mp4", "fallback": f"post/{sid}.png",
               "dur": s["dur"], "move": s["move"]}
        for k in ("amount", "zoom", "rise"):
            if s.get(k) is not None:
                cam[k] = s[k]
        if s.get("trim"):
            cam["trim"] = s["trim"]
        jobs_cam.append(cam)

    tcfg.save_json(pd / "work" / "shots.json", {"shots": shots})
    tcfg.save_json(pd / "work" / "jobs_stills.json", {"jobs": jobs_stills})
    tcfg.save_json(pd / "work" / "jobs_post.json", {"jobs": jobs_post})
    tcfg.save_json(pd / "work" / "jobs_i2v.json", {"jobs": jobs_i2v})
    tcfg.save_json(pd / "work" / "jobs_cam.json", {"jobs": jobs_cam})

    print(f"{len(shots)} 镜 -> 四个 jobs（stills {len(jobs_stills)} / post {len(jobs_post)} / "
          f"i2v {len(jobs_i2v)} / cam {len(jobs_cam)}）")
    if missing_subject:
        print(f"  缺画面描述 subject：{len(missing_subject)} 镜 {missing_subject[:12]}"
              "  → 这些图的提示词只有风格骨架，必须补")
    if no_palette:
        print(f"  缺色板 palette：{len(no_palette)} 镜 {no_palette[:12]}"
              "  → 跑 refstats 后给 shots.json 填 ref，或直接写 hex")
    print(f"  -> {pd / 'work' / 'shots.json'}")
    return 0
