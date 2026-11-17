#!/usr/bin/env python3
"""从 catalog/pipelines.json + 各管线 pipeline.json 生成 docs/pipelines.md。

README 只留入口与最短命令，33 条的完整清单由这个脚本产出，避免「文档写 32、
目录里 33」这类漂移。改了 catalog 就重跑一次。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "pipelines.md"
STATIONS = {
    "paper": ("01", "纸本叙事", "Paper & Chronicle"),
    "hand": ("02", "手绘笔触", "Hand & Pencil"),
    "craft": ("03", "传统工艺", "Traditional Crafts"),
    "cartoon": ("04", "卡通动画", "Cartoons"),
    "graphic": ("05", "平面图形", "Graphic & Motion"),
    "screen": ("06", "屏幕赛博", "Screens & Neon"),
    "space": ("07", "三维推演", "3D & Diorama"),
    "map": ("08", "地图地理", "Maps & Terrain"),
    "diagram": ("09", "图纸说明", "Diagram & Blueprint"),
    "live": ("10", "实拍混剪", "Live Footage"),
    "front": ("11", "前端工位", "Front of House"),
}


def main() -> int:
    cat = json.loads((ROOT / "catalog" / "pipelines.json").read_text(encoding="utf-8"))
    pipes = cat["pipelines"]
    mods = cat.get("modules") or []
    live = sum(1 for p in pipes if (p.get("sample") or {}).get("file"))
    lines = [
        "# 管线清单：%d 条，一条一个命令" % len(pipes),
        "",
        "这份清单由 `tools/build_pipeline_doc.py` 从 `catalog/pipelines.json` 生成，是目录的镜像；",
        "**入口与参数以各管线自己的 `SKILL.md` 为准**。这里回答的是「这条线现在能不能跑、从哪儿进、吃到什么输入」。",
        "",
        "约定：",
        "",
        "- **live** = 仓库里已有样片、入口脚本存在、`python tools/validate.py` 通过；",
        "- **beta** = 代码与文档在，样片还没补齐；",
        "- 命令都在仓库根目录执行，入口路径取 `pipeline.json` 的 `meta.entry`；不确定就 `--help`。",
        "",
        "当前：**%d 条 live / %d 条待补样片 / %d 个工位**。" % (live, len(pipes) - live, len({p.get("station") for p in pipes})),
        "",
    ]
    order = sorted(pipes, key=lambda p: (STATIONS.get(p.get("station"), ("99",))[0], p["id"]))
    cur = None
    for p in order:
        st = p.get("station")
        num, zh, en = STATIONS.get(st, ("99", st or "其它", ""))
        if st != cur:
            cur = st
            lines += [f"## {num} · {zh}　*{en}*", ""]
            lines += ["| id | 名称 | 状态 | 引擎 | 入口 | 样片 |", "| --- | --- | --- | --- | --- | --- |"]
        sm = p.get("sample") or {}
        status = "live" if sm.get("file") else "beta"
        entry = f"`{p.get('entry')}`" if p.get("entry") else "—"
        sample = f"{sm.get('seconds'):.0f}s" if sm.get("seconds") else "—"
        lines.append(
            f"| `{p['id']}` | {p.get('name_zh') or p['id']}（{p.get('name_en') or ''}） | {status} | "
            f"{p.get('engine') or '—'} | {entry} | {sample} |"
        )
        if (order.index(p) + 1 < len(order)) and order[order.index(p) + 1].get("station") == st:
            pass
        else:
            lines.append("")
    lines += [
        "",
        "---",
        "",
        "## 怎么读一条管线",
        "",
        "1. 打开 `<id>/SKILL.md`——完整流程、参数、验收条件、已知坑都在里面；",
        "2. `python tools/validate.py` 看它是否被目录、`pipeline.json`、`SKILL.md` 三方一致地登记；",
        "3. 想加一条新的，走 [CONTRIBUTING.md](../CONTRIBUTING.md) 的「加一条新管线四件事」。",
        "",
    ]
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"OK 已生成 {OUT.relative_to(ROOT)}：{len(pipes)} 条（live {live}）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
