"""把 lemo-opuscar 库里尚未封装的风格登记成 Auto-Video 管线。

一次生成四样东西（CONTRIBUTING「加一条新管线」的四件事）：
  1. pipelines/<id>/ 目录：SKILL.md、pipeline.json、README.md、CREDITS.md、scripts/<id>.py
  2. catalog/pipelines.json 登记（id / station / entry / sample / status）
  3. frontend/targets.json 补一条（render 未接上时写 reason）
  4. 样片沿用上游 films 仓库，catalog 只记文件名，不搬二进制

命名与工位归属在 tools/lemo_style_map.json 里，改名字改那张表再重跑。

用法：
    python tools/import_lemo_styles.py --dry-run
    python tools/import_lemo_styles.py
    python tools/import_lemo_styles.py --lemo "D:/@kaifa/lemo-opuscar"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import (CATALOG_DIR, CONTRACT, REPO, load_pipelines, load_stations,
                read_json, utf8_stdout, write_json)

MAP_PATH = REPO / "tools" / "lemo_style_map.json"
DEFAULT_LEMO = Path("D:/@kaifa/lemo-opuscar")
FILMS_BASE = "https://lemomo-ai.github.io/lemo-opuscar-films/"

# 上游风格目录的默认画幅：库内默认 1920×1080，style.json 里的 size 才另算
SIZE_TO_ASPECT = {
    "1920x1080": "16:9",
    "1080x1920": "9:16",
    "1080x1440": "4:5",
    "1080x1350": "4:5",
    "1080x1080": "1:1",
    "1440x1080": "4:3",
}


def aspect_of(style: dict) -> str:
    size = (style.get("size") or "").replace("×", "x").strip()
    return SIZE_TO_ASPECT.get(size, "16:9")


def engine_note(style_md: Path) -> str:
    """§10 Engine 的第一句人话；取不到就留空，不编。"""
    if not style_md.exists():
        return ""
    text = style_md.read_text(encoding="utf-8")
    m = re.search(r"^##\s*10\..*?\n(.*?)(?=^##\s|\Z)", text, re.M | re.S)
    if not m:
        return ""
    for line in m.group(1).splitlines():
        s = line.strip("-*` ").strip()
        if s:
            return s if len(s) <= 120 else s[:120] + "…"
    return ""


def skill_md(meta: dict, spec: dict, station_zh: str) -> str:
    slug = spec["style_slug"]
    entry = f"pipelines/{meta['id']}/{meta['entry']}"
    film = meta["sample"]["title"] if meta.get("sample") else "—"
    dur = meta["sample"]["seconds"] if meta.get("sample") else "—"
    eng = spec.get("engine_note") or "见上游 STYLE.md §10"
    return f"""---
name: {meta['id']}
description: {meta['name_zh']}（{meta['name_en']}）：{meta['tagline']} 上游为 lemo-opuscar styles/{slug}，演示站暂用其样片；入口复现上游 demo。
---

# {meta['id']}：{meta['name_zh']}（{meta['name_en']}）

| 项 | 值 |
| --- | --- |
| 工位 | {meta['station_no']} {station_zh} |
| 上游风格 | lemo-opuscar `styles/{slug}` |
| 上游样片 | 《{film}》{dur} s |
| 画幅 | {meta['aspect'] or '按上游'} |
| 入口 | `{entry}` |

## 这条管线交什么

{meta['tagline']}

上游的一句话：{spec.get('upstream_line') or '—'}

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python {entry} --check

# 2. 只看要跑哪些步骤，不执行
python {entry} --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python {entry}
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `{DEFAULT_LEMO.as_posix()}`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

{eng}

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《{film}》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/{slug}/STYLE.md`
- 样片怎么做的：`styles/{slug}/DEMO.md`
"""


def readme_md(meta: dict, spec: dict, station_zh: str) -> str:
    slug = spec["style_slug"]
    entry = f"pipelines/{meta['id']}/{meta['entry']}"
    return f"""# {meta['id']} —— {meta['name_zh']}（{meta['name_en']}）

{meta['tagline']}

| 项 | 值 |
| --- | --- |
| 工位 | {meta['station_no']} {station_zh} |
| 上游 | lemo-opuscar `styles/{slug}`（{spec.get('upstream_cn') or meta['name_zh']}） |
| 样片 | 《{meta['sample']['title']}》{meta['sample']['seconds']} s，来源 `lemomo-ai/lemo-opuscar-films` |
| 入口 | `{entry}` |
| 画幅 | {meta['aspect'] or '按上游'} |

## 跑

```bash
python {entry} --check   # 体检
python {entry} --plan    # 看步骤
python {entry}           # 复现上游 demo
```

上游 demo 在 Linux / WSL 上跑；Windows 原生缺 `.venv/bin/python`。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/{slug}/STYLE.md` 为准，样片先用上游的。
要做成「一条文案直接出片」，得把 demo 的 `film.js` 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
"""


def credits_md(meta: dict, spec: dict) -> str:
    slug = spec["style_slug"]
    return f"""# CREDITS · {meta['id']}

