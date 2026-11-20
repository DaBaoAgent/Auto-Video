#!/usr/bin/env python3
"""把 mg-styles-15 的 15 种 MG 风格过一遍，只收"没迁移过、也不与仓库现有管线同族"的四条，
按 Auto-Video 的双拼命名落成自包含管线。

判定写在 tools/mg_styles_map.json（15 条全表）；画法脚本在 tools/mg_styles_template/scenes/<id>.js，
是按每种风格的特征重写的，不复制上游源码。

    python tools/import_mg_styles.py
    python tools/import_mg_styles.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
TPL = REPO / "tools" / "mg_styles_template"
UPSTREAM = "https://github.com/vincentwei1021/mg-styles-15"
UP_VER = "2026-10 快照（MIT）"

# slug, 中文名, 英文名, 判定, 对应管线 / 说明
STYLES = [
    ("05-cel-boil", "逐帧手绘 / 线条沸腾", "Cel boil", "migrated", "shouhui 逐帧手绘（纸纹、墨线 boil 已覆盖）"),
    ("03-isometric", "等轴 2.5D", "Isometric", "migrated", "dengju 等轴 2.5D / isometric 等距微缩"),
    ("01-flat-vector", "扁平矢量", "Flat vector", "migrated", "shiliang 扁平矢量"),
    ("02-line-art", "线条动画（一笔画）", "Line art", "migrated", "yibi 一笔画"),
    ("04-3d-render", "3D 渲染系", "3D render", "same-family", "chanpin 玻璃质感产品 / pikesi 皮克斯三维（三维材质与灯光已覆盖）"),
    ("08-morph", "形变动画", "Morph", "new", "xingbian"),
    ("19-paperclip", "粗描边贴纸人科普", "Sticker explainer", "same-family", "huixingzhen 回形针风（贴纸化 + 图表 + 科普同一族）"),
    ("22-hud", "赛博朋克 HUD / FUI", "Cyber HUD", "migrated", "xianshiqi 赛博 HUD"),
    ("06-collage", "拼贴剪贴", "Collage cutout", "new", "pintie"),
    ("12-aurora-glass", "弥散渐变 / 玻璃拟态", "Aurora glassmorphism", "same-family", "fabu 暗色科技发布（玻璃卡片 + 渐变底同一族）"),
    ("09-bauhaus", "几何构成 / 包豪斯", "Bauhaus", "migrated", "baohao 包豪斯几何"),
    ("10-synthwave", "复古 80s Synthwave / VHS", "Synthwave VHS", "migrated", "xuni 合成波 VHS"),
    ("20-pixel", "像素风", "Pixel art", "migrated", "xiangsu 像素风 / xiangsu2 2.5D 像素 / luping 像素小人"),
    ("07-liquid", "液态流动", "Liquid motion", "new", "yetai"),
    ("18-hanazi", "综艺花字（9:16）", "Variety show captions", "new", "huazi"),
]

NEW = [
    {
        "id": "pintie", "slug": "06-collage", "station": "graphic", "scene": "pintie", "aspect": "16:9",
        "name_zh": "拼贴剪贴", "name_en": "Collage Cutout",
        "tagline": "报纸底上贴半调网点人像，白剪边、关节纸片、12 fps 定格，脑袋开盖露出深空。",
        "medium": "旧报纸、牛皮纸、半调网点与剪下来的照片纸片拼在同一页上；白剪边是剪刀留下的，不是描边。",
        "quality": "★★★",
        "ref": "拼贴的工序：铺纸 → 剪人像 → 贴上去 → 开一个口让里面的东西喷出来；运动一律 12 fps 定格，手摆位置带抖动。",
        "refs": [
            "纸层：报纹/半调网点在最底，牛皮纸片中景，照片剪片最上，每层都有纸影。",
            "剪边：人像外一圈 3～4px 白边，边缘故意不齐，像剪刀一路剪过去。",
            "运动：主体 12 fps 定格，位置 ±2px 抖；纸片翻面、拍上来，不用叠化。",
            "母题动法：先贴住人像，再由头盖开合把里面的花、鸟、手、火箭放出来。",
        ],
        "forbid": [
            "不要数码渐变与干净投影；",
            "不要把剪边画成等宽描边；",
            "不要让元素做匀速运动。",
        ],
        "params": "报底 #e8dfc9 · 墨 #1b1712 · 红 #c9382b · 默认 8 s · 24 fps · 16:9",
        "seconds": 8,
    },
    {
        "id": "yetai", "slug": "07-liquid", "scene": "yetai", "station": "graphic", "aspect": "16:9",
        "name_zh": "液态流动", "name_en": "Liquid Motion",
        "tagline": "糖浆色的液体滴落、拉丝、融合，一泼漫过屏幕，最后聚成字标。",
        "medium": "高光糖浆液体：厚、亮、有表面张力；重叠处接成一片，边缘是波浪，不是几何圆。",
        "quality": "★★★",
        "ref": "液体的工序：落滴压扁 → 两团靠近拉颈 → 断裂回弹 → 一泼漫过 → 聚成字 → 最后一滴。",
        "refs": [
            "形：所有液滴共用一支全幅渐变，重叠处同色，所以看起来是一团而不是几个球。",
            "颈：两心之间拉一条两头粗中间细的胶囊，断的时候两端各回弹两三帧。",
            "光：只在每团左上压一道窄高光，不做球体明暗。",
            "转场：波浪前沿带 3～5 个错相位凸起，从一侧漫过整幅。",
        ],
        "forbid": [
            "不要画成塑料球/气泡；",
            "不要匀速位移，液体只被甩出去；",
            "不要让字标边缘硬切成几何直线。",
        ],
        "params": "底 #24072b · 液体 #ffb45c→#ff2d78→#5f22ff · 默认 8 s · 24 fps · 16:9",
        "seconds": 8,
    },
    {
        "id": "xingbian", "slug": "08-morph", "scene": "xingbian", "station": "graphic", "aspect": "16:9",
        "name_zh": "形变动画", "name_en": "Shape Morph",
        "tagline": "一个轮廓连续变成下一个：圆、太阳、星、心、水滴、纸飞机、方标。",
        "medium": "纯色几何形在色块背景上连续变形；轮廓总数一致，顶点按弧长一一对应。",
        "quality": "★★★",
        "ref": "形变的工序：先亮住一个形 → 收成中介圆 → 展开成下一个形 → 色块斜切擦入。",
        "refs": [
            "顶点：每个形按弧长重采样成 160 点，首点都在正上方，方向一致，所以不会打结。",
            "中介：复杂形不直接互变，先收成圆再展开，两段各占一半时间。",
            "挤压：形变中段叠 10% 挤压拉伸与轻微旋转，掩盖插值的机械感。",
            "节奏：每段先停 0.3s 让人认清形，再用 0.7s 变过去，色块在 0.24s 硬边擦入。",
        ],
        "forbid": [
            "不要用渐变/发光掩盖形变；",
            "不要让形状互相穿插打结；",
            "不要匀速线性插值。",
        ],
        "params": "底色 6 组轮换 · 形色对比 · 默认 8 s · 24 fps · 16:9",
        "seconds": 8,
    },
    {
        "id": "huazi", "slug": "18-hanazi", "scene": "huazi", "station": "screen", "aspect": "9:16",
        "name_zh": "综艺花字", "name_en": "Variety Show Captions",
        "tagline": "竖屏萌宠 vlog 上压多层描边胖体花字：弹性 pop、逐字错帧、爆炸框与印章。",
        "medium": "综艺后期的情绪化字幕：填充色 + 粗白边 + 彩色外描边 + 投影，圆体胖字，高饱和撞色。",
        "quality": "★★★",
        "ref": "花字的工序：先有画面（手持抖动 + 推镜）→ 按情绪出字 → 每字 pop 0→1.15→1 → 驻留时轻微 wiggle。",
        "refs": [
            "字层：外彩边 → 白粗边 → 渐变填充 → 投影，四层缺一层就不像花字。",
            "入场：scale 0→1.15→1 约 8 帧，逐字错 2 帧，比画面晚 2～3 帧出现更自然。",
            "情绪：惊讶用放射爆炸框，吐槽用倾斜手写，认证用红章。",
            "画幅：1080×1920 竖屏，字压在安全区内，顶部留 vlog 编号。",
        ],
        "forbid": [
            "不要细体/衬线字；",
            "不要纯色单层描边；",
            "不要让字匀速淡入。",
        ],
        "params": "粉 #ff3d8b · 黄 #ffd23f · 青 #3fe0ff · 默认 8 s · 24 fps · 9:16",
        "seconds": 8,
    },
]


def write(p: Path, text: str, dry: bool) -> None:
    if dry:
        print("[dry]", p.relative_to(REPO))
        return
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    print("+", p.relative_to(REPO))


SKILL = """# {id}：{name_zh}（{name_en}）

