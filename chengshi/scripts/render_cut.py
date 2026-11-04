# -*- coding: utf-8 -*-
"""一条命令出 chengshi 成片：bundle -> render -> 混音真峰值限幅 -> 重封装。

用法：
  python chengshi/scripts/render_cut.py --project suzhou \
      --composition ChengshiReview \
      --out projects/suzhou/work/out/full_160b_1080p.mp4

默认渲染 1080p 审片合成 ChengshiReview；4K 母版 Chengshi 必须显式加 --allow-4k。
打包后会把 projects/<slug>/work/public 整个拷进 bundle/public：remotion bundle
不认 --public-dir，这一步不能省。
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "chengshi" / "template"
EDGE = Path(r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")
FF_FALLBACK = Path(r"C:/Users/20200/bin/ffmpeg.exe")
FP_FALLBACK = Path(r"C:/Users/20200/bin/ffprobe.exe")


def exe(name, fallback):
    if Path(fallback).exists():
        return str(fallback)
    found = shutil.which(name)
    if found:
        return found
    raise SystemExit(f"找不到 {name}：{fallback}")


def run(cmd, cwd=None, capture=False):
    print("$ " + " ".join(str(x) for x in cmd), flush=True)
    if capture:
        return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True,
                              encoding="utf-8", errors="ignore")
    subprocess.run(cmd, cwd=cwd, check=True)
    return None


def probe(path, ffprobe):
    r = run([ffprobe, "-v", "error", "-print_format", "json", "-show_format",
             "-show_streams", str(path)], capture=True)
    if r.returncode != 0:
        raise SystemExit(r.stderr[-2000:])
    return json.loads(r.stdout)


def measure_loudness(path, ff, lufs=-15.0, tp=-1.5):
    r = run([ff, "-v", "info", "-i", str(path), "-vn", "-af",
             f"loudnorm=I={lufs}:TP={tp}:print_format=summary", "-f", "null", "-"],
            capture=True)
    vals = {}
    for key, tag in (("integrated", "Input Integrated"), ("tp", "Input True Peak"),
                     ("lra", "Input LRA")):
        # 峰值可能带 + 号或为 ±inf，不能只匹配 -?[数字]
        m = re.search(rf"{tag}:\s*([+-]?(?:inf|[\d.]+))", r.stderr, re.I)
        if not m:
            continue
        raw = m.group(1).lower()
        vals[key] = float(raw) if "inf" not in raw else (
            float("-inf") if raw.startswith("-") else float("inf"))
    if "integrated" not in vals or "tp" not in vals:
        return None
    return vals


def md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def limit_filter(target_tp):
    limit = 10 ** (target_tp / 20.0)
    return (f"aresample=192000,alimiter=limit={limit:.6f}:level=false:"
            "attack=5:release=80,aresample=48000")


def limit_cmd(src, dst, ff, target_tp):
    return [ff, "-y", "-v", "error", "-i", str(src), "-af", limit_filter(target_tp),
            "-c:a", "aac", "-b:a", "256k", "-ar", "48000", str(dst)]


def remux_cmd(video, audio, dst, ff):
    return [ff, "-y", "-v", "error", "-i", str(video), "-i", str(audio),
            "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-shortest",
            "-movflags", "+faststart", str(dst)]


def main():
    ap = argparse.ArgumentParser(description="chengshi bundle+render+限幅+重封装")
    ap.add_argument("--project", default="suzhou")
    ap.add_argument("--composition", default="ChengshiReview")
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--frames", default=None, help="只渲一段，如 0-240")
    ap.add_argument("--scale", type=float, default=None)
    ap.add_argument("--concurrency", type=int, default=2)
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--keep-bundle", action="store_true")
    ap.add_argument("--keep-render", action="store_true")
    ap.add_argument("--no-limit", action="store_true", help="跳过混音真峰值限幅")
    ap.add_argument("--no-remux", action="store_true", help="保留渲染自带音轨，不重封装")
    ap.add_argument("--allow-4k", action="store_true", help="允许渲染 4K 母版")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    proj = ROOT / "projects" / args.project
    film_path = proj / "film.json"
    if not film_path.exists():
        raise SystemExit(f"缺 {film_path}")
    film = json.loads(film_path.read_text(encoding="utf-8"))
    work = proj / "work"
    public = work / "public"
    if not public.exists():
        raise SystemExit(f"缺 {public}")

    ff = exe("ffmpeg", FF_FALLBACK)
    ffprobe = exe("ffprobe", FP_FALLBACK)
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"

    duration = float(film["duration"])
    fps = float(film["fps"])
    comp_height = 1080 if args.composition == "ChengshiReview" else int(film["height"])
    if args.scale:
        comp_height = int(round(comp_height * args.scale))
    if comp_height >= 2160 and not args.allow_4k:
        raise SystemExit("这是 4K 母版输出；宝哥未批准前不加 --allow-4k 不能渲。")

    stamp = time.strftime("%Y%m%d-%H%M%S")
    if args.out:
        out = args.out if args.out.is_absolute() else (ROOT / args.out).resolve()
        if out.exists() and not args.force:
            raise SystemExit(f"{out} 已存在；换 --out 或加 --force")
    else:
        out = work / "out" / f"full_{int(round(duration))}_{comp_height}p_{stamp}.mp4"

    bundle = work / "tmp" / f"bundle_cut_{stamp}"
    render_tmp = work / "tmp" / f"render_{stamp}.mp4"
    mix = public / "audio" / "mix.m4a"
    limited = work / "tmp" / f"mix_tp_{stamp}.m4a"
    target_tp = float(film.get("audio", {}).get("loudness", {}).get("tp", -1.5))
    target_lufs = float(film.get("audio", {}).get("loudness", {}).get("lufs", -15.0))

    print(f"项目 {args.project} / 合成 {args.composition} / {duration:.3f}s @ {fps:g}fps")
    print(f"输出 {out}")
    print(f"bundle {bundle}")

    bundle_cmd = [npx, "remotion", "bundle", "src/index.ts",
                  f"--out-dir={bundle}", "--log=error"]
    render_cmd = [npx, "remotion", "render", str(bundle), args.composition, str(render_tmp),
                  f"--concurrency={args.concurrency}", "--codec=h264",
                  f"--crf={args.crf}", "--log=error"]
    if args.frames:
        render_cmd.insert(-1, f"--frames={args.frames}")
    if args.scale:
        render_cmd.insert(-1, f"--scale={args.scale}")
    if EDGE.exists():
        render_cmd.insert(-1, f"--browser-executable={EDGE}")

    final_tmp = out.with_name(out.stem + ".tmp.mp4")

    if args.dry_run:
        print("\n[dry-run] 不执行：")
        print("  1.", " ".join(str(x) for x in bundle_cmd))
        print("  2. 拷 public -> bundle/public")
        print("  3.", " ".join(str(x) for x in render_cmd))
        if args.no_remux:
            print("  4. 跳过混音/限幅/重封装")
        else:
            if args.no_limit:
                print("  4. 跳过限幅（--no-limit）；重封装命令：")
                print("     ", " ".join(str(x) for x in remux_cmd(render_tmp, mix, final_tmp, ff)))
            else:
                print("  4. 按混音真峰值决定是否限幅；限幅命令：")
                print("     ", " ".join(str(x) for x in limit_cmd(mix, limited, ff, target_tp)))
                print("  5. 重封装命令：")
                print("     ", " ".join(str(x) for x in remux_cmd(render_tmp, limited, final_tmp, ff)))
        return

    out.parent.mkdir(parents=True, exist_ok=True)
    render_tmp.parent.mkdir(parents=True, exist_ok=True)

    if not args.no_remux and not mix.exists():
        raise SystemExit(f"缺混音 {mix}；若确认要保留渲染自带音轨，请显式加 --no-remux")

    try:
        run(bundle_cmd, cwd=TEMPLATE)
        shutil.copytree(public, bundle / "public", dirs_exist_ok=True)
        print(f"public 已拷入 {bundle / 'public'}")

        run(render_cmd, cwd=TEMPLATE)
        meta = probe(render_tmp, ffprobe)
        v = next(s for s in meta["streams"] if s["codec_type"] == "video")
        print(f"渲染完成 {v['width']}x{v['height']} frames={v.get('nb_frames')} "
              f"dur={float(v.get('duration', 0)):.3f}s")

        audio_src = None
        if not args.no_remux:
            audio_src = mix
            if not args.no_limit:
                m0 = measure_loudness(mix, ff, target_lufs, target_tp)
                if m0 is None:
                    print("警告：混音真峰值无法识别，按超限处理")
                    need_limit = True
                else:
                    print(f"混音现值 I={m0['integrated']:.1f} LUFS TP={m0['tp']:.1f} dBTP")
                    # 真峰值在 target 上方 0.25 dB 以内就不重复编码，避免二次 AAC 损失
                    need_limit = m0["tp"] > target_tp + 0.25
                if need_limit:
                    run(limit_cmd(mix, limited, ff, target_tp))
                    m1 = measure_loudness(limited, ff, target_lufs, target_tp)
                    if m1 is None:
                        raise SystemExit("限幅后仍无法测量真峰值，拒绝出片")
                    print(f"限幅后 I={m1['integrated']:.1f} LUFS TP={m1['tp']:.1f} dBTP")
                    if m1["tp"] > target_tp + 0.25:
                        print(f"警告：限幅后 TP 仍为 {m1['tp']:.1f} dBTP，高于目标 {target_tp} dBTP")
                    audio_src = limited
                else:
                    print("混音真峰值已在容差内，跳限幅")

        if audio_src is not None:
            run(remux_cmd(render_tmp, audio_src, final_tmp, ff))
        else:
            shutil.copy2(render_tmp, final_tmp)
        os.replace(final_tmp, out)
    except Exception:
        print(f"\n失败：临时文件保留在 {bundle} / {render_tmp}，便于排查")
        raise

    meta = probe(out, ffprobe)
    v = next(s for s in meta["streams"] if s["codec_type"] == "video")
    a = next((s for s in meta["streams"] if s["codec_type"] == "audio"), None)
    loud = measure_loudness(out, ff, target_lufs, target_tp) if a else None
    ok = True
    if a and loud is None:
        ok = False
    print(f"\n{'[DONE]' if ok else '[WARN]'}")
    print(f"  {out}")
    print(f"  {v['width']}x{v['height']} {v['codec_name']} {v.get('avg_frame_rate')} "
          f"frames={v.get('nb_frames')} video={float(v.get('duration', 0)):.3f}s "
          f"container={float(meta['format']['duration']):.3f}s")
    if a:
        if loud is None:
            print(f"  audio={a['codec_name']} {a.get('sample_rate')}Hz "
                  f"{a.get('channels')}ch 响度测量失败")
        else:
            print(f"  audio={a['codec_name']} {a.get('sample_rate')}Hz {a.get('channels')}ch "
                  f"I={loud['integrated']:.1f} LUFS TP={loud['tp']:.1f} dBTP")
    print(f"  {out.stat().st_size:,}B md5={md5(out)}")

    if not args.frames:
        expect = round(duration * fps)
        got = int(v.get("nb_frames") or 0)
        if got and abs(got - expect) > 1:
            ok = False
            print(f"  错误：帧数 {got} 与 film.json 期望 {expect} 不一致")

    if not args.keep_render and render_tmp.exists():
        render_tmp.unlink()
    if limited.exists():
        limited.unlink()
    if not args.keep_bundle and bundle.exists():
        shutil.rmtree(bundle, ignore_errors=True)

    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as e:
        sys.exit(f"命令失败（exit {e.returncode}）：{e.cmd}")
