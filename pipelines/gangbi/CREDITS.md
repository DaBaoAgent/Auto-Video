# CREDITS · gangbi 钢笔淡彩

画面全部由本仓库代码绘制（`engine.js` / `world.js` / `poses.js` / `film.js`）：
没有生成图，没有第三方图片或模型，没有搬运原片。纸纹、墨线、水彩、人物、手写字都是算出来的。

## 字体（SIL Open Font License 1.1）

- **Caveat** — Impallari Type（https://github.com/impallari/Caveat）
  用于标题、字幕、页尾手写；可变字重 400–700。
- **Reenie Beanie** — James Grieshaber（https://github.com/google/fonts/tree/main/ofl/reeniebeanie）
  用于页边的手写注记（日期 / 时间 / 天气 / 地点）。

两份字体都不进仓库：地址与 SHA256 记在 `assets/fonts/fonts.json`，
`python tools/sync_fonts.py --fetch` 按记录下载，再复制到工程目录。许可原文随字体放在 `fonts/OFL-*.txt`。

## 技法

钢笔淡彩（Urban Sketch · Pen & Wash）的画法与工程实现迁自
[开源风格库](https://github.com/公开样片库/开源风格库) 的 `styles/urban-sketch`：

- 墨：一根近乎等粗的深褐细线，抖 1 px、转角冲出去 3–8 px、长笔画留断口；笔顺按像素烘焙，后处理回放。
- 洗：2–3 层透明水彩 multiply，与线错位 1–3 px，边缘干得深，颜料沉进纸齿。
- 颜色到达场：每个像素一个到达时间，湿边前沿带暗带，人物从一点绽放。
- 页边：噪声边界 + 内白点带 + 外色点喷洒，永不画满整纸。

风格的不变量完整抄录在 `pipeline.json` 的 `spec`，改动前先读它。

## 音频

本管线**不迁**上游的配乐与拟音引擎（`audio/score.py`、`audio/foley.py`，依赖 CC0 采样库）。
需要声音时用项目自带的 `voice/voice.wav` 走 `mux`，−14 LUFS 定版。
上游采样许可（仅供追溯）：VSCO 2 CE、VCSL（Sam Gossner，CC0 1.0）、Karoryfer「Sneakybass」。
