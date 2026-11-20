#!/usr/bin/env python3
"""从 catalog/pipelines.json + site/assets/samples.json 生成 docs/pipelines.md。

README 只留入口与最短命令，完整清单由这个脚本产出，避免「文档写 155、
目录里 166」这类漂移。改了 catalog 或站点样片就重跑一次。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "pipelines.md"


def load_stations() -> dict[str, tuple[str, str, str]]:
    data = json.loads((ROOT / "catalog" / "stations.json").read_text(encoding="utf-8"))
    return {s["id"]: (s["no"], s["name_zh"], s["name_en"]) for s in data["stations"]}


def load_clips() -> dict[str, dict]:
    path = ROOT / "site" / "assets" / "samples.json"
    if not path.exists():
        return {}
    items = json.loads(path.read_text(encoding="utf-8")).get("items") or []
    return {
        s["pipeline"]: s
        for s in items
        if s.get("kind") == "pipeline" and s.get("mp4")
    }


def main() -> int:
    cat = json.loads((ROOT / "catalog" / "pipelines.json").read_text(encoding="utf-8"))
    pipes = cat["pipelines"]
    stations = load_stations()
    clips = load_clips()

    def is_live(p: dict) -> bool:
        return bool((p.get("sample") or {}).get("file")) or p["id"] in clips

    live = sum(1 for p in pipes if is_live(p))
    pending = sum(1 for p in pipes if not is_live(p) and p.get("station") != "front")
    lines = [
        "# 管线清单：%d 条，一条一个命令" % len(pipes),
        "",
        "这份清单由 `tools/build_pipeline_doc.py` 从 `catalog/pipelines.json` 与 "
        "`site/assets/samples.json` 生成，是目录的镜像；",
        "**入口与参数以各管线自己的 `SKILL.md` 为准**。这里回答的是「这条线现在能不能跑、从哪儿进、吃到什么输入」。",
        "",
        "约定：",
        "",
        "- **live** = 已有可播片子（原片或站点切片）、入口脚本存在、`python tools/validate.py` 通过；",
        "- **beta** = 代码与文档在，片子还没补齐；",
        "- 样片列：`211s` 是原片时长，`10s（切片）` 是站点上那段 10 秒风格段；",
        "- 命令都在仓库根目录执行，入口路径取 `pipeline.json` 的 `meta.entry`；不确定就 `--help`。",
        "",
        "当前：**%d 条 live / %d 条待补样片 / %d 个工位**（`peiyin` 是配音前端，不出片，不计入 live）。"
        % (live, pending, len(stations)),
        "",
    ]
    order = sorted(pipes, key=lambda p: (stations.get(p.get("station"), ("99",))[0], p["id"]))
    cur = None
    for p in order:
        st = p.get("station")
        num, zh, en = stations.get(st, ("99", st or "其它", ""))
        if st != cur:
            cur = st
            lines += [f"## {num} · {zh}　*{en}*", ""]
            lines += ["| id | 名称 | 状态 | 引擎 | 入口 | 样片 |", "| --- | --- | --- | --- | --- | --- |"]
        sm = p.get("sample") or {}
        clip = clips.get(p["id"]) or {}
        live_now = is_live(p)
        if st == "front":
            status, sample = "前端", "—（不出片）"
        else:
            status = "live" if live_now else "beta"
            if sm.get("seconds"):
                sample = f"{sm.get('seconds'):.0f}s"
            elif clip:
                sample = f"{(clip.get('clip_seconds') or clip.get('seconds') or 0):.0f}s（切片）"
            else:
                sample = "—"
        entry = f"`pipelines/{p['id']}/{p.get('entry')}`" if p.get("entry") else "—"
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
