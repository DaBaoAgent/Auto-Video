# ditu —— 立体地图解说管线

把「真实卫星地形 + 三维水面 + 贴地标注」封成一条链：口播稿 + 成品配音进，
1920×1080 / 24 fps / −14 LUFS 的地图解说成片出。

## 结构

```
ditu/
├── SKILL.md                管线入口：原则、工序、画面语法、坑、验收
├── pipeline.json           定版参数（地形/相机/色板/渲染/音频）
├── scripts/ditu.py         编排 CLI：new / stills / render / mux / qa / probe
├── scripts/render.mjs      逐帧渲染器（playwright-core + ffmpeg）
└── projects/038_guanyu_fancheng/
    ├── index.html          画面全部逻辑（three.js）
    ├── post.js             bloom / GTAO / DOF / vignette
    ├── lib/                three.module.js + lib.js + addons/postprocessing、shaders、math（随工程走，免 npm）
    ├── tools/              数据管线与字体子集脚本
    ├── assets/             albedo / height.bin / water / shadow / meta / wide_*（8 MB，已入库）
    ├── fonts/              Barlow + Noto Sans SC 子集（OFL）
    └── voice/cues.json     14 条字幕切点
```

## 环境

| 依赖 | 说明 |
|---|---|
| Node ≥ 20 | 渲染器只用 `playwright-core`，不需要 npm install 到本项目 |
| playwright-core | 自动从工程目录逐级向上找 `node_modules`，找不到再看同机的 开源风格库；也可用 `$PLAYWRIGHT_CORE` 指定 |
| chromium-headless-shell | playwright 自带；`npx playwright-core install chromium-headless-shell` 装一次 |
| ffmpeg / ffprobe | 截帧、编码、混音、质检 |
| Python ≥ 3.10 | 编排 CLI（只用标准库） |
| GPU | 真 WebGL 才快；虚拟机里 `$env:LEMO_ANGLE="swiftshader"` 可跑通但慢 6× |

```powershell
npm i -g playwright-core        # 或任一份 开源风格库 里的即可
npx playwright-core install chromium-headless-shell
```

## 跑一条

```bash
python ditu/scripts/ditu.py probe   038_guanyu_fancheng
python ditu/scripts/ditu.py stills  038_guanyu_fancheng --times 3.0,18.6,24.0,31.8
python ditu/scripts/ditu.py render  038_guanyu_fancheng
python ditu/scripts/ditu.py mux     038_guanyu_fancheng
python ditu/scripts/ditu.py qa      038_guanyu_fancheng
```

## 数据从哪来

| 层 | 来源 | 许可 |
|---|---|---|
| 高程 `height.bin` | AWS Terrain Tiles `terrarium/{z}/{x}/{y}.png` | public |
| 卫星底图 `albedo.jpg` | EOX Sentinel-2 cloudless 2016（3857） | CC BY 4.0，片尾署名 |
| 河道控制点 | `tools/prep_river.py` 手修 11 点 | 本仓库 |
| 字体 | Barlow、Noto Sans SC | SIL OFL 1.1 |

重烘资产（网络正常时 2–4 分钟）：

```bash
python projects/038_guanyu_fancheng/tools/fetch_gf.py
python projects/038_guanyu_fancheng/tools/prep_river.py
python projects/038_guanyu_fancheng/tools/bake.py
python projects/038_guanyu_fancheng/tools/fonts_gf.py
```

`assets/` 已随仓库提交，**不重烘也能直接出片**；只有换一片地区才需要跑上面四步。

## 配音

示例工程的 `voice/` 只提交 `cues.json`（字幕切点），`voice.wav` 属于仓库外素材。
自己出片时把配音放到 `voice/voice.wav`，`mux` 会自动做预母带（`acompressor` + `loudnorm`）再合流。

## 许可

- 引擎 three.js：MIT。
- 底图 Sentinel-2 cloudless：CC BY 4.0（片尾已署名）。
- 高程 AWS Terrain Tiles：public domain。
- 字体：SIL OFL 1.1。
- 本管线脚本与工程：与本项目一致。
