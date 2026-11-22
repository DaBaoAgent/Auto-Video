"""按新种子重生成 77 条风格管线的 demo 画面（样片 v3 用）。

只改播种前缀，不换族、不换色板：形状坐标、构图、节拍全部重排，
因此站点样片与旧的上游网页短片不再是同一张画。
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import gen_style_projects as G  # noqa: E402


def main() -> int:
    G.rng_for = lambda pid: random.Random(f"style-s10:{pid}")
    return G.main()


if __name__ == "__main__":
    raise SystemExit(main())
