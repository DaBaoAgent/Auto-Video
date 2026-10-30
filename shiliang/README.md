# shiliang · 扁平矢量 / 2D MG 管线

风格：`mg-styles-15` #01 Flat / Vector（MIT）。
首个实例：`projects/010_shengming30/` —— 010《生命 3.0》前 30 秒样片。

## 环境

| 依赖 | 说明 |
|---|---|
| Python 3.11+ | 只用标准库（音频合成不依赖 numpy/scipy/soundfile） |
| ffmpeg / ffprobe | PATH 中可用；本机在 `D:/@kaifa/tools/ffmpeg/bin/` |
| Node.js 18+ | 渲染器；`shiliang/node_modules` 已指向 `vendor/mg-styles-15/node_modules` |
| Edge | 无头渲染；路径见 `pipeline.json` 的 `render.edge`，可用 `SHILIANG_EDGE` 覆盖 |
| 字体 | `projects/<slug>/assets/font/AlibabaPuHuiTi-3-85-Bold.ttf`（免费商用） |

$(endor/mg-styles-15) 是外部渲染引擎（未随仓库提交，与 shouhui 管线共用），首次运行先安装：

```powershell
git clone --depth 1 https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15
Set-Location vendor/mg-styles-15
npm install
Set-Location ../..
```

`shiliang/node_modules` 是目录联接（Windows junction），如果丢失：

```powershell
New-Item -ItemType Junction -Path 'D:\@kaifa\Auto-Video\shiliang\node_modules' `
  -Target 'D:\@kaifa\Auto-Video\vendor\mg-styles-15\node_modules'
```

## 快速开始

```bash
cd D:/@kaifa/Auto-Video
python shiliang/scripts/shiliang.py probe 010_shengming30
python shiliang/scripts/shiliang.py stills 010_shengming30 --times 0.35,6.8,12.8,18.3,27.6,29.5
python shiliang/scripts/shiliang.py audio  010_shengming30
python shiliang/scripts/shiliang.py render 010_shengming30
python shiliang/scripts/shiliang.py sheet  010_shengming30
python shiliang/scripts/shiliang.py mux    010_shengming30
python shiliang/scripts/shiliang.py qa     010_shengming30
python shiliang/scripts/shiliang.py publish 010_shengming30
```

## 文件协议

页面必须定义：

```js
window.DEMO = { width: 1920, height: 1080, fps: 30, duration: 30 };
window.renderAt = async (t) => { /* 画 t 时刻的一帧 */ };
window.__ready = true; // 字体与首帧就绪后
```

渲染器按 `t = frame / fps` 逐帧截屏；页面里所有动画必须是 `t` 的纯函数。

## 目录速查

- `SKILL.md` —— 完整流程、画面分层、时间语法、已知坑
- `pipeline.json` —— 定版参数
- `scripts/shiliang.py` —— 编排 CLI
- `scripts/make_score.py` —— 120 BPM MG-pop 配乐 + SFX
- `scripts/mix_audio.py` —— 人声/配乐混音
- `scripts/render_frames.mjs` —— Edge 逐帧渲染
- `projects/010_shengming30/` —— 010 样片工程
