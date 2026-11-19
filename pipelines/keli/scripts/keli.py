"""扁平颗粒插画 入口：复现 BB-Video `styles/grain` 的上游 demo 成片。

真正的画法在上游，这里只负责体检 / 打印步骤 / 调用 new.mjs + render.mjs。
"""

import sys
from pathlib import Path

for up in Path(__file__).resolve().parents:
    if (up / "tools" / "bb_style.py").exists():
        sys.path.insert(0, str(up / "tools"))
        break
from bb_style import main

raise SystemExit(main("grain"))
