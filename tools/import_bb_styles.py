"""把 BB-Video 里尚未封装的风格登记成 Auto-Video 管线。

处置规则在 tools/bb_style_map.json：
  - already    ：本仓库已经直接迁移过，跳过；
  - equivalent ：同族等价，已有对应管线，跳过；
  - import     ：生成管线目录并登记。

一次生成五样东西：
  1. pipelines/<id>/：SKILL.md、pipeline.json、README.md、CREDITS.md、scripts/<id>.py
  2. catalog/pipelines.json 登记（catalog 的 id/station/entry/sample 是校验基准）
  3. frontend/targets.json 补一条（render 没接上时写 reason）
  4. site/assets/samples.json 补一条（演示站暂用 BB-Video 的样片，mp4 走外链）
  5. 编号按 catalog 位次校正

用法：
    python tools/import_bb_styles.py --bb "D:/@kaifa/BB-Video" --dry-run
    python tools/import_bb_styles.py --bb "D:/@kaifa/BB-Video"
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import (CATALOG_DIR, CONTRACT, REPO, load_pipelines, load_stations,
                read_json, utf8_stdout, write_json)

MAP_PATH = REPO / "tools" / "bb_style_map.json"
DEFAULT_BB = Path("D:/@kaifa/BB-Video")
SAMPLE_BASE = "https://github.com/BubbleBrainBB/BB-Video/releases/download/samples"


def skill_md(meta: dict, spec: dict, station_zh: str) -> str:
    slug = spec["style_slug"]
    entry = f"pipelines/{meta['id']}/{meta['entry']}"
    film = meta["sample"]["title"] if meta.get("sample") else "—"
    dur = meta["sample"]["seconds"] if meta.get("sample") else "—"
    eng = spec.get("engine_note") or "见上游 STYLE.md"
    return f"""---
name: {meta['id']}
description: {meta['name_zh']}（{meta['name_en']}）：{meta['tagline']} 上游为 BB-Video styles/{slug}，演示站暂用其样片；入口复现上游 demo。
---

# {meta['id']}：{meta['name_zh']}（{meta['name_en']}）

| 项 | 值 |
| --- | --- |
| 工位 | {meta['station_no']} {station_zh} |
| 上游风格 | BB-Video `skills/bb-video/styles/{slug}` |
| 上游样片 | 《{film}》{dur} s |
| 画幅 | {meta['aspect'] or '按上游'} |
| 入口 | `{entry}` |

## 这条管线交什么

{meta['tagline']}

上游的一句话：{spec.get('upstream_line') or '—'}

## 入口命令

```bash
# 1. 先看这台机器够不够（BB-Video 的 checkout + node 18+ + ffmpeg）
python {entry} --check

# 2. 只看要跑哪些步骤，不执行
python {entry} --plan

# 3. 真跑：用上游 new.mjs 建工程，再 render.mjs 出片
python {entry}

# 想少写一点画面，加 --quick（上游快速版）
python {entry} --quick
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- `--out` 指定工程目录，默认 `out/bb-{slug}`；
- 上游库位置默认 `{DEFAULT_BB.as_posix()}`，可用 `BB_VIDEO_DIR` 或 `--bb` 覆盖；
- 上游要 Chrome / Edge；渲染器会自己找，也可按上游文档设 `CHROME_PATH`。

## 引擎

{eng}

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 BB-Video `samples` release）；
- 出片与上游《{film}》同画幅、同帧率，−16 LUFS。

## 已知坑

1. **这条线是登记 + 上游复现**：画法、镜头和声音都在 BB-Video，本仓库没有搬运行时代码。
2. **样片是借的**：站点现在放的是 BB-Video 的 1080p 成片外链，不是本仓库渲的；真封装后换成本地 `projects/` 出片。
3. **上游样片的手写画面不可 --quick 复刻**：快速版只保证同一套风格材质，分幕和美术是简版。
4. **字体现取**：上游页面从 jsDelivr 拉 @fontsource，首次渲染要联网。

## 上游文档

- 风格不变量：`skills/bb-video/styles/{slug}/STYLE.md`
- 工作流：`skills/bb-video/promo/GUIDE.md`（本管线走 promo）
- 风格表与适用题材：`skills/bb-video/SKILL.md`
"""


def readme_md(meta: dict, spec: dict, station_zh: str) -> str:
    slug = spec["style_slug"]
    entry = f"pipelines/{meta['id']}/{meta['entry']}"
    return f"""# {meta['id']} —— {meta['name_zh']}（{meta['name_en']}）

{meta['tagline']}

| 项 | 值 |
| --- | --- |
| 工位 | {meta['station_no']} {station_zh} |
| 上游 | BB-Video `skills/bb-video/styles/{slug}`（{spec.get('upstream_cn') or meta['name_zh']}） |
| 样片 | 《{meta['sample']['title']}》{meta['sample']['seconds']} s，来源 BB-Video `samples` release |
| 入口 | `{entry}` |
| 画幅 | {meta['aspect'] or '按上游'} |

## 跑

```bash
python {entry} --check   # 体检
python {entry} --plan    # 看步骤
python {entry}           # 建工程 + 出片（调上游 new.mjs / render.mjs）
```

要先把 BB-Video clone 到本机（默认 `{DEFAULT_BB.as_posix()}`），或用 `BB_VIDEO_DIR` 指过去。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/{slug}/STYLE.md` 为准，样片先用 BB-Video 的。
要做成「一条文案直接出片」，得把上游 starter 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
"""


def credits_md(meta: dict, spec: dict) -> str:
    slug = spec["style_slug"]
    return f"""# CREDITS · {meta['id']}

