# daihuo · 出片门禁（P0 版，机械项）
# 用法：python qa.py --video=... --cues=... --out=_qa.json
# 检查：尺寸/帧率/帧数/时长/有音轨/黑帧/冻帧/响度/首帧钩子色块
import argparse
import json
import re
import subprocess
import sys

FFMPEG = "ffmpeg"
FFPROBE = "ffprobe"


def probe(path):
    out = subprocess.run(
        [FFPROBE, "-hide_banner", "-v", "error", "-show_entries",
         "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels",
         "-show_entries", "format=duration", "-of", "json", path],
        capture_output=True, text=True,
    )
    return json.loads(out.stdout)


def run_log(args):
    r = subprocess.run(args, capture_output=True, text=True)
    return (r.stderr or "") + (r.stdout or "")


def loudness(path):
    log = run_log([FFMPEG, "-hide_banner", "-i", path, "-af",
                   "loudnorm=print_format=json", "-f", "null", "-"])
    hit = re.search(r'\{\s*"input_i".*?\}', log, re.S)
    if not hit:
        return None
    return json.loads(hit.group(0))


def first_frame_yellow(path, tmpdir):
    """首帧黄色（#FFD400 家族）像素占比：验证 0.00s 就有钩子价格"""
    import os
    from PIL import Image
    os.makedirs(tmpdir, exist_ok=True)
    png = os.path.join(tmpdir, "_f0.png")
    subprocess.run([FFMPEG, "-hide_banner", "-v", "error", "-y", "-i", path,
                    "-vf", "select=eq(n\\,0)", "-frames:v", "1", png],
                   capture_output=True, text=True)
    im = Image.open(png).convert("RGB")
    px = im.load()
    w, h = im.size
    hit = 0
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            r, g, b = px[x, y]
            if r > 210 and g > 170 and b < 110:
                hit += 1
    total = (w // 3 + 1) * (h // 3 + 1)
    return round(hit / total * 100, 2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--cues", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--tmp", default=None)
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--lufs-tol", type=float, default=1.0)
    ap.add_argument("--min-dur", type=float, default=15.0)
    args = ap.parse_args()

    cues = json.load(open(args.cues, encoding="utf-8"))
    info = probe(args.video)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    dur = float(info["format"]["duration"])
    fps_num, fps_den = (v["r_frame_rate"].split("/") + ["1"])[:2]
    fps = float(fps_num) / float(fps_den)

    black = run_log([FFMPEG, "-hide_banner", "-i", args.video,
                     "-vf", "blackdetect=d=0.05:pix_th=0.10", "-f", "null", "-"])
    freeze = run_log([FFMPEG, "-hide_banner", "-i", args.video,
                      "-vf", "freezedetect=n=0.003:d=0.5", "-f", "null", "-"])
    loud = loudness(args.video)

    checks = []
    def check(name, ok, detail=""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})

    check("尺寸 1080x1920", v and v["width"] == 1080 and v["height"] == 1920, f"{v['width']}x{v['height']}")
    check("30fps", abs(fps - 30) < 0.01, f"{fps:.2f}")
    check("帧数=时长×30", int(v["nb_frames"]) == round(dur * 30), f"{v['nb_frames']} vs {round(dur*30)}")
    check("时长≥15s", dur >= args.min_dur - 0.01, f"{dur:.2f}s")
    check("有音轨 48k", a is not None and a.get("sample_rate") == "48000", str(a))
    check("无黑帧", "black_start" not in black, "blackdetect clean" if "black_start" not in black else "有黑帧")
    check("无>0.5s冻帧", "freeze_start" not in freeze, "freezedetect clean" if "freeze_start" not in freeze else "有冻帧")
    if loud:
        li = float(loud["input_i"]); tp = float(loud["input_tp"])
        check("响度 -14±1 LUFS", abs(li - args.lufs) <= args.lufs_tol, f"I={li} TP={tp}")
        check("真峰值 ≤ -1.0", tp <= -1.0, f"TP={tp}")
    else:
        check("响度", False, "loudnorm 测量失败")
    y = first_frame_yellow(args.video, args.tmp or ".")
    check("首帧有钩子价格色块", y >= 1.0, f"yellow={y}%")

    ok = all(c["ok"] for c in checks)
    res = {
        "video": args.video, "cues": args.cues, "ok": ok,
        "duration": round(dur, 3), "fps": round(fps, 2),
        "checks": checks,
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    print(json.dumps(res, ensure_ascii=False, indent=2))
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
