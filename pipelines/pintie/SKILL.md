---
name: pintie
description: | --- | --- |
---

# pintie：拼贴剪贴（Collage Cutout）

| 项 | 值 |
| --- | --- |
| 工位 | 平面动效 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按拼贴剪贴的特征重写） |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/pintie.py` |

## 这条管线交什么

报纸底上贴半调网点人像，白剪边、关节纸片、12 fps 定格，脑袋开盖露出深空。

自包含的单风格渲染线：运行时、舞台、画法脚本、入口全在 `pipelines/pintie/runtime/` 里，仓库外不留依赖。

## 入口命令

```bash
python pipelines/pintie/scripts/pintie.py --stills 0.5,2.5 --out review/pintie
python pipelines/pintie/scripts/pintie.py --out out/pintie_试片.mp4 --seconds 8
```

## 写法要点

- 先读 `references/style.md`：那份卡写的是这套拼贴剪贴的规矩，`runtime/scene.js` 是它的实现。
- 画面是代码画的：不加载外部图片、不引用外部库。
- 换题材时保留工序：先贴住人像，再由头盖开合把里面的花、鸟、手、火箭放出来。。

## 自研边界

- 自研：`runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/pintie.py`。
- 只参考：mg-styles-15（MIT）对这种风格的公开描述与工序；未复制其源码或素材。
