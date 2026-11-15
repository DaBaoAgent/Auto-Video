# 交付：一支片子怎么算做完

## 交付物（只这四样进 `out/` 与工程根）

| 文件 | 规格 | 说明 |
|---|---|---|
| `out/<slug>.mp4` | 1920×1080 / 30 fps / h264 crf 18 + aac 192k 48 kHz 立体声 / −14 LUFS / TP ≤ −1.5 | 成片，`mux` 出 |
| `out/<slug>.srt` | UTF-8，19 条（按片子），时间与 `cues.json` 完全一致 | 外挂字幕，`srt` 出 |
| `poster.jpg` | 1920×1080，无烧录字幕，`-q:v 2` | 封面，`poster` 出 |
| `out/mix.wav`（+3 条 stem） | 44.1 kHz float，58.0 s | 声音母版，`sound` 出 |

工程根**只放这四样**（成片、srt、封面、母版）。`stills/`、`out/cues_ref.json`、临时对照帧、测试视频一律算中间产物，交付前删掉——这是用户明确要求的口径（交付目录根只放最终交付物）。

## 自检清单（`python scripts/lvdong.py check <project>` 全绿再交付）

1. **时长**：58.000 s（±1 帧）。`DUR`、`voice_seconds`、段表最后一段三者要自洽。
2. **响度**：−14.0 ~ −14.2 LUFS，TP ≥ −1.5。偏离 0.6 以上回来查 loudnorm 两遍的 measured 值。
3. **字幕**：
   - 条数与 `cues.json` 一致，首行 0.00，末行结束在段末（58 s 片子是 50.30–53.81）；
   - 最挤一行 ≤ 8 字/秒（这支片子 7.4）；
   - 短于 1.2 s 的行数 = 0；
   - 断行不许断在数字中间、不许以「的/了/是/就」开头（`make_cues.py` 已经守住，改 WANT/HARD 后要再跑一遍看打印）。
4. **抽帧复核**：`stills` 抽 8–10 个关键时刻（开场 0、每个段界、冻结 53.5、末帧 57.9），逐帧确认：脚下有地、人没出画、剪影没并团、字幕不在日轮里、碑上孔透着光。
5. **画面字**：`17′28″` 这类大字只在它该出现的那 2 秒出现，且读得完（`readcheck` 口径：字数 ÷ 停留 ≥ 2 s）。
6. **音频听审**：四条 stem 各听一遍；人声不能被音乐盖住（300 Hz–4 kHz 留给它），静默段确实只剩水与风。

## 命名与目录

```text
projects/<编号>_<题目>/
├── project.json       参数（含 lib 路径、段落数、section_end、drop 清单）
├── script.txt         口播稿的这几段（原文，含配音没说出口的那句）
├── treatment.md       结构方案（三段候选 + 选定理由 + 拍点表）
├── score.json         谱
├── cues.json          字幕（可交付的参照数据）
├── index.html         cast.js / film.js 的入口
├── cast.js            演员表
├── film.js            时间轴
├── voice/             旁白（wav 不入库）+ words_full.json（转写，供复现字幕）
├── stills/            工作用抽查帧（不入库）
└── out/               成片/母版/字幕（不入库）
```

## 不入库的东西

- `voice/*.wav`（原配音 26 MB 起）、`out/*`（成片、母版、stem）、`stills/*`、`poster.jpg`、`assets/fonts/*`（字体 17.9 MB）。
- 进库的是：所有 `.json`、`.js`、`.html`、`.txt`、`.md`，以及 `voice/words_full.json`（116 KB，让你不跑 whisper 也能复现一样的字幕）。
