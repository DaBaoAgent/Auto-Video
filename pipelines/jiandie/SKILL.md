---
name: jiandie
description: 60s 间谍片头（60s Spy Title Sequence）：虚构 1964 年间谍片的片头：追一把被偷的钥匙，几何碎片最后拼成片名。 上游为 lemo-opuscar styles/spy-titles，演示站暂用其样片；入口复现上游 demo。
---

# jiandie：60s 间谍片头（60s Spy Title Sequence）

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游风格 | lemo-opuscar `styles/spy-titles` |
| 上游样片 | 《天鹅绒密码》44.1 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/jiandie/scripts/jiandie.py` |

## 这条管线交什么

虚构 1964 年间谍片的片头：追一把被偷的钥匙，几何碎片最后拼成片名。

上游的一句话：Opening titles for an imaginary 1964 spy film: a chase for a stolen key until the shapes lock into the title.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/jiandie/scripts/jiandie.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/jiandie/scripts/jiandie.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/jiandie/scripts/jiandie.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

In `demo/`: `paper.js` (four inks, cached scissor edges, cut gaps, paper shadow, texture, silhouette layer with joint sl…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《天鹅绒密码》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/spy-titles/STYLE.md`
- 样片怎么做的：`styles/spy-titles/DEMO.md`
