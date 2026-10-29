# -*- coding: utf-8 -*-
"""jianying —— 纸本历史短片管线（赤壁样片沉淀下来的七阶段流程）。

一条命令跑完全链：
    python jianying/scripts/jianying_shotcraft.py all --project chibi

也可以逐段跑（改稿后只重跑后面几步，配音与分镜都有缓存）：
    tts     逐行配音 → narration/narration.json（行级时码）
    align   段落级配音 → 从句级时码（从音频里测边界，不猜）
    shots   分镜表 → data/shots.json（镜界夹在静音窗里）
    audio   音轨一体化 → audio/final-audio.wav（28 音色 + 关键镜选点 + BGM 闪避）
    sfx     音效床 → audio/sfx-bed.wav（旧方案，与 audio 二选一）
    mix     终混 → audio/final-audio.wav（旧方案，与 audio 二选一）
    srt     字幕 → out/字幕.srt
    render  Remotion 渲染 → work/out/*.mp4
    mux     封装终混音频 → out/<标题>.mp4
    qa      质检门禁（规格 / 解码 / 黑帧 / LUFS / 真峰值）

选题 = projects/<slug>/，只认 film.json + 口播稿两个输入。
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
from common import PKG, PROJECTS, ROOT, Paths, project  # noqa: E402

PY = sys.executable
EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
# Windows 上 npx 是 .cmd，subprocess 直接调 'npx' 会 WinError 2
NPX = "npx.cmd" if sys.platform.startswith("win") else "npx"


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("$", " ".join(str(c) for c in cmd))
    r = subprocess.run(cmd, cwd=str(cwd) if cwd else None)
    if r.returncode != 0:
        raise SystemExit(f"命令失败（exit {r.returncode}）")


def step(py_script: str, *args: str) -> None:
    run([PY, str(HERE / py_script), *args])


# ------------------------------- 阶段 -------------------------------

def cmd_tts(P: Paths) -> None:
    P.mkdirs()
    step("line_tts.py", "--project", P.slug)


def cmd_shots(P: Paths) -> None:
    step("build_shots.py", "--project", P.slug)


def cmd_sfx(P: Paths) -> None:
    step("build_sfx.py", "--project", P.slug)


def cmd_mix(P: Paths) -> None:
    step("mix_audio.py", "--project", P.slug)


def cmd_align(P: Paths, src: Path | None) -> None:
    """段落级配音 → 从句级时码。TTS 若不是按从句生成，必须先跑这一步，否则字幕只能猜。"""
    d = src or Path(P.film.get("narration", {}).get("src", ""))
    if not str(d) or not d.exists():
        raise SystemExit("用法：align --src <出稿目录>（含 配音.json 与 narration-chunks/）")
    P.mkdirs()
    step("align_captions.py", "--src", str(d), "--out", str(P.work))


def cmd_audio(P: Paths) -> None:
    """音轨一体化：程序化音效床 + 关键镜选点 + BGM 闪避，一步出 final-audio.wav。"""
    a = P.film.get("audio", {})
    voice = P.work / a.get("voice", "narration/narration.wav")
    if not voice.exists():
        raise SystemExit(f"缺 {voice}\n→ 先跑 align 或 tts")
    args = ["--project", str(P.work), "--voice", str(voice)]
    if a.get("bgm"):
        args += ["--bgm", str(a["bgm"])]
    plan = P.work / a.get("plan", "data/audio-plan.json")
    if plan.exists():
        args += ["--plan", str(plan)]
    args += ["--mode", str(a.get("mode", "key"))]
    step("make_audio.py", *args)


def cmd_srt(P: Paths) -> None:
    step("build_srt.py", "--project", P.slug)


def cmd_render(P: Paths, concurrency: int = 4, crf: int = 17) -> None:
    work = P.work
    if not (work / "package.json").exists():
        raise SystemExit(
            f"{work} 还没有工程。先跑：\n"
            f"  python jianying/scripts/jianying_shotcraft.py init --project {P.slug}"
        )
    if not (work / "node_modules").exists():
        raise SystemExit(f"{work} 缺依赖。先跑：cd {work} && npm install")
    # 工程内的 shots.json 是指向选题目录的副本，保证 Remotion 静态 import 拿到最新分镜
    (work / "data").mkdir(parents=True, exist_ok=True)
    shutil.copy2(P.shots, work / "data" / "shots.json")
    if P.narration_mp3.exists():
        (work / "public" / "audio").mkdir(parents=True, exist_ok=True)
        shutil.copy2(P.narration_mp3, work / "public" / "audio" / "narration.mp3")
    out_dir = work / "out"
    out_dir.mkdir(parents=True, exist_ok=True)
    run([
        NPX, "remotion", "render", "src/index.ts", "Film",
        f"out/{P.slug}.mp4",
        f"--browser-executable={EDGE}",
        f"--concurrency={concurrency}",
        f"--crf={crf}",
    ], cwd=work)


def cmd_mux(P: Paths) -> None:
    video = P.work / "out" / f"{P.slug}.mp4"
    if not video.exists():
        raise SystemExit(f"缺 {video}（先跑 render）")
    if not P.final_audio.exists():
        raise SystemExit(f"缺 {P.final_audio}（先跑 mix）")
    P.out.mkdir(parents=True, exist_ok=True)
    run([
        "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(video), "-i", str(P.final_audio),
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-af", "aresample=resampler=soxr:precision=28,apad",
        "-shortest", "-movflags", "+faststart",
        str(P.mp4),
    ])
    print(f"→ {P.mp4}")


def cmd_qa(P: Paths) -> None:
    step("qa_film.py", "--project", P.slug)


def cmd_probe(P: Paths) -> None:
    """打印选题现状：稿子行数、分镜、音频、成片规格。"""
    film = P.film
    print(f"选题      {film.get('title')}（{P.slug}）")
    print(f"主题      {film.get('theme')}  accentLock={film.get('accentLock', False)}")
    lines = [l for l in P.script.read_text(encoding="utf-8-sig").splitlines() if l.strip()]
    print(f"口播稿    {len(lines)} 行 / {sum(len(l) for l in lines)} 字 → {P.script}")
    print(f"镜头      {len(film['shots'])} 镜")
    if len(lines) != len(film["shots"]):
        print(f"          ⚠ 行数 {len(lines)} 与镜数 {len(film['shots'])} 不一致")
    for name, path in [
        ("分镜表", P.shots), ("旁白 json", P.narration_json), ("旁白 wav", P.narration_wav),
        ("音效床", P.sfx_bed), ("终混", P.final_audio), ("字幕", P.srt), ("成片", P.mp4),
    ]:
        mark = "✓" if path.exists() else "·"
        size = f"{path.stat().st_size / 1024:.0f} KB" if path.exists() else "缺"
        print(f"  {mark} {name:8s} {size:>9s}  {path.relative_to(P.root)}")


def cmd_new(slug: str, title: str | None, theme: str) -> None:
    dst = PROJECTS / slug
    if dst.exists():
        raise SystemExit(f"{dst} 已存在")
    dst.mkdir(parents=True)
    (dst / "口播稿.txt").write_text(
        "第一句，一行一镜。\n第二句，镜界只会落在句间静音窗里。\n第三句，改稿比硬凑便宜。\n",
        encoding="utf-8")
    (dst / "film.json").write_text(json.dumps({
        "slug": slug,
        "title": title or slug,
        "logline": "",
        "theme": theme,
        "accentLock": False,
        "fps": 30, "width": 1920, "height": 1080,
        "narration": {"file": "口播稿.txt", "gap_ms": 480, "lead_ms": 140,
                      "tail_ms": 600, "max_cps": 6.4},
        "shots": [
            {"scene": f"s{i:02d}", "card": "", "caption": True, "tone": "ink", "content": {}}
            for i in (1, 2, 3)
        ],
        "audio": {"sfx_gain_db": -4.0, "target_lufs": -16.3, "target_peak": -1.1},
        "rules": {"min_shot": 2.0, "max_shot": 3.0, "max_caption_chars": 16,
                  "lufs_range": [-17.5, -15.0], "true_peak_range": [-3.0, -0.3]},
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"→ {dst}\n下一步：改 口播稿.txt 与 film.json 的 shots，然后 jianying_shotcraft.py shots")


def cmd_init(P: Paths, from_work: Path | None) -> None:
    """把 Remotion 工程就位到 projects/<slug>/work。

    node_modules 不复制（几十万文件），改为指向模板的目录链接，
    这样新选题 init 完立刻能 render，不用等一次 npm install。
    """
    dst = P.work
    if dst.exists() and any(dst.iterdir()):
        raise SystemExit(f"{dst} 非空，先删或换 --from")
    src = from_work or (PKG / "template")
    if not src.exists():
        raise SystemExit(f"缺工程模板 {src}")
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("node_modules", "out"))

    # 依赖链接：模板装过就直接链过去，没装过就留给用户 npm install
    src_nm = src / "node_modules"
    dst_nm = dst / "node_modules"
    if src_nm.exists() and not dst_nm.exists():
        if sys.platform.startswith("win"):
            subprocess.run(["cmd", "/c", "mklink", "/J", str(dst_nm), str(src_nm)],
                           capture_output=True)
        else:
            dst_nm.symlink_to(src_nm, target_is_directory=True)
        print(f"依赖 → 链接到 {src_nm}")

    # 分镜与配音就位
    (dst / "data").mkdir(parents=True, exist_ok=True)
    if P.shots.exists():
        shutil.copy2(P.shots, dst / "data" / "shots.json")
    if P.narration_mp3.exists():
        (dst / "public" / "audio").mkdir(parents=True, exist_ok=True)
        shutil.copy2(P.narration_mp3, dst / "public" / "audio" / "narration.mp3")

    print(f"工程 → {dst}")
    if not (dst / "public" / "fonts" / "NotoSerifSC.ttf").exists():
        print("⚠ 缺字体：把 NotoSerifSC.ttf / KaiTi.ttf 放进 public/fonts/")
    if not (dst / "node_modules").exists():
        print(f"下一步：cd {dst} && npm install")


def cmd_all(P: Paths, concurrency: int, crf: int) -> None:
    cmd_tts(P)
    cmd_shots(P)
    if P.film.get("audio"):
        cmd_audio(P)
    else:
        cmd_sfx(P)
        cmd_mix(P)
    cmd_srt(P)
    cmd_render(P, concurrency, crf)
    cmd_mux(P)
    cmd_qa(P)


# ------------------------------- 入口 -------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(prog="jianying", description="纸本历史短片管线")
    ap.add_argument("command", choices=[
        "new", "init", "tts", "align", "shots", "audio", "sfx", "mix", "srt",
        "render", "mux", "qa", "all", "probe",
    ])
    ap.add_argument("slug", nargs="?", help="new 用：新选题 slug")
    ap.add_argument("--project", help="现有选题 slug")
    ap.add_argument("--title")
    ap.add_argument("--src", type=Path, help="align 用：出稿目录（含 配音.json 与 narration-chunks/）")
    ap.add_argument("--theme", default="paper")
    ap.add_argument("--from", dest="from_work", type=Path, help="init 用：从已有工程复制")
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--crf", type=int, default=17)
    args = ap.parse_args()

    if args.command == "new":
        if not args.slug:
            raise SystemExit("用法：jianying_shotcraft.py new <slug> [--title 标题] [--theme paper]")
        return cmd_new(args.slug, args.title, args.theme)

    slug = args.project or args.slug
    if not slug:
        raise SystemExit("要指定选题：--project <slug>")
    P = Paths(slug)

    table = {
        "init": lambda: cmd_init(P, args.from_work),
        "tts": lambda: cmd_tts(P),
        "shots": lambda: cmd_shots(P),
        "align": lambda: cmd_align(P, args.src),
        "audio": lambda: cmd_audio(P),
        "sfx": lambda: cmd_sfx(P),
        "mix": lambda: cmd_mix(P),
        "srt": lambda: cmd_srt(P),
        "render": lambda: cmd_render(P, args.concurrency, args.crf),
        "mux": lambda: cmd_mux(P),
        "qa": lambda: cmd_qa(P),
        "all": lambda: cmd_all(P, args.concurrency, args.crf),
        "probe": lambda: cmd_probe(P),
    }
    table[args.command]()


if __name__ == "__main__":
    main()
