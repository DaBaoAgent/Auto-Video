#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""sync_qa.py — 口播对齐与分镜节奏校验（laolang 管线）

用法（在 laolang/ 目录下）：
  python scripts/sync_qa.py shots projects/<工程> [--html sample.html]
  python scripts/sync_qa.py captions projects/<工程> [--html sample.html]
  python scripts/sync_qa.py audio projects/<工程> [--video out/video-16x9.mp4] [--offset 0]
  python scripts/sync_qa.py ocr projects/<工程> [--video out/video-16x9.mp4]
  python scripts/sync_qa.py sync projects/<工程> [--html sample.html] [--video out/video-16x9.mp4] [--ocr]

检查什么：
  shots     页面里的 G.shot(a,b) —— 每镜 2.0–4.0 s、首尾相接、切点落在口播的句首/词首
            或 ≥0.12 s 的停顿里；可选 --video 用 ffmpeg 场景检测对比真实切点。
  captions  render.mjs --captions 输出的字幕段 —— 文字必须属于时间轴原文，起点必须
            落在词级时间上（字幕只能由 EV.captionSegments 生成，不许按字数均分）。
  audio     成片音轨 vs audio/narration.wav —— 包络互相关滞后（默认 |lag| ≤ 40 ms），
            faster-whisper 重转写后与口播稿比对、逐句起点偏差（中位 ≤ 0.30 s，
            且超差句数 ≤ 20%）。
  ocr       成片里烧录的字幕逐段抽帧，交 Dabao-OCR（127.0.0.1:18224）识别并比对。

