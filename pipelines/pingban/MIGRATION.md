# pingban 管线迁移说明

## 来源

- 仓库：`公开样片库/开源风格库`
- 版本：`3a7132b`（运行时与渲染器基线；`films/` 属本地工作区，未随该库提交）
- 原路径：`films/guanyu-sketch/`
- 当前路径：`pingban/projects/038_guanyu_sketch/`

## 迁移内容

```text
pingban/
├── README.md
├── SKILL.md
├── pipeline.json          新增：纸域/色板/笔触/相机/字幕参数定版
├── CREDITS.md             新增：字体许可
├── scripts/
│   ├── pingban.py         新增：编排 CLI（new/stills/render/mux/qa/probe）
│   └── render.mjs         新写：playwright-core 逐帧 + ffmpeg，替掉外部引擎的 core/render
└── projects/
    └── 038_guanyu_sketch/
        ├── index.html     原样迁入（自包含，零外部依赖）
        ├── fonts/         Caveat ×2 + LongCang + NotoSerifSC ×2 子集（入库，0.6 MB）
        └── voice/cues.json 14 条中英双行字幕切点（voice.wav 属仓库外素材）
```

## 与本源的差异

| 原工程（开源风格库） | 本管线 |
|---|---|
| 渲染用 `core/render/video.mjs`（多 worker + 锁 + 段拼接） | 单文件 `scripts/render.mjs`（顺序渲染，13–16 fps） |
| 项目在 `films/` 下，从库根跑 | 工程在 `projects/` 下，从 Auto-Video 根跑 |
| 配音与成片都在工程内 | 只留 `cues.json`；`voice.wav` 与 `out/*.mp4` 按本仓库规则不入库 |

引擎本身零改动：`index.html` 一个文件就是全部画面逻辑，没有 import、没有 npm 依赖。

## 外部依赖

```powershell
npm i -g playwright-core
npx playwright-core install chromium-headless-shell
```

ffmpeg / ffprobe 需在 PATH 上。不需要 GPU。

## 运行环境

- Node ≥ 20
- Python ≥ 3.10（编排脚本只用标准库）
- ffmpeg 7+ / ffprobe

## 许可

字体均为 SIL OFL 1.1；引擎与代码归本项目。
原工程 `029 骨架字形` 的 `glyphs.json` 方案**没有迁入**（缺字画不出），已改为 canvas `fillText` + 逐字裁剪扫出。
