# -*- coding: utf-8 -*-
"""tianshu · 编排 CLI

一条镇魔塔式的片子，按下面这条链走：

  配音.wav + 口播稿 ──beats──> narration_beats.json
                          ──plan───> shot_plan.json（语义切分，3–6s 一镜）
                          ──scaffold──> shots.json + 四个 jobs 文件
  jobs_stills ──stills──> plates/   （Qwen-Image 2.1 Q4，本地 ComfyUI）
             ──post───> post/     （统一后期：亮度/饱和逐镜锚定 + 原片颗粒纸纹）
             ──i2v────> i2v/      （Wan2.2 TI2V-5B Q4，只给氛围动态）
             ──anchor─> anchored/ （逐帧色彩锚定，压住 5 秒漂移）
             ──cam────> cam/      （后期 2D 运镜，推拉摇移全在这里）
             ──concat─> out/<名>_video.mp4
             ──mux────> out/<名>.mp4（配音 + loudnorm）
             ──qa─────> out/qa.json + 抽帧联系表
             ──publish> 出稿/<编号>_<选题>/

用法：
  python tianshu/scripts/tianshu.py doctor
  python tianshu/scripts/tianshu.py new zhenmota --episode 026 --title 镇魔塔 --src "D:/.../026_镇魔塔_水墨S级"
  python tianshu/scripts/tianshu.py beats zhenmota
  ...
"""
from __future__ import annotations

import importlib
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import tcfg  # noqa: E402  （只依赖标准库，先于依赖检查导入）

STAGES = {
    # 阶段名     模块                 一句说明
    "beats":   ("stage_beats",   "配音 + 口播稿 → 逐句时码（无 ASR 也能做）"),
    "plan":    ("stage_plan",    "逐句时码 → 分镜表（语义边界，单镜 3–6s）"),
    "scaffold": ("stage_scaffold", "分镜表 → shots.json + 四个阶段 jobs"),
    "refstats": ("style_refstats", "原片抽帧 → 亮度/饱和基线，供逐镜对位取色"),
    "stills":  ("plate_stills",  "Qwen-Image 2.1 Q4 出定帧（本地 ComfyUI）"),
    "post":    ("post_unify",    "统一后期：逐镜亮度/饱和锚定 + 原片颗粒纸纹"),
    "i2v":     ("i2v_wan",       "Wan2.2 TI2V-5B Q4 图生视频（只给氛围动态）"),
    "anchor":  ("anchor_color",  "I2V 逐帧色彩锚定，压住 5 秒内的漂移"),
    "cam":     ("cam2d",         "后期 2D 运镜：推/拉/横移/跟拍/升降"),
    "concat":  ("shot_concat",   "按分镜顺序拼接 + 时长对账 + 黑帧检测"),
    "mux":     ("audio_mux",     "配音 + 混音 + loudnorm −14 LUFS"),
    "qa":      ("qa_check",      "逐镜时长/尺寸/亮度/饱和质检 + 黑帧"),
    "sheet":   ("storyboard",    "分镜联系表（审片用的一张图）"),
    "publish": ("publish_pack",  "成片 + srt + poster + 说明 交付到出稿目录"),
    "all":     ("__all__",       "整条链跑一遍"),
}

ORDER = ["beats", "plan", "scaffold", "stills", "post", "i2v", "anchor",
         "cam", "concat", "mux", "qa", "sheet", "publish"]


# ------------------------------------------------------------------ 依赖守卫
def _has_deps() -> bool:
    try:
        import numpy  # noqa: F401
        import PIL     # noqa: F401
        return True
    except Exception:
        return False


