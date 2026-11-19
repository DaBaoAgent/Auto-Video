"""字体单份化：仓库只留一份字体，渲染前按需同步到工程目录。

为什么不能直接引用 `assets/fonts/`：
    每个渲染器只服务「工程目录」这一个根（`render.mjs` / `render-legacy.mjs` / `render-cdp.mjs` 都是），
    所以字体必须物理地待在工程目录里。之前每个工程各存一份，同一款字体在仓库里躺了 4–5 份。

现在的规则：
    - 字体**不进仓库**：`assets/fonts/fonts.json` 记着官方下载地址与 SHA256，第一次用跑一次
      `python tools/sync_fonts.py --fetch` 下载（60 MB 级别的东西不该躺在 git 历史里）；
    - 下载下来的字体在 `assets/fonts/`，被 `.gitignore` 忽略；
    - KaiTi 是微软 Windows 系统字体，**从来不入库**；渲染前从系统字体目录复制（`AV_FONT_KAI` 可另指一个文件），
      这样本机渲染字形和以前完全一致，公开仓库也不再分发专有字体；
    - 复制到工程目录的那些在 `.gitignore` 里，`git status` 不会变脏。

用法：
    python tools/sync_fonts.py --fetch    # 第一次用：下载 + 同步
    python tools/sync_fonts.py            # 同步所有登记过的工程
    python tools/sync_fonts.py --check    # 只检查（CI 用），不写文件
    python tools/sync_fonts.py --pipeline shouhui
"""

import argparse
import filecmp
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CANON = ROOT / "assets" / "fonts"
MANIFEST_JSON = CANON / "fonts.json"

# 字体键 → assets/fonts 里的文件名（KaiTi 例外：从系统取）
CANON_FILES = {
    "noto": "NotoSerifSC.ttf",
    "alibaba": "AlibabaPuHuiTi-3-85-Bold.ttf",
    "longcang": "LongCang-Regular.ttf",
    "marker": "LXGWMarkerGothic-Regular.ttf",
    "wenkai": "LXGWWenKai-Regular.ttf",
    "caveat": "Caveat.ttf",
    "reenie": "ReenieBeanie.ttf",
    "patrickhand": "patrickhand_PatrickHand-Regular.ttf",
    "gaegu": "gaegu_Gaegu-Regular.ttf",
    "gaegub": "gaegu_Gaegu-Bold.ttf",
    "shortstack": "shortstack_ShortStack-Regular.ttf",
    "gochihand": "gochihand_GochiHand-Regular.ttf",
    "caveatbrush": "caveatbrush_CaveatBrush-Regular.ttf",
    "sniglet": "sniglet_Sniglet-Regular.ttf",
    # 中国水墨：Cormorant 两族 + 两支中文毛笔体
    "cormorant": "CormorantGaramond-VF.ttf",
    "cormoranti": "CormorantGaramond-Italic-VF.ttf",
    "cormorantsc": "CormorantSC-Medium.ttf",
    "cormorantscb": "CormorantSC-SemiBold.ttf",
    "mashanzheng": "MaShanZheng-Regular.ttf",
    "zhimangxing": "ZhiMangXing-Regular.ttf",
    # 装饰艺术
    "limelight": "Limelight-Regular.ttf",
    "poiret": "PoiretOne-Regular.ttf",
    "josefin": "JosefinSans[wght].ttf",
    "italiana": "Italiana-Regular.ttf",
    # 浮世绘：Shippori Mincho 两字重 + 两套汉字分片
    "shippori": "shippori-500.woff2",
    "shipporib": "shippori-700.woff2",
    "shipporikanji": "shippori-kanji.woff2",
    "yujikanji": "yuji-kanji.woff2",
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
    # 钢笔淡彩：标题与字幕用 Caveat，页边注记用 Reenie Beanie，两个都要在工程 fonts/ 里
    "gangbi": [("projects/012_wind/fonts/Caveat.ttf", "caveat"),
               ("projects/012_wind/fonts/ReenieBeanie.ttf", "reenie")],
    # 蜡笔儿童绘本：字幕 Patrick Hand、标题 Gaegu（两个字重）、注记 Short Stack / Gochi Hand，
    # Caveat Brush 与 Sniglet 备用；fonts.css 按这 7 个文件名取字
    "labi": [("projects/012_moon/fonts/patrickhand_PatrickHand-Regular.ttf", "patrickhand"),
             ("projects/012_moon/fonts/gaegu_Gaegu-Regular.ttf", "gaegu"),
             ("projects/012_moon/fonts/gaegu_Gaegu-Bold.ttf", "gaegub"),
             ("projects/012_moon/fonts/shortstack_ShortStack-Regular.ttf", "shortstack"),
             ("projects/012_moon/fonts/gochihand_GochiHand-Regular.ttf", "gochihand"),
             ("projects/012_moon/fonts/caveatbrush_CaveatBrush-Regular.ttf", "caveatbrush"),
             ("projects/012_moon/fonts/sniglet_Sniglet-Regular.ttf", "sniglet")],
    # 中国水墨：衬线正文 + 毛笔题字
    "shuimo2": [("projects/012_river/fonts/CormorantGaramond-VF.ttf", "cormorant"),
                ("projects/012_river/fonts/CormorantGaramond-Italic-VF.ttf", "cormoranti"),
                ("projects/012_river/fonts/CormorantSC-Medium.ttf", "cormorantsc"),
                ("projects/012_river/fonts/CormorantSC-SemiBold.ttf", "cormorantscb"),
                ("projects/012_river/fonts/MaShanZheng-Regular.ttf", "mashanzheng"),
                ("projects/012_river/fonts/ZhiMangXing-Regular.ttf", "zhimangxing")],
    # 装饰艺术：四个字体各司其职
    "zhuangshi": [("projects/012_starlight/fonts/Limelight-Regular.ttf", "limelight"),
                  ("projects/012_starlight/fonts/PoiretOne-Regular.ttf", "poiret"),
                  ("projects/012_starlight/fonts/JosefinSans[wght].ttf", "josefin"),
                  ("projects/012_starlight/fonts/Italiana-Regular.ttf", "italiana")],
    # 浮世绘：明朝体 + 汉字分片
    "fushihui": [("projects/012_toward/fonts/shippori-500.woff2", "shippori"),
                 ("projects/012_toward/fonts/shippori-700.woff2", "shipporib"),
                 ("projects/012_toward/fonts/shippori-kanji.woff2", "shipporikanji"),
                 ("projects/012_toward/fonts/yuji-kanji.woff2", "yujikanji")],
    # 铅黄浓彩：片名马善政、字幕龙藏、页边注记 Caveat / Reenie Beanie，四个都要在工程 fonts/ 里
    "qianhuang": [("projects/001_bayofblood/fonts/MaShanZheng-Regular.ttf", "mashanzheng"),
                  ("projects/001_bayofblood/fonts/LongCang-Regular.ttf", "longcang"),
                  ("projects/001_bayofblood/fonts/Caveat.ttf", "caveat"),
                  ("projects/001_bayofblood/fonts/ReenieBeanie.ttf", "reenie")],
    # weisuo / shuicai 的字体是按片子文本裁的子集、没有稳定来源，随工程入库，不走本表
}


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _try_download(url, dst, quiet):
    """先 urllib（重试一次），不行再退回 curl —— 有些代理环境下 urllib 的 TLS 会 EOF，curl 却正常。"""
    tmp = dst.with_suffix(".part")
    for attempt in (1, 2):
        try:
            if not quiet:
                print(f"  ↓ {dst.name} ← {url}" + ("（重试）" if attempt > 1 else ""))
            req = urllib.request.Request(url, headers={"User-Agent": "Auto-Video-sync-fonts/1.0"})
            with urllib.request.urlopen(req, timeout=180) as r, open(tmp, "wb") as f:
                shutil.copyfileobj(r, f)
            if tmp.stat().st_size < 100 * 1024:
                raise ValueError(f"文件太小（{tmp.stat().st_size} 字节），可能是网页不是字体")
            return True
        except Exception as e:
            if not quiet:
                print(f"    × {e}")
            if tmp.exists():
                tmp.unlink()
            if attempt == 1:
                time.sleep(2)
    # curl 兜底
    curl = shutil.which("curl")
    if curl:
        try:
            if not quiet:
                print(f"  ↓ [curl] {dst.name} ← {url}")
            r = subprocess.run([curl, "-L", "--fail", "--silent", "--show-error", "-o", str(tmp), url],
                               capture_output=True, timeout=300)
            if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 100 * 1024:
                return True
            if not quiet:
                print(f"    × curl 退出码 {r.returncode} {(r.stderr or b'').decode('utf-8', 'ignore')[:120]}")
        except Exception as e:
            if not quiet:
                print(f"    × curl 失败：{e}")
        if tmp.exists():
            tmp.unlink()
    return False


