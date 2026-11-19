#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""laorou 口播稿确定性校验器（alannew 移植版）

用法:
  python check_script.py <稿件文件> [--min 5500] [--max 6500]

硬性检查(HARD): 字数区间 / 无英文字母 / 无阿拉伯数字 / 无 em-dash / 无儿化音 / 无 AI 套壳词
提示检查(SOFT): 旧版签名残留 / 50 字重复片段 / 段落数 / 是否误写"老肉"
退出码: 0 = 全过, 1 = 有硬性问题
"""
import argparse
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ERHUA = ["会儿", "点儿", "事儿", "活儿", "今儿", "明儿", "昨儿", "词儿", "字儿",
         "劲儿", "味儿", "玩意儿", "没准儿", "大伙儿", "哥们儿", "爷们儿",
         "头儿", "主儿", "门儿清", "自个儿", "份儿", "块儿", "地儿", "够劲儿"]
AI_WORDS = ["首先", "其次", "再次", "综上所述", "值得注意的是", "本质上",
            "总而言之", "众所周知", "不难看出", "让我们"]


def main() -> int:
    ap = argparse.ArgumentParser(description="laorou 口播稿校验器")
    ap.add_argument("file", help="稿件文件路径")
    ap.add_argument("--min", type=int, default=5500, help="最少非空白字数")
    ap.add_argument("--max", type=int, default=6500, help="最多非空白字数")
    args = ap.parse_args()

    raw = Path(args.file).read_text(encoding="utf-8")
    text = re.sub(r"\s+", "", raw)
    n = len(text)
    hard_fail = []

    def hard(name, passed, detail=""):
        print(f"[{'PASS' if passed else 'FAIL'}] {name}" + (f" | {detail}" if detail else ""))
        if not passed:
            hard_fail.append(name)

    def soft(name, passed, detail=""):
        print(f"[{'ok' if passed else 'WARN'}] {name}" + (f" | {detail}" if detail else ""))

    hard(f"字数 {args.min}-{args.max}", args.min <= n <= args.max, f"非空白 {n} 字")

    lines = [ln.strip() for ln in raw.strip().splitlines() if ln.strip()]
    last = lines[-1] if lines else ""

    latin = re.findall(r"[A-Za-z]+", raw)
    hard("无英文字母", not latin, ",".join(sorted(set(latin))[:6]))
    digits = re.findall(r"\d+", raw)
    hard("无阿拉伯数字", not digits, ",".join(digits[:6]))
    dashes = re.findall(r"[—–]|--", raw)
    hard("无 em/en dash", not dashes, f"{len(dashes)} 处")

    eh = sorted({p for p in ERHUA if p in raw})
    hard("无儿化音(黑名单)", not eh, ",".join(eh))
    ai = sorted({w for w in AI_WORDS if w in raw})
    hard("无AI套壳词", not ai, ",".join(ai))

    # 50 字重复片段检测（含重叠计数，示例前 3 条）
    grams, dup, L = {}, 0, 50
    for i in range(len(text) - L):
        g = text[i:i + L]
        if g in grams:
            dup += 1
            if dup <= 3:
                print("    重复示例:", g[:36])
        else:
            grams[g] = i
    soft("无50字重复片段", dup == 0, f"{dup} 处")

    paras = [p for p in re.split(r"\n\s*\n", raw.strip()) if p.strip()]
    soft("段落数", True, f"{len(paras)} 段")

    if "遛狗去了" in raw:
        soft("无旧版签名残留", False, "旧签名（遛狗去了）已于 2026-10-05 停用，请删除")

    if "老肉" in raw:
        soft("不含『老肉』字样", False, "发现『老肉』，检查是否误写")

    print("-" * 40)
    if hard_fail:
        print(f"RESULT: FAIL ({len(hard_fail)} 项): " + "; ".join(hard_fail))
        return 1
    print("RESULT: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