- **风格来源**：lemo-opuscar `styles/{slug}`（{spec.get('upstream_cn') or meta['name_zh']} / {meta['name_en']}），MIT。
- **画法**：上游代码自己画，无生成图、无第三方素材；字体按上游 `CREDITS` 现取现子集。
- **样片**：《{meta['sample']['title']}》，来自上游 films 仓库 `lemomo-ai/lemo-opuscar-films`（{FILMS_BASE}），仅作演示站短片，未入库。
- **本仓库代码**：入口 `scripts/{meta['id']}.py` 只做编排与体检，不含上游渲染代码。
"""


def entry_py(slug: str, cn: str) -> str:
    return f'''"""{cn} 入口：复现 lemo-opuscar `styles/{slug}` 的上游 demo 成片。

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

raise SystemExit(main("{slug}"))
'''


def renumber(added_ids: set[str]) -> int:
    """按 catalog 顺序校正已导入管线的 meta.no / meta.station_no。

    只碰 spec.source=lemo-opuscar 的目录：老管线的 pipeline.json 里有扁平键，
    整份重写会打乱它们原来的键序，不该顺手改。
    """
    fixed = 0
    pipelines = load_pipelines()
    stations = load_stations()
    for i, p in enumerate(pipelines, start=1):
        pid = p["id"]
        pj = REPO / "pipelines" / pid / "pipeline.json"
        if pid not in added_ids or not pj.exists():
            continue
        data = read_json(pj)
        meta = data.setdefault("meta", {})
        want_no = f"{i:02d}"
        want_st = stations[p["station"]]["no"]
        if meta.get("no") != want_no or meta.get("station_no") != want_st:
            meta["no"] = want_no
            meta["station_no"] = want_st
            write_json(pj, data)
            fixed += 1
    return fixed


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--lemo", default=str(DEFAULT_LEMO))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    utf8_stdout()

    lemo = Path(args.lemo)
    if not (lemo / "styleboard" / "catalog.json").exists():
        sys.exit(f"找不到 lemo 库的 styleboard/catalog.json：{lemo}")
    if not MAP_PATH.exists():
        sys.exit(f"缺命名表：{MAP_PATH}")

    names = read_json(MAP_PATH)["styles"]
    lemo_cat = read_json(lemo / "styleboard" / "catalog.json")
    by_slug = {s["slug"]: s for s in lemo_cat}
    stations = load_stations()

    catalog_path = CATALOG_DIR / "pipelines.json"
    catalog = read_json(catalog_path)
    pipelines = catalog["pipelines"]
    known_ids = {p["id"] for p in pipelines}
    known_slugs = {p.get("lemo_style") for p in pipelines if p.get("lemo_style")}

    added, skipped = [], []
    for slug, cfg in names.items():
        pid = cfg["id"]
        if slug in known_slugs or pid in known_ids:
            skipped.append(f"{pid}（已登记）")
            continue
        if slug not in by_slug:
            skipped.append(f"{slug}（上游没有这个风格）")
            continue
        style = by_slug[slug]
        station = stations[cfg["station"]]
        style_json = {}
        sj = lemo / "styles" / slug / "style.json"
        if sj.exists():
            style_json = read_json(sj)
        engine = engine_note(lemo / "styles" / slug / "STYLE.md")

        meta = {
            "id": pid,
            "no": f"{len(pipelines) + 1:02d}",   # 编号就是它在 catalog 里的位次
            "name_zh": style["cn"],
            "name_en": style["en"],
            "station": cfg["station"],
            "station_no": station["no"],
            "tagline": style["line_cn"],
            "engine": f"lemo styles/{slug} · 上游 demo",
            "aspect": aspect_of(style_json),
            "fps": None,
            "entry": f"scripts/{pid}.py",
            "sample": {
                # 文件名用 id + slug：上游片名里有中文问号/冒号，Windows 不能落盘
                "file": f"{pid} {slug}.mp4",
                "title": style.get("film_cn") or style["cn"],
                "seconds": float(style.get("dur") or 0),
            },
        }
        spec = {
            "source": "lemo-opuscar",
            "style_slug": slug,
            "upstream_cn": style["cn"],
            "upstream_en": style["en"],
            "upstream_line": style.get("line") or "",
            "upstream_film": style.get("film") or "",
            "upstream_dur": style.get("dur"),
            "upstream_docs": {
                "style": f"styles/{slug}/STYLE.md",
                "demo": f"styles/{slug}/DEMO.md",
                "build": f"styles/{slug}/demo/build.sh",
            },
            "sample_source": f"{FILMS_BASE}{slug}.mp4",
            "sample_note": "演示站暂用上游 720p 网络版；真封装后换成本仓库 projects/ 出片",
            "engine_note": engine,
        }

        added.append((pid, slug, cfg["station"], meta, spec))

        # 目录
        d = REPO / "pipelines" / pid
        if not args.dry_run:
            (d / "scripts").mkdir(parents=True, exist_ok=True)
            (d / "pipeline.json").write_text(
                json.dumps({"schema": CONTRACT, "meta": meta, "spec": spec},
                           ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8", newline="\n")
            (d / "SKILL.md").write_text(skill_md(meta, spec, station["name_zh"]), encoding="utf-8", newline="\n")
            (d / "README.md").write_text(readme_md(meta, spec, station["name_zh"]), encoding="utf-8", newline="\n")
            (d / "CREDITS.md").write_text(credits_md(meta, spec), encoding="utf-8", newline="\n")
            (d / "scripts" / f"{pid}.py").write_text(
                entry_py(slug, style["cn"]), encoding="utf-8", newline="\n")

        # catalog：登记（catalog 的 id/station/entry/sample 是校验的基准）
        pipelines.append({
            "id": pid,
            "station": cfg["station"],
            "name_zh": style["cn"],
            "name_en": style["en"],
            "tagline": style["line_cn"],
            "engine": f"lemo styles/{slug} · 上游 demo",
            "aspect": meta["aspect"],
            "fps": None,
            "entry": meta["entry"],
            "sample": meta["sample"],
            "status": "live",
            "lemo_style": slug,
        })
        known_ids.add(pid)
        known_slugs.add(slug)

    if not args.dry_run and added:
        catalog["updated"] = "2026-11-19"
        write_json(catalog_path, catalog)

        # frontend/targets.json 必须覆盖每条管线（渲染没接上就写 reason）
        tg_path = REPO / "frontend" / "targets.json"
        tg = read_json(tg_path)
        for pid, slug, _st, _meta, _spec in added:
            tg["pipelines"].setdefault(pid, {
                "render": None,
                "reason": (f"上游 demo 只出整片样片（styles/{slug}/demo/build.sh），"
                           f"还没拆成数据驱动模板；frontend 只灌文案与配音"),
            })
        write_json(tg_path, tg)

    # 编号跟着 catalog 位次走（validate 强制 meta.no == 位次）
    imported_ids = {pid for pid, _s, _st, _m, _sp in added}
    known_imported = {p["id"] for p in pipelines
                      if (REPO / "pipelines" / p["id"] / "pipeline.json").exists()
                      and read_json(REPO / "pipelines" / p["id"] / "pipeline.json")
                      .get("spec", {}).get("source") == "lemo-opuscar"}
    if not args.dry_run:
        fixed = renumber(imported_ids | known_imported)
        if fixed:
            print(f"校正编号 {fixed} 条")

    print(f"新增 {len(added)} 条 / 跳过 {len(skipped)} 条")
    counts = {}
    for pid, slug, st, _m, _s in added:
        counts[st] = counts.get(st, 0) + 1
        print(f"  {pid:<10} {slug:<24} → {st}")
    if skipped:
        print("跳过：", "；".join(skipped))
    if counts:
        print("工位分布：" + "，".join(f"{stations[k]['name_zh']} {v}" for k, v in counts.items()))
    if args.dry_run:
        print("（dry-run，未写盘）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
