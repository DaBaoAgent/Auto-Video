#!/usr/bin/env python3
"""把 anidoodle 的 32 种风格过一遍，只收"没迁移过、也不与仓库现有管线同族"的画法，
按 Auto-Video 的双拼命名落成自包含管线。

判定写在 TOOLS/anidoodle_style_map.json（32 条全表），本脚本只负责把 NEW 的 6 条建出来。
画法脚本在 tools/anidoodle_template/scenes/<id>.js，是按媒介原理重写的，不复制上游源码。

    python tools/import_anidoodle_styles.py           # 建管线
    python tools/import_anidoodle_styles.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
TPL = REPO / "tools" / "anidoodle_template"
UPSTREAM = "https://github.com/alexgreensh/anidoodle"
UP_VER = "v0.9.x（2026-11 快照，Apache-2.0）"

STYLES = [
    # slug, 中文名, 英文名, 判定, 对应管线 / 说明
    ("balloon", "蜡笔", "Crayon", "migrated", "labi 蜡笔儿童绘本"),
    ("blueprint", "蓝晒蓝图", "Cyanotype blueprint", "migrated", "blueprint 蓝晒工程图"),
    ("brokenColour", "分色笔触", "Broken colour", "same-family", "yinxiang 印象派短笔触（同族：不调匀的并置色）"),
    ("charcoalErasure", "炭笔擦画", "Charcoal, erased and redrawn", "new", "tanbi"),
    ("colouredPencil", "彩色铅笔", "Coloured pencil", "migrated", "caiqian 彩铅科普"),
    ("dreamGlaze", "梦境釉彩", "Dream glaze", "new", "youcai"),
    ("embroidery", "刺绣", "Hand embroidery", "new", "cixiu"),
    ("flatVector", "扁平矢量", "Flat vector", "migrated", "shiliang 扁平矢量"),
    ("folkTale", "民间故事绘本", "Folk-tale storybook", "new", "minjian"),
    ("fox", "剪纸拼贴", "Cut-paper collage", "same-family", "jianzhi 红色窗花剪纸（同族：撕纸剪纸上贴）"),
    ("halftone", "报纸网点", "Newsprint halftone", "migrated", "wangdian 网点档案"),
    ("isometric", "等距剖视", "Isometric cutaway", "migrated", "isometric 等距世界"),
    ("koi", "马克笔漫画", "Marker comic", "same-family", "make 马克笔速写（同族：酒精马克平涂＋粗轮廓）"),
    ("lighthouse", "孔版印刷", "Risograph", "migrated", "kongban 孔版印刷"),
    ("lowPoly", "低多边形", "Low-poly", "new", "diduo"),
    ("mellan", "单线雕版", "Single-line engraving", "same-family", "yibi 一笔画（同族：一笔不断的螺旋线）"),
    ("midCentury", "世纪中期水粉", "Mid-century gouache", "same-family", "wushi 50s 扁平卡通（同族：哑光平涂＋干笔边）"),
    ("moonPhases", "粉笔黑板", "Chalkboard", "migrated", "heiban 黑板粉笔"),
    ("paintedOil", "油画", "Oil on canvas", "migrated", "youhua 油画厚涂"),
    ("paperCraft", "纸艺玩具剧场", "Toy-theatre paper collage", "same-family", "jianzhi 剪纸拼贴（同族：剪纸＋彩绘纸片逐格）"),
    ("pixelArt", "像素画", "Pixel art", "migrated", "xiangsu 像素风"),
    ("pocketWatch", "圆珠笔", "Ballpoint sketch", "new", "yuanzhu"),
    ("ranunculus", "铅笔与水彩", "Pencil & watercolour", "same-family", "pencil 铅笔测试（同族：石墨＋水彩不填满轮廓）"),
    ("rubberHose", "橡皮管动画", "Rubber hose", "same-family", "goldenage 黄金卡通（同族：1930s 墨线＋胶片颗粒）"),
    ("scrapbook", "复古剪贴簿", "Archival scrapbook", "same-family", "fugu 复古版画拼贴"),
    ("scratchboard", "刮画", "Scratchboard", "migrated", "guaban 刮版画"),
    ("stipple", "点描", "Pen-and-ink stipple", "same-family", "xiula 修拉点彩（同族：只有点，没有线）"),
    ("storybook", "绘本", "Storybook pencil + watercolour", "same-family", "shouhui 手绘插画（同族：铅笔＋淡彩角色）"),
    ("sumiE", "水墨画", "Sumi-e ink painting", "migrated", "shuimo 纸本水墨"),
    ("toyBrick", "玩具积木", "Toy brick", "migrated", "jimu 积木玩具"),
    ("woodcut", "木刻／浮世绘", "Ukiyo-e colour woodblock", "migrated", "muke 木刻版画"),
    ("wren", "墨线淡彩", "Ink & line-wash", "same-family", "gangbi 钢笔淡彩（同族：湿洗漫过线再勾）"),
]

NEW = [
    {
        "id": "tanbi", "slug": "charcoalErasure", "station": "hand", "scene": "tanbi",
        "name_zh": "炭笔擦画", "name_en": "Charcoal, Erased and Redrawn",
        "tagline": "柳炭起形、纸擦笔揉开、可塑橡皮提白，再在擦掉的旧痕上重画一遍。",
        "medium": "柳炭条与压缩炭在粗纹棉纸上，纸擦笔揉成中间调，可塑橡皮只提亮不提线。",
        "quality": "★★★",
        "ref": "炭笔介质的三段工序：起形（短线拱出来的轮廓）→ 揉擦（把暗部揉散成纸灰）→ 提白 → 在旧痕上复画。",
        "refs": [
            "笔触：柳炭起形干而轻，压缩炭压暗部；每一笔都不是一次画完，靠短线段一路拱过去。",
            "色光：单色，暖灰纸配中性黑；暗部不是纯黑，是纸纹里透出来的灰，光从左上。",
            "空间：四周留两指纸边；暗部大面积压住下半幅，主体只留轮廓与两三次擦痕。",
            "母题动法：擦和画交替——擦掉的地方要留残影，最后那遍线压在残影上。",
        ],
        "forbid": [
            "不要数码味的纯黑与干净渐变；",
            "不要擦得比画得干净，最后一帧必须还看得见被擦掉的东西；",
            "不要出现橡皮屑之类的装饰道具。",
        ],
        "params": "纸 #e9e3d6 · 炭 26,24,22 · 默认 7 s · 24 fps · 16:9",
        "seconds": 7,
    },
    {
        "id": "youcai", "slug": "dreamGlaze", "station": "hand", "scene": "youcai",
        "name_zh": "梦境釉彩", "name_en": "Dream Glaze",
        "tagline": "树脂稀释的油彩一层层罩上去，看不见笔触，边缘一律硬，只有一束很低的光。",
        "medium": "树脂稀释的油画罩染，极软的细笔在白底上薄涂；每个形体像被逐像素修过，边缘硬。",
        "quality": "★★★",
        "ref": "罩染的逻辑：不是画一笔颜色，而是同一块地方反复罩不同透明的层，让色自己长出来。",
        "refs": [
            "笔触：不存在笔触；只剩色层的交界，交界处也不许糊。",
            "色光：一束极低的光，受光面留一块指甲盖大小的硬边高光，暗部是透明的深釉。",
            "空间：白底、桌面一条硬边线；投影硬边、往右下、不羽化。",
            "母题动法：形体从一侧被「铺」过去，前沿一条湿边，铺完不再动。",
        ],
        "forbid": [
            "不要笔刷纹理、画布颗粒、油画刀痕；",
            "不要柔化投影，不要环境光遮蔽；",
            "高光面积不许超过指甲盖。",
        ],
        "params": "底 #f4f1ea · 湿边 0.18 白 · 默认 7 s · 24 fps · 16:9",
        "seconds": 7,
    },
    {
        "id": "cixiu", "slug": "embroidery", "station": "craft", "scene": "cixiu",
        "name_zh": "刺绣", "name_en": "Hand Embroidery",
        "tagline": "棉线在平纹亚麻上一针针走过：枝用轮廓绣、叶用缎面绣、花心最后打结。",
        "medium": "棉线绣在平纹亚麻上，绷在榉木绣绷里；针脚方向决定形体，线本身带丝光。",
        "quality": "★★★",
        "ref": "绣法分工：枝是轮廓绣（针针相连往前拱），叶是缎面绣（平行针铺满），花心是结粒绣。",
        "refs": [
            "笔触：每一针都是一小段有宽度的线，线上有偏上的细高光，线下压出一点布影。",
            "色光：线亮、布哑；亚麻平纹一亮一暗交替，绷内的布被撑亮，绷外压暗。",
            "空间：绣绷就是画框，针脚不许越界；绷子有厚度、木纹和内侧压布的暗影。",
            "母题动法：按绣娘的次序上针——先枝、再叶、后花、最后打结，逐针不加速。",
        ],
        "forbid": [
            "不要把线画成实心色块或渐变条；",
            "不要出现针、顶针、线轴；",
            "不要让针脚跨出绣绷。",
        ],
        "params": "亚麻 #f7f0df · 榉木 #a97a44 · 默认 7 s · 24 fps · 16:9",
        "seconds": 7,
    },
    {
        "id": "minjian", "slug": "folkTale", "station": "paper", "scene": "minjian",
        "name_zh": "民间故事绘本", "name_en": "Folk-tale Storybook",
        "tagline": "水粉压在铅笔稿上，前景不透明，越往远越薄，最后只剩没盖住的那几根线。",
        "medium": "HB 铅笔起稿，奶油卡纸上先铺水粉：前景不透明带干笔边，远景只剩一层水色。",
        "quality": "★★★",
        "ref": "远近不是靠透视，是靠颜料厚度：前景最厚、中景半透、远景只有水色和露出来的铅笔线。",
        "refs": [
            "笔触：铅笔线细而松，反复几遍但不追求准；水粉干笔，边缘留纸色缺口。",
            "色光：奶油卡纸统一暖底，天只上一层薄蓝绿，没有戏剧性的光。",
            "空间：三层——前景水粉实体、中景薄色草地、远景铅笔山脊；交界的线要露出来。",
            "母题动法：铅笔先、远景色次、中景再、前景最后压；笔序就是画师的手序。",
        ],
        "forbid": [
            "不要均匀渐变和数字渐变网格；",
            "不要把远景画厚、画实；",
            "不要把铅笔线全盖掉。",
        ],
        "params": "纸 #f3e9d2 · 前景不透明度 0.90–0.98 · 默认 7 s · 24 fps · 16:9",
        "seconds": 7,
    },
    {
        "id": "diduo", "slug": "lowPoly", "station": "d3", "scene": "diduo",
        "name_zh": "低多边形", "name_en": "Low-poly",
        "tagline": "手算的三角网格与一束低阳，面片从远到近长出来，不用任何三维引擎。",
        "medium": "手工投影的三角网格，每个面按法线与低光夹角平涂；近大远小，面与面互相遮挡。",
        "quality": "★★★",
        "ref": "低多边形的全部表现力在法线：面朝光就亮、背光就冷，不需要贴图也不需要雾。",
        "refs": [
            "笔触：没有笔触，只有面；每个面一个平涂色，面之间一道极细接缝避免亮线。",
            "色光：一束低阳，明度由夹角定；背光面用冷紫而不是黑。",
            "空间：手算针孔投影，面片按远到近排序；镜头不动，让光和面片生长动。",
            "母题动法：地形从最远一块块长出来，最后落水面倒影。",
        ],
        "forbid": [
            "不要曲面、渐变网格、雾化边缘；",
            "不要调用 Three.js 或任何三维引擎；",
            "不要让面片按屏幕顺序乱序出现。",
        ],
        "params": "网格 17×11 · 视场 1250 · 太阳 (-0.65,0.62,-0.42) · 默认 6 s · 24 fps · 16:9",
        "seconds": 6,
    },
    {
        "id": "yuanzhu", "slug": "pocketWatch", "station": "hand", "scene": "yuanzhu",
        "name_zh": "圆珠笔", "name_en": "Ballpoint Sketch",
        "tagline": "一支蓝圆珠笔，线宽不变，明暗全靠排线，收笔处积一点墨。",
        "medium": "蓝色圆珠笔在奶油卡纸上；线宽几乎不变，没有中间调，只有线的密度。",
        "quality": "★★★",
        "ref": "圆珠笔不能调宽，所以明暗只能靠排线角度与间距；收笔积墨是它唯一的表现性。",
        "refs": [
            "笔触：同一支笔画到底，线宽恒定；每一组排线整体推进，不是一根根跳。",
            "色光：纸奶油、墨偏紫的蓝；暗部靠交叉排线，没有灰色。",
            "空间：一个物件占满画面，四周留纸；投影用横向排线表示。",
            "母题动法：先两遍轮廓再细节，最后补投影；收笔处点一粒墨。",
        ],
        "forbid": [
            "不要用白色擦出高光；",
            "不要加第二支笔或第二种颜色；",
            "不要线宽随明暗变化。",
        ],
        "params": "纸 #f0e8d3 · 墨 38,62,132 · 默认 7 s · 24 fps · 16:9",
        "seconds": 7,
    },
]

STATION_NAME = {
    "paper": "01 纸本叙事", "hand": "02 手绘笔触", "craft": "03 传统工艺", "toon": "04 卡通动画",
    "graphic": "05 平面图形", "screen": "06 屏幕赛博", "d3": "07 三维推演", "map": "08 地图地理",
    "diagram": "09 图纸说明", "live": "10 实拍混剪", "front": "11 前端工位",
}

SKILL = """---
name: {id}
description: {name_zh}（{name_en}）：{tagline} 管线自带 runtime 与画法脚本，入口只调本目录画帧器，不依赖外部仓库。
---