退出码：0 = 全部通过；1 = 有不合格项。
报告：sync 写 <工程>/review/sync_qa.json；单独跑 shots/captions/audio/ocr 写
<工程>/review/sync_qa_<cmd>.json，不会覆盖完整报告。
"""
import argparse
import difflib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
STYLE_ROOT = os.path.dirname(HERE)
RUNTIME = os.path.join(STYLE_ROOT, "runtime")
OCR_URL = "http://127.0.0.1:18224/api/ocr"

CJK = re.compile(r"[\u3400-\u9fff0-9A-Za-z]")
SHOT_RE = re.compile(r"G\.shot\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,")
CAP_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s+(.*\S)\s*$")
PTS_RE = re.compile(r"pts_time:([0-9.]+)")


def out(s=""):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    print(s)


def norm(s):
    return "".join(CJK.findall(s or ""))


def read_text(path):
    with open(path, encoding="utf-8-sig") as f:
        return f.read()


def load_js(path, var):
    s = read_text(path)
    m = re.search(r"window\.%s\s*=\s*(\{.*\}|\[.*\])\s*;?\s*$" % var, s, re.S)
    if not m:
        return None
    return json.loads(m.group(1))


def resolve(arg, html=None):
    """工程目录或 .html 文件 → (工程目录, 页面路径或 None)。"""
    p = os.path.abspath(arg)
    page = None
    if os.path.isfile(p) and p.lower().endswith((".html", ".htm")):
        page, p = p, os.path.dirname(p)
    html_path = None
    if html:
        html_path = html if os.path.isabs(html) else os.path.join(p, html)
    elif page:
        html_path = page
    else:
        for name in ("sample.html", "index.html"):
            q = os.path.join(p, name)
            if os.path.exists(q):
                html_path = q
                break
    if html_path and not os.path.isabs(html_path):
        html_path = os.path.join(p, html_path)
    return p, html_path


def timeline_of(proj, html_path):
    """页面实际加载的时间轴（sample.html 读 sample_timeline.js，index.html 读 timeline.js）。"""
    cand = None
    if html_path and os.path.exists(html_path):
        m = re.search(r'<script[^>]+src=["\']([^"\']*timeline\.js)["\']', read_text(html_path))
        if m:
            cand = os.path.normpath(os.path.join(proj, m.group(1)))
    for p in (cand, os.path.join(proj, "timeline.js")):
        if p and os.path.exists(p):
            t = load_js(p, "TIMELINE")
            if t:
                t["_path"] = p
                return t
    return None


def parse_shots(html_path):
    txt = read_text(html_path)
    shots = []
    for m in SHOT_RE.finditer(txt):
        a, b = float(m.group(1)), float(m.group(2))
        if b > a:
            shots.append({"start": round(a, 3), "end": round(b, 3)})
    shots.sort(key=lambda s: (s["start"], s["end"]))
    return shots


def words_of(T):
    ws = []
    for li, line in enumerate(T.get("lines") or []):
        for w in line.get("words") or []:
            txt = (w.get("text") or "").strip()
            if not norm(txt):
                continue
            ws.append({"s": float(w["start"]), "e": float(w["end"]), "w": txt, "line": li})
    ws.sort(key=lambda w: (w["s"], w["e"]))
    return ws


def cut_verdict(c, words, tol, min_gap):
    """切点是否落在口播边界：词首附近，或两个词之间 ≥ min_gap 的停顿里。"""
    near = min(words, key=lambda w: abs(w["s"] - c)) if words else None
    nd = abs(near["s"] - c) if near else 1e9
    if nd <= tol:
        return True, "句/词首 %.2f「%s」Δ%.2f" % (near["s"], near["w"], nd)
    for a, b in zip(words, words[1:]):
        if a["e"] <= c <= b["s"]:
            gap = b["s"] - a["e"]
            if gap >= min_gap:
                return True, "停顿 %.2f–%.2f（%.2f s）" % (a["e"], b["s"], gap)
            return False, "停顿太短 %.2f s（%.2f–%.2f）" % (gap, a["e"], b["s"])
    if near:
        return False, "离最近词首 %.2f s「%s」@ %.2f" % (nd, near["w"], near["s"])
    return False, "时间轴没有词级时间"


def check_shots(proj, html_path, T, min_dur, max_dur, tol, min_gap):
    shots = parse_shots(html_path)
    res = {"page": html_path, "timeline": T.get("_path"), "shots": [], "errors": [], "warnings": []}
    if not shots:
        res["errors"].append("页面里找不到 G.shot(a, b, …)，无法校验分镜")
        return res
    words = words_of(T)
    dur = float(T.get("duration") or 0)
    frame = 1.0 / 30.0
    prev_end = None
    for i, s in enumerate(shots, 1):
        d = s["end"] - s["start"]
        row = {"i": i, "start": s["start"], "end": s["end"], "dur": round(d, 3), "cut": None, "ok": True}
        if d < min_dur - frame:
            res["errors"].append("S%02d 时长 %.2f s < %.1f s" % (i, d, min_dur))
            row["ok"] = False
        if d > max_dur + frame:
            res["errors"].append("S%02d 时长 %.2f s > %.1f s" % (i, d, max_dur))
            row["ok"] = False
        if prev_end is None and abs(s["start"]) > frame:
            res["errors"].append("S%02d 不是从 0 开始（%.2f s）" % (i, s["start"]))
            row["ok"] = False
        if prev_end is not None and abs(s["start"] - prev_end) > frame:
            res["errors"].append("S%02d 与上一镜不相接：%.2f vs %.2f" % (i, s["start"], prev_end))
            row["ok"] = False
        if i > 1:
            ok, why = cut_verdict(s["start"], words, tol, min_gap)
            row["cut"] = why
            if not ok:
                res["errors"].append("S%02d 切点 %.2f 不在口播边界：%s" % (i, s["start"], why))
                row["ok"] = False
        prev_end = s["end"]
        res["shots"].append(row)
    if dur and abs(shots[-1]["end"] - dur) > max(0.05, frame * 2):
        res["warnings"].append("末镜结束 %.2f s，时间轴时长 %.2f s" % (shots[-1]["end"], dur))
    if dur and shots[-1]["end"] > dur + frame:
        res["errors"].append("末镜超出时间轴：%.2f > %.2f" % (shots[-1]["end"], dur))
    durs = [r["dur"] for r in res["shots"]]
    res["summary"] = {
        "count": len(shots),
        "min_dur": min(durs), "max_dur": max(durs),
        "avg_dur": round(sum(durs) / len(durs), 3),
        "span": [shots[0]["start"], shots[-1]["end"]],
        "timeline_duration": dur,
    }
    res["ok"] = not res["errors"]
    return res


def detect_cuts(video, threshold=0.12):
    cmd = ["ffmpeg", "-v", "info", "-i", video,
           "-vf", "select='gt(scene,%.2f)',showinfo" % threshold, "-an", "-f", "null", "-"]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    cuts = []
    for line in (r.stderr or "").splitlines():
        m = PTS_RE.search(line)
        if m:
            cuts.append(round(float(m.group(1)), 3))
    return sorted(set(cuts))


def video_duration(video):
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                            "-of", "default=nw=1:nk=1", video], capture_output=True, text=True)
        return float((r.stdout or "").strip() or 0)
    except Exception:
        return 0.0


def check_cuts(video, shots, start=0.0):
    """成片里检测到的真实切点 vs 页面声明的切点（场景检测是启发式，只报警告）。"""
    res = {"video": video, "detected": [], "missing": [], "extra": [], "warnings": [], "start": start}
    if not video or not os.path.exists(video):
        res["warnings"].append("没有成片，跳过真实切点检测")
        return res
    detected = detect_cuts(video)
    declared = [s["start"] for s in shots[1:]]
    # 分段渲染的成片只校验这一段里的切点：绝对时间 → 片内时间
    vdur = video_duration(video)
    if vdur > 0:
        declared = [round(t - start, 3) for t in declared if start - 0.001 <= t < start + vdur - 0.05]
        res["video_duration"] = round(vdur, 3)
    res["detected"] = detected
    tol = 0.15
    for t in declared:
        if not any(abs(t - d) <= tol for d in detected):
            res["missing"].append(round(t, 3))
    for d in detected:
        if not any(abs(t - d) <= tol for t in declared):
            res["extra"].append(d)
    if res["missing"]:
        res["warnings"].append("声明切点中 %d 个没在成片里检出（场景检测可能漏检，逐帧确认）：%s" % (
            len(res["missing"]), res["missing"]))
    if res["extra"]:
        res["warnings"].append("成片里还有 %d 个未声明的突变（可能是闪帧/内部大动作，需目视）：%s" % (
            len(res["extra"]), res["extra"]))
    res["declared"] = declared
    return res


def print_shots(res):
    s = res.get("summary") or {}
    out("分镜：%d 个，时长 %.2f–%.2f s（平均 %.2f），覆盖 %.2f–%.2f / 时间轴 %.2f s" % (
        s.get("count", 0), s.get("min_dur", 0), s.get("max_dur", 0),
        s.get("avg_dur", 0), s.get("span", [0, 0])[0], s.get("span", [0, 0])[1],
        s.get("timeline_duration", 0)))
    for r in res["shots"]:
        cut = ("  切点：" + r["cut"]) if r["cut"] else ""
        out("  S%02d %6.2f–%6.2f  %.2f s%s" % (r["i"], r["start"], r["end"], r["dur"], cut))
    for e in res["errors"]:
        out("  ✗ " + e)
    for w in res.get("warnings") or []:
        out("  ! " + w)


def ffmpeg_extract(src, dst, start=0.0, dur=None, sr=16000, crop=None, frames=None):
    cmd = ["ffmpeg", "-v", "error", "-y"]
    if start:
        cmd += ["-ss", "%.3f" % start]
    if dur:
        cmd += ["-t", "%.3f" % dur]
    cmd += ["-i", src]
    if frames:
        cmd += ["-frames:v", "1"]
    if crop:
        cmd += ["-vf", crop]
    if frames:
        cmd += ["-q:v", "2"]
    else:
        cmd += ["-ac", "1", "-ar", str(sr)]
    cmd += [dst]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip() or "ffmpeg failed")


def load_pcm16(path):
    import wave
    with wave.open(path, "rb") as w:
        if w.getsampwidth() != 2:
            raise RuntimeError("expect 16-bit wav: %s" % path)
        n = w.getnframes()
        raw = w.readframes(n)
        stereo = w.getnchannels() > 1
        sr = w.getframerate()
    import array
    a = array.array("h")
    a.frombytes(raw)
    if stereo:
        a = array.array("h", a[::2])
    return a, sr


def envelope(a, hop=160):
    env = []
    for i in range(0, len(a) - hop + 1, hop):
        s = 0
        for v in a[i:i + hop]:
            s += v * v
        env.append(math.sqrt(s / hop))
    m = sum(env) / max(1, len(env))
    return [x / m if m else 0.0 for x in env]


def lag_ms(ref, sig, hop_ms=10.0, span_ms=500):
    n = min(len(ref), len(sig))
    if n < 20:
        return 0.0, 0.0
    best = (0, -2.0)
    max_lag = int(span_ms / hop_ms)
    for k in range(-max_lag, max_lag + 1):
        lo = max(0, k)
        hi = min(n, n + k)
        if hi - lo < n * 0.5:
            continue
        a = ref[lo:hi]
        b = sig[lo - k:hi - k]
        num = sum(x * y for x, y in zip(a, b))
        da = math.sqrt(sum(x * x for x in a))
        db = math.sqrt(sum(y * y for y in b))
        r = num / (da * db) if da and db else 0.0
        if r > best[1]:
            best = (k, r)
    return best[0] * hop_ms, best[1]


def run_captions(proj, html_path, T):
    if not html_path or not os.path.exists(html_path):
        return {"ok": False, "errors": ["找不到页面（--html）"], "captions": []}
    env = dict(os.environ)
    chrome = os.environ.get("CHROME_PATH") or r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if os.path.exists(chrome):
        env["CHROME_PATH"] = chrome
    cmd = ["node", os.path.join(RUNTIME, "render.mjs"), proj]
    if os.path.basename(html_path) != "index.html":
        cmd += ["--html", os.path.basename(html_path)]
    cmd += ["--captions"]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", env=env)
    caps = []
    for line in (r.stdout or "").splitlines():
        m = CAP_RE.match(line)
        if m:
            caps.append({"start": round(float(m.group(1)), 3), "end": round(float(m.group(2)), 3),
                         "text": m.group(3).strip()})
    res = {"ok": True, "captions": caps, "errors": [], "warnings": []}
    if r.returncode != 0 and not caps:
        res["ok"] = False
        res["errors"].append("render.mjs --captions 失败：" + ((r.stderr or r.stdout or "").strip()[-300:]))
        return res
    if not caps:
        res["ok"] = False
        res["errors"].append("没有字幕段（页面 captions 是否关闭？）")
        return res
    words = words_of(T)
    lines = T.get("lines") or []
    for i, c in enumerate(caps, 1):
        cands = [l for l in lines
                 if float(l.get("start", 0)) - 0.05 <= c["start"] <= float(l.get("end", 0)) + 0.05]
        line = max(cands, key=lambda l: float(l.get("start", 0))) if cands else None
        cn = norm(c["text"])
        if not line:
            res["errors"].append("C%02d %.2f 不属于任何旁白行" % (i, c["start"]))
            continue
        if cn not in norm(line.get("text")):
            res["errors"].append("C%02d 文字不在时间轴原文里：%s" % (i, c["text"]))
        nearest = min(words, key=lambda w: abs(w["s"] - c["start"])) if words else None
        c["line"] = line.get("id")
        c["onset"] = round(nearest["s"], 3) if nearest else None
        c["off"] = round(abs(nearest["s"] - c["start"]), 3) if nearest else None
        if nearest and c["off"] > 0.30:
            res["errors"].append("C%02d 起点 %.2f 离最近词首 %.2f 有 %.2f s" % (
                i, c["start"], nearest["s"], c["off"]))
    dur = float(T.get("duration") or 0)
    if dur and caps[-1]["end"] > dur + 0.05:
        res["warnings"].append("末条字幕到 %.2f s，超出片长 %.2f s（0.25 s 尾巴被片尾裁掉，正常）" % (
            caps[-1]["end"], dur))
    res["ok"] = not res["errors"]
    return res


def print_cuts(res):
    if not res:
        return
    out("真实切点：检出 %d / 声明 %d" % (len(res.get("detected") or []), len(res.get("declared") or [])))
    for w in res.get("warnings") or []:
        out("  ! " + w)


def print_captions(res):
    out("字幕段：%d 条" % len(res.get("captions") or []))
    for i, c in enumerate(res.get("captions") or [], 1):
        out("  C%02d %6.2f–%6.2f  %s" % (i, c["start"], c["end"], c["text"]))
        if c.get("off") is not None and c["off"] > 0.12:
            out("       起点偏差 %.2f s（词首 %.2f）" % (c["off"], c["onset"]))
    for e in res.get("errors") or []:
        out("  ✗ " + e)
    for w in res.get("warnings") or []:
        out("  ! " + w)


def run_audio(proj, video, offset, asr_model, tol=0.30):
    res = {"ok": True, "errors": [], "warnings": [], "offset": offset}
    if not video or not os.path.exists(video):
        res["ok"] = False
        res["errors"].append("找不到成片：%s" % video)
        return res
    narr = os.path.join(proj, "audio", "narration.wav")
    src_m4a = os.path.join(proj, "audio", "narration.m4a")
    if not os.path.exists(narr) and not os.path.exists(src_m4a):
        res["ok"] = False
        res["errors"].append("缺少 audio/narration.wav（先跑 vo）")
        return res
    tmp = tempfile.mkdtemp(prefix="syncqa_")
    try:
        # 旁白一律重采到 16 kHz 单声道再算包络：vo 产物常是 44.1/48 kHz
        narr16 = os.path.join(tmp, "narration16.wav")
        ffmpeg_extract(narr if os.path.exists(narr) else src_m4a, narr16, sr=16000)
        got = os.path.join(tmp, "video.wav")
        ffmpeg_extract(video, got, sr=16000)
        a, _ = load_pcm16(got)
        b, _ = load_pcm16(narr16)
        dur = len(a) / 16000.0
        s0 = int(offset * 16000)
        b = b[s0:s0 + len(a)]
        ms, r = lag_ms(envelope(b), envelope(a))
        res["audio"] = {"video_seconds": round(dur, 3), "lag_ms": round(ms, 1), "r": round(r, 4)}
        if abs(ms) > 40:
            res["errors"].append("成片音轨与旁白滞后 %.0f ms（应 ≤ 40 ms）" % ms)
        if r < 0.90:
            res["warnings"].append("包络相关 r=%.3f 偏低（可能画外音/音效不同）" % r)

        try:
            from faster_whisper import WhisperModel
        except Exception:
            res["warnings"].append("没有 faster-whisper，跳过 ASR 复核")
            return res
        import numpy as np
        model = WhisperModel(asr_model, device="cpu", compute_type="int8")
        # PyAV 在这台机器上打不开 wav（metadata_errors），沿用 asr_probe.py：ffmpeg 解码后喂 ndarray
        audio = np.frombuffer(a.tobytes(), dtype=np.int16).astype(np.float32) / 32768.0
        segs, _ = model.transcribe(audio, language="zh", word_timestamps=True, vad_filter=False,
                                   initial_prompt="以下是普通话口播稿。")
        asr_words = []
        for s in segs:
            for w in (s.words or []):
                txt = (w.word or "").strip()
                if norm(txt):
                    asr_words.append({"s": float(w.start) + offset, "e": float(w.end) + offset, "w": txt})
        T = load_js(os.path.join(proj, "timeline.js"), "TIMELINE") or {"lines": []}
        # 分段渲染时 offset 是段首时间：口播稿也只取这一段，否则拿全片文本比一段音轨必然低分
        spoken = "".join(norm(l.get("text")) for l in (T.get("lines") or [])
                         if offset - 0.05 <= float(l.get("start", 0)) < offset + dur)
        heard = "".join(norm(w["w"]) for w in asr_words)
        ratio = difflib.SequenceMatcher(None, spoken, heard, autojunk=False).ratio() if spoken else 0
        offs = []
        for l in (T.get("lines") or []):
            st = float(l.get("start", 0))
            if not (offset - 0.05 <= st < offset + dur):
                continue
            if not asr_words:
                break
            nw = min(asr_words, key=lambda w: abs(w["s"] - st))
            offs.append(abs(nw["s"] - st))
        bad = sum(1 for x in offs if x > tol)
        median = sorted(offs)[len(offs) // 2] if offs else None
        res["asr"] = {
            "model": asr_model, "chars": [len(spoken), len(heard)], "text_ratio": round(ratio, 4),
            "lines": len(offs), "line_onset_median": round(median, 3) if median is not None else None,
            "line_onset_max": round(max(offs), 3) if offs else None,
            "lines_over_tol": bad,
        }
        # small 模型会把同音字听错（驴友→旅游、巷→相），同步看的是句起点，不是转写准确率
        if ratio < 0.65:
            res["errors"].append("ASR 文本与口播稿相似度 %.0f%% < 65%%，疑似音轨不对" % (ratio * 100))
        elif ratio < 0.80:
            res["warnings"].append("ASR 相似度 %.0f%%（small 模型同音字误差，属正常）" % (ratio * 100))
        if median is not None and median > tol:
            res["errors"].append("逐句起点中位偏差 %.3f s > %.2f s" % (median, tol))
        if offs and bad > max(1, len(offs) * 0.2):
            res["errors"].append("%d/%d 句起点偏差 > %.2f s（应 ≤20%%）" % (bad, len(offs), tol))
        rev = os.path.join(proj, "review")
        os.makedirs(rev, exist_ok=True)
        json.dump({"duration": dur, "words": asr_words},
                  open(os.path.join(rev, "asr_rendered.json"), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    res["ok"] = not res["errors"]
    return res


def print_audio(res):
    a = res.get("audio") or {}
    out("音频：成片 %.2f s，包络滞后 %.1f ms（r=%.4f）" % (
        a.get("video_seconds", 0), a.get("lag_ms", 0), a.get("r", 0)))
    s = res.get("asr")
    if s:
        out("ASR：相似度 %.1f%%，%d 句起点中位偏 %.3f s / 最大 %.3f s，超差 %d 句" % (
            s["text_ratio"] * 100, s["lines"], s["line_onset_median"] or 0,
            s["line_onset_max"] or 0, s["lines_over_tol"]))
    for e in res.get("errors") or []:
        out("  ✗ " + e)
    for w in res.get("warnings") or []:
        out("  ! " + w)


def ocr_image(path, max_side=None):
    opts = {"data.format": "dict"}
    if max_side:
        # 字幕字高只有几十像素，Dabao 默认 maxSideLen=1024 会把整帧缩到字看不清
        opts["ocr.maxSideLen"] = max_side
    body = json.dumps({"path": path.replace("/", "\\"),
                       "options": opts}).encode("utf-8")
    req = urllib.request.Request(OCR_URL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        j = json.loads(r.read().decode("utf-8"))
    if j.get("code") == 100:
        return "".join((d.get("text") or "") for d in (j.get("data") or []))
    if j.get("code") == 101:
        return ""
    raise RuntimeError("OCR code=%s %s" % (j.get("code"), j.get("msg") or j))


def run_ocr(proj, video, caps, start=0.0):
    res = {"ok": True, "errors": [], "rows": [], "start": start}
    outdir = os.path.join(proj, "review", "ocr_sync")
    os.makedirs(outdir, exist_ok=True)
    if not video or not os.path.exists(video):
        res["ok"] = False
        res["errors"].append("找不到成片：%s" % video)
        return res
    # 分段渲染的成片只 OCR 这一段里的字幕段，采样时再减去段首偏移
    vdur = video_duration(video)
    if vdur > 0:
        caps = [c for c in caps if start - 0.001 <= (c["start"] + c["end"]) / 2.0 < start + vdur - 0.05]
    if not caps:
        res["ok"] = False
        res["errors"].append("没有字幕段可 OCR")
        return res
    for i, c in enumerate(caps, 1):
        mid = (c["start"] + c["end"]) / 2.0
        png = os.path.join(outdir, "cap_%02d.png" % i)
        try:
            # 字幕带固定在画面下方约 20%：字幕中心在 88.5%，带底晕后要留够余量，别切掉字顶。
            # 横向只取中间 76%（字幕最宽 86%×设计宽 ≈ 65% 画面宽），整幅 1920 宽会被
            # Dabao 缩到 1024 长边、字高减半导致漏检（实测 C23/C33）；再抬到 2048 不缩。
            ffmpeg_extract(video, png, start=mid - start,
                           crop="crop=iw*0.76:ih*0.20:iw*0.12:ih*0.80", frames=1)
            got = ocr_image(os.path.abspath(png), max_side=2048)
        except Exception as e:
            res["ok"] = False
            res["errors"].append("C%02d %.2f OCR 失败：%s（Dabao-OCR 服务：D:\\@kaifa\\Dabao-OCR\\scripts\\serve.cmd）" % (i, mid, e))
            continue
        want, gotn = norm(c["text"]), norm(got)
        ok = bool(want) and (want in gotn or difflib.SequenceMatcher(None, want, gotn).ratio() >= 0.8)
        res["rows"].append({"i": i, "t": round(mid, 2), "want": c["text"], "got": got.strip(), "ok": ok})
        if not ok:
            res["ok"] = False
            res["errors"].append("C%02d %.2f 烧录字幕不符：want「%s」got「%s」" % (i, mid, c["text"], got.strip()))
    return res


def print_ocr(res):
    for r in res.get("rows") or []:
        out("  C%02d %6.2f  %s  「%s」" % (r["i"], r["t"], "✓" if r["ok"] else "✗", r["want"]))
    for e in res.get("errors") or []:
        out("  ✗ " + e)


def save_report(proj, data, cmd_name):
    d = os.path.join(proj, "review")
    os.makedirs(d, exist_ok=True)
    # 只有完整 sync 写 sync_qa.json；单项报告分开写，避免覆盖已验收的完整报告
    name = "sync_qa.json" if cmd_name == "sync" else "sync_qa_%s.json" % cmd_name
    p = os.path.join(d, name)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    out("报告：%s" % p)


def main():
    ap = argparse.ArgumentParser(description="laolang 口播对齐与分镜节奏校验")
    sub = ap.add_subparsers(dest="cmd", required=True)

    def common(p):
        p.add_argument("proj")
        p.add_argument("--html")
        p.add_argument("--video")
        p.add_argument("--min", type=float, default=2.0)
        p.add_argument("--max", type=float, default=4.0)
        p.add_argument("--tol", type=float, default=0.35)
        p.add_argument("--min-gap", type=float, default=0.12)
        # 分段渲染：成片第一帧对应时间轴上的哪一秒（默认 0 = 整片）
        p.add_argument("--start", type=float, default=0.0)

    p = sub.add_parser("shots"); common(p); p.set_defaults(cmd_name="shots")
    p = sub.add_parser("captions"); common(p); p.set_defaults(cmd_name="captions")
    p = sub.add_parser("audio"); common(p)
    p.add_argument("--offset", type=float, default=0.0)
    p.add_argument("--asr-model", default="small")
    p.set_defaults(cmd_name="audio")
    p = sub.add_parser("ocr"); common(p); p.set_defaults(cmd_name="ocr")
    p = sub.add_parser("sync"); common(p)
    p.add_argument("--offset", type=float, default=0.0)
    p.add_argument("--asr-model", default="small")
    p.add_argument("--ocr", action="store_true")
    p.add_argument("--no-audio", action="store_true")
    p.set_defaults(cmd_name="sync")

    a = ap.parse_args()
    proj, html_path = resolve(a.proj, a.html)
    video = a.video
    if not video:
        for name in ("video-16x9.mp4", "video.mp4"):
            q = os.path.join(proj, "out", name)
            if os.path.exists(q):
                video = q
                break
    elif not os.path.isabs(video):
        video = os.path.abspath(video) if os.path.exists(video) else os.path.join(proj, video)
    T = timeline_of(proj, html_path)
    if not T:
        sys.exit("找不到时间轴（timeline.js / sample_timeline.js）")

    report = {"project": proj, "page": html_path, "video": video}
    ok = True

    if a.cmd_name == "shots":
        r = check_shots(proj, html_path, T, a.min, a.max, a.tol, a.min_gap)
        print_shots(r)
        report["shots"] = r
        ok = r["ok"]
        if video:
            ct = check_cuts(video, r["shots"], a.start)
            print_cuts(ct)
            report["cuts"] = ct
    elif a.cmd_name == "captions":
        r = run_captions(proj, html_path, T)
        print_captions(r)
        report["captions"] = r
        ok = r["ok"]
    elif a.cmd_name == "audio":
        r = run_audio(proj, video, a.offset, a.asr_model)
        print_audio(r)
        report["audio_check"] = r
        ok = r["ok"]
    elif a.cmd_name == "ocr":
        c = run_captions(proj, html_path, T)
        print_captions(c)
        r = run_ocr(proj, video, c.get("captions"), a.start)
        print_ocr(r)
        report["captions"] = c
        report["ocr"] = r
        ok = c["ok"] and r["ok"]
    else:
        sr = check_shots(proj, html_path, T, a.min, a.max, a.tol, a.min_gap)
        print_shots(sr)
        report["shots"] = sr
        ok = ok and sr["ok"]
        if video:
            ct = check_cuts(video, sr["shots"], a.start)
            print_cuts(ct)
            report["cuts"] = ct
        cr = run_captions(proj, html_path, T)
        print_captions(cr)
        report["captions"] = cr
        ok = ok and cr["ok"]
        if not a.no_audio:
            ar = run_audio(proj, video, a.offset or a.start, a.asr_model)
            print_audio(ar)
            report["audio_check"] = ar
            ok = ok and ar["ok"]
        if a.ocr:
            rr = run_ocr(proj, video, cr.get("captions"), a.start)
            print_ocr(rr)
            report["ocr"] = rr
            ok = ok and rr["ok"]

    report["ok"] = ok
    save_report(proj, report, a.cmd_name)
    out("结论：%s" % ("PASS" if ok else "FAIL"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
