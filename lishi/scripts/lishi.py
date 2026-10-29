# -*- coding: utf-8 -*-
"""lishi —— 历史科普短片管线（E3《碽妃疑案》定版）

七阶段：
    align    段落级配音 → 从句级时码（从音频里测边界，不猜）
    realign  整段重录后重新对齐到已知从句文本
    shots    storyboard.json + narration.json → data/shots.json
    audio    28 个程序化音色 + 关键镜选点 + BGM 闪避 → audio/final-audio.wav
    cover    封面（3:4 + 4:3）→ work/out/Cover*.png
    render   Remotion 整片 → work/out/full.mp4
    mux      视频 + 终混 → work/out/<片名>.mp4（响度归一）
    publish  归到 out/<编号>_<人物>/（成片 + 2 封面 + 发布信息）

一条命令跑完后段：
    python lishi/scripts/lishi.py all --project <slug>
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import OUTDIR, PROJECTS, Paths, project  # noqa: E402

PY = sys.executable
EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
NPX = "npx.cmd" if sys.platform.startswith("win") else "npx"


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("$", " ".join(str(c) for c in cmd))
    r = subprocess.run(cmd, cwd=str(cwd) if cwd else None)
    if r.returncode != 0:
        raise SystemExit(f"命令失败（exit {r.returncode}）")


def step(name: str, *args: str) -> None:
    run([PY, str(HERE / name), *args])


# ------------------------------- 阶段 -------------------------------

def cmd_align(P: Paths, src: Path | None) -> None:
    d = src or Path(P.film.get("narration", {}).get("src", ""))
    if not str(d) or not d.exists():
        raise SystemExit("用法：align --src <出稿目录>（含 配音.json 与 narration-chunks/）")
    P.mkdirs()
    step("align_captions.py", "--src", str(d), "--out", str(P.work))


def cmd_realign(P: Paths, voice: Path | None) -> None:
    v = voice or Path(P.film.get("narration", {}).get("voice", ""))
    if not str(v) or not v.exists():
        raise SystemExit("用法：realign --voice <整段配音 wav>")
    step("realign_voice.py", "--voice", str(v),
         "--narration", str(P.narration_json), "--out", str(P.work))


def cmd_shots(P: Paths) -> None:
    step("build_shots.py", "--project", str(P.work))


def cmd_audio(P: Paths) -> None:
    a = P.film.get("audio", {})
    voice = P.work / a.get("voice", "narration/narration.wav")
    if not voice.exists():
        raise SystemExit(f"缺 {voice}\n→ 先跑 align 或 realign")
    args = ["--project", str(P.work), "--voice", str(voice)]
    if a.get("bgm"):
        args += ["--bgm", str(a["bgm"])]
    plan = P.work / a.get("plan", "data/audio-plan.json")
    if plan.exists():
        args += ["--plan", str(plan)]
    args += ["--mode", str(a.get("mode", "key"))]
    step("make_audio.py", *args)


def _still(P: Paths, comp: str, out: Path, w: int, h: int) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    run([NPX, "remotion", "still", "src/index.ts", comp, str(out), "--frame=0",
         f"--browser-executable={EDGE}", "--log=error"], cwd=P.work)


def cmd_cover(P: Paths) -> None:
    """渲染两版封面。Composition id 由 film.json 的 cover 段给出。"""
    c = P.film.get("cover", {})
    pairs = [
        (c.get("id_3x4", "Cover3x4"), "Cover3x4.png", 1080, 1440),
        (c.get("id_4x3", "Cover4x3"), "Cover4x3.png", 1440, 1080),
    ]
    for cid, fn, w, h in pairs:
        _still(P, cid, P.work / "out" / fn, w, h)
        print(f"封面 {fn} 完成")


def cmd_srt(P: Paths) -> None:
    shots = json.loads(P.shots.read_text(encoding="utf-8"))
    caps = shots.get("captions", [])

    def ts(t: float) -> str:
        h = int(t // 3600)
        m = int((t % 3600) // 60)
        s = t % 60
        return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")

    body = "\n".join(
        f"{i}\n{ts(c['t0'])} --> {ts(c['t1'])}\n{c['text']}\n" for i, c in enumerate(caps, 1))
    P.srt.parent.mkdir(parents=True, exist_ok=True)
    P.srt.write_text(body, encoding="utf-8")
    print(f"SRT {len(caps)} 条 → {P.srt}")


def cmd_render(P: Paths, concurrency: int = 6, crf: int = 18) -> None:
    out = P.work / "out"
    out.mkdir(parents=True, exist_ok=True)
    run([NPX, "remotion", "render", "src/index.ts", "Film", str(out / "full.mp4"),
         f"--browser-executable={EDGE}", f"--concurrency={concurrency}",
         f"--crf={crf}", "--log=error"], cwd=P.work)


def cmd_mux(P: Paths) -> None:
    """视频 + 终混音频，响度归一到 -16.3 LUFS / -1.5 dBTP。"""
    src = P.work / "out" / "full.mp4"
    if not src.exists():
        raise SystemExit(f"缺 {src}\n→ 先跑 render")
    dst = P.work / "out" / f"{P.film.get('title', P.slug)}.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(src),
         "-i", str(P.final_audio), "-map", "0:v:0", "-map", "1:a:0",
         "-c:v", "copy", "-af", "loudnorm=I=-16.3:TP=-1.5:LRA=11",
         "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-shortest", "-movflags", "+faststart", str(dst)])
    print(f"成片 → {dst}")


def cmd_publish(P: Paths) -> None:
    """归到 out/<编号>_<人物>/ —— 只放三样：成片 + 2 张封面 + 发布信息。

    刻意不放：审核版（母版一条 ffmpeg 命令就能生成）、SRT（在工程里）、
    封面底图与生成原图（在 work/assets/cover/）。交付目录保持一集三件。
    """
    d = P.film.get("delivery", {})
    folder = d.get("out_dir") or P.film.get("out_dir")
    if not folder:
        raise SystemExit('film.json 缺 delivery.out_dir（如 "003_朱元璋"）')
    dst = OUTDIR / folder
    dst.mkdir(parents=True, exist_ok=True)

    title = P.film.get("title", P.slug)
    master = P.work / "out" / f"{title}.mp4"
    shipped = dst / f"{title}.mp4"
    if master.exists():
        shutil.copy2(master, shipped)
        print(f"成片   → {shipped}")
    elif shipped.exists():
        # 工程里的中间件已清掉、交付目录里已有母版：不重复拷 186MB
        print(f"成片   → {shipped}（已在交付目录，未重拷）")
    else:
        raise SystemExit(f"缺 {master}\n→ 先跑 mux")

    # 两张封面直接放集目录，不建 封面/ 子目录
    for name, target in (("Cover3x4.png", "src_3x4.png"), ("Cover4x3.png", "src_4x3.png")):
        s = P.work / "out" / name
        if s.exists():
            shutil.copy2(s, dst / target)
            print(f"封面   → {dst / target}")
        elif (dst / target).exists():
            print(f"封面   → {dst / target}（已在交付目录，未重拷）")
        else:
            print(f"⚠ 缺 {s}，先跑 cover")

    # 封面底图 / 生成原图不属于交付物，挪到工程里（别删，重生成要花 credits）
    keep = P.work / "assets" / "cover"
    moved = []
    legacy = dst / "封面"
    extras = sorted(dst.glob("base_*.png")) + sorted(legacy.glob("*")) if legacy.is_dir() else sorted(dst.glob("base_*.png"))
    for extra in extras:
        keep.mkdir(parents=True, exist_ok=True)
        shutil.move(str(extra), keep / extra.name)
        moved.append(extra.name)
    if moved:
        print(f"底图   → {keep}（{', '.join(moved)}）")

    pub = dst / "发布信息.md"
    if not pub.exists():
        pub.write_text(
            f"# 发布信息 · {folder}\n\n## 标题（5 选 1）\n\n"
            "1. \n2. \n3. \n4. \n5. \n\n## 标签（4 个）\n\n# # # #\n",
            encoding="utf-8",
        )
        print(f"⚠ {pub} 是空模板，5 个标题 + 4 个标签要手填")
    else:
        print("发布信息：已存在")

    print(f"\n交付目录 → {dst}（成片 + 2 封面 + 发布信息）")


def cmd_probe(P: Paths) -> None:
    print(f"工程 {P.root}")
    for label, p in [
        ("narration.json", P.narration_json), ("shots.json", P.shots),
        ("storyboard.json", P.work / "data" / "storyboard.json"),
        ("audio-plan.json", P.work / "data" / "audio-plan.json"),
        ("final-audio.wav", P.final_audio), ("full.mp4", P.work / "out" / "full.mp4"),
        ("封面 3:4", P.work / "out" / "Cover3x4.png"),
        ("封面 4:3", P.work / "out" / "Cover4x3.png"),
    ]:
        print(f"  {'✓' if p.exists() else '·'} {label:18s} {p}")
    shots = P.shots
    if shots.exists():
        d = json.loads(shots.read_text(encoding="utf-8"))
        m = d["meta"]
        print(f"\n镜 {len(d['shots'])} / 字幕 {len(d.get('captions', []))} / "
              f"{m['duration']}s / {m['durationInFrames']} 帧")


def cmd_qa(P: Paths) -> None:
    args = ["qa_film.py", "--project", P.slug]
    # 封面尺寸也纳入质检（若已生成）
    for cover_name, flag in (("src_4x3.png", "--cover-4x3"), ("src_3x4.png", "--cover-3x4")):
        p = OUTDIR / P.film.get("delivery", {}).get("out_dir", "") / cover_name
        if p.exists():
            args += [flag, str(p)]
    step(*args)


def cmd_all(P: Paths, concurrency: int, crf: int) -> None:
    cmd_shots(P)
    cmd_audio(P)
    cmd_cover(P)
    cmd_render(P, concurrency, crf)
    cmd_mux(P)


# ------------------------------- 入口 -------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(prog="lishi", description="历史科普短片管线")
    ap.add_argument("command", choices=[
        "align", "realign", "shots", "audio", "cover", "render", "mux",
        "publish", "srt", "qa", "all", "probe",
    ])
    ap.add_argument("--project", required=True, help="选题 slug")
    ap.add_argument("--src", type=Path, help="align 用：出稿目录")
    ap.add_argument("--voice", type=Path, help="realign 用：整段配音 wav")
    ap.add_argument("--concurrency", type=int, default=6)
    ap.add_argument("--crf", type=int, default=18)
    args = ap.parse_args()

    P = Paths(args.project)
    table = {
        "align": lambda: cmd_align(P, args.src),
        "realign": lambda: cmd_realign(P, args.voice),
        "shots": lambda: cmd_shots(P),
        "audio": lambda: cmd_audio(P),
        "cover": lambda: cmd_cover(P),
        "render": lambda: cmd_render(P, args.concurrency, args.crf),
        "mux": lambda: cmd_mux(P),
        "publish": lambda: cmd_publish(P),
        "srt": lambda: cmd_srt(P),
        "qa": lambda: cmd_qa(P),
        "all": lambda: cmd_all(P, args.concurrency, args.crf),
        "probe": lambda: cmd_probe(P),
    }
    table[args.command]()


if __name__ == "__main__":
    main()
