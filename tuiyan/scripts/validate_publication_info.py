#!/usr/bin/env python3
"""alannew 发布信息校验：两行，标题 ≤25 字且两段式含阿拉伯数字，次行恰好 4 个话题。"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

SEPARATOR_RE = re.compile(r"[：:？?！!]")
HASHTAG_RE = re.compile(r"#[^\s#]+")


def validate_file(path: Path, root: Path) -> dict:
    issues: list[str] = []
    lines = [
        line.rstrip("\r")
        for line in path.read_text(encoding="utf-8-sig", errors="replace").splitlines()
    ]
    lines = [line for line in lines if line.strip()]

    title = ""
    if len(lines) != 2:
        issues.append(f"必须恰好两行（标题 + 4 个话题），实际 {len(lines)} 行")
    else:
        title = lines[0]
        tags = lines[1].split()
        valid_tags = [tag for tag in tags if HASHTAG_RE.fullmatch(tag)]
        if len(tags) != 4 or len(valid_tags) != 4:
            issues.append(
                f"第二行必须恰好 4 个 #话题，实际 {len(valid_tags)} 个：{lines[1]!r}"
            )

        if len(title) > 25:
            issues.append(
                f"标题必须不超过 25 个字（含标点），实际 {len(title)} 字：{title!r}"
            )
        parts = SEPARATOR_RE.split(title, maxsplit=1)
        if len(parts) != 2 or not parts[0].strip() or not parts[1].strip():
            issues.append(f"标题必须两段式，用问号、冒号或感叹号分隔：{title!r}")
        if not re.search(r"[0-9]", title):
            issues.append(f"标题里的兵力/数量请用阿拉伯数字：{title!r}")

    return {
        "file": str(path.relative_to(root)),
        "valid": not issues,
        "title": title,
        "issues": issues,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="校验 alannew 战役交付目录下的 发布信息.txt。"
    )
    parser.add_argument(
        "root", nargs="?", type=Path, default=Path("content"),
        help="扫描根目录（默认 content）",
    )
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"目录不存在：{root}", file=sys.stderr)
        return 2

    files = sorted(root.rglob("发布信息.txt"))
    results = [validate_file(path, root) for path in files]
    summary = {
        "root": str(root),
        "file_count": len(results),
        "valid_count": sum(item["valid"] for item in results),
        "invalid_count": sum(not item["valid"] for item in results),
        "results": results,
    }
    rendered = json.dumps(summary, ensure_ascii=False, indent=2)
    if args.json_out:
        args.json_out.write_text(rendered, encoding="utf-8")
    print(rendered)
    return 0 if results and summary["invalid_count"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
