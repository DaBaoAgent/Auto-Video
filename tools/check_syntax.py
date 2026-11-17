"""语法检查：把所有自有 Python 编译一遍（跳过 vendor / node_modules / projects 里的素材代码）。

CI 与本地都用同一个入口：`python tools/check_syntax.py`
"""

import py_compile
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_PARTS = {"vendor", "node_modules", "projects", "GPT-SoVITS", "__pycache__", ".git"}


def main():
    bad = []
    count = 0
    for f in ROOT.rglob("*.py"):
        parts = set(f.parts)
        if parts & SKIP_PARTS:
            continue
        count += 1
        try:
            py_compile.compile(str(f), doraise=True)
        except py_compile.PyCompileError:
            bad.append(str(f.relative_to(ROOT)))
    print(f"编译 {count} 个文件，失败 {len(bad)} 个")
    for b in bad[:20]:
        print("  ✗ " + b)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
