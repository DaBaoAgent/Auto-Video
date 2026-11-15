# 迁移说明 · goldenage（美式黄金卡通）

## 来源

- 风格运行时：`BB-Video/skills/bb-video/promo/runtime/goldenage.js`
- 共享运行时：`BB-Video/skills/bb-video/core/runtime/core.js`、`BB-Video/skills/bb-video/promo/runtime/promo.js`
- 渲染链：`BB-Video/skills/bb-video/core/scripts/{render,music,bgm,sound,lang,net}.mjs`、`scores/*.mjs`
- 风格规范：`BB-Video/skills/bb-video/styles/goldenage/STYLE.md` → `references/style.md`
- 样片工程：`BB-Video/work/anu-goldenage/` → `template/`（只保留代码、文案、分镜、配乐、音效与空素材清单）
- 成片：`BB-Video/out/01_goldenage_阿努纳奇_第一段.mp4`（本地归档，未入库）

## 入库内容

- `runtime/`：BB-Video MIT 代码的逐字副本（`LICENSE.BB-Video` 随附）。
- `scripts/`：本管线新增的编排脚本 `goldenage.py`，以及从 `map/scripts/make_vo.py` 泛化来的配音时间轴脚本。
- `references/`：风格规范原文、分镜模板、验收清单。
- `template/`：阿努纳奇样片工程；**不包含** `audio/`、`out/`、`review/`、`lib/`。

## 不入库

- 配音 `audio/narration.m4a`、成片 `out/*.mp4`、抽帧 `review/*.png`、工程内 `lib/` 运行时副本（由 `scripts/goldenage.py new` 生成）。
- 字体走 jsDelivr `@fontsource`，渲染器缓存到 `~/.cache/bubble-video/fonts`；Three.js 走 import map CDN（仅 `isometric` / `parable`）。

## 更新方式

BB-Video 的运行时更新后，重新复制上述文件，并跑一遍：

```bash
python scripts/goldenage.py new <临时工程>
python scripts/goldenage.py check <临时工程>
python scripts/goldenage.py stills <临时工程> --times 2,8,15,25
```

`--check` 0 error、抽帧与样片视觉一致，才算同步完成。
