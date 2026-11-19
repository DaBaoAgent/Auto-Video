---
name: houshi
description: 后室录像带（Liminal Found Footage）：新夜班员工拍下入职第一晚：无尽的黄色办公空间，和墙上的员工守则。 上游为 lemo-opuscar styles/backrooms，演示站暂用其样片；入口复现上游 demo。
---

# houshi：后室录像带（Liminal Found Footage）

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游风格 | lemo-opuscar `styles/backrooms` |
| 上游样片 | 《夜班入职培训》59.7 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/houshi/scripts/houshi.py` |

## 这条管线交什么

新夜班员工拍下入职第一晚：无尽的黄色办公空间，和墙上的员工守则。

上游的一句话：A new night-shift hire films their first night in an endless yellow office, following the rules on the wall.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/houshi/scripts/houshi.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/houshi/scripts/houshi.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/houshi/scripts/houshi.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

demo/world.js` (layout, light DataTexture, custom lighting and fog shaders, props), `demo/tex.js` (procedural wallpaper,…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《夜班入职培训》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/backrooms/STYLE.md`
- 样片怎么做的：`styles/backrooms/DEMO.md`
