"""笔式绘图仪 入口：复现 lemo-opuscar `styles/pen-plotter` 的上游 demo 成片。

真正的画法在上游，这里只负责体检 / 打印步骤 / 调用 build.sh。
"""

import sys
from pathlib import Path

# 入口可能在 pipelines/<id>/scripts/ 也可能在 <id>/scripts/，向上找带 tools/lemo_style.py 的那层
for up in Path(__file__).resolve().parents:
    if (up / "tools" / "lemo_style.py").exists():
        sys.path.insert(0, str(up / "tools"))
        break
from lemo_style import main

raise SystemExit(main("pen-plotter"))
