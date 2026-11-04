# -*- coding: utf-8 -*-
"""chengshi —— 城市年轮短片管线（卫星底图 + 地形 + 白模 3D 城市 · 代码渲染）

辅助命令：
    new       建选题骨架（film.json + data/*.json）
    data      Overpass 抓建筑/道路/水系/绿地（OSM）
    build     → work/public/data/city.json（白模 + 生长年份 + 年轮环 + 地形）
    still     渲单帧预览（默认 1080p 审片合成 ChengshiReview）
    probe     看工程各阶段产物是否齐全
    publish   归到 out/<编号>_<题目>/
    all       等价于 make_city.py（抓数据 → 建白模 → 配音 → 混音 → 成片）

真正的出片入口：python chengshi/scripts/make_city.py --project <slug>
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from common import HERE as SCRIPT_DIR, OUTDIR, PKG, Paths  # noqa: E402

TEMPLATE = SCRIPT_DIR.parent / "template"
PY = sys.executable
EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
NPX = "npx.cmd" if sys.platform.startswith("win") else "npx"

SKELETON_FILM = {
    "slug": "",
    "title": "",
    "title_en": "",
    "subtitle_cn": "",
    "subtitle_en": "",
    "fps": 30,
    "width": 3840,
    "height": 2160,
    "duration": 149.0,
    "scope_cn": "",
    "scope_en": "",
    "credits": [
        "卫星影像：Esri World Imagery（Esri · Maxar · Earthstar Geographics）",
        "地形：SRTM 30m · AWS Terrain Tiles（NASA / USGS）",
        "建筑、道路、水系：© OpenStreetMap contributors（ODbL）",
        "楼高：OSM building:levels / height，缺失按 3 层估算",
        "史实框架 + 合理推演 · 示意重建，非考古复原",
    ],
    "data": {"bbox": [0, 0, 1, 1], "default_year": 2020},
    "audio": {"music": "", "loudness": {"lufs": -15.0, "tp": -1.5}},
    "delivery": {"out_dir": ""},
}


def run(cmd, cwd: Path | None = None) -> None:
    print("$", " ".join(str(c) for c in cmd), flush=True)
    env = dict(os.environ)
    env.setdefault("PYTHONIOENCODING", "utf-8")
    r = subprocess.run([str(c) for c in cmd], cwd=str(cwd) if cwd else None, env=env)
    if r.returncode != 0:
        raise SystemExit(f"命令失败（exit {r.returncode}）")


def step(name: str, *args: str) -> None:
    run([PY, str(HERE / name), *args])


def ensure_env() -> None:
    """chengshi/template 复用 ../template 的 node_modules（Windows 目录联接）。"""
    nm = TEMPLATE / "node_modules"
    if nm.exists():
        return
    base = PKG / "template" / "node_modules"
    if base.exists():
        if sys.platform.startswith("win"):
            r = subprocess.run(["cmd", "/c", "mklink", "/J", str(nm), str(base)],
                               capture_output=True, text=True)
            if r.returncode != 0:
                raise SystemExit(f"建 node_modules 联接失败：{r.stderr or r.stdout}")
        else:
            os.symlink(base, nm, target_is_directory=True)
        print(f"node_modules → {base}")
    else:
        npm = "npm.cmd" if sys.platform.startswith("win") else "npm"
        run([npm, "install", "--no-audit", "--no-fund",
             "--registry=https://registry.npmmirror.com"], cwd=TEMPLATE)


def cmd_new(slug: str, title: str, bbox: str, scope_cn: str, scope_en: str) -> None:
    root = PKG / "projects" / slug
    (root / "data").mkdir(parents=True, exist_ok=True)
    film = dict(SKELETON_FILM)
    film["slug"] = slug
    film["title"] = title or slug
    film["scope_cn"] = scope_cn or f"{title} · 1:10000 白模"
    film["scope_en"] = scope_en or ""
    if bbox:
        s, w, n, e = [float(x) for x in bbox.split(",")]
        film["data"]["bbox"] = [s, w, n, e]
        # 锁死投影原点，后续扩 bbox 时机位/标签坐标不会整体漂移
        film["data"]["origin"] = [round((w + e) / 2.0, 6), round((s + n) / 2.0, 6)]
    (root / "film.json").write_text(json.dumps(film, ensure_ascii=False, indent=2), encoding="utf-8")
    for name, default in (("rings.json", []), ("timeline.json", {"ticks": [], "eras": []}),
                          ("captions.json", []), ("tags.json", []), ("landmarks.json", [])):
        p = root / "data" / name
        if not p.exists():
            p.write_text(json.dumps(default, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"选题骨架 → {root}")


def cmd_data(P: Paths, bbox: str | None, layers: str, proxy: str | None) -> None:
    box = bbox or ",".join(str(x) for x in P.film["data"]["bbox"])
    args = ["--project", P.slug, "--bbox", box, "--layers", layers]
    if proxy:
        args += ["--proxy", proxy]
    step("fetch_osm.py", *args)


def cmd_build(P: Paths) -> None:
    step("build_city.py", "--project", P.slug)


def cmd_still(P: Paths, frame: int, out: Path | None,
              composition: str = "ChengshiReview") -> None:
    ensure_env()
    dst = (out.resolve() if out else (P.out / f"still_{frame:04d}.png"))
    dst.parent.mkdir(parents=True, exist_ok=True)
    run([NPX, "remotion", "still", "src/index.ts", composition, str(dst),
         f"--frame={frame}", f"--public-dir={P.work / 'public'}",
         f"--browser-executable={EDGE}", "--log=error"], cwd=TEMPLATE)
    print(f"静帧 → {dst}")


def cmd_publish(P: Paths) -> None:
    folder = P.film.get("delivery", {}).get("out_dir")
    if not folder:
        raise SystemExit('film.json 缺 delivery.out_dir（如 "014_苏州年轮"）')
    dst = OUTDIR / folder
    dst.mkdir(parents=True, exist_ok=True)
    title = P.film.get("title", P.slug)
    named = P.out / f"{title}.mp4"
    newest = max(P.out.glob("full_*.mp4"), key=lambda p: p.stat().st_mtime, default=None)
    master = named if named.exists() else newest
    if master and master.exists():
        shutil.copy2(master, dst / f"{title}.mp4")
        print(f"成片 → {dst / (title + '.mp4')}（源 {master.name}）")
    at = max(0.0, float(P.film.get("duration", 149)) - 8.0)
    cover = P.out / "poster.jpg"
    if not cover.exists() and master and master.exists():
        run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
             "-ss", f"{at:.3f}", "-i", str(master), "-frames:v", "1", "-q:v", "2", str(cover)])
    if cover.exists():
        shutil.copy2(cover, dst / "封面.jpg")
    for name, cw in (("src_3x4.png", 810), ("src_4x3.png", 1440)):
        target = dst / name
        if not target.exists() and master and master.exists():
            run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                 "-ss", f"{at:.3f}", "-i", str(master), "-frames:v", "1",
                 "-vf", f"crop={cw}:1080:{(1920 - cw) // 2}:0", str(target)])
    pub = dst / "发布信息.md"
    if not pub.exists():
        pub.write_text(f"# 发布信息 · {folder}\n\n## 标题（5 选 1）\n\n1. \n2. \n3. \n4. \n5. \n\n"
                       "## 标签（4 个）\n\n# # # #\n", encoding="utf-8")
        print(f"⚠ {pub} 是空模板")
    print(f"交付目录 → {dst}")


def cmd_probe(P: Paths) -> None:
    print(f"工程 {P.root}")
    newest = max(P.out.glob("full_*.mp4"), key=lambda p: p.stat().st_mtime, default=None)
    for label, p in [
        ("raw/buildings.json", P.raw / "buildings.json"),
        ("city.json", P.public / "city.json"),
        ("rings.json", P.public / "rings.json"),
        ("timeline.json", P.public / "timeline.json"),
        ("captions.json", P.public / "captions.json"),
        ("最新成片", newest or (P.out / "full_*.mp4")),
    ]:
        print(f"  {'✓' if p.exists() else '·'} {label:20s} {p}")
    c = P.public / "city.json"
    if c.exists():
        d = json.loads(c.read_text(encoding="utf-8"))
        print(f"\n建筑 {d['count']} / 道路 {len(d['roads'])} / 水面 {len(d['water'])}")


def cmd_all(P: Paths) -> None:
    """一键出片：交给 make_city（抓数据 → 建白模 → 配音 → 混音 → 1080p 成片）。"""
    run([PY, str(HERE / "make_city.py"), "--project", P.slug])


def main() -> None:
    ap = argparse.ArgumentParser(prog="chengshi", description="城市年轮短片管线")
    ap.add_argument("command", choices=[
        "new", "data", "build", "still", "publish", "probe", "all"])
    ap.add_argument("--project", help="选题 slug")
    ap.add_argument("--title", default="")
    ap.add_argument("--bbox", default="", help="南,西,北,东")
    ap.add_argument("--scope-cn", default="")
    ap.add_argument("--scope-en", default="")
    ap.add_argument("--layers", default="buildings,roads,water,landuse")
    ap.add_argument("--proxy", default=None)
    ap.add_argument("--frame", type=int, default=0)
    ap.add_argument("--out", type=Path, default=None)
    ap.add_argument("--composition", default="ChengshiReview",
                    help="静帧合成：ChengshiReview(1080p) / Chengshi(4K 母版)")
    args = ap.parse_args()

    if args.command == "new":
        if not args.project:
            raise SystemExit("new 需要 --project <slug>")
        cmd_new(args.project, args.title, args.bbox, args.scope_cn, args.scope_en)
        return
    if not args.project:
        raise SystemExit("需要 --project <slug>")
    P = Paths(args.project)
    table = {
        "data": lambda: cmd_data(P, args.bbox or None, args.layers, args.proxy),
        "build": lambda: cmd_build(P),
        "still": lambda: cmd_still(P, args.frame, args.out, args.composition),
        "publish": lambda: cmd_publish(P),
        "probe": lambda: cmd_probe(P),
        "all": lambda: cmd_all(P),
    }
    table[args.command]()


if __name__ == "__main__":
    main()
