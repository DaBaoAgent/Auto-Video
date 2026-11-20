"""Render the Paper & Chronicle station's original site samples.

    uv run --with playwright --with edge-tts python tools/paper_samples.py
    uv run --with playwright --with edge-tts python tools/paper_samples.py --only zhidiao --stills 0,3.8,8.4

Stills, speech, silent masters and candidate site media stay in review/paper_samples.
Use --install after reviewing the candidate videos and posters.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

from av import REPO, SITE_DIR, read_json, utf8_stdout

SOURCE = REPO / "tools" / "paper_samples"
WORK = REPO / "review" / "paper_samples"
RUNTIME = REPO / "pipelines" / "minjian" / "runtime"
BGM = Path(r"D:\@kaifa\@\BGM")
DURATION = 10
SHOTS = (0, 3.25, 6.45)
FPS = 30
CRF = 30
VOICE_RATE = "+16%"
PLAN = {
    "jianying": {
        "title": "一纸交子", "poster": 9.1,
        "poster_note": "纸券、朱印和递接动作同框",
        "music": "历史/古文明 03_Hidden_Wonders_古文明探索_Kevin_MacLeod.mp3", "music_at": 22,
        "voice": "zh-CN-YunxiNeural",
        "lines": ["北宋蜀地，铁钱太重。", "存进铁钱，领一张纸券。", "这张纸券，叫作交子。"],
    },
    "lishi": {
        "title": "圭表量影", "poster": 8.5,
        "poster_note": "圭表完整，夏至和冬至影长同尺对读",
        "music": "自然/自然 Liquid_Time.mp3", "music_at": 25,
        "voice": "zh-CN-YunyangNeural",
        "lines": ["一根表，立在石圭一端。", "正午，影子落上刻度。", "夏至影短，冬至影长。"],
    },
    "zhidiao": {
        "title": "雪夜邮车", "poster": 9.0,
        "poster_note": "邮车、雪松、亮灯的邮站同框，冷暖纸层完整",
        "music": "自然/自然-静谧 Invisible_Beauty.mp3", "music_at": 37,
        "voice": "zh-CN-XiaoxiaoNeural",
        "lines": ["大雪里，邮车还在走。", "山里的邮站亮了灯。", "一车信，终于到了。"],
    },
    "minjian": {
        "title": "蜗牛送伞", "poster": 8.65,
        "poster_note": "蜗牛把叶伞送到瓢虫身边，远丘保留铅笔线",
        "music": "乡村/乡村 Juneberry_Junction.mp3", "music_at": 10,
    },
}


def run(*cmd: object, capture: bool = False, env: dict | None = None) -> str:
    result = subprocess.run(
        [str(part) for part in cmd], check=True, capture_output=capture,
        text=True, encoding="utf-8", env=env,
    )
    return result.stdout or ""


def probe(file: Path) -> dict:
    return json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format",
                          "-of", "json", file, capture=True))


async def synthesize(plan: dict, work: Path) -> list[dict]:
    import edge_tts

    cues = []
    for i, (shot, line, limit) in enumerate(zip(SHOTS, plan["lines"], (*SHOTS[1:], DURATION))):
        recording = work / f"voice-{i}.mp3"
        start = shot + .15
        words = []
        word_cursor = 0
        request = edge_tts.Communicate(line, plan["voice"], rate=VOICE_RATE, boundary="WordBoundary")
        with recording.open("wb") as audio:
            async for chunk in request.stream():
                if chunk["type"] == "audio":
                    audio.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    token = chunk["text"]
                    left = line.find(token, word_cursor)
                    if left < 0:
                        raise ValueError(f"词级时间码与原文不一致：{line!r}，{token!r}")
                    word_cursor = left + len(token)
                    offset = chunk["offset"] / 10_000_000
                    end = offset + chunk["duration"] / 10_000_000
                    words.append({"from": left, "to": word_cursor,
                                  "start": round(start + offset, 4), "end": round(start + end, 4)})
        if not words or start + float(probe(recording)["format"]["duration"]) >= limit:
            raise ValueError(f"旁白超出镜头或无时间码：{line}")
        cues.append({"text": line, "offset": start, "start": words[0]["start"],
                     "end": words[-1]["end"], "words": words})
    return cues


def prepare(key: str, plan: dict, work: Path, source_dir: Path = SOURCE) -> list[dict]:
    stage = work / "stage"
    (stage / "lib").mkdir(parents=True, exist_ok=True)
    for name in ("render.py", "player.js", "lib/util.js"):
        shutil.copyfile(RUNTIME / name, stage / name)
    shutil.copyfile(SOURCE / "common.js", stage / "common.js")
    scripts = (*plan.get("scripts", ()), f"{key}.js")
    for name in scripts:
        shutil.copyfile(source_dir / name, stage / name)
    for asset in plan.get("assets", ()):
        shutil.copyfile(REPO / asset, stage / Path(asset).name)
    fonts = {"Kai": "KaiTi.ttf", "Brush": "MaShanZheng-Regular.ttf",
             "Serif": "NotoSerifSC.ttf", "Bold": "AlibabaPuHuiTi-3-85-Bold.ttf"}
    faces = []
    for family, name in fonts.items():
        source = REPO / "assets" / "fonts" / name
        if family == "Serif" and not source.is_file():
            source = REPO / "assets" / "fonts" / fonts["Kai"]
        shutil.copyfile(source, stage / source.name)
        faces.append({"family": family, "url": source.name})
    cues = asyncio.run(synthesize(plan, work)) if plan.get("lines") else []
    beats = [at for at, kind in plan.get("effects", ()) if kind == "drum"]
    config = {"SCENES": {}, "FONT_FACES": faces, "SHOTS": {key: SHOTS},
              "VOICE_CUES": {key: cues}, "SAMPLE_BEATS": {key: beats}}
    setup = "".join(f"window.{k}={json.dumps(v, ensure_ascii=True)};" for k, v in config.items())
    scene_scripts = "".join(f'<script src="{name}"></script>' for name in scripts)
    (stage / "stage.html").write_text(
        '<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,">'
        '<style>html,body{margin:0;overflow:hidden}canvas{display:block}</style><canvas id="c"></canvas>'
        f'<script>{setup}</script><script src="lib/util.js"></script>'
        f'<script src="common.js"></script>{scene_scripts}'
        '<script src="player.js"></script>',
        encoding="utf-8",
    )
    return cues


def render(key: str, work: Path, stills: str, fps: int = FPS) -> None:
    stage = work / "stage"
    env = os.environ.copy()
    edge = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
    if not env.get("CHROME_PATH") and not env.get("CHROME_CHANNEL") and edge.is_file():
        env["CHROME_PATH"] = str(edge)
    output = work / ("stills" if stills else "master.mp4")
    size = (1280, 720) if stills else (1920, 1080)
    run(sys.executable, stage / "render.py", "--scene", key, "--out", output,
        "--seconds", DURATION, "--fps", fps, "--width", size[0], "--height", size[1],
        *(("--stills", stills) if stills else ()), env=env)


def package(key: str, plan: dict, work: Path, cues: list[dict], music: Path) -> None:
    output = work / f"{key}.mp4"
    inputs = ["-i", work / "master.mp4", "-ss", plan["music_at"], "-t", DURATION, "-i", music]
    mix_filter = ["[0:v]scale=1024:576:flags=lanczos,setsar=1[v]"]
    mix_filter.append("[1:a]loudnorm=I=-23:TP=-2:LRA=11,aresample=48000,"
                      "afade=t=in:d=0.65,afade=t=out:st=9:d=1"
                      + (",volume=-5dB" if cues else "") + "[music]")
    tracks = ["[music]"]
    for i, cue in enumerate(cues):
        inputs.extend(("-i", work / f"voice-{i}.mp3"))
        delay = round(cue["offset"] * 1000)
        mix_filter.append(f"[{i+2}:a]aresample=48000,highpass=f=85,volume=3dB,"
                          f"adelay={delay}:all=1[voice{i}]")
        tracks.append(f"[voice{i}]")
    if key == "jianying":
        stamp_at = round((SHOTS[1] + 1.2) * 1000)
        mix_filter.append("aevalsrc=exprs='0.28*sin(680*t)*exp(-t*58)+"
                          "0.15*sin(1490*t)*exp(-t*92)':s=48000:d=0.14,"
                          f"adelay={stamp_at}:all=1[stamp]")
        tracks.append("[stamp]")
    effects = {
        "drum": "0.36*sin(390*t-110*t*t)*exp(-t*19)+0.11*sin(1760*t)*exp(-t*74)",
        "step": "0.14*sin(430*t-180*t*t)*exp(-t*32)+0.05*sin(1260*t)*exp(-t*82)",
        "shell": "0.13*sin(3700*t)*exp(-t*70)+0.10*sin(2190*t)*exp(-t*49)",
        "bell": "0.12*sin(11600*t)*exp(-t*22)+0.045*sin(25160*t)*exp(-t*40)",
        "acorn": "0.18*sin(2520*t)*exp(-t*42)+0.11*sin(1240*t)*exp(-t*25)",
        "water": "0.085*sin((2050+1270*t)*t)*exp(-t*14)+0.05*sin(3970*t)*exp(-t*27)",
        "cut": "0.24*sin(520*t-290*t*t)*exp(-t*18)+0.12*sin(2510*t)*exp(-t*88)",
        "tick": "0.12*sin(7320*t)*exp(-t*80)+0.07*sin(3820*t)*exp(-t*45)",
    }
    for i, (at, name) in enumerate(plan.get("effects", ())):
        mix_filter.append(f"aevalsrc=exprs='{effects[name]}':s=48000:d=0.31,"
                          f"adelay={round(at * 1000)}:all=1[effect{i}]")
        tracks.append(f"[effect{i}]")
    level = "loudnorm=I=-20:TP=-2:LRA=7,aresample=48000" if cues else "anull"
    mix_filter.append(f"{''.join(tracks)}amix=inputs={len(tracks)}:duration=first:"
                      f"normalize=0,{level}[a]")
    run("ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(mix_filter),
        "-map", "[v]", "-map", "[a]", "-t", DURATION, "-c:v", "libx264", "-preset", "slow",
        "-crf", CRF, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", output)
    run("ffmpeg", "-y", "-v", "error", "-ss", plan["poster"], "-i", output,
        "-frames:v", 1, "-q:v", 3, work / f"{key}.jpg")
    verify(key, work, plan.get("fps", FPS))


def verify(key: str, work: Path, fps: int) -> None:
    data = probe(work / f"{key}.mp4")
    video = next(s for s in data["streams"] if s["codec_type"] == "video")
    audio = next(s for s in data["streams"] if s["codec_type"] == "audio")
    poster = probe(work / f"{key}.jpg")["streams"][0]
    if (float(data["format"]["duration"]) != DURATION or
            float(video["duration"]) != DURATION or float(audio["duration"]) < 9.95 or
            (video["width"], video["height"], video["r_frame_rate"]) != (1024, 576, f"{fps}/1") or
            (poster["width"], poster["height"]) != (1024, 576)):
        raise ValueError(f"{key} 的音视频规格不符")


def install(keys: list[str], plan_by_key: dict, root: Path) -> None:
    for key in keys:
        verify(key, root / key, plan_by_key[key].get("fps", FPS))
    manifest = SITE_DIR / "assets" / "samples.json"
    samples = read_json(manifest)
    overrides_file = REPO / "tools" / "poster_overrides.json"
    overrides = read_json(overrides_file)
    entries = {item["key"]: item for item in samples["items"]}
    for key in keys:
        plan, work = plan_by_key[key], root / key
        poster_pick = {"seconds": plan["poster"], "note": plan["poster_note"]}
        overrides["by_key"][key] = poster_pick
        entry = entries[key]
        entry.update({
            "title": plan["title"], "display_title": plan["title"],
            "badge": "10 秒样片 · 自渲", "source": "本仓库 runtime 自渲（10 s，题材与画法均为本仓库重写）",
            "music": Path(plan["music"]).stem, "bytes": (work / f"{key}.mp4").stat().st_size,
            "poster_pick": {"by": "manual-override", **poster_pick},
            "seconds": 10.0, "clip_seconds": 10.0, "max_seconds": 10.0,
            "duration": "0:10", "width": 1024, "height": 576, "long_edge": 1024,
            "aspect": "16:9", "crf": CRF,
        })
        if plan.get("lines"):
            entry.update(voice=plan["voice"], rate=VOICE_RATE, subtitle=True,
                         narration="".join(plan["lines"]))
        else:
            for field in ("voice", "rate", "subtitle", "narration"):
                entry.pop(field, None)
        for ext in ("mp4", "jpg"):
            name = f"{key}.{ext}"
            shutil.copyfile(work / name, SITE_DIR / "media" / name)
    for path, document, indent in ((manifest, samples, 1), (overrides_file, overrides, 2)):
        path.write_text(json.dumps(document, ensure_ascii=False, indent=indent) + "\n",
                        encoding="utf-8", newline="\n")


def main(plan_by_key: dict = PLAN, source_dir: Path = SOURCE, root: Path = WORK,
         description: str | None = __doc__) -> None:
    utf8_stdout()
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--only", choices=plan_by_key, action="append")
    parser.add_argument("--stills", default="")
    parser.add_argument("--bgm-root", type=Path, default=BGM)
    parser.add_argument("--install", action="store_true")
    args = parser.parse_args()
    keys = list(dict.fromkeys(args.only)) if args.only else list(plan_by_key)
    if args.install:
        if args.stills:
            parser.error("--install 与 --stills 不能同时使用")
        install(keys, plan_by_key, root)
        return
    for key in keys:
        plan, work = plan_by_key[key], root / key
        music = args.bgm_root / plan["music"]
        if not args.stills and not music.is_file():
            raise FileNotFoundError(music)
        print(f"[{key}] {plan['title']}", flush=True)
        cues = prepare(key, plan, work, source_dir)
        render(key, work, args.stills, plan.get("fps", FPS))
        if not args.stills:
            package(key, plan, work, cues, music)


if __name__ == "__main__":
    main()
