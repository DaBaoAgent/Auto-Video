"""把 catalog/pipelines.json 的元数据写进每条管线的 pipeline.json 与 SKILL.md。

幂等：跑第二遍不会改动任何文件。
安全：只写 schema 与 meta 两块，管线原有的定版参数（配色/镜头/音频/交付……）
     原样留在顶层，不搬进 spec，因此 shipai.py、tcfg.py 这类直接读
     data["paths"] / cfg["stills"] 的脚本不会被打破。

用法：
    python tools/normalize_pipelines.py            # 写入
    python tools/normalize_pipelines.py --dry-run  # 只报告会改什么
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import (CATALOG_DIR, CONTRACT, REPO, load_pipelines, load_stations, read_json,
                utf8_stdout, write_json)
from av import parse_frontmatter

CREATED_SPEC = {
    "source": "SKILL.md",
    "note": "定版参数还没有落成 JSON。迁移时把 SKILL.md 里的数值搬到这里，脚本再从 spec 读，别散写在代码里。",
}


def build_meta(p: dict, station: dict, no: str, updated: str) -> dict:
    return {
        "id": p["id"],
        "no": no,
        "name_zh": p["name_zh"],
        "name_en": p["name_en"],
        "station": p["station"],
        "station_no": station["no"],
        "tagline": p["tagline"],
        "engine": p["engine"],
        "aspect": p["aspect"],
        "fps": p["fps"],
        "entry": p["entry"],
        "status": p.get("status")
        or ("live" if p.get("sample") else "beta"),
        "sample": p.get("sample"),
        "updated": updated,
    }


def normalize_pipeline_json(p: dict, meta: dict, dry: bool) -> str:
    path = REPO / "pipelines" / p["id"] / "pipeline.json"
    if path.exists():
        try:
            old = read_json(path)
        except Exception as exc:
            return f"ERROR 解析失败 {p['id']}/pipeline.json: {exc}"
        flat = {k: v for k, v in old.items() if k not in ("schema", "meta")}
        new = {"schema": CONTRACT, "meta": meta, **flat}
        if old.get("schema") == CONTRACT and old.get("meta") == meta:
            return f"skip  {p['id']}"
        changed = "update"
    else:
        new = {"schema": CONTRACT, "meta": meta, "spec": dict(CREATED_SPEC)}
        changed = "create"

    if not dry:
        write_json(path, new)
    return f"{changed}  {p['id']}"


def normalize_skill(p: dict, dry: bool) -> str:
    path = REPO / "pipelines" / p["id"] / "SKILL.md"
    if not path.exists():
        return f"MISSING SKILL.md {p['id']}"
    text = path.read_text(encoding="utf-8")
    if text.startswith("---"):
        fm, _ = parse_frontmatter(text)
        if fm.get("name"):
            return f"skip  {p['id']}/SKILL.md"
        return f"WARN  {p['id']}/SKILL.md 有 frontmatter 但没有 name"

    # 没有 frontmatter：从正文里找 description 或第一段
    lines = text.splitlines()
    desc = ""
    for line in lines:
        if line.strip().lower().startswith("description:"):
            desc = line.split(":", 1)[1].strip()
            break
    if not desc:
        for line in lines:
            s = line.strip()
            if s and not s.startswith("#") and not s.startswith("-") and len(s) > 10:
                desc = s[:220]
                break
    desc = desc or f"{p['name_zh']}（{p['name_en']}）管线。"
    head = f"---\nname: {p['id']}\ndescription: {desc}\n---\n\n"
    if not dry:
        path.write_text(head + text.lstrip("\n"), encoding="utf-8", newline="\n")
    return f"fm+   {p['id']}/SKILL.md"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    utf8_stdout()

    stations = load_stations()
    pipelines = load_pipelines()
    updated = read_json(REPO / "catalog" / "pipelines.json").get("updated", "")

    problems = []
    for i, p in enumerate(pipelines, start=1):
        no = f"{i:02d}"
        st = stations.get(p["station"])
        if not st:
            problems.append(f"catalog 里 {p['id']} 的 station={p['station']} 不在 stations.json")
            continue
        d = REPO / "pipelines" / p["id"]
        if not d.is_dir():
            problems.append(f"目录缺失：{p['id']}")
            continue
        meta = build_meta(p, st, no, updated)
        print(normalize_pipeline_json(p, meta, args.dry_run))
        print(normalize_skill(p, args.dry_run))

    # 反向检查：仓库里有、catalog 里没有（可选模块 frontend/ 与 fengmian/ 不算管线）
    known = {p["id"] for p in pipelines}
    modules = {m["path"] for m in (read_json(CATALOG_DIR / "pipelines.json").get("modules") or [])}
    for p in sorted((REPO / "pipelines").iterdir()):
        if not p.is_dir() or p.name in {".git", "catalog", "schema", "site", "tools", "docs", "showcase", "projects"}:
            continue
        if p.name.startswith(".") or p.name in modules:
            continue
        if (p / "SKILL.md").exists() and p.name not in known:
            problems.append(f"仓库里有 {p.name}，catalog 里没有登记")

    if problems:
        print("\n问题：")
        for x in problems:
            print("  - " + x)
        return 1
    with_sample = sum(
        1
        for p in pipelines
        if p.get("sample") and (REPO / "pipelines" / p["id"]).is_dir()
    )
    print(f"\n{len(pipelines)} 条管线已对齐（{with_sample} 条带样片）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