def ensure_deps() -> None:
    """把 numpy/PIL 缺失的 python 自动换成能跑的那一个（本机 python 常是裸运行时）。"""
    if _has_deps() or os.environ.get("TIANSHU_REEXEC") == "1":
        if not _has_deps():
            sys.exit("缺 numpy / Pillow，且已尝试换解释器。请先 pip install numpy pillow")
        return
    for cand in tcfg.cfg()["paths"].get("python_candidates", []):
        exe = cand if cand == "python" else cand
        if cand != "python" and not Path(cand).exists():
            continue
        try:
            ok = subprocess.run([exe, "-c", "import numpy, PIL"],
                                capture_output=True, timeout=60).returncode == 0
        except Exception:
            continue
        if ok:
            env = dict(os.environ, TIANSHU_REEXEC="1")
            print(f"[tianshu] 换用解释器：{exe}", flush=True)
            raise SystemExit(subprocess.run([exe, str(Path(__file__).resolve()),
                                             *sys.argv[1:]], env=env).returncode)
    sys.exit("没有可用的 python（需要 numpy + Pillow）。改 pipeline.json 的 paths.python_candidates")


# ------------------------------------------------------------------ doctor
def doctor() -> int:
    import shutil
    import urllib.request

    c = tcfg.cfg()
    print("== tianshu · doctor ==")
    print(f"配置        {tcfg.CFG_PATH}")
    print(f"解释器      {sys.executable}")
    ok = True

    for exe in ("ffmpeg", "ffprobe"):
        p = shutil.which(exe)
        print(f"{exe:<11} {'OK  ' + p if p else 'MISSING（ffmpeg 必须在 PATH）'}")
        ok &= bool(p)

    srv = tcfg.server()
    try:
        with urllib.request.urlopen(srv + "/system_stats", timeout=8) as r:
            import json as _j
            st = _j.loads(r.read())
        dev = (st.get("devices") or [{}])[0]
        free = dev.get("vram_free", 0) / (1024 ** 3)
        print(f"ComfyUI     OK  {srv}  {dev.get('name', '')}  空闲显存 {free:.1f} GB")
    except Exception as e:
        print(f"ComfyUI     OFFLINE  {srv}  ({type(e).__name__})")
        print("            → 出图/出视频需要它在线：启动 portable 里的 main.py --port 8188")
        ok = False

    cdir = tcfg.comfy_dir()
    print(f"ComfyUI 目录 {'OK  ' if cdir.exists() else 'MISSING'} {cdir}")

    want = []
    m = c["models"]
    for k, v in (("qwen", ("unet", "clip", "vae")), ("wan", ("unet", "clip", "vae"))):
        for f in v:
            want.append((f"{k}.{f}", m[k][f]))
    hits = 0
    for label, name in want:
        found = list(cdir.glob(f"models/**/{name}"))
        size = found[0].stat().st_size / (1024 ** 3) if found else 0
        print(f"model {label:<12} {'OK  ' + f'{size:.2f} GB' if found else 'MISSING ' + name}")
        hits += bool(found)
    ok &= hits == len(want)

    ff = Path(c["paths"]["film_frames"])
    pd_dir = Path(str(ff).replace("参考帧_init", "参考帧_pd"))
    n_init = len(list(ff.glob("*.jpg"))) if ff.exists() else 0
    n_pd = len(list(pd_dir.glob("*.jpg"))) if pd_dir.exists() else 0
    print(f"对位帧      {'OK  ' if n_init else 'MISSING'} {ff}  ({n_init} 张)")
    print(f"纹理帧库    {'OK  ' if n_pd else 'MISSING'} {pd_dir}  ({n_pd} 张，提颗粒/纸纹用)")
    ok &= bool(n_init)

    for d in (tcfg.PKG / "projects", Path(c["paths"]["publish_root"])):
        print(f"目录        {'OK  ' if d.exists() else 'MISSING'} {d}")

    print("\n结论：" + ("全部就绪" if ok else "有缺项，见上面 MISSING/OFFLINE"))
    return 0 if ok else 1


