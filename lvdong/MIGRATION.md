# 迁移账：从 `films/004_maya_part1` 到 `lvdong`

## 来源

这一支片子的全部工作发生在 lemo-opuscar 库的 `films/004_maya_part1/`（该目录被库的 gitignore 排除）。管线是把它拆开重排的结果。

| 源文件（`films/004_maya_part1/`） | 去向 | 做了什么 |
|---|---|---|
| `tools/transcribe.py` | `scripts/transcribe.py` | 参数化：wav / out / `--model` / `--prompt` / `--hot`；固定 `initial_prompt` 拿掉；打印尾巴便于查幻觉 |
| `tools/transcribe2.py` | 弃用 | `large-v3-turbo` 在长句中文上重复幻觉，段落全错；文档写进坑表，不再提供 |
| `tools/align.py`（4.3 KB） | `scripts/align.py` | 去掉玛雅硬编码（段落数 3、limit 56.0、漏句字符串）；`drop` 改成参数并**顺手把前面的逗号改成句号**；`--limit` 默认 `duration-1`；匹配率 WARNING 阈值 75% |
| `tools/make_cues.py`（3.7 KB） | `scripts/make_cues.py` | `--end/--want/--hard/--min-hold/--tail/--labels` 全部参数化；玛雅那套数值变成默认 |
| `tools/mix.py`（13.2 KB，330 行） | `scripts/sound.py` + `projects/*/score.json` | **最大的一处重构**：乐器与混音留在代码里，谱（和弦/bass/shaker/clap/melody/burst/hits/foley/silence/bed/电平）全部外置成 JSON；玛雅的谱原样搬成 `score.json` |
| `film.js`（24 KB） | `template/film.js`（骨架 + `projects/004_玛雅巨人文明/film.js`（实例） | 骨架留缓动/相机/`both`/`solo`/SEC/`type`/`render` 的接线；实例原样入库当参考实现 |
| `cast.js`（18.7 KB） | `template/cast.js` + 实例的 `cast.js` | 原样入库：人、巨人、帽子、碑、石仓库、金字塔、草棚、手、工具 |
| `index.html` | `template/index.html` + 实例的 `index.html` | 把 `/films/004_maya_part1/...` 的绝对路径改成**相对** `fonts/ cast.js film.js`，`sky.js` 仍用库内绝对路径；`stage` 负责把工程搬进 `$LIB/films/<slug>/` |
| `build.sh` | 弃用 | 它靠 bash 串五步；这条管线改由 `lvdong.py`（两遍 loudnorm 用 ffmpeg 直接调），Windows 上不需要 bash |
| `TREATMENT.md` | `projects/004_玛雅巨人文明/treatment.md` | 原样入库（成片实况 15 镜/12 段/90 BPM/58.0 s 的修订版） |
| `out/cues.json` | `projects/004_玛雅巨人文明/cues.json` | 19 条字幕，入库当参照数据 |
| `out/{mix,stem_*}.wav`、`out/*.mp4`、`poster.jpg`、`stills/`、`fonts/` | 不入库 | 见下 |

## 固化了什么

1. **先声音后画面**：转写 → 对齐（含漏句 `drop`）→ 切行，三步都在 `film.js` 之前钉死。
2. **谱是数据**：音乐与 foley 不进代码，进 `score.json`；改一支片子的声音只改 JSON。
3. **拍点是一等公民**：90 BPM、`B = 2/3`、段界取拍界；`beats` 子命令随时打表。
4. **工程自带演员表与时间轴**：`template/` 是可跑的骨架，不是空文档。
5. **不用 bash、不依赖自我复制引擎**：渲染走 `$LVDONG_LIB`，混流走 ffmpeg。

## 入库内容

```
lvdong/{SKILL.md,README.md,MIGRATION.md,CREDITS.md,pipeline.json}
lvdong/scripts/{lvdong,transcribe,align,make_cues,sound}.py
lvdong/template/{index.html,cast.js,film.js}
lvdong/references/{style,score,pitfalls,delivery}.md
lvdong/projects/004_玛雅巨人文明/{project.json,script.txt,score.json,cues.json,treatment.md,index.html,cast.js,film.js}
lvdong/projects/004_玛雅巨人文明/voice/words_full.json     # 116 KB，为复现字幕留下的转写
```

## 不入库

| 路径 | 大小 | 原因 |
|---|---|---|
| `projects/*/voice/*.wav` | 26 MB 起 | 原配音，能重新拿到 |
| `projects/*/out/` | 70–120 MB/片 | 成片、母版、stem，可重新生成 |
| `projects/*/stills/` | 每帧 200 KB | 抽查帧 |
| `projects/*/poster.jpg` | 360 KB | 从成片抽帧即可重出 |
| `assets/fonts/*.ttf` | 17.9 MB | OFL 字体，不分发（README 写了怎么放） |

## 依赖与版本

| 依赖 | 版本 | 说明 |
|---|---|---|
| lemo-opuscar | 2026-11 的 `main` | `core/render/{still,video}.mjs`、`styles/silhouette-rhythm/demo/sky.js` |
| node | v22.23.2 | 渲染器 |
| python | 3.11+（实测库 venv） | numpy 2.x / scipy 1.x / soundfile 0.12 |
| faster-whisper | 库 venv 内 | `small` int8 CPU |
| ffmpeg / ffprobe | 8.1.1 | 混流、loudnorm、封面 |

## 已知取舍

1. **`sound.py` 是重构不是搬运**：乐器函数逐行照抄，谱面外置。实测结果：voice stem 与旧版**逐采样相同**；music 与 foley 因为噪声类音色的随机实现顺序不同而波形不同（相关性 0.46 / 0.20，各频段能量差 <5%）；整条 mix 的峰值 0.709 = 旧版 0.709，RMS 高 1.4 dB（旧值 −20.19，新值 −18.78 dB），原因是最响的那个采样（6.85 s 的 splash）换了一批噪声，归一化系数随之变了。mux 之后两支片子都落 −14 LUFS，所以交付口径一致。
2. **字幕复现是逐字节相同的**：`align.py` + `make_cues.py` 在 `projects/004_玛雅巨人文明` 上重跑，段落边界（0–17.78 / 17.78–25.38 / 25.38–53.36）与 19 条 `cues.json` 与交付版**完全一致**。
3. **字体不入库**：17.9 MB 的 Noto Sans SC 会把仓库撑大；改成 `assets/fonts/` + 文档说明。
4. **引擎不复制**：不把 `core/`、`styles/` 抄进 Auto-Video。好处是永远跟库一致，代价是换机器要装库。
5. **`build.sh` 被弃用**：Windows 上 `sh`/`bash` 直调会 MISS，靠 bash 串的脚本不可靠；改为 python 编排。
6. **12 段 / 15 镜的段表没有抽成数据**：段表是导演决定，留在 `film.js` 里（每段一个 `shot*` 函数）；只有拍长、画幅、调色、字幕版式这些"不会因题材而变"的东西进了 `pipeline.json`。
