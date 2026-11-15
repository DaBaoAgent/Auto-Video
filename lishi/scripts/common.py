# -*- coding: utf-8 -*-
"""lishi 公共层：项目定位、film.json 读取、产物路径。

所有脚本只认一个数据源 —— projects/<slug>/film.json。
换选题只改这份 json 和口播稿，脚本一行不动。
"""
from __future__ import annotations

import json
from pathlib import Path

# lishi/scripts/common.py → PKG = AutoJY/（lishi 与 jianying 共用 projects/ 与 out/）
PKG = Path(__file__).resolve().parent.parent.parent
ROOT = PKG
PROJECTS = PKG / "projects"
OUTDIR = PKG / "out"


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


class Paths:
    """一个选题的全部产物位置。集中定义，避免各脚本各写一套相对路径。"""

    def __init__(self, slug: str):
        self.slug = slug
        self.root = project(slug)
        self.film = load_film(slug)
        # 两种布局：
        #   layout="flat"（默认）产物直接放 projects/<slug>/{narration,data,audio,out}
        #   layout="work"      产物放 projects/<slug>/work/ 下（Remotion 工程与产物同层）
        self.work = self.root / "work"
        base = self.work if self.film.get("layout") == "work" else self.root
        self.narration = base / "narration"
        self.data = base / "data"
        self.audio = base / "audio"
        self.out = base / "out"
        self.shots = self.data / "shots.json"
        self.narration_json = self.narration / "narration.json"
        self.narration_wav = self.narration / "narration.wav"
        self.final_audio = self.audio / "final-audio.wav"
        self.srt = self.out / "字幕.srt"
        self.mp4 = self.out / f"{self.film.get('title', slug)}.mp4"

    def mkdirs(self) -> None:
        for d in (self.narration, self.data, self.audio, self.out):
            d.mkdir(parents=True, exist_ok=True)

    @property
    def script(self) -> Path:
        """口播稿（相对选题目录）"""
        return self.root / self.film["narration"]["file"]
