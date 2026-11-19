# CREDITS · weisuo 孟菲斯微缩

画面全部由本仓库代码绘制：没有生成图，没有第三方图片或模型，没有搬运原片。

## 字体（SIL Open Font License 1.1）

three.js（MIT）随工程 lib/ 入库

字体不进仓库：地址与 SHA256 记在 `assets/fonts/fonts.json`，
`python tools/sync_fonts.py --fetch` 下载，`--pipeline weisuo` 复制到工程目录。许可原文在 `fonts/OFL-*.txt`。

## 技法

Memphis Diorama（孟菲斯微缩）的画法与工程实现迁自
[开源风格库](https://github.com/公开样片库/开源风格库) 的 `styles/memphis-diorama`。
不变量完整写进 `pipeline.json` 的 `spec`，改动前先读它。

## 音频

本管线不迁上游的配乐与拟音引擎。需要声音时用项目自带的 `voice/voice.wav` 走 `mux`，−14 LUFS 定版。