def fetch(only=None, quiet=False):
    """按 fonts.json 下载缺失的单份字体，校验 SHA256（不一致只警告，因为官方地址版本会更新）。"""
    if not MANIFEST_JSON.exists():
        print(f"✗ 缺 {MANIFEST_JSON}")
        return False
    spec = json.loads(MANIFEST_JSON.read_text(encoding="utf-8"))["fonts"]
    CANON.mkdir(parents=True, exist_ok=True)
    ok = True
    for name, info in spec.items():
        if only and name != only:
            continue
        dst = CANON / name
        if dst.exists() and dst.stat().st_size > 1024:
            if not quiet:
                print(f"  = {name} 已存在（{dst.stat().st_size / 1048576:.1f} MB）")
            continue
        got = False
        for url in info.get("urls", []):
            if _try_download(url, dst, quiet):
                dst.with_suffix(".part").replace(dst)
                digest = sha256(dst)
                if digest != info.get("sha256"):
                    print(f"    ! 指纹与记录不同（{digest[:12]}… vs {info.get('sha256', '')[:12]}…），官方版本可能更新了，先照用")
                else:
                    print("    ✓ 指纹一致")
                got = True
                break
        if not got:
            ok = False
            manual = info.get("manual")
            hint = f"，也可以从 {manual} 手动下载" if manual else ""
            print(f"  ✗ {name} 没有成功的地址，请手动放到 assets/fonts/{name}{hint}")
    return ok


def system_kai():
    """系统里的楷体：Windows simkai.ttf / macOS STKaiti。找不到返回 None。"""
    env = os.environ.get("AV_FONT_KAI")
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
    dst = ROOT / "pipelines" / pipeline / dest_rel
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
    ap.add_argument("--fetch", action="store_true", help="先按 fonts.json 下载缺失的字体")
    ap.add_argument("--pipeline", help="只处理这一条管线")
    a = ap.parse_args()

    if a.fetch:
        if not fetch():
            return 1

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
