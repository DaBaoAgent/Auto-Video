# -*- coding: utf-8 -*-
"""tianshu · 配置、路径与提示词骨架（管线唯一参数来源）

所有定版数值都在 tianshu/pipeline.json 里，这里只做加载 + 派生的路径工具。
改参数先改 pipeline.json，再改脚本 —— 不要在脚本里散写数字。
"""
from __future__ import annotations

import json
import os
from pathlib import Path

PKG = Path(__file__).resolve().parent.parent          # tianshu/
REPO = PKG.parent                                     # Auto-Video/
CFG_PATH = PKG / "pipeline.json"
TEMPLATE = PKG / "template"
PROJECTS = PKG / "projects"

# ---------------------------------------------------------------- 风格骨架
# 正面锚点：整条管线每张图、每段视频都带这一段，保证画种不漂。
STYLE_HEAD = (
    "Hand-painted 1983 Shanghai Animation Film Studio cel animation, "
    "traditional Chinese ink-and-colour scenery, flat opaque gouache colour areas, "
    "thin near-black ink contour (#080808), hard-edged shadow only, "
    "visible paper grain, slightly faded aged print, muted dusty film colours, "
    "4:3 academy frame with rounded corners."
)

STYLE_TAIL = (
    "No gradient shading, no airbrush, no photographic lighting, no 3D volume, "
    "no depth of field, no volumetric light, no specular highlight, "
    "no ink wash bleed, no watercolour wash, no paper-cut silhouette, no text, no subtitle."
)

# 负面词：只保留「防字幕 / 防多主体 / 防写实」三类。
# 2026-11-13 定版结论：雾、渐变、体积、材质这些负词全部放开 —— 原片本身就带。
NEG_DEFAULT = (
    "3D render, realistic, photorealistic, detailed texture, photographic, bokeh, "
    "lens flare, anime style, hdri, ambient occlusion, "
    "subtitle, lettering, chinese calligraphy text, watermark, signature, logo, "
    "border, frame, matting, paper margin, white border, text overlay, "
    "duplicate subject, extra pagoda, extra figure, crowd"
)

# I2V 提示词铁律（写进每一段视频 prompt 的尾巴）
I2V_TAIL = "The camera holds perfectly still. Keep the drawing on the model sheet unchanged."

# 运镜预设（与 pipeline.json 的 cam.moves 同构，脚本从这里取默认值）
DEFAULT_MOVES = {
    "pan_right":   {"amount": 0.14, "zoom": 0.00,  "rise": 0.00},
    "pan_left":    {"amount": 0.14, "zoom": 0.00,  "rise": 0.00},
    "tilt_up":     {"amount": 0.00, "zoom": 0.00,  "rise": 0.08},
    "tilt_down":   {"amount": 0.00, "zoom": 0.00,  "rise": -0.08},
    "push_in":     {"amount": 0.00, "zoom": 0.08,  "rise": 0.00},
    "pull_out":    {"amount": 0.00, "zoom": -0.08, "rise": 0.00},
    "orbit_right": {"amount": 0.10, "zoom": 0.045, "rise": 0.025},
    "orbit_left":  {"amount": 0.10, "zoom": 0.045, "rise": 0.025},
    "drift":       {"amount": 0.030, "zoom": 0.012, "rise": 0.012},
    "hold":        {"amount": 0.00, "zoom": 0.00,  "rise": 0.00},
}

_CFG: dict | None = None


def cfg() -> dict:
    """加载 pipeline.json，允许用环境变量覆盖本机路径。"""
    global _CFG
    if _CFG is not None:
        return _CFG
    data = json.loads(CFG_PATH.read_text(encoding="utf-8"))
    p = data.setdefault("paths", {})
    if os.environ.get("TIANSHU_COMFY_ROOT"):
        p["comfy_root"] = os.environ["TIANSHU_COMFY_ROOT"]
    if os.environ.get("TIANSHU_COMFY_SERVER"):
        p["comfy_server"] = os.environ["TIANSHU_COMFY_SERVER"]
    if os.environ.get("TIANSHU_PUBLISH_ROOT"):
        p["publish_root"] = os.environ["TIANSHU_PUBLISH_ROOT"]
    _CFG = data
    return data


def comfy_dir() -> Path:
    c = cfg()["paths"]
    return Path(c["comfy_root"]) / c.get("comfy_inner", "ComfyUI")


def comfy_input() -> Path:
    return comfy_dir() / "input"


def comfy_output() -> Path:
    return comfy_dir() / "output"


def server() -> str:
    return cfg()["paths"]["comfy_server"].rstrip("/")


def ratio_res(ratio: str, which: str) -> tuple[int, int]:
    """ratio + which(plate|i2v_std|i2v_big) -> (w, h)"""
    r = cfg()["ratios"].get(ratio) or cfg()["ratios"]["4:3"]
    return tuple(int(v) for v in r[which].lower().split("x"))  # type: ignore[return-value]


def project_dir(name: str) -> Path:
    return PROJECTS / name


def load_json(path: Path, default=None):
    if not Path(path).exists():
        return default
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")


def load_project(name: str) -> dict:
    pd = project_dir(name)
    pj = load_json(pd / "project.json")
    if not pj:
        raise SystemExit(f"工程不存在或缺少 project.json：{pd}")
    pj.setdefault("name", name)
    pj.setdefault("ratio", cfg()["canvas"]["ratio"])
    pj.setdefault("fps", cfg()["canvas"]["fps"])
    return pj


def shots_of(name: str) -> list[dict]:
    """工程的镜头表：work/shots.json（人写），没有就退回 work/shot_plan.json（自动分镜）。"""
    pd = project_dir(name)
    shots = load_json(pd / "work" / "shots.json")
    if shots:
        return shots["shots"] if isinstance(shots, dict) else shots
    plan = load_json(pd / "work" / "shot_plan.json")
    if plan:
        return plan["shots"]
    raise SystemExit(f"{name} 还没有分镜：先跑 plan / scaffold")


def pdir(name: str, *parts: str) -> Path:
    """工程内的阶段目录，自动建好。"""
    d = project_dir(name).joinpath(*parts)
    d.mkdir(parents=True, exist_ok=True)
    return d


def seed_of(shot: dict, base: int = 12000) -> int:
    """镜头号 -> 稳定种子：同一条片子重跑必须出同一张图。"""
    sid = str(shot.get("shot_id") or shot.get("id") or "S000")
    num = "".join(c for c in sid if c.isdigit()) or "0"
    return int(shot.get("seed") or (base + int(num)))


def probe(path) -> dict:
    """ffprobe 一条流的关键数值（时长/宽高/帧率/帧数），失败返回 {}。"""
    import subprocess

    p = Path(path)
    if not p.exists():
        return {}
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
             "stream=width,height,r_frame_rate,nb_frames,duration:format=duration",
             "-of", "json", str(p)], capture_output=True, text=True, check=True).stdout
        d = json.loads(out)
        s = (d.get("streams") or [{}])[0]
        num, den = (s.get("r_frame_rate") or "0/1").split("/")
        return {
            "w": int(s.get("width") or 0), "h": int(s.get("height") or 0),
            "fps": round(float(num) / float(den or 1), 3),
            "frames": int(s.get("nb_frames") or 0),
            "dur": round(float(s.get("duration") or d.get("format", {}).get("duration") or 0), 3),
            "bytes": p.stat().st_size,
        }
    except Exception:
        return {}
