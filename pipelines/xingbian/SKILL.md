---
name: xingbian
description: | --- | --- |
---

# xingbian：形变动画（Shape Morph）

| 项 | 值 |
| --- | --- |
| 工位 | 平面动效 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按形变动画的特征重写） |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/xingbian.py` |

## 这条管线交什么

一个轮廓连续变成下一个：圆、太阳、星、心、水滴、纸飞机、方标。

自包含的单风格渲染线：运行时、舞台、画法脚本、入口全在 `pipelines/xingbian/runtime/` 里，仓库外不留依赖。

## 入口命令

```bash
python pipelines/xingbian/scripts/xingbian.py --stills 0.5,2.5 --out review/xingbian
python pipelines/xingbian/scripts/xingbian.py --out out/xingbian_试片.mp4 --seconds 8
```

## 写法要点

- 先读 `references/style.md`：那份卡写的是这套形变动画的规矩，`runtime/scene.js` 是它的实现。
- 画面是代码画的：不加载外部图片、不引用外部库。
- 换题材时保留工序：每段先停 0.3s 让人认清形，再用 0.7s 变过去，色块在 0.24s 硬边擦入。。

## 自研边界

- 自研：`runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/xingbian.py`。
- 只参考：mg-styles-15（MIT）对这种风格的公开描述与工序；未复制其源码或素材。
