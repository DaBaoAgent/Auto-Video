---
name: xiula
description: 修拉点彩（Seurat Pointillism）：21 色纯色板按比例并置，补色点等大；画面结晶成圆点，点自己在呼吸。 画法来自 huashu-art-motion v1.3.1 的 29_seurat，引擎已 vendored 进 vendor/huashu-art-motion/，单条命令出风格段。
---

# xiula：修拉点彩（Seurat Pointillism）

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 上游 | huashu-art-motion v1.3.1 · `references/风格配方/29_seurat.md` |
| 场景 | `vendor/huashu-art-motion/engine/scenes/29_seurat.js` |
| 上游质量 | ★★ |
| 画幅 | 16:9 · 24 fps |
| 入口 | `pipelines/xiula/scripts/xiula.py` |

## 这条管线交什么

21 色纯色板按比例并置，补色点等大；画面结晶成圆点，点自己在呼吸。

这是一条**单风格渲染线**，交付的是风格段 / 风格短片：默认不配旁白，音乐可以后接 `vendor/huashu-art-motion/engine` 的配乐模板或 Auto-Video 的配音链。画法边界、母题动法与短板见 [`references/style.md`](references/style.md)，那是上游配方卡的原文。

## 入口命令

```bash
# 抽两帧看画（不装 playwright 时用 uv 带一次）
uv run --with playwright python pipelines/xiula/scripts/xiula.py --stills 0.5,2.5 --out review/xiula

# 出 6 秒风格段
uv run --with playwright python pipelines/xiula/scripts/xiula.py --out out/xiula_试片.mp4 --seconds 6
```

## 写法要点

- **先读 `references/style.md`**：配方卡写的是这套画法的笔触、色光、空间和母题动法，不要只照搬样片里那间屋子。
- **画面是代码画的**：`scenes/29_seurat.js` 里没有外部图片；换题材要重新构图，别把上游的「少女＋猫＋桌子」搬过去。
- **时间轴按秒算**：`--seconds` 出的是风格段长度；镜头内动作仍按引擎的节拍走，不额外补转场。
- **画法已在成片里验证过；换题材时按配方卡重新构图。**

## 许可

引擎代码 MIT（`vendor/huashu-art-motion/LICENSE`）；上游的角色帧、总览图和示范视频里的花叔形象不随 MIT 授权，本仓库未收录。配方卡随上游 MIT 收录，见 [CREDITS.md](CREDITS.md) 与 [MIGRATION.md](MIGRATION.md)。
