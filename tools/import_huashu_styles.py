"""把 huashu-art-motion 的风格配方接成 Auto-Video 管线。

唯一事实来源是 tools/huashu_style_map.json（53 张配方逐条记 import / equivalent / family），
这里只按处置表落地：建目录、写 pipeline.json / SKILL.md / README / MIGRATION / CREDITS /
references/style.md / scripts/<id>.py，再把 catalog、frontend/targets、site/assets/samples.json 补齐。

幂等：已存在的文件只在 --force 时重写；catalog / targets / samples 按 id upsert。

用法：
    python tools/import_huashu_styles.py --dry-run
    python tools/import_huashu_styles.py
    python tools/import_huashu_styles.py --film D:\\tmp\\art-motion-35-styles.mp4   # 顺带切样片
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = ROOT / "tools" / "huashu_style_map.json"
UPSTREAM = "https://github.com/alchaincyf/huashu-art-motion"
STATIONS = json.loads((ROOT / "catalog" / "stations.json").read_text(encoding="utf-8"))["stations"]
STATION_BY_ID = {s["id"]: s for s in STATIONS}
RECIPE_DIR = Path("vendor/huashu-art-motion/references/风格配方")

SKILL_BODY = """---
name: {id}
description: {name_zh}（{name_en}）：{tagline} 画法来自 huashu-art-motion v1.3.1 的 {scene}，引擎已 vendored 进 vendor/huashu-art-motion/，单条命令出风格段。
---

# {id}：{name_zh}（{name_en}）

| 项 | 值 |
| --- | --- |
| 工位 | {station_no} {station_zh} |
| 上游 | huashu-art-motion v1.3.1 · `references/风格配方/{scene}.md` |
| 场景 | `vendor/huashu-art-motion/engine/scenes/{scene}.js` |
| 上游质量 | {quality} |
| 画幅 | 16:9 · 24 fps |
| 入口 | `pipelines/{id}/scripts/{id}.py` |

## 这条管线交什么

{tagline}

这是一条**单风格渲染线**，交付的是风格段 / 风格短片：默认不配旁白，音乐可以后接 `vendor/huashu-art-motion/engine` 的配乐模板或 Auto-Video 的配音链。画法边界、母题动法与短板见 [`references/style.md`](references/style.md)，那是上游配方卡的原文。

## 入口命令

```bash
# 抽两帧看画（不装 playwright 时用 uv 带一次）
uv run --with playwright python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}

# 出 6 秒风格段
uv run --with playwright python pipelines/{id}/scripts/{id}.py --out out/{id}_试片.mp4 --seconds 6
```

## 写法要点

- **先读 `references/style.md`**：配方卡写的是这套画法的笔触、色光、空间和母题动法，不要只照搬样片里那间屋子。
- **画面是代码画的**：`scenes/{scene}.js` 里没有外部图片；换题材要重新构图，别把上游的「少女＋猫＋桌子」搬过去。
- **时间轴按秒算**：`--seconds` 出的是风格段长度；镜头内动作仍按引擎的节拍走，不额外补转场。
- **{quality_note}**

## 许可

引擎代码 MIT（`vendor/huashu-art-motion/LICENSE`）；上游的角色帧、总览图和示范视频里的花叔形象不随 MIT 授权，本仓库未收录。配方卡随上游 MIT 收录，见 [CREDITS.md](CREDITS.md) 与 [MIGRATION.md](MIGRATION.md)。
"""

README_BODY = """# {id} · {name_zh}管线

{tagline}

