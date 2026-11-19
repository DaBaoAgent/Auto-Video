# 许可与来源

## 本管线代码

`lvdong/scripts/` 下五个脚本（`lvdong.py` / `transcribe.py` / `align.py` / `make_cues.py` / `sound.py`）、`template/` 与 `projects/004_玛雅巨人文明/` 下的 `film.js` / `cast.js` 为本项目原创，随仓库以 MIT 发布（见根目录 `LICENSE`）。

`sound.py` 的乐器与混音代码从本工程早前的 `films/004_maya_part1/tools/mix.py` 重构而来——同一个作者、同一套音色，谱面外置成 `score.json`。

## 第三方

| 组件 | 用途 | 许可 |
|---|---|---|
| 本仓库 `styles/sky.js`（WebGL 天空合成） | 天空/日轮/水面/倒影/光线 | MIT（随仓库，工程内自带） |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) + CTranslate2 | 中文逐词转写（`small` int8 CPU） | MIT |
| [NumPy](https://numpy.org/) / [SciPy](https://scipy.org/) | 合成器、滤波、卷积混响 | BSD-3 |
| [soundfile](https://github.com/bastibe/python-soundfile)（libsndfile） | 读写 44.1 kHz float wav | BSD-3 / LGPL-2.1（libsndfile） |
| `vendor/runtime/style-frames.mjs` + puppeteer-core | 逐帧抓取 | MIT（本仓库自带） |
| [Node.js](https://nodejs.org/) | 抓帧器运行时 | MIT |
| ffmpeg / ffprobe | 混流、两遍 loudnorm、抽封面、探测 | LGPL / GPL（视构建） |

## 字体

| 字体 | 用途 | 许可 | 分发 |
|---|---|---|---|
| Noto Sans SC（可变权重） | 字幕 `SCBold` 46 px、标签 34 px | SIL OFL 1.1 | **不分发**：放 `assets/fonts/`，不入库 |
| Anton | 画面大字 `17′28″` 96 px | SIL OFL 1.1 | **不分发**：同上 |

字体只在本机使用：页面 `@font-face` 先试系统字体，再取 `assets/fonts/AlibabaPuHuiTi-3-85-Bold.ttf`，两条都没有才回退默认。

## 素材

**没有素材。** 这一支片子的每一帧都由代码绘制：天空渐变与云带、日轮与光晕、水面反射与碎金、涟漪与水珠、七个剪影与帽子、石碑与碑上的孔、石仓库（一笔 evenodd 外轮廓挖门洞）、阶梯金字塔、草棚、巨人的手与前臂、石件——全部是 2D canvas 路径与 `sky.js` 的着色器。
- 不用 AI 生图（用户长期口径，封面项目除外）。
- 不用照片、不用实拍素材片。
- 不加颗粒以外的后期。

## 旁白

旁白取自《玛雅巨人文明》口播稿对应原片的配音 `配音.wav`（296.274 s / 44.1 kHz 单声道）的 0–54.30 s，切尾淡出 0.22 s；为了 16:9 的 58.0 s 成片，结尾多留 3.7 s 给画面。音频不入库。

**原配音缺一句**：文稿第 1 段的「和现代科学测出来的只差十七分二十八秒」在配音里没有（RMS 能量检测 + 逐词转写双向证实）。处理：字幕严格跟音频，这句不进字幕；`17′28″` 只做画面字（Anton 96 px，4.55–6.76 s）。要这句进片，必须重录这一段。

## 片名与人物

片子不点名任何真人、机构或品牌；提及的考古学家与地名均为公开史料中的既有说法，画面里没有肖像、没有标志、没有地图边界。
