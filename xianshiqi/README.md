# xianshiqi —— 赛博朋克 HUD / FUI 样片管线

风格取自 `mg-styles-15` 的 **#22 赛博朋克 HUD / FUI**（MIT）。
一条口播进，30 秒 HUD 前线出：深青黑底、青色霓虹线框、雷达扫掠、目标锁定、
数据流小字、Three.js 线框全息体、辉光与扫描线。

- 首个实例：`projects/UAP30/`（UAP 前 30 秒样片，配音取自 `出稿/UAP/配音.wav`）
- 完整说明：`SKILL.md`
- 定版参数：`pipeline.json`

## 快速开始

```bash
cd D:/@kaifa/Auto-Video

python xianshiqi/scripts/xianshiqi.py new myfilm --title "标题" --episode EP.011 --src 出稿/011_xxx
#   改 projects/myfilm/cues.json（captions/scenes/sfx）与 index.html（面板文案）
python xianshiqi/scripts/xianshiqi.py audio  myfilm
python xianshiqi/scripts/xianshiqi.py stills myfilm --times 0.3,2.6,13.1,27.6
python xianshiqi/scripts/xianshiqi.py render myfilm
python xianshiqi/scripts/xianshiqi.py mux    myfilm
python xianshiqi/scripts/xianshiqi.py qa     myfilm
python xianshiqi/scripts/xianshiqi.py publish myfilm
```

## 页面协议

`index.html` 读同目录 `cues.json`，暴露：
- `window.DEMO` — 宽高、帧率、时长、motionBlur
- `window.renderAt(t)` — 把时间 t 的整帧画进 canvas
- `window.__ready` — 首帧画完后置 true，渲染器等它

## 环境

- Node.js ≥18（three + puppeteer-core 走 `node_modules` 联接）
- **mg-styles-15 渲染引擎**（`vendor/mg-styles-15`，未随仓库提交，与 shouhui/xuni 共用）：先 `git clone --depth 1 https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15`，`npm install`，再建联接 `New-Item -ItemType Junction -Path 'xianshiqi/node_modules' -Target 'vendor/mg-styles-15/node_modules'`
- Edge（`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`）
- Python ≥3.11（配乐/混音纯标准库，不需要 numpy）
- ffmpeg + ffprobe 在 PATH
