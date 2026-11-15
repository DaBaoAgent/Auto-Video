# -*- coding: utf-8 -*-
"""tianshu · 交付打包

出稿目录约定（peiyin 那条线一路沿用）：
  出稿/<编号>_<选题>/<编号>_<选题>_tianshu<NN>秒.mp4   样片
  出稿/<编号>_<选题>/<编号>_<选题>_tianshu成片.mp4     成片
  同名 .srt / .jpg(海报) / _说明.md

质检不过不许交付，除非 --force（并把 fail 项写进说明里，别装作没发生）。
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import time
from pathlib import Path

import tcfg


def poster(video: Path, dst: Path) -> bool:
    dur = tcfg.probe(video).get("dur", 0) or 1
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{dur * 0.2:.2f}", "-i", str(video),
                    "-frames:v", "1", "-vf", "scale=720:-2", "-q:v", "3", str(dst)],
                   capture_output=True)
    return dst.exists()


def run(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(prog="tianshu.py publish")
    ap.add_argument("name")
    ap.add_argument("--to", default="", help="交付目录；默认 出稿/<编号>_<选题>")
    ap.add_argument("--sample", action="store_true", help="按样片命名（_tianshuNN秒）")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    proj = tcfg.load_project(a.name)
    video = pd / "out" / f"{a.name}.mp4"
    if not video.exists():
        print(f"缺成片 {video}（先跑 mux）")
        return 1

    qa = tcfg.load_json(pd / "out" / "qa.json", {})
    verdict = qa.get("verdict", "未质检")
    if verdict != "PASS" and not a.force:
        print(f"质检结论 {verdict}，不交付。修完再来，或 --force 并接受说明里写明缺陷。")
        return 1

    ep, title = proj.get("episode") or "", proj.get("title") or a.name
    base = f"{ep}_{title}" if ep else title
    tag = base
    default_dir = Path(tcfg.cfg()["paths"]["publish_root"]) / base
    to = Path(a.to) if a.to else default_dir
    to.mkdir(parents=True, exist_ok=True)

    dur = tcfg.probe(video).get("dur", 0)
    suffix = f"_tianshu{int(round(dur))}秒" if a.sample else "_tianshu成片"
    name = f"{tag}{suffix}"

    mp4 = to / f"{name}.mp4"
    shutil.copyfile(video, mp4)
    srt = pd / "out" / f"{a.name}.srt"
    if srt.exists():
        shutil.copyfile(srt, to / f"{name}.srt")
    poster(video, to / f"{name}.jpg")

    cfg = tcfg.cfg()
    lines = [
        f"# {title} · tianshu 管线",
        "",
        f"- 生成时间：{time.strftime('%Y-%m-%d %H:%M')}",
        f"- 成片：`{name}.mp4`  {dur:.2f}s  {tcfg.probe(video).get('w')}×{tcfg.probe(video).get('h')}"
        f"@{tcfg.probe(video).get('fps')}fps",
        f"- 镜数：{len(tcfg.shots_of(a.name))}   质检：{verdict}"
        + ("（含未通过项，见 qa.json）" if verdict != "PASS" else ""),
        f"- 实测响度：{qa.get('loudness_lufs', '—')} LUFS",
        "",
        "## 定版参数（唯一来源 `tianshu/pipeline.json`）",
        "",
        f"- 出图：qwen-image-2.1 Q4 · {cfg['stills']['size']} · {cfg['stills']['steps']} 步 · "
        f"cfg {cfg['stills']['cfg']} · shift {cfg['stills']['shift']}",
        f"- 后期：LVL {cfg['post']['lvl']} / 对比 {cfg['post']['contrast']} / "
        f"黑位 {cfg['post']['black_scale']}+{cfg['post']['black_lift']} / "
        f"颗粒 {cfg['post']['grain_sigma']} 纸纹 {cfg['post']['paper_sigma']}",
        f"- 出视频：Wan2.2 TI2V-5B Q4 · {cfg['i2v']['length']} 帧 · {cfg['i2v']['steps']} 步 · "
        f"cfg {cfg['i2v']['cfg']} · shift {cfg['i2v']['shift']} · uni_pc",
        f"- 色彩锚定：向 post 底图拉 {cfg['i2v'].get('anchor_strength', 0.85)}",
        f"- 音频：loudnorm {cfg['audio']['lufs']} LUFS / TP {cfg['audio']['true_peak']} dBTP，AAC 回削 {cfg['audio']['aac_trim_db']}dB",
        "",
        "## 生产链",
        "",
        "配音+口播稿 → beats → plan（3–6s 一镜）→ scaffold → stills（本地 Qwen）"
        "→ post（逐镜锚色）→ i2v（本地 Wan，只给氛围动态）→ anchor → cam（后期运镜）"
        "→ concat → mux → qa → publish",
        "",
        "## 已知事项",
        "",
    ]
    for f in (qa.get("fails") or []):
        lines.append(f"- {f['id']}：{'；'.join(f['notes'])}")
    if not (qa.get("fails") or []):
        lines.append("- 无")
    lines += ["", "复核入口：`python tianshu/scripts/tianshu.py qa %s`" % a.name, ""]

    (to / f"{name}_说明.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"交付 -> {to}")
    for f in sorted(to.iterdir()):
        if f.stem.startswith(tag):
            print(f"  {f.name}  {f.stat().st_size / 1024 / 1024:.2f} MB")
    return 0
