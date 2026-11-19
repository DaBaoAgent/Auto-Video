""" 热成像（recheng）：自研渲染入口。

画面由仓库自己的 vendor/runtime/stylekit.js 画，帧由 style-frames.mjs 抓，
不调用任何外部仓库的脚本。
"""

import sys
from pathlib import Path

for up in Path(__file__).resolve().parents:
    if (up / "tools" / "av_style.py").exists():
        sys.path.insert(0, str(up / "tools"))
        break

from av_style import main  # noqa: E402

raise SystemExit(main("recheng"))
