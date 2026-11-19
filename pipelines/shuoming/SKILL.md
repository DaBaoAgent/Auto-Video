---
name: shuoming
description: 说明书插画（Instruction Manual Art）：两个从没装过家具的新手照说明书装婴儿床，十步排在同一张 45° 说明书上；第十步，说明书里没有。 上游为 lemo-opuscar styles/instruction-manual，演示站暂用其样片；入口复现上游 demo。
---

# shuoming：说明书插画（Instruction Manual Art）

| 项 | 值 |
| --- | --- |
| 工位 | 09 图纸说明 |
| 上游风格 | lemo-opuscar `styles/instruction-manual` |
| 上游样片 | 《第十步》50.6 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/shuoming/scripts/shuoming.py` |

## 这条管线交什么

两个从没装过家具的新手照说明书装婴儿床，十步排在同一张 45° 说明书上；第十步，说明书里没有。

上游的一句话：Two first-timers build a crib from a flat-pack manual, ten steps on one 45° page; step ten was never in the manual.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/shuoming/scripts/shuoming.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/shuoming/scripts/shuoming.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/shuoming/scripts/shuoming.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

demo/iso.js`: `makeView` (orthographic 45°, depth sort, `flush(g)`), `box` and `cyl` (both take `o.xf`, a rigid transfor…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《第十步》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/instruction-manual/STYLE.md`
- 样片怎么做的：`styles/instruction-manual/DEMO.md`