- **风格来源**：BB-Video `skills/bb-video/styles/{slug}`（{spec.get('upstream_cn') or meta['name_zh']} / {meta['name_en']}），MIT，版权声明见 BB-Video 仓库 `LICENSE`。
- **画法**：上游代码自己画；不搬运原片、不生成图。
- **样片**：《{meta['sample']['title']}》，来自 BB-Video `samples` release（{SAMPLE_BASE}/{slug}.mp4），仅作演示站短片，未入库。
- **本仓库代码**：入口 `scripts/{meta['id']}.py` 只做编排与体检，不含上游渲染代码。
"""


def entry_py(slug: str, cn: str) -> str:
    return f'''"""{cn} 入口：复现 BB-Video `styles/{slug}` 的上游 demo 成片。

真正的画法在上游，这里只负责体检 / 打印步骤 / 调用 new.mjs + render.mjs。
"""

import sys
from pathlib import Path

for up in Path(__file__).resolve().parents:
    if (up / "tools" / "bb_style.py").exists():
        sys.path.insert(0, str(up / "tools"))
        break
from bb_style import main

raise SystemExit(main("{slug}"))
'''


def upstream_line(style_md: Path) -> str:
    """STYLE.md 标题后的第一段，压成一句。"""
    if not style_md.exists():
        return ""
    lines = style_md.read_text(encoding="utf-8").splitlines()
    para = []
    started = False
    for line in lines:
        s = line.strip()
        if not started:
            if s.startswith("# "):
                started = True
            continue
        if not s:
            if para:
                break
            continue
        if s.startswith(">") or s.startswith("##"):
            continue
        para.append(s)
    raw = "".join(para).replace("**", "").strip()
    if len(raw) > 200:
        cut = raw.find(". ", 120)
        raw = raw[:cut + 1] if cut > 0 else raw[:200].rstrip() + "…"
    return raw


def engine_note(style_md: Path) -> str:
    if not style_md.exists():
        return ""
    text = style_md.read_text(encoding="utf-8")
    for key in ("three.js", "Three.js", "WebGL", "Canvas", "SVG"):
        if key in text:
            return f"BB-Video styles/{key} 画法 · 上游 promo 运行时（Chrome 逐帧）"
    return "BB-Video 上游 promo 运行时（Chrome 逐帧）"


def renumber(added_ids: set[str]) -> int:
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


def duration_str(seconds: float) -> str:
    s = int(round(seconds))
    return f"{s // 60}:{s % 60:02d}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bb", default=str(DEFAULT_BB))
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    utf8_stdout()

    bb = Path(args.bb).expanduser().resolve()
    style_root = bb / "skills" / "bb-video" / "styles"
    if not style_root.is_dir():
        sys.exit(f"找不到 BB-Video 风格目录：{style_root}（用 --bb 指过去）")
    if not MAP_PATH.exists():
        sys.exit(f"缺处置表：{MAP_PATH}")

    table = read_json(MAP_PATH)["styles"]
    stations = load_stations()
    catalog_path = CATALOG_DIR / "pipelines.json"
    catalog = read_json(catalog_path)
    pipelines = catalog["pipelines"]
    known_ids = {p["id"] for p in pipelines}
    known_slugs = {p.get("bb_style") for p in pipelines if p.get("bb_style")}

    added, skipped = [], []
    for slug, cfg in table.items():
        if cfg.get("disposition") != "import":
            continue
        pid = cfg["id"]
        if pid in known_ids or slug in known_slugs:
            skipped.append(f"{pid}（已登记）")
            continue
        style_md = style_root / slug / "STYLE.md"
        if not style_md.exists():
            skipped.append(f"{slug}（上游没有这个风格）")
            continue
        station = stations[cfg["station"]]
        meta = {
            "id": pid,
            "no": f"{len(pipelines) + 1:02d}",
            "name_zh": cfg["name_zh"],
            "name_en": cfg["name_en"],
            "station": cfg["station"],
            "station_no": station["no"],
            "tagline": cfg["tagline"],
            "engine": f"BB-Video styles/{slug} · 上游 promo",
            "aspect": "16:9",
            "fps": 30,
            "entry": f"scripts/{pid}.py",
            "sample": {
                "file": f"{pid} bb-{slug}.mp4",
                "title": cfg["sample_title"],
                "seconds": float(cfg["sample_seconds"]),
            },
        }
        spec = {
            "source": "BB-Video",
            "style_slug": slug,
            "upstream_cn": cfg["name_zh"],
            "upstream_en": cfg["name_en"],
            "upstream_line": upstream_line(style_md),
            "upstream_film": cfg["sample_title"],
            "upstream_dur": cfg["sample_seconds"],
            "upstream_docs": {
                "style": f"skills/bb-video/styles/{slug}/STYLE.md",
                "guide": "skills/bb-video/promo/GUIDE.md",
                "skill": "skills/bb-video/SKILL.md",
            },
            "sample_source": f"{SAMPLE_BASE}/{slug}.mp4",
            "sample_note": "演示站暂用 BB-Video 的 1080p 成片外链；真封装后换成本仓库 projects/ 出片",
            "engine_note": engine_note(style_md),
        }
        added.append((pid, slug, cfg["station"], meta, spec))

        d = REPO / "pipelines" / pid
        if not args.dry_run:
            (d / "scripts").mkdir(parents=True, exist_ok=True)
            (d / "pipeline.json").write_text(
                json.dumps({"schema": CONTRACT, "meta": meta, "spec": spec},
                           ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8", newline="\n")
            (d / "SKILL.md").write_text(skill_md(meta, spec, station["name_zh"]),
                                        encoding="utf-8", newline="\n")
            (d / "README.md").write_text(readme_md(meta, spec, station["name_zh"]),
                                         encoding="utf-8", newline="\n")
            (d / "CREDITS.md").write_text(credits_md(meta, spec), encoding="utf-8", newline="\n")
            (d / "scripts" / f"{pid}.py").write_text(
                entry_py(slug, cfg["name_zh"]), encoding="utf-8", newline="\n")

        pipelines.append({
            "id": pid,
            "station": cfg["station"],
            "name_zh": cfg["name_zh"],
            "name_en": cfg["name_en"],
            "tagline": cfg["tagline"],
            "engine": f"BB-Video styles/{slug} · 上游 promo",
            "aspect": "16:9",
            "fps": 30,
            "entry": meta["entry"],
            "sample": meta["sample"],
            "status": "live",
            "bb_style": slug,
        })
        known_ids.add(pid)
        known_slugs.add(slug)

    if not args.dry_run and added:
        catalog["updated"] = "2026-11-19"
        write_json(catalog_path, catalog)

        tg_path = REPO / "frontend" / "targets.json"
        tg = read_json(tg_path)
        for pid, slug, _st, _meta, _spec in added:
            tg["pipelines"].setdefault(pid, {
                "render": None,
                "reason": (f"上游用 promo/scripts/new.mjs --style {slug} 建工程、render.mjs 出片，"
                           f"还没拆成数据驱动模板；frontend 只灌文案与配音"),
            })
        write_json(tg_path, tg)

        # 演示站：暂用 BB-Video 的样片，mp4 走外链，封面由 media/<id>.jpg 提供
        sj_path = REPO / "site" / "assets" / "samples.json"
        sj = read_json(sj_path)
        have = {x["key"] for x in sj["items"]}
        for pid, slug, _st, meta, spec in added:
            if pid in have:
                continue
            sj["items"].append({
                "key": pid,
                "kind": "pipeline",
                "pipeline": pid,
                "title": meta["sample"]["title"],
                "style": meta["name_zh"],
                "style_en": meta["name_en"],
                "station": meta["station"],
                "badge": "BB-Video 样片",
                "seconds": meta["sample"]["seconds"],
                "duration": duration_str(meta["sample"]["seconds"]),
                "aspect": "16:9",
                "clip_seconds": None,
                "mp4": f"{SAMPLE_BASE}/{slug}.mp4",
                "poster": f"media/{pid}.jpg",
                "source": f"BB-Video samples/{slug}.mp4",
                "note": spec["sample_note"],
            })
        # samples.json 历史格式是 1 空格缩进，别用 write_json 把整份文件重排
        sj_path.write_text(json.dumps(sj, ensure_ascii=False, indent=1) + "\n",
                           encoding="utf-8", newline="\n")

    imported_ids = {a[0] for a in added}
    if not args.dry_run:
        fixed = renumber(imported_ids)
        if fixed:
            print(f"校正编号 {fixed} 条")

    print(f"新增 {len(added)} 条 / 跳过 {len(skipped)} 条")
    for pid, slug, st, meta, _spec in added:
        print(f"  {pid:<10} {slug:<12} → {st}  《{meta['sample']['title']}》{meta['sample']['seconds']} s")
    if skipped:
        print("跳过：", "；".join(skipped))
    if args.dry_run:
        print("（dry-run，未写盘）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