画法来自 huashu-art-motion v1.3.1 的 `{scene}`，引擎已完整 vendored 进 `vendor/huashu-art-motion/engine`，入口只调本仓库内的 `render.py`，不依赖任何外部 checkout。首个实例是 6 秒风格段；完整流程见 [SKILL.md](SKILL.md)，画法原文见 [references/style.md](references/style.md)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
uv run --with playwright python scripts/{id}.py --stills 0.5,2.5 --out review/{id}
uv run --with playwright python scripts/{id}.py --out out/{id}_试片.mp4 --seconds 6
```

## 环境

- Python 3.9+、ffmpeg / ffprobe 在 PATH
- 本机 Chrome 或 Edge（脚本自动找；也可设 `CHROME_PATH`）
- playwright：没装时用 `uv run --with playwright python ...`

## 目录

| 目录 | 内容 |
|---|---|
| `scripts/` | 本管线入口（抽帧 / 出片） |
| `references/` | 上游风格配方卡原文 |
| `vendor/`（仓库根） | huashu 引擎、场景、转场、字体，MIT |

## 画法要点

{tagline}

## 许可

引擎与配方卡来自 [huashu-art-motion]({upstream})（MIT），见 [CREDITS.md](CREDITS.md)。
"""

MIGRATION_BODY = """# 迁移说明 · {id}（{name_zh}）

## 来源

- 上游仓库：[huashu-art-motion]({upstream}) v1.3.1
- 风格配方：`references/风格配方/{scene}.md` → `references/style.md`
- 场景代码：`scripts/engine/scenes/{scene}.js` → `vendor/huashu-art-motion/engine/scenes/{scene}.js`
- 渲染器：`scripts/engine/render.py` → `vendor/huashu-art-motion/engine/render.py`
- 引擎库、转场、字体：`scripts/engine/lib/`、`transitions.js`、`lib/fonts/` 原样入库

## 入库内容

- `scripts/{id}.py`：本管线入口，固定 `--film {film} --solo {scene}`，其余参数透传给上游 render.py。
- `references/style.md`：配方卡原文，只改路径表述，不改参数。
- 引擎为**全仓库共享**：所有 huashu 管线共用 `vendor/huashu-art-motion/engine`，不在每条管线里复制一份。

## 不入库

- `demos/`（含花叔角色帧，上游明确不随 MIT 授权）、`reference_films/`（示范工程，体积大且与风格无关）、Clawd 相关素材。
- 成片 `out/*.mp4`、抽帧 `review/*.png`。

## 本地补丁

`vendor/huashu-art-motion/engine/render.py` 加了一个环境变量入口：`CHROME_PATH` 指本机 Chrome/Edge 可执行文件，`CHROME_CHANNEL` 走 Playwright channel；都没有时退回 Playwright 自带 chromium。其余逻辑与上游逐字一致。

## 更新方式

上游升版本后，重新复制 `scripts/engine/` 到 `vendor/huashu-art-motion/engine/`（排除 demos / reference_films），再跑一遍：

```bash
uv run --with playwright python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}
```

抽帧与上游配方卡视觉一致才算同步完成。
"""

CREDITS_BODY = """# 来源与许可

- 上游：[huashu-art-motion]({upstream})，作者花叔（[@AlchainHust](https://x.com/AlchainHust)），MIT License。
- 本管线使用其中的 `{scene}` 场景与配方卡；引擎、转场、绘画库、字体随仓库 vendored 在 `vendor/huashu-art-motion/`。
- 上游的角色帧（花叔形象）、总览图与示范视频不随 MIT 授权，本仓库未收录。
- 字体为 SIL OFL 1.1，清单见 `vendor/huashu-art-motion/engine/lib/fonts/LICENSES.md`。
"""

SCRIPT_BODY = '''#!/usr/bin/env python3
"""Auto-Video · {id}（{name_zh} / {name_en}）

调用仓库内 vendor/huashu-art-motion/engine/render.py，只渲 {scene} 这一段。
上游用法是整片/片段，这里收成两个动作：抽帧（--stills）与出风格段（--seconds）。

    python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}
    python pipelines/{id}/scripts/{id}.py --out out/{id}_试片.mp4 --seconds 6
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ENGINE = ROOT / "vendor" / "huashu-art-motion" / "engine" / "render.py"
SCENE = "{scene}"
FILM = "{film}"
DEFAULT_SECONDS = {seconds}
DEFAULT_FPS = {fps}

WIN_CHROME = [
    r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    r"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    r"C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
]


def ensure_playwright() -> None:
    try:
        import playwright  # noqa: F401
        return
    except ImportError:
        pass
    if shutil.which("uv"):
        os.execvpe("uv", ["uv", "run", "--with", "playwright", "python", __file__, *sys.argv[1:]], os.environ)
    sys.exit("需要 playwright：uv run --with playwright python pipelines/{id}/scripts/{id}.py ...")


def find_chrome(env: dict) -> None:
    if env.get("CHROME_PATH") or env.get("CHROME_CHANNEL") or os.name != "nt":
        return
    for p in WIN_CHROME:
        if Path(p).exists():
            env["CHROME_PATH"] = p
            return


def main() -> int:
    p = argparse.ArgumentParser(description="{name_zh}（{name_en}）")
    p.add_argument("--out", required=True, help="成片路径，或抽帧目录（与 --stills 同用）")
    p.add_argument("--seconds", type=float, default=DEFAULT_SECONDS, help="风格段长度，默认 %(default)s 秒")
    p.add_argument("--stills", default="", help="逗号分隔的秒数：只抽这几帧 PNG")
    p.add_argument("--fps", type=int, default=DEFAULT_FPS)
    p.add_argument("--crf", type=int, default=18)
    p.add_argument("--width", type=int, default=0)
    p.add_argument("--height", type=int, default=0)
    p.add_argument("--no-counter", action="store_true", help="不画年份角标")
    a = p.parse_args()

    ensure_playwright()
    env = dict(os.environ)
    find_chrome(env)

    cmd = [sys.executable, str(ENGINE), "--film", FILM, "--solo", SCENE, "--fps", str(a.fps), "--crf", str(a.crf)]
    if a.stills:
        cmd += ["--stills", a.stills]
    else:
        cmd += ["--from", "0", "--to", str(a.seconds)]
    if a.width and a.height:
        cmd += ["--width", str(a.width), "--height", str(a.height)]
    if a.no_counter:
        cmd.append("--no-counter")
    cmd += ["--out", a.out]
    print(" ".join(cmd))
    return subprocess.call(cmd, env=env)


if __name__ == "__main__":
    raise SystemExit(main())
'''


def slug_ok(text: str) -> bool:
    return bool(re.fullmatch(r"[a-z][a-z0-9_]*", text))


def load_map() -> dict:
    return json.loads(MAP_PATH.read_text(encoding="utf-8"))["styles"]


def gallery_timeline() -> list[tuple[str, float, float]]:
    """从上游 eras_gallery.js 算每段起止（128 BPM，1 个八分音符 0.234375 s）。"""
    js = (ROOT / "vendor" / "huashu-art-motion" / "engine" / "eras_gallery.js").read_text(encoding="utf-8")
    items = re.findall(r"{ id: '([0-9_a-z]+)', name: '[^']*', eighths: (\d+)", js)
    out, t = [], 0.0
    for sid, eighths in items:
        dur = int(eighths) * 0.234375
        out.append((sid, t, t + dur))
        t += dur
    return out


def ffprobe_seconds(path: Path) -> float:
    v = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True, check=True).stdout.strip()
    return round(float(v), 2)


def cut_sample(film: Path, start: float, end: float, mid: Path, jpg: Path) -> tuple[float, int]:
    pad = 0.05
    start, end = start + pad, end - pad
    dur = round(end - start, 3)
    tmp = mid.with_name(mid.stem + ".tmp.mp4")
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-ss", f"{start:.3f}", "-t", f"{dur:.3f}", "-i", str(film),
        "-vf", "scale=1024:-2:flags=lanczos", "-r", "24",
        "-c:v", "libx264", "-preset", "medium", "-crf", "30", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(tmp)], check=True)
    tmp.replace(mid)
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-ss", f"{start + dur / 2:.3f}", "-i", str(film),
        "-frames:v", "1", "-vf", "scale=1024:-2:flags=lanczos", "-q:v", "3", str(jpg)], check=True)
    return dur, mid.stat().st_size


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true", help="重写已存在的管线文档")
    ap.add_argument("--film", default="", help="上游 art-motion-35-styles.mp4，给了就切站点样片")
    ap.add_argument("--reports", default="", help="研究配方封面图目录（上游 assets/新风格v2_证据）")
    args = ap.parse_args()

    styles = load_map()
    imports = {k: v for k, v in styles.items() if v.get("disposition") == "import"}

    catalog = json.loads((ROOT / "catalog" / "pipelines.json").read_text(encoding="utf-8"))
    known = {p["id"] for p in catalog["pipelines"]}

    def is_ours(pid: str) -> bool:
        pj = ROOT / "pipelines" / pid / "pipeline.json"
        if not pj.exists():
            return False
        try:
            return "huashu-art-motion" in json.dumps(json.loads(pj.read_text(encoding="utf-8")), ensure_ascii=False)
        except Exception:
            return False

    bad = [k for k, v in imports.items()
           if not slug_ok(v.get("id", "")) or (v["id"] in known and not is_ours(v["id"]))]
    if bad:
        print("id 不合法或撞车：", bad)
        return 1

    samples_path = ROOT / "site" / "assets" / "samples.json"
    samples = json.loads(samples_path.read_text(encoding="utf-8"))
    sample_keys = {s["key"] for s in samples["items"]}

    timeline = gallery_timeline()
    film = Path(args.film) if args.film else None
    reports = Path(args.reports) if args.reports else None

    added, kept = [], []
    for key, v in imports.items():
        pid = v["id"]
        d = ROOT / "pipelines" / pid
        d.mkdir(parents=True, exist_ok=True)
        st = STATION_BY_ID[v["station"]]
        quality_note = ("上游自评 ★，角色还扁，先按 beta 用。" if v.get("status") == "beta"
                        else "画法已在成片里验证过；换题材时按配方卡重新构图。")
        fields = dict(id=pid, name_zh=v["name_zh"], name_en=v["name_en"], tagline=v["tagline"],
                      scene=v["scene"], station_no=st["no"], station_zh=st["name_zh"],
                      quality=v["quality"], quality_note=quality_note, film=v["film"],
                      seconds=6, fps=24, upstream=UPSTREAM)

        files = {
            "SKILL.md": SKILL_BODY.format(**fields),
            "README.md": README_BODY.format(**fields),
            "MIGRATION.md": MIGRATION_BODY.format(**fields),
            "CREDITS.md": CREDITS_BODY.format(**fields),
            "scripts": None,
        }
        if args.dry_run:
            print(f"[dry] {pid:8} {v['name_zh']:10} {v['station']:8} {v['scene']}")
            continue

        for name, body in files.items():
            if body is None:
                continue
            path = d / name
            if path.exists() and not args.force:
                continue
            path.write_text(body, encoding="utf-8", newline="\n")

        (d / "scripts").mkdir(exist_ok=True)
        script = d / "scripts" / f"{pid}.py"
        if not script.exists() or args.force:
            script.write_text(SCRIPT_BODY.format(**fields), encoding="utf-8", newline="\n")

        ref = d / "references"
        ref.mkdir(exist_ok=True)
        recipe = ROOT / RECIPE_DIR / f"{v['scene']}.md"
        target = ref / "style.md"
        if recipe.exists() and (not target.exists() or args.force):
            shutil.copyfile(recipe, target)

        spec = {
            "source": "huashu-art-motion v1.3.1",
            "upstream": UPSTREAM,
            "style_slug": v["scene"],
            "film": v["film"],
            "quality": v["quality"],
            "engine": "vendor/huashu-art-motion/engine",
            "license": "MIT（角色帧与总览图不在授权范围，未收录）",
            "sample_source": "site/media/{}.mp4".format(pid),
        }
        pj = d / "pipeline.json"
        if not pj.exists() or args.force:
            pj.write_text(json.dumps({"schema": "auto-video/pipeline@2", "meta": {}, "spec": spec},
                                     ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

        # catalog
        if pid not in known:
            entry = {
                "id": pid, "station": v["station"], "name_zh": v["name_zh"], "name_en": v["name_en"],
                "tagline": v["tagline"], "engine": "自研渲染 · huashu 引擎（本地 vendored）",
                "aspect": "16:9", "fps": 24, "entry": f"scripts/{pid}.py", "status": v["status"],
            }
            if v["film"] == "gallery":
                entry["sample"] = {"file": f"{pid} huashu-{v['name_zh']}.mp4",
                                   "title": f"{v['name_zh']} · 上游样片", "seconds": 1.05}
            else:
                entry["sample"] = None
                entry["sample_note"] = "研究配方：上游只有单帧原型，暂无成片；封面来自原型帧"
            catalog["pipelines"].append(entry)
            known.add(pid)
            added.append(pid)
        else:
            kept.append(pid)

    # frontend targets
    tg_path = ROOT / "frontend" / "targets.json"
    tg = json.loads(tg_path.read_text(encoding="utf-8"))
    for v in imports.values():
        pid = v["id"]
        if pid not in tg["pipelines"]:
            tg["pipelines"][pid] = {"render": None,
                                    "reason": "单风格段：入口直接调 vendor/huashu-art-motion/engine，frontend 只灌文案与配音"}

    if args.dry_run:
        print(f"\nimport {len(imports)} 条；catalog 现有 {len(catalog['pipelines'])} 条")
        return 0

    catalog["updated"] = "2026-11-20"
    (ROOT / "catalog" / "pipelines.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    tg_path.write_text(json.dumps(tg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

    # 样片：核心风格从上游全风格片按段切；研究配方只出封面
    if film and film.exists() and timeline:
        offset = {sid: (t0, t1) for sid, t0, t1 in timeline}
        media = ROOT / "site" / "media"
        media.mkdir(exist_ok=True)
        for v in imports.values():
            pid = v["id"]
            if pid in sample_keys:
                continue
            mp4 = media / f"{pid}.mp4"
            jpg = media / f"{pid}.jpg"
            if v["film"] == "gallery" and v["scene"] in offset:
                t0, t1 = offset[v["scene"]]
                dur, size = cut_sample(film, t0, t1, mp4, jpg)
                item = {
                    "key": pid, "kind": "pipeline", "pipeline": pid,
                    "title": v["name_zh"], "style": v["name_zh"], "style_en": v["name_en"],
                    "station": v["station"], "badge": "上游样片", "long_edge": 1024,
                    "max_seconds": 2.0, "crf": 30, "seconds": dur, "duration": f"0:{int(round(dur)):02d}",
                    "aspect": "16:9", "clip_seconds": dur,
                    "poster_pick": {"by": "mid", "note": "取段中点"},
                    "mp4": f"media/{pid}.mp4", "poster": f"media/{pid}.jpg",
                    "source": f"huashu-art-motion v1.3.1 art-motion-35-styles.mp4 @ {t0:.2f}s",
                    "bytes": size,
                    "note": "上游全风格样片节选，管线本地可重渲",
                }
            else:
                still = None
                if reports and reports.is_dir():
                    candidate = reports / f"{v['scene']}.jpg"
                    if candidate.exists():
                        still = candidate
                if still:
                    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(still),
                                    "-vf", "scale=1024:-2:flags=lanczos", "-q:v", "3", str(jpg)], check=True)
                item = {
                    "key": pid, "kind": "pipeline", "pipeline": pid,
                    "title": v["name_zh"], "style": v["name_zh"], "style_en": v["name_en"],
                    "station": v["station"], "badge": "研究配方", "long_edge": 1024,
                    "seconds": None, "duration": "—", "aspect": "16:9", "clip_seconds": None,
                    "mp4": None, "poster": f"media/{pid}.jpg" if still else None,
                    "source": f"huashu-art-motion v1.3.1 {v['scene']} 原型帧",
                    "note": "研究配方：暂无成片，封面为原型单帧",
                }
            samples["items"].append(item)
            sample_keys.add(pid)
        samples["generated_from"] = "site/media 本地文件 + 原有清单 + huashu 上游样片"
        samples_path.write_text(json.dumps(samples, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

    print(f"新增 {len(added)} 条：{' '.join(added)}；已存在 {len(kept)} 条")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
