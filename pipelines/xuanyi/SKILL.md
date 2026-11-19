---
name: xuanyi
description: 悬疑探秘（Suspense Mystery）：冷面伪科学电视：4:3 蓝屏、编号症状、橡皮管贴纸演一遍，最后切到测试卡。 上游为 BB-Video styles/mystery，演示站暂用其样片；入口复现上游 demo。
---

# xuanyi：悬疑探秘（Suspense Mystery）

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游风格 | BB-Video `skills/bb-video/styles/mystery` |
| 上游样片 | 《为什么你的朋友该叫你爸爸》44.4 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/xuanyi/scripts/xuanyi.py` |

## 这条管线交什么

冷面伪科学电视：4:3 蓝屏、编号症状、橡皮管贴纸演一遍，最后切到测试卡。

上游的一句话：A deadpan mock-science TV programme on a blue 4:3 CRT, with numbered symptoms acted out by rubber-hose stickers.

## 入口命令

```bash
# 1. 先看这台机器够不够（BB-Video 的 checkout + node 18+ + ffmpeg）
python pipelines/xuanyi/scripts/xuanyi.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/xuanyi/scripts/xuanyi.py --plan

# 3. 真跑：用上游 new.mjs 建工程，再 render.mjs 出片
python pipelines/xuanyi/scripts/xuanyi.py

# 想少写一点画面，加 --quick（上游快速版）
python pipelines/xuanyi/scripts/xuanyi.py --quick
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- `--out` 指定工程目录，默认 `out/bb-mystery`；
- 上游库位置默认 `D:/@kaifa/BB-Video`，可用 `BB_VIDEO_DIR` 或 `--bb` 覆盖；
- 上游要 Chrome / Edge；渲染器会自己找，也可按上游文档设 `CHROME_PATH`。

## 引擎

BB-Video styles/SVG 画法 · 上游 promo 运行时（Chrome 逐帧）

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 BB-Video `samples` release）；
- 出片与上游《为什么你的朋友该叫你爸爸》同画幅、同帧率，−16 LUFS。

## 已知坑

1. **这条线是登记 + 上游复现**：画法、镜头和声音都在 BB-Video，本仓库没有搬运行时代码。
2. **样片是借的**：站点现在放的是 BB-Video 的 1080p 成片外链，不是本仓库渲的；真封装后换成本地 `projects/` 出片。
3. **上游样片的手写画面不可 --quick 复刻**：快速版只保证同一套风格材质，分幕和美术是简版。
4. **字体现取**：上游页面从 jsDelivr 拉 @fontsource，首次渲染要联网。

## 上游文档

- 风格不变量：`skills/bb-video/styles/mystery/STYLE.md`
- 工作流：`skills/bb-video/promo/GUIDE.md`（本管线走 promo）
- 风格表与适用题材：`skills/bb-video/SKILL.md`
