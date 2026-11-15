# dengju · 等轴 2.5D 样片管线

风格取自 `mg-styles-15` **#03-isometric**（MIT）：真正等轴正交相机、粉彩微缩场景、
瓦片波浪、建筑/墓室生长、平行滑轨运镜、漂浮岛拉远、标题铺在等轴平面上。
一条口播 = 一条 900 帧 / 30 秒片；字幕落在真实配音时码，音频收在 −14 LUFS / −1.5 dBTP。

首个实例：**013《羽人》前 30 秒样片**（`projects/yuren30/`），
成片交付到 `出稿/羽人/dengju 013_羽人_等距30秒样片.mp4`。

## 环境

- Node.js ≥18（three + puppeteer-core 走 `node_modules` 联接）
- **mg-styles-15 渲染引擎**（`vendor/mg-styles-15`，未随仓库提交，与 shouhui/xuni 共用）：先 `git clone --depth 1 https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15`，`npm install`，再建联接 `New-Item -ItemType Junction -Path 'dengju/node_modules' -Target 'vendor/mg-styles-15/node_modules'`
- Edge（`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`）
- Python ≥3.11（配乐/混音纯标准库，不需要 numpy）
- ffmpeg + ffprobe 在 PATH

## 快速开始

```bash
cd D:/@kaifa/Auto-Video

# 1. 建工程
python dengju/scripts/dengju.py new myfilm --title "标题" --episode 013 --src 出稿/013_xxx

# 2. 改 cues.json（字幕/节拍/音效）与 js/world.js（场景、文案、坐标）

# 3. 音频 + 静帧 + 整片 + 封装 + QA + 交付
python dengju/scripts/dengju.py all myfilm
```

分步：

```bash
python dengju/scripts/dengju.py audio myfilm
python dengju/scripts/dengju.py stills myfilm --times 0.5,3.6,9.9,20.0,25.8,29.5
python dengju/scripts/dengju.py render myfilm
python dengju/scripts/dengju.py sheet myfilm
python dengju/scripts/dengju.py mux myfilm
python dengju/scripts/dengju.py qa myfilm
python dengju/scripts/dengju.py publish myfilm
```

## 实例状态（013 羽人）

| 项 | 值 |
|---|---|
| 工程 | `projects/yuren30/` |
| 源 | `出稿/羽人/配音.wav` 0–30s |
| 字幕 | 26 条 / 0.00–30.00s |
| 渲染 | 900 帧 / 1920×1080 / 30fps / SPP 4 / 约 45 秒 |
| 音频 | −14.2 LUFS / −1.6 dBTP |
| 交付 | `出稿/羽人/dengju 013_羽人_等距30秒样片.mp4` |

完整说明见 `SKILL.md`。
