# pingban —— 平板速写讲解管线

把「一张纸、一支笔、六格手卷」封成一条链：口播稿 + 成品配音进，
笔一笔现场画出来、镜头跟着笔尖走、字幕像手写揭开的 1920×1080 / 24 fps / −14 LUFS 成片出。

## 结构

```
pingban/
├── SKILL.md                管线入口：原则、引擎 API、六格布局、坑、验收
├── pipeline.json           定版参数（纸域/色板/笔触/相机/字幕/音频）
├── scripts/pingban.py      编排 CLI：new / stills / render / mux / qa / probe
├── scripts/render.mjs      逐帧渲染器（playwright-core + ffmpeg）
└── projects/038_guanyu_sketch/
    ├── index.html          画面全部逻辑（自包含 2D canvas 手写引擎，零外部依赖）
    ├── fonts/              Caveat + Long Cang + Noto Serif SC 子集（OFL，全部已入库）
    └── voice/cues.json     14 条中英双行字幕切点
```

## 环境

| 依赖 | 说明 |
|---|---|
| Node ≥ 20 | 渲染器只用 `playwright-core`，工程本身不 import 任何库 |
| playwright-core | 自动从工程目录逐级向上找 `node_modules`，找不到再看同机的 lemo-opuscar；也可用 `$PLAYWRIGHT_CORE` 指定 |
| chromium-headless-shell | playwright 自带；`npx playwright-core install chromium-headless-shell` 装一次 |
| ffmpeg / ffprobe | 截帧、编码、混音、质检 |
| Python ≥ 3.10 | 编排 CLI（只用标准库） |
| GPU | 不需要：2D canvas，纯 CPU 也跑 13–16 fps |

## 跑一条

```bash
python pingban/scripts/pingban.py probe   038_guanyu_sketch
python pingban/scripts/pingban.py stills  038_guanyu_sketch --times 3.4,6.6,15.0,34.6
python pingban/scripts/pingban.py render  038_guanyu_sketch
python pingban/scripts/pingban.py mux     038_guanyu_sketch
python pingban/scripts/pingban.py qa      038_guanyu_sketch
```

## 为什么不用 glyphs.json

早期版本（lemo-opuscar 的 029 骨架）把字做成手写字形骨架动画，缺字画不出来、子集外全是空白。
本管线改成 **canvas `fillText` + 逐字裁剪扫出**：任何 GB2312 范围内的字都能写，只要字体子集覆盖；
出笔节奏由 `TXT()` 返回的 `t0+d` 时间戳驱动，和线条共用同一条笔画队列。

## 配音

示例工程的 `voice/` 只提交 `cues.json`（字幕切点），`voice.wav` 属于仓库外素材。
自己出片时把配音放到 `voice/voice.wav`，`mux` 会自动做预母带（`acompressor` + `loudnorm`）再合流。

## 许可

- 字体：Caveat、Long Cang、Noto Serif SC，均 SIL OFL 1.1。
- 引擎与工程代码：与本项目一致（MIT）。