| 项 | 值 |
| --- | --- |
| 工位 | {station_name} |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按{medium_short}的特征重写） |
| 画幅 | {aspect} · 24 fps |
| 入口 | `scripts/{id}.py` |

## 这条管线交什么

{tagline}

自包含的单风格渲染线：运行时、舞台、画法脚本、入口全在 `pipelines/{id}/runtime/` 里，仓库外不留依赖。

## 入口命令

```bash
python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}
python pipelines/{id}/scripts/{id}.py --out out/{id}_试片.mp4 --seconds {seconds}
```

## 写法要点

- 先读 `references/style.md`：那份卡写的是这套{medium_short}的规矩，`runtime/scene.js` 是它的实现。
- 画面是代码画的：不加载外部图片、不引用外部库。
- 换题材时保留工序：{workflow}。

## 自研边界

- 自研：`runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/{id}.py`。
- 只参考：mg-styles-15（MIT）对这种风格的公开描述与工序；未复制其源码或素材。
"""

STYLE_MD = """# {id} · {name_zh}

> 自研画法卡。写的是这种风格的规矩，不是某张参考图长什么样。

## 这是什么风格

{medium}

## 工序（时间轴）

{workflow}

## 四条硬规矩

{refs}

## 禁忌

{forbid}

## 定版参数

