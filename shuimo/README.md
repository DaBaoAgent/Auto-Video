# shuimo · 纸本水墨山水样片管线

风格底座是 **kalpa-shan**：约 15KB（gzip ≈ 5KB）、零依赖的生成式 SVG 山水（fbm 脊线、飞白/皴笔、
点叶松、雾带、海天、冰原裂线）；动态层用 Canvas2D 画宣纸、墨渗、印章、竖排题记。
一条口播 = 一条 900 帧 / 30 秒片；字幕落在真实配音时码，音频收在 −14 LUFS / −1.5 dBTP。

首个实例：**013《羽人》前 30 秒样片**（`projects/yuren30/`），
成片交付到 `出稿/羽人/shuimo 013_羽人_水墨30秒样片.mp4`。

## 环境

| 依赖 | 说明 |
|---|---|
| Python 3.11+ | 编排与配乐（纯标准库，无 numpy/scipy 依赖） |
| ffmpeg / ffprobe | PATH 中可用；本机在 `D:/GPT-SoVITS/tools/ffmpeg/` |
| Node.js 18+ | 渲染器与 puppeteer-core；`shuimo/node_modules` 已指向 `vendor/mg-styles-15/node_modules` |
| Edge | 无头渲染；路径见 `pipeline.json` 的 `render.edge`，可用 `SJ_EDGE` 覆盖 |
| 字体 | `projects/yuren30/assets/font/`（LongCang / KaiTi） |

`vendor/mg-styles-15` 是外部渲染引擎（未随仓库提交，与 shouhui 等管线共用），首次运行先安装：

```powershell
git clone --depth 1 https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15
Set-Location vendor/mg-styles-15
npm install
Set-Location ../..
```

`shuimo/node_modules` 是目录联接（Windows junction，只用到 puppeteer-core），如果丢失：

```powershell
New-Item -ItemType Junction -Path 'D:\@kaifa\Auto-Video\shuimo\node_modules' `
  -Target 'D:\@kaifa\Auto-Video\vendor\mg-styles-15\node_modules'
```

## 快速开始

```bash
cd D:/@kaifa/Auto-Video

# 1. 建工程
python shuimo/scripts/shuimo.py new myfilm --title "标题" --episode 013 --src 出稿/羽人

# 2. 改 cues.json（字幕/节拍/音效）与 js/scene.js（场景、文案、坐标）

# 3. 音频 + 静帧 + 整片 + 封装 + QA + 交付
python shuimo/scripts/shuimo.py all myfilm
```

分步：

```bash
python shuimo/scripts/shuimo.py audio myfilm
python shuimo/scripts/shuimo.py stills myfilm --times 0.6,3.0,5.4,10.8,20.5,29.2
python shuimo/scripts/shuimo.py render myfilm
python shuimo/scripts/shuimo.py sheet myfilm
python shuimo/scripts/shuimo.py mux myfilm
python shuimo/scripts/shuimo.py qa myfilm
python shuimo/scripts/shuimo.py publish myfilm
```

## 实例状态（013 羽人）

| 项 | 值 |
|---|---|
| 工程 | `projects/yuren30/` |
| 源 | `出稿/羽人/配音.wav` 0–30s |
| 字幕 | 26 条 / 0.00–30.00s（沿用 huixingzhen 从句时码） |
| 渲染 | 900 帧 / 1920×1080 / 30fps / JPEG 94 / 约 46 秒 |
| 音频 | −14.30 LUFS / −1.60 dBTP |
| 交付 | `出稿/羽人/shuimo 013_羽人_水墨30秒样片.mp4` |

完整说明见 `SKILL.md`；风格来源与许可见 `CREDITS.md`。
