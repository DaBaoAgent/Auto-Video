"""把系统里的思源宋/黑体裁成站点真正用到的那几百个字，输出 woff2。

站点不联网也要好看，所以字体必须自带；但整字重 24 MB 不能进仓库，
这里按页面实际出现的字符做子集，通常是 200–400 KB。

用法：
    python tools/build_fonts.py
失败不致命：裁不出来就跳过，站点的 CSS 里已经有系统字体兜底。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import REPO, SITE_DIR, utf8_stdout

FONTS = [
    ("NotoSerifSC-VF.ttf", "noto-serif-sc-600.woff2", 600),
    ("NotoSansSC-VF.ttf", "noto-sans-sc.woff2", 400),
]
WIN_FONTS = Path(r"C:\Windows\Fonts")

BASE = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "　、。〈〉《》「」『』【】〔〕・ー—…‘’“”·×÷≈°％＋－±≤≥→←↑↓"
    + "0123456789０１２３４５６７８９"
)


def collect_text() -> str:
    parts = [BASE]
    for p in sorted((REPO / "catalog").glob("*.json")):
        parts.append(p.read_text(encoding="utf-8"))
    samples = SITE_DIR / "assets" / "samples.json"
    if samples.exists():
        parts.append(samples.read_text(encoding="utf-8"))
    for p in ("index.html", "assets/app.js", "assets/app.css"):
        f = SITE_DIR / p
        if f.exists():
            parts.append(f.read_text(encoding="utf-8"))
    return "".join(parts)


def build() -> int:
    utf8_stdout()
    try:
        from fontTools.ttLib import TTFont
        from fontTools.varLib.instancer import instantiateVariableFont
        from fontTools.subset import Subsetter, Options
    except ImportError:
        print("跳过：没装 fonttools（pip install fonttools brotli）")
        return 0

    chars = sorted({ch for ch in collect_text() if ch.strip()})
    unicodes = {ord(ch) for ch in chars}
    print(f"字符集 {len(unicodes)} 个")

    out_dir = SITE_DIR / "fonts"
    out_dir.mkdir(parents=True, exist_ok=True)

    for src_name, out_name, weight in FONTS:
        src = WIN_FONTS / src_name
        if not src.exists():
            print(f"跳过 {src_name}：系统里没有")
            continue
        try:
            font = TTFont(str(src))
            if "fvar" in font:
                font = instantiateVariableFont(font, {"wght": weight}, inplace=True)
            opts = Options()
            opts.flavor = "woff2"
            opts.layout_features = ["*"]
            opts.name_IDs = ["*"]
            opts.notdef_outline = True
            opts.recalc_bounds = True
            subsetter = Subsetter(options=opts)
            subsetter.populate(unicodes=unicodes)
            subsetter.subset(font)
            out = out_dir / out_name
            font.save(str(out))
            print(f"{out_name}  {out.stat().st_size / 1024:.0f} KB  (wght {weight})")
        except Exception as exc:
            print(f"失败 {src_name}: {exc}（站点会退回系统字体）")
    return 0


if __name__ == "__main__":
    raise SystemExit(build())