# ------------------------------------------------------------------ 工程
def new_project(argv: list[str]) -> int:
    import argparse
    import shutil
    import time

    ap = argparse.ArgumentParser(prog="tianshu.py new")
    ap.add_argument("name")
    ap.add_argument("--episode", default="")
    ap.add_argument("--title", default="")
    ap.add_argument("--src", default="", help="出稿目录（含 配音.wav / 口播稿_定稿.txt）")
    ap.add_argument("--ratio", default="4:3")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args(argv)

    pd = tcfg.project_dir(a.name)
    if pd.exists() and not a.force:
        print(f"工程已存在：{pd}（要重建加 --force）")
        return 1
    for sub in ("source", "work", "plates", "post", "i2v", "anchored", "cam", "out", "logs"):
        (pd / sub).mkdir(parents=True, exist_ok=True)

    src = Path(a.src) if a.src else None
    copied = []
    if src and src.exists():
        for fn in ("配音.wav", "口播稿_定稿.txt", "配音审查.json"):
            p = src / fn
            if p.exists():
                shutil.copyfile(p, pd / "source" / fn)
                copied.append(fn)
    proj = {
        "name": a.name,
        "episode": a.episode,
        "title": a.title or a.name,
        "ratio": a.ratio,
        "fps": tcfg.cfg()["canvas"]["fps"],
        "src": str(src) if src else "",
        "created": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    tcfg.save_json(pd / "project.json", proj)

    shots_ex = tcfg.load_json(tcfg.TEMPLATE / "shots.example.json", {"shots": []})
    tcfg.save_json(pd / "work" / "shots.json", shots_ex)

    print(f"工程已建：{pd}")
    print(f"  源文件   {', '.join(copied) if copied else '未提供 --src，请手工放 source/配音.wav 与 source/口播稿_定稿.txt'}")
    print(f"  镜头表   work/shots.json（模板已放入，按你的分镜改）")
    print(f"  下一步   beats → plan → scaffold")
    return 0


# ------------------------------------------------------------------ 分发
def run_stage(stage: str, argv: list[str]) -> int:
    if stage == "all":
        return run_all(argv)
    modname, _ = STAGES[stage]
    mod = importlib.import_module(modname)
    return int(mod.run(argv) or 0)


def run_all(argv: list[str]) -> int:
    import argparse

    ap = argparse.ArgumentParser(prog="tianshu.py all")
    ap.add_argument("name")
    ap.add_argument("--skip", default="", help="跳过的阶段，逗号分隔：i2v,anchor")
    ap.add_argument("--from", dest="from_stage", default="", help="从哪个阶段开始")
    ap.add_argument("--to", dest="to_stage", default="", help="到哪个阶段为止")
    ap.add_argument("--only", default="", help="只做这些镜头，逗号分隔：S001,S002")
    a = ap.parse_args(argv)

    skip = {s.strip() for s in a.skip.split(",") if s.strip()}
    start = ORDER.index(a.from_stage) if a.from_stage in ORDER else 0
    end = ORDER.index(a.to_stage) + 1 if a.to_stage in ORDER else len(ORDER)

    name = a.name
    for i in range(start, end):
        stage = ORDER[i]
        if stage in skip:
            print(f"\n=== {stage} 跳过 ===")
            continue
        print(f"\n=== {stage} ===", flush=True)
        extra = ["--only", a.only] if a.only and stage in ("stills", "post", "i2v", "anchor", "cam") else []
        code = run_stage(stage, [name, *extra])
        if code != 0:
            print(f"\n阶段 {stage} 失败（code={code}），整条链停在这里。")
            return code
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__)
        print("阶段：")
        for k, (_, desc) in STAGES.items():
            print(f"  {k:<9} {desc}")
        print("\n其它：doctor  new")
        return 0

    cmd = argv[0]
    if cmd == "doctor":
        ensure_deps()
        return doctor()
    if cmd == "new":
        return new_project(argv[1:])
    if cmd in STAGES:
        ensure_deps()
        return run_stage(cmd, argv[1:])
    print(f"未知命令：{cmd}\n")
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
