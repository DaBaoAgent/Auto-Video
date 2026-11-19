---
name: heiban
description: 黑板粉笔（Chalkboard）：粉笔写下网上的说法，再一擦，把「射」写回三千年前。 上游为 lemo-opuscar styles/chalkboard，演示站暂用其样片；入口复现上游 demo。
---

# heiban：黑板粉笔（Chalkboard）

| 项 | 值 |
| --- | --- |
| 工位 | 02 手绘笔触 |
| 上游风格 | lemo-opuscar `styles/chalkboard` |
| 上游样片 | 《汉字的故事》49.3 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/heiban/scripts/heiban.py` |

## 这条管线交什么

粉笔写下网上的说法，再一擦，把「射」写回三千年前。

上游的一句话：Chalk writes a popular claim about two characters, wipes it, and traces 射 back three thousand years.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/heiban/scripts/heiban.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/heiban/scripts/heiban.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/heiban/scripts/heiban.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

The demo's code is a working engine; copy it into the project folder and write the film yourself.

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《汉字的故事》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/chalkboard/STYLE.md`
- 样片怎么做的：`styles/chalkboard/DEMO.md`
