"""Auto-Video 统一工具链的公共库。

只依赖标准库 + 本机 ffmpeg/ffprobe，不引入第三方包，保证在任意一台机器上
`python tools/validate.py` 都能跑。
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CATALOG_DIR = REPO / "catalog"
SCHEMA_DIR = REPO / "schema"
SITE_DIR = REPO / "site"

CONTRACT = "auto-video/pipeline@2"


def utf8_stdout() -> None:
    """Windows 控制台默认 GBK，中文会崩；统一成 utf-8。"""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    path.write_text(text, encoding="utf-8", newline="\n")


def load_stations() -> dict[str, dict]:
    data = read_json(CATALOG_DIR / "stations.json")
    return {s["id"]: s for s in data["stations"]}


def load_pipelines() -> list[dict]:
    data = read_json(CATALOG_DIR / "pipelines.json")
    return data["pipelines"]


def pipeline_dirs() -> list[Path]:
    """仓库里像管线的目录：有 SKILL.md 或 pipeline.json，且不是工具目录。"""
    skip = {".git", "catalog", "schema", "site", "tools", "docs", "showcase", "projects"}
    out = []
    for p in sorted(REPO.iterdir()):
        if not p.is_dir() or p.name in skip or p.name.startswith("."):
            continue
        if (p / "SKILL.md").exists() or (p / "pipeline.json").exists():
            out.append(p)
    return out


# ------------------------------------------------------------------ ffmpeg
def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    cp = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if check and cp.returncode != 0:
        raise RuntimeError(f"{cmd[0]} failed ({cp.returncode}):\n{cp.stderr[-2000:]}")
    return cp


def probe(path: Path) -> dict:
    cp = run(["ffprobe", "-v", "error", "-show_entries",
              "format=duration:stream=width,height,r_frame_rate,codec_type",
              "-of", "json", str(path)])
    return json.loads(cp.stdout)


def duration_of(path: Path) -> float:
    try:
        return round(float(probe(path)["format"]["duration"]), 1)
    except Exception:
        return 0.0


def human_duration(seconds: float) -> str:
    if not seconds:
        return "—"
    m, s = divmod(int(round(seconds)), 60)
    if m >= 60:
        h, m = divmod(m, 60)
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


# ------------------------------------------------------------------ markdown
def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    block = text[3:end].strip("\n")
    body = text[end + 4:].lstrip("\n")
    meta: dict[str, str] = {}
    key = None
    for line in block.splitlines():
        if ":" in line and not line.startswith(" "):
            key, val = line.split(":", 1)
            meta[key.strip()] = val.strip()
        elif key and line.strip():
            meta[key] += " " + line.strip()
    return meta, body
