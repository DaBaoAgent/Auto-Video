---
name: yetai
description: | --- | --- |
---

# yetai：液态流动（Liquid Motion）

| 项 | 值 |
| --- | --- |
| 工位 | 平面动效 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按液态流动的特征重写） |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/yetai.py` |

## 这条管线交什么

糖浆色的液体滴落、拉丝、融合，一泼漫过屏幕，最后聚成字标。

自包含的单风格渲染线：运行时、舞台、画法脚本、入口全在 `pipelines/yetai/runtime/` 里，仓库外不留依赖。

## 入口命令

```bash
python pipelines/yetai/scripts/yetai.py --stills 0.5,2.5 --out review/yetai
python pipelines/yetai/scripts/yetai.py --out out/yetai_试片.mp4 --seconds 8
```

## 写法要点

- 先读 `references/style.md`：那份卡写的是这套液态流动的规矩，`runtime/scene.js` 是它的实现。
- 画面是代码画的：不加载外部图片、不引用外部库。
- 换题材时保留工序：波浪前沿带 3～5 个错相位凸起，从一侧漫过整幅。。

## 自研边界

- 自研：`runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/yetai.py`。
- 只参考：mg-styles-15（MIT）对这种风格的公开描述与工序；未复制其源码或素材。
