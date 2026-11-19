---
name: recheng
description: 热成像（Thermal Camera）：雪夜里，一台热像仪绕着一栋老居民楼转：漏风的窗、墙里的暖气管、睡在热车盖上的猫，还有一年后改造完的同一栋楼。 上游为 lemo-opuscar styles/thermal-camera，演示站暂用其样片；入口复现上游 demo。
---

# recheng：热成像（Thermal Camera）

| 项 | 值 |
| --- | --- |
| 工位 | 08 地图地理 |
| 上游风格 | lemo-opuscar `styles/thermal-camera` |
| 上游样片 | 《冬夜，一栋楼的体温》49.0 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/recheng/scripts/recheng.py` |

## 这条管线交什么

雪夜里，一台热像仪绕着一栋老居民楼转：漏风的窗、墙里的暖气管、睡在热车盖上的猫，还有一年后改造完的同一栋楼。

上游的一句话：A thermal camera circles an old apartment block on a snowy night: a leaking window, pipes inside the walls, a cat asleep on a warm bonnet, and the same block a year after its retrofit.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/recheng/scripts/recheng.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/recheng/scripts/recheng.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/recheng/scripts/recheng.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

demo/src/thermal.js`: `TM()` (generic thermal material: base, gradient, hot spots, noise, emissivity) and `TMC(body)` (c…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《冬夜，一栋楼的体温》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/thermal-camera/STYLE.md`
- 样片怎么做的：`styles/thermal-camera/DEMO.md`