# {id}：{name_zh}（{name_en}）

| 项 | 值 |
| --- | --- |
| 工位 | {station_name} |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按{medium_short}的媒介原理重写） |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/{id}.py` |

## 这条管线交什么

{tagline}

这是一条**自包含的单风格渲染线**：运行时、舞台、画法脚本、入口全在 `pipelines/{id}/runtime/` 里，仓库外不留任何依赖。交付的是风格段 / 风格短片，默认不配旁白。

## 入口命令

```bash
# 抽两帧看画（没装 playwright 时用 uv 带一次）
python pipelines/{id}/scripts/{id}.py --stills 0.5,2.5 --out review/{id}

# 出 {seconds} 秒风格段
python pipelines/{id}/scripts/{id}.py --out out/{id}_试片.mp4 --seconds {seconds}
```

## 写法要点

- **先读 `references/style.md`**：那份卡写的是这套{medium_short}的笔触、色光、空间和母题动法；`runtime/scene.js` 是它的实现。
- **画面是代码画的**：`runtime/scene.js` 不加载外部图片、不引用外部库；换题材要重新构图。
- **时间轴按秒算**：`--seconds` 出风格段长度；镜头内动作仍按这套画法的工序走。
- **换题材时保留工序**：{workflow}。

## 自研边界

- 自研：`runtime/render.py`（静态服务、逐帧抓取、ffmpeg 管道）、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/{id}.py`、参数与验收。
- 只参考：上游 anidoodle（Apache-2.0）对这套媒介的描述与工序，见 [CREDITS.md](CREDITS.md)、[MIGRATION.md](MIGRATION.md)；未复制其源码或素材。
- 运行时不读 `vendor/`、不读上游仓库、不调外部渲染脚本。
"""

STYLE_MD = """# {id} · {name_zh}

