---
name: fugu
description: 复古版画拼贴（Vintage Engraving Collage）：1918 年一整版印反了的航空邮票：24 美元买下、剪开散落，66 号至今下落不明。 上游为 lemo-opuscar styles/vintage-collage，演示站暂用其样片；入口复现上游 demo。
---

# fugu：复古版画拼贴（Vintage Engraving Collage）

| 项 | 值 |
| --- | --- |
| 工位 | 05 平面图形 |
| 上游风格 | lemo-opuscar `styles/vintage-collage` |
| 上游样片 | 《倒置的珍妮》52.0 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/fugu/scripts/fugu.py` |

## 这条管线交什么

1918 年一整版印反了的航空邮票：24 美元买下、剪开散落，66 号至今下落不明。

上游的一句话：A 1918 airmail sheet printed with its plane upside down: bought for $24, cut up and scattered, and number 66 is still missing.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/fugu/scripts/fugu.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/fugu/scripts/fugu.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/fugu/scripts/fugu.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

Python (numpy, scipy, Pillow) bakes the parts into `parts/*.png` and `parts/manifest.json`: paper and torn papers (`demo…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《倒置的珍妮》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/vintage-collage/STYLE.md`
- 样片怎么做的：`styles/vintage-collage/DEMO.md`
