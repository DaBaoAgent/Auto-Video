# qianhuang · 许可与致谢

## 画面

全部由本仓库代码画出（`engine.js` / `world.js` / `poses.js` / `film.js`）：钢笔线、浓彩平涂、色片灯、
人物骨架与手写字，没有生成式图像、没有第三方素材、没有实拍片段。

## 声音

`voice/make_sfx.py` 用 Python 标准库（`wave` + `struct` + `math`）从零合成：刀锋（whoosh / shing / thud）、
转场 splice、落字 tick / brush、开场 boom、sandstep 脚步、47.5/95 Hz 底噪。没有采样素材，因此没有第三方音频许可问题。

配音另录，不入库（`voice/*.wav` 被 `.gitignore` 忽略）。

## 字体（SIL Open Font License 1.1）

| 字体 | 作者 | 用在 |
|---|---|---|
| MaShanZheng 马善政毛笔楷书 | Ma Shan Zheng | 片名「血之海滩」 |
| LongCang 龙藏 | — | 字幕 |
| Caveat | Impallari Type | 页边手写注记（`mario bava` / `35mm` / `grazie` / `BAY OF BLOOD`） |
| Reenie Beanie | James Grieshaber | 年份与角落小注 |

许可证原文随工程放在 `projects/001_bayofblood/fonts/`（`OFL-Caveat.txt`、`OFL-ReenieBeanie.txt`）。
字体本体不进仓库，由 `tools/sync_fonts.py --fetch` 取。

## 风格依据

用光方法参考：Mario Bava《Black Sunday》(1960) 的明暗法与多侧光（BFI 语：「beautifully composed chiaroscuro」、
「employment of multiple side lights」）、同片用父亲改制的可绕轴自转摄影机完成的 180° 自转，
《Blood and Black Lace》(1964) 的侧向横移与「灯池与墨黑之间出入」的人物调度；
Dario Argento《Suspiria》以三原色＋补色污染制造病态感的做法。
