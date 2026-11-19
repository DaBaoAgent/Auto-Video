---
name: andiao
description: 暗调励志（Dark Motivational）：几乎全黑的房间只留一盏动机光，方形头小人用眉眼演完熬夜、拖延与那个决定。 上游为 BB-Video styles/lumen，演示站暂用其样片；入口复现上游 demo。
---

# andiao：暗调励志（Dark Motivational）

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游风格 | BB-Video `skills/bb-video/styles/lumen` |
| 上游样片 | 《再刷五分钟 · 报复性熬夜》165.3 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/andiao/scripts/andiao.py` |

## 这条管线交什么

几乎全黑的房间只留一盏动机光，方形头小人用眉眼演完熬夜、拖延与那个决定。

上游的一句话：A nearly black room lit by one motivated light, with one character acting the whole story through eyes and brows.

## 入口命令

```bash
# 1. 先看这台机器够不够（BB-Video 的 checkout + node 18+ + ffmpeg）
python pipelines/andiao/scripts/andiao.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/andiao/scripts/andiao.py --plan

# 3. 真跑：用上游 new.mjs 建工程，再 render.mjs 出片
python pipelines/andiao/scripts/andiao.py

# 想少写一点画面，加 --quick（上游快速版）
python pipelines/andiao/scripts/andiao.py --quick
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- `--out` 指定工程目录，默认 `out/bb-lumen`；
- 上游库位置默认 `D:/@kaifa/BB-Video`，可用 `BB_VIDEO_DIR` 或 `--bb` 覆盖；
- 上游要 Chrome / Edge；渲染器会自己找，也可按上游文档设 `CHROME_PATH`。

## 引擎

BB-Video 上游 promo 运行时（Chrome 逐帧）

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 BB-Video `samples` release）；
- 出片与上游《再刷五分钟 · 报复性熬夜》同画幅、同帧率，−16 LUFS。

## 已知坑

1. **这条线是登记 + 上游复现**：画法、镜头和声音都在 BB-Video，本仓库没有搬运行时代码。
2. **样片是借的**：站点现在放的是 BB-Video 的 1080p 成片外链，不是本仓库渲的；真封装后换成本地 `projects/` 出片。
3. **上游样片的手写画面不可 --quick 复刻**：快速版只保证同一套风格材质，分幕和美术是简版。
4. **字体现取**：上游页面从 jsDelivr 拉 @fontsource，首次渲染要联网。

## 上游文档

- 风格不变量：`skills/bb-video/styles/lumen/STYLE.md`
- 工作流：`skills/bb-video/promo/GUIDE.md`（本管线走 promo）
- 风格表与适用题材：`skills/bb-video/SKILL.md`
