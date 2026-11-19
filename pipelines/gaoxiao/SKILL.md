---
name: gaoxiao
description: 搞笑历史卡通（Comic History Cartoon）：阿尔萨斯-洛林在 1871 到 1945 年间四次换主人：每次都有人撕下那块纸、贴上新的，住在上面的她一步没挪。 上游为 lemo-opuscar styles/comic-history，演示站暂用其样片；入口复现上游 demo。
---

# gaoxiao：搞笑历史卡通（Comic History Cartoon）

| 项 | 值 |
| --- | --- |
| 工位 | 04 卡通动画 |
| 上游风格 | lemo-opuscar `styles/comic-history` |
| 上游样片 | 《一块纸》51.0 s |
| 画幅 | 16:9 |
| 入口 | `pipelines/gaoxiao/scripts/gaoxiao.py` |

## 这条管线交什么

阿尔萨斯-洛林在 1871 到 1945 年间四次换主人：每次都有人撕下那块纸、贴上新的，住在上面的她一步没挪。

上游的一句话：Alsace-Lorraine changed hands four times between 1871 and 1945: each time someone tore off the paper and pasted a new piece, and the woman living on it never moved.

## 入口命令

```bash
# 1. 先看这台机器够不够（上游 demo 要 sh + lemo 的 .venv + node + ffmpeg）
python pipelines/gaoxiao/scripts/gaoxiao.py --check

# 2. 只看要跑哪些步骤，不执行
python pipelines/gaoxiao/scripts/gaoxiao.py --plan

# 3. 真跑：复现上游 demo 成片（Windows 上走 WSL）
python pipelines/gaoxiao/scripts/gaoxiao.py
```

## 参数

- `--check` 只体检不出片；
- `--plan` 打印步骤；
- 不给参数就是复现上游样片；
- 库位置默认 `D:/@kaifa/lemo-opuscar`，可用 `LEMO_LIB` 或同名环境变量覆盖；
- 渲染器按仓库约定读 `PLAYWRIGHT_CORE`，默认指向 `piying/node_modules/playwright-core`。

## 引擎

The part sheets come from an image generator, one set per film, and the user provides it**: their Codex CLI through `cor…

## 验收

- `python tools/validate.py` 通过（catalog / pipeline.json / SKILL.md 三方一致）；
- 站点卡片能播样片（样片取自 `lemomo-ai/lemo-opuscar-films`）；
- 出片与上游《一块纸》同画幅、同帧率，−14 LUFS。

## 已知坑

1. **上游 demo 只认 Linux 的 `.venv/bin/python`**：Windows 原生跑不了，要走 WSL；`--check` 会直接说缺什么，不会假装跑过。
2. **字体不随仓库走**：上游 `demo/tools/fonts.sh` 现取现子集，首次跑要联网。
3. **样片是借的**：现在站点用的是上游 720p 网络版，不是本仓库渲的；等真封装时换成本地 `projects/<编号>/out/*.mp4`。
4. 上游的配乐与拟音依赖 lemo 的 Python 音频栈，本仓库没有等价实现，暂不接管声音。

## 上游文档

- 风格不变量：`styles/comic-history/STYLE.md`
- 样片怎么做的：`styles/comic-history/DEMO.md`
