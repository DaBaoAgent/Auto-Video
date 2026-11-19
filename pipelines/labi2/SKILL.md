---
name: labi2
description: 蜡笔立体世界（Crayon World 3D）：第一人称飞过蜡笔画的村子，落在老人花园里的一朵花上；最后换成他的眼睛，和他说的一句话。 上游为 lemo-opuscar styles/crayon-world，演示站暂用其样片；入口复现上游 demo。
---

# labi2：蜡笔立体世界（Crayon World 3D）

| 项 | 值 |
| --- | --- |
| 工位 | 07 三维推演 |
| 上游风格 | lemo-opuscar `styles/crayon-world` |
| 上游样片 | 《蝴蝶》64.5 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/labi2/scripts/labi2.py` |

## 这条管线交什么

第一人称飞过蜡笔画的村子，落在老人花园里的一朵花上；最后换成他的眼睛，和他说的一句话。

上游的一句话：A first-person flight over a crayon village to one flower in an old man's garden; then his eyes, and what he says.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/labi2/scripts/labi2.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/labi2/scripts/labi2.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/labi2/scripts/labi2.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

In `demo/engine/`: `npr.js` (`region(o)` a drawing recipe, `mesh(geo, reg)` a 3D mesh drawn with it, `makeNPR()`, `snap(…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《蝴蝶》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/crayon-world/STYLE.md`
- 样片怎么做的：`styles/crayon-world/DEMO.md`
