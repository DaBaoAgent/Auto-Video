---
name: huazi
description: | --- | --- |
---

# huazi：综艺花字（Variety Show Captions）

| 项 | 值 |
| --- | --- |
| 工位 | 屏幕包装 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按综艺花字的特征重写） |
| 画幅 | 9:16 · 24 fps |
| 入口 | `scripts/huazi.py` |

## 这条管线交什么

竖屏宵夜：台灯下的面碗与热气，上面压多层描边胖体花字、弹性 pop 与认证章。

自包含的单风格渲染线：运行时、舞台、画法脚本、入口全在 `pipelines/huazi/runtime/` 里，仓库外不留依赖。

## 入口命令

```bash
python pipelines/huazi/scripts/huazi.py --stills 0.5,2.5 --out review/huazi
python pipelines/huazi/scripts/huazi.py --out out/huazi_试片.mp4 --seconds 8
```

## 写法要点

- 先读 `references/style.md`：那份卡写的是这套综艺花字的规矩，`runtime/scene.js` 是它的实现。
- 画面是代码画的：不加载外部图片、不引用外部库。
- 换题材时保留工序：1080×1920 竖屏，字压在安全区内，顶部留集数编号。。

## 自研边界

- 自研：`runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/huazi.py`。
- 只参考：mg-styles-15（MIT）对这种风格的公开描述与工序；未复制其源码或素材。