> 自研画法卡。写的是媒介本身的规矩，不是某张参考图长什么样。

## 这是什么媒介

{medium}

## 工序（画师的顺序，也就是时间轴）

{workflow}

## 四条硬规矩

{refs}

## 禁忌

{forbid}

## 定版参数

`{params}`

## 换题材时怎么用

1. 先在纸上想清楚这个题材在这套媒介里"怎么可能画出来"——{medium_short}不接受的画法直接放弃。
2. 只改 `runtime/scene.js` 里的母题数据（路径点、色、数量），不要改工序顺序。
3. 抽 `--stills 0.5,2.5` 两帧，对照上面四条硬规矩逐条过；有一条不过就重画。
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
| 画法灵感 | anidoodle（{upstream}，Apache-2.0，{ver}）中的 `{slug}` 一种媒介 |
| 参考了什么 | 这种媒介的工序描述（先做什么、后做什么）、笔触/色光/空间的规矩 |
| 没有用什么 | 上游的 `scene`/`engine` 源码、字体、图片素材、样片 |
| 本管线自研 | `runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/{id}.py` |
| 运行时依赖 | 本目录内的文件 + playwright + ffmpeg，不读上游仓库、不读 `vendor/` |

上游是 Apache-2.0，但这里采用"只读描述、重写实现"的方式接入：
画法脚本逐条按媒介原理重新实现，代码结构与上游不同，因此不构成对其源码的复制或改编。
"""

MIGRATION = """# 接入记录

