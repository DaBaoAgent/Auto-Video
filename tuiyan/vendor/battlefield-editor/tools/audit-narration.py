"""严格旁白复听门禁:逐幕用大模型复听合成音频,按拼音比对原稿。

为什么要拼音:小模型/大模型都会把专名听岔(冀/季、荀彧/玄域、沮授/举兽),
纯汉字比对会把「听岔」误判成「漏读」。改用拼音后,同音听岔归位,只剩下
真正没读出来的字(如旧第3幕漏读「计策锁」),才能用很紧的阈值卡住。

判据(任一即 FAIL,记入 narration/audit.json,film.audioReady 亦受其约束):
  longest_gap > 2    连续 3 个及以上音节完全没听到 = 漏读,门禁不放行(真漏读就栽在这条)
  coverage < 0.80    原稿音节被读出的比例过低(防整段大面积没声)

为何 coverage 定 0.80 而不是更高:这套克隆音色把复听模型带偏得厉害,整词听岔极多
(颜良→颜梁、盾牌→洞台、阵型→这些、听得进话→听了静话…),单幕覆盖率天然掉到 85~95%,
再高就把「听得见、只是听错」误判成漏读。真正要卡的是「连续缺音」——TTS 会整句静默丢弃,
表现为连续 3 音节以上完全没声(旧第3幕漏「计策锁」、第24幕漏「主公回来一定会重用你」),
一律把 longest_gap 顶到 3 以上,由 max-gap 这条稳稳兜住。
coverage 在 0.80~0.90 之间的幕会进 report[review],自动用第二套复听模型(medium)交叉核对:
只有「连续缺音超限」且「听出的音节数比原稿明显缩水(<98%)」才算真漏读。克隆音色会把整句
换成同音串(如「辎重」→「自重」、「解鞍」→「简安」),听出的字数不变,只是听岔,不算漏读。
可用 --no-cross 跳过、--cross-model 换第二套模型。

用法:
  python tools/audit-narration.py --pkg packages/guandu-10min/battlefield.json \
    --model ~/.cache/battlefield-editor/faster-whisper-large-v3-turbo
退出码 0=全过 1=有幕不过;--json 指定报告路径(默认 packages/<slug>/narration/audit.json)。
"""
import argparse
import json
from difflib import SequenceMatcher
from pathlib import Path
import re
import subprocess
import sys

from pypinyin import lazy_pinyin

ROOT = Path(__file__).resolve().parent.parent


def clean(text):
    return re.sub(r"[^\w\u3400-\u9fff]", "", text, flags=re.UNICODE).replace("_", "")


def load_speak_fixes():
    """配音读数修正(与 generate-film-narration.make_speak 一致):〇→零、100→一百、3D→三低…
    复听必须和「送去合成的文本」比,不能和字幕定稿比,否则数字/3D 会被误判成漏读。"""
    path = ROOT / "tools/production-defaults.json"
    try:
        r = json.loads(path.read_text(encoding="utf-8")).get("narration", {}).get("speakFixes", {})
    except Exception:
        r = {}
    g = [tuple(p) for p in r.get("global", [])]
    a = {str(k): [tuple(p) for p in v] for k, v in (r.get("acts", {})).items()}
    return g, a


def speak_of(text, act, fixes):
    g, a = fixes
    s = text
    for src, dst in g + a.get(str(act), []):
        s = s.replace(src, dst)
    return s


_ARABIC = {"0": "ling", "1": "yi", "2": "er", "3": "san", "4": "si",
           "5": "wu", "6": "liu", "7": "qi", "8": "ba", "9": "jiu"}


def syllables(text):
    """汉字→拼音音节(去调)列表。阿拉伯数字按读音归一(200→er ling ling),
    否则复听把「二〇〇年」写成「200年」会与「二零零年」对不上,误判成漏读。"""
    out = []
    for ch in clean(text):
        if ch in _ARABIC:
            out.append(_ARABIC[ch])
            continue
        py = lazy_pinyin(ch)
        out.append(py[0] if py else ch)
    return out


def decode_mono16k(ffmpeg, path):
    import numpy as np
    raw = subprocess.check_output([ffmpeg, "-v", "error", "-i", str(path),
        "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1"])
    return np.frombuffer(raw, dtype="<f4")


