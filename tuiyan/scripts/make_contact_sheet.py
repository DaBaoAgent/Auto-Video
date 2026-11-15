# -*- coding: utf-8 -*-
"""成片接触表：从稳帧成片里为每一幕抽一帧（带幕号/时点/标题），拼成一张审核图。

用法:
  python scripts/make_contact_sheet.py                 # 自动找最新的完整版 mp4 + chibi-full-12x 分幕
  python scripts/make_contact_sheet.py --limit 6       # 自测：只抽前 6 幕
选项: --mp4 <文件> --scene <scene.json> --out <jpg> --cols 4
"""
import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "content" / "01-赤壁之战" / "视频输出"
DEF_SCENE = REPO / "vendor" / "battlefield-editor" / "packages" / "chibi-full" / "scene.json"
FFMPEG = str(Path.home() / "bin/ffmpeg.exe")
FONT = "C\\:/Windows/Fonts/msyh.ttc"          # drawtext 里冒号必须转义
TILE_W, TILE_H = 480, 270


def newest_mp4() -> Path:
    files = sorted(OUT_DIR.glob("*_完整版_稳帧1080p_*.mp4"), key=lambda p: p.stat().st_mtime)
    if not files:
        raise SystemExit("没找到完整版成片")
    return files[-1]


def probe_duration(p: Path) -> float:
    out = subprocess.check_output([str(Path.home() / "bin/ffprobe.exe"), "-v", "error",
                                   "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                  text=True).strip()
    return float(out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--mp4")
    ap.add_argument("--scene", default=str(DEF_SCENE))
    ap.add_argument("--out")
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    mp4 = Path(args.mp4) if args.mp4 else newest_mp4()
    scene = json.loads(Path(args.scene).read_text(encoding="utf-8"))
    acts = scene["acts"][: args.limit] if args.limit else scene["acts"]
    total = probe_duration(mp4)

    # 与录制器一致：每幕按 1/30 秒向上取整，累计得到幕起点
    starts, t = [], 0.0
    for a in acts:
        starts.append(t)
        t += math.ceil(a["dur"] * 30) / 30
    if t > total + 1.5:
        print(f"注意: 分幕累计 {t:.1f}s 超过成片 {total:.1f}s,可能不是同一版包", file=sys.stderr)

    tmp = OUT_DIR / ".sheet-frames"
    tmp.mkdir(exist_ok=True)
    for f in tmp.glob("*.jpg"):
        f.unlink()

    made = []
    esc = lambda p: str(p).replace("\\", "/").replace(":", "\\:")   # filter 内冒号(含盘符)必须转义
    for i, a in enumerate(acts):
        mid = min(starts[i] + a["dur"] / 2, max(0.0, total - 0.1))
        label = tmp / f"lbl{i:03d}.txt"
        mm, ss = divmod(int(round(mid)), 60)
        label.write_text(f"第{i + 1}幕 · {a.get('title', '')}\n{mm}:{ss:02d} · {a['dur']:.1f}s",
                         encoding="utf-8")
        frame = tmp / f"f{i:03d}.jpg"
        vf = (f"scale={TILE_W}:{TILE_H},"
              f"drawtext=textfile='{esc(label)}':fontfile='{FONT}':"
              f"x=8:y=8:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8:line_spacing=4")
        r = subprocess.run([FFMPEG, "-y", "-v", "error", "-ss", f"{mid:.3f}", "-i", str(mp4),
                            "-frames:v", "1", "-vf", vf, "-q:v", "4", str(frame)],
                           capture_output=True, text=True)
        if r.returncode != 0 or not frame.exists():
            print(f"第{i + 1}幕 抽帧失败: {r.stderr.strip()[:200]}", file=sys.stderr)
            continue
        made.append(frame)

    if not made:
        raise SystemExit("没有抽到任何帧")
    rows = math.ceil(len(made) / args.cols)
    out = Path(args.out) if args.out else OUT_DIR / f"成片接触表_{mp4.stem.split('_')[-1]}.jpg"
    r = subprocess.run([FFMPEG, "-y", "-v", "error", "-framerate", "1",
                        "-i", str(tmp / "f%03d.jpg"), "-vf", f"tile={args.cols}x{rows}",
                        "-frames:v", "1", "-q:v", "3", str(out)], capture_output=True, text=True)
    if r.returncode != 0 or not out.exists():
        raise SystemExit(f"拼图失败: {r.stderr.strip()[:300]}")
    print(f"接触表 {len(made)} 幕 / {rows} 行 -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