`{params}`
"""

README = """# {id} · {name_zh}

{name_en}

{tagline}

- 入口：`python pipelines/{id}/scripts/{id}.py --out out/{id}.mp4 --seconds {seconds}`
- 画法卡：[references/style.md](references/style.md)
- 使用说明：[SKILL.md](SKILL.md)
- 来源与自研边界：[CREDITS.md](CREDITS.md) · [MIGRATION.md](MIGRATION.md)
"""

CREDITS = """# 来源与自研边界

| 项 | 说明 |
| --- | --- |
| 风格来源 | mg-styles-15（{upstream}，MIT，{ver}）中的 `{slug}` |
| 参考了什么 | 这种风格的公开说明、工序与风格特征清单 |
| 没有用什么 | 上游 demo 源码、字体、图片与音频素材 |
| 本管线自研 | `runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/{id}.py` |
| 运行时依赖 | 本目录内文件 + playwright + ffmpeg |

上游 MIT，但这里只读风格描述、重写实现：画法脚本按风格原理逐条实现，代码结构与上游不同。
"""

MIGRATION = """# 接入记录

## 判定

- 上游风格：`{slug}`（{name_zh} / {name_en}）
- 判定：**新接入**
- 理由：仓库里没有同族管线；{neighbor}解决的是别的风格，不能替代。

## 落成

| 项 | 值 |
| --- | --- |
| 管线 id | `{id}`（双拼，按 Auto-Video 命名传统） |
| 工位 | {station_name} |
| 画幅 | {aspect} · 24 fps |
| 默认时长 | {seconds} s |
| 入口 | `scripts/{id}.py` |

## 自研清单

1. `runtime/render.py` 逐帧画器：本地静态服务 + Chromium 抓帧 + ffmpeg 管道。
2. `runtime/stage.html` / `runtime/player.js`：单场景舞台协议（`renderAt(t)`）。
3. `runtime/lib/util.js`：定种子随机、缓动、噪声。
4. `runtime/scene.js`：按{medium_short}的工序重写的画法脚本。
5. `scripts/{id}.py`：CLI 入口，只调本目录画器。

## 没有搬的东西