def compare(syl_src, syl_heard):
    """返回 (coverage, longest_gap)。按音节序列比对。"""
    if not syl_src:
        return 0.0, 0
    sm = SequenceMatcher(None, syl_src, syl_heard, autojunk=False)
    matched = set()
    for m in sm.get_matching_blocks():
        for k in range(m.size):
            matched.add(m.a + k)
    coverage = len(matched) / len(syl_src)
    longest_gap, run = 0, 0
    for i in range(len(syl_src)):
        run = 0 if i in matched else run + 1
        longest_gap = max(longest_gap, run)
    return coverage, longest_gap


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pkg", required=True)
    ap.add_argument("--model", default=str(Path.home() / ".cache/battlefield-editor/faster-whisper-large-v3-turbo"))
    ap.add_argument("--json")
    ap.add_argument("--min-coverage", type=float, default=0.80)
    ap.add_argument("--max-gap", type=int, default=2)
    ap.add_argument("--cross-model", default=str(Path.home() / ".cache/battlefield-editor/faster-whisper-medium"),
                    help="低覆盖幕交叉核对的第二套模型")
    ap.add_argument("--no-cross", action="store_true", help="跳过第二模型交叉核对")
    ap.add_argument("--only", type=int)
    args = ap.parse_args()

    import os
    ffmpeg = os.environ.get("FFMPEG") or "ffmpeg"
    pkg = (ROOT / args.pkg).resolve()
    if pkg.name.endswith(".json"):            # 也接受 battlefield.json 路径
        pkg = pkg.parent
    if not str(pkg).startswith(str(ROOT / "packages")):
        raise SystemExit("需 packages 下的战役包")
    film = json.loads((pkg / "film.json").read_text(encoding="utf-8"))
    voice = film.get("voice") or "dabao"
    cues = json.loads((pkg / "narration/cues.json").read_text(encoding="utf-8"))
    out_json = Path(args.json) if args.json else (pkg / "narration/audit.json")

    from faster_whisper import WhisperModel
    print(f"加载复听模型 {Path(args.model).name} / CPU int8", flush=True)
    model = WhisperModel(args.model, device="cpu", compute_type="int8", cpu_threads=4)

    acts = sorted(int(k) for k in cues)
    fixes = load_speak_fixes()
    report = {"model": Path(args.model).name, "minCoverage": args.min_coverage,
              "maxGap": args.max_gap, "acts": {}, "failed": [], "review": []}
    for n in acts:
        if args.only and n != args.only:
            continue
        entry = cues[str(n)]
        text = speak_of(entry["text"], n, fixes)   # 与送去合成的一致
        audio = pkg / "assets/narration" / voice / f"scene{n}.mp3"
        if not audio.exists():
            report["acts"][str(n)] = {"ok": False, "why": "配音缺失"}
            report["failed"].append(n)
            print(f"第{n}幕 配音缺失", flush=True)
            continue
        segments, _ = model.transcribe(decode_mono16k(ffmpeg, audio), language="zh",
                                       beam_size=5, vad_filter=False)
        heard = "".join(s.text for s in segments)
        cov, gap = compare(syllables(text), syllables(heard))
        ok = cov >= args.min_coverage and gap <= args.max_gap
        report["acts"][str(n)] = {"ok": ok, "coverage": round(cov, 4), "longestGap": gap,
                                  "title": entry.get("title", ""), "heard": heard}
        if not ok:
            report["failed"].append(n)
        elif cov < 0.90:
            report["review"].append(n)     # 覆盖率偏低但无连续漏音:交第二模型交叉核对
        print(f"第{n:>2}幕 匹配 {cov:6.2%} 最长漏读 {gap} {'OK' if ok else 'FAIL'}"
              f"  {entry.get('title','')}", flush=True)

    # 低覆盖幕(0.80~0.90)用第二套模型交叉核对:两套都听不到同一整句才判真漏读。
    # 判据加「音节数守恒」——克隆音色会把整句换成同音串(听出的字数基本不变),真漏读
    # 才会让听出的音节数明显少于原稿;故 gap 超限且音节数缩水才算漏读,同音听岔不算。
    cross = []
    if report["review"] and not args.no_cross:
        print(f"复核低覆盖幕 {report['review']} / 第二模型 {Path(args.cross_model).name}", flush=True)
        cmodel = WhisperModel(args.cross_model, device="cpu", compute_type="int8", cpu_threads=4)
        for n in list(report["review"]):
            entry = cues[str(n)]
            text = speak_of(entry["text"], n, fixes)
            audio = pkg / "assets/narration" / voice / f"scene{n}.mp3"
            segments, _ = cmodel.transcribe(decode_mono16k(ffmpeg, audio), language="zh",
                                            beam_size=5, vad_filter=False)
            heard = "".join(s.text for s in segments)
            src_syl, heard_syl = syllables(text), syllables(heard)
            cov, gap = compare(src_syl, heard_syl)
            dropped = gap > args.max_gap and len(heard_syl) < 0.98 * len(src_syl)
            item = {"act": n, "coverage": round(cov, 4), "longestGap": gap, "srcSyl": len(src_syl),
                    "heardSyl": len(heard_syl), "dropped": dropped, "heard": heard}
            cross.append(item)
            report["acts"][str(n)]["cross"] = item
            if dropped:
                report["acts"][str(n)]["ok"] = False
                report["failed"].append(n)
            print(f"  第{n:>2}幕 复核 {cov:6.2%} 最长漏读 {gap} 音节 {len(heard_syl)}/{len(src_syl)} "
                  f"{'真漏读' if dropped else '同音听岔'}", flush=True)
    report["cross"] = cross

    report["passed"] = len(report["failed"]) == 0
    out_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n复听{'通过' if report['passed'] else '未通过'} · 失败幕 {report['failed']} · 报告 {out_json}", flush=True)
    sys.exit(0 if report["passed"] else 1)


if __name__ == "__main__":
    main()
