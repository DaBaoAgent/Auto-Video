---
name: fabu
description: 暗色科技发布（Dark Tech Keynote）：虚构 app Tidy 的发布片：被埋掉的光标一键把几百个窗口归位。 上游为 lemo-opuscar styles/dark-keynote，演示站暂用其样片；入口复现上游 demo。
---

# fabu：暗色科技发布（Dark Tech Keynote）

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游风格 | lemo-opuscar `styles/dark-keynote` |
| 上游样片 | 《思考的空间》42.0 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/fabu/scripts/fabu.py` |

## 这条管线交什么

虚构 app Tidy 的发布片：被埋掉的光标一键把几百个窗口归位。

上游的一句话：Launch film for Tidy, a fictional app: one buried cursor snaps hundreds of windows back into place.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/fabu/scripts/fabu.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/fabu/scripts/fabu.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/fabu/scripts/fabu.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

demo/engine.js` (Canvas 2D ES module): `setAccent`, `bg`, `grid`, `panel`, `litShape` (any shape in this style), `trail`…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《思考的空间》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/dark-keynote/STYLE.md`
- 样片怎么做的：`styles/dark-keynote/DEMO.md`