- 上游的画法脚本、字体、图片、音频一概不取；演示站样片暂用上游公开成片，只作展示，不进管线运行路径。
"""


def register(n: dict, dry: bool) -> None:
    cat_path = REPO / "catalog" / "pipelines.json"
    cat = json.loads(cat_path.read_text(encoding="utf-8"))
    entry = {
        "id": n["id"],
        "station": n["station"],
        "name_zh": n["name_zh"],
        "name_en": n["name_en"],
        "tagline": n["tagline"],
        "engine": "自研渲染 · 本地 runtime（Canvas 2D 逐帧）",
        "aspect": n["aspect"],
        "fps": 24,
        "entry": f"scripts/{n['id']}.py",
        "status": "live",
        "sample": None,
        "sample_note": "演示站暂用 mg-styles-15 官方样片；管线本地可重渲",
    }
    items = [p for p in cat["pipelines"] if p["id"] != n["id"]]
    items.append(entry)
    cat["pipelines"] = items
    if not dry:
        cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("~ catalog", n["id"])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    dry = a.dry_run

    table = {
        "schema": "auto-video/mg-styles-map@1",
        "upstream": UPSTREAM,
        "ver": UP_VER,
        "license": "MIT",
        "note": "唯一判定口径：已迁移 / 同族等价 / 新接入。同族指媒介与手法都能被现有管线覆盖。",
        "styles": [
            {"slug": s, "name_zh": nz, "name_en": ne, "verdict": v, "match": m}
            for s, nz, ne, v, m in STYLES
        ],
        "new": [n["id"] for n in NEW],
    }
    write(REPO / "tools" / "mg_styles_map.json", json.dumps(table, ensure_ascii=False, indent=2) + "\n", dry)

    near = {
        "pintie": "jianzhi 窗花剪纸 / fugu 复古版画拼贴",
        "yetai": "shuicai 水彩笔刷 / boli 彩色玻璃窗",
        "xingbian": "wenzi 文字闪切 / xiangxing 象形运动图形",
        "huazi": "jiezou 节奏综艺 / zimu 字幕新闻",
    }
    station_name = {"graphic": "平面动效", "screen": "屏幕包装", "paper": "纸本", "hand": "手作", "craft": "工艺", "toon": "动画", "diagram": "图解", "d3": "三维", "map": "地图", "live": "实拍", "front": "前端"}

    for n in NEW:
        d = REPO / "pipelines" / n["id"]
        workflow = n["refs"][3].split("：", 1)[-1]
        pj = {
            "schema": "auto-video/pipeline@2",
            "meta": {
                "id": n["id"],
                "no": "000",
                "name_zh": n["name_zh"],
                "name_en": n["name_en"],
                "station": n["station"],
                "tagline": n["tagline"],
                "engine": "自研渲染 · 本地 runtime（Canvas 2D 逐帧）",
                "aspect": n["aspect"],
                "fps": 24,
                "entry": f"scripts/{n['id']}.py",
                "status": "live",
                "sample": None,
                "sample_note": "演示站暂用 mg-styles-15 官方样片；管线本地可重渲",
                "updated": "2026-11-20",
            },
            "spec": {
                "source": f"mg-styles-15 {UP_VER}（风格参考，代码自研，运行时不依赖上游）",
                "upstream": UPSTREAM,
                "style_slug": n["slug"],
                "medium": n["medium"],
                "workflow": n["ref"],
                "quality": n["quality"],
                "engine": "runtime/render.py",
                "license": "MIT（仅读风格描述，未复制上游代码与素材）",
                "runtime": f"pipelines/{n['id']}/runtime",
                "stage": "runtime/stage.html",
                "player": "runtime/player.js",
                "drawing_script": "runtime/scene.js",
                "self_contained": True,
            },
        }
        pj_path = d / "pipeline.json"
        if pj_path.exists():
            try:
                old = json.loads(pj_path.read_text(encoding="utf-8")).get("meta", {})
                for k in ("no", "station_no"):
                    if old.get(k):
                        pj["meta"][k] = old[k]
            except Exception:
                pass
        write(pj_path, json.dumps(pj, ensure_ascii=False, indent=2) + "\n", dry)

        write(d / "SKILL.md", SKILL.format(
            id=n["id"], name_zh=n["name_zh"], name_en=n["name_en"], tagline=n["tagline"],
            station_name=station_name[n["station"]], medium_short=n["name_zh"],
            seconds=n["seconds"], aspect=n["aspect"], workflow=workflow,
        ), dry)
        write(d / "references" / "style.md", STYLE_MD.format(
            id=n["id"], name_zh=n["name_zh"], medium=n["medium"], workflow=n["ref"],
            refs="\n".join("- " + x for x in n["refs"]),
            forbid="\n".join("- " + x for x in n["forbid"]), params=n["params"],
        ), dry)
        write(d / "README.md", README.format(id=n["id"], name_zh=n["name_zh"], name_en=n["name_en"],
                                             tagline=n["tagline"], seconds=n["seconds"]), dry)
        write(d / "CREDITS.md", CREDITS.format(id=n["id"], upstream=UPSTREAM, ver=UP_VER,
                                               slug=n["slug"], name_zh=n["name_zh"], name_en=n["name_en"]), dry)
        write(d / "MIGRATION.md", MIGRATION.format(
            id=n["id"], slug=n["slug"], name_zh=n["name_zh"], name_en=n["name_en"],
            station_name=station_name[n["station"]], seconds=n["seconds"],
            medium_short=n["name_zh"], aspect=n["aspect"], neighbor=near[n["id"]],
        ), dry)

        entry_tpl = (TPL / "scripts" / "entry.py").read_text(encoding="utf-8")
        entry = (entry_tpl.replace("@ID@", n["id"]).replace("@NAME_ZH@", n["name_zh"])
                 .replace("@NAME_EN@", n["name_en"]).replace("@SCENE@", n["scene"]))
        write(d / "scripts" / f"{n['id']}.py", entry, dry)

        for f in ["render.py", "stage.html", "player.js", "lib/util.js"]:
            if dry:
                print("[dry]", (d / "runtime" / f).relative_to(REPO))
                continue
            (d / "runtime" / Path(f).parent).mkdir(parents=True, exist_ok=True)
            shutil.copyfile(TPL / "runtime" / f, d / "runtime" / f)
        scene = (TPL / "scenes" / f"{n['scene']}.js").read_text(encoding="utf-8")
        write(d / "runtime" / "scene.js", scene, dry)

        register(n, dry)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
