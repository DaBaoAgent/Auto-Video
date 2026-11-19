# ditu 管线迁移说明

## 来源

- 仓库：`公开样片库/开源风格库`
- 版本：`3a7132b`（运行时与渲染器基线；`films/` 属本地工作区，未随该库提交）
- 原路径：`films/guanyu-fancheng/`
- 当前路径：`ditu/projects/038_guanyu_fancheng/`

## 迁移内容

```text
ditu/
├── README.md
├── SKILL.md
├── pipeline.json          新增：把定版参数从代码里抽出来
├── CREDITS.md             新增：数据与字体许可
├── scripts/
│   ├── ditu.py            新增：编排 CLI（new/stills/render/mux/qa/probe）
│   └── render.mjs         新写：playwright-core 逐帧 + ffmpeg，替掉外部引擎的 core/render
└── projects/
    └── 038_guanyu_fancheng/
        ├── index.html     原样迁入，仅改三处 import 路径
        ├── post.js        原样迁入，importmap 已覆盖，无需改
        ├── FACTS.md       原样迁入
        ├── CREDITS        原样迁入
        ├── lib/           新增：three.module.js + core/lib.js + addons（随工程走）
        ├── tools/         fetch_gf.py / prep_river.py / bake.py / fonts_gf.py 原样迁入
        ├── assets/        albedo / height.bin / water / shadow / meta / wide_*（8 MB，入库）
        ├── fonts/         Barlow ×3 + NotoSansSC ×2 子集（入库）
        └── voice/cues.json 14 条字幕切点（voice.wav 属仓库外素材）
```

## 与原工程的差异

| 原工程（开源风格库） | 本管线 |
|---|---|
| `importmap` 指向 `/node_modules/three/…` | 指向 `./lib/three.module.js` 与 `./lib/addons/`，**不需要 npm install three** |
| `import … from '/core/lib.js'` | `./lib/lib.js`，随工程走 |
| 渲染用 `core/render/video.mjs + mux.sh`（多 worker、锁、段目录、loudnorm 两遍） | 单文件 `scripts/render.mjs` + Python 编排；参数化程度降低，可移植性提高 |
| 项目在 `films/` 下，从库根跑 | 工程在 `projects/` 下，从 Auto-Video 根跑 |
| 配音与成片都在工程内 | 只留 `cues.json`；`voice.wav` 与 `out/*.mp4` 按本仓库规则不入库 |

## 外部依赖

```powershell
npm i -g playwright-core
npx playwright-core install chromium-headless-shell
```

渲染器不需要 `node_modules`：会从工程目录逐级向上找，找不到再用同机 开源风格库 的，
或用 `$PLAYWRIGHT_CORE` 指定。ffmpeg / ffprobe 需在 PATH 上（实测 ffmpeg 7.x）。

## 运行环境

- Node ≥ 20
- Python ≥ 3.10（编排脚本只用标准库）
- ffmpeg 7+ / ffprobe
- 真 GPU（WebGL）；虚拟机用 `LEMO_ANGLE=swiftshader`

重建资产需要外网（AWS Terrain Tiles + EOX WMTS）。

## 许可变化

原工程把许可写在工程根的 `CREDITS`，本管线另加 `CREDITS.md` 汇总；
底图仍是 Sentinel-2 cloudless（CC BY 4.0），片尾署名不许删。
