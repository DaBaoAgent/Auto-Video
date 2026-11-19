# CREDITS · labi 蜡笔儿童绘本

画面全部由本仓库代码绘制（`gl.js` / `crayon.js` / `rig.js` / `chars.js` / `world.js` / `film.js` / `end.js`）：
没有生成图，没有第三方图片或模型，没有搬运原片。纸、蜡笔、水彩、人物、手写字都是算出来的。

## 字体（SIL Open Font License 1.1）

| 字体 | 作者 / 来源 | 用途 |
|---|---|---|
| **Patrick Hand** | Patrick W. G.（google/fonts `ofl/patrickhand`） | 字幕：书页上印的那句话（50–56 px，蜡笔墨色） |
| **Gaegu** | Kwon MiYoung（google/fonts `ofl/gaegu`） | 标题与结尾字，逐字写；常规 + Bold 两个字重 |
| **Short Stack** | Amanda Szabela（`ofl/shortstack`） | 小注记、道具上的字 |
| **Gochi Hand** | Anja Lengenfelder（`ofl/gochihand`） | 数数、天上的数字这类儿童笔迹 |
| **Caveat Brush** | Impallari Type（`ofl/caveatbrush`） | 毛刷感的短标注 |
| **Sniglet** | Haley Fiege（`ofl/sniglet`） | 圆胖的强调字（标签、书名） |

字体不进仓库：地址与 SHA256 记在 `assets/fonts/fonts.json`（含 jsdelivr 备用源），
`python tools/sync_fonts.py --fetch` 下载，`--pipeline labi` 复制到工程目录。许可原文随字体放在 `fonts/*_OFL.txt`。

## 技法

蜡笔绘本的画法与工程实现迁自 [开源风格库](https://github.com/公开样片库/开源风格库) 的 `styles/crayon-book`：

- 纸：三倍频值噪声 + 纤维项的齿，锚在页面上随镜头走，最后一过浮雕。
- 蜡：每层画布 RGB = 色、A = 压力；齿 > 1 − 1.22·压力 才上蜡，轻压挂齿尖、重压近乎实心。
- 水彩：独立密度画布 multiply，边缘积色、齿坑颗粒、被蜡抗拒（密度 × (1 − 0.93·蜡覆盖)）。
- 遮挡：前件擦掉后面、角色身后保住纸白；儿童透视与儿童比例。

风格的不变量完整写进 `pipeline.json` 的 `spec`，改动前先读它。

## 音频

本管线**不迁**上游的配乐（`music/score.py`，3/4 72 BPM 音乐盒 + 玩具钢琴 + 竖笛）与拟音（`mix.py`）。
需要声音时用项目自带的 `voice/voice.wav` 走 `mux`，−14 LUFS 定版。
乐器与拟音的声音调性写在 `pipeline.json` 的 `spec.audio`，可以照着做自己的配乐。
