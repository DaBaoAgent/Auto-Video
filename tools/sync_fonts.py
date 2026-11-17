"""字体单份化：仓库只留一份字体，渲染前按需同步到工程目录。

为什么不能直接引用 `assets/fonts/`：
    每个渲染器只服务「工程目录」这一个根（`render.mjs` / `render-legacy.mjs` / `render-mg.mjs` 都是），
    所以字体必须物理地待在工程目录里。之前每个工程各存一份，同一款字体在仓库里躺了 4–5 份。

现在的规则：
    - `assets/fonts/` 是唯一副本（OFL / 免费商用字体）；
    - KaiTi 是微软 Windows 系统字体，**不进仓库**；渲染前从系统字体目录复制（`BV_FONT_KAI` 可切到 OFL 替代），
      这样本机渲染字形和以前完全一致，公开仓库也不再分发专有字体；
    - 复制出来的文件在 `.gitignore` 里，`git status` 不会变脏。

用法：
    python tools/sync_fonts.py            # 同步所有登记过的工程
    python tools/sync_fonts.py --check    # 只检查（CI 用），不写文件
    python tools/sync_fonts.py --pipeline shouhui
"""

import argparse
import filecmp
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CANON = ROOT / "assets" / "fonts"

# 字体键 → assets/fonts 里的文件名（KaiTi 例外：从系统取）
CANON_FILES = {
    "noto": "NotoSerifSC.ttf",
    "alibaba": "AlibabaPuHuiTi-3-85-Bold.ttf",
    "longcang": "LongCang-Regular.ttf",
    "marker": "LXGWMarkerGothic-Regular.ttf",
    "wenkai": "LXGWWenKai-Regular.ttf",
}

# 每条管线里「渲染时真的会被浏览器/Remotion 读」的字体落点
MANIFEST = {
    "jianying": [("template/public/fonts/KaiTi.ttf", "kai"), ("template/public/fonts/NotoSerifSC.ttf", "noto")],
    "lishi": [("template/public/fonts/KaiTi.ttf", "kai"), ("template/public/fonts/NotoSerifSC.ttf", "noto")],
    "shouhui": [("projects/012_shangzhouwang/assets/font/KaiTi.ttf", "kai"),
                ("projects/012_shangzhouwang/assets/font/LongCang-Regular.ttf", "longcang"),
                ("projects/012_shangzhouwang/assets/font/LXGWMarkerGothic-Regular.ttf", "marker")],
    "shuimo": [("projects/yuren30/assets/font/KaiTi.ttf", "kai"),
               ("projects/yuren30/assets/font/LongCang-Regular.ttf", "longcang")],
    "dengju": [("projects/yuren30/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf", "alibaba")],
    "shiliang": [("projects/010_shengming30/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf", "alibaba")],
    "xianshiqi": [("projects/UAP30/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf", "alibaba")],
    "xuni": [("projects/009_prion30/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf", "alibaba"),
             ("projects/009_prion_full/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf", "alibaba")],
}


def system_kai():
    """系统里的楷体：Windows simkai.ttf / macOS STKaiti。找不到返回 None。"""
    env = os.environ.get("BV_FONT_KAI")
    if env and Path(env).exists():
        return Path(env)
    candidates = [
        Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts" / "simkai.ttf",
        Path("/System/Library/Fonts/Supplemental/STKaiti.ttc"),
        Path("/usr/share/fonts/truetype/arphic/ukai.ttc"),
    ]
    for p in candidates:
        if p.exists():
            return p
    return None


def resolve(key):
    """返回这个字体键对应的源文件；找不到返回 (None, 原因)。"""
    if key == "kai":
        p = system_kai()
        if p:
            return p, ""
        # 没有系统楷体就退到 OFL 的行楷/文楷，至少不 404
        for fallback in ("wenkai", "marker", "noto"):
            fp = CANON / CANON_FILES[fallback]
            if fp.exists():
                return fp, f"系统没有楷体，用 {fp.name} 代替"
        return None, "没有系统楷体，也没有 OFL 替代"
    fp = CANON / CANON_FILES.get(key, "")
    return (fp, "") if fp.exists() else (None, f"缺 assets/fonts/{CANON_FILES.get(key)}")


def sync_one(pipeline, dest_rel, key, check, verbose=True):
    src, note = resolve(key)
    dst = ROOT / pipeline / dest_rel
    if src is None:
        return ["missing-source", f"{pipeline}/{dest_rel}: {note}"]
    if dst.exists() and dst.stat().st_size == src.stat().st_size and filecmp.cmp(src, dst, shallow=False):
        return ["ok", ""]
    if check:
        return ["differs", f"{pipeline}/{dest_rel}: 与 {src.name} 不一致"]
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(src, dst)
    if verbose:
        note_txt = f"（{note}）" if note else ""
        print(f"  + {pipeline}/{dest_rel} ← {src.name}{note_txt}")
    return ["synced", ""]


def ensure(pipeline, verbose=False):
    """渲染前调用：把这条管线需要的字体补齐。失败也不⾄于中断渲染，只打印原因。"""
    for dest_rel, key in MANIFEST.get(pipeline, []):
        status, msg = sync_one(pipeline, dest_rel, key, check=False, verbose=verbose)
        if status == "missing-source" and verbose:
            print(f"  ! {msg}")
    return True


def main():
    ap = argparse.ArgumentParser(description="把单份字体同步到各工程目录")
    ap.add_argument("--check", action="store_true", help="只检查，不写文件")
    ap.add_argument("--pipeline", help="只处理这一条管线")
    a = ap.parse_args()

    problems, counts = [], {"ok": 0, "synced": 0}
    for pipeline, items in MANIFEST.items():
        if a.pipeline and pipeline != a.pipeline:
            continue
        for dest_rel, key in items:
            status, msg = sync_one(pipeline, dest_rel, key, a.check)
            if status == "ok":
                counts["ok"] += 1
            elif status == "synced":
                counts["synced"] += 1
            else:
                problems.append(msg)

    if problems:
        print(f"✗ {len(problems)} 处字体没到位：")
        for p in problems:
            print("  " + p)
        return 1
    if a.check:
        print(f"OK 字体落点全部一致（{counts['ok']} 处）")
    else:
        print(f"OK 字体同步完成（复制 {counts['synced']} 处，已是最新 {counts['ok']} 处）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
