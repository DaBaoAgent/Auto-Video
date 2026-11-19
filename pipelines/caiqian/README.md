# caiqian · 彩铅科普插画

一支科学短片，被画成**一页正在被填满的彩铅插图纸**：三维场景先进 three.js，再拆成四张 G-buffer，
后处理按每个表面的"露出时间"一层层排线、上色、抖轮廓，纸齿与颜料阈值合成。

首个实例：`projects/029_jia_xueyu/`（029 · 假鳕鱼，27.1 s / 1920×1080 / 24 fps / −14.7 LUFS）。

## 结构

```
caiqian/
├── SKILL.md              完整工序、画面语法、已知坑、验收
├── README.md             本文件
├── MIGRATION.md          从 开源风格库 迁入的来源与改造点
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         定版参数
├── scripts/
│   ├── caiqian.py        编排 CLI（new/stills/render/mux/srt/qa/probe）
│   └── render.mjs        逐帧渲染器（playwright-core + ffmpeg；与 ditu / pingban 共用同一份）
└── projects/029_jia_xueyu/
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑 `render.mjs` |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、测量响度、质检 |
| Python | 3.11+ | 跑 `caiqian.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器会依次找 `$PLAYWRIGHT_CORE`、工程目录向上的 `node_modules`、`$LEMO_OPUSCAR_HOME`、`~/开源风格库`、`%APPDATA%/npm` |
| chromium-headless-shell | — | `node node_modules/playwright-core/cli.js install chromium-headless-shell` |

**不需要 npm install three**：`projects/*/lib/three.module.js` 随工程走，importmap 指向本地文件。

## 跑一条

```bash
# 1 先看节拍（改一处文案，先抽 2 帧确认画面对上了）
python caiqian/scripts/caiqian.py stills 029 --times 2.0,13.0,20.5

# 2 无声母版（650 帧，单 worker 约 1–2 分钟）
python caiqian/scripts/caiqian.py render 029

# 3 配音放 voice/voice.wav，预母带 + 合流
python caiqian/scripts/caiqian.py mux 029

# 4 字幕与质检
python caiqian/scripts/caiqian.py srt 029
python caiqian/scripts/caiqian.py qa 029
```

`probe` 一眼看工程状态（缺哪个文件、片长多少帧、字幕几条）：

```bash
python caiqian/scripts/caiqian.py probe 029
```

## 新建一条片子

```bash
python caiqian/scripts/caiqian.py new 030_xxx
```

复制骨架后改三处：`main.js` 的 `TL`（逐句起音）、`SUBS0`（中英字幕）、`REV`（各层露出时间），
然后重跑字体子集与字形骨架：

```bash
python projects/030_xxx/tools/make_font.py     # fonts/ 子集
python projects/030_xxx/tools/skeleton.py      # glyphs.json
```

## 数据来源

| 东西 | 出处 |
|---|---|
| 三维世界 | 全部由 `main.js` 代码生成，无外部模型或贴图 |
| 手写字形 | `glyphs.json`，由 `tools/skeleton.py` 从字体轮廓生成 |
| 字体 | LXGW WenKai v1.245.1（OFL 1.1），`tools/make_font.py` 子集化 |
| 百科数字 | 见 `projects/*/FACTS.md` |

## 许可

- 字体：SIL Open Font License 1.1（霞鹜文楷，基于 Klee One）
- three.js：MIT
- 本管线代码：随 Auto-Video 仓库
