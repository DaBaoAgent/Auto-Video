"""校验 Auto-Video 的统一契约。

检查四件事：
  1. catalog 自身自洽：id 唯一、station 存在、目录齐全、编号连续。
  2. 每条管线：SKILL.md 的 frontmatter name == 目录名；pipeline.json 的
     schema 是当前契约、meta 与 catalog 一致。
  3. meta 里声明的 entry 文件真实存在；sample 与 catalog 一致。
  4. 仓库里没有 catalog 之外的管线目录，catalog 里也没有不存在的目录。

用法：
    python tools/validate.py
    python tools/validate.py --samples-dir "D:\\BaiduSyncdisk\\@同步\\1 MG 动画\\管线样片"
退出码 1 = 有 error；只有 warn 时返回 0。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from av import (CONTRACT, REPO, load_modules, load_pipelines, load_stations, read_json,
                parse_frontmatter, utf8_stdout, pipeline_dirs)

ERRORS: list[str] = []
WARNS: list[str] = []


def err(msg: str) -> None:
    ERRORS.append(msg)


def warn(msg: str) -> None:
    WARNS.append(msg)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--samples-dir", default="", help="样片源目录，给了就顺便核对样片文件是否存在")
    args = ap.parse_args()
    utf8_stdout()

    stations = load_stations()
    pipelines = load_pipelines()

    # 1. catalog 自洽 ---------------------------------------------------
    ids = [p["id"] for p in pipelines]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        err(f"catalog 里 id 重复：{sorted(dup)}")

    for p in pipelines:
        if p["station"] not in stations:
            err(f"{p['id']}: station={p['station']} 不在 stations.json")
        for key in ("name_zh", "name_en", "tagline", "engine"):
            if not p.get(key):
                err(f"{p['id']}: catalog 缺 {key}")

    counts = {s: 0 for s in stations}
    for p in pipelines:
        if p["station"] in counts:
            counts[p["station"]] += 1
    for sid, st in stations.items():
        if counts[sid] == 0:
            warn(f"工位 {st['no']} {st['name_zh']} 没有任何管线")

    # 2. 逐条管线 ------------------------------------------------------
    for i, p in enumerate(pipelines, start=1):
        pid = p["id"]
        d = REPO / pid
        if not d.is_dir():
            err(f"{pid}: 目录不存在")
            continue

        skill = d / "SKILL.md"
        if not skill.exists():
            err(f"{pid}: 缺 SKILL.md")
        else:
            fm, _ = parse_frontmatter(skill.read_text(encoding="utf-8"))
            if fm.get("name") != pid:
                err(f"{pid}: SKILL.md frontmatter name={fm.get('name')!r}，应为 {pid!r}")
            if not fm.get("description"):
                warn(f"{pid}: SKILL.md 没有 description")

        pj = d / "pipeline.json"
        if not pj.exists():
            err(f"{pid}: 缺 pipeline.json")
            continue
        try:
            data = read_json(pj)
        except Exception as exc:
            err(f"{pid}: pipeline.json 不是合法 JSON（{exc}）")
            continue

        if data.get("schema") != CONTRACT:
            err(f"{pid}: schema={data.get('schema')!r}，应为 {CONTRACT!r}")
        meta = data.get("meta") or {}
        if not meta:
            err(f"{pid}: 缺 meta")
            continue

        expect = {
            "id": pid,
            "no": f"{i:02d}",
            "name_zh": p["name_zh"],
            "name_en": p["name_en"],
            "station": p["station"],
            "station_no": stations[p["station"]]["no"],
            "entry": p["entry"],
            "sample": p.get("sample"),
        }
        for k, v in expect.items():
            if meta.get(k) != v:
                err(f"{pid}: meta.{k}={meta.get(k)!r}，catalog 是 {v!r}")

        entry = meta.get("entry")
        if entry and not (d / entry).exists():
            err(f"{pid}: meta.entry={entry} 文件不存在")
        if not entry:
            warn(f"{pid}: 没有声明单一入口脚本")

        flat = {k for k in data if k not in ("schema", "meta", "spec")}
        if flat and "spec" in data:
            warn(f"{pid}: spec 与扁平键并存（{sorted(flat)[:4]}…），建议合并")

    # 4. 反向检查 ------------------------------------------------------
    known = set(ids)
    for d in pipeline_dirs():
        if d.name not in known:
            err(f"{d.name}: 仓库里有这个管线目录，但 catalog 没登记")

    # 5. 可选模块（前端闭环 + 封面）--------------------------------------
    modules = load_modules()
    for want in ("frontend", "fengmian"):
        if want not in {m["id"] for m in modules}:
            err(f"catalog.modules 缺 {want} 模块")
    for m in modules:
        d = REPO / (m.get("path") or m["id"])
        if not d.is_dir():
            err(f"模块 {m['id']}: 目录不存在 {m.get('path')}")
            continue
        if m.get("entry") and not (REPO / m["entry"]).exists():
            err(f"模块 {m['id']}: entry={m['entry']} 不存在")
    fjson = REPO / "frontend" / "frontend.json"
    if not fjson.exists():
        err("frontend/frontend.json 缺失")
    else:
        fe = read_json(fjson)
        if fe.get("schema") != "auto-video/frontend@1":
            err(f"frontend/frontend.json schema={fe.get('schema')!r}，应为 'auto-video/frontend@1'")
        tg_path = REPO / (fe.get("targets") or "frontend/targets.json")
        if not tg_path.exists():
            err("frontend: targets.json 缺失")
        else:
            tg = read_json(tg_path)
            if tg.get("schema") != "auto-video/frontend-targets@1":
                err(f"frontend/targets.json schema={tg.get('schema')!r} 不对")
            tgp = tg.get("pipelines") or {}
            miss = [p["id"] for p in pipelines if p["id"] not in tgp]
            if miss:
                err("frontend/targets.json 未覆盖管线：" + ", ".join(miss))
            declared = [i for i, v in tgp.items() if (v or {}).get("render")]
            for i, v in tgp.items():
                if i not in known:
                    err(f"frontend/targets.json 里有 catalog 之外的管线 {i}")
                if not (v or {}).get("render") and not (v or {}).get("reason"):
                    err(f"{i}: targets 既没声明 render 也没写 reason")
            print(f"可选模块：frontend 覆盖 {len(tgp)} 条管线，可直接渲染 {len(declared)} 条（{', '.join(declared)}），"
                  f"其余 {len(tgp) - len(declared)} 条出交接包 + 下一步")

    # 3. 样片文件 ------------------------------------------------------
    if args.samples_dir:
        src = Path(args.samples_dir)
        if not src.is_dir():
            err(f"样片目录不存在：{src}")
        else:
            for p in pipelines:
                s = p.get("sample")
                if s and not (src / s["file"]).exists():
                    err(f"{p['id']}: 样片缺失 {s['file']}")

    # 报告 --------------------------------------------------------------
    print(f"管线 {len(pipelines)} 条 / 工位 {len(stations)} 个 / 带样片 {sum(1 for p in pipelines if p.get('sample'))} 条")
    for sid, st in stations.items():
        names = [p["id"] for p in pipelines if p["station"] == sid]
        print(f"  {st['no']} {st['name_zh']:<6} {counts[sid]:>2} 条  {' '.join(names)}")
    if WARNS:
        print(f"\nWARN {len(WARNS)}")
        for w in WARNS:
            print("  - " + w)
    if ERRORS:
        print(f"\nERROR {len(ERRORS)}")
        for e in ERRORS:
            print("  - " + e)
        return 1
    print("\nOK 契约一致")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