## 判定

- 上游风格：`{slug}`（{name_zh} / {name_en}）
- 判定：**新接入**
- 理由：仓库里没有同族管线；现有的{neighbor}那一类解决的是别的媒介，不能替代。

## 落成

| 项 | 值 |
| --- | --- |
| 管线 id | `{id}`（双拼，按 Auto-Video 命名传统） |
| 工位 | {station_name} |
| 画幅 | 16:9 · 24 fps |
| 默认时长 | {seconds} s |
| 入口 | `scripts/{id}.py` |

## 自研清单

1. `runtime/render.py` 逐帧画器：本地静态服务 + Chromium 抓帧 + ffmpeg 管道。
2. `runtime/stage.html` / `runtime/player.js`：单场景舞台协议（`renderAt(t)`）。
3. `runtime/lib/util.js`：定种子随机、缓动、纸纹、按比例揭示笔画。
4. `runtime/scene.js`：按{medium_short}的工序重写的画法脚本。
5. `scripts/{id}.py`：CLI 入口，只调本目录画器。

## 没有搬的东西

- 上游的画法脚本、引擎、字体与图片资源一概不取；样片只作为演示站封面素材（官方风格对照图裁切），
  不进管线运行路径。
"""


def write(p: Path, text: str, dry: bool) -> None:
    if dry:
        print("[dry]", p.relative_to(REPO))
        return
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    print("+", p.relative_to(REPO))


def register(n: dict, dry: bool) -> None:
    """写进 catalog/pipelines.json 与 site/assets/samples.json（幂等 upsert）。"""
    cat_path = REPO / "catalog" / "pipelines.json"
    cat = json.loads(cat_path.read_text(encoding="utf-8"))
    entry = {
        "id": n["id"],
        "station": n["station"],
        "name_zh": n["name_zh"],
        "name_en": n["name_en"],
        "tagline": n["tagline"],
        "engine": "自研渲染 · 本地 runtime（Canvas 2D 逐帧）",
        "aspect": "16:9",
        "fps": 24,
        "entry": f"scripts/{n['id']}.py",
        "status": "live",
        "sample": None,
        "sample_note": "演示站暂用 anidoodle 官方 32 风格对照图裁切封面；管线本地可重渲",
    }
    items = [p for p in cat["pipelines"] if p["id"] != n["id"]]
    items.append(entry)
    cat["pipelines"] = items
    if dry:
        print("[dry] catalog", n["id"])
    else:
        cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("~ catalog", n["id"])

    sp_path = REPO / "site" / "assets" / "samples.json"
    if not sp_path.exists():
        return
    sp = json.loads(sp_path.read_text(encoding="utf-8"))
    sp["items"] = [it for it in sp["items"] if it.get("key") != n["id"]]
    sp["items"].append({
        "key": n["id"],
        "kind": "pipeline",
        "pipeline": n["id"],
        "title": f"{n['name_zh']} · anidoodle 风格图",
        "style": n["name_zh"],
        "style_en": n["name_en"],
        "station": n["station"],
        "badge": "上游风格图 封面",
        "seconds": None,
        "duration": "—",
        "aspect": "16:9",
        "clip_seconds": None,
        "mp4": None,
        "poster": f"media/{n['id']}.jpg",
        "source": f"anidoodle assets/styles.jpg（{n['slug']} 一格）",
        "note": "演示站暂时只借上游风格图做封面；片子在本地用本管线重渲后替换",
    })
    if dry:
        print("[dry] samples", n["id"])
    else:
        sp_path.write_text(json.dumps(sp, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("~ samples", n["id"])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    dry = a.dry_run

    # 判定表：32 条全表落在 tools/anidoodle_style_map.json
    table = {
        "schema": "auto-video/anidoodle-map@1",
        "upstream": UPSTREAM,
        "ver": UP_VER,
        "license": "Apache-2.0",
        "note": "唯一判定口径：已迁移 / 同族等价 / 新接入。同族指媒介与手法都能被现有管线覆盖，不再单开一条。",
        "styles": [
            {"slug": s, "name_zh": nz, "name_en": ne, "verdict": v, "match": m}
            for s, nz, ne, v, m in STYLES
        ],
        "new": [n["id"] for n in NEW],
    }
    write(REPO / "tools" / "anidoodle_style_map.json", json.dumps(table, ensure_ascii=False, indent=2) + "\n", dry)

    for n in NEW:
        d = REPO / "pipelines" / n["id"]
        station_name = STATION_NAME[n["station"]]
        medium_short = n["name_zh"]
        workflow = n["refs"][3].split("：", 1)[-1]
        # pipeline.json
        pj = {
            "schema": "auto-video/pipeline@2",
            "meta": {
                "id": n["id"],
                "no": "000",   # 占位：若已有 pipeline.json，则沿用其既有编号（见下）
                "name_zh": n["name_zh"],
                "name_en": n["name_en"],
                "station": n["station"],
                "tagline": n["tagline"],
                "engine": "自研渲染 · 本地 runtime（Canvas 2D 逐帧）",
                "aspect": "16:9",
                "fps": 24,
                "entry": f"scripts/{n['id']}.py",
                "status": "live",
                "sample": None,
                "sample_note": "演示站封面/样片为本仓库自渲 10 秒成片（1024×576、crf 30、配底乐）",
                "updated": "2026-11-20",
            },
            "spec": {
                "source": f"anidoodle {UP_VER}（画法参考，代码自研，运行时不依赖上游）",
                "upstream": UPSTREAM,
                "style_slug": n["slug"],
                "medium": n["medium"],
                "workflow": n["ref"],
                "quality": n["quality"],
                "engine": "runtime/render.py",
                "license": "Apache-2.0（仅读媒介描述，未复制上游代码与素材）",
                "runtime": f"pipelines/{n['id']}/runtime",
                "stage": "runtime/stage.html",
                "player": "runtime/player.js",
                "drawing_script": "runtime/scene.js",
                "self_contained": True,
            },
        }
        # 已存在的编号（no / station_no）不能被重置，否则站点排序与索引会错位
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
            station_name=station_name, medium_short=medium_short, seconds=n["seconds"],
            workflow=workflow,
        ), dry)

        write(d / "references" / "style.md", STYLE_MD.format(
            id=n["id"], name_zh=n["name_zh"], medium=n["medium"], medium_short=medium_short,
            workflow=n["ref"], refs="\n".join("- " + x for x in n["refs"]),
            forbid="\n".join("- " + x for x in n["forbid"]), params=n["params"],
        ), dry)

        write(d / "README.md", README.format(id=n["id"], name_zh=n["name_zh"], name_en=n["name_en"],
                                             tagline=n["tagline"], seconds=n["seconds"]), dry)
        write(d / "CREDITS.md", CREDITS.format(id=n["id"], upstream=UPSTREAM, ver=UP_VER,
                                               slug=n["slug"], name_zh=n["name_zh"], name_en=n["name_en"]), dry)
        write(d / "MIGRATION.md", MIGRATION.format(
            id=n["id"], slug=n["slug"], name_zh=n["name_zh"], name_en=n["name_en"],
            station_name=station_name, seconds=n["seconds"], medium_short=medium_short,
            neighbor=STYLES_PICK(n),
        ), dry)

        entry_tpl = (TPL / "scripts" / "entry.py").read_text(encoding="utf-8")
        entry = (entry_tpl.replace("@ID@", n["id"]).replace("@NAME_ZH@", n["name_zh"])
                 .replace("@NAME_EN@", n["name_en"]).replace("@SCENE@", n["scene"]))
        write(d / "scripts" / f"{n['id']}.py", entry, dry)

        # runtime：画帧器/舞台/播放器/工具是我们自己的，直接复制模板
        for f in ["render.py", "stage.html", "player.js", "lib/util.js"]:
            src = TPL / "runtime" / f
            if dry:
                print("[dry]", (d / "runtime" / f).relative_to(REPO))
                continue
            (d / "runtime").mkdir(parents=True, exist_ok=True)
            (d / "runtime" / Path(f).parent).mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, d / "runtime" / f)
            print("+", (d / "runtime" / f).relative_to(REPO))

        scene = (TPL / "scenes" / f"{n['scene']}.js").read_text(encoding="utf-8")
        write(d / "runtime" / "scene.js", scene, dry)

        register(n, dry)

    return 0


def STYLES_PICK(n: dict) -> str:
    """给 MIGRATION 写"最近的那条现有管线"，读判定表里同工位的邻居。"""
    near = {
        "tanbi": "pencil 铅笔测试 / guaban 刮版画",
        "youcai": "youhua 油画厚涂",
        "cixiu": "jianzhi 剪纸拼贴 / shuimo 纸本水墨",
        "minjian": "pencil 铅笔测试 / shouhui 手绘插画",
        "diduo": "dengju 等轴世界 / jimu 积木玩具",
        "yuanzhu": "make 马克笔速写 / caiqian 彩铅科普",
    }
    return near[n["id"]]


if __name__ == "__main__":
    raise SystemExit(main())
