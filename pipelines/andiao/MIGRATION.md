# 迁移说明 · andiao（暗调励志）

## 来源

- 风格运行时：`上游/promo/runtime/lumen.js`
- 共享运行时：`上游/core/runtime/core.js`、`上游/promo/runtime/promo.js`
- 渲染链：`上游/core/scripts/{render,music,bgm,sound,lang,net}.mjs`、`上游/promo/runtime/scores/*.mjs`
- 风格规范：`上游/styles/lumen/STYLE.md` → `references/style.md`
- 起步工程：`上游/styles/lumen/index.html`、`score.js`、`sound.js` → `template/`（只保留起步工程）

## 入库内容

- `runtime/`：BB-Video MIT 代码的逐字副本（`LICENSE-upstream` 随附），风格文件仅把注释里的上游名改为「模板库」。
- `scripts/`：本管线新增的编排脚本 `andiao.py`（new / check / stills / render / probe / qa / deliver）。
- `references/`：风格规范原文、分镜模板、验收清单。
- `template/`：起步工程；**不包含** `audio/`、`out/`、`review/`、`lib/`。

## 不入库

- 成片 `out/*.mp4`、抽帧 `review/*.png`、工程内 `lib/` 运行时副本（由 `scripts/andiao.py new` 生成）。
- 字体走 jsDelivr `@fontsource`，渲染器缓存到 `~/.cache/auto-video/fonts`。

## 更新方式

上游运行时更新后，重新复制上述文件，并跑一遍：

```bash
python scripts/andiao.py new <临时工程>
python scripts/andiao.py check <临时工程>
python scripts/andiao.py stills <临时工程> --times 2,5,8
```

`--check` 0 error、抽帧与样片视觉一致，才算同步完成。
