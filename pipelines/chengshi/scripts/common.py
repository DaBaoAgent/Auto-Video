# -*- coding: utf-8 -*-
"""chengshi 公共层：项目定位与产物路径。

数据流：
    work/raw/*.json              fetch_osm.py 抓的 Overpass 原始数据
    work/public/data/city.json   build_city.py 生成的白模城市（米制局部坐标）
    work/public/data/rings.json  年轮环（lon/lat → 米）
    work/public/data/*.json      从 projects/<slug>/data/ 原样拷贝的时间轴/字幕/标签
"""
from __future__ import annotations

import json
from pathlib import Path

PKG = Path(__file__).resolve().parent.parent.parent   # Auto-Video/
PROJECTS = PKG / "projects"
OUTDIR = PKG / "out"
HERE = Path(__file__).resolve().parent


def project(slug: str) -> Path:
    p = PROJECTS / slug
    if not p.is_dir():
        raise SystemExit(f"找不到选题：{p}")
    return p


def load_film(slug: str) -> dict:
    p = project(slug) / "film.json"
    if not p.exists():
        raise SystemExit(f"缺 {p}")
    return json.loads(p.read_text(encoding="utf-8-sig"))


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


class Paths:
    def __init__(self, slug: str):
        self.slug = slug
        self.root = project(slug)
        self.film = load_film(slug)
        self.work = self.root / "work"
        self.raw = self.work / "raw"
        self.public = self.work / "public" / "data"
        self.assets = self.work / "assets"
        self.audio = self.work / "audio"
        self.out = self.work / "out"

    @property
    def data_dir(self) -> Path:
        return self.root / "data"

    def mkdirs(self) -> None:
        for d in (self.raw, self.public, self.assets, self.audio, self.out):
            d.mkdir(parents=True, exist_ok=True)

    def film_json(self) -> Path:
        return self.work / "public" / "data" / "film.json"
